import { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  MapPin,
  ShieldCheck,
  Brain,
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
  TrendingUp,
  Flag,
  PlusCircle,
  DollarSign,
  Medal,
  Shield,
  Tag,
} from "lucide-react";
import logoImg from "@assets/Veteran_Care_-_Shadow_(TM)_-_PNG_1775367756504.png";
import CampaignHeroVideo from "@/components/campaign-hero-video";
import MenuPageHero from "@/components/menu-page-hero";
import { platform } from "@shared/platform";
import { LiveMetrics } from "@/components/live-metrics";
import { CoverageGrowth } from "@/components/coverage-growth";

const TRUST_TILES = [
  { icon: Layers, label: "17 Support Categories", sub: "Across veterans, families & caregivers" },
  { icon: Sparkles, label: "AI-Powered Navigator", sub: "Guided help, 24/7" },
  { icon: ShieldCheck, label: "Trusted Partner Network", sub: "Vetted, veteran-friendly providers" },
  { icon: Calendar, label: "Supporting Veterans Since 2020", sub: "Real-world veteran experience" },
  { icon: Globe, label: "Growing Nationwide", sub: "New states added regularly" },
];

const PLATFORM_TOOLS = [
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
];

// 17 canonical Veteran Care support categories. Names follow platform
// canonical naming (shared/canonical-categories.ts) where they exist.
const SUPPORT_CATEGORIES = [
  { icon: Phone, title: "Crisis Help", desc: "Veterans Crisis Line (988, then 1) and rapid escalation paths." },
  { icon: Brain, title: "Mental Health", desc: "PTSD, TBI, counseling, and behavioral health programs." },
  { icon: HomeIcon, title: "Housing & Home Services", desc: "Emergency shelter, rental help, HUD-VASH, and VA home loans." },
  { icon: Stethoscope, title: "Healthcare", desc: "VA medical centers, community clinics, and primary care." },
  { icon: Briefcase, title: "Employment Support", desc: "Job search, training, resumes, and career coaching." },
  { icon: Utensils, title: "Food Assistance", desc: "Food banks, pantries, SNAP outreach, and meal programs." },
  { icon: CheckCircle2, title: "Benefits Assistance", desc: "Claims, appeals, eligibility, and step-by-step VA navigation." },
  { icon: Scale, title: "Legal Services", desc: "Free legal clinics, claims appeals, and estate planning." },
  { icon: Users, title: "Family Support", desc: "Spouses, children, dependents, and caregiver programs." },
  { icon: Car, title: "Transportation", desc: "Rides to appointments, vehicle programs, and mobility support." },
  { icon: DollarSign, title: "Financial & Credit Services", desc: "Counseling, debt help, lending, and tax assistance." },
  { icon: GraduationCap, title: "Education & Training", desc: "GI Bill, trade schools, scholarships, and training." },
  { icon: Medal, title: "Disabled Veterans", desc: "Disability benefits, adaptive programs, and advocacy." },
  { icon: Shield, title: "Insurance Services", desc: "Coverage navigation, TRICARE, and life insurance." },
  { icon: LifeBuoy, title: "End of Life Services", desc: "Hospice, burial benefits, and survivor support." },
  { icon: MessageCircle, title: "Community Support", desc: "Veteran groups, peers, mentors, and local meetups." },
  { icon: Tag, title: "Veteran Discounts", desc: "Vetted local partners offering veteran pricing and trusted services." },
];

export default function About() {
  useEffect(() => {
    document.title = "About Veteran Care | America's Modern Veteran Support Platform";
  }, []);

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
      <LiveMetrics className="pt-12 sm:pt-16" />

      {/* ── COVERAGE GROWTH — shared with Homepage ── */}
      <CoverageGrowth className="pt-12 sm:pt-16" />

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
      <section className="container mx-auto px-5 py-12 max-w-5xl" data-testid="section-what-veteran-care-offers">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">The Difference</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
            What Veteran Care offers
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            Real-world support across every part of veteran and family life.
          </p>
        </div>

        {/* Platform tools — emphasized full-width on mobile, 3-col on desktop */}
        <div className="mb-10 sm:mb-12" data-testid="block-platform-tools">
          <h3 className="font-heading text-lg sm:text-xl font-bold text-primary text-center mb-1">
            Platform tools that help you find support faster
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-5 max-w-xl mx-auto">
            The features built into Veteran Care so you can move from "I need help" to "I found it" in minutes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLATFORM_TOOLS.map((p, i) => {
              const Icon = p.icon;
              return (
                <Card
                  key={i}
                  className="border-l-4 border-l-accent hover:shadow-md transition-shadow"
                  data-testid={`card-platform-tool-${i}`}
                >
                  <CardContent className="pt-6 pb-6">
                    <div className="h-10 w-10 rounded-md bg-accent/10 text-accent flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-heading font-semibold text-primary mb-1.5 leading-tight">{p.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Support categories — compact 2-col mobile, 3-col tablet, 4-col desktop */}
        <div data-testid="block-support-categories">
          <h3 className="font-heading text-lg sm:text-xl font-bold text-primary text-center mb-1">
            Support categories available on Veteran Care
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-5 max-w-xl mx-auto">
            All 17 categories veterans, families, and caregivers can search across.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {SUPPORT_CATEGORIES.map((c, i) => {
              const Icon = c.icon;
              return (
                <Card
                  key={i}
                  className="hover:shadow-md transition-shadow"
                  data-testid={`card-category-${i}`}
                >
                  <CardContent className="p-4 sm:pt-5 sm:pb-5">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-2 sm:mb-3">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <h4 className="font-heading font-semibold text-primary mb-1 leading-tight text-sm sm:text-base">
                      {c.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                      {c.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
