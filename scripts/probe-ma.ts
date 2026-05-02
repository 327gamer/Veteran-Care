import { supabaseAdmin } from "../server/supabase";
(async () => {
  const { count } = await supabaseAdmin.from("resources").select("id", { count: "exact", head: true }).eq("state", "MA");
  console.log(`Existing MA resources: ${count}`);
  const { data: maState } = await supabaseAdmin.from("states").select("*").eq("code", "MA").maybeSingle();
  console.log(`states.MA row:`, maState ? JSON.stringify(maState) : "MISSING");
  const { data: cats } = await supabaseAdmin.from("categories").select("id, slug, name").order("slug");
  console.log("\n=== CATEGORIES ===");
  for (const c of cats || []) console.log(`  ${(c as any).slug.padEnd(28)} ${(c as any).name}`);
})().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
