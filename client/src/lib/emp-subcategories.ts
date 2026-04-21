import {
  MapPin,
  FileText,
  GraduationCap,
  Hammer,
  Building2,
  Rocket,
  Briefcase,
  type LucideIcon,
  Users,
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
    name: "Resume Assistance",
    slug: "resume-assistance",
    icon: Users,
    description: "Help building and tailoring your resume for civilian roles.",
    keywords: [],
  },
  {
    name: "Career Counseling",
    slug: "career-counseling",
    icon: Users,
    description: "Guidance choosing a career path that fits your skills, experience, and goals.",
    keywords: [],
  },
  {
    name: "Federal Employment",
    slug: "federal-employment",
    icon: Users,
    description: "Federal hiring pathways including USAJOBS, VRA, and veteran preference.",
    keywords: [],
  },
  {
    name: "State Employment",
    slug: "state-employment",
    icon: Users,
    description: "State of South Carolina jobs with veteran hiring preference.",
    keywords: [],
  },
  {
    name: "Entrepreneurship Support",
    slug: "entrepreneurship-support",
    icon: Users,
    description: "Small business coaching, VBOC, and resources for veteran entrepreneurs.",
    keywords: [],
  },
  {
    name: "Apprenticeships",
    slug: "apprenticeships",
    icon: Users,
    description: "Registered apprenticeships that combine paid work with training.",
    keywords: [],
  },
  {
    name: "Skilled Trades Training",
    slug: "skilled-trades-training",
    icon: Users,
    description: "Training paths into skilled trades like welding, electrical, HVAC, and plumbing.",
    keywords: [],
  },
  {
    name: "Certification Programs",
    slug: "certification-programs",
    icon: Users,
    description: "Industry certifications that translate military experience into civilian credentials.",
    keywords: [],
  },
  {
    name: "Career Pathways",
    slug: "career-pathways",
    icon: Users,
    description: "Structured career pathway programs that ladder you from training to placement.",
    keywords: [],
  },
  {
    name: "Building & Construction",
    slug: "building-construction",
    icon: Users,
    description: "Construction-industry employment and training pipelines.",
    keywords: [],
  },
  {
    name: "Manufacturing",
    slug: "manufacturing",
    icon: Users,
    description: "Manufacturing employers and training pipelines.",
    keywords: [],
  },
];
