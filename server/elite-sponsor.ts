import type { Express, Request, Response, NextFunction } from "express";
import type Stripe from "stripe";
import { supabaseAdmin } from "./supabase";
import {
  getDefaultEcssPriceCents,
  ECSS_TIER_1_STATES,
  ECSS_TIER_2_STATES,
  ECSS_TIER_1_CENTS,
  ECSS_TIER_2_CENTS,
  ECSS_TIER_3_CENTS,
} from "@shared/ecss-pricing";
import { supabaseQuery, isSupabaseDbConfigured } from "./supabase-pg-client";
import { query as pgQuery } from "./pg-client";
import { platform } from "../shared/platform";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------
// Elite Category Sponsor Slot (ECSS) — Phase A + B
//
// Single-occupancy premium banner above category listings.
// One slot per (state × category) at the TOP, plus optional
// per-(state × category × subcategory) slots.
// Vacant = placeholder. Sold + approved + billing_active = filled.
//
// Phase A surface:
//   GET  /api/elite-sponsor?categorySlug=&state=
//   GET  /api/elite-sponsor/categories
//   GET  /api/admin/elite-sponsor-slots                    (admin)
//   POST /api/admin/elite-sponsor-slots                    (admin)
//   PATCH /api/admin/elite-sponsor-slots/:id               (admin)
//   POST /api/admin/elite-sponsor-slots/seed-vacant        (admin)
//
// Phase B adds:
//   GET  /api/elite-sponsor/available?categorySlug=&state=&subcategory=
//   POST /api/elite-sponsor/leads                          (public)
//   POST /api/elite-sponsor/waitlist                       (public)
//   POST /api/admin/elite-sponsor/checkout                 (admin)
//   GET  /api/admin/elite-sponsor-leads                    (admin)
//   GET  /api/admin/elite-sponsor-waitlist                 (admin)
//   PATCH (extended): creative_approval_status / rejection_reason
//                     sponsor_partner_application_id / organization_id
//
//   Stripe webhook handlers (called from server/stripe-service.ts when
//   metadata.kind === "ecss_slot"):
//     handleEcssCheckoutCompleted, handleEcssSubscriptionSync,
//     handleEcssSubscriptionCanceled, handleEcssInvoicePaid,
//     handleEcssPaymentFailed
// ---------------------------------------------------------------

export const ECSS_CATEGORIES = [
  {
    slug: "legal-services",
    label: "Legal Services",
    mount_path: "/legal-services",
    description: "Estate planning, VA appeals, family law, consumer protection",
  },
  {
    slug: "mortgage-lending",
    label: "Mortgage / Lending",
    mount_path: "/financial-services",
    description: "VA loans, refinance, mortgage brokers, lending services",
  },
  {
    slug: "real-estate",
    label: "Real Estate",
    mount_path: "/real-estate",
    description: "Veteran-friendly real estate agents and brokerages",
  },
  {
    slug: "insurance",
    label: "Insurance",
    mount_path: "/insurance",
    description: "Auto, home, life, and disability insurance for veterans",
  },
] as const;

export type EcssCategorySlug = (typeof ECSS_CATEGORIES)[number]["slug"];

export interface EliteSponsorSlot {
  id: string;
  category_slug: string;
  subcategory_slug: string | null;
  state_code: string;
  status: "vacant" | "sold" | "paused";
  monthly_price_cents: number;
  lead_price_cents: number;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  sponsor_short_description: string | null;
  sponsor_cta_text: string | null;
  sponsor_lead_email: string | null;
  sponsor_phone: string | null;
  sponsor_website_url: string | null;
  billing_status: "unpaid" | "active" | "past_due" | "cancelled";
  creative_approval_status: "pending" | "approved" | "rejected";
  creative_rejection_reason: string | null;
  sponsor_partner_application_id: string | null;
  sponsor_partner_organization_id: string | null;
  attributed_ambassador_id: string | null;
  attributed_session_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  sold_at: string | null;
  unsold_at: string | null;
  notes_internal: string | null;
  created_at: string;
  updated_at: string;
}

export function getEcssCategoryBySlug(
  slug: string
): (typeof ECSS_CATEGORIES)[number] | null {
  return ECSS_CATEGORIES.find((c) => c.slug === slug) || null;
}

// ---------------------------------------------------------------
// Bootstrap — apply additive SQL via direct DDL connection.
// Idempotent (IF NOT EXISTS). Safe to call on every server boot.
// Never uses db:push. Never modifies existing tables (only ADDs).
// ---------------------------------------------------------------
let bootstrapAttempted = false;
let bootstrapSucceeded = false;

export async function ensureEliteSponsorTables(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (bootstrapAttempted && bootstrapSucceeded) {
    return { ok: true };
  }
  bootstrapAttempted = true;

  if (!isSupabaseDbConfigured()) {
    console.warn(
      "[ECSS] SUPABASE_DB_PASSWORD/SUPABASE_DB_URL not configured — cannot auto-apply schema. " +
        "Run supabase/create_elite_sponsor_slots.sql manually in Supabase SQL Editor."
    );
    return { ok: false, reason: "supabase_db_not_configured" };
  }

  const sqlPath = path.resolve(
    process.cwd(),
    "supabase/create_elite_sponsor_slots.sql"
  );
  if (!fs.existsSync(sqlPath)) {
    return { ok: false, reason: "sql_file_missing" };
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  try {
    // Single multi-statement execution. supabaseQuery uses pg.Pool which
    // accepts multi-statement SQL when no parameters are bound.
    await supabaseQuery(sql);
    bootstrapSucceeded = true;
    console.log("[ECSS] Phase A+B schema applied (idempotent).");
    // Idempotent state-tier backfill: only touches vacant slots still at
    // the legacy $499 default in tier-1/tier-2 states. Admin overrides on
    // any non-default-priced slot are preserved automatically because the
    // WHERE clause requires monthly_price_cents=49900. Sold/active slots
    // are skipped because we additionally require status='vacant'.
    await backfillEcssTierPrices();
    return { ok: true };
  } catch (err: any) {
    console.error(`[ECSS] Schema apply failed: ${err.message}`);
    return { ok: false, reason: err.message };
  }
}

async function backfillEcssTierPrices(): Promise<void> {
  try {
    // Tier 1 ($899): CA, TX, FL, NY
    const { data: t1, error: e1 } = await supabaseAdmin
      .from("elite_sponsor_slots")
      .update({ monthly_price_cents: ECSS_TIER_1_CENTS })
      .eq("status", "vacant")
      .eq("billing_status", "unpaid")
      .eq("monthly_price_cents", ECSS_TIER_3_CENTS)
      .in("state_code", [...ECSS_TIER_1_STATES])
      .select("id");
    if (e1) throw e1;

    // Tier 2 ($699): PA, OH, NC, GA
    const { data: t2, error: e2 } = await supabaseAdmin
      .from("elite_sponsor_slots")
      .update({ monthly_price_cents: ECSS_TIER_2_CENTS })
      .eq("status", "vacant")
      .eq("billing_status", "unpaid")
      .eq("monthly_price_cents", ECSS_TIER_3_CENTS)
      .in("state_code", [...ECSS_TIER_2_STATES])
      .select("id");
    if (e2) throw e2;

    const t1n = t1?.length || 0;
    const t2n = t2?.length || 0;
    if (t1n + t2n > 0) {
      console.log(
        `[ECSS] Tier price backfill: tier1(+$899)=${t1n} tier2(+$699)=${t2n} (sold/admin-overridden slots untouched)`
      );
    } else {
      console.log("[ECSS] Tier price backfill: no rows needed updating (already at tier prices or admin-overridden).");
    }
  } catch (err: any) {
    console.error(`[ECSS] Tier price backfill failed: ${err.message} (non-fatal)`);
  }
}

// ---------------------------------------------------------------
// Public endpoint: which sponsor (if any) owns this state × category
// ---------------------------------------------------------------
function isValidCategorySlug(s: unknown): s is EcssCategorySlug {
  return (
    typeof s === "string" &&
    ECSS_CATEGORIES.some((c) => c.slug === s)
  );
}

function isValidStateCode(s: unknown): boolean {
  return typeof s === "string" && /^[A-Z]{2}$/.test(s);
}

export function registerEliteSponsorRoutes(
  app: Express,
  requireAdmin: (req: Request, res: Response, next: NextFunction) => void
): void {
  // -------- public: category list (for placeholder copy on /partner-apply) --------
  app.get("/api/elite-sponsor/categories", (_req, res) => {
    res.json({ categories: ECSS_CATEGORIES });
  });

  // -------- public: lookup slot for a (state × category) --------
  app.get("/api/elite-sponsor", async (req, res) => {
    try {
      const categorySlug = String(req.query.categorySlug || "").trim();
      const stateCode = String(req.query.state || "").trim().toUpperCase();

      if (!isValidCategorySlug(categorySlug)) {
        return res
          .status(400)
          .json({ error: "Invalid or missing categorySlug" });
      }
      if (stateCode && !isValidStateCode(stateCode)) {
        return res.status(400).json({ error: "Invalid state code" });
      }

      // No state context → render national placeholder
      if (!stateCode) {
        return res.json({
          slot: null,
          status: "vacant",
          isPlaceholder: true,
          categorySlug,
          stateCode: null,
        });
      }

      // Phase B: only return TOP slot (subcategory_slug IS NULL) for the
      // category banner. Subcategory slots are queried separately when/if
      // the per-subcategory marketplace UI ships.
      const { data, error } = await supabaseAdmin
        .from("elite_sponsor_slots")
        .select(
          "id, category_slug, state_code, status, billing_status, creative_approval_status, sponsor_name, sponsor_logo_url, sponsor_short_description, sponsor_cta_text, sponsor_phone, sponsor_website_url"
        )
        .eq("category_slug", categorySlug)
        .eq("state_code", stateCode)
        .is("subcategory_slug", null)
        .maybeSingle();

      if (error) {
        // Likely table-not-yet-created. Fall back to vacant.
        console.error(`[ECSS] /api/elite-sponsor error: ${error.message}`);
        return res.json({
          slot: null,
          status: "vacant",
          isPlaceholder: true,
          categorySlug,
          stateCode,
        });
      }

      // Filled = sold + active billing + APPROVED creative. The RLS policy
      // (B7 in the SQL) also enforces this server-side, but we mirror it
      // here so the response shape is explicit for the React banner.
      const isFilled =
        !!data &&
        data.status === "sold" &&
        data.billing_status === "active" &&
        data.creative_approval_status === "approved";

      res.json({
        slot: isFilled ? data : null,
        status: data?.status || "vacant",
        isPlaceholder: !isFilled,
        categorySlug,
        stateCode,
      });
    } catch (err: any) {
      console.error(`[ECSS] /api/elite-sponsor exception: ${err.message}`);
      res
        .status(200)
        .json({
          slot: null,
          status: "vacant",
          isPlaceholder: true,
          error: "lookup_failed",
        });
    }
  });

  // -------- admin: list all slots (full inventory grid) --------
  app.get(
    "/api/admin/elite-sponsor-slots",
    requireAdmin,
    async (_req, res) => {
      try {
        const { data, error } = await supabaseAdmin
          .from("elite_sponsor_slots")
          .select("*")
          .order("state_code", { ascending: true })
          .order("category_slug", { ascending: true });

        if (error) throw error;
        res.json({ slots: data || [] });
      } catch (err: any) {
        console.error(`[ECSS] admin list error: ${err.message}`);
        res
          .status(500)
          .json({ error: "Failed to load slots", detail: err.message });
      }
    }
  );

  // -------- admin: create a new slot --------
  app.post(
    "/api/admin/elite-sponsor-slots",
    requireAdmin,
    async (req, res) => {
      try {
        const {
          category_slug,
          state_code,
          monthly_price_cents,
          lead_price_cents,
        } = req.body || {};

        if (!isValidCategorySlug(category_slug)) {
          return res.status(400).json({ error: "Invalid category_slug" });
        }
        if (!isValidStateCode(state_code)) {
          return res.status(400).json({ error: "Invalid state_code" });
        }

        const { data, error } = await supabaseAdmin
          .from("elite_sponsor_slots")
          .insert({
            category_slug,
            state_code: String(state_code).toUpperCase(),
            status: "vacant",
            billing_status: "unpaid",
            monthly_price_cents:
              Number.isFinite(monthly_price_cents) && monthly_price_cents > 0
                ? Math.round(monthly_price_cents)
                : getDefaultEcssPriceCents(state_code),
            lead_price_cents:
              Number.isFinite(lead_price_cents) && lead_price_cents > 0
                ? Math.round(lead_price_cents)
                : 4999,
          })
          .select()
          .single();

        if (error) {
          if (String(error.message).includes("duplicate") || error.code === "23505") {
            return res.status(409).json({
              error: "A slot already exists for this state × category",
            });
          }
          throw error;
        }
        res.json({ slot: data });
      } catch (err: any) {
        console.error(`[ECSS] admin create error: ${err.message}`);
        res
          .status(500)
          .json({ error: "Failed to create slot", detail: err.message });
      }
    }
  );

  // -------- admin: update a slot --------
  app.patch(
    "/api/admin/elite-sponsor-slots/:id",
    requireAdmin,
    async (req, res) => {
      try {
        const id = String(req.params.id || "").trim();
        if (!id) return res.status(400).json({ error: "Missing id" });

        const allowed: (keyof EliteSponsorSlot)[] = [
          "status",
          "monthly_price_cents",
          "lead_price_cents",
          "sponsor_name",
          "sponsor_logo_url",
          "sponsor_short_description",
          "sponsor_cta_text",
          "sponsor_lead_email",
          "sponsor_phone",
          "sponsor_website_url",
          "billing_status",
          "current_period_start",
          "current_period_end",
          "stripe_customer_id",
          "stripe_subscription_id",
          "notes_internal",
          // Phase B
          "subcategory_slug",
          "creative_approval_status",
          "creative_rejection_reason",
          "sponsor_partner_application_id",
          "sponsor_partner_organization_id",
          "attributed_ambassador_id",
          "attributed_session_id",
        ];

        const STATUS_VALUES = ["vacant", "sold", "paused"] as const;
        const BILLING_VALUES = [
          "unpaid",
          "active",
          "past_due",
          "cancelled",
        ] as const;
        const APPROVAL_VALUES = ["pending", "approved", "rejected"] as const;
        const STRING_FIELDS = new Set([
          "sponsor_name",
          "sponsor_logo_url",
          "sponsor_short_description",
          "sponsor_cta_text",
          "sponsor_lead_email",
          "sponsor_phone",
          "sponsor_website_url",
          "stripe_customer_id",
          "stripe_subscription_id",
          "notes_internal",
          "current_period_start",
          "current_period_end",
          "subcategory_slug",
          "creative_rejection_reason",
          "sponsor_partner_application_id",
          "sponsor_partner_organization_id",
          "attributed_ambassador_id",
          "attributed_session_id",
        ]);
        const INT_FIELDS = new Set([
          "monthly_price_cents",
          "lead_price_cents",
        ]);

        const patch: Record<string, any> = {};
        const validationErrors: string[] = [];

        for (const k of allowed) {
          if (!(k in (req.body || {}))) continue;
          const v = req.body[k];

          if (k === "status") {
            if (!STATUS_VALUES.includes(v)) {
              validationErrors.push(
                `status must be one of ${STATUS_VALUES.join(", ")}`
              );
              continue;
            }
            patch[k] = v;
          } else if (k === "billing_status") {
            if (!BILLING_VALUES.includes(v)) {
              validationErrors.push(
                `billing_status must be one of ${BILLING_VALUES.join(", ")}`
              );
              continue;
            }
            patch[k] = v;
          } else if (k === "creative_approval_status") {
            if (!APPROVAL_VALUES.includes(v)) {
              validationErrors.push(
                `creative_approval_status must be one of ${APPROVAL_VALUES.join(", ")}`
              );
              continue;
            }
            patch[k] = v;
          } else if (INT_FIELDS.has(k)) {
            const n = typeof v === "number" ? v : parseInt(String(v), 10);
            if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
              validationErrors.push(`${k} must be a non-negative integer`);
              continue;
            }
            patch[k] = n;
          } else if (STRING_FIELDS.has(k)) {
            if (v === null || v === "") {
              patch[k] = null;
            } else if (typeof v === "string") {
              patch[k] = v.length > 2000 ? v.slice(0, 2000) : v;
            } else {
              validationErrors.push(`${k} must be a string or null`);
            }
          }
        }

        if (validationErrors.length > 0) {
          return res
            .status(400)
            .json({ error: "Validation failed", details: validationErrors });
        }

        // Sanity: status transitions also bump audit timestamps
        if (patch.status === "sold" && req.body.sold_at !== false) {
          patch.sold_at = patch.sold_at || new Date().toISOString();
        }
        if (patch.status === "vacant" && req.body.unsold_at !== false) {
          patch.unsold_at = patch.unsold_at || new Date().toISOString();
        }

        if (Object.keys(patch).length === 0) {
          return res.status(400).json({ error: "Nothing to update" });
        }

        const { data, error } = await supabaseAdmin
          .from("elite_sponsor_slots")
          .update(patch)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        // After any admin update that could affect the public-facing
        // visibility (status / billing_status / creative_approval_status /
        // sponsor identity), reconcile the trusted-services tile link AND
        // the partner_organizations.auto_bill_on_accept flag. Both helpers
        // are idempotent and best-effort — never throw back to the admin.
        try {
          await reconcileEliteSponsorSideEffects(data as EliteSponsorSlot);
        } catch (sideErr: any) {
          console.error(
            `[ECSS] reconcile side-effects failed for slot ${id}: ${sideErr.message}`
          );
        }

        res.json({ slot: data });
      } catch (err: any) {
        console.error(`[ECSS] admin update error: ${err.message}`);
        res
          .status(500)
          .json({ error: "Failed to update slot", detail: err.message });
      }
    }
  );

  // ---------------------------------------------------------------
  // Phase B routes — availability, public lead capture, waitlist,
  // admin checkout, admin lead/waitlist lists.
  // ---------------------------------------------------------------
  registerEliteSponsorPhaseBRoutes(app, requireAdmin);

  // -------- admin: bulk-seed vacant inventory across launched states --------
  app.post(
    "/api/admin/elite-sponsor-slots/seed-vacant",
    requireAdmin,
    async (req, res) => {
      try {
        const stateCodes: string[] = Array.isArray(req.body?.stateCodes)
          ? req.body.stateCodes.map((s: string) => String(s).toUpperCase())
          : [];
        if (stateCodes.length === 0) {
          return res
            .status(400)
            .json({ error: "stateCodes array is required" });
        }
        const validStates = stateCodes.filter((s) => isValidStateCode(s));
        if (validStates.length === 0) {
          return res.status(400).json({ error: "No valid state codes" });
        }

        const rows: any[] = [];
        for (const state of validStates) {
          const tierCents = getDefaultEcssPriceCents(state);
          for (const cat of ECSS_CATEGORIES) {
            rows.push({
              category_slug: cat.slug,
              state_code: state,
              status: "vacant",
              billing_status: "unpaid",
              monthly_price_cents: tierCents,
              lead_price_cents: 4999,
            });
          }
        }

        // Upsert with ignore-on-conflict so re-running never duplicates
        const { data, error } = await supabaseAdmin
          .from("elite_sponsor_slots")
          .upsert(rows, {
            onConflict: "category_slug,state_code",
            ignoreDuplicates: true,
          })
          .select("id");

        if (error) throw error;

        // Final count
        const { count } = await supabaseAdmin
          .from("elite_sponsor_slots")
          .select("id", { count: "exact", head: true });

        res.json({
          requested: rows.length,
          inserted: data?.length || 0,
          totalSlots: count || 0,
          states: validStates,
          categories: ECSS_CATEGORIES.map((c) => c.slug),
        });
      } catch (err: any) {
        console.error(`[ECSS] seed error: ${err.message}`);
        res
          .status(500)
          .json({ error: "Failed to seed slots", detail: err.message });
      }
    }
  );
}

// ════════════════════════════════════════════════════════════════════
// ECSS Phase B — Helpers, Stripe checkout, webhook handlers, routes.
// All of the below is appended to keep Phase A surface intact above.
// ════════════════════════════════════════════════════════════════════

const ECSS_GRACE_DAYS = 7;

// Lazy Stripe import to avoid coupling startup to STRIPE_SECRET_KEY
async function getStripe(): Promise<Stripe | null> {
  const mod = await import("./stripe-service");
  return mod.stripe;
}

function appOrigin(): string {
  return (
    process.env.APP_URL ||
    `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "veterancare.com"}`
  );
}

async function refreshSlot(slotId: string): Promise<EliteSponsorSlot | null> {
  const { data } = await supabaseAdmin
    .from("elite_sponsor_slots")
    .select("*")
    .eq("id", slotId)
    .maybeSingle();
  return (data as EliteSponsorSlot | null) || null;
}

// ────────────────────────────────────────────────────────────────────
// T008 — Trusted-services tile auto-link
//
// On slot activation (sold + active billing + approved creative + has
// sponsor_partner_organization_id), upsert a trusted_services row keyed
// on (sponsor_partner_organization_id, category_id, state) tagged with
// elite_sponsor_slot_id so it sorts to the top.
//
// On any state change away from active, demote the linked tile back to
// non-featured (keeps the tile alive but loses top slot).
// ────────────────────────────────────────────────────────────────────
export async function linkEliteSponsorTrustedTile(
  slot: EliteSponsorSlot
): Promise<void> {
  if (!slot.sponsor_partner_organization_id) {
    console.log(
      `[ECSS] linkTrustedTile skipped: slot ${slot.id} has no partner_organization_id`
    );
    return;
  }
  if (
    slot.status !== "sold" ||
    slot.billing_status !== "active" ||
    slot.creative_approval_status !== "approved"
  ) {
    return;
  }

  // Resolve trusted_service_categories.id from the slot's category_slug.
  // Phase A categories map directly: legal-services, mortgage-lending,
  // real-estate. Insurance also added in Phase B.
  const { data: catRow } = await supabaseAdmin
    .from("trusted_service_categories")
    .select("id")
    .eq("slug", slot.category_slug)
    .maybeSingle();

  if (!catRow) {
    console.warn(
      `[ECSS] linkTrustedTile: no trusted_service_categories row for slug=${slot.category_slug}`
    );
    return;
  }
  const categoryId = catRow.id;

  // Idempotent: SELECT existing tile flagged with this slot id, otherwise
  // SELECT existing tile by partner_org+cat+state, otherwise INSERT.
  const { data: existing } = await supabaseAdmin
    .from("trusted_services")
    .select("id, is_featured, is_active")
    .eq("elite_sponsor_slot_id", slot.id)
    .maybeSingle();

  const fields: Record<string, any> = {
    name: slot.sponsor_name || "Elite Sponsor",
    short_description: slot.sponsor_short_description || null,
    website_url: slot.sponsor_website_url || null,
    phone: slot.sponsor_phone || null,
    email: slot.sponsor_lead_email || null,
    state: slot.state_code,
    logo_url: slot.sponsor_logo_url || null,
    cta_text: slot.sponsor_cta_text || null,
    is_active: true,
    is_featured: true,
    elite_sponsor_slot_id: slot.id,
    notes_internal: `[ECSS-LINKED] Auto-managed via elite_sponsor_slots.${slot.id}`,
  };

  if (existing) {
    const { error } = await supabaseAdmin
      .from("trusted_services")
      .update(fields)
      .eq("id", existing.id);
    if (error) {
      console.error(
        `[ECSS] linkTrustedTile UPDATE failed for slot ${slot.id}: ${error.message}`
      );
    } else {
      console.log(
        `[ECSS] linkTrustedTile: refreshed trusted_services row ${existing.id} for slot ${slot.id}`
      );
    }
    return;
  }

  // INSERT path — also need category_id and verification_status
  const { data: inserted, error } = await supabaseAdmin
    .from("trusted_services")
    .insert({
      ...fields,
      category_id: categoryId,
      verification_status: "verified",
    })
    .select("id")
    .single();
  if (error) {
    console.error(
      `[ECSS] linkTrustedTile INSERT failed for slot ${slot.id}: ${error.message}`
    );
  } else {
    console.log(
      `[ECSS] linkTrustedTile: created trusted_services row ${inserted?.id} for slot ${slot.id}`
    );
  }
}

// ────────────────────────────────────────────────────────────────────
// ECSS bundling — claim a pre-staged slot when a partner subscription
// containing the ECSS line item activates. Idempotent.
//
// Called from stripe-service.ts handleCheckoutCompleted /
// handleSubscriptionSync when the partner subscription's items contain
// STRIPE_ECSS_PRICE_ID.
// ────────────────────────────────────────────────────────────────────
export async function claimEcssSlotForBundledPartner(opts: {
  slotId: string;
  partnerApplicationId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string;
  partnerOrganizationId: string | null;
  convertedProviderId: string | null;
}): Promise<void> {
  try {
    const slot = await refreshSlot(opts.slotId);
    if (!slot) {
      console.warn(`[ECSS-BUNDLE] slot ${opts.slotId} not found`);
      return;
    }

    // Ownership integrity: if slot is already sold to a DIFFERENT partner
    // application, refuse the update. Stale subscription replays must never
    // overwrite an active sponsor's slot ownership.
    if (
      slot.status === "sold" &&
      slot.sponsor_partner_application_id &&
      slot.sponsor_partner_application_id !== opts.partnerApplicationId
    ) {
      console.warn(
        `[ECSS-BUNDLE] slot ${opts.slotId} owned by partner_app=${slot.sponsor_partner_application_id}; refusing claim by ${opts.partnerApplicationId}`
      );
      return;
    }
    if (slot.status === "sold" && slot.billing_status === "active") {
      console.log(`[ECSS-BUNDLE] slot ${opts.slotId} already sold to same partner — refresh only`);
    }

    const updates: Record<string, any> = {
      status: "sold",
      billing_status: "active",
      stripe_customer_id: opts.stripeCustomerId,
      stripe_subscription_id: opts.stripeSubscriptionId,
      sold_at: slot.sold_at || new Date().toISOString(),
      unsold_at: null,
      sponsor_partner_application_id: opts.partnerApplicationId,
    };
    if (opts.partnerOrganizationId) {
      updates.sponsor_partner_organization_id = opts.partnerOrganizationId;
    }

    const { error: upErr } = await supabaseAdmin
      .from("elite_sponsor_slots")
      .update(updates)
      .eq("id", opts.slotId);
    if (upErr) {
      console.error(`[ECSS-BUNDLE] slot ${opts.slotId} sold-flip failed: ${upErr.message}`);
      return;
    }
    console.log(
      `[ECSS-BUNDLE] slot ${opts.slotId} flipped to SOLD (bundled partner=${opts.partnerApplicationId}, sub=${opts.stripeSubscriptionId})`
    );

    // Auto-approve creative for bundled partner — they captured logo +
    // description at signup, no separate admin review needed (founder
    // can still demote via admin UI if creative is off-brand).
    await supabaseAdmin
      .from("elite_sponsor_slots")
      .update({ creative_approval_status: "approved" })
      .eq("id", opts.slotId)
      .eq("creative_approval_status", "pending");

    // Propagate logo/description into trusted_services tile.
    const refreshed = await refreshSlot(opts.slotId);
    if (refreshed) {
      await linkEliteSponsorTrustedTile(refreshed);
    }
  } catch (err: any) {
    console.error(`[ECSS-BUNDLE] claim error for slot ${opts.slotId}:`, err.message);
  }
}

export async function unlinkEliteSponsorTrustedTile(
  slotId: string
): Promise<void> {
  // Demote — never delete. Keep the tile so historical context remains.
  const { error } = await supabaseAdmin
    .from("trusted_services")
    .update({ is_featured: false })
    .eq("elite_sponsor_slot_id", slotId);
  if (error) {
    console.error(
      `[ECSS] unlinkTrustedTile failed for slot ${slotId}: ${error.message}`
    );
  } else {
    console.log(`[ECSS] unlinkTrustedTile: demoted tile for slot ${slotId}`);
  }
}

// ────────────────────────────────────────────────────────────────────
// T007 — partner_organizations.auto_bill_on_accept toggle
// Mirrors slot active state onto the partner organization (if any).
// ────────────────────────────────────────────────────────────────────
async function setPartnerOrgAutoBillFromSlot(
  slot: EliteSponsorSlot,
  enabled: boolean
): Promise<void> {
  if (!slot.sponsor_partner_organization_id) return;
  try {
    const { error } = await supabaseAdmin
      .from("partner_organizations")
      .update({ auto_bill_on_accept: enabled })
      .eq("id", slot.sponsor_partner_organization_id);
    if (error) {
      console.warn(
        `[ECSS] setPartnerOrgAutoBill ${enabled} failed for org ${slot.sponsor_partner_organization_id}: ${error.message}`
      );
    } else {
      console.log(
        `[ECSS] partner_organizations.auto_bill_on_accept=${enabled} for org ${slot.sponsor_partner_organization_id} (slot ${slot.id})`
      );
    }
  } catch (err: any) {
    console.warn(`[ECSS] setPartnerOrgAutoBill exception: ${err.message}`);
  }
}

// Reconcile both side-effects in one place.
export async function reconcileEliteSponsorSideEffects(
  slot: EliteSponsorSlot
): Promise<void> {
  const isLive =
    slot.status === "sold" &&
    slot.billing_status === "active" &&
    slot.creative_approval_status === "approved";
  if (isLive) {
    await linkEliteSponsorTrustedTile(slot);
    await setPartnerOrgAutoBillFromSlot(slot, true);
  } else {
    await unlinkEliteSponsorTrustedTile(slot.id);
    await setPartnerOrgAutoBillFromSlot(slot, false);
  }
}

// ────────────────────────────────────────────────────────────────────
// Phase B — Stripe checkout
//
// Creates a Stripe checkout session in subscription mode using inline
// price_data so per-slot admin overrides work without pre-creating
// Stripe Price objects. Metadata kind="ecss_slot" so the webhook
// router in stripe-service.ts dispatches to handleEcssCheckout*.
// ────────────────────────────────────────────────────────────────────
export interface CreateEliteSponsorCheckoutOpts {
  slotId: string;
  customerEmail: string;
  sponsorName?: string | null;
  sponsorLogoUrl?: string | null;
  sponsorShortDescription?: string | null;
  sponsorCtaText?: string | null;
  sponsorLeadEmail: string;
  sponsorPhone?: string | null;
  sponsorWebsiteUrl?: string | null;
  partnerApplicationId?: string | null;
  partnerOrganizationId?: string | null;
  attributedSessionId?: string | null;
  attributedAmbassadorCode?: string | null;
  attributedUtmId?: string | null;
}

export async function createEliteSponsorCheckoutSession(
  opts: CreateEliteSponsorCheckoutOpts
): Promise<{ url: string; sessionId: string }> {
  const stripe = await getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const slot = await refreshSlot(opts.slotId);
  if (!slot) throw new Error("Slot not found");
  if (slot.status === "sold" && slot.billing_status === "active") {
    throw new Error("Slot is already sold");
  }
  if (!opts.customerEmail || !opts.sponsorLeadEmail) {
    throw new Error("customerEmail and sponsorLeadEmail are required");
  }

  const cat = getEcssCategoryBySlug(slot.category_slug);
  const productName = `Elite Sponsor — ${cat?.label || slot.category_slug} · ${slot.state_code}${slot.subcategory_slug ? ` · ${slot.subcategory_slug}` : ""}`;

  // Pre-stage the slot with the captured sponsor identity (status remains
  // vacant until checkout.session.completed flips it sold). This means the
  // admin can see "purchase in flight" details even before Stripe confirms.
  const stagedFields: Record<string, any> = {
    sponsor_name: opts.sponsorName ?? null,
    sponsor_logo_url: opts.sponsorLogoUrl ?? null,
    sponsor_short_description: opts.sponsorShortDescription ?? null,
    sponsor_cta_text: opts.sponsorCtaText ?? null,
    sponsor_lead_email: opts.sponsorLeadEmail,
    sponsor_phone: opts.sponsorPhone ?? null,
    sponsor_website_url: opts.sponsorWebsiteUrl ?? null,
    sponsor_partner_application_id: opts.partnerApplicationId ?? null,
    sponsor_partner_organization_id: opts.partnerOrganizationId ?? null,
    attributed_session_id: opts.attributedSessionId ?? null,
    creative_approval_status: "pending",
  };
  await supabaseAdmin
    .from("elite_sponsor_slots")
    .update(stagedFields)
    .eq("id", slot.id);

  // Use canonical STRIPE_ECSS_PRICE_ID when slot price matches the standard
  // (so all ECSS revenue rolls up under one Price product in Stripe reports).
  // For per-slot custom admin pricing, fall back to dynamic price_data.
  const ECSS_PRICE_ID = process.env.STRIPE_ECSS_PRICE_ID || null;
  const CANONICAL_ECSS_CENTS = 49900;
  const useCanonicalPriceId = ECSS_PRICE_ID && slot.monthly_price_cents === CANONICAL_ECSS_CENTS;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = useCanonicalPriceId
    ? [{ price: ECSS_PRICE_ID, quantity: 1 }]
    : [
        {
          price_data: {
            currency: "usd",
            unit_amount: slot.monthly_price_cents,
            recurring: { interval: "month" },
            product_data: {
              name: productName,
              description: slot.sponsor_short_description || `Single-occupancy premium banner above ${cat?.label || slot.category_slug} listings in ${slot.state_code}.`,
            },
          },
          quantity: 1,
        },
      ];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: opts.customerEmail,
    line_items: lineItems,
    success_url: `${appOrigin()}/admin/elite-sponsors?ecss_checkout=success&slot=${slot.id}`,
    cancel_url: `${appOrigin()}/admin/elite-sponsors?ecss_checkout=cancelled&slot=${slot.id}`,
    metadata: {
      kind: "ecss_slot",
      slot_id: slot.id,
      category_slug: slot.category_slug,
      state_code: slot.state_code,
      subcategory_slug: slot.subcategory_slug || "",
      partner_application_id: opts.partnerApplicationId || "",
      partner_organization_id: opts.partnerOrganizationId || "",
      attributed_session_id: opts.attributedSessionId || "",
      attributed_ambassador_code: opts.attributedAmbassadorCode || "",
      attributed_utm_id: opts.attributedUtmId || "",
      sponsor_name: (opts.sponsorName || "").slice(0, 200),
      platform: platform.name,
    },
    subscription_data: {
      metadata: {
        kind: "ecss_slot",
        slot_id: slot.id,
        category_slug: slot.category_slug,
        state_code: slot.state_code,
        subcategory_slug: slot.subcategory_slug || "",
        partner_application_id: opts.partnerApplicationId || "",
        partner_organization_id: opts.partnerOrganizationId || "",
        attributed_session_id: opts.attributedSessionId || "",
        attributed_ambassador_code: opts.attributedAmbassadorCode || "",
        attributed_utm_id: opts.attributedUtmId || "",
      },
    },
  });

  console.log(
    `[ECSS] checkout session created: slot=${slot.id}, session=${session.id}`
  );
  return { url: session.url!, sessionId: session.id };
}

// ────────────────────────────────────────────────────────────────────
// Stripe webhook handlers — called from stripe-service.ts router when
// the event metadata.kind === "ecss_slot". All are idempotent.
// ────────────────────────────────────────────────────────────────────
export async function handleEcssCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const slotId = session.metadata?.slot_id;
  if (!slotId) {
    console.log("[ECSS] checkout.session.completed missing slot_id");
    return;
  }
  if (session.payment_status !== "paid") {
    console.log(
      `[ECSS] checkout slot ${slotId} payment_status=${session.payment_status} — skipping`
    );
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : (session.subscription as any)?.id || null;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : (session.customer as any)?.id || null;

  const now = new Date().toISOString();

  // Resolve ambassador attribution from metadata. We use the same
  // (utm_content || utm_id) → ambassadors/ambassador_links lookup that
  // partner attribution uses, so commissions stay consistent.
  let attributedAmbassadorId: string | null = null;
  const ambCode = session.metadata?.attributed_ambassador_code || "";
  const utmId = session.metadata?.attributed_utm_id || "";
  try {
    if (ambCode) {
      const r = await pgQuery(
        `SELECT id FROM ambassadors WHERE code = $1 LIMIT 1`,
        [ambCode]
      );
      if (r.length > 0) attributedAmbassadorId = r[0].id;
    }
    if (!attributedAmbassadorId && utmId) {
      const r = await pgQuery(
        `SELECT ambassador_id FROM ambassador_links WHERE utm_id = $1 AND ambassador_id IS NOT NULL LIMIT 1`,
        [utmId]
      );
      if (r.length > 0) attributedAmbassadorId = r[0].ambassador_id;
    }
  } catch (err: any) {
    console.warn(`[ECSS] ambassador lookup failed: ${err.message}`);
  }

  const updates: Record<string, any> = {
    status: "sold",
    billing_status: "active",
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    sold_at: now,
    unsold_at: null,
  };
  if (attributedAmbassadorId) {
    updates.attributed_ambassador_id = attributedAmbassadorId;
  }

  const { error: upErr } = await supabaseAdmin
    .from("elite_sponsor_slots")
    .update(updates)
    .eq("id", slotId);
  if (upErr) {
    console.error(`[ECSS] slot ${slotId} sold-flip failed: ${upErr.message}`);
    return;
  }
  console.log(
    `[ECSS] slot ${slotId} flipped to SOLD via checkout ${session.id}, sub=${subscriptionId}, ambassador=${attributedAmbassadorId || "none"}`
  );

  // Reconcile side-effects (trusted-services tile + auto_bill_on_accept).
  // Note: the tile won't link until creative_approval_status="approved",
  // which gates on admin review. This call sets up auto_bill if a
  // partner_organization is linked.
  const refreshed = await refreshSlot(slotId);
  if (refreshed) await reconcileEliteSponsorSideEffects(refreshed);

  // Audit log entry
  try {
    await supabaseAdmin.from("monetization_audit_log").insert({
      event: "ecss_slot_sold",
      details: {
        slot_id: slotId,
        stripe_session_id: session.id,
        stripe_subscription_id: subscriptionId,
        amount_cents: session.amount_total,
        ambassador_id: attributedAmbassadorId,
      },
    });
  } catch {}
}

export async function handleEcssSubscriptionSync(
  sub: Stripe.Subscription
): Promise<void> {
  const slotId = sub.metadata?.slot_id;
  if (!slotId) return;

  const STATUS_MAP: Record<string, "active" | "past_due" | "cancelled"> = {
    active: "active",
    trialing: "active",
    past_due: "past_due",
    unpaid: "past_due",
    canceled: "cancelled",
    incomplete: "past_due",
    incomplete_expired: "cancelled",
  };
  const billing = STATUS_MAP[sub.status] || "past_due";

  const periodStart = sub.current_period_start
    ? new Date(sub.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;

  await supabaseAdmin
    .from("elite_sponsor_slots")
    .update({
      billing_status: billing,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      stripe_subscription_id: sub.id,
    })
    .eq("id", slotId);

  console.log(
    `[ECSS] slot ${slotId} subscription sync: status=${sub.status} → billing=${billing}, period_end=${periodEnd}`
  );

  const refreshed = await refreshSlot(slotId);
  if (refreshed) await reconcileEliteSponsorSideEffects(refreshed);
}

export async function handleEcssSubscriptionCanceled(
  sub: Stripe.Subscription
): Promise<void> {
  const slotId = sub.metadata?.slot_id;
  if (!slotId) return;

  // Mark cancelled immediately. Slot returns to vacant after grace.
  await supabaseAdmin
    .from("elite_sponsor_slots")
    .update({
      billing_status: "cancelled",
      status: "vacant",
      unsold_at: new Date().toISOString(),
    })
    .eq("id", slotId);

  console.log(`[ECSS] slot ${slotId} subscription cancelled — slot vacated`);

  const refreshed = await refreshSlot(slotId);
  if (refreshed) await reconcileEliteSponsorSideEffects(refreshed);
}

export async function handleEcssInvoicePaid(
  invoice: Stripe.Invoice
): Promise<void> {
  // The slot subscription metadata also lives on the invoice via the
  // subscription_details. Resolve the slot via subscription_id.
  const subId =
    typeof (invoice as any).subscription === "string"
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id || null;
  if (!subId) return;

  const { data: slot } = await supabaseAdmin
    .from("elite_sponsor_slots")
    .select("*")
    .eq("stripe_subscription_id", subId)
    .maybeSingle();
  if (!slot) return;

  const ecssSlot = slot as EliteSponsorSlot;
  const revenueAmount = invoice.amount_paid ? invoice.amount_paid / 100 : 0;

  // Ambassador commission (mirrors the partner-application path in
  // stripe-service.ts handleCheckoutCompleted lines 616-639).
  if (ecssSlot.attributed_ambassador_id && revenueAmount > 0) {
    try {
      let commissionPct = 10.0;
      const rateRows = await pgQuery(
        `SELECT code, commission_rate FROM ambassadors WHERE id = $1`,
        [ecssSlot.attributed_ambassador_id]
      );
      let ambassadorCode = "";
      if (rateRows.length > 0) {
        ambassadorCode = rateRows[0].code || "";
        if (rateRows[0].commission_rate != null) {
          commissionPct = parseFloat(rateRows[0].commission_rate);
        }
      }
      const commissionAmt = Math.round(revenueAmount * commissionPct) / 100;
      await pgQuery(
        `INSERT INTO commissions (ambassador_code, application_id, revenue_amount, commission_percentage, commission_amount, status, ambassador_id)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6)`,
        [
          ambassadorCode,
          ecssSlot.sponsor_partner_application_id || null,
          revenueAmount,
          commissionPct,
          commissionAmt,
          ecssSlot.attributed_ambassador_id,
        ]
      );
      console.log(
        `[ECSS] invoice.paid: commission $${commissionAmt} for ambassador ${ambassadorCode} on slot ${ecssSlot.id}`
      );
    } catch (err: any) {
      console.warn(`[ECSS] commission insert failed: ${err.message}`);
    }
  }

  // Audit log
  try {
    await supabaseAdmin.from("monetization_audit_log").insert({
      event: "ecss_invoice_paid",
      details: {
        slot_id: ecssSlot.id,
        stripe_invoice_id: invoice.id,
        amount_cents: invoice.amount_paid,
      },
    });
  } catch {}
}

export async function handleEcssPaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const subId =
    typeof (invoice as any).subscription === "string"
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id || null;
  if (!subId) return;

  const { data: slot } = await supabaseAdmin
    .from("elite_sponsor_slots")
    .select("*")
    .eq("stripe_subscription_id", subId)
    .maybeSingle();
  if (!slot) return;

  await supabaseAdmin
    .from("elite_sponsor_slots")
    .update({ billing_status: "past_due" })
    .eq("id", (slot as EliteSponsorSlot).id);

  console.log(
    `[ECSS] slot ${(slot as EliteSponsorSlot).id} payment_failed — billing_status=past_due`
  );

  const refreshed = await refreshSlot((slot as EliteSponsorSlot).id);
  if (refreshed) await reconcileEliteSponsorSideEffects(refreshed);
}

// ────────────────────────────────────────────────────────────────────
// Phase B routes — called from registerEliteSponsorRoutes() above.
// ────────────────────────────────────────────────────────────────────
function registerEliteSponsorPhaseBRoutes(
  app: Express,
  requireAdmin: (req: Request, res: Response, next: NextFunction) => void
): void {
  // -------- public: availability lookup for /partner-apply upsell --------
  app.get("/api/elite-sponsor/available", async (req, res) => {
    try {
      const categorySlug = String(req.query.categorySlug || "").trim();
      const stateCode = String(req.query.state || "").trim().toUpperCase();
      const subcategory = String(req.query.subcategory || "").trim() || null;

      if (!isValidCategorySlug(categorySlug)) {
        return res.status(400).json({ error: "Invalid categorySlug" });
      }
      if (!isValidStateCode(stateCode)) {
        return res.status(400).json({ error: "Invalid state" });
      }

      let q = supabaseAdmin
        .from("elite_sponsor_slots")
        .select(
          "id, status, billing_status, monthly_price_cents, lead_price_cents"
        )
        .eq("category_slug", categorySlug)
        .eq("state_code", stateCode);
      q = subcategory
        ? q.eq("subcategory_slug", subcategory)
        : q.is("subcategory_slug", null);
      const { data: slot } = await q.maybeSingle();

      if (!slot) {
        // No slot row = vacancy is implicit (will be seeded on demand).
        // Use the state-tier default so the UI quotes the correct number
        // before an admin pre-stages the row.
        return res.json({
          available: true,
          soldOut: false,
          slot: {
            monthly_price_cents: getDefaultEcssPriceCents(stateCode),
            lead_price_cents: 4999,
          },
        });
      }
      const isSold =
        slot.status === "sold" && slot.billing_status === "active";
      return res.json({
        available: !isSold,
        soldOut: isSold,
        slot: {
          slot_id: slot.id,
          monthly_price_cents: slot.monthly_price_cents,
          lead_price_cents: slot.lead_price_cents,
        },
      });
    } catch (err: any) {
      console.error(`[ECSS] /available error: ${err.message}`);
      res.status(500).json({ error: "lookup_failed" });
    }
  });

  // -------- admin: create a Stripe checkout session for a slot --------
  app.post(
    "/api/admin/elite-sponsor/checkout",
    requireAdmin,
    async (req, res) => {
      try {
        const b = req.body || {};
        if (!b.slotId || typeof b.slotId !== "string") {
          return res.status(400).json({ error: "slotId required" });
        }
        if (!b.customerEmail || !b.sponsorLeadEmail) {
          return res
            .status(400)
            .json({ error: "customerEmail and sponsorLeadEmail required" });
        }
        const r = await createEliteSponsorCheckoutSession({
          slotId: b.slotId,
          customerEmail: String(b.customerEmail),
          sponsorName: b.sponsorName ?? null,
          sponsorLogoUrl: b.sponsorLogoUrl ?? null,
          sponsorShortDescription: b.sponsorShortDescription ?? null,
          sponsorCtaText: b.sponsorCtaText ?? null,
          sponsorLeadEmail: String(b.sponsorLeadEmail),
          sponsorPhone: b.sponsorPhone ?? null,
          sponsorWebsiteUrl: b.sponsorWebsiteUrl ?? null,
          partnerApplicationId: b.partnerApplicationId ?? null,
          partnerOrganizationId: b.partnerOrganizationId ?? null,
          attributedSessionId: b.attributedSessionId ?? null,
          attributedAmbassadorCode: b.attributedAmbassadorCode ?? null,
          attributedUtmId: b.attributedUtmId ?? null,
        });
        res.json(r);
      } catch (err: any) {
        console.error(`[ECSS] admin checkout error: ${err.message}`);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // -------- public: capture a veteran lead from a sold sponsor card --------
  app.post("/api/elite-sponsor/leads", async (req, res) => {
    try {
      const b = req.body || {};
      const slotId = String(b.slot_id || "").trim();
      const name = String(b.name || "").trim().slice(0, 200);
      const email = String(b.email || "").trim().slice(0, 200);
      const phone = String(b.phone || "").trim().slice(0, 60);
      const message = String(b.message || "").trim().slice(0, 2000);

      if (!slotId || !name || (!email && !phone)) {
        return res
          .status(400)
          .json({ error: "slot_id, name, and email or phone are required" });
      }

      const { data: slot } = await supabaseAdmin
        .from("elite_sponsor_slots")
        .select("*")
        .eq("id", slotId)
        .maybeSingle();
      if (
        !slot ||
        slot.status !== "sold" ||
        slot.billing_status !== "active" ||
        slot.creative_approval_status !== "approved"
      ) {
        return res.status(404).json({ error: "Sponsor not active" });
      }
      const ecssSlot = slot as EliteSponsorSlot;

      // Insert linked navigator_request first so we can FK from
      // elite_sponsor_leads.navigator_request_id. The lead-router /
      // notification pipeline already handles navigator_requests.
      const { data: navReq, error: navErr } = await supabaseAdmin
        .from("navigator_requests")
        .insert({
          veteran_name: name,
          email: email || null,
          phone: phone || null,
          category: ecssSlot.category_slug,
          user_state: ecssSlot.state_code,
          notes: message || null,
          status: "new",
          response_status: "pending",
          source: "elite_sponsor",
          elite_sponsor_slot_id: ecssSlot.id,
          routed_to_partner_id: null,
        })
        .select("id")
        .single();
      if (navErr) {
        console.error(
          `[ECSS] /leads navigator_requests insert failed: ${navErr.message}`
        );
        return res.status(500).json({ error: "lead_save_failed" });
      }

      const { error: leadErr } = await supabaseAdmin
        .from("elite_sponsor_leads")
        .insert({
          slot_id: ecssSlot.id,
          contact_name: name,
          contact_email: email || null,
          contact_phone: phone || null,
          notes: message || null,
          navigator_request_id: navReq.id,
        });
      if (leadErr) {
        console.warn(
          `[ECSS] /leads elite_sponsor_leads insert failed: ${leadErr.message}`
        );
      }

      // Best-effort sponsor email
      try {
        if (ecssSlot.sponsor_lead_email) {
          const { Resend } = await import("resend");
          if (process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
              from:
                process.env.RESEND_FROM_EMAIL ||
                `Veteran Care <noreply@veterancare.com>`,
              to: [ecssSlot.sponsor_lead_email],
              subject: `New lead via ${platform.name} Elite Sponsor`,
              html: `
                <div style="font-family:sans-serif;max-width:520px;padding:18px;">
                  <h2 style="margin:0 0 10px;color:#166534;">New veteran lead</h2>
                  <p style="margin:0 0 4px;"><strong>${name}</strong></p>
                  ${email ? `<p style="margin:0 0 4px;">Email: ${email}</p>` : ""}
                  ${phone ? `<p style="margin:0 0 4px;">Phone: ${phone}</p>` : ""}
                  ${message ? `<p style="margin:8px 0 0;">${message.replace(/</g, "&lt;").slice(0, 1500)}</p>` : ""}
                  <p style="margin:14px 0 0;font-size:12px;color:#6b7280;">Lead ID: ${navReq.id}</p>
                </div>`,
            });
          }
        }
      } catch (mailErr: any) {
        console.warn(`[ECSS] /leads sponsor email failed: ${mailErr.message}`);
      }

      console.log(
        `[ECSS] lead captured: slot=${ecssSlot.id}, navigator_request=${navReq.id}`
      );
      res.json({ ok: true, navigator_request_id: navReq.id });
    } catch (err: any) {
      console.error(`[ECSS] /leads exception: ${err.message}`);
      res.status(500).json({ error: "lead_save_failed" });
    }
  });

  // -------- public: waitlist signup --------
  app.post("/api/elite-sponsor/waitlist", async (req, res) => {
    try {
      const b = req.body || {};
      const categorySlug = String(b.categorySlug || "").trim();
      const stateCode = String(b.state || "").trim().toUpperCase();
      const subcategory = String(b.subcategory || "").trim() || null;
      const contactName = String(b.contact_name || "").trim().slice(0, 200);
      const contactEmail = String(b.contact_email || "").trim().slice(0, 200);
      const contactPhone = String(b.contact_phone || "").trim().slice(0, 60);
      const contactCompany = String(b.contact_company || "").trim().slice(0, 200);
      const notes = String(b.notes || "").trim().slice(0, 2000);

      if (!isValidCategorySlug(categorySlug)) {
        return res.status(400).json({ error: "Invalid categorySlug" });
      }
      if (!isValidStateCode(stateCode)) {
        return res.status(400).json({ error: "Invalid state" });
      }
      if (!contactEmail) {
        return res.status(400).json({ error: "contact_email required" });
      }

      const { error } = await supabaseAdmin.from("elite_sponsor_waitlist").insert({
        category_slug: categorySlug,
        state_code: stateCode,
        subcategory_slug: subcategory,
        contact_name: contactName || null,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        contact_company: contactCompany || null,
        notes: notes || null,
        utm_source: b.utm_source || null,
        utm_medium: b.utm_medium || null,
        utm_campaign: b.utm_campaign || null,
        utm_content: b.utm_content || null,
        attributed_session_id: b.session_id || null,
      });
      if (error) {
        console.error(`[ECSS] /waitlist insert failed: ${error.message}`);
        return res.status(500).json({ error: "waitlist_save_failed" });
      }

      console.log(
        `[ECSS] waitlist signup: ${contactEmail} for ${categorySlug}/${stateCode}${subcategory ? "/" + subcategory : ""}`
      );
      res.json({ ok: true });
    } catch (err: any) {
      console.error(`[ECSS] /waitlist exception: ${err.message}`);
      res.status(500).json({ error: "waitlist_save_failed" });
    }
  });

  // -------- admin: list leads --------
  app.get(
    "/api/admin/elite-sponsor-leads",
    requireAdmin,
    async (_req, res) => {
      try {
        const { data, error } = await supabaseAdmin
          .from("elite_sponsor_leads")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);
        if (error) throw error;
        res.json({ leads: data || [] });
      } catch (err: any) {
        console.error(`[ECSS] admin leads error: ${err.message}`);
        res.status(500).json({ error: err.message });
      }
    }
  );

  // -------- admin: list waitlist --------
  app.get(
    "/api/admin/elite-sponsor-waitlist",
    requireAdmin,
    async (_req, res) => {
      try {
        const { data, error } = await supabaseAdmin
          .from("elite_sponsor_waitlist")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500);
        if (error) throw error;
        res.json({ waitlist: data || [] });
      } catch (err: any) {
        console.error(`[ECSS] admin waitlist error: ${err.message}`);
        res.status(500).json({ error: err.message });
      }
    }
  );
}
