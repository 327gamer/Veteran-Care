import {
  MapPin,
  FileText,
  GraduationCap,
  Hammer,
  Building2,
  Rocket,
  Briefcase,
  Landmark,
  type LucideIcon,
} from "lucide-react";

export interface EmpSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
  keywords: string[];
}

// Founder spec T003 2026-04-30: canonical 8-subcategory Employment /
// Training taxonomy. Trimmed from 18 → 8 entries (display-only). Removed:
// resume-assistance + career-counseling (duplicates of resume-career-coaching),
// entrepreneurship-support (duplicate of entrepreneurship-small-business-support),
// apprenticeships + skilled-trades-training (duplicates of apprenticeships-
// skilled-trades), certification-programs (belongs under education-training/
// certifications-licensing), state-employment (South Carolina-specific local
// data leak — does not belong in the national UI list), career-pathways (too
// vague), and building-construction + manufacturing (industry verticals, not
// service types). Server-side partner_subcategories slugs are kept in 1:1
// alignment with this list via server/routes.ts ensureAllPartnerSubcategories
// + idempotent DEACTIVATE migration for the 4 old DB slugs (job-search-
// placement, resume-interview-prep, career-training, entrepreneurship-business).
export const EMP_SUBCATEGORIES: EmpSubcategory[] = [
  {
    name: "Job Placement Programs & Partners",
    slug: "job-placement-programs",
    icon: MapPin,
    description: "Direct job placement services, staffing, and employment partners for veterans",
    keywords: ["job placement", "employment", "hiring", "staffing", "job match", "career placement", "partners"],
  },
  {
    name: "Resume & Career Coaching",
    slug: "resume-career-coaching",
    icon: FileText,
    description: "Resume writing, interview prep, and career counseling",
    keywords: ["resume", "career coaching", "interview", "job search", "career counseling", "LinkedIn"],
  },
  {
    name: "Vocational Rehabilitation",
    slug: "vocational-rehabilitation",
    icon: GraduationCap,
    description: "VA Vocational Rehab (Chapter 31) and skills retraining programs",
    keywords: ["vocational", "rehabilitation", "VR&E", "Chapter 31", "retraining", "skills"],
  },
  {
    name: "Apprenticeships & Skilled Trades",
    slug: "apprenticeships-skilled-trades",
    icon: Hammer,
    description: "Trade programs, apprenticeships, and hands-on career training",
    keywords: ["apprenticeship", "trades", "construction", "welding", "electrician", "plumbing", "CDL"],
  },
  {
    name: "Veteran-Friendly Employers",
    slug: "veteran-friendly-employers",
    icon: Building2,
    description: "Companies and organizations committed to hiring veterans",
    keywords: ["veteran friendly", "employer", "hiring veterans", "military friendly", "corporate"],
  },
  {
    name: "Entrepreneurship & Small Business Support",
    slug: "entrepreneurship-small-business-support",
    icon: Rocket,
    description: "Start or grow a business with veteran entrepreneur resources",
    keywords: ["entrepreneur", "small business", "startup", "SBA", "veteran owned", "business plan"],
  },
  {
    name: "DVOP / Workforce Programs",
    slug: "dvop-workforce-programs",
    icon: Briefcase,
    description: "Disabled veteran outreach, workforce centers, and government programs",
    keywords: ["DVOP", "workforce", "LVER", "Department of Labor", "employment services", "job center"],
  },
  {
    name: "Federal Employment",
    slug: "federal-employment",
    icon: Landmark,
    description: "Federal hiring pathways including USAJOBS, VRA, and veteran preference",
    keywords: ["federal", "USAJOBS", "VRA", "veteran preference", "government jobs", "civil service"],
  },
];
