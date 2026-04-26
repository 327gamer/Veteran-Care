/**
 * Webb County secondary hotfix — architect re-audit caught that
 * webbcountytx.gov/VeteranServices/ DOES exist and returns 200 with
 * title "Veteran Services" (39 vet keyword mentions). My initial
 * recovery harvest stopped at the first vet anchor (WCRVTP) and never
 * verified the dedicated /VeteranServices/ page.
 *
 * This row is repointed to the dedicated CVSO page; title corrected
 * from "Webb County Regional Veterans Treatment Program" to the
 * standard "Webb County Veteran Services Office" to match the rest
 * of the B3 catalog. The WCRVTP program still exists as a separate
 * Webb County program and can be added in B3-B as a distinct row
 * (different category — substance-recovery or legal/court diversion).
 */

import { supabaseAdmin } from "../server/supabase";
const COMMIT = process.argv.includes("--commit");

async function main() {
  const { data, error } = await supabaseAdmin
    .from("resources")
    .select("id, title, website_url, source_name, state")
    .eq("state", "TX")
    .ilike("title", "%Webb%");
  if (error) { console.error(error); process.exit(1); }
  if (!data || data.length === 0) { console.error("Webb row not found"); process.exit(1); }
  if (data.length > 1) { console.error("Multiple Webb rows found"); process.exit(1); }

  const row = data[0];
  const newTitle = "Webb County Veteran Services Office";
  const newUrl = "https://www.webbcountytx.gov/VeteranServices/";
  const newSourceName = "Webb County Texas — Veteran Services";
  console.log("Current Webb row:");
  console.log(`  title:       ${row.title}`);
  console.log(`  website_url: ${row.website_url}`);
  console.log(`  source_name: ${row.source_name}`);
  console.log("");
  console.log("Proposed update:");
  console.log(`  title:       ${newTitle}`);
  console.log(`  website_url: ${newUrl}`);
  console.log(`  source_name: ${newSourceName}`);
  console.log("");
  if (!COMMIT) { console.log("Dry-run only. Re-run with --commit to apply."); return; }

  const { error: updErr } = await supabaseAdmin
    .from("resources")
    .update({ title: newTitle, website_url: newUrl, source_name: newSourceName })
    .eq("id", row.id);
  if (updErr) { console.error("UPDATE error:", updErr); process.exit(1); }
  console.log("UPDATED.");
}
main().catch(e => { console.error(e); process.exit(1); });
