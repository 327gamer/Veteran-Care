import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const KEEP_ID = "23a84020-4d23-43b9-b675-c35957a83e8f"; // older, explicit "women veterans" desc
const DROP_ID = "5afaddb2-9771-4433-bc2e-c9686dfc0e50"; // newer, accidental dup

console.log(`Merging better URL from drop into kept row, then deleting dup...`);
const { error: up } = await sb.from("resources").update({
  website_url: "https://atlantamission.org/programs/my-sisters-house",
}).eq("id", KEEP_ID);
if (up) { console.error("update fail:", up); process.exit(1); }
console.log(`  ✓ updated [${KEEP_ID.substring(0,8)}] with deep-link URL`);

const { error: jd } = await sb.from("resource_categories").delete().eq("resource_id", DROP_ID);
if (jd) console.error("junc del:", jd);
const { error: jd2 } = await sb.from("resource_subcategories").delete().eq("resource_id", DROP_ID);
if (jd2) console.error("sub junc del:", jd2);
const { error: rd } = await sb.from("resources").delete().eq("id", DROP_ID);
if (rd) { console.error("delete fail:", rd); process.exit(1); }
console.log(`  ✓ deleted dup [${DROP_ID.substring(0,8)}]`);
