/**
 * State Rollout Engine — codified from SC, NC, GA, FL, CA Phases 1-N
 *
 * The single source of truth for seeding new state resources into Veteran Care.
 * All seed-{state}-*.ts scripts MUST import from this module rather than
 * re-implementing dedupe / taxonomy / junction logic.
 *
 * Public surface:
 *   - SeedRow              row shape every seed script uses
 *   - SeedOptions          per-script options (state, commit, labels)
 *   - normalizeTitle()     fuzzy-dedupe key for titles
 *   - loadTaxonomy()       categories + subcategories lookup
 *   - loadDedupeIndex()    in-state + national title index
 *   - runSeed()            dry-run / commit loop with section stats
 *
 * PRE-COMMIT GATES (added post-CA per founder corrections, 2026-04-26):
 *   1. URL liveness: HEAD-request + DNS-resolvability check on every unique
 *      website_url. Hard-fails commit if any are broken unless
 *      --allow-broken-urls is passed.
 *   2. ZIP-state assertion: each row's zip prefix must match the rollout
 *      state's canonical ZIP-3 ranges. Hard-fails commit unless
 *      --allow-zip-bleed is passed.
 */

import { supabaseAdmin } from "../../server/supabase";
import { promises as dnsPromises } from "node:dns";

export type SeedRow = {
  title: string;
  cat: string;            // category slug (e.g. "housing")
  sub: string;            // subcategory NAME exactly as in subcategories table
  desc: string;
  website_url?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  eligibility?: string;
  source_name?: string;
  source_type?: string;
  section?: string;       // freeform group label e.g. "JAX", "MIA", "H", "F"
};

export type SeedOptions = {
  state: string;                                  // 2-letter state code
  commit: boolean;                                // true = write, false = dry-run
  scriptName?: string;                            // for log header
  batchTag?: string;                              // back-compat with older seed files
  sectionLabels?: Record<string, string>;         // section code -> human label
  allowBrokenUrls?: boolean;                      // --allow-broken-urls bypass
  allowZipBleed?: boolean;                        // --allow-zip-bleed bypass
  urlCheckConcurrency?: number;                   // default 8
  urlCheckTimeoutMs?: number;                     // default 5000
};

export type Taxonomy = {
  catBySlug: Map<string, string>;                 // slug -> category_id
  catNameById: Map<string, string>;               // category_id -> name
  subKey: Map<string, string>;                    // `${catId}|${name.lower}` -> sub_id
};

export type DedupeIndex = {
  exactNat: Set<string>;                          // lowercased titles, state IS NULL
  exactState: Set<string>;                        // lowercased titles, state = X
  normalizedAll: Map<string, string>;             // normalized -> sample original title
};

export function normalizeTitle(t: string): string {
  return (t || "")
    .toLowerCase()
    .trim()
    .replace(/[—–-].*$/u, "")
    .replace(/\s*\(.*\)\s*$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function loadTaxonomy(): Promise<Taxonomy> {
  const [{ data: cats }, { data: subs }] = await Promise.all([
    supabaseAdmin.from("categories").select("id, slug, name"),
    supabaseAdmin.from("subcategories").select("id, name, category_id"),
  ]);
  const catBySlug = new Map<string, string>();
  const catNameById = new Map<string, string>();
  (cats || []).forEach((c: any) => {
    catBySlug.set(c.slug, c.id);
    catNameById.set(c.id, c.name);
  });
  const subKey = new Map<string, string>();
  (subs || []).forEach((s: any) =>
    subKey.set(`${s.category_id}|${(s.name || "").toLowerCase().trim()}`, s.id),
  );
  return { catBySlug, catNameById, subKey };
}

export async function loadDedupeIndex(state: string): Promise<DedupeIndex> {
  // Paginated to defeat Supabase's 1000-row default cap on .select() — same
  // bug that caused CA QA to mis-report 1000 when actual was 1140.
  const exactNat = new Set<string>();
  const exactState = new Set<string>();
  const normalizedAll = new Map<string, string>();

  for (const filter of ["nat", "state"] as const) {
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const q = supabaseAdmin.from("resources").select("title");
      const qf = filter === "nat" ? q.is("state", null) : q.eq("state", state);
      const { data, error } = await qf.range(from, from + PAGE - 1);
      if (error) throw error;
      const rows = data || [];
      for (const r of rows as any[]) {
        if (!r.title) continue;
        const t = r.title.toLowerCase().trim();
        if (filter === "nat") exactNat.add(t); else exactState.add(t);
        const n = normalizeTitle(r.title);
        if (!normalizedAll.has(n)) normalizedAll.set(n, r.title);
      }
      if (rows.length < PAGE) break;
      from += PAGE;
    }
  }
  return { exactNat, exactState, normalizedAll };
}

// ---------------------------------------------------------------------------
// PRE-COMMIT GATE #1 — URL liveness
// ---------------------------------------------------------------------------

export type UrlCheckResult =
  | { status: "ok"; code: number }
  | { status: "redirect"; code: number; finalUrl: string }
  | { status: "client_error"; code: number }
  | { status: "server_error"; code: number }
  | { status: "timeout" }
  | { status: "dns_fail"; reason: string }
  | { status: "network_fail"; reason: string }
  | { status: "invalid_url"; reason: string };

export async function checkOneUrl(
  url: string,
  timeoutMs: number,
): Promise<UrlCheckResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (e: any) {
    return { status: "invalid_url", reason: e?.message || "URL parse failed" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { status: "invalid_url", reason: `unsupported protocol ${parsed.protocol}` };
  }

  // DNS pre-check — fast-fails NXDOMAIN before HTTP attempt.
  try {
    await dnsPromises.lookup(parsed.hostname);
  } catch (e: any) {
    return { status: "dns_fail", reason: e?.code || e?.message || "lookup failed" };
  }

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    // Try HEAD first — many sites reject HEAD; fall through to GET if 405/501.
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: ctl.signal,
      headers: { "User-Agent": "VeteranCare-RolloutEngine/1.0 (+url-liveness-gate)" },
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: ctl.signal,
        headers: { "User-Agent": "VeteranCare-RolloutEngine/1.0 (+url-liveness-gate)" },
      });
    }
    clearTimeout(timer);
    if (res.status >= 200 && res.status < 300) return { status: "ok", code: res.status };
    if (res.status >= 300 && res.status < 400) {
      return { status: "redirect", code: res.status, finalUrl: res.url };
    }
    if (res.status >= 400 && res.status < 500) return { status: "client_error", code: res.status };
    return { status: "server_error", code: res.status };
  } catch (e: any) {
    clearTimeout(timer);
    if (e?.name === "AbortError") return { status: "timeout" };
    return { status: "network_fail", reason: e?.code || e?.message || "fetch failed" };
  }
}

export async function checkUrlLiveness(
  rows: SeedRow[],
  opts: { concurrency?: number; timeoutMs?: number } = {},
): Promise<{ broken: { url: string; result: UrlCheckResult; titles: string[] }[]; checked: number }> {
  const concurrency = Math.max(1, opts.concurrency ?? 8);
  const timeoutMs = Math.max(1000, opts.timeoutMs ?? 5000);

  // Bucket rows by URL so we only check each distinct URL once.
  const byUrl = new Map<string, string[]>();
  for (const r of rows) {
    const u = (r.website_url || "").trim();
    if (!u) continue;
    if (!byUrl.has(u)) byUrl.set(u, []);
    byUrl.get(u)!.push(r.title);
  }
  const urls = [...byUrl.keys()];
  console.log(`URL liveness: checking ${urls.length} unique URLs (concurrency=${concurrency}, timeout=${timeoutMs}ms)`);

  const broken: { url: string; result: UrlCheckResult; titles: string[] }[] = [];
  let cursor = 0;
  let done = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= urls.length) return;
      const u = urls[i];
      const result = await checkOneUrl(u, timeoutMs);
      done++;
      if (result.status !== "ok" && result.status !== "redirect") {
        broken.push({ url: u, result, titles: byUrl.get(u) || [] });
      }
      if (done % 25 === 0 || done === urls.length) {
        process.stdout.write(`  …${done}/${urls.length}\n`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { broken, checked: urls.length };
}

// ---------------------------------------------------------------------------
// PRE-COMMIT GATE #2 — ZIP-state assertion
// ---------------------------------------------------------------------------

// ZIP-3 (first 3 digits of a 5-digit ZIP) ranges per state. Source: USPS
// L-005 ZIP Code Designations (canonical postal geography). Conservative —
// dominant ranges only; edge cases (e.g. military APO/FPO) intentionally
// excluded so they fail and force operator review.
export const ZIP3_RANGES_BY_STATE: Record<string, Array<[number, number]>> = {
  AL: [[350, 369]],
  AK: [[995, 999]],
  AZ: [[850, 865]],
  AR: [[716, 729], [755, 755]],
  CA: [[900, 961]],
  CO: [[800, 816]],
  CT: [[6, 6]],
  DE: [[197, 199]],
  DC: [[200, 205], [569, 569]],
  FL: [[320, 349]],
  GA: [[300, 319], [398, 399]],
  HI: [[967, 968]],
  ID: [[832, 838]],
  IL: [[600, 629]],
  IN: [[460, 479]],
  IA: [[500, 528]],
  KS: [[660, 679]],
  KY: [[400, 427]],
  LA: [[700, 714]],
  ME: [[39, 49]],
  MD: [[206, 219]],
  MA: [[10, 27], [55, 55]],
  MI: [[480, 499]],
  MN: [[550, 567]],
  MS: [[386, 397]],
  MO: [[630, 658]],
  MT: [[590, 599]],
  NE: [[680, 693]],
  NV: [[889, 898]],
  NH: [[30, 38]],
  NJ: [[70, 89]],
  NM: [[870, 884]],
  NY: [[100, 149]],
  NC: [[270, 289]],
  ND: [[580, 588]],
  OH: [[430, 459]],
  OK: [[730, 749]],
  OR: [[970, 979]],
  PA: [[150, 196]],
  RI: [[28, 29]],
  SC: [[290, 299]],
  SD: [[570, 577]],
  TN: [[370, 385]],
  TX: [[750, 799], [885, 885]],
  UT: [[840, 847]],
  VT: [[50, 54], [56, 59]],
  VA: [[201, 201], [220, 246]],
  WA: [[980, 994]],
  WV: [[247, 268]],
  WI: [[530, 549]],
  WY: [[820, 831]],
};

export function zipBelongsToState(zip: string | undefined, state: string): boolean {
  if (!zip) return true; // no zip → can't check, treat as ok (city-only or statewide)
  const m = (zip || "").trim().match(/^(\d{3})/);
  if (!m) return false; // malformed
  const z3 = parseInt(m[1], 10);
  const ranges = ZIP3_RANGES_BY_STATE[state.toUpperCase()];
  if (!ranges) return true; // state not in table → fail-open
  return ranges.some(([lo, hi]) => z3 >= lo && z3 <= hi);
}

export function validateZipState(rows: SeedRow[], state: string): {
  bleeders: { title: string; city?: string; zip?: string }[];
  checked: number;
} {
  const bleeders: { title: string; city?: string; zip?: string }[] = [];
  let checked = 0;
  for (const r of rows) {
    if (!r.zip) continue;
    checked++;
    if (!zipBelongsToState(r.zip, state)) {
      bleeders.push({ title: r.title, city: r.city, zip: r.zip });
    }
  }
  return { bleeders, checked };
}

// ---------------------------------------------------------------------------
// runSeed — main loop
// ---------------------------------------------------------------------------

type SectionStats = { created: number; dup: number; near_dup: number; bad_sub: number; err: number };

export async function runSeed(rows: SeedRow[], opts: SeedOptions) {
  const { state, commit } = opts;
  console.log(`\n=== ${opts.scriptName || opts.batchTag || `seed-${state.toLowerCase()}`} ` +
    `(${commit ? "COMMIT" : "DRY-RUN"}) — ${rows.length} rows ===\n`);

  // -------------------------------------------------- PRE-COMMIT GATE #2: ZIP
  const zip = validateZipState(rows, state);
  console.log(`ZIP-state assertion: ${zip.checked} rows had zips; ${zip.bleeders.length} bleeders`);
  if (zip.bleeders.length) {
    console.log(`\nZIP BLEEDERS (zip prefix does not match state ${state}):`);
    for (const b of zip.bleeders.slice(0, 25)) {
      console.log(`  - ${b.title} :: city=${b.city || "?"} zip=${b.zip}`);
    }
    if (zip.bleeders.length > 25) console.log(`  ... +${zip.bleeders.length - 25} more`);
    if (commit && !opts.allowZipBleed) {
      console.error(`\nFATAL: ${zip.bleeders.length} ZIP bleeders detected. Commit blocked.`);
      console.error(`Fix the rows above, OR pass --allow-zip-bleed to bypass (not recommended).`);
      process.exit(2);
    }
  }

  // -------------------------------------------------- PRE-COMMIT GATE #1: URL
  const { broken, checked } = await checkUrlLiveness(rows, {
    concurrency: opts.urlCheckConcurrency,
    timeoutMs: opts.urlCheckTimeoutMs,
  });
  console.log(`URL liveness: ${checked} unique URLs checked; ${broken.length} broken`);
  if (broken.length) {
    console.log(`\nBROKEN URLS:`);
    for (const b of broken.slice(0, 50)) {
      const detail = "code" in b.result ? `${b.result.status} ${b.result.code}`
        : "reason" in b.result ? `${b.result.status} (${b.result.reason})`
        : b.result.status;
      console.log(`  - ${detail}  ${b.url}`);
      console.log(`      affected: ${b.titles.slice(0, 3).join(" | ")}${b.titles.length > 3 ? ` (+${b.titles.length - 3} more)` : ""}`);
    }
    if (broken.length > 50) console.log(`  ... +${broken.length - 50} more`);
    if (commit && !opts.allowBrokenUrls) {
      console.error(`\nFATAL: ${broken.length} broken URLs detected. Commit blocked.`);
      console.error(`Fix the URLs above, OR pass --allow-broken-urls to bypass (not recommended).`);
      process.exit(2);
    }
  }

  const tax = await loadTaxonomy();
  const dup = await loadDedupeIndex(state);

  const stats: Record<string, SectionStats> = {};
  const errs: string[] = [];
  const nearDups: string[] = [];

  const ensure = (sec: string) => {
    if (!stats[sec]) stats[sec] = { created: 0, dup: 0, near_dup: 0, bad_sub: 0, err: 0 };
    return stats[sec];
  };

  for (const r of rows) {
    const sec = r.section || "_";
    const s = ensure(sec);
    const tLower = (r.title || "").toLowerCase().trim();

    if (!tLower) { errs.push(`(no title): row skipped`); s.err++; continue; }

    if (dup.exactNat.has(tLower) || dup.exactState.has(tLower)) {
      s.dup++; continue;
    }

    const norm = normalizeTitle(r.title);
    const collision = dup.normalizedAll.get(norm);
    if (collision && collision.toLowerCase() !== r.title.toLowerCase()) {
      nearDups.push(`${r.title}  ~~  ${collision}`);
      s.near_dup++; continue;
    }

    const category_id = tax.catBySlug.get(r.cat);
    if (!category_id) { errs.push(`${r.title}: unknown category slug "${r.cat}"`); s.err++; continue; }
    const subcategory_id = tax.subKey.get(`${category_id}|${(r.sub || "").toLowerCase().trim()}`);
    if (!subcategory_id) {
      errs.push(`${r.title}: subcategory "${r.sub}" not found in category "${r.cat}"`);
      s.bad_sub++;
      continue;
    }

    const insert: any = {
      title: r.title,
      category_id,
      short_description: r.desc,
      website_url: r.website_url || null,
      phone: r.phone || null,
      address: r.address || null,
      city: r.city || null,
      state,
      zip: r.zip || null,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      geo_source: r.latitude != null ? "manual_curation" : null,
      geocoded_at: r.latitude != null ? new Date().toISOString() : null,
      eligibility: r.eligibility || "All veterans",
      subcategory: r.sub,
      source_name: r.source_name || null,
      source_type: r.source_type || null,
      status: "approved",
      sponsored: false,
    };

    if (!commit) { s.created++; dup.exactState.add(tLower); dup.normalizedAll.set(norm, r.title); continue; }

    const { data: ins, error } = await supabaseAdmin
      .from("resources").insert(insert).select("id").single();
    if (error || !ins) {
      errs.push(`${r.title}: insert failed — ${error?.message || "no row returned"}`);
      s.err++; continue;
    }

    const [rcRes, rsRes] = await Promise.all([
      supabaseAdmin.from("resource_categories")
        .upsert({ resource_id: ins.id, category_id }, { onConflict: "resource_id,category_id" }),
      supabaseAdmin.from("resource_subcategories")
        .upsert({ resource_id: ins.id, subcategory_id }, { onConflict: "resource_id,subcategory_id" }),
    ]);
    // Junction failures count as errors AND surface so the operator knows the
    // resource row may be orphaned (qa-state.ts will also detect it).
    if (rcRes.error || rsRes.error) {
      if (rcRes.error) errs.push(`${r.title}: cat junction failed — ${rcRes.error.message}`);
      if (rsRes.error) errs.push(`${r.title}: sub junction failed — ${rsRes.error.message}`);
      s.err++;
    }

    dup.exactState.add(tLower);
    dup.normalizedAll.set(norm, r.title);
    s.created++;
  }

  console.log("\nSection breakdown:");
  let tC = 0, tD = 0, tN = 0, tB = 0, tE = 0;
  for (const [sec, st] of Object.entries(stats)) {
    const lbl = (opts.sectionLabels?.[sec] ?? "").padEnd(18);
    console.log(`  ${sec.padEnd(5)} ${lbl} ` +
      `created=${st.created.toString().padStart(3)}  dup=${st.dup.toString().padStart(2)}  ` +
      `near_dup=${st.near_dup.toString().padStart(2)}  bad_sub=${st.bad_sub.toString().padStart(2)}  ` +
      `err=${st.err.toString().padStart(2)}`);
    tC += st.created; tD += st.dup; tN += st.near_dup; tB += st.bad_sub; tE += st.err;
  }
  console.log(`\nTOTAL  ${rows.length} rows  |  ` +
    `created=${tC}  dup=${tD}  near_dup=${tN}  bad_sub=${tB}  err=${tE}`);

  if (nearDups.length) {
    console.log(`\nNear-duplicates skipped (${nearDups.length}) — rename or drop, then re-run:`);
    nearDups.forEach(d => console.log(`  - ${d}`));
  }
  if (errs.length) {
    console.log(`\nErrors / skips (${errs.length}):`);
    errs.forEach(e => console.log(`  - ${e}`));
  }
  if (!commit) {
    console.log(`\n(dry-run only — pass --commit to write)`);
  }

  return {
    totalCreated: tC, totalDup: tD, totalNearDup: tN,
    totalBadSub: tB, totalErr: tE, sections: stats,
    urlChecked: checked, urlBroken: broken.length,
    zipChecked: zip.checked, zipBleeders: zip.bleeders.length,
  };
}
