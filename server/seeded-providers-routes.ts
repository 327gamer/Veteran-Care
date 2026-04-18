import type { Express, Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "./supabase";
import { query as pgQuery } from "./pg-client";

/**
 * F2.5 — pg-side display sync helpers
 * -----------------------------------
 * Supabase remains the canonical identity store for partner_organizations
 * and the seeded trusted_services row. The pg-side `trusted_services` table
 * is the public display surface. We mirror seeded display rows there so
 * /api/trusted-services and /api/trusted-partners-for-category include them.
 *
 * Identity vs display:
 *   - identity (supabase): partner_organizations + linked trusted_services row
 *   - display  (pg-side):  trusted_services row tagged with verification_label
 *                          'National Provider' and notes_internal containing
 *                          the supabase ids for backlinking.
 *
 * Routing/billing protections are unchanged — pg-side trusted_services is a
 * pure display table, never used for matching, lead routing, or billing.
 */
async function pgFindCategoryIdBySlug(slug: string): Promise<string | null> {
  try {
    const rows = await pgQuery(
      "SELECT id FROM trusted_service_categories WHERE slug = $1 LIMIT 1",
      [slug],
    );
    return rows[0]?.id || null;
  } catch {
    return null;
  }
}

async function pgInsertSeededDisplayRow(args: {
  pgCategoryId: string;
  name: string;
  shortDescription: string | null;
  websiteUrl: string | null;
  phone: string | null;
  email: string | null;
  state: string | null;
  isActive: boolean;
  supabaseOrgId: string;
  supabaseTsId: string;
  seededSource: string | null;
}): Promise<{ id: string } | null> {
  try {
    const linkNote = `SEEDED|supabase_org_id=${args.supabaseOrgId}|supabase_ts_id=${args.supabaseTsId}|seeded_source=${args.seededSource || ""}`;
    // Idempotency: skip if a pg-side row already exists for this supabase org id
    const existing = await pgQuery<{ id: string }>(
      `SELECT id FROM trusted_services WHERE notes_internal LIKE $1 LIMIT 1`,
      [`SEEDED|%supabase_org_id=${args.supabaseOrgId}%`],
    );
    if (existing[0]) {
      console.log(`[seeded-providers] pg-side row already exists for supabase_org_id=${args.supabaseOrgId}, skipping insert`);
      return { id: existing[0].id };
    }
    const rows = await pgQuery(
      `INSERT INTO trusted_services
        (category_id,name,short_description,website_url,phone,email,state,
         verification_status,verification_label,is_active,is_featured,is_national,
         display_order,program_area,group_type,listing_type,cta_text,notes_internal)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'national-provider','National Provider',$8,false,true,
         100,'trusted_services','service','directory','Visit Website',$9)
       RETURNING id`,
      [
        args.pgCategoryId,
        args.name,
        args.shortDescription,
        args.websiteUrl,
        args.phone,
        args.email,
        args.state,
        args.isActive,
        linkNote,
      ],
    );
    return rows[0] ? { id: rows[0].id } : null;
  } catch (err: any) {
    console.log("[seeded-providers] pg-side insert failed:", err.message);
    return null;
  }
}

async function pgUpdateSeededDisplayActive(
  supabaseOrgId: string,
  isActive: boolean,
): Promise<void> {
  try {
    await pgQuery(
      `UPDATE trusted_services SET is_active = $1
       WHERE notes_internal LIKE $2`,
      [isActive, `SEEDED|%supabase_org_id=${supabaseOrgId}%`],
    );
  } catch (err: any) {
    console.log("[seeded-providers] pg-side visibility update failed:", err.message);
  }
}

let _seededColumnsAvailable: boolean | null = null;
async function checkSeededColumns(): Promise<boolean> {
  if (_seededColumnsAvailable !== null) return _seededColumnsAvailable;
  const { error } = await supabaseAdmin
    .from("partner_organizations")
    .select("provider_type, is_seeded")
    .limit(1);
  _seededColumnsAvailable = !error || !error.message.includes("does not exist");
  return _seededColumnsAvailable;
}

export function registerSeededProviderRoutes(
  app: Express,
  requireAdmin: (req: Request, res: Response, next: NextFunction) => void,
) {
  app.get("/api/admin/seeded-providers/categories", requireAdmin, async (_req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("trusted_service_categories")
        .select("id, slug, name, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) return res.status(500).json({ error: error.message });
      return res.json({ categories: data || [] });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to list categories" });
    }
  });

  app.get("/api/admin/seeded-providers", requireAdmin, async (_req, res) => {
    try {
      if (!(await checkSeededColumns())) {
        return res.status(503).json({
          error:
            "Seeded provider columns not available. Run supabase/chunk-8.0-seeded-providers.sql.",
        });
      }
      const { data: orgs, error: orgErr } = await supabaseAdmin
        .from("partner_organizations")
        .select(
          "id, name, website_url, contact_phone, contact_email, provider_type, is_seeded, seeded_source, is_active, is_lead_enabled, active_paid_partner, created_at",
        )
        .eq("provider_type", "seeded")
        .eq("is_seeded", true)
        .order("name");
      if (orgErr) return res.status(500).json({ error: orgErr.message });

      const orgIds = (orgs || []).map((o: any) => o.id);
      let services: any[] = [];
      if (orgIds.length) {
        const { data: ts, error: tsErr } = await supabaseAdmin
          .from("trusted_services")
          .select(
            "id, partner_organization_id, category_id, short_description, verification_status, verification_label, is_active, state, display_order",
          )
          .in("partner_organization_id", orgIds);
        if (tsErr) return res.status(500).json({ error: tsErr.message });
        services = ts || [];
      }

      const catIds = [...new Set(services.map((s: any) => s.category_id).filter(Boolean))];
      let cats: any[] = [];
      if (catIds.length) {
        const { data: c } = await supabaseAdmin
          .from("trusted_service_categories")
          .select("id, slug, name")
          .in("id", catIds);
        cats = c || [];
      }
      const catMap = new Map(cats.map((c: any) => [c.id, c]));
      const tsMap = new Map(services.map((s: any) => [s.partner_organization_id, s]));

      const providers = (orgs || []).map((o: any) => {
        const ts = tsMap.get(o.id);
        const cat = ts ? catMap.get(ts.category_id) : null;
        return {
          id: o.id,
          name: o.name,
          website_url: o.website_url,
          phone: o.contact_phone,
          contact_email: o.contact_email,
          provider_type: o.provider_type,
          is_seeded: o.is_seeded,
          seeded_source: o.seeded_source,
          partner_active: o.is_active,
          is_lead_enabled: o.is_lead_enabled,
          active_paid_partner: o.active_paid_partner,
          created_at: o.created_at,
          trusted_service_id: ts?.id || null,
          category_id: ts?.category_id || null,
          short_description: ts?.short_description || null,
          verification_status: ts?.verification_status || null,
          verification_label: ts?.verification_label || null,
          visible_in_directory: ts?.is_active ?? null,
          is_national: ts ? !ts.state : null,
          service_state: ts?.state || null,
          category_slug: cat?.slug || null,
          category_name: cat?.name || null,
        };
      });

      return res.json({ providers, count: providers.length });
    } catch (err: any) {
      console.log("[seeded-providers] list error:", err.message);
      return res.status(500).json({ error: "Failed to list seeded providers" });
    }
  });

  app.post("/api/admin/seeded-providers", requireAdmin, async (req, res) => {
    try {
      if (!(await checkSeededColumns())) {
        return res.status(503).json({
          error:
            "Seeded provider columns not available. Run supabase/chunk-8.0-seeded-providers.sql.",
        });
      }
      const {
        name,
        website_url,
        phone,
        contact_email,
        trusted_service_category_id,
        short_description,
        is_national,
        state,
        seeded_source,
      } = req.body || {};

      if (!name || typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ error: "name is required (min 2 chars)" });
      }
      if (!trusted_service_category_id) {
        return res.status(400).json({ error: "trusted_service_category_id is required" });
      }
      const { data: cat, error: catErr } = await supabaseAdmin
        .from("trusted_service_categories")
        .select("id, slug, name")
        .eq("id", trusted_service_category_id)
        .maybeSingle();
      if (catErr || !cat) {
        return res.status(400).json({ error: "Invalid trusted_service_category_id" });
      }

      const { data: org, error: orgErr } = await supabaseAdmin
        .from("partner_organizations")
        .insert({
          name: name.trim(),
          website_url: website_url || null,
          contact_phone: phone || null,
          contact_email: contact_email || null,
          provider_type: "seeded",
          is_seeded: true,
          seeded_source: seeded_source || "admin-curated",
          is_active: true,
          is_lead_enabled: false,
          active_paid_partner: false,
        })
        .select("id")
        .single();
      if (orgErr || !org) {
        const msg = orgErr?.message || "Insert failed";
        console.log("[seeded-providers] org insert failed:", msg);
        if (msg.includes("seeded_cannot_be") || msg.includes("is_seeded_matches")) {
          return res.status(400).json({
            error: "Seeded provider safety constraint violated",
            detail: msg,
          });
        }
        return res.status(500).json({ error: "Failed to create org row", detail: msg });
      }

      const { data: ts, error: tsErr } = await supabaseAdmin
        .from("trusted_services")
        .insert({
          category_id: trusted_service_category_id,
          name: name.trim(),
          short_description: short_description || null,
          website_url: website_url || null,
          phone: phone || null,
          email: contact_email || null,
          verification_status: "national-provider",
          verification_label: "National Provider",
          is_featured: false,
          is_active: true,
          display_order: 100,
          state: is_national === false ? state || null : null,
          partner_organization_id: org.id,
          cta_text: "Visit Website",
        })
        .select("id")
        .single();
      if (tsErr || !ts) {
        // Roll back the org row to avoid orphans
        await supabaseAdmin.from("partner_organizations").delete().eq("id", org.id);
        const msg = tsErr?.message || "Insert failed";
        console.log("[seeded-providers] ts insert failed (org rolled back):", msg);
        return res.status(500).json({ error: "Failed to create directory entry", detail: msg });
      }

      // F2.5: Mirror display row into pg-side trusted_services so it
      // appears on /api/trusted-services and /api/trusted-partners-for-category.
      // Identity stays canonical in supabase; this is display-only.
      let pgDisplayId: string | null = null;
      const pgCategoryId = await pgFindCategoryIdBySlug(cat.slug);
      if (pgCategoryId) {
        const pgRow = await pgInsertSeededDisplayRow({
          pgCategoryId,
          name: name.trim(),
          shortDescription: short_description || null,
          websiteUrl: website_url || null,
          phone: phone || null,
          email: contact_email || null,
          state: is_national === false ? state || null : null,
          isActive: true,
          supabaseOrgId: org.id,
          supabaseTsId: ts.id,
          seededSource: seeded_source || "admin-curated",
        });
        pgDisplayId = pgRow?.id || null;
        if (!pgDisplayId) {
          console.log(
            `[seeded-providers] WARN: supabase rows created but pg-side display insert failed for "${name.trim()}". Identity preserved; display will need re-sync.`,
          );
        }
      } else {
        console.log(
          `[seeded-providers] WARN: pg-side has no category slug="${cat.slug}". Display row not created.`,
        );
      }

      console.log(
        `[seeded-providers] created provider="${name.trim()}" org_id=${org.id} ts_id=${ts.id} pg_display_id=${pgDisplayId || "—"} category=${cat.slug}`,
      );
      return res.status(201).json({
        ok: true,
        partner_organization_id: org.id,
        trusted_service_id: ts.id,
        pg_display_id: pgDisplayId,
        category: cat,
      });
    } catch (err: any) {
      console.log("[seeded-providers] create error:", err.message);
      return res.status(500).json({ error: "Failed to create seeded provider" });
    }
  });

  app.patch("/api/admin/seeded-providers/:id/visibility", requireAdmin, async (req, res) => {
    try {
      if (!(await checkSeededColumns())) {
        return res.status(503).json({ error: "Seeded provider columns not available" });
      }
      const { id } = req.params;
      const { is_active } = req.body || {};
      if (typeof is_active !== "boolean") {
        return res.status(400).json({ error: "is_active boolean required" });
      }
      const { data: check } = await supabaseAdmin
        .from("partner_organizations")
        .select("id")
        .eq("id", id)
        .eq("provider_type", "seeded")
        .maybeSingle();
      if (!check) return res.status(404).json({ error: "Seeded provider not found" });

      const { error } = await supabaseAdmin
        .from("trusted_services")
        .update({ is_active })
        .eq("partner_organization_id", id);
      if (error) return res.status(500).json({ error: error.message });

      // F2.5: mirror visibility into pg-side display row
      await pgUpdateSeededDisplayActive(id, is_active);

      console.log(`[seeded-providers] visibility id=${id} -> is_active=${is_active} (pg-side mirrored)`);
      return res.json({ ok: true, id, is_active });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to update visibility" });
    }
  });

  app.delete("/api/admin/seeded-providers/:id", requireAdmin, async (req, res) => {
    try {
      if (!(await checkSeededColumns())) {
        return res.status(503).json({ error: "Seeded provider columns not available" });
      }
      const { id } = req.params;
      const { data: check } = await supabaseAdmin
        .from("partner_organizations")
        .select("id")
        .eq("id", id)
        .eq("provider_type", "seeded")
        .maybeSingle();
      if (!check) return res.status(404).json({ error: "Seeded provider not found" });

      await supabaseAdmin
        .from("trusted_services")
        .update({ is_active: false })
        .eq("partner_organization_id", id);
      await supabaseAdmin
        .from("partner_organizations")
        .update({ is_active: false })
        .eq("id", id);

      // F2.5: hide pg-side display row too
      await pgUpdateSeededDisplayActive(id, false);

      console.log(`[seeded-providers] soft-deleted id=${id} (pg-side mirrored)`);
      return res.json({ ok: true, id, deleted: true });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to delete seeded provider" });
    }
  });
}
