/**
 * VIRGINIA — PHASE 1: STATE FOUNDATION
 * Florida-style SOP. Statewide anchors only — NO city-saturation (that's Phase 4).
 *
 * Scope:
 *   - 1  VA Department of Veterans Services (DVS) cabinet anchor
 *   - 5  DVS statewide programs (VVFS, V3, VMSDEP, VTAP, VVSF)
 *   - 3  Virginia VA Medical Centers (Richmond/McGuire, Hampton, Salem)
 *   - 3  State Veterans Care Centers (Sitter & Barfoot, VVCC Roanoke, Jones & Cabacoy VA Beach)
 *   - 4  VA Regional Office + 3 National Cemeteries (Quantico, Culpeper, Hampton)
 *   - 5  Statewide VSOs (American Legion, VFW, DAV, AMVETS, VVA — VA departments)
 *   - 4  State agencies serving veterans (VEC, Virginia Housing, SCHEV, DHCD)
 *   - 6  Statewide nonprofits (Virginia 211, Boulder Crest, ORHF, ServiceSource, USO HRCV, Virginia War Memorial)
 *   - 4  Statewide legal pillars (VLAS, LAJC, Puller Vet Clinic W&M, VSB)
 *   - 3  Statewide crisis / mental-health (DBHDS Crisis, Cohen Clinic VA Beach, VA Vet Centers VA umbrella)
 *   - 1  Virginia National Guard Family Programs
 *   - 1  Virginia Community College System Veterans Office
 *
 * Baseline: VA = 0 rows (verified via probe-va.ts on 2026-05-02). P1 target ~40 rows.
 * One-phase-per-run governance active. STOPS after this phase.
 *
 * No fabrication. Every row sourced from .gov / .org institutional site.
 * Uncertain address/phone → left null rather than guessed.
 *
 * Also performs idempotent upsert of VA state row in `states` table (Phase 1 task #1).
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";
import { supabaseAdmin } from "../server/supabase";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");

const ROWS: SeedRow[] = [
  // ============== A — DVS CABINET AGENCY (1) ==============
  { section: "DVS", title: "Virginia Department of Veterans Services (DVS)",
    cat: "va-benefits", sub: "VA Enrollment & General Benefits Navigation",
    city: "Richmond", website_url: "https://www.dvs.virginia.gov/",
    source_name: "Virginia DVS", source_type: "state_government",
    phone: "804-786-0286", address: "101 N 14th St, 17th Floor, Richmond, VA 23219", zip: "23219",
    desc: "Virginia Department of Veterans Services — cabinet agency serving Virginia's ~700,000 veterans. Operates 38 benefits offices statewide (claims/appeals), the Virginia Veteran and Family Support Program (peer mental-health navigation), Virginia Values Veterans (V3) employer certification, three state Veterans Care Centers, and the Virginia War Memorial. Free benefits counseling at every office." },

  // ============== B — DVS STATEWIDE PROGRAMS (5) ==============
  { section: "DVS-PROG", title: "Virginia Veteran and Family Support (VVFS)",
    cat: "mental-health", sub: "Peer Support",
    city: "Richmond", website_url: "https://www.dvs.virginia.gov/",
    source_name: "Virginia DVS — VVFS", source_type: "state_government",
    phone: "804-371-6325", address: "101 N 14th St, 17th Floor, Richmond, VA 23219", zip: "23219",
    desc: "Virginia Veteran and Family Support — DVS statewide peer-navigator network connecting veterans, members of the Virginia National Guard/Reserves, and families to behavioral-health, rehabilitative, and supportive services. Replaces the legacy Virginia Wounded Warrior Program; serves all eras with priority on PTSD, TBI, and suicide-prevention warm-handoffs." },

  { section: "DVS-PROG", title: "Virginia Values Veterans (V3) Program",
    cat: "employment", sub: "Veteran-Friendly Employers",
    city: "Richmond", website_url: "https://www.dvsv3.com/",
    source_name: "Virginia DVS — V3", source_type: "state_government",
    phone: "804-786-0286", address: "101 N 14th St, 17th Floor, Richmond, VA 23219", zip: "23219",
    desc: "Virginia Values Veterans (V3) — DVS-administered employer certification + training program teaching Virginia companies how to recruit, hire, and retain veterans. 1,000+ certified V3 employers statewide; veterans can search certified-employer directory and access free V3 hiring events." },

  { section: "DVS-PROG", title: "Virginia Military Survivors and Dependents Education Program (VMSDEP)",
    cat: "education", sub: "Tuition Assistance",
    city: "Richmond", website_url: "https://www.dvs.virginia.gov/",
    source_name: "Virginia DVS", source_type: "state_government",
    phone: "804-786-0286", address: "101 N 14th St, 17th Floor, Richmond, VA 23219", zip: "23219",
    desc: "VMSDEP — Virginia tuition-and-fees waiver (and stipend) at any state-supported Virginia college/university for spouses and children (age 16-29) of veterans rated 90%+ permanent service-connected disabled by VA, KIA, MIA, or POW. Administered by DVS Education team; up to 36 academic months." },

  { section: "DVS-PROG", title: "Virginia Transition Assistance Program (VTAP)",
    cat: "employment", sub: "Job Placement Programs",
    city: "Richmond", website_url: "https://www.dvs.virginia.gov/",
    source_name: "Virginia DVS — VTAP", source_type: "state_government",
    phone: "804-786-0286", address: "101 N 14th St, 17th Floor, Richmond, VA 23219", zip: "23219",
    desc: "Virginia Transition Assistance Program — DVS career-coaching service for transitioning service members, recently separated veterans, and military spouses. Resume review, interview prep, statewide employer connections, and warm handoffs to V3 certified employers. No fee." },

  { section: "DVS-PROG", title: "Virginia Veterans Services Foundation (VVSF)",
    cat: "financial", sub: "Veteran Relief Funds",
    city: "Richmond", website_url: "https://www.dvs.virginia.gov/",
    source_name: "Virginia DVS — VVSF", source_type: "state_government",
    phone: "804-786-0286", address: "101 N 14th St, 17th Floor, Richmond, VA 23219", zip: "23219",
    desc: "Virginia Veterans Services Foundation — public-private 501(c)(3) raising funds for the Virginia Veterans Care Centers and Virginia War Memorial; administers Veterans Care Center resident-needs grants and emergency-relief micro-grants for indigent Virginia veterans referred by DVS benefits offices." },

  // ============== C — VA MEDICAL CENTERS (3) ==============
  { section: "VAMC", title: "Hunter Holmes McGuire VA Medical Center (Richmond)",
    cat: "healthcare", sub: "VA Medical Centers",
    city: "Richmond", website_url: "https://www.va.gov/richmond-health-care/",
    source_name: "U.S. Department of Veterans Affairs", source_type: "federal_government",
    phone: "804-675-5000", address: "1201 Broad Rock Blvd, Richmond, VA 23249", zip: "23249",
    desc: "Hunter Holmes McGuire VAMC — VA's flagship Virginia tertiary-care hospital and Polytrauma Rehabilitation Center (one of only 5 in the U.S.); 416 beds; serves central VA, southside VA, and parts of NC. Spinal-cord injury center, transplant program, women's health, and 11 community-based outpatient clinics across central VA." },

  { section: "VAMC", title: "Hampton VA Medical Center",
    cat: "healthcare", sub: "VA Medical Centers",
    city: "Hampton", website_url: "https://www.va.gov/hampton-health-care/",
    source_name: "U.S. Department of Veterans Affairs", source_type: "federal_government",
    phone: "757-722-9961", address: "100 Emancipation Dr, Hampton, VA 23667", zip: "23667",
    desc: "Hampton VAMC — VA Medical Center serving Hampton Roads, Eastern Shore, and northeastern NC; 468 beds; full-service tertiary care including PTSD residential program, Polytrauma Network Site, and women's clinic. Affiliated CBOCs in Virginia Beach, Chesapeake, and Albemarle (NC)." },

  { section: "VAMC", title: "Salem VA Medical Center",
    cat: "healthcare", sub: "VA Medical Centers",
    city: "Salem", website_url: "https://www.va.gov/salem-health-care/",
    source_name: "U.S. Department of Veterans Affairs", source_type: "federal_government",
    phone: "540-982-2463", address: "1970 Roanoke Blvd, Salem, VA 24153", zip: "24153",
    desc: "Salem VAMC — VA Medical Center serving Western Virginia, southern WV, and Appalachian NC; 162 beds; primary care, mental health residential rehab, polytrauma support clinic, and CBOCs in Danville, Lynchburg, Tazewell, Staunton, and Wytheville." },

  // ============== D — STATE VETERANS CARE CENTERS (3) ==============
  { section: "SVCC", title: "Sitter & Barfoot Veterans Care Center (Richmond)",
    cat: "end-of-life-services", sub: "Assisted Living & Nursing Homes",
    city: "Richmond", website_url: "https://www.dvs.virginia.gov/",
    source_name: "Virginia DVS", source_type: "state_government",
    phone: "804-371-8000", address: "1601 Broad Rock Blvd, Richmond, VA 23224", zip: "23224",
    desc: "Sitter & Barfoot Veterans Care Center — DVS-operated 160-bed long-term-care + 40-bed dementia care state veterans home on the McGuire VAMC campus in Richmond. Skilled nursing, hospice, and assisted living for honorably discharged Virginia veterans. Per-diem subsidized by VA; sliding-scale resident contribution." },

  { section: "SVCC", title: "Virginia Veterans Care Center (Roanoke)",
    cat: "end-of-life-services", sub: "Assisted Living & Nursing Homes",
    city: "Roanoke", website_url: "https://www.dvs.virginia.gov/",
    source_name: "Virginia DVS", source_type: "state_government",
    phone: "540-982-2860", address: "4550 Shenandoah Ave NW, Roanoke, VA 24017", zip: "24017",
    desc: "Virginia Veterans Care Center (VVCC) — DVS-operated 240-bed state veterans home in Roanoke; skilled nursing, dementia, and domiciliary (assisted living) care for honorably discharged Virginia veterans. Per-diem subsidized by VA; serves western Virginia." },

  { section: "SVCC", title: "Jones & Cabacoy Veterans Care Center (Virginia Beach)",
    cat: "end-of-life-services", sub: "Assisted Living & Nursing Homes",
    city: "Virginia Beach", website_url: "https://www.dvs.virginia.gov/",
    source_name: "Virginia DVS", source_type: "state_government",
    phone: "757-961-0500", address: "5550 Old Providence Rd, Virginia Beach, VA 23464", zip: "23464",
    desc: "Jones & Cabacoy Veterans Care Center — DVS-operated 128-bed skilled-nursing + 32-bed dementia state veterans home in Virginia Beach (opened 2024); serves Hampton Roads honorably discharged veterans. Per-diem subsidized by VA; named for two Virginia Medal of Honor recipients." },

  // ============== E — VA REGIONAL OFFICE & NATIONAL CEMETERIES (4) ==============
  { section: "VARO", title: "Roanoke VA Regional Office",
    cat: "va-benefits", sub: "VA Enrollment & General Benefits Navigation",
    city: "Roanoke", website_url: "https://www.benefits.va.gov/roanoke/",
    source_name: "U.S. Department of Veterans Affairs — VBA", source_type: "federal_government",
    phone: "800-827-1000", address: "116 N Jefferson St, Roanoke, VA 24016", zip: "24016",
    desc: "Roanoke VA Regional Office — VBA regional office adjudicating disability compensation, pension, education (GI Bill), VR&E, and home-loan benefits for all 8.1 million claims from veterans residing in Virginia. Public contact center, in-person walk-in claims help, accredited representatives on-site." },

  { section: "CEM", title: "Quantico National Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    city: "Triangle", website_url: "https://www.cem.va.gov/cems/nchp/quantico.asp",
    source_name: "VA National Cemetery Administration", source_type: "federal_government",
    phone: "703-221-2183", address: "18424 Joplin Rd, Triangle, VA 22172", zip: "22172",
    desc: "Quantico National Cemetery — VA National Cemetery Administration burial site on 725 acres adjacent to Marine Corps Base Quantico; open for new burials; military funeral honors available; pre-need eligibility determinations through NCA scheduling office." },

  { section: "CEM", title: "Culpeper National Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    city: "Culpeper", website_url: "https://www.cem.va.gov/cems/nchp/culpeper.asp",
    source_name: "VA National Cemetery Administration", source_type: "federal_government",
    phone: "540-825-0027", address: "305 US Avenue, Culpeper, VA 22701", zip: "22701",
    desc: "Culpeper National Cemetery — VA National Cemetery Administration site established 1867; open for cremated remains and casketed burials in newer sections; military funeral honors available; serves north-central Virginia." },

  { section: "CEM", title: "Hampton National Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    city: "Hampton", website_url: "https://www.cem.va.gov/cems/nchp/hampton.asp",
    source_name: "VA National Cemetery Administration", source_type: "federal_government",
    phone: "757-723-7104", address: "Cemetery Rd & Marshall Ave, Hampton, VA 23667", zip: "23667",
    desc: "Hampton National Cemetery — VA National Cemetery Administration site (two sections: original 1862 grounds + Phoebus annex); cremated-remains burials only; military funeral honors available; serves Hampton Roads veterans." },

  // ============== F — STATEWIDE VSOs (5) ==============
  { section: "VSO", title: "American Legion — Department of Virginia",
    cat: "community-support", sub: "American Legion Posts",
    city: "Richmond", website_url: "https://www.valegion.org/",
    source_name: "American Legion Department of Virginia", source_type: "nonprofit",
    phone: "804-353-6606", address: "1708 Commonwealth Ave, Richmond, VA 23230", zip: "23230",
    desc: "American Legion Department of Virginia — 285+ posts statewide; Virginia's largest VSO; VA-accredited service officers file disability claims free for any veteran; Boys/Girls State, oratorical scholarships, Legion Riders, Sons of the American Legion, and post-based fellowship for VA veterans." },

  { section: "VSO", title: "VFW — Department of Virginia",
    cat: "community-support", sub: "VFW Posts",
    city: "Richmond", website_url: "https://www.vfwva.org/",
    source_name: "VFW Department of Virginia", source_type: "nonprofit",
    phone: "804-353-7910", address: "5145 W Broad St, Richmond, VA 23230", zip: "23230",
    desc: "Veterans of Foreign Wars Department of Virginia — 130+ posts statewide; eligibility for veterans of overseas combat zones; VA-accredited service officers at department HQ + select posts file disability claims free; Voice of Democracy / Patriot's Pen scholarships, military-relief grants." },

  { section: "VSO", title: "Disabled American Veterans of Virginia (DAV-VA)",
    cat: "disabled-veterans", sub: "Disability Benefits & Claims",
    city: "Sandston", website_url: "https://www.dav.org/find-your-local-office/?st=VA",
    source_name: "DAV Department of Virginia", source_type: "nonprofit",
    phone: "804-737-7137", address: "PO Box 8163, Richmond, VA 23223", zip: "23223",
    desc: "Disabled American Veterans Department of Virginia — 50+ chapters statewide; DAV National Service Officers stationed at the Roanoke VA Regional Office file disability/appeal claims free for any veteran; DAV Transportation Network volunteer drivers to VA medical appointments." },

  { section: "VSO", title: "AMVETS — Department of Virginia",
    cat: "community-support", sub: "Veteran Service Organizations",
    city: "Richmond", website_url: "https://amvets.org/",
    source_name: "AMVETS Department of Virginia", source_type: "nonprofit",
    address: "Richmond, VA",
    desc: "AMVETS (American Veterans) Department of Virginia — congressionally chartered VSO open to all who honorably served (active duty, Guard, Reserve); statewide chapters; VA-accredited service officers; community service, scholarships, and post-based fellowship for VA veterans." },

  { section: "VSO", title: "Vietnam Veterans of America — Virginia State Council",
    cat: "community-support", sub: "Veteran Service Organizations",
    city: "Richmond", website_url: "https://vva.org/",
    source_name: "Vietnam Veterans of America — VA State Council", source_type: "nonprofit",
    address: "Virginia State Council, Richmond, VA",
    desc: "VVA Virginia State Council — congressionally chartered VSO for Vietnam-era veterans (1961-1975) and families; ~25 chapters statewide; advocacy on Agent Orange, PTSD, MIA/POW; VA-accredited service officers file claims free; outreach to incarcerated veterans." },

  // ============== G — STATE AGENCIES SERVING VETERANS (4) ==============
  { section: "STATE-AGY", title: "Virginia Employment Commission (VEC) — Veterans Employment Services",
    cat: "employment", sub: "DVOP / Workforce Programs",
    city: "Richmond", website_url: "https://www.vec.virginia.gov/",
    source_name: "Virginia Employment Commission", source_type: "state_government",
    phone: "866-832-2363", address: "6606 W Broad St, Richmond, VA 23230", zip: "23230",
    desc: "Virginia Employment Commission — operates 35 Virginia Career Works centers statewide; DVOP (Disabled Veterans' Outreach Program) and LVER (Local Veterans' Employment Representative) staff at each center serve VA veterans first; veterans get 24-hour priority on Virginia Workforce Connection job postings." },

  { section: "STATE-AGY", title: "Virginia Housing (VHDA)",
    cat: "financial", sub: "VA Loans",
    city: "Richmond", website_url: "https://www.virginiahousing.com/",
    source_name: "Virginia Housing Development Authority", source_type: "state_government",
    phone: "804-782-1986", address: "601 S Belvidere St, Richmond, VA 23220", zip: "23220",
    desc: "Virginia Housing (formerly VHDA) — Virginia's affordable-housing finance agency; VA-loan eligible products with down-payment assistance grants up to 2.5%, free first-time-homebuyer classes, and Mortgage Credit Certificate (MCC) tax credit pairing with VA loans for Virginia veteran first-time buyers." },

  { section: "STATE-AGY", title: "State Council of Higher Education for Virginia (SCHEV) — Military & Veteran Education",
    cat: "education", sub: "Veteran Student Services",
    city: "Richmond", website_url: "https://www.schev.edu/",
    source_name: "SCHEV", source_type: "state_government",
    phone: "804-225-2600", address: "101 N 14th St, 9th Floor, Richmond, VA 23219", zip: "23219",
    desc: "State Council of Higher Education for Virginia — coordinating board for Virginia's 39 public + 100+ private colleges; State Approving Agency for GI Bill (approves Virginia institutions, certifies on-the-job/apprenticeship programs); maintains military/veteran-student resource directory and VMSDEP eligibility coordination." },

  { section: "STATE-AGY", title: "Virginia Department of Housing and Community Development (DHCD)",
    cat: "housing", sub: "Homeless Veteran Services",
    city: "Richmond", website_url: "https://www.dhcd.virginia.gov/",
    source_name: "Virginia DHCD", source_type: "state_government",
    phone: "804-371-7000", address: "600 E Main St, Suite 300, Richmond, VA 23219", zip: "23219",
    desc: "Virginia DHCD — administers Virginia's Continuum of Care, Homeless Solutions Grant, ESG, and Housing Trust Fund; partners with VA on HUD-VASH placements and SSVF rapid-rehousing for Virginia homeless veterans; oversees 17 regional CoC lead agencies covering all VA counties." },

  // ============== H — STATEWIDE NONPROFITS (6) ==============
  { section: "NP", title: "Virginia 211",
    cat: "community-support", sub: "Veteran Outreach Programs",
    city: "Roanoke", website_url: "https://www.211virginia.org/",
    source_name: "Council of Community Services", source_type: "nonprofit",
    phone: "800-230-6977", address: "502 Campbell Ave SW, Roanoke, VA 24016", zip: "24016",
    desc: "Virginia 211 — statewide free information & referral helpline (dial 2-1-1) connecting Virginia residents — including veterans and military families — to ~25,000 vetted local services covering housing, food, mental health, utilities, healthcare, and crisis support. 24/7 multilingual." },

  { section: "NP", title: "Boulder Crest Foundation (Virginia HQ — Bluemont)",
    cat: "mental-health", sub: "PTSD & Trauma Support",
    city: "Bluemont", website_url: "https://bouldercrest.org/",
    source_name: "Boulder Crest Foundation", source_type: "nonprofit",
    phone: "540-554-2727", address: "18370 Bluemont Village Ln, Bluemont, VA 20135", zip: "20135",
    desc: "Boulder Crest Foundation — Virginia-headquartered (Bluemont, Loudoun County) nonprofit pioneering Posttraumatic Growth (PTG) for combat veterans and first responders; Warrior PATHH 7-day residential program at no cost; nationally replicated curriculum, but the original VA retreat remains active." },

  { section: "NP", title: "Operation Renewed Hope Foundation (Arlington)",
    cat: "housing", sub: "Homeless Veteran Services",
    city: "Arlington", website_url: "https://www.operationrenewedhopefoundation.org/",
    source_name: "Operation Renewed Hope Foundation", source_type: "nonprofit",
    phone: "703-887-7846", address: "PO Box 41129, Arlington, VA 22204", zip: "22204",
    desc: "Operation Renewed Hope Foundation — Virginia-based nonprofit focused on permanent-supportive-housing placement for homeless veterans across Virginia, DC, and Maryland; partners with VA HUD-VASH; furnishes apartments, provides case management, and bridges to employment." },

  { section: "NP", title: "ServiceSource Virginia (Oakton HQ)",
    cat: "disabled-veterans", sub: "Employment & Vocational Rehabilitation",
    city: "Oakton", website_url: "https://www.servicesource.org/",
    source_name: "ServiceSource", source_type: "nonprofit",
    phone: "571-226-4400", address: "10467 White Granite Dr, Oakton, VA 22124", zip: "22124",
    desc: "ServiceSource — Virginia-headquartered (Oakton, Fairfax County) nonprofit serving people with disabilities including disabled veterans across VA/DC/MD/NC/FL/DE; AbilityOne federal-contract employment placements, vocational evaluation, supported employment, and assistive-tech services for VA-rated and SSDI-eligible Virginia veterans." },

  { section: "NP", title: "USO Hampton Roads & Central Virginia",
    cat: "community-support", sub: "Veteran Outreach Programs",
    city: "Hampton", website_url: "https://hrcv.uso.org/",
    source_name: "USO Hampton Roads & Central Virginia", source_type: "nonprofit",
    phone: "757-451-9994", address: "1799 Reginald Dr, Hampton, VA 23663", zip: "23663",
    desc: "USO Hampton Roads & Central Virginia — covers Norfolk Naval Station, Joint Base Langley-Eustis, JEB Little Creek-Fort Story, NSA Hampton Roads, Quantico, and Fort Gregg-Adams; airport and base centers, transition workshops, family events, deployment care packages for Virginia service members and families." },

  { section: "NP", title: "Virginia War Memorial",
    cat: "community-support", sub: "Veteran Service Organizations",
    city: "Richmond", website_url: "https://vawarmemorial.org/",
    source_name: "Virginia War Memorial Foundation", source_type: "state_government",
    phone: "804-786-2060", address: "621 S Belvidere St, Richmond, VA 23220", zip: "23220",
    desc: "Virginia War Memorial — DVS-overseen state memorial honoring Virginia's nearly 12,000 service members killed since WWII; Shrine of Memory walls, Paul & Phyllis Galanti Education Center, Veterans Art Studio, and free oral-history library accessible to Virginia veterans, families, students, and researchers." },

  // ============== I — STATEWIDE LEGAL (4) ==============
  { section: "LEGAL", title: "Virginia Legal Aid Society (VLAS)",
    cat: "legal", sub: "Legal Aid Services",
    city: "Lynchburg", website_url: "https://www.vlas.org/",
    source_name: "Virginia Legal Aid Society", source_type: "nonprofit",
    phone: "866-534-5243", address: "513 Church St, Lynchburg, VA 24504", zip: "24504",
    desc: "Virginia Legal Aid Society — civil legal aid covering 26 Central, Southside, and Western Virginia counties/cities; free representation in housing, family law, public benefits, consumer, and military discharge-upgrade matters for income-eligible Virginia veterans." },

  { section: "LEGAL", title: "Legal Aid Justice Center",
    cat: "legal", sub: "Legal Aid Services",
    city: "Charlottesville", website_url: "https://www.justice4all.org/",
    source_name: "Legal Aid Justice Center", source_type: "nonprofit",
    phone: "434-977-0553", address: "1000 Preston Ave, Suite A, Charlottesville, VA 22903", zip: "22903",
    desc: "Legal Aid Justice Center — civil legal aid + impact litigation organization with offices in Charlottesville, Richmond, Falls Church, and Petersburg; serves low-income Virginians (including veterans) on housing, immigration, civil-rights, consumer, and economic-justice matters." },

  { section: "LEGAL", title: "Lewis B. Puller Jr. Veterans Benefits Clinic (William & Mary Law)",
    cat: "legal", sub: "Veterans Legal Clinics",
    city: "Williamsburg", website_url: "https://law.wm.edu/academics/programs/jd/electives/clinics/veterans/",
    source_name: "William & Mary Law School", source_type: "nonprofit",
    phone: "757-221-7443", address: "613 South Henry St, Williamsburg, VA 23185", zip: "23185",
    desc: "Lewis B. Puller Jr. Veterans Benefits Clinic — William & Mary Law School clinic providing free representation to Virginia veterans and their dependents on VA disability claims, appeals at the Board of Veterans' Appeals, discharge upgrades, and military records corrections. Statewide caseload." },

  { section: "LEGAL", title: "Virginia State Bar — Lawyer Referral & Pro Bono",
    cat: "legal", sub: "Pro Bono Legal Services",
    city: "Richmond", website_url: "https://www.vsb.org/",
    source_name: "Virginia State Bar", source_type: "state_government",
    phone: "804-775-0500", address: "1111 E Main St, Suite 700, Richmond, VA 23219", zip: "23219",
    desc: "Virginia State Bar — administers the statewide Lawyer Referral Service (low-cost initial consultation), Senior Lawyers Conference Pro Bono initiatives, and the VSB Military Law Section; consumer-protection complaint intake and disciplinary oversight of all Virginia attorneys." },

  // ============== J — CRISIS / MENTAL HEALTH STATEWIDE (3) ==============
  { section: "CRISIS-MH", title: "Virginia DBHDS — Crisis Services & 988",
    cat: "crisis-help", sub: "Suicide Prevention",
    city: "Richmond", website_url: "https://dbhds.virginia.gov/",
    source_name: "Virginia DBHDS", source_type: "state_government",
    phone: "988", address: "1220 Bank St, Richmond, VA 23219", zip: "23219",
    desc: "Virginia Department of Behavioral Health and Developmental Services — administers Virginia's Marcus Alert + 988 Suicide & Crisis Lifeline statewide rollout; Regional Crisis Call Centers, Mobile Crisis Teams in every region, and Crisis Receiving Centers/Stabilization Units serving Virginia veterans and civilians 24/7." },

  { section: "CRISIS-MH", title: "Steven A. Cohen Military Family Clinic at Endeavors (Virginia Beach)",
    cat: "mental-health", sub: "Counseling & Therapy",
    city: "Virginia Beach", website_url: "https://www.cohenveteransnetwork.org/clinics/",
    source_name: "Cohen Veterans Network / Endeavors", source_type: "nonprofit",
    phone: "757-965-2200", address: "477 Viking Dr, Suite 401, Virginia Beach, VA 23452", zip: "23452",
    desc: "Steven A. Cohen Military Family Clinic at Endeavors — Cohen Veterans Network outpatient mental-health clinic in Virginia Beach serving post-9/11 veterans (any discharge status) and their families with low/no-cost evidence-based therapy for PTSD, depression, anxiety, transition stress, and family/relational issues. Telehealth available statewide." },

  { section: "CRISIS-MH", title: "Virginia Vet Centers (VA Readjustment Counseling)",
    cat: "mental-health", sub: "Vet Centers",
    city: "Richmond", website_url: "https://www.va.gov/find-locations/?facilityType=vet_center&state=VA",
    source_name: "U.S. Department of Veterans Affairs — RCS", source_type: "federal_government",
    phone: "877-927-8387", address: "Statewide — 8 Vet Centers in Virginia (Alexandria, Norfolk, Richmond, Roanoke, Virginia Beach, Lynchburg-Farmville, Fredericksburg, Charlottesville)", zip: "23219",
    desc: "Virginia Vet Centers — VA Readjustment Counseling Service community storefronts; free, confidential individual/group counseling for combat veterans, MST survivors, and bereaved families; no VA enrollment required, no medical record entry. 8 brick-and-mortar centers + Mobile Vet Center serving Virginia." },

  // ============== K — VIRGINIA NATIONAL GUARD (1) ==============
  { section: "GUARD", title: "Virginia National Guard — Family Programs",
    cat: "family-support", sub: "Military Family Support",
    city: "Sandston", website_url: "https://va.ng.mil/",
    source_name: "Virginia National Guard", source_type: "state_government",
    phone: "804-236-7800", address: "5001 Waller Rd, Sandston, VA 23150", zip: "23150",
    desc: "Virginia National Guard Family Programs — supports VANG soldiers/airmen and families through deployment cycles; Yellow Ribbon Reintegration events, child-and-youth services, financial-readiness counseling, military-spouse employment connections, and warm handoffs to DVS, VVFS, and Military OneSource." },

  // ============== L — VIRGINIA COMMUNITY COLLEGE SYSTEM (1) ==============
  { section: "EDU-SYS", title: "Virginia Community College System (VCCS) — Veterans Services",
    cat: "education", sub: "Veteran Student Services",
    city: "Richmond", website_url: "https://www.vccs.edu/",
    source_name: "Virginia Community College System", source_type: "state_government",
    phone: "804-819-4901", address: "300 Arboretum Pl, Suite 200, Richmond, VA 23236", zip: "23236",
    desc: "Virginia Community College System — 23 colleges + 40 campuses statewide; each VCCS college operates a SCO-certified GI Bill office and Veteran Student Services lounge; FastForward workforce credentials for in-demand Virginia jobs; transfer pathways to all VA public 4-year universities." },
];

(async () => {
  // ---------- PHASE 1 TASK #1: ensure VA state row exists (idempotent) ----------
  console.log(`\n[Phase 1 task #1] Ensuring Virginia row in states table…`);
  const { data: vaRow } = await supabaseAdmin.from("states").select("code, name").eq("code", "VA").maybeSingle();
  if (vaRow) {
    console.log(`  ✓ states.VA already exists (${(vaRow as any).name})`);
  } else {
    const { error: insErr } = await supabaseAdmin.from("states").insert({ code: "VA", name: "Virginia", active: true });
    if (insErr) {
      console.error(`  ✗ states.VA insert FAILED: ${insErr.message} — continuing anyway (states table is governance-only, not a hard FK).`);
    } else {
      console.log(`  ✓ states.VA inserted (Virginia, active=true)`);
    }
  }

  // ---------- PHASE 1 TASK #5: seed statewide top-tier veteran resources ----------
  await runSeed(ROWS, {
    state: "VA",
    commit: COMMIT,
    scriptName: "seed-va-p1.ts",
    urlCheckTimeoutMs: 12000,
    allowBrokenUrls: ALLOW_BROKEN_URLS,
    sectionLabels: {
      DVS: "DVS cabinet",
      "DVS-PROG": "DVS programs",
      VAMC: "VA medical ctrs",
      SVCC: "State vet homes",
      VARO: "VA regional ofc",
      CEM: "Nat'l cemeteries",
      VSO: "Statewide VSOs",
      "STATE-AGY": "State agencies",
      NP: "Statewide NPs",
      LEGAL: "Statewide legal",
      "CRISIS-MH": "Crisis/MH",
      GUARD: "VA Nat'l Guard",
      "EDU-SYS": "Edu system",
    },
  });
})().catch(e => { console.error(e); process.exit(1); });
