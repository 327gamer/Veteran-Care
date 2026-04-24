import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("resources").select("id, title, status, latitude, longitude")
  .eq("state","SC").ilike("title","Spartanburg Community College%").range(0,99);
data.forEach(r=>console.log(`  [${r.id.substring(0,8)}] ${r.status.padEnd(8)} lat=${r.latitude} ${r.title}`));
