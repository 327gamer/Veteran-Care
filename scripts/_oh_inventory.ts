import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { data: rows } = await sb.from("resources").select("title, website_url, city").eq("state", "OH");
  console.log("OH total:", rows?.length);
  const titles = (rows||[]).map((r:any)=>r.title).sort();
  console.log("\n--- ALL TITLES ---");
  titles.forEach(t=>console.log(t));
})();
