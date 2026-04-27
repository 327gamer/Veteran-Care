import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const c = await sb.from("categories").select("id, slug, name");
  const s = await sb.from("subcategories").select("category_id, name").order("name");
  const cm: Record<number,string> = {}; c.data?.forEach((x:any)=>cm[x.id]=x.slug);
  const by: Record<string,string[]> = {};
  s.data?.forEach((x:any)=>{ const k = cm[x.category_id]||"?"; (by[k]=by[k]||[]).push(x.name); });
  ["housing","food-assistance","employment","education","transportation","healthcare","mental-health","substance-recovery","family-support","financial","insurance","legal","crisis-help","disabled-veterans","community-support","end-of-life-services","va-benefits"].forEach(k => {
    console.log(`\n[${k}] (${(by[k]||[]).length})`);
    (by[k]||[]).forEach(n=>console.log(`  - ${n}`));
  });
})();
