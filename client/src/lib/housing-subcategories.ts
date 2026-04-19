import {
  AlertTriangle,
  DollarSign,
  Home,
  FileText,
  Wrench,
  Building2,
  ShieldAlert,
  Truck,
  type LucideIcon,
} from "lucide-react";

export interface HousingSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
  keywords: string[];
}

export const HOUSING_SUBCATEGORIES: HousingSubcategory[] = [
  {
    name: "Emergency Housing / Homeless Shelters",
    slug: "emergency-housing-homeless-shelters",
    icon: AlertTriangle,
    description: "Immediate shelter, safe housing, and homeless veteran assistance",
    keywords: ["emergency", "shelter", "homeless", "transitional", "safe haven", "SSVF", "HUD-VASH"],
  },
  {
    name: "Rental Assistance",
    slug: "rental-assistance",
    icon: DollarSign,
    description: "Help with rent payments, deposits, and utility assistance",
    keywords: ["rental", "rent", "assistance", "deposit", "utilities", "SSVF", "emergency rent"],
  },
  {
    name: "Home Ownership Programs",
    slug: "home-ownership-programs",
    icon: Home,
    description: "VA home loans, down payment help, and home buying programs",
    keywords: ["home loan", "VA loan", "mortgage", "home ownership", "down payment", "home buying"],
  },
  {
    name: "VA Housing Benefits",
    slug: "va-housing-benefits",
    icon: FileText,
    description: "Federal housing benefits, grants, and VA housing programs",
    keywords: ["VA housing", "SAH grant", "SHA grant", "housing benefit", "VA grant", "adapted housing"],
  },
  {
    name: "Home Modifications (Accessibility)",
    slug: "home-modifications-accessibility",
    icon: Wrench,
    description: "Ramps, accessibility upgrades, and home modification assistance",
    keywords: ["modification", "accessibility", "ramp", "wheelchair", "accessible", "home repair", "ADA"],
  },
  {
    name: "Transitional Housing",
    slug: "transitional-housing",
    icon: Building2,
    description: "Temporary housing programs for veterans in transition",
    keywords: ["transitional", "temporary", "halfway", "recovery housing", "sober living", "bridge housing"],
  },
  {
    name: "Foreclosure Prevention",
    slug: "foreclosure-prevention",
    icon: ShieldAlert,
    description: "Legal help, counseling, and assistance to prevent foreclosure",
    keywords: ["foreclosure", "mortgage help", "loan modification", "housing counseling", "delinquent"],
  },
  {
    name: "Moving & Storage",
    slug: "moving-relocation",
    icon: Truck,
    description: "Moving companies, PCS relocation help, and storage solutions for veterans",
    keywords: ["moving", "movers", "moving company", "storage", "relocation", "PCS", "pack out", "household goods"],
  },

  {
    name: "Homeless Veteran Services",
    slug: "homeless-veteran-services",
    icon: AlertTriangle,
    description: "SSVF, HUD-VASH, and street outreach programs for veterans experiencing homelessness.",
    keywords: [],
  },
  {
    name: "Rent Assistance",
    slug: "rent-assistance",
    icon: AlertTriangle,
    description: "Direct help paying rent and avoiding eviction.",
    keywords: [],
  },
  {
    name: "Emergency Housing",
    slug: "emergency-housing",
    icon: AlertTriangle,
    description: "Immediate emergency housing options for veterans in crisis.",
    keywords: [],
  },
  {
    name: "Emergency Shelter",
    slug: "emergency-shelter",
    icon: AlertTriangle,
    description: "Emergency shelter beds for veterans tonight.",
    keywords: [],
  },
  {
    name: "Food Assistance (Housing-Linked)",
    slug: "food-assistance",
    icon: AlertTriangle,
    description: "Food and nutrition assistance bundled with housing programs.",
    keywords: [],
  },
];
