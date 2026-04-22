/**
 * North Carolina Resources Seed — ROUND 3
 *
 * Closes the 7 unbuilt NC categories so NC becomes the clean,
 * complete-shape template state before Georgia.
 *
 * Categories addressed (R3):
 *   - End of Life Services (slug: end-of-life-services)
 *   - Wellness & Recovery   (slug: substance-recovery)
 *   - Food Assistance       (slug: food-assistance)
 *   - Financial & Credit    (slug: financial)
 *   - Transportation        (slug: transportation)
 *   - Family Support        (slug: family-support)
 *   - Insurance Services    (slug: insurance)
 *
 * GUARDRAIL — NEW IN R3 (locked permanently for all future state seeds):
 *   Before insert, check if title (or title with state suffix stripped)
 *   matches an existing state=NULL row. If yes, skip — never duplicate
 *   a national resource as a state row.
 *
 * Run: tsx scripts/seed-nc-resources-round3.ts
 */
import { supabaseAdmin } from "../server/supabase";

const STATE = "NC";

interface SeedResource {
  title: string;
  category_slug: string;
  subcategory_name?: string;
  short_description: string;
  website_url?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  eligibility?: string;
  source_name: string;
  source_type: "program" | "service" | "facility" | "nonprofit" | "government";
  status?: "approved" | "pending";
}

const NC_RESOURCES: SeedResource[] = [
  // ============================================================
  // END OF LIFE SERVICES (15)
  // ============================================================
  {
    title: "Coastal Carolina State Veterans Cemetery",
    category_slug: "end-of-life-services",
    subcategory_name: "Veteran Funeral Honors & Cemetery Assistance",
    short_description: "State veterans cemetery in Jacksonville providing burial for eligible NC veterans, spouses, and dependent children.",
    website_url: "https://www.milvets.nc.gov/cemeteries/coastal-carolina-state-veterans-cemetery",
    phone: "910-347-3334",
    address: "110 Montford Landing Road",
    city: "Jacksonville",
    zip: "28540",
    latitude: 34.7679,
    longitude: -77.4172,
    eligibility: "NC veterans, spouses, dependents",
    source_name: "NC Department of Military and Veterans Affairs",
    source_type: "government",
  },
  {
    title: "Sandhills State Veterans Cemetery",
    category_slug: "end-of-life-services",
    subcategory_name: "Veteran Funeral Honors & Cemetery Assistance",
    short_description: "State veterans cemetery in Spring Lake serving Fort Liberty community. Burial for eligible NC veterans, spouses, and dependents.",
    website_url: "https://www.milvets.nc.gov/cemeteries/sandhills-state-veterans-cemetery",
    phone: "910-436-5630",
    address: "8220 Bragg Boulevard",
    city: "Spring Lake",
    zip: "28390",
    latitude: 35.1804,
    longitude: -78.9908,
    eligibility: "NC veterans, spouses, dependents",
    source_name: "NC Department of Military and Veterans Affairs",
    source_type: "government",
  },
  {
    title: "Western Carolina State Veterans Cemetery",
    category_slug: "end-of-life-services",
    subcategory_name: "Veteran Funeral Honors & Cemetery Assistance",
    short_description: "State veterans cemetery in Black Mountain serving western NC veterans, spouses, and dependents.",
    website_url: "https://www.milvets.nc.gov/cemeteries/western-carolina-state-veterans-cemetery",
    phone: "828-669-4036",
    address: "962 Old Highway 70",
    city: "Black Mountain",
    zip: "28711",
    latitude: 35.6177,
    longitude: -82.3201,
    eligibility: "NC veterans, spouses, dependents",
    source_name: "NC Department of Military and Veterans Affairs",
    source_type: "government",
  },
  {
    title: "Salisbury National Cemetery",
    category_slug: "end-of-life-services",
    subcategory_name: "Veteran Funeral Honors & Cemetery Assistance",
    short_description: "VA national cemetery in Salisbury. Burial for eligible veterans and family members.",
    website_url: "https://www.cem.va.gov/cems/nchp/salisbury.asp",
    phone: "704-636-2661",
    address: "501 Statesville Boulevard",
    city: "Salisbury",
    zip: "28144",
    latitude: 35.6770,
    longitude: -80.4946,
    eligibility: "Eligible veterans and family members",
    source_name: "U.S. Department of Veterans Affairs - National Cemetery Administration",
    source_type: "government",
  },
  {
    title: "Raleigh National Cemetery",
    category_slug: "end-of-life-services",
    subcategory_name: "Veteran Funeral Honors & Cemetery Assistance",
    short_description: "VA national cemetery in Raleigh. Burial for eligible veterans and family members.",
    website_url: "https://www.cem.va.gov/cems/nchp/raleigh.asp",
    phone: "704-636-2661",
    address: "501 Rock Quarry Road",
    city: "Raleigh",
    zip: "27610",
    latitude: 35.7594,
    longitude: -78.6126,
    eligibility: "Eligible veterans and family members",
    source_name: "U.S. Department of Veterans Affairs - National Cemetery Administration",
    source_type: "government",
  },
  {
    title: "New Bern National Cemetery",
    category_slug: "end-of-life-services",
    subcategory_name: "Veteran Funeral Honors & Cemetery Assistance",
    short_description: "VA national cemetery in New Bern serving eastern NC. Burial for eligible veterans and family members.",
    website_url: "https://www.cem.va.gov/cems/nchp/newbern.asp",
    phone: "252-637-2912",
    address: "1711 National Avenue",
    city: "New Bern",
    zip: "28560",
    latitude: 35.0936,
    longitude: -77.0488,
    eligibility: "Eligible veterans and family members",
    source_name: "U.S. Department of Veterans Affairs - National Cemetery Administration",
    source_type: "government",
  },
  {
    title: "Wilmington National Cemetery",
    category_slug: "end-of-life-services",
    subcategory_name: "Veteran Funeral Honors & Cemetery Assistance",
    short_description: "Historic VA national cemetery in Wilmington. Currently closed to new interments except cremated remains; family memorials remain available.",
    website_url: "https://www.cem.va.gov/cems/nchp/wilmington.asp",
    phone: "910-815-4877",
    address: "2011 Market Street",
    city: "Wilmington",
    zip: "28403",
    latitude: 34.2406,
    longitude: -77.9216,
    eligibility: "Eligible veterans and family members (cremated only)",
    source_name: "U.S. Department of Veterans Affairs - National Cemetery Administration",
    source_type: "government",
  },
  {
    title: "NC Veterans Funeral Honors Program",
    category_slug: "end-of-life-services",
    subcategory_name: "Veteran Funeral Honors & Cemetery Assistance",
    short_description: "State-coordinated military funeral honors for eligible NC veterans. Honor guard, flag presentation, Taps. Request through funeral director or NCDMVA.",
    website_url: "https://www.milvets.nc.gov/services/funeral-honors",
    phone: "844-624-8387",
    city: "Raleigh",
    zip: "27699",
    latitude: 35.7706,
    longitude: -78.6383,
    eligibility: "Eligible NC veterans (any era)",
    source_name: "NC Department of Military and Veterans Affairs",
    source_type: "government",
  },
  {
    title: "Transitions LifeCare (Raleigh Hospice)",
    category_slug: "end-of-life-services",
    subcategory_name: "Hospice & Palliative Care",
    short_description: "Comprehensive hospice and palliative care for veterans and families across the Triangle. We Honor Veterans Level 4 partner.",
    website_url: "https://transitionslifecare.org",
    phone: "919-828-0890",
    address: "250 Hospice Circle",
    city: "Raleigh",
    zip: "27607",
    latitude: 35.8097,
    longitude: -78.7041,
    eligibility: "Patients with terminal illness",
    source_name: "Transitions LifeCare",
    source_type: "nonprofit",
  },
  {
    title: "Hospice & Palliative CareCenter (Winston-Salem)",
    category_slug: "end-of-life-services",
    subcategory_name: "Hospice & Palliative Care",
    short_description: "Hospice, palliative care, and grief support across Forsyth, Guilford, Davie, Davidson, Stokes, and Surry counties. We Honor Veterans partner.",
    website_url: "https://www.hospicecarecenter.org",
    phone: "336-768-3972",
    address: "101 Hospice Lane",
    city: "Winston-Salem",
    zip: "27103",
    latitude: 36.0586,
    longitude: -80.3088,
    eligibility: "Patients with terminal illness",
    source_name: "Hospice & Palliative CareCenter",
    source_type: "nonprofit",
  },
  {
    title: "Four Seasons Hospice & Palliative Care (Western NC)",
    category_slug: "end-of-life-services",
    subcategory_name: "Hospice & Palliative Care",
    short_description: "Hospice and palliative care across western NC. Veteran-specific recognition program and pinning ceremonies.",
    website_url: "https://www.fourseasonscfl.org",
    phone: "828-692-6178",
    address: "571 South Allen Road",
    city: "Flat Rock",
    zip: "28731",
    latitude: 35.2737,
    longitude: -82.4373,
    eligibility: "Patients with terminal illness",
    source_name: "Four Seasons Compassion for Life",
    source_type: "nonprofit",
  },
  {
    title: "Liberty HomeCare & Hospice Services (Statewide NC)",
    category_slug: "end-of-life-services",
    subcategory_name: "In-Home Care & Skilled Nursing",
    short_description: "In-home care and hospice services across multiple NC counties. We Honor Veterans partner with veteran-specific care plans.",
    website_url: "https://www.libertyhomecare.com",
    phone: "800-999-9883",
    city: "Wilmington",
    zip: "28403",
    latitude: 34.2257,
    longitude: -77.9447,
    eligibility: "Patients needing in-home care",
    source_name: "Liberty HomeCare and Hospice",
    source_type: "nonprofit",
  },
  {
    title: "Atrium Health Hospice & Palliative Care (Charlotte)",
    category_slug: "end-of-life-services",
    subcategory_name: "Hospice & Palliative Care",
    short_description: "Atrium Health hospice and palliative services serving Mecklenburg and surrounding counties. Veteran-specific care coordination.",
    website_url: "https://atriumhealth.org/medical-services/specialty-care/cancer-care/supportive-care",
    phone: "704-446-0900",
    city: "Charlotte",
    zip: "28203",
    latitude: 35.2055,
    longitude: -80.8413,
    eligibility: "Patients with terminal illness",
    source_name: "Atrium Health",
    source_type: "nonprofit",
  },
  {
    title: "NC State Bar Wills for Heroes Project",
    category_slug: "end-of-life-services",
    subcategory_name: "Wills, Estate Planning & Probate",
    short_description: "Free wills, healthcare powers of attorney, and living wills for first responders and military service members across NC, prepared by volunteer attorneys.",
    website_url: "https://www.willsforheroes.org",
    phone: "919-828-4620",
    city: "Cary",
    state: "NC",
    eligibility: "Active military, veterans, first responders",
    source_name: "Wills for Heroes Foundation / NC State Bar",
    source_type: "nonprofit",
  },
  {
    title: "Carolina Caring (Catawba Valley Hospice)",
    category_slug: "end-of-life-services",
    subcategory_name: "Hospice & Palliative Care",
    short_description: "Hospice, palliative care, and grief services across the Catawba Valley and western Piedmont. We Honor Veterans Level 4 partner.",
    website_url: "https://www.carolinacaring.org",
    phone: "828-466-0466",
    address: "3975 Robinson Road",
    city: "Newton",
    zip: "28658",
    latitude: 35.6664,
    longitude: -81.2218,
    eligibility: "Patients with terminal illness",
    source_name: "Carolina Caring",
    source_type: "nonprofit",
  },

  // ============================================================
  // WELLNESS & RECOVERY (substance-recovery) — 12 rows
  // ============================================================
  {
    title: "Salisbury VA Substance Use Disorder Program",
    category_slug: "substance-recovery",
    subcategory_name: "Substance Abuse Treatment",
    short_description: "Outpatient and intensive outpatient SUD treatment, medication-assisted treatment, and dual diagnosis care at Salisbury VAMC.",
    website_url: "https://www.va.gov/salisbury-health-care/programs/mental-health/",
    phone: "704-638-9000",
    address: "1601 Brenner Avenue",
    city: "Salisbury",
    zip: "28144",
    latitude: 35.6688,
    longitude: -80.4744,
    eligibility: "Enrolled VA veterans",
    source_name: "U.S. Department of Veterans Affairs",
    source_type: "facility",
  },
  {
    title: "Durham VA Substance Use Disorder Program",
    category_slug: "substance-recovery",
    subcategory_name: "Substance Abuse Treatment",
    short_description: "Outpatient SUD, MAT, residential rehabilitation referrals at Durham VAMC. Dual diagnosis treatment available.",
    website_url: "https://www.va.gov/durham-health-care/programs/mental-health/",
    phone: "919-286-0411",
    address: "508 Fulton Street",
    city: "Durham",
    zip: "27705",
    latitude: 36.0167,
    longitude: -78.9275,
    eligibility: "Enrolled VA veterans",
    source_name: "U.S. Department of Veterans Affairs",
    source_type: "facility",
  },
  {
    title: "Asheville VA Substance Use Disorder Program",
    category_slug: "substance-recovery",
    subcategory_name: "Substance Abuse Treatment",
    short_description: "Outpatient SUD treatment, MAT, and dual diagnosis care at Charles George VAMC Asheville.",
    website_url: "https://www.va.gov/asheville-health-care/programs/mental-health/",
    phone: "828-298-7911",
    address: "1100 Tunnel Road",
    city: "Asheville",
    zip: "28805",
    latitude: 35.5793,
    longitude: -82.4762,
    eligibility: "Enrolled VA veterans",
    source_name: "U.S. Department of Veterans Affairs",
    source_type: "facility",
  },
  {
    title: "Fayetteville VA Substance Use Disorder Program",
    category_slug: "substance-recovery",
    subcategory_name: "Substance Abuse Treatment",
    short_description: "Outpatient SUD, MAT, and dual diagnosis treatment at Fayetteville VAMC serving Fort Liberty community veterans.",
    website_url: "https://www.va.gov/fayetteville-coastal-health-care/programs/mental-health/",
    phone: "910-488-2120",
    address: "2300 Ramsey Street",
    city: "Fayetteville",
    zip: "28301",
    latitude: 35.0967,
    longitude: -78.8718,
    eligibility: "Enrolled VA veterans",
    source_name: "U.S. Department of Veterans Affairs",
    source_type: "facility",
  },
  {
    title: "TROSA — Long-Term Residential Recovery (Durham)",
    category_slug: "substance-recovery",
    subcategory_name: "Substance Abuse Treatment",
    short_description: "Free 2-year residential substance use recovery program with vocational training, education, and life skills. Veterans accepted.",
    website_url: "https://www.trosainc.org",
    phone: "919-419-1059",
    address: "1820 James Street",
    city: "Durham",
    zip: "27707",
    latitude: 35.9614,
    longitude: -78.9192,
    eligibility: "Adults with SUD, including veterans",
    source_name: "Triangle Residential Options for Substance Abusers",
    source_type: "nonprofit",
  },
  {
    title: "Healing Transitions (Raleigh)",
    category_slug: "substance-recovery",
    subcategory_name: "Substance Abuse Treatment",
    short_description: "Peer-based, non-medical recovery program for adults with SUD. Free residential and non-residential programs in Raleigh. Veterans served.",
    website_url: "https://healing-transitions.org",
    phone: "919-838-9800",
    address: "1251 Goode Street",
    city: "Raleigh",
    zip: "27603",
    latitude: 35.7574,
    longitude: -78.6539,
    eligibility: "Adults with SUD",
    source_name: "Healing Transitions",
    source_type: "nonprofit",
  },
  {
    title: "McLeod Addictive Disease Center (Charlotte)",
    category_slug: "substance-recovery",
    subcategory_name: "Substance Abuse Treatment",
    short_description: "Outpatient SUD treatment, MAT (methadone, buprenorphine), and counseling across Charlotte metro. Veteran-friendly.",
    website_url: "https://mcleodcenter.com",
    phone: "704-332-9001",
    address: "1041 Hawthorne Lane",
    city: "Charlotte",
    zip: "28205",
    latitude: 35.2143,
    longitude: -80.8160,
    eligibility: "Adults with SUD",
    source_name: "McLeod Addictive Disease Center",
    source_type: "nonprofit",
  },
  {
    title: "Pavillon Treatment Center (Mill Spring)",
    category_slug: "substance-recovery",
    subcategory_name: "Inpatient / Outpatient Treatment",
    short_description: "Inpatient and intensive outpatient addiction treatment in western NC. Accepts TRICARE for active-duty/veterans.",
    website_url: "https://www.pavillon.org",
    phone: "877-694-9982",
    address: "241 Pavillon Place",
    city: "Mill Spring",
    zip: "28756",
    latitude: 35.3593,
    longitude: -82.1782,
    eligibility: "Adults with SUD",
    source_name: "Pavillon",
    source_type: "nonprofit",
  },
  {
    title: "Insight Human Services (Winston-Salem)",
    category_slug: "substance-recovery",
    subcategory_name: "Substance Abuse Treatment",
    short_description: "Outpatient SUD treatment, MAT, prevention services, and counseling in Forsyth County and surrounding areas. Veteran-friendly.",
    website_url: "https://www.insighths.org",
    phone: "336-725-8389",
    address: "665 W 4th Street",
    city: "Winston-Salem",
    zip: "27101",
    latitude: 36.0986,
    longitude: -80.2530,
    eligibility: "Adults with SUD",
    source_name: "Insight Human Services",
    source_type: "nonprofit",
  },
  {
    title: "Walter B. Jones ADATC (Greenville)",
    category_slug: "substance-recovery",
    subcategory_name: "Inpatient / Outpatient Treatment",
    short_description: "State alcohol and drug abuse treatment center serving eastern NC. Inpatient detox, residential treatment, and continuing care. Veterans accepted.",
    website_url: "https://www.ncdhhs.gov/divisions/dsohf/walter-b-jones-adatc",
    phone: "252-830-3426",
    address: "2577 W 5th Street",
    city: "Greenville",
    zip: "27834",
    latitude: 35.6021,
    longitude: -77.4147,
    eligibility: "NC adults with SUD",
    source_name: "NC Division of State Operated Healthcare Facilities",
    source_type: "government",
  },
  {
    title: "RHA Health Services — Veteran SUD Programs (NC)",
    category_slug: "substance-recovery",
    subcategory_name: "Substance Abuse Treatment",
    short_description: "Behavioral health and SUD services across multiple NC counties. Outpatient, MAT, mobile crisis, and recovery support. Veterans served.",
    website_url: "https://www.rhahealthservices.org",
    phone: "877-369-6420",
    city: "Asheville",
    state: "NC",
    eligibility: "Adults with SUD or behavioral health needs",
    source_name: "RHA Health Services",
    source_type: "nonprofit",
  },
  {
    title: "Carolina Outreach (Durham/Triangle)",
    category_slug: "substance-recovery",
    subcategory_name: "Substance Abuse Treatment",
    short_description: "SUD treatment, peer recovery, ACTT, and behavioral health services across the Triangle and central NC. Veteran-friendly providers.",
    website_url: "https://www.carolinaoutreach.com",
    phone: "919-251-9009",
    address: "3500 Westgate Drive",
    city: "Durham",
    zip: "27707",
    latitude: 35.9495,
    longitude: -78.9683,
    eligibility: "Adults with SUD or behavioral health needs",
    source_name: "Carolina Outreach",
    source_type: "nonprofit",
  },

  // ============================================================
  // FOOD ASSISTANCE (12)
  // ============================================================
  {
    title: "Food Bank of Central & Eastern North Carolina",
    category_slug: "food-assistance",
    subcategory_name: "Food Banks",
    short_description: "Largest food bank in NC. Serves 34 counties through 800+ partner agencies. Veteran-specific distribution sites and SNAP enrollment assistance.",
    website_url: "https://foodbankcenc.org",
    phone: "919-875-0707",
    address: "1924 Capital Boulevard",
    city: "Raleigh",
    zip: "27604",
    latitude: 35.8164,
    longitude: -78.6181,
    eligibility: "Food-insecure households",
    source_name: "Food Bank of Central & Eastern NC",
    source_type: "nonprofit",
  },
  {
    title: "Second Harvest Food Bank of Northwest NC",
    category_slug: "food-assistance",
    subcategory_name: "Food Banks",
    short_description: "Food bank serving 18 counties in northwest NC through 470+ partner agencies. Mobile pantry serves veterans, seniors, and rural communities.",
    website_url: "https://www.secondharvestnwnc.org",
    phone: "336-784-5770",
    address: "3655 Reed Street",
    city: "Winston-Salem",
    zip: "27107",
    latitude: 36.0399,
    longitude: -80.2207,
    eligibility: "Food-insecure households",
    source_name: "Second Harvest Food Bank of NW NC",
    source_type: "nonprofit",
  },
  {
    title: "Second Harvest Food Bank of Metrolina (Charlotte)",
    category_slug: "food-assistance",
    subcategory_name: "Food Banks",
    short_description: "Food bank serving 14 counties in NC and 5 in SC through 700+ partner agencies. Mobile pantry and veteran-targeted distributions.",
    website_url: "https://www.secondharvestmetrolina.org",
    phone: "704-376-1785",
    address: "500 B Spratt Street",
    city: "Charlotte",
    zip: "28206",
    latitude: 35.2425,
    longitude: -80.8275,
    eligibility: "Food-insecure households",
    source_name: "Second Harvest Food Bank of Metrolina",
    source_type: "nonprofit",
  },
  {
    title: "MANNA FoodBank (Western NC)",
    category_slug: "food-assistance",
    subcategory_name: "Food Banks",
    short_description: "Food bank serving 16 counties in western NC through 200+ partner agencies. Veteran outreach and mobile distributions.",
    website_url: "https://www.mannafoodbank.org",
    phone: "828-299-3663",
    address: "627 Swannanoa River Road",
    city: "Asheville",
    zip: "28805",
    latitude: 35.5793,
    longitude: -82.5114,
    eligibility: "Food-insecure households",
    source_name: "MANNA FoodBank",
    source_type: "nonprofit",
  },
  {
    title: "Food Bank of the Albemarle (Northeastern NC)",
    category_slug: "food-assistance",
    subcategory_name: "Food Banks",
    short_description: "Food bank serving 15 counties in northeastern NC through 100+ partner agencies. Coast Guard and military community served.",
    website_url: "https://www.afoodbank.org",
    phone: "252-335-4035",
    address: "PO Box 1704, 215 South Hughes Boulevard",
    city: "Elizabeth City",
    zip: "27909",
    latitude: 36.2929,
    longitude: -76.2253,
    eligibility: "Food-insecure households",
    source_name: "Food Bank of the Albemarle",
    source_type: "nonprofit",
  },
  {
    title: "Inter-Faith Food Shuttle (Triangle)",
    category_slug: "food-assistance",
    subcategory_name: "Food Pantries",
    short_description: "Food rescue and distribution in 7-county Triangle region. Backpack Buddies, mobile pantries, BackPack for Vets program.",
    website_url: "https://foodshuttle.org",
    phone: "919-250-0043",
    address: "1001 Blair Drive",
    city: "Raleigh",
    zip: "27603",
    latitude: 35.7464,
    longitude: -78.6627,
    eligibility: "Food-insecure households",
    source_name: "Inter-Faith Food Shuttle",
    source_type: "nonprofit",
  },
  {
    title: "NC SNAP / Food and Nutrition Services",
    category_slug: "food-assistance",
    subcategory_name: "SNAP Assistance",
    short_description: "NC's federal food stamp program. Application through county Department of Social Services. Veteran outreach available.",
    website_url: "https://policies.ncdhhs.gov/divisional/social-services/food-and-nutrition-services",
    phone: "800-662-7030",
    city: "Raleigh",
    state: "NC",
    eligibility: "Income-qualifying NC residents",
    source_name: "NC Department of Health & Human Services",
    source_type: "government",
  },
  {
    title: "NC WIC (Women, Infants & Children)",
    category_slug: "food-assistance",
    subcategory_name: "Food Assistance",
    short_description: "Supplemental nutrition program for pregnant/postpartum women and children under 5. Available to military and veteran families through county health departments.",
    website_url: "https://www.nutritionnc.com/wic/",
    phone: "800-367-2229",
    city: "Raleigh",
    state: "NC",
    eligibility: "Income-eligible women, infants, children under 5",
    source_name: "NC Department of Health & Human Services",
    source_type: "government",
  },
  {
    title: "Loaves & Fishes / Friendship Trays (Charlotte)",
    category_slug: "food-assistance",
    subcategory_name: "Food Pantries",
    short_description: "Network of food pantries across Mecklenburg County and home-delivered meals for homebound seniors and veterans.",
    website_url: "https://www.loavesandfishes.org",
    phone: "704-523-4333",
    address: "648-A Griffith Road",
    city: "Charlotte",
    zip: "28217",
    latitude: 35.1820,
    longitude: -80.8835,
    eligibility: "Food-insecure households",
    source_name: "Loaves & Fishes / Friendship Trays",
    source_type: "nonprofit",
  },
  {
    title: "Salvation Army Food Programs — North Carolina",
    category_slug: "food-assistance",
    subcategory_name: "Food Pantries",
    short_description: "Statewide food pantries and meal programs through Salvation Army corps in Charlotte, Greensboro, Raleigh, Fayetteville, Wilmington, and other NC cities.",
    website_url: "https://southernusa.salvationarmy.org",
    phone: "704-348-2541",
    city: "Charlotte",
    state: "NC",
    eligibility: "Food-insecure households",
    source_name: "The Salvation Army",
    source_type: "nonprofit",
  },
  {
    title: "Cumberland Community Action Program — Veteran Food Programs",
    category_slug: "food-assistance",
    subcategory_name: "Food Pantries",
    short_description: "Food pantry, senior nutrition, and emergency food assistance for low-income households in Cumberland County (Fort Liberty community).",
    website_url: "https://www.ccap-inc.org",
    phone: "910-485-6131",
    address: "316 Green Street",
    city: "Fayetteville",
    zip: "28301",
    latitude: 35.0561,
    longitude: -78.8788,
    eligibility: "Income-eligible Cumberland County residents",
    source_name: "Cumberland Community Action Program",
    source_type: "nonprofit",
  },
  {
    title: "Catholic Charities Food Programs (NC Dioceses)",
    category_slug: "food-assistance",
    subcategory_name: "Food Pantries",
    short_description: "Food pantries and emergency assistance through Catholic Charities of the Diocese of Raleigh and Diocese of Charlotte. Veterans welcomed.",
    website_url: "https://catholiccharitiesraleigh.org",
    phone: "919-790-8533",
    address: "7200 Stonehenge Drive",
    city: "Raleigh",
    zip: "27613",
    latitude: 35.8983,
    longitude: -78.6800,
    eligibility: "Income-eligible households",
    source_name: "Catholic Charities Diocese of Raleigh",
    source_type: "nonprofit",
  },

  // ============================================================
  // FINANCIAL & CREDIT (slug: financial) — 10 rows
  // ============================================================
  {
    title: "Veterans Bridge Home — Financial Coaching (Charlotte)",
    category_slug: "financial",
    subcategory_name: "Career Pathways",
    short_description: "Free financial coaching for veterans and military families across the Charlotte region. Budgeting, debt management, emergency assistance referrals.",
    website_url: "https://www.veteransbridgehome.org",
    phone: "704-332-2002",
    address: "1235 East Boulevard, Suite E",
    city: "Charlotte",
    zip: "28203",
    latitude: 35.2050,
    longitude: -80.8470,
    eligibility: "Veterans and military families",
    source_name: "Veterans Bridge Home",
    source_type: "nonprofit",
  },
  {
    title: "Self-Help Credit Union — Veteran Financial Services (NC)",
    category_slug: "financial",
    subcategory_name: "Career Pathways",
    short_description: "CDFI credit union with branches across NC. Affordable loans, free financial coaching, foreclosure prevention, second-chance banking. Veteran-friendly.",
    website_url: "https://www.self-help.org",
    phone: "800-966-7353",
    address: "301 W Main Street",
    city: "Durham",
    zip: "27701",
    latitude: 35.9979,
    longitude: -78.9034,
    eligibility: "Open to all (CDFI mission)",
    source_name: "Self-Help Credit Union",
    source_type: "nonprofit",
  },
  {
    title: "Latino Community Credit Union — Financial Coaching (NC)",
    category_slug: "financial",
    subcategory_name: "Career Pathways",
    short_description: "CDFI credit union serving NC with branches in Durham, Charlotte, Raleigh, Greensboro, Winston-Salem. Free financial education and bilingual services. Veterans served.",
    website_url: "https://www.latinoccu.org",
    phone: "888-839-8328",
    address: "201 W Main Street, Suite 100",
    city: "Durham",
    zip: "27701",
    latitude: 35.9963,
    longitude: -78.9050,
    eligibility: "Open to all (CDFI mission)",
    source_name: "Latino Community Credit Union",
    source_type: "nonprofit",
  },
  {
    title: "Consumer Credit Counseling Service of Forsyth County",
    category_slug: "financial",
    subcategory_name: "Career Pathways",
    short_description: "Nonprofit credit counseling, debt management plans, bankruptcy counseling, and housing counseling in Winston-Salem and surrounding areas. Veteran-friendly.",
    website_url: "https://www.familyserviceforsyth.org",
    phone: "336-722-8173",
    address: "1200 S Broad Street",
    city: "Winston-Salem",
    zip: "27101",
    latitude: 36.0856,
    longitude: -80.2462,
    eligibility: "Adults needing financial counseling",
    source_name: "Family Services Inc.",
    source_type: "nonprofit",
  },
  {
    title: "OnTrack Financial Education & Counseling (Asheville)",
    category_slug: "financial",
    subcategory_name: "Career Pathways",
    short_description: "Nonprofit financial counseling, HUD-certified housing counseling, bankruptcy counseling, and student loan help in western NC. Veterans served.",
    website_url: "https://www.ontrackwnc.org",
    phone: "828-255-5166",
    address: "50 S French Broad Avenue",
    city: "Asheville",
    zip: "28801",
    latitude: 35.5926,
    longitude: -82.5602,
    eligibility: "Adults needing financial counseling",
    source_name: "OnTrack WNC",
    source_type: "nonprofit",
  },
  {
    title: "NCDMVA Financial Hardship Assistance",
    category_slug: "financial",
    subcategory_name: "Career Pathways",
    short_description: "Connections to emergency financial assistance for NC veterans through county VSOs. Referrals to NC Bar Foundation, Operation Homefront, and similar grants.",
    website_url: "https://www.milvets.nc.gov/services",
    phone: "844-624-8387",
    address: "4001 Mail Service Center",
    city: "Raleigh",
    zip: "27699",
    latitude: 35.7706,
    longitude: -78.6383,
    eligibility: "NC veterans facing financial hardship",
    source_name: "NC Department of Military and Veterans Affairs",
    source_type: "government",
  },
  {
    title: "Coalition Mortgage Group — VA Loan Specialists (Triangle)",
    category_slug: "financial",
    subcategory_name: "Career Pathways",
    short_description: "VA home loan specialists serving NC veterans. Refinance, IRRRL, and purchase loans with no down payment for eligible veterans.",
    website_url: "https://www.va.gov/housing-assistance/home-loans/",
    phone: "844-698-2311",
    city: "Raleigh",
    state: "NC",
    eligibility: "VA loan-eligible veterans",
    source_name: "U.S. Department of Veterans Affairs",
    source_type: "service",
  },
  {
    title: "Truliant Federal Credit Union — Veteran Programs (NC)",
    category_slug: "financial",
    subcategory_name: "Career Pathways",
    short_description: "Credit union with 30+ NC branches. Veteran-specific lending products, free financial coaching, and first-time homebuyer programs.",
    website_url: "https://www.truliantfcu.org",
    phone: "800-822-0382",
    address: "3200 Truliant Way",
    city: "Winston-Salem",
    zip: "27103",
    latitude: 36.0567,
    longitude: -80.2884,
    eligibility: "Members (eligibility includes veterans)",
    source_name: "Truliant Federal Credit Union",
    source_type: "nonprofit",
  },
  {
    title: "Sandhills Community Action Program — Financial Help",
    category_slug: "financial",
    subcategory_name: "Career Pathways",
    short_description: "Emergency financial assistance, energy assistance (LIEAP/CIP), and budget counseling for low-income households in Moore, Hoke, Lee, and Montgomery counties.",
    website_url: "https://www.sandhillscap.org",
    phone: "910-947-5675",
    address: "302 Saunders Street",
    city: "Carthage",
    zip: "28327",
    latitude: 35.3438,
    longitude: -79.4172,
    eligibility: "Income-eligible Sandhills-area residents",
    source_name: "Sandhills Community Action Program",
    source_type: "nonprofit",
  },
  {
    title: "NC State Treasurer Retirement Systems — Military Service Credit",
    category_slug: "financial",
    subcategory_name: "Career Pathways",
    short_description: "NC state employees and teachers can purchase military service credit toward state pension. Veterans verify eligibility through Retirement Systems Division.",
    website_url: "https://www.myncretirement.com/military-service-credit",
    phone: "877-627-3287",
    address: "3200 Atlantic Avenue",
    city: "Raleigh",
    zip: "27604",
    latitude: 35.8338,
    longitude: -78.6086,
    eligibility: "NC state employees with military service",
    source_name: "NC Department of State Treasurer",
    source_type: "government",
  },

  // ============================================================
  // TRANSPORTATION (10)
  // ============================================================
  {
    title: "DAV Veterans Transportation — Salisbury VAMC",
    category_slug: "transportation",
    subcategory_name: "VA Medical Transport",
    short_description: "Free DAV-operated van transportation to medical appointments at Salisbury VAMC. Volunteer drivers serve surrounding NC counties.",
    website_url: "https://www.va.gov/salisbury-health-care/locations/salisbury-va-medical-center/",
    phone: "704-638-9000",
    address: "1601 Brenner Avenue",
    city: "Salisbury",
    zip: "28144",
    latitude: 35.6688,
    longitude: -80.4744,
    eligibility: "VA-enrolled veterans",
    source_name: "Disabled American Veterans (DAV) / VA Salisbury",
    source_type: "service",
  },
  {
    title: "DAV Veterans Transportation — Durham VAMC",
    category_slug: "transportation",
    subcategory_name: "VA Medical Transport",
    short_description: "Free DAV-operated van transportation to medical appointments at Durham VAMC. Volunteer drivers serve Triangle and surrounding NC counties.",
    website_url: "https://www.va.gov/durham-health-care/",
    phone: "919-286-0411",
    address: "508 Fulton Street",
    city: "Durham",
    zip: "27705",
    latitude: 36.0167,
    longitude: -78.9275,
    eligibility: "VA-enrolled veterans",
    source_name: "Disabled American Veterans (DAV) / VA Durham",
    source_type: "service",
  },
  {
    title: "DAV Veterans Transportation — Asheville VAMC",
    category_slug: "transportation",
    subcategory_name: "VA Medical Transport",
    short_description: "Free DAV-operated van transportation to medical appointments at Charles George VAMC Asheville. Volunteer drivers serve western NC counties.",
    website_url: "https://www.va.gov/asheville-health-care/",
    phone: "828-298-7911",
    address: "1100 Tunnel Road",
    city: "Asheville",
    zip: "28805",
    latitude: 35.5793,
    longitude: -82.4762,
    eligibility: "VA-enrolled veterans",
    source_name: "Disabled American Veterans (DAV) / VA Asheville",
    source_type: "service",
  },
  {
    title: "DAV Veterans Transportation — Fayetteville VAMC",
    category_slug: "transportation",
    subcategory_name: "VA Medical Transport",
    short_description: "Free DAV-operated van transportation to medical appointments at Fayetteville VAMC. Volunteer drivers serve Cumberland and surrounding counties.",
    website_url: "https://www.va.gov/fayetteville-coastal-health-care/",
    phone: "910-488-2120",
    address: "2300 Ramsey Street",
    city: "Fayetteville",
    zip: "28301",
    latitude: 35.0967,
    longitude: -78.8718,
    eligibility: "VA-enrolled veterans",
    source_name: "Disabled American Veterans (DAV) / VA Fayetteville",
    source_type: "service",
  },
  {
    title: "VA Beneficiary Travel Program (NC)",
    category_slug: "transportation",
    subcategory_name: "VA Medical Transport",
    short_description: "VA reimbursement for travel costs to/from VA medical appointments for eligible veterans. Mileage reimbursement and special transportation.",
    website_url: "https://www.va.gov/health-care/get-reimbursed-for-travel-pay/",
    phone: "855-574-7292",
    state: "NC",
    eligibility: "Service-connected veterans, low-income veterans, and certain others",
    source_name: "U.S. Department of Veterans Affairs",
    source_type: "program",
  },
  {
    title: "GoTriangle Reduced Fare Program (Triangle)",
    category_slug: "transportation",
    subcategory_name: "Public Transit Assistance",
    short_description: "Half-fare transit program across the Triangle (Raleigh, Durham, Cary, RTP) for seniors, disabled riders, and disabled veterans.",
    website_url: "https://gotriangle.org/discount-fares",
    phone: "919-485-7433",
    address: "4600 Emperor Boulevard, Suite 100",
    city: "Durham",
    zip: "27703",
    latitude: 35.8989,
    longitude: -78.8540,
    eligibility: "Seniors, disabled, disabled veterans",
    source_name: "GoTriangle / Research Triangle Regional Public Transportation Authority",
    source_type: "government",
  },
  {
    title: "Charlotte Area Transit System (CATS) Reduced Fare for Veterans",
    category_slug: "transportation",
    subcategory_name: "Public Transit Assistance",
    short_description: "Reduced fare transit across Charlotte and Mecklenburg County for disabled veterans and Medicare cardholders.",
    website_url: "https://www.ridetransit.org",
    phone: "704-336-7433",
    address: "600 E 4th Street",
    city: "Charlotte",
    zip: "28202",
    latitude: 35.2233,
    longitude: -80.8413,
    eligibility: "Disabled veterans, seniors, Medicare cardholders",
    source_name: "Charlotte Area Transit System",
    source_type: "government",
  },
  {
    title: "GoRaleigh ACCESS Paratransit",
    category_slug: "transportation",
    subcategory_name: "Non-Emergency Medical Transport",
    short_description: "ADA-compliant paratransit service for disabled riders in Raleigh including disabled veterans. Curb-to-curb service.",
    website_url: "https://goraleigh.org/access",
    phone: "919-996-3459",
    address: "4104 Poole Road",
    city: "Raleigh",
    zip: "27610",
    latitude: 35.7676,
    longitude: -78.5648,
    eligibility: "ADA-eligible riders including disabled veterans",
    source_name: "GoRaleigh / City of Raleigh",
    source_type: "government",
  },
  {
    title: "NCDOT Public Transit Division — Rural Veterans Transportation",
    category_slug: "transportation",
    subcategory_name: "Veteran Transportation Programs",
    short_description: "NCDOT-administered Section 5310 program funds rural transit for seniors, disabled, and veterans across NC's rural counties.",
    website_url: "https://www.ncdot.gov/divisions/integrated-mobility",
    phone: "919-707-4670",
    address: "1550 Mail Service Center",
    city: "Raleigh",
    zip: "27699",
    latitude: 35.7796,
    longitude: -78.6391,
    eligibility: "Rural seniors, disabled, veterans",
    source_name: "NC Department of Transportation",
    source_type: "government",
  },
  {
    title: "Onslow United Transit System (OUTS) — Veteran Programs",
    category_slug: "transportation",
    subcategory_name: "Veteran Transportation Programs",
    short_description: "County transit serving Onslow County with reduced/free fares for veterans and senior services. Camp Lejeune community served.",
    website_url: "https://www.outsbus.com",
    phone: "910-455-2773",
    address: "1213 Hargett Street",
    city: "Jacksonville",
    zip: "28540",
    latitude: 34.7541,
    longitude: -77.4302,
    eligibility: "Onslow County residents (special programs for veterans/seniors)",
    source_name: "Onslow United Transit System",
    source_type: "government",
  },

  // ============================================================
  // FAMILY SUPPORT (10)
  // ============================================================
  {
    title: "Fort Liberty Army Community Service (ACS)",
    category_slug: "family-support",
    subcategory_name: "Military Family Support",
    short_description: "Family support, financial readiness, employment readiness, relocation assistance, and Survivor Outreach Services for Fort Liberty soldiers and families.",
    website_url: "https://liberty.armymwr.com/programs/army-community-service",
    phone: "910-396-8682",
    address: "Building 4-2843, Normandy Drive",
    city: "Fort Liberty",
    zip: "28310",
    latitude: 35.1395,
    longitude: -78.9994,
    eligibility: "Active-duty soldiers, family members, retirees, DA civilians",
    source_name: "U.S. Army Garrison Fort Liberty",
    source_type: "government",
  },
  {
    title: "Camp Lejeune Marine Corps Family Team Building (MCFTB)",
    category_slug: "family-support",
    subcategory_name: "Military Family Support",
    short_description: "Family readiness, deployment support, Lifestyle Insights Networking Knowledge Skills (LINKS) training, and key volunteer support for Camp Lejeune Marine families.",
    website_url: "https://www.lejeune.marines.mil/Offices-Staff/Marine-Family-Programs/MCFTB/",
    phone: "910-451-0176",
    address: "Building 1, Camp Lejeune",
    city: "Jacksonville",
    zip: "28547",
    latitude: 34.6878,
    longitude: -77.3528,
    eligibility: "Marine Corps families, active-duty Marines",
    source_name: "Marine Corps Community Services Camp Lejeune",
    source_type: "government",
  },
  {
    title: "MCAS Cherry Point Family Readiness",
    category_slug: "family-support",
    subcategory_name: "Military Family Support",
    short_description: "Family programs, deployment readiness, exceptional family member program, and resource referrals at Marine Corps Air Station Cherry Point.",
    website_url: "https://www.cherrypoint.marines.mil",
    phone: "252-466-4201",
    address: "Building 4335",
    city: "Cherry Point",
    zip: "28533",
    latitude: 34.9056,
    longitude: -76.8867,
    eligibility: "Marine Corps families, active-duty Marines",
    source_name: "Marine Corps Community Services Cherry Point",
    source_type: "government",
  },
  {
    title: "USO of NC — Statewide Centers",
    category_slug: "family-support",
    subcategory_name: "Military Family Support",
    short_description: "USO centers across NC supporting service members and families: Fort Liberty, Camp Lejeune, RDU Airport, Charlotte Airport. Programs, snacks, lounges, family events.",
    website_url: "https://www.uso.org/locations/north-carolina/uso-of-north-carolina",
    phone: "919-840-9148",
    address: "1025 W NC Highway 54, Suite 102",
    city: "Durham",
    zip: "27713",
    latitude: 35.9012,
    longitude: -78.9356,
    eligibility: "Service members and families",
    source_name: "USO of North Carolina",
    source_type: "nonprofit",
  },
  {
    title: "NC Survivor Outreach Services (Fort Liberty)",
    category_slug: "family-support",
    subcategory_name: "Gold Star Family Support",
    short_description: "Long-term support for families of fallen service members. Casework, benefits coordination, peer support, and family events at Fort Liberty.",
    website_url: "https://liberty.armymwr.com/programs/survivor-outreach-services",
    phone: "910-396-3905",
    address: "Soldier Support Center, Building 4-2843",
    city: "Fort Liberty",
    zip: "28310",
    latitude: 35.1395,
    longitude: -78.9994,
    eligibility: "Surviving family members of fallen service members",
    source_name: "U.S. Army Survivor Outreach Services",
    source_type: "government",
  },
  {
    title: "Blue Star Families — Fort Liberty Chapter",
    category_slug: "family-support",
    subcategory_name: "Military Family Support",
    short_description: "Local Fort Liberty chapter of Blue Star Families. Community events, deployment support, and connection programs for active-duty and veteran families.",
    website_url: "https://bluestarfam.org/chapter/fayetteville/",
    phone: "202-630-2583",
    city: "Fayetteville",
    state: "NC",
    eligibility: "Military and veteran families",
    source_name: "Blue Star Families",
    source_type: "nonprofit",
  },
  {
    title: "Fort Liberty Child & Youth Services (CYS)",
    category_slug: "family-support",
    subcategory_name: "Childcare Assistance",
    short_description: "Comprehensive childcare, school-age programs, and youth activities for Fort Liberty children. Subsidized care and SKIES Unlimited classes.",
    website_url: "https://liberty.armymwr.com/programs/child-youth-services",
    phone: "910-396-8110",
    city: "Fort Liberty",
    zip: "28310",
    latitude: 35.1395,
    longitude: -78.9994,
    eligibility: "Children of military and DA civilian families",
    source_name: "U.S. Army Garrison Fort Liberty",
    source_type: "government",
  },
  {
    title: "Camp Lejeune Children, Youth & Teen Programs (CYTP)",
    category_slug: "family-support",
    subcategory_name: "Childcare Assistance",
    short_description: "Childcare, school-age care, teen center, and youth sports for Camp Lejeune Marine families. Subsidized care available.",
    website_url: "https://mccslejeune-newriver.com/cytp/",
    phone: "910-449-9430",
    city: "Jacksonville",
    zip: "28547",
    latitude: 34.6878,
    longitude: -77.3528,
    eligibility: "Children of military and DoD civilian families",
    source_name: "Marine Corps Community Services Camp Lejeune",
    source_type: "government",
  },
  {
    title: "NC Gold Star Mothers",
    category_slug: "family-support",
    subcategory_name: "Gold Star Family Support",
    short_description: "Statewide chapter of American Gold Star Mothers serving NC mothers who have lost a child in military service. Peer support, advocacy, remembrance events.",
    website_url: "https://www.goldstarmoms.com",
    state: "NC",
    eligibility: "Mothers of fallen service members",
    source_name: "American Gold Star Mothers Inc.",
    source_type: "nonprofit",
  },
  {
    title: "Fisher House Foundation — Durham VAMC",
    category_slug: "family-support",
    subcategory_name: "Military Family Support",
    short_description: "Free lodging for families of veterans receiving care at Durham VAMC. Comfort home with private suites for traveling military families.",
    website_url: "https://fisherhouse.org/programs/houses/house-locations/durham-fisher-house/",
    phone: "919-286-6815",
    address: "508 Fulton Street, Building 16",
    city: "Durham",
    zip: "27705",
    latitude: 36.0167,
    longitude: -78.9275,
    eligibility: "Families of veterans receiving care at Durham VAMC",
    source_name: "Fisher House Foundation",
    source_type: "nonprofit",
  },

  // ============================================================
  // INSURANCE (5)
  // ============================================================
  {
    title: "NC SHIIP — Seniors' Health Insurance Information Program",
    category_slug: "insurance",
    short_description: "Free unbiased Medicare counseling for NC seniors and disabled adults including veterans. Help with Medicare, Medigap, Part D, and Medicare Advantage decisions.",
    website_url: "https://www.ncdoi.gov/consumers/medicare-and-seniors-health-insurance-information-program-shiip",
    phone: "855-408-1212",
    address: "1201 Mail Service Center",
    city: "Raleigh",
    zip: "27699",
    latitude: 35.7706,
    longitude: -78.6383,
    eligibility: "NC Medicare beneficiaries",
    source_name: "NC Department of Insurance",
    source_type: "government",
  },
  {
    title: "NC State Health Plan — Retired Veteran Coverage",
    category_slug: "insurance",
    short_description: "Health coverage options for NC state retirees including veterans who served as state employees. Coordinates with Medicare and TRICARE.",
    website_url: "https://www.shpnc.org",
    phone: "855-859-0966",
    address: "3200 Atlantic Avenue",
    city: "Raleigh",
    zip: "27604",
    latitude: 35.8338,
    longitude: -78.6086,
    eligibility: "NC state retirees",
    source_name: "NC State Health Plan",
    source_type: "government",
  },
  {
    title: "NC Department of Insurance — Military Consumer Protection",
    category_slug: "insurance",
    short_description: "Consumer protection for NC military families and veterans. Complaints against insurers, policy reviews, fraud reporting, SCRA enforcement assistance.",
    website_url: "https://www.ncdoi.gov",
    phone: "855-408-1212",
    address: "1201 Mail Service Center",
    city: "Raleigh",
    zip: "27699",
    latitude: 35.7706,
    longitude: -78.6383,
    eligibility: "NC residents including military and veterans",
    source_name: "NC Department of Insurance",
    source_type: "government",
  },
  {
    title: "TRICARE Region East — NC Provider Network",
    category_slug: "insurance",
    short_description: "TRICARE health plans (Prime, Select, Reserve Select, Retired Reserve, Young Adult) for active-duty, retirees, and families across NC. Humana Military administers Region East.",
    website_url: "https://www.humanamilitary.com",
    phone: "800-444-5445",
    state: "NC",
    eligibility: "TRICARE-eligible service members, retirees, families",
    source_name: "Humana Military / Defense Health Agency",
    source_type: "service",
  },
  {
    title: "VA Insurance Service — NC Outreach (SGLI/VGLI/VALife)",
    category_slug: "insurance",
    short_description: "VA life insurance programs: Servicemembers' Group Life Insurance (SGLI), Veterans' Group Life Insurance (VGLI), and VALife for service-connected disabled veterans. NC veterans apply through VA.",
    website_url: "https://www.va.gov/life-insurance/",
    phone: "800-669-8477",
    state: "NC",
    eligibility: "Service members and veterans",
    source_name: "U.S. Department of Veterans Affairs",
    source_type: "program",
  },
];

async function loadMaps() {
  const { data: cats, error: catErr } = await supabaseAdmin.from("categories").select("id, slug");
  if (catErr || !cats) throw new Error(`Failed to load categories: ${catErr?.message}`);
  const catMap = new Map<string, string>();
  cats.forEach((c: any) => catMap.set(c.slug, c.id));

  const { data: subs, error: subErr } = await supabaseAdmin.from("subcategories").select("id, name, category_id");
  if (subErr || !subs) throw new Error(`Failed to load subcategories: ${subErr?.message}`);
  const catIdToSlug = new Map<string, string>();
  cats.forEach((c: any) => catIdToSlug.set(c.id, c.slug));
  const subMap = new Map<string, string>();
  subs.forEach((s: any) => {
    const catSlug = catIdToSlug.get(s.category_id);
    if (catSlug) subMap.set(`${catSlug}|${s.name.toLowerCase()}`, s.id);
  });

  return { catMap, subMap };
}

async function loadNationalTitles(): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from("resources")
    .select("title")
    .is("state", null);
  if (error) throw new Error(`Failed to load national rows: ${error.message}`);
  const set = new Set<string>();
  (data || []).forEach((r: any) => {
    const t = (r.title || "").toLowerCase().trim();
    if (t) set.add(t);
  });
  return set;
}

function stripStateSuffix(title: string): string {
  return title
    .replace(/\s*[—\-–]\s*(North Carolina|NC)\s*$/i, "")
    .replace(/\s*\((NC|North Carolina)[^)]*\)\s*$/i, "")
    .trim();
}

async function main() {
  console.log(`\n=== NC Resources Seed ROUND 3 — ${NC_RESOURCES.length} rows ===`);
  console.log(`(Closes 7 unbuilt categories; national-dedupe guard ACTIVE)\n`);

  const { catMap, subMap } = await loadMaps();
  const nationalTitles = await loadNationalTitles();
  console.log(`[setup] Loaded ${catMap.size} categories, ${subMap.size} subcategories, ${nationalTitles.size} national titles for dedupe guard`);

  const { data: existing } = await supabaseAdmin
    .from("resources")
    .select("title")
    .eq("state", STATE);
  const existingTitles = new Set((existing || []).map((r: any) => (r.title || "").toLowerCase().trim()));
  console.log(`[setup] Found ${existingTitles.size} existing NC rows to dedupe against\n`);

  const counts = {
    created: 0,
    duplicatesNc: 0,
    duplicatesOfNational: 0,
    errors: 0,
    subcategoryMisses: 0,
    byCategory: {} as Record<string, number>,
    bySubcategory: {} as Record<string, number>,
    errorRows: [] as { title: string; reason: string }[],
    subMissList: [] as { title: string; key: string }[],
    nationalDedupHits: [] as string[],
  };

  for (const r of NC_RESOURCES) {
    const titleKey = r.title.toLowerCase().trim();
    const strippedKey = stripStateSuffix(r.title).toLowerCase().trim();

    // GUARD 1: Don't duplicate any existing NC row
    if (existingTitles.has(titleKey)) {
      counts.duplicatesNc++;
      continue;
    }

    // GUARD 2: Don't duplicate any existing national row
    if (nationalTitles.has(titleKey) || nationalTitles.has(strippedKey)) {
      counts.duplicatesOfNational++;
      counts.nationalDedupHits.push(r.title);
      continue;
    }

    const category_id = catMap.get(r.category_slug);
    if (!category_id) {
      counts.errors++;
      counts.errorRows.push({ title: r.title, reason: `Unknown category slug: ${r.category_slug}` });
      continue;
    }

    let subcategory_id: string | null = null;
    if (r.subcategory_name) {
      subcategory_id = subMap.get(`${r.category_slug}|${r.subcategory_name.toLowerCase()}`) || null;
      if (!subcategory_id) {
        counts.subcategoryMisses++;
        counts.subMissList.push({ title: r.title, key: `${r.category_slug}|${r.subcategory_name}` });
      }
    }

    const insertRow: Record<string, any> = {
      title: r.title,
      category_id,
      short_description: r.short_description,
      website_url: r.website_url || null,
      phone: r.phone || null,
      email: r.email || null,
      address: r.address || null,
      city: r.city || null,
      state: STATE,
      zip: r.zip || null,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      geo_source: r.latitude ? "manual_curation" : null,
      geocoded_at: r.latitude ? new Date().toISOString() : null,
      eligibility: r.eligibility || "All veterans",
      subcategory: r.subcategory_name || null,
      source_name: r.source_name,
      source_type: r.source_type,
      status: r.status || "approved",
      sponsored: false,
    };

    const { data: ins, error } = await supabaseAdmin
      .from("resources")
      .insert(insertRow)
      .select("id")
      .single();

    if (error || !ins) {
      counts.errors++;
      counts.errorRows.push({ title: r.title, reason: error?.message || "Unknown insert error" });
      continue;
    }

    await supabaseAdmin
      .from("resource_categories")
      .upsert({ resource_id: ins.id, category_id }, { onConflict: "resource_id,category_id" });

    if (subcategory_id) {
      await supabaseAdmin
        .from("resource_subcategories")
        .upsert(
          { resource_id: ins.id, subcategory_id },
          { onConflict: "resource_id,subcategory_id" }
        );
    }

    counts.created++;
    counts.byCategory[r.category_slug] = (counts.byCategory[r.category_slug] || 0) + 1;
    if (r.subcategory_name) {
      counts.bySubcategory[r.subcategory_name] = (counts.bySubcategory[r.subcategory_name] || 0) + 1;
    }
    existingTitles.add(titleKey);
  }

  console.log(`\n=== ROUND 3 RESULTS ===`);
  console.log(`Total rows in script        : ${NC_RESOURCES.length}`);
  console.log(`Created                     : ${counts.created}`);
  console.log(`Duplicates of NC (skipped)  : ${counts.duplicatesNc}`);
  console.log(`Duplicates of NATIONAL (sk) : ${counts.duplicatesOfNational}`);
  console.log(`Errors                      : ${counts.errors}`);
  console.log(`Subcategory misses          : ${counts.subcategoryMisses}`);

  console.log(`\n--- By category ---`);
  Object.entries(counts.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${k.padEnd(28)} ${v}`));

  console.log(`\n--- By subcategory (top 25) ---`);
  Object.entries(counts.bySubcategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .forEach(([k, v]) => console.log(`  ${k.padEnd(45)} ${v}`));

  if (counts.nationalDedupHits.length) {
    console.log(`\n--- National dedupe guard caught ---`);
    counts.nationalDedupHits.forEach(t => console.log(`  ${t}`));
  }

  if (counts.subMissList.length) {
    console.log(`\n--- Subcategory misses ---`);
    counts.subMissList.forEach(s => console.log(`  ${s.title} -> ${s.key}`));
  }

  if (counts.errorRows.length) {
    console.log(`\n--- Errors ---`);
    counts.errorRows.forEach(e => console.log(`  ${e.title}: ${e.reason}`));
  }
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
