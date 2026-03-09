import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./supabase";
import { geocodeAddress, haversineDistance } from "./geocode";
import { autoRouteNewLead } from "./lead-router";
import { startEscalationTimer } from "./lead-escalation";

let hasGeoColumns = true;
let hasSubcategoryColumn = false;
let hasServicePriorityColumn = false;
let hasNavLifecycleColumns = false;

async function checkGeoColumns() {
  const { error } = await supabase.from("resources").select("latitude").limit(1);
  if (error && error.message.includes("does not exist")) {
    hasGeoColumns = false;
    console.log("[geo] latitude/longitude columns not found — Near Me feature disabled until columns are added");
  } else {
    hasGeoColumns = true;
  }
}

async function checkSubcategoryColumn() {
  const { error } = await supabase.from("resources").select("subcategory").limit(1);
  if (error && error.message.includes("does not exist")) {
    hasSubcategoryColumn = false;
    console.log("[schema] subcategory column not found. Please run in Supabase SQL editor: ALTER TABLE resources ADD COLUMN subcategory TEXT;");
  } else {
    hasSubcategoryColumn = true;
  }
}

async function checkServicePriorityColumn() {
  const { error } = await supabase.from("resources").select("service_priority").limit(1);
  if (error && error.message.includes("does not exist")) {
    hasServicePriorityColumn = false;
    console.log("[schema] service_priority column not found. Please run in Supabase SQL editor: ALTER TABLE resources ADD COLUMN service_priority TEXT;");
  } else {
    hasServicePriorityColumn = true;
  }
}

let hasRoutingColumns = false;
let hasPartnerTable = false;
let hasRoutingRulesTable = false;
let hasStatesTable = false;

let statesHasFullSchema = false;

async function checkStatesTable() {
  const { data, error } = await supabase.from("states").select("code").limit(1);
  if (error) {
    hasStatesTable = false;
    console.log("[schema] states table not found. Run supabase/create_states.sql");
    return;
  }
  hasStatesTable = true;
  console.log("[schema] states table detected");

  const { error: fullErr } = await supabase.from("states").select("id, is_active, is_template, config").limit(1);
  if (fullErr) {
    statesHasFullSchema = false;
    console.log("[schema] states table has simplified schema. Run supabase/alter_states.sql for full multi-state support");
  } else {
    statesHasFullSchema = true;
    console.log("[schema] states table has full schema");
  }
}

async function checkPartnerTable() {
  const { data, error } = await supabase.from("partner_organizations").select("id").limit(1);
  if (error) {
    hasPartnerTable = false;
    console.log("[schema] partner_organizations table not found. Run supabase/create_partner_organizations.sql");
  } else {
    hasPartnerTable = true;
    console.log("[schema] partner_organizations table detected");
  }

  const { data: rulesData, error: rulesErr } = await supabase.from("partner_routing_rules").select("id").limit(1);
  if (rulesErr) {
    hasRoutingRulesTable = false;
    console.log("[schema] partner_routing_rules table not found. Run supabase/create_partner_organizations.sql");
  } else {
    hasRoutingRulesTable = true;
    console.log("[schema] partner_routing_rules table detected");
  }
}

async function checkNavLifecycleColumns() {
  const { error } = await supabase.from("navigator_requests").select("source, urgency, outcome").limit(1);
  if (error && error.message.includes("does not exist")) {
    hasNavLifecycleColumns = false;
    console.log("[schema] Navigator lifecycle columns not found. Please run in Supabase SQL editor:");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS source TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS utm_source TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS utm_medium TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS utm_campaign TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS urgency TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS assigned_to TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS outcome TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS consent_followup BOOLEAN DEFAULT false;");
  } else {
    hasNavLifecycleColumns = true;
    console.log("[schema] Navigator lifecycle columns detected");
  }

  const { error: routeErr } = await supabase.from("navigator_requests").select("routed_to_partner_id, routed_at, delivery_status, partner_outcome, closed_at").limit(1);
  if (routeErr && routeErr.message.includes("does not exist")) {
    hasRoutingColumns = false;
    console.log("[schema] Routing columns not found. Run in Supabase SQL editor:");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS routed_to_partner_id UUID REFERENCES partner_organizations(id);");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS routed_at TIMESTAMPTZ;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS partner_outcome TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;");
  } else {
    hasRoutingColumns = true;
    console.log("[schema] Routing columns detected");
  }
}

function resourceSelectFields() {
  const base = [
    "id", "category_id", "title", "short_description", "website_url", "phone", "email",
    "address", "city", "state", "zip", "eligibility", "source_name", "source_type",
    "last_verified", "monetization_type", "affiliate_url", "sponsored",
  ];
  if (hasSubcategoryColumn) base.push("subcategory");
  if (hasServicePriorityColumn) base.push("service_priority");
  if (hasGeoColumns) base.push("latitude", "longitude");
  base.push("status", "created_at", "categories!inner(id, name, slug)");
  return base.join(", ");
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-admin-key"] as string;
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

const submitRateLimit = new Map<string, number[]>();
function checkSubmitRate(ip: string): boolean {
  const now = Date.now();
  const window = 60 * 60 * 1000;
  const maxSubmits = 5;
  const timestamps = (submitRateLimit.get(ip) || []).filter(t => now - t < window);
  if (timestamps.length >= maxSubmits) return false;
  timestamps.push(now);
  submitRateLimit.set(ip, timestamps);
  return true;
}

setInterval(() => {
  const now = Date.now();
  const window = 60 * 60 * 1000;
  for (const [ip, times] of submitRateLimit.entries()) {
    const valid = times.filter(t => now - t < window);
    if (valid.length === 0) submitRateLimit.delete(ip);
    else submitRateLimit.set(ip, valid);
  }
}, 10 * 60 * 1000);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await checkGeoColumns();
  await checkSubcategoryColumn();
  await checkServicePriorityColumn();
  await checkNavLifecycleColumns();
  await checkPartnerTable();
  await checkStatesTable();

  if (hasPartnerTable && hasRoutingColumns) {
    startEscalationTimer(5 * 60 * 1000);
  }

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

    const userLat = req.query.user_lat ? parseFloat(req.query.user_lat as string) : undefined;
    const userLng = req.query.user_lng ? parseFloat(req.query.user_lng as string) : undefined;
    const radiusMiles = req.query.radius_miles ? parseFloat(req.query.radius_miles as string) : undefined;
    const nearMeMode = userLat !== undefined && userLng !== undefined && radiusMiles !== undefined
      && !isNaN(userLat) && !isNaN(userLng) && !isNaN(radiusMiles);

    let query = supabase.from("resources").select(resourceSelectFields());

    query = query.eq("status", "approved");

    if (category) {
      query = query.eq("categories.slug", category as string);
    }

    if (nearMeMode && hasGeoColumns) {
      const latDelta = radiusMiles! / 69.0;
      const lngDelta = radiusMiles! / (69.0 * Math.cos((userLat! * Math.PI) / 180));
      query = query
        .gte("latitude", userLat! - latDelta)
        .lte("latitude", userLat! + latDelta)
        .gte("longitude", userLng! - lngDelta)
        .lte("longitude", userLng! + lngDelta);
    } else {
      const city = req.query.city as string | undefined;
      const zip = req.query.zip as string | undefined;

      if (city || zip) {
        if (state) {
          query = query.or(`state.eq.${state},state.is.null`);
        }
        if (city) {
          query = query.ilike("city", `%${city}%`);
        }
        if (zip) {
          query = query.eq("zip", zip);
        }
      } else if (state) {
        query = query.or(`state.eq.${state},state.is.null`);
      }
    }

    if (q) {
      const search = `%${q}%`;
      query = query.or(`title.ilike.${search},short_description.ilike.${search},city.ilike.${search},state.ilike.${search},eligibility.ilike.${search},source_name.ilike.${search}`);
    }

    if (!nearMeMode) {
      query = query.order("sponsored", { ascending: false }).order("title");
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (nearMeMode && hasGeoColumns && data) {
      const localResults = data
        .map((r: any) => {
          if (r.latitude != null && r.longitude != null) {
            const dist = haversineDistance(userLat!, userLng!, r.latitude, r.longitude);
            return { ...r, distance_miles: Math.round(dist * 10) / 10 };
          }
          return { ...r, distance_miles: null };
        })
        .filter((r: any) => r.distance_miles !== null && r.distance_miles <= radiusMiles!)
        .sort((a: any, b: any) => a.distance_miles - b.distance_miles);

      let nationalQuery = supabase.from("resources").select(resourceSelectFields())
        .eq("status", "approved").is("state", null);
      if (category) {
        nationalQuery = nationalQuery.eq("categories.slug", category as string);
      }
      nationalQuery = nationalQuery.order("sponsored", { ascending: false }).order("title");
      const { data: nationalData } = await nationalQuery;

      const localIds = new Set(localResults.map((r: any) => r.id));
      const nationalResults = (nationalData || [])
        .filter((r: any) => !localIds.has(r.id))
        .map((r: any) => ({ ...r, distance_miles: null, is_national: true }));

      return res.json([...localResults, ...nationalResults]);
    }

    return res.json(data);
  });

  app.get("/api/locations/cities", async (req, res) => {
    const { state, category } = req.query;

    let query = supabase
      .from("resources")
      .select("city, categories!inner(slug)")
      .eq("status", "approved")
      .not("city", "is", null);

    if (state) {
      query = query.eq("state", state as string);
    }

    if (category) {
      query = query.eq("categories.slug", category as string);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const cities = [...new Set((data || []).map((r: any) => r.city as string))].sort();
    return res.json(cities);
  });

  app.get("/api/locations/zips", async (req, res) => {
    const { state, city, category } = req.query;

    let query = supabase
      .from("resources")
      .select("zip, categories!inner(slug)")
      .eq("status", "approved")
      .not("zip", "is", null);

    if (state) {
      query = query.eq("state", state as string);
    }

    if (city) {
      query = query.eq("city", city as string);
    }

    if (category) {
      query = query.eq("categories.slug", category as string);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const zips = [...new Set((data || []).map((r: any) => r.zip as string))].sort();
    return res.json(zips);
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

  app.post("/api/resources/by-ids", async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.json([]);
    }
    const safeIds = ids.slice(0, 100);

    const { data, error } = await supabase
      .from("resources")
      .select(resourceSelectFields())
      .in("id", safeIds)
      .eq("status", "approved");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json(data || []);
  });

  app.get("/api/saved-resources", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const { data, error } = await supabase
      .from("user_saved_resources")
      .select("resource_id")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const ids = (data || []).map((r: any) => r.resource_id);
    return res.json({ ids });
  });

  app.post("/api/saved-resources/sync", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const { localIds } = req.body;
    if (!Array.isArray(localIds)) {
      return res.status(400).json({ error: "localIds must be an array" });
    }

    if (localIds.length > 0) {
      const rows = localIds.map((resource_id: string) => ({
        user_id: user.id,
        resource_id,
      }));
      await supabase.from("user_saved_resources").upsert(rows, {
        onConflict: "user_id,resource_id",
        ignoreDuplicates: true,
      });
    }

    const { data, error } = await supabase
      .from("user_saved_resources")
      .select("resource_id")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const ids = (data || []).map((r: any) => r.resource_id);
    return res.json({ ids });
  });

  app.post("/api/saved-resources/toggle", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const { resource_id, action } = req.body;
    if (!resource_id) {
      return res.status(400).json({ error: "resource_id required" });
    }

    if (action === "unsave") {
      await supabase
        .from("user_saved_resources")
        .delete()
        .eq("user_id", user.id)
        .eq("resource_id", resource_id);
    } else {
      await supabase
        .from("user_saved_resources")
        .upsert(
          { user_id: user.id, resource_id },
          { onConflict: "user_id,resource_id", ignoreDuplicates: true }
        );
    }

    const { data, error } = await supabase
      .from("user_saved_resources")
      .select("resource_id")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const ids = (data || []).map((r: any) => r.resource_id);
    return res.json({ ids });
  });

  app.post("/api/submit-resource", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkSubmitRate(ip)) {
      return res.status(429).json({ error: "Too many submissions. Please try again later." });
    }

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

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return res.status(400).json({ error: "Title is required (minimum 3 characters)" });
    }
    if (!category_slug || typeof category_slug !== "string") {
      return res.status(400).json({ error: "Category is required" });
    }
    if (website_url && typeof website_url === "string") {
      try { new URL(website_url); } catch {
        return res.status(400).json({ error: "Invalid website URL format" });
      }
    }
    if (phone && typeof phone === "string" && phone.replace(/\D/g, "").length < 7) {
      return res.status(400).json({ error: "Phone number appears invalid" });
    }

    const dupChecks: string[] = [];
    if (website_url) {
      const { data: urlDup } = await supabase
        .from("resources")
        .select("id, title")
        .eq("website_url", website_url)
        .limit(1);
      if (urlDup && urlDup.length > 0) {
        dupChecks.push(`A resource with this website already exists: "${urlDup[0].title}"`);
      }
    }
    if (phone) {
      const normalized = phone.replace(/\D/g, "");
      if (normalized.length >= 10) {
        const phonePatterns = [
          phone.trim(),
          `(${normalized.slice(0,3)}) ${normalized.slice(3,6)}-${normalized.slice(6)}`,
          `${normalized.slice(0,3)}-${normalized.slice(3,6)}-${normalized.slice(6)}`,
          normalized,
        ];
        const { data: phoneDup } = await supabase
          .from("resources")
          .select("id, title")
          .in("phone", phonePatterns)
          .limit(1);
        if (phoneDup && phoneDup.length > 0) {
          dupChecks.push(`A resource with this phone number already exists: "${phoneDup[0].title}"`);
        }
      }
    }
    if (city && state) {
      const { data: titleDup } = await supabase
        .from("resources")
        .select("id, title")
        .ilike("title", title.trim())
        .ilike("city", city.trim())
        .eq("state", state)
        .limit(1);
      if (titleDup && titleDup.length > 0) {
        dupChecks.push(`A resource with this name already exists in this location: "${titleDup[0].title}"`);
      }
    }
    if (dupChecks.length > 0) {
      return res.status(409).json({ error: dupChecks[0] });
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
        title: title.trim(),
        category_id,
        short_description: short_description?.trim() || null,
        website_url: website_url?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state || null,
        zip: zip?.trim() || null,
        eligibility: eligibility?.trim() || null,
        source_name: source_name?.trim() || null,
        submitted_by_name: submitted_by_name?.trim() || null,
        submitted_by_email: submitted_by_email?.trim() || null,
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

  app.post("/api/track-click", async (req, res) => {
    const { resource_id, click_type, user_state, user_city, user_zip } = req.body;

    if (!resource_id || !click_type) {
      return res.status(400).json({ error: "resource_id and click_type are required" });
    }

    const validTypes = ["website_click", "call_click", "directions_click", "guide_click", "save_click", "share_click", "report_click", "apply_click", "navigator_click"];
    if (!validTypes.includes(click_type)) {
      return res.status(400).json({ error: "Invalid click_type" });
    }

    const row: Record<string, any> = {
      resource_id,
      click_type,
      user_state: user_state || null,
      user_city: user_city || null,
    };

    const { error } = await supabase.from("resource_clicks").insert({ ...row, user_zip: user_zip || null });

    if (error && error.message.includes("user_zip")) {
      const { error: fallbackErr } = await supabase.from("resource_clicks").insert(row);
      if (fallbackErr) {
        console.error("Click tracking error:", fallbackErr.message);
      }
      return res.json({ ok: true });
    }

    if (error) {
      console.error("Click tracking error:", error.message);
    }

    return res.json({ ok: true });
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

  app.post("/api/admin/resources", requireAdmin, async (req, res) => {
    const { category_id, title, short_description, website_url, phone, email,
      address, city, state, zip, eligibility, source_name, status,
      sponsored, monetization_type, affiliate_url, notes_internal, subcategory,
      service_priority } = req.body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return res.status(400).json({ error: "Title is required (minimum 3 characters)" });
    }

    let latitude = req.body.latitude != null ? parseFloat(req.body.latitude) : null;
    let longitude = req.body.longitude != null ? parseFloat(req.body.longitude) : null;
    let geo_source = req.body.geo_source || null;

    if (hasGeoColumns && (latitude == null || longitude == null) && (address || city || state || zip)) {
      const geo = await geocodeAddress(address, city, state, zip);
      if (geo) {
        latitude = geo.latitude;
        longitude = geo.longitude;
        geo_source = geo.geo_source;
      }
    }

    const insertData: Record<string, any> = {
      title: title.trim(),
      category_id: category_id || null,
      short_description: short_description?.trim() || null,
      website_url: website_url?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state || null,
      zip: zip?.trim() || null,
      eligibility: eligibility?.trim() || null,
      source_name: source_name?.trim() || null,
      notes_internal: notes_internal?.trim() || null,
      status: status || "approved",
      sponsored: !!sponsored,
      monetization_type: monetization_type || null,
      affiliate_url: affiliate_url?.trim() || null,
    };

    if (hasSubcategoryColumn) {
      insertData.subcategory = subcategory?.trim() || null;
    }

    if (hasServicePriorityColumn) {
      const validPriorities = ["immediate", "same_week", "standard", "information"];
      insertData.service_priority = validPriorities.includes(service_priority) ? service_priority : null;
    }

    if (hasGeoColumns) {
      insertData.latitude = isNaN(latitude as number) ? null : latitude;
      insertData.longitude = isNaN(longitude as number) ? null : longitude;
      insertData.geo_source = geo_source;
      insertData.geocoded_at = latitude != null ? new Date().toISOString() : null;
    }

    const { data, error } = await supabase
      .from("resources")
      .insert(insertData)
      .select(`*, categories(id, name, slug)`)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  });

  app.post("/api/admin/resources/csv-import", requireAdmin, async (req, res) => {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "No rows provided" });
    }
    if (rows.length > 500) {
      return res.status(400).json({ error: "Maximum 500 rows per import" });
    }

    const { data: cats } = await supabase.from("categories").select("id, name, slug");
    const catMap = new Map<string, string>();
    (cats || []).forEach((c: any) => {
      catMap.set(c.slug.toLowerCase(), c.id);
      catMap.set(c.name.toLowerCase(), c.id);
    });

    const results: { row: number; status: "created" | "skipped" | "error"; title: string; reason?: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const title = row.title?.trim();
      if (!title || title.length < 3) {
        results.push({ row: i + 1, status: "skipped", title: title || "(empty)", reason: "Title too short or missing" });
        continue;
      }

      const catKey = (row.category || row.category_slug || "").toLowerCase().trim();
      let category_id = catMap.get(catKey) || null;
      if (!category_id && row.category_id?.trim()) {
        category_id = row.category_id.trim();
      }

      try {
        let lat = row.latitude ? parseFloat(row.latitude) : null;
        let lng = row.longitude ? parseFloat(row.longitude) : null;
        let geoSrc = row.geo_source?.trim() || null;

        if (hasGeoColumns && (lat == null || lng == null || isNaN(lat) || isNaN(lng)) &&
            (row.address?.trim() || row.city?.trim() || row.state?.trim() || row.zip?.trim())) {
          const geo = await geocodeAddress(row.address?.trim(), row.city?.trim(), row.state?.trim(), row.zip?.trim());
          if (geo) {
            lat = geo.latitude;
            lng = geo.longitude;
            geoSrc = geo.geo_source;
          }
        }

        const csvInsert: Record<string, any> = {
            title,
            category_id,
            short_description: row.short_description?.trim() || row.description?.trim() || null,
            website_url: row.website_url?.trim() || row.website?.trim() || row.url?.trim() || null,
            phone: row.phone?.trim() || null,
            email: row.email?.trim() || null,
            address: row.address?.trim() || null,
            city: row.city?.trim() || null,
            state: row.state?.trim() || null,
            zip: row.zip?.trim() || null,
            eligibility: row.eligibility?.trim() || null,
            source_name: row.source_name?.trim() || row.source?.trim() || null,
            source_type: row.source_type?.trim() || null,
            notes_internal: row.notes_internal?.trim() || null,
            status: ["approved", "pending", "rejected"].includes(row.status) ? row.status : "approved",
            sponsored: row.sponsored === "true" || row.sponsored === true,
            monetization_type: row.monetization_type?.trim() || null,
            affiliate_url: row.affiliate_url?.trim() || null,
        };

        if (hasSubcategoryColumn) {
            csvInsert.subcategory = row.subcategory?.trim() || null;
        }

        if (hasServicePriorityColumn) {
            const validPriorities = ["immediate", "same_week", "standard", "information"];
            csvInsert.service_priority = validPriorities.includes(row.service_priority) ? row.service_priority : null;
        }

        if (hasGeoColumns) {
            csvInsert.latitude = (lat != null && !isNaN(lat)) ? lat : null;
            csvInsert.longitude = (lng != null && !isNaN(lng)) ? lng : null;
            csvInsert.geo_source = geoSrc;
            csvInsert.geocoded_at = (lat != null && !isNaN(lat)) ? new Date().toISOString() : null;
        }

        const { error } = await supabase
          .from("resources")
          .insert(csvInsert);

        if (error) {
          results.push({ row: i + 1, status: "error", title, reason: error.message });
        } else {
          results.push({ row: i + 1, status: "created", title });
        }
      } catch (e: any) {
        results.push({ row: i + 1, status: "error", title, reason: e?.message || "Unknown error" });
      }
    }

    const created = results.filter(r => r.status === "created").length;
    const skipped = results.filter(r => r.status === "skipped").length;
    const errors = results.filter(r => r.status === "error").length;

    return res.json({ created, skipped, errors, total: rows.length, results });
  });

  app.post("/api/admin/resources/geocode-missing", requireAdmin, async (req, res) => {
    if (!hasGeoColumns) {
      return res.status(400).json({ error: "Geo columns not found in resources table" });
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    const send = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const { data: missing, error: fetchErr } = await supabase
        .from("resources")
        .select("id, title, address, city, state, zip")
        .or("latitude.is.null,longitude.is.null")
        .not("state", "is", null)
        .eq("status", "approved")
        .order("title");

      if (fetchErr || !missing) {
        send({ type: "error", message: fetchErr?.message || "Failed to fetch resources" });
        res.end();
        return;
      }

      const candidates = missing.filter((r: any) => {
        const parts = [r.address, r.city, r.state, r.zip].filter(Boolean);
        return parts.length >= 2;
      });

      send({ type: "start", total: candidates.length, skippedNoAddress: missing.length - candidates.length });

      let geocoded = 0;
      let failed = 0;
      const failures: { id: string; title: string; reason: string }[] = [];

      for (let i = 0; i < candidates.length; i++) {
        const r = candidates[i];

        try {
          const geo = await geocodeAddress(r.address, r.city, r.state, r.zip);

          if (geo) {
            const { error: updateErr } = await supabase
              .from("resources")
              .update({
                latitude: geo.latitude,
                longitude: geo.longitude,
                geo_source: geo.geo_source,
                geocoded_at: new Date().toISOString(),
              })
              .eq("id", r.id);

            if (updateErr) {
              failed++;
              failures.push({ id: r.id, title: r.title, reason: updateErr.message });
            } else {
              geocoded++;
            }
          } else {
            failed++;
            failures.push({ id: r.id, title: r.title, reason: "Geocoder returned no results" });
          }
        } catch (e: any) {
          failed++;
          failures.push({ id: r.id, title: r.title, reason: e?.message || "Unknown error" });
        }

        send({
          type: "progress",
          current: i + 1,
          total: candidates.length,
          geocoded,
          failed,
          lastTitle: r.title,
        });
      }

      send({
        type: "done",
        geocoded,
        failed,
        total: candidates.length,
        skippedNoAddress: missing.length - candidates.length,
        failures,
      });
    } catch (e: any) {
      send({ type: "error", message: e?.message || "Unknown error" });
    }

    res.end();
  });

  app.patch("/api/admin/resources/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const allowedFields = [
      "title", "short_description", "website_url", "phone", "email",
      "address", "city", "state", "zip", "eligibility", "source_name",
      "source_type", "status", "notes_internal", "category_id",
      "is_featured", "featured_rank", "last_verified_at",
      "sponsored", "monetization_type", "affiliate_url",
      ...(hasSubcategoryColumn ? ["subcategory"] : []),
      ...(hasServicePriorityColumn ? ["service_priority"] : []),
      ...(hasGeoColumns ? ["latitude", "longitude", "geo_source"] : []),
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

    const addressChanged = updates.address !== undefined || updates.city !== undefined ||
      updates.state !== undefined || updates.zip !== undefined;
    if (hasGeoColumns && addressChanged && updates.latitude === undefined && updates.longitude === undefined) {
      const addr = updates.address ?? req.body._current_address;
      const ct = updates.city ?? req.body._current_city;
      const st = updates.state ?? req.body._current_state;
      const zp = updates.zip ?? req.body._current_zip;
      const geo = await geocodeAddress(addr, ct, st, zp);
      if (geo) {
        updates.latitude = geo.latitude;
        updates.longitude = geo.longitude;
        updates.geo_source = geo.geo_source;
        updates.geocoded_at = new Date().toISOString();
      }
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

  app.post("/api/report-resource", async (req, res) => {
    const { resource_id, reason } = req.body;
    if (!resource_id) {
      return res.status(400).json({ error: "resource_id is required" });
    }

    const { data: resource } = await supabase
      .from("resources")
      .select("id, title, notes_internal")
      .eq("id", resource_id)
      .single();

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const reportNote = `[REPORT ${new Date().toISOString()}] ${reason || "incorrect_info"}`;
    const existingNotes = resource.notes_internal || "";
    const updatedNotes = existingNotes ? `${existingNotes}\n${reportNote}` : reportNote;

    await supabase
      .from("resources")
      .update({
        notes_internal: updatedNotes,
        status: "pending",
      })
      .eq("id", resource_id);

    return res.json({ ok: true, message: "Report submitted for admin review" });
  });

  app.post("/api/navigator-request", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkSubmitRate(ip)) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    const {
      resource_id,
      resource_title,
      veteran_name,
      veteran_phone,
      veteran_email,
      message,
      preferred_contact,
      category,
      subcategory,
      user_state,
      user_city,
      user_zip,
      source,
      utm_source,
      utm_medium,
      utm_campaign,
      urgency,
      consent_followup,
    } = req.body;

    if (!veteran_name || typeof veteran_name !== "string" || veteran_name.trim().length < 2) {
      return res.status(400).json({ error: "Name is required (minimum 2 characters)" });
    }
    if (!veteran_phone && !veteran_email) {
      return res.status(400).json({ error: "Please provide a phone number or email so we can reach you" });
    }
    if (veteran_email && typeof veteran_email === "string" && !veteran_email.includes("@")) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    const validContact = ["phone", "email", "either"];
    const contact = validContact.includes(preferred_contact) ? preferred_contact : "phone";

    const catStr = typeof category === "string" ? category.trim() : null;
    const subStr = typeof subcategory === "string" ? subcategory.trim() : null;
    const userMsg = message?.trim() || null;

    const catParts: string[] = [];
    if (catStr) catParts.push(`Category: ${catStr}`);
    if (subStr) catParts.push(`Subcategory: ${subStr}`);

    const baseRow: Record<string, any> = {
      resource_id: resource_id || null,
      resource_title: resource_title?.trim() || null,
      veteran_name: veteran_name.trim(),
      veteran_phone: veteran_phone?.trim() || null,
      veteran_email: veteran_email?.trim() || null,
      preferred_contact: contact,
      user_state: user_state || null,
      user_city: user_city || null,
      user_zip: user_zip || null,
      status: "new",
    };

    if (catStr) baseRow.category = catStr;
    if (subStr) baseRow.subcategory = subStr;

    if (hasNavLifecycleColumns) {
      const validUrgency = ["immediate", "same_week", "standard", "information"];
      if (source && typeof source === "string") baseRow.source = source.trim();
      if (utm_source && typeof utm_source === "string") baseRow.utm_source = utm_source.trim();
      if (utm_medium && typeof utm_medium === "string") baseRow.utm_medium = utm_medium.trim();
      if (utm_campaign && typeof utm_campaign === "string") baseRow.utm_campaign = utm_campaign.trim();
      if (urgency && validUrgency.includes(urgency)) baseRow.urgency = urgency;
      if (consent_followup === true) baseRow.consent_followup = true;
    }

    let { data, error } = await supabase
      .from("navigator_requests")
      .insert({ ...baseRow, message: userMsg })
      .select()
      .single();

    if (error && (error.message?.includes("category") || error.message?.includes("subcategory"))) {
      delete baseRow.category;
      delete baseRow.subcategory;
      const enrichedMsg = catParts.length > 0
        ? [catParts.join(" | "), userMsg].filter(Boolean).join("\n")
        : userMsg;
      const retry = await supabase
        .from("navigator_requests")
        .insert({ ...baseRow, message: enrichedMsg })
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("Navigator request error:", error.message);
      const msg = error.message?.includes("navigator_requests")
        ? "Navigator system is being enabled — please try again shortly."
        : "Failed to submit request. Please try again.";
      return res.status(500).json({ error: msg });
    }

    if (hasPartnerTable && hasRoutingColumns) {
      autoRouteNewLead(data.id).catch(() => {});
    }

    const response: Record<string, any> = {
      id: data.id,
      status: data.status,
      message: "Your request has been submitted. A navigator will reach out to you soon.",
    };
    if (hasNavLifecycleColumns) {
      response.source = data.source ?? null;
      response.utm_source = data.utm_source ?? null;
      response.utm_medium = data.utm_medium ?? null;
      response.utm_campaign = data.utm_campaign ?? null;
      response.urgency = data.urgency ?? null;
      response.consent_followup = data.consent_followup ?? false;
    }
    return res.status(201).json(response);
  });

  app.get("/api/admin/navigator-requests", requireAdmin, async (req, res) => {
    const { status } = req.query;

    let query = supabase
      .from("navigator_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status as string);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data || []);
  });

  app.patch("/api/admin/navigator-requests/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, admin_notes, assigned_to, outcome, contacted_at, resolved_at, closed_at,
            routed_to_partner_id, routed_at, delivery_status, partner_outcome } = req.body;

    const validStatuses = ["new", "in_progress", "resolved", "cancelled"];
    const validOutcomes = ["connected", "referred", "completed", "no_response", "not_eligible", "declined", "unable_to_contact"];

    const updates: Record<string, any> = {};
    if (status && validStatuses.includes(status)) updates.status = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    if (status === "resolved" && !outcome) {
      return res.status(400).json({ error: "Resolving a lead requires an outcome" });
    }
    if (outcome && status && status !== "resolved") {
      return res.status(400).json({ error: "Outcome can only be set when status is resolved" });
    }

    if (hasNavLifecycleColumns) {
      if (assigned_to !== undefined) updates.assigned_to = assigned_to?.trim() || null;
      if (outcome !== undefined) {
        if (validOutcomes.includes(outcome)) {
          updates.outcome = outcome;
        } else {
          return res.status(400).json({ error: `Invalid outcome. Valid values: ${validOutcomes.join(", ")}` });
        }
      }
      if (contacted_at !== undefined) updates.contacted_at = contacted_at || null;
      if (resolved_at !== undefined) updates.resolved_at = resolved_at || null;
      if (status === "resolved" && !resolved_at) {
        updates.resolved_at = new Date().toISOString();
      }
    }

    if (hasRoutingColumns) {
      if (routed_to_partner_id !== undefined) updates.routed_to_partner_id = routed_to_partner_id || null;
      if (routed_at !== undefined) updates.routed_at = routed_at || null;
      if (delivery_status !== undefined) updates.delivery_status = delivery_status || null;
      if (partner_outcome !== undefined) updates.partner_outcome = partner_outcome || null;
      if (closed_at !== undefined) updates.closed_at = closed_at || null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { data, error } = await supabase
      .from("navigator_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  });

  app.get("/api/admin/partners", requireAdmin, async (_req, res) => {
    if (!hasPartnerTable) return res.json([]);
    const { data, error } = await supabase
      .from("partner_organizations")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  });

  app.post("/api/admin/partners", requireAdmin, async (req, res) => {
    if (!hasPartnerTable) return res.status(503).json({ error: "Partner table not available. Run supabase/create_partner_organizations.sql" });
    const { name, contact_name, contact_email, contact_phone, website_url, state, cities, is_lead_enabled, notes } = req.body;
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "Partner name is required" });
    }
    const row: Record<string, any> = {
      name: name.trim(),
      contact_name: contact_name?.trim() || null,
      contact_email: contact_email?.trim() || null,
      contact_phone: contact_phone?.trim() || null,
      website_url: website_url?.trim() || null,
      state: state?.trim()?.toUpperCase() || null,
      cities: Array.isArray(cities) ? cities : null,
      is_lead_enabled: is_lead_enabled === true,
      notes: notes?.trim() || null,
    };
    const { data, error } = await supabase.from("partner_organizations").insert(row).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  });

  app.patch("/api/admin/partners/:id", requireAdmin, async (req, res) => {
    if (!hasPartnerTable) return res.status(503).json({ error: "Partner table not available" });
    const { id } = req.params;
    const { name, contact_name, contact_email, contact_phone, website_url, state, cities, is_active, is_lead_enabled, notes } = req.body;
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name?.trim() || null;
    if (contact_name !== undefined) updates.contact_name = contact_name?.trim() || null;
    if (contact_email !== undefined) updates.contact_email = contact_email?.trim() || null;
    if (contact_phone !== undefined) updates.contact_phone = contact_phone?.trim() || null;
    if (website_url !== undefined) updates.website_url = website_url?.trim() || null;
    if (state !== undefined) updates.state = state?.trim()?.toUpperCase() || null;
    if (cities !== undefined) updates.cities = Array.isArray(cities) ? cities : null;
    if (is_active !== undefined) updates.is_active = is_active === true;
    if (is_lead_enabled !== undefined) updates.is_lead_enabled = is_lead_enabled === true;
    if (notes !== undefined) updates.notes = notes?.trim() || null;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });
    const { data, error } = await supabase.from("partner_organizations").update(updates).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  });

  app.delete("/api/admin/partners/:id", requireAdmin, async (req, res) => {
    if (!hasPartnerTable) return res.status(503).json({ error: "Partner table not available" });
    const { id } = req.params;
    const { error } = await supabase.from("partner_organizations").update({ is_active: false }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  });

  app.get("/api/admin/partners/:id/rules", requireAdmin, async (req, res) => {
    if (!hasRoutingRulesTable) return res.json([]);
    const { id } = req.params;
    const { data, error } = await supabase
      .from("partner_routing_rules")
      .select("*")
      .eq("partner_id", id)
      .order("priority", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  });

  app.post("/api/admin/partners/:id/rules", requireAdmin, async (req, res) => {
    if (!hasRoutingRulesTable) return res.status(503).json({ error: "Routing rules table not available" });
    const partnerId = req.params.id;
    const { category_slug, subcategory, urgency, state, city, priority, max_leads_per_day } = req.body;
    const validUrgency = ["immediate", "same_week", "standard", "information"];
    const row: Record<string, any> = {
      partner_id: partnerId,
      category_slug: category_slug?.trim() || null,
      subcategory: subcategory?.trim() || null,
      urgency: urgency && validUrgency.includes(urgency) ? urgency : null,
      state: state?.trim()?.toUpperCase() || null,
      city: city?.trim() || null,
      priority: typeof priority === "number" ? priority : 100,
      max_leads_per_day: typeof max_leads_per_day === "number" ? max_leads_per_day : null,
    };
    const { data, error } = await supabase.from("partner_routing_rules").insert(row).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  });

  app.patch("/api/admin/partner-rules/:id", requireAdmin, async (req, res) => {
    if (!hasRoutingRulesTable) return res.status(503).json({ error: "Routing rules table not available" });
    const { id } = req.params;
    const { category_slug, subcategory, urgency, state, city, priority, max_leads_per_day, is_active } = req.body;
    const validUrgency = ["immediate", "same_week", "standard", "information"];
    const updates: Record<string, any> = {};
    if (category_slug !== undefined) updates.category_slug = category_slug?.trim() || null;
    if (subcategory !== undefined) updates.subcategory = subcategory?.trim() || null;
    if (urgency !== undefined) updates.urgency = urgency && validUrgency.includes(urgency) ? urgency : null;
    if (state !== undefined) updates.state = state?.trim()?.toUpperCase() || null;
    if (city !== undefined) updates.city = city?.trim() || null;
    if (priority !== undefined) updates.priority = typeof priority === "number" ? priority : 100;
    if (max_leads_per_day !== undefined) updates.max_leads_per_day = typeof max_leads_per_day === "number" ? max_leads_per_day : null;
    if (is_active !== undefined) updates.is_active = is_active === true;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });
    const { data, error } = await supabase.from("partner_routing_rules").update(updates).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  });

  app.delete("/api/admin/partner-rules/:id", requireAdmin, async (req, res) => {
    if (!hasRoutingRulesTable) return res.status(503).json({ error: "Routing rules table not available" });
    const { id } = req.params;
    const { error } = await supabase.from("partner_routing_rules").update({ is_active: false }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  });

  app.post("/api/admin/leads/:id/reroute", requireAdmin, async (req, res) => {
    if (!hasPartnerTable || !hasRoutingColumns) {
      return res.status(503).json({ error: "Routing not available" });
    }
    const { id } = req.params;
    const { partner_id } = req.body;

    if (partner_id) {
      const { data: partner } = await supabase.from("partner_organizations").select("id, name").eq("id", partner_id).single();
      if (!partner) return res.status(404).json({ error: "Partner not found" });

      const { data: lead } = await supabase.from("navigator_requests").select("routing_history").eq("id", id).single();
      const history = Array.isArray(lead?.routing_history) ? lead.routing_history : [];
      history.push({
        partner_id: partner.id,
        partner_name: partner.name,
        routed_at: new Date().toISOString(),
        delivery_status: "pending",
        manual: true,
      });

      const { error } = await supabase
        .from("navigator_requests")
        .update({
          routed_to_partner_id: partner.id,
          routed_at: new Date().toISOString(),
          delivery_status: "pending",
          routing_history: history,
        })
        .eq("id", id);

      if (error) return res.status(500).json({ error: error.message });

      import("./lead-email").then(({ sendLeadNotification }) => {
        sendLeadNotification(id, partner.id).catch((err) => {
          console.log(`[reroute] Email notification failed for lead ${id}:`, err?.message);
        });
      });

      return res.json({ success: true, partner_name: partner.name });
    }

    const { routeLead } = await import("./lead-router");
    const result = await routeLead(id);
    if (!result.routed) {
      return res.json({ success: true, rerouted: false, message: "No matching partner found" });
    }
    return res.json({ success: true, rerouted: true, partner_name: result.partnerName });
  });

  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    let { data: clicks, error: clicksErr } = await supabase
      .from("resource_clicks")
      .select("id, resource_id, click_type, user_state, user_city, user_zip, created_at");

    if (clicksErr && clicksErr.message.includes("user_zip")) {
      const fallback = await supabase
        .from("resource_clicks")
        .select("id, resource_id, click_type, user_state, user_city, created_at");
      clicks = fallback.data;
      clicksErr = fallback.error;
    }

    const safeClicks = clicksErr ? [] : (clicks || []);

    const { data: resources } = await supabase
      .from("resources")
      .select("id, title, category_id, state, city, sponsored, monetization_type, affiliate_url, categories(name, slug)")
      .eq("status", "approved");

    const resourceMap = new Map<string, any>();
    (resources || []).forEach((r: any) => resourceMap.set(r.id, r));

    const byCategory: Record<string, number> = {};
    const byState: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    const byClickType: Record<string, number> = {};
    const byResource: Record<string, { title: string; clicks: number; category: string; sponsored: boolean }> = {};

    let affiliateClicks = 0;
    let nonAffiliateClicks = 0;
    const totalClicks = safeClicks.length;

    safeClicks.forEach((click: any) => {
      byClickType[click.click_type] = (byClickType[click.click_type] || 0) + 1;

      if (click.user_state) byState[click.user_state] = (byState[click.user_state] || 0) + 1;
      if (click.user_city) byCity[click.user_city] = (byCity[click.user_city] || 0) + 1;

      const r = resourceMap.get(click.resource_id);
      if (r) {
        const catName = r.categories?.name || "Uncategorized";
        byCategory[catName] = (byCategory[catName] || 0) + 1;

        if (!byResource[r.id]) {
          byResource[r.id] = { title: r.title, clicks: 0, category: catName, sponsored: !!r.sponsored };
        }
        byResource[r.id].clicks++;

        if (r.affiliate_url || r.monetization_type === "affiliate") {
          affiliateClicks++;
        } else {
          nonAffiliateClicks++;
        }
      }
    });

    const topResources = Object.entries(byResource)
      .sort((a, b) => b[1].clicks - a[1].clicks)
      .slice(0, 20)
      .map(([id, data]) => ({ id, ...data }));

    const sortedStates = Object.entries(byState)
      .sort((a, b) => b[1] - a[1])
      .map(([state, clicks]) => ({ state, clicks }));

    const sortedCities = Object.entries(byCity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([city, clicks]) => ({ city, clicks }));

    const sortedCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([category, clicks]) => ({ category, clicks }));

    const { count: totalResources } = await supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");

    const { count: pendingResources } = await supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    const { data: reportedResources } = await supabase
      .from("resources")
      .select("id, title, notes_internal, status, state, city")
      .eq("status", "pending")
      .ilike("notes_internal", "%[REPORT%");

    let navRequests: any[] = [];
    try {
      const { data: navData, error: navErr } = await supabase
        .from("navigator_requests")
        .select("id, status, category, subcategory, resource_title, user_state, user_city, created_at");
      if (navErr) console.warn("Navigator stats unavailable:", navErr.message);
      navRequests = navData || [];
    } catch (e: any) {
      console.warn("Navigator stats fetch failed:", e?.message);
    }

    const navByStatus: Record<string, number> = {};
    const navByCategory: Record<string, number> = {};
    const navByState: Record<string, number> = {};
    navRequests.forEach((nr: any) => {
      navByStatus[nr.status || "unknown"] = (navByStatus[nr.status || "unknown"] || 0) + 1;
      if (nr.category) navByCategory[nr.category] = (navByCategory[nr.category] || 0) + 1;
      if (nr.user_state) navByState[nr.user_state] = (navByState[nr.user_state] || 0) + 1;
    });

    return res.json({
      totalClicks,
      totalResources: totalResources || 0,
      pendingResources: pendingResources || 0,
      reportedResources: (reportedResources || []).length,
      affiliateClicks,
      nonAffiliateClicks,
      byClickType,
      byCategory: sortedCategories,
      byState: sortedStates,
      byCity: sortedCities,
      topResources,
      reports: (reportedResources || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        state: r.state,
        city: r.city,
        notes: r.notes_internal,
      })),
      navigatorStats: {
        total: navRequests.length,
        byStatus: navByStatus,
        byCategory: Object.entries(navByCategory)
          .sort((a, b) => b[1] - a[1])
          .map(([category, count]) => ({ category, count })),
        byState: Object.entries(navByState)
          .sort((a, b) => b[1] - a[1])
          .map(([state, count]) => ({ state, count })),
      },
    });
  });

  app.get("/api/admin/states", requireAdmin, async (_req, res) => {
    if (!hasStatesTable) return res.json([]);
    const selectFields = statesHasFullSchema
      ? "*"
      : "code, name, active, created_at";
    const { data, error } = await supabase
      .from("states")
      .select(selectFields)
      .order("name", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    const normalized = (data || []).map((s: any) => ({
      ...s,
      is_active: s.is_active ?? s.active ?? false,
      is_template: s.is_template ?? false,
    }));
    return res.json(normalized);
  });

  app.post("/api/admin/states", requireAdmin, async (req, res) => {
    if (!hasStatesTable) return res.status(503).json({ error: "States table not available. Run supabase/create_states.sql" });
    const { code, name, timezone, admin_contact_name, admin_contact_email, config } = req.body;
    if (!code || !name) return res.status(400).json({ error: "code and name are required" });
    const upperCode = code.toUpperCase().trim();
    if (upperCode.length !== 2) return res.status(400).json({ error: "State code must be 2 characters" });
    const insert: Record<string, any> = {
      code: upperCode,
      name: name.trim(),
    };
    if (statesHasFullSchema) {
      insert.timezone = timezone || "America/New_York";
      insert.admin_contact_name = admin_contact_name || null;
      insert.admin_contact_email = admin_contact_email || null;
      insert.config = config || {};
      insert.is_active = false;
      insert.is_template = false;
    } else {
      insert.active = false;
    }
    const { data, error } = await supabase
      .from("states")
      .insert(insert)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  });

  app.patch("/api/admin/states/:code", requireAdmin, async (req, res) => {
    if (!hasStatesTable) return res.status(503).json({ error: "States table not available" });
    const { code } = req.params;
    const allowedFull = ["name", "is_active", "is_template", "launch_date", "timezone", "admin_contact_name", "admin_contact_email", "config"];
    const allowedSimple = ["name", "active"];
    const allowed = statesHasFullSchema ? allowedFull : allowedSimple;
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (!statesHasFullSchema && req.body.is_active !== undefined) {
      updates.active = req.body.is_active;
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No valid fields to update" });
    const { data, error } = await supabase.from("states").update(updates).eq("code", code.toUpperCase()).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  });

  app.post("/api/admin/states/:code/refresh-counts", requireAdmin, async (req, res) => {
    if (!hasStatesTable) return res.status(503).json({ error: "States table not available" });
    const stateCode = req.params.code.toUpperCase();
    const { data: state, error: stateErr } = await supabase.from("states").select("code").eq("code", stateCode).single();
    if (stateErr || !state) return res.status(404).json({ error: "State not found" });

    const { count: resourceCount } = await supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("state", stateCode)
      .eq("status", "approved");

    let partnerCount = 0;
    if (hasPartnerTable) {
      const { count } = await supabase
        .from("partner_organizations")
        .select("id", { count: "exact", head: true })
        .eq("state", stateCode)
        .eq("is_active", true);
      partnerCount = count || 0;
    }

    const updateFields: Record<string, any> = statesHasFullSchema
      ? { resource_count: resourceCount || 0, partner_count: partnerCount }
      : {};

    if (Object.keys(updateFields).length > 0) {
      await supabase.from("states").update(updateFields).eq("code", stateCode);
    }

    return res.json({
      code: stateCode,
      resource_count: resourceCount || 0,
      partner_count: partnerCount,
    });
  });

  app.get("/api/states/active", async (_req, res) => {
    if (!hasStatesTable) return res.json([]);
    const activeField = statesHasFullSchema ? "is_active" : "active";
    const selectFields = statesHasFullSchema ? "code, name, timezone" : "code, name";
    const { data, error } = await supabase
      .from("states")
      .select(selectFields)
      .eq(activeField, true)
      .order("name", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  });

  return httpServer;
}
