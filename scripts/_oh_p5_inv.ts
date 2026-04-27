import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
(async () => {
  const { data: cats } = await sb.from("categories").select("id, slug");
  const { count: total } = await sb.from("resources").select("*", { count: "exact", head: true }).eq("state","OH");
  const cmap = new Map((cats||[]).map((c:any)=>[c.id, c.slug]));
  console.log(`\nOH total: ${total}\n`);
  const counts: Record<string, number> = {};
  for (const c of cats||[]) {
    const { count } = await sb.from("resources").select("*", { count:"exact", head:true }).eq("state","OH").eq("category_id", (c as any).id);
    counts[(c as any).slug] = count || 0;
  }
  const sorted = Object.entries(counts).sort((a,b)=>a[1]-b[1]);
  console.log("=== CAT COUNTS (low→high) ===");
  sorted.forEach(([k,v])=>console.log(`  ${v.toString().padStart(3)}  ${k}`));
})();
