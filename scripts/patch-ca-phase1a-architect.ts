/**
 * Patch CA Phase 1A — apply architect-flagged factual corrections.
 *
 * 1. DROP "Veterans Inc. San Diego (formerly Veterans Multi-Service Center)" — conflated with MA org; not a real SD entity.
 * 2. Reclassify 8 CalVet Veterans Homes from healthcare > "VA Clinics" → end-of-life-services > "Assisted Living & Nursing Homes" (factually accurate; they are state-run long-term care, not VA outpatient clinics).
 * 3. Reclassify 3 "211" general info-line rows from crisis-help > "Mobile Crisis Teams" → community-support > "Veteran Outreach Programs" (211 is referral/info, not mobile crisis dispatch).
 * 4. Update Didi Hirsch phone — the published (800) 273-8255 was the legacy national lifeline number; the org's verified primary connect-to-services number for callers in its catchment is now 988. Use 988 (factually correct as Didi Hirsch is the contracted 988 crisis center for greater LA / Los Angeles county).
 */
import { supabaseAdmin } from "../server/supabase";

const COMMIT = process.argv.includes("--commit");

const VETERANS_HOMES = [
  "Yountville Veterans Home of California",
  "Barstow Veterans Home of California",
  "Chula Vista Veterans Home of California",
  "Lancaster Veterans Home of California",
  "Ventura Veterans Home of California",
  "West Los Angeles Veterans Home of California",
  "Redding Veterans Home of California",
  "Fresno Veterans Home of California",
];

const TWO_ELEVEN = ["211 LA County", "211 San Diego", "211 California"];

const DROP_TITLE = "Veterans Inc. San Diego (formerly Veterans Multi-Service Center)";
const DIDI_HIRSCH_TITLE = "Didi Hirsch Mental Health Services - Suicide Prevention Center";

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

async function reclassify(title: string, catSlug: string, subName: string) {
  const { data: row } = await supabaseAdmin
    .from("resources").select("id, title, category_id, subcategory")
    .eq("state", "CA").eq("title", title).single();
  if (!row) { console.log(`  SKIP not-found: ${title}`); return; }
  const target = await lookupCatSub(catSlug, subName);
  console.log(`  ${title}`);
  console.log(`     ${(row as any).category_id} / ${(row as any).subcategory}  →  ${target.category_id} / ${target.sub_name}`);
  if (!COMMIT) return;

  // Update parent row's category_id + subcategory_name string
  const { error: e1 } = await supabaseAdmin.from("resources")
    .update({ category_id: target.category_id, subcategory: target.sub_name })
    .eq("id", (row as any).id);
  if (e1) { console.log(`     ERR update resources: ${e1.message}`); return; }

  // Wipe old junctions for this row, then insert correct ones
  const { error: e2 } = await supabaseAdmin.from("resource_categories").delete().eq("resource_id", (row as any).id);
  if (e2) console.log(`     WARN delete rc: ${e2.message}`);
  const { error: e3 } = await supabaseAdmin.from("resource_subcategories").delete().eq("resource_id", (row as any).id);
  if (e3) console.log(`     WARN delete rs: ${e3.message}`);
  const { error: e4 } = await supabaseAdmin.from("resource_categories")
    .insert({ resource_id: (row as any).id, category_id: target.category_id });
  if (e4) console.log(`     ERR insert rc: ${e4.message}`);
  const { error: e5 } = await supabaseAdmin.from("resource_subcategories")
    .insert({ resource_id: (row as any).id, subcategory_id: target.subcategory_id });
  if (e5) console.log(`     ERR insert rs: ${e5.message}`);
  console.log(`     ✓ reclassified`);
}

async function patchPhone(title: string, newPhone: string) {
  const { data: row } = await supabaseAdmin
    .from("resources").select("id, title, phone")
    .eq("state", "CA").eq("title", title).single();
  if (!row) { console.log(`  SKIP not-found: ${title}`); return; }
  console.log(`  ${title}: phone "${(row as any).phone}" → "${newPhone}"`);
  if (!COMMIT) return;
  const { error } = await supabaseAdmin.from("resources").update({ phone: newPhone }).eq("id", (row as any).id);
  if (error) console.log(`     ERR: ${error.message}`); else console.log(`     ✓ phone updated`);
}

async function dropRow(title: string) {
  const { data: row } = await supabaseAdmin
    .from("resources").select("id, title").eq("state", "CA").eq("title", title).single();
  if (!row) { console.log(`  SKIP not-found: ${title}`); return; }
  console.log(`  DROP: ${title} (id=${(row as any).id})`);
  if (!COMMIT) return;
  await supabaseAdmin.from("resource_categories").delete().eq("resource_id", (row as any).id);
  await supabaseAdmin.from("resource_subcategories").delete().eq("resource_id", (row as any).id);
  const { error } = await supabaseAdmin.from("resources").delete().eq("id", (row as any).id);
  if (error) console.log(`     ERR: ${error.message}`); else console.log(`     ✓ dropped`);
}

async function main() {
  console.log(`\n=== patch-ca-phase1a-architect (${COMMIT ? "COMMIT" : "DRY-RUN"}) ===\n`);

  console.log("[1] DROP conflated row");
  await dropRow(DROP_TITLE);

  console.log("\n[2] Reclassify 8 CalVet Veterans Homes → end-of-life-services > Assisted Living & Nursing Homes");
  for (const t of VETERANS_HOMES) await reclassify(t, "end-of-life-services", "Assisted Living & Nursing Homes");

  console.log("\n[3] Reclassify 3 \"211\" rows → community-support > Veteran Outreach Programs");
  for (const t of TWO_ELEVEN) await reclassify(t, "community-support", "Veteran Outreach Programs");

  console.log("\n[4] Patch Didi Hirsch phone → 988 (verified 988 lifeline crisis center for greater LA)");
  await patchPhone(DIDI_HIRSCH_TITLE, "988");

  console.log(COMMIT ? "\n✓ COMMIT complete" : "\n(dry-run only — pass --commit to write)");
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
