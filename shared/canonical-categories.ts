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
export type ResourceMeta = {
  name: string; // canonical display name in `categories.name`
};

export type TrustedMeta = {
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  isActive: boolean;
  programArea?: string;
  groupType?: "service" | "product";
};

export type CanonicalPair = {
  resourceSlug: string | null;
  trustedSlug: string | null;
  status: "paired" | "resource-only" | "trusted-only";
  note?: string;
  // Step 1 (canonical taxonomy lock) — optional metadata used by boot-time
  // synchronizers. Values copied VERBATIM from the legacy hardcoded arrays in
  // server/routes.ts (alignCategoryNames RENAMES + ensureAllTrustedServiceCategories
  // activeTrusted/partnerSignupOnly/productsLocalOffers) so behavior is identical.
  resource?: ResourceMeta;
  trusted?: TrustedMeta;
};

export const CANONICAL_PAIRS: CanonicalPair[] = [
  // Fully paired (both sides exist)
  { resourceSlug: "housing", trustedSlug: "housing-home", status: "paired",
    resource: { name: "Housing & Home Services" },
    trusted: { name: "Housing & Home Services", description: "Trusted housing, moving, and home services for veterans and families", icon: "home", displayOrder: 1, isActive: true } },
  { resourceSlug: "legal", trustedSlug: "legal-services", status: "paired",
    resource: { name: "Legal Services" },
    trusted: { name: "Legal Services", description: "Vetted legal professionals experienced with veteran-specific needs", icon: "scale", displayOrder: 2, isActive: true } },
  { resourceSlug: "financial", trustedSlug: "financial-credit", status: "paired",
    resource: { name: "Financial & Credit Services" },
    trusted: { name: "Financial & Credit Services", description: "Trusted financial advisors, credit counseling, and lending partners", icon: "dollar-sign", displayOrder: 3, isActive: true } },
  { resourceSlug: "education", trustedSlug: "education-training", status: "paired",
    resource: { name: "Education & Training" },
    trusted: { name: "Education & Training", description: "Accredited programs and training providers supporting veteran success", icon: "graduation-cap", displayOrder: 5, isActive: true } },
  { resourceSlug: "employment", trustedSlug: "employment-support", status: "paired",
    resource: { name: "Employment Support" },
    trusted: { name: "Employment Support", description: "Employers and staffing partners committed to hiring veterans", icon: "briefcase", displayOrder: 6, isActive: true } },
  { resourceSlug: "va-benefits", trustedSlug: "benefits-assistance", status: "paired",
    resource: { name: "Benefits Assistance" },
    trusted: { name: "Benefits Assistance", description: "Claims assistance, VSO support, and benefits navigation for veterans", icon: "file-text", displayOrder: 20, isActive: false } },
  { resourceSlug: "substance-recovery", trustedSlug: "wellness-recovery", status: "paired",
    resource: { name: "Wellness & Recovery" },
    trusted: { name: "Wellness & Recovery", description: "Wellness programs, substance recovery, and holistic support", icon: "heart", displayOrder: 21, isActive: false } },

  // F2.6: Insurance promoted to paired (categories row added 2026-04-18)
  { resourceSlug: "insurance", trustedSlug: "insurance", status: "paired",
    resource: { name: "Insurance Services" },
    trusted: { name: "Insurance Services", description: "Insurance providers offering veteran-friendly coverage options", icon: "shield", displayOrder: 4, isActive: true } },

  // Resource-only (no Trusted Services counterpart yet)
  { resourceSlug: "healthcare", trustedSlug: null, status: "resource-only",
    resource: { name: "Healthcare" },
    note: "Resources `healthcare` has no ACTIVE trusted_service_categories counterpart. The legacy `healthcare-services` slug exists as an inactive partner-signup row (see trusted-only below)." },
  { resourceSlug: "disabled-veterans", trustedSlug: null, status: "resource-only",
    resource: { name: "Disabled Veterans" },
    note: "Resources `disabled-veterans` has no trusted_service_categories counterpart. Previously mapped to non-existent slug." },
  { resourceSlug: "mental-health", trustedSlug: null, status: "resource-only",
    resource: { name: "Mental Health" } },
  { resourceSlug: "family-support", trustedSlug: null, status: "resource-only",
    resource: { name: "Family Support" } },
  { resourceSlug: "transportation", trustedSlug: null, status: "resource-only",
    resource: { name: "Transportation" } },
  { resourceSlug: "community-support", trustedSlug: null, status: "resource-only",
    resource: { name: "Community Support" } },
  { resourceSlug: "food-assistance", trustedSlug: null, status: "resource-only",
    resource: { name: "Food Assistance" } },
  { resourceSlug: "crisis-help", trustedSlug: null, status: "resource-only",
    resource: { name: "Crisis Help" } },
  { resourceSlug: "end-of-life-services", trustedSlug: "end-of-life-services", status: "paired",
    resource: { name: "End of Life Services" },
    trusted: { name: "End of Life Services", description: "Hospice, funeral services, estate planning, and survivor benefits", icon: "flower-2", displayOrder: 7, isActive: true } },

  // Trusted-only — known intentional rows on Trusted Services side that have
  // no Resources counterpart by design. Registered here so the canonical lock
  // recognizes them and does NOT report them as `unknownInTrusted` drift.
  { resourceSlug: null, trustedSlug: "auto-services", status: "trusted-only",
    trusted: { name: "Auto Services", description: "Trusted auto repair, sales, and vehicle services for veterans", icon: "car", displayOrder: 8, isActive: true } },
  { resourceSlug: null, trustedSlug: "travel-services", status: "trusted-only",
    trusted: { name: "Travel Services", description: "Veteran-friendly travel, lodging, and recreation services", icon: "plane", displayOrder: 9, isActive: true } },
  { resourceSlug: null, trustedSlug: "healthcare-services", status: "trusted-only",
    trusted: { name: "Healthcare", description: "Healthcare providers and medical support for veterans", icon: "heart-pulse", displayOrder: 22, isActive: false },
    note: "Inactive partner-signup-only row. Resources side uses slug `healthcare`, not `healthcare-services`." },
  { resourceSlug: null, trustedSlug: "restaurants", status: "trusted-only",
    trusted: { name: "Restaurants", description: "Restaurants offering veteran discounts and specials", icon: "utensils", displayOrder: 30, isActive: true, programArea: "veteran_discount_services", groupType: "product" } },
  { resourceSlug: null, trustedSlug: "retail-discounts", status: "trusted-only",
    trusted: { name: "Retail Discounts", description: "Retail stores with veteran discount programs", icon: "shopping-bag", displayOrder: 31, isActive: true, programArea: "veteran_discount_services", groupType: "product" } },
  { resourceSlug: null, trustedSlug: "hotels", status: "trusted-only",
    trusted: { name: "Hotels", description: "Hotels and lodging with veteran rates and military discounts", icon: "bed", displayOrder: 32, isActive: true, programArea: "veteran_discount_services", groupType: "product" } },
  { resourceSlug: null, trustedSlug: "car-dealerships", status: "trusted-only",
    trusted: { name: "Car Dealerships", description: "Car dealerships offering veteran pricing and military discounts", icon: "car", displayOrder: 33, isActive: true, programArea: "veteran_discount_services", groupType: "product" } },
  { resourceSlug: null, trustedSlug: "gyms-fitness", status: "trusted-only",
    trusted: { name: "Gyms & Fitness", description: "Gyms and fitness centers with veteran memberships and discounts", icon: "dumbbell", displayOrder: 34, isActive: true, programArea: "veteran_discount_services", groupType: "product" } },
  { resourceSlug: null, trustedSlug: "local-businesses", status: "trusted-only",
    trusted: { name: "Local Businesses", description: "Local businesses supporting veterans with special offers", icon: "store", displayOrder: 35, isActive: true, programArea: "veteran_discount_services", groupType: "product" } },
];

// Step 1 (canonical taxonomy lock): known-legacy trusted slugs that exist in
// `trusted_service_categories` but are intentionally NOT part of the active
// canonical taxonomy. These are kept in the DB (per the no-deletion guardrail)
// and are deactivated by migrations in server/routes.ts. The lock recognizes
// them so they are not reported as drift.
//
//   - `disabled-veterans`         — legacy partner-side slug; Resources side
//                                    keeps `disabled-veterans` as the active
//                                    category, the trusted-side row is
//                                    deactivated by migration.
//   - `discount-*` (13 slugs)     — pre-merge discount taxonomy; rows were
//                                    merged into clean slugs (insurance,
//                                    legal-services, financial-credit, etc.)
//                                    by migration; source rows kept inactive.
export const LEGACY_TRUSTED_SLUGS: ReadonlySet<string> = new Set([
  "disabled-veterans",
  "discount-auto",
  "discount-car-dealers",
  "discount-financial",
  "discount-gyms",
  "discount-healthcare",
  "discount-hotels",
  "discount-insurance",
  "discount-legal",
  "discount-local",
  "discount-mortgage",
  "discount-restaurants",
  "discount-retail",
  "discount-travel",
]);

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

// ---- Step 1 helpers (canonical taxonomy lock) ----

/**
 * Resources-side rename map: slug → canonical display name.
 * Drives `alignCategoryNames()` in server/routes.ts. Only includes pairs
 * with both a resourceSlug and resource.name. Behavior-identical to the
 * legacy hardcoded RENAMES constant.
 */
export function getResourceRenames(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of CANONICAL_PAIRS) {
    if (p.resourceSlug && p.resource?.name) out[p.resourceSlug] = p.resource.name;
  }
  return out;
}

/**
 * Trusted Services upsert registry. Drives `ensureAllTrustedServiceCategories()`
 * in server/routes.ts. Only includes pairs with both a trustedSlug and trusted
 * metadata. Behavior-identical to the legacy hardcoded activeTrusted +
 * partnerSignupOnly + productsLocalOffers arrays combined.
 */
export function getTrustedRegistry(): Array<{ slug: string; meta: TrustedMeta }> {
  const out: Array<{ slug: string; meta: TrustedMeta }> = [];
  for (const p of CANONICAL_PAIRS) {
    if (p.trustedSlug && p.trusted) out.push({ slug: p.trustedSlug, meta: p.trusted });
  }
  return out;
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
