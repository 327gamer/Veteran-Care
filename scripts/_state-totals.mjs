import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
for (const st of ["GA","SC","NC","FL"]) {
  const { count } = await sb.from("resources").select("*", { count: "exact", head: true }).eq("state",st).eq("status","approved");
  const { data } = await sb.from("resources").select("city").eq("state",st).eq("status","approved");
  const cities = new Set(data.map(r=>r.city).filter(Boolean));
  console.log(`${st}: ${count} approved, ${cities.size} cities`);
}
