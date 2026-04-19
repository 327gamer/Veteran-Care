import { Flower2, Pill, Activity, Users, HeartHandshake, ShieldCheck, Leaf, type LucideIcon } from "lucide-react";

export interface WellnessSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
}

export const WELLNESS_SUBCATEGORIES: WellnessSubcategory[] = [
  {
    name: "Veteran Recovery Programs",
    slug: "veteran-recovery-programs",
    icon: Flower2,
    description: "Veteran-specific recovery programs combining peer support, clinical care, and community.",
  },
  {
    name: "Outpatient Recovery",
    slug: "outpatient-recovery",
    icon: Activity,
    description: "Outpatient substance use disorder programs that let you live at home while in treatment.",
  },
  {
    name: "Detox Programs",
    slug: "detox-programs",
    icon: ShieldCheck,
    description: "Medically-supervised detox to safely stop alcohol or drug use.",
  },
  {
    name: "Medication Assisted Treatment",
    slug: "medication-assisted-treatment",
    icon: Pill,
    description: "MAT programs combining medication (Suboxone, Vivitrol) with counseling for opioid and alcohol use disorders.",
  },
  {
    name: "Peer Recovery Groups",
    slug: "peer-recovery-groups",
    icon: Users,
    description: "AA, NA, SMART Recovery, and veteran-specific peer recovery groups across South Carolina.",
  },
  {
    name: "Recovery Support Services",
    slug: "recovery-support-services",
    icon: HeartHandshake,
    description: "Sober living, recovery coaching, and long-term recovery support services.",
  },
  {
    name: "Crisis Stabilization",
    slug: "crisis-stabilization",
    icon: Leaf,
    description: "Short-term crisis stabilization for veterans in acute mental health or substance use crisis.",
  },
];
