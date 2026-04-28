import CategoryDrilldown from "@/components/category-drilldown";
import { CATEGORY_DRILLDOWNS } from "@/lib/category-drilldown-registry";
import EliteSponsorBanner from "@/components/elite-sponsor-banner";

export default function FinancialServices() {
  return (
    <>
      <EliteSponsorBanner
        categorySlug="mortgage-lending"
        categoryLabel="Mortgage / Lending"
      />
      <CategoryDrilldown {...CATEGORY_DRILLDOWNS["financial-services"]} />
    </>
  );
}
