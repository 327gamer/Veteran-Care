/**
 * TX Phase 1 B2 — Integrity Fix Patch
 *
 * Triggered by code-review audit (architect, 2026-04-26):
 *   - 5 NCA rows used cem.va.gov/ root with source_name "VA NCA <name> National Cemetery listing".
 *     The cem.va.gov per-cemetery .asp paths return 200 even for garbage slugs (soft-404 SPA shell);
 *     the directory listcem.asp is JS-rendered and contains no cemetery names server-side.
 *     Honest fix: KEEP the cem.va.gov/ org root (verified canonical NCA surface) but downgrade
 *     source_name to acknowledge directory-level (not facility-canonical) evidence.
 *   - 1 NHCCC row used cnic.navy.mil/.../nas_corpus_christi.html (general installation page).
 *     The deeper /about/installation_guide/medical_dental.html page is verified live and is
 *     more facility-specific. Upgrade.
 *   - All system-root rows (VAMCs/CBOCs/CGS/WVP/HVA/DOM/SPEC) labeled "facility page" or
 *     "program page" in source_name should say "system page (covers facility)" or
 *     "system page (covers program)" — honest framing that the evidence is system-level.
 *
 * This script does targeted UPDATEs against existing rows in TX state, by exact title match.
 * No schema changes. Reads from the same supabase_admin client used by the rollout-engine.
 *
 * Usage:
 *   tsx scripts/_fix-tx-b2-integrity.ts                # dry-run, prints planned changes
 *   tsx scripts/_fix-tx-b2-integrity.ts --commit       # actually update rows
 */

import { supabaseAdmin } from "../server/supabase";

const COMMIT = process.argv.includes("--commit");

type Patch = {
  title: string;
  newWebsiteUrl?: string;
  newSourceName?: string;
};

const PATCHES: Patch[] = [
  // ============================================================
  // (1) NHCCC URL upgrade — deeper canonical surface
  // ============================================================
  {
    title: "Naval Health Clinic Corpus Christi",
    newWebsiteUrl:
      "https://www.cnic.navy.mil/regions/cnrse/installations/nas_corpus_christi/about/installation_guide/medical_dental.html",
    newSourceName:
      "Navy CNIC NAS Corpus Christi installation guide — medical/dental page",
  },

  // ============================================================
  // (2) NCA source_name downgrade (5 rows) — honest directory framing
  // ============================================================
  {
    title: "Dallas-Fort Worth National Cemetery",
    newSourceName:
      "VA National Cemetery Administration cemetery directory (cem.va.gov)",
  },
  {
    title: "Houston National Cemetery",
    newSourceName:
      "VA National Cemetery Administration cemetery directory (cem.va.gov)",
  },
  {
    title: "Fort Sam Houston National Cemetery",
    newSourceName:
      "VA National Cemetery Administration cemetery directory (cem.va.gov)",
  },
  {
    title: "Kerrville National Cemetery",
    newSourceName:
      "VA National Cemetery Administration cemetery directory (cem.va.gov)",
  },
  {
    title: "San Antonio National Cemetery",
    newSourceName:
      "VA National Cemetery Administration cemetery directory (cem.va.gov)",
  },

  // ============================================================
  // (3) source_name truthfulness pass — system-root URL with "facility page" claim
  // ============================================================

  // VAMCs (URL is /[region]-health-care/) — system page covers the parent VAMC
  { title: "Michael E. DeBakey VA Medical Center", newSourceName: "VA.gov MEDVAMC system page (covers facility)" },
  { title: "Audie L. Murphy Memorial Veterans Hospital", newSourceName: "VA.gov South Texas Veterans HCS system page (covers facility)" },
  { title: "Olin E. Teague Veterans Medical Center", newSourceName: "VA.gov Central Texas Veterans HCS system page (covers facility)" },
  { title: "Doris Miller Department of Veterans Affairs Medical Center", newSourceName: "VA.gov Central Texas Veterans HCS system page (covers facility)" },
  { title: "Sam Rayburn Memorial Veterans Center", newSourceName: "VA.gov VA North Texas HCS system page (covers facility)" },
  { title: "Dallas VA Medical Center", newSourceName: "VA.gov VA North Texas HCS system page (covers facility)" },
  { title: "Amarillo VA Health Care System", newSourceName: "VA.gov Amarillo VAHCS system page (covers facility)" },
  { title: "George H. O'Brien Jr. VA Medical Center", newSourceName: "VA.gov West Texas VAHCS system page (covers facility)" },
  { title: "El Paso VA Health Care System", newSourceName: "VA.gov El Paso VAHCS system page (covers facility)" },
  { title: "Kerrville VA Medical Center", newSourceName: "VA.gov South Texas Veterans HCS system page (covers facility)" },
  { title: "VA Texas Valley Coastal Bend Health Care System", newSourceName: "VA.gov Find Locations facility entry (vha_740) — Texas Valley Coastal Bend" },

  // CBOCs (Houston system)
  { title: "Beaumont VA Clinic", newSourceName: "VA.gov MEDVAMC system page (covers CBOC)" },
  { title: "Charles Wilson VA Clinic Lufkin", newSourceName: "VA.gov MEDVAMC system page (covers CBOC)" },
  { title: "Conroe VA Clinic", newSourceName: "VA.gov MEDVAMC system page (covers CBOC)" },
  { title: "Galveston VA Clinic", newSourceName: "VA.gov MEDVAMC system page (covers CBOC)" },
  { title: "Katy VA Clinic", newSourceName: "VA.gov MEDVAMC system page (covers CBOC)" },
  { title: "Lake Jackson VA Clinic", newSourceName: "VA.gov MEDVAMC system page (covers CBOC)" },
  { title: "Richmond VA Clinic", newSourceName: "VA.gov MEDVAMC system page (covers CBOC)" },
  { title: "Texas City VA Clinic", newSourceName: "VA.gov MEDVAMC system page (covers CBOC)" },
  { title: "Tomball VA Clinic", newSourceName: "VA.gov MEDVAMC system page (covers CBOC)" },

  // CBOCs (North Texas system)
  { title: "Tyler VA Clinic", newSourceName: "VA.gov VA North Texas HCS system page (covers CBOC)" },
  { title: "Plano VA Clinic", newSourceName: "VA.gov VA North Texas HCS system page (covers CBOC)" },
  { title: "Fort Worth VA Outpatient Clinic", newSourceName: "VA.gov VA North Texas HCS system page (covers CBOC)" },
  { title: "Denton VA Clinic", newSourceName: "VA.gov VA North Texas HCS system page (covers CBOC)" },
  { title: "Sherman VA Clinic", newSourceName: "VA.gov VA North Texas HCS system page (covers CBOC)" },
  { title: "Bridgeport VA Clinic", newSourceName: "VA.gov VA North Texas HCS system page (covers CBOC)" },
  { title: "Granbury VA Clinic", newSourceName: "VA.gov VA North Texas HCS system page (covers CBOC)" },
  { title: "Polk Street VA Clinic Dallas", newSourceName: "VA.gov VA North Texas HCS system page (covers CBOC)" },

  // CBOCs (Central Texas system)
  { title: "Austin VA Outpatient Clinic", newSourceName: "VA.gov Central Texas Veterans HCS system page (covers CBOC)" },
  { title: "Cedar Park VA Clinic", newSourceName: "VA.gov Central Texas Veterans HCS system page (covers CBOC)" },
  { title: "Brownwood VA Clinic", newSourceName: "VA.gov Central Texas Veterans HCS system page (covers CBOC)" },
  { title: "College Station VA Clinic", newSourceName: "VA.gov Central Texas Veterans HCS system page (covers CBOC)" },
  { title: "Killeen VA Clinic", newSourceName: "VA.gov Central Texas Veterans HCS system page (covers CBOC)" },
  { title: "La Grange VA Clinic", newSourceName: "VA.gov Central Texas Veterans HCS system page (covers CBOC)" },
  { title: "Palestine VA Clinic", newSourceName: "VA.gov Central Texas Veterans HCS system page (covers CBOC)" },

  // CBOCs (South Texas system)
  { title: "Frank M. Tejeda Outpatient Clinic", newSourceName: "VA.gov South Texas Veterans HCS system page (covers CBOC)" },
  { title: "North Central Federal Clinic San Antonio", newSourceName: "VA.gov South Texas Veterans HCS system page (covers CBOC)" },
  { title: "Victoria VA Clinic", newSourceName: "VA.gov South Texas Veterans HCS system page (covers CBOC)" },
  { title: "Beeville VA Clinic", newSourceName: "VA.gov South Texas Veterans HCS system page (covers CBOC)" },
  { title: "Eagle Pass VA Clinic", newSourceName: "VA.gov South Texas Veterans HCS system page (covers CBOC)" },
  { title: "Corpus Christi VA Outpatient Clinic", newSourceName: "VA.gov South Texas Veterans HCS system page (covers CBOC)" },
  { title: "Laredo VA Outpatient Clinic", newSourceName: "VA.gov South Texas Veterans HCS system page (covers CBOC)" },
  { title: "New Braunfels VA Clinic", newSourceName: "VA.gov South Texas Veterans HCS system page (covers CBOC)" },

  // CBOCs (West Texas / Big Spring system)
  { title: "Abilene VA Clinic", newSourceName: "VA.gov West Texas VAHCS system page (covers CBOC)" },
  { title: "Odessa VA Clinic", newSourceName: "VA.gov West Texas VAHCS system page (covers CBOC)" },
  { title: "San Angelo VA Clinic", newSourceName: "VA.gov West Texas VAHCS system page (covers CBOC)" },
  { title: "Fort Stockton VA Clinic", newSourceName: "VA.gov West Texas VAHCS system page (covers CBOC)" },

  // CBOCs (El Paso system)
  { title: "Eastside El Paso VA Clinic", newSourceName: "VA.gov El Paso VAHCS system page (covers CBOC)" },

  // CBOCs (Texas Valley Coastal Bend system)
  { title: "McAllen VA Outpatient Clinic", newSourceName: "VA.gov Texas Valley Coastal Bend HCS system page (covers CBOC)" },
  { title: "Brownsville VA Clinic", newSourceName: "VA.gov Texas Valley Coastal Bend HCS system page (covers CBOC)" },

  // CBOCs (Amarillo system)
  { title: "Lubbock VA Clinic", newSourceName: "VA.gov Amarillo VAHCS system page (covers CBOC)" },

  // DOMs (system-page URL — facility name is parent VAMC's program)
  { title: "DeBakey VAMC Domiciliary Residential Rehabilitation", newSourceName: "VA.gov MEDVAMC system page (covers domiciliary program)" },
  { title: "Sam Rayburn VAMC Domiciliary Residential Rehabilitation", newSourceName: "VA.gov VA North Texas HCS system page (covers domiciliary program)" },
  { title: "Doris Miller VAMC Domiciliary Residential Rehabilitation", newSourceName: "VA.gov Central Texas Veterans HCS system page (covers domiciliary program)" },
  { title: "George O'Brien VAMC Domiciliary Residential Rehabilitation", newSourceName: "VA.gov West Texas VAHCS system page (covers domiciliary program)" },

  // SPEC
  { title: "Houston Polytrauma Network Site at DeBakey VAMC", newSourceName: "VA.gov MEDVAMC system page (covers Polytrauma Network Site program)" },
  { title: "Houston Spinal Cord Injury Center at DeBakey VAMC", newSourceName: "VA.gov MEDVAMC system page (covers SCI Center program)" },

  // Caregiver Support Programs (8)
  { title: "Houston DeBakey VA Caregiver Support Program", newSourceName: "VA.gov MEDVAMC system page (covers Caregiver Support Program)" },
  { title: "North Texas VA Caregiver Support Program", newSourceName: "VA.gov VA North Texas HCS system page (covers Caregiver Support Program)" },
  { title: "South Texas VA Caregiver Support Program", newSourceName: "VA.gov South Texas Veterans HCS system page (covers Caregiver Support Program)" },
  { title: "Central Texas VA Caregiver Support Program", newSourceName: "VA.gov Central Texas Veterans HCS system page (covers Caregiver Support Program)" },
  { title: "Amarillo VA Caregiver Support Program", newSourceName: "VA.gov Amarillo VAHCS system page (covers Caregiver Support Program)" },
  { title: "West Texas VA Caregiver Support Program", newSourceName: "VA.gov West Texas VAHCS system page (covers Caregiver Support Program)" },
  { title: "El Paso VA Caregiver Support Program", newSourceName: "VA.gov El Paso VAHCS system page (covers Caregiver Support Program)" },
  { title: "Valley Coastal Bend VA Caregiver Support Program", newSourceName: "VA.gov Texas Valley Coastal Bend HCS system page (covers Caregiver Support Program)" },

  // Women Veterans Programs (8)
  { title: "Houston DeBakey VA Women Veterans Program", newSourceName: "VA.gov MEDVAMC system page (covers Women Veterans Program)" },
  { title: "North Texas VA Women Veterans Program", newSourceName: "VA.gov VA North Texas HCS system page (covers Women Veterans Program)" },
  { title: "South Texas VA Women Veterans Program", newSourceName: "VA.gov South Texas Veterans HCS system page (covers Women Veterans Program)" },
  { title: "Central Texas VA Women Veterans Program", newSourceName: "VA.gov Central Texas Veterans HCS system page (covers Women Veterans Program)" },
  { title: "Amarillo VA Women Veterans Program", newSourceName: "VA.gov Amarillo VAHCS system page (covers Women Veterans Program)" },
  { title: "West Texas VA Women Veterans Program", newSourceName: "VA.gov West Texas VAHCS system page (covers Women Veterans Program)" },
  { title: "El Paso VA Women Veterans Program", newSourceName: "VA.gov El Paso VAHCS system page (covers Women Veterans Program)" },
  { title: "Valley Coastal Bend VA Women Veterans Program", newSourceName: "VA.gov Texas Valley Coastal Bend HCS system page (covers Women Veterans Program)" },

  // HUD-VASH Programs (8)
  { title: "Houston DeBakey VA HUD-VASH Program", newSourceName: "VA.gov MEDVAMC system page (covers HUD-VASH Program)" },
  { title: "North Texas VA HUD-VASH Program", newSourceName: "VA.gov VA North Texas HCS system page (covers HUD-VASH Program)" },
  { title: "South Texas VA HUD-VASH Program", newSourceName: "VA.gov South Texas Veterans HCS system page (covers HUD-VASH Program)" },
  { title: "Central Texas VA HUD-VASH Program", newSourceName: "VA.gov Central Texas Veterans HCS system page (covers HUD-VASH Program)" },
  { title: "Amarillo VA HUD-VASH Program", newSourceName: "VA.gov Amarillo VAHCS system page (covers HUD-VASH Program)" },
  { title: "West Texas VA HUD-VASH Program", newSourceName: "VA.gov West Texas VAHCS system page (covers HUD-VASH Program)" },
  { title: "El Paso VA HUD-VASH Program", newSourceName: "VA.gov El Paso VAHCS system page (covers HUD-VASH Program)" },
  { title: "Valley Coastal Bend VA HUD-VASH Program", newSourceName: "VA.gov Texas Valley Coastal Bend HCS system page (covers HUD-VASH Program)" },

  // Vet Centers using vetcenter.va.gov root (6 rows): downgrade source_name
  // Note: These city-level Vet Centers don't have individual va.gov pages (Plano, Mesquite-area
  // specifically — but the seed assigned program-root URL only to a few). Let me only patch
  // the rows whose URL is vetcenter.va.gov root with the program-level source_name still
  // claiming "[city] facility page" — those need honest framing too. Per grep these are at
  // lines 235, 259, 305, 316, 475 — all already say "VA Vet Center program (vetcenter.va.gov)"
  // which IS already honest. No patch needed for them.
];

async function main() {
  console.log(`=== TX B2 Integrity Patch (${COMMIT ? "COMMIT" : "DRY-RUN"}) — ${PATCHES.length} planned ===\n`);

  let updated = 0;
  let notFound = 0;
  let unchanged = 0;

  for (const p of PATCHES) {
    const { data: rows, error } = await supabaseAdmin
      .from("resources")
      .select("id, title, website_url, source_name, state")
      .eq("state", "TX")
      .eq("title", p.title);

    if (error) {
      console.error(`  ERR ${p.title}: ${error.message}`);
      continue;
    }
    if (!rows || rows.length === 0) {
      console.log(`  NOT FOUND  "${p.title}"`);
      notFound++;
      continue;
    }
    if (rows.length > 1) {
      console.log(`  MULTI MATCH (${rows.length})  "${p.title}" — skipping`);
      continue;
    }
    const row = rows[0];
    const updates: Record<string, string> = {};
    if (p.newWebsiteUrl && p.newWebsiteUrl !== row.website_url) {
      updates.website_url = p.newWebsiteUrl;
    }
    if (p.newSourceName && p.newSourceName !== row.source_name) {
      updates.source_name = p.newSourceName;
    }
    if (Object.keys(updates).length === 0) {
      unchanged++;
      continue;
    }

    if (COMMIT) {
      const { error: upErr } = await supabaseAdmin
        .from("resources")
        .update(updates)
        .eq("id", row.id);
      if (upErr) {
        console.error(`  ERR updating ${p.title}: ${upErr.message}`);
        continue;
      }
    }
    updated++;
    const tag = COMMIT ? "UPDATED" : "WILL UPDATE";
    const fields = Object.keys(updates).join(", ");
    console.log(`  ${tag}  [${fields}]  "${p.title}"`);
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`  ${COMMIT ? "updated" : "will update"}: ${updated}`);
  console.log(`  unchanged (already correct): ${unchanged}`);
  console.log(`  not found in DB: ${notFound}`);
  if (!COMMIT) console.log(`\n(dry-run only — pass --commit to write)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
