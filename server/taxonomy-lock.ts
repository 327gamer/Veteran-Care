/**
 * Taxonomy Lock — Step 1 of Canonical Taxonomy Hardening
 *
 * Single boot-time assertion that verifies the live category catalogs on both
 * sides (Supabase `categories`, Postgres `trusted_service_categories`) match
 * shared/canonical-categories.ts.
 *
 * Read-only against the DB. Never deletes, never renames. The boot
 * synchronizers (alignCategoryNames, ensureAllTrustedServiceCategories)
 * already perform the writes; this module just verifies the result.
 *
 * Failure mode:
 *  - Default: log structured drift report; do NOT abort boot.
 *  - TAXONOMY_LOCK_STRICT=true: throw on drift (boot abort).
 *  - When TAXONOMY_LOCK_STRICT is unset: strict in dev/staging
 *    (NODE_ENV !== "production"), permissive in production.
 *
 * The most recent report is cached in-memory and exposed via
 * /api/admin/taxonomy-status.
 */

import {
  CANONICAL_PAIRS,
  LEGACY_TRUSTED_SLUGS,
  auditCoverage,
  getResourceRenames,
  getTrustedRegistry,
} from "../shared/canonical-categories";
import { supabaseAdmin } from "./supabase";
import { query as pgQuery } from "./pg-client";

export type NameMismatch = {
  side: "resources" | "trusted";
  slug: string;
  expected: string;
  actual: string;
};

export type TaxonomyLockReport = {
  locked: boolean;
  checkedAt: string;
  strict: boolean;
  pairedCount: number;
  resourceCatalog: { rowCount: number; slugs: string[] };
  trustedCatalog: { rowCount: number; slugs: string[] };
  unknownInResources: string[];
  unknownInTrusted: string[];
  legacyTrustedPresent: string[]; // known-legacy slugs in DB (acknowledged, not drift)
  brokenMappings: { from: string; to: string; side: "legacy" | "canonical" }[];
  nameMismatches: NameMismatch[];
  missingFromResources: string[]; // canonical resourceSlugs not present in DB
  missingFromTrusted: string[];   // canonical trustedSlugs not present in DB
  error?: string;
};

let lastReport: TaxonomyLockReport | null = null;

export function getLastLockReport(): TaxonomyLockReport | null {
  return lastReport;
}

function isStrictMode(): boolean {
  const flag = (process.env.TAXONOMY_LOCK_STRICT || "").toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;
  // Default: strict in non-production environments only.
  return (process.env.NODE_ENV || "development") !== "production";
}

export async function assertTaxonomyLock(): Promise<TaxonomyLockReport> {
  const strict = isStrictMode();
  const checkedAt = new Date().toISOString();

  let dbResourceRows: Array<{ slug: string; name: string }> = [];
  let dbTrustedRows: Array<{ slug: string; name: string }> = [];
  let fetchError: string | undefined;

  try {
    const { data: rRows, error: rErr } = await supabaseAdmin
      .from("categories")
      .select("slug, name");
    if (rErr) throw new Error(`supabase categories: ${rErr.message}`);
    dbResourceRows = (rRows || []) as any[];

    const tRows = await pgQuery(
      `SELECT slug, name FROM trusted_service_categories`
    );
    dbTrustedRows = (tRows || []) as any[];
  } catch (err: any) {
    fetchError = err?.message || String(err);
  }

  const dbResourceSlugs = dbResourceRows.map((r) => r.slug).sort();
  const dbTrustedSlugs = dbTrustedRows.map((r) => r.slug).sort();

  const audit = auditCoverage(dbResourceSlugs, dbTrustedSlugs);

  // Trusted-only canonical entries are intentional — strip them from the
  // "unknownInTrusted" warning. Also strip known-legacy slugs that the
  // platform intentionally retains (per the no-deletion guardrail) but no
  // longer treats as part of the active taxonomy.
  const knownTrusted = new Set(
    CANONICAL_PAIRS.map((p) => p.trustedSlug).filter((s): s is string => !!s),
  );
  const unknownInTrusted = audit.unknownInTrusted.filter(
    (s) => !knownTrusted.has(s) && !LEGACY_TRUSTED_SLUGS.has(s),
  );
  const legacyTrustedPresent = audit.unknownInTrusted.filter((s) =>
    LEGACY_TRUSTED_SLUGS.has(s),
  );

  // Detect missing canonical rows (declared in canonical, absent from DB).
  const dbResourceSet = new Set(dbResourceSlugs);
  const dbTrustedSet = new Set(dbTrustedSlugs);
  const missingFromResources: string[] = [];
  const missingFromTrusted: string[] = [];
  for (const p of CANONICAL_PAIRS) {
    if (p.resourceSlug && !dbResourceSet.has(p.resourceSlug)) {
      missingFromResources.push(p.resourceSlug);
    }
    if (p.trustedSlug && !dbTrustedSet.has(p.trustedSlug)) {
      missingFromTrusted.push(p.trustedSlug);
    }
  }

  // Detect name mismatches (slug exists, but the live name diverges from canonical).
  const renames = getResourceRenames();
  const trustedExpected = new Map(
    getTrustedRegistry().map((e) => [e.slug, e.meta.name]),
  );
  const nameMismatches: NameMismatch[] = [];
  for (const r of dbResourceRows) {
    const expected = renames[r.slug];
    if (expected && r.name !== expected) {
      nameMismatches.push({
        side: "resources",
        slug: r.slug,
        expected,
        actual: r.name,
      });
    }
  }
  for (const r of dbTrustedRows) {
    const expected = trustedExpected.get(r.slug);
    if (expected && r.name !== expected) {
      nameMismatches.push({
        side: "trusted",
        slug: r.slug,
        expected,
        actual: r.name,
      });
    }
  }

  const drift =
    !!fetchError ||
    audit.brokenMappings.length > 0 ||
    audit.unknownInResources.length > 0 ||
    unknownInTrusted.length > 0 ||
    nameMismatches.length > 0 ||
    missingFromResources.length > 0 ||
    missingFromTrusted.length > 0;

  const report: TaxonomyLockReport = {
    locked: !drift,
    checkedAt,
    strict,
    pairedCount: audit.pairedCount,
    resourceCatalog: { rowCount: dbResourceRows.length, slugs: dbResourceSlugs },
    trustedCatalog: { rowCount: dbTrustedRows.length, slugs: dbTrustedSlugs },
    unknownInResources: audit.unknownInResources,
    unknownInTrusted,
    legacyTrustedPresent,
    brokenMappings: audit.brokenMappings,
    nameMismatches,
    missingFromResources,
    missingFromTrusted,
    error: fetchError,
  };

  lastReport = report;

  // Structured single-line summary for log scraping.
  const summary =
    `[TAXONOMY-LOCK] status=${report.locked ? "LOCKED" : "DRIFT"} ` +
    `strict=${strict} paired=${report.pairedCount} ` +
    `resources=${dbResourceRows.length} trusted=${dbTrustedRows.length} ` +
    `unknownInResources=${audit.unknownInResources.length} ` +
    `unknownInTrusted=${unknownInTrusted.length} ` +
    `legacyTrusted=${legacyTrustedPresent.length} ` +
    `brokenMappings=${audit.brokenMappings.length} ` +
    `nameMismatches=${nameMismatches.length} ` +
    `missingFromResources=${missingFromResources.length} ` +
    `missingFromTrusted=${missingFromTrusted.length}` +
    (fetchError ? ` error="${fetchError}"` : "");

  if (report.locked) {
    console.log(summary);
  } else {
    console.warn(summary);
    if (audit.unknownInResources.length)
      console.warn(`[TAXONOMY-LOCK] unknownInResources: ${audit.unknownInResources.join(", ")}`);
    if (unknownInTrusted.length)
      console.warn(`[TAXONOMY-LOCK] unknownInTrusted: ${unknownInTrusted.join(", ")}`);
    if (missingFromResources.length)
      console.warn(`[TAXONOMY-LOCK] missingFromResources: ${missingFromResources.join(", ")}`);
    if (missingFromTrusted.length)
      console.warn(`[TAXONOMY-LOCK] missingFromTrusted: ${missingFromTrusted.join(", ")}`);
    for (const nm of nameMismatches) {
      console.warn(
        `[TAXONOMY-LOCK] name-mismatch ${nm.side}/${nm.slug}: expected="${nm.expected}" actual="${nm.actual}"`,
      );
    }
    for (const bm of audit.brokenMappings) {
      console.warn(`[TAXONOMY-LOCK] broken-mapping ${bm.side} ${bm.from} → ${bm.to}`);
    }

    if (strict) {
      const msg = `[TAXONOMY-LOCK] STRICT mode: drift detected — aborting boot. Inspect /api/admin/taxonomy-status.`;
      console.error(msg);
      throw new Error(msg);
    }
  }

  return report;
}
