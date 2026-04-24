import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const { data: cats } = await sb.from("categories").select("id, slug, name").order("slug");
const { data: subs } = await sb.from("subcategories").select("id, name, category_id");
const subsByCat = {};
for (const s of subs) {
  const cat = cats.find(c => c.id === s.category_id);
  const slug = cat?.slug || "(orphan)";
  (subsByCat[slug] ??= []).push(s.name);
}
console.log("=== TAXONOMY (slug → exact subcategory names) ===");
for (const slug of Object.keys(subsByCat).sort()) {
  console.log(`\n[${slug}]`);
  subsByCat[slug].sort().forEach(n => console.log(`  ${n}`));
}
