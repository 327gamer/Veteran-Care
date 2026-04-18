// Veteran Care — page-view ingest helper
// Fire-and-forget. Soft-detects table presence on first use; if missing,
// silently disables itself. Never throws into request handlers.
//
// Uses direct pg connection (same path as other event tables in this
// project, e.g. trusted_service_categories) to avoid PostgREST schema
// cache lag after table creation.

import { query } from "./pg-client";

let hasTable = false;
let checked = false;

async function ensureTableCheck() {
  if (checked) return;
  checked = true;
  try {
    const rows = await query<{ t: string | null }>("SELECT to_regclass('public.page_views')::text AS t");
    hasTable = !!rows[0]?.t;
    if (!hasTable) {
      console.log("[page-views] page_views table not found — beacon disabled. Run supabase/create_page_views.sql to enable.");
    } else {
      console.log("[page-views] page_views table detected — beacon enabled");
    }
  } catch (err) {
    hasTable = false;
    console.log("[page-views] table probe failed — beacon disabled:", (err as Error).message);
  }
}

export type PageViewIngest = {
  sessionId: string | null;
  path: string;
  referrer: string | null;
  isMobile: boolean;
  userAgent: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  utmId: string | null;
  ambassadorCode: string | null;
};

// Tiny in-memory rate limit per session_id to dampen accidental loops.
// Max ~1 page view / 750ms / session. Drops the rest silently.
const lastWriteAtBySession = new Map<string, number>();
const MIN_INTERVAL_MS = 750;
const MAX_SESSIONS_TRACKED = 5000;

function rateLimited(sessionId: string | null): boolean {
  if (!sessionId) return false;
  const now = Date.now();
  const last = lastWriteAtBySession.get(sessionId) || 0;
  if (now - last < MIN_INTERVAL_MS) return true;
  if (lastWriteAtBySession.size > MAX_SESSIONS_TRACKED) {
    const keys = Array.from(lastWriteAtBySession.keys()).slice(0, 1000);
    keys.forEach(k => lastWriteAtBySession.delete(k));
  }
  lastWriteAtBySession.set(sessionId, now);
  return false;
}

export async function ingestPageView(p: PageViewIngest): Promise<void> {
  await ensureTableCheck();
  if (!hasTable) return;
  if (rateLimited(p.sessionId)) return;

  try {
    await query(
      `INSERT INTO page_views (
        session_id, path, referrer, is_mobile, user_agent,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_id,
        ambassador_code
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        p.sessionId,
        p.path,
        p.referrer,
        p.isMobile,
        p.userAgent ? p.userAgent.slice(0, 500) : null,
        p.utmSource, p.utmMedium, p.utmCampaign, p.utmContent, p.utmTerm, p.utmId,
        p.ambassadorCode,
      ]
    );
  } catch (err) {
    console.log("[page-views] insert failed:", (err as Error).message);
  }
}

// Aggregation helpers used by the exec-summary endpoint.
// Returns null sentinel-friendly empty data if table is absent.
export type PageViewMetrics = {
  enabled: boolean;
  visitors_today: number;
  visitors_7d: number;
  visitors_30d: number;
  page_views_30d: number;
  mobile_share_pct_30d: number;
  utm_attributed_views_30d: number;
  ambassador_attributed_views_30d: number;
  top_landing_paths_7d: { path: string; views: number }[];
};

export async function getPageViewMetrics(opts: {
  isoToday: string;
  iso7d: string;
  iso30d: string;
}): Promise<PageViewMetrics> {
  await ensureTableCheck();
  const empty: PageViewMetrics = {
    enabled: false,
    visitors_today: 0, visitors_7d: 0, visitors_30d: 0,
    page_views_30d: 0, mobile_share_pct_30d: 0,
    utm_attributed_views_30d: 0, ambassador_attributed_views_30d: 0,
    top_landing_paths_7d: [],
  };
  if (!hasTable) return empty;

  try {
    const totalsP = query<{
      pv30: string; mobile30: string; utm30: string; amb30: string;
      visitors_today: string; visitors_7d: string; visitors_30d: string;
    }>(
      `SELECT
        COUNT(*) FILTER (WHERE created_at >= $3)::text AS pv30,
        COUNT(*) FILTER (WHERE created_at >= $3 AND is_mobile)::text AS mobile30,
        COUNT(*) FILTER (WHERE created_at >= $3 AND (utm_id IS NOT NULL OR utm_source IS NOT NULL OR utm_campaign IS NOT NULL))::text AS utm30,
        COUNT(*) FILTER (WHERE created_at >= $3 AND ambassador_code IS NOT NULL)::text AS amb30,
        COUNT(DISTINCT session_id) FILTER (WHERE created_at >= $1 AND session_id IS NOT NULL)::text AS visitors_today,
        COUNT(DISTINCT session_id) FILTER (WHERE created_at >= $2 AND session_id IS NOT NULL)::text AS visitors_7d,
        COUNT(DISTINCT session_id) FILTER (WHERE created_at >= $3 AND session_id IS NOT NULL)::text AS visitors_30d
       FROM page_views
       WHERE created_at >= $3`,
      [opts.isoToday, opts.iso7d, opts.iso30d]
    );
    const topPathsP = query<{ path: string; views: string }>(
      `SELECT path, COUNT(*)::text AS views
         FROM page_views
        WHERE created_at >= $1 AND path IS NOT NULL
        GROUP BY path
        ORDER BY COUNT(*) DESC
        LIMIT 10`,
      [opts.iso7d]
    );
    const [totals, topPaths] = await Promise.all([totalsP, topPathsP]);
    const t = totals[0] || ({} as any);
    const pv30 = parseInt(t.pv30 || "0", 10);
    const mobile30 = parseInt(t.mobile30 || "0", 10);
    return {
      enabled: true,
      visitors_today: parseInt(t.visitors_today || "0", 10),
      visitors_7d: parseInt(t.visitors_7d || "0", 10),
      visitors_30d: parseInt(t.visitors_30d || "0", 10),
      page_views_30d: pv30,
      mobile_share_pct_30d: pv30 ? Math.round(100 * mobile30 / pv30) : 0,
      utm_attributed_views_30d: parseInt(t.utm30 || "0", 10),
      ambassador_attributed_views_30d: parseInt(t.amb30 || "0", 10),
      top_landing_paths_7d: topPaths.map(r => ({ path: r.path, views: parseInt(r.views, 10) })),
    };
  } catch (err) {
    console.log("[page-views] metrics query failed:", (err as Error).message);
    return empty;
  }
}
