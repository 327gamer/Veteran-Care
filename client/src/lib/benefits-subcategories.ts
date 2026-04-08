import {
  FileText,
  Wallet,
  GraduationCap,
  Scale,
  Heart,
  HandHelping,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export interface BenefitsSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
  keywords: string[];
}

export const BENEFITS_SUBCATEGORIES: BenefitsSubcategory[] = [
  {
    name: "Disability Claims",
    slug: "disability-claims",
    icon: FileText,
    description: "VA disability compensation, initial claims, rating increases, and service-connected disability support",
    keywords: ["disability", "claims", "compensation", "rating", "service-connected", "VA claim"],
  },
  {
    name: "Pension Benefits",
    slug: "pension-benefits",
    icon: Wallet,
    description: "Veterans pension, low-income support, wartime pension, and needs-based benefits",
    keywords: ["pension", "low-income", "wartime", "needs-based", "veteran pension"],
  },
  {
    name: "Education Benefits / GI Bill",
    slug: "education-benefits-gi-bill",
    icon: GraduationCap,
    description: "GI Bill, tuition assistance, training benefits, and school or certification support",
    keywords: ["GI Bill", "education", "tuition", "training", "certification", "school", "Chapter 33"],
  },
  {
    name: "Appeals & Claim Support",
    slug: "appeals-claim-support",
    icon: Scale,
    description: "Denied claims, appeals, supplemental claims, higher-level review, and claims navigation",
    keywords: ["appeals", "denied", "supplemental", "higher-level review", "claim support", "BVA"],
  },
  {
    name: "Survivor Benefits",
    slug: "survivor-benefits",
    icon: Heart,
    description: "DIC, survivor compensation, spouse and dependent support, and burial-related benefits",
    keywords: ["survivor", "DIC", "spouse", "dependent", "burial benefit", "death benefit"],
  },
  {
    name: "Aid & Attendance",
    slug: "aid-attendance",
    icon: HandHelping,
    description: "Long-term care support, assisted living funding, in-home support, and pension add-on benefits",
    keywords: ["aid and attendance", "long-term care", "assisted living", "in-home", "housebound", "pension add-on"],
  },
  {
    name: "VA Enrollment & General Benefits Navigation",
    slug: "va-enrollment-general-benefits-navigation",
    icon: ClipboardList,
    description: "General VA benefits guidance, enrollment help, benefits counseling, and eligibility navigation",
    keywords: ["enrollment", "eligibility", "benefits counseling", "VA enrollment", "navigation", "guidance"],
  },
];
