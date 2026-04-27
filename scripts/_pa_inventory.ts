import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const all: any[] = []; let from = 0; const sz = 1000;
  while (true) {
    const r = await sb.from("resources").select("title, city, website_url").eq("state","PA").range(from, from+sz-1);
    if (!r.data?.length) break;
    all.push(...r.data);
    if (r.data.length < sz) break;
    from += sz;
  }
  all.sort((a:any,b:any)=>a.title.localeCompare(b.title));
  all.forEach((r:any)=>console.log(`${r.title} :: ${r.city||"-"} :: ${r.website_url||"-"}`));
})();
