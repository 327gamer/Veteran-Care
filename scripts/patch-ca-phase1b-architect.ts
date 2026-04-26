/**
 * Patch CA Phase 1B — apply architect-flagged factual corrections.
 *
 * 1. RENAME "Inland SoCal Veterans Health (Inland Empire 988 / Crisis)"
 *    → "Inland SoCal United Way 988 Suicide & Crisis Lifeline"
 *    Reason: original title implied a veterans-only org; canonical entity is
 *    Inland SoCal United Way operating the regional 988 call center.
 *
 * 2. RECLASSIFY "Wounded Heroes Fund" from
 *    disabled-veterans / Disability Benefits & Claims
 *    → financial / Veteran Relief Funds
 *    Reason: org's actual function is direct material aid (mortgage payoffs,
 *    vehicle modifications, family financial support) — not VA claims work.
 */
import { supabaseAdmin } from "../server/supabase";

const COMMIT = process.argv.includes("--commit");

async function lookupCatSub(catSlug: string, subName: string) {
  const { data: cat } = await supabaseAdmin.from("categories").select("id").eq("slug", catSlug).single();
  if (!cat) throw new Error(`category slug ${catSlug} not found`);
  const { data: sub } = await supabaseAdmin
    .from("subcategories")
    .select("id")
    .eq("category_id", (cat as any).id)
    .ilike("name", subName)
    .single();
  if (!sub) throw new Error(`subcategory "${subName}" not found in ${catSlug}`);
  return { category_id: (cat as any).id, subcategory_id: (sub as any).id, sub_name: subName };
}

async function renameRow(oldTitle: string, newTitle: string) {
  const { data: row } = await supabaseAdmin
    .from("resources").select("id, title").eq("state", "CA").eq("title", oldTitle).single();
  if (!row) { console.log(`  SKIP not-found: ${oldTitle}`); return; }
  console.log(`  RENAME: ${oldTitle}`);
  console.log(`     →     ${newTitle}`);
  if (!COMMIT) return;
  const { error } = await supabaseAdmin.from("resources").update({ title: newTitle }).eq("id", (row as any).id);
  if (error) console.log(`     ERR: ${error.message}`);
  else console.log(`     ok`);
}

async function reclassify(title: string, catSlug: string, subName: string) {
  const { data: row } = await supabaseAdmin
    .from("resources").select("id, title, category_id, subcategory")
    .eq("state", "CA").eq("title", title).single();
  if (!row) { console.log(`  SKIP not-found: ${title}`); return; }
  const target = await lookupCatSub(catSlug, subName);
  console.log(`  RECLASSIFY: ${title}`);
  console.log(`     ${(row as any).category_id} / ${(row as any).subcategory}`);
  console.log(`     →  ${target.category_id} / ${target.sub_name}`);
  if (!COMMIT) return;

  const { error: e1 } = await supabaseAdmin.from("resources")
    .update({ category_id: target.category_id, subcategory: target.sub_name })
    .eq("id", (row as any).id);
  if (e1) { console.log(`     ERR update resources: ${e1.message}`); return; }

  const { error: e2 } = await supabaseAdmin.from("resource_categories").delete().eq("resource_id", (row as any).id);
  if (e2) console.log(`     WARN delete rc: ${e2.message}`);

  const { error: e3 } = await supabaseAdmin.from("resource_categories")
    .insert({ resource_id: (row as any).id, category_id: target.category_id });
  if (e3) console.log(`     WARN insert rc: ${e3.message}`);

  const { error: e4 } = await supabaseAdmin.from("resource_subcategories").delete().eq("resource_id", (row as any).id);
  if (e4) console.log(`     WARN delete rs: ${e4.message}`);

  const { error: e5 } = await supabaseAdmin.from("resource_subcategories")
    .insert({ resource_id: (row as any).id, subcategory_id: target.subcategory_id });
  if (e5) console.log(`     WARN insert rs: ${e5.message}`);

  console.log(`     ok`);
}

async function main() {
  console.log(`=== patch-ca-phase1b-architect (${COMMIT ? "COMMIT" : "DRY-RUN"}) ===\n`);

  console.log(`[1/2] Rename non-canonical org name`);
  await renameRow(
    "Inland SoCal Veterans Health (Inland Empire 988 / Crisis)",
    "Inland SoCal United Way 988 Suicide & Crisis Lifeline",
  );

  console.log(`\n[2/2] Reclassify Wounded Heroes Fund (financial aid, not claims work)`);
  await reclassify("Wounded Heroes Fund", "financial", "Veteran Relief Funds");

  console.log(`\n${COMMIT ? "COMMITTED" : "(dry-run only — pass --commit to write)"}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
