/**
 * Step 3 Slice 3d-A — Community Support retag (Phase 1 only).
 *
 * READ-ONLY preview. Returns the proposed additive subcategory tags for SC
 * community-support resources without writing anything to the DB.
 *
 * Phase 1 is strictly additive:
 *   - existing subcategory tags are preserved
 *   - existing primary category is preserved (no row moves out of CS)
 *   - only the listed recreation/connection/social/VSO subcategory tags
 *     get *added* to the resource_subcategories junction
 *
 * Phase 2 (vet-center / county-VAO / SC 211 / PVA / auto-allowance primary
 * moves) is intentionally not modeled here — separate slice approval.
 */

import { supabaseAdmin } from "../supabase";

const COMMUNITY_SUPPORT_SLUG = "community-support";

/**
 * Per-resource specific add map (recreation / connection / volunteer /
 * family-friendly / senior records). Keyed by resource UUID for safety.
 */
const SPECIFIC_ADDS: Record<string, { title: string; addSlugs: string[] }> = {
  "c136ced6-9bb6-435a-9b03-283d472d3d1a": {
    title: "Adaptive Sports & Recreation — Ralph H. Johnson VAMC",
    addSlugs: ["adaptive-recreation", "fitness-sports-wellness-groups"],
  },
  "997e8631-8295-43fa-81bd-6ab6436181a9": {
    title: "Charleston Area Therapeutic Riding (CATR) — Veterans Program",
    addSlugs: ["farm-ranch-equine-programs", "adaptive-recreation"],
  },
  "8f296fcb-d861-4253-ae9e-20b3b5494615": {
    title: "Heroes on Horseback — Military / Emergency Responders Program",
    addSlugs: ["farm-ranch-equine-programs", "adaptive-recreation"],
  },
  "456cd30d-c294-4a3a-b404-edfd97a23ef1": {
    title: "Project Healing Waters Fly Fishing — Charleston Program",
    addSlugs: ["outdoor-recreation", "adaptive-recreation"],
  },
  "e56abdc5-aaca-46f9-8f74-905c9be22106": {
    title: "Veterans Yoga Project — South Carolina Network",
    addSlugs: ["fitness-sports-wellness-groups"],
  },
  "3aa933c4-d550-45a3-9277-bf11809fc861": {
    title: "Guitars for Vets — South Carolina (Charleston & Columbia)",
    addSlugs: ["creative-arts-music-hobbies"],
  },
  "9783e0ba-196a-4f59-85ca-7eeb3d59d630": {
    title: "Honor Flight Upstate SC",
    addSlugs: ["events-trips-retreats", "senior-retired-veteran-social"],
  },
  "21ecf640-da3c-424d-8581-f435ffff5e62": {
    title: "Fisher House — Ralph H. Johnson VAMC (Charleston)",
    addSlugs: ["family-friendly-veteran-activities", "events-trips-retreats"],
  },
  "424663b5-b9d4-40f2-865b-e0f214a33441": {
    title: "Blue Star Mothers — 1SC Midlands Chapter",
    addSlugs: ["family-friendly-veteran-activities", "veteran-social-groups"],
  },
  "71d34657-61df-48d9-a1f9-e9ca457d37a1": {
    title: "Blue Star Mothers — SC#8 Coastal Carolina Chapter (Myrtle Beach)",
    addSlugs: ["family-friendly-veteran-activities", "veteran-social-groups"],
  },
  "3bb1b56a-1b2d-4baa-8d8e-c6169c75f5fa": {
    title: "Team Rubicon",
    addSlugs: ["volunteer-mission-community"],
  },
  "c48d97a8-b84a-403c-b2ae-bc54978e3974": {
    title: "Team Rubicon — South Carolina Operations",
    addSlugs: ["volunteer-mission-community"],
  },
  "a56d4255-77a0-4e32-a645-717fa25ab775": {
    title: "The Mission Continues",
    addSlugs: ["volunteer-mission-community"],
  },
  "93942ea1-25cc-4d74-a279-1cdb766bd76b": {
    title: "Team Red White & Blue - South Carolina",
    addSlugs: ["fitness-sports-wellness-groups", "volunteer-mission-community"],
  },
  "219a78fc-8e31-4c9a-ba2a-582ffa3737d4": {
    title: "Team Red White & Blue (Team RWB)",
    addSlugs: ["fitness-sports-wellness-groups", "volunteer-mission-community"],
  },
  "4296ac1d-6ac1-4246-82df-00ec548ad124": {
    title: "Team Red, White & Blue (Team RWB) — Charleston Chapter",
    addSlugs: [
      "fitness-sports-wellness-groups",
      "volunteer-mission-community",
      "veteran-social-groups",
    ],
  },
  "34e341c8-0fc7-4d44-a099-2d32b963b1cd": {
    title: "Marine Corps League — Yellow Footprints Detachment 1154 (Beaufort)",
    addSlugs: ["veteran-social-groups"],
  },
  "7e9e3071-fb9c-4bb4-a3ca-08f9d49f63e5": {
    title: "Vietnam Veterans of America — Lowcountry Chapter (Charleston)",
    addSlugs: ["veteran-social-groups"],
  },
};

/**
 * Local VSO posts/chapters — add `veteran-social-groups`. State-level
 * departments are intentionally excluded (they're admin/coordination
 * offices, not local social posts).
 */
const VSO_POST_IDS_ADD_SOCIAL: Record<string, string> = {
  // American Legion local posts (10)
  "f7b9f081-8cbe-46a7-974e-8c82860606a3": "American Legion — Dennis J. Becker Post 205 (Bluffton)",
  "e8d166fd-5e95-41f8-97cc-de35d586e7cf": "American Legion — Moultrie Post 136 (Mount Pleasant)",
  "61972636-5e75-4fb2-a3fe-b68978e6cf54": "American Legion — Post 185 (Hilton Head Island)",
  "75c7fb10-b989-4c45-8d6b-916a7c81c93f": "American Legion Frank Roach Post 34 (Rock Hill)",
  "c51dd863-90be-44c8-9f92-b8f45227fdb9": "American Legion Post 147 - James Island/Charleston",
  "054133b3-bc2c-4fba-8a76-efc1f8b41f9f": "American Legion Post 147 – Mount Pleasant",
  "fbe6dace-5d84-4ad1-a8cd-b1d72826b289": "American Legion Post 16 – Summerville",
  "34b5106c-5cf5-4a57-abc0-af5acaad526a": "American Legion Post 20 — Florence",
  "f46096a5-82ed-420e-ba62-a36b5a9eb869": "American Legion Post 3 – Spartanburg",
  "7db78532-059b-4bb4-b023-0e0a2014c83c": "American Legion Post 6 - Columbia",
  // VFW local posts (10)
  "c613ec88-d6af-48f3-8e7c-2758861352bb": "VFW Post 10330 - Greenville",
  "3f4aa7c2-409d-4693-a533-74ae94698fef": "VFW Post 10624 — Glen L. Jeffers Post (Mount Pleasant)",
  "cbc56741-4754-4170-8cf1-e82a402b87e7": "VFW Post 3484 – Columbia",
  "d8aa1409-3e16-4fdd-a413-71147a64a960": "VFW Post 3484 — Beaufort",
  "521c7929-9965-4b8d-8389-198bde2236a2": "VFW Post 3747 – Greenville",
  "c2ca8909-0d4e-4c35-9b44-a1fc7c452d75": "VFW Post 4262 - Columbia",
  "eb3a16fd-83d0-4921-9ff9-4ced17544c87": "VFW Post 445 - Charleston",
  "15ede2c9-c5a1-4888-a01f-ff97867f5c84": "VFW Post 5091 - North Charleston",
  "21ed5a63-8421-43f5-81e3-f83ae87ab751": "VFW Post 8346 — Aiken",
  "08d9caf2-528e-4c79-a1b2-f5284a34c9d7": "VFW Post 9138 – Myrtle Beach",
  // DAV local chapters (6)
  "6c434ab0-580f-421d-bfa8-dc1f005c388a": "DAV — Rock Hill / York County Chapter",
  "9f3caa25-10b0-4352-9f9b-a6c5953574ef": "DAV Chapter 12 – Charleston",
  "fe944274-53b5-42a1-b75c-70b17853d141": "DAV Chapter 17 — Florence",
  "5e3794a8-8a6d-4a1f-9bd4-6e1e5498296c": "DAV Chapter 26 — Myrtle Beach",
  "c6edcb65-afa9-466c-95e1-1849bb76ccd9": "DAV Chapter 5 — Greenville",
  "73c8c00a-c880-4490-895f-98fff3b7a680": "DAV Chapter 6 – Columbia",
};

interface ProposedTouch {
  resourceId: string;
  title: string;
  currentSubs: string[];
  addSubs: string[];
  alreadyHad: string[];
  willActuallyAdd: string[];
  wouldCreateOrphan: boolean;
  orphanReason: string | null;
}

export async function runPhase1Preview(stateInput: string) {
  const state = (stateInput || "SC").toUpperCase();

  // 1. Resolve community-support category id.
  const { data: cats, error: catErr } = await supabaseAdmin
    .from("categories")
    .select("id, slug, name")
    .eq("slug", COMMUNITY_SUPPORT_SLUG)
    .limit(1);
  if (catErr) throw catErr;
  const csCat = (cats || [])[0];
  if (!csCat) {
    throw new Error(`community-support category not found in categories table`);
  }

  // 2. Pull all subcategories scoped to community-support.
  const { data: csSubs, error: subErr } = await supabaseAdmin
    .from("subcategories")
    .select("id, slug, name, category_id")
    .eq("category_id", csCat.id);
  if (subErr) throw subErr;
  const subBySlug = new Map<string, { id: string; slug: string; categoryId: string }>();
  for (const s of csSubs || []) {
    subBySlug.set(s.slug, { id: s.id, slug: s.slug, categoryId: s.category_id });
  }

  // 3. Pull all SC community-support resources via the m2m.
  const { data: rcRows, error: rcErr } = await supabaseAdmin
    .from("resource_categories")
    .select("resource_id")
    .eq("category_id", csCat.id);
  if (rcErr) throw rcErr;
  const csResourceIds = Array.from(new Set((rcRows || []).map((r) => r.resource_id)));

  if (csResourceIds.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      state,
      phase: 1,
      additiveOnly: true,
      categorySlug: COMMUNITY_SUPPORT_SLUG,
      totalCsResources: 0,
      proposedTouches: 0,
      proposedAdds: [],
      summary: {},
      notes: ["No community-support resources found via resource_categories"],
    };
  }

  const { data: resources, error: resErr } = await supabaseAdmin
    .from("resources")
    .select("id, title, state, status")
    .in("id", csResourceIds)
    .eq("state", state)
    .eq("status", "approved");
  if (resErr) throw resErr;
  const resById = new Map((resources || []).map((r) => [r.id, r]));

  // 4. Pull current subcategory edges for those resources.
  const { data: rsRows, error: rsErr } = await supabaseAdmin
    .from("resource_subcategories")
    .select("resource_id, subcategory_id")
    .in("resource_id", Array.from(resById.keys()));
  if (rsErr) throw rsErr;

  // sub_id -> sub row
  const allSubIds = Array.from(new Set((rsRows || []).map((r) => r.subcategory_id)));
  const { data: allSubRows } = await supabaseAdmin
    .from("subcategories")
    .select("id, slug")
    .in("id", allSubIds.length > 0 ? allSubIds : ["00000000-0000-0000-0000-000000000000"]);
  const subSlugById = new Map((allSubRows || []).map((s) => [s.id, s.slug]));

  const currentSlugsByResource = new Map<string, Set<string>>();
  for (const row of rsRows || []) {
    const slug = subSlugById.get(row.subcategory_id);
    if (!slug) continue;
    if (!currentSlugsByResource.has(row.resource_id)) {
      currentSlugsByResource.set(row.resource_id, new Set());
    }
    currentSlugsByResource.get(row.resource_id)!.add(slug);
  }

  // 5. Walk the proposed mapping and produce per-resource touches.
  const touches: ProposedTouch[] = [];
  const orphanFlags: string[] = [];

  function evaluate(resourceId: string, addSlugs: string[], titleHint: string) {
    const r = resById.get(resourceId);
    if (!r) {
      // Resource not in this state or not approved — silently skip
      return;
    }
    const current = currentSlugsByResource.get(resourceId) || new Set<string>();
    const alreadyHad: string[] = [];
    const willAdd: string[] = [];
    let orphan = false;
    let orphanReason: string | null = null;

    for (const slug of addSlugs) {
      const sub = subBySlug.get(slug);
      if (!sub) {
        orphan = true;
        orphanReason = `Subcategory '${slug}' not found under community-support — would skip in apply`;
        orphanFlags.push(`${resourceId} -> ${slug}: missing from subcategories table`);
        continue;
      }
      if (sub.categoryId !== csCat.id) {
        orphan = true;
        orphanReason = `Subcategory '${slug}' belongs to a different parent category — would skip`;
        orphanFlags.push(`${resourceId} -> ${slug}: parent_id mismatch`);
        continue;
      }
      if (current.has(slug)) {
        alreadyHad.push(slug);
      } else {
        willAdd.push(slug);
      }
    }

    touches.push({
      resourceId,
      title: r.title || titleHint,
      currentSubs: Array.from(current).sort(),
      addSubs: addSlugs,
      alreadyHad,
      willActuallyAdd: willAdd,
      wouldCreateOrphan: orphan,
      orphanReason,
    });
  }

  for (const [id, spec] of Object.entries(SPECIFIC_ADDS)) {
    evaluate(id, spec.addSlugs, spec.title);
  }
  for (const [id, title] of Object.entries(VSO_POST_IDS_ADD_SOCIAL)) {
    evaluate(id, ["veteran-social-groups"], title);
  }

  // 6. Summary roll-up.
  const byNewSub: Record<string, number> = {};
  let actualAddCount = 0;
  let alreadyFullySatisfied = 0;
  for (const t of touches) {
    if (t.wouldCreateOrphan) continue;
    if (t.willActuallyAdd.length === 0) {
      alreadyFullySatisfied += 1;
      continue;
    }
    actualAddCount += t.willActuallyAdd.length;
    for (const s of t.willActuallyAdd) byNewSub[s] = (byNewSub[s] || 0) + 1;
  }

  // 7. Deterministic action token (stable hash over the planned writes).
  const canonicalPairs: string[] = [];
  for (const t of touches) {
    if (t.wouldCreateOrphan) continue;
    for (const s of t.willActuallyAdd) canonicalPairs.push(`${t.resourceId}|${s}`);
  }
  canonicalPairs.sort();
  const tokenSrc = `phase1|${state}|${canonicalPairs.join(",")}`;
  const actionToken = `cs-retag-p1-${simpleHash(tokenSrc)}`;

  return {
    generatedAt: new Date().toISOString(),
    state,
    phase: 1,
    additiveOnly: true,
    categorySlug: COMMUNITY_SUPPORT_SLUG,
    categoryId: csCat.id,
    totalCsResources: resById.size,
    proposedTouches: touches.length,
    actualEdgeWrites: actualAddCount,
    alreadyFullySatisfied,
    orphansBlocked: orphanFlags.length,
    actionToken,
    summary: {
      byNewSub,
      orphanFlags,
    },
    proposedAdds: touches,
    notes: [
      "Phase 1 is additive only: no existing subcategory edges are removed and no primary category moves.",
      "Each proposed sub is verified to exist under community-support — orphan creation is impossible.",
      "Resources whose addSubs are all already present are reported as alreadyFullySatisfied (no-op on apply).",
      "Phase 2 (vet-center / county-VAO / SC 211 / PVA primary moves) is NOT included.",
    ],
  };
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

interface ApplyOutcome {
  resourceId: string;
  title: string;
  subSlug: string;
  status: "inserted" | "already_present" | "skipped_orphan" | "failed";
  reason?: string;
}

export async function applyPhase1(opts: {
  state: string;
  providedToken: string;
  dryRun?: boolean;
}): Promise<{
  status: number;
  ok: boolean;
  error?: string;
  report?: any;
}> {
  const state = (opts.state || "SC").toUpperCase();
  const dryRun = !!opts.dryRun;

  // 1. Re-run preview fresh — never trust a cached plan.
  const preview = await runPhase1Preview(state);
  if (preview.actionToken !== opts.providedToken) {
    return {
      status: 409,
      ok: false,
      error: `Token mismatch — preview is stale or did not match. expected=${preview.actionToken} provided=${opts.providedToken}. Re-run /api/admin/community-support-retag-preview and retry.`,
    };
  }

  // 2. Resolve sub slug -> id once.
  const { data: csSubsRaw } = await supabaseAdmin
    .from("subcategories")
    .select("id, slug, category_id")
    .eq("category_id", preview.categoryId);
  const subBySlug = new Map<string, { id: string; categoryId: string }>();
  for (const s of csSubsRaw || []) subBySlug.set(s.slug, { id: s.id, categoryId: s.category_id });

  // 3. Pull current edges for the in-scope resources for idempotency check.
  const ids = preview.proposedAdds.map((t: any) => t.resourceId);
  const { data: existing } = await supabaseAdmin
    .from("resource_subcategories")
    .select("resource_id, subcategory_id")
    .in("resource_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const existingPairs = new Set<string>();
  for (const e of existing || []) existingPairs.add(`${e.resource_id}|${e.subcategory_id}`);

  // 4. Walk planned writes, insert each (idempotent, one row at a time for clarity).
  const outcomes: ApplyOutcome[] = [];
  let inserted = 0;
  let alreadyPresent = 0;
  let skipped = 0;
  let failed = 0;

  for (const touch of preview.proposedAdds as any[]) {
    if (touch.wouldCreateOrphan) {
      for (const s of touch.addSubs) {
        outcomes.push({
          resourceId: touch.resourceId,
          title: touch.title,
          subSlug: s,
          status: "skipped_orphan",
          reason: touch.orphanReason || "orphan flagged",
        });
        skipped += 1;
      }
      continue;
    }
    for (const slug of touch.willActuallyAdd as string[]) {
      const sub = subBySlug.get(slug);
      if (!sub) {
        outcomes.push({
          resourceId: touch.resourceId, title: touch.title, subSlug: slug,
          status: "skipped_orphan", reason: "sub not found at apply time",
        });
        skipped += 1;
        continue;
      }
      const key = `${touch.resourceId}|${sub.id}`;
      if (existingPairs.has(key)) {
        outcomes.push({
          resourceId: touch.resourceId, title: touch.title, subSlug: slug,
          status: "already_present",
        });
        alreadyPresent += 1;
        continue;
      }
      if (dryRun) {
        outcomes.push({ resourceId: touch.resourceId, title: touch.title, subSlug: slug, status: "inserted" });
        inserted += 1;
        continue;
      }
      const { error: insErr } = await supabaseAdmin
        .from("resource_subcategories")
        .insert({ resource_id: touch.resourceId, subcategory_id: sub.id });
      if (insErr) {
        // Treat unique-violation as already_present (idempotent fallback).
        const msg = insErr.message || "";
        if (/duplicate|unique/i.test(msg)) {
          outcomes.push({
            resourceId: touch.resourceId, title: touch.title, subSlug: slug,
            status: "already_present", reason: "race: detected on insert",
          });
          alreadyPresent += 1;
        } else {
          outcomes.push({
            resourceId: touch.resourceId, title: touch.title, subSlug: slug,
            status: "failed", reason: msg,
          });
          failed += 1;
        }
        continue;
      }
      outcomes.push({ resourceId: touch.resourceId, title: touch.title, subSlug: slug, status: "inserted" });
      inserted += 1;
    }
  }

  // 5. Verification: re-pull current edges and confirm each planned (resource, sub)
  //    is now present. This catches silent failures.
  let verified = 0;
  let missing = 0;
  if (!dryRun) {
    const { data: postRows } = await supabaseAdmin
      .from("resource_subcategories")
      .select("resource_id, subcategory_id")
      .in("resource_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const postPairs = new Set<string>();
    for (const r of postRows || []) postPairs.add(`${r.resource_id}|${r.subcategory_id}`);
    for (const touch of preview.proposedAdds as any[]) {
      if (touch.wouldCreateOrphan) continue;
      for (const slug of [...touch.willActuallyAdd, ...touch.alreadyHad] as string[]) {
        const sub = subBySlug.get(slug);
        if (!sub) continue;
        if (postPairs.has(`${touch.resourceId}|${sub.id}`)) verified += 1;
        else missing += 1;
      }
    }
  }

  return {
    status: 200,
    ok: failed === 0 && missing === 0,
    report: {
      appliedAt: new Date().toISOString(),
      state,
      phase: 1,
      dryRun,
      tokenMatched: true,
      counts: {
        beforeAlreadyPresent: alreadyPresent,
        inserted,
        skippedOrphan: skipped,
        failed,
        verifiedPostState: verified,
        missingPostState: missing,
      },
      planSummary: preview.summary,
      proposedTouches: preview.proposedTouches,
      proposedEdgeWrites: preview.actualEdgeWrites,
      outcomes,
    },
  };
}
