import { supabase, supabaseAdmin } from "./supabase";
import { findBestPartner } from "./lead-router";
import { sendLeadNotification } from "./lead-email";

const ESCALATION_WINDOWS: Record<string, number> = {
  immediate: 15 * 60 * 1000,
  same_week: 72 * 60 * 60 * 1000,
  standard: 72 * 60 * 60 * 1000,
  information: 7 * 24 * 60 * 60 * 1000,
};

const DEFAULT_WINDOW = 72 * 60 * 60 * 1000;
const MAX_REASSIGNMENTS = 3;

function getEscalationWindow(urgency: string | null): number {
  return ESCALATION_WINDOWS[urgency || ""] || DEFAULT_WINDOW;
}

export async function checkEscalations(): Promise<{
  escalated: number;
  rerouted: number;
  fallback: number;
  reassigned: number;
  deliveryFailures: number;
}> {
  let escalated = 0;
  let rerouted = 0;
  let fallback = 0;
  let reassigned = 0;
  let deliveryFailures = 0;

  try {
    // Post-migration (Chunk 4.3): reassignment columns are guaranteed live.
    // Column-missing fallback retry removed.
    const { data: routedLeads, error } = await supabaseAdmin
      .from("navigator_requests")
      .select("id, urgency, routed_to_partner_id, routed_at, assigned_at, delivery_status, escalation_count, routing_history, category, subcategory, user_state, user_city, response_status, email_sent, email_sent_at, reassignment_count")
      .in("status", ["new", "in_progress"])
      .not("routed_to_partner_id", "is", null)
      .in("delivery_status", ["pending", "delivered", "ready_for_delivery"]);

    if (error) {
      console.log("[escalation] Error fetching routed leads:", error.message);
    }

    const now = Date.now();

    for (const lead of (routedLeads || [])) {
      const responseStatus = lead.response_status || "pending";

      if (responseStatus !== "pending") continue;

      const referenceTime = lead.assigned_at
        ? new Date(lead.assigned_at).getTime()
        : new Date(lead.routed_at).getTime();
      const window = getEscalationWindow(lead.urgency);

      if (now - referenceTime <= window) continue;

      escalated++;

      const currentReassignments = lead.reassignment_count || 0;
      if (currentReassignments >= MAX_REASSIGNMENTS) {
        await supabaseAdmin
          .from("navigator_requests")
          .update({
            delivery_status: "fallback_manual",
            response_status: "escalation_required",
            escalation_count: (lead.escalation_count || 0) + 1,
          })
          .eq("id", lead.id);

        fallback++;
        console.log(`[escalation] Lead ${lead.id} hit max reassignments (${MAX_REASSIGNMENTS}), flagged for manual review`);
        continue;
      }

      const history = Array.isArray(lead.routing_history) ? lead.routing_history : [];
      const previousPartnerIds = history.map((h: any) => h.partner_id).filter(Boolean);
      if (lead.routed_to_partner_id) previousPartnerIds.push(lead.routed_to_partner_id);

      history.push({
        partner_id: lead.routed_to_partner_id,
        routed_at: lead.routed_at,
        delivery_status: "reassigned",
        reassigned_at: new Date().toISOString(),
        reason: "72h_no_response",
      });

      const uniqueExcluded = [...new Set(previousPartnerIds)];

      const newMatch = await findBestPartner(
        {
          id: lead.id,
          category: lead.category,
          subcategory: lead.subcategory,
          urgency: lead.urgency,
          user_state: lead.user_state,
          user_city: lead.user_city,
        },
        uniqueExcluded
      );

      if (newMatch) {
        const reassignNow = new Date().toISOString();

        history.push({
          partner_id: newMatch.partnerId,
          partner_name: newMatch.partnerName,
          rule_id: newMatch.ruleId,
          routed_at: reassignNow,
          delivery_status: "pending",
        });

        const reassignUpdate: any = {
            routed_to_partner_id: newMatch.partnerId,
            routed_at: reassignNow,
            assigned_at: reassignNow,
            delivery_status: "pending",
            response_status: "pending",
            response_at: null,
            email_sent: false,
            email_sent_at: null,
            escalation_count: (lead.escalation_count || 0) + 1,
            reassignment_count: currentReassignments + 1,
            last_reassigned_at: reassignNow,
            previous_assigned_to: lead.routed_to_partner_id,
            routing_history: history,
        };

        // Post-migration (Chunk 4.3): reassignment tracking columns are live;
        // no fallback needed.
        const { error: reassignErr } = await supabaseAdmin
          .from("navigator_requests")
          .update(reassignUpdate)
          .eq("id", lead.id);

        if (reassignErr) {
          console.log(`[escalation] Reassignment update failed for ${lead.id}: ${reassignErr.message}`);
        }

        sendLeadNotification(lead.id, newMatch.partnerId)
          .then(async () => {
            const emailNow = new Date().toISOString();
            await supabaseAdmin
              .from("navigator_requests")
              .update({
                delivery_status: "delivered",
                email_sent: true,
                email_sent_at: emailNow,
              })
              .eq("id", lead.id);
            try {
              await supabaseAdmin.from("navigator_requests").update({ is_billable: true, billing_status: "billable" }).eq("id", lead.id);
            } catch {}
            console.log(`[escalation] Reassignment email sent for lead ${lead.id} to ${newMatch.partnerName}`);
          })
          .catch(async (err: any) => {
            await supabaseAdmin
              .from("navigator_requests")
              .update({ delivery_status: "delivery_failed" })
              .eq("id", lead.id);
            console.log(`[escalation] Reassignment email FAILED for lead ${lead.id}: ${err?.message}`);
          });

        reassigned++;
        rerouted++;
        console.log(`[escalation] Lead ${lead.id} reassigned to ${newMatch.partnerName} (attempt ${currentReassignments + 1}/${MAX_REASSIGNMENTS})`);
      } else {
        await supabaseAdmin
          .from("navigator_requests")
          .update({
            delivery_status: "fallback_manual",
            escalation_count: (lead.escalation_count || 0) + 1,
            routing_history: history,
          })
          .eq("id", lead.id);

        fallback++;
        console.log(`[escalation] Lead ${lead.id} sent to manual fallback queue (no new partners)`);
      }
    }

    const { data: unroutedLeads } = await supabaseAdmin
      .from("navigator_requests")
      .select("id, urgency, created_at, delivery_status")
      .eq("status", "new")
      .is("routed_to_partner_id", null)
      .or("delivery_status.is.null,delivery_status.neq.fallback_manual");

    if (unroutedLeads) {
      for (const lead of unroutedLeads) {
        const createdAt = new Date(lead.created_at).getTime();
        const window = getEscalationWindow(lead.urgency);

        if (now - createdAt > window) {
          await supabaseAdmin
            .from("navigator_requests")
            .update({ delivery_status: "fallback_manual" })
            .eq("id", lead.id);

          fallback++;
          console.log(`[escalation] Unrouted lead ${lead.id} flagged as fallback_manual`);
        }
      }
    }

    deliveryFailures = await runDeliveryValidation();

  } catch (err: any) {
    console.log("[escalation] Error in checkEscalations:", err?.message);
  }

  if (escalated > 0 || deliveryFailures > 0) {
    console.log(`[escalation] Cycle complete: ${escalated} escalated, ${rerouted} re-routed, ${reassigned} reassigned, ${fallback} fallback, ${deliveryFailures} delivery issues`);
  }

  return { escalated, rerouted, fallback, reassigned, deliveryFailures };
}

async function runDeliveryValidation(): Promise<number> {
  let failures = 0;
  try {
    const { data: routedLeads } = await supabaseAdmin
      .from("navigator_requests")
      .select("id, routed_to_partner_id, email_sent, email_sent_at, assigned_at, delivery_status, response_status, routed_at")
      .in("status", ["new", "in_progress"])
      .not("routed_to_partner_id", "is", null);

    if (!routedLeads) return 0;

    for (const lead of routedLeads) {
      if (lead.delivery_status === "fallback_manual" || lead.delivery_status === "unrouted") continue;

      const issues: string[] = [];

      if (lead.delivery_status === "delivered") {
        if (!lead.email_sent) issues.push("email_sent=false");
        if (!lead.email_sent_at) issues.push("missing email_sent_at");
      }

      if (!lead.assigned_at) issues.push("missing assigned_at");
      if (!lead.response_status) issues.push("missing response_status");

      if (lead.delivery_status === "ready_for_delivery" && lead.routed_at) {
        const routedAt = new Date(lead.routed_at).getTime();
        if (Date.now() - routedAt > 5 * 60 * 1000) {
          issues.push("stuck in ready_for_delivery > 5min");
        }
      }

      if (issues.length > 0) {
        failures++;

        const backfill: any = {};
        if (!lead.assigned_at && lead.routed_at) {
          backfill.assigned_at = lead.routed_at;
        }
        if (!lead.email_sent && lead.email_sent_at) {
          backfill.email_sent = true;
        }
        if (!lead.response_status) {
          backfill.response_status = "pending";
        }
        if (issues.includes("stuck in ready_for_delivery > 5min")) {
          backfill.delivery_status = "delivery_failed";
        }

        if (Object.keys(backfill).length > 0) {
          await supabaseAdmin
            .from("navigator_requests")
            .update(backfill)
            .eq("id", lead.id);
        }

        if (lead.routed_to_partner_id && (lead.email_sent || backfill.email_sent) && lead.email_sent_at) {
          try {
            await supabaseAdmin.from("navigator_requests").update({ is_billable: true, billing_status: "billable" }).eq("id", lead.id);
          } catch {}
        }

        console.log(`[delivery-validation] Lead ${lead.id} issues: ${issues.join(", ")}${Object.keys(backfill).length > 0 ? " (auto-fixed)" : ""}`);
      }
    }
  } catch (err: any) {
    console.log("[delivery-validation] Error:", err?.message);
  }
  return failures;
}

export { runDeliveryValidation };

let escalationInterval: ReturnType<typeof setInterval> | null = null;

export function startEscalationTimer(intervalMs: number = 5 * 60 * 1000): void {
  if (escalationInterval) {
    clearInterval(escalationInterval);
  }

  escalationInterval = setInterval(async () => {
    try {
      await checkEscalations();
    } catch (err: any) {
      console.log("[escalation] Timer error:", err?.message);
    }
    try {
      const { checkGracePeriodExpirations } = await import("./stripe-service");
      await checkGracePeriodExpirations();
    } catch (err: any) {
      console.log("[grace] Timer error:", err?.message);
    }
  }, intervalMs);

  console.log(`[escalation] Timer started — checking every ${Math.round(intervalMs / 60000)} minutes`);
}

export function stopEscalationTimer(): void {
  if (escalationInterval) {
    clearInterval(escalationInterval);
    escalationInterval = null;
    console.log("[escalation] Timer stopped");
  }
}
