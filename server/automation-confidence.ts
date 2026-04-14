import { query as pgQuery } from "./pg-client";
import { logMonetizationAudit, ensureMonetizationAuditTable } from "./monetization-audit";

export type ConfidenceLevel = "high_confidence" | "medium_confidence" | "low_confidence";

export type EscalationReason =
  | "eligibility_borderline"
  | "recent_failure_pattern"
  | "stripe_status_inconsistency"
  | "mismatch_detected"
  | "safety_threshold_proximity"
  | "unknown_risk";

export interface ConfidenceAssessment {
  confidence: ConfidenceLevel;
  score: number;
  escalation_reason: EscalationReason | null;
  context: string;
  allow_auto: boolean;
}

export interface EscalationItem {
  id: string;
  action_type: string;
  partner_id: string | null;
  lead_id: string | null;
  confidence_level: ConfidenceLevel;
  escalation_reason: EscalationReason;
  suggested_action: string;
  context: string;
  escalation_action_taken: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

let _schemaReady = false;

export async function ensureConfidenceColumns(): Promise<void> {
  if (_schemaReady) return;
  try {
    await ensureMonetizationAuditTable();
    await pgQuery(`ALTER TABLE monetization_audit_log ADD COLUMN IF NOT EXISTS confidence_level TEXT`).catch(() => {});
    await pgQuery(`ALTER TABLE monetization_audit_log ADD COLUMN IF NOT EXISTS escalation_reason TEXT`).catch(() => {});
    await pgQuery(`ALTER TABLE monetization_audit_log ADD COLUMN IF NOT EXISTS escalation_action_taken TEXT`).catch(() => {});
    await pgQuery(`ALTER TABLE monetization_audit_log ADD COLUMN IF NOT EXISTS reviewed_by TEXT`).catch(() => {});
    await pgQuery(`ALTER TABLE monetization_audit_log ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ`).catch(() => {});
    _schemaReady = true;
  } catch {}
}

export async function assessBillingConfidence(
  lead: any,
  partnerId: string,
  checklistPass: boolean,
  eligibilityPass: boolean,
  eligibilityReason?: string
): Promise<ConfidenceAssessment> {
  let score = 100;
  let reason: EscalationReason | null = null;
  const factors: string[] = [];

  if (!checklistPass) {
    score -= 40;
    reason = "eligibility_borderline";
    factors.push("checklist failed");
  }

  if (!eligibilityPass) {
    score -= 50;
    reason = "eligibility_borderline";
    factors.push(`partner ineligible: ${eligibilityReason || "unknown"}`);
  }

  if (lead.is_disputed) {
    score -= 60;
    reason = "unknown_risk";
    factors.push("lead is disputed");
  }

  if (lead.stripe_payment_status && lead.stripe_payment_status !== "pending" && lead.stripe_payment_status !== "succeeded") {
    score -= 30;
    reason = reason || "stripe_status_inconsistency";
    factors.push(`stripe status: ${lead.stripe_payment_status}`);
  }

  try {
    const recentFailures = await pgQuery(
      `SELECT COUNT(*)::int AS cnt FROM monetization_audit_log
       WHERE partner_id = $1 AND exception_type IN ('failed','blocked')
       AND created_at > NOW() - INTERVAL '24 hours'`,
      [partnerId]
    );
    if ((recentFailures[0]?.cnt || 0) >= 2) {
      score -= 25;
      reason = reason || "recent_failure_pattern";
      factors.push(`${recentFailures[0].cnt} recent failures for partner`);
    }
  } catch {}

  try {
    const mismatches = await pgQuery(
      `SELECT COUNT(*)::int AS cnt FROM monetization_audit_log
       WHERE partner_id = $1 AND mismatch_type IN ('subscription_mismatch','eligibility_mismatch','onboarding_mismatch','configuration_mismatch')
       AND resolved_at IS NULL AND created_at > NOW() - INTERVAL '7 days'`,
      [partnerId]
    );
    if ((mismatches[0]?.cnt || 0) >= 1) {
      score -= 20;
      reason = reason || "mismatch_detected";
      factors.push(`${mismatches[0].cnt} unresolved mismatches`);
    }
  } catch {}

  score = Math.max(0, Math.min(100, score));

  const confidence: ConfidenceLevel =
    score >= 80 ? "high_confidence" :
    score >= 50 ? "medium_confidence" :
    "low_confidence";

  return {
    confidence,
    score,
    escalation_reason: confidence !== "high_confidence" ? (reason || "unknown_risk") : null,
    context: factors.length > 0 ? factors.join("; ") : "all checks passed",
    allow_auto: confidence !== "low_confidence",
  };
}

export async function assessFollowUpConfidence(
  partner: any
): Promise<ConfidenceAssessment> {
  let score = 100;
  let reason: EscalationReason | null = null;
  const factors: string[] = [];

  if (partner.subscription_status && partner.subscription_status !== "active") {
    score -= 20;
    reason = "stripe_status_inconsistency";
    factors.push(`subscription_status: ${partner.subscription_status}`);
  }

  if (partner.active_paid_partner === false) {
    score -= 15;
    reason = reason || "eligibility_borderline";
    factors.push("not a paid partner");
  }

  try {
    const recentFailures = await pgQuery(
      `SELECT COUNT(*)::int AS cnt FROM monetization_audit_log
       WHERE partner_id = $1 AND exception_type IN ('failed','blocked')
       AND mismatch_type = 'automation_follow_up'
       AND created_at > NOW() - INTERVAL '24 hours'`,
      [partner.id]
    );
    if ((recentFailures[0]?.cnt || 0) >= 2) {
      score -= 30;
      reason = reason || "recent_failure_pattern";
      factors.push(`${recentFailures[0].cnt} recent follow-up failures`);
    }
  } catch {}

  try {
    const mismatches = await pgQuery(
      `SELECT COUNT(*)::int AS cnt FROM monetization_audit_log
       WHERE partner_id = $1 AND mismatch_type IN ('subscription_mismatch','onboarding_mismatch')
       AND resolved_at IS NULL AND created_at > NOW() - INTERVAL '7 days'`,
      [partner.id]
    );
    if ((mismatches[0]?.cnt || 0) >= 1) {
      score -= 25;
      reason = reason || "mismatch_detected";
      factors.push(`${mismatches[0].cnt} unresolved mismatches`);
    }
  } catch {}

  try {
    const safetyRows = await pgQuery(
      `SELECT COUNT(*)::int AS cnt FROM monetization_audit_log
       WHERE failure_reason = 'safety_gate_block'
       AND created_at > NOW() - INTERVAL '6 hours'`
    );
    if ((safetyRows[0]?.cnt || 0) >= 2) {
      score -= 20;
      reason = reason || "safety_threshold_proximity";
      factors.push("recent safety gate blocks detected");
    }
  } catch {}

  score = Math.max(0, Math.min(100, score));

  const confidence: ConfidenceLevel =
    score >= 80 ? "high_confidence" :
    score >= 50 ? "medium_confidence" :
    "low_confidence";

  return {
    confidence,
    score,
    escalation_reason: confidence !== "high_confidence" ? (reason || "unknown_risk") : null,
    context: factors.length > 0 ? factors.join("; ") : "all checks passed",
    allow_auto: confidence !== "low_confidence",
  };
}

export async function escalateToReviewQueue(
  actionType: string,
  partnerId: string | null,
  leadId: string | null,
  assessment: ConfidenceAssessment,
  suggestedAction: string
): Promise<void> {
  try {
    await ensureConfidenceColumns();
    await pgQuery(
      `INSERT INTO monetization_audit_log (event_type, partner_id, lead_id, reason, metadata, mismatch_type, severity, exception_type, failure_reason, resolution_status, confidence_level, escalation_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        "admin_action_taken",
        partnerId,
        leadId,
        `Escalated: ${assessment.context}`,
        JSON.stringify({ action_type: actionType, suggested_action: suggestedAction, score: assessment.score }),
        "automation_escalation",
        assessment.confidence === "low_confidence" ? "critical" : "warning",
        "blocked",
        assessment.escalation_reason || "unknown_risk",
        "escalated",
        assessment.confidence,
        assessment.escalation_reason,
      ]
    );
  } catch (err: any) {
    console.error("[confidence] Failed to escalate:", err.message);
  }
}

export async function getEscalationQueue(): Promise<EscalationItem[]> {
  try {
    await ensureConfidenceColumns();
    const rows = await pgQuery(`
      SELECT id, event_type AS action_type, partner_id, lead_id,
             confidence_level, escalation_reason, reason AS context,
             metadata, escalation_action_taken, reviewed_by, reviewed_at, created_at
      FROM monetization_audit_log
      WHERE mismatch_type = 'automation_escalation'
        AND (resolution_status = 'escalated' OR resolution_status = 'open')
      ORDER BY
        CASE WHEN confidence_level = 'low_confidence' THEN 0
             WHEN confidence_level = 'medium_confidence' THEN 1
             ELSE 2 END,
        created_at DESC
      LIMIT 50
    `);
    return rows.map((r: any) => {
      const meta = typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata || {};
      return {
        id: r.id,
        action_type: meta.action_type || r.action_type || "unknown",
        partner_id: r.partner_id,
        lead_id: r.lead_id,
        confidence_level: r.confidence_level || "low_confidence",
        escalation_reason: r.escalation_reason || "unknown_risk",
        suggested_action: meta.suggested_action || "Review and decide",
        context: r.context,
        escalation_action_taken: r.escalation_action_taken,
        reviewed_by: r.reviewed_by,
        reviewed_at: r.reviewed_at,
        created_at: r.created_at,
      };
    });
  } catch (err: any) {
    console.error("[confidence] Failed to get queue:", err.message);
    return [];
  }
}

export async function resolveEscalation(
  id: string,
  action: "approve_and_run" | "reject" | "mark_safe_for_future" | "investigate",
  reviewedBy: string
): Promise<{ success: boolean; message: string }> {
  try {
    await ensureConfidenceColumns();
    const resolutionStatus = action === "approve_and_run" ? "approved" :
      action === "reject" ? "rejected" :
      action === "investigate" ? "investigating" : "safe_marked";

    await pgQuery(
      `UPDATE monetization_audit_log
       SET escalation_action_taken = $1, reviewed_by = $2, reviewed_at = NOW(), resolution_status = $3
       WHERE id = $4`,
      [action, reviewedBy, resolutionStatus, id]
    );

    await logMonetizationAudit({
      event_type: "admin_action_taken" as any,
      partner_id: null, lead_id: null,
      reason: `Escalation ${id} resolved: ${action} by ${reviewedBy}`,
      metadata: { action: "escalation_resolution", audit_id: id, resolution: action },
    });

    return { success: true, message: `Escalation ${action.replace(/_/g, " ")} successfully` };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function getConfidenceSummary(): Promise<{
  high: number; medium: number; low: number; escalated: number;
}> {
  try {
    await ensureConfidenceColumns();
    const rows = await pgQuery(`
      SELECT
        COUNT(*) FILTER (WHERE confidence_level = 'high_confidence')::int AS high,
        COUNT(*) FILTER (WHERE confidence_level = 'medium_confidence')::int AS medium,
        COUNT(*) FILTER (WHERE confidence_level = 'low_confidence')::int AS low,
        COUNT(*) FILTER (WHERE mismatch_type = 'automation_escalation' AND resolution_status = 'escalated')::int AS escalated
      FROM monetization_audit_log
      WHERE confidence_level IS NOT NULL AND created_at > NOW() - INTERVAL '24 hours'
    `);
    return rows[0] || { high: 0, medium: 0, low: 0, escalated: 0 };
  } catch {
    return { high: 0, medium: 0, low: 0, escalated: 0 };
  }
}
