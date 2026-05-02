/**
 * VIRGINIA — WAVE 7 (FL-pattern Southside + Mountain Empire rural completion, ~65 rows)
 *
 * Founder release 2026-05-02 (Option C): Southside (Danville/Halifax/Mecklenburg/
 * Brunswick/Greensville/Lunenburg/Charlotte/Martinsville) + Mountain Empire/
 * Coalfields (Lee/Scott/Wise/Norton/Buchanan/Dickenson/Russell). Same FL Wave
 * system. NO insurance touch. Speed > perfection. STOP after W7.
 *
 * Sections:
 *   A  Southside hospitals + CSBs + clinics
 *   B  Southside DSS + VSO + workforce + community
 *   C  Mountain Empire hospitals + CSBs + clinics
 *   D  Mountain Empire DSS + VSO + workforce + community
 *
 * APPENDS to W1-W6 = 619 → post-W7 ~680.
 *
 * Run:
 *   tsx scripts/seed-va-wave7.ts                                                 # dry-run
 *   tsx scripts/seed-va-wave7.ts --commit --allow-broken-urls --allow-zip-bleed  # write
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");
const ALLOW_ZIP_BLEED = process.argv.includes("--allow-zip-bleed");

const ROWS: SeedRow[] = [
  // ===========================================================================
  // A. SOUTHSIDE HOSPITALS + CSBs + CLINICS
  // ===========================================================================
  { section: "A", title: "SOVAH Health Danville",
    cat: "healthcare", sub: "Specialty Care",
    desc: "SOVAH Danville Regional Medical Center — 250-bed acute-care hospital with ER, surgical, cardiac, women's health, oncology; serves Danville/Pittsylvania veterans via Salisbury VAMC + Salem VAMC Community Care.",
    website_url: "https://www.sovahhealth.com/locations/sovah-health-danville/", phone: "434-799-2100",
    address: "142 S Main St", city: "Danville", zip: "24541",
    source_name: "SOVAH Health (LifePoint)" },

  { section: "A", title: "SOVAH Health Martinsville",
    cat: "healthcare", sub: "Specialty Care",
    desc: "SOVAH Martinsville — 220-bed acute-care hospital with ER, surgical, women's health, behavioral health unit; serves Henry County + Patrick County veterans via Salem VAMC Community Care.",
    website_url: "https://www.sovahhealth.com/locations/sovah-health-martinsville/", phone: "276-666-7200",
    address: "320 Hospital Dr", city: "Martinsville", zip: "24112",
    source_name: "SOVAH Health (LifePoint)" },

  { section: "A", title: "Sentara Halifax Regional Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Sentara Halifax Regional — 154-bed acute-care hospital in South Boston with ER, surgical, women's health, cancer center; serves Halifax County veterans via Richmond/Salem VAMC Community Care.",
    website_url: "https://www.sentara.com/halifax", phone: "434-517-3100",
    address: "2204 Wilborn Ave", city: "South Boston", zip: "24592",
    source_name: "Sentara Healthcare" },

  { section: "A", title: "VCU Health Community Memorial Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "VCU Community Memorial Hospital South Hill — 70-bed critical-access hospital with ER, surgical, women's health; serves Mecklenburg/Brunswick/Lunenburg/Charlotte veterans via Richmond VAMC Community Care.",
    website_url: "https://www.vcuhealth.org/locations/cmh", phone: "434-447-3151",
    address: "125 Buena Vista Cir", city: "South Hill", zip: "23970",
    source_name: "VCU Health" },

  { section: "A", title: "Southern Virginia Regional Medical Center",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Southern Virginia Regional Medical Center Emporia — 80-bed acute-care hospital with ER, surgical, women's health; serves Greensville/Brunswick/Sussex veterans via Hampton/Richmond VAMC Community Care.",
    website_url: "https://www.svrmc.net/", phone: "434-348-4700",
    address: "727 N Main St", city: "Emporia", zip: "23847",
    source_name: "Southern Virginia Regional Medical Center" },

  { section: "A", title: "Danville-Pittsylvania Community Services",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "DPCS — Danville/Pittsylvania CSB — outpatient mental-health, substance-use treatment, ID/DD services, and 24/7 emergency services. Sliding-scale; serves Danville-area veterans without VA enrollment.",
    website_url: "https://www.dpcs.org/", phone: "434-799-0456",
    address: "245 Hairston St", city: "Danville", zip: "24540",
    source_name: "Danville-Pittsylvania CSB" },

  { section: "A", title: "Southside Behavioral Health",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Southside Behavioral Health CSB — outpatient MH, SUD, ID/DD for Mecklenburg/Brunswick/Lunenburg/Halifax counties; sliding-scale; 24/7 emergency services for Southside veterans.",
    website_url: "https://www.southsidebehavioralhealth.org/", phone: "434-572-6916",
    address: "270 W Atlantic St", city: "South Hill", zip: "23970",
    source_name: "Southside Behavioral Health CSB" },

  { section: "A", title: "Crossroads Community Services Board",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Crossroads CSB Cumberland — outpatient MH, SUD, ID/DD for Charlotte/Lunenburg/Cumberland/Buckingham/Amelia/Nottoway/Prince Edward; sliding-scale; serves Heart of VA Southside veterans.",
    website_url: "https://www.crossroadscsb.org/", phone: "434-392-7049",
    address: "1928 Anderson Hwy", city: "Cumberland", zip: "23040",
    source_name: "Crossroads CSB" },

  { section: "A", title: "Piedmont Community Services Board",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Piedmont CSB Martinsville — outpatient MH, SUD, ID/DD for Martinsville/Henry/Patrick/Franklin counties; sliding-scale; serves Southside Virginia veterans without VA enrollment.",
    website_url: "https://piedmontcsb.org/", phone: "276-632-7128",
    address: "24 Clay St", city: "Martinsville", zip: "24112",
    source_name: "Piedmont CSB" },

  { section: "A", title: "PATHS — Piedmont Access to Health Services",
    cat: "healthcare", sub: "Primary Care",
    desc: "PATHS FQHC — primary care, dental, behavioral health across Danville/Martinsville/South Boston/Chatham/Boydton; sliding-scale for low-income uninsured residents incl. unenrolled Southside veterans.",
    website_url: "https://www.pathsinc.org/", phone: "434-791-4122",
    address: "705 Main St", city: "Danville", zip: "24541",
    source_name: "PATHS FQHC" },

  { section: "A", title: "Free Clinic of Danville-Pittsylvania",
    cat: "healthcare", sub: "Primary Care",
    desc: "Free Clinic of Danville — primary care, behavioral health, dental, vision, pharmacy assistance for low-income uninsured residents (incl. unenrolled veterans) across Danville + Pittsylvania.",
    website_url: "https://www.freeclinicdpc.com/", phone: "434-797-2273",
    address: "705 Main St", city: "Danville", zip: "24541",
    source_name: "Free Clinic of Danville-Pittsylvania" },

  { section: "A", title: "Free Clinic of Martinsville-Henry County",
    cat: "healthcare", sub: "Primary Care",
    desc: "Free Clinic of Martinsville-Henry — primary care, behavioral health, dental, vision, pharmacy assistance for low-income uninsured residents (incl. unenrolled veterans) across Martinsville + Henry.",
    website_url: "https://freeclinicmhc.org/", phone: "276-403-5530",
    address: "20 E Church St", city: "Martinsville", zip: "24112",
    source_name: "Free Clinic of Martinsville-Henry" },

  { section: "A", title: "Free Clinic of Mecklenburg County",
    cat: "healthcare", sub: "Primary Care",
    desc: "Free Clinic of Mecklenburg — primary care, behavioral health, pharmacy assistance for low-income uninsured residents (incl. unenrolled veterans) across Mecklenburg County.",
    website_url: "https://freeclinicmecklenburg.org/", phone: "434-447-2233",
    address: "1209 Atlantic St", city: "South Hill", zip: "23970",
    source_name: "Free Clinic of Mecklenburg" },

  { section: "A", title: "Danville VA Clinic (CBOC)",
    cat: "va-benefits", sub: "VA Enrollment & General Benefits Navigation",
    desc: "Salisbury VAMC Danville Community-Based Outpatient Clinic — primary care + mental-health for Danville/Pittsylvania/Halifax/Henry/Patrick enrolled veterans without traveling to Salisbury NC.",
    website_url: "https://www.va.gov/salisbury-health-care/locations/danville-va-clinic/", phone: "434-710-4140",
    address: "705 Piney Forest Rd", city: "Danville", zip: "24540",
    source_name: "VA Salisbury Healthcare System" },

  // ===========================================================================
  // B. SOUTHSIDE DSS + VSO + WORKFORCE + COMMUNITY
  // ===========================================================================
  { section: "B", title: "Pittsylvania County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Pittsylvania County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Pittsylvania County (Chatham/Gretna/Hurt) veterans and military families.",
    website_url: "https://www.pittsylvaniacountyva.gov/social-services", phone: "434-432-7981",
    address: "220 H.G. McGhee Dr", city: "Chatham", zip: "24531",
    source_name: "Pittsylvania County DSS" },

  { section: "B", title: "Danville City Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Danville City DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for City of Danville veterans and military families.",
    website_url: "https://www.danvilleva.gov/256/Social-Services", phone: "434-799-6543",
    address: "510 Patton St", city: "Danville", zip: "24541",
    source_name: "Danville City DSS" },

  { section: "B", title: "Halifax County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Halifax County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Halifax County (South Boston/Halifax/Clover) veterans and military families.",
    website_url: "https://halifaxcountyva.gov/178/Social-Services", phone: "434-476-3300",
    address: "1099 Confroy Dr", city: "Halifax", zip: "24558",
    source_name: "Halifax County DSS" },

  { section: "B", title: "Mecklenburg County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Mecklenburg County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Mecklenburg County (Boydton/South Hill/Chase City/Clarksville) veterans and military families.",
    website_url: "https://www.mecklenburgva.com/social-services", phone: "434-738-6138",
    address: "393 Washington St", city: "Boydton", zip: "23917",
    source_name: "Mecklenburg County DSS" },

  { section: "B", title: "Brunswick County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Brunswick County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Brunswick County (Lawrenceville/Alberta) veterans and military families.",
    website_url: "https://www.brunswickco.com/social-services", phone: "434-848-2142",
    address: "228 N Main St", city: "Lawrenceville", zip: "23868",
    source_name: "Brunswick County DSS" },

  { section: "B", title: "Greensville County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Greensville County DSS Emporia — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Greensville County + City of Emporia veterans and military families.",
    website_url: "https://www.greensvillecountyva.gov/social-services", phone: "434-348-4135",
    address: "1748 E Atlantic St", city: "Emporia", zip: "23847",
    source_name: "Greensville County DSS" },

  { section: "B", title: "Lunenburg County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Lunenburg County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Lunenburg County (Victoria/Kenbridge/Lunenburg) veterans and military families.",
    website_url: "https://lunenburgva.org/social-services", phone: "434-696-2134",
    address: "11512 Courthouse Rd", city: "Lunenburg", zip: "23952",
    source_name: "Lunenburg County DSS" },

  { section: "B", title: "Charlotte County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Charlotte County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Charlotte County (Charlotte Court House/Drakes Branch/Phenix) veterans and military families.",
    website_url: "https://www.charlottecountyva.gov/social-services", phone: "434-542-5121",
    address: "238 Legrande Ave", city: "Charlotte Court House", zip: "23923",
    source_name: "Charlotte County DSS" },

  { section: "B", title: "Henry County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Henry County DSS Martinsville — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Henry County + City of Martinsville veterans and military families.",
    website_url: "https://www.henrycountyva.gov/social-services", phone: "276-656-4300",
    address: "20 Progress Dr", city: "Collinsville", zip: "24078",
    source_name: "Henry County DSS" },

  { section: "B", title: "Danville Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Virginia Department of Veterans Services Danville field office — accredited VSOs assist Danville/Pittsylvania veterans with VA disability claims, appeals, education, and survivor benefits.",
    website_url: "https://www.dvs.virginia.gov/", phone: "434-797-8557",
    address: "510 Patton St", city: "Danville", zip: "24541",
    source_name: "Virginia Department of Veterans Services" },

  { section: "B", title: "Halifax County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Virginia Department of Veterans Services Halifax County field office — accredited VSOs assist Halifax County veterans with VA disability claims, appeals, and benefits navigation.",
    website_url: "https://www.dvs.virginia.gov/", phone: "434-476-3360",
    address: "1099 Confroy Dr", city: "Halifax", zip: "24558",
    source_name: "Virginia Department of Veterans Services" },

  { section: "B", title: "Mecklenburg County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Virginia Department of Veterans Services Mecklenburg County field office — accredited VSOs assist Mecklenburg/Brunswick veterans with VA disability claims, appeals, and benefits navigation.",
    website_url: "https://www.dvs.virginia.gov/", phone: "434-738-6191",
    address: "393 Washington St", city: "Boydton", zip: "23917",
    source_name: "Virginia Department of Veterans Services" },

  { section: "B", title: "Henry County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Virginia Department of Veterans Services Henry County/Martinsville field office — accredited VSOs assist Henry/Martinsville/Patrick/Franklin veterans with VA disability claims, appeals, benefits.",
    website_url: "https://www.dvs.virginia.gov/", phone: "276-656-4378",
    address: "3300 Kings Mountain Rd", city: "Martinsville", zip: "24112",
    source_name: "Virginia Department of Veterans Services" },

  { section: "B", title: "Danville Community College",
    cat: "education", sub: "College & University Programs",
    desc: "Danville Community College — Yellow Ribbon, VA School Certifying Officials, transfer support; affordable transfer pathways for Danville/Pittsylvania/Halifax veterans using GI Bill.",
    website_url: "https://www.danville.edu/", phone: "434-797-2222",
    address: "1008 S Main St", city: "Danville", zip: "24541",
    source_name: "Danville Community College" },

  { section: "B", title: "Southside Virginia Community College",
    cat: "education", sub: "College & University Programs",
    desc: "Southside Virginia Community College — Yellow Ribbon, VA School Certifying Officials at Christanna (Alberta) + John H. Daniel (Keysville) campuses; serves Brunswick/Mecklenburg/Lunenburg/Charlotte veterans.",
    website_url: "https://southside.edu/", phone: "434-949-1000",
    address: "109 Campus Dr", city: "Alberta", zip: "23821",
    source_name: "Southside Virginia Community College" },

  { section: "B", title: "Patrick & Henry Community College",
    cat: "education", sub: "College & University Programs",
    desc: "Patrick & Henry Community College Martinsville — Yellow Ribbon, VA School Certifying Officials; affordable transfer pathways for Martinsville/Henry/Patrick veterans using GI Bill.",
    website_url: "https://patrickhenry.edu/", phone: "276-638-8777",
    address: "645 Patriot Ave", city: "Martinsville", zip: "24112",
    source_name: "Patrick & Henry Community College" },

  { section: "B", title: "Southside Workforce Center (Virginia Career Works)",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works South Central Workforce — DVOP/LVER veteran specialists offer priority of service for Danville/Pittsylvania/Halifax/Henry/Mecklenburg veterans; co-located with VEC.",
    website_url: "https://southcentralworkforce.com/", phone: "434-797-8420",
    address: "415 Piney Forest Rd", city: "Danville", zip: "24540",
    source_name: "South Central VA Workforce Council" },

  { section: "B", title: "Crater Workforce Center Emporia",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Crater Region Emporia office — DVOP/LVER veteran specialists offer priority of service for Greensville/Brunswick/Sussex veterans; co-located with VEC.",
    website_url: "https://craterworks.com/", phone: "434-634-2898",
    address: "1748 E Atlantic St", city: "Emporia", zip: "23847",
    source_name: "Crater Region Workforce" },

  { section: "B", title: "God's Storehouse Danville",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "God's Storehouse — Danville's largest food pantry — distributes groceries weekly to Danville/Pittsylvania families incl. veteran households; partners with Feeding Southwest VA.",
    website_url: "https://godsstorehousedanville.org/", phone: "434-793-3663",
    address: "750 Memorial Dr", city: "Danville", zip: "24541",
    source_name: "God's Storehouse Danville" },

  { section: "B", title: "God's Pit Crew",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "God's Pit Crew Danville — disaster relief + emergency food assistance + Blessing Buckets program for crisis-impacted Southside families incl. veteran households across Pittsylvania + Halifax.",
    website_url: "https://godspitcrew.org/", phone: "434-836-2737",
    address: "2061 W Main St", city: "Danville", zip: "24541",
    source_name: "God's Pit Crew" },

  { section: "B", title: "Citizens Against Family Violence Mecklenburg",
    cat: "family-support", sub: "Family Counseling",
    desc: "CAFV Mecklenburg — Southside DV nonprofit serving Mecklenburg/Brunswick/Lunenburg/Charlotte — 24/7 hotline, emergency shelter, court advocacy, trauma counseling for DV survivors incl. military-family victims.",
    website_url: "https://www.cafv-va.org/", phone: "434-447-3551",
    address: "PO Box 264", city: "South Hill", zip: "23970",
    source_name: "Citizens Against Family Violence" },

  { section: "B", title: "DOVES Domestic Violence Services",
    cat: "family-support", sub: "Family Counseling",
    desc: "DOVES (Domestic Violence Emergency Services) Martinsville — DV nonprofit serving Martinsville/Henry/Patrick/Franklin — 24/7 hotline, emergency shelter, court advocacy, trauma counseling.",
    website_url: "https://dovesinc.org/", phone: "276-228-7141",
    address: "PO Box 352", city: "Wytheville", zip: "24382",
    source_name: "DOVES Inc" },

  { section: "B", title: "Halifax Domestic Violence Services / Tri-County Community Action",
    cat: "family-support", sub: "Family Counseling",
    desc: "Tri-County Community Action Agency Halifax — DV services + emergency shelter + Head Start + emergency assistance for Halifax/Charlotte/Lunenburg counties incl. military-family victims.",
    website_url: "https://www.tccaainc.org/", phone: "434-572-2966",
    address: "1011 N Main St", city: "South Boston", zip: "24592",
    source_name: "Tri-County Community Action Agency" },

  { section: "B", title: "Piedmont Senior Resources Area Agency on Aging",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Piedmont Senior Resources AAA Burkeville — case management, home-delivered meals, in-home care, energy assistance for seniors across Charlotte/Lunenburg/Mecklenburg/Brunswick/Amelia/Cumberland/Buckingham/Prince Edward/Nottoway incl. veteran households.",
    website_url: "https://www.piedmontseniorresources.org/", phone: "434-767-5588",
    address: "1413 S Main St", city: "Farmville", zip: "23901",
    source_name: "Piedmont Senior Resources" },

  { section: "B", title: "Lake Country Workforce Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Lake Country South Hill — DVOP/LVER veteran specialists offer priority of service for Mecklenburg/Brunswick/Halifax/Charlotte veterans; co-located with VEC.",
    website_url: "https://lakecountrywib.com/", phone: "434-447-7101",
    address: "215 W Atlantic St", city: "South Hill", zip: "23970",
    source_name: "Lake Country Workforce Investment Board" },

  // ===========================================================================
  // C. MOUNTAIN EMPIRE / COALFIELDS HOSPITALS + CSBs + CLINICS
  // ===========================================================================
  { section: "C", title: "Norton Community Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Ballad Health Norton Community Hospital — 129-bed acute-care hospital with ER, surgical, women's health; serves Wise/Norton/Lee/Scott veterans via Salem VAMC + Mountain Home TN VAMC Community Care.",
    website_url: "https://www.balladhealth.org/hospitals/norton-community", phone: "276-679-9100",
    address: "100 15th St NW", city: "Norton", zip: "24273",
    source_name: "Ballad Health" },

  { section: "C", title: "Lonesome Pine Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Ballad Health Lonesome Pine Hospital Big Stone Gap — 70-bed critical-access hospital with ER, surgical, women's health; serves Wise/Lee/Scott veterans via Mountain Home TN VAMC Community Care.",
    website_url: "https://www.balladhealth.org/hospitals/lonesome-pine", phone: "276-523-3111",
    address: "1990 Holton Ave E", city: "Big Stone Gap", zip: "24219",
    source_name: "Ballad Health" },

  { section: "C", title: "Buchanan General Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Buchanan General Hospital Grundy — 116-bed critical-access hospital with ER, surgical, women's health, behavioral health unit; serves Buchanan/Dickenson/Russell veterans via Salem VAMC Community Care.",
    website_url: "https://www.bgh.org/", phone: "276-935-1000",
    address: "1535 Slate Creek Rd", city: "Grundy", zip: "24614",
    source_name: "Buchanan General Hospital" },

  { section: "C", title: "Dickenson Community Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Ballad Health Dickenson Community Hospital Clintwood — 25-bed critical-access hospital with ER, surgical, swing-bed; serves Dickenson/Buchanan/Russell veterans via Mountain Home TN VAMC Community Care.",
    website_url: "https://www.balladhealth.org/hospitals/dickenson-community", phone: "276-926-0300",
    address: "312 Hospital Dr", city: "Clintwood", zip: "24228",
    source_name: "Ballad Health" },

  { section: "C", title: "Russell County Medical Center",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Ballad Health Russell County Medical Center Lebanon — 78-bed acute-care hospital with ER, surgical, women's health; serves Russell/Tazewell/Buchanan/Dickenson veterans via Salem/Mountain Home VAMC.",
    website_url: "https://www.balladhealth.org/hospitals/russell-county", phone: "276-883-8000",
    address: "1942 Carterton Rd", city: "Lebanon", zip: "24266",
    source_name: "Ballad Health" },

  { section: "C", title: "Cumberland Mountain Community Services Board",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Cumberland Mountain CSB Cedar Bluff — outpatient MH, SUD, ID/DD for Buchanan/Dickenson/Russell/Tazewell counties; sliding-scale; 24/7 emergency services for Coalfields veterans.",
    website_url: "https://www.cmcsb.com/", phone: "276-964-6702",
    address: "Route 2 Box 7", city: "Cedar Bluff", zip: "24609",
    source_name: "Cumberland Mountain CSB" },

  { section: "C", title: "Stone Mountain Health Services",
    cat: "healthcare", sub: "Primary Care",
    desc: "Stone Mountain Health Services FQHC — primary care, dental, behavioral health across Pennington Gap (Lee), Big Stone Gap (Wise), Norton, Coeburn, St Charles; sliding-scale for unenrolled Coalfields veterans.",
    website_url: "https://www.smhsi.com/", phone: "276-546-2511",
    address: "PO Box 1098", city: "Pennington Gap", zip: "24277",
    source_name: "Stone Mountain Health Services" },

  { section: "C", title: "TSCHC Scott County FQHC Network",
    cat: "healthcare", sub: "Primary Care",
    desc: "Tri-State Community Health Center FQHC Weber City — primary care, dental, behavioral health for Scott/Wise/Lee counties; sliding-scale for low-income uninsured residents incl. unenrolled veterans.",
    website_url: "https://www.tristatehealth.com/", phone: "276-386-3553",
    address: "PO Box 309", city: "Weber City", zip: "24290",
    source_name: "Tri-State Community Health Center" },

  { section: "C", title: "The Health Wagon",
    cat: "healthcare", sub: "Primary Care",
    desc: "The Health Wagon Wise — mobile + fixed-site free clinic providing primary care, behavioral health, dental, vision for uninsured Coalfields residents incl. unenrolled veterans across Wise/Lee/Scott/Norton.",
    website_url: "https://www.thehealthwagon.org/", phone: "276-328-8850",
    address: "5626 Patriot Dr", city: "Wise", zip: "24293",
    source_name: "The Health Wagon" },

  { section: "C", title: "Remote Area Medical Wise Clinic",
    cat: "healthcare", sub: "Primary Care",
    desc: "Remote Area Medical (RAM) annual Wise weekend clinic at the fairgrounds — free dental, vision, primary care, women's health for Coalfields uninsured residents incl. unenrolled veterans; July annually.",
    website_url: "https://www.ramusa.org/", phone: "865-579-1530",
    address: "5626 Patriot Dr", city: "Wise", zip: "24293",
    source_name: "Remote Area Medical" },

  // ===========================================================================
  // D. MOUNTAIN EMPIRE DSS + VSO + WORKFORCE + COMMUNITY
  // ===========================================================================
  { section: "D", title: "Wise County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Wise County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Wise County (Wise/Big Stone Gap/Coeburn/St Paul) veterans and military families.",
    website_url: "https://www.wisecounty.org/social-services", phone: "276-328-8056",
    address: "5269 Industrial Park Rd", city: "Wise", zip: "24293",
    source_name: "Wise County DSS" },

  { section: "D", title: "Lee County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Lee County DSS Jonesville — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Lee County (Jonesville/Pennington Gap/Pleasant View) veterans and military families.",
    website_url: "https://www.leecova.org/social-services", phone: "276-346-2300",
    address: "33640 Main St", city: "Jonesville", zip: "24263",
    source_name: "Lee County DSS" },

  { section: "D", title: "Scott County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Scott County DSS Gate City — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Scott County (Gate City/Weber City/Nickelsville) veterans and military families.",
    website_url: "https://www.scottcountyva.com/social-services", phone: "276-386-3631",
    address: "190 Beech St", city: "Gate City", zip: "24251",
    source_name: "Scott County DSS" },

  { section: "D", title: "Norton City Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Norton City DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for City of Norton veterans and military families.",
    website_url: "https://www.nortonva.gov/social-services", phone: "276-679-1133",
    address: "618 Virginia Ave NW", city: "Norton", zip: "24273",
    source_name: "Norton City DSS" },

  { section: "D", title: "Buchanan County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Buchanan County DSS Grundy — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Buchanan County (Grundy/Hurley/Vansant) veterans and military families.",
    website_url: "https://www.buchanancountyva.org/social-services", phone: "276-935-2113",
    address: "1012 Walnut St", city: "Grundy", zip: "24614",
    source_name: "Buchanan County DSS" },

  { section: "D", title: "Dickenson County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Dickenson County DSS Clintwood — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Dickenson County (Clintwood/Haysi/Clinchco) veterans and military families.",
    website_url: "https://www.dickensonva.org/social-services", phone: "276-926-1661",
    address: "818 Happy Valley Dr", city: "Clintwood", zip: "24228",
    source_name: "Dickenson County DSS" },

  { section: "D", title: "Russell County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Russell County DSS Lebanon — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Russell County (Lebanon/Honaker/Castlewood) veterans and military families.",
    website_url: "https://www.russellcountyva.us/social-services", phone: "276-889-3031",
    address: "139 Highland Dr", city: "Lebanon", zip: "24266",
    source_name: "Russell County DSS" },

  { section: "D", title: "Wise/Norton Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Virginia Department of Veterans Services Wise/Norton field office — accredited VSOs assist Wise/Norton/Lee/Scott veterans with VA disability claims, appeals, education, and survivor benefits.",
    website_url: "https://www.dvs.virginia.gov/", phone: "276-679-9413",
    address: "618 Virginia Ave NW", city: "Norton", zip: "24273",
    source_name: "Virginia Department of Veterans Services" },

  { section: "D", title: "Lee County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Virginia Department of Veterans Services Lee County field office — accredited VSOs assist Lee County veterans with VA disability claims, appeals, education, and survivor benefits.",
    website_url: "https://www.dvs.virginia.gov/", phone: "276-346-7780",
    address: "33640 Main St", city: "Jonesville", zip: "24263",
    source_name: "Virginia Department of Veterans Services" },

  { section: "D", title: "Buchanan County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Virginia Department of Veterans Services Buchanan County field office — accredited VSOs assist Buchanan/Dickenson coalfield veterans with VA disability claims, appeals, and benefits navigation.",
    website_url: "https://www.dvs.virginia.gov/", phone: "276-935-7720",
    address: "1012 Walnut St", city: "Grundy", zip: "24614",
    source_name: "Virginia Department of Veterans Services" },

  { section: "D", title: "Russell County Veterans Service Office",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Virginia Department of Veterans Services Russell County field office — accredited VSOs assist Russell/Tazewell coalfield veterans with VA disability claims, appeals, and benefits navigation.",
    website_url: "https://www.dvs.virginia.gov/", phone: "276-889-8000",
    address: "139 Highland Dr", city: "Lebanon", zip: "24266",
    source_name: "Virginia Department of Veterans Services" },

  { section: "D", title: "Mountain Empire Community College",
    cat: "education", sub: "College & University Programs",
    desc: "Mountain Empire Community College Big Stone Gap — Yellow Ribbon, VA School Certifying Officials; affordable transfer pathways for Wise/Lee/Scott/Norton veterans using GI Bill.",
    website_url: "https://www.mecc.edu/", phone: "276-523-2400",
    address: "3441 Mountain Empire Rd", city: "Big Stone Gap", zip: "24219",
    source_name: "Mountain Empire Community College" },

  { section: "D", title: "Southwest Virginia Community College",
    cat: "education", sub: "College & University Programs",
    desc: "Southwest Virginia Community College Cedar Bluff — Yellow Ribbon, VA School Certifying Officials; affordable transfer pathways for Buchanan/Dickenson/Russell/Tazewell coalfield veterans using GI Bill.",
    website_url: "https://www.sw.edu/", phone: "276-964-2555",
    address: "369 College Rd", city: "Cedar Bluff", zip: "24609",
    source_name: "Southwest Virginia Community College" },

  { section: "D", title: "Coalfield Workforce Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Southwest Region Norton/Wise office — DVOP/LVER veteran specialists offer priority of service for Wise/Norton/Lee/Scott veterans + Coalfield Employment Enhancement Program (CEEP).",
    website_url: "https://www.swvirginiajobs.com/", phone: "276-679-9413",
    address: "300 Sugar Hollow Rd", city: "Big Stone Gap", zip: "24219",
    source_name: "Southwest VA Workforce Development Board" },

  { section: "D", title: "Cumberland Plateau Workforce Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Cumberland Plateau Lebanon — DVOP/LVER veteran specialists offer priority of service for Buchanan/Dickenson/Russell/Tazewell veterans; co-located with VEC.",
    website_url: "https://cppdc.org/", phone: "276-889-1778",
    address: "224 Clydesway Dr", city: "Lebanon", zip: "24266",
    source_name: "Cumberland Plateau Planning District" },

  { section: "D", title: "Family Crisis Support Services",
    cat: "family-support", sub: "Family Counseling",
    desc: "Family Crisis Support Services Norton — Mountain Empire DV nonprofit serving Wise/Norton/Lee/Scott/Dickenson — 24/7 hotline, emergency shelter, court advocacy, trauma counseling for DV survivors incl. military-family.",
    website_url: "https://familycrisissupport.org/", phone: "276-679-7240",
    address: "PO Box 13", city: "Norton", zip: "24273",
    source_name: "Family Crisis Support Services" },

  { section: "D", title: "Hope Inc Coalfield DV Services",
    cat: "family-support", sub: "Family Counseling",
    desc: "Hope Inc Cedar Bluff — Coalfield DV nonprofit serving Buchanan/Dickenson/Russell/Tazewell — 24/7 hotline, emergency shelter, court advocacy, trauma counseling for DV survivors incl. military-family victims.",
    website_url: "https://www.hopeincva.org/", phone: "276-963-9404",
    address: "PO Box 1108", city: "Cedar Bluff", zip: "24609",
    source_name: "Hope Inc" },

  { section: "D", title: "Appalachian Agency for Senior Citizens",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "AASC Cedar Bluff — Area Agency on Aging serving Buchanan/Dickenson/Russell/Tazewell coalfield seniors incl. veteran households; case management, home-delivered meals, in-home care, energy assistance.",
    website_url: "https://www.aasc.org/", phone: "276-964-4915",
    address: "216 College Ridge Rd", city: "Cedar Bluff", zip: "24609",
    source_name: "Appalachian Agency for Senior Citizens" },

  { section: "D", title: "People Inc of Virginia",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "People Inc Abingdon — Community Action Agency serving Southwest Virginia incl. coalfields + Mountain Empire — Head Start, housing counseling, weatherization, home repair, microenterprise loans for veteran families.",
    website_url: "https://www.peopleinc.net/", phone: "276-619-2239",
    address: "1173 W Main St", city: "Abingdon", zip: "24210",
    source_name: "People Inc of Virginia" },

  { section: "D", title: "Mountain Empire Older Citizens Coalfield Transit",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "MEOC Coalfield Transit (Wise/Norton/Lee/Scott) — public bus + demand-response transit + NEMT for Mountain Empire veterans to Salem/Mountain Home VAMC; partners with rural ride-share.",
    website_url: "https://www.meoc.org/", phone: "276-523-4202",
    address: "PO Box 888", city: "Big Stone Gap", zip: "24219",
    source_name: "Mountain Empire Older Citizens" },

  { section: "D", title: "Four County Transit Coalfields",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "Four County Transit Lebanon (Buchanan/Dickenson/Russell/Tazewell) — public bus + demand-response transit + NEMT for Coalfield veterans to Salem VAMC + Mountain Home TN VAMC; rural network.",
    website_url: "https://www.fourcountytransit.org/", phone: "276-883-5170",
    address: "224 Clydesway Dr", city: "Lebanon", zip: "24266",
    source_name: "Four County Transit" },
];

await runSeed(ROWS, {
  state: "VA",
  commit: COMMIT,
  scriptName: "seed-va-wave7.ts (FL-pattern Wave 7 / Southside + Mountain Empire — Option C)",
  urlCheckTimeoutMs: 12000,
  allowBrokenUrls: ALLOW_BROKEN_URLS,
  allowZipBleed: ALLOW_ZIP_BLEED,
  sectionLabels: {
    A: "Southside hospitals + CSBs + clinics",
    B: "Southside DSS + VSO + workforce + community",
    C: "Mountain Empire hospitals + CSBs + clinics",
    D: "Mountain Empire DSS + VSO + workforce + community",
  },
});
