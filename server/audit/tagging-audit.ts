/**
 * Step 2 — Provider/Resource Tagging Audit
 * ----------------------------------------
 * Read-only audit of resource tagging across:
 *   - resources                       (primary category_id)
 *   - resource_categories (m2m)       (category placements)
 *   - resource_subcategories (m2m)    (subcategory placements)
 *
 * Detection rules (priority order):
 *   R1 — Orphan subcategory:    resource has subcategory whose parent
 *                               category is NOT in resource_categories
 *   R2 — Primary mismatch:      resources.category_id is not present in
 *                               resource_categories for that resource
 *   R3 — Keyword mismatch:      no keyword whitelist hit AND not an
 *                               intentional mirror → SUSPECT only
 *   R4 — Geographic outliers:   state is null/empty
 *   R5 — Duplicate-title cluster: title appears in 4+ categories
 *
 * Conservative bias (per user guardrail):
 *   - WRONG bucket = R1 + R2 only (structural bugs).
 *   - R3 keyword mismatches go to SUSPECT, never WRONG. Manual signoff
 *     required before any removal.
 *   - Unknown / unscored placements default to CLEAN, not WRONG.
 *
 * READ-ONLY. No DB writes. No side effects.
 */

import { supabaseAdmin } from "../supabase";
import { isIntentionalMirror } from "../../shared/canonical-categories";
import {
  matchesCategoryKeywords,
  hasKeywords,
} from "./category-keywords";

export type EdgeBucket = "wrong" | "suspect" | "mirror" | "clean";

export type CategoryEdge = {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  bucket: EdgeBucket;
  rules: string[]; // R1, R2, R3, etc.
  notes?: string;
};

export type SubcategoryEdge = {
  subcategoryId: string;
  subcategorySlug: string;
  subcategoryName: string;
  parentCategoryId: string;
  parentCategorySlug: string | null;
  bucket: EdgeBucket;
  rules: string[];
  notes?: string;
};

export type ResourceAuditRow = {
  resourceId: string;
  title: string;
  city: string | null;
  state: string | null;
  primaryCategoryId: string | null;
  primaryCategorySlug: string | null;
  categoryEdges: CategoryEdge[];
  subcategoryEdges: SubcategoryEdge[];
};

export type AuditAction =
  | { kind: "remove_from_category"; resourceId: string; title: string; categoryId: string; categorySlug: string; reason: string }
  | { kind: "remove_subcategory"; resourceId: string; title: string; subcategoryId: string; subcategorySlug: string; reason: string }
  | { kind: "set_primary_to"; resourceId: string; title: string; newCategoryId: string; newCategorySlug: string; reason: string };

export type TaggingAuditReport = {
  generatedAt: string;
  state: string;
  resourceCount: number;
  edgeCount: number;
  subcategoryEdgeCount: number;
  // Category-edge buckets (from resource_categories joins).
  buckets: {
    wrong: number;
    suspect: number;
    mirror: number;
    clean: number;
  };
  // Subcategory-edge buckets (from resource_subcategories joins).
  // Tracked separately so R1 orphan-subcategory wrongs are NOT hidden.
  subcategoryBuckets: {
    wrong: number;
    clean: number;
  };
  // Structural totals: combined wrong counts + R2 primary-mismatch
  // (which is per-resource, not per-edge, so it lives here).
  structural: {
    categoryWrong: number;       // = buckets.wrong (R0 unknown category id)
    subcategoryWrong: number;    // = subcategoryBuckets.wrong (R1 + R0 unknown sub id)
    primaryMismatch: number;     // = R2 count
    totalStructuralIssues: number;
  };
  rules: {
    R1_orphanSubcategory: number;
    R2_primaryMismatch: number;
    R3_keywordMismatch: number;
    R4_missingState: number;     // n/a when state filter is set; informational only
    R5_duplicateTitleCluster: number;
  };
  duplicateTitleClusters: Array<{ title: string; categories: string[] }>;
  rows: ResourceAuditRow[];
  // Preview-only: expanded into actions ready for the (future) apply step.
  previewActions: AuditAction[];
};

let lastReport: TaggingAuditReport | null = null;
export function getLastTaggingAudit(): TaggingAuditReport | null {
  return lastReport;
}

type RawResource = {
  id: string;
  title: string;
  short_description: string | null;
  website_url: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  category_id: string | null;
  status: string | null;
};

type RawCategory = { id: string; slug: string; name: string };
type RawSubcategory = { id: string; slug: string; name: string; category_id: string };

/**
 * Run the audit. SC-only by default.
 * Pure read. Caches the result in module memory and returns it.
 */
export async function runTaggingAudit(opts: { state?: string } = {}): Promise<TaggingAuditReport> {
  const state = (opts.state || "SC").toUpperCase();

  // ---- 1. Pull raw data ----
  const [catsRes, subsRes, resRes] = await Promise.all([
    supabaseAdmin.from("categories").select("id, slug, name"),
    supabaseAdmin.from("subcategories").select("id, slug, name, category_id"),
    supabaseAdmin
      .from("resources")
      .select("id, title, short_description, website_url, address, city, state, category_id, status")
      .eq("status", "approved")
      .eq("state", state),
  ]);

  // Hard-fail on source query errors so the report cannot silently mislead.
  if (catsRes.error) throw new Error(`tagging-audit: categories fetch failed: ${catsRes.error.message}`);
  if (subsRes.error) throw new Error(`tagging-audit: subcategories fetch failed: ${subsRes.error.message}`);
  if (resRes.error)  throw new Error(`tagging-audit: resources fetch failed: ${resRes.error.message}`);

  const cats = (catsRes.data || []) as RawCategory[];
  const subs = (subsRes.data || []) as RawSubcategory[];
  const resources = (resRes.data || []) as RawResource[];

  const catById = new Map(cats.map((c) => [c.id, c]));
  const subById = new Map(subs.map((s) => [s.id, s]));

  if (resources.length === 0) {
    const empty: TaggingAuditReport = {
      generatedAt: new Date().toISOString(),
      state,
      resourceCount: 0,
      edgeCount: 0,
      subcategoryEdgeCount: 0,
      buckets: { wrong: 0, suspect: 0, mirror: 0, clean: 0 },
      subcategoryBuckets: { wrong: 0, clean: 0 },
      structural: { categoryWrong: 0, subcategoryWrong: 0, primaryMismatch: 0, totalStructuralIssues: 0 },
      rules: { R1_orphanSubcategory: 0, R2_primaryMismatch: 0, R3_keywordMismatch: 0, R4_missingState: 0, R5_duplicateTitleCluster: 0 },
      duplicateTitleClusters: [],
      rows: [],
      previewActions: [],
    };
    lastReport = empty;
    return empty;
  }

  const resourceIds = resources.map((r) => r.id);

  // m2m edges scoped to the resource set we care about
  const [rcRes, rsRes] = await Promise.all([
    supabaseAdmin.from("resource_categories").select("resource_id, category_id").in("resource_id", resourceIds),
    supabaseAdmin.from("resource_subcategories").select("resource_id, subcategory_id").in("resource_id", resourceIds),
  ]);

  const rcRows = (rcRes.data || []) as Array<{ resource_id: string; category_id: string }>;
  const rsRows = (rsRes.data || []) as Array<{ resource_id: string; subcategory_id: string }>;

  const catsByResource = new Map<string, Set<string>>();
  for (const e of rcRows) {
    if (!catsByResource.has(e.resource_id)) catsByResource.set(e.resource_id, new Set());
    catsByResource.get(e.resource_id)!.add(e.category_id);
  }
  const subsByResource = new Map<string, Set<string>>();
  for (const e of rsRows) {
    if (!subsByResource.has(e.resource_id)) subsByResource.set(e.resource_id, new Set());
    subsByResource.get(e.resource_id)!.add(e.subcategory_id);
  }

  // ---- 2. R5 prep — duplicate-title clusters (any title with 4+ categories) ----
  const titleToCats = new Map<string, Set<string>>();
  for (const r of resources) {
    const cs = catsByResource.get(r.id);
    if (!cs) continue;
    if (!titleToCats.has(r.title)) titleToCats.set(r.title, new Set());
    for (const cid of Array.from(cs)) {
      const c = catById.get(cid);
      if (c) titleToCats.get(r.title)!.add(c.slug);
    }
  }
  const duplicateTitleClusters = Array.from(titleToCats.entries())
    .filter(([, set]) => set.size >= 4)
    .map(([title, set]) => ({ title, categories: Array.from(set).sort() }))
    .sort((a, b) => b.categories.length - a.categories.length);

  // ---- 3. Per-resource evaluation ----
  const rows: ResourceAuditRow[] = [];
  const previewActions: AuditAction[] = [];
  const counts = { wrong: 0, suspect: 0, mirror: 0, clean: 0 };
  const subCounts = { wrong: 0, clean: 0 };
  const ruleCounts = {
    R1_orphanSubcategory: 0,
    R2_primaryMismatch: 0,
    R3_keywordMismatch: 0,
    R4_missingState: 0,
    R5_duplicateTitleCluster: 0,
  };

  for (const r of resources) {
    const haystack = [r.title, r.short_description, r.website_url, r.address]
      .filter(Boolean)
      .join(" ");

    const myCats = catsByResource.get(r.id) || new Set<string>();
    const mySubs = subsByResource.get(r.id) || new Set<string>();
    const primaryCat = r.category_id ? catById.get(r.category_id) || null : null;

    // R4 — missing state (rare; we filter by state but include this defensively)
    if (!r.state || r.state.trim().length === 0) {
      ruleCounts.R4_missingState++;
    }

    // R5 — duplicate-title cluster membership
    const inDupCluster = duplicateTitleClusters.some((d) => d.title === r.title);
    if (inDupCluster) ruleCounts.R5_duplicateTitleCluster++;

    // ---- evaluate each category edge ----
    const categoryEdges: CategoryEdge[] = [];
    for (const cid of Array.from(myCats)) {
      const c = catById.get(cid);
      if (!c) {
        // unknown category id (orphan join); flag as WRONG structurally
        categoryEdges.push({
          categoryId: cid,
          categorySlug: "(unknown)",
          categoryName: "(unknown)",
          bucket: "wrong",
          rules: ["R0_orphanCategoryId"],
          notes: "category_id present in resource_categories but not in categories table",
        });
        counts.wrong++;
        previewActions.push({
          kind: "remove_from_category",
          resourceId: r.id,
          title: r.title,
          categoryId: cid,
          categorySlug: "(unknown)",
          reason: "Orphan category id (not in categories table)",
        });
        continue;
      }

      const rules: string[] = [];
      const isMirror = isIntentionalMirror(r.title, c.slug);

      // R3 — keyword mismatch (only if we have a keyword list for this slug)
      let keywordMissed = false;
      if (hasKeywords(c.slug)) {
        keywordMissed = !matchesCategoryKeywords(c.slug, haystack);
      }
      if (keywordMissed) rules.push("R3");
      if (inDupCluster) rules.push("R5");

      let bucket: EdgeBucket;
      let notes: string | undefined;
      if (isMirror) {
        bucket = "mirror";
        notes = "Listed in INTENTIONAL_MIRRORS registry";
      } else if (keywordMissed) {
        // CONSERVATIVE: keyword miss → SUSPECT, never WRONG.
        bucket = "suspect";
        ruleCounts.R3_keywordMismatch++;
        notes = `No category-keyword hit for slug=${c.slug}; needs manual review`;
      } else {
        bucket = "clean";
      }

      counts[bucket]++;
      categoryEdges.push({
        categoryId: c.id,
        categorySlug: c.slug,
        categoryName: c.name,
        bucket,
        rules,
        notes,
      });
    }

    // R2 — primary mismatch: resources.category_id not in resource_categories.
    // STRUCTURAL bug. Tracked as a wrong category-edge entry on this row so
    // it is visible in the row-level breakdown, AND as a `set_primary_to`
    // action when a fallback m2m edge exists.
    if (r.category_id && !myCats.has(r.category_id)) {
      ruleCounts.R2_primaryMismatch++;
      categoryEdges.push({
        categoryId: r.category_id,
        categorySlug: primaryCat?.slug || "(missing)",
        categoryName: primaryCat?.name || "(missing)",
        bucket: "wrong",
        rules: ["R2"],
        notes: "Primary category_id on resources row is not present in resource_categories (m2m). Row will not render under its declared primary category until corrected.",
      });
      counts.wrong++;
      const firstCid = Array.from(myCats)[0];
      if (firstCid) {
        const newCat = catById.get(firstCid);
        if (newCat) {
          previewActions.push({
            kind: "set_primary_to",
            resourceId: r.id,
            title: r.title,
            newCategoryId: newCat.id,
            newCategorySlug: newCat.slug,
            reason: `R2: primary category_id ${r.category_id} (${primaryCat?.slug || "unknown"}) not present in resource_categories`,
          });
        }
      }
    }

    // ---- evaluate each subcategory edge ----
    const subcategoryEdges: SubcategoryEdge[] = [];
    for (const sid of Array.from(mySubs)) {
      const s = subById.get(sid);
      if (!s) {
        subcategoryEdges.push({
          subcategoryId: sid,
          subcategorySlug: "(unknown)",
          subcategoryName: "(unknown)",
          parentCategoryId: "(unknown)",
          parentCategorySlug: null,
          bucket: "wrong",
          rules: ["R0_orphanSubcategoryId"],
          notes: "subcategory_id present in resource_subcategories but not in subcategories table",
        });
        subCounts.wrong++;
        previewActions.push({
          kind: "remove_subcategory",
          resourceId: r.id,
          title: r.title,
          subcategoryId: sid,
          subcategorySlug: "(unknown)",
          reason: "Orphan subcategory id (not in subcategories table)",
        });
        continue;
      }
      const parent = catById.get(s.category_id) || null;
      const parentInResource = myCats.has(s.category_id);

      if (!parentInResource) {
        // R1 — orphan subcategory. STRUCTURAL bug → WRONG.
        ruleCounts.R1_orphanSubcategory++;
        subCounts.wrong++;
        subcategoryEdges.push({
          subcategoryId: s.id,
          subcategorySlug: s.slug,
          subcategoryName: s.name,
          parentCategoryId: s.category_id,
          parentCategorySlug: parent?.slug || null,
          bucket: "wrong",
          rules: ["R1"],
          notes: `Subcategory parent category (${parent?.slug || s.category_id}) not present in resource_categories for this resource`,
        });
        previewActions.push({
          kind: "remove_subcategory",
          resourceId: r.id,
          title: r.title,
          subcategoryId: s.id,
          subcategorySlug: s.slug,
          reason: `R1: orphan subcategory — parent ${parent?.slug || s.category_id} not in resource_categories`,
        });
      } else {
        subcategoryEdges.push({
          subcategoryId: s.id,
          subcategorySlug: s.slug,
          subcategoryName: s.name,
          parentCategoryId: s.category_id,
          parentCategorySlug: parent?.slug || null,
          bucket: "clean",
          rules: [],
        });
      }
    }

    rows.push({
      resourceId: r.id,
      title: r.title,
      city: r.city,
      state: r.state,
      primaryCategoryId: r.category_id,
      primaryCategorySlug: primaryCat?.slug || null,
      categoryEdges,
      subcategoryEdges,
    });
  }

  const subClean = Math.max(0, rsRows.length - subCounts.wrong);
  const report: TaggingAuditReport = {
    generatedAt: new Date().toISOString(),
    state,
    resourceCount: resources.length,
    edgeCount: rcRows.length,
    subcategoryEdgeCount: rsRows.length,
    buckets: counts,
    subcategoryBuckets: { wrong: subCounts.wrong, clean: subClean },
    structural: {
      categoryWrong: counts.wrong,
      subcategoryWrong: subCounts.wrong,
      primaryMismatch: ruleCounts.R2_primaryMismatch,
      totalStructuralIssues:
        counts.wrong + subCounts.wrong + ruleCounts.R2_primaryMismatch,
    },
    rules: ruleCounts,
    duplicateTitleClusters,
    rows,
    previewActions,
  };

  lastReport = report;
  return report;
}

/**
 * Returns a compact preview slice of the audit (just the actionable items),
 * suitable for the /api/admin/tagging-audit/preview endpoint.
 */
export function buildPreview(report: TaggingAuditReport): {
  generatedAt: string;
  state: string;
  totalActions: number;
  byKind: Record<string, number>;
  actions: AuditAction[];
  suspectEdges: Array<{
    resourceId: string; title: string; city: string | null;
    categorySlug: string; rules: string[]; notes?: string;
  }>;
} {
  const byKind: Record<string, number> = {};
  for (const a of report.previewActions) {
    byKind[a.kind] = (byKind[a.kind] || 0) + 1;
  }
  const suspectEdges: Array<{
    resourceId: string; title: string; city: string | null;
    categorySlug: string; rules: string[]; notes?: string;
  }> = [];
  for (const r of report.rows) {
    for (const e of r.categoryEdges) {
      if (e.bucket === "suspect") {
        suspectEdges.push({
          resourceId: r.resourceId,
          title: r.title,
          city: r.city,
          categorySlug: e.categorySlug,
          rules: e.rules,
          notes: e.notes,
        });
      }
    }
  }
  return {
    generatedAt: report.generatedAt,
    state: report.state,
    totalActions: report.previewActions.length,
    byKind,
    actions: report.previewActions,
    suspectEdges,
  };
}
