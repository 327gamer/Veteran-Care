import { supabaseAdmin } from "../server/supabase";
async function main() {
  const { count: rows } = await supabaseAdmin.from("resources").select("*", { count: "exact", head: true }).eq("state", "TX");
  const { data: cityRows } = await supabaseAdmin.from("resources").select("city").eq("state", "TX").not("city", "is", null);
  const cities = new Set((cityRows||[]).map((r:any)=>r.city?.trim()).filter(Boolean));
  console.log(`TX total rows: ${rows}`);
  console.log(`TX unique cities: ${cities.size}`);
}
main().catch(e=>{console.error(e);process.exit(1);});
