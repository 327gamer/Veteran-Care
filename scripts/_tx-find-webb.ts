import { supabaseAdmin } from "../server/supabase";
const { data } = await supabaseAdmin.from("resources")
  .select("id,title,city,state,website_url,source_name")
  .eq("state","TX").ilike("title","%Webb%");
console.log(JSON.stringify(data, null, 2));
