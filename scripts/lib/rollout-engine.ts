/**
 * State Rollout Engine — codified from SC, NC, GA Phases 1-3
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
 */

import { supabaseAdmin } from "../../server/supabase";

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
  sectionLabels?: Record<string, string>;         // section code -> human label
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
  const [{ data: nat }, { data: stateRows }] = await Promise.all([
    supabaseAdmin.from("resources").select("title").is("state", null).limit(5000),
    supabaseAdmin.from("resources").select("title").eq("state", state).limit(5000),
  ]);
  const exactNat = new Set<string>();
  const exactState = new Set<string>();
  const normalizedAll = new Map<string, string>();
  (nat || []).forEach((r: any) => {
    if (!r.title) return;
    exactNat.add(r.title.toLowerCase().trim());
    const n = normalizeTitle(r.title);
    if (!normalizedAll.has(n)) normalizedAll.set(n, r.title);
  });
  (stateRows || []).forEach((r: any) => {
    if (!r.title) return;
    exactState.add(r.title.toLowerCase().trim());
    const n = normalizeTitle(r.title);
    if (!normalizedAll.has(n)) normalizedAll.set(n, r.title);
  });
  return { exactNat, exactState, normalizedAll };
}

type SectionStats = { created: number; dup: number; near_dup: number; bad_sub: number; err: number };

export async function runSeed(rows: SeedRow[], opts: SeedOptions) {
  const { state, commit } = opts;
  console.log(`\n=== ${opts.scriptName || `seed-${state.toLowerCase()}`} ` +
    `(${commit ? "COMMIT" : "DRY-RUN"}) — ${rows.length} rows ===\n`);

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

  console.log("Section breakdown:");
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
  };
}
