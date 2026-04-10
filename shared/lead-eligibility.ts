/**
 * LEAD ELIGIBILITY GOVERNANCE — LAUNCH PHASE
 *
 * Single source of truth for determining whether a trusted partner
 * category/subcategory is eligible for Direct Lead Delivery.
 *
 * RULES:
 * - Only service-based categories where a veteran requests a connection
 *   and a qualified lead is delivered to a partner are lead-eligible.
 * - Non-lead categories (restaurants, retail, hotels, gyms, local businesses)
 *   are excluded — they are discount/coupon-style listings, not lead flows.
 * - Do NOT expand category eligibility ad hoc without review.
 * - Tracked interaction events (detail views, clicks, directions) are
 *   planned for later phases and are NOT billable at launch.
 * - Billable-now scope: explicit qualified leads delivered to lead-enabled
 *   partners, including AI-originated leads when the user clearly requests
 *   help/connection and the lead is delivered through the same workflow.
 *
 * CHUNK DEPENDENCIES:
 *   Chunk 2 — Conditional signup UX reads from this config
 *   Chunk 3 — Event/lead model references eligibility
 *   Chunk 4 — Admin lead delivery checks eligibility before routing
 *   Chunk 5 — AI lead integration gates on eligibility
 *   Chunk 6 — Billing/dispute layer enforces eligibility at invoice time
 */

export interface LeadEligibilityResult {
  isLeadEligible: boolean;
  reason: string;
  categorySlug: string | null;
  subcategorySlug: string | null;
}

interface CategoryEligibility {
  eligible: boolean;
  allSubcategories?: boolean;
  eligibleSubcategories?: string[];
}

const LEAD_ELIGIBLE_CATEGORIES: Record<string, CategoryEligibility> = {
  "financial-credit": {
    eligible: true,
    allSubcategories: false,
    eligibleSubcategories: [
      "mortgage-home-loans",
      "mortgages",
      "home-loans",
      "va-loans",
      "refinance",
      "refinancing",
      "first-time-buyers",
      "personal-auto-loans",
      "personal-loans",
      "credit-repair",
      "debt-consolidation",
      "debt-relief",
      "debt-management",
      "financial-planning",
      "tax-preparation",
      "banking-lending-support",
      "budgeting-financial-coaching",
    ],
  },

  "insurance": {
    eligible: true,
    allSubcategories: true,
  },

  "legal-services": {
    eligible: true,
    allSubcategories: true,
  },

  "end-of-life-services": {
    eligible: true,
    allSubcategories: true,
  },

  "healthcare-services": {
    eligible: true,
    allSubcategories: false,
    eligibleSubcategories: [
      "primary-care-ts",
      "specialty-care-ts",
      "dental-care-ts",
      "vision-care-ts",
      "pharmacy-ts",
    ],
  },

  "housing-home": {
    eligible: true,
    allSubcategories: false,
    eligibleSubcategories: [
      "va-home-loans",
      "home-ownership",
      "moving-relocation",
      "accessibility-modifications",
    ],
  },

  "wellness-recovery": {
    eligible: false,
  },

  "benefits-assistance": {
    eligible: false,
  },

  "auto-services": {
    eligible: false,
  },
};

const NON_ELIGIBLE_CATEGORIES: string[] = [
  "restaurants",
  "retail-discounts",
  "hotels",
  "gyms-fitness",
  "local-businesses",
  "travel-services",
  "car-dealerships",
  "discount-restaurants",
  "discount-retail",
  "discount-hotels",
  "discount-gyms",
  "discount-local",
  "discount-travel",
  "discount-auto",
  "discount-car-dealers",
  "discount-financial",
  "discount-insurance",
  "discount-legal",
  "discount-healthcare",
  "discount-mortgage",
];

export function isLeadEligibleCategory(categorySlug: string): boolean {
  const entry = LEAD_ELIGIBLE_CATEGORIES[categorySlug];
  return !!entry && entry.eligible;
}

export function isLeadEligibleSubcategory(
  categorySlug: string,
  subcategorySlug: string | null | undefined
): boolean {
  const entry = LEAD_ELIGIBLE_CATEGORIES[categorySlug];
  if (!entry || !entry.eligible) return false;
  if (entry.allSubcategories) return true;
  if (!subcategorySlug) return true;
  if (!entry.eligibleSubcategories) return false;
  return entry.eligibleSubcategories.includes(subcategorySlug);
}

export function getLeadEligibility(
  categorySlug: string | null | undefined,
  subcategorySlug: string | null | undefined
): LeadEligibilityResult {
  if (!categorySlug) {
    return {
      isLeadEligible: false,
      reason: "No category provided",
      categorySlug: null,
      subcategorySlug: subcategorySlug ?? null,
    };
  }

  if (NON_ELIGIBLE_CATEGORIES.includes(categorySlug)) {
    return {
      isLeadEligible: false,
      reason: "Category is a discount/product listing — not eligible for Direct Lead Delivery",
      categorySlug,
      subcategorySlug: subcategorySlug ?? null,
    };
  }

  const entry = LEAD_ELIGIBLE_CATEGORIES[categorySlug];

  if (!entry || !entry.eligible) {
    return {
      isLeadEligible: false,
      reason: "Category is not in the launch-phase lead-eligible list",
      categorySlug,
      subcategorySlug: subcategorySlug ?? null,
    };
  }

  if (entry.allSubcategories) {
    return {
      isLeadEligible: true,
      reason: "Category is lead-eligible (all subcategories included)",
      categorySlug,
      subcategorySlug: subcategorySlug ?? null,
    };
  }

  if (!subcategorySlug) {
    return {
      isLeadEligible: true,
      reason: "Category is lead-eligible (no subcategory specified — category-level eligibility applies)",
      categorySlug,
      subcategorySlug: null,
    };
  }

  if (entry.eligibleSubcategories?.includes(subcategorySlug)) {
    return {
      isLeadEligible: true,
      reason: "Category and subcategory are both lead-eligible",
      categorySlug,
      subcategorySlug,
    };
  }

  return {
    isLeadEligible: false,
    reason: "Category is lead-eligible but this specific subcategory is not included at launch",
    categorySlug,
    subcategorySlug,
  };
}

export function getLeadEligibleCategorySlugs(): string[] {
  return Object.keys(LEAD_ELIGIBLE_CATEGORIES).filter(
    (slug) => LEAD_ELIGIBLE_CATEGORIES[slug].eligible
  );
}

export function getLeadEligibleSubcategorySlugs(categorySlug: string): string[] | "all" | null {
  const entry = LEAD_ELIGIBLE_CATEGORIES[categorySlug];
  if (!entry || !entry.eligible) return null;
  if (entry.allSubcategories) return "all";
  return entry.eligibleSubcategories ?? [];
}
