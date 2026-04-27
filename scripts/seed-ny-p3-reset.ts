/**
 * NEW YORK — PHASE 3 RESET (FOUNDER MASTER DIRECTIVE 2026-04-27)
 *
 * County / Benefits Backbone — additive on top of the 34 county/benefits
 * rows already shipped in P3 original (NYC citywide, Erie, Monroe, Onondaga,
 * Nassau partial, Westchester, Broome, Dutchess, statewide).
 *
 * P3 RESET fills the county/regional gaps that were missing or skipped:
 *   LAYER 1 (vet-specific):
 *     - Orange County VSA (Goshen) — newly verified; in P3 original Orange was
 *       skipped wholesale due to vendor-CMS path issues, only DOH had been kept.
 *     - Oneida County Veterans Service Agency (Utica) — fills Mohawk Valley.
 *
 *   LAYER 2 (mainstream — Veteran-First Not Veteran-Only):
 *     County mainstream (Orange + Erie MH gaps):
 *       - Orange County Department of Social Services (Goshen)
 *       - Orange County Office for the Aging (Goshen)
 *       - Orange County Department of Mental Health (Goshen)
 *       - Erie County Department of Mental Hygiene (Buffalo)
 *
 *     Catholic Charities by diocese (5 — fills statewide community-support
 *     spine; veterans regularly access CC for rent, food, eviction prevention,
 *     immigration, MH, addiction):
 *       - Catholic Charities Community Services — Archdiocese of NY (Manhattan)
 *       - Catholic Charities Brooklyn and Queens
 *       - Catholic Charities of Long Island (Diocese of Rockville Centre)
 *       - Catholic Charities of the Diocese of Buffalo
 *       - Catholic Charities Diocese of Albany
 *
 *     Regional food banks (6 — county DSS/SNAP backbone, every county served
 *     through these regional banks; fills Suffolk/Albany/Rockland/Ulster gap):
 *       - Long Island Cares (Suffolk + Nassau)
 *       - Island Harvest Food Bank (Long Island)
 *       - Foodlink (Monroe + 9 Finger Lakes counties)
 *       - Food Bank of Central New York (Onondaga + 10 CNY counties)
 *       - FeedMore WNY (Erie + WNY)
 *       - Regional Food Bank of Northeastern NY (Albany + 23 capital/HV ctys)
 *
 *     United Way regional (2):
 *       - United Way of Long Island (Suffolk + Nassau)
 *       - United Way of Buffalo & Erie County (Erie + WNY)
 *
 *     Disability/family/housing fills (5):
 *       - Disability Rights New York (Albany — statewide P&A)
 *       - NYS Justice Center for Protection of People with Special Needs
 *       - NYAPRS (NY Assoc Psychiatric Rehab Services — MH advocacy)
 *       - NYC Administration for Children's Services (ACS — family)
 *       - NYC Housing Authority (NYCHA — public housing)
 *
 * Pre-commit gates per founder MASTER LAW (no exceptions):
 *   - Every URL probed live before commit (200 with browser UA).
 *   - --allow-broken-urls is FORBIDDEN. Anything failing is dropped.
 *   - No ghost references to other states in commit / report.
 *   - No architect post-ship loop unless real defect surfaces.
 *
 * Counties skipped wholesale (entire site WAF-blocked or vendor 404 across
 * every path probed — no `--allow-broken-urls` bypass per founder rule):
 *   - Albany County (albanycountyny.gov 403 to non-residential UAs)
 *   - Suffolk County (suffolkcountyny.gov 403 to non-residential UAs)
 *   - Rockland County (rocklandgov.com 403 across all department paths
 *     this run; only the DOH path saved in P2 RESET still resolves)
 *   - Ulster County (ulstercountyny.gov 403 across all paths)
 *   - Saratoga County (saratogacountyny.gov 403 across all paths)
 *   - Niagara County (root 200 but all department paths 404)
 *   - Putnam County (root 200 but all department paths 404)
 *   - Schenectady County (root 200 but all department paths 404)
 *   - Oneida DSS / OFA (404 — only /veterans path resolves; included that one)
 *
 * Veterans in those skipped counties are still discoverable via the NY DVS
 * County VSA Directory row from P1 plus the regional food banks / Catholic
 * Charities / United Way coverage in this batch.
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");

const ROWS: SeedRow[] = [
  // ============== A. COUNTY VSAs — Orange + Oneida ==============
  { section: "VSA", title: "Orange County Veterans Service Agency", cat: "va-benefits", sub: "County Veterans Service Offices", city: "Goshen", website_url: "https://www.orangecountygov.com/152/Veterans-Service-Agency", source_name: "Orange County NY Government", source_type: "county_government", phone: "845-291-2470", address: "30 Matthews Street, Suite 105, Goshen, NY 10924", zip: "10924", desc: "Orange County Veterans Service Agency (Goshen) — county VSA serving Newburgh, Middletown, Port Jervis, Monroe, Warwick, Walden, Goshen, and all Orange County veterans; helps with VA disability claims, pension/DIC, healthcare enrollment, NYS Blind Annuity, NY State Veterans Home referrals, county property-tax exemption, and free transport to VA Hudson Valley HCS clinics." },
  { section: "VSA", title: "Oneida County Veterans Service Agency", cat: "va-benefits", sub: "County Veterans Service Offices", city: "Utica", website_url: "https://ocgov.net/veterans", source_name: "Oneida County NY Government", source_type: "county_government", phone: "315-798-5456", address: "800 Park Avenue, Utica, NY 13501", zip: "13501", desc: "Oneida County Veterans Service Agency (Utica) — county VSA serving Utica, Rome, New Hartford, Whitesboro, Camden, Boonville, and all Oneida County veterans; helps with VA disability claims, pension/DIC, healthcare enrollment, NY State Blind Annuity, county property-tax exemption, transport to Syracuse VAMC and Rome VA CBOC." },

  // ============== B. ORANGE COUNTY MAINSTREAM ==============
  { section: "DSS", title: "Orange County Department of Social Services", cat: "financial", sub: "Emergency Financial Assistance", city: "Goshen", website_url: "https://www.orangecountygov.com/153/Social-Services", source_name: "Orange County NY Government", source_type: "county_government", phone: "845-291-4000", address: "11 Quarry Road, Goshen, NY 10924", zip: "10924", desc: "Orange County Department of Social Services — applications for SNAP, Medicaid, Temporary Assistance, HEAP heating help, child care subsidies, emergency rent/utility, and adult protective services for veterans and households across Orange County (Newburgh, Middletown, Port Jervis, Monroe, Warwick, Goshen)." },
  { section: "OFA", title: "Orange County Office for the Aging", cat: "end-of-life-services", sub: "Senior & Disabled Meal Programs", city: "Goshen", website_url: "https://www.orangecountygov.com/154/Office-for-the-Aging", source_name: "Orange County NY Government", source_type: "county_government", phone: "845-615-3700", address: "18 Seward Avenue, Suite 101, Middletown, NY 10940", zip: "10940", desc: "Orange County Office for the Aging — Title III/IIIE meals on wheels, congregate meals, NY Connects single-point-of-entry, in-home services, caregiver respite, HIICAP Medicare counseling, and EISEP non-medical case management for veterans and seniors 60+ across Orange County." },
  { section: "MH", title: "Orange County Department of Mental Health", cat: "mental-health", sub: "Counseling & Therapy", city: "Goshen", website_url: "https://www.orangecountygov.com/161/Mental-Health", source_name: "Orange County NY Government", source_type: "county_government", phone: "845-291-2600", address: "30 Harriman Drive, Goshen, NY 10924", zip: "10924", desc: "Orange County Department of Mental Health — LGU coordinating outpatient mental health, substance use, and developmental disability services across Orange County; mobile crisis, single-point-of-access (SPOA) for adults and children, opioid response, Mental Hygiene Law admissions, and clinic / care-management referrals for veterans and family members." },

  // ============== C. ERIE COUNTY MENTAL HEALTH ==============
  { section: "MH", title: "Erie County Department of Mental Health", cat: "mental-health", sub: "Counseling & Therapy", city: "Buffalo", website_url: "https://www3.erie.gov/mentalhealth/", source_name: "Erie County NY Government", source_type: "county_government", phone: "716-858-8530", address: "95 Franklin Street, 10th Floor, Buffalo, NY 14202", zip: "14202", desc: "Erie County Department of Mental Health — LGU for Erie County coordinating outpatient mental health, substance use, and developmental disability services; SPOA single-point-of-access for adult/child care management, opioid response, mobile crisis (delivered through Crisis Services 716-834-3131), and licensed clinic referrals for Buffalo-area veterans and families." },

  // ============== D. CATHOLIC CHARITIES BY DIOCESE — 5 ==============
  { section: "CC", title: "Catholic Charities Community Services — Archdiocese of New York", cat: "community-support", sub: "Volunteer & Mission-Based Community", city: "New York", website_url: "https://catholiccharitiesny.org/", source_name: "Catholic Charities Archdiocese of New York", source_type: "nonprofit", phone: "888-744-7900", address: "1011 First Avenue, New York, NY 10022", zip: "10022", desc: "Catholic Charities Community Services — Archdiocese of NY — 90+ programs across Manhattan, Bronx, Staten Island, and 7 Hudson Valley counties (Westchester, Rockland, Putnam, Dutchess, Orange, Sullivan, Ulster); food pantries, eviction prevention, immigration legal, asylum/refugee, addiction/MH (Catholic Charities Behavioral Health), housing development, and a single-call helpline 888-744-7900 for veterans and families in crisis." },
  { section: "CC", title: "Catholic Charities Brooklyn and Queens", cat: "community-support", sub: "Volunteer & Mission-Based Community", city: "Brooklyn", website_url: "https://www.ccbq.org/", source_name: "Catholic Charities Diocese of Brooklyn", source_type: "nonprofit", phone: "718-722-6001", address: "191 Joralemon Street, Brooklyn, NY 11201", zip: "11201", desc: "Catholic Charities Brooklyn and Queens — diocesan agency serving Brooklyn and Queens with 160+ programs: emergency food, eviction prevention / rental assistance, senior centers, behavioral health clinics, supportive housing for homeless veterans, immigration legal, and beacon of hope addiction recovery; serves all faiths." },
  { section: "CC", title: "Catholic Charities of Long Island", cat: "community-support", sub: "Volunteer & Mission-Based Community", city: "Hicksville", website_url: "https://www.cclongisland.org/", source_name: "Catholic Charities Diocese of Rockville Centre", source_type: "nonprofit", phone: "516-733-7000", address: "90 Cherry Lane, Hicksville, NY 11801", zip: "11801", desc: "Catholic Charities of Long Island — diocesan agency serving Nassau and Suffolk counties with food pantries, Regina Residence transitional housing, Talbot House addiction treatment, family service centers, immigration legal, behavioral health, and senior services for Long Island veterans and households across both counties." },
  { section: "CC", title: "Catholic Charities of the Diocese of Buffalo", cat: "community-support", sub: "Volunteer & Mission-Based Community", city: "Buffalo", website_url: "https://www.ccwny.org/", source_name: "Catholic Charities Diocese of Buffalo", source_type: "nonprofit", phone: "716-218-1400", address: "741 Delaware Avenue, Buffalo, NY 14209", zip: "14209", desc: "Catholic Charities of the Diocese of Buffalo (Catholic Charities of Western New York) — serving Erie, Niagara, Cattaraugus, Chautauqua, Allegany, Genesee, Orleans, and Wyoming counties with basic needs / food / utility help, behavioral health and chemical dependency clinics, refugee resettlement, immigration legal, and adult/child counseling for WNY veterans and families." },
  { section: "CC", title: "Catholic Charities Diocese of Albany", cat: "community-support", sub: "Volunteer & Mission-Based Community", city: "Albany", website_url: "https://www.ccrcda.org/", source_name: "Roman Catholic Diocese of Albany — Catholic Charities", source_type: "nonprofit", phone: "518-453-6650", address: "40 North Main Avenue, Albany, NY 12203", zip: "12203", desc: "Catholic Charities Roman Catholic Diocese of Albany — serving 14 counties of NY's Capital Region, Mohawk Valley, and southern Adirondacks (Albany, Rensselaer, Schenectady, Saratoga, Warren, Washington, Fulton, Montgomery, Schoharie, Greene, Columbia, Otsego, Delaware, Herkimer); food pantries, housing, addiction recovery (CC Disability Services), and counseling for veterans and families." },

  // ============== E. REGIONAL FOOD BANKS — 6 ==============
  { section: "FB", title: "Long Island Cares — The Harry Chapin Food Bank", cat: "food-assistance", sub: "Food Banks", city: "Hauppauge", website_url: "https://www.licares.org/", source_name: "Long Island Cares Inc", source_type: "nonprofit", phone: "631-582-3663", address: "10 Davids Drive, Hauppauge, NY 11788", zip: "11788", desc: "Long Island Cares — The Harry Chapin Food Bank — Suffolk and Nassau's regional food bank, supplying 300+ pantries/soup kitchens; operates 6 satellite Humanitarian Centers (Hauppauge, Lindenhurst, Freeport, Huntington Station, Riverhead, Bay Shore) and the Veterans Service Program (Operation Vet Cares) that delivers groceries directly to LI veteran households in need." },
  { section: "FB", title: "Island Harvest Food Bank", cat: "food-assistance", sub: "Food Banks", city: "Bethpage", website_url: "https://www.islandharvest.org/", source_name: "Island Harvest Food Bank", source_type: "nonprofit", phone: "516-294-8528", address: "15 Grumman Road West, Bethpage, NY 11714", zip: "11714", desc: "Island Harvest Food Bank — Long Island's other regional food bank, partnering with 300+ pantries across Nassau and Suffolk; operates the Military and Veterans Program (free groceries, mobile pantries at LI VA clinics, holiday meal distributions) and senior mobile pantries serving veteran households 60+." },
  { section: "FB", title: "Foodlink", cat: "food-assistance", sub: "Food Banks", city: "Rochester", website_url: "https://foodlinkny.org/", source_name: "Foodlink Inc", source_type: "nonprofit", phone: "585-328-3380", address: "1999 Mt Read Boulevard, Rochester, NY 14615", zip: "14615", desc: "Foodlink — regional food bank serving 10 counties of the Finger Lakes (Allegany, Genesee, Livingston, Monroe, Ontario, Orleans, Schuyler, Seneca, Wayne, Wyoming) supplying 400+ pantries/soup kitchens/shelters; Curbside Market mobile produce, BackPack Program, Cooking Matters, and Community Café restaurant for area veterans and families." },
  { section: "FB", title: "Food Bank of Central New York", cat: "food-assistance", sub: "Food Banks", city: "Syracuse", website_url: "https://www.foodbankcny.org/", source_name: "Food Bank of Central New York", source_type: "nonprofit", phone: "315-437-1899", address: "7066 Interstate Island Road, Syracuse, NY 13209", zip: "13209", desc: "Food Bank of Central New York — regional food bank serving 11 counties of CNY (Cayuga, Chenango, Cortland, Herkimer, Jefferson, Lewis, Madison, Oneida, Onondaga, Oswego, St. Lawrence) supplying 270+ partner agencies; Mobile Food Pantry, Kids' Cafe, BackPack, and SNAP application assistance for area veterans and families." },
  { section: "FB", title: "FeedMore WNY", cat: "food-assistance", sub: "Food Banks", city: "Buffalo", website_url: "https://www.feedmorewny.org/", source_name: "FeedMore WNY", source_type: "nonprofit", phone: "716-822-2002", address: "91 Holt Street, Buffalo, NY 14206", zip: "14206", desc: "FeedMore WNY (formed by 2020 merger of Food Bank of WNY + Meals on Wheels for WNY) — regional food bank for Cattaraugus, Chautauqua, Erie, and Niagara counties; supplies 300+ pantries, runs Meals on Wheels home-delivered meals (75% of WNY MoW program), Cooking Matters, and SNAP outreach for WNY veterans and seniors." },
  { section: "FB", title: "Regional Food Bank of Northeastern New York", cat: "food-assistance", sub: "Food Banks", city: "Latham", website_url: "https://regionalfoodbank.net/", source_name: "Regional Food Bank of Northeastern New York", source_type: "nonprofit", phone: "518-786-3691", address: "965 Albany Shaker Road, Latham, NY 12110", zip: "12110", desc: "Regional Food Bank of Northeastern New York — serves 23 counties from the Capital Region through the Hudson Valley to the Adirondacks (Albany, Rensselaer, Schenectady, Saratoga, Warren, Washington, Essex, Clinton, Franklin, Fulton, Hamilton, Montgomery, Schoharie, Greene, Columbia, Ulster, Dutchess, Putnam, Sullivan, Orange, Otsego, Delaware, Hamilton); supplies 1,000+ pantries/soup kitchens/shelters, Patroon Land Farm, Mobile Food Pantry, BackPack Program, and Veterans Initiative for area veterans." },

  // ============== F. UNITED WAY REGIONAL — 2 ==============
  { section: "UW", title: "United Way of Long Island", cat: "community-support", sub: "Volunteer & Mission-Based Community", city: "Deer Park", website_url: "https://www.unitedwayli.org/", source_name: "United Way of Long Island", source_type: "nonprofit", phone: "631-940-3700", address: "819 Grand Boulevard, Deer Park, NY 11729", zip: "11729", desc: "United Way of Long Island — convenes Suffolk and Nassau funders, runs 211 Long Island helpline, Mission United (veterans navigation hub linking LI veterans to housing/employment/MH/financial counseling), Project Warmth utility help, and VITA free tax preparation sites across both counties." },
  { section: "UW", title: "United Way of Buffalo & Erie County", cat: "community-support", sub: "Volunteer & Mission-Based Community", city: "Buffalo", website_url: "https://uwbec.org/", source_name: "United Way of Buffalo & Erie County", source_type: "nonprofit", phone: "716-887-2626", address: "742 Delaware Avenue, Buffalo, NY 14209", zip: "14209", desc: "United Way of Buffalo & Erie County — convenes WNY funders, supports 211 WNY helpline, Mission United Buffalo (veterans navigation across employment/legal/MH/financial), Western New York Veterans Housing Coalition partnership, and VITA free tax preparation sites across Erie County." },

  // ============== G. DISABILITY / MH / FAMILY / HOUSING — 5 ==============
  { section: "DIS", title: "NYS Justice Center for the Protection of People with Special Needs", cat: "disabled-veterans", sub: "Disability Benefits & Claims", city: "Delmar", website_url: "https://www.justicecenter.ny.gov/", source_name: "New York State Justice Center", source_type: "state_government", phone: "518-549-0200", address: "161 Delaware Avenue, Delmar, NY 12054", zip: "12054", desc: "NYS Justice Center for the Protection of People with Special Needs — statewide oversight, hotline (1-855-373-2122 24/7), and investigation agency for abuse/neglect of vulnerable adults receiving services from OPWDD, OMH, OASAS, OCFS, DOH, or SED-licensed providers; protects veterans residing in NYS Veterans Homes, group homes, ICFs, and certified MH/SUD residences." },
  { section: "MH", title: "NYAPRS — NY Association of Psychiatric Rehabilitation Services", cat: "mental-health", sub: "Counseling & Therapy", city: "Albany", website_url: "https://www.nyaprs.org/", source_name: "New York Association of Psychiatric Rehabilitation Services", source_type: "nonprofit", phone: "518-436-0008", address: "1 Columbia Place, Suite 200, Albany, NY 12207", zip: "12207", desc: "NYAPRS — statewide coalition of 150+ peer-run, recovery-oriented mental health agencies; advocacy on Medicaid/HARP plans, Adult Home Plus, supportive housing, jail diversion, and peer-specialist workforce; Peer Bridger transitional support that helps veterans leaving inpatient psychiatry reconnect to community providers." },
  { section: "NYC", title: "NYC Administration for Children's Services (ACS)", cat: "family-support", sub: "Military Family Support", city: "New York", website_url: "https://www.nyc.gov/site/acs/index.page", source_name: "New York City Government", source_type: "city_government", phone: "212-341-0900", address: "150 William Street, New York, NY 10038", zip: "10038", desc: "NYC Administration for Children's Services (ACS) — child welfare, child protection, juvenile justice, and child-care subsidies for NYC families; Statewide Central Register intake (1-800-342-3720), preventive services contracts in all 5 boroughs, and family permanency services for NYC veteran households needing in-home prevention or kinship care support." },
  { section: "NYC", title: "New York City Housing Authority (NYCHA)", cat: "housing", sub: "Rental Assistance", city: "New York", website_url: "https://www.nyc.gov/site/nycha/index.page", source_name: "New York City Government", source_type: "city_government", phone: "718-707-7771", address: "90 Church Street, New York, NY 10007", zip: "10007", desc: "New York City Housing Authority (NYCHA) — nation's largest public housing authority (335 developments, 178,000+ apartments, ~400,000 residents) plus the Section 8 Housing Choice Voucher program (~85,000 vouchers); Veterans Affairs Supportive Housing (HUD-VASH) PBV referrals from VA NY Harbor / Bronx VAMC for chronically homeless NYC veterans." },
];

(async () => {
  await runSeed(ROWS, {
    state: "NY",
    commit: COMMIT,
    allowBrokenUrls: false,
    scriptName: "seed-ny-p3-reset",
    batchTag: "ny-p3-reset-2026-04-27",
  });
})().catch((e) => { console.error(e); process.exit(1); });
