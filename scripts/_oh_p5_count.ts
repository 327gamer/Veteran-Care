import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { count } = await sb.from("resources").select("*", { count: "exact", head: true }).eq("state", "OH");
  console.log("OH total:", count);
  const { data: cats } = await sb.from("categories").select("id, slug");
  const map = new Map((cats||[]).map((c:any)=>[c.id, c.slug]));
  const { data: rows } = await sb.from("resources").select("category_id, city").eq("state","OH");
  const catCount: Record<string,number> = {};
  const cityCount: Record<string,number> = {};
  (rows||[]).forEach((r:any)=>{
    const s = map.get(r.category_id) as string;
    catCount[s] = (catCount[s]||0)+1;
    cityCount[r.city] = (cityCount[r.city]||0)+1;
  });
  console.log("Cats:", Object.keys(catCount).length, "Cities:", Object.keys(cityCount).length);
  console.log("Cat counts (sorted):");
  Object.entries(catCount).sort((a,b)=>a[1]-b[1]).forEach(([s,n])=>console.log(`  ${n.toString().padStart(3)}  ${s}`));
})();
