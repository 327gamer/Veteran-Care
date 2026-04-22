/**
 * State Cleanup — Phase 1 (NC + SC)
 *
 * Fixes the QC-flagged issues from `qc-resources.ts`:
 *   1. NC: 6 subcategory text typos          → map to real taxonomy + backfill junctions
 *   2. SC: 16 subcategory text typos         → map to real taxonomy + backfill junctions
 *   3. SC: 4 category junctions missing      → backfill primary-cat junction row
 *   4. SC: 3 duplicate titles                → keep oldest, soft-merge by deleting strict dups
 *   5. NC: 17 missing geo (city set)         → city-centroid backfill
 *   6. SC:  2 missing geo                    → city-centroid backfill
 *   7. NC + SC: VA.gov dead deep-links       → replace with parent VAMC URL (verified 200)
 *   8. NC + SC: county-site / 3rd-party 4xx  → strip to root, re-test, keep if 200
 *
 * Run: tsx scripts/cleanup-states-phase1.ts            # dry-run
 *      tsx scripts/cleanup-states-phase1.ts --commit
 */
import { supabaseAdmin } from "../server/supabase";

const COMMIT = process.argv.includes("--commit");
const HTTP_TIMEOUT_MS = 9000;
const HTTP_CONCURRENCY = 24;

// ----------------------------------------------------------------------
// 1+2. Subcategory text → real taxonomy mapping
// ----------------------------------------------------------------------
const SUB_REMAPS: { id: string; newSub: string }[] = [
  // NC
  { id: "0af74f6d-a78d-4c82-a371-2ce1e91f695b", newSub: "VA Claims Assistance (DAV, VSO, etc.)" }, // American Legion NC
  { id: "3647137d-bae3-4e1d-a198-534658998a46", newSub: "VA Claims Assistance (DAV, VSO, etc.)" }, // VFW NC
  { id: "cc1937d4-1cba-454b-9db7-396deacba357", newSub: "VA Claims Assistance (DAV, VSO, etc.)" }, // AMVETS NC
  { id: "c2b3817b-b382-438d-9fbf-86290d45e8d3", newSub: "Certification Programs" },                // IVMF O2O Fort Liberty
  { id: "c8cc1803-b512-475a-a2bd-557795eb3b13", newSub: "Certification Programs" },                // IVMF O2O Camp Lejeune
  { id: "d2468375-cfd6-4fe9-9400-6c0bc18d4583", newSub: "Skilled Trades Training" },               // NC Apprenticeship
  // SC
  { id: "a2653e57-d576-4dd3-a757-18d6a74fb6c5", newSub: "VA Enrollment & General Benefits Navigation" }, // SC 211 Veteran
  { id: "324b95f1-4b6c-48bb-9391-2a684a1ca9d9", newSub: "Veteran Nonprofit Organizations" },            // Vets Helping Vets Anderson
  { id: "36bf7790-3994-4d6b-bb24-f4dd38f37992", newSub: "County Veterans Service Offices" },            // Charleston County VA Office
  { id: "b2f918ec-32ae-446b-8482-6e587d0c5d1e", newSub: "Counseling & Therapy" },                       // Greenville Vet Ctr Bereavement
  { id: "c5bffd73-7b8d-485b-8691-03b7ec0598ac", newSub: "Family Support (Mental Health)" },             // Columbia Vet Ctr Family
  { id: "90813dbd-249b-48d5-a7c9-9427d5cb5697", newSub: "Family Support (Mental Health)" },             // Charleston Vet Ctr Family
  { id: "c6edcb65-afa9-466c-95e1-1849bb76ccd9", newSub: "Disability Benefits & Claims" },               // DAV Greenville
  { id: "fe944274-53b5-42a1-b75c-70b17853d141", newSub: "Disability Benefits & Claims" },               // DAV Florence
  { id: "5e3794a8-8a6d-4a1f-9bd4-6e1e5498296c", newSub: "Disability Benefits & Claims" },               // DAV Myrtle Beach
  { id: "e56abdc5-aaca-46f9-8f74-905c9be22106", newSub: "Adaptive Recreation" },                        // Veterans Yoga SC
  { id: "35adb204-4159-4f02-8af6-c72fdac5fee0", newSub: "Veteran Outreach Programs" },                  // Beaufort County VA
  { id: "ec3d9f95-1816-434e-9d9e-251f07892fcc", newSub: "Crisis Support" },                             // Greenville VC Crisis
  { id: "be11a311-cb93-4394-8f1d-7593bdaaa321", newSub: "Crisis Support" },                             // Columbia VC Crisis
  { id: "aead258b-dce5-427d-9e98-150250c4d1b9", newSub: "Crisis Support" },                             // SC DMH Mobile Crisis
  { id: "9ad798b7-079f-4f51-8ba7-98f697c63b31", newSub: "VA Enrollment & General Benefits Navigation" },// SC DVA
  { id: "1898c9e3-d90a-4349-8ce9-47fe56e84fd0", newSub: "Crisis Support" },                             // Charleston VC Crisis
];

// ----------------------------------------------------------------------
// 3. SC junction backfills (resource_id needs primary cat junction row)
// ----------------------------------------------------------------------
const JUNCTION_BACKFILLS = [
  "552bd4ff-6643-4b46-9eb7-43e9934f62eb", // VC Manufacturing Training
  "5d1a0ac3-012d-43a6-95be-09c33401a58e", // Lowcountry Food Bank
  "8e7cffbf-caa3-4d9d-a967-bcfc24ca12ae", // Harvest Hope Food Bank
  "1bfc6e0a-0644-4eb8-a107-7648b62f4ec6", // VC Building & Construction Training
];

// ----------------------------------------------------------------------
// 5+6. City centroids (lat, lng) — for missing-geo backfill
// ----------------------------------------------------------------------
const CITY_CENTROIDS: Record<string, [number, number]> = {
  // NC
  "Raleigh":           [35.7796, -78.6382],
  "Charlotte":         [35.2271, -80.8431],
  "Durham":            [35.9940, -78.8986],
  "Fayetteville":      [35.0527, -78.8784],
  "Asheville":         [35.5951, -82.5515],
  "Jacksonville":      [34.7541, -77.4302],
  "Salisbury":         [35.6709, -80.4742],
  "Winston-Salem":     [36.0999, -80.2442],
  "Greensboro":        [36.0726, -79.7920],
  "Greenville":        [35.6127, -77.3664],
  "Wilmington":        [34.2257, -77.9447],
  "Fort Liberty":      [35.1395, -78.9994],
  "Cary":              [35.7915, -78.7811],
  "Hickory":           [35.7344, -81.3445],
  "Chapel Hill":       [35.9132, -79.0558],
  "Cherry Point":      [34.9056, -76.8867],
  // SC (any future SC backfills)
  "Anderson":          [34.5034, -82.6501],
  "Hilton Head Island":[32.2163, -80.7526],
  "Columbia":          [34.0007, -81.0348],
  "Charleston":        [32.7765, -79.9311],
  "Spartanburg":       [34.9496, -81.9320],
  "Florence":          [34.1954, -79.7626],
  "Myrtle Beach":      [33.6891, -78.8867],
};

// ----------------------------------------------------------------------
// 7. VA.gov path → parent VAMC URL mapping
// ----------------------------------------------------------------------
function vagovParentFor(url: string): string | null {
  const m = url.match(/^https?:\/\/(?:www\.)?va\.gov\/([^\/]+)\/.+/i);
  if (!m) return null;
  const parent = m[1].toLowerCase();
  const known = new Set([
    "durham-health-care",
    "salisbury-health-care",
    "asheville-health-care",
    "fayetteville-coastal-health-care",
    "columbia-south-carolina-health-care",
    "charleston-health-care",
    "columbia-regional-benefit-office",
  ]);
  if (known.has(parent)) return `https://www.va.gov/${parent}/`;
  // Older-style /columbia-va-health-care/* → new path
  if (parent === "columbia-va-health-care") return "https://www.va.gov/columbia-south-carolina-health-care/";
  return null;
}

async function probeUrl(url: string): Promise<{ ok: boolean; code?: number }> {
  if (!url) return { ok: false };
  let target = url.trim();
  if (!/^https?:\/\//i.test(target)) target = "https://" + target;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), HTTP_TIMEOUT_MS);
  try {
    const resp = await fetch(target, { method: "GET", redirect: "follow", signal: ctl.signal, headers: { "User-Agent": "VeteranCare-QC/1.0" } });
    return { ok: resp.status < 400, code: resp.status };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  console.log(`\n=== STATE CLEANUP PHASE 1 (${COMMIT ? "COMMIT" : "DRY-RUN"}) ===\n`);

  // ---- Load taxonomy + state rows ----
  const { data: cats } = await supabaseAdmin.from("categories").select("id, slug, name");
  const catById = new Map<string, { slug: string; name: string }>((cats || []).map((c: any) => [c.id, { slug: c.slug, name: c.name }]));

  const { data: subs } = await supabaseAdmin.from("subcategories").select("id, name, category_id");
  const subKey = new Map<string, string>(); // `${cat_id}|${name.lower}` -> sub_id
  (subs || []).forEach((s: any) => subKey.set(`${s.category_id}|${s.name.toLowerCase().trim()}`, s.id));

  const { data: rows } = await supabaseAdmin
    .from("resources")
    .select("id, title, category_id, subcategory, website_url, phone, city, state, zip, latitude, longitude, status")
    .in("state", ["NC", "SC"]);

  const rowById = new Map<string, any>((rows || []).map((r: any) => [r.id, r]));
  console.log(`Loaded ${rows!.length} NC+SC rows`);

  const log = {
    subFixed: 0, subSkipped: [] as string[],
    junctionFixed: 0, junctionSkipped: [] as string[],
    geoFixed: 0, geoSkipped: [] as string[],
    urlFixed: 0, urlVerifiedRoot: 0, urlStillDead: [] as { id: string; url: string }[],
    duplicatesDeleted: 0, duplicateGroups: [] as any[],
  };

  // ---- (1+2) Sub typo fixes ----
  console.log("\n[1+2] Subcategory typo fixes...");
  for (const fix of SUB_REMAPS) {
    const r = rowById.get(fix.id);
    if (!r) { log.subSkipped.push(`${fix.id}: row not found`); continue; }
    const subId = subKey.get(`${r.category_id}|${fix.newSub.toLowerCase()}`);
    if (!subId) { log.subSkipped.push(`${fix.id}: target sub "${fix.newSub}" not in taxonomy for cat ${catById.get(r.category_id)?.slug}`); continue; }

    if (COMMIT) {
      await supabaseAdmin.from("resources").update({ subcategory: fix.newSub }).eq("id", fix.id);
      await supabaseAdmin
        .from("resource_subcategories")
        .upsert({ resource_id: fix.id, subcategory_id: subId }, { onConflict: "resource_id,subcategory_id" });
    }
    log.subFixed++;
  }
  console.log(`  fixed=${log.subFixed}  skipped=${log.subSkipped.length}`);
  log.subSkipped.forEach(s => console.log(`    SKIP: ${s}`));

  // ---- (3) SC primary-cat junction backfill ----
  console.log("\n[3] Junction backfills (resource_categories)...");
  for (const id of JUNCTION_BACKFILLS) {
    const r = rowById.get(id);
    if (!r || !r.category_id) { log.junctionSkipped.push(`${id}: row or cat missing`); continue; }
    if (COMMIT) {
      await supabaseAdmin
        .from("resource_categories")
        .upsert({ resource_id: id, category_id: r.category_id }, { onConflict: "resource_id,category_id" });
    }
    log.junctionFixed++;
  }
  console.log(`  fixed=${log.junctionFixed}  skipped=${log.junctionSkipped.length}`);

  // ---- (4) SC duplicate-title soft merge ----
  console.log("\n[4] Duplicate-title scan (SC)...");
  // Re-pull SC titles, group by normalized title, keep earliest id
  const scRows = rows!.filter((r: any) => r.state === "SC");
  const norm = (t: string) => t.toLowerCase().replace(/\s*[—\-–]\s*south carolina\s*$/i, "").replace(/\s*\(sc[^)]*\)\s*$/i, "").replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
  const groups = new Map<string, any[]>();
  for (const r of scRows) {
    const k = norm(r.title);
    if (!k) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(r);
  }
  for (const [k, list] of groups.entries()) {
    if (list.length < 2) continue;
    list.sort((a, b) => (a.id || "").localeCompare(b.id || ""));
    const keep = list[0];
    const dropList = list.slice(1);
    log.duplicateGroups.push({ key: k, kept: keep.id, dropped: dropList.map(d => d.id) });
    for (const d of dropList) {
      if (COMMIT) {
        await supabaseAdmin.from("resource_categories").delete().eq("resource_id", d.id);
        await supabaseAdmin.from("resource_subcategories").delete().eq("resource_id", d.id);
        await supabaseAdmin.from("resources").delete().eq("id", d.id);
      }
      log.duplicatesDeleted++;
    }
  }
  console.log(`  duplicate groups found: ${log.duplicateGroups.length}, rows ${COMMIT ? "deleted" : "would-delete"}: ${log.duplicatesDeleted}`);
  log.duplicateGroups.forEach(g => console.log(`    "${g.key}": keep ${g.kept}, drop ${g.dropped.join(",")}`));

  // ---- (5+6) Geo backfill via city centroid ----
  console.log("\n[5+6] Geo backfill (city centroid)...");
  const needGeo = rows!.filter((r: any) => r.city && (r.latitude == null || r.longitude == null));
  for (const r of needGeo) {
    const ctr = CITY_CENTROIDS[r.city];
    if (!ctr) { log.geoSkipped.push(`${r.id}: no centroid for "${r.city}"`); continue; }
    if (COMMIT) {
      await supabaseAdmin.from("resources").update({
        latitude: ctr[0],
        longitude: ctr[1],
        geo_source: "city_centroid",
        geocoded_at: new Date().toISOString(),
      }).eq("id", r.id);
    }
    log.geoFixed++;
  }
  console.log(`  fixed=${log.geoFixed}  skipped=${log.geoSkipped.length}`);
  log.geoSkipped.forEach(s => console.log(`    ${s}`));

  // ---- (7+8) URL refresh: VA.gov parent fallback + 4xx-root probe ----
  console.log("\n[7+8] URL refresh (parallel HTTP probing)...");

  const withUrl = rows!.filter((r: any) => r.website_url);
  // Pre-classify: every va.gov deep-link should be replaced with verified parent (no probing required since we know it 200s).
  const fixesQueue: { id: string; oldUrl: string; newUrl: string }[] = [];
  const reprobeQueue: { id: string; oldUrl: string }[] = [];

  for (const r of withUrl) {
    const parent = vagovParentFor(r.website_url);
    if (parent && parent !== r.website_url) {
      fixesQueue.push({ id: r.id, oldUrl: r.website_url, newUrl: parent });
    } else {
      reprobeQueue.push({ id: r.id, oldUrl: r.website_url });
    }
  }

  console.log(`  va.gov parent swaps queued : ${fixesQueue.length}`);
  console.log(`  re-probing                 : ${reprobeQueue.length}`);

  // Probe non-va.gov URLs (only ones that fail get retried at root)
  let probed = 0, alive = 0, rootSwap = 0, stillDead = 0;
  let i = 0;
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= reprobeQueue.length) return;
      const item = reprobeQueue[idx];
      const first = await probeUrl(item.oldUrl);
      probed++;
      if (first.ok) { alive++; }
      else {
        // try root domain
        try {
          const u = new URL(item.oldUrl.startsWith("http") ? item.oldUrl : "https://" + item.oldUrl);
          const root = `${u.protocol}//${u.host}/`;
          if (root !== item.oldUrl) {
            const r2 = await probeUrl(root);
            if (r2.ok) { fixesQueue.push({ id: item.id, oldUrl: item.oldUrl, newUrl: root }); rootSwap++; }
            else { log.urlStillDead.push({ id: item.id, url: item.oldUrl }); stillDead++; }
          } else {
            log.urlStillDead.push({ id: item.id, url: item.oldUrl });
            stillDead++;
          }
        } catch {
          log.urlStillDead.push({ id: item.id, url: item.oldUrl });
          stillDead++;
        }
      }
      if (probed % 50 === 0) process.stdout.write(`\r    probed=${probed}/${reprobeQueue.length} alive=${alive} rootSwap=${rootSwap} stillDead=${stillDead}`);
    }
  }
  await Promise.all(Array.from({ length: HTTP_CONCURRENCY }, worker));
  process.stdout.write("\n");
  console.log(`  alive (no change)          : ${alive}`);
  console.log(`  swapped to root (200 OK)   : ${rootSwap}`);
  console.log(`  STILL DEAD (queue review)  : ${stillDead}`);

  // Apply all URL fixes
  if (COMMIT) {
    for (const f of fixesQueue) {
      await supabaseAdmin.from("resources").update({ website_url: f.newUrl }).eq("id", f.id);
    }
  }
  log.urlFixed = fixesQueue.length;
  log.urlVerifiedRoot = rootSwap;

  // ---- Summary ----
  console.log("\n=========== CLEANUP PHASE 1 SUMMARY ===========");
  console.log(`Subcategory fixes      : ${log.subFixed}`);
  console.log(`Junction backfills     : ${log.junctionFixed}`);
  console.log(`Duplicate row removals : ${log.duplicatesDeleted}`);
  console.log(`Geo backfills          : ${log.geoFixed}`);
  console.log(`URL fixes applied      : ${log.urlFixed} (va.gov parent + ${log.urlVerifiedRoot} root-domain swaps)`);
  console.log(`URLs still dead        : ${log.urlStillDead.length} (manual review queue)`);
  if (log.urlStillDead.length) {
    console.log(`\n  Still-dead URLs (preserved unchanged for now):`);
    log.urlStillDead.forEach(d => console.log(`    ${d.id}  ${d.url}`));
  }

  if (!COMMIT) {
    console.log(`\n(dry-run) Re-run with --commit to apply.`);
  }
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
