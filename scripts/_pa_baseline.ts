import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { count } = await sb.from("resources").select("*", { count: "exact", head: true }).eq("state","PA");
  console.log("PA total:", count);
  const { data: rows } = await sb.from("resources").select("category_id, city, title").eq("state","PA");
  const { data: cats } = await sb.from("categories").select("id, slug");
  const m = new Map((cats||[]).map((c:any)=>[c.id, c.slug]));
  const cc:Record<string,number>={}, ct:Record<string,number>={};
  (rows||[]).forEach((r:any)=>{ cc[m.get(r.category_id) as string]=(cc[m.get(r.category_id) as string]||0)+1; ct[r.city]=(ct[r.city]||0)+1; });
  console.log("cats:", Object.keys(cc).length, "cities:", Object.keys(ct).length);
  Object.entries(cc).sort((a,b)=>a[1]-b[1]).forEach(([s,n])=>console.log(`  ${n.toString().padStart(3)}  ${s}`));
  console.log("---existing PA titles (first 30):");
  (rows||[]).slice(0,30).forEach((r:any)=>console.log(`  ${r.title}`));
})();
