import { supabaseAdmin } from "../server/supabase";
async function main() {
  const { count } = await supabaseAdmin.from("resources").select("*", { count: "exact", head: true }).eq("state","TX");
  const { data: rows } = await supabaseAdmin.from("resources").select("city,county,phone,address,website_url").eq("state","TX");
  const cities = new Set((rows||[]).map((r:any)=>(r.city||"").trim()).filter(Boolean));
  const counties = new Set((rows||[]).map((r:any)=>(r.county||"").trim()).filter(Boolean));
  const noPhone = (rows||[]).filter((r:any)=>!r.phone).length;
  const noAddr = (rows||[]).filter((r:any)=>!r.address).length;
  const noUrl = (rows||[]).filter((r:any)=>!r.website_url).length;
  console.log(`TX rows: ${count}`);
  console.log(`Cities (city-anchored): ${cities.size}`);
  console.log(`Counties tagged: ${counties.size} of 254`);
  console.log(`Missing phone: ${noPhone}  Missing addr: ${noAddr}  Missing URL: ${noUrl}`);
}
main().catch(e=>{console.error(e);process.exit(1);});
