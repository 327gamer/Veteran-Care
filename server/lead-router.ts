import { supabase, supabaseAdmin } from "./supabase";
import { sendLeadNotification } from "./lead-email";
import { platform } from "../shared/platform";
import { query as pgQuery } from "./pg-client";

const ADMIN_EMAILS = [
  platform.email.defaultNotifyEmail.toLowerCase(),
];

function isExternalEmail(email: string | null): boolean {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  if (!lower || !lower.includes("@")) return false;
  if (ADMIN_EMAILS.includes(lower)) return false;
  const domain = lower.split("@")[1];
  if (domain === "veterancare.com" || domain.endsWith(".veterancare.com")) return false;
  return true;
}

interface RoutingRule {
  id: string;
  partner_id: string;
  category_slug: string | null;
  subcategory: string | null;
  urgency: string | null;
  state: string | null;
  city: string | null;
  priority: number;
  max_leads_per_day: number | null;
  is_active: boolean;
  partner: {
    id: string;
    name: string;
    is_active: boolean;
    is_lead_enabled: boolean;
    contact_email: string | null;
    state: string | null;
    cities: string[] | null;
  };
}

interface LeadForRouting {
  id: string;
  category?: string | null;
  subcategory?: string | null;
  urgency?: string | null;
  user_state?: string | null;
  user_city?: string | null;
}

function computeSpecificity(rule: RoutingRule): number {
  let score = 0;
  if (rule.category_slug) score += 4;
  if (rule.subcategory) score += 2;
  if (rule.urgency) score += 1;
  if (rule.state) score += 2;
  if (rule.city) score += 2;
  return score;
}

async function getCategorySlugForLead(lead: LeadForRouting): Promise<string | null> {
  if (!lead.category) return null;
  const { data } = await supabase
    .from("categories")
    .select("slug")
    .or(`slug.eq.${lead.category},name.ilike.%${lead.category}%`)
    .limit(1)
    .single();
  return data?.slug || null;
}

async function countTodayLeadsForPartner(partnerId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count } = await supabaseAdmin
    .from("navigator_requests")
    .select("id", { count: "exact", head: true })
    .eq("routed_to_partner_id", partnerId)
    .gte("routed_at", today.toISOString());
  return count || 0;
}

export interface PartnerCandidate {
  partnerId: string;
  partnerName: string;
  ruleId: string;
  priority: number;
  categoryMatch: boolean;
}

function applyRoutingFilters(rules: any[], lead: LeadForRouting, categorySlug: string | null, excludePartnerIds: string[]): any[] {
  return rules.filter((rule) => {
    const partner = rule.partner;
    if (!partner || !partner.is_active || !partner.is_lead_enabled) return false;
    if (excludePartnerIds.includes(partner.id)) return false;

    if (rule.category_slug && categorySlug && rule.category_slug !== categorySlug) return false;
    if (rule.category_slug && !categorySlug) return false;

    if (rule.subcategory && lead.subcategory &&
        rule.subcategory.toLowerCase() !== lead.subcategory.toLowerCase()) return false;
    if (rule.subcategory && !lead.subcategory) return false;

    if (rule.urgency && lead.urgency && rule.urgency !== lead.urgency) return false;
    if (rule.urgency && !lead.urgency) return false;

    if (rule.state && lead.user_state && rule.state.toUpperCase() !== lead.user_state.toUpperCase()) return false;
    if (rule.state && !lead.user_state) return false;

    if (rule.city && lead.user_city &&
        rule.city.toLowerCase() !== lead.user_city.toLowerCase()) return false;
    if (rule.city && !lead.user_city) return false;

    if (partner.state && lead.user_state &&
        partner.state.toUpperCase() !== lead.user_state.toUpperCase()) return false;

    if (partner.cities && partner.cities.length > 0 && lead.user_city) {
      const partnerCitiesLower = partner.cities.map((c: string) => c.toLowerCase());
      if (!partnerCitiesLower.includes(lead.user_city.toLowerCase())) return false;
    }

    return true;
  });
}

export async function findCandidatePartners(
  lead: LeadForRouting,
  excludePartnerIds: string[] = []
): Promise<PartnerCandidate[]> {
  const categorySlug = await getCategorySlugForLead(lead);

  const { data: rules, error } = await supabaseAdmin
    .from("partner_routing_rules")
    .select("*, partner:partner_organizations!partner_id(id, name, is_active, is_lead_enabled, contact_email, state, cities)")
    .eq("is_active", true);

  if (error || !rules || rules.length === 0) return [];

  const filtered = applyRoutingFilters(rules as any[], lead, categorySlug, excludePartnerIds);

  filtered.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return computeSpecificity(b) - computeSpecificity(a);
  });

  const seen = new Set<string>();
  return filtered
    .filter((rule) => {
      if (seen.has(rule.partner.id)) return false;
      seen.add(rule.partner.id);
      return true;
    })
    .map((rule) => ({
      partnerId: rule.partner.id,
      partnerName: rule.partner.name,
      ruleId: rule.id,
      priority: rule.priority,
      categoryMatch: !!rule.category_slug,
    }));
}

export async function findBestPartner(
  lead: LeadForRouting,
  excludePartnerIds: string[] = []
): Promise<{ partnerId: string; partnerName: string; ruleId: string } | null> {
  const categorySlug = await getCategorySlugForLead(lead);

  const { data: rules, error } = await supabaseAdmin
    .from("partner_routing_rules")
    .select("*, partner:partner_organizations!partner_id(id, name, is_active, is_lead_enabled, contact_email, state, cities)")
    .eq("is_active", true);

  if (error || !rules || rules.length === 0) return null;

  const candidates = applyRoutingFilters(rules as any[], lead, categorySlug, excludePartnerIds);

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return computeSpecificity(b) - computeSpecificity(a);
  });

  for (const rule of candidates) {
    if (!isExternalEmail(rule.partner.contact_email)) {
      console.log(`[router] Skipping ${rule.partner.name} — no external intake email`);
      continue;
    }
    if (rule.max_leads_per_day) {
      const todayCount = await countTodayLeadsForPartner(rule.partner.id);
      if (todayCount >= rule.max_leads_per_day) continue;
    }
    return {
      partnerId: rule.partner.id,
      partnerName: rule.partner.name,
      ruleId: rule.id,
    };
  }

  return null;
}

export async function routeLead(leadId: string): Promise<{
  routed: boolean;
  partnerId?: string;
  partnerName?: string;
}> {
  const { data: lead, error: leadErr } = await supabaseAdmin
    .from("navigator_requests")
    .select("id, category, subcategory, urgency, user_state, user_city, routed_to_partner_id")
    .eq("id", leadId)
    .single();

  if (leadErr || !lead) {
    console.log(`[router] Lead ${leadId} not found`);
    return { routed: false };
  }

  const excludeIds: string[] = [];
  if (lead.routed_to_partner_id) excludeIds.push(lead.routed_to_partner_id);

  try {
    const { data: current } = await supabaseAdmin
      .from("navigator_requests")
      .select("routing_history")
      .eq("id", leadId)
      .single();
    if (Array.isArray(current?.routing_history)) {
      for (const h of current.routing_history) {
        if (h.partner_id && !excludeIds.includes(h.partner_id)) {
          excludeIds.push(h.partner_id);
        }
      }
    }
  } catch {}

  const match = await findBestPartner(lead, excludeIds);
  if (!match) {
    console.log(`[router] No matching partner for lead ${leadId}`);
    return { routed: false };
  }

  const historyEntry = {
    partner_id: match.partnerId,
    partner_name: match.partnerName,
    rule_id: match.ruleId,
    routed_at: new Date().toISOString(),
    delivery_status: "pending",
  };

  let existingHistory: any[] = [];
  try {
    const { data: hist } = await supabaseAdmin
      .from("navigator_requests")
      .select("routing_history")
      .eq("id", leadId)
      .single();
    existingHistory = Array.isArray(hist?.routing_history) ? hist.routing_history : [];
  } catch {}
  existingHistory.push(historyEntry);

  const { error: updateErr } = await supabaseAdmin
    .from("navigator_requests")
    .update({
      routed_to_partner_id: match.partnerId,
      routed_at: new Date().toISOString(),
      delivery_status: "pending",
      routing_history: existingHistory,
    })
    .eq("id", leadId);

  if (updateErr) {
    console.log(`[router] Failed to route lead ${leadId}:`, updateErr.message);
    return { routed: false };
  }

  console.log(`[router] Lead ${leadId} routed to ${match.partnerName} (${match.partnerId})`);

  sendLeadNotification(leadId, match.partnerId).catch((err) => {
    console.log(`[router] Email notification failed for lead ${leadId}:`, err?.message);
  });

  createLeadBillingRecord(leadId, match.partnerId, lead.category || null).catch((err) => {
    console.log(`[router] Lead billing record creation failed for lead ${leadId}:`, err?.message);
  });

  return { routed: true, partnerId: match.partnerId, partnerName: match.partnerName };
}

async function createLeadBillingRecord(leadId: string, partnerId: string, category: string | null) {
  try {
    const partnerRows = await pgQuery(
      `SELECT billing_model, lead_price_cents FROM partner_applications WHERE id = $1`,
      [partnerId]
    );
    const partner = partnerRows[0];
    if (!partner || partner.billing_model === 'subscription_only' || !partner.billing_model) {
      return;
    }
    let priceCents = partner.lead_price_cents;
    if (!priceCents && category) {
      const catSlug = category.toLowerCase().replace(/\s+/g, '-');
      const catPricing = await pgQuery(
        `SELECT price_cents FROM lead_category_pricing WHERE category_slug = $1 AND is_active = true`,
        [catSlug]
      );
      if (catPricing.length > 0) priceCents = catPricing[0].price_cents;
    }
    if (!priceCents) priceCents = 2500;
    const now = new Date();
    const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await pgQuery(
      `INSERT INTO lead_billing_records (partner_id, navigator_request_id, lead_category, price_cents, billing_period)
       VALUES ($1, $2, $3, $4, $5)`,
      [partnerId, leadId, category, priceCents, billingPeriod]
    );
    console.log(`[billing] Lead billing record created for partner ${partnerId}, lead ${leadId}, $${(priceCents / 100).toFixed(2)}`);
  } catch (err: any) {
    console.log(`[billing] Failed to create billing record:`, err.message);
  }
}

export async function autoRouteNewLead(leadId: string): Promise<{ routed: boolean; partnerId?: string; partnerName?: string }> {
  try {
    const result = await routeLead(leadId);
    if (!result.routed) {
      console.log(`[router] Lead ${leadId} unmatched — self-serve fallback`);
    }
    return result;
  } catch (err: any) {
    console.log(`[router] Auto-route error for ${leadId}:`, err?.message);
    return { routed: false };
  }
}
