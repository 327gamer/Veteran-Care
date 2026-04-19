import {
  FileText,
  Wallet,
  GraduationCap,
  Scale,
  Heart,
  HandHelping,
  ClipboardList,
  FileArchive,
  TrendingUp,
  AlertTriangle,
  Stethoscope,
  Users,
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
    name: "Military Records & DD214",
    slug: "military-records-dd214",
    icon: FileArchive,
    description: "DD214 requests, military records corrections, service verification, and medals",
    keywords: ["DD214", "military records", "service records", "corrections", "medals", "discharge", "NPRC"],
  },
  {
    name: "Disability Claims & Filing",
    slug: "disability-claims-filing",
    icon: FileText,
    description: "Initial VA disability claims, filing assistance, and service-connected compensation",
    keywords: ["disability", "claims", "filing", "compensation", "service-connected", "VA claim", "initial claim"],
  },
  {
    name: "Disability Increase (Reevaluation)",
    slug: "disability-increase-reevaluation",
    icon: TrendingUp,
    description: "Rating increases, reevaluation requests, and worsened condition documentation",
    keywords: ["increase", "reevaluation", "rating increase", "worsened condition", "supplemental claim"],
  },
  {
    name: "Appeals & Denials",
    slug: "appeals-denials",
    icon: Scale,
    description: "Denied claims, appeals, supplemental claims, higher-level review, and Board of Appeals",
    keywords: ["appeals", "denied", "supplemental", "higher-level review", "BVA", "denial", "HLR"],
  },
  {
    name: "C&P Exams (What to Expect)",
    slug: "cp-exams-what-to-expect",
    icon: Stethoscope,
    description: "Compensation & Pension exam preparation, what to bring, and how to document symptoms",
    keywords: ["C&P exam", "compensation and pension", "exam preparation", "QTC", "VES", "LHI"],
  },
  {
    name: "VA Claims Assistance (DAV, VSO, etc.)",
    slug: "va-claims-assistance-dav-vso",
    icon: Users,
    description: "Accredited VSOs, DAV, VFW, and free claims assistance from veteran organizations",
    keywords: ["VSO", "DAV", "VFW", "American Legion", "claims assistance", "accredited representative"],
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

  {
    name: "VA Enrollment Help",
    slug: "va-enrollment-help",
    icon: Users,
    description: "Assistance enrolling in VA programs and benefits.",
    keywords: [],
  },
  {
    name: "County Veterans Service Offices",
    slug: "county-veterans-service-offices",
    icon: Users,
    description: "Local county-level VSOs across South Carolina that help with claims, records, and benefits.",
    keywords: [],
  },
  {
    name: "Disability Claims Assistance",
    slug: "disability-claims-assistance",
    icon: Users,
    description: "Direct help filing or strengthening a disability compensation claim.",
    keywords: [],
  },
  {
    name: "Appeals Assistance",
    slug: "appeals-assistance",
    icon: Users,
    description: "Help appealing a denied or under-rated disability claim.",
    keywords: [],
  },
  {
    name: "Military Records / DD214 Help",
    slug: "military-records-dd214-help",
    icon: Users,
    description: "Recover, correct, or upgrade your DD214 and other service records.",
    keywords: [],
  },
  {
    name: "PACT Act / Burn Pit Claims",
    slug: "pact-act-burn-pit-claims",
    icon: Users,
    description: "PACT Act registry, toxic exposure screenings, and burn pit-related claims help.",
    keywords: [],
  },
  {
    name: "Pension Assistance",
    slug: "pension-assistance",
    icon: Users,
    description: "Help applying for VA pension, Aid & Attendance, and survivor pension benefits.",
    keywords: [],
  },
];
