/**
 * RHODE ISLAND — WAVE 2 (Category Depth Fill)
 *
 * Founder release 2026-05-02 (post-W1). Mirror MA W2 + VA W2 Golden Standard.
 * RI ZIP3 = [[28,29]]. Append-only. STOP after Wave 2.
 *
 * Target weak categories from W1:
 *   F  financial            ( 2 → ~14)   +12 HIGH
 *   D  disabled-veterans    ( 3 → ~15)   +12 HIGH
 *   S  substance-recovery   ( 3 → ~15)   +12 HIGH
 *   M  family-support       ( 4 → ~14)   +10 MED
 *   E  education            ( 4 → ~12)   + 8 MED
 *   L  legal                ( 5 → ~13)   + 8 MED
 *
 * Total: 62 rows.
 *
 * Run:
 *   tsx scripts/seed-ri-wave2.ts                                            # dry-run
 *   tsx scripts/seed-ri-wave2.ts --commit --allow-broken-urls --allow-zip-bleed
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");
const ALLOW_ZIP_BLEED = process.argv.includes("--allow-zip-bleed");

const ROWS: SeedRow[] = [
  // ===========================================================================
  // F. FINANCIAL (12) — HIGH PRIORITY
  // ===========================================================================
  { section: "F", title: "Operation Homefront Rhode Island Emergency Financial Assistance",
    cat: "financial", sub: "Emergency Financial Assistance",
    desc: "Operation Homefront — national nonprofit serving RI military + veteran families with Critical Financial Assistance grants for rent, mortgage, utilities, food, vehicle repairs, medical bills + appliances. Holiday Meals 4 Military, Back-to-School Brigade, and Permanent Housing Program.",
    website_url: "https://www.operationhomefront.org/", phone: "210-659-7756",
    address: "1355 Central Pkwy S, Suite 100", city: "San Antonio", zip: "78232",
    source_name: "Operation Homefront" },

  { section: "F", title: "American Red Cross Hero Care Network Rhode Island",
    cat: "financial", sub: "Emergency Financial Assistance",
    desc: "American Red Cross Hero Care Network — 24/7 emergency communication + financial assistance for active-duty + veterans + military families incl. RI. Emergency leave messaging, interest-free loans + grants via VFW + USO partners, deployment + reintegration services.",
    website_url: "https://www.redcross.org/get-help/military-families.html", phone: "877-272-7337",
    address: "105 Gano St", city: "Providence", zip: "02906",
    source_name: "American Red Cross Rhode Island" },

  { section: "F", title: "Modest Needs Foundation",
    cat: "financial", sub: "Emergency Financial Assistance",
    desc: "Modest Needs Foundation — national nonprofit providing Self-Sufficiency Grants (up to $1,000) to low-income workers + veterans facing short-term crisis (utility shut-off, car repair, medical bill) before missing rent. Direct payment to creditors; serves all 50 states incl. RI.",
    website_url: "https://www.modestneeds.org/", phone: "844-667-3776",
    address: "115 East 23rd St, 3rd Floor", city: "New York", zip: "10010",
    source_name: "Modest Needs Foundation" },

  { section: "F", title: "USA Cares Rhode Island Veteran Assistance",
    cat: "financial", sub: "Emergency Financial Assistance",
    desc: "USA Cares — national nonprofit providing post-9/11 RI veteran + service member financial grants (no repayment) for housing, utilities, food, vehicle repair, and emergency family needs. Combat Injured Program, Suicide Prevention Program, Career Transition Program.",
    website_url: "https://usacares.org/", phone: "800-773-0387",
    address: "562 Quartermaster Ct", city: "Jeffersonville", zip: "47130",
    source_name: "USA Cares" },

  { section: "F", title: "PenFed Foundation Veteran Grants",
    cat: "financial", sub: "Emergency Financial Assistance",
    desc: "PenFed Foundation — national nonprofit providing emergency financial assistance grants, Military Heroes home down-payment grants, Dream Makers home-buyer grants + Veteran Entrepreneur Investment Program for RI veterans + military families. No PenFed CU membership required.",
    website_url: "https://penfedfoundation.org/", phone: "800-558-9224",
    address: "1001 N Fairfax St, Suite 750", city: "Alexandria", zip: "22314",
    source_name: "PenFed Foundation" },

  { section: "F", title: "Veteran Tickets Foundation Vet Tix Rhode Island",
    cat: "financial", sub: "Emergency Financial Assistance",
    desc: "Veteran Tickets Foundation (Vet Tix) — national nonprofit providing free + discounted event tickets (sports, concerts, performing arts, family events) to RI veterans, active-duty + immediate family of fallen. Reduces entertainment cost burden + supports veteran community connection.",
    website_url: "https://www.vettix.org/", phone: "602-684-8400",
    address: "9375 E Shea Blvd, Suite 100", city: "Scottsdale", zip: "85260",
    source_name: "Veteran Tickets Foundation" },

  { section: "F", title: "Rhode Island LIHEAP Low Income Home Energy Assistance",
    cat: "financial", sub: "Utility Bill Assistance",
    desc: "Rhode Island Low Income Home Energy Assistance Program (LIHEAP) — DHS-administered federal program providing winter heating assistance + crisis fuel + weatherization for low-income RI residents incl. veterans. Apply through 9 local Community Action Agencies statewide.",
    website_url: "https://dhs.ri.gov/programs-and-services/energy-and-utility-assistance", phone: "401-462-1300",
    address: "57 Howard Ave", city: "Cranston", zip: "02920",
    source_name: "RI Department of Human Services" },

  { section: "F", title: "Rhode Island Energy Customer Assistance",
    cat: "financial", sub: "Utility Bill Assistance",
    desc: "Rhode Island Energy (PPL) — primary RI electric + gas utility offering Low-Income Discount Rate, Henry Shelton Arrearage Forgiveness, Budget Billing, Hardship Protection winter shutoff moratorium, and weatherization referrals for income-qualified RI veterans + residents.",
    website_url: "https://www.rienergy.com/RI-Home/Bill/Bill-Help", phone: "855-743-1101",
    address: "280 Melrose St", city: "Providence", zip: "02907",
    source_name: "Rhode Island Energy" },

  { section: "F", title: "Northern Rhode Island Community Action Energy + LIHEAP",
    cat: "financial", sub: "Utility Bill Assistance",
    desc: "Tri-County Community Action Agency — Northern RI Community Action Agency (Burrillville, North Smithfield, Smithfield, Glocester). LIHEAP intake, weatherization, food pantry, Head Start, senior services, and emergency assistance for low-income veterans + families.",
    website_url: "https://www.tricountyri.org/", phone: "401-519-1915",
    address: "1126 Hartford Ave", city: "Johnston", zip: "02919",
    source_name: "Tri-County Community Action Agency" },

  { section: "F", title: "United Way of Rhode Island Bank On",
    cat: "financial", sub: "Banking / Lending Support",
    desc: "Bank On Rhode Island (United Way of RI initiative) — connects unbanked + underbanked RI residents incl. veterans to safe, affordable, no-overdraft checking accounts at local banks + credit unions. Free financial coaching + Volunteer Income Tax Assistance (VITA) referral.",
    website_url: "https://www.unitedwayri.org/our-work/community-impact/financial-stability/", phone: "211",
    address: "50 Valley St", city: "Providence", zip: "02909",
    source_name: "United Way of Rhode Island" },

  { section: "F", title: "Center for Women and Enterprise Providence",
    cat: "financial", sub: "Banking / Lending Support",
    desc: "Center for Women & Enterprise (CWE) Rhode Island — Providence-based nonprofit providing free + low-cost business training, microloan access, government contracting (WOSB/WBE) certification, and financial coaching for low-income women, women veterans, and minority entrepreneurs.",
    website_url: "https://www.cweonline.org/Locations/RI", phone: "401-277-0800",
    address: "132 George M Cohan Blvd", city: "Providence", zip: "02903",
    source_name: "Center for Women & Enterprise" },

  { section: "F", title: "Coastal1 Credit Union Rhode Island Veterans Banking",
    cat: "financial", sub: "Banking / Lending Support",
    desc: "Coastal1 Credit Union — RI-based credit union with 13 branches statewide offering veteran-friendly checking, low-rate auto + personal loans, VA mortgage referrals, and free financial counseling for RI veterans + families. Federally insured by NCUA.",
    website_url: "https://www.coastal1.org/", phone: "401-739-4600",
    address: "165 Pierce St", city: "East Greenwich", zip: "02818",
    source_name: "Coastal1 Credit Union" },

  // ===========================================================================
  // D. DISABLED VETERANS (12) — HIGH PRIORITY
  // ===========================================================================
  { section: "D", title: "VA Vocational Rehabilitation and Employment VR&E Providence",
    cat: "disabled-veterans", sub: "Employment & Vocational Rehabilitation",
    desc: "VA Vocational Rehabilitation & Employment (VR&E / Chapter 31) at Providence VAMC — federal benefit for service-connected disabled RI veterans (10%+ rating). Employment services, training, education, self-employment, independent living, and Veteran Readiness + Employment counseling.",
    website_url: "https://www.va.gov/careers-employment/vocational-rehabilitation/", phone: "401-273-7100",
    address: "830 Chalkstone Ave", city: "Providence", zip: "02908",
    source_name: "Providence VA Healthcare System" },

  { section: "D", title: "Wounded Warrior Project Rhode Island",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Wounded Warrior Project (WWP) — national nonprofit serving post-9/11 wounded, ill, and injured RI veterans + caregivers. Mental + physical health programs, Soldier Ride adaptive cycling, Independence Program for severely-injured, peer support, and benefits + career counseling.",
    website_url: "https://www.woundedwarriorproject.org/", phone: "888-997-2586",
    address: "4899 Belfort Rd, Suite 300", city: "Jacksonville", zip: "32256",
    source_name: "Wounded Warrior Project" },

  { section: "D", title: "Hope For The Warriors Rhode Island",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Hope For The Warriors — national nonprofit serving post-9/11 wounded RI service members, veterans + military families. Transition services, sports + recreation, clinical health + wellness, Got Your 6 community engagement, and Run For The Warriors fundraisers.",
    website_url: "https://www.hopeforthewarriors.org/", phone: "877-246-7349",
    address: "8003 Forbes Pl, Suite 201", city: "Springfield", zip: "22151",
    source_name: "Hope For The Warriors" },

  { section: "D", title: "Semper Fi and Americas Fund Rhode Island",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Semper Fi & America's Fund — national nonprofit providing immediate + long-term financial assistance, case management, and direct support to RI critically wounded, ill + injured service members + veterans of all branches + their families. Adaptive housing, transportation, child care.",
    website_url: "https://thefund.org/", phone: "760-725-3680",
    address: "715 Broadway St", city: "Camp Pendleton", zip: "92055",
    source_name: "Semper Fi & America's Fund" },

  { section: "D", title: "Adaptive Sports New England Boston",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Adaptive Sports New England — Boston-based regional nonprofit running adaptive sports programs (sled hockey, wheelchair basketball, sailing, skiing) for disabled RI + MA + NH + ME + VT + CT veterans + youth. Year-round clinics, leagues, and tournaments across New England.",
    website_url: "https://adaptivesportsne.org/", phone: "617-329-1124",
    address: "300 N Beacon St", city: "Watertown", zip: "02472",
    source_name: "Adaptive Sports New England" },

  { section: "D", title: "Move United Disabled Sports USA",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Move United (formerly Disabled Sports USA / Adaptive Sports USA merger) — national community-based adaptive sports organization. 200+ chapters offering 70+ sports for disabled RI veterans incl. Warfighter Sports military program (skiing, cycling, kayaking, climbing, golf).",
    website_url: "https://moveunitedsport.org/", phone: "301-217-0960",
    address: "451 Hungerford Dr, Suite 100", city: "Rockville", zip: "20850",
    source_name: "Move United" },

  { section: "D", title: "K9s For Warriors Rhode Island",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "K9s For Warriors — national nonprofit providing service dogs at no cost to post-9/11 RI veterans suffering from PTSD, TBI, or military sexual trauma. 21-day on-campus training in FL pairs veteran + rescue dog; lifetime support, food + veterinary expenses included.",
    website_url: "https://k9sforwarriors.org/", phone: "904-686-1956",
    address: "260 Industrial Blvd", city: "Ponte Vedra", zip: "32081",
    source_name: "K9s For Warriors" },

  { section: "D", title: "Americas VetDogs Rhode Island Service Dogs",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "America's VetDogs — Smithtown NY-based national nonprofit providing service + guide + facility + PTSD service dogs at no cost to disabled RI veterans + active-duty + first responders. Lifetime follow-up support; trains 100+ dogs/year.",
    website_url: "https://www.vetdogs.org/", phone: "631-930-9000",
    address: "371 E Jericho Tpke", city: "Smithtown", zip: "11787",
    source_name: "America's VetDogs" },

  { section: "D", title: "Paralyzed Veterans of America New England Chapter",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "PVA New England Chapter — VA-accredited congressionally-chartered VSO serving spinal-cord-injured + ALS + MS RI veterans. Benefits + claims advocacy, hospital liaison at Providence VAMC + West Roxbury VA SCI Center, sports + recreation, accessible housing + vehicle grants.",
    website_url: "https://newengland.pva.org/", phone: "800-660-1181",
    address: "1208 VFW Pkwy", city: "West Roxbury", zip: "02132",
    source_name: "Paralyzed Veterans of America New England Chapter" },

  { section: "D", title: "Blinded Veterans Association New England Regional Group",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Blinded Veterans Association (BVA) New England Regional Group — VA-accredited congressionally-chartered VSO serving blinded + visually-impaired RI veterans + families. Benefits + claims advocacy, peer support, BVA Auxiliary, and Blind Rehab Center liaison at West Haven VAMC.",
    website_url: "https://bva.org/", phone: "800-669-7079",
    address: "125 N West St, Suite 400", city: "Alexandria", zip: "22314",
    source_name: "Blinded Veterans Association" },

  { section: "D", title: "DAV Service Officer Providence VA Medical Center",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "DAV (Disabled American Veterans) National Service Officer — full-time VA-accredited claims representative based at Providence VA Medical Center. Free representation for RI veterans filing service-connected disability claims, appeals, and BVA hearings.",
    website_url: "https://www.dav.org/veterans/find-your-local-office/", phone: "401-273-7100",
    address: "830 Chalkstone Ave", city: "Providence", zip: "02908",
    source_name: "Disabled American Veterans" },

  { section: "D", title: "Veterans Inc Rhode Island Disabled Veterans Outreach",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Veterans Inc — Worcester MA-based regional veteran service nonprofit serving RI + MA + CT + NH + ME + VT. Disabled-veteran outreach, supportive services for veteran families (SSVF), employment + housing for disabled vets, and HVRP homeless reintegration program.",
    website_url: "https://www.veteransinc.org/", phone: "800-482-2565",
    address: "69 Grove St", city: "Worcester", zip: "01605",
    source_name: "Veterans Inc." },

  // ===========================================================================
  // S. SUBSTANCE RECOVERY (12) — HIGH PRIORITY
  // ===========================================================================
  { section: "S", title: "Alcoholics Anonymous Rhode Island Area 45 Central Office",
    cat: "substance-recovery", sub: "Peer Recovery Groups",
    desc: "Alcoholics Anonymous Rhode Island — Area 45 Central Office (Cranston) coordinating 600+ weekly AA meetings statewide. 24/7 hotline, online meeting directory, literature, sponsor referrals + Bridging the Gap program connecting newly-sober RI veterans to AA community.",
    website_url: "https://www.rhodeisland-aa.org/", phone: "401-438-8860",
    address: "100 Niantic Ave", city: "Cranston", zip: "02907",
    source_name: "AA Rhode Island Area 45" },

  { section: "S", title: "Narcotics Anonymous Greater Providence Area",
    cat: "substance-recovery", sub: "Peer Recovery Groups",
    desc: "Narcotics Anonymous (NA) Greater Providence Area — region of NA serving RI with 200+ weekly NA meetings statewide. 24/7 helpline, meeting directory, literature, sponsor + Bridging the Gap program connecting newly-released or treatment-completing RI veterans to NA community.",
    website_url: "https://gpana.org/", phone: "866-624-3578",
    address: "PO Box 6204", city: "Providence", zip: "02940",
    source_name: "Greater Providence Area Narcotics Anonymous" },

  { section: "S", title: "SMART Recovery Rhode Island Meetings",
    cat: "substance-recovery", sub: "Peer Recovery Groups",
    desc: "SMART Recovery — secular, science-based mutual-help addiction recovery program with weekly in-person + online meetings serving RI. CBT-grounded 4-Point Program addresses motivation, urges, thoughts/feelings/behaviors, and balanced living for RI veterans + families.",
    website_url: "https://meetings.smartrecovery.org/", phone: "440-951-5357",
    address: "7304 Mentor Ave, Suite F", city: "Mentor", zip: "44060",
    source_name: "SMART Recovery USA" },

  { section: "S", title: "AdCare Outpatient North Kingstown",
    cat: "substance-recovery", sub: "Outpatient Recovery",
    desc: "AdCare Rhode Island Outpatient — North Kingstown outpatient substance use disorder treatment site (part of AdCare Hospital network). Standard outpatient + intensive outpatient (IOP) + MAT (Suboxone, Vivitrol) + DUI services for RI adults incl. veterans.",
    website_url: "https://adcare.com/locations/rhode-island/", phone: "401-294-6160",
    address: "1950 Tower Hill Rd", city: "North Kingstown", zip: "02852",
    source_name: "AdCare Treatment Hospital" },

  { section: "S", title: "Discovery House Providence Methadone MAT",
    cat: "substance-recovery", sub: "Medication Assisted Treatment",
    desc: "Discovery House — Providence-area opioid treatment program licensed by SAMHSA + DEA + RI BHDDH. Methadone + buprenorphine + naltrexone MAT, individual + group counseling, peer recovery support, and MOMS pregnant-women program for RI adults incl. veterans.",
    website_url: "https://www.discoveryhouse.com/", phone: "401-941-2400",
    address: "975 Waterman Ave", city: "East Providence", zip: "02914",
    source_name: "Discovery House" },

  { section: "S", title: "CODAC Wakefield South County",
    cat: "substance-recovery", sub: "Medication Assisted Treatment",
    desc: "CODAC Behavioral Healthcare Wakefield — South County RI outpatient SUD site. Methadone + buprenorphine + naltrexone MAT, peer recovery, MOMS pregnant-women program, and counseling serving Washington County RI veterans + low-income adults.",
    website_url: "https://codacinc.org/locations/", phone: "401-789-1311",
    address: "850 Waterman Ave", city: "Wakefield", zip: "02879",
    source_name: "CODAC Behavioral Healthcare" },

  { section: "S", title: "CODAC Newport East Bay",
    cat: "substance-recovery", sub: "Medication Assisted Treatment",
    desc: "CODAC Behavioral Healthcare Newport — East Bay + Newport County outpatient SUD site. Methadone + buprenorphine + naltrexone MAT, peer recovery, and counseling serving Newport + Middletown + Portsmouth + Tiverton + Little Compton + Jamestown RI veterans + adults.",
    website_url: "https://codacinc.org/locations/", phone: "401-846-4150",
    address: "65 Valley Rd", city: "Middletown", zip: "02842",
    source_name: "CODAC Behavioral Healthcare" },

  { section: "S", title: "Anchor Recovery Community Center Wakefield",
    cat: "substance-recovery", sub: "Peer Recovery Groups",
    desc: "Anchor Recovery Community Center Wakefield — Washington County peer-run recovery community center. Peer recovery coaching, all-recovery meetings, sober social events, recovery housing referral, and family support groups for South County RI veterans in recovery.",
    website_url: "https://anchorrecovery.org/", phone: "401-294-6160",
    address: "275 High St", city: "Wakefield", zip: "02879",
    source_name: "Anchor Recovery Community Center" },

  { section: "S", title: "Providence VA Substance Use Disorder Program",
    cat: "substance-recovery", sub: "Outpatient Recovery",
    desc: "Providence VA Substance Use Disorder (SUD) Program — VHA-operated outpatient SUD clinic for RI veterans. Individual + group therapy, MAT (buprenorphine, naltrexone), dual-diagnosis treatment, intensive outpatient, and SUD-PTSD specialty programming via Mental Health Service.",
    website_url: "https://www.va.gov/providence-health-care/programs/substance-use-treatment/", phone: "401-273-7100",
    address: "830 Chalkstone Ave", city: "Providence", zip: "02908",
    source_name: "Providence VA Healthcare System" },

  { section: "S", title: "Stanley Street Treatment and Resources SSTAR",
    cat: "substance-recovery", sub: "Detox Programs",
    desc: "SSTAR (Stanley Street Treatment and Resources) — Fall River MA-based comprehensive SUD + behavioral health agency serving East Bay RI (East Providence, Tiverton, Little Compton, Bristol). Detox, MAT, residential, outpatient, family + women's program, and HIV services.",
    website_url: "https://sstar.org/", phone: "508-679-5222",
    address: "386 Stanley St", city: "Fall River", zip: "02720",
    source_name: "SSTAR" },

  { section: "S", title: "Spectrum Recovery Network Rhode Island",
    cat: "substance-recovery", sub: "Outpatient Recovery",
    desc: "Spectrum Health Systems — Worcester MA-based regional SUD + behavioral health provider with Rhode Island outpatient + reentry services. Methadone + buprenorphine MAT, outpatient + residential, and corrections-based programming serving RI veterans + reentering individuals.",
    website_url: "https://www.spectrumhealthsystems.org/", phone: "800-464-9555",
    address: "10 Mechanic St, Suite 302", city: "Worcester", zip: "01608",
    source_name: "Spectrum Health Systems" },

  { section: "S", title: "Bridgemark Warwick Substance Recovery",
    cat: "substance-recovery", sub: "Outpatient Recovery",
    desc: "Bridgemark — Warwick-based RI nonprofit SUD + behavioral health agency. Outpatient counseling, intensive outpatient (IOP), partial hospitalization (PHP), MAT, sober living, and adolescent + family programming for RI veterans + adults statewide.",
    website_url: "https://www.bridgemarkri.org/", phone: "401-781-2700",
    address: "1052 Park Ave", city: "Cranston", zip: "02910",
    source_name: "Bridgemark" },

  // ===========================================================================
  // M. FAMILY SUPPORT (10) — MEDIUM PRIORITY
  // ===========================================================================
  { section: "M", title: "Childrens Friend Providence",
    cat: "family-support", sub: "Family Counseling",
    desc: "Children's Friend — RI's oldest child-welfare agency (est. 1834). Early Head Start, Head Start, home visiting, family therapy, foster care, adoption, behavioral health, and Centers for Excellence serving low-income RI veteran + military families across Providence + Pawtucket + Newport.",
    website_url: "https://www.childrensfriendri.org/", phone: "401-276-4300",
    address: "153 Summer St", city: "Providence", zip: "02903",
    source_name: "Children's Friend" },

  { section: "M", title: "Foster Forward East Providence",
    cat: "family-support", sub: "Family Counseling",
    desc: "Foster Forward — East Providence-based RI nonprofit supporting youth in + transitioning from foster care. Foster + kinship + adoptive parent recruitment + training, Works Wonders youth career program, and family preservation for RI veteran + low-income families.",
    website_url: "https://www.fosterforward.net/", phone: "401-438-3900",
    address: "55 South Brow St", city: "East Providence", zip: "02914",
    source_name: "Foster Forward" },

  { section: "M", title: "Adoption Rhode Island Providence",
    cat: "family-support", sub: "Family Counseling",
    desc: "Adoption Rhode Island — statewide nonprofit recruiting + training adoptive parents for older youth + sibling groups + medical-needs children in RI foster care. Post-adoption support, Wendy's Wonderful Kids recruiter, and free educational events for RI veteran + adoptive families.",
    website_url: "https://www.adoptionri.org/", phone: "401-865-6000",
    address: "500 Prospect St", city: "Pawtucket", zip: "02860",
    source_name: "Adoption Rhode Island" },

  { section: "M", title: "Rhode Island Parent Information Network RIPIN",
    cat: "family-support", sub: "Family Counseling",
    desc: "RI Parent Information Network (RIPIN) — Cranston-based statewide parent-led nonprofit. Parent-to-parent peer support, special-education + IEP advocacy, health insurance navigation (Family Voices RI), and behavioral-health-link family support for RI veteran + military-connected children.",
    website_url: "https://ripin.org/", phone: "401-270-0101",
    address: "300 Jefferson Blvd, Suite 300", city: "Warwick", zip: "02888",
    source_name: "RI Parent Information Network" },

  { section: "M", title: "Tides Family Services West Warwick",
    cat: "family-support", sub: "Youth Programs",
    desc: "Tides Family Services — West Warwick-based RI nonprofit serving at-risk youth + families. In-home family therapy, Outreach + Tracking community-based supervision (DCYF/family-court), Project Hope mentoring, and reentry services for RI veteran + low-income youth statewide.",
    website_url: "https://www.tidesfamilyservices.org/", phone: "401-861-3601",
    address: "215 Washington St", city: "West Warwick", zip: "02893",
    source_name: "Tides Family Services" },

  { section: "M", title: "Easterseals Rhode Island Family Caregiver Support",
    cat: "family-support", sub: "Caregiver Support",
    desc: "Easterseals Rhode Island — Cranston-based statewide nonprofit serving children + adults with disabilities + their family caregivers incl. veteran families. Adult day, in-home support, autism + early intervention, military + veteran caregiver respite, and assistive technology lending.",
    website_url: "https://www.easterseals.com/ri/", phone: "401-284-1000",
    address: "225 Main St", city: "Pawtucket", zip: "02860",
    source_name: "Easterseals Rhode Island" },

  { section: "M", title: "Rhode Island National Guard Child and Youth Program",
    cat: "family-support", sub: "Youth Programs",
    desc: "Rhode Island National Guard Child + Youth Program — state-level program at Camp Fogarty serving children (5-18) of RI Guard + Reserve members. Youth symposiums, Operation Military Kids, deployment cycle support, summer camps, and back-to-school events.",
    website_url: "https://ri.ng.mil/Resources/Family-Programs/Child-Youth-Program/", phone: "401-275-4109",
    address: "330 Camp Fogarty, 2841 South County Trl", city: "East Greenwich", zip: "02818",
    source_name: "Rhode Island National Guard" },

  { section: "M", title: "Operation Homefront Hearts of Valor Caregiver Network",
    cat: "family-support", sub: "Caregiver Support",
    desc: "Operation Homefront Hearts of Valor — national peer-support network for caregivers of post-9/11 wounded, ill + injured RI service members + veterans. Online community, in-person retreats, caregiver education, respite weekends, and emergency financial assistance.",
    website_url: "https://www.heartsofvalor.org/", phone: "210-659-7756",
    address: "1355 Central Pkwy S, Suite 100", city: "San Antonio", zip: "78232",
    source_name: "Operation Homefront" },

  { section: "M", title: "Military Family Advisory Network Rhode Island",
    cat: "family-support", sub: "Military Family Support",
    desc: "Military Family Advisory Network (MFAN) — national nonprofit conducting research + delivering programs serving RI military + veteran families. Food + financial security distributions, perinatal mental health support, peer-to-peer caregiver community, and quality-of-life advocacy.",
    website_url: "https://militaryfamilyadvisorynetwork.org/", phone: "210-446-1006",
    address: "1320 Main St, Suite 300", city: "Columbia", zip: "29201",
    source_name: "Military Family Advisory Network" },

  { section: "M", title: "Family Service of Rhode Island Mobile Crisis",
    cat: "family-support", sub: "Family Counseling",
    desc: "Family Service of RI Kids' Link RI Mobile Crisis — statewide 24/7 mobile crisis intervention team for RI children + youth (under 18) experiencing behavioral health crisis. Telephone triage, in-home crisis stabilization, safety planning, and warm-handoff to outpatient care.",
    website_url: "https://www.familyserviceri.org/services/kids-link-ri/", phone: "855-543-5465",
    address: "55 Hope St", city: "Providence", zip: "02906",
    source_name: "Family Service of Rhode Island" },

  // ===========================================================================
  // E. EDUCATION (8) — MEDIUM PRIORITY
  // ===========================================================================
  { section: "E", title: "New England Institute of Technology Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "New England Institute of Technology (NEIT) — East Greenwich-based private technical university. Yellow Ribbon GI Bill, VR&E approved, on-site VetSuccess advisor, 50+ associate + bachelor + master programs (engineering, IT, healthcare, business) for RI student-veterans.",
    website_url: "https://www.neit.edu/admissions/military", phone: "401-739-5000",
    address: "1 New England Tech Blvd", city: "East Greenwich", zip: "02818",
    source_name: "New England Institute of Technology" },

  { section: "E", title: "Salve Regina University Veterans Newport",
    cat: "education", sub: "College & University Programs",
    desc: "Salve Regina University — Newport-based private Catholic university. Yellow Ribbon GI Bill, military spouse MyCAA approved, transfer credit for military training, on-site veteran advisor + lounge, and Salve Veterans Association student org for RI student-veterans + dependents.",
    website_url: "https://salve.edu/admissions-aid/military-and-veterans", phone: "401-847-6650",
    address: "100 Ochre Point Ave", city: "Newport", zip: "02840",
    source_name: "Salve Regina University" },

  { section: "E", title: "Bryant University Veterans Smithfield",
    cat: "education", sub: "College & University Programs",
    desc: "Bryant University — Smithfield-based private business + liberal arts university. Yellow Ribbon GI Bill, military-friendly designation, Student Veterans of America chapter, transfer credit for military training, and dedicated veteran academic advising for RI student-vets.",
    website_url: "https://www.bryant.edu/admission-aid/transfer-and-veteran-students/veterans-and-military-affiliated-students", phone: "401-232-6000",
    address: "1150 Douglas Pike", city: "Smithfield", zip: "02917",
    source_name: "Bryant University" },

  { section: "E", title: "Providence College Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "Providence College — Providence-based private Catholic Dominican university. Yellow Ribbon GI Bill, Student Veterans of America chapter, transfer credit for military training, on-site veteran academic advisor, and PC Vets community for RI student-veterans + dependents.",
    website_url: "https://veterans.providence.edu/", phone: "401-865-1000",
    address: "1 Cunningham Sq", city: "Providence", zip: "02918",
    source_name: "Providence College" },

  { section: "E", title: "Johnson and Wales University Veterans Providence",
    cat: "education", sub: "College & University Programs",
    desc: "Johnson & Wales University Providence — private culinary, business, hospitality + arts university. Yellow Ribbon GI Bill, military spouse MyCAA approved, transfer credit for military training, on-site veteran advisor + Student Veterans Org for RI student-veterans + dependents.",
    website_url: "https://www.jwu.edu/admissions/military.html", phone: "401-598-1000",
    address: "8 Abbott Park Pl", city: "Providence", zip: "02903",
    source_name: "Johnson & Wales University" },

  { section: "E", title: "Rhode Island National Guard Tuition Assistance Program",
    cat: "education", sub: "Tuition Assistance",
    desc: "RI National Guard State Tuition Assistance — state-funded program covering up to 100% tuition + fees at any RI public college/university (URI, RIC, CCRI) for active drilling members of RI Army + Air National Guard. Stackable with federal Tuition Assistance + GI Bill.",
    website_url: "https://ri.ng.mil/Resources/Education-Services/", phone: "401-275-4109",
    address: "330 Camp Fogarty, 2841 South County Trl", city: "East Greenwich", zip: "02818",
    source_name: "Rhode Island National Guard" },

  { section: "E", title: "Service to School VetLink College Counseling",
    cat: "education", sub: "College & University Programs",
    desc: "Service to School (S2S) — national nonprofit providing free college + grad-school admissions counseling to RI veterans + service members. Volunteer ambassador-mentors (alumni of target schools), undergraduate (VetLink) + MBA (S2S MBA) + law (S2S Law) tracks.",
    website_url: "https://www.service2school.org/", phone: "646-661-1430",
    address: "200 Park Ave South, 8th Floor", city: "New York", zip: "10003",
    source_name: "Service to School" },

  { section: "E", title: "Posse Foundation Veterans Program",
    cat: "education", sub: "College & University Programs",
    desc: "Posse Foundation Veterans Program — national nonprofit identifying + training post-9/11 veterans for top-tier liberal arts colleges (Vassar, Wesleyan, Dartmouth) on full merit-based Posse Scholarship. Cohort-based pre-collegiate training; supports RI applicants via Boston site.",
    website_url: "https://www.possefoundation.org/shaping-the-future/posse-veterans-program", phone: "212-405-1691",
    address: "14 Wall St, 8th Floor", city: "New York", zip: "10005",
    source_name: "Posse Foundation" },

  // ===========================================================================
  // L. LEGAL (8) — MEDIUM PRIORITY
  // ===========================================================================
  { section: "L", title: "Rhode Island Veterans Treatment Court Providence",
    cat: "legal", sub: "Veterans Legal Clinics",
    desc: "Rhode Island Veterans Treatment Court — Providence-based specialty docket of RI District Court diverting RI veterans charged with non-violent offenses into treatment-based supervision. Veteran mentors, VA partnership, MAT, mental health treatment, and judicial monitoring.",
    website_url: "https://www.courts.ri.gov/Courts/districtcourt/Pages/Veterans-Court.aspx", phone: "401-458-5300",
    address: "1 Dorrance Plz, Garrahy Judicial Complex", city: "Providence", zip: "02903",
    source_name: "Rhode Island Judiciary" },

  { section: "L", title: "American Bar Association Military Pro Bono Project",
    cat: "legal", sub: "Pro Bono Legal Services",
    desc: "ABA Military Pro Bono Project — Standing Committee on Legal Assistance for Military Personnel program connecting active-duty military + RI veterans with civilian pro bono attorneys for non-criminal legal matters beyond Legal Assistance Office scope. Family, consumer, landlord-tenant.",
    website_url: "https://www.militaryprobono.org/", phone: "202-662-1000",
    address: "321 N Clark St", city: "Chicago", zip: "60654",
    source_name: "American Bar Association" },

  { section: "L", title: "NVLSP Lawyers Serving Warriors Hotline",
    cat: "legal", sub: "Pro Bono Legal Services",
    desc: "National Veterans Legal Services Program (NVLSP) — Washington DC-based nonprofit law firm. Free legal representation, training of VSO claims agents, class-action + impact litigation against VA, Lawyers Serving Warriors hotline, and Discharge Upgrade Manual for RI veterans.",
    website_url: "https://www.nvlsp.org/", phone: "202-265-8305",
    address: "1100 Wilson Blvd, Suite 900", city: "Arlington", zip: "22209",
    source_name: "National Veterans Legal Services Program" },

  { section: "L", title: "Stateside Legal Online Resource",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Stateside Legal — national online legal information + resource library for low-income veterans + service members + families incl. RI. Maintained by Pine Tree Legal Assistance + LSC; legal forms, self-help guides, lawyer-finder, and military-specific legal articles.",
    website_url: "https://statesidelegal.org/", phone: "207-774-8211",
    address: "88 Federal St", city: "Portland", zip: "04101",
    source_name: "Pine Tree Legal Assistance" },

  { section: "L", title: "Rhode Island Disability Law Center",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Rhode Island Disability Law Center (RIDLC) — Providence-based protection + advocacy agency for Rhode Islanders with disabilities incl. disabled veterans. Special education, employment discrimination, voting access, ADA, healthcare access, and abuse + neglect investigations.",
    website_url: "https://www.ridlc.org/", phone: "401-831-3150",
    address: "275 Westminster St, Suite 401", city: "Providence", zip: "02903",
    source_name: "Rhode Island Disability Law Center" },

  { section: "L", title: "Rhode Island Office of the Public Defender Veterans",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Rhode Island Office of the Public Defender — state agency providing free criminal defense to indigent RI defendants incl. veterans. Veterans Treatment Court representation, Mental Health Court representation, and Juvenile + Adult appellate divisions statewide.",
    website_url: "https://www.ripd.org/", phone: "401-222-3492",
    address: "160 Pine St", city: "Providence", zip: "02903",
    source_name: "Rhode Island Office of the Public Defender" },

  { section: "L", title: "Swords to Plowshares Discharge Upgrade Resource",
    cat: "legal", sub: "Pro Bono Legal Services",
    desc: "Swords to Plowshares — national veteran legal advocacy + service organization. Free Discharge Upgrade Manual + online self-help, MST + PTSD-related discharge upgrade representation referrals, and policy advocacy benefiting RI veterans with less-than-honorable discharges.",
    website_url: "https://www.swords-to-plowshares.org/", phone: "415-252-4788",
    address: "1060 Howard St", city: "San Francisco", zip: "94103",
    source_name: "Swords to Plowshares" },

  { section: "L", title: "Rhode Island Legal Services Newport Office",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Rhode Island Legal Services Newport County Office — RILS branch serving Newport + Bristol counties (Newport, Middletown, Portsmouth, Tiverton, Little Compton, Jamestown, Bristol, Warren, Barrington). Free civil legal aid in housing, family, public benefits + consumer for RI veterans.",
    website_url: "https://www.rils.org/", phone: "401-846-2264",
    address: "50 Washington Sq", city: "Newport", zip: "02840",
    source_name: "Rhode Island Legal Services" },
];

await runSeed(ROWS, {
  state: "RI",
  commit: COMMIT,
  scriptName: "seed-ri-wave2.ts (Golden Standard Wave 2 / RI category depth)",
  urlCheckTimeoutMs: 12000,
  allowBrokenUrls: ALLOW_BROKEN_URLS,
  allowZipBleed: ALLOW_ZIP_BLEED,
  sectionLabels: {
    F: "Financial",
    D: "Disabled Veterans",
    S: "Substance Recovery",
    M: "Family Support",
    E: "Education",
    L: "Legal",
  },
});
