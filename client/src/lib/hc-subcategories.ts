import {
  ClipboardList,
  Stethoscope,
  HeartPulse,
  Activity,
  Monitor,
  ShieldCheck,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface HcSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
  keywords: string[];
}

export const HC_SUBCATEGORIES: HcSubcategory[] = [
  {
    name: "VA Healthcare Enrollment",
    slug: "va-healthcare-enrollment",
    icon: ClipboardList,
    description: "VA enrollment help, eligibility guidance, registration support, and medical access setup",
    keywords: ["VA enrollment", "eligibility", "registration", "VA healthcare", "medical access", "VA card"],
  },
  {
    name: "Primary Care",
    slug: "primary-care",
    icon: Stethoscope,
    description: "General healthcare providers, routine medical support, and ongoing basic care",
    keywords: ["primary care", "family medicine", "internal medicine", "doctor", "routine care", "checkup"],
  },
  {
    name: "Specialty Care",
    slug: "specialty-care",
    icon: HeartPulse,
    description: "Cardiology, neurology, orthopedics, specialty referrals, and advanced treatment",
    keywords: ["specialty", "cardiology", "neurology", "orthopedics", "referral", "specialist"],
  },
  {
    name: "Rehabilitation Services",
    slug: "rehabilitation-services",
    icon: Activity,
    description: "Physical therapy, occupational therapy, injury rehab, and post-surgery recovery",
    keywords: ["rehabilitation", "physical therapy", "occupational therapy", "recovery", "rehab", "post-surgery"],
  },
  {
    name: "Telehealth & Virtual Care",
    slug: "telehealth-virtual-care",
    icon: Monitor,
    description: "Remote appointments, telehealth access, virtual care, and digital health services",
    keywords: ["telehealth", "virtual care", "remote", "video visit", "digital health", "telemedicine"],
  },
  {
    name: "Preventive Care & Wellness",
    slug: "preventive-care-wellness",
    icon: ShieldCheck,
    description: "Screenings, checkups, wellness visits, preventive health, and health coaching",
    keywords: ["preventive", "screening", "wellness", "checkup", "health coaching", "preventative"],
  },
  {
    name: "Women Veterans Healthcare",
    slug: "women-veterans-healthcare",
    icon: UserCircle,
    description: "Women-focused VA care, reproductive health, and gender-specific medical services",
    keywords: ["women veterans", "reproductive health", "women's health", "gender-specific", "maternity"],
  },
  {
    name: "Caregiver & Family Health Support",
    slug: "caregiver-family-health-support",
    icon: Users,
    description: "Caregiver health support, family medical resources, and family wellness navigation",
    keywords: ["caregiver", "family health", "family support", "caregiver navigation", "family wellness"],
  },

  {
    name: "VA Clinics",
    slug: "va-clinics",
    icon: Users,
    description: "VA Community-Based Outpatient Clinics (CBOCs) across South Carolina.",
    keywords: [],
  },
  {
    name: "VA Medical Centers",
    slug: "va-medical-centers",
    icon: Users,
    description: "Full VA Medical Centers serving the SC region (Ralph H. Johnson, Columbia VA).",
    keywords: [],
  },
  {
    name: "Telehealth",
    slug: "telehealth",
    icon: Users,
    description: "Virtual visits and remote care through VA Video Connect and partner programs.",
    keywords: [],
  },
];
