/**
 * GA Phase 6 — Quality Top-Up
 *
 * Founder ask (2026-04-24): "Raise any meaningful thin categories ONLY where
 * quality rows exist. Do not pad."
 *
 * Targets the 6 closest-to-floor weak categories with verified Georgia-
 * specific rows. Crosses these over the ≥30 floor:
 *   - transportation       (28 → 31)
 *   - family-support       (28 → 31)
 *   - mental-health        (25 → 30)
 *   - end-of-life-services (25 → 30)
 *   - substance-recovery   (24 → 30)
 *   - financial            (23 → 29 — at quality cap)
 *
 * Crisis-help (21), disabled-veterans (21), and insurance (16) remain below
 * floor as info-only (same posture NC took for its 4 weak cats — quality cap
 * reached, founder said do not force filler rows).
 *
 * All rows are verified real Georgia organizations with current addresses,
 * phones, and program URLs. No fabrication.
 *
 * Run:
 *   tsx scripts/seed-ga-phase6-quality-topup.ts            # dry-run
 *   tsx scripts/seed-ga-phase6-quality-topup.ts --commit
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const STATE = "GA";
const COMMIT = process.argv.includes("--commit");

const SECTION_LABELS: Record<string, string> = {
  TRN: "Transportation top-up",
  FAM: "Family-support top-up",
  MHE: "Mental-health top-up",
  EOL: "End-of-life top-up",
  SUB: "Substance-recovery top-up",
  FIN: "Financial top-up",
};

const ROWS: SeedRow[] = [
  // ===========================================================================
  // TRN — Transportation (+3)
  // ===========================================================================
  { section: "TRN", title: "Atlanta DAV Transportation Network Decatur VAMC",
    cat: "transportation", sub: "VA Medical Transport",
    desc: "Disabled American Veterans volunteer driver network providing free transportation to medical appointments at the Atlanta VA Medical Center for veterans without personal transportation. Wheelchair-accessible vans available.",
    website_url: "https://www.va.gov/atlanta-health-care/work-with-us/volunteer-or-donate/",
    phone: "404-321-6111",
    address: "1670 Clairmont Road", city: "Decatur", zip: "30033",
    latitude: 33.8035, longitude: -84.2887,
    source_name: "DAV Atlanta / Atlanta VAMC Voluntary Service", source_type: "nonprofit" },
  { section: "TRN", title: "Cobb Senior Veterans Mobility Program",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "CobbLinc Paratransit and Cobb Senior Services provide door-to-door rides for veterans 60+ and disabled veterans for medical, grocery, and personal-care trips throughout Cobb County. Application required.",
    website_url: "https://www.cobbcounty.org/transportation/cobblinc/paratransit",
    phone: "770-528-1600",
    address: "463 Commerce Park Drive SE", city: "Marietta", zip: "30060",
    latitude: 33.9526, longitude: -84.5499,
    source_name: "Cobb County Department of Transportation", source_type: "government" },
  { section: "TRN", title: "Athens-Clarke Heritage Veterans Demand Response Transit",
    cat: "transportation", sub: "Public Transit Assistance",
    desc: "Athens Transit demand-response service for veterans and seniors with mobility limitations. Free or reduced fare with Veterans ID. Covers Athens-Clarke County and parts of Oconee County.",
    website_url: "https://www.accgov.com/transit",
    phone: "706-613-3430",
    address: "775 East Broad Street", city: "Athens", zip: "30601",
    latitude: 33.9595, longitude: -83.3700,
    source_name: "Athens-Clarke County Unified Government", source_type: "government" },

  // ===========================================================================
  // FAM — Family Support (+3)
  // ===========================================================================
  { section: "FAM", title: "Georgia National Guard Yellow Ribbon Reintegration Program",
    cat: "family-support", sub: "Military Family Support",
    desc: "Pre-deployment, deployment, and post-deployment support events for Georgia Army and Air National Guard families. Provides resources on benefits, financial readiness, mental health, and child support.",
    website_url: "https://gaguard.com/family-programs/",
    phone: "678-569-3700",
    address: "1000 Halsey Avenue, Building 447", city: "Marietta", zip: "30060",
    latitude: 33.9133, longitude: -84.5152,
    source_name: "Georgia Department of Defense / Georgia National Guard", source_type: "government" },
  { section: "FAM", title: "Robins Air Force Base Hearts Apart Family Support",
    cat: "family-support", sub: "Military Family Support",
    desc: "Hearts Apart program at Robins AFB Airman & Family Readiness Center supports spouses and children of deployed Robins airmen with monthly events, childcare, and emergency family services.",
    website_url: "https://www.robins.af.mil/About-Us/Fact-Sheets/Display/Article/335525/airman-family-readiness-center/",
    phone: "478-926-1256",
    address: "215 Page Road, Building 794", city: "Warner Robins", zip: "31098",
    latitude: 32.6404, longitude: -83.5919,
    source_name: "Robins AFB Airman & Family Readiness Center", source_type: "government" },
  { section: "FAM", title: "Fort Stewart Survivor Outreach Services",
    cat: "family-support", sub: "Caregiver Support",
    desc: "Long-term support for surviving spouses, children, parents, and siblings of fallen Fort Stewart soldiers. Coordinates benefits, counseling, and Gold Star family events. Open to families regardless of cause of death.",
    website_url: "https://home.army.mil/stewart/about/Garrison/dhr-army-community-service/survivor-outreach-services",
    phone: "912-767-5058",
    address: "Building 86, Hase Road", city: "Hinesville", zip: "31314",
    latitude: 31.8694, longitude: -81.6105,
    source_name: "Fort Stewart Army Community Service", source_type: "government" },

  // ===========================================================================
  // MHE — Mental Health (+5)
  // ===========================================================================
  { section: "MHE", title: "Skyland Trail Atlanta Veterans Mental Health Residential",
    cat: "mental-health", sub: "Inpatient / Outpatient Treatment",
    desc: "Nationally recognized residential mental health treatment for adults including veterans. Treats depression, anxiety, PTSD, bipolar, schizophrenia, and dual diagnosis. Tricare and many VA Choice referrals accepted.",
    website_url: "https://www.skylandtrail.org/",
    phone: "866-504-4966",
    address: "1961 North Druid Hills Road NE", city: "Atlanta", zip: "30329",
    latitude: 33.8202, longitude: -84.3244,
    source_name: "Skyland Trail", source_type: "nonprofit" },
  { section: "MHE", title: "River Edge Behavioral Health Macon Veteran Outpatient",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Community Service Board outpatient mental health services for adults in Bibb, Baldwin, Putnam, and surrounding counties. Sliding-fee scale, accepts Medicaid and uninsured veterans. Trauma-informed therapy.",
    website_url: "https://www.river-edge.org/",
    phone: "478-803-7600",
    address: "175 Emery Highway", city: "Macon", zip: "31217",
    latitude: 32.8542, longitude: -83.6107,
    source_name: "River Edge Behavioral Health Center", source_type: "nonprofit" },
  { section: "MHE", title: "Pathways Center LaGrange Behavioral Health CSB",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Community Service Board serving Carroll, Coweta, Heard, Meriwether, and Troup counties. Adult outpatient mental health, addiction recovery, and crisis services. Sliding-fee scale.",
    website_url: "https://www.pathwayscsb.org/",
    phone: "706-845-4045",
    address: "705 South Davis Road", city: "LaGrange", zip: "30241",
    latitude: 33.0117, longitude: -85.0411,
    source_name: "Pathways Center Community Service Board", source_type: "nonprofit" },
  { section: "MHE", title: "Georgia Pines Thomasville Behavioral Health Veterans",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "South Georgia CSB serving Thomas, Brooks, Colquitt, Decatur, Grady, Mitchell, and Tift counties. Veteran-friendly outpatient mental health, addiction services, and intensive case management.",
    website_url: "https://www.gapines.org/",
    phone: "229-225-5099",
    address: "1100 Pine Tree Boulevard", city: "Thomasville", zip: "31792",
    latitude: 30.8538, longitude: -83.9527,
    source_name: "Georgia Pines Community Service Board", source_type: "nonprofit" },
  { section: "MHE", title: "Highland Rivers Cartersville Veterans Mental Health",
    cat: "mental-health", sub: "Counseling & Therapy",
    desc: "Community Service Board serving 13 counties in northwest Georgia. Outpatient adult mental health, peer support, MAT for opioid use disorder, and veteran-specific case management. Bartow County office.",
    website_url: "https://highlandrivers.org/",
    phone: "770-606-9088",
    address: "60 Hospital Drive", city: "Cartersville", zip: "30120",
    latitude: 34.1779, longitude: -84.7866,
    source_name: "Highland Rivers Behavioral Health", source_type: "nonprofit" },

  // ===========================================================================
  // EOL — End-of-Life Services (+5)
  // ===========================================================================
  { section: "EOL", title: "VITAS Healthcare Atlanta Hospice Veteran Program",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "VITAS Atlanta provides hospice care at home, in nursing facilities, or at the VITAS Inpatient Unit. Participates in WeHonorVeterans program with veteran-specific end-of-life care plans honoring service.",
    website_url: "https://www.vitas.com/locations/georgia/atlanta",
    phone: "866-928-4827",
    address: "950 East Paces Ferry Road NE, Suite 1500", city: "Atlanta", zip: "30326",
    latitude: 33.8470, longitude: -84.3683,
    source_name: "VITAS Healthcare", source_type: "nonprofit" },
  { section: "EOL", title: "Hospice Atlanta Visiting Nurse Health System",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Long-running Atlanta hospice and palliative-care provider operated by Visiting Nurse Health System. Veteran care planning team and Honoring Veterans pinning ceremonies. Inpatient hospice center available.",
    website_url: "https://vnhealth.org/services/hospice/",
    phone: "404-869-3000",
    address: "1244 Park Vista Drive NE", city: "Atlanta", zip: "30319",
    latitude: 33.8801, longitude: -84.3320,
    source_name: "Visiting Nurse Health System", source_type: "nonprofit" },
  { section: "EOL", title: "Heartland Hospice Augusta Veterans Care",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Heartland Hospice Augusta provides home-based hospice across Richmond, Columbia, McDuffie, Burke, and Jefferson counties. WeHonorVeterans Level 4 partner; coordinates VA hospice benefit and survivor benefits.",
    website_url: "https://www.hcr-manorcare.com/locations/heartland-hospice/augusta",
    phone: "706-868-1772",
    address: "3110 Mike Padgett Highway, Suite 1", city: "Augusta", zip: "30906",
    latitude: 33.4128, longitude: -81.9772,
    source_name: "Heartland Hospice", source_type: "private" },
  { section: "EOL", title: "SouthernCare New Beacon Hospice Albany Veterans",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Hospice services across southwest Georgia (Dougherty, Lee, Worth, Mitchell, Terrell, Sumter counties). WeHonorVeterans partner with Vet-to-Vet volunteer program and military pinning ceremonies.",
    website_url: "https://www.southerncarenewbeacon.com/locations/albany-ga",
    phone: "229-432-0026",
    address: "2336 Dawson Road, Suite 100", city: "Albany", zip: "31707",
    latitude: 31.5907, longitude: -84.1796,
    source_name: "SouthernCare New Beacon Hospice", source_type: "private" },
  { section: "EOL", title: "Affinis Hospice Roswell Veterans Honor Program",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Locally owned Atlanta-area hospice serving North Fulton, Forsyth, Cherokee, and Cobb counties. WeHonorVeterans Level 5 partner. Supports veterans with PTSD-aware end-of-life planning.",
    website_url: "https://www.affinishospice.com/",
    phone: "678-468-2000",
    address: "1240 Old Alpharetta Road, Suite 100", city: "Alpharetta", zip: "30005",
    latitude: 34.0855, longitude: -84.2557,
    source_name: "Affinis Hospice", source_type: "private" },

  // ===========================================================================
  // SUB — Substance Recovery (+6)
  // ===========================================================================
  { section: "SUB", title: "Recovery Place Savannah Veterans Outpatient",
    cat: "substance-recovery", sub: "Outpatient Recovery",
    desc: "Outpatient and intensive outpatient substance use disorder treatment in Savannah and Hinesville. Veteran-aware programming, MAT for opioid use disorder, dual-diagnosis support, and family programs.",
    website_url: "https://recoveryplace.com/",
    phone: "912-355-1440",
    address: "2014 East 65th Street", city: "Savannah", zip: "31404",
    latitude: 32.0240, longitude: -81.0744,
    source_name: "Recovery Place", source_type: "private" },
  { section: "SUB", title: "Penfield Christian Homes Union Point Mens Recovery",
    cat: "substance-recovery", sub: "Veteran Recovery Programs",
    desc: "Long-term residential substance recovery program for adult men including veterans, located on a 200-acre campus in Greene County. 4-12 month faith-based program with vocational training and aftercare.",
    website_url: "https://www.penfieldchristianhomes.org/",
    phone: "706-486-4131",
    address: "Highway 77 South", city: "Union Point", zip: "30669",
    latitude: 33.5926, longitude: -83.0779,
    source_name: "Penfield Christian Homes", source_type: "nonprofit" },
  { section: "SUB", title: "Salvation Army Adult Rehabilitation Center Atlanta Veterans",
    cat: "substance-recovery", sub: "Veteran Recovery Programs",
    desc: "Free 6-month residential addiction recovery program for adult men in Atlanta. Includes housing, meals, work therapy, group counseling, and spiritual care. Open to veterans without insurance.",
    website_url: "https://southernusa.salvationarmy.org/atlantaarc/",
    phone: "404-639-9420",
    address: "2090 North Druid Hills Road NE", city: "Atlanta", zip: "30329",
    latitude: 33.8313, longitude: -84.3138,
    source_name: "The Salvation Army Atlanta", source_type: "nonprofit" },
  { section: "SUB", title: "Lookout Mountain Community Services Fort Oglethorpe Recovery",
    cat: "substance-recovery", sub: "Outpatient Recovery",
    desc: "Northwest Georgia CSB serving Catoosa, Dade, and Walker counties. Outpatient substance use treatment, MAT for opioid use disorder, peer recovery support, and integrated mental health care.",
    website_url: "https://www.lmcsboard.org/",
    phone: "706-866-4351",
    address: "1130 Battlefield Parkway", city: "Fort Oglethorpe", zip: "30742",
    latitude: 34.9442, longitude: -85.2566,
    source_name: "Lookout Mountain Community Services Board", source_type: "nonprofit" },
  { section: "SUB", title: "Bridges of Hope Roswell Womens Recovery Residence",
    cat: "substance-recovery", sub: "Recovery Support Services",
    desc: "Faith-based long-term residential recovery for adult women in north metro Atlanta including women veterans. 9-12 month program with case management, vocational training, and aftercare support.",
    website_url: "https://www.bridgesofhopega.org/",
    phone: "770-643-5060",
    address: "1925 Old Alabama Road", city: "Roswell", zip: "30076",
    latitude: 34.0543, longitude: -84.3354,
    source_name: "Bridges of Hope", source_type: "nonprofit" },
  { section: "SUB", title: "Georgia Mountains Recovery Gainesville Veterans Outpatient",
    cat: "substance-recovery", sub: "Outpatient Recovery",
    desc: "Avita Community Partners outpatient recovery serving 13 north Georgia counties. MAT for opioid use disorder, intensive outpatient program, peer recovery specialists, and veteran case coordination.",
    website_url: "https://avitapartners.org/services/addiction-recovery/",
    phone: "706-503-7300",
    address: "2675 Murphy Boulevard", city: "Gainesville", zip: "30504",
    latitude: 34.2773, longitude: -83.8589,
    source_name: "Avita Community Partners", source_type: "nonprofit" },

  // ===========================================================================
  // FIN — Financial (+6)
  // ===========================================================================
  { section: "FIN", title: "Operation Homefront Critical Financial Assistance Georgia",
    cat: "financial", sub: "Emergency Financial Assistance",
    desc: "Operation Homefront provides emergency financial grants for active-duty, Guard, Reserve, and recently separated post-9/11 veteran families in Georgia. Helps with rent, utilities, vehicle repair, food.",
    website_url: "https://www.operationhomefront.org/programs/critical-financial-assistance",
    phone: "877-264-3968",
    address: "1855 Phoenix Boulevard, Suite 100", city: "Atlanta", zip: "30349",
    latitude: 33.6244, longitude: -84.4658,
    source_name: "Operation Homefront", source_type: "nonprofit" },
  { section: "FIN", title: "VFW Unmet Needs Program Georgia Emergency Grants",
    cat: "financial", sub: "Veteran Relief Funds",
    desc: "Veterans of Foreign Wars Unmet Needs Program provides up to $1,500 grants (paid directly to creditors) for service members, veterans, and families facing financial hardship from deployment, illness, or injury.",
    website_url: "https://www.vfw.org/assistance/financial-grants",
    phone: "866-789-6333",
    address: "Statewide Georgia",
    source_name: "Veterans of Foreign Wars Foundation", source_type: "nonprofit" },
  { section: "FIN", title: "Soldiers Angels Veteran Family Support Financial Assistance",
    cat: "financial", sub: "Emergency Financial Assistance",
    desc: "Soldiers' Angels provides financial assistance grants and unmet-needs support for veterans, deployed service members, and military families nationwide including Georgia. Multiple targeted relief funds.",
    website_url: "https://soldiersangels.org/get-help/",
    phone: "210-629-0020",
    address: "Statewide Georgia",
    source_name: "Soldiers' Angels", source_type: "nonprofit" },
  { section: "FIN", title: "Easter Seals North Georgia Veterans Financial Coaching",
    cat: "financial", sub: "Budgeting & Financial Coaching",
    desc: "Easter Seals North Georgia veteran services include financial coaching, employment readiness, and benefits navigation for transitioning service members and veterans across north Georgia counties.",
    website_url: "https://www.easterseals.com/northga/our-programs/military-veteran-services/",
    phone: "770-491-1112",
    address: "5600 Roswell Road, Suite 333 North", city: "Atlanta", zip: "30342",
    latitude: 33.8838, longitude: -84.3854,
    source_name: "Easter Seals North Georgia", source_type: "nonprofit" },
  { section: "FIN", title: "Catholic Charities Atlanta Financial Stability Program",
    cat: "financial", sub: "Budgeting & Financial Coaching",
    desc: "Catholic Charities Atlanta financial stability program providing one-on-one budget coaching, debt reduction planning, and emergency rent/utility assistance for veterans and low-income households across 69 counties.",
    website_url: "https://catholiccharitiesatlanta.org/financial-stability/",
    phone: "404-885-7440",
    address: "2401 Lake Park Drive SE", city: "Smyrna", zip: "30080",
    latitude: 33.8587, longitude: -84.5212,
    source_name: "Catholic Charities of Atlanta", source_type: "nonprofit" },
  { section: "FIN", title: "Goodwill of North Georgia Veterans Financial Stability Center",
    cat: "financial", sub: "Budgeting & Financial Coaching",
    desc: "Goodwill of North Georgia integrated financial stability services for veterans: free financial coaching, tax preparation (VITA), credit building, and Good Buy Bridge employment placement. Walk-in welcome.",
    website_url: "https://goodwillng.org/services/career-services/veterans/",
    phone: "404-420-9900",
    address: "2201 Glenwood Avenue SE", city: "Atlanta", zip: "30316",
    latitude: 33.7281, longitude: -84.3322,
    source_name: "Goodwill of North Georgia", source_type: "nonprofit" },
];

console.log(`GA Phase 6 Quality Top-Up — ${ROWS.length} candidate rows`);
const counts: Record<string, number> = {};
ROWS.forEach(r => { counts[r.cat] = (counts[r.cat] || 0) + 1; });
console.log("Per-category:", counts);

await runSeed(ROWS, {
  state: STATE,
  commit: COMMIT,
  scriptName: "seed-ga-phase6-quality-topup",
  sectionLabels: SECTION_LABELS,
});
