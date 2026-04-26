/**
 * California Phase 7 — Final County VSO Closeout
 *
 * Founder-greenlit scope (after Phase 6 sign-off):
 *   AA = Final remaining CA County Veterans Service Offices (7 rows)
 *
 * Founder SOP applied:
 *   - California only.
 *   - No Alabama. No stale tasks. (A stale Alabama Phase 5 plan was injected
 *     mid-session and explicitly rejected per founder protocol.)
 *   - Canonical-source verification per row. Master canonical source again
 *     used: CACVSO directory (https://www.cacvso.org/county-contacts/), the
 *     official statewide professional association of CA County VSOs.
 *     Each county's own canonical .gov page was probed in parallel:
 *
 *       Colusa     — countyofcolusaca.gov/180/Veterans-Services    (200 OK)
 *       Glenn      — countyofglenn.net/.../veterans-services       (403 WAF)
 *       Mariposa   — mariposacounty.org/138/Veterans-Services      (200 OK)
 *       Plumas     — plumascounty.us/96/Veterans-Services          (200 OK)
 *       San Benito — sanbenitocountyca.gov/services/community/...  (403 WAF)
 *       Sierra     — sierracounty.ca.gov (home 200 OK; VSO subpage)
 *       LA County  — mva.lacounty.gov                              (200 OK!)
 *
 *     The 200-OK pages each independently confirmed phone + address that
 *     matched CACVSO exactly. Glenn and San Benito are listed in CACVSO and
 *     WAF-block bots from the probe IP — accepted on CACVSO authority,
 *     same precedent as Phase 6.
 *
 *   - LA COUNTY DMVA — DROPPED FROM SEED (already in DB).
 *     After 9 sessions of military.lacounty.gov returning 403 from this
 *     probe IP, mva.lacounty.gov finally returned 200 OK this session
 *     (CACVSO-listed canonical URL). Built the row, ran dry-run, and the
 *     dedupe index flagged exact-title match: "Los Angeles County
 *     Department of Military and Veterans Affairs" was already shipped
 *     in a prior phase. Honest correction: my "9-session blocker" was a
 *     redundant verification attempt — the row already existed in the DB.
 *     Dropped from seed. Net Phase 7 = 6 rows (Colusa, Glenn, Mariposa,
 *     Plumas, San Benito, Sierra).
 *
 *   - Sierra County footnote: The CACVSO HTML's link field for Sierra was
 *     a copy-paste error pointing to siskiyou.ca.us — caught and
 *     disregarded. Sierra County's own home page (sierracounty.ca.gov)
 *     returned 200 OK confirming county admin existence. The VSO data
 *     block in CACVSO is internally consistent: 706 Mill St in Loyalton
 *     (96118 ZIP, 530 area code — both correct for Sierra County).
 *     CVSO position is currently "Vacant" per CACVSO; office line still
 *     active per published listing.
 *
 *   - Alpine County: NOT IN CACVSO directory. Alpine has ~1,200 residents
 *     (smallest CA county) and no standalone CVSO; veterans there are
 *     served by Amador or El Dorado per ADHS regional pattern. Honest
 *     skip per no-fabrication SOP.
 *
 *   - Thin-category lift (insurance / transportation / substance-recovery /
 *     family-support / financial) was the OTHER half of Phase 7 scope.
 *     During canonical-source probing this session, ALL the canonical
 *     thin-category sources I tried were either WAF-blocked from probe IP
 *     (HICAP via cahealthadvocates.org, Blue Star Families chapters,
 *     CDPH hospice list, CalVet veterans homes pages, DAV-CA chapters),
 *     JS-rendered SPAs with no usable static content (all 8 CA VAMC pages
 *     on va.gov returned 200 OK but only 1.4KB of usable text and zero
 *     extractable phone numbers), or just locator landing pages with no
 *     static lists (IRS VITA, Operation HOPE). Per founder SOP "quality >
 *     vanity rows" and no-fabrication, I did NOT ship any thin-category
 *     row I couldn't verify line-by-line. Documented as Phase 8 owed.
 *
 *   - Lat/lng intentionally null (engine rule).
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");

const ROWS: SeedRow[] = [
  // ===== AA — Final County VSO Closeout (6 — see header note re: LA dropped) =====
  {
    section: "AA", title: "Colusa County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Colusa County's accredited County Veterans Service Office in Colusa. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits (DIC), Aid & Attendance, healthcare enrollment, education benefits (GI Bill), DD-214 retrieval, and appeals. Serves all of Colusa County including Colusa, Williams, Arbuckle, and Maxwell.",
    website_url: "https://www.countyofcolusaca.gov/180/Veterans-Services",
    phone: "(530) 458-0388", address: "251 E. Webster Street",
    city: "Colusa", zip: "95932",
    eligibility: "Veterans, surviving spouses, and dependents of Colusa County",
    source_name: "Colusa County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "AA", title: "Glenn County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Glenn County's accredited County Veterans Service Office in Willows. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Willows, Orland, Hamilton City, and the rural Glenn County agricultural belt.",
    website_url: "https://www.countyofglenn.net/government/departments/veterans-services",
    phone: "(530) 934-6524", address: "525 W. Sycamore Street, Suite A5",
    city: "Willows", zip: "95988",
    eligibility: "Veterans, surviving spouses, and dependents of Glenn County",
    source_name: "Glenn County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "AA", title: "Mariposa County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Mariposa County's accredited County Veterans Service Office in Mariposa (Yosemite gateway county). Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves all of Mariposa County including Mariposa, Coulterville, El Portal, and the Yosemite gateway corridor.",
    website_url: "https://www.mariposacounty.org/138/Veterans-Services",
    phone: "(209) 966-3696", address: "5158 Highway 140, Suite A",
    city: "Mariposa", zip: "95338",
    eligibility: "Veterans, surviving spouses, and dependents of Mariposa County",
    source_name: "Mariposa County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "AA", title: "Plumas County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Plumas County's accredited County Veterans Service Office in Quincy, located in the Health and Human Services Center. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Quincy, Greenville, Portola, Chester, and the rural Feather River country.",
    website_url: "https://www.plumascounty.us/96/Veterans-Services",
    phone: "(530) 283-6275", address: "270 County Hospital Road, Suite 206",
    city: "Quincy", zip: "95971",
    eligibility: "Veterans, surviving spouses, and dependents of Plumas County",
    source_name: "Plumas County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "AA", title: "San Benito County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "San Benito County's accredited County Veterans Service Office in Hollister. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Hollister, San Juan Bautista, and all of San Benito County. Walk-ins on Thursdays; appointments Monday-Friday.",
    website_url: "https://www.sanbenitocountyca.gov/services/community/veterans-services",
    phone: "(831) 647-7613", address: "649 San Benito Street",
    city: "Hollister", zip: "95023",
    eligibility: "Veterans, surviving spouses, and dependents of San Benito County",
    source_name: "San Benito County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "AA", title: "Sierra County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Sierra County's County Veterans Service Office in Loyalton. (CVSO position currently vacant per CACVSO; office line remains active.) Help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Loyalton, Downieville, Sierra City, and the eastern Sierra foothills.",
    website_url: "https://www.sierracounty.ca.gov/",
    phone: "(530) 608-4727", address: "706 Mill Street",
    city: "Loyalton", zip: "96118",
    eligibility: "Veterans, surviving spouses, and dependents of Sierra County",
    source_name: "Sierra County / CACVSO Directory", source_type: "county_government",
  },
  // LA County DMVA was dropped — see header note: it was already in DB
  // under exact title from a prior phase. Net Phase 7 ships 6 rows.
];

runSeed(ROWS, { commit: COMMIT, label: "CA Phase 7 — Final County VSO Closeout", state: "CA" });
