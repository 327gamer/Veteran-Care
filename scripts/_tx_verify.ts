import { supabaseAdmin } from "../server/supabase";
async function main() {
  const { count: total } = await supabaseAdmin.from("resources").select("id", { count: "exact", head: true });
  const { count: tx } = await supabaseAdmin.from("resources").select("id", { count: "exact", head: true }).eq("state","TX");
  const { data: rows } = await supabaseAdmin.from("resources").select("city").eq("state","TX");
  const cities = new Set((rows||[]).map((r:any)=>r.city).filter(Boolean));
  const { data: tagged } = await supabaseAdmin.from("resources").select("id, name").eq("state","TX").like("notes_internal","%tx-phase6-closeout%");
  console.log("TOTAL DB:", total, "| TX:", tx, "| TX cities:", cities.size, "| phase6-closeout-tagged:", tagged?.length || 0);
  const cats = ["transportation","substance-recovery","crisis-help","financial","disabled-veterans","education","end-of-life-services","insurance"];
  for (const slug of cats) {
    const { data: cat } = await supabaseAdmin.from("categories").select("id").eq("slug", slug).maybeSingle();
    const { count } = await supabaseAdmin.from("resource_categories").select("resource_id, resources!inner(state)", { count: "exact", head: true }).eq("category_id", (cat as any).id).eq("resources.state","TX");
    console.log(`  ${slug.padEnd(28)} ${count}`);
  }
}
main().catch(e=>{console.error(e);process.exit(1);});
