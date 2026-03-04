import {
  FileText,
  HeartPulse,
  ShieldAlert,
  Brain,
  Home,
  Briefcase,
  GraduationCap,
  Scale,
  Users,
  FileArchive,
  Flag,
  Car,
  type LucideIcon,
} from "lucide-react";

export interface CategoryDisplayConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
  desc: string;
  variant?: string;
}

const configBySlug: Record<string, CategoryDisplayConfig> = {
  "crisis-help": { icon: ShieldAlert, color: "text-rose-600", bg: "bg-rose-50", desc: "Emergency support and suicide prevention", variant: "destructive" },
  "va-benefits": { icon: FileText, color: "text-blue-600", bg: "bg-blue-50", desc: "Compensation, pension, and appeals" },
  "healthcare": { icon: HeartPulse, color: "text-red-600", bg: "bg-red-50", desc: "VA health, TRICARE, and community care" },
  "mental-health": { icon: Brain, color: "text-purple-600", bg: "bg-purple-50", desc: "PTSD, TBI, and counseling support" },
  "housing": { icon: Home, color: "text-orange-600", bg: "bg-orange-50", desc: "Loans, homelessness, and grants" },
  "employment": { icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50", desc: "Job search, resume help, and training" },
  "education": { icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50", desc: "College, trade school, and VET TEC" },
  "legal": { icon: Scale, color: "text-slate-600", bg: "bg-slate-50", desc: "Legal aid, tax relief, and advice" },
  "financial": { icon: Scale, color: "text-slate-600", bg: "bg-slate-50", desc: "Financial guidance and debt assistance" },
  "family-support": { icon: Users, color: "text-pink-600", bg: "bg-pink-50", desc: "Support for spouses and dependents" },
  "military-records": { icon: FileArchive, color: "text-amber-600", bg: "bg-amber-50", desc: "DD214, corrections, and medals" },
  "transition": { icon: Flag, color: "text-cyan-600", bg: "bg-cyan-50", desc: "Returning to civilian life" },
  "transportation": { icon: Car, color: "text-teal-600", bg: "bg-teal-50", desc: "Travel assistance and vehicle grants" },
};

const defaultConfig: CategoryDisplayConfig = {
  icon: FileText,
  color: "text-gray-600",
  bg: "bg-gray-50",
  desc: "",
};

export function getCategoryConfig(slug: string): CategoryDisplayConfig {
  return configBySlug[slug] || defaultConfig;
}

export interface SupabaseCategory {
  id: string;
  name: string;
  slug: string;
}
