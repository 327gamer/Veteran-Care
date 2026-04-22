/**
 * SC Polish Pass — secondary-town saturation + thin-category beef-up
 *
 * Sections:
 *   A. Gap-county VSOs (12)
 *   B. Additional CBOCs / Vet Centers (5)
 *   C. Secondary-town nonprofits / family / transit / legal (15)
 *   D. Family-support category beef-up (currently only 8 rows) (10)
 *   E. Underserved-area community-support / VSO posts (8)
 *
 * Run: tsx scripts/seed-sc-polish.ts            # dry-run
 *      tsx scripts/seed-sc-polish.ts --commit
 */
import { supabaseAdmin } from "../server/supabase";

const STATE = "SC";
const COMMIT = process.argv.includes("--commit");

type Row = {
  title: string;
  cat: string;
  sub: string;
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
  source_type?: string;
  section: "A" | "B" | "C" | "D" | "E";
};

const ROWS: Row[] = [
  // -------- A. Gap-county VSOs --------
  { section: "A", title: "Lancaster County Veterans Affairs Office", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Lancaster County VAO assists veterans and dependents with VA claims, benefits navigation, and DD-214 retrieval.",
    website_url: "https://www.mylancastersc.org/176/Veterans-Affairs", phone: "803-285-7414",
    address: "1872 Pageland Hwy", city: "Lancaster", zip: "29720", latitude: 34.7290, longitude: -80.7715,
    source_name: "Lancaster County SC", source_type: "government" },
  { section: "A", title: "York County Veterans Affairs Office", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "York County VAO providing claims assistance, benefits counseling, and survivor benefit navigation.",
    website_url: "https://www.yorkcountygov.com/348/Veterans-Affairs", phone: "803-684-8528",
    address: "6 South Congress Street", city: "York", zip: "29745", latitude: 34.9954, longitude: -81.2387,
    source_name: "York County SC", source_type: "government" },
  { section: "A", title: "Pickens County Veterans Affairs Office", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Pickens County VAO assists with VA disability and pension claims, healthcare enrollment, and county program navigation.",
    website_url: "https://www.co.pickens.sc.us/va/", phone: "864-898-5926",
    address: "222 McDaniel Avenue", city: "Pickens", zip: "29671", latitude: 34.8826, longitude: -82.7081,
    source_name: "Pickens County SC", source_type: "government" },
  { section: "A", title: "Greenwood County Veterans Affairs Office", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Greenwood County VAO assists veterans with VA claims, benefits counseling, and county service navigation.",
    website_url: "https://www.greenwoodsc.gov", phone: "864-942-8537",
    address: "528 Monument Street", city: "Greenwood", zip: "29646", latitude: 34.1954, longitude: -82.1626,
    source_name: "Greenwood County SC", source_type: "government" },
  { section: "A", title: "Newberry County Veterans Affairs Office", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Newberry County VAO assists veterans and surviving family with VA claims, healthcare enrollment, and education benefits.",
    website_url: "https://www.newberrycounty.net", phone: "803-321-2128",
    address: "1309 College Street", city: "Newberry", zip: "29108", latitude: 34.2740, longitude: -81.6190,
    source_name: "Newberry County SC", source_type: "government" },
  { section: "A", title: "Cherokee County Veterans Affairs Office (SC)", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Cherokee County SC VAO providing VA claims assistance, benefits counseling, and county service navigation.",
    website_url: "https://www.cherokeecountysc.com", phone: "864-487-2552",
    address: "110 Railroad Avenue", city: "Gaffney", zip: "29340", latitude: 35.0710, longitude: -81.6498,
    source_name: "Cherokee County SC", source_type: "government" },
  { section: "A", title: "Chesterfield County Veterans Affairs", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Chesterfield County VAO assists with VA disability and pension claims, education benefits, and survivor support.",
    website_url: "https://www.chesterfieldcountysc.com", phone: "843-623-2599",
    address: "200 W Main Street", city: "Chesterfield", zip: "29709", latitude: 34.7384, longitude: -80.0901,
    source_name: "Chesterfield County SC", source_type: "government" },
  { section: "A", title: "Darlington County Veterans Affairs", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Darlington County VAO assists veterans with VA claims, healthcare enrollment, and education benefit navigation.",
    website_url: "https://www.darcosc.com", phone: "843-398-4130",
    address: "1 Public Square", city: "Darlington", zip: "29532", latitude: 34.2998, longitude: -79.8762,
    source_name: "Darlington County SC", source_type: "government" },
  { section: "A", title: "Marlboro County Veterans Affairs", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Marlboro County VAO providing VA claims assistance, benefits counseling, and county service navigation.",
    website_url: "https://www.marlborocountysc.com", phone: "843-479-5604",
    address: "117 W Main Street", city: "Bennettsville", zip: "29512", latitude: 34.6171, longitude: -79.6845,
    source_name: "Marlboro County SC", source_type: "government" },
  { section: "A", title: "Georgetown County Veterans Affairs", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Georgetown County VAO assists with VA claims, healthcare enrollment, education benefits, and survivor benefit navigation.",
    website_url: "https://www.georgetowncountysc.org", phone: "843-545-3070",
    address: "129 Screven Street", city: "Georgetown", zip: "29440", latitude: 33.3768, longitude: -79.2941,
    source_name: "Georgetown County SC", source_type: "government" },
  { section: "A", title: "Hampton County Veterans Affairs", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Hampton County VAO assists veterans with VA claims, healthcare enrollment, and county program navigation.",
    website_url: "https://www.hamptoncountysc.org", phone: "803-914-2160",
    address: "200 Jackson Avenue East", city: "Hampton", zip: "29924", latitude: 32.8741, longitude: -81.1192,
    source_name: "Hampton County SC", source_type: "government" },
  { section: "A", title: "Colleton County Veterans Affairs", cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Colleton County VAO assists veterans with VA claims, benefits counseling, and county service navigation.",
    website_url: "https://www.colletoncounty.org", phone: "843-549-5872",
    address: "31 Klein Street", city: "Walterboro", zip: "29488", latitude: 32.9046, longitude: -80.6678,
    source_name: "Colleton County SC", source_type: "government" },

  // -------- B. CBOCs / Vet Centers --------
  { section: "B", title: "Anderson VA Clinic (Greenville HCS)", cat: "healthcare", sub: "VA Clinics",
    desc: "Anderson Community-Based Outpatient Clinic providing primary care, mental health, and telehealth for upstate SC veterans.",
    website_url: "https://www.va.gov/columbia-south-carolina-health-care/", phone: "864-224-5450",
    address: "3030 N Highway 81", city: "Anderson", zip: "29621", latitude: 34.5034, longitude: -82.6501,
    source_name: "U.S. Department of Veterans Affairs", source_type: "va" },
  { section: "B", title: "Rock Hill VA Clinic", cat: "healthcare", sub: "VA Clinics",
    desc: "Rock Hill CBOC of the Columbia VA Health Care System. Primary care, mental health, telehealth.",
    website_url: "https://www.va.gov/columbia-south-carolina-health-care/", phone: "803-366-4848",
    address: "2670 Mills Park Drive", city: "Rock Hill", zip: "29732", latitude: 34.9249, longitude: -81.0251,
    source_name: "U.S. Department of Veterans Affairs", source_type: "va" },
  { section: "B", title: "Sumter VA Clinic", cat: "healthcare", sub: "VA Clinics",
    desc: "Sumter CBOC of the Columbia VA Health Care System. Primary care, mental health, women's health.",
    website_url: "https://www.va.gov/columbia-south-carolina-health-care/", phone: "803-938-9901",
    address: "407 N Salem Avenue", city: "Sumter", zip: "29150", latitude: 33.9204, longitude: -80.3414,
    source_name: "U.S. Department of Veterans Affairs", source_type: "va" },
  { section: "B", title: "Beaufort Vet Center", cat: "mental-health", sub: "Vet Centers",
    desc: "Beaufort Vet Center providing free counseling, outreach, and referrals for combat veterans, families, and bereaved survivors.",
    website_url: "https://www.va.gov/find-locations/facility/vc_0411V", phone: "843-228-3960",
    address: "1402 King Street", city: "Beaufort", zip: "29902", latitude: 32.4316, longitude: -80.6699,
    source_name: "U.S. Department of Veterans Affairs", source_type: "va" },
  { section: "B", title: "Myrtle Beach Vet Center", cat: "mental-health", sub: "Vet Centers",
    desc: "Myrtle Beach Vet Center providing readjustment counseling, MST counseling, bereavement, and outreach for combat veterans and families.",
    website_url: "https://www.va.gov/find-locations/facility/vc_0408V", phone: "843-232-2441",
    address: "5009 Dick Pond Road", city: "Myrtle Beach", zip: "29588", latitude: 33.6891, longitude: -78.8867,
    source_name: "U.S. Department of Veterans Affairs", source_type: "va" },

  // -------- C. Secondary-town nonprofits / family / transit / legal --------
  { section: "C", title: "SC Legal Services — Greenwood Office", cat: "legal", sub: "Legal Aid Services",
    desc: "Greenwood office of SC Legal Services. Free civil legal help for low-income veterans on housing, benefits, and family matters.",
    website_url: "https://www.sclegal.org", phone: "864-229-5294",
    city: "Greenwood", zip: "29646", latitude: 34.1954, longitude: -82.1626,
    source_name: "SC Legal Services", source_type: "nonprofit" },
  { section: "C", title: "SC Legal Services — Rock Hill Office", cat: "legal", sub: "Legal Aid Services",
    desc: "Rock Hill office of SC Legal Services. Free civil legal services for low-income veterans across upstate SC.",
    website_url: "https://www.sclegal.org", phone: "803-329-9099",
    city: "Rock Hill", zip: "29730", latitude: 34.9249, longitude: -81.0251,
    source_name: "SC Legal Services", source_type: "nonprofit" },
  { section: "C", title: "SC Legal Services — Myrtle Beach Office", cat: "legal", sub: "Legal Aid Services",
    desc: "Myrtle Beach office of SC Legal Services. Free civil legal help for veterans on housing, benefits, family law.",
    website_url: "https://www.sclegal.org", phone: "843-444-7000",
    city: "Myrtle Beach", zip: "29577", latitude: 33.6891, longitude: -78.8867,
    source_name: "SC Legal Services", source_type: "nonprofit" },
  { section: "C", title: "Lowcountry Food Bank — Beaufort Branch", cat: "food-assistance", sub: "Food Banks",
    desc: "Beaufort branch of Lowcountry Food Bank distributing food to veteran families through a network of Beaufort and Jasper county partners.",
    website_url: "https://www.lowcountryfoodbank.org", phone: "843-470-1066",
    city: "Beaufort", zip: "29902", latitude: 32.4316, longitude: -80.6699,
    source_name: "Lowcountry Food Bank", source_type: "nonprofit" },
  { section: "C", title: "Lowcountry Food Bank — Myrtle Beach Branch", cat: "food-assistance", sub: "Food Banks",
    desc: "Myrtle Beach branch of Lowcountry Food Bank distributing food to veteran families through a network of Horry/Georgetown county partners.",
    website_url: "https://www.lowcountryfoodbank.org", phone: "843-554-6403",
    city: "Myrtle Beach", zip: "29577", latitude: 33.6891, longitude: -78.8867,
    source_name: "Lowcountry Food Bank", source_type: "nonprofit" },
  { section: "C", title: "CARTA — Charleston Area Transit Veteran Discount", cat: "transportation", sub: "Public Transit Assistance",
    desc: "Charleston Area Regional Transportation Authority offers reduced fares for honorably discharged veterans across tri-county area.",
    website_url: "https://www.ridecarta.com", phone: "843-724-7420",
    city: "Charleston", zip: "29401", latitude: 32.7765, longitude: -79.9311,
    source_name: "Charleston Area Regional Transportation Authority", source_type: "government" },
  { section: "C", title: "Greenlink — Greenville Public Transit", cat: "transportation", sub: "Public Transit Assistance",
    desc: "Greenville-area Greenlink fixed-route bus and trolley network. Reduced fares available for honorably discharged veterans with valid ID.",
    website_url: "https://www.ridegreenlink.com", phone: "864-467-5000",
    city: "Greenville", zip: "29601", latitude: 34.8526, longitude: -82.3940,
    source_name: "Greenlink Transit", source_type: "government" },
  { section: "C", title: "COMET — Columbia Public Transit Veterans Discount", cat: "transportation", sub: "Public Transit Assistance",
    desc: "The COMET (Central Midlands Regional Transit Authority) reduced-fare program for veterans across the Columbia metro area.",
    website_url: "https://catchthecomet.org", phone: "803-255-7100",
    city: "Columbia", zip: "29201", latitude: 34.0007, longitude: -81.0348,
    source_name: "Central Midlands RTA", source_type: "government" },
  { section: "C", title: "Goodwill Industries of Upstate / Midlands SC — Veteran Services", cat: "employment", sub: "Career Counseling",
    desc: "Career coaching, job placement, and skills training for veterans and military families across 30 upstate/midlands SC counties.",
    website_url: "https://www.goodwillsc.org", phone: "864-235-3781",
    address: "15 South Pleasantburg Drive", city: "Greenville", zip: "29607", latitude: 34.8347, longitude: -82.3604,
    source_name: "Goodwill Industries of Upstate/Midlands SC", source_type: "nonprofit" },
  { section: "C", title: "Habitat for Humanity Greenville County — Veterans Build", cat: "housing", sub: "Home Ownership Programs",
    desc: "Greenville County Habitat affiliate with Veterans Build program — affordable homeownership and home repair for low-income veteran families.",
    website_url: "https://www.habitatgreenville.org", phone: "864-282-7150",
    address: "11 Goodrich Street", city: "Greenville", zip: "29607", latitude: 34.8526, longitude: -82.3940,
    source_name: "Habitat for Humanity of Greenville County", source_type: "nonprofit" },
  { section: "C", title: "Origin SC — SSVF (Charleston)", cat: "housing", sub: "Homeless Veteran Services",
    desc: "Charleston-area SSVF program providing rapid rehousing and homelessness prevention for low-income veteran families.",
    website_url: "https://originsc.org", phone: "843-735-7800",
    address: "1064 Gardner Road", city: "Charleston", zip: "29407", latitude: 32.7950, longitude: -79.9789,
    source_name: "Origin SC", source_type: "nonprofit" },
  { section: "C", title: "Greenville Soup Kitchen", cat: "food-assistance", sub: "Community Kitchens",
    desc: "Daily meals served to veterans and others experiencing food insecurity in Greenville. Case-management and resource navigation on site.",
    website_url: "https://www.greenvillesoupkitchen.org", phone: "864-232-5878",
    address: "475 Mauldin Road", city: "Greenville", zip: "29607", latitude: 34.8253, longitude: -82.3879,
    source_name: "Greenville Soup Kitchen", source_type: "nonprofit" },
  { section: "C", title: "Salvation Army of the Midlands (Columbia) — Veteran Services", cat: "housing", sub: "Homeless Veteran Services",
    desc: "Columbia-area Salvation Army shelter, case management, and SSVF coordination for homeless and at-risk veterans.",
    website_url: "https://salvationarmycarolinas.org", phone: "803-765-0260",
    address: "3024 Farrow Road", city: "Columbia", zip: "29203", latitude: 34.0432, longitude: -81.0192,
    source_name: "The Salvation Army Carolinas", source_type: "nonprofit" },
  { section: "C", title: "Sumter Senior Services — Veteran Outreach", cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Sumter County aging services program offering meals, transportation, and social activities for senior veterans.",
    website_url: "https://www.sumterseniors.org", phone: "803-773-5508",
    address: "115 Broad Street", city: "Sumter", zip: "29150", latitude: 33.9204, longitude: -80.3414,
    source_name: "Sumter Senior Services", source_type: "nonprofit" },
  { section: "C", title: "Goose Creek VFW Post 10692", cat: "community-support", sub: "VFW Posts",
    desc: "Goose Creek-area VFW post serving combat veterans of Berkeley County. Service officer support, fellowship, community fundraising.",
    website_url: "https://vfwsc.org", phone: "843-572-2114",
    address: "115 Hawthorne Drive", city: "Goose Creek", zip: "29445", latitude: 32.9810, longitude: -80.0326,
    source_name: "VFW Post 10692", source_type: "nonprofit" },

  // -------- D. Family-support beef-up --------
  { section: "D", title: "Carolina Children's Charity — Military Family Grants (SC)", cat: "family-support", sub: "Childcare Assistance",
    desc: "Charleston-region nonprofit providing emergency grants to military families with children facing medical or financial hardship.",
    website_url: "https://www.carolinaschildrenscharity.org", phone: "843-572-1010",
    city: "Charleston", zip: "29407", latitude: 32.7765, longitude: -79.9311,
    source_name: "Carolina Children's Charity", source_type: "nonprofit" },
  { section: "D", title: "Operation Homefront — Carolinas Region", cat: "family-support", sub: "Military Family Support",
    desc: "Carolinas-region Operation Homefront serving military families with critical financial assistance, transitional housing, and family support programs.",
    website_url: "https://www.operationhomefront.org", phone: "210-659-7756",
    city: "Charleston", zip: "29401", latitude: 32.7765, longitude: -79.9311,
    source_name: "Operation Homefront", source_type: "nonprofit" },
  { section: "D", title: "Blue Star Families — Charleston Chapter", cat: "family-support", sub: "Military Family Support",
    desc: "Charleston-area Blue Star Families chapter providing community programs, family events, and peer support for active-duty and veteran families.",
    website_url: "https://bluestarfam.org", phone: "843-302-3733",
    city: "Charleston", zip: "29401", latitude: 32.7765, longitude: -79.9311,
    source_name: "Blue Star Families", source_type: "nonprofit" },
  { section: "D", title: "Tragedy Assistance Program for Survivors (TAPS) — SC", cat: "family-support", sub: "Survivor Benefits Support",
    desc: "South Carolina chapter of TAPS providing peer support, grief counseling, and survivor seminars for families of fallen military.",
    website_url: "https://www.taps.org", phone: "800-959-8277",
    city: "Columbia", zip: "29201", latitude: 34.0007, longitude: -81.0348,
    source_name: "TAPS", source_type: "nonprofit" },
  { section: "D", title: "Fort Jackson Family Readiness Group Network", cat: "family-support", sub: "Military Family Support",
    desc: "Fort Jackson FRG network connecting active-duty Army families with peer support, deployment information, and family readiness resources.",
    website_url: "https://home.army.mil/jackson", phone: "803-751-5511",
    city: "Columbia", zip: "29207", latitude: 34.0407, longitude: -80.9554,
    source_name: "Fort Jackson Garrison", source_type: "government" },
  { section: "D", title: "Military OneSource — SC Spouse Employment Partnership", cat: "family-support", sub: "Spouse Employment Assistance",
    desc: "DoD-sponsored employment program connecting SC military spouses to portable careers via partner employers and Spouse Education and Career Opportunities (SECO).",
    website_url: "https://myseco.militaryonesource.mil", phone: "800-342-9647",
    city: "Columbia", zip: "29201", latitude: 34.0007, longitude: -81.0348,
    source_name: "U.S. Department of Defense — MyMilitaryOneSource", source_type: "government" },
  { section: "D", title: "MCAS Beaufort Marine and Family Programs", cat: "family-support", sub: "Military Family Support",
    desc: "Marine Corps Air Station Beaufort family support programs: counseling, exceptional family member program, deployment support, and family readiness.",
    website_url: "https://www.beaufort.marines.mil", phone: "843-228-7211",
    city: "Beaufort", zip: "29904", latitude: 32.4767, longitude: -80.7237,
    source_name: "MCAS Beaufort", source_type: "government" },
  { section: "D", title: "Joint Base Charleston Airman & Family Readiness Center", cat: "family-support", sub: "Military Family Support",
    desc: "Joint Base Charleston Air Force family readiness programs: relocation, deployment, transition assistance, and personal financial counseling.",
    website_url: "https://www.jbcharleston.jb.mil", phone: "843-963-4408",
    city: "Charleston", zip: "29404", latitude: 32.8995, longitude: -80.0405,
    source_name: "Joint Base Charleston", source_type: "government" },
  { section: "D", title: "American Red Cross — SC Service to Armed Forces", cat: "family-support", sub: "Military Family Support",
    desc: "American Red Cross Service to the Armed Forces in SC: emergency communications, deployment support, and resilience workshops.",
    website_url: "https://www.redcross.org/get-help/military-families.html", phone: "877-272-7337",
    city: "Columbia", zip: "29201", latitude: 34.0007, longitude: -81.0348,
    source_name: "American Red Cross", source_type: "nonprofit" },
  { section: "D", title: "Boys & Girls Clubs of the Lowcountry — Military Youth Programs", cat: "family-support", sub: "Youth Programs",
    desc: "Lowcountry-region BGCA programming with military-family youth supports for active-duty, Reserve, and veteran families.",
    website_url: "https://www.bgclowcountry.org", phone: "843-815-2447",
    city: "Bluffton", zip: "29910", latitude: 32.2374, longitude: -80.8606,
    source_name: "Boys & Girls Clubs of the Lowcountry", source_type: "nonprofit" },

  // -------- E. Underserved-area community support / posts --------
  { section: "E", title: "American Legion Post 6 — Sumter", cat: "community-support", sub: "American Legion Posts",
    desc: "Sumter American Legion post serving Shaw AFB-area veterans. Service officer support, fellowship, community programs.",
    website_url: "https://www.legion.org", phone: "803-773-7200",
    address: "201 Magnolia Street", city: "Sumter", zip: "29150", latitude: 33.9204, longitude: -80.3414,
    source_name: "American Legion Post 6", source_type: "nonprofit" },
  { section: "E", title: "American Legion Post 64 — Greenwood", cat: "community-support", sub: "American Legion Posts",
    desc: "Greenwood American Legion post providing fellowship, claims service officer support, and community service programs.",
    website_url: "https://www.legion.org", phone: "864-223-1188",
    address: "207 Maxwell Avenue", city: "Greenwood", zip: "29646", latitude: 34.1954, longitude: -82.1626,
    source_name: "American Legion Post 64", source_type: "nonprofit" },
  { section: "E", title: "VFW Post 641 — Anderson", cat: "community-support", sub: "VFW Posts",
    desc: "Anderson VFW post serving combat veterans of upstate SC. Service officer support, fellowship, community fundraising events.",
    website_url: "https://vfwsc.org", phone: "864-225-3266",
    address: "108 N Murray Avenue", city: "Anderson", zip: "29621", latitude: 34.5034, longitude: -82.6501,
    source_name: "VFW Post 641", source_type: "nonprofit" },
  { section: "E", title: "VFW Post 9539 — Aiken", cat: "community-support", sub: "VFW Posts",
    desc: "Aiken VFW post serving combat veterans of the CSRA region. Member services, claims support, community programs.",
    website_url: "https://vfwsc.org", phone: "803-648-2882",
    address: "1850 Pine Log Road", city: "Aiken", zip: "29803", latitude: 33.5604, longitude: -81.7196,
    source_name: "VFW Post 9539", source_type: "nonprofit" },
  { section: "E", title: "DAV Chapter 21 — Spartanburg", cat: "disabled-veterans", sub: "Disability Benefits & Claims",
    desc: "Disabled American Veterans Spartanburg chapter providing free benefits-claims assistance, peer support, and VA transportation.",
    website_url: "https://www.davsc.org", phone: "864-585-1611",
    address: "405 East Henry Street", city: "Spartanburg", zip: "29302", latitude: 34.9496, longitude: -81.9320,
    source_name: "DAV Department of SC", source_type: "nonprofit" },
  { section: "E", title: "DAV Chapter 35 — Aiken", cat: "disabled-veterans", sub: "Disability Benefits & Claims",
    desc: "Disabled American Veterans Aiken chapter providing free benefits-claims assistance, peer support, and VA transportation.",
    website_url: "https://www.davsc.org", phone: "803-648-9890",
    address: "115 Park Avenue SW", city: "Aiken", zip: "29801", latitude: 33.5604, longitude: -81.7196,
    source_name: "DAV Department of SC", source_type: "nonprofit" },
  { section: "E", title: "Sumter Veterans Council", cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Coalition of Sumter-area veterans organizations coordinating community events, parades, and outreach for Shaw AFB and county veterans.",
    website_url: "https://www.sumterveteranscouncil.org", phone: "803-436-8410",
    city: "Sumter", zip: "29150", latitude: 33.9204, longitude: -80.3414,
    source_name: "Sumter Veterans Council", source_type: "nonprofit" },
  { section: "E", title: "Aiken County Veterans Council", cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Coalition of Aiken-area veterans organizations coordinating CSRA-region events, advocacy, and outreach.",
    website_url: "https://aikencountyveteranscouncil.com", phone: "803-642-1500",
    city: "Aiken", zip: "29801", latitude: 33.5604, longitude: -81.7196,
    source_name: "Aiken County Veterans Council", source_type: "nonprofit" },
];

async function main() {
  console.log(`\n=== SC POLISH SEED (${COMMIT ? "COMMIT" : "DRY-RUN"}) — ${ROWS.length} rows ===\n`);

  const { data: cats } = await supabaseAdmin.from("categories").select("id, slug");
  const catBySlug = new Map<string, string>((cats || []).map((c: any) => [c.slug, c.id]));

  const { data: subs } = await supabaseAdmin.from("subcategories").select("id, name, category_id");
  const subKey = new Map<string, string>();
  (subs || []).forEach((s: any) => subKey.set(`${s.category_id}|${s.name.toLowerCase().trim()}`, s.id));

  const { data: nat } = await supabaseAdmin.from("resources").select("title").is("state", null);
  const natTitles = new Set((nat || []).map((r: any) => (r.title || "").toLowerCase().trim()));
  const { data: existing } = await supabaseAdmin.from("resources").select("title").eq("state", STATE);
  const scTitles = new Set((existing || []).map((r: any) => (r.title || "").toLowerCase().trim()));

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
    if (scTitles.has(key) || natTitles.has(key)) { stats.dup++; continue; }

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
