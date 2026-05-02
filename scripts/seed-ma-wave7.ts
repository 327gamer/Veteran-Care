/**
 * MASSACHUSETTS — WAVE 7 (FINAL CATEGORY DEPTH)
 *
 * Founder release 2026-05-02: depth fill underweight cats post-W6.
 * Pre-W7 (post-W6) totals: end-of-life=5, crisis-help=6, disabled-vet=9, family-support=25.
 * Mirrors VA W8 structure exactly. STOP after W7.
 *
 * Sections:
 *   A  End-of-Life Services    (17)
 *   B  Crisis Help             (16)
 *   C  Disabled Veterans       (17)
 *   D  Family Support / Care   (15)
 *
 * Total: 65 rows. Post-W7 expected: 727.
 *
 * Run:
 *   tsx scripts/seed-ma-wave7.ts                                     # dry-run
 *   tsx scripts/seed-ma-wave7.ts --commit --allow-broken-urls --allow-zip-bleed
 */
import { runSeed, type SeedRow } from "./lib/rollout-engine";

const COMMIT = process.argv.includes("--commit");
const ALLOW_BROKEN_URLS = process.argv.includes("--allow-broken-urls");
const ALLOW_ZIP_BLEED = process.argv.includes("--allow-zip-bleed");

const ROWS: SeedRow[] = [
  // ===========================================================================
  // A. END-OF-LIFE SERVICES (17)
  // ===========================================================================
  { section: "A", title: "Care Dimensions Hospice and Palliative Care",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Care Dimensions — Massachusetts' largest nonprofit hospice and palliative care provider, serving 100+ communities across Eastern + Central + North Shore + MetroWest MA. Veteran-specific programs partnered with We Honor Veterans Level 5; in-home + Kaplan Family Hospice House inpatient; bereavement support.",
    website_url: "https://www.caredimensions.org/", phone: "888-283-1722",
    address: "75 Sylvan St, Suite B-102", city: "Danvers", zip: "01923",
    source_name: "Care Dimensions Inc." },

  { section: "A", title: "NVNA and Hospice Norwell",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "NVNA and Hospice (Norwell Visiting Nurse Association) — South Shore nonprofit hospice + palliative + home health serving 27+ South Shore towns (Norwell, Hingham, Cohasset, Marshfield, Scituate, Duxbury, Hanover, Pembroke). Veteran-aware end-of-life care + Pat Roche Hospice Home inpatient.",
    website_url: "https://www.nvna.org/", phone: "781-659-2342",
    address: "120 Longwater Dr", city: "Norwell", zip: "02061",
    source_name: "NVNA and Hospice" },

  { section: "A", title: "HopeHealth Hospice and Palliative Care New Bedford",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "HopeHealth Hospice — nonprofit hospice + palliative care serving SouthCoast MA + Cape Cod + Islands (New Bedford, Fall River, Hyannis, Falmouth, Plymouth, Vineyard, Nantucket). We Honor Veterans Level 4 partner; in-home, Hospice House inpatient, and bereavement.",
    website_url: "https://hopehealthco.org/", phone: "508-997-0166",
    address: "200 Mill Rd, Suite 110", city: "Fairhaven", zip: "02719",
    source_name: "HopeHealth Inc." },

  { section: "A", title: "VNA Care Hospice Worcester",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "VNA Care Hospice and Palliative Care (Atrius Health affiliate) — nonprofit hospice serving Central + MetroWest MA (Worcester, Framingham, Marlborough, Leominster, Fitchburg, Milford). We Honor Veterans partner; in-home end-of-life care, palliative consultation, bereavement, pediatric program.",
    website_url: "https://www.vnacare.org/", phone: "888-663-3688",
    address: "120 Thomas St", city: "Worcester", zip: "01608",
    source_name: "VNA Care Network" },

  { section: "A", title: "Cooley Dickinson VNA and Hospice Northampton",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Cooley Dickinson VNA & Hospice (Mass General Brigham) — nonprofit hospice serving Hampshire + Franklin + Hampden counties (Northampton, Amherst, Easthampton, Greenfield, Athol, Belchertown, Ware). We Honor Veterans partner; in-home end-of-life, palliative care, bereavement.",
    website_url: "https://www.cooleydickinson.org/services/vna-hospice/", phone: "413-586-0742",
    address: "168 Industrial Dr", city: "Northampton", zip: "01060",
    source_name: "Cooley Dickinson VNA & Hospice" },

  { section: "A", title: "Hospice of the Fisher Home Amherst",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Hospice of the Fisher Home — independent nonprofit hospice + 8-bed inpatient Fisher Home in Amherst serving Hampshire + Franklin + Western Hampden counties. Veteran-aware end-of-life care for Pioneer Valley + hilltown residents; bereavement + caregiver support.",
    website_url: "https://fisherhome.org/", phone: "413-549-0115",
    address: "1165 N Pleasant St", city: "Amherst", zip: "01002",
    source_name: "Hospice of the Fisher Home" },

  { section: "A", title: "Berkshire VNA Hospice Pittsfield",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Berkshire Visiting Nurse Association Hospice (Berkshire Health Systems) — nonprofit hospice serving all of Berkshire County (Pittsfield, North Adams, Adams, Great Barrington, Lenox, Lee, Williamstown). We Honor Veterans partner; in-home end-of-life care, palliative consultation, bereavement.",
    website_url: "https://www.berkshirehealthsystems.org/our-services/services-locations-information/hospice", phone: "413-447-2862",
    address: "740 Williams St", city: "Pittsfield", zip: "01201",
    source_name: "Berkshire Health Systems" },

  { section: "A", title: "Compassus Hospice Tewksbury",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Compassus Hospice & Palliative Care (national) Tewksbury location — serves Merrimack Valley + North Shore MA (Tewksbury, Lowell, Lawrence, Andover, Haverhill, Methuen, Burlington, Wilmington). We Honor Veterans Level 4 partner; in-home end-of-life care + palliative consultation.",
    website_url: "https://www.compassus.com/locations/tewksbury-massachusetts/", phone: "978-988-0046",
    address: "1850 Andover St, Suite 203", city: "Tewksbury", zip: "01876",
    source_name: "Compassus" },

  { section: "A", title: "Massachusetts National Cemetery Bourne",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Massachusetts National Cemetery Bourne — VA National Cemetery Administration site on Cape Cod providing free burial benefits for eligible veterans + spouses + dependent children: gravesite, opening/closing, government headstone/marker, perpetual care, U.S. flag, and Presidential Memorial Certificate.",
    website_url: "https://www.cem.va.gov/cems/nchp/massachusetts.asp", phone: "508-563-7113",
    address: "Connery Ave", city: "Bourne", zip: "02532",
    source_name: "VA National Cemetery Administration" },

  { section: "A", title: "Massachusetts Veterans Memorial Cemetery Agawam",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Massachusetts Veterans Memorial Cemetery Agawam — state-operated cemetery (MA Department of Veterans' Services) providing burial benefits for eligible MA veterans + spouses + dependent children for Western MA. No-fee gravesite, opening/closing, headstone, perpetual care.",
    website_url: "https://www.mass.gov/locations/massachusetts-veterans-memorial-cemetery-agawam", phone: "413-821-9500",
    address: "1390 Main St", city: "Agawam", zip: "01001",
    source_name: "Massachusetts Department of Veterans' Services" },

  { section: "A", title: "Massachusetts Veterans Memorial Cemetery Winchendon",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Massachusetts Veterans Memorial Cemetery Winchendon — state-operated cemetery (MA Department of Veterans' Services) providing burial benefits for eligible MA veterans + spouses + dependent children across Central + North Central MA. No-fee gravesite, opening/closing, headstone, perpetual care.",
    website_url: "https://www.mass.gov/locations/massachusetts-veterans-memorial-cemetery-winchendon", phone: "978-297-9501",
    address: "111 Glenallen St", city: "Winchendon", zip: "01475",
    source_name: "Massachusetts Department of Veterans' Services" },

  { section: "A", title: "Bedford VA Community Living Center",
    cat: "end-of-life-services", sub: "Assisted Living & Nursing Homes",
    desc: "Edith Nourse Rogers Memorial VA Bedford Community Living Center — VA-operated long-term skilled nursing + dementia + hospice care for eligible enrolled veterans. Short-term rehab, long-term care, palliative + end-of-life care, and specialty Geriatric Psychiatric program.",
    website_url: "https://www.va.gov/bedford-health-care/locations/edith-nourse-rogers-memorial-veterans-hospital/", phone: "781-687-2000",
    address: "200 Springs Rd, Building 4", city: "Bedford", zip: "01730",
    source_name: "VA Bedford Healthcare System" },

  { section: "A", title: "Brockton VA Community Living Center",
    cat: "end-of-life-services", sub: "Assisted Living & Nursing Homes",
    desc: "VA Boston Healthcare System Brockton Community Living Center — VA-operated long-term skilled nursing + dementia + hospice care for eligible enrolled veterans. Short-term rehab, long-term care, palliative + end-of-life care, and Spinal Cord Injury Long-Term Care unit.",
    website_url: "https://www.va.gov/boston-health-care/locations/brockton-va-medical-center/", phone: "774-826-1000",
    address: "940 Belmont St, Building 2", city: "Brockton", zip: "02301",
    source_name: "VA Boston Healthcare System" },

  { section: "A", title: "We Honor Veterans NHPCO",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "We Honor Veterans (National Hospice and Palliative Care Organization + VA partnership) — national program training + certifying hospice + palliative providers in veteran-centric end-of-life care. 30+ MA partner agencies; resource navigation for vet-aware hospice selection across Massachusetts.",
    website_url: "https://www.wehonorveterans.org/", phone: "703-837-1500",
    address: "1731 King St", city: "Alexandria", zip: "22314",
    source_name: "National Hospice and Palliative Care Organization" },

  { section: "A", title: "Bethany Health Care Center Framingham",
    cat: "end-of-life-services", sub: "In-Home Care & Skilled Nursing",
    desc: "Bethany Health Care Center (Sisters of St. Joseph of Boston) — Catholic-affiliated nonprofit skilled nursing + rehab + long-term care + Alzheimer's care + hospice in Framingham serving MetroWest seniors incl. retired veterans + their families. 5-Star CMS rated.",
    website_url: "https://www.bethanyhealthcare.org/", phone: "508-872-6750",
    address: "97 Bethany Rd", city: "Framingham", zip: "01702",
    source_name: "Bethany Health Care Center" },

  { section: "A", title: "Hospice and Palliative Care Federation of Massachusetts",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Hospice & Palliative Care Federation of Massachusetts — statewide trade association + advocacy organization for MA hospice + palliative providers. Public-facing 'Find a Hospice' directory covering all MA counties; veteran-services + bereavement resource navigation.",
    website_url: "https://www.hospicefed.org/", phone: "781-255-7077",
    address: "55 Chapel St, Suite 102", city: "Newton", zip: "02458",
    source_name: "Hospice & Palliative Care Federation of MA" },

  { section: "A", title: "Bourne National Cemetery Memorial Council",
    cat: "end-of-life-services", sub: "Hospice & Palliative Care",
    desc: "Bourne National Cemetery Memorial Council — volunteer organization supporting Massachusetts National Cemetery Bourne with Wreaths Across America, Memorial Day + Veterans Day ceremonies, military funeral honors coordination, and outreach for Cape + SouthCoast veteran families.",
    website_url: "https://www.massnatcemetery.org/", phone: "508-563-7113",
    address: "Connery Ave", city: "Bourne", zip: "02532",
    source_name: "Bourne National Cemetery Memorial Council" },

  // ===========================================================================
  // B. CRISIS HELP (16)
  // ===========================================================================
  { section: "B", title: "Veterans Crisis Line 988 Press 1",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Veterans Crisis Line — VA-operated 24/7 confidential crisis support for veterans + service members + family. Dial 988 then Press 1, text 838255, or chat. Connects callers to trained responders (many veterans themselves) and local VA suicide prevention coordinators incl. MA VAMCs Boston/Bedford/Brockton/Leeds.",
    website_url: "https://www.veteranscrisisline.net/", phone: "988",
    address: "810 Vermont Ave NW", city: "Washington", zip: "20420",
    source_name: "U.S. Department of Veterans Affairs" },

  { section: "B", title: "Vets4Warriors Peer Crisis Line",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Vets4Warriors — 24/7 peer-to-peer confidential crisis + support line staffed entirely by trained veterans for veterans + service members + their families nationwide incl. MA. Phone 855-838-8255, text, chat, or email; non-clinical peer support for any concern, not crisis-only.",
    website_url: "https://www.vets4warriors.com/", phone: "855-838-8255",
    address: "317 George St, Suite 314", city: "New Brunswick", zip: "08901",
    source_name: "Vets4Warriors / Rutgers UBHC" },

  { section: "B", title: "Riverside Mobile Crisis Norwood",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Riverside Community Care Mobile Crisis Intervention — 988-aligned 24/7 mobile crisis team serving Norwood + Westwood + Walpole + Dedham + Canton + Sharon + Stoughton + Norfolk County. On-site crisis assessment + de-escalation + safety planning + linkage; veteran-friendly.",
    website_url: "https://www.riversidecc.org/services/emergency-services-mobile-crisis-intervention/", phone: "800-529-5077",
    address: "190 Lenox St", city: "Norwood", zip: "02062",
    source_name: "Riverside Community Care" },

  { section: "B", title: "Bay Cove Mobile Crisis Cambridge Somerville",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Bay Cove Human Services Mobile Crisis Cambridge/Somerville — 988-aligned 24/7 community crisis team serving Cambridge + Somerville + Belmont + Watertown + Arlington. On-site crisis assessment + de-escalation + safety planning + community-based stabilization; veteran-friendly intake.",
    website_url: "https://www.baycove.org/programs/community-crisis-services/", phone: "800-981-4357",
    address: "66 Canal St", city: "Boston", zip: "02114",
    source_name: "Bay Cove Human Services" },

  { section: "B", title: "Eliot Mobile Crisis Malden",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Eliot Community Human Services Mobile Crisis Intervention Malden — 988-aligned 24/7 community crisis team serving Malden + Medford + Melrose + Wakefield + Stoneham + Reading + Saugus. On-site crisis assessment, de-escalation, safety planning + linkage; veteran-friendly intake.",
    website_url: "https://www.eliotchs.org/services/emergency-services/", phone: "800-988-1111",
    address: "85 E Newton St", city: "Malden", zip: "02148",
    source_name: "Eliot Community Human Services" },

  { section: "B", title: "Advocates Psychiatric Emergency Services Framingham",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Advocates Inc Psychiatric Emergency Services / Mobile Crisis — 988-aligned 24/7 community crisis team serving MetroWest MA (Framingham, Natick, Wayland, Sudbury, Hudson, Marlborough, Hopkinton, Ashland). On-site crisis assessment, de-escalation, safety planning; veteran-friendly.",
    website_url: "https://www.advocates.org/services/psychiatric-emergency-services-pes", phone: "800-640-5432",
    address: "354 Waverly St", city: "Framingham", zip: "01702",
    source_name: "Advocates Inc." },

  { section: "B", title: "BHN Mobile Crisis Holyoke",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Behavioral Health Network Mobile Crisis Intervention Holyoke — 988-aligned 24/7 community crisis team serving Holyoke + Chicopee + Westfield + South Hadley + Granby + Hampden County. On-site crisis assessment, de-escalation, safety planning, and Living Room peer-respite alternative; veteran-friendly.",
    website_url: "https://www.bhninc.org/", phone: "413-733-6661",
    address: "11 Wilbraham Rd", city: "Holyoke", zip: "01040",
    source_name: "Behavioral Health Network Inc." },

  { section: "B", title: "CSO Mobile Crisis Northampton",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Clinical & Support Options Mobile Crisis Intervention Northampton — 988-aligned 24/7 community crisis team serving Hampshire + Franklin counties (Northampton, Amherst, Easthampton, Belchertown, Ware, South Hadley, Hadley). On-site crisis assessment, de-escalation, safety planning; veteran-friendly.",
    website_url: "https://www.csoinc.org/services/community-behavioral-health-center/", phone: "413-582-0471",
    address: "8 Atwood Dr", city: "Northampton", zip: "01060",
    source_name: "Clinical & Support Options" },

  { section: "B", title: "Brien Center Mobile Crisis Great Barrington",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "The Brien Center Mobile Crisis Intervention South County — 988-aligned 24/7 community crisis team serving South Berkshire (Great Barrington, Lee, Lenox, Stockbridge, Sheffield, Egremont, Monterey, New Marlborough). On-site crisis assessment, de-escalation, safety planning; veteran-friendly.",
    website_url: "https://www.briencenter.org/services/crisis-services/", phone: "413-499-0412",
    address: "292 Main St", city: "Great Barrington", zip: "01230",
    source_name: "The Brien Center" },

  { section: "B", title: "Community HealthLink Mobile Crisis Leominster",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "Community HealthLink Mobile Crisis Intervention North Central — 988-aligned 24/7 community crisis team serving Leominster + Fitchburg + Gardner + Athol + Templeton + Winchendon + North Central Worcester County. On-site crisis assessment, de-escalation, safety planning; veteran-friendly.",
    website_url: "https://www.communityhealthlink.org/services/crisis/", phone: "800-977-5555",
    address: "275 Nichols Rd", city: "Leominster", zip: "01453",
    source_name: "Community HealthLink" },

  { section: "B", title: "High Point Mobile Crisis Plymouth",
    cat: "crisis-help", sub: "Suicide Prevention",
    desc: "High Point Treatment Center Mobile Crisis Intervention Plymouth — 988-aligned 24/7 community crisis team serving Plymouth + Wareham + Carver + Kingston + Plympton + Halifax + Middleboro + Plymouth County. On-site crisis assessment, de-escalation, safety planning; veteran-friendly intake.",
    website_url: "https://hptc.org/services/community-based-services/community-behavioral-health-center/", phone: "508-732-1037",
    address: "144 Court St", city: "Plymouth", zip: "02360",
    source_name: "High Point Treatment Center" },

  { section: "B", title: "Casa Myrna Boston",
    cat: "crisis-help", sub: "Domestic Violence / Safety",
    desc: "Casa Myrna — Boston's largest provider of domestic violence shelter + survivor services. Operates SafeLink statewide DV hotline + 3 Boston-area shelters + community advocacy + bilingual (English/Spanish) crisis support. Veteran + military-family survivors served; trauma-informed.",
    website_url: "https://casamyrna.org/", phone: "877-785-2020",
    address: "PO Box 18019", city: "Boston", zip: "02118",
    source_name: "Casa Myrna Vazquez Inc." },

  { section: "B", title: "Jane Doe Inc Massachusetts Coalition",
    cat: "crisis-help", sub: "Domestic Violence / Safety",
    desc: "Jane Doe Inc — Massachusetts Coalition Against Sexual Assault and Domestic Violence. Statewide membership coalition of MA DV/SA programs; survivor referral, public-policy advocacy, training, and member-program directory across all 14 MA counties. Veteran + military-family survivors served.",
    website_url: "https://janedoe.org/", phone: "617-248-0922",
    address: "14 Beacon St, Suite 507", city: "Boston", zip: "02108",
    source_name: "Jane Doe Inc." },

  { section: "B", title: "NELCWIT Greenfield",
    cat: "crisis-help", sub: "Domestic Violence / Safety",
    desc: "New England Learning Center for Women in Transition (NELCWIT) — Franklin + North Quabbin domestic + sexual violence agency. 24/7 hotline, emergency shelter, counseling, court advocacy, prevention education across Franklin County (Greenfield, Athol, Orange, Turners Falls, Shelburne).",
    website_url: "https://www.nelcwit.org/", phone: "413-772-0806",
    address: "479 Main St", city: "Greenfield", zip: "01301",
    source_name: "NELCWIT" },

  { section: "B", title: "South Shore Resource and Advocacy Center Plymouth",
    cat: "crisis-help", sub: "Domestic Violence / Safety",
    desc: "South Shore Resource & Advocacy Center (formerly Womansplace Crisis Center) — Plymouth-based domestic + sexual violence agency serving Plymouth + Bristol counties (Plymouth, Wareham, Middleboro, Carver, Kingston, Marshfield, Brockton). 24/7 hotline, shelter referral, counseling, court advocacy.",
    website_url: "https://ssrac.org/", phone: "508-746-2664",
    address: "PO Box 821", city: "Plymouth", zip: "02362",
    source_name: "South Shore Resource & Advocacy Center" },

  { section: "B", title: "New Hope Inc Attleboro",
    cat: "crisis-help", sub: "Domestic Violence / Safety",
    desc: "New Hope Inc — Attleboro-based domestic + sexual violence agency serving Attleboro + Norton + North Attleboro + Mansfield + Foxboro + Wrentham + Plainville + Bristol/Norfolk corner. 24/7 hotline, emergency shelter, counseling, court + medical advocacy, prevention education.",
    website_url: "https://www.new-hope.org/", phone: "800-323-4673",
    address: "PO Box 48", city: "Attleboro", zip: "02703",
    source_name: "New Hope Inc." },

  { section: "B", title: "The Network La Red Boston",
    cat: "crisis-help", sub: "Domestic Violence / Safety",
    desc: "The Network/La Red — Boston-based survivor-led organization addressing domestic violence in LGBTQ+, SM/kink, and polyamorous communities statewide MA. 24/7 hotline (English/Spanish), emergency safe-home program, support groups, advocacy. LGBTQ+ veteran survivors served.",
    website_url: "https://www.tnlr.org/", phone: "617-742-4911",
    address: "PO Box 6011", city: "Boston", zip: "02114",
    source_name: "The Network/La Red" },

  // ===========================================================================
  // C. DISABLED VETERANS (17)
  // ===========================================================================
  { section: "C", title: "VA VR&E Boston Regional Office",
    cat: "disabled-veterans", sub: "Employment & Vocational Rehabilitation",
    desc: "VA Veteran Readiness and Employment (VR&E) Boston Regional Office (Chapter 31) — federal program serving service-connected disabled MA veterans. 5 tracks: reemployment, rapid access to employment, self-employment, employment through long-term services, independent living. Tuition + fees + housing allowance.",
    website_url: "https://www.va.gov/careers-employment/vocational-rehabilitation/", phone: "800-827-1000",
    address: "JFK Federal Bldg, 15 New Sudbury St", city: "Boston", zip: "02203",
    source_name: "VA Veteran Readiness and Employment" },

  { section: "C", title: "VA VR&E Springfield Outbased Office",
    cat: "disabled-veterans", sub: "Employment & Vocational Rehabilitation",
    desc: "VA Veteran Readiness and Employment (VR&E) Springfield Outbased Office (Chapter 31) — federal program serving service-connected disabled Western MA veterans (Hampden, Hampshire, Franklin, Berkshire counties). Counseling, training, education, and employment services. Tuition + fees + housing allowance.",
    website_url: "https://www.va.gov/careers-employment/vocational-rehabilitation/", phone: "413-731-2400",
    address: "1550 Main St, Suite 401", city: "Springfield", zip: "01103",
    source_name: "VA Veteran Readiness and Employment" },

  { section: "C", title: "VA VR&E Brockton Outbased Office",
    cat: "disabled-veterans", sub: "Employment & Vocational Rehabilitation",
    desc: "VA Veteran Readiness and Employment (VR&E) Brockton Outbased Office (Chapter 31) — federal program serving service-connected disabled Southeastern MA veterans (Plymouth, Bristol, Norfolk counties + Cape + Islands). Counseling, training, education, and employment services. Tuition + fees + housing allowance.",
    website_url: "https://www.va.gov/careers-employment/vocational-rehabilitation/", phone: "508-583-4500",
    address: "940 Belmont St", city: "Brockton", zip: "02301",
    source_name: "VA Veteran Readiness and Employment" },

  { section: "C", title: "Massachusetts Office on Disability Boston",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Massachusetts Office on Disability (MOD) — state ADA + civil-rights agency for residents with disabilities incl. disabled veterans. Information + referral, ADA technical assistance, community access monitor, MA RIDE paratransit info, and assistive-tech navigation across all 351 MA municipalities.",
    website_url: "https://www.mass.gov/orgs/massachusetts-office-on-disability", phone: "617-727-7440",
    address: "1 Ashburton Pl, Room 1305", city: "Boston", zip: "02108",
    source_name: "Commonwealth of Massachusetts" },

  { section: "C", title: "MRC Worcester Area Office",
    cat: "disabled-veterans", sub: "Employment & Vocational Rehabilitation",
    desc: "Massachusetts Rehabilitation Commission Worcester — state vocational rehab agency serving Worcester County residents with disabilities incl. disabled veterans. VR services, community living, supported employment, and community-based services for Worcester + Fitchburg + Leominster + Gardner + Southbridge.",
    website_url: "https://www.mass.gov/orgs/massachusetts-rehabilitation-commission", phone: "508-754-1757",
    address: "340 Main St, Suite 600", city: "Worcester", zip: "01608",
    source_name: "Massachusetts Rehabilitation Commission" },

  { section: "C", title: "MRC Springfield Area Office",
    cat: "disabled-veterans", sub: "Employment & Vocational Rehabilitation",
    desc: "Massachusetts Rehabilitation Commission Springfield — state vocational rehab agency serving Western MA (Hampden, Hampshire, Franklin, Berkshire) residents with disabilities incl. disabled veterans. VR, community living, supported employment, and Independent Living Services for Western MA.",
    website_url: "https://www.mass.gov/orgs/massachusetts-rehabilitation-commission", phone: "413-781-5070",
    address: "1 Federal St, Building 103", city: "Springfield", zip: "01105",
    source_name: "Massachusetts Rehabilitation Commission" },

  { section: "C", title: "MRC Lawrence Area Office",
    cat: "disabled-veterans", sub: "Employment & Vocational Rehabilitation",
    desc: "Massachusetts Rehabilitation Commission Lawrence — state vocational rehab agency serving Merrimack Valley + Essex County residents with disabilities incl. disabled veterans. VR services, community living, supported employment for Lawrence + Lowell + Haverhill + Methuen + Andover + Salem + Lynn.",
    website_url: "https://www.mass.gov/orgs/massachusetts-rehabilitation-commission", phone: "978-685-1000",
    address: "439 S Union St, Suite 303", city: "Lawrence", zip: "01843",
    source_name: "Massachusetts Rehabilitation Commission" },

  { section: "C", title: "MetroWest Center for Independent Living Framingham",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "MetroWest Center for Independent Living (MWCIL) — consumer-directed nonprofit Independent Living Center serving 30+ MetroWest MA towns (Framingham, Natick, Wayland, Sudbury, Hudson, Marlborough, Hopkinton, Ashland, Westborough). Skills training, advocacy, peer support for disabled vets.",
    website_url: "https://mwcil.org/", phone: "508-875-7853",
    address: "280 Irving St", city: "Framingham", zip: "01702",
    source_name: "MetroWest Center for Independent Living" },

  { section: "C", title: "Independence Associates Brockton",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Independence Associates Inc — consumer-directed nonprofit Independent Living Center serving Plymouth + Bristol counties (Brockton, Taunton, Plymouth, Fall River, New Bedford, Attleboro). Skills training, peer support, advocacy, PCA management, and benefits counseling for disabled vets.",
    website_url: "https://www.iacil.org/", phone: "508-583-2166",
    address: "693 Pleasant St, Suite 102", city: "Brockton", zip: "02301",
    source_name: "Independence Associates Inc." },

  { section: "C", title: "CORD Cape Organization for Rights of the Disabled Hyannis",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Cape Organization for Rights of the Disabled (CORD) — consumer-directed nonprofit Independent Living Center serving Cape Cod + Islands (Barnstable, Dukes, Nantucket counties). Skills training, peer support, advocacy, PCA management, and benefits counseling for disabled vets.",
    website_url: "https://www.cilcapecod.org/", phone: "508-775-8300",
    address: "106 Bassett Ln", city: "Hyannis", zip: "02601",
    source_name: "Cape Organization for Rights of the Disabled" },

  { section: "C", title: "Northeast Independent Living Program Lawrence",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Northeast Independent Living Program (NILP) — consumer-directed nonprofit Independent Living Center serving Merrimack Valley + Essex County (Lawrence, Lowell, Haverhill, Methuen, Andover, Tewksbury, Salem, Beverly). Skills training, peer support, advocacy, PCA management for disabled vets.",
    website_url: "https://www.nilp.org/", phone: "978-687-4288",
    address: "20 Ballard Way", city: "Lawrence", zip: "01843",
    source_name: "Northeast Independent Living Program" },

  { section: "C", title: "Ad Lib Center for Independent Living Pittsfield",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "AdLib Inc — consumer-directed nonprofit Independent Living Center serving all of Berkshire County (Pittsfield, North Adams, Adams, Great Barrington, Lee, Lenox, Williamstown, Dalton, Stockbridge). Skills training, peer support, advocacy, PCA management, and benefits counseling for disabled vets.",
    website_url: "https://www.adlibcil.org/", phone: "413-442-7047",
    address: "215 North St, Suite 218", city: "Pittsfield", zip: "01201",
    source_name: "AdLib Inc." },

  { section: "C", title: "Americas VetDogs Massachusetts Service Dog Network",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "America's VetDogs (Guide Dog Foundation affiliate) — national nonprofit providing service dogs at no cost to disabled veterans + first responders incl. MA recipients. Guide, service, PTSD/MST service, hearing, facility, and Goldie's Pups program; lifetime follow-up support.",
    website_url: "https://www.vetdogs.org/", phone: "631-930-9000",
    address: "371 E Jericho Tpke", city: "Smithtown", zip: "11787",
    source_name: "America's VetDogs" },

  { section: "C", title: "Adaptive Sports New England Boston",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Adaptive Sports New England — Boston-based nonprofit providing adaptive sports + recreation programs for youth + adults with physical disabilities incl. disabled veterans across MA + New England. Wheelchair basketball, sled hockey, cycling, skiing, kayaking, and Paralympic pipeline programs.",
    website_url: "https://www.adaptivesportsne.org/", phone: "617-571-9091",
    address: "100 Cambridge St, Suite 1400", city: "Boston", zip: "02114",
    source_name: "Adaptive Sports New England" },

  { section: "C", title: "Spaulding Adaptive Sports Centers Charlestown",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Spaulding Adaptive Sports Centers (Spaulding Rehab / Mass General Brigham) — adaptive sports + community recreation programs for adults + youth with physical disabilities incl. disabled veterans. Cycling, sailing, water sports, skiing, kayaking, and tournament-level wheelchair athletics.",
    website_url: "https://spauldingrehab.org/about/community-programs/adaptive-sports-centers", phone: "617-952-6927",
    address: "300 1st Ave", city: "Charlestown", zip: "02129",
    source_name: "Spaulding Rehabilitation Network" },

  { section: "C", title: "Project Healing Waters Boston VA Chapter",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Project Healing Waters Fly Fishing Boston VA Chapter — national nonprofit providing fly fishing + fly tying + rod building education + outings as physical + emotional rehabilitation for disabled veterans + active military. Boston VA Healthcare System Jamaica Plain + West Roxbury chapters.",
    website_url: "https://projecthealingwaters.org/programs/find-a-program/", phone: "888-377-4344",
    address: "150 S Huntington Ave", city: "Jamaica Plain", zip: "02130",
    source_name: "Project Healing Waters Fly Fishing" },

  { section: "C", title: "Disabled Sports USA Move United Boston",
    cat: "disabled-veterans", sub: "Independent Living & Daily Support",
    desc: "Move United (formerly Disabled Sports USA) — national community-based adaptive sports network with 200+ chapters incl. New England programs serving MA disabled veterans. Skiing, cycling, sailing, golf, archery, and Warfighter Sports program for combat-injured + disabled veterans.",
    website_url: "https://moveunitedsport.org/", phone: "301-217-0960",
    address: "11140 Rockville Pike, Suite 100", city: "Rockville", zip: "20852",
    source_name: "Move United" },

  // ===========================================================================
  // D. FAMILY SUPPORT / CAREGIVERS (15)
  // ===========================================================================
  { section: "D", title: "VA Caregiver Support Brockton",
    cat: "family-support", sub: "Caregiver Support",
    desc: "VA Caregiver Support Program at VA Boston Healthcare System Brockton Campus — supports family caregivers of veterans of all eras. Program of Comprehensive Assistance for Family Caregivers (PCAFC) stipend + General Caregiver Support Services + caregiver education + respite + counseling.",
    website_url: "https://www.caregiver.va.gov/", phone: "774-826-3000",
    address: "940 Belmont St", city: "Brockton", zip: "02301",
    source_name: "VA Boston Healthcare System" },

  { section: "D", title: "VA Caregiver Support Leeds VA Central Western",
    cat: "family-support", sub: "Caregiver Support",
    desc: "VA Caregiver Support Program at VA Central Western Massachusetts Healthcare System Leeds — supports family caregivers of veterans of all eras across Western MA. PCAFC stipend + General Caregiver Support Services + caregiver education + respite + counseling.",
    website_url: "https://www.caregiver.va.gov/", phone: "413-584-4040",
    address: "421 N Main St", city: "Leeds", zip: "01053",
    source_name: "VA Central Western Massachusetts Healthcare System" },

  { section: "D", title: "VA Caregiver Support Boston Jamaica Plain",
    cat: "family-support", sub: "Caregiver Support",
    desc: "VA Caregiver Support Program at VA Boston Healthcare System Jamaica Plain Campus — supports family caregivers of veterans of all eras across Greater Boston. PCAFC stipend + General Caregiver Support Services + caregiver education + respite + counseling.",
    website_url: "https://www.caregiver.va.gov/", phone: "857-364-4000",
    address: "150 S Huntington Ave", city: "Jamaica Plain", zip: "02130",
    source_name: "VA Boston Healthcare System" },

  { section: "D", title: "Elizabeth Dole Foundation Hidden Heroes",
    cat: "family-support", sub: "Caregiver Support",
    desc: "Elizabeth Dole Foundation — national nonprofit empowering America's 5.5M military + veteran caregivers ('Hidden Heroes'). Hidden Heroes Cities (incl. Boston + Worcester), Caregiver Fellows program, employment + financial wellness + respite resources, and policy advocacy for MA caregivers.",
    website_url: "https://elizabethdolefoundation.org/", phone: "202-249-7170",
    address: "600 New Hampshire Ave NW, Suite 1010", city: "Washington", zip: "20037",
    source_name: "Elizabeth Dole Foundation" },

  { section: "D", title: "TAPS Tragedy Assistance Program for Survivors",
    cat: "family-support", sub: "Family Counseling",
    desc: "Tragedy Assistance Program for Survivors (TAPS) — national 24/7 nonprofit serving families + loved ones of fallen military across MA. National Military Survivor Helpline (800-959-TAPS), peer-based emotional support, regional survivor seminars, Good Grief Camps for kids, and casework.",
    website_url: "https://www.taps.org/", phone: "800-959-8277",
    address: "3033 Wilson Blvd, 3rd Floor", city: "Arlington", zip: "22201",
    source_name: "TAPS" },

  { section: "D", title: "Blue Star Families New England Chapter",
    cat: "family-support", sub: "Military Family Support",
    desc: "Blue Star Families New England Chapter — national nonprofit MA-active chapter providing military family connection + community-engagement programs. Books on Bases, Blue Star Theatres + Museums, Caregivers Empowering Caregivers groups, employment + spouse-career programs across MA.",
    website_url: "https://bluestarfam.org/chapter/new-england/", phone: "202-630-2583",
    address: "1701 Pennsylvania Ave NW, Suite 200", city: "Washington", zip: "20006",
    source_name: "Blue Star Families" },

  { section: "D", title: "Children of Fallen Patriots Foundation",
    cat: "family-support", sub: "Military Family Support",
    desc: "Children of Fallen Patriots Foundation — national nonprofit providing college scholarships + educational counseling to children whose military parent died as a result of combat or training accident. Average $25K/student, lifetime support through college graduation. MA recipients served.",
    website_url: "https://www.fallenpatriots.org/", phone: "703-871-0911",
    address: "5841 Burke Centre Pkwy, Suite 100", city: "Burke", zip: "22015",
    source_name: "Children of Fallen Patriots Foundation" },

  { section: "D", title: "Folds of Honor Massachusetts Scholarships",
    cat: "family-support", sub: "Military Family Support",
    desc: "Folds of Honor Foundation — national nonprofit providing $5K educational scholarships to spouses + children of military killed or disabled in service. K-12 + higher-ed + trade-school awards; 60K+ scholarships nationwide incl. MA recipients across all 14 counties.",
    website_url: "https://foldsofhonor.org/", phone: "918-274-4700",
    address: "5800 N Patriot Dr", city: "Owasso", zip: "74055",
    source_name: "Folds of Honor Foundation" },

  { section: "D", title: "Massachusetts Family Caregiver Support Program EOEA",
    cat: "family-support", sub: "Caregiver Support",
    desc: "Massachusetts Family Caregiver Support Program (Executive Office of Aging & Independence) — state program operated through ASAPs across all MA counties. Caregiver assessment, info + assistance, individual counseling + support groups, respite + supplemental services, and caregiver training.",
    website_url: "https://www.mass.gov/family-caregiver-support-program", phone: "800-243-4636",
    address: "1 Ashburton Pl, 5th Floor", city: "Boston", zip: "02108",
    source_name: "MA Executive Office of Aging & Independence" },

  { section: "D", title: "Hanscom AFB Exceptional Family Member Program",
    cat: "family-support", sub: "Military Family Support",
    desc: "Hanscom AFB Exceptional Family Member Program (EFMP) — Air Force family-readiness program for active-duty Hanscom families with special-needs members. Medical EFMP enrollment + assignment coordination + Family Support EFMP-FS resource navigation + respite + community-services linkage.",
    website_url: "https://www.hanscomfss.com/efmp", phone: "781-225-2765",
    address: "Bldg 1216, Vandenberg Dr", city: "Hanscom AFB", zip: "01731",
    source_name: "Hanscom AFB Force Support Squadron" },

  { section: "D", title: "Child Care Aware Military Fee Assistance",
    cat: "family-support", sub: "Childcare Assistance",
    desc: "Child Care Aware of America Military Fee Assistance Programs — DOD-funded fee-assistance programs for Army, Navy, Air Force, Marine Corps, Space Force, and DOD civilian families incl. MA recipients. Subsidizes off-base child care to in-house military rate; provider locator + family support.",
    website_url: "https://www.childcareaware.org/fee-assistancerespite/military-programs/", phone: "800-424-2246",
    address: "1515 N Courthouse Rd, 3rd Floor", city: "Arlington", zip: "22201",
    source_name: "Child Care Aware of America" },

  { section: "D", title: "Sesame Street for Military Families",
    cat: "family-support", sub: "Youth Programs",
    desc: "Sesame Street for Military Families — Sesame Workshop nonprofit program providing free bilingual (English/Spanish) age-appropriate educational tools + videos + printables for military children + caregivers nationwide incl. MA. Topics: deployment, homecomings, grief, injury, transitions.",
    website_url: "https://sesamestreetformilitaryfamilies.org/", phone: "212-595-3456",
    address: "1900 Broadway", city: "New York", zip: "10023",
    source_name: "Sesame Workshop" },

  { section: "D", title: "Our Military Kids",
    cat: "family-support", sub: "Youth Programs",
    desc: "Our Military Kids — national nonprofit providing $300+ activity grants to children of deployed National Guard + Reserve service members + post-9/11 wounded/injured/ill veterans of all branches. Sports, fine arts, tutoring grants for K-12 children incl. MA recipients statewide.",
    website_url: "https://www.ourmilitarykids.org/", phone: "703-734-6654",
    address: "6861 Elm St, Suite 2A", city: "McLean", zip: "22101",
    source_name: "Our Military Kids" },

  { section: "D", title: "National Military Family Association",
    cat: "family-support", sub: "Military Family Support",
    desc: "National Military Family Association (NMFA) — national nonprofit advocacy + direct-service organization for military families nationwide incl. MA. Operation Purple summer camps, military spouse scholarships, caregiver retreats, deployment support, and policy advocacy on family-support issues.",
    website_url: "https://www.militaryfamily.org/", phone: "703-931-6632",
    address: "3601 Eisenhower Ave, Suite 425", city: "Alexandria", zip: "22304",
    source_name: "National Military Family Association" },

  { section: "D", title: "Home Base Family Support Program Boston",
    cat: "family-support", sub: "Family Counseling",
    desc: "Home Base (Mass General Brigham + Red Sox Foundation) Family Support — confidential no-cost clinical care + intensive family programs for post-9/11 veterans + service members + their families across New England. PTSD + TBI + family counseling + caregiver workshops + bereavement support.",
    website_url: "https://homebase.org/", phone: "617-724-5202",
    address: "125 Nashua St, Suite 600", city: "Boston", zip: "02114",
    source_name: "Home Base — A Red Sox Foundation and Massachusetts General Hospital Program" },
];

await runSeed(ROWS, {
  state: "MA",
  commit: COMMIT,
  scriptName: "seed-ma-wave7.ts (Golden Standard Wave 7 / final category depth)",
  urlCheckTimeoutMs: 12000,
  allowBrokenUrls: ALLOW_BROKEN_URLS,
  allowZipBleed: ALLOW_ZIP_BLEED,
  sectionLabels: {
    A: "End-of-Life Services",
    B: "Crisis Help",
    C: "Disabled Veterans",
    D: "Family Support / Caregivers",
  },
});
