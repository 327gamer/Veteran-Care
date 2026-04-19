/**
 * LAUNCH PROTECTION — pre-soft-launch trust cleanup.
 *
 * Centralized list of categories and sub-pages that are temporarily
 * hidden or marked "Coming Soon" because they currently lead to empty
 * pages. Removing entries from this file will re-expose them.
 *
 * Audit basis (2026-04-19, DB-direct):
 *   - Insurance: 0 approved resources, 8/10 sub-pages empty.
 *   - Family Support: 6 sub-page slugs have no row in DB subcategories
 *     table → silently empty.
 *
 * AI routing, partner_routing_rules, and DB rows are intentionally
 * untouched — only the public-facing UI is suppressed.
 */

/** Category slugs hidden from the /resources tile grid AND drilldown nav. */
export const HIDDEN_CATEGORY_SLUGS: ReadonlySet<string> = new Set([
  "insurance",
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
