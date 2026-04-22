/**
 * NC Community Support — final top-up (closes the last empty category)
 * Makes NC the complete-shape template across all 17 categories before GA.
 */
import { supabaseAdmin } from "../server/supabase";

const STATE = "NC";
const CATEGORY_SLUG = "community-support";

const ROWS = [
  {
    title: "American Legion Department of North Carolina",
    sub: "American Legion Posts",
    desc: "State headquarters of The American Legion in NC. 350+ posts statewide offering camaraderie, advocacy, service officer support, and community programs.",
    website_url: "https://www.nclegion.org",
    phone: "919-832-7506",
    address: "4 N Blount Street",
    city: "Raleigh",
    zip: "27601",
    latitude: 35.7806,
    longitude: -78.6388,
    eligibility: "Veterans of eligible periods",
    source_name: "American Legion Department of NC",
    source_type: "nonprofit",
  },
  {
    title: "VFW Department of North Carolina",
    sub: "VFW Posts",
    desc: "State headquarters of Veterans of Foreign Wars in NC. 200+ posts statewide. Member services, claims assistance, scholarships, and community events.",
    website_url: "https://www.vfwnc.org",
    phone: "919-779-0961",
    address: "PO Box 41566",
    city: "Raleigh",
    zip: "27629",
    latitude: 35.8164,
    longitude: -78.6181,
    eligibility: "Veterans with overseas/combat service",
    source_name: "Veterans of Foreign Wars Department of NC",
    source_type: "nonprofit",
  },
  {
    title: "AMVETS Department of North Carolina",
    sub: "Veteran Service Organizations",
    desc: "State headquarters of AMVETS in NC. Open to all who honorably served. Member posts, claims service, scholarships, and community programs.",
    website_url: "https://www.amvets.org",
    phone: "877-726-8387",
    state: "NC",
    eligibility: "All honorably discharged veterans",
    source_name: "AMVETS Department of NC",
    source_type: "nonprofit",
  },
  {
    title: "Marine Corps League — Department of North Carolina",
    sub: "Veteran Service Organizations",
    desc: "Statewide Marine Corps League serving Marines and FMF Corpsmen. Local detachments across NC offering camaraderie, service projects, and Toys for Tots support.",
    website_url: "https://www.mcleague.org",
    state: "NC",
    eligibility: "Marines and FMF Corpsmen",
    source_name: "Marine Corps League",
    source_type: "nonprofit",
  },
  {
    title: "Vietnam Veterans of America — North Carolina State Council",
    sub: "Veteran Service Organizations",
    desc: "Statewide VVA council with local chapters across NC. Advocacy, claims assistance, peer support for Vietnam-era veterans and Associates.",
    website_url: "https://www.vva.org",
    phone: "301-585-4000",
    state: "NC",
    eligibility: "Vietnam-era veterans (1964-1975) and Associates",
    source_name: "Vietnam Veterans of America",
    source_type: "nonprofit",
  },
  {
    title: "NC4VETS Resource Network",
    sub: "Veteran Outreach Programs",
    desc: "Statewide NCDMVA-coordinated network connecting NC veterans to nonprofits, faith communities, and government services. Helpline and online directory.",
    website_url: "https://www.nc4vets.com",
    phone: "844-624-8387",
    address: "4001 Mail Service Center",
    city: "Raleigh",
    zip: "27699",
    latitude: 35.7706,
    longitude: -78.6383,
    eligibility: "All NC veterans",
    source_name: "NC Department of Military and Veterans Affairs",
    source_type: "government",
  },
  {
    title: "Project Healing Waters Fly Fishing — NC Chapters",
    sub: "Outdoor Recreation",
    desc: "Therapeutic fly fishing programs for disabled active military and veterans across NC. Local chapters in Asheville, Charlotte, Triangle, Pinehurst, and Coastal NC.",
    website_url: "https://projecthealingwaters.org",
    phone: "888-988-7449",
    state: "NC",
    eligibility: "Disabled active military and veterans",
    source_name: "Project Healing Waters Fly Fishing Inc.",
    source_type: "nonprofit",
  },
  {
    title: "Carolinas Freedom Foundation",
    sub: "Veteran Nonprofit Organizations",
    desc: "Charlotte-based nonprofit honoring veterans and active military through annual Veterans Day Parade, community events, and direct family support programs.",
    website_url: "https://www.carolinasfreedomfoundation.org",
    phone: "704-987-2400",
    address: "PO Box 32643",
    city: "Charlotte",
    zip: "28232",
    latitude: 35.2271,
    longitude: -80.8431,
    eligibility: "Veterans and military families in the Carolinas",
    source_name: "Carolinas Freedom Foundation",
    source_type: "nonprofit",
  },
];

async function main() {
  const { data: cats } = await supabaseAdmin.from("categories").select("id, slug").eq("slug", CATEGORY_SLUG);
  if (!cats || !cats.length) throw new Error(`Category ${CATEGORY_SLUG} not found`);
  const category_id = cats[0].id;

  const { data: subs } = await supabaseAdmin.from("subcategories").select("id, name").eq("category_id", category_id);
  const subMap = new Map<string, string>((subs || []).map((s: any) => [s.name.toLowerCase(), s.id]));

  const { data: nat } = await supabaseAdmin.from("resources").select("title").is("state", null);
  const natTitles = new Set((nat || []).map((r: any) => (r.title || "").toLowerCase().trim()));

  const { data: existing } = await supabaseAdmin.from("resources").select("title").eq("state", STATE);
  const ncTitles = new Set((existing || []).map((r: any) => (r.title || "").toLowerCase().trim()));

  let created = 0, dup = 0, errs: string[] = [];

  for (const r of ROWS) {
    const key = r.title.toLowerCase().trim();
    if (ncTitles.has(key) || natTitles.has(key)) { dup++; continue; }

    const subcategory_id = subMap.get(r.sub.toLowerCase()) || null;

    const insert: Record<string, any> = {
      title: r.title,
      category_id,
      short_description: r.desc,
      website_url: r.website_url || null,
      phone: r.phone || null,
      address: r.address || null,
      city: r.city || null,
      state: STATE,
      zip: r.zip || null,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      geo_source: r.latitude ? "manual_curation" : null,
      geocoded_at: r.latitude ? new Date().toISOString() : null,
      eligibility: r.eligibility || "All veterans",
      subcategory: r.sub,
      source_name: r.source_name,
      source_type: r.source_type,
      status: "approved",
      sponsored: false,
    };

    const { data: ins, error } = await supabaseAdmin.from("resources").insert(insert).select("id").single();
    if (error || !ins) { errs.push(`${r.title}: ${error?.message}`); continue; }

    await supabaseAdmin.from("resource_categories").upsert({ resource_id: ins.id, category_id }, { onConflict: "resource_id,category_id" });
    if (subcategory_id) {
      await supabaseAdmin.from("resource_subcategories").upsert({ resource_id: ins.id, subcategory_id }, { onConflict: "resource_id,subcategory_id" });
    }
    created++;
  }

  console.log(`created=${created}  dup=${dup}  errors=${errs.length}`);
  errs.forEach(e => console.log(`  - ${e}`));
}

main().catch(e => { console.error(e); process.exit(1); });
