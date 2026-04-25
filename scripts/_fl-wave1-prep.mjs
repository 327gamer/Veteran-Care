/**
 * Florida Wave 1 prep — read-only audit of current FL coverage so
 * we know exactly what to build. Mirrors GA Phase 6 prep.
 */
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const all = []; let from = 0;
while (true) {
  const { data, error } = await sb.from("resources")
    .select("id,title,address,city,state,zip,latitude,longitude,status,category_id,subcategory,website_url,phone,short_description,geo_source,created_at")
    .eq("state","FL").range(from, from + 999);
  if (error) { console.error(error); process.exit(1); }
  all.push(...data); if (data.length < 1000) break; from += 1000;
}
const approved = all.filter(r => r.status === "approved");
const pending  = all.filter(r => r.status === "pending");
const archived = all.filter(r => r.status === "archived");

console.log(`==== FLORIDA WAVE 1 PREP AUDIT ====`);
console.log(`Total FL rows: ${all.length}  approved=${approved.length}  pending=${pending.length}  archived=${archived.length}`);

const { data: cats } = await sb.from("categories").select("id,slug,name");
const slugById = new Map(cats.map(c => [c.id, c.slug]));
const catCounts = new Map();
approved.forEach(r => {
  const slug = slugById.get(r.category_id) || "?";
  catCounts.set(slug, (catCounts.get(slug) || 0) + 1);
});
console.log(`\nCategory counts (approved):`);
[...catCounts.entries()].sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`  ${k.padEnd(28)} ${v}`));

const cityCounts = new Map();
approved.forEach(r => {
  if (r.city) cityCounts.set(r.city, (cityCounts.get(r.city) || 0) + 1);
});
console.log(`\nCities (approved): ${cityCounts.size}`);
console.log(`Top cities:`);
[...cityCounts.entries()].sort((a,b) => b[1]-a[1]).slice(0, 25).forEach(([k,v]) => console.log(`  ${k.padEnd(28)} ${v}`));

const noCity = approved.filter(r => !r.city);
const noCoords = approved.filter(r => r.latitude == null || r.longitude == null);
const noUrl = approved.filter(r => !r.website_url);
const noPhone = approved.filter(r => !r.phone);
const thinDesc = approved.filter(r => !r.short_description || r.short_description.length < 30);
console.log(`\nQuality flags (approved):`);
console.log(`  no city:       ${noCity.length}`);
console.log(`  no coords:     ${noCoords.length}`);
console.log(`  no URL:        ${noUrl.length}`);
console.log(`  no phone:      ${noPhone.length}`);
console.log(`  thin desc:     ${thinDesc.length}`);

const dupKey = new Map();
approved.forEach(r => {
  const k = `${(r.title||"").toLowerCase().trim()}|${(r.city||"").toLowerCase().trim()}`;
  dupKey.set(k, (dupKey.get(k) || 0) + 1);
});
const dups = [...dupKey.entries()].filter(([_,v]) => v > 1);
console.log(`  exact dups:    ${dups.length}`);

console.log(`\nSample 10 existing rows:`);
approved.slice(0, 10).forEach(r => console.log(`  [${slugById.get(r.category_id)?.padEnd(22)}] ${r.title} — ${r.city || "(no city)"}`));
