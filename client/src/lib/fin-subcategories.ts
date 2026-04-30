import {
  Home,
  Wallet,
  CreditCard,
  DollarSign,
  PiggyBank,
  Building2,
  RefreshCw,
  Users,
  Receipt,
  TrendingUp,
  Award,
  HandCoins,
  type LucideIcon,
} from "lucide-react";

export interface FinSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
  keywords: string[];
}

export const FIN_SUBCATEGORIES: FinSubcategory[] = [
  // Founder spec T000 2026-04-30: canonical mortgage entry is "VA Loans" only.
  // The previous generic "Mortgages / Home Loans" entry was removed because
  // (a) all seeded mortgage providers (USAA Mortgage, Navy Federal, Veterans
  // United) live under va-loans, (b) showing an empty general entry alongside
  // a populated VA Loans entry was a duplicate UI path that confused users.
  {
    // Founder QA item #6 (2026-04-30): rename to "VA Loans / Mortgages" so
    // veterans AND non-veteran spouses/family searching for "mortgage" find it.
    name: "VA Loans / Mortgages",
    slug: "va-loans",
    icon: Award,
    description: "VA-guaranteed mortgages, certificates of eligibility, conventional mortgages, and home-loan support — the canonical home for all mortgage / home loan partners.",
    keywords: ["VA loan", "VA mortgage", "COE", "certificate of eligibility", "mortgage", "home loan", "down payment", "home buying", "FHA", "conventional mortgage", "home buyer"],
  },
  {
    name: "Refinancing",
    slug: "refinancing",
    icon: RefreshCw,
    description: "VA refinance programs, IRRRL, rate reduction, and mortgage refinancing",
    keywords: ["refinancing", "IRRRL", "streamline", "rate reduction", "cash-out"],
  },
  {
    name: "First-Time Buyers",
    slug: "first-time-buyers",
    icon: Home,
    description: "First-time homebuyer education, down payment assistance, and counseling",
    keywords: ["first time buyer", "homebuyer education", "down payment assistance"],
  },
  {
    name: "Personal Loans",
    slug: "personal-loans",
    icon: Wallet,
    description: "Personal lending, emergency loans, and veteran-friendly loan programs",
    keywords: ["personal loan", "lending", "emergency loan", "installment loan"],
  },
  {
    name: "Debt Relief",
    slug: "debt-relief",
    icon: DollarSign,
    description: "Debt consolidation, negotiation, management plans, and financial relief",
    keywords: ["debt relief", "debt consolidation", "debt management", "bankruptcy"],
  },
  {
    name: "Debt Counseling",
    slug: "debt-counseling",
    icon: Users,
    description: "Nonprofit debt counseling and consolidation guidance",
    keywords: ["debt counseling", "credit counseling"],
  },
  {
    name: "Credit Repair",
    slug: "credit-repair",
    icon: CreditCard,
    description: "Credit counseling, score improvement, dispute resolution, and rebuilding",
    keywords: ["credit repair", "credit score", "credit counseling", "dispute"],
  },
  {
    name: "Tax Preparation",
    slug: "tax-preparation",
    icon: Receipt,
    description: "Free tax prep, VITA sites, and veteran-focused tax assistance",
    keywords: ["tax", "tax prep", "VITA", "tax return", "IRS"],
  },
  {
    name: "Financial Planning & Investing",
    slug: "financial-planning",
    icon: TrendingUp,
    description: "Retirement planning, TSP guidance, and long-term investment counseling",
    keywords: ["financial planning", "investing", "TSP", "retirement", "wealth"],
  },
  {
    name: "Budgeting & Financial Coaching",
    slug: "budgeting-financial-coaching",
    icon: PiggyBank,
    description: "Financial literacy, budgeting tools, coaching, and money management",
    keywords: ["budgeting", "financial coaching", "financial literacy", "money management"],
  },
  {
    name: "Banking / Lending Support",
    slug: "banking-lending-support",
    icon: Building2,
    description: "Veteran-friendly banks, credit unions, and lending institutions",
    keywords: ["banking", "credit union", "savings", "lending", "veteran bank"],
  },
  {
    name: "Emergency Financial Assistance",
    slug: "emergency-financial-assistance",
    icon: HandCoins,
    description: "Short-term emergency aid for veterans facing a financial crisis",
    keywords: ["emergency", "financial assistance", "crisis", "hardship"],
  },
  {
    name: "Utility Bill Assistance",
    slug: "utility-bill-assistance",
    icon: Users,
    description: "Help paying electric, water, and heating bills",
    keywords: ["utility", "electric", "water", "heating", "LIHEAP"],
  },
  {
    name: "Veteran Relief Funds",
    slug: "veteran-relief-funds",
    icon: Users,
    description: "Veteran-specific relief funds and grants for unexpected hardships",
    keywords: ["relief fund", "veteran grant", "hardship grant"],
  },
  {
    name: "Pension Assistance",
    slug: "pension-assistance",
    icon: Users,
    description: "Help applying for VA pension and related income support",
    keywords: ["pension", "VA pension", "Aid and Attendance"],
  },
  {
    name: "Nonprofit Financial Support",
    slug: "nonprofit-financial-support",
    icon: Users,
    description: "Veteran-serving nonprofits that provide direct financial help",
    keywords: ["nonprofit", "charity", "veteran nonprofit"],
  },
  {
    name: "Benefits Counseling",
    slug: "benefits-counseling",
    icon: Users,
    description: "Counseling on how earned benefits interact with your overall finances",
    keywords: ["benefits", "VA benefits", "benefits counseling"],
  },
];
