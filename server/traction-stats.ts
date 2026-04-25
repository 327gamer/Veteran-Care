/**
 * TRACTION STATS — internal/admin only (Phase: HIDDEN).
 *
 * Aggregates the metrics we plan to expose publicly in a second metrics
 * block on the homepage *later* (after we cross internal activation
 * thresholds — see replit.md "Traction metrics" section).
 *
 * All numbers come from EXISTING tables — no new schema, no overbuild:
 *   - page_views        (server/page-view-logger.ts)         → visits, sessions
 *   - resource_clicks   (server/routes.ts ingest)             → resource clicks
 *   - lead_events       (server/lead-events.ts)               → leads submitted
 *   - ai_usage_log      (server/ai/usage-logger.ts)           → AI sessions
 *   - partner_organizations                                    → partners + businesses
 *   - resources / public-stats                                 → states/cities live
 *
 * If a source table is missing, the corresponding field is returned as 0
 * with `enabled:false` in `sources` so the future UI can show "—" instead
 * of a misleading zero.
 */

import { supabase, supabaseAdmin } from "./supabase";
import { query } from "./pg-client";
import { getPageViewMetrics } from "./page-view-logger";

export interface TractionStats {
  // Visits / sessions (page_views beacon)
  visits_today: number;
  visits_7d: number;
  visits_30d: number;
  page_views_30d: number;

  // Engagement
  resource_clicks_30d: number;
  trusted_partner_clicks_30d: number;
  ai_sessions_30d: number;

  // Conversion
  leads_30d: number;
  leads_total: number;

  // Inventory
  trusted_partners_active: number;
  businesses_listed: number;
  states_live: number;
  cities_covered: number;

  // Bookkeeping
  sources: Record<string, { enabled: boolean; note?: string }>;
  generated_at: string;
}

async function safeCount(
  tableName: string,
  modify?: (qb: any) => any,
): Promise<{ count: number; enabled: boolean; note?: string }> {
  try {
    let qb = supabaseAdmin.from(tableName).select("id", { count: "exact", head: true });
    if (modify) qb = modify(qb);
    const { count, error } = await qb;
    if (error) {
      return { count: 0, enabled: false, note: error.message };
    }
    return { count: count ?? 0, enabled: true };
  } catch (err) {
    return { count: 0, enabled: false, note: (err as Error).message };
  }
}

async function safePgCount(sql: string, params: any[] = []): Promise<{ count: number; enabled: boolean; note?: string }> {
  try {
    const rows = await query<{ c: string }>(sql, params);
    return { count: parseInt(rows[0]?.c ?? "0", 10), enabled: true };
  } catch (err) {
    return { count: 0, enabled: false, note: (err as Error).message };
  }
}

export async function getTractionStats(): Promise<TractionStats> {
  const now = new Date();
  const isoToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const iso7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const iso30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    pv,
    leads30,
    leadsTotal,
    aiSessions30,
    resourceClicks30,
    trustedClicks30,
    partnersActive,
    businessesListed,
    resourcesAll,
  ] = await Promise.all([
    getPageViewMetrics({ isoToday, iso7d, iso30d }),
    safePgCount(
      `SELECT COUNT(*)::text AS c FROM lead_events WHERE event_type = 'explicit_lead' AND created_at >= $1`,
      [iso30d],
    ),
    safePgCount(`SELECT COUNT(*)::text AS c FROM lead_events WHERE event_type = 'explicit_lead'`),
    safeCount("ai_usage_log", (q) => q.gte("created_at", iso30d)),
    safeCount("resource_clicks", (q) => q.gte("created_at", iso30d)),
    safeCount("resource_clicks", (q) =>
      q.gte("created_at", iso30d).eq("click_type", "trusted_partner_strip"),
    ),
    safeCount("partner_organizations", (q) => q.eq("active_paid_partner", true)),
    safeCount("partner_organizations"),
    (async () => {
      try {
        const { data, error } = await supabase
          .from("resources")
          .select("state, city")
          .eq("status", "approved");
        if (error) return { states: 0, cities: 0, enabled: false, note: error.message };
        const states = new Set<string>();
        const cities = new Set<string>();
        for (const r of data || []) {
          const st = (r as any).state?.trim?.();
          const ct = (r as any).city?.trim?.();
          if (st) states.add(st);
          if (st && ct) cities.add(`${ct}, ${st}`);
        }
        return { states: states.size, cities: cities.size, enabled: true };
      } catch (err) {
        return { states: 0, cities: 0, enabled: false, note: (err as Error).message };
      }
    })(),
  ]);

  return {
    visits_today: pv.visitors_today,
    visits_7d: pv.visitors_7d,
    visits_30d: pv.visitors_30d,
    page_views_30d: pv.page_views_30d,
    resource_clicks_30d: resourceClicks30.count,
    trusted_partner_clicks_30d: trustedClicks30.count,
    ai_sessions_30d: aiSessions30.count,
    leads_30d: leads30.count,
    leads_total: leadsTotal.count,
    trusted_partners_active: partnersActive.count,
    businesses_listed: businessesListed.count,
    states_live: (resourcesAll as any).states ?? 0,
    cities_covered: (resourcesAll as any).cities ?? 0,
    sources: {
      page_views: { enabled: pv.enabled },
      lead_events: { enabled: leads30.enabled, note: leads30.note },
      ai_usage_log: { enabled: aiSessions30.enabled, note: aiSessions30.note },
      resource_clicks: { enabled: resourceClicks30.enabled, note: resourceClicks30.note },
      partner_organizations: { enabled: partnersActive.enabled, note: partnersActive.note },
      resources: { enabled: (resourcesAll as any).enabled, note: (resourcesAll as any).note },
    },
    generated_at: new Date().toISOString(),
  };
}
