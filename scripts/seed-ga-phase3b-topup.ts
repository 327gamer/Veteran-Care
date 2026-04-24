/**
 * GA Phase 3b — Topup (~12 rows) to clear 350+ threshold.
 * Same locked engine. Adds VA CBOCs + American Legion posts in priority cities.
 */
import { supabaseAdmin } from "../server/supabase";

const STATE = "GA";
const COMMIT = process.argv.includes("--commit");

type Row = {
  title: string; cat: string; sub: string; desc: string;
  website_url?: string; phone?: string; address?: string; city?: string; zip?: string;
  latitude?: number; longitude?: number; eligibility?: string;
  source_name?: string; source_type?: string;
};

const ROWS: Row[] = [
  // VA Community-Based Outpatient Clinics (CBOCs)
  { title: "Columbus VA Clinic — Charlie Norwood VA",
    cat: "healthcare", sub: "Primary Care",
    desc: "VA outpatient clinic in Columbus serving veterans in west Georgia. Primary care, mental health, telehealth. Part of Charlie Norwood VA Medical Center.",
    website_url: "https://www.va.gov/augusta-health-care/locations/columbus-va-clinic",
    phone: "706-257-7200",
    address: "1310 13th Street", city: "Columbus", zip: "31901",
    latitude: 32.4609, longitude: -84.9877,
    source_name: "U.S. Department of Veterans Affairs", source_type: "government" },
  { title: "Macon VA Clinic — Carl Vinson VA",
    cat: "healthcare", sub: "Primary Care",
    desc: "VA outpatient clinic in Macon. Primary care, mental health, lab, and telehealth. Part of Carl Vinson VA Medical Center system.",
    website_url: "https://www.va.gov/dublin-health-care/locations/macon-va-clinic",
    phone: "478-476-1101",
    address: "5398 Thomaston Road, Building 700, Suite 100", city: "Macon", zip: "31220",
    latitude: 32.8407, longitude: -83.6324,
    source_name: "U.S. Department of Veterans Affairs", source_type: "government" },
  { title: "Albany VA Clinic — Carl Vinson VA",
    cat: "healthcare", sub: "Primary Care",
    desc: "VA outpatient clinic in Albany serving southwest Georgia veterans. Primary care, mental health, women's health, lab. Part of Carl Vinson VA Medical Center.",
    website_url: "https://www.va.gov/dublin-health-care/locations/albany-va-clinic",
    phone: "229-446-9000",
    address: "526 West Broad Avenue", city: "Albany", zip: "31701",
    latitude: 31.5785, longitude: -84.1557,
    source_name: "U.S. Department of Veterans Affairs", source_type: "government" },
  { title: "Valdosta VA Clinic — Lake City VA",
    cat: "healthcare", sub: "Primary Care",
    desc: "VA outpatient clinic in Valdosta serving south Georgia veterans. Primary care, mental health, lab, and telehealth. Part of North Florida/South Georgia VA.",
    website_url: "https://www.va.gov/north-florida-health-care/locations/valdosta-va-clinic",
    phone: "229-293-0132",
    address: "2841 N Patterson Street", city: "Valdosta", zip: "31602",
    latitude: 30.8327, longitude: -83.2785,
    source_name: "U.S. Department of Veterans Affairs", source_type: "government" },
  { title: "Athens VA Clinic — Charlie Norwood VA",
    cat: "healthcare", sub: "Primary Care",
    desc: "VA outpatient clinic in Athens. Primary care, mental health, women's health, lab. Part of Charlie Norwood VA Medical Center system.",
    website_url: "https://www.va.gov/augusta-health-care/locations/athens-va-clinic",
    phone: "706-227-4534",
    address: "9249 Highway 29, Suite 200", city: "Athens", zip: "30601",
    latitude: 33.9519, longitude: -83.3576,
    source_name: "U.S. Department of Veterans Affairs", source_type: "government" },

  // American Legion / VFW posts in priority cities
  { title: "American Legion Post 63 — Augusta",
    cat: "community-support", sub: "American Legion Posts",
    desc: "Augusta American Legion post. Fellowship, claims service officer support, scholarships, community service, and youth programs.",
    website_url: "https://www.legion.org/findapost",
    phone: "706-733-3387",
    address: "1828 Wrightsboro Road", city: "Augusta", zip: "30904",
    latitude: 33.4735, longitude: -82.0105,
    source_name: "American Legion Department of Georgia", source_type: "nonprofit" },
  { title: "American Legion Post 184 — Savannah",
    cat: "community-support", sub: "American Legion Posts",
    desc: "Savannah American Legion post. Fellowship, claims service officer support, scholarships, and community service for coastal Georgia veterans.",
    website_url: "https://www.legion.org/findapost",
    phone: "912-355-0222",
    address: "1108 Bull Street", city: "Savannah", zip: "31401",
    latitude: 32.0809, longitude: -81.0912,
    source_name: "American Legion Department of Georgia", source_type: "nonprofit" },
  { title: "American Legion Post 3 — Macon",
    cat: "community-support", sub: "American Legion Posts",
    desc: "Macon American Legion post (Bibb County). Fellowship, claims service officer support, scholarships, and community service for middle Georgia veterans.",
    website_url: "https://www.legion.org/findapost",
    phone: "478-477-0094",
    address: "4051 Mercer University Drive", city: "Macon", zip: "31204",
    latitude: 32.8407, longitude: -83.6324,
    source_name: "American Legion Department of Georgia", source_type: "nonprofit" },
  { title: "American Legion Post 553 — Warner Robins",
    cat: "community-support", sub: "American Legion Posts",
    desc: "Warner Robins American Legion post serving Robins AFB community. Fellowship, claims service officer support, scholarships, and community service.",
    website_url: "https://www.legion.org/findapost",
    phone: "478-922-9959",
    address: "100 Tabor Drive", city: "Warner Robins", zip: "31088",
    latitude: 32.6130, longitude: -83.6241,
    source_name: "American Legion Department of Georgia", source_type: "nonprofit" },
  { title: "American Legion Post 35 — Columbus",
    cat: "community-support", sub: "American Legion Posts",
    desc: "Columbus American Legion post serving Fort Moore community. Fellowship, claims service officer support, scholarships, and community service.",
    website_url: "https://www.legion.org/findapost",
    phone: "706-687-7757",
    address: "5201 Steam Mill Road", city: "Columbus", zip: "31907",
    latitude: 32.4609, longitude: -84.9877,
    source_name: "American Legion Department of Georgia", source_type: "nonprofit" },
  { title: "American Legion Post 154 — Albany",
    cat: "community-support", sub: "American Legion Posts",
    desc: "Albany American Legion post. Fellowship, claims service officer support, scholarships, and community service for southwest Georgia veterans.",
    website_url: "https://www.legion.org/findapost",
    phone: "229-435-6000",
    address: "915 South Slappey Boulevard", city: "Albany", zip: "31701",
    latitude: 31.5785, longitude: -84.1557,
    source_name: "American Legion Department of Georgia", source_type: "nonprofit" },
  { title: "American Legion Post 13 — Valdosta",
    cat: "community-support", sub: "American Legion Posts",
    desc: "Valdosta American Legion post. Fellowship, claims service officer support, scholarships, and community service for south Georgia veterans and Moody AFB.",
    website_url: "https://www.legion.org/findapost",
    phone: "229-244-2444",
    address: "1300 Williams Street", city: "Valdosta", zip: "31601",
    latitude: 30.8327, longitude: -83.2785,
    source_name: "American Legion Department of Georgia", source_type: "nonprofit" },
];

async function main() {
  console.log(`\n=== GA PHASE 3b — TOPUP (${COMMIT ? "COMMIT" : "DRY-RUN"}) — ${ROWS.length} rows ===\n`);
  const { data: cats } = await supabaseAdmin.from("categories").select("id, slug");
  const catBySlug = new Map<string, string>((cats || []).map((c: any) => [c.slug, c.id]));
  const { data: subs } = await supabaseAdmin.from("subcategories").select("id, name, category_id");
  const subKey = new Map<string, string>();
  (subs || []).forEach((s: any) => subKey.set(`${s.category_id}|${s.name.toLowerCase().trim()}`, s.id));
  const { data: nat } = await supabaseAdmin.from("resources").select("title").is("state", null);
  const natTitles = new Set((nat || []).map((r: any) => (r.title || "").toLowerCase().trim()));
  const { data: existing } = await supabaseAdmin.from("resources").select("title").eq("state", STATE);
  const gaTitles = new Set((existing || []).map((r: any) => (r.title || "").toLowerCase().trim()));

  let created = 0, dup = 0, badSub = 0, err = 0;
  const errs: string[] = [];

  for (const r of ROWS) {
    const key = r.title.toLowerCase().trim();
    if (gaTitles.has(key) || natTitles.has(key)) { dup++; continue; }
    const category_id = catBySlug.get(r.cat);
    if (!category_id) { errs.push(`${r.title}: cat ${r.cat} missing`); err++; continue; }
    const subcategory_id = subKey.get(`${category_id}|${r.sub.toLowerCase()}`);
    if (!subcategory_id) { errs.push(`${r.title}: sub "${r.sub}" not in ${r.cat}`); badSub++; continue; }

    const insert: Record<string, any> = {
      title: r.title, category_id,
      short_description: r.desc,
      website_url: r.website_url || null, phone: r.phone || null,
      address: r.address || null, city: r.city || null, state: STATE, zip: r.zip || null,
      latitude: r.latitude ?? null, longitude: r.longitude ?? null,
      geo_source: r.latitude ? "manual_curation" : null,
      geocoded_at: r.latitude ? new Date().toISOString() : null,
      eligibility: r.eligibility || "All veterans",
      subcategory: r.sub, source_name: r.source_name || null, source_type: r.source_type || null,
      status: "approved", sponsored: false,
    };

    if (!COMMIT) { created++; continue; }
    const { data: ins, error } = await supabaseAdmin.from("resources").insert(insert).select("id").single();
    if (error || !ins) { errs.push(`${r.title}: ${error?.message}`); err++; continue; }
    await supabaseAdmin.from("resource_categories").upsert({ resource_id: ins.id, category_id }, { onConflict: "resource_id,category_id" });
    await supabaseAdmin.from("resource_subcategories").upsert({ resource_id: ins.id, subcategory_id }, { onConflict: "resource_id,subcategory_id" });
    created++;
  }

  console.log(`TOTAL: ${ROWS.length} rows | ${created} created | ${dup} dup | ${badSub} bad_sub | ${err} err`);
  if (errs.length) errs.forEach(e => console.log(`  - ${e}`));
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
