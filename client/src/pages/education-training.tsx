import CategoryDrilldown from "@/components/category-drilldown";
import { CATEGORY_DRILLDOWNS } from "@/lib/category-drilldown-registry";

export default function EducationTraining() {
  return <CategoryDrilldown {...CATEGORY_DRILLDOWNS["education-training"]} />;
}
