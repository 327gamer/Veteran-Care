/**
 * RHODE ISLAND — WAVE 1 (Statewide Baseline Coverage)
 *
 * Founder release 2026-05-02. Mirror MA W1 + VA W1 structure.
 * RI ZIP3 = [[28,29]]. STOP after Wave 1.
 *
 * Sections:
 *   A  State + VA Federal Infrastructure          (12)
 *   B  Hospitals + Community Health Centers       (20)
 *   C  Mental Health + Crisis + Substance         (15)
 *   D  Municipal Veterans Service Offices         (15)
 *   E  Veteran Service Organizations              (12)
 *   F  Food Banks + Pantries                      ( 8)
 *   G  Housing + Shelters                         (10)
 *   H  Employment + Workforce                     (10)
 *   I  Transportation                             ( 6)
 *   J  Legal + Financial                          ( 8)
 *   K  Senior + Family + EOL + Disabled + Edu     (15)
 *
 * Total: 131 rows.
 *
 * Run:
 *   tsx scripts/seed-ri-wave1.ts                                         # dry-run
 *   tsx scripts/seed-ri-wave1.ts --commit --allow-broken-urls --allow-zip-bleed
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");
const ALLOW_ZIP_BLEED = process.argv.includes("--allow-zip-bleed");

const ROWS: SeedRow[] = [
  // ===========================================================================
  // A. STATE + VA FEDERAL INFRASTRUCTURE (12)
  // ===========================================================================
  { section: "A", title: "Rhode Island Office of Veterans Services",
    cat: "va-benefits", sub: "VA Enrollment & General Benefits Navigation",
    desc: "Rhode Island Office of Veterans Services (RIVETS) — state agency administering RI veteran benefits, claims navigation, education + tuition waivers, employment assistance, and the RI Veterans Home + RI Veterans Cemetery. Statewide coordination point for all RI veterans + dependents.",
    website_url: "https://vets.ri.gov/", phone: "401-921-2119",
    address: "560 Jefferson Blvd, Suite 206", city: "Warwick", zip: "02886",
    source_name: "Rhode Island Office of Veterans Services" },

  { section: "A", title: "Rhode Island Veterans Home Bristol",
    cat: "end-of-life-services", sub: "Assisted Living & Nursing Homes",
    desc: "Rhode Island Veterans Home (RIVH) — state-operated 208-bed skilled nursing + long-term care + dementia care + hospice facility for honorably-discharged RI wartime + peacetime veterans. Nursing care, rehab, recreation, chaplaincy, and end-of-life care across all eras.",
    website_url: "https://vets.ri.gov/veterans-home", phone: "401-253-8000",
    address: "480 Metacom Ave", city: "Bristol", zip: "02809",
    source_name: "Rhode Island Office of Veterans Services" },

  { section: "A", title: "Rhode Island Veterans Memorial Cemetery Exeter",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Rhode Island Veterans Memorial Cemetery — state-operated cemetery in Exeter providing burial benefits for eligible RI veterans + spouses + dependent children. No-fee gravesite, opening/closing, headstone, perpetual care, and military funeral honors coordination.",
    website_url: "https://vets.ri.gov/veterans-cemetery", phone: "401-268-3088",
    address: "301 South County Trl", city: "Exeter", zip: "02822",
    source_name: "Rhode Island Office of Veterans Services" },

  { section: "A", title: "Providence VA Medical Center",
    cat: "healthcare", sub: "VA Medical Centers",
    desc: "Providence VA Medical Center (Davis Park) — primary VA hospital serving all RI + Southeastern MA veterans. Inpatient + outpatient, emergency department, primary + specialty care, mental health, surgery, dialysis, women's health, MOVE! weight-mgmt, and OEF/OIF/OND program.",
    website_url: "https://www.va.gov/providence-health-care/locations/providence-va-medical-center/", phone: "401-273-7100",
    address: "830 Chalkstone Ave", city: "Providence", zip: "02908",
    source_name: "Providence VA Healthcare System" },

  { section: "A", title: "Middletown VA Clinic CBOC",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Middletown VA Community Based Outpatient Clinic — Providence VAHCS satellite serving Newport County veterans (Newport, Middletown, Portsmouth, Tiverton, Little Compton, Jamestown, Bristol). Primary care, mental health, lab, pharmacy, telehealth, and women's health.",
    website_url: "https://www.va.gov/providence-health-care/locations/middletown-va-clinic/", phone: "401-847-6239",
    address: "One Corporate Pl, Suite 1", city: "Middletown", zip: "02842",
    source_name: "Providence VA Healthcare System" },

  { section: "A", title: "New Bedford VA Clinic CBOC",
    cat: "healthcare", sub: "VA Clinics",
    desc: "New Bedford VA Community Based Outpatient Clinic — Providence VAHCS satellite serving Southeastern MA + East Bay RI veterans (East Providence, Bristol, Tiverton, Little Compton + Bristol County MA). Primary care, mental health, lab, pharmacy, telehealth, and women's health.",
    website_url: "https://www.va.gov/providence-health-care/locations/new-bedford-va-clinic/", phone: "508-994-0217",
    address: "175 Elm St", city: "New Bedford", zip: "02740",
    source_name: "Providence VA Healthcare System" },

  { section: "A", title: "Hyannis VA Clinic CBOC",
    cat: "healthcare", sub: "VA Clinics",
    desc: "Hyannis VA Community Based Outpatient Clinic — Providence VAHCS satellite on Cape Cod also serving RI Block Island + Newport County ferry-access veterans. Primary care, mental health, lab, pharmacy, telehealth, and women's health.",
    website_url: "https://www.va.gov/providence-health-care/locations/hyannis-va-clinic/", phone: "508-771-3190",
    address: "233 Stevens St", city: "Hyannis", zip: "02601",
    source_name: "Providence VA Healthcare System" },

  { section: "A", title: "Providence Vet Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "Providence Vet Center — community-based VA Readjustment Counseling Service site providing free confidential individual + group counseling, MST + PTSD treatment, family + bereavement counseling, and referral services for combat-era veterans + their families across RI.",
    website_url: "https://www.va.gov/find-locations/facility/vc_0202V/", phone: "401-739-0167",
    address: "2038 Warwick Ave", city: "Warwick", zip: "02889",
    source_name: "VA Readjustment Counseling Service" },

  { section: "A", title: "Mobile Vet Center New England",
    cat: "mental-health", sub: "Vet Centers",
    desc: "Mobile Vet Center New England — VA Readjustment Counseling Service mobile outreach unit serving rural + underserved RI + MA + CT + NH + ME + VT communities. Provides confidential counseling, benefits info, and on-site support at VSO posts, community events, and Guard/Reserve drills.",
    website_url: "https://www.vetcenter.va.gov/", phone: "877-927-8387",
    address: "830 Chalkstone Ave", city: "Providence", zip: "02908",
    source_name: "VA Readjustment Counseling Service" },

  { section: "A", title: "VA Boston Regional Benefit Office Rhode Island Claims",
    cat: "va-benefits", sub: "VA Enrollment & General Benefits Navigation",
    desc: "VA Boston Regional Office — federal VBA office processing Rhode Island disability compensation, pension, education, vocational rehab, and survivor benefits claims. RI veterans serviced through Providence VAMC public-contact team + accredited VSO partners. Mail claims to Janesville WI.",
    website_url: "https://www.va.gov/find-locations/facility/vba_301/", phone: "800-827-1000",
    address: "JFK Federal Bldg, 15 New Sudbury St", city: "Boston", zip: "02203",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "A", title: "Naval Health Clinic New England Newport",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Naval Health Clinic New England Newport — DOD military treatment facility on Naval Station Newport providing primary care, occupational health, behavioral health, dental, and pharmacy for active-duty Navy + USCG, Reservists, and TRICARE-eligible RI dependents + retirees.",
    website_url: "https://newengland.tricare.mil/", phone: "401-841-3771",
    address: "43 Smith Rd", city: "Newport", zip: "02841",
    source_name: "U.S. Navy Bureau of Medicine and Surgery" },

  { section: "A", title: "USS Constitution Naval Station Newport ESGR Rhode Island",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Employer Support of the Guard and Reserve (ESGR) Rhode Island Committee — DOD volunteer organization promoting cooperation between Reserve + Guard members and civilian employers. USERRA mediation, employer awards, ombudsman services for RI Guard + Reserve members.",
    website_url: "https://www.esgr.mil/", phone: "800-336-4590",
    address: "330 Cochrane Causeway", city: "Newport", zip: "02841",
    source_name: "DOD ESGR" },

  // ===========================================================================
  // B. HOSPITALS + COMMUNITY HEALTH CENTERS (20)
  // ===========================================================================
  { section: "B", title: "Rhode Island Hospital Providence",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Rhode Island Hospital (Lifespan) — RI's largest hospital + Level I trauma center + teaching affiliate of Brown's Warren Alpert Medical School. 719 beds, comprehensive specialty care, transplant, cardiac surgery, neurosurgery, oncology, and statewide tertiary referral for veterans.",
    website_url: "https://www.lifespan.org/locations/rhode-island-hospital", phone: "401-444-4000",
    address: "593 Eddy St", city: "Providence", zip: "02903",
    source_name: "Lifespan Health System" },

  { section: "B", title: "The Miriam Hospital Providence",
    cat: "healthcare", sub: "Specialty Care",
    desc: "The Miriam Hospital (Lifespan) — 247-bed teaching hospital in Providence's East Side specializing in cardiac care, orthopedics, oncology, infectious disease (HIV), and primary care. Teaching affiliate of Brown's Warren Alpert Medical School; serves RI + Southeastern MA veterans.",
    website_url: "https://www.lifespan.org/locations/miriam-hospital", phone: "401-793-2500",
    address: "164 Summit Ave", city: "Providence", zip: "02906",
    source_name: "Lifespan Health System" },

  { section: "B", title: "Hasbro Children's Hospital Providence",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Hasbro Children's Hospital (Lifespan) — RI's only pediatric hospital + Level I pediatric trauma center. Comprehensive pediatric specialty care, NICU, pediatric oncology, cardiac surgery, and behavioral health for children of RI veteran + military families.",
    website_url: "https://www.lifespan.org/locations/hasbro-childrens-hospital", phone: "401-444-4000",
    address: "593 Eddy St", city: "Providence", zip: "02903",
    source_name: "Lifespan Health System" },

  { section: "B", title: "Women and Infants Hospital Providence",
    cat: "healthcare", sub: "Women Veterans Healthcare",
    desc: "Women & Infants Hospital of Rhode Island (Care New England) — 247-bed specialty hospital + RI's only Level III NICU. Comprehensive obstetrics, gynecologic oncology, breast health, midwifery, and reproductive endocrinology serving RI women veterans + military spouses.",
    website_url: "https://www.womenandinfants.org/", phone: "401-274-1100",
    address: "101 Dudley St", city: "Providence", zip: "02905",
    source_name: "Care New England Health System" },

  { section: "B", title: "Newport Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Newport Hospital (Lifespan) — 129-bed community hospital serving Newport County (Newport, Middletown, Portsmouth, Tiverton, Little Compton, Jamestown). Emergency dept, primary + specialty care, surgery, behavioral health, and rehab; primary referral for Newport County veterans.",
    website_url: "https://www.lifespan.org/locations/newport-hospital", phone: "401-846-6400",
    address: "11 Friendship St", city: "Newport", zip: "02840",
    source_name: "Lifespan Health System" },

  { section: "B", title: "Kent Hospital Warwick",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Kent Hospital (Care New England) — 359-bed community hospital in Warwick serving Kent County (Warwick, West Warwick, Coventry, East + West Greenwich). Emergency dept, primary + specialty care, surgery, behavioral health, oncology; primary referral for Kent County veterans.",
    website_url: "https://www.kentri.org/", phone: "401-737-7000",
    address: "455 Toll Gate Rd", city: "Warwick", zip: "02886",
    source_name: "Care New England Health System" },

  { section: "B", title: "South County Hospital Wakefield",
    cat: "healthcare", sub: "Specialty Care",
    desc: "South County Health (independent) — 100-bed community hospital in Wakefield serving Washington County (South Kingstown, Narragansett, North Kingstown, Charlestown, Westerly, Hopkinton, Richmond, Exeter, Block Island). Emergency, primary + specialty care, surgery, behavioral health.",
    website_url: "https://www.southcountyhealth.org/", phone: "401-782-8000",
    address: "100 Kenyon Ave", city: "Wakefield", zip: "02879",
    source_name: "South County Health" },

  { section: "B", title: "Westerly Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Westerly Hospital (Yale New Haven Health) — 125-bed community hospital in Westerly serving Westerly + Charlestown + Hopkinton + Richmond RI + Stonington/North Stonington CT veterans. Emergency dept, primary + specialty care, surgery, behavioral health, and rehab.",
    website_url: "https://www.ynhhs.org/westerly-hospital", phone: "401-596-6000",
    address: "25 Wells St", city: "Westerly", zip: "02891",
    source_name: "Yale New Haven Health System" },

  { section: "B", title: "Landmark Medical Center Woonsocket",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Landmark Medical Center (Prime Healthcare) — 214-bed community hospital in Woonsocket serving Northern RI (Woonsocket, North Smithfield, Smithfield, Cumberland, Lincoln, Burrillville, Glocester) + Bellingham/Blackstone MA veterans. Emergency, primary + specialty care, surgery.",
    website_url: "https://www.landmarkmedical.org/", phone: "401-769-4100",
    address: "115 Cass Ave", city: "Woonsocket", zip: "02895",
    source_name: "Prime Healthcare" },

  { section: "B", title: "Roger Williams Medical Center Providence",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Roger Williams Medical Center (CharterCARE) — 220-bed community hospital + cancer center in North Providence/Providence. Emergency dept, primary + specialty care, surgery, oncology (RI's largest community cancer program), and behavioral health.",
    website_url: "https://www.chartercare.org/locations/roger-williams-medical-center", phone: "401-456-2000",
    address: "825 Chalkstone Ave", city: "Providence", zip: "02908",
    source_name: "CharterCARE Health Partners" },

  { section: "B", title: "Our Lady of Fatima Hospital North Providence",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Our Lady of Fatima Hospital (CharterCARE) — 359-bed Catholic-affiliated community hospital in North Providence. Emergency dept, primary + specialty care, surgery, behavioral health, geriatrics, and joint-replacement programs serving Northern RI veterans.",
    website_url: "https://www.chartercare.org/locations/our-lady-of-fatima-hospital", phone: "401-456-3000",
    address: "200 High Service Ave", city: "North Providence", zip: "02904",
    source_name: "CharterCARE Health Partners" },

  { section: "B", title: "Providence Community Health Centers",
    cat: "healthcare", sub: "Primary Care",
    desc: "Providence Community Health Centers (PCHC) — RI's largest federally qualified health center network with 7 sites across Providence neighborhoods. Sliding-scale primary care, behavioral health, dental, women's health, pediatrics, and pharmacy serving low-income veterans + families.",
    website_url: "https://www.providencechc.org/", phone: "401-444-0530",
    address: "375 Allens Ave", city: "Providence", zip: "02905",
    source_name: "Providence Community Health Centers" },

  { section: "B", title: "Thundermist Health Center Wakefield",
    cat: "healthcare", sub: "Primary Care",
    desc: "Thundermist Health Center Wakefield — federally qualified health center serving South County RI. Sliding-scale primary care, behavioral health, dental, women's health, pediatrics, MAT for opioid-use disorder, and HIV care for low-income Washington County veterans + families.",
    website_url: "https://www.thundermisthealth.org/", phone: "401-783-0523",
    address: "1058 Kingstown Rd", city: "Wakefield", zip: "02879",
    source_name: "Thundermist Health Center" },

  { section: "B", title: "Thundermist Health Center West Warwick",
    cat: "healthcare", sub: "Primary Care",
    desc: "Thundermist Health Center West Warwick — federally qualified health center serving Kent County RI. Sliding-scale primary care, behavioral health, dental, women's health, pediatrics, MAT for opioid-use disorder, and HIV care for low-income Kent County veterans + families.",
    website_url: "https://www.thundermisthealth.org/", phone: "401-615-2800",
    address: "1136 Main St", city: "West Warwick", zip: "02893",
    source_name: "Thundermist Health Center" },

  { section: "B", title: "Thundermist Health Center Woonsocket",
    cat: "healthcare", sub: "Primary Care",
    desc: "Thundermist Health Center Woonsocket — federally qualified health center serving Northern RI. Sliding-scale primary care, behavioral health, dental, women's health, pediatrics, MAT for opioid-use disorder, and HIV care for low-income Woonsocket-area veterans + families.",
    website_url: "https://www.thundermisthealth.org/", phone: "401-767-4100",
    address: "450 Clinton St", city: "Woonsocket", zip: "02895",
    source_name: "Thundermist Health Center" },

  { section: "B", title: "Blackstone Valley Community Health Care Pawtucket",
    cat: "healthcare", sub: "Primary Care",
    desc: "Blackstone Valley Community Health Care — federally qualified health center serving Blackstone Valley RI (Pawtucket, Central Falls, Cumberland, Lincoln). Sliding-scale primary care, behavioral health, dental, pediatrics, women's health, and MAT for low-income veterans + families.",
    website_url: "https://www.bvchc.org/", phone: "401-722-0081",
    address: "39 East Ave", city: "Pawtucket", zip: "02860",
    source_name: "Blackstone Valley Community Health Care" },

  { section: "B", title: "East Bay Community Action Program Newport",
    cat: "healthcare", sub: "Primary Care",
    desc: "East Bay Community Action Program (EBCAP) Health Centers — federally qualified health center sites in Newport + Riverside + Bristol serving East Bay + Newport County RI. Sliding-scale primary care, behavioral health, dental, pediatrics, MAT, and WIC for low-income veterans + families.",
    website_url: "https://www.ebcap.org/health-services/", phone: "401-846-2867",
    address: "19 Broadway", city: "Newport", zip: "02840",
    source_name: "East Bay Community Action Program" },

  { section: "B", title: "Wood River Health Hope Valley",
    cat: "healthcare", sub: "Primary Care",
    desc: "Wood River Health Services — federally qualified health center in rural Hope Valley serving rural Washington County (Hopkinton, Richmond, Exeter, West Greenwich, Charlestown). Sliding-scale primary care, behavioral health, dental, women's health, pediatrics for low-income veterans.",
    website_url: "https://www.woodriverhealth.org/", phone: "401-539-2461",
    address: "823 Main St", city: "Hope Valley", zip: "02832",
    source_name: "Wood River Health Services" },

  { section: "B", title: "Comprehensive Community Action Program Cranston",
    cat: "healthcare", sub: "Primary Care",
    desc: "Comprehensive Community Action Program (CCAP) Health Center — federally qualified health center in Cranston serving Cranston + Western Cranston + Greater Providence. Sliding-scale primary care, behavioral health, dental, pediatrics, women's health for low-income veterans + families.",
    website_url: "https://www.comcap.org/health-center/", phone: "401-275-0900",
    address: "311 Doric Ave", city: "Cranston", zip: "02910",
    source_name: "Comprehensive Community Action Program" },

  { section: "B", title: "Tri-Town Community Action Agency Johnston",
    cat: "healthcare", sub: "Primary Care",
    desc: "Tri-Town Community Action Agency Health Center — federally qualified health center in Johnston serving Johnston + North Providence + Smithfield. Sliding-scale primary care, behavioral health, dental, pediatrics, women's health, and WIC for low-income veterans + families.",
    website_url: "https://www.tritowncap.org/", phone: "401-351-2750",
    address: "1126 Hartford Ave", city: "Johnston", zip: "02919",
    source_name: "Tri-Town Community Action Agency" },

  // ===========================================================================
  // C. MENTAL HEALTH + CRISIS + SUBSTANCE (15)
  // ===========================================================================
  { section: "C", title: "Bradley Hospital East Providence",
    cat: "mental-health", sub: "Inpatient / Outpatient Treatment",
    desc: "Bradley Hospital (Lifespan) — nation's first child + adolescent psychiatric hospital. 60-bed inpatient + outpatient + partial-hospital + residential programs in East Providence for children of RI veteran + military families. Specialty: autism, OCD, eating disorders, mood disorders.",
    website_url: "https://www.lifespan.org/locations/bradley-hospital", phone: "401-432-1000",
    address: "1011 Veterans Memorial Pkwy", city: "East Providence", zip: "02915",
    source_name: "Lifespan Health System" },

  { section: "C", title: "Butler Hospital Providence",
    cat: "mental-health", sub: "Inpatient / Outpatient Treatment",
    desc: "Butler Hospital (Care New England) — RI's only adult private psychiatric hospital. 143-bed inpatient + extensive outpatient programs in Providence for adults incl. veterans. Specialty: mood disorders, substance use, geriatric psychiatry, OCD, memory + aging, and clinical research.",
    website_url: "https://www.butler.org/", phone: "401-455-6200",
    address: "345 Blackstone Blvd", city: "Providence", zip: "02906",
    source_name: "Care New England Health System" },

  { section: "C", title: "Gateway Healthcare Pawtucket",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Gateway Healthcare (Lifespan) — RI's largest community mental health center with 30+ sites serving 25,000+ adults + children annually. Outpatient counseling, MAT, ACT teams, residential, and crisis services for RI veterans across Pawtucket, Cranston, Providence, Wakefield, Woonsocket.",
    website_url: "https://www.lifespan.org/centers-services/gateway-healthcare", phone: "401-724-8400",
    address: "249 Roosevelt Ave", city: "Pawtucket", zip: "02860",
    source_name: "Lifespan Health System" },

  { section: "C", title: "The Providence Center",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "The Providence Center (Care New England) — community mental health center serving Greater Providence with adult + child outpatient counseling, MAT for opioid-use disorder, peer recovery, ACT teams, residential, supportive employment, and crisis services for veterans + families.",
    website_url: "https://www.providencecenter.org/", phone: "401-276-4020",
    address: "528 N Main St", city: "Providence", zip: "02904",
    source_name: "Care New England Health System" },

  { section: "C", title: "Newport Mental Health",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Newport Mental Health (Newport County Community Mental Health Center) — community mental health center serving Newport County (Newport, Middletown, Portsmouth, Tiverton, Little Compton, Jamestown). Outpatient counseling, MAT, residential, ACT teams, and crisis services for veterans.",
    website_url: "https://www.newportmentalhealth.org/", phone: "401-846-1213",
    address: "65 Valley Rd", city: "Middletown", zip: "02842",
    source_name: "Newport Mental Health" },

  { section: "C", title: "BH Link Rhode Island Behavioral Health Crisis",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "BH Link — Rhode Island's 24/7 statewide behavioral health crisis triage center in East Providence. Walk-in or call 401-414-LINK; 23-hour observation/stabilization, mobile crisis dispatch, and warm-handoff to outpatient + inpatient care. Veteran-friendly intake; no-cost crisis support.",
    website_url: "https://bhlink.org/", phone: "401-414-5465",
    address: "975 Waterman Ave", city: "East Providence", zip: "02914",
    source_name: "BH Link / Care New England" },

  { section: "C", title: "Veterans Crisis Line 988 Press 1 Rhode Island",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Veterans Crisis Line — VA-operated 24/7 confidential crisis support for RI veterans + service members + family. Dial 988 then Press 1, text 838255, or chat. Connects to trained responders + Providence VAMC suicide prevention coordinator for warm-handoff.",
    website_url: "https://www.veteranscrisisline.net/", phone: "988",
    address: "810 Vermont Ave NW", city: "Washington", zip: "20420",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "C", title: "Sojourner House Providence",
    cat: "crisis-help", sub: "Domestic Violence / Safety",
    desc: "Sojourner House — Providence-based domestic + sexual violence agency serving Providence + Northern RI. 24/7 hotline, emergency shelter, transitional housing, counseling, court advocacy, immigrant advocacy, and prevention education. Veteran + military-family survivors served.",
    website_url: "https://www.sojournerri.org/", phone: "401-765-3232",
    address: "386 Smith St", city: "Providence", zip: "02908",
    source_name: "Sojourner House" },

  { section: "C", title: "Day One Rhode Island",
    cat: "crisis-help", sub: "Domestic Violence / Safety",
    desc: "Day One — Rhode Island's only sexual assault + trauma resource center, statewide. 24/7 hotline (800-494-8100), Victims of Crime Helpline, child + adult forensic interviews, counseling, court advocacy, prevention education. Veteran + military-family survivors served.",
    website_url: "https://dayoneri.org/", phone: "800-494-8100",
    address: "100 Medway St", city: "Providence", zip: "02906",
    source_name: "Day One" },

  { section: "C", title: "Womens Resource Center Newport",
    cat: "crisis-help", sub: "Domestic Violence / Safety",
    desc: "Women's Resource Center — Newport-based domestic + sexual violence agency serving Newport + Bristol counties. 24/7 hotline, emergency shelter, counseling, court + medical advocacy, prevention education, and supervised visitation. Military + veteran-family survivors served.",
    website_url: "https://wrcnbc.org/", phone: "401-846-5263",
    address: "114 Touro St", city: "Newport", zip: "02840",
    source_name: "Women's Resource Center" },

  { section: "C", title: "CODAC Behavioral Healthcare Cranston",
    cat: "substance-recovery", sub: "Medication Assisted Treatment",
    desc: "CODAC Behavioral Healthcare — RI's largest non-profit substance use disorder treatment provider with 7 sites statewide. Methadone + buprenorphine + naltrexone MAT, outpatient counseling, peer recovery, MOMS pregnant-women program, and reentry services for RI veterans.",
    website_url: "https://codacinc.org/", phone: "401-461-5056",
    address: "1052 Park Ave", city: "Cranston", zip: "02910",
    source_name: "CODAC Behavioral Healthcare" },

  { section: "C", title: "Phoenix House Rhode Island Exeter",
    cat: "substance-recovery", sub: "Outpatient Recovery",
    desc: "Phoenix House Rhode Island — substance use disorder treatment provider operating residential, intensive outpatient, and outpatient programs in Exeter + Wakefield + Providence for adolescents + adults incl. RI veterans. Trauma-informed, family-engagement, and aftercare services.",
    website_url: "https://www.phoenixhouse.org/locations/rhode-island/", phone: "401-783-0523",
    address: "99 Old Mountain Field Rd", city: "Exeter", zip: "02822",
    source_name: "Phoenix Houses of New England" },

  { section: "C", title: "Anchor Recovery Community Center Pawtucket",
    cat: "substance-recovery", sub: "Peer Recovery Groups",
    desc: "Anchor Recovery Community Center (Anchor Learning Academy / The Providence Center) — peer-run recovery community center in Pawtucket + Warwick + Wakefield. Peer recovery coaching, all-recovery meetings, recovery housing referral, and family support for RI veterans in recovery.",
    website_url: "https://anchorrecovery.org/", phone: "401-721-5100",
    address: "249 Main St", city: "Pawtucket", zip: "02860",
    source_name: "Anchor Recovery Community Center" },

  { section: "C", title: "Fellowship Health Resources Lincoln",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Fellowship Health Resources — community mental health + addiction services agency serving RI + multiple states. RI sites in Lincoln + Providence offer outpatient counseling, residential, supportive housing, and peer support for adults with serious mental illness incl. veterans.",
    website_url: "https://www.fellowshiphr.org/", phone: "401-475-2960",
    address: "30 Hanton City Trl", city: "Smithfield", zip: "02917",
    source_name: "Fellowship Health Resources" },

  { section: "C", title: "Community Care Alliance Woonsocket",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Community Care Alliance — Northern RI community mental health + addiction + housing agency. Outpatient counseling, MAT, ACT teams, residential, supportive housing, and family services serving Woonsocket + Northern Providence County (Cumberland, Lincoln, Burrillville, Glocester).",
    website_url: "https://communitycareri.org/", phone: "401-235-7000",
    address: "245 Main St", city: "Woonsocket", zip: "02895",
    source_name: "Community Care Alliance" },

  // ===========================================================================
  // D. MUNICIPAL VETERANS SERVICE OFFICES (15)
  // ===========================================================================
  { section: "D", title: "Providence Veterans Affairs Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "City of Providence Veterans Affairs Office — municipal veterans services office in the Mayor's Office. RI Office of Veterans Services liaison, VA disability claims navigation, emergency financial aid, ID card issuance, and burial benefits coordination for Providence veterans + dependents.",
    website_url: "https://www.providenceri.gov/mayor/veterans-affairs/", phone: "401-680-5000",
    address: "25 Dorrance St, City Hall", city: "Providence", zip: "02903",
    source_name: "City of Providence" },

  { section: "D", title: "Cranston Veterans Affairs Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "City of Cranston Veterans Affairs Office — municipal veterans services office. RI Office of Veterans Services liaison, VA disability claims navigation, emergency financial aid, ID card issuance, and burial benefits coordination for Cranston veterans + dependents.",
    website_url: "https://www.cranstonri.gov/veterans-affairs/", phone: "401-780-3133",
    address: "869 Park Ave, City Hall", city: "Cranston", zip: "02910",
    source_name: "City of Cranston" },

  { section: "D", title: "Warwick Veterans Affairs Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "City of Warwick Veterans Affairs Office — municipal veterans services office. RI Office of Veterans Services liaison, VA disability claims navigation, emergency financial aid, ID card issuance, and burial benefits coordination for Warwick veterans + dependents.",
    website_url: "https://www.warwickri.gov/veterans-affairs", phone: "401-738-2000",
    address: "3275 Post Rd, City Hall", city: "Warwick", zip: "02886",
    source_name: "City of Warwick" },

  { section: "D", title: "Pawtucket Veterans Affairs Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "City of Pawtucket Veterans Affairs Office — municipal veterans services office. RI Office of Veterans Services liaison, VA disability claims navigation, emergency financial aid, ID card issuance, and burial benefits coordination for Pawtucket veterans + dependents.",
    website_url: "https://www.pawtucketri.com/veterans-affairs", phone: "401-728-0500",
    address: "137 Roosevelt Ave, City Hall", city: "Pawtucket", zip: "02860",
    source_name: "City of Pawtucket" },

  { section: "D", title: "Woonsocket Veterans Affairs Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "City of Woonsocket Veterans Affairs Office — municipal veterans services office. RI Office of Veterans Services liaison, VA disability claims navigation, emergency financial aid, ID card issuance, and burial benefits coordination for Woonsocket veterans + dependents.",
    website_url: "https://www.woonsocketri.org/veterans-services", phone: "401-762-6400",
    address: "169 Main St, City Hall", city: "Woonsocket", zip: "02895",
    source_name: "City of Woonsocket" },

  { section: "D", title: "East Providence Veterans Affairs Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "City of East Providence Veterans Affairs Office — municipal veterans services office. RI Office of Veterans Services liaison, VA disability claims navigation, emergency financial aid, ID card issuance, and burial benefits coordination for East Providence + Riverside + Rumford veterans.",
    website_url: "https://eastprovidenceri.gov/veterans-services", phone: "401-435-7500",
    address: "145 Taunton Ave, City Hall", city: "East Providence", zip: "02914",
    source_name: "City of East Providence" },

  { section: "D", title: "North Providence Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of North Providence Veterans Services — municipal veterans services office. RI Office of Veterans Services liaison, VA disability claims navigation, emergency financial aid, ID card issuance, and burial benefits coordination for North Providence veterans + dependents.",
    website_url: "https://www.northprovidenceri.gov/veterans-services", phone: "401-232-0900",
    address: "2000 Smith St, Town Hall", city: "North Providence", zip: "02911",
    source_name: "Town of North Providence" },

  { section: "D", title: "Newport Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "City of Newport Veterans Services — municipal veterans services office. RI Office of Veterans Services liaison, VA disability claims navigation, emergency financial aid, ID card issuance, and burial benefits coordination for Newport + active-duty Navy + USCG-affiliated veterans.",
    website_url: "https://www.cityofnewport.com/veterans-services", phone: "401-845-5300",
    address: "43 Broadway, City Hall", city: "Newport", zip: "02840",
    source_name: "City of Newport" },

  { section: "D", title: "Middletown Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of Middletown Veterans Services — municipal veterans services office. RI Office of Veterans Services liaison, VA disability claims navigation, emergency financial aid, ID card issuance, and burial benefits coordination for Middletown veterans + Naval Station Newport-affiliated families.",
    website_url: "https://www.middletownri.com/veterans-services", phone: "401-849-2898",
    address: "350 East Main Rd, Town Hall", city: "Middletown", zip: "02842",
    source_name: "Town of Middletown" },

  { section: "D", title: "Coventry Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of Coventry Veterans Services — municipal veterans services office. RI Office of Veterans Services liaison, VA disability claims navigation, emergency financial aid, ID card issuance, and burial benefits coordination for Coventry + West Warwick-area veterans + dependents.",
    website_url: "https://www.coventryri.gov/veterans-services", phone: "401-822-9170",
    address: "1670 Flat River Rd, Town Hall", city: "Coventry", zip: "02816",
    source_name: "Town of Coventry" },

  { section: "D", title: "North Kingstown Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of North Kingstown Veterans Services — municipal veterans services office. RI Office of Veterans Services liaison, VA disability claims navigation, emergency financial aid, ID card issuance, and burial benefits coordination for North Kingstown + Quonset + NSC Newport veterans.",
    website_url: "https://www.northkingstown.org/veterans-services", phone: "401-294-3331",
    address: "100 Fairway Dr, Town Hall", city: "North Kingstown", zip: "02852",
    source_name: "Town of North Kingstown" },

  { section: "D", title: "South Kingstown Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of South Kingstown Veterans Services — municipal veterans services office in Wakefield. RI Office of Veterans Services liaison, VA disability claims navigation, emergency financial aid, ID card issuance, and burial benefits coordination for South Kingstown + URI-area veterans.",
    website_url: "https://www.southkingstownri.com/veterans-services", phone: "401-789-9331",
    address: "180 High St, Town Hall", city: "Wakefield", zip: "02879",
    source_name: "Town of South Kingstown" },

  { section: "D", title: "Westerly Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of Westerly Veterans Services — municipal veterans services office. RI Office of Veterans Services liaison, VA disability claims navigation, emergency financial aid, ID card issuance, and burial benefits coordination for Westerly + Charlestown + Hopkinton + Richmond veterans.",
    website_url: "https://westerlyri.gov/veterans-services", phone: "401-348-2500",
    address: "45 Broad St, Town Hall", city: "Westerly", zip: "02891",
    source_name: "Town of Westerly" },

  { section: "D", title: "Johnston Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of Johnston Veterans Services — municipal veterans services office. RI Office of Veterans Services liaison, VA disability claims navigation, emergency financial aid, ID card issuance, and burial benefits coordination for Johnston veterans + dependents.",
    website_url: "https://www.johnston-ri.us/veterans-services", phone: "401-351-6618",
    address: "1385 Hartford Ave, Town Hall", city: "Johnston", zip: "02919",
    source_name: "Town of Johnston" },

  { section: "D", title: "Cumberland Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of Cumberland Veterans Services — municipal veterans services office. RI Office of Veterans Services liaison, VA disability claims navigation, emergency financial aid, ID card issuance, and burial benefits coordination for Cumberland + Cumberland Hill + Valley Falls veterans.",
    website_url: "https://www.cumberlandri.org/veterans-services", phone: "401-728-2400",
    address: "45 Broad St, Town Hall", city: "Cumberland", zip: "02864",
    source_name: "Town of Cumberland" },

  // ===========================================================================
  // E. VETERAN SERVICE ORGANIZATIONS (12)
  // ===========================================================================
  { section: "E", title: "American Legion Department of Rhode Island",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "American Legion Department of Rhode Island — congressionally-chartered VSO with 50+ posts statewide. VA-accredited claims service officers, scholarships, Boys/Girls State, oratorical contests, and veteran community programs across all RI counties.",
    website_url: "https://www.rilegion.org/", phone: "401-732-9663",
    address: "590 Hartford Ave", city: "Providence", zip: "02909",
    source_name: "American Legion Department of RI" },

  { section: "E", title: "VFW Department of Rhode Island",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "Veterans of Foreign Wars Department of Rhode Island — congressionally-chartered VSO with 25+ posts statewide. VA-accredited claims service officers, Voice of Democracy + Patriot's Pen scholarships, and veteran community programs across all RI counties.",
    website_url: "https://www.vfwri.org/", phone: "401-941-0676",
    address: "1601 Cranston St", city: "Cranston", zip: "02920",
    source_name: "VFW Department of RI" },

  { section: "E", title: "DAV Department of Rhode Island",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "Disabled American Veterans Department of Rhode Island — congressionally-chartered VSO serving disabled RI veterans. VA-accredited claims service officers, DAV Transportation Network volunteer driver program to Providence VAMC, and benefits assistance statewide.",
    website_url: "https://davri.org/", phone: "401-273-7100",
    address: "830 Chalkstone Ave", city: "Providence", zip: "02908",
    source_name: "DAV Department of RI" },

  { section: "E", title: "Vietnam Veterans of America Rhode Island State Council",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "Vietnam Veterans of America Rhode Island State Council — congressionally-chartered VSO serving Vietnam-era veterans. VA-accredited service officers, Agent Orange + PTSD claims assistance, AVVA auxiliary, and veteran community programs across multiple RI chapters.",
    website_url: "https://vvari.org/", phone: "401-736-6122",
    address: "100 Niantic Ave", city: "Cranston", zip: "02907",
    source_name: "VVA Rhode Island State Council" },

  { section: "E", title: "AMVETS Department of Rhode Island",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "AMVETS Department of Rhode Island — congressionally-chartered VSO open to all who served honorably. VA-accredited claims service officers, scholarships, ROTC + JROTC awards, and veteran community programs across multiple RI posts.",
    website_url: "https://www.amvets.org/dept/ri/", phone: "401-941-1881",
    address: "55 Diaz St", city: "Providence", zip: "02906",
    source_name: "AMVETS Department of RI" },

  { section: "E", title: "Marine Corps League Department of Rhode Island",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "Marine Corps League Department of Rhode Island — congressionally-chartered VSO for active + reserve + retired + honorably-discharged Marines + FMF Corpsmen. Toys for Tots, MCL scholarships, color guards, and Marine community programs across multiple RI detachments.",
    website_url: "https://www.mcleagueri.org/", phone: "401-822-2667",
    address: "1146 Aquidneck Ave", city: "Middletown", zip: "02842",
    source_name: "Marine Corps League Department of RI" },

  { section: "E", title: "Operation Stand Down Rhode Island",
    cat: "community-support", sub: "Veteran Nonprofit Organizations",
    desc: "Operation Stand Down Rhode Island — Johnston-based nonprofit serving homeless + at-risk RI veterans. Annual Stand Down event, transitional housing, employment + benefits navigation, food + clothing pantry, and case management. Veteran-led.",
    website_url: "https://www.osdri.org/", phone: "401-383-4730",
    address: "1010 Hartford Ave", city: "Johnston", zip: "02919",
    source_name: "Operation Stand Down Rhode Island" },

  { section: "E", title: "RI National Guard Family Programs",
    cat: "family-support", sub: "Military Family Support",
    desc: "Rhode Island National Guard Family Programs — state-level family-readiness office at Camp Fogarty serving RI Army + Air National Guard families. Family Assistance Center, Yellow Ribbon reintegration, deployment cycle support, and child + youth programs statewide.",
    website_url: "https://ri.ng.mil/Resources/Family-Programs/", phone: "401-275-4109",
    address: "330 Camp Fogarty, 2841 South County Trl", city: "East Greenwich", zip: "02818",
    source_name: "Rhode Island National Guard" },

  { section: "E", title: "IAVA Iraq and Afghanistan Veterans of America Rhode Island",
    cat: "community-support", sub: "Veteran Nonprofit Organizations",
    desc: "Iraq and Afghanistan Veterans of America (IAVA) — national nonprofit + advocacy organization for post-9/11 veterans incl. RI members. Quick Reaction Force case-management, mental health + suicide prevention advocacy, and statewide veteran community programs.",
    website_url: "https://iava.org/", phone: "212-982-9699",
    address: "292 Madison Ave, 10th Floor", city: "New York", zip: "10017",
    source_name: "IAVA" },

  { section: "E", title: "Wreaths Across America Rhode Island",
    cat: "community-support", sub: "Volunteer & Mission-Based Community",
    desc: "Wreaths Across America Rhode Island — annual December wreath-laying ceremonies at RI Veterans Memorial Cemetery Exeter, Massachusetts National Cemetery Bourne, and other RI veteran cemeteries. Volunteer-driven, sponsorship-funded honoring of fallen RI veterans.",
    website_url: "https://www.wreathsacrossamerica.org/", phone: "877-385-9504",
    address: "4 Point St", city: "Columbia Falls", zip: "04623",
    source_name: "Wreaths Across America" },

  { section: "E", title: "Rhode Island Korean War Veterans Association",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "Korean War Veterans Association RI Chapter — congressionally-chartered VSO for Korean War-era veterans. Memorial ceremonies, scholarship awards, and veteran community programs honoring 'Forgotten War' service across RI.",
    website_url: "https://www.kwva.org/", phone: "401-274-2500",
    address: "590 Hartford Ave", city: "Providence", zip: "02909",
    source_name: "KWVA RI Chapter" },

  { section: "E", title: "Travis Manion Foundation Rhode Island",
    cat: "community-support", sub: "Veteran Nonprofit Organizations",
    desc: "Travis Manion Foundation — national nonprofit empowering veterans + families of fallen heroes through character development + leadership programs incl. RI chapter activities. Spartan Leadership Program, Operation Legacy service projects, and youth character workshops.",
    website_url: "https://www.travismanion.org/", phone: "215-348-9080",
    address: "120 W Germantown Pike, Suite 100", city: "Plymouth Meeting", zip: "19462",
    source_name: "Travis Manion Foundation" },

  // ===========================================================================
  // F. FOOD BANKS + PANTRIES (8)
  // ===========================================================================
  { section: "F", title: "Rhode Island Community Food Bank",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Rhode Island Community Food Bank — RI's largest food bank, distributing food to 145+ partner agencies (pantries, shelters, meal sites) statewide. Direct grocery distribution, SNAP outreach, mobile pantry, and Cooking Matters classes for low-income RI residents incl. veterans.",
    website_url: "https://rifoodbank.org/", phone: "401-942-6325",
    address: "200 Niantic Ave", city: "Providence", zip: "02907",
    source_name: "Rhode Island Community Food Bank" },

  { section: "F", title: "Amos House Providence",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Amos House — Providence-based nonprofit serving 30,000+ low-income + homeless RI residents annually. Daily soup kitchen + free meals, food pantry, emergency shelter, transitional housing, education, and reentry programs. Veteran + at-risk RI populations served.",
    website_url: "https://www.amoshouse.com/", phone: "401-272-0220",
    address: "460 Pine St", city: "Providence", zip: "02907",
    source_name: "Amos House" },

  { section: "F", title: "Mc Auley House Providence",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "McAuley House (Sisters of Mercy) — Providence-based daily hospitality center providing free hot lunches, food pantry, clothing, showers, hygiene + laundry, ID + benefits assistance, and case management for low-income + homeless RI residents incl. veterans.",
    website_url: "https://mcauleyri.org/", phone: "401-941-9013",
    address: "622 Elmwood Ave", city: "Providence", zip: "02907",
    source_name: "McAuley Ministries" },

  { section: "F", title: "Westbay Community Action Warwick",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Westbay Community Action — Kent County Community Action Agency. Food pantry, energy assistance (LIHEAP), Head Start, senior services, and housing assistance for low-income Kent County (Warwick, West Warwick, Coventry, East + West Greenwich) residents incl. veterans.",
    website_url: "https://westbaycap.org/", phone: "401-732-4660",
    address: "224 Buttonwoods Ave", city: "Warwick", zip: "02886",
    source_name: "Westbay Community Action" },

  { section: "F", title: "Tap-In East Greenwich Food Pantry",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Tap-In (To Assist People In Need) — East Greenwich-based volunteer-run food pantry + emergency assistance program serving East Greenwich + West Greenwich + Exeter + parts of Warwick + Coventry residents incl. veterans. Free groceries, holiday meals, school supplies, fuel assistance.",
    website_url: "https://tap-in.org/", phone: "401-885-3020",
    address: "1235 Main St", city: "East Greenwich", zip: "02818",
    source_name: "Tap-In Inc." },

  { section: "F", title: "Jonnycake Center Peace Dale",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Jonnycake Center of Peace Dale — Washington County food pantry + thrift store + housing assistance + emergency financial aid agency. Serves South Kingstown, Narragansett, Charlestown, Richmond, Hopkinton, Exeter low-income residents incl. veterans.",
    website_url: "https://jonnycakecenter.org/", phone: "401-789-1559",
    address: "1231 Kingstown Rd", city: "Peace Dale", zip: "02879",
    source_name: "Jonnycake Center of Peace Dale" },

  { section: "F", title: "Westerly Area Rest Meals WARM Center",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "WARM Center (Westerly Area Rest Meals) — Westerly-based nonprofit operating a year-round homeless shelter, food pantry, daily community meals, and case management for low-income + homeless Westerly area RI/CT residents incl. veterans.",
    website_url: "https://www.thewarmcenter.org/", phone: "401-596-9276",
    address: "56 Spruce St", city: "Westerly", zip: "02891",
    source_name: "WARM Center" },

  { section: "F", title: "Federal Hill House Providence",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Federal Hill House — Providence-based settlement house providing food pantry, congregate meals, senior services, youth programs, and immigrant services for low-income Federal Hill + West End Providence residents incl. veterans + immigrant veterans.",
    website_url: "https://federalhillhouse.org/", phone: "401-421-1095",
    address: "9 Courtland St", city: "Providence", zip: "02909",
    source_name: "Federal Hill House" },

  // ===========================================================================
  // G. HOUSING + SHELTERS (10)
  // ===========================================================================
  { section: "G", title: "Crossroads Rhode Island Providence",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "Crossroads Rhode Island — RI's largest homeless services agency. Emergency shelter (men + women + family), permanent supportive housing, rapid rehousing, daily basic needs center, employment services, and Housing First model for RI veterans + chronically homeless adults.",
    website_url: "https://www.crossroadsri.org/", phone: "401-521-2255",
    address: "160 Broad St", city: "Providence", zip: "02903",
    source_name: "Crossroads Rhode Island" },

  { section: "G", title: "Operation Stand Down RI Veterans Transitional Housing Johnston",
    cat: "housing", sub: "Transitional Housing",
    desc: "Operation Stand Down RI Transitional Housing Program — VA-Per Diem-funded transitional housing for homeless RI veterans on the Johnston campus. Up to 24-month stays + intensive case management + employment + benefits + sobriety support for stable permanent housing transition.",
    website_url: "https://www.osdri.org/transitional-housing", phone: "401-383-4730",
    address: "1010 Hartford Ave", city: "Johnston", zip: "02919",
    source_name: "Operation Stand Down Rhode Island" },

  { section: "G", title: "HUD VASH Providence VA Housing Voucher Program",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "HUD-VASH Providence VA — VA + HUD partnership combining Housing Choice (Section 8) rental vouchers with VA case management for homeless RI veterans. Permanent supportive housing with wraparound clinical, mental health, and substance use disorder services.",
    website_url: "https://www.va.gov/homeless/hud-vash.asp", phone: "401-273-7100",
    address: "830 Chalkstone Ave", city: "Providence", zip: "02908",
    source_name: "Providence VA Healthcare System" },

  { section: "G", title: "House of Hope CDC Warwick",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "House of Hope Community Development Corporation — Warwick-based nonprofit ending homelessness in RI. Outreach, basic needs, drop-in center, permanent supportive housing, SOAR SSI/SSDI assistance, and street medicine for chronically homeless RI residents incl. veterans.",
    website_url: "https://www.houseofhopecdc.org/", phone: "401-463-3324",
    address: "927 Warwick Ave", city: "Warwick", zip: "02888",
    source_name: "House of Hope CDC" },

  { section: "G", title: "Family Service of Rhode Island Providence",
    cat: "housing", sub: "Rental Assistance",
    desc: "Family Service of Rhode Island (FSRI) — statewide multi-service agency offering RI Department of Children, Youth + Families contracts, behavioral health, foster care, mobile crisis (988-aligned), housing stabilization, and rental assistance for veteran + at-risk families across RI.",
    website_url: "https://www.familyserviceri.org/", phone: "401-331-1350",
    address: "55 Hope St", city: "Providence", zip: "02906",
    source_name: "Family Service of Rhode Island" },

  { section: "G", title: "Welcome House of South County Wakefield",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "Welcome House of South County — Wakefield-based emergency shelter + transitional housing serving homeless adults in Washington County (South Kingstown, Narragansett, Charlestown, Westerly, Richmond, Hopkinton, Exeter) incl. veterans. Case management, employment + housing nav.",
    website_url: "https://www.welcomehouseri.org/", phone: "401-783-2255",
    address: "8 N Road", city: "Wakefield", zip: "02879",
    source_name: "Welcome House of South County" },

  { section: "G", title: "McAuley Village Providence Family Housing",
    cat: "housing", sub: "Transitional Housing",
    desc: "McAuley Village (Sisters of Mercy) — Providence-based 41-unit affordable family housing community + on-site case management + child care + adult education + financial coaching for low-income single mothers + their children incl. veteran families.",
    website_url: "https://mcauleyri.org/programs/mcauley-village/", phone: "401-941-9013",
    address: "622 Elmwood Ave", city: "Providence", zip: "02907",
    source_name: "McAuley Ministries" },

  { section: "G", title: "Better Lives Rhode Island Providence",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "Better Lives Rhode Island (formerly Riverwood Mental Health Services) — Providence-based nonprofit serving adults with serious mental illness + substance use disorder + co-occurring disorders. Emergency shelter, supportive housing, ACT teams, and outpatient services for veterans.",
    website_url: "https://www.betterlivesri.org/", phone: "401-272-0480",
    address: "603 Manton Ave", city: "Providence", zip: "02909",
    source_name: "Better Lives Rhode Island" },

  { section: "G", title: "Rhode Island Coalition to End Homelessness Pawtucket",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Rhode Island Coalition to End Homelessness — statewide coalition coordinating Continuum of Care, Coordinated Entry, HMIS, By-Name List for homeless veterans, and policy advocacy. Connects RI veterans + homeless individuals to housing, shelter, and benefits resources statewide.",
    website_url: "https://www.rihomeless.org/", phone: "401-721-5680",
    address: "100 Branch St, Suite 102", city: "Pawtucket", zip: "02860",
    source_name: "RI Coalition to End Homelessness" },

  { section: "G", title: "Sojourner House Transitional Housing Providence",
    cat: "housing", sub: "Transitional Housing",
    desc: "Sojourner House Transitional Housing — DV-survivor-specific transitional housing program in Providence + Northern RI. Up to 24-month stays for survivors + their children fleeing domestic violence incl. military + veteran families. Case management + counseling + economic empowerment.",
    website_url: "https://www.sojournerri.org/transitional-housing/", phone: "401-765-3232",
    address: "386 Smith St", city: "Providence", zip: "02908",
    source_name: "Sojourner House" },

  // ===========================================================================
  // H. EMPLOYMENT + WORKFORCE (10)
  // ===========================================================================
  { section: "H", title: "Rhode Island Department of Labor and Training",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Rhode Island Department of Labor and Training (DLT) — state workforce + unemployment insurance + workers' compensation agency. Operates 6 netWORKri Career Centers statewide + DVOP/LVER veterans-priority-of-service program for RI veterans seeking employment.",
    website_url: "https://dlt.ri.gov/", phone: "401-462-8000",
    address: "1511 Pontiac Ave", city: "Cranston", zip: "02920",
    source_name: "RI Department of Labor and Training" },

  { section: "H", title: "netWORKri Career Center Providence",
    cat: "employment", sub: "Career Counseling",
    desc: "netWORKri Career Center Providence — RI DLT One-Stop Career Center serving Providence + Cranston + Johnston + North Providence + East Providence job seekers incl. veterans (priority of service). Job search, resume, training referral (WIOA), DVOP/LVER veteran specialists.",
    website_url: "https://dlt.ri.gov/employment-services/networkri", phone: "401-462-8730",
    address: "1 Reservoir Ave", city: "Providence", zip: "02907",
    source_name: "RI Department of Labor and Training" },

  { section: "H", title: "netWORKri Career Center Pawtucket",
    cat: "employment", sub: "Career Counseling",
    desc: "netWORKri Career Center Pawtucket — RI DLT One-Stop Career Center serving Blackstone Valley (Pawtucket, Central Falls, Cumberland, Lincoln, Woonsocket) job seekers incl. veterans (priority of service). Job search, resume, training referral (WIOA), DVOP/LVER veteran specialists.",
    website_url: "https://dlt.ri.gov/employment-services/networkri", phone: "401-721-5673",
    address: "171 Main St", city: "Pawtucket", zip: "02860",
    source_name: "RI Department of Labor and Training" },

  { section: "H", title: "netWORKri Career Center Wakefield",
    cat: "employment", sub: "Career Counseling",
    desc: "netWORKri Career Center Wakefield — RI DLT One-Stop Career Center serving Washington County (South Kingstown, North Kingstown, Narragansett, Charlestown, Westerly, Hopkinton, Richmond, Exeter) job seekers incl. veterans. DVOP/LVER veteran specialists.",
    website_url: "https://dlt.ri.gov/employment-services/networkri", phone: "401-782-4362",
    address: "4808 Tower Hill Rd", city: "Wakefield", zip: "02879",
    source_name: "RI Department of Labor and Training" },

  { section: "H", title: "netWORKri Career Center West Warwick",
    cat: "employment", sub: "Career Counseling",
    desc: "netWORKri Career Center West Warwick — RI DLT One-Stop Career Center serving Kent County (Warwick, West Warwick, Coventry, East + West Greenwich) job seekers incl. veterans (priority of service). Job search, resume, training referral (WIOA), DVOP/LVER veteran specialists.",
    website_url: "https://dlt.ri.gov/employment-services/networkri", phone: "401-828-8382",
    address: "1330 Main St", city: "West Warwick", zip: "02893",
    source_name: "RI Department of Labor and Training" },

  { section: "H", title: "netWORKri Career Center Woonsocket",
    cat: "employment", sub: "Career Counseling",
    desc: "netWORKri Career Center Woonsocket — RI DLT One-Stop Career Center serving Northern RI (Woonsocket, Cumberland, North Smithfield, Burrillville, Glocester, Smithfield) job seekers incl. veterans. DVOP/LVER veteran specialists; WIOA training referral.",
    website_url: "https://dlt.ri.gov/employment-services/networkri", phone: "401-235-1201",
    address: "219 Pond St", city: "Woonsocket", zip: "02895",
    source_name: "RI Department of Labor and Training" },

  { section: "H", title: "netWORKri Career Center Newport",
    cat: "employment", sub: "Career Counseling",
    desc: "netWORKri Career Center Newport — RI DLT One-Stop Career Center serving Newport County + East Bay (Newport, Middletown, Portsmouth, Tiverton, Little Compton, Jamestown, Bristol, Warren, Barrington) job seekers incl. veterans. DVOP/LVER veteran specialists.",
    website_url: "https://dlt.ri.gov/employment-services/networkri", phone: "401-845-6373",
    address: "63 Broadway", city: "Newport", zip: "02840",
    source_name: "RI Department of Labor and Training" },

  { section: "H", title: "Goodwill Industries of Rhode Island",
    cat: "employment", sub: "Job Placement Programs",
    desc: "Goodwill Industries of Rhode Island — workforce nonprofit + retail social enterprise statewide. Job training, placement, supportive employment for adults with disabilities + barriers to employment incl. RI veterans + reentering individuals.",
    website_url: "https://goodwillri.org/", phone: "401-861-2080",
    address: "10 Davol Sq", city: "Providence", zip: "02903",
    source_name: "Goodwill Industries of RI" },

  { section: "H", title: "Year Up Providence",
    cat: "employment", sub: "Apprenticeships",
    desc: "Year Up Providence — yearlong workforce development program for low-income young adults 18-26 incl. veterans. 6-month skills training (IT, business, financial services) + 6-month corporate internship + college credit + stipend + career placement. Site at CCRI.",
    website_url: "https://www.yearup.org/locations/providence", phone: "401-455-2234",
    address: "1 Hilton St", city: "Providence", zip: "02905",
    source_name: "Year Up United" },

  { section: "H", title: "Real Jobs Rhode Island Industry Partnerships",
    cat: "employment", sub: "Apprenticeships",
    desc: "Real Jobs Rhode Island — RI DLT industry-driven workforce development initiative. Industry partnerships in healthcare, advanced manufacturing, IT, marine trades, construction, hospitality. Connects RI veterans to no-cost training + apprenticeship + employer-led pipeline jobs.",
    website_url: "https://dlt.ri.gov/employment-services/business-services/real-jobs-rhode-island", phone: "401-462-8740",
    address: "1511 Pontiac Ave", city: "Cranston", zip: "02920",
    source_name: "RI Department of Labor and Training" },

  // ===========================================================================
  // I. TRANSPORTATION (6)
  // ===========================================================================
  { section: "I", title: "Rhode Island Public Transit Authority RIPTA",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "Rhode Island Public Transit Authority (RIPTA) — statewide bus + paratransit operator serving all 39 RI municipalities. RIPTA No-Fare Bus Pass for low-income veterans, Reduced Fare for seniors + disabled veterans, and Veterans Transportation Service to Providence VAMC.",
    website_url: "https://www.ripta.com/", phone: "401-781-9400",
    address: "705 Elmwood Ave", city: "Providence", zip: "02907",
    source_name: "Rhode Island Public Transit Authority" },

  { section: "I", title: "RIde Paratransit Program",
    cat: "transportation", sub: "Non-Emergency Medical Transport",
    desc: "RIPTA RIde Paratransit Program — ADA-mandated origin-to-destination paratransit service for RI residents who cannot use fixed-route bus due to disability. Statewide coverage 7 days/week incl. disabled RI veterans + medical appointments to Providence VAMC + Newport/Bristol clinics.",
    website_url: "https://www.ripta.com/ride-paratransit/", phone: "401-461-9760",
    address: "705 Elmwood Ave", city: "Providence", zip: "02907",
    source_name: "Rhode Island Public Transit Authority" },

  { section: "I", title: "DAV Transportation Network Providence VAMC",
    cat: "transportation", sub: "VA Medical Transport",
    desc: "Disabled American Veterans (DAV) Transportation Network — Providence VA Medical Center volunteer-driver program providing free rides to + from VA medical appointments for RI veterans. Coordinated through Providence VAMC Voluntary Service.",
    website_url: "https://www.va.gov/providence-health-care/work-with-us/volunteer-or-donate/", phone: "401-273-7100",
    address: "830 Chalkstone Ave", city: "Providence", zip: "02908",
    source_name: "Providence VA Healthcare System" },

  { section: "I", title: "Veterans Transportation Service Providence VAMC",
    cat: "transportation", sub: "VA Medical Transport",
    desc: "Veterans Transportation Service (VTS) Providence VA — VHA-operated van transportation network providing free rides for RI veterans to + from VA + non-VA medical appointments. Wheelchair-accessible vehicles available; coordinate through Providence VAMC Health Administration Service.",
    website_url: "https://www.va.gov/healthbenefits/vtp/veterans_transportation_service.asp", phone: "401-273-7100",
    address: "830 Chalkstone Ave", city: "Providence", zip: "02908",
    source_name: "Providence VA Healthcare System" },

  { section: "I", title: "Beneficiary Travel Program Providence VA",
    cat: "transportation", sub: "VA Medical Transport",
    desc: "VA Beneficiary Travel Program at Providence VAMC — federal mileage reimbursement program for eligible RI veterans traveling to + from VA-authorized medical care. Service-connected, low-income, and special-eligibility veterans qualify; submit claims via online or in-person.",
    website_url: "https://www.va.gov/health-care/get-reimbursed-for-travel-pay/", phone: "401-273-7100",
    address: "830 Chalkstone Ave", city: "Providence", zip: "02908",
    source_name: "Providence VA Healthcare System" },

  { section: "I", title: "ITNRI Independent Transportation Network",
    cat: "transportation", sub: "Ride Assistance Programs",
    desc: "Independent Transportation Network of Rhode Island (ITNRI) — Providence-based volunteer-driver organization providing dignified, affordable rides to seniors 60+ + adults with vision impairments incl. retired RI veterans. Door-through-door service across Greater Providence + Newport County.",
    website_url: "https://www.itnamerica.org/", phone: "401-228-5860",
    address: "200 Allens Ave", city: "Providence", zip: "02905",
    source_name: "ITN America" },

  // ===========================================================================
  // J. LEGAL + FINANCIAL (8)
  // ===========================================================================
  { section: "J", title: "Rhode Island Legal Services",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Rhode Island Legal Services (RILS) — statewide nonprofit law firm providing free civil legal aid to low-income RI residents incl. veterans. Housing, family, public benefits, immigration, consumer + elder-law representation. Offices in Providence + Newport + Wakefield + Pawtucket.",
    website_url: "https://www.rils.org/", phone: "401-274-2652",
    address: "56 Pine St, Suite 400", city: "Providence", zip: "02903",
    source_name: "Rhode Island Legal Services" },

  { section: "J", title: "Rhode Island Center for Justice",
    cat: "legal", sub: "Pro Bono Legal Services",
    desc: "Rhode Island Center for Justice — Providence-based public-interest law firm providing free legal representation in housing, employment, immigration, and education for low-income RI residents incl. veterans. Eviction-defense, debt-collection, and impact litigation.",
    website_url: "https://centerforjustice.org/", phone: "401-491-1101",
    address: "1 Empire Plaza, Suite 410", city: "Providence", zip: "02903",
    source_name: "Rhode Island Center for Justice" },

  { section: "J", title: "Rhode Island Bar Association Volunteer Lawyer Program",
    cat: "legal", sub: "Pro Bono Legal Services",
    desc: "RI Bar Association Volunteer Lawyer Program — statewide pro bono program connecting low-income RI residents incl. veterans with volunteer attorneys. Family law, probate, consumer, and bankruptcy representation. Reduced-fee referral panel + Lawyer Referral Service.",
    website_url: "https://ribar.com/legal-aid/", phone: "401-421-7758",
    address: "115 Cedar St", city: "Providence", zip: "02903",
    source_name: "Rhode Island Bar Association" },

  { section: "J", title: "Roger Williams University Veterans Law Clinic Bristol",
    cat: "legal", sub: "Veterans Legal Clinics",
    desc: "Roger Williams University School of Law Veterans Disability Appeals Clinic — Bristol-based law school clinic providing free representation to RI veterans appealing denied VA disability claims at the Board of Veterans' Appeals. Supervised by VA-accredited faculty attorneys.",
    website_url: "https://law.rwu.edu/academics/clinics/veterans-disability-appeals-clinic", phone: "401-254-4500",
    address: "10 Metacom Ave", city: "Bristol", zip: "02809",
    source_name: "Roger Williams University School of Law" },

  { section: "J", title: "United Way of Rhode Island 211",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "United Way of Rhode Island 211 — statewide 24/7 information + referral helpline. Dial 211 or text 'RI' to 898211 for connection to housing, food, financial, mental health, healthcare, legal, and veteran-specific resources across all 39 RI municipalities.",
    website_url: "https://www.unitedwayri.org/our-work/community-impact/211/", phone: "211",
    address: "50 Valley St", city: "Providence", zip: "02909",
    source_name: "United Way of Rhode Island" },

  { section: "J", title: "Capital Good Fund Providence",
    cat: "financial", sub: "Banking / Lending Support",
    desc: "Capital Good Fund — Providence-based nonprofit CDFI offering small dollar emergency loans, immigration loans, security deposit loans, and Financial + Health Coaching for low-income RI + multi-state residents incl. veterans. No-fee, low-interest alternative to predatory lending.",
    website_url: "https://capitalgoodfund.org/", phone: "866-584-3651",
    address: "165 Broadway", city: "Providence", zip: "02903",
    source_name: "Capital Good Fund" },

  { section: "J", title: "Rhode Island VITA Volunteer Income Tax Assistance",
    cat: "financial", sub: "Tax Preparation",
    desc: "United Way of RI VITA Coalition — IRS Volunteer Income Tax Assistance program offering free tax preparation for low-income RI residents (incl. veterans) earning under ~$66K. 30+ sites statewide; certified volunteer preparers; EITC + Child Tax Credit maximization.",
    website_url: "https://www.unitedwayri.org/our-work/community-impact/vita/", phone: "211",
    address: "50 Valley St", city: "Providence", zip: "02909",
    source_name: "United Way of Rhode Island" },

  { section: "J", title: "Rhode Island Coalition Against Domestic Violence",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Rhode Island Coalition Against Domestic Violence (RICADV) — statewide coalition of 6 RI member DV agencies. Survivor advocacy, legal advocacy + Domestic Violence Court representation, public-policy + prevention. Coordinates statewide DV services for veterans + military-family survivors.",
    website_url: "https://www.ricadv.org/", phone: "401-467-9940",
    address: "422 Post Rd, Suite 202", city: "Warwick", zip: "02888",
    source_name: "RI Coalition Against Domestic Violence" },

  // ===========================================================================
  // K. SENIOR + FAMILY + EOL + DISABLED + EDU (15)
  // ===========================================================================
  { section: "K", title: "Rhode Island Office of Healthy Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Rhode Island Office of Healthy Aging (formerly Division of Elderly Affairs) — state agency for adults 60+ incl. retired veterans. Statewide info + referral, SHIP/SHINE Medicare counseling, family caregiver support program, elder rights protection, and POINT statewide aging info center.",
    website_url: "https://oha.ri.gov/", phone: "401-462-3000",
    address: "25 Howard Ave, Building 57", city: "Cranston", zip: "02920",
    source_name: "RI Office of Healthy Aging" },

  { section: "K", title: "Saint Elizabeth Community East Greenwich",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Saint Elizabeth Community — RI's largest nonprofit elder-care system. Operates skilled nursing, assisted living, adult day, home health + Saint Elizabeth Hospice serving statewide RI residents incl. retired veterans. We Honor Veterans partner; Bristol + East Greenwich + Providence sites.",
    website_url: "https://www.stelizabethcommunity.org/", phone: "401-490-5000",
    address: "1 St Elizabeth Way", city: "East Greenwich", zip: "02818",
    source_name: "Saint Elizabeth Community" },

  { section: "K", title: "Home and Hospice Care of Rhode Island Providence",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Home & Hospice Care of Rhode Island (HHCRI) — RI's oldest + largest nonprofit hospice + palliative care provider. Statewide in-home end-of-life care, palliative consultation, Philip Hulitar Center inpatient hospice, and bereavement support. We Honor Veterans Level 4 partner.",
    website_url: "https://hhcri.org/", phone: "401-415-4200",
    address: "1085 N Main St", city: "Providence", zip: "02904",
    source_name: "Home & Hospice Care of RI" },

  { section: "K", title: "VNA of Care New England Providence",
    cat: "end-of-life-services", sub: "In-Home Care & Skilled Nursing",
    desc: "VNA of Care New England — Care New England visiting nurse association providing in-home skilled nursing, physical/occupational/speech therapy, home health aides, hospice + palliative care across RI. We Honor Veterans partner; serves RI veterans aging in place statewide.",
    website_url: "https://www.carenewengland.org/services/vna", phone: "401-737-6050",
    address: "51 Health Ln", city: "Warwick", zip: "02886",
    source_name: "Care New England Health System" },

  { section: "K", title: "PARI Independent Living Center Pawtucket",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "PARI Independent Living Center — consumer-directed nonprofit Independent Living Center serving Greater Providence + Blackstone Valley RI (Pawtucket, Central Falls, Cumberland, Lincoln, Woonsocket, Providence). Skills training, peer support, advocacy, PCA mgmt for disabled veterans.",
    website_url: "https://www.pari-ilc.org/", phone: "401-725-1966",
    address: "500 Prospect St", city: "Pawtucket", zip: "02860",
    source_name: "PARI Independent Living Center" },

  { section: "K", title: "Ocean State Center for Independent Living Warwick",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Ocean State Center for Independent Living (OSCIL) — consumer-directed nonprofit Independent Living Center serving Kent + Washington + Newport counties RI. Skills training, peer support, advocacy, PCA management, and benefits counseling for disabled RI veterans.",
    website_url: "https://www.oscil.org/", phone: "401-738-1013",
    address: "1944 Warwick Ave", city: "Warwick", zip: "02889",
    source_name: "Ocean State Center for Independent Living" },

  { section: "K", title: "Rhode Island Office of Rehabilitation Services",
    cat: "disabled-veterans", sub: "Employment & Vocational Rehabilitation",
    desc: "Rhode Island Office of Rehabilitation Services (ORS) — state vocational rehabilitation agency serving RI residents with disabilities incl. disabled veterans. Vocational counseling, job training, supported employment, assistive technology, and community-based services statewide.",
    website_url: "https://ors.ri.gov/", phone: "401-421-7005",
    address: "40 Fountain St", city: "Providence", zip: "02903",
    source_name: "RI Office of Rehabilitation Services" },

  { section: "K", title: "VA Caregiver Support Providence VAMC",
    cat: "family-support", sub: "Caregiver Support",
    desc: "VA Caregiver Support Program at Providence VAMC — supports family caregivers of RI veterans of all eras. Program of Comprehensive Assistance for Family Caregivers (PCAFC) stipend + General Caregiver Support Services + caregiver education + respite + counseling.",
    website_url: "https://www.caregiver.va.gov/", phone: "401-273-7100",
    address: "830 Chalkstone Ave", city: "Providence", zip: "02908",
    source_name: "Providence VA Healthcare System" },

  { section: "K", title: "Meeting Street Providence",
    cat: "family-support", sub: "Childcare Assistance",
    desc: "Meeting Street — Providence-based nonprofit serving children + young adults with disabilities, complex medical needs, and developmental delays incl. those of RI veteran families. Early intervention, integrated preschool, K-12 special education, and Adult Day services.",
    website_url: "https://www.meetingstreet.org/", phone: "401-533-9100",
    address: "1000 Eddy St", city: "Providence", zip: "02905",
    source_name: "Meeting Street" },

  { section: "K", title: "Boys and Girls Clubs of Providence",
    cat: "family-support", sub: "Youth Programs",
    desc: "Boys & Girls Clubs of Providence — youth development organization with multiple Providence club sites + summer camps serving low-income youth incl. children of RI veterans. Academic enrichment, athletics, arts, character development, and STEM programming.",
    website_url: "https://www.bgcprov.org/", phone: "401-272-7180",
    address: "1 Fricker St", city: "Providence", zip: "02903",
    source_name: "Boys & Girls Clubs of Providence" },

  { section: "K", title: "Brown University Office of Military Affiliated Students",
    cat: "education", sub: "College & University Programs",
    desc: "Brown University Office of Military Affiliated Students — Providence-based Ivy League veteran + military student services office. Yellow Ribbon GI Bill, Vets@Brown student org, transfer credit evaluation, mental health + academic advising for student-veterans + dependents.",
    website_url: "https://college.brown.edu/military-affiliated", phone: "401-863-2378",
    address: "Page-Robinson Hall, 69 Brown St", city: "Providence", zip: "02912",
    source_name: "Brown University" },

  { section: "K", title: "URI Veterans Affairs and Military Programs Kingston",
    cat: "education", sub: "College & University Programs",
    desc: "University of Rhode Island Veterans Affairs + Military Programs — Kingston-based public-university veteran services office. Yellow Ribbon GI Bill, VetSuccess on Campus VR&E counselor, student-veteran lounge, mental health support, and Tutor.com for student-vets + dependents.",
    website_url: "https://web.uri.edu/enrollment/veterans/", phone: "401-874-2305",
    address: "Memorial Union, 50 Lower College Rd", city: "Kingston", zip: "02881",
    source_name: "University of Rhode Island" },

  { section: "K", title: "CCRI Office of Veteran and Military Affairs Warwick",
    cat: "education", sub: "Tuition Assistance",
    desc: "Community College of Rhode Island Office of Veteran + Military Affairs — Warwick HQ + Newport + Lincoln + Providence campuses. Yellow Ribbon GI Bill, RI National Guard Tuition Waiver coordination, transfer credit, academic + mental health advising for student-vets + dependents.",
    website_url: "https://www.ccri.edu/veterans/", phone: "401-825-2156",
    address: "400 East Ave", city: "Warwick", zip: "02886",
    source_name: "Community College of Rhode Island" },

  { section: "K", title: "Rhode Island College Veteran Resource Center Providence",
    cat: "education", sub: "College & University Programs",
    desc: "Rhode Island College Veteran Resource Center — Providence-based public-university veteran services office. Yellow Ribbon GI Bill, RI National Guard Tuition Waiver, transfer credit, student-veteran lounge, and academic + mental health advising for student-vets + dependents.",
    website_url: "https://www.ric.edu/department-directory/veterans-resource-center", phone: "401-456-8025",
    address: "600 Mt Pleasant Ave", city: "Providence", zip: "02908",
    source_name: "Rhode Island College" },

  { section: "K", title: "Cranston Senior Services",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "City of Cranston Senior Services — municipal senior center serving Cranston elders incl. retired veterans. Congregate meals, fitness, transportation, SHIP/SHINE Medicare counseling, fuel-assistance intake, and referrals to Cranston Veterans Affairs office + RI Office of Veterans Services.",
    website_url: "https://www.cranstonri.gov/senior-services/", phone: "401-780-6000",
    address: "1070 Cranston St", city: "Cranston", zip: "02920",
    source_name: "City of Cranston" },
];

await runSeed(ROWS, {
  state: "RI",
  commit: COMMIT,
  scriptName: "seed-ri-wave1.ts (Golden Standard Wave 1 / RI baseline)",
  urlCheckTimeoutMs: 12000,
  allowBrokenUrls: ALLOW_BROKEN_URLS,
  allowZipBleed: ALLOW_ZIP_BLEED,
  sectionLabels: {
    A: "State + VA Federal Infrastructure",
    B: "Hospitals + Community Health Centers",
    C: "Mental Health + Crisis + Substance",
    D: "Municipal Veterans Service Offices",
    E: "Veteran Service Organizations",
    F: "Food Banks + Pantries",
    G: "Housing + Shelters",
    H: "Employment + Workforce",
    I: "Transportation",
    J: "Legal + Financial",
    K: "Senior + Family + EOL + Disabled + Edu",
  },
});
