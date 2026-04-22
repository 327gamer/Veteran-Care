/**
 * NC Duplicate Cleanup
 *
 * Removes NC rows that are functional duplicates of existing national
 * (state IS NULL) rows. Per founder rule:
 *   "national/federal resources stored once where appropriate;
 *    state-specific rows only where there is a true state entity"
 *
 * Each NC row removed has been verified to have a national equivalent
 * already in the DB. The national row will continue to surface in
 * `?state=NC` queries (already verified — endpoint returns 266 rows
 * for NC = 177 NC + 89 national).
 *
 * Safety:
 *   - Exact-title match only (no LIKE, no fuzzy)
 *   - Hardcoded list — no dynamic deletion
 *   - Cascades junction rows (resource_categories + resource_subcategories)
 *   - Dry-run mode by default; pass --commit to actually delete
 *
 * Run:
 *   tsx scripts/cleanup-nc-duplicates.ts            # dry-run
 *   tsx scripts/cleanup-nc-duplicates.ts --commit   # delete
 */
import { supabaseAdmin } from "../server/supabase";

const COMMIT = process.argv.includes("--commit");

const NC_DUPLICATES_TO_DELETE: { title: string; nationalEquivalent: string }[] = [
  { title: "Veterans Crisis Line", nationalEquivalent: "Veterans Crisis Line" },
  { title: "988 Suicide & Crisis Lifeline (NC)", nationalEquivalent: "988 Suicide & Crisis Lifeline" },
  { title: "Helmets to Hardhats — North Carolina", nationalEquivalent: "Helmets to Hardhats" },
  { title: "Operation Homefront — North Carolina", nationalEquivalent: "Operation Homefront" },
  { title: "Hire Heroes USA — NC Career Programs", nationalEquivalent: "Hire Heroes USA" },
  { title: "Student Veterans of America — NC Chapters", nationalEquivalent: "Student Veterans of America (SVA)" },
  { title: "Veterati Mentorship Network (NC veterans)", nationalEquivalent: "Veterati - Veteran Career Mentoring" },
  { title: "Wounded Warrior Project Warriors to Work — North Carolina", nationalEquivalent: "Wounded Warrior Project - Benefits Assistance" },
];

async function main() {
  console.log(`\n=== NC Duplicate Cleanup (${COMMIT ? "COMMIT" : "DRY-RUN"}) ===\n`);
  console.log(`Targets: ${NC_DUPLICATES_TO_DELETE.length} exact-title NC rows\n`);

  const before = await supabaseAdmin.from("resources").select("id", { count: "exact", head: true }).eq("state", "NC");
  console.log(`[before] NC rows in DB: ${before.count}`);

  const results = {
    deleted: 0,
    notFound: 0,
    nationalMissing: 0,
    junctionsRemoved: 0,
    errors: [] as string[],
  };

  for (const { title, nationalEquivalent } of NC_DUPLICATES_TO_DELETE) {
    // Verify the national equivalent still exists — never delete an NC row
    // unless its national counterpart is present
    const { data: nat, error: natErr } = await supabaseAdmin
      .from("resources")
      .select("id, title")
      .is("state", null)
      .ilike("title", nationalEquivalent)
      .limit(1);

    if (natErr || !nat || nat.length === 0) {
      results.nationalMissing++;
      results.errors.push(`SKIP "${title}" — national equivalent "${nationalEquivalent}" not found`);
      console.log(`  SKIP: "${title}" — national "${nationalEquivalent}" missing`);
      continue;
    }

    // Find the NC row by EXACT title
    const { data: ncRow, error: ncErr } = await supabaseAdmin
      .from("resources")
      .select("id, title")
      .eq("state", "NC")
      .eq("title", title)
      .limit(1);

    if (ncErr || !ncRow || ncRow.length === 0) {
      results.notFound++;
      console.log(`  NOT FOUND: "${title}"`);
      continue;
    }

    const ncId = ncRow[0].id;
    console.log(`  ${COMMIT ? "DELETE" : "WOULD DELETE"}: "${title}" [${ncId}] → keeps national "${nat[0].title}"`);

    if (COMMIT) {
      // Delete junctions first
      const { count: rcCount } = await supabaseAdmin
        .from("resource_categories")
        .delete({ count: "exact" })
        .eq("resource_id", ncId);
      const { count: rsCount } = await supabaseAdmin
        .from("resource_subcategories")
        .delete({ count: "exact" })
        .eq("resource_id", ncId);
      results.junctionsRemoved += (rcCount || 0) + (rsCount || 0);

      // Delete the resource itself
      const { error: delErr } = await supabaseAdmin.from("resources").delete().eq("id", ncId);
      if (delErr) {
        results.errors.push(`DELETE failed for "${title}": ${delErr.message}`);
        console.log(`    ERROR: ${delErr.message}`);
      } else {
        results.deleted++;
      }
    } else {
      results.deleted++; // would-delete count for dry-run
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`  ${COMMIT ? "Deleted" : "Would delete"}     : ${results.deleted}`);
  console.log(`  Not found              : ${results.notFound}`);
  console.log(`  Skipped (no national)  : ${results.nationalMissing}`);
  console.log(`  Junction rows removed  : ${results.junctionsRemoved}`);
  console.log(`  Errors                 : ${results.errors.length}`);
  if (results.errors.length) results.errors.forEach(e => console.log(`    - ${e}`));

  const after = await supabaseAdmin.from("resources").select("id", { count: "exact", head: true }).eq("state", "NC");
  console.log(`\n[after]  NC rows in DB: ${after.count}`);

  if (!COMMIT) {
    console.log(`\n(dry-run) Re-run with --commit to apply.\n`);
  }
}

main().catch(e => {
  console.error("FATAL:", e);
  process.exit(1);
});
