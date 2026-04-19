import fs from 'fs';
const allQueries = [
  { id: 'C1', cat: 'housing', q: 'veteran housing assistance South Carolina', expect: ['housing','transitional','homeless','homeownership','SC Housing'] },
  { id: 'C2', cat: 'healthcare', q: 'VA healthcare clinic South Carolina', expect: ['VA Clinic','VA Medical','Ralph H. Johnson','Dorn'] },
  { id: 'C3', cat: 'mental-health', q: 'PTSD counseling for veterans', expect: ['PTSD','Counseling','Therapy','Vet Center','NAMI'] },
  { id: 'C4', cat: 'employment', q: 'jobs for veterans South Carolina', expect: ['Boeing','Bosch','Michelin','MUSC','USAA','Shaw','SC Works','Hire Heroes','Employer'] },
  { id: 'C5', cat: 'legal', q: 'legal aid for veterans', expect: ['Legal Aid','SC Legal','Veterans Legal','Appleseed','SC Bar'] },
  { id: 'C6', cat: 'financial', q: 'financial assistance for veterans', expect: ['Financial','Emergency','Grant','Trust Fund','SC Veterans','Operation Homefront','Coalition'] },
  { id: 'C7', cat: 'transportation', q: 'transportation to VA appointments', expect: ['Transportation','DAV','Shuttle','Ride','VTS'] },
  { id: 'C8', cat: 'food-assistance', q: 'food assistance for veterans', expect: ['Food','Harvest Hope','SNAP','DSS','Pantry'] },
  { id: 'C9', cat: 'education', q: 'education benefits for veterans', expect: ['GI Bill','Education','University','College','Student','VR&E'] },
  { id: 'C10', cat: 'substance-recovery', q: 'addiction recovery for veterans', expect: ['Recovery','Substance','Addiction','Operation Deep Valor','Matt and Monica','AA','Sober'] },
  { id: 'C11', cat: 'family-support', q: 'family support for military spouse', expect: ['Family','Spouse','Military Family','Children','Operation Homefront','Blue Star'] },
  { id: 'C12', cat: 'disabled-veterans', q: 'help for disabled veterans', expect: ['Disabled','DAV','Paralyzed','Blind','Adaptive','Wheelchair'] },
  { id: 'C13', cat: 'community-support', q: 'veteran community groups South Carolina', expect: ['VFW','American Legion','Team RWB','Mission BBQ','Community','Group','Post','Chapter'] },
  { id: 'C14', cat: 'va-benefits', q: 'VA disability claim help', expect: ['VA','Claim','Disability','C&P','DAV','VSO','Veterans Affairs'] },
  { id: 'C15', cat: 'crisis-help', q: 'veteran crisis hotline', expect: ['Crisis','Suicide','Hotline','988','Veterans Crisis Line'] },
  { id: 'C16', cat: 'end-of-life', q: 'veteran funeral and burial benefits', expect: ['Burial','Funeral','Cemetery','National Cemetery','Memorial','Honor Guard','End of Life'] },
  { id: 'X1', cat: 'multi', q: 'homeless veteran services Charleston', userCity: 'charleston', expect: ['Charleston','Homeless','One80','Housing','Transitional'] },
  { id: 'X2', cat: 'healthcare', q: 'women veteran healthcare Columbia', userCity: 'columbia', expect: ['Women','Columbia','VA','Healthcare'] },
  { id: 'X3', cat: 'legal', q: 'legal help disabled veteran Greenville', userCity: 'greenville', expect: ['Greenville','Legal','SC Legal','Disabled'] },
  { id: 'X4', cat: 'transportation', q: 'transportation to VA appointment Florence', userCity: 'florence', expect: ['Florence','Transportation','DAV','Shuttle','Ride'] },
  { id: 'X5', cat: 'substance-recovery', q: 'addiction help veteran Myrtle Beach', userCity: 'myrtle beach', expect: ['Myrtle','Recovery','Addiction','Substance','AA','Operation Deep Valor'] },
  { id: 'E1', cat: 'mixed', q: 'homeless veteran with PTSD Charleston', userCity: 'charleston', expect: ['Homeless','PTSD','Counseling','One80','Mental','Charleston'] },
  { id: 'E2', cat: 'mixed', q: 'family help for deployed spouse', expect: ['Family','Spouse','Deployment','Operation Homefront','Blue Star','Military Family'] },
  { id: 'E3', cat: 'mixed', q: 'single mom veteran transitioning out of service', expect: ['Family','Women','Children','Spouse','Transition','Employment','Hire Heroes'] },
  { id: 'E4', cat: 'recreation', q: 'fly fishing therapy for veterans', expect: ['Project Healing Waters','PHWFF','Fishing','Healing Waters'] },
  { id: 'E5', cat: 'recreation', q: 'horseback riding therapy Bluffton', userCity: 'bluffton', expect: ['Horseback','Heroes on Horseback','Equine','CATR','Bluffton'] },
];

const batchStart = parseInt(process.argv[2] || '0');
const batchEnd = Math.min(batchStart + 9, allQueries.length);
const batch = allQueries.slice(batchStart, batchEnd);
console.log(`Running queries ${batchStart}..${batchEnd-1} (${batch.length} queries)\n`);

async function runQuery(q, userCity) {
  const resp = await fetch('http://localhost:5000/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: q }], userState: 'SC', userCity }) });
  return { status: resp.status, text: await resp.text() };
}
function parse(text) {
  const events = [];
  for (const line of text.split('\n')) if (line.startsWith('data: ')) { try { events.push(JSON.parse(line.slice(6))); } catch {} }
  const re = events.find(e => e.type === 'resources' || (e.resources && Array.isArray(e.resources)));
  const done = events.find(e=>e.type==='done') || {};
  return { resources: re?.resources || done.resources || [], categories: done.categories || re?.categories || [] };
}
function scoreHits(resources, expect) {
  const top5 = resources.slice(0,5);
  const hits = top5.filter(r => expect.some(t => {
    const lo = t.toLowerCase();
    return (r.title||'').toLowerCase().includes(lo) || (r.subcategory||'').toLowerCase().includes(lo) || (r.short_description||'').toLowerCase().includes(lo);
  }));
  return { hits: hits.length, top5: top5.length };
}

const existing = fs.existsSync('.local/validation-report.json') ? JSON.parse(fs.readFileSync('.local/validation-report.json','utf8')) : [];
const reportMap = new Map(existing.map(r => [r.id, r]));

for (const q of batch) {
  process.stdout.write(`${q.id} ${q.cat.padEnd(20)} `);
  const t0 = Date.now();
  const r = await runQuery(q.q, q.userCity);
  if (r.status === 429) { console.log(`❌ 429 RATE LIMIT (stop)`); break; }
  if (r.status !== 200) { console.log(`❌ HTTP ${r.status}`); continue; }
  const parsed = parse(r.text);
  const sc = scoreHits(parsed.resources, q.expect);
  const ms = Date.now()-t0;
  const status = sc.hits >= 2 ? 'PASS' : sc.hits === 1 ? 'WEAK' : 'FAIL';
  const icon = status==='PASS'?'✅':status==='WEAK'?'⚠️':'❌';
  console.log(`${icon}${status} ${sc.hits}/${sc.top5} | cats=${JSON.stringify(parsed.categories)} | ${ms}ms`);
  parsed.resources.slice(0,5).forEach((r,i) => console.log(`     ${i+1}. ${r.title} [${r.subcategory||'—'}] ${r.city ? '('+r.city+')' : ''}`));
  reportMap.set(q.id, {...q, status, hits: sc.hits, top5: sc.top5, cats: parsed.categories, top5Titles: parsed.resources.slice(0,5).map(r=>({title:r.title, sub:r.subcategory, city:r.city}))});
}
fs.writeFileSync('.local/validation-report.json', JSON.stringify([...reportMap.values()], null, 2));
console.log(`\nWrote ${reportMap.size} results to .local/validation-report.json`);
