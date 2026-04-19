import CategoryDrilldown from "@/components/category-drilldown";
import { CATEGORY_DRILLDOWNS } from "@/lib/category-drilldown-registry";

export default function EndOfLife() {
  return <CategoryDrilldown {...CATEGORY_DRILLDOWNS["end-of-life"]} />;
}
