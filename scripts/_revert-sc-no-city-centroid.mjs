// Revert the Columbia-centroid fix from _fix-sc-no-city.mjs.
// Statewide programs SHOULD have city=NULL — that is the semantic flag the
// client uses (resources.tsx checks `state && !city`) to render them as
// "statewide" rather than distance-ranked local providers.
//
// Identifies the 57 rows by their titles (the same set listed by the original
// dry-run) and resets city, latitude, longitude back to NULL.

import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const COMMIT = process.argv.includes("--commit");

// 57 legitimate statewide titles (from the original no-city list, minus the
// 6 "Veteran Care —" placeholder rows which were left untouched).
const STATEWIDE_TITLES = [
  "SC State Housing Finance & Development Authority",
  "SC Department of Employment and Workforce – LVER/DVOP",
  "SC Coalition for the Homeless",
  "SSVF – Supportive Services for Veteran Families (SC)",
  "SC Works – Veterans Employment Services",
  "Hire Heroes USA – South Carolina",
  "Goodwill Industries Veteran Services – SC",
  "SC Department of Mental Health – Veterans Services",
  "NAMI South Carolina",
  "SC Commission on Higher Education – Veterans Education",
  "SC Technical College System – Veterans Services",
  "SC Bar Pro Bono Program – Veterans",
  "SC Appleseed Legal Justice Center",
  "SC Dept. of Consumer Affairs – Military/Veterans",
  "SC Legal Aid – Veterans Legal Assistance",
  "VA Video Connect - SC Telehealth",
  "SC Works Veterans Portal",
  "SC State Government Veteran Hiring",
  "SC Legal Services - Statewide Intake Line",
  "DAV National Service Officers - SC Claims Assistance",
  "SC Legal Services - Family Law for Veterans",
  "Presidential Memorial Certificate Program",
  "VA Headstones, Markers & Medallions",
  "VA Financial Counseling for Survivors",
  "SC 211 - Financial Assistance Referrals",
  "SC Veterans Tuition Waiver Program",
  "Compassionate Friends – SC Chapters",
  "VA Homemaker & Home Health Aide Program",
  "VA Advance Directive & POLST Information",
  "Military Childcare (MCCYN-PLUS) - South Carolina",
  "ModivCare NEMT - Lowcountry/Coast (Region 3)",
  "ModivCare NEMT - Midlands (Region 2)",
  "ModivCare NEMT - Upstate (Region 1)",
  "Five Wishes Advance Care Plan",
  "VA Whole Health – End-of-Life Care Planning",
  "SC Legal Services – Survivor & Probate Help",
  "National Foundation for Credit Counseling – Survivor Debt Help",
  "AARP Financial Planning for End of Life",
  "Narcotics Anonymous - Carolina Region Helpline",
  "SC Mobile Crisis Line",
  "SC DSS SNAP Benefits (Food Stamps)",
  "VA Survivor & Burial Benefits Hub",
  "SGLI & VGLI Life Insurance Claims",
  "CHAMPVA for Survivors",
  "Team Red White & Blue - South Carolina",
  "VA Burial Benefits & Allowances",
  "VA Life Insurance Programs (SGLI, VGLI, S-DVI)",
  "Team Rubicon — South Carolina Operations",
  "Guitars for Vets — South Carolina (Charleston & Columbia)",
  "Amedisys Hospice Care",
  "Veterans Crisis Line — 24/7 Suicide Prevention",
  "The Matt and Monica Podcast",
  "SC 211 – Veteran Resources Line",
  "Veterans Yoga Project — South Carolina Network",
  "SC Department of Mental Health — Mobile Crisis Response",
  "SC Veterans Trust Fund",
  "SC Free Tuition for Certain Veterans",
];

console.log(`Targets: ${STATEWIDE_TITLES.length} statewide titles\n`);

const { data: rows, error } = await sb
  .from("resources")
  .select("id, title, city, latitude, longitude")
  .eq("state", "SC")
  .eq("status", "approved")
  .in("title", STATEWIDE_TITLES);

if (error) { console.error("ERR:", error); process.exit(1); }

console.log(`Matched in DB: ${rows.length}`);
const stillCentroid = rows.filter(r =>
  r.city === "Columbia" && Number(r.latitude) === 34.0007 && Number(r.longitude) === -81.0394
);
console.log(`Currently at Columbia centroid (will revert): ${stillCentroid.length}`);

if (rows.length !== STATEWIDE_TITLES.length) {
  const found = new Set(rows.map(r => r.title));
  const missing = STATEWIDE_TITLES.filter(t => !found.has(t));
  console.log(`\nWARNING: ${missing.length} titles not matched in DB:`);
  missing.forEach(t => console.log(`  - ${t}`));
}

if (!COMMIT) {
  console.log(`\n(dry-run only — pass --commit to revert ${stillCentroid.length} rows to NULL city/lat/lng)`);
  process.exit(0);
}

let updated = 0, errs = 0;
for (const r of stillCentroid) {
  const { error: ue } = await sb
    .from("resources")
    .update({ city: null, latitude: null, longitude: null, geo_source: null, geocoded_at: null })
    .eq("id", r.id);
  if (ue) { console.error(`ERR ${r.id}: ${ue.message}`); errs++; }
  else updated++;
}

console.log(`\nReverted: ${updated}  errors: ${errs}`);
