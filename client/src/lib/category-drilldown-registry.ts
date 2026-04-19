import { Brain, HeartPulse, Briefcase, FileText, Home as HomeIcon, DollarSign, Flower2, Medal, Shield, Scale, GraduationCap, Users, HandHeart, AlertTriangle, Utensils, Car, Sparkles } from "lucide-react";
import type { CategoryDrilldownConfig } from "@/components/category-drilldown";
import { MH_SUBCATEGORIES } from "@/lib/mh-subcategories";
import { HC_SUBCATEGORIES } from "@/lib/hc-subcategories";
import { EMP_SUBCATEGORIES } from "@/lib/emp-subcategories";
import { BENEFITS_SUBCATEGORIES } from "@/lib/benefits-subcategories";
import { HOUSING_SUBCATEGORIES } from "@/lib/housing-subcategories";
import { FIN_SUBCATEGORIES } from "@/lib/fin-subcategories";
import { EOL_SUBCATEGORIES } from "@/lib/eol-subcategories";
import { DV_SUBCATEGORIES } from "@/lib/dv-subcategories";
import { INSURANCE_SUBCATEGORIES } from "@/lib/insurance-subcategories";
import { LEGAL_SUBCATEGORIES } from "@/lib/legal-subcategories";
import { EDU_SUBCATEGORIES } from "@/lib/edu-subcategories";
import { FAMILY_SUBCATEGORIES } from "@/lib/family-subcategories";
import { CS_SUBCATEGORIES } from "@/lib/cs-subcategories";
import { CRISIS_SUBCATEGORIES } from "@/lib/crisis-subcategories";
import { FOOD_SUBCATEGORIES } from "@/lib/food-subcategories";
import { TRANSPORT_SUBCATEGORIES } from "@/lib/transport-subcategories";
import { WELLNESS_SUBCATEGORIES } from "@/lib/wellness-subcategories";

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
    viewAllSlug: "healthcare",
    aiContext: "healthcare",
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
  // Slice 3b additions: Insurance + Legal — first new categories rendered via
  // the shared drilldown system. Both viewAllSlugs match canonical taxonomy
  // (`insurance`, `legal-services`) so the existing /resources?category=
  // filter resolves the right rows without any backend change.
  "insurance": {
    testidPrefix: "ins",
    trackPrefix: "ins",
    viewAllSlug: "insurance",
    aiContext: "insurance",
    name: "Insurance Services",
    icon: Shield,
    iconBgClass: "bg-cyan-50",
    iconTextClass: "text-cyan-700",
    description:
      "Health, life, auto, home, disability, long-term care, and supplemental insurance options for veterans and their families.",
    subcategories: INSURANCE_SUBCATEGORIES,
    introLinks: [
      { slug: "health-insurance", label: "Health Insurance", testidKey: "health" },
      { slug: "life-insurance", label: "Life Insurance", testidKey: "life" },
    ],
  },
  "legal-services": {
    testidPrefix: "legal",
    trackPrefix: "legal",
    viewAllSlug: "legal-services",
    aiContext: "legal-services",
    name: "Legal Services",
    icon: Scale,
    iconBgClass: "bg-indigo-50",
    iconTextClass: "text-indigo-700",
    description:
      "Estate planning, VA appeals legal help, family law, consumer protection, expungement, landlord-tenant, and veteran-focused legal services.",
    subcategories: LEGAL_SUBCATEGORIES,
    introLinks: [
      { slug: "estate-planning-wills", label: "Estate Planning & Wills", testidKey: "estate" },
      { slug: "va-claims-appeals-legal", label: "VA Claims & Appeals", testidKey: "appeals" },
    ],
  },
  // Slice 3c additions: Education & Training + Family Support — selective
  // conversion of 2 high-value flat categories. viewAllSlugs match canonical
  // taxonomy (`education-training`, `family-support`).
  "education-training": {
    testidPrefix: "edu",
    trackPrefix: "edu",
    viewAllSlug: "education-training",
    aiContext: "education-training",
    name: "Education & Training",
    icon: GraduationCap,
    iconBgClass: "bg-sky-50",
    iconTextClass: "text-sky-700",
    description:
      "GI Bill, Vocational Rehabilitation, scholarships, certifications, apprenticeships, and education pathways for veterans and their families.",
    subcategories: EDU_SUBCATEGORIES,
    introLinks: [
      { slug: "gi-bill-va-education", label: "GI Bill & VA Education Benefits", testidKey: "gibill" },
      { slug: "vocational-rehab-vre", label: "Vocational Rehabilitation", testidKey: "vre" },
    ],
  },
  "family-support": {
    testidPrefix: "fam",
    trackPrefix: "fam",
    viewAllSlug: "family-support",
    aiContext: "family-support",
    name: "Family Support",
    icon: Users,
    iconBgClass: "bg-rose-50",
    iconTextClass: "text-rose-700",
    description:
      "Spouse support, children's programs, caregiver assistance, survivor benefits, and family-focused services for the whole veteran household.",
    subcategories: FAMILY_SUBCATEGORIES,
    introLinks: [
      { slug: "spouse-support", label: "Spouse Support", testidKey: "spouse" },
      { slug: "caregiver-support", label: "Caregiver Support", testidKey: "caregiver" },
    ],
  },
  // Slice 3d-B addition: Community Support drilldown — landed after Phase 1
  // additive retag populated the recreation / social / connection subs.
  // viewAllSlug matches canonical taxonomy (`community-support`).
  "community-support": {
    testidPrefix: "cs",
    trackPrefix: "cs",
    viewAllSlug: "community-support",
    aiContext: "community-support",
    name: "Community Support",
    icon: HandHeart,
    iconBgClass: "bg-violet-50",
    iconTextClass: "text-violet-700",
    description:
      "Veteran social groups, adaptive recreation, volunteer missions, family activities, retreats, and creative outlets that build connection and camaraderie.",
    subcategories: CS_SUBCATEGORIES,
    introLinks: [
      { slug: "veteran-social-groups", label: "Veteran Social Groups", testidKey: "social" },
      { slug: "adaptive-recreation", label: "Adaptive Recreation", testidKey: "adaptive" },
    ],
  },
  // Step 1-2 (2026-04-19) — wire the 4 remaining canonical categories so every
  // canonical resource category has a working drilldown. viewAllSlug values
  // match RESOURCE_CATEGORY_SLUGS (compile-time guarded).
  "crisis-help": {
    testidPrefix: "crisis",
    trackPrefix: "crisis",
    viewAllSlug: "crisis-help",
    aiContext: "crisis-help",
    name: "Crisis Help",
    icon: AlertTriangle,
    iconBgClass: "bg-red-50",
    iconTextClass: "text-red-700",
    description:
      "Veterans Crisis Line, suicide prevention, emergency mental health, mobile crisis teams, domestic violence safety, and substance abuse crisis support.",
    subcategories: CRISIS_SUBCATEGORIES,
    introLinks: [
      { slug: "veterans-crisis-line", label: "Veterans Crisis Line", testidKey: "crisisline" },
      { slug: "emergency-mental-health", label: "Emergency Mental Health", testidKey: "emh" },
    ],
  },
  "food-assistance": {
    testidPrefix: "food",
    trackPrefix: "food",
    viewAllSlug: "food-assistance",
    aiContext: "food-assistance",
    name: "Food Assistance",
    icon: Utensils,
    iconBgClass: "bg-amber-50",
    iconTextClass: "text-amber-700",
    description:
      "Food banks, food pantries, SNAP application help, community kitchens, Meals on Wheels, and veteran-specific meal programs across South Carolina.",
    subcategories: FOOD_SUBCATEGORIES,
    introLinks: [
      { slug: "food-banks", label: "Food Banks", testidKey: "banks" },
      { slug: "snap-assistance", label: "SNAP Assistance", testidKey: "snap" },
    ],
  },
  "transportation": {
    testidPrefix: "transport",
    trackPrefix: "transport",
    viewAllSlug: "transportation",
    aiContext: "transportation",
    name: "Transportation",
    icon: Car,
    iconBgClass: "bg-blue-50",
    iconTextClass: "text-blue-700",
    description:
      "DAV transportation, rides to VA medical appointments, volunteer driver programs, rideshare assistance, and public transit help for veterans.",
    subcategories: TRANSPORT_SUBCATEGORIES,
    introLinks: [
      { slug: "va-medical-transport", label: "VA Medical Transport", testidKey: "vamed" },
      { slug: "volunteer-driver-programs", label: "Volunteer Driver Programs", testidKey: "vol" },
    ],
  },
  "wellness-recovery": {
    testidPrefix: "wellness",
    trackPrefix: "wellness",
    viewAllSlug: "wellness-recovery",
    aiContext: "wellness-recovery",
    name: "Wellness & Recovery",
    icon: Sparkles,
    iconBgClass: "bg-teal-50",
    iconTextClass: "text-teal-700",
    description:
      "Veteran recovery programs, outpatient treatment, detox, medication-assisted treatment, peer recovery groups, and long-term recovery support services.",
    subcategories: WELLNESS_SUBCATEGORIES,
    introLinks: [
      { slug: "veteran-recovery-programs", label: "Veteran Recovery Programs", testidKey: "vrp" },
      { slug: "peer-recovery-groups", label: "Peer Recovery Groups", testidKey: "peer" },
    ],
  },
};
