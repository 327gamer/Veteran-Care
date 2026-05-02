/**
 * MASSACHUSETTS — WAVE 6 (Rural & Regional Geographic Closeout, ~80 rows)
 *
 * Founder release 2026-05-02: fill remaining rural + underserved MA regions.
 * NO Stripe / billing / AI Guide / schema / Trusted Services touches.
 * STOP after Wave 6.
 *
 * Sections (7 regional rural-closeout blocks):
 *   A  Berkshires Deep                (Adams, Cheshire, Dalton, Lee, Lenox,
 *                                       Stockbridge, Sheffield, GBarrington)
 *   B  Franklin + Hampshire Rural     (Athol, Orange, Belchertown, Ware,
 *                                       South Hadley, Easthampton, Northfield,
 *                                       Worthington, Amherst, Turners Falls)
 *   C  Hampden Smaller Towns          (Westfield, Agawam, Chicopee, Ludlow,
 *                                       Palmer, Monson, ELongmeadow,
 *                                       Longmeadow, Wilbraham)
 *   D  Cape Cod Outer + Mid           (Wellfleet, Truro, Eastham, Orleans,
 *                                       Brewster, Chatham, Harwich, Dennis,
 *                                       Yarmouth, Sandwich, Mashpee, Bourne)
 *   E  Central + North Central        (Spencer, Sturbridge, Webster, Dudley,
 *                                       Southbridge, Templeton, Winchendon,
 *                                       Athol, Gardner, Fitchburg)
 *   F  SouthCoast Smaller Towns       (Wareham, Acushnet, Westport, Fairhaven,
 *                                       Mattapoisett, Marion, Carver,
 *                                       Middleboro, NewBedford)
 *   G  Islands Closeout               (Tisbury/VineyardHaven, OakBluffs,
 *                                       WestTisbury, Aquinnah, Nantucket)
 *
 * APPENDS to W1+W2+W3+W4+W5 = 582. Post-W6: ~662.
 *
 * Run:
 *   tsx scripts/seed-ma-wave6.ts                                # dry-run
 *   tsx scripts/seed-ma-wave6.ts --commit --allow-broken-urls --allow-zip-bleed
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");
const ALLOW_ZIP_BLEED = process.argv.includes("--allow-zip-bleed");

const ROWS: SeedRow[] = [
  // ===========================================================================
  // A. BERKSHIRES DEEP (12)
  // ===========================================================================
  { section: "A", title: "BHS Adams Family Medicine",
    cat: "healthcare", sub: "Primary Care",
    desc: "Berkshire Health Systems Adams Family Medicine — primary care office serving Adams + North Adams + Cheshire + Savoy + Florida + Clarksburg residents incl. retired Northern Berkshire veterans. Same-day sick visits, chronic-disease management, and integrated behavioral health.",
    website_url: "https://www.berkshirehealthsystems.org/", phone: "413-743-1500",
    address: "1 Hospital Ave", city: "North Adams", zip: "01247",
    source_name: "Berkshire Health Systems" },

  { section: "A", title: "Hinsdale Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Hinsdale COA — Central Berkshire senior center serving Hinsdale + Peru + Washington elders incl. retired veterans. Congregate meals, fitness, transportation to Pittsfield medical, SHINE counseling, and Berkshire VSO district referrals.",
    website_url: "https://www.hinsdalema.gov/council-aging", phone: "413-655-2929",
    address: "39 South St", city: "Hinsdale", zip: "01235",
    source_name: "Town of Hinsdale" },

  { section: "A", title: "Cheshire Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Cheshire COA — Northern Berkshire senior center serving Cheshire elders incl. retired veterans. Congregate meals, fitness, transportation to Adams + Pittsfield, SHINE counseling, and outreach for isolated rural Berkshire seniors.",
    website_url: "https://www.cheshire-ma.gov/council-aging", phone: "413-743-9719",
    address: "119 School St", city: "Cheshire", zip: "01225",
    source_name: "Town of Cheshire" },

  { section: "A", title: "Dalton Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Dalton COA — Central Berkshire senior center serving Dalton + Hinsdale + Windsor elders incl. retired veterans. Congregate meals, fitness, transportation to Pittsfield medical, SHINE counseling, and Berkshire VSO referrals.",
    website_url: "https://www.dalton-ma.gov/council-aging", phone: "413-684-2000",
    address: "40 Field St Ext", city: "Dalton", zip: "01226",
    source_name: "Town of Dalton" },

  { section: "A", title: "Lee Senior Center",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Lee COA — South Berkshire senior center serving Lee + Tyringham + Becket elders incl. retired veterans. Congregate meals, fitness, transportation to Pittsfield + Great Barrington medical, SHINE counseling, and South Berkshire VSO referrals.",
    website_url: "https://www.lee.ma.us/council-aging", phone: "413-394-1419",
    address: "21 Crossway Village", city: "Lee", zip: "01238",
    source_name: "Town of Lee" },

  { section: "A", title: "Lenox Community Center COA",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Lenox Community Center / COA — South Berkshire senior + community center in Lenox. Congregate meals, fitness, veterans' outreach + breakfast group, SHINE counseling, transportation, and South Berkshire VSO referrals.",
    website_url: "https://www.townoflenox.com/community-center", phone: "413-637-5535",
    address: "65 Walker St", city: "Lenox", zip: "01240",
    source_name: "Town of Lenox" },

  { section: "A", title: "Stockbridge Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Stockbridge COA — South Berkshire senior center serving Stockbridge + West Stockbridge + Glendale elders incl. retired veterans. Congregate meals, fitness, transportation, SHINE counseling, and South Berkshire VSO referrals.",
    website_url: "https://www.townofstockbridge.com/council-aging", phone: "413-298-4170",
    address: "50 Main St", city: "Stockbridge", zip: "01262",
    source_name: "Town of Stockbridge" },

  { section: "A", title: "Sheffield Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Sheffield COA — Far South Berkshire senior center serving Sheffield + Ashley Falls + New Marlborough + Mt Washington elders incl. retired veterans. Congregate meals, transportation to Great Barrington medical, SHINE counseling, and VSO referrals.",
    website_url: "https://www.sheffieldma.gov/council-aging", phone: "413-229-7037",
    address: "25 Cook Rd", city: "Sheffield", zip: "01257",
    source_name: "Town of Sheffield" },

  { section: "A", title: "People's Pantry Great Barrington",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "People's Pantry — South Berkshire's primary food pantry. Free groceries, fresh produce, household supplies for low-income South County residents (incl. veterans) across Great Barrington + Stockbridge + Lee + Sheffield + Egremont + Monterey region. Walk-in + delivery.",
    website_url: "https://peoplespantrygb.org/", phone: "413-528-2790",
    address: "2 St James Pl", city: "Great Barrington", zip: "01230",
    source_name: "People's Pantry of Great Barrington" },

  { section: "A", title: "South Berkshire Elderly Transportation Lee",
    cat: "transportation", sub: "Ride Assistance Programs",
    desc: "South Berkshire Elderly Transportation Inc — volunteer-driver organization providing free rides to medical appointments + grocery + pharmacy for South Berkshire seniors (incl. retired veterans) across Lee + Lenox + Stockbridge + Great Barrington + Sheffield region.",
    website_url: "https://www.berkshireridesinc.org/", phone: "413-528-0457",
    address: "PO Box 451", city: "Lee", zip: "01238",
    source_name: "South Berkshire Elderly Transportation" },

  { section: "A", title: "Northern Berkshire United Way Adams",
    cat: "community-support", sub: "Veteran Nonprofit Organizations",
    desc: "Northern Berkshire United Way — Adams-based community impact organization supporting basic-needs, education, and health programs across Adams + North Adams + Williamstown + Clarksburg + Florida + Savoy + Cheshire region incl. veterans + families.",
    website_url: "https://nbunitedway.org/", phone: "413-663-5733",
    address: "85 Main St, Suite 408", city: "North Adams", zip: "01247",
    source_name: "Northern Berkshire United Way" },

  { section: "A", title: "CHP Lee Family Health Center",
    cat: "healthcare", sub: "Primary Care",
    desc: "Community Health Programs Lee — federally qualified health center serving South Berkshire residents incl. retired veterans. Sliding-scale primary care, integrated behavioral health, dental, and MAT for opioid-use disorder. Walk-in available.",
    website_url: "https://www.chpberkshires.org/", phone: "413-243-2233",
    address: "85 Main St", city: "Lee", zip: "01238",
    source_name: "Community Health Programs" },

  // ===========================================================================
  // B. FRANKLIN + HAMPSHIRE RURAL (13)
  // ===========================================================================
  { section: "B", title: "Hilltown Community Health Center Worthington",
    cat: "healthcare", sub: "Primary Care",
    desc: "Hilltown CHC Worthington — federally qualified health center serving Hampshire + Hampden hilltown residents (Worthington, Cummington, Goshen, Chesterfield, Plainfield, Williamsburg) incl. retired veterans. Sliding-scale primary care, behavioral health, dental, MAT.",
    website_url: "https://www.hchcweb.org/", phone: "413-238-4258",
    address: "58 Old North Rd", city: "Worthington", zip: "01098",
    source_name: "Hilltown Community Health Center" },

  { section: "B", title: "Hilltown CHC Huntington",
    cat: "healthcare", sub: "Primary Care",
    desc: "Hilltown CHC Huntington — federally qualified health center serving Western Hampden hilltown residents (Huntington, Russell, Blandford, Chester, Montgomery) incl. retired veterans. Sliding-scale primary care, behavioral health, dental, MAT.",
    website_url: "https://www.hchcweb.org/", phone: "413-667-2203",
    address: "73 Russell Rd", city: "Huntington", zip: "01050",
    source_name: "Hilltown Community Health Center" },

  { section: "B", title: "Athol Senior Center Veterans Outreach",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Athol Senior Center — North Quabbin senior center serving Athol + Royalston + Phillipston elders incl. retired veterans. Congregate meals, fitness, monthly veterans' breakfast, SHINE counseling, transportation, and Athol-Royalston VSO district referrals.",
    website_url: "https://www.athol-ma.gov/council-aging", phone: "978-249-8986",
    address: "82 Freedom St", city: "Athol", zip: "01331",
    source_name: "Town of Athol" },

  { section: "B", title: "Orange Senior Center",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Orange COA — North Quabbin senior center serving Orange + Wendell + New Salem + Erving elders incl. retired veterans. Congregate meals, fitness, transportation, SHINE counseling, and Franklin County VSO district referrals.",
    website_url: "https://www.townoforange.org/council-aging", phone: "978-544-1113",
    address: "135 East Main St", city: "Orange", zip: "01364",
    source_name: "Town of Orange" },

  { section: "B", title: "Athol Hospital",
    cat: "healthcare", sub: "Primary Care",
    desc: "Athol Hospital (Heywood Healthcare) — 25-bed critical-access community hospital serving the North Quabbin region (Athol, Orange, Royalston, Petersham, Phillipston, Templeton, Wendell, New Salem, Erving). Emergency dept, primary care, surgery, behavioral health, and rural veterans care.",
    website_url: "https://www.heywood.org/locations/athol-hospital", phone: "978-249-3511",
    address: "2033 Main St", city: "Athol", zip: "01331",
    source_name: "Heywood Healthcare" },

  { section: "B", title: "Cooley Dickinson Hospital Northampton",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Cooley Dickinson Hospital (Mass General Brigham) — 140-bed community hospital in Northampton serving Hampshire County (Northampton, Easthampton, Hadley, Amherst, South Hadley, Belchertown, Williamsburg, Goshen, Chesterfield, Cummington). Emergency, surgery, oncology, behavioral health.",
    website_url: "https://www.cooleydickinson.org/", phone: "413-582-2000",
    address: "30 Locust St", city: "Northampton", zip: "01060",
    source_name: "Cooley Dickinson Hospital" },

  { section: "B", title: "Belchertown Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Belchertown COA — Eastern Hampshire senior center serving Belchertown + Pelham + Granby elders incl. retired veterans. Congregate meals, fitness, transportation, SHINE counseling, and Hampshire County VSO district referrals.",
    website_url: "https://www.belchertown.org/council-aging", phone: "413-323-0420",
    address: "60 State St", city: "Belchertown", zip: "01007",
    source_name: "Town of Belchertown" },

  { section: "B", title: "Ware Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Ware COA — Quaboag Valley senior center serving Ware + Hardwick + Warren + West Brookfield + Brookfield + Brimfield + Holland elders incl. retired veterans. Congregate meals, fitness, transportation, SHINE counseling, and Quaboag VSO district referrals.",
    website_url: "https://www.townofware.com/council-aging", phone: "413-967-9645",
    address: "1 Robbins Rd", city: "Ware", zip: "01082",
    source_name: "Town of Ware" },

  { section: "B", title: "South Hadley Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "South Hadley COA — Hampshire County senior center serving South Hadley + Granby elders incl. retired veterans. Congregate meals, fitness, transportation, SHINE counseling, and Hampshire County VSO district referrals.",
    website_url: "https://www.southhadleyma.gov/council-aging", phone: "413-538-5042",
    address: "45 Dayton St", city: "South Hadley", zip: "01075",
    source_name: "Town of South Hadley" },

  { section: "B", title: "Easthampton Council on Aging Enrichment Center",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Easthampton Enrichment Center / COA — Hampshire County senior center serving Easthampton + Westhampton elders incl. retired veterans. Congregate meals, fitness, transportation, SHINE counseling, and Hampshire County VSO district referrals.",
    website_url: "https://www.easthamptonma.gov/259/Council-on-Aging", phone: "413-527-6151",
    address: "19 Union St", city: "Easthampton", zip: "01027",
    source_name: "City of Easthampton" },

  { section: "B", title: "Franklin Area Survival Center Turners Falls",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Franklin Area Survival Center — Franklin County's primary food pantry + thrift store in Turners Falls (Montague). Free groceries, fresh produce, clothing, household supplies for low-income Franklin County residents incl. veterans.",
    website_url: "https://www.franklinareasurvivalcenter.org/", phone: "413-863-9549",
    address: "96 4th St", city: "Turners Falls", zip: "01376",
    source_name: "Franklin Area Survival Center" },

  { section: "B", title: "Amherst Survival Center",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Amherst Survival Center — Hampshire County's primary food pantry + community meal site serving Amherst + Pelham + Hadley + Sunderland + Leverett + Shutesbury low-income residents incl. veterans + UMass-area families. Walk-in groceries, hot meals, free clinic.",
    website_url: "https://www.amherstsurvival.org/", phone: "413-549-3968",
    address: "138 Sunderland Rd", city: "North Amherst", zip: "01059",
    source_name: "Amherst Survival Center" },

  { section: "B", title: "Northfield Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Northfield COA — North Franklin senior center serving Northfield + Bernardston + Gill + Warwick elders incl. retired veterans. Congregate meals, fitness, transportation to Greenfield medical, SHINE counseling, and Franklin County VSO district referrals.",
    website_url: "https://www.northfieldma.gov/council-aging", phone: "413-498-2186",
    address: "69 Main St", city: "Northfield", zip: "01360",
    source_name: "Town of Northfield" },

  // ===========================================================================
  // C. HAMPDEN SMALLER TOWNS (12)
  // ===========================================================================
  { section: "C", title: "Westfield Veterans Services Department",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "City of Westfield Veterans Services — M.G.L. c.115 state-veterans-benefits filing, VA disability claims assistance, emergency financial aid, and burial benefits coordination for Westfield + Russell + Montgomery + Southwick veterans + dependents.",
    website_url: "https://www.cityofwestfield.org/280/Veterans-Services", phone: "413-572-6203",
    address: "59 Court St", city: "Westfield", zip: "01085",
    source_name: "City of Westfield" },

  { section: "C", title: "Agawam Veterans Services Department",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of Agawam Veterans Services — M.G.L. c.115 state-veterans-benefits filing, VA disability claims assistance, emergency financial aid, and burial benefits coordination for Agawam + Feeding Hills veterans + dependents.",
    website_url: "https://www.agawam.ma.us/204/Veterans-Services", phone: "413-726-9716",
    address: "36 Main St", city: "Agawam", zip: "01001",
    source_name: "Town of Agawam" },

  { section: "C", title: "Chicopee Veterans Services Department",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "City of Chicopee Veterans Services — M.G.L. c.115 state-veterans-benefits filing, VA disability claims assistance, emergency financial aid, and burial benefits coordination for Chicopee + Aldenville + Willimansett veterans + dependents.",
    website_url: "https://www.chicopeema.gov/233/Veterans-Services", phone: "413-594-1490",
    address: "274 Front St", city: "Chicopee", zip: "01013",
    source_name: "City of Chicopee" },

  { section: "C", title: "East Longmeadow Veterans Services Department",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of East Longmeadow Veterans Services — M.G.L. c.115 state-veterans-benefits filing, VA disability claims assistance, emergency financial aid, and burial benefits coordination for East Longmeadow + Hampden veterans + dependents.",
    website_url: "https://www.eastlongmeadowma.gov/284/Veterans-Services", phone: "413-525-5400",
    address: "60 Center Sq", city: "East Longmeadow", zip: "01028",
    source_name: "Town of East Longmeadow" },

  { section: "C", title: "Longmeadow Veterans Services Department",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of Longmeadow Veterans Services — M.G.L. c.115 state-veterans-benefits filing, VA disability claims assistance, emergency financial aid, and burial benefits coordination for Longmeadow veterans + dependents.",
    website_url: "https://www.longmeadow.org/156/Veterans-Services", phone: "413-565-4150",
    address: "20 Williams St", city: "Longmeadow", zip: "01106",
    source_name: "Town of Longmeadow" },

  { section: "C", title: "Wilbraham Veterans Services Department",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of Wilbraham Veterans Services — M.G.L. c.115 state-veterans-benefits filing, VA disability claims assistance, emergency financial aid, and burial benefits coordination for Wilbraham + Hampden + Monson veterans + dependents.",
    website_url: "https://www.wilbraham-ma.gov/238/Veterans-Services", phone: "413-596-2811",
    address: "240 Springfield St", city: "Wilbraham", zip: "01095",
    source_name: "Town of Wilbraham" },

  { section: "C", title: "Ludlow Veterans Services Department",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of Ludlow Veterans Services — M.G.L. c.115 state-veterans-benefits filing, VA disability claims assistance, emergency financial aid, and burial benefits coordination for Ludlow veterans + dependents.",
    website_url: "https://www.ludlow.ma.us/231/Veterans-Services", phone: "413-583-5600",
    address: "488 Chapin St", city: "Ludlow", zip: "01056",
    source_name: "Town of Ludlow" },

  { section: "C", title: "Palmer Veterans Services Department",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of Palmer Veterans Services — M.G.L. c.115 state-veterans-benefits filing, VA disability claims assistance, emergency financial aid, and burial benefits coordination for Palmer + Three Rivers + Bondsville + Thorndike + Brimfield + Holland + Wales veterans.",
    website_url: "https://www.townofpalmer.com/veterans-services", phone: "413-283-2603",
    address: "4417 Main St", city: "Palmer", zip: "01069",
    source_name: "Town of Palmer" },

  { section: "C", title: "Monson Council on Aging Veterans Outreach",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Monson COA — Hampden County senior center serving Monson elders incl. retired veterans. Congregate meals, fitness, transportation, SHINE counseling, monthly veterans' coffee group, and Quaboag-area VSO district referrals.",
    website_url: "https://www.monson-ma.gov/council-aging", phone: "413-267-4108",
    address: "106 Main St", city: "Monson", zip: "01057",
    source_name: "Town of Monson" },

  { section: "C", title: "Westfield Food Pantry",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Westfield Food Pantry — primary food pantry serving Westfield + Russell + Montgomery + Southwick + Granville low-income residents incl. veterans. Free monthly groceries, fresh produce, holiday meal baskets.",
    website_url: "https://westfieldfoodpantry.org/", phone: "413-562-7461",
    address: "20 Free St", city: "Westfield", zip: "01085",
    source_name: "Westfield Food Pantry" },

  { section: "C", title: "Lorraine's Soup Kitchen Chicopee",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Lorraine's Soup Kitchen & Pantry — Chicopee-based soup kitchen + food pantry serving low-income Chicopee + Springfield + Holyoke + Aldenville residents incl. veterans. Daily hot meals + monthly grocery distribution + holiday meal program.",
    website_url: "https://lorrainessoupkitchen.org/", phone: "413-592-0118",
    address: "170 Pendexter Ave", city: "Chicopee", zip: "01013",
    source_name: "Lorraine's Soup Kitchen" },

  { section: "C", title: "Baystate Wing Hospital Palmer",
    cat: "healthcare", sub: "Primary Care",
    desc: "Baystate Wing Hospital — 74-bed community hospital in Palmer serving the Quaboag Valley (Palmer, Three Rivers, Brimfield, Holland, Wales, Monson, Ware, Belchertown, Warren, Hardwick). Emergency dept, primary care, behavioral health, surgery, and rural veteran care.",
    website_url: "https://www.baystatehealth.org/locations/baystate-wing-hospital", phone: "413-283-7651",
    address: "40 Wright St", city: "Palmer", zip: "01069",
    source_name: "Baystate Health" },

  // ===========================================================================
  // D. CAPE COD OUTER + MID (13)
  // ===========================================================================
  { section: "D", title: "Wellfleet Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Wellfleet COA — Outer Cape senior center serving Wellfleet elders incl. retired veterans. Congregate meals, fitness, transportation to Hyannis + Provincetown medical, SHINE counseling, and Outer Cape VSO district referrals.",
    website_url: "https://www.wellfleet-ma.gov/council-aging", phone: "508-349-0313",
    address: "715 Old Kings Hwy", city: "Wellfleet", zip: "02667",
    source_name: "Town of Wellfleet" },

  { section: "D", title: "Truro Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Truro COA — Outer Cape senior center serving Truro elders incl. retired veterans. Congregate meals, fitness, transportation to Hyannis + Provincetown medical, SHINE counseling, and Outer Cape VSO district referrals.",
    website_url: "https://www.truro-ma.gov/council-aging", phone: "508-487-2462",
    address: "7 Standish Way", city: "Truro", zip: "02666",
    source_name: "Town of Truro" },

  { section: "D", title: "Eastham Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Eastham COA — Outer Cape senior center serving Eastham elders incl. retired veterans. Congregate meals, fitness, transportation to Hyannis medical, SHINE counseling, and Outer Cape VSO district referrals.",
    website_url: "https://www.eastham-ma.gov/council-aging-coa", phone: "508-255-6164",
    address: "1405 Nauset Rd", city: "Eastham", zip: "02642",
    source_name: "Town of Eastham" },

  { section: "D", title: "Orleans Council on Aging Senior Center",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Orleans COA — Lower Cape senior center serving Orleans elders incl. retired veterans. Congregate meals, fitness, transportation to Hyannis medical, SHINE counseling, monthly veterans' coffee, and Lower Cape VSO district referrals.",
    website_url: "https://www.town.orleans.ma.us/council-aging", phone: "508-255-6333",
    address: "150 Rock Harbor Rd", city: "Orleans", zip: "02653",
    source_name: "Town of Orleans" },

  { section: "D", title: "Brewster Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Brewster COA — Lower Cape senior center serving Brewster elders incl. retired veterans. Congregate meals, fitness, transportation to Hyannis medical, SHINE counseling, and Lower Cape VSO district referrals.",
    website_url: "https://www.brewster-ma.gov/departments/council-on-aging", phone: "508-896-2737",
    address: "1673 Main St", city: "Brewster", zip: "02631",
    source_name: "Town of Brewster" },

  { section: "D", title: "Chatham Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Chatham COA — Lower Cape senior center serving Chatham + South Chatham + West Chatham elders incl. retired veterans. Congregate meals, fitness, transportation to Hyannis medical, SHINE counseling, and Lower Cape VSO district referrals.",
    website_url: "https://www.chatham-ma.gov/council-aging-coa", phone: "508-945-5190",
    address: "193 Stony Hill Rd", city: "Chatham", zip: "02633",
    source_name: "Town of Chatham" },

  { section: "D", title: "Harwich Veterans Services District",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Lower Cape Veterans Services District (Harwich HQ) — M.G.L. c.115 state-veterans-benefits filing, VA disability claims assistance, emergency financial aid, and burial benefits coordination for Harwich + Brewster + Chatham + Orleans + Eastham + Wellfleet + Truro + P-town veterans.",
    website_url: "https://www.harwich-ma.gov/veterans-services", phone: "508-430-7510",
    address: "100 Oak St", city: "Harwich", zip: "02645",
    source_name: "Town of Harwich" },

  { section: "D", title: "Dennis Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Dennis COA — Mid Cape senior center serving Dennis + Dennis Port + East Dennis + South Dennis + West Dennis elders incl. retired veterans. Congregate meals, fitness, transportation to Hyannis medical, SHINE counseling, and Mid Cape VSO district referrals.",
    website_url: "https://www.town.dennis.ma.us/council-aging", phone: "508-385-5067",
    address: "1045 Route 134", city: "South Dennis", zip: "02660",
    source_name: "Town of Dennis" },

  { section: "D", title: "Yarmouth Veterans Services District",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Yarmouth Veterans Services District — M.G.L. c.115 state-veterans-benefits filing, VA disability claims assistance, emergency financial aid, and burial benefits coordination for Yarmouth + Dennis + Barnstable veterans + dependents.",
    website_url: "https://www.yarmouth.ma.us/258/Veterans-Services", phone: "508-398-2231",
    address: "1146 Route 28", city: "South Yarmouth", zip: "02664",
    source_name: "Town of Yarmouth" },

  { section: "D", title: "Sandwich Council on Aging Veterans Outreach",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Sandwich COA — Upper Cape senior center serving Sandwich + East Sandwich + Forestdale elders incl. retired veterans. Congregate meals, fitness, transportation to Hyannis + Falmouth medical, SHINE counseling, monthly veterans' coffee, and Upper Cape VSO referrals.",
    website_url: "https://www.sandwichmass.org/council-aging-coa", phone: "508-888-4737",
    address: "270 Quaker Meeting House Rd", city: "East Sandwich", zip: "02537",
    source_name: "Town of Sandwich" },

  { section: "D", title: "Mashpee Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Mashpee COA — Upper Cape senior center serving Mashpee + New Seabury elders incl. retired veterans. Congregate meals, fitness, transportation to Hyannis + Falmouth medical, SHINE counseling, and Upper Cape VSO district referrals.",
    website_url: "https://www.mashpeema.gov/council-aging", phone: "508-539-1440",
    address: "26 Frank E Hicks Dr", city: "Mashpee", zip: "02649",
    source_name: "Town of Mashpee" },

  { section: "D", title: "Bourne Veterans Council",
    cat: "community-support", sub: "Veteran Service Organizations",
    desc: "Bourne Veterans Council — community-based volunteer organization coordinating veterans' parade, Memorial Day + Veterans Day ceremonies, scholarship awards, and outreach for Bourne + Buzzards Bay + Sagamore + Pocasset + Cataumet + Monument Beach veterans + families.",
    website_url: "https://www.townofbourne.com/veterans-services", phone: "508-759-0660",
    address: "24 Perry Ave", city: "Buzzards Bay", zip: "02532",
    source_name: "Town of Bourne" },

  { section: "D", title: "Outer Cape Health Services Provincetown",
    cat: "healthcare", sub: "Primary Care",
    desc: "Outer Cape Health Services Provincetown — federally qualified health center serving Outer Cape residents (Provincetown, Truro, Wellfleet) incl. retired veterans + isolated rural seniors. Sliding-scale primary care, behavioral health, dental, HIV care, and MAT.",
    website_url: "https://outercape.org/", phone: "508-487-9395",
    address: "49 Harry Kemp Way", city: "Provincetown", zip: "02657",
    source_name: "Outer Cape Health Services" },

  // ===========================================================================
  // E. CENTRAL + NORTH CENTRAL SMALLER (13)
  // ===========================================================================
  { section: "E", title: "Spencer Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Spencer COA — South Central Worcester County senior center serving Spencer + East Brookfield + Leicester elders incl. retired veterans. Congregate meals, fitness, transportation to Worcester medical, SHINE counseling, and Worcester County VSO referrals.",
    website_url: "https://www.spencerma.gov/council-aging", phone: "508-885-7546",
    address: "68 Main St", city: "Spencer", zip: "01562",
    source_name: "Town of Spencer" },

  { section: "E", title: "Sturbridge Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Sturbridge COA — South Worcester County senior center serving Sturbridge + Fiskdale elders incl. retired veterans. Congregate meals, fitness, transportation to Southbridge + Worcester medical, SHINE counseling, and Worcester County VSO referrals.",
    website_url: "https://www.sturbridge.gov/council-aging", phone: "508-347-7575",
    address: "480 Main St", city: "Sturbridge", zip: "01566",
    source_name: "Town of Sturbridge" },

  { section: "E", title: "Webster Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Webster COA — South Worcester County senior center serving Webster + Dudley + Oxford elders incl. retired veterans. Congregate meals, fitness, transportation to Worcester medical, SHINE counseling, and Worcester County VSO referrals.",
    website_url: "https://www.webster-ma.gov/council-aging", phone: "508-949-3845",
    address: "5 Church St", city: "Webster", zip: "01570",
    source_name: "Town of Webster" },

  { section: "E", title: "Dudley Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Dudley COA — South Worcester County senior center serving Dudley elders incl. retired veterans. Congregate meals, fitness, transportation to Webster + Worcester medical, SHINE counseling, and Worcester County VSO referrals.",
    website_url: "https://www.dudleyma.gov/council-aging", phone: "508-949-8004",
    address: "73 W Main St", city: "Dudley", zip: "01571",
    source_name: "Town of Dudley" },

  { section: "E", title: "Casaubon Senior Center Southbridge",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Casaubon Senior Center / Southbridge COA — South Central Worcester County senior center serving Southbridge elders incl. retired veterans. Congregate meals, fitness, transportation to Harrington Hospital + Worcester medical, SHINE counseling, and VSO referrals.",
    website_url: "https://www.southbridgemass.org/council-aging", phone: "508-764-5404",
    address: "153 Chestnut St", city: "Southbridge", zip: "01550",
    source_name: "Town of Southbridge" },

  { section: "E", title: "Templeton Council on Aging Veterans Outreach",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Templeton COA — North Central Worcester County senior center serving Templeton + Baldwinville + East Templeton + Phillipston elders incl. retired veterans. Congregate meals, fitness, transportation, SHINE counseling, monthly veterans' coffee, and VSO referrals.",
    website_url: "https://www.templeton1.org/council-aging", phone: "978-894-2700",
    address: "5 School St", city: "Baldwinville", zip: "01436",
    source_name: "Town of Templeton" },

  { section: "E", title: "Winchendon Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Winchendon COA — North Central Worcester County senior center serving Winchendon + Winchendon Springs elders incl. retired veterans. Congregate meals, fitness, transportation to Gardner + Athol medical, SHINE counseling, and Winchendon-area VSO referrals.",
    website_url: "https://www.townofwinchendon.com/council-aging", phone: "978-297-3155",
    address: "52 Murdock Ave", city: "Winchendon", zip: "01475",
    source_name: "Town of Winchendon" },

  { section: "E", title: "UMass Memorial HealthAlliance Hospital Burbank Campus Fitchburg",
    cat: "healthcare", sub: "Specialty Care",
    desc: "UMass Memorial HealthAlliance-Clinton Hospital Burbank Campus Fitchburg — community hospital serving North Central MA. Emergency dept, primary care, surgery, behavioral health, oncology, and rural veterans care across Fitchburg + Leominster + Gardner + Templeton + Winchendon region.",
    website_url: "https://www.ummhealth.org/healthalliance-clinton-hospital", phone: "978-343-5000",
    address: "275 Nichols Rd", city: "Fitchburg", zip: "01420",
    source_name: "UMass Memorial Health" },

  { section: "E", title: "Webster-Dudley Food Share",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Webster-Dudley Food Share — primary food pantry serving Webster + Dudley + Oxford + Charlton + Sturbridge low-income residents incl. veterans. Free weekly groceries, fresh produce, holiday meal baskets.",
    website_url: "https://websterdudleyfoodshare.org/", phone: "508-949-2204",
    address: "55 Thompson Rd", city: "Webster", zip: "01570",
    source_name: "Webster-Dudley Food Share" },

  { section: "E", title: "Tri-Valley Inc Dudley",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Tri-Valley Inc — South Central Worcester County Aging Services Access Point. In-home services, congregate meals, transportation, and caregiver support for elders + retired veterans across Webster + Dudley + Oxford + Charlton + Spencer + Southbridge + Sturbridge region.",
    website_url: "https://www.tves.org/", phone: "508-949-6640",
    address: "10 Mill St", city: "Dudley", zip: "01571",
    source_name: "Tri-Valley Inc." },

  { section: "E", title: "Spencer Veterans Services District",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Spencer + Brookfields Veterans Services District — M.G.L. c.115 state-veterans-benefits filing, VA disability claims assistance, emergency financial aid, and burial benefits coordination for Spencer + Brookfield + East Brookfield + North Brookfield + West Brookfield veterans.",
    website_url: "https://www.spencerma.gov/veterans-services", phone: "508-885-7510",
    address: "157 Main St", city: "Spencer", zip: "01562",
    source_name: "Town of Spencer" },

  { section: "E", title: "North Central MA Veterans Outreach Center Gardner",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Mount Wachusett Community College Veterans Center Gardner — North Central MA veterans outreach + resource hub. VA education-benefits processing, VSO referrals, peer support groups, and resource navigation for North Central MA veterans + dependents.",
    website_url: "https://mwcc.edu/student-life/veterans-services/", phone: "978-630-9220",
    address: "444 Green St", city: "Gardner", zip: "01440",
    source_name: "Mount Wachusett Community College" },

  { section: "E", title: "Sturbridge Veterans Services District",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Sturbridge Area Veterans Services District — M.G.L. c.115 state-veterans-benefits filing, VA disability claims assistance, emergency financial aid, and burial benefits coordination for Sturbridge + Brimfield + Holland + Wales + Southbridge area veterans + dependents.",
    website_url: "https://www.sturbridge.gov/veterans-services", phone: "508-347-2515",
    address: "308 Main St", city: "Sturbridge", zip: "01566",
    source_name: "Town of Sturbridge" },

  // ===========================================================================
  // F. SOUTHCOAST SMALLER TOWNS (12)
  // ===========================================================================
  { section: "F", title: "Wareham Veterans Services Department",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of Wareham Veterans Services — M.G.L. c.115 state-veterans-benefits filing, VA disability claims assistance, emergency financial aid, and burial benefits coordination for Wareham + Onset + East Wareham veterans + dependents.",
    website_url: "https://www.wareham.ma.us/veterans-services", phone: "508-291-3100",
    address: "54 Marion Rd", city: "Wareham", zip: "02571",
    source_name: "Town of Wareham" },

  { section: "F", title: "Acushnet Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Acushnet COA — SouthCoast senior center serving Acushnet elders incl. retired veterans. Congregate meals, fitness, transportation to New Bedford medical, SHINE counseling, and SouthCoast VSO district referrals.",
    website_url: "https://www.acushnet.ma.us/council-aging", phone: "508-998-0280",
    address: "59½ S Main St", city: "Acushnet", zip: "02743",
    source_name: "Town of Acushnet" },

  { section: "F", title: "Westport Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Westport COA — SouthCoast senior center serving Westport + Central Village + Westport Point elders incl. retired veterans. Congregate meals, fitness, transportation to Fall River + New Bedford medical, SHINE counseling, and SouthCoast VSO district referrals.",
    website_url: "https://www.westport-ma.gov/council-aging", phone: "508-636-1026",
    address: "75 Reed Rd", city: "Westport", zip: "02790",
    source_name: "Town of Westport" },

  { section: "F", title: "Fairhaven Council on Aging Veterans Outreach",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Fairhaven COA — SouthCoast senior center serving Fairhaven elders incl. retired veterans. Congregate meals, fitness, transportation to New Bedford medical, SHINE counseling, monthly veterans' coffee group, and SouthCoast VSO district referrals.",
    website_url: "https://www.fairhaven-ma.gov/council-aging-coa", phone: "508-979-4029",
    address: "229 Huttleston Ave", city: "Fairhaven", zip: "02719",
    source_name: "Town of Fairhaven" },

  { section: "F", title: "Mattapoisett Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Mattapoisett COA — SouthCoast senior center serving Mattapoisett elders incl. retired veterans. Congregate meals, fitness, transportation to New Bedford + Wareham medical, SHINE counseling, and SouthCoast VSO district referrals.",
    website_url: "https://www.mattapoisett.net/council-aging", phone: "508-758-4110",
    address: "17 Barstow St", city: "Mattapoisett", zip: "02739",
    source_name: "Town of Mattapoisett" },

  { section: "F", title: "Marion Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Marion COA — SouthCoast senior center serving Marion elders incl. retired veterans. Congregate meals, fitness, transportation to Wareham + New Bedford medical, SHINE counseling, and SouthCoast VSO district referrals.",
    website_url: "https://www.marionma.gov/council-aging", phone: "508-748-3570",
    address: "465 Mill St", city: "Marion", zip: "02738",
    source_name: "Town of Marion" },

  { section: "F", title: "Carver Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Carver COA — Plymouth County senior center serving Carver + South Carver elders incl. retired veterans. Congregate meals, fitness, transportation to Plymouth + Wareham medical, SHINE counseling, and Plymouth County VSO district referrals.",
    website_url: "https://www.carverma.gov/council-aging", phone: "508-866-3677",
    address: "48 Meadowbrook Way", city: "Carver", zip: "02330",
    source_name: "Town of Carver" },

  { section: "F", title: "Middleboro Council on Aging Veterans Outreach",
    cat: "community-support", sub: "Veteran Outreach Programs",
    desc: "Middleboro COA — Plymouth County senior center serving Middleboro elders incl. retired veterans. Congregate meals, fitness, transportation, SHINE counseling, monthly veterans' coffee group, and Plymouth County VSO district referrals.",
    website_url: "https://www.middleborough.com/council-aging", phone: "508-946-2490",
    address: "558 Plymouth St", city: "Middleboro", zip: "02346",
    source_name: "Town of Middleboro" },

  { section: "F", title: "Tobey Hospital Wareham",
    cat: "healthcare", sub: "Primary Care",
    desc: "Tobey Hospital (Southcoast Health) — 70-bed community hospital in Wareham serving SouthCoast + Upper Cape (Wareham, Marion, Mattapoisett, Rochester, Carver, Plymouth, Bourne). Emergency dept, primary care, surgery, behavioral health, and rural veterans care.",
    website_url: "https://www.southcoast.org/tobey-hospital/", phone: "508-295-0880",
    address: "43 High St", city: "Wareham", zip: "02571",
    source_name: "Southcoast Health" },

  { section: "F", title: "Coastline Elderly Services New Bedford",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Coastline Elderly Services — Greater New Bedford Aging Services Access Point. In-home services, congregate meals, transportation, and caregiver support for elders + retired veterans across New Bedford + Acushnet + Dartmouth + Fairhaven + Mattapoisett + Marion + Rochester.",
    website_url: "https://www.coastlinenb.org/", phone: "508-999-6400",
    address: "1646 Purchase St", city: "New Bedford", zip: "02740",
    source_name: "Coastline Elderly Services" },

  { section: "F", title: "Damien's Place of Wareham",
    cat: "food-assistance", sub: "Food Pantries",
    desc: "Damien's Place of Wareham — primary food pantry serving Wareham + Onset + Marion + Mattapoisett + Rochester low-income residents incl. veterans. Free weekly groceries, fresh produce, hot meals, and Christmas Toy Drive for SouthCoast families.",
    website_url: "https://www.damienspantry.org/", phone: "508-291-2030",
    address: "11 Maple Springs Rd", city: "East Wareham", zip: "02538",
    source_name: "Damien's Place" },

  { section: "F", title: "Greater New Bedford Veterans Center",
    cat: "mental-health", sub: "Vet Centers",
    desc: "New Bedford Vet Center (VA Readjustment Counseling) — community-based vet center providing free confidential readjustment counseling, PTSD + MST support, family counseling, and bereavement counseling for combat veterans + their families across SouthCoast + Cape Cod region.",
    website_url: "https://www.va.gov/find-locations/facility/vc_0203V/", phone: "508-994-3331",
    address: "468 N Bedford St", city: "New Bedford", zip: "02746",
    source_name: "VA Readjustment Counseling Service" },

  // ===========================================================================
  // G. ISLANDS CLOSEOUT (5)
  // ===========================================================================
  { section: "G", title: "Tisbury Council on Aging Vineyard Haven",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Tisbury COA — Martha's Vineyard senior center in Vineyard Haven serving Tisbury elders incl. retired veterans. Congregate meals, fitness, transportation to MV Hospital, SHINE counseling, and Dukes County VSO referrals.",
    website_url: "https://www.tisburyma.gov/council-aging", phone: "508-696-4205",
    address: "34 Pine Tree Rd", city: "Vineyard Haven", zip: "02568",
    source_name: "Town of Tisbury" },

  { section: "G", title: "Oak Bluffs Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "Oak Bluffs COA — Martha's Vineyard senior center serving Oak Bluffs elders incl. retired veterans. Congregate meals, fitness, transportation to MV Hospital, SHINE counseling, and Dukes County VSO referrals.",
    website_url: "https://www.oakbluffsma.gov/council-aging", phone: "508-693-4509",
    address: "4 Wamsutta Ave", city: "Oak Bluffs", zip: "02557",
    source_name: "Town of Oak Bluffs" },

  { section: "G", title: "West Tisbury Council on Aging",
    cat: "community-support", sub: "Senior / Retired Veteran Social Programs",
    desc: "West Tisbury COA — Martha's Vineyard senior center serving West Tisbury + Chilmark + Aquinnah up-island elders incl. retired veterans. Congregate meals, fitness, transportation to MV Hospital, SHINE counseling, and Dukes County VSO referrals.",
    website_url: "https://www.westtisbury-ma.gov/council-aging", phone: "508-693-9085",
    address: "1059 State Rd", city: "West Tisbury", zip: "02575",
    source_name: "Town of West Tisbury" },

  { section: "G", title: "Martha's Vineyard Hospital Oak Bluffs",
    cat: "healthcare", sub: "Specialty Care",
    desc: "Martha's Vineyard Hospital (Mass General Brigham) — 25-bed critical-access community hospital serving year-round MV residents (Tisbury, Oak Bluffs, Edgartown, West Tisbury, Chilmark, Aquinnah) incl. retired island veterans. Emergency, primary care, surgery, telehealth specialty.",
    website_url: "https://www.mvhospital.org/", phone: "508-693-0410",
    address: "1 Hospital Rd", city: "Oak Bluffs", zip: "02557",
    source_name: "Martha's Vineyard Hospital" },

  { section: "G", title: "Nantucket Veterans Services",
    cat: "va-benefits", sub: "County Veterans Service Offices",
    desc: "Town of Nantucket Veterans Services — M.G.L. c.115 state-veterans-benefits filing, VA disability claims assistance, emergency financial aid, and burial benefits coordination for year-round Nantucket Island veterans + dependents.",
    website_url: "https://www.nantucket-ma.gov/233/Veterans-Services", phone: "508-228-7237",
    address: "16 Broad St", city: "Nantucket", zip: "02554",
    source_name: "Town of Nantucket" },
];

await runSeed(ROWS, {
  state: "MA",
  commit: COMMIT,
  scriptName: "seed-ma-wave6.ts (Golden Standard Wave 6 / rural + regional closeout)",
  urlCheckTimeoutMs: 12000,
  allowBrokenUrls: ALLOW_BROKEN_URLS,
  allowZipBleed: ALLOW_ZIP_BLEED,
  sectionLabels: {
    A: "Berkshires Deep",
    B: "Franklin + Hampshire Rural",
    C: "Hampden Smaller Towns",
    D: "Cape Cod Outer + Mid",
    E: "Central + North Central Smaller",
    F: "SouthCoast Smaller Towns",
    G: "Islands Closeout",
  },
});
