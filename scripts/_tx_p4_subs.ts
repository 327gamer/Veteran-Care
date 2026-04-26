import { supabaseAdmin } from "../server/supabase";
async function main() {
  const TARGET = ["healthcare","housing","food-assistance","employment","legal","community-support"];
  const { data: cats } = await supabaseAdmin.from("categories").select("id,slug").in("slug", TARGET);
  const ids = (cats||[]).map((c:any)=>c.id);
  const { data: subs } = await supabaseAdmin.from("subcategories").select("name, category_id").in("category_id", ids);
  const m: Record<string,string[]> = {};
  for (const c of cats||[]) m[(c as any).slug] = [];
  for (const s of subs||[]) {
    const cat = (cats||[]).find((c:any)=>c.id===(s as any).category_id);
    if (cat) m[(cat as any).slug].push((s as any).name);
  }
  for (const slug of TARGET) console.log(`${slug}: ${(m[slug]||[]).join(" | ")}`);
}
main().catch(e=>{console.error(e);process.exit(1);});
