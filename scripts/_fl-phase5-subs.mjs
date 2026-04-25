import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: cats } = await sb.from('categories').select('id,slug');
const map = Object.fromEntries(cats.map(c => [c.slug, c.id]));
for (const c of ['transportation','mental-health','education','community-support']) {
  const id = map[c];
  if (!id) { console.log(`No cat ${c}`); continue; }
  const { data } = await sb.from('resources').select('subcategory').eq('category_id', id).eq('status','approved');
  const subs = [...new Set((data||[]).map(r => r.subcategory).filter(Boolean))].sort();
  console.log(`\n=== ${c} (${data?.length||0} rows) ===`);
  for (const s of subs) console.log(`  "${s}"`);
}
