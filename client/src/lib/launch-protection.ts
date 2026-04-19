/**
 * LAUNCH PROTECTION — pre-soft-launch trust cleanup.
 *
 * Centralized list of categories and sub-pages that are temporarily
 * hidden because they currently lead to empty pages. Removing entries
 * from this file will re-expose them.
 *
 * Audit basis (2026-04-19, DB-direct, post-mirror-fix):
 *   - Insurance: 2/10 sub slugs populated. Category itself is now live
 *     (mirrors Trusted Services side); 8 empty subs hidden below.
 *   - Family Support: 6 sub slugs have no row in DB subcategories table.
 *   - Disabled Veterans: 3 sub slugs have DB rows but 0 tagged resources.
 *
 * AI routing, partner_routing_rules, and DB rows are intentionally
 * untouched — only the public-facing UI is suppressed.
 */

/** Category slugs hidden from the /resources tile grid AND drilldown nav. */
export const HIDDEN_CATEGORY_SLUGS: ReadonlySet<string> = new Set<string>([
  // (empty — Insurance now mirrors Trusted Services with 2 visible subs)
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
  "insurance": new Set([
    "health-insurance",
    "auto-insurance",
    "home-insurance",
    "renters-insurance",
    "disability-insurance",
    "long-term-care-insurance",
    "supplemental-insurance",
    "medicare-va-plans",
  ]),
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
