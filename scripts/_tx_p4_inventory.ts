import { supabaseAdmin } from "../server/supabase";

const METROS = ["Houston","Dallas","Fort Worth","Arlington","Plano","Irving","Garland","Frisco","McKinney","San Antonio","Austin","Round Rock","Cedar Park","El Paso","Sugar Land","Pasadena","Pearland","Katy","The Woodlands","Spring","Conroe","Galveston","League City"];
const CATS = ["healthcare","housing","food-assistance","employment","legal","community-support"];

async function main() {
  const { data: rows } = await supabaseAdmin
    .from("resources")
    .select("id, title, city, website_url, resource_categories!inner(category_id, categories!inner(slug))")
    .eq("state","TX")
    .in("city", METROS)
    .limit(2000);

  const byMetro: Record<string, Record<string, string[]>> = {};
  for (const r of rows || []) {
    const cats = (r as any).resource_categories?.map((rc:any)=>rc.categories.slug) || [];
    for (const c of cats) {
      if (!CATS.includes(c)) continue;
      byMetro[r.city as string] ??= {};
      byMetro[r.city as string][c] ??= [];
      byMetro[r.city as string][c].push((r as any).title);
    }
  }
  console.log("=== TX existing in target metros / target cats ===");
  for (const m of METROS) {
    if (!byMetro[m]) continue;
    console.log(`\n${m}:`);
    for (const c of CATS) {
      const arr = byMetro[m]?.[c] || [];
      if (arr.length) console.log(`  ${c} (${arr.length}): ${arr.slice(0,12).join(" | ")}${arr.length>12?` …+${arr.length-12}`:""}`);
    }
  }

  const totals: Record<string,number> = {};
  const { data: all } = await supabaseAdmin.from("resources").select("id, resource_categories!inner(categories!inner(slug))").eq("state","TX").limit(5000);
  for (const r of all || []) {
    for (const rc of (r as any).resource_categories || []) totals[rc.categories.slug] = (totals[rc.categories.slug]||0)+1;
  }
  console.log("\n=== TX cat totals (target cats only) ===");
  for (const c of CATS) console.log(`  ${c}: ${totals[c]||0}`);

  const { count: txTotal } = await supabaseAdmin.from("resources").select("*", { count: "exact", head: true }).eq("state","TX");
  console.log(`\nTX total rows: ${txTotal}`);
}
main().catch(e => { console.error(e); process.exit(1); });
