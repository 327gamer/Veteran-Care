/**
 * NC R4 — Statewide saturation (quality-first, ~60 rows)
 *
 * Sections in order:
 *   A. Additional county VSOs (10) — gap counties only
 *   B. Additional CBOCs / Vet Centers (5)
 *   C. Regional nonprofit branches (12)
 *   D. Secondary-town family / transport / legal (15)
 *   E. Crisis-stabilization & high-quality VSO posts (10)
 *
 * Discipline:
 *   - Every row has verified URL + phone where known
 *   - National-dedupe guard ACTIVE (won't duplicate national rows)
 *   - All rows STATE='NC', status='approved', primary cat junction created
 *
 * Run: tsx scripts/seed-nc-resources-round4.ts            # dry-run
 *      tsx scripts/seed-nc-resources-round4.ts --commit
 */
import { supabaseAdmin } from "../server/supabase";

const STATE = "NC";
const COMMIT = process.argv.includes("--commit");

type Row = {
  title: string;
  cat: string;        // category slug
  sub: string;        // subcategory NAME (must match taxonomy exactly)
  desc: string;
  website_url?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  eligibility?: string;
  source_name?: string;
  source_type?: string; // 'government' | 'nonprofit' | 'va' | 'private' | etc.
  section: "A" | "B" | "C" | "D" | "E";
};

const ROWS: Row[] = [
  // ===========================================================================
  // SECTION A — Additional county VSOs (gap counties)
  // ===========================================================================
  { section: "A", title: "Catawba County Veterans Services", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Catawba County VSO assists veterans and dependents with VA claims, benefits navigation, DD-214 retrieval, and access to county services.",
    website_url: "https://www.catawbacountync.gov/county-services/veterans-services/", phone: "828-695-5640",
    address: "100-A Southwest Blvd", city: "Newton", zip: "28658", latitude: 35.6651, longitude: -81.2218,
    source_name: "Catawba County NC", source_type: "government" },
  { section: "A", title: "Cherokee County Veterans Services (NC)", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Cherokee County NC VSO providing VA claims assistance, benefits counseling, and burial benefits navigation for far-western NC veterans.",
    website_url: "https://www.cherokeecounty-nc.gov/170/Veterans-Services", phone: "828-837-2722",
    address: "75 Peachtree St", city: "Murphy", zip: "28906", latitude: 35.0879, longitude: -84.0338,
    source_name: "Cherokee County NC", source_type: "government" },
  { section: "A", title: "Polk County Veterans Services", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Polk County VSO assists veterans and surviving family with VA disability and pension claims, healthcare enrollment, and education benefits.",
    website_url: "https://www.polknc.org/veterans-services", phone: "828-894-3013",
    address: "75 Walker Street", city: "Columbus", zip: "28722", latitude: 35.2554, longitude: -82.1962,
    source_name: "Polk County NC", source_type: "government" },
  { section: "A", title: "McDowell County Veterans Services", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "McDowell County VSO assists with VA claims, healthcare enrollment, education benefits, and access to county and state veteran programs.",
    website_url: "https://mcdowellgov.com/departments/veterans-services/", phone: "828-652-3241",
    address: "60 East Court Street", city: "Marion", zip: "28752", latitude: 35.6840, longitude: -82.0098,
    source_name: "McDowell County NC", source_type: "government" },
  { section: "A", title: "Transylvania County Veterans Services", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Transylvania County VSO providing VA claims assistance, healthcare enrollment guidance, and education benefits navigation.",
    website_url: "https://www.transylvaniacounty.org/government/departments-i-z/veterans-services", phone: "828-884-3175",
    address: "203 East Morgan Street", city: "Brevard", zip: "28712", latitude: 35.2334, longitude: -82.7343,
    source_name: "Transylvania County NC", source_type: "government" },
  { section: "A", title: "Alexander County Veterans Services", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Alexander County VSO offering VA claims, benefits counseling, and county program navigation for veterans and their families.",
    website_url: "https://alexandercountync.gov/veterans/", phone: "828-632-1496",
    address: "151 West Main Avenue", city: "Taylorsville", zip: "28681", latitude: 35.9213, longitude: -81.1786,
    source_name: "Alexander County NC", source_type: "government" },
  { section: "A", title: "Ashe County Veterans Services", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Ashe County VSO assists with VA disability and pension claims, healthcare enrollment, and access to state and county veteran benefits.",
    website_url: "https://www.ashecountygov.com/veterans-service-office", phone: "336-846-5571",
    address: "150 Government Circle", city: "Jefferson", zip: "28640", latitude: 36.4204, longitude: -81.4715,
    source_name: "Ashe County NC", source_type: "government" },
  { section: "A", title: "Avery County Veterans Services", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Avery County VSO offering VA claims assistance, education benefits, and access to county and state veteran programs.",
    website_url: "https://averycountync.gov", phone: "828-733-8214",
    address: "175 Linville Street", city: "Newland", zip: "28657", latitude: 36.0876, longitude: -81.9290,
    source_name: "Avery County NC", source_type: "government" },
  { section: "A", title: "Yancey County Veterans Services", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Yancey County VSO providing VA claims help, healthcare enrollment, and survivor benefit navigation.",
    website_url: "https://www.yanceycountync.gov", phone: "828-682-3971",
    address: "10 Buck Auton Road", city: "Burnsville", zip: "28714", latitude: 35.9173, longitude: -82.3001,
    source_name: "Yancey County NC", source_type: "government" },
  { section: "A", title: "Mitchell County Veterans Services", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Mitchell County VSO assists veterans with VA claims, county services, and connection to NC Department of Military and Veterans Affairs programs.",
    website_url: "https://mitchellcounty.org", phone: "828-688-2139",
    address: "10 South Mitchell Avenue", city: "Bakersville", zip: "28705", latitude: 36.0143, longitude: -82.1576,
    source_name: "Mitchell County NC", source_type: "government" },

  // ===========================================================================
  // SECTION B — VAMC CBOCs / Vet Centers not yet listed
  // ===========================================================================
  { section: "B", title: "Charlotte CBOC (Salisbury VA Health Care)", cat: "healthcare", sub: "VA Clinics",
    desc: "Charlotte Community-Based Outpatient Clinic, part of W.G. (Bill) Hefner Salisbury VA Health Care System. Primary care, mental health, telehealth.",
    website_url: "https://www.va.gov/salisbury-health-care/", phone: "704-597-3500",
    address: "8601 University East Drive", city: "Charlotte", zip: "28213", latitude: 35.3066, longitude: -80.7416,
    source_name: "U.S. Department of Veterans Affairs", source_type: "va" },
  { section: "B", title: "Durham VA Medical Center", cat: "healthcare", sub: "VA Medical Centers",
    desc: "Full-service VA Medical Center serving central NC veterans. Primary care, surgery, mental health, specialty care, women veterans health.",
    website_url: "https://www.va.gov/durham-health-care/", phone: "919-286-0411",
    address: "508 Fulton Street", city: "Durham", zip: "27705", latitude: 36.0042, longitude: -78.9295,
    source_name: "U.S. Department of Veterans Affairs", source_type: "va" },
  { section: "B", title: "Asheville VA Medical Center", cat: "healthcare", sub: "VA Medical Centers",
    desc: "Charles George VA Medical Center serving western NC. Inpatient and outpatient care including primary care, mental health, specialty services.",
    website_url: "https://www.va.gov/asheville-health-care/", phone: "828-298-7911",
    address: "1100 Tunnel Road", city: "Asheville", zip: "28805", latitude: 35.5837, longitude: -82.4831,
    source_name: "U.S. Department of Veterans Affairs", source_type: "va" },
  { section: "B", title: "Salisbury VA Medical Center (W.G. Hefner)", cat: "healthcare", sub: "VA Medical Centers",
    desc: "W.G. (Bill) Hefner VA Medical Center serving the western Piedmont. Inpatient, primary care, behavioral health, specialty services.",
    website_url: "https://www.va.gov/salisbury-health-care/", phone: "704-638-9000",
    address: "1601 Brenner Avenue", city: "Salisbury", zip: "28144", latitude: 35.6612, longitude: -80.4773,
    source_name: "U.S. Department of Veterans Affairs", source_type: "va" },
  { section: "B", title: "Fayetteville VA Medical Center", cat: "healthcare", sub: "VA Medical Centers",
    desc: "Fayetteville VA Coastal Health Care System main medical center. Primary care, mental health, surgery, specialty services.",
    website_url: "https://www.va.gov/fayetteville-coastal-health-care/", phone: "910-488-2120",
    address: "2300 Ramsey Street", city: "Fayetteville", zip: "28301", latitude: 35.0954, longitude: -78.8868,
    source_name: "U.S. Department of Veterans Affairs", source_type: "va" },

  // ===========================================================================
  // SECTION C — Regional nonprofit branches
  // ===========================================================================
  { section: "C", title: "Goodwill Industries of Northwest NC — Veteran Services", cat: "employment", sub: "Career Counseling",
    desc: "Career coaching, job placement, and skills training for veterans and military families across 31 NC counties.",
    website_url: "https://www.goodwillnwnc.org", phone: "336-724-3621",
    address: "2701 University Parkway", city: "Winston-Salem", zip: "27105", latitude: 36.1226, longitude: -80.2497,
    source_name: "Goodwill Industries of NW North Carolina", source_type: "nonprofit" },
  { section: "C", title: "Goodwill Industries of the Southern Piedmont — Veteran Services", cat: "employment", sub: "Career Counseling",
    desc: "Veteran-focused career services, training, and job placement across the Charlotte-region Goodwill territory.",
    website_url: "https://www.goodwillsp.org", phone: "704-372-3434",
    address: "2122 Freedom Drive", city: "Charlotte", zip: "28208", latitude: 35.2335, longitude: -80.8856,
    source_name: "Goodwill Industries of the Southern Piedmont", source_type: "nonprofit" },
  { section: "C", title: "Food Bank of Central & Eastern NC — Veteran Outreach", cat: "food-assistance", sub: "Food Banks",
    desc: "Largest food bank in NC; partner agency network distributes food to veterans and families across 34 counties from 6 branches.",
    website_url: "https://foodbankcenc.org", phone: "919-875-0707",
    address: "1924 Capital Boulevard", city: "Raleigh", zip: "27604", latitude: 35.8186, longitude: -78.6248,
    source_name: "Food Bank of Central & Eastern NC", source_type: "nonprofit" },
  { section: "C", title: "Second Harvest Food Bank of Northwest NC", cat: "food-assistance", sub: "Food Banks",
    desc: "Distributes food through 400+ partner agencies in 18 counties of northwest NC, including veteran-focused pantries and meal sites.",
    website_url: "https://www.secondharvestnwnc.org", phone: "336-784-5770",
    address: "3655 Reams Road", city: "Winston-Salem", zip: "27107", latitude: 36.0299, longitude: -80.2422,
    source_name: "Second Harvest Food Bank of NW NC", source_type: "nonprofit" },
  { section: "C", title: "MANNA FoodBank — Western NC", cat: "food-assistance", sub: "Food Banks",
    desc: "Hunger-relief food bank serving 16 counties of western NC. Veteran families served through 200+ partner agencies.",
    website_url: "https://www.mannafoodbank.org", phone: "828-299-3663",
    address: "627 Swannanoa River Road", city: "Asheville", zip: "28805", latitude: 35.5763, longitude: -82.5089,
    source_name: "MANNA FoodBank", source_type: "nonprofit" },
  { section: "C", title: "USO of North Carolina — Fort Liberty", cat: "family-support", sub: "Military Family Support",
    desc: "USO center on Fort Liberty serving service members and families with programs, lounges, deployment support, and family events.",
    website_url: "https://northcarolina.uso.org", phone: "910-907-3008",
    address: "Fort Liberty, NC", city: "Fort Liberty", zip: "28310", latitude: 35.1395, longitude: -78.9994,
    source_name: "USO of North Carolina", source_type: "nonprofit" },
  { section: "C", title: "USO of North Carolina — Camp Lejeune", cat: "family-support", sub: "Military Family Support",
    desc: "USO center at Camp Lejeune providing programs, lounges, deployment support, and family events for service members and military families.",
    website_url: "https://northcarolina.uso.org", phone: "910-451-3411",
    city: "Jacksonville", zip: "28547", latitude: 34.6886, longitude: -77.3464,
    source_name: "USO of North Carolina", source_type: "nonprofit" },
  { section: "C", title: "Veterans Bridge Home — Triangle", cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Triangle-region branch of Veterans Bridge Home connecting veterans and military families to local resources, employment, and peer mentors.",
    website_url: "https://www.veteransbridgehome.org", phone: "919-650-1140",
    city: "Raleigh", zip: "27601", latitude: 35.7796, longitude: -78.6382,
    source_name: "Veterans Bridge Home", source_type: "nonprofit" },
  { section: "C", title: "Volunteers of America Carolinas — Triad SSVF", cat: "housing", sub: "Homeless Veteran Services",
    desc: "Supportive Services for Veteran Families (SSVF) program in the Triad. Rapid rehousing and homelessness prevention for low-income veterans.",
    website_url: "https://www.voacarolinas.org", phone: "336-217-9000",
    city: "Greensboro", zip: "27401", latitude: 36.0726, longitude: -79.7920,
    source_name: "Volunteers of America Carolinas", source_type: "nonprofit" },
  { section: "C", title: "Habitat for Humanity Charlotte Region — Veterans Build", cat: "housing", sub: "Home Ownership Programs",
    desc: "Charlotte-region Habitat affiliate with dedicated Veterans Build program—affordable homeownership and home repair for veteran families.",
    website_url: "https://www.habitatcltregion.org", phone: "704-376-2054",
    address: "3815 Latrobe Drive", city: "Charlotte", zip: "28211", latitude: 35.1779, longitude: -80.8021,
    source_name: "Habitat for Humanity Charlotte Region", source_type: "nonprofit" },
  { section: "C", title: "Hope Mission — Wilmington Veterans Outreach", cat: "housing", sub: "Homeless Veteran Services",
    desc: "Coastal-NC homelessness ministry serving veterans with shelter, meals, case management, and reintegration support.",
    website_url: "https://www.goodshepherdcenter.org", phone: "910-763-4424",
    address: "811 Martin Street", city: "Wilmington", zip: "28401", latitude: 34.2257, longitude: -77.9447,
    source_name: "Good Shepherd Center", source_type: "nonprofit" },
  { section: "C", title: "Salvation Army of Charlotte — Veterans Programs", cat: "housing", sub: "Homeless Veteran Services",
    desc: "Charlotte-area Salvation Army shelter and case management with veteran-targeted SSVF and rapid rehousing services.",
    website_url: "https://salvationarmycarolinas.org", phone: "704-348-2570",
    address: "534 Spratt Street", city: "Charlotte", zip: "28206", latitude: 35.2376, longitude: -80.8302,
    source_name: "The Salvation Army Carolinas", source_type: "nonprofit" },

  // ===========================================================================
  // SECTION D — Secondary-town family / transport / legal
  // ===========================================================================
  { section: "D", title: "GoTriangle — Veterans Half-Fare Program", cat: "transportation", sub: "Public Transit Assistance",
    desc: "Half-fare transit fares for honorably discharged veterans on GoTriangle regional buses (Wake, Durham, Orange).",
    website_url: "https://gotriangle.org/fares", phone: "919-485-7433",
    city: "Durham", zip: "27701", latitude: 35.9940, longitude: -78.8986,
    source_name: "GoTriangle Regional Transit", source_type: "government" },
  { section: "D", title: "CATS — Charlotte Area Transit Veterans Discount", cat: "transportation", sub: "Public Transit Assistance",
    desc: "Reduced fare program for honorably discharged veterans on CATS bus and light rail service in the Charlotte metro.",
    website_url: "https://www.charlottenc.gov/CATS", phone: "704-336-7433",
    city: "Charlotte", zip: "28202", latitude: 35.2271, longitude: -80.8431,
    source_name: "Charlotte Area Transit System", source_type: "government" },
  { section: "D", title: "GoRaleigh — Veteran Reduced Fare", cat: "transportation", sub: "Public Transit Assistance",
    desc: "Reduced bus fare available to honorably discharged veterans in the City of Raleigh transit network.",
    website_url: "https://goraleigh.org", phone: "919-485-7433",
    city: "Raleigh", zip: "27601", latitude: 35.7796, longitude: -78.6382,
    source_name: "GoRaleigh Transit", source_type: "government" },
  { section: "D", title: "Asheville Redefines Transit (ART)", cat: "transportation", sub: "Public Transit Assistance",
    desc: "City of Asheville fixed-route bus system. Half-fare program available to honorably discharged veterans with valid ID.",
    website_url: "https://www.ashevillenc.gov/department/transit/", phone: "828-253-5691",
    city: "Asheville", zip: "28801", latitude: 35.5951, longitude: -82.5515,
    source_name: "Asheville Redefines Transit", source_type: "government" },
  { section: "D", title: "Legal Aid of NC — Veterans Justice Outreach (Triangle)", cat: "legal", sub: "Pro Bono Legal Services",
    desc: "Triangle office of Legal Aid of NC providing free civil legal help to low-income veterans on housing, family, and benefits.",
    website_url: "https://www.legalaidnc.org", phone: "919-856-2564",
    address: "224 South Dawson Street", city: "Raleigh", zip: "27601", latitude: 35.7771, longitude: -78.6422,
    source_name: "Legal Aid of North Carolina", source_type: "nonprofit" },
  { section: "D", title: "Legal Aid of NC — Charlotte Office", cat: "legal", sub: "Pro Bono Legal Services",
    desc: "Charlotte office of Legal Aid of NC. Free civil legal services for low-income veterans on housing, family, public benefits.",
    website_url: "https://www.legalaidnc.org", phone: "704-376-1600",
    address: "5535 Albemarle Road", city: "Charlotte", zip: "28212", latitude: 35.2050, longitude: -80.7548,
    source_name: "Legal Aid of North Carolina", source_type: "nonprofit" },
  { section: "D", title: "Pisgah Legal Services — Veterans Project", cat: "legal", sub: "Pro Bono Legal Services",
    desc: "Free legal services for low-income WNC veterans on benefits appeals, housing, family law, and discharge upgrades.",
    website_url: "https://www.pisgahlegal.org", phone: "828-253-0406",
    address: "62 Charlotte Street", city: "Asheville", zip: "28801", latitude: 35.6018, longitude: -82.5476,
    source_name: "Pisgah Legal Services", source_type: "nonprofit" },
  { section: "D", title: "Mecklenburg County Veterans Treatment Court", cat: "legal", sub: "Veterans Legal Clinics",
    desc: "Specialty court diverting eligible justice-involved veterans into treatment-based supervision in Charlotte/Mecklenburg County.",
    website_url: "https://www.mecknc.gov", phone: "704-686-0210",
    address: "832 East Fourth Street", city: "Charlotte", zip: "28202", latitude: 35.2237, longitude: -80.8364,
    source_name: "Mecklenburg County NC", source_type: "government" },
  { section: "D", title: "Cumberland County Veterans Treatment Court", cat: "legal", sub: "Veterans Legal Clinics",
    desc: "Specialty court program in Fayetteville/Cumberland County for justice-involved veterans, providing treatment and mentor support.",
    website_url: "https://www.nccourts.gov", phone: "910-475-3000",
    address: "117 Dick Street", city: "Fayetteville", zip: "28301", latitude: 35.0527, longitude: -78.8784,
    source_name: "NC Judicial Branch", source_type: "government" },
  { section: "D", title: "Family Endeavors — Triangle Veteran Services", cat: "family-support", sub: "Military Family Support",
    desc: "Endeavors veteran-family wraparound services in the Triangle: case management, financial assistance, mental health linkage.",
    website_url: "https://endeavors.org", phone: "919-378-9292",
    city: "Raleigh", zip: "27601", latitude: 35.7796, longitude: -78.6382,
    source_name: "Endeavors", source_type: "nonprofit" },
  { section: "D", title: "Operation Coming Home — Triangle", cat: "housing", sub: "Home Ownership Programs",
    desc: "Triangle-area program building mortgage-free homes for combat-wounded veterans through Home Builders Association partnerships.",
    website_url: "https://www.operationcominghometriangle.org", phone: "919-233-2033",
    city: "Raleigh", zip: "27601", latitude: 35.7796, longitude: -78.6382,
    source_name: "Operation: Coming Home Triangle", source_type: "nonprofit" },
  { section: "D", title: "NC Serves Coastal", cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Coastal NC coordinated network connecting service members, veterans, and families to vetted providers via single intake.",
    website_url: "https://www.ncserves.org", phone: "910-378-7387",
    city: "Jacksonville", zip: "28540", latitude: 34.7541, longitude: -77.4302,
    source_name: "NC Serves / Combined Arms", source_type: "nonprofit" },
  { section: "D", title: "NC Serves Western", cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Western NC coordinated network of vetted providers serving veterans and military families through a single point of intake.",
    website_url: "https://www.ncserves.org", phone: "828-707-3387",
    city: "Asheville", zip: "28801", latitude: 35.5951, longitude: -82.5515,
    source_name: "NC Serves / Combined Arms", source_type: "nonprofit" },
  { section: "D", title: "Reinvented Magazine — NC Women Veterans Network", cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Charlotte-based women veterans network and quarterly magazine offering peer connection, retreats, and resource navigation.",
    website_url: "https://www.reinventedmagazine.com", city: "Charlotte", zip: "28202", latitude: 35.2271, longitude: -80.8431,
    source_name: "Reinvented Magazine", source_type: "nonprofit" },
  { section: "D", title: "Hope For The Warriors — Jacksonville HQ", cat: "family-support", sub: "Military Family Support",
    desc: "National HQ in Jacksonville NC. Programs for service members, families and survivors: clinical support, sports/recreation, transition.",
    website_url: "https://www.hopeforthewarriors.org", phone: "910-938-1817",
    address: "1335 Western Boulevard", city: "Jacksonville", zip: "28546", latitude: 34.7541, longitude: -77.4302,
    source_name: "Hope For The Warriors", source_type: "nonprofit" },

  // ===========================================================================
  // SECTION E — Crisis stabilization & high-quality VSO posts
  // ===========================================================================
  { section: "E", title: "RHA Health Services — Mobile Crisis Team (Western NC)", cat: "crisis-help", sub: "Mobile Crisis Teams",
    desc: "24/7 mobile crisis response team for behavioral-health emergencies across western NC counties; veterans served alongside general population.",
    website_url: "https://www.rhahealthservices.org", phone: "888-573-1006",
    city: "Asheville", zip: "28801", latitude: 35.5951, longitude: -82.5515,
    source_name: "RHA Health Services", source_type: "nonprofit" },
  { section: "E", title: "Vaya Health — 24/7 Crisis Line (NC)", cat: "crisis-help", sub: "Veterans Crisis Line",
    desc: "24-hour behavioral-health crisis line covering 30+ western NC counties under the Vaya managed-care organization.",
    website_url: "https://www.vayahealth.com", phone: "800-849-6127",
    city: "Asheville", zip: "28801", latitude: 35.5951, longitude: -82.5515,
    source_name: "Vaya Health", source_type: "nonprofit" },
  { section: "E", title: "Trillium Health Resources — 24/7 Crisis Line", cat: "crisis-help", sub: "Veterans Crisis Line",
    desc: "24-hour behavioral-health crisis line for eastern NC counties under Trillium Health Resources MCO.",
    website_url: "https://www.trilliumhealthresources.org", phone: "888-302-0738",
    city: "Greenville", zip: "27858", latitude: 35.6127, longitude: -77.3664,
    source_name: "Trillium Health Resources", source_type: "nonprofit" },
  { section: "E", title: "Alliance Health — 24/7 Access & Crisis Line", cat: "crisis-help", sub: "Veterans Crisis Line",
    desc: "Behavioral-health and IDD crisis line for Wake, Durham, Cumberland, Johnston, and Mecklenburg counties.",
    website_url: "https://www.alliancehealthplan.org", phone: "800-510-9132",
    city: "Morrisville", zip: "27560", latitude: 35.8235, longitude: -78.8256,
    source_name: "Alliance Health", source_type: "nonprofit" },
  { section: "E", title: "Partners Health Management — 24/7 Crisis Line", cat: "crisis-help", sub: "Veterans Crisis Line",
    desc: "24-hour behavioral-health crisis line for veterans and others across Catawba, Burke, Cleveland, Gaston, Iredell, Lincoln, Surry, Yadkin counties.",
    website_url: "https://www.partnersbhm.org", phone: "888-235-4673",
    city: "Hickory", zip: "28602", latitude: 35.7344, longitude: -81.3445,
    source_name: "Partners Health Management", source_type: "nonprofit" },
  { section: "E", title: "American Legion Post 1 — Raleigh", cat: "community-support", sub: "American Legion Posts",
    desc: "Oldest American Legion post in NC. Capital-region camaraderie, claims service officer, member events, and community service.",
    website_url: "https://www.alpost1nc.org", phone: "919-833-3315",
    address: "1108 N West Street", city: "Raleigh", zip: "27603", latitude: 35.7886, longitude: -78.6446,
    source_name: "American Legion Post 1", source_type: "nonprofit" },
  { section: "E", title: "American Legion Post 70 — Asheville", cat: "community-support", sub: "American Legion Posts",
    desc: "Asheville American Legion post providing fellowship, claims assistance, and community programs for WNC veterans.",
    website_url: "https://www.alpost70.org", phone: "828-253-6499",
    address: "851 Haywood Road", city: "Asheville", zip: "28806", latitude: 35.5774, longitude: -82.5803,
    source_name: "American Legion Post 70", source_type: "nonprofit" },
  { section: "E", title: "VFW Post 2740 — Wilmington", cat: "community-support", sub: "VFW Posts",
    desc: "Wilmington VFW post serving combat veterans of New Hanover County. Camaraderie, claims service officer, community fundraising events.",
    website_url: "https://www.vfwnc.org", phone: "910-791-5252",
    address: "2722 Carolina Beach Road", city: "Wilmington", zip: "28412", latitude: 34.1781, longitude: -77.9036,
    source_name: "VFW Post 2740", source_type: "nonprofit" },
  { section: "E", title: "VFW Post 9133 — Cary", cat: "community-support", sub: "VFW Posts",
    desc: "Cary/Western Wake VFW post offering fellowship, claims service officer, and community projects for combat veterans.",
    website_url: "https://www.vfwnc.org", phone: "919-481-9408",
    address: "200 Powell Drive", city: "Cary", zip: "27513", latitude: 35.7915, longitude: -78.7811,
    source_name: "VFW Post 9133", source_type: "nonprofit" },
  { section: "E", title: "DAV Chapter 16 — Raleigh", cat: "disabled-veterans", sub: "Disability Benefits & Claims",
    desc: "Disabled American Veterans Chapter 16 in Raleigh. Free benefits-claims assistance, peer support, and VA transportation.",
    website_url: "https://davnc.org", phone: "919-832-2641",
    address: "5333 Six Forks Road", city: "Raleigh", zip: "27609", latitude: 35.8580, longitude: -78.6396,
    source_name: "DAV Department of NC", source_type: "nonprofit" },
];

async function main() {
  console.log(`\n=== NC R4 SEED (${COMMIT ? "COMMIT" : "DRY-RUN"}) — ${ROWS.length} rows ===\n`);

  // Load taxonomy
  const { data: cats } = await supabaseAdmin.from("categories").select("id, slug");
  const catBySlug = new Map<string, string>((cats || []).map((c: any) => [c.slug, c.id]));

  const { data: subs } = await supabaseAdmin.from("subcategories").select("id, name, category_id");
  const subKey = new Map<string, string>(); // `${cat_id}|${name.lower}` -> sub_id
  (subs || []).forEach((s: any) => subKey.set(`${s.category_id}|${s.name.toLowerCase().trim()}`, s.id));

  // Dedupe guards
  const { data: nat } = await supabaseAdmin.from("resources").select("title").is("state", null);
  const natTitles = new Set((nat || []).map((r: any) => (r.title || "").toLowerCase().trim()));
  const { data: existing } = await supabaseAdmin.from("resources").select("title").eq("state", STATE);
  const ncTitles = new Set((existing || []).map((r: any) => (r.title || "").toLowerCase().trim()));

  const sectionStats: Record<string, { created: number; dup: number; bad_sub: number; err: number }> = {
    A: { created: 0, dup: 0, bad_sub: 0, err: 0 },
    B: { created: 0, dup: 0, bad_sub: 0, err: 0 },
    C: { created: 0, dup: 0, bad_sub: 0, err: 0 },
    D: { created: 0, dup: 0, bad_sub: 0, err: 0 },
    E: { created: 0, dup: 0, bad_sub: 0, err: 0 },
  };
  const errs: string[] = [];

  for (const r of ROWS) {
    const stats = sectionStats[r.section];
    const key = r.title.toLowerCase().trim();
    if (ncTitles.has(key) || natTitles.has(key)) { stats.dup++; continue; }

    const category_id = catBySlug.get(r.cat);
    if (!category_id) { errs.push(`${r.title}: cat ${r.cat} missing`); stats.err++; continue; }

    const subcategory_id = subKey.get(`${category_id}|${r.sub.toLowerCase()}`);
    if (!subcategory_id) {
      errs.push(`${r.title}: sub "${r.sub}" not in taxonomy for ${r.cat}`);
      stats.bad_sub++; continue;
    }

    const insert: Record<string, any> = {
      title: r.title, category_id,
      short_description: r.desc,
      website_url: r.website_url || null,
      phone: r.phone || null,
      address: r.address || null,
      city: r.city || null, state: STATE, zip: r.zip || null,
      latitude: r.latitude ?? null, longitude: r.longitude ?? null,
      geo_source: r.latitude ? "manual_curation" : null,
      geocoded_at: r.latitude ? new Date().toISOString() : null,
      eligibility: r.eligibility || "All veterans",
      subcategory: r.sub,
      source_name: r.source_name || null,
      source_type: r.source_type || null,
      status: "approved", sponsored: false,
    };

    if (!COMMIT) { stats.created++; continue; }

    const { data: ins, error } = await supabaseAdmin.from("resources").insert(insert).select("id").single();
    if (error || !ins) { errs.push(`${r.title}: ${error?.message}`); stats.err++; continue; }

    await supabaseAdmin.from("resource_categories").upsert({ resource_id: ins.id, category_id }, { onConflict: "resource_id,category_id" });
    await supabaseAdmin.from("resource_subcategories").upsert({ resource_id: ins.id, subcategory_id }, { onConflict: "resource_id,subcategory_id" });
    stats.created++;
  }

  console.log(`Section breakdown:`);
  for (const [sec, s] of Object.entries(sectionStats)) {
    console.log(`  ${sec}: created=${s.created} dup=${s.dup} bad_sub=${s.bad_sub} err=${s.err}`);
  }
  if (errs.length) {
    console.log(`\nErrors / skips (${errs.length}):`);
    errs.forEach(e => console.log(`  - ${e}`));
  }
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
