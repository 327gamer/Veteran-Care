import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { error } = await sb.from("resources").update({ status: "archived" }).eq("id", "6aa5cccf-b835-49c7-9f61-127b0265e64d");
console.log(error ? `ERR: ${error.message}` : "Archived 4th Spartanburg CC dup [6aa5cccf]");
