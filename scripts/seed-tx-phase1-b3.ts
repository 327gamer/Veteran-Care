/**
 * Texas Phase 1 — Batch 3: Tier-A County VSO Network (Top-50 priority counties)
 *
 * Goal: ship one row per Top-50 priority TX county that operates a County
 * Veterans Service Office, with the canonical .gov / county-domain CVSO landing
 * page as the website_url. Founder upgrade from 30 → 50 was conditional on
 * canonical sources staying clean — they did not for 19 of 50 (county sites use
 * JS-rendered nav / non-discoverable slug patterns / behind bot challenges).
 * Strict no-fabrication discipline → ship the 31 verified now, skip-and-queue
 * the 19 in B3-followup with explicit per-county rationale.
 *
 * Discipline (locked in replit.md from B2):
 *   - source_name = exact landing-page document title (publisher provenance)
 *   - source_type = "county_vso"
 *   - title pattern = "<County> County Veteran Services Office" (no dash) so
 *     normalizeTitle() yields a stable per-county dedupe key. One exception:
 *     Webb uses its actual program name "Webb County Regional Veterans Treatment
 *     Program" (county-hosted regional vet program serving Webb + 3 adjacent
 *     South-TX counties — accepted as the county's canonical vet-services entry
 *     point because Webb does not maintain a separate dedicated CVSO landing
 *     page on webbcountytx.gov).
 *   - Phone numbers extracted only when the page DOM unambiguously labeled them
 *     as the VSO line (most county sites embed a global header phone — those
 *     were rejected). Where the extracted phone could not be verified as the
 *     VSO direct line in this session, phone is omitted (founder discipline).
 *   - ZIP + address only included when the page printed them in the body of the
 *     Veterans-Services landing page (not the county courthouse global address).
 *
 * Probe methodology (4 passes):
 *   1. scripts/_tx-cvso-probe.ts          — pattern-guess against 50 counties
 *   2. scripts/_tx-cvso-deep-probe.ts     — fetch homepage + harvest links
 *   3. scripts/_tx-cvso-ddg-probe.ts      — DuckDuckGo HTML fallback
 *   4. scripts/_tx-cvso-final-probe.ts    — patterned guess for stragglers
 *
 * Rejected during probe (hand-verified misfires, NOT shipped):
 *   - Brazoria, Nueces, Potter — pages found were Veterans Treatment Court
 *     (court-diversion program), NOT the county CVSO. Different program.
 *   - Rockwall — page found was a /newsflash/ detail page, not a department
 *     landing page.
 *   - El Paso — only DDG hit was findglocal.com (third-party directory),
 *     not a canonical el paso county government URL.
 *
 * Skip-and-queue for B3-B (19 counties — no canonical URL discoverable in this
 * session, NOT a claim that the CVSO doesn't exist):
 *   Brazoria, Nueces, Potter, Rockwall, El Paso, Harris, Smith, Jefferson,
 *   Midland, Taylor, Tom Green, Victoria, Walker, Wichita, Wise, Guadalupe,
 *   Hood, Orange, Randall.
 *   Likely root causes: county sites use JS-rendered nav (server HTML has no
 *   veteran link); some are behind Anubis-like bot challenges; some operate
 *   their CVSO under a non-standard URL slug not discoverable via Bing/DDG
 *   from this IP. Manual founder-led discovery in B3-B will close the gap.
 */

import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");
const ALLOW_ZIP_BLEED = process.argv.includes("--allow-zip-bleed");

// Helper to keep row literals tidy
const v = (
  county: string,
  city: string,
  url: string,
  source_name: string,
  extras: Partial<SeedRow> = {},
): SeedRow => ({
  section: "VSO_COUNTY",
  title: `${county} County Veteran Services Office`,
  cat: "va-benefits",
  sub: "County Veterans Service Offices",
  desc: `${county} County's official County Veterans Service Office (CVSO) — the front-door county-funded service that helps ${county} County veterans, surviving spouses, and dependents file VA disability claims, access education and pension benefits, secure DD-214 records, and connect with state and federal veteran programs. Texas state law authorizes counties to designate a CVSO; ${county} County's CVSO operates under ${county} County government on the ${city} county-government domain.`,
  city,
  website_url: url,
  source_name,
  source_type: "county_vso",
  ...extras,
});

const ROWS: SeedRow[] = [
  // ============================================================
  // VSO_COUNTY — Tier-A County VSO Network (31 verified counties)
  // Ordered alphabetically by county for readability
  // ============================================================

  v("Bell", "Belton",
    "https://www.bellcountytx.com/departments/veteran_services/index.php",
    "Bell County Texas — Veteran Services Department",
    { phone: "254-933-5915" }),

  v("Bexar", "San Antonio",
    "https://www.bexar.org/989/Military-Veterans-Services",
    "Bexar County Texas — Military and Veterans Services"),

  v("Bowie", "New Boston",
    "https://www.co.bowie.tx.us/page/bowie.Veterans",
    "Bowie County Texas — Veterans Services",
    { phone: "903-628-6816", zip: "75570" }),

  v("Brazos", "Bryan",
    "https://www.brazoscountytx.gov/206/Veterans-Services",
    "Brazos County Texas — Veterans Services"),

  v("Cameron", "Brownsville",
    "https://www.cameroncountytx.gov/veterans-department/",
    "Cameron County Texas — Veterans Department",
    { phone: "956-544-0811", zip: "78520" }),

  v("Collin", "McKinney",
    "https://www.collincountytx.gov/Services/Veteran-Services/benefits",
    "Collin County Texas — Veteran Services",
    { phone: "972-881-3060" }),

  v("Comal", "New Braunfels",
    "https://www.co.comal.tx.us/VSO.htm",
    "Comal County Texas — Veteran Services Office (VSO)"),

  v("Dallas", "Dallas",
    "https://www.dallascounty.org/departments/veteran-services/",
    "Dallas County Texas — Department of Veteran Services",
    { phone: "972-692-4939", zip: "75207" }),

  v("Denton", "Denton",
    "https://www.dentoncounty.gov/859/Veterans-Service",
    "Denton County Texas — Veterans Service Office",
    { phone: "940-349-2950" }),

  v("Ector", "Odessa",
    "https://www.co.ector.tx.us/page/ector.Veterans",
    "Ector County Texas — Veterans Services",
    { phone: "432-770-7511" }),

  v("Ellis", "Waxahachie",
    "https://www.co.ellis.tx.us/164/Veteran-Services",
    "Ellis County Texas — Veteran Services",
    { phone: "972-825-5000", zip: "75165", address: "101 West Main Street" }),

  v("Fort Bend", "Richmond",
    "https://www.fortbendcountytx.gov/government/departments/commissioners-court/county-judge/veteran-service-office",
    "Fort Bend County Texas — Veteran Service Office",
    { phone: "281-342-3411", zip: "77469" }),

  v("Galveston", "Galveston",
    "https://www.galvestoncountytx.gov/vs",
    "Galveston County Texas — Veterans Services",
    { phone: "409-770-6044" }),

  v("Grayson", "Sherman",
    "https://www.co.grayson.tx.us/page/va.home",
    "Grayson County Texas — Veterans Services",
    { phone: "903-813-4254" }),

  v("Gregg", "Longview",
    "https://greggcounty.texas.gov/services/veterans-services",
    "Gregg County Texas — Veterans Services",
    { phone: "903-237-2674", zip: "75601" }),

  v("Hardin", "Kountze",
    "https://www.co.hardin.tx.us/page/hardin.Veterans",
    "Hardin County Texas — Veterans Services"),

  v("Hays", "San Marcos",
    "https://www.hayscountytx.gov/veterans-services",
    "Hays County Texas — Veterans Services",
    { phone: "512-392-8387" }),

  v("Henderson", "Athens",
    "https://www.henderson-county.com/departments/veterans-services",
    "Henderson County Texas — Veterans Services",
    { phone: "903-675-6109", zip: "75751" }),

  v("Hidalgo", "Edinburg",
    "https://www.hidalgocounty.us/2057/Veterans-Service-Office",
    "Hidalgo County Texas — Veterans Service Office"),

  v("Hunt", "Greenville",
    "https://www.huntcounty.net/page/hunt.veteransservices",
    "Hunt County Texas — Veterans Services",
    { phone: "903-454-2552", zip: "75402" }),

  v("Johnson", "Cleburne",
    "https://www.johnsoncountytx.org/departments/veteran-s-services",
    "Johnson County Texas — Veteran's Services",
    { phone: "817-556-6351" }),

  v("Kaufman", "Kaufman",
    "https://www.kaufmancounty.net/290/Veterans-Services",
    "Kaufman County Texas — Veterans Services",
    { phone: "469-376-4644", zip: "75142" }),

  v("Liberty", "Liberty",
    "https://www.co.liberty.tx.us/page/liberty.Veterans",
    "Liberty County Texas — Veterans Services",
    { phone: "936-336-4558", zip: "77575" }),

  v("Lubbock", "Lubbock",
    "https://www.lubbockcounty.gov/department/?fDD=23-0",
    "Lubbock County Texas — Veterans Service Office"),

  v("McLennan", "Waco",
    "https://www.co.mclennan.tx.us/261/Veteran-Services",
    "McLennan County Texas — Veteran Services",
    { zip: "76701", address: "501 Washington Avenue" }),

  v("Montgomery", "Conroe",
    "https://www.mctx.org/departments/departments_q_-_z/veterans_services/index.php",
    "Montgomery County Texas — Veterans Services",
    { phone: "936-539-7842", zip: "77301" }),

  v("Parker", "Weatherford",
    "https://www.parkercountytx.com/195/Veterans-Service-Office",
    "Parker County Texas — Veterans Service Office",
    { phone: "682-229-2180", zip: "76086", address: "1 Courthouse Square" }),

  v("Tarrant", "Fort Worth",
    "https://www.tarrantcountytx.gov/en/veteran-services.html",
    "Tarrant County Texas — Veteran Services",
    { phone: "817-531-5645" }),

  v("Travis", "Austin",
    "https://www.traviscountytx.gov/health-human-services/cwa-veterans-services",
    "Travis County Texas — Veterans Services (CWA)"),

  // Webb uses its actual program name (county-hosted regional vet program)
  {
    section: "VSO_COUNTY",
    title: "Webb County Regional Veterans Treatment Program",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Webb County's regional veteran-services program (WCRVTP) — the county-hosted front-door for Webb County and adjacent South-Texas county veterans seeking VA claims help, benefits navigation, and connection to state and federal veteran programs. WCRVTP operates under Webb County government on the webbcountytx.gov domain and serves Webb plus surrounding South-TX counties as a regional vet-services hub.",
    website_url: "https://www.webbcountytx.gov/WCRVTP/",
    city: "Laredo",
    source_name: "Webb County Texas — Webb County Regional Veterans Treatment Program (WCRVTP)",
    source_type: "county_vso",
  },

  v("Williamson", "Georgetown",
    "https://www.wilco.org/Departments/Veterans-Services",
    "Williamson County Texas — Veterans Services",
    { phone: "512-943-1100" }),
];

runSeed(ROWS, {
  state: "TX",
  commit: COMMIT,
  allowBrokenUrls: ALLOW_BROKEN_URLS,
  allowZipBleed: ALLOW_ZIP_BLEED,
  scriptName: "TX Phase 1 — Batch 3 (Tier-A County VSO Network — 31 of Top-50)",
  sectionLabels: {
    VSO_COUNTY: "County Veterans Service Offices (Tier-A network)",
  },
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
