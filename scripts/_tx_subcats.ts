import { supabaseAdmin } from "../server/supabase";
async function main() {
  const cats = ["transportation","substance-recovery","crisis-help","financial","disabled-veterans","education","end-of-life-services","insurance"];
  for (const slug of cats) {
    const { data: cat } = await supabaseAdmin.from("categories").select("id,name").eq("slug", slug).maybeSingle();
    if (!cat) { console.log(`-- ${slug}: NOT FOUND`); continue; }
    const { data: subs } = await supabaseAdmin.from("subcategories").select("name").eq("category_id", (cat as any).id).order("name");
    console.log(`\n== ${slug} (${(cat as any).name}) ==`);
    for (const s of subs || []) console.log(`  ${(s as any).name}`);
  }
}
main().catch(e=>{console.error(e);process.exit(1);});
