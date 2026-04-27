import { createClient } from "@supabase/supabase-js";
async function main() {
  const sb = createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: cats } = await sb.from("categories").select("id,slug,name");
  const { data: subs } = await sb.from("subcategories").select("id,name,category_id");
  const map = new Map(cats!.map((c: any) => [c.id, c.slug]));
  const grouped: Record<string, string[]> = {};
  for (const s of subs!) {
    const slug = (map.get(s.category_id) as string) || "?";
    (grouped[slug] = grouped[slug] || []).push(s.name);
  }
  for (const [slug, names] of Object.entries(grouped).sort()) {
    console.log(`\n${slug}:`);
    for (const n of names.sort()) console.log(`  - ${n}`);
  }
}
main();
