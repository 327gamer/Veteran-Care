import { supabaseAdmin } from "../server/supabase";
const sb = supabaseAdmin;
async function main() {
  const { data: cats, error: e1 } = await sb.from("categories").select("id,slug,name");
  if (e1) { console.error("cats err", e1); return; }
  console.log("CATS:", cats?.length);
  cats?.forEach(c => console.log(`  ${c.slug.padEnd(25)} id=${c.id}`));
  const { data: subs, error: e2 } = await sb.from("subcategories").select("name,category_id");
  if (e2) { console.error("subs err", e2); return; }
  const wantSlugs = ["healthcare","mental-health","end-of-life-services","family-support","housing","va-benefits","community-support"];
  for (const slug of wantSlugs) {
    const c = cats?.find(c => c.slug === slug);
    if (!c) { console.log(`\n[${slug}] CAT NOT FOUND`); continue; }
    const mySubs = subs?.filter(s => s.category_id === c.id).map(s => s.name) ?? [];
    console.log(`\n[${slug}] (${mySubs.length} subs)`);
    mySubs.forEach(n => console.log("   -", n));
  }
}
main().catch(e=>{console.error(e);process.exit(1);});
