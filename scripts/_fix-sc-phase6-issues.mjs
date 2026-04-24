import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const COMMIT = process.argv.includes("--commit");

// === URL fixes ===
const urlFixes = [
  { title: "Beneficiary Financial Counseling Service (BFCS) — Prudential",
    new_url: "https://www.benefits.va.gov/insurance/bfcs.asp" },
  { title: "NCOA Insurance Trust — South Carolina Service",
    new_url: "https://www.ncoausa.org/" },
  { title: "SC Healthy Connections Kids (CHIP)",
    new_url: "https://www.scdhhs.gov/" },
  { title: "Phoenix Center Greenville Crisis Stabilization Unit",
    new_url: "https://phoenixcenter.org/" },
  { title: "SC Department of Revenue Veterans Property Tax Exemption",
    new_url: "https://dor.sc.gov/property/exempt-property" },
];

// === Title rename for nonexistent org ===
// fccsmidlands.org does not exist. GreenPath Financial Wellness is a real
// NFCC-member nonprofit that serves SC residents.
const titleFixes = [
  { old_title: "Family Credit Counseling Service of SC (Columbia)",
    new_title: "GreenPath Financial Wellness — South Carolina Service",
    new_url: "https://www.greenpath.com/",
    new_phone: "800-550-1961",
    new_address: "GreenPath serves SC remotely",
    new_desc: "NFCC-member nonprofit credit counseling serving SC veterans. Free debt analysis, debt management plans, housing counseling, bankruptcy counseling. HUD-approved." },
];

// === Near-duplicate archive list ===
// After triage, these are unambiguous duplicates of another approved SC row
// (same parent org, same address, same scope). Archive (don't delete) so they
// remain queryable. Keep the more complete/canonical row.
const archiveDups = [
  { id: "f24637ef", title_substr: "Trident Technical College - Veterans Assistance",
    reason: "Dup of [aa613ae9] Trident Technical College – Veterans Center (same building, same scope)" },
  { id: "a8abaddd", title_substr: "Greenville Technical College - Veterans Financial Services",
    reason: "Dup of [e585d1ad] Greenville Technical College – Veterans Services (same address/building/scope)" },
  // Spartanburg CC — keep the most complete; archive the two thinner versions
  { title_substr: "Spartanburg Community College - Veterans Services",
    reason: "Dup of Spartanburg Community College – Veterans Center" },
  { title_substr: "Spartanburg Community College — Veteran Services",
    reason: "Dup of Spartanburg Community College – Veterans Center" },
  // SC Works Midlands — same office
  { title_substr: "SC Works Midlands - Columbia Center",
    reason: "Dup of SC Works Midlands – Columbia (same office)" },
  // One80 Place + Lowcountry Food Bank + Harvest Hope — keep the canonical, archive raw "name-only" duplicate
  { title_substr: "Lowcountry Food Bank - Headquarters",
    reason: "Dup of [5d1a0ac3] Lowcountry Food Bank (same address, same scope)" },
  { title_substr: "Harvest Hope Food Bank - Columbia",
    reason: "Dup of Harvest Hope Food Bank (same HQ address)" },
];

let n_url = 0, n_title = 0, n_arc = 0;

console.log("=== URL FIXES ===");
for (const f of urlFixes) {
  const { data, error } = await sb.from("resources").select("id, website_url").eq("state","SC").eq("title", f.title).maybeSingle();
  if (error || !data) { console.log(`  MISS  ${f.title}`); continue; }
  console.log(`  ${data.website_url}\n  ->  ${f.new_url}     [${data.id.substring(0,8)}] ${f.title}`);
  if (COMMIT) {
    const { error: ue } = await sb.from("resources").update({ website_url: f.new_url }).eq("id", data.id);
    if (!ue) n_url++;
  }
}

console.log("\n=== TITLE FIXES ===");
for (const f of titleFixes) {
  const { data, error } = await sb.from("resources").select("id").eq("state","SC").eq("title", f.old_title).maybeSingle();
  if (error || !data) { console.log(`  MISS  ${f.old_title}`); continue; }
  console.log(`  [${data.id.substring(0,8)}]  ${f.old_title}\n  ->  ${f.new_title}`);
  if (COMMIT) {
    const upd = { title: f.new_title, website_url: f.new_url, phone: f.new_phone, address: f.new_address, short_description: f.new_desc };
    const { error: ue } = await sb.from("resources").update(upd).eq("id", data.id);
    if (!ue) n_title++;
  }
}

console.log("\n=== NEAR-DUP ARCHIVES ===");
for (const f of archiveDups) {
  let q = sb.from("resources").select("id, title").eq("state","SC").eq("status","approved");
  if (f.id) q = q.like("id", f.id+"%");
  else q = q.eq("title", f.title_substr);
  const { data, error } = await q.maybeSingle();
  if (error || !data) {
    // Fallback: try ilike
    const { data: alt } = await sb.from("resources").select("id, title").eq("state","SC").eq("status","approved").ilike("title", `%${f.title_substr}%`);
    if (alt && alt.length === 1) {
      console.log(`  [${alt[0].id.substring(0,8)}]  ${alt[0].title}\n      reason: ${f.reason}`);
      if (COMMIT) {
        const { error: ue } = await sb.from("resources").update({ status: "archived" }).eq("id", alt[0].id);
        if (!ue) n_arc++;
      }
      continue;
    }
    console.log(`  MISS  ${f.title_substr}`);
    continue;
  }
  console.log(`  [${data.id.substring(0,8)}]  ${data.title}\n      reason: ${f.reason}`);
  if (COMMIT) {
    const { error: ue } = await sb.from("resources").update({ status: "archived" }).eq("id", data.id);
    if (!ue) n_arc++;
  }
}

console.log(`\n=== ${COMMIT?"COMMITTED":"DRY-RUN"} === url=${n_url} title=${n_title} archived=${n_arc}`);
