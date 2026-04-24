# Florida — Execution Plan (4-Phase Rollout)

This is the ready-to-execute Phase 1 / 2 / 3 / 4 plan for Florida. It mirrors
the locked SC, NC, and Georgia (flagship) rollouts. **Do not start until
founder gives the go-light** — at that point follow `replit.md → State
Rollout SOP` step-by-step.

**Florida is not complete until Phase 4 (Gold Standard Completion) is finished
or intentionally deferred — same rule as Georgia.**

---

## Targets

- **Final FL row count target:** 400+ approved rows
- **Cities target:** 35+ distinct cities
- **Categories active:** all 17 categories must have ≥ 1 row; healthcare,
  housing, employment, food, legal, crisis, family-support each ≥ 12 rows
- **Verified URL + phone:** every row, no exceptions

---

## Phase 1 — Major metros  (~100 rows, target script: `seed-fl-phase1.ts`)

Population-anchored top 4 metros + statewide anchors.

| Section | City | Rows | Notes |
|---|---|---|---|
| JAX | Jacksonville | 25 | Naval Air Station Jacksonville + NAS Mayport corridor; Duval VA Clinic, JAXHA HUD-VASH, Three Rivers Legal Services |
| MIA | Miami | 25 | Miami VA Healthcare System; Camillus House (housing); Lotus House (women); Miami-Dade Homeless Trust |
| TPA | Tampa | 25 | James A. Haley Veterans' Hospital; MacDill AFB community partners; Metropolitan Ministries |
| ORL | Orlando | 20 | Orlando VA Medical Center; Coalition for the Homeless of Central Florida; Orlando Vet Center |
| STW | Statewide | 5 | Florida Department of Veterans' Affairs (FDVA); Florida Veterans Crisis Line; FDVA County VSO directory; FloridaCommerce VR; Florida Bar Lawyer Referral |

Section codes: `JAX MIA TPA ORL STW`.

---

## Phase 2 — Secondary cities + statewide programs  (~150 rows, target script: `seed-fl-phase2.ts`)

| Section | City | Rows |
|---|---|---|
| FTL | Fort Lauderdale (Broward) | 16 |
| STP | St. Petersburg | 16 |
| TAL | Tallahassee | 16 |
| HIA | Hialeah / Doral | 12 |
| HOL | Hollywood | 10 |
| PSL | Port St. Lucie | 10 |
| CAP | Cape Coral | 10 |
| PEM | Pembroke Pines | 10 |
| GNV | Gainesville (Malcom Randall VA) | 12 |
| OCA | Ocala | 10 |
| LAK | Lakeland | 10 |
| SAR | Sarasota | 10 |
| STW | Additional statewide programs (FL211 regional, FDOT veterans' transit, Habitat FL, FL Bar Pro Bono Veterans, AMVETS FL, AL FL Posts directory) | 8 |

Section codes: `FTL STP TAL HIA HOL PSL CAP PEM GNV OCA LAK SAR STW`.

---

## Phase 3 — Small towns + rural / panhandle / keys  (~100–150 rows, target script: `seed-fl-phase3.ts` + optional `seed-fl-phase3b-topup.ts`)

| Section | City / Region | Rows |
|---|---|---|
| PNS | Pensacola (NAS Pensacola) | 12 |
| PCB | Panama City (Tyndall AFB) | 10 |
| NAP | Naples / Bonita Springs | 10 |
| FMY | Fort Myers (incl. Lehigh Acres) | 10 |
| DAB | Daytona Beach | 10 |
| MEL | Melbourne / Palm Bay (Patrick SFB) | 10 |
| KWS | Key West (NAS Key West) | 6 |
| CRY | Crystal River / Citrus County | 6 |
| HOM | Homosassa / The Villages / Sumter | 8 |
| OKC | Okeechobee / Glades / Hendry rural | 6 |
| QUI | Quincy / Madison / Suwannee panhandle rural | 8 |
| LEG | American Legion Posts in priority cities | 8 |
| CBO | Outlying VA CBOCs (Lecanto, Brooksville, Ocala North, Stuart, etc.) | 6 |
| STW | Statewide top-up | 4 |

Section codes: `PNS PCB NAP FMY DAB MEL KWS CRY HOM OKC QUI LEG CBO STW`.

---

## Sub-name watchlist for Florida (run probe-taxonomy.ts to confirm)

These are the subcategory names the Georgia rollout had to fix — **expect the
same drift in Florida**:

- **education** GI Bill rows → `Veteran Student Services` (NOT "GI Bill" or "VA Education")
- **family-support** outreach → `Military Family Support` (NOT "Outreach")
- **community-support** senior centers → `Senior Veteran Services`
- **disabled-veterans** WWP / Healing4Heroes → `Mental Health & PTSD Support`
- **disabled-veterans** GVRA-equivalent (FL: Vocational Rehab in FloridaCommerce) → `Employment & Vocational Rehabilitation`
- **disabled-veterans** DAV chapters → `Disability Benefits & Claims`
- **disabled-veterans** Operation Stand Down equivalents → `Independent Living & Daily Support`
- **healthcare** VA outpatient clinics → `VA Clinics` (NOT "Outpatient Care")
- **healthcare** medical centers → `VA Medical Centers`
- **legal** clinic-style → `Veterans Legal Clinics`
- **legal** pro bono → `Pro Bono Legal Services`
- **transportation** county rides → `Public Transit Assistance`

---

## Near-duplicate watchlist (Florida-specific)

When seeding VA CBOCs in Phase 3, **check for existing entries first** with
shorter titles — the GA rollout flagged this (e.g. "Macon VA Clinic" already
existed under a short title and the topup tried to add "Macon VA Clinic — Carl
Vinson VA"). For Florida, watch these likely shorter pre-existing titles:

- "Jacksonville VA Clinic"
- "Miami VA Medical Center"
- "Tampa VA Medical Center" (or "James A. Haley")
- "Orlando VA Medical Center"
- "Bay Pines VA Medical Center"
- "Florida Veterans Crisis Line"

The engine's normalized-title dedupe will catch most of these and skip them
with `near_dup` count > 0 — **always read the near-dup output and rename or
drop those rows before re-running**.

---

## Florida-specific QA bonus

After Phase 3 commits and `qa-state.ts --state=FL` reports PASS, run a
**hurricane-corridor coverage check**: confirm at least 1 housing + 1 food + 1
crisis row in each of (Naples, Fort Myers, Cape Coral, Panama City, Pensacola,
Key West) — these are the highest-frequency disaster-displacement zones for
Florida veterans.

---

## Phase 4 — Gold Standard Completion  (~80-150 rows, target script: `seed-fl-phase4.ts`)

After Phases 1-3 land Florida around 350+ rows, Phase 4 polishes to flagship
quality. Mirror the Georgia Phase 4 sectioning:

| Section | Focus | Rows |
|---|---|---|
| GAP-NW | Northwest panhandle gaps (Crestview, Niceville, DeFuniak Springs, Marianna) | 8 |
| GAP-NE | NE Florida gaps (Lake City, Live Oak, Macclenny, Palatka) | 8 |
| GAP-SW | Treasure Coast / SW gaps (Stuart, Vero Beach, Punta Gorda, Arcadia) | 8 |
| GAP-CFL | Central FL inland gaps (Lakeland West, Bartow, Sebring, Lake Wales) | 8 |
| MHE | Mental Health deepening (NAMI FL chapters, regional behavioral health, Centerstone, David Lawrence Center) | 8 |
| INS | Insurance deepening (SHINE Florida regional sites, USAA Florida, AAFMAA) | 8 |
| BEN | Benefits orgs (VFW Dept of FL, AMVETS Dept of FL, MOPH Dept of FL, MOAA chapters, VVA chapters) | 10 |
| FIN | Financial (Operation Homefront FL, USA Cares FL, Habitat ReStores, regional CAAs) | 6 |
| DIS | Disabled veterans (PVA FL chapters, BVA FL, FL Adaptive Sports, CILs) | 8 |
| TRA | Transportation (regional 5311 rural transit councils, Volunteer Driver Programs, county senior transit) | 8 |

Section codes: `GAP-NW GAP-NE GAP-SW GAP-CFL MHE INS BEN FIN DIS TRA`.

After Phase 4 commits and `qa-state.ts` passes, run a **monetization
readiness scan**: identify which categories have ≥ 20 rows in ≥ 5 cities
(Trusted Partner candidates) and which weak categories have < 10 rows
(underserved demand zones). Document in the founder report.

---

## Execution order

1. Founder gives FL go-ahead.
2. `tsx scripts/lib/probe-taxonomy.ts` — record current FL subcategory names.
3. Snapshot baseline: `tsx scripts/qa-state.ts --state=FL` (likely 0 rows).
4. Build `scripts/seed-fl-phase1.ts` from `seed-state.template.ts`.
5. Dry-run → review near-dup output → fix → `--commit`.
6. `qa-state.ts --state=FL`. Must show PASS or PASS WITH REVIEW before continuing.
7. `founder-report.ts --state=FL --baseline=0 --priority="Jacksonville,Miami,Tampa,Orlando"`.
8. Founder sign-off.
9. Repeat steps 4-8 for Phase 2.
10. Repeat steps 4-8 for Phase 3 + optional 3b top-up.
11. Repeat steps 4-8 for Phase 4 (Gold Standard Completion).
12. Final FL report (post Phase 4). Move to next state (Tennessee).
