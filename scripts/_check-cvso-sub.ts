import { supabaseAdmin } from "../server/supabase";
async function main() {
  const { data: cats } = await supabaseAdmin.from("categories").select("id,slug,name").eq("slug","va-benefits");
  console.log("va-benefits cat:", cats);
  if (!cats?.length) return;
  const { data: subs } = await supabaseAdmin.from("subcategories").select("name").eq("category_id", cats[0].id);
  console.log("va-benefits subs:", subs?.map((s:any)=>s.name).sort());

  // also check if any TX county VSO rows already exist that might collide
  const { data: existing } = await supabaseAdmin.from("resources").select("title").eq("state","TX").or("title.ilike.%county veteran%,title.ilike.%county VSO%,title.ilike.%veterans service office%");
  console.log("\nTX existing CVSO-like rows:", existing?.map((r:any)=>r.title));
}
main();
