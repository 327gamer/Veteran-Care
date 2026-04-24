// SC Phase 6 — Final closeout QA. Hard-fail on SOP violations.
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log("==== SC PHASE 6 FINAL QA ====\n");

// 1) Pull SC rows WITH address (architect fix: address was missing → bleed check was a no-op)
const { data: all, error: aerr } = await sb.from("resources")
  .select("id, status, city, state, title, category_id, latitude, longitude, website_url, address")
  .eq("state","SC").range(0,9999);
if (aerr) { console.error("err:", aerr); process.exit(1); }

const approved = all.filter(r=>r.status==="approved");
const pending  = all.filter(r=>r.status==="pending");
const archived = all.filter(r=>r.status==="archived");
const cities = new Set(approved.filter(r=>r.city).map(r=>r.city));
const noCity = approved.filter(r=>!r.city);
console.log(`SC totals: approved=${approved.length}  pending=${pending.length}  archived=${archived.length}`);
console.log(`Distinct cities: ${cities.size}    No-city approved (statewide): ${noCity.length}`);

// 2) CATEGORY TOTALS
const { data: cats } = await sb.from("categories").select("id, slug, name").order("slug");
const catCount = {};
approved.forEach(r => { catCount[r.category_id] = (catCount[r.category_id]||0)+1; });
console.log("\n--- Category totals (approved) ---");
const FLOOR = 30;
const weak = [];
cats.forEach(c => {
  const n = catCount[c.id]||0;
  if (n < FLOOR) weak.push({slug:c.slug,n});
  console.log(`  ${String(n).padStart(4)}  ${c.slug.padEnd(22)} ${n<FLOOR ? `WEAK <${FLOOR}` : "OK"}`);
});

// 3) EXACT DUPS
const titleKey = r => `${(r.title||"").trim().toLowerCase()}|${(r.city||"").trim().toLowerCase()}`;
const titleMap = {};
approved.forEach(r => { (titleMap[titleKey(r)] ||= []).push(r); });
const exactDups = Object.entries(titleMap).filter(([_,v])=>v.length>1);
console.log(`\n--- Exact duplicates (title+city): ${exactDups.length} ---`);
exactDups.slice(0,10).forEach(([k,v])=>console.log(`  x${v.length}  ${k}`));

// 4) NEAR-DUPS (informational)
const norm = t => (t||"").split(/[—–-]/)[0].trim().toLowerCase().replace(/\s*\([^)]*\)\s*/g,"").trim();
const nearMap = {};
approved.forEach(r => {
  const k = `${norm(r.title)}|${(r.city||"").toLowerCase()}`;
  (nearMap[k] ||= []).push(r);
});
const nearDups = Object.entries(nearMap).filter(([_,v])=>v.length>1);
console.log(`--- Near-duplicates (norm-prefix+city, informational): ${nearDups.length} ---`);

// 5) ORPHAN JUNCTION (architect fix v2: paginated — Supabase silently caps at 1000 rows)
async function paginate(table, select) {
  const arr = []; const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb.from(table).select(select).range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    arr.push(...data);
    if (data.length < PAGE) break;
  }
  return arr;
}
const allResFull = await paginate("resources", "id");
const globalResIds = new Set(allResFull.map(r=>r.id));
const globalCatIds = new Set(cats.map(c=>c.id));
const scResIds = new Set(all.map(r=>r.id));
const allJunc = await paginate("resource_categories", "resource_id, category_id");
const scJunc = allJunc.filter(j => scResIds.has(j.resource_id));
const orphanRes = scJunc.filter(j => !globalResIds.has(j.resource_id));
const orphanCat = scJunc.filter(j => !globalCatIds.has(j.category_id));
const globalOrphanRes = allJunc.filter(j => !globalResIds.has(j.resource_id));
console.log(`\n--- Orphan junction (SC scope): res-missing=${orphanRes.length}  cat-missing=${orphanCat.length} ---`);
console.log(`    (db total: resources=${allResFull.length}  junctions=${allJunc.length}  global-orphan-res=${globalOrphanRes.length})`);

// 6) WRONG-STATE BLEED — now fixed: title + ADDRESS scanned
const otherStates = ["GA","NC","FL","TN","VA","AL","KY","WV","DC","MD","OH"];
const bleed = approved.filter(r => {
  const a = (r.title+" "+(r.address||"")).toUpperCase();
  return otherStates.some(s => a.match(new RegExp(`,\\s*${s}\\b`)) || a.match(new RegExp(`\\b${s}\\s+\\d{5}\\b`)));
});
console.log(`--- Wrong-state bleed (title+address scan): ${bleed.length} ---`);
bleed.slice(0,8).forEach(r=>console.log(`  [${r.id.substring(0,8)}] ${r.city||"-"}  ${r.title}\n        ${r.address||""}`));

// 7) GEOMETRY
const noLatLng = approved.filter(r => r.city && (!r.latitude || !r.longitude));
const badLatLng = approved.filter(r => r.latitude && (r.latitude < 32 || r.latitude > 35.3 || r.longitude > -78 || r.longitude < -83.5));
console.log(`--- Geometry: city-but-no-coords=${noLatLng.length}  outside-SC-bbox=${badLatLng.length} ---`);
badLatLng.slice(0,5).forEach(r=>console.log(`  [${r.id.substring(0,8)}] ${r.city}  lat=${r.latitude} lng=${r.longitude}  ${r.title}`));

// 8) STATEWIDE SEMANTIC GATE — HARD FAIL if no-city rows have a city or coords
//    (architect requirement: statewide rows MUST have city=NULL AND coords=NULL
//    so client at resources.tsx renders them as "Available statewide" and excludes
//    them from distance-ranked near-me sorting)
const ncWithCoords = noCity.filter(r => r.latitude || r.longitude);
const ncWithCity   = noCity.filter(r => r.city);  // can never happen by definition
console.log(`\n--- Statewide semantic gate (HARD-FAIL conditions) ---`);
console.log(`  no-city rows that violate (have city OR coords): ${ncWithCoords.length + ncWithCity.length}`);
ncWithCoords.slice(0,8).forEach(r=>console.log(`  VIOLATION [${r.id.substring(0,8)}]  city=${r.city}  lat=${r.latitude} lng=${r.longitude}  ${r.title}`));

// 9) TOP 15 CITIES
const cityCount = {};
approved.filter(r=>r.city).forEach(r=>{ cityCount[r.city]=(cityCount[r.city]||0)+1; });
console.log(`\n=== TOP 15 SC CITIES ===`);
Object.entries(cityCount).sort((a,b)=>b[1]-a[1]).slice(0,15).forEach(([c,n])=>console.log(`  ${String(n).padStart(4)}  ${c}`));

// 10) WEAK SUMMARY
console.log(`\n=== WEAK CATEGORY SUMMARY ===`);
if (weak.length === 0) console.log(`  All categories ≥ ${FLOOR} rows`);
else weak.forEach(w=>console.log(`  ${w.slug}: ${w.n}`));

// 11) FINAL VERDICT — hard-fail gates (architect requirement: closeout = SOP gates,
//     not informational counts; weak-cat floors must enforce; orphan check must
//     use the GLOBAL orphan signal, not the SC-scoped one which is tautological)
const insN = catCount[cats.find(c=>c.slug==="insurance").id]||0;
const finN = catCount[cats.find(c=>c.slug==="financial").id]||0;
const criN = catCount[cats.find(c=>c.slug==="crisis-help").id]||0;
const fails = [];
if (exactDups.length > 0) fails.push(`${exactDups.length} exact dups`);
if (globalOrphanRes.length > 0) fails.push(`${globalOrphanRes.length} GLOBAL orphan-res junctions`);
if (orphanCat.length > 0) fails.push(`${orphanCat.length} SC orphan-cat junctions`);
if (bleed.length > 0) fails.push(`${bleed.length} wrong-state bleed`);
if (badLatLng.length > 0) fails.push(`${badLatLng.length} outside-SC-bbox`);
if (noLatLng.length > 0) fails.push(`${noLatLng.length} city-but-no-coords`);
if (ncWithCoords.length + ncWithCity.length > 0) fails.push(`${ncWithCoords.length + ncWithCity.length} statewide-semantic-violations`);
if (insN < FLOOR) fails.push(`Phase 6 target insurance=${insN} (<${FLOOR})`);
if (finN < FLOOR) fails.push(`Phase 6 target financial=${finN} (<${FLOOR})`);
if (criN < FLOOR) fails.push(`Phase 6 target crisis-help=${criN} (<${FLOOR})`);
console.log(`\n=== FINAL VERDICT ===`);
console.log(fails.length === 0 ? "  PASS — no SOP violations" : `  FAIL — ${fails.join(", ")}`);
console.log(`  Target weak cats (Phase 6): insurance=${insN}  financial=${finN}  crisis-help=${criN}`);
console.log(`  Note: SC-scoped orphan-res check is tautological (scJunc is built FROM scResIds);`);
console.log(`        only globalOrphanRes is authoritative — included in fails[] above.`);
