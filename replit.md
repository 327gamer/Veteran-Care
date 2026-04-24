# Veteran Care

## Safe Operating Protocol (MANDATORY — READ FIRST)

### Current System Posture
- Controlled launch mode
- Monetization hardening complete
- Reconciliation complete
- Safety layer complete
- Controlled automation complete (manual_only mode)
- Supervision, confidence escalation, release-discipline flags complete
- RLS enforcement workflow complete (24/24 tables secured)

### Core Rules
1. **One task per chat** — do not mix unrelated tasks
2. **No silent fixes** — always report root cause, fix applied, tests run, and manual steps remaining
3. **No dangerous resets** — no table deletions, mass record deletes, production data resets, or blind rollbacks without explicit confirmation
4. **No schema changes without security pass** — every new/modified table requires RLS check + regression test before completion
5. **Validation required for every task** — return PASS/FAIL with exact tests run
6. **Preserve launch discipline** — do not force full automation, expand scope, or introduce feature creep

### Protected Systems (do NOT weaken without explicit approval)
- Routing engine
- Monetization hardening / billing flow
- Stripe activation / partner eligibility lock
- Automation safety gates / confidence escalation / supervision
- Ambassador attribution / UTM persistence
- Admin launch panels
- RLS security enforcement

### Required Task Output
1. Root cause / plan
2. Files likely to change
3. Changes made
4. Validation results (PASS/FAIL with evidence)
5. Manual steps remaining

## National Expansion Model (FOUNDATIONAL — READ BEFORE ANY GEO/STATE WORK)

**Veteran Care is ONE national platform with geography layers. We are NOT duplicating separate state systems.**

### Architecture Model
- **ONE ENGINE** — single codebase, single backend, single admin, single AI/Routing/Billing/Attribution
- **MULTI-STATE DATA LAYERS** — state-tagged resources, state/city partners, state/city ambassadors
- **FILTERED OPERATIONS** — geo-filtered reporting; never one giant clustered view

### Three Logical Layers
1. **National Operating System** — platform logic, AI Guide, routing engine, billing engine, attribution engine, seeded provider logic, partner systems, dashboards, admin tools
2. **State Data Layer** — South Carolina (LIVE, 438 / 38 cities / 17 cats), North Carolina (LIVE, 295 / 83 cities / 17 cats — complete-shape template), Georgia (next), Florida, Tennessee, Virginia, etc.

### Operational Steps 0 → 8 (HISTORICAL — superseded 2026-04-24 by State Rollout Engine v2 below)

> The numbered "Phase" labels in this section refer to **operational steps** in
> the original ad-hoc per-state workflow (inventory → cleanup → expansion →
> polish → wiring → QC → lock → sign-off → kickoff). They predate, and are
> NOT the same as, the **content-rollout phases** (Phase 1 / 2 / 3 / 4 = Major
> Metro / Secondary / Rural / Gold Standard) defined in the Engine v2 section.
> The bullets below are kept for historical reference and post-mortem audits;
> all new state rollouts must follow the 4-Phase content model in the Engine
> v2 section.
Use this template for every new state. Each phase produces a committed script under `scripts/` for full auditability. Operator-Mode rules: additive-only, never delete protected engines, dry-run before `--commit`.

- **Phase 0 — Inventory & Baseline:** run `scripts/qc-resources.ts` to capture row count, distinct cities, category coverage, dead URLs, dup groups, geo gaps, sub-name validity. Snapshot becomes the diff target.
- **Phase 1 — Cleanup:** single `scripts/cleanup-states-phaseN.ts` that fixes (a) sub-name typos against `subcategories` table, (b) missing `resource_categories`/`resource_subcategories` junctions, (c) duplicate titles (keep oldest), (d) missing geo via city centroid, (e) dead/redirected URLs via verified parent-URL swaps (never delete the row).
- **Phase 2 — Expansion (additive only):** `scripts/seed-{state}-resources-roundN.ts` with sectioned blocks A–E (county VSOs, VAMC/CBOC/Vet Centers, regional nonprofits, family/legal/transit, crisis/community posts). Always upsert resource + both junctions; pre-validate sub-names against live `subcategories` rows; dry-run prints `created/dup/bad_sub/err` per section.
- **Phase 3 — Polish:** `scripts/seed-{state}-polish.ts` to top up secondary towns, beef up family-support, fill thin categories. Same A–E shape. Same dry-run-then-`--commit` discipline.
- **Phase 4 — UI/Live-Data Wiring:** ensure pages use `/api/locations/cities?state=XX` (no hardcoded city arrays in `client/src/pages/home.tsx` or any picker). Verify dropdowns return live count.
- **Phase 5 — QC Polish:** re-run `scripts/qc-resources.ts`. Hard-zero targets: `B_redirect`, `E_geo_missing`, `E_geo_outside`, `F_zip_mismatch`, `G_cat_mismatch`, `G_sub_invalid`, `H_parked`. Soft flags allowed: `A_dead` (gov sites blocking bots), `C_phone` (211/988/national HQ — extend whitelist as needed), `D_dup_url` (parent-URL rollups for VAMC/DAV/SCWorks/NCWorks).
- **Phase 6 — Rollout-Template Lock:** confirm template still applies; bump state row in this section with new totals.
- **Phase 7 — Founder Sign-off:** report deltas (rows added, cities added, dead-URL count, dup groups). Do not advance to the next state without green-light.
- **Phase 8 — Next State Kickoff:** repeat Phase 0 against the next state (GA → FL → TN → VA …).

### Engineering Patterns (locked)
- DB connection: `SUPABASE_DB_URL` with `[YOUR-PASSWORD]` replaced by `encodeURIComponent(SUPABASE_DB_PASSWORD)` (pg client, ssl `rejectUnauthorized:false`).
- Insert pattern: write `resources` row, then upsert `resource_categories` + `resource_subcategories` junctions with `ON CONFLICT DO NOTHING`.
- Sub-name taxonomy gotchas (verified live): healthcare = `VA Clinics` / `VA Medical Centers` (not "Outpatient Care"); family-support = `Military Family Support` / `Childcare Assistance` / `Survivor Benefits Support` / `Spouse Employment Assistance` / `Youth Programs` (not "Military Family Programs"); housing = `Homeless Veteran Services` / `Home Ownership Programs`; transportation = `Public Transit Assistance`; legal = `Pro Bono Legal Services` / `Veterans Legal Clinics` / `Legal Aid Services`; crisis-help = `Veterans Crisis Line` / `Mobile Crisis Teams`; food-assistance = `Food Banks`. **Always pre-validate against the live `subcategories` table — sub names drift.**
- VA.gov deep links rot frequently — swap to verified parent VAMC URL, never delete the row.
- PostgREST `.in()` queries must be chunked by ≤150 IDs (URL-length limit). Legacy `qc-resources.ts` uses 150; the newer `qa-state.ts` uses 100 (more conservative, identical behavior). Pick a value ≤150 for any new tool. Symptom of overrunning the limit: false 100% cat-mismatch reports.

### State Rollout Engine v2 — CODIFIED 2026-04-24 (SUPERSEDES ad-hoc seed scripts)

After SC, NC, and Georgia (3 phases each), the rollout engine is now codified.
**All future state seeds MUST use this engine — do not hand-roll dedupe / taxonomy / junction logic.**

**Files (all under `scripts/`):**
- `lib/rollout-engine.ts` — single source of truth. Exports `SeedRow` type, `runSeed()`, `loadTaxonomy()`, `loadDedupeIndex()`, `normalizeTitle()`. Handles: exact-title dedupe (national + in-state), normalized near-duplicate dedupe, taxonomy validation, resource insert, both junction upserts, per-section stats, error reporting.
- `lib/probe-taxonomy.ts` — prints every category + valid subcategory NAMES from the live `subcategories` table. **Run before every seed** to catch sub-name drift.
- `seed-state.template.ts` — drop-in template; copy, rename, fill `STATE`, `SECTION_LABELS`, `ROWS`. Engine handles the rest.
- `qa-state.ts` — `--state=XX` runs all 11 QA checks: row count, cities, categories, exact dups, near dups, orphan junctions, state bleed, sub validity, URL/phone/address completeness, city-dropdown sync, national fallback. Prints PASS/FAIL.
- `founder-report.ts` — `--state=XX [--baseline=N] [--priority="City,City"]` produces the markdown founder report.
- `florida-execution-plan.md` — ready-to-execute Phase 1/2/3 plan for FL with section codes, target row counts, sub-name watchlist, and near-dup watchlist.

**4-Phase Rollout Model (per state) — UPDATED 2026-04-24:**
1. **Phase 1 — Major Metro Foundation** (~100 rows): top 4 population centers + statewide anchors. Build largest cities first with strong category depth.
2. **Phase 2 — Secondary Cities + Statewide** (~120-150 rows): suburbs, medium cities, counties, statewide programs, regional nonprofits, virtual services.
3. **Phase 3 — Small Town + Rural Coverage** (~100-150 rows) + optional **Phase 3b top-up** for chapter posts and CBOCs. Smaller towns, underserved counties, remote areas.
4. **Phase 4 — Gold Standard Completion / Optimization** (~80-150 rows): the flagship-quality finishing pass before moving on. **A state is NOT considered complete until Phase 4 is finished or intentionally deferred.** Phase 4 covers:
   - Fill weak categories still under-populated (Mental Health, Insurance, Benefits, Financial Help, Transportation, Family Support, End of Life, any thin cats from QA).
   - Fill geographic weak spots still thin or missed (suburbs, mountain regions, coastal regions, military base corridors, county seats, growth corridors).
   - Deep quality audit (duplicates, broken URLs, missing phones, orphan junctions, wrong cat mapping, state bleed, ranking).
   - UX / search perfection (full city dropdown, city-first → statewide → national fallback chain, verified partner geography).
   - Monetization readiness (identify strong states for Trusted Partners, high-demand categories, underserved lead opportunities).

**Per-Phase Runbook (locked):**
1. `tsx scripts/lib/probe-taxonomy.ts [--cat=slug]` — verify subcategory names.
2. `tsx scripts/qa-state.ts --state=XX` — capture baseline (row count for `--baseline` flag).
3. Copy `seed-state.template.ts` → `seed-{xx}-phase{N}.ts`. Fill STATE, SECTION_LABELS, ROWS.
4. `tsx scripts/seed-{xx}-phase{N}.ts` — **dry-run**. Read `created/dup/near_dup/bad_sub/err` per section. Read the near-dup list — rename or drop those rows.
5. `tsx scripts/seed-{xx}-phase{N}.ts --commit` — write to DB.
6. `tsx scripts/qa-state.ts --state=XX` — must show PASS (0 exact dups, 0 orphan junctions, 0 wrong-state, 0 invalid subs). Near-dup clusters from parent-org rollups (e.g. multi-office DOL career centers, multi-office GLSP) are expected and acceptable — humans review.
7. Restart workflow: `restart_workflow Start application` so live API matches DB.
8. `tsx scripts/founder-report.ts --state=XX --baseline=<prior> --priority="..."` — paste output to founder.
9. Wait for founder sign-off before next phase.

**Discipline Rules (NON-NEGOTIABLE):**
- Every row: verified institutional URL + phone + (for city-anchored rows) address + lat/lng.
- `state` hardcoded in script; engine enforces it on every insert. Zero state bleed.
- `status: "approved"`, `sponsored: false`, both junctions written.
- Additive only — engine never deletes or updates existing rows. Cleanup is a separate manual operation.
- Dry-run before every commit. No exceptions.
- After commit, QA must PASS (or PASS WITH REVIEW with documented exceptions) before founder report.
- Founder report must be delivered BEFORE moving to next phase / next state.
- **Parent-org naming rule (Phase 4 lesson — codified 2026-04-24):** when adding multiple distinct programs/sites under the same parent organization (e.g. 6 GeorgiaCares regional sites, 2 services from one Regional Commission, 5 DAV Chapters), the words BEFORE the first em-dash must be unique per row. `normalizeTitle()` strips everything after the first dash and ignores parens, so identical pre-dash text causes near-dup skips. Pattern: put the distinguishing geography or program-name FIRST (e.g. `"Coastal GeorgiaCares SHIP Counseling Site (Brunswick)"` instead of `"Coastal Regional Commission — GeorgiaCares SHIP Counseling"`).

**Worked Example — Georgia (FLAGSHIP TEMPLATE STATE):**
- Phase 1: `seed-ga-resources.ts` (79 rows, statewide foundation)
- Phase 2: `seed-ga-atlanta-phase2.ts` (111 rows, Atlanta metro deepening)
- Phase 3: `seed-ga-phase3-statewide.ts` (154 rows, 11 sections AUG/SAV/COL/MAC/ATH/WAR/ALB/VAL/GAI/NFU/STW) + `seed-ga-phase3b-topup.ts` (12 rows VA CBOCs + Legion posts)
- Phase 4: `seed-ga-phase4.ts` — Gold Standard Completion. Geographic gaps (North GA mountains, Coast/Brunswick, Fort Stewart corridor, Statesboro, Dublin/central) + weak categories (Mental Health, Insurance, Benefits, Financial, Disabled Veterans, Transportation).
- Code review caught 5 near-duplicates that pure exact-title dedupe missed (e.g. "Macon VA Clinic — Carl Vinson VA" vs existing "Macon VA Clinic"). The new engine's normalized-title dedupe now catches these automatically.

**Next state queue:** Florida → Tennessee → Virginia → Texas. Florida has a ready-to-execute plan at `scripts/florida-execution-plan.md` (will follow the same 4-phase model).

3. **Local Coverage Layer** — cities, counties, metro areas, service zones, partner territories, ambassador territories

### Expansion Rule
Adding a state means **activating** new rows/tags in the existing system, NEVER forking the codebase or spinning up a parallel deployment.

### Geo Segmentation Required Across These Modules
Resources · Leads · Partner organizations · Trusted Services · Seeded providers · Ambassadors · Attribution/UTM traffic · Billing · Commissions · AI demand analytics · Conversion reporting · Executive dashboards

### Ambassador Hierarchy (NEVER one giant flat list)
**State → City/Region → Ambassador.** Sortable by state, city, region, active/inactive, traffic generated, leads generated, conversions, commissions, signup date.

### Reporting Must Answer
- Leads from any given state this week
- Hottest city in any state
- Ambassadors driving any city's traffic
- State with strongest conversion rate
- Cities needing partner coverage
- Categories trending in any state
- Revenue by state / city / category
- AI demand by geography

### Pre-Georgia Hardening Mandate
Geo reporting and admin segmentation must be tightened **before Georgia opens** to prevent future clustering. South Carolina is the live blueprint; future states must launch into a clean structure, not a retrofit.

### Current Geo Coverage Status (as of Apr 2026 audit)
- **Strong (state+city+zip native):** navigator_requests, resources, partner_organizations, partner_routing_rules, trusted_services, trusted_service_leads, partner_applications, user_profiles, resource_clicks, states registry
- **Gap — needs state/city columns:** ambassadors (uses free-text region_type/region_value only), ai_usage_log, page_views
- **Gap — hard-coded SC filter:** exec-summary "Top Cities" panel (`server/routes.ts:10082-10093`); founder digest mixes states in flat city list
- **Recommended pre-Georgia slice:** Upgrade #5 — National Geo-Reporting Foundation **SHIPPED 2026-04-18** ✅ (additive `state`/`city` cols on ambassadors + `user_state`/`user_city` on page_views & ai_usage_log + `?state=` filter on exec-summary + admin state selector + founder-digest by-state grouping). No engine touches. See CHANGELOG for E2E validation.

### State-by-State Phase 4 Status (Pre-Florida Southeast Upgrade)
- **GA — Phase 4 Gold Standard SHIPPED 2026-04-24 ✅** — 440 rows; flagship template; engine v2 codified.
- **SC — Phase 4 Gold Standard SHIPPED 2026-04-24 ✅** — 538 rows (was 438), 49 cities (was 38), 0 orphan junctions (was 8), Insurance category 8 rows (was 0 — DORMANT before), Crisis Help 4 (was 1), Hilton Head 4 (was 0). QA verdict: PASS WITH REVIEW. Cleanup script: backfilled 8 missing `resource_subcategories` junctions only (additive — no renames, no archives). Expansion script: 100 new rows across 18 sections covering Hilton Head/Bluffton/Beaufort coast, Upstate small cities, Pee Dee, Lowcountry inland, Midlands suburbs, plus broader-than-veterans-only resources (food banks, FQHC clinics, non-VA hospitals, shelters, hospice, recovery, interfaith, legal aid, insurance navigators) per founder broader-ingestion ask. Open items for founder review: 6 "Veteran Care —" placeholder rows (created 2026-03-10 with our brand URL/phone, no city/desc — flagged, NOT auto-archived) and 56 near-dup clusters (mostly accepted parent-org siblings under SC Works / SC DMH / SC DVA — QA noise, not user-facing).
- **NC — Wave 2 PENDING** — apply same SC playbook. Audit deep-dive first.
- **FL — Wave 3 PENDING** — apply combined SC+NC lessons via engine v2.
- **Engine improvement noted (not blocking):** `runSeed()` writes resource then junctions in parallel without rollback. A transient junction failure can leave a partially linked row. Future hardening: add post-commit auto-repair pass (similar to the SC cleanup we wrote).

## Platform Blueprint
- **Full reuse blueprint:** `PLATFORM_TEMPLATE.md` in project root — covers every module, table, API, secret, and fork process for spinning up Inmate Care, Second Chance Jobs, or any future platform from this codebase. Read this before starting any new platform build.

## Stable Restore Points
- **veterancare-stable-onboarding** → commit `b6ce19e` (published as `e4ceeb2` on 2026-03-10)
  - Working onboarding: Welcome → Account/Guest → Location → Interests → Home
  - Two-step auth modal with profile fields
  - Clean SVG favicon
  - All 13 resource categories, email notifications, partner routing live
  - Rollback command: restore all files to commit `b6ce19e`

## Release Process
1. One change at a time
2. Test it in Preview
3. Commit it
4. Publish it
5. **POST-PUBLISH VALIDATION (MANDATORY)** — see below
Never bundle multiple onboarding/profile/navigation changes together.

## Post-Publish Validation Rule (PERMANENT)
**A publish is NOT complete until LIVE production is validated end-to-end.**
Preview passing is NOT sufficient. After every publish:

1. **Production database** — verify all operational tables contain expected data (ambassadors, links, trusted_services, partner data, etc.)
2. **Admin panel** — confirm veterancare.com/admin shows real data (ambassadors, analytics, resources, commissions, payouts)
3. **Live links / UTMs** — test ambassador tracking links on veterancare.com resolve correctly
4. **Live integrations** — confirm Stripe, Resend, OpenAI, Google Analytics are connected and functional
5. **Data source correctness** — verify production is using correct DB connections (Replit Postgres for pg tables, Supabase for resource tables)
6. **No dev-only state** — ensure no dev/preview-only data is masking production problems

### Validation Checklist (run after every publish)
- [ ] `GET /api/admin/ambassadors` returns 5 ambassadors with 28 links each
- [ ] `GET /api/admin/links` returns 140 tracking links
- [ ] `GET /api/resources` returns approved resources
- [ ] `GET /api/trusted-services` returns active services
- [ ] `GET /api/admin/analytics` returns click/engagement data
- [ ] Admin pages load with real data (not empty states)
- [ ] Ambassador tracking URLs (`/a/{utm_id}`) redirect correctly
- [ ] Health endpoint responds (if configured)
- [ ] Deployment logs show clean startup with no errors

## Supabase RLS Security Rule (PERMANENT / STANDING)
**Every table in the public schema MUST have Row Level Security enabled. No exceptions.**

Any time a table is created or modified in Supabase public schema, ALL of the following must be completed before the change is considered done:

1. **Classify** the table: SERVER-ONLY / AUTHENTICATED USER / PUBLIC READ ONLY / INTERNAL OPS
2. **Enable RLS** immediately if not already enabled
3. **Apply correct policies** based on classification:
   - SERVER-ONLY / INTERNAL OPS: No anon access, no public insert/update/delete, service-role only
   - AUTHENTICATED: Restrict by user_id or scoped ownership
   - PUBLIC READ: Read-only, no public write
4. **Verify**: No anon write access, no unintended public exposure
5. **Regression test**: routing, billing, admin panel, automation, attribution, partner onboarding, resource reads
6. **Report**: Table name, type, RLS before/after, policy applied, anon access (no), service-role-only (yes), regression PASS/FAIL

### Hard Rules
- NO table leaves development without RLS review
- NO database change is complete without this validation
- Do NOT wait for Supabase warnings — enforce proactively
- Do NOT assume backend-only = safe
- If uncertain → STOP and report before applying changes

### Current Status (as of April 2026)
- **Helium Postgres**: 25/25 public schema tables have RLS enabled
- **Supabase Postgres**: 22/22 public schema tables have RLS enabled
- 3 Helium tables have explicit policies (partner_applications: admin-only, trusted_service_categories: public read, trusted_services: public read); rest are server-only
- All 4 previously Advisor-flagged Supabase tables (billing_config, billing_runs, optimization_actions_log, partner_rotation_state) now RLS-on

### Dual-DB RLS Enforcer (server/rls-validator.ts + server/supabase-pg-client.ts)
- Boot-time enforcement runs on BOTH databases (Helium via DATABASE_URL, Supabase via SUPABASE_DB_URL session pooler)
- 30s post-boot tick + 24h daily re-check timer covers both DBs
- Loud `[RLS-AUTOFIX]` logging when any table is auto-enabled
- Source-level fix: every `CREATE TABLE IF NOT EXISTS` in server/ now followed by `ALTER TABLE … ENABLE ROW LEVEL SECURITY`
- Required secrets for Supabase enforcement: `SUPABASE_DB_URL` (session pooler conn string with `[YOUR-PASSWORD]` placeholder) + `SUPABASE_DB_PASSWORD` (substituted at runtime). Gracefully skips Supabase if either is missing — Helium enforcement continues.

## Platform Architecture
- **Config-driven design**: All platform identity, terminology, and behavior controlled from `shared/platform.ts`
- **Reusable engine**: Auth, geocoding, resource DB, admin tools, lead routing, escalation, saved resources are platform-agnostic
- **Platform-specific**: Only `shared/platform.ts` changes per platform (name, domain, userNoun, AI config, profile fields, email config)
- **Duplication strategy**: Fork project → edit platform.ts → load new resources → swap branding assets → deploy

## Overview
A config-driven, mobile-first support platform engine. First implementation: Veteran Care (U.S. Military veterans, SC pilot). Designed for reuse across Inmate Care, Second Chance Jobs, and other future support platforms.

## Architecture
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui components, wouter routing
- **Backend**: Express.js server
- **External Database**: Supabase (PostgreSQL) via `@supabase/supabase-js`
- **State Management**: Zustand (client-side)
- **Platform Config**: `shared/platform.ts` — central config controlling all branding, terminology, AI settings, email templates

## Key Files
- `shared/platform.ts` - Platform configuration (name, domain, user terminology, AI config, email, feature flags)
- `server/supabase.ts` - Supabase client initialization (anon, admin, user-scoped)
- `server/routes.ts` - API endpoints (prefixed with `/api`)
- `server/ai/config.ts` - AI engine configuration (model, prompts, safety rules, category keywords, rate limits)
- `server/ai/engine.ts` - AI orchestrator (safety → resource match → prompt build → stream → log)
- `server/ai/resource-matcher.ts` - **Pass 4 blended matcher (2026-04-19)**: always runs category-bucket and text searches in parallel, then scores every candidate by query-term hits in title (10), subcategory (7), short_description (3), eligibility (2), plus location proximity (0–5) and a populated-subcategory bonus (+2). m2m mirror links honored via `resource_categories!inner` join. Detects categories via word-boundary keyword matching to avoid short-word false positives. Strips user's known city + broad geo terms from search-term extraction.
- `server/ai/prompt-builder.ts` - Builds system prompt with user context + matched resources
- `server/ai/safety.ts` - Crisis keyword detection, blocked topic filter
- `server/ai/rate-limiter.ts` - Per-user/guest rate limiting (30/hr auth, 10/hr guest)
- `server/ai/stream.ts` - OpenAI chat completions streaming wrapper
- `server/ai/usage-logger.ts` - Logs AI usage to ai_usage_log table (graceful if missing)
- `server/stripe-service.ts` - Stripe subscription workflow (checkout sessions, webhook handlers, auto-activation/deactivation)
- `server/monetization-audit.ts` - Monetization hardening audit log (routing_blocked, billing_blocked, eligibility_failure, subscription_mismatch events with partner_id, lead_id, reason, metadata)
- `server/billing-governance.ts` - Billing governance (charge checklist, partner eligibility verification, billing config, auto-review flags)
- `server/pg-client.ts` - Direct PostgreSQL client (bypasses Supabase PostgREST for trusted_services, trusted_service_categories, trusted_service_leads, partner_applications — NEVER use supabaseAdmin for these tables)

## Dev vs Production Database
- **CRITICAL**: Replit's built-in PostgreSQL has **separate instances** for development and production (deployed) environments
- Dev DATABASE_URL points to local `helium/heliumdb`; production gets its own isolated Postgres
- Ambassador seed data (5 ambassadors + 140 links) is auto-seeded on startup via `ensureAttributionTables()` if tables are empty
- Any new seed data must be added to the startup schema migration in `server/routes.ts` to propagate to production
- Supabase tables are shared across environments (same external Supabase project)

## Multi-Category Support
Resources can belong to multiple categories via the `resource_categories` junction table in Supabase:
- **Junction table**: `resource_categories(resource_id, category_id)` — composite PK
- **Legacy `category_id`**: Still on resources table for backward compat; kept in sync as the "primary" category
- **Query pattern**: Use `resource_categories!inner(categories!inner(...))` when filtering by category slug; use `resource_categories(categories(...))` when loading all categories
- **Normalization**: `normalizeResourceCategories()` and `normalizeResourceList()` in routes.ts convert junction table shape to flat `categories` field (single object for 1 category, array for multiple)
- **Admin APIs**: `GET/PUT /api/admin/resources/:id/categories` for managing category assignments
- **Admin UI**: Primary category dropdown + additional category toggle chips in edit form
- **Boot enrichment**: `enrichResourceCategories()` runs at startup — title-matching rules auto-assign additional categories (e.g., Vet Centers → mental-health + community-support, VA Clinics → healthcare, DAV → disabled-veterans) and subcategories to unassigned resources. Fully idempotent via upsert.
- **Resource stats**: 400 unique resources, 94 multi-category (24%), 16 categories all populated, 0 duplicates

## Unified Category System (Canonical Slugs)
All help request flows (Navigator modal, Get Help page, Home page guided help, AI config) use canonical DB slugs from `trusted_service_categories`. The slug mapping:
- `benefits-assistance` (was: va-benefits)
- `healthcare-services` (was: healthcare)
- `housing-home` (was: housing)
- `employment-support` (was: employment)
- `education-training` (was: education)
- `legal-services` (was: legal)
- `financial-credit` (was: financial)
- `wellness-recovery` (was: substance-recovery)
- `disabled-veterans`, `end-of-life-services`, `crisis-help`, `mental-health`, `family-support`, `community-support`, `food-assistance`, `transportation` — unchanged

**Backward compat**: `client/src/lib/category-config.ts` has `slugAliases` map + `toCanonicalSlug()` helper for old→canonical translation.
**API**: `GET /api/help-categories` returns unified category list with subcategories (DB-backed + resource-only).
**Note**: Supabase `categories` table still uses old slugs for resource browsing — `resources.tsx` routing handles both old and canonical slugs.

## Multi-Subcategory Support
Resources can belong to multiple subcategories via normalized junction tables in Supabase:
- **`subcategories` table**: `id, name, slug, category_id` — normalized subcategory definitions, each tied to a category. UNIQUE(slug, category_id).
- **`resource_subcategories` junction table**: `resource_id, subcategory_id` — composite PK, many-to-many
- **Legacy `subcategory` text field**: Still on resources table for backward compat; first subcategory name synced on save
- **Query pattern**: Use `resource_subcategories!inner(subcategories!inner(...))` when filtering by subcategory slug; use `resource_subcategories(subcategories(...))` when loading all
- **Normalization**: `normalizeResourceSubcategories()` / `normalizeAllFields()` / `normalizeAllFieldsList()` convert junction data to `subcategories_list` array
- **API filtering**: `/api/resources?category=X&sub=SLUG` filters by subcategory slug via junction table (no more ilike on text field)
- **Public API**: `GET /api/subcategories?category_slug=X` returns all subcategories for a category
- **Admin APIs**: `GET/PUT /api/admin/resources/:id/subcategories` for managing subcategory assignments
- **Admin UI**: Toggle chips grouped by category in edit form; Approve/Reject/Save all persist subcategory assignments
- **EOL subcategory slugs**: Defined in `client/src/lib/eol-subcategories.ts`, aligned with DB-generated slugs from full subcategory names
- `server/lead-email.ts` - Email templates using platform config for branding
- `server/lead-router.ts` - Lead routing engine (platform-agnostic)
- `server/lead-escalation.ts` - Escalation timer system (platform-agnostic)
- `server/geocode.ts` - Geocoding via Nominatim (platform-agnostic)
- `server/storage.ts` - In-memory storage interface (legacy, for local data)
- `shared/schema.ts` - Drizzle schema definitions
- `client/src/pages/` - Page components (landing, onboarding, home, resources, etc.)
- `client/src/pages/submit-resource.tsx` - Community resource submission form
- `client/src/pages/admin-resources.tsx` - Admin review dashboard (key-protected)
- `client/src/lib/store.ts` - Zustand store (saved resources, user location, storage key from platform config)
- `client/src/lib/resources-data.ts` - Static resource data + ResourceItem interface
- `client/src/lib/category-config.ts` - Maps Supabase category slugs to icons, colors, and descriptions
- `client/src/components/layout.tsx` - App shell with top bar, bottom nav, and AI guide listener
- `client/src/components/resource-detail.tsx` - Rich resource detail sheet with click tracking
- `client/src/pages/end-of-life.tsx` - End of Life Services subcategory grid page (12 subcategories, clean card layout)
- `client/src/lib/eol-subcategories.ts` - Subcategory config (names, slugs, icons, keywords) for End of Life Services
- `client/src/pages/ambassador-dashboard.tsx` - Ambassador self-service dashboard (code-based login, 3 campaign sections, copy-ready outreach templates, QR codes, tracking links)
- `client/src/lib/analytics.ts` - GA4 analytics module (event tracking, page views, UTM capture)
- `client/src/pages/trusted-services.tsx` - Public Trusted Services page (category grid → provider listings → internal detail view)
- `client/src/components/trusted-service-detail.tsx` - Trusted Service internal detail view (mirrors resource-detail pattern: overview, contact, actions, save/share, navigator/guide cards)
- `client/src/pages/admin-trusted-services.tsx` - Admin partner management (add/edit/activate/deactivate/feature)
- `supabase/create_resource_clicks.sql` - SQL to create click tracking table in Supabase
- `supabase/create_trusted_services.sql` - SQL to create trusted_service_categories and trusted_services tables
- `supabase/create_trusted_service_leads.sql` - SQL to create trusted_service_leads table for lead capture
- `client/src/pages/admin-trusted-service-leads.tsx` - Admin lead management (view/filter/update status)

## API Endpoints
- `GET /api/categories` - Returns categories from Supabase (id, name, slug)
- `GET /api/resources?category=<slug>&state=<state>&city=<city>&zip=<zip>&q=<search>&sub=<subcategory>` - Returns approved resources filtered by category slug, state, city, ZIP, search query, and/or subcategory; uses `resource_categories` junction table for multi-category support; search matches title, short_description, city, state, eligibility, source_name via ILIKE. **Unified search**: when `q` is provided, also searches trusted_services table (pgQuery) and merges results with `source_type: "trusted_service"` + `_trusted_service_id` fields. Search uses `normalizeSearchTerm()` for dash/apostrophe/space tolerance. In nearMe mode, merged results are sorted by distance.
- `GET /api/resources/:id` - Returns a single resource by UUID
- `GET /api/locations/cities?state=<code>&category=<slug>` - Returns distinct city names from approved resources
- `GET /api/locations/zips?state=<code>&city=<name>&category=<slug>` - Returns distinct ZIP codes from approved resources
- `POST /api/submit-resource` - Creates a new resource with status=pending; includes duplicate detection (website_url, phone, title+city+state), rate limiting (5/hr/IP), and input validation
- `POST /api/track-click` - Logs user interactions with location context (user_state, user_city fallback from resource if store empty)
- `POST /api/report-resource` - Creates a pending admin review item with report note in notes_internal; sets resource status back to pending
- `POST /api/navigator-request` - User submits request for navigator help (rate-limited 5/hr/IP, requires name + phone or email)
- `POST /api/ai/chat` - AI Guide streaming endpoint; accepts {messages[], userState?, userCity?, userZip?, interests?, branch?}; returns SSE stream with resource matches, text chunks, and done event; includes crisis detection, blocked topic filter, rate limiting (30/hr auth, 10/hr guest), and usage logging
- `GET /api/admin/resources?status=<status>&q=<search>` - Admin: list resources by status (requires x-admin-key header)
- `PATCH /api/admin/resources/:id` - Admin: update resource fields/status (requires x-admin-key header)
- `GET /api/admin/navigator-requests?status=<status>` - Admin: list navigator leads filtered by status (new/in_progress/resolved/cancelled)
- `PATCH /api/admin/navigator-requests/:id` - Admin: update lead status/outcome/routing (validates status+outcome pairing)
- `POST /api/admin/leads/:id/reroute` - Admin: manually re-route a lead (optionally specify partner_id)
- `GET /api/admin/partners` - Admin: list all partner organizations
- `POST /api/admin/partners` - Admin: create partner organization
- `PATCH /api/admin/partners/:id` - Admin: update partner
- `DELETE /api/admin/partners/:id` - Admin: soft-delete partner (sets is_active=false)
- `GET /api/admin/partners/:id/rules` - Admin: list routing rules for a partner
- `POST /api/admin/partners/:id/rules` - Admin: create routing rule
- `PATCH /api/admin/partner-rules/:id` - Admin: update routing rule
- `DELETE /api/admin/partner-rules/:id` - Admin: deactivate routing rule
- `GET /api/admin/states` - Admin: list all states
- `POST /api/admin/states` - Admin: create new state (code + name required)
- `PATCH /api/admin/states/:code` - Admin: update state (activate, config, etc.)
- `POST /api/admin/states/:code/refresh-counts` - Admin: recalculate resource/partner counts
- `GET /api/states/active` - Public: list active states (code, name)
- `POST /api/admin/resources` - Admin: create a new resource directly (bypasses community submission; defaults to status=approved)
- `POST /api/admin/resources/csv-import` - Admin: bulk import resources from CSV (max 500 rows; supports options: skip_duplicates, default_state, default_category, dry_run; returns created/skipped/duplicate/error counts)
- `GET /api/admin/resources/csv-template` - Admin: get CSV column definitions, valid categories, import options, and example row
- `POST /api/admin/resources/duplicate-check` - Admin: find duplicate resources by title within a state (body: {state, category?})
- `POST /api/admin/resources/cleanup-duplicates` - Admin: remove duplicate resources keeping oldest (body: {state, dry_run?})
- `POST /api/admin/states/:code/clone-resources` - Admin: clone national resources from template state to new state (body: {source_state?, categories?, exclude_categories?})
- `GET /api/trusted-services/categories` - Public: list active trusted service categories
- `GET /api/trusted-services?category=<slug>&state=<state>` - Public: list active trusted services, optionally filtered by category slug or state
- `GET /api/trusted-partners-for-category/:resourceSlug` - Public: returns active trusted service partners mapped to a resource category slug (e.g. housing→housing-home); used to surface verified partners in resource listings
- `GET /api/admin/trusted-services/categories` - Admin: list all trusted service categories
- `GET /api/admin/trusted-services?category_id=<id>&is_active=<bool>` - Admin: list all trusted services with filters
- `POST /api/admin/trusted-services` - Admin: create a trusted service partner
- `PATCH /api/admin/trusted-services/:id` - Admin: update a trusted service partner
- `DELETE /api/admin/trusted-services/:id` - Admin: deactivate a trusted service partner
- `POST /api/admin/partner-applications/:id/approve` - Admin: approve application & create Stripe checkout session; returns checkoutUrl
- `POST /api/stripe/webhook` - Stripe webhook endpoint (handles checkout.session.completed, subscription.deleted/updated, invoice.payment_failed)
- `POST /api/trusted-service-leads` - Public: submit a lead (provider_id, name, email required)
- `GET /api/admin/trusted-service-leads?status=<status>` - Admin: list leads with optional status filter
- `PATCH /api/admin/trusted-service-leads/:id` - Admin: update lead status (new/contacted/closed)
- `GET /api/profile` - Auth'd: get current user's profile (returns `{profile: null}` if no profile yet)
- `POST /api/profile` - Auth'd: create/upsert user profile (first_name, last_name, email, phone, user_type required; branch_of_service, interests, state, city, zip optional; sets profile_complete=true if enrichment data provided)
- `PATCH /api/profile` - Auth'd: update profile fields
- `GET /api/admin/user-profiles?user_type=&state=&profile_complete=&limit=` - Admin: list user profiles with filters
- `GET /api/admin/analytics` - Admin: analytics dashboard data (clicks by category/state/city, top resources, affiliate vs non-affiliate, reported resources, navigator request stats)
- `GET /api/admin/ai-insights` - Admin: AI usage analytics (conversations, tokens, cost, crisis triggers, blocked topics, fallback activations, resource gap indicators; includes slug normalizer for legacy logged categories)
- `GET /api/admin/resources/csv-export?status=approved` - Admin: export all resources matching status as downloadable CSV
- `GET /api/trusted-services/categories` - Public: list active trusted service categories
- `GET /api/trusted-services?category=&state=` - Public: list active trusted services, filterable by category slug and state
- `GET /api/admin/trusted-services/categories` - Admin: list all trusted service categories
- `POST /api/admin/trusted-services` - Admin: create trusted service provider
- `PATCH /api/admin/trusted-services/:id` - Admin: update trusted service provider
- `DELETE /api/admin/trusted-services/:id` - Admin: soft-delete (deactivate) trusted service

## Supabase Tables
- `categories` - id (uuid), name, slug
- `resources` - id (uuid), category_id (fk→categories), title, short_description, website_url, phone, email, address, city, state, zip, eligibility, source_name, source_type, last_verified, monetization_type, affiliate_url, sponsored (bool), status (text: pending/approved/rejected), submitted_by_name, submitted_by_email, notes_internal, is_featured (bool), featured_rank (int), last_verified_at, latitude (float8), longitude (float8), geo_source (text), geocoded_at (timestamptz), created_at
- `resource_clicks` - id (uuid), resource_id (fk→resources), click_type (text), user_state, user_city, user_zip (text), created_at
- `navigator_requests` - id (uuid), resource_id, resource_title, veteran_name, veteran_phone, veteran_email, message, preferred_contact, user_state, user_city, user_zip, status (new/in_progress/resolved/cancelled), admin_notes, created_at, urgency, source, utm_source/medium/campaign, assigned_to, contacted_at, resolved_at, outcome, consent_followup, routed_to_partner_id (fk→partner_organizations), routed_at, delivery_status, partner_outcome, closed_at, escalation_count, routing_history (jsonb)
- `partner_organizations` - id (uuid), name, contact_name, contact_email, contact_phone, website_url, state, cities (text[]), is_active, is_lead_enabled, notes, created_at
- `partner_routing_rules` - id (uuid), partner_id (fk→partner_organizations), category_slug, subcategory, urgency, state, city, priority (int), max_leads_per_day (int), is_active, created_at
- `states` - code (TEXT UNIQUE), name (TEXT), active (BOOLEAN), created_at; full schema adds: id (UUID), is_active, is_template, launch_date, timezone, admin_contact_name, admin_contact_email, config (JSONB), resource_count, partner_count
- `user_profiles` - id (UUID PK, fk→auth.users), first_name, last_name, email, phone, user_type (veteran/spouse_family/dependent/caregiver_advocate/other), consent_contact (bool), branch_of_service, interests (text[]), service_area, state, city, zip, profile_complete (bool), created_at, updated_at
- `user_saved_resources` - id, user_id (fk→auth.users), resource_id (fk→resources), saved_at; unique(user_id, resource_id)
- `ai_usage_log` - id (uuid), user_id (fk→auth.users, nullable), is_guest (bool), detected_category (text), model (text), input_tokens (int), output_tokens (int), total_tokens (int), navigator_suggested (bool), created_at (SQL in `supabase/create_ai_usage_log.sql`)
- `trusted_service_categories` - id (uuid), name, slug (unique), description, icon, display_order (int), is_active (bool), created_at (SQL in `supabase/create_trusted_services.sql`)
- `trusted_services` - id (uuid), category_id (fk→trusted_service_categories), name, short_description, website_url, phone, email, address, city, state, zip, logo_url, verification_status (pending/verified), verification_label, cta_text, cta_url, is_featured (bool), is_active (bool), is_national (bool, default false — national partners appear in all state filters), display_order (int), notes_internal, created_at
- `veteran_owned_businesses` - id (uuid), business_name, owner_name, email, phone, website, address, city, state, zip, description, category_id (fk→trusted_service_categories), subcategory, is_veteran_owned (bool), is_nonprofit (bool), logo_url, status (pending/approved/rejected), admin_notes, show_in_trusted_services (bool, default false — when true + approved + has category, surfaces in Trusted Services with "Veteran-Owned" badge via UNION query), created_at, reviewed_at — uses pgQuery (NOT supabaseAdmin)
- `ambassadors` - id (uuid), code (unique), first_name, last_name, display_name, email, phone, region_type, region_value, referral_code, stripe_connect_account_id, payout_method_status, commission_plan_id, commission_rate (numeric 5,2), payout_method (text: check/direct_deposit/paypal/venmo/zelle/stripe/other), payout_details (text), w9_status (text: not_submitted/submitted/verified/expired), tax_notes (text), status (active/inactive/paused), notes, created_at, updated_at, created_by — canonical ambassador identity table (Neon/pgQuery)
- `ambassador_links` - id (uuid), ambassador_id (fk→ambassadors), ambassador_name, ambassador_code, base_path, utm_source, utm_medium (default 'ambassador'), utm_campaign, utm_content, utm_id (unique), full_url, link_name, audience_type, channel_type, is_active (bool), click_count (int, default 0), first_clicked_at, last_clicked_at, email, region, created_at — child distribution/tracking asset table (Neon/pgQuery)
- `ambassador_payouts` - id (uuid), ambassador_id (fk→ambassadors), payout_period_start, payout_period_end, total_amount, payout_status (draft/pending/paid/cancelled), payout_method, external_payout_id, confirmation_note (text), paid_at, notes, created_at, updated_at — payout operations table (Neon/pgQuery)
- `commissions` - id (uuid), ambassador_id (fk→ambassadors), ambassador_code (text), utm_id (text), application_id (uuid), payout_id (uuid), revenue_amount (numeric 10,2), commission_percentage (numeric 5,2, default 10%), commission_amount (numeric 10,2), status (pending/approved/paid), created_at — earnings ledger (Neon/pgQuery)
- `user_attribution_sessions` - id (uuid), session_id (text), utm_source, utm_medium, utm_campaign, utm_content (ambassador), utm_term, utm_id, landing_page, referrer, ambassador_id (fk→ambassadors), created_at — UTM attribution per session (Neon/pgQuery)
- `partner_attribution` - id (uuid), application_id (fk→partner_applications), ambassador (utm_content), ambassador_id (fk→ambassadors), utm_source, utm_medium, utm_campaign, utm_id, stripe_customer_id, stripe_subscription_id, plan_type, revenue_amount (numeric), event_type, created_at — Stripe checkout attribution (Neon/pgQuery)

### Ambassador Data Model (56.6A)
- **ambassadors** = canonical identity layer (profile, status, payout config)
- **ambassador_links** = child distribution/tracking layer (utm_id links, click counts)
- **ambassador_payouts** = payout operations (periods, amounts, external refs)
- **commissions** = earnings ledger (linked to ambassador_id + ambassador_code for backward compat)
- **utm_id** = raw attribution evidence token (never removed)
- **ambassador_id** = stable ownership key for reporting, filtering, commission, payout logic
- **Resolution rule**: `resolveAmbassadorId(ambassadorCode)` resolves code → ambassador.id at insert time across all attribution tables
- **Dual key coexistence**: utm_id + ambassador_id stored alongside each other in user_attribution_sessions, partner_applications, partner_attribution, trusted_service_leads, commissions

### Ambassador Link Pack Endpoints (56.3B)
- `GET /a/:utmId` — Public short redirect, resolves utm_id → full_url (301 redirect)
- `GET /api/admin/ambassador-pack/:code` — Full link pack for ambassador (JSON default, `?format=csv` for CSV download). Includes link_name, utm_id, full_url, short_url, qr_url, audience, channel, campaign
- `GET /api/admin/ambassador-links/:id/qr` — QR code PNG by link ID (admin-protected)
- `GET /api/admin/ambassador-links/qr-by-utm/:utmId` — QR code PNG by utm_id (admin-protected). Filename uses kebab-case link_name
- `GET /api/admin/commissions` — List commissions with optional `?ambassador=` and `?status=` filters. Returns commissions + summary by ambassador
- `GET /api/admin/ambassador-distribution/:code` — Full distribution-ready pack with message templates by audience×channel. JSON (grouped by audience with suggested_copy + commission_info) or CSV (`?format=csv`). Templates auto-inject ambassador's short_url.

### Attribution Columns on Existing Tables
- `trusted_service_leads` — utm_source, utm_medium, utm_campaign, utm_content, utm_id, session_id, ambassador_id
- `partner_applications` — utm_source, utm_medium, utm_campaign, utm_content, utm_id, session_id, ambassador_id
- `navigator_requests` (Supabase) — utm_content, session_id (in addition to existing utm_source/medium/campaign)

## Environment Variables (Secrets)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (required for RLS-protected tables)
- `OPENAI_API_KEY` - OpenAI API key (powers Veteran Guide AI assistant)
- `ADMIN_KEY` - Secret key for admin resource review access
- `RESEND_API_KEY` - Resend email service API key (for partner lead notifications)
- `RESEND_FROM_EMAIL` - Sender address for outbound emails

## Routes (Frontend)
- `/` - Landing (auto-redirects to /onboarding or /home based on state)
- `/onboarding` - 3-step onboarding: Welcome → Account/Guest → Location → Interests
- `/home` - Main dashboard (with first-time welcome message, service profile prompt, nav tutorial)
- `/resources` - Resource library with category browsing and location filter
- `/saved-resources` - Saved/bookmarked resources
- `/submit-resource` - Community resource submission form
- `/trusted-services` - Trusted Services page (vetted providers by category)
- `/vob` - Veteran-Owned Business public directory (approved listings, search, category/state filters)
- `/vob/apply` - Veteran-Owned Business directory application form (free, submits to admin review)
- `/vob/start` - Veteran-Owned Business startup roadmap/help (placeholder)
- `/admin` - Admin resource review dashboard (key-protected, standalone layout)
- `/admin/analytics` - Admin analytics dashboard
- `/admin/ai-insights` - AI Insights dashboard (conversations, tokens, cost, crisis, gaps)
- `/admin/vob` - Admin review page for veteran-owned business directory submissions
- `/community` - Community feed (coming soon)
- `/shop` - Shop page (coming soon)
- `/near-me` - Location-based nearby resources

## Geo-Filtering Universal Rule (MUST follow for ALL endpoints)
**Non-geocoded records (null lat/lng) must NEVER be filtered out by near-me or bounding box queries.**
This rule applies to every endpoint that supports geo/near-me filtering: `/api/resources`, `/api/trusted-services`, `/api/veteran-discounts`, and any future listing endpoints.

### Implementation Pattern
1. **SQL layer**: Any bounding box condition MUST include `OR ts.latitude IS NULL OR ts.longitude IS NULL` so non-geocoded records pass through the WHERE clause.
   - Supabase: Use `.or(...)` with `latitude.is.null,longitude.is.null` alternatives
   - Raw pg: Append `OR ts.latitude IS NULL OR ts.longitude IS NULL` to bounding box condition
2. **Post-query filter**: When filtering by `distance_miles <= radius`, ALWAYS also keep records where `latitude == null`. Non-geocoded records get `distance_miles: 99998` (sorts after real distances but before nationals at 99999).
3. **Sort order**: Featured first → featured_rank → distance (nulls sort to end via 99998/99999).
4. **National records**: Always included (`is_national = true` bypasses all geo filters, distance = 99999).
5. **Non-geocoded records**: Always included (null lat/lng bypasses geo filters, distance = 99998). They appear after geo-sorted local results but before national results.

### Why
Without this rule, adding a new resource that hasn't been geocoded yet causes it to silently disappear from near-me results — the bounding box filter drops null coordinates and the post-query distance filter removes null distances.

### Checklist for new listing endpoints
- [ ] SQL/Supabase query includes null lat/lng passthrough
- [ ] Post-query `.filter()` keeps records where `r.latitude == null || r.longitude == null`
- [ ] Non-geocoded records assigned `distance_miles: 99998`
- [ ] National records assigned `distance_miles: 99999`
- [ ] Sort handles nulls via `?? 99999` fallback

## Partner Account/Login System (Unified with Supabase Auth)
- **Auth model**: Partners use the SAME Supabase Auth as veterans — one login system, one session. Partner role is detected by matching the Supabase user's email to an approved `partner_applications` record
- **Role detection**: `GET /api/partner/role-check` resolves Supabase token → email → checks `partner_applications` table for approved/active status
- **resolvePartnerFromToken()**: Tries Supabase auth first (extracts email from token, matches partner), falls back to legacy `partner_sessions` for backwards compat
- **Secured endpoints**: `/api/partner-referral/me`, `/api/partner/lead-billing`, `/api/partner/lead-dispute`, `/api/partner/me` — all use `resolvePartnerFromToken()` middleware (accepts both Supabase and legacy tokens)
- **Frontend**: `/partner-portal` uses `useAuth()` hook (Supabase). Shows dashboard when logged-in user's email matches an approved partner. No separate login form
- **Partner Portal**: Dashboard hub with cards for Referral Tools, Lead Activity, Leaderboard. Sub-views for each tool
- **Partner onboarding flow**: Apply → Admin approves → Stripe payment → Welcome email → Create Veteran Care account (Supabase Auth) using same email → auto-detected as partner → access Partner Dashboard
- **Login entry points**: (1) Navbar user menu "Partner Dashboard" link (auto-shown for partner users), (2) "Already a Trusted Partner? Log in here" on partner-apply page, (3) "Partner Login" on Trusted Services/Veteran Discounts pages, (4) Direct URL `/partner-portal`
- **Auto-redirect**: Partner payment success page auto-redirects to `/partner-portal` after login detection
- **Legacy auth**: `/api/partner/register`, `/api/partner/login`, `partner_sessions` table still exist as fallback but primary auth is Supabase
- **Emails**: `sendPartnerPaymentEmail()` = approval + Stripe link; `sendPartnerWelcomeEmail()` = post-payment with account creation link
- **Key files**: `client/src/pages/partner-portal.tsx`, `client/src/components/layout.tsx` (partner menu), `server/routes.ts` (auth endpoints + role-check)

## UNIVERSAL MOBILE UI RULE (NON-NEGOTIABLE — PERMANENT STANDARD)
Every page, component, modal, overlay, and screen MUST:
- Fit 100% within the mobile viewport
- Have ZERO horizontal overflow or scrolling
- Use vertical scrolling only
- Never clip content on the left or right
- Be fully usable on iPhone Safari (real device standard)

**If it does not meet this standard, it is NOT complete.**

### Architecture Rule
Do NOT patch broken mobile layouts with incremental CSS tweaks. If something doesn't fit on mobile:
1. Use the full-screen overlay pattern (same as My Profile and Resource Detail)
2. Mobile = `fixed top-0 left-0 right-0 bottom-0` full-viewport panel with vertical scroll
3. Desktop = centered modal/card is acceptable at `sm:` breakpoint and above
4. Include safe-area inset handling (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`)
5. Include `overscroll-contain` on scroll containers
6. Include body scroll lock via `useEffect` when panel is open
7. Never use Radix Dialog for complex/long-form mobile UI — use custom overlay divs instead

### What "make sure it fits the page" or "follow the universal rule" means
Apply this exact system. Not a variation. Not a partial fix. It works first time, matches the proven structure, no back-and-forth debugging loops.

### Reference implementations
- `client/src/components/profile-modal.tsx` — My Profile (full-screen mobile overlay)
- `client/src/components/resource-detail.tsx` — Resource Detail (full-screen mobile overlay)

### Applies to
- All current pages and components
- All future features, pages, modals
- Any future apps built from this codebase

## Lead Billing System (Chunks 5.0–5.2)
- **Billing columns** (Supabase `navigator_requests`): `is_billable`, `billed`, `billed_at`, `billing_amount` (default $49.99), `billing_status`
- **Stripe audit columns**: `stripe_payment_intent_id`, `stripe_checkout_session_id`, `stripe_payment_status`
- **Workflow operations columns** (chunk 5.2): `billing_workflow_status` (ready/queued/charged/failed/hold/review_required), `billing_hold_reason`
- **Billable rule**: `routed_to_partner_id IS NOT NULL AND email_sent = true AND email_sent_at IS NOT NULL`
- **Charge flow**: Admin clicks "Charge Now" → Stripe Checkout Session → payment → webhook marks billed
- **Manual billing**: Admin "Mark Billed" bypasses Stripe
- **Hold**: Admin places lead on hold → charge blocked until removed
- **Retry**: Failed payments can be retried with fresh checkout
- **Bulk ops**: Batch queue/hold for multiple leads
- **Export**: CSV export of all billing data
- **SQL migrations**: `supabase/chunk-5.0-billing-columns.sql`, `supabase/chunk-5.1-stripe-billing-columns.sql`, `supabase/chunk-5.2-billing-workflow.sql`
- **Admin UI**: Billing tab in admin panel with queue view, summary cards, filters, bulk actions

## Design Decisions
- App name: "Veteran Care" (two words) — configured in shared/platform.ts
- Logo: `Veteran_Care_-_Shadow_(TM)_-_PNG_1775367756504.png` (metallic dog tag with TM mark)
- Green color scheme throughout
- Mobile-first, single-screen layouts for onboarding
- Crisis Help always shown first in resource lists
- Location filtering via Zustand store (stateCode, state, city, zip)
- Auto-geolocation via browser + OpenStreetMap Nominatim reverse geocoding (cached 1hr in localStorage)
- All platform branding reads from shared/platform.ts — zero hardcoded platform names in components

## Operations Bible — Current Assessment (2026-04-18)

Source: dev review request "Veteran Care – Operations Bible Systemization
+ Permanent Growth Layer." Review-only assessment, no code changed.

### Maturity Score: 7.5 / 10
Engines (routing, billing, attribution, AI, RLS, payouts) are
production-tested in SC. Visibility surfaces on top of those engines
have honest gaps that compound at scale.

### Biggest Operator Blind Spots
1. Partner outcome unwritten → conversion rate displays 0% everywhere
2. Zero visitor instrumentation (no page_views table or beacon)
3. No aged-lead alert on home admin screen
4. No MRR trend line (only point-in-time totals)
5. No partner churn signal (renewal failures, decline rate, slowing
   response speed not flagged)
6. Per-partner median response time not surfaced
7. Per-channel ROI breakdown (Facebook vs flyer vs QR) not surfaced
8. AI top-prompts and unmet-demand are qualitative, not clustered

### Next Priorities (in order)
1. **Partner Outcome Capture Loop** (DO IMMEDIATELY — ~1 day)
   - Tokenized email link to partner with Won/Lost/No-Contact buttons
   - One-click row action on admin Support Requests tab
   - Writes navigator_requests.partner_outcome (column already exists)
   - Unlocks conversion rate, pricing math, churn signal, close-rate
   - Purely additive, zero engine touched
2. **Visitor + Pipeline Beacon** (~1 day)
   - New Supabase page_views table + client fire-and-forget beacon
   - Adds visitor tiles + mobile share + top landing pages to Executive
     Summary
   - Plus an aged-leads tile (>24h still new/in_progress)
3. **Daily Ops Heartbeat email** (~half day)
   - 8 AM digest to founder via Resend
   - Yesterday KPIs, stuck leads, failed payments, new applications,
     commissions awaiting approval
   - Cloneable per-state (each state owner gets their own digest)

### Deferred / Wait-Until-Georgia
- Two-database consolidation (Supabase + Drizzle bridge by email/UTM).
  Do just before state #3 onboarding when routing-scope code is
  already being opened. Hard rule: if a third dual-write entity is
  about to be added, stop and consolidate first.
- Per-channel ROI breakdown — only meaningful with 2+ states' channel
  mix to compare
- AI ranking refinement (3 of 6 baseline prompts surfaced imperfect
  ranking) — earmark for measurable improvement before state #3
- MRR trend line — bundle into the Visitor Beacon slice
- partner_outcome backfill plan — once the capture loop is live,
  decide whether to retroactively call past partners

### Risks if Ignored
- No outcome capture → cannot defend $25/lead in renewal conversations
- No visitor beacon → marketing spend on instinct; gets worse with
  multi-state launch
- No daily digest → founder visibility decays at scale
- Two-DB tech debt → every new dual-write entity is more debt
- AI ranking drift → becomes user-perceived product quality
- MRR invisible → flat/declining subscription revenue unnoticed 30+ d

### Hard Rules (preserved from existing protocol)
- Small safe slices only
- No bundled fixes / no silent architecture change
- Preserve routing / billing / attribution / monetization integrity
- Do not weaken any protected system listed at top of replit.md
- Update replit.md + changelog discipline on every shipped slice

### Standing Status
- SC pilot live; Georgia prep next
- 2 paid routable partners: Tri-County Veteran Support Network
  (Charleston), Boot Print (Greenville)
- Awaiting approval on Upgrade #1 before any code change

## SHIPPED — Upgrade #1: Partner Outcome Capture Loop (2026-04-18)

**Status:** LIVE. Additive only. No engine touched.

### What was added
1. **Email footer block** in lead notification email (`server/lead-email.ts`,
   added below existing action buttons inside `buildLeadEmailHtml`):
   three new tokenized buttons — Won (green), Lost (red), No Contact
   (gray). HMAC-signed with `ADMIN_KEY`, 7-day expiry, distinct token
   namespace from lead-action so they cannot collide.

2. **Two new public endpoints** in `server/routes.ts`:
   - `GET  /api/partner/lead-outcome?token=...` — confirmation page
     (server-rendered HTML, mobile-viewport meta tag included)
   - `POST /api/partner/lead-outcome` (urlencoded) — verifies token,
     writes `navigator_requests.partner_outcome`, returns success page
   - Idempotent: re-clicking the same outcome shows "Already Recorded"
   - Logs every change with previous + new value

3. **Admin row UI** in `client/src/pages/admin-resources.tsx` Support
   Requests tab: a small "Conversion Outcome" panel for routed leads
   with three buttons (Won / Lost / No Contact) and a Clear button.
   Highlights the active outcome. Reuses existing `navPatchMutation`.
   Test IDs: `lead-outcome-{won|lost|no-contact|clear}-${id}`.

### Schema
- ZERO schema changes. `navigator_requests.partner_outcome` column
  already existed (TEXT, no CHECK constraint).
- Values written: `won` | `lost` | `no_contact` | `null` (cleared).
- Conversion-rate calc at routes.ts L10054 already counts
  `["accepted","won","converted","completed"]` as converted, so "won"
  flows directly into Executive Summary metrics.

### Protected systems
- Routing engine — UNTOUCHED
- Billing flow — UNTOUCHED
- Attribution — UNTOUCHED
- response_status / status / outcome (workflow column) — UNTOUCHED
- HMAC token machinery — REUSED, namespace isolated

### Files changed
- `server/lead-email.ts` (+59 LOC: helpers + button block + injection)
- `server/routes.ts` (+99 LOC: confirmation page + 2 endpoints)
- `client/src/pages/admin-resources.tsx` (+50 LOC: outcome panel)

### Validation
- Workflow restarted clean — no TypeScript errors
- Server boot logs show all schema checks pass
- Manual test path: send a lead → email contains 3 outcome buttons →
  click → confirmation page → submit → DB updated → conversion rate
  on Executive Summary reflects new outcome

### Known follow-ups (intentionally deferred)
- Backfill plan for historical leads (decide after we see capture rate)
- `partner_outcome_set_at` + `partner_outcome_set_by` audit columns
  (only add when there's a reason — current logging is sufficient)
- "Outcome captured today" KPI tile on Executive Summary (bundle into
  Upgrade #3 daily digest)

## SHIPPED — Upgrade #2: Founder Daily Command Center Email (2026-04-18)

**Status:** LIVE. Additive only. No engine touched.

### What was added
1. **New module** `server/founder-digest.ts` (~370 LOC):
   - `assembleDigestData()` — pulls last 30d of leads in one query
     (covers yesterday, 7d trend, stuck, top categories/cities,
     outcomes), plus separate light queries for AI activity
     (yesterday) and partner applications. Pure read; never writes.
   - `buildDigestHtml(data)` — clean mobile-readable email
     (560px max width, 13–22px font sizes, single-column blocks)
     with sections: Alerts → Yesterday → 7-Day Trend → Stuck Leads
     → Payments → Partner Applications → Top Categories → Top
     Cities → Conversion Outcomes → Open Admin link.
   - `sendFounderDigest({reason})` — assembles + builds + sends
     via Resend. Fail-soft. Returns {sent, recipients, error}.
   - `startFounderDigestTimer()` — 5-min ticker; fires once per ET
     day at/after 8:00 AM ET. Dedup via in-memory `lastSentEtDate`.
     Failed sends clear the dedup so the next tick retries.
   - Kill switch: `FOUNDER_DIGEST_DISABLED=1` (instant, no deploy).

2. **Wired into boot** (`server/routes.ts`):
   - Import added next to escalation timer import.
   - `startFounderDigestTimer(5 * 60 * 1000)` called right after
     `startEscalationTimer`. No conditions — runs in all envs but
     respects kill switch.

3. **Admin test endpoint** `POST /api/admin/founder-digest/send-now`
   (admin-key gated). Lets the founder fire a test on demand.
   Returns 423 if kill switch is on, 500 on assembly/send error.

### Configuration (env vars)
- `FOUNDER_DIGEST_TO` — comma-separated recipient emails. Defaults
  to `platform.email.defaultNotifyEmail` (info@veterancare.com).
- `FOUNDER_DIGEST_DISABLED=1` — instant kill switch.
- Reuses existing `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.

### What the digest reports
- **Alerts** (red/amber): failed billing, leads stuck > 72h, ≥5
  leads aged > 24h, billing items needing manual review, ≥3
  partner applications waiting.
- **Yesterday**: leads received, leads routed, AI chats, navigator
  suggested, billed amount + count, won/lost/no-contact counts.
- **7-Day Lead Trend**: ASCII-style horizontal bar per day.
- **Stuck Leads**: count > 24h, count > 72h, sample of 5 oldest
  with name, category, age in hours, status.
- **Payments (rolling 30d)**: failed / hold / review_required /
  pending unbilled (count + dollar amount).
- **Partner Applications**: new in last 24h + awaiting your review.
- **Top Categories (7d)**: top 5 by lead count.
- **Top Cities (7d)**: top 5 by lead count (with state).
- **Conversion Outcomes (7d)**: routed total, won/lost/no-contact,
  outcome capture rate, conversion rate, count still missing
  outcome. Direct payoff from Upgrade #1.

### Subject line example
`Veteran Care Daily — 7 leads · $349.93 billed · 2 red alerts`

### Schema
- ZERO schema changes.
- Tables read: `navigator_requests`, `partner_applications`,
  `ai_usage_log`. All existing.

### Protected systems
- Routing engine — UNTOUCHED
- Billing flow — UNTOUCHED
- Attribution — UNTOUCHED
- Stripe / commissions / payouts — UNTOUCHED
- Escalation engine — UNTOUCHED (digest timer is parallel, separate)

### Files changed
- `server/founder-digest.ts` (NEW, ~370 LOC)
- `server/routes.ts` (+8 LOC: import + timer start + admin endpoint)

### Validation
- Workflow restarted clean — no TypeScript errors
- Boot log shows `[founder-digest] Timer started — fires daily at
  8:00 ET (kill: FOUNDER_DIGEST_DISABLED=1)`
- Smoke test (mock invalid Resend key) confirmed full assembly +
  HTML build runs without error against live Supabase data.
  Resolved cleanly to `info@veterancare.com` recipient.

### Known follow-ups (intentionally deferred)
- Per-state filtering once GA launches (each state owner gets own
  digest filtered by `user_state`)
- "Outcome captured today" tile (needs `partner_outcome_set_at`
  audit column — defer until column is justified)
- DST-precise yesterday-window math (current ET-05:00 anchor is
  off by 1h during DST window; daily window granularity makes this
  irrelevant for digest purposes)
- Optional Slack/SMS mirror

## SHIPPED — Upgrade #3: Visitor / Traffic Beacon Metrics (2026-04-18)

**Status:** LIVE. Additive only. No engine touched.

### What was added
1. **New table** `page_views` (event log, never written to by any
   existing system):
   - id UUID, session_id, path, referrer, is_mobile, user_agent,
     utm_source/medium/campaign/content/term/id, ambassador_code,
     created_at. RLS enabled, 5 indexes.
   - DDL: `supabase/create_page_views.sql`
   - Created in DB via existing pg pool (same path the project uses
     for `trusted_service_categories`).

2. **Server ingest** `server/page-view-logger.ts`:
   - `ingestPageView()` — pg-direct insert, fire-and-forget, with
     in-memory rate-limit (max 1 write / 750ms / session) and
     soft table-detect.
   - `getPageViewMetrics()` — pg-direct aggregations (visitors
     today/7d/30d via DISTINCT session_id, mobile share, UTM share,
     ambassador share, top 10 landing paths 7d).

3. **Public beacon endpoint** `POST /api/beacon/page-view`:
   - Always responds 204 (never blocks the page)
   - Accepts JSON: { sessionId, path, referrer, isMobile, utm_*,
     ambassador_code }
   - Server-side mobile fallback from User-Agent if client omits it
   - All fields length-clamped before insert

4. **Client beacon** in `client/src/lib/analytics.ts`:
   - `sendPageViewBeacon()` reuses existing UTM session cache and
     reads ambassador_code from local/session storage
   - Uses `navigator.sendBeacon()` (silent on tab close) with
     fetch+keepalive fallback
   - Wired into existing `trackPageView()` — same dedup as GA so
     no double counting

5. **Executive Summary endpoint** `/api/admin/exec-summary`
   extended with two new blocks:
   - `metrics.traffic` (visitors_today/7d/30d, page_views_30d,
     mobile_share_pct_30d, utm_attributed_views_30d,
     ambassador_attributed_views_30d, top_landing_paths_7d, enabled)
   - `metrics.stuck` (over_24h, over_72h) — mirrors digest definition
   - `unmeasured` no longer hard-codes daily_visitors / device_split
     — auto-removes them once page_views has data

6. **Executive Summary UI** (`client/src/pages/admin-executive.tsx`):
   - New 4-tile row: Visitors Today, Mobile Share, UTM-Tagged Views,
     Stuck Leads
   - New panel: Top Landing Paths (7d)
   - Tiles gracefully render "—" when traffic.enabled=false

### Schema
- ONE new table `page_views` (UUID PK, matches `ai_usage_log` pattern)
- ZERO modifications to existing tables
- ZERO ID column type changes
- Project's event-style tables intentionally live in raw SQL files
  in `supabase/`, not in Drizzle schema — followed convention exactly.

### Protected systems
- Routing engine — UNTOUCHED
- Billing flow — UNTOUCHED
- Attribution — UNTOUCHED (we READ ambassador_code from existing
  client storage but never write it back to attribution tables)
- Stripe / commissions / payouts — UNTOUCHED
- Escalation engine — UNTOUCHED
- Founder digest — UNTOUCHED (will pick up traffic block in a future
  slice if/when desired)

### Files changed
- `supabase/create_page_views.sql` (NEW)
- `server/page-view-logger.ts` (NEW, ingest + metrics helpers)
- `server/routes.ts` (+~50 LOC: import, public POST endpoint,
  exec-summary traffic+stuck blocks)
- `client/src/lib/analytics.ts` (+~50 LOC: sendBeacon helper +
  trackPageView wire-up; preserves existing GA behavior)
- `client/src/pages/admin-executive.tsx` (+~80 LOC: traffic KPI row,
  stuck-leads tile, top landing paths panel, type extensions)

### Validation
- Workflow restarted clean — no TypeScript errors
- `[page-views] page_views table detected — beacon enabled`
  appears on first call
- 3 sample beacons → 204 → rows landed → exec-summary returns:
  traffic.enabled=true, visitors_today=3, mobile_share=100,
  utm_attributed=3, ambassador_attributed=3, top path=/get-help
- Stuck-leads tile shows real numbers (over_24h: 118, over_72h: 118)
- Smoke rows cleaned up immediately after validation

### Known follow-ups (intentionally deferred)
- Bounce rate (needs session-exit tracking — separate slice)
- Per-state traffic split (cheap once launched in GA — add then)
- Add traffic block to founder daily digest (1-line follow-up)
- Server-side IP→country enrichment (defer until needed)

## SHIPPED — Upgrade #4: Admin Mobile Panel Polish (2026-04-18)

**Status:** LIVE. UI/responsive only. No engine, schema, or endpoint touched.

### What was added (4 admin pages, surgical edits only)

1. **Sticky page header on mobile** — `/admin/executive` and
   `/admin/trusted-service-leads` now have sticky headers with shadow.
   `/admin/ai-insights` and `/admin/resources` already had sticky
   headers — left untouched.

2. **Larger tap targets** — Back buttons bumped from `h-8` to `h-10`,
   Refresh / Today / status-select buttons all to `h-9` minimum on
   mobile. Hit areas now meet ≥36-40px comfort threshold.

3. **Bottom safe-area padding** — All four pages now apply
   `pb-[calc(env(safe-area-inset-bottom)+...)]` so iPhone gesture
   bar / notch never clips the last card. Uses the existing
   `safe-area-inset-bottom` pattern already in `client/src/index.css`.

4. **Width / overflow handling** — Lead rows on Trusted Service Leads
   converted from 2-column grid to 1-column on mobile (was clipping
   long emails) and added `min-w-0` + `truncate` on email/phone/city
   spans. Status select on each lead row stayed `flex-shrink-0` so it
   never disappears.

5. **One-tap copy for phone & email** — New inline `CopyButton`
   component on Trusted Service Leads adds a small clipboard icon
   next to every email and phone number. Tap → copies to clipboard,
   icon flashes green check for 1.5s. Uses `navigator.clipboard.writeText`
   with silent fallback.

6. **"Today" filter chip** — Trusted Service Leads has a new toggle
   button left of the status dropdown. Shows live count `Today (N)`
   when there are any leads from today. Filters by client local-time
   day; works alongside status + state + search filters.

7. **Header truncation rules** — Long page titles now truncate
   instead of wrapping or overflowing the sticky header on narrow
   screens. "Updated Xs ago" timestamp hidden on mobile to free
   header space; visible at `sm:` breakpoint and above.

### Files changed
- `client/src/pages/admin-executive.tsx` (header sticky + safe-area pb + tighter mobile spacing)
- `client/src/pages/admin-trusted-service-leads.tsx` (sticky header wrapper, CopyButton, Today chip, larger tap targets, single-column mobile lead rows, safe-area pb)
- `client/src/pages/admin-ai-insights.tsx` (safe-area pb on main container; header was already sticky)
- `client/src/pages/admin-resources.tsx` (safe-area pb on root; header was already sticky)

### Schema / engine impact
- Schema: NONE
- New tables: NONE
- ALTER TABLE: NONE
- New endpoints: NONE
- Routing engine: UNTOUCHED
- Billing engine: UNTOUCHED
- Attribution engine: UNTOUCHED
- AI engine: UNTOUCHED
- Escalation engine: UNTOUCHED
- Founder digest: UNTOUCHED
- Stripe / commissions / payouts: UNTOUCHED

### Validation
- Workflow restarted clean — no TypeScript errors
- JSX balance verified (div opens=18, closes=18 in trusted-service-leads)
- Vite HMR pushed all four edits without console errors
- Auth wall blocks deeper visual mobile screenshot validation
  but desktop layout unchanged at `sm:` breakpoint and above
  (additive `sm:` modifiers only)

### Known follow-ups (intentionally deferred)
- One-tap copy on `/admin/executive` paid-partner rows (low priority)
- Mobile panel polish on the remaining 11 admin sub-pages
  (apply same 4 patterns when each is next opened)
- Bottom-aligned floating "scroll to top" button on long pages

## SHIPPED — Upgrade #5: National Geo-Reporting Foundation (2026-04-18)

**One platform, multi-state data layers. Georgia activation now unblocked.**

- **Schema (additive, idempotent, NULL-only backfills):** `ambassadors.+state/+city` (SC pilot backfilled from region_type/region_value); `page_views.+user_state/+user_city`; `ai_usage_log.+user_state/+user_city`. All `IF NOT EXISTS` + try/catch — no engine, no PK changes.
- **Loggers** accept optional `userState`/`userCity` pass-through (never invented).
- **`GET /api/admin/exec-summary`** now accepts `?state=XX`; returns `state_filter` + `available_states` (derived from real signals) + `top_cities_30d` (state-aware shape) + `top_sc_cities_30d` (back-compat).
- **Admin UI** (`/admin/executive`) gained header state selector populated from `available_states`; city card retitles + shows state badge when viewing all states.
- **Founder digest** groups top cities by state block (state header + total + top 5) instead of flat mixed list.
- **E2E validated:** `available_states=["PA","SC"]`; `?state=SC` filters paid_partners correctly; back-compat preserved.
- **Files:** `server/routes.ts` (boot ALTER block + exec-summary refactor), `server/page-view-logger.ts`, `server/ai/usage-logger.ts`, `server/founder-digest.ts`, `client/src/pages/admin-executive.tsx`.

---

## SHIPPED — Pass 5 Architect-Review Hardening (2026-04-19)

**Status:** LIVE. Three correctness fixes against the original Pass 5 changes after architect review. ZERO schema changes.

### What changed (server/ai/resource-matcher.ts only)

1. **Fallback bug fix (CRITICAL)** — last-resort broad-text-search path was referencing an undefined `searchTerms` symbol that would throw `ReferenceError` on the rare cold-cache fallback. Replaced with `rawTerms` (the variable that actually exists in scope). No-op for the happy path; the fallback is now actually callable.
2. **Primary-category boost reliability** — boost previously checked only the first joined `category_slug` per row, which is non-deterministic for m2m records (Supabase row order on the join is not guaranteed). Added `category_slugs: string[]` to `MatchedResource`, populated by both `searchByCategory` and `searchByText` from ALL joined `resource_categories` rows. Boost now applies if ANY joined slug matches the primary detected category. Multi-category records now reliably get the +6 regardless of join row order.
3. **Stem guard tightened** — `stem()` now skips `is`/`us` endings in addition to `ss`. Prevents over-stemming of `crisis → crisi`, `analysis → analysi`, `basis → basi`, `bonus → bonu`, `focus → focu`. Standard plural collapse (`jobs → job`, `clinics → clinic`, `veterans → veteran`) preserved.

### Validation
- Re-ran 26-query suite: **21 PASS / 3 WEAK / 1 FAIL** — same shape as pre-fix run. Fixes are non-regressive bug fixes, not ranking changes.
- Architect re-review: **PASS** on all three fixes; recommended targeted unit tests as a follow-up.

---

## SHIPPED — Pass 5 Final Blueprint Tune-Up (2026-04-19)

**Status:** LIVE. Three surgical matcher tweaks + 8 crisis-help records. ZERO schema changes. ZERO architecture changes.

### What changed

1. **Crisis-Help inventory micro-batch** (data) — 8 quality records added to the previously-empty `crisis-help` category:
   - Veterans Crisis Line (national, 988 → press 1)
   - 988 Suicide & Crisis Lifeline (national)
   - Charleston / Columbia / Greenville Vet Centers — Crisis Support (SC)
   - SC Department of Mental Health — Mobile Crisis Response (SC, 833-364-2274)
   - NAMI South Carolina HelpLine (SC)
   - National Domestic Violence Hotline — Veteran & Military Resources (national)
   - Catalog now: **397 approved + 2 pending = 399 total SC**.

2. **Primary-category boost** (`server/ai/resource-matcher.ts`) — when 2+ categories are detected, records whose joined `category_slug` matches the FIRST detected category get **+6** in scoring. Magnitude is roughly half a title-hit (+10), so it tilts ties without overpowering true keyword relevance. Closed the secondary-category leak that was crowding C16 end-of-life and E4 fly-fishing results.

3. **Lightweight stemming** (`stem(token)`) — strips trailing "s" on tokens length ≥4 (skipping "ss" endings like "access"/"address"). Applied to:
   - extracted query terms (so "jobs"/"job", "veterans"/"veteran", "clinics"/"clinic", "benefits"/"benefit" collapse to a single canonical form for `.includes()` scoring)
   - the `detectCategories` haystack (so the user typing "jobs" actually triggers the `"job"` keyword and routes to employment)

4. **Employment-synonym layer** (`expandEmploymentSynonyms`) — if any employment cue appears in stemmed terms (`job`, `hire`, `hiring`, `career`, `employment`, `employer`, `employed`), broaden the term set to include the canonical record vocabulary (`hiring`, `career`, `employment`, `employer`). Used at scoring time only — does NOT influence category routing.

### Validation results (26-query suite re-run)

| Metric | Before Pass 5 | After Pass 5 | Δ |
|---|---|---|---|
| PASS (≥2 hits) | 21 / 26 (81%) | **22 / 26 (85%)** | +1 |
| WEAK (1 hit) | 4 | 3 | −1 |
| FAIL (0 hits) | 1 | 1 | 0 |
| Weighted (PASS+WEAK) | 25 / 26 (96%) | **25 / 26 (96%)** | — |

**Visible quality lifts beyond raw counts:**
- **C13 community-support**: top results changed from generic LIHEAP/Spartanburg fillers → **Team RWB, Team Rubicon, The Mission Continues** at #1-3.
- **C16 end-of-life**: top 3 are now true EOL records (Funeral Honors, Presidential Memorial, VA Headstones) — VA-benefits leak pushed to #4-5.
- **C4 employment**: now correctly routes to employment category (was `cats=[]`); top 5 are all employment-relevant.
- **E4 fly-fishing**: PHWFF Charleston #1 confirmed; positions 2-5 are now Vet Centers (relevant) instead of generic mental-health filler.

### One known limitation (acknowledged, out of scope for this sprint)
- **C15 "veteran crisis hotline"** still returns `0 resources` because `checkSafety()` in `server/ai/safety.ts` intercepts crisis-keyword queries BEFORE the resource matcher runs and returns the 988/VCL safety message directly. The 8 newly seeded crisis records still surface for adjacent queries and are visible in catalog browse — but a future sprint will need to optionally include crisis resources alongside the safety message text. Not a matcher bug.

### Files touched
- `server/ai/resource-matcher.ts` — added `stem()`, `expandEmploymentSynonyms()`, primary-category boost, stemmed haystack in `detectCategories()`.
- 8 new approved rows in `resources` table under `category_id = crisis-help`.

---

## SHIPPED — Tier 2 Subcategory Backfills (2026-04-19)

**Status:** LIVE. Pure data UPDATE pass. ZERO new rows. ZERO schema changes. ZERO engine touches.

### Why
After Pass 4 introduced a +2 score bonus for records with a populated subcategory, the 36 SC approved records that still had no subcategory were systematically under-ranked across every AI Guide query. Tier 2 closes that gap so every SC record is fully discoverable.

### What changed
- **36 of 36 SC approved records** missing `subcategory` were backfilled using the existing taxonomy. Zero true taxonomy gaps — all 36 mapped cleanly to existing subcategory names.
- No new subcategories created (verified `Veteran-Friendly Employers` and `Veteran Student Services` already existed in the master taxonomy).
- No new resource rows. No deletes. No category re-tagging.

### Subcategories used
| Count | Subcategory | Category |
|---|---|---|
| 6 | Veteran-Friendly Employers | employment |
| 5 | Counseling & Therapy | mental-health |
| 4 | Legal Aid Services | legal |
| 3 | VA Clinics | healthcare |
| 3 | Homeless Veteran Services | housing |
| 2 | Food Assistance | food-assistance |
| 2 | Women Veterans Healthcare | healthcare |
| 2 | Peer Support | mental-health |
| 2 | Home Ownership Programs | housing |
| 2 | Recovery Support Services | substance-recovery |
| 1 | Food Banks | food-assistance |
| 1 | Veteran Student Services | education |
| 1 | Transitional Housing | housing |
| 1 | C&P Exams (What to Expect) | va-benefits |
| 1 | Disability Increase (Reevaluation) | va-benefits |

### Validation
- 4/4 sanity AI Guide queries returned newly-tagged records as top results (e.g., "veteran friendly employers in South Carolina" now returns all 6 employer programs as positions 1-6; "C&P exam help" returns "VA C&P Exam Information — What to Expect" at #1).
- 5/5 original Pass 4 validation queries continue to PASS.

### Current SC catalog state
- 389 approved + 2 pending = 391 total
- 0 SC approved records remain unclassified (down from 77 pre-Quality-Review-Tier-1, then 36 post-Tier-1, now 0)

---

## SHIPPED — Upgrade #6: Master Admin Safe-Delete Toolkit (2026-04-18)

**Status:** LIVE. Additive endpoints + UI rebuild on one admin page. ZERO schema changes. ZERO engine touches.

### Why
Master Admin tried to delete a test row from `/admin/partner-prospects`
and hit a raw Postgres FK violation (`partner_attribution_application_id_fkey`).
The old `DELETE` handler ran `DELETE FROM partner_applications WHERE id=$1`
with no FK awareness — every row tied to attribution / Stripe / a
converted provider was undeletable, with no recovery path. Operator
needed three controlled levels of admin power: Archive (default),
Safe Delete (clean rows only), Force Delete (cascade with audit trail).

### What was added

1. **NEW `GET /api/admin/partner-applications/:id/delete-preflight`**
   — Read-only. Returns:
   `{ attribution_rows, has_stripe_subscription, has_stripe_customer,
      converted_provider_id, blockers[], recommended_action,
      can_hard_delete }`
   - blockers[] severity: high / medium / low
   - recommended_action: `archive` | `hard_delete` | `force_delete_required`

2. **NEW `POST /api/admin/partner-applications/:id/archive`**
   — Sets `status='archived'`, preserves all FKs. Reversible.
   Best-effort audit-log entry: `partner_application_archived`.
   ('archived' was already a valid status in the existing PATCH
    validator — no schema change needed.)

3. **NEW `POST /api/admin/partner-applications/:id/unarchive`**
   — Restores `status='prospect'`. Idempotent (404s if not archived).
   Best-effort audit-log entry: `partner_application_unarchived`.

4. **HARDENED `DELETE /api/admin/partner-applications/:id`**
   — Pre-flight gate before any row touch:
   - If ANY blocker (attribution > 0 OR stripe_subscription_id OR
     converted_provider_id) and no `?force=true` → returns HTTP 409
     `{ error: 'delete_blocked', blockers: {...}, suggested_action: 'archive' }`
   - If `?force=true` and `?confirm_company=` does not match exact
     `company_name` → returns HTTP 400
     `{ error: 'company_name_confirmation_required', expected_company_name }`
   - If forced + confirmed: cascades `partner_attribution` rows first,
     then deletes parent. Writes a high-severity audit-log entry:
     `partner_application_force_deleted` with metadata
     `{ company_name, attribution_rows_destroyed, had_stripe_subscription,
        converted_provider_id }`
   - If no blockers: hard-deletes immediately (no force needed).

5. **Admin UI rebuild** on `/admin/partner-prospects`:
   - "Archived" tab added to the status filter row (with live count)
   - `archived` status added to STATUS_CONFIG with slate badge
   - Bottom action row replaced single "Delete" with:
     **Archive** (primary, browser confirm) + **Delete…** (opens panel)
   - When viewing an archived row: "Restore from Archive" button instead
   - Inline delete-preview panel (no Dialog dependency) shows preflight
     blockers, severity dots, and a Force-Delete sub-panel that requires
     typing the exact company name to enable the cascade button
   - Archived rows visible only when "Archived" tab is selected

### End-to-end validation (all 6 scenarios PASSED)

| # | Scenario | Expected | Actual |
|---|---|---|---|
| 1 | Preflight on row with attribution + Stripe sub + converted_provider | 3 blockers, force_delete_required | ✅ All 3 blockers returned with correct severity (high/high/medium) |
| 2 | Preflight on clean prospect | 0 blockers, can_hard_delete:true | ✅ Empty blockers, recommended_action:hard_delete |
| 3 | Archive clean prospect | status→archived | ✅ `{archived:true, status:"archived"}` |
| 4 | Unarchive | status→prospect | ✅ `{unarchived:true, status:"prospect"}` |
| 5 | DELETE row with FK chain (no force) | HTTP 409, suggest archive | ✅ HTTP 409, blocker JSON, suggested_action:"archive" |
| 6 | DELETE with force but wrong company name | HTTP 400, expected_name returned | ✅ HTTP 400, `expected_company_name` in body |

### Files changed
- `server/routes.ts` (+~165 LOC: 3 new endpoints + hardened DELETE)
- `client/src/pages/admin-partner-prospects.tsx` (+~140 LOC: 3 new mutations,
  preflight loader, Archived tab, action row, inline delete panel)

### Schema / engine impact
- Schema: NONE
- New tables: NONE
- New columns: NONE
- ALTER TABLE: NONE
- Routing engine: UNTOUCHED
- Billing engine: UNTOUCHED — Stripe writes never invoked by these endpoints
- Attribution engine: PROTECTED — cascade only via explicit force+confirm
- AI engine: UNTOUCHED
- Escalation engine: UNTOUCHED
- Founder digest: UNTOUCHED
- Stripe / commissions / payouts: UNTOUCHED (Stripe sub remains live
  even when its application row is archived — operator must cancel in
  Stripe dashboard before any force-delete)

### Example blocker scenarios (from real production data)

- **LIVE PAYMENT TEST** (active partner) — preflight returned 3 blockers:
  1 attribution row (HIGH), live Stripe sub `sub_1TNOXFGdqk7jVmGZ23…` (HIGH),
  converted to provider `693538fe-4f6…` (MEDIUM). Recommended: force-delete
  required. UI correctly disables hard-delete button.
- **Brand New Veteran Services LLC** (prospect, no Stripe, no attribution)
  → preflight returned 0 blockers, `can_hard_delete:true`. UI shows
  "Permanently Delete" button enabled immediately.

### Known follow-ups (intentionally deferred)
- Apply same toolkit to `/admin/trusted-services` (delete blocked by
  3 incoming FKs: partner_applications, trusted_service_leads,
  trusted_service_categories — bigger surface)
- Bulk archive ("Archive all rows matching `ABC%`") for one-time
  cleanup of test data — current per-row UX is enough for now
- Audit-log viewer page — entries are written but not yet surfaced
  in admin UI

## Master Parity Grid — COMPLETED 2026-04-19
Aligned 5 cross-surface shared categories to canonical taxonomy across R-side (Resources/Browse) and TS-side (Trusted Strip):

**Step 1a (TS-side heliumdb.partner_subcategories)**: collapsed dupes + inserted canonical missing.
**Step 1a (R-side Supabase)**:
- supabase.subcategories table aligned to canonical slug list (housing-9, financial-18, legal-12, insurance-10, education-11 = 60 canonical)
- supabase.resources.subcategory text tags renamed/collapsed (Emergency Shelter→Emergency Housing, Rent Assistance→Rental Assistance, Home Ownership Programs→Home Ownership, Family Law Support→Family Law, Budgeting & Financial Planning→Budgeting & Financial Coaching)
- Cross-cat moves: Building & Construction + Manufacturing resources moved from education-training → employment-support; Food Assistance resources moved from housing-home → food-assistance
- FK cleanup: deleted obsolete subcategories required clearing resource_subcategories junction first (FK was blocking silent deletes)

**Step 1b (client display files)**: rewrote 5 *-subcategories.ts files with canonical slug list:
- client/src/lib/housing-subcategories.ts (9 tiles)
- client/src/lib/fin-subcategories.ts (18 tiles)
- client/src/lib/legal-subcategories.ts (12 tiles)
- client/src/lib/insurance-subcategories.ts (10 tiles)
- client/src/lib/edu-subcategories.ts (11 tiles)
- client/src/lib/category-drilldown-registry.ts: updated introLinks for housing/legal/edu to canonical slugs

**Verified**: /api/subcategories returns canonical slug counts matching design. Resource counts: housing-46, financial-28, legal-39, insurance-6 (content gap), education-40, employment-58, food-20.

**Pending follow-ups (NOT in this batch)**:
- Step 2: Insert ~33 partner_routing_rules rows (verify partner_organizations vs trusted_services partner_id mapping first)
- Step 3: Browse cross-pop URL verification matrix
- Step 4: AI Guide 25-prompt verification
- Insurance content gap (6 resources, 0 tagged with sub) — needs content seeding
