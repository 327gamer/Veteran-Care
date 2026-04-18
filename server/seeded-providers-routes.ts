import type { Express, Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "./supabase";

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

      console.log(
        `[seeded-providers] created provider="${name.trim()}" org_id=${org.id} ts_id=${ts.id} category=${cat.slug}`,
      );
      return res.status(201).json({
        ok: true,
        partner_organization_id: org.id,
        trusted_service_id: ts.id,
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

      console.log(`[seeded-providers] visibility id=${id} -> is_active=${is_active}`);
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

      console.log(`[seeded-providers] soft-deleted id=${id}`);
      return res.json({ ok: true, id, deleted: true });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to delete seeded provider" });
    }
  });
}
