# Veteran Care — Changelog

Reverse-chronological. Operator-mode slices only.

---

## 2026-04-18 — Upgrade #5: National Geo-Reporting Foundation

**Type:** Additive schema columns + endpoint state filter + admin UI selector + founder-digest grouping. Zero engine touched.

**Why:** SC pilot success → Georgia next. Single national platform must report ANY state cleanly without duplicating systems. Drives the "one engine, multi-state data layers" architecture in `replit.md`.

**Schema (all idempotent, NULL-only backfills, non-PK additive columns):**
- `ambassadors`: `+state TEXT`, `+city TEXT`, `idx_ambassadors_state`. Backfilled SC pilot rows from existing `region_type`/`region_value`.
- `page_views`: `+user_state TEXT`, `+user_city TEXT`, `idx_page_views_user_state`.
- `ai_usage_log`: `+user_state TEXT`, `+user_city TEXT`, `idx_ai_usage_log_user_state`.
- All wrapped in try/catch — survives table-not-yet-created envs.

**Loggers (additive optional fields, never invented):**
- `server/page-view-logger.ts` `PageViewIngest`: `+userState?`, `+userCity?` (nullable pass-through).
- `server/ai/usage-logger.ts` `logUsage`: `+userState?`, `+userCity?` (nullable pass-through).

**Endpoint — `GET /api/admin/exec-summary`:**
- New `?state=XX` filter (uppercase 2-letter US code; invalid → null = all).
- New top-level `state_filter: string | null`.
- New top-level `available_states: string[]` derived from real signals (navigator_requests, resource_clicks, paid partners) — only states with actual data appear.
- New `metrics.top_cities_30d: { city, state, clicks, help_requests, total }[]` — state-aware, never collides Charleston-SC with Charleston-WV.
- Back-compat: `metrics.top_sc_cities_30d` retained (filtered subset of new shape) so older clients keep working.

**Admin UI — `client/src/pages/admin-executive.tsx`:**
- State selector dropdown (header) populated from `available_states` + "All states".
- Top-cities card retitled to `Top {state} Cities (30d)` or `Top Cities — All States (30d)`.
- City rows show state badge when viewing All states; hidden when filter is set.

**Founder digest — `server/founder-digest.ts`:**
- `topCities7d` window expanded 5 → 12 to support multi-state breakdown.
- HTML output now grouped by state block (state header + total + top 5 cities) instead of flat mixed list — readable as more states activate.

**Validation (E2E via curl against `/api/admin/exec-summary`):**
- ✅ Unfiltered: `state_filter=null`, `available_states=["PA","SC"]`, `top_cities_30d` returns 9 rows with state per row, back-compat `top_sc_cities_30d` count=9.
- ✅ `?state=SC`: `state_filter="SC"`, paid_partners scoped to SC only.
- ✅ Schema boot: `[geo-backfill] ambassadors`, `[schema] page_views/ai_usage_log columns ensured` log lines fire idempotently.

**Protected engines untouched:** routing, billing, attribution, AI, escalation, founder-digest sender.

---

## 2026-04-18 — Upgrade #6: Master Admin Safe-Delete Toolkit

**Type:** Additive endpoints + admin-UI rebuild on one page. Zero schema. Zero engine touched.

### Why
A `DELETE` from `/admin/partner-prospects` produced a raw Postgres FK
violation. Master Admin had no controlled way to remove test/junk
companies without breaking attribution, Stripe, or converted-provider
history. Operator needed three power levels — Archive, Safe Delete,
Force Delete — each with explicit guardrails.

### What changed

**Server (`server/routes.ts`):**
- NEW `GET /api/admin/partner-applications/:id/delete-preflight`
  — read-only blocker check, returns `{ blockers, recommended_action,
  can_hard_delete }`
- NEW `POST /api/admin/partner-applications/:id/archive`
  — soft-archive (status='archived'), reversible, audit-logged
- NEW `POST /api/admin/partner-applications/:id/unarchive`
  — restore to prospect
- HARDENED `DELETE /api/admin/partner-applications/:id`
  - blocks with HTTP 409 if any FK dependency exists
  - bypass requires `?force=true&confirm_company=<exact name>`
  - cascade path deletes attribution rows first, then writes
    high-severity audit-log entry

**Client (`client/src/pages/admin-partner-prospects.tsx`):**
- "Archived" tab added to status filter row
- Action row rebuilt: **Archive** (primary) + **Delete…** (opens panel)
- "Restore from Archive" button on archived rows
- Inline delete-preview panel showing blockers + severity dots
- Force-Delete sub-panel requires typing exact company name to enable

### End-to-end validation (all PASS)
1. Preflight on FK-loaded row → 3 blockers returned, recommended:force_delete_required
2. Preflight on clean prospect → 0 blockers, can_hard_delete:true
3. Archive → status='archived'
4. Unarchive → status='prospect' restored
5. DELETE on FK-loaded row → HTTP 409 with blocker JSON
6. DELETE with force + wrong company name → HTTP 400 with expected_name

### Files
- `server/routes.ts` (+~165 LOC)
- `client/src/pages/admin-partner-prospects.tsx` (+~140 LOC)

### Protected systems
Routing · Billing · Attribution (cascade is explicit force-only) · AI ·
Escalation · Founder Digest · Stripe (no Stripe API calls in these
endpoints — operator must cancel subscriptions in Stripe dashboard
before any force-delete) · Commissions · Payouts — all UNTOUCHED.

### Deferred
- Apply same toolkit to `/admin/trusted-services` (3 incoming FKs)
- Bulk archive UI for one-shot test-row cleanup
- Audit-log viewer page

---

## 2026-04-18 — Upgrade #4: Admin Mobile Panel Polish

**Type:** UI/responsive polish only. Zero schema. Zero new endpoints. Zero engine touched.

### Why
Founder operates the platform from a phone. Daily admin work was
clipped headers, small tap targets, no safe-area padding behind the
iPhone gesture bar, and copy/paste-by-hand for every phone & email.
This slice fixes the daily friction without redesigning anything.

### What changed (4 pages)
- `/admin/executive` — sticky header, safe-area bottom padding, tighter
  mobile spacing, larger tap targets on Back/Refresh
- `/admin/trusted-service-leads` — full mobile pass: sticky header,
  Today filter chip with live count, one-tap copy buttons next to
  every email & phone, single-column mobile lead rows (no more clipping),
  larger status select, safe-area bottom padding
- `/admin/ai-insights` — safe-area bottom padding (header was already sticky)
- `/admin/resources` — safe-area bottom padding (header was already sticky)

### Files
- `client/src/pages/admin-executive.tsx`
- `client/src/pages/admin-trusted-service-leads.tsx`
- `client/src/pages/admin-ai-insights.tsx`
- `client/src/pages/admin-resources.tsx`

### Protected systems
Routing · Billing · Attribution · AI · Escalation · Founder Digest ·
Stripe · Commissions · Payouts — all UNTOUCHED.

### Validation
- Workflow restart clean, no TypeScript errors
- JSX div balance verified (18=18 in restructured file)
- Vite HMR pushed edits without console errors
- Desktop layout unchanged (additive `sm:` modifiers only;
  every mobile rule is `<sm` and falls back at the `sm:` breakpoint)

### Deferred
- Mobile polish on the other 11 admin sub-pages (apply same 4 patterns
  when each is next opened)
- One-tap copy on Executive paid-partner rows
- Floating scroll-to-top on long pages

---

## 2026-04-18 — Upgrade #3: Visitor / Traffic Beacon Metrics

**Type:** Additive feature. ONE new table. Zero existing tables touched. Zero engine touched.

### Why
"How many people are actually using this?" had no truthful answer.
GA was the only signal and the founder cannot defend partner pricing
or retention with a third-party number. Operators need first-party
visitor visibility tied directly to UTMs and ambassador codes
already captured in client storage.

### What ships
- **New table** `page_views` — pure event log, UUID PK matching the
  `ai_usage_log` pattern. RLS enabled. 5 indexes (created_at,
  session_id, utm_id, ambassador_code, path).
- **Public POST `/api/beacon/page-view`** — always 204, fire-and-
  forget, never blocks. Server-side User-Agent mobile detection
  fallback. All fields length-clamped.
- **Server ingest** uses pg-direct (matches the project's existing
  event-table pattern for `trusted_service_categories`) with
  in-memory rate limit (max 1 write / 750ms / session).
- **Client beacon** wired into existing `trackPageView()`. Reuses
  the existing UTM session cache and reads ambassador_code from
  local/session storage. Uses `navigator.sendBeacon` with fetch
  keepalive fallback. Same dedup as GA — no double counting.
- **Executive Summary** gets a new traffic KPI row (Visitors Today
  / Mobile Share % / UTM-Tagged Views / Stuck Leads) and a Top
  Landing Paths (7d) panel. The "instrumentation pending" warning
  for daily_visitors and device_split auto-clears once data starts
  flowing.

### What it tracks
- Visitors today / 7d / 30d (DISTINCT session_id)
- Total page views 30d
- Mobile share % (30d)
- UTM-tagged page views (any of utm_id / utm_source / utm_campaign)
- Ambassador-attributed page views
- Top 10 landing paths (7d)
- Stuck leads tile mirrored from digest (over 24h / 72h)

### Configuration
- No env vars required. Beacon is silently disabled if `page_views`
  table doesn't exist.

### Files
- `supabase/create_page_views.sql` (NEW)
- `server/page-view-logger.ts` (NEW)
- `server/routes.ts` (+~50 LOC)
- `client/src/lib/analytics.ts` (+~50 LOC)
- `client/src/pages/admin-executive.tsx` (+~80 LOC)

### Safety
- Pure additive — never writes to any existing table
- Endpoint always returns 204 even on bad input
- Rate limit prevents accidental client-side loops
- Soft table-detect: missing table = silent no-op + exec-summary
  shows "—" tiles + "instrumentation pending" warning
- pg-direct path bypasses PostgREST schema cache lag entirely

### Validation
- 3 sample beacons → all HTTP 204 → all 3 rows landed
- Exec-summary returned traffic.enabled=true with correct counts
  (visitors=3, mobile=100%, UTM=3, ambassador=3, top=/get-help)
- Smoke rows cleaned up after validation
- Workflow boots clean

### Standing Status After Ship
- SC pilot live; outcome capture wired (Upgrade #1)
- Daily founder digest wired, 8 AM ET (Upgrade #2)
- First-party visitor / traffic visibility now live (Upgrade #3)
- 2 paid routable partners
- Awaiting approval to ship Upgrade #4 (Admin Mobile Panel Polish)

---

Reverse-chronological. Operator-mode slices only.

---

## 2026-04-18 — Upgrade #2: Founder Daily Command Center Email

**Type:** Additive feature. Zero schema change. Zero engine touched.

### Why
Founder visibility decays as platform scales. Manually opening the
admin dashboard daily is feasible at SC scale; by Georgia/state #3
the volume triples and human attention won't. A single 8 AM ET email
turns yesterday's signal into proactive ownership behavior.

### What ships
- **New module** `server/founder-digest.ts` — assemble + build + send.
  Pure read aggregations from `navigator_requests`,
  `partner_applications`, `ai_usage_log`. No writes anywhere.
- **Daily 8 AM ET timer** — registered alongside the escalation
  timer. Once-per-day dedup. Failed sends auto-retry on next tick.
- **Admin test endpoint** `POST /api/admin/founder-digest/send-now`
  (admin-key gated) for on-demand testing.
- **Kill switch** `FOUNDER_DIGEST_DISABLED=1` (instant, no deploy).

### What the digest contains
Alerts (red/amber) → Yesterday KPIs (leads, billed, AI, outcomes)
→ 7-Day Lead Trend (visual bar) → Stuck Leads (>24h, >72h, sample)
→ Payments rollup (failed, hold, pending unbilled $) → Partner
Applications (new + awaiting review) → Top Categories (7d) → Top
Cities (7d) → Conversion Outcomes (7d, captures Upgrade #1 data).
Mobile readable (560px max), real data only, no fluff.

### Subject line
Auto-generated: `<platform> Daily — N leads · $X billed · Y red alerts`

### Configuration
- `FOUNDER_DIGEST_TO` — comma-separated recipients (default:
  `info@veterancare.com`)
- `FOUNDER_DIGEST_DISABLED=1` — kill switch
- Reuses `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

### Files
- `server/founder-digest.ts` (NEW, ~370 LOC)
- `server/routes.ts` (+8 LOC: import, timer start, admin endpoint)

### Safety
- Pure read — never writes to any table
- Kill switch is checked on every tick AND inside sendFounderDigest
- Fail-soft: assembly/AI errors do not crash the timer
- Dedup prevents accidental duplicate sends on the same day
- Smoke-tested end-to-end (assembly + HTML) against live Supabase

### Standing Status After Ship
- SC pilot live; outcome capture wired (Upgrade #1)
- Daily founder digest wired, 8 AM ET (Upgrade #2)
- 2 paid routable partners
- Awaiting approval to ship Upgrade #3 (Visitor / Traffic Beacon)

---

## 2026-04-18 — Upgrade #1: Partner Outcome Capture Loop

**Type:** Additive feature. Zero schema change. Zero engine touched.

### Why
Conversion rate displayed 0% across Executive Summary because
`navigator_requests.partner_outcome` was rarely written. Without
outcome data we cannot defend per-lead pricing in renewal
conversations or detect partner churn risk.

### What shipped
- **Partner-side capture (email):** Each routed lead notification now
  contains three tokenized buttons in a "Final Outcome" panel —
  Won / Lost / No Contact. Partner clicks, lands on a confirmation
  page, submits, outcome is recorded.
- **Admin-side capture (panel):** Each routed lead row in the Support
  Requests tab shows a Conversion Outcome panel with the same three
  buttons + Clear. Lets admins record outcomes captured by phone.

### Endpoints added (public, HMAC-token-gated)
- `GET  /api/partner/lead-outcome?token=...`
- `POST /api/partner/lead-outcome`

### Files
- `server/lead-email.ts` — outcome token helpers + email button block
- `server/routes.ts` — public outcome endpoints + confirmation page
- `client/src/pages/admin-resources.tsx` — admin row outcome panel

### Safety
- Distinct token namespace (`outcome:`) prevents collision with
  existing lead-action tokens
- Idempotent: same-outcome re-click returns "Already Recorded"
- 7-day token expiry, HMAC-signed with ADMIN_KEY
