import { query as pgQuery } from "./pg-client";
import { toCanonical, isCanonical } from "../shared/canonical-categories";

const VALID_LEAD_CLASSES = ["explicit_lead", "engagement_event", "ai_intent", "visibility_event"] as const;
export type LeadClass = typeof VALID_LEAD_CLASSES[number];

const LEAD_CLASS_ALIASES: Record<string, LeadClass> = {
  "explicit": "explicit_lead",
  "engagement": "engagement_event",
};

function normalizeLeadClass(raw: string): LeadClass | null {
  if ((VALID_LEAD_CLASSES as readonly string[]).includes(raw)) return raw as LeadClass;
  return LEAD_CLASS_ALIASES[raw] || null;
}

export interface LeadEventData {
  event_type: string;
  lead_class: string;
  action_type: string;

  user_id?: string | null;
  session_id?: string | null;
  anonymous_id?: string | null;

  source_surface: string;

  partner_id?: string | null;
  resource_id?: string | null;

  category_slug: string;
  subcategory_slug?: string | null;

  utm_id?: string | null;
  ambassador_id?: string | null;
  referral_code?: string | null;

  state?: string | null;
  city?: string | null;

  ai_origin?: boolean;
  ai_intent_category?: string | null;
  ai_intent_subcategory?: string | null;

  delivery_status?: string | null;
  acknowledgement_status?: string | null;

  billable?: boolean;
  billing_type?: string | null;

  metadata?: Record<string, any> | null;
}

export async function ensureLeadEventsTable(): Promise<void> {
  try {
    await pgQuery(`
      CREATE TABLE IF NOT EXISTS lead_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type TEXT NOT NULL,
        lead_class TEXT NOT NULL,
        action_type TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

        user_id UUID,
        session_id TEXT,
        anonymous_id TEXT,

        source_surface TEXT NOT NULL,

        partner_id UUID,
        resource_id UUID,

        category_slug TEXT NOT NULL,
        subcategory_slug TEXT,

        utm_id TEXT,
        ambassador_id UUID,
        referral_code TEXT,

        state TEXT,
        city TEXT,

        ai_origin BOOLEAN NOT NULL DEFAULT false,
        ai_intent_category TEXT,
        ai_intent_subcategory TEXT,

        delivery_status TEXT,
        acknowledgement_status TEXT,

        billable BOOLEAN NOT NULL DEFAULT false,
        billing_type TEXT,
        metadata JSONB
      )
    `);
    await pgQuery(`ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY`);
    await pgQuery(`ALTER TABLE lead_events ALTER COLUMN source_surface SET NOT NULL`).catch(() => {});
    await pgQuery(`ALTER TABLE lead_events ALTER COLUMN category_slug SET NOT NULL`).catch(() => {});
    await pgQuery(`ALTER TABLE lead_events ALTER COLUMN lead_class SET NOT NULL`).catch(() => {});
    await pgQuery(`ALTER TABLE lead_events ADD COLUMN IF NOT EXISTS metadata JSONB`).catch(() => {});
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_lead_events_type ON lead_events(event_type)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_lead_events_class ON lead_events(lead_class)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_lead_events_created ON lead_events(created_at)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_lead_events_partner ON lead_events(partner_id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_lead_events_category ON lead_events(category_slug)`);
    console.log("[schema] lead_events table ready");
  } catch (err: any) {
    console.error("[schema] lead_events table error:", err.message);
  }
}

export async function logLeadEvent(data: LeadEventData): Promise<void> {
  try {
    if (!data.lead_class) {
      console.warn("[lead-events] Rejected event: missing lead_class", { event_type: data.event_type });
      return;
    }
    const validatedClass = normalizeLeadClass(data.lead_class);
    if (!validatedClass) {
      console.warn("[lead-events] Rejected event: invalid lead_class", { lead_class: data.lead_class, event_type: data.event_type });
      return;
    }
    if (!data.category_slug) {
      console.warn("[lead-events] Rejected event: missing category_slug", { event_type: data.event_type, source_surface: data.source_surface });
      return;
    }
    if (!data.source_surface) {
      console.warn("[lead-events] Rejected event: missing source_surface", { event_type: data.event_type, category_slug: data.category_slug });
      return;
    }

    const canonicalSlug = isCanonical(data.category_slug) ? data.category_slug : toCanonical(data.category_slug);

    await pgQuery(
      `INSERT INTO lead_events (
        event_type, lead_class, action_type,
        user_id, session_id, anonymous_id,
        source_surface,
        partner_id, resource_id,
        category_slug, subcategory_slug,
        utm_id, ambassador_id, referral_code,
        state, city,
        ai_origin, ai_intent_category, ai_intent_subcategory,
        delivery_status, acknowledgement_status,
        billable, billing_type,
        metadata
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6,
        $7,
        $8, $9,
        $10, $11,
        $12, $13, $14,
        $15, $16,
        $17, $18, $19,
        $20, $21,
        $22, $23,
        $24
      )`,
      [
        data.event_type,
        validatedClass,
        data.action_type,
        data.user_id || null,
        data.session_id || null,
        data.anonymous_id || null,
        data.source_surface,
        data.partner_id || null,
        data.resource_id || null,
        canonicalSlug,
        data.subcategory_slug || null,
        data.utm_id || null,
        data.ambassador_id || null,
        data.referral_code || null,
        data.state || null,
        data.city || null,
        data.ai_origin ?? false,
        data.ai_intent_category || null,
        data.ai_intent_subcategory || null,
        data.delivery_status || null,
        data.acknowledgement_status || null,
        data.billable ?? false,
        data.billing_type || null,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ]
    );
  } catch (err: any) {
    console.error("[lead-events] Failed to log event:", err.message);
  }
}
