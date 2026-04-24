#!/usr/bin/env node
/**
 * One-shot patcher: drops / renames Phase 5 rows that collided with
 * normalizeTitle() in the dry-run. Operates on the literal title lines
 * which are unique within the file.
 */
import { readFileSync, writeFileSync } from "node:fs";

const PATH = "scripts/seed-ga-phase5-saturation.ts";
let src = readFileSync(PATH, "utf8");

// True duplicates of existing DB rows — drop entirely
const DROP = [
  "North Fulton Community Charities (Roswell)",
  "HomeStretch — Roswell Transitional Housing",
  "The Drake House — Roswell Family Shelter",
  "Mercy Care — Atlanta FQHC",
  "Atlanta Mission — The Shepherd's Inn (Men's Shelter)",
  "Hosea Helps — Atlanta Wraparound Services",
  "Open Hand Atlanta — Medically Tailored Meals",
  "The Extension — Marietta Recovery Program",
  "Highland Rivers Behavioral Health — Cobb",
  "Wellstar Cobb Hospital (Austell)",
  "Chattahoochee Technical College — Veteran Services",
  "View Point Health — Gwinnett / Newton / Rockdale CSB",
  "Gwinnett Technical College — Veteran Services",
  "DeKalb Community Service Board",
  "Hope Atlanta — Travelers Aid Veterans Program",
  "Memorial Health University Medical Center — Savannah",
  "Gateway Behavioral Health Services — Chatham",
  "Savannah Technical College — Veteran Services",
  "Augusta Technical College — Veteran Services",
  "Augusta University — Veteran Services Office",
  "Augusta Warrior Project — CSRA Veteran Hub",
  "Serenity Behavioral Health Systems — CSRA",
  "Atrium Health Navicent — Macon",
  "Mercer University — Veteran Affairs Office",
  "Columbus Technical College — Veteran Services",
  "Columbus State University — Military and Veterans Services",
  "Athens Technical College — Veteran Services",
  "Mercy Health Center — Athens FQHC-equivalent",
  "Avita Community Partners — North Georgia CSB",
  "Albany Area Community Service Board",
  "Behavioral Health Services of South Georgia — Valdosta",
  "Skyland Trail — Adolescent Mental Health (Atlanta)",
  "NAMI Georgia — Statewide Family Support",
  "Behavioral Health Link — Atlanta Crisis Stabilization",
  "Operation Homefront — Georgia Region",
  "Blue Star Families — Georgia Chapter",
  "Hope For The Warriors — Family Support",
  "Atlanta Legal Aid Society — Main Office",
  "Atlanta Volunteer Lawyers Foundation — Saturday Lawyer",
  "Georgia Justice Project — Reentry Legal Services",
  "Atlanta Community Food Bank — Mobile Pantry Network",
  "Lawrenceville Cooperative Ministry — Food Distribution",
  "America's Second Harvest of Coastal Georgia — Hinesville Mobile",
  "Recovery Place — Savannah Outpatient",
  "Georgia State University — Office of Military Outreach",
  "Georgia Southern University — Office of Military and Veteran Services",
  "Valdosta State University — Office of Military and Veteran Services",
  "Albany State University — Veteran Resource Center",
];

// Rename: title → new title (no em-dash so unique part is FIRST)
const RENAME = {
  "Atlanta Mission — My Sister's House (Women's Shelter)":
    "My Sister's House Atlanta Mission Women's Shelter",
  "Cobb-Douglas Community Service Board":
    "Cobb-Douglas CSB Outpatient Marietta Clinic",
  "Atlanta Mission — Restoration House (Family Housing)":
    "Restoration House Atlanta Mission Family Program",
  "Macon-Bibb County Veterans Treatment Court":
    "Bibb County Veterans Treatment Court",
  "Georgia Legal Services Program — Augusta Regional Office":
    "GLSP Augusta CSRA Regional Office",
  "Georgia Legal Services Program — Savannah Regional Office":
    "GLSP Savannah Coastal Regional Office",
  "Georgia Legal Services Program — Macon Regional Office":
    "GLSP Macon Central Regional Office",
  "MUST Ministries — Smyrna Food Pantry":
    "MUST Ministries Smyrna South Cobb Pantry",
  "Action Ministries — Macon Service Center":
    "Action Ministries Macon Central Service Center",
  "Goodwill of North Georgia — Roswell Career Center":
    "Goodwill Roswell North Fulton Career Center",
  "Goodwill of North Georgia — Marietta Career Center":
    "Goodwill Kennesaw Cobb Career Center",
  "Goodwill of North Georgia — Decatur Career Center":
    "Goodwill Decatur East Atlanta Career Center",
};

let dropCount = 0;
for (const t of DROP) {
  // Match: optional leading whitespace, "{ section:" through that title's row's closing " },"
  // Row block always ends with `source_type: "...." },\n`
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `\\s*\\{\\s*section:\\s*"[A-Z]+",\\s*title:\\s*"${escaped}"[\\s\\S]*?source_type:\\s*"[^"]+"\\s*\\},`,
    "g",
  );
  const before = src.length;
  src = src.replace(re, "");
  if (src.length === before) {
    console.error("WARN: drop pattern did not match:", t);
  } else {
    dropCount++;
  }
}

let renameCount = 0;
for (const [oldT, newT] of Object.entries(RENAME)) {
  const escaped = oldT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`title:\\s*"${escaped}"`, "g");
  const before = src.length;
  src = src.replace(re, `title: "${newT}"`);
  if (src.length === before) {
    console.error("WARN: rename pattern did not match:", oldT);
  } else {
    renameCount++;
  }
}

writeFileSync(PATH, src);
console.log(`Dropped: ${dropCount}/${DROP.length}`);
console.log(`Renamed: ${renameCount}/${Object.keys(RENAME).length}`);
