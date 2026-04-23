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
} from "lucide-react";
import logoImg from "@assets/Veteran_Care_-_Shadow_(TM)_-_PNG_1775367756504.png";
import CampaignHeroVideo from "@/components/campaign-hero-video";
import MenuPageHero from "@/components/menu-page-hero";
import { platform } from "@shared/platform";

const TRUST_TILES = [
  { icon: Layers, label: "17 Support Categories", sub: "Across veterans, families & caregivers" },
  { icon: Sparkles, label: "AI-Powered Navigator", sub: "Guided help, 24/7" },
  { icon: ShieldCheck, label: "Trusted Partner Network", sub: "Vetted, veteran-friendly providers" },
  { icon: Calendar, label: "Supporting Veterans Since 2020", sub: "Real-world veteran experience" },
  { icon: Globe, label: "Expanding Nationwide", sub: "SC & NC live · more launching" },
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
      <MenuPageHero
        testIdPrefix="about"
        title={["About", "Veteran Care"]}
        subtitle="America's modern, AI-powered veteran support platform."
        detail="Redefining how veterans, families, and caregivers find support — faster, smarter, and all in one place."
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

      {/* ── VIDEO SHOWCASE ──
          Mirrors the landing-page / partners-landing video presentation:
          green band with a soft radial overlay, video centered on top,
          eyebrow + headline + supporting copy stacked below. Eliminates
          the "stranded in white space" feel on desktop. */}
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
        </div>
      </section>

      {/* ── EMOTIONAL IMPACT LINE — sits on white below the green showcase ── */}
      <section className="container mx-auto px-5 pt-10 pb-10 max-w-3xl">
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
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Our Mission</p>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary mb-5">
              Our Mission
            </h2>
            <p className="text-base sm:text-lg text-foreground/85 leading-relaxed mb-4">
              <span className="font-semibold text-primary">Supporting veterans since 2020</span>,
              we are committed to serving those who served our nation with respect, urgency,
              gratitude, and trusted guidance.
            </p>
            <p className="text-base text-foreground/85 leading-relaxed mb-4">
              Every veteran, spouse, dependent, and caregiver deserves clear answers, dependable
              support, and access to the right resources when they need them most.
            </p>
            <p className="text-base text-foreground/85 leading-relaxed mb-5">
              We honor military service by delivering quality, speed, accuracy, and a steady
              commitment to helping people move forward.
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
