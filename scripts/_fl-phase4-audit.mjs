import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL || 'https://oblbvlqluxejhlmuqkkj.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data: rows, error } = await sb.from('resources')
  .select('id,title,city,state,latitude,longitude,resource_categories(category_id,categories(slug,name))')
  .eq('state','FL').eq('status','approved').limit(2000);
if (error) { console.error(error); process.exit(1); }

console.log(`Total FL rows: ${rows.length}`);

const byCity = {}, byCat = {}, noCoords = [], catCity = {};
for (const r of rows) {
  const city = r.city || '(statewide)';
  byCity[city] = (byCity[city] || 0) + 1;
  for (const rc of r.resource_categories || []) {
    const slug = rc.categories?.slug || 'unknown';
    byCat[slug] = (byCat[slug] || 0) + 1;
    catCity[`${slug}|${city}`] = (catCity[`${slug}|${city}`] || 0) + 1;
  }
  if (r.city && (!r.latitude || !r.longitude)) noCoords.push({title: r.title, city: r.city});
}

console.log('\n=== Cat counts (FL) — sorted asc ===');
for (const k of Object.keys(byCat).sort((a,b) => byCat[a] - byCat[b])) console.log(`  ${k.padEnd(30)} ${byCat[k]}`);

console.log(`\n=== Cities total: ${Object.keys(byCity).length} ===`);
const cityKeys = Object.keys(byCity).sort((a,b) => byCity[b] - byCity[a]);
console.log('Top 25:');
for (const c of cityKeys.slice(0, 25)) console.log(`  ${c.padEnd(35)} ${byCity[c]}`);

const thinCities = cityKeys.filter(c => byCity[c] === 1 && c !== '(statewide)');
console.log(`\nSingle-row cities (under-covered): ${thinCities.length}`);
console.log(`  ${thinCities.slice(0, 50).join(' / ')}`);

const twoCities = cityKeys.filter(c => byCity[c] === 2 && c !== '(statewide)');
console.log(`\n2-row cities: ${twoCities.length}`);
console.log(`  ${twoCities.slice(0, 30).join(' / ')}`);

console.log(`\n=== Missing-coord rows (city present, no lat/lng) === ${noCoords.length}`);
for (const r of noCoords.slice(0, 20)) console.log(`  ${r.title} [${r.city}]`);

console.log(`\n=== Weak cats per metro (looking at 8 priority cats x top metros) ===`);
const priCats = ['family-support','end-of-life-services','crisis-help','disabled-veterans','food-assistance','legal','employment','housing'];
const priCities = ['Tampa','Jacksonville','Miami','Orlando','Pensacola','Tallahassee','Fort Lauderdale','West Palm Beach','Sarasota','Naples','Daytona Beach','Melbourne','Lakeland','Gainesville','Ocala','St. Petersburg','Fort Myers'];
for (const c of priCities) {
  const counts = priCats.map(pc => `${pc.slice(0,3)}=${catCity[`${pc}|${c}`]||0}`).join(' ');
  console.log(`  ${c.padEnd(20)} ${counts}`);
}
