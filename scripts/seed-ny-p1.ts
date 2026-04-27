/**
 * NEW YORK — PHASE 1: STATE FOUNDATION
 *
 * Locked Florida SOP (same engine used for FL / GA / NC / SC / CA / OH / PA / TX / AL).
 * Statewide anchors only:
 *   - NYS Department of Veterans' Services (DVS) + DVS programs
 *   - 4 NYS Veterans' Homes
 *   - 9 VA Medical Centers serving NY
 *   - 6 VA National Cemeteries in NY
 *   - 10 NYS state agencies serving veterans (DOL, OFA, OMH, OASAS, DOH, OTDA, DFS, NYSED, HCR, OPDV)
 *   - Statewide helplines (NY 211, 988, OPDV DV hotline, NYSCADV)
 *   - 3 statewide VSO HQs (American Legion / VFW / DAV — Departments of New York)
 *   - 6 statewide veteran-serving nonprofits HQ in NY
 *   - 5 statewide food / housing / workforce systems
 *   - 6 statewide legal pillars + NYS Veterans Treatment Courts
 *   - DVS county-VSO directory anchor
 *
 * Baseline: NY = 0 rows. P1 target ~60 rows.
 * One-phase-per-run governance active. STOPS after this phase.
 *
 * No fabrication. Every row sourced from .gov / .org institutional site.
 * Uncertain address/phone → left null rather than guessed.
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";
const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");

const ROWS: SeedRow[] = [
  // ============== A — NYS DEPARTMENT OF VETERANS' SERVICES (1) ==============
  { section: "DVS", title: "New York State Department of Veterans' Services (NYS DVS)",
    cat: "va-benefits", sub: "VA Enrollment & General Benefits Navigation",
    city: "Albany", website_url: "https://veterans.ny.gov/",
    source_name: "NYS DVS", source_type: "state_government",
    phone: "888-838-7697", address: "2 Empire State Plaza, Albany, NY 12223", zip: "12223",
    desc: "New York State Department of Veterans' Services — cabinet agency serving NY's ~700,000 veterans. Operates the VetConnectNY peer-coordinator network statewide, oversees county Veterans Service Agencies, administers state benefits (Blind Annuity, Gold Star Parents Annuity, Veterans Tuition Awards), and coordinates the Joseph P. Dwyer Veterans Peer Support Program." },

  // ============== B — NYS DVS PROGRAMS / STATEWIDE (6) ==============
  { section: "DVS-PROG", title: "NY Veterans Tuition Awards (HESC)",
    cat: "education", sub: "Tuition Assistance",
    city: "Albany", website_url: "https://www.hesc.ny.gov/find-aid/nys-grants-scholarships/veterans-tuition-awards/",
    source_name: "NYS Higher Education Services Corporation", source_type: "state_government",
    phone: "888-697-4372", address: "99 Washington Avenue, Albany, NY 12255", zip: "12255",
    desc: "NY Veterans Tuition Awards — full SUNY undergraduate-rate tuition for NY-resident veterans who served in a combat theater (Vietnam, Persian Gulf, Afghanistan/Iraq) or hostile-fire/imminent-danger pay zones. Administered by Higher Education Services Corporation (HESC); usable at any approved NY college (SUNY, CUNY, private, proprietary)." },

  { section: "DVS-PROG", title: "NY Blind Annuity Program",
    cat: "financial", sub: "Veteran Relief Funds",
    city: "Albany", website_url: "https://veterans.ny.gov/",
    source_name: "NYS DVS", source_type: "state_government",
    phone: "888-838-7697", address: "2 Empire State Plaza, Albany, NY 12223", zip: "12223",
    desc: "NY Blind Annuity — annual cash annuity (~$1,323/year, adjusted) for legally blind NY-resident wartime veterans, regardless of service-connection. Administered by NYS DVS; eligibility filed via county Veterans Service Agency or directly to DVS." },

  { section: "DVS-PROG", title: "NY Gold Star Parents Annuity",
    cat: "family-support", sub: "Gold Star Family Support",
    city: "Albany", website_url: "https://veterans.ny.gov/",
    source_name: "NYS DVS", source_type: "state_government",
    phone: "888-838-7697", address: "2 Empire State Plaza, Albany, NY 12223", zip: "12223",
    desc: "NY Gold Star Parents Annuity — annual cash annuity (up to $500/year) for NY-resident parents of service members killed in action or who died of service-connected causes. Administered by NYS DVS; applications via county Veterans Service Agency." },

  { section: "DVS-PROG", title: "NY Veterans Defense Program (Justice for Heroes)",
    cat: "legal", sub: "Criminal Defense",
    city: "Albany", website_url: "https://www.nysda.org/page/VeteransDefenseProgram",
    source_name: "NY State Defenders Association", source_type: "nonprofit",
    phone: "518-465-3524", address: "194 Washington Avenue, Suite 500, Albany, NY 12210", zip: "12210",
    desc: "NY Veterans Defense Program — statewide back-up legal team operated by the NY State Defenders Association under contract with NYS DVS. Provides expert advice/co-counsel to defenders representing NY veterans facing criminal charges; service-record analysis, mitigation, VTC eligibility evaluation, discharge-upgrade collaboration." },

  { section: "DVS-PROG", title: "NYS PFC Joseph P. Dwyer Veteran Peer-to-Peer Support Program",
    cat: "mental-health", sub: "Peer Support",
    city: "Albany", website_url: "https://veterans.ny.gov/",
    source_name: "NYS DVS", source_type: "state_government",
    phone: "888-838-7697", address: "2 Empire State Plaza, Albany, NY 12223", zip: "12223",
    desc: "PFC Joseph P. Dwyer Veteran Peer-to-Peer Support Program — NYS DVS-administered statewide peer-mentorship initiative for combat veterans (with PTSD/TBI focus) operated through county-level partner orgs in 30+ NY counties. Combat-vet-to-combat-vet peer relationships, support groups, family support." },

  { section: "DVS-PROG", title: "NYS Women Veterans Coordinator",
    cat: "community-support", sub: "Veteran Outreach Programs",
    city: "Albany", website_url: "https://veterans.ny.gov/",
    source_name: "NYS DVS", source_type: "state_government",
    phone: "888-838-7697", address: "2 Empire State Plaza, Albany, NY 12223", zip: "12223",
    desc: "NYS Women Veterans Coordinator — DVS-staffed statewide point of contact for NY's ~50,000 women veterans. Connects to women-specific VA care, MST advocacy, NY Women Veterans Hall of Fame, regional networking events; coordinates with VA Women Veterans Program Managers at each NY VAMC." },

  // ============== C — NYS VETERANS' HOMES (4) ==============
  { section: "VET-HOME", title: "Long Island State Veterans Home (Stony Brook)",
    cat: "healthcare", sub: "Specialty Care",
    city: "Stony Brook", website_url: "https://www.listateveteranshome.org/",
    source_name: "Stony Brook Medicine / NYS DOH", source_type: "state_government",
    phone: "631-444-8387", address: "100 Patriots Road, Stony Brook, NY 11790", zip: "11790",
    desc: "Long Island State Veterans Home — 350-bed skilled-nursing/dementia care/short-term rehab facility on the Stony Brook University campus, operated by Stony Brook Medicine for NYS DOH. Serves Long Island & NYC-region veterans; on-site adult day health care, hospice, women's veteran wing." },

  { section: "VET-HOME", title: "NY State Veterans' Home at Batavia",
    cat: "healthcare", sub: "Specialty Care",
    city: "Batavia", website_url: "https://www.health.ny.gov/",
    source_name: "NYS Department of Health", source_type: "state_government",
    phone: "585-345-2000", address: "220 Richmond Avenue, Batavia, NY 14020", zip: "14020",
    desc: "NY State Veterans' Home at Batavia — 250-bed skilled-nursing facility operated by NYS DOH. Serves western NY veterans (Buffalo / Rochester / Genesee Valley region); short-term rehab, long-term skilled care, dementia care unit, hospice." },

  { section: "VET-HOME", title: "NY State Veterans' Home at Oxford",
    cat: "healthcare", sub: "Specialty Care",
    city: "Oxford", website_url: "https://www.health.ny.gov/",
    source_name: "NYS Department of Health", source_type: "state_government",
    phone: "607-843-3100", address: "4211 NY-220, Oxford, NY 13830", zip: "13830",
    desc: "NY State Veterans' Home at Oxford — 242-bed skilled-nursing/domiciliary facility operated by NYS DOH. Serves central / southern-tier NY veterans; long-term skilled care, domiciliary residential care, dementia care, on-site PT/OT." },

  { section: "VET-HOME", title: "NY State Veterans' Home at St. Albans",
    cat: "healthcare", sub: "Specialty Care",
    city: "Saint Albans", website_url: "https://www.health.ny.gov/",
    source_name: "NYS Department of Health", source_type: "state_government",
    phone: "718-657-6800", address: "178-50 Linden Boulevard, Saint Albans, NY 11434", zip: "11434",
    desc: "NY State Veterans' Home at St. Albans — 250-bed skilled-nursing facility in Queens (St. Albans neighborhood) operated by NYS DOH on the historic VA St. Albans campus. Serves NYC-region veterans; long-term skilled care, dementia care, short-term rehab." },

  // ============== D — VA MEDICAL CENTERS — STATEWIDE (9) ==============
  { section: "VAMC", title: "VA NY Harbor Healthcare System",
    cat: "healthcare", sub: "VA Medical Centers",
    city: "New York", website_url: "https://www.va.gov/new-york-harbor-health-care/",
    source_name: "VHA", source_type: "federal_government",
    phone: "800-877-6976", address: "423 East 23rd Street, New York, NY 10010", zip: "10010",
    desc: "VA NY Harbor Healthcare System — Level 1a VA medical system serving NYC veterans across three campuses (Manhattan / Brooklyn / St. Albans Queens) plus 7 CBOCs. Polytrauma support clinic, women's health, MST coordinator, homeless veteran programs (HUD-VASH, SSVF), Vet Center coordination." },

  { section: "VAMC", title: "James J. Peters VA Medical Center (Bronx)",
    cat: "healthcare", sub: "VA Medical Centers",
    city: "Bronx", website_url: "https://www.va.gov/bronx-health-care/",
    source_name: "VHA", source_type: "federal_government",
    phone: "718-584-9000", address: "130 W Kingsbridge Road, Bronx, NY 10468", zip: "10468",
    desc: "James J. Peters VAMC — Level 1b VA medical center serving Bronx, lower Westchester, and Rockland veterans. SCI Center of Excellence, polytrauma rehab, primary care, mental health, geriatrics & extended care, oncology; CBOCs in White Plains, Yonkers." },

  { section: "VAMC", title: "Northport VA Medical Center",
    cat: "healthcare", sub: "VA Medical Centers",
    city: "Northport", website_url: "https://www.va.gov/northport-health-care/",
    source_name: "VHA", source_type: "federal_government",
    phone: "631-261-4400", address: "79 Middleville Road, Northport, NY 11768", zip: "11768",
    desc: "Northport VAMC — Level 1c VA medical center on Long Island. Acute medical, mental health, long-term care, polytrauma, women's health, hospice; CBOCs in Bay Shore, East Meadow, Patchogue, Riverhead, Valley Stream. Serves Suffolk & Nassau county veterans." },

  { section: "VAMC", title: "Samuel S. Stratton VA Medical Center (Albany)",
    cat: "healthcare", sub: "VA Medical Centers",
    city: "Albany", website_url: "https://www.va.gov/albany-health-care/",
    source_name: "VHA", source_type: "federal_government",
    phone: "518-626-5000", address: "113 Holland Avenue, Albany, NY 12208", zip: "12208",
    desc: "Samuel S. Stratton VAMC — Level 1c VA medical center serving 22 counties in upstate NY, western VT, and western MA. Acute care, mental health, primary care, long-term care; CBOCs in Bainbridge, Catskill, Clifton Park, Elizabethtown, Fonda, Glens Falls, Kingston, Plattsburgh, Schenectady, Troy." },

  { section: "VAMC", title: "Syracuse VA Medical Center",
    cat: "healthcare", sub: "VA Medical Centers",
    city: "Syracuse", website_url: "https://www.va.gov/syracuse-health-care/",
    source_name: "VHA", source_type: "federal_government",
    phone: "315-425-4400", address: "800 Irving Avenue, Syracuse, NY 13210", zip: "13210",
    desc: "Syracuse VAMC — VA medical center serving central NY veterans (13-county catchment). Acute medical, mental health, primary care, long-term care, polytrauma support; CBOCs in Auburn, Binghamton, Cortland, Oswego, Rome, Watertown." },

  { section: "VAMC", title: "VA Western New York Healthcare System (Buffalo)",
    cat: "healthcare", sub: "VA Medical Centers",
    city: "Buffalo", website_url: "https://www.va.gov/western-new-york-health-care/",
    source_name: "VHA", source_type: "federal_government",
    phone: "716-834-9200", address: "3495 Bailey Avenue, Buffalo, NY 14215", zip: "14215",
    desc: "VA Western NY Healthcare System — Buffalo VAMC + Batavia VAMC integrated system serving Buffalo / Niagara / Rochester / Genesee / Southern Tier veterans. Acute care, mental health, polytrauma, women's health; CBOCs in Dunkirk, Jamestown, Lackawanna, Lockport, Olean, Springville, Warsaw." },

  { section: "VAMC", title: "Bath VA Medical Center (VA Finger Lakes Healthcare System)",
    cat: "healthcare", sub: "VA Medical Centers",
    city: "Bath", website_url: "https://www.va.gov/finger-lakes-health-care",
    source_name: "VHA", source_type: "federal_government",
    phone: "607-664-4000", address: "76 Veterans Avenue, Bath, NY 14810", zip: "14810",
    desc: "Bath VA Medical Center — historic VA medical center (founded 1878) serving NY Southern Tier and Finger Lakes region as part of the integrated VA Finger Lakes Healthcare System (Bath + Canandaigua campuses). Long-term/skilled care, mental health, residential rehab, primary care; CBOCs in Coudersport PA, Elmira, Wellsboro PA. Co-located with Bath National Cemetery." },

  { section: "VAMC", title: "Canandaigua VA Medical Center (VA Finger Lakes Healthcare System)",
    cat: "healthcare", sub: "VA Medical Centers",
    city: "Canandaigua", website_url: "https://www.va.gov/finger-lakes-health-care",
    source_name: "VHA", source_type: "federal_government",
    phone: "585-394-2000", address: "400 Fort Hill Avenue, Canandaigua, NY 14424", zip: "14424",
    desc: "Canandaigua VA Medical Center — VA medical center in Finger Lakes (part of the integrated VA Finger Lakes Healthcare System with Bath campus) specializing in mental health, residential rehab, long-term care, hospice, and the Veterans Crisis Line responder hub (Canandaigua hosts the national VCL operation center). CBOCs in Rochester, Sodus, Geneva, Wayne County." },

  { section: "VAMC", title: "VA Hudson Valley Healthcare System",
    cat: "healthcare", sub: "VA Medical Centers",
    city: "Wappingers Falls", website_url: "https://www.va.gov/hudson-valley-health-care/",
    source_name: "VHA", source_type: "federal_government",
    phone: "800-269-8749", address: "41 Castle Point Road, Wappingers Falls, NY 12590", zip: "12590",
    desc: "VA Hudson Valley Healthcare System — two-campus system (Castle Point + Montrose) serving Hudson Valley & lower Catskills veterans. Acute care, mental health, polytrauma, long-term care; CBOCs in Goshen, Monticello, New City, Pine Plains, Port Jervis, Poughkeepsie, Yonkers." },

  // ============== E — VA NATIONAL CEMETERIES IN NY (6) ==============
  { section: "NATL-CEM", title: "Long Island National Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    city: "Farmingdale", website_url: "https://www.cem.va.gov/cems/nchp/longisland.asp",
    source_name: "VA National Cemetery Administration", source_type: "federal_government",
    phone: "631-454-4949", address: "2040 Wellwood Avenue, Farmingdale, NY 11735", zip: "11735",
    desc: "Long Island National Cemetery — VA NCA cemetery serving NYC and Long Island veterans (closed to first interments; open for second interments and columbarium). Scheduling via 800-535-1117. Co-administered with Calverton and Cypress Hills." },

  { section: "NATL-CEM", title: "Calverton National Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    city: "Calverton", website_url: "https://www.cem.va.gov/cems/nchp/calverton.asp",
    source_name: "VA National Cemetery Administration", source_type: "federal_government",
    phone: "631-727-5410", address: "210 Princeton Boulevard, Calverton, NY 11933", zip: "11933",
    desc: "Calverton National Cemetery — largest VA national cemetery by interments in the country (~7,000+/year). Open for first interments; full eligibility burials and columbarium. Primary national cemetery for Long Island and NYC veterans. Scheduling via 800-535-1117." },

  { section: "NATL-CEM", title: "Bath National Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    city: "Bath", website_url: "https://www.cem.va.gov/cems/nchp/bath.asp",
    source_name: "VA National Cemetery Administration", source_type: "federal_government",
    phone: "607-664-4853", address: "VA Medical Center, 76 Veterans Avenue, Bath, NY 14810", zip: "14810",
    desc: "Bath National Cemetery — VA NCA cemetery on the historic Bath VAMC grounds (founded 1879). Open for first interments; full eligibility burials and columbarium. Serves NY Southern Tier and Finger Lakes region. Scheduling via 800-535-1117." },

  { section: "NATL-CEM", title: "Cypress Hills National Cemetery (Brooklyn)",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    city: "Brooklyn", website_url: "https://www.cem.va.gov/cems/nchp/cypresshills.asp",
    source_name: "VA National Cemetery Administration", source_type: "federal_government",
    phone: "631-454-4949", address: "625 Jamaica Avenue, Brooklyn, NY 11208", zip: "11208",
    desc: "Cypress Hills National Cemetery — VA NCA cemetery in Brooklyn (founded 1862). Closed to first interments; open for second interments and columbarium. Scheduling via 800-535-1117. Administered out of Long Island National Cemetery." },

  { section: "NATL-CEM", title: "Woodlawn National Cemetery (Elmira)",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    city: "Elmira", website_url: "https://www.cem.va.gov/cems/nchp/woodlawn.asp",
    source_name: "VA National Cemetery Administration", source_type: "federal_government",
    phone: "607-732-5411", address: "1825 Davis Street, Elmira, NY 14901", zip: "14901",
    desc: "Woodlawn National Cemetery — VA NCA cemetery in Elmira (founded 1877; includes Confederate POW section from Elmira Prison Camp). Closed to first interments; open for second interments. Serves Southern Tier NY veterans. Scheduling via 800-535-1117." },

  { section: "NATL-CEM", title: "Gerald B.H. Solomon Saratoga National Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    city: "Schuylerville", website_url: "https://www.cem.va.gov/cems/nchp/geraldbhsolomonsaratoga.asp",
    source_name: "VA National Cemetery Administration", source_type: "federal_government",
    phone: "518-581-9128", address: "200 Duell Road, Schuylerville, NY 12871", zip: "12871",
    desc: "Gerald B.H. Solomon Saratoga National Cemetery — VA NCA cemetery in Schuylerville (Saratoga County). Open for first interments; full eligibility burials and columbarium. Primary national cemetery for upstate / capital-region NY veterans. Scheduling via 518-581-9128." },

  // ============== F — NYS STATE AGENCIES SERVING VETERANS (10) ==============
  { section: "STATE-AGY", title: "NYS Department of Labor — Veterans Services",
    cat: "employment", sub: "DVOP / Workforce Programs",
    city: "Albany", website_url: "https://dol.ny.gov/services-veterans",
    source_name: "NYS DOL", source_type: "state_government",
    phone: "518-457-9000", address: "Building 12, Harriman State Office Campus, Albany, NY 12240", zip: "12240",
    desc: "NYS Department of Labor — Veterans Services — DVOP (Disabled Veterans' Outreach Program) and LVER (Local Veterans' Employment Representative) staff at every NYS Career Center. Veterans receive priority of service on job postings and workforce training. Coordinates with USDOL JVSG grant in NY." },

  { section: "STATE-AGY", title: "NYS Office for the Aging (NYSOFA)",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    city: "Albany", website_url: "https://aging.ny.gov/",
    source_name: "NYSOFA", source_type: "state_government",
    phone: "800-342-9871", address: "2 Empire State Plaza, Albany, NY 12223", zip: "12223",
    desc: "NYS Office for the Aging — cabinet agency overseeing 59 Area Agencies on Aging covering all 62 NY counties. EISEP in-home services, NY Connects long-term-care info & assistance, expanded in-home services, congregate & home-delivered meals, caregiver support — all serve elderly veterans without separate eligibility test." },

  { section: "STATE-AGY", title: "NYS Office of Mental Health (OMH)",
    cat: "mental-health", sub: "Counseling & Therapy",
    city: "Albany", website_url: "https://omh.ny.gov/",
    source_name: "NYS OMH", source_type: "state_government",
    phone: "800-597-8481", address: "44 Holland Avenue, Albany, NY 12229", zip: "12229",
    desc: "NYS Office of Mental Health — single state authority for mental-health services. Operates 23 NYS-run psychiatric centers, oversees 4,500+ licensed/certified MH providers, runs the 988 NY Suicide & Crisis Lifeline state coordinator, and partners with the federal Veterans Crisis Line for warm handoffs of NY veteran callers." },

  { section: "STATE-AGY", title: "NYS Office of Addiction Services and Supports (OASAS)",
    cat: "substance-recovery", sub: "Recovery Support Services",
    city: "Albany", website_url: "https://oasas.ny.gov/",
    source_name: "NYS OASAS", source_type: "state_government",
    phone: "877-846-7369", address: "1450 Western Avenue, Albany, NY 12203", zip: "12203",
    desc: "NYS Office of Addiction Services and Supports (OASAS) — single-state authority for substance use disorder. Licenses 1,500+ NY treatment providers, operates the OASAS HOPEline (877-846-7369) for 24/7 SUD referral, and funds the NY Recovery & Reentry programs that serve justice-involved veterans without separate eligibility." },

  { section: "STATE-AGY", title: "NYS Department of Health",
    cat: "insurance", sub: "Health Insurance",
    city: "Albany", website_url: "https://www.health.ny.gov/",
    source_name: "NYS DOH", source_type: "state_government",
    phone: "866-881-2809", address: "Empire State Plaza, Corning Tower, Albany, NY 12237", zip: "12237",
    desc: "NYS Department of Health — administers Medicaid, EPIC senior prescription assistance, NY State of Health insurance marketplace, and the State Veterans' Homes (Batavia, Oxford, St. Albans). Veterans not categorically excluded from Medicaid; veteran-specific Long-Term-Care navigation via NY Connects." },

  { section: "STATE-AGY", title: "NYS Office of Temporary and Disability Assistance (OTDA)",
    cat: "food-assistance", sub: "SNAP Assistance",
    city: "Albany", website_url: "https://otda.ny.gov/",
    source_name: "NYS OTDA", source_type: "state_government",
    phone: "800-342-3009", address: "40 N Pearl Street, Albany, NY 12243", zip: "12243",
    desc: "NYS Office of Temporary and Disability Assistance — administers SNAP, TANF, Safety Net Assistance, HEAP energy assistance, child-support enforcement, and Disability Determinations. Veterans not categorically excluded; mybenefits.ny.gov is the consolidated benefits portal." },

  { section: "STATE-AGY", title: "NYS Department of Financial Services (DFS)",
    cat: "financial", sub: "Banking / Lending Support",
    city: "New York", website_url: "https://www.dfs.ny.gov/",
    source_name: "NYS DFS", source_type: "state_government",
    phone: "800-342-3736", address: "One State Street, New York, NY 10004", zip: "10004",
    desc: "NYS Department of Financial Services — regulates NY-chartered banks, credit unions, mortgage servicers, and insurance carriers. Consumer assistance unit handles complaints; investigates predatory lending and VA-pension-poaching scams targeting veterans. SCRA enforcement on NY mortgages." },

  { section: "STATE-AGY", title: "NYS Education Department — Veterans Education",
    cat: "education", sub: "Veteran Student Services",
    city: "Albany", website_url: "https://www.acces.nysed.gov/",
    source_name: "NYSED ACCES", source_type: "state_government",
    phone: "518-474-3719", address: "89 Washington Avenue, Albany, NY 12234", zip: "12234",
    desc: "NYSED ACCES — Veterans Education — State Approving Agency for GI Bill in NY. Approves NY institutions for VA education benefits, oversees state-approved schools, articulates military credit, hosts Yellow Ribbon list for NY participating colleges, and certifies WAVE (Workforce Approved Veterans Education) programs." },

  { section: "STATE-AGY", title: "NYS Homes & Community Renewal (HCR)",
    cat: "housing", sub: "Rental Assistance",
    city: "New York", website_url: "https://hcr.ny.gov/",
    source_name: "NYS HCR", source_type: "state_government",
    phone: "866-275-3427", address: "641 Lexington Avenue, New York, NY 10022", zip: "10022",
    desc: "NYS Homes & Community Renewal — umbrella state housing agency. Administers Section 8 Housing Choice Voucher (HCR-administered counties), public housing oversight, NY State of Mind Mortgage Loans, SONYMA homebuyer programs, and the NYS Homeless Housing Assistance Program. SCRA / VA loan coordination for NY veteran homebuyers." },

  { section: "STATE-AGY", title: "NYS Office for the Prevention of Domestic Violence (OPDV)",
    cat: "crisis-help", sub: "Domestic Violence / Safety",
    city: "Albany", website_url: "https://opdv.ny.gov/",
    source_name: "NYS OPDV", source_type: "state_government",
    phone: "518-457-5800", address: "80 South Swan Street, Albany, NY 12210", zip: "12210",
    desc: "NYS Office for the Prevention of Domestic Violence — cabinet-level agency coordinating NY's DV response. Funds 100+ NY DV programs, runs the NYS DV/Sexual Violence Hotline (800-942-6906), military/veteran family advocacy, judicial training, and the SAVE Task Force." },

  // ============== G — STATEWIDE HOTLINES & HELPLINES (4) ==============
  { section: "HELPLINE", title: "NY 211",
    cat: "crisis-help", sub: "Suicide Prevention",
    city: "Albany", website_url: "https://www.211nys.org/",
    source_name: "United Way of NYS", source_type: "nonprofit",
    phone: "211", address: "Statewide; United Way of NYS admin, Albany, NY 12207", zip: "12207",
    desc: "NY 211 — United Way-coordinated 24/7 statewide referral helpline; covers all 62 NY counties via 8 regional 211 hubs (NYC, Long Island, Mid-Hudson, Capital, Mohawk Valley, Central, Western, Southern Tier). Food/shelter/utility/mental-health/veteran referrals; live-chat at 211nys.org." },

  { section: "HELPLINE", title: "988 Suicide & Crisis Lifeline NY State Network",
    cat: "crisis-help", sub: "Suicide Prevention",
    city: "Albany", website_url: "https://omh.ny.gov/omhweb/crisis/988.html",
    source_name: "NYS OMH", source_type: "state_government",
    phone: "988", address: "44 Holland Avenue, Albany, NY 12229", zip: "12229",
    desc: "988 Suicide & Crisis Lifeline — NY State coordinated by NYS OMH. Free 24/7 confidential call/text/chat for anyone in suicidal crisis or emotional distress. Routes NY callers to one of 13 in-state Lifeline crisis centers; warm-handoff to Veterans Crisis Line (988 Press 1) for veteran callers." },

  { section: "HELPLINE", title: "NYS Domestic & Sexual Violence Hotline",
    cat: "crisis-help", sub: "Domestic Violence / Safety",
    city: "Albany", website_url: "https://opdv.ny.gov/",
    source_name: "NYS OPDV", source_type: "state_government",
    phone: "800-942-6906", address: "80 South Swan Street, Albany, NY 12210", zip: "12210",
    desc: "NYS Domestic & Sexual Violence Hotline — 24/7 confidential statewide hotline (800-942-6906; 711 deaf/HOH; text 'Got A Dog?' to 844-997-2121). Operated by OPDV; routes survivors to nearest of 100+ NY DV shelters/programs; multilingual & TTY support; military/veteran family advocacy." },

  { section: "HELPLINE", title: "NY State Coalition Against Domestic Violence (NYSCADV)",
    cat: "crisis-help", sub: "Domestic Violence / Safety",
    city: "Albany", website_url: "https://www.nyscadv.org/",
    source_name: "NYSCADV", source_type: "nonprofit",
    phone: "518-482-5464", address: "350 New Scotland Avenue, Albany, NY 12208", zip: "12208",
    desc: "NY State Coalition Against Domestic Violence — federation of NY DV programs serving all 62 counties. Technical assistance to member shelters, statewide policy advocacy, military/veteran-family training, and DV-survivor housing-stability initiatives." },

  // ============== H — STATEWIDE VSO HQs (3) ==============
  { section: "VSO", title: "American Legion Department of New York",
    cat: "community-support", sub: "Veteran Service Organizations",
    city: "Albany", website_url: "https://www.legion.org/posts",
    source_name: "American Legion", source_type: "nonprofit",
    phone: "518-463-2215", address: "112 State Street, Suite 1300, Albany, NY 12207", zip: "12207",
    desc: "American Legion Department of New York — state HQ for ~700 American Legion posts across NY. VA-accredited service officers file VA disability claims and PACT Act claims at no cost; oversees American Legion Boys State NY, Junior Shooting Sports, Oratorical Contest, and the NY Department's homeless veteran outreach. National post-locator: legion.org/posts." },

  { section: "VSO", title: "VFW Department of New York",
    cat: "community-support", sub: "Veteran Service Organizations",
    city: "Albany", website_url: "https://vfwny.com/",
    source_name: "VFW", source_type: "nonprofit",
    phone: "518-463-1709", address: "95 State Street, Albany, NY 12207", zip: "12207",
    desc: "Veterans of Foreign Wars Department of New York — state HQ for ~400 VFW posts across NY. VA-accredited service officers file VA disability claims at no cost; runs Voice of Democracy and Patriot's Pen youth programs, Operation Uplink calling cards, Military Assistance Program (MAP) emergency grants for NY veterans." },

  { section: "VSO", title: "DAV Department of New York",
    cat: "community-support", sub: "Veteran Service Organizations",
    city: "Albany", website_url: "https://www.dav.org/find-your-local-office/",
    source_name: "Disabled American Veterans", source_type: "nonprofit",
    phone: "518-449-8836", address: "152 Washington Avenue, Albany, NY 12210", zip: "12210",
    desc: "Disabled American Veterans Department of New York — state HQ for ~120 DAV chapters across NY. National Service Officers (NSOs) at every NY VAMC provide free VA disability claims help; DAV Transportation Network shuttles veterans to VA medical appointments; statewide DAV vans driven by volunteer veterans. Find local offices via dav.org locator." },

  // ============== I — STATEWIDE VETERAN-SERVING NONPROFITS HQ IN NY (6) ==============
  { section: "NONPROFIT", title: "Tunnel to Towers Foundation",
    cat: "community-support", sub: "Veteran Nonprofit Organizations",
    city: "Staten Island", website_url: "https://t2t.org/",
    source_name: "Tunnel to Towers Foundation", source_type: "nonprofit",
    phone: "718-987-1931", address: "2361 Hylan Boulevard, Staten Island, NY 10306", zip: "10306",
    desc: "Tunnel to Towers Foundation — national veteran-services nonprofit HQ on Staten Island honoring FDNY firefighter Stephen Siller (KIA 9/11). Smart Home program (mortgage-free homes for catastrophically injured veterans), Gold Star/Fallen First Responder mortgage payoff, Homeless Veterans Program, Building for America's Bravest." },

  { section: "NONPROFIT", title: "Bob Woodruff Foundation",
    cat: "community-support", sub: "Veteran Nonprofit Organizations",
    city: "New York", website_url: "https://bobwoodrufffoundation.org/",
    source_name: "Bob Woodruff Foundation", source_type: "nonprofit",
    address: "1350 Broadway, Suite 605, New York, NY 10018", zip: "10018",
    desc: "Bob Woodruff Foundation — NYC-HQ national grantmaking nonprofit funding evidence-based programs for post-9/11 veterans, service members, and their families. Issues grants to local NY orgs for mental health, employment, housing stability, and rehabilitation; convenes the Got Your 6 standard for veteran-serving nonprofits." },

  { section: "NONPROFIT", title: "The Headstrong Project",
    cat: "mental-health", sub: "PTSD & Trauma Support",
    city: "New York", website_url: "https://getheadstrong.org/",
    source_name: "The Headstrong Project", source_type: "nonprofit",
    phone: "646-470-9335",
    desc: "The Headstrong Project — NYC-HQ veterans mental-health nonprofit providing free, confidential, stigma-free, bureaucracy-free PTSD/TBI/MST treatment for post-9/11 veterans and family. In-network with no co-pay/no-eligibility-test; 30+ clinic sites and telehealth nationally; Cohen Veterans Network partner." },

  { section: "NONPROFIT", title: "IAVA New York Headquarters",
    cat: "community-support", sub: "Veteran Service Organizations",
    city: "New York", website_url: "https://iava.org/",
    source_name: "IAVA", source_type: "nonprofit",
    phone: "212-982-9699", address: "114 W 26th Street, 11th Floor, New York, NY 10001", zip: "10001",
    desc: "Iraq and Afghanistan Veterans of America — NYC-HQ national VSO for post-9/11 veterans. Quick Reaction Force one-on-one veteran case-management (housing, MH, claims, VA navigation), policy advocacy (PACT Act, MST, Combat-Veteran extended VA enrollment), Storm The Hill, Women Veterans Network." },

  { section: "NONPROFIT", title: "Volunteers of America-Greater New York",
    cat: "community-support", sub: "Veteran Nonprofit Organizations",
    city: "New York", website_url: "https://www.voa-gny.org/",
    source_name: "Volunteers of America Greater NY", source_type: "nonprofit",
    phone: "212-873-2600", address: "135 W 50th Street, 9th Floor, New York, NY 10020", zip: "10020",
    desc: "Volunteers of America-Greater NY — NYC-HQ social-services nonprofit operating veteran transitional housing (Hope Haven Bronx, Beacon House Manhattan), HUD-VASH and SSVF case-management for NYC veterans, behavioral-health services, and reentry programs serving justice-involved NY veterans." },

  { section: "NONPROFIT", title: "Salvation Army USA Eastern Territory HQ",
    cat: "community-support", sub: "Veteran Nonprofit Organizations",
    city: "West Nyack", website_url: "https://easternusa.salvationarmy.org/",
    source_name: "The Salvation Army Eastern Territory", source_type: "nonprofit",
    phone: "845-620-7200", address: "440 West Nyack Road, West Nyack, NY 10994", zip: "10994",
    desc: "Salvation Army USA Eastern Territory HQ (Rockland County) — coordinates Salvation Army services across 15 northeastern states incl all of NY. NY corps centers offer veteran-eligible emergency utility/rent assistance, food pantries, transitional shelter, clothing, holiday assistance, and disaster services." },

  // ============== J — STATEWIDE FOOD / HOUSING / WORKFORCE SYSTEMS (5) ==============
  { section: "FOOD-HOUS-WORK", title: "Feeding New York State",
    cat: "food-assistance", sub: "Food Banks",
    city: "Albany", website_url: "https://feedingnys.org/",
    source_name: "Feeding New York State", source_type: "nonprofit",
    phone: "518-694-3624", address: "194 Washington Avenue, Suite 720, Albany, NY 12210", zip: "12210",
    desc: "Feeding New York State — statewide association of NY's 10 regional food banks (Food Bank of CNY, Food Bank for NYC, Food Bank of WNY, Long Island Cares, Regional Food Bank of NENY, Food Bank of the Southern Tier, Food Bank of the Hudson Valley, Foodlink Rochester, Food Bank Association of NYS, City Harvest). Combined 280+ million meals/year to 3,000+ NY pantry partners." },

  { section: "FOOD-HOUS-WORK", title: "Coalition for the Homeless",
    cat: "housing", sub: "Homeless Veteran Services",
    city: "New York", website_url: "https://www.coalitionforthehomeless.org/",
    source_name: "Coalition for the Homeless", source_type: "nonprofit",
    phone: "212-776-2000", address: "129 Fulton Street, New York, NY 10038", zip: "10038",
    desc: "Coalition for the Homeless — oldest US homeless-rights org; NYC-HQ direct-services + advocacy. Crisis Intervention Program (housing/benefits/case-management), Bound for Success after-school for homeless kids, Camp Homeward Bound, women's shelter operations. Veterans not categorically excluded; coordinates with NYC HUD-VASH." },

  { section: "FOOD-HOUS-WORK", title: "Housing Works",
    cat: "housing", sub: "Homeless Veteran Services",
    city: "Brooklyn", website_url: "https://www.housingworks.org/",
    source_name: "Housing Works", source_type: "nonprofit",
    phone: "347-473-7400", address: "57 Willoughby Street, Brooklyn, NY 11201", zip: "11201",
    desc: "Housing Works — NYC-HQ healing-community nonprofit serving people impacted by HIV, homelessness, mental health, and SUD. Housing placement, primary medical, behavioral health, job training, legal services, and 12+ NYC thrift shops funding the mission. Veterans not categorically excluded; coordinates with VA NY Harbor for HIV-positive veterans." },

  { section: "FOOD-HOUS-WORK", title: "NYS Career Centers (Statewide Workforce System)",
    cat: "employment", sub: "DVOP / Workforce Programs",
    city: "Albany", website_url: "https://dol.ny.gov/career-centers",
    source_name: "NYS DOL", source_type: "state_government",
    phone: "888-469-7365", address: "Statewide; NYS DOL admin Bldg 12, Harriman State Office Campus, Albany, NY 12240", zip: "12240",
    desc: "NYS Career Centers — statewide workforce system; 90+ American Job Center / NYS Career Center locations across NY. DVOP (Disabled Veterans' Outreach Program) and LVER (Local Veterans' Employment Representative) staff at each center serve NY veterans first under USDOL Priority of Service rule." },

  { section: "FOOD-HOUS-WORK", title: "Empire State Development — Service-Disabled Veteran-Owned Business (SDVOB) Certification",
    cat: "employment", sub: "Entrepreneurship & Small Business Support",
    city: "Albany", website_url: "https://esd.ny.gov/",
    source_name: "Empire State Development", source_type: "state_government",
    phone: "518-292-5250", address: "625 Broadway, Albany, NY 12245", zip: "12245",
    desc: "Empire State Development SDVOB Certification — NY's Service-Disabled Veteran-Owned Business certification (2014 Veterans Business Act). 6% NY state contracting goal for SDVOBs; certified businesses access $200B+ in NYS procurement. Free certification application; NYS DVS provides supporting documentation." },

  // ============== K — STATEWIDE LEGAL PILLARS (6) ==============
  { section: "LEGAL", title: "Legal Services NYC",
    cat: "legal", sub: "Legal Aid Services",
    city: "New York", website_url: "https://www.legalservicesnyc.org/",
    source_name: "Legal Services NYC", source_type: "nonprofit",
    phone: "917-661-4500", address: "40 Worth Street, Suite 606, New York, NY 10013", zip: "10013",
    desc: "Legal Services NYC — largest civil legal aid provider in the country; NYC's federally funded LSC grantee. Veterans Justice Project handles VA benefits appeals, discharge upgrades, housing/eviction defense, family law, and consumer-debt for NYC veterans at no cost; income-eligibility test." },

  { section: "LEGAL", title: "Empire Justice Center",
    cat: "legal", sub: "Legal Aid Services",
    city: "Rochester", website_url: "https://empirejustice.org/",
    source_name: "Empire Justice Center", source_type: "nonprofit",
    phone: "585-454-4060", address: "One West Main Street, Suite 200, Rochester, NY 14614", zip: "14614",
    desc: "Empire Justice Center — statewide legal-aid back-up center supporting NY's regional legal-aid programs and direct services in Rochester, Albany, Yonkers, Long Island. Public benefits, housing, immigration, consumer, disability rights, and Veterans Justice Initiative for upstate NY veterans." },

  { section: "LEGAL", title: "NY State Bar Association — Committee on Veterans",
    cat: "legal", sub: "Pro Bono Legal Services",
    city: "Albany", website_url: "https://nysba.org/committees/committee-on-veterans/",
    source_name: "NYSBA", source_type: "nonprofit",
    phone: "518-463-3200", address: "One Elk Street, Albany, NY 12207", zip: "12207",
    desc: "NY State Bar Association — Committee on Veterans — coordinates pro-bono legal volunteer matching across NY. Annual Veterans Day pro bono legal clinics, accreditation training for NY attorneys to handle VA claims, Lawyer Referral Service that prioritizes veteran-experienced counsel; partners with NY Veterans Defense Program." },

  { section: "LEGAL", title: "Volunteers of Legal Service (VOLS) — Veterans Initiative",
    cat: "legal", sub: "Pro Bono Legal Services",
    city: "New York", website_url: "https://www.volsprobono.org/our-projects/veterans-initiative/",
    source_name: "Volunteers of Legal Service", source_type: "nonprofit",
    phone: "212-966-4400", address: "281 Park Avenue South, New York, NY 10010", zip: "10010",
    desc: "Volunteers of Legal Service Veterans Initiative — NYC-HQ pro-bono legal nonprofit providing free monthly NYC clinics for low-income NYC veterans. Discharge upgrades, VA disability/pension claims, family law, wills/POAs, consumer debt; partners with VA NY Harbor and NYC Vet Centers for client referral." },

  { section: "LEGAL", title: "NYLAG — LegalHealth Veterans Practice",
    cat: "legal", sub: "Veterans Legal Clinics",
    city: "New York", website_url: "https://nylag.org/legalhealth/veterans/",
    source_name: "NY Legal Assistance Group", source_type: "nonprofit",
    phone: "212-613-5000", address: "100 Pearl Street, 19th Floor, New York, NY 10004", zip: "10004",
    desc: "NY Legal Assistance Group (NYLAG) Veterans Practice — NYC-HQ free civil legal services for low-income NYC veterans. Public benefits (VA, SSI, SSDI, SNAP, Medicaid), housing/eviction, consumer-debt, discharge upgrades, family law; mobile legal-help vans visit NYC VAMC and Vet Centers." },

  { section: "LEGAL", title: "NYS Veterans Treatment Courts",
    cat: "legal", sub: "Veterans Legal Clinics",
    city: "New York", website_url: "https://www.nycourts.gov/courts/problem-solving/vets/",
    source_name: "NYS Office of Court Administration", source_type: "state_government",
    phone: "518-285-8000", address: "25 Beaver Street, New York, NY 10004", zip: "10004",
    desc: "NYS Veterans Treatment Courts — 30+ NY-county problem-solving courts diverting veteran defendants from incarceration into treatment. Eligibility: veteran with SUD/MH/PTSD/TBI nexus to charged offense; mentor program pairs each participant with a veteran mentor; partners with NYS DVS, VA Veterans Justice Outreach, NY Veterans Defense Program." },

  // ============== L — COUNTY VSO DIRECTORY (1) ==============
  { section: "COUNTY-DIR", title: "NY DVS — County Veterans Service Agency Directory",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    city: "Albany", website_url: "https://veterans.ny.gov/",
    source_name: "NYS DVS", source_type: "state_government",
    phone: "888-838-7697", address: "2 Empire State Plaza, Albany, NY 12223", zip: "12223",
    desc: "NYS DVS County Veterans Service Agency Directory — official locator for NY's county Veterans Service Agencies (independent of DVS state staff). Each NY county designates a County Veterans Service Officer who files VA claims, NY state-benefit applications, Blind Annuity, Gold Star applications, and DVS coordination." },
];

(async () => {
  await runSeed(ROWS, {
    state: "NY",
    commit: COMMIT,
    allowBrokenUrls: ALLOW_BROKEN_URLS,
    scriptName: "seed-ny-p1 (NY Phase 1 — State Foundation)",
    sectionLabels: {
      "DVS": "NYS DVS HQ",
      "DVS-PROG": "DVS Programs",
      "VET-HOME": "NYS Vet Homes",
      "VAMC": "VA Med Centers",
      "NATL-CEM": "Natl Cemeteries",
      "STATE-AGY": "NYS Agencies",
      "HELPLINE": "Helplines",
      "VSO": "Statewide VSOs",
      "NONPROFIT": "NY Nonprofits",
      "FOOD-HOUS-WORK": "Food/Hous/Work",
      "LEGAL": "Legal Pillars",
      "COUNTY-DIR": "County Directory",
    },
  });
})();
