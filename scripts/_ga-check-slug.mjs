import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("resources").select("*").eq("state","GA").limit(1);
console.log(Object.keys(data[0]).join("\n"));
