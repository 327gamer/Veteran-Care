/**
 * VIRGINIA — WAVE 4 (FL-pattern mid-tier city expansion, ~85 rows)
 *
 * Founder release 2026-05-02: Wave 4 = MID-TIER CITY EXPANSION across 7
 * priority cities + regional towns. Same FL Wave system. NO insurance touch.
 * Speed + coverage > perfection. Skip stuck URLs. STOP after Wave 4.
 *
 * Sections (7 city blocks + regional spillover):
 *   A  Lynchburg depth        (was  4 → +)
 *   B  Charlottesville depth  (was  7 → +)
 *   C  Williamsburg depth     (was  4 → +)
 *   D  Staunton depth         (was  4 → +)
 *   E  Winchester depth       (was  1 → + heavy)
 *   F  Petersburg depth       (was  1 → + heavy)
 *   G  Manassas depth         (was  3 → +)
 *   H  Regional spillover     (Bristol, Galax, Pulaski, Tazewell, Smyth)
 *
 * APPENDS to Wave 1 (125) + Wave 2 (123) + Wave 3 (135) = post-W4 total ~470.
 *
 * Run:
 *   tsx scripts/seed-va-wave4.ts                                # dry-run
 *   tsx scripts/seed-va-wave4.ts --commit --allow-broken-urls   # write
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");

const ROWS: SeedRow[] = [
  // ===========================================================================
  // A. LYNCHBURG DEPTH (was 4 → +12)
  // ===========================================================================
  { section: "A", title: "Centra Lynchburg General Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Centra's flagship Lynchburg hospital — Level II trauma center, cardiac, oncology, women's health, and Level III NICU; common Community Care referral destination for Salem VAMC + Lynchburg CBOC.",
    website_url: "https://www.centrahealth.com/", phone: "434-200-3000",
    address: "1901 Tate Springs Rd", city: "Lynchburg", zip: "24501",
    source_name: "Centra Health" },

  { section: "A", title: "Free Clinic of Central Virginia",
    cat: "healthcare", sub: "Primary Care",
    desc: "Lynchburg-area free clinic for low-income uninsured residents (incl. unenrolled veterans). Primary care, behavioral health, dental, and pharmacy assistance.",
    website_url: "https://freeclinicva.org/", phone: "434-847-5866",
    address: "1016 Main St", city: "Lynchburg", zip: "24504",
    source_name: "Free Clinic of Central Virginia" },

  { section: "A", title: "Horizon Behavioral Health Lynchburg",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Region 5 CSB serving Lynchburg + Amherst + Appomattox + Bedford + Campbell + Nelson — outpatient mental-health, substance-use treatment, ID/DD services, and 24/7 emergency services. Sliding-scale.",
    website_url: "https://www.horizonbh.org/", phone: "434-847-8050",
    address: "2241 Langhorne Rd", city: "Lynchburg", zip: "24501",
    source_name: "Horizon Behavioral Health" },

  { section: "A", title: "Park View Community Mission",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Lynchburg-area food bank and community mission — food pantry, hot meals, clothing, financial assistance, and case management for Lynchburg veteran families regardless of VA enrollment.",
    website_url: "https://parkviewmission.org/", phone: "434-845-7344",
    address: "1010 Mansion Dr", city: "Lynchburg", zip: "24504",
    source_name: "Park View Community Mission" },

  { section: "A", title: "Lynchburg Salvation Army Corps",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Salvation Army Lynchburg Corps — food pantry, emergency rent/utility assistance, after-school programs, and Christmas Angel Tree for Lynchburg veterans and low-income families.",
    website_url: "https://salvationarmycarolinas.org/", phone: "434-845-5939",
    address: "2215 Park Ave", city: "Lynchburg", zip: "24501",
    source_name: "Salvation Army" },

  { section: "A", title: "Lynchburg DSS — Veteran Outreach",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "City of Lynchburg DSS — SNAP, TANF, Medicaid, energy assistance (LIHEAP), child-care subsidy, and emergency assistance for Lynchburg veterans and military families.",
    website_url: "https://www.lynchburgva.gov/", phone: "434-455-4444",
    address: "2125 Langhorne Rd", city: "Lynchburg", zip: "24501",
    source_name: "Lynchburg DSS" },

  { section: "A", title: "Lynchburg Workforce Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Region 2000 Lynchburg center — DVOP/LVER veteran specialists offer priority of service, resume help, job-search workshops, and on-the-job training for Lynchburg-area veterans.",
    website_url: "https://www.region2000works.org/", phone: "434-455-3940",
    address: "3125 Odd Fellows Rd", city: "Lynchburg", zip: "24501",
    source_name: "Virginia Career Works Region 2000" },

  { section: "A", title: "Central Virginia Community College — Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "CVCC Veterans Resource Center — Yellow Ribbon, VA School Certifying Officials, transfer support; affordable transfer pathways for Lynchburg-area veterans using GI Bill.",
    website_url: "https://www.cvcc.vccs.edu/", phone: "434-832-7600",
    address: "3506 Wards Rd", city: "Lynchburg", zip: "24502",
    source_name: "Central Virginia Community College" },

  { section: "A", title: "Liberty University Office of Military Affairs",
    cat: "education", sub: "College & University Programs",
    desc: "Liberty University Military Affairs — Yellow Ribbon participant, VA School Certifying Officials, military-friendly designation; serves Lynchburg-area veterans using GI Bill on residential and online programs.",
    website_url: "https://www.liberty.edu/military/", phone: "800-424-9595",
    address: "1971 University Blvd", city: "Lynchburg", zip: "24515",
    source_name: "Liberty University" },

  { section: "A", title: "Greater Lynchburg Transit Company (GLTC)",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "Lynchburg-area public bus transit — fixed routes connecting Lynchburg + Madison Heights + Amherst; reduced-fare program for low-income riders; ADA Paratransit for veterans with disabilities.",
    website_url: "https://www.gltconline.com/", phone: "434-455-5080",
    address: "800 Kemper St", city: "Lynchburg", zip: "24501",
    source_name: "GLTC" },

  { section: "A", title: "Legal Aid Society of Roanoke Valley — Lynchburg Branch",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Roanoke Valley civil legal aid serving Lynchburg + Amherst + Appomattox + Bedford + Campbell + Nelson on family law, housing, public benefits; serves Lynchburg-area veterans without VA enrollment.",
    website_url: "https://www.lasrv.org/", phone: "434-528-4722",
    address: "513 Federal St", city: "Lynchburg", zip: "24504",
    source_name: "Legal Aid Society of Roanoke Valley" },

  { section: "A", title: "Miriam's House Lynchburg",
    cat: "housing", sub: "Transitional Housing",
    desc: "Lynchburg transitional housing for women + families experiencing homelessness — 2-year program with supportive services, life-skills coaching, and aftercare; serves Lynchburg veteran families referred via SSVF.",
    website_url: "https://www.miriamshouselynchburg.org/", phone: "434-847-1101",
    address: "1217 Court St", city: "Lynchburg", zip: "24504",
    source_name: "Miriam's House" },

  // ===========================================================================
  // B. CHARLOTTESVILLE DEPTH (was 7 → +12)
  // ===========================================================================
  { section: "B", title: "UVA Health University Hospital",
    cat: "healthcare", sub: "Specialty Care",
    desc: "UVA Medical Center — Charlottesville's academic Level I trauma center; comprehensive specialty care including transplant, cancer, neurosciences, and children's hospital; serves Central VA veterans via Community Care.",
    website_url: "https://uvahealth.com/", phone: "434-924-0000",
    address: "1215 Lee St", city: "Charlottesville", zip: "22908",
    source_name: "UVA Health" },

  { section: "B", title: "Charlottesville Free Clinic",
    cat: "healthcare", sub: "Primary Care",
    desc: "Volunteer-run free clinic — primary care, dental, behavioral health, vision, and discount pharmacy for low-income uninsured Charlottesville/Albemarle residents incl. unenrolled veterans.",
    website_url: "https://www.cvillefreeclinic.org/", phone: "434-296-5525",
    address: "1138 Rose Hill Dr, Suite 200", city: "Charlottesville", zip: "22903",
    source_name: "Charlottesville Free Clinic" },

  { section: "B", title: "Loaves & Fishes Food Pantry Charlottesville",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Charlottesville-area client-choice food pantry serving Albemarle + Greene + Louisa + Nelson + Orange + Fluvanna + Madison; mobile pantry routes; serves Charlottesville veteran families regardless of VA enrollment.",
    website_url: "https://cvilleloaves.org/", phone: "434-996-7868",
    address: "2050 Lambs Rd", city: "Charlottesville", zip: "22901",
    source_name: "Loaves & Fishes Food Pantry" },

  { section: "B", title: "Charlottesville Salvation Army Corps",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Salvation Army Charlottesville Corps — food pantry, emergency rent/utility assistance, after-school programs, and Christmas Angel Tree for Charlottesville veterans and low-income families.",
    website_url: "https://salvationarmypotomac.org/charlottesville/", phone: "434-295-4058",
    address: "207 Ridge St", city: "Charlottesville", zip: "22902",
    source_name: "Salvation Army" },

  { section: "B", title: "Charlottesville Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "City of Charlottesville DSS — SNAP, TANF, Medicaid, energy assistance (LIHEAP), child-care subsidy, and emergency assistance for Charlottesville veterans and military families.",
    website_url: "https://www.charlottesville.gov/", phone: "434-970-3400",
    address: "120 7th St NE", city: "Charlottesville", zip: "22902",
    source_name: "Charlottesville DSS" },

  { section: "B", title: "Piedmont Workforce Network — Charlottesville",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Piedmont center — DVOP/LVER veteran specialists offer priority of service for Charlottesville-area veterans; Workforce Innovation and Opportunity Act (WIOA) programs.",
    website_url: "https://piedmontworks.com/", phone: "434-220-4774",
    address: "120 Avon St", city: "Charlottesville", zip: "22902",
    source_name: "Piedmont Workforce Network" },

  { section: "B", title: "Piedmont Virginia Community College — Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "PVCC Veterans Resource Center — Yellow Ribbon, VA School Certifying Officials, transfer support; affordable transfer pathways for Charlottesville-area veterans using GI Bill.",
    website_url: "https://www.pvcc.edu/", phone: "434-961-5200",
    address: "501 College Dr", city: "Charlottesville", zip: "22902",
    source_name: "Piedmont Virginia Community College" },

  { section: "B", title: "University of Virginia Veterans Affairs",
    cat: "education", sub: "College & University Programs",
    desc: "UVA Office of the University Registrar Veterans Services — Yellow Ribbon participant, VA School Certifying Officials, Student Veterans of America chapter; serves Charlottesville-area veterans using GI Bill.",
    website_url: "https://registrar.virginia.edu/", phone: "434-924-3134",
    address: "Carruthers Hall, 1001 N Emmet St", city: "Charlottesville", zip: "22904",
    source_name: "University of Virginia" },

  { section: "B", title: "Charlottesville Area Transit (CAT)",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "Charlottesville's public bus transit — fixed routes connecting City of Charlottesville + UVA + Albemarle County; reduced-fare program for low-income riders; ADA Paratransit (JAUNT) for veterans with disabilities.",
    website_url: "https://www.charlottesville.gov/cat", phone: "434-970-3649",
    address: "615 E Water St", city: "Charlottesville", zip: "22902",
    source_name: "Charlottesville Area Transit" },

  { section: "B", title: "Legal Aid Justice Center — Charlottesville",
    cat: "legal", sub: "Legal Aid Services",
    desc: "Charlottesville-based statewide civil legal aid — represents low-income clients on housing, immigration, education, public benefits; serves Charlottesville veterans without VA enrollment.",
    website_url: "https://www.justice4all.org/", phone: "434-977-0553",
    address: "1000 Preston Ave, Suite A", city: "Charlottesville", zip: "22903",
    source_name: "Legal Aid Justice Center" },

  { section: "B", title: "Shelter for Help in Emergency",
    cat: "family-support", sub: "Family Counseling",
    desc: "Charlottesville-area DV nonprofit — 24/7 hotline, emergency shelter, transitional housing, court advocacy, and trauma counseling for DV survivors incl. military-family victims.",
    website_url: "https://www.shelterforhelpinemergency.org/", phone: "434-293-8509",
    address: "PO Box 3013", city: "Charlottesville", zip: "22903",
    source_name: "Shelter for Help in Emergency" },

  { section: "B", title: "JAUNT Charlottesville Regional Transit",
    cat: "transportation", sub: "Non-Emergency Medical Transport",
    desc: "JAUNT regional transportation — paratransit and rural transit serving Charlottesville + Albemarle + Buckingham + Fluvanna + Louisa + Nelson; non-emergency medical transport for veterans with disabilities.",
    website_url: "https://ridejaunt.org/", phone: "434-296-3184",
    address: "104 Keystone Pl", city: "Charlottesville", zip: "22902",
    source_name: "JAUNT" },

  // ===========================================================================
  // C. WILLIAMSBURG DEPTH (was 4 → +12)
  // ===========================================================================
  { section: "C", title: "Sentara Williamsburg Regional Medical Center",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Sentara's Williamsburg hospital — emergency, surgical, cardiac, women's health, and orthopedics; common Community Care referral destination for Hampton VAMC.",
    website_url: "https://www.sentara.com/", phone: "757-984-6000",
    address: "100 Sentara Cir", city: "Williamsburg", zip: "23188",
    source_name: "Sentara Healthcare" },

  { section: "C", title: "Olde Towne Medical and Dental Center",
    cat: "healthcare", sub: "Primary Care",
    desc: "Williamsburg-area FQHC and free clinic — primary care, dental, behavioral health, and pharmacy for low-income uninsured residents (incl. unenrolled veterans) across Williamsburg + James City + York counties.",
    website_url: "https://www.oldetownemedicalcenter.org/", phone: "757-259-3258",
    address: "5249 Olde Towne Rd", city: "Williamsburg", zip: "23188",
    source_name: "Olde Towne Medical and Dental Center" },

  { section: "C", title: "Colonial Behavioral Health",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Williamsburg-area CSB serving Williamsburg + James City + York + Poquoson — outpatient mental-health, substance-use treatment, ID/DD services, and 24/7 emergency services. Sliding-scale.",
    website_url: "https://www.colonialbh.org/", phone: "757-220-3200",
    address: "1657 Merrimac Trl", city: "Williamsburg", zip: "23185",
    source_name: "Colonial Behavioral Health" },

  { section: "C", title: "FISH (Williamsburg)",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Williamsburg's volunteer-run food pantry and emergency assistance program — food, clothing, financial assistance, and case management for Williamsburg veteran families regardless of VA enrollment.",
    website_url: "https://williamsburgfish.com/", phone: "757-220-9379",
    address: "312 Waller Mill Rd", city: "Williamsburg", zip: "23185",
    source_name: "FISH Williamsburg" },

  { section: "C", title: "Williamsburg House of Mercy",
    cat: "housing", sub: "Emergency Housing",
    desc: "Williamsburg-area homeless services — daytime shelter, food pantry, clothing, and emergency assistance; serves Williamsburg-area veterans referred via SSVF/HUD-VASH partners.",
    website_url: "https://www.williamsburghouseofmercy.org/", phone: "757-229-1828",
    address: "10 Harrison Ave", city: "Williamsburg", zip: "23185",
    source_name: "Williamsburg House of Mercy" },

  { section: "C", title: "James City County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "James City County DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Williamsburg-area veterans and military families.",
    website_url: "https://jamescitycountyva.gov/dss", phone: "757-259-3140",
    address: "5249 Olde Towne Rd, Bldg A", city: "Williamsburg", zip: "23188",
    source_name: "James City County DSS" },

  { section: "C", title: "Hampton Roads Workforce Council — Williamsburg",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Hampton Roads Workforce Council Williamsburg/Greater Peninsula center — DVOP/LVER veteran specialists offer priority of service for Williamsburg-area veterans; co-located with Virginia Employment Commission.",
    website_url: "https://www.hamptonroadsworkforce.org/", phone: "757-253-4738",
    address: "5235 John Tyler Hwy, Suite 18", city: "Williamsburg", zip: "23185",
    source_name: "Hampton Roads Workforce Council" },

  { section: "C", title: "College of William & Mary Office of Military Programs",
    cat: "education", sub: "College & University Programs",
    desc: "W&M Office of Military and Veterans Affairs — Yellow Ribbon participant, VA School Certifying Officials, Student Veterans Association; serves Williamsburg-area veterans using GI Bill.",
    website_url: "https://www.wm.edu/sites/militaryandveterans/", phone: "757-221-3232",
    address: "200 Stadium Dr", city: "Williamsburg", zip: "23185",
    source_name: "College of William & Mary" },

  { section: "C", title: "Williamsburg Area Transit Authority (WATA)",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "WATA operates Williamsburg-area bus routes connecting Williamsburg + James City + York counties + Jamestown + Yorktown; reduced-fare program for low-income riders; ADA Paratransit for veterans with disabilities.",
    website_url: "https://www.gowata.org/", phone: "757-220-5493",
    address: "7239 Pocahontas Trl", city: "Williamsburg", zip: "23185",
    source_name: "Williamsburg Area Transit Authority" },

  { section: "C", title: "Avalon — A Center for Women and Children",
    cat: "family-support", sub: "Family Counseling",
    desc: "Williamsburg-area DV nonprofit serving Williamsburg + James City + York — 24/7 hotline, emergency shelter, transitional housing, court advocacy, and trauma counseling for DV survivors incl. military-family victims.",
    website_url: "https://avaloncenter.org/", phone: "757-258-5022",
    address: "PO Box 1079", city: "Williamsburg", zip: "23187",
    source_name: "Avalon Center" },

  { section: "C", title: "Heritage Humane Society",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Williamsburg-area no-kill animal shelter providing pet-adoption fee waivers + foster care for Williamsburg-area veterans and senior veterans needing companion animals; partner with Pets for Vets nationally.",
    website_url: "https://www.heritagehumanesociety.org/", phone: "757-221-0150",
    address: "430 Waller Mill Rd", city: "Williamsburg", zip: "23185",
    source_name: "Heritage Humane Society" },

  { section: "C", title: "Williamsburg Community Foundation",
    cat: "financial", sub: "Emergency Financial Assistance",
    desc: "Williamsburg-area community foundation — emergency-need grants, scholarships, and impact-investment programs; serves Williamsburg-area veterans facing financial crisis through partner-agency referrals.",
    website_url: "https://williamsburgcommunityfoundation.org/", phone: "757-259-1660",
    address: "5350 Discovery Park Blvd, Suite B-200", city: "Williamsburg", zip: "23188",
    source_name: "Williamsburg Community Foundation" },

  // ===========================================================================
  // D. STAUNTON DEPTH (was 4 → +12)
  // ===========================================================================
  { section: "D", title: "Augusta Health",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Augusta Health Fishersville — Shenandoah Valley's regional hospital serving Staunton + Waynesboro + Augusta + Highland; emergency, surgical, cardiac, women's health; Community Care destination for Salem VAMC.",
    website_url: "https://www.augustahealth.com/", phone: "540-932-4000",
    address: "78 Medical Center Dr", city: "Fishersville", zip: "22939",
    source_name: "Augusta Health" },

  { section: "D", title: "Augusta Regional Free Clinic",
    cat: "healthcare", sub: "Primary Care",
    desc: "Staunton-Waynesboro-Augusta-area free clinic — primary care, behavioral health, dental, and pharmacy assistance for low-income uninsured residents (incl. unenrolled veterans).",
    website_url: "https://augustaregionalclinic.org/", phone: "540-886-5600",
    address: "39 Bowman Cir", city: "Fishersville", zip: "22939",
    source_name: "Augusta Regional Free Clinic" },

  { section: "D", title: "Staunton-Augusta Salvation Army Corps",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Salvation Army Staunton-Augusta Corps — food pantry, emergency rent/utility assistance, after-school programs, and Christmas Angel Tree for Staunton-area veterans and low-income families.",
    website_url: "https://salvationarmypotomac.org/", phone: "540-885-8157",
    address: "211 N Lewis St", city: "Staunton", zip: "24401",
    source_name: "Salvation Army" },

  { section: "D", title: "Staunton DSS — Veteran Outreach",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "City of Staunton DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Staunton-area veterans and military families.",
    website_url: "https://www.staunton.va.us/", phone: "540-332-3962",
    address: "1300 Churchville Ave", city: "Staunton", zip: "24401",
    source_name: "Staunton DSS" },

  { section: "D", title: "Greater Augusta Workforce Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Shenandoah Valley Staunton-area workforce center — DVOP/LVER veteran specialists offer priority of service for Staunton + Waynesboro + Augusta County veterans.",
    website_url: "https://valleyworkforce.com/", phone: "540-332-7785",
    address: "201 N Augusta St", city: "Staunton", zip: "24401",
    source_name: "Virginia Career Works Shenandoah Valley" },

  { section: "D", title: "Blue Ridge Community College — Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "BRCC Veterans Resource Center — Yellow Ribbon, VA School Certifying Officials, transfer support; affordable transfer pathways for Staunton/Waynesboro-area veterans using GI Bill.",
    website_url: "https://www.brcc.edu/", phone: "540-234-9261",
    address: "One College Ln", city: "Weyers Cave", zip: "24486",
    source_name: "Blue Ridge Community College" },

  { section: "D", title: "Mary Baldwin University Office of Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "Mary Baldwin University Veterans Resource Center — Yellow Ribbon participant, VA School Certifying Officials, online and residential programs; serves Staunton-area veterans using GI Bill.",
    website_url: "https://marybaldwin.edu/", phone: "540-887-7000",
    address: "318 E Frederick St", city: "Staunton", zip: "24401",
    source_name: "Mary Baldwin University" },

  { section: "D", title: "BRITE Bus Transit",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "Blue Ridge Inter-City Transit Express — Staunton-Augusta-Waynesboro public bus transit; fixed routes + commuter routes to Charlottesville; reduced-fare program; ADA Paratransit for veterans with disabilities.",
    website_url: "https://britebus.org/", phone: "540-885-5161",
    address: "117 Lambert St", city: "Staunton", zip: "24401",
    source_name: "BRITE Bus Transit" },

  { section: "D", title: "Valley Mission Food Pantry — Staunton",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Valley Mission Staunton food-pantry program — daily food distribution, hot meals, emergency assistance, and case management for Staunton-area homeless and at-risk veteran families.",
    website_url: "https://valleymission.org/", phone: "540-886-9091",
    address: "1513 W Beverley St", city: "Staunton", zip: "24401",
    source_name: "Valley Mission" },

  { section: "D", title: "Staunton/Augusta Habitat for Humanity",
    cat: "housing", sub: "Home Ownership",
    desc: "Habitat Staunton/Augusta — home-ownership program for low-income working families incl. veterans across Staunton + Waynesboro + Augusta + Highland counties; volunteer-built homes; veteran applicants receive priority review.",
    website_url: "https://staunton-augustahabitat.org/", phone: "540-885-6330",
    address: "PO Box 644", city: "Staunton", zip: "24402",
    source_name: "Habitat for Humanity Staunton/Augusta" },

  { section: "D", title: "Project HORIZON — Lexington/Rockbridge",
    cat: "family-support", sub: "Family Counseling",
    desc: "Lexington-Rockbridge regional DV nonprofit serving Staunton-area Shenandoah Valley — 24/7 hotline, emergency shelter, court advocacy, and trauma counseling for DV survivors incl. military-family victims.",
    website_url: "https://www.projecthorizon.org/", phone: "540-463-2594",
    address: "120 Varner Ln", city: "Lexington", zip: "24450",
    source_name: "Project HORIZON" },

  { section: "D", title: "Bridge Staunton Clubhouse",
    cat: "mental-health", sub: "Peer Support",
    desc: "Staunton-area International Center for Clubhouse Development-accredited program — peer support, vocational rehabilitation, and community engagement for adults with mental illness incl. veterans with serious mental illness.",
    website_url: "https://thebridgeclubhouseva.org/", phone: "540-885-0526",
    address: "13 W Frederick St", city: "Staunton", zip: "24401",
    source_name: "The Bridge Clubhouse" },

  // ===========================================================================
  // E. WINCHESTER DEPTH (was 1 → +12 — major gap-fill)
  // ===========================================================================
  { section: "E", title: "Valley Health Winchester Medical Center",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Winchester's flagship Level II trauma center — heart and vascular center, oncology, women's health, neurosciences, and behavioral health; Community Care destination for Martinsburg VAMC + Winchester CBOC.",
    website_url: "https://www.valleyhealthlink.com/", phone: "540-536-8000",
    address: "1840 Amherst St", city: "Winchester", zip: "22601",
    source_name: "Valley Health" },

  { section: "E", title: "Free Medical Clinic of Northern Shenandoah Valley",
    cat: "healthcare", sub: "Primary Care",
    desc: "Winchester-area free clinic — primary care, behavioral health, dental, and pharmacy assistance for low-income uninsured residents (incl. unenrolled veterans) across Winchester + Frederick + Clarke counties.",
    website_url: "https://www.fmcnsv.org/", phone: "540-536-1660",
    address: "302 Cork St E", city: "Winchester", zip: "22601",
    source_name: "Free Medical Clinic of Northern Shenandoah Valley" },

  { section: "E", title: "Northwestern Community Services Board",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Region 4 CSB serving Winchester + Frederick + Clarke + Page + Shenandoah + Warren — outpatient mental-health, substance-use treatment, ID/DD services, and 24/7 emergency services. Sliding-scale.",
    website_url: "https://www.nwcsb.com/", phone: "540-636-4250",
    address: "209 W Criser Rd", city: "Front Royal", zip: "22630",
    source_name: "Northwestern CSB" },

  { section: "E", title: "Congregational Community Action Project (CCAP)",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Winchester-area volunteer-run food pantry, clothing bank, and emergency assistance — serves Winchester + Frederick + Clarke veteran families regardless of VA enrollment.",
    website_url: "https://ccapwinc.org/", phone: "540-662-4318",
    address: "112 S Kent St", city: "Winchester", zip: "22601",
    source_name: "Congregational Community Action Project" },

  { section: "E", title: "Winchester Salvation Army Corps",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Salvation Army Winchester Corps — food pantry, emergency rent/utility assistance, after-school programs, and Christmas Angel Tree for Winchester veterans and low-income families.",
    website_url: "https://salvationarmypotomac.org/winchester/", phone: "540-662-4777",
    address: "300 Fort Collier Rd", city: "Winchester", zip: "22603",
    source_name: "Salvation Army" },

  { section: "E", title: "Winchester DSS — Veteran Outreach",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "City of Winchester DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Winchester veterans and military families.",
    website_url: "https://www.winchesterva.gov/social-services", phone: "540-662-3807",
    address: "31 Battaile Dr", city: "Winchester", zip: "22601",
    source_name: "Winchester DSS" },

  { section: "E", title: "Winchester Workforce Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Shenandoah Valley Winchester center — DVOP/LVER veteran specialists offer priority of service for Winchester-area veterans + Top of Virginia region.",
    website_url: "https://valleyworkforce.com/", phone: "540-722-3415",
    address: "100 W Piccadilly St", city: "Winchester", zip: "22601",
    source_name: "Virginia Career Works Shenandoah Valley" },

  { section: "E", title: "Laurel Ridge Community College — Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "Laurel Ridge CC (formerly Lord Fairfax) Veterans Resource Center — Yellow Ribbon, VA School Certifying Officials, transfer support; affordable transfer pathways for Winchester-area veterans using GI Bill.",
    website_url: "https://www.laurelridge.edu/", phone: "540-868-7110",
    address: "173 Skirmisher Ln", city: "Middletown", zip: "22645",
    source_name: "Laurel Ridge Community College" },

  { section: "E", title: "Shenandoah University — Military Programs",
    cat: "education", sub: "College & University Programs",
    desc: "Shenandoah University Office of Military Programs — Yellow Ribbon participant, VA School Certifying Officials, online and residential programs; serves Winchester-area veterans using GI Bill.",
    website_url: "https://www.su.edu/", phone: "540-665-4500",
    address: "1460 University Dr", city: "Winchester", zip: "22601",
    source_name: "Shenandoah University" },

  { section: "E", title: "Winchester Transit",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "City of Winchester public bus transit — fixed routes connecting Winchester + Frederick County; reduced-fare program; ADA Paratransit for veterans with disabilities.",
    website_url: "https://www.winchesterva.gov/transit", phone: "540-667-1815",
    address: "301 E Cork St", city: "Winchester", zip: "22601",
    source_name: "Winchester Transit" },

  { section: "E", title: "Phoenix Project Northern Shenandoah Valley",
    cat: "family-support", sub: "Family Counseling",
    desc: "Winchester-area DV nonprofit serving Northern Shenandoah Valley — 24/7 hotline, emergency shelter, court advocacy, and trauma counseling for DV survivors incl. military-family victims.",
    website_url: "https://nwcsb.com/services/phoenix-project/", phone: "540-667-6160",
    address: "PO Box 2304", city: "Winchester", zip: "22604",
    source_name: "Phoenix Project" },

  { section: "E", title: "Winchester Area Temporary Thermal Shelter (WATTS)",
    cat: "housing", sub: "Emergency Housing",
    desc: "Winchester-area cold-weather emergency shelter operated through faith partnerships — 50 beds Nov-Mar; serves Winchester-area homeless veterans referred via SSVF/HUD-VASH partners.",
    website_url: "https://wattsshelter.com/", phone: "540-722-2680",
    address: "Winchester partner sites", city: "Winchester", zip: "22601",
    source_name: "WATTS" },

  // ===========================================================================
  // F. PETERSBURG DEPTH (was 1 → +12 — major gap-fill)
  // ===========================================================================
  { section: "F", title: "Central State Hospital Petersburg",
    cat: "mental-health", sub: "Inpatient / Outpatient Treatment",
    desc: "Virginia state psychiatric hospital in Petersburg — adult inpatient psychiatric and forensic services; serves Central VA + Southside veterans referred via CSBs and VAMC for serious mental illness treatment.",
    website_url: "https://dbhds.virginia.gov/facilities/csh/", phone: "804-524-7000",
    address: "26317 W Washington St", city: "Petersburg", zip: "23803",
    source_name: "Virginia DBHDS" },

  { section: "F", title: "Pathways VA — Petersburg",
    cat: "healthcare", sub: "Primary Care",
    desc: "Pathways FQHC Petersburg-area clinic — primary care, behavioral health, dental, and pharmacy for low-income uninsured residents (incl. unenrolled veterans) across Petersburg + Hopewell + Prince George.",
    website_url: "https://www.pathways-va.org/", phone: "804-862-1948",
    address: "215 E Bank St", city: "Petersburg", zip: "23803",
    source_name: "Pathways VA" },

  { section: "F", title: "Petersburg DSS — Veteran Outreach",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "City of Petersburg DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Petersburg-area veterans and military families.",
    website_url: "https://www.petersburg-va.org/", phone: "804-861-4720",
    address: "150 N Union St", city: "Petersburg", zip: "23803",
    source_name: "Petersburg DSS" },

  { section: "F", title: "Petersburg Workforce Center",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Capital Region Petersburg-area workforce center — DVOP/LVER veteran specialists offer priority of service for Petersburg + Hopewell + Tri-Cities veterans.",
    website_url: "https://capitalregionworkforce.com/", phone: "804-861-1660",
    address: "228 N Sycamore St", city: "Petersburg", zip: "23803",
    source_name: "Virginia Career Works Capital Region" },

  { section: "F", title: "Petersburg Salvation Army Corps",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Salvation Army Petersburg Corps — food pantry, emergency rent/utility assistance, after-school programs, and Christmas Angel Tree for Petersburg veterans and low-income families.",
    website_url: "https://salvationarmypotomac.org/petersburg/", phone: "804-861-3464",
    address: "300 N Sycamore St", city: "Petersburg", zip: "23803",
    source_name: "Salvation Army" },

  { section: "F", title: "Hopewell Food Pantry",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Hopewell-Prince George area volunteer-run food pantry serving Petersburg-region veteran families through monthly distributions; partner with Feed More food bank.",
    website_url: "https://hopewellfoodpantry.org/", phone: "804-541-3500",
    address: "326 N 6th Ave", city: "Hopewell", zip: "23860",
    source_name: "Hopewell Food Pantry" },

  { section: "F", title: "Brightpoint Community College — Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "Brightpoint CC (formerly John Tyler) Veterans Resource Center — Yellow Ribbon, VA School Certifying Officials, transfer support; serves Petersburg-area veterans using GI Bill across Chester + Midlothian campuses.",
    website_url: "https://brightpoint.edu/", phone: "804-796-4000",
    address: "13101 Jefferson Davis Hwy", city: "Chester", zip: "23831",
    source_name: "Brightpoint Community College" },

  { section: "F", title: "Virginia State University Office of Veterans Affairs",
    cat: "education", sub: "College & University Programs",
    desc: "VSU Office of Veterans Affairs — historically Black university with strong military-friendly designation; Yellow Ribbon participant, VA School Certifying Officials; serves Petersburg-area veterans using GI Bill.",
    website_url: "https://www.vsu.edu/", phone: "804-524-5000",
    address: "1 Hayden Dr", city: "Petersburg", zip: "23806",
    source_name: "Virginia State University" },

  { section: "F", title: "Petersburg Area Transit (PAT)",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "City of Petersburg public bus transit — fixed routes connecting Petersburg + Colonial Heights + Hopewell; reduced-fare program; ADA Paratransit for veterans with disabilities.",
    website_url: "https://www.petersburg-va.org/", phone: "804-733-2413",
    address: "100 W Washington St", city: "Petersburg", zip: "23803",
    source_name: "Petersburg Area Transit" },

  { section: "F", title: "Petersburg Public Schools Adult Education",
    cat: "education", sub: "Continuing Education",
    desc: "Petersburg Public Schools Adult Ed — GED prep, ESL classes, career and technical education; veterans served with priority enrollment.",
    website_url: "https://www.petersburg.k12.va.us/", phone: "804-732-0510",
    address: "255 Wagner Rd", city: "Petersburg", zip: "23805",
    source_name: "Petersburg City Public Schools" },

  { section: "F", title: "James House Petersburg",
    cat: "family-support", sub: "Family Counseling",
    desc: "Petersburg-area DV and sexual assault nonprofit serving Tri-Cities + Hopewell + Prince George — 24/7 hotline, emergency shelter, court advocacy, trauma counseling for DV survivors incl. military-family victims.",
    website_url: "https://www.thejameshouse.org/", phone: "804-458-2704",
    address: "525 N 5th Ave", city: "Hopewell", zip: "23860",
    source_name: "James House" },

  { section: "F", title: "Pathways Petersburg Homeless Services",
    cat: "housing", sub: "Homeless Veteran Services",
    desc: "Pathways VA Petersburg-area homeless services — emergency shelter referrals, rapid rehousing, and SSVF coordination for Petersburg + Hopewell + Tri-Cities veterans.",
    website_url: "https://www.pathways-va.org/", phone: "804-862-1948",
    address: "27 N Crater Rd", city: "Petersburg", zip: "23803",
    source_name: "Pathways VA" },

  // ===========================================================================
  // G. MANASSAS DEPTH (was 3 → +12)
  // ===========================================================================
  { section: "G", title: "UVA Health Prince William Medical Center",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Manassas-area regional hospital (formerly Novant) — emergency, surgical, cardiac, women's health; common Community Care referral destination for Belvoir-area + Quantico veterans.",
    website_url: "https://uvahealth.com/locations/profile/uva-health-prince-william-medical-center", phone: "703-369-8000",
    address: "8700 Sudley Rd", city: "Manassas", zip: "20110",
    source_name: "UVA Health" },

  { section: "G", title: "Greater Prince William Community Health Center",
    cat: "healthcare", sub: "Primary Care",
    desc: "Manassas-area FQHC — primary care, dental, behavioral health, and pharmacy for low-income uninsured residents (incl. unenrolled veterans) across Prince William County + Manassas + Manassas Park.",
    website_url: "https://gpwhealthcenter.org/", phone: "703-680-7950",
    address: "4379 Ridgewood Center Dr, Suite 105", city: "Woodbridge", zip: "22192",
    source_name: "Greater Prince William Community Health Center" },

  { section: "G", title: "Prince William County Community Services",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Prince William CSB serving Manassas + Manassas Park + Prince William County — outpatient mental-health, substance-use treatment, ID/DD services, and 24/7 emergency services. Sliding-scale.",
    website_url: "https://www.pwcva.gov/department/community-services", phone: "703-792-7800",
    address: "7969 Ashton Ave", city: "Manassas", zip: "20109",
    source_name: "Prince William County Community Services" },

  { section: "G", title: "SERVE — Northern Virginia Family Service",
    cat: "housing", sub: "Emergency Housing",
    desc: "NVFS SERVE Manassas — Prince William County's main homeless shelter, food pantry, and resource center serving Manassas + Manassas Park + PWC residents incl. veteran families referred via SSVF.",
    website_url: "https://www.nvfs.org/serve/", phone: "703-369-5292",
    address: "10056 Dean Dr", city: "Manassas", zip: "20110",
    source_name: "Northern Virginia Family Service" },

  { section: "G", title: "Manassas Salvation Army Corps",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Salvation Army Manassas Corps — food pantry, emergency rent/utility assistance, after-school programs, and Christmas Angel Tree for Manassas veterans and low-income families.",
    website_url: "https://salvationarmypotomac.org/manassas/", phone: "703-368-4413",
    address: "10145 Wards Rd", city: "Manassas", zip: "20110",
    source_name: "Salvation Army" },

  { section: "G", title: "Manassas DSS — Veteran Outreach",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "City of Manassas DSS — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Manassas-area veterans and military families.",
    website_url: "https://www.manassasva.gov/", phone: "703-361-8277",
    address: "9320 Lee Ave", city: "Manassas", zip: "20110",
    source_name: "Manassas DSS" },

  { section: "G", title: "Northern Virginia Workforce Center — Woodbridge",
    cat: "employment", sub: "DVOP / Workforce Programs",
    desc: "Virginia Career Works Northern Region Woodbridge center — DVOP/LVER veteran specialists offer priority of service for Manassas + Prince William County veterans + Quantico transitioning service members.",
    website_url: "https://www.vacareerworks.org/", phone: "703-580-8459",
    address: "13909 Smoketown Rd", city: "Woodbridge", zip: "22192",
    source_name: "Virginia Career Works Northern Region" },

  { section: "G", title: "Northern Virginia Community College — Manassas Campus",
    cat: "education", sub: "College & University Programs",
    desc: "NOVA Manassas Campus — Yellow Ribbon, VA School Certifying Officials, Veterans Resource Center; affordable transfer pathways for Manassas-area veterans using GI Bill.",
    website_url: "https://www.nvcc.edu/military/", phone: "703-257-6600",
    address: "6901 Sudley Rd", city: "Manassas", zip: "20109",
    source_name: "Northern Virginia Community College" },

  { section: "G", title: "OmniRide Prince William",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "Prince William County's public bus + commuter transit — local Manassas/Woodbridge/Dale City routes + commuter buses to Pentagon/DC/Tysons; reduced-fare for low-income riders; ADA Paratransit (Access).",
    website_url: "https://omniride.com/", phone: "703-730-6664",
    address: "14700 Potomac Mills Rd", city: "Woodbridge", zip: "22192",
    source_name: "OmniRide" },

  { section: "G", title: "Hilda Barg Homeless Prevention Center",
    cat: "housing", sub: "Emergency Housing",
    desc: "Manassas/Prince William emergency homeless shelter operated by Volunteers of America Chesapeake — 60 beds, family rooms, and case management; serves PWC veteran families referred via SSVF.",
    website_url: "https://www.voachesapeake.org/", phone: "703-580-8438",
    address: "14945 Jefferson Davis Hwy", city: "Woodbridge", zip: "22191",
    source_name: "Volunteers of America Chesapeake" },

  { section: "G", title: "Legal Services of Northern Virginia — Manassas",
    cat: "legal", sub: "Legal Aid Services",
    desc: "LSNV Manassas/Prince William office — free civil legal aid for low-income residents on housing, family law, public benefits, consumer matters; serves Manassas-area veterans without VA enrollment.",
    website_url: "https://www.lsnv.org/", phone: "703-368-3232",
    address: "9408 Grant Ave, Suite 202", city: "Manassas", zip: "20110",
    source_name: "Legal Services of Northern Virginia" },

  { section: "G", title: "ACTS Prince William",
    cat: "family-support", sub: "Family Counseling",
    desc: "Action in Community Through Service Prince William — Manassas-area DV nonprofit + 24/7 hotline + emergency shelter + sexual-assault response + court advocacy + trauma counseling for DV survivors incl. military-family victims.",
    website_url: "https://www.actspwc.org/", phone: "703-441-8606",
    address: "3900 Acts Ln", city: "Dumfries", zip: "22026",
    source_name: "ACTS" },

  // ===========================================================================
  // H. REGIONAL SPILLOVER (Bristol, Galax, Pulaski, Tazewell, Smyth)
  // ===========================================================================
  { section: "H", title: "Ballad Health Bristol Regional Medical Center",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Bristol's flagship regional hospital — Level III trauma center, cardiac, oncology, and women's health; serves Far SW Virginia veterans via Mountain Home (Tennessee) VAMC Community Care.",
    website_url: "https://www.balladhealth.org/", phone: "276-642-8000",
    address: "1 Medical Park Blvd", city: "Bristol", zip: "24201",
    source_name: "Ballad Health" },

  { section: "H", title: "Highlands Community Services",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Region 3 CSB serving Bristol + Washington County — outpatient mental-health, substance-use treatment, ID/DD services, and 24/7 emergency services. Sliding-scale.",
    website_url: "https://www.highlandscsb.org/", phone: "276-525-1550",
    address: "610 Campus Dr", city: "Abingdon", zip: "24210",
    source_name: "Highlands Community Services" },

  { section: "H", title: "Twin County Regional Hospital — Galax",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Galax-area regional hospital — emergency, surgical, and primary specialty services; serves Twin Counties + Carroll + Grayson veterans via Salem VAMC Community Care.",
    website_url: "https://twincountyregional.com/", phone: "276-236-8181",
    address: "200 Hospital Dr", city: "Galax", zip: "24333",
    source_name: "Twin County Regional Hospital" },

  { section: "H", title: "New River Valley Community Services",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Region 3 CSB serving Pulaski + Floyd + Giles + Montgomery + Radford — outpatient mental-health, substance-use treatment, ID/DD services, and 24/7 emergency services. Sliding-scale.",
    website_url: "https://www.nrvcs.org/", phone: "540-961-8300",
    address: "700 University City Blvd", city: "Blacksburg", zip: "24060",
    source_name: "New River Valley Community Services" },

  { section: "H", title: "Cumberland Mountain Community Services",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Region 3 CSB serving Tazewell + Buchanan + Russell + Dickenson — outpatient mental-health, substance-use treatment, ID/DD services, and 24/7 emergency services. Sliding-scale.",
    website_url: "https://cmcsb.com/", phone: "276-964-6702",
    address: "PO Box 810", city: "Cedar Bluff", zip: "24609",
    source_name: "Cumberland Mountain Community Services" },

  { section: "H", title: "Mount Rogers Community Services",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Region 3 CSB serving Smyth + Wythe + Bland + Carroll + Grayson + Galax + Marion — outpatient mental-health, substance-use treatment, ID/DD services, and 24/7 emergency services. Sliding-scale.",
    website_url: "https://www.mtrogerscsb.com/", phone: "276-783-8148",
    address: "770 W Ridge Rd", city: "Wytheville", zip: "24382",
    source_name: "Mount Rogers Community Services" },

  { section: "H", title: "Wytheville Salvation Army Service Unit",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Salvation Army Wytheville unit — food pantry, emergency rent/utility assistance, and Christmas Angel Tree for Wytheville-area veterans + Wythe + Bland + Smyth residents.",
    website_url: "https://salvationarmycarolinas.org/", phone: "276-228-5841",
    address: "150 W Spring St", city: "Wytheville", zip: "24382",
    source_name: "Salvation Army" },

  { section: "H", title: "Galax Volunteer Fire Department Pantry",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Galax-area volunteer-run food pantry serving Twin Counties veteran families — partner with Second Harvest Food Bank of Southwest Virginia for monthly distributions.",
    website_url: "https://www.cityofgalax.com/", phone: "276-236-7297",
    address: "315 W Stuart Dr", city: "Galax", zip: "24333",
    source_name: "City of Galax" },

  { section: "H", title: "Wythe County Department of Social Services",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Wythe County DSS serving Wytheville-area — SNAP, TANF, Medicaid, energy assistance, and emergency assistance for Wythe County veterans and military families.",
    website_url: "https://wytheco.org/social-services/", phone: "276-228-5493",
    address: "275 S 4th St", city: "Wytheville", zip: "24382",
    source_name: "Wythe County DSS" },

  { section: "H", title: "Wytheville Community College — Veterans Services",
    cat: "education", sub: "College & University Programs",
    desc: "Wytheville CC Veterans Resource Center — Yellow Ribbon, VA School Certifying Officials, transfer support; affordable transfer pathways for SW Virginia veterans using GI Bill.",
    website_url: "https://www.wcc.vccs.edu/", phone: "276-223-4700",
    address: "1000 E Main St", city: "Wytheville", zip: "24382",
    source_name: "Wytheville Community College" },

  { section: "H", title: "Bristol Public Transit",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "City of Bristol Virginia public bus transit — fixed routes connecting Bristol VA + Bristol TN; reduced-fare program; ADA Paratransit for veterans with disabilities.",
    website_url: "https://www.bristolva.org/transit", phone: "276-645-7275",
    address: "300 Lee St", city: "Bristol", zip: "24201",
    source_name: "Bristol Virginia Transit" },

  { section: "H", title: "Wytheville Adult Education",
    cat: "education", sub: "Continuing Education",
    desc: "Wytheville-area Adult Education program — GED prep, ESL classes, career and technical education; veterans served with priority enrollment across Wythe + Bland counties.",
    website_url: "https://www.wytheville.k12.va.us/", phone: "276-228-5411",
    address: "1570 W Reservoir St", city: "Wytheville", zip: "24382",
    source_name: "Wythe County Public Schools" },
];

await runSeed(ROWS, {
  state: "VA",
  commit: COMMIT,
  scriptName: "seed-va-wave4.ts (FL-pattern Wave 4 / mid-tier city expansion)",
  urlCheckTimeoutMs: 12000,
  allowBrokenUrls: ALLOW_BROKEN_URLS,
  sectionLabels: {
    A: "Lynchburg depth",
    B: "Charlottesville depth",
    C: "Williamsburg depth",
    D: "Staunton depth",
    E: "Winchester depth (gap-fill)",
    F: "Petersburg depth (gap-fill)",
    G: "Manassas depth",
    H: "Regional spillover (Bristol/Galax/Pulaski/Tazewell/Smyth)",
  },
});
