/**
 * SC: list orphan subcategory junctions + dump the full taxonomy
 * (categories + subcategories) so the Phase 4 seed can use exact sub names.
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

(async () => {
  // 1. Orphan subcategory junctions: SC rows that have a category junction
  //    but no subcategory junction.
  const { data: scRows } = await sb
    .from("resources")
    .select("id, title, subcategory, category_id")
    .eq("state", "SC");

  const ids = (scRows || []).map((r) => r.id);
  const { data: subJ } = await sb
    .from("resource_subcategories")
    .select("resource_id")
    .in("resource_id", ids);
  const haveSub = new Set((subJ || []).map((j) => j.resource_id));

  const orphans = (scRows || []).filter((r) => !haveSub.has(r.id));
  console.log(`ORPHAN SUBCATEGORY JUNCTIONS: ${orphans.length}\n`);
  orphans.forEach((r) =>
    console.log(`  - ${r.id} | ${r.title} | sub="${r.subcategory}" | cat=${r.category_id}`),
  );

  // 2. Full taxonomy dump
  console.log("\n\n========== TAXONOMY ==========\n");
  const { data: cats } = await sb.from("categories").select("id, slug, name").order("name");
  const { data: subs } = await sb.from("subcategories").select("id, name, category_id").order("name");

  for (const c of cats || []) {
    const sublist = (subs || []).filter((s) => s.category_id === c.id);
    console.log(`\n[${c.slug}] ${c.name}  (${sublist.length} subs)`);
    sublist.forEach((s) => console.log(`    - ${s.name}`));
  }
})();
