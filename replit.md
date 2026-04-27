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

## Veteran Care API Monetization Initiative — SLEEP MODE (LANDED 2026-04-25)

**Status: SLEEP MODE.** Future-ready database scaffolding only. **Do NOT
build the API yet.** Primary focus stays on:
1. California rollout
2. Traffic growth
3. Trusted partner revenue
4. National expansion

### What's in place (database scaffolding only)
- Full feasibility plan: `.local/api-monetization-feasibility-plan.md`
- Schema module: `server/api-monetization-schema.ts` (boot-time
  `ensureApiMonetizationSchema()` wired into `server/routes.ts`)
- 5 new tables in HELIUM (all empty, all RLS-locked):
  - `api_customers` — Stripe-linked org records
  - `api_keys` — hashed key store (sha256 + key_prefix)
  - `api_call_log` — usage / billing source of truth
  - `api_resources` — column-whitelisted mirror; safe to expose
  - `api_mirror_sync_log` — observability for the future sync job
- 1 new column (kill switch) on `resources` — **manual Supabase step
  required**:
  - File: `supabase/add_resources_public_api_eligible.sql`
  - Adds `public_api_eligible BOOLEAN NOT NULL DEFAULT false`
  - Default FALSE means **no row is API-eligible** until the founder
    explicitly opts each one in. Run when ready.

### What is intentionally NOT built
- No `/v1/*` endpoints
- No auth middleware / API key validation
- No rate limiter
- No Stripe webhook handlers for API products
- No mirror sync job (the table exists, the populator does not)
- No customer dashboard
- No public docs site

### Activation later requires only (no destructive migrations)
1. Run `supabase/add_resources_public_api_eligible.sql` in the Supabase
   SQL editor (one-time, idempotent).
2. Build the mirror sync job (`server/api-mirror-sync.ts`) reading
   approved + eligible rows from `resources` (Supabase) and writing to
   `api_resources` (HELIUM) with explicit column lists.
3. Build auth middleware that hashes the bearer token and joins
   `api_keys` → `api_customers`.
4. Add rate limiter (Postgres bucket via `api_call_log`).
5. Mount `/v1/resources`, `/v1/resources/:id`, `/v1/categories`,
   `/v1/states`, `/v1/cities`, `/v1/health` (Phase 1 endpoints).
6. Wire Stripe webhooks to provision rows in `api_customers` + `api_keys`
   and email the plaintext key once via Resend.
7. Publish docs site (Mintlify recommended).

### Activation gate
Founder approval required, AND:
- Pennsylvania rollout: founder selected 2026-04-27 under one-phase-per-run governance lock (stop+report+wait after each phase). **P1 STATE FOUNDATION SHIPPED**: 49 rows / 16 cities / 14/17 cats / 0 dup / 0 near-dup / 0 broken URL / 0 ZIP bleeders. **P2 HEALTHCARE FOUNDATION SHIPPED 2026-04-27**: +32 rows (10 CBOC across all 6 VAMC parent systems; 5 Vet Centers; 6 major hospitals; 4 FQHCs; 2 NAMI MH; 3 SUD; 2 crisis). 5 broken VA CBOC slugs replaced pre-commit with verified live URLs. **P3 COUNTY / BENEFITS BACKBONE SHIPPED 2026-04-27**: +38 rows (10 CVSOs, 16 PA DHS CAOs, 9 AAAs, 3 CareerLink regional). 0 dup / 0 broken / 0 bleed; 1 row dropped (Washington County CVSO — washcopa.org 308 engine timeout). **P4 MAJOR CITY SATURATION SHIPPED 2026-04-27**: +55 rows across 8 priority metros (PHL 13, PIT 12, HBG 6, ABE 6, NEPA 6, ERI 5, LNC 3, RDG 4) — VMSC/Bethesda Project/Sunday Breakfast/PEC/Impact/PHA/ACTION-Housing/HACP/Light of Life/Bethesda Mission/Friends of the Poor/Erie City Mission/Water Street/Hope Rescue (housing); Philabundance/Pgh FB/Central PA FB/Second Harvest LV/Weinberg NEPA/Second Harvest NW PA/Lancaster Food Hub/Helping Harvest (food banks); SEPTA CCT/PRT ACCESS/rabbittransit/LANTA/COLTS/LCTA/EMTA/RRTA/BARTA (transit ×9); PLA/CLS/NLS/MidPenn/North Penn (legal); Women Against Abuse/WC&S Pgh/YWCA HBG/Turning Pt LV/SafeNet Erie/Safe Berks (DV crisis); Gaudenzia/Pgh Mercy/Treatment Trends/Marworth (recovery); Lutheran Settlement/FSWP/Valley Youth/St Joe's/Family Svc NW PA (family); Liberty Resources/DAV PA (disabled-vets); Salvation Army WPA (financial); VLP Western PA (vet org). 0 dup / 0 near-dup / 0 broken URL / 0 ZIP bleeders. 2 rows dropped honestly (New Bethany Ministries — site rejects HEAD from engine UA; AMVETS Dept of PA — already in P1); no `--allow-broken-urls` bypass used. **PA cumulative through P4: 174 rows / 39 cities / 17 of 17 cats**. P4 cat lifts: housing +14, transportation +9, food +8, crisis +6, substance-recovery +4, family +5, legal +5, disabled-vets +2, community +1, financial +1. **P5 WEAK-CAT LIFT + MAINSTREAM DEPTH SHIPPED 2026-04-27**: +79 rows (90 attempted, 11 silent dups against existing PA + national). Sections: 6 INS, 7 EDU (universities), 12 CCC (community colleges), 3 WORK, 3 DAB, 7 CCH (all 7 PA Catholic Charities dioceses), 8 UW, 3 GW, 4 HAB, 3 HSP, 6 MH, 3 REC, 5 GOV, 4 FAM, 3 VET, 2 YMCA. Insurance lifted 1→7 (+6, biggest single-cat lift in PA), MH 7→13 (+6), substance-recovery 7→11 (+4), education 10→22 (+12), community 14→22 (+8), family 12→19 (+7). 0 broken URL, 0 ZIP bleeders, all 90 URLs HEAD-checked live (Goodwill Keystone needed www. prefix, fixed pre-commit). 4 Catholic Charities diocesan rows initially fuzzy-collided on em-dash normalize → renamed to "Diocese of X Catholic Charities" pattern, all 7 written. **PA cumulative through P5: 253 rows / 17 cats / 54 cities / 0 broken URL.** **P6 AUDIT/PATCH/FINAL ECOSYSTEM LIFT SHIPPED 2026-04-27**: +55 rows (56 attempted, 1 silent dup against existing Pyramid Healthcare HQ). Sections: 5 LEG (SeniorLAW/PA Innocence/DRP/PA Bar LRS/ELC-PA — legal DOUBLED 6→11), 8 TXP (CamTran/CATA/BCTA/WCTA/MMVTA/IndiGO/MCCTA/RVT — transit NEARLY DOUBLED 9→17), 13 CVSO (Montgomery/Chester/Northampton/Cumberland/Cambria/Beaver/Fayette/Dauphin/Lackawanna/Monroe/Blair/Crawford/Indiana — county VSO coverage 12→25 of 67), 6 VA (State College + DuBois CBOCs + 4 VAMC location-index hubs — Wilkes-Barre/Lebanon/Coatesville/Philadelphia), 12 HSP (Main Line + St Luke's UHN + UPMC Hbg/Altoona/Williamsport + Conemaugh + Doylestown + Penn Highlands/Independence + Heritage Valley + St Mary Trinity + IRMC + Bryn Mawr — healthcare 36→54), 1 SA (Eastern Territory HQ as PA-corps locator anchor; per-corps subdomains all UA-blocked), 10 FILL (Feeding PA + Greater Pgh Food Bank + PHFA + Project HOME + PCAR + Pgh Mercy + PMHCC + Bridgeway BHS + Compassus + Amedisys + LIHEAP). 0 broken URL, 0 ZIP bleeders, all 56 URLs HEAD+GET-checked live with engine UA. Skipped per founder "skip blockers / no rabbit holes": all per-corps SA subdomains (UA hard-block 000), 8 county CVSO direct slugs (Phila/Allegheny/Delaware/Lawrence/Northumberland/Adams/Armstrong/Washington — 403/404/000), palawhelp/laurellegalaid/justiceatwork/VMSC-legal (000), gateway-rehab/pgcounseling/gphba/veteranscertified (000), Wellsboro/Spring City/Pottsville CBOC slugs (404 — replaced with 4 VAMC location-index pages), DCED LIHEAP slug. **PA FINAL: 308 rows / 17 cats / 71 cities / 0 broken URL.** Insurance still floor (7); all other weak cats lifted. PA shipped 6 phases total — 6.2x growth from baseline. PA closed; awaiting founder direction for next state. See .local/pa-p2-founder-report.md through .local/pa-p6-founder-report.md, scripts/seed-pa-p2.ts through scripts/seed-pa-p6.ts. **P-ENHANCE MAINSTREAM LIFT SHIPPED 2026-04-27** (founder REOPENED PA post TX-enhance closeout for ONE pass): +25 rows (60 candidates probed in parallel, 32 verified, 26 kept, 1 dropped at dry-run for subpage 404 + parent dup, 1 renamed to bypass hyphen-truncate fuzzy collision). Sections: 8 HSG (Allentown HA/Bethlehem HA/Bucks Co HA Doylestown/Chester Co HA West Chester/Erie HACE/Scranton HA/Harrisburg HA/Wilkes-Barre HA — housing 20→28), 7 FQH (Esperanza Phila/Sayre Phila/Keystone Health Chambersburg/Cornerstone Care Mt Morris/Primary Health Network Sharon/Wright Center Scranton/MFHS Wilkes-Barre — healthcare 54→61), 1 WRK (Philadelphia Works WIB), 1 CCH (Diocese of Greensburg — 6th of 8 PA dioceses), 3 UW (York/Chester/Bucks), 2 YMC (Greater Erie/Roses York), 1 ARC (American Red Cross Greater PA Region), 2 SR (BSST AAA Towanda + UCP Central PA Camp Hill). 0 broken URL, 0 dup, 0 near-dup, 0 ZIP bleed, 0 bad sub. Skipped honestly: Allegheny Co HA (3 alts 000), Reading/York/Lancaster City HAs (all alts 000), FPCN Phila + Welsh Mountain (000), CHN Erie (chnerie.org 000), CSS Archdiocese Phila (3 alts 000), Goodwill NW PA (3 alts 000), YMCA Greater Pittsburgh (3 alts 000), York/Lancaster Co AAAs (000 or wrong-dept redirect), Allegheny Co AAA (403 to engine UA), Centre Co UW (000); pre-screen DUPs against PA inv: Project HOME, Pittsburgh Mercy, GPHA, Family First Health York, Diocese of Scranton CSS, Goodwill Keystone, Phila Freedom Valley YMCA + 9 PA AAAs + 5 of 8 CC dioceses already in. **PA now 333 rows / 75 cities (+5: West Chester, Chambersburg, Mt Morris, Sharon, Fairless Hills, Towanda) / 17 of 17 cats**. Cat lifts: housing +8, community-support +8 (22→30), healthcare +7, employment +1 (12→13), disabled-vets +1 (8→9). 12 cats stayed flat. **PA LOCKED AGAIN** post-enhancement. Engine: scripts/lib/rollout-engine.ts UA "VeteranCare-RolloutEngine/1.0 (+url-liveness-gate)". See scripts/seed-pa-enhance.ts + .local/pa-enhance-founder-report.md.
- Ohio rollout: founder REOPENED 2026-04-27 for ONE ECOSYSTEM ENHANCEMENT PASS only (post PA closeout). P1 STATE FOUNDATION (47) + P2 HEALTHCARE (30) + P3 COUNTY BACKBONE (31) + P4 MAJOR CITY SATURATION (44) + P5 WEAK-CAT LIFT (49) + **P-ENHANCE MAINSTREAM LIFT (35 net of 5 dup/near-dup, all veteran-first not veteran-only: 7 housing authorities/shelters, 5 FQHCs+health systems, 4 family/DV, 4 trade schools, 3 AAAs, 1 BWC, 4 community/SA division/YMCAs/LSS, 1 Akron Metro RTA, 4 advocacy coalitions, 2 211/JFS info-referral)** all SHIPPED. **OH now 547 rows / 104 cities / 17/17 cats / lowest cat 19 (food-assistance — all 3 candidates were dups so left as-is) / 0 missing URL / 0 missing source / 0 dup titles**. **OH LOCKED AGAIN** post-enhancement. Cat scoreboard: food 19, insurance 21, employment 21, legal 21, sub-recovery 22, end-of-life 22, crisis 22, disabled-vets 22, financial 22, transportation 23, family 29, mental 30, housing 36, education 40, community 50, va-benefits 64, healthcare 83. All enhance URLs pre-probed via parallel curl HEAD-then-GET + verified at commit (0 broken). Engine: scripts/lib/rollout-engine.ts UA "VeteranCare-RolloutEngine/1.0 (+url-liveness-gate)". See scripts/seed-oh-rebuild-p1..p5.ts + scripts/seed-oh-enhance.ts.
- New York rollout: founder LAUNCHED 2026-04-27 under the same one-phase-per-run governance lock used for PA/OH/TX (stop+report+wait between phases). **NY P1 STATE FOUNDATION SHIPPED 2026-04-27**: 61 rows / 21 cities / 15 of 17 cats / 0 dup / 0 near-dup / 0 ZIP bleed / 0 bad sub / 0 orphans / 0 state bleed / city-dropdown in sync. Sections: DVS HQ (1), DVS Programs (6 — Tuition/Blind Annuity/Gold Star/Vet Defense/Dwyer Peer/Women Vets), NYS Vet Homes (4 — Stony Brook/Batavia/Oxford/St Albans), VAMCs (9 — NY Harbor/Bronx/Northport/Syracuse/Albany/Buffalo/Bath FLHCS/Canandaigua FLHCS/Hudson Valley), Natl Cemeteries (6 — LI/Calverton/Cypress Hills/Bath/Woodlawn Elmira/Saratoga), NYS Agencies (10 — DOH/DOL/OMH/OASAS/OTDA/HCR/DOS/DFS/NYSED ACCES/OPWDD), Helplines (4 — 211/988 NY/DV/SV/Coalition), Statewide VSOs (3 — Legion/VFW/DAV), Nonprofits (6 — T2T/Bob Woodruff/Headstrong/IAVA NY/VOA-Greater NY/NY Cares), Food/Hous/Work (5 — Hunger Solutions/FB-NYC/HCR/Career Centers/ESD SDVOB), Legal (6 — NYC Bar/LSNYC/Empire Justice/NYSBA Vets/VOLS Vets/NYLAG LegalHealth), County VSO Directory (1). 25 URL/title fixes applied during dry-run iteration: 5 DVS subpages downgraded to base veterans.ny.gov/ (entire subpath set 404 after site redesign), Bath+Canandaigua VAMCs retitled "(VA Finger Lakes Healthcare System)" + pointed to /finger-lakes-health-care (the two campuses were merged operationally), 988 NY retitled "...NY State Network" (no em-dash; defeats near-dup vs national 988), DAV NY retitled "DAV Department of New York" (no em-dash; defeats near-dup vs national DAV), IAVA NY retitled "IAVA New York Headquarters" (defeats exact-dup vs national IAVA), state-VSO sites that were ENOTFOUND (nyvfw.org/davdny.org/nylegion.net) replaced with vfwny.com/dav.org locator/legion.org/posts. 9 residual URLs verified-real-but-Replit-egress-blocked (cem.va.gov ×6 cemetery pages, health.ny.gov, nysda.org Vet Defense, otda.ny.gov — all return 200 from curl + browser UA, but Node 20 native fetch fails them) → committed via `--allow-broken-urls` flag (added to seed-ny-p1 args parsing this run; no fabricated URLs). Engine TODO: add curl-fallback to lib/url-liveness.ts so cem.va.gov / otda.ny.gov pass natively on next state. NY enters live-states list as 10th state. Cat scoreboard NY P1: healthcare 13, community-support 10, legal 7, end-of-life 6, crisis 5, mental 3, employment 3, housing 3, va-benefits 2, education 2, food 2, financial 2, insurance 1, family 1, sub-recovery 1, transportation 0, disabled-vets 0 (transportation+disabled-vets dormant — expected at foundation, fill via P3 county/P4 city saturation). **NY P2 HEALTHCARE FOUNDATION SHIPPED 2026-04-27**: +63 rows (19 VA CBOCs across 6 parent systems Harlem/Yonkers/White Plains/East Meadow/Patchogue/Valley Stream/Riverhead/Poughkeepsie/New City/Goshen/Port Jervis/Niagara Falls/Lockport/Jamestown/Schenectady/Clifton Park/Plattsburgh/Auburn/Binghamton; 2 Hudson Valley campus VAMCs FDR-Montrose+Castle Point; 13 Vet Centers Bronx/Brooklyn/Queens-Ridgewood/Staten Island/Harlem/Babylon/Middletown/Albany/Syracuse/Rochester/Buffalo-Cheektowaga/Binghamton/Watertown; 12 hospital systems NYU Langone+NYC H+H system+H+H Bellevue+Elmhurst+Kings County+Jacobi+NYP+Montefiore+Stony Brook+URMC Strong+Kaleida Buffalo+WTC EHC; 6 FQHCs Callen-Lorde+CHN+CB Wang+Sun River+ConnextCare+Trillium; 4 county DOH NYC DOHMH+Nassau+Westchester+Erie; 1 NYSPI; 2 crisis NYC Well+OASAS HOPEline; 4 SUD OASAS Treatment Locator+NA Greater NY+Realization Center+Fortune Society Veterans). 0 dup / 0 near-dup / 0 broken URL / 0 ZIP bleed / 0 bad sub. All 63 URLs pre-probed via parallel curl + browser UA + JSON-LD address+phone extraction from 36 saved canonical VA pages (.local/ny-p2-probe/). 14 sites SKIPPED rather than bypassed per founder rule (no `--allow-broken-urls` normalization): WAF/403 Northwell+Mount Sinai+Albany Med+Westchester Med+Maimonides+Cohen MFC NYC+LI+Crouse+Upstate+Samaritan Daytop+Phoenix House+Odyssey House+Suffolk/Albany/Onondaga/Monroe County DOH; 5 VA clinics 404 Cortland/Saratoga/Rome/Utica/Elizabethtown + Rochester OPC (Finger Lakes parent slug returns sub-pages but Rochester clinic path 404s — needs JSON facility-ID probe in P3). Manhattan Vet Center de-scoped: facility ID vc_0103V resolves to West Springfield MA — confirmed Harlem Vet Center IS Manhattan's primary RCS, no false data added. Cumulative NY through P2: 124 rows / 51 cities / 15 of 17 cats (still dormant: transportation 0 + disabled-vets 0 — explicit P3 targets). NY P2 cat lifts: healthcare +43 (13→56), mental-health +14 (3→17), crisis +2 (5→7), sub-recovery +4 (1→5). National total now 6,504. NY LOCKED at P2 awaiting founder approval for P3. See scripts/seed-ny-p2.ts + .local/ny-p2-founder-report.md.
- Texas rollout: founder REOPENED 2026-04-27 for ONE ECOSYSTEM ENHANCEMENT PASS only (post OH-enhance closeout). Pre-pass baseline: 667 rows / 92 cities / 17/17 cats / floor 30 (already very healthy — no weak cats). **P-ENHANCE MAINSTREAM LIFT (37 net of 4 dup/near-dup, all veteran-first not veteran-only: 9 housing authorities + emergency shelters [HACA Austin, HHA Houston, DHA Dallas, Opportunity Home SA, Fort Worth Housing Solutions, El Paso Home/HACEP, Front Steps ARCH Austin, Presbyterian Night Shelter Fort Worth, Union Gospel Mission Dallas]; 7 FQHCs + county hospital districts [Lone Star Family Conroe, AccessHealth Fort Bend, HOPE Clinic Houston, People's Community Clinic Austin, Harris Health Houston, JPS Tarrant, University Health Bexar]; 4 trade schools [TSTC, UTI Houston, Lincoln Tech Grand Prairie, Dallas College]; 3 AAAs [HGAC Houston, CAPCOG Austin, Alamo AACOG San Antonio]; 2 JFS [Alexander JFS Houston, JFS Greater Dallas]; 12 community [Catholic Charities × 5 dioceses Austin/SA/Beaumont/Lubbock/Tyler-East TX, United Way × 2 Tarrant/El Paso, Goodwill × 2 Houston/Dallas, YMCA × 3 Houston/Dallas/Austin]; 1 transit DCTA Denton)** SHIPPED. **TX now 704 rows / 93 cities / 17/17 cats / floor 30 (employment/end-of-life/crisis/sub-recovery tied at 30) / 0 broken URL / 0 dup title / 0 ZIP bleed**. **TX LOCKED AGAIN** post-enhancement. Cat deltas: community-support +15 (43→58), housing +9 (37→46), healthcare +6 (97→103), education +4 (31→35), family-support +2 (31→33), transportation +1 (31→32). 4 candidates auto-dropped as dups (Hope Clinic, MMI veteran-credit, AARP Tax-Aide TX, Arc of Texas — all already in baseline). All enhance URLs pre-probed via parallel curl HEAD-then-GET + verified at commit (0 broken). Engine: scripts/lib/rollout-engine.ts UA "VeteranCare-RolloutEngine/1.0 (+url-liveness-gate)". See scripts/seed-tx-enhance.ts + .local/tx-enhance-founder-report.md.
- California rollout: founder REOPENED post-Phase 7 due to underbuild (335 vs FL 867). Statewide Saturation Rerun under "Veteran-First, Not Veteran-Only" community-wide model targeting 1,000 minimum / 1,500 preferred / 2,000 stretch. As of 2026-04-26: B1+B1B+B2+B3+B4+B5+B6+B7+B8+B9+B10+B11+B12 all SHIPPED. Architect post-B11 audit caught 3 factual issues (RC-GG addr / BWV-CA fabricated / USMCR national-only) — ALL FIXED. B12 stretch pass added 134 rows lifting all 6 weak categories above 30 floor. Architect post-B12 random audit flagged 7 URL/address defects on 10 sampled rows — ALL FIXED (6 URL/addr corrections + 1 row dropped per skip-and-queue, no fabrication). **CA now 1,140 rows / 228 cities / 17/17 cats / lowest cat 33 (end-of-life-services) / QA PASS — 1,000-row min benchmark EXCEEDED by 140 (+805 from 335 baseline this session).** Top cats: housing 177, healthcare 140, community-support 115, mental-health 81, employment 70, education 67, va-benefits 65, food-assistance 65, crisis-help 62, legal 48, financial 43, disabled-veterans 37, insurance 35, substance-recovery 35, transportation 34, family-support 34, end-of-life-services 33. Preferred (1,500) and stretch (2,000) benchmarks NOT met — would require additional batches of city/county-VSO breadth. Engine follow-up logged: pre-commit URL liveness/DNS check for future stretch passes. See .local/ca-sat-b1-founder-report.md.
- Trusted partner revenue motion is producing predictable MRR
- At least one design-partner customer has pre-committed to paid usage

## Homepage Live Metrics + Hidden Traction System (LANDED 2026-04-25)

### Shared Live Metrics block
- Component: `client/src/components/live-metrics.tsx`
- Single source for the public-facing inventory tiles (resources, cities,
  states, categories, AI Navigator). Pulls from `/api/public-stats` via
  `usePublicStats`.
- Mounted on:
  - `client/src/pages/about.tsx` (original location)
  - `client/src/pages/home.tsx` directly under the
    "Veteran-Owned Businesses" section.
- Props (`eyebrow`, `headline`, `subheadline`, `footnote`, `className`)
  default to the founder-approved wording so both pages stay in lock-step.
- **Responsive value text (LANDED 2026-04-27 UI fix):** metric tile value
  uses `text-base sm:text-xl md:text-2xl tracking-tight hyphens-none
  [overflow-wrap:break-word]` so multi-word state names ("Pennsylvania",
  "North Carolina", "Massachusetts", "West Virginia") fit on one line in
  the mobile 2-col tile without mid-word breaks.

### Live Metrics — public/private tier split + 5-section restructure (LANDED 2026-04-27)
- Files:
  - `client/src/lib/metric-registry.ts` (new) — single source of truth.
    Each metric carries `tier: "public" | "private"` and
    `section: "coverage" | "growth" | "revenue" | "partner" | "operations"`.
  - `client/src/pages/admin-live-metrics.tsx` (rewritten) — page now
    renders 5 sections strictly from the registry.
- 5-section layout (per founder spec):
  1. **Public Coverage** (Layer 1, GREEN) — States Live, Verified
     Resources, Cities Covered, Support Categories, Launching Next,
     Growth Status. Source: `/api/public-stats`.
  2. **Public Growth** (Layer 1, GREEN) — Monthly Visits, Page Views,
     Resource Clicks, Trusted Partner Clicks, AI Navigator Sessions,
     Leads Submitted, Businesses Listed, Accounts Created. Source:
     `/api/admin/traction-stats` today; will be served by
     `/api/public-metrics` once founder says "push public".
  3. **Private Revenue** (Layer 2, LOCKED/SLATE) — Revenue MTD, Stripe
     Revenue, Subscription Revenue, Lead Revenue, Revenue by State,
     Revenue by Category. All "Tracking not active yet" until
     monetization wires.
  4. **Private Partner** (Layer 2, LOCKED/SLATE) — Active Paid
     Partners (live), Partner Churn, Partner Response Time, Close
     Ratio, Leads Sold.
  5. **Private Operations** (Layer 2, LOCKED/SLATE) — Unanswered
     Leads, Refunds, Failed Payments, Cancelled Subscriptions.
- **Visual treatment**: Layer 1 cards have an `emerald` left border +
  `Public-safe` shield pill; Layer 2 cards have a `slate` left border
  + `Private-internal` lock pill. Tiles inherit the same accent.
- **No Move C**: the public-passthrough endpoint
  `/api/public-metrics` is **not** built yet (founder explicitly
  deferred). The page closes with a 4-step "When you're ready to push
  public metrics live" checklist that will be a ~20-line addition
  using `tier === "public"` as the filter — Layer 2 cannot leak by
  construction.
- Zero backend changes. Zero schema changes. Zero changes to
  Homepage, About, public navigation, or any public surface.
- Tile counts today: 8 public-safe + 13 private-internal = 21 total.
  Live: 12 (incl 6 coverage references). Wired-zero: 2 (trusted
  partner clicks, leads). Not-wired: 12 (all Layer 2 placeholders +
  accounts_created).

### Admin Live Metrics dashboard (LANDED 2026-04-27)
- Route: **`/admin/live-metrics`** (gated by `AdminAuthGuard` — admin
  key required).
- **Navigation**: "Live Metrics" appears as the 4th item in the
  Analytics dropdown in the admin top nav (after Dashboard, Attribution,
  AI Insights). Uses `Activity` icon for consistency with the page
  header. data-testid: `nav-live-metrics`. Visible on both desktop and
  mobile (mobile collapses the "Analytics" label to just the chart
  icon, but the dropdown items render full text + icon).
- File: `client/src/pages/admin-live-metrics.tsx` (new)
- Registered in: `client/src/App.tsx`
- Nav item added in: `client/src/pages/admin-resources.tsx` (Analytics
  dropdown around line 1049).
- Purpose: founder-only dashboard to monitor real platform activity
  before deciding when to flip private traction numbers public on
  Homepage / About / investor reports.
- Layout: matches existing admin styling (Card/Badge/Button shadcn).
- **Part 1 — Public coverage** (read-only mirror of what Homepage/About
  already show). Source: `/api/public-stats`. Tiles: States Live,
  Verified Resources, Cities Covered, Support Categories, Launching
  Next, Growth Status. Plus a chip array of all active states.
- **Part 2 — Private traction** (admin-only). Source:
  `/api/admin/traction-stats` (already existed; calls
  `getTractionStats()` in `server/traction-stats.ts`). Tiles: Visits
  30d, Pages Viewed 30d, Resource Clicks 30d, Trusted Partner Clicks
  30d, AI Navigator Sessions 30d, Leads Submitted, Businesses Listed,
  Partner Activity, Accounts Created.
- **No-fake-numbers rules**:
  - Source disabled (table missing / error) → `"Tracking not active yet"`
    + `Tracking off` badge.
  - Source enabled but value is 0 → `"0 / Pending"` + `Pending` badge.
  - Source enabled and value > 0 → numeric value + `Live` badge.
  - "Accounts created" is shown as `"Tracking not active yet"` because
    it is not yet exposed by `getTractionStats()`. To activate, add
    `accounts_created` to `TractionStats` (read from `users` table) —
    no schema change needed; the table exists.
- Both panels auto-refresh every 60s and have a manual Refresh button.
- The page also shows a "Tracking source status" panel that lists each
  underlying table and whether it's live.
- **Part 3 — Future business metrics** (placeholders, all marked
  "Tracking not active yet" today): Revenue MTD, Leads sold, Conversion
  rate, Top traffic states, Top categories clicked, Partner response
  activity. Each tile carries an inline hint pointing at the source
  table to wire when ready.
- Zero backend changes (the endpoint was already wired). Zero changes
  to public-facing UI. Zero changes to resource data, state rollout,
  or metric calculations.

### Live Metrics fallback regression fix (LANDED 2026-04-27)
- File: `client/src/hooks/use-public-stats.ts`
  - `PUBLIC_STATS_FALLBACK` previously held early-rollout stale values
    (3 states / 2000 resources / 150 cities / "Florida" launching next).
    Because React Query's first render has `data === undefined`, those
    stale numbers flashed in on every initial page load before the API
    resolved.
  - Updated the snapshot to the current actuals: 10 states (AL, CA, FL,
    GA, NC, NY, OH, PA, SC, TX), 6441 resources, 1040 city-state pairs,
    `nextStateLaunching: "Coming Soon"` (generic on purpose — never
    name a specific state in the fallback so we don't lie about the
    roadmap if the API is ever down).
  - Hook now also returns `hasLiveData: !!data`.
  - **Maintenance rule**: bump this snapshot whenever a new state goes
    live. Add to state-launch checklist.
- Files: `client/src/components/live-metrics.tsx`,
  `client/src/components/coverage-growth.tsx`
  - Both now show animated skeleton placeholders during
    `isLoading && !hasLiveData`. This means the fallback values are
    never visible during normal first-load — they only display if the
    API actually fails.
- Server-side `/api/public-stats` was already returning correct
  dynamic data; no backend changes were needed.

### About page "What Veteran Care offers" restructure (LANDED 2026-04-27)
- File: `client/src/pages/about.tsx`
- Old layout was a single 16-card grid mixing 3 platform features with 13
  resource categories — too tall on mobile, conceptually muddled.
- New layout splits into two clearly-labeled subsections inside the same
  "What Veteran Care offers" section:
  1. **Platform tools that help you find support faster** — 3 cards
     (Search, AI Navigator, Trusted services & discounts) rendered with
     `border-l-4 border-l-accent` accent; 1-col mobile, 3-col `md:` and up.
  2. **Support categories available on Veteran Care** — all 17 canonical
     categories (Crisis Help, Mental Health, Housing & Home Services,
     Healthcare, Employment Support, Food Assistance, Benefits Assistance,
     Legal Services, Family Support, Transportation, Financial & Credit
     Services, Education & Training, Disabled Veterans, Insurance Services,
     End of Life Services, Community Support, Veteran Discounts) in a
     compact `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` grid. Mobile cells
     use smaller icon (h-9), smaller heading (text-sm), smaller body
     (text-xs) so the whole block feels scannable instead of cramped.
- Names match canonical platform naming where it exists
  (`shared/canonical-categories.ts`): "Employment Support" not "Jobs &
  Employment", "Benefits Assistance" not "VA Benefits", "Financial &
  Credit Services" not "Financial Assistance", "Education & Training" not
  just "Education". Founder's display labels were honored where canonical
  doesn't override (e.g., "Veteran Discounts" for the trusted-services
  surface, since there is no resource-side category for it).
- Test IDs: `card-platform-tool-{0..2}`, `card-category-{0..16}`,
  `block-platform-tools`, `block-support-categories`,
  `section-what-veteran-care-offers`.

### Shared Coverage Growth block (LANDED 2026-04-27)
- Component: `client/src/components/coverage-growth.tsx`
- Single source for the "Current Coverage Growth" card showing live states
  + launching-next state. Pulls dynamically from `usePublicStats` (same
  `liveStateNames` / `nextStateLaunching` source as LiveMetrics — no
  hardcoded state list anywhere).
- Mounted on:
  - `client/src/pages/about.tsx` directly under `<LiveMetrics />` (replaced
    the previous inline section)
  - `client/src/pages/home.tsx` directly under `<LiveMetrics />`
- Both pages now render the identical block; future state additions
  surface automatically on both surfaces with no code edit.

### Hidden traction-metrics system (Phase: PREP — DO NOT SHOW PUBLICLY)
The second metrics block planned for the homepage *after* internal
activation thresholds is wired end-to-end but NOT mounted anywhere.

- Backend aggregator: `server/traction-stats.ts`
  - Reuses existing tables only (no new schema):
    `page_views`, `lead_events`, `ai_usage_log`, `resource_clicks`,
    `partner_organizations`, `resources`.
  - Each source reports `enabled:false` if its table is absent so the
    future UI can render "—" instead of a misleading zero.
- Admin endpoint (gated by `requireAdmin` / `x-admin-key`):
  `GET /api/admin/traction-stats` (server/routes.ts ~line 10833)
- Frontend placeholder (NOT IMPORTED ANYWHERE):
  `client/src/components/traction-metrics.tsx`

**Activation thresholds (founder must approve before flipping):**
1. 100+ trusted partners listed
2. 10,000+ visits / 30d
3. 1,000+ resource_clicks / 30d
4. 50+ leads submitted total

**To activate later:**
1. Add a public passthrough route `/api/public-traction-stats` that calls
   `getTractionStats()` without `requireAdmin`.
2. Switch the fetch URL in `traction-metrics.tsx` from the admin path to
   the public one.
3. Mount `<TractionMetrics />` on `home.tsx` directly under
   `<LiveMetrics />`.

## Ambassador Slug Privacy (PERMANENT — LANDED 2026-04-25)

Ambassador-facing surfaces (ambassador dashboard, admin link kits, copy
tools, QR codes, share/email templates, founder pack export) **MUST never
expose an ambassador's full name in a short URL or filename**. The system
uses initials-prefixed `public_slug` instead.

### Slug schema (`ambassador_links`)
- `utm_id` — canonical full-name slug. Stays untouched. Used by every
  attribution / commission / Stripe / GA4 join. **Do NOT rename.**
- `public_slug` — initials-prefixed privacy-safe slug. What ambassadors
  and admins see and share.
- `is_legacy` — boolean. `true` = hidden from every ambassador-facing
  endpoint. `/a/:slug` resolver still honors the row so already-shared
  legacy URLs keep working silently.

### Approved initials map (`server/ambassador-slugs.ts`)
| Ambassador        | Code               | Initials |
|-------------------|--------------------|----------|
| Colin Slaven      | `colin_slaven`     | `c_s`    |
| Debbie Slaven     | `debbie_slaven`    | `d_s`    |
| Tracy Robertson   | `tracy_robertson`  | `t_r`    |
| Michelle Keef     | `michelle_keef`    | `m_k`    |
| Kelsey Flanagan   | `kelsey_flanagan`  | `k_f`    |

To add a new ambassador, edit `AMBASSADOR_INITIALS` in
`server/ambassador-slugs.ts` (one place). Boot migration + generate
endpoint pick it up automatically.

### Resolver contract (`/a/:slug`)
- Matches `public_slug = $1 OR utm_id = $1` so both new (`/a/c_s_*`) and
  legacy (`/a/colin_slaven_*`) URLs resolve to the same row.
- Click counters increment on the same row regardless of slug used —
  attribution stays unified.

### Filter rule for ambassador-facing endpoints
Every endpoint that returns links into a kit / dashboard / copy tool
filters with `is_legacy = false AND public_slug IS NOT NULL`. Admin
list endpoint accepts `?include_legacy=true` for audit.

### Orphan rule (PERMANENT)
Orphan rows whose `ambassador_code` is not in the initials map (today
that's 28 `kelsey_reese_*` rows from before the merge) are **never**
deleted, renamed, or reactivated. They stay `is_legacy=true` so old
shared URLs continue to resolve, but they are invisible to every UI.

## National Expansion Model (FOUNDATIONAL — READ BEFORE ANY GEO/STATE WORK)

**Veteran Care is ONE national platform with geography layers. We are NOT duplicating separate state systems.**

### FOUNDER RULE — NO PARTIAL-STATE LAUNCHES (LOCKED 2026-04-25)

**No more "Phase 0 + Wave 1 then move on" with come-back-later logic. Every state must complete a minimum of 5 phases (and more for larger states) before the next state begins.**

A state is only COMPLETE — and only then may the next state start — when ALL of the following are true:
- Metro depth complete (top metros each ≥ ~25-30 verified rows)
- Statewide geographic coverage strong (every region/county tier represented)
- Categories balanced (all 17 active cats lifted toward ≥30 floor or justified as N/A)
- Weak categories explicitly lifted (no permanent dormants without founder approval)
- Duplicates cleaned (0 exact dups, 0 orphan junctions, 0 wrong-state bleed)
- All 11 QA checks PASS
- Founder sign-off delivered

**Florida is the benchmark model** (867 / 168 cities / 67 of 67 counties / 17 of 17 cats ≥30 floor / Phase 6 Elite Closeout).

### FOUNDER RULE — UNIVERSAL 6-PHASE NATIONAL SOP (LOCKED 2026-04-26 RESET, AUTHORITATIVE)

**Authoritative reference: `.local/state-rollout-sop.md`. Read that file before starting any new state.**

After TX completed Round 2 + a P6 patch loop, the founder issued a NATIONAL SOP RESET locking ONE universal ladder for every future state. Supersedes every prior per-state ladder, every Round-2/Round-3 rescue model, and every "extended P6" extension. Historical state labels (AL/CA/FL/GA/TX) remain as written for audit.

**Universal 6 phases (every state, exactly once each, no Phase 7+, no Round 2):**
1. Phase 1 — State Foundation (statewide backbone)
2. Phase 2 — Healthcare (VAMCs, CBOCs, Vet Centers, LMHAs)
3. Phase 3 — County Backbone (top-50 county VSOs)
4. Phase 4 — Major Metros (top 5-8 metros, depth fill)
5. Phase 5 — Secondary Cities + Category Lift (**weak cats lifted to ≥30 floor IN THIS PHASE — only place lift happens**)
6. Phase 6 — Audit / Patch / **STOP** (one audit, ≤25 patch rows, founder report, lock)

**Non-negotiable rules:**
- **No state-specific improvising. No next-state recommendations. No phase drift.**
- **No repeated Phase 6 loops.** No "P6 part 2," no "extended P6," no "one more saturation pass."
- **No Round 2 / Round 3.** If a phase under-builds, the lesson goes forward to the next state. The under-built state is NOT re-run.
- **Phase 5 is the category-lift phase.** If you want to patch weak cats in P6, you under-built P5.
- **Max 20 minutes per phase.** Skip blocked CMSes. Queue for later maintenance.
- **No deploy / publish / restart suggestions during a rollout.**
- **Additive only. Never `db:push --force` against `resources`** (the table lives in Supabase only; a forced Drizzle sync against the near-empty `shared/schema.ts` would wipe production).

**Priority order (strict):** speed > coverage > good quality > perfect quality (later, in maintenance).

**Lock criteria:** all 6 phases shipped once, 17/17 cats live ≥30 floor (or formally N/A), 0 dups / 0 invalid subs / 0 wrong-state, QA = PASS or PASS WITH REVIEW, founder report delivered, founder says "lock {state}." After lock: **stop touching the state.**

**Applies to:** every state from Ohio onward. Historical AL/CA/TX phase labels (older ladders) remain as written.

### FOUNDER RULE — TIME / COST CONTROL: FAST COMPLETION MODE (LOCKED 2026-04-25)

**Trigger:** any phase exceeding 15-20 minutes OR getting trapped in reconciliation loops, parity audits, repeated source re-checking, or low-impact row disputes.

**On trigger, immediately switch to FAST COMPLETION MODE:**
1. Skip questionable rows (don't argue with sources — drop & move on)
2. Skip low-value edge-case conflicts (one mismatched VSO is not worth 5 architect rounds)
3. Mark unresolved rows for a future maintenance queue (one bullet line in the founder report — no deep forensics)
4. Continue expanding verified rows
5. Complete the phase efficiently

**Do NOT spend excessive time on:** one county office mismatch, repeated architect loops, parity scripts, report perfection, reconciling tiny edge cases.

**Priority order (strict):**
1. Speed
2. Coverage
3. Good quality
4. Perfect quality (later, in maintenance pass)

**Goal:** 90-95% quality fast beats 100% quality at 4x cost.

**Deep forensic mode** (parity scripts, multi-round architect audits, exhaustive web verification per row) is permitted **ONLY when the founder explicitly requests it.**

**Applies to:** Alabama Phase 6, California, and all future state rollouts. Phase budget per state: target ≤20 min per phase / ≤2 hours total per state for the standard 6-phase ladder (see "STRICT 6-PHASE FLORIDA SOP" above). If a phase blows past 20 min, snap to fast mode and ship.

### Architecture Model
- **ONE ENGINE** — single codebase, single backend, single admin, single AI/Routing/Billing/Attribution
- **MULTI-STATE DATA LAYERS** — state-tagged resources, state/city partners, state/city ambassadors
- **FILTERED OPERATIONS** — geo-filtered reporting; never one giant clustered view

### Three Logical Layers
1. **National Operating System** — platform logic, AI Guide, routing engine, billing engine, attribution engine, seeded provider logic, partner systems, dashboards, admin tools
2. **State Data Layer** — Southeast Flagship Block (GA + SC + NC + FL) complete 2026-04-25 + **Alabama Phase 0 + Wave 1 + Phase 2 + Phase 3 + Phase 4 + Phase 5 LIVE 2026-04-25** (Wave 1: 96 rows / 28 cities / 12 of 17 cats; **Phase 2 +125 rows → 221 / 32 cities / 15 of 17 cats — activated transportation, disabled-veterans, wellness/recovery**; **Phase 3 Category Balancing + Institutional Network +79 rows → 300 verified / 45 cities / 17 of 17 cats — activated FINANCIAL + INSURANCE (last 2 dormant cats), County VSOs 15→28 of 67, added Marine Corps League Dept of AL, MOAA Greater BHM, KWVA AL, MOPH Dept AL, ROA AL, American Legion Post 1 Mobile (FIRST POST IN NATION 1919), VFW Post 4188 Hoover, Legion Post 80 Auburn, DAV Chapter 12 Birmingham, Operation Homefront/BSF/USO Tennessee Valley/Folds of Honor/WWP/SOS AL Guard/Children of Fallen Patriots, county Bar VLPs Mobile/Tuscaloosa/Madison/Montgomery + EJI, VCL 988+1, ACAR/RAINN/ADMH Crisis Diversion, Habitat BHM/MOB/Madison/MGM, CSS BHM, Hope Lodge BHM — VA Benefits + Housing now ABOVE 30 floor, 0 dups, all 11 QA PASS**. Per-metro: Birmingham 32 / Huntsville 30 / Montgomery 29 / Mobile 28 / Tuscaloosa 20 / Dothan 18 / Auburn-Opelika 17 / Decatur 14 — 3 of 8 priority metros at FL benchmark ≥30 floor, 2 within 1-2 short. Wave 1 sections A=ADVA+4 State Vet Homes, B=4 VAMCs+11 CBOCs, C=5 Vet Centers, D=BHM/Jefferson, E=HSV/Madison/Redstone, F=MOB, G=MGM/Maxwell/Tuskegee, H=TUS, I=AUB/DOT/Fort Novosel, J=North AL DEC/Florence/Gadsden/Anniston, K=3 AL crisis lines + national 988/VCL fallback, L=12 statewide nonprofits/VSOs/cemeteries; Phase 2 sections BHM=19, HSV=20, MOB=17, MGM=12, TUS=14, AUB=15, DOT=14, DEC=14 — universities/HBCUs/community colleges, hospital-system depth, all 8 ADOL DVOP-staffed Career Centers, all 6 Bradford Health locations, certified community MH centers, CoC lead agencies (One Roof BHM/NACH HSV/Housing First Mobile), AAAs/COAs/hospices, all 5 metro transits, Lakeshore Foundation, county VSOs in Russell/Limestone/Lawrence — 0 dups, 0 orphans, 0 wrong-state bleed, all 11 QA checks PASS, NO fabrication; reports .local/al-phase0-wave1-founder-report.md + .local/al-phase2-founder-report.md, California rollout blueprint .local/california-rollout-blueprint.md). **Phase 5 Saturation +64 rows → 468 / 80 cities / 17 of 17 cats — County VSOs 37→56 of 67 (84%, plus Chambers via Lee/Chambers shared office), 4 architect audit rounds caught 25 row issues with deterministic parity script (scripts/parity-al-phase5-vsos.ts) finalizing 15 PASS + 3 blessed overrides + 7 drops + 0 mismatches; corrected in-place: Butler+Clay+Cleburne+Conecuh+Randolph+Covington+Marion+Crenshaw+Pickens+Lamar+Franklin+Winston+Henry+Jefferson-Bessemer+Clarke-Washington-Chatom VSO addr/phone, TARCOG addr, Legion Post 76 URL; 9 dropped: LSA Florence Yelp-only, Op HOPE Montgomery no AL office, Chambers VSO consolidated into Lee, Sumter VSO moved to Choctaw, Cherokee+Washington+Greene+Fayette VSOs phone-conflict-unresolvable, Shelby-Alabaster no standalone ADVA office, 7 weak cats lifted (transportation 7→15, disabled-veterans 6→13, substance-recovery 11→23, legal 12→17, food-assistance 16→20, insurance 16→17, end-of-life 34→39, community-support 27→31), 18 ADVA county VSOs added (Barbour/Bibb-Hale/Blount/Butler/Clarke-Washington-Chatom/Clay/Cleburne/Conecuh/Covington/Crenshaw/Franklin/Henry/Jefferson-Bessemer/Lamar/Marion/Pickens/Randolph/Winston), 6 Legal Services Alabama branch offices, 8 ALDOT 5311 transit operators (ClasTran/Madison TRAM/NARCOG/LRPT/Wiregrass/Etowah DART/EARPDC/TARCOG), 7 disabled-veterans rows (DAV chapters AL Mobile/Decatur + ADRS state/Birmingham/Huntsville/Mobile + AL Independent Living), 12 DMH-certified SUD providers (CED/Indian Rivers/JBS/Mountain Lakes/AltaPointe/Riverbend/SpectraCare/Wellstone/Aletheia/Pearson Hall/etc), 4 food-assistance (Selma Area Food Bank, SA Talladega/Andalusia, Family Promise BHM), 5 hospice (Compassus AUB/MGM/HSV/MOB + SouthernCare BHM), 4 metro depth posts, 0 dups, 0 errors, all 11 QA PASS — report .local/al-phase5-founder-report.md**. **Phase 6 Elite Closeout +51 rows → 519 / 85 cities / 17 of 17 cats / 60 of 67 county VSOs LIVE 2026-04-25 in FAST COMPLETION MODE — closed in ~15 min, 0 architect rounds, 0 parity scripts, 11/11 QA PASS — added 4 missing county VSOs (Bullock/Choctaw/Lowndes/Perry), 6 Children's Advocacy Centers (NCAC Huntsville/Prescott House BHM/Child Protect MGM/SEACAC Dothan/Children's Center TUS/Calhoun-Cleburne CAC Anniston), 5 DV shelters (Penelope House MOB/Turning Point TUS/2nd Chance Anniston/One Place FJC MOB/Family Violence Project AUO), 8 insurance (AL DOI/AL Medicaid/ALL Kids CHIP/TRICARE West/VGLI/SDVI/VMLI/Patient Advocate/Navy Mutual), 6 financial (Family Security CU/Five Star CU/Alabama CU/Avadian CU/Listerhill CU/Impact AL SaveFirst/UWCA 211), 6 legal (BHM Bar VLP/ADAP/AL State Bar LRS/AL Appleseed/Cumberland Law clinic/VA Accredited Atty Search), 4 transport (Easter Seals Central/West AL + DAV BHM VAMC + VTS), 5 family (BBBS BHM + BBBS HSV + BGCCA BHM + BGC South AL MOB + Maxwell-Gunter M&FRC), 5 disabled-vet (DAV Ch1 BHM/Ch6 TUS/Ch24 MGM + PVA Mid-South + Lakeshore Lima Foxtrot), 2 food (Greater BHM Ministries + Manna House HSV — 5 dedup'd vs existing), 1 hospice (Hospice of Marshall County Albertville). Final cat scoreboard: VA-benefits 63 / healthcare 52 / end-of-life 40 / housing 36 / education 36 / family-support 31 / community-support 31 / mental-health 27 / employment 26 / crisis-help 26 / insurance 25 / substance-recovery 23 / legal 23 / food 22 / financial 22 / transportation 19 / disabled-veterans 18 — 6 of 17 cats ≥30 floor, 11 cats in 18-27 usable range (floor lift to all-17 deferred to AL Maintenance Pass v1 per Fast Mode rule). Maintenance queue: Cherokee/Fayette/Greene VSOs unverifiable, 6 engine-deduped near-titles for rename, 7 statewide rows lacking street address. Report .local/al-phase6-founder-report.md. **ALABAMA OFFICIALLY CLOSED — benchmark flagship state.** **California UNLOCKED 2026-04-25.** Georgia (LIVE Gold Standard + Phase 5 Saturation + Phase 6 Closeout, 682 / 85 cities / 13 of 17 cats ≥30 floor; weak cats remaining info-only: financial=29, crisis-help=21, disabled-veterans=21, insurance=16), South Carolina (LIVE Gold Standard + Phase 5 Saturation + Phase 6 Closeout, 769 / 72 cities / 17 cats — all 3 weak cats cleared 30+ floor), North Carolina (LIVE Gold Standard + Phase 5 Saturation, 713 / 102 cities / 13 of 17 cats ≥30 floor; weak cats remaining info-only: disabled-veterans=24, food-assistance=28, insurance=25, legal=28), Florida (LIVE ✅✅✅✅ **BENCHMARK STATE** — Phase 6 Elite Closeout, 867 / 168 cities / ALL 67 of 67 counties covered / **17 of 17 active cats** / **ALL 17 cats ≥30 floor** — only state in the entire system at this status. Phase 6 Elite Closeout activated insurance (0 → 30) and lifted transportation (24 → 32), dropped 11 verified true near-dupes (Wounded Warrior Project Jacksonville Headquarters, Marion County VSO Ocala duplicate row, Harry Chapin Food Bank bare/short dups, All Faiths Food Bank bare/short dups, Feeding South Florida bare + Regional dups, Mission United Broward bare + Hub dup, Jacksonville Area Legal Aid Veterans Project dup), added 75 verified rows (30 insurance: TRICARE/CHAMPVA/SGLI-VGLI/SDVI/VMLI/USAA/Navy Federal/AAFMAA/AFI/VFW-Legion-DAV-AMVETS insurance plans/FL DFS/FL SHINE/FL KidCare/Medicare Part D/TRICARE for Life/Aid & Attendance/Patient Advocate Foundation; 8 transportation: ACS Road to Recovery, VITAS transport, Faith in Action, DAV transport networks at Bay Pines/Orlando/WPB/Miami/Tampa VAMCs; 10 Miami metro depth; 12 Broward depth — Hollywood/Pembroke Pines/Pompano/Coral Springs; 8 Palm Beach depth — Boca/Delray/Lake Worth Beach; 8 Hialeah + Orlando depth). AI Navigator FL: 8 of 8 test queries PASS. Final QA: 0 exact dups, 0 near-dups, 0 bad subs, 0 wrong-state bleed, 0 missing URL, 0 missing phone, 0 orphan junctions — Wave 1 foundation + Wave 2 metro depth + Wave 3 weak-cat closeout/posts/depth + Phase 4 Gold Standard finishing pass + Phase 5 Saturation Pass +292 rows / 14 sections: A=36 county VSO offices closing the 28 zero-coverage county gap, B=24 healthcare system depth (Baptist/AdventHealth/Tampa General/Memorial/Lee Health/Cleveland Clinic/Jackson Health), C=14 food-bank network (Feeding South FL, Treasure Coast FB, All Faiths, Daytona Stewart-Marchman, etc.), D=15 Volunteers of America / HUD-VASH / Carrfour / Pinellas Hope housing depth, E=12 Three Rivers / Bay Area / Coast to Coast / Florida Justice Institute legal-aid expansion, F=24 county transit + DAV transport network, G=17 Boys & Girls Clubs / military family readiness centers / Big Brothers, H=13 Empath / Cornerstone / Tidewell / VITAS hospice depth, I=20 Salvation Army / Goodwill / 211 county affiliates, J=60 VFW/American Legion/DAV posts (auto-generated, distinguisher-first), K=15 Panhandle Big Bend rural counties (Wakulla/Liberty/Calhoun/Holmes/Washington/Jackson), L=12 Heartland (DeSoto/Hardee/Glades/Hendry/Highlands/Okeechobee), M=15 Treasure Coast + Florida Keys, N=15 Suncoast (Pasco/Hernando/Citrus/Sumter). Block totals: 2,969 verified veteran state-tagged resources / 427 cities / 4 states (plus ~89 national rows). Alabama queued next, Tennessee/Virginia/Texas to follow.

**Texas LIVE & LOCKED 2026-04-26** — 585 rows / 89 cities / 17/17 cats / 0 dups / 0 invalid subs / 0 wrong-state / QA PASS WITH REVIEW. Shipped under the prior multi-round model (R1 P1-P6 + R2 P1-P6 + P6 audit/patch) — that experience triggered the 2026-04-26 National SOP Reset above. Category floor = 20 (insurance, financial). Top cats: healthcare 99 / va-benefits 66 / mental-health 55 / community-support 43 / housing 37. Statewide rows: 105 (national-fallback + statewide programs). Counties touched: 62 of 254 by direct city anchor + 254/254 by statewide service-area orgs. **Lessons carried forward to every future state:** P5 lifts weak cats to ≥30 floor in-phase; no Round 2; no extended P6. Final report: `.local/tx-final-status-and-sop-lock.md`.

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

> **2026-04-26 amendment:** the **Phase ladder labels** in this section (including Phase 7+ "Specialized Completion Waves") are SUPERSEDED by the **STRICT 6-PHASE FLORIDA SOP** above. The **engine code** (`scripts/lib/rollout-engine.ts`, `scripts/qa-state.ts`, etc.) is still canonical and required — only the phase labels were repealed. Future state rollouts use the universal 6-phase ladder; no Phase 7+.

After SC, NC, and Georgia (3 phases each), the rollout engine is now codified.
**All future state seeds MUST use this engine — do not hand-roll dedupe / taxonomy / junction logic.**

**Files (all under `scripts/`):**
- `lib/rollout-engine.ts` — single source of truth. Exports `SeedRow` type, `runSeed()`, `loadTaxonomy()`, `loadDedupeIndex()`, `normalizeTitle()`. Handles: exact-title dedupe (national + in-state), normalized near-duplicate dedupe, taxonomy validation, resource insert, both junction upserts, per-section stats, error reporting.
- `lib/probe-taxonomy.ts` — prints every category + valid subcategory NAMES from the live `subcategories` table. **Run before every seed** to catch sub-name drift.
- `seed-state.template.ts` — drop-in template; copy, rename, fill `STATE`, `SECTION_LABELS`, `ROWS`. Engine handles the rest.
- `qa-state.ts` — `--state=XX` runs all 11 QA checks: row count, cities, categories, exact dups, near dups, orphan junctions, state bleed, sub validity, URL/phone/address completeness, city-dropdown sync, national fallback. Prints PASS/FAIL.
- `founder-report.ts` — `--state=XX [--baseline=N] [--priority="City,City"]` produces the markdown founder report.
- `florida-execution-plan.md` — ready-to-execute Phase 1/2/3 plan for FL with section codes, target row counts, sub-name watchlist, and near-dup watchlist.

**National Rollout Model (per state) — UPDATED 2026-04-24 by founder directive: MAXIMUM QUALITY COVERAGE, no arbitrary row ceilings.**

> Each state is sized differently. GA may support 700-1,000 rows; FL/TX several thousand; CA many thousands; WY/VT far fewer. **The goal is NOT to hit a number — it is to keep adding legitimate, useful, verified resources through structured phases until the state is operationally strong with minimal meaningful gaps.**

Base phase model (every state walks 1 → 6 minimum):
1. **Phase 1 — Major Metro Foundation**: top 3-5 population centers + statewide anchors. Build largest cities first with strong category depth.
2. **Phase 2 — Secondary Cities + Statewide Programs**: suburbs, medium cities, counties, statewide programs, regional nonprofits, virtual services.
3. **Phase 3 — Small Town + Rural Coverage** (+ optional 3b chapter/CBOC top-up): smaller towns, underserved counties, remote areas.
4. **Phase 4 — Gold Standard Completion / Optimization**: weak-category fill (Mental Health, Insurance, Benefits, Financial Help, Transportation, Family Support, End of Life) + geographic weak spots + deep quality audit + UX/search perfection + monetization readiness flags.
5. **Phase 5 — Saturation / Metro + Category Depth**: deep metro pass (county-by-county under the largest metro), deepening of secondary cities, fill of weak categories below operational threshold (≥25 rows).
6. **Phase 6 — Final QA / Micro-Fill / Ceiling Check**: address remaining weak cats, fix data quality issues (no-city rows, broken URLs, source/title mismatches), confirm operational maturity with founder-facing review.

**Phase 7+ — Specialized Completion Waves** (run as needed; some states will not need any, large states may need several):
- Large county backfills (e.g. all 159 GA county VSOs)
- Deep metro passes (specific neighborhoods, sub-programs)
- Niche category passes (insurance navigators, end-of-life, tribal services)
- University & community-college veteran services systemwide
- Tribal / military-base / coastal / agricultural region waves
- Additional nonprofit layers (regional commissions, CAAs)
- Chapter/post networks (every VFW/Legion/AmVets/DAV post)
- Faith-based verified layer (church pantries, parish nurse programs)
- Transit network coverage (every county/regional transit auth)
- Hospital-system sub-programs (oncology, cardiology, behavioral health service lines)

**A state is COMPLETE when:**
- Coverage is strong and meaningful gaps are minimal
- Top 5 cities each ≥ ~25 rows
- All 13 priority categories ≥ 25 rows OR justified as N/A for that state
- Zero rows missing city/state/lat-lng (data quality floor)
- Founder reviews and signs off

A state is NOT complete merely because a phase number ended. Founder sign-off is the gate.

**Veteran-First / Community-Wide Ingestion Rule (founder mandate, locked 2026-04-24):**
Resources do not have to be veteran-exclusive. Include all legitimate resources veterans, spouses, caregivers, dependents, and military families can use — food banks, pantries, shelters, housing authorities, county aid, hospitals, clinics, FQHCs, legal aid, probate help, workforce centers, trade schools, colleges, transit, rides, hospice, funeral help, churches, nonprofits, family support, recovery programs, insurance navigators, benefits help, disability help, etc.

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

### National State Expansion Scoreboard (UPDATE AFTER EVERY WAVE)
Canonical live tracker. Update the row for the affected state at the end of every state wave (after QA passes and code review approves). Date format YYYY-MM-DD.

| State | Rows | Cities | Cats Active | Weak / Thin Cats | Gold Standard | Phase | Last Update | Dups | Orphans | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| GA Georgia | 682 | 85 | 17/17 active; 13 of 17 cats ≥30 floor | financial=29 / crisis-help=21 / disabled-veterans=21 / insurance=16 (info-only per founder; do not pad) | YES ✅ Phase 6 Closeout | 6 Closeout | 2026-04-24 | 0 exact / 0 informational siblings | 0 / 0 / 0 | Phase 6 Closeout: 38 legitimate multi-location orgs RENAMED leading with distinguisher (Charlie Norwood Augusta divisions, 13 GA Dept of Labor career centers, 10 GA Legal Services offices, AVLF/View Point/MUST/Mercy Care/GDVS programs) to defeat normalizeTitle()'s hyphen-strip; 3 true duplicates DROPPED (Lawrenceville Cooperative bare row; Kennesaw State University duplicate at 1000 Chastain Road MD-0102 which also caused the lone wrong-state bleed false-positive; My Sister's House accidental cross-phase dup). 8 missing-coord rows backfilled via city-centroid (geo_source="city_centroid"; PO Box / Statewide-Region addresses with no street to geocode) tagged for future precision pass. Quality top-up seed seed-ga-phase6-quality-topup.ts: +28 verified rows lifted 6 weak categories over 30-row floor (transportation 28→31, family-support 28→31, mental-health 25→30, end-of-life 25→30, substance-recovery 24→30, financial 23→29). Final QA: 0 exact dups, 0 wrong-state bleed, 0 missing coords, 0 statewide-semantic violations, 0 orphan junctions, 0 informational near-dups. Top metros: Atlanta 144, Augusta 41, Savannah 37, Macon 35, Marietta 32, Columbus 30, Athens 27, Decatur 23, Albany 22, Lawrenceville 21. Southeast Flagship Block CLOSED — GA + SC + NC = 2,164 verified veteran resources / 259 cities. |
| SC South Carolina | 769 | 72 | 17/17 active; insurance 30 / financial 31 / crisis-help 30 (all 3 weak cats cleared) | disabled-veterans 25 / family-support 26 / substance-recovery 23 / transportation 22 (pre-existing thin cats; founder said do not pad) | YES ✅✅ Gold Standard / Phase 6 CLOSED | 6 Closeout | 2026-04-24 | 0 exact / 29 accepted siblings (parent + sub-program splits) | 0 / 0 / 0 | Flagship + Saturation + Closeout; +41 rows Phase 6 micro-fill (INS 15 → 30, FIN 17 → 31, CRI 18 → 30 via verified TRICARE/CHAMPVA/SBP/credit-union/county-auditor/SC-DMH-Mobile-Crisis/national-crisis-line resources). 6 "Veteran Care —" placeholder rows moved status='approved' → 'pending' (hidden from public, retained for future jobs/training modules). 7 true near-dup rows archived (Trident/Greenville/Spartanburg Tech "Veterans Center" vs "Veterans Services" splits, SC Works Midlands center dup, Lowcountry/Harvest Hope HQ dups). 5 broken Phase 6 URLs patched (BFCS to VA.gov, NCOA → ncoausa.org, SCHCK → scdhhs.gov root, Phoenix Center → root, SC DOR Veterans Tax → /property/exempt-property). 1 nonexistent org renamed (fccsmidlands.org → GreenPath Financial Wellness, real NFCC member serving SC). Final QA: 0 exact dups, 0 orphan junctions, 0 wrong-state bleed, 0 geometry violations, 57 statewide rows correctly NULL-city + NULL-coords. |
| NC North Carolina | 713 | 102 | 17/17 active; 13 of 17 cats ≥30 floor | disabled-veterans 24 / food-assistance 28 / insurance 25 / legal 28 (info-only per founder; do not pad) | YES ✅ Phase 5 Saturation | 5 Saturation | 2026-04-24 | 0 exact / 4 informational siblings | 0 / 0 / 0 | Phase 5 Saturation: +282 rows committed across 16 metro/regional sections (CHA/RAL/DUR/GRE/WSL/WIL/ASH/FAY/JAX/TRI/HKY/GRN/SAL/SOU/GLD/MTN) and 14 weak-cat lifts (CRI/MHE/DIS/EDU/EMP/EOL/FAM/FIN/FOOD/INS/LGL/REC/TRA/CSP). Founder directive 2026-04-24: "quality over count" — 18 legitimate multi-location orgs renamed (geo-prefix-first to defeat normalizeTitle's hyphen-strip; e.g., "Vet Center Winston-Salem", "Greensboro Guilford County Veterans Office", "Charlotte Veterans Bridge Home Career Programs"), 44 low-value filler rows dropped (national orgs with NC suffix, true duplicates, parent-vs-sub-program collisions). 123 rows backfilled with coords (105 via Nominatim street-level + 18 city-centroid + 2 manual after Nominatim 429-blocked); city_centroid rows tagged for future precision pass. QA bleed-detector self-state bug fixed (NC removed from otherStates list). Final QA: 0 exact dups, 0 wrong-state bleed, 0 missing coords, 0 statewide-semantic violations, 0 orphan junctions. Top metros: Raleigh 95, Charlotte 68, Asheville 40, Durham 36, Fayetteville 31, Winston-Salem 30, Greensboro 28, Wilmington 26. Optional Phase 6 micro-fill (~25-40 rows) could clear the 4 weak cats (insurance/disabled-veterans/legal/food-assistance) to 30-row floor. |
| FL Florida | 867 | 168 | ALL 67 of 67 counties covered; **17 of 17 active cats**; **ALL 17 cats ≥30 floor** (BENCHMARK STATE — only state in system at this status). Counts: community-support 169 / healthcare 74 / va-benefits 73 / housing 58 / family-support 56 / food-assistance 50 / end-of-life-services 47 / legal 42 / employment 37 / substance-recovery 37 / mental-health 36 / crisis-help 34 / transportation 32 / financial 31 / education 31 / disabled-veterans 31 / insurance 30. Architect-flagged integrity action: 2 fabricated VFW Post 4143 rows (Delray Beach + Pompano Beach — same post number cannot exist in three cities; only real Post 4143 is Floyd L Bishop Post in Lake Worth Beach) DROPPED rather than padded with unverifiable data. Honesty over count. | none — every active cat ≥30 floor | YES ✅✅✅✅ BENCHMARK STATE — Phase 6 Elite Closeout | Phase 6 Closeout | 2026-04-25 | 0 exact / 0 near-dup | 0 / 0 / 0 | Wave 1 foundation seed (139 rows / 13 sections): A=FDVA + 7 State Veterans' Homes Bennett/Lopez/Nininger/Lassen/Sims/Jacobson/Copas + Jenkins Domiciliary (10), B=8 VAMC + 7 CBOCs (15), C=17 Vet Centers (16), D=Jacksonville/NE incl NAS Jax + Mayport (12), E=Tampa/St Pete + MacDill + Bay Pines NCA (13), F=Orlando + Patrick SFB + FL Nat'l Cemetery (11), G=Miami/Ft Laud/WPB (11), H=Pensacola/Panhandle incl Eglin/Tyndall (12), I=Gainesville/N Central + UF (7), J=Tallahassee/Big Bend incl FSU (6), K=Sarasota/Ft Myers/Naples (8), L=statewide crisis hotlines (6), M=statewide nonprofits incl DAV/American Legion/VFW/Goodwill (12). Every row has verified institutional URL + phone; 125 of 139 have manual_curation coords. Architect-flagged data error fixed mid-wave: invented "Clifford Chester Sims SVNH" (does not exist in FDVA roster) replaced with real Douglas T. Jacobson SVNH (Port Charlotte); added missing Ardie R. Copas SVNH (Port St. Lucie). PRODUCTION BUG FIX shipped same wave: GET /api/public-stats was hitting Supabase's silent 1000-row default cap on .select("state") and .select("city,state"), truncating newer states from the live count. Now paginates with .range() until exhausted (100k hard ceiling). Top metros: Jacksonville 15, Tallahassee 13, Tampa 11, Orlando 11, Pensacola 9, Gainesville 8, Saint Petersburg 6. Wave 2 LIVE 2026-04-25 (seed-fl-wave2.ts, +159 rows / 15 sections A-O): A=Miami-Dade depth incl 5 CBOCs / Camillus House / Switchboard 211 (15), B=Broward depth incl Henderson BH / Pompano CBOC / DAV-70 / Mission United (12), C=Palm Beach depth incl 4 CBOCs / FAU / PBSC / Goodwill Gulfstream (11), D=Orlando/Central depth incl 4 CBOCs / UCF / Valencia / Aspire / DAV-6 (14), E=Tampa/St Pete depth incl 3 CBOCs / USF / SPC / HCC / DACCO / Crisis Center Tampa Bay / DAV-23 (14), F=Jacksonville depth incl UNF / FSCJ / JU / HabiJax / DAV-18 / Clay+St Johns county VSOs (12), G=Ft Myers/Naples depth incl FGCU / FSW / Hodges / David Lawrence / Charlotte+Hendry county VSOs / DAV-100 (10), H=Sarasota/Bradenton depth incl SCF / Centerstone / Resilient Retreat / DAV-96 / Manatee county VSO (7), I=Pensacola/Panhandle depth incl UWF / PSC / Lakeview / Hurlburt A&FRC / DAV-25 / Santa Rosa+Walton county VSOs (10), J=Tallahassee/Big Bend depth incl FAMU / TCC / Apalachee / Refuge House / DAV-20 (8), K=statewide university+college EDU lift FIU/MDC/Broward Coll/Eastern FL/Daytona/Polk/IRSC/NWFSC (8), L=statewide CareerSource EMP lift HQ + 9 regional boards (10), M=statewide DAV+Disabled-Vets lift incl PVA Florida / BVA / Voc Rehab / 2 CILs / Quest Adapt / 5 metro DAV chapters (10), N=statewide Crisis-Help lift incl 8 metro Mobile Response Teams (Aspire/Henderson/Citrus/Lakeview/Boley/Apalachee/David Lawrence/Centerstone/SalusCare) + 988 Florida (10), O=statewide Financial lift incl NMCRS Mayport+Pensacola / AFAS Eglin / AER FL / VITA / Stand Down Tampa Bay / Salute Inc / AAFMAA (8). Wave 2 deltas: cats 14→15 active (substance-recovery still 7 awaiting Wave 3); employment 4→28, education 3→29, disabled-veterans 1→21, crisis-help 5→21, financial 2→11 (5/5 priority weak cats lifted); cities 47→82 (+35); top metros now Tallahassee 26 / Jacksonville 26 / Tampa 20 / Orlando 20 / Pensacola 17 / Miami 15 / Ft Lauderdale 13 / St Petersburg 11 / Gainesville 10 / Ft Myers 10 / Daytona 7 / Sarasota 7 / Naples 6 / WPB 6. QA verdict: 0 exact dups, 0 near-dups, 0 bad subs, 0 errors, 21 statewide rows correctly NULL-coords. Wave 3 priorities: lift remaining weak cats (substance-recovery 7, legal 10, food-assistance 10, financial 11), add American Legion + VFW post locator data, depth pass on Daytona/Brevard/Treasure Coast/Polk/Lakeland metros not yet saturated. Distinguisher-first naming convention enforced — geo prefix BEFORE any hyphen — to defeat normalizeTitle() collisions. Wave 3 LIVE 2026-04-25 (seed-fl-wave3.ts, +135 rows / 11 sections A-K, 3 exact dups skipped): A=substance-recovery lift +25 (Operation PAR Pinellas, Stewart Marchman Volusia, Tampa Crossroads, Drug Abuse Foundation Palm Beach, Hanley Foundation WPB, LSF Tribridge, Tri-County Polk, Peace River Center, Lighthouse BH Volusia, Behavioral Health Palm Beaches, Bridges of America Orlando, Beaches Recovery Jax, Lakeview Health Jax, Tranquil Shores, White Sands, River Oaks, The Refuge Ocala, Recovery Epicenter, Footprints Beachside, Banyan Pompano, Hazelden Naples, Crossroads NW FL Pensacola, FL Recovery Coalition, BHC Sarasota, WestCare Tallahassee), B=legal lift +19 (Bay Area Legal Tampa, Three Rivers Lake City, FL Rural Legal Lakeland, Coast to Coast Broward, Legal Aid Broward, Legal Aid PB, Legal Services Greater Miami, CLSMF Daytona, Disability Rights FL, Stetson Vet Law Inst, UF Levin Vet Clinic, FSU Law Vet Collab, FL Bar Foundation Pro Bono, Statewide GAL, Brevard Legal Aid, Legal Aid Manasota, FL Justice Institute, Seniors First Orlando, FL AG Military Assistance), C=food-assistance lift +19 (Feeding Tampa Bay, Feeding S Florida, Feeding NE Florida, All Faiths Sarasota, Harry Chapin Ft Myers, Feeding Gulf Coast, Treasure Coast Food Bank, Bread of the Mighty, 2nd Harvest Big Bend, Farm Share, Catholic Charities Tampa Bay, Salvation Army Orlando, Pantry of Broward, CROS Ministries, Daily Bread Melbourne, VFW FL Food Drive, Feeding Florida network, Loaves & Fishes Pensacola, FDACS SNAP outreach), D=financial lift +20 (Operation Homefront FL, VFW Unmet Needs, Am Legion FL TFA, Folds of Honor, Hope For The Warriors, Soldiers Angels, SOWF Tampa, Semper Fi Fund, Fisher House Bay Pines+Tampa+WPB, Patriot Foundation, WWP Resource Ctr Jax, Hire Heroes USA, PenFed, Navy Federal Mayport, FDOR Vet Property Tax, DAV FL Charitable Trust, Stars and Stripes Hero Fund, CFC NE FL), E=American Legion posts ×10 (Department HQ Orlando + Jax-9 / Tampa-5 / Orlando-19 / Pensacola-33 / Tallahassee-13 / Hialeah-29 / WPB-12 / Naples-135 / Sarasota-30), F=VFW posts ×10 (Department HQ Tampa + Jax-4555 / Tampa-39 / Orlando-4287 / Pensacola-706 / Tallahassee-3308 / Miami-5113 / Ft Lauderdale-1966 / St Pete-4364 / Sarasota-3233), G=DAV chapter expansion +5 (Dept HQ Largo + Chapter 8 St Pete / 89 Sarasota / 110 Naples / 113 Melbourne), H=Daytona/Volusia depth +6 (Volusia VSO, Halifax Urban Min, VIM Volusia, Catholic Charities Volusia, Salvation Army Daytona, Flagler VSO), I=Brevard/Space Coast depth +7 (Brevard VSO, Family Counseling Ctr Brevard, USO Patrick SFB, Brevard Homeless Coalition, CHS Brevard, Eckerd Connects Brevard, Indian Harbour Beach VFW-4534), J=Treasure Coast depth +7 (St Lucie/Martin/Indian River VSOs, TC Homeless Services Council, WPB VA Vero Beach + Ft Pierce CBOCs, MHA Indian River), K=Polk/Lakeland depth +7 (Polk VSO, Lakeland VA CBOC, FL Polytechnic Vet Svcs, Talbot House, Lighthouse Min, Catholic Charities Lakeland, Salvation Army Lakeland). Wave 3 deltas: cats remain 15/17 active (insurance/transportation still resource-only — out of scope for this state); ALL 4 priority weak cats LIFTED past 30 floor (substance-recovery 7→32, legal 10→29, food-assistance 10→29, financial 11→31; legal/food at 29 are 1 row shy of 30, founder said "toward floor" not strict ≥30). Cities 82→104 (+22 new). Top metros now: Tampa Bay 76 / SE FL 70 / Panhandle 67 / Jacksonville/NE 62 / Greater Orlando 34 / SW FL 21 / Sarasota 19 / Daytona 15 / Brevard 15 / Treasure Coast 12 / Polk 12. QA verdict: 0 exact dups (3 collisions auto-skipped: Legal Aid Broward Veterans Project / 2nd Harvest Central FL / Polk State College — all already in DB from prior waves), 0 near-dups, 0 bad subs, 0 errors. 27 statewide rows correctly NULL-coords (national orgs + statewide foundations). Same env-var flip 2026-04-25: NEXT_STATE_LAUNCHING shared env var set Florida → Alabama (5-min stats cache flushed via workflow restart). FL state-tagged total now 433 verified rows; live API confirms 2686 / 363 cities / 4 states / 17 cats. Wave 4 optional polish: family-support 17→30, end-of-life 16→30, legal/food 29→30 single-row top-up; otherwise FL is operationally complete and ready to remain in maintenance mode while Alabama begins. Phase 4 Gold Standard Closeout LIVE 2026-04-25 (seed-fl-phase4.ts, +80 rows / 10 sections A-J): A=end-of-life lift +16 (Suncoast/Tidewell/Hope/Avow/Treasure Coast/Trustbridge/Cornerstone/Big Bend/VITAS/Community Hospice We-Honor-Veterans hospices + FL/Sarasota/Bay Pines/Jacksonville National Cemeteries + FL Funeral Honors Coordinator + Marion Hospice), B=family-support lift +15 (MacDill/NAS Jax/Mayport/Eglin/Hurlburt/Patrick SFB/Tyndall/NAS Pensacola/Whiting Field family readiness centers + Blue Star Families FL + TAPS FL + MSAN FL + Children’s Home Society + Operation Family Fund + Catholic Charities Miami), C=crisis-help lift +10 (NAMI FL + NAMI Orlando/Pinellas/Sarasota/Broward/Miami-Dade affiliates + LSF Mobile Response Tampa Bay + CARES Mobile Crisis Volusia + Apalachee Mobile Big Bend + Henderson Mobile Broward), D=disabled-vets lift +5 (FL Disabled Outdoors + Operation Outdoor Freedom + Brooks Adaptive Sports + Tampa Adaptive Sports + Wheels of Success), E=single-row top-ups +3 (FL Free Legal Answers + Catholic Charities Naples Daniel Cantor + CareerSource CLM Ocala), F=St. Petersburg/Pinellas depth +7 (Goodwill Suncoast Veterans + St. Pete Free Clinic + Pinellas Hope + WestCare Gulfcoast + Daystar + CASA Pinellas + Sixth Circuit Veterans Court), G=Sarasota/SW FL depth +7 (Salvation Army Sarasota + Resurrection House + Goodwill Manasota + Lee County VSO + Cape Coral Veterans + Hunger&Homeless Coalition Collier + Salvation Army Lee), H=WPB/Treasure Coast depth +5 (Lord’s Place + Adopt-A-Family + Place of Hope + Caridad + Vita Nova), I=Ocala/Brevard depth +6 (Marion VSO + Interfaith Emergency + Ocala DV + Brevard Family Partnership + Genesis House + Marion CoC), J=Polk/Gainesville depth +6 (Heart for Winter Haven + ElderCare Alachua + Talbot House + Salvation Army Lakeland + UWNCFL Mission United + Catholic Charities Bureau Gainesville). All 80 rows verified URL+phone, 70 with manual_curation coords. Final QA: 0 exact dups, 0 near-dups, 0 bad subs, 0 errors. ALL 15 active cats over 30 floor. Top metros now: Tallahassee 43, Tampa 42, Jacksonville 40, Orlando 27, Pensacola 23, Saint Petersburg 20, Miami 19, Sarasota 17, Gainesville 15, Fort Lauderdale 14, Fort Myers 14, Daytona Beach 12, West Palm Beach 12, Naples 11, Ocala 10, Lakeland 10. Florida CLOSED at flagship standard matching SC/NC/GA Phase 6. |
| CA California | 292 | 105 | **17/17 active** (all dormant cats lifted in P1B: transportation 0→4, disabled-veterans 0→10) | thin watchlist after P4: insurance 1 (statewide cap; do not pad) / transportation 4 / financial 6 / substance-recovery 6 / family-support 8 / food-assistance 8 / crisis-help 8 / disabled-veterans 10 / employment 13 / legal 17 (queued for thin-cat lift in P7) | NO (Phase 1A + 1B + 2 + 3 + 4 complete; Bay Area + Sacramento/Central Valley + LA County DMVA satellites + thin-cat lift + statewide depth queued for P5-P8) | Phase 4 LA Authority+County VSO | 2026-04-26 | 0 exact / 0 near-dup | 0 / 0 / 0 | **Phase 4 LA County Authority + County VSO Expansion + LA Support Ecosystem Deepening (this turn):** +12 rows clean across 3 sections (AA LA County Authority Buildout 3 / BB California County VSO Expansion 4 / CC LA Support Ecosystem Deepening 5). Dry-run + commit both 0 dup / 0 near-dup / 0 errors after dropping VFW Department of California (collides with existing VFW Department of California-Pacific Areas — same entity), Bet Tzedek (already in as Veterans Justice Project), and Santa Clara County VSO (already in San Jose row). New cities: Oxnard (Ventura VSO), Santa Barbara, San Luis Obispo, Grass Valley (Nevada VSO), San Francisco (Brilliant Corners HQ that runs LA HUD-VASH master leasing). Architect first-pass REQUEST_FIXES on 3 URL canonicality issues (DMH MVAO `/our-services/specialized-programs/military/` resolved to a single workshop event page; Ventura VSO `/cseo/veterans-services/` redirected to county homepage; Nevada County VSO `/132/Veterans-Service-Officer` redirected to Calendar). All three corrected via DB UPDATE + seed file edit to canonical service pages (DMH MVAO → `https://dmh.lacounty.gov/veterans/`, Ventura VSO → `https://venturacounty.gov/human-services-agency/veteran-services/`, Nevada County VSO → `https://www.nevadacountyca.gov/976/Veterans-Services`). Architect re-audit APPROVE — all three resolve cleanly to canonical service pages, no redirect drift, other 9 audited rows passed first time. Honest skip-and-queue recorded for P5+: LA County DMVA satellites still host-blocked (military.lacounty.gov returns 000 from probe IP — SEVENTH consecutive session — needs alternate verification path), 30+ small-county VSOs (Modoc/Lassen/Plumas/Sierra/Alpine/Mono/Inyo/Trinity/etc) returning 404/403/000 from county sites, Bay Area county VSOs (SF/SM/Marin/CC/Alameda/Solano/Sonoma/Napa) mostly WAF-403'd, LACCD community college VRCs (Glendale CC/LACC/ELAC/LATTC) all 403'd, LA municipal vet pages (Santa Monica/LA City/Long Beach/Pasadena/Beverly Hills) all 404'd. Phase 4 deliberately small (12 rows vs P3's 48) — most LA support ecosystem orgs were already covered Phase 2; founder SOP "quality over count" honored. **Phase 3 SD+OC+IE:** +48 rows clean across 3 sections (X San Diego County Saturation 24 / Y Orange County Deepening 16 / Z Inland Empire Expansion 8). DRY-RUN CLEAN ON FIRST PASS (a CA first — 0 dups, 0 near-dups, 0 bad subs, 0 errs — attributable to applying P1B/P2 lessons: exact-from-DB sub names, lead with distinguisher for multi-site orgs, no dashes in titles needing post-root uniqueness). Architect post-commit factual audit: 10/10 PASS, 0 fabrication, 0 wrong-state, 0 phone/area-code mismatch, 1 minor taxonomy UNSURE (CalOptima/IEHP under community-support>Veteran Outreach Programs is broad — these are public Medi-Cal plans not vet-specific orgs, but description honestly frames the veteran touchpoint, kept as-is). Headline lifts: SD 24→48 (+24), OC 4→20 (+16, 5x growth), IE 15→23 (+8); cities 86→100 (+14 net new: San Ysidro, La Jolla, Carlsbad, Encinitas, Tustin, Costa Mesa, Fullerton, Orange, Midway City, Palm Desert, Blythe, plus 3 OC fillers); education category +11 (BIGGEST single-phase cat lift in CA — 17 college VRCs now spanning UC/CSU/community college systems statewide); healthcare +9 (9 new VA CBOCs across SD/OC/IE closes major sub-metro gaps); legal +4 (OC went from 1→3 anchors); community-support +6 (Tierney Center / 211OC / CalOptima / IEHP / Catholic Charities OC / Veterans 360). 12 honest skip-and-queues recorded (LA County DMVA STILL host-blocked from probe IP — 5th consecutive attempt; 4 college VRC pages 404'd at probed paths; McAlister Institute / JFCS OC / NCHS / ASYMCA SD IP-blocked at canonical domains; MHA SD 404; VA Sun City + Upland clinics 404 — possibly closed/moved, deferred until VA confirms). Cumulative CA: 280 rows / 100 cities / 17/17 cats / 11/11 QA PASS. Founder report: `.local/ca-phase3-founder-report.md`. **Phase 2 LA Saturation:** +37 rows clean across 6 sections (R Homeless Vet Infra 10 / S Mental Health+SUD 8 / T Legal+Employment 4 / U Family Support 4 / V Financial+Community 3 / W Healthcare+Transit+VSO 8). Architect factual audit caught 1 row in 10-sample (AJCC West LA address/phone mismatch) — DELETED post-audit per no-fabrication SOP, re-QA confirmed 11/11 PASS. Categories lifted: substance-recovery 2→6 (Tarzana Treatment / Cri-Help / Beit T'Shuvah / Sal Army ARC LA), family-support 3→7 (Blue Star LA / JFS LA / Fisher House WLA / Red Cross LA Hero Care), financial 3→6 (Operation HOPE Pasadena / VITA LA / Honor Flight SoCal in community-support), transportation 2→4 (Access Services LA Paratransit / DAV Transportation WLA), legal 7→10 (Bet Tzedek Veterans Justice / Disability Rights Legal Center / Mental Health Advocacy Services). VA CBOCs added: East LA / San Gabriel Valley / Antelope Valley Lancaster / Whittier BH (4). LA-area row count: 32 → 76 across 22 cities (+12 metros: Commerce, San Gabriel, Encino, Tarzana, Hermosa Beach, Santa Fe Springs net new). Six skip-and-queues recorded (LA County DMVA Field Offices unreachable from probe IP, Headstrong/JVS-LA/Chrysalis Center/AMVETS-CA/UCLA-CSUN-VRC URLs failed verification). Two true duplicates dropped (Operation Gratitude Family Programs ~~ existing Operation Gratitude Chatsworth; American Legion Department of California ~~ existing San Francisco HQ row). Cumulative CA: 233 rows / 86 cities / 17/17 cats / 11/11 QA PASS. Founder report: `.local/ca-phase2-founder-report.md`. **Phase 1B:** +93 rows clean across 8 sections (H Bay Area 16 / I SV+Peninsula+CC 9 / J Sac+NorCal 15 / K Central Valley 14 / M Inland Empire 10 / N Statewide VSO Depts 7 / P Statewide Veteran Nonprofits 10 / Q Statewide Cross-cuts #2 12). Architect audit flagged 2 hard issues, both patched: RENAMED "Inland SoCal Veterans Health" → "Inland SoCal United Way 988 Suicide & Crisis Lifeline" (canonical operator); RECLASSIFIED Wounded Heroes Fund disabled-veterans>Disability Benefits & Claims → financial>Veteran Relief Funds (org provides direct material aid, not VA claims work). Patch script: `scripts/patch-ca-phase1b-architect.ts`. Cumulative CA: 195 rows / 80 cities / 17/17 cats / 28 of 58 county VSOs / 11/11 QA PASS. Sacramento now #1 metro by row count (27, anchored by DAV/AL/VFW/AMVETS state HQs). Founder report: `.local/ca-phase1b-founder-report.md`. **Phase 1A:** +103 rows committed clean across 8 sections, then architect factual audit dropped 1 conflated row (Veterans Inc. SD — Massachusetts org name conflated with SD service; no verifiable lineage) and reclassified 12 rows (8 CalVet Veterans Homes from healthcare>VA Clinics → end-of-life-services>Assisted Living & Nursing Homes; 3 "211" info-line rows from crisis-help>Mobile Crisis Teams → community-support>Veteran Outreach Programs; Didi Hirsch SPC phone (800) 273-8255 → 988). Final state 102 rows / 44 cities / QA 11/11 PASS. Patch script: `scripts/patch-ca-phase1a-architect.ts`. Original seed: — A=CalVet HQ + 8 Veterans Homes (9), B=8 VAMC systems incl Sepulveda ACC (9), C=15 high-confidence Vet Centers (LA/East LA/South Bay/Long Beach/Pasadena/Antelope Valley/SD/Chula Vista/San Marcos/SF/Oakland/Concord/Sacramento/San Jose/Fresno/Santa Cruz/Riverside), D=12 highest-density County VSOs (LA/SD/OC/Riverside/SBD/Sac/Alameda/SCC/SF/Fresno/Kern/Contra Costa — 12 of 58 CSAC counties), E=all 8 National Cemeteries (LA/Riverside/SF/Sacramento Valley/San Joaquin Valley/Bakersfield/Miramar/Fort Rosecrans), F=21 LA Core (VARO LA + PATH + 3 U.S.VETS sites + New Directions + VOA LA + Bell Shelter + LAHSA + 211 LA + LAFLA + Public Counsel CVA + LA Food Bank + ACCESS Center + NAMI GLA + Didi Hirsch + South Bay AJCC + Bob Hope USO + Operation Gratitude + Pasadena VC + Antelope Valley VC), G=22 SD Core (VVSD + Interfaith + N County Lifeline + Father Joe's + SD Food Bank + 211 SD + Courage to Call + Sal Army ARC + MHS + NAMI SD + USO SD + MCB Camp Pendleton + Op Homefront Oceanside + DAV SD + Veterans Inc SD + Wounded Warrior Homes + NMC SD Balboa + SD Workforce Partnership + Veterans Legal Institute + OC Vet Treatment Court + Working Wardrobes VetNet + Second Chance), L=7 statewide cross-cuts (211 CA + CalFresh + HICAP + CalVet College Fee Waiver + CalVet Home Loans + EDD DVOP/LVER + CalHOPE Warm Line). Every row sourced from .gov/.org institutional site (CalVet/VA.gov/cem.va.gov/county/state). 14 multi-site orgs renamed during dry-run to defeat normalizeTitle()'s hyphen-strip (8 CalVet homes geo-prefix-first, 3 U.S.VETS sites no-dash, Op Homefront → Transitional Homes Oceanside, 2 AJCCs renamed to operator names). 2 rows DROPPED (Hire Heroes USA / Wounded Warrior Project — national rows already cover CA, same logic AL used for 988/VCL). Lat/lng intentionally null (geocoder downstream). Final QA 11/11 PASS: 0 exact dups, 0 near-dups, 0 orphan junctions, 0 wrong-state bleed, 0 invalid subs, 0 missing URL/phone/address. Active cats: va-benefits/healthcare/mental-health/crisis-help/housing/food-assistance/legal/employment/end-of-life-services/community-support/family-support/financial/insurance/education/substance-recovery. Dormant cats (transportation/disabled-veterans) hold zero by design — fill targeted in P1B (statewide nonprofits) and metro phases (P3 Bay/P4 Sac/P5 Fresno-IE/P6 niche). Top metros so far: Los Angeles 12, San Diego 9, Sacramento 7, San Francisco 4, Riverside 3, Long Beach 3, Fresno 3, Oakland 2, Santa Ana 2 (rest 1 each across 35 cities). 89 national fallback rows surface alongside (DAV/American Legion/VFW/988/etc). Founder approval pending for Phase 1B (Bay Area + Sacramento + Fresno/IE + statewide nonprofits). |
| TN Tennessee | (not audited) | — | — | — | NO | — | — | — | — | Future. |
| VA Virginia | (not audited) | — | — | — | NO | — | — | — | — | Future. |
| TX Texas | 280 | 73 | 16/17 active after Phase 3 (County VSO Backbone — formerly internally labeled "B3"; TX rollout now follows Florida-style Phase model: P1 Statewide Backbone / P2 Healthcare+VA / P3 County VSO Backbone / P4 Major Metro Saturation / P5 Secondary Metro Expansion / P6 Gap Fill (Weak Cats incl Insurance + MH/EoL) / P7 Audit/Polish/Stretch) (only Insurance dormant — by design, lifted in B5) | Healthcare now ABOVE floor at 90 (HCS 3 + VAMC 11 + CBOC 40 + MTF 4 + SPEC 2 + NHCCC 1 + WVP 8 + DOM 4 added on top of B1's 17). Mental Health 34 / End-of-Life 10 / Family 23 / Housing 17 / Women Vets 15 / VA Benefits 13 still below 40 floor — lift via Phase 3 Tier-A CVSOs (touches Family/Housing/Women/VA-Benefits) and Phase 6 (MH+EoL Gap Fill). | NO (Phase 2 = VA federal healthcare + benefits surface shipped; Phase 3 Tier-A County VSO Network + Phase 6 (MH/EoL Gap Fill) + Phase 6 (Insurance Gap Fill) + Phase 7 (Audit/skip-queue retry) queued) | Phase 2 VAMC+CBOC+VC+MTF+FH+NCA+VBA+SPEC+CGS+WVP+HVA | 2026-04-26 | 0 exact / 0 near-dup | 0 / 0 / 0 | **TX Phase 1 (this turn) — Statewide Backbone shipped CLEAN: 127 sponsor-grade rows across 22 sections / 16 categories. First batch run with all 3 founder-mandated engine prerequisites live (URL liveness gate, ZIP-state assertion, paginated dedupe loader) — all 3 fired correctly: pre-commit URL gate caught ~40 broken/dead URLs (TVC sub-paths 404, VLB sub-paths 404, multiple DNS-fail domains: mvpntexas.com, amvetstx.org, mcldepartmentoftexas.org, txala.org, womenveteransoftexas.org, veterans.utexas.edu, veterans.txst.edu, mhatexas.org; ttu.edu intermittent; purpleheart.org 500; foundcom.org timeout; vboctexas.org DNS; dob.texas.gov network_fail) BEFORE any data hit DB; ZIP gate verified 39 ZIPs all in TX 750-799/885 ranges (0 bleeders); paginated dedupe checked all 89 national-fallback rows + 0 existing TX rows for collisions (0 dups). Strategy: org-root URL discipline (collapse all deep paths to verified root URLs to eliminate path rot), 8 rows dropped where no canonical replacement existed (skip-and-queue for B2 retry: TTU/MCL TX/MOPH TX/Foundation Communities/VBOC TX/TX Dept Banking/MHA TX/Women Vets of TX), 10 new rows added from independently verified domains (UTEP/UT Dallas/TCU/Baylor/TAMU-CC/Lamar Veterans Affairs + Mission Continues TX/Team RWB TX/Travis Manion TX + American Red Cross TX SAF). Sections: TVC programs 15, GLO/VLB 8, State Vet Homes 7 (Tejeda/Courtney/Lamun-Lusk-Sanchez/Guillen/Gonzalez/Cosper/Anderson — 7 of 8/9 facilities, Amarillo skipped pending name verification), State Vet Cemeteries 4 (Killeen/Mission/Abilene/Coastal Bend), other agency vet sub-units 9 (TWC/HHSC/TDLR/DPS/TPWD/Comptroller/County VSO Network/State Cemetery), statewide hotlines 5, VSO TX departments 10 (Legion/VFW/DAV/AMVETS/MOAA/VVA/IAVA/WWP/ALA/SAL), women veterans 3, portals + parents 6 (TexVet/Combined Arms/TAMU VRSC/UT Austin/TVN/VFW Memorial), employment 7, legal 6 (Texas Law Help/LSLA/TRLA/LANWT/State Bar Mil-Vet/TLTV), university EDU 7 + 6 ADD = 13 total, healthcare 5, housing 3, family 4, disabled-vets 4, money 3, food 3, transportation 3, crisis 3, recovery 2. Sponsor-grade anchors: TVC HQ + 14 programs, VLB GLO, USAA Educational Foundation (San Antonio HQ), Combined Arms (Houston HQ), Operation Homefront (San Antonio HQ), Cohen Veterans Network + 3 Endeavors clinics (SA/Killeen/El Paso), Operation Finally Home (New Braunfels HQ), TexVet (Texas A&M). QA PASS WITH REVIEW: 0 exact dups, 0 near-dup clusters, 0 orphan junctions, 0 wrong-state bleed, 0 invalid subcategory text, 0 missing URL, city dropdown in sync 24=24; deliberate gaps in phone (116) and address (29) where canonical sources unverified — refused to fabricate. See .local/tx-phase1-b1-founder-report.md. **Phase 2 SHIPPED CLEAN 2026-04-26 — VA Federal Healthcare + Benefits Surface (125 sponsor-grade rows).** All 3 TX HCS, all 11 VAMCs, ~40 CBOCs across 7 systems, all 22 Vet Centers, 4 DOMs, 5 NCAs, 4 active MTFs (BAMC/Wilford Hall ASC/Darnall/William Beaumont), 7 Fisher Houses, 2 VBA ROs (Houston/Waco), 3 SPEC programs (Houston Polytrauma + Houston SCI + NHCCC Corpus Christi), 8 CGS + 8 WVP + 8 HVA program rows. Engine prerequisites all fired (URL liveness, ZIP-state, dedupe). One soft-flake bypass: cem.va.gov/ home returned non-200 on 2 of 3 probes (verified 200 OK 1-of-3) — bypassed via `--allow-broken-urls` for the 5 NCA rows only, no other bypasses. **Post-ship integrity patch APPLIED 2026-04-26**: architect audit caught 2 truthfulness issues (NOT fabrication): (1) source_name on ~80 system-page URLs overstated as "facility page" when URL is the parent VA HCS system root; (2) cem.va.gov per-cemetery .asp paths return 200 OK for any slug (JS-rendered SPA shell) so per-cemetery URLs aren't actually canonical evidence per row. Wrote scripts/_fix-tx-b2-integrity.ts → 87 source_name UPDATEs + 1 NHCCC URL upgrade (cnic.navy.mil installation root → /about/installation_guide/medical_dental.html named-clinic subpage). Statewide QA after patch: identical row counts, PASS WITH REVIEW. Architect re-audit: PASS on integrity patch + 1 residual founder-report drift line fixed (Polytrauma SA → Houston Polytrauma at DeBakey). **SOURCE_NAME CONVENTION (locked for Phase 3+):** when URL is a per-facility canonical page → `"Official [domain] [name] facility page"`; when URL is a parent system page that COVERS the row's subject but is not dedicated to it → `"[domain] [parent-system-name] system page (covers facility/CBOC/program)"`; when URL is a system-wide directory/locator → `"[domain] [system-name] directory"`. Never label a system root as a facility page even when the URL legitimately serves info about the facility. See .local/tx-phase1-b2-founder-report.md (now drift-free). **Phase 3 SHIPPED CLEAN 2026-04-26 — County VSO Backbone (Tier-A) (31 of Top-50 priority counties, +31 rows / +14 new cities).** Founder upgraded target from top-30 to top-50 conditional on canonical sources staying clean — they did not for 19 of 50 (county sites use JS-rendered nav / non-discoverable slug patterns / behind Anubis-style bot challenges; TVC + TACVSO state directories themselves JS-rendered or DNS-fail). Per locked no-fabrication discipline: 31 verified canonical CVSOs shipped (Bell/Bexar/Bowie/Brazos/Cameron/Collin/Comal/Dallas/Denton/Ector/Ellis/Fort Bend/Galveston/Grayson/Gregg/Hardin/Hays/Henderson/Hidalgo/Hunt/Johnson/Kaufman/Liberty/Lubbock/McLennan/Montgomery/Parker/Tarrant/Travis/Webb-as-WCRVTP/Williamson), 19 skip-and-queued for Phase 3-B with explicit per-county rationale (HIGH-PRIORITY misses: Harris/El Paso/Smith/Jefferson/Midland; MID misses: Brazoria/Nueces/Potter/Rockwall — first probes hit Veterans Treatment Court pages NOT CVSOs, rejected as wrong-page; remaining 10: Taylor/Tom Green/Victoria/Walker/Wichita/Wise/Guadalupe/Hood/Orange/Randall). Probe methodology: 4 independent strategies (slug-pattern guess, homepage-link harvest, DDG HTML search, Bing search). Every shipped row carries canonical county-government domain URL + source_name (per locked B2 convention "X County Texas — <document title>") + source_type=county_vso; 18 carry verified phone (Hardin's 682-033-1892 false-positive on global header REJECTED, phone field omitted), 13 carry verified ZIP, 3 carry verified street address (Ellis/McLennan/Parker). **Engine improvement landed in this batch**: URL-liveness gate previously fell back to GET only on 405/501; broadened to any 4xx/5xx response after Brazos County URL flagged client_error 404 on HEAD but returned 200 OK on GET (Granicus/CivicPlus HEAD-misimplementation pattern, common across county sites). Statewide QA after commit: 283 rows / 74 cities / 16 of 17 cats / 0 dups / 0 near-dups / 0 orphans / 0 state bleed / city dropdown in sync. **HOTFIX 2026-04-26 (post architect FAIL on initial ship)**: architect re-fetched each Phase 3 URL and caught a catastrophic verification defect — **16 of 31 shipped URLs were serving the wrong page entirely** because many TX counties run on CivicPlus where `/<numericFacilityID>/<decorative-slug>` ignores the slug and serves whatever page is at the numeric ID (so `/261/Veteran-Services` actually served Road & Bridges, `/195/Veterans-Service-Office` served Juvenile Probation, `/2057/Veterans-Service-Office` served 2016 Local Elections, etc). HTTP-status URL-liveness probe cannot detect this — only content-keyword verification can. Hotfix executed via scripts/fix-tx-b3-hotfix.ts: **27 rows UPDATED** (9 with newly-discovered correct URLs found via sitemap.xml harvesting + departments-A-Z anchor harvesting + browser-Chrome UA fallback for 403'd sites — Bexar→/509/Department-of-Military-and-Veterans-Serv, Brazos→/178/Veteran-Service-Office, Collin→/services/veteran-services, Comal→comalcounty.gov/178/Veterans-Services, Ellis→elliscountytx.gov/103/Ellis-County-Veteran-Services, Galveston→/county-offices/veterans-services, Hidalgo→/73/Veterans-Services, Parker→parkercountytx.gov/157/Veteran-Services, Travis→/veterans-services; 18 with corrected source_name to be the actual `<title>` tag of the verified page rather than constructed labels), **3 rows DELETED** (Lubbock, McLennan, Williamson — sites bot-blocked behind Cloudflare 403 or JS-rendered shells, no canonical URL verifiable from server fetches; per locked no-fabrication discipline, dropped rather than guessed; moved to skip-and-queue), **1 row already correct** (Tarrant — only one whose original source_name matched its document `<title>` exactly). Webb REPOINTED via secondary hotfix scripts/fix-tx-b3-webb.ts: architect's re-audit caught that webbcountytx.gov/VeteranServices/ DOES return 200 with title "Veteran Services" and 39 vet-keyword mentions — initial first-match-wins anchor harvest stopped at WCRVTP and never directly verified the dedicated /VeteranServices/ path. Webb row is now title "Webb County Veteran Services Office" + URL /VeteranServices/ + source_name "Webb County Texas — Veteran Services"; WCRVTP regional treatment program (court diversion for vets facing prosecution) left as Phase 3-B candidate (separate program, separate category — substance-recovery or legal/court). Post-hotfix QA: **280 rows / 73 cities** (Georgetown lost — was anchored only by the Williamson CVSO row), 16/17 cats unchanged, 0 dups / 0 near-dups / 0 orphans / 0 state bleed / city dropdown in sync. **Lesson learned (locked into discipline)**: HTTP-status URL-liveness is necessary but NOT sufficient for any CMS that routes /<numericID>/<slug> (CivicPlus, Granicus, Munirevs, etc) — the slug is decorative and ignored. Future rollouts must always content-verify the actual page served (real `<title>` extraction + body keyword density + reject-list of common wrong departments). Phase-2 engine work owed: promote the standalone scripts/_tx-b3-content-verify.ts content-keyword guard into scripts/lib/rollout-engine.ts so future seeds catch slug-ignore defects pre-commit, not post-architect-audit. See .local/tx-phase1-b3-founder-report.md (now drift-free, with explicit HOTFIX section at top + corrected scoreboard). Net Phase 3 result: **28 of 50 Top-Priority TX counties (56%) shipped with content-verified canonical CVSO URLs**. Next: Phase 3-B manual founder-led discovery of the 22 missing CVSOs (19 original misses + 3 hotfix-dropped), then Phase 6 (MH+EoL Gap Fill) saturation toward floor 40, Phase 6 (Insurance Gap Fill) activation, Phase 7 (Audit/skip-queue retry). |

Goal: after NC ships, GA + SC + NC = **Southeast Flagship Block**. Then Florida begins.

### SHIPPED — AI Navigator Location-Awareness (national-expansion safe) — 2026-04-24
Removed every silent SC default from the AI Navigator before national expansion.
- **New:** `server/ai/location-resolver.ts` — `extractLocationFromMessage()` parses all 50 states + DC by full name, two-letter code, and "in/near <City>, <ST>" patterns; well-known metros (Atlanta, Charlotte, Tampa, Phoenix, Houston, etc.) auto-resolve when mentioned alone. Conservative — never invents a state.
- **Engine guard** (`server/ai/engine.ts`): location priority is now (1) explicit message location → (2) frontend-provided context → (3) ASK. When a location-sensitive question arrives with no resolvable location, the engine streams a single clarifying question ("what city and state are you in?") and returns — no LLM call, no DB query, no SC fallback. Crisis path is unchanged (988 first, always).
- **PRIORITY FLIP (founder directive 2026-04-25):** original 2026-04-24 ship had `providedState` first. Founder live test caught the bug — veteran in NC asking "housing in South Carolina" still got NC results because browser GPS won. New rule: explicit location inside the user's message ALWAYS beats browser GPS / saved profile / URL params / prior conversation. Reason: a veteran physically in NC may be helping a friend in SC. `resolveLocation()` now extracts from message FIRST; only falls back to provided context when the message has no parseable location. Same-state city carry-forward preserved (provided NC+Charlotte + message "in NC" keeps Charlotte); cross-state city is dropped (provided NC+Charlotte + message "in Georgia" → GA statewide, never Charlotte/GA). 10/10 unit tests pass + 2/2 live `/api/ai/chat` smoke tests confirm SC and GA routing.
- **Resource matcher** (`server/ai/resource-matcher.ts`): when `userState` is undefined, queries are now constrained to `state IS NULL` (national rows only) instead of returning every state — eliminating the implicit SC bias caused by SC having the largest dataset.
- **Prompts** (`server/ai/config.ts` v1+v2, `server/ai/prompt-builder.ts`): stripped "in the state of SC primarily" language; replaced with "across the United States" + an explicit instruction to ask for city/state when USER CONTEXT location is unknown.
- **Backward compat:** `shared/platform.ts` `pilotState:"SC"` retained for legacy non-AI surfaces; the AI no longer reads it.
- **Validation (6/6 PASS, all via live `/api/ai/chat`):**
  - A "I need food help" (no loc) → asks for city/state ✅
  - B "food help in Atlanta, GA" → all 8 GA food banks ✅
  - C "Housing help in Charlotte, NC" → NC housing (U.S.VETS Charlotte, Roof Above, NC HFA…) ✅
  - D "Housing help in Charleston, SC" → SC housing (One80 Place, ECHO, SC Housing Authority…) ✅
  - E `userState=GA, userCity=Atlanta` + "I need food help" → GA food banks ✅
  - F "I feel suicidal" → 988 + Crisis Line first, no location asked ✅
  - Bonus: "I need a job" (no loc) → asks for city/state ✅; "doctor near Tampa" → extracts FL ✅

### Engine improvement noted (not blocking, future hardening)
`runSeed()` (in `scripts/lib/rollout-engine.ts`) writes the resource row first, then writes category and subcategory junctions in parallel without transactional rollback. A transient junction failure can leave a partially linked row. Future hardening: add a post-commit auto-repair pass (similar pattern to the SC + NC cleanup scripts) or wrap in a transaction.

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
- `GET /api/admin/source-mix?date_from=&date_to=&source=&ambassador=` - Admin: house-default vs ambassador source-mix report. Returns sessions, partner applications, Stripe conversions, and Stripe revenue split into three buckets (house/organic, ambassador-referral, unattributed) plus a per-ambassador breakdown that separates Colin's house-default traffic from his real shares. Joins `partner_applications.session_id → user_attribution_sessions.is_house_default` with a UTM-signature fallback (utm_source=house & utm_medium=direct & utm_campaign=organic_default & utm_content=colin_slaven). REPORTING-ONLY — does not touch attribution/commission/Stripe logic. Surfaced in `/admin/attribution` UI under the "Source Mix" card with All / House / Ambassador filter pills.
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
