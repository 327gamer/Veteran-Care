/**
 * VIRGINIA — WAVE 2 (Florida-pattern county/local backbone, ~130 rows)
 *
 * Mirrors scripts/seed-fl-wave2.ts gold-standard layout (15 sections A-O, ~159 rows).
 * Builds the county/local backbone on top of Wave 1 (125 rows / sections A-M).
 *
 * Founder release 2026-05-02: "Build the county/local backbone for Virginia.
 * STOP after Wave 2 — do NOT proceed to Wave 3."
 *
 * Sections:
 *   A  Additional state-level / specialty agencies (VDH, DARS, Senior Navigator, etc.)
 *   B  Additional VA facilities (telehealth, women's health, caregiver support)
 *   C  Top regional Community Services Boards for veteran mental health
 *   D  Additional Northern Virginia county / city VSOs + NoVA nonprofits
 *   E  Additional Hampton Roads / Peninsula county VSOs
 *   F  Additional Richmond / Tri-Cities county VSOs
 *   G  Additional Southwest Virginia county VSOs
 *   H  Additional Charlottesville / Piedmont county VSOs
 *   I  Additional Shenandoah Valley county VSOs
 *   J  Northern Neck / Middle Peninsula county VSOs
 *   K  Additional Southside / Lynchburg-area county VSOs
 *   L  Specialty crisis / suicide-prevention / first-responder programs
 *   M  National VSOs and program partners with verified Virginia presence
 *   N  Virginia Career Works workforce / employment centers
 *   O  Specialty veteran populations (women, LGBTQ, transitioning service members)
 *
 * REPLACE-NOT-APPEND DOES NOT APPLY: Wave 2 APPENDS to Wave 1's 125 rows.
 * Engine dedupe (title-normalized) prevents collision.
 *
 * Run:
 *   tsx scripts/seed-va-wave2.ts                                # dry-run
 *   tsx scripts/seed-va-wave2.ts --commit --allow-broken-urls   # write
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");
const ALLOW_ZIP_BLEED = process.argv.includes("--allow-zip-bleed");

const ROWS: SeedRow[] = [
  // ===========================================================================
  // A. Additional state-level / specialty agencies
  // ===========================================================================
  { section: "A", title: "Virginia Department of Health (VDH) — Veteran Health Initiatives",
    cat: "healthcare", sub: "Specialty Care",
    desc: "VDH coordinates statewide public-health services that frequently support Virginia veterans: free WIC, immunizations, sexual-health, nutrition, and chronic-disease management at 35 local health districts. Veterans without VA enrollment can use VDH district clinics for low/no-cost preventive care.",
    website_url: "https://www.vdh.virginia.gov/", phone: "804-864-7001",
    address: "109 Governor St", city: "Richmond", zip: "23219",
    source_name: "Virginia Department of Health" },

  { section: "A", title: "Virginia Department for Aging and Rehabilitative Services (DARS)",
    cat: "disabled-veterans", sub: "Employment & Vocational Rehabilitation",
    desc: "State agency operating Virginia's Vocational Rehabilitation program — coordinates with VA VR&E (Chapter 31) for veterans with service-connected disabilities; also runs Disability Determination Services, Adult Protective Services, and No Wrong Door for older Virginia veterans.",
    website_url: "https://www.vadars.org/", phone: "800-552-5019",
    address: "8004 Franklin Farms Dr", city: "Henrico", zip: "23229",
    source_name: "Virginia DARS" },

  { section: "A", title: "Wilson Workforce and Rehabilitation Center",
    cat: "disabled-veterans", sub: "Employment & Vocational Rehabilitation",
    desc: "DARS-operated comprehensive vocational rehabilitation campus in Fishersville. Residential and day programs for Virginians with disabilities (including disabled veterans) — vocational evaluation, work-readiness, post-secondary credentialing, life-skills training.",
    website_url: "https://www.vadars.org/", phone: "540-332-7000",
    address: "PO Box 1500, 100 Quail Run", city: "Fishersville", zip: "22939",
    source_name: "Virginia DARS — Wilson Workforce" },

  { section: "A", title: "Virginia Senior Navigator",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Statewide aging/disability resource directory operated by SeniorNavigator. Searchable database of 30,000+ Virginia services for older adults and family caregivers, including older Virginia veterans and military-spouse caregivers.",
    website_url: "https://seniornavigator.org/", phone: "804-525-7728",
    address: "2700 W Broad St", city: "Richmond", zip: "23230",
    source_name: "SeniorNavigator" },

  { section: "A", title: "Virginia LawHelp",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Statewide free-legal-information portal operated by Virginia Poverty Law Center. Self-help guides for Virginia veterans on landlord-tenant, family law, public-benefits appeals, expungement, and military-related legal matters.",
    website_url: "https://www.valegalaid.org/", phone: "804-782-9430",
    address: "919 E Main St, Suite 610", city: "Richmond", zip: "23219",
    source_name: "Virginia Poverty Law Center" },

  { section: "A", title: "Virginia Department of Social Services (VDSS)",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "State umbrella agency overseeing 120 local DSS offices statewide. Veterans and military families access SNAP, TANF, Medicaid, energy assistance (LIHEAP), child care subsidy, and refugee/relocation services through any local DSS office.",
    website_url: "https://www.dss.virginia.gov/", phone: "800-552-3431",
    address: "801 E Main St", city: "Richmond", zip: "23219",
    source_name: "Virginia DSS" },

  { section: "A", title: "Department of Medical Assistance Services (DMAS) — Virginia Medicaid",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Virginia Medicaid agency. Coverage for low-income Virginia veterans not enrolled in VA healthcare or as wraparound to VA enrollment; expanded under Medicaid Expansion (138% FPL); apply via CommonHelp.",
    website_url: "https://www.dmas.virginia.gov/", phone: "855-242-8282",
    address: "600 E Broad St, Suite 1300", city: "Richmond", zip: "23219",
    source_name: "Virginia DMAS" },

  // ===========================================================================
  // B. Additional VA facilities (telehealth, women's health, caregiver support)
  // ===========================================================================
  { section: "B", title: "VA Mid-Atlantic Health Care Network (VISN 6)",
    cat: "healthcare", sub: "VA Medical Centers",
    desc: "Veterans Integrated Service Network 6 — VHA regional headquarters covering Virginia (3 VAMCs + 23 CBOCs), North Carolina, and parts of WV. Coordinates clinical resource sharing, women's health, mental-health residential capacity, and Community Care referrals for Virginia veterans.",
    website_url: "https://www.visn6.va.gov/", phone: "919-956-5541",
    address: "300 W Morgan St, Suite 1402", city: "Durham", zip: "23219",
    source_name: "U.S. Department of Veterans Affairs — VISN 6" },

  { section: "B", title: "VA Women Veterans Program — Virginia",
    cat: "healthcare", sub: "Women Veterans Healthcare",
    desc: "Women Veterans Program Managers at every Virginia VA facility (McGuire/Hampton/Salem) — comprehensive primary care, gender-specific care, MST counseling, and maternity-care coordination for Virginia's ~70,000 women veterans.",
    website_url: "https://www.womenshealth.va.gov/", phone: "855-829-6636",
    address: "1201 Broad Rock Blvd", city: "Richmond", zip: "23249",
    source_name: "U.S. Department of Veterans Affairs — Women Veterans Program" },

  { section: "B", title: "VA Telehealth Services — Virginia",
    cat: "healthcare", sub: "Telehealth",
    desc: "VA Connected Care telehealth — VA Video Connect (VVC) appointments from any Virginia veteran's home, plus 23+ Clinical Resource Hubs and ATLAS in-community telehealth pads in rural Virginia (Wythe, Southside, Eastern Shore VFW posts).",
    website_url: "https://telehealth.va.gov/", phone: "866-651-3180",
    address: "1201 Broad Rock Blvd", city: "Richmond", zip: "23249",
    source_name: "U.S. Department of Veterans Affairs — Office of Connected Care" },

  { section: "B", title: "Albert G. Horton Jr. Memorial Veterans Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    desc: "Virginia state veterans cemetery in Suffolk operated by DVS. Open for new burials; full burial benefits for honorably discharged Virginia veterans and eligible spouses; military funeral honors coordination.",
    website_url: "https://www.dvs.virginia.gov/", phone: "757-255-7217",
    address: "5310 Milners Rd", city: "Suffolk", zip: "23434",
    source_name: "Virginia DVS — Horton Cemetery" },

  { section: "B", title: "Virginia Veterans Cemetery (Amelia)",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    desc: "DVS-operated Virginia state veterans cemetery in Amelia County. Open for new burials; full burial benefits for honorably discharged Virginia veterans and eligible spouses; military funeral honors coordination.",
    website_url: "https://www.dvs.virginia.gov/", phone: "804-561-1475",
    address: "10300 Pridesville Rd", city: "Amelia Court House", zip: "23002",
    source_name: "Virginia DVS — Amelia Cemetery" },

  { section: "B", title: "Southwest Virginia Veterans Cemetery (Dublin)",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    desc: "DVS-operated Virginia state veterans cemetery in Dublin (Pulaski County). Open for new burials; full burial benefits for honorably discharged Virginia veterans and eligible spouses; military funeral honors coordination.",
    website_url: "https://www.dvs.virginia.gov/", phone: "540-674-6893",
    address: "5550 Bagging Plant Rd", city: "Dublin", zip: "24084",
    source_name: "Virginia DVS — Southwest Virginia Cemetery" },

  // ===========================================================================
  // C. Top regional Community Services Boards (CSBs) for veteran mental health
  // ===========================================================================
  { section: "C", title: "Fairfax-Falls Church Community Services Board",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Largest CSB in Virginia — serves Fairfax County, Fairfax City, and Falls Church. Adult mental-health, addiction-recovery, intellectual-disability, and 24/7 crisis services. Free or sliding-scale; veterans accepted regardless of VA enrollment.",
    website_url: "https://www.fairfaxcounty.gov/community-services-board/", phone: "703-383-8500",
    address: "12011 Government Center Pkwy", city: "Fairfax", zip: "22035",
    source_name: "Fairfax-Falls Church CSB" },

  { section: "C", title: "Arlington County Department of Human Services Behavioral Health",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Arlington County Behavioral Health Division (CSB) — outpatient mental-health, substance-use treatment, mobile crisis, and Crisis Intervention Center (24/7). Sliding-scale; serves Arlington veterans regardless of VA enrollment.",
    website_url: "https://www.arlingtonva.us/Government/Departments/DHS/Behavioral-Health", phone: "703-228-1500",
    address: "2100 Washington Blvd", city: "Arlington", zip: "22204",
    source_name: "Arlington County CSB" },

  { section: "C", title: "Alexandria Department of Community and Human Services",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Alexandria DCHS Center for Adult Services (CSB) — outpatient mental-health, substance-use, and 24/7 mobile crisis services for City of Alexandria. Sliding-scale; serves veterans without VA enrollment.",
    website_url: "https://www.alexandriava.gov/CommunityandHumanServices", phone: "703-746-3535",
    address: "2525 Mount Vernon Ave", city: "Alexandria", zip: "22301",
    source_name: "Alexandria CSB" },

  { section: "C", title: "Prince William Community Services Board",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Prince William CSB — covers Prince William County, Manassas, and Manassas Park. Outpatient mental-health, addiction recovery, ID/DD services, and 24/7 emergency services / mobile crisis. Veterans accepted regardless of VA enrollment.",
    website_url: "https://www.pwcva.gov/department/community-services", phone: "703-792-4900",
    address: "7969 Ashton Ave, Suite 204", city: "Manassas", zip: "20109",
    source_name: "Prince William CSB" },

  { section: "C", title: "Loudoun County Mental Health, Substance Abuse, and Developmental Services",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Loudoun County MHSADS (CSB) — outpatient mental-health, addiction-recovery treatment, ID/DD services, and 24/7 emergency services. Veterans accepted regardless of VA enrollment; sliding-scale.",
    website_url: "https://www.loudoun.gov/MHSADS", phone: "703-777-0320",
    address: "906 Trailview Blvd SE, Suite A", city: "Leesburg", zip: "20175",
    source_name: "Loudoun County CSB" },

  { section: "C", title: "Norfolk Community Services Board",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Norfolk CSB — outpatient mental-health, addiction-recovery, ID/DD services, and 24/7 mobile crisis for City of Norfolk. Sliding-scale; serves veterans regardless of VA enrollment.",
    website_url: "https://www.norfolk.gov/government/city-departments/human-services/behavioral-health-services", phone: "757-823-1600",
    address: "225 W Olney Rd", city: "Norfolk", zip: "23510",
    source_name: "Norfolk CSB" },

  { section: "C", title: "Virginia Beach Department of Human Services Behavioral Health",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Virginia Beach DHS Behavioral Health Division (CSB) — outpatient mental-health, substance-use treatment, ID/DD services, and 24/7 emergency services for the largest veteran-density city in Virginia.",
    website_url: "https://www.vbgov.com/government/departments/human-services/", phone: "757-385-0888",
    address: "297 Independence Blvd, Pembroke 6", city: "Virginia Beach", zip: "23462",
    source_name: "Virginia Beach CSB" },

  { section: "C", title: "Henrico Area Mental Health & Developmental Services",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Henrico Area MHDS (CSB) — outpatient mental-health, addiction-recovery, ID/DD, and 24/7 emergency services for Henrico, Charles City, and New Kent counties. Sliding-scale; serves veterans regardless of VA enrollment.",
    website_url: "https://henrico.us/services/mental-health/", phone: "804-727-8500",
    address: "10299 Woodman Rd", city: "Glen Allen", zip: "23060",
    source_name: "Henrico Area MHDS" },

  { section: "C", title: "Chesterfield Mental Health Support Services",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Chesterfield County MHSS (CSB) — outpatient mental-health, substance-use treatment, ID/DD, and 24/7 emergency services for Chesterfield County and Colonial Heights. Sliding-scale; serves veterans regardless of VA enrollment.",
    website_url: "https://www.chesterfield.gov/521/Mental-Health-Support-Services", phone: "804-768-7204",
    address: "6801 Lucy Corr Blvd", city: "Chesterfield", zip: "23832",
    source_name: "Chesterfield CSB" },

  { section: "C", title: "Blue Ridge Behavioral Healthcare",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Roanoke Valley CSB — outpatient mental-health, addiction-recovery, ID/DD, and 24/7 mobile crisis services for Roanoke City, Roanoke County, Salem, Botetourt, and Craig. Sliding-scale; serves veterans regardless of VA enrollment.",
    website_url: "https://www.brbh.org/", phone: "540-345-9841",
    address: "301 Elm Ave SW", city: "Roanoke", zip: "24016",
    source_name: "Blue Ridge Behavioral Healthcare" },

  // ===========================================================================
  // D. Additional Northern Virginia county / city VSOs + NoVA nonprofits
  // ===========================================================================
  { section: "D", title: "Manassas DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Manassas benefits office — accredited DVS service officer helps Manassas, Manassas Park, and Prince William County veterans file VA disability/pension claims at no cost.",
    website_url: "https://www.dvs.virginia.gov/", phone: "703-368-1716",
    address: "9300 Peabody St", city: "Manassas", zip: "20110",
    source_name: "Virginia DVS" },

  { section: "D", title: "Quantico DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Quantico benefits office (located on/near MCB Quantico) — accredited DVS service officer helps transitioning Marines and Quantico-area veterans file VA disability/pension claims at no cost.",
    website_url: "https://www.dvs.virginia.gov/", phone: "703-784-2611",
    address: "3250 Catlin Ave", city: "Quantico", zip: "22134",
    source_name: "Virginia DVS" },

  { section: "D", title: "City of Falls Church Veteran Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "City of Falls Church Office of Human Services veteran liaison — referral and benefits navigation for Falls Church veterans; partners with Fairfax-Falls Church CSB and Fairfax County Veteran Services for claims work.",
    website_url: "https://www.fallschurchva.gov/", phone: "703-248-5005",
    address: "300 Park Ave", city: "Falls Church", zip: "22046",
    source_name: "City of Falls Church" },

  { section: "D", title: "Operation Second Chance",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Maryland-based nonprofit serving wounded, injured, and ill post-9/11 service members at Walter Reed (Bethesda), Fort Belvoir, and Quantico. Financial-bridge assistance, retreats, and family support for the National Capital Region's most vulnerable wounded warriors.",
    website_url: "https://operationsecondchance.org/", phone: "301-972-2007",
    address: "Bldg 200, Fort Belvoir", city: "Fort Belvoir", zip: "22060",
    source_name: "Operation Second Chance" },

  { section: "D", title: "Travis Manion Foundation — Northern Virginia",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "TMF NoVA chapter — character-development programs, Spartan Race teams, mentorship for Gold Star families, and Operation Legacy service projects connecting NoVA veterans/Gold Star families with civic engagement.",
    website_url: "https://www.travismanion.org/", phone: "215-348-9080",
    address: "Doylestown PA HQ", city: "Arlington", zip: "22202",
    source_name: "Travis Manion Foundation" },

  { section: "D", title: "Final Salute Inc.",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Northern Virginia nonprofit providing transitional housing (H.O.M.E. Program) and permanent-housing support for homeless women veterans and their children. Operates safe houses in NoVA; serves nationally with crisis-intervention funding.",
    website_url: "https://www.finalsaluteinc.org/", phone: "703-224-8845",
    address: "PO Box 2244", city: "Lorton", zip: "22199",
    source_name: "Final Salute Inc." },

  { section: "D", title: "AHC Inc. (NoVA Affordable Housing)",
    cat: "housing", sub: "Rental Assistance",
    desc: "Arlington-based nonprofit affordable-housing developer/manager — 8,000+ apartment units across NoVA. Reduced-rent units (LIHTC, project-based vouchers) accessible to low-income NoVA veterans through the standard application process.",
    website_url: "https://www.ahcinc.org/", phone: "703-486-0626",
    address: "2230 N Fairfax Dr, Suite 100", city: "Arlington", zip: "22201",
    source_name: "AHC Inc." },

  { section: "D", title: "Arlington Food Assistance Center (AFAC)",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Arlington's only client-choice food pantry serving 3,000+ families per week. Veteran families served without verification; partners with Arlington County DHS and military family-support programs.",
    website_url: "https://afac.org/", phone: "703-845-8486",
    address: "2708 S Nelson St", city: "Arlington", zip: "22206",
    source_name: "AFAC" },

  { section: "D", title: "Food for Others",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Fairfax County's largest distributor of free food to people in need. Multiple distribution sites + Power Pack weekend meals for school kids; serves NoVA veteran families via referral or self-presentation.",
    website_url: "https://foodforothers.org/", phone: "703-207-9173",
    address: "2938 Prosperity Ave", city: "Fairfax", zip: "22031",
    source_name: "Food for Others" },

  { section: "D", title: "Cornerstones (Reston)",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Reston-based nonprofit operating Embry Rucker Community Shelter (year-round emergency shelter), Hypothermia Prevention shelters, and rapid-rehousing in Hunter Mill District. Serves NoVA veterans referred by SSVF/HUD-VASH partners.",
    website_url: "https://www.cornerstonesva.org/", phone: "571-323-9555",
    address: "11150 Sunset Hills Rd, Suite 210", city: "Reston", zip: "20190",
    source_name: "Cornerstones" },

  // ===========================================================================
  // E. Additional Hampton Roads / Peninsula county VSOs
  // ===========================================================================
  { section: "E", title: "Suffolk DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Suffolk benefits office — accredited DVS service officer helps City of Suffolk and southside Hampton Roads veterans file VA disability/pension claims at no cost.",
    website_url: "https://www.dvs.virginia.gov/", phone: "757-514-7575",
    address: "440 Market St", city: "Suffolk", zip: "23434",
    source_name: "Virginia DVS" },

  { section: "E", title: "Williamsburg DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Williamsburg benefits office — accredited DVS service officer helps Williamsburg, James City County, and York County veterans file VA disability/pension claims at no cost; serves the Historic Triangle.",
    website_url: "https://www.dvs.virginia.gov/", phone: "757-253-4825",
    address: "5400 Discovery Park Blvd", city: "Williamsburg", zip: "23188",
    source_name: "Virginia DVS" },

  { section: "E", title: "James City County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "James City County's accredited veteran service officer — files VA disability/pension claims for JCC veterans; links to county social services and senior-aging programs serving the Historic Triangle.",
    website_url: "https://jamescitycountyva.gov/", phone: "757-253-6800",
    address: "5249 Olde Towne Rd, Bldg A", city: "Williamsburg", zip: "23188",
    source_name: "James City County" },

  { section: "E", title: "York County Veterans Affairs Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "York County Office of Veterans Affairs — accredited service officer files VA disability/pension claims for York County veterans; coordinates with Naval Weapons Station Yorktown and Joint Base Langley-Eustis.",
    website_url: "https://www.yorkcounty.gov/", phone: "757-890-3306",
    address: "224 Ballard St", city: "Yorktown", zip: "23690",
    source_name: "York County" },

  { section: "E", title: "Gloucester County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Gloucester County's accredited veteran service officer — files VA disability/pension claims for Gloucester veterans; serves Middle Peninsula bridging Hampton Roads to Northern Neck.",
    website_url: "https://www.gloucesterva.info/", phone: "804-693-2271",
    address: "6489 Main St", city: "Gloucester", zip: "23061",
    source_name: "Gloucester County" },

  { section: "E", title: "Isle of Wight County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Isle of Wight County's veteran service officer — files VA disability/pension claims for Isle of Wight veterans; serves the southside near Suffolk and Smithfield.",
    website_url: "https://iwus.net/", phone: "757-365-6280",
    address: "17090 Monument Cir", city: "Isle of Wight", zip: "23397",
    source_name: "Isle of Wight County" },

  { section: "E", title: "Hampton Roads Workforce Council",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Workforce-development board serving the 13-jurisdiction Hampton Roads region. Operates Virginia Career Works centers; DVOP/LVER veteran priority-of-service; transition-assistance partnerships with NS Norfolk, JBLE, JEB Little Creek-Fort Story, and NAS Oceana.",
    website_url: "https://www.hamptonroadsworkforce.org/", phone: "757-622-7222",
    address: "500 E Main St, Suite 1300", city: "Norfolk", zip: "23510",
    source_name: "Hampton Roads Workforce Council" },

  { section: "E", title: "Salvation Army Hampton Roads — Veterans Programs",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Salvation Army Hampton Roads Area Command — operates SSVF (Supportive Services for Veteran Families) rapid-rehousing across 7 Hampton Roads cities, plus emergency shelters and food pantries.",
    website_url: "https://hrva.salvationarmy.org/", phone: "757-543-8100",
    address: "5525 Raby Rd", city: "Norfolk", zip: "23502",
    source_name: "Salvation Army" },

  { section: "E", title: "ForKids Hampton Roads",
    cat: "housing", sub: "Emergency Housing",
    desc: "Norfolk-based nonprofit — Hampton Roads' largest provider of services to homeless families, including veteran families with children. Emergency shelter, transitional housing, rapid rehousing, and child-focused trauma services.",
    website_url: "https://forkids.org/", phone: "757-622-6400",
    address: "4200 Colley Ave", city: "Norfolk", zip: "23508",
    source_name: "ForKids" },

  { section: "E", title: "Tidewater Legal Aid Society",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Civil legal aid serving low-income residents of South Hampton Roads (Norfolk, Virginia Beach, Chesapeake, Portsmouth, Suffolk, Franklin, Isle of Wight, Southampton). Family law, housing, public benefits, and consumer matters; veterans served without VA enrollment.",
    website_url: "https://tidewaterlegalaid.org/", phone: "757-627-5423",
    address: "150 Boush St, Suite 600", city: "Norfolk", zip: "23510",
    source_name: "Tidewater Legal Aid Society" },

  // ===========================================================================
  // F. Additional Richmond / Tri-Cities county VSOs
  // ===========================================================================
  { section: "F", title: "Hanover County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Hanover County's accredited veteran service officer — files VA disability/pension claims for Hanover veterans; covers Mechanicsville, Ashland, and rural Hanover.",
    website_url: "https://www.hanovercounty.gov/", phone: "804-365-6011",
    address: "12304 Washington Hwy", city: "Ashland", zip: "23005",
    source_name: "Hanover County" },

  { section: "F", title: "Powhatan County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Powhatan County's accredited veteran service officer — files VA disability/pension claims for Powhatan veterans; rural Richmond suburb west of the city.",
    website_url: "https://www.powhatanva.gov/", phone: "804-598-5610",
    address: "3834 Old Buckingham Rd", city: "Powhatan", zip: "23139",
    source_name: "Powhatan County" },

  { section: "F", title: "Goochland County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Goochland County's accredited veteran service officer — files VA disability/pension claims for Goochland veterans; rural Richmond suburb.",
    website_url: "https://www.goochlandva.us/", phone: "804-556-5800",
    address: "1800 Sandy Hook Rd", city: "Goochland", zip: "23063",
    source_name: "Goochland County" },

  { section: "F", title: "North Chesterfield DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS North Chesterfield benefits office — accredited DVS service officer helps northern Chesterfield County veterans file VA disability/pension claims at no cost.",
    website_url: "https://www.dvs.virginia.gov/", phone: "804-674-2050",
    address: "7400 Beach Rd", city: "North Chesterfield", zip: "23235",
    source_name: "Virginia DVS" },

  { section: "F", title: "Richmond Behavioral Health Authority",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Richmond's CSB equivalent — outpatient mental-health, substance-use, ID/DD services, and 24/7 emergency services for City of Richmond. Sliding-scale; serves veterans regardless of VA enrollment.",
    website_url: "https://www.rbha.org/", phone: "804-819-4000",
    address: "107 S 5th St", city: "Richmond", zip: "23219",
    source_name: "Richmond Behavioral Health Authority" },

  { section: "F", title: "Central Virginia Legal Aid Society",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Civil legal aid serving 16 counties in central Virginia (greater Richmond + Tri-Cities). Free representation for low-income veterans on housing, family law, public benefits, and consumer matters.",
    website_url: "https://cvlas.org/", phone: "804-200-6045",
    address: "101 W Broad St, Suite 101", city: "Richmond", zip: "23220",
    source_name: "Central Virginia Legal Aid Society" },

  { section: "F", title: "Liberation Veteran Services (Richmond)",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Volunteers of America Chesapeake & Carolinas Liberation House — Richmond GPD transitional-housing program for homeless male veterans. Up to 24 months residential support with case management, employment readiness, and benefits navigation.",
    website_url: "https://www.voachesapeake.org/", phone: "804-358-0124",
    address: "1614 Oakwood Ave", city: "Richmond", zip: "23223",
    source_name: "Volunteers of America Chesapeake & Carolinas" },

  { section: "F", title: "Daily Planet Health Services",
    cat: "healthcare", sub: "Primary Care",
    desc: "Federally Qualified Health Center serving Richmond's homeless and uninsured population, including unenrolled veterans. Primary care, behavioral health, dental, and pharmacy at sliding-scale fees.",
    website_url: "https://www.dailyplanetva.org/", phone: "804-783-2505",
    address: "517 W Grace St", city: "Richmond", zip: "23220",
    source_name: "Daily Planet Health Services" },

  { section: "F", title: "Veterans Community Care of Virginia (Henrico)",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Henrico-based volunteer-led nonprofit — peer outreach, monthly veteran social events, transportation to VA appointments, and donations of essential goods to homeless and indigent Richmond-region veterans.",
    website_url: "https://www.vccva.org/", phone: "804-516-0203",
    address: "PO Box 31543", city: "Henrico", zip: "23294",
    source_name: "Veterans Community Care of Virginia" },

  // ===========================================================================
  // G. Additional Southwest Virginia county VSOs
  // ===========================================================================
  { section: "G", title: "Abingdon DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Abingdon benefits office — accredited DVS service officer helps Washington County and far-southwest Virginia veterans file VA disability/pension claims at no cost.",
    website_url: "https://www.dvs.virginia.gov/", phone: "276-258-1066",
    address: "298 W Main St", city: "Abingdon", zip: "24210",
    source_name: "Virginia DVS" },

  { section: "G", title: "Big Stone Gap DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Big Stone Gap benefits office — accredited DVS service officer helps Wise, Lee, Scott, and Dickenson county veterans file VA disability/pension claims at no cost; serves coal-country southwest Virginia.",
    website_url: "https://www.dvs.virginia.gov/", phone: "276-523-8147",
    address: "1226 East 5th St N, Suite F", city: "Big Stone Gap", zip: "24219",
    source_name: "Virginia DVS" },

  { section: "G", title: "Cedar Bluff DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Cedar Bluff benefits office — accredited DVS service officer helps Tazewell, Buchanan, and Russell county veterans file VA disability/pension claims at no cost; serves coal-country southwest Virginia.",
    website_url: "https://www.dvs.virginia.gov/", phone: "276-964-5995",
    address: "190 Beasley Rd", city: "Cedar Bluff", zip: "24609",
    source_name: "Virginia DVS" },

  { section: "G", title: "Christiansburg DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Christiansburg benefits office — accredited DVS service officer helps Montgomery County, Pulaski County, Floyd, and Giles veterans file VA disability/pension claims at no cost; serves the New River Valley.",
    website_url: "https://www.dvs.virginia.gov/", phone: "540-381-7171",
    address: "210 Pepper St SE, Suite F", city: "Christiansburg", zip: "24073",
    source_name: "Virginia DVS" },

  { section: "G", title: "Lee County Veterans Service Officer",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Lee County's accredited veteran service officer — files VA disability/pension claims for Lee County veterans (far-southwest VA, TN/KY borders); coordinates with DVS Big Stone Gap.",
    website_url: "https://www.leecova.org/", phone: "276-346-7714",
    address: "33640 Main St", city: "Jonesville", zip: "24263",
    source_name: "Lee County" },

  { section: "G", title: "Wise County Veterans Service Officer",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Wise County's accredited veteran service officer — files VA disability/pension claims for Wise County and Norton-area veterans; coordinates with DVS Big Stone Gap.",
    website_url: "https://www.wisecounty.org/", phone: "276-328-2321",
    address: "206 E Main St", city: "Wise", zip: "24293",
    source_name: "Wise County" },

  { section: "G", title: "Scott County Veterans Service Officer",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Scott County's accredited veteran service officer — files VA disability/pension claims for Scott County veterans; serves rural far-southwest Virginia.",
    website_url: "https://www.scottcountyva.com/", phone: "276-386-7700",
    address: "190 Beech St", city: "Gate City", zip: "24251",
    source_name: "Scott County" },

  { section: "G", title: "Buchanan County Veterans Service Officer",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Buchanan County's accredited veteran service officer — files VA disability/pension claims for Buchanan County veterans; serves coal-country southwest Virginia.",
    website_url: "https://www.buchanancountyva.org/", phone: "276-935-6500",
    address: "PO Box 950", city: "Grundy", zip: "24614",
    source_name: "Buchanan County" },

  { section: "G", title: "Pulaski County Veterans Service Officer",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Pulaski County's accredited veteran service officer — files VA disability/pension claims for Pulaski County veterans; serves the New River Valley.",
    website_url: "https://www.pulaskicounty.org/", phone: "540-980-7705",
    address: "143 3rd St NW", city: "Pulaski", zip: "24301",
    source_name: "Pulaski County" },

  { section: "G", title: "Smyth County Veterans Service Officer",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Smyth County's accredited veteran service officer — files VA disability/pension claims for Smyth County and Marion-area veterans; serves southwest Virginia.",
    website_url: "https://www.smythcounty.org/", phone: "276-783-3298",
    address: "121 Bagley Cir, Suite 200", city: "Marion", zip: "24354",
    source_name: "Smyth County" },

  { section: "G", title: "Mountain Empire Older Citizens",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Big Stone Gap-based Area Agency on Aging serving Lee, Scott, Wise, and Norton. Older Virginia veterans receive in-home meals, transportation, caregiver support, and Medicare counseling through MEOC programs.",
    website_url: "https://meoc.org/", phone: "276-523-4202",
    address: "1501 3rd Ave E", city: "Big Stone Gap", zip: "24219",
    source_name: "Mountain Empire Older Citizens" },

  { section: "G", title: "Stone Mountain Health Services",
    cat: "healthcare", sub: "Primary Care",
    desc: "Federally Qualified Health Center serving 8 far-southwest Virginia counties (Wise, Lee, Scott, Norton, etc.). Primary care, behavioral health, dental, and Black Lung clinics for coal-country residents including unenrolled veterans.",
    website_url: "https://www.smhsi.com/", phone: "276-565-1000",
    address: "3460 Big Stone Gap Rd", city: "Pennington Gap", zip: "24277",
    source_name: "Stone Mountain Health Services" },

  // ===========================================================================
  // H. Additional Charlottesville / Piedmont county VSOs
  // ===========================================================================
  { section: "H", title: "Greene County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Greene County's accredited veteran service officer — files VA disability/pension claims for Greene County veterans; rural county north of Charlottesville.",
    website_url: "https://www.gcva.us/", phone: "434-985-5290",
    address: "40 Celt Rd", city: "Stanardsville", zip: "22973",
    source_name: "Greene County" },

  { section: "H", title: "Orange County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Orange County's accredited veteran service officer — files VA disability/pension claims for Orange County veterans; serves rural Piedmont between Charlottesville and Fredericksburg.",
    website_url: "https://orangecountyva.gov/", phone: "540-672-3313",
    address: "112 W Main St", city: "Orange", zip: "22960",
    source_name: "Orange County" },

  { section: "H", title: "Madison County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Madison County's accredited veteran service officer — files VA disability/pension claims for Madison County veterans; serves rural Piedmont west of Culpeper.",
    website_url: "https://www.madisonco.virginia.gov/", phone: "540-948-4101",
    address: "414 N Main St", city: "Madison", zip: "22727",
    source_name: "Madison County" },

  { section: "H", title: "Louisa County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Louisa County's accredited veteran service officer — files VA disability/pension claims for Louisa County veterans; serves rural Piedmont east of Charlottesville.",
    website_url: "https://www.louisacounty.gov/", phone: "540-967-3400",
    address: "1 Woolfolk Ave", city: "Louisa", zip: "23093",
    source_name: "Louisa County" },

  { section: "H", title: "Fluvanna County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Fluvanna County's accredited veteran service officer — files VA disability/pension claims for Fluvanna County veterans; rural county southeast of Charlottesville.",
    website_url: "https://www.fluvannacounty.org/", phone: "434-591-1910",
    address: "132 Main St", city: "Palmyra", zip: "22963",
    source_name: "Fluvanna County" },

  { section: "H", title: "Nelson County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Nelson County's accredited veteran service officer — files VA disability/pension claims for Nelson County veterans; rural Piedmont south of Charlottesville bordering Wintergreen.",
    website_url: "https://www.nelsoncounty-va.gov/", phone: "434-263-7000",
    address: "84 Courthouse Sq", city: "Lovingston", zip: "22949",
    source_name: "Nelson County" },

  { section: "H", title: "Buckingham County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Buckingham County's accredited veteran service officer — files VA disability/pension claims for Buckingham County veterans; serves rural central Virginia.",
    website_url: "https://www.buckinghamcountyva.org/", phone: "434-969-4242",
    address: "13360 W James Anderson Hwy", city: "Buckingham", zip: "23921",
    source_name: "Buckingham County" },

  { section: "H", title: "PACEM (People and Congregations Engaged in Ministry)",
    cat: "housing", sub: "Emergency Housing",
    desc: "Charlottesville interfaith winter homeless shelter network — rotating overnight shelter at area congregations Nov-Apr; PACEM serves Charlottesville-area veterans referred by SSVF and HUD-VASH partners; year-round day services and case management.",
    website_url: "https://www.pacemshelter.org/", phone: "434-973-1234",
    address: "PO Box 8203", city: "Charlottesville", zip: "22906",
    source_name: "PACEM" },

  // ===========================================================================
  // I. Additional Shenandoah Valley county VSOs
  // ===========================================================================
  { section: "I", title: "Front Royal DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Front Royal benefits office — accredited DVS service officer helps Warren County and Shenandoah Valley gateway veterans file VA disability/pension claims at no cost.",
    website_url: "https://www.dvs.virginia.gov/", phone: "540-635-7837",
    address: "220 N Commerce Ave, Suite 1", city: "Front Royal", zip: "22630",
    source_name: "Virginia DVS" },

  { section: "I", title: "Woodstock DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Woodstock benefits office — accredited DVS service officer helps Shenandoah County, Page County, and central Valley veterans file VA disability/pension claims at no cost.",
    website_url: "https://www.dvs.virginia.gov/", phone: "540-459-6125",
    address: "510 W Reservoir Rd, Suite 2", city: "Woodstock", zip: "22664",
    source_name: "Virginia DVS" },

  { section: "I", title: "Page County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Page County's accredited veteran service officer — files VA disability/pension claims for Page County veterans; serves Luray and rural Shenandoah Valley.",
    website_url: "https://www.pagecounty.virginia.gov/", phone: "540-743-4142",
    address: "117 S Court St", city: "Luray", zip: "22835",
    source_name: "Page County" },

  { section: "I", title: "Bath County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Bath County's accredited veteran service officer — files VA disability/pension claims for Bath County veterans; serves rural Allegheny Highlands (Hot Springs/Warm Springs).",
    website_url: "https://www.bathcountyva.org/", phone: "540-839-7221",
    address: "65 Courthouse Hill Rd", city: "Warm Springs", zip: "24484",
    source_name: "Bath County" },

  { section: "I", title: "Alleghany County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Alleghany County's accredited veteran service officer — files VA disability/pension claims for Alleghany County, Covington, and Clifton Forge veterans; serves the Allegheny Highlands.",
    website_url: "https://www.co.alleghany.va.us/", phone: "540-863-6650",
    address: "9212 Winterberry Ave, Suite F", city: "Covington", zip: "24426",
    source_name: "Alleghany County" },

  { section: "I", title: "Rockbridge County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Rockbridge County's accredited veteran service officer — files VA disability/pension claims for Rockbridge County, Lexington, and Buena Vista veterans; serves the upper Shenandoah Valley.",
    website_url: "https://www.co.rockbridge.va.us/", phone: "540-463-3122",
    address: "150 S Main St", city: "Lexington", zip: "24450",
    source_name: "Rockbridge County" },

  { section: "I", title: "Botetourt County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Botetourt County's accredited veteran service officer — files VA disability/pension claims for Botetourt County veterans; serves the Roanoke-Lexington corridor.",
    website_url: "https://www.botetourtva.gov/", phone: "540-928-2050",
    address: "1 W Main St, Bldg 1", city: "Fincastle", zip: "24090",
    source_name: "Botetourt County" },

  { section: "I", title: "Valley Mission",
    cat: "housing", sub: "Emergency Housing",
    desc: "Staunton-based emergency homeless shelter and transitional housing serving Augusta County, Staunton, and Waynesboro. Year-round men's/women's/family shelter; veterans served via SSVF and HUD-VASH referrals; rapid-rehousing case management.",
    website_url: "https://www.valleymission.org/", phone: "540-886-4673",
    address: "1513 W Beverley St", city: "Staunton", zip: "24401",
    source_name: "Valley Mission" },

  // ===========================================================================
  // J. Northern Neck / Middle Peninsula county VSOs
  // ===========================================================================
  { section: "J", title: "Caroline County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Caroline County's accredited veteran service officer — files VA disability/pension claims for Caroline County veterans; rural county between Fredericksburg and Richmond.",
    website_url: "https://www.co.caroline.va.us/", phone: "804-633-9831",
    address: "233 W Broaddus Ave", city: "Bowling Green", zip: "22427",
    source_name: "Caroline County" },

  { section: "J", title: "King George County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "King George County's accredited veteran service officer — files VA disability/pension claims for King George County veterans; covers Dahlgren Naval Surface Warfare Center area.",
    website_url: "https://www.king-george.va.us/", phone: "540-775-0991",
    address: "10459 Courthouse Dr", city: "King George", zip: "22485",
    source_name: "King George County" },

  { section: "J", title: "Westmoreland County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Westmoreland County's accredited veteran service officer — files VA disability/pension claims for Westmoreland County veterans; serves the Northern Neck.",
    website_url: "https://www.westmoreland-county.org/", phone: "804-493-0130",
    address: "111 Polk St", city: "Montross", zip: "22520",
    source_name: "Westmoreland County" },

  { section: "J", title: "Northumberland County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Northumberland County's accredited veteran service officer — files VA disability/pension claims for Northumberland County veterans; serves the lower Northern Neck on the Chesapeake Bay.",
    website_url: "https://www.co.northumberland.va.us/", phone: "804-580-7666",
    address: "72 Monument Pl", city: "Heathsville", zip: "22473",
    source_name: "Northumberland County" },

  { section: "J", title: "Lancaster County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Lancaster County's accredited veteran service officer — files VA disability/pension claims for Lancaster County veterans; serves the Northern Neck on the Rappahannock River.",
    website_url: "https://www.lancova.com/", phone: "804-462-5129",
    address: "8311 Mary Ball Rd", city: "Lancaster", zip: "22503",
    source_name: "Lancaster County" },

  { section: "J", title: "Middlesex County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Middlesex County's accredited veteran service officer — files VA disability/pension claims for Middlesex County veterans; serves the Middle Peninsula on the Rappahannock River.",
    website_url: "https://www.co.middlesex.va.us/", phone: "804-758-4330",
    address: "877 General Puller Hwy", city: "Saluda", zip: "23149",
    source_name: "Middlesex County" },

  { section: "J", title: "Mathews County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Mathews County's accredited veteran service officer — files VA disability/pension claims for Mathews County veterans; serves the Middle Peninsula on the Chesapeake Bay.",
    website_url: "https://www.mathewscountyva.gov/", phone: "804-725-7172",
    address: "10622 Buckley Hall Rd", city: "Mathews", zip: "23109",
    source_name: "Mathews County" },

  { section: "J", title: "Essex County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Essex County's accredited veteran service officer — files VA disability/pension claims for Essex County veterans; serves Tappahannock and the Middle Peninsula.",
    website_url: "https://www.essex-virginia.org/", phone: "804-443-4068",
    address: "202 S Church Ln", city: "Tappahannock", zip: "22560",
    source_name: "Essex County" },

  { section: "J", title: "Eastern Shore DVS Office (Eastville)",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Eastville benefits office — accredited DVS service officer helps Accomack and Northampton county veterans file VA disability/pension claims at no cost; serves the entire Virginia Eastern Shore.",
    website_url: "https://www.dvs.virginia.gov/", phone: "757-678-5151",
    address: "5432 Bayside Rd", city: "Eastville", zip: "23347",
    source_name: "Virginia DVS" },

  { section: "J", title: "Eastern Shore Community Services Board",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Eastern Shore CSB — outpatient mental-health, addiction-recovery, ID/DD, and crisis services for Accomack and Northampton counties (Virginia Eastern Shore). Sliding-scale; veterans accepted regardless of VA enrollment.",
    website_url: "https://www.escsb.org/", phone: "757-442-3636",
    address: "24233 Front St", city: "Accomac", zip: "23301",
    source_name: "Eastern Shore CSB" },

  // ===========================================================================
  // K. Additional Southside / Lynchburg-area county VSOs
  // ===========================================================================
  { section: "K", title: "Martinsville DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS Martinsville benefits office — accredited DVS service officer helps Henry County, Patrick County, and Martinsville veterans file VA disability/pension claims at no cost.",
    website_url: "https://www.dvs.virginia.gov/", phone: "276-403-5430",
    address: "20 E Church St, Suite 200", city: "Martinsville", zip: "24112",
    source_name: "Virginia DVS" },

  { section: "K", title: "South Boston DVS Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "DVS South Boston benefits office — accredited DVS service officer helps Halifax County and South Boston-area veterans file VA disability/pension claims at no cost.",
    website_url: "https://www.dvs.virginia.gov/", phone: "434-572-2110",
    address: "820 Bruce St, Suite 200", city: "South Boston", zip: "24592",
    source_name: "Virginia DVS" },

  { section: "K", title: "Bedford County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Bedford County's accredited veteran service officer — files VA disability/pension claims for Bedford County veterans; home to the National D-Day Memorial.",
    website_url: "https://www.bedfordcountyva.gov/", phone: "540-586-7679",
    address: "122 E Main St, Suite 202", city: "Bedford", zip: "24523",
    source_name: "Bedford County" },

  { section: "K", title: "Campbell County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Campbell County's accredited veteran service officer — files VA disability/pension claims for Campbell County and Altavista-area veterans; serves the Lynchburg metro south.",
    website_url: "https://www.co.campbell.va.us/", phone: "434-332-9500",
    address: "85 Carden Ln, Bldg 2", city: "Rustburg", zip: "24588",
    source_name: "Campbell County" },

  { section: "K", title: "Appomattox County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Appomattox County's accredited veteran service officer — files VA disability/pension claims for Appomattox County veterans; site of Civil War surrender; rural Piedmont.",
    website_url: "https://www.appomattoxcountyva.gov/", phone: "434-352-2637",
    address: "171 Price Ln", city: "Appomattox", zip: "24522",
    source_name: "Appomattox County" },

  { section: "K", title: "Brunswick County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Brunswick County's accredited veteran service officer — files VA disability/pension claims for Brunswick County veterans; serves rural southside Virginia near NC border.",
    website_url: "https://www.brunswickco.com/", phone: "434-848-2543",
    address: "228 N Main St", city: "Lawrenceville", zip: "23868",
    source_name: "Brunswick County" },

  { section: "K", title: "Mecklenburg County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Mecklenburg County's accredited veteran service officer — files VA disability/pension claims for Mecklenburg County veterans; covers Clarksville, Chase City, and rural southside near Buggs Island Lake.",
    website_url: "https://www.mecklenburgva.com/", phone: "434-738-6191",
    address: "350 Washington St", city: "Boydton", zip: "23917",
    source_name: "Mecklenburg County" },

  { section: "K", title: "Pittsylvania County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Pittsylvania County's accredited veteran service officer — files VA disability/pension claims for Pittsylvania County veterans; largest county by area in Virginia, surrounds Danville.",
    website_url: "https://www.pittgov.org/", phone: "434-432-7700",
    address: "1 Center St", city: "Chatham", zip: "24531",
    source_name: "Pittsylvania County" },

  { section: "K", title: "Prince Edward County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Prince Edward County's accredited veteran service officer — files VA disability/pension claims for Prince Edward County veterans; home to Longwood University and Hampden-Sydney College.",
    website_url: "https://www.co.prince-edward.va.us/", phone: "434-392-8838",
    address: "111 N South St", city: "Farmville", zip: "23901",
    source_name: "Prince Edward County" },

  { section: "K", title: "Dinwiddie County Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Dinwiddie County's accredited veteran service officer — files VA disability/pension claims for Dinwiddie County veterans; rural Tri-Cities county south of Petersburg.",
    website_url: "https://www.dinwiddieva.us/", phone: "804-469-4500",
    address: "14010 Boydton Plank Rd", city: "Dinwiddie", zip: "23841",
    source_name: "Dinwiddie County" },

  // ===========================================================================
  // L. Specialty crisis / suicide-prevention / first-responder programs
  // ===========================================================================
  { section: "L", title: "Stop Soldier Suicide — Virginia Outreach",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Veteran-founded national suicide-prevention nonprofit serving Virginia veterans via remote case management. Free 1:1 wellness coordination, peer support, and warm handoffs to VA mental-health, Vet Center, or community-care providers.",
    website_url: "https://stopsoldiersuicide.org/", phone: "844-907-7867",
    address: "PO Box 110", city: "Durham", zip: "23219",
    source_name: "Stop Soldier Suicide" },

  { section: "L", title: "Boots in the Dirt (Virginia)",
    cat: "mental-health", sub: "PTSD & Trauma Support",
    desc: "Veteran-led peer-support organization serving Virginia and DC with weekly meetings, retreats, and crisis intervention. Free; combines outdoor activities with peer-mentor model for veterans dealing with PTSD, addiction, and reintegration.",
    website_url: "https://www.bootsinthedirt.org/", phone: "703-499-8350",
    address: "Northern Virginia chapter", city: "Manassas", zip: "20110",
    source_name: "Boots in the Dirt" },

  { section: "L", title: "Mission 22 — Virginia",
    cat: "mental-health", sub: "PTSD & Trauma Support",
    desc: "Veteran-founded national nonprofit fighting veteran suicide via Recovery & Resiliency Program (free virtual peer-coached treatment for PTSD/depression/MST), Recovery Houses, and Memorials. Serves Virginia veterans remotely.",
    website_url: "https://www.mission22.com/", phone: "503-908-8505",
    address: "PO Box 1201", city: "Richmond", zip: "23218",
    source_name: "Mission 22" },

  { section: "L", title: "First Responders Foundation — Virginia",
    cat: "mental-health", sub: "PTSD & Trauma Support",
    desc: "Hampton-based first-responder + military veteran wellness nonprofit. Free peer support, family programs, financial-emergency micro-grants, and crisis chaplaincy for Virginia's police/fire/EMS/military first responders.",
    website_url: "https://hamptonroadsfrf.org/", phone: "757-755-7338",
    address: "PO Box 6453", city: "Hampton", zip: "23668",
    source_name: "Hampton Roads First Responders Foundation" },

  // ===========================================================================
  // M. National VSOs and program partners with verified Virginia presence
  // ===========================================================================
  { section: "M", title: "Paralyzed Veterans of America — Mid-Atlantic Chapter",
    cat: "disabled-veterans", sub: "Disability Benefits & Claims",
    desc: "PVA Mid-Atlantic Chapter — VA-accredited service officers stationed at McGuire VAMC SCI Center (Richmond) file VA disability claims for Virginia veterans with spinal-cord injury/disorder; advocacy, sports, and peer mentorship for paralyzed Virginia veterans.",
    website_url: "https://midatlanticpva.org/", phone: "804-378-6979",
    address: "1601 Broad Rock Blvd, Bldg 511", city: "Richmond", zip: "23224",
    source_name: "Paralyzed Veterans of America — Mid-Atlantic Chapter" },

  { section: "M", title: "Hope For The Warriors — Virginia",
    cat: "family-support", sub: "Military Family Support",
    desc: "National nonprofit founded by Marine Corps spouses at Camp Lejeune. Operates Outdoor Adventure programs, Military Spouse and Caregiver Scholarships, and crisis case management for Virginia post-9/11 wounded warriors and their families.",
    website_url: "https://www.hopeforthewarriors.org/", phone: "910-938-1817",
    address: "8003 Forbes Pl, Suite 201", city: "Springfield", zip: "22151",
    source_name: "Hope For The Warriors" },

  { section: "M", title: "Folds of Honor — Virginia Scholarships",
    cat: "education", sub: "Tuition Assistance",
    desc: "National nonprofit providing K-12 and post-secondary scholarships to spouses and children of fallen or disabled service members; multiple Virginia chapters fundraise locally and award scholarships to Virginia military families annually.",
    website_url: "https://foldsofhonor.org/", phone: "918-274-4700",
    address: "Virginia State Chapter", city: "Richmond", zip: "23219",
    source_name: "Folds of Honor" },

  { section: "M", title: "Honor Flight Network — Virginia Hubs",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Honor Flight Network has multiple Virginia hubs (Honor Flight Top of Virginia in Winchester, Honor Flight Tri-State in Bristol-area, Honor Flight Historic Triangle in Williamsburg). Free day-trips for senior Virginia veterans to visit war memorials in Washington DC.",
    website_url: "https://www.honorflight.org/", phone: "937-521-2400",
    address: "Network HQ", city: "Williamsburg", zip: "23185",
    source_name: "Honor Flight Network" },

  { section: "M", title: "American Red Cross — Virginia Service to Armed Forces",
    cat: "family-support", sub: "Military Family Support",
    desc: "American Red Cross Virginia Region SAF program — 24/7 emergency communication between deployed Virginia service members and families, financial-emergency assistance via Hero Care, military-spouse career resources, and resilience training.",
    website_url: "https://www.redcross.org/about-us/our-work/military-families.html", phone: "877-272-7337",
    address: "4400 Cox Rd", city: "Glen Allen", zip: "23060",
    source_name: "American Red Cross" },

  { section: "M", title: "Operation Gratitude — Virginia",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "National nonprofit assembling and shipping care packages to deployed troops, new recruits, veterans, military families, and first responders. Virginia volunteer hubs assemble packages at NS Norfolk MWR, JBLE, and Fort Belvoir community events.",
    website_url: "https://www.operationgratitude.com/", phone: "800-651-2887",
    address: "Virginia Volunteer Hub", city: "Norfolk", zip: "23510",
    source_name: "Operation Gratitude" },

  { section: "M", title: "Disabled American Veterans Transportation Network — Virginia",
    cat: "transportation", sub: "VA Medical Transport",
    desc: "DAV Transportation Network operates volunteer-driver fleets at McGuire VAMC (Richmond), Hampton VAMC, and Salem VAMC plus regional CBOCs — free transportation for Virginia veterans to and from VA medical appointments. No income test.",
    website_url: "https://www.dav.org/veterans/dav-transportation-network/", phone: "859-441-7300",
    address: "1201 Broad Rock Blvd, McGuire VAMC", city: "Richmond", zip: "23249",
    source_name: "Disabled American Veterans" },

  { section: "M", title: "Marine Corps League — Virginia Department",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "Marine Corps League Department of Virginia — congressionally chartered VSO for Marines and FMF Corpsmen; ~30 detachments statewide; VA-accredited service officers at department HQ; community-service events, scholarships, and Toys for Tots Virginia campaigns.",
    website_url: "https://www.mcleague.org/", phone: "703-207-9588",
    address: "Department of Virginia", city: "Richmond", zip: "23230",
    source_name: "Marine Corps League — Department of Virginia" },

  // ===========================================================================
  // N. Virginia Career Works workforce / employment centers
  // ===========================================================================
  { section: "N", title: "Capital Region Workforce Center (Richmond)",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Capital Region center — DVOP/LVER veteran specialists offer priority of service, resume help, job-search workshops, and on-the-job training placements for Richmond-area veterans and military spouses.",
    website_url: "https://www.vacareerworks.org/", phone: "804-249-5680",
    address: "121 Cedar St", city: "Richmond", zip: "23223",
    source_name: "Virginia Career Works" },

  { section: "N", title: "Northern Region Workforce Center (Woodbridge)",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Northern Region centers (multiple NoVA locations) — DVOP/LVER veteran specialists, Virginia Workforce Connection job board, transition assistance for Pentagon/Belvoir/Quantico-area veterans and military spouses.",
    website_url: "https://www.vcwnorthern.com/", phone: "703-752-1606",
    address: "13585 Minnieville Rd", city: "Woodbridge", zip: "22193",
    source_name: "Virginia Career Works" },

  { section: "N", title: "Hampton Roads Workforce Center (Norfolk)",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Hampton Roads centers (Norfolk, VA Beach, Newport News, Hampton, Suffolk, Portsmouth) — DVOP/LVER veteran specialists serve transitioning sailors, airmen, and Marines from NS Norfolk, JBLE, and JEB Little Creek-Fort Story.",
    website_url: "https://www.hamptonroadsworkforce.org/", phone: "757-455-9300",
    address: "861 Glenrock Rd, Suite 201", city: "Norfolk", zip: "23502",
    source_name: "Virginia Career Works — Hampton Roads" },

  { section: "N", title: "New River / Mount Rogers Workforce Center (Wytheville)",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works New River/Mount Rogers Region centers (Wytheville, Christiansburg, Galax) — DVOP/LVER veteran specialists serve southwest Virginia rural veterans with priority of service, on-the-job training, and apprenticeship placements.",
    website_url: "https://www.nrmrworks.org/", phone: "276-228-4081",
    address: "165 Peppers Ferry Rd NE", city: "Wytheville", zip: "24382",
    source_name: "Virginia Career Works — New River/Mount Rogers" },

  { section: "N", title: "West Piedmont Workforce Center (Martinsville)",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works West Piedmont Region (Martinsville, Danville, Henry, Patrick, Pittsylvania) — DVOP/LVER veteran specialists serve southside veterans transitioning from manufacturing/textile to advanced-manufacturing careers.",
    website_url: "https://wpworks.org/", phone: "276-403-5575",
    address: "20 E Church St", city: "Martinsville", zip: "24112",
    source_name: "Virginia Career Works — West Piedmont" },

  { section: "N", title: "Blue Ridge Workforce Center (Roanoke)",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Blue Ridge Region (Roanoke, Salem, Alleghany, Botetourt, Craig, Franklin, Roanoke County) — DVOP/LVER veteran specialists serve Roanoke Valley veterans with priority of service, OJT placements, and trade training.",
    website_url: "https://blueridgevcw.com/", phone: "540-767-6322",
    address: "3601 Thirlane Rd NW", city: "Roanoke", zip: "24019",
    source_name: "Virginia Career Works — Blue Ridge" },

  { section: "N", title: "Shenandoah Valley Workforce Center (Verona)",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Shenandoah Valley Region (Winchester, Harrisonburg, Staunton, Lexington) — DVOP/LVER veteran specialists serve Shenandoah Valley veterans with priority of service, healthcare/manufacturing OJT, and trucking apprenticeships.",
    website_url: "https://valleyworkforce.com/", phone: "540-442-7134",
    address: "PO Box 869", city: "Verona", zip: "24482",
    source_name: "Virginia Career Works — Shenandoah Valley" },

  // ===========================================================================
  // O. Specialty veteran populations (women, LGBTQ, transitioning service members)
  // ===========================================================================
  { section: "O", title: "Women Veterans Interactive Foundation — Virginia",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "National women-veteran-led nonprofit (with Virginia outreach) — peer-led healing retreats, mentoring, employment and entrepreneurship support, and crisis-bridge financial assistance for women veterans across all eras.",
    website_url: "https://womenveteransinteractive.org/", phone: "877-984-3041",
    address: "Mid-Atlantic Regional Outreach", city: "Alexandria", zip: "22301",
    source_name: "Women Veterans Interactive Foundation" },

  { section: "O", title: "SWAN — Service Women's Action Network",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "National advocacy organization for women in the military and women veterans. Free Helpline for service-related discrimination, MST/sexual assault navigation, healthcare advocacy, and policy advocacy benefiting Virginia's ~70,000 women veterans.",
    website_url: "https://www.servicewomen.org/", phone: "646-569-5638",
    address: "Virginia Outreach", city: "Arlington", zip: "22202",
    source_name: "Service Women's Action Network" },

  { section: "O", title: "Modern Military Association of America — Virginia",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "National advocacy and support organization for LGBTQ+ active duty, veterans, and military families. Free legal-referral helpline, discharge upgrade support for those discharged under DADT, and chapter events serving Virginia LGBTQ+ veterans.",
    website_url: "https://modernmilitary.org/", phone: "202-328-3244",
    address: "Virginia Chapter", city: "Arlington", zip: "22203",
    source_name: "Modern Military Association of America" },

  { section: "O", title: "Onward to Opportunity (O2O) — Hampton Roads",
    cat: "employment", sub: "Job Placement Programs",
    desc: "Syracuse University Institute for Veterans and Military Families program — free industry-recognized professional certification training for transitioning service members, veterans, and military spouses; on-base classes at NS Norfolk, JBLE, and Quantico.",
    website_url: "https://ivmf.syracuse.edu/programs/career-training/", phone: "315-443-0141",
    address: "Hampton Roads cohort", city: "Virginia Beach", zip: "23462",
    source_name: "IVMF Syracuse University" },
];

await runSeed(ROWS, {
  state: "VA",
  commit: COMMIT,
  scriptName: "seed-va-wave2.ts (FL-pattern Wave 2)",
  urlCheckTimeoutMs: 12000,
  allowBrokenUrls: ALLOW_BROKEN_URLS,
  allowZipBleed: ALLOW_ZIP_BLEED,
  sectionLabels: {
    A: "State agencies / specialty",
    B: "VA facilities (telehealth/women/cemeteries)",
    C: "Regional CSBs (mental health)",
    D: "NoVA county/local backbone",
    E: "Hampton Roads county/local",
    F: "Richmond county/local",
    G: "Southwest VA county/local",
    H: "Piedmont county/local",
    I: "Shenandoah county/local",
    J: "Northern Neck / Middle Peninsula",
    K: "Southside / Lynchburg county/local",
    L: "Specialty crisis programs",
    M: "National VSOs w/ VA presence",
    N: "Virginia Career Works centers",
    O: "Specialty veteran populations",
  },
});
