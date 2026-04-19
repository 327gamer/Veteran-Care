import { AlertTriangle, Phone, Brain, ShieldAlert, Heart, Home as HomeIcon, type LucideIcon } from "lucide-react";

export interface CrisisSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
}

export const CRISIS_SUBCATEGORIES: CrisisSubcategory[] = [
  {
    name: "Veterans Crisis Line",
    slug: "veterans-crisis-line",
    icon: Phone,
    description: "988 Press 1, text 838255 — confidential 24/7 crisis line for veterans, service members, and their families.",
  },
  {
    name: "Suicide Prevention",
    slug: "suicide-prevention",
    icon: ShieldAlert,
    description: "Suicide prevention programs, safety planning, and lethal-means counseling for veterans at risk.",
  },
  {
    name: "Emergency Mental Health",
    slug: "emergency-mental-health",
    icon: Brain,
    description: "Walk-in and emergency mental health care including VA crisis services and ER psych.",
  },
  {
    name: "Mobile Crisis Teams",
    slug: "mobile-crisis-teams",
    icon: AlertTriangle,
    description: "Mobile crisis teams that come to your location for in-person help during a mental health emergency.",
  },
  {
    name: "Domestic Violence / Safety",
    slug: "domestic-violence-safety",
    icon: Heart,
    description: "Domestic violence hotlines, safety planning, and emergency shelter for veterans and their families.",
  },
  {
    name: "Substance Abuse Crisis",
    slug: "substance-abuse-crisis",
    icon: HomeIcon,
    description: "Crisis-level substance abuse intervention, detox, and emergency stabilization.",
  },
];
