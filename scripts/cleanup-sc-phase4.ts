/**
 * SC Cleanup — Phase 4 (focused, additive-only)
 *
 * Pre-Florida Southeast Upgrade. SC was built before the rollout engine
 * matured (initial 2-script seed pattern). The QA tool flags 8 rows as
 * orphans of the `resource_subcategories` junction — they have a category
 * link but no subcategory link, so they don't show up in subcategory
 * browsing. This cleanup backfills those junctions WITHOUT modifying the
 * underlying rows.
 *
 * Does NOT:
 *   - delete any rows (Operator Mode = additive only)
 *   - rename any rows (parent-org sibling renaming is QA-noise, not user
 *     facing; deferred to founder review)
 *   - touch the 6 "Veteran Care —" placeholder rows (founder review item)
 *
 * Usage:
 *   tsx scripts/cleanup-sc-phase4.ts            # dry-run
 *   tsx scripts/cleanup-sc-phase4.ts --commit
 */
import { supabaseAdmin } from "../server/supabase";

const COMMIT = process.argv.includes("--commit");
const STATE = "SC";

(async () => {
  console.log(`\n=== SC Phase 4 Cleanup (${COMMIT ? "COMMIT" : "DRY-RUN"}) ===\n`);

  // 1. Find all SC rows
  const { data: scRows, error: e1 } = await supabaseAdmin
    .from("resources")
    .select("id, title, subcategory, category_id, city")
    .eq("state", STATE);
  if (e1) throw e1;
  const ids = (scRows || []).map((r) => r.id);
  console.log(`SC rows: ${scRows!.length}`);

  // 2. Pull all subcategory junctions for these rows (paginated to avoid 1000-row default cap)
  const have = new Set<string>();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const { data, error } = await supabaseAdmin
      .from("resource_subcategories")
      .select("resource_id")
      .in("resource_id", chunk);
    if (error) throw error;
    (data || []).forEach((j) => have.add(j.resource_id));
  }

  const orphans = (scRows || []).filter((r) => !have.has(r.id));
  console.log(`Orphan rows (missing subcategory junction): ${orphans.length}\n`);

  // 3. Look up subcategory_id for each orphan via (category_id, subcategory NAME)
  const { data: subs, error: e2 } = await supabaseAdmin
    .from("subcategories")
    .select("id, name, category_id");
  if (e2) throw e2;
  const subKey = new Map<string, string>();
  (subs || []).forEach((s) =>
    subKey.set(`${s.category_id}|${(s.name || "").toLowerCase().trim()}`, s.id),
  );

  let backfilled = 0;
  let skipped = 0;
  for (const r of orphans) {
    const key = `${r.category_id}|${(r.subcategory || "").toLowerCase().trim()}`;
    const sub_id = subKey.get(key);
    if (!sub_id) {
      console.log(`  SKIP  ${r.title}  — sub "${r.subcategory}" not found in cat ${r.category_id}`);
      skipped++;
      continue;
    }
    console.log(`  ${COMMIT ? "WRITE" : "PLAN "} ${r.title}  →  sub_id=${sub_id}`);
    if (COMMIT) {
      const { error } = await supabaseAdmin
        .from("resource_subcategories")
        .upsert(
          { resource_id: r.id, subcategory_id: sub_id },
          { onConflict: "resource_id,subcategory_id" },
        );
      if (error) {
        console.log(`    INSERT FAILED: ${error.message}`);
        skipped++;
        continue;
      }
    }
    backfilled++;
  }

  console.log(
    `\nSummary: ${backfilled} junctions ${COMMIT ? "backfilled" : "to backfill"}, ${skipped} skipped (sub not found).`,
  );
  if (!COMMIT) console.log(`\n(dry-run only — pass --commit to write)\n`);
})();
