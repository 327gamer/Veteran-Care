import {
  FileText,
  Award,
  Users,
  Gavel,
  Home as HomeIcon,
  Briefcase,
  Scale,
  type LucideIcon,
} from "lucide-react";

export interface LegalSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
}

export const LEGAL_SUBCATEGORIES: LegalSubcategory[] = [
  {
    name: "Disability Claims Assistance",
    slug: "disability-claims-assistance",
    icon: Award,
    description: "Attorney-led assistance with VA disability claims and ratings",
  },
  {
    name: "VA Benefits Appeals",
    slug: "va-benefits-appeals",
    icon: Award,
    description: "Legal help appealing denied or under-rated VA benefit decisions",
  },
  {
    name: "Discharge Upgrade Assistance",
    slug: "discharge-upgrade-assistance",
    icon: FileText,
    description: "Help upgrading a less-than-honorable discharge to restore benefits eligibility",
  },
  {
    name: "Family Law",
    slug: "family-law",
    icon: Users,
    description: "Divorce, custody, military spouse legal issues, and SCRA family protections",
  },
  {
    name: "Wills, Estate Planning & Probate",
    slug: "wills-estate-planning",
    icon: FileText,
    description: "Wills, trusts, powers of attorney, probate, and end-of-life estate planning",
  },
  {
    name: "Criminal Defense",
    slug: "criminal-defense",
    icon: Gavel,
    description: "Criminal defense, veteran treatment courts, and record expungement support",
  },
  {
    name: "Employment Law",
    slug: "employment-law",
    icon: Briefcase,
    description: "USERRA, workplace discrimination, and veteran employment rights",
  },
  {
    name: "Landlord / Tenant Issues",
    slug: "landlord-tenant-issues",
    icon: HomeIcon,
    description: "Eviction defense, tenant rights, and SCRA housing protections",
  },
  {
    name: "Military Records Assistance",
    slug: "military-records-assistance",
    icon: FileText,
    description: "Legal help correcting or recovering DD214 and military records",
  },
  {
    name: "Pro Bono Legal Services",
    slug: "pro-bono-legal-services",
    icon: Scale,
    description: "Volunteer attorneys offering free legal help to veterans",
  },
  {
    name: "Legal Aid Services",
    slug: "legal-aid-services",
    icon: Scale,
    description: "Free or low-cost legal aid for income-eligible veterans",
  },
  {
    name: "Veterans Legal Clinics",
    slug: "veterans-legal-clinics",
    icon: Scale,
    description: "Walk-in or scheduled legal clinics dedicated to veteran issues",
  },
];
