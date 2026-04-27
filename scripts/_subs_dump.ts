import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { data: cats } = await sb.from("categories").select("id, slug").order("slug");
  const { data: subs } = await sb.from("subcategories").select("name, category_id").order("name");
  const cmap = new Map((cats||[]).map((c:any)=>[c.id, c.slug]));
  const grouped:Record<string,string[]>={};
  (subs||[]).forEach((s:any)=>{ const k = cmap.get(s.category_id) as string; (grouped[k]=grouped[k]||[]).push(s.name); });
  Object.keys(grouped).sort().forEach(k=>{ console.log(`\n=== ${k} ===`); grouped[k].forEach(n=>console.log(`  ${n}`)); });
})();
