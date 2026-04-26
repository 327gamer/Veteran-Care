/**
 * California Phase 2 — Los Angeles Saturation
 *
 * Adds verified veteran-serving organizations across LA County metros,
 * filling the gaps left by Phase 1A/1B (which seeded 36 LA-area rows
 * concentrated in LA City + Long Beach + a handful of satellites).
 *
 * Scope (founder-approved sections):
 *   R = Homeless Veteran Infrastructure (LA County)
 *   S = Mental Health / PTSD + Substance Recovery
 *   T = Legal / Employment
 *   U = Family Support
 *   V = Financial / Community
 *   W = Healthcare / Transportation / VSO
 *
 * Founder SOP applied:
 *   - No fabrication. Every row's URL was HTTP-verified or maps to a
 *     widely-documented .gov / .org canonical source.
 *   - Skip weak rows. Anything where the org's LA presence couldn't be
 *     confirmed against canonical sources was dropped, not guessed.
 *   - Engine handles dedupe vs the 36 existing LA-area rows + 195 CA rows
 *     + national rows (rollout-engine.ts loadDedupeIndex).
 *   - lat/lng intentionally null (engine rule).
 *   - Phone numbers verified via the org's public contact page during
 *     source verification, or VA.gov find-locations for VA sites.
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");

const ROWS: SeedRow[] = [
  // ===== R — Homeless Veteran Infrastructure (LA County) =====
  {
    section: "R", title: "Union Rescue Mission - Veterans Programs",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "One of the largest privately funded rescue missions in the U.S. (founded 1891). Skid Row campus offers emergency shelter, transitional housing, food, healthcare, recovery, and employment services — with a long-running Veterans program that connects homeless veterans to VA benefits, SSVF, and HUD-VASH housing.",
    website_url: "https://urm.org/",
    phone: "(213) 347-6300", address: "545 South San Pedro Street",
    city: "Los Angeles", zip: "90013",
    eligibility: "Veterans and non-veterans experiencing homelessness",
    source_name: "Union Rescue Mission", source_type: "nonprofit",
  },
  {
    section: "R", title: "The Midnight Mission",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Skid Row recovery, housing, and family programs (founded 1914). Offers a long-term residential recovery program (Healthy Living Program) that has historically prioritized homeless veterans, plus emergency services, jobs program, and family housing. SSVF outreach partner.",
    website_url: "https://www.midnightmission.org/",
    phone: "(213) 624-9258", address: "601 South San Pedro Street",
    city: "Los Angeles", zip: "90014",
    eligibility: "Adults experiencing homelessness, including veterans",
    source_name: "The Midnight Mission", source_type: "nonprofit",
  },
  {
    section: "R", title: "Los Angeles Mission",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Skid Row mission (founded 1936) operating emergency shelter, recovery program (Fresh Start), transitional housing, and Anne Douglas Center for Women. Veterans are routed to specialized partners and supported with VA benefits navigation.",
    website_url: "https://www.losangelesmission.org/",
    phone: "(213) 629-1227", address: "303 East 5th Street",
    city: "Los Angeles", zip: "90013",
    eligibility: "Adults experiencing homelessness, including veterans",
    source_name: "Los Angeles Mission", source_type: "nonprofit",
  },
  {
    section: "R", title: "Weingart Center Association",
    cat: "housing", sub: "Transitional Housing",
    desc: "Skid Row's largest provider of transitional and permanent supportive housing (550+ beds). Operates GVR (Gateways to Veterans Recovery) and HUD-VASH supportive housing units, plus on-site mental health, employment, and case management services.",
    website_url: "https://weingart.org/",
    phone: "(213) 627-9000", address: "566 South San Pedro Street",
    city: "Los Angeles", zip: "90013",
    eligibility: "Single adults experiencing homelessness, veteran priority for VASH/SSVF beds",
    source_name: "Weingart Center Association", source_type: "nonprofit",
  },
  {
    section: "R", title: "SRO Housing Corporation",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Skid Row-based developer and operator of 2,000+ units of single-room-occupancy permanent supportive housing. Veteran-set-aside units in multiple buildings with HUD-VASH and SSVF coordination, on-site case management, and behavioral health linkage.",
    website_url: "https://srohousing.org/",
    phone: "(213) 229-9640", address: "725 Crocker Street",
    city: "Los Angeles", zip: "90021",
    eligibility: "Formerly homeless adults, veterans prioritized for set-aside units",
    source_name: "SRO Housing Corporation", source_type: "nonprofit",
  },
  {
    section: "R", title: "LA Family Housing - Veterans Programs",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Major San Fernando Valley homeless services agency operating bridge housing, permanent supportive housing, and rapid re-housing across LA County. SSVF grantee — provides rental assistance, case management, and benefits navigation to homeless and at-risk veteran families.",
    website_url: "https://lafh.org/",
    phone: "(818) 982-4091", address: "7843 Lankershim Boulevard",
    city: "North Hollywood", zip: "91605",
    eligibility: "Veterans and families experiencing or at risk of homelessness",
    source_name: "LA Family Housing", source_type: "nonprofit",
  },
  {
    section: "R", title: "The People Concern - Veterans Services",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Westside/Downtown LA homeless services agency (merger of OPCC and Lamp Community). Operates SSVF rapid re-housing, HUD-VASH supportive housing, integrated outreach teams, and the Sojourn DV shelter. SSVF grantee with a dedicated veterans team.",
    website_url: "https://www.thepeopleconcern.org/",
    phone: "(310) 264-6646", address: "2116 Arlington Avenue, Suite 100",
    city: "Los Angeles", zip: "90018",
    eligibility: "Veterans and families experiencing or at risk of homelessness",
    source_name: "The People Concern", source_type: "nonprofit",
  },
  {
    section: "R", title: "St. Joseph Center - Veterans Outreach",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Venice-based agency serving homeless and very-low-income individuals across LA's Westside. SSVF grantee — rapid re-housing, intensive case management, employment, and behavioral health for veteran households in Santa Monica, Venice, Culver City, and Mar Vista.",
    website_url: "https://stjosephctr.org/",
    phone: "(310) 396-6468", address: "204 Hampton Drive",
    city: "Venice", zip: "90291",
    eligibility: "Homeless and very-low-income individuals and families, including veterans",
    source_name: "St. Joseph Center", source_type: "nonprofit",
  },
  {
    section: "R", title: "National Veterans Foundation - Lifeline for Vets",
    cat: "crisis-help", sub: "Veterans Crisis Line",
    desc: "Encino-based veteran nonprofit operating the Lifeline for Vets — a free, confidential, veteran-staffed national crisis and information hotline (1-888-777-4443). Also provides street outreach to homeless veterans across LA County and information referrals nationwide.",
    website_url: "https://nvf.org/",
    phone: "(888) 777-4443", address: "5777 West Century Boulevard, Suite 350",
    city: "Los Angeles", zip: "90045",
    eligibility: "All veterans and family members nationwide",
    source_name: "National Veterans Foundation", source_type: "nonprofit",
  },
  {
    section: "R", title: "Catholic Charities of Los Angeles - Homeless Services",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Largest private social service agency in LA County. Operates Good Shepherd Center, Brother Miguel Center, and Angel's Flight youth shelter — referring veterans to specialized partners and providing immediate food, shelter, and benefits navigation across 19 service centers.",
    website_url: "https://catholiccharitiesla.org/",
    phone: "(213) 251-3400", address: "1531 James M. Wood Boulevard",
    city: "Los Angeles", zip: "90015",
    eligibility: "Low-income individuals and families, including veterans",
    source_name: "Catholic Charities of Los Angeles", source_type: "nonprofit",
  },

  // ===== S — Mental Health / PTSD + Substance Recovery =====
  {
    section: "S", title: "The Soldiers Project - Los Angeles",
    cat: "mental-health", sub: "PTSD & Trauma Support",
    desc: "Free, confidential, unlimited psychological treatment for post-9/11 service members, veterans, and their families. Founded in LA in 2004 — now a national network of licensed volunteer therapists. Specialty in combat trauma, MST, and family reintegration.",
    website_url: "https://www.thesoldiersproject.org/",
    phone: "(818) 761-7438", address: "16133 Ventura Boulevard, Suite 645",
    city: "Encino", zip: "91436",
    eligibility: "Post-9/11 service members, veterans, and their loved ones",
    source_name: "The Soldiers Project", source_type: "nonprofit",
  },
  {
    section: "S", title: "Saban Community Clinic",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Federally Qualified Health Center serving LA's underserved population since 1967 (formerly Los Angeles Free Clinic). Behavioral health services include therapy, psychiatry, substance use treatment, and case management — sliding-scale and accepts veterans without VA enrollment.",
    website_url: "https://www.sabancommunityclinic.org/",
    phone: "(323) 653-1990", address: "8405 Beverly Boulevard",
    city: "Los Angeles", zip: "90048",
    eligibility: "Adults regardless of insurance status, including veterans",
    source_name: "Saban Community Clinic", source_type: "nonprofit",
  },
  {
    section: "S", title: "Pacific Asian Counseling Services",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Largest provider of culturally competent mental health services to LA County's Asian American and Pacific Islander community. Outpatient therapy, child/family programs, and crisis services — offers culturally informed care for AAPI veterans facing combat trauma, MST, and family stigma.",
    website_url: "https://www.pacsla.org/",
    phone: "(310) 337-1550", address: "8616 La Tijera Boulevard, Suite 200",
    city: "Los Angeles", zip: "90045",
    eligibility: "Asian American and Pacific Islander adults, families, and youth, including veterans",
    source_name: "Pacific Asian Counseling Services", source_type: "nonprofit",
  },
  {
    section: "S", title: "Mental Health America of Los Angeles - Veterans Programs",
    cat: "mental-health", sub: "Peer Support Groups",
    desc: "MHALA operates HUD-VASH supportive housing, the Village Integrated Service Agency, and the Long Beach Veterans Programs — combining permanent supportive housing, peer support specialists (many veterans themselves), employment, and integrated mental health for unhoused veterans.",
    website_url: "https://mhala.org/",
    phone: "(562) 285-1330", address: "1955 Long Beach Boulevard, 3rd Floor",
    city: "Long Beach", zip: "90806",
    eligibility: "Adults with serious mental illness, veterans prioritized for VASH/employment programs",
    source_name: "Mental Health America of Los Angeles", source_type: "nonprofit",
  },
  {
    section: "S", title: "Tarzana Treatment Centers - Veterans Services",
    cat: "substance-recovery", sub: "Veteran Recovery Programs",
    desc: "Largest behavioral healthcare provider in the San Fernando Valley with multiple campuses. Operates VA-contracted residential and outpatient SUD treatment, dual-diagnosis programs, MAT, and a dedicated Veterans Services track for OEF/OIF/OND veterans with co-occurring PTSD.",
    website_url: "https://www.tarzanatc.org/",
    phone: "(818) 996-1051", address: "18646 Oxnard Street",
    city: "Tarzana", zip: "91356",
    eligibility: "Adults and adolescents needing SUD or co-occurring mental health treatment, veterans served via VA contracts",
    source_name: "Tarzana Treatment Centers", source_type: "nonprofit",
  },
  {
    section: "S", title: "Cri-Help Inc.",
    cat: "substance-recovery", sub: "Recovery Support Services",
    desc: "North Hollywood SUD treatment nonprofit (founded 1971) — long-term residential and outpatient programs, with set-aside beds for veterans through VA community-care contracts. SAMHSA-certified MAT.",
    website_url: "https://www.cri-help.org/",
    phone: "(818) 985-8323", address: "11027 Burbank Boulevard",
    city: "North Hollywood", zip: "91601",
    eligibility: "Adults with substance use disorders, including veterans",
    source_name: "Cri-Help Inc.", source_type: "nonprofit",
  },
  {
    section: "S", title: "Beit T'Shuvah",
    cat: "substance-recovery", sub: "Recovery Support Services",
    desc: "Faith-rooted long-term residential SUD treatment program (founded 1987). Accepts veterans through VA Community Care referrals — combines 12-step recovery with trauma-informed therapy, spiritual counseling, and aftercare.",
    website_url: "https://www.beittshuvah.org/",
    phone: "(310) 204-5200", address: "8831 Venice Boulevard",
    city: "Los Angeles", zip: "90034",
    eligibility: "Adults with substance use disorders, veteran referrals via VA Community Care",
    source_name: "Beit T'Shuvah", source_type: "nonprofit",
  },
  {
    section: "S", title: "Salvation Army Adult Rehabilitation Center - Los Angeles",
    cat: "substance-recovery", sub: "Recovery Support Services",
    desc: "Free, faith-based 6-month residential SUD recovery program for adult men, with a long history of serving homeless veterans referred by VA SSVF and HUD-VASH partners. Onsite work therapy, counseling, and recovery groups.",
    website_url: "https://socal.salvationarmy.org/socal/recovery",
    phone: "(213) 627-5121", address: "628 Stanford Avenue",
    city: "Los Angeles", zip: "90021",
    eligibility: "Adult men with substance use disorders, including veterans",
    source_name: "The Salvation Army Southern California Division", source_type: "nonprofit",
  },

  // ===== T — Legal / Employment =====
  {
    section: "T", title: "Bet Tzedek Legal Services - Veterans Justice Project",
    cat: "legal", sub: "Veterans Legal Clinics",
    desc: "Free legal services nonprofit (founded 1974) running a Veterans Justice Project — discharge upgrades, VA benefits appeals, denial of military service connection, MST claims, housing/eviction defense, and consumer protection. Serves LA County veterans regardless of income.",
    website_url: "https://www.bettzedek.org/our-services/veterans-legal-services/",
    phone: "(323) 939-0506", address: "3250 Wilshire Boulevard, 13th Floor",
    city: "Los Angeles", zip: "90010",
    eligibility: "LA County veterans regardless of income",
    source_name: "Bet Tzedek Legal Services", source_type: "nonprofit",
  },
  {
    section: "T", title: "Disability Rights Legal Center",
    cat: "legal", sub: "Disability Claims Assistance",
    desc: "LA-based legal services nonprofit (housed at Loyola Law School). Disability rights and Social Security disability advocacy — assists veterans with concurrent SSDI/SSI applications and appeals where service-connected conditions also qualify under SSA rules.",
    website_url: "https://www.disabilityrightslegalcenter.org/",
    phone: "(213) 736-1031", address: "1541 Wilshire Boulevard, Suite 400",
    city: "Los Angeles", zip: "90017",
    eligibility: "People with disabilities including disabled veterans",
    source_name: "Disability Rights Legal Center", source_type: "nonprofit",
  },
  {
    section: "T", title: "Mental Health Advocacy Services",
    cat: "legal", sub: "Disability Claims Assistance",
    desc: "LA-based legal services nonprofit specializing in SSI/SSDI for adults and children with mental disabilities, plus special education and Medi-Cal advocacy. Handles SSI/SSDI claims for veterans with service-connected mental health conditions.",
    website_url: "https://mhas-la.org/",
    phone: "(213) 389-2077", address: "3255 Wilshire Boulevard, Suite 902",
    city: "Los Angeles", zip: "90010",
    eligibility: "Low-income adults and children with mental disabilities, including veterans",
    source_name: "Mental Health Advocacy Services", source_type: "nonprofit",
  },
  {
    section: "T", title: "Goodwill Southern California - Veterans Initiative",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Goodwill SoCal's Veterans Initiative serves veterans, transitioning service members, and military spouses across LA, Riverside, and San Bernardino counties. Career navigation, paid on-the-job training, certification support, and direct placement with employer partners.",
    website_url: "https://www.goodwillsocal.org/",
    phone: "(323) 223-1211", address: "342 North San Fernando Road",
    city: "Los Angeles", zip: "90031",
    eligibility: "Veterans, transitioning service members, military spouses",
    source_name: "Goodwill Southern California", source_type: "nonprofit",
  },
  // SKIPPED — America's Job Center of California (specific AJCC site)
  // Architect audit 2026-04-26 caught a phone/address mismatch (5446 Sunset Blvd
  // 90027 is the Hollywood Goodwill AJCC, not the West LA site — phone 310-309-6000
  // belongs elsewhere). Per founder SOP no-fabrication / skip-and-queue, dropped
  // from this batch. Queue for Phase 3 with manual canonical verification of the
  // LA County WDACS AJCC directory (currently unreachable from probe IP).

  // ===== U — Family Support =====
  {
    section: "U", title: "Blue Star Families Los Angeles Chapter",
    cat: "family-support", sub: "Military Family Support",
    desc: "Largest chapter-based military family support nonprofit in the U.S. The LA Chapter offers family events, spouse career programs (Blue Star Spouseforce), and the Books on Bases / Books on Posts literacy program for military and veteran families across Southern California.",
    website_url: "https://bluestarfam.org/chapters/los-angeles/",
    phone: "(202) 630-2583", address: "Los Angeles County (chapter HQ in Encino)",
    city: "Los Angeles",
    eligibility: "Active-duty, National Guard, Reserve, veteran, and surviving families",
    source_name: "Blue Star Families", source_type: "nonprofit",
  },
  {
    section: "U", title: "Jewish Family Service of Los Angeles - Family Support",
    cat: "family-support", sub: "Family Counseling",
    desc: "One of LA County's largest social service agencies (founded 1854). Veteran-eligible programs include caregiver respite, mental health counseling, financial assistance for emergency expenses, food pantries, and senior services — open to families of all backgrounds.",
    website_url: "https://www.jfsla.org/",
    phone: "(323) 761-8800", address: "3580 Wilshire Boulevard, Suite 700",
    city: "Los Angeles", zip: "90010",
    eligibility: "LA County families regardless of religious affiliation",
    source_name: "Jewish Family Service of Los Angeles", source_type: "nonprofit",
  },
  {
    section: "U", title: "Fisher House at West Los Angeles VA Medical Center",
    cat: "family-support", sub: "Caregiver Support",
    desc: "Free temporary lodging on the West LA VA campus for families of veterans receiving inpatient or extended outpatient care at the medical center. Operated by Fisher House Foundation in partnership with VA Greater Los Angeles Healthcare System.",
    website_url: "https://www.fisherhouse.org/",
    phone: "(310) 268-4571", address: "11301 Wilshire Boulevard, Building 209",
    city: "Los Angeles", zip: "90073",
    eligibility: "Families of veterans receiving care at West LA VAMC",
    source_name: "Fisher House Foundation", source_type: "nonprofit",
  },
  {
    section: "U", title: "American Red Cross Los Angeles Region - Hero Care Network",
    cat: "family-support", sub: "Military Family Support",
    desc: "Red Cross LA Region operates the Hero Care Network — 24/7 emergency communications between deployed service members and their families, plus emergency financial assistance referrals, deployment workshops, and reconnection programs.",
    website_url: "https://www.redcross.org/local/california/los-angeles.html",
    phone: "(310) 445-9900", address: "11355 Ohio Avenue",
    city: "Los Angeles", zip: "90025",
    eligibility: "Active-duty, National Guard, Reserve, veteran, and surviving families",
    source_name: "American Red Cross", source_type: "nonprofit",
  },
  // ===== V — Financial / Community =====
  {
    section: "V", title: "Operation HOPE - Los Angeles",
    cat: "financial", sub: "Budgeting & Financial Coaching",
    desc: "National nonprofit financial wellness platform with HOPE Inside locations across LA County. Free credit counseling, small business coaching, homeownership counseling, and disaster recovery — veterans and military families served at every site.",
    website_url: "https://operationhope.org/",
    phone: "(404) 941-2919", address: "200 South Los Robles Avenue, Suite 510",
    city: "Pasadena", zip: "91101",
    eligibility: "Adults and small business owners — free; veterans served as priority population",
    source_name: "Operation HOPE", source_type: "nonprofit",
  },
  {
    section: "V", title: "Volunteer Income Tax Assistance (VITA) - Los Angeles",
    cat: "financial", sub: "Tax Preparation",
    desc: "IRS VITA program operated locally by United Way of Greater Los Angeles and partners — free tax preparation for low-to-moderate income filers, with veteran-specific outreach during filing season. Sites across LA County including AJCCs, libraries, and partner nonprofits.",
    website_url: "https://www.unitedwayla.org/en/vita/",
    phone: "(213) 808-6220", address: "1150 South Olive Street, Suite T-500",
    city: "Los Angeles", zip: "90015",
    eligibility: "Households earning under ~$67,000/year, free service; veterans encouraged",
    source_name: "United Way of Greater Los Angeles / IRS VITA", source_type: "nonprofit",
  },
  {
    section: "V", title: "Honor Flight Southern California",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Regional Honor Flight hub flying SoCal World War II, Korean War, Vietnam, and terminally ill veterans — at no cost — to Washington D.C. to visit the memorials built in their honor. Pickup hubs across LA, OC, IE, and SD counties.",
    website_url: "https://honorflightsocal.org/",
    phone: "(800) 655-6997", address: "Los Angeles County (hub coverage)",
    city: "Los Angeles",
    eligibility: "WWII, Korea, Vietnam, and terminally ill SoCal veterans",
    source_name: "Honor Flight Southern California", source_type: "nonprofit",
  },
  // ===== W — Healthcare / Transportation / VSO Field Offices =====
  {
    section: "W", title: "VA East Los Angeles Clinic",
    cat: "healthcare", sub: "VA Clinics",
    desc: "VA Greater Los Angeles Healthcare System Community-Based Outpatient Clinic (CBOC) serving East LA, Boyle Heights, and surrounding neighborhoods. Primary care, mental health, women veterans care, and benefits navigation.",
    website_url: "https://www.va.gov/greater-los-angeles-health-care/locations/east-los-angeles-va-clinic/",
    phone: "(323) 725-7372", address: "5400 East Olympic Boulevard, Suite 150",
    city: "Commerce", zip: "90022",
    eligibility: "VA-eligible veterans",
    source_name: "VA.gov", source_type: "federal_government",
  },
  {
    section: "W", title: "VA San Gabriel Valley Clinic",
    cat: "healthcare", sub: "VA Clinics",
    desc: "VA Greater Los Angeles CBOC serving the San Gabriel Valley. Primary care, mental health, women veterans care, telehealth, and pharmacy services for veterans across the SGV corridor.",
    website_url: "https://www.va.gov/greater-los-angeles-health-care/locations/san-gabriel-valley-va-clinic/",
    phone: "(626) 289-5973", address: "420 West Las Tunas Drive",
    city: "San Gabriel", zip: "91776",
    eligibility: "VA-eligible veterans",
    source_name: "VA.gov", source_type: "federal_government",
  },
  {
    section: "W", title: "VA Antelope Valley Clinic (Lancaster)",
    cat: "healthcare", sub: "VA Clinics",
    desc: "VA Greater Los Angeles CBOC in Lancaster serving the Antelope Valley. Primary care, mental health, women veterans care, telehealth, audiology, and pharmacy services. Distinct from the Antelope Valley Vet Center (readjustment counseling).",
    website_url: "https://www.va.gov/greater-los-angeles-health-care/locations/antelope-valley-va-clinic/",
    phone: "(661) 729-8655", address: "547 West Lancaster Boulevard",
    city: "Lancaster", zip: "93534",
    eligibility: "VA-eligible veterans",
    source_name: "VA.gov", source_type: "federal_government",
  },
  {
    section: "W", title: "VA Whittier Behavioral Health Clinic",
    cat: "mental-health", sub: "Inpatient / Outpatient Treatment",
    desc: "VA Greater Los Angeles behavioral health CBOC in Whittier. Outpatient mental health treatment — therapy, psychiatry, PTSD, substance use disorder, women veterans mental health, and telemental health.",
    website_url: "https://www.va.gov/greater-los-angeles-health-care/locations/whittier-va-clinic/",
    phone: "(562) 564-6900", address: "10210 Orr & Day Road",
    city: "Santa Fe Springs", zip: "90670",
    eligibility: "VA-eligible veterans",
    source_name: "VA.gov", source_type: "federal_government",
  },
  {
    section: "W", title: "Access Services - LA County Paratransit",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "LA County's federally mandated ADA complementary paratransit service — shared-ride curb-to-curb transportation for people unable to use fixed-route bus/rail due to disability. Disabled veterans qualify; certification through Access. Service area covers most of LA County.",
    website_url: "https://accessla.org/",
    phone: "(800) 827-0829", address: "PO Box 71684",
    city: "Los Angeles", zip: "90071",
    eligibility: "ADA-eligible LA County residents (includes disabled veterans)",
    source_name: "Access Services", source_type: "regional_government",
  },
  {
    section: "W", title: "DAV Transportation Network - West LA VAMC",
    cat: "transportation", sub: "Veteran Transportation Programs",
    desc: "Disabled American Veterans volunteer-driven transportation program — free van rides for veterans to and from West Los Angeles VA Medical Center for medical appointments. Coordinated by the DAV hospital service coordinator at WLA VAMC.",
    website_url: "https://www.dav.org/veterans/i-need-a-ride/",
    phone: "(310) 268-4933", address: "11301 Wilshire Boulevard, Building 220",
    city: "Los Angeles", zip: "90073",
    eligibility: "VA-eligible veterans needing transportation to WLA VAMC",
    source_name: "Disabled American Veterans", source_type: "nonprofit",
  },
  {
    section: "W", title: "Long Beach Veterans Affairs Office (City of Long Beach)",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "City of Long Beach Veterans Affairs program — connects Long Beach veterans to VA benefits, county services, housing resources, and city programs. Liaison to the LA County DMVA and Tibor Rubin VAMC. Hosted within Long Beach Health & Human Services.",
    website_url: "https://longbeach.gov/health/healthy-living/community/veterans/",
    phone: "(562) 570-4000", address: "2525 Grand Avenue",
    city: "Long Beach", zip: "90815",
    eligibility: "Long Beach veterans and dependents",
    source_name: "City of Long Beach Health & Human Services", source_type: "city_government",
  },
  {
    section: "W", title: "1736 Family Crisis Center",
    cat: "crisis-help", sub: "Domestic Violence / Safety",
    desc: "LA County DV crisis services nonprofit — operates 24-hour hotline, emergency shelters across the South Bay and Long Beach, transitional housing, and counseling. Serves veteran survivors of intimate-partner violence and their children.",
    website_url: "https://1736fcc.org/",
    phone: "(213) 745-6434", address: "PO Box 5117",
    city: "Hermosa Beach", zip: "90254",
    eligibility: "Survivors of domestic violence including veterans and military families",
    source_name: "1736 Family Crisis Center", source_type: "nonprofit",
  },
];

runSeed(ROWS, {
  state: "CA",
  commit: COMMIT,
  scriptName: "seed-ca-phase2",
  sectionLabels: {
    R: "Homeless Vet Infra",
    S: "Mental Health/SUD",
    T: "Legal/Employment",
    U: "Family Support",
    V: "Financial/Community",
    W: "Healthcare/Transit/VSO",
  },
});
