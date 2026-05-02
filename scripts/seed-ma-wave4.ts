/**
 * MASSACHUSETTS — WAVE 4 (FL-pattern mid-tier city expansion + regional gap-fill, ~96 rows)
 *
 * Founder release 2026-05-02: Wave 4 = MID-TIER CITY EXPANSION across 8
 * priority regions. Mirrors VA Wave 4 Golden Standard exactly. Same FL Wave
 * system. NO Stripe / billing / AI Guide / schema touches. Speed + coverage.
 * Skip stuck URLs with --allow-broken-urls. STOP after Wave 4.
 *
 * Sections (8 mid-tier blocks):
 *   A  Pittsfield + Berkshires depth        (was  6 → +12)
 *   B  North Adams + Northern Berkshires    (was  1 → +12 heavy)
 *   C  Greenfield + Franklin County         (was  2 → +12 heavy)
 *   D  Fitchburg / Leominster / Gardner     (was  3 → +12 heavy)
 *   E  Attleboro + Mansfield + Foxboro      (was  0 → +12 heavy)
 *   F  Marlborough / Hudson / Westborough   (was  0 → +12 heavy)
 *   G  Waltham / Watertown / Framingham     (was  4 → +12)
 *   H  Everett / Malden / Medford / Chelsea / Revere  (was  3 → +12)
 *
 * APPENDS to W1 (139) + W2 (118) + W3 (135) = 392. Post-W4 MA total: ~488.
 *
 * Run:
 *   tsx scripts/seed-ma-wave4.ts                                # dry-run
 *   tsx scripts/seed-ma-wave4.ts --commit --allow-broken-urls   # write
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");
const ALLOW_ZIP_BLEED = process.argv.includes("--allow-zip-bleed");

const ROWS: SeedRow[] = [
  // ===========================================================================
  // A. PITTSFIELD + BERKSHIRES DEPTH (was 6 → +12)
  // ===========================================================================
  { section: "A", title: "ServiceNet Berkshire County",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "ServiceNet's Berkshire County outpatient clinics — Pittsfield, Great Barrington, North Adams. Outpatient counseling, medication management, substance-use treatment, recovery learning communities, and supportive housing for Berkshire-area veterans + low-income residents.",
    website_url: "https://www.servicenet.org/", phone: "413-448-8281",
    address: "333 East St", city: "Pittsfield", zip: "01201",
    source_name: "ServiceNet Inc." },

  { section: "A", title: "The Brien Center for Mental Health & Substance Abuse Services",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Berkshire County's largest mental-health + substance-use provider — outpatient clinics, 24/7 mobile crisis (BCMC), psychiatric emergency services, methadone program, and intensive case management. Strong Pittsfield CBOC referral pipeline for Berkshire veterans.",
    website_url: "https://www.briencenter.org/", phone: "413-499-0412",
    address: "333 East St, Suite A", city: "Pittsfield", zip: "01201",
    source_name: "The Brien Center" },

  { section: "A", title: "Construct Inc",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "South Berkshire's primary homelessness-prevention nonprofit — emergency shelter, rapid rehousing, transitional housing, affordable rentals, and homebuyer education across Great Barrington + Lee + Stockbridge + South County. Serves Berkshire-area veterans referred via SSVF.",
    website_url: "https://constructinc.org/", phone: "413-528-1985",
    address: "316 State Rd", city: "Great Barrington", zip: "01230",
    source_name: "Construct Inc." },

  { section: "A", title: "Berkshire Regional Transit Authority (BRTA)",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "Berkshire County RTA — fixed-route bus service connecting Pittsfield + North Adams + Great Barrington + Lee + Adams + Williamstown; reduced-fare program for low-income riders; ADA Paratransit for Berkshire-area veterans with disabilities.",
    website_url: "https://www.berkshirerta.com/", phone: "413-499-2782",
    address: "1 Columbus Ave", city: "Pittsfield", zip: "01201",
    source_name: "Berkshire Regional Transit Authority" },

  { section: "A", title: "South Community Food Pantry",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "South Community Food Pantry at South Congregational Church Pittsfield — weekly grocery distribution, holiday meal program, and SNAP outreach for low-income Pittsfield residents and Berkshire-area veterans.",
    website_url: "https://southcongregational.org/", phone: "413-447-7641",
    address: "110 South St", city: "Pittsfield", zip: "01201",
    source_name: "South Congregational Church Pittsfield" },

  { section: "A", title: "Berkshire Bounty",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Volunteer-run South Berkshire food-rescue + distribution network — recovers fresh produce + perishables from grocers and farms, redistributes via 30+ pantries across Great Barrington + Lee + Sheffield + Egremont. Serves Berkshire-area veterans referred via local pantries.",
    website_url: "https://www.berkshirebounty.org/", phone: "413-528-2025",
    address: "1 Stockbridge Rd", city: "Great Barrington", zip: "01230",
    source_name: "Berkshire Bounty" },

  { section: "A", title: "Berkshire United Way",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Berkshire County's umbrella nonprofit funder — supports 30+ local agencies serving veterans (Soldier On, Brien Center, Construct, Berkshire Community Action). 211 helpline routing, VITA tax prep, and Working Families coalition for Berkshire-area veteran families.",
    website_url: "https://www.berkshireunitedway.org/", phone: "413-442-6948",
    address: "200 South St", city: "Pittsfield", zip: "01201",
    source_name: "Berkshire United Way" },

  { section: "A", title: "Berkshire Community Action Council",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Berkshire County's Community Action Agency — LIHEAP fuel assistance, weatherization, Head Start, food pantries, financial coaching, VITA tax prep, and SNAP outreach for low-income Berkshire residents and veteran families.",
    website_url: "https://bcacinc.org/", phone: "413-445-4503",
    address: "1531 East St", city: "Pittsfield", zip: "01201",
    source_name: "Berkshire Community Action Council" },

  { section: "A", title: "Community Legal Aid Pittsfield Berkshire County Office",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Community Legal Aid Berkshire County office — free civil legal aid for low-income residents and veterans on housing (eviction defense), public benefits (Medicaid, SNAP, SSI), family law, and consumer protection. Covers Berkshire + Hampden + Hampshire + Worcester.",
    website_url: "https://www.communitylegal.org/", phone: "413-499-1950",
    address: "152 North St, Suite 230", city: "Pittsfield", zip: "01201",
    source_name: "Community Legal Aid" },

  { section: "A", title: "Berkshire Health Systems Family Medicine Pittsfield",
    cat: "healthcare", sub: "Primary Care",
    desc: "Berkshire Health Systems primary-care residency clinic on the BMC campus — family medicine, internal medicine, women's health, and behavioral health integration; serves Berkshire-area veterans not enrolled in VA care or seeking community-based primary care.",
    website_url: "https://www.berkshirehealthsystems.org/", phone: "413-447-2202",
    address: "777 North St", city: "Pittsfield", zip: "01201",
    source_name: "Berkshire Health Systems" },

  { section: "A", title: "Pittsfield Housing Authority",
    cat: "housing", sub: "Rental Assistance",
    desc: "Pittsfield Housing Authority — public housing, Section 8 Housing Choice Voucher program, VASH veteran voucher coordination with Northampton VAMC, and modernization of family + elderly developments across Pittsfield. Local PHA for Berkshire veteran SSVF/HUD-VASH placements.",
    website_url: "https://www.pittsfieldhousingauthority.com/", phone: "413-443-5933",
    address: "65 Columbus Ave", city: "Pittsfield", zip: "01201",
    source_name: "Pittsfield Housing Authority" },

  { section: "A", title: "Lee Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Lee Council on Aging Senior Center — congregate meals, fitness classes, transportation, SHINE health-insurance counseling, and outreach for Lee + Tyringham + Becket older adults and retired veterans.",
    website_url: "https://www.lee.ma.us/council-aging", phone: "413-243-5545",
    address: "21 Crossway Village", city: "Lee", zip: "01238",
    source_name: "Town of Lee" },

  // ===========================================================================
  // B. NORTH ADAMS + NORTHERN BERKSHIRES (was 1 → +12 heavy)
  // ===========================================================================
  { section: "B", title: "Berkshire Medical Center North Adams Campus",
    cat: "healthcare", sub: "Specialty Care",
    desc: "BMC North Adams (formerly North Adams Regional Hospital) — emergency department, primary care, specialty clinics, lab, imaging, and behavioral health services for Northern Berkshire veterans and residents. Common Pittsfield CBOC + VA Community Care referral.",
    website_url: "https://www.berkshirehealthsystems.org/", phone: "413-664-5000",
    address: "71 Hospital Ave", city: "North Adams", zip: "01247",
    source_name: "Berkshire Health Systems" },

  { section: "B", title: "BHS Family Medicine North Adams",
    cat: "healthcare", sub: "Primary Care",
    desc: "Berkshire Health Systems primary-care office in North Adams — family medicine, women's health, and behavioral health integration; serves Northern Berkshire veterans not enrolled in VA care or seeking community-based primary care.",
    website_url: "https://www.berkshirehealthsystems.org/", phone: "413-664-5300",
    address: "98 Church St", city: "North Adams", zip: "01247",
    source_name: "Berkshire Health Systems" },

  { section: "B", title: "Northern Berkshire Community Coalition",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Northern Berkshire's primary community-organizing nonprofit — coalition of 40+ partner agencies, neighborhood organizing, youth + family supports, food security work, and substance-use prevention coalition. Serves Northern Berkshire veteran families and at-risk neighbors.",
    website_url: "https://nbccoalition.org/", phone: "413-663-7588",
    address: "61 Main St, Suite 218", city: "North Adams", zip: "01247",
    source_name: "Northern Berkshire Community Coalition" },

  { section: "B", title: "ServiceNet Northern Berkshire Outpatient",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "ServiceNet's North Adams outpatient clinic — counseling, medication management, substance-use treatment, and recovery learning community. Northern Berkshire site of ServiceNet's Berkshire-Franklin-Hampshire-Hampden network. Serves Northern Berkshire veterans.",
    website_url: "https://www.servicenet.org/", phone: "413-664-4541",
    address: "85 Main St", city: "North Adams", zip: "01247",
    source_name: "ServiceNet Inc." },

  { section: "B", title: "The Brien Center North County",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Brien Center's North County outpatient office — counseling, psychiatric services, intensive outpatient program, recovery support, and 24/7 mobile crisis access for Northern Berkshire veterans + residents. Strong North Adams hospital + MCLA referral pipeline.",
    website_url: "https://www.briencenter.org/", phone: "413-664-4541",
    address: "116 American Legion Dr", city: "North Adams", zip: "01247",
    source_name: "The Brien Center" },

  { section: "B", title: "MCLA Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "Massachusetts College of Liberal Arts — Northern Berkshire's public liberal-arts college. School Certifying Officials, Yellow Ribbon participant, vet-friendly designation; affordable transfer pathways for Northern Berkshire veterans using GI Bill.",
    website_url: "https://www.mcla.edu/admission/military-and-veterans/", phone: "413-662-5410",
    address: "375 Church St", city: "North Adams", zip: "01247",
    source_name: "Massachusetts College of Liberal Arts" },

  { section: "B", title: "Berkshire Food Project",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Berkshire Food Project at First Congregational Church North Adams — community lunch program 5 days/week for Northern Berkshire residents experiencing food insecurity, including Northern Berkshire veterans regardless of VA enrollment.",
    website_url: "https://www.berkshirefoodproject.org/", phone: "413-664-7378",
    address: "134 Main St", city: "North Adams", zip: "01247",
    source_name: "Berkshire Food Project" },

  { section: "B", title: "Friendship Center Food Pantry",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Friendship Center Food Pantry — Northern Berkshire's largest food pantry serving North Adams + Adams + Williamstown + Clarksburg. Weekly grocery distribution, mobile pantry, holiday meals, and SNAP outreach for low-income Northern Berkshire residents and veteran families.",
    website_url: "https://friendshipcenterfoodpantry.com/", phone: "413-664-0123",
    address: "45 Eagle St", city: "North Adams", zip: "01247",
    source_name: "Friendship Center Food Pantry" },

  { section: "B", title: "Northern Berkshire Habitat for Humanity",
    cat: "housing", sub: "Rental Assistance",
    desc: "Northern Berkshire Habitat — affordable homeownership program, critical home-repair program (free repairs for low-income homeowners 60+ and disabled veterans), and aging-in-place modifications across Northern Berkshire County.",
    website_url: "https://www.northernberkshirehabitat.org/", phone: "413-664-4440",
    address: "23 Eagle St, 4th Fl", city: "North Adams", zip: "01247",
    source_name: "Northern Berkshire Habitat for Humanity" },

  { section: "B", title: "Williamstown Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Williamstown Council on Aging Harper Center — congregate meals, transportation, SHINE health-insurance counseling, fitness classes, and outreach for Williamstown + Hancock + New Ashford older adults and retired veterans.",
    website_url: "https://www.williamstownma.gov/coa", phone: "413-458-8250",
    address: "118 Church St", city: "Williamstown", zip: "01267",
    source_name: "Town of Williamstown" },

  { section: "B", title: "Adams Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Adams Council on Aging Senior Center — congregate meals, fitness classes, transportation, SHINE health-insurance counseling, and outreach for Adams + Cheshire + Savoy older adults and retired veterans.",
    website_url: "https://www.town.adams.ma.us/", phone: "413-743-8333",
    address: "3 Hoosac St", city: "Adams", zip: "01220",
    source_name: "Town of Adams" },

  { section: "B", title: "Salvation Army North Adams Corps",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Salvation Army North Adams Corps — food pantry, emergency rent + utility assistance, after-school programs, and Christmas Angel Tree for Northern Berkshire veterans and low-income families.",
    website_url: "https://easternusa.salvationarmy.org/", phone: "413-664-4768",
    address: "292 State Rd", city: "North Adams", zip: "01247",
    source_name: "The Salvation Army" },

  // ===========================================================================
  // C. GREENFIELD + FRANKLIN COUNTY (was 2 → +12 heavy)
  // ===========================================================================
  { section: "C", title: "Baystate Franklin Medical Center",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Baystate Health's Franklin County hospital — emergency department, primary care, specialty clinics, surgery, lab, imaging, and behavioral health services for Franklin County veterans and residents. Common Northampton VAMC + Greenfield CBOC Community Care referral.",
    website_url: "https://www.baystatehealth.org/locations/baystate-franklin-medical-center", phone: "413-773-0211",
    address: "164 High St", city: "Greenfield", zip: "01301",
    source_name: "Baystate Health" },

  { section: "C", title: "Community Action Pioneer Valley",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Pioneer Valley's Community Action Agency for Franklin + Hampshire counties — LIHEAP fuel assistance, weatherization, Head Start, financial coaching, VITA tax prep, food security, and youth services for low-income Franklin County veteran families.",
    website_url: "https://www.communityaction.us/", phone: "413-774-2310",
    address: "393 Main St", city: "Greenfield", zip: "01301",
    source_name: "Community Action Pioneer Valley" },

  { section: "C", title: "Clinical & Support Options Greenfield",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "CSO's Franklin County mental-health agency — outpatient counseling, psychiatric services, mobile crisis (BCMC), substance-use treatment, recovery support, intensive in-home services, and supportive housing for Franklin County veterans and residents.",
    website_url: "https://www.csoinc.org/", phone: "413-774-1000",
    address: "1 Arch Pl, 3rd Fl", city: "Greenfield", zip: "01301",
    source_name: "Clinical & Support Options" },

  { section: "C", title: "Center for Human Development Greenfield",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "CHD's Greenfield clinic — outpatient mental-health and substance-use counseling, psychiatric services, family stabilization, foster care, and Disability Resources for Franklin County veterans and residents. Sliding-scale.",
    website_url: "https://www.chd.org/", phone: "413-774-3320",
    address: "298 Federal St", city: "Greenfield", zip: "01301",
    source_name: "Center for Human Development" },

  { section: "C", title: "ServiceNet Franklin / Hampshire Outpatient",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "ServiceNet's Franklin + Hampshire outpatient clinics — counseling, medication management, substance-use treatment, recovery learning communities, supportive housing, and 24/7 crisis access for Franklin County veterans + residents.",
    website_url: "https://www.servicenet.org/", phone: "413-585-1300",
    address: "129 King St", city: "Northampton", zip: "01060",
    source_name: "ServiceNet Inc." },

  { section: "C", title: "Greenfield Community College Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "GCC Veterans Resource Center — Yellow Ribbon, VA School Certifying Officials, military-friendly designation, transfer support, and Pell Grant counseling; affordable transfer pathways for Franklin County veterans using GI Bill.",
    website_url: "https://www.gcc.mass.edu/", phone: "413-775-1000",
    address: "1 College Dr", city: "Greenfield", zip: "01301",
    source_name: "Greenfield Community College" },

  { section: "C", title: "Stone Soup Café",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Stone Soup Café Greenfield — pay-what-you-can community meal program every Saturday at All Souls Church serving locally-sourced meals to Franklin County residents experiencing food insecurity, including Franklin County veterans regardless of income.",
    website_url: "https://www.stonesoupcafe.org/", phone: "413-624-3481",
    address: "399 Main St", city: "Greenfield", zip: "01301",
    source_name: "Stone Soup Café Inc." },

  { section: "C", title: "Center for Self Reliance Food Pantry",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Community Action's Center for Self Reliance — Franklin County's largest food pantry, serving Greenfield + Buckland + Shelburne + Deerfield + Montague + Orange. Weekly grocery distribution, mobile pantry, and SNAP outreach for low-income Franklin County veteran families.",
    website_url: "https://www.communityaction.us/center-for-self-reliance-food-pantry", phone: "413-773-5029",
    address: "101 Munson St", city: "Greenfield", zip: "01301",
    source_name: "Community Action Pioneer Valley" },

  { section: "C", title: "Franklin Regional Transit Authority (FRTA)",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "Franklin County RTA — fixed-route bus service connecting Greenfield + Turners Falls + Montague + Orange + Athol + Northampton; reduced-fare program; ADA Paratransit for Franklin County veterans with disabilities.",
    website_url: "https://www.frta.org/", phone: "413-774-2262",
    address: "12 Olive St", city: "Greenfield", zip: "01301",
    source_name: "Franklin Regional Transit Authority" },

  { section: "C", title: "Community Legal Aid Greenfield Franklin County Office",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Community Legal Aid Franklin County office — free civil legal aid for low-income residents and veterans on housing (eviction defense), public benefits (Medicaid, SNAP, SSI), family law, and consumer protection across Franklin + Hampshire + Hampden + Worcester.",
    website_url: "https://www.communitylegal.org/", phone: "413-774-3747",
    address: "20 Hope St", city: "Greenfield", zip: "01301",
    source_name: "Community Legal Aid" },

  { section: "C", title: "ServiceNet Greenfield Family Inn",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "ServiceNet's Greenfield Family Inn — emergency shelter for families experiencing homelessness in Franklin + Hampshire + Hampden counties; case management, housing search, and stabilization for Franklin County veteran families referred via SSVF + DHCD.",
    website_url: "https://www.servicenet.org/", phone: "413-774-3724",
    address: "21 Federal St", city: "Greenfield", zip: "01301",
    source_name: "ServiceNet Inc." },

  { section: "C", title: "North Quabbin Community Coalition Athol",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "NQCC — community coalition serving Athol + Orange + Petersham + Phillipston + Royalston + Warwick + Wendell. Substance-use prevention, food security, housing stability, and recovery supports for North Quabbin veterans and rural residents.",
    website_url: "https://www.nqcc.org/", phone: "978-249-3703",
    address: "545 Main St", city: "Athol", zip: "01331",
    source_name: "North Quabbin Community Coalition" },

  // ===========================================================================
  // D. FITCHBURG / LEOMINSTER / GARDNER (was 3 → +12 heavy)
  // ===========================================================================
  { section: "D", title: "UMass Memorial HealthAlliance-Clinton Hospital Fitchburg",
    cat: "healthcare", sub: "Specialty Care",
    desc: "UMass Memorial HealthAlliance-Clinton Hospital Burbank Campus Fitchburg — emergency department, primary + specialty care, surgery, lab, imaging, oncology, and behavioral health services for North Central MA veterans. Common Bedford VAMC + Worcester CBOC Community Care referral.",
    website_url: "https://www.umassmemorialhealth.org/locations/healthalliance-clinton-hospital", phone: "978-343-5000",
    address: "275 Nichols Rd", city: "Fitchburg", zip: "01420",
    source_name: "UMass Memorial Health" },

  { section: "D", title: "UMass Memorial HealthAlliance Leominster Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "UMass Memorial HealthAlliance-Clinton Hospital Leominster Campus — Level III trauma center, full-service emergency department, surgery, cardiology, oncology, women's health, and behavioral health for Leominster + Fitchburg + Lunenburg veterans.",
    website_url: "https://www.umassmemorialhealth.org/locations/healthalliance-clinton-hospital", phone: "978-466-2000",
    address: "60 Hospital Rd", city: "Leominster", zip: "01453",
    source_name: "UMass Memorial Health" },

  { section: "D", title: "Heywood Hospital Gardner",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Heywood Hospital — independent community hospital serving Gardner + Athol + Winchendon + Templeton + Westminster + Hubbardston. Emergency dept, primary + specialty care, surgery, oncology, and behavioral health for North Worcester County veterans.",
    website_url: "https://www.heywood.org/", phone: "978-632-3420",
    address: "242 Green St", city: "Gardner", zip: "01440",
    source_name: "Heywood Healthcare" },

  { section: "D", title: "Community HealthLink Fitchburg",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "UMass Memorial Community HealthLink's Fitchburg outpatient clinic — counseling, psychiatric services, mobile crisis (CCS), substance-use treatment, methadone, recovery support, and supportive housing for North Central MA veterans + residents.",
    website_url: "https://www.communityhealthlink.org/", phone: "978-345-7790",
    address: "275 Nichols Rd", city: "Fitchburg", zip: "01420",
    source_name: "Community HealthLink" },

  { section: "D", title: "LUK Inc Fitchburg",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "LUK Inc — North Central MA youth + family + behavioral health agency. Outpatient counseling, intensive in-home services, family stabilization, substance-use prevention, and TAY (transition-age youth) services for Fitchburg-area veteran families.",
    website_url: "https://www.luk.org/", phone: "978-345-0685",
    address: "545 Westminster St", city: "Fitchburg", zip: "01420",
    source_name: "LUK Inc." },

  { section: "D", title: "Fitchburg State University Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "Fitchburg State University — School Certifying Officials, Yellow Ribbon participant, military-friendly designation, dedicated veterans lounge, and SVA chapter; serves North Central MA veterans pursuing 4-year degrees using GI Bill.",
    website_url: "https://www.fitchburgstate.edu/", phone: "978-665-3144",
    address: "160 Pearl St", city: "Fitchburg", zip: "01420",
    source_name: "Fitchburg State University" },

  { section: "D", title: "Mount Wachusett Community College Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "Mount Wachusett CC Veterans Resource Center Gardner — Yellow Ribbon, VA School Certifying Officials, military-friendly designation, dedicated vet lounge; affordable transfer pathways for North Central MA veterans using GI Bill.",
    website_url: "https://mwcc.edu/student-life/veterans-services/", phone: "978-630-9000",
    address: "444 Green St", city: "Gardner", zip: "01440",
    source_name: "Mount Wachusett Community College" },

  { section: "D", title: "Our Father's House Fitchburg",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "Our Father's House — Fitchburg's primary homeless shelter for adults. Emergency shelter, day services, case management, housing search, and rapid rehousing referrals for North Central MA veterans referred via SSVF + Bedford VAMC HCHV.",
    website_url: "https://www.ourfathershouse.org/", phone: "978-345-7903",
    address: "291 River St", city: "Fitchburg", zip: "01420",
    source_name: "Our Father's House Inc." },

  { section: "D", title: "Ginny's Helping Hand Inc Leominster",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Ginny's Helping Hand — Leominster's primary food pantry + thrift store. Weekly grocery distribution, free clothing, holiday meal program, school-supply drive, and emergency assistance for low-income Leominster + Fitchburg veteran families.",
    website_url: "https://www.ginnyshelpinghand.org/", phone: "978-537-1387",
    address: "52 Mechanic St", city: "Leominster", zip: "01453",
    source_name: "Ginny's Helping Hand Inc." },

  { section: "D", title: "Montachusett Regional Transit Authority (MART)",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "Montachusett RTA — fixed-route bus service connecting Fitchburg + Leominster + Gardner + Athol + Winchendon + Devens; reduced-fare program; ADA Paratransit and PT-1 medical transport for North Central MA veterans with disabilities.",
    website_url: "https://www.mrta.us/", phone: "978-345-7711",
    address: "1427R Water St", city: "Fitchburg", zip: "01420",
    source_name: "Montachusett Regional Transit Authority" },

  { section: "D", title: "Cleghorn Neighborhood Center Fitchburg",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Cleghorn Neighborhood Center — Fitchburg neighborhood resource center serving the Cleghorn + downtown areas. After-school programs, youth + family services, ESL classes, food pantry, and community organizing for Fitchburg veteran families.",
    website_url: "https://www.cleghornneighborhoodcenter.org/", phone: "978-342-9706",
    address: "339 Boulder Dr, Suite 102", city: "Fitchburg", zip: "01420",
    source_name: "Cleghorn Neighborhood Center" },

  { section: "D", title: "Montachusett Opportunity Council (MOC)",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "MOC — North Central MA's Community Action Agency for Fitchburg + Leominster + Gardner + Devens. LIHEAP fuel assistance, Head Start, weatherization, food security, financial coaching, VITA tax prep, and SNAP outreach for low-income veteran families.",
    website_url: "https://www.mocinc.org/", phone: "978-345-7040",
    address: "601 River St", city: "Fitchburg", zip: "01420",
    source_name: "Montachusett Opportunity Council" },

  // ===========================================================================
  // E. ATTLEBORO + MANSFIELD + FOXBORO + N. ATTLEBORO (was 0 → +12 heavy)
  // ===========================================================================
  { section: "E", title: "Sturdy Memorial Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Sturdy Memorial Hospital — independent community hospital serving Attleboro + Mansfield + Norton + N. Attleboro + Plainville + Foxboro + Seekonk + Rehoboth. Emergency dept, primary + specialty care, surgery, oncology, women's health, and behavioral health.",
    website_url: "https://www.sturdymemorial.org/", phone: "508-222-5200",
    address: "211 Park St", city: "Attleboro", zip: "02703",
    source_name: "Sturdy Memorial Hospital" },

  { section: "E", title: "Community Counseling of Bristol County Attleboro",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "CCBC's Attleboro outpatient clinic — counseling, psychiatric services, mobile crisis, intensive outpatient program, substance-use treatment, and recovery support for Attleboro + Mansfield + Norton + N. Attleboro veterans and residents.",
    website_url: "https://www.comcounseling.org/", phone: "508-226-4974",
    address: "21 Park St", city: "Attleboro", zip: "02703",
    source_name: "Community Counseling of Bristol County" },

  { section: "E", title: "New Hope Inc Attleboro",
    cat: "family-support", sub: "Family Counseling",
    desc: "New Hope — Greater Attleboro / Taunton's primary domestic-violence + sexual-assault crisis center. 24/7 hotline, emergency shelter, court advocacy, support groups, and prevention education. Serves Attleboro veteran families experiencing intimate-partner violence.",
    website_url: "https://www.new-hope.org/", phone: "800-323-4673",
    address: "140 Park St", city: "Attleboro", zip: "02703",
    source_name: "New Hope Inc." },

  { section: "E", title: "Self Help Inc — Attleboro",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Self Help Inc — Community Action Agency serving Attleboro + Norton + Mansfield + Foxboro + N. Attleboro + Plainville. LIHEAP fuel assistance, weatherization, Head Start, food security, financial coaching, VITA, and SNAP outreach for low-income veteran families.",
    website_url: "https://www.selfhelpinc.org/", phone: "508-588-0447",
    address: "780 W Main St", city: "Norton", zip: "02766",
    source_name: "Self Help Inc." },

  { section: "E", title: "United Way of Greater Attleboro / Taunton",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Greater Attleboro / Taunton's umbrella nonprofit funder — supports 30+ local agencies serving veterans, families, youth, and seniors. 211 helpline routing, VITA tax prep, and Working Families coalition for Attleboro + Taunton veteran families.",
    website_url: "https://www.uwgat.org/", phone: "508-222-2337",
    address: "65 N Main St", city: "Attleboro", zip: "02703",
    source_name: "United Way of Greater Attleboro / Taunton" },

  { section: "E", title: "Salvation Army Attleboro Corps",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Salvation Army Attleboro Corps — food pantry, emergency rent + utility assistance, after-school programs, and Christmas Angel Tree for Attleboro-area veterans and low-income families across Attleboro + N. Attleboro + Mansfield + Norton + Plainville.",
    website_url: "https://easternusa.salvationarmy.org/", phone: "508-222-1148",
    address: "30 Riverbank Rd", city: "Attleboro", zip: "02703",
    source_name: "The Salvation Army" },

  { section: "E", title: "Hebron Food Pantry Attleboro",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Hebron Food Pantry at Bethany Community Church — Attleboro's largest food pantry. Weekly grocery distribution, holiday meal program, mobile pantry, and SNAP outreach for low-income Attleboro veterans and families regardless of religious affiliation.",
    website_url: "https://www.bethanycommunitychurch.com/", phone: "508-222-2982",
    address: "225 N Main St", city: "Attleboro", zip: "02703",
    source_name: "Bethany Community Church" },

  { section: "E", title: "South Coastal Counties Legal Services Attleboro",
    cat: "legal", sub: "Legal Aid Services",
    desc: "SCCLS Attleboro intake — free civil legal aid for low-income residents and veterans on housing (eviction defense), public benefits (Medicaid, SNAP, SSI), family law, elder law, and consumer protection across Bristol + Plymouth + Norfolk + Barnstable counties.",
    website_url: "https://www.sccls.org/", phone: "800-244-9023",
    address: "21 Park St", city: "Attleboro", zip: "02703",
    source_name: "South Coastal Counties Legal Services" },

  { section: "E", title: "Attleboro Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Attleboro Council on Aging Senior Center — congregate meals, transportation, SHINE health-insurance counseling, fitness classes, tax preparation, and outreach for Attleboro older adults and retired veterans.",
    website_url: "https://www.cityofattleboro.us/166/Council-on-Aging", phone: "508-222-2057",
    address: "25 S Main St", city: "Attleboro", zip: "02703",
    source_name: "City of Attleboro" },

  { section: "E", title: "Hockomock Area YMCA Foxboro",
    cat: "community-support", sub: "Fitness, Sports & Wellness Groups",
    desc: "Hockomock Area YMCA Foxboro Branch — fitness center, swimming pool, youth + teen programs, adaptive recreation, and Veterans Free Membership program for Attleboro + Foxboro + Mansfield + Norton + N. Attleboro veterans.",
    website_url: "https://hockymca.org/locations/foxboro-branch/", phone: "508-543-2523",
    address: "67 Mechanic St", city: "Foxboro", zip: "02035",
    source_name: "Hockomock Area YMCA" },

  { section: "E", title: "Mansfield Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Mansfield Council on Aging Senior Center — congregate meals, transportation, SHINE health-insurance counseling, fitness classes, and outreach for Mansfield + Foxboro + Norton older adults and retired veterans.",
    website_url: "https://www.mansfieldma.com/180/Council-on-Aging", phone: "508-261-7368",
    address: "255 Hope St", city: "Mansfield", zip: "02048",
    source_name: "Town of Mansfield" },

  { section: "E", title: "Sturdy Health Family Practice North Attleboro",
    cat: "healthcare", sub: "Primary Care",
    desc: "Sturdy Health primary-care office in North Attleboro — family medicine, internal medicine, women's health, and behavioral-health integration; serves N. Attleboro + Plainville + Mansfield veterans not enrolled in VA care or seeking community-based primary care.",
    website_url: "https://www.sturdymemorial.org/", phone: "508-695-1495",
    address: "10 E Washington St", city: "North Attleboro", zip: "02760",
    source_name: "Sturdy Memorial Hospital" },

  // ===========================================================================
  // F. MARLBOROUGH / HUDSON / WESTBOROUGH / NORTHBOROUGH (was 0 → +12 heavy)
  // ===========================================================================
  { section: "F", title: "UMass Memorial Marlborough Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "UMass Memorial Marlborough Hospital — community hospital serving Marlborough + Hudson + Northborough + Southborough + Westborough + Berlin + Bolton. Emergency dept, primary + specialty care, surgery, oncology, women's health, and behavioral health for MetroWest veterans.",
    website_url: "https://www.umassmemorialhealth.org/locations/marlborough-hospital", phone: "508-481-5000",
    address: "157 Union St", city: "Marlborough", zip: "01752",
    source_name: "UMass Memorial Health" },

  { section: "F", title: "Advocates Inc Marlborough",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Advocates — MetroWest's leading mental-health, autism, and developmental-disability agency. Outpatient counseling, psychiatric services, mobile crisis (Advocates Psychiatric Emergency Services), supportive housing, and ID/DD day supports for Marlborough + Hudson veterans.",
    website_url: "https://www.advocates.org/", phone: "508-628-6300",
    address: "330 Lincoln St", city: "Marlborough", zip: "01752",
    source_name: "Advocates Inc." },

  { section: "F", title: "Wayside Multi-Service Center Marlborough",
    cat: "family-support", sub: "Family Counseling",
    desc: "Wayside Youth & Family Support Network's Marlborough office — outpatient counseling, family stabilization, intensive in-home services, parent support, and TAY (transition-age youth) programs for MetroWest veteran families.",
    website_url: "https://www.waysideyouth.org/", phone: "508-485-4357",
    address: "118 Central St", city: "Hudson", zip: "01749",
    source_name: "Wayside Youth & Family Support Network" },

  { section: "F", title: "Employment Options Inc Marlborough",
    cat: "employment", sub: "Job Placement Programs",
    desc: "Employment Options Inc — MetroWest's clubhouse-model employment agency for adults with mental-health conditions. Vocational training, supported employment, transitional employment, peer support, and Ticket to Work for Marlborough-area veterans in recovery.",
    website_url: "https://www.employmentoptions.org/", phone: "508-485-5051",
    address: "82 Brigham St, Suite 4", city: "Marlborough", zip: "01752",
    source_name: "Employment Options Inc." },

  { section: "F", title: "Marlborough Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Marlborough Council on Aging Senior Center — congregate meals, transportation, SHINE health-insurance counseling, fitness classes, tax prep, and outreach for Marlborough older adults and retired veterans.",
    website_url: "https://www.marlborough-ma.gov/council-aging", phone: "508-485-6492",
    address: "40 New St", city: "Marlborough", zip: "01752",
    source_name: "City of Marlborough" },

  { section: "F", title: "Marlborough Community Cupboard",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Marlborough Community Cupboard — Marlborough's primary food pantry. Weekly grocery distribution, mobile pantry, holiday meal program, and SNAP outreach for low-income Marlborough veterans and families.",
    website_url: "https://marlboroughcommunitycupboard.org/", phone: "508-251-1909",
    address: "255 Main St", city: "Marlborough", zip: "01752",
    source_name: "Marlborough Community Cupboard" },

  { section: "F", title: "Hudson Community Food Pantry",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Hudson Community Food Pantry at First United Methodist Church — Hudson's primary food pantry. Weekly grocery distribution, holiday meal program, and SNAP outreach for low-income Hudson + Berlin + Bolton + Stow veterans and families.",
    website_url: "https://hudsoncommunityfoodpantry.org/", phone: "978-562-7470",
    address: "34 Felton St", city: "Hudson", zip: "01749",
    source_name: "Hudson Community Food Pantry" },

  { section: "F", title: "Hudson Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Hudson Council on Aging Senior Center — congregate meals, transportation, SHINE health-insurance counseling, fitness classes, and outreach for Hudson + Stow + Berlin older adults and retired veterans.",
    website_url: "https://www.townofhudson.org/council-aging", phone: "978-568-9638",
    address: "29 Church St", city: "Hudson", zip: "01749",
    source_name: "Town of Hudson" },

  { section: "F", title: "Westborough Food Pantry",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Westborough Food Pantry — town food pantry serving Westborough + Northborough + Southborough + Hopkinton. Weekly grocery distribution, mobile pantry, and SNAP outreach for low-income MetroWest veterans and families.",
    website_url: "https://www.westboroughfoodpantry.org/", phone: "508-366-3138",
    address: "53 W Main St", city: "Westborough", zip: "01581",
    source_name: "Westborough Food Pantry" },

  { section: "F", title: "Voices Against Violence MetroWest",
    cat: "family-support", sub: "Family Counseling",
    desc: "Wayside's Voices Against Violence — MetroWest's primary domestic-violence + sexual-assault crisis program serving Marlborough + Hudson + Framingham + Natick + Waltham. 24/7 hotline, emergency shelter, court advocacy, and counseling for veteran families.",
    website_url: "https://voicesagainstviolence.org/", phone: "800-593-1125",
    address: "88 Lincoln St", city: "Framingham", zip: "01702",
    source_name: "Wayside Youth & Family Support Network" },

  { section: "F", title: "Boys & Girls Club of MetroWest Marlborough",
    cat: "family-support", sub: "Youth Programs",
    desc: "Boys & Girls Club of MetroWest Marlborough Clubhouse — after-school programs, summer camp, teen leadership, sports, STEM, and college prep for low-income MetroWest youth and military-family children.",
    website_url: "https://bgcmetrowest.org/", phone: "508-481-4242",
    address: "239 Pleasant St", city: "Marlborough", zip: "01752",
    source_name: "Boys & Girls Club of MetroWest" },

  { section: "F", title: "South Middlesex Opportunity Council Marlborough Outreach",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "SMOC Marlborough outreach office — South Middlesex Community Action Agency. LIHEAP fuel assistance, weatherization, Head Start, financial coaching, VITA, and SNAP outreach for Marlborough + Hudson + MetroWest low-income veteran families.",
    website_url: "https://www.smoc.org/", phone: "508-460-0700",
    address: "255 Main St, Suite 110", city: "Marlborough", zip: "01752",
    source_name: "South Middlesex Opportunity Council" },

  // ===========================================================================
  // G. WALTHAM / WATERTOWN / FRAMINGHAM DEPTH (was 4 → +12)
  // ===========================================================================
  { section: "G", title: "Charles River Community Health Waltham",
    cat: "healthcare", sub: "Primary Care",
    desc: "Charles River Community Health Waltham FQHC — federally-qualified health center providing primary care, dental, behavioral health, women's health, pediatrics, and pharmacy on a sliding scale for low-income Waltham + Watertown + Newton veterans and residents.",
    website_url: "https://www.charlesriverhealth.org/", phone: "617-923-0408",
    address: "120 2nd Ave", city: "Waltham", zip: "02451",
    source_name: "Charles River Community Health" },

  { section: "G", title: "Waltham Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Waltham Council on Aging Senior Center — congregate meals, transportation, SHINE health-insurance counseling, fitness classes, tax preparation, and outreach for Waltham older adults and retired veterans.",
    website_url: "https://www.city.waltham.ma.us/council-aging", phone: "781-314-3499",
    address: "488 Main St", city: "Waltham", zip: "02452",
    source_name: "City of Waltham" },

  { section: "G", title: "Watertown Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Watertown Council on Aging Senior Center — congregate meals, transportation, SHINE health-insurance counseling, fitness classes, and outreach for Watertown older adults and retired veterans.",
    website_url: "https://www.watertown-ma.gov/176/Senior-Center", phone: "617-972-6490",
    address: "31 Marshall St", city: "Watertown", zip: "02472",
    source_name: "City of Watertown" },

  { section: "G", title: "Bristol Lodge Soup Kitchen Waltham",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Middlesex Human Service Agency Bristol Lodge — Waltham soup kitchen and emergency men's shelter. Daily hot meals, overnight shelter, day services, case management, and housing search for Waltham-area homeless veterans referred via SSVF + HCHV.",
    website_url: "https://www.mhsainc.org/", phone: "781-894-0756",
    address: "215 Crescent St", city: "Waltham", zip: "02453",
    source_name: "Middlesex Human Service Agency" },

  { section: "G", title: "Healthy Waltham",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Healthy Waltham — community food security nonprofit. Free Farmers Market, mobile food pantry, school food programs, gleaning + food rescue, and nutrition education for low-income Waltham veterans + families.",
    website_url: "https://healthywaltham.org/", phone: "781-314-3829",
    address: "275 Moody St", city: "Waltham", zip: "02453",
    source_name: "Healthy Waltham" },

  { section: "G", title: "REACH Beyond Domestic Violence",
    cat: "family-support", sub: "Family Counseling",
    desc: "REACH Beyond Domestic Violence — Waltham-based domestic-violence agency serving 27 cities + towns in MetroWest + Greater Boston. 24/7 hotline, emergency shelter, court advocacy, support groups, and prevention education for veteran families experiencing IPV.",
    website_url: "https://reachma.org/", phone: "800-899-4000",
    address: "PO Box 540024", city: "Waltham", zip: "02454",
    source_name: "REACH Beyond Domestic Violence" },

  { section: "G", title: "Belmont Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Beech Street Center — Belmont Council on Aging. Congregate meals, transportation, SHINE health-insurance counseling, fitness classes, tax preparation, and outreach for Belmont older adults and retired veterans.",
    website_url: "https://www.belmont-ma.gov/council-on-aging", phone: "617-993-2970",
    address: "266 Beech St", city: "Belmont", zip: "02478",
    source_name: "Town of Belmont" },

  { section: "G", title: "SMOC Common Ground Resource Center Framingham",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "South Middlesex Opportunity Council Common Ground — Framingham's primary day-shelter + resource center for adults experiencing homelessness. Daily meals, hygiene, case management, housing search, and rapid rehousing for MetroWest veterans referred via SSVF.",
    website_url: "https://www.smoc.org/", phone: "508-620-2693",
    address: "354 Waverly St", city: "Framingham", zip: "01702",
    source_name: "South Middlesex Opportunity Council" },

  { section: "G", title: "MetroWest Regional Transit Authority (MWRTA)",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "MetroWest RTA — fixed-route bus service connecting Framingham + Natick + Ashland + Holliston + Hopkinton + Marlborough + Sudbury + Wayland + Hudson + Milford; reduced-fare program; ADA Paratransit for MetroWest veterans with disabilities.",
    website_url: "https://www.mwrta.com/", phone: "508-935-2222",
    address: "15 Blandin Ave", city: "Framingham", zip: "01702",
    source_name: "MetroWest Regional Transit Authority" },

  { section: "G", title: "MetroWest Legal Services Framingham",
    cat: "legal", sub: "Legal Aid Services",
    desc: "MetroWest Legal Services — free civil legal aid for low-income residents and veterans on housing (eviction defense), public benefits, family law, elder law, and consumer protection across Framingham + Marlborough + Milford + Natick + Wayland + 41 MetroWest towns.",
    website_url: "https://www.mwlegal.org/", phone: "508-620-1830",
    address: "63 Fountain St, Suite 304", city: "Framingham", zip: "01702",
    source_name: "MetroWest Legal Services" },

  { section: "G", title: "Pearl Street Cupboard & Café Framingham",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "United Way of Tri-County Pearl Street Cupboard & Café — Framingham's primary food pantry + community café. Choice-model grocery distribution, mobile pantry, congregate meals, and SNAP outreach for low-income MetroWest veterans + families.",
    website_url: "https://uwotc.org/pearlstreet", phone: "508-879-3434",
    address: "46 Park St", city: "Framingham", zip: "01702",
    source_name: "United Way of Tri-County" },

  { section: "G", title: "Framingham State University Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "Framingham State University — School Certifying Officials, Yellow Ribbon participant, military-friendly designation, dedicated veterans lounge, and SVA chapter; serves MetroWest veterans pursuing 4-year degrees using GI Bill.",
    website_url: "https://www.framingham.edu/", phone: "508-626-4534",
    address: "100 State St", city: "Framingham", zip: "01701",
    source_name: "Framingham State University" },

  // ===========================================================================
  // H. EVERETT / MALDEN / MEDFORD / CHELSEA / REVERE (was 3 → +12)
  // ===========================================================================
  { section: "H", title: "Cambridge Health Alliance Everett Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "CHA Everett Hospital (formerly Whidden) — Cambridge Health Alliance's Everett campus. Emergency dept, primary + specialty care, surgery, behavioral health, and women's health for Everett + Malden + Chelsea + Revere veterans. Strong Boston VAMC + Bedford VAMC referral pipeline.",
    website_url: "https://www.challiance.org/locations/everett-hospital", phone: "617-389-6270",
    address: "103 Garland St", city: "Everett", zip: "02149",
    source_name: "Cambridge Health Alliance" },

  { section: "H", title: "CHA Malden Family Medicine",
    cat: "healthcare", sub: "Primary Care",
    desc: "Cambridge Health Alliance Malden Family Medicine + Care Center — primary care, women's health, behavioral health integration, and pediatrics for Malden + Medford + Everett residents and veterans not enrolled in VA care or seeking community-based primary care.",
    website_url: "https://www.challiance.org/locations/malden-care-center", phone: "781-338-8000",
    address: "195 Canal St", city: "Malden", zip: "02148",
    source_name: "Cambridge Health Alliance" },

  { section: "H", title: "MGH Revere HealthCare Center",
    cat: "healthcare", sub: "Primary Care",
    desc: "Mass General Brigham Revere HealthCare Center — primary care, behavioral health integration, pediatrics, women's health, and specialty clinics for Revere + Chelsea + Winthrop + East Boston residents and veterans not enrolled in VA care.",
    website_url: "https://www.massgeneral.org/revere", phone: "781-485-6000",
    address: "300 Ocean Ave", city: "Revere", zip: "02151",
    source_name: "Mass General Brigham" },

  { section: "H", title: "Eliot Community Human Services Everett",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Eliot Community Human Services Everett outpatient — counseling, psychiatric services, mobile crisis (BEST), substance-use treatment, supportive housing, and ID/DD day supports for Everett + Malden + Medford veterans + residents.",
    website_url: "https://www.eliotchs.org/", phone: "617-389-5400",
    address: "8 Norwood St", city: "Everett", zip: "02149",
    source_name: "Eliot Community Human Services" },

  { section: "H", title: "North Suffolk Community Services Chelsea",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "North Suffolk Community Services (formerly North Suffolk Mental Health Association) — Chelsea + Revere + Winthrop + East Boston outpatient mental-health, substance-use treatment, mobile crisis, recovery support, and supportive housing for low-income veterans + residents.",
    website_url: "https://www.northsuffolk.org/", phone: "617-912-7700",
    address: "14 Porter St", city: "Chelsea", zip: "02150",
    source_name: "North Suffolk Community Services" },

  { section: "H", title: "Roca Inc Chelsea",
    cat: "employment", sub: "Job Placement Programs",
    desc: "Roca — Chelsea-based intervention model serving high-risk young men + young mothers ages 17-24. Cognitive behavioral therapy, transitional employment, life skills, and job placement for at-risk Chelsea + Lynn + Boston young adults including veteran youth.",
    website_url: "https://rocainc.org/", phone: "617-889-5210",
    address: "101 Park St", city: "Chelsea", zip: "02150",
    source_name: "Roca Inc." },

  { section: "H", title: "La Colaborativa Chelsea",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "La Colaborativa (formerly Chelsea Collaborative) — Chelsea-based community organizing + service nonprofit. Food pantry, immigration legal services, workforce development, youth programs, and housing advocacy for Chelsea + Revere + Everett low-income families and veterans.",
    website_url: "https://www.la-colaborativa.org/", phone: "617-889-6080",
    address: "318 Broadway", city: "Chelsea", zip: "02150",
    source_name: "La Colaborativa" },

  { section: "H", title: "CAPIC Inc — Community Action Programs Inter-City",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "CAPIC — Chelsea + Revere + Winthrop Community Action Agency. LIHEAP fuel assistance, weatherization, Head Start, financial coaching, VITA tax prep, food pantries, and SNAP outreach for low-income Chelsea + Revere + Winthrop veteran families.",
    website_url: "https://www.capicinc.org/", phone: "617-884-6130",
    address: "100 Everett Ave, Unit 14", city: "Chelsea", zip: "02150",
    source_name: "Community Action Programs Inter-City" },

  { section: "H", title: "Bread of Life Malden",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Bread of Life — Malden's primary food pantry + community meal program serving Malden + Medford + Everett + Melrose + Stoneham + Wakefield. Weekly grocery distribution, evening community supper, mobile pantry, and SNAP outreach for low-income veteran families.",
    website_url: "https://www.breadoflifemalden.org/", phone: "781-397-0404",
    address: "54 Eastern Ave", city: "Malden", zip: "02148",
    source_name: "Bread of Life Inc." },

  { section: "H", title: "Tufts University Veterans Resources",
    cat: "education", sub: "College & University Programs",
    desc: "Tufts University Office of the Dean of Student Affairs — Yellow Ribbon participant, VA School Certifying Officials, military-friendly designation, dedicated student-veteran community, and SVA chapter; serves veterans pursuing undergraduate + graduate degrees using GI Bill.",
    website_url: "https://students.tufts.edu/student-life/military-affiliated-students", phone: "617-627-3158",
    address: "419 Boston Ave", city: "Medford", zip: "02155",
    source_name: "Tufts University" },

  { section: "H", title: "Bunker Hill Community College Chelsea Campus Veterans",
    cat: "education", sub: "College & University Programs",
    desc: "Bunker Hill CC Chelsea Campus Veterans Center — Yellow Ribbon, VA School Certifying Officials, military-friendly designation, dedicated vet lounge; affordable transfer pathways for Chelsea + Revere + Everett veterans using GI Bill.",
    website_url: "https://www.bhcc.edu/veterans/", phone: "617-228-2102",
    address: "70 Everett Ave", city: "Chelsea", zip: "02150",
    source_name: "Bunker Hill Community College" },

  { section: "H", title: "HarborCOV Chelsea",
    cat: "family-support", sub: "Family Counseling",
    desc: "HarborCOV (Communities Overcoming Violence) — Chelsea-based domestic-violence + sexual-assault crisis center serving Chelsea + Revere + Everett + Winthrop + East Boston. 24/7 multilingual hotline, emergency shelter, court advocacy, and economic empowerment for veteran families.",
    website_url: "https://harborcov.org/", phone: "617-884-9799",
    address: "PO Box 505754", city: "Chelsea", zip: "02150",
    source_name: "HarborCOV" },
];

await runSeed(ROWS, {
  state: "MA",
  commit: COMMIT,
  scriptName: "seed-ma-wave4.ts (Golden Standard Wave 4 / mid-tier city expansion + regional gap-fill)",
  urlCheckTimeoutMs: 12000,
  allowBrokenUrls: ALLOW_BROKEN_URLS,
  allowZipBleed: ALLOW_ZIP_BLEED,
  sectionLabels: {
    A: "Pittsfield + Berkshires depth",
    B: "North Adams + Northern Berkshires (gap-fill)",
    C: "Greenfield + Franklin County (gap-fill)",
    D: "Fitchburg / Leominster / Gardner (gap-fill)",
    E: "Attleboro + Mansfield + Foxboro (gap-fill)",
    F: "Marlborough / Hudson / Westborough (gap-fill)",
    G: "Waltham / Watertown / Framingham depth",
    H: "Everett / Malden / Medford / Chelsea / Revere",
  },
});
