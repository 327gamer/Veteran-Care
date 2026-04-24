import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
for (const partial of ["5afaddb2", "23a84020"]) {
  const { data } = await sb.from("resources").select("*").eq("state","GA").ilike("id", `${partial}%`);
  if (data?.[0]) {
    const r = data[0];
    console.log(`\n[${r.id}]`);
    console.log(`  title:   "${r.title}"`);
    console.log(`  addr:    ${r.address || "-"}`);
    console.log(`  city:    ${r.city || "-"}  zip: ${r.zip || "-"}`);
    console.log(`  phone:   ${r.phone || "-"}`);
    console.log(`  url:     ${r.website_url || "-"}`);
    console.log(`  status:  ${r.status}`);
    console.log(`  created: ${r.created_at}`);
    console.log(`  desc:    ${(r.short_description||"").substring(0,100)}`);
  }
}
// Search for any row with My Sister's House
const { data: matches } = await sb.from("resources").select("id,title,address,city,status").eq("state","GA").ilike("title","%My Sister%House%");
console.log(`\nAll "My Sister's House" matches:`);
matches?.forEach(r => console.log(`  [${r.id.substring(0,8)}] [${r.status}] "${r.title}" | ${r.address||"-"} | ${r.city||"-"}`));
