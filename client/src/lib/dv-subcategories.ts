import {
  FileText,
  Home,
  Car,
  HeartPulse,
  Brain,
  Briefcase,
  Users,
  Scale,
  HandHelping,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface DvSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
  keywords: string[];
}

export const DV_SUBCATEGORIES: DvSubcategory[] = [
  {
    name: "Disability Benefits & Claims",
    slug: "disability-benefits-claims",
    icon: FileText,
    description: "VA disability claims, appeals, rating increases, and benefits counseling",
    keywords: ["disability", "claims", "compensation", "rating", "appeals", "benefits"],
  },
  {
    name: "Accessible Housing & Home Modifications",
    slug: "accessible-housing-home-modifications",
    icon: Home,
    description: "Wheelchair-accessible housing, ramps, and home accessibility upgrades",
    keywords: ["housing", "accessible", "wheelchair", "ramp", "modification", "SAH grant"],
  },
  {
    name: "Adaptive Transportation & Mobility",
    slug: "adaptive-transportation-mobility",
    icon: Car,
    description: "Accessible transportation, mobility assistance, and vehicle modifications",
    keywords: ["transportation", "mobility", "vehicle", "adaptive", "automobile", "travel"],
  },
  {
    name: "Healthcare & Rehabilitation",
    slug: "healthcare-rehabilitation",
    icon: HeartPulse,
    description: "Specialty medical care, rehabilitation, physical therapy, and prosthetics",
    keywords: ["healthcare", "rehabilitation", "therapy", "prosthetics", "medical", "physical therapy"],
  },
  {
    name: "Mental Health & PTSD Support",
    slug: "mental-health-ptsd-support",
    icon: Brain,
    description: "PTSD support, trauma counseling, suicide prevention, and crisis support",
    keywords: ["mental health", "PTSD", "counseling", "crisis", "trauma", "behavioral health"],
  },
  {
    name: "Employment & Vocational Rehabilitation",
    slug: "employment-vocational-rehabilitation",
    icon: Briefcase,
    description: "Disability-friendly employment, vocational rehab, and job placement",
    keywords: ["employment", "vocational", "rehabilitation", "job", "career", "workforce"],
  },
  {
    name: "Caregiver & Family Support",
    slug: "caregiver-family-support",
    icon: Users,
    description: "Family caregiver support, respite care, and dependent services",
    keywords: ["caregiver", "family", "respite", "dependent", "spouse", "support"],
  },
  {
    name: "Legal Advocacy & Rights",
    slug: "legal-advocacy-rights",
    icon: Scale,
    description: "Disability rights, veteran legal aid, and accommodations support",
    keywords: ["legal", "rights", "advocacy", "discrimination", "accommodations", "disability rights"],
  },
  {
    name: "Independent Living & Daily Support",
    slug: "independent-living-daily-support",
    icon: HandHelping,
    description: "Personal care assistance, case management, and life-skills support",
    keywords: ["independent living", "personal care", "case management", "daily living", "life skills"],
  },
  {
    name: "Adaptive Equipment & Assistive Technology",
    slug: "adaptive-equipment-assistive-technology",
    icon: Wrench,
    description: "Prosthetics, wheelchairs, hearing/vision devices, and communication aids",
    keywords: ["prosthetics", "wheelchair", "assistive technology", "hearing", "vision", "equipment"],
  },
];
