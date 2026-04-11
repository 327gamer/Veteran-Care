import { supabase, supabaseAdmin } from "./supabase";
import { sendLeadNotification } from "./lead-email";
import { platform } from "../shared/platform";
import { query as pgQuery } from "./pg-client";
import { toCanonical } from "../shared/canonical-categories";
import { isLeadEligibleCategory, isLeadEligibleSubcategory } from "../shared/lead-eligibility";
import { logLeadEvent } from "./lead-events";

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
  const canonical = toCanonical(lead.category);
  const { data } = await supabase
    .from("categories")
    .select("slug")
    .or(`slug.eq.${lead.category},slug.eq.${canonical},name.ilike.%${lead.category}%`)
    .limit(1)
    .single();
  return data?.slug ? toCanonical(data.slug) : (canonical !== lead.category ? canonical : null);
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
  locationMatch: boolean;
  partnerState?: string;
  partnerCity?: string;
  partnerCategory?: string;
}

function applyRoutingFilters(rules: any[], lead: LeadForRouting, categorySlug: string | null, excludePartnerIds: string[]): any[] {
  return rules.filter((rule) => {
    const partner = rule.partner;
    if (!partner || !partner.is_active || !partner.is_lead_enabled) return false;
    if (excludePartnerIds.includes(partner.id)) return false;

    const ruleCategory = rule.category_slug ? toCanonical(rule.category_slug) : null;
    if (ruleCategory && categorySlug && ruleCategory !== categorySlug) return false;
    if (ruleCategory && !categorySlug) return false;

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
    .map((rule) => {
      const hasLeadLocation = !!(lead.user_state || lead.user_city);
      const ruleMatchesLocation = hasLeadLocation && !!(
        (rule.state && lead.user_state && rule.state.toUpperCase() === lead.user_state.toUpperCase()) ||
        (rule.city && lead.user_city && rule.city.toLowerCase() === lead.user_city.toLowerCase()) ||
        (rule.partner.state && lead.user_state && rule.partner.state.toUpperCase() === lead.user_state.toUpperCase())
      );
      return {
        partnerId: rule.partner.id,
        partnerName: rule.partner.name,
        ruleId: rule.id,
        priority: rule.priority,
        categoryMatch: !!rule.category_slug,
        locationMatch: ruleMatchesLocation,
        partnerState: rule.partner.state || rule.state || undefined,
        partnerCity: rule.city || undefined,
        partnerCategory: rule.category_slug || undefined,
      };
    });
}

const MAX_PARTNERS_PER_LEAD = 3;

export async function findMatchingPartners(
  lead: LeadForRouting,
  excludePartnerIds: string[] = [],
  maxPartners: number = MAX_PARTNERS_PER_LEAD
): Promise<{ partnerId: string; partnerName: string; ruleId: string }[]> {
  const categorySlug = await getCategorySlugForLead(lead);

  const { data: rules, error } = await supabaseAdmin
    .from("partner_routing_rules")
    .select("*, partner:partner_organizations!partner_id(id, name, is_active, is_lead_enabled, contact_email, state, cities)")
    .eq("is_active", true);

  if (error || !rules || rules.length === 0) return [];

  const candidates = applyRoutingFilters(rules as any[], lead, categorySlug, excludePartnerIds);

  if (candidates.length === 0) return [];

  candidates.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return computeSpecificity(b) - computeSpecificity(a);
  });

  const matched: { partnerId: string; partnerName: string; ruleId: string }[] = [];
  const seenPartnerIds = new Set<string>();

  for (const rule of candidates) {
    if (matched.length >= maxPartners) break;
    if (seenPartnerIds.has(rule.partner.id)) continue;

    if (!isExternalEmail(rule.partner.contact_email)) {
      console.log(`[router] Skipping ${rule.partner.name} — no external intake email`);
      continue;
    }
    if (rule.max_leads_per_day) {
      const todayCount = await countTodayLeadsForPartner(rule.partner.id);
      if (todayCount >= rule.max_leads_per_day) continue;
    }
    seenPartnerIds.add(rule.partner.id);
    matched.push({
      partnerId: rule.partner.id,
      partnerName: rule.partner.name,
      ruleId: rule.id,
    });
  }

  return matched;
}

export async function findBestPartner(
  lead: LeadForRouting,
  excludePartnerIds: string[] = []
): Promise<{ partnerId: string; partnerName: string; ruleId: string } | null> {
  const matches = await findMatchingPartners(lead, excludePartnerIds, 1);
  return matches.length > 0 ? matches[0] : null;
}

async function markLeadUnrouted(leadId: string): Promise<void> {
  try {
    await supabaseAdmin
      .from("navigator_requests")
      .update({ delivery_status: "unrouted" })
      .eq("id", leadId);
  } catch {}
}

const ROUTABLE_LEAD_CLASSES = ["explicit_lead", "ai_intent"];

const AI_ESCALATION_KEYWORDS = [
  "help", "connect", "contact", "callback", "reach out",
  "speak to someone", "talk to someone", "get assistance",
  "need help", "call me", "someone to help",
];

export function isEscalatedAiIntent(leadClass: string | null | undefined, message: string | null | undefined): boolean {
  if (leadClass !== "ai_intent") return false;
  if (!message) return false;
  const lower = message.toLowerCase();
  return AI_ESCALATION_KEYWORDS.some((kw) => lower.includes(kw));
}

const KNOWN_LEAD_CLASSES = ["explicit_lead", "ai_intent", "engagement_event", "visibility_event"];

function resolveLeadClass(lead: any): string {
  const raw = lead.lead_class || null;
  if (raw && KNOWN_LEAD_CLASSES.includes(raw)) {
    return raw;
  }
  const source = lead.source || "";
  if (source === "get_help" || source === "resource_detail" || source === "admin") {
    return "explicit_lead";
  }
  return raw || "explicit_lead";
}

function isRoutableLeadClass(leadClass: string): boolean {
  return ROUTABLE_LEAD_CLASSES.includes(leadClass);
}

async function findBestResourceFallback(
  lead: LeadForRouting,
  categorySlug: string | null
): Promise<{ id: string; name: string; email: string | null; phone: string | null } | null> {
  if (!categorySlug) return null;
  try {
    const { data: resources } = await supabaseAdmin
      .from("resources")
      .select("id, title, email, phone, city, state, resource_categories(categories(slug))")
      .eq("status", "approved")
      .not("email", "is", null)
      .limit(200);

    if (!resources || resources.length === 0) return null;

    const matching = resources.filter((r: any) => {
      const cats = Array.isArray(r.resource_categories) ? r.resource_categories : [];
      const slugs = cats.map((rc: any) => {
        const cat = rc?.categories;
        return cat?.slug ? toCanonical(cat.slug) : null;
      }).filter(Boolean);
      return slugs.includes(categorySlug);
    });

    if (matching.length === 0) return null;

    const emailOk = (e: string | null) => {
      if (!e) return false;
      const d = e.toLowerCase().split("@")[1];
      return d && d !== "veterancare.com" && !d.endsWith(".veterancare.com");
    };

    const withEmail = matching.filter((r: any) => emailOk(r.email));
    if (withEmail.length === 0) return null;

    const scored = withEmail.map((r: any) => {
      let score = 0;
      if (lead.user_city && r.city && r.city.toLowerCase() === lead.user_city.toLowerCase()) score += 4;
      if (lead.user_state && r.state && r.state.toUpperCase() === lead.user_state.toUpperCase()) score += 2;
      return { ...r, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    return { id: best.id, name: best.title, email: best.email, phone: best.phone };
  } catch (err: any) {
    console.log("[router] Resource fallback search error:", err?.message);
    return null;
  }
}

export async function routeLead(leadId: string): Promise<{
  routed: boolean;
  partnerId?: string;
  partnerName?: string;
  partnerIds?: string[];
}> {
  const { data: lead, error: leadErr } = await supabaseAdmin
    .from("navigator_requests")
    .select("*")
    .eq("id", leadId)
    .single();

  if (leadErr || !lead) {
    console.log(`[router] Lead ${leadId} not found`);
    return { routed: false };
  }

  let categorySlug = await getCategorySlugForLead(lead);
  if (!categorySlug && lead.category) {
    const canonical = toCanonical(lead.category);
    if (canonical !== lead.category) {
      categorySlug = canonical;
    } else {
      categorySlug = lead.category;
    }
  }
  const subcategorySlug = lead.subcategory || null;
  const leadClass = resolveLeadClass(lead);

  const attributionFields = {
    utm_source: lead.utm_source || null,
    utm_medium: lead.utm_medium || null,
    utm_campaign: lead.utm_campaign || null,
    ambassador_id: lead.ambassador_id || null,
  };

  if (!categorySlug) {
    console.log(`[router] Lead ${leadId} has no resolvable category — skipping monetized routing`);
    logLeadEvent({
      event_type: "lead_unrouted",
      lead_class: leadClass,
      action_type: "route",
      source_surface: "lead_router",
      category_slug: lead.category || "unknown",
      subcategory_slug: subcategorySlug,
      state: lead.user_state || null,
      city: lead.user_city || null,
      delivery_status: "unrouted",
      metadata: { reason: "category_unresolvable", ...attributionFields },
    });
    await markLeadUnrouted(leadId);
    return { routed: false };
  }

  if (!isLeadEligibleCategory(categorySlug)) {
    console.log(`[router] Lead ${leadId} category "${categorySlug}" not lead-eligible — skipping monetized routing`);
    logLeadEvent({
      event_type: "lead_unrouted",
      lead_class: leadClass,
      action_type: "route",
      source_surface: "lead_router",
      category_slug: categorySlug || "unknown",
      subcategory_slug: subcategorySlug,
      state: lead.user_state || null,
      city: lead.user_city || null,
      delivery_status: "unrouted",
      metadata: { reason: "category_not_eligible", ...attributionFields },
    });
    await markLeadUnrouted(leadId);
    return { routed: false };
  }

  if (subcategorySlug && !isLeadEligibleSubcategory(categorySlug, subcategorySlug)) {
    console.log(`[router] Lead ${leadId} subcategory "${subcategorySlug}" in "${categorySlug}" is not lead-eligible — skipping monetized routing`);
    logLeadEvent({
      event_type: "lead_unrouted",
      lead_class: leadClass,
      action_type: "route",
      source_surface: "lead_router",
      category_slug: categorySlug || "unknown",
      subcategory_slug: subcategorySlug,
      state: lead.user_state || null,
      city: lead.user_city || null,
      delivery_status: "unrouted",
      metadata: { reason: "subcategory_not_eligible", ...attributionFields },
    });
    await markLeadUnrouted(leadId);
    return { routed: false };
  }

  if (leadClass === "ai_intent" && !isEscalatedAiIntent(leadClass, lead.message || lead.description || "")) {
    console.log(`[router] Lead ${leadId} is non-escalated ai_intent — skipping routing`);
    logLeadEvent({
      event_type: "lead_unrouted",
      lead_class: leadClass,
      action_type: "route",
      source_surface: "lead_router",
      category_slug: categorySlug || "unknown",
      subcategory_slug: subcategorySlug,
      state: lead.user_state || null,
      city: lead.user_city || null,
      delivery_status: "unrouted",
      metadata: { reason: "ai_intent_not_escalated", ...attributionFields },
    });
    await markLeadUnrouted(leadId);
    return { routed: false };
  }

  if (!isRoutableLeadClass(leadClass)) {
    console.log(`[router] Lead ${leadId} class "${leadClass}" is not routable — skipping`);
    logLeadEvent({
      event_type: "lead_unrouted",
      lead_class: leadClass,
      action_type: "route",
      source_surface: "lead_router",
      category_slug: categorySlug || "unknown",
      subcategory_slug: subcategorySlug,
      state: lead.user_state || null,
      city: lead.user_city || null,
      delivery_status: "unrouted",
      metadata: { reason: "lead_class_not_routable", ...attributionFields },
    });
    await markLeadUnrouted(leadId);
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

  const matches = await findMatchingPartners(lead, excludeIds, MAX_PARTNERS_PER_LEAD);
  if (matches.length === 0) {
    console.log(`[router] No matching partner for lead ${leadId} — trying resource fallback`);

    const resourceFallback = await findBestResourceFallback(lead, categorySlug);
    if (resourceFallback) {
      console.log(`[router] Resource fallback found for lead ${leadId}: ${resourceFallback.name}`);
      const now = new Date().toISOString();
      let hist: any[] = [];
      try {
        const { data: h } = await supabaseAdmin.from("navigator_requests").select("routing_history").eq("id", leadId).single();
        hist = Array.isArray(h?.routing_history) ? h.routing_history : [];
      } catch {}
      hist.push({
        partner_id: null,
        partner_name: resourceFallback.name,
        routed_at: now,
        delivery_status: "ready_for_delivery",
        assignment_type: "resource_fallback",
        resource_id: resourceFallback.id,
        recipient_email: resourceFallback.email,
      });
      await supabaseAdmin.from("navigator_requests").update({
        delivery_status: "ready_for_delivery",
        routed_at: now,
        routing_history: hist,
        admin_notes: `Auto-assigned to Resource: ${resourceFallback.name}${resourceFallback.phone ? " | " + resourceFallback.phone : ""}${resourceFallback.email ? " | " + resourceFallback.email : ""}`,
      }).eq("id", leadId);

      logLeadEvent({
        event_type: "lead_routed",
        lead_class: leadClass,
        action_type: "route",
        source_surface: "lead_router",
        category_slug: categorySlug || "unknown",
        subcategory_slug: subcategorySlug,
        state: lead.user_state || null,
        city: lead.user_city || null,
        delivery_status: "ready_for_delivery",
        metadata: { reason: "resource_fallback", resource_id: resourceFallback.id, resource_name: resourceFallback.name, ...attributionFields },
      });

      if (resourceFallback.email) {
        const { sendLeadNotificationDirect } = await import("./lead-email");
        sendLeadNotificationDirect(leadId, resourceFallback.email, resourceFallback.name, null)
          .then(async (result) => {
            if (result.sent) {
              await supabaseAdmin.from("navigator_requests").update({ delivery_status: "delivered" }).eq("id", leadId).catch(() => {});
              logLeadEvent({
                event_type: "lead_delivered_to_partner",
                lead_class: leadClass, action_type: "deliver", source_surface: "lead_router",
                category_slug: categorySlug || "unknown", subcategory_slug: subcategorySlug,
                state: lead.user_state || null, city: lead.user_city || null,
                delivery_status: "delivered",
                metadata: { resource_fallback: true, resource_id: resourceFallback.id, ...attributionFields },
              });
            }
          })
          .catch((err) => {
            console.log(`[router] Resource fallback email failed for lead ${leadId}:`, err?.message);
          });
      }

      return { routed: true, partnerName: resourceFallback.name };
    }

    logLeadEvent({
      event_type: "lead_unrouted",
      lead_class: leadClass,
      action_type: "route",
      source_surface: "lead_router",
      category_slug: categorySlug || "unknown",
      subcategory_slug: subcategorySlug,
      state: lead.user_state || null,
      city: lead.user_city || null,
      delivery_status: "unrouted",
      metadata: { reason: "no_partner_or_resource_match", ...attributionFields },
    });
    await markLeadUnrouted(leadId);
    return { routed: false };
  }

  const primaryMatch = matches[0];
  const now = new Date().toISOString();

  let existingHistory: any[] = [];
  try {
    const { data: hist } = await supabaseAdmin
      .from("navigator_requests")
      .select("routing_history")
      .eq("id", leadId)
      .single();
    existingHistory = Array.isArray(hist?.routing_history) ? hist.routing_history : [];
  } catch {}

  for (const match of matches) {
    existingHistory.push({
      partner_id: match.partnerId,
      partner_name: match.partnerName,
      rule_id: match.ruleId,
      routed_at: now,
      delivery_status: "ready_for_delivery",
    });
  }

  const { error: updateErr } = await supabaseAdmin
    .from("navigator_requests")
    .update({
      routed_to_partner_id: primaryMatch.partnerId,
      routed_at: now,
      delivery_status: "ready_for_delivery",
      routing_history: existingHistory,
    })
    .eq("id", leadId);

  if (updateErr) {
    console.log(`[router] Failed to route lead ${leadId}:`, updateErr.message);
    return { routed: false };
  }

  console.log(`[router] Lead ${leadId} routed to ${matches.length} partner(s): ${matches.map(m => m.partnerName).join(", ")}`);

  logLeadEvent({
    event_type: "lead_routed",
    lead_class: leadClass,
    action_type: "route",
    source_surface: "lead_router",
    category_slug: categorySlug || "unknown",
    subcategory_slug: subcategorySlug,
    partner_id: primaryMatch.partnerId,
    state: lead.user_state || null,
    city: lead.user_city || null,
    delivery_status: "ready_for_delivery",
    metadata: {
      partner_count: matches.length,
      partner_ids: matches.map(m => m.partnerId),
      ...attributionFields,
    },
  });

  for (const match of matches) {
    sendLeadNotification(leadId, match.partnerId)
      .then(async () => {
        logLeadEvent({
          event_type: "lead_delivered_to_partner",
          lead_class: leadClass,
          action_type: "deliver",
          source_surface: "lead_router",
          category_slug: categorySlug || "unknown",
          subcategory_slug: subcategorySlug,
          partner_id: match.partnerId,
          state: lead.user_state || null,
          city: lead.user_city || null,
          delivery_status: "delivered",
          metadata: attributionFields,
        });

        if (match.partnerId === primaryMatch.partnerId) {
          await supabaseAdmin
            .from("navigator_requests")
            .update({ delivery_status: "delivered" })
            .eq("id", leadId)
            .catch(() => {});
        }

        createLeadBillingRecord(leadId, match.partnerId, lead.category || null).catch((err) => {
          console.log(`[router] Lead billing record creation failed for lead ${leadId}:`, err?.message);
        });
      })
      .catch((err) => {
        console.log(`[router] Email notification failed for lead ${leadId} to ${match.partnerName}:`, err?.message);

        logLeadEvent({
          event_type: "lead_delivered_to_partner",
          lead_class: leadClass,
          action_type: "deliver",
          source_surface: "lead_router",
          category_slug: categorySlug || "unknown",
          subcategory_slug: subcategorySlug,
          partner_id: match.partnerId,
          state: lead.user_state || null,
          city: lead.user_city || null,
          delivery_status: "delivery_failed",
          metadata: { error: err?.message, ...attributionFields },
        });

        if (match.partnerId === primaryMatch.partnerId) {
          supabaseAdmin
            .from("navigator_requests")
            .update({ delivery_status: "delivery_failed" })
            .eq("id", leadId)
            .catch(() => {});
        }
      });
  }

  return {
    routed: true,
    partnerId: primaryMatch.partnerId,
    partnerName: primaryMatch.partnerName,
    partnerIds: matches.map(m => m.partnerId),
  };
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

export async function autoRouteNewLead(leadId: string): Promise<{ routed: boolean; partnerId?: string; partnerName?: string; partnerIds?: string[] }> {
  try {
    const result = await routeLead(leadId);
    if (!result.routed) {
      console.log(`[router] Lead ${leadId} not routed — self-serve fallback`);
    }
    return result;
  } catch (err: any) {
    console.log(`[router] Auto-route error for ${leadId}:`, err?.message);
    return { routed: false };
  }
}
