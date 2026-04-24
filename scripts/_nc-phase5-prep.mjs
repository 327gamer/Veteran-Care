import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: all } = await sb.from("resources")
  .select("id, status, city, category_id, latitude, longitude, address, title")
  .eq("state","NC").range(0,9999);
const approved = all.filter(r=>r.status==="approved");
const pending  = all.filter(r=>r.status==="pending");
const archived = all.filter(r=>r.status==="archived");
const noCity = approved.filter(r=>!r.city);

console.log(`NC totals: approved=${approved.length}  pending=${pending.length}  archived=${archived.length}`);
console.log(`No-city approved (statewide): ${noCity.length}`);

// 32 no-city rows: how many have coords (semantic violations per SC SOP)?
const ncWithCoords = noCity.filter(r => r.latitude || r.longitude);
console.log(`  no-city WITH coords (SOP violation, must clear): ${ncWithCoords.length}`);
console.log(`  no-city without coords (correct statewide): ${noCity.length - ncWithCoords.length}`);

// Top cities
const cityCount = {};
approved.filter(r=>r.city).forEach(r=>{ cityCount[r.city]=(cityCount[r.city]||0)+1; });
const sortedCities = Object.entries(cityCount).sort((a,b)=>b[1]-a[1]);
console.log(`\nDistinct cities: ${sortedCities.length}`);
console.log(`\nTop 25 NC CITIES:`);
sortedCities.slice(0,25).forEach(([c,n])=>console.log(`  ${String(n).padStart(4)}  ${c}`));

console.log(`\nTHIN CITIES (1-2 rows) — count: ${sortedCities.filter(([c,n])=>n<=2).length}`);
console.log(`MEDIUM CITIES (3-5 rows) — count: ${sortedCities.filter(([c,n])=>n>=3 && n<=5).length}`);

// Categories
const { data: cats } = await sb.from("categories").select("id, slug, name").order("slug");
const catCount = {};
approved.forEach(r => { catCount[r.category_id] = (catCount[r.category_id]||0)+1; });
console.log(`\nCATEGORY TOTALS (target floor = 30):`);
const FLOOR = 30;
const weak = [];
cats.forEach(c => {
  const n = catCount[c.id]||0;
  if (n < FLOOR) weak.push(c.slug);
  console.log(`  ${String(n).padStart(4)}  ${c.slug.padEnd(22)} ${n<FLOOR ? `WEAK <${FLOOR}` : "OK"}`);
});
console.log(`\nWEAK CATS NEEDING LIFT: ${weak.length} → ${weak.join(", ")}`);

// Metro depth check
const metros = ["Charlotte","Raleigh","Durham","Greensboro","Winston-Salem","Wilmington","Asheville","Fayetteville"];
console.log(`\nMETROS to deepen:`);
metros.forEach(m => console.log(`  ${m}: ${cityCount[m]||0}`));

// Subcategories needed
console.log(`\n=== Per-cat subcategory dump (first 6 cats) ===`);
for (const c of cats.slice(0, 17)) {
  const { data: subs } = await sb.from("subcategories").select("name").eq("category_id", c.id).order("name");
  console.log(`${c.slug}: ${subs.map(s=>s.name).join(" | ")}`);
}
