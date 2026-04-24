import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const titles = [
  "Charlie Norwood VA Medical Center","Atlanta Mission","Georgia Department of Labor",
  "View Point Health","Lawrenceville Cooperative Ministry","MUST Ministries",
  "Mercy Care","Atlanta Volunteer Lawyers Foundation","Georgia Legal Services Program",
  "Georgia Department of Veterans Service","Kennesaw State University"
];
for (const t of titles) {
  const { data } = await sb.from("resources").select("id,title,address,city,phone,website_url").eq("state","GA").eq("status","approved").ilike("title", `${t}%`);
  if (data?.length) {
    console.log(`\n=== "${t}" (${data.length} matches) ===`);
    data.forEach(r => {
      console.log(`  [${r.id.substring(0,8)}] "${r.title}"`);
      console.log(`      addr: ${r.address || "-"}  | city: ${r.city || "-"}`);
    });
  }
}
