import { Home, ArrowRight, Building2 } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Founder QA 2026-05-01 (Fix 3): real-estate was removed from the Elite
// Sponsor monetized set (server/elite-sponsor.ts ECSS_CATEGORIES). The page
// remains as a Trusted Services taxonomy placeholder, but the Elite banner +
// "become an Elite Sponsor" CTA are intentionally removed below.

export default function RealEstate() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header — matches the shared category-drilldown header style */}
      <section className="bg-card border-b">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-14 w-14 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Home className="h-7 w-7 text-emerald-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h1
                className="text-2xl md:text-3xl font-bold tracking-tight"
                data-testid="text-real-estate-title"
              >
                Real Estate
              </h1>
              <p
                className="mt-1.5 text-sm md:text-base text-muted-foreground"
                data-testid="text-real-estate-description"
              >
                Veteran-friendly real estate professionals — homebuying, selling,
                relocation, and investment support for veterans and military
                families.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Body — Phase A directory expansion in progress.
          Elite Sponsor banner intentionally omitted (see file header). */}
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        <Card className="border-dashed">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-stone-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2
                  className="text-lg font-semibold"
                  data-testid="text-coming-soon-title"
                >
                  Veteran-friendly real estate directory expanding soon
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  We're building out our full directory of veteran-friendly
                  real estate agents and brokerages. In the meantime, explore
                  related housing or financial resources below.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/housing")}
                    data-testid="button-explore-housing"
                  >
                    Housing Resources
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLocation("/financial-services")}
                    data-testid="button-explore-financial"
                  >
                    Mortgage / Lending
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
