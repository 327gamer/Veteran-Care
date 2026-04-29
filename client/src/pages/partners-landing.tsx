import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { platform } from "@shared/platform";
import logoImg from "@assets/Veteran_Care_-_Shadow_(TM)_-_PNG_1775367756504.png";
import CampaignHeroVideo from "@/components/campaign-hero-video";
import { LiveMetrics } from "@/components/live-metrics";
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
          <CampaignHeroVideo audience="partner" fallbackLogo={logoImg} platformName={platform.name} />
          <div className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 mb-4">
            <Building2 className="h-3.5 w-3.5 text-white/80" />
            <span className="text-white/90 text-xs font-semibold">For Businesses &amp; Organizations</span>
          </div>
          <h1 className="text-[1.6rem] leading-tight font-heading font-extrabold text-white tracking-tight mb-4 md:mb-5">
            Reach Veterans and Families Who Need What You Offer
          </h1>
          <p className="text-white/80 text-sm leading-relaxed mb-8 md:mb-10 px-1">
            Join {platform.name} as a Trusted Partner and get connected with local veterans, families, and caregivers who are actively looking for the services and support you provide.
          </p>
          <div className="mt-1 flex items-center gap-2 text-white/60 text-xs">
            <Lock className="h-3 w-3 shrink-0" />
            <span>Two ways to join — pick the one that fits your business.</span>
          </div>
        </div>
      </section>

      {/* ── CHOOSE YOUR PATH — TWO BOXES ── */}
      <section className="px-5 pt-8 pb-4 max-w-lg mx-auto" data-testid="section-choose-path">
        <h2 className="text-xl font-heading font-extrabold text-primary text-center mb-1.5">
          Choose Your Path
        </h2>
        <p className="text-xs text-center text-muted-foreground mb-5">
          Two separate programs — pick the one that fits your reach and budget.
        </p>

        <div className="grid grid-cols-1 gap-4">
          {/* BOX 1 — Trusted Services Partner */}
          <div
            data-testid="card-trusted-partner"
            className="rounded-2xl border-2 border-primary/25 bg-gradient-to-b from-primary/5 to-background p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </span>
              <h3 className="font-heading font-extrabold text-primary text-base">Trusted Services Partner</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              List your business in the Trusted Partner directory. Choose state or national reach. Show all the services you offer.
            </p>
            <ul className="space-y-1.5 text-xs text-foreground mb-4">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span>$99/mo state · $499/mo national</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span>List multiple services and subcategories</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span>Optional Direct Lead Delivery</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /><span>Featured & Near Me Boost add-ons</span></li>
            </ul>
            <button
              data-testid="cta-trusted-partner"
              onClick={() => { trackEvent("partners_cta_click", { location: "two_box_trusted" }); setLocation("/partner-apply"); }}
              className="w-full py-3 rounded-full bg-primary text-white font-bold text-sm shadow transition-transform active:scale-95 flex items-center justify-center gap-1.5"
            >
              Apply as Trusted Partner
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* BOX 2 — Elite Service Partner (premium) */}
          <div
            data-testid="card-elite-partner"
            className="rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-background p-5 shadow-md relative"
          >
            <div className="absolute -top-2.5 left-4 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              Premium · 1 per market
            </div>
            <div className="flex items-center gap-2 mb-2 mt-1">
              <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Star className="h-4 w-4 text-amber-600 fill-amber-500" />
              </span>
              <h3 className="font-heading font-extrabold text-amber-900 text-base">Elite Service Partner</h3>
            </div>
            <p className="text-xs text-amber-900/80 leading-relaxed mb-3">
              Own the top placement in your selected state, category, and subcategory. Only one Elite slot per market. Direct, high-intent leads included.
            </p>
            <ul className="space-y-1.5 text-xs text-foreground mb-4">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" /><span>Exclusive top banner — only one partner per slot</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" /><span>Direct leads included automatically</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" /><span>Base plan + Elite slot (starts at $499/mo, varies by state)</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" /><span>$49.99 per accepted qualified lead</span></li>
            </ul>
            <button
              data-testid="cta-elite-partner"
              onClick={() => { trackEvent("partners_cta_click", { location: "two_box_elite" }); setLocation("/elite-partner-apply"); }}
              className="w-full py-3 rounded-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-sm shadow transition-transform active:scale-95 flex items-center justify-center gap-1.5"
            >
              Apply for Elite Placement
              <ChevronRight className="h-4 w-4" />
            </button>
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

      {/* ── LIVE PLATFORM METRICS (shared component, single source of truth) ── */}
      <section className="px-5 pt-10 pb-2" data-testid="section-partners-live-metrics">
        <LiveMetrics className="!px-0 !max-w-lg" />
      </section>

      {/* ── SOCIAL PROOF + ROI ── */}
      <section className="px-5 pt-6 pb-10 max-w-lg mx-auto" data-testid="section-social-proof">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-7" data-testid="card-scarcity">
          <p className="text-[11px] uppercase tracking-widest text-amber-700 font-semibold mb-1">Limited founding partner placements</p>
          <p className="text-sm text-amber-900 leading-snug">
            We're capping founding partner slots by market to protect lead quality. Get listed before your category fills.
          </p>
        </div>

        <h3 className="text-base font-heading font-extrabold text-primary mb-3 text-center">Why partners join</h3>
        <ul className="space-y-2.5">
          {[
            { t: "Qualified inbound leads", d: "Veterans and families who told us exactly what they need." },
            { t: "Geo-targeted visibility", d: "Show up in your city, county, and state — not buried in a national directory." },
            { t: "Trust badge authority", d: "Trusted Partner status signals you've been reviewed and vetted." },
            { t: "Veteran audience credibility", d: "Reach a community that values service and verified providers." },
            { t: "Recurring monthly exposure", d: "Stay in front of new families discovering the platform every month." },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-white border border-border" data-testid={`text-roi-${i}`}>
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
              <div>
                <p className="text-sm font-semibold text-foreground leading-snug">{item.t}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.d}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="text-center text-[11px] text-muted-foreground mt-5 italic">
          Built for trusted organizations serving veterans across the United States.
        </p>
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
