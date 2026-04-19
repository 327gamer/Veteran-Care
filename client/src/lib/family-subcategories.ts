import {
  Heart,
  Baby,
  Users,
  HandHelping,
  Sparkles,
  Shield,
  Accessibility,
  School,
  type LucideIcon,
} from "lucide-react";

export interface FamilySubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
}

export const FAMILY_SUBCATEGORIES: FamilySubcategory[] = [
  {
    name: "Spouse Support",
    slug: "spouse-support",
    icon: Heart,
    description: "Programs, employment help, and community support for military and veteran spouses",
  },
  {
    name: "Children & Youth Programs",
    slug: "children-youth-programs",
    icon: Baby,
    description: "After-school programs, camps, mentoring, and resources for children of veterans",
  },
  {
    name: "Marriage & Relationship Counseling",
    slug: "marriage-relationship-counseling",
    icon: Users,
    description: "Couples counseling, communication support, and relationship resources for veteran families",
  },
  {
    name: "Caregiver Support",
    slug: "caregiver-support",
    icon: HandHelping,
    description: "VA caregiver program, respite care, training, and support for family caregivers of veterans",
  },
  {
    name: "Survivor & Dependent Benefits",
    slug: "survivor-dependent-benefits",
    icon: Shield,
    description: "DIC, survivor pension, dependents' education, and benefits for surviving family members",
  },
  {
    name: "Childcare Assistance",
    slug: "childcare-assistance",
    icon: Sparkles,
    description: "Childcare subsidies, military childcare programs, and family-care financial assistance",
  },
  {
    name: "Special Needs Family Support",
    slug: "special-needs-family-support",
    icon: Accessibility,
    description: "EFMP-style coordination, special-needs services, and resources for families with disabilities",
  },
  {
    name: "Military Family Life Counselors",
    slug: "military-family-life-counselors",
    icon: School,
    description: "MFLC services, school liaisons, and confidential non-medical counseling for families",
  },

  {
    name: "Military Family Support",
    slug: "military-family-support",
    icon: Users,
    description: "Comprehensive programs for active-duty, Guard, Reserve, and veteran families.",
  },
  {
    name: "Family Counseling",
    slug: "family-counseling",
    icon: Users,
    description: "Counseling for families navigating reintegration, grief, or relationship strain.",
  },
  {
    name: "Gold Star Family Support",
    slug: "gold-star-family-support",
    icon: Users,
    description: "Specific programs and benefits for surviving family of fallen service members.",
  },
  {
    name: "Survivor Benefits Support",
    slug: "survivor-benefits-support",
    icon: Users,
    description: "Help applying for survivor benefits like DIC and survivor pension.",
  },
  {
    name: "Spouse Employment Assistance",
    slug: "spouse-employment-assistance",
    icon: Users,
    description: "Job placement and career support for military and veteran spouses.",
  },
  {
    name: "Parenting Programs",
    slug: "parenting-programs",
    icon: Users,
    description: "Parenting classes and resources for veteran and military parents.",
  },
  {
    name: "Youth Programs",
    slug: "youth-programs",
    icon: Users,
    description: "Programs for children and teens of veteran families.",
  },
];
