#!/usr/bin/env node
/**
 * GA Phase 6 — Final QA Gate
 *
 * Same hard-fail standard the SC Phase 6 / NC Phase 5 closeouts used. Bleed
 * detector excludes the audited state from its own otherStates list (the
 * latent self-state bug NC Phase 5 fixed inline; future tech-debt task
 * generalizes a shared helper).
 *
 * Run:
 *   tsx scripts/_ga-phase6-qa.mjs
 */
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const STATE = "GA";
const ALL_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
const otherStates = ALL_STATES.filter(s => s !== STATE);

// 1. Pull all GA approved (paginated)
const all = []; let from = 0;
while (true) {
  const { data, error } = await sb.from("resources")
    .select("id,title,address,city,state,zip,latitude,longitude,status,category_id,subcategory,website_url,phone,short_description,geo_source")
    .eq("state", STATE).eq("status","approved").range(from, from + 999);
  if (error) { console.error(error); process.exit(1); }
  all.push(...data); if (data.length < 1000) break; from += 1000;
}

console.log(`==== GA PHASE 6 QA GATE ====\n`);
console.log(`Total approved GA rows: ${all.length}\n`);

// 2. Categories
const { data: cats } = await sb.from("categories").select("id,slug,name");
const slugById = new Map(cats.map(c => [c.id, c.slug]));
const catCounts = new Map();
all.forEach(r => {
  const slug = slugById.get(r.category_id) || "?";
  catCounts.set(slug, (catCounts.get(slug) || 0) + 1);
});
console.log(`--- Category totals ---`);
const sorted = [...catCounts.entries()].sort((a,b)=>b[1]-a[1]);
sorted.forEach(([s,n])=>{
  const tag = n < 30 ? "  WEAK <30" : "";
  console.log(`  ${String(n).padStart(4)}  ${s.padEnd(22)}${tag}`);
});
const aboveFloor = sorted.filter(([,n])=>n>=30).length;

// 3. Cities
const cities = new Map();
all.forEach(r => { if (r.city) cities.set(r.city, (cities.get(r.city) || 0) + 1); });
const noCityRows = all.filter(r => !r.city).length;
console.log(`\nDistinct cities: ${cities.size}, statewide rows: ${noCityRows}`);
console.log(`\n--- Top 12 cities ---`);
[...cities.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12).forEach(([c,n])=>console.log(`  ${String(n).padStart(3)}  ${c}`));

// 4. Exact dups
const seen = new Map();
const exactDups = [];
for (const r of all) {
  const k = `${(r.title||"").toLowerCase().trim()}|${(r.city||"").toLowerCase().trim()}`;
  if (seen.has(k)) exactDups.push({a:seen.get(k), b:r}); else seen.set(k, r);
}

// 5. Near-dups via normalizeTitle
function normalizeTitle(t) {
  return (t||"").toLowerCase().trim().replace(/[—–-].*$/u, "").replace(/\s*\(.*\)\s*$/u, "").replace(/\s+/g, " ").trim();
}
const normMap = new Map();
const nearDups = [];
for (const r of all) {
  const n = normalizeTitle(r.title);
  const k = `${n}|${(r.city||"").toLowerCase().trim()}`;
  if (normMap.has(k)) nearDups.push({a:normMap.get(k), b:r}); else normMap.set(k, r);
}

// 6. Wrong-state bleed (GA excluded from otherStates)
const bleed = all.filter(r => {
  const a = ((r.title||"")+" "+(r.address||"")).toUpperCase();
  return otherStates.some(s => a.match(new RegExp(`,\\s*${s}\\b`)) || a.match(new RegExp(`\\b${s}\\s+\\d{5}\\b`)));
});

// 7. Coords + bbox
const noLatLng = all.filter(r => r.city && (!r.latitude || !r.longitude));
const badLatLng = all.filter(r => r.latitude && (r.latitude < 30.3 || r.latitude > 35.0 || r.longitude > -80.8 || r.longitude < -85.6));

// 8. Statewide semantic gate — no-city rows must NOT have coords
const ncWithCoords = all.filter(r => !r.city && (r.latitude || r.longitude));

// 9. Content completeness
const noUrl = all.filter(r => !r.website_url || !r.website_url.startsWith("http"));
const noPhone = all.filter(r => !r.phone);
const noDesc = all.filter(r => !r.short_description || r.short_description.length < 30);

// 10. Junctions (batched)
const ids = all.map(r=>r.id);
const have = new Set();
for (let i = 0; i < ids.length; i += 200) {
  const slice = ids.slice(i, i+200);
  const { data } = await sb.from("resource_categories").select("resource_id").in("resource_id", slice);
  data?.forEach(j => have.add(j.resource_id));
}
const orphanJunc = ids.filter(id => !have.has(id));

// 11. geo_source breakdown (informational)
const gsCount = {};
all.forEach(r => { const k = r.geo_source || "(null)"; gsCount[k] = (gsCount[k]||0)+1; });

console.log(`\n==== GATE RESULTS ====`);
const fails = [];
const warns = [];
const check = (label, val, hardFail = true) => {
  const ok = val === 0;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}: ${val}`);
  if (!ok && hardFail) fails.push(`${label}=${val}`);
  if (!ok && !hardFail) warns.push(`${label}=${val}`);
};
check("Exact duplicates", exactDups.length);
check("Near-duplicates (informational)", nearDups.length, false);
check("Wrong-state bleed", bleed.length);
check("City-but-no-coords", noLatLng.length);
check("Outside-GA bbox", badLatLng.length);
check("Statewide rows with coords (HARD)", ncWithCoords.length);
check("Missing URL", noUrl.length);
check("Missing phone", noPhone.length);
check("Thin description (<30)", noDesc.length);
check("Orphan junctions", orphanJunc.length);

console.log(`\n--- geo_source breakdown ---`);
Object.entries(gsCount).forEach(([k,n])=>console.log(`  ${String(n).padStart(4)}  ${k}`));

if (nearDups.length > 0) {
  console.log(`\n--- Near-dups (info-only) ---`);
  nearDups.slice(0,12).forEach(({a,b})=>console.log(`  [${a.id.substring(0,8)}] ${a.title}  ~~  [${b.id.substring(0,8)}] ${b.title}`));
}
if (bleed.length > 0) {
  console.log(`\n--- Bleed details ---`);
  bleed.forEach(r => console.log(`  [${r.id.substring(0,8)}] ${r.title}\n        ${r.address || "-"}`));
}
if (noLatLng.length > 0) {
  console.log(`\n--- Missing-coord details ---`);
  noLatLng.forEach(r => console.log(`  [${r.id.substring(0,8)}] ${r.city}  | ${r.address||"-"}`));
}

console.log(`\n==== FINAL VERDICT ====`);
console.log(`  Rows: ${all.length}  Cities: ${cities.size}  Statewide: ${noCityRows}`);
console.log(`  Categories ≥30 floor: ${aboveFloor} of ${catCounts.size}`);
if (fails.length) {
  console.log(`  >>> FAIL: ${fails.join(", ")}`);
  process.exit(1);
} else {
  console.log(`  >>> PASS  (${warns.length ? "warns: "+warns.join(", ") : "no warnings"})`);
}
