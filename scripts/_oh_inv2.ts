import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { data: cats } = await sb.from("categories").select("id, slug");
  const cmap = new Map((cats||[]).map((c:any)=>[c.id, c.slug]));
  const want = ["healthcare","mental-health","substance-recovery","crisis-help","va-benefits"];
  for (const slug of want) {
    const cid = [...cmap.entries()].find(([_,s])=>s===slug)?.[0];
    const { data } = await sb.from("resources").select("title").eq("state","OH").eq("category_id", cid);
    console.log(`\n[${slug}] (${data?.length})`);
    (data||[]).map((d:any)=>d.title).sort().forEach((t:string)=>console.log("  - "+t));
  }
})();
