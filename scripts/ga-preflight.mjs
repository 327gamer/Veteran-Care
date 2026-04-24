import { createClient } from "@supabase/supabase-js";
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key, { auth: { persistSession: false } });

const { data: cats } = await sb.from("categories").select("id, slug, name").order("slug");
const { data: subs } = await sb.from("subcategories").select("id, name, category_id");
const subsByCatId = new Map();
(subs || []).forEach(s => {
  if (!subsByCatId.has(s.category_id)) subsByCatId.set(s.category_id, []);
  subsByCatId.get(s.category_id).push(s.name);
});

const { data: gaExisting } = await sb.from("resources").select("id, title, city, status").eq("state", "GA");
const { data: nationalCount } = await sb.from("resources").select("id", { count: "exact", head: true }).is("state", null);

console.log("\n=== TAXONOMY (legacy slug → subs) ===");
for (const c of cats) {
  const list = (subsByCatId.get(c.id) || []).sort();
  console.log(`\n[${c.slug}] (${c.name}) — ${list.length} subs`);
  list.forEach(n => console.log(`   • ${n}`));
}

console.log("\n=== EXISTING GA ROWS ===");
console.log(`Total GA rows in DB: ${gaExisting?.length || 0}`);
if (gaExisting?.length) {
  const byStatus = {};
  gaExisting.forEach(r => { byStatus[r.status || "null"] = (byStatus[r.status || "null"] || 0) + 1; });
  console.log("By status:", byStatus);
  const byCity = {};
  gaExisting.forEach(r => { byCity[r.city || "(none)"] = (byCity[r.city || "(none)"] || 0) + 1; });
  console.log("By city:", byCity);
}
