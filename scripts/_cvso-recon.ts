import { createClient } from "@supabase/supabase-js";
const sb = createClient(
  "https://" + (process.env.SUPABASE_URL?.replace(/^https?:\/\//, "") ?? "").replace(/\/$/, ""),
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
async function main() {
  // What CVSO/County rows already exist for TX?
  const { data, error } = await sb
    .from("resources")
    .select("title, city, state, source_name, website_url")
    .eq("state", "TX")
    .or("title.ilike.%county%,title.ilike.%veterans service%,title.ilike.%CVSO%,title.ilike.%veteran service%")
    .limit(60);
  if (error) { console.error(error); process.exit(1); }
  console.log(`existing TX county-ish rows: ${data?.length ?? 0}`);
  for (const r of data ?? []) console.log(`  ${r.city ?? "(no-city)"}  |  ${r.title}`);

  // Also list any title with "Service" + state TX to catch any County VSO program pre-existing
  const { data: d2 } = await sb
    .from("resources")
    .select("title, city")
    .eq("state", "TX")
    .ilike("title", "%VSO%");
  console.log(`\ntitles ILIKE %VSO%: ${d2?.length ?? 0}`);
  for (const r of d2 ?? []) console.log(`  ${r.city ?? "(no-city)"} | ${r.title}`);
}
main();
