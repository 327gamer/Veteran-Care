import { supabaseAdmin } from "../server/supabase";
async function main() {
  const cats = ["education","family-support","transportation","end-of-life-services","crisis-help","disabled-veterans","legal","food-assistance","substance-recovery","insurance","financial"];
  for (const slug of cats) {
    const { data: cat } = await supabaseAdmin.from("categories").select("id").eq("slug", slug).maybeSingle();
    if (!cat) { console.log(`${slug}: NO CAT`); continue; }
    const { data: subs } = await supabaseAdmin.from("subcategories").select("name").eq("category_id", (cat as any).id).order("name");
    console.log(`\n${slug}:`);
    for (const s of subs||[]) console.log(`  - ${(s as any).name}`);
  }
}
main().catch(e=>{console.error(e);process.exit(1);});
