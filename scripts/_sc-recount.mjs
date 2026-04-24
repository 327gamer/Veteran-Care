import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { count } = await sb.from("resources").select("*",{count:"exact",head:true}).eq("state","SC").eq("status","approved");
const { data } = await sb.from("resources").select("city").eq("state","SC").eq("status","approved");
const cities = new Set(data.map(r=>r.city).filter(Boolean));
console.log(`SC approved: ${count}, cities: ${cities.size}`);
// Was the older row count 761? Let me also check pending
const { count: pending } = await sb.from("resources").select("*",{count:"exact",head:true}).eq("state","SC").eq("status","pending");
console.log(`SC pending: ${pending}`);
