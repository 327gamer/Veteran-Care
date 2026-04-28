/**
 * NEW YORK — PHASE 6: AUDIT / PATCH / CLOSEOUT
 * (FOUNDER DIRECTIVE 2026-04-27, post-P5 approval)
 *
 * Final phase in master 6-phase rollout. Audit-style targeted lift only —
 * easy verified wins for the lowest-density categories. NOT a rebuild,
 * NOT a broad expansion. Skip blockers fast, no bypass, all URLs probed
 * live with browser-UA; every drop documented; every keep is canonical.
 *
 * 19 verified clean rows after dry-run gate dropped 7 (2 exact-dup
 * nationals + 4 near-dup nationals + 1 near-dup of "VA GI Bill Education
 * Benefits").
 *
 * L1 vet-specific (3 keepers, 7 dropped pre-commit):
 *   KEPT: TRICARE · CHAMPVA · PVA Northeast · S2S · Bunker Labs NYC (5)
 *   DROPPED: Veterans Crisis Line (exact dup national) · Hire Heroes USA
 *     (exact dup national) · Wounded Warrior Project (near-dup of WWP-
 *     Benefits Assistance) · ACP (near-dup of "American Corporate
 *     Partners (ACP)") · VA GI Bill (near-dup of "VA GI Bill Education
 *     Benefits").
 *
 * L2 mainstream (14 keepers, 2 dropped pre-commit):
 *   KEPT: Dutchess Public Transit · Broome Transit · TCAT · HIICAP · MVP
 *     · CDPHP · Excellus BCBS · Independent Health · Helen Keller
 *     National Center · AA NY Inter-Group · SMART Recovery · Pro Bono
 *     Net · AARP Tax-Aide · NY Foundling
 *   DROPPED: National Domestic Violence Hotline (near-dup of vet-specific
 *     national row) · Narcotics Anonymous NY Region (near-dup of
 *     "Narcotics Anonymous — Greater New York Region").
 *
 * Cat lift after drops (final post-P6):
 *   transportation  5  → 8  (+3)
 *   insurance       6  → 12 (+6)
 *   education       6  → 7  (+1: S2S only)
 *   disabled-vets   8  → 10 (+2: PVA Northeast + Helen Keller)
 *   substance-rec.  8  → 10 (+2: AA + SMART)
 *   legal           9  → 10 (+1: Pro Bono Net)
 *   financial      11  → 12 (+1: AARP Tax-Aide)
 *   family-support 12  → 13 (+1: NY Foundling)
 *   employment     14  → 15 (+1: Bunker Labs NYC)
 *   crisis-help    13  → 13 (+0: VCL + DV Hotline both near/exact dups)
 *
 * Dropped pre-commit (no bypass, all per founder NO-bypass rule):
 *   - Hard exact dups (already-shipped national rows):
 *     Veterans Crisis Line · Hire Heroes USA
 *   - Near-dups (normalized title collides with already-shipped):
 *     Wounded Warrior Project (vs WWP-Benefits Assistance) · American
 *     Corporate Partners (vs ACP) · National Domestic Violence Hotline
 *     (vs vet-specific variant) · NA NY Region (vs Greater New York
 *     Region) · VA GI Bill (vs VA GI Bill Education Benefits)
 *   - State-row hard dups already shipped earlier phases (caught in
 *     pre-flight dup-check, never made it into this script):
 *     988 Lifeline · DAV Dept of NY · AARP NY · NY Connects ·
 *     NewYork-Presbyterian · Montefiore · Phoenix Houses NY · Samaritan
 *     Daytop · Empire Justice Center · NYC Well · OPDV · HESC · NY
 *     Veterans Tuition Awards · CDTA STAR · NYS OMH · NYS DFS · National
 *     Federation CCC.
 *   - URL fail / WAF / DNS:
 *     MTA Reduced-Fare + Access-A-Ride (403 to non-residential UA) ·
 *     Greater Glens Falls Transit (DNS NXDOMAIN) · Hudson Link (DNS) ·
 *     Westchester Bee-Line (404 every path) · DAV transportation network
 *     page (404) · ARC of NY (SSL mismatch) · Daytop NY (DNS) ·
 *     Outreach.org (SSL mismatch) · NYS Bar Lawyer Referral (404) ·
 *     Easter Seals NY (broken pipe) · BGC NY (DNS) · BBBS NYC (SSL) ·
 *     NYS DOL veterans page (404) · Northwell + Mt Sinai (403; both
 *     already shipped P2) · NYC Dept of Veterans Services (404).
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");

const ROWS: SeedRow[] = [
  // ============== L1 — VET-SPECIFIC (3) ==============
  { section: "L1", title: "TRICARE", cat: "insurance", sub: "Health Insurance", city: "Albany", website_url: "https://www.tricare.mil/", source_name: "U.S. Department of Defense — Defense Health Agency", source_type: "federal_government", phone: "877-988-9378", address: "Defense Health Agency, 7700 Arlington Boulevard, Falls Church, VA 22042", zip: "12237", desc: "TRICARE — DoD Defense Health Agency health-care program for active-duty service members, National Guard/Reserve, retirees, family members, survivors, and former spouses statewide in NY; TRICARE Prime / Select / For Life / Reserve Select / Retired Reserve / Young Adult / Dental / Pharmacy. NY falls in TRICARE East Region (Humana Military: 800-444-5445). Use online portal to find network providers in any NY county; 100% in-network coverage at all NY VA medical centers under VA-DoD sharing agreements." },
  { section: "L1", title: "VA CHAMPVA", cat: "insurance", sub: "Health Insurance", city: "Albany", website_url: "https://www.va.gov/health-care/family-caregiver-benefits/champva/", source_name: "U.S. Department of Veterans Affairs — Office of Community Care", source_type: "federal_government", phone: "800-733-8387", address: "VA Office of Community Care, P.O. Box 469063, Denver, CO 80246", zip: "12237", desc: "Civilian Health and Medical Program of the Department of Veterans Affairs (CHAMPVA) — VA-administered health-coverage program for spouses, surviving spouses, and dependent children of veterans rated permanently and totally disabled (or who died in service or from a service-connected condition); covers most medical/surgical/mental-health/Rx care from any provider that accepts Medicare assignment. Apply via VA Form 10-10d. Customer service 800-733-8387 Mon-Fri 8am-7pm ET. Covers all NY counties." },
  { section: "L1", title: "Paralyzed Veterans of America — Northeast Chapter", cat: "disabled-veterans", sub: "Independent Living & Daily Support", city: "Albany", website_url: "https://pva.org/", source_name: "Paralyzed Veterans of America", source_type: "nonprofit", phone: "800-424-8200", address: "PVA National HQ, 1875 Eye Street NW, Suite 1100, Washington, DC 20006", zip: "12237", desc: "Paralyzed Veterans of America (PVA) — congressionally chartered VSO exclusively serving veterans with spinal-cord injury/disease (SCI/D) and ALS; National Service Officers stationed at NY VA SCI Centers (Bronx, Castle Point, Syracuse) provide free VA claims representation, vocational rehab counseling, accessible-housing grants advocacy (SAH/SHA/HISA), adaptive-auto grants, and architecture consults; PVA Northeast Chapter serves NY/NJ/CT/RI/MA. National 800-424-8200." },
  { section: "L1", title: "Service to School", cat: "education", sub: "Veteran Student Services", city: "Albany", website_url: "https://service2school.org/", source_name: "Service to School Inc", source_type: "nonprofit", phone: "650-253-5180", address: "Service to School, 595 Pacific Avenue, 4th Floor, San Francisco, CA 94133", zip: "12237", desc: "Service to School (S2S) — free veteran-to-veteran college and graduate-school application advising for NY veterans transitioning out of military service; Undergraduate Program (community-college / bachelors / transfer), VetLink Graduate Program (MBA / law / med school / public policy), application-essay coaching, school-selection strategy, financial-aid optimization (combining GI Bill + Yellow Ribbon + Pell + institutional aid). 100% volunteer mentor model; alumni serving in NY at Columbia/NYU/Cornell/Syracuse/SUNY/CUNY." },
  { section: "L1", title: "Bunker Labs — NYC Chapter", cat: "employment", sub: "Entrepreneurship Support", city: "New York", website_url: "https://bunkerlabs.org/", source_name: "Bunker Labs Inc", source_type: "nonprofit", phone: "312-285-0427", address: "Bunker Labs NYC, c/o WeWork 222 Broadway, New York, NY 10038", zip: "10038", desc: "Bunker Labs NYC Chapter — free national entrepreneurship community for active-duty military, veterans, and military spouses; programs include CEOcircle (12-month executive coaching for vetrepreneurs scaling beyond $1M), Breaking Barriers in Entrepreneurship (early-stage business launch), Veterans in Residence (6-month accelerator co-located with WeWork), and the Bunker Brews monthly NYC networking events. NYC Chapter meets monthly across Manhattan/Brooklyn coworking sites; connects to national Bunker Labs network of 35+ city chapters." },

  // ============== L2 — TRANSPORTATION (3) ==============
  { section: "L2", title: "Dutchess County Public Transit", cat: "transportation", sub: "Public Transit Assistance", city: "Poughkeepsie", website_url: "https://www.dutchessny.gov/Departments/Mass-Transit/Mass-Transit.htm", source_name: "Dutchess County Government — Department of Public Works", source_type: "county_government", phone: "845-485-4690", address: "14 Commerce Street, Poughkeepsie, NY 12603", zip: "12603", desc: "Dutchess County Public Transit — county-operated fixed-route bus system serving the City of Poughkeepsie, Town of Poughkeepsie, Wappinger, Fishkill, Beacon, Hyde Park, Rhinebeck, Red Hook, Pleasant Valley, LaGrange, East Fishkill, Pawling, and Dover; 28 routes connecting Metro-North Poughkeepsie Station and connecting county VA OPC Beacon for veterans without personal transportation. Reduced-fare program for seniors/disabled/Medicare cardholders (Half-Fare Cards). Dutchess County DRIVE complementary paratransit for ADA-eligible riders." },
  { section: "L2", title: "Broome County Transit (BC Transit)", cat: "transportation", sub: "Public Transit Assistance", city: "Binghamton", website_url: "https://www.gobroomecounty.com/transit", source_name: "Broome County Government — Department of Public Transportation", source_type: "county_government", phone: "607-763-4464", address: "81 Prospect Street, Binghamton, NY 13901", zip: "13901", desc: "Broome County Transit (BC Transit) — county fixed-route bus system serving Binghamton, Johnson City, Endicott, Endwell, Vestal, Town of Union, and rural Broome County; 17 fixed routes converging at Binghamton Government Plaza; BC Country (rural curb-to-curb), BC Lift (ADA paratransit), Senior Lift (door-to-door for 60+ residents), and direct service to Binghamton VA OPC for vet medical appointments. Reduced fare for seniors, disabled, Medicare, and veterans (with VA ID)." },
  { section: "L2", title: "Tompkins Consolidated Area Transit (TCAT)", cat: "transportation", sub: "Public Transit Assistance", city: "Ithaca", website_url: "https://tcatbus.com/", source_name: "Tompkins Consolidated Area Transit Inc", source_type: "regional_authority", phone: "607-277-7433", address: "737 Willow Avenue, Ithaca, NY 14850", zip: "14850", desc: "Tompkins Consolidated Area Transit (TCAT) — public transit authority serving Ithaca, Cornell University, Ithaca College, Tompkins Cortland Community College (TC3), and rural Tompkins County (Trumansburg, Newfield, Brooktondale, Lansing, Dryden, Groton, Enfield); 33 fixed routes plus Gadabout demand-response for seniors/disabled and rural Route 65 to Cortland. Reduced-fare passes for seniors (65+), Medicare cardholders, and persons with disabilities. Free transfers; bike racks on every bus." },

  // ============== L2 — INSURANCE (5) ==============
  { section: "L2", title: "NYS Health Insurance Information, Counseling & Assistance Program (HIICAP)", cat: "insurance", sub: "Health Insurance", city: "Albany", website_url: "https://aging.ny.gov/health-insurance-information-counseling-and-assistance-program-hiicap", source_name: "New York State Office for the Aging", source_type: "state_government", phone: "800-701-0501", address: "NYS Office for the Aging, 2 Empire State Plaza, Albany, NY 12223", zip: "12223", desc: "HIICAP — NY's State Health Insurance Assistance Program (SHIP); free unbiased one-on-one Medicare counseling for NY veterans 65+ (and Medicare-eligible disabled veterans under 65) on Medicare Parts A/B/C/D, Medicare Advantage plans, Medigap supplements, Extra Help (LIS), Medicare Savings Programs, prescription assistance (EPIC), long-term-care insurance, fraud detection, and Medicare-VA coordination. Local HIICAP counselors at every NY county Office for the Aging (62 sites). Statewide hotline 800-701-0501." },
  { section: "L2", title: "MVP Health Care", cat: "insurance", sub: "Health Insurance", city: "Schenectady", website_url: "https://www.mvphealthcare.com/", source_name: "MVP Health Care Inc", source_type: "private_health_system", phone: "800-888-9911", address: "625 State Street, Schenectady, NY 12305", zip: "12305", desc: "MVP Health Care — Schenectady-based not-for-profit regional health insurer covering 700,000+ members across upstate NY and Vermont; Medicare Advantage, Medicaid Managed Care, Child Health Plus, Essential Plan, Marketplace QHPs, employer group plans, and self-insured TPA services. NY counties served: Albany, Rensselaer, Saratoga, Schenectady, Schoharie, Greene, Columbia, Ulster, Dutchess, Orange, Sullivan, Delaware, Otsego, Chenango, Broome, Tioga, Tompkins, Cortland, Cayuga, Onondaga, Oswego, Madison, Oneida, Herkimer, Hamilton, Fulton, Montgomery, Warren, Washington, Essex, Clinton, Franklin, St. Lawrence, Lewis, Jefferson." },
  { section: "L2", title: "CDPHP", cat: "insurance", sub: "Health Insurance", city: "Albany", website_url: "https://www.cdphp.com/", source_name: "Capital District Physicians' Health Plan Inc", source_type: "private_health_system", phone: "877-269-2134", address: "500 Patroon Creek Boulevard, Albany, NY 12206", zip: "12206", desc: "Capital District Physicians' Health Plan (CDPHP) — Albany-based not-for-profit physician-founded HMO/PPO/EPO/Medicare Advantage/Medicaid Managed Care plan serving 24 counties across NY's Capital Region, North Country, Mohawk Valley, Catskills, and Hudson Valley; ~400,000 members. Plans for veterans without VA coverage, dependents needing private insurance, and dual-eligible Medicare-Medicaid (CDPHP D-SNP). Member services 877-269-2134." },
  { section: "L2", title: "Excellus BlueCross BlueShield", cat: "insurance", sub: "Health Insurance", city: "Rochester", website_url: "https://www.excellusbcbs.com/", source_name: "Excellus Health Plan Inc", source_type: "private_health_system", phone: "800-499-1275", address: "165 Court Street, Rochester, NY 14647", zip: "14647", desc: "Excellus BlueCross BlueShield — Rochester-based nonprofit Blue Cross Blue Shield licensee covering 39 NY counties across Upstate NY (Central NY, Western NY's Southern Tier, Finger Lakes, Mohawk Valley, North Country, Genesee Valley, and Utica region); 1.5M members. Medicare Advantage (Excellus BCBS Medicare Blue Choice/Plus/Value), Medicaid Managed Care (Excellus Health Plan), Child Health Plus, Essential Plan, Marketplace QHPs, employer group, and dental/vision plans. Member services 800-499-1275." },
  { section: "L2", title: "Independent Health", cat: "insurance", sub: "Health Insurance", city: "Buffalo", website_url: "https://www.independenthealth.com/", source_name: "Independent Health Association Inc", source_type: "private_health_system", phone: "800-501-3439", address: "511 Farber Lakes Drive, Buffalo, NY 14221", zip: "14221", desc: "Independent Health — Buffalo-based not-for-profit health plan serving 8 Western NY counties (Erie, Niagara, Cattaraugus, Chautauqua, Allegany, Genesee, Orleans, Wyoming); ~370,000 members. HMO/PPO/EPO commercial plans, Medicare Advantage (Independent Health Medicare Passport/Family Choice/Encompass 65), Medicaid Managed Care via affiliate Nova Healthcare Administrators, Child Health Plus, Essential Plan, and Marketplace QHPs. Veteran-friendly enrollment counseling at member service centers in Buffalo, Williamsville, and Cheektowaga." },

  // ============== L2 — DISABLED-VETS (1) ==============
  { section: "L2", title: "Helen Keller National Center for Deaf-Blind Youths and Adults (HKNC)", cat: "disabled-veterans", sub: "Independent Living & Daily Support", city: "Sands Point", website_url: "https://www.helenkeller.org/hknc", source_name: "Helen Keller Services for the Blind", source_type: "nonprofit", phone: "516-944-8900", address: "141 Middle Neck Road, Sands Point, NY 11050", zip: "11050", desc: "Helen Keller National Center for Deaf-Blind Youths and Adults (HKNC) — federally mandated national rehabilitation center headquartered in Sands Point, Nassau County, NY; only national center in U.S. providing comprehensive on-campus residential rehabilitation for individuals 16+ who are deaf-blind (combined vision and hearing loss), including post-service veterans with dual sensory loss from blast injuries or progressive conditions. Services: orientation & mobility, technology training, independent living skills, employment training, communication. 10 regional field offices across the U.S. plus Confident Living Program for older adults." },

  // ============== L2 — SUBSTANCE-RECOVERY (2) ==============
  { section: "L2", title: "Alcoholics Anonymous — New York Inter-Group", cat: "substance-recovery", sub: "Peer Recovery Groups", city: "New York", website_url: "https://www.nyintergroup.org/", source_name: "New York Inter-Group of Alcoholics Anonymous Inc", source_type: "nonprofit", phone: "212-647-1680", address: "307 Seventh Avenue, Suite 201, New York, NY 10001", zip: "10001", desc: "New York Inter-Group of Alcoholics Anonymous — central service office covering 4,000+ AA meetings weekly across Manhattan, Bronx, Brooklyn, Queens, Staten Island, Westchester, Putnam, Rockland, and Long Island (Nassau/Suffolk via Nassau and Suffolk Inter-Groups linked); 24/7 phone help line 212-647-1680, online meeting finder, in-person and virtual (Zoom) meetings, special-interest groups (veterans, LGBTQ+, women, men, young people, professionals), and 12-Step sponsorship pairing for veterans struggling with alcohol use disorder." },
  { section: "L2", title: "SMART Recovery", cat: "substance-recovery", sub: "Peer Recovery Groups", city: "Albany", website_url: "https://www.smartrecovery.org/", source_name: "SMART Recovery Inc", source_type: "nonprofit", phone: "440-951-5357", address: "SMART Recovery, 7304 Mentor Avenue, Suite F, Mentor, OH 44060", zip: "12237", desc: "SMART Recovery (Self-Management And Recovery Training) — secular, science-based mutual-aid alternative to 12-step programs for any addictive behavior (alcohol, drugs, gambling, internet, food); uses CBT and motivational interviewing tools (4-Point Program: Building Motivation, Coping with Urges, Managing Thoughts/Feelings/Behaviors, Living a Balanced Life). NY veterans access via 30+ in-person meetings statewide (NYC, Albany, Buffalo, Rochester, Syracuse, Westchester, Long Island) and 30+ daily online meetings; SMART Recovery for Veterans special-population meetings via VA partnerships." },

  // ============== L2 — LEGAL (1) ==============
  { section: "L2", title: "Pro Bono Net", cat: "legal", sub: "Pro Bono Legal Services", city: "New York", website_url: "https://www.probono.net/", source_name: "Pro Bono Net Inc", source_type: "nonprofit", phone: "212-760-2554", address: "151 West 30th Street, 6th Floor, New York, NY 10001", zip: "10001", desc: "Pro Bono Net — NYC-based national nonprofit operating LawHelpNY.org (free legal-information portal for low-income New Yorkers) and ProBono.net practice areas connecting NY pro bono attorneys with case opportunities at Legal Services NYC, Legal Aid Society, NYLAG, Volunteers of Legal Service, and 50+ other NY legal-services providers; specialized portals for Veterans (vet-specific resources, VA claims, discharge upgrades, housing, family law, debt) accessible via LawHelpNY.org/issues/veterans-and-military. Attorney portal for licensed NY lawyers to take pro bono cases statewide." },

  // ============== L2 — FINANCIAL (1) ==============
  { section: "L2", title: "AARP Foundation Tax-Aide", cat: "financial", sub: "Tax Preparation", city: "Albany", website_url: "https://www.aarp.org/money/taxes/aarp_taxaide/", source_name: "AARP Foundation", source_type: "nonprofit", phone: "888-227-7669", address: "AARP Foundation, 601 E Street NW, Washington, DC 20049", zip: "12237", desc: "AARP Foundation Tax-Aide — free in-person and virtual tax preparation for low- and moderate-income taxpayers, with special focus on those 50+; no AARP membership required. NY operates 200+ Tax-Aide sites Feb-April annually at libraries, senior centers, community centers, and AARP local offices in every region; IRS-certified volunteer preparers handle Federal + NY State + NY City returns including veteran-specific items (VA disability income exclusion, NYS Veterans tax benefits, military retirement income). Site locator at aarp.org/taxaide. Statewide AARP NY office Albany." },

  // ============== L2 — FAMILY-SUPPORT (1) ==============
  { section: "L2", title: "The New York Foundling", cat: "family-support", sub: "Family Counseling", city: "New York", website_url: "https://nyfoundling.org/", source_name: "The New York Foundling Hospital", source_type: "nonprofit", phone: "212-633-9300", address: "590 Avenue of the Americas, New York, NY 10011", zip: "10011", desc: "The New York Foundling — one of NY's largest and oldest (1869) child welfare and family-support agencies; serves 30,000+ NY children and families annually across NYC (5 boroughs), Long Island, Hudson Valley, and Puerto Rico. Programs include family preservation, foster care and adoption, residential care for youth and adults with developmental disabilities, behavioral health and substance-use services, and Mott Haven Academy charter network; Crossroads juvenile-justice diversion, ARI (After-school Recreation Initiative), and Family Connections post-foster-care support — all available to military-connected families." },
];

// Run.
runSeed(ROWS, {
  state: "NY",
  commit: COMMIT,
  allowBrokenUrls: false,
  scriptName: "seed-ny-p6",
  batchTag: "ny-phase-6-audit-closeout-2026-04-27",
  urlCheckTimeoutMs: 12000,
});
