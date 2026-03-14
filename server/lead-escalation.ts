import { supabase, supabaseAdmin } from "./supabase";
import { findBestPartner } from "./lead-router";

const ESCALATION_WINDOWS: Record<string, number> = {
  immediate: 15 * 60 * 1000,
  same_week: 48 * 60 * 60 * 1000,
  standard: 7 * 24 * 60 * 60 * 1000,
  information: 14 * 24 * 60 * 60 * 1000,
};

const DEFAULT_WINDOW = 7 * 24 * 60 * 60 * 1000;

function getEscalationWindow(urgency: string | null): number {
  return ESCALATION_WINDOWS[urgency || ""] || DEFAULT_WINDOW;
}

export async function checkEscalations(): Promise<{
  escalated: number;
  rerouted: number;
  fallback: number;
}> {
  let escalated = 0;
  let rerouted = 0;
  let fallback = 0;

  try {
    const { data: routedLeads, error } = await supabaseAdmin
      .from("navigator_requests")
      .select("id, urgency, routed_to_partner_id, routed_at, delivery_status, escalation_count, routing_history, category, subcategory, user_state, user_city")
      .eq("status", "new")
      .not("routed_to_partner_id", "is", null)
      .eq("delivery_status", "pending");

    if (error) {
      if (error.message.includes("does not exist")) return { escalated: 0, rerouted: 0, fallback: 0 };
      console.log("[escalation] Error fetching routed leads:", error.message);
    }

    const now = Date.now();

    for (const lead of (routedLeads || [])) {
      const routedAt = new Date(lead.routed_at).getTime();
      const window = getEscalationWindow(lead.urgency);

      if (now - routedAt <= window) continue;

      escalated++;

      const history = Array.isArray(lead.routing_history) ? lead.routing_history : [];
      const previousPartnerIds = history.map((h: any) => h.partner_id).filter(Boolean);
      if (lead.routed_to_partner_id) previousPartnerIds.push(lead.routed_to_partner_id);

      history.push({
        partner_id: lead.routed_to_partner_id,
        routed_at: lead.routed_at,
        delivery_status: "escalated",
        escalated_at: new Date().toISOString(),
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
        history.push({
          partner_id: newMatch.partnerId,
          partner_name: newMatch.partnerName,
          rule_id: newMatch.ruleId,
          routed_at: new Date().toISOString(),
          delivery_status: "pending",
        });

        await supabaseAdmin
          .from("navigator_requests")
          .update({
            routed_to_partner_id: newMatch.partnerId,
            routed_at: new Date().toISOString(),
            delivery_status: "pending",
            escalation_count: (lead.escalation_count || 0) + 1,
            routing_history: history,
          })
          .eq("id", lead.id);

        rerouted++;
        console.log(`[escalation] Lead ${lead.id} re-routed to ${newMatch.partnerName}`);
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
        console.log(`[escalation] Lead ${lead.id} sent to manual fallback queue`);
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
  } catch (err: any) {
    console.log("[escalation] Error in checkEscalations:", err?.message);
  }

  if (escalated > 0) {
    console.log(`[escalation] Cycle complete: ${escalated} escalated, ${rerouted} re-routed, ${fallback} fallback`);
  }

  return { escalated, rerouted, fallback };
}

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
