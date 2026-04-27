import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { data: cats } = await sb.from("categories").select("id, slug").eq("slug","end-of-life-services");
  if (!cats?.length) return;
  const { data: subs } = await sb.from("subcategories").select("name").eq("category_id", cats[0].id);
  (subs||[]).map((s:any)=>s.name).sort().forEach((n:string)=>console.log(n));
})();
