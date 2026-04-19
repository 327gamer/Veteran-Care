import CategoryDrilldown from "@/components/category-drilldown";
import { CATEGORY_DRILLDOWNS } from "@/lib/category-drilldown-registry";

export default function BenefitsAssistance() {
  return <CategoryDrilldown {...CATEGORY_DRILLDOWNS["benefits-assistance"]} />;
}
