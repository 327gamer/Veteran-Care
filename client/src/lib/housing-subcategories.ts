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
    name: "Emergency Housing",
    slug: "emergency-housing",
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
    name: "Home Ownership",
    slug: "home-ownership",
    icon: Home,
    description: "Down payment help, first-time buyer programs, and home buying support",
    keywords: ["home ownership", "down payment", "home buying", "first time buyer"],
  },
  // Founder QA fix 2026-04-30: "VA Home Loans" subcategory REMOVED from the
  // Housing display list. Mortgage / VA loan / refinance / home loan services
  // belong under Financial & Credit Services (already wired via
  // fin-subcategories.ts + server/index.ts:188-192 + server/routes.ts:1610).
  // Underlying partner_subcategories DB row is preserved — server/routes.ts:1564
  // still inserts it idempotently so deep-link URLs (?sub=va-home-loans) and
  // existing partner cross-listings keep resolving.
  {
    name: "Accessibility Modifications",
    slug: "accessibility-modifications",
    icon: Wrench,
    description: "Ramps, accessibility upgrades, SAH/SHA grants, and home modifications",
    keywords: ["modification", "accessibility", "ramp", "wheelchair", "SAH", "SHA", "ADA"],
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
    name: "Moving & Relocation",
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
    keywords: ["homeless", "SSVF", "HUD-VASH", "street outreach"],
  },
];
