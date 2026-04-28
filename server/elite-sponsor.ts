import type { Express, Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "./supabase";
import { supabaseQuery, isSupabaseDbConfigured } from "./supabase-pg-client";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------
// Elite Category Sponsor Slot (ECSS) — Phase A
//
// Single-occupancy premium banner above category listings.
// One sponsor per (state × category). Vacant = placeholder.
//
// Phase A surface:
//   GET  /api/elite-sponsor?categorySlug=&state=
//   GET  /api/elite-sponsor/categories
//   GET  /api/admin/elite-sponsor-slots                    (admin)
//   POST /api/admin/elite-sponsor-slots                    (admin)
//   PATCH /api/admin/elite-sponsor-slots/:id               (admin)
//   POST /api/admin/elite-sponsor-slots/seed-vacant        (admin)
//
// Phase B will add:
//   POST /api/elite-sponsor/lead
//   GET  /api/admin/elite-sponsor-leads
//
// Phase C will add Stripe checkout + webhook handler.
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
] as const;

export type EcssCategorySlug = (typeof ECSS_CATEGORIES)[number]["slug"];

export interface EliteSponsorSlot {
  id: string;
  category_slug: string;
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
    console.log("[ECSS] Phase A schema applied (idempotent).");
    return { ok: true };
  } catch (err: any) {
    console.error(`[ECSS] Schema apply failed: ${err.message}`);
    return { ok: false, reason: err.message };
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

      const { data, error } = await supabaseAdmin
        .from("elite_sponsor_slots")
        .select(
          "id, category_slug, state_code, status, billing_status, sponsor_name, sponsor_logo_url, sponsor_short_description, sponsor_cta_text, sponsor_phone, sponsor_website_url"
        )
        .eq("category_slug", categorySlug)
        .eq("state_code", stateCode)
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

      const isFilled =
        data && data.status === "sold" && data.billing_status === "active";

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
                : 49900,
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
        ];

        const STATUS_VALUES = ["vacant", "sold", "paused"] as const;
        const BILLING_VALUES = [
          "unpaid",
          "active",
          "past_due",
          "cancelled",
        ] as const;
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
        res.json({ slot: data });
      } catch (err: any) {
        console.error(`[ECSS] admin update error: ${err.message}`);
        res
          .status(500)
          .json({ error: "Failed to update slot", detail: err.message });
      }
    }
  );

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
          for (const cat of ECSS_CATEGORIES) {
            rows.push({
              category_slug: cat.slug,
              state_code: state,
              status: "vacant",
              billing_status: "unpaid",
              monthly_price_cents: 49900,
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
