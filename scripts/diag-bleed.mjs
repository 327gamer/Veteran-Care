import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

console.log("=== All housing subcategories in DB ===");
const { data: hsubs } = await sb.from("subcategories").select("slug, name").or("slug.ilike.%housing%,slug.ilike.%homeless%,slug.ilike.%shelter%,slug.ilike.%rental%,slug.ilike.%emergency%");
for (const s of hsubs || []) console.log(" -", s.slug, "|", s.name);

console.log("\n=== SC housing rows + subs ===");
const { data: sc } = await sb.from("resources")
  .select("title, city, resource_categories(categories(slug)), resource_subcategories(subcategories(slug))")
  .eq("state", "SC");
const scH = (sc || []).filter(r => r.resource_categories?.some(rc => rc.categories?.slug === "housing"));
console.log("SC housing count:", scH.length);
for (const r of scH.slice(0, 6)) console.log(" -", r.title, "| subs="+JSON.stringify(r.resource_subcategories?.map(rs=>rs.subcategories?.slug)));

console.log("\n=== Reproduce bug: /api/resources?state=GA&city=Atlanta&category=housing-home&sub=emergency-housing ===");
const r1 = await fetch("http://localhost:5000/api/resources?state=GA&city=Atlanta&category=housing-home&sub=emergency-housing&limit=5");
const j1 = await r1.json();
console.log("Primary query returned:", j1.length, "rows");
j1.slice(0,5).forEach(x => console.log(" -", x.title, "| state="+x.state));

console.log("\n=== Fallback query (what page calls when primary=0): /api/resources?category=housing-home ===");
const r2 = await fetch("http://localhost:5000/api/resources?category=housing-home&limit=20");
const j2 = await r2.json();
const stateBreakdown = {};
for (const x of j2) stateBreakdown[x.state || '(natl)'] = (stateBreakdown[x.state || '(natl)'] || 0) + 1;
console.log("Fallback returned:", j2.length, "| state breakdown:", stateBreakdown);
console.log("First 8 fallback rows (this is what bleeds into the GA view):");
j2.slice(0,8).forEach(x => console.log(" -", x.title, "| state="+x.state, "| city="+x.city));
