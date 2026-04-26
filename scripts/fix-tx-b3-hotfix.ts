/**
 * TX B3 hotfix — applies the fix list discovered post-ship after architect
 * FAIL. Updates URL + source_name on 28 of 31 shipped rows; deletes 3 rows
 * (Lubbock, McLennan, Williamson) for which no canonical CVSO URL could be
 * verified server-side (sites bot-blocked behind Cloudflare/JS-render walls).
 *
 * source_name discipline tightened: per locked B2 convention, source_name is
 * "<County> County Texas — <document <title> tag>" so the suffix exactly
 * matches the document the verifier fetched, not a constructed label.
 *
 * Run:
 *   tsx scripts/fix-tx-b3-hotfix.ts          # dry-run
 *   tsx scripts/fix-tx-b3-hotfix.ts --commit # write
 */

import { supabaseAdmin } from "../server/supabase";

const COMMIT = process.argv.includes("--commit");

type Patch = { county: string; url: string; pageTitle: string };

// 28 verified rows — URL is the page that actually serves veteran content
// (re-fetched 2026-04-26 with browser-Chrome UA + content-keyword guard);
// pageTitle is the actual <title> tag of that page.
const PATCHES: Patch[] = [
  // 15 rows where URL was already correct from B3 ship (re-verified clean):
  { county: "Bowie",      url: "https://www.co.bowie.tx.us/page/bowie.Veterans",                                                                              pageTitle: "Bowie County, Texas" },
  { county: "Cameron",    url: "https://www.cameroncountytx.gov/veterans-department/",                                                                        pageTitle: "Cameron County Veterans Service Office - Cameron County" },
  { county: "Dallas",     url: "https://www.dallascounty.org/departments/veteran-services/",                                                                  pageTitle: "Veteran Services" },
  { county: "Denton",     url: "https://www.dentoncounty.gov/859/Veterans-Service",                                                                           pageTitle: "Veterans Service | Denton County, TX" },
  { county: "Ector",      url: "https://www.co.ector.tx.us/page/ector.Veterans",                                                                              pageTitle: "Welcome to Ector County, Veterans Services" },
  { county: "Fort Bend",  url: "https://www.fortbendcountytx.gov/government/departments/commissioners-court/county-judge/veteran-service-office",             pageTitle: "Veteran Service Office | Fort Bend County" },
  { county: "Grayson",    url: "https://www.co.grayson.tx.us/page/va.home",                                                                                   pageTitle: "Veteran's Affairs Office | Grayson County Tx." },
  { county: "Gregg",      url: "https://greggcounty.texas.gov/services/veterans-services",                                                                    pageTitle: "Veterans Services / Gregg County" },
  { county: "Hardin",     url: "https://www.co.hardin.tx.us/page/hardin.Veterans",                                                                            pageTitle: "Hardin County, Texas" },
  { county: "Hays",       url: "https://www.hayscountytx.gov/veterans-services",                                                                              pageTitle: "Veterans Services | Hays County Texas | San Marcos, TX" },
  { county: "Hunt",       url: "https://www.huntcounty.net/page/hunt.veteransservices",                                                                       pageTitle: "Veterans Services - Hunt County" },
  { county: "Kaufman",    url: "https://www.kaufmancounty.net/290/Veterans-Services",                                                                         pageTitle: "Veterans Services | Kaufman County, TX" },
  { county: "Montgomery", url: "https://www.mctx.org/departments/departments_q_-_z/veterans_services/index.php",                                              pageTitle: "Welcome to Montgomery County, Texas" },
  { county: "Tarrant",    url: "https://www.tarrantcountytx.gov/en/veteran-services.html",                                                                    pageTitle: "Veteran Services" },
  { county: "Webb",       url: "https://www.webbcountytx.gov/WCRVTP/",                                                                                        pageTitle: "WCRVTP" },

  // 4 rows where URL was correct but verify-heuristic returned spurious BAD
  // because the page <title> is the global county-site title (not the page H1).
  // Re-confirmed via the harvested anchor "Veteran Services" pointing at this URL:
  { county: "Bell",       url: "https://www.bellcountytx.com/departments/veteran_services/index.php",                                                         pageTitle: "Bell County, TX" },
  { county: "Henderson",  url: "https://www.henderson-county.com/departments/veterans-services",                                                              pageTitle: "Veterans Services | Henderson County" },
  { county: "Johnson",    url: "https://www.johnsoncountytx.org/departments/veteran-s-services",                                                              pageTitle: "Veterans Services | Johnson County, TX" },
  { county: "Liberty",    url: "https://www.co.liberty.tx.us/page/liberty.Veterans",                                                                          pageTitle: "Liberty County, Texas" },

  // 9 rows REPLACED with newly-discovered correct URL (CivicPlus slug-ignore
  // defect on prior URL caused them to serve unrelated department pages):
  { county: "Bexar",      url: "https://www.bexar.org/509/Department-of-Military-and-Veterans-Serv",                                                          pageTitle: "Department of Military and Veterans Services | Bexar County, TX - Official Website" },
  { county: "Brazos",     url: "https://www.brazoscountytx.gov/178/Veteran-Service-Office",                                                                   pageTitle: "Veteran Service Office | Brazos County, TX - Official Website" },
  { county: "Collin",     url: "https://www.collincountytx.gov/services/veteran-services",                                                                    pageTitle: "Veteran Services" },
  { county: "Comal",      url: "https://www.comalcounty.gov/178/Veterans-Services",                                                                           pageTitle: "Veterans Services | Comal County, TX" },
  { county: "Ellis",      url: "https://www.elliscountytx.gov/103/Ellis-County-Veteran-Services",                                                             pageTitle: "Ellis County Veteran Services | Ellis County, TX Official Website" },
  { county: "Galveston",  url: "https://www.galvestoncountytx.gov/county-offices/veterans-services",                                                          pageTitle: "Veterans Services | Galveston County, TX" },
  { county: "Hidalgo",    url: "https://www.hidalgocounty.us/73/Veterans-Services",                                                                           pageTitle: "Veterans Service Office | Hidalgo County, TX - Official Website" },
  { county: "Parker",     url: "https://www.parkercountytx.gov/157/Veteran-Services",                                                                         pageTitle: "Veteran Services | Parker County, TX - Official Website" },
  { county: "Travis",     url: "https://www.traviscountytx.gov/veterans-services",                                                                            pageTitle: "Veterans Services | Travis County, Texas" },
];

// 3 rows DELETED — sites are bot-blocked (Cloudflare 403) or JS-rendered
// shells; canonical CVSO URL could not be verified from server-side fetch.
// Per founder no-fabrication discipline: drop rather than ship a guess.
// These counties move to B3-B skip queue with explicit rationale.
const DELETIONS = [
  { county: "Lubbock",    reason: "lubbockcounty.gov returns 200 but content is JS-rendered shell with no server-side CVSO anchors; index.egov?view=item&id=83 returns empty body to non-browser clients" },
  { county: "McLennan",   reason: "mclennan.gov returns 403 to all server fetches (Cloudflare bot challenge); co.mclennan.tx.us same; no Wayback snapshot of any /Veteran path" },
  { county: "Williamson", reason: "wilcotx.gov returns 403 to all server fetches (Cloudflare); wilco.org subdomains return 404 on every Veteran-* slug pattern; no Wayback snapshot of any /Veteran path" },
];

async function main() {
  console.log(`\n=== TX B3 hotfix (mode=${COMMIT ? "COMMIT" : "DRY-RUN"}) ===\n`);
  console.log(`Plan: UPDATE ${PATCHES.length} rows, DELETE ${DELETIONS.length} rows\n`);

  // Step 1: locate all 31 existing B3 rows by title
  // Webb is stored under non-standard title "Webb County Regional Veterans Treatment Program"
  const titleFor = (county: string) =>
    county === "Webb" ? "Webb County Regional Veterans Treatment Program" : `${county} County Veteran Services Office`;
  const titles = [
    ...PATCHES.map(p => titleFor(p.county)),
    ...DELETIONS.map(d => titleFor(d.county)),
  ];

  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from("resources")
    .select("id, title, website_url, source_name, state")
    .in("title", titles);
  if (fetchErr) { console.error("FETCH ERROR:", fetchErr); process.exit(1); }

  const txExisting = (existing || []).filter(r => r.state === "TX");
  console.log(`Found ${txExisting.length} of ${titles.length} target rows in DB (state=TX)\n`);

  // Build lookup: county -> existing row
  const byTitle = new Map<string, typeof txExisting[0]>();
  for (const r of txExisting) byTitle.set(r.title, r);

  let updateCount = 0, skipCount = 0, deleteCount = 0;
  const updateLog: string[] = [];

  for (const p of PATCHES) {
    const t = titleFor(p.county);
    const row = byTitle.get(t);
    if (!row) { console.log(`MISS UPDATE: ${t} (not found in DB)`); skipCount++; continue; }
    const newUrl = p.url;
    const newSourceName = `${p.county} County Texas — ${p.pageTitle}`;
    const urlChanged = row.website_url !== newUrl;
    const srcChanged = row.source_name !== newSourceName;
    if (!urlChanged && !srcChanged) { console.log(`NOOP   ${p.county.padEnd(11)} (already correct)`); continue; }
    const changes: string[] = [];
    if (urlChanged) changes.push(`url: ${row.website_url} → ${newUrl}`);
    if (srcChanged) changes.push(`source: ${row.source_name} → ${newSourceName}`);
    updateLog.push(`UPDATE ${p.county.padEnd(11)} ${changes.join("; ")}`);
    if (COMMIT) {
      const { error } = await supabaseAdmin
        .from("resources")
        .update({ website_url: newUrl, source_name: newSourceName })
        .eq("id", row.id);
      if (error) { console.log(`ERR  ${p.county}: ${error.message}`); continue; }
    }
    updateCount++;
  }
  updateLog.forEach(l => console.log(l));

  console.log("");
  for (const d of DELETIONS) {
    const t = `${d.county} County Veteran Services Office`;
    const row = byTitle.get(t);
    if (!row) { console.log(`MISS DELETE: ${t} (not found in DB)`); skipCount++; continue; }
    console.log(`DELETE ${d.county.padEnd(11)} (${d.reason})`);
    if (COMMIT) {
      // Cascade: also remove resource_categories + resource_subcategories rows
      await supabaseAdmin.from("resource_categories").delete().eq("resource_id", row.id);
      await supabaseAdmin.from("resource_subcategories").delete().eq("resource_id", row.id);
      const { error } = await supabaseAdmin.from("resources").delete().eq("id", row.id);
      if (error) { console.log(`ERR  ${d.county}: ${error.message}`); continue; }
    }
    deleteCount++;
  }

  console.log(`\n=== Summary: ${updateCount} updates, ${deleteCount} deletes, ${skipCount} skipped ===`);
  if (!COMMIT) console.log(`\nDry-run only. Re-run with --commit to apply.`);
}

main().catch(e => { console.error(e); process.exit(1); });
