import { supabaseAdmin } from "../server/supabase";
async function main() {
  const { data } = await supabaseAdmin.from("categories").select("slug").order("slug");
  for (const r of data||[]) console.log((r as any).slug);
}
main().catch(e=>{console.error(e);process.exit(1);});
