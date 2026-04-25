import { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  MapPin,
  ShieldCheck,
  Heart,
  Briefcase,
  Stethoscope,
  HomeIcon,
  Users,
  ArrowRight,
  Layers,
  Calendar,
  Globe,
  CheckCircle2,
  Scale,
  GraduationCap,
  Utensils,
  Car,
  LifeBuoy,
  MessageCircle,
  Phone,
  UserCheck,
  Database,
  Building2,
  Rocket,
  TrendingUp,
  Flag,
  PlusCircle,
} from "lucide-react";
import logoImg from "@assets/Veteran_Care_-_Shadow_(TM)_-_PNG_1775367756504.png";
import CampaignHeroVideo from "@/components/campaign-hero-video";
import MenuPageHero from "@/components/menu-page-hero";
import { platform } from "@shared/platform";
import { usePublicStats, formatStatNumber } from "@/hooks/use-public-stats";

const TRUST_TILES = [
  { icon: Layers, label: "17 Support Categories", sub: "Across veterans, families & caregivers" },
  { icon: Sparkles, label: "AI-Powered Navigator", sub: "Guided help, 24/7" },
  { icon: ShieldCheck, label: "Trusted Partner Network", sub: "Vetted, veteran-friendly providers" },
  { icon: Calendar, label: "Supporting Veterans Since 2020", sub: "Real-world veteran experience" },
  { icon: Globe, label: "Growing Nationwide", sub: "New states added regularly" },
];

const PILLARS = [
  // 1–3: how the platform works + why it's valuable
  {
    icon: MapPin,
    title: "Search by city, state, or near me",
    desc: "Live, location-aware results across every category — find what's actually available where you are.",
  },
  {
    icon: Sparkles,
    title: "AI Navigator assistance",
    desc: "An AI assistant that listens to your situation, asks the right questions, and routes you to the exact resource or program you need.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted services & discounts",
    desc: "Vetted local partners offering veteran-friendly products, services, and exclusive pricing.",
  },
  // 4+: real-life support categories
  {
    icon: HomeIcon,
    title: "Housing & homelessness support",
    desc: "Homeless veteran outreach, transitional housing, HUD-VASH, and emergency shelter navigation.",
  },
  {
    icon: Briefcase,
    title: "Jobs, training & careers",
    desc: "Hiring pathways, apprenticeships, skilled trades, resume help, and career coaching.",
  },
  {
    icon: CheckCircle2,
    title: "Benefits, claims & VA navigation",
    desc: "Claims assistance, appeals support, eligibility checks, and step-by-step VA benefits guidance.",
  },
  {
    icon: Stethoscope,
    title: "Healthcare & mental health",
    desc: "VA medical centers, community clinics, behavioral health programs, and recovery support.",
  },
  {
    icon: Heart,
    title: "Disabled veteran & family support",
    desc: "Disability-specific resources, adaptive programs, and family advocacy.",
  },
  {
    icon: Users,
    title: "Caregiver, spouse & dependent support",
    desc: "Caregiver stipends, spouse benefits, dependent education, and survivor programs.",
  },
  {
    icon: GraduationCap,
    title: "Education",
    desc: "GI Bill, vocational rehab, scholarships, and transition-to-school resources.",
  },
  {
    icon: Scale,
    title: "Legal & financial guidance",
    desc: "Free legal clinics, financial counseling, debt help, and tax assistance for veterans.",
  },
  {
    icon: Utensils,
    title: "Food & emergency help",
    desc: "Food pantries, emergency funds, utility assistance, and short-term hardship relief.",
  },
  {
    icon: Car,
    title: "Transportation",
    desc: "Rides to appointments, vehicle programs, and mobility support across counties.",
  },
  {
    icon: LifeBuoy,
    title: "End-of-life planning support",
    desc: "Hospice navigation, burial benefits, military honors coordination, and survivor guidance.",
  },
  {
    icon: MessageCircle,
    title: "Community & peer support",
    desc: "Veteran-led groups, mentorship, and local meetups so no veteran walks it alone.",
  },
  {
    icon: Phone,
    title: "Crisis support",
    desc: "Direct access to the Veterans Crisis Line — 988, then press 1 — and rapid escalation paths.",
  },
  {
    icon: UserCheck,
    title: "Senior veteran support",
    desc: "Aging-in-place programs, senior care navigation, and benefits tailored to older veterans.",
  },
];

export default function About() {
  useEffect(() => {
    document.title = "About Veteran Care | America's Modern Veteran Support Platform";
  }, []);

  // Live metrics — sourced from the shared usePublicStats hook so
  // homepage / About / any other surface always read the same numbers.
  const { stats } = usePublicStats();

  const metricCards = [
    {
      icon: Flag,
      value: formatStatNumber(stats.totalStates),
      label: "States Live",
    },
    {
      icon: Rocket,
      value: stats.nextStateLaunching,
      label: "Launching Next",
    },
    {
      icon: Database,
      value: `${formatStatNumber(stats.totalResources)}+`,
      label: "Verified Resources",
    },
    {
      icon: Building2,
      value: `${formatStatNumber(stats.totalCities)}+`,
      label: "Cities Covered",
    },
    {
      icon: Layers,
      value: formatStatNumber(stats.totalCategories),
      label: "Support Categories",
    },
    {
      icon: TrendingUp,
      value: stats.growthStatus,
      label: "Growth Status",
    },
  ];

  return (
    <div className="bg-background min-h-full pb-20" data-testid="page-about">
      <MenuPageHero
        testIdPrefix="about"
        title={["Veteran Care Is", "Expanding Nationwide"]}
        subtitle="Helping veterans, spouses, dependents, caregivers, and military families connect with trusted resources, verified services, and real support."
        detail="Now growing across the United States with new states, cities, and resources added regularly."
      />

      {/* ── TRUST / SCALE / PROOF TILES — symmetrical 2 + 2 + 1 (last centered) ── */}
      <section className="container mx-auto px-5 pt-12 sm:pt-16 max-w-3xl">
        <div className="grid grid-cols-2 gap-4 sm:gap-5" data-testid="grid-trust-tiles">
          {TRUST_TILES.map((t, i) => {
            const Icon = t.icon;
            const isLastOdd = i === TRUST_TILES.length - 1 && TRUST_TILES.length % 2 === 1;
            return (
              <div
                key={i}
                className={`bg-white rounded-xl border border-border shadow-sm p-4 sm:p-5 text-center ${
                  isLastOdd ? "col-span-2 mx-auto w-full sm:w-1/2" : ""
                }`}
                data-testid={`tile-trust-${i}`}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary mx-auto mb-2.5 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-heading text-sm font-bold text-primary leading-tight">{t.label}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-snug">{t.sub}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── LIVE METRICS — auto-counted from the live database ── */}
      <section className="container mx-auto px-5 pt-12 sm:pt-16 max-w-5xl" data-testid="section-live-metrics">
        <div className="text-center mb-6 sm:mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Live platform metrics</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
            Real momentum. Real coverage.
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            Every number below reflects what's actually live on the platform right now.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4" data-testid="grid-live-metrics">
          {metricCards.map((m, i) => {
            const Icon = m.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-xl border border-border shadow-sm p-4 sm:p-5 text-center"
                data-testid={`tile-metric-${i}`}
              >
                <div className="h-9 w-9 rounded-full bg-accent/10 text-accent mx-auto mb-2 flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <p
                  className="font-heading text-xl sm:text-2xl font-extrabold text-primary leading-tight break-words"
                  data-testid={`text-metric-value-${i}`}
                >
                  {m.value}
                </p>
                <p
                  className="text-[11px] sm:text-xs uppercase tracking-wide text-muted-foreground mt-1 leading-snug"
                  data-testid={`text-metric-label-${i}`}
                >
                  {m.label}
                </p>
              </div>
            );
          })}
        </div>
        <p className="text-center text-[11px] text-muted-foreground mt-4 italic" data-testid="text-metrics-footnote">
          {stats.isEstimated
            ? "Estimated coverage — refreshing live counts. Soon serving all 50 states."
            : "Soon serving all 50 states."}
        </p>
      </section>

      {/* ── SOUTHEAST COVERAGE BLOCK ── */}
      <section className="container mx-auto px-5 pt-12 sm:pt-16 max-w-3xl" data-testid="section-coverage">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6 pb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Current coverage growth</p>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-primary mb-2" data-testid="text-coverage-region">
              Current Coverage Growth
            </h2>
            <p className="text-sm text-foreground/80 mb-5 leading-relaxed">
              Veteran Care is actively expanding state by state across America.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div data-testid="block-live-states">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                  Live states
                </p>
                <ul className="space-y-1.5">
                  {stats.liveStateNames.map((s) => (
                    <li
                      key={s.code}
                      className="flex items-center gap-2 text-sm text-foreground/85"
                      data-testid={`text-live-state-${s.code.toLowerCase()}`}
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      <span className="font-medium">{s.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div data-testid="block-next-state">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                  Launching next
                </p>
                <div className="flex items-center gap-2 text-sm text-foreground/85">
                  <Rocket className="h-4 w-4 text-accent shrink-0" />
                  <span className="font-medium" data-testid="text-next-state">{stats.nextStateLaunching}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  National expansion roadmap underway with additional states launching regularly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── VIDEO SHOWCASE ── */}
      <section className="relative bg-primary overflow-hidden mt-12 sm:mt-16">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_white_0%,_transparent_70%)]" />
        <div className="relative flex flex-col items-center text-center px-5 pt-10 pb-12 sm:pt-14 sm:pb-16 max-w-lg mx-auto">
          <CampaignHeroVideo
            audience="about"
            fallbackLogo={logoImg}
            platformName={platform.name}
          />
          <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-2">
            Watch
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            Why People Are Talking About Veteran Care
          </h2>
          <p className="text-sm sm:text-base text-white/85 mt-3 max-w-xl mx-auto leading-relaxed">
            Real people. Real stories. Real movement.
          </p>
          <p className="text-xs sm:text-sm uppercase tracking-[0.18em] text-white/80 mt-5 font-semibold" data-testid="text-built-line">
            Built to Serve Veterans Nationwide.
          </p>
        </div>
      </section>

      {/* ── EMOTIONAL IMPACT LINE ── */}
      <section className="container mx-auto px-5 pt-10 pb-10 max-w-3xl">
        <div className="text-center" data-testid="text-emotional-impact">
          <p className="font-heading text-2xl sm:text-3xl text-primary leading-snug italic font-semibold">
            "When life gets complicated, getting help shouldn't be."
          </p>
          <p className="text-sm text-muted-foreground mt-3">— The Veteran Care promise</p>
        </div>
      </section>

      {/* ── WHY VETERAN CARE EXISTS ── */}
      <section className="container mx-auto px-5 pb-12 max-w-5xl" data-testid="section-why">
        <Card className="border-l-4 border-l-accent">
          <CardContent className="pt-7 pb-7">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Why we exist</p>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary mb-5">
              Why Veteran Care exists
            </h2>
            <p className="text-base sm:text-lg text-foreground/85 leading-relaxed mb-4">
              Too many veterans and families struggle to find help because resources are scattered,
              outdated, or hard to trust.
            </p>
            <p className="text-base text-foreground/85 leading-relaxed mb-4">
              Veteran Care is building one powerful platform where users can quickly find help for
              housing, food, healthcare, jobs, benefits, legal support, family assistance, financial
              guidance, transportation, end-of-life planning, and more.
            </p>
            <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2">
              From first search to final solution, our mission is simple:
            </p>
            <p className="font-heading text-lg sm:text-xl font-extrabold text-primary uppercase leading-snug">
              Connect those who served to the support they've earned — quickly, respectfully, and
              without barriers.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ── WHAT WE COVER ── */}
      <section className="container mx-auto px-5 py-12 max-w-5xl">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">The Difference</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
            What Veteran Care offers
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            Real-world support across every part of veteran and family life.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <Card key={i} className="hover:shadow-md transition-shadow" data-testid={`card-pillar-${i}`}>
                <CardContent className="pt-6">
                  <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading font-semibold text-primary mb-1.5 leading-tight">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── WHO WE SERVE ── */}
      <section className="container mx-auto px-5 pb-12 max-w-5xl">
        <Card>
          <CardContent className="pt-7 pb-7">
            <h2 className="font-heading text-2xl font-bold text-primary mb-4">Who we serve</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
              {["Veterans", "Spouses", "Dependents", "Caregivers", "Case Managers", "VA Staff", "Nonprofits", "State Agencies", "Trusted Partners", "Employers"].map((aud) => (
                <div key={aud} className="flex items-center gap-2 text-foreground/80" data-testid={`text-audience-${aud.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {aud}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── COMMUNITY ACTION / PRIMARY CTA ── */}
      <section className="container mx-auto px-5 py-14 max-w-5xl" data-testid="section-cta">
        <div className="bg-primary text-primary-foreground rounded-2xl p-8 sm:p-12 text-center shadow-lg">
          <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70 mb-3">Get involved</p>
          <h3 className="font-heading text-2xl sm:text-4xl font-bold mb-4 leading-tight">
            Help Add Resources In Your Area
          </h3>
          <p className="text-primary-foreground/85 mb-8 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Know a trusted veteran resource we should add? Submit it in seconds. Browse what's already
            live, or join our growing Trusted Partner Network.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/submit-resource">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto text-base px-7 py-6 rounded-full"
                data-testid="button-cta-add-resource"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Help Add Resources
              </Button>
            </Link>
            <Link href="/resources">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base px-7 py-6 rounded-full bg-transparent border-white/30 text-white hover:bg-white/10"
                data-testid="button-cta-resources"
              >
                View Resources <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/partners">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base px-7 py-6 rounded-full bg-transparent border-white/30 text-white hover:bg-white/10"
                data-testid="button-cta-partner"
              >
                Become a Trusted Partner
              </Button>
            </Link>
          </div>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-ai-guide"))}
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary-foreground/80 hover:text-primary-foreground underline underline-offset-4"
            data-testid="button-cta-navigator"
          >
            <Sparkles className="h-3.5 w-3.5" /> Or ask the AI Navigator instead
          </button>
        </div>
      </section>

      {/* ── TRUST / MOMENTUM BAR ── */}
      <section className="container mx-auto px-5 pb-6 max-w-5xl" data-testid="section-momentum">
        <div className="bg-accent/10 border border-accent/30 rounded-xl py-3 px-4 text-center">
          <p className="text-xs sm:text-sm font-semibold text-primary leading-snug" data-testid="text-momentum">
            Growing Every Week · New Resources Added Regularly · More States Launching Soon
          </p>
        </div>
      </section>
    </div>
  );
}
