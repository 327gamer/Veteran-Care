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
} from "lucide-react";
import logoImg from "@assets/Veteran_Care_-_Shadow_(TM)_-_PNG_1775367756504.png";

const PILLARS = [
  { icon: MapPin, title: "Search by city, state, or near me", desc: "Live, location-aware results across all 17 categories." },
  { icon: Sparkles, title: "AI Navigator assistance", desc: "A guided assistant that helps you find the right resource fast." },
  { icon: Stethoscope, title: "Healthcare & mental health", desc: "VA medical centers, clinics, crisis lines, and recovery support." },
  { icon: HomeIcon, title: "Housing & benefits", desc: "Homeless veteran services, claims help, and benefits navigation." },
  { icon: Briefcase, title: "Jobs, training & education", desc: "Employment programs, GI Bill resources, and career pathways." },
  { icon: Heart, title: "Disabled veteran & family support", desc: "Caregiver, spouse, dependent, and survivor programs." },
  { icon: ShieldCheck, title: "Trusted services & discounts", desc: "Vetted partners offering veteran-friendly products and pricing." },
  { icon: Users, title: "End-of-life planning support", desc: "Hospice navigation, burial benefits, and survivor guidance." },
];

export default function About() {
  useEffect(() => {
    document.title = "About Veteran Care | AI-Powered Veteran Resource Platform";
  }, []);

  return (
    <div className="bg-background min-h-full pb-20" data-testid="page-about">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-12 sm:py-16 max-w-5xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-md bg-white p-1.5 shadow-sm flex items-center justify-center">
              <img src={logoImg} alt="Veteran Care" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-foreground/70">About</p>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold" data-testid="text-about-title">
                Veteran Care
              </h1>
            </div>
          </div>
          <p className="text-lg sm:text-xl text-primary-foreground/90 leading-relaxed max-w-3xl">
            A modern, AI-powered ecosystem built to make getting help faster, easier, and more efficient for those who served — and the people who support them.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <Card className="border-l-4 border-l-accent">
          <CardContent className="pt-6">
            <h2 className="font-heading text-2xl font-bold text-primary mb-3">Our mission</h2>
            <p className="text-base sm:text-lg text-foreground/80 leading-relaxed mb-4">
              Veteran Care is a one-stop resource platform that connects veterans, spouses, dependents, caregivers, and the professionals who serve them to the right help — quickly and without friction.
            </p>
            <p className="text-base text-foreground/80 leading-relaxed">
              <span className="font-semibold text-primary">We help veterans, spouses, dependents, caregivers, and those who serve them.</span> Built since 2020 with real-world veteran support experience, we focus on quality, accuracy, and the human side of getting help.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* What we cover */}
      <section className="container mx-auto px-4 pb-12 max-w-5xl">
        <h2 className="font-heading text-2xl font-bold text-primary mb-6 text-center">What Veteran Care covers</h2>
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

      {/* Who we serve */}
      <section className="container mx-auto px-4 pb-12 max-w-5xl">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-heading text-2xl font-bold text-primary mb-4">Who we serve</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
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

      {/* CTA */}
      <section className="container mx-auto px-4 pb-12 max-w-5xl">
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-6 sm:p-8 text-center">
          <h3 className="font-heading text-xl sm:text-2xl font-bold text-primary mb-3">Ready to get help?</h3>
          <p className="text-foreground/80 mb-6 max-w-2xl mx-auto">Browse resources by category, search your city, or ask the AI Navigator for guidance.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/resources">
              <Button size="lg" className="w-full sm:w-auto" data-testid="button-cta-resources">
                Browse Resources <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/how-it-works">
              <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-cta-how-it-works">
                See How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
