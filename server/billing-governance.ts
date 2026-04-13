import { supabaseAdmin } from "./supabase";
import { logMonetizationAudit } from "./monetization-audit";

export interface BillingConfig {
  billing_mode: "manual_only" | "manual_plus_batch" | "controlled_batch";
  allowed_categories: string[];
  allowed_partners: string[];
  allowed_states: string[];
  routing_mode: "controlled" | "scaled";
}

let configCache: BillingConfig | null = null;
let configCacheTime = 0;
const CACHE_TTL = 30000;

export async function getBillingConfig(): Promise<BillingConfig> {
  if (configCache && Date.now() - configCacheTime < CACHE_TTL) return configCache;
  try {
    const { data } = await supabaseAdmin.from("billing_config").select("key, value");
    const map: Record<string, string> = {};
    for (const row of data || []) map[row.key] = row.value;
    configCache = {
      billing_mode: (map.billing_mode as any) || "manual_only",
      allowed_categories: map.allowed_categories_for_billing ? map.allowed_categories_for_billing.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      allowed_partners: map.allowed_partners_for_billing ? map.allowed_partners_for_billing.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      allowed_states: map.allowed_states_for_billing ? map.allowed_states_for_billing.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      routing_mode: (map.routing_mode as any) || "controlled",
    };
    configCacheTime = Date.now();
    return configCache;
  } catch {
    return { billing_mode: "manual_only", allowed_categories: [], allowed_partners: [], allowed_states: [], routing_mode: "controlled" };
  }
}

export async function updateBillingConfig(key: string, value: string): Promise<void> {
  await supabaseAdmin.from("billing_config").upsert({ key, value, updated_at: new Date().toISOString() });
  configCache = null;
}

export interface ChargeChecklist {
  pass: boolean;
  failures: string[];
}

export function runChargeChecklist(lead: any, config: BillingConfig): ChargeChecklist {
  const failures: string[] = [];

  if (!lead.is_billable) failures.push("Lead is not billable");
  if (lead.billed) failures.push("Lead is already billed");
  if (!["ready", "queued"].includes(lead.billing_workflow_status || "")) {
    if (!lead.billing_workflow_status && lead.is_billable && !lead.billed) {
      // null treated as ready — allowed
    } else {
      failures.push(`billing_workflow_status is '${lead.billing_workflow_status}' — must be ready or queued`);
    }
  }
  if (lead.billing_workflow_status === "hold") failures.push("Lead is on hold");
  if (lead.is_disputed) failures.push("Lead is disputed");
  if (lead.billing_workflow_status === "review_required") failures.push("Lead requires review before charging");
  if (!lead.assigned_to && !lead.routed_to_partner_id) failures.push("Lead has no assignment (assigned_to and routed_to_partner_id both null)");
  if (!lead.email_sent) failures.push("Email not sent for this lead");
  if (lead.stripe_payment_status && !["failed", "expired"].includes(lead.stripe_payment_status) && lead.stripe_payment_status !== "pending") {
    failures.push(`stripe_payment_status is '${lead.stripe_payment_status}' — cannot recharge`);
  }

  if (config.allowed_categories.length > 0 && !config.allowed_categories.includes(lead.category || "")) {
    failures.push(`Category '${lead.category}' not in pilot billing categories: ${config.allowed_categories.join(", ")}`);
  }
  if (config.allowed_partners.length > 0 && !config.allowed_partners.includes(lead.routed_to_partner_id || "")) {
    failures.push("Partner not in allowed billing partners list");
  }
  if (config.allowed_states.length > 0 && !config.allowed_states.includes(lead.user_state || "")) {
    failures.push(`State '${lead.user_state}' not in allowed billing states: ${config.allowed_states.join(", ")}`);
  }

  return { pass: failures.length === 0, failures };
}

export function shouldAutoReview(lead: any): { flagged: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if ((lead.reassignment_count || 0) > 0) reasons.push(`Reassigned ${lead.reassignment_count}x`);
  if (lead.response_status === "declined") reasons.push("Partner declined this lead");
  if (lead.delivery_status === "delivery_failed") reasons.push("Delivery failed");
  return { flagged: reasons.length > 0, reasons };
}

export async function verifyPartnerBillingEligibility(partnerId: string): Promise<{ eligible: boolean; reason?: string }> {
  try {
    const { data: partner } = await supabaseAdmin
      .from("partner_organizations")
      .select("id, name, is_active, subscription_status, active_paid_partner, onboarding_status, partner_status_override")
      .eq("id", partnerId)
      .single();
    if (!partner) return { eligible: false, reason: "partner_not_found" };
    const failures: string[] = [];
    if (!partner.is_active) failures.push("is_active=false");
    if (partner.active_paid_partner === false) failures.push("active_paid_partner=false");
    if (partner.subscription_status && partner.subscription_status !== "active") failures.push(`subscription_status=${partner.subscription_status}`);
    if (partner.onboarding_status && partner.onboarding_status !== "active") failures.push(`onboarding_status=${partner.onboarding_status}`);
    if (partner.partner_status_override === "paused") failures.push("partner_status_override=paused");
    if (failures.length > 0) {
      logMonetizationAudit({ event_type: "billing_blocked", partner_id: partnerId, lead_id: null, reason: failures.join("; "), metadata: { partner_name: partner.name } });
      return { eligible: false, reason: failures.join("; ") };
    }
    return { eligible: true };
  } catch (err: any) {
    logMonetizationAudit({ event_type: "billing_blocked", partner_id: partnerId, lead_id: null, reason: "eligibility_check_failed", metadata: { error: err?.message } });
    return { eligible: false, reason: "eligibility_check_failed" };
  }
}

export async function logBillingRun(executedBy: string, leadsCharged: number, totalAmount: number, mode: string, leadIds: string[]): Promise<void> {
  try {
    await supabaseAdmin.from("billing_runs").insert({
      executed_by: executedBy,
      number_of_leads_charged: leadsCharged,
      total_amount: totalAmount,
      mode,
      lead_ids: leadIds,
    });
  } catch (err: any) {
    console.log("[billing-governance] Failed to log billing run:", err?.message);
  }
}
