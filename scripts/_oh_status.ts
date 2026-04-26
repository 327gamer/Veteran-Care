import { supabaseAdmin } from "../server/supabase";
async function main() {
  const { count: rows } = await supabaseAdmin.from("resources").select("*", { count: "exact", head: true }).eq("state", "OH");
  const { data: cityRows } = await supabaseAdmin.from("resources").select("city").eq("state", "OH").not("city", "is", null);
  const cities = new Set((cityRows||[]).map((r:any)=>r.city?.trim()).filter(Boolean));
  const { data: rs } = await supabaseAdmin.from("resources").select("category_id, categories(slug)").eq("state", "OH");
  const dist: Record<string, number> = {};
  for (const r of rs||[]) { const s = (r as any).categories?.slug || "(none)"; dist[s] = (dist[s]||0)+1; }
  console.log(`OH baseline: ${rows} rows / ${cities.size} cities`);
  console.log("Cat dist:");
  for (const [s,n] of Object.entries(dist).sort((a,b)=>(b[1] as number)-(a[1] as number))) console.log(`  ${String(n).padStart(4)}  ${s}`);
}
main().catch(e=>{console.error(e);process.exit(1);});
