import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Total resources in DB
const { count: totalRes } = await sb.from("resources").select("*",{count:"exact",head:true});
console.log(`Total resources in DB: ${totalRes}`);

// Pull all resource IDs via pagination
async function pullAllIds() {
  const ids = new Set();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb.from("resources").select("id").range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    data.forEach(r => ids.add(r.id));
    if (data.length < PAGE) break;
  }
  return ids;
}
const allIds = await pullAllIds();
console.log(`Pulled IDs via pagination: ${allIds.size}`);

// Total junction rows
const { count: totalJunc } = await sb.from("resource_categories").select("*",{count:"exact",head:true});
console.log(`Total junction rows: ${totalJunc}`);

// Pull all junction rows via pagination
async function pullAllJunc() {
  const arr = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb.from("resource_categories").select("resource_id, category_id").range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    arr.push(...data);
    if (data.length < PAGE) break;
  }
  return arr;
}
const allJunc = await pullAllJunc();
console.log(`Pulled junction rows: ${allJunc.length}`);

// Pull SC resource IDs
const { data: scRows } = await sb.from("resources").select("id").eq("state","SC").range(0,9999);
const scIds = new Set(scRows.map(r=>r.id));
console.log(`SC resources: ${scIds.size}`);

// Now check: for junction rows whose resource_id is in scIds (SC scope),
// does that resource_id actually exist in the global resource set?
const scJunc = allJunc.filter(j => scIds.has(j.resource_id));
const orphanRes = scJunc.filter(j => !allIds.has(j.resource_id));
console.log(`SC-scoped junction rows: ${scJunc.length}`);
console.log(`Orphan-resource (SC junction → resource not in DB): ${orphanRes.length}`);

// Cat side
const { data: cats } = await sb.from("categories").select("id");
const catIds = new Set(cats.map(c=>c.id));
const orphanCat = scJunc.filter(j => !catIds.has(j.category_id));
console.log(`Orphan-category (SC junction → category not in DB): ${orphanCat.length}`);

// And the inverse: are there ANY junction rows in the DB whose resource_id is missing?
const allOrphanRes = allJunc.filter(j => !allIds.has(j.resource_id));
console.log(`\nGLOBAL orphan-resource junctions: ${allOrphanRes.length}`);
