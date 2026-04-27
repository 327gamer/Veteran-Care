import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { data: cats } = await sb.from("categories").select("id, slug");
  const { data: subs } = await sb.from("subcategories").select("name, category_id");
  const cmap = new Map((cats||[]).map((c:any)=>[c.id, c.slug]));
  const want = new Set(["housing","food-assistance","employment","education","transportation","financial","family","disabled-veterans","insurance"]);
  const grouped: Record<string,string[]> = {};
  (subs||[]).forEach((s:any)=>{ const slug = cmap.get(s.category_id) as string; if (want.has(slug)) (grouped[slug] ||= []).push(s.name); });
  for (const k of Array.from(want).sort()) { console.log(`\n[${k}]`); (grouped[k]||[]).sort().forEach(n=>console.log("  - "+n)); }

  const cities = ["Cleveland","Columbus","Cincinnati","Dayton","Toledo","Akron","Youngstown"];
  console.log("\n\n=== EXISTING OH ROWS BY CITY ===");
  for (const c of cities) {
    const { data: rs } = await sb.from("resources").select("title, category_id").eq("state","OH").eq("city", c);
    const counts: Record<string,number> = {};
    (rs||[]).forEach((r:any)=>{ const s = cmap.get(r.category_id) as string; counts[s] = (counts[s]||0)+1; });
    console.log(`\n[${c}] (${rs?.length||0})`);
    Object.entries(counts).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`  ${k}: ${v}`));
  }
})();
