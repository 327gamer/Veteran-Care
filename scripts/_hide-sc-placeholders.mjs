// Founder decision (Phase 6): the 6 "Veteran Care —" placeholder rows are
// generic catalog headings, not real organizations. Move them to status='pending'
// so they are hidden from the public resource directory but kept for potential
// reuse by jobs/training/internal platform modules.
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const COMMIT = process.argv.includes("--commit");

const { data: rows, error } = await sb.from("resources")
  .select("id, title, status").eq("state","SC")
  .ilike("title","Veteran Care —%").range(0,99);
if (error) { console.error(error); process.exit(1); }

console.log(`Found ${rows.length} placeholders:`);
rows.forEach(r => console.log(`  [${r.id.substring(0,8)}] ${r.status}  ${r.title}`));

if (!COMMIT) { console.log("\n(dry-run only — pass --commit)"); process.exit(0); }

let n = 0;
for (const r of rows) {
  const { error: ue } = await sb.from("resources").update({ status: "pending" }).eq("id", r.id);
  if (!ue) n++;
}
console.log(`\nHidden (set to pending): ${n}`);
