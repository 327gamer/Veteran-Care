# Veteran Care — Changelog

Reverse-chronological. Operator-mode slices only.

---

## 2026-04-18 — Upgrade #1: Partner Outcome Capture Loop

**Type:** Additive feature. Zero schema change. Zero engine touched.

### Why
Conversion rate displayed 0% across Executive Summary because
`navigator_requests.partner_outcome` was rarely written. Without
outcome data we cannot defend per-lead pricing in renewal
conversations or detect partner churn risk.

### What ships
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

### Admin endpoint reused
- `PATCH /api/admin/navigator-requests/:id` already accepted
  `partner_outcome`. No new admin endpoint needed.

### Files
- `server/lead-email.ts` — outcome token helpers + email button block
- `server/routes.ts` — public outcome endpoints + confirmation page
- `client/src/pages/admin-resources.tsx` — admin row outcome panel

### Safety
- Distinct token namespace (`outcome:`) prevents collision with
  existing lead-action tokens
- Idempotent: same-outcome re-click returns "Already Recorded"
- 7-day token expiry (matches existing convention)
- Logs previous + new value on every change

### Downstream unlocks
- Executive Summary conversion rate becomes meaningful
- Per-partner close-rate calculable
- Partner-churn-risk indicator becomes possible (consecutive Lost)
- Honest pricing math defensible in renewal conversations

### Standing Status After Ship
- SC pilot live; outcome capture wired end-to-end
- 2 paid routable partners will receive new email format on next lead
- Awaiting approval to ship Upgrade #2 (Founder Daily Command Center
  Email)
