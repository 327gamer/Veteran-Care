/**
 * MASSACHUSETTS — WAVE 2 (Golden Standard county/regional backbone, ~118 rows)
 *
 * Mirrors scripts/seed-va-wave2.ts gold-standard layout. Builds the state +
 * county + regional backbone on top of MA Wave 1 (139 rows / sections A-M).
 *
 * Founder release 2026-05-02: "Build the STATE + COUNTY + REGIONAL BACKBONE.
 * STOP after Wave 2 — wait for founder approval."
 *
 * MA-specific adaptations vs. VA pattern:
 *   - MA county governments largely abolished (1997-2000); county backbone is
 *     Veteran Treatment Courts + County Sheriff veteran programs (Section F).
 *   - "Community Services Boards (CSBs)" → MA equivalent is "Community
 *     Behavioral Health Centers (CBHCs)" — 26 statewide under MA EOHHS
 *     Roadmap for Behavioral Health Reform (Jan 2023). Top 14 in Section C.
 *   - "Virginia Career Works" → MA equivalent is "MassHire Career Centers"
 *     — 16 LWDAs statewide, all in Section E.
 *
 * Sections:
 *   A  Additional MA state agencies (MassHealth, MRC, MCB, MOD, EOEA, DMH...)
 *   B  Additional VA infrastructure (VISN 1, telehealth, women's, caregiver)
 *   C  MA Community Behavioral Health Centers (HIGH PRIORITY mental health)
 *   D  HUD-VASH / SSVF / Transitional Housing providers (CRITICAL GAP)
 *   E  MassHire Career Centers — all 16 LWDAs (NEW EMPLOYMENT category)
 *   F  Veteran Treatment Courts + County Sheriff veteran programs
 *   G  FQHCs / Community Health Centers serving MA veterans
 *   H  Specialty crisis / first-responder mental health programs
 *   I  National VSOs with verified MA presence
 *   J  Substance Recovery / Addiction Treatment
 *   K  Specialty veteran populations (women, LGBTQ, transitioning)
 *   L  Additional regional veteran nonprofits (Berkshires/Cape/depth)
 *   M  Apprenticeships / Veteran-friendly employers
 *
 * Run:
 *   npx tsx scripts/seed-ma-wave2.ts                                # dry-run
 *   npx tsx scripts/seed-ma-wave2.ts --commit --allow-broken-urls   # write
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");
const ALLOW_ZIP_BLEED = process.argv.includes("--allow-zip-bleed");

const ROWS: SeedRow[] = [
  // ===========================================================================
  // A. Additional MA state agencies
  // ===========================================================================
  { section: "A", title: "MassHealth (Massachusetts Medicaid)",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "MA's Medicaid + CHIP program (under EOHHS). Coverage for low-income MA veterans not enrolled in VA healthcare or as wraparound to VA enrollment; expanded to 138% FPL. Apply via MA Health Connector or any local Community Health Center.",
    website_url: "https://www.mass.gov/masshealth", phone: "800-841-2900",
    address: "1 Ashburton Place", city: "Boston", zip: "02108",
    source_name: "MA Executive Office of Health and Human Services" },

  { section: "A", title: "Massachusetts Department of Public Health (DPH) Veteran Health Initiatives",
    cat: "healthcare", sub: "Specialty Care",
    desc: "MA DPH coordinates statewide public-health services that frequently support MA veterans: free WIC, immunizations, sexual-health, nutrition, suicide prevention, substance use, and chronic-disease management. Veterans without VA enrollment can use DPH district offices for low/no-cost preventive care.",
    website_url: "https://www.mass.gov/orgs/department-of-public-health", phone: "617-624-6000",
    address: "250 Washington St", city: "Boston", zip: "02108",
    source_name: "MA DPH" },

  { section: "A", title: "Massachusetts Rehabilitation Commission (MRC)",
    cat: "disabled-veterans", sub: "Employment & Vocational Rehabilitation",
    desc: "MA state agency operating Vocational Rehabilitation, Community Living, and Disability Determination programs. Coordinates with VA Vocational Rehabilitation & Employment (Chapter 31) for MA veterans with service-connected disabilities; also offers independent-living services and statewide assistive technology.",
    website_url: "https://www.mass.gov/orgs/massachusetts-rehabilitation-commission", phone: "617-204-3600",
    address: "600 Washington St", city: "Boston", zip: "02111",
    source_name: "MA Rehabilitation Commission" },

  { section: "A", title: "Massachusetts Commission for the Blind (MCB)",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "MA state agency providing rehabilitation, social, training, and employment services to MA residents (including blinded veterans) who are legally blind. Orientation & Mobility, Vocational Rehab, Children's Services, and statewide low-vision aids.",
    website_url: "https://www.mass.gov/orgs/massachusetts-commission-for-the-blind", phone: "800-392-6450",
    address: "600 Washington St", city: "Boston", zip: "02111",
    source_name: "MA Commission for the Blind" },

  { section: "A", title: "Massachusetts Commission for the Deaf and Hard of Hearing (MCDHH)",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "MA state agency providing case management, communication-access services (interpreters/CART), assistive-tech, and advocacy for Deaf, Hard of Hearing, and DeafBlind MA residents — including hearing-loss-affected veterans transitioning to civilian life.",
    website_url: "https://www.mass.gov/orgs/massachusetts-commission-for-the-deaf-and-hard-of-hearing", phone: "617-740-1600",
    address: "600 Washington St", city: "Boston", zip: "02111",
    source_name: "MA Commission for the Deaf and Hard of Hearing" },

  { section: "A", title: "Massachusetts Office on Disability (MOD)",
    cat: "disabled-veterans", sub: "Legal Advocacy & Rights",
    desc: "MA state ADA/504/Chapter 93 enforcement and advocacy office. Information & referral, ADA technical assistance, architectural-access enforcement, employment-discrimination intake — covering MA disabled veterans navigating reasonable-accommodation disputes in housing, employment, and public accommodations.",
    website_url: "https://www.mass.gov/orgs/massachusetts-office-on-disability", phone: "617-727-7440",
    address: "1 Ashburton Place, Room 1305", city: "Boston", zip: "02108",
    source_name: "MA Office on Disability" },

  { section: "A", title: "Massachusetts Executive Office of Elder Affairs (EOEA)",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "MA cabinet-level agency coordinating services for ~1.6M older MA residents (including ~250,000 MA veterans aged 65+). Funds 25 Aging Services Access Points (ASAPs), Councils on Aging in every MA city/town, and Older Americans Act programs (SHINE, Meals on Wheels, family-caregiver support).",
    website_url: "https://www.mass.gov/orgs/executive-office-of-elder-affairs", phone: "617-727-7750",
    address: "1 Ashburton Place, 5th Floor", city: "Boston", zip: "02108",
    source_name: "MA Executive Office of Elder Affairs" },

  { section: "A", title: "Massachusetts Department of Mental Health (DMH)",
    cat: "mental-health", sub: "Inpatient / Outpatient Treatment",
    desc: "MA state mental-health authority operating 4 state hospitals + 6 area offices providing forensic, adult, child, and adolescent services to MA residents with serious mental illness — including MA veterans without VA mental-health access. Coordinates with all 26 MA Community Behavioral Health Centers (CBHCs).",
    website_url: "https://www.mass.gov/orgs/massachusetts-department-of-mental-health", phone: "800-221-0053",
    address: "25 Staniford St", city: "Boston", zip: "02114",
    source_name: "MA Department of Mental Health" },

  // ===========================================================================
  // B. Additional VA infrastructure (regional + specialty programs)
  // ===========================================================================
  { section: "B", title: "VA New England Healthcare System (VISN 1)",
    cat: "healthcare", sub: "VA Medical Centers",
    desc: "Veterans Integrated Service Network 1 — VHA regional headquarters covering all 6 New England states. Coordinates clinical resource sharing across MA's 4 VAMCs (Bedford, VA Boston HCS — Jamaica Plain/West Roxbury/Brockton, Northampton/Leeds), CBOCs, women's health, residential mental-health, and Community Care for ~225,000 MA veterans enrolled.",
    website_url: "https://www.va.gov/v01/", phone: "781-687-2000",
    address: "200 Springs Rd", city: "Bedford", zip: "01730",
    source_name: "U.S. Department of Veterans Affairs — VISN 1" },

  { section: "B", title: "VA Telehealth Services Massachusetts (VA Connected Care)",
    cat: "healthcare", sub: "Telehealth",
    desc: "VA New England Connected Care telehealth program — primary care, mental health, specialty consults, and home-based monitoring delivered via VA Video Connect from any MA location. Supports rural MA veterans (Berkshires, Cape & Islands, Pioneer Valley) reducing windshield time to Bedford / VA Boston / Northampton VAMCs.",
    website_url: "https://www.va.gov/boston-health-care/programs/telehealth-services/", phone: "857-364-4000",
    address: "150 South Huntington Ave", city: "Jamaica Plain", zip: "02130",
    source_name: "VA Boston Healthcare System" },

  { section: "B", title: "VA Women Veterans Program Massachusetts",
    cat: "healthcare", sub: "Women Veterans Healthcare",
    desc: "VA New England Women Veterans Program — comprehensive primary care, gynecology, maternity care coordination, breast imaging, military sexual trauma (MST) treatment, mental health, and womenʼs health navigation across MAʼs 4 VAMCs and CBOCs. Each MA VA facility has a Women Veterans Program Manager.",
    website_url: "https://www.womenshealth.va.gov/", phone: "857-364-5800",
    address: "150 South Huntington Ave", city: "Jamaica Plain", zip: "02130",
    source_name: "VA Boston HCS — Women Veterans Program" },

  { section: "B", title: "VA Caregiver Support Program Massachusetts",
    cat: "family-support", sub: "Caregiver Support",
    desc: "VA Caregiver Support Program for MA veteran families. Two tracks: (1) PCAFC stipend program for post-9/11 + pre-9/11 catastrophically disabled veteran caregivers; (2) PGCSS general support — coaching, respite, peer mentoring, skills training. Each MA VAMC has a Caregiver Support Coordinator.",
    website_url: "https://www.caregiver.va.gov/", phone: "855-260-3274",
    address: "200 Springs Rd", city: "Bedford", zip: "01730",
    source_name: "VA Caregiver Support Program" },

  { section: "B", title: "VA Geriatrics and Extended Care Massachusetts",
    cat: "healthcare", sub: "Specialty Care",
    desc: "VA New England Geriatrics & Extended Care — Home Based Primary Care (HBPC), Adult Day Healthcare, GeriPACT, palliative & hospice, Community Living Centers (nursing homes) at Bedford + Brockton + Northampton VAMCs. Serves frail older MA veterans aging-in-place + supports family caregivers.",
    website_url: "https://www.va.gov/geriatrics/", phone: "857-364-4000",
    address: "1400 VFW Pkwy", city: "West Roxbury", zip: "02132",
    source_name: "VA Boston HCS — Geriatrics & Extended Care" },

  // ===========================================================================
  // C. MA Community Behavioral Health Centers (CBHCs) — HIGH PRIORITY
  // (MA equivalent of Virginia's Community Services Boards. 26 statewide
  // under EOHHS Roadmap for Behavioral Health Reform, launched Jan 2023.
  // 24/7 mobile crisis + same-day urgent + outpatient under one roof.)
  // ===========================================================================
  { section: "C", title: "Bay Cove Human Services Community Behavioral Health Center",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "CBHC serving downtown Boston, North End, Beacon Hill, and Charlestown. 24/7 community crisis intervention, mobile crisis teams, same-day urgent counseling, outpatient therapy, medication management, and warm handoff to Bay Cove substance-recovery + housing programs. Veteran-aware staff coordinate with VA Boston.",
    website_url: "https://www.baycove.org/", phone: "800-981-4357",
    address: "66 Canal St", city: "Boston", zip: "02114",
    source_name: "Bay Cove Human Services" },

  { section: "C", title: "Vinfen Community Behavioral Health Center",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "CBHC serving Cambridge, Somerville, Arlington, and inner-Belmont. Outpatient therapy, mobile crisis (24/7), medication-assisted treatment, peer support, and supportive housing referrals. Strong coordination with Cambridge Health Alliance + VA Boston for veteran clients.",
    website_url: "https://www.vinfen.org/", phone: "877-382-1609",
    address: "950 Cambridge St", city: "Cambridge", zip: "02141",
    source_name: "Vinfen Corporation" },

  { section: "C", title: "Eliot Community Human Services Behavioral Health Center",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "CBHC serving Lexington, Lincoln, Bedford, Burlington, Concord, and surrounding MetroWest towns. 24/7 mobile crisis intervention, outpatient therapy, MAT, and Bedford VAMC partnership for veteran behavioral health referrals.",
    website_url: "https://www.eliotchs.org/", phone: "800-988-1111",
    address: "125 Hartwell Ave", city: "Lexington", zip: "02421",
    source_name: "Eliot Community Human Services" },

  { section: "C", title: "Edinburg Center Behavioral Health",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Bedford-headquartered CBHC partner serving Middlesex/Suffolk veterans + civilians. Outpatient therapy, dual-diagnosis treatment, supported employment, residential rehabilitation, and direct co-location with Bedford VAMC referral pipeline.",
    website_url: "https://edinburgcenter.org/", phone: "781-863-1388",
    address: "10 Maguire Rd", city: "Lexington", zip: "02421",
    source_name: "The Edinburg Center" },

  { section: "C", title: "Riverside Community Care Behavioral Health Center",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "CBHC serving Norfolk County (Dedham, Needham, Newton, Brookline, Wellesley, Westwood). 24/7 mobile crisis, outpatient therapy, child/adolescent + adult tracks, MAT, school-based services, and Norfolk District veterans coordination.",
    website_url: "https://www.riversidecc.org/", phone: "800-529-5077",
    address: "270 Bridge St, Suite 301", city: "Dedham", zip: "02026",
    source_name: "Riverside Community Care" },

  { section: "C", title: "Open Sky Community Services Behavioral Health Center",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "CBHC serving Worcester County (Worcester, Leominster, Fitchburg, Marlborough, Webster). Outpatient therapy, 24/7 mobile crisis, peer support, autism services, and dual-diagnosis treatment. Co-locates with Veterans Inc. and Worcester VTC for warm-handoff veteran referrals.",
    website_url: "https://www.openskycs.org/", phone: "800-449-0207",
    address: "4 Mann St", city: "Worcester", zip: "01602",
    source_name: "Open Sky Community Services" },

  { section: "C", title: "Community HealthLink Behavioral Health Center",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "UMass Memorial-affiliated CBHC serving Worcester County. 24/7 mobile crisis, Crisis Stabilization Unit, outpatient therapy, MAT, dual-diagnosis treatment, and Veterans Inc. co-location for SSVF/HUD-VASH veteran referrals.",
    website_url: "https://www.communityhealthlink.org/", phone: "508-860-1000",
    address: "12 Queen St", city: "Worcester", zip: "01610",
    source_name: "Community HealthLink (UMass Memorial)" },

  { section: "C", title: "Behavioral Health Network (BHN) Community Behavioral Health Center",
    cat: "mental-health", sub: "Crisis Support",
    desc: "CBHC serving Hampden County (Springfield, Holyoke, Chicopee, Westfield, Agawam). 24/7 Crisis Hotline, mobile crisis teams, outpatient therapy, MAT, dual-diagnosis residential, and Soldier On + Northampton VAMC veteran care coordination.",
    website_url: "https://www.bhninc.org/", phone: "800-437-5922",
    address: "417 Liberty St", city: "Springfield", zip: "01104",
    source_name: "Behavioral Health Network" },

  { section: "C", title: "Clinical and Support Options (CSO) Behavioral Health Center",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "CBHC serving Pioneer Valley (Northampton, Greenfield, Athol, Orange, Amherst). Outpatient therapy, 24/7 mobile crisis, MAT, school-based services, and partnership with Northampton VAMC + ServiceNet for veteran behavioral-health continuity of care.",
    website_url: "https://www.csoinc.org/", phone: "844-279-7444",
    address: "8 Atwood Dr", city: "Northampton", zip: "01060",
    source_name: "Clinical and Support Options" },

  { section: "C", title: "The Brien Center Behavioral Health Services",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Berkshire County's primary CBHC serving Pittsfield, North Adams, Great Barrington, and Williamstown. 24/7 mobile crisis, outpatient therapy, MAT, child + adult tracks, and dual-diagnosis treatment. Partners with Soldier On Pittsfield + Berkshire Medical Center for rural veteran behavioral-health access.",
    website_url: "https://www.briencenter.org/", phone: "413-499-0412",
    address: "333 East St", city: "Pittsfield", zip: "01201",
    source_name: "The Brien Center" },

  { section: "C", title: "Bridgewell Behavioral Health Services",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "North Shore CBHC partner serving Lynn, Salem, Peabody, Beverly, Marblehead. Outpatient therapy, day-treatment programs, residential services for serious mental illness, supported employment, and Lynn Community Health Center co-location for veteran integrated care.",
    website_url: "https://www.bridgewell.org/", phone: "978-774-0211",
    address: "471 Broadway", city: "Lynnfield", zip: "01940",
    source_name: "Bridgewell" },

  { section: "C", title: "Aspire Health Alliance Community Behavioral Health Center",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "South Shore CBHC serving Quincy, Weymouth, Braintree, Hingham, Hull. 24/7 mobile crisis, outpatient therapy, MAT, child + adult + older-adult tracks, and South Shore Veterans Treatment Court warm-handoff partnership.",
    website_url: "https://www.aspirehealthalliance.org/", phone: "617-847-1900",
    address: "460 Quincy Ave", city: "Quincy", zip: "02169",
    source_name: "Aspire Health Alliance" },

  { section: "C", title: "High Point Treatment Center Behavioral Health Center",
    cat: "mental-health", sub: "Substance Abuse Treatment",
    desc: "Brockton-headquartered CBHC + addiction-treatment specialist serving Plymouth + Bristol counties (Brockton, Plymouth, New Bedford, Fall River). Detox, Crisis Stabilization Unit, outpatient mental health, MAT, and dual-diagnosis residential. Strong veteran patient base via Brockton VAMC referrals.",
    website_url: "https://www.hptc.org/", phone: "508-742-4400",
    address: "30 Meadowbrook Rd", city: "Brockton", zip: "02301",
    source_name: "High Point Treatment Center" },

  { section: "C", title: "Gosnold Behavioral Health Center Cape Cod",
    cat: "mental-health", sub: "Substance Abuse Treatment",
    desc: "Cape Cod's primary CBHC + addiction-treatment provider serving Barnstable, Dukes, and Nantucket counties. Detox, MAT, outpatient mental health + addiction, sober homes, and Cape Cod Vet Center / Hyannis CBOC co-location for cohesive Cape & Islands veteran care.",
    website_url: "https://www.gosnold.org/", phone: "800-444-1554",
    address: "200 Ter Heun Dr", city: "Falmouth", zip: "02540",
    source_name: "Gosnold Inc." },

  // ===========================================================================
  // D. HUD-VASH / SSVF / Transitional Housing — CRITICAL GAP from W1
  // ===========================================================================
  { section: "D", title: "Pine Street Inn",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "Greater Boston's largest shelter + supportive-housing provider — 700 emergency beds nightly, 1,000+ permanent supportive housing units, street-outreach van, and a workforce-development program. ~12% of Pine Street guests are veterans; warm handoffs to NECHV, VA Boston HCS, and SSVF providers.",
    website_url: "https://www.pinestreetinn.org/", phone: "617-892-9100",
    address: "444 Harrison Ave", city: "Boston", zip: "02118",
    source_name: "Pine Street Inn" },

  { section: "D", title: "Father Bill's and MainSpring",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "South Shore + Brockton-area homeless-services provider operating 4 emergency shelters (Quincy, Brockton), 280+ supportive-housing units, SSVF, and the South Shore Workforce Connection job program. Plymouth + Norfolk County veteran clients are referred from Brockton VAMC and South Shore VTC.",
    website_url: "https://helpfbms.org/", phone: "617-770-3314",
    address: "38 Broad St", city: "Quincy", zip: "02169",
    source_name: "Father Bill's & MainSpring" },

  { section: "D", title: "Volunteers of America Massachusetts SSVF Program",
    cat: "housing", sub: "Transitional Housing",
    desc: "VA-funded Supportive Services for Veteran Families (SSVF) program. Rapid-rehousing rental assistance, security-deposit help, utility-arrears aid, case management for low-income MA veteran families at risk of (or experiencing) homelessness. Statewide eligibility; intake via 617-522-8086.",
    website_url: "https://www.voama.org/", phone: "617-522-8086",
    address: "441 Centre St", city: "Jamaica Plain", zip: "02130",
    source_name: "Volunteers of America Massachusetts" },

  { section: "D", title: "ServiceNet Veteran Services and Housing",
    cat: "housing", sub: "Transitional Housing",
    desc: "Pioneer Valley's largest behavioral-health + housing nonprofit, operating SSVF + transitional veteran housing across Hampshire/Hampden/Franklin counties. Direct partnership with Northampton VAMC's mental-health residential programs; sober-living, dual-diagnosis-friendly veteran beds.",
    website_url: "https://www.servicenet.org/", phone: "413-585-1300",
    address: "129 King St", city: "Northampton", zip: "01060",
    source_name: "ServiceNet Inc." },

  { section: "D", title: "Heading Home Inc.",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "Greater Boston's largest provider of emergency + transitional housing for homeless families with children. ~1,500 individuals housed annually; veteran families referred via Mass 211 and VA Boston HCS social-work staff for emergency rehousing + intensive case management.",
    website_url: "https://www.headinghomeinc.org/", phone: "617-864-8140",
    address: "529 Main St, Suite P-200", city: "Charlestown", zip: "02129",
    source_name: "Heading Home Inc." },

  { section: "D", title: "South Middlesex Opportunity Council Veteran Services",
    cat: "housing", sub: "Transitional Housing",
    desc: "MetroWest community-action agency serving Framingham, Marlborough, Natick, Hudson. SSVF rapid-rehousing for MetroWest veterans, fuel-assistance, food pantry, mental-health counseling. SSVF intake at SMOCʼs Framingham HQ.",
    website_url: "https://www.smoc.org/", phone: "508-620-2335",
    address: "7 Bishop St", city: "Framingham", zip: "01702",
    source_name: "South Middlesex Opportunity Council" },

  { section: "D", title: "Action for Boston Community Development Veteran Programs",
    cat: "housing", sub: "Rental Assistance",
    desc: "ABCD — Boston's largest community-action agency. Operates fuel-assistance (LIHEAP), housing-stabilization, financial-coaching, and SNAP outreach across Greater Boston. Veterans access ABCD via 24 neighborhood service centers; coordinates with VA Boston HCS social work for emergency housing prevention.",
    website_url: "https://www.bostonabcd.org/", phone: "617-348-6000",
    address: "178 Tremont St", city: "Boston", zip: "02111",
    source_name: "Action for Boston Community Development" },

  { section: "D", title: "Catholic Charities Archdiocese of Boston Veteran Programs",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "Catholic Charities Boston operates emergency-shelter beds, transitional housing, food pantries, refugee resettlement, and family-stability programs across eastern MA (144 cities/towns). Veteran families accepted same-day at Yawkey Center + Laboure Center; referrals from VA Boston HCS welcome.",
    website_url: "https://www.ccab.org/", phone: "617-482-5440",
    address: "51 Sleeper St, 4th Floor", city: "Boston", zip: "02210",
    source_name: "Catholic Charities Boston" },

  { section: "D", title: "Boston Housing Authority HUD-VASH Program",
    cat: "housing", sub: "Rental Assistance",
    desc: "BHA administers ~1,000 HUD-VASH vouchers — Section 8 rental assistance combined with VA Boston HCS clinical case-management — for chronically homeless Boston-area veterans. Voucher referrals come exclusively through VA Boston HCS HUD-VASH coordinators; not a walk-in program.",
    website_url: "https://www.bostonhousing.org/", phone: "617-988-4000",
    address: "52 Chauncy St", city: "Boston", zip: "02111",
    source_name: "Boston Housing Authority" },

  { section: "D", title: "Cambridge Housing Authority HUD-VASH Program",
    cat: "housing", sub: "Rental Assistance",
    desc: "CHA administers HUD-VASH vouchers for chronically homeless veterans residing in Cambridge + surrounding Middlesex communities. Vouchers paired with VA Boston HCS clinical case management. Referrals through VA HUD-VASH team only.",
    website_url: "https://www.cambridge-housing.org/", phone: "617-864-3020",
    address: "362 Green St", city: "Cambridge", zip: "02139",
    source_name: "Cambridge Housing Authority" },

  { section: "D", title: "Worcester Housing Authority HUD-VASH Program",
    cat: "housing", sub: "Rental Assistance",
    desc: "WHA administers HUD-VASH vouchers for chronically homeless veterans in Worcester County. Vouchers paired with VA-affiliated case management at Worcester CBOC + Veterans Inc. Referrals coordinated through VA Boston HCS HUD-VASH team.",
    website_url: "https://www.worcesterha.org/", phone: "508-635-3000",
    address: "40 Belmont St", city: "Worcester", zip: "01605",
    source_name: "Worcester Housing Authority" },

  { section: "D", title: "Springfield Housing Authority HUD-VASH Program",
    cat: "housing", sub: "Rental Assistance",
    desc: "SHA administers HUD-VASH vouchers for chronically homeless veterans in Hampden County. Vouchers paired with Northampton VAMC clinical case management; coordinates with Soldier On Pittsfield/Leeds for transitional-to-permanent veteran housing pipeline.",
    website_url: "https://www.springfieldhousingauthority.org/", phone: "413-785-4500",
    address: "60 Congress St", city: "Springfield", zip: "01104",
    source_name: "Springfield Housing Authority" },

  { section: "D", title: "Lynn Housing Authority and Neighborhood Development HUD-VASH",
    cat: "housing", sub: "Rental Assistance",
    desc: "LHAND administers HUD-VASH vouchers for chronically homeless veterans in Lynn + surrounding North Shore communities. Vouchers paired with Bedford VAMC clinical case management; coordinates with Lynn Community Health Center for veteran primary-care access.",
    website_url: "https://www.lhand.org/", phone: "781-581-8600",
    address: "10 Church St", city: "Lynn", zip: "01902",
    source_name: "Lynn Housing Authority and Neighborhood Development" },

  { section: "D", title: "Lowell Housing Authority HUD-VASH Program",
    cat: "housing", sub: "Rental Assistance",
    desc: "Lowell HA administers HUD-VASH vouchers for chronically homeless veterans in Greater Lowell + Merrimack Valley. Vouchers paired with Bedford VAMC + Lowell CBOC clinical case management. Referrals through VA HUD-VASH team only.",
    website_url: "https://www.lhma.org/", phone: "978-364-5300",
    address: "350 Moody St", city: "Lowell", zip: "01854",
    source_name: "Lowell Housing Authority" },

  { section: "D", title: "Salvation Army Massachusetts Veteran Services",
    cat: "housing", sub: "Emergency Housing / Homeless Shelters",
    desc: "Salvation Army Massachusetts Division operates 28 corps community centers + 4 emergency shelters statewide. Veteran-eligible programs: emergency shelter (overnight), utility/rent crisis aid, food pantry, holiday adoption, and Pathway of Hope intensive case management.",
    website_url: "https://easternusa.salvationarmy.org/massachusetts/", phone: "617-542-5420",
    address: "25 Shawmut Rd", city: "Canton", zip: "02021",
    source_name: "The Salvation Army — Massachusetts Division" },

  { section: "D", title: "Massachusetts Coalition for the Homeless",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "MA's leading homeless-advocacy + direct-service nonprofit. Operates Furniture Bank (free furniture for veteran families exiting homelessness), A Place to Call Home program (rental subsidies), and statewide emergency-assistance navigation. Lynn-headquartered.",
    website_url: "https://www.mahomeless.org/", phone: "781-595-7570",
    address: "73 Buffum St", city: "Lynn", zip: "01902",
    source_name: "Massachusetts Coalition for the Homeless" },

  // ===========================================================================
  // E. MassHire Career Centers — all 16 LWDAs (NEW EMPLOYMENT category)
  // ===========================================================================
  { section: "E", title: "MassHire Berkshire Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire Berkshire — Pittsfield-based one-stop serving rural Berkshire County. DVOP/LVER veteran specialists offer priority of service, resume help, job-search workshops, and on-the-job training placements. Served by VA Pittsfield CBOC + Soldier On for warm handoffs.",
    website_url: "https://www.berkshireworks.org/", phone: "413-499-2220",
    address: "160 North St", city: "Pittsfield", zip: "01201",
    source_name: "MassHire Berkshire Career Center" },

  { section: "E", title: "MassHire Boston Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire Boston — Roxbury-based one-stop serving Boston, Brookline, and inner-Suffolk. DVOP/LVER veteran specialists serve transitioning service members from Hanscom AFB / Coast Guard Boston with priority of service, OJT, and apprenticeship placements.",
    website_url: "https://www.masshireboston.org/", phone: "617-541-1400",
    address: "1010 Harrison Ave", city: "Roxbury", zip: "02119",
    source_name: "MassHire Boston Career Center" },

  { section: "E", title: "MassHire Bristol Workforce Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire Bristol — Fall River + New Bedford one-stops serving Bristol County. DVOP/LVER veteran specialists support southeast MA veterans transitioning from defense-shipbuilding (Bath/Battleship Cove) to commercial-marine, healthcare, and offshore-wind careers.",
    website_url: "https://masshirebristolwb.org/", phone: "508-730-5000",
    address: "446 N Main St", city: "Fall River", zip: "02720",
    source_name: "MassHire Bristol Career Center" },

  { section: "E", title: "MassHire Greater Brockton Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire Greater Brockton — Brockton one-stop serving Plymouth + Norfolk southern county veterans. DVOP/LVER veteran specialists with strong Brockton VAMC referral pipeline; healthcare + manufacturing + retail OJT pathways.",
    website_url: "https://masshiregbcc.com/", phone: "508-513-3400",
    address: "34 School St", city: "Brockton", zip: "02301",
    source_name: "MassHire Greater Brockton Career Center" },

  { section: "E", title: "MassHire Cape and Islands Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire Cape & Islands — Hyannis one-stop serving Barnstable, Dukes, Nantucket counties. DVOP/LVER veteran specialists support Joint Base Cape Cod / Coast Guard Air Station Cape Cod transitioning service members; hospitality + maritime + healthcare placements.",
    website_url: "https://www.masshirecapeandislands.org/", phone: "508-771-5627",
    address: "372 North St", city: "Hyannis", zip: "02601",
    source_name: "MassHire Cape and Islands Career Center" },

  { section: "E", title: "MassHire Central Region Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire Central Region — Worcester + Southbridge one-stops serving central MA. DVOP/LVER veteran specialists; biotech, healthcare, advanced-manufacturing OJT pathways; partners with Veterans Inc., UMass Memorial, and Worcester State University Veteran Services.",
    website_url: "https://masshirecentralcc.com/", phone: "508-799-1600",
    address: "340 Main St, Suite 100", city: "Worcester", zip: "01608",
    source_name: "MassHire Central Region Career Center" },

  { section: "E", title: "MassHire Franklin Hampshire Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire Franklin Hampshire — Greenfield + Northampton one-stops serving rural NW Massachusetts. DVOP/LVER veteran specialists; agriculture, healthcare, education + advanced-manufacturing pathways; partners with Northampton VAMC + Greenfield CBOC.",
    website_url: "https://www.masshirefhcareers.org/", phone: "413-774-4361",
    address: "1 Arch Place", city: "Greenfield", zip: "01301",
    source_name: "MassHire Franklin Hampshire Career Center" },

  { section: "E", title: "MassHire Greater Lowell Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire Greater Lowell — Lowell one-stop serving Greater Lowell + Merrimack Valley. DVOP/LVER veteran specialists; biotech, healthcare, advanced-manufacturing OJT pathways; partners with Lowell CBOC + Bedford VAMC for veteran job-coaching warm-handoffs.",
    website_url: "https://www.masshiregreaterlowell.com/", phone: "978-805-4810",
    address: "107 Merrimack St", city: "Lowell", zip: "01852",
    source_name: "MassHire Greater Lowell Career Center" },

  { section: "E", title: "MassHire Greater New Bedford Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire Greater New Bedford — New Bedford one-stop serving SouthCoast MA. DVOP/LVER veteran specialists; commercial fishing, offshore-wind (Vineyard Wind), healthcare, manufacturing pathways; partners with Greater New Bedford Community Health Center + Hyannis CBOC.",
    website_url: "https://masshiregreaternewbedford.com/", phone: "508-979-1768",
    address: "618 Acushnet Ave", city: "New Bedford", zip: "02740",
    source_name: "MassHire Greater New Bedford Career Center" },

  { section: "E", title: "MassHire Hampden County Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire Hampden — Springfield + Holyoke one-stops serving Hampden County. DVOP/LVER veteran specialists; healthcare, advanced-manufacturing, education, and trucking pathways; partners with Northampton VAMC + Westover ARB transition assistance + Soldier On.",
    website_url: "https://www.masshirehampden.com/", phone: "413-858-2800",
    address: "1145 Main St", city: "Springfield", zip: "01103",
    source_name: "MassHire Hampden County Career Center" },

  { section: "E", title: "MassHire Merrimack Valley Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire Merrimack Valley — Lawrence + Haverhill one-stops serving northern Essex County. DVOP/LVER veteran specialists; manufacturing, healthcare, distribution, and bilingual (Spanish) job-coaching for Merrimack Valley veterans; partners with Veterans Northeast Outreach Center.",
    website_url: "https://www.masshiremv.org/", phone: "978-722-7000",
    address: "360 Merrimack St", city: "Lawrence", zip: "01843",
    source_name: "MassHire Merrimack Valley Career Center" },

  { section: "E", title: "MassHire Metro North Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire Metro North — Cambridge + Woburn + Chelsea one-stops serving Middlesex + northern Suffolk veterans. DVOP/LVER veteran specialists; biotech (Kendall Sq), healthcare, IT, and life-sciences pathways; transitioning service-member focus from Hanscom AFB.",
    website_url: "https://www.masshiremetronorth.org/", phone: "781-322-0399",
    address: "186 Alewife Brook Pkwy, Suite 310", city: "Cambridge", zip: "02138",
    source_name: "MassHire Metro North Career Center" },

  { section: "E", title: "MassHire Metro South West Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire Metro South/West — Framingham + Norwood one-stops serving MetroWest + Norfolk veterans. DVOP/LVER veteran specialists; biotech, financial services, healthcare, defense-contractor (MITRE / Raytheon) pathways for transitioning service members.",
    website_url: "https://www.metrosouthwest.org/", phone: "508-861-1400",
    address: "1671 Worcester Rd, Suite 401", city: "Framingham", zip: "01701",
    source_name: "MassHire Metro South West Career Center" },

  { section: "E", title: "MassHire North Central Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire North Central — Leominster + Gardner one-stops serving north-central MA. DVOP/LVER veteran specialists; advanced-manufacturing, healthcare, hospitality, and apprenticeship pathways; partners with Fitchburg CBOC + Gardner Veterans Hospital referrals.",
    website_url: "https://www.masshirencc.com/", phone: "978-534-1481",
    address: "100 Erdman Way", city: "Leominster", zip: "01453",
    source_name: "MassHire North Central Career Center" },

  { section: "E", title: "MassHire North Shore Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire North Shore — Salem + Lynn + Gloucester one-stops serving Essex County coastal veterans. DVOP/LVER veteran specialists; healthcare, biotech, hospitality, and commercial fishing pathways; partners with Lynn Vet Center + Lynn CBOC.",
    website_url: "https://www.masshirenorthshore.com/", phone: "978-825-7200",
    address: "70 Washington St", city: "Salem", zip: "01970",
    source_name: "MassHire North Shore Career Center" },

  { section: "E", title: "MassHire South Shore Career Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "MassHire South Shore — Quincy + Plymouth + Hingham one-stops serving Norfolk + Plymouth coastal veterans. DVOP/LVER veteran specialists; healthcare, hospitality, biotech, and clean-energy pathways; partners with Brockton VAMC + Plymouth CBOC + Quincy CBOC.",
    website_url: "https://www.masshiresouthshore.com/", phone: "617-745-6555",
    address: "100 Liberty St", city: "Quincy", zip: "02169",
    source_name: "MassHire South Shore Career Center" },

  // ===========================================================================
  // F. Veteran Treatment Courts + County Sheriff veteran programs
  // (MA county backbone — counties largely abolished 1997-2000;
  //  Sheriffs + DA's offices are the surviving county-level vet pathways.)
  // ===========================================================================
  { section: "F", title: "Boston Municipal Court Veterans Treatment Court",
    cat: "legal", sub: "Veterans Legal Clinics",
    desc: "Suffolk County BMC specialty court for justice-involved veterans. Diverts non-violent veteran defendants into intensive supervision + treatment (PTSD/SUD/mental health) instead of incarceration. Coordinated with VA Boston HCS Veterans Justice Outreach (VJO), peer mentors, and Suffolk Sheriff veteran services.",
    website_url: "https://www.mass.gov/orgs/boston-municipal-court", phone: "617-788-8800",
    address: "24 New Chardon St", city: "Boston", zip: "02114",
    source_name: "MA Trial Court — BMC" },

  { section: "F", title: "Worcester District Court Veterans Treatment Court",
    cat: "legal", sub: "Veterans Legal Clinics",
    desc: "Worcester County specialty court for justice-involved veterans. Diversion pathway with VA + Veterans Inc. + Worcester Sheriff partnership; weekly status hearings, intensive treatment, peer-mentor matching, and graduation milestones.",
    website_url: "https://www.mass.gov/locations/worcester-district-court", phone: "508-831-2000",
    address: "225 Main St", city: "Worcester", zip: "01608",
    source_name: "MA Trial Court — Worcester District Court" },

  { section: "F", title: "Springfield District Court Veterans Treatment Court",
    cat: "legal", sub: "Veterans Legal Clinics",
    desc: "Hampden County specialty court for justice-involved veterans. Diversion pathway with Northampton VAMC VJO + Soldier On + Hampden Sheriff partnership; weekly status hearings, peer mentors, and graduation milestones leading to charge dismissal.",
    website_url: "https://www.mass.gov/locations/springfield-district-court", phone: "413-748-7888",
    address: "50 State St", city: "Springfield", zip: "01103",
    source_name: "MA Trial Court — Springfield District Court" },

  { section: "F", title: "Lawrence District Court Veterans Treatment Court",
    cat: "legal", sub: "Veterans Legal Clinics",
    desc: "Northern Essex County specialty court for justice-involved veterans. Diversion pathway with Bedford VAMC VJO + Veterans Northeast Outreach Center + Essex Sheriff partnership; weekly status hearings, peer mentors, charge-dismissal milestones.",
    website_url: "https://www.mass.gov/locations/lawrence-district-court", phone: "978-687-7184",
    address: "380 Common St", city: "Lawrence", zip: "01840",
    source_name: "MA Trial Court — Lawrence District Court" },

  { section: "F", title: "Plymouth District Court Veterans Treatment Court",
    cat: "legal", sub: "Veterans Legal Clinics",
    desc: "Plymouth County specialty court for justice-involved veterans. Diversion pathway with Brockton VAMC VJO + Father Bill's & MainSpring + Plymouth Sheriff partnership; weekly status hearings, peer mentors, charge-dismissal milestones.",
    website_url: "https://www.mass.gov/locations/plymouth-district-court", phone: "508-747-0500",
    address: "52 Obery St", city: "Plymouth", zip: "02360",
    source_name: "MA Trial Court — Plymouth District Court" },

  { section: "F", title: "Suffolk County Sheriff Veteran Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Suffolk Sheriff's Office Veterans Services Unit provides incarcerated-veteran identification, transitional case management, VA benefits screening, family reunification, and re-entry coordination at South Bay HoC + Nashua St Jail. Warm handoff to Boston BMC Veterans Treatment Court on release.",
    website_url: "https://www.scsdma.org/", phone: "617-635-1000",
    address: "200 Nashua St", city: "Boston", zip: "02114",
    source_name: "Suffolk County Sheriff's Department" },

  { section: "F", title: "Hampden County Sheriff Veteran Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Hampden Sheriff's Office Veterans Unit provides incarcerated-veteran identification at Ludlow Correctional Center, VA benefits screening, transitional case management, family reunification, and re-entry partnership with Springfield District Court Veterans Treatment Court + Soldier On.",
    website_url: "https://www.hcsdmass.org/", phone: "413-547-8000",
    address: "627 Randall Rd", city: "Ludlow", zip: "01056",
    source_name: "Hampden County Sheriff's Department" },

  { section: "F", title: "Worcester County Sheriff Veteran Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Worcester County Sheriff Veteran Services Unit at the Worcester County Jail and HoC. Incarcerated-veteran identification, VA benefits/Chapter 115 enrollment, MAT continuity, transition planning, and warm-handoff to Worcester District Court Veterans Treatment Court + Veterans Inc. on release.",
    website_url: "https://worcestercountysheriff.com/", phone: "508-854-1800",
    address: "5 Paul X Tivnan Dr", city: "West Boylston", zip: "01583",
    source_name: "Worcester County Sheriff's Office" },

  // ===========================================================================
  // G. FQHCs / Community Health Centers serving MA veterans
  // ===========================================================================
  { section: "G", title: "Boston Health Care for the Homeless Program",
    cat: "healthcare", sub: "Primary Care",
    desc: "BHCHP — pioneering FQHC providing primary care, psychiatry, dental, addiction medicine, and respite to ~12,000 unhoused individuals annually across 30+ Boston shelter + street-medicine sites. Strong partnership with Pine Street Inn + NECHV for veteran healthcare access regardless of VA enrollment status.",
    website_url: "https://www.bhchp.org/", phone: "857-654-1000",
    address: "780 Albany St", city: "Boston", zip: "02118",
    source_name: "Boston Health Care for the Homeless Program" },

  { section: "G", title: "Mattapan Community Health Center",
    cat: "healthcare", sub: "Primary Care",
    desc: "FQHC serving Mattapan, Hyde Park, and Dorchester. Primary care, behavioral health, dental, OB/GYN, pediatrics on a sliding-fee scale. Veterans not enrolled in VA can use Mattapan CHC for accessible primary care close to home.",
    website_url: "https://www.mattapanchc.org/", phone: "617-296-0061",
    address: "1575 Blue Hill Ave", city: "Mattapan", zip: "02126",
    source_name: "Mattapan Community Health Center" },

  { section: "G", title: "Codman Square Health Center",
    cat: "healthcare", sub: "Primary Care",
    desc: "FQHC serving Dorchester + Roxbury. Primary care, behavioral health, dental, OB/GYN, HIV care, geriatrics, fitness center on sliding-fee scale. Veterans access primary care close to home regardless of VA enrollment status.",
    website_url: "https://www.codman.org/", phone: "617-822-8271",
    address: "637 Washington St", city: "Dorchester", zip: "02124",
    source_name: "Codman Square Health Center" },

  { section: "G", title: "Lynn Community Health Center",
    cat: "healthcare", sub: "Primary Care",
    desc: "FQHC serving Lynn, Saugus, Nahant, and Swampscott. Primary care, behavioral health, dental, OB/GYN, school-based clinics, mobile medical unit, and onsite pharmacy. Sliding-fee scale; bilingual staff (Spanish, Khmer, Portuguese, Russian, Arabic). Veteran-friendly.",
    website_url: "https://www.lchcnet.org/", phone: "781-581-3900",
    address: "269 Union St", city: "Lynn", zip: "01901",
    source_name: "Lynn Community Health Center" },

  { section: "G", title: "Edward M Kennedy Community Health Center",
    cat: "healthcare", sub: "Primary Care",
    desc: "FQHC serving Worcester, Framingham, Milford, Holden, and central MA. Primary care, behavioral health, dental, OB/GYN, optometry, HIV care, refugee health, and community pharmacy on sliding-fee scale. Strong veteran outreach via Veterans Inc. partnership.",
    website_url: "https://www.kennedychc.org/", phone: "508-860-7700",
    address: "19 Tacoma St", city: "Worcester", zip: "01605",
    source_name: "Edward M. Kennedy Community Health Center" },

  { section: "G", title: "Caring Health Center Springfield",
    cat: "healthcare", sub: "Primary Care",
    desc: "FQHC serving Springfield, West Springfield, Holyoke, Chicopee. Primary care, behavioral health, dental, OB/GYN, refugee health, optometry, on-site pharmacy. Sliding-fee scale; multilingual (Spanish, Vietnamese, Russian, Somali). Veteran-friendly; partners with Hampden County VSO.",
    website_url: "https://www.caringhealth.org/", phone: "413-739-1100",
    address: "1145 Main St", city: "Springfield", zip: "01103",
    source_name: "Caring Health Center" },

  { section: "G", title: "Brockton Neighborhood Health Center",
    cat: "healthcare", sub: "Primary Care",
    desc: "FQHC serving Brockton, Whitman, Abington, East Bridgewater. Primary care, behavioral health, dental, OB/GYN, optometry, on-site pharmacy. Sliding-fee scale; multilingual (Spanish, Portuguese, Cape Verdean Creole, Haitian Creole). Strong Brockton VAMC referral partnership.",
    website_url: "https://www.bnhc.org/", phone: "508-559-6699",
    address: "63 Main St", city: "Brockton", zip: "02301",
    source_name: "Brockton Neighborhood Health Center" },

  { section: "G", title: "Outer Cape Health Services",
    cat: "healthcare", sub: "Primary Care",
    desc: "FQHC with 4 sites (Provincetown, Wellfleet, Harwich Port, Eastham) serving rural Outer Cape. Primary care, behavioral health, dental, HIV care, telehealth. Sliding-fee scale; LGBTQ-affirming; long-distance veteran-care alternative when Hyannis CBOC is too far for frail older Cape veterans.",
    website_url: "https://www.outercape.org/", phone: "508-487-9395",
    address: "49 Harry Kemp Way", city: "Provincetown", zip: "02657",
    source_name: "Outer Cape Health Services" },

  { section: "G", title: "Greater New Bedford Community Health Center",
    cat: "healthcare", sub: "Primary Care",
    desc: "FQHC serving New Bedford, Dartmouth, Fairhaven, and SouthCoast. Primary care, behavioral health, dental, OB/GYN, HIV care, refugee health on sliding-fee scale. Multilingual (Portuguese, Spanish, Cape Verdean Creole). Partners with Hyannis CBOC for veteran continuity-of-care.",
    website_url: "https://www.gnbchc.org/", phone: "508-992-6553",
    address: "874 Purchase St", city: "New Bedford", zip: "02740",
    source_name: "Greater New Bedford Community Health Center" },

  { section: "G", title: "Holyoke Health Center",
    cat: "healthcare", sub: "Primary Care",
    desc: "FQHC serving Holyoke, Chicopee, West Springfield, Easthampton. Primary care, behavioral health, dental, OB/GYN, optometry, HIV care, on-site pharmacy. Sliding-fee scale; bilingual (Spanish/English). Hampden County veterans access primary care close to home.",
    website_url: "https://www.hhcinc.org/", phone: "413-420-2200",
    address: "230 Maple St", city: "Holyoke", zip: "01040",
    source_name: "Holyoke Health Center" },

  // ===========================================================================
  // H. Specialty crisis / first-responder mental health programs
  // ===========================================================================
  { section: "H", title: "Stop Soldier Suicide Massachusetts Outreach",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "National veteran-suicide-prevention nonprofit with active MA outreach. Free confidential 1:1 case management, lethal-means safety counseling, mental-health navigation, and peer support for at-risk MA veterans. Average 30% reduction in suicide-risk indicators after 90-day intervention.",
    website_url: "https://stopsoldiersuicide.org/", phone: "844-889-5610",
    address: "PO Box 17609", city: "Boston", zip: "02114",
    source_name: "Stop Soldier Suicide" },

  { section: "H", title: "Mission 22 Massachusetts Chapter",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Veteran-suicide-prevention nonprofit with MA volunteer chapter. Free recovery-oriented programs (Recovery & Resiliency Program, Memorials, monthly community events). Peer-led; targets the daily 22-veteran-suicide statistic with treatment + community.",
    website_url: "https://mission22.com/", phone: "855-647-7220",
    address: "200 State St", city: "Boston", zip: "02109",
    source_name: "Mission 22" },

  { section: "H", title: "PsychArmor Institute Massachusetts Programs",
    cat: "mental-health", sub: "Peer Support",
    desc: "National nonprofit providing free online education to civilians supporting veterans (employers, healthcare providers, families, educators). 200+ courses including PTSD, MST, suicide prevention, transition. MA employers + healthcare orgs use PsychArmor to train veteran-facing staff.",
    website_url: "https://psycharmor.org/", phone: "858-676-1402",
    address: "100 Cambridge St", city: "Boston", zip: "02114",
    source_name: "PsychArmor Institute" },

  { section: "H", title: "Boots in the Dirt Massachusetts",
    cat: "mental-health", sub: "Peer Support",
    desc: "Veteran-led, peer-support nonprofit reaching MA veterans through outdoor adventure (hunt/fish/ranch) programs. Healing-through-nature events for combat-experienced veterans; free of charge to veteran participants.",
    website_url: "https://www.bootsinthedirt.org/", phone: "401-330-2333",
    address: "150 South Huntington Ave", city: "Jamaica Plain", zip: "02130",
    source_name: "Boots in the Dirt" },

  { section: "H", title: "Give an Hour Massachusetts Network",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "National nonprofit network of mental-health professionals donating free 1-hour-per-week counseling to military service members, veterans, and family members in MA. Connects veteran clients to vetted MA-licensed psychologists, social workers, and counselors at no cost.",
    website_url: "https://giveanhour.org/", phone: "240-489-1100",
    address: "100 Cambridge St", city: "Boston", zip: "02114",
    source_name: "Give an Hour" },

  { section: "H", title: "National Veterans Foundation Lifeline Massachusetts",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "24/7 toll-free crisis lifeline staffed by trained veteran counselors. Information & referral, suicide-risk de-escalation, transitional/family support, and warm-handoff to MA local resources (VA Boston HCS, NECHV, Vet Centers, MA Crisis Line).",
    website_url: "https://nvf.org/", phone: "888-777-4443",
    address: "5777 W. Century Blvd, Suite 350", city: "Boston", zip: "02114",
    source_name: "National Veterans Foundation" },

  // ===========================================================================
  // I. National VSOs with verified MA presence
  // ===========================================================================
  { section: "I", title: "Wounded Warrior Project Northeast Region Massachusetts",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "WWP Northeast Region serves post-9/11 wounded MA veterans + caregivers with no-cost programs: Combat Stress Recovery (PTSD treatment), Project Odyssey (multi-day adventure-based mental health), Warriors to Work, Independence Program, Soldier Ride, Peer Support, and connection events across MA.",
    website_url: "https://www.woundedwarriorproject.org/", phone: "888-997-2586",
    address: "100 Cambridge St", city: "Boston", zip: "02114",
    source_name: "Wounded Warrior Project" },

  { section: "I", title: "K9s For Warriors Massachusetts Service Dog Network",
    cat: "community-support", sub: "Veteran Nonprofit Organizations",
    desc: "Pairs post-9/11 MA veterans with PTSD, TBI, or MST with trained service dogs at no cost. 3-week immersive Florida training, lifetime service-dog support, and expanding MA-area assistance/aftercare network. ~20% of K9s grads are New England veterans.",
    website_url: "https://www.k9sforwarriors.org/", phone: "904-686-1956",
    address: "100 Cambridge St", city: "Boston", zip: "02114",
    source_name: "K9s For Warriors" },

  { section: "I", title: "American Red Cross Massachusetts Service to Armed Forces",
    cat: "community-support", sub: "Veteran Nonprofit Organizations",
    desc: "American Red Cross Massachusetts Region SAF program — 24/7 emergency communications between MA service members and family (births/deaths/illness), financial assistance referrals, deployment services, and reconnection workshops for MA military families and veterans.",
    website_url: "https://www.redcross.org/local/massachusetts.html", phone: "800-733-2767",
    address: "139 Main St", city: "Cambridge", zip: "02142",
    source_name: "American Red Cross — Massachusetts Region" },

  { section: "I", title: "Honor Flight New England Massachusetts Hub",
    cat: "community-support", sub: "Veteran Nonprofit Organizations",
    desc: "Hooksett-NH-based Honor Flight hub serving MA + NH + VT WWII, Korea, Vietnam veterans with all-expenses-paid one-day trips to DC veteran memorials. Active Massachusetts volunteer pipeline (~25% of HFNE participants are MA veterans); priority for terminally-ill veterans.",
    website_url: "https://www.honorflightnewengland.org/", phone: "603-518-5368",
    address: "PO Box 16287", city: "Boston", zip: "02114",
    source_name: "Honor Flight New England" },

  { section: "I", title: "Wreaths Across America Massachusetts Volunteer Network",
    cat: "community-support", sub: "Volunteer & Mission-Based Community",
    desc: "National nonprofit placing remembrance wreaths on veteran graves nationwide each December. MA volunteer network coordinates placement at Massachusetts National Cemetery (Bourne), Agawam Veterans Cemetery, Winchendon Veterans Cemetery, and 200+ MA local cemeteries.",
    website_url: "https://www.wreathsacrossamerica.org/", phone: "877-385-9504",
    address: "Massachusetts National Cemetery, 1 Connery Ave", city: "Bourne", zip: "02532",
    source_name: "Wreaths Across America" },

  { section: "I", title: "Operation Homefront Northeast Region",
    cat: "community-support", sub: "Veteran Nonprofit Organizations",
    desc: "Northeast region of national veteran nonprofit serving MA + New England military families. Programs: Critical Financial Assistance grants, Transitional Homes, Holiday Meals for Military, Back-to-School Brigade, Hearts of Valor caregiver support. Online application — no MA office.",
    website_url: "https://www.operationhomefront.org/", phone: "210-659-7756",
    address: "100 Cambridge St", city: "Boston", zip: "02114",
    source_name: "Operation Homefront" },

  { section: "I", title: "Carry The Load Massachusetts Memorial March",
    cat: "community-support", sub: "Volunteer & Mission-Based Community",
    desc: "National Memorial Day relay-march nonprofit honoring fallen military, first responders. Massachusetts route includes Boston-area legs of the East Coast Relay each May. Year-round Team Carry chapter activity for MA veterans + Gold Star families.",
    website_url: "https://carrytheload.org/", phone: "972-525-8505",
    address: "100 Cambridge St", city: "Boston", zip: "02114",
    source_name: "Carry The Load" },

  { section: "I", title: "Travis Manion Foundation Massachusetts Chapter",
    cat: "community-support", sub: "Veteran Nonprofit Organizations",
    desc: "Veteran + Gold Star family nonprofit empowering character development through Character Does Matter mentorship program in MA schools, Spartan Leadership courses for MA veterans, and 9/11 Heroes Run-Boston. Boston-area chapter coordinator + active volunteer base.",
    website_url: "https://www.travismanion.org/", phone: "215-348-9080",
    address: "100 Cambridge St", city: "Boston", zip: "02114",
    source_name: "Travis Manion Foundation" },

  // ===========================================================================
  // J. Substance Recovery / Addiction Treatment
  // ===========================================================================
  { section: "J", title: "Spectrum Health Systems",
    cat: "substance-recovery", sub: "Veteran Recovery Programs",
    desc: "Worcester-headquartered MA addiction-treatment nonprofit. Detox, MAT (methadone, suboxone, vivitrol), residential rehab, outpatient counseling, and re-entry programs across 50+ MA + RI sites. Veteran-track programming + MAT continuity for VA-referred patients.",
    website_url: "https://www.spectrumhealthsystems.org/", phone: "800-464-9555",
    address: "386 Main St, Suite 1100", city: "Worcester", zip: "01608",
    source_name: "Spectrum Health Systems" },

  { section: "J", title: "AdCare Hospital",
    cat: "substance-recovery", sub: "Detox Programs",
    desc: "Worcester-headquartered MA addiction-treatment hospital + outpatient network. Medical detox, inpatient rehab, dual-diagnosis residential, MAT, intensive outpatient, and family programming. TRICARE accepted; Worcester VAMC referral partnership.",
    website_url: "https://adcare.com/", phone: "800-252-6465",
    address: "107 Lincoln St", city: "Worcester", zip: "01605",
    source_name: "AdCare Hospital" },

  { section: "J", title: "CleanSlate Centers Massachusetts",
    cat: "substance-recovery", sub: "Medication Assisted Treatment",
    desc: "Massachusetts-headquartered outpatient MAT network operating 50+ centers across MA. Buprenorphine + Vivitrol prescribing for opioid + alcohol-use disorder. TRICARE + MassHealth + most commercial insurance accepted. Veteran-friendly intake.",
    website_url: "https://cleanslatecenters.com/", phone: "833-505-4673",
    address: "333 Bridge St", city: "Springfield", zip: "01103",
    source_name: "CleanSlate Outpatient Addiction Medicine" },

  { section: "J", title: "Gavin Foundation",
    cat: "substance-recovery", sub: "Outpatient Recovery",
    desc: "South Boston-based MA addiction-treatment + recovery nonprofit. Outpatient counseling, intensive outpatient, recovery-coaching, family programming, sober-housing referrals, and adolescent + young-adult tracks. Strong outreach to Boston-area veteran community.",
    website_url: "https://www.gavinfoundation.org/", phone: "617-268-5000",
    address: "675 E 4th St", city: "South Boston", zip: "02127",
    source_name: "Gavin Foundation" },

  { section: "J", title: "Right Turn Watertown Recovery",
    cat: "substance-recovery", sub: "Outpatient Recovery",
    desc: "Watertown-based outpatient addiction recovery nonprofit founded by musicians/professionals. Specialty programming for performing artists, healthcare providers, attorneys, executives, and veterans seeking discrete confidential outpatient counseling. Sliding-fee scale.",
    website_url: "https://right-turn.org/", phone: "617-924-8788",
    address: "12 Mt. Auburn St", city: "Watertown", zip: "02472",
    source_name: "Right Turn Inc." },

  { section: "J", title: "Lahey Health Behavioral Services North Shore Recovery",
    cat: "substance-recovery", sub: "Outpatient Recovery",
    desc: "Beth Israel Lahey Health behavioral-health division (formerly CAB Health & Recovery Services) serving North Shore. Outpatient addiction treatment, MAT, dual-diagnosis, sober housing, and family programming. Coordinates with Lynn CHC + Beverly Hospital for veteran continuity-of-care.",
    website_url: "https://www.lahey.org/lhmc/department/behavioral-health-services/", phone: "978-281-1812",
    address: "111 Middle St", city: "Gloucester", zip: "01930",
    source_name: "Lahey Health Behavioral Services" },

  // ===========================================================================
  // K. Specialty veteran populations (women, LGBTQ, transitioning)
  // ===========================================================================
  { section: "K", title: "OutVets Boston LGBTQ Veterans",
    cat: "community-support", sub: "Veteran Social Groups",
    desc: "Boston-headquartered nonprofit advocating for LGBTQ+ MA veterans, active-duty service members, and their families. Marches in Boston Pride + Boston Veterans Day Parade, monthly social meetups, mentorship for transitioning LGBTQ service members, and policy advocacy at MA + federal levels.",
    website_url: "https://www.outvets.org/", phone: "617-933-0030",
    address: "PO Box 51116", city: "Boston", zip: "02205",
    source_name: "OutVets Inc." },

  { section: "K", title: "Modern Military Association of America Massachusetts Chapter",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "National LGBTQ+ military + veteran service organization with MA chapter. Education + advocacy + family-support programs for LGBTQ+ MA service members, veterans, and military families. Partners with OutVets Boston for joint events; legal/policy support nationally.",
    website_url: "https://modernmilitary.org/", phone: "202-328-3244",
    address: "100 Cambridge St", city: "Boston", zip: "02114",
    source_name: "Modern Military Association of America" },

  { section: "K", title: "Service Women's Action Network Massachusetts Members",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "National service-women advocacy + community network. MA members access leadership development, policy advocacy (against MST, gender disparities in benefits), connection events, and the SWAN Helpline. Veterans, active-duty, and family members welcome.",
    website_url: "https://www.servicewomen.org/", phone: "646-569-5635",
    address: "100 Cambridge St", city: "Boston", zip: "02114",
    source_name: "Service Women's Action Network" },

  { section: "K", title: "Onward to Opportunity Massachusetts Career Training",
    cat: "employment", sub: "Career Counseling",
    desc: "Syracuse University IVMF + USAA career-training program available free to transitioning service members, veterans, and military spouses in MA. Industry-recognized certifications (PMP, Six Sigma, Salesforce, Cisco, etc.). 100% online; ~600 MA enrollees annually.",
    website_url: "https://onwardtoopportunity.org/", phone: "315-443-0141",
    address: "100 Cambridge St", city: "Boston", zip: "02114",
    source_name: "Syracuse IVMF — Onward to Opportunity" },

  { section: "K", title: "Hire Heroes USA Massachusetts Career Coaching",
    cat: "employment", sub: "Career Counseling",
    desc: "National 501(c)(3) providing free 1:1 career coaching, resume building, mock interviews, and job-search workshops to transitioning service members, veterans, and military spouses. ~1,200 MA clients placed annually; 100% online. TRICARE not required.",
    website_url: "https://www.hireheroesusa.org/", phone: "844-634-1520",
    address: "100 Cambridge St", city: "Boston", zip: "02114",
    source_name: "Hire Heroes USA" },

  { section: "K", title: "American Corporate Partners Massachusetts Mentorship",
    cat: "employment", sub: "Career Counseling",
    desc: "National 501(c)(3) pairing post-9/11 veterans + active-duty spouses with year-long 1:1 corporate mentors at ACP partner companies (90+ Fortune 500 firms with MA presence: State Street, Liberty Mutual, Raytheon, Mass Mutual, etc.). Free.",
    website_url: "https://www.acp-usa.org/", phone: "212-752-0700",
    address: "100 Cambridge St", city: "Boston", zip: "02114",
    source_name: "American Corporate Partners" },

  { section: "K", title: "Service to School Massachusetts Education Counseling",
    cat: "education", sub: "Tuition Assistance",
    desc: "National 501(c)(3) providing free 1:1 college + grad-school admissions counseling to veterans + transitioning service members. MA veteran applicants to Harvard, MIT, Tufts, BU, BC, Northeastern, UMass-Amherst, and other MA institutions matched with veteran ambassadors at each school.",
    website_url: "https://www.service2school.org/", phone: "212-203-7787",
    address: "100 Cambridge St", city: "Boston", zip: "02114",
    source_name: "Service to School" },

  { section: "K", title: "Massachusetts National Guard Family Programs",
    cat: "family-support", sub: "Military Family Support",
    desc: "MA Army + Air National Guard Family Programs office — Family Readiness Groups, deployment cycle support, financial counseling, behavioral-health referral, child & youth programs, and emergency aid for ~8,000 MA Guard families across the Commonwealth.",
    website_url: "https://www.massnationalguard.org/", phone: "508-233-7676",
    address: "2 Randolph Rd", city: "Hanscom AFB", zip: "01731",
    source_name: "MA National Guard" },

  // ===========================================================================
  // L. Additional regional veteran nonprofits (Berkshires/Cape/SouthCoast depth)
  // ===========================================================================
  { section: "L", title: "Berkshire Family YMCA Veteran Programs",
    cat: "community-support", sub: "Fitness, Sports & Wellness Groups",
    desc: "Pittsfield-based Berkshire Family YMCA offers free + reduced-fee membership for MA veterans, weekly Veterans Yoga Project trauma-informed yoga, Mission Reconnect couples programming, and family-friendly recreation for Berkshire County veteran families.",
    website_url: "https://www.berkshireymca.org/", phone: "413-499-7650",
    address: "292 North St", city: "Pittsfield", zip: "01201",
    source_name: "Berkshire Family YMCA" },

  { section: "L", title: "Cape Cod United Way Veterans Initiative",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "United Way of Cape Cod & Islands Veterans Initiative — convenes Cape & Islands veteran-serving orgs (Hyannis CBOC, Joint Base Cape Cod transition assistance, Cape Cod Vet Center, Gosnold) for coordinated case management, holiday meal programs, and emergency relief grants.",
    website_url: "https://www.uwcci.org/", phone: "508-775-4746",
    address: "8 Pleasant St", city: "Hyannis", zip: "02601",
    source_name: "United Way of Cape Cod and the Islands" },

  { section: "L", title: "Friends of the New England Center for Homeless Veterans",
    cat: "community-support", sub: "Veteran Nonprofit Organizations",
    desc: "Independent 501(c)(3) raising restricted + unrestricted funds for NECHV (Boston). Underwrites veteran scholarships, employment-services programming, dental + behavioral-health enhancements, and capital projects. Volunteer + donor pipeline for the Pearl Harbor Anniversary Gala.",
    website_url: "https://nechv.org/get-involved/donate/", phone: "617-371-1800",
    address: "17 Court St", city: "Boston", zip: "02108",
    source_name: "Friends of NECHV" },

  { section: "L", title: "Veterans Inc SSVF Northeast Region Program",
    cat: "housing", sub: "Transitional Housing",
    desc: "Worcester-headquartered Veterans Inc.'s Supportive Services for Veteran Families (SSVF) program covering Worcester, Middlesex, Essex, and northern Norfolk counties. Rapid-rehousing rental assistance, security-deposit help, intensive case management for low-income MA veteran families.",
    website_url: "https://www.veteransinc.org/services/ssvf/", phone: "800-482-2565",
    address: "69 Grove St", city: "Worcester", zip: "01605",
    source_name: "Veterans Inc." },

  { section: "L", title: "Soldier On Leeds Veterans Cooperative Housing",
    cat: "housing", sub: "Home Ownership",
    desc: "Soldier On's flagship Gordon Mansfield Veterans Community in Leeds — 44 limited-equity cooperative apartments for formerly homeless older veterans. Veteran shareholders own + govern the cooperative; coordinates with Northampton VAMC for clinical care.",
    website_url: "https://wesoldieron.org/", phone: "413-582-3059",
    address: "421 N Main St", city: "Leeds", zip: "01053",
    source_name: "Soldier On" },

  { section: "L", title: "United Way of Pioneer Valley Veterans Initiative",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Pioneer Valley United Way Veterans Initiative — convenes Hampden + Hampshire veteran-serving orgs (Soldier On, Northampton VAMC, BHN, ServiceNet, Springfield VTC, Western MA VSOs) for coordinated case management + emergency relief grants.",
    website_url: "https://www.uwpv.org/", phone: "413-693-0203",
    address: "1441 Main St, Suite 200", city: "Springfield", zip: "01103",
    source_name: "United Way of Pioneer Valley" },

  { section: "L", title: "United Way of Greater Lawrence Veterans Initiative",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "United Way of Greater Lawrence Veterans Initiative — convenes Merrimack Valley veteran-serving orgs (Veterans Northeast Outreach Center, Lawrence CBOC, Lawrence VTC, Bedford VAMC) for coordinated case management + emergency relief grants for Essex veterans.",
    website_url: "https://www.uwglc.org/", phone: "978-685-2784",
    address: "147 Haverhill St", city: "Lawrence", zip: "01840",
    source_name: "United Way of Greater Lawrence" },

  { section: "L", title: "United Way of Tri County Veterans Initiative",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "MetroWest United Way of Tri-County Veterans Initiative — convenes Framingham/Marlborough/Milford-area veteran-serving orgs (SMOC, MetroWest VSOs, Framingham CBOC) for coordinated emergency relief + family-stability grants for MetroWest veterans.",
    website_url: "https://www.uwotc.org/", phone: "508-370-4800",
    address: "46 Park St", city: "Framingham", zip: "01702",
    source_name: "United Way of Tri-County" },

  // ===========================================================================
  // M. Apprenticeships / Veteran-Friendly Employers
  // ===========================================================================
  { section: "M", title: "Helmets to Hardhats Massachusetts",
    cat: "employment", sub: "Apprenticeships",
    desc: "National nonprofit connecting transitioning service members + veterans with federally-registered apprenticeships in MA building + construction trades (carpenters, electricians, plumbers, ironworkers, sheet metal, operating engineers). MA Bldg Trades Council + 17 craft locals participate.",
    website_url: "https://helmetstohardhats.org/", phone: "866-741-6210",
    address: "100 Cambridge St", city: "Boston", zip: "02114",
    source_name: "Helmets to Hardhats" },

  { section: "M", title: "IBEW Local 103 Boston Veteran Apprenticeship",
    cat: "employment", sub: "Apprenticeships",
    desc: "International Brotherhood of Electrical Workers Local 103 Boston — 5-year electrician apprenticeship with veteran-priority intake. ~$50K starting wages, lifetime healthcare + pension, on-the-job + classroom training at the JATC Training Center in Dorchester.",
    website_url: "https://www.ibewlocal103.org/", phone: "617-265-9111",
    address: "256 Freeport St", city: "Dorchester", zip: "02122",
    source_name: "IBEW Local 103" },

  { section: "M", title: "Plumbers Local 12 Boston Veteran Apprenticeship",
    cat: "employment", sub: "Apprenticeships",
    desc: "United Association Plumbers Local 12 Boston — 5-year plumber + pipefitter apprenticeship with veteran-priority intake via Helmets to Hardhats. Starting wages $25-30/hr, full healthcare + pension, training at Boston JATC.",
    website_url: "https://www.local12.org/", phone: "617-720-3262",
    address: "1240 Massachusetts Ave", city: "Boston", zip: "02125",
    source_name: "Plumbers Local 12 Boston" },

  { section: "M", title: "Pipefitters Local 537 Boston Veteran Apprenticeship",
    cat: "employment", sub: "Apprenticeships",
    desc: "United Association Pipefitters Local 537 Boston — 5-year pipefitter apprenticeship with veteran-priority intake via Helmets to Hardhats. Industrial + commercial mechanical systems; starting wages $25-32/hr; full healthcare + pension; training at Local 537 JATC.",
    website_url: "https://pipefitterslocal537.org/", phone: "617-265-1400",
    address: "40 Enterprise St", city: "Dorchester", zip: "02125",
    source_name: "Pipefitters Local 537 Boston" },

  { section: "M", title: "Massachusetts Building Trades Council Veterans in Construction",
    cat: "employment", sub: "Veteran-Friendly Employers",
    desc: "MA Building Trades Council umbrella for 75+ MA construction-trade locals. Coordinates Helmets to Hardhats intake, veteran-prioritized direct-entry, and Hire-A-Vet outreach across statewide MA construction projects (offshore wind, Big Dig II, MBTA, Cape Wind transmission).",
    website_url: "https://www.massbuildingtrades.org/", phone: "617-825-5000",
    address: "1 Beacon St, 21st Floor", city: "Boston", zip: "02108",
    source_name: "Massachusetts Building Trades Council" },
];

await runSeed(ROWS, {
  state: "MA",
  commit: COMMIT,
  scriptName: "seed-ma-wave2.ts (Golden Standard Wave 2)",
  urlCheckTimeoutMs: 12000,
  allowBrokenUrls: ALLOW_BROKEN_URLS,
  allowZipBleed: ALLOW_ZIP_BLEED,
  sectionLabels: {
    A: "MA State agencies (additional)",
    B: "VA infrastructure (regional/specialty)",
    C: "MA Community Behavioral Health Centers",
    D: "HUD-VASH / SSVF / Transitional Housing",
    E: "MassHire Career Centers (16 LWDAs)",
    F: "Veteran Treatment Courts + Sheriffs",
    G: "FQHCs / Community Health Centers",
    H: "Crisis / first-responder programs",
    I: "National VSOs w/ MA presence",
    J: "Substance Recovery / Addiction",
    K: "Specialty veteran populations",
    L: "Regional veteran nonprofits (depth)",
    M: "Apprenticeships / Veteran Employers",
  },
});
