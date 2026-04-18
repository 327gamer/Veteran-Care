# Veteran Care — Changelog

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
