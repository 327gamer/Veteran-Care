import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const slugs = ["healthcare","housing","insurance","legal","va-benefits","employment","financial","crisis-help","end-of-life-services","community-support","disabled-veterans","family-support","food-assistance","substance-recovery","education","mental-health","transportation"];
  const { data: cats } = await sb.from("categories").select("id, slug");
  const cmap = new Map((cats||[]).map((c:any)=>[c.slug, c.id]));
  for (const s of slugs) {
    const { data } = await sb.from("subcategories").select("name").eq("category_id", cmap.get(s)).order("name");
    console.log(`\n=== ${s} ===`);
    (data||[]).forEach((r:any)=>console.log(`  ${r.name}`));
  }
})();
