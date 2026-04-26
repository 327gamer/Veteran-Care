import { supabaseAdmin } from "../server/supabase";
async function main() {
  const { data: cats } = await supabaseAdmin.from("categories").select("id,slug");
  const map = new Map<string,string>(); for (const c of cats||[]) map.set((c as any).id, (c as any).slug);
  const { data: rs } = await supabaseAdmin.from("resources").select("category_id").eq("state", "OH");
  const dist: Record<string, number> = {};
  for (const r of rs||[]) { const s = map.get((r as any).category_id) || "(none)"; dist[s] = (dist[s]||0)+1; }
  for (const [s,n] of Object.entries(dist).sort((a,b)=>(b[1] as number)-(a[1] as number))) console.log(`  ${String(n).padStart(4)}  ${s}`);
}
main().catch(e=>{console.error(e);process.exit(1);});
