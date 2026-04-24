#!/usr/bin/env node
/**
 * Cleanup pass #2 for the NC Phase 5 seed file (idempotent).
 *
 * Founder directive (2026-04-24): "Quality over row count. Recover legitimate
 * multi-location organizations through clean renaming, but do not force
 * low-value filler rows."
 *
 * The dry-run prints near-dup pairs as `<seed-row>  ~~  <already-indexed>`.
 * `<seed-row>` is what's literally in this file (the LEFT side). For each one
 * we either (a) RENAME the seed row so its normalized key is unique while
 * preserving every other field, or (b) DROP the entire row block when it is a
 * true duplicate / national-org-with-NC-suffix filler.
 *
 * normalizeTitle() in scripts/lib/rollout-engine.ts strips everything from the
 * first em-dash / en-dash / hyphen to end of string AND any trailing
 * "(...)". Renamed titles avoid those patterns or place the unique
 * distinguisher BEFORE any hyphen so the resulting key is genuinely distinct.
 */
import fs from "node:fs";

const FILE = "scripts/seed-nc-phase5-saturation.ts";

// LEFT-side seed-row title -> new title.
const RENAMES = new Map([
  // Org HQs / parent rows whose existing DB twin is a sub-program — keep both
  // by giving the parent a "Headquarters / Main Office / Main Campus" tag.
  ["Veterans Bridge Home",
   "Veterans Bridge Home Statewide Headquarters"],
  ["Goodwill Industries of the Southern Piedmont",
   "Goodwill Industries of the Southern Piedmont Workforce Center"],
  ["Catholic Charities Diocese of Charlotte",
   "Catholic Charities Diocese of Charlotte Headquarters"],
  ["Charlotte Center for Legal Advocacy",
   "Charlotte Center for Legal Advocacy Main Office"],
  ["Raleigh Rescue Mission",
   "Raleigh Rescue Mission Main Campus"],
  ["Habitat for Humanity Wake County",
   "Habitat for Humanity Wake County Affiliate Office"],
  ["Servant Center — Greensboro",
   "Servant Center Greensboro Veteran Programs"],
  ["Greensboro Urban Ministry",
   "Greensboro Urban Ministry Main Campus"],
  ["Cary Senior Center",
   "Cary Senior Center Main Facility"],
  ["NC Pro Bono Resource Center",
   "NC Pro Bono Resource Center Main Program"],
  // Distinct facilities that the prior cleanup already renamed correctly —
  // listed here for idempotence (no-ops on second run).
  ["Guilford County Veterans Services — Greensboro",
   "Greensboro Guilford County Veterans Office"],
  ["Guilford County Veterans Services — High Point",
   "High Point Guilford County Veterans Office"],
  ["Winston-Salem Vet Center", "Vet Center Winston-Salem"],
  ["Winston-Salem Rescue Mission", "Rescue Mission of Winston-Salem"],
  // Additional distinct facilities still pending rename.
  ["Vaya Health — Asheville HQ",
   "Asheville Vaya Health Headquarters Office"],
  ["USO of NC — Fort Liberty Center",
   "Fort Liberty USO Center North Carolina"],
  ["NC Justice Center — Statewide Public Benefits Help",
   "Statewide Public Benefits Help NC Justice Center"],
]);

// LEFT-side seed-row titles to delete entirely — true duplicates or
// national/NC-suffix filler that adds no real coverage.
const DROPS = new Set([
  // CHA — true duplicates of existing rows (DB already has more specific name)
  "McLeod Addictive Disease Center — Charlotte",
  "Loaves & Fishes / Friendship Trays",
  "Second Harvest Food Bank of Metrolina",
  "Union County Veterans Services",
  // RAL — true duplicates
  "Healing Transitions — Raleigh",
  "Inter-Faith Food Shuttle — Raleigh",
  // DUR — TROSA full-name redundant with existing TROSA row
  "TROSA — Triangle Residential Options for Substance Abusers",
  // GRE — bare row that caused the Greensboro/High Point collisions
  "Guilford County Veterans Services",
  // WSL — same Winston-Salem clinic; existing "VA Clinic" already covers it
  "Winston-Salem VA Outpatient Clinic",
  // WIL — Coastal Horizons HQ is in Wilmington; existing already specifies it
  "Coastal Horizons Center",
  // ASH — duplicates of existing rows
  "Charles George VA Medical Center",
  "Western Carolina Rescue Ministries",
  "MANNA FoodBank — Asheville",
  "Mission Hospital — Asheville (HCA)",
  // FAY — duplicate of existing ACS row
  "Fort Liberty Army Community Service",
  // JAX — duplicate
  "Jacksonville Vet Center",
  // HKY — same org, full vs short name
  "Hickory Soup Kitchen",
  // GRN — duplicates
  "Greenville VA Health Care Center",
  "ECU Health Medical Center",
  "Greenville Vet Center",
  // MTN — duplicate
  "Cherokee County Veterans Services",
  // CRI — duplicates / national crisis line already covers NC
  "Trillium Health Resources Mobile Crisis (ENC)",
  "Alliance Health Mobile Crisis (Triangle)",
  "Partners Health Management Mobile Crisis (Piedmont)",
  "Veterans Crisis Line — Statewide NC",
  // MHE — national orgs with NC tag, no NC physical office
  "Give an Hour — North Carolina",
  "Cohen Veterans Network — NC Telehealth",
  // DIS — existing BVA NC chapter row already covers
  "Blinded Veterans Association — NC Regional Group",
  // EMP — national orgs with NC tag, no NC physical workshops
  "Hire Heroes USA — NC Workshops",
  "Helmets to Hardhats — NC Building Trades",
  "American Corporate Partners — NC Mentoring",
  // EOL — same cemetery
  "Coastal Carolina State Veterans Cemetery — Jacksonville",
  // FAM — national orgs / same org
  "Operation Homefront — NC Region",
  "Hope For The Warriors — Springfield NC HQ",
  "Family Endeavors — NC Veterans & Families",
  // FIN — same orgs
  "GreenPath Financial Wellness — NC",
  "Self-Help Credit Union — Durham HQ",
  // FOOD — same food bank
  "Food Bank of the Albemarle",
  // INS — same programs / no NC physical office
  "NC SHIIP — Senior Health Insurance Information Program",
  "AAFMAA — Army & Air Force Mutual Aid Association",
  "NC State Health Plan — Retiree Coverage",
  // LGL — national orgs / duplicates
  "Stateside Legal — NC",
  "Swords to Plowshares — NC Discharge Upgrade",
  "National Veterans Legal Services Program (NVLSP) — NC",
  // CSP — national org with NC tag
  "Iraq and Afghanistan Veterans of America (IAVA) — NC",
]);

// One row from a previous (incorrect) cleanup pass needs to be UNDONE: the
// "Winston-Salem VA Outpatient Clinic" was wrongly renamed to
// "VA Outpatient Clinic Winston-Salem" — but it's the same facility as the
// existing "Winston-Salem VA Clinic" in the DB and should simply be dropped.
DROPS.add("VA Outpatient Clinic Winston-Salem");

const src = fs.readFileSync(FILE, "utf8");

const ROW_RE = /  \{ section: "[A-Z]+", title: "([^"]+)",[\s\S]*?\n {4}source_name: "[^"]*", source_type: "[^"]*" \},\n/g;

let renamed = 0;
let dropped = 0;
let kept = 0;
const seenTitles = new Set();

const out = src.replace(ROW_RE, (block, title) => {
  if (DROPS.has(title)) {
    dropped++;
    return "";
  }
  if (RENAMES.has(title)) {
    const newTitle = RENAMES.get(title);
    if (seenTitles.has(newTitle)) {
      throw new Error(`Rename collision: "${newTitle}" already used`);
    }
    seenTitles.add(newTitle);
    renamed++;
    return block.replace(`title: "${title}",`, `title: "${newTitle}",`);
  }
  if (seenTitles.has(title)) {
    throw new Error(`Duplicate title kept as-is: "${title}"`);
  }
  seenTitles.add(title);
  kept++;
  return block;
});

if (renamed === 0 && dropped === 0) {
  console.log("No changes applied — file already matches target state.");
  process.exit(0);
}

fs.writeFileSync(FILE, out, "utf8");
console.log(`Cleanup pass complete: kept=${kept}  renamed=${renamed}  dropped=${dropped}`);
