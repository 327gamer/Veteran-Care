import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { platform } from "@shared/platform";
import logoImg from "@assets/Veteran_Care_-_Shadow_(TM)_-_PNG_1775367756504.png";
import {
  Users,
  MapPin,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Lock,
  Star,
  Zap,
  DollarSign,
  ChevronLeft,
  Building2,
} from "lucide-react";

const valueProps = [
  {
    icon: Users,
    title: "Direct access to veterans and families",
    desc: "Veteran Care connects your business or organization directly with veterans, spouses, caregivers, and family members who are actively looking for the services you provide.",
  },
  {
    icon: MapPin,
    title: "Local and statewide visibility",
    desc: "Your listing appears in the regions where you operate — so you reach the right people in the right area, not a general national audience.",
  },
  {
    icon: TrendingUp,
    title: "Qualified leads, not cold traffic",
    desc: "Users on Veteran Care are actively seeking help. Leads are routed to you based on category and location — so you get inbound contacts who are ready to engage.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted partner positioning",
    desc: "Being listed as a Veteran Care Trusted Partner signals to veterans and their families that your business has been reviewed and meets our standards.",
  },
];

const steps = [
  {
    number: "1",
    title: "Apply to become a Trusted Partner",
    desc: "Fill out a short application with your business or organization details, service area, and the categories you serve.",
  },
  {
    number: "2",
    title: "Get reviewed and approved",
    desc: "Our team reviews every application. Approved partners are listed in the directory and eligible to receive routed leads.",
  },
  {
    number: "3",
    title: "Receive qualified leads",
    desc: "When a veteran or family member needs what you offer in your area, your listing appears and leads are sent directly to you.",
  },
];

const tiers = [
  {
    icon: MapPin,
    name: "State Plan",
    desc: "Visible to veterans and families across one state. Ideal for organizations serving a single-state market.",
  },
  {
    icon: Star,
    name: "National Plan",
    desc: "Visible to veterans and families across the country. Ideal for organizations with national reach or multi-state coverage.",
  },
];

export default function PartnersLanding() {
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
          <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 mb-4">
            <Building2 className="h-3.5 w-3.5 text-white/80" />
            <span className="text-white/90 text-xs font-semibold">For Businesses &amp; Organizations</span>
          </div>
          <h1 className="text-[1.6rem] leading-tight font-heading font-extrabold text-white tracking-tight mb-3">
            Reach Veterans and Families Who Need What You Offer
          </h1>
          <p className="text-white/80 text-sm leading-relaxed mb-8 px-1">
            Join {platform.name} as a Trusted Partner and get connected with local veterans, families, and caregivers who are actively looking for the services and support you provide.
          </p>
          <div className="w-full flex flex-col gap-3">
            <button
              data-testid="cta-become-partner-hero"
              onClick={() => { trackEvent("partners_cta_click", { location: "hero" }); setLocation("/partner-apply"); }}
              className="w-full py-3.5 rounded-full bg-white text-primary font-bold text-base shadow-lg landing-cta-glow transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              Become a Trusted Partner
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 flex items-center gap-2 text-white/60 text-xs">
            <Lock className="h-3 w-3 shrink-0" />
            <span>Simple application. No long-term contract required to get started.</span>
          </div>
        </div>
      </section>

      {/* ── VALUE PROPOSITION ── */}
      <section className="px-5 py-10 max-w-lg mx-auto">
        <h2 className="text-xl font-heading font-extrabold text-primary text-center mb-6">
          Why Become a Trusted Partner?
        </h2>
        <div className="flex flex-col gap-4">
          {valueProps.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 bg-muted/40 border border-border rounded-xl p-4">
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
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-muted/40 border-y border-border px-5 py-10">
        <div className="max-w-lg mx-auto">
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
        </div>
      </section>

      {/* ── SUBSCRIPTION TIERS ── */}
      <section className="px-5 py-10 max-w-lg mx-auto">
        <h2 className="text-xl font-heading font-extrabold text-primary text-center mb-2">
          Listing Options
        </h2>
        <p className="text-muted-foreground text-sm text-center mb-6">
          Monthly subscription — cancel anytime.
        </p>
        <div className="grid grid-cols-1 gap-3">
          {tiers.map(({ icon: Icon, name, desc }) => (
            <div key={name} className="flex items-start gap-4 border border-primary/20 bg-primary/5 rounded-xl p-4">
              <span className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <div>
                <p className="font-semibold text-sm text-primary mb-0.5">{name}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-3 border border-border rounded-xl p-4 bg-muted/30">
          <DollarSign className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Pricing details are provided during the application review. Subscriptions are billed monthly and can be cancelled at any time.
          </p>
        </div>
      </section>

      {/* ── LEAD VALUE SECTION ── */}
      <section className="bg-muted/40 border-y border-border px-5 py-10">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-heading font-extrabold text-primary mb-3">
            Qualified Inbound Leads — Not Cold Lists
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
            Every lead routed to a Trusted Partner comes from a veteran or family member who has told us exactly what they need and where they are. You don't buy a list — you receive warm, local inbound contacts who are ready to connect.
          </p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {[
              { icon: CheckCircle2, label: "Category-matched leads" },
              { icon: CheckCircle2, label: "Location-filtered routing" },
              { icon: CheckCircle2, label: "Urgency level indicated" },
              { icon: CheckCircle2, label: "Direct contact info" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2.5">
                <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-primary px-5 py-12">
        <div className="max-w-lg mx-auto flex flex-col items-center text-center gap-5">
          <h2 className="text-2xl font-heading font-extrabold text-white">
            Ready to become a Trusted Partner?
          </h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-sm">
            Fill out a short application and our team will review your listing within a few business days.
          </p>
          <button
            data-testid="cta-become-partner-footer"
            onClick={() => { trackEvent("partners_cta_click", { location: "footer" }); setLocation("/partner-apply"); }}
            className="w-full max-w-sm py-3.5 rounded-full bg-white text-primary font-bold text-base shadow-lg landing-cta-glow transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            Become a Trusted Partner
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="text-white/50 text-xs flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Simple application. Reviewed by our team.
          </p>
        </div>
      </section>

      {/* Back link */}
      <div className="px-5 py-5 max-w-lg mx-auto">
        <button
          data-testid="partners-back"
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
