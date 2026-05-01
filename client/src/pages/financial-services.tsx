import CategoryDrilldown from "@/components/category-drilldown";
import { CATEGORY_DRILLDOWNS } from "@/lib/category-drilldown-registry";
import EliteSponsorBanner from "@/components/elite-sponsor-banner";

export default function FinancialServices() {
  return (
    <>
      {/* Founder QA 2026-05-01 (Fix 3): switched from removed
          `mortgage-lending` slug to canonical `financial-credit`. VA Loans /
          Mortgages live under financial-credit/va-loans (founder T000). */}
      <EliteSponsorBanner
        categorySlug="financial-credit"
        categoryLabel="Financial & Credit Services"
      />
      <CategoryDrilldown {...CATEGORY_DRILLDOWNS["financial-services"]} />
    </>
  );
}
