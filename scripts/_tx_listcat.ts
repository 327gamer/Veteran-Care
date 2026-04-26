import { supabaseAdmin } from "../server/supabase";
async function main() {
  const slug = process.argv[2] || "legal";
  const { data: cat } = await supabaseAdmin.from("categories").select("id").eq("slug", slug).maybeSingle();
  const { data: rows } = await supabaseAdmin
    .from("resource_categories")
    .select("resources!inner(title,city,state)")
    .eq("category_id", (cat as any).id);
  const tx = (rows||[]).map((r:any)=>r.resources).filter((r:any)=>r.state==="TX");
  for (const r of tx) console.log(`  [${r.city||"--"}] ${r.title}`);
}
main().catch(e=>{console.error(e);process.exit(1);});
