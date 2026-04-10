export const LEGACY_TO_CANONICAL: Record<string, string> = {
  "housing": "housing-home",
  "va-benefits": "benefits-assistance",
  "employment": "employment-support",
  "education": "education-training",
  "financial": "financial-credit",
  "legal": "legal-services",
  "healthcare": "healthcare-services",
  "substance-recovery": "wellness-recovery",
  "housing-assistance": "housing-home",
  "disability-services": "disabled-veterans",
  "financial-services": "financial-credit",
};

const CANONICAL_TO_LEGACY: Record<string, string> = {};
for (const [legacy, canonical] of Object.entries(LEGACY_TO_CANONICAL)) {
  if (!CANONICAL_TO_LEGACY[canonical]) {
    CANONICAL_TO_LEGACY[canonical] = legacy;
  }
}

export function toCanonical(slug: string): string {
  return LEGACY_TO_CANONICAL[slug] || slug;
}

export function toLegacy(slug: string): string {
  return CANONICAL_TO_LEGACY[slug] || slug;
}

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
