// Architect URL audit: all scdmh.net/locations/* deep links return 404.
// The working parent is https://www.scdmh.org/community-centers/ (the official
// SC Department of Mental Health domain has migrated; the old scdmh.net deep
// pages are gone). Patch every SC resource pointing to scdmh.net/locations/*
// to the live community-centers parent so users hit a real page.
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const COMMIT = process.argv.includes("--commit");
const TARGET = "https://www.scdmh.org/community-centers/";

const { data: rows, error } = await sb
  .from("resources")
  .select("id, title, website_url")
  .eq("state", "SC").eq("status", "approved")
  .ilike("website_url", "%scdmh.net/locations%")
  .range(0, 9999);

if (error) { console.error("ERR:", error); process.exit(1); }

console.log(`Broken DMH URLs to patch: ${rows.length}`);
rows.forEach(r => console.log(`  [${r.id.substring(0,8)}] ${r.title}`));

if (!COMMIT) { console.log("\n(dry-run only — pass --commit)"); process.exit(0); }

let n = 0;
for (const r of rows) {
  const { error: ue } = await sb.from("resources").update({ website_url: TARGET }).eq("id", r.id);
  if (!ue) n++;
}
console.log(`\nPatched: ${n}`);
