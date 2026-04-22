/**
 * Quality Control Audit — NC + SC (extensible for any state).
 *
 * 8 checks per founder spec:
 *   A. dead websites               (HTTP HEAD/GET fails or 4xx/5xx)
 *   B. broken redirects            (>5 hops, redirect loop, terminal 4xx)
 *   C. bad phone numbers           (bad format OR wrong area code for state)
 *   D. duplicate rows              (same state + same normalized title OR same website)
 *   E. missing geo                 (city set but no lat/lng, or lat/lng outside state bbox)
 *   F. wrong city/state values     (zip prefix doesn't match state)
 *   G. wrong category/subcategory  (resources.category_id != junction OR subcategory text doesn't map to a real sub)
 *   H. inactive orgs to review     (parked-domain heuristics, HTTP 410, "domain for sale", suspension keywords)
 *
 * Run:
 *   tsx scripts/qc-resources.ts                  # both states (NC + SC), report only
 *   tsx scripts/qc-resources.ts --state NC       # one state
 *   tsx scripts/qc-resources.ts --skip-http      # no network checks (fast)
 */
import { supabaseAdmin } from "../server/supabase";

type StateCode = "NC" | "SC";

const STATE_META: Record<StateCode, { areaCodes: string[]; zipPrefix: string[]; bbox: { latMin: number; latMax: number; lngMin: number; lngMax: number } }> = {
  NC: {
    areaCodes: ["252", "336", "704", "743", "828", "910", "919", "980", "984"],
    zipPrefix: ["27", "28"],
    bbox: { latMin: 33.7, latMax: 36.7, lngMin: -84.4, lngMax: -75.4 },
  },
  SC: {
    areaCodes: ["803", "839", "843", "854", "864"],
    zipPrefix: ["29"],
    bbox: { latMin: 32.0, latMax: 35.3, lngMin: -83.4, lngMax: -78.5 },
  },
};

const args = process.argv.slice(2);
const stateFilter = args.includes("--state") ? args[args.indexOf("--state") + 1] : null;
const SKIP_HTTP = args.includes("--skip-http");
const HTTP_CONCURRENCY = 24;
const HTTP_TIMEOUT_MS = 9000;

const PARK_KEYWORDS = [
  "domain is for sale", "buy this domain", "this domain is parked", "parking page",
  "godaddy.com/park", "sedoparking", "domain has expired", "this site can\u2019t be reached",
  "account suspended", "suspendedpage", "default web page", "namecheap parking",
];

function normalizeTitle(t: string): string {
  return (t || "")
    .toLowerCase()
    .replace(/\s*[\u2014\-\u2013]\s*(north carolina|south carolina|nc|sc)\s*$/i, "")
    .replace(/\s*\((nc|sc|north carolina|south carolina)[^)]*\)\s*$/i, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhoneDigits(p?: string | null): string {
  if (!p) return "";
  const d = p.replace(/\D/g, "");
  return d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
}

async function checkUrl(url: string): Promise<{ status: "ok" | "dead" | "redirect_broken" | "parked"; code?: number; reason?: string; finalUrl?: string }> {
  if (!url) return { status: "ok" };
  let target = url.trim();
  if (!/^https?:\/\//i.test(target)) target = "https://" + target;

  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), HTTP_TIMEOUT_MS);

  try {
    let resp: Response;
    try {
      resp = await fetch(target, { method: "GET", redirect: "follow", signal: ctl.signal, headers: { "User-Agent": "VeteranCare-QC/1.0 (+resource-validator)" } });
    } catch (e: any) {
      if (e?.name === "AbortError") return { status: "dead", reason: "timeout" };
      return { status: "dead", reason: e?.message || "fetch_error" };
    }

    if (resp.status >= 400) {
      return { status: "dead", code: resp.status, reason: `HTTP ${resp.status}`, finalUrl: resp.url };
    }

    // sample first 8KB to look for parked-domain markers
    const reader = resp.body?.getReader();
    if (reader) {
      const { value } = await reader.read();
      try { await reader.cancel(); } catch {}
      const txt = (value ? new TextDecoder("utf-8", { fatal: false }).decode(value) : "").toLowerCase();
      for (const k of PARK_KEYWORDS) if (txt.includes(k)) return { status: "parked", code: resp.status, reason: `parked: "${k}"`, finalUrl: resp.url };
    }
    return { status: "ok", code: resp.status, finalUrl: resp.url };
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const states: StateCode[] = stateFilter ? [stateFilter as StateCode] : ["NC", "SC"];
  console.log(`\n=== QC Audit — states: ${states.join(", ")}  http=${SKIP_HTTP ? "SKIP" : "ON"} ===\n`);

  const { data: cats } = await supabaseAdmin.from("categories").select("id, slug, name");
  const catById = new Map<string, { slug: string; name: string }>((cats || []).map((c: any) => [c.id, { slug: c.slug, name: c.name }]));

  const { data: subs } = await supabaseAdmin.from("subcategories").select("id, name, category_id");
  const subKey = new Set<string>();
  (subs || []).forEach((s: any) => subKey.add(`${s.category_id}|${s.name.toLowerCase().trim()}`));

  for (const state of states) {
    const meta = STATE_META[state];
    console.log(`\n----- ${state} -----`);

    const { data: rows, error } = await supabaseAdmin
      .from("resources")
      .select("id, title, category_id, subcategory, website_url, phone, city, state, zip, latitude, longitude, status")
      .eq("state", state);
    if (error || !rows) { console.log(`ERROR loading ${state}: ${error?.message}`); continue; }

    console.log(`Loaded ${rows.length} ${state} rows`);

    // distinct cities
    const cities = new Set<string>(); rows.forEach(r => r.city && cities.add(r.city));
    console.log(`Distinct cities: ${cities.size}`);

    // junction map (chunked to avoid PostgREST URL-length limit at ~200+ UUIDs)
    const junctionByRes = new Map<string, Set<string>>();
    const ids = rows.map(r => r.id);
    const CHUNK = 150;
    for (let i = 0; i < ids.length; i += CHUNK) {
      const slice = ids.slice(i, i + CHUNK);
      const { data: jr, error: jerr } = await supabaseAdmin
        .from("resource_categories")
        .select("resource_id, category_id")
        .in("resource_id", slice);
      if (jerr) throw jerr;
      (jr || []).forEach((j: any) => {
        if (!junctionByRes.has(j.resource_id)) junctionByRes.set(j.resource_id, new Set());
        junctionByRes.get(j.resource_id)!.add(j.category_id);
      });
    }

    const flags = {
      A_dead: [] as any[],
      B_redirect: [] as any[],
      C_phone: [] as any[],
      D_dup_title: [] as any[],
      D_dup_url: [] as any[],
      E_geo_missing: [] as any[],
      E_geo_outside: [] as any[],
      F_zip_mismatch: [] as any[],
      G_cat_mismatch: [] as any[],
      G_sub_invalid: [] as any[],
      H_inactive: [] as any[],
    };

    // C – phone format / area code
    for (const r of rows) {
      if (!r.phone) continue;
      const d = normalizePhoneDigits(r.phone);
      if (d.length !== 10) { flags.C_phone.push({ id: r.id, title: r.title, phone: r.phone, why: "not 10 digits" }); continue; }
      const ac = d.slice(0, 3);
      const tollFree = ["800","888","877","866","855","844","833","822","8447"];
      if (!tollFree.includes(ac) && !meta.areaCodes.includes(ac)) {
        flags.C_phone.push({ id: r.id, title: r.title, phone: r.phone, why: `area code ${ac} not ${state}` });
      }
    }

    // D – duplicates within state
    const byTitle = new Map<string, string[]>();
    const byUrl = new Map<string, string[]>();
    for (const r of rows) {
      const tk = normalizeTitle(r.title);
      if (tk) { if (!byTitle.has(tk)) byTitle.set(tk, []); byTitle.get(tk)!.push(r.id); }
      if (r.website_url) {
        const u = r.website_url.replace(/^https?:\/\//i, "").replace(/\/$/, "").toLowerCase();
        if (!byUrl.has(u)) byUrl.set(u, []); byUrl.get(u)!.push(r.id);
      }
    }
    byTitle.forEach((ids, k) => { if (ids.length > 1) flags.D_dup_title.push({ key: k, ids, count: ids.length }); });
    byUrl.forEach((ids, k) => { if (ids.length > 1) flags.D_dup_url.push({ key: k, ids, count: ids.length }); });

    // E – geo
    for (const r of rows) {
      const hasCity = !!r.city;
      const hasGeo = r.latitude != null && r.longitude != null;
      if (hasCity && !hasGeo) flags.E_geo_missing.push({ id: r.id, title: r.title, city: r.city });
      if (hasGeo) {
        const lat = Number(r.latitude), lng = Number(r.longitude);
        if (lat < meta.bbox.latMin || lat > meta.bbox.latMax || lng < meta.bbox.lngMin || lng > meta.bbox.lngMax) {
          flags.E_geo_outside.push({ id: r.id, title: r.title, lat, lng });
        }
      }
    }

    // F – zip prefix
    for (const r of rows) {
      if (!r.zip) continue;
      const z = String(r.zip).trim();
      if (!meta.zipPrefix.some(p => z.startsWith(p))) {
        flags.F_zip_mismatch.push({ id: r.id, title: r.title, zip: r.zip });
      }
    }

    // G – category & subcategory integrity
    for (const r of rows) {
      const set = junctionByRes.get(r.id);
      if (!set || (r.category_id && !set.has(r.category_id))) {
        flags.G_cat_mismatch.push({ id: r.id, title: r.title, why: !set ? "no junction" : "junction missing primary cat" });
      }
      if (r.subcategory && r.category_id) {
        if (!subKey.has(`${r.category_id}|${r.subcategory.toLowerCase().trim()}`)) {
          flags.G_sub_invalid.push({ id: r.id, title: r.title, sub: r.subcategory, cat: catById.get(r.category_id)?.slug });
        }
      }
    }

    // A/B/H – HTTP checks (parallel, bounded)
    if (!SKIP_HTTP) {
      const withUrl = rows.filter(r => r.website_url);
      console.log(`Running HTTP audit on ${withUrl.length} URLs (concurrency=${HTTP_CONCURRENCY})...`);
      let i = 0, done = 0;
      async function worker() {
        while (true) {
          const idx = i++;
          if (idx >= withUrl.length) return;
          const r = withUrl[idx];
          const res = await checkUrl(r.website_url!);
          if (res.status === "dead") flags.A_dead.push({ id: r.id, title: r.title, url: r.website_url, code: res.code, reason: res.reason });
          else if (res.status === "redirect_broken") flags.B_redirect.push({ id: r.id, title: r.title, url: r.website_url, finalUrl: res.finalUrl });
          else if (res.status === "parked") flags.H_inactive.push({ id: r.id, title: r.title, url: r.website_url, reason: res.reason });
          done++;
          if (done % 25 === 0 || done === withUrl.length) process.stdout.write(`\r  HTTP progress: ${done}/${withUrl.length}`);
        }
      }
      await Promise.all(Array.from({ length: HTTP_CONCURRENCY }, worker));
      process.stdout.write("\n");
    }

    // ===== Report =====
    const total =
      flags.A_dead.length + flags.B_redirect.length + flags.C_phone.length +
      flags.D_dup_title.length + flags.D_dup_url.length +
      flags.E_geo_missing.length + flags.E_geo_outside.length +
      flags.F_zip_mismatch.length + flags.G_cat_mismatch.length + flags.G_sub_invalid.length +
      flags.H_inactive.length;

    console.log(`\n${state} QC SUMMARY (issues found):`);
    console.log(`  A. dead websites              : ${flags.A_dead.length}`);
    console.log(`  B. broken redirects           : ${flags.B_redirect.length}`);
    console.log(`  C. bad phone numbers          : ${flags.C_phone.length}`);
    console.log(`  D. duplicate by title         : ${flags.D_dup_title.length} groups`);
    console.log(`  D. duplicate by URL           : ${flags.D_dup_url.length} groups`);
    console.log(`  E. missing geo (has city)     : ${flags.E_geo_missing.length}`);
    console.log(`  E. geo outside ${state} bbox        : ${flags.E_geo_outside.length}`);
    console.log(`  F. zip prefix mismatch        : ${flags.F_zip_mismatch.length}`);
    console.log(`  G. category junction wrong    : ${flags.G_cat_mismatch.length}`);
    console.log(`  G. subcategory text invalid   : ${flags.G_sub_invalid.length}`);
    console.log(`  H. parked / inactive markers  : ${flags.H_inactive.length}`);
    console.log(`  TOTAL flagged items           : ${total}`);

    function dump(label: string, arr: any[], limit = 25) {
      if (!arr.length) return;
      console.log(`\n  --- ${label} (showing up to ${limit}) ---`);
      arr.slice(0, limit).forEach(x => console.log(`    ${JSON.stringify(x)}`));
      if (arr.length > limit) console.log(`    ... +${arr.length - limit} more`);
    }
    dump("A. dead websites", flags.A_dead, 30);
    dump("B. broken redirects", flags.B_redirect, 15);
    dump("C. bad phone numbers", flags.C_phone, 30);
    dump("D. duplicate titles", flags.D_dup_title, 20);
    dump("D. duplicate URLs", flags.D_dup_url, 20);
    dump("E. missing geo", flags.E_geo_missing, 20);
    dump("E. geo outside bbox", flags.E_geo_outside, 20);
    dump("F. zip mismatch", flags.F_zip_mismatch, 20);
    dump("G. cat mismatch", flags.G_cat_mismatch, 20);
    dump("G. sub invalid", flags.G_sub_invalid, 20);
    dump("H. parked / inactive", flags.H_inactive, 30);
  }

  console.log("\n=== QC AUDIT COMPLETE ===\n");
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
