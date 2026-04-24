/**
 * Taxonomy Probe — print every category and its valid subcategory NAMES.
 * Run BEFORE writing rows so you don't trip the bad_sub guard.
 *
 * Usage:
 *   tsx scripts/lib/probe-taxonomy.ts
 *   tsx scripts/lib/probe-taxonomy.ts --cat=housing
 */
import { supabaseAdmin } from "../../server/supabase";

const filter = process.argv.find((a) => a.startsWith("--cat="))?.split("=")[1] ?? "";

async function main() {
  const [{ data: cats }, { data: subs }] = await Promise.all([
    supabaseAdmin.from("categories").select("id, slug, name").order("name"),
    supabaseAdmin.from("subcategories").select("id, name, category_id").order("name"),
  ]);
  const subsByCat = new Map<string, string[]>();
  (subs || []).forEach((s: any) => {
    if (!subsByCat.has(s.category_id)) subsByCat.set(s.category_id, []);
    subsByCat.get(s.category_id)!.push(s.name);
  });

  for (const c of cats || []) {
    if (filter && c.slug !== filter) continue;
    console.log(`\n${(c as any).slug}  —  ${(c as any).name}`);
    const list = subsByCat.get((c as any).id) || [];
    if (!list.length) console.log("  (no subcategories)");
    list.sort().forEach((n) => console.log(`  - ${n}`));
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
