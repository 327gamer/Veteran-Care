import { supabaseAdmin } from "../server/supabase";
async function main() {
  for (const slug of ["employment"]) {
    const { data: cat } = await supabaseAdmin.from("categories").select("id,name").eq("slug", slug).maybeSingle();
    const { data: subs } = await supabaseAdmin.from("subcategories").select("name").eq("category_id", (cat as any).id).order("name");
    console.log(`== ${slug} ==`);
    for (const s of subs || []) console.log(`  ${(s as any).name}`);
  }
}
main().catch(e=>{console.error(e);process.exit(1);});
