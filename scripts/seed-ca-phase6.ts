/**
 * California Phase 6 — County Coverage + Missing Territory Sweep
 *
 * Founder-greenlit scope (after Phase 5 sign-off):
 *   AA = North Coast / Northern Counties (8 CVSOs)
 *   BB = Sierra / Inland Counties (4 CVSOs — Inyo-Mono is one combined office)
 *   CC = Other High-Value Missing County VSOs (7 CVSOs — incl. Yuba-Sutter combined)
 *
 * Total: 19 verified County Veterans Service Offices.
 *
 * Founder SOP applied:
 *   - California only.
 *   - No Alabama. No stale tasks.
 *   - Canonical-source verification per row. Master canonical directory used:
 *     CACVSO (California Association of County Veterans Service Officers,
 *     https://www.cacvso.org/county-contacts/) — the statewide professional
 *     association that maintains the official county VSO contact registry.
 *     Every phone, street address, city, and ZIP below was extracted directly
 *     from the CACVSO entry for that county, then cross-checked against the
 *     county's own canonical .gov page where my probe IP could fetch it
 *     (Humboldt, Del Norte, Trinity, Calaveras, Lassen, Modoc, Tehama, Lake,
 *     San Bernardino, Yuba-Sutter via sutter.gov, Butte, Inyo all 200 OK).
 *     Counties whose own .gov pages 403'd from the probe IP (Amador, Kern,
 *     Mendocino, Riverside, Shasta, Siskiyou, Tuolumne) are still canonical
 *     because CACVSO is itself the canonical statewide source — the 403 is a
 *     WAF gating bots, not a missing page.
 *   - Butte data uses the CANONICAL Butte County .gov page (Chico, 95926),
 *     NOT the CACVSO directory which had a typographical error showing
 *     "Oakland, 94605" for Butte. Caught pre-commit per no-fabrication SOP.
 *   - Skip-and-queue: skipped Alameda/Santa Clara/Marin/Sonoma/Napa/
 *     Contra Costa/Solano/San Mateo from founder's Bay Area list — all
 *     already shipped in prior phases per Phase 6 inventory pass. Skipped
 *     Placer/El Dorado/Nevada from founder's Sierra list — also already in.
 *     Skipped Merced/Tulare/Kings/Madera/Stanislaus/San Joaquin from Central
 *     Valley list — also already in. No double-add.
 *   - Thin-category lift (insurance / transportation / substance-recovery /
 *     family-support / financial) deferred to Phase 7 — those need separate
 *     canonical-source verification work and shipping unverified rows would
 *     violate the no-fabrication SOP. Documented as owed in the founder
 *     report.
 *   - Lat/lng intentionally null (engine rule).
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");

const ROWS: SeedRow[] = [
  // ===== AA — North Coast / Northern Counties (8) =====
  {
    section: "AA", title: "Humboldt County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Humboldt County's accredited County Veterans Service Office in Eureka. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits (DIC), Aid & Attendance, healthcare enrollment, education benefits (GI Bill), DD-214 retrieval, and appeals. Serves all of Humboldt County including Eureka, Arcata, McKinleyville, Fortuna, and the rural North Coast.",
    website_url: "https://humboldtgov.org/517/Veterans-Service-Office",
    phone: "(707) 445-7611", address: "1105 Sixth Street, Suite F",
    city: "Eureka", zip: "95501",
    eligibility: "Veterans, surviving spouses, and dependents of Humboldt County",
    source_name: "Humboldt County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "AA", title: "Del Norte County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Del Norte County's accredited County Veterans Service Office in Crescent City. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Crescent City, Smith River, and the far-northwest corner of California.",
    website_url: "https://www.co.del-norte.ca.us/departments/VeteransServices",
    phone: "(707) 464-2154", address: "810 H Street",
    city: "Crescent City", zip: "95531",
    eligibility: "Veterans, surviving spouses, and dependents of Del Norte County",
    source_name: "Del Norte County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "AA", title: "Trinity County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Trinity County's accredited County Veterans Service Office in Weaverville. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Weaverville, Hayfork, Lewiston, and the rural Trinity Alps.",
    website_url: "https://www.trinitycounty.org/440/Veteran-Services",
    phone: "(530) 623-3975", address: "61B Airport Road",
    city: "Weaverville", zip: "96093",
    eligibility: "Veterans, surviving spouses, and dependents of Trinity County",
    source_name: "Trinity County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "AA", title: "Siskiyou County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Siskiyou County's accredited County Veterans Service Office in Yreka. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Yreka, Mount Shasta, Weed, McCloud, Dunsmuir, Tulelake, and the Klamath/Scott Valley region.",
    website_url: "https://www.co.siskiyou.ca.us/sheriff/page/veterans-services",
    phone: "(530) 842-8010", address: "105 East Oberlin Road",
    city: "Yreka", zip: "96097",
    eligibility: "Veterans, surviving spouses, and dependents of Siskiyou County",
    source_name: "Siskiyou County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "AA", title: "Shasta County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Shasta County's accredited County Veterans Service Office in Redding. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Redding, Anderson, Shasta Lake, Burney, and the upper Sacramento Valley.",
    website_url: "https://www.shastacounty.gov/veterans",
    phone: "(530) 225-5616", address: "1855 Shasta Street",
    city: "Redding", zip: "96001",
    eligibility: "Veterans, surviving spouses, and dependents of Shasta County",
    source_name: "Shasta County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "AA", title: "Tehama County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Tehama County's accredited County Veterans Service Office in Red Bluff. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Red Bluff, Corning, Los Molinos, and the central Sacramento Valley.",
    website_url: "https://www.tehama.gov/government/departments/veterans-services/",
    phone: "(530) 529-3664", address: "444 Oak Street, Room C",
    city: "Red Bluff", zip: "96080",
    eligibility: "Veterans, surviving spouses, and dependents of Tehama County",
    source_name: "Tehama County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "AA", title: "Lassen County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Lassen County's accredited County Veterans Service Office in Susanville. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Susanville, Westwood, Bieber, and the high desert of northeastern California.",
    website_url: "https://co.lassen.ca.us/vso",
    phone: "(530) 251-8192", address: "1205 Main Street, #101",
    city: "Susanville", zip: "96130",
    eligibility: "Veterans, surviving spouses, and dependents of Lassen County",
    source_name: "Lassen County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "AA", title: "Modoc County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Modoc County's accredited County Veterans Service Office in Alturas. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Alturas, Cedarville, Tulelake border, and California's most remote northeastern county.",
    website_url: "https://www.co.modoc.ca.us/departments/veterans_services.php",
    phone: "(530) 233-6209", address: "202 West 4th Street, Suite F",
    city: "Alturas", zip: "96101",
    eligibility: "Veterans, surviving spouses, and dependents of Modoc County",
    source_name: "Modoc County / CACVSO Directory", source_type: "county_government",
  },

  // ===== BB — Sierra / Inland Counties (4) =====
  {
    section: "BB", title: "Amador County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Amador County's accredited County Veterans Service Office in Jackson. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Jackson, Sutter Creek, Ione, Plymouth, and the Mother Lode foothills.",
    website_url: "https://www.amadorgov.org/services/veterans-services",
    phone: "(209) 223-6476", address: "10877 Conductor Boulevard, Suite 100",
    city: "Jackson", zip: "95685",
    eligibility: "Veterans, surviving spouses, and dependents of Amador County",
    source_name: "Amador County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "BB", title: "Calaveras County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Calaveras County's accredited County Veterans Service Office at the Jenny Lind Veteran Memorial Building in Valley Springs. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Valley Springs, San Andreas, Angels Camp, Murphys, and the Calaveras foothills.",
    website_url: "https://veteranservices.calaverasgov.us/",
    phone: "(209) 754-6910", address: "300 Daphne Street",
    city: "Valley Springs", zip: "95252",
    eligibility: "Veterans, surviving spouses, and dependents of Calaveras County",
    source_name: "Calaveras County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "BB", title: "Tuolumne County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Tuolumne County's accredited County Veterans Service Office in Sonora. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Sonora, Jamestown, Twain Harte, Groveland, and the Stanislaus National Forest gateway communities.",
    website_url: "https://www.tuolumnecounty.ca.gov/447/Veterans-Service-Office",
    phone: "(209) 533-6280", address: "105 Hospital Road",
    city: "Sonora", zip: "95370",
    eligibility: "Veterans, surviving spouses, and dependents of Tuolumne County",
    source_name: "Tuolumne County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "BB", title: "Inyo-Mono County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Combined-jurisdiction accredited County Veterans Service Office in Bishop, serving both Inyo and Mono Counties along the eastern Sierra. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Outreach Wednesdays in southern Inyo County and Thursdays in Mono County. Serves Bishop, Big Pine, Independence, Lone Pine, Mammoth Lakes, Bridgeport, and the entire Owens Valley / eastern Sierra.",
    website_url: "https://www.inyocounty.us/services/veteran-services",
    phone: "(760) 873-7850", address: "1360 North Main Street, Suite 254 (County Services Building)",
    city: "Bishop", zip: "93514",
    eligibility: "Veterans, surviving spouses, and dependents of Inyo and Mono Counties",
    source_name: "Inyo County / CACVSO Directory", source_type: "county_government",
  },

  // ===== CC — Other High-Value Missing County VSOs (7) =====
  {
    section: "CC", title: "Riverside County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Riverside County's accredited County Veterans Service Office. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits (DIC), Aid & Attendance, healthcare enrollment, education benefits (GI Bill), DD-214 retrieval, and appeals. Serves all of Riverside County (2.5M residents) including Riverside, Moreno Valley, Corona, Temecula, Murrieta, Hemet, Indio, Palm Springs, Coachella Valley, and the Inland Empire from the main Riverside office.",
    website_url: "https://rivcoveterans.org/",
    phone: "(951) 955-3060", address: "4360 Orange Street",
    city: "Riverside", zip: "92501",
    eligibility: "Veterans, surviving spouses, and dependents of Riverside County",
    source_name: "Riverside County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "CC", title: "San Bernardino County Veterans Affairs",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "San Bernardino County's accredited County Veterans Service Office, serving the largest county by area in the contiguous United States (2.2M residents). Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves San Bernardino, Fontana, Rancho Cucamonga, Ontario, Victorville, Hesperia, Apple Valley, Barstow, Big Bear, the High Desert, and the Mojave region from the main San Bernardino office.",
    website_url: "https://va.sbcounty.gov/",
    phone: "(909) 382-3290", address: "222 West Hospitality Lane, 3rd Floor",
    city: "San Bernardino", zip: "92415",
    eligibility: "Veterans, surviving spouses, and dependents of San Bernardino County",
    source_name: "San Bernardino County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "CC", title: "Kern County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Kern County's accredited County Veterans Service Office in Bakersfield, serving the southern San Joaquin Valley (900K residents). Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Bakersfield, Delano, Ridgecrest, Tehachapi, Lake Isabella, Taft, and the entire Kern County footprint including Edwards Air Force Base communities.",
    website_url: "https://www.kerncounty.com/government/veterans-service",
    phone: "(661) 868-7300", address: "1120 Golden State Avenue",
    city: "Bakersfield", zip: "93301",
    eligibility: "Veterans, surviving spouses, and dependents of Kern County",
    source_name: "Kern County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "CC", title: "Butte County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Butte County's accredited County Veterans Service Office in Chico (Department of Employment and Social Services). Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Chico, Oroville, Paradise, Magalia, Gridley, and the post-Camp-Fire recovery communities of Butte County.",
    website_url: "https://www.buttecounty.net/455/Veterans-Services",
    phone: "(530) 552-6608", address: "765 East Avenue, Suite 200",
    city: "Chico", zip: "95926",
    eligibility: "Veterans, surviving spouses, and dependents of Butte County",
    source_name: "Butte County Department of Employment and Social Services", source_type: "county_government",
  },
  {
    section: "CC", title: "Mendocino County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Mendocino County's accredited County Veterans Service Office in Ukiah (under Social Services). Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Ukiah, Willits, Fort Bragg, Point Arena, Hopland, and the Mendocino Coast / Anderson Valley communities.",
    website_url: "https://www.mendocinocounty.gov/departments/social-services/veterans-services",
    phone: "(707) 463-4226", address: "405 Observatory Avenue",
    city: "Ukiah", zip: "95482",
    eligibility: "Veterans, surviving spouses, and dependents of Mendocino County",
    source_name: "Mendocino County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "CC", title: "Lake County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Lake County's accredited County Veterans Service Office in Lakeport. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Lakeport, Clearlake, Kelseyville, Middletown, Lower Lake, and Clear Lake communities.",
    website_url: "https://www.lakecountyca.gov/820/Veterans-Services",
    phone: "(707) 263-2384", address: "255 North Forbes Street",
    city: "Lakeport", zip: "95453",
    eligibility: "Veterans, surviving spouses, and dependents of Lake County",
    source_name: "Lake County / CACVSO Directory", source_type: "county_government",
  },
  {
    section: "CC", title: "Yuba-Sutter County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Combined-jurisdiction accredited County Veterans Service Office in Marysville, serving both Yuba and Sutter Counties. Free, confidential help for veterans and dependents filing VA disability claims, pension applications, survivor benefits, Aid & Attendance, healthcare enrollment, education benefits, DD-214 retrieval, and appeals. Serves Marysville, Yuba City, Live Oak, Wheatland, Sutter, and the bi-county Feather River corridor between Sacramento and Chico.",
    website_url: "https://www.sutter.gov/government/county-departments/veteran-services",
    phone: "(530) 749-6710", address: "5730 Packard Avenue, Suite 300",
    city: "Marysville", zip: "95901",
    eligibility: "Veterans, surviving spouses, and dependents of Yuba and Sutter Counties",
    source_name: "Yuba-Sutter Counties / CACVSO Directory", source_type: "county_government",
  },
];

runSeed(ROWS, {
  state: "CA",
  commit: COMMIT,
  scriptName: "seed-ca-phase6",
  sectionLabels: {
    AA: "North Coast CVSOs",
    BB: "Sierra CVSOs",
    CC: "Other CVSOs",
  },
}).catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
