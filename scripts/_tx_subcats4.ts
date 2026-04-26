import { supabaseAdmin } from "../server/supabase";
async function main() {
  const { data: cat } = await supabaseAdmin.from("categories").select("id").eq("slug", "crisis-help").maybeSingle();
  const { data: subs } = await supabaseAdmin.from("subcategories").select("name").eq("category_id", (cat as any).id).order("name");
  for (const s of subs || []) console.log(`  ${(s as any).name}`);
}
main().catch(e=>{console.error(e);process.exit(1);});
