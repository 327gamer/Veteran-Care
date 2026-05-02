/**
 * VIRGINIA — WAVE 8 (FL-pattern category-depth fill, ~62 rows)
 *
 * Founder release 2026-05-02 (Option D): deepen 3 thinnest categories statewide
 * — disabled-veterans (was 7), crisis-help (was 8), end-of-life-services (was 10).
 * Same FL Wave system. NO insurance touch. Speed > perfection. STOP after W8.
 *
 * Sections:
 *   A  Disabled Veterans (DAV chapters + WWP/PVA/SF&AF + adaptive sports + Gold Star)
 *   B  Crisis Help (Vet Centers + suicide prevention + mobile crisis + 988)
 *   C  End-of-Life Services (hospice + VA cemeteries + Gold Star + survivor benefits)
 *
 * APPENDS to W1-W7 = 687 → post-W8 ~745.
 *
 * Run:
 *   tsx scripts/seed-va-wave8.ts                                                 # dry-run
 *   tsx scripts/seed-va-wave8.ts --commit --allow-broken-urls --allow-zip-bleed  # write
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");
const ALLOW_ZIP_BLEED = process.argv.includes("--allow-zip-bleed");

const ROWS: SeedRow[] = [
  // ===========================================================================
  // A. DISABLED VETERANS (was 7 → +22)
  // ===========================================================================
  { section: "A", title: "DAV Department of Virginia HQ",
    cat: "disabled-veterans", sub: "Disability Benefits & Claims",
    desc: "Disabled American Veterans Department of Virginia state HQ — coordinates 80+ chapters statewide; accredited NSO claim representation, transportation network, legislative advocacy for service-connected veterans.",
    website_url: "https://davva.org/", phone: "804-353-1647",
    address: "8200 Mountcastle Rd", city: "Richmond", zip: "23235",
    source_name: "DAV Department of Virginia" },

  { section: "A", title: "DAV Chapter 6 Norfolk",
    cat: "disabled-veterans", sub: "Accessible Community Groups",
    desc: "DAV Chapter 6 Norfolk — peer support, transportation, claim assistance, legislative advocacy for service-connected veterans across Hampton Roads.",
    website_url: "https://davva.org/", phone: "757-625-2098",
    address: "1532 Tidewater Dr", city: "Norfolk", zip: "23504",
    source_name: "DAV Chapter 6" },

  { section: "A", title: "DAV Chapter 12 Richmond",
    cat: "disabled-veterans", sub: "Accessible Community Groups",
    desc: "DAV Chapter 12 Richmond — peer support, transportation, claim assistance, legislative advocacy for service-connected veterans across Greater Richmond.",
    website_url: "https://davva.org/", phone: "804-353-1647",
    address: "8200 Mountcastle Rd", city: "Richmond", zip: "23235",
    source_name: "DAV Chapter 12" },

  { section: "A", title: "DAV Chapter 20 Roanoke",
    cat: "disabled-veterans", sub: "Accessible Community Groups",
    desc: "DAV Chapter 20 Roanoke — peer support, transportation, claim assistance for service-connected veterans across Roanoke Valley + New River Valley + Salem VAMC catchment.",
    website_url: "https://davva.org/", phone: "540-982-2463",
    address: "208 Albemarle Ave SE", city: "Roanoke", zip: "24013",
    source_name: "DAV Chapter 20" },

  { section: "A", title: "DAV Chapter 25 Newport News",
    cat: "disabled-veterans", sub: "Accessible Community Groups",
    desc: "DAV Chapter 25 Newport News — peer support, transportation, claim assistance for service-connected veterans across Peninsula + Hampton VAMC catchment.",
    website_url: "https://davva.org/", phone: "757-380-2498",
    address: "13892 Warwick Blvd", city: "Newport News", zip: "23602",
    source_name: "DAV Chapter 25" },

  { section: "A", title: "DAV Chapter 35 Virginia Beach",
    cat: "disabled-veterans", sub: "Accessible Community Groups",
    desc: "DAV Chapter 35 Virginia Beach — peer support, transportation, claim assistance for service-connected veterans across Virginia Beach + Chesapeake.",
    website_url: "https://davva.org/", phone: "757-422-9600",
    address: "5728 Bayside Rd", city: "Virginia Beach", zip: "23455",
    source_name: "DAV Chapter 35" },

  { section: "A", title: "DAV Chapter 90 Fredericksburg",
    cat: "disabled-veterans", sub: "Accessible Community Groups",
    desc: "DAV Chapter 90 Fredericksburg — peer support, transportation, claim assistance for service-connected veterans across Stafford/Spotsylvania/Fredericksburg.",
    website_url: "https://davva.org/", phone: "540-373-0773",
    address: "PO Box 1184", city: "Fredericksburg", zip: "22402",
    source_name: "DAV Chapter 90" },

  { section: "A", title: "Wounded Warrior Project Mid-Atlantic Field Office",
    cat: "disabled-veterans", sub: "Mental Health & PTSD Support",
    desc: "WWP Mid-Atlantic field office — Combat Stress Recovery Program (Project Odyssey), Independence Program, Warriors to Work for post-9/11 wounded service members across VA + MD + DC + DE.",
    website_url: "https://www.woundedwarriorproject.org/", phone: "888-997-2586",
    address: "1120 G St NW, Suite 700", city: "Washington", zip: "20005",
    source_name: "Wounded Warrior Project" },

  { section: "A", title: "Semper Fi & America's Fund",
    cat: "disabled-veterans", sub: "Healthcare & Rehabilitation",
    desc: "Semper Fi & America's Fund — case management, financial assistance, family support, transition workshops, adaptive sports for combat-wounded, critically ill, catastrophically injured veterans of all branches.",
    website_url: "https://thefund.org/", phone: "760-725-3680",
    address: "825 College Blvd, Suite 102 PMB 609", city: "Oceanside", zip: "92057",
    source_name: "Semper Fi & America's Fund" },

  { section: "A", title: "Hope For The Warriors",
    cat: "disabled-veterans", sub: "Caregiver & Family Support",
    desc: "Hope For The Warriors — clinical health & wellness, transition services, sports & recreation, immediate-needs financial assistance for post-9/11 service members + families with combat wounds + caregivers + Gold Star.",
    website_url: "https://www.hopeforthewarriors.org/", phone: "877-246-7349",
    address: "8003 Forbes Pl, Suite 201", city: "Springfield", zip: "22151",
    source_name: "Hope For The Warriors" },

  { section: "A", title: "Operation Second Chance",
    cat: "disabled-veterans", sub: "Caregiver & Family Support",
    desc: "Operation Second Chance Germantown — financial assistance, retreats, mentoring for post-9/11 wounded/injured/ill veterans + families across VA/MD/DC; serves recovering veterans at Walter Reed + Bethesda.",
    website_url: "https://operationsecondchance.org/", phone: "301-865-4101",
    address: "20251 Century Blvd, Suite 110", city: "Germantown", zip: "20874",
    source_name: "Operation Second Chance" },

  { section: "A", title: "Paralyzed Veterans of America Mid-Atlantic Chapter",
    cat: "disabled-veterans", sub: "Adaptive Equipment & Assistive Technology",
    desc: "PVA Mid-Atlantic Chapter Richmond — accredited national service officers, adaptive sports, accessibility advocacy, peer mentoring for veterans with spinal cord injury/disease + ALS across VA + DC + MD.",
    website_url: "https://midatlantic.pva.org/", phone: "804-378-9809",
    address: "9650 Mayland Dr, Suite 102", city: "Richmond", zip: "23233",
    source_name: "Paralyzed Veterans of America" },

  { section: "A", title: "Project Healing Waters Fly Fishing Richmond VAMC",
    cat: "disabled-veterans", sub: "Adaptive Recreation",
    desc: "Project Healing Waters Richmond McGuire VAMC chapter — therapeutic fly-fishing, fly-tying, rod-building education + outings for disabled active military + disabled veterans for physical + emotional rehab.",
    website_url: "https://projecthealingwaters.org/", phone: "540-220-7234",
    address: "1201 Broad Rock Blvd", city: "Richmond", zip: "23249",
    source_name: "Project Healing Waters Fly Fishing" },

  { section: "A", title: "Project Healing Waters Fly Fishing Hampton VAMC",
    cat: "disabled-veterans", sub: "Adaptive Recreation",
    desc: "Project Healing Waters Hampton VAMC chapter — therapeutic fly-fishing, fly-tying, rod-building + outings for disabled active military + disabled veterans across Tidewater for physical + emotional rehab.",
    website_url: "https://projecthealingwaters.org/", phone: "757-722-9961",
    address: "100 Emancipation Dr", city: "Hampton", zip: "23667",
    source_name: "Project Healing Waters Fly Fishing" },

  { section: "A", title: "Project Healing Waters Fly Fishing Salem VAMC",
    cat: "disabled-veterans", sub: "Adaptive Recreation",
    desc: "Project Healing Waters Salem VAMC chapter — therapeutic fly-fishing, fly-tying, rod-building + outings for disabled active military + disabled veterans across SW Virginia for physical + emotional rehab.",
    website_url: "https://projecthealingwaters.org/", phone: "540-982-2463",
    address: "1970 Roanoke Blvd", city: "Salem", zip: "24153",
    source_name: "Project Healing Waters Fly Fishing" },

  { section: "A", title: "Heroes on the Water Virginia Chapter",
    cat: "disabled-veterans", sub: "Adaptive Recreation",
    desc: "Heroes on the Water Virginia chapters — therapeutic kayak fishing outings for active duty + veterans + first responders across Tidewater + Northern Neck + Northern Virginia.",
    website_url: "https://heroesonthewater.org/", phone: "830-358-5867",
    address: "1313 Spring Pky", city: "Plano", zip: "75023",
    source_name: "Heroes on the Water" },

  { section: "A", title: "Veterans Adaptive Sports & Training (VAST) Hampton",
    cat: "disabled-veterans", sub: "Disability Wellness & Activity Programs",
    desc: "Hampton VAMC Adaptive Sports program — wheelchair basketball, sit-volleyball, archery, swimming, golf, cycling clinics for disabled veterans across Tidewater; pathway to National Veterans Wheelchair Games.",
    website_url: "https://www.va.gov/hampton-health-care/", phone: "757-722-9961",
    address: "100 Emancipation Dr", city: "Hampton", zip: "23667",
    source_name: "VA Hampton Healthcare System Adaptive Sports" },

  { section: "A", title: "Quality of Life Foundation",
    cat: "disabled-veterans", sub: "Caregiver & Family Support",
    desc: "Quality of Life Foundation Vienna — care coordination, financial planning, family advocacy, peer mentoring for severely wounded post-9/11 veterans + their families; serves NoVA + DMV region.",
    website_url: "https://www.qolfoundation.org/", phone: "703-848-9437",
    address: "8200 Greensboro Dr, Suite 900", city: "McLean", zip: "22102",
    source_name: "Quality of Life Foundation" },

  { section: "A", title: "Final Salute Inc",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Final Salute Inc — transitional housing, financial assistance, employment support, mental-health navigation specifically for homeless women veterans + their children; HQ McLean serving DMV region.",
    website_url: "https://www.finalsaluteinc.org/", phone: "703-224-8845",
    address: "PO Box 244", city: "Lorton", zip: "22199",
    source_name: "Final Salute Inc" },

  { section: "A", title: "Sentinels of Freedom Virginia Chapter",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Sentinels of Freedom — life-scholarship sponsorships for severely wounded post-9/11 veterans (housing, education, employment, transportation, mentoring); active VA recipients in NoVA + Hampton Roads.",
    website_url: "https://sentinelsoffreedom.org/", phone: "925-380-6342",
    address: "PO Box 5394", city: "San Ramon", zip: "94583",
    source_name: "Sentinels of Freedom" },

  { section: "A", title: "Combat Veterans Motorcycle Association VA Chapter 25-1",
    cat: "disabled-veterans", sub: "Accessible Community Groups",
    desc: "CVMA Virginia Chapter 25-1 Richmond/Central VA — combat-veteran peer brotherhood, charitable rides supporting wounded veterans + families + military service organizations across Central Virginia.",
    website_url: "https://www.cvma25-1.com/", phone: "804-921-2862",
    address: "PO Box 35185", city: "Richmond", zip: "23235",
    source_name: "Combat Veterans Motorcycle Association" },

  { section: "A", title: "Veterans Moving Forward",
    cat: "disabled-veterans", sub: "Healthcare & Rehabilitation",
    desc: "Veterans Moving Forward Dulles — provides service dogs at no cost to veterans with physical and/or mental health conditions; mobility, PTSD-trained, hearing-trained dogs; serves DMV + national.",
    website_url: "https://www.vetsfwd.org/", phone: "571-205-2667",
    address: "23215 Stringfellow Rd", city: "Chantilly", zip: "20152",
    source_name: "Veterans Moving Forward" },

  // ===========================================================================
  // B. CRISIS HELP (was 8 → +22)
  // ===========================================================================
  { section: "B", title: "Veterans Crisis Line (988 + Press 1)",
    cat: "crisis-help", sub: "Veterans Crisis Line",
    desc: "Veterans Crisis Line — 24/7 confidential crisis support for veterans + families: dial 988 then press 1, text 838255, or chat online. Connects to responders many of whom are veterans themselves.",
    website_url: "https://www.veteranscrisisline.net/", phone: "988",
    address: "810 Vermont Ave NW", city: "Washington", zip: "20420",
    source_name: "Veterans Crisis Line (VA)" },

  { section: "B", title: "Vet Center Norfolk",
    cat: "crisis-help", sub: "Emergency Mental Health",
    desc: "Norfolk Vet Center — readjustment counseling for combat veterans, military sexual trauma survivors, bereavement counseling for survivors, group + individual + couples + family counseling. Free, confidential.",
    website_url: "https://www.va.gov/find-locations/facility/vc_0407V", phone: "757-623-7584",
    address: "1711 Church St, Suite A & B", city: "Norfolk", zip: "23504",
    source_name: "VA Readjustment Counseling Service" },

  { section: "B", title: "Vet Center Virginia Beach",
    cat: "crisis-help", sub: "Emergency Mental Health",
    desc: "Virginia Beach Vet Center — readjustment counseling for combat veterans, MST survivors, bereavement counseling for survivors, group + individual + family counseling. Free, confidential.",
    website_url: "https://www.va.gov/find-locations/facility/vc_0420V", phone: "757-248-3665",
    address: "324 Southport Cir, Suite 102", city: "Virginia Beach", zip: "23452",
    source_name: "VA Readjustment Counseling Service" },

  { section: "B", title: "Vet Center Richmond",
    cat: "crisis-help", sub: "Emergency Mental Health",
    desc: "Richmond Vet Center — readjustment counseling for combat veterans, MST survivors, bereavement counseling, group + individual + couples + family counseling. Free, confidential.",
    website_url: "https://www.va.gov/find-locations/facility/vc_0419V", phone: "804-353-8958",
    address: "4904 Fitzhugh Ave", city: "Richmond", zip: "23230",
    source_name: "VA Readjustment Counseling Service" },

  { section: "B", title: "Vet Center Roanoke",
    cat: "crisis-help", sub: "Emergency Mental Health",
    desc: "Roanoke Vet Center — readjustment counseling for combat veterans, MST survivors, bereavement counseling, group + individual + family counseling for SW Virginia. Free, confidential.",
    website_url: "https://www.va.gov/find-locations/facility/vc_0413V", phone: "540-342-9726",
    address: "1401 Franklin Rd SW, Suite 200", city: "Roanoke", zip: "24016",
    source_name: "VA Readjustment Counseling Service" },

  { section: "B", title: "Vet Center Alexandria",
    cat: "crisis-help", sub: "Emergency Mental Health",
    desc: "Alexandria Vet Center — readjustment counseling for combat veterans, MST survivors, bereavement counseling, group + individual + family counseling for Northern Virginia. Free, confidential.",
    website_url: "https://www.va.gov/find-locations/facility/vc_0901V", phone: "703-360-8633",
    address: "6940 South Kings Hwy, Suite 204", city: "Alexandria", zip: "22310",
    source_name: "VA Readjustment Counseling Service" },

  { section: "B", title: "Vet Center Springfield (Northern Virginia)",
    cat: "crisis-help", sub: "Emergency Mental Health",
    desc: "Northern Virginia Vet Center Springfield — readjustment counseling for combat veterans, MST survivors, bereavement counseling, group + individual + family counseling. Free, confidential.",
    website_url: "https://www.va.gov/find-locations/facility/vc_0427V", phone: "703-360-8633",
    address: "7011 Calamo St, Suite 101", city: "Springfield", zip: "22150",
    source_name: "VA Readjustment Counseling Service" },

  { section: "B", title: "Vet Center Newport News",
    cat: "crisis-help", sub: "Emergency Mental Health",
    desc: "Newport News Vet Center — readjustment counseling for combat veterans, MST survivors, bereavement counseling, group + individual + family counseling for Peninsula + Williamsburg. Free, confidential.",
    website_url: "https://www.va.gov/find-locations/facility/vc_0421V", phone: "757-688-6097",
    address: "11748 Jefferson Ave, Suite 7A", city: "Newport News", zip: "23606",
    source_name: "VA Readjustment Counseling Service" },

  { section: "B", title: "Vet Center Charlottesville",
    cat: "crisis-help", sub: "Emergency Mental Health",
    desc: "Charlottesville Vet Center — readjustment counseling for combat veterans, MST survivors, bereavement counseling, group + individual + family counseling for Central Virginia. Free, confidential.",
    website_url: "https://www.va.gov/find-locations/facility/vc_0526V", phone: "434-872-4761",
    address: "1700 Monticello Rd, Suite 101", city: "Charlottesville", zip: "22902",
    source_name: "VA Readjustment Counseling Service" },

  { section: "B", title: "Vet Center Cedar Bluff (Coalfield)",
    cat: "crisis-help", sub: "Emergency Mental Health",
    desc: "Cedar Bluff Vet Center — readjustment counseling for combat veterans, MST survivors, bereavement counseling for SW VA Coalfields + Mountain Empire (Buchanan/Russell/Tazewell/Dickenson). Free, confidential.",
    website_url: "https://www.va.gov/find-locations/facility/vc_0908V", phone: "276-964-9200",
    address: "1090 Ben Bolt Ave", city: "Tazewell", zip: "24651",
    source_name: "VA Readjustment Counseling Service" },

  { section: "B", title: "Vet Center Fredericksburg",
    cat: "crisis-help", sub: "Emergency Mental Health",
    desc: "Fredericksburg Vet Center — readjustment counseling for combat veterans, MST survivors, bereavement counseling for Stafford/Spotsylvania/Fredericksburg/Caroline/King George. Free, confidential.",
    website_url: "https://www.va.gov/find-locations/facility/vc_0426V", phone: "540-370-4974",
    address: "1200 Sunday Dr, Suite 100", city: "Fredericksburg", zip: "22408",
    source_name: "VA Readjustment Counseling Service" },

  { section: "B", title: "Hampton VAMC Suicide Prevention Program",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Hampton VAMC Suicide Prevention Coordinator — same-day mental-health, safety planning, lethal-means counseling, REACH outreach for high-risk Tidewater enrolled veterans + caregivers.",
    website_url: "https://www.va.gov/hampton-health-care/programs/suicide-prevention/", phone: "757-722-9961",
    address: "100 Emancipation Dr", city: "Hampton", zip: "23667",
    source_name: "VA Hampton Healthcare System" },

  { section: "B", title: "Richmond McGuire VAMC Suicide Prevention Program",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Central Virginia VAMC Richmond Suicide Prevention Coordinator — same-day mental-health, safety planning, lethal-means counseling, REACH outreach for high-risk Central VA enrolled veterans + caregivers.",
    website_url: "https://www.va.gov/central-virginia-health-care/programs/suicide-prevention/", phone: "804-675-5000",
    address: "1201 Broad Rock Blvd", city: "Richmond", zip: "23249",
    source_name: "VA Central Virginia Healthcare System" },

  { section: "B", title: "Salem VAMC Suicide Prevention Program",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Salem VAMC Suicide Prevention Coordinator — same-day mental-health, safety planning, lethal-means counseling, REACH outreach for high-risk SW VA enrolled veterans + caregivers.",
    website_url: "https://www.va.gov/salem-health-care/programs/suicide-prevention/", phone: "540-982-2463",
    address: "1970 Roanoke Blvd", city: "Salem", zip: "24153",
    source_name: "VA Salem Healthcare System" },

  { section: "B", title: "Stop Soldier Suicide",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Stop Soldier Suicide — confidential 1:1 case management for active duty + veterans + families at risk of suicide; clinical risk assessment, peer-to-peer support, connection to VA + community resources.",
    website_url: "https://stopsoldiersuicide.org/", phone: "844-907-7867",
    address: "5511 Capital Center Dr, Suite 320", city: "Raleigh", zip: "27606",
    source_name: "Stop Soldier Suicide" },

  { section: "B", title: "Mission 22",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Mission 22 — combats veteran suicide through awareness, treatment program funding, post-traumatic growth retreats, family support; partners w/ VA + national clinicians; serves all VA veterans.",
    website_url: "https://www.mission22.com/", phone: "800-401-7039",
    address: "PO Box 1413", city: "Bend", zip: "97709",
    source_name: "Mission 22" },

  { section: "B", title: "Give an Hour Virginia",
    cat: "crisis-help", sub: "Emergency Mental Health",
    desc: "Give an Hour — free confidential mental-health services from licensed providers for post-9/11 veterans + service members + families + caregivers; statewide VA volunteer-clinician network.",
    website_url: "https://giveanhour.org/", phone: "703-525-7355",
    address: "4350 N Fairfax Dr, Suite 740", city: "Arlington", zip: "22203",
    source_name: "Give an Hour" },

  { section: "B", title: "Mobile Crisis Hampton-Newport News CSB",
    cat: "crisis-help", sub: "Mobile Crisis Teams",
    desc: "Hampton-Newport News CSB Mobile Crisis Team — 24/7 community-based emergency mental-health response statewide via Marcus Alert / 988 system for residents of Hampton + Newport News + Peninsula veterans.",
    website_url: "https://hnncsb.org/services/crisis-services/", phone: "757-788-0011",
    address: "300 Medical Dr", city: "Hampton", zip: "23666",
    source_name: "Hampton-Newport News CSB" },

  { section: "B", title: "Mobile Crisis Norfolk CSB",
    cat: "crisis-help", sub: "Mobile Crisis Teams",
    desc: "Norfolk CSB Mobile Crisis Team — 24/7 community-based emergency mental-health response via Marcus Alert / 988 for Norfolk + South Hampton Roads residents incl. Norfolk Naval Station veterans.",
    website_url: "https://www.norfolk.gov/2069/Crisis-Services", phone: "757-664-7690",
    address: "Norfolk CSB", city: "Norfolk", zip: "23510",
    source_name: "Norfolk CSB" },

  { section: "B", title: "Mobile Crisis Richmond Behavioral Health Authority",
    cat: "crisis-help", sub: "Mobile Crisis Teams",
    desc: "Richmond Behavioral Health Authority Mobile Crisis Team — 24/7 community-based emergency mental-health response via Marcus Alert / 988 for City of Richmond residents incl. veterans.",
    website_url: "https://www.rbha.org/services/crisis-services/", phone: "804-819-4100",
    address: "107 S 5th St", city: "Richmond", zip: "23219",
    source_name: "Richmond Behavioral Health Authority" },

  { section: "B", title: "Mobile Crisis Mt Rogers CSB",
    cat: "crisis-help", sub: "Mobile Crisis Teams",
    desc: "Mt Rogers CSB Mobile Crisis Team — 24/7 community-based emergency mental-health response via 988/Marcus Alert across Bland/Carroll/Galax/Grayson/Smyth/Wythe for Mt Rogers veterans.",
    website_url: "https://www.mtrogerscsb.com/", phone: "276-223-3200",
    address: "770 W Ridge Rd", city: "Wytheville", zip: "24382",
    source_name: "Mt Rogers CSB" },

  { section: "B", title: "NAMI Virginia",
    cat: "crisis-help", sub: "Emergency Mental Health",
    desc: "NAMI Virginia — free peer-led support groups (Family-to-Family, Connection, Homefront for military families), Crisis Intervention Team training, advocacy + statewide HelpLine 800-950-NAMI for veterans + families.",
    website_url: "https://namivirginia.org/", phone: "804-285-8264",
    address: "PO Box 8260", city: "Richmond", zip: "23226",
    source_name: "NAMI Virginia" },

  { section: "B", title: "Mental Health America of Virginia",
    cat: "crisis-help", sub: "Emergency Mental Health",
    desc: "Mental Health America of Virginia — free statewide warm-line (866-400-MHAV), peer-support specialists, mental-health screenings, advocacy for Virginians incl. veterans + families.",
    website_url: "https://mhav.org/", phone: "804-257-5591",
    address: "4200 Innslake Dr, Suite 304", city: "Glen Allen", zip: "23060",
    source_name: "Mental Health America of Virginia" },

  // ===========================================================================
  // C. END-OF-LIFE SERVICES (was 10 → +18)
  // ===========================================================================
  { section: "C", title: "Hampton VAMC Hospice & Palliative Care",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Hampton VAMC Hospice & Palliative Care — interdisciplinary end-of-life care, pain + symptom management, family bereavement support for terminally ill enrolled Tidewater veterans.",
    website_url: "https://www.va.gov/hampton-health-care/programs/hospice-and-palliative-care/", phone: "757-722-9961",
    address: "100 Emancipation Dr", city: "Hampton", zip: "23667",
    source_name: "VA Hampton Healthcare System" },

  { section: "C", title: "Richmond McGuire VAMC Hospice & Palliative Care",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Central Virginia VAMC Hospice & Palliative Care — interdisciplinary end-of-life care, pain + symptom management, family bereavement support for terminally ill enrolled Central VA veterans.",
    website_url: "https://www.va.gov/central-virginia-health-care/", phone: "804-675-5000",
    address: "1201 Broad Rock Blvd", city: "Richmond", zip: "23249",
    source_name: "VA Central Virginia Healthcare System" },

  { section: "C", title: "Salem VAMC Hospice & Palliative Care",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Salem VAMC Hospice & Palliative Care — interdisciplinary end-of-life care, pain + symptom management, family bereavement support for terminally ill enrolled SW VA veterans.",
    website_url: "https://www.va.gov/salem-health-care/", phone: "540-982-2463",
    address: "1970 Roanoke Blvd", city: "Salem", zip: "24153",
    source_name: "VA Salem Healthcare System" },

  { section: "C", title: "Bon Secours Hospice Richmond",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Bon Secours Hospice Richmond — in-home + inpatient hospice + palliative care + bereavement support across Greater Richmond + Tri-Cities; veteran-friendly hospice We Honor Veterans partner.",
    website_url: "https://www.bonsecours.com/locations/profile/bon-secours-hospice-richmond", phone: "804-281-8330",
    address: "8580 Magellan Pkwy, Suite 1100", city: "Richmond", zip: "23227",
    source_name: "Bon Secours Mercy Health" },

  { section: "C", title: "Sentara Hospice Hampton Roads",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Sentara Hospice — in-home + inpatient hospice + palliative care + bereavement support across Hampton Roads (Norfolk/Virginia Beach/Chesapeake/Suffolk); We Honor Veterans partner program.",
    website_url: "https://www.sentara.com/services/home-care/hospice-care.aspx", phone: "757-455-7050",
    address: "6160 Kempsville Cir, Suite 200B", city: "Norfolk", zip: "23502",
    source_name: "Sentara Healthcare" },

  { section: "C", title: "Hospice of the Piedmont",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Hospice of the Piedmont Charlottesville — Central Virginia's largest nonprofit hospice; in-home + Hospice House (inpatient) + palliative care + bereavement support; We Honor Veterans Level 4 partner.",
    website_url: "https://www.hopva.org/", phone: "434-817-6900",
    address: "675 Peter Jefferson Pkwy, Suite 300", city: "Charlottesville", zip: "22911",
    source_name: "Hospice of the Piedmont" },

  { section: "C", title: "Mountain Valley Hospice & Palliative Care",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Mountain Valley Hospice — in-home + inpatient hospice + palliative care + bereavement support across SW Virginia (Galax/Wytheville/Marion/Hillsville/Stuart); We Honor Veterans Level 4 partner.",
    website_url: "https://www.mtnvalleyhospice.org/", phone: "276-236-5102",
    address: "401 Technology Dr E, Suite 200", city: "Galax", zip: "24333",
    source_name: "Mountain Valley Hospice & Palliative Care" },

  { section: "C", title: "Heartland Hospice Richmond",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "ProMedica Heartland Hospice Richmond — in-home + facility hospice + palliative care + bereavement support across Greater Richmond + Tri-Cities; We Honor Veterans partner serving veteran families.",
    website_url: "https://www.heartlandhospice.com/locations/richmond-va", phone: "804-545-6900",
    address: "100 Prosperity Dr, Suite 200", city: "Glen Allen", zip: "23060",
    source_name: "ProMedica Heartland Hospice" },

  { section: "C", title: "VITAS Healthcare Northern Virginia",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "VITAS Healthcare — nation's largest hospice provider with NoVA + DC offices; in-home hospice + Inpatient Hospice Unit + palliative care + bereavement; We Honor Veterans Level 5 partner.",
    website_url: "https://www.vitas.com/locations/northern-virginia-and-washington-dc-area", phone: "703-289-6700",
    address: "1593 Spring Hill Rd, Suite 600", city: "Vienna", zip: "22182",
    source_name: "VITAS Healthcare" },

  { section: "C", title: "Hampton National Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    desc: "Hampton National Cemetery — VA National Cemetery Administration; full burial benefits + columbarium + military honors + headstone/marker for eligible veterans + dependents; serves Tidewater region.",
    website_url: "https://www.cem.va.gov/cems/nchp/hampton.asp", phone: "757-723-7104",
    address: "Cemetery Rd", city: "Hampton", zip: "23667",
    source_name: "VA National Cemetery Administration" },

  { section: "C", title: "Richmond National Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    desc: "Richmond National Cemetery — VA National Cemetery Administration; full burial benefits + columbarium + military honors + headstone/marker for eligible veterans + dependents; serves Central Virginia.",
    website_url: "https://www.cem.va.gov/cems/nchp/richmond.asp", phone: "804-795-2031",
    address: "1701 Williamsburg Rd", city: "Richmond", zip: "23231",
    source_name: "VA National Cemetery Administration" },

  { section: "C", title: "Quantico National Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    desc: "Quantico National Cemetery — VA National Cemetery Administration; full burial benefits + columbarium + military honors + headstone/marker for eligible veterans + dependents; serves NoVA + DMV.",
    website_url: "https://www.cem.va.gov/cems/nchp/quantico.asp", phone: "703-221-2183",
    address: "18424 Joplin Rd", city: "Triangle", zip: "22172",
    source_name: "VA National Cemetery Administration" },

  { section: "C", title: "Culpeper National Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    desc: "Culpeper National Cemetery — VA National Cemetery Administration; full burial benefits + columbarium + military honors + headstone/marker for eligible veterans + dependents; serves Piedmont/Shenandoah.",
    website_url: "https://www.cem.va.gov/cems/nchp/culpeper.asp", phone: "540-825-0027",
    address: "305 US Ave", city: "Culpeper", zip: "22701",
    source_name: "VA National Cemetery Administration" },

  { section: "C", title: "Albert G. Horton Memorial Veterans Cemetery",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    desc: "Albert G. Horton Memorial Veterans Cemetery Suffolk — Virginia state veterans cemetery operated by VA Department of Veterans Services; full burial + military honors for eligible veterans + dependents.",
    website_url: "https://www.dvs.virginia.gov/veterans-cemeteries", phone: "757-255-7217",
    address: "5310 Milners Rd", city: "Suffolk", zip: "23434",
    source_name: "Virginia Department of Veterans Services" },

  { section: "C", title: "Virginia Veterans Cemetery Amelia",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    desc: "Virginia Veterans Cemetery Amelia — Virginia state veterans cemetery operated by VA Department of Veterans Services; full burial + military honors for eligible veterans + dependents; serves Central Virginia.",
    website_url: "https://www.dvs.virginia.gov/veterans-cemeteries", phone: "804-561-1475",
    address: "10300 Pridesville Rd", city: "Amelia Court House", zip: "23002",
    source_name: "Virginia Department of Veterans Services" },

  { section: "C", title: "Southwest Virginia Veterans Cemetery Dublin",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    desc: "Southwest Virginia Veterans Cemetery Dublin — Virginia state veterans cemetery operated by VA Department of Veterans Services; full burial + military honors for eligible veterans + dependents; serves SW Virginia.",
    website_url: "https://www.dvs.virginia.gov/veterans-cemeteries", phone: "540-674-6893",
    address: "5550 Bagging Plant Rd", city: "Dublin", zip: "24084",
    source_name: "Virginia Department of Veterans Services" },

  { section: "C", title: "Tragedy Assistance Program for Survivors (TAPS)",
    cat: "end-of-life-services", sub: "Gold Star Family Support",
    desc: "TAPS — 24/7 grief + trauma resources, peer-based emotional support, casework, suicide loss support, Good Grief Camps for children for families of fallen military service members nationwide incl. Virginia.",
    website_url: "https://www.taps.org/", phone: "800-959-8277",
    address: "3033 Wilson Blvd, 3rd Floor", city: "Arlington", zip: "22201",
    source_name: "Tragedy Assistance Program for Survivors" },

  { section: "C", title: "American Gold Star Mothers Virginia",
    cat: "end-of-life-services", sub: "Gold Star Family Support",
    desc: "American Gold Star Mothers Virginia chapters — peer support + community service + advocacy for mothers who have lost a son or daughter in military service; chapters in NoVA + Tidewater + Richmond.",
    website_url: "https://www.goldstarmoms.com/", phone: "703-619-2333",
    address: "2128 Leroy Pl NW", city: "Washington", zip: "20008",
    source_name: "American Gold Star Mothers" },

  { section: "C", title: "Society of Military Widows National HQ Springfield",
    cat: "end-of-life-services", sub: "Gold Star Family Support",
    desc: "Society of Military Widows Springfield — peer support, advocacy, scholarship program, social events for surviving spouses of military members regardless of cause of death; HQ NoVA + national chapters.",
    website_url: "https://militarywidows.org/", phone: "703-750-1342",
    address: "5535 Hempstead Way", city: "Springfield", zip: "22151",
    source_name: "Society of Military Widows" },

  { section: "C", title: "Snowball Express (Gary Sinise Foundation)",
    cat: "end-of-life-services", sub: "Gold Star Family Support",
    desc: "Snowball Express — Gary Sinise Foundation program providing all-expenses-paid five-day Disney experience annually for children ages 5-18 of fallen military heroes + surviving parent; serves Gold Star families.",
    website_url: "https://www.garysinisefoundation.org/snowball-express", phone: "888-708-0050",
    address: "PO Box 368", city: "Woodland Hills", zip: "91365",
    source_name: "Gary Sinise Foundation" },

  { section: "C", title: "VA Survivors Pension & DIC Benefits Navigator",
    cat: "end-of-life-services", sub: "VA Death Benefits & Survivor Benefits",
    desc: "VA Pension Management Center — needs-based Survivors Pension + Dependency and Indemnity Compensation (DIC) for surviving spouses + dependent children of deceased wartime veterans; navigated via state VSOs.",
    website_url: "https://www.va.gov/family-and-caregiver-benefits/survivor-compensation/", phone: "800-827-1000",
    address: "810 Vermont Ave NW", city: "Washington", zip: "20420",
    source_name: "VA Pension Management Center" },

  { section: "C", title: "Wreaths Across America Virginia Coordinator",
    cat: "end-of-life-services", sub: "Veteran Funeral Honors & Cemetery Assistance",
    desc: "Wreaths Across America Virginia coordinator network — December annual wreath-laying at Arlington National Cemetery + Hampton + Richmond + Quantico + Culpeper National Cemeteries + state veterans cemeteries.",
    website_url: "https://www.wreathsacrossamerica.org/", phone: "877-385-9504",
    address: "PO Box 249", city: "Columbia Falls", zip: "04623",
    source_name: "Wreaths Across America" },
];

await runSeed(ROWS, {
  state: "VA",
  commit: COMMIT,
  scriptName: "seed-va-wave8.ts (FL-pattern Wave 8 / category-depth fill — Option D)",
  urlCheckTimeoutMs: 12000,
  allowBrokenUrls: ALLOW_BROKEN_URLS,
  allowZipBleed: ALLOW_ZIP_BLEED,
  sectionLabels: {
    A: "Disabled Veterans (was 7 → +22)",
    B: "Crisis Help (was 8 → +22)",
    C: "End-of-Life Services (was 10 → +18)",
  },
});
