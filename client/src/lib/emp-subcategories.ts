import {
  MapPin,
  FileText,
  GraduationCap,
  Hammer,
  Building2,
  Rocket,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export interface EmpSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
  keywords: string[];
}

export const EMP_SUBCATEGORIES: EmpSubcategory[] = [
  {
    name: "Job Placement Programs",
    slug: "job-placement-programs",
    icon: MapPin,
    description: "Direct job placement services and employment matching for veterans",
    keywords: ["job placement", "employment", "hiring", "staffing", "job match", "career placement"],
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
];
