/**
 * Founder $1 test path — admin-only, stateless.
 *
 * Three test endpoints, each gated by:
 *   1. requireAdmin middleware (existing x-admin-key header check)
 *   2. ?test=true query parameter (explicit tripwire — accidents prevented)
 *
 * No database flag, no email check, no in-memory map. Per founder
 * spec 2026-04-30: "Use ONLY: Valid admin key AND ?test=true in URL."
 *
 * Public users CANNOT reach these — the requireAdmin middleware
 * rejects every request without a valid admin key. The ?test=true
 * tripwire prevents accidents from authenticated admins.
 */
import type { Express, RequestHandler, Request, Response } from "express";
import { query as pgQuery } from "./pg-client";
import { supabaseAdmin } from "./supabase";
import { createEliteSponsorCheckoutSession } from "./elite-sponsor";
import {
  createPartnerCheckoutSession,
  chargeLeadAutomatically,
  isStripeEnabled,
} from "./stripe-service";

function requireTestQuery(req: Request, res: Response): boolean {
  if (req.query?.test !== "true") {
    res
      .status(400)
      .json({ error: "Missing ?test=true tripwire query parameter" });
    return false;
  }
  return true;
}

export function registerAdminTestCheckoutRoutes(
  app: Express,
  requireAdmin: RequestHandler,
) {
  // ── A. Standalone $1 ECSS slot checkout ─────────────────────────────
  // Founder picks an existing vacant slot (via /admin/elite-sponsors UI),
  // posts {slotId, email} here, opens returned URL → $1 Stripe checkout.
  app.post(
    "/api/admin/test-checkout/standalone-start",
    requireAdmin,
    async (req, res) => {
      try {
        if (!requireTestQuery(req, res)) return;
        if (!isStripeEnabled()) {
          return res.status(503).json({ error: "Stripe not configured" });
        }
        const { slotId, email, sponsorName } = req.body || {};
        if (!slotId || !email) {
          return res
            .status(400)
            .json({ error: "slotId and email are required" });
        }
        console.log(
          `[FOUNDER-TEST] standalone $1 checkout — slot=${slotId} email=${email}`,
        );
        const result = await createEliteSponsorCheckoutSession({
          slotId: String(slotId),
          customerEmail: String(email),
          sponsorLeadEmail: String(email),
          sponsorName: sponsorName || "TEST — Founder",
          testMode: true,
        });
        return res.json({ ok: true, ...result });
      } catch (err: any) {
        console.error(`[FOUNDER-TEST] standalone error: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // ── B. Bundled $1 base + $1 ECSS slot checkout ──────────────────────
  // Creates a [TEST]-prefixed partner_application + ECSS slot, then
  // opens the bundled checkout that mimics the real /elite-partner-apply
  // submit flow at $1+$1 so the founder can validate multi-line-item
  // Stripe checkout behavior end-to-end.
  app.post(
    "/api/admin/test-checkout/bundled-start",
    requireAdmin,
    async (req, res) => {
      try {
        if (!requireTestQuery(req, res)) return;
        if (!isStripeEnabled()) {
          return res.status(503).json({ error: "Stripe not configured" });
        }
        const {
          email,
          companyName,
          state,
          categorySlug,
          subcategorySlug,
          planType,
        } = req.body || {};
        if (!email || !state || !categorySlug || !planType) {
          return res.status(400).json({
            error: "email, state, categorySlug, planType required",
          });
        }
        const validPlanTypes = ["state", "national"];
        if (!validPlanTypes.includes(planType)) {
          return res
            .status(400)
            .json({ error: "planType must be state|national" });
        }
        const stateCode = String(state).toUpperCase().slice(0, 2);
        const catSlug = String(categorySlug).toLowerCase().slice(0, 80);
        const subSlug = subcategorySlug
          ? String(subcategorySlug).toLowerCase().slice(0, 80)
          : null;
        const safeCompany = `[TEST] ${companyName || "Founder Test " + Date.now()}`;

        // Resolve category_id from slug
        const catRows = await pgQuery(
          `SELECT id, name FROM trusted_service_categories WHERE slug = $1 LIMIT 1`,
          [catSlug],
        );
        if (catRows.length === 0) {
          return res
            .status(400)
            .json({ error: `Unknown category slug: ${catSlug}` });
        }
        const categoryId = catRows[0].id;

        // 1. Insert test partner_application
        const appRows = await pgQuery(
          `INSERT INTO partner_applications
             (company_name, contact_name, email, state, category_id, plan_type, requested_addons, pricing_interest, status, is_lead_enabled)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'both', 'prospect', false)
           RETURNING id`,
          [
            safeCompany,
            "TEST Founder",
            String(email),
            stateCode,
            categoryId,
            planType,
            JSON.stringify(["ecss"]),
          ],
        );
        const applicationId = appRows[0].id;
        console.log(
          `[FOUNDER-TEST] bundled — created test application ${applicationId}`,
        );

        // 2. Find or create the ECSS slot for (cat × state × subcat?)
        const findQ = supabaseAdmin
          .from("elite_sponsor_slots")
          .select("id,status,billing_status")
          .eq("category_slug", catSlug)
          .eq("state_code", stateCode);
        const { data: existingSlot } = await (subSlug
          ? findQ.eq("subcategory_slug", subSlug)
          : findQ.is("subcategory_slug", null)
        ).maybeSingle();

        let slotId: string;
        if (existingSlot?.id && existingSlot.status === "vacant") {
          slotId = existingSlot.id;
        } else if (existingSlot?.id) {
          return res.status(400).json({
            error: `Slot for ${catSlug}/${stateCode}${subSlug ? "/" + subSlug : ""} is already sold. Pick a different category/state/subcategory.`,
          });
        } else {
          const insertPayload: Record<string, any> = {
            category_slug: catSlug,
            state_code: stateCode,
            status: "vacant",
            billing_status: "unpaid",
            monthly_price_cents: 49900, // real default; testMode overrides
            lead_price_cents: 4999,
            sponsor_partner_application_id: applicationId,
          };
          if (subSlug) insertPayload.subcategory_slug = subSlug;
          const { data: created, error: createErr } = await supabaseAdmin
            .from("elite_sponsor_slots")
            .insert(insertPayload)
            .select("id")
            .single();
          if (createErr) throw createErr;
          slotId = created!.id;
          console.log(`[FOUNDER-TEST] bundled — created test slot ${slotId}`);
        }

        // 3. Link slot back to the test application (so checkout finds it)
        await supabaseAdmin
          .from("elite_sponsor_slots")
          .update({ sponsor_partner_application_id: applicationId })
          .eq("id", slotId);

        // 4. Start bundled checkout at $1 + $1
        const checkout = await createPartnerCheckoutSession({
          applicationId,
          addons: ["ecss"],
          testMode: true,
        });
        console.log(
          `[FOUNDER-TEST] bundled — checkout opened ${checkout.sessionId}`,
        );
        return res.json({
          ok: true,
          applicationId,
          slotId,
          ...checkout,
        });
      } catch (err: any) {
        console.error(`[FOUNDER-TEST] bundled error: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
    },
  );

  // ── C. $1 lead-charge test ──────────────────────────────────────────
  // Charges the partner that owns this lead $1 instead of $49.99.
  // Founder spec — Interpretation A: only fires when manually triggered
  // here with ?test=true; auto-accept paths still charge full price.
  app.post(
    "/api/admin/test-leads/:leadId/charge-test",
    requireAdmin,
    async (req, res) => {
      try {
        if (!requireTestQuery(req, res)) return;
        if (!isStripeEnabled()) {
          return res.status(503).json({ error: "Stripe not configured" });
        }
        const leadId = req.params.leadId;
        const { data: lead } = await supabaseAdmin
          .from("navigator_requests")
          .select("id,routed_to_partner_id,veteran_name,category")
          .eq("id", leadId)
          .maybeSingle();
        if (!lead) return res.status(404).json({ error: "Lead not found" });
        if (!lead.routed_to_partner_id) {
          return res
            .status(400)
            .json({ error: "Lead has no routed partner" });
        }
        const { data: partnerOrg } = await supabaseAdmin
          .from("partner_organizations")
          .select("id,name,stripe_customer_id")
          .eq("id", lead.routed_to_partner_id)
          .maybeSingle();
        if (!partnerOrg?.stripe_customer_id) {
          return res.status(400).json({
            error:
              "Partner has no Stripe customer / saved payment method on file",
          });
        }
        console.log(
          `[FOUNDER-TEST] $1 lead charge — lead=${leadId} partner=${partnerOrg.id}`,
        );
        const result = await chargeLeadAutomatically({
          leadId,
          partnerOrgId: partnerOrg.id,
          stripeCustomerId: partnerOrg.stripe_customer_id,
          partnerName: partnerOrg.name || "Partner",
          veteranName: lead.veteran_name || "Unknown",
          category: lead.category || "General",
          testMode: true,
        });
        return res.json(result);
      } catch (err: any) {
        console.error(`[FOUNDER-TEST] lead-charge error: ${err.message}`);
        return res.status(500).json({ error: err.message });
      }
    },
  );

  console.log("[admin-test-checkout] routes registered");
}
