import { supabaseAdmin } from "../server/supabase";
(async () => {
  const { count } = await supabaseAdmin.from("resources").select("id", { count: "exact", head: true }).eq("state", "VA");
  console.log(`Total VA resources: ${count}`);
  const { data: cats } = await supabaseAdmin.from("categories").select("id, slug, name");
  const catById: Record<string, any> = {}; (cats || []).forEach((c: any) => catById[c.id] = c);
  const { data: rows } = await supabaseAdmin.from("resources").select("id, title, city, category_id, subcategory, address").eq("state", "VA").order("title");
  const byCat: Record<string, number> = {};
  const byCity: Record<string, number> = {};
  for (const r of rows || []) {
    const cs = catById[(r as any).category_id]?.slug || "?";
    byCat[cs] = (byCat[cs] || 0) + 1;
    const c = (r as any).city || "(statewide/null)";
    byCity[c] = (byCity[c] || 0) + 1;
  }
  console.log("\nBy category:");
  for (const [k, v] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(28)} ${v}`);
  console.log("\nBy city/region:");
  for (const [k, v] of Object.entries(byCity).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(20)} ${v}`);
  console.log(`\nUnique regions covered: ${Object.keys(byCity).length}`);
  // Check states.VA
  const { data: vaState } = await supabaseAdmin.from("states").select("*").eq("code", "VA").maybeSingle();
  console.log(`\nstates.VA row: ${vaState ? JSON.stringify(vaState) : "MISSING"}`);
})().then(() => process.exit(0));
