import {
  Shield,
  AlertTriangle,
  Wine,
  MessageCircle,
  Building2,
  Users,
  Heart,
  type LucideIcon,
  Brain,
} from "lucide-react";

export interface MhSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
  keywords: string[];
}

export const MH_SUBCATEGORIES: MhSubcategory[] = [
  {
    name: "PTSD & Trauma Support",
    slug: "ptsd-trauma-support",
    icon: Shield,
    description: "Specialized treatment and support for PTSD, combat trauma, and MST",
    keywords: ["PTSD", "trauma", "combat stress", "MST", "military sexual trauma", "traumatic brain injury"],
  },
  {
    name: "Crisis & Suicide Prevention",
    slug: "crisis-suicide-prevention",
    icon: AlertTriangle,
    description: "Immediate crisis support, hotlines, and suicide prevention resources",
    keywords: ["crisis", "suicide", "hotline", "988", "veterans crisis line", "emergency", "prevention"],
  },
  {
    name: "Substance Abuse & Addiction",
    slug: "substance-abuse-addiction",
    icon: Wine,
    description: "Recovery programs, detox, and substance use disorder treatment",
    keywords: ["substance abuse", "addiction", "recovery", "detox", "rehab", "alcohol", "drugs", "sobriety"],
  },
  {
    name: "Counseling & Therapy",
    slug: "counseling-therapy",
    icon: MessageCircle,
    description: "Individual, group, and family counseling from licensed professionals",
    keywords: ["counseling", "therapy", "therapist", "psychologist", "behavioral health", "mental health counseling"],
  },
  {
    name: "Inpatient / Outpatient Treatment",
    slug: "inpatient-outpatient-treatment",
    icon: Building2,
    description: "Residential and outpatient mental health treatment programs",
    keywords: ["inpatient", "outpatient", "residential", "treatment program", "mental health facility"],
  },
  {
    name: "Peer Support Groups",
    slug: "peer-support-groups",
    icon: Users,
    description: "Veteran-led support groups, mentorship, and community connection",
    keywords: ["peer support", "support group", "veteran group", "mentorship", "community", "fellowship"],
  },
  {
    name: "Family Support (Mental Health)",
    slug: "family-support-mental-health",
    icon: Heart,
    description: "Resources for families dealing with a veteran's mental health challenges",
    keywords: ["family", "spouse", "caregiver", "family counseling", "family support", "children"],
  },
  {
    name: "Vet Centers",
    slug: "vet-centers",
    icon: Brain,
    description: "Community-based VA Vet Centers offering free counseling and outreach for combat veterans and their families.",
    keywords: [],
  },
  {
    name: "PTSD Counseling",
    slug: "ptsd-counseling",
    icon: Brain,
    description: "Specialized PTSD counseling and trauma-focused therapy for veterans.",
    keywords: [],
  },
  {
    name: "Peer Support",
    slug: "peer-support",
    icon: Brain,
    description: "Peer-led support and recovery groups led by fellow veterans.",
    keywords: [],
  },
  {
    name: "Crisis Support",
    slug: "crisis-support",
    icon: Brain,
    description: "Mental health crisis support and stabilization for veterans in acute distress.",
    keywords: [],
  },
  {
    name: "Substance Abuse Treatment",
    slug: "substance-abuse-treatment",
    icon: Brain,
    description: "Substance abuse treatment programs run through the VA and community providers.",
    keywords: [],
  },
];
