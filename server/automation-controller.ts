import { supabaseAdmin } from "./supabase";
import { query as pgQuery } from "./pg-client";
import { logMonetizationAudit } from "./monetization-audit";
import { getSystemMode, getSafetyLimits, evaluateAutomationReadiness, checkBillingRateLimit } from "./system-safety";
import { verifyPartnerBillingEligibility, runChargeChecklist, getBillingConfig } from "./billing-governance";
import { assessBillingConfidence, assessFollowUpConfidence, escalateToReviewQueue, ensureConfidenceColumns } from "./automation-confidence";
import { isFeatureEnabled } from "./automation-feature-flags";

export type AutomationMode = "manual_only" | "assisted" | "semi_auto";

export interface AutomationAction {
  action_type: string;
  lead_id?: string | null;
  partner_id?: string | null;
  result: "success" | "failed" | "skipped" | "blocked";
  reason: string;
  timestamp: string;
}

let _automationModeCache: AutomationMode | null = null;
let _automationModeCacheTime = 0;
let _automationPaused = false;
let _pauseReason = "";
let _recentActions: AutomationAction[] = [];
const MAX_RECENT_ACTIONS = 50;

export async function getAutomationMode(): Promise<AutomationMode> {
  if (_automationModeCache && Date.now() - _automationModeCacheTime < 15000) return _automationModeCache;
  try {
    const { data } = await supabaseAdmin.from("billing_config").select("value").eq("key", "automation_mode").single();
    const mode = (data?.value || "manual_only") as AutomationMode;
    if (["manual_only", "assisted", "semi_auto"].includes(mode)) {
      _automationModeCache = mode;
      _automationModeCacheTime = Date.now();
      return mode;
    }
    return "manual_only";
  } catch {
    return "manual_only";
  }
}

export async function setAutomationMode(mode: AutomationMode, changedBy: string): Promise<void> {
  const validModes: AutomationMode[] = ["manual_only", "assisted", "semi_auto"];
  if (!validModes.includes(mode)) throw new Error(`Invalid automation_mode: ${mode}`);
  const previous = await getAutomationMode();
  await supabaseAdmin.from("billing_config").upsert({ key: "automation_mode", value: mode, updated_at: new Date().toISOString() });
  _automationModeCache = mode;
  _automationModeCacheTime = Date.now();
  if (mode === "manual_only") { _automationPaused = false; _pauseReason = ""; }
  await logMonetizationAudit({
    event_type: "admin_action_taken" as any,
    partner_id: null, lead_id: null,
    reason: `Automation mode changed: ${previous} → ${mode} (by ${changedBy})`,
    mismatch_type: "automation_mode_change",
    severity: "warning",
    metadata: { previous_mode: previous, new_mode: mode, changed_by: changedBy },
  });
}

export function pauseAutomation(reason: string): void {
  _automationPaused = true;
  _pauseReason = reason;
  logMonetizationAudit({
    event_type: "admin_action_taken" as any,
    partner_id: null, lead_id: null,
    reason: `Automation paused: ${reason}`,
    mismatch_type: "automation_pause",
    severity: "critical",
    metadata: { pause_reason: reason },
  });
}

export function resumeAutomation(): void {
  _automationPaused = false;
  _pauseReason = "";
  logMonetizationAudit({
    event_type: "admin_action_taken" as any,
    partner_id: null, lead_id: null,
    reason: "Automation resumed",
    mismatch_type: "automation_resume",
    severity: "warning",
    metadata: {},
  });
}

function recordAction(action: AutomationAction): void {
  _recentActions.unshift(action);
  if (_recentActions.length > MAX_RECENT_ACTIONS) _recentActions.length = MAX_RECENT_ACTIONS;
}

async function checkSafetyGates(): Promise<{ safe: boolean; reason?: string }> {
  const systemMode = await getSystemMode();
  if (systemMode === "safe_mode") return { safe: false, reason: "System is in safe_mode" };

  if (_automationPaused) return { safe: false, reason: `Automation paused: ${_pauseReason}` };

  const readiness = await evaluateAutomationReadiness();
  if (!readiness.safety_checks_passed) {
    const failedChecks = readiness.checks.filter(c => !c.passed).map(c => c.name).join(", ");
    return { safe: false, reason: `Safety checks failed: ${failedChecks}` };
  }

  return { safe: true };
}

export async function runAutoBatchBilling(): Promise<{
  executed: boolean;
  results: AutomationAction[];
  blocked_reason?: string;
}> {
  const results: AutomationAction[] = [];

  const billingEnabled = await isFeatureEnabled("auto_billing_enabled");
  if (!billingEnabled) {
    return { executed: false, results: [], blocked_reason: "Feature flag auto_billing_enabled is OFF" };
  }

  const mode = await getAutomationMode();
  if (mode !== "semi_auto") {
    return { executed: false, results: [], blocked_reason: `Automation mode is ${mode}, not semi_auto` };
  }

  const safety = await checkSafetyGates();
  if (!safety.safe) {
    const action: AutomationAction = {
      action_type: "auto_batch_billing", result: "blocked",
      reason: safety.reason || "Safety gate blocked", timestamp: new Date().toISOString(),
    };
    recordAction(action);
    await logMonetizationAudit({
      event_type: "admin_action_taken" as any, partner_id: null, lead_id: null,
      reason: `Auto billing blocked: ${safety.reason}`,
      mismatch_type: "automation_blocked", severity: "warning",
      exception_type: "blocked", failure_reason: "safety_gate_block",
      metadata: { action_type: "auto_batch_billing", block_reason: safety.reason },
    });
    return { executed: false, results: [action], blocked_reason: safety.reason };
  }

  const limits = await getSafetyLimits();
  const rateCheck = checkBillingRateLimit(limits);
  if (!rateCheck.allowed) {
    const action: AutomationAction = {
      action_type: "auto_batch_billing", result: "blocked",
      reason: "Billing rate limit exceeded", timestamp: new Date().toISOString(),
    };
    recordAction(action);
    await logMonetizationAudit({
      event_type: "admin_action_taken" as any, partner_id: null, lead_id: null,
      reason: "Auto billing blocked: rate limit exceeded",
      mismatch_type: "automation_blocked", severity: "warning",
      exception_type: "blocked", failure_reason: "rate_limit_block",
      metadata: { action_type: "auto_batch_billing" },
    });
    return { executed: false, results: [action], blocked_reason: "Rate limit exceeded" };
  }

  const config = await getBillingConfig();

  try {
    const { data: leads } = await supabaseAdmin
      .from("navigator_requests")
      .select("id, routed_to_partner_id, is_billable, billed, billing_workflow_status, is_disputed, email_sent, stripe_payment_status, category, user_state, assigned_to")
      .eq("is_billable", true)
      .eq("billed", false)
      .eq("email_sent", true)
      .not("routed_to_partner_id", "is", null)
      .not("is_disputed", "eq", true)
      .or("billing_workflow_status.is.null,billing_workflow_status.in.(ready,queued)")
      .order("created_at", { ascending: true })
      .limit(Math.min(limits.max_batch_size, 5));

    for (const lead of leads || []) {
      const checklist = runChargeChecklist(lead, config);
      const eligibility = await verifyPartnerBillingEligibility(lead.routed_to_partner_id);

      const confidenceEnabled = await isFeatureEnabled("confidence_scoring_enabled");
      const escalationEnabled = await isFeatureEnabled("escalation_enabled");

      if (confidenceEnabled) {
        const confidence = await assessBillingConfidence(
          lead, lead.routed_to_partner_id, checklist.pass, eligibility.eligible, eligibility.reason
        );

        if (!confidence.allow_auto) {
          const action: AutomationAction = {
            action_type: "auto_charge", lead_id: lead.id, partner_id: lead.routed_to_partner_id,
            result: "blocked", reason: `Low confidence (${confidence.score}%): ${confidence.context}`,
            timestamp: new Date().toISOString(),
          };
          recordAction(action);
          results.push(action);
          if (escalationEnabled) {
            await escalateToReviewQueue("billing", lead.routed_to_partner_id, lead.id, confidence, "Review billing eligibility and approve manually");
          }
          continue;
        }
      }

      if (!checklist.pass) {
        const action: AutomationAction = {
          action_type: "auto_charge", lead_id: lead.id, partner_id: lead.routed_to_partner_id,
          result: "skipped", reason: `Checklist failed: ${checklist.failures.join("; ")}`,
          timestamp: new Date().toISOString(),
        };
        recordAction(action);
        results.push(action);
        await logMonetizationAudit({
          event_type: "admin_action_taken" as any,
          partner_id: lead.routed_to_partner_id, lead_id: lead.id,
          reason: `Auto billing skipped: checklist failed`,
          mismatch_type: "automation_billing", severity: "warning",
          exception_type: "skipped", failure_reason: "validation_failure",
          metadata: { action_type: "auto_charge", failures: checklist.failures, confidence_level: confidence.confidence, confidence_score: confidence.score },
        });
        continue;
      }

      if (!eligibility.eligible) {
        const action: AutomationAction = {
          action_type: "auto_charge", lead_id: lead.id, partner_id: lead.routed_to_partner_id,
          result: "skipped", reason: `Partner ineligible: ${eligibility.reason}`,
          timestamp: new Date().toISOString(),
        };
        recordAction(action);
        results.push(action);
        await logMonetizationAudit({
          event_type: "admin_action_taken" as any,
          partner_id: lead.routed_to_partner_id, lead_id: lead.id,
          reason: `Auto billing skipped: partner ineligible — ${eligibility.reason}`,
          mismatch_type: "automation_billing", severity: "warning",
          exception_type: "skipped", failure_reason: "eligibility_failure",
          metadata: { action_type: "auto_charge", eligibility_reason: eligibility.reason, confidence_level: confidence.confidence, confidence_score: confidence.score },
        });
        continue;
      }

      const action: AutomationAction = {
        action_type: "auto_charge", lead_id: lead.id, partner_id: lead.routed_to_partner_id,
        result: "success", reason: `Lead queued for billing (confidence: ${confidence.confidence})`,
        timestamp: new Date().toISOString(),
      };

      try {
        await supabaseAdmin.from("navigator_requests").update({ billing_workflow_status: "queued" }).eq("id", lead.id);
      } catch (err: any) {
        action.result = "failed";
        action.reason = `Queue failed: ${err?.message}`;
      }

      recordAction(action);
      results.push(action);
      const failureReason = action.result === "skipped" ? "validation_failure" : action.result === "failed" ? "billing_failure" : undefined;
      await logMonetizationAudit({
        event_type: "admin_action_taken" as any,
        partner_id: lead.routed_to_partner_id, lead_id: lead.id,
        reason: `Auto billing: ${action.result} — ${action.reason}`,
        mismatch_type: "automation_billing", severity: action.result === "failed" ? "critical" : "warning",
        exception_type: action.result, failure_reason: failureReason,
        metadata: { automation_mode: "semi_auto", action_type: "auto_charge", result: action.result, confidence_level: confidence.confidence, confidence_score: confidence.score },
      });
    }

    if (!leads || leads.length === 0) {
      results.push({
        action_type: "auto_batch_billing", result: "skipped",
        reason: "No eligible leads found for auto billing",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    const action: AutomationAction = {
      action_type: "auto_batch_billing", result: "failed",
      reason: `Query error: ${err?.message}`, timestamp: new Date().toISOString(),
    };
    recordAction(action);
    results.push(action);
    await logMonetizationAudit({
      event_type: "admin_action_taken" as any,
      partner_id: null, lead_id: null,
      reason: `Auto billing failed: ${err?.message}`,
      mismatch_type: "automation_billing", severity: "critical",
      exception_type: "failed", failure_reason: "unknown_error",
      metadata: { action_type: "auto_batch_billing", error: err?.message },
    });
  }

  return { executed: true, results };
}

export async function runAutoFollowUps(): Promise<{
  executed: boolean;
  results: AutomationAction[];
  blocked_reason?: string;
}> {
  const results: AutomationAction[] = [];

  const followUpEnabled = await isFeatureEnabled("auto_follow_up_enabled");
  if (!followUpEnabled) {
    return { executed: false, results: [], blocked_reason: "Feature flag auto_follow_up_enabled is OFF" };
  }

  const mode = await getAutomationMode();
  if (mode !== "semi_auto") {
    return { executed: false, results: [], blocked_reason: `Automation mode is ${mode}, not semi_auto` };
  }

  const safety = await checkSafetyGates();
  if (!safety.safe) {
    const action: AutomationAction = {
      action_type: "auto_follow_up", result: "blocked",
      reason: safety.reason || "Safety gate blocked", timestamp: new Date().toISOString(),
    };
    recordAction(action);
    await logMonetizationAudit({
      event_type: "admin_action_taken" as any, partner_id: null, lead_id: null,
      reason: `Auto follow-up blocked: ${safety.reason}`,
      mismatch_type: "automation_blocked", severity: "warning",
      exception_type: "blocked", failure_reason: "safety_gate_block",
      metadata: { action_type: "auto_follow_up", block_reason: safety.reason },
    });
    return { executed: false, results: [action], blocked_reason: safety.reason };
  }

  try {
    const { data: partners } = await supabaseAdmin
      .from("partner_organizations")
      .select("id, name, contact_email, contact_name, onboarding_status, subscription_status, active_paid_partner, follow_up_status, last_contact_at, created_at")
      .in("onboarding_status", ["invited", "subscribed"])
      .order("created_at", { ascending: true })
      .limit(10);

    for (const p of partners || []) {
      const hoursSinceCreation = (Date.now() - new Date(p.created_at).getTime()) / 3600000;
      const followUpCount = (p.follow_up_status || "").startsWith("sent_") ? parseInt((p.follow_up_status || "").replace("sent_", "")) || 0 : p.follow_up_status === "recovered" ? 99 : 0;

      if (followUpCount >= 2) {
        results.push({
          action_type: "auto_follow_up", partner_id: p.id,
          result: "skipped", reason: "Max 2 follow-ups reached",
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      if (p.follow_up_status === "recovered" || p.onboarding_status === "active") {
        results.push({
          action_type: "auto_follow_up", partner_id: p.id,
          result: "skipped", reason: "Partner already recovered/active",
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      let template: string | null = null;
      if (p.onboarding_status === "invited" && hoursSinceCreation > 48) template = "urgency";
      else if (p.onboarding_status === "invited" && hoursSinceCreation > 24) template = "reminder";
      else if (p.onboarding_status === "subscribed" && p.subscription_status !== "active" && hoursSinceCreation > 24) template = "payment_recovery";

      if (!template) {
        results.push({
          action_type: "auto_follow_up", partner_id: p.id,
          result: "skipped", reason: "No follow-up criteria met yet",
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      const confEnabled = await isFeatureEnabled("confidence_scoring_enabled");
      const escEnabled = await isFeatureEnabled("escalation_enabled");

      if (confEnabled) {
        const confidence = await assessFollowUpConfidence(p);
        if (!confidence.allow_auto) {
          const action: AutomationAction = {
            action_type: "auto_follow_up", partner_id: p.id,
            result: "blocked", reason: `Low confidence (${confidence.score}%): ${confidence.context}`,
            timestamp: new Date().toISOString(),
          };
          recordAction(action);
          results.push(action);
          if (escEnabled) {
            await escalateToReviewQueue("follow_up", p.id, null, confidence, `Review follow-up (${template}) for ${p.name}`);
          }
          continue;
        }
      }

      const action: AutomationAction = {
        action_type: "auto_follow_up", partner_id: p.id,
        result: "success",
        reason: `Follow-up scheduled: ${template} for ${p.name} (confidence: ${confidence.confidence})`,
        timestamp: new Date().toISOString(),
      };

      try {
        const nextFollowUp = followUpCount === 0 ? "sent_1" : "sent_2";
        await supabaseAdmin.from("partner_organizations").update({
          follow_up_status: nextFollowUp,
          last_contact_at: new Date().toISOString(),
          last_contact_type: template,
        }).eq("id", p.id);
      } catch (err: any) {
        action.result = "failed";
        action.reason = `Update failed: ${err?.message}`;
      }

      recordAction(action);
      results.push(action);
      await logMonetizationAudit({
        event_type: "admin_action_taken" as any,
        partner_id: p.id, lead_id: null,
        reason: `Auto follow-up: ${template} — ${action.result}`,
        mismatch_type: "automation_follow_up", severity: action.result === "failed" ? "critical" : "warning",
        exception_type: action.result,
        failure_reason: action.result === "failed" ? "unknown_error" : undefined,
        metadata: { automation_mode: "semi_auto", template, partner_name: p.name, result: action.result, confidence_level: confidence.confidence, confidence_score: confidence.score },
      });
    }

    if (!partners || partners.length === 0) {
      results.push({
        action_type: "auto_follow_up", result: "skipped",
        reason: "No partners need follow-up at this time",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    const action: AutomationAction = {
      action_type: "auto_follow_up", result: "failed",
      reason: `Error: ${err?.message}`, timestamp: new Date().toISOString(),
    };
    recordAction(action);
    results.push(action);
    await logMonetizationAudit({
      event_type: "admin_action_taken" as any,
      partner_id: null, lead_id: null,
      reason: `Auto follow-up failed: ${err?.message}`,
      mismatch_type: "automation_follow_up", severity: "critical",
      exception_type: "failed", failure_reason: "unknown_error",
      metadata: { action_type: "auto_follow_up", error: err?.message },
    });
  }

  return { executed: true, results };
}

export async function suggestBillingActions(): Promise<{
  suggestions: Array<{ lead_id: string; partner_name: string; category: string; reason: string }>;
}> {
  const suggestions: Array<{ lead_id: string; partner_name: string; category: string; reason: string }> = [];
  try {
    const { data: leads } = await supabaseAdmin
      .from("navigator_requests")
      .select("id, routed_to_partner_id, category, is_billable, billed, billing_workflow_status, email_sent")
      .eq("is_billable", true)
      .eq("billed", false)
      .eq("email_sent", true)
      .not("routed_to_partner_id", "is", null)
      .not("is_disputed", "eq", true)
      .or("billing_workflow_status.is.null,billing_workflow_status.in.(ready,queued)")
      .order("created_at", { ascending: true })
      .limit(10);
    for (const lead of leads || []) {
      const { data: partner } = await supabaseAdmin.from("partner_organizations").select("name").eq("id", lead.routed_to_partner_id).single();
      suggestions.push({
        lead_id: lead.id,
        partner_name: partner?.name || "Unknown",
        category: lead.category || "unknown",
        reason: "Eligible for billing — ready to charge",
      });
    }
  } catch {}
  return { suggestions };
}

export async function suggestFollowUpActions(): Promise<{
  suggestions: Array<{ partner_id: string; partner_name: string; template: string; reason: string }>;
}> {
  const suggestions: Array<{ partner_id: string; partner_name: string; template: string; reason: string }> = [];
  try {
    const { data: partners } = await supabaseAdmin
      .from("partner_organizations")
      .select("id, name, onboarding_status, subscription_status, follow_up_status, created_at")
      .in("onboarding_status", ["invited", "subscribed"])
      .limit(10);

    for (const p of partners || []) {
      const hoursSinceCreation = (Date.now() - new Date(p.created_at).getTime()) / 3600000;
      const followUpCount = (p.follow_up_status || "").startsWith("sent_") ? parseInt((p.follow_up_status || "").replace("sent_", "")) || 0 : 0;
      if (followUpCount >= 2 || p.follow_up_status === "recovered") continue;

      let template = "";
      let reason = "";
      if (p.onboarding_status === "invited" && hoursSinceCreation > 48) {
        template = "urgency"; reason = `Invited ${Math.round(hoursSinceCreation)}h ago — needs urgency follow-up`;
      } else if (p.onboarding_status === "invited" && hoursSinceCreation > 24) {
        template = "reminder"; reason = `Invited ${Math.round(hoursSinceCreation)}h ago — needs reminder`;
      } else if (p.onboarding_status === "subscribed" && p.subscription_status !== "active" && hoursSinceCreation > 24) {
        template = "payment_recovery"; reason = "Subscribed but payment not active — needs recovery";
      }

      if (template) {
        suggestions.push({ partner_id: p.id, partner_name: p.name, template, reason });
      }
    }
  } catch {}
  return { suggestions };
}

export async function getAutomationStatus(): Promise<{
  automation_mode: AutomationMode;
  is_paused: boolean;
  pause_reason: string;
  status: "active" | "paused" | "restricted" | "disabled";
  recent_actions: AutomationAction[];
  warnings: string[];
}> {
  const mode = await getAutomationMode();
  const systemMode = await getSystemMode();

  let status: "active" | "paused" | "restricted" | "disabled" = "disabled";
  if (mode === "manual_only") status = "disabled";
  else if (_automationPaused) status = "paused";
  else if (systemMode === "safe_mode" || systemMode === "restricted") status = "restricted";
  else status = "active";

  const warnings: string[] = [];
  if (systemMode === "safe_mode") warnings.push("System is in safe mode — automation restricted");
  if (systemMode === "restricted") warnings.push("System is in restricted mode — automation limited");
  if (_automationPaused) warnings.push(`Automation paused: ${_pauseReason}`);

  const readiness = await evaluateAutomationReadiness();
  if (!readiness.safety_checks_passed) {
    warnings.push("Safety checks not passed — semi_auto execution blocked");
    if (status === "active" && mode === "semi_auto") status = "restricted";
  }

  return {
    automation_mode: mode,
    is_paused: _automationPaused,
    pause_reason: _pauseReason,
    status,
    recent_actions: _recentActions.slice(0, 20),
    warnings,
  };
}
