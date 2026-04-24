import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const STATE = "SC";

const { data: rows, error } = await sb.from("resources").select("id, title, city, state, status").eq("state", STATE).eq("status", "approved").range(0, 9999);
if (error) { console.error("ERR rows:", error); process.exit(1); }
console.log(`SC approved: ${rows.length}`);

const cityCount = {};
const noCityRows = [];
for (const r of rows) {
  const c = (r.city || "").trim();
  if (!c) noCityRows.push(r); else cityCount[c] = (cityCount[c] || 0) + 1;
}
console.log(`Distinct cities: ${Object.keys(cityCount).length}`);
console.log(`Rows missing city: ${noCityRows.length}`);

console.log("\n=== TOP 30 CITIES ===");
const sorted = Object.entries(cityCount).sort((a,b)=>b[1]-a[1]);
sorted.slice(0,30).forEach(([c,n])=>console.log(`${String(n).padStart(4)}  ${c}`));

console.log("\n=== 1-ROW CITIES ===");
sorted.filter(([,n])=>n===1).forEach(([c])=>console.log(`  ${c}`));

console.log("\n=== ALL NO-CITY ROWS ===");
noCityRows.forEach(r=>console.log(`  [${String(r.id).padStart(5)}] ${(r.title||"").substring(0,100)}`));

const ids = rows.map(r=>r.id);
const { data: junc, error: je } = await sb.from("resource_categories").select("resource_id, category_id").range(0, 99999);
if (je) { console.error("ERR junc:", je); process.exit(1); }
const { data: cats } = await sb.from("categories").select("id, slug, name");
const slugById = Object.fromEntries(cats.map(c=>[c.id,c.slug]));
const idSet = new Set(ids);
const catCount = {};
for (const j of junc) {
  if (!idSet.has(j.resource_id)) continue;
  const slug = slugById[j.category_id];
  catCount[slug] = (catCount[slug] || 0) + 1;
}
console.log("\n=== CATEGORIES ===");
Object.entries(catCount).sort((a,b)=>b[1]-a[1]).forEach(([c,n])=>console.log(`${String(n).padStart(4)}  ${c}`));
