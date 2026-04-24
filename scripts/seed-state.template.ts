/**
 * STATE SEED TEMPLATE — copy, rename, fill in.
 *
 * Filename convention:  scripts/seed-{xx}-{phase}{round}.ts
 *   xx     = lowercase 2-letter state code  (fl, tn, va, …)
 *   phase  = phase1 | phase2 | phase3
 *   round  = optional letter (a, b) for top-up scripts
 *
 * Example:  scripts/seed-fl-phase1.ts
 *           scripts/seed-fl-phase2-statewide.ts
 *           scripts/seed-fl-phase3b-topup.ts
 *
 * Run:
 *   tsx scripts/seed-fl-phase1.ts            # dry-run (always do this first)
 *   tsx scripts/seed-fl-phase1.ts --commit   # writes to DB
 *
 * After --commit, ALWAYS run:
 *   tsx scripts/qa-state.ts --state=FL
 *   tsx scripts/founder-report.ts --state=FL --baseline=<prior_total>
 *
 * See replit.md → "State Rollout SOP" for the complete runbook.
 */
import { runSeed, SeedRow } from "./lib/rollout-engine";

// ============================================================================
// 1. STATE
// ============================================================================
const STATE = "XX"; // <-- TODO: 2-letter state code (FL, TN, VA, …)

// ============================================================================
// 2. SECTION LABELS — short code per section + human label for the report.
//    Use city codes for city-anchored phases, category letters for thematic.
// ============================================================================
const SECTION_LABELS: Record<string, string> = {
  // Example for Florida Phase 1 (major metros):
  // JAX: "Jacksonville",
  // MIA: "Miami",
  // TPA: "Tampa",
  // ORL: "Orlando",
  // STW: "Statewide",
};

// ============================================================================
// 3. ROWS — every row uses verified institutional URL + phone.
//    Required: title, cat, sub, desc.
//    Recommended: website_url, phone, address, city, zip, latitude, longitude,
//                 source_name, source_type, section.
//
//    cat = category slug — must EXACTLY match a row in the categories table.
//          As of 2026-04-24 the 17 valid slugs are:
//            housing            -> Housing & Home Services
//            healthcare         -> Healthcare
//            employment         -> Employment Support
//            food-assistance    -> Food Assistance
//            legal              -> Legal Services
//            community-support  -> Community Support
//            education          -> Education & Training
//            end-of-life-services -> End of Life Services
//            transportation     -> Transportation
//            substance-recovery -> Wellness & Recovery
//            crisis-help        -> Crisis Help
//            family-support     -> Family Support
//            va-benefits        -> Benefits Assistance
//            disabled-veterans  -> Disabled Veterans
//            financial          -> Financial & Credit Services
//            insurance          -> Insurance Services
//            mental-health      -> Mental Health
//          Run `tsx scripts/lib/probe-taxonomy.ts` to verify before seeding.
//
//    sub = subcategory NAME exactly as it appears in the subcategories table
//          for that category. Pre-validate by running:
//            tsx scripts/lib/probe-taxonomy.ts        (see SOP)
//
//    The engine auto-skips:
//      - exact-title duplicates (vs national + this state)
//      - normalized near-duplicates (e.g. "Macon VA Clinic" vs
//        "Macon VA Clinic — Carl Vinson VA")
//      - rows with unknown cat slug or unknown sub name
//
//    Each created row gets:
//      state = STATE, status = "approved", sponsored = false
//      resource_categories junction
//      resource_subcategories junction
// ============================================================================
const ROWS: SeedRow[] = [
  // {
  //   section: "JAX",
  //   title: "Jacksonville Housing Authority",
  //   cat: "housing",
  //   sub: "Rental Assistance",
  //   desc: "HUD-VASH and rental assistance for low-income veterans in Duval County.",
  //   website_url: "https://www.jaxha.org",
  //   phone: "904-630-3810",
  //   address: "1300 N Broad Street",
  //   city: "Jacksonville",
  //   zip: "32202",
  //   latitude: 30.3322,
  //   longitude: -81.6557,
  //   source_name: "Jacksonville Housing Authority",
  //   source_type: "government",
  // },
];

// ============================================================================
// 4. RUN
// ============================================================================
const COMMIT = process.argv.includes("--commit");

runSeed(ROWS, {
  state: STATE,
  commit: COMMIT,
  scriptName: `${STATE} SEED`,
  sectionLabels: SECTION_LABELS,
}).catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
