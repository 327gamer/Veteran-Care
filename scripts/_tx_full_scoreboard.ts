import { supabaseAdmin } from "../server/supabase";
async function main() {
  const { data: cats } = await supabaseAdmin.from("categories").select("id,slug,name").order("slug");
  const counts: Record<string,number> = {};
  for (const c of cats || []) {
    const { count } = await supabaseAdmin
      .from("resource_categories")
      .select("resource_id, resources!inner(state)", { count: "exact", head: true })
      .eq("category_id", (c as any).id)
      .eq("resources.state", "TX");
    counts[(c as any).slug] = count || 0;
  }
  console.log("=== TX category scoreboard ===");
  for (const [slug, n] of Object.entries(counts).sort((a,b)=>a[1]-b[1])) {
    console.log(`  ${slug.padEnd(28)} ${String(n).padStart(4)}`);
  }
  const { data: rows } = await supabaseAdmin.from("resources").select("city").eq("state","TX").not("city","is",null);
  const cityCounts: Record<string,number> = {};
  for (const r of rows || []) cityCounts[(r as any).city] = (cityCounts[(r as any).city]||0)+1;
  const sorted = Object.entries(cityCounts).sort((a,b)=>b[1]-a[1]);
  console.log(`\n=== TX city coverage (${sorted.length} cities, top 30) ===`);
  for (const [c, n] of sorted.slice(0,30)) console.log(`  ${c.padEnd(28)} ${String(n).padStart(4)}`);
  console.log(`\n=== Bottom 20 cities (1-2 rows each) ===`);
  for (const [c, n] of sorted.slice(-20)) console.log(`  ${c.padEnd(28)} ${String(n).padStart(4)}`);
}
main().catch(e=>{console.error(e);process.exit(1);});
