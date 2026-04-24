import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("resources")
  .select("id, title, city, latitude, longitude, address")
  .eq("state","SC").eq("status","approved")
  .range(0,9999);
const bad = data.filter(r => r.city && (!r.latitude || !r.longitude));
bad.forEach(r => console.log(`[${r.id}] city=${r.city}  lat=${r.latitude}  lng=${r.longitude}  ${r.title}\n      ${r.address||""}`));
