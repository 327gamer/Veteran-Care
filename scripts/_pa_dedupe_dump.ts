import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { data: cats } = await sb.from("categories").select("id, slug");
  const cmap = new Map((cats||[]).map((c:any)=>[c.id, c.slug]));
  const { data, error } = await sb.from("resources").select("title,city,website_url,category_id,subcategory").eq("state","PA").order("title");
  if (error) { console.error("ERR", error); process.exit(1); }
  console.log(`PA rows: ${data?.length}`);
  for (const r of (data as any[])||[]) {
    console.log(`${r.title} || ${r.city||''} || ${cmap.get(r.category_id)||'?'} || ${r.subcategory||''} || ${r.website_url||''}`);
  }
})();
