import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { data: cats } = await sb.from("categories").select("id, slug");
  const { data: subs } = await sb.from("subcategories").select("id, name, category_id");
  const cmap = new Map((cats||[]).map((c:any)=>[c.id, c.slug]));
  const want = new Set(["insurance","disabled-veterans","education","employment","family-support","community-support","financial","housing"]);
  const grouped: Record<string, string[]> = {};
  (subs||[]).forEach((s:any)=>{ const slug = cmap.get(s.category_id) as string; if (want.has(slug)) (grouped[slug] ||= []).push(s.name); });
  for (const k of Array.from(want)) { console.log(`\n[${k}]`); (grouped[k]||[]).sort().forEach(n=>console.log("  - "+n)); }
})();
