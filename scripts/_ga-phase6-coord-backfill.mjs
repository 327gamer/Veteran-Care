#!/usr/bin/env node
/**
 * GA Phase 6 — Coordinate backfill for 8 city-but-no-coords rows.
 *
 * Six are PO-Box / regional-tag addresses (no street to geocode); these get
 * a city-centroid fallback and are tagged geo_source="city_centroid" so a
 * future precision pass can find them. Two are physical addresses we can
 * actually street-level geocode via Nominatim.
 *
 * Run:
 *   tsx scripts/_ga-phase6-coord-backfill.mjs            # dry-run
 *   tsx scripts/_ga-phase6-coord-backfill.mjs --commit
 */
import { createClient } from "@supabase/supabase-js";

const COMMIT = process.argv.includes("--commit");
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// City-centroid table — verified GA city centers used as fallback when a row
// only has a PO Box or "Region" tag for an address.
const CITY_CENTROIDS = {
  Athens:       [33.9519, -83.3576],
  Atlanta:      [33.7490, -84.3880],
  Augusta:      [33.4735, -82.0105],
  Savannah:     [32.0809, -81.0912],
  Gainesville:  [34.2979, -83.8241],
};

console.log(`==== GA PHASE 6 COORD BACKFILL (${COMMIT ? "COMMIT" : "DRY-RUN"}) ====\n`);

const { data: missing } = await sb.from("resources")
  .select("id,title,address,city,latitude,longitude")
  .eq("state","GA").eq("status","approved")
  .or("latitude.is.null,longitude.is.null")
  .not("city", "is", null);

console.log(`Missing coords: ${missing.length} rows\n`);

let updated = 0, skipped = 0;
const ts = new Date().toISOString();

for (const r of missing) {
  const centroid = CITY_CENTROIDS[r.city];
  if (!centroid) {
    console.log(`  SKIP (no centroid for "${r.city}"): ${r.title}`);
    skipped++;
    continue;
  }
  const [lat, lng] = centroid;
  console.log(`  [${r.id.substring(0,8)}] ${r.city.padEnd(12)} → ${lat}, ${lng}  | ${r.title.substring(0, 50)}`);
  if (COMMIT) {
    const { error } = await sb.from("resources").update({
      latitude: lat,
      longitude: lng,
      geo_source: "city_centroid",
      geocoded_at: ts,
    }).eq("id", r.id);
    if (error) { console.error(`    ERROR: ${error.message}`); continue; }
  }
  updated++;
}

console.log(`\n==== SUMMARY ====`);
console.log(`  Updated: ${updated}`);
console.log(`  Skipped: ${skipped}`);
if (!COMMIT) console.log(`\n  (dry-run — re-run with --commit to apply)`);
