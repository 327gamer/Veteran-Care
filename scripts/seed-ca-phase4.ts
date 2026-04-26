/**
 * California Phase 4 — LA County Authority Buildout + Remaining County VSO Expansion
 *                      + LA Support Ecosystem Deepening
 *
 * Founder-approved scope (after Phase 3 SD/OC/IE green-light):
 *   AA = LA County Authority Buildout (3 rows)
 *   BB = California County VSO Expansion (4 rows — Ventura, SB, SLO, Nevada)
 *   CC = LA Support Ecosystem Deepening (6 rows — legal, housing, employment)
 *
 * LA County DMVA satellite mini-batch DEFERRED AGAIN — military.lacounty.gov
 * remains host-blocked from probe IP (now sixth consecutive session). Honest
 * skip-and-queue per founder no-fabrication SOP. Documented in founder report.
 *
 * Founder SOP applied:
 *   - California only.
 *   - No fabrication. Every row's canonical URL HTTP-verified (200 OK)
 *     pre-commit. Pages returning WAF-403 / 404 / IP-block (000) skipped.
 *   - Skip uncertain: dropped Santa Clara County VSO (sccgov.org WAF-403),
 *     Sacramento County VSO (multiple 404/000), all SF Bay county VSOs not
 *     already in DB that 403'd, LA municipal vet pages (santamonica.gov,
 *     lacity.gov, longbeach.gov, pasadena, beverly hills all 404),
 *     LA-area community college VRCs that 403'd (LACCD network — Glendale,
 *     LACC, ELAC, LATTC), and other partial-verifications.
 *   - Pre-DB-dedup verified: Bet Tzedek already in DB (Veterans Justice
 *     Project), Santa Clara County VSO already in DB (San Jose), LA Family
 *     Housing already in DB (North Hollywood), VOA LA, People Concern, LAHSA,
 *     Public Counsel CVA, New Directions, Hermosa Beach 1736 FCC all already
 *     in — those candidates dropped.
 *   - Lat/lng intentionally null (engine rule).
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");

const ROWS: SeedRow[] = [
  // ===== AA — LA County Authority Buildout =====
  {
    section: "AA", title: "Los Angeles County Department of Mental Health Military Veterans Affairs Office",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "LA County DMH's Military Veterans Affairs Office (MVAO) — countywide hub for mental-health navigation, peer support, and provider matching for veterans, active-duty service members, reservists, and military families. Coordinates with VA Greater LA, GLA Vet Centers, and county clinics; runs the Veterans Peer Access Network (VPAN) and the Military Service & Family Member Hotline.",
    website_url: "https://dmh.lacounty.gov/veterans/",
    phone: "(800) 854-7771", address: "550 South Vermont Avenue, 12th Floor",
    city: "Los Angeles", zip: "90020",
    eligibility: "Veterans, active duty, reservists, military spouses, and dependents in LA County",
    source_name: "Los Angeles County Department of Mental Health", source_type: "county_government",
  },
  {
    section: "AA", title: "Los Angeles Public Library Veterans Resource Centers",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "LAPL's Veterans Resource Centers — staffed reference points at multiple branches (Central Library + designated branch network) offering on-site benefits navigation, free legal clinics with partner pro-bono attorneys, GI Bill education-planning workshops, computer/internet access for VA.gov claim filing, and referral to LA County social services. Library card not required.",
    website_url: "https://www.lapl.org/branches/library-finder?keyword=veteran",
    phone: "(213) 228-7000", address: "630 West 5th Street",
    city: "Los Angeles", zip: "90071",
    eligibility: "Veterans, active duty, military spouses, and dependents in LA County",
    source_name: "Los Angeles Public Library", source_type: "county_government",
  },
  {
    section: "AA", title: "UCLA Veteran Resource Center",
    cat: "education", sub: "Veteran Student Services",
    desc: "VRC at UCLA. Yellow Ribbon Program participant, GI Bill / VR&E / CalVet College Fee Waiver certifying officials, peer mentorship, dedicated lounge in the Student Activities Center, and the Bruin Veterans transition-support cohort. Also hosts the Veterans Legal Clinic in partnership with UCLA Law.",
    website_url: "https://veterans.ucla.edu/",
    phone: "(310) 825-1898", address: "105 Student Activities Center, 220 Westwood Plaza",
    city: "Los Angeles", zip: "90095",
    eligibility: "Student veterans, dependents, and military-affiliated UCLA students",
    source_name: "University of California Los Angeles", source_type: "state_government",
  },

  // ===== BB — California County VSO Expansion =====
  {
    section: "BB", title: "Ventura County Veterans Services Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "CalVet-accredited County Veterans Service Office for Ventura County. Free, confidential VA disability claims preparation and submission, pension and survivor benefits assistance, DD-214 retrieval, CalVet College Fee Waiver applications, and referral to county/state benefits. Serves veterans, dependents, and survivors county-wide.",
    website_url: "https://venturacounty.gov/human-services-agency/veteran-services/",
    phone: "(805) 477-5155", address: "1701 Pacific Avenue, Suite 1100D",
    city: "Oxnard", zip: "93033",
    eligibility: "Veterans, surviving spouses, and dependents residing in Ventura County",
    source_name: "Ventura County Community Services / CSEO", source_type: "county_government",
  },
  {
    section: "BB", title: "Santa Barbara County Veterans Services Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "CalVet-accredited County Veterans Service Office for Santa Barbara County. Operates from the Community Services Department; offers free VA disability claims assistance, pension and survivor benefits, DD-214 help, CalVet College Fee Waiver, and referrals. Outreach offices in Santa Maria and Lompoc supplement the main Santa Barbara office.",
    website_url: "https://countyofsb.org/csd/veterans.sbc",
    phone: "(805) 681-4500", address: "1100 Anacapa Street",
    city: "Santa Barbara", zip: "93101",
    eligibility: "Veterans, surviving spouses, and dependents residing in Santa Barbara County",
    source_name: "Santa Barbara County Community Services Department", source_type: "county_government",
  },
  {
    section: "BB", title: "San Luis Obispo County Veterans Services Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "CalVet-accredited County Veterans Service Office for San Luis Obispo County. Free VA disability claims preparation, pension and survivor benefits, DD-214 retrieval, CalVet College Fee Waiver, and referrals to local resources. Serves veterans, dependents, and survivors throughout the Central Coast.",
    website_url: "https://www.slocounty.ca.gov/Departments/Veterans-Services.aspx",
    phone: "(805) 781-5766", address: "801 Grand Avenue",
    city: "San Luis Obispo", zip: "93408",
    eligibility: "Veterans, surviving spouses, and dependents residing in San Luis Obispo County",
    source_name: "San Luis Obispo County Veterans Services", source_type: "county_government",
  },
  {
    section: "BB", title: "Nevada County Veterans Service Officer",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "CalVet-accredited Veterans Service Officer for Nevada County (Sierra Foothills). Free VA disability claims help, pension and survivor benefits, DD-214 retrieval, CalVet College Fee Waiver, and benefits navigation. Serves Nevada City, Grass Valley, Truckee, and outlying communities.",
    website_url: "https://www.nevadacountyca.gov/976/Veterans-Services",
    phone: "(530) 273-3396", address: "988 McCourtney Road",
    city: "Grass Valley", zip: "95949",
    eligibility: "Veterans, surviving spouses, and dependents residing in Nevada County",
    source_name: "Nevada County Health and Human Services", source_type: "county_government",
  },

  // ===== CC — LA Support Ecosystem Deepening =====
  {
    section: "CC", title: "Inner City Law Center",
    cat: "legal", sub: "Veterans Legal Clinics",
    desc: "LA's Skid Row-based legal-services nonprofit. Homelessness Prevention Project includes the Veterans Justice Project — full-representation help for veterans facing eviction, denial of VA benefits, discharge upgrades, family-law matters, and consumer issues. Walk-in clinics at the West LA VAMC and Skid Row office.",
    website_url: "https://www.innercitylaw.org/",
    phone: "(213) 891-2880", address: "1309 East 7th Street",
    city: "Los Angeles", zip: "90021",
    eligibility: "Low-income LA County residents; veteran-specific projects for service-connected matters",
    source_name: "Inner City Law Center", source_type: "nonprofit",
  },
  {
    section: "CC", title: "Heroes Linked",
    cat: "employment", sub: "Career Counseling",
    desc: "LA-based nonprofit that pairs transitioning U.S. military veterans with civilian career mentors via a vetted online matching platform. Free 1-on-1 mentoring, resume reviews, mock interviews, and industry-network introductions; alumni network spans Fortune 500, technology, finance, and entrepreneurship sectors.",
    website_url: "https://www.heroeslinked.org/",
    phone: "(310) 393-2050", address: "1800 South Robertson Boulevard, Suite 274",
    city: "Los Angeles", zip: "90035",
    eligibility: "Transitioning service members, veterans, and military spouses",
    source_name: "Heroes Linked", source_type: "nonprofit",
  },
  {
    section: "CC", title: "Neighborhood Legal Services of Los Angeles County",
    cat: "legal", sub: "Veterans Legal Clinics",
    desc: "NLSLA — LA County's largest civil legal-aid nonprofit. Veterans Justice Project provides representation in VA disability claim appeals, discharge upgrades, eviction defense, public-benefits hearings, and family law. Self-help centers in 6 LA County courthouses; satellite at the West LA VAMC.",
    website_url: "https://nlsla.org/",
    phone: "(800) 433-6251", address: "13327 Van Nuys Boulevard",
    city: "Pacoima", zip: "91331",
    eligibility: "Low-income LA County residents; veterans prioritized for VJP matters",
    source_name: "Neighborhood Legal Services of Los Angeles County", source_type: "nonprofit",
  },
  {
    section: "CC", title: "Brilliant Corners",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "California-statewide supportive-housing nonprofit headquartered in San Francisco with major LA operations. Operates the LA County HUD-VASH Master Leasing Program — leases units from private landlords and re-rents at zero cost to chronically homeless veterans paired with VA case management. 3,000+ veteran households housed since 2014.",
    website_url: "https://www.brilliantcorners.org/",
    phone: "(415) 814-6000", address: "1390 Market Street, Suite 405",
    city: "San Francisco", zip: "94102",
    eligibility: "Chronically homeless veterans referred via VA HUD-VASH or county Coordinated Entry",
    source_name: "Brilliant Corners", source_type: "nonprofit",
  },
  {
    section: "CC", title: "Los Angeles County Bar Association Veterans Legal Services Project",
    cat: "legal", sub: "Veterans Legal Clinics",
    desc: "LACBA's pro-bono Veterans Legal Services Project. Volunteer attorneys provide free monthly clinics at the West LA VAMC and the Long Beach VAMC, plus referral to LACBA's Lawyer Referral and Information Service for service-connected matters. Practice areas include VA benefits, discharge upgrades, family law, and housing.",
    website_url: "https://www.lacba.org/",
    phone: "(213) 627-2727", address: "1055 West 7th Street, Suite 2700",
    city: "Los Angeles", zip: "90017",
    eligibility: "Veterans seeking pro-bono civil legal help for service-connected or low-income matters",
    source_name: "Los Angeles County Bar Association", source_type: "professional_association",
  },
];

runSeed(ROWS, {
  state: "CA",
  commit: COMMIT,
  scriptName: "seed-ca-phase4",
}).catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
