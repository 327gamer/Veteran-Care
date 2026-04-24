/**
 * For the 20 rows still missing coords (Nominatim 429-blocked us), assign the
 * city-centroid coordinates derived from existing geocoded rows in the same
 * city. Marks them with geo_source="city_centroid" so a precision pass can
 * find and refine them later. Honest, conservative, unblocks the QA gate.
 */
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const all=[]; let from=0;
while(true){
  const {data,error}=await sb.from("resources")
    .select("id,title,city,latitude,longitude,address")
    .eq("state","NC").eq("status","approved").range(from,from+999);
  if(error){console.error(error);process.exit(1);}
  all.push(...data); if(data.length<1000)break; from+=1000;
}

const byCity = new Map();
for (const r of all) {
  if (!r.city || !r.latitude || !r.longitude) continue;
  if (!byCity.has(r.city)) byCity.set(r.city, []);
  byCity.get(r.city).push([r.latitude, r.longitude]);
}
function centroid(coords){
  const n=coords.length;
  return { lat: coords.reduce((s,c)=>s+c[0],0)/n, lon: coords.reduce((s,c)=>s+c[1],0)/n };
}

const todo = all.filter(r=>r.city && (!r.latitude||!r.longitude));
console.log(`Centroid backfill — ${todo.length} rows`);
let ok=0, miss=0;
for (const r of todo) {
  const peers = byCity.get(r.city);
  if (!peers || peers.length<2){
    miss++;
    console.log(`  [NO-PEER] ${r.city} (${peers?peers.length:0} peers) | ${r.title.substring(0,55)}`);
    continue;
  }
  const c = centroid(peers);
  if (c.lat<33.7||c.lat>36.7||c.lon>-75.3||c.lon<-84.5){
    miss++; console.log(`  [BBOX] ${r.city} centroid out of NC`); continue;
  }
  const {error}=await sb.from("resources").update({
    latitude: c.lat, longitude: c.lon,
    geo_source: "city_centroid", geocoded_at: new Date().toISOString()
  }).eq("id", r.id);
  if (error){ miss++; console.log(`  [DBERR] ${error.message}`); continue; }
  ok++;
}
console.log(`Done. ok=${ok} miss=${miss}`);
