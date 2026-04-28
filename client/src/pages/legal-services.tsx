import CategoryDrilldown from "@/components/category-drilldown";
import { CATEGORY_DRILLDOWNS } from "@/lib/category-drilldown-registry";
import EliteSponsorBanner from "@/components/elite-sponsor-banner";

export default function LegalServices() {
  return (
    <>
      <EliteSponsorBanner
        categorySlug="legal-services"
        categoryLabel="Legal Services"
      />
      <CategoryDrilldown {...CATEGORY_DRILLDOWNS["legal-services"]} />
    </>
  );
}
