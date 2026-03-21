import {
  HeartPulse,
  Home,
  Building2,
  Flower2,
  FileText,
  ScrollText,
  FileCheck,
  Users,
  HandHelping,
  ClipboardList,
  Flag,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface EolSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
  keywords: string[];
}

export const EOL_SUBCATEGORIES: EolSubcategory[] = [
  {
    name: "Hospice & Palliative Care",
    slug: "hospice-palliative-care",
    icon: HeartPulse,
    description: "Comfort-focused care for serious illness and end of life",
    keywords: ["hospice", "palliative", "comfort care", "end of life care", "terminal"],
  },
  {
    name: "In-Home Care & Skilled Nursing",
    slug: "in-home-care",
    icon: Home,
    description: "Professional medical and personal care at home",
    keywords: ["home care", "home health", "skilled nursing", "in-home", "visiting nurse", "caregiver"],
  },
  {
    name: "Assisted Living & Nursing Homes",
    slug: "assisted-living",
    icon: Building2,
    description: "Residential facilities for seniors and veterans",
    keywords: ["assisted living", "nursing home", "long-term care", "residential care", "veteran home", "senior living"],
  },
  {
    name: "Funeral & Burial Services",
    slug: "funeral-burial",
    icon: Flower2,
    description: "Funeral planning, burial, and cremation services",
    keywords: ["funeral", "burial", "cremation", "mortuary", "memorial"],
  },
  {
    name: "VA Death Benefits & Survivor Benefits",
    slug: "va-death-benefits",
    icon: FileText,
    description: "Federal benefits for surviving spouses, children, and dependents",
    keywords: ["death benefit", "survivor benefit", "DIC", "dependency indemnity", "burial allowance", "VA death"],
  },
  {
    name: "Wills, Estate Planning & Probate",
    slug: "wills-estate-planning",
    icon: ScrollText,
    description: "Legal help for wills, trusts, and estate administration",
    keywords: ["will", "estate planning", "probate", "trust", "inheritance", "estate"],
  },
  {
    name: "Power of Attorney & Advance Directives",
    slug: "power-of-attorney",
    icon: FileCheck,
    description: "Legal documents for healthcare decisions and representation",
    keywords: ["power of attorney", "advance directive", "living will", "healthcare proxy", "POA", "DNR"],
  },
  {
    name: "Grief Counseling & Family Support",
    slug: "grief-counseling",
    icon: Users,
    description: "Emotional support for families and loved ones",
    keywords: ["grief", "bereavement", "counseling", "loss", "support group", "widow"],
  },
  {
    name: "Homebound Support & Daily Living",
    slug: "homebound-support",
    icon: HandHelping,
    description: "Meals, transportation, and help with daily tasks",
    keywords: ["homebound", "meals on wheels", "daily living", "ADL", "home delivered meals", "companion"],
  },
  {
    name: "End-of-Life Care Planning",
    slug: "care-planning",
    icon: ClipboardList,
    description: "Help creating a plan for care, finances, and family needs",
    keywords: ["care plan", "care planning", "end of life plan", "final arrangements", "advanced care"],
  },
  {
    name: "Veteran Funeral Honors & Cemetery Assistance",
    slug: "funeral-honors",
    icon: Flag,
    description: "Military honors, national cemeteries, and headstones",
    keywords: ["funeral honors", "military honors", "national cemetery", "headstone", "flag", "burial flag", "veteran cemetery"],
  },
  {
    name: "Legal Help for Family & Final Affairs",
    slug: "legal-final-affairs",
    icon: Scale,
    description: "Attorneys and legal aid for end-of-life and survivor matters",
    keywords: ["legal help", "attorney", "legal aid", "final affairs", "survivor legal", "death certificate"],
  },
  {
    name: "Insurance & Financial Planning",
    slug: "insurance-financial-planning",
    icon: ShieldCheck,
    description: "Life insurance, burial insurance, and financial support for families",
    keywords: ["life insurance", "burial insurance", "final expense", "financial planning", "financial counseling", "estate financial", "SGLI", "VGLI"],
  },
];
