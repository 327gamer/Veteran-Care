import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const COMMIT = process.argv.includes("--commit");

const COLUMBIA = { city: "Columbia", latitude: 34.0007, longitude: -81.0394 };
const PLACEHOLDER_PREFIX = "Veteran Care —";

const { data: rows, error } = await sb
  .from("resources")
  .select("id, title, city, status, latitude, longitude")
  .eq("state", "SC")
  .eq("status", "approved")
  .range(0, 9999);

if (error) { console.error("ERR:", error); process.exit(1); }

const noCity = rows.filter(r => !((r.city || "").trim()));
console.log(`Total approved SC: ${rows.length}`);
console.log(`No-city rows: ${noCity.length}`);

const placeholders = noCity.filter(r => (r.title || "").startsWith(PLACEHOLDER_PREFIX));
const legit = noCity.filter(r => !(r.title || "").startsWith(PLACEHOLDER_PREFIX));

console.log(`\nLegitimate statewide (will assign Columbia centroid): ${legit.length}`);
console.log(`Placeholder "Veteran Care —" rows (flag for founder review): ${placeholders.length}`);

console.log("\n=== PLACEHOLDERS FOR FOUNDER REVIEW ===");
placeholders.forEach(r => console.log(`  [${r.id}] ${r.title}`));

if (!COMMIT) {
  console.log(`\n(dry-run only — pass --commit to update ${legit.length} legit rows to Columbia centroid)`);
  process.exit(0);
}

let updated = 0, errs = 0;
for (const r of legit) {
  const { error: ue } = await sb
    .from("resources")
    .update(COLUMBIA)
    .eq("id", r.id);
  if (ue) { console.error(`ERR ${r.id}: ${ue.message}`); errs++; }
  else updated++;
}

console.log(`\nUpdated: ${updated}  errors: ${errs}`);
console.log(`Placeholders left as-is for founder decision: ${placeholders.length}`);
