import { CheckCircle2, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { usePublicStats } from "@/hooks/use-public-stats";

interface CoverageGrowthProps {
  className?: string;
}

export function CoverageGrowth({ className = "" }: CoverageGrowthProps) {
  const { stats, isLoading, hasLiveData } = usePublicStats();
  const showSkeleton = isLoading && !hasLiveData;

  return (
    <section
      className={`container mx-auto px-5 max-w-3xl ${className}`}
      data-testid="section-coverage"
    >
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6 pb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Current coverage growth
          </p>
          <h2
            className="font-heading text-xl sm:text-2xl font-bold text-primary mb-2"
            data-testid="text-coverage-region"
          >
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
              {showSkeleton ? (
                <ul className="space-y-1.5" aria-hidden="true">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded bg-muted/60 animate-pulse shrink-0" />
                      <span className="h-4 w-28 rounded bg-muted/60 animate-pulse" />
                    </li>
                  ))}
                </ul>
              ) : (
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
              )}
            </div>

            <div data-testid="block-next-state">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                Launching next
              </p>
              <div className="flex items-center gap-2 text-sm text-foreground/85">
                <Rocket className="h-4 w-4 text-accent shrink-0" />
                {showSkeleton ? (
                  <span
                    className="h-4 w-24 rounded bg-muted/60 animate-pulse"
                    aria-hidden="true"
                  />
                ) : (
                  <span className="font-medium" data-testid="text-next-state">
                    {stats.nextStateLaunching}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                National expansion roadmap underway with additional states launching regularly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
