import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: ga } = await sb.from("resources").select("id").eq("state","GA").eq("status","approved");
const ids = ga.map(r=>r.id);
const have = new Set();
for (let i = 0; i < ids.length; i += 200) {
  const slice = ids.slice(i, i+200);
  const { data, error } = await sb.from("resource_categories").select("resource_id").in("resource_id", slice);
  if (error) { console.error("ERR at",i,error); continue; }
  data.forEach(j => have.add(j.resource_id));
}
console.log(`GA approved: ${ids.length}, with junction: ${have.size}, orphan: ${ids.length - have.size}`);
const orphans = ids.filter(id => !have.has(id));
if (orphans.length) {
  const { data: sample } = await sb.from("resources").select("id,title,city,category_id").in("id", orphans.slice(0,8));
  sample.forEach(r => console.log(`  [${r.id.substring(0,8)}] ${r.city||"-"}  ${r.title}  cat=${r.category_id?.substring(0,8)||"-"}`));
}
