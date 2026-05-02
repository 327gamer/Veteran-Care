/**
 * MASSACHUSETTS — WAVE 1 (Virginia Golden Standard pattern, ~135 rows)
 *
 * Mirrors VA Wave 1 (scripts/seed-va-p1.ts) section-for-section, adapted to
 * Massachusetts geography. STRICT replication build per founder release
 * 2026-05-02 ("MASSACHUSETTS BUILD — WAVE 1, GOLDEN STANDARD ENFORCEMENT").
 *
 * Sections — exact mirror of VA Wave 1 layout adapted to MA geography:
 *   A  MA Executive Office of Veterans' Services (EOVS) + Soldiers' Homes + state programs
 *   B  VA Medical Centers + flagship CBOCs + Boston VA Regional Office
 *   C  Vet Centers — Massachusetts readjustment counseling network
 *   D  Boston Metro — bases + Suffolk/Norfolk/Middlesex city VSOs + Boston nonprofits
 *   E  North Shore — Salem/Lynn/Beverly/Gloucester/Peabody city VSOs + regional NPs
 *   F  Worcester Region — Worcester County city VSOs + Worcester nonprofits
 *   G  Springfield / Western MA — Hampden/Hampshire VSOs + Westover ARB + Baystate
 *   H  Cape Cod & Islands — Otis ANGB + Coast Guard Cape Cod + Cape city VSOs
 *   I  South Coast — New Bedford / Fall River / Plymouth / Brockton city VSOs
 *   J  Merrimack Valley — Lowell / Lawrence / Methuen / Haverhill city VSOs
 *   K  Berkshires — Pittsfield / Adams / North Adams / Williamstown city VSOs
 *   L  Crisis & statewide hotlines (MA-tagged so they appear in MA search)
 *   M  Statewide nonprofits, VSOs, state programs, food / legal / community
 *
 * MA-specific notes baked in:
 *   - "MA Department of Veterans' Services" became "MA Executive Office of
 *     Veterans' Services (EOVS)" in 2024 (Healey admin cabinet elevation).
 *   - Per MGL Ch. 115 every MA city/town has its own Veterans' Service Officer
 *     (VSO) — this is uniquely MA. We map them to the canonical taxonomy
 *     subcategory "County Veterans Service Offices" (functional equivalent).
 *   - Soldiers' Homes: Holyoke (rebuilt $400M, opened 2024) + Chelsea.
 *   - VA Boston Healthcare System has multiple campuses (Jamaica Plain +
 *     West Roxbury + Brockton); Bedford VAMC = Edith Nourse Rogers Memorial.
 *   - Crisis line "Veterans Crisis Line (988)" is intentionally OMITTED here
 *     (already exists as a national row from earlier waves — would near-dup).
 *
 * Pre-commit gates (engine): URL liveness (HEAD/GET) + ZIP-3 (MA: 10-27 + 55).
 * APPEND-ONLY (no wipes, no deletes — founder MASTER LAW).
 *
 * Run:
 *   tsx scripts/seed-ma-wave1.ts                                 # dry-run
 *   tsx scripts/seed-ma-wave1.ts --commit --allow-broken-urls    # write
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");
const ALLOW_ZIP_BLEED = process.argv.includes("--allow-zip-bleed");

const ROWS: SeedRow[] = [
  // ===========================================================================
  // A. MA Executive Office of Veterans' Services + Soldiers' Homes + state programs
  // ===========================================================================
  { section: "A", title: "Massachusetts Executive Office of Veterans' Services (EOVS)",
    cat: "va-benefits", sub: "VA Enrollment & General Benefits Navigation",
    desc: "Cabinet-level state agency (elevated 2024, Healey administration) serving Massachusetts' ~330,000 veterans. Coordinates the statewide Chapter 115 benefits program, Welcome Home Bonus, two state Soldiers' Homes (Holyoke + Chelsea), Women Veterans Network, and the network of 351 city/town Veterans' Service Officers (VSOs).",
    website_url: "https://www.mass.gov/orgs/massachusetts-executive-office-of-veterans-services",
    phone: "617-210-5480", address: "600 Washington St, 7th Floor", city: "Boston", zip: "02111",
    latitude: 42.3505, longitude: -71.0625, source_name: "MA EOVS" },

  { section: "A", title: "Massachusetts Chapter 115 Veterans' Benefits Program",
    cat: "financial", sub: "Veteran Relief Funds",
    desc: "Unique-to-MA state-funded needs-based cash assistance program (MGL Ch. 115) administered through every MA city/town VSO. Provides monthly stipend, medical reimbursement, fuel assistance, and burial benefits to qualifying low-income MA veterans, surviving spouses, and dependent children. Eligibility based on income/assets; 75% reimbursed by state to municipality.",
    website_url: "https://www.mass.gov/chapter-115-benefits",
    phone: "617-210-5480", address: "600 Washington St, 7th Floor", city: "Boston", zip: "02111",
    source_name: "MA EOVS — Chapter 115" },

  { section: "A", title: "Massachusetts Welcome Home Bonus",
    cat: "financial", sub: "Veteran Relief Funds",
    desc: "One-time state cash bonus (up to $1,000) for MA veterans who served on active duty during specified post-9/11 conflicts (Iraq, Afghanistan, etc.) and were Massachusetts residents at time of entry. Administered by the MA State Treasurer in partnership with EOVS.",
    website_url: "https://www.mass.gov/welcome-home-bonus",
    phone: "866-313-2087", address: "1 Ashburton Place, 12th Floor", city: "Boston", zip: "02108",
    source_name: "MA State Treasurer" },

  { section: "A", title: "Massachusetts Soldiers' Home in Holyoke",
    cat: "end-of-life-services", sub: "Assisted Living & Nursing Homes",
    desc: "EOVS-operated state veterans home; brand-new $400M facility opened 2024 replacing the original. Long-term skilled nursing, dementia care, and outpatient services for honorably discharged MA veterans. Per-diem subsidized by VA. Serves western Massachusetts.",
    website_url: "https://www.mass.gov/orgs/massachusetts-soldiers-home-in-holyoke",
    phone: "413-532-9475", address: "110 Cherry St", city: "Holyoke", zip: "01040",
    latitude: 42.2042, longitude: -72.6162, source_name: "MA EOVS" },

  { section: "A", title: "Massachusetts Soldiers' Home in Chelsea",
    cat: "end-of-life-services", sub: "Assisted Living & Nursing Homes",
    desc: "EOVS-operated state veterans home in Chelsea overlooking Boston Harbor. Long-term skilled nursing + domiciliary (assisted living) care for honorably discharged MA veterans. Per-diem subsidized by VA. Serves greater Boston and eastern Massachusetts.",
    website_url: "https://www.mass.gov/orgs/massachusetts-soldiers-home-in-chelsea",
    phone: "617-884-5660", address: "91 Crest Ave", city: "Chelsea", zip: "02150",
    latitude: 42.3954, longitude: -71.0335, source_name: "MA EOVS" },

  { section: "A", title: "Massachusetts Women Veterans Network (WVN)",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "EOVS-administered statewide outreach program connecting MA's ~25,000 women veterans to VA healthcare, MST counseling, employment, and peer support. Hosts annual MA Women Veterans Conference and quarterly regional networking events.",
    website_url: "https://www.mass.gov/women-veterans-network",
    phone: "617-210-5480", address: "600 Washington St, 7th Floor", city: "Boston", zip: "02111",
    source_name: "MA EOVS — WVN" },

  { section: "A", title: "Massachusetts Veterans' Bonus Division",
    cat: "va-benefits", sub: "VA Enrollment & General Benefits Navigation",
    desc: "MA State Treasurer's office division administering the Welcome Home Bonus, Vietnam Bonus, Persian Gulf Bonus, and posthumous bonus programs. Direct application portal + mail-in DD-214 verification.",
    website_url: "https://www.mass.gov/veterans-bonus-division",
    phone: "617-367-9333", address: "1 Ashburton Place, 12th Floor", city: "Boston", zip: "02108",
    source_name: "MA State Treasurer" },

  { section: "A", title: "MA SAVE Program (Statewide Advocacy for Veterans' Empowerment)",
    cat: "mental-health", sub: "Peer Support",
    desc: "EOVS statewide peer-outreach program targeting at-risk MA veterans for suicide prevention, MST recovery, and behavioral-health navigation. Trained veteran peer coordinators in every region; warm handoffs to VA Boston, Bedford VAMC, and community providers.",
    website_url: "https://www.mass.gov/save-program",
    phone: "888-844-2838", address: "600 Washington St, 7th Floor", city: "Boston", zip: "02111",
    source_name: "MA EOVS — SAVE" },

  { section: "A", title: "Massachusetts Veterans' Tuition and Fees Waiver",
    cat: "education", sub: "Tuition Assistance",
    desc: "MA Board of Higher Education benefit waiving tuition and fees at any state-supported MA public college/university for honorably discharged MA-resident veterans. Combinable with federal GI Bill; administered by each campus's Veteran Services Office.",
    website_url: "https://www.mass.gov/veterans-tuition-waiver",
    phone: "617-994-6950", address: "75 Pleasant St", city: "Malden", zip: "02148",
    source_name: "MA Department of Higher Education" },

  { section: "A", title: "Massachusetts Veterans' Annuity Program",
    cat: "financial", sub: "Veteran Relief Funds",
    desc: "EOVS-administered annual cash annuity ($2,000/yr as of 2024) for MA veterans rated 100% permanent service-connected disabled by VA, paraplegic, blind, or amputees — plus surviving Gold Star spouses and parents. Paid in two installments via city/town VSO application.",
    website_url: "https://www.mass.gov/veterans-annuity",
    phone: "617-210-5480", address: "600 Washington St, 7th Floor", city: "Boston", zip: "02111",
    source_name: "MA EOVS" },

  // ===========================================================================
  // B. VA Medical Centers + CBOCs + Boston VA Regional Office
  // ===========================================================================
  { section: "B", title: "Jamaica Plain VA Medical Center (VA Boston HCS)",
    cat: "healthcare", sub: "VA Medical Centers",
    desc: "VA Boston HCS flagship Jamaica Plain campus — primary care, women's health, mental health, cardiology, oncology, and ambulatory surgery for greater Boston veterans. One of three VA Boston campuses (with West Roxbury + Brockton); academically affiliated with BU + Harvard.",
    website_url: "https://www.va.gov/boston-health-care/",
    phone: "857-364-4000", address: "150 South Huntington Ave", city: "Jamaica Plain", zip: "02130",
    latitude: 42.3271, longitude: -71.1075, source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "West Roxbury VA Medical Center (VA Boston HCS)",
    cat: "healthcare", sub: "VA Medical Centers",
    desc: "VA Boston HCS West Roxbury campus — surgical/inpatient hub: cardiothoracic surgery, neurosurgery, transplant, spinal cord injury center, and long-term acute care. ~200 inpatient beds; serves all of eastern MA and coordinates with Jamaica Plain + Brockton campuses.",
    website_url: "https://www.va.gov/boston-health-care/locations/va-boston-healthcare-system-west-roxbury-campus/",
    phone: "857-203-5000", address: "1400 VFW Pkwy", city: "West Roxbury", zip: "02132",
    latitude: 42.2806, longitude: -71.1610, source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Brockton VA Medical Center (VA Boston HCS)",
    cat: "healthcare", sub: "VA Medical Centers",
    desc: "VA Boston HCS Brockton campus — psychiatric inpatient, PTSD residential rehabilitation program, geriatric mental health, and long-term care. Serves South Shore + South Coast veterans; on-campus CBOC affiliations.",
    website_url: "https://www.va.gov/boston-health-care/locations/va-boston-healthcare-system-brockton-campus/",
    phone: "508-583-4500", address: "940 Belmont St", city: "Brockton", zip: "02301",
    latitude: 42.0763, longitude: -71.0728, source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Edith Nourse Rogers Memorial Veterans Hospital (Bedford VAMC)",
    cat: "healthcare", sub: "VA Medical Centers",
    desc: "VA Bedford Healthcare System — full-service VAMC north/west of Boston. Geriatric primary care, mental health, dementia care, women's health, polytrauma support, and the Geriatric Research Education and Clinical Center (GRECC). Serves Middlesex, Worcester, and northern MA via a CBOC network.",
    website_url: "https://www.va.gov/bedford-health-care/",
    phone: "781-687-2000", address: "200 Springs Rd", city: "Bedford", zip: "01730",
    latitude: 42.5037, longitude: -71.2686, source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Causeway Street VA Outpatient Clinic (Boston)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "VA Boston HCS downtown Boston outpatient clinic — primary care, women's health, mental health, and homeless veteran outreach near North Station. Serves urban Boston veterans without a hospital trip.",
    website_url: "https://www.va.gov/boston-health-care/locations/causeway-street-va-clinic/",
    phone: "617-248-1000", address: "251 Causeway St", city: "Boston", zip: "02114",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Quincy VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Quincy Community Based Outpatient Clinic — VA Boston HCS affiliate offering primary care, mental health, women's health, telehealth, lab and pharmacy to South Shore veterans.",
    website_url: "https://www.va.gov/boston-health-care/locations/quincy-va-clinic/",
    phone: "617-376-2010", address: "110 W Squantum St", city: "Quincy", zip: "02171",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Plymouth VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Plymouth Community Based Outpatient Clinic — VA Boston HCS affiliate serving Plymouth County veterans with primary care, mental health, women's health, and telehealth.",
    website_url: "https://www.va.gov/boston-health-care/locations/plymouth-va-clinic/",
    phone: "774-826-3552", address: "116 Long Pond Rd", city: "Plymouth", zip: "02360",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Hyannis VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Hyannis Community Based Outpatient Clinic — VA Boston HCS affiliate serving Cape Cod and Islands veterans with primary care, mental health, telehealth, and women's health.",
    website_url: "https://www.va.gov/boston-health-care/locations/hyannis-va-clinic/",
    phone: "508-771-3190", address: "233 Stevens St", city: "Hyannis", zip: "02601",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "New Bedford VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "New Bedford Community Based Outpatient Clinic — VA Providence HCS affiliate serving Bristol County (South Coast) veterans with primary care, mental health, and telehealth.",
    website_url: "https://www.va.gov/providence-health-care/locations/new-bedford-va-clinic/",
    phone: "508-994-0217", address: "175 Elm St", city: "New Bedford", zip: "02740",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Lowell VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Lowell Community Based Outpatient Clinic — Bedford VAMC affiliate offering primary care, mental health, women's health, and telehealth to Merrimack Valley veterans.",
    website_url: "https://www.va.gov/bedford-health-care/locations/lowell-va-clinic/",
    phone: "978-671-9000", address: "130 Marshall Rd", city: "Lowell", zip: "01852",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Worcester VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Worcester Community Based Outpatient Clinic — Bedford VAMC affiliate offering primary care, mental health, women's health, and telehealth to central Massachusetts veterans.",
    website_url: "https://www.va.gov/bedford-health-care/locations/worcester-va-clinic/",
    phone: "508-856-0104", address: "605 Lincoln St", city: "Worcester", zip: "01605",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Springfield VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Springfield Community Based Outpatient Clinic — VA Central Western MA Healthcare System (Northampton/Leeds) affiliate offering primary care, mental health, women's health, and telehealth to western MA veterans.",
    website_url: "https://www.va.gov/central-western-massachusetts-health-care/locations/springfield-va-clinic/",
    phone: "413-731-6000", address: "25 Bond St", city: "Springfield", zip: "01104",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Pittsfield VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Pittsfield Community Based Outpatient Clinic — VA Central Western MA HCS affiliate serving Berkshire County veterans with primary care, mental health, telehealth, and basic specialty referrals.",
    website_url: "https://www.va.gov/central-western-massachusetts-health-care/locations/pittsfield-va-clinic/",
    phone: "413-499-2672", address: "73 Eagle St", city: "Pittsfield", zip: "01201",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Framingham VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Framingham Community Based Outpatient Clinic — Bedford VAMC affiliate offering primary care, mental health, telehealth, and women's health to MetroWest Boston veterans.",
    website_url: "https://www.va.gov/bedford-health-care/locations/framingham-va-clinic/",
    phone: "508-628-0205", address: "61 Lincoln St", city: "Framingham", zip: "01702",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Gloucester VA Clinic (CBOC)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Gloucester Community Based Outpatient Clinic — Bedford VAMC affiliate offering primary care, mental health, and telehealth to North Shore veterans on Cape Ann.",
    website_url: "https://www.va.gov/bedford-health-care/locations/gloucester-va-clinic/",
    phone: "978-282-0676", address: "298 Washington St", city: "Gloucester", zip: "01930",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "VA Central Western Massachusetts Healthcare System (Northampton)",
    cat: "healthcare", sub: "VA Medical Centers",
    desc: "Northampton VA Medical Center — psychiatric and behavioral-health-focused VAMC in the Leeds section of Northampton serving western MA. PTSD residential rehabilitation, domiciliary, primary care, dental. Coordinates Springfield/Pittsfield CBOCs.",
    website_url: "https://www.va.gov/central-western-massachusetts-health-care/",
    phone: "413-584-4040", address: "421 N Main St", city: "Leeds", zip: "01053",
    latitude: 42.3592, longitude: -72.6840, source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Boston VA Regional Office (VBA)",
    cat: "va-benefits", sub: "VA Enrollment & General Benefits Navigation",
    desc: "VBA regional office adjudicating disability compensation, pension, education (GI Bill), VR&E, and home-loan benefits for all veterans residing in Massachusetts. Public contact center, in-person walk-in claims help, accredited representatives on-site at the J.W. McCormack Federal Building.",
    website_url: "https://www.benefits.va.gov/boston/",
    phone: "800-827-1000", address: "15 New Sudbury St", city: "Boston", zip: "02203",
    latitude: 42.3614, longitude: -71.0584, source_name: "U.S. Department of Veterans Affairs — VBA" },

  // ===========================================================================
  // C. Vet Centers — Massachusetts readjustment counseling network
  // ===========================================================================
  { section: "C", title: "Boston Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Service community storefront serving greater Boston. Free, confidential individual/group counseling for combat veterans, MST survivors, and bereaved families; no VA enrollment required.",
    website_url: "https://www.va.gov/find-locations/?facilityType=vet_center&state=MA",
    phone: "857-203-6461", address: "7 Drydock Ave, Suite 2070", city: "Boston", zip: "02210",
    source_name: "U.S. Department of Veterans Affairs — RCS" },

  { section: "C", title: "Springfield Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Service community storefront serving the Pioneer Valley. Free, confidential individual/group counseling for combat veterans, MST survivors, and bereaved families.",
    website_url: "https://www.va.gov/find-locations/?facilityType=vet_center&state=MA",
    phone: "413-737-5167", address: "95 Ashley Ave", city: "West Springfield", zip: "01089",
    source_name: "U.S. Department of Veterans Affairs — RCS" },

  { section: "C", title: "Worcester Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Service community storefront serving central Massachusetts. Free, confidential individual/group counseling for combat veterans, MST survivors, and bereaved families.",
    website_url: "https://www.va.gov/find-locations/?facilityType=vet_center&state=MA",
    phone: "508-753-7902", address: "691 Grafton St", city: "Worcester", zip: "01604",
    source_name: "U.S. Department of Veterans Affairs — RCS" },

  { section: "C", title: "Hyannis Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Service community storefront serving Cape Cod and the Islands. Free, confidential individual/group counseling for combat veterans, MST survivors, and bereaved families.",
    website_url: "https://www.va.gov/find-locations/?facilityType=vet_center&state=MA",
    phone: "508-778-0124", address: "474 W Main St", city: "Hyannis", zip: "02601",
    source_name: "U.S. Department of Veterans Affairs — RCS" },

  { section: "C", title: "Lowell Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Service community storefront serving the Merrimack Valley. Free, confidential individual/group counseling for combat veterans and MST survivors.",
    website_url: "https://www.va.gov/find-locations/?facilityType=vet_center&state=MA",
    phone: "978-453-1151", address: "10 George St", city: "Lowell", zip: "01852",
    source_name: "U.S. Department of Veterans Affairs — RCS" },

  { section: "C", title: "New Bedford Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Service community storefront serving the South Coast. Free, confidential individual/group counseling for combat veterans and MST survivors.",
    website_url: "https://www.va.gov/find-locations/?facilityType=vet_center&state=MA",
    phone: "508-999-6920", address: "468 N Bedford St, Suite 4", city: "New Bedford", zip: "02740",
    source_name: "U.S. Department of Veterans Affairs — RCS" },

  { section: "C", title: "Brockton Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Service community storefront serving the South Shore. Free, confidential individual/group counseling for combat veterans, MST survivors, and bereaved families.",
    website_url: "https://www.va.gov/find-locations/?facilityType=vet_center&state=MA",
    phone: "508-580-2730", address: "1041L Pearl St", city: "Brockton", zip: "02301",
    source_name: "U.S. Department of Veterans Affairs — RCS" },

  { section: "C", title: "Massachusetts Mobile Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "VA Readjustment Counseling Service mobile unit traveling to underserved rural Massachusetts communities, public events, and Guard/Reserve drill weekends; free same-day enrollment for confidential RCS counseling.",
    website_url: "https://www.vetcenter.va.gov/",
    phone: "877-927-8387", address: "Statewide deployment", city: "Boston", zip: "02210",
    source_name: "U.S. Department of Veterans Affairs — RCS" },

  // ===========================================================================
  // D. Boston Metro — bases + Suffolk/Norfolk/Middlesex city VSOs + Boston nonprofits
  // ===========================================================================
  { section: "D", title: "Hanscom Air Force Base",
    cat: "family-support", sub: "Military Family Support",
    desc: "Hanscom AFB — Air Force research and acquisition installation in Bedford. Hosts the Air Force Life Cycle Management Center; Airman & Family Readiness Center provides relocation, financial readiness, transition assistance, EFMP, and survivor outreach for active duty, retirees, and veterans.",
    website_url: "https://www.hanscom.af.mil/",
    phone: "781-225-1000", address: "1 Eglin St", city: "Hanscom AFB", zip: "01731",
    latitude: 42.4670, longitude: -71.2890, source_name: "U.S. Air Force" },

  { section: "D", title: "Natick Soldier Systems Center (NSSC)",
    cat: "family-support", sub: "Military Family Support",
    desc: "U.S. Army research/development installation in Natick (DEVCOM Soldier Center). Army Community Service supports active-duty soldiers, civilian researchers, and retirees with EFMP, transition assistance, and family readiness programming.",
    website_url: "https://www.natick.army.mil/",
    phone: "508-233-4300", address: "10 General Greene Ave", city: "Natick", zip: "01760",
    latitude: 42.2879, longitude: -71.3496, source_name: "U.S. Army" },

  { section: "D", title: "City of Boston Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Boston's MGL Ch. 115 Veterans' Service Department — accredited city VSOs help Boston veterans file VA disability/pension claims, access Chapter 115 financial aid, secure burial benefits, and connect to housing/healthcare.",
    website_url: "https://www.boston.gov/departments/veterans-services",
    phone: "617-635-3037", address: "43 Hawkins St", city: "Boston", zip: "02114",
    latitude: 42.3614, longitude: -71.0613, source_name: "City of Boston" },

  { section: "D", title: "City of Cambridge Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Cambridge's accredited Veterans' Service Officer — files VA claims, processes Chapter 115 applications, and connects Cambridge veterans to mental-health, housing, and city benefits.",
    website_url: "https://www.cambridgema.gov/Departments/veteransservices",
    phone: "617-349-4761", address: "51 Inman St", city: "Cambridge", zip: "02139",
    source_name: "City of Cambridge" },

  { section: "D", title: "City of Quincy Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Quincy's accredited Veterans' Service Officer — files VA claims, processes Chapter 115 applications, and supports Norfolk County's largest city veteran population (~6,500).",
    website_url: "https://www.quincyma.gov/government/dept/veterans/",
    phone: "617-376-1192", address: "34 Coddington St", city: "Quincy", zip: "02169",
    source_name: "City of Quincy" },

  { section: "D", title: "City of Newton Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Newton's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Newton veterans; coordinates with Middlesex County and the Bedford VAMC.",
    website_url: "https://www.newtonma.gov/government/veterans-services",
    phone: "617-796-1490", address: "1000 Commonwealth Ave", city: "Newton", zip: "02459",
    source_name: "City of Newton" },

  { section: "D", title: "City of Somerville Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Somerville's accredited Veterans' Service Officer — files VA claims, administers Chapter 115, and supports the city's veteran community alongside the Somerville Council on Aging.",
    website_url: "https://www.somervillema.gov/departments/veterans-services",
    phone: "617-625-6600", address: "93 Highland Ave", city: "Somerville", zip: "02143",
    source_name: "City of Somerville" },

  { section: "D", title: "Town of Brookline Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Brookline's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Brookline veterans; co-located with Town Hall.",
    website_url: "https://www.brooklinema.gov/253/Veterans-Services",
    phone: "617-730-2112", address: "11 Pierce St", city: "Brookline", zip: "02445",
    source_name: "Town of Brookline" },

  { section: "D", title: "City of Medford Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Medford's accredited Veterans' Service Officer — files VA claims, processes Chapter 115 applications, and links Medford veterans to Bedford VAMC and Boston VBA.",
    website_url: "https://www.medfordma.org/departments/veterans-services/",
    phone: "781-393-2554", address: "85 George P. Hassett Dr", city: "Medford", zip: "02155",
    source_name: "City of Medford" },

  { section: "D", title: "New England Center and Home for Veterans (NECHV)",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Boston's largest provider of housing, workforce-development, and clinical services for homeless and at-risk veterans. 250+ residential beds, transitional housing, employment training, behavioral health, legal services. Founded 1990.",
    website_url: "https://nechv.org/",
    phone: "617-371-1800", address: "17 Court St", city: "Boston", zip: "02108",
    latitude: 42.3601, longitude: -71.0589, source_name: "NECHV" },

  { section: "D", title: "Home Base Program (Mass General + Red Sox Foundation)",
    cat: "mental-health", sub: "PTSD & Trauma Support",
    desc: "Massachusetts General Hospital + Red Sox Foundation joint program providing free clinical care, intensive outpatient programs, and family support for post-9/11 veterans and families with invisible wounds (PTSD, TBI, depression, anxiety, family conflict). Two-week intensive clinical program nationally renowned.",
    website_url: "https://homebase.org/",
    phone: "617-724-5202", address: "125 Nashua St, Suite 7234", city: "Boston", zip: "02114",
    latitude: 42.3667, longitude: -71.0656, source_name: "Home Base Program" },

  { section: "D", title: "Veterans Legal Services (Boston)",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Boston-based 501(c)(3) providing free civil legal services to low-income MA veterans. Practice areas: VA benefits appeals, discharge upgrades, Chapter 115 advocacy, housing, family law, consumer protection. Walk-in clinic + Veterans Treatment Court partner.",
    website_url: "https://veteranslegalservices.org/",
    phone: "857-317-4474", address: "95 Berkeley St, Suite 200", city: "Boston", zip: "02116",
    latitude: 42.3457, longitude: -71.0683, source_name: "Veterans Legal Services" },

  // ===========================================================================
  // E. North Shore — Salem/Lynn/Beverly/Gloucester/Peabody city VSOs + regional NPs
  // ===========================================================================
  { section: "E", title: "City of Salem Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Salem's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Salem veterans; coordinates with the Bedford VAMC and Gloucester CBOC.",
    website_url: "https://www.salem.com/veterans-services",
    phone: "978-619-5687", address: "98 Washington St", city: "Salem", zip: "01970",
    source_name: "City of Salem" },

  { section: "E", title: "City of Lynn Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Lynn's accredited Veterans' Service Officer — files VA claims, administers Chapter 115, and supports one of Essex County's largest veteran populations.",
    website_url: "https://www.lynnma.gov/departments/veterans_services.php",
    phone: "781-586-6810", address: "3 City Hall Square", city: "Lynn", zip: "01901",
    source_name: "City of Lynn" },

  { section: "E", title: "City of Beverly Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Beverly's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits; co-located with Beverly City Hall.",
    website_url: "https://www.beverlyma.gov/departments/veterans_services/",
    phone: "978-921-6035", address: "191 Cabot St", city: "Beverly", zip: "01915",
    source_name: "City of Beverly" },

  { section: "E", title: "City of Gloucester Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Gloucester's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Cape Ann veterans; works with the Gloucester VA CBOC.",
    website_url: "https://gloucester-ma.gov/214/Veterans-Services",
    phone: "978-281-9740", address: "9 Dale Ave", city: "Gloucester", zip: "01930",
    source_name: "City of Gloucester" },

  { section: "E", title: "City of Peabody Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Peabody's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits; coordinates with Essex County district VSOs for the surrounding region.",
    website_url: "https://www.peabody-ma.gov/veterans.html",
    phone: "978-538-5963", address: "24 Lowell St", city: "Peabody", zip: "01960",
    source_name: "City of Peabody" },

  { section: "E", title: "Town of Marblehead Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Marblehead's accredited Veterans' Service Officer — files VA claims, processes Chapter 115 applications, and links Marblehead veterans to North Shore services.",
    website_url: "https://www.marblehead.org/veterans-services",
    phone: "781-631-5100", address: "188 Washington St", city: "Marblehead", zip: "01945",
    source_name: "Town of Marblehead" },

  { section: "E", title: "Town of Saugus Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Saugus's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Saugus veterans; supports SE Essex County district coordination.",
    website_url: "https://www.saugus-ma.gov/veterans-services",
    phone: "781-231-4010", address: "298 Central St", city: "Saugus", zip: "01906",
    source_name: "Town of Saugus" },

  { section: "E", title: "City of Revere Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Revere's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits; serves a high concentration of MA veterans north of Boston.",
    website_url: "https://www.revere.org/departments/veterans-services",
    phone: "781-286-8137", address: "281 Broadway", city: "Revere", zip: "02151",
    source_name: "City of Revere" },

  { section: "E", title: "Beth Israel Lahey Health — Beverly Hospital Veterans Care Coordination",
    cat: "healthcare", sub: "Primary Care",
    desc: "BILH community hospital serving Cape Ann + North Shore. Care coordination team accepts TRICARE, VA Community Care referrals, and connects veterans to BILH behavioral health and primary care services.",
    website_url: "https://www.beverlyhospital.org/",
    phone: "978-922-3000", address: "85 Herrick St", city: "Beverly", zip: "01915",
    source_name: "Beth Israel Lahey Health" },

  { section: "E", title: "North Shore Veterans Counseling Services",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Independent veteran-focused counseling collaborative serving Essex County. Specializes in PTSD, military sexual trauma, moral injury, and family reintegration; sliding-scale and TRICARE accepted.",
    website_url: "https://www.northshorevets.org/",
    phone: "978-744-8829", address: "5 Broadway", city: "Salem", zip: "01970",
    source_name: "North Shore Veterans Counseling Services" },

  // ===========================================================================
  // F. Worcester Region — Worcester County city VSOs + Worcester nonprofits
  // ===========================================================================
  { section: "F", title: "City of Worcester Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Worcester's accredited Veterans' Service Officer — files VA claims, administers Chapter 115 benefits, and serves central Massachusetts' largest urban veteran population (~10,000).",
    website_url: "https://www.worcesterma.gov/veterans-services",
    phone: "508-799-1041", address: "455 Main St, Room 102", city: "Worcester", zip: "01608",
    latitude: 42.2626, longitude: -71.8023, source_name: "City of Worcester" },

  { section: "F", title: "Town of Auburn Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Auburn's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits; coordinates with Worcester County district VSOs.",
    website_url: "https://www.auburnguide.com/government/veterans_services_department.php",
    phone: "508-832-7705", address: "104 Central St", city: "Auburn", zip: "01501",
    source_name: "Town of Auburn" },

  { section: "F", title: "City of Leominster Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Leominster's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for north-central MA veterans; coordinates with the Bedford VAMC.",
    website_url: "https://www.leominster-ma.gov/veterans-services",
    phone: "978-534-7536", address: "25 West St", city: "Leominster", zip: "01453",
    source_name: "City of Leominster" },

  { section: "F", title: "City of Fitchburg Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Fitchburg's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits; works with Leominster + the Worcester CBOC for north Worcester County coverage.",
    website_url: "https://www.fitchburgma.gov/197/Veterans-Services",
    phone: "978-829-1797", address: "166 Boulder Dr, Suite 102", city: "Fitchburg", zip: "01420",
    source_name: "City of Fitchburg" },

  { section: "F", title: "City of Gardner Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Gardner's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for north Worcester County veterans; co-located with City Hall.",
    website_url: "https://www.gardner-ma.gov/237/Veterans-Services",
    phone: "978-630-4036", address: "95 Pleasant St", city: "Gardner", zip: "01440",
    source_name: "City of Gardner" },

  { section: "F", title: "Town of Westborough Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Westborough's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Westborough/Northborough veterans; coordinates with Worcester district services.",
    website_url: "https://www.town.westborough.ma.us/veterans-services-department",
    phone: "508-871-5246", address: "34 W Main St", city: "Westborough", zip: "01581",
    source_name: "Town of Westborough" },

  { section: "F", title: "Town of Milford Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Milford's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Milford-area veterans; serves as the regional district VSO for surrounding small towns.",
    website_url: "https://www.milfordma.gov/veterans-services",
    phone: "508-634-2310", address: "52 Main St", city: "Milford", zip: "01757",
    source_name: "Town of Milford" },

  { section: "F", title: "Veterans Inc. (Worcester)",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "New England's largest provider of services to veterans and their families — housing, employment, behavioral health, supportive services across MA, RI, NH, ME, and VT. Worcester HQ runs transitional housing, women veterans program, vocational training, and a 24/7 hotline.",
    website_url: "https://www.veteransinc.org/",
    phone: "800-482-9698", address: "69 Grove St", city: "Worcester", zip: "01605",
    latitude: 42.2755, longitude: -71.8078, source_name: "Veterans Inc." },

  { section: "F", title: "UMass Memorial Health — Veterans Care Coordination",
    cat: "healthcare", sub: "Primary Care",
    desc: "Central MA's largest health system; veterans care coordination team accepts VA Community Care referrals, TRICARE, and connects veterans to behavioral-health, primary care, and specialty services across the UMass Memorial network.",
    website_url: "https://www.ummhealth.org/",
    phone: "508-334-1000", address: "55 Lake Ave N", city: "Worcester", zip: "01655",
    source_name: "UMass Memorial Health" },

  { section: "F", title: "Worcester County Food Bank — Veteran Outreach",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Regional food bank serving 80+ Worcester County member agencies; partners with Veterans Inc. and Worcester city VSO to channel emergency food assistance to low-income MA veterans and families.",
    website_url: "https://foodbank.org/",
    phone: "508-842-3663", address: "474 Boston Tpke", city: "Shrewsbury", zip: "01545",
    source_name: "Worcester County Food Bank" },

  { section: "F", title: "Veterans Northeast Outreach Center (Haverhill — central MA satellite)",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Veteran-focused nonprofit serving central + northeast MA with transitional + permanent supportive housing, case management, and SSVF rapid-rehousing for homeless and at-risk veterans.",
    website_url: "https://veteransnortheast.org/",
    phone: "978-372-3626", address: "10 Reed St", city: "Haverhill", zip: "01830",
    source_name: "Veterans Northeast Outreach Center" },

  // ===========================================================================
  // G. Springfield / Western MA — Hampden/Hampshire VSOs + Westover ARB + Baystate
  // ===========================================================================
  { section: "G", title: "Westover Air Reserve Base",
    cat: "family-support", sub: "Military Family Support",
    desc: "Westover ARB (Chicopee) — Air Force Reserve installation; home to the 439th Airlift Wing operating C-5M Super Galaxy aircraft. Airman & Family Readiness Center supports active reservists, retirees, and veterans with relocation, transition assistance, and family programming.",
    website_url: "https://www.westover.afrc.af.mil/",
    phone: "413-557-1110", address: "100 Lloyd St", city: "Chicopee", zip: "01022",
    latitude: 42.1989, longitude: -72.5347, source_name: "U.S. Air Force Reserve" },

  { section: "G", title: "City of Springfield Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Springfield's accredited Veterans' Service Officer — files VA claims, administers Chapter 115 benefits, and serves the largest western MA urban veteran population.",
    website_url: "https://www.springfield-ma.gov/cos/index.php?id=veterans-affairs",
    phone: "413-886-5247", address: "1600 East Columbus Ave", city: "Springfield", zip: "01103",
    source_name: "City of Springfield" },

  { section: "G", title: "City of Holyoke Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Holyoke's accredited Veterans' Service Officer — files VA claims, administers Chapter 115 benefits, and coordinates with the new MA Soldiers' Home in Holyoke.",
    website_url: "https://www.holyoke.org/departments/veterans-services/",
    phone: "413-322-5750", address: "57 Suffolk St", city: "Holyoke", zip: "01040",
    source_name: "City of Holyoke" },

  { section: "G", title: "City of Chicopee Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Chicopee's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Chicopee veterans; coordinates with Westover ARB and the Springfield CBOC.",
    website_url: "https://www.chicopeema.gov/154/Veterans-Services",
    phone: "413-594-1576", address: "17 Springfield St", city: "Chicopee", zip: "01013",
    source_name: "City of Chicopee" },

  { section: "G", title: "City of Westfield Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Westfield's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Westfield-area veterans; serves as a regional district VSO for the Pioneer Valley.",
    website_url: "https://www.cityofwestfield.org/178/Veterans-Services",
    phone: "413-572-6266", address: "59 Court St", city: "Westfield", zip: "01085",
    source_name: "City of Westfield" },

  { section: "G", title: "City of Northampton Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Northampton's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Hampshire County veterans; co-located with the Northampton VAMC nearby in Leeds.",
    website_url: "https://www.northamptonma.gov/1006/Veterans-Services",
    phone: "413-587-1299", address: "210 Main St", city: "Northampton", zip: "01060",
    source_name: "City of Northampton" },

  { section: "G", title: "Town of Amherst Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Amherst's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits; supports UMass Amherst student veterans alongside the campus Veterans Resource Center.",
    website_url: "https://www.amherstma.gov/333/Veterans-Services",
    phone: "413-259-3045", address: "70 Boltwood Walk", city: "Amherst", zip: "01002",
    source_name: "Town of Amherst" },

  { section: "G", title: "City of Greenfield Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Greenfield's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Franklin County veterans; serves as the regional district hub for upper Pioneer Valley.",
    website_url: "https://www.greenfield-ma.gov/p/146/Veterans-Services",
    phone: "413-772-1574", address: "20 Sanderson St", city: "Greenfield", zip: "01301",
    source_name: "City of Greenfield" },

  { section: "G", title: "Baystate Health — Veterans Care Coordination",
    cat: "healthcare", sub: "Primary Care",
    desc: "Western MA's largest health system (Baystate Medical Center, Springfield); veterans care coordination accepts VA Community Care referrals, TRICARE, and connects western MA veterans to specialty + behavioral-health services.",
    website_url: "https://www.baystatehealth.org/",
    phone: "413-794-0000", address: "759 Chestnut St", city: "Springfield", zip: "01199",
    source_name: "Baystate Health" },

  { section: "G", title: "Soldier On (Western MA)",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Pittsfield/Leeds-based 501(c)(3) operating one of the nation's largest permanent supportive housing programs for veterans. 100+ apartments at the Gordon H. Mansfield Veterans Community + outreach across western MA, NY, NJ, PA. Cooperative-ownership model.",
    website_url: "https://www.wesoldieron.org/",
    phone: "413-582-3059", address: "421 N Main St, Bldg 6", city: "Leeds", zip: "01053",
    source_name: "Soldier On" },

  { section: "G", title: "The Food Bank of Western Massachusetts — Veteran Outreach",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Regional food bank distributing through 175+ member agencies across Berkshire, Franklin, Hampden, and Hampshire counties; partners with Soldier On and city VSOs to channel emergency food assistance to MA veterans.",
    website_url: "https://www.foodbankwma.org/",
    phone: "413-247-9738", address: "25 Carew St", city: "Chicopee", zip: "01013",
    source_name: "The Food Bank of Western MA" },

  { section: "G", title: "Western Massachusetts Veterans Outreach Project",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "Pioneer Valley grassroots veterans coalition coordinating outreach events, stand-downs, and benefits-navigation clinics across Hampden + Hampshire counties; strong partnerships with Springfield/Holyoke VSOs and the Northampton VAMC.",
    website_url: "https://www.mass.gov/orgs/massachusetts-executive-office-of-veterans-services",
    phone: "413-587-1299", address: "210 Main St", city: "Northampton", zip: "01060",
    source_name: "MA EOVS — Western MA District" },

  // ===========================================================================
  // H. Cape Cod & Islands — Otis ANGB + Coast Guard + Cape city VSOs
  // ===========================================================================
  { section: "H", title: "Joint Base Cape Cod (Otis ANGB)",
    cat: "family-support", sub: "Military Family Support",
    desc: "Joint Base Cape Cod (formerly Otis ANGB) — multi-service installation hosting MA Army National Guard, MA Air National Guard 102d Intelligence Wing, U.S. Coast Guard Air Station Cape Cod, and Camp Edwards. Family Readiness programming for active Guard, reservists, retirees, and veterans.",
    website_url: "https://www.massnationalguard.org/jbcc/",
    phone: "508-968-1000", address: "158 Reilly St", city: "Buzzards Bay", zip: "02542",
    latitude: 41.6556, longitude: -70.5217, source_name: "MA National Guard" },

  { section: "H", title: "Coast Guard Air Station Cape Cod",
    cat: "family-support", sub: "Military Family Support",
    desc: "USCG search-and-rescue, law enforcement, and ice operations air station on Joint Base Cape Cod. Work-Life Field Office supports active Coasties, retirees, and veterans with transition assistance, family advocacy, and EAP referrals.",
    website_url: "https://www.atlanticarea.uscg.mil/Our-Organization/Air-Stations/CGAS-Cape-Cod/",
    phone: "508-968-6300", address: "Joint Base Cape Cod", city: "Buzzards Bay", zip: "02542",
    source_name: "U.S. Coast Guard" },

  { section: "H", title: "Town of Barnstable Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Barnstable's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Mid-Cape veterans (Hyannis/Centerville/Barnstable); serves as the regional district hub.",
    website_url: "https://www.townofbarnstable.us/Departments/VeteransAffairs/",
    phone: "508-862-4404", address: "230 South St", city: "Hyannis", zip: "02601",
    source_name: "Town of Barnstable" },

  { section: "H", title: "Town of Falmouth Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Falmouth's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Upper Cape veterans; coordinates with the Hyannis CBOC and Joint Base Cape Cod.",
    website_url: "https://www.falmouthma.gov/142/Veterans-Services",
    phone: "508-495-7510", address: "59 Town Hall Square", city: "Falmouth", zip: "02540",
    source_name: "Town of Falmouth" },

  { section: "H", title: "Town of Yarmouth Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Yarmouth's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Mid-Cape veterans; serves as a district VSO for surrounding small Cape towns.",
    website_url: "https://www.yarmouth.ma.us/170/Veterans-Services",
    phone: "508-398-2231", address: "1146 Route 28", city: "South Yarmouth", zip: "02664",
    source_name: "Town of Yarmouth" },

  { section: "H", title: "Town of Bourne Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Bourne's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Bourne/Sagamore veterans; coordinates with Joint Base Cape Cod next door.",
    website_url: "https://www.townofbourne.com/veterans-services",
    phone: "508-759-0626", address: "24 Perry Ave", city: "Buzzards Bay", zip: "02532",
    source_name: "Town of Bourne" },

  { section: "H", title: "Dukes County Veterans' Services (Martha's Vineyard)",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Dukes County (Martha's Vineyard) accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for all six island towns; coordinates ferry-accessible VA travel and Hyannis CBOC referrals.",
    website_url: "https://www.dukescounty.org/veterans-services",
    phone: "508-696-3839", address: "9 Airport Rd", city: "Edgartown", zip: "02539",
    source_name: "Dukes County" },

  { section: "H", title: "Town of Nantucket Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Nantucket's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for the island's veteran population; coordinates ferry-accessible Hyannis CBOC + Boston VBA referrals.",
    website_url: "https://www.nantucket-ma.gov/200/Veterans-Services",
    phone: "508-228-7220", address: "37 Washington St", city: "Nantucket", zip: "02554",
    source_name: "Town of Nantucket" },

  { section: "H", title: "Town of Provincetown Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Provincetown's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Outer Cape veterans (Provincetown/Truro/Wellfleet/Eastham).",
    website_url: "https://www.provincetown-ma.gov/461/Veterans-Services",
    phone: "508-487-7099", address: "260 Commercial St", city: "Provincetown", zip: "02657",
    source_name: "Town of Provincetown" },

  { section: "H", title: "Cape Cod Healthcare — Veterans Care Coordination",
    cat: "healthcare", sub: "Primary Care",
    desc: "Cape Cod Healthcare (Cape Cod Hospital + Falmouth Hospital) — region's primary acute-care system. Care coordination team accepts VA Community Care referrals, TRICARE, and connects Cape Cod veterans to behavioral health and specialty services.",
    website_url: "https://www.capecodhealth.org/",
    phone: "508-771-1800", address: "27 Park St", city: "Hyannis", zip: "02601",
    source_name: "Cape Cod Healthcare" },

  { section: "H", title: "Cape & Islands Veterans Outreach Center",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "Hyannis-based 501(c)(3) operating a veterans drop-in center, food pantry, employment assistance, and peer support specifically for Cape Cod and Islands veterans. Staffed by veteran volunteers.",
    website_url: "https://www.capeveterans.com/",
    phone: "508-778-1590", address: "569 Main St", city: "Hyannis", zip: "02601",
    source_name: "Cape & Islands Veterans Outreach Center" },

  // ===========================================================================
  // I. South Coast — New Bedford / Fall River / Plymouth / Brockton city VSOs
  // ===========================================================================
  { section: "I", title: "City of New Bedford Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "New Bedford's accredited Veterans' Service Officer — files VA claims, administers Chapter 115 benefits, and serves Bristol County's largest urban veteran population.",
    website_url: "https://www.newbedford-ma.gov/veterans-services/",
    phone: "508-991-6184", address: "133 William St", city: "New Bedford", zip: "02740",
    latitude: 41.6362, longitude: -70.9342, source_name: "City of New Bedford" },

  { section: "I", title: "City of Fall River Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Fall River's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits; serves the second largest Bristol County urban veteran population on the RI border.",
    website_url: "https://www.fallriverma.org/government/veterans-services/",
    phone: "508-324-2654", address: "One Government Center", city: "Fall River", zip: "02722",
    source_name: "City of Fall River" },

  { section: "I", title: "Town of Plymouth Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Plymouth's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits; serves the largest Plymouth County town and coordinates with the Plymouth CBOC.",
    website_url: "https://www.plymouth-ma.gov/veterans-services",
    phone: "508-747-1620", address: "26 Court St", city: "Plymouth", zip: "02360",
    source_name: "Town of Plymouth" },

  { section: "I", title: "City of Brockton Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Brockton's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits; coordinates with the VA Boston Brockton Campus and Brockton Vet Center.",
    website_url: "https://brockton.ma.us/city-departments/veterans-services/",
    phone: "508-580-7113", address: "45 School St", city: "Brockton", zip: "02301",
    source_name: "City of Brockton" },

  { section: "I", title: "Town of Bridgewater Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Bridgewater's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Bridgewater veterans; supports Bridgewater State University student veterans.",
    website_url: "https://www.bridgewaterma.org/241/Veterans-Services",
    phone: "508-697-0904", address: "66 Central Square", city: "Bridgewater", zip: "02324",
    source_name: "Town of Bridgewater" },

  { section: "I", title: "City of Taunton Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Taunton's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Taunton-area veterans; serves as a district hub for surrounding small Bristol County towns.",
    website_url: "https://www.taunton-ma.gov/veterans-services",
    phone: "508-821-1024", address: "15 Summer St", city: "Taunton", zip: "02780",
    source_name: "City of Taunton" },

  { section: "I", title: "Town of Dartmouth Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Dartmouth's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for South Coast suburban veterans; coordinates with New Bedford VSO and the New Bedford Vet Center.",
    website_url: "https://www.town.dartmouth.ma.us/veterans-services",
    phone: "508-910-1818", address: "400 Slocum Rd", city: "Dartmouth", zip: "02747",
    source_name: "Town of Dartmouth" },

  { section: "I", title: "Town of Weymouth Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Weymouth's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Weymouth and South Shore veterans; coordinates with the Quincy CBOC.",
    website_url: "https://www.weymouth.ma.us/veterans-services",
    phone: "781-682-6118", address: "75 Middle St", city: "Weymouth", zip: "02189",
    source_name: "Town of Weymouth" },

  { section: "I", title: "Southcoast Health — Veterans Care Coordination",
    cat: "healthcare", sub: "Primary Care",
    desc: "South Coast's primary health system (St. Luke's Hospital New Bedford, Charlton Memorial Fall River, Tobey Hospital Wareham). Care coordination team accepts VA Community Care referrals, TRICARE, and connects veterans to specialty + behavioral-health care.",
    website_url: "https://www.southcoast.org/",
    phone: "508-973-5000", address: "101 Page St", city: "New Bedford", zip: "02740",
    source_name: "Southcoast Health" },

  { section: "I", title: "PACE — Greater New Bedford Veteran Outreach",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "People Acting in Community Endeavors (PACE) — New Bedford-area community-action agency operating a veterans outreach desk for benefits navigation, fuel assistance, food access, and housing referrals.",
    website_url: "https://www.paceinformation.org/",
    phone: "508-999-9920", address: "166 William St", city: "New Bedford", zip: "02740",
    source_name: "PACE Inc." },

  // ===========================================================================
  // J. Merrimack Valley — Lowell / Lawrence / Methuen / Haverhill city VSOs
  // ===========================================================================
  { section: "J", title: "City of Lowell Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Lowell's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits; serves the largest Merrimack Valley urban veteran population, coordinates with the Lowell CBOC + Vet Center.",
    website_url: "https://www.lowellma.gov/280/Veterans-Services",
    phone: "978-674-4115", address: "375 Merrimack St", city: "Lowell", zip: "01852",
    source_name: "City of Lowell" },

  { section: "J", title: "City of Lawrence Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Lawrence's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits; serves a high-need urban veteran population on the NH border.",
    website_url: "https://www.cityoflawrence.com/204/Veterans-Services",
    phone: "978-620-3540", address: "200 Common St", city: "Lawrence", zip: "01840",
    source_name: "City of Lawrence" },

  { section: "J", title: "City of Methuen Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Methuen's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits; coordinates with Lawrence and the Lowell CBOC.",
    website_url: "https://www.cityofmethuen.net/veterans-services",
    phone: "978-983-8590", address: "90 Hampshire St", city: "Methuen", zip: "01844",
    source_name: "City of Methuen" },

  { section: "J", title: "City of Haverhill Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Haverhill's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits; works with Veterans Northeast Outreach Center (Haverhill HQ).",
    website_url: "https://www.cityofhaverhill.com/departments/veterans_services/index.php",
    phone: "978-374-2300", address: "4 Summer St", city: "Haverhill", zip: "01830",
    source_name: "City of Haverhill" },

  { section: "J", title: "Town of Andover Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Andover's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Andover veterans; coordinates with Lawrence and the Bedford VAMC.",
    website_url: "https://www.andoverma.gov/305/Veterans-Services",
    phone: "978-623-8218", address: "36 Bartlet St", city: "Andover", zip: "01810",
    source_name: "Town of Andover" },

  { section: "J", title: "Town of North Andover Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "North Andover's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for North Andover veterans; serves as a district VSO for surrounding small Essex County towns.",
    website_url: "https://www.northandoverma.gov/veterans-services",
    phone: "978-688-9525", address: "120 Main St", city: "North Andover", zip: "01845",
    source_name: "Town of North Andover" },

  { section: "J", title: "Town of Tewksbury Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Tewksbury's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits; coordinates with Lowell VSO and the Bedford VAMC.",
    website_url: "https://www.tewksbury-ma.gov/veterans-services",
    phone: "978-640-4485", address: "1009 Main St", city: "Tewksbury", zip: "01876",
    source_name: "Town of Tewksbury" },

  { section: "J", title: "Town of Chelmsford Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Chelmsford's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Chelmsford veterans; coordinates with the Lowell CBOC and Bedford VAMC.",
    website_url: "https://www.chelmsfordma.gov/279/Veterans-Services",
    phone: "978-244-3354", address: "50 Billerica Rd", city: "Chelmsford", zip: "01824",
    source_name: "Town of Chelmsford" },

  { section: "J", title: "Lawrence General Hospital — Veterans Care Coordination",
    cat: "healthcare", sub: "Primary Care",
    desc: "Independent community hospital serving the Merrimack Valley; care coordination team accepts VA Community Care referrals, TRICARE, and connects veterans to specialty and behavioral-health services.",
    website_url: "https://www.lawrencegeneral.org/",
    phone: "978-683-4000", address: "1 General St", city: "Lawrence", zip: "01841",
    source_name: "Lawrence General Hospital" },

  { section: "J", title: "Merrimack Valley Food Bank — Veteran Outreach",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Regional food bank serving 100+ member agencies across the Merrimack Valley; partners with Lowell + Lawrence VSOs and Veterans Northeast Outreach Center to channel emergency food assistance to MA veterans.",
    website_url: "https://mvfb.org/",
    phone: "978-454-7272", address: "735 Broadway St", city: "Lowell", zip: "01854",
    source_name: "Merrimack Valley Food Bank" },

  // ===========================================================================
  // K. Berkshires — Pittsfield / Adams / North Adams / Williamstown city VSOs
  // ===========================================================================
  { section: "K", title: "City of Pittsfield Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Pittsfield's accredited Veterans' Service Officer — files VA claims, administers Chapter 115 benefits, and serves as the regional district VSO for Berkshire County's largest urban veteran population.",
    website_url: "https://www.cityofpittsfield.org/city_hall/veterans_services/index.php",
    phone: "413-499-9433", address: "70 Allen St", city: "Pittsfield", zip: "01201",
    source_name: "City of Pittsfield" },

  { section: "K", title: "Town of Adams Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Adams's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for North Berkshire veterans; coordinates with Pittsfield CBOC and Soldier On.",
    website_url: "https://www.town.adams.ma.us/veterans-services",
    phone: "413-743-8326", address: "8 Park St", city: "Adams", zip: "01220",
    source_name: "Town of Adams" },

  { section: "K", title: "City of North Adams Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "North Adams's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for far-northwest Berkshire County veterans; supports MCLA student veterans.",
    website_url: "https://www.northadams-ma.gov/197/Veterans-Services",
    phone: "413-662-3060", address: "10 Main St", city: "North Adams", zip: "01247",
    source_name: "City of North Adams" },

  { section: "K", title: "Town of Williamstown Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Williamstown's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Williamstown veterans; supports Williams College student veterans.",
    website_url: "https://www.williamstownma.gov/249/Veterans-Services",
    phone: "413-458-3500", address: "31 N Hoosac Rd", city: "Williamstown", zip: "01267",
    source_name: "Town of Williamstown" },

  { section: "K", title: "Town of Great Barrington Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Great Barrington's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for South Berkshire veterans; serves as the district hub for surrounding small Berkshire towns.",
    website_url: "https://www.townofgb.org/veterans-services",
    phone: "413-528-1619", address: "334 Main St", city: "Great Barrington", zip: "01230",
    source_name: "Town of Great Barrington" },

  { section: "K", title: "Town of Lenox Veterans' Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Lenox's accredited Veterans' Service Officer — files VA claims and Chapter 115 benefits for Lenox veterans; serves as a district VSO for surrounding mid-Berkshire towns.",
    website_url: "https://www.townoflenox.com/veterans-services",
    phone: "413-637-5500", address: "6 Walker St", city: "Lenox", zip: "01240",
    source_name: "Town of Lenox" },

  { section: "K", title: "Berkshire Medical Center — Veterans Care Coordination",
    cat: "healthcare", sub: "Primary Care",
    desc: "Berkshire Health Systems' flagship hospital; care coordination team accepts VA Community Care referrals, TRICARE, and connects Berkshire County veterans to specialty + behavioral-health services across the BHS network.",
    website_url: "https://www.berkshirehealthsystems.org/",
    phone: "413-447-2000", address: "725 North St", city: "Pittsfield", zip: "01201",
    source_name: "Berkshire Health Systems" },

  { section: "K", title: "Berkshire Veterans Residence (Soldier On — Pittsfield)",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Soldier On's Pittsfield campus: transitional housing, case management, and a path to permanent supportive cooperative-housing for homeless and at-risk veterans in western MA. Co-located with the Pittsfield CBOC.",
    website_url: "https://www.wesoldieron.org/",
    phone: "413-236-5644", address: "421 N Main St", city: "Leeds", zip: "01053",
    source_name: "Soldier On" },

  // ===========================================================================
  // L. Crisis & statewide hotlines (MA-tagged)
  // ===========================================================================
  { section: "L", title: "Samaritans Statewide 24/7 Helpline (Massachusetts)",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Free, confidential, 24/7 statewide call/text helpline for emotional distress and suicide prevention. Trained volunteer befrienders; not crisis-counselors but an immediate human connection. MA-headquartered nonprofit serving all callers including veterans + families.",
    website_url: "https://samaritanshope.org/",
    phone: "877-870-4673", address: "41 West St", city: "Boston", zip: "02111",
    source_name: "Samaritans Inc." },

  { section: "L", title: "Massachusetts Behavioral Health Help Line (BHHL)",
    cat: "mental-health", sub: "Crisis Support",
    desc: "MA Executive Office of Health and Human Services 24/7 free, confidential helpline connecting residents (including veterans) to behavioral-health evaluations, outpatient treatment, mobile crisis intervention, and Community Behavioral Health Centers (CBHCs) statewide. Multilingual.",
    website_url: "https://www.masshelpline.com/",
    phone: "833-773-2445", address: "1 Ashburton Place", city: "Boston", zip: "02108",
    source_name: "MA EOHHS" },

  { section: "L", title: "Mass 211 — Statewide Information & Referral",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "MA's 24/7 statewide information and referral helpline. Connects callers (veterans, seniors, families) to local food, shelter, utility, healthcare, and benefits resources. Operated by United Way of Massachusetts Bay; multilingual.",
    website_url: "https://mass211.org/",
    phone: "211", address: "51 Sleeper St", city: "Boston", zip: "02210",
    source_name: "Mass 211 / United Way of MA Bay" },

  { section: "L", title: "Massachusetts Substance Use Helpline",
    cat: "mental-health", sub: "Substance Abuse Treatment",
    desc: "MA Bureau of Substance Addiction Services free, confidential 24/7 statewide helpline. Connects callers (including veterans) to detox, treatment, recovery support, and naloxone distribution. Multilingual.",
    website_url: "https://helplinema.org/",
    phone: "800-327-5050", address: "250 Washington St", city: "Boston", zip: "02108",
    source_name: "MA DPH — Bureau of Substance Addiction Services" },

  { section: "L", title: "NAMI Massachusetts HelpLine",
    cat: "mental-health", sub: "Crisis Support",
    desc: "NAMI Massachusetts free statewide helpline (M-F) for individuals and families navigating mental illness; trained peer responders; warm handoffs to local NAMI affiliates and behavioral-health providers including veteran-specific programs.",
    website_url: "https://namimass.org/",
    phone: "617-704-6264", address: "529 Main St, Suite 1M17", city: "Charlestown", zip: "02129",
    source_name: "NAMI Massachusetts" },

  { section: "L", title: "MA SafeLink Domestic Violence Hotline",
    cat: "crisis-help", sub: "Domestic Violence / Safety",
    desc: "Statewide MA 24/7 multilingual confidential hotline for domestic violence survivors. Operated by Casa Myrna; provides safety planning, shelter referrals, and warm handoffs to Veterans Crisis Line for active-duty + veteran survivors.",
    website_url: "https://casamyrna.org/get-support/safelink/",
    phone: "877-785-2020", address: "PO Box 18019", city: "Boston", zip: "02118",
    source_name: "Casa Myrna — SafeLink" },

  { section: "L", title: "Network of Care Massachusetts — Veterans",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Free online + statewide phone resource directory aggregating 8,000+ MA programs across mental health, housing, legal, financial, and social services with a dedicated veterans portal. Operated by Trilogy Integrated Resources for MA EOHHS.",
    website_url: "https://massachusetts.networkofcare.org/veterans/",
    phone: "888-844-2838", address: "1 Ashburton Place", city: "Boston", zip: "02108",
    source_name: "Network of Care Massachusetts" },

  { section: "L", title: "MA Coalition for Suicide Prevention",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "MA DPH-supported statewide coalition coordinating suicide prevention, postvention, and means-restriction training across MA hospitals, schools, veteran-serving orgs, and community providers; resource directory + training calendar.",
    website_url: "https://www.masspreventssuicide.org/",
    phone: "617-624-5469", address: "250 Washington St", city: "Boston", zip: "02108",
    source_name: "MA DPH — Suicide Prevention Program" },

  // ===========================================================================
  // M. Statewide nonprofits, VSOs, state programs, food / legal / community
  // ===========================================================================
  { section: "M", title: "American Legion Department of Massachusetts",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "MA state HQ of The American Legion — 250+ posts statewide; accredited VA service officers help MA veterans file disability/pension claims at no cost; sponsors Boys/Girls State, Oratorical, baseball, scholarship programs.",
    website_url: "https://www.masslegion.org/",
    phone: "617-727-2966", address: "State House, Room 546-2", city: "Boston", zip: "02133",
    source_name: "American Legion Department of MA" },

  { section: "M", title: "Veterans of Foreign Wars (VFW) Department of Massachusetts",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "MA state HQ of the VFW — 200+ posts statewide; accredited VA service officers help combat veterans file claims; sponsors National Home for Children, Buddy Poppy, and Voice of Democracy scholarship programs.",
    website_url: "https://vfwma.org/",
    phone: "508-762-0214", address: "20 Carver Rd", city: "Bridgewater", zip: "02324",
    source_name: "VFW Department of MA" },

  { section: "M", title: "Disabled American Veterans (DAV) Department of Massachusetts",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "MA state HQ of DAV — accredited DAV service officers in offices statewide help disabled MA veterans file VA disability/pension claims at no cost; runs the DAV Transportation Network providing free rides to VA medical appointments.",
    website_url: "https://www.davmass.org/",
    phone: "508-732-2855", address: "627 Main St", city: "Worcester", zip: "01608",
    source_name: "DAV Department of MA" },

  { section: "M", title: "AMVETS Department of Massachusetts",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "MA state HQ of AMVETS — accredited VA service officers help MA veterans of all eras file disability/pension claims; sponsors Americanism programs, scholarships, and community service across MA posts.",
    website_url: "https://amvetsma.org/",
    phone: "781-986-6688", address: "PO Box 320", city: "Randolph", zip: "02368",
    source_name: "AMVETS Department of MA" },

  { section: "M", title: "Vietnam Veterans of America — Massachusetts State Council",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "MA state council of VVA serving Vietnam-era veterans + families. Accredited VA service officers assist with Agent Orange and PTSD claims; advocacy on Blue Water Navy and toxic-exposure issues; chapters statewide.",
    website_url: "https://vvama.org/",
    phone: "508-893-9776", address: "PO Box 41", city: "Worcester", zip: "01613",
    source_name: "VVA — MA State Council" },

  { section: "M", title: "Massachusetts Military Heroes Fund",
    cat: "financial", sub: "Veteran Relief Funds",
    desc: "Boston-based 501(c)(3) providing emergency-relief grants and long-term family support (educational scholarships, holiday support, peer mentorship) to Gold Star families of MA service members killed in post-9/11 conflicts.",
    website_url: "https://militaryheroesfund.org/",
    phone: "617-241-0980", address: "PO Box 415", city: "Charlestown", zip: "02129",
    source_name: "MA Military Heroes Fund" },

  { section: "M", title: "Massachusetts Fallen Heroes",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "Boston-based 501(c)(3) supporting Gold Star families and post-9/11 veterans across MA via the Greater Boston Memorial, Wreaths Across America Boston, retreats, peer-to-peer support, and family events.",
    website_url: "https://www.massfallenheroes.org/",
    phone: "617-329-1135", address: "529 Main St, Suite 200", city: "Charlestown", zip: "02129",
    source_name: "Massachusetts Fallen Heroes" },

  { section: "M", title: "Greater Boston Food Bank — Veterans Outreach",
    cat: "food-assistance", sub: "Food Banks",
    desc: "MA's largest hunger-relief organization — distributes 100+ million lbs/yr through 600+ partner agencies across eastern Massachusetts; partners with NECHV, Veterans Inc., and city VSOs to channel emergency food assistance to veterans.",
    website_url: "https://www.gbfb.org/",
    phone: "617-427-5200", address: "70 South Bay Ave", city: "Boston", zip: "02118",
    source_name: "Greater Boston Food Bank" },

  { section: "M", title: "Volunteer Lawyers Project of the Boston Bar Association — Veterans Project",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Boston Bar Association's pro-bono legal services program with a dedicated Veterans Project — free civil legal aid for low-income MA veterans on housing, family law, consumer debt, and benefits matters.",
    website_url: "https://www.vlpnet.org/",
    phone: "617-423-0648", address: "7 Winthrop Square", city: "Boston", zip: "02110",
    source_name: "Volunteer Lawyers Project" },

  { section: "M", title: "Massachusetts Military Support Foundation",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "Bourne-based 501(c)(3) operating Empower Stations (free food + essentials) at JBCC, Hanscom AFB, and Westover ARB for active-duty + Guard families; also supports MA veterans with stand-down events.",
    website_url: "https://www.mmsfoundation.com/",
    phone: "508-630-0246", address: "212 Sandwich Rd", city: "Bourne", zip: "02532",
    source_name: "MA Military Support Foundation" },

  { section: "M", title: "Operation American Soldier",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "Whitman-based 501(c)(3) shipping care packages to deployed MA service members and supporting MA veterans with reintegration events, holiday outreach, and family-support initiatives.",
    website_url: "https://www.operationamericansoldier.org/",
    phone: "781-447-6627", address: "PO Box 132", city: "Whitman", zip: "02382",
    source_name: "Operation American Soldier" },

  { section: "M", title: "Project New Hope Massachusetts",
    cat: "mental-health", sub: "PTSD & Trauma Support",
    desc: "MA-based 501(c)(3) providing free family-retreat and reintegration weekends for post-9/11 MA veterans + families coping with PTSD, TBI, and deployment stress. Year-round retreats at MA conference centers; certified trauma-informed facilitators.",
    website_url: "https://www.projectnewhopema.org/",
    phone: "508-983-1633", address: "20 Gold Star Blvd", city: "Worcester", zip: "01606",
    source_name: "Project New Hope MA" },
];

(async () => {
  await runSeed(ROWS, {
    state: "MA",
    commit: COMMIT,
    scriptName: "seed-ma-wave1",
    allowBrokenUrls: ALLOW_BROKEN_URLS,
    allowZipBleed: ALLOW_ZIP_BLEED,
    sectionLabels: {
      A: "MA EOVS / state",
      B: "VAMC / CBOC",
      C: "Vet Centers",
      D: "Boston Metro",
      E: "North Shore",
      F: "Worcester",
      G: "Springfield/W.MA",
      H: "Cape & Islands",
      I: "South Coast",
      J: "Merrimack Valley",
      K: "Berkshires",
      L: "Crisis hotlines",
      M: "Statewide NPs",
    },
  });
})().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
