/**
 * California Phase 5 — Statewide VA Vet Center Buildout +
 *                      Greater Bay Area / Sacramento Nonprofit Deepening
 *
 * Founder-approved scope (after Phase 4 LA/Ventura/SB/SLO/Nevada green-light):
 *   DD = NorCal & Bay Area VA Vet Centers (5 rows)
 *   EE = SoCal VA Vet Centers (5 rows)
 *   FF = Bay Area Nonprofit Network (8 rows)
 *
 * Founder SOP applied:
 *   - California only.
 *   - No fabrication. Every row's canonical phone, address, ZIP, and URL
 *     extracted from the canonical 200-OK source page (va.gov JSON-LD for
 *     Vet Centers; the org's own .org domain for nonprofits) — verified
 *     pre-commit.
 *   - Skip uncertain: dropped Bay Area Community Services (no canonical
 *     phone or street address extractable from JS-rendered site), dropped
 *     East LA Vet Center (already in DB as Commerce), dropped San Diego /
 *     Fresno / Concord / Oakland / SF / SJ / Sacramento Vet Centers (all
 *     already in DB), dropped VFW Department of California, AMVETS
 *     Department of California, American Legion Department of California,
 *     PATH People Assisting The Homeless (all already in DB).
 *   - CityTeam Oakland / SF / SJ kept with address=null per founder SOP —
 *     org name + phone confirmed from canonical .org homepage; street
 *     addresses are JS-rendered and could not be extracted from a static
 *     fetch. Skipping addresses (rather than fabricating them) is the
 *     correct application of the no-fabrication SOP; the .org URL itself
 *     remains the canonical source of record.
 *   - Lat/lng intentionally null (engine rule).
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");

const ROWS: SeedRow[] = [
  // ===== DD — NorCal & Bay Area VA Vet Centers =====
  {
    section: "DD", title: "Chico Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Center serving Butte County and the northern Sacramento Valley. Free, confidential individual and group counseling for combat veterans, military sexual trauma survivors, bereaved families, and transitioning service members — PTSD treatment, marriage and family counseling, substance-use counseling, employment assessment, and bereavement counseling for survivors of service members who died on active duty.",
    website_url: "https://www.va.gov/chico-vet-center/",
    phone: "(530) 899-6300", address: "250 Cohasset Road, Suite 40",
    city: "Chico", zip: "95926",
    eligibility: "Combat-zone veterans, MST survivors, drone-crew veterans, transitioning service members, and bereaved military families",
    source_name: "U.S. Department of Veterans Affairs — Vet Center Program", source_type: "federal_government",
  },
  {
    section: "DD", title: "Citrus Heights Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Center serving Sacramento County's eastern suburbs (Citrus Heights, Roseville, Folsom, Rancho Cordova). Free, confidential individual and group counseling — PTSD, MST, military couples and family counseling, substance-use counseling, and bereavement counseling for survivors of service members lost on active duty.",
    website_url: "https://www.va.gov/citrus-heights-vet-center/",
    phone: "(916) 535-0420", address: "5650 Sunrise Boulevard, Suite 150",
    city: "Citrus Heights", zip: "95610",
    eligibility: "Combat-zone veterans, MST survivors, drone-crew veterans, transitioning service members, and bereaved military families",
    source_name: "U.S. Department of Veterans Affairs — Vet Center Program", source_type: "federal_government",
  },
  {
    section: "DD", title: "Eureka Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Center serving Humboldt and Del Norte Counties on California's Lost Coast. Free, confidential individual and group counseling for combat veterans, MST survivors, transitioning service members, and bereaved families — PTSD, marital and family counseling, substance-use counseling, and bereavement support.",
    website_url: "https://www.va.gov/eureka-vet-center/",
    phone: "(707) 444-8271", address: "2830 G Street, Suite A and B",
    city: "Eureka", zip: "95501",
    eligibility: "Combat-zone veterans, MST survivors, drone-crew veterans, transitioning service members, and bereaved military families",
    source_name: "U.S. Department of Veterans Affairs — Vet Center Program", source_type: "federal_government",
  },
  {
    section: "DD", title: "North Bay Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Center serving Sonoma, Marin, Napa, and Solano Counties. Free, confidential individual and group counseling — PTSD treatment, MST counseling, marital and family counseling, substance-use counseling, and bereavement counseling for survivors of service members who died on active duty.",
    website_url: "https://www.va.gov/north-bay-vet-center/",
    phone: "(707) 586-5966", address: "6010 Commerce Boulevard, Suite 145",
    city: "Rohnert Park", zip: "94928",
    eligibility: "Combat-zone veterans, MST survivors, drone-crew veterans, transitioning service members, and bereaved military families",
    source_name: "U.S. Department of Veterans Affairs — Vet Center Program", source_type: "federal_government",
  },
  {
    section: "DD", title: "Peninsula Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Center on the Menlo Park VA campus serving San Mateo and Santa Clara Counties. Free, confidential individual and group counseling — PTSD treatment, MST counseling, marital and family counseling, substance-use counseling, employment assessment, and bereavement counseling.",
    website_url: "https://www.va.gov/peninsula-vet-center/",
    phone: "(650) 614-9825", address: "795 Willow Road, Building 324 Wing B",
    city: "Menlo Park", zip: "94025",
    eligibility: "Combat-zone veterans, MST survivors, drone-crew veterans, transitioning service members, and bereaved military families",
    source_name: "U.S. Department of Veterans Affairs — Vet Center Program", source_type: "federal_government",
  },

  // ===== EE — SoCal VA Vet Centers =====
  {
    section: "EE", title: "Bakersfield Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Center serving Kern County and the southern San Joaquin Valley. Free, confidential individual and group counseling for combat veterans, MST survivors, and bereaved families — PTSD treatment, marital and family counseling, substance-use counseling, and bereavement counseling for survivors of service members lost on active duty.",
    website_url: "https://www.va.gov/bakersfield-vet-center/",
    phone: "(661) 323-8387", address: "1110 Golden State Avenue",
    city: "Bakersfield", zip: "93301",
    eligibility: "Combat-zone veterans, MST survivors, drone-crew veterans, transitioning service members, and bereaved military families",
    source_name: "U.S. Department of Veterans Affairs — Vet Center Program", source_type: "federal_government",
  },
  {
    section: "EE", title: "Corona Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Center serving western Riverside County and northern Orange County (Corona, Norco, Eastvale, Yorba Linda, Anaheim Hills). Free, confidential individual and group counseling — PTSD, MST, marital and family counseling, substance-use counseling, and bereavement counseling.",
    website_url: "https://www.va.gov/corona-vet-center/",
    phone: "(951) 734-0525", address: "800 Magnolia Avenue, Suite 110",
    city: "Corona", zip: "92879",
    eligibility: "Combat-zone veterans, MST survivors, drone-crew veterans, transitioning service members, and bereaved military families",
    source_name: "U.S. Department of Veterans Affairs — Vet Center Program", source_type: "federal_government",
  },
  {
    section: "EE", title: "San Bernardino Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Center serving the central San Bernardino Valley (San Bernardino, Highland, Redlands, Loma Linda, Rialto, Fontana). Free, confidential individual and group counseling — PTSD treatment, MST counseling, marital and family counseling, substance-use counseling, and bereavement counseling for survivors of service members who died on active duty.",
    website_url: "https://www.va.gov/san-bernardino-vet-center/",
    phone: "(909) 801-5762", address: "356 East Vanderbilt Way",
    city: "San Bernardino", zip: "92408",
    eligibility: "Combat-zone veterans, MST survivors, drone-crew veterans, transitioning service members, and bereaved military families",
    source_name: "U.S. Department of Veterans Affairs — Vet Center Program", source_type: "federal_government",
  },
  {
    section: "EE", title: "Temecula Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Center serving southwest Riverside County and northern San Diego County (Temecula, Murrieta, Wildomar, Menifee, Lake Elsinore, Fallbrook). Free, confidential individual and group counseling — PTSD, MST, marital and family counseling, substance-use counseling, and bereavement counseling.",
    website_url: "https://www.va.gov/temecula-vet-center/",
    phone: "(951) 302-4849", address: "40935 County Center Drive, Suite A/B",
    city: "Temecula", zip: "92591",
    eligibility: "Combat-zone veterans, MST survivors, drone-crew veterans, transitioning service members, and bereaved military families",
    source_name: "U.S. Department of Veterans Affairs — Vet Center Program", source_type: "federal_government",
  },
  {
    section: "EE", title: "West Los Angeles Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Center in Culver City serving the Westside of Los Angeles County (Culver City, Westchester, Mar Vista, Santa Monica, Venice, Marina del Rey, Playa Vista, west of the 405). Free, confidential individual and group counseling — PTSD treatment, MST counseling, marital and family counseling, substance-use counseling, and bereavement counseling.",
    website_url: "https://www.va.gov/west-los-angeles-vet-center/",
    phone: "(310) 641-0326", address: "5730 Uplander Way, Suite 100",
    city: "Culver City", zip: "90230",
    eligibility: "Combat-zone veterans, MST survivors, drone-crew veterans, transitioning service members, and bereaved military families",
    source_name: "U.S. Department of Veterans Affairs — Vet Center Program", source_type: "federal_government",
  },

  // ===== FF — Bay Area Nonprofit Network =====
  {
    section: "FF", title: "Abode Services",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Bay Area's largest homeless-services nonprofit. Operates Supportive Services for Veteran Families (SSVF) across Alameda, Santa Clara, San Mateo, and Solano Counties — rapid rehousing, homelessness prevention, case management, and HUD-VASH partnership. Permanent supportive housing portfolio includes dedicated veteran units in Fremont, Hayward, Oakland, Sunnyvale, and Vallejo.",
    website_url: "https://abodeservices.org/",
    phone: "(510) 657-7409", address: "40849 Fremont Boulevard",
    city: "Fremont", zip: "94538",
    eligibility: "Homeless and at-risk veterans and families across the Bay Area; SSVF eligibility per VA guidelines",
    source_name: "Abode Services", source_type: "nonprofit",
  },
  {
    section: "FF", title: "CityTeam Oakland",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "CityTeam Oakland — emergency men's shelter, hot meals, hygiene kits, mail services, recovery program, and case management for adults experiencing homelessness in Alameda County. Shelter, recovery, and meal services are open to veterans alongside the general homeless population.",
    website_url: "https://www.cityteam.org/oakland/",
    phone: "(510) 452-3758",
    city: "Oakland",
    eligibility: "Adults experiencing homelessness in Alameda County; recovery program is faith-based and voluntary",
    source_name: "CityTeam Ministries", source_type: "nonprofit",
  },
  {
    section: "FF", title: "CityTeam San Francisco",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "CityTeam San Francisco — emergency men's shelter, daily hot meals, hygiene services, recovery program, and case management for adults experiencing homelessness in San Francisco. Shelter, recovery, and meal services are open to veterans alongside the general homeless population.",
    website_url: "https://www.cityteam.org/sanfrancisco/",
    phone: "(415) 861-8688",
    city: "San Francisco",
    eligibility: "Adults experiencing homelessness in San Francisco; recovery program is faith-based and voluntary",
    source_name: "CityTeam Ministries", source_type: "nonprofit",
  },
  {
    section: "FF", title: "CityTeam San Jose",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "CityTeam San Jose — emergency shelter, hot meals, hygiene services, men's recovery program, women & children's programs, and case management for adults and families experiencing homelessness in Santa Clara County. Services are open to veterans alongside the general homeless population.",
    website_url: "https://www.cityteam.org/sanjose/",
    phone: "(408) 232-5600",
    city: "San Jose",
    eligibility: "Adults and families experiencing homelessness in Santa Clara County; recovery program is faith-based and voluntary",
    source_name: "CityTeam Ministries", source_type: "nonprofit",
  },
  {
    section: "FF", title: "Second Harvest of Silicon Valley",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Santa Clara and San Mateo Counties' regional food bank. Distributes 60+ million pounds of food annually through 1,200+ partner pantries and direct-distribution sites; operates a Veterans Outreach Initiative that places mobile food distributions at the Palo Alto VA, Menlo Park VA, and Vet Centers, and provides home-delivered groceries for homebound veterans through partner agencies.",
    website_url: "https://www.shfb.org/",
    phone: "(408) 266-8866", address: "4001 North First Street",
    city: "San Jose", zip: "95134",
    eligibility: "All food-insecure residents of Santa Clara and San Mateo Counties; no income verification required for emergency food",
    source_name: "Second Harvest of Silicon Valley", source_type: "nonprofit",
  },
  {
    section: "FF", title: "Sacramento Housing and Redevelopment Agency",
    cat: "housing", sub: "Rental Assistance",
    desc: "Joint city/county housing authority for Sacramento. Administers the federal Housing Choice Voucher (Section 8) program for ~12,000 households, the HUD-VASH veteran voucher program in partnership with the Mather VA, project-based rental assistance, and public-housing units. Veterans receive priority placement on the HUD-VASH waiting list with Mather VA case-management referral.",
    website_url: "https://shra.org/",
    phone: "(916) 440-1390", address: "630 I Street",
    city: "Sacramento", zip: "95814",
    eligibility: "Low-income Sacramento city and county residents; HUD-VASH limited to homeless veterans referred by VA Northern California Health Care System",
    source_name: "Sacramento Housing and Redevelopment Agency", source_type: "city_government",
  },
  {
    section: "FF", title: "Compass Family Services",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "San Francisco's lead family-homelessness nonprofit since 1914. Operates Compass Connecting Point (the city's central intake for homeless families), Compass Family Shelter, Compass Clara House transitional housing, and Compass SF HOME rapid-rehousing — including dedicated capacity for veteran-headed families coordinated with the SF VAMC and HUD-VASH program.",
    website_url: "https://www.compass-sf.org/",
    phone: "(415) 644-0504", address: "37 Grove Street",
    city: "San Francisco", zip: "94102",
    eligibility: "Homeless and at-risk families with minor children in San Francisco; veteran-headed families prioritized for HUD-VASH coordination",
    source_name: "Compass Family Services", source_type: "nonprofit",
  },
  {
    section: "FF", title: "SHELTER, Inc.",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Contra Costa County's largest homeless-prevention and rehousing nonprofit. Operates Supportive Services for Veteran Families (SSVF) for Contra Costa, Solano, and Alameda Counties — rapid rehousing, homelessness prevention, temporary financial assistance, case management, and HUD-VASH partnership with the Martinez VA. Permanent supportive housing portfolio includes Mountain View House (chronically homeless veterans, Martinez).",
    website_url: "https://www.shelterinc.org/",
    phone: "(925) 338-2788", address: "1333 Willow Pass Road, Suite 206",
    city: "Concord", zip: "94520",
    eligibility: "Homeless and at-risk veterans and families across Contra Costa, Solano, and Alameda Counties; SSVF eligibility per VA guidelines",
    source_name: "SHELTER, Inc. of Contra Costa County", source_type: "nonprofit",
  },
];

runSeed(ROWS, {
  state: "CA",
  commit: COMMIT,
  scriptName: "seed-ca-phase5",
  sectionLabels: {
    DD: "NorCal/Bay Vet Ctrs",
    EE: "SoCal Vet Centers",
    FF: "Bay Area Nonprofits",
  },
}).catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
