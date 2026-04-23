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
  Zap,
  HandHeart,
  Calendar,
  Globe,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import logoImg from "@assets/Veteran_Care_-_Shadow_(TM)_-_PNG_1775367756504.png";
import CampaignHeroVideo from "@/components/campaign-hero-video";
import { platform } from "@shared/platform";

const TRUST_TILES = [
  { icon: Layers, label: "17 Support Categories", sub: "Across veterans, families & caregivers" },
  { icon: Sparkles, label: "AI-Powered Navigator", sub: "Guided help, 24/7" },
  { icon: ShieldCheck, label: "Trusted Partner Network", sub: "Vetted, veteran-friendly providers" },
  { icon: Calendar, label: "Built Since 2020", sub: "Real-world veteran experience" },
  { icon: Globe, label: "Expanding Nationwide", sub: "SC & NC live · more launching" },
];

const DIFFERENTIATORS_OUT = [
  "Outdated PDFs",
  "Endless searching",
  "Broken links",
  "One-size-fits-all directories",
  "Disconnected categories",
];
const DIFFERENTIATORS_IN = [
  "Smart location matching",
  "AI-guided support",
  "One platform across categories",
  "Mobile-first modern experience",
  "Verified, current resources",
];

const PILLARS = [
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
    icon: Stethoscope,
    title: "Healthcare & mental health",
    desc: "VA medical centers, community clinics, behavioral health programs, recovery support, and the Veterans Crisis Line (988, then 1).",
  },
  {
    icon: HomeIcon,
    title: "Housing & benefits",
    desc: "Homeless veteran outreach, transitional housing, HUD-VASH, claims assistance, and benefits navigation step by step.",
  },
  {
    icon: Briefcase,
    title: "Jobs, training & education",
    desc: "Hiring pathways, apprenticeships, skilled trades, GI Bill resources, resume support, and career guidance.",
  },
  {
    icon: Heart,
    title: "Disabled veteran & family support",
    desc: "Caregiver programs, spouse and dependent benefits, survivor support, and disability-specific resources.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted services & discounts",
    desc: "Vetted local partners offering veteran-friendly products, services, and exclusive pricing.",
  },
  {
    icon: Users,
    title: "End-of-life planning support",
    desc: "Hospice navigation, burial benefits, military honors coordination, and survivor guidance.",
  },
];

export default function About() {
  useEffect(() => {
    document.title = "About Veteran Care | America's Modern Veteran Support Platform";
  }, []);

  return (
    <div className="bg-background min-h-full pb-20" data-testid="page-about">
      {/* ── HERO ── */}
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="container mx-auto px-5 py-14 sm:py-20 max-w-5xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-md bg-white p-1.5 shadow-sm flex items-center justify-center shrink-0">
              <img src={logoImg} alt="Veteran Care" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">About</p>
              <h1 className="font-heading text-3xl sm:text-5xl font-bold leading-tight" data-testid="text-about-title">
                Veteran Care
              </h1>
            </div>
          </div>
          <p className="text-lg sm:text-2xl text-primary-foreground/95 leading-snug max-w-3xl font-medium">
            America's modern, AI-powered veteran support platform.
          </p>
          <p className="text-base sm:text-lg text-primary-foreground/85 leading-relaxed max-w-3xl mt-3">
            We're redefining how veterans, families, and caregivers find support —
            faster, smarter, and all in one place.
          </p>
        </div>
      </section>

      {/* ── TRUST / SCALE / PROOF TILES ── */}
      <section className="container mx-auto px-5 -mt-8 max-w-5xl relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="grid-trust-tiles">
          {TRUST_TILES.map((t, i) => {
            const Icon = t.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-xl border border-border shadow-sm p-3 sm:p-4 text-center"
                data-testid={`tile-trust-${i}`}
              >
                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary mx-auto mb-2 flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="font-heading text-xs sm:text-sm font-bold text-primary leading-tight">{t.label}</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 leading-snug">{t.sub}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── VIDEO — Why People Are Talking About Veteran Care ── */}
      <section className="container mx-auto px-5 pt-12 pb-2 max-w-5xl">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Watch</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
            Why People Are Talking About Veteran Care
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            Real people. Real stories. Real movement.
          </p>
        </div>
        <CampaignHeroVideo
          audience="about"
          fallbackLogo={logoImg}
          platformName={platform.name}
        />
      </section>

      {/* ── EMOTIONAL IMPACT LINE ── */}
      <section className="container mx-auto px-5 py-12 max-w-3xl">
        <div className="text-center" data-testid="text-emotional-impact">
          <p className="font-heading text-2xl sm:text-3xl text-primary leading-snug italic font-semibold">
            "When life gets complicated, getting help shouldn't be."
          </p>
          <p className="text-sm text-muted-foreground mt-3">— The Veteran Care promise</p>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="container mx-auto px-5 pb-12 max-w-5xl">
        <Card className="border-l-4 border-l-accent">
          <CardContent className="pt-7 pb-7">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary mb-3">Our mission</h2>
            <p className="text-base sm:text-lg text-foreground/85 leading-relaxed mb-4">
              Veteran Care is a one-stop resource platform that connects veterans, spouses,
              dependents, caregivers, and the professionals who serve them to the right help —
              quickly and without friction.
            </p>
            <p className="text-base text-foreground/80 leading-relaxed">
              <span className="font-semibold text-primary">Built since 2020 with real-world
              veteran support experience</span>, we focus on quality, speed, accuracy, and the
              human side of getting help.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ── WHY WE'RE DIFFERENT ── */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container mx-auto px-5 py-12 max-w-5xl">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">The difference</p>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
              Why we're different
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-destructive/20" data-testid="card-old-way">
              <CardContent className="pt-6">
                <h3 className="font-heading font-bold text-base text-destructive mb-3 flex items-center gap-2">
                  <XCircle className="h-5 w-5" /> The old way
                </h3>
                <ul className="space-y-2.5">
                  {DIFFERENTIATORS_OUT.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/75" data-testid={`text-old-${i}`}>
                      <XCircle className="h-4 w-4 text-destructive/60 mt-0.5 shrink-0" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-accent/40" data-testid="card-veteran-care-way">
              <CardContent className="pt-6">
                <h3 className="font-heading font-bold text-base text-primary mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-accent" /> The Veteran Care way
                </h3>
                <ul className="space-y-2.5">
                  {DIFFERENTIATORS_IN.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/85 font-medium" data-testid={`text-new-${i}`}>
                      <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── WHAT WE COVER ── */}
      <section className="container mx-auto px-5 py-12 max-w-5xl">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Coverage</p>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
            What Veteran Care covers
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

      {/* ── WHY TRUST US ── */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container mx-auto px-5 py-12 max-w-5xl">
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Confidence</p>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
              Why trust us
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: HandHeart, title: "Built from real-world experience", desc: "Created by people who have lived the veteran support journey from the inside." },
              { icon: Zap, title: "Quality, speed, accuracy", desc: "Verified resources, refreshed regularly, served through a fast modern interface." },
              { icon: Heart, title: "The human side of getting help", desc: "Designed with empathy — because veterans and families deserve dignity, not bureaucracy." },
            ].map((t, i) => {
              const Icon = t.icon;
              return (
                <Card key={i} data-testid={`card-trust-${i}`}>
                  <CardContent className="pt-6">
                    <div className="h-10 w-10 rounded-full bg-accent/15 text-accent flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading font-semibold text-primary mb-1.5">{t.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PREMIUM CTA ── */}
      <section className="container mx-auto px-5 py-14 max-w-5xl">
        <div className="bg-primary text-primary-foreground rounded-2xl p-8 sm:p-12 text-center shadow-lg">
          <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70 mb-3">Get started</p>
          <h3 className="font-heading text-2xl sm:text-4xl font-bold mb-4 leading-tight">
            Ready to get help — or to help others?
          </h3>
          <p className="text-primary-foreground/85 mb-8 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            Browse verified resources, ask the AI Navigator anything, or join our growing Trusted Partner Network.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/resources">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-7 py-6 rounded-full" data-testid="button-cta-resources">
                Browse Resources <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.dispatchEvent(new CustomEvent("open-ai-guide"))}
              className="w-full sm:w-auto text-base px-7 py-6 rounded-full bg-transparent border-white/30 text-white hover:bg-white/10"
              data-testid="button-cta-navigator"
            >
              <Sparkles className="mr-2 h-4 w-4" /> Use AI Navigator
            </Button>
            <Link href="/partners">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-7 py-6 rounded-full bg-transparent border-white/30 text-white hover:bg-white/10" data-testid="button-cta-partner">
                Become a Trusted Partner
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
