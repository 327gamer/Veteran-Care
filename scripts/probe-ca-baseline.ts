import { supabaseAdmin } from "../server/supabase";
async function main() {
  const { data: ca } = await supabaseAdmin
    .from("resources")
    .select("id,title,city,status")
    .eq("state","CA")
    .limit(2000);
  const all = ca || [];
  const approved = all.filter((r:any)=>r.status==="approved");
  const cities = new Set(approved.map((r:any)=>r.city).filter(Boolean));
  console.log(`CA total=${all.length} approved=${approved.length} distinct_cities=${cities.size}`);
  console.log("Sample CA titles:");
  approved.slice(0,30).forEach((r:any)=>console.log(`  - ${r.title}  [${r.city||"-"}]`));
}
main().catch((e)=>{ console.error(e); process.exit(1); });
