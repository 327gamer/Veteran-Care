import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function auditState(state) {
  const { data: rows } = await sb
    .from("resources")
    .select("id, title, city, status")
    .eq("state", state)
    .eq("status", "approved");

  const byCity = {};
  for (const r of rows) byCity[r.city || "(no city)"] = (byCity[r.city || "(no city)"] || 0) + 1;

  // Categories via two-step
  const ids = rows.map(r => r.id);
  // Chunk for IN clause
  const byCat = {};
  for (let i=0; i<ids.length; i+=500) {
    const chunk = ids.slice(i, i+500);
    const { data: rcs } = await sb
      .from("resource_categories")
      .select("category_id")
      .in("resource_id", chunk);
    for (const rc of (rcs || [])) byCat[rc.category_id] = (byCat[rc.category_id] || 0) + 1;
  }
  const { data: catNames } = await sb.from("categories").select("id, slug, name");
  const idToSlug = Object.fromEntries((catNames || []).map(c => [c.id, c.slug]));

  const noCityRows = rows.filter(r => !r.city);
  const thin = Object.entries(byCity).filter(([c,n]) => n <= 2 && c !== "(no city)");
  const mid = Object.entries(byCity).filter(([,n]) => n >= 3 && n <= 5);

  console.log(`\n========== ${state} ==========`);
  console.log(`Total approved:      ${rows.length}`);
  console.log(`Distinct cities:     ${Object.keys(byCity).length}`);
  console.log(`Rows with NO city:   ${noCityRows.length}  ⚠️  data quality`);
  console.log(`Cities with 1-2 rows (thin): ${thin.length}`);
  console.log(`Cities with 3-5 rows (medium): ${mid.length}`);

  console.log(`\nTop 15 cities:`);
  Object.entries(byCity).sort((a,b)=>b[1]-a[1]).slice(0,15)
    .forEach(([c,n]) => console.log(`  ${String(n).padStart(4)}  ${c}`));

  console.log(`\nThin cities (1-2 rows) — first 25:`);
  thin.sort((a,b)=>a[1]-b[1]).slice(0,25)
    .forEach(([c,n]) => console.log(`  ${String(n).padStart(4)}  ${c}`));

  console.log(`\nBy category (slug):`);
  Object.entries(byCat).sort((a,b)=>b[1]-a[1])
    .forEach(([id,n]) => console.log(`  ${String(n).padStart(4)}  ${idToSlug[id] || id}`));

  if (noCityRows.length > 0) {
    console.log(`\nSample no-city rows (first 5):`);
    noCityRows.slice(0,5).forEach(r => console.log(`  - ${r.title}`));
  }
}

for (const s of ["GA", "SC", "NC"]) await auditState(s);
