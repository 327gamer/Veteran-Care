import {
  FileText,
  Award,
  Users,
  DollarSign,
  Gavel,
  Home as HomeIcon,
  Globe,
  Briefcase,
  type LucideIcon,
  Scale,
} from "lucide-react";

export interface LegalSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
}

export const LEGAL_SUBCATEGORIES: LegalSubcategory[] = [
  {
    name: "Estate Planning & Wills",
    slug: "estate-planning-wills",
    icon: FileText,
    description: "Wills, trusts, powers of attorney, and end-of-life estate planning for veterans and their families",
  },
  {
    name: "VA Claims & Appeals",
    slug: "va-claims-appeals-legal",
    icon: Award,
    description: "Accredited attorneys and legal help for VA disability claims, benefits denials, and BVA appeals",
  },
  {
    name: "Family Law & Divorce",
    slug: "family-law-divorce",
    icon: Users,
    description: "Divorce, custody, military spouse legal issues, and SCRA family law protections",
  },
  {
    name: "Consumer & Credit",
    slug: "consumer-credit-legal",
    icon: DollarSign,
    description: "Debt defense, credit disputes, predatory lending issues, and consumer protection",
  },
  {
    name: "Criminal Defense & Expungement",
    slug: "criminal-defense-expungement",
    icon: Gavel,
    description: "Criminal defense, veteran treatment courts, and record expungement support",
  },
  {
    name: "Landlord-Tenant & Housing",
    slug: "landlord-tenant-legal",
    icon: HomeIcon,
    description: "Eviction defense, landlord disputes, and SCRA housing-related legal protections",
  },
  {
    name: "Immigration & Naturalization",
    slug: "immigration-naturalization",
    icon: Globe,
    description: "Citizenship, naturalization for veterans and military spouses, and immigration legal help",
  },
  {
    name: "Business & Entrepreneurship",
    slug: "business-entrepreneurship-legal",
    icon: Briefcase,
    description: "Veteran-owned business formation, contracts, trademarks, and small-business legal services",
  },

  {
    name: "Legal Aid Services",
    slug: "legal-aid-services",
    icon: Scale,
    description: "Free or low-cost legal aid for income-eligible veterans.",
  },
  {
    name: "Pro Bono Legal Services",
    slug: "pro-bono-legal-services",
    icon: Scale,
    description: "Volunteer attorneys offering free legal help to veterans.",
  },
  {
    name: "Veterans Legal Clinics",
    slug: "veterans-legal-clinics",
    icon: Scale,
    description: "Walk-in or scheduled legal clinics dedicated to veteran issues.",
  },
  {
    name: "VA Benefits Appeals",
    slug: "va-benefits-appeals",
    icon: Scale,
    description: "Legal help appealing denied or under-rated VA benefit decisions.",
  },
  {
    name: "Discharge Upgrade Assistance",
    slug: "discharge-upgrade-assistance",
    icon: Scale,
    description: "Help upgrading a less-than-honorable discharge to restore benefits eligibility.",
  },
  {
    name: "Military Records Assistance",
    slug: "military-records-assistance",
    icon: Scale,
    description: "Legal help correcting or recovering DD214 and military records.",
  },
  {
    name: "Disability Claims Assistance",
    slug: "disability-claims-assistance",
    icon: Scale,
    description: "Attorney-led assistance with VA disability claims.",
  },
  {
    name: "Family Law Support",
    slug: "family-law-support",
    icon: Scale,
    description: "Divorce, custody, and family law help for veterans.",
  },
  {
    name: "Landlord / Tenant Issues",
    slug: "landlord-tenant-issues",
    icon: Scale,
    description: "Eviction defense and tenant rights for veterans.",
  },
  {
    name: "Wills, Estate Planning & Probate",
    slug: "wills-estate-planning-probate",
    icon: Scale,
    description: "Wills, estate planning, and probate services for veterans and families.",
  },
  {
    name: "Legal Help for Family & Final Affairs",
    slug: "legal-help-for-family-final-affairs",
    icon: Scale,
    description: "Final affairs legal support for surviving families.",
  },
];
