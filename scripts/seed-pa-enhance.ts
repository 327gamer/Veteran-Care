/**
 * PA ENHANCEMENT PASS — ONE-RUN MAINSTREAM LIFT (FOUNDER-APPROVED 2026-04-27)
 *
 * Founder directive (post TX-enhance closeout): "Lift Pennsylvania from 308
 * rows toward flagship depth using the same enhancement model used for TX/OH.
 * Focus only on missed practical ecosystem resources veterans use. Skip
 * blockers / skip messy sources / skip duplicates. Use clean verified adds
 * only." Veteran-first NOT veteran-only.
 *
 * Pre-pass baseline: 308 rows / 70 cities / 17/17 cats. Bottom cats:
 *   insurance 7, disabled-vets 8, food 10, crisis 11, legal 11, sub-recovery
 *   12, employment 12, end-of-life 15, mental 15, transportation 17.
 *
 * URL liveness: ~60 candidates probed via parallel curl HEAD-then-GET with
 * engine UA "VeteranCare-RolloutEngine/1.0 (+url-liveness-gate)" before
 * authoring (32 verified, 26 kept after dup pre-screen against PA inventory).
 *
 * SKIPPED per "skip blockers / skip messy sources" — DNS-dead or 000:
 *   - Allegheny County Housing Authority (achousing.org + 2 alts all 000)
 *   - Reading Housing Authority (readingpaha.org + 3 alts all 000)
 *   - York Housing Authority (yhapa.org + 2 alts all 000)
 *   - Lancaster City Housing Authority (lancha.org + 2 alts all 000)
 *   - Family Practice & Counseling Network Phila (fpcn.us 000)
 *   - Welsh Mountain Health Centers (welshmountainhealthcenters.org +
 *     welshmountain.org both 000)
 *   - Community Health Net Erie (chnerie.org 000; communityhealth.net resolves
 *     but is a different org — IL-based — not Erie's CHN)
 *   - Catholic Social Services Archdiocese of Philadelphia (catholicsocial
 *     servicesphl.org + chs-adphila.org + catholiccharitiesphl.org all 000)
 *   - Goodwill of Northwest PA (goodwillnwpa.org + 2 alts all 000)
 *   - YMCA of Greater Pittsburgh (ymcapgh.org + 2 alts all 000)
 *   - York/Lancaster County Area Agencies on Aging (all candidate URLs 000
 *     or redirect to wrong dept)
 *   - Allegheny County AAA (alleghenycounty.us/aging 403 to engine UA)
 *   - Centre County United Way (cccunitedway.org + alt 000)
 *
 * SKIPPED dups (already in PA from P1-P6):
 *   - Project HOME (P6 FILL), Pittsburgh Mercy (P6 FILL), GPHA (P-existing,
 *     URL gpha.org), Family First Health York (P6 audit), Diocese of Scranton
 *     CSS (P5 CCC), Goodwill Keystone (P5), Philadelphia Freedom Valley YMCA
 *     (P5 YMCA), AAA Lehigh Valley + Berks + Bucks + Cumberland + Luzerne +
 *     Lycoming-Clinton + PCA Philadelphia + Westmoreland + Centre COCAA
 *     (already 9 PA AAAs), Catholic Charities Allentown/Altoona-Johnstown/
 *     Erie/Harrisburg/Pittsburgh (5 of 8 dioceses already in).
 *
 * ROW STRUCTURE (8 sections, 26 rows):
 *   HSG  housing authorities (8 of 12 metros — 4 dropped as DNS-dead)        (8)
 *   FQH  FQHCs / community health centers                                    (7)
 *   WRK  Philadelphia Works (PA CareerLink Phila WIB)                        (1)
 *   CCH  Catholic Charities (Greensburg — 6th of 8 dioceses)                 (1)
 *   UW   United Ways (York / Chester / Bucks)                                (3)
 *   YMC  YMCAs (Erie / York-Roses)                                           (2)
 *   ARC  American Red Cross PA region                                        (1)
 *   SR   AAAs / disability advocacy                                          (3)
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";
const COMMIT = process.argv.includes("--commit");

const ROWS: SeedRow[] = [

  // ======================== HOUSING AUTHORITIES — 8 ========================
  {
    section: "HSG",
    title: "Allentown Housing Authority",
    cat: "housing",
    sub: "Rental Assistance",
    desc: "Public housing and Housing Choice Voucher (Section 8) administration for the City of Allentown. Operates LIPH developments, scattered-site rentals, and HCV waitlist. Veterans receive HUD-VASH voucher coordination and homeless-veteran preference where federally allowed.",
    website_url: "https://www.allentownhousing.org/",
    phone: "610-439-8678",
    address: "1339 W Allen Street",
    city: "Allentown",
    source_name: "Allentown Housing Authority",
    source_type: "public-housing-authority",
  },
  {
    section: "HSG",
    title: "Bethlehem Housing Authority",
    cat: "housing",
    sub: "Rental Assistance",
    desc: "Public housing and Section 8 Housing Choice Voucher administration for the City of Bethlehem (Lehigh Valley). HUD-VASH voucher coordination available; veteran preference applies on federally permitted programs.",
    website_url: "https://www.bethlehemhousing.org/BHA/Default.asp",
    phone: "610-865-8300",
    address: "645 Main Street",
    city: "Bethlehem",
    source_name: "Bethlehem Housing Authority",
    source_type: "public-housing-authority",
  },
  {
    section: "HSG",
    title: "Bucks County Housing Authority",
    cat: "housing",
    sub: "Rental Assistance",
    desc: "Public housing and Housing Choice Voucher (Section 8) administration for Bucks County. Programs include LIPH, Project-Based Vouchers, and Family Self-Sufficiency. Coordinates with PA Dept of Military & Veterans Affairs on HUD-VASH and homeless-veteran placements.",
    website_url: "https://buckshousing.org/",
    phone: "215-348-9469",
    address: "350 South Main Street, Suite 205",
    city: "Doylestown",
    source_name: "Bucks County Housing Authority",
    source_type: "public-housing-authority",
  },
  {
    section: "HSG",
    title: "Housing Authority of the County of Chester",
    cat: "housing",
    sub: "Rental Assistance",
    desc: "Public housing and Section 8 Housing Choice Voucher administration for Chester County. Operates LIPH, HCV, FUP, and HUD-VASH coordination with the Coatesville VA Medical Center for homeless veteran placements.",
    website_url: "https://www.haccpa.org/",
    phone: "610-436-9200",
    address: "30 West Barnard Street",
    city: "West Chester",
    source_name: "Housing Authority of the County of Chester",
    source_type: "public-housing-authority",
  },
  {
    section: "HSG",
    title: "Housing Authority of the City of Erie (HACE)",
    cat: "housing",
    sub: "Rental Assistance",
    desc: "Public housing and Section 8 Housing Choice Voucher administration for the City of Erie. Operates LIPH developments, scattered-site rentals, HCV, and HUD-VASH veteran voucher coordination with the Erie VA Medical Center.",
    website_url: "https://www.hace.org/",
    phone: "814-452-2425",
    address: "606 Holland Street",
    city: "Erie",
    source_name: "Housing Authority of the City of Erie",
    source_type: "public-housing-authority",
  },
  {
    section: "HSG",
    title: "Scranton Housing Authority",
    cat: "housing",
    sub: "Rental Assistance",
    desc: "Public housing and Housing Choice Voucher administration for the City of Scranton. HCV waitlist plus LIPH developments; veteran preference applies; coordinates with Wilkes-Barre VAMC HUD-VASH for homeless veteran placements.",
    website_url: "https://www.scrantonhousing.org/",
    phone: "570-348-2024",
    address: "400 Adams Avenue",
    city: "Scranton",
    source_name: "Scranton Housing Authority",
    source_type: "public-housing-authority",
  },
  {
    section: "HSG",
    title: "Harrisburg Housing Authority",
    cat: "housing",
    sub: "Rental Assistance",
    desc: "Public housing and Section 8 Housing Choice Voucher administration for the City of Harrisburg. Operates LIPH developments, scattered-site rentals, HCV, and HUD-VASH coordination with the Lebanon VA Medical Center.",
    website_url: "https://harrisburghousing.org/",
    phone: "717-232-6781",
    address: "351 Chestnut Street",
    city: "Harrisburg",
    source_name: "Harrisburg Housing Authority",
    source_type: "public-housing-authority",
  },
  {
    section: "HSG",
    title: "Housing Authority of the City of Wilkes-Barre",
    cat: "housing",
    sub: "Rental Assistance",
    desc: "Public housing and Housing Choice Voucher administration for the City of Wilkes-Barre. Operates LIPH developments, HCV, and HUD-VASH coordination with the Wilkes-Barre VA Medical Center for homeless veteran placements.",
    website_url: "https://www.wilkesbarrehousing.org/",
    phone: "570-820-5710",
    address: "10 East Northampton Street",
    city: "Wilkes-Barre",
    source_name: "Wilkes-Barre Housing Authority",
    source_type: "public-housing-authority",
  },

  // ======================== FQHCs / HEALTH CENTERS — 7 ========================
  {
    section: "FQH",
    title: "Esperanza Health Center",
    cat: "healthcare",
    sub: "Primary Care",
    desc: "Federally Qualified Health Center serving North Philadelphia with primary care, dental, behavioral health, and women's health on a sliding-fee scale. Bilingual Spanish/English. Accepts Medicaid, Medicare, TRICARE, VA Community Care, and uninsured/sliding-scale veterans.",
    website_url: "https://esperanzahealth.com/",
    phone: "215-302-2300",
    address: "861 East Hunting Park Avenue",
    city: "Philadelphia",
    source_name: "Esperanza Health Center",
    source_type: "fqhc",
  },
  {
    section: "FQH",
    title: "Sayre Health Center",
    cat: "healthcare",
    sub: "Primary Care",
    desc: "Federally Qualified Health Center serving West Philadelphia with primary care, behavioral health, dental, and care management on a sliding-fee scale. Accepts Medicaid, Medicare, TRICARE, VA Community Care.",
    website_url: "https://www.sayrehealth.org/",
    phone: "215-474-4444",
    address: "5800 Walnut Street",
    city: "Philadelphia",
    source_name: "Sayre Health Center",
    source_type: "fqhc",
  },
  {
    section: "FQH",
    title: "Keystone Health",
    cat: "healthcare",
    sub: "Primary Care",
    desc: "Federally Qualified Health Center system serving Franklin and Fulton counties (south-central PA) with primary care, behavioral health, women's health, dental, pharmacy, and migrant/farmworker outreach on a sliding-fee scale. Accepts Medicaid, Medicare, TRICARE, VA Community Care.",
    website_url: "https://keystonehealth.org/",
    phone: "717-709-7900",
    address: "455 Walker Road",
    city: "Chambersburg",
    source_name: "Keystone Health",
    source_type: "fqhc",
  },
  {
    section: "FQH",
    title: "Cornerstone Care",
    cat: "healthcare",
    sub: "Primary Care",
    desc: "Federally Qualified Health Center serving Greene, Washington, and Fayette counties (rural southwestern PA) with primary care, dental, behavioral health, and pharmacy on a sliding-fee scale. Operates 9 sites; accepts Medicaid, Medicare, TRICARE, VA Community Care.",
    website_url: "https://cornerstonecare.com/",
    phone: "877-871-2240",
    address: "2 Stewart Drive",
    city: "Mount Morris",
    source_name: "Cornerstone Care",
    source_type: "fqhc",
  },
  {
    section: "FQH",
    title: "Primary Health Network",
    cat: "healthcare",
    sub: "Primary Care",
    desc: "Federally Qualified Health Center system operating 50+ sites across western, northwestern, and central Pennsylvania (Mercer, Lawrence, Crawford, Erie, Venango, Butler, Beaver, Allegheny, and adjacent counties). Primary care, dental, behavioral health, pharmacy on sliding-fee scale; accepts Medicaid, Medicare, TRICARE, VA Community Care.",
    website_url: "https://www.primary-health.net/",
    phone: "724-981-5882",
    address: "164 Pitt Street",
    city: "Sharon",
    source_name: "Primary Health Network",
    source_type: "fqhc",
  },
  {
    section: "FQH",
    title: "The Wright Center for Community Health",
    cat: "healthcare",
    sub: "Primary Care",
    desc: "Federally Qualified Health Center serving NEPA (Lackawanna, Luzerne, Wayne, Susquehanna, Wyoming counties) with primary care, addiction medicine (MAT), pediatrics, dental, behavioral health, and a Ryan White HIV program. Operates the National Family Medicine Residency. Sliding-fee scale; accepts Medicaid, Medicare, TRICARE, VA Community Care.",
    website_url: "https://thewrightcenter.org/",
    phone: "570-230-0019",
    address: "501 South Washington Avenue, Suite 1000",
    city: "Scranton",
    source_name: "The Wright Center for Community Health",
    source_type: "fqhc",
  },
  {
    section: "FQH",
    title: "Maternal & Family Health Services",
    cat: "healthcare",
    sub: "Primary Care",
    desc: "Federally Qualified Health Center and WIC agency serving 17 NEPA counties with women's health, family planning, prenatal care, pediatrics, dental, and behavioral health. Operates 35+ sites and the regional WIC program. Accepts Medicaid, Medicare, TRICARE, VA Community Care; sliding-fee scale.",
    website_url: "https://mfhs.org/",
    phone: "570-826-1777",
    address: "15 Public Square, Suite 600",
    city: "Wilkes-Barre",
    source_name: "Maternal & Family Health Services",
    source_type: "fqhc",
  },

  // ======================== WORKFORCE — 1 ========================
  {
    section: "WRK",
    title: "Philadelphia Works",
    cat: "employment",
    sub: "DVOP / Workforce Programs",
    desc: "Philadelphia's local workforce development board operating PA CareerLink Philadelphia centers. Free DVOP/LVER veteran-priority services, Jobs for Veterans State Grants programming, WIOA training scholarships, on-the-job training, apprenticeship referrals, and direct employer connections. Five Philadelphia center locations.",
    website_url: "https://philaworks.org/",
    phone: "215-963-2100",
    address: "1617 JFK Boulevard, 13th Floor",
    city: "Philadelphia",
    source_name: "Philadelphia Works (Local Workforce Board)",
    source_type: "workforce-board",
  },

  // ======================== CATHOLIC CHARITIES — 1 ========================
  {
    section: "CCH",
    title: "Diocese of Greensburg Catholic Charities",
    cat: "community-support",
    sub: "Veteran Outreach Programs",
    desc: "Catholic Charities of the Diocese of Greensburg covers Westmoreland, Armstrong, Indiana, and Fayette counties. Programs: emergency rental/utility assistance, food pantry network, counseling, refugee resettlement, senior outreach. Open to all regardless of faith; veteran-friendly intake.",
    website_url: "https://www.dioceseofgreensburg.org/",
    phone: "724-837-1840",
    address: "711 East Pittsburgh Street",
    city: "Greensburg",
    source_name: "Diocese of Greensburg",
    source_type: "diocesan-catholic-charities",
  },

  // ======================== UNITED WAYS — 3 ========================
  {
    section: "UW",
    title: "United Way of York County",
    cat: "community-support",
    sub: "Veteran Outreach Programs",
    desc: "York County's local United Way funds 2-1-1 information & referral, Bell Socialization Services for homeless adults, basic-needs grants, financial coaching, and a Veterans Initiative coordinating with York County's CVSO and Lebanon VAMC. Free 2-1-1 dial referrals to housing/food/utility/legal partners countywide.",
    website_url: "https://www.unitedway-york.org/",
    phone: "717-771-3805",
    address: "800 East King Street",
    city: "York",
    source_name: "United Way of York County",
    source_type: "united-way",
  },
  {
    section: "UW",
    title: "United Way of Chester County",
    cat: "community-support",
    sub: "Veteran Outreach Programs",
    desc: "Chester County's local United Way funds 2-1-1 SE PA, basic-needs grants, financial coaching (Roadmap to Financial Stability), and partnerships with Coatesville VA Medical Center, Chester County Veterans Affairs, and HUD-VASH housing partners. Free 2-1-1 referrals across housing/food/utility/legal/health.",
    website_url: "https://www.unitedwaychestercounty.org/",
    phone: "610-429-9400",
    address: "211 Carter Drive, Suite 2",
    city: "West Chester",
    source_name: "United Way of Chester County",
    source_type: "united-way",
  },
  {
    section: "UW",
    title: "United Way of Bucks County",
    cat: "community-support",
    sub: "Veteran Outreach Programs",
    desc: "Bucks County's local United Way funds 2-1-1 SE PA, BuxMont Veterans, basic-needs grants, financial empowerment programs, and Hunger-Free Bucks. Free 2-1-1 referrals across housing/food/utility/legal/health/transportation; coordinates with Philadelphia VAMC and Bucks County Director of Veterans Affairs.",
    website_url: "https://www.uwbucks.org/",
    phone: "215-949-1660",
    address: "413 Hood Boulevard",
    city: "Fairless Hills",
    source_name: "United Way of Bucks County",
    source_type: "united-way",
  },

  // ======================== YMCAs — 2 ========================
  {
    section: "YMC",
    title: "YMCA of Greater Erie",
    cat: "community-support",
    sub: "Fitness, Sports & Wellness Groups",
    desc: "Erie-area YMCA system with multiple branches offering fitness facilities, swim, youth programs, senior wellness, diabetes prevention, and military/veteran membership discounts. Participates in YMCA Veterans Discount and Mission United partnerships.",
    website_url: "https://www.ymcaerie.org/",
    phone: "814-452-3261",
    address: "31 West 10th Street",
    city: "Erie",
    source_name: "YMCA of Greater Erie",
    source_type: "ymca",
  },
  {
    section: "YMC",
    title: "York and York County YMCA (Roses YMCA)",
    cat: "community-support",
    sub: "Fitness, Sports & Wellness Groups",
    desc: "York County's YMCA system (operating as Roses YMCA) with multiple branches across York and Lancaster regions. Fitness, swim, child care, youth sports, senior wellness, and military/veteran membership programs.",
    website_url: "https://www.rosesymca.org/",
    phone: "717-843-7884",
    address: "90 North Newberry Street",
    city: "York",
    source_name: "Roses YMCA (York County YMCA)",
    source_type: "ymca",
  },

  // ======================== AMERICAN RED CROSS — 1 ========================
  {
    section: "ARC",
    title: "American Red Cross of Greater Pennsylvania",
    cat: "community-support",
    sub: "Veteran Outreach Programs",
    desc: "Regional Red Cross chapter covering eastern, central, and southeastern Pennsylvania. Service to the Armed Forces (SAF) program: emergency communication messages between deployed service members and family, financial assistance for emergency travel, deployment briefings, hero care network, and reconnection workshops for veterans/families. Disaster response and shelter operations across the region.",
    website_url: "https://www.redcross.org/local/pennsylvania/southeastern-pennsylvania.html",
    phone: "215-299-4000",
    address: "23rd & Chestnut Streets",
    city: "Philadelphia",
    source_name: "American Red Cross — Greater Pennsylvania Region",
    source_type: "red-cross-chapter",
  },

  // ======================== SENIOR / DISABILITY — 3 ========================
  {
    section: "SR",
    title: "Bradford-Sullivan-Susquehanna-Tioga Counties Area Agency on Aging",
    cat: "community-support",
    sub: "Senior / Retired Veteran Social Programs",
    desc: "Designated PA Department of Aging Area Agency on Aging serving the four-county northern-tier rural NEPA region. Senior centers, OPTIONS in-home services, APPRISE Medicare counseling, ombudsman, PACE/PACENET, family caregiver support, and Veteran-Directed Care coordination with Wilkes-Barre VAMC.",
    website_url: "https://www.bsst.org/",
    phone: "570-265-6121",
    address: "112 Main Street",
    city: "Towanda",
    source_name: "BSST Area Agency on Aging",
    source_type: "area-agency-on-aging",
  },
  {
    section: "SR",
    title: "United Cerebral Palsy of Central PA",
    cat: "disabled-veterans",
    sub: "Independent Living & Daily Support",
    desc: "Independent-living and community-services nonprofit serving veterans and adults with cerebral palsy and other physical disabilities across central PA (Cumberland, Dauphin, York, Lebanon, Adams, Perry counties). Programs: in-home personal care, residential, employment supports, adaptive technology, and family caregiver respite.",
    website_url: "https://www.ucpcentralpa.org/",
    phone: "717-737-3477",
    address: "55 Utley Drive",
    city: "Camp Hill",
    source_name: "UCP of Central PA",
    source_type: "disability-services-nonprofit",
  },
];

runSeed(ROWS, {
  state: "PA",
  commit: COMMIT,
  scriptName: "seed-pa-enhance",
  sectionLabels: {
    HSG: "Housing Authorities",
    FQH: "FQHCs / Health Centers",
    WRK: "Workforce",
    CCH: "Catholic Charities",
    UW: "United Ways",
    YMC: "YMCAs",
    ARC: "American Red Cross",
    SR: "Senior / Disability",
  },
}).catch((e) => { console.error(e); process.exit(1); });
