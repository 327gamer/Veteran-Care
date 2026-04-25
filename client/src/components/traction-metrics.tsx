/**
 * TRACTION METRICS — HIDDEN placeholder (Phase: prep, do NOT mount publicly).
 *
 * This is the second metrics block planned for the homepage *after* we cross
 * internal activation thresholds (see replit.md "Traction metrics"):
 *   - 100+ trusted partners listed
 *   - 10,000+ visits/30d
 *   - 1,000+ resource_clicks/30d
 *   - 50+ leads submitted total
 *
 * To activate later:
 *   1. Add a public passthrough endpoint /api/public-traction-stats in
 *      server/routes.ts that calls getTractionStats() (no admin gate).
 *   2. Switch the fetch URL below from /api/admin/traction-stats to the
 *      public one.
 *   3. Mount this component on home.tsx directly under <LiveMetrics />.
 *
 * Until then this file is intentionally NOT imported anywhere — it exists so
 * the shape, copy, and styling are ready to ship the moment the founder
 * approves activation.
 */

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Eye,
  MousePointerClick,
  Bot,
  ClipboardList,
  Handshake,
} from "lucide-react";

interface TractionStatsResponse {
  visits_today: number;
  visits_7d: number;
  visits_30d: number;
  page_views_30d: number;
  resource_clicks_30d: number;
  trusted_partner_clicks_30d: number;
  ai_sessions_30d: number;
  leads_30d: number;
  leads_total: number;
  trusted_partners_active: number;
  businesses_listed: number;
  states_live: number;
  cities_covered: number;
  generated_at: string;
}

interface TractionMetricsProps {
  endpoint?: string;
}

export function TractionMetrics({
  endpoint = "/api/admin/traction-stats",
}: TractionMetricsProps) {
  const { data } = useQuery<TractionStatsResponse>({
    queryKey: [endpoint],
    staleTime: 5 * 60 * 1000,
  });

  if (!data) return null;

  const fmt = (n: number) =>
    Number.isFinite(n) ? n.toLocaleString("en-US") : "0";

  const tiles = [
    { icon: Users, value: fmt(data.visits_30d), label: "Visits (30d)" },
    { icon: Eye, value: fmt(data.page_views_30d), label: "Pages Viewed (30d)" },
    { icon: MousePointerClick, value: fmt(data.resource_clicks_30d), label: "Resource Clicks (30d)" },
    { icon: Bot, value: fmt(data.ai_sessions_30d), label: "AI Sessions (30d)" },
    { icon: ClipboardList, value: fmt(data.leads_total), label: "Leads Submitted" },
    { icon: Handshake, value: fmt(data.trusted_partners_active), label: "Trusted Partners" },
  ];

  return (
    <section
      className="container mx-auto px-5 max-w-5xl pt-12 sm:pt-16"
      data-testid="section-traction-metrics"
    >
      <div className="text-center mb-6 sm:mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
          Live engagement
        </p>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-primary">
          The platform in motion.
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
          Real activity, refreshed every few minutes.
        </p>
      </div>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
        data-testid="grid-traction-metrics"
      >
        {tiles.map((m, i) => {
          const Icon = m.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-xl border border-border shadow-sm p-4 sm:p-5 text-center"
              data-testid={`tile-traction-${i}`}
            >
              <div className="h-9 w-9 rounded-full bg-accent/10 text-accent mx-auto mb-2 flex items-center justify-center">
                <Icon className="h-4 w-4" />
              </div>
              <p className="font-heading text-xl sm:text-2xl font-extrabold text-primary leading-tight break-words">
                {m.value}
              </p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wide text-muted-foreground mt-1 leading-snug">
                {m.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
