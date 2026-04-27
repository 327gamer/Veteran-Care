import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const all: any[] = []; let from = 0; const sz = 1000;
  while (true) {
    const r = await sb.from("resources").select("city, category_id").eq("state","TX").range(from, from+sz-1);
    if (!r.data?.length) break;
    all.push(...r.data);
    if (r.data.length < sz) break;
    from += sz;
  }
  const cats = await sb.from("categories").select("id, slug");
  const cm: Record<number,string> = {}; cats.data?.forEach((c:any)=>cm[c.id]=c.slug);
  const cities = new Set(all.map(r=>r.city).filter(c=>c && c!=='-'));
  const cd: Record<string,number> = {};
  all.forEach(r=>{ const k = cm[r.category_id]||"unknown"; cd[k]=(cd[k]||0)+1; });
  console.log(`TX TOTAL: ${all.length}`);
  console.log(`TX CITIES: ${cities.size}`);
  console.log(`TX CATEGORIES: ${Object.keys(cd).length}/17`);
  console.log("CAT DIST (sorted):");
  Object.entries(cd).sort(([,a],[,b])=>a-b).forEach(([k,v])=>console.log(`  ${k}: ${v}`));
})();
