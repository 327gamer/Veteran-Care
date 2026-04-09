import {
  Shield,
  Heart,
  Car,
  Home,
  Key,
  ShieldCheck,
  Clock,
  PlusCircle,
  Building2,
  type LucideIcon,
} from "lucide-react";

export interface InsuranceSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
}

export const INSURANCE_SUBCATEGORIES: InsuranceSubcategory[] = [
  {
    name: "Health Insurance",
    slug: "health-insurance",
    icon: Heart,
    description: "Health insurance plans, TRICARE, CHAMPVA, and veteran-friendly coverage options",
  },
  {
    name: "Life Insurance",
    slug: "life-insurance",
    icon: Shield,
    description: "SGLI, VGLI, term life, whole life, and veteran life insurance programs",
  },
  {
    name: "Auto Insurance",
    slug: "auto-insurance",
    icon: Car,
    description: "Auto insurance with military and veteran discounts and specialized coverage",
  },
  {
    name: "Home Insurance",
    slug: "home-insurance",
    icon: Home,
    description: "Homeowners insurance, property coverage, and VA home loan insurance requirements",
  },
  {
    name: "Renters Insurance",
    slug: "renters-insurance",
    icon: Key,
    description: "Affordable renters insurance and personal property protection for veterans",
  },
  {
    name: "Disability Insurance",
    slug: "disability-insurance",
    icon: ShieldCheck,
    description: "Disability income protection, supplemental disability, and VA disability-related coverage",
  },
  {
    name: "Long-Term Care Insurance",
    slug: "long-term-care-insurance",
    icon: Clock,
    description: "Long-term care coverage, nursing home insurance, and aging-in-place planning",
  },
  {
    name: "Supplemental Insurance",
    slug: "supplemental-insurance",
    icon: PlusCircle,
    description: "Gap coverage, supplemental health plans, dental, vision, and accident policies",
  },
  {
    name: "Medicare & VA Plans",
    slug: "medicare-va-plans",
    icon: Building2,
    description: "Medicare enrollment, VA healthcare coordination, and dual-coverage planning",
  },
];
