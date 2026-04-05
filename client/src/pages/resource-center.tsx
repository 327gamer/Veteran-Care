import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { platform } from "@shared/platform";
import logoImg from "@assets/Veteran_Care_-_Shadow_(TM)_-_PNG_1775367756504.png";
import {
  Search,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Lock,
  Briefcase,
  Heart,
  Home,
  BookOpen,
  Phone,
  ChevronLeft,
} from "lucide-react";

const steps = [
  {
    number: "1",
    icon: Search,
    title: "Search the resource directory",
    desc: "Browse or filter by category — housing, benefits, healthcare, employment, legal, and more.",
  },
  {
    number: "2",
    icon: MapPin,
    title: "Find local programs near your client",
    desc: "Resources are filtered by location so you can quickly find what's available in your client's area.",
  },
  {
    number: "3",
    icon: Phone,
    title: "Connect them directly",
    desc: "Share resources, request a Navigator, or submit a lead on behalf of the veteran you're supporting.",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Trusted, vetted partners",
    desc: "Every resource on the platform is reviewed. You're not handing clients a Google search — you're handing them a curated directory.",
  },
  {
    icon: Users,
    title: "Built for case managers and advocates",
    desc: "Use it as a reference tool, share links directly with clients, or request follow-up support on their behalf.",
  },
  {
    icon: MapPin,
    title: "Local and statewide coverage",
    desc: "Resources are organized by state and region so you can quickly narrow down what's relevant to your client.",
  },
  {
    icon: CheckCircle2,
    title: "Free to use — no account required",
    desc: "No sign-up needed to browse. Create a free account to save resources and track requests.",
  },
];

const categories = [
  { label: "Housing", icon: Home },
  { label: "VA Benefits", icon: ShieldCheck },
  { label: "Employment", icon: Briefcase },
  { label: "Mental Health", icon: Heart },
  { label: "Legal", icon: BookOpen },
  { label: "Food Assistance", icon: Users },
];

export default function ResourceCenter() {
  const [, setLocation] = useLocation();

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
          <h1 className="text-[1.6rem] leading-tight font-heading font-extrabold text-white tracking-tight mb-3">
            The All-in-One Resource Center for Those Who Help Veterans
          </h1>
          <p className="text-white/80 text-sm leading-relaxed mb-8 px-1">
            {platform.name} is a free, trusted resource directory built for veterans, families — and the case managers, nonprofits, churches, VA reps, and social workers who support them.
          </p>
          <div className="w-full flex flex-col gap-3">
            <button
              data-testid="cta-browse-resources-hero"
              onClick={() => { trackEvent("resource_center_browse_click"); setLocation("/resources"); }}
              className="w-full py-3.5 rounded-full bg-white text-primary font-bold text-base shadow-lg landing-cta-glow transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              Browse Resources
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              data-testid="cta-learn-how-it-works"
              onClick={() => { trackEvent("resource_center_learn_click"); setLocation("/start"); }}
              className="w-full py-3 rounded-full border-2 border-white/60 text-white font-semibold text-sm transition-opacity hover:opacity-90 active:opacity-75"
            >
              Learn How It Works
            </button>
          </div>
          <div className="mt-5 flex items-center gap-2 text-white/60 text-xs">
            <Lock className="h-3 w-3 shrink-0" />
            <span>Free to use. No sign-up required to browse.</span>
          </div>
          <p className="mt-3 text-white/50 text-[11px] leading-relaxed text-center px-2">
            <span className="font-semibold text-white/60">Tip:</span> Use the location filter at the top of the directory to quickly find services near your client.
          </p>
        </div>
      </section>

      {/* ── CATEGORY PREVIEW ── */}
      <section className="bg-muted/40 border-y border-border px-5 py-8">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-semibold text-muted-foreground text-center uppercase tracking-widest mb-4">
            Categories Available
          </p>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 bg-background border border-border rounded-xl px-2 py-3 text-center"
              >
                <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </span>
                <span className="text-[10.5px] font-semibold text-foreground leading-tight">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3">
            + Healthcare, Education, Family Support, Crisis Help, and more
          </p>
        </div>
      </section>

      {/* ── HOW IT HELPS ── */}
      <section className="px-5 py-10 max-w-lg mx-auto">
        <h2 className="text-xl font-heading font-extrabold text-primary text-center mb-7">
          How It Helps Your Clients
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

      {/* ── KEY BENEFITS ── */}
      <section className="bg-muted/40 border-y border-border px-5 py-10">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl font-heading font-extrabold text-primary text-center mb-6">
            Built for the People Behind the Veterans
          </h2>
          <div className="flex flex-col gap-4">
            {benefits.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4 bg-background border border-border rounded-xl p-4">
                <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="font-semibold text-sm text-foreground mb-0.5">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CREATE ACCOUNT CTA ── */}
      <section className="px-5 py-10 max-w-lg mx-auto">
        <div className="border border-primary/20 bg-primary/5 rounded-2xl p-6 flex flex-col items-center text-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-heading font-extrabold text-primary leading-snug">
              Create a Free Account for a More Personalized Experience
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Save important resources, organize what you find, and unlock more personalized support tools as {platform.name} continues to grow.
            </p>
          </div>
          <button
            data-testid="cta-create-account-resource-center"
            onClick={() => setLocation("/onboarding?step=2")}
            className="w-full max-w-xs py-3 rounded-full bg-primary text-white font-bold text-sm shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            Create Free Account
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="text-xs text-muted-foreground">
            Free. Takes less than a minute.
          </p>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-primary px-5 py-12">
        <div className="max-w-lg mx-auto flex flex-col items-center text-center gap-5">
          <h2 className="text-2xl font-heading font-extrabold text-white">
            Ready to explore the directory?
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-sm">
            Start browsing trusted local resources for the veterans and families in your care.
          </p>
          <button
            data-testid="cta-browse-resources-footer"
            onClick={() => setLocation("/resources")}
            className="w-full max-w-sm py-3.5 rounded-full bg-white text-primary font-bold text-base shadow-lg landing-cta-glow transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            Browse Resources
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="text-white/50 text-xs flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Free. No account required to browse.
          </p>
        </div>
      </section>

      {/* Back link */}
      <div className="px-5 py-5 max-w-lg mx-auto">
        <button
          data-testid="resource-center-back"
          onClick={() => setLocation("/start")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Veteran Care
        </button>
      </div>

    </div>
  );
}
