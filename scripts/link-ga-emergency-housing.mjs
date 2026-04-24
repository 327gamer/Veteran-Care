// GA-only additive fix: link homeless/emergency housing rows to canonical
// "emergency-housing" sub so the Emergency Housing chip surfaces them.
// SC/NC rows are NOT touched.

import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const COMMIT = process.argv.includes("--commit");

const { data: targetSub } = await sb.from("subcategories").select("id, slug").eq("slug", "emergency-housing").single();
const { data: longSub } = await sb.from("subcategories").select("id, slug").eq("slug", "emergency-housing-homeless-shelters").single();
const { data: hvsSub } = await sb.from("subcategories").select("id, slug").eq("slug", "homeless-veteran-services").single();

console.log("Target sub (emergency-housing):", targetSub?.id);
console.log("Long sub (emergency-housing-homeless-shelters):", longSub?.id);
console.log("HVS sub (homeless-veteran-services):", hvsSub?.id);

const { data: gaRows } = await sb.from("resources")
  .select("id, title, resource_subcategories(subcategory_id)")
  .eq("state", "GA");

const candidateIds = new Set();
for (const r of gaRows || []) {
  const subIds = (r.resource_subcategories || []).map(rs => rs.subcategory_id);
  if (subIds.includes(longSub.id) || subIds.includes(hvsSub.id)) {
    if (!subIds.includes(targetSub.id)) {
      candidateIds.add(r.id);
      console.log(" → will link:", r.title);
    }
  }
}

console.log(`\nCandidates: ${candidateIds.size}`);

if (!COMMIT) {
  console.log("\nDRY RUN. Re-run with --commit to insert.");
  process.exit(0);
}

const inserts = [...candidateIds].map(rid => ({ resource_id: rid, subcategory_id: targetSub.id }));
const { error } = await sb.from("resource_subcategories").insert(inserts);
if (error) {
  console.error("INSERT FAILED:", error);
  process.exit(1);
}
console.log(`✓ Inserted ${inserts.length} new emergency-housing links for GA rows.`);
