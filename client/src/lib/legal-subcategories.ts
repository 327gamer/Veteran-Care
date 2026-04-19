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
];
