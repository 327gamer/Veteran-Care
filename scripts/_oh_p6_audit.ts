import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { count: total } = await sb.from("resources").select("*", { count: "exact", head: true }).eq("state", "OH");
  const { data: rows } = await sb.from("resources").select("category_id, city, website_url, phone, address, source_name, title").eq("state","OH");
  const { data: cats } = await sb.from("categories").select("id, slug");
  const map = new Map((cats||[]).map((c:any)=>[c.id, c.slug]));

  const r = rows || [];
  const noUrl = r.filter((x:any)=>!x.website_url);
  const noPhone = r.filter((x:any)=>!x.phone);
  const noAddr = r.filter((x:any)=>!x.address);
  const noSrc = r.filter((x:any)=>!x.source_name);
  const noTitle = r.filter((x:any)=>!x.title);
  const titleSet = new Set<string>(); const dupTitles: string[] = [];
  r.forEach((x:any)=>{ const k=(x.title||"").toLowerCase().trim(); if(titleSet.has(k))dupTitles.push(x.title); else titleSet.add(k); });

  const catCount: Record<string,number> = {};
  const cityCount: Record<string,number> = {};
  r.forEach((x:any)=>{ const s=map.get(x.category_id) as string; catCount[s]=(catCount[s]||0)+1; cityCount[x.city]=(cityCount[x.city]||0)+1; });
  const weakCats = Object.entries(catCount).filter(([_,n])=>n<20).sort((a:any,b:any)=>a[1]-b[1]);

  console.log("=== OH P6 AUDIT ===");
  console.log(`Total: ${total} | Cats: ${Object.keys(catCount).length}/17 | Cities: ${Object.keys(cityCount).length}`);
  console.log(`Missing URL: ${noUrl.length} | Missing phone: ${noPhone.length} | Missing addr: ${noAddr.length} | Missing source: ${noSrc.length} | Missing title: ${noTitle.length}`);
  console.log(`Duplicate titles: ${dupTitles.length}`);
  if (dupTitles.length) dupTitles.slice(0,5).forEach((t:string)=>console.log(`  dup: ${t}`));
  console.log(`Weak cats (<20): ${weakCats.length}`);
  weakCats.forEach(([s,n]:any)=>console.log(`  ${n}  ${s}`));
})();
