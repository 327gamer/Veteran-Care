/**
 * Canonical Category Mapping (F2)
 * ---------------------------------
 * Single source of truth bridging the two category catalogs:
 *   - Resources side:        `categories.slug`            (16 rows)
 *   - Trusted Services side: `trusted_service_categories.slug` (8 rows)
 *
 * Provides bidirectional translation so a single canonical category
 * concept can resolve to either slug depending on the surface.
 *
 * READ-ONLY MAPPING ONLY (per F2 scope).
 * Display endpoints (/api/resources, /api/trusted-services) are NOT
 * changed by this file — F3 will wire cross-population through the
 * pairs declared here.
 *
 * Preserves existing public API: toCanonical, toLegacy, isCanonical,
 * normalizeCategory, normalizeCategoryList, LEGACY_TO_CANONICAL.
 */

// Authoritative mapping pairs. Each pair links a Resources slug to its
// counterpart Trusted Services slug. Slugs MUST exist in their respective
// catalogs (verified against DB on 2026-04-18).
//
// resourceSlug    = legacy slug in `categories.slug`
// trustedSlug     = slug in `trusted_service_categories.slug`
// status:
//   - "paired"        — both sides exist, fully cross-populatable
//   - "resource-only" — only resources side exists (no Trusted Services counterpart)
//   - "trusted-only"  — only trusted services side exists (no Resources counterpart)
export type CanonicalPair = {
  resourceSlug: string | null;
  trustedSlug: string | null;
  status: "paired" | "resource-only" | "trusted-only";
  note?: string;
};

export const CANONICAL_PAIRS: CanonicalPair[] = [
  // Fully paired (both sides exist)
  { resourceSlug: "housing",            trustedSlug: "housing-home",       status: "paired" },
  { resourceSlug: "legal",              trustedSlug: "legal-services",     status: "paired" },
  { resourceSlug: "financial",          trustedSlug: "financial-credit",   status: "paired" },
  { resourceSlug: "education",          trustedSlug: "education-training", status: "paired" },
  { resourceSlug: "employment",         trustedSlug: "employment-support", status: "paired" },
  { resourceSlug: "va-benefits",        trustedSlug: "benefits-assistance",status: "paired" },
  { resourceSlug: "substance-recovery", trustedSlug: "wellness-recovery",  status: "paired" },

  // F2.6: Insurance promoted to paired (categories row added 2026-04-18)
  { resourceSlug: "insurance", trustedSlug: "insurance", status: "paired" },

  // Resource-only (no Trusted Services counterpart yet)
  { resourceSlug: "healthcare",          trustedSlug: null, status: "resource-only",
    note: "Resources `healthcare` has no trusted_service_categories counterpart. Previously mapped to non-existent slug `healthcare-services`." },
  { resourceSlug: "disabled-veterans",   trustedSlug: null, status: "resource-only",
    note: "Resources `disabled-veterans` has no trusted_service_categories counterpart. Previously mapped to non-existent slug." },
  { resourceSlug: "mental-health",       trustedSlug: null, status: "resource-only" },
  { resourceSlug: "family-support",      trustedSlug: null, status: "resource-only" },
  { resourceSlug: "transportation",      trustedSlug: null, status: "resource-only" },
  { resourceSlug: "community-support",   trustedSlug: null, status: "resource-only" },
  { resourceSlug: "food-assistance",     trustedSlug: null, status: "resource-only" },
  { resourceSlug: "crisis-help",         trustedSlug: null, status: "resource-only" },
  { resourceSlug: "end-of-life-services",trustedSlug: null, status: "resource-only" },
];

// Aliases: legacy / synonym slugs that should normalize to a canonical resource slug.
// These exist for backwards compatibility and url-stability with old links.
const RESOURCE_ALIASES: Record<string, string> = {
  "housing-assistance":  "housing",
  "disability-services": "disabled-veterans",
  "financial-services":  "financial",
};

// Build the legacy→canonical (Resources → Trusted Services) map.
// Behavior preserved: returns the original slug if no mapping exists.
export const LEGACY_TO_CANONICAL: Record<string, string> = {};
for (const p of CANONICAL_PAIRS) {
  if (p.resourceSlug && p.trustedSlug) {
    LEGACY_TO_CANONICAL[p.resourceSlug] = p.trustedSlug;
  }
}
// Apply aliases (alias slug → trusted slug of its canonical resource)
for (const [alias, canonicalResource] of Object.entries(RESOURCE_ALIASES)) {
  const trusted = LEGACY_TO_CANONICAL[canonicalResource];
  if (trusted) LEGACY_TO_CANONICAL[alias] = trusted;
}

// Reverse map (Trusted Services → Resources). First-wins (matches original semantics).
const CANONICAL_TO_LEGACY: Record<string, string> = {};
for (const p of CANONICAL_PAIRS) {
  if (p.resourceSlug && p.trustedSlug && !CANONICAL_TO_LEGACY[p.trustedSlug]) {
    CANONICAL_TO_LEGACY[p.trustedSlug] = p.resourceSlug;
  }
}

// ---- Public API (preserved exactly as before) ----

/** Resources slug → Trusted Services slug. Returns input if no mapping. */
export function toCanonical(slug: string): string {
  return LEGACY_TO_CANONICAL[slug] || slug;
}

/** Trusted Services slug → Resources slug. Returns input if no mapping. */
export function toLegacy(slug: string): string {
  return CANONICAL_TO_LEGACY[slug] || slug;
}

/** True if the slug is already a canonical (Trusted Services) slug. */
export function isCanonical(slug: string): boolean {
  return !LEGACY_TO_CANONICAL[slug];
}

export function normalizeCategory<T extends { slug: string }>(cat: T): T {
  const canonical = toCanonical(cat.slug);
  if (canonical === cat.slug) return cat;
  return { ...cat, slug: canonical };
}

export function normalizeCategoryList<T extends { slug: string }>(cats: T[]): T[] {
  return cats.map(normalizeCategory);
}

// ---- New helpers (additive — no behavior change to existing code) ----

/** Returns the canonical pair for a given slug from either side, or null. */
export function getPair(slug: string): CanonicalPair | null {
  const aliasResolved = RESOURCE_ALIASES[slug] || slug;
  return CANONICAL_PAIRS.find(
    (p) => p.resourceSlug === aliasResolved || p.trustedSlug === slug,
  ) || null;
}

/** All slugs known on the Resources side (categories.slug). */
export function getResourceSlugs(): string[] {
  return CANONICAL_PAIRS
    .map((p) => p.resourceSlug)
    .filter((s): s is string => !!s)
    .sort();
}

/** All slugs known on the Trusted Services side (trusted_service_categories.slug). */
export function getTrustedSlugs(): string[] {
  return CANONICAL_PAIRS
    .map((p) => p.trustedSlug)
    .filter((s): s is string => !!s)
    .sort();
}

/** Pairs that are fully cross-populatable (both sides exist). */
export function getPairedPairs(): CanonicalPair[] {
  return CANONICAL_PAIRS.filter((p) => p.status === "paired");
}

/** Resources-only pairs (no Trusted Services counterpart). */
export function getResourceOnlyPairs(): CanonicalPair[] {
  return CANONICAL_PAIRS.filter((p) => p.status === "resource-only");
}

/** Trusted-only pairs (no Resources counterpart). */
export function getTrustedOnlyPairs(): CanonicalPair[] {
  return CANONICAL_PAIRS.filter((p) => p.status === "trusted-only");
}

/**
 * Audit the mapping against runtime catalogs.
 * Pass in the actual slugs from the DB. Returns mismatches in either direction.
 */
export function auditCoverage(
  dbResourceSlugs: string[],
  dbTrustedSlugs: string[],
): {
  pairedCount: number;
  resourceOnly: string[];
  trustedOnly: string[];
  unknownInResources: string[]; // slugs in DB but not in CANONICAL_PAIRS
  unknownInTrusted: string[];   // slugs in DB but not in CANONICAL_PAIRS
  brokenMappings: { from: string; to: string; side: "legacy" | "canonical" }[];
} {
  const knownR = new Set(getResourceSlugs());
  const knownT = new Set(getTrustedSlugs());
  const dbR = new Set(dbResourceSlugs);
  const dbT = new Set(dbTrustedSlugs);
  const broken: { from: string; to: string; side: "legacy" | "canonical" }[] = [];
  for (const [from, to] of Object.entries(LEGACY_TO_CANONICAL)) {
    if (!dbT.has(to)) broken.push({ from, to, side: "legacy" });
  }
  for (const [from, to] of Object.entries(CANONICAL_TO_LEGACY)) {
    if (!dbR.has(to)) broken.push({ from, to, side: "canonical" });
  }
  return {
    pairedCount: getPairedPairs().length,
    resourceOnly: getResourceOnlyPairs()
      .map((p) => p.resourceSlug!)
      .filter((s) => dbR.has(s)),
    trustedOnly: getTrustedOnlyPairs()
      .map((p) => p.trustedSlug!)
      .filter((s) => dbT.has(s)),
    unknownInResources: [...dbR].filter((s) => !knownR.has(s) && !RESOURCE_ALIASES[s]),
    unknownInTrusted: [...dbT].filter((s) => !knownT.has(s)),
    brokenMappings: broken,
  };
}
