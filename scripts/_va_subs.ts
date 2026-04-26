import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { data: cats } = await sb.from("categories").select("id, slug").eq("slug","va-benefits");
  const cid = cats?.[0]?.id;
  const { data: subs } = await sb.from("subcategories").select("name").eq("category_id", cid);
  console.log((subs||[]).map((s:any)=>s.name).sort().join("\n"));
  // also check existing OH county VSC sub
  const { data } = await sb.from("resources").select("title, subcategory_id").eq("state","OH").eq("category_id", cid).ilike("title","%County Veterans Service Commission%").limit(3);
  console.log("\nExisting county VSC subcategory_ids:", data);
  if (data && data.length) {
    const { data: s2 } = await sb.from("subcategories").select("id, name").eq("id", data[0].subcategory_id);
    console.log("Sub used:", s2);
  }
})();
