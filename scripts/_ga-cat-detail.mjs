import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: cats } = await sb.from("categories").select("id,slug,name");
const slugById = new Map(cats.map(c => [c.id, c.slug]));
const { data: rows } = await sb.from("resources").select("id,title,city,category_id,subcategory").eq("state","GA").eq("status","approved");
const wantSlugs = ["transportation","family-support","mental-health","end-of-life-services","substance-recovery","financial","crisis-help","disabled-veterans","insurance"];
for (const slug of wantSlugs) {
  const cat = cats.find(c => c.slug === slug);
  if (!cat) continue;
  const inCat = rows.filter(r => r.category_id === cat.id);
  console.log(`\n=== ${slug} (${inCat.length}) ===`);
  // Distinct subcategories present
  const subs = [...new Set(inCat.map(r => r.subcategory).filter(Boolean))];
  console.log(`  subcategories used: ${subs.join(" | ")}`);
  console.log(`  cities: ${[...new Set(inCat.map(r=>r.city).filter(Boolean))].slice(0,15).join(", ")}`);
}
