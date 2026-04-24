#!/usr/bin/env node
/**
 * Georgia Phase 6 — Latent Cleanup
 *
 * Founder ask (2026-04-24): "Review GA under same final standards used for SC
 * and NC. Fix any latent duplicates, coords, URL issues, ranking issues."
 *
 * Audit found 11 informational near-duplicates and 1 wrong-state bleed.
 * Analysis showed:
 *   - 9 of 11 clusters are LEGITIMATE distinct facilities being false-flagged
 *     by normalizeTitle()'s em-dash hyphen-strip (same root cause that hit NC
 *     Phase 5). Fix: rename leading with the distinguisher BEFORE any hyphen
 *     so each row's normalized key is genuinely unique. Same proven pattern.
 *   - 2 are TRUE duplicates and get dropped:
 *       - "Lawrenceville Cooperative Ministry" (bare row) duplicates
 *         "— Food Pantry" version at the same 52 Gwinnett Drive address.
 *       - "Kennesaw State University Military and Veteran Service" at 1000
 *         Chastain Road MD-0102 duplicates "— Military and Veterans Services"
 *         at 395 Cobb Avenue NW. Dropping it ALSO eliminates the lone
 *         wrong-state bleed false-positive (the "MD 0102" mail-drop suffix
 *         is misread as ", MD" Maryland).
 *
 * Idempotent: rename targets check current title; drop targets check existence
 * before delete. Safe to re-run.
 *
 * Run:
 *   tsx scripts/_ga-phase6-cleanup.mjs              # dry-run
 *   tsx scripts/_ga-phase6-cleanup.mjs --commit     # apply
 */
import { createClient } from "@supabase/supabase-js";

const COMMIT = process.argv.includes("--commit");
const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const RENAMES = [
  // Charlie Norwood VA Medical Center — Augusta divisions
  ["Charlie Norwood VA Medical Center — Augusta (Downtown Division)",
   "Charlie Norwood Downtown VA Medical Center Augusta"],
  ["Charlie Norwood VA Medical Center — Augusta (Uptown Division)",
   "Charlie Norwood Uptown VA Medical Center Augusta"],

  // Atlanta Mission shelters
  ["Atlanta Mission — The Shepherd's Inn",
   "Shepherd's Inn Atlanta Mission Men's Shelter"],
  ["Atlanta Mission — My Sister's House",
   "My Sister's House Atlanta Mission Women's Shelter"],

  // Georgia Department of Labor — 13-way collision (statewide HQ + 12 cities)
  ["Georgia Department of Labor — Veterans Services",
   "Veterans Services Georgia Department of Labor"],
  ["Georgia Department of Labor — Tucker (Decatur Area) Career Center",
   "Tucker Decatur Career Center Georgia Department of Labor"],
  ["Georgia Department of Labor — Atlanta Metro Career Center",
   "Atlanta Metro Career Center Georgia Department of Labor"],
  ["Georgia Department of Labor — Marietta Career Center",
   "Marietta Career Center Georgia Department of Labor"],
  ["Georgia Department of Labor — Lawrenceville Career Center",
   "Lawrenceville Career Center Georgia Department of Labor"],
  ["Georgia Department of Labor — Augusta Career Center",
   "Augusta Career Center Georgia Department of Labor"],
  ["Georgia Department of Labor — Coastal Georgia Career Center",
   "Coastal Georgia Career Center Georgia Department of Labor"],
  ["Georgia Department of Labor — Macon Career Center",
   "Macon Career Center Georgia Department of Labor"],
  ["Georgia Department of Labor — Columbus Career Center",
   "Columbus Career Center Georgia Department of Labor"],
  ["Georgia Department of Labor — Valdosta Career Center",
   "Valdosta Career Center Georgia Department of Labor"],
  ["Georgia Department of Labor — Albany Career Center",
   "Albany Career Center Georgia Department of Labor"],
  ["Georgia Department of Labor — Athens Career Center",
   "Athens Career Center Georgia Department of Labor"],
  ["Georgia Department of Labor — Warner Robins Career Center",
   "Warner Robins Career Center Georgia Department of Labor"],

  // View Point Health Lawrenceville — 3 distinct programs
  ["View Point Health — Mobile Crisis Team",
   "Mobile Crisis Team View Point Health Lawrenceville"],
  ["View Point Health — Lawrenceville Recovery Services",
   "Lawrenceville Recovery Services View Point Health"],
  ["View Point Health Crisis Stabilization — Lawrenceville",
   "Lawrenceville Crisis Stabilization View Point Health"],

  // MUST Ministries — Cobb facilities
  ["MUST Ministries — Marietta Elizabeth Inn",
   "Elizabeth Inn MUST Ministries Marietta Shelter"],
  ["MUST Ministries — Cobb Food Pantry",
   "Cobb Food Pantry MUST Ministries Marietta"],

  // Mercy Care Atlanta clinics
  ["Mercy Care — Decatur Street",
   "Decatur Street Mercy Care Atlanta Clinic"],
  ["Mercy Care — Chamblee",
   "Chamblee Mercy Care Atlanta Clinic"],

  // Atlanta Volunteer Lawyers Foundation programs
  ["Atlanta Volunteer Lawyers Foundation — Veterans Initiative",
   "Veterans Initiative Atlanta Volunteer Lawyers Foundation"],
  ["Atlanta Volunteer Lawyers Foundation — Wills Clinic",
   "Wills Clinic Atlanta Volunteer Lawyers Foundation"],

  // Georgia Legal Services Program — 10 offices statewide
  ["Georgia Legal Services Program — Veterans Project",
   "Veterans Project Georgia Legal Services Program"],
  ["Georgia Legal Services Program — Atlanta Regional Office",
   "Atlanta Regional Office Georgia Legal Services Program"],
  ["Georgia Legal Services Program — Augusta Office",
   "Augusta Office Georgia Legal Services Program"],
  ["Georgia Legal Services Program — Columbus Office",
   "Columbus Office Georgia Legal Services Program"],
  ["Georgia Legal Services Program — Macon Office",
   "Macon Office Georgia Legal Services Program"],
  ["Georgia Legal Services Program — Savannah Office",
   "Savannah Office Georgia Legal Services Program"],
  ["Georgia Legal Services Program — Albany Office",
   "Albany Office Georgia Legal Services Program"],
  ["Georgia Legal Services Program — Gainesville Office",
   "Gainesville Office Georgia Legal Services Program"],
  ["Georgia Legal Services Program — Piedmont (Athens) Office",
   "Piedmont Athens Office Georgia Legal Services Program"],
  ["Georgia Legal Services Program — Valdosta Office",
   "Valdosta Office Georgia Legal Services Program"],

  // Georgia Department of Veterans Service — Atlanta HQ + Women's office
  ["Georgia Department of Veterans Service — Atlanta State Headquarters",
   "Atlanta State Headquarters Georgia Department of Veterans Service"],
  ["Georgia Department of Veterans Service — Women Veterans Office",
   "Women Veterans Office Georgia Department of Veterans Service"],
];

// Drop true duplicates by exact title match (state=GA, status=approved scope).
const DROPS = [
  // Bare org name duplicates the "— Food Pantry" row at same 52 Gwinnett Drive
  "Lawrenceville Cooperative Ministry",
  // Duplicate KSU program — also the wrong-state bleed false-positive culprit
  // ("MD 0102" mail drop misread as ", MD" Maryland). Keep the 395 Cobb Avenue
  // NW row.
  "Kennesaw State University Military and Veteran Services",
];

let renamed = 0, alreadyRenamed = 0, renameSkipped = 0;
let dropped = 0, dropSkipped = 0;

console.log(`==== GA PHASE 6 CLEANUP (${COMMIT ? "COMMIT" : "DRY-RUN"}) ====\n`);

console.log("--- Renames ---");
for (const [oldTitle, newTitle] of RENAMES) {
  const { data: hit } = await sb.from("resources")
    .select("id,title").eq("state","GA").eq("status","approved")
    .eq("title", oldTitle).maybeSingle();
  if (!hit) {
    const { data: alreadyNew } = await sb.from("resources")
      .select("id").eq("state","GA").eq("status","approved")
      .eq("title", newTitle).maybeSingle();
    if (alreadyNew) { alreadyRenamed++; }
    else { console.log(`  SKIP (not found): "${oldTitle}"`); renameSkipped++; }
    continue;
  }
  console.log(`  RENAME [${hit.id.substring(0,8)}]\n    "${oldTitle}"\n    → "${newTitle}"`);
  if (COMMIT) {
    const { error } = await sb.from("resources").update({ title: newTitle }).eq("id", hit.id);
    if (error) { console.error(`    ERROR: ${error.message}`); continue; }
  }
  renamed++;
}

console.log("\n--- Drops ---");
for (const title of DROPS) {
  const { data: hit } = await sb.from("resources")
    .select("id,title,address,city").eq("state","GA").eq("status","approved")
    .eq("title", title).maybeSingle();
  if (!hit) { console.log(`  SKIP (not found): "${title}"`); dropSkipped++; continue; }
  console.log(`  DROP [${hit.id.substring(0,8)}] "${hit.title}"`);
  console.log(`        addr: ${hit.address || "-"}  city: ${hit.city || "-"}`);
  if (COMMIT) {
    // Junction first to avoid orphan FK failure
    const { error: jErr } = await sb.from("resource_categories").delete().eq("resource_id", hit.id);
    if (jErr) console.error(`    junc-del error: ${jErr.message}`);
    const { error } = await sb.from("resources").delete().eq("id", hit.id);
    if (error) { console.error(`    ERROR: ${error.message}`); continue; }
  }
  dropped++;
}

console.log(`\n==== SUMMARY ====`);
console.log(`  Renames: ${renamed} applied, ${alreadyRenamed} already-renamed, ${renameSkipped} not-found`);
console.log(`  Drops:   ${dropped} applied, ${dropSkipped} not-found`);
if (!COMMIT) console.log(`\n  (dry-run — re-run with --commit to apply)`);
