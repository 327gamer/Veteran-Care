import { supabaseAdmin } from "./supabase";
import { query as pgQuery } from "./pg-client";
import { logMonetizationAudit } from "./monetization-audit";

export type SystemMode = "normal" | "restricted" | "safe_mode";

export interface SafetyLimits {
  max_leads_per_partner_per_day: number;
  max_batch_size: number;
  max_daily_billing_attempts: number;
  max_failed_payments_threshold: number;
  routing_rate_per_minute: number;
  billing_rate_per_minute: number;
}

const DEFAULT_LIMITS: SafetyLimits = {
  max_leads_per_partner_per_day: 50,
  max_batch_size: 5,
  max_daily_billing_attempts: 100,
  max_failed_payments_threshold: 10,
  routing_rate_per_minute: 30,
  billing_rate_per_minute: 10,
};

let _limitsCache: SafetyLimits | null = null;
let _limitsCacheTime = 0;
let _modeCache: SystemMode | null = null;
let _modeCacheTime = 0;
const CACHE_TTL = 15000;

const _routingTimestamps: number[] = [];
const _billingTimestamps: number[] = [];

export async function getSafetyLimits(): Promise<SafetyLimits> {
  if (_limitsCache && Date.now() - _limitsCacheTime < CACHE_TTL) return _limitsCache;
  try {
    const { data } = await supabaseAdmin.from("billing_config").select("key, value");
    const map: Record<string, string> = {};
    for (const row of data || []) map[row.key] = row.value;
    _limitsCache = {
      max_leads_per_partner_per_day: parseInt(map.max_leads_per_partner_per_day || "") || DEFAULT_LIMITS.max_leads_per_partner_per_day,
      max_batch_size: parseInt(map.max_batch_size || "") || DEFAULT_LIMITS.max_batch_size,
      max_daily_billing_attempts: parseInt(map.max_daily_billing_attempts || "") || DEFAULT_LIMITS.max_daily_billing_attempts,
      max_failed_payments_threshold: parseInt(map.max_failed_payments_threshold || "") || DEFAULT_LIMITS.max_failed_payments_threshold,
      routing_rate_per_minute: parseInt(map.routing_rate_per_minute || "") || DEFAULT_LIMITS.routing_rate_per_minute,
      billing_rate_per_minute: parseInt(map.billing_rate_per_minute || "") || DEFAULT_LIMITS.billing_rate_per_minute,
    };
    _limitsCacheTime = Date.now();
    return _limitsCache;
  } catch {
    return DEFAULT_LIMITS;
  }
}

export async function updateSafetyLimit(key: string, value: number): Promise<void> {
  const validKeys = Object.keys(DEFAULT_LIMITS);
  if (!validKeys.includes(key)) throw new Error(`Invalid safety limit key: ${key}`);
  await supabaseAdmin.from("billing_config").upsert({ key, value: String(value), updated_at: new Date().toISOString() });
  _limitsCache = null;
}

export async function getSystemMode(): Promise<SystemMode> {
  if (_modeCache && Date.now() - _modeCacheTime < CACHE_TTL) return _modeCache;
  try {
    const { data } = await supabaseAdmin.from("billing_config").select("value").eq("key", "system_mode").single();
    const mode = (data?.value || "normal") as SystemMode;
    if (["normal", "restricted", "safe_mode"].includes(mode)) {
      _modeCache = mode;
      _modeCacheTime = Date.now();
      return mode;
    }
    return "normal";
  } catch {
    return "normal";
  }
}

export async function setSystemMode(mode: SystemMode, triggeredBy: string, reason: string): Promise<void> {
  const validModes: SystemMode[] = ["normal", "restricted", "safe_mode"];
  if (!validModes.includes(mode)) throw new Error(`Invalid system_mode: ${mode}`);
  const previousMode = await getSystemMode();
  await supabaseAdmin.from("billing_config").upsert({ key: "system_mode", value: mode, updated_at: new Date().toISOString() });
  _modeCache = mode;
  _modeCacheTime = Date.now();
  await logMonetizationAudit({
    event_type: "admin_action_taken" as any,
    partner_id: null, lead_id: null,
    reason: `System mode changed: ${previousMode} → ${mode} (by ${triggeredBy}: ${reason})`,
    mismatch_type: "system_mode_change",
    severity: mode === "safe_mode" ? "critical" : "warning",
    metadata: { previous_mode: previousMode, new_mode: mode, triggered_by: triggeredBy, trigger_reason: reason },
  });
}

export function checkRoutingRateLimit(limits: SafetyLimits): { allowed: boolean; current: number } {
  const now = Date.now();
  const windowStart = now - 60000;
  while (_routingTimestamps.length > 0 && _routingTimestamps[0] < windowStart) _routingTimestamps.shift();
  const current = _routingTimestamps.length;
  if (current >= limits.routing_rate_per_minute) {
    return { allowed: false, current };
  }
  _routingTimestamps.push(now);
  return { allowed: true, current: current + 1 };
}

export function checkBillingRateLimit(limits: SafetyLimits): { allowed: boolean; current: number } {
  const now = Date.now();
  const windowStart = now - 60000;
  while (_billingTimestamps.length > 0 && _billingTimestamps[0] < windowStart) _billingTimestamps.shift();
  const current = _billingTimestamps.length;
  if (current >= limits.billing_rate_per_minute) {
    return { allowed: false, current };
  }
  _billingTimestamps.push(now);
  return { allowed: true, current: current + 1 };
}

export async function checkPartnerDailyLeadLimit(partnerId: string, limits: SafetyLimits): Promise<{ allowed: boolean; current: number; limit: number }> {
  try {
    const rows = await pgQuery(
      `SELECT COUNT(*)::int AS cnt FROM navigator_requests WHERE routed_to_partner_id = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
      [partnerId]
    );
    const current = rows[0]?.cnt || 0;
    return { allowed: current < limits.max_leads_per_partner_per_day, current, limit: limits.max_leads_per_partner_per_day };
  } catch {
    return { allowed: true, current: 0, limit: limits.max_leads_per_partner_per_day };
  }
}

export async function checkDailyBillingAttempts(limits: SafetyLimits): Promise<{ allowed: boolean; current: number; limit: number }> {
  try {
    const rows = await pgQuery(
      `SELECT COUNT(*)::int AS cnt FROM monetization_audit_log WHERE event_type IN ('billing_blocked','admin_action_taken') AND created_at > NOW() - INTERVAL '24 hours'`
    );
    const current = rows[0]?.cnt || 0;
    return { allowed: current < limits.max_daily_billing_attempts, current, limit: limits.max_daily_billing_attempts };
  } catch {
    return { allowed: true, current: 0, limit: limits.max_daily_billing_attempts };
  }
}

export interface AlertCondition {
  alert_type: string;
  severity: "warning" | "critical";
  message: string;
  value?: number;
  threshold?: number;
}

export async function evaluateAlertConditions(): Promise<AlertCondition[]> {
  const alerts: AlertCondition[] = [];
  try {
    const rows24h = await pgQuery(`
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'billing_blocked')::int AS billing_blocked_24h,
        COUNT(*) FILTER (WHERE event_type = 'routing_blocked')::int AS routing_blocked_24h,
        COUNT(*) FILTER (WHERE event_type = 'eligibility_failure')::int AS eligibility_fail_24h,
        COUNT(*) FILTER (WHERE event_type = 'subscription_mismatch')::int AS sub_mismatch_24h,
        COUNT(*)::int AS total_24h
      FROM monetization_audit_log WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    const s = rows24h[0] || {};
    const limits = await getSafetyLimits();

    if ((s.billing_blocked_24h || 0) >= limits.max_failed_payments_threshold) {
      alerts.push({ alert_type: "BILLING FAILURE SPIKE", severity: "critical", message: `${s.billing_blocked_24h} billing blocks in 24h (threshold: ${limits.max_failed_payments_threshold})`, value: s.billing_blocked_24h, threshold: limits.max_failed_payments_threshold });
    }
    if ((s.routing_blocked_24h || 0) >= 10) {
      alerts.push({ alert_type: "ROUTING BLOCK SPIKE", severity: "critical", message: `${s.routing_blocked_24h} routing blocks in 24h`, value: s.routing_blocked_24h, threshold: 10 });
    }
    if ((s.sub_mismatch_24h || 0) >= 5) {
      alerts.push({ alert_type: "HIGH FAILURE RATE", severity: "warning", message: `${s.sub_mismatch_24h} subscription mismatches detected in 24h`, value: s.sub_mismatch_24h, threshold: 5 });
    }
    if ((s.total_24h || 0) >= 50) {
      alerts.push({ alert_type: "HIGH FAILURE RATE", severity: "critical", message: `${s.total_24h} total safety events in 24h — system instability possible`, value: s.total_24h, threshold: 50 });
    }
  } catch {}

  try {
    const stripeErrors = await pgQuery(
      `SELECT COUNT(*)::int AS cnt FROM monetization_audit_log WHERE reason ILIKE '%stripe%error%' AND created_at > NOW() - INTERVAL '24 hours'`
    );
    if ((stripeErrors[0]?.cnt || 0) >= 3) {
      alerts.push({ alert_type: "STRIPE ERROR DETECTED", severity: "critical", message: `${stripeErrors[0].cnt} Stripe-related errors in 24h`, value: stripeErrors[0].cnt, threshold: 3 });
    }
  } catch {}

  return alerts;
}

export async function evaluateAutomationReadiness(): Promise<{
  automation_ready: boolean;
  safety_checks_passed: boolean;
  checks: { name: string; passed: boolean; detail: string }[];
}> {
  const checks: { name: string; passed: boolean; detail: string }[] = [];

  const mode = await getSystemMode();
  checks.push({ name: "System mode is normal", passed: mode === "normal", detail: `Current: ${mode}` });

  const alerts = await evaluateAlertConditions();
  const criticalAlerts = alerts.filter(a => a.severity === "critical");
  checks.push({ name: "No critical alerts", passed: criticalAlerts.length === 0, detail: `${criticalAlerts.length} critical alerts active` });

  try {
    const { getAuditSummary } = await import("./monetization-audit");
    const summary = await getAuditSummary();
    checks.push({ name: "Low mismatch count", passed: (summary.unresolved || 0) < 10, detail: `${summary.unresolved || 0} unresolved mismatches` });
    const failRate = summary.total_blocks > 0 ? ((summary.billing_blocked + summary.routing_blocked) / Math.max(summary.total_blocks, 1)) : 0;
    checks.push({ name: "Low failure rate", passed: failRate < 0.5, detail: `Block ratio: ${(failRate * 100).toFixed(1)}%` });
  } catch {
    checks.push({ name: "Low mismatch count", passed: true, detail: "Unable to check" });
    checks.push({ name: "Low failure rate", passed: true, detail: "Unable to check" });
  }

  try {
    const billing24h = await pgQuery(
      `SELECT COUNT(*)::int AS cnt FROM monetization_audit_log WHERE event_type = 'billing_blocked' AND created_at > NOW() - INTERVAL '24 hours'`
    );
    const billingFails = billing24h[0]?.cnt || 0;
    checks.push({ name: "Stable billing success", passed: billingFails < 5, detail: `${billingFails} billing blocks in 24h` });
  } catch {
    checks.push({ name: "Stable billing success", passed: true, detail: "Unable to check" });
  }

  const allPassed = checks.every(c => c.passed);
  return { automation_ready: allPassed, safety_checks_passed: allPassed, checks };
}

export async function getSystemSafetyStatus(): Promise<{
  system_mode: SystemMode;
  limits: SafetyLimits;
  alerts: AlertCondition[];
  readiness: { automation_ready: boolean; safety_checks_passed: boolean; checks: any[] };
  rate_limits: {
    routing: { current: number; limit: number };
    billing: { current: number; limit: number };
  };
}> {
  const [mode, limits, alerts, readiness] = await Promise.all([
    getSystemMode(),
    getSafetyLimits(),
    evaluateAlertConditions(),
    evaluateAutomationReadiness(),
  ]);

  const now = Date.now();
  const windowStart = now - 60000;
  const routingCurrent = _routingTimestamps.filter(t => t >= windowStart).length;
  const billingCurrent = _billingTimestamps.filter(t => t >= windowStart).length;

  return {
    system_mode: mode,
    limits,
    alerts,
    readiness,
    rate_limits: {
      routing: { current: routingCurrent, limit: limits.routing_rate_per_minute },
      billing: { current: billingCurrent, limit: limits.billing_rate_per_minute },
    },
  };
}
