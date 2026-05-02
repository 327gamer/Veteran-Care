/**
 * VIRGINIA — PHASE 1 (Florida-pattern foundation rollout, ~130 rows)
 *
 * REPLACES the prior PA-pattern VA Phase 1 (40 rows). Founder request 2026-05-02:
 *   "We do NOT want to use the Pennsylvania (PA) Phase 1 pattern.
 *    Use the Florida (FL) canonical engine pattern for ALL phases moving forward."
 *
 * FL Wave 1 reference: scripts/seed-fl-wave1.ts (139 rows, sections A-M).
 *
 * Sections — exact mirror of FL Wave 1 layout adapted to Virginia geography:
 *   A  Virginia DVS + State Veterans Care Centers + DVS programs + War Memorial
 *   B  VA Medical Centers + flagship CBOCs + Roanoke VA Regional Office
 *   C  Vet Centers — Virginia readjustment counseling network
 *   D  Northern Virginia — bases + NoVA county VSOs + NoVA nonprofits
 *   E  Hampton Roads — 6 bases + 6 city DVS offices + regional support
 *   F  Richmond / Tri-Cities — Fort Gregg-Adams + city/county VSOs + Richmond NPs
 *   G  Roanoke / Southwest Virginia — county VSOs + regional NPs
 *   H  Charlottesville / Piedmont — UVA + county VSOs + food bank
 *   I  Shenandoah Valley — Winchester/Harrisonburg/Staunton + JMU
 *   J  Fredericksburg / Northern Neck — county VSOs + hospital + food bank
 *   K  Lynchburg / Southside — Liberty + Danville + South Hill DVS offices
 *   L  Crisis & statewide hotlines (VA-tagged so they appear in VA search)
 *   M  Statewide nonprofits, VSOs, state agencies, food / legal / community
 *
 * Pre-commit gates (engine): URL liveness (HEAD/GET) + ZIP-3 (VA: 201, 220-246).
 *
 * REPLACE-NOT-APPEND: when --commit is passed, deletes all rows where state='VA'
 * before re-seeding (idempotent). Founder explicit instruction this turn.
 *
 * Run:
 *   tsx scripts/seed-va-p1.ts                                 # dry-run
 *   tsx scripts/seed-va-p1.ts --commit --allow-broken-urls    # write
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";
import { supabaseAdmin } from "../server/supabase";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");
const ALLOW_ZIP_BLEED = process.argv.includes("--allow-zip-bleed");

const ROWS: SeedRow[] = [
  // ===========================================================================
  // A. Virginia DVS + State Veterans Care Centers + DVS programs + War Memorial
  // ===========================================================================
  { section: "A", title: "Virginia Department of Veterans Services (DVS)",
    cat: "va-benefits", sub: "VA Enrollment & General Benefits Navigation",
    desc: "Cabinet agency serving Virginia's ~700,000 veterans. Operates 38 benefits offices statewide (claims/appeals), the Virginia Veteran and Family Support Program (peer mental-health navigation), Virginia Values Veterans (V3) employer certification, three state Veterans Care Centers, and the Virginia War Memorial.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "804-786-0286", address: "101 N 14th St, 17th Floor", city: "Richmond", zip: "23219",
    latitude: 37.5407, longitude: -77.4360, source_name: "Virginia DVS" },

  { section: "A", title: "Virginia Veteran and Family Support (VVFS)",
    cat: "mental-health", sub: "Peer Support",
    desc: "DVS statewide peer-navigator network connecting veterans, members of the Virginia National Guard/Reserves, and families to behavioral-health, rehabilitative, and supportive services. Replaces the legacy Virginia Wounded Warrior Program; serves all eras with priority on PTSD, TBI, and suicide-prevention warm-handoffs.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "804-371-6325", address: "101 N 14th St, 17th Floor", city: "Richmond", zip: "23219",
    source_name: "Virginia DVS — VVFS" },

  { section: "A", title: "Virginia Values Veterans (V3) Program",
    cat: "employment", sub: "Veteran-Friendly Employers",
    desc: "DVS-administered employer certification + training program teaching Virginia companies how to recruit, hire, and retain veterans. 1,000+ certified V3 employers statewide; veterans can search certified-employer directory and access free V3 hiring events.",
    website_url: "https://www.dvsv3.com/",
    phone: "804-786-0286", address: "101 N 14th St, 17th Floor", city: "Richmond", zip: "23219",
    source_name: "Virginia DVS — V3" },

  { section: "A", title: "Virginia Military Survivors and Dependents Education Program (VMSDEP)",
    cat: "education", sub: "Tuition Assistance",
    desc: "Virginia tuition-and-fees waiver (and stipend) at any state-supported Virginia college/university for spouses and children (age 16-29) of veterans rated 90%+ permanent service-connected disabled by VA, KIA, MIA, or POW. Administered by DVS Education team; up to 36 academic months.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "804-786-0286", address: "101 N 14th St, 17th Floor", city: "Richmond", zip: "23219",
    source_name: "Virginia DVS" },

  { section: "A", title: "Virginia Transition Assistance Program (VTAP)",
    cat: "employment", sub: "Job Placement Programs",
    desc: "DVS career-coaching service for transitioning service members, recently separated veterans, and military spouses. Resume review, interview prep, statewide employer connections, and warm handoffs to V3 certified employers. No fee.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "804-786-0286", address: "101 N 14th St, 17th Floor", city: "Richmond", zip: "23219",
    source_name: "Virginia DVS — VTAP" },

  { section: "A", title: "Virginia Veterans Services Foundation (VVSF)",
    cat: "financial", sub: "Veteran Relief Funds",
    desc: "Public-private 501(c)(3) raising funds for the Virginia Veterans Care Centers and Virginia War Memorial; administers Veterans Care Center resident-needs grants and emergency-relief micro-grants for indigent Virginia veterans referred by DVS benefits offices.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "804-786-0286", address: "101 N 14th St, 17th Floor", city: "Richmond", zip: "23219",
    source_name: "Virginia DVS — VVSF" },

  { section: "A", title: "Sitter & Barfoot Veterans Care Center",
    cat: "end-of-life-services", sub: "Assisted Living & Nursing Homes",
    desc: "DVS-operated 160-bed long-term-care + 40-bed dementia care state veterans home on the McGuire VAMC campus. Skilled nursing, hospice, and assisted living for honorably discharged Virginia veterans. Per-diem subsidized by VA.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "804-371-8000", address: "1601 Broad Rock Blvd", city: "Richmond", zip: "23224",
    latitude: 37.4894, longitude: -77.4575, source_name: "Virginia DVS" },

  { section: "A", title: "Virginia Veterans Care Center (Roanoke)",
    cat: "end-of-life-services", sub: "Assisted Living & Nursing Homes",
    desc: "DVS-operated 240-bed state veterans home in Roanoke; skilled nursing, dementia, and domiciliary (assisted living) care for honorably discharged Virginia veterans. Per-diem subsidized by VA; serves western Virginia.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "540-982-2860", address: "4550 Shenandoah Ave NW", city: "Roanoke", zip: "24017",
    latitude: 37.2890, longitude: -79.9650, source_name: "Virginia DVS" },

  { section: "A", title: "Jones & Cabacoy Veterans Care Center",
    cat: "end-of-life-services", sub: "Assisted Living & Nursing Homes",
    desc: "DVS-operated 128-bed skilled-nursing + 32-bed dementia state veterans home in Virginia Beach (opened 2024); serves Hampton Roads honorably discharged veterans. Per-diem subsidized by VA; named for two Virginia Medal of Honor recipients.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "757-961-0500", address: "5550 Old Providence Rd", city: "Virginia Beach", zip: "23464",
    source_name: "Virginia DVS" },

  { section: "A", title: "Virginia War Memorial",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "DVS-overseen state memorial honoring Virginia's nearly 12,000 service members killed since WWII; Shrine of Memory walls, Paul & Phyllis Galanti Education Center, Veterans Art Studio, and free oral-history library accessible to Virginia veterans, families, students, and researchers.",
    website_url: "https://vawarmemorial.org/",
    phone: "804-786-2060", address: "621 S Belvidere St", city: "Richmond", zip: "23220",
    latitude: 37.5310, longitude: -77.4458, source_name: "Virginia War Memorial Foundation" },

  // ===========================================================================
  // B. VA Medical Centers + CBOCs + Roanoke VA Regional Office
  // ===========================================================================
  { section: "B", title: "Hunter Holmes McGuire VA Medical Center (Richmond)",
    cat: "healthcare", sub: "VA Medical Centers",
    desc: "VA's flagship Virginia tertiary-care hospital and Polytrauma Rehabilitation Center (one of only 5 in the U.S.); 416 beds; serves central VA, southside VA, and parts of NC. Spinal-cord injury center, transplant program, women's health, and 11 community-based outpatient clinics across central VA.",
    website_url: "https://www.va.gov/richmond-health-care/",
    phone: "804-675-5000", address: "1201 Broad Rock Blvd", city: "Richmond", zip: "23249",
    latitude: 37.4894, longitude: -77.4571, source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Hampton VA Medical Center",
    cat: "healthcare", sub: "VA Medical Centers",
    desc: "VA Medical Center serving Hampton Roads, Eastern Shore, and northeastern NC; 468 beds; full-service tertiary care including PTSD residential program, Polytrauma Network Site, and women's clinic. Affiliated CBOCs in Virginia Beach, Chesapeake, and Albemarle (NC).",
    website_url: "https://www.va.gov/hampton-health-care/",
    phone: "757-722-9961", address: "100 Emancipation Dr", city: "Hampton", zip: "23667",
    latitude: 37.0316, longitude: -76.3452, source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Salem VA Medical Center",
    cat: "healthcare", sub: "VA Medical Centers",
    desc: "VA Medical Center serving Western Virginia, southern WV, and Appalachian NC; 162 beds; primary care, mental health residential rehab, polytrauma support clinic, and CBOCs in Danville, Lynchburg, Tazewell, Staunton, and Wytheville.",
    website_url: "https://www.va.gov/salem-health-care/",
    phone: "540-982-2463", address: "1970 Roanoke Blvd", city: "Salem", zip: "24153",
    latitude: 37.2862, longitude: -80.0517, source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Charlottesville VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Charlottesville Community Based Outpatient Clinic — McGuire VAMC affiliate offering primary care, mental health, women's health, telehealth, and lab/pharmacy services to Albemarle/Charlottesville-area veterans.",
    website_url: "https://www.va.gov/richmond-health-care/locations/",
    phone: "434-293-3890", address: "590 Peter Jefferson Pkwy, Suite 250", city: "Charlottesville", zip: "22911",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Fredericksburg VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Fredericksburg Community Based Outpatient Clinic — McGuire VAMC affiliate offering primary care, mental health, women's health, and telehealth to veterans in the Fredericksburg/Stafford/Spotsylvania region.",
    website_url: "https://www.va.gov/richmond-health-care/locations/",
    phone: "540-370-4468", address: "10401 Spotsylvania Ave, Suite 300", city: "Fredericksburg", zip: "22408",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Emporia VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Emporia Community Based Outpatient Clinic — McGuire VAMC affiliate serving Greensville/Sussex-area veterans with primary care, mental health, telehealth, and basic specialty referrals.",
    website_url: "https://www.va.gov/richmond-health-care/locations/",
    phone: "434-348-1500", address: "1746 East Atlantic St", city: "Emporia", zip: "23847",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "South Hill VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "South Hill Community Based Outpatient Clinic — McGuire VAMC affiliate serving Mecklenburg/Brunswick-area veterans with primary care, mental health, and telehealth services.",
    website_url: "https://www.va.gov/richmond-health-care/locations/",
    phone: "434-447-4070", address: "315 N Mecklenburg Ave", city: "South Hill", zip: "23970",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Chesapeake VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Chesapeake Community Based Outpatient Clinic — Hampton VAMC affiliate offering primary care, mental health, women's health, and telehealth for Chesapeake/Suffolk-area veterans.",
    website_url: "https://www.va.gov/hampton-health-care/locations/",
    phone: "757-722-9961", address: "1987 S Military Hwy", city: "Chesapeake", zip: "23320",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Virginia Beach VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Virginia Beach Community Based Outpatient Clinic — Hampton VAMC affiliate offering primary care, mental health, women's health, and telehealth for Virginia Beach veterans.",
    website_url: "https://www.va.gov/hampton-health-care/locations/",
    phone: "757-722-9961", address: "244 Clearfield Ave", city: "Virginia Beach", zip: "23462",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Danville VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Danville Community Based Outpatient Clinic — Salem VAMC affiliate offering primary care, mental health, telehealth, and women's health to southside Virginia veterans.",
    website_url: "https://www.va.gov/salem-health-care/locations/",
    phone: "434-710-4140", address: "705 Piney Forest Rd", city: "Danville", zip: "24540",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Lynchburg VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Lynchburg Community Based Outpatient Clinic — Salem VAMC affiliate offering primary care, mental health, telehealth, and women's health to central Virginia veterans.",
    website_url: "https://www.va.gov/salem-health-care/locations/",
    phone: "434-316-5000", address: "1600 Lakeside Dr", city: "Lynchburg", zip: "24501",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Staunton VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Staunton Community Based Outpatient Clinic — Salem VAMC affiliate offering primary care, mental health, telehealth, and women's health to Shenandoah Valley veterans.",
    website_url: "https://www.va.gov/salem-health-care/locations/",
    phone: "540-886-5777", address: "102 Lacy B King Way", city: "Staunton", zip: "24401",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Wytheville VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Wytheville Community Based Outpatient Clinic — Salem VAMC affiliate offering primary care, mental health, and telehealth to far-southwest Virginia veterans.",
    website_url: "https://www.va.gov/salem-health-care/locations/",
    phone: "276-223-5400", address: "165 Peppers Ferry Rd", city: "Wytheville", zip: "24382",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Tazewell VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Tazewell Community Based Outpatient Clinic — Salem VAMC affiliate offering primary care, mental health, and telehealth to coal-country Virginia veterans.",
    website_url: "https://www.va.gov/salem-health-care/locations/",
    phone: "276-988-8860", address: "121 Ben Bolt Ave", city: "Tazewell", zip: "24651",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Roanoke VA Regional Office",
    cat: "va-benefits", sub: "VA Enrollment & General Benefits Navigation",
    desc: "VBA regional office adjudicating disability compensation, pension, education (GI Bill), VR&E, and home-loan benefits for all veterans residing in Virginia. Public contact center, in-person walk-in claims help, accredited representatives on-site.",
    website_url: "https://www.benefits.va.gov/roanoke/",
    phone: "800-827-1000", address: "116 N Jefferson St", city: "Roanoke", zip: "24016",
    latitude: 37.2723, longitude: -79.9414, source_name: "U.S. Department of Veterans Affairs — VBA" },

  // ===========================================================================
  // C. Vet Centers — Virginia readjustment counseling network
  // ===========================================================================
  { section: "C", title: "Alexandria Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Service community storefront serving Northern Virginia. Free, confidential individual/group counseling for combat veterans, MST survivors, and bereaved families; no VA enrollment required.",
    website_url: "https://www.va.gov/find-locations/facility/vc_0408V",
    phone: "703-549-4922", address: "6940 South Kings Hwy, Suite 207", city: "Alexandria", zip: "22310",
    source_name: "U.S. Department of Veterans Affairs — RCS" },

  { section: "C", title: "Springfield Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Service community storefront serving Fairfax County. Free, confidential individual/group counseling for combat veterans, MST survivors, and bereaved families.",
    website_url: "https://www.va.gov/find-locations/?facilityType=vet_center&state=VA",
    phone: "571-348-1765", address: "7027 Old Keene Mill Rd", city: "Springfield", zip: "22150",
    source_name: "U.S. Department of Veterans Affairs — RCS" },

  { section: "C", title: "Norfolk Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Service community storefront serving Hampton Roads. Free, confidential individual/group counseling for combat veterans, MST survivors, and bereaved families.",
    website_url: "https://www.va.gov/find-locations/?facilityType=vet_center&state=VA",
    phone: "757-623-7584", address: "1711 Church St, Suites A&B", city: "Norfolk", zip: "23504",
    source_name: "U.S. Department of Veterans Affairs — RCS" },

  { section: "C", title: "Virginia Beach Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Service community storefront serving the Virginia Beach community. Free, confidential individual/group counseling for combat veterans and MST survivors.",
    website_url: "https://www.va.gov/find-locations/?facilityType=vet_center&state=VA",
    phone: "757-248-3665", address: "324 Southport Cir, Suite 102", city: "Virginia Beach", zip: "23452",
    source_name: "U.S. Department of Veterans Affairs — RCS" },

  { section: "C", title: "Richmond Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Service community storefront serving central Virginia. Free, confidential individual/group counseling for combat veterans, MST survivors, and bereaved families.",
    website_url: "https://www.va.gov/find-locations/?facilityType=vet_center&state=VA",
    phone: "804-353-8958", address: "4902 Fitzhugh Ave", city: "Richmond", zip: "23230",
    source_name: "U.S. Department of Veterans Affairs — RCS" },

  { section: "C", title: "Roanoke Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Service community storefront serving the Roanoke Valley and southwest Virginia. Free, confidential individual/group counseling for combat veterans and MST survivors.",
    website_url: "https://www.va.gov/find-locations/?facilityType=vet_center&state=VA",
    phone: "540-342-9726", address: "1401 Franklin Rd SW, Suite 200", city: "Roanoke", zip: "24016",
    source_name: "U.S. Department of Veterans Affairs — RCS" },

  { section: "C", title: "Virginia Mobile Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Service mobile unit traveling to underserved rural Virginia communities, public events, and Guard/Reserve drill weekends; free same-day enrollment for confidential RCS counseling services.",
    website_url: "https://www.vetcenter.va.gov/",
    phone: "877-927-8387", address: "Statewide deployment", city: "Richmond", zip: "23230",
    source_name: "U.S. Department of Veterans Affairs — RCS" },

  // ===========================================================================
  // D. Northern Virginia — bases + NoVA county VSOs + NoVA nonprofits
  // ===========================================================================
  { section: "D", title: "Marine Corps Base Quantico",
    cat: "family-support", sub: "Military Family Support",
    desc: "MCB Quantico — major Marine Corps installation south of Washington DC. Marine Corps Community Services (MCCS) Family Readiness Office offers Exceptional Family Member, Personal & Professional Development, and Behavioral Health programs to active duty, veterans, and families.",
    website_url: "https://www.quantico.marines.mil/",
    phone: "703-784-2424", address: "3250 Catlin Ave", city: "Quantico", zip: "22134",
    latitude: 38.5226, longitude: -77.3034, source_name: "U.S. Marine Corps" },

  { section: "D", title: "Fort Belvoir Army Community Service",
    cat: "family-support", sub: "Military Family Support",
    desc: "Army Community Service center at Fort Belvoir — serves the National Capital Region's largest Army installation. Soldier and Family Readiness, EFMP, financial readiness, transition assistance (SFL-TAP), and survivor outreach for ~50,000 daily population.",
    website_url: "https://home.army.mil/belvoir/",
    phone: "703-805-5588", address: "9800 Belvoir Rd, Bldg 200", city: "Fort Belvoir", zip: "22060",
    latitude: 38.7197, longitude: -77.1547, source_name: "U.S. Army Garrison Fort Belvoir" },

  { section: "D", title: "Joint Base Myer-Henderson Hall",
    cat: "family-support", sub: "Military Family Support",
    desc: "Joint Base Myer-Henderson Hall — tri-service installation across Arlington National Cemetery from Washington DC. Hosts Old Guard 3rd Infantry, Marine Barracks Henderson Hall, and ACS/MCCS family programs supporting NCR active duty and veterans.",
    website_url: "https://home.army.mil/jbmhh/",
    phone: "703-696-3510", address: "204 Lee Ave", city: "Arlington", zip: "22211",
    latitude: 38.8830, longitude: -77.0810, source_name: "U.S. Army Garrison JBM-HH" },

  { section: "D", title: "Fairfax County Veteran Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Fairfax County's veteran service coordinator office — accredited VSOs help Northern Virginia veterans (largest VA county pop ~1.1M) file VA disability/pension claims, navigate benefits, and connect to county/state services.",
    website_url: "https://www.fairfaxcounty.gov/familyservices/",
    phone: "703-324-5421", address: "12011 Government Center Pkwy", city: "Fairfax", zip: "22035",
    latitude: 38.8552, longitude: -77.3532, source_name: "Fairfax County" },

  { section: "D", title: "Arlington County Veteran Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Arlington County DHS Veterans Outreach — accredited service officer helping Arlington veterans file VA claims, access mental health, housing, and county aging-and-disability services.",
    website_url: "https://www.arlingtonva.us/Government/Departments/DHS",
    phone: "703-228-1300", address: "2100 Washington Blvd", city: "Arlington", zip: "22204",
    latitude: 38.8696, longitude: -77.0968, source_name: "Arlington County" },

  { section: "D", title: "Alexandria DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Alexandria benefits office — accredited DVS service officer helps City of Alexandria veterans file VA disability/pension claims, education benefits, and DD-214 records requests at no cost.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "703-746-3554", address: "4480 King St", city: "Alexandria", zip: "22302",
    source_name: "Virginia DVS" },

  { section: "D", title: "Loudoun County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Loudoun County's accredited veteran service officer — files VA claims for Loudoun veterans, links to county mental-health, housing, and veteran-focused community programs.",
    website_url: "https://www.loudoun.gov/",
    phone: "703-771-5000", address: "102 Heritage Way NE, Suite 200", city: "Leesburg", zip: "20176",
    source_name: "Loudoun County" },

  { section: "D", title: "Prince William County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Prince William County DSS Veterans Services — accredited service officers file VA disability/pension claims, connect veterans to local housing assistance, and operate the county's Veterans Council outreach.",
    website_url: "https://www.pwcva.gov/department/social-services",
    phone: "703-792-7500", address: "15941 Donald Curtis Dr, Suite 200", city: "Woodbridge", zip: "22191",
    source_name: "Prince William County" },

  { section: "D", title: "Capital Area Food Bank — Virginia Operations",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Capital Area Food Bank — regional food bank serving Northern Virginia (Arlington, Fairfax, Prince William, Loudoun) plus DC and suburban Maryland. Pantry partners, mobile distributions, and senior food programs supporting NoVA veteran families.",
    website_url: "https://www.capitalareafoodbank.org/",
    phone: "202-644-9800", address: "6833 Hill Park Dr", city: "Lorton", zip: "22079",
    source_name: "Capital Area Food Bank" },

  { section: "D", title: "Operation Renewed Hope Foundation (Arlington)",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Virginia-based nonprofit focused on permanent-supportive-housing placement for homeless veterans across Virginia, DC, and Maryland; partners with VA HUD-VASH; furnishes apartments, provides case management, and bridges to employment.",
    website_url: "https://www.operationrenewedhopefoundation.org/",
    phone: "703-887-7846", address: "PO Box 41129", city: "Arlington", zip: "22204",
    source_name: "Operation Renewed Hope Foundation" },

  { section: "D", title: "ServiceSource (Oakton HQ)",
    cat: "disabled-veterans", sub: "Employment & Vocational Rehabilitation",
    desc: "Virginia-headquartered nonprofit serving people with disabilities including disabled veterans across VA/DC/MD/NC/FL/DE; AbilityOne federal-contract employment placements, vocational evaluation, supported employment, and assistive-tech services for VA-rated and SSDI-eligible Virginia veterans.",
    website_url: "https://www.servicesource.org/",
    phone: "571-226-4400", address: "10467 White Granite Dr", city: "Oakton", zip: "22124",
    source_name: "ServiceSource" },

  { section: "D", title: "American Legion Post 24 Vienna",
    cat: "community-support", sub: "American Legion Posts",
    desc: "Vienna American Legion Post 24 — anchor American Legion post for Northern Virginia; meeting and event hall, Boys/Girls State sponsor, color guard for Arlington National Cemetery funerals, and post-based fellowship for NoVA veterans.",
    website_url: "https://www.valegion.org/",
    phone: "703-938-2316", address: "330 Center St N", city: "Vienna", zip: "22180",
    source_name: "American Legion Post 24" },

  // ===========================================================================
  // E. Hampton Roads — 6 bases + 6 city DVS offices + regional support
  // ===========================================================================
  { section: "E", title: "Naval Station Norfolk Fleet & Family Support Center",
    cat: "family-support", sub: "Military Family Support",
    desc: "Navy Fleet & Family Support Center at the world's largest naval base. Counseling, financial education, deployment readiness, transition assistance (TAP), Family Advocacy, and SAPR programs for active duty, veterans, and ~75,000 daily-population families.",
    website_url: "https://cnrma.cnic.navy.mil/Installations/NS-Norfolk/",
    phone: "757-444-2102", address: "7928 14th St, Bldg N-26", city: "Norfolk", zip: "23505",
    latitude: 36.9450, longitude: -76.3300, source_name: "Navy CNIC" },

  { section: "E", title: "NAS Oceana Fleet & Family Support Center",
    cat: "family-support", sub: "Military Family Support",
    desc: "Navy Fleet & Family Support Center at Naval Air Station Oceana, master jet base in Virginia Beach. Counseling, deployment readiness, transition (TAP), New Parent Support, and Sexual Assault Prevention/Response programs.",
    website_url: "https://cnrma.cnic.navy.mil/Installations/NAS-Oceana/",
    phone: "757-433-2912", address: "1606 Tomcat Blvd", city: "Virginia Beach", zip: "23460",
    latitude: 36.8203, longitude: -76.0331, source_name: "Navy CNIC" },

  { section: "E", title: "JEB Little Creek-Fort Story Fleet & Family Support Center",
    cat: "family-support", sub: "Military Family Support",
    desc: "Navy Fleet & Family Support Center at Joint Expeditionary Base Little Creek-Fort Story (Naval Special Warfare/Naval Beach Group home). Counseling, financial readiness, deployment readiness, and resilience programs for active duty and veterans.",
    website_url: "https://cnrma.cnic.navy.mil/Installations/JEB-Little-Creek-Fort-Story/",
    phone: "757-462-7563", address: "1450 D St, Bldg 3008", city: "Virginia Beach", zip: "23459",
    source_name: "Navy CNIC" },

  { section: "E", title: "Joint Base Langley-Eustis Airman & Family Readiness",
    cat: "family-support", sub: "Military Family Support",
    desc: "Air Force Airman & Family Readiness Center at Joint Base Langley-Eustis (Hampton/Newport News) — hosts 633rd Air Base Wing and 7th Transportation Brigade. Counseling, transition assistance, financial readiness, deployment, and EFMP programs.",
    website_url: "https://www.jble.af.mil/",
    phone: "757-764-3990", address: "45 Nealy Ave, Bldg 15", city: "Hampton", zip: "23665",
    latitude: 37.0830, longitude: -76.3500, source_name: "Joint Base Langley-Eustis" },

  { section: "E", title: "Norfolk Naval Shipyard Fleet & Family Support Center",
    cat: "family-support", sub: "Military Family Support",
    desc: "Navy Fleet & Family Support Center at Norfolk Naval Shipyard, Portsmouth — oldest continuously operating naval shipyard in U.S. Counseling, deployment, financial readiness, and SAPR programs for shipyard workers, sailors, and families.",
    website_url: "https://cnrma.cnic.navy.mil/Installations/Norfolk-Naval-Shipyard/",
    phone: "757-953-7801", address: "9325 Virginia Ave, Bldg 17", city: "Portsmouth", zip: "23709",
    source_name: "Navy CNIC" },

  { section: "E", title: "Naval Weapons Station Yorktown FFSC",
    cat: "family-support", sub: "Military Family Support",
    desc: "Navy Fleet & Family Support Center at Naval Weapons Station Yorktown — provides counseling, deployment readiness, transition assistance, and financial-readiness programs for sailors, dependents, and veterans on the Peninsula.",
    website_url: "https://cnrma.cnic.navy.mil/Installations/NWS-Yorktown/",
    phone: "757-887-7607", address: "160 Main Rd, Bldg 1500", city: "Yorktown", zip: "23691",
    source_name: "Navy CNIC" },

  { section: "E", title: "Norfolk DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Norfolk benefits office — accredited DVS service officer helps City of Norfolk veterans (significant Navy retiree population) file VA disability/pension claims, education benefits, and survivor benefits at no cost.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "757-823-1656", address: "201 E Plume St, Suite 670", city: "Norfolk", zip: "23510",
    source_name: "Virginia DVS" },

  { section: "E", title: "Virginia Beach DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Virginia Beach benefits office — accredited DVS service officer helps Virginia Beach veterans (largest veteran-density city in Virginia) file VA disability/pension claims and education/survivor benefits at no cost.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "757-385-2380", address: "297 Independence Blvd, Suite 232", city: "Virginia Beach", zip: "23462",
    source_name: "Virginia DVS" },

  { section: "E", title: "Newport News DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Newport News benefits office — accredited DVS service officer helps Newport News and Peninsula veterans file VA disability/pension claims, education benefits, and DD-214 records requests at no cost.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "757-247-2474", address: "2410 Wickham Ave, Suite 102", city: "Newport News", zip: "23607",
    source_name: "Virginia DVS" },

  { section: "E", title: "Hampton DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Hampton benefits office — accredited DVS service officer helps City of Hampton veterans file VA disability/pension claims, education benefits, and survivor benefits at no cost.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "757-310-1140", address: "4810 W Mercury Blvd, Suite C2", city: "Hampton", zip: "23666",
    source_name: "Virginia DVS" },

  { section: "E", title: "Chesapeake DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Chesapeake benefits office — accredited DVS service officer helps City of Chesapeake veterans file VA disability/pension claims, education benefits, and DD-214 records requests at no cost.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "757-549-9711", address: "740 Eden Way N, Suite 200", city: "Chesapeake", zip: "23320",
    source_name: "Virginia DVS" },

  { section: "E", title: "Portsmouth DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Portsmouth benefits office — accredited DVS service officer helps City of Portsmouth veterans file VA disability/pension claims, education benefits, and survivor benefits at no cost.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "757-393-8585", address: "801 Crawford St, Suite 412", city: "Portsmouth", zip: "23704",
    source_name: "Virginia DVS" },

  { section: "E", title: "Foodbank of Southeastern Virginia & the Eastern Shore",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Regional food bank serving 5 Hampton Roads cities and 9 counties on the Peninsula and Eastern Shore. Mobile distributions, BackPack programs, senior nutrition, and partner pantries serving Hampton Roads veteran families.",
    website_url: "https://foodbankonline.org/",
    phone: "757-627-6599", address: "800 Tidewater Dr", city: "Norfolk", zip: "23504",
    source_name: "Foodbank of SEVA" },

  { section: "E", title: "USO Hampton Roads & Central Virginia",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Covers Norfolk Naval Station, Joint Base Langley-Eustis, JEB Little Creek-Fort Story, NSA Hampton Roads, Quantico, and Fort Gregg-Adams; airport and base centers, transition workshops, family events, deployment care packages for Virginia service members and families.",
    website_url: "https://hrcv.uso.org/",
    phone: "757-451-9994", address: "1799 Reginald Dr", city: "Hampton", zip: "23663",
    source_name: "USO Hampton Roads & Central Virginia" },

  // ===========================================================================
  // F. Richmond / Tri-Cities — Fort Gregg-Adams + city/county VSOs + Richmond NPs
  // ===========================================================================
  { section: "F", title: "Fort Gregg-Adams Army Community Service",
    cat: "family-support", sub: "Military Family Support",
    desc: "Army Community Service center at Fort Gregg-Adams (formerly Fort Lee) — Combined Arms Support Command HQ. Soldier and Family Readiness, EFMP, transition assistance (SFL-TAP), financial readiness, and survivor outreach.",
    website_url: "https://home.army.mil/lee/",
    phone: "804-734-6388", address: "1401 B Ave, Bldg 9023", city: "Fort Gregg-Adams", zip: "23801",
    latitude: 37.2336, longitude: -77.3322, source_name: "U.S. Army Garrison Fort Gregg-Adams" },

  { section: "F", title: "Henrico County Veteran Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Henrico County's accredited veteran service officer — files VA disability/pension claims for Henrico veterans, links to county social-services, mental-health, and senior-aging programs serving the Richmond suburbs.",
    website_url: "https://henrico.us/",
    phone: "804-501-7347", address: "8600 Dixon Powers Dr", city: "Henrico", zip: "23228",
    source_name: "Henrico County" },

  { section: "F", title: "Chesterfield County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Chesterfield County's veteran services coordinator — accredited service officer files VA disability/pension claims for Chesterfield veterans (south of Richmond), links to county social services and mental-health programs.",
    website_url: "https://www.chesterfield.gov/270/Veterans-Services",
    phone: "804-768-7878", address: "9501 Lori Rd, Bldg A", city: "Chesterfield", zip: "23832",
    source_name: "Chesterfield County" },

  { section: "F", title: "Richmond DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Richmond benefits office — accredited DVS service officer helps City of Richmond veterans file VA disability/pension claims, education benefits, and survivor benefits at no cost.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "804-786-0286", address: "101 N 14th St, 17th Floor", city: "Richmond", zip: "23219",
    source_name: "Virginia DVS" },

  { section: "F", title: "Petersburg DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Petersburg benefits office — accredited DVS service officer helps Tri-Cities (Petersburg/Hopewell/Colonial Heights) veterans file VA disability/pension claims and education/survivor benefits at no cost.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "804-862-6450", address: "20 W Bank St", city: "Petersburg", zip: "23803",
    source_name: "Virginia DVS" },

  { section: "F", title: "Hopewell DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Hopewell benefits office — accredited DVS service officer helps Hopewell and Prince George County veterans file VA disability/pension claims at no cost; serves the eastern Tri-Cities.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "804-541-2243", address: "300 N Main St", city: "Hopewell", zip: "23860",
    source_name: "Virginia DVS" },

  { section: "F", title: "FeedMore",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Central Virginia's regional food bank — operates Community Kitchen meal program, Mobile Pantry, Family BackPack Program, and partner-pantry network serving 34 counties/cities. Direct touchpoint for Richmond-area veteran food assistance.",
    website_url: "https://feedmore.org/",
    phone: "804-521-2500", address: "1415 Rhoadmiller St", city: "Richmond", zip: "23220",
    source_name: "FeedMore Central Virginia" },

  { section: "F", title: "McShin Foundation",
    cat: "substance-recovery", sub: "Peer Recovery Groups",
    desc: "Henrico-based peer-recovery community organization — Virginia's largest non-clinical recovery community organization. Recovery housing, peer recovery specialists, drop-in centers, and family programs serving Richmond-region veterans in addiction recovery.",
    website_url: "https://mcshin.org/",
    phone: "804-249-1845", address: "2300 Dumbarton Rd", city: "Henrico", zip: "23228",
    source_name: "McShin Foundation" },

  { section: "F", title: "CARITAS",
    cat: "housing", sub: "Emergency Housing",
    desc: "Richmond's largest provider of emergency-shelter and recovery services — operates The Healing Place men's/women's recovery and the CARITAS Furniture Bank. Serves homeless Richmond-region veterans referred via SSVF and HUD-VASH partners.",
    website_url: "https://caritasva.org/",
    phone: "804-358-0964", address: "2220 Stockton St", city: "Richmond", zip: "23224",
    source_name: "CARITAS" },

  // ===========================================================================
  // G. Roanoke / Southwest Virginia — county VSOs + regional NPs
  // ===========================================================================
  { section: "G", title: "Roanoke City DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Roanoke benefits office (co-located with Roanoke VA Regional Office) — accredited DVS service officer helps Roanoke City and Roanoke Valley veterans file VA disability/pension claims at no cost.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "540-224-3232", address: "210 Franklin Rd SW, Suite 130", city: "Roanoke", zip: "24011",
    source_name: "Virginia DVS" },

  { section: "G", title: "Salem DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Salem benefits office (co-located with Salem VAMC region) — accredited DVS service officer helps Roanoke County, Salem, and Botetourt veterans file VA disability/pension claims at no cost.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "540-561-7000", address: "1970 Roanoke Blvd", city: "Salem", zip: "24153",
    source_name: "Virginia DVS" },

  { section: "G", title: "Bristol DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Bristol benefits office — accredited DVS service officer helps Bristol and Washington County veterans (far southwest Virginia, TN border) file VA disability/pension claims at no cost.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "276-642-7251", address: "468 Cumberland St", city: "Bristol", zip: "24201",
    source_name: "Virginia DVS" },

  { section: "G", title: "Wytheville DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Wytheville benefits office — accredited DVS service officer helps Wythe/Bland/Smyth-county veterans file VA disability/pension claims at no cost; serves rural southwest Virginia.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "276-228-5413", address: "190 S 1st St", city: "Wytheville", zip: "24382",
    source_name: "Virginia DVS" },

  { section: "G", title: "Galax DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Galax benefits office — accredited DVS service officer helps Galax/Carroll/Grayson-county veterans file VA disability/pension claims at no cost; serves the Blue Ridge Highlands.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "276-236-7131", address: "111 E Grayson St", city: "Galax", zip: "24333",
    source_name: "Virginia DVS" },

  { section: "G", title: "Feeding Southwest Virginia",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Regional food bank serving 26 counties/cities in southwest Virginia (Roanoke south to TN border). Mobile pantries, BackPack programs, Community Kitchen, and partner pantries serving SW Virginia veteran families.",
    website_url: "https://feedingswva.org/",
    phone: "540-342-3011", address: "1025 Electric Rd", city: "Salem", zip: "24153",
    source_name: "Feeding Southwest Virginia" },

  { section: "G", title: "Total Action for Progress (TAP)",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Roanoke-based Community Action Agency operating SSVF (Supportive Services for Veteran Families) rapid-rehousing for veterans in 13 SW Virginia counties; also Head Start, energy assistance, and weatherization programs.",
    website_url: "https://www.tapintohope.org/",
    phone: "540-345-6781", address: "302 2nd St SW", city: "Roanoke", zip: "24011",
    source_name: "Total Action for Progress" },

  { section: "G", title: "Carilion Clinic Veterans Services",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Carilion Clinic — Roanoke-region's largest health system. Serves as a community-care partner with Salem VAMC; provides cardiac, oncology, behavioral-health, and women's-health specialty referrals for VA-enrolled SW Virginia veterans.",
    website_url: "https://www.carilionclinic.org/",
    phone: "540-981-7000", address: "1906 Belleview Ave SE", city: "Roanoke", zip: "24014",
    source_name: "Carilion Clinic" },

  // ===========================================================================
  // H. Charlottesville / Piedmont — UVA + county VSOs + food bank
  // ===========================================================================
  { section: "H", title: "UVA Veteran & Military Affiliated Services",
    cat: "education", sub: "Veteran Student Services",
    desc: "University of Virginia's veteran-student services office — SCO-certified GI Bill processing, dedicated student-veteran lounge, military-family-support advisor, and active Student Veterans of America chapter on Grounds.",
    website_url: "https://www.virginia.edu/",
    phone: "434-924-3795", address: "Fontaine Resource Center, 2400 Old Ivy Rd", city: "Charlottesville", zip: "22903",
    source_name: "University of Virginia" },

  { section: "H", title: "Charlottesville DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Charlottesville benefits office — accredited DVS service officer helps City of Charlottesville and Albemarle County veterans file VA disability/pension claims at no cost.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "434-984-8884", address: "1138 Rose Hill Dr", city: "Charlottesville", zip: "22903",
    source_name: "Virginia DVS" },

  { section: "H", title: "Region Ten CSB",
    cat: "crisis-help", sub: "Mobile Crisis Teams",
    desc: "Charlottesville Region Ten Community Services Board — operates 24/7 Crisis Response Team, Mobile Crisis services, and Crisis Stabilization Unit for Charlottesville/Albemarle/Greene/Louisa/Nelson/Fluvanna; serves veterans referred through DBHDS Marcus Alert.",
    website_url: "https://regionten.org/",
    phone: "434-972-1800", address: "502 Old Lynchburg Rd", city: "Charlottesville", zip: "22903",
    source_name: "Region Ten CSB" },

  { section: "H", title: "Blue Ridge Area Food Bank",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Regional food bank serving 25 counties/cities across the Shenandoah Valley, central Virginia, and Lynchburg areas; operates Mobile Pantry, BackPack programs, and partner pantries serving Piedmont/Valley veteran families.",
    website_url: "https://www.brafb.org/",
    phone: "540-248-3663", address: "96 Laurel Hill Rd", city: "Verona", zip: "24482",
    source_name: "Blue Ridge Area Food Bank" },

  { section: "H", title: "Loaves & Fishes Food Pantry (Crozet)",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Charlottesville-area Loaves & Fishes — choice-model food pantry serving low-income families in Albemarle and surrounding counties; veteran families served without means-test verification.",
    website_url: "https://cvilleloaves.org/",
    phone: "434-996-7868", address: "9385 Three Notch'd Rd", city: "Crozet", zip: "22932",
    source_name: "Loaves & Fishes" },

  { section: "H", title: "On Our Own Charlottesville",
    cat: "mental-health", sub: "Peer Support",
    desc: "Charlottesville peer-run mental-health recovery and wellness center serving people with lived experience of mental health and substance-use challenges; veterans welcome; drop-in groups, WRAP training, and peer mentoring.",
    website_url: "https://onourowncville.org/",
    phone: "434-979-0440", address: "414 E Market St", city: "Charlottesville", zip: "22902",
    source_name: "On Our Own Charlottesville" },

  // ===========================================================================
  // I. Shenandoah Valley — Winchester/Harrisonburg/Staunton + JMU
  // ===========================================================================
  { section: "I", title: "Winchester DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Winchester benefits office — accredited DVS service officer helps Winchester/Frederick/Clarke/Warren-county veterans file VA disability/pension claims at no cost; serves the lower Shenandoah Valley.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "540-722-3414", address: "129 N Cameron St", city: "Winchester", zip: "22601",
    source_name: "Virginia DVS" },

  { section: "I", title: "Harrisonburg DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Harrisonburg benefits office — accredited DVS service officer helps Harrisonburg/Rockingham-county veterans file VA disability/pension claims at no cost; serves the central Shenandoah Valley.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "540-432-7900", address: "110 N Mason St", city: "Harrisonburg", zip: "22802",
    source_name: "Virginia DVS" },

  { section: "I", title: "Staunton DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Staunton benefits office — accredited DVS service officer helps Staunton/Augusta/Waynesboro-area veterans file VA disability/pension claims at no cost; serves the upper Shenandoah Valley.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "540-332-7889", address: "102 Lacy B King Way", city: "Staunton", zip: "24401",
    source_name: "Virginia DVS" },

  { section: "I", title: "JMU Military and Veteran Resource Center",
    cat: "education", sub: "Veteran Student Services",
    desc: "James Madison University Military and Veteran Resource Center — SCO-certified GI Bill processing, dedicated lounge, transition support, peer mentoring, and Student Veterans of America chapter for ~700 student veterans on campus.",
    website_url: "https://www.jmu.edu/",
    phone: "540-568-1776", address: "738 S Mason St, MSC 5752", city: "Harrisonburg", zip: "22807",
    source_name: "James Madison University" },

  { section: "I", title: "Mary Baldwin University Military Resource Center",
    cat: "education", sub: "Veteran Student Services",
    desc: "Mary Baldwin University Veterans and Military Programs — SCO-certified GI Bill institution serving traditional and online student-veterans; one of Virginia's first Yellow Ribbon partner institutions; veteran-spouse and dependent education advising.",
    website_url: "https://marybaldwin.edu/",
    phone: "540-887-7000", address: "318 Prospect St", city: "Staunton", zip: "24401",
    source_name: "Mary Baldwin University" },

  // ===========================================================================
  // J. Fredericksburg / Northern Neck — county VSOs + hospital + food bank
  // ===========================================================================
  { section: "J", title: "Fredericksburg DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Fredericksburg benefits office — accredited DVS service officer helps City of Fredericksburg veterans file VA disability/pension claims at no cost; serves the Rappahannock region.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "540-899-4200", address: "1320 Central Park Blvd, Suite 100", city: "Fredericksburg", zip: "22401",
    source_name: "Virginia DVS" },

  { section: "J", title: "Spotsylvania County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Spotsylvania County's accredited veteran service officer — files VA disability/pension claims for Spotsylvania veterans, links to county social services and mental-health programs.",
    website_url: "https://www.spotsylvania.va.us/",
    phone: "540-507-7000", address: "9104 Courthouse Rd", city: "Spotsylvania", zip: "22553",
    source_name: "Spotsylvania County" },

  { section: "J", title: "Stafford County Veteran Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Stafford County's accredited veteran service officer (Quantico-adjacent) — files VA disability/pension claims for Stafford-county veterans, hosts veteran-focused job fairs, and connects veterans to county housing and transit assistance.",
    website_url: "https://staffordcountyva.gov/",
    phone: "540-658-8775", address: "1300 Courthouse Rd", city: "Stafford", zip: "22554",
    source_name: "Stafford County" },

  { section: "J", title: "Mary Washington Healthcare",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Mary Washington Healthcare — Fredericksburg-region's largest nonprofit health system. Serves as a community-care partner with McGuire VAMC; provides cardiac, oncology, behavioral-health, and women's-health specialty referrals for VA-enrolled veterans.",
    website_url: "https://www.marywashingtonhealthcare.com/",
    phone: "540-741-1100", address: "1001 Sam Perry Blvd", city: "Fredericksburg", zip: "22401",
    source_name: "Mary Washington Healthcare" },

  { section: "J", title: "Fredericksburg Regional Food Bank",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Regional food bank serving Fredericksburg/Stafford/Spotsylvania/King George/Caroline; partner-pantry network, mobile pantries, BackPack programs, and senior nutrition serving Northern Neck and Rappahannock veteran families.",
    website_url: "https://www.fredfood.org/",
    phone: "540-371-7666", address: "3631 Lee Hill Dr", city: "Fredericksburg", zip: "22408",
    source_name: "Fredericksburg Regional Food Bank" },

  // ===========================================================================
  // K. Lynchburg / Southside — Liberty + Danville + South Hill DVS offices
  // ===========================================================================
  { section: "K", title: "Lynchburg DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Lynchburg benefits office — accredited DVS service officer helps City of Lynchburg and surrounding-county veterans file VA disability/pension claims at no cost; serves central Virginia.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "434-477-5895", address: "8000 Timberlake Rd, Suite 102", city: "Lynchburg", zip: "24502",
    source_name: "Virginia DVS" },

  { section: "K", title: "Liberty University Office of Military Affairs",
    cat: "education", sub: "Veteran Student Services",
    desc: "Liberty University's Office of Military Affairs — SCO-certified GI Bill institution serving the largest student-veteran population among Virginia private universities (~10,000 military-affiliated students online and on-campus); Yellow Ribbon partner; dedicated military advisor team.",
    website_url: "https://www.liberty.edu/military/",
    phone: "800-424-9595", address: "1971 University Blvd", city: "Lynchburg", zip: "24515",
    source_name: "Liberty University" },

  { section: "K", title: "Danville DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Danville benefits office — accredited DVS service officer helps Danville and Pittsylvania-county veterans file VA disability/pension claims at no cost; serves southside Virginia near NC border.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "434-836-8442", address: "446 Main St, Suite 201", city: "Danville", zip: "24541",
    source_name: "Virginia DVS" },

  { section: "K", title: "South Hill DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS South Hill benefits office — accredited DVS service officer helps Mecklenburg/Brunswick/Lunenburg-county veterans file VA disability/pension claims at no cost; serves rural southside Virginia.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "434-447-3136", address: "315 N Mecklenburg Ave", city: "South Hill", zip: "23970",
    source_name: "Virginia DVS" },

  { section: "K", title: "Halifax County Veteran Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Halifax County's accredited veteran service officer — files VA disability/pension claims for South Boston/Halifax-county veterans, links to county aging-and-disability and rural-health programs.",
    website_url: "https://halifaxcountyva.gov/",
    phone: "434-476-3380", address: "1030 Cowford Rd", city: "Halifax", zip: "24558",
    source_name: "Halifax County" },

  // ===========================================================================
  // L. Crisis & statewide hotlines (VA-tagged so they appear in VA search)
  // ===========================================================================
  { section: "L", title: "Virginia 211 Veterans Help Line",
    cat: "crisis-help", sub: "Emergency Mental Health",
    desc: "Statewide 211 hotline (dial 2-1-1) connecting Virginia veterans and families to crisis intervention, emergency shelter, food, utility, and behavioral-health resources 24/7. Multilingual.",
    website_url: "https://www.211virginia.org/",
    phone: "211", address: "502 Campbell Ave SW", city: "Roanoke", zip: "24016",
    source_name: "Council of Community Services" },

  { section: "L", title: "Virginia DBHDS Crisis Connect (988)",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Virginia Department of Behavioral Health and Developmental Services — administers Marcus Alert + 988 Suicide & Crisis Lifeline statewide rollout; Regional Crisis Call Centers, Mobile Crisis Teams in every region, and Crisis Receiving Centers/Stabilization Units serving Virginia veterans 24/7.",
    website_url: "https://dbhds.virginia.gov/",
    phone: "988", address: "1220 Bank St", city: "Richmond", zip: "23219",
    source_name: "Virginia DBHDS" },

  { section: "L", title: "Virginia Sexual & Domestic Violence Action Alliance",
    cat: "crisis-help", sub: "Domestic Violence / Safety",
    desc: "Statewide coalition operating Virginia's 24/7 Family Violence & Sexual Assault Hotline. Safety planning, shelter referral, advocacy, and counseling for Virginia veterans, military spouses, and families.",
    website_url: "https://www.vsdvalliance.org/",
    phone: "800-838-8238", address: "5008 Monument Ave, Suite A", city: "Richmond", zip: "23230",
    source_name: "VSDVAA" },

  { section: "L", title: "Virginia Marcus Alert Mobile Response Statewide",
    cat: "crisis-help", sub: "Mobile Crisis Teams",
    desc: "DBHDS Marcus Alert program — statewide network of behavioral-health mobile-response and community-care teams that respond to mental-health crises in lieu of (or paired with) law enforcement. Free to Virginia veterans and civilians; 988-routed.",
    website_url: "https://dbhds.virginia.gov/",
    phone: "988", address: "1220 Bank St", city: "Richmond", zip: "23219",
    source_name: "Virginia DBHDS — Marcus Alert" },

  { section: "L", title: "Crisis Text Line — Virginia",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Free 24/7 crisis text line connecting Virginia veterans and family members in emotional crisis with trained counselors. Text HOME to 741741 from anywhere in Virginia.",
    website_url: "https://www.crisistextline.org/",
    phone: "Text HOME to 741741", address: "Statewide", city: "Richmond", zip: "23219",
    source_name: "Crisis Text Line" },

  { section: "L", title: "Virginia Lock & Talk Suicide Prevention",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "DBHDS Lock & Talk Virginia — statewide gun-safety + suicide-prevention initiative. Free gun locks, medication lock-boxes, and 'Question Persuade Refer' (QPR) training distributed through Virginia CSBs; specifically targets veteran firearm-suicide risk.",
    website_url: "https://lockandtalk.org/",
    phone: "888-261-1244", address: "1220 Bank St", city: "Richmond", zip: "23219",
    source_name: "Lock & Talk Virginia" },

  { section: "L", title: "Virginia Veterans Foundation Emergency Assistance",
    cat: "financial", sub: "Emergency Financial Assistance",
    desc: "VVSF emergency-relief micro-grants for indigent Virginia veterans facing utility shutoff, eviction, food insecurity, or transportation breakdown; referrals through any DVS benefits office.",
    website_url: "https://www.dvs.virginia.gov/",
    phone: "804-786-0286", address: "101 N 14th St, 17th Floor", city: "Richmond", zip: "23219",
    source_name: "Virginia DVS — VVSF" },

  // ===========================================================================
  // M. Statewide nonprofits, VSOs, state agencies, food / legal / community
  // ===========================================================================
  { section: "M", title: "American Legion — Department of Virginia",
    cat: "community-support", sub: "American Legion Posts",
    desc: "285+ posts statewide; Virginia's largest VSO; VA-accredited service officers file disability claims free for any veteran; Boys/Girls State, oratorical scholarships, Legion Riders, Sons of the American Legion, and post-based fellowship for VA veterans.",
    website_url: "https://www.valegion.org/",
    phone: "804-353-6606", address: "1708 Commonwealth Ave", city: "Richmond", zip: "23230",
    source_name: "American Legion Department of Virginia" },

  { section: "M", title: "VFW — Department of Virginia",
    cat: "community-support", sub: "VFW Posts",
    desc: "Veterans of Foreign Wars Department of Virginia — 130+ posts statewide; eligibility for veterans of overseas combat zones; VA-accredited service officers at department HQ + select posts file disability claims free; Voice of Democracy / Patriot's Pen scholarships, military-relief grants.",
    website_url: "https://www.vfwva.org/",
    phone: "804-353-7910", address: "5145 W Broad St", city: "Richmond", zip: "23230",
    source_name: "VFW Department of Virginia" },

  { section: "M", title: "Disabled American Veterans of Virginia (DAV-VA)",
    cat: "disabled-veterans", sub: "Disability Benefits & Claims",
    desc: "Disabled American Veterans Department of Virginia — 50+ chapters statewide; DAV National Service Officers stationed at the Roanoke VA Regional Office file disability/appeal claims free for any veteran; DAV Transportation Network volunteer drivers to VA medical appointments.",
    website_url: "https://www.dav.org/find-your-local-office/?st=VA",
    phone: "804-737-7137", address: "PO Box 8163", city: "Richmond", zip: "23223",
    source_name: "DAV Department of Virginia" },

  { section: "M", title: "AMVETS — Department of Virginia",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "AMVETS (American Veterans) Department of Virginia — congressionally chartered VSO open to all who honorably served (active duty, Guard, Reserve); statewide chapters; VA-accredited service officers; community service, scholarships, and post-based fellowship for VA veterans.",
    website_url: "https://amvets.org/",
    address: "Richmond, VA", city: "Richmond", zip: "23230",
    source_name: "AMVETS Department of Virginia" },

  { section: "M", title: "Vietnam Veterans of America — Virginia State Council",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "VVA Virginia State Council — congressionally chartered VSO for Vietnam-era veterans (1961-1975) and families; ~25 chapters statewide; advocacy on Agent Orange, PTSD, MIA/POW; VA-accredited service officers file claims free; outreach to incarcerated veterans.",
    website_url: "https://vva.org/",
    address: "Virginia State Council", city: "Richmond", zip: "23230",
    source_name: "Vietnam Veterans of America — VA State Council" },

  { section: "M", title: "Virginia Employment Commission (VEC) — Veterans Employment",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Employment Commission — operates 35 Virginia Career Works centers statewide; DVOP (Disabled Veterans' Outreach Program) and LVER (Local Veterans' Employment Representative) staff at each center serve VA veterans first; veterans get 24-hour priority on Virginia Workforce Connection job postings.",
    website_url: "https://www.vec.virginia.gov/",
    phone: "866-832-2363", address: "6606 W Broad St", city: "Richmond", zip: "23230",
    source_name: "Virginia Employment Commission" },

  { section: "M", title: "Virginia Housing (VHDA)",
    cat: "financial", sub: "VA Loans",
    desc: "Virginia Housing (formerly VHDA) — Virginia's affordable-housing finance agency; VA-loan eligible products with down-payment assistance grants up to 2.5%, free first-time-homebuyer classes, and Mortgage Credit Certificate (MCC) tax credit pairing with VA loans for Virginia veteran first-time buyers.",
    website_url: "https://www.virginiahousing.com/",
    phone: "804-782-1986", address: "601 S Belvidere St", city: "Richmond", zip: "23220",
    source_name: "Virginia Housing Development Authority" },

  { section: "M", title: "SCHEV — Military & Veteran Education",
    cat: "education", sub: "Veteran Student Services",
    desc: "State Council of Higher Education for Virginia — coordinating board for Virginia's 39 public + 100+ private colleges; State Approving Agency for GI Bill (approves Virginia institutions, certifies on-the-job/apprenticeship programs); maintains military/veteran-student resource directory.",
    website_url: "https://www.schev.edu/",
    phone: "804-225-2600", address: "101 N 14th St, 9th Floor", city: "Richmond", zip: "23219",
    source_name: "SCHEV" },

  { section: "M", title: "Virginia DHCD — Homeless Veteran Programs",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Virginia Department of Housing and Community Development — administers Virginia's Continuum of Care, Homeless Solutions Grant, ESG, and Housing Trust Fund; partners with VA on HUD-VASH placements and SSVF rapid-rehousing for Virginia homeless veterans.",
    website_url: "https://www.dhcd.virginia.gov/",
    phone: "804-371-7000", address: "600 E Main St, Suite 300", city: "Richmond", zip: "23219",
    source_name: "Virginia DHCD" },

  { section: "M", title: "Virginia Community College System — Veterans",
    cat: "education", sub: "Veteran Student Services",
    desc: "Virginia Community College System — 23 colleges + 40 campuses statewide; each VCCS college operates a SCO-certified GI Bill office and Veteran Student Services lounge; FastForward workforce credentials for in-demand Virginia jobs; transfer pathways to all VA public 4-year universities.",
    website_url: "https://www.vccs.edu/",
    phone: "804-819-4901", address: "300 Arboretum Pl, Suite 200", city: "Richmond", zip: "23236",
    source_name: "Virginia Community College System" },

  { section: "M", title: "Boulder Crest Foundation (Bluemont HQ)",
    cat: "mental-health", sub: "PTSD & Trauma Support",
    desc: "Virginia-headquartered nonprofit pioneering Posttraumatic Growth (PTG) for combat veterans and first responders; Warrior PATHH 7-day residential program at no cost; nationally replicated curriculum, but the original VA retreat remains active.",
    website_url: "https://bouldercrest.org/",
    phone: "540-554-2727", address: "18370 Bluemont Village Ln", city: "Bluemont", zip: "20135",
    source_name: "Boulder Crest Foundation" },

  { section: "M", title: "Steven A. Cohen Military Family Clinic at Endeavors (Virginia Beach)",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Cohen Veterans Network outpatient mental-health clinic in Virginia Beach serving post-9/11 veterans (any discharge status) and their families with low/no-cost evidence-based therapy for PTSD, depression, anxiety, transition stress, and family/relational issues. Telehealth available statewide.",
    website_url: "https://www.cohenveteransnetwork.org/clinics/",
    phone: "757-965-2200", address: "477 Viking Dr, Suite 401", city: "Virginia Beach", zip: "23452",
    source_name: "Cohen Veterans Network / Endeavors" },

  { section: "M", title: "Virginia Legal Aid Society (VLAS)",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Civil legal aid covering 26 Central, Southside, and Western Virginia counties/cities; free representation in housing, family law, public benefits, consumer, and military discharge-upgrade matters for income-eligible Virginia veterans.",
    website_url: "https://www.vlas.org/",
    phone: "866-534-5243", address: "513 Church St", city: "Lynchburg", zip: "24504",
    source_name: "Virginia Legal Aid Society" },

  { section: "M", title: "Legal Aid Justice Center",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Civil legal aid + impact litigation organization with offices in Charlottesville, Richmond, Falls Church, and Petersburg; serves low-income Virginians (including veterans) on housing, immigration, civil-rights, consumer, and economic-justice matters.",
    website_url: "https://www.justice4all.org/",
    phone: "434-977-0553", address: "1000 Preston Ave, Suite A", city: "Charlottesville", zip: "22903",
    source_name: "Legal Aid Justice Center" },

  { section: "M", title: "Lewis B. Puller Jr. Veterans Benefits Clinic (William & Mary Law)",
    cat: "legal", sub: "Veterans Legal Clinics",
    desc: "William & Mary Law School clinic providing free representation to Virginia veterans and their dependents on VA disability claims, appeals at the Board of Veterans' Appeals, discharge upgrades, and military records corrections. Statewide caseload.",
    website_url: "https://law.wm.edu/academics/programs/jd/electives/clinics/veterans/",
    phone: "757-221-7443", address: "613 South Henry St", city: "Williamsburg", zip: "23185",
    source_name: "William & Mary Law School" },

  { section: "M", title: "Virginia State Bar — Lawyer Referral & Pro Bono",
    cat: "legal", sub: "Pro Bono Legal Services",
    desc: "Virginia State Bar — administers the statewide Lawyer Referral Service (low-cost initial consultation), Senior Lawyers Conference Pro Bono initiatives, and the VSB Military Law Section.",
    website_url: "https://www.vsb.org/",
    phone: "804-775-0500", address: "1111 E Main St, Suite 700", city: "Richmond", zip: "23219",
    source_name: "Virginia State Bar" },

  { section: "M", title: "Virginia 211 Information & Referral",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Virginia 211 — statewide free information & referral helpline (dial 2-1-1) connecting Virginia residents — including veterans and military families — to ~25,000 vetted local services covering housing, food, mental health, utilities, healthcare, and crisis support.",
    website_url: "https://www.211virginia.org/",
    phone: "800-230-6977", address: "502 Campbell Ave SW", city: "Roanoke", zip: "24016",
    source_name: "Council of Community Services" },

  { section: "M", title: "Virginia National Guard Family Programs",
    cat: "family-support", sub: "Military Family Support",
    desc: "Virginia National Guard Family Programs — supports VANG soldiers/airmen and families through deployment cycles; Yellow Ribbon Reintegration events, child-and-youth services, financial-readiness counseling, military-spouse employment connections, and warm handoffs to DVS, VVFS, and Military OneSource.",
    website_url: "https://va.ng.mil/",
    phone: "804-236-7800", address: "5001 Waller Rd", city: "Sandston", zip: "23150",
    source_name: "Virginia National Guard" },

  { section: "M", title: "Volunteers of America Chesapeake & Carolinas",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "VOA Chesapeake & Carolinas — operates SSVF (Supportive Services for Veteran Families), GPD (Grant and Per Diem) transitional housing, and HUD-VASH support across Hampton Roads, Richmond, and NC. Direct housing crisis assistance for Virginia veterans.",
    website_url: "https://www.voachesapeake.org/",
    phone: "757-622-7704", address: "5170 East Virginia Beach Blvd", city: "Norfolk", zip: "23502",
    source_name: "Volunteers of America Chesapeake & Carolinas" },

  { section: "M", title: "Quantico National Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    desc: "VA National Cemetery Administration burial site on 725 acres adjacent to Marine Corps Base Quantico; open for new burials; military funeral honors available; pre-need eligibility determinations through NCA scheduling office.",
    website_url: "https://www.cem.va.gov/",
    phone: "703-221-2183", address: "18424 Joplin Rd", city: "Triangle", zip: "22172",
    source_name: "VA National Cemetery Administration" },

  { section: "M", title: "Culpeper National Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    desc: "VA National Cemetery Administration site established 1867; open for cremated remains and casketed burials in newer sections; military funeral honors available; serves north-central Virginia.",
    website_url: "https://www.cem.va.gov/",
    phone: "540-825-0027", address: "305 US Avenue", city: "Culpeper", zip: "22701",
    source_name: "VA National Cemetery Administration" },

  { section: "M", title: "Hampton National Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    desc: "VA National Cemetery Administration site (two sections: original 1862 grounds + Phoebus annex); cremated-remains burials only; military funeral honors available; serves Hampton Roads veterans.",
    website_url: "https://www.cem.va.gov/",
    phone: "757-723-7104", address: "Cemetery Rd & Marshall Ave", city: "Hampton", zip: "23667",
    source_name: "VA National Cemetery Administration" },
];

(async () => {
  console.log(`\n=== seed-va-p1.ts (FL-pattern) — ${ROWS.length} rows ===`);

  // ---------- Pre-step 1: ensure VA state row exists (idempotent) ----------
  console.log(`\n[Phase 1 task #1] Ensuring Virginia row in states table…`);
  const { data: vaRow } = await supabaseAdmin.from("states").select("code, name").eq("code", "VA").maybeSingle();
  if (vaRow) {
    console.log(`  ✓ states.VA already exists (${(vaRow as any).name})`);
  } else {
    const { error: insErr } = await supabaseAdmin.from("states").insert({ code: "VA", name: "Virginia", active: true });
    if (insErr) {
      console.error(`  ✗ states.VA insert FAILED: ${insErr.message}`);
    } else {
      console.log(`  ✓ states.VA inserted (Virginia, active=true)`);
    }
  }

  // ---------- Pre-step 2: REPLACE-NOT-APPEND wipe (only on --commit) ----------
  if (COMMIT) {
    console.log(`\n[REPLACE-NOT-APPEND] Wiping all existing VA rows from resources…`);
    const { count: beforeCount } = await supabaseAdmin.from("resources").select("id", { count: "exact", head: true }).eq("state", "VA");
    console.log(`  Before wipe: ${beforeCount} VA rows`);
    const { error: delErr } = await supabaseAdmin.from("resources").delete().eq("state", "VA");
    if (delErr) {
      console.error(`  ✗ wipe FAILED: ${delErr.message}`);
      process.exit(1);
    }
    const { count: afterCount } = await supabaseAdmin.from("resources").select("id", { count: "exact", head: true }).eq("state", "VA");
    console.log(`  After wipe:  ${afterCount} VA rows  (deleted ${(beforeCount || 0) - (afterCount || 0)})`);
  } else {
    console.log(`\n[REPLACE-NOT-APPEND] Wipe skipped (dry-run). Pass --commit to wipe + reseed.`);
  }

  // ---------- Run the seed ----------
  await runSeed(ROWS, {
    state: "VA",
    commit: COMMIT,
    scriptName: "seed-va-p1.ts (FL-pattern)",
    urlCheckTimeoutMs: 12000,
    allowBrokenUrls: ALLOW_BROKEN_URLS,
    allowZipBleed: ALLOW_ZIP_BLEED,
    sectionLabels: {
      A: "VA DVS + State Homes + War Memorial",
      B: "VAMC + CBOCs + VARO",
      C: "Vet Centers",
      D: "Northern Virginia",
      E: "Hampton Roads",
      F: "Richmond / Tri-Cities",
      G: "Roanoke / SW Virginia",
      H: "Charlottesville / Piedmont",
      I: "Shenandoah Valley",
      J: "Fredericksburg / N Neck",
      K: "Lynchburg / Southside",
      L: "Crisis & hotlines",
      M: "Statewide nonprofits",
    },
  });
})().catch(e => { console.error(e); process.exit(1); });
