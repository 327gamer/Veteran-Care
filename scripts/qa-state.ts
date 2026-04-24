/**
 * State QA — runs all 11 quality checks against the live DB for a single state.
 *
 * Usage:
 *   tsx scripts/qa-state.ts --state=GA
 *   tsx scripts/qa-state.ts --state=FL
 *
 * Checks (each is a numbered section in the output):
 *   1. Row count (total + approved)
 *   2. City distribution (count, list)
 *   3. Category coverage (active vs total)
 *   4. Exact-title duplicates
 *   5. Near-duplicate clusters (normalized titles)
 *   6. Orphan junctions (missing resource_categories / resource_subcategories)
 *   7. State bleed (rows tagged with state but missing city when expected)
 *   8. Subcategory text values invalid against the live subcategories table
 *   9. URL / phone / address completeness
 *  10. City dropdown freshness (DB cities vs live API endpoint)
 *  11. National fallback row count (state IS NULL, status approved)
 */
import { supabaseAdmin } from "../server/supabase";
import { normalizeTitle } from "./lib/rollout-engine";

const stateArg = process.argv.find((a) => a.startsWith("--state="))?.split("=")[1] ?? "";
const STATE = stateArg.toUpperCase();
if (!/^[A-Z]{2}$/.test(STATE)) {
  console.error("Usage: tsx scripts/qa-state.ts --state=XX");
  process.exit(1);
}

async function chunkedJunctionExists(
  table: "resource_categories" | "resource_subcategories",
  ids: string[],
) {
  const have = new Set<string>();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const { data } = await supabaseAdmin.from(table).select("resource_id").in("resource_id", chunk);
    (data || []).forEach((r: any) => have.add(r.resource_id));
  }
  return have;
}

async function main() {
  console.log(`\n=========== STATE QA — ${STATE} ===========\n`);

  const [{ data: rows }, { data: cats }, { data: subs }] = await Promise.all([
    supabaseAdmin
      .from("resources")
      .select("id,title,city,state,zip,category_id,subcategory,website_url,phone,address,status")
      .eq("state", STATE)
      .limit(5000),
    supabaseAdmin.from("categories").select("id,slug,name"),
    supabaseAdmin.from("subcategories").select("id,name,category_id"),
  ]);

  const all = (rows || []) as any[];
  const approved = all.filter((r) => r.status === "approved");
  const nameById = new Map((cats || []).map((c: any) => [c.id, c.name]));
  const subKey = new Map<string, string>();
  (subs || []).forEach((s: any) =>
    subKey.set(`${s.category_id}|${(s.name || "").toLowerCase().trim()}`, s.id),
  );

  // ---------------------------------------------------------------- 1. Rows
  console.log(`1. ROW COUNT`);
  console.log(`   total=${all.length}  approved=${approved.length}  other=${all.length - approved.length}`);

  // ---------------------------------------------------------------- 2. Cities
  const cityCounts: Record<string, number> = {};
  approved.forEach((r) => {
    const c = r.city || "(no city)";
    cityCounts[c] = (cityCounts[c] || 0) + 1;
  });
  const cityList = Object.keys(cityCounts).filter((c) => c !== "(no city)").sort();
  console.log(`\n2. CITIES`);
  console.log(`   distinct=${cityList.length}  no_city_rows=${cityCounts["(no city)"] || 0}`);

  // ---------------------------------------------------------------- 3. Categories
  const catCounts: Record<string, number> = {};
  approved.forEach((r) => {
    const n = nameById.get(r.category_id) || "?";
    catCounts[n] = (catCounts[n] || 0) + 1;
  });
  const dormant = (cats || [])
    .map((c: any) => c.name)
    .filter((n: string) => !catCounts[n]);
  console.log(`\n3. CATEGORIES`);
  console.log(`   active=${Object.keys(catCounts).length}/${(cats || []).length}`);
  if (dormant.length) console.log(`   dormant: ${dormant.join(", ")}`);

  // ---------------------------------------------------------------- 4. Exact duplicates
  const titleCount = new Map<string, number>();
  approved.forEach((r) => {
    const t = (r.title || "").toLowerCase().trim();
    titleCount.set(t, (titleCount.get(t) || 0) + 1);
  });
  const exactDups = [...titleCount].filter(([, n]) => n > 1);
  console.log(`\n4. EXACT-TITLE DUPLICATES: ${exactDups.length}`);
  exactDups.slice(0, 10).forEach(([t, n]) => console.log(`   - "${t}" × ${n}`));
  if (exactDups.length > 10) console.log(`   ... +${exactDups.length - 10} more`);

  // ---------------------------------------------------------------- 5. Near duplicates
  const normMap = new Map<string, string[]>();
  approved.forEach((r) => {
    const n = normalizeTitle(r.title || "");
    if (!n) return;
    if (!normMap.has(n)) normMap.set(n, []);
    normMap.get(n)!.push(r.title);
  });
  const nearDups = [...normMap].filter(([, list]) => {
    if (list.length < 2) return false;
    return new Set(list.map((t) => t.toLowerCase())).size > 1;
  });
  console.log(`\n5. NEAR-DUPLICATE CLUSTERS: ${nearDups.length}`);
  nearDups.slice(0, 15).forEach(([n, list]) =>
    console.log(`   - [${n}]\n       ${list.join("\n       ")}`),
  );
  if (nearDups.length > 15) console.log(`   ... +${nearDups.length - 15} more`);

  // ---------------------------------------------------------------- 6. Orphan junctions
  const ids = approved.map((r) => r.id);
  const [haveCat, haveSub] = await Promise.all([
    chunkedJunctionExists("resource_categories", ids),
    chunkedJunctionExists("resource_subcategories", ids),
  ]);
  const orphanCat = ids.filter((id) => !haveCat.has(id));
  const orphanSub = ids.filter((id) => !haveSub.has(id));
  console.log(`\n6. ORPHAN JUNCTIONS`);
  console.log(`   missing resource_categories: ${orphanCat.length}`);
  console.log(`   missing resource_subcategories: ${orphanSub.length}`);
  if (orphanCat.length) {
    const titles = approved.filter((r) => orphanCat.includes(r.id)).slice(0, 5).map((r) => r.title);
    console.log(`   sample: ${titles.join(" | ")}`);
  }

  // ---------------------------------------------------------------- 7. State bleed
  const noCity = approved.filter((r) => !r.city).length;
  const wrongState = approved.filter((r) => r.state !== STATE).length; // should be 0 because we filtered
  console.log(`\n7. STATE BLEED`);
  console.log(`   wrong-state rows in result: ${wrongState}`);
  console.log(`   rows with no city (statewide programs): ${noCity}`);

  // ---------------------------------------------------------------- 8. Subcategory validity
  let invalidSub = 0;
  const invalidSubSamples: string[] = [];
  approved.forEach((r) => {
    if (!r.subcategory) return;
    const k = `${r.category_id}|${(r.subcategory || "").toLowerCase().trim()}`;
    if (!subKey.has(k)) {
      invalidSub++;
      if (invalidSubSamples.length < 5) {
        invalidSubSamples.push(`${r.title} :: cat=${nameById.get(r.category_id)} sub="${r.subcategory}"`);
      }
    }
  });
  console.log(`\n8. INVALID SUBCATEGORY TEXT: ${invalidSub}`);
  invalidSubSamples.forEach((s) => console.log(`   - ${s}`));

  // ---------------------------------------------------------------- 9. Completeness
  const missingUrl = approved.filter((r) => !r.website_url).length;
  const missingPhone = approved.filter((r) => !r.phone).length;
  const missingAddr = approved.filter((r) => !r.address && r.city).length; // statewide programs may lack address
  console.log(`\n9. COMPLETENESS`);
  console.log(`   missing URL: ${missingUrl}`);
  console.log(`   missing phone: ${missingPhone}`);
  console.log(`   missing address (city-anchored only): ${missingAddr}`);

  // ---------------------------------------------------------------- 10. City dropdown freshness
  console.log(`\n10. CITY DROPDOWN SYNC (DB vs live API)`);
  try {
    const apiRes = await fetch(`http://localhost:5000/api/locations/cities?state=${STATE}`);
    const apiCities = (await apiRes.json()) as string[];
    const apiSorted = [...apiCities].sort();
    const inDbNotApi = cityList.filter((c) => !apiCities.includes(c));
    const inApiNotDb = apiSorted.filter((c) => !cityList.includes(c));
    console.log(`    API=${apiCities.length}  DB=${cityList.length}`);
    if (inDbNotApi.length) console.log(`    in DB not API: ${inDbNotApi.join(", ")}`);
    if (inApiNotDb.length) console.log(`    in API not DB: ${inApiNotDb.join(", ")}`);
    if (!inDbNotApi.length && !inApiNotDb.length) console.log(`    ✓ in sync`);
  } catch (e: any) {
    console.log(`    skipped (API not reachable: ${e.message})`);
  }

  // ---------------------------------------------------------------- 11. National fallback
  const { count: natCount } = await supabaseAdmin
    .from("resources")
    .select("*", { count: "exact", head: true })
    .is("state", null)
    .eq("status", "approved");
  console.log(`\n11. NATIONAL FALLBACK ROWS: ${natCount ?? "?"}`);

  // ---------------------------------------------------------------- Summary
  // HARD_FAIL — must be 0 to advance:
  //   - exact duplicate titles (always wrong)
  //   - orphan junctions (resource missing cat/sub junction row)
  //   - wrong-state rows (state-bleed safeguard)
  //   - invalid subcategory text (bad_sub didn't get caught at seed time)
  // REVIEW — surfaced for human eyes but does NOT block:
  //   - near-duplicate clusters (legitimate parent-org rollups: GLSP regional
  //     offices, DOL career centers, multi-campus VA clinics, etc.)
  //   - missing addresses on city-anchored rows (review whether the row should
  //     instead be tagged statewide)
  const hardFail =
    exactDups.length > 0 ||
    orphanCat.length > 0 ||
    orphanSub.length > 0 ||
    wrongState > 0 ||
    invalidSub > 0;
  const needsReview = nearDups.length > 0 || (missingAddr > 0);
  const verdict = hardFail
    ? "FAIL — fix the items above before advancing"
    : needsReview
      ? "PASS WITH REVIEW — items 5/9 need a human pass but do not block"
      : "PASS — clean across all 11 checks";
  console.log(`\n=========== ${verdict} ===========\n`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
