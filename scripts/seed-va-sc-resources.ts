import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const CATEGORIES: Record<string, string> = {
  crisisHelp: "",
  healthcare: "",
  mentalHealth: "",
  communitySupport: "",
};

interface Resource {
  category_id: string;
  title: string;
  short_description: string;
  website_url?: string;
  phone?: string;
  address?: string;
  city?: string;
  state: string | null;
  zip?: string;
  eligibility?: string;
  source_name: string;
  source_type: string;
  status: string;
  sponsored: boolean;
  latitude?: number;
  longitude?: number;
  geo_source?: string;
  service_priority?: string;
}

async function lookupCategories(): Promise<void> {
  const slugMap: Record<string, keyof typeof CATEGORIES> = {
    "crisis-help": "crisisHelp",
    "healthcare": "healthcare",
    "mental-health": "mentalHealth",
    "community-support": "communitySupport",
  };

  const { data: rows, error } = await supabase
    .from("categories")
    .select("id, slug")
    .in("slug", Object.keys(slugMap));

  if (error) throw new Error(`Failed to look up categories: ${error.message}`);

  for (const row of rows || []) {
    const key = slugMap[row.slug];
    if (key) {
      CATEGORIES[key] = row.id;
      console.log(`Category ${row.slug} => ${row.id}`);
    }
  }

  if (!CATEGORIES.crisisHelp) {
    const { data: created, error: createErr } = await supabase
      .from("categories")
      .insert({ name: "Crisis Help", slug: "crisis-help" })
      .select("id")
      .single();

    if (createErr) throw new Error(`Failed to create crisis-help category: ${createErr.message}`);
    CATEGORIES.crisisHelp = created.id;
    console.log(`Created crisis-help category => ${created.id}`);
  }

  const missing = Object.entries(CATEGORIES).filter(([, v]) => !v);
  if (missing.length > 0) {
    throw new Error(`Missing categories: ${missing.map(([k]) => k).join(", ")}`);
  }
}

function buildResources(): Resource[] {
  return [
    // ===== VETERANS CRISIS LINE (National, high priority) =====
    {
      category_id: CATEGORIES.crisisHelp,
      title: "Veterans Crisis Line — 24/7 Suicide Prevention",
      short_description:
        "Free, confidential 24/7 crisis support for veterans, service members, and their families. Call 988 and press 1, text 838255, or chat online. Trained VA responders available day and night.",
      website_url: "https://www.veteranscrisisline.net",
      phone: "988",
      state: null,
      eligibility: "All veterans, service members, and their families",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      service_priority: "immediate",
    },
    // Duplicate for mental-health category
    {
      category_id: CATEGORIES.mentalHealth,
      title: "Veterans Crisis Line — 24/7 Suicide Prevention",
      short_description:
        "Free, confidential 24/7 crisis support for veterans, service members, and their families. Call 988 and press 1, text 838255, or chat online. Trained VA responders available day and night.",
      website_url: "https://www.veteranscrisisline.net",
      phone: "988",
      state: null,
      eligibility: "All veterans, service members, and their families",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      service_priority: "immediate",
    },

    // ===== VA MEDICAL CENTERS (2) =====
    // Dorn VAMC — healthcare
    {
      category_id: CATEGORIES.healthcare,
      title: "Wm. Jennings Bryan Dorn VA Medical Center",
      short_description:
        "Full-service VA medical center serving 36 counties. Primary care, specialty care, surgery, mental health, emergency department, and extended care services.",
      website_url: "https://www.va.gov/columbia-south-carolina-health-care/",
      phone: "803-776-4000",
      address: "6439 Garners Ferry Rd",
      city: "Columbia",
      state: "SC",
      zip: "29209",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 33.9726,
      longitude: -80.9454,
      geo_source: "manual",
    },
    // Dorn VAMC — mental-health duplicate
    {
      category_id: CATEGORIES.mentalHealth,
      title: "Wm. Jennings Bryan Dorn VA Medical Center — Mental Health",
      short_description:
        "Comprehensive VA mental health services including PTSD treatment, counseling, psychiatry, substance abuse programs, and crisis intervention. Part of the Columbia VA Health Care System.",
      website_url: "https://www.va.gov/columbia-south-carolina-health-care/",
      phone: "803-776-4000",
      address: "6439 Garners Ferry Rd",
      city: "Columbia",
      state: "SC",
      zip: "29209",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 33.9726,
      longitude: -80.9454,
      geo_source: "manual",
    },
    // Ralph H. Johnson VAMC — healthcare
    {
      category_id: CATEGORIES.healthcare,
      title: "Ralph H. Johnson VA Medical Center",
      short_description:
        "5-star rated VA teaching hospital serving 22 counties. Provides cardiothoracic surgery, neurosurgery, orthopedics, oncology, mental health, and PTSD treatment.",
      website_url: "https://www.va.gov/charleston-health-care/",
      phone: "843-577-5011",
      address: "109 Bee St",
      city: "Charleston",
      state: "SC",
      zip: "29401",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 32.7842,
      longitude: -79.9530,
      geo_source: "manual",
    },
    // Ralph H. Johnson VAMC — mental-health duplicate
    {
      category_id: CATEGORIES.mentalHealth,
      title: "Ralph H. Johnson VA Medical Center — Mental Health",
      short_description:
        "Comprehensive mental health services including PTSD, military sexual trauma, substance abuse treatment, counseling, and crisis support. Part of the Charleston VA Health Care System.",
      website_url: "https://www.va.gov/charleston-health-care/",
      phone: "843-577-5011",
      address: "109 Bee St",
      city: "Charleston",
      state: "SC",
      zip: "29401",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 32.7842,
      longitude: -79.9530,
      geo_source: "manual",
    },

    // ===== VA OUTPATIENT CLINICS — COLUMBIA SYSTEM (7) =====
    {
      category_id: CATEGORIES.healthcare,
      title: "Anderson VA Clinic",
      short_description:
        "VA outpatient clinic offering primary care, mental health, and specialty services for veterans in the Anderson area. Part of the Columbia VA Health Care System.",
      website_url: "https://www.va.gov/columbia-south-carolina-health-care/locations/anderson-va-clinic",
      phone: "864-224-5450",
      address: "3030 North Hwy 81",
      city: "Anderson",
      state: "SC",
      zip: "29621",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 34.5543,
      longitude: -82.6441,
      geo_source: "manual",
    },
    {
      category_id: CATEGORIES.healthcare,
      title: "Florence VA Clinic",
      short_description:
        "VA outpatient clinic providing primary care, mental health, and specialty services for veterans in the Florence area. Part of the Columbia VA Health Care System.",
      website_url: "https://www.va.gov/columbia-south-carolina-health-care/locations/florence-va-clinic",
      phone: "843-292-8383",
      address: "1380 Celebration Blvd",
      city: "Florence",
      state: "SC",
      zip: "29501",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 34.1735,
      longitude: -79.7890,
      geo_source: "manual",
    },
    {
      category_id: CATEGORIES.healthcare,
      title: "Lance Cpl. Dana Cornell Darnell VA Clinic",
      short_description:
        "VA outpatient clinic offering primary care, mental health, and specialty services for veterans in the Greenville area. Part of the Columbia VA Health Care System.",
      website_url: "https://www.va.gov/columbia-south-carolina-health-care/locations/lance-corporal-dana-cornell-darnell-va-clinic",
      phone: "864-299-1600",
      address: "41 Park Creek Dr",
      city: "Greenville",
      state: "SC",
      zip: "29605",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 34.8118,
      longitude: -82.3870,
      geo_source: "manual",
    },
    {
      category_id: CATEGORIES.healthcare,
      title: "Orangeburg VA Clinic",
      short_description:
        "VA outpatient clinic providing primary care, mental health, and specialty services for veterans in the Orangeburg area. Part of the Columbia VA Health Care System.",
      website_url: "https://www.va.gov/columbia-south-carolina-health-care/locations/orangeburg-va-clinic",
      phone: "803-533-1335",
      address: "151 Magnolia Village Pkwy",
      city: "Orangeburg",
      state: "SC",
      zip: "29118",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 33.4846,
      longitude: -80.8365,
      geo_source: "manual",
    },
    {
      category_id: CATEGORIES.healthcare,
      title: "Rock Hill VA Clinic",
      short_description:
        "VA outpatient clinic offering primary care, mental health, and specialty services for veterans in the Rock Hill area. Part of the Columbia VA Health Care System.",
      website_url: "https://www.va.gov/columbia-south-carolina-health-care/locations/rock-hill-va-clinic",
      phone: "803-366-4848",
      address: "459 Lakeshore Pkwy",
      city: "Rock Hill",
      state: "SC",
      zip: "29730",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 34.9607,
      longitude: -81.0084,
      geo_source: "manual",
    },
    {
      category_id: CATEGORIES.healthcare,
      title: "Spartanburg VA Clinic",
      short_description:
        "VA outpatient clinic providing primary care, mental health, and specialty services for veterans in the Spartanburg area. Part of the Columbia VA Health Care System.",
      website_url: "https://www.va.gov/columbia-south-carolina-health-care/locations/spartanburg-va-clinic",
      phone: "864-582-7025",
      address: "279 N Grove Medical Park Dr",
      city: "Spartanburg",
      state: "SC",
      zip: "29303",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 34.9866,
      longitude: -81.9536,
      geo_source: "manual",
    },
    {
      category_id: CATEGORIES.healthcare,
      title: "Sumter VA Clinic",
      short_description:
        "VA outpatient clinic offering primary care, mental health, and specialty services for veterans in the Sumter area. Part of the Columbia VA Health Care System.",
      website_url: "https://www.va.gov/columbia-south-carolina-health-care/locations/sumter-va-clinic",
      phone: "803-938-9901",
      address: "245 N Bultman Dr",
      city: "Sumter",
      state: "SC",
      zip: "29150",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 33.9468,
      longitude: -80.3365,
      geo_source: "manual",
    },

    // ===== VA OUTPATIENT CLINICS — CHARLESTON SYSTEM, SC ONLY (6) =====
    {
      category_id: CATEGORIES.healthcare,
      title: "Beaufort VA Clinic",
      short_description:
        "VA outpatient clinic providing primary care, mental health, and specialty services for veterans in the Beaufort/Hilton Head area. Part of the Charleston VA Health Care System.",
      website_url: "https://www.va.gov/charleston-health-care/locations/beaufort-va-clinic",
      phone: "843-577-5011",
      address: "1 Pinckney Blvd",
      city: "Beaufort",
      state: "SC",
      zip: "29902",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 32.4316,
      longitude: -80.6698,
      geo_source: "manual",
    },
    {
      category_id: CATEGORIES.healthcare,
      title: "Charleston VA Clinic (CRRC)",
      short_description:
        "VA community resource and referral center offering primary care and support services for veterans in the North Charleston area. Part of the Charleston VA Health Care System.",
      website_url: "https://www.va.gov/charleston-health-care/locations/charleston-va-clinic",
      phone: "843-789-6804",
      address: "2424 City Hall Ln, Ste B",
      city: "North Charleston",
      state: "SC",
      zip: "29406",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 32.8546,
      longitude: -79.9748,
      geo_source: "manual",
    },
    {
      category_id: CATEGORIES.healthcare,
      title: "Goose Creek VA Clinic",
      short_description:
        "VA outpatient clinic providing primary care, mental health, and specialty services for veterans in the Goose Creek area. Part of the Charleston VA Health Care System.",
      website_url: "https://www.va.gov/charleston-health-care/locations/goose-creek-va-clinic",
      phone: "843-577-5011",
      address: "2418 NNPTC Circle",
      city: "Goose Creek",
      state: "SC",
      zip: "29445",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 32.9810,
      longitude: -80.0326,
      geo_source: "manual",
    },
    {
      category_id: CATEGORIES.healthcare,
      title: "Mount Pleasant VA Clinic",
      short_description:
        "VA outpatient clinic offering primary care and specialty services for veterans in the Mount Pleasant area. Part of the Charleston VA Health Care System.",
      website_url: "https://www.va.gov/charleston-health-care/locations/mount-pleasant-va-clinic",
      phone: "843-577-5011",
      address: "180 Wingo Way",
      city: "Mount Pleasant",
      state: "SC",
      zip: "29464",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 32.8468,
      longitude: -79.8203,
      geo_source: "manual",
    },
    {
      category_id: CATEGORIES.healthcare,
      title: "Myrtle Beach VA Clinic",
      short_description:
        "VA outpatient clinic providing primary care, mental health, and specialty services for veterans in the Myrtle Beach area. Part of the Charleston VA Health Care System.",
      website_url: "https://www.va.gov/charleston-health-care/locations/myrtle-beach-va-clinic",
      phone: "843-577-5011",
      address: "1800 Airpark Dr",
      city: "Myrtle Beach",
      state: "SC",
      zip: "29577",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 33.6795,
      longitude: -78.9286,
      geo_source: "manual",
    },
    {
      category_id: CATEGORIES.healthcare,
      title: "North Charleston VA Clinic",
      short_description:
        "VA outpatient clinic offering primary care and specialty services for veterans in the North Charleston area. Part of the Charleston VA Health Care System.",
      website_url: "https://www.va.gov/charleston-health-care/locations/north-charleston-va-clinic",
      phone: "843-577-5011",
      address: "6450 Rivers Ave",
      city: "North Charleston",
      state: "SC",
      zip: "29406",
      eligibility: "Enrolled veterans",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 32.8990,
      longitude: -80.0059,
      geo_source: "manual",
    },

    // ===== VET CENTERS (4) — each gets mental-health + community-support =====
    // Columbia Vet Center — mental-health
    {
      category_id: CATEGORIES.mentalHealth,
      title: "Columbia SC Vet Center",
      short_description:
        "Free, confidential counseling for veterans, service members, and families. Services include PTSD treatment, military sexual trauma support, bereavement counseling, and readjustment help in a non-clinical setting.",
      website_url: "https://www.va.gov/columbia-sc-vet-center/",
      phone: "803-765-9944",
      address: "1710 Richland St, Ste A",
      city: "Columbia",
      state: "SC",
      zip: "29201",
      eligibility: "Veterans, active duty, National Guard, Reserve, and their families",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 34.0044,
      longitude: -81.0282,
      geo_source: "manual",
    },
    // Columbia Vet Center — community-support duplicate
    {
      category_id: CATEGORIES.communitySupport,
      title: "Columbia SC Vet Center",
      short_description:
        "Community-based counseling center for veterans and families. Walk-in or by appointment. Offers peer support, group counseling, and connections to local VA and community resources.",
      website_url: "https://www.va.gov/columbia-sc-vet-center/",
      phone: "803-765-9944",
      address: "1710 Richland St, Ste A",
      city: "Columbia",
      state: "SC",
      zip: "29201",
      eligibility: "Veterans, active duty, National Guard, Reserve, and their families",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 34.0044,
      longitude: -81.0282,
      geo_source: "manual",
    },
    // Charleston Vet Center — mental-health
    {
      category_id: CATEGORIES.mentalHealth,
      title: "Charleston SC Vet Center",
      short_description:
        "Free, confidential counseling for veterans, service members, and families. Services include PTSD treatment, military sexual trauma support, bereavement counseling, and readjustment help.",
      website_url: "https://www.va.gov/charleston-sc-vet-center/",
      phone: "843-789-7000",
      address: "3625 W Montague Ave",
      city: "North Charleston",
      state: "SC",
      zip: "29418",
      eligibility: "Veterans, active duty, National Guard, Reserve, and their families",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 32.8839,
      longitude: -80.0178,
      geo_source: "manual",
    },
    // Charleston Vet Center — community-support duplicate
    {
      category_id: CATEGORIES.communitySupport,
      title: "Charleston SC Vet Center",
      short_description:
        "Community-based counseling center for veterans and families in the Charleston area. Walk-in or by appointment. Offers peer support, group counseling, and connections to local resources.",
      website_url: "https://www.va.gov/charleston-sc-vet-center/",
      phone: "843-789-7000",
      address: "3625 W Montague Ave",
      city: "North Charleston",
      state: "SC",
      zip: "29418",
      eligibility: "Veterans, active duty, National Guard, Reserve, and their families",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 32.8839,
      longitude: -80.0178,
      geo_source: "manual",
    },
    // Greenville Vet Center — mental-health
    {
      category_id: CATEGORIES.mentalHealth,
      title: "Greenville SC Vet Center",
      short_description:
        "Free, confidential counseling for veterans, service members, and families. Services include PTSD treatment, military sexual trauma support, bereavement counseling, and readjustment help.",
      website_url: "https://www.va.gov/greenville-sc-vet-center/",
      phone: "864-271-2711",
      address: "3 Caledon, Ste B",
      city: "Greenville",
      state: "SC",
      zip: "29615",
      eligibility: "Veterans, active duty, National Guard, Reserve, and their families",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 34.8361,
      longitude: -82.3630,
      geo_source: "manual",
    },
    // Greenville Vet Center — community-support duplicate
    {
      category_id: CATEGORIES.communitySupport,
      title: "Greenville SC Vet Center",
      short_description:
        "Community-based counseling center for veterans and families in the Greenville area. Walk-in or by appointment. Offers peer support, group counseling, and connections to local resources.",
      website_url: "https://www.va.gov/greenville-sc-vet-center/",
      phone: "864-271-2711",
      address: "3 Caledon, Ste B",
      city: "Greenville",
      state: "SC",
      zip: "29615",
      eligibility: "Veterans, active duty, National Guard, Reserve, and their families",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 34.8361,
      longitude: -82.3630,
      geo_source: "manual",
    },
    // Myrtle Beach Vet Center — mental-health
    {
      category_id: CATEGORIES.mentalHealth,
      title: "Myrtle Beach Vet Center",
      short_description:
        "Free, confidential counseling for veterans, service members, and families. Services include PTSD treatment, military sexual trauma support, bereavement counseling, and readjustment help.",
      website_url: "https://www.va.gov/myrtle-beach-vet-center/",
      phone: "843-232-2441",
      address: "1101 Johnson Ave, Ste 201",
      city: "Myrtle Beach",
      state: "SC",
      zip: "29577",
      eligibility: "Veterans, active duty, National Guard, Reserve, and their families",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 33.6757,
      longitude: -78.8867,
      geo_source: "manual",
    },
    // Myrtle Beach Vet Center — community-support duplicate
    {
      category_id: CATEGORIES.communitySupport,
      title: "Myrtle Beach Vet Center",
      short_description:
        "Community-based counseling center for veterans and families in the Myrtle Beach area. Walk-in or by appointment. Offers peer support, group counseling, and connections to local resources.",
      website_url: "https://www.va.gov/myrtle-beach-vet-center/",
      phone: "843-232-2441",
      address: "1101 Johnson Ave, Ste 201",
      city: "Myrtle Beach",
      state: "SC",
      zip: "29577",
      eligibility: "Veterans, active duty, National Guard, Reserve, and their families",
      source_name: "VA",
      source_type: "service",
      status: "approved",
      sponsored: false,
      latitude: 33.6757,
      longitude: -78.8867,
      geo_source: "manual",
    },
  ];
}

async function main() {
  console.log("=== SC VA Resource Import ===\n");

  await lookupCategories();

  const resources = buildResources();
  console.log(`\nPrepared ${resources.length} resource records to insert.\n`);

  // Step 3: Insert in batches
  const batchSize = 10;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < resources.length; i += batchSize) {
    const batch = resources.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from("resources")
      .insert(batch)
      .select("id, title, category_id, city");

    if (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
      errors += batch.length;
    } else {
      inserted += data.length;
      for (const r of data) {
        console.log(`  ✓ ${r.title} (${r.city || "statewide"}) — ${r.id}`);
      }
    }
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`Inserted: ${inserted} records`);
  console.log(`Errors: ${errors}`);
  console.log(`\nBreakdown:`);
  console.log(`  - Veterans Crisis Line: 2 records (crisis-help + mental-health)`);
  console.log(`  - VA Medical Centers: 4 records (2 facilities × healthcare + mental-health)`);
  console.log(`  - VA Outpatient Clinics: 13 records (13 facilities × healthcare)`);
  console.log(`  - Vet Centers: 8 records (4 facilities × mental-health + community-support)`);
  console.log(`  - Total unique facilities: 20`);
  console.log(`  - Total DB records (with cross-category): ${resources.length}`);
}

main().catch(console.error);
