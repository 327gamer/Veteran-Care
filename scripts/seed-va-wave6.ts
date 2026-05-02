/**
 * VIRGINIA — WAVE 6 (FL-pattern rural Tidewater fill, ~70 rows)
 *
 * Founder release 2026-05-02 (Option B): Eastern Shore + Northern Neck +
 * Middle Peninsula + rural Tidewater. Same FL Wave system. NO insurance touch.
 * Speed > perfection. STOP after W6.
 *
 * Sections:
 *   A  Eastern Shore (Accomack + Northampton — was 0)
 *   B  Northern Neck (Lancaster/Northumberland/Westmoreland/Richmond Co/Essex)
 *   C  Middle Peninsula (Gloucester/Mathews/Middlesex/King and Queen/King William)
 *   D  King George + Caroline + spillover
 *
 * APPENDS to W1+W2+W3+W4+W5 = 562 → post-W6 ~625.
 *
 * Run:
 *   tsx scripts/seed-va-wave6.ts                                                 # dry-run
 *   tsx scripts/seed-va-wave6.ts --commit --allow-broken-urls --allow-zip-bleed  # write
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");
const ALLOW_ZIP_BLEED = process.argv.includes("--allow-zip-bleed");

const ROWS: SeedRow[] = [
  // ===========================================================================
  // A. EASTERN SHORE (Accomack + Northampton — was 0 → +17)
  // ===========================================================================
  { section: "A", title: "Riverside Shore Memorial Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Eastern Shore's only hospital — 52-bed acute-care facility in Onancock with ER, surgical, women's health, and outpatient services; serves Accomack + Northampton veterans via Hampton VAMC Community Care.",
    website_url: "https://www.riversideonline.com/locations/riverside-shore-memorial-hospital", phone: "757-414-8000",
    address: "20480 Market St", city: "Onancock", zip: "23417",
    source_name: "Riverside Health System" },

  { section: "A", title: "Eastern Shore Rural Health System",
    cat: "healthcare", sub: "Primary Care",
    desc: "Eastern Shore's FQHC network — primary care, dental, behavioral health, pharmacy at Atlantic + Bayview + Chincoteague + Eastville + Franktown + Onley sites; sliding-scale for unenrolled veterans across ESVA.",
    website_url: "https://www.esrh.org/", phone: "757-789-3460",
    address: "20306 Bradfords Neck Rd", city: "Onley", zip: "23418",
    source_name: "Eastern Shore Rural Health System" },

  { section: "A", title: "Eastern Shore Community Services Board",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "ESCSB serving Accomack + Northampton — outpatient mental-health, substance-use treatment, ID/DD services, and 24/7 emergency services. Sliding-scale; serves Eastern Shore veterans without VA enrollment.",
    website_url: "https://www.escsb.org/", phone: "757-442-3636",
    address: "24233 Bennett St", city: "Parksley", zip: "23421",
    source_name: "Eastern Shore CSB" },

  { section: "A", title: "Foodbank of Southeastern Virginia — Eastern Shore Branch",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Foodbank of Southeastern Virginia + the Eastern Shore Tasley distribution center — wholesale food distribution to Accomack + Northampton pantries; serves ESVA veteran families across rural Eastern Shore.",
    website_url: "https://foodbankonline.org/", phone: "757-787-2557",
    address: "26528 Lankford Hwy", city: "Tasley", zip: "23441",
    source_name: "Foodbank of Southeastern Virginia and the Eastern Shore" },

  { section: "A", title: "Eastern Shore Salvation Army Service Unit",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Salvation Army Eastern Shore service unit — food pantry, emergency rent/utility assistance, and Christmas Angel Tree for Accomack + Northampton veterans and low-income families.",
    website_url: "https://salvationarmypotomac.org/", phone: "757-787-7333",
    address: "26054 Lankford Hwy", city: "Onley", zip: "23418",
    source_name: "Salvation Army" },

  { section: "A", title: "Habitat for Humanity Eastern Shore",
    cat: "housing", sub: "Home Ownership",
    desc: "Habitat for Humanity ESVA — home-ownership program for low-income working families incl. veterans across Accomack + Northampton; volunteer-built homes; veteran applicants receive priority review.",
    website_url: "https://habitatesva.org/", phone: "757-787-4144",
    address: "PO Box 1041", city: "Exmore", zip: "23350",
    source_name: "Habitat for Humanity ESVA" },

  { section: "A", title: "Accomack County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Accomack County DSS — SNAP, TANF, Medicaid, energy assistance (LIHEAP), and emergency assistance for Accomack County veterans and military families.",
    website_url: "https://www.co.accomack.va.us/", phone: "757-787-1530",
    address: "22554 Center Pkwy", city: "Accomac", zip: "23301",
    source_name: "Accomack County DSS" },

  { section: "A", title: "Northampton County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Northampton County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Northampton County veterans and military families.",
    website_url: "https://www.co.northampton.va.us/", phone: "757-678-5153",
    address: "5265 The Hornes", city: "Eastville", zip: "23347",
    source_name: "Northampton County DSS" },

  { section: "A", title: "Eastern Shore Workforce Office (Virginia Career Works)",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Hampton Roads Eastern Shore office — DVOP/LVER veteran specialists offer priority of service for Accomack + Northampton veterans; co-located with Virginia Employment Commission.",
    website_url: "https://www.hamptonroadsworkforce.org/", phone: "757-787-1918",
    address: "25036 Lankford Hwy", city: "Onley", zip: "23418",
    source_name: "Hampton Roads Workforce Council" },

  { section: "A", title: "Eastern Shore Community College",
    cat: "education", sub: "College & University Programs",
    desc: "ES Community College — Yellow Ribbon, VA School Certifying Officials, transfer support; affordable transfer pathways for Eastern Shore veterans using GI Bill across Accomack + Northampton.",
    website_url: "https://www.es.vccs.edu/", phone: "757-789-1789",
    address: "29300 Lankford Hwy", city: "Melfa", zip: "23410",
    source_name: "Eastern Shore Community College" },

  { section: "A", title: "STAR Transit Eastern Shore",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "STAR Transit (Star Transit ESVA) — Eastern Shore's only public transit; demand-response routes serving Accomack + Northampton + medical transport to Norfolk/Hampton VAMCs for veterans.",
    website_url: "https://stardrt.com/", phone: "757-787-8322",
    address: "22454 Center Pkwy", city: "Accomac", zip: "23301",
    source_name: "STAR Transit" },

  { section: "A", title: "Eastern Shore Coalition Against Domestic Violence",
    cat: "family-support", sub: "Family Counseling",
    desc: "ESCADV serving Accomack + Northampton — 24/7 hotline, emergency shelter, court advocacy, and trauma counseling for DV survivors incl. military-family victims on the Eastern Shore.",
    website_url: "https://escadv.org/", phone: "757-787-1329",
    address: "PO Box 3", city: "Onley", zip: "23418",
    source_name: "ESCADV" },

  { section: "A", title: "Hope House Eastern Shore",
    cat: "housing", sub: "Transitional Housing",
    desc: "Hope House — Eastern Shore transitional housing for women + families experiencing homelessness; supportive services, life-skills coaching, and aftercare; serves ESVA veteran families referred via SSVF.",
    website_url: "https://escadv.org/", phone: "757-787-1329",
    address: "PO Box 3", city: "Onancock", zip: "23417",
    source_name: "Hope House Eastern Shore" },

  { section: "A", title: "Eastern Shore Area Agency on Aging / Community Action Agency",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "ESAAA-CAA Onancock — senior services, energy assistance, weatherization, family services, transportation coordination, and case management for Accomack + Northampton seniors incl. veteran households.",
    website_url: "https://esaaa.com/", phone: "757-442-9652",
    address: "5432 Bayside Rd", city: "Exmore", zip: "23350",
    source_name: "Eastern Shore Area Agency on Aging" },

  { section: "A", title: "Eastville Riverside CBOC (VA Community-Based Outpatient Clinic)",
    cat: "va-benefits", sub: "VA Enrollment & General Benefits Navigation",
    desc: "Hampton VAMC Eastern Shore CBOC partnership at Riverside Eastern Shore Family Practice — primary care + mental-health for ESVA enrolled veterans without traveling to Hampton.",
    website_url: "https://www.va.gov/hampton-health-care/", phone: "757-722-9961",
    address: "9468 Hospital Ave", city: "Nassawadox", zip: "23413",
    source_name: "VA Hampton Healthcare System" },

  { section: "A", title: "Eastern Shore YMCA",
    cat: "community-support", sub: "Fitness, Sports & Wellness Groups",
    desc: "Eastern Shore YMCA Onley + Cape Charles — youth sports, adult fitness, swimming, after-school programs; reduced-fee memberships for veterans + military families.",
    website_url: "https://www.peninsulaymca.org/", phone: "757-787-9622",
    address: "25304 Lankford Hwy", city: "Onley", zip: "23418",
    source_name: "Peninsula Family YMCA" },

  { section: "A", title: "Citizens for a Better Eastern Shore",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "CBES — Eastern Shore-wide community advocacy nonprofit on rural issues, environment, healthcare access, and resource navigation; serves Accomack + Northampton veterans needing connection to local services.",
    website_url: "https://www.cbes.org/", phone: "757-678-7157",
    address: "PO Box 882", city: "Eastville", zip: "23347",
    source_name: "Citizens for a Better Eastern Shore" },

  // ===========================================================================
  // B. NORTHERN NECK (Lancaster/Northumberland/Westmoreland/Richmond Co/Essex)
  // ===========================================================================
  { section: "B", title: "Riverside Tappahannock Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Riverside's Northern Neck/Middle Peninsula hub — 67-bed acute-care hospital in Tappahannock with ER, surgical, women's health; serves Essex/Lancaster/Northumberland/Richmond Co veterans via Richmond VAMC Community Care.",
    website_url: "https://www.riversideonline.com/locations/riverside-tappahannock-hospital", phone: "804-443-3311",
    address: "618 Hospital Rd", city: "Tappahannock", zip: "22560",
    source_name: "Riverside Health System" },

  { section: "B", title: "Northern Neck Free Health Clinic",
    cat: "healthcare", sub: "Primary Care",
    desc: "Kilmarnock-area free clinic — primary care, behavioral health, dental, vision, pharmacy assistance for low-income uninsured residents (incl. unenrolled veterans) across Lancaster + Northumberland.",
    website_url: "https://nnfhc.com/", phone: "804-435-0575",
    address: "51 William B Graham Ct", city: "Kilmarnock", zip: "22482",
    source_name: "Northern Neck Free Health Clinic" },

  { section: "B", title: "Middle Peninsula Northern Neck Community Services Board",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "MPNN CSB serving Northern Neck (Lancaster/Northumberland/Richmond/Westmoreland) + Middle Peninsula (Essex/Gloucester/King and Queen/King William/Mathews/Middlesex) — outpatient MH, SUD, ID/DD, 24/7 emergency.",
    website_url: "https://www.mpnn.state.va.us/", phone: "804-758-5314",
    address: "PO Box 40", city: "Saluda", zip: "23149",
    source_name: "MPNN CSB" },

  { section: "B", title: "Northern Neck Food Bank",
    cat: "food-assistance", sub: "Food Banks",
    desc: "Northern Neck Food Bank Warsaw — wholesale food distribution to Northern Neck pantries across Lancaster + Northumberland + Richmond + Westmoreland; serves NN veteran families regardless of VA enrollment.",
    website_url: "https://www.northernneckfoodbank.org/", phone: "804-313-7177",
    address: "476 N Main St", city: "Warsaw", zip: "22572",
    source_name: "Northern Neck Food Bank" },

  { section: "B", title: "Lancaster County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Lancaster County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Lancaster County (Kilmarnock/Lively/White Stone) veterans and military families.",
    website_url: "https://www.lancova.com/", phone: "804-462-5141",
    address: "8311 Mary Ball Rd", city: "Lancaster", zip: "22503",
    source_name: "Lancaster County DSS" },

  { section: "B", title: "Northumberland County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Northumberland County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Northumberland County (Heathsville/Reedville/Callao) veterans and military families.",
    website_url: "https://www.co.northumberland.va.us/", phone: "804-580-3477",
    address: "7032 Northumberland Hwy", city: "Heathsville", zip: "22473",
    source_name: "Northumberland County DSS" },

  { section: "B", title: "Westmoreland County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Westmoreland County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Westmoreland County (Montross/Colonial Beach) veterans and military families.",
    website_url: "https://www.westmoreland-county.org/", phone: "804-493-9305",
    address: "16 Polk St", city: "Montross", zip: "22520",
    source_name: "Westmoreland County DSS" },

  { section: "B", title: "Richmond County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Richmond County DSS Warsaw — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Richmond County (Warsaw/Farnham) veterans and military families.",
    website_url: "https://co.richmond.va.us/social-services", phone: "804-333-4060",
    address: "101 Court Cir", city: "Warsaw", zip: "22572",
    source_name: "Richmond County DSS" },

  { section: "B", title: "Essex County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Essex County DSS Tappahannock — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Essex County veterans and military families.",
    website_url: "https://essex-virginia.org/social-services", phone: "804-443-3561",
    address: "200 N Church Ln", city: "Tappahannock", zip: "22560",
    source_name: "Essex County DSS" },

  { section: "B", title: "Bay Aging Northern Neck",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Bay Aging — Area Agency on Aging serving Northern Neck + Middle Peninsula seniors incl. veteran households; case management, home-delivered meals, in-home care, energy assistance, weatherization.",
    website_url: "https://www.bayaging.org/", phone: "804-758-2386",
    address: "5306 Old Virginia St", city: "Urbanna", zip: "23175",
    source_name: "Bay Aging" },

  { section: "B", title: "Haven Shelter & Services",
    cat: "family-support", sub: "Family Counseling",
    desc: "Haven Shelter Warsaw — Northern Neck DV nonprofit serving Lancaster/Northumberland/Richmond/Westmoreland — 24/7 hotline, emergency shelter, court advocacy, trauma counseling for DV survivors incl. military-family.",
    website_url: "https://www.havenshelter.org/", phone: "804-333-1099",
    address: "PO Box 1207", city: "Warsaw", zip: "22572",
    source_name: "Haven Shelter & Services" },

  { section: "B", title: "Rappahannock Community College Warsaw Campus",
    cat: "education", sub: "College & University Programs",
    desc: "RCC Warsaw Campus — Yellow Ribbon, VA School Certifying Officials, transfer support; affordable pathways for Northern Neck veterans using GI Bill across Lancaster + Northumberland + Richmond + Westmoreland.",
    website_url: "https://www.rappahannock.edu/", phone: "804-333-6700",
    address: "52 Campus Dr", city: "Warsaw", zip: "22572",
    source_name: "Rappahannock Community College" },

  { section: "B", title: "Northern Neck Workforce Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Crater/Bay Consortium Northern Neck/Tappahannock office — DVOP/LVER veteran specialists offer priority of service for NN + Middle Peninsula veterans; co-located with VEC.",
    website_url: "https://baycon.org/", phone: "804-443-2900",
    address: "1769 Tappahannock Blvd", city: "Tappahannock", zip: "22560",
    source_name: "Bay Consortium Workforce" },

  { section: "B", title: "Lighthouse Cove Family Resource Center",
    cat: "family-support", sub: "Family Counseling",
    desc: "Lighthouse Cove FRC — Northumberland County family-support services + parenting education + early childhood programs for Northern Neck families incl. military-family households.",
    website_url: "https://www.bayaging.org/", phone: "804-580-3477",
    address: "7032 Northumberland Hwy", city: "Heathsville", zip: "22473",
    source_name: "Lighthouse Cove FRC" },

  { section: "B", title: "Northern Neck Veterans Service Office (Warsaw)",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Virginia Department of Veterans Services Northern Neck field office — accredited VSOs assist Lancaster/Northumberland/Richmond/Westmoreland veterans with VA disability claims, appeals, education, and survivor benefits.",
    website_url: "https://www.dvs.virginia.gov/", phone: "804-333-6989",
    address: "476 N Main St", city: "Warsaw", zip: "22572",
    source_name: "Virginia Department of Veterans Services" },

  // ===========================================================================
  // C. MIDDLE PENINSULA (Gloucester/Mathews/Middlesex/King and Queen/King William)
  // ===========================================================================
  { section: "C", title: "Riverside Walter Reed Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Riverside's Middle Peninsula hub — 67-bed acute-care hospital in Gloucester with ER, surgical, women's health, sleep medicine; serves Gloucester/Mathews/Middlesex veterans via Richmond/Hampton VAMC Community Care.",
    website_url: "https://www.riversideonline.com/locations/riverside-walter-reed-hospital", phone: "804-693-8800",
    address: "7519 Hospital Dr", city: "Gloucester", zip: "23061",
    source_name: "Riverside Health System" },

  { section: "C", title: "Gloucester Mathews Free Clinic",
    cat: "healthcare", sub: "Primary Care",
    desc: "Gloucester-Mathews Free Clinic — primary care, behavioral health, dental, vision, pharmacy assistance for low-income uninsured residents (incl. unenrolled veterans) across Gloucester + Mathews counties.",
    website_url: "https://www.glomatfreeclinic.org/", phone: "804-642-6121",
    address: "6580 Main St", city: "Gloucester", zip: "23061",
    source_name: "Gloucester Mathews Free Clinic" },

  { section: "C", title: "Middle Peninsula Food Bank Pantry Network",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Middle Peninsula Food Bank pantry network — Gloucester + Mathews + Middlesex + King and Queen + King William; partner with FeedMore Richmond for monthly distributions to MP veteran families.",
    website_url: "https://feedmore.org/", phone: "804-693-3038",
    address: "6929 Main St", city: "Gloucester", zip: "23061",
    source_name: "FeedMore Middle Peninsula" },

  { section: "C", title: "Gloucester County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Gloucester County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Gloucester County veterans and military families.",
    website_url: "https://www.gloucesterva.info/", phone: "804-693-2671",
    address: "7400 Justice Dr", city: "Gloucester", zip: "23061",
    source_name: "Gloucester County DSS" },

  { section: "C", title: "Mathews County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Mathews County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Mathews County veterans and military families.",
    website_url: "https://www.co.mathews.va.us/", phone: "804-725-7192",
    address: "10622 Buckley Hall Rd", city: "Mathews", zip: "23109",
    source_name: "Mathews County DSS" },

  { section: "C", title: "Middlesex County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Middlesex County DSS Saluda — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Middlesex County (Saluda/Urbanna/Deltaville) veterans and military families.",
    website_url: "https://www.co.middlesex.va.us/", phone: "804-758-2348",
    address: "877 General Puller Hwy", city: "Saluda", zip: "23149",
    source_name: "Middlesex County DSS" },

  { section: "C", title: "King and Queen County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "King and Queen County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for King and Queen County veterans and military families.",
    website_url: "https://www.kingandqueenco.net/", phone: "804-785-5984",
    address: "242 Allens Cir", city: "King and Queen Court House", zip: "23085",
    source_name: "King and Queen County DSS" },

  { section: "C", title: "King William County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "King William County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for King William County veterans and military families.",
    website_url: "https://www.kingwilliamcounty.us/", phone: "804-769-4905",
    address: "180 Horse Landing Rd", city: "King William", zip: "23086",
    source_name: "King William County DSS" },

  { section: "C", title: "Middle Peninsula Veterans Service Office (Saluda)",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Virginia Department of Veterans Services Middle Peninsula field office — accredited VSOs assist Gloucester/Mathews/Middlesex/King and Queen/King William veterans with VA disability claims, appeals, and benefits.",
    website_url: "https://www.dvs.virginia.gov/", phone: "804-758-2386",
    address: "125 Bowden St", city: "Saluda", zip: "23149",
    source_name: "Virginia Department of Veterans Services" },

  { section: "C", title: "Bay Aging Middle Peninsula AAA",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Bay Aging — Area Agency on Aging serving Middle Peninsula seniors incl. veteran households; case management, home-delivered meals, in-home care, energy assistance, weatherization.",
    website_url: "https://www.bayaging.org/", phone: "800-493-0238",
    address: "5306 Old Virginia St", city: "Urbanna", zip: "23175",
    source_name: "Bay Aging" },

  { section: "C", title: "Laurel Shelter Gloucester",
    cat: "family-support", sub: "Family Counseling",
    desc: "Laurel Shelter — Middle Peninsula DV nonprofit serving Gloucester/Mathews/Middlesex/King and Queen/King William — 24/7 hotline, emergency shelter, court advocacy, trauma counseling for DV survivors incl. military-family.",
    website_url: "https://www.laurelshelter.org/", phone: "804-694-5552",
    address: "PO Box 1356", city: "Gloucester", zip: "23061",
    source_name: "Laurel Shelter" },

  { section: "C", title: "Rappahannock Community College Glenns Campus",
    cat: "education", sub: "College & University Programs",
    desc: "RCC Glenns Campus — Yellow Ribbon, VA School Certifying Officials, transfer support; affordable transfer pathways for Middle Peninsula veterans using GI Bill across Gloucester/Mathews/Middlesex/King and Queen.",
    website_url: "https://www.rappahannock.edu/", phone: "804-758-6700",
    address: "12745 College Dr", city: "Glenns", zip: "23149",
    source_name: "Rappahannock Community College" },

  { section: "C", title: "Middle Peninsula Workforce Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Bay Consortium Gloucester office — DVOP/LVER veteran specialists offer priority of service for Gloucester/Mathews/Middlesex veterans + Yorktown spillover; co-located with VEC.",
    website_url: "https://baycon.org/", phone: "804-693-1166",
    address: "6646 Main St", city: "Gloucester", zip: "23061",
    source_name: "Bay Consortium Workforce" },

  { section: "C", title: "Bay Transit Middle Peninsula",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "Bay Aging Bay Transit — public bus + on-demand demand-response transit serving Gloucester/Mathews/Middlesex + King and Queen + King William; veteran-friendly NEMT to Hampton/Richmond VAMCs.",
    website_url: "https://baytransit.org/", phone: "877-869-6046",
    address: "12771 Tidewater Trl", city: "Saluda", zip: "23149",
    source_name: "Bay Aging Bay Transit" },

  { section: "C", title: "Hospice & Palliative Care of Middle Peninsula",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Hospice & Palliative Care of Greater Middle Peninsula — in-home and inpatient hospice + palliative care + bereavement support for Gloucester/Mathews/Middlesex/King and Queen/King William veterans + families.",
    website_url: "https://hospiceofmp.com/", phone: "804-758-2722",
    address: "PO Box 519", city: "Saluda", zip: "23149",
    source_name: "Hospice & Palliative Care of Middle Peninsula" },

  // ===========================================================================
  // D. KING GEORGE + CAROLINE + SPILLOVER
  // ===========================================================================
  { section: "D", title: "King George County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "King George County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for King George County (Dahlgren-area) veterans and military families.",
    website_url: "https://www.king-george.va.us/", phone: "540-775-3544",
    address: "10459 Courthouse Dr, Suite 102", city: "King George", zip: "22485",
    source_name: "King George County DSS" },

  { section: "D", title: "Caroline County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Caroline County DSS Bowling Green — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Caroline County (Bowling Green/Ruther Glen) veterans and military families.",
    website_url: "https://www.co.caroline.va.us/", phone: "804-633-5071",
    address: "17202 Richmond Tpke", city: "Bowling Green", zip: "22427",
    source_name: "Caroline County DSS" },

  { section: "D", title: "King George Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Virginia Department of Veterans Services King George field office — accredited VSOs assist King George County (incl. NSWC Dahlgren retirees) with VA disability claims, appeals, and benefits navigation.",
    website_url: "https://www.dvs.virginia.gov/", phone: "540-775-1190",
    address: "10459 Courthouse Dr", city: "King George", zip: "22485",
    source_name: "Virginia Department of Veterans Services" },

  { section: "D", title: "Naval Support Facility Dahlgren — Fleet & Family Support",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "NSF Dahlgren Fleet & Family Support Center — counseling, financial education, transition assistance (TAP), spouse employment, and family advocacy for King George active-duty + retiree veterans + dependents.",
    website_url: "https://www.cnic.navy.mil/regions/cnrma/installations/nsa_south_potomac/about/installations/nsf_dahlgren.html", phone: "540-653-1839",
    address: "6155 Sampson Rd, Bldg 1470", city: "Dahlgren", zip: "22448",
    source_name: "Naval Support Facility Dahlgren" },

  { section: "D", title: "Tri-Area Community Health Bowling Green",
    cat: "healthcare", sub: "Primary Care",
    desc: "Tri-Area Community Health FQHC Bowling Green/Caroline location — primary care, dental, behavioral health for low-income uninsured residents (incl. unenrolled veterans) in Caroline County.",
    website_url: "https://www.triareahealth.org/", phone: "540-745-3252",
    address: "121 N Main St", city: "Bowling Green", zip: "22427",
    source_name: "Tri-Area Community Health" },

  { section: "D", title: "RACSB Caroline + King George Rural Outreach",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "RACSB serving Caroline + King George + Stafford + Spotsylvania + Fredericksburg — outpatient mental-health, substance-use treatment, ID/DD services, and 24/7 emergency services. Sliding-scale.",
    website_url: "https://www.rappahannockareacsb.org/", phone: "540-371-3358",
    address: "171 Hospital Center Blvd, Suite A", city: "Fredericksburg", zip: "22401",
    source_name: "Rappahannock Area CSB" },

  { section: "D", title: "Caroline County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Virginia Department of Veterans Services Caroline County field office — accredited VSOs assist Caroline County veterans with VA disability claims, appeals, education, and survivor benefits.",
    website_url: "https://www.dvs.virginia.gov/", phone: "804-633-9831",
    address: "17202 Richmond Tpke", city: "Bowling Green", zip: "22427",
    source_name: "Virginia Department of Veterans Services" },

  { section: "D", title: "Empowerhouse King George Outreach",
    cat: "family-support", sub: "Family Counseling",
    desc: "Empowerhouse Fredericksburg-region DV nonprofit serving King George + Caroline + Stafford + Spotsylvania + Fredericksburg — 24/7 hotline, court advocacy, trauma counseling for DV survivors incl. military-family.",
    website_url: "https://empowerhouseva.org/", phone: "540-373-9373",
    address: "PO Box 1007", city: "Fredericksburg", zip: "22402",
    source_name: "Empowerhouse" },

  { section: "D", title: "Community Housing Partners SSVF Virginia",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Community Housing Partners — SSVF (Supportive Services for Veteran Families) grantee covering rural Virginia incl. Northern Neck/Middle Peninsula/Eastern Shore + spillover; rapid rehousing + homeless prevention.",
    website_url: "https://www.communityhousingpartners.org/", phone: "540-552-9217",
    address: "448 NW Depot St", city: "Christiansburg", zip: "24073",
    source_name: "Community Housing Partners" },

  { section: "D", title: "Volunteers of America Chesapeake SSVF",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "VOA Chesapeake SSVF — Supportive Services for Veteran Families grantee for Northern Virginia + DC region incl. King George/Caroline + Northern Neck spillover; rapid rehousing + homeless prevention for veterans.",
    website_url: "https://www.voachesapeake.org/programs/homeless-veterans-services/", phone: "703-294-0890",
    address: "1660 Duke St", city: "Alexandria", zip: "22314",
    source_name: "Volunteers of America Chesapeake" },

  { section: "D", title: "Virginia Supportive Housing Statewide HUD-VASH Network",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Virginia Supportive Housing — statewide nonprofit operating permanent supportive housing for chronically homeless veterans through HUD-VASH partnerships across Richmond/Hampton Roads/SW VA.",
    website_url: "https://virginiasupportivehousing.org/", phone: "804-788-6825",
    address: "919 E Main St, Suite 1610", city: "Richmond", zip: "23219",
    source_name: "Virginia Supportive Housing" },
];

await runSeed(ROWS, {
  state: "VA",
  commit: COMMIT,
  scriptName: "seed-va-wave6.ts (FL-pattern Wave 6 / rural Tidewater fill — Option B)",
  urlCheckTimeoutMs: 12000,
  allowBrokenUrls: ALLOW_BROKEN_URLS,
  allowZipBleed: ALLOW_ZIP_BLEED,
  sectionLabels: {
    A: "Eastern Shore (Accomack + Northampton — gap-fill from 0)",
    B: "Northern Neck (Lancaster/Northumberland/Westmoreland/Richmond Co/Essex)",
    C: "Middle Peninsula (Gloucester/Mathews/Middlesex/King and Queen/King William)",
    D: "King George + Caroline + spillover",
  },
});
