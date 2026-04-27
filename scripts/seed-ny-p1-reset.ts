/**
 * NEW YORK — PHASE 1 RESET (FOUNDER MASTER DIRECTIVE 2026-04-27)
 *
 * Additive statewide-backbone strengthening per the FOUNDER MASTER DIRECTIVE
 * "NEW YORK CLEAN REBUILD + PERMANENT PHASE LAW".
 *
 * Existing P1 (64 rows shipped earlier) is PRESERVED — additive only, no deletes.
 * This pass plugs the statewide gaps the law calls out:
 *   - underbuilt LAYER 2 (mainstream resources veterans actually use)
 *   - missing statewide VSO Departments (AMVETS, VVA, MOPH, JWV, ALA, VFW Aux)
 *   - missing NYS DMNA (state military/naval authority — separate from DVS)
 *   - missing NG Family Programs / ESGR / WWP statewide
 *   - missing statewide community pillars (Salvation Army, United Way, Goodwill, Red Cross)
 *   - missing statewide food/housing/disability/aging/education/insurance/crisis backbone
 *
 * 26 rows shipped. 9 LAYER 1 (vet-specific). 17 LAYER 2 (mainstream).
 * (3 dropped pre-commit as already-in-DB: WWP, NYSCADV, Feeding NYS.)
 *
 * P1 rule (Permanent Phase Bible): statewide backbone only — NO county deep dive,
 *                                  NO metro saturation, NO healthcare deep dive (P2).
 *
 * Florida-benchmark canonical-source verification:
 *   - Every URL probed live before commit (HEAD/GET 200 with engine UA, or 200 with browser UA).
 *   - Phones / addresses sourced from each org's Contact / About page or canonical .gov / .org dataset.
 *   - National-org rows that lack a NY-specific anchor are tagged with the org's HQ city
 *     (engine accepts NULL address; city is required).
 *   - Skipped (URL/anchor failures, will not retry this run): MCL Dept of NY (DNS fail),
 *     ALA NY Dept page (404), NYS Catholic Conf (policy umbrella, not direct service),
 *     NYSCASA (403 to all UAs), DMV Veterans Info (404), Tax Dept Vet Exemption (404),
 *     NYSBA Lawyer Referral (404).
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";
const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");

const ROWS: SeedRow[] = [
  // ========================================================================
  // LAYER 1 — VETERAN-SPECIFIC STATEWIDE BACKBONE (10 rows)
  // ========================================================================

  // -- A: Statewide VSO Departments (additional to Legion / VFW / DAV already in P1) --
  { section: "VSO-DEPT", title: "AMVETS (American Veterans)",
    cat: "community-support", sub: "Veteran Service Organizations",
    city: "Lanham", website_url: "https://amvets.org/",
    source_name: "AMVETS National HQ", source_type: "nonprofit",
    phone: "877-726-8387", address: "4647 Forbes Boulevard, Lanham, MD 20706",
    desc: "AMVETS — congressionally chartered Veterans Service Organization with a Department of New York and posts statewide. National service-officer network files VA disability/pension/healthcare claims at no charge for any honorably discharged veteran (any era), advocates for legislative priorities, runs Career Centers, scholarships, and color-guard programs. NY veterans use the post locator on amvets.org to find the nearest accredited service officer." },

  { section: "VSO-DEPT", title: "Vietnam Veterans of America — New York State Council",
    cat: "community-support", sub: "Veteran Service Organizations",
    city: "Silver Spring", website_url: "https://www.vva.org/state-councils/new-york/",
    source_name: "Vietnam Veterans of America", source_type: "nonprofit",
    phone: "301-585-4000", address: "8719 Colesville Road, Suite 100, Silver Spring, MD 20910",
    desc: "Vietnam Veterans of America NY State Council — congressionally chartered VSO; the only national vet org dedicated solely to Vietnam-era veterans and their families. NY State Council coordinates 50+ NY chapters, accredited claims service for VA disability filings (Agent Orange / PTSD presumptives a specialty), and the Veterans Initiative for POW/MIA accounting." },

  { section: "VSO-DEPT", title: "Military Order of the Purple Heart",
    cat: "community-support", sub: "Veteran Service Organizations",
    city: "Springfield", website_url: "https://www.purpleheart.org/",
    source_name: "Military Order of the Purple Heart", source_type: "nonprofit",
    phone: "703-642-5360", address: "5413-B Backlick Road, Springfield, VA 22151",
    desc: "Military Order of the Purple Heart — congressionally chartered VSO open to combat-wounded veterans awarded the Purple Heart. NY state and chapter network provides VA-accredited claims representation (combat-injury / PTSD / TBI a specialty), patient escorts at NY VAMCs, scholarship programs for combat-injured veterans' children, and advocacy for combat-disability policy." },

  { section: "VSO-DEPT", title: "Jewish War Veterans of the USA — Department of New York",
    cat: "community-support", sub: "Veteran Service Organizations",
    city: "Washington", website_url: "https://www.jwv.org/",
    source_name: "Jewish War Veterans of the USA", source_type: "nonprofit",
    phone: "202-265-6280", address: "1811 R Street NW, Washington, DC 20009",
    desc: "Jewish War Veterans of the USA — the oldest active veterans' organization in America (founded 1896, congressionally chartered). Department of New York is one of the largest and most active state departments. Accredited VA claims service, anti-discrimination advocacy, scholarship programs, and Combat Antisemitism initiatives. Membership open to Jewish veterans of any branch / era." },

  { section: "VSO-DEPT", title: "American Legion Auxiliary",
    cat: "family-support", sub: "Military Family Support",
    city: "Indianapolis", website_url: "https://www.alaforveterans.org/",
    source_name: "American Legion Auxiliary National HQ", source_type: "nonprofit",
    phone: "317-955-3845", address: "3450 Founders Road, Indianapolis, IN 46268",
    desc: "American Legion Auxiliary — world's largest women's patriotic service organization (~600,000 members, congressionally chartered). Department of New York operates 600+ local Units alongside Legion Posts statewide; programs include Veterans Affairs & Rehabilitation (hospital visiting, supplies for VA inpatients), Children & Youth (scholarships, hospital care for veterans' kids), and Operation Comfort Warriors (deployed-troop care packages, NY units pack thousands annually)." },

  { section: "VSO-DEPT", title: "VFW Auxiliary Department of New York",
    cat: "family-support", sub: "Military Family Support",
    city: "Albany", website_url: "https://www.vfwauxny.org/",
    source_name: "VFW Auxiliary Department of New York", source_type: "nonprofit",
    phone: "816-561-8655", address: null as unknown as string,
    desc: "VFW Auxiliary Department of New York — eligible-relative auxiliary to VFW posts statewide (~150 NY auxiliary units). Programs include hospital volunteering at NY VAMCs, scholarship awards (Patriot's Pen / Voice of Democracy / Continuing Education for spouses), Buddy Poppy distributions, and Unmet Needs grants for veteran families in financial crisis." },

  // -- B: NYS Division of Military and Naval Affairs (state-military authority, NOT DVS) --
  { section: "STATE-MIL", title: "New York State Division of Military and Naval Affairs (DMNA)",
    cat: "community-support", sub: "Veteran Outreach Programs",
    city: "Latham", website_url: "https://dmna.ny.gov/",
    source_name: "NYS Division of Military and Naval Affairs", source_type: "state_government",
    phone: "518-786-4400", address: "330 Old Niskayuna Road, Latham, NY 12110",
    desc: "NYS Division of Military and Naval Affairs (DMNA) — cabinet agency commanded by The Adjutant General; oversees the NY Army National Guard, NY Air National Guard, NY Naval Militia, and NY Guard. Distinct from NYS Department of Veterans' Services (DVS): DMNA serves currently-serving guardsmen / state-active-duty soldiers; runs Family Programs, State Active Duty pay/benefits, and the Joining Community Forces NY transition liaison network." },

  { section: "STATE-MIL", title: "NY National Guard Family Programs",
    cat: "family-support", sub: "Military Family Support",
    city: "Latham", website_url: "https://dmna.ny.gov/family/",
    source_name: "NYS Division of Military and Naval Affairs", source_type: "state_government",
    phone: "518-786-4515", address: "330 Old Niskayuna Road, Latham, NY 12110",
    desc: "NY National Guard Family Programs — DMNA-run family-readiness backbone for NY Guard families: 30+ NY Family Assistance Centers (FAC) statewide, Yellow Ribbon Reintegration Program (pre/during/post-deployment), Survivor Outreach Services (Gold Star families), Child & Youth Services, Military OneSource liaison, Strong Bonds chaplain retreats, and emergency financial assistance via the NY Military Relief Fund." },

  { section: "STATE-MIL", title: "ESGR State Committee of New York",
    cat: "employment", sub: "Veteran-Friendly Employers",
    city: "Albany", website_url: "https://www.esgr.mil/About-ESGR/State-Committees/New-York",
    source_name: "Employer Support of the Guard and Reserve (DoD)", source_type: "federal_government",
    phone: "800-336-4590", address: null as unknown as string,
    desc: "Employer Support of the Guard and Reserve (ESGR) State Committee of New York — DoD volunteer-run committee that mediates USERRA (Uniformed Services Employment and Reemployment Rights Act) employer/employee disputes for NY Guardsmen and Reservists. Free informal mediation before any USERRA case escalates to DOL VETS or the courts. Also runs the NY Statement of Support program and annual Patriot Awards for vet-friendly NY employers." },

  // -- C: Statewide veteran nonprofit additional to those already in P1 --
  // (Wounded Warrior Project already in DB as national/Benefits-Assistance row — skipped here, not a duplicate)

  // ========================================================================
  // LAYER 2 — MAINSTREAM STATEWIDE BACKBONE (19 rows)
  // ========================================================================

  // -- D: Faith-based / community pillars --
  { section: "COMMUNITY-PILLAR", title: "Salvation Army Empire State Division",
    cat: "community-support", sub: "Volunteer & Mission-Based Community",
    city: "Syracuse", website_url: "https://empire.salvationarmy.org/",
    source_name: "Salvation Army Empire State Division", source_type: "nonprofit",
    phone: "315-434-1300", address: "200 Twin Oaks Drive, Syracuse, NY 13206",
    desc: "Salvation Army Empire State Division — operates 70+ corps community centers across upstate NY (Albany Capital Region, Syracuse, Rochester, Buffalo, Binghamton, Watertown, Plattsburgh and the Hudson Valley). Programs serving veterans: emergency shelter, transitional housing, food pantries / hot meals, utility assistance, addiction recovery (Adult Rehabilitation Centers in Buffalo, Rochester, Syracuse, Albany), holiday meal/toy assistance, and pastoral care. Greater NY Division (NYC / Long Island / Westchester) operates separately." },

  { section: "COMMUNITY-PILLAR", title: "United Way of New York State",
    cat: "community-support", sub: "Veteran Outreach Programs",
    city: "Albany", website_url: "https://www.uwnys.org/",
    source_name: "United Way of New York State", source_type: "nonprofit",
    phone: "518-489-4791", address: "99 Pine Street, Suite 220, Albany, NY 12207",
    desc: "United Way of New York State — statewide federation of 24+ local United Ways covering all 62 NY counties. Coordinates the 211 NY information & referral system (211 calls route to local United Way 211 hubs), United for ALICE (Asset Limited / Income Constrained / Employed) data on working-poor NY households, and Mission United (where chartered, free veteran case-management). Local United Way directories link veterans to county-level food pantries, rent help, utility assistance, and tax preparation." },

  { section: "COMMUNITY-PILLAR", title: "Goodwill Industries of Greater New York & Northern New Jersey",
    cat: "employment", sub: "Job Placement Programs",
    city: "Astoria", website_url: "https://goodwillnynj.org/",
    source_name: "Goodwill Industries of Greater NY & Northern NJ", source_type: "nonprofit",
    phone: "718-728-5400", address: "4-21 27th Avenue, Astoria, NY 11102",
    desc: "Goodwill Industries of Greater New York & Northern New Jersey — operates 40+ retail stores and a workforce-development network serving veterans, people with disabilities, and individuals returning from incarceration. Free programs: career counseling, paid on-the-job training in retail/logistics/digital skills, supported employment for vets with disabilities, and the Veterans Employment program (DOL grant-funded job-placement and apprenticeship pathways into trucking, warehousing, and IT)." },

  // -- E: Red Cross regional infrastructure --
  { section: "RED-CROSS", title: "American Red Cross Greater New York Region",
    cat: "community-support", sub: "Volunteer & Mission-Based Community",
    city: "New York", website_url: "https://www.redcross.org/local/new-york/greater-new-york.html",
    source_name: "American Red Cross", source_type: "nonprofit",
    phone: "877-733-2767", address: "520 West 49th Street, New York, NY 10019",
    desc: "American Red Cross Greater New York Region — serves NYC, Long Island, the Lower Hudson Valley, and Westchester. Hero Care Network connects active-duty service members and NY veterans to emergency communications (death/illness messages 24/7), financial assistance (military aid society referrals), reconnection workshops for transitioning veterans, and disaster casework. Operates emergency shelters during NYC-area disasters; critical for veterans displaced by storms or fires." },

  { section: "RED-CROSS", title: "American Red Cross Eastern New York Region",
    cat: "community-support", sub: "Volunteer & Mission-Based Community",
    city: "Albany", website_url: "https://www.redcross.org/local/new-york/eastern-new-york.html",
    source_name: "American Red Cross", source_type: "nonprofit",
    phone: "518-458-8111", address: "200 Hackett Boulevard, Albany, NY 12209",
    desc: "American Red Cross Eastern New York Region — serves the Capital Region, Mohawk Valley, North Country, and parts of the Adirondacks (24 counties). Hero Care Network for active-duty military / veteran emergency communications and financial assistance, disaster response (Capital Region floods, Adirondack wildfires), and home-fire smoke-alarm installation (Sound the Alarm) — vets are a priority population." },

  { section: "RED-CROSS", title: "American Red Cross Western New York Region",
    cat: "community-support", sub: "Volunteer & Mission-Based Community",
    city: "Buffalo", website_url: "https://www.redcross.org/local/new-york/western-new-york.html",
    source_name: "American Red Cross", source_type: "nonprofit",
    phone: "716-886-7500", address: "786 Delaware Avenue, Buffalo, NY 14209",
    desc: "American Red Cross Western New York Region — serves Buffalo, Rochester, the Finger Lakes, the Southern Tier, and Central NY (covering Erie, Niagara, Monroe, Onondaga and surrounding counties). Hero Care Network for veteran/military emergency communications and financial assistance, lake-effect blizzard shelter operations, and the Service to the Armed Forces office for transitioning Reserve / Guard members in Western NY." },

  { section: "RED-CROSS", title: "American Red Cross — New York (Statewide Locator)",
    cat: "community-support", sub: "Volunteer & Mission-Based Community",
    city: "Albany", website_url: "https://www.redcross.org/local/new-york.html",
    source_name: "American Red Cross", source_type: "nonprofit",
    phone: "800-733-2767", address: "200 Hackett Boulevard, Albany, NY 12209",
    desc: "American Red Cross — New York statewide locator portal. Routes NY veterans and families to the correct regional chapter (Greater NY / Eastern NY / Western NY) based on county. Provides one-stop entry to Hero Care Network (24/7 line 877-272-7337 for active duty/veterans), financial assistance casework, blood services, disaster relief, and CPR/AED training discounts for veterans." },

  // -- F: Statewide food, housing, and disability backbone --
  // (Feeding New York State already in NY P3 — skipped here, not a duplicate)
  { section: "STATE-FOOD", title: "Hunger Solutions New York",
    cat: "food-assistance", sub: "SNAP Assistance",
    city: "Albany", website_url: "https://hungersolutionsny.org/",
    source_name: "Hunger Solutions New York", source_type: "nonprofit",
    phone: "518-436-8757", address: "100 Great Oaks Boulevard, Albany, NY 12203",
    desc: "Hunger Solutions New York — statewide nonprofit dedicated to ending hunger across NY. Operates the NY SNAP Helpline (1-800-697-1220) for free over-the-phone SNAP application assistance — veterans frequently underutilize SNAP and Hunger Solutions specifically targets older / disabled veterans for outreach. Also coordinates summer meals, school breakfast/lunch outreach, WIC awareness, and policy advocacy on the Hunger Prevention and Nutrition Assistance Program (HPNAP)." },

  { section: "STATE-HOUSING", title: "Coalition for the Homeless of New York City",
    cat: "housing", sub: "Homeless Veteran Services",
    city: "New York", website_url: "https://www.coalitionforthehomeless.org/",
    source_name: "Coalition for the Homeless", source_type: "nonprofit",
    phone: "212-776-2000", address: "129 Fulton Street, New York, NY 10038",
    desc: "Coalition for the Homeless — nation's oldest homeless-advocacy organization (founded 1981). Serves NYC's homeless population (including ~1,500 homeless veterans nightly) with: Crisis Intervention Program (housing/benefits casework, intake 1-888-358-2384), Grand Central Food Program (mobile soup line — 8 stops nightly), Project Renewal supportive-housing partnerships, eviction-prevention assistance, and statewide policy advocacy (NY State Homeless Veteran Reintegration Program funding). Walk-in intake at 129 Fulton St." },

  { section: "STATE-DISABILITY", title: "Disability Rights New York (DRNY)",
    cat: "disabled-veterans", sub: "Legal Advocacy & Rights",
    city: "Rensselaer", website_url: "https://www.drny.org/",
    source_name: "Disability Rights New York", source_type: "nonprofit",
    phone: "518-432-7861", address: "279 Troy Road, Suite 9, PMB 236, Rensselaer, NY 12144",
    desc: "Disability Rights New York (DRNY) — federally designated Protection & Advocacy (P&A) and Client Assistance (CAP) system for NY. Free legal services, advocacy, and information for NY-resident people with disabilities (including service-connected disabled veterans): SSI/SSDI assistance, ADA enforcement, accessible voting, special education, abuse & neglect investigation in institutional settings (state psych hospitals, nursing homes), and PABSS (employment supports for SSI/SSDI beneficiaries). Statewide intake 1-800-993-8982 / 518-432-7861 (TTY 800-624-4143)." },

  { section: "STATE-LEGAL", title: "New York Lawyers for the Public Interest (NYLPI)",
    cat: "legal", sub: "Legal Aid Services",
    city: "New York", website_url: "https://www.nylpi.org/",
    source_name: "New York Lawyers for the Public Interest", source_type: "nonprofit",
    phone: "212-244-4664", address: "151 West 30th Street, 11th Floor, New York, NY 10001",
    desc: "New York Lawyers for the Public Interest (NYLPI) — civil-rights legal nonprofit. Disability Justice Program: free legal representation for NY-resident veterans (and others) with disabilities on housing-discrimination, accessibility, public-benefits, and special-education matters. Health Justice Program: covers immigrant veterans and uninsured veterans on healthcare access. Pro bono clearinghouse links low-income vets to NY's largest law-firm pro bono volunteer pool." },

  // -- G: Statewide education, insurance, aging, crisis, mental health --
  { section: "STATE-EDU", title: "NYS Higher Education Services Corporation (HESC)",
    cat: "education", sub: "Tuition Assistance",
    city: "Albany", website_url: "https://www.hesc.ny.gov/",
    source_name: "NYS Higher Education Services Corporation", source_type: "state_government",
    phone: "888-697-4372", address: "99 Washington Avenue, Albany, NY 12255",
    desc: "NYS Higher Education Services Corporation (HESC) — state agency that administers all NY college-aid programs (TAP, Excelsior, Get on Your Feet Loan Forgiveness) and the NY Veterans Tuition Awards, Military Service Recognition Scholarship, Military Enhanced Recognition Incentive & Tribute (MERIT) award. HESC is the NY State Approving Agency for VA GI Bill institutional approval — every NY school accepting GI Bill must be HESC-approved. Direct vet-aid hotline 1-888-697-4372 ext 4." },

  { section: "STATE-INS", title: "NY State of Health (Health Plan Marketplace)",
    cat: "insurance", sub: "Health Insurance",
    city: "Albany", website_url: "https://nystateofhealth.ny.gov/",
    source_name: "NY State of Health Marketplace", source_type: "state_government",
    phone: "855-355-5777", address: "P.O. Box 11774, Albany, NY 12211",
    desc: "NY State of Health — official NY ACA Health Plan Marketplace operated by the Department of Health. Veterans not enrolled in VA healthcare (or wanting coverage for non-service-connected dependents / spouses) shop Qualified Health Plans, Essential Plan ($0-$20/mo for low-income), Medicaid, and Child Health Plus. Free in-person help via 1,000+ statewide Navigators / Certified Application Counselors; year-round enrollment for Medicaid/Essential Plan/CHP, Nov-Jan open enrollment for QHPs." },

  { section: "STATE-AGING", title: "New York State Office for the Aging (NYSOFA)",
    cat: "end-of-life-services", sub: "Senior & Disabled Meal Programs",
    city: "Albany", website_url: "https://aging.ny.gov/",
    source_name: "NYS Office for the Aging", source_type: "state_government",
    phone: "800-342-9871", address: "2 Empire State Plaza, Albany, NY 12223",
    desc: "NYS Office for the Aging (NYSOFA) — cabinet agency overseeing the NY Aging Network: 59 county / NYC Area Agencies on Aging (AAAs) statewide. Programs serving NY's ~600,000 veterans aged 60+: home-delivered meals (Meals on Wheels) and congregate dining, in-home services (personal care, housekeeping, respite for caregivers), Title III caregiver support, the Long Term Care Ombudsman Program (advocates for nursing-home residents — many are veterans), Health Insurance Information Counseling (HIICAP / SHIP). Statewide infoline 1-800-342-9871." },

  // (NY State Coalition Against Domestic Violence already in NY P1 helplines — skipped here, not a duplicate)
  { section: "STATE-MH", title: "NAMI New York State",
    cat: "mental-health", sub: "Peer Support",
    city: "Albany", website_url: "https://naminys.org/",
    source_name: "NAMI New York State", source_type: "nonprofit",
    phone: "518-462-2000", address: "99 Pine Street, Suite 105, Albany, NY 12207",
    desc: "NAMI New York State — state organization of the National Alliance on Mental Illness; coordinates 30+ NY county affiliates. Free programs serving veterans and their families: NAMI Family-to-Family education for caregivers of veterans with PTSD/depression/serious mental illness, NAMI Peer-to-Peer (peer-led classes for vets in recovery), Family Support Groups (county affiliates), the NY NAMI HelpLine (1-800-950-6264), and Homefront — NAMI's program specifically designed for families of military service members and veterans living with mental health conditions." },

  // -- H: Statewide community / addiction --
  { section: "STATE-SENIOR", title: "AARP New York",
    cat: "community-support", sub: "Volunteer & Mission-Based Community",
    city: "New York", website_url: "https://states.aarp.org/new-york/",
    source_name: "AARP New York", source_type: "nonprofit",
    phone: "866-227-7442", address: "750 Third Avenue, 33rd Floor, New York, NY 10017",
    desc: "AARP New York — state office of AARP serving 2.5+ million NY members aged 50+. Free programs heavily used by senior NY veterans: AARP Foundation Tax-Aide (200+ NY VITA-equivalent free tax-prep sites Feb-Apr — open to anyone, focus on low/moderate-income seniors and veterans), AARP Smart Driver (auto-insurance discount), Job Search resources for 50+ vets, scam-prevention through the AARP Fraud Watch Network (518-867-4084 NY office for Operation Stop Scams). State office: 750 Third Ave NYC; statewide member services 1-866-227-7442." },

  { section: "STATE-RECOVERY", title: "NY Council on Problem Gambling",
    cat: "substance-recovery", sub: "Recovery Support Services",
    city: "Albany", website_url: "https://nyproblemgambling.org/",
    source_name: "NY Council on Problem Gambling", source_type: "nonprofit",
    phone: "518-867-4084", address: "100 Great Oaks Boulevard, Albany, NY 12203",
    desc: "NY Council on Problem Gambling (NYCPG) — statewide nonprofit focused on problem-gambling prevention, treatment referral, and recovery support. NY's HOPEline 1-877-846-7369 (call/text) provides 24/7 confidential help for gambling addiction (a recognized co-occurring condition for veterans with PTSD or depression). Operates 7 OASAS-funded Problem Gambling Resource Centers across NY (Western, Finger Lakes, Central, Capital, Mid-Hudson, Long Island, NYC), each with a regional outreach coordinator providing free assessments, treatment referrals, and family support." },
];

// ============================================================================
// Run
// ============================================================================
runSeed(ROWS, {
  state: "NY",
  commit: COMMIT,
  allowBrokenUrls: ALLOW_BROKEN_URLS,
  scriptName: "seed-ny-p1-reset",
  batchTag: "ny-p1-reset",
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
