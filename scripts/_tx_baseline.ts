import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  // probe one row
  const probe = await sb.from("resources").select("*").eq("state","TX").limit(1);
  if (probe.data?.[0]) console.log("COLS:", Object.keys(probe.data[0]).join(", "));

  // get all categories first
  const { data: cats } = await sb.from("categories").select("id, slug");
  const catMap = new Map((cats||[]).map((c:any)=>[c.id, c.slug]));

  const all: any[] = [];
  let from = 0; const sz = 1000;
  while (true) {
    const r = await sb.from("resources").select("title, city, category_id, website_url, source_name").eq("state","TX").range(from, from+sz-1);
    if (r.error) { console.error("ERR:", r.error); break; }
    if (!r.data?.length) break;
    all.push(...r.data);
    if (r.data.length < sz) break;
    from += sz;
  }
  console.log("TX total:", all.length);
  const cities = new Set(all.map((r:any)=>r.city).filter(Boolean));
  console.log("TX cities:", cities.size);
  const ccnt: Record<string,number> = {};
  all.forEach((r:any)=>{ const k = catMap.get(r.category_id) || `cat#${r.category_id}`; ccnt[k]=(ccnt[k]||0)+1; });
  console.log("\nCAT DIST:");
  Object.entries(ccnt).sort((a:any,b:any)=>a[1]-b[1]).forEach(([k,v])=>console.log(`  ${String(v).padStart(4)}  ${k}`));
})();
