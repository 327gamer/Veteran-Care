import CategoryDrilldown from "@/components/category-drilldown";
import { CATEGORY_DRILLDOWNS } from "@/lib/category-drilldown-registry";

export default function Healthcare() {
  return <CategoryDrilldown {...CATEGORY_DRILLDOWNS["healthcare"]} />;
}
