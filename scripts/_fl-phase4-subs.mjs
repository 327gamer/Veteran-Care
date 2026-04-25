import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const cats = ['end-of-life-services','family-support','crisis-help','disabled-veterans','legal','food-assistance','employment','housing'];
const { data: c } = await sb.from('categories').select('id,slug,name').in('slug', cats);
for (const cat of c) {
  const { data: subs } = await sb.from('subcategories').select('name').eq('category_id', cat.id).order('name');
  console.log(`\n${cat.slug} (${cat.name}):`);
  for (const s of subs) console.log(`  - ${s.name}`);
}
