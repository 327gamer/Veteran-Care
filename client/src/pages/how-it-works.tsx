import { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, MapPin, ShieldCheck, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    n: 1,
    icon: Search,
    title: "Choose a category or search your issue",
    desc: "Pick from 17 veteran-focused categories — healthcare, housing, jobs, benefits, mental health, family support, and more — or type what you need.",
  },
  {
    n: 2,
    icon: MapPin,
    title: "Filter by city, state, or near me",
    desc: "Live, location-aware results. We use real geo data to show what's close, not generic national listings.",
  },
  {
    n: 3,
    icon: ShieldCheck,
    title: "Connect to resources, programs, or trusted services",
    desc: "Direct links, phone numbers, eligibility notes, and verified websites — no dead ends, no runaround.",
  },
  {
    n: 4,
    icon: Sparkles,
    title: "Use the AI Navigator for extra guidance",
    desc: "Stuck? The Navigator answers questions, points you to the right category, and helps you take the next step.",
  },
];

export default function HowItWorks() {
  useEffect(() => {
    document.title = "How It Works | Veteran Care";
  }, []);

  return (
    <div className="bg-background min-h-full pb-20" data-testid="page-how-it-works">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-12 sm:py-16 max-w-5xl">
          <p className="text-xs uppercase tracking-widest text-primary-foreground/70 mb-2">How it works</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-4" data-testid="text-how-title">
            Help in four steps
          </h1>
          <p className="text-lg sm:text-xl text-primary-foreground/90 max-w-3xl leading-relaxed">
            Veteran Care removes the friction. No more hunting through outdated directories or jumping between dozens of websites.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {STEPS.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.n} className="hover:shadow-md transition-shadow border-t-4 border-t-accent" data-testid={`card-step-${s.n}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-heading font-bold text-lg shadow-sm">
                      {s.n}
                    </div>
                    <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-primary mb-2 leading-tight">{s.title}</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed">{s.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Why it saves time */}
      <section className="container mx-auto px-4 pb-12 max-w-5xl">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-heading text-2xl font-bold text-primary mb-4">Why it saves time</h2>
            <ul className="space-y-3">
              {[
                "Live data, not stale PDFs — resources are continuously verified and refreshed.",
                "Geo-aware results, so you see what's actually serving your city.",
                "AI Navigator that understands the language veterans use.",
                "One platform across categories — no jumping between five different directories.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3" data-testid={`text-benefit-${i}`}>
                  <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                  <span className="text-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-12 max-w-5xl">
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-6 sm:p-8 text-center">
          <h3 className="font-heading text-xl sm:text-2xl font-bold text-primary mb-3">Try it now</h3>
          <p className="text-foreground/80 mb-6">Pick a category, set your location, and get connected.</p>
          <Link href="/resources">
            <Button size="lg" data-testid="button-cta-start">
              Start Browsing <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
