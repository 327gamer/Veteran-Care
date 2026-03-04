import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./supabase";

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-admin-key"] as string;
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/categories", async (_req, res) => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  });

  app.get("/api/resources", async (req, res) => {
    const { category, state, q } = req.query;

    let query = supabase.from("resources").select(`
      id,
      category_id,
      title,
      short_description,
      website_url,
      phone,
      email,
      address,
      city,
      state,
      zip,
      eligibility,
      source_name,
      source_type,
      last_verified,
      monetization_type,
      affiliate_url,
      sponsored,
      status,
      created_at,
      categories!inner(id, name, slug)
    `);

    query = query.eq("status", "approved");

    if (category) {
      query = query.eq("categories.slug", category as string);
    }

    if (state) {
      query = query.or(`state.eq.${state},state.is.null`);
    } else {
      query = query.is("state", null);
    }

    if (q) {
      const search = `%${q}%`;
      query = query.or(`title.ilike.${search},short_description.ilike.${search}`);
    }

    query = query.order("sponsored", { ascending: false }).order("title");

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  });

  app.get("/api/resources/:id", async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("resources")
      .select(`
        *,
        categories(id, name, slug)
      `)
      .eq("id", id)
      .eq("status", "approved")
      .single();

    if (error) {
      return res.status(404).json({ error: "Resource not found" });
    }

    return res.json(data);
  });

  app.post("/api/submit-resource", async (req, res) => {
    const {
      category_slug,
      title,
      short_description,
      website_url,
      phone,
      email,
      address,
      city,
      state,
      zip,
      eligibility,
      source_name,
      submitted_by_name,
      submitted_by_email,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    let category_id = null;
    if (category_slug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category_slug)
        .single();
      if (cat) category_id = cat.id;
    }

    const { data, error } = await supabase
      .from("resources")
      .insert({
        title,
        category_id,
        short_description: short_description || null,
        website_url: website_url || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        eligibility: eligibility || null,
        source_name: source_name || null,
        submitted_by_name: submitted_by_name || null,
        submitted_by_email: submitted_by_email || null,
        status: "pending",
        sponsored: false,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ id: data.id, message: "Resource submitted for review" });
  });

  app.get("/api/admin/resources", requireAdmin, async (req, res) => {
    const { status, q, state: stateFilter } = req.query;

    let query = supabase.from("resources").select(`
      *,
      categories(id, name, slug)
    `);

    if (status) {
      query = query.eq("status", status as string);
    }

    if (stateFilter) {
      query = query.eq("state", stateFilter as string);
    }

    if (q) {
      const search = `%${q}%`;
      query = query.or(`title.ilike.${search},short_description.ilike.${search}`);
    }

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  });

  app.patch("/api/admin/resources/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const allowedFields = [
      "title", "short_description", "website_url", "phone", "email",
      "address", "city", "state", "zip", "eligibility", "source_name",
      "source_type", "status", "notes_internal", "category_id",
      "is_featured", "featured_rank", "last_verified_at",
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.status === "approved" && !updates.last_verified_at) {
      updates.last_verified_at = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const { data, error } = await supabase
      .from("resources")
      .update(updates)
      .eq("id", id)
      .select(`*, categories(id, name, slug)`)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  });

  return httpServer;
}
