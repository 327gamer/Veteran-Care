import { Brain, HeartPulse, Briefcase, FileText, Home as HomeIcon, DollarSign, Flower2, Medal } from "lucide-react";
import type { CategoryDrilldownConfig } from "@/components/category-drilldown";
import { MH_SUBCATEGORIES } from "@/lib/mh-subcategories";
import { HC_SUBCATEGORIES } from "@/lib/hc-subcategories";
import { EMP_SUBCATEGORIES } from "@/lib/emp-subcategories";
import { BENEFITS_SUBCATEGORIES } from "@/lib/benefits-subcategories";
import { HOUSING_SUBCATEGORIES } from "@/lib/housing-subcategories";
import { FIN_SUBCATEGORIES } from "@/lib/fin-subcategories";
import { EOL_SUBCATEGORIES } from "@/lib/eol-subcategories";
import { DV_SUBCATEGORIES } from "@/lib/dv-subcategories";

/**
 * Step 3 Slice 3a — single source of truth for category drilldown config.
 *
 * Each entry produces props for `<CategoryDrilldown />`. Values mirror what
 * the eight legacy per-category pages rendered before the refactor —
 * test-ids, analytics event names, AI banner contexts, viewAll URLs, intro
 * link labels, accent colors are all preserved 1:1 to keep behavior
 * identical.
 *
 * Keys are the route paths (without leading slash) so wrappers stay obvious.
 * Slice 3b/3c will add Insurance, Legal, etc. into this same registry.
 */
export const CATEGORY_DRILLDOWNS: Record<string, CategoryDrilldownConfig> = {
  "mental-health": {
    testidPrefix: "mh",
    trackPrefix: "mh",
    viewAllSlug: "mental-health",
    aiContext: "mental-health",
    name: "Mental Health",
    icon: Brain,
    iconBgClass: "bg-purple-50",
    iconTextClass: "text-purple-700",
    description:
      "Counseling, crisis support, substance recovery, peer groups, and specialized mental health resources for veterans and their families.",
    subcategories: MH_SUBCATEGORIES,
    introLinks: [
      { slug: "crisis-suicide-prevention", label: "Crisis & Suicide Prevention", testidKey: "crisis" },
      { slug: "counseling-therapy", label: "Counseling & Therapy", testidKey: "counseling" },
    ],
  },
  "healthcare": {
    testidPrefix: "hc",
    trackPrefix: "hc",
    viewAllSlug: "healthcare-services",
    aiContext: "healthcare-services",
    name: "Healthcare",
    icon: HeartPulse,
    iconBgClass: "bg-red-50",
    iconTextClass: "text-red-700",
    description:
      "VA enrollment, primary and specialty care, rehabilitation, telehealth, preventive wellness, and family health support for veterans.",
    subcategories: HC_SUBCATEGORIES,
    introLinks: [
      { slug: "va-healthcare-enrollment", label: "VA Healthcare Enrollment", testidKey: "enrollment" },
      { slug: "primary-care", label: "Primary Care", testidKey: "primary" },
    ],
  },
  "employment": {
    testidPrefix: "emp",
    trackPrefix: "emp",
    viewAllSlug: "employment-support",
    aiContext: "employment-support",
    name: "Employment Support",
    icon: Briefcase,
    iconBgClass: "bg-emerald-50",
    iconTextClass: "text-emerald-700",
    description:
      "Job placement, career coaching, vocational rehab, apprenticeships, and entrepreneurship resources for veterans.",
    subcategories: EMP_SUBCATEGORIES,
    introLinks: [
      { slug: "job-placement-programs", label: "Job Placement Programs", testidKey: "jobs" },
      { slug: "vocational-rehabilitation", label: "Vocational Rehabilitation", testidKey: "vocrehab" },
    ],
  },
  "benefits-assistance": {
    testidPrefix: "benefits",
    trackPrefix: "benefits",
    viewAllSlug: "benefits-assistance",
    aiContext: "benefits-assistance",
    name: "Benefits Assistance",
    icon: FileText,
    iconBgClass: "bg-blue-50",
    iconTextClass: "text-blue-700",
    description:
      "Military records, disability claims, compensation, pension, appeals guidance, and VA enrollment support for veterans and their families.",
    subcategories: BENEFITS_SUBCATEGORIES,
    introLinks: [
      { slug: "military-records-dd214", label: "Military Records & DD214", testidKey: "records" },
      { slug: "disability-claims-filing", label: "Disability Claims & Filing", testidKey: "claims" },
    ],
    showSupportButton: false,
    disclaimer:
      "Processes and requirements may change. Please confirm with official VA or accredited representatives.",
  },
  "housing": {
    testidPrefix: "housing",
    trackPrefix: "housing",
    viewAllSlug: "housing-home",
    aiContext: "housing-home",
    name: "Housing & Home Services",
    icon: HomeIcon,
    iconBgClass: "bg-orange-50",
    iconTextClass: "text-orange-700",
    description:
      "Emergency shelter, rental help, VA home loans, accessibility modifications, and housing programs for veterans and their families.",
    subcategories: HOUSING_SUBCATEGORIES,
    introLinks: [
      { slug: "emergency-housing-homeless-shelters", label: "Emergency Housing", testidKey: "emergency" },
      { slug: "va-housing-benefits", label: "VA Housing Benefits", testidKey: "va" },
    ],
  },
  "financial-services": {
    testidPrefix: "fin",
    trackPrefix: "fin",
    viewAllSlug: "financial-credit",
    aiContext: "financial-credit",
    name: "Financial & Credit Services",
    icon: DollarSign,
    iconBgClass: "bg-slate-100",
    iconTextClass: "text-slate-700",
    description:
      "Mortgages, personal loans, credit repair, debt relief, financial coaching, and banking support for veterans and their families.",
    subcategories: FIN_SUBCATEGORIES,
    introLinks: [
      { slug: "mortgages-home-loans", label: "Mortgages / Home Loans", testidKey: "mortgages" },
      { slug: "credit-repair", label: "Credit Repair", testidKey: "credit" },
    ],
  },
  "end-of-life": {
    testidPrefix: "eol",
    trackPrefix: "eol",
    viewAllSlug: "end-of-life-services",
    aiContext: "end-of-life-services",
    name: "End of Life Services",
    icon: Flower2,
    iconBgClass: "bg-stone-100",
    iconTextClass: "text-stone-600",
    description:
      "Support for veterans, family members, caregivers, and case managers navigating end-of-life care, hospice, final arrangements, family benefits, and legal planning.",
    subcategories: EOL_SUBCATEGORIES,
    introLinks: [
      { slug: "hospice-palliative-care", label: "Hospice & Palliative Care", testidKey: "hospice" },
      { slug: "va-death-benefits-survivor-benefits", label: "VA Death Benefits & Survivor Benefits", testidKey: "benefits" },
    ],
  },
  "disabled-veterans": {
    testidPrefix: "dv",
    trackPrefix: "dv",
    viewAllSlug: "disabled-veterans",
    aiContext: "disabled-veterans",
    name: "Disabled Veterans",
    icon: Medal,
    iconBgClass: "bg-amber-50",
    iconTextClass: "text-amber-700",
    description:
      "Resources, benefits, housing, transportation, employment, and advocacy specifically for disabled veterans and their families.",
    subcategories: DV_SUBCATEGORIES,
    introLinks: [
      { slug: "disability-benefits-claims", label: "Disability Benefits & Claims", testidKey: "benefits" },
      { slug: "healthcare-rehabilitation", label: "Healthcare & Rehabilitation", testidKey: "health" },
    ],
  },
};
