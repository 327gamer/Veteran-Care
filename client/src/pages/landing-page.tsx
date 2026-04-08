import { useLocation } from "wouter";
import { useSavedResources } from "@/lib/store";
import { platform } from "@shared/platform";
import { trackEvent } from "@/lib/analytics";
import logoImg from "@assets/Veteran_Care_-_Shadow_(TM)_-_PNG_1775367756504.png";
import {
  Home,
  Briefcase,
  Heart,
  Activity,
  AlertCircle,
  Scale,
  GraduationCap,
  ShieldCheck,
  Users,
  UtensilsCrossed,
  MessageSquare,
  Compass,
  Zap,
  ChevronRight,
  Lock,
  Flower2,
} from "lucide-react";

const categories: { label: string; icon: React.ElementType; slug: string | null }[] = [
  { label: "Housing", icon: Home, slug: "housing" },
  { label: "Employment", icon: Briefcase, slug: "employment" },
  { label: "Mental Health", icon: Heart, slug: "mental-health" },
  { label: "Healthcare", icon: Activity, slug: "healthcare" },
  { label: "Crisis Help", icon: AlertCircle, slug: null },
  { label: "Legal", icon: Scale, slug: "legal" },
  { label: "Education", icon: GraduationCap, slug: "education" },
  { label: "VA Benefits", icon: ShieldCheck, slug: "va-benefits" },
  { label: "Family Support", icon: Users, slug: "family-support" },
  { label: "Food Assistance", icon: UtensilsCrossed, slug: "food-assistance" },
  { label: "End of Life Services", icon: Flower2, slug: "end-of-life-services" },
];

const steps = [
  {
    icon: MessageSquare,
    number: "1",
    title: "Tell us what you need",
    desc: "Answer a few quick questions about the support you're looking for.",
  },
  {
    icon: Compass,
    number: "2",
    title: "Get connected to support",
    desc: "We match you with trusted local programs, services, and teams.",
  },
  {
    icon: Zap,
    number: "3",
    title: "Get help faster",
    desc: "No searching. No sorting. Just the right support, near you.",
  },
];

import React from "react";

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const { onboardingComplete } = useSavedResources();

  const openCreateAccount = () => {
    trackEvent("start_create_account_click");
    window.dispatchEvent(new CustomEvent("open-auth-modal", { detail: { mode: "signup" } }));
  };

  const handleCategoryClick = (slug: string | null) => {
    trackEvent("start_category_click", slug ? { category: slug } : {});
    openCreateAccount();
  };

  const handleBrowse = () => {
    trackEvent("start_browse_resources_click");
    setLocation(onboardingComplete ? "/resources" : "/onboarding");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── HERO ── */}
      <section className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_70%)]" />
        <div className="relative flex flex-col items-center text-center px-5 pt-10 pb-12 max-w-lg mx-auto">
          <img
            src={logoImg}
            alt={platform.name}
            className="h-48 w-auto object-contain drop-shadow-xl mb-6"
          />
          <h1 className="text-[1.65rem] leading-tight font-heading font-extrabold text-white tracking-tight mb-3">
            Get the Help You Need —<br />Fast, Local, and Trusted
          </h1>
          <p className="text-white/80 text-sm leading-relaxed mb-8 px-1">
            Veteran Care connects veterans, families, and loved ones to trusted local support — including benefits, healthcare, housing, employment, discounts on products & services and more.
          </p>

          <div className="w-full flex flex-col gap-3">
            <button
              data-testid="cta-get-help-now-hero"
              onClick={openCreateAccount}
              className="w-full py-3.5 rounded-full bg-white text-primary font-bold text-base shadow-lg landing-cta-glow transition-transform active:scale-95"
            >
              Get Help Now
            </button>
            <button
              data-testid="cta-browse-resources-hero"
              onClick={handleBrowse}
              className="w-full py-3 rounded-full border-2 border-white/60 text-white font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-75"
            >
              Browse Resources
            </button>
          </div>

          <div className="mt-5 flex items-center gap-2 text-white/60 text-xs">
            <Lock className="h-3 w-3 shrink-0" />
            <span>Free to use. Private. Built to connect you with real support near you.</span>
          </div>
        </div>
      </section>

      {/* ── VISUAL SECTION ── */}
      <section className="bg-muted/40 border-y border-border py-10 px-5">
        <div className="max-w-lg mx-auto flex flex-col items-center">
          <img src={logoImg} alt={platform.name} className="h-52 w-auto object-contain drop-shadow-lg" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-5 py-10 max-w-lg mx-auto">
        <h2 className="text-xl font-heading font-extrabold text-primary text-center mb-7">
          How It Works
        </h2>
        <div className="flex flex-col gap-5">
          {steps.map(({ number, title, desc }) => (
            <div key={number} className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-md">
                {number}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm leading-snug mb-0.5">{title}</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORY GRID ── */}
      <section className="bg-muted/40 border-y border-border px-5 py-10">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-heading font-extrabold text-primary text-center mb-6">
            What We Can Help With
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {categories.map(({ label, icon: Icon, slug }) => (
              <button
                key={label}
                data-testid={`category-${label.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => handleCategoryClick(slug)}
                className="flex items-center gap-2.5 bg-background border border-border rounded-xl px-3.5 py-3 text-left shadow-sm hover:border-primary/40 transition-colors active:bg-muted"
              >
                <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </span>
                <span className="text-xs font-semibold text-foreground leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY VETERAN CARE ── */}
      <section className="px-5 py-10 max-w-lg mx-auto text-center">
        <h2 className="text-xl font-heading font-extrabold text-primary mb-3">
          One Place to Start
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {platform.name} is designed to make getting help easier by bringing
          trusted support, resources, and guidance together in one place.
        </p>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-primary px-5 py-12">
        <div className="max-w-lg mx-auto flex flex-col items-center text-center gap-5">
          <h2 className="text-2xl font-heading font-extrabold text-white">
            Need help now?
          </h2>
          <button
            data-testid="cta-get-help-now-footer"
            onClick={openCreateAccount}
            className="w-full max-w-sm py-3.5 rounded-full bg-white text-primary font-bold text-base shadow-lg landing-cta-glow transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            Get Help Now
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="text-white/50 text-xs flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Free. Private. Trusted.
          </p>
        </div>
      </section>

    </div>
  );
}
