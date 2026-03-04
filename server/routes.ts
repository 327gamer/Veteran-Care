import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./supabase";

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
      eligibility,
      source_name,
      source_type,
      last_verified,
      monetization_type,
      affiliate_url,
      sponsored,
      created_at,
      categories!inner(id, name, slug)
    `);

    if (category) {
      query = query.eq("categories.slug", category as string);
    }

    if (state) {
      query = query.or(`state.eq.${state},state.is.null`);
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
      .single();

    if (error) {
      return res.status(404).json({ error: "Resource not found" });
    }

    return res.json(data);
  });

  app.post("/api/submit-resource", async (req, res) => {
    const { title, category_id, short_description, website_url, phone, email, address, city, state, eligibility, source_name, source_type } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const { data, error } = await supabase
      .from("resources")
      .insert({
        title,
        category_id: category_id || null,
        short_description: short_description || null,
        website_url: website_url || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        state: state || null,
        eligibility: eligibility || null,
        source_name: source_name || null,
        source_type: source_type || null,
        sponsored: false,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  });

  return httpServer;
}
