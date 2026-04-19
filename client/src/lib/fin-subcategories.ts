import {
  Home,
  Wallet,
  CreditCard,
  DollarSign,
  PiggyBank,
  Building2,
  RefreshCw,
  type LucideIcon,
  Users,
} from "lucide-react";

export interface FinSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
  keywords: string[];
}

export const FIN_SUBCATEGORIES: FinSubcategory[] = [
  {
    name: "Mortgages / Home Loans",
    slug: "mortgages-home-loans",
    icon: Home,
    description: "VA home loans, mortgage assistance, down payment programs, and home buying support",
    keywords: ["mortgage", "home loan", "VA loan", "down payment", "home buying", "FHA"],
  },
  {
    name: "Personal Loans",
    slug: "personal-loans",
    icon: Wallet,
    description: "Personal lending, emergency loans, and veteran-friendly loan programs",
    keywords: ["personal loan", "lending", "emergency loan", "installment loan", "veteran loan"],
  },
  {
    name: "Credit Repair",
    slug: "credit-repair",
    icon: CreditCard,
    description: "Credit counseling, score improvement, dispute resolution, and credit rebuilding",
    keywords: ["credit repair", "credit score", "credit counseling", "dispute", "credit report"],
  },
  {
    name: "Debt Relief",
    slug: "debt-relief",
    icon: DollarSign,
    description: "Debt consolidation, negotiation, management plans, and financial relief programs",
    keywords: ["debt relief", "debt consolidation", "debt management", "negotiation", "bankruptcy"],
  },
  {
    name: "Budgeting & Financial Coaching",
    slug: "budgeting-financial-coaching",
    icon: PiggyBank,
    description: "Financial literacy, budgeting tools, coaching, and money management education",
    keywords: ["budgeting", "financial coaching", "financial literacy", "money management", "savings"],
  },
  {
    name: "Banking / Lending Support",
    slug: "banking-lending-support",
    icon: Building2,
    description: "Veteran-friendly banks, credit unions, savings programs, and lending institutions",
    keywords: ["banking", "credit union", "savings", "lending", "veteran bank", "financial institution"],
  },
  {
    name: "Refinancing",
    slug: "refinancing",
    icon: RefreshCw,
    description: "VA refinance programs, IRRRL, rate reduction, and mortgage refinancing support",
    keywords: ["refinancing", "IRRRL", "streamline", "rate reduction", "cash-out", "VA refinance"],
  },

  {
    name: "Emergency Financial Assistance",
    slug: "emergency-financial-assistance",
    icon: Users,
    description: "Short-term emergency aid for veterans facing a financial crisis.",
    keywords: [],
  },
  {
    name: "Utility Bill Assistance",
    slug: "utility-bill-assistance",
    icon: Users,
    description: "Help paying electric, water, and heating bills.",
    keywords: [],
  },
  {
    name: "Veteran Relief Funds",
    slug: "veteran-relief-funds",
    icon: Users,
    description: "Veteran-specific relief funds and grants for unexpected hardships.",
    keywords: [],
  },
  {
    name: "Budgeting & Financial Planning",
    slug: "budgeting-financial-planning",
    icon: Users,
    description: "Free budgeting and financial planning support tailored to veterans.",
    keywords: [],
  },
  {
    name: "Debt Counseling",
    slug: "debt-counseling",
    icon: Users,
    description: "Nonprofit debt counseling and consolidation guidance.",
    keywords: [],
  },
  {
    name: "Benefits Counseling",
    slug: "benefits-counseling",
    icon: Users,
    description: "Counseling on how earned benefits interact with your overall finances.",
    keywords: [],
  },
  {
    name: "Nonprofit Financial Support",
    slug: "nonprofit-financial-support",
    icon: Users,
    description: "Veteran-serving nonprofits that provide direct financial help.",
    keywords: [],
  },
  {
    name: "Pension Assistance",
    slug: "pension-assistance",
    icon: Users,
    description: "Help applying for VA pension and related income support.",
    keywords: [],
  },
];
