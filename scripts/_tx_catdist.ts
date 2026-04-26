import { supabaseAdmin } from "../server/supabase";
async function main() {
  const { data: cats } = await supabaseAdmin.from("categories").select("id,slug").order("slug");
  const counts: Array<[string,number]> = [];
  for (const c of cats || []) {
    const { count } = await supabaseAdmin.from("resource_categories").select("resource_id, resources!inner(state)", { count: "exact", head: true })
      .eq("category_id", (c as any).id).eq("resources.state", "TX");
    counts.push([(c as any).slug, count || 0]);
  }
  counts.sort((a,b)=>a[1]-b[1]);
  for (const [slug, n] of counts) console.log(`  ${String(n).padStart(4," ")}  ${slug}`);
}
main().catch(e=>{console.error(e);process.exit(1);});
