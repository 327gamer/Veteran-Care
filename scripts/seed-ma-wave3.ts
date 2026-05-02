/**
 * MASSACHUSETTS — WAVE 3 (Golden Standard major-city saturation, ~135 rows)
 *
 * Mirrors scripts/seed-va-wave3.ts gold-standard layout. CITY DENSITY phase.
 *
 * Founder release 2026-05-02: Wave 3 = MAJOR CITY SATURATION (~120-150 rows).
 * Build deep coverage in 11 priority MA cities across ALL categories — both
 * veteran-specific AND mainstream services veterans realistically use.
 * STOP after Wave 3. Speed + coverage > perfection. Skip stuck URLs.
 *
 * Sections (11 city blocks):
 *   A  Boston depth                  (was 63 → +)
 *   B  Worcester depth               (was 17 → +)
 *   C  Springfield depth             (was 10 → +)
 *   D  Cambridge / Somerville depth  (was  6 → +)
 *   E  Lowell / Lawrence depth       (was 11 → +)
 *   F  Brockton depth                (was  6 → +)
 *   G  New Bedford depth             (was  7 → +)
 *   H  Fall River depth              (was  2 → + heavy gap-fill)
 *   I  Quincy depth                  (was  5 → +)
 *   J  Lynn depth                    (was  4 → +)
 *   K  Cape Cod / Hyannis depth      (was  ~10 → +)
 *
 * APPENDS to Wave 1 (139) + Wave 2 (118) = post-W3 total ~390 rows.
 *
 * Run:
 *   npx tsx scripts/seed-ma-wave3.ts                                # dry-run
 *   npx tsx scripts/seed-ma-wave3.ts --commit --allow-broken-urls   # write
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");
const ALLOW_ZIP_BLEED = process.argv.includes("--allow-zip-bleed");

const ROWS: SeedRow[] = [
  // ===========================================================================
  // A. BOSTON DEPTH (was 63 — adding civilian healthcare/food/legal/transit/education/etc.)
  // ===========================================================================
  { section: "A", title: "Boston Medical Center",
    cat: "healthcare", sub: "Specialty Care",
    desc: "BMC — Boston's largest safety-net hospital and Level I trauma center; comprehensive specialty care including cardiology, oncology, surgery, orthopedics; serves Boston-area veterans referred via VA Boston HCS Community Care for services not available within VA system.",
    website_url: "https://www.bmc.org/", phone: "617-638-8000",
    address: "1 Boston Medical Center Place", city: "Boston", zip: "02118",
    source_name: "Boston Medical Center" },

  { section: "A", title: "Massachusetts General Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "MGH — Mass General Brigham flagship academic medical center; world-renowned cancer, cardiac, neurosurgery, transplant, and specialty programs; common Community Care destination for VA Boston HCS referrals; home to the Red Sox Foundation + MGH Home Base post-9/11 PTSD/TBI clinic.",
    website_url: "https://www.massgeneral.org/", phone: "617-726-2000",
    address: "55 Fruit St", city: "Boston", zip: "02114",
    source_name: "Mass General Brigham" },

  { section: "A", title: "Brigham and Women's Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "BWH — Mass General Brigham flagship academic medical center; orthopedics, cardiac surgery, women's health, transplant, oncology; common VA Community Care destination for Boston-area veterans needing tertiary care not provided at VA Boston HCS.",
    website_url: "https://www.brighamandwomens.org/", phone: "617-732-5500",
    address: "75 Francis St", city: "Boston", zip: "02115",
    source_name: "Mass General Brigham" },

  { section: "A", title: "Beth Israel Deaconess Medical Center",
    cat: "healthcare", sub: "Specialty Care",
    desc: "BIDMC — Beth Israel Lahey Health teaching hospital affiliated with Harvard Medical School; cardiology, oncology, transplant, orthopedics; common VA Community Care destination for Boston-area veterans needing services unavailable at VA Boston HCS.",
    website_url: "https://www.bidmc.org/", phone: "617-667-7000",
    address: "330 Brookline Ave", city: "Boston", zip: "02215",
    source_name: "Beth Israel Lahey Health" },

  { section: "A", title: "Rosie's Place Boston",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Rosie's Place — first US women-only emergency shelter (founded 1974, South End Boston). Daily lunches, food pantry, overnight emergency shelter (20 beds), legal aid, English/literacy classes, advocacy, and trauma-informed services for unhoused + low-income Boston-area women incl. women veterans. Walk-in.",
    website_url: "https://www.rosiesplace.org/", phone: "617-442-9322",
    address: "889 Harrison Ave", city: "Boston", zip: "02118",
    source_name: "Rosie's Place" },

  { section: "A", title: "Project Bread Massachusetts FoodSource Hotline",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Massachusetts statewide hunger-relief hotline + advocacy. Free multilingual referral to 1,500+ MA food resources (food pantries, soup kitchens, SNAP application help, school-meal enrollment, summer-meal sites). Veterans served regardless of VA enrollment.",
    website_url: "https://www.projectbread.org/", phone: "800-645-8333",
    address: "145 Border St", city: "East Boston", zip: "02128",
    source_name: "Project Bread" },

  { section: "A", title: "Bunker Hill Community College Veterans Resource Center",
    cat: "education", sub: "College & University Programs",
    desc: "BHCC Veterans Center — Charlestown campus; Yellow Ribbon participant; serves ~600 veteran/military-spouse students with VA benefits certification, peer mentoring, and dedicated veterans lounge. Largest community-college veteran enrollment in greater Boston.",
    website_url: "https://www.bhcc.edu/veterans/", phone: "617-228-2174",
    address: "250 New Rutherford Ave", city: "Charlestown", zip: "02129",
    source_name: "Bunker Hill Community College" },

  { section: "A", title: "UMass Boston Veterans Affairs Office",
    cat: "education", sub: "College & University Programs",
    desc: "UMass Boston VA office — Yellow Ribbon participant; certifies VA education benefits (Ch. 33/30/35); coordinates Student Veterans Organization, dedicated veterans lounge, and disability-services partnership for Boston-area veteran undergrad + grad students.",
    website_url: "https://www.umb.edu/veterans/", phone: "617-287-5859",
    address: "100 Morrissey Blvd", city: "Boston", zip: "02125",
    source_name: "University of Massachusetts Boston" },

  { section: "A", title: "Greater Boston Legal Services Veterans Project",
    cat: "legal", sub: "Veterans Legal Clinics",
    desc: "GBLS Veterans Project — free civil legal services for low-income Boston-area veterans facing housing/eviction, public benefits denials (SSI/SSDI/MassHealth), employment discrimination, family law, and consumer-debt issues. Statewide intake hotline; in-person intake at GBLS downtown HQ.",
    website_url: "https://www.gbls.org/our-work/veterans", phone: "617-371-1234",
    address: "197 Friend St", city: "Boston", zip: "02114",
    source_name: "Greater Boston Legal Services" },

  { section: "A", title: "Massachusetts Bay Transportation Authority MBTA",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "MBTA — Greater Boston's public transit system (subway / bus / commuter rail / ferry / RIDE paratransit). Reduced-fare CharlieCards for veterans (with VA-issued ID), seniors (65+), people with disabilities. RIDE paratransit for veterans unable to use fixed-route service.",
    website_url: "https://www.mbta.com/", phone: "617-222-3200",
    address: "10 Park Plaza", city: "Boston", zip: "02116",
    source_name: "MBTA" },

  { section: "A", title: "Boston Center for Independent Living",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "BCIL — Boston-area Independent Living Center serving Suffolk + Norfolk + Middlesex disabled veterans + civilians. Peer support, advocacy, transition services from institutions to community living, assistive technology, accessible-housing referrals, ADA technical assistance.",
    website_url: "https://bostoncil.org/", phone: "617-338-6665",
    address: "60 Temple Pl, 5th Floor", city: "Boston", zip: "02111",
    source_name: "Boston Center for Independent Living" },

  { section: "A", title: "Project Place Boston",
    cat: "employment", sub: "Job Placement Programs",
    desc: "South End-based workforce-development nonprofit serving formerly homeless + low-income Boston-area adults (incl. justice-involved veterans). 12-week Vocational Training Program in foodservice, customer service, and clerical; job placement + retention case management.",
    website_url: "https://www.projectplace.org/", phone: "617-262-3740",
    address: "1145 Washington St", city: "Boston", zip: "02118",
    source_name: "Project Place" },

  // ===========================================================================
  // B. WORCESTER DEPTH (was 17 — adding civilian healthcare/food/transit/education/etc.)
  // ===========================================================================
  { section: "B", title: "UMass Memorial Medical Center",
    cat: "healthcare", sub: "Specialty Care",
    desc: "UMass Memorial — central MA's largest academic medical center; Level I trauma center; cardiac, oncology, orthopedic, transplant, and high-risk obstetric care. Common VA Community Care destination for central MA veterans referred from Worcester CBOC/VA Boston HCS.",
    website_url: "https://www.ummhealth.org/", phone: "508-334-1000",
    address: "55 Lake Ave N", city: "Worcester", zip: "01655",
    source_name: "UMass Memorial Health" },

  { section: "B", title: "Saint Vincent Hospital Worcester",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Saint Vincent — Tenet Healthcare full-service hospital in Worcester; cardiac, orthopedic, oncology, surgical care; 2nd-largest Worcester hospital and common VA Community Care destination for Worcester County veterans.",
    website_url: "https://www.stvincenthospital.com/", phone: "508-363-5000",
    address: "123 Summer St", city: "Worcester", zip: "01608",
    source_name: "Saint Vincent Hospital (Tenet Healthcare)" },

  { section: "B", title: "St Johns Food For The Poor Program Worcester",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "St. John's Food For The Poor Program — Worcester's largest soup kitchen and food pantry, run by St. John's Catholic Church on Temple St since 1981. Free hot breakfast + lunch + grocery distributions Monday-Friday; no eligibility checks; serves 1,500+ central MA residents weekly incl. Worcester-area veterans.",
    website_url: "https://stjohnsworcester.org/food-program/", phone: "508-756-7165",
    address: "44 Temple St", city: "Worcester", zip: "01604",
    source_name: "St. John's Catholic Church Worcester" },

  { section: "B", title: "Friendly House Worcester",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Worcester multi-service settlement house operating an emergency shelter, food pantry, summer camp, ESL classes, and family-stability programs in Worcester. Veterans accepted same-day at the shelter and food pantry; warm-handoff to Worcester VTC + Veterans Inc. for benefits.",
    website_url: "https://www.friendlyhousema.org/", phone: "508-755-4362",
    address: "36 Wall St", city: "Worcester", zip: "01604",
    source_name: "Friendly House Inc." },

  { section: "B", title: "Quinsigamond Community College Veterans Resource Center",
    cat: "education", sub: "College & University Programs",
    desc: "QCC Veterans Center — central MA's largest community-college veteran population (~400 veteran/military-spouse students). Yellow Ribbon participant; VA benefits certification, peer mentoring, dedicated veterans lounge, and Veterans-Specific Academic Coaching.",
    website_url: "https://www.qcc.edu/student-resources/veterans-services", phone: "508-854-4253",
    address: "670 W Boylston St", city: "Worcester", zip: "01606",
    source_name: "Quinsigamond Community College" },

  { section: "B", title: "Worcester State University Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "WSU Veterans Services Office — Yellow Ribbon participant; certifies VA education benefits (Ch. 33/30/35); coordinates Student Veterans of America WSU chapter, dedicated veterans lounge, and one-stop coordination with disability-services + financial-aid offices.",
    website_url: "https://www.worcester.edu/veterans-services/", phone: "508-929-8138",
    address: "486 Chandler St", city: "Worcester", zip: "01602",
    source_name: "Worcester State University" },

  { section: "B", title: "Community Legal Aid Worcester",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Community Legal Aid Inc — free civil legal services for low-income central + western MA residents (Worcester, Hampden, Hampshire, Franklin, Berkshire counties). Housing/eviction defense, public-benefits denials, employment discrimination, family law. Veteran intake prioritized.",
    website_url: "https://www.communitylegal.org/", phone: "508-752-3718",
    address: "370 Main St, 4th Floor", city: "Worcester", zip: "01608",
    source_name: "Community Legal Aid Inc." },

  { section: "B", title: "Worcester Regional Transit Authority WRTA",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "WRTA — central MA's public bus transit system (39 fixed routes serving Worcester + 36 surrounding towns). Reduced-fare passes for veterans (with VA ID), seniors (60+), people with disabilities. WRTA Paratransit for veterans unable to use fixed-route service.",
    website_url: "https://therta.com/", phone: "508-453-3454",
    address: "60 Foster St", city: "Worcester", zip: "01608",
    source_name: "Worcester Regional Transit Authority" },

  { section: "B", title: "Center for Living and Working Worcester",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Worcester-area Independent Living Center serving central MA. Peer support, advocacy, transition services from nursing homes to community, assistive technology, accessible-housing referrals, and ADA technical assistance for disabled Worcester-area veterans.",
    website_url: "https://www.centerlw.org/", phone: "508-755-1003",
    address: "484 Main St, Suite 345", city: "Worcester", zip: "01608",
    source_name: "Center for Living and Working" },

  { section: "B", title: "Family Services of Central Massachusetts",
    cat: "family-support", sub: "Family Counseling",
    desc: "Worcester-area family-counseling nonprofit. Outpatient mental-health therapy, family counseling, foster-care services, adoption, and adolescent counseling on sliding-fee scale. Veterans + military families welcomed; coordinates with Worcester CBOC for behavioral health.",
    website_url: "https://www.familyserviceswm.org/", phone: "508-756-4646",
    address: "31 Harvard St", city: "Worcester", zip: "01609",
    source_name: "Family Services of Central Massachusetts" },

  { section: "B", title: "Genesis Club Worcester",
    cat: "mental-health", sub: "Peer Support",
    desc: "Worcester-area Clubhouse-model psychosocial-rehabilitation program for adults with serious mental illness. Members + staff partner as colleagues in operating the Clubhouse; transitional + supported employment program. Veteran members from Worcester CBOC referrals.",
    website_url: "https://www.genesisclub.org/", phone: "508-831-0100",
    address: "274 Lincoln St", city: "Worcester", zip: "01605",
    source_name: "Genesis Club Inc." },

  { section: "B", title: "Pernet Family Health Service",
    cat: "healthcare", sub: "Primary Care",
    desc: "Worcester-area FQHC + family-services agency. Primary care, behavioral health, home visits, parenting education, and pre-natal care on sliding-fee scale. Multilingual (Spanish, Portuguese, Vietnamese, Albanian); serves Worcester veteran families regardless of VA enrollment.",
    website_url: "https://www.pernetfamilyhealth.org/", phone: "508-755-1228",
    address: "237 Millbury St", city: "Worcester", zip: "01610",
    source_name: "Pernet Family Health Service" },

  // ===========================================================================
  // C. SPRINGFIELD DEPTH (was 10 — adding civilian healthcare/food/transit/education/etc.)
  // ===========================================================================
  { section: "C", title: "Baystate Medical Center",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Baystate Medical Center — western MA's largest hospital; Level I trauma center; cardiac, oncology, neurosurgery, high-risk OB/maternal-fetal medicine, and pediatric specialty care. Common VA Community Care destination for Hampden + Hampshire + Franklin county veterans.",
    website_url: "https://www.baystatehealth.org/", phone: "413-794-0000",
    address: "759 Chestnut St", city: "Springfield", zip: "01199",
    source_name: "Baystate Health" },

  { section: "C", title: "Mercy Medical Center Springfield",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Trinity Health Of New England's Springfield hospital. Cardiac, oncology, surgical, orthopedic, and behavioral-health services. 2nd-largest Springfield hospital + common VA Community Care destination for Hampden County veterans.",
    website_url: "https://www.trinityhealthofne.org/mercy-medical-center", phone: "413-748-9000",
    address: "271 Carew St", city: "Springfield", zip: "01104",
    source_name: "Trinity Health Of New England" },

  { section: "C", title: "Holyoke Medical Center",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Holyoke Medical Center — independent community hospital in Hampden County serving Holyoke, Chicopee, South Hadley, Easthampton. Full surgical, cardiac, behavioral-health, OB/GYN, and orthopedic care; common VA Community Care destination for Holyoke-area veterans.",
    website_url: "https://www.holyokehealth.com/", phone: "413-534-2500",
    address: "575 Beech St", city: "Holyoke", zip: "01040",
    source_name: "Holyoke Medical Center" },

  { section: "C", title: "Open Pantry Community Services Springfield",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Springfield-area emergency-food + family-stability nonprofit. Food pantry (3 distribution sites — Loaves & Fishes Community Kitchen + Bridgework + Saturday Drop-In), holiday meals, school-supply drives, and family-shelter referrals for low-income Springfield veterans + civilians.",
    website_url: "https://www.openpantry.org/", phone: "413-737-5354",
    address: "287 State St", city: "Springfield", zip: "01105",
    source_name: "Open Pantry Community Services" },

  { section: "C", title: "Food Bank of Western Massachusetts",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Hatfield-headquartered hunger-relief org serving 4 western MA counties (Hampden, Hampshire, Franklin, Berkshire). Distributes 12M+ lbs of food annually through 175+ partner pantries, meal sites, and mobile-food sites. Veterans served same-day at any partner pantry.",
    website_url: "https://www.foodbankwma.org/", phone: "413-247-9738",
    address: "97 N Hatfield Rd", city: "Hatfield", zip: "01038",
    source_name: "Food Bank of Western Massachusetts" },

  { section: "C", title: "Springfield Technical Community College Veterans Resource Center",
    cat: "education", sub: "College & University Programs",
    desc: "STCC Veterans Center — western MA's largest community-college veteran population (~500 veteran/military-spouse students). Yellow Ribbon participant; VA benefits certification, peer mentoring, dedicated veterans lounge, and SVA chapter.",
    website_url: "https://www.stcc.edu/veterans/", phone: "413-755-4555",
    address: "1 Armory Sq", city: "Springfield", zip: "01102",
    source_name: "Springfield Technical Community College" },

  { section: "C", title: "Western New England University Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "WNE Veterans Services — Yellow Ribbon participant; certifies VA education benefits (Ch. 33/30/35); SVA chapter; dedicated veterans lounge. Strong undergrad/grad/law-school veteran enrollment from Westover ARB transitioning service members.",
    website_url: "https://www1.wne.edu/student-affairs/veterans/", phone: "413-782-1500",
    address: "1215 Wilbraham Rd", city: "Springfield", zip: "01119",
    source_name: "Western New England University" },

  { section: "C", title: "Pioneer Valley Transit Authority PVTA",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "PVTA — Pioneer Valley's public bus transit system (44 routes connecting Springfield + Holyoke + Northampton + Amherst + 20+ towns). Reduced-fare passes for veterans (with VA ID), seniors (60+), persons with disabilities. PVTA Paratransit for veterans unable to use fixed-route.",
    website_url: "https://www.pvta.com/", phone: "413-781-7882",
    address: "2808 Main St", city: "Springfield", zip: "01107",
    source_name: "Pioneer Valley Transit Authority" },

  { section: "C", title: "Center for Human Development Springfield",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "CHD — Springfield-area human-services nonprofit running 50+ programs across western MA + CT (mental health, foster care, autism, addiction recovery, group homes, family services). Veteran families served by CHD's family-stabilization, behavioral health, and homeless-prevention programs.",
    website_url: "https://www.chd.org/", phone: "413-733-6624",
    address: "332 Birnie Ave", city: "Springfield", zip: "01107",
    source_name: "Center for Human Development" },

  { section: "C", title: "Square One Springfield",
    cat: "family-support", sub: "Childcare Assistance",
    desc: "Springfield-area early-education + childcare nonprofit serving 1,500+ children annually at 4 centers + family childcare network. Subsidized + EEC voucher childcare for low-income working Springfield veteran families; before/after school + summer programs.",
    website_url: "https://www.startatsquareone.org/", phone: "413-732-5183",
    address: "1095 Main St", city: "Springfield", zip: "01103",
    source_name: "Square One" },

  { section: "C", title: "Stavros Center for Independent Living",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Western MA's primary Independent Living Center serving Hampden + Hampshire + Franklin counties from Amherst HQ. Peer support, advocacy, nursing-home transition services, assistive technology, and PCA management for disabled western MA veterans.",
    website_url: "https://stavros.org/", phone: "413-256-0473",
    address: "210 Old Farm Rd", city: "Amherst", zip: "01002",
    source_name: "Stavros Center for Independent Living" },

  { section: "C", title: "Western Massachusetts Recovery Learning Community",
    cat: "mental-health", sub: "Peer Support",
    desc: "Holyoke-headquartered peer-run mental-health recovery network. Western MA peer-support groups, drop-in centers (Greenfield + Holyoke + Pittsfield + Springfield), warm-line, advocacy training, and alternatives to traditional psychiatric services for veterans + civilians.",
    website_url: "https://www.westernmassrlc.org/", phone: "413-539-5941",
    address: "175 Maple St, Suite 4", city: "Holyoke", zip: "01040",
    source_name: "Western Mass Recovery Learning Community" },

  { section: "C", title: "Springfield Partners for Community Action",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Springfield-area community-action agency. Operates LIHEAP fuel-assistance, weatherization, financial coaching, free tax-preparation (VITA), and housing-counseling for low-income Springfield veterans. SNAP outreach + Earned Income Tax Credit (EITC) assistance.",
    website_url: "https://www.springfieldpartnersinc.com/", phone: "413-263-6500",
    address: "721 State St", city: "Springfield", zip: "01109",
    source_name: "Springfield Partners for Community Action" },

  // ===========================================================================
  // D. CAMBRIDGE / SOMERVILLE DEPTH (was 6 — adding healthcare/food/legal/education/etc.)
  // ===========================================================================
  { section: "D", title: "Cambridge Health Alliance",
    cat: "healthcare", sub: "Specialty Care",
    desc: "CHA — public-mission academic health system serving Cambridge + Somerville + Everett + Malden + Revere. 3 hospital campuses (Cambridge, Everett, Somerville), 14 primary-care + specialty practices, behavioral health. Multilingual care; common VA Community Care destination for inner-Middlesex veterans.",
    website_url: "https://www.challiance.org/", phone: "617-665-1000",
    address: "1493 Cambridge St", city: "Cambridge", zip: "02139",
    source_name: "Cambridge Health Alliance" },

  { section: "D", title: "Mount Auburn Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Mount Auburn — Beth Israel Lahey Health teaching hospital in Cambridge; cardiac, surgical, orthopedic, oncology, OB/GYN, and behavioral-health services. Common VA Community Care destination for Cambridge-area veterans referred from VA Boston HCS.",
    website_url: "https://www.mountauburnhospital.org/", phone: "617-492-3500",
    address: "330 Mount Auburn St", city: "Cambridge", zip: "02138",
    source_name: "Beth Israel Lahey Health" },

  { section: "D", title: "Food For Free Cambridge",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Cambridge-area food-rescue nonprofit. Recovers ~3M lbs of fresh food annually from area grocers + restaurants + farms; distributes through 110+ partner pantries, shelters, schools, and senior meal sites across Cambridge + Somerville. Veteran families served at any partner site.",
    website_url: "https://foodforfree.org/", phone: "617-868-2900",
    address: "210 Broadway, Suite 6", city: "Cambridge", zip: "02139",
    source_name: "Food For Free" },

  { section: "D", title: "Cambridge and Somerville Legal Services",
    cat: "legal", sub: "Legal Aid Services",
    desc: "CASLS — Greater Boston Legal Services neighborhood office for Cambridge + Somerville. Free civil legal services for low-income inner-Middlesex residents (housing/eviction, public benefits, employment, family law, consumer-debt). Veteran intake prioritized.",
    website_url: "https://www.gbls.org/locations/cambridge-and-somerville-legal-services", phone: "617-603-2700",
    address: "60 Gore St, Suite 203", city: "Cambridge", zip: "02141",
    source_name: "Greater Boston Legal Services" },

  { section: "D", title: "Somerville Homeless Coalition",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "Somerville-area homeless-services nonprofit. Operates emergency shelter, food pantry, housing-stabilization rapid-rehousing, and SSVF (in partnership with VOA Massachusetts) for inner-Middlesex veteran families. Walk-in intake at the Day Center.",
    website_url: "https://www.shcinc.org/", phone: "617-623-6111",
    address: "1 Davis Square", city: "Somerville", zip: "02144",
    source_name: "Somerville Homeless Coalition" },

  { section: "D", title: "Somerville-Cambridge Elder Services",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "SCES — Aging Services Access Point (ASAP) serving older adults (60+) in Cambridge + Somerville. Home-care services, Meals on Wheels, family-caregiver support, SHINE health-insurance counseling, and protective services for older Cambridge/Somerville veterans aging in place.",
    website_url: "https://www.eldercare.org/", phone: "617-628-2601",
    address: "61 Medford St", city: "Somerville", zip: "02143",
    source_name: "Somerville-Cambridge Elder Services" },

  { section: "D", title: "MIT Veterans Association",
    cat: "education", sub: "College & University Programs",
    desc: "MIT VA — student/staff/faculty veteran community at the Massachusetts Institute of Technology. Coordinates VA education benefits, Yellow Ribbon for grad programs (Sloan, Engineering, Lincoln Lab), military-mentor matching, and Veterans Day commemoration events at MIT.",
    website_url: "https://veterans.mit.edu/", phone: "617-253-1000",
    address: "77 Massachusetts Ave", city: "Cambridge", zip: "02139",
    source_name: "Massachusetts Institute of Technology" },

  { section: "D", title: "Harvard Veterans Alumni Organization",
    cat: "community-support", sub: "Veteran Social Groups",
    desc: "HVAO — alumni veteran community across all Harvard schools (College, Business, Law, Kennedy School, Medical, Education). Mentorship for transitioning service members applying to Harvard, Veterans Day commemoration, networking events, and military-civilian dialog programming.",
    website_url: "https://harvardveterans.org/", phone: "617-495-1000",
    address: "Harvard University", city: "Cambridge", zip: "02138",
    source_name: "Harvard Veterans Alumni Organization" },

  { section: "D", title: "East End House Cambridge",
    cat: "family-support", sub: "Youth Programs",
    desc: "Cambridge-area multi-service settlement house. Out-of-school-time programs (after-school + summer camp), early childhood education, family-stability case management, and adult education (ESL/GED) for low-income Cambridge families incl. veteran families.",
    website_url: "https://www.eastendhouse.org/", phone: "617-876-4444",
    address: "105 Spring St", city: "Cambridge", zip: "02141",
    source_name: "East End House" },

  { section: "D", title: "CASPAR Inc Cambridge Recovery",
    cat: "substance-recovery", sub: "Outpatient Recovery",
    desc: "CASPAR — Cambridge + Somerville substance-recovery + homelessness nonprofit. Operates a wet shelter (FIRST Step), detox transition support, outpatient counseling, and street outreach. Serves Middlesex veterans referred from VA Boston HCS substance-use services.",
    website_url: "https://www.bayservices.org/casparinc/", phone: "617-661-1525",
    address: "240 Albany St", city: "Cambridge", zip: "02139",
    source_name: "CASPAR Inc. (Bay Cove Human Services)" },

  { section: "D", title: "Cambridge Community Center",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Cambridge-area multi-service community center. Out-of-school-time + summer programming, food distributions, technology access, computer-literacy classes, and adult-ed for low-income Cambridge families including veterans returning to civilian life.",
    website_url: "https://www.cambridgecc.org/", phone: "617-547-6811",
    address: "5 Callender St", city: "Cambridge", zip: "02139",
    source_name: "Cambridge Community Center" },

  { section: "D", title: "Cambridge Family and Children's Service",
    cat: "family-support", sub: "Family Counseling",
    desc: "CFCS — Cambridge-area mental-health + adoption nonprofit. Outpatient counseling, foster care + adoption services, post-adoption support, LGBTQ+ family services, and Spanish-bilingual counseling. Sliding-fee scale; veteran families welcomed.",
    website_url: "https://www.helpfamilies.org/", phone: "617-876-4210",
    address: "60 Gore St, Suite 201", city: "Cambridge", zip: "02141",
    source_name: "Cambridge Family and Children's Service" },

  // ===========================================================================
  // E. LOWELL / LAWRENCE DEPTH (was 11 — gap-fill across healthcare/food/legal/transit/education)
  // ===========================================================================
  { section: "E", title: "Lowell General Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Lowell General — Tufts Medicine community hospital in Lowell; cardiac, oncology (Cancer Center of Lowell General Hospital), orthopedic, and surgical care. Common VA Community Care destination for Greater Lowell + Merrimack Valley veterans referred from Lowell CBOC + Bedford VAMC.",
    website_url: "https://www.lowellgeneral.org/", phone: "978-937-6000",
    address: "295 Varnum Ave", city: "Lowell", zip: "01854",
    source_name: "Tufts Medicine — Lowell General Hospital" },

  { section: "E", title: "Anna Jaques Hospital Newburyport",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Anna Jaques Hospital — Beth Israel Lahey Health community hospital in Newburyport (lower Merrimack Valley); cardiac, surgical, orthopedic, OB/GYN, and behavioral-health services. Common VA Community Care destination for northern Essex + lower Merrimack Valley veterans referred from Bedford VAMC.",
    website_url: "https://www.ajh.org/", phone: "978-463-1000",
    address: "25 Highland Ave", city: "Newburyport", zip: "01950",
    source_name: "Beth Israel Lahey Health" },

  { section: "E", title: "Holy Family Hospital Methuen",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Holy Family — Steward Health Care community hospital with campuses in Methuen + Haverhill; cardiac, surgical, orthopedic, OB/GYN, and behavioral-health services for Merrimack Valley + northern Essex. Common VA Community Care destination for Bedford VAMC referrals.",
    website_url: "https://www.holyfamilyhospital.com/", phone: "978-687-0151",
    address: "70 East St", city: "Methuen", zip: "01844",
    source_name: "Holy Family Hospital (Steward Health Care)" },

  { section: "E", title: "Catholic Charities Merrimack Valley Lawrence",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Catholic Charities Archdiocese of Boston — Merrimack Valley regional office in Lawrence. Cor Unum Meal Center (free hot breakfast + dinner 365 days/year), food pantry, basic-needs assistance, refugee resettlement, immigration legal services, and family stabilization for low-income Merrimack Valley families incl. veterans.",
    website_url: "https://www.ccab.org/locations/lawrence/", phone: "978-685-5930",
    address: "199 Lawrence St", city: "Lawrence", zip: "01841",
    source_name: "Catholic Charities Archdiocese of Boston" },

  { section: "E", title: "Lowell Transitional Living Center",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "Lowell's primary emergency shelter (96 beds) + transitional-housing provider for unhoused adults. Day shelter, evening meals, intensive case management, and SSVF rapid-rehousing pipeline for Merrimack Valley veterans referred from Bedford VAMC + Lowell CBOC.",
    website_url: "https://www.ltlcenter.org/", phone: "978-458-9888",
    address: "205 Middlesex St", city: "Lowell", zip: "01852",
    source_name: "Lowell Transitional Living Center" },

  { section: "E", title: "Greater Lawrence Community Action Council",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "GLCAC — Lawrence-area community-action agency. LIHEAP fuel-assistance, Head Start, weatherization, financial coaching, VITA tax prep, SNAP outreach, and CSBG case management for low-income Merrimack Valley veterans + families. Bilingual (Spanish/English).",
    website_url: "https://www.glcac.org/", phone: "978-681-4900",
    address: "350 Essex St", city: "Lawrence", zip: "01840",
    source_name: "Greater Lawrence Community Action Council" },

  { section: "E", title: "Middlesex Community College Veterans Resource Center",
    cat: "education", sub: "College & University Programs",
    desc: "MCC Veterans Center — Lowell + Bedford campuses; Yellow Ribbon participant; ~400 veteran/military-spouse students. VA benefits certification, peer mentoring, dedicated veterans lounge, and SVA chapter. Strong Bedford VAMC + Hanscom AFB transition pipeline.",
    website_url: "https://www.middlesex.mass.edu/veterans/", phone: "978-656-3173",
    address: "591 Springs Rd", city: "Bedford", zip: "01730",
    source_name: "Middlesex Community College" },

  { section: "E", title: "UMass Lowell Veterans Services Office",
    cat: "education", sub: "College & University Programs",
    desc: "UML VSO — Yellow Ribbon participant; certifies VA education benefits (Ch. 33/30/35); SVA chapter; dedicated veterans lounge; veteran-focused academic coaching. Strong undergrad/grad/online enrollment from Bedford VAMC + Hanscom AFB transitioning service members.",
    website_url: "https://www.uml.edu/student-services/veterans/", phone: "978-934-2415",
    address: "220 Pawtucket St", city: "Lowell", zip: "01854",
    source_name: "University of Massachusetts Lowell" },

  { section: "E", title: "Northern Essex Community College Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "NECC Veterans Services — Haverhill + Lawrence campuses; Yellow Ribbon participant; bilingual (Spanish/English) outreach. VA benefits certification, peer mentoring, dedicated veterans lounge, SVA chapter, and Hispanic veteran outreach pipeline.",
    website_url: "https://www.necc.mass.edu/veterans/", phone: "978-556-3700",
    address: "100 Elliott St", city: "Haverhill", zip: "01830",
    source_name: "Northern Essex Community College" },

  { section: "E", title: "Lowell Regional Transit Authority LRTA",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "LRTA — Greater Lowell's public bus transit system (16 fixed routes serving Lowell + 11 surrounding towns). Reduced-fare passes for veterans (with VA ID), seniors (60+), and persons with disabilities. LRTA RoadRunner paratransit for veterans unable to use fixed-route.",
    website_url: "https://www.lrta.com/", phone: "978-452-6161",
    address: "100 Hale St", city: "Lowell", zip: "01850",
    source_name: "Lowell Regional Transit Authority" },

  { section: "E", title: "Merrimack Valley Regional Transit Authority MVRTA",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "MVRTA — Merrimack Valley's public bus transit system serving Lawrence + Haverhill + Methuen + Andover + 12 surrounding towns. Reduced-fare passes for veterans (with VA ID), seniors (60+), and persons with disabilities. Ring-and-Ride paratransit available.",
    website_url: "https://mvrta.com/", phone: "978-469-6878",
    address: "85 Railroad Ave", city: "Haverhill", zip: "01835",
    source_name: "Merrimack Valley Regional Transit Authority" },

  { section: "E", title: "Northeast Legal Aid",
    cat: "legal", sub: "Legal Aid Services",
    desc: "NLA — free civil legal services for low-income residents of Essex, northern Middlesex, and northern Worcester counties. Housing/eviction, public benefits (MassHealth/SSI), domestic violence, family law, consumer-debt, and immigration. Veteran intake prioritized; Lawrence + Lowell offices.",
    website_url: "https://northeastlegalaid.org/", phone: "978-458-1465",
    address: "50 Island St, Suite 203B", city: "Lawrence", zip: "01840",
    source_name: "Northeast Legal Aid" },

  { section: "E", title: "Megan House Foundation Lowell Recovery",
    cat: "substance-recovery", sub: "Veteran Recovery Programs",
    desc: "Lowell-area women's substance-recovery housing (3 sober homes for women in long-term recovery). Peer-led, abstinence-based; serves Merrimack Valley + Greater Lowell women incl. women veterans referred from Bedford VAMC SARRTP + outpatient programs.",
    website_url: "https://www.theinnatmeganhouse.org/", phone: "978-441-9292",
    address: "Lowell area sober homes", city: "Lowell", zip: "01852",
    source_name: "Megan House Foundation" },

  // ===========================================================================
  // F. BROCKTON DEPTH (was 6 — adding healthcare/food/transit/education/community)
  // ===========================================================================
  { section: "F", title: "Good Samaritan Medical Center Brockton",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Good Samaritan Medical Center — Steward Health Care community hospital in Brockton; cardiac, surgical, orthopedic, OB/GYN, and behavioral-health services. Common VA Community Care destination for Brockton VAMC + South Shore + Plymouth County veterans.",
    website_url: "https://www.goodsamaritanmedical.com/", phone: "508-427-3000",
    address: "235 N Pearl St", city: "Brockton", zip: "02301",
    source_name: "Good Samaritan Medical Center (Steward Health Care)" },

  { section: "F", title: "Signature Healthcare Brockton Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Signature Healthcare Brockton Hospital — independent community hospital in Brockton; cardiac, surgical, orthopedic, OB/GYN, and behavioral-health services. 2nd-largest Brockton hospital; common VA Community Care destination for Plymouth County veterans.",
    website_url: "https://www.signature-healthcare.org/", phone: "508-941-7000",
    address: "680 Centre St", city: "Brockton", zip: "02302",
    source_name: "Signature Healthcare" },

  { section: "F", title: "Brockton Area Multi-Services Inc BAMSI",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "BAMSI — Brockton-area human-services nonprofit serving 33,000+ MA residents annually. Mental-health, addiction-recovery, intellectual + developmental disability supports, and family services across SE MA. Veteran-friendly; coordinates with Brockton VAMC for referrals.",
    website_url: "https://www.bamsi.org/", phone: "508-580-6000",
    address: "10 Christy's Dr", city: "Brockton", zip: "02301",
    source_name: "Brockton Area Multi-Services Inc." },

  { section: "F", title: "Brockton Visiting Nurse Association",
    cat: "end-of-life-services", sub: "In-Home Care & Skilled Nursing",
    desc: "BVNA — Greater Brockton home-health-care nonprofit. Skilled nursing, rehabilitation therapy, hospice, palliative care, medical social work, and home-health aide services. Medicare/MassHealth/TRICARE accepted; serves Brockton-area veterans aging in place.",
    website_url: "https://www.brocktonvna.org/", phone: "508-583-3070",
    address: "500 W Chestnut St", city: "Brockton", zip: "02301",
    source_name: "Brockton VNA" },

  { section: "F", title: "Massasoit Community College Veterans Center",
    cat: "education", sub: "College & University Programs",
    desc: "Massasoit CC Veterans Center — Brockton + Canton campuses; Yellow Ribbon participant; ~250 veteran/military-spouse students. VA benefits certification, peer mentoring, dedicated veterans lounge, and SVA chapter. Brockton VAMC referral pipeline.",
    website_url: "https://www.massasoit.edu/veterans/", phone: "508-588-9100",
    address: "1 Massasoit Blvd", city: "Brockton", zip: "02302",
    source_name: "Massasoit Community College" },

  { section: "F", title: "Bridgewater State University Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "BSU Veterans Services — Yellow Ribbon participant; SVA chapter; dedicated veterans lounge. Strong undergrad/grad enrollment from Brockton VAMC + Joint Base Cape Cod transitioning service members; veteran-focused academic coaching + tutoring.",
    website_url: "https://www.bridgew.edu/veterans-services", phone: "508-531-1290",
    address: "131 Summer St", city: "Bridgewater", zip: "02325",
    source_name: "Bridgewater State University" },

  { section: "F", title: "Brockton Area Transit Authority BAT",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "BAT — Brockton-area public bus transit system (10 fixed routes serving Brockton + 7 surrounding towns). Reduced-fare passes for veterans (with VA ID), seniors (60+), and persons with disabilities. BAT Paratransit for veterans unable to use fixed-route.",
    website_url: "https://www.ridebat.com/", phone: "508-588-1000",
    address: "155 Court St", city: "Brockton", zip: "02302",
    source_name: "Brockton Area Transit Authority" },

  { section: "F", title: "Self Help Inc Brockton",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Self Help Inc — Brockton-area community-action agency serving Plymouth + Norfolk + Bristol counties. LIHEAP fuel-assistance, Head Start, weatherization, financial coaching, VITA tax prep, SNAP outreach, and CSBG case management for low-income SE MA veterans.",
    website_url: "https://www.selfhelpinc.org/", phone: "508-588-0447",
    address: "780 W Main St", city: "Avon", zip: "02322",
    source_name: "Self Help Inc." },

  { section: "F", title: "Old Colony YMCA Brockton",
    cat: "community-support", sub: "Fitness, Sports & Wellness Groups",
    desc: "Old Colony YMCA — Brockton-headquartered Y serving Plymouth + Norfolk + Bristol counties. Free + reduced-fee memberships for veterans, Vets Connect peer-support group, military-family programming, and youth + teen + adult fitness/wellness/childcare programs.",
    website_url: "https://www.oldcolonyymca.org/", phone: "508-583-2155",
    address: "320 Main St", city: "Brockton", zip: "02301",
    source_name: "Old Colony YMCA" },

  { section: "F", title: "Brockton Public Library Veterans Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Brockton Public Library veteran-services desk + Veterans Resource Collection. Free internet/computer access, resume coaching, VA forms assistance, and referral to Brockton VSO + Massasoit CC Veterans Center for Plymouth County veterans without home internet.",
    website_url: "https://brocktonpubliclibrary.org/", phone: "508-580-7890",
    address: "304 Main St", city: "Brockton", zip: "02301",
    source_name: "Brockton Public Library" },

  { section: "F", title: "South Shore Stars Brockton",
    cat: "family-support", sub: "Childcare Assistance",
    desc: "South Shore Stars — Brockton-area early-education + childcare nonprofit. Subsidized + EEC voucher childcare for low-income working veteran families (infant/toddler/preschool/before-after-school/summer); 6 Brockton + South Shore centers; bilingual staff.",
    website_url: "https://www.southshorestars.org/", phone: "508-587-1716",
    address: "44 W Elm St", city: "Brockton", zip: "02301",
    source_name: "South Shore Stars" },

  { section: "F", title: "MainSpring House Brockton Shelter",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "Father Bill's & MainSpring's Brockton emergency shelter (88 beds nightly + day services). Walk-in intake; intensive case management, hot evening meal, medical screening, mail service, and SSVF rapid-rehousing pipeline for Plymouth County veterans referred from Brockton VAMC.",
    website_url: "https://helpfbms.org/get-help/find-shelter/", phone: "508-587-5441",
    address: "54 N Main St", city: "Brockton", zip: "02301",
    source_name: "Father Bill's & MainSpring" },

  // ===========================================================================
  // G. NEW BEDFORD DEPTH (was 7 — adding healthcare/food/transit/education/community)
  // ===========================================================================
  { section: "G", title: "Southcoast Hospitals St Lukes Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "St. Luke's Hospital — Southcoast Health flagship academic medical center in New Bedford; cardiac, oncology (Centers for Cancer Care), surgical, orthopedic, OB/GYN, and Level III trauma services. Common VA Community Care destination for Bristol + Plymouth County southern veterans.",
    website_url: "https://www.southcoast.org/locations/st-lukes-hospital/", phone: "508-997-1515",
    address: "101 Page St", city: "New Bedford", zip: "02740",
    source_name: "Southcoast Health" },

  { section: "G", title: "Hawthorn Medical Associates",
    cat: "healthcare", sub: "Primary Care",
    desc: "Hawthorn Medical — Southcoast's largest multi-specialty primary care + specialty group serving SouthCoast MA + RI. Internal medicine, family medicine, pediatrics, cardiology, GI, surgery. Common Southcoast Health primary-care home for SouthCoast veterans + military families.",
    website_url: "https://www.southcoasthealthmedicalgroup.org/locations/hawthorn-medical/", phone: "508-996-3991",
    address: "535 Faunce Corner Rd", city: "Dartmouth", zip: "02747",
    source_name: "Southcoast Health Medical Group" },

  { section: "G", title: "Hunger Commission of Southeastern Massachusetts",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Hunger Commission — SouthCoast's largest hunger-relief organization (under United Way of Greater New Bedford). Distributes 1.5M+ lbs of food annually to 60+ partner pantries + meal sites across Bristol + southern Plymouth counties. Veterans served same-day at any partner pantry.",
    website_url: "https://www.unitedwayofgnb.org/hunger-commission", phone: "508-994-9625",
    address: "105 William St", city: "New Bedford", zip: "02740",
    source_name: "Hunger Commission of Southeastern MA" },

  { section: "G", title: "M.O. Sister Rose House New Bedford",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "M.O. (Market Ministries) Sister Rose House — New Bedford's primary emergency shelter (50+ beds) + soup kitchen + food pantry. Walk-in intake; serves SouthCoast unhoused adults including New Bedford-area veterans referred from Hyannis CBOC + Brockton VAMC.",
    website_url: "https://www.marketministries.org/", phone: "508-997-7787",
    address: "71 William St", city: "New Bedford", zip: "02740",
    source_name: "Market Ministries Inc." },

  { section: "G", title: "Bristol Community College Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "BCC Veterans Services — Fall River + New Bedford + Attleboro + Taunton campuses; Yellow Ribbon participant; ~350 veteran/military-spouse students. VA benefits certification, peer mentoring, dedicated veterans lounges, and SVA chapter.",
    website_url: "https://www.bristolcc.edu/admissions/veteranservices/", phone: "508-678-2811",
    address: "777 Elsbree St", city: "Fall River", zip: "02720",
    source_name: "Bristol Community College" },

  { section: "G", title: "UMass Dartmouth Veterans Resource Center",
    cat: "education", sub: "College & University Programs",
    desc: "UMassD VRC — Yellow Ribbon participant; SVA chapter; dedicated veterans lounge. Strong undergrad/grad enrollment from Joint Base Cape Cod + Naval Station Newport (RI) transitioning service members; veteran-focused academic coaching.",
    website_url: "https://www.umassd.edu/veterans/", phone: "508-999-8757",
    address: "285 Old Westport Rd", city: "Dartmouth", zip: "02747",
    source_name: "University of Massachusetts Dartmouth" },

  { section: "G", title: "Southeastern Regional Transit Authority SRTA",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "SRTA — SouthCoast's public bus transit system (35 fixed routes serving New Bedford + Fall River + 8 surrounding towns). Reduced-fare passes for veterans (with VA ID), seniors (60+), and persons with disabilities. SRTA Paratransit available.",
    website_url: "https://www.srtabus.com/", phone: "508-999-5211",
    address: "700 Pleasant St", city: "New Bedford", zip: "02740",
    source_name: "Southeastern Regional Transit Authority" },

  { section: "G", title: "Coastline Elderly Services",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Coastline — SouthCoast Aging Services Access Point (ASAP) serving older adults (60+) in New Bedford + Acushnet + Dartmouth + Fairhaven + Mattapoisett + Marion + Rochester + Wareham. Home care, Meals on Wheels, family-caregiver support, SHINE counseling.",
    website_url: "https://www.coastlinenb.org/", phone: "508-999-6400",
    address: "1646 Purchase St", city: "New Bedford", zip: "02740",
    source_name: "Coastline Elderly Services" },

  { section: "G", title: "Catholic Social Services Diocese of Fall River",
    cat: "family-support", sub: "Military Family Support",
    desc: "Catholic Social Services of the Diocese of Fall River — SouthCoast multi-service nonprofit. Counseling, refugee resettlement, immigration legal services, basic needs, foster care, and emergency shelter (Donovan House) for SouthCoast families regardless of religion incl. veteran families.",
    website_url: "https://cssdioc.org/", phone: "508-674-4681",
    address: "1600 Bay St", city: "Fall River", zip: "02724",
    source_name: "Catholic Social Services Diocese of Fall River" },

  { section: "G", title: "PACE Inc New Bedford",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "People Acting in Community Endeavors — New Bedford's primary community-action agency. LIHEAP fuel-assistance, Head Start, weatherization, financial coaching, VITA tax prep, SNAP outreach, and CSBG case management for low-income SouthCoast veterans + families.",
    website_url: "https://www.paceinfo.org/", phone: "508-999-9920",
    address: "166 William St", city: "New Bedford", zip: "02740",
    source_name: "People Acting in Community Endeavors" },

  { section: "G", title: "Boys and Girls Club of Greater New Bedford",
    cat: "family-support", sub: "Youth Programs",
    desc: "BGCGNB — SouthCoast's largest youth-development nonprofit serving 6,000+ children annually at 3 New Bedford clubhouses + summer programs. Subsidized after-school + summer programs, sports leagues, and STEM programming for low-income veteran children.",
    website_url: "https://www.bgcgnb.org/", phone: "508-993-1252",
    address: "166 Jenney St", city: "New Bedford", zip: "02740",
    source_name: "Boys & Girls Club of Greater New Bedford" },

  { section: "G", title: "Greater New Bedford Center for Independent Living",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Operated by Bristol County Independent Living, this New Bedford CIL serves SouthCoast disabled veterans + civilians. Peer support, advocacy, nursing-home transition services, assistive technology, and PCA management for SouthCoast disabled veterans.",
    website_url: "https://www.bcilcenter.org/", phone: "508-679-9210",
    address: "65 Eastern Ave", city: "Fall River", zip: "02723",
    source_name: "Bristol County Independent Living" },

  // ===========================================================================
  // H. FALL RIVER DEPTH (was 2 — major gap-fill across all categories)
  // ===========================================================================
  { section: "H", title: "Charlton Memorial Hospital Fall River",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Charlton Memorial — Southcoast Health's Fall River academic medical center; cardiac (cardiothoracic surgery), oncology, surgical, orthopedic, OB/GYN, and Level III trauma services. Largest Fall River hospital + common VA Community Care destination for Bristol County veterans.",
    website_url: "https://www.southcoast.org/locations/charlton-memorial-hospital/", phone: "508-679-3131",
    address: "363 Highland Ave", city: "Fall River", zip: "02720",
    source_name: "Southcoast Health" },

  { section: "H", title: "Saint Annes Hospital Fall River",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Saint Anne's — Steward Health Care community hospital in Fall River; cardiac, surgical, orthopedic, OB/GYN, behavioral-health, and Center for Pain Management. 2nd-largest Fall River hospital + common VA Community Care destination for Bristol County veterans.",
    website_url: "https://www.saintanneshospital.org/", phone: "508-674-5600",
    address: "795 Middle St", city: "Fall River", zip: "02721",
    source_name: "Saint Anne's Hospital (Steward Health Care)" },

  { section: "H", title: "People Inc Fall River",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "People Incorporated — Fall River-headquartered SouthCoast multi-service nonprofit serving 7,000+ adults annually. Intellectual + developmental disability supports, mental-health residential + outpatient, autism services, and family services. Veteran-friendly; coordinates with Hyannis CBOC.",
    website_url: "https://www.peopleinc-fr.org/", phone: "508-679-5233",
    address: "4 South Main St", city: "Fall River", zip: "02721",
    source_name: "People Incorporated" },

  { section: "H", title: "SSTAR Stanley Street Treatment and Resources",
    cat: "substance-recovery", sub: "Detox Programs",
    desc: "SSTAR — Fall River-headquartered SouthCoast addiction-treatment + behavioral-health system. Medical detox (50 beds), residential rehab, MAT (methadone, suboxone), outpatient counseling, dual-diagnosis treatment, and needle exchange. Common Brockton VAMC + Hyannis CBOC veteran referral.",
    website_url: "https://www.sstar.org/", phone: "508-679-5222",
    address: "386 Stanley St", city: "Fall River", zip: "02720",
    source_name: "Stanley Street Treatment and Resources" },

  { section: "H", title: "Citizens for Citizens Inc Fall River",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "CFC Inc — Fall River-area community-action agency serving Fall River + Taunton + Attleboro. LIHEAP fuel-assistance, Head Start, weatherization, financial coaching, VITA tax prep, SNAP outreach, and CSBG case management for low-income Bristol County veterans + families.",
    website_url: "https://www.cfcinc.org/", phone: "508-679-0041",
    address: "264 Griffin St", city: "Fall River", zip: "02724",
    source_name: "Citizens for Citizens Inc." },

  { section: "H", title: "Catholic Memorial Home Fall River",
    cat: "end-of-life-services", sub: "Assisted Living & Nursing Homes",
    desc: "Diocesan Health Facilities Catholic Memorial Home — Fall River skilled-nursing facility (240 beds) + rehabilitation; sub-acute care, long-term care, Alzheimer's/dementia care, hospice, and respite care. Medicare/MassHealth/VA Aid & Attendance accepted; serves Fall River-area veteran families.",
    website_url: "https://www.cmhfr.org/", phone: "508-679-0011",
    address: "2446 Highland Ave", city: "Fall River", zip: "02720",
    source_name: "Diocesan Health Facilities (Diocese of Fall River)" },

  { section: "H", title: "Greater Fall River YMCA",
    cat: "community-support", sub: "Fitness, Sports & Wellness Groups",
    desc: "YMCA Southcoast — Fall River branch. Free + reduced-fee Y memberships for veterans, military-family programming, swimming + fitness + sports leagues + youth + teen programs + childcare for Bristol County veteran families.",
    website_url: "https://www.ymcasouthcoast.org/", phone: "508-675-7841",
    address: "199 N Main St", city: "Fall River", zip: "02720",
    source_name: "YMCA Southcoast" },

  { section: "H", title: "Greater Fall River Re-Creation",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Greater Fall River Re-Creation — peer-led recovery community organization (RCO) for Bristol County residents in addiction recovery. Sober social events, recovery coaching, peer support, and warm-handoff to SSTAR + Brockton VAMC SARRTP for treatment access.",
    website_url: "https://www.gfrrecreation.org/", phone: "508-557-7115",
    address: "190 Bedford St, 2nd Floor", city: "Fall River", zip: "02720",
    source_name: "Greater Fall River Re-Creation" },

  { section: "H", title: "Boys and Girls Club of Fall River",
    cat: "family-support", sub: "Youth Programs",
    desc: "BGCFR — Fall River-area youth-development nonprofit serving 4,000+ children annually at 3 Fall River clubhouses + summer camp. Subsidized after-school + summer programs, sports leagues, STEM programming, and Career Launch college/military prep for veteran children.",
    website_url: "https://www.bgcfr.org/", phone: "508-672-6340",
    address: "803 Bedford St", city: "Fall River", zip: "02720",
    source_name: "Boys & Girls Club of Fall River" },

  { section: "H", title: "Family Service Association Fall River",
    cat: "family-support", sub: "Family Counseling",
    desc: "FSA — Fall River-area mental-health + family-services nonprofit. Outpatient counseling, in-home family preservation, foster care + adoption, domestic-violence services, supervised visitation, and immigrant-family programs on sliding-fee scale. Veteran families welcomed.",
    website_url: "https://www.frfsa.org/", phone: "508-678-7542",
    address: "101 Rock St", city: "Fall River", zip: "02720",
    source_name: "Family Service Association of Greater Fall River" },

  { section: "H", title: "Hands of Hope Outreach Center Fall River",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Hands of Hope — Fall River-area emergency-food + outreach ministry. Food pantry (3-day emergency supply), clothing closet, hot meals, and showers for unhoused + low-income Fall River residents. Walk-in intake; veterans served regardless of VA enrollment status.",
    website_url: "https://www.handsofhopefallriver.org/", phone: "508-678-1080",
    address: "208 Hartwell St", city: "Fall River", zip: "02721",
    source_name: "Hands of Hope Outreach Center" },

  { section: "H", title: "Greater Attleboro Taunton Regional Transit Authority GATRA",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "GATRA — Attleboro/Taunton/Plymouth-area public bus transit system (28 fixed routes serving 28 towns in southeastern MA including Plymouth + Wareham + Carver). Reduced-fare passes for veterans (with VA ID), seniors (60+), and persons with disabilities.",
    website_url: "https://www.gatra.org/", phone: "508-222-6929",
    address: "10 Oak St", city: "Taunton", zip: "02780",
    source_name: "Greater Attleboro Taunton Regional Transit Authority" },

  { section: "H", title: "South Coastal Counties Legal Services",
    cat: "legal", sub: "Legal Aid Services",
    desc: "SCCLS — free civil legal services for low-income SouthCoast residents (Bristol, Plymouth, Cape & Islands counties). Housing/eviction, public benefits, employment, family law, immigration, and consumer-debt. Veteran intake prioritized; offices in Fall River + New Bedford + Hyannis + Brockton.",
    website_url: "https://www.sccls.org/", phone: "508-676-6265",
    address: "231 Main St, Suite 201", city: "Fall River", zip: "02721",
    source_name: "South Coastal Counties Legal Services" },

  // ===========================================================================
  // I. QUINCY DEPTH (was 5 — adding healthcare/food/transit/education/community)
  // ===========================================================================
  { section: "I", title: "South Shore Hospital Weymouth",
    cat: "healthcare", sub: "Specialty Care",
    desc: "South Shore Hospital — South Shore Health's Weymouth flagship academic medical center; cardiac, oncology (Dana-Farber/Brigham + Women's affiliate), surgical, orthopedic, OB/GYN, and Level II trauma services. Common VA Community Care destination for Norfolk + Plymouth coastal veterans.",
    website_url: "https://www.southshorehealth.org/locations/south-shore-hospital", phone: "781-624-8000",
    address: "55 Fogg Rd", city: "Weymouth", zip: "02190",
    source_name: "South Shore Health" },

  { section: "I", title: "Manet Community Health Center",
    cat: "healthcare", sub: "Primary Care",
    desc: "Manet CHC — South Shore FQHC with 5 sites (Quincy, North Quincy, Hull, Snug Harbor, Taunton). Primary care, behavioral health, dental, OB/GYN, optometry, and on-site pharmacy on sliding-fee scale. Multilingual staff (Mandarin, Vietnamese, Spanish, Cantonese).",
    website_url: "https://www.manetchc.org/", phone: "617-471-8683",
    address: "110 W Squantum St", city: "Quincy", zip: "02171",
    source_name: "Manet Community Health Center" },

  { section: "I", title: "Atrius Health Quincy",
    cat: "healthcare", sub: "Primary Care",
    desc: "Atrius Health — Optum-affiliated multi-specialty primary care + specialty group with multiple South Shore offices. Internal medicine, pediatrics, cardiology, ophthalmology, dermatology, OB/GYN. Common Quincy-area primary-care home for veterans with TRICARE/MassHealth/Medicare.",
    website_url: "https://www.atriushealth.org/", phone: "617-745-0000",
    address: "300 Congress St", city: "Quincy", zip: "02169",
    source_name: "Atrius Health (Optum)" },

  { section: "I", title: "Quincy Community Action Programs",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "QCAP — Quincy-area community-action agency serving Quincy + Weymouth + Braintree + Milton + Hull + Hingham. LIHEAP fuel-assistance, Head Start, weatherization, financial coaching, VITA tax prep, SNAP outreach, and CSBG case management for low-income South Shore veterans.",
    website_url: "https://www.qcap.org/", phone: "617-479-8181",
    address: "1509 Hancock St", city: "Quincy", zip: "02169",
    source_name: "Quincy Community Action Programs" },

  { section: "I", title: "Quincy Asian Resources Inc",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "QARI — Quincy-area multi-service nonprofit serving Asian-American community (Chinese, Vietnamese, Korean, Cambodian, Filipino). ESL classes, citizenship + immigration legal, youth + senior programs, cultural events. Asian-American veterans + military families served with bilingual support.",
    website_url: "https://www.quincyasianresources.org/", phone: "617-472-2200",
    address: "1509 Hancock St, 2nd Floor", city: "Quincy", zip: "02169",
    source_name: "Quincy Asian Resources Inc." },

  { section: "I", title: "Quincy College Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "Quincy College Veterans Services — public 2-year college; Yellow Ribbon participant; ~150 veteran/military-spouse students. VA benefits certification, peer mentoring, dedicated veterans lounge, and SVA chapter. Strong nursing + allied-health + business programs.",
    website_url: "https://quincycollege.edu/services/veterans-services/", phone: "617-984-1700",
    address: "1250 Hancock St", city: "Quincy", zip: "02169",
    source_name: "Quincy College" },

  { section: "I", title: "Eastern Nazarene College Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "ENC Veterans Services — Yellow Ribbon participant; certifies VA education benefits (Ch. 33/30/35); Christian liberal-arts undergrad + adult degree-completion programs. Strong veteran enrollment from Coast Guard Boston + South Shore transitioning service members.",
    website_url: "https://www.enc.edu/financial-aid/military-veterans/", phone: "617-745-3000",
    address: "23 E Elm Ave", city: "Quincy", zip: "02170",
    source_name: "Eastern Nazarene College" },

  { section: "I", title: "Interfaith Social Services Quincy",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Interfaith Social Services — Quincy-area faith-based multi-service nonprofit serving Norfolk County. Pantry Shelf food pantry, mental-health counseling on sliding-fee scale, holiday adoption, and Bureau Drawers professional-clothing program for low-income South Shore veterans.",
    website_url: "https://www.interfaithsocialservices.org/", phone: "617-773-6203",
    address: "105 Adams St", city: "Quincy", zip: "02169",
    source_name: "Interfaith Social Services" },

  { section: "I", title: "Bay State Community Services Quincy",
    cat: "substance-recovery", sub: "Outpatient Recovery",
    desc: "BSCS — Quincy-headquartered SouthShore behavioral-health + substance-recovery nonprofit. Outpatient mental-health, MAT, recovery coaching, child + family services, and Steven A. Cohen Military Family Clinic at Bay State (no-cost mental-health for post-9/11 veteran families).",
    website_url: "https://www.baystatecs.org/", phone: "617-471-8400",
    address: "500 Victory Rd", city: "Quincy", zip: "02171",
    source_name: "Bay State Community Services" },

  { section: "I", title: "Quincy Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Quincy COA + Kennedy Center for Active Adults — Quincy's Aging Services Access Point partner. Wellness programs, fitness classes, congregate meals, transportation, SHINE health-insurance counseling, social-work services, and family-caregiver support for Quincy older veterans.",
    website_url: "https://www.quincyma.gov/government/elder_services/index.php", phone: "617-376-1506",
    address: "440 East Squantum St", city: "Quincy", zip: "02171",
    source_name: "City of Quincy Council on Aging" },

  { section: "I", title: "Beth Israel Deaconess Hospital Milton",
    cat: "healthcare", sub: "Specialty Care",
    desc: "BID Milton — Beth Israel Lahey Health community hospital in Milton; cardiac, surgical, orthopedic, OB/GYN, behavioral-health, and emergency services for Milton + Quincy + Randolph + Canton + surrounding South Shore communities. Common VA Community Care referral destination.",
    website_url: "https://www.bidmilton.org/", phone: "617-696-4600",
    address: "199 Reedsdale Rd", city: "Milton", zip: "02186",
    source_name: "Beth Israel Lahey Health" },

  { section: "I", title: "Old Colony Hospice and Palliative Care",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Old Colony Hospice — South Shore hospice + palliative-care nonprofit serving Norfolk + Plymouth + Bristol coastal counties. In-home hospice care, palliative care, Dr. Ruth McLain Hospice Home (West Bridgewater), bereavement counseling, and We Honor Veterans pinning ceremony program.",
    website_url: "https://www.oldcolonyhospice.org/", phone: "781-341-4145",
    address: "321 Main St", city: "Stoughton", zip: "02072",
    source_name: "Old Colony Hospice & Palliative Care" },

  // ===========================================================================
  // J. LYNN DEPTH (was 4 — adding healthcare/food/transit/education/community)
  // ===========================================================================
  { section: "J", title: "Salem Hospital Mass General Brigham",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Salem Hospital — Mass General Brigham North Shore community hospital; cardiac, oncology (Mass General Cancer Center at Salem), surgical, orthopedic, OB/GYN, and behavioral-health services. Largest North Shore hospital + common VA Community Care destination for Essex County veterans.",
    website_url: "https://www.massgeneralbrigham.org/salem", phone: "978-741-1200",
    address: "81 Highland Ave", city: "Salem", zip: "01970",
    source_name: "Mass General Brigham" },

  { section: "J", title: "Beverly Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Beverly Hospital — Beth Israel Lahey Health North Shore community hospital; cardiac, surgical, orthopedic, OB/GYN, and behavioral-health services. 2nd-largest North Shore hospital + common VA Community Care destination for North Shore veterans referred from Bedford VAMC + Lynn CHC.",
    website_url: "https://www.beverlyhospital.org/", phone: "978-922-3000",
    address: "85 Herrick St", city: "Beverly", zip: "01915",
    source_name: "Beth Israel Lahey Health" },

  { section: "J", title: "North Shore Community College Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "NSCC Veterans Services — Lynn + Danvers campuses; Yellow Ribbon participant; ~250 veteran/military-spouse students. VA benefits certification, peer mentoring, dedicated veterans lounge, SVA chapter, and Lynn Vet Center referral pipeline.",
    website_url: "https://www.northshore.edu/veterans/", phone: "978-762-4000",
    address: "300 Broad St", city: "Lynn", zip: "01901",
    source_name: "North Shore Community College" },

  { section: "J", title: "Salem State University Veterans Center",
    cat: "education", sub: "College & University Programs",
    desc: "Salem State Veterans Center — Yellow Ribbon participant; SVA chapter; dedicated veterans lounge. Strong undergrad/grad enrollment from North Shore transitioning service members + military spouses; veteran-focused academic coaching + Center for Civic Engagement programming.",
    website_url: "https://www.salemstate.edu/veterans-center", phone: "978-542-7000",
    address: "352 Lafayette St", city: "Salem", zip: "01970",
    source_name: "Salem State University" },

  { section: "J", title: "Endicott College Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "Endicott Veterans Services — Yellow Ribbon participant; certifies VA education benefits (Ch. 33/30/35); SVA chapter; dedicated veterans lounge. Private liberal-arts undergrad + grad programs with strong internship/co-op tradition; military-friendly admissions.",
    website_url: "https://www.endicott.edu/admission/military-students-and-veterans", phone: "978-927-0585",
    address: "376 Hale St", city: "Beverly", zip: "01915",
    source_name: "Endicott College" },

  { section: "J", title: "My Brothers Table Lynn",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "MBT — Lynn's largest soup kitchen + food pantry. Serves 600+ free meals daily (lunch + dinner, year-round) + take-home grocery bags from the Brothers Table Pantry. Walk-in; no documentation required; serves North Shore unhoused + low-income residents incl. Lynn-area veterans.",
    website_url: "https://www.mybrotherstable.org/", phone: "781-595-3224",
    address: "98 Willow St", city: "Lynn", zip: "01901",
    source_name: "My Brothers Table" },

  { section: "J", title: "Open Door Food Pantry Salem",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Open Door — North Shore's largest food pantry + community-meals program serving Cape Ann + Salem (Salem distribution + Gloucester pantry). 3-day emergency food, mobile food pantry, community lunches, and SNAP application assistance for North Shore veterans.",
    website_url: "https://foodpantry.org/", phone: "978-283-6776",
    address: "65 Lafayette St", city: "Salem", zip: "01970",
    source_name: "The Open Door" },

  { section: "J", title: "North Shore Community Action Programs",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "NSCAP — North Shore community-action agency serving Lynn + Salem + Peabody + Beverly + 6 surrounding towns. LIHEAP fuel-assistance, Head Start, weatherization, financial coaching, VITA tax prep, SNAP outreach, and CSBG case management for low-income North Shore veterans.",
    website_url: "https://www.nscap.org/", phone: "978-531-0767",
    address: "98 Main St", city: "Peabody", zip: "01960",
    source_name: "North Shore Community Action Programs" },

  { section: "J", title: "Action Inc North Shore",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Action Inc — Cape Ann community-action agency serving Gloucester + Rockport + Essex + Manchester-by-the-Sea + Ipswich. LIHEAP fuel-assistance, Head Start, weatherization, financial coaching, VITA tax prep, SNAP outreach, and CSBG case management for low-income Cape Ann veterans.",
    website_url: "https://www.actioninc.org/", phone: "978-282-1000",
    address: "180 Main St", city: "Gloucester", zip: "01930",
    source_name: "Action Inc." },

  { section: "J", title: "Greater Lynn Senior Services",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "GLSS — North Shore Aging Services Access Point (ASAP) serving older adults (60+) in Lynn + Lynnfield + Marblehead + Nahant + Saugus + Swampscott. Home care, Meals on Wheels, family-caregiver support, SHINE counseling, transportation, and protective services.",
    website_url: "https://www.glss.net/", phone: "781-599-0110",
    address: "8 Silsbee St", city: "Lynn", zip: "01901",
    source_name: "Greater Lynn Senior Services" },

  { section: "J", title: "La Vida Inc Lynn",
    cat: "substance-recovery", sub: "Outpatient Recovery",
    desc: "La Vida — Lynn-headquartered North Shore substance-recovery + behavioral-health nonprofit. Outpatient counseling, MAT, intensive outpatient, anger-management groups, and bilingual (Spanish/English) recovery services. Serves Bedford VAMC + Lynn CHC referred veteran clients.",
    website_url: "https://www.lavidainc.org/", phone: "781-593-2772",
    address: "10 Wheeler St, Suite 100", city: "Lynn", zip: "01902",
    source_name: "La Vida Inc." },

  { section: "J", title: "Family and Children's Service of Greater Lynn",
    cat: "family-support", sub: "Family Counseling",
    desc: "FCS Lynn — North Shore mental-health + family-services nonprofit. Outpatient therapy, in-home family preservation, foster care, adoption, supervised visitation, and bilingual (Spanish/English) counseling. Sliding-fee scale; Lynn-area veteran families welcomed.",
    website_url: "https://www.fcslynn.org/", phone: "781-598-5517",
    address: "111 N Common St", city: "Lynn", zip: "01902",
    source_name: "Family & Children's Service of Greater Lynn" },

  // ===========================================================================
  // K. CAPE COD / HYANNIS DEPTH (was ~10 — adding healthcare/food/transit/education/community)
  // ===========================================================================
  { section: "K", title: "Cape Cod Hospital Hyannis",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Cape Cod Hospital — Cape Cod Healthcare's flagship academic medical center; cardiac (Heart & Vascular Institute), oncology (Davenport-Mugar Cancer Center), surgical, orthopedic, OB/GYN, and Level III trauma services. Largest Cape hospital + common VA Community Care destination for Cape veterans.",
    website_url: "https://www.capecodhealth.org/cape-cod-hospital/", phone: "508-771-1800",
    address: "27 Park St", city: "Hyannis", zip: "02601",
    source_name: "Cape Cod Healthcare" },

  { section: "K", title: "Falmouth Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Falmouth Hospital — Cape Cod Healthcare community hospital in Upper Cape; cardiac, surgical, orthopedic, OB/GYN, behavioral-health, and emergency services. 2nd Cape hospital + common VA Community Care destination for Falmouth + Bourne + Sandwich + Mashpee + Joint Base Cape Cod veterans.",
    website_url: "https://www.capecodhealth.org/falmouth-hospital/", phone: "508-548-5300",
    address: "100 Ter Heun Dr", city: "Falmouth", zip: "02540",
    source_name: "Cape Cod Healthcare" },

  { section: "K", title: "Cape Cod Community College Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "4Cs Veterans Services — Cape Cod's only public 2-year college; Yellow Ribbon participant; ~200 veteran/military-spouse students. VA benefits certification, peer mentoring, dedicated veterans lounge, SVA chapter, and Joint Base Cape Cod transition pipeline.",
    website_url: "https://www.capecod.edu/veterans/", phone: "508-362-2131",
    address: "2240 Iyannough Rd", city: "West Barnstable", zip: "02668",
    source_name: "Cape Cod Community College" },

  { section: "K", title: "Cape Cod Healthcare Behavioral Health",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Cape Cod Healthcare's behavioral-health division. Inpatient psychiatric (Cape Cod Hospital + Falmouth Hospital), outpatient counseling, IOP, child + adolescent + adult tracks, MAT, and Pinewood Lodge inpatient detox. Common Hyannis CBOC + Brockton VAMC veteran referral.",
    website_url: "https://www.capecodhealth.org/medical-services/behavioral-health/", phone: "508-862-5000",
    address: "27 Park St", city: "Hyannis", zip: "02601",
    source_name: "Cape Cod Healthcare" },

  { section: "K", title: "Cape Cod Regional Transit Authority CCRTA",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "CCRTA — Cape Cod's public bus transit system (8 fixed routes serving 15 Cape towns + the Boston-to-Hyannis express). Reduced-fare passes for veterans (with VA ID), seniors (60+), persons with disabilities. DART (Dial-a-Ride Transportation) paratransit for veterans unable to use fixed-route.",
    website_url: "https://capecodrta.org/", phone: "800-352-7155",
    address: "215 Iyannough Rd", city: "Hyannis", zip: "02601",
    source_name: "Cape Cod Regional Transit Authority" },

  { section: "K", title: "Family Pantry of Cape Cod Harwich",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Family Pantry — Cape Cod's largest food pantry + clothing distribution serving 8,000+ Cape residents annually. Drive-thru pantry distributions, fresh produce, holiday meals, and Backpack BUDDIES weekend meals for low-income Cape children. Walk-in; veterans served same-day.",
    website_url: "https://thefamilypantry.com/", phone: "508-432-6519",
    address: "133 Queen Anne Rd", city: "Harwich", zip: "02645",
    source_name: "Family Pantry of Cape Cod" },

  { section: "K", title: "Cape Cod Council on Aging Network",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Elder Services of Cape Cod & the Islands — Cape's Aging Services Access Point (ASAP) serving older adults (60+) in 15 Cape + Martha's Vineyard + Nantucket towns. Home care, Meals on Wheels, family-caregiver support, SHINE counseling, transportation, and protective services.",
    website_url: "https://www.escci.org/", phone: "508-394-4630",
    address: "68 Route 134", city: "South Dennis", zip: "02660",
    source_name: "Elder Services of Cape Cod & the Islands" },

  { section: "K", title: "Cape Cod Childrens Place",
    cat: "family-support", sub: "Childcare Assistance",
    desc: "Cape Cod Children's Place — Lower Cape early-education + family-resource nonprofit. Subsidized + EEC voucher childcare, parenting education, family literacy, playgroups, and family-stability case management for Cape veteran families with young children.",
    website_url: "https://www.capecodchildrensplace.com/", phone: "508-240-3310",
    address: "1675 Route 6", city: "North Eastham", zip: "02651",
    source_name: "Cape Cod Children's Place" },

  { section: "K", title: "Cape Cod Community Action Champions",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Community Action Committee of Cape Cod & Islands — Cape community-action agency. LIHEAP fuel-assistance, Head Start, weatherization, financial coaching, VITA tax prep, SNAP outreach, and CSBG case management for low-income Cape + Islands veterans + families.",
    website_url: "https://cacci.cc/", phone: "508-771-1727",
    address: "115 Enterprise Rd", city: "Hyannis", zip: "02601",
    source_name: "Community Action Committee of Cape Cod & Islands" },

  { section: "K", title: "Independence House Hyannis",
    cat: "family-support", sub: "Family Counseling",
    desc: "Independence House — Cape Cod's primary domestic-violence + sexual-assault crisis center. 24/7 crisis hotline, emergency shelter, court advocacy, support groups, and prevention education. Serves Cape veteran families experiencing intimate-partner violence regardless of gender or orientation.",
    website_url: "https://www.indhouse.net/", phone: "800-439-6507",
    address: "160 Bassett Ln", city: "Hyannis", zip: "02601",
    source_name: "Independence House Inc." },

  { section: "K", title: "Housing Assistance Corporation Cape Cod",
    cat: "housing", sub: "Rental Assistance",
    desc: "HAC — Cape Cod + Islands' primary housing-services nonprofit. Section 8 rental assistance, homelessness prevention, family-shelter services (NOAH Shelter Hyannis), homebuyer education, and Aging-in-Place home modifications. Strong Hyannis CBOC + JBCC veteran referral pipeline.",
    website_url: "https://haconcapecod.org/", phone: "508-771-5400",
    address: "460 W Main St", city: "Hyannis", zip: "02601",
    source_name: "Housing Assistance Corporation" },

  { section: "K", title: "Cape Organization for Rights of the Disabled",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "CORD — Cape Cod + Islands Independent Living Center. Peer support, advocacy, transition services from nursing homes to community, assistive technology, accessible-housing referrals, and PCA management for disabled Cape + Islands veterans + civilians.",
    website_url: "https://cilcapecod.org/", phone: "508-775-8300",
    address: "106 Bassett Ln", city: "Hyannis", zip: "02601",
    source_name: "Cape Organization for Rights of the Disabled" },
];

await runSeed(ROWS, {
  state: "MA",
  commit: COMMIT,
  scriptName: "seed-ma-wave3.ts (Golden Standard Wave 3 / major-city saturation)",
  urlCheckTimeoutMs: 12000,
  allowBrokenUrls: ALLOW_BROKEN_URLS,
  allowZipBleed: ALLOW_ZIP_BLEED,
  sectionLabels: {
    A: "Boston depth",
    B: "Worcester depth",
    C: "Springfield depth",
    D: "Cambridge / Somerville depth",
    E: "Lowell / Lawrence depth (gap-fill)",
    F: "Brockton depth",
    G: "New Bedford depth",
    H: "Fall River depth (gap-fill)",
    I: "Quincy depth",
    J: "Lynn depth",
    K: "Cape Cod / Hyannis depth",
  },
});
