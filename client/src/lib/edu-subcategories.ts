import {
  GraduationCap,
  BookOpen,
  Award,
  Briefcase,
  Wrench,
  Laptop,
  ClipboardCheck,
  DollarSign,
  Building2,
  type LucideIcon,
  Users,
} from "lucide-react";

export interface EduSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
}

export const EDU_SUBCATEGORIES: EduSubcategory[] = [
  {
    name: "GI Bill & VA Education Benefits",
    slug: "gi-bill-va-education",
    icon: GraduationCap,
    description: "Post-9/11 GI Bill, Montgomery GI Bill, transfer of benefits, and VA education program enrollment",
  },
  {
    name: "Vocational Rehabilitation (VR&E)",
    slug: "vocational-rehab-vre",
    icon: Wrench,
    description: "Chapter 31 Veteran Readiness & Employment, retraining, and disability-related career services",
  },
  {
    name: "Tuition Assistance & Yellow Ribbon",
    slug: "tuition-assistance-yellow-ribbon",
    icon: DollarSign,
    description: "Active-duty tuition assistance, Yellow Ribbon program participation, and gap-cost coverage",
  },
  {
    name: "Scholarships & Grants",
    slug: "scholarships-grants",
    icon: Award,
    description: "Veteran-specific scholarships, dependent grants, and military family education awards",
  },
  {
    name: "Certifications & Licensing",
    slug: "certifications-licensing",
    icon: ClipboardCheck,
    description: "Professional certifications, license reimbursement, and credentialing assistance for veterans",
  },
  {
    name: "Apprenticeships & On-the-Job Training",
    slug: "apprenticeships-ojt",
    icon: Briefcase,
    description: "Registered apprenticeships, on-the-job training programs, and skilled-trade pathways",
  },
  {
    name: "Online Learning & Degree Programs",
    slug: "online-learning-degrees",
    icon: Laptop,
    description: "Veteran-friendly online universities, degree completion programs, and distance learning options",
  },
  {
    name: "Tutoring & Test Prep",
    slug: "tutoring-test-prep",
    icon: BookOpen,
    description: "Academic tutoring, GED prep, college entrance exam prep, and study support resources",
  },
  {
    name: "Veteran-Friendly Schools",
    slug: "veteran-friendly-schools",
    icon: Building2,
    description: "Colleges, universities, and trade schools with strong veteran services and support offices",
  },

  {
    name: "Veteran Student Services",
    slug: "veteran-student-services",
    icon: Users,
    description: "On-campus VA-certified student services offices that help veterans navigate enrollment, benefits, and academic life.",
  },
  {
    name: "Technical Colleges",
    slug: "technical-colleges",
    icon: Users,
    description: "South Carolina technical colleges with veteran programs and workforce-aligned training.",
  },
  {
    name: "GI Bill Assistance",
    slug: "gi-bill-assistance",
    icon: Users,
    description: "Help applying for and using Post-9/11 GI Bill, Montgomery GI Bill, and transfer benefits.",
  },
  {
    name: "Tuition Assistance",
    slug: "tuition-assistance",
    icon: Users,
    description: "State and federal tuition assistance programs for veterans and dependents.",
  },
  {
    name: "Education Counseling",
    slug: "education-counseling",
    icon: Users,
    description: "One-on-one education counseling for veterans choosing a school, program, or career path.",
  },
  {
    name: "Continuing Education",
    slug: "continuing-education",
    icon: Users,
    description: "Adult learner and continuing education programs designed for working veterans.",
  },
  {
    name: "Training",
    slug: "training",
    icon: Users,
    description: "Job-focused training programs across South Carolina.",
  },
  {
    name: "Building & Construction",
    slug: "building-construction",
    icon: Users,
    description: "Education and training paths into construction trades.",
  },
  {
    name: "Manufacturing",
    slug: "manufacturing",
    icon: Users,
    description: "Education and training paths into manufacturing careers.",
  },
];
