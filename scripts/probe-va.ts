import { supabaseAdmin } from "../server/supabase";
(async () => {
  const { data: cats } = await supabaseAdmin.from("categories").select("id, slug, name").order("slug");
  console.log("=== CATEGORIES (slug → name) ===");
  for (const c of cats || []) console.log(`  ${(c as any).slug.padEnd(28)} ${(c as any).name}`);

  const { data: subs } = await supabaseAdmin.from("subcategories").select("id, name, slug, category_id").limit(2000);
  console.log(`\n=== SUBCATEGORY NAMES per category (engine matches on NAME) ===`);
  const byCat: Record<string, any[]> = {};
  for (const s of subs || []) {
    const cid = (s as any).category_id;
    (byCat[cid] = byCat[cid] || []).push(s);
  }
  for (const c of cats || []) {
    const arr = byCat[(c as any).id] || [];
    console.log(`\n[${(c as any).slug}] ${(c as any).name} — ${arr.length} subs:`);
    for (const s of arr.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`    name="${(s as any).name}"  slug=${(s as any).slug || "(null)"}`);
    }
  }

  const { data: vaState } = await supabaseAdmin.from("states").select("*").eq("code", "VA").maybeSingle();
  console.log(`\n=== Virginia state record ===`);
  console.log(vaState ? JSON.stringify(vaState, null, 2) : "  (NOT FOUND in states table)");

  const { count } = await supabaseAdmin.from("resources").select("id", { count: "exact", head: true }).eq("state", "VA");
  console.log(`\n=== Existing VA resources count: ${count} ===`);
  const { data: vaRows } = await supabaseAdmin.from("resources").select("id, title, city, category_id, subcategory").eq("state", "VA").limit(500);
  const cityCount: Record<string, number> = {};
  const catCount: Record<string, number> = {};
  for (const r of vaRows || []) {
    const c = (r as any).city || "(null/statewide)";
    cityCount[c] = (cityCount[c] || 0) + 1;
    const cn = (cats || []).find((x: any) => x.id === (r as any).category_id);
    const cs = cn ? (cn as any).slug : "(unknown)";
    catCount[cs] = (catCount[cs] || 0) + 1;
  }
  console.log("\n--- VA resources by city ---");
  for (const [c, n] of Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log(`  ${c}: ${n}`);
  console.log("\n--- VA resources by category slug ---");
  for (const [c, n] of Object.entries(catCount).sort((a, b) => b[1] - a[1])) console.log(`  ${c}: ${n}`);
})().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
