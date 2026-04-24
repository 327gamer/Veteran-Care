/**
 * NC Cleanup — Phase 4 (focused, additive-only)
 *
 * Pre-Florida Southeast Upgrade — Wave 2. NC was built before the rollout
 * engine matured. The QA tool flags 5 Insurance rows as orphans of the
 * `resource_subcategories` junction (their `subcategory` text column is
 * also null) — they have a category link but no subcategory link, so
 * they don't show up in subcategory browsing. Insurance therefore reads
 * "5" in QA and looks dormant.
 *
 * Plus 1 confirmed TRUE-DUP: two "Fayetteville VA Medical Center" rows
 * sharing identical phone, address, URL, and subcategory. Per the
 * additive-only rule we soft-archive the newer/less-rich row by setting
 * status='archived' and noting the merge target in source_name.
 *
 * Does NOT:
 *   - delete any rows (Operator Mode = additive only)
 *   - rename accepted parent-org siblings (HUD-VASH × 4 VAMCs,
 *     NC State Veterans Home × 4 cities, NCWorks × 3, Legal Aid × 3,
 *     etc. — these are correctly distinguished and remain)
 *
 * Usage:
 *   tsx scripts/cleanup-nc-phase4.ts            # dry-run
 *   tsx scripts/cleanup-nc-phase4.ts --commit
 */
import { supabaseAdmin } from "../server/supabase";

const COMMIT = process.argv.includes("--commit");
const STATE = "NC";

// Manual mapping for the 5 Insurance orphans — their `subcategory` text
// column is null so we cannot use the SC pattern of (category_id|sub_name).
// These mappings reflect the canonical Insurance subcategory taxonomy.
const ORPHAN_SUB_MAP: Record<string, { sub_name: string; reason: string }> = {
  // NC SHIIP — Medicare counseling for seniors → Medicare & VA Plans
  "e8c20f64-0051-4c3f-bdfb-70c2b26f2896": {
    sub_name: "Medicare & VA Plans",
    reason: "SHIIP is the state Medicare counseling program",
  },
  // NC State Health Plan — group health for retired state employees → Health Insurance
  "8bb43140-6ef1-41af-b563-c3a95ecb3a5d": {
    sub_name: "Health Insurance",
    reason: "Group health insurance for state retirees",
  },
  // NC DOI Military Consumer Protection — broad insurance consumer help → Health Insurance
  "44dd5422-b281-4067-a8f7-3790484e1337": {
    sub_name: "Health Insurance",
    reason: "Insurance consumer protection — broadest single fit",
  },
  // TRICARE Region East — military health plan → Medicare & VA Plans
  "02aece6d-28ed-4f89-a40b-1c92f67f2b9f": {
    sub_name: "Medicare & VA Plans",
    reason: "TRICARE is military health (closest match in current taxonomy)",
  },
  // VA Insurance Service (SGLI/VGLI/VALife) → Life Insurance
  "7fdcf0c6-8167-4422-a529-693d89f6e4ca": {
    sub_name: "Life Insurance",
    reason: "SGLI/VGLI/VALife are all life-insurance products",
  },
};

// Confirmed TRUE-DUP — soft-archive the newer/less-rich row.
const FAY_KEEP_ID = "40b5c859-1ec1-4901-bbdd-8f7fb9611ad5"; // FAVAHCS (richer)
const FAY_ARCHIVE_ID = "4aa0007c-a635-4c05-bf21-c8cba25cf4f0"; // newer dup

(async () => {
  console.log(`\n=== NC Phase 4 Cleanup (${COMMIT ? "COMMIT" : "DRY-RUN"}) ===\n`);

  // ──────────────────────────────────────────────────────────────────
  // 1. Backfill 5 orphan resource_subcategories junctions
  // ──────────────────────────────────────────────────────────────────
  console.log(`-- STEP 1: Backfill ${Object.keys(ORPHAN_SUB_MAP).length} Insurance orphan junctions --\n`);

  // Pull the Insurance subcategory roster
  const insCat = await supabaseAdmin
    .from("categories")
    .select("id")
    .eq("name", "Insurance Services")
    .single();
  if (insCat.error) throw insCat.error;
  const INS_CAT_ID = insCat.data!.id;

  const { data: subs, error: subErr } = await supabaseAdmin
    .from("subcategories")
    .select("id, name, category_id")
    .eq("category_id", INS_CAT_ID);
  if (subErr) throw subErr;
  const subByName = new Map<string, string>();
  (subs || []).forEach((s) =>
    subByName.set((s.name || "").toLowerCase().trim(), s.id),
  );

  // Fetch the 5 orphan rows for verification
  const orphanIds = Object.keys(ORPHAN_SUB_MAP);
  const { data: orphanRows, error: orphErr } = await supabaseAdmin
    .from("resources")
    .select("id, title, category_id, subcategory")
    .in("id", orphanIds);
  if (orphErr) throw orphErr;
  const orphanById = new Map((orphanRows || []).map((r) => [r.id, r]));

  let backfilled = 0;
  let backfillSkipped = 0;
  for (const [resource_id, plan] of Object.entries(ORPHAN_SUB_MAP)) {
    const row = orphanById.get(resource_id);
    if (!row) {
      console.log(`  SKIP  ${resource_id} — row not found`);
      backfillSkipped++;
      continue;
    }
    if (row.category_id !== INS_CAT_ID) {
      console.log(`  SKIP  ${row.title} — not in Insurance category`);
      backfillSkipped++;
      continue;
    }
    const sub_id = subByName.get(plan.sub_name.toLowerCase().trim());
    if (!sub_id) {
      console.log(`  SKIP  ${row.title} — sub "${plan.sub_name}" not found`);
      backfillSkipped++;
      continue;
    }
    console.log(
      `  ${COMMIT ? "WRITE" : "PLAN "} ${row.title}  →  ${plan.sub_name}  (${plan.reason})`,
    );
    if (COMMIT) {
      const { error } = await supabaseAdmin
        .from("resource_subcategories")
        .upsert(
          { resource_id, subcategory_id: sub_id },
          { onConflict: "resource_id,subcategory_id" },
        );
      if (error) {
        console.log(`    INSERT FAILED: ${error.message}`);
        backfillSkipped++;
        continue;
      }
    }
    backfilled++;
  }

  // ──────────────────────────────────────────────────────────────────
  // 2. Soft-archive the Fayetteville VAMC duplicate
  // ──────────────────────────────────────────────────────────────────
  console.log(`\n-- STEP 2: Soft-archive Fayetteville VAMC duplicate --\n`);

  const { data: pair, error: pErr } = await supabaseAdmin
    .from("resources")
    .select("id, title, status, source_name, phone, address")
    .in("id", [FAY_KEEP_ID, FAY_ARCHIVE_ID]);
  if (pErr) throw pErr;
  const keepRow = pair?.find((r) => r.id === FAY_KEEP_ID);
  const archRow = pair?.find((r) => r.id === FAY_ARCHIVE_ID);

  let archived = 0;
  if (!keepRow || !archRow) {
    console.log(`  SKIP  one or both rows not found (keep=${!!keepRow}, arch=${!!archRow})`);
  } else if (archRow.status === "archived") {
    console.log(`  SKIP  ${archRow.title} (${archRow.id}) already archived`);
  } else if (
    keepRow.phone !== archRow.phone ||
    keepRow.address !== archRow.address
  ) {
    console.log(
      `  SKIP  Fayetteville pair no longer matches on phone+address — manual review required`,
    );
  } else {
    const newSource = `ARCHIVED — duplicate of ${FAY_KEEP_ID} (${keepRow.title}); original source_name="${archRow.source_name}"`;
    console.log(`  KEEP    ${keepRow.title}  (${keepRow.id})`);
    console.log(`  ${COMMIT ? "WRITE " : "PLAN  "}archive  ${archRow.title}  (${archRow.id})`);
    console.log(`           source_name → "${newSource}"`);
    if (COMMIT) {
      const { error } = await supabaseAdmin
        .from("resources")
        .update({ status: "archived", source_name: newSource })
        .eq("id", FAY_ARCHIVE_ID);
      if (error) {
        console.log(`    UPDATE FAILED: ${error.message}`);
      } else {
        archived++;
      }
    } else {
      archived++;
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Summary
  // ──────────────────────────────────────────────────────────────────
  console.log(
    `\nSummary: ${backfilled} junctions ${COMMIT ? "backfilled" : "to backfill"} (${backfillSkipped} skipped); ` +
      `${archived} duplicate ${COMMIT ? "archived" : "to archive"}.`,
  );
  if (!COMMIT) console.log(`\n(dry-run only — pass --commit to write)\n`);
})();
