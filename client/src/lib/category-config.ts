import {
  FileText,
  HeartPulse,
  ShieldAlert,
  Brain,
  Home,
  Briefcase,
  GraduationCap,
  Scale,
  DollarSign,
  Users,
  FileArchive,
  Flag,
  Car,
  Heart,
  HandHeart,
  Flower2,
  Medal,
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
  "mental-health": { icon: Brain, color: "text-purple-600", bg: "bg-purple-50", desc: "PTSD, TBI, counseling, and crisis support" },
  "disabled-veterans": { icon: Medal, color: "text-amber-700", bg: "bg-amber-50", desc: "Benefits, housing, employment, and advocacy for disabled veterans" },
  "housing-home": { icon: Home, color: "text-orange-600", bg: "bg-orange-50", desc: "Emergency shelter, rental help, VA home loans, and housing programs" },
  "food-assistance": { icon: Heart, color: "text-rose-600", bg: "bg-rose-50", desc: "Food banks, meal programs, and nutrition support" },
  "benefits-assistance": { icon: FileText, color: "text-blue-600", bg: "bg-blue-50", desc: "Military records, disability claims, compensation, pension, and appeals" },
  "family-support": { icon: Users, color: "text-pink-600", bg: "bg-pink-50", desc: "Support for spouses, dependents, and caregivers" },
  "community-support": { icon: HandHeart, color: "text-violet-600", bg: "bg-violet-50", desc: "Veteran organizations, volunteer groups, and peer networks" },
  "employment-support": { icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50", desc: "Job search, resume help, and career support" },
  "education-training": { icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50", desc: "GI Bill, trade schools, certifications, and training programs" },
  "transportation": { icon: Car, color: "text-teal-600", bg: "bg-teal-50", desc: "Travel assistance and vehicle grants" },
  "financial-credit": { icon: DollarSign, color: "text-slate-600", bg: "bg-slate-50", desc: "Mortgages, credit repair, lending, and financial coaching" },
  "legal-services": { icon: Scale, color: "text-slate-600", bg: "bg-slate-50", desc: "Legal aid, disability appeals, and estate planning" },
  "healthcare-services": { icon: HeartPulse, color: "text-red-600", bg: "bg-red-50", desc: "VA health, TRICARE, and community care" },
  "wellness-recovery": { icon: Heart, color: "text-rose-600", bg: "bg-rose-50", desc: "Wellness, recovery programs, and holistic support" },
  "end-of-life-services": { icon: Flower2, color: "text-stone-600", bg: "bg-stone-50", desc: "Hospice, funeral services, estate planning, and survivor benefits" },
  "insurance": { icon: FileText, color: "text-blue-600", bg: "bg-blue-50", desc: "Insurance services and coverage" },
  "auto-services": { icon: Car, color: "text-teal-600", bg: "bg-teal-50", desc: "Auto repair, maintenance, and vehicle services" },
  "travel-services": { icon: Flag, color: "text-cyan-600", bg: "bg-cyan-50", desc: "Travel assistance and vacation services" },
  "military-records": { icon: FileArchive, color: "text-amber-600", bg: "bg-amber-50", desc: "DD214, corrections, and medals" },
  "transition": { icon: Flag, color: "text-cyan-600", bg: "bg-cyan-50", desc: "Returning to civilian life" },
};

import { toCanonical, LEGACY_TO_CANONICAL } from "@shared/canonical-categories";
const slugAliases = LEGACY_TO_CANONICAL;

const defaultConfig: CategoryDisplayConfig = {
  icon: FileText,
  color: "text-gray-600",
  bg: "bg-gray-50",
  desc: "",
};

export function getCategoryConfig(slug: string): CategoryDisplayConfig {
  return configBySlug[toCanonical(slug)] || defaultConfig;
}

export { toCanonical as toCanonicalSlug } from "@shared/canonical-categories";

export interface SupabaseCategory {
  id: string;
  name: string;
  slug: string;
}
