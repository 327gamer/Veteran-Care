import {
  Database,
  Building2,
  Rocket,
  TrendingUp,
  Flag,
  Layers,
} from "lucide-react";
import { usePublicStats, formatStatNumber } from "@/hooks/use-public-stats";

interface LiveMetricsProps {
  eyebrow?: string;
  headline?: string;
  subheadline?: string;
  footnote?: string;
  className?: string;
}

export function LiveMetrics({
  eyebrow = "Live platform metrics",
  headline = "Real momentum. Real coverage.",
  subheadline = "Every number below reflects what's live on the platform right now.",
  footnote,
  className = "",
}: LiveMetricsProps) {
  const { stats, isLoading, hasLiveData } = usePublicStats();
  const showSkeleton = isLoading && !hasLiveData;

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

  const resolvedFootnote =
    footnote ??
    (stats.isEstimated
      ? "Estimated coverage — refreshing live counts. Soon serving all 50 states."
      : "Soon serving all 50 states.");

  return (
    <section
      className={`container mx-auto px-5 max-w-5xl ${className}`}
      data-testid="section-live-metrics"
    >
      <div className="text-center mb-6 sm:mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
          {eyebrow}
        </p>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
          {headline}
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
          {subheadline}
        </p>
      </div>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
        data-testid="grid-live-metrics"
      >
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
                className="font-heading text-base sm:text-xl md:text-2xl font-extrabold text-primary leading-tight tracking-tight [overflow-wrap:break-word] hyphens-none"
                data-testid={`text-metric-value-${i}`}
              >
                {showSkeleton ? (
                  <span
                    className="inline-block h-5 sm:h-6 md:h-7 w-16 sm:w-20 bg-muted/60 rounded animate-pulse align-middle"
                    aria-hidden="true"
                  />
                ) : (
                  m.value
                )}
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
      <p
        className="text-center text-[11px] text-muted-foreground mt-4 italic"
        data-testid="text-metrics-footnote"
      >
        {resolvedFootnote}
      </p>
    </section>
  );
}
