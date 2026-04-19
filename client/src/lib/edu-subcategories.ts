import {
  GraduationCap,
  BookOpen,
  Award,
  Wrench,
  Laptop,
  ClipboardCheck,
  DollarSign,
  Building2,
  Users,
  School,
  type LucideIcon,
} from "lucide-react";

export interface EduSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
}

export const EDU_SUBCATEGORIES: EduSubcategory[] = [
  {
    name: "GI Bill Assistance",
    slug: "gi-bill-assistance",
    icon: GraduationCap,
    description: "Post-9/11 GI Bill, Montgomery GI Bill, and transfer-of-benefits guidance",
  },
  {
    name: "Tuition Assistance",
    slug: "tuition-assistance",
    icon: DollarSign,
    description: "State and federal tuition assistance, Yellow Ribbon, and gap-cost coverage",
  },
  {
    name: "Trade Schools & Vocational",
    slug: "trade-schools",
    icon: Wrench,
    description: "Vocational trade schools and skilled-trades training programs for veterans",
  },
  {
    name: "Technical Colleges",
    slug: "technical-colleges",
    icon: School,
    description: "Technical colleges with veteran programs and workforce-aligned training",
  },
  {
    name: "College & University Programs",
    slug: "college-university",
    icon: Building2,
    description: "Veteran-friendly colleges, universities, and degree completion programs",
  },
  {
    name: "Veteran Student Services",
    slug: "veteran-student-services",
    icon: Users,
    description: "On-campus VA-certified offices that help veterans navigate enrollment and benefits",
  },
  {
    name: "Certifications & Licensing",
    slug: "certifications-licensing",
    icon: ClipboardCheck,
    description: "Professional certifications, license reimbursement, and credentialing assistance",
  },
  {
    name: "Online Learning",
    slug: "online-learning",
    icon: Laptop,
    description: "Veteran-friendly online universities, distance learning, and remote degree programs",
  },
  {
    name: "Continuing Education",
    slug: "continuing-education",
    icon: BookOpen,
    description: "Adult learner and continuing education programs designed for working veterans",
  },
  {
    name: "Education Counseling",
    slug: "education-counseling",
    icon: Award,
    description: "One-on-one counseling for choosing a school, program, or career path",
  },
  {
    name: "Training",
    slug: "training",
    icon: Users,
    description: "Job-focused training programs and short-term skill-building courses",
  },
];
