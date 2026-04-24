#!/usr/bin/env node
/**
 * Backfill Nominatim coordinates for NC approved rows that have a city but
 * are missing latitude / longitude. Pure quality-completion pass — does not
 * touch any other field. Honors Nominatim's 1 req/sec policy.
 *
 * Usage:
 *   node scripts/_nc-phase5-backfill-coords.mjs            # process all
 *   node scripts/_nc-phase5-backfill-coords.mjs --limit 60 # process first 60 missing
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const LIMIT_FLAG = process.argv.indexOf("--limit");
const LIMIT = LIMIT_FLAG > -1 ? parseInt(process.argv[LIMIT_FLAG + 1], 10) : Infinity;

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
let lastCallAt = 0;
async function rateLimit() {
  const wait = 1100 - (Date.now() - lastCallAt);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCallAt = Date.now();
}

async function nominatim(params) {
  await rateLimit();
  const sp = new URLSearchParams({ format: "json", countrycodes: "us", limit: "1", ...params });
  const r = await fetch(`${NOMINATIM}?${sp}`, {
    headers: { "User-Agent": "VeteranCare/1.0 (nc-phase5-backfill)" },
  });
  if (!r.ok) return [];
  return await r.json();
}

function stripSuite(addr) {
  return addr.replace(/[,\s]+(suite|ste|unit|apt|room|rm|bldg|building|floor|fl|#)\s*[a-z0-9\-]+\s*$/i, "").trim();
}

async function geocodeRow(r) {
  const street = r.address ? stripSuite(r.address) : null;
  const attempts = [];
  if (street && r.city) {
    const p = { street, city: r.city, state: "NC" };
    if (r.zip) p.postalcode = r.zip;
    attempts.push(p);
    if (r.zip) attempts.push({ street, city: r.city, state: "NC" });
  }
  if (r.city) {
    const p = { city: r.city, state: "NC" };
    if (r.zip) p.postalcode = r.zip;
    attempts.push(p);
  }
  for (const p of attempts) {
    const data = await nominatim(p);
    if (data.length > 0) {
      const lat = parseFloat(data[0].lat), lon = parseFloat(data[0].lon);
      if (!isNaN(lat) && !isNaN(lon)) return { latitude: lat, longitude: lon };
    }
  }
  return null;
}

const all = []; let from = 0; const PAGE = 1000;
while (true) {
  const { data, error } = await sb.from("resources")
    .select("id,title,address,city,state,zip,latitude,longitude")
    .eq("state","NC").eq("status","approved").range(from, from + PAGE - 1);
  if (error) { console.error(error); process.exit(1); }
  all.push(...data); if (data.length < PAGE) break; from += PAGE;
}

const missing = all.filter(r => r.city && (!r.latitude || !r.longitude));
const todo = missing.slice(0, LIMIT);
console.log(`NC missing-coords total=${missing.length}  processing=${todo.length}`);

let ok = 0, fail = 0;
for (let i = 0; i < todo.length; i++) {
  const r = todo[i];
  const res = await geocodeRow(r);
  if (!res) {
    fail++;
    console.log(`  [FAIL] [${i+1}/${todo.length}] ${r.city}  ${r.title.substring(0, 60)}`);
    continue;
  }
  // Validate inside NC bbox so we don't accept a wildly wrong hit.
  if (res.latitude < 33.7 || res.latitude > 36.7 || res.longitude > -75.3 || res.longitude < -84.5) {
    fail++;
    console.log(`  [BBOX] [${i+1}/${todo.length}] ${r.city}  lat=${res.latitude} lng=${res.longitude}  ${r.title.substring(0, 50)}`);
    continue;
  }
  const { error } = await sb.from("resources").update({
    latitude: res.latitude,
    longitude: res.longitude,
    geo_source: "nominatim",
    geocoded_at: new Date().toISOString(),
  }).eq("id", r.id);
  if (error) { fail++; console.log(`  [DBERR] ${error.message}`); continue; }
  ok++;
  if ((i + 1) % 20 === 0 || i + 1 === todo.length) {
    console.log(`  progress: ${i + 1}/${todo.length}  ok=${ok}  fail=${fail}`);
  }
}
console.log(`\nDone. ok=${ok}  fail=${fail}`);
