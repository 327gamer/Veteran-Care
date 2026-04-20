/**
 * LAUNCH PROTECTION — pre-soft-launch trust cleanup.
 *
 * Centralized list of categories and sub-pages that are temporarily
 * hidden because they currently lead to empty pages. Removing entries
 * from this file will re-expose them.
 *
 * Audit basis (2026-04-20, post-founder-QA correction):
 *   - Insurance: ALL 10 subs intentionally visible on both Resources and
 *     Trusted Services. Trusted Services side has monetizable partners;
 *     hiding subs collapses revenue surfaces. Mirror is UPWARD ONLY —
 *     never reduce TS to match thinner Resources content.
 *   - Family Support: 6 sub slugs have no row in DB subcategories table.
 *   - Disabled Veterans: 3 sub slugs have DB rows but 0 tagged resources.
 *
 * AI routing, partner_routing_rules, and DB rows are intentionally
 * untouched — only the public-facing UI is suppressed.
 */

/** Category slugs hidden from the /resources tile grid AND drilldown nav. */
export const HIDDEN_CATEGORY_SLUGS: ReadonlySet<string> = new Set<string>([
  // (empty — no categories hidden at root level)
]);

/**
 * Sub-page slugs hidden from each drilldown. Keyed by category slug.
 * These are sub-pages where the underlying DB has no resources tagged.
 */
export const HIDDEN_SUBCATEGORY_SLUGS: Readonly<Record<string, ReadonlySet<string>>> = {
  "family-support": new Set([
    "spouse-support",
    "children-youth-programs",
    "marriage-relationship-counseling",
    "survivor-dependent-benefits",
    "special-needs-family-support",
    "military-family-life-counselors",
  ]),
  // "insurance": intentionally empty — all 10 subs visible on both Resources
  // and Trusted Services. Do NOT re-add insurance subs here. Trusted Services
  // partners exist in these buckets and hiding them collapses revenue surfaces.
  // Disabled Veterans drilldown reads from DV_SUBCATEGORIES (curated TS file),
  // not the DB subcategories table, so the previously-listed empty DB-only
  // sub-slugs don't render in the UI. No hide rules needed here.
};

export function isCategoryHidden(slug: string): boolean {
  return HIDDEN_CATEGORY_SLUGS.has(slug);
}

export function filterVisibleSubcategories<T extends { slug: string }>(
  categorySlug: string,
  subs: readonly T[],
): T[] {
  const hidden = HIDDEN_SUBCATEGORY_SLUGS[categorySlug];
  if (!hidden || hidden.size === 0) return [...subs];
  return subs.filter(s => !hidden.has(s.slug));
}
