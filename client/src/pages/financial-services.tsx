import CategoryDrilldown from "@/components/category-drilldown";
import { CATEGORY_DRILLDOWNS } from "@/lib/category-drilldown-registry";

export default function FinancialServices() {
  return <CategoryDrilldown {...CATEGORY_DRILLDOWNS["financial-services"]} />;
}
