import { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Search, Clock, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

const USE_CASES = [
  { icon: Search, title: "Resource lookup by geography", desc: "Find programs by city, county, or state without manually combing through PDFs and out-of-date directories." },
  { icon: ShieldCheck, title: "Benefits navigation support", desc: "VA benefits, claims, healthcare enrollment, and disability-related programs in one searchable place." },
  { icon: Briefcase, title: "Housing and employment leads", desc: "Homeless veteran services, employment programs, and training resources mapped to your client's location." },
  { icon: Clock, title: "Real-time category search", desc: "Faster than calling around. Live data, verified URLs, current phone numbers, and eligibility notes." },
];

export default function CaseManagers() {
  useEffect(() => {
    document.title = "For Case Managers | Veteran Care";
  }, []);

  return (
    <div className="bg-background min-h-full pb-20" data-testid="page-case-managers">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-12 sm:py-16 max-w-5xl">
          <p className="text-xs uppercase tracking-widest text-primary-foreground/70 mb-2">For professionals</p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-4" data-testid="text-cm-title">
            Veteran Care for case managers
          </h1>
          <p className="text-lg sm:text-xl text-primary-foreground/90 max-w-3xl leading-relaxed">
            A professional tool that helps you connect veteran clients to the right resources faster — without the directory-hunting.
          </p>
        </div>
      </section>

      {/* Use cases */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <h2 className="font-heading text-2xl font-bold text-primary mb-6">How professionals use Veteran Care</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {USE_CASES.map((u, i) => {
            const Icon = u.icon;
            return (
              <Card key={i} className="hover:shadow-md transition-shadow" data-testid={`card-usecase-${i}`}>
                <CardContent className="pt-6">
                  <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading font-semibold text-primary mb-1.5">{u.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{u.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Who benefits */}
      <section className="container mx-auto px-4 pb-12 max-w-5xl">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-heading text-2xl font-bold text-primary mb-4">Built for the people who serve veterans</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {[
                "VA case managers",
                "VSO service officers",
                "County veterans affairs staff",
                "Nonprofit caseworkers",
                "Hospital social workers",
                "Mental health clinicians",
                "Housing navigators",
                "Employment counselors",
                "State agency staff",
              ].map((role) => (
                <div key={role} className="flex items-center gap-2 text-foreground/80" data-testid={`text-role-${role.toLowerCase().replace(/\s+/g, "-")}`}>
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                  {role}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-12 max-w-5xl">
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-6 sm:p-8 text-center">
          <h3 className="font-heading text-xl sm:text-2xl font-bold text-primary mb-3">Use it on your next client call</h3>
          <p className="text-foreground/80 mb-6 max-w-2xl mx-auto">No login required. Open the resource browser, enter the client's city, and start connecting.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/resources">
              <Button size="lg" data-testid="button-cta-resources">
                <MapPin className="mr-2 h-4 w-4" /> Open Resource Browser <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" data-testid="button-cta-contact">
                Talk to Our Team
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
