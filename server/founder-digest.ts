// Founder Daily Command Center Email
// Additive only. Pure read aggregations. Does NOT touch routing, billing,
// attribution, or any production engine. Can be killed instantly via
// FOUNDER_DIGEST_DISABLED=1.

import { Resend } from "resend";
import { supabaseAdmin } from "./supabase";
import { platform } from "../shared/platform";
import { query as pgQuery } from "./pg-client";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || `${platform.name} <onboarding@resend.dev>`;

// Two daily digest slots — morning + afternoon. Hours in America/New_York.
const SLOT_MORNING_HOUR = 8;   // 8 AM ET
const SLOT_AFTERNOON_HOUR = 16; // 4 PM ET
type DigestSlot = "morning" | "afternoon";

// Best-effort DB persistence so server restarts don't re-fire a slot that was
// already sent today. Table is created lazily on first use; failures are
// logged but never block the timer (fail-soft).
async function ensureDigestLogTable(): Promise<void> {
  try {
    await pgQuery(
      `CREATE TABLE IF NOT EXISTS founder_digest_log (
         id           bigserial PRIMARY KEY,
         et_date      date        NOT NULL,
         slot         text        NOT NULL,
         status       text        NOT NULL DEFAULT 'sent',
         sent_at      timestamptz NOT NULL DEFAULT now(),
         recipients   text,
         resend_id    text,
         UNIQUE (et_date, slot)
       )`,
      []
    );
    // Forward-compat: add status column if the table predates this fix.
    await pgQuery(
      `ALTER TABLE founder_digest_log ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent'`,
      []
    );
  } catch (err: any) {
    console.log("[founder-digest] ensureDigestLogTable:", err?.message);
  }
}

// Atomic single-statement claim. Returns true ONLY if this caller inserted the
// row (i.e., won the race). Concurrent boots / overlapping instances will lose
// the conflict and skip the send. Returns null if the DB is unhealthy — caller
// MUST treat that as "do not send" (fail-closed) to prevent flooding.
async function claimSlot(etDate: string, slot: DigestSlot): Promise<boolean | null> {
  try {
    const rows = await pgQuery<{ id: number }>(
      `INSERT INTO founder_digest_log (et_date, slot, status)
         VALUES ($1::date, $2, 'claimed')
         ON CONFLICT (et_date, slot) DO NOTHING
         RETURNING id`,
      [etDate, slot]
    );
    return rows.length > 0;
  } catch (err: any) {
    console.log("[founder-digest] claimSlot DB error (failing closed):", err?.message);
    return null;
  }
}

async function markSlotSent(etDate: string, slot: DigestSlot, recipients: string[], resendId: string | null): Promise<void> {
  try {
    await pgQuery(
      `UPDATE founder_digest_log
          SET status = 'sent',
              sent_at = now(),
              recipients = $3,
              resend_id = $4
        WHERE et_date = $1::date AND slot = $2`,
      [etDate, slot, recipients.join(","), resendId]
    );
  } catch (err: any) {
    console.log("[founder-digest] markSlotSent:", err?.message);
  }
}

// Release a claimed-but-failed slot so the next tick can retry within the
// 1-hour window. We only release rows still in "claimed" state — never
// "sent" rows.
async function releaseClaim(etDate: string, slot: DigestSlot): Promise<void> {
  try {
    await pgQuery(
      `DELETE FROM founder_digest_log WHERE et_date = $1::date AND slot = $2 AND status = 'claimed'`,
      [etDate, slot]
    );
  } catch (err: any) {
    console.log("[founder-digest] releaseClaim:", err?.message);
  }
}

function getRecipients(): string[] {
  const fromEnv = (process.env.FOUNDER_DIGEST_TO || "").split(",").map(s => s.trim()).filter(Boolean);
  if (fromEnv.length > 0) return fromEnv;
  return [platform.email.defaultNotifyEmail];
}

function isDisabled(): boolean {
  return process.env.FOUNDER_DIGEST_DISABLED === "1";
}

function etDateString(d: Date = new Date()): string {
  // YYYY-MM-DD in America/New_York
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function etHour(d: Date = new Date()): number {
  return parseInt(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }).format(d), 10);
}

function etYesterdayBounds(): { startIso: string; endIso: string; label: string } {
  // Compute ET "yesterday" 00:00 → 23:59:59 expressed in absolute UTC ISO
  const now = new Date();
  const etYmd = etDateString(now);
  const [y, m, d] = etYmd.split("-").map(n => parseInt(n, 10));
  // Build UTC anchor for ET 00:00 today (approximation — works because we
  // only use these as broad gte/lt filters, off-by-one minute irrelevant)
  const etTodayUtc = new Date(Date.UTC(y, m - 1, d, 5, 0, 0)); // ET-05:00 standard; will be off 1h during DST but acceptable for daily window
  const startIso = new Date(etTodayUtc.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const endIso = etTodayUtc.toISOString();
  const label = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric" }).format(new Date(etTodayUtc.getTime() - 24 * 60 * 60 * 1000));
  return { startIso, endIso, label };
}

function isoDaysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

interface DigestData {
  yesterdayLabel: string;
  yesterday: {
    leadsTotal: number;
    leadsRouted: number;
    aiChats: number;
    navigatorSuggested: number;
    paymentsBilledCount: number;
    paymentsBilledAmount: number;
    outcomesWon: number;
    outcomesLost: number;
    outcomesNoContact: number;
  };
  trend7d: { date: string; leads: number }[];
  alerts: { level: "red" | "amber"; message: string }[];
  stuck: {
    over24h: number;
    over72h: number;
    sample: { id: string; veteranName: string; ageHours: number; status: string; category: string | null }[];
  };
  payments: {
    failedCount: number;
    holdCount: number;
    reviewRequiredCount: number;
    pendingUnbilledCount: number;
    pendingUnbilledAmount: number;
  };
  applications: {
    last24hCount: number;
    awaitingReviewCount: number;
  };
  topCategories7d: { category: string; count: number }[];
  topCities7d: { city: string; state: string | null; count: number }[];
  outcomes7d: {
    won: number;
    lost: number;
    noContact: number;
    unset: number;
    routedTotal: number;
    captureRatePct: number;
    conversionRatePct: number;
  };
}

async function assembleDigestData(): Promise<DigestData> {
  const { startIso: yStart, endIso: yEnd, label: yesterdayLabel } = etYesterdayBounds();
  const since7d = isoDaysAgo(7);
  const since30d = isoDaysAgo(30);
  const stuck24Cutoff = isoDaysAgo(1);
  const stuck72Cutoff = isoDaysAgo(3);

  // Pull last 30d of leads in one query — covers yesterday, 7d trend, stuck, top categories/cities, outcomes
  const { data: leads30d } = await supabaseAdmin
    .from("navigator_requests")
    .select("id, veteran_name, status, category, user_state, user_city, routed_to_partner_id, partner_outcome, is_billable, billed, billing_amount, billing_workflow_status, created_at")
    .gte("created_at", since30d)
    .order("created_at", { ascending: false })
    .limit(5000);

  const allLeads = leads30d || [];

  // Yesterday slice
  const yesterdayLeads = allLeads.filter(l => l.created_at >= yStart && l.created_at < yEnd);
  const yesterdayBilled = yesterdayLeads.filter(l => l.billed === true);

  // Yesterday's outcome captures (counted by created_at; conservative — only counts leads created yesterday with outcome set)
  // For a true "outcomes recorded yesterday" we'd need an outcome_set_at column; intentionally deferred.
  const yesterdayWon = yesterdayLeads.filter(l => (l.partner_outcome || "").toLowerCase() === "won").length;
  const yesterdayLost = yesterdayLeads.filter(l => (l.partner_outcome || "").toLowerCase() === "lost").length;
  const yesterdayNoContact = yesterdayLeads.filter(l => (l.partner_outcome || "").toLowerCase() === "no_contact").length;

  // 7-day trend — leads per ET day, oldest → newest
  const trend7d: { date: string; leads: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const ymd = etDateString(dayDate);
    const dayStart = new Date(`${ymd}T00:00:00-05:00`).toISOString();
    const dayEnd = new Date(new Date(dayStart).getTime() + 24 * 60 * 60 * 1000).toISOString();
    const count = allLeads.filter(l => l.created_at >= dayStart && l.created_at < dayEnd).length;
    const shortLabel = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", month: "numeric", day: "numeric" }).format(dayDate);
    trend7d.push({ date: shortLabel, leads: count });
  }

  // Stuck leads (still new/in_progress, > 24h old)
  const stuckLeads = allLeads.filter(l => (l.status === "new" || l.status === "in_progress") && l.created_at < stuck24Cutoff);
  const stuckOver24 = stuckLeads.length;
  const stuckOver72 = stuckLeads.filter(l => l.created_at < stuck72Cutoff).length;
  const stuckSample = stuckLeads.slice(0, 5).map(l => ({
    id: l.id,
    veteranName: l.veteran_name || "Unnamed",
    ageHours: Math.round((Date.now() - new Date(l.created_at).getTime()) / (60 * 60 * 1000)),
    status: l.status,
    category: l.category,
  }));

  // Payments rollup
  const billable30d = allLeads.filter(l => l.is_billable === true);
  const failedCount = billable30d.filter(l => l.billing_workflow_status === "failed").length;
  const holdCount = billable30d.filter(l => l.billing_workflow_status === "hold").length;
  const reviewRequiredCount = billable30d.filter(l => l.billing_workflow_status === "review_required").length;
  const pendingUnbilled = billable30d.filter(l => l.billed !== true && l.billing_workflow_status !== "failed" && l.billing_workflow_status !== "hold");
  const pendingUnbilledAmount = pendingUnbilled.reduce((sum, l) => sum + (parseFloat(String(l.billing_amount || 0)) || 0), 0);

  // Applications
  let last24hAppCount = 0;
  let awaitingReviewCount = 0;
  try {
    const { data: apps24 } = await supabaseAdmin.from("partner_applications").select("id").gte("created_at", isoDaysAgo(1));
    last24hAppCount = (apps24 || []).length;
    const { data: appsPending } = await supabaseAdmin.from("partner_applications").select("id").in("status", ["pending", "submitted", "under_review"]);
    awaitingReviewCount = (appsPending || []).length;
  } catch { /* table may have different status values; fail-soft */ }

  // Top categories (last 7d)
  const leads7d = allLeads.filter(l => l.created_at >= since7d);
  const catMap = new Map<string, number>();
  leads7d.forEach(l => {
    const c = (l.category || "uncategorized").replace(/-/g, " ").replace(/\b\w/g, ch => ch.toUpperCase());
    catMap.set(c, (catMap.get(c) || 0) + 1);
  });
  const topCategories7d = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([category, count]) => ({ category, count }));

  // Top cities (last 7d) — exclude unknowns. Upgrade #5: keep enough rows
  // to render multi-state breakdown without flattening growth across states.
  const cityMap = new Map<string, { city: string; state: string | null; count: number }>();
  leads7d.forEach(l => {
    if (!l.user_city) return;
    const key = `${l.user_city}|${l.user_state || ""}`;
    const existing = cityMap.get(key);
    if (existing) existing.count += 1;
    else cityMap.set(key, { city: l.user_city, state: l.user_state, count: 1 });
  });
  const topCities7d = Array.from(cityMap.values()).sort((a, b) => b.count - a.count).slice(0, 12);

  // Outcomes (last 7d) — capture rate among routed leads
  const routed7d = leads7d.filter(l => l.routed_to_partner_id);
  const won7d = routed7d.filter(l => (l.partner_outcome || "").toLowerCase() === "won").length;
  const lost7d = routed7d.filter(l => (l.partner_outcome || "").toLowerCase() === "lost").length;
  const noContact7d = routed7d.filter(l => (l.partner_outcome || "").toLowerCase() === "no_contact").length;
  const unset7d = routed7d.filter(l => !l.partner_outcome).length;
  const captured7d = won7d + lost7d + noContact7d;
  const captureRatePct = routed7d.length === 0 ? 0 : Math.round((captured7d / routed7d.length) * 100);
  const conversionRatePct = captured7d === 0 ? 0 : Math.round((won7d / captured7d) * 100);

  // AI activity (yesterday)
  let aiChatsYesterday = 0;
  let navigatorSuggestedYesterday = 0;
  try {
    const { data: aiRows } = await supabaseAdmin
      .from("ai_usage_log")
      .select("id, navigator_suggested, created_at")
      .gte("created_at", yStart)
      .lt("created_at", yEnd)
      .limit(5000);
    aiChatsYesterday = (aiRows || []).length;
    navigatorSuggestedYesterday = (aiRows || []).filter((r: any) => r.navigator_suggested).length;
  } catch { /* table may be absent in some envs; fail-soft */ }

  // Red alerts
  const alerts: { level: "red" | "amber"; message: string }[] = [];
  if (failedCount > 0) alerts.push({ level: "red", message: `${failedCount} billable lead${failedCount === 1 ? "" : "s"} with failed payment status — review billing tab` });
  if (stuckOver72 > 0) alerts.push({ level: "red", message: `${stuckOver72} lead${stuckOver72 === 1 ? "" : "s"} stuck > 72h with no resolution` });
  if (stuckOver24 >= 5) alerts.push({ level: "amber", message: `${stuckOver24} leads aged > 24h without resolution` });
  if (reviewRequiredCount > 0) alerts.push({ level: "amber", message: `${reviewRequiredCount} billing item${reviewRequiredCount === 1 ? "" : "s"} flagged for manual review` });
  if (awaitingReviewCount >= 3) alerts.push({ level: "amber", message: `${awaitingReviewCount} partner applications awaiting review` });

  return {
    yesterdayLabel,
    yesterday: {
      leadsTotal: yesterdayLeads.length,
      leadsRouted: yesterdayLeads.filter(l => l.routed_to_partner_id).length,
      aiChats: aiChatsYesterday,
      navigatorSuggested: navigatorSuggestedYesterday,
      paymentsBilledCount: yesterdayBilled.length,
      paymentsBilledAmount: yesterdayBilled.reduce((sum, l) => sum + (parseFloat(String(l.billing_amount || 0)) || 0), 0),
      outcomesWon: yesterdayWon,
      outcomesLost: yesterdayLost,
      outcomesNoContact: yesterdayNoContact,
    },
    trend7d,
    alerts,
    stuck: { over24h: stuckOver24, over72h: stuckOver72, sample: stuckSample },
    payments: {
      failedCount,
      holdCount,
      reviewRequiredCount,
      pendingUnbilledCount: pendingUnbilled.length,
      pendingUnbilledAmount,
    },
    applications: { last24hCount: last24hAppCount, awaitingReviewCount },
    topCategories7d,
    topCities7d,
    outcomes7d: { won: won7d, lost: lost7d, noContact: noContact7d, unset: unset7d, routedTotal: routed7d.length, captureRatePct, conversionRatePct },
  };
}

function fmtUsd(n: number): string {
  return `$${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function buildDigestHtml(d: DigestData): string {
  const baseUrl = platform.domain ? `https://${platform.domain}` : "";
  const adminLink = baseUrl ? `<p style="margin:20px 0 0 0;text-align:center;"><a href="${baseUrl}/admin" style="color:#166534;font-weight:600;text-decoration:none;font-size:14px;">Open Admin Panel →</a></p>` : "";

  // Sparkline rows
  const maxLeads = Math.max(1, ...d.trend7d.map(t => t.leads));
  const trendRows = d.trend7d.map(t => {
    const pct = Math.round((t.leads / maxLeads) * 100);
    return `<tr>
      <td style="padding:3px 8px;color:#6B7280;font-size:11px;width:70px;">${t.date}</td>
      <td style="padding:3px 0;width:100%;">
        <div style="background:#F3F4F6;border-radius:3px;height:14px;width:100%;overflow:hidden;">
          <div style="background:#166534;height:14px;width:${pct}%;border-radius:3px;"></div>
        </div>
      </td>
      <td style="padding:3px 8px;text-align:right;color:#111827;font-size:12px;font-weight:600;width:30px;">${t.leads}</td>
    </tr>`;
  }).join("");

  const alertsHtml = d.alerts.length === 0
    ? `<div style="padding:10px 12px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:6px;color:#166534;font-size:13px;">No red alerts. Operational.</div>`
    : d.alerts.map(a => {
        const bg = a.level === "red" ? "#FEE2E2" : "#FEF3C7";
        const border = a.level === "red" ? "#FECACA" : "#FDE68A";
        const color = a.level === "red" ? "#991B1B" : "#92400E";
        const icon = a.level === "red" ? "■" : "▲";
        return `<div style="padding:10px 12px;background:${bg};border:1px solid ${border};border-radius:6px;color:${color};font-size:13px;margin-bottom:6px;"><strong>${icon}</strong> ${a.message}</div>`;
      }).join("");

  const stuckSampleHtml = d.stuck.sample.length === 0
    ? ""
    : `<div style="margin-top:8px;font-size:11px;color:#6B7280;">Oldest:</div>` +
      d.stuck.sample.map(s =>
        `<div style="font-size:12px;color:#374151;padding:4px 0;border-bottom:1px solid #F3F4F6;">${s.veteranName} — ${s.category || "general"} — <strong>${s.ageHours}h</strong> (${s.status.replace("_", " ")})</div>`
      ).join("");

  const topCatHtml = d.topCategories7d.length === 0
    ? `<div style="color:#9CA3AF;font-size:12px;">No leads in last 7 days</div>`
    : d.topCategories7d.map(c =>
        `<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #F3F4F6;font-size:13px;"><span style="color:#374151;">${c.category}</span><span style="color:#111827;font-weight:600;">${c.count}</span></div>`
      ).join("");

  // Upgrade #5: group cities by state so multi-state growth stays readable
  // instead of being flattened into one mixed list.
  const byState = new Map<string, { city: string; count: number }[]>();
  d.topCities7d.forEach(c => {
    const stateKey = c.state || "Unknown";
    const arr = byState.get(stateKey) || [];
    arr.push({ city: c.city, count: c.count });
    byState.set(stateKey, arr);
  });
  // Sort states by total volume desc; cities within each state by count desc
  const stateBlocks = Array.from(byState.entries())
    .map(([st, cities]) => ({
      state: st,
      total: cities.reduce((s, c) => s + c.count, 0),
      cities: cities.sort((a, b) => b.count - a.count).slice(0, 5),
    }))
    .sort((a, b) => b.total - a.total);

  const topCityHtml = d.topCities7d.length === 0
    ? `<div style="color:#9CA3AF;font-size:12px;">No located leads in last 7 days</div>`
    : stateBlocks.map(block => `
        <div style="margin-bottom:6px;">
          <div style="font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;padding:4px 0 2px 0;">${block.state} <span style="color:#9CA3AF;font-weight:400;">· ${block.total} total</span></div>
          ${block.cities.map(c =>
            `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #F3F4F6;font-size:13px;"><span style="color:#374151;">&nbsp;&nbsp;${c.city}</span><span style="color:#111827;font-weight:600;">${c.count}</span></div>`
          ).join("")}
        </div>`
      ).join("");

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${platform.name} — Daily Command Center</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:16px;color:#111827;background:#FFFFFF;">

  <div style="text-align:center;padding:12px 0 16px 0;border-bottom:2px solid #166534;margin-bottom:18px;">
    <h1 style="margin:0;color:#166534;font-size:18px;font-weight:700;">${platform.name} — Daily Command Center</h1>
    <p style="margin:4px 0 0 0;color:#6B7280;font-size:12px;">${d.yesterdayLabel}</p>
  </div>

  <!-- Red Alerts -->
  <div style="margin-bottom:18px;">
    <h2 style="margin:0 0 8px 0;font-size:13px;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Alerts</h2>
    ${alertsHtml}
  </div>

  <!-- Yesterday -->
  <div style="margin-bottom:18px;">
    <h2 style="margin:0 0 8px 0;font-size:13px;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Yesterday</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;width:50%;text-align:center;">
          <div style="font-size:22px;font-weight:700;color:#166534;">${d.yesterday.leadsTotal}</div>
          <div style="font-size:11px;color:#6B7280;">leads received</div>
          <div style="font-size:11px;color:#6B7280;">${d.yesterday.leadsRouted} routed to partners</div>
        </td>
        <td style="width:8px;"></td>
        <td style="padding:8px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;width:50%;text-align:center;">
          <div style="font-size:22px;font-weight:700;color:#166534;">${fmtUsd(d.yesterday.paymentsBilledAmount)}</div>
          <div style="font-size:11px;color:#6B7280;">billed (${d.yesterday.paymentsBilledCount} ${d.yesterday.paymentsBilledCount === 1 ? "lead" : "leads"})</div>
        </td>
      </tr>
      <tr><td colspan="3" style="height:8px;"></td></tr>
      <tr>
        <td style="padding:8px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;text-align:center;">
          <div style="font-size:22px;font-weight:700;color:#166534;">${d.yesterday.aiChats}</div>
          <div style="font-size:11px;color:#6B7280;">AI chats</div>
          <div style="font-size:11px;color:#6B7280;">${d.yesterday.navigatorSuggested} navigator suggested</div>
        </td>
        <td style="width:8px;"></td>
        <td style="padding:8px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;text-align:center;">
          <div style="font-size:22px;font-weight:700;color:#166534;">${d.yesterday.outcomesWon}<span style="font-size:14px;color:#9CA3AF;font-weight:400;"> / ${d.yesterday.outcomesLost} / ${d.yesterday.outcomesNoContact}</span></div>
          <div style="font-size:11px;color:#6B7280;">won / lost / no-contact</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- 7-Day Trend -->
  <div style="margin-bottom:18px;">
    <h2 style="margin:0 0 8px 0;font-size:13px;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">7-Day Lead Trend</h2>
    <table style="width:100%;border-collapse:collapse;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:8px;">${trendRows}</table>
  </div>

  <!-- Stuck Leads -->
  <div style="margin-bottom:18px;">
    <h2 style="margin:0 0 8px 0;font-size:13px;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Stuck Leads</h2>
    <div style="padding:10px 12px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;">
      <div style="display:flex;justify-content:space-between;font-size:13px;">
        <span style="color:#374151;"><strong style="color:#B91C1C;font-size:18px;">${d.stuck.over24h}</strong> aged &gt; 24h</span>
        <span style="color:#374151;"><strong style="color:#991B1B;font-size:18px;">${d.stuck.over72h}</strong> aged &gt; 72h</span>
      </div>
      ${stuckSampleHtml}
    </div>
  </div>

  <!-- Payments -->
  <div style="margin-bottom:18px;">
    <h2 style="margin:0 0 8px 0;font-size:13px;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Payments (rolling 30d)</h2>
    <div style="padding:10px 12px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;font-size:13px;color:#374151;">
      <div style="display:flex;justify-content:space-between;padding:3px 0;"><span>Failed</span><strong style="color:${d.payments.failedCount > 0 ? "#B91C1C" : "#111827"};">${d.payments.failedCount}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;"><span>On hold</span><strong>${d.payments.holdCount}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;"><span>Review required</span><strong>${d.payments.reviewRequiredCount}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;border-top:1px solid #E5E7EB;margin-top:4px;padding-top:6px;"><span>Pending unbilled</span><strong>${d.payments.pendingUnbilledCount} · ${fmtUsd(d.payments.pendingUnbilledAmount)}</strong></div>
    </div>
  </div>

  <!-- Applications -->
  <div style="margin-bottom:18px;">
    <h2 style="margin:0 0 8px 0;font-size:13px;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Partner Applications</h2>
    <div style="padding:10px 12px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;font-size:13px;color:#374151;">
      <div style="display:flex;justify-content:space-between;padding:3px 0;"><span>New in last 24h</span><strong>${d.applications.last24hCount}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;"><span>Awaiting your review</span><strong style="color:${d.applications.awaitingReviewCount > 0 ? "#92400E" : "#111827"};">${d.applications.awaitingReviewCount}</strong></div>
    </div>
  </div>

  <!-- Top Categories + Cities -->
  <div style="margin-bottom:18px;">
    <h2 style="margin:0 0 8px 0;font-size:13px;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Top Categories (7d)</h2>
    <div style="padding:8px 12px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;">${topCatHtml}</div>
  </div>

  <div style="margin-bottom:18px;">
    <h2 style="margin:0 0 8px 0;font-size:13px;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Top Cities (7d)</h2>
    <div style="padding:8px 12px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;">${topCityHtml}</div>
  </div>

  <!-- Conversion Outcomes -->
  <div style="margin-bottom:18px;">
    <h2 style="margin:0 0 8px 0;font-size:13px;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Conversion Outcomes (7d)</h2>
    <div style="padding:10px 12px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;font-size:13px;color:#374151;">
      <div style="display:flex;justify-content:space-between;padding:3px 0;"><span>Routed leads</span><strong>${d.outcomes7d.routedTotal}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;"><span>Won / Lost / No Contact</span><strong>${d.outcomes7d.won} / ${d.outcomes7d.lost} / ${d.outcomes7d.noContact}</strong></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;"><span>Outcome capture rate</span><strong>${d.outcomes7d.captureRatePct}%</strong></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;border-top:1px solid #E5E7EB;margin-top:4px;padding-top:6px;"><span>Conversion rate (won / captured)</span><strong style="color:${d.outcomes7d.conversionRatePct >= 30 ? "#166534" : d.outcomes7d.conversionRatePct === 0 ? "#9CA3AF" : "#92400E"};">${d.outcomes7d.conversionRatePct}%</strong></div>
      ${d.outcomes7d.unset > 0 ? `<div style="font-size:11px;color:#9CA3AF;margin-top:4px;">${d.outcomes7d.unset} routed leads still missing outcome</div>` : ""}
    </div>
  </div>

  ${adminLink}

  <div style="border-top:1px solid #E5E7EB;margin-top:24px;padding-top:12px;color:#9CA3AF;font-size:11px;text-align:center;">
    <p style="margin:0;">${platform.name} — automated daily digest, sent ~8 AM ET.</p>
    <p style="margin:4px 0 0 0;">Disable by setting <code>FOUNDER_DIGEST_DISABLED=1</code></p>
  </div>

</body></html>`;
}

export async function sendFounderDigest(opts?: { reason?: string; slot?: DigestSlot }): Promise<{ sent: boolean; recipients: string[]; error?: string }> {
  if (isDisabled()) {
    console.log("[founder-digest] Disabled via FOUNDER_DIGEST_DISABLED=1");
    return { sent: false, recipients: [], error: "disabled" };
  }
  const recipients = getRecipients();
  if (recipients.length === 0) {
    return { sent: false, recipients: [], error: "no recipients configured" };
  }
  try {
    const data = await assembleDigestData();
    const html = buildDigestHtml(data);
    const slotLabel = opts?.slot === "afternoon" ? "Afternoon" : opts?.slot === "morning" ? "Morning" : "Update";
    const subject = `${platform.name} ${slotLabel} — ${data.yesterday.leadsTotal} leads · ${fmtUsd(data.yesterday.paymentsBilledAmount)} billed · ${data.alerts.filter(a => a.level === "red").length} red alerts`;
    const { data: sent, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject,
      html,
    });
    if (error) {
      console.log("[founder-digest] Send failed:", error.message);
      return { sent: false, recipients, error: error.message };
    }
    console.log(`[founder-digest] Sent (${opts?.reason || "scheduled"}/${opts?.slot || "n/a"}) to ${recipients.join(", ")} — id=${sent?.id}`);
    if (opts?.slot) {
      // Slot was already claimed by the timer prior to send; just upgrade to 'sent'.
      await markSlotSent(etDateString(), opts.slot, recipients, sent?.id || null);
    }
    return { sent: true, recipients };
  } catch (err: any) {
    console.log("[founder-digest] Error:", err?.message);
    return { sent: false, recipients, error: err?.message || "unknown" };
  }
}

let digestInterval: ReturnType<typeof setInterval> | null = null;
// In-memory dedup as a fast-path; DB row in `founder_digest_log` is the
// authoritative cross-restart guard.
const memorySent: Record<string, boolean> = {};

export function startFounderDigestTimer(intervalMs: number = 5 * 60 * 1000): void {
  if (digestInterval) clearInterval(digestInterval);

  // Lazy table creation; no-op if it already exists.
  ensureDigestLogTable().catch(() => {});

  const tick = async () => {
    try {
      if (isDisabled()) return;
      const todayEt = etDateString();
      const hour = etHour();
      // Determine which slot (if any) is currently due. We give each slot a
      // 1-hour window so a missed boot still sends within that window.
      let dueSlot: DigestSlot | null = null;
      if (hour >= SLOT_MORNING_HOUR && hour < SLOT_MORNING_HOUR + 1) dueSlot = "morning";
      else if (hour >= SLOT_AFTERNOON_HOUR && hour < SLOT_AFTERNOON_HOUR + 1) dueSlot = "afternoon";
      if (!dueSlot) return;

      const memKey = `${todayEt}:${dueSlot}`;
      if (memorySent[memKey]) return;

      // Atomically claim the slot in the DB. This is the authoritative dedup
      // gate. Concurrent processes / restarts during the 1h window will lose
      // the unique-constraint race and never get past this point.
      const claim = await claimSlot(todayEt, dueSlot);
      if (claim === null) {
        // DB unhealthy — fail CLOSED to prevent flooding. Skip this tick;
        // the next tick within the 1h window will retry the claim.
        console.warn(`[founder-digest] Skipping ${dueSlot} send — claim DB unavailable (failing closed).`);
        return;
      }
      if (!claim) {
        // Lost the race or already sent today by another process.
        memorySent[memKey] = true;
        return;
      }

      memorySent[memKey] = true;
      const result = await sendFounderDigest({ reason: "scheduled", slot: dueSlot });
      if (!result.sent && result.error !== "disabled") {
        // Delivery itself failed — release the claim so the next tick within
        // the slot window can retry. Memory flag also cleared.
        await releaseClaim(todayEt, dueSlot);
        memorySent[memKey] = false;
      }
    } catch (err: any) {
      console.log("[founder-digest] Timer error:", err?.message);
    }
  };

  digestInterval = setInterval(tick, intervalMs);
  // Run a tick immediately on boot in case we boot inside a slot window.
  tick().catch(() => {});

  console.log(
    `[founder-digest] Timer started — slots: morning ${SLOT_MORNING_HOUR}:00 ET, afternoon ${SLOT_AFTERNOON_HOUR}:00 ET ` +
    `(persisted dedup; kill: FOUNDER_DIGEST_DISABLED=1)`
  );
}

export function stopFounderDigestTimer(): void {
  if (digestInterval) {
    clearInterval(digestInterval);
    digestInterval = null;
  }
}
