import CategoryDrilldown from "@/components/category-drilldown";
import { CATEGORY_DRILLDOWNS } from "@/lib/category-drilldown-registry";
import EliteSponsorBanner from "@/components/elite-sponsor-banner";

export default function FinancialServices() {
  return (
    <>
      <EliteSponsorBanner
        categorySlug="financial-credit"
        categoryLabel="Financial & Credit Services"
      />
      <CategoryDrilldown {...CATEGORY_DRILLDOWNS["financial-services"]} />
    </>
  );
}
