// Remove unverifiable VFW Post 9539 duplicates flagged by architect review.
// Real Post 9539 is in Spartanburg. The Easley and "Boiling Springs Auxiliary"
// rows reuse that post number without verification — drop them rather than ship
// fabricated VFW post numbers. Easley actually has VFW Post 4296.

import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const COMMIT = process.argv.includes("--commit");

const TITLES = [
  "Boiling Springs Veterans of Foreign Wars Post 9539 Auxiliary",
  "Easley Veterans of Foreign Wars Post 9539",
];

const { data: rows, error } = await sb
  .from("resources").select("id, title, city")
  .eq("state", "SC").in("title", TITLES);
if (error) { console.error("ERR:", error); process.exit(1); }

console.log(`Found ${rows.length} rows to remove:`);
rows.forEach(r => console.log(`  [${r.id}] ${r.title} (${r.city})`));

if (!COMMIT) { console.log("\n(dry-run only — pass --commit)"); process.exit(0); }

for (const r of rows) {
  await sb.from("resource_categories").delete().eq("resource_id", r.id);
  await sb.from("resource_subcategories").delete().eq("resource_id", r.id);
  const { error: de } = await sb.from("resources").delete().eq("id", r.id);
  console.log(de ? `ERR ${r.id}: ${de.message}` : `Deleted ${r.title}`);
}
