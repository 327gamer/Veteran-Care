/**
 * Texas Phase 5 — Secondary Metros + Weak Categories
 *
 * Strict 6-Phase Florida SOP (locked 2026-04-26):
 *   - 20-min hard cap, skip blockers, no rabbit holes.
 *
 * Targets secondary military-anchored metros and rural-regional hubs that
 * Phase 4 didn't touch: Killeen/Fort Cavazos/Temple (Central Texas), Waco,
 * Rio Grande Valley (McAllen/Pharr/Brownsville/Harlingen), Corpus Christi,
 * Lubbock/Amarillo/Midland/Odessa (West Texas), Tyler/Longview (East
 * Texas), Beaumont/Port Arthur (Golden Triangle), San Angelo/Wichita Falls.
 *
 * Continues to push food/employment/legal/community-support which were
 * weakest after Phase 3.
 */

import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");
const ALLOW_ZIP_BLEED = process.argv.includes("--allow-zip-bleed");

const ROWS: SeedRow[] = [
  // ============================================================
  // KIL — Killeen / Fort Cavazos / Temple (Central Texas)
  // ============================================================
  // DROPPED 2026-04-26 P5: Workforce Solutions of Central Texas — DNS fail on canonical URL; skip-and-continue.
  { section: "KIL", title: "Families in Crisis Inc", cat: "community-support", sub: "Veteran Outreach Programs", city: "Killeen", website_url: "https://www.familiesincrisis.net/", source_name: "Families in Crisis Inc", source_type: "nonprofit", phone: "254-634-1184", desc: "Killeen-based domestic-violence and sexual-assault crisis services nonprofit serving the Fort Cavazos military community across Bell, Coryell, Lampasas, Mills, Hamilton, and San Saba counties. Free shelter, counseling, advocacy, and military-family-specific services with installation MOUs." },
  { section: "KIL", title: "Hill Country Community Action Association", cat: "community-support", sub: "Veteran Outreach Programs", city: "Belton", website_url: "https://www.hccaa.com/", source_name: "Hill Country Community Action Association", source_type: "nonprofit", phone: "877-449-2615", desc: "Community Action Agency serving 9 Central Texas counties around Fort Cavazos with utility assistance, weatherization, Head Start, and senior services for low-income households. Many veteran and military-spouse-headed households rely on energy assistance and case management." },
  { section: "KIL", title: "Central Texas Council of Governments", cat: "community-support", sub: "Veteran Outreach Programs", city: "Belton", website_url: "https://ctcog.org/", source_name: "Central Texas Council of Governments", source_type: "government", phone: "254-770-2200", address: "2180 N Main St, Belton, TX 76513", zip: "76513", desc: "Regional planning organization for the 7-county Central Texas region around Fort Cavazos. Operates the Area Agency on Aging (veteran-directed care, caregiver support), 9-1-1 services, and regional veteran-services coordination including the Heart of Texas Defense Alliance." },

  // ============================================================
  // WAC — Waco
  // ============================================================
  { section: "WAC", title: "Heart of Texas Workforce Solutions", cat: "employment", sub: "DVOP / Workforce Programs", city: "Waco", website_url: "https://www.hotworkforce.com/", source_name: "Heart of Texas Workforce Board", source_type: "workforce_board", phone: "254-296-5300", desc: "Workforce development board for the 6-county Heart of Texas region (McLennan, Bosque, Falls, Freestone, Hill, Limestone) operating Texas Workforce Commission Career Centers in Waco and surrounding cities. DVOP/LVER staff give veterans priority of service." },
  { section: "WAC", title: "Caritas of Waco", cat: "food-assistance", sub: "Food Banks", city: "Waco", website_url: "https://caritas-waco.org/", source_name: "Caritas of Waco", source_type: "nonprofit", phone: "254-753-4593", address: "300 S 15th St, Waco, TX 76701", zip: "76701", desc: "Waco's largest food pantry and emergency-assistance provider serving McLennan County since 1968. Operates daily food pantry, clothing closet, financial assistance for utilities and rent, and a Veterans Stand Down host site coordinating services for homeless veterans across Central Texas." },
  { section: "WAC", title: "Mission Waco / Mission World", cat: "community-support", sub: "Veteran Outreach Programs", city: "Waco", website_url: "https://missionwaco.org/", source_name: "Mission Waco / Mission World", source_type: "nonprofit", phone: "254-753-4900", desc: "Waco-based community development nonprofit operating poverty-alleviation programs including My Brother's Keeper transitional housing for men (with a substantial veteran population), Manna House food access, and Jubilee Food Market in food-desert neighborhoods of North Waco." },

  // ============================================================
  // RGV — Rio Grande Valley (McAllen / Pharr / Brownsville / Harlingen)
  // ============================================================
  { section: "RGV", title: "Food Bank of the Rio Grande Valley", cat: "food-assistance", sub: "Food Banks", city: "Pharr", website_url: "https://foodbankrgv.com/", source_name: "Food Bank of the Rio Grande Valley", source_type: "nonprofit", phone: "956-682-8101", address: "724 N Cage Blvd, Pharr, TX 78577", zip: "78577", desc: "Feeding America member serving Cameron, Hidalgo, and Willacy counties through 250+ partner agencies. Operates Mobile Pantry events, SNAP outreach, Senior Box program, and partners with VA Texas Valley Coastal Bend HCS to reach veteran households across the four-county RGV region." },
  { section: "RGV", title: "Workforce Solutions Cameron", cat: "employment", sub: "DVOP / Workforce Programs", city: "Brownsville", website_url: "https://www.wfscameron.org/", source_name: "Workforce Solutions Cameron", source_type: "workforce_board", phone: "956-548-6700", desc: "Cameron County workforce development board operating Texas Workforce Commission Career Centers in Brownsville, Harlingen, and San Benito. DVOP/LVER veteran employment representatives provide priority of service for veterans, transitioning service members, and eligible spouses across the Lower RGV." },
  { section: "RGV", title: "Workforce Solutions Lower Rio Grande Valley", cat: "employment", sub: "DVOP / Workforce Programs", city: "McAllen", website_url: "https://www.wfsolutions.org/", source_name: "Workforce Solutions Lower Rio Grande Valley", source_type: "workforce_board", phone: "956-928-5000", desc: "Workforce development board for Hidalgo, Starr, and Willacy counties operating Texas Workforce Commission Career Centers in McAllen, Edinburg, Pharr, Mission, Weslaco, Rio Grande City, and Raymondville. DVOP/LVER staff give priority of service to RGV veterans." },
  { section: "RGV", title: "Texas RioGrande Legal Aid Weslaco Headquarters", cat: "legal", sub: "Legal Aid Services", city: "Weslaco", website_url: "https://www.trla.org/", source_name: "Texas RioGrande Legal Aid", source_type: "legal_aid", phone: "956-968-9574", address: "316 S Closner Blvd, Edinburg, TX 78539", zip: "78539", desc: "TRLA's Lower RGV office covering Hidalgo, Cameron, Starr, and Willacy counties. Free civil legal services for low-income residents with veteran-priority intake including discharge upgrades, VA appeals, military divorce, USERRA, foreclosure, and consumer protection across the Rio Grande Valley." },
  { section: "RGV", title: "Catholic Charities of the Rio Grande Valley", cat: "community-support", sub: "Veteran Nonprofit Organizations", city: "McAllen", website_url: "https://catholiccharitiesrgv.org/", source_name: "Catholic Charities of the Rio Grande Valley", source_type: "nonprofit", phone: "956-702-4088", desc: "Diocese of Brownsville charitable arm operating the Humanitarian Respite Center, immigration legal services, disaster recovery, and family-stability programs across the four-county RGV. Coordinates veteran-family case management with VA Texas Valley Coastal Bend HCS and Workforce Solutions LRGV." },

  // ============================================================
  // COR — Corpus Christi / Coastal Bend
  // ============================================================
  { section: "COR", title: "Coastal Bend Food Bank", cat: "food-assistance", sub: "Food Banks", city: "Corpus Christi", website_url: "https://coastalbendfoodbank.org/", source_name: "Coastal Bend Food Bank", source_type: "nonprofit", phone: "361-887-6291", address: "826 Krill St, Corpus Christi, TX 78408", zip: "78408", desc: "Feeding America member serving 11 South Texas counties (Nueces, Aransas, Bee, Brooks, Duval, Jim Wells, Kenedy, Kleberg, Live Oak, Refugio, San Patricio) through 200+ partner agencies. Mobile Pantry events near NAS Corpus Christi serve Navy and Coast Guard families." },
  { section: "COR", title: "Workforce Solutions of the Coastal Bend", cat: "employment", sub: "DVOP / Workforce Programs", city: "Corpus Christi", website_url: "https://www.workforcesolutionscb.org/", source_name: "Workforce Solutions of the Coastal Bend", source_type: "workforce_board", phone: "361-885-3016", desc: "Workforce development board for the 11-county Coastal Bend region operating Texas Workforce Commission Career Centers across South Texas. DVOP/LVER veteran employment representatives provide priority of service for Coast Guard, Navy, and veteran job seekers anchored at NAS Corpus Christi and NAS Kingsville." },
  { section: "COR", title: "Mission 911 Corpus Christi", cat: "housing", sub: "Emergency Housing / Homeless Shelters", city: "Corpus Christi", website_url: "https://www.mission911.org/", source_name: "Mission 911", source_type: "nonprofit", phone: "361-887-0573", address: "513 Sam Rankin St, Corpus Christi, TX 78401", zip: "78401", desc: "Corpus Christi's longest-running emergency homeless shelter operating men's, women's, and family campuses with addiction-recovery and reintegration programs. Coordinates intake referrals with Corpus Christi VA Outpatient Clinic and the Coastal Bend Continuum of Care for veteran-priority placement." },
  { section: "COR", title: "Texas RioGrande Legal Aid Corpus Christi Office", cat: "legal", sub: "Legal Aid Services", city: "Corpus Christi", website_url: "https://www.trla.org/", source_name: "Texas RioGrande Legal Aid", source_type: "legal_aid", phone: "361-880-9295", address: "1305 N Shoreline Blvd, Corpus Christi, TX 78401", zip: "78401", desc: "TRLA's Coastal Bend branch covering Nueces and surrounding South Texas counties. Free civil legal services for low-income residents with veteran-priority intake: discharge upgrades, VA appeals, military divorce, USERRA, foreclosure prevention, and consumer protection." },

  // ============================================================
  // WTX — West Texas (Lubbock / Amarillo / Midland-Odessa)
  // ============================================================
  // DROPPED 2026-04-26 P5: South Plains Food Bank — both spfb.org and southplainsfoodbank.org DNS-fail; skip-and-continue.
  { section: "WTX", title: "High Plains Food Bank", cat: "food-assistance", sub: "Food Banks", city: "Amarillo", website_url: "https://hpfb.org/", source_name: "High Plains Food Bank", source_type: "nonprofit", phone: "806-374-8562", address: "815 Ross St, Amarillo, TX 79102", zip: "79102", desc: "Feeding America member serving 29 counties across the Texas Panhandle through 130+ partner agencies. Mobile Pantry events at the Thomas E. Creek VA Medical Center in Amarillo deliver veteran-priority distributions; Kids Cafe and Senior Box programs reach military-connected households." },
  { section: "WTX", title: "West Texas Food Bank", cat: "food-assistance", sub: "Food Banks", city: "Odessa", website_url: "https://wtxfoodbank.org/", source_name: "West Texas Food Bank", source_type: "nonprofit", phone: "432-580-6333", address: "1601 Westcliff Dr, Odessa, TX 79764", zip: "79764", desc: "Feeding America member serving 19 counties across the Permian Basin through 75+ partner agencies in Midland, Odessa, San Angelo, and surrounding cities. Mobile Pantries, SNAP outreach, and partnership with Workforce Solutions Permian Basin reach veteran and military-spouse households." },
  { section: "WTX", title: "Workforce Solutions South Plains", cat: "employment", sub: "DVOP / Workforce Programs", city: "Lubbock", website_url: "https://www.spworkforce.org/", source_name: "Workforce Solutions South Plains", source_type: "workforce_board", phone: "806-744-3572", desc: "Workforce development board for 15 South Plains counties operating Texas Workforce Commission Career Centers in Lubbock, Levelland, Plainview, and surrounding cities. DVOP/LVER veteran employment representatives provide priority of service for veterans and Reese Center transitioning service members." },
  { section: "WTX", title: "Workforce Solutions Panhandle", cat: "employment", sub: "DVOP / Workforce Programs", city: "Amarillo", website_url: "https://www.wspanhandle.com/", source_name: "Workforce Solutions Panhandle", source_type: "workforce_board", phone: "806-372-3381", desc: "Workforce development board for the 26-county Texas Panhandle region operating Texas Workforce Commission Career Centers in Amarillo, Borger, Dumas, Hereford, Pampa, and Perryton. DVOP/LVER staff provide priority of service to veterans and Pantex/military-connected job seekers." },
  { section: "WTX", title: "Workforce Solutions Permian Basin", cat: "employment", sub: "DVOP / Workforce Programs", city: "Midland", website_url: "https://workforcepb.org/", source_name: "Workforce Solutions Permian Basin", source_type: "workforce_board", phone: "432-563-5239", desc: "Workforce development board for 17 Permian Basin counties operating Texas Workforce Commission Career Centers in Midland, Odessa, Big Spring, and surrounding cities. DVOP/LVER veteran employment representatives provide priority of service for veterans and Goodfellow AFB-connected transitioning service members." },

  // ============================================================
  // ETX — East Texas (Tyler / Longview)
  // ============================================================
  { section: "ETX", title: "East Texas Food Bank", cat: "food-assistance", sub: "Food Banks", city: "Tyler", website_url: "https://www.easttexasfoodbank.org/", source_name: "East Texas Food Bank", source_type: "nonprofit", phone: "903-597-3663", address: "3201 Robertson Rd, Tyler, TX 75701", zip: "75701", desc: "Feeding America member serving 26 counties across East Texas through 200+ partner agencies. Operates Veterans Mobile Pantry events at the Tyler VA Outpatient Clinic and Lufkin VA Clinic, plus partnership distributions in Longview, Marshall, Texarkana, and Nacogdoches." },
  { section: "ETX", title: "Workforce Solutions East Texas", cat: "employment", sub: "DVOP / Workforce Programs", city: "Tyler", website_url: "https://www.easttexasworkforce.org/", source_name: "Workforce Solutions East Texas", source_type: "workforce_board", phone: "903-984-8641", desc: "Workforce development board for the 14-county East Texas region operating Texas Workforce Commission Career Centers in Tyler, Longview, Marshall, Lufkin, Nacogdoches, Athens, Carthage, and surrounding cities. DVOP/LVER staff provide priority of service to East Texas veterans." },
  { section: "ETX", title: "PATH (People Attempting To Help) Tyler", cat: "community-support", sub: "Veteran Outreach Programs", city: "Tyler", website_url: "https://pathhelps.org/", source_name: "PATH — People Attempting To Help", source_type: "nonprofit", phone: "903-597-4044", address: "402 W Front St, Tyler, TX 75702", zip: "75702", desc: "Tyler-based crisis-services nonprofit operating the Tyler community food pantry, financial-assistance program, employment-readiness services, and the Veterans Affairs Outreach Office which navigates East Texas veterans into VA, county VSO, and community services." },

  // ============================================================
  // BMT — Beaumont / Port Arthur (Golden Triangle)
  // ============================================================
  { section: "BMT", title: "Southeast Texas Food Bank", cat: "food-assistance", sub: "Food Banks", city: "Beaumont", website_url: "https://setxfoodbank.org/", source_name: "Southeast Texas Food Bank", source_type: "nonprofit", phone: "409-839-8777", address: "3845 Milam St, Beaumont, TX 77701", zip: "77701", desc: "Feeding America member serving Jefferson, Orange, Hardin, Tyler, Jasper, Newton, Sabine, and San Augustine counties (the Golden Triangle and Deep East Texas) through 65+ partner agencies. Mobile Pantries reach veteran households across Beaumont, Port Arthur, and Orange." },
  { section: "BMT", title: "Workforce Solutions Southeast Texas", cat: "employment", sub: "DVOP / Workforce Programs", city: "Beaumont", website_url: "https://setworks.org/", source_name: "Workforce Solutions Southeast Texas", source_type: "workforce_board", phone: "409-719-4750", desc: "Workforce development board for Hardin, Jefferson, and Orange counties operating Texas Workforce Commission Career Centers in Beaumont, Port Arthur, and Orange. DVOP/LVER veteran employment representatives provide priority of service to Golden Triangle veterans and military spouses." },
  // DROPPED 2026-04-26 P5: Some Other Place — fetch fail on canonical URL; skip-and-continue.

  // ============================================================
  // SAW — San Angelo / Wichita Falls (smaller military-anchored cities)
  // ============================================================
  { section: "SAW", title: "Concho Valley Workforce Development Board", cat: "employment", sub: "DVOP / Workforce Programs", city: "San Angelo", website_url: "https://cvworkforce.org/", source_name: "Concho Valley Workforce Development Board", source_type: "workforce_board", phone: "325-655-2005", desc: "Workforce development board for the 13-county Concho Valley region around San Angelo operating Texas Workforce Commission Career Centers. DVOP/LVER veteran employment representatives provide priority of service for Goodfellow AFB transitioning service members and West Texas veterans." },
  // DROPPED 2026-04-26 P5: Workforce Solutions North Texas — fetch fail on canonical URL; skip-and-continue.
  // DROPPED 2026-04-26 P5: Concho Valley Regional Food Bank — DNS fail on canonical URL; skip-and-continue.
  { section: "SAW", title: "Wichita Falls Area Food Bank", cat: "food-assistance", sub: "Food Banks", city: "Wichita Falls", website_url: "https://wfafb.org/", source_name: "Wichita Falls Area Food Bank", source_type: "nonprofit", phone: "940-766-2322", address: "1230 Midwestern Pkwy, Wichita Falls, TX 76302", zip: "76302", desc: "Feeding America member serving 12 North Texas counties through 100+ partner agencies. Distributes near Sheppard AFB serving active-duty military families, transitioning service members, and the broader Wichita Falls veteran community in coordination with Workforce Solutions North Texas." },
];

console.log(`[seed-tx-phase5] ${ROWS.length} rows queued (${COMMIT ? "COMMIT" : "DRY-RUN"})`);

runSeed(ROWS, {
  state: "TX",
  commit: COMMIT,
  scriptName: "TX Phase 5 — Secondary Metros + Weak Cats",
  batchTag: "tx-phase5",
  allowBrokenUrls: ALLOW_BROKEN_URLS,
  allowZipBleed: ALLOW_ZIP_BLEED,
  sectionLabels: {
    KIL: "Killeen / Fort Cavazos / Temple (Central Texas)",
    WAC: "Waco / Heart of Texas",
    RGV: "Rio Grande Valley (McAllen / Pharr / Brownsville)",
    COR: "Corpus Christi / Coastal Bend",
    WTX: "West Texas (Lubbock / Amarillo / Midland / Odessa)",
    ETX: "East Texas (Tyler / Longview)",
    BMT: "Beaumont / Port Arthur (Golden Triangle)",
    SAW: "San Angelo / Wichita Falls",
  },
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
