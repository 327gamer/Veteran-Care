/**
 * Georgia Phase 6 prep — full audit against the SC/NC Phase 5+6 standard.
 * Read-only: no writes. Outputs the complete picture so we know what to fix.
 */
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 1) Pull all GA rows (paginated)
const all = []; let from = 0;
while (true) {
  const { data, error } = await sb.from("resources")
    .select("id,title,address,city,state,zip,latitude,longitude,status,category_id,subcategory,website_url,phone,short_description,geo_source,created_at")
    .eq("state","GA").range(from, from + 999);
  if (error) { console.error(error); process.exit(1); }
  all.push(...data); if (data.length < 1000) break; from += 1000;
}
const approved = all.filter(r => r.status === "approved");
const pending  = all.filter(r => r.status === "pending");
const archived = all.filter(r => r.status === "archived");
console.log(`==== GEORGIA PHASE 6 AUDIT ====`);
console.log(`Total GA rows: ${all.length}  approved=${approved.length}  pending=${pending.length}  archived=${archived.length}`);

// 2) Categories
const { data: cats } = await sb.from("categories").select("id,slug,name");
const slugById = new Map(cats.map(c => [c.id, c.slug]));
const catCounts = new Map();
approved.forEach(r => {
  const slug = slugById.get(r.category_id) || "?";
  catCounts.set(slug, (catCounts.get(slug) || 0) + 1);
});
console.log(`\n--- Category totals (approved) ---`);
[...catCounts.entries()].sort((a,b)=>b[1]-a[1]).forEach(([s,n])=>{
  const tag = n < 30 ? "  WEAK <30" : "";
  console.log(`  ${String(n).padStart(4)}  ${s.padEnd(22)}${tag}`);
});

// 3) Cities
const cities = new Map();
approved.forEach(r => {
  if (!r.city) return;
  cities.set(r.city, (cities.get(r.city) || 0) + 1);
});
console.log(`\nDistinct cities (approved): ${cities.size}`);
const noCityApproved = approved.filter(r => !r.city).length;
console.log(`No-city approved (statewide): ${noCityApproved}`);

// 4) Top cities
console.log(`\n--- Top 20 cities ---`);
[...cities.entries()].sort((a,b)=>b[1]-a[1]).slice(0,20).forEach(([c,n])=>console.log(`  ${String(n).padStart(3)}  ${c}`));

// 5) Thin cities (1-2 rows)
const thin = [...cities.entries()].filter(([,n]) => n <= 2);
console.log(`\nThin cities (1-2 rows): ${thin.length}`);

// 6) Exact dups (title+city, lowercased+trimmed)
const seen = new Map();
const exactDups = [];
for (const r of approved) {
  const k = `${(r.title||"").toLowerCase().trim()}|${(r.city||"").toLowerCase().trim()}`;
  if (seen.has(k)) exactDups.push({a:seen.get(k), b:r});
  else seen.set(k, r);
}
console.log(`\n--- Exact duplicates (title+city): ${exactDups.length} ---`);
exactDups.slice(0,10).forEach(({a,b})=>console.log(`  ${a.title} | city=${a.city||"-"}  vs  ${b.id.substring(0,8)}`));

// 7) Near-dups via normalizeTitle
function normalizeTitle(t) {
  return (t||"").toLowerCase().trim().replace(/[—–-].*$/u, "").replace(/\s*\(.*\)\s*$/u, "").replace(/\s+/g, " ").trim();
}
const normMap = new Map();
const nearDups = [];
for (const r of approved) {
  const n = normalizeTitle(r.title);
  const k = `${n}|${(r.city||"").toLowerCase().trim()}`;
  if (normMap.has(k)) nearDups.push({a:normMap.get(k), b:r});
  else normMap.set(k, r);
}
console.log(`\n--- Near-duplicates (norm-prefix+city): ${nearDups.length} ---`);
nearDups.slice(0,15).forEach(({a,b})=>console.log(`  [${a.id.substring(0,8)}] "${a.title}"  vs  [${b.id.substring(0,8)}] "${b.title}"  city=${a.city||"-"}`));

// 8) Wrong-state bleed (excluding GA itself)
const otherStates = ["NC","FL","TN","VA","AL","SC","KY","WV","DC","MD","OH"];
const bleed = approved.filter(r => {
  const a = ((r.title||"")+" "+(r.address||"")).toUpperCase();
  return otherStates.some(s => a.match(new RegExp(`,\\s*${s}\\b`)) || a.match(new RegExp(`\\b${s}\\s+\\d{5}\\b`)));
});
console.log(`\n--- Wrong-state bleed (title+address scan, GA excluded): ${bleed.length} ---`);
bleed.slice(0,10).forEach(r=>console.log(`  [${r.id.substring(0,8)}] ${r.city||"-"}  ${r.title}\n        ${r.address||""}`));

// 9) Geometry
const noLatLng = approved.filter(r => r.city && (!r.latitude || !r.longitude));
const badLatLng = approved.filter(r => r.latitude && (r.latitude < 30.3 || r.latitude > 35.0 || r.longitude > -80.8 || r.longitude < -85.6));
console.log(`\n--- Geometry: city-but-no-coords=${noLatLng.length}  outside-GA-bbox=${badLatLng.length} ---`);
noLatLng.slice(0,10).forEach(r=>console.log(`  [${r.id.substring(0,8)}] ${r.city}  | ${r.address||"(no addr)"} | ${(r.title||"").substring(0,55)}`));
badLatLng.slice(0,5).forEach(r=>console.log(`  [BBOX] [${r.id.substring(0,8)}] ${r.city||"-"}  lat=${r.latitude} lng=${r.longitude}  ${r.title}`));

// 10) Statewide semantic gate — no-city rows MUST have NULL coords
const ncWithCoords = approved.filter(r => !r.city && (r.latitude || r.longitude));
console.log(`\n--- Statewide semantic gate (HARD-FAIL conditions) ---`);
console.log(`  no-city rows that violate (have coords): ${ncWithCoords.length}`);
ncWithCoords.slice(0,5).forEach(r=>console.log(`  [${r.id.substring(0,8)}] ${r.title}  lat=${r.latitude} lng=${r.longitude}`));

// 11) URL sanity
const noUrl = approved.filter(r => !r.website_url || !r.website_url.startsWith("http"));
const noPhone = approved.filter(r => !r.phone);
const noDesc = approved.filter(r => !r.short_description || r.short_description.length < 30);
console.log(`\n--- Content completeness ---`);
console.log(`  Missing/bad URL: ${noUrl.length}`);
console.log(`  Missing phone: ${noPhone.length}`);
console.log(`  Missing or thin description (<30 chars): ${noDesc.length}`);

// 12) Junctions sanity
const ids = approved.map(r => r.id);
const junc = []; from = 0;
while (true) {
  const { data, error } = await sb.from("resource_categories")
    .select("resource_id,category_id").in("resource_id", ids.slice(from, from+1000));
  if (error) { console.error(error); break; }
  if (!data) break;
  junc.push(...data);
  if (from + 1000 >= ids.length) break;
  from += 1000;
}
const orphanJunc = ids.filter(id => !junc.find(j => j.resource_id === id));
console.log(`\n--- Junctions: total=${junc.length}  GA approved without junction: ${orphanJunc.length} ---`);

console.log(`\n==== SUMMARY ====`);
console.log(`  Rows: ${approved.length} approved / ${pending.length} pending / ${archived.length} archived`);
console.log(`  Cats: ${[...catCounts.entries()].filter(([,n])=>n>=30).length} of ${catCounts.size} ≥30 floor`);
console.log(`  Cities: ${cities.size} distinct, ${noCityApproved} statewide`);
console.log(`  Issues: ${exactDups.length} exact dups, ${nearDups.length} near-dups, ${bleed.length} bleed, ${noLatLng.length} no-coord, ${badLatLng.length} out-of-bbox, ${noUrl.length} bad-url`);
