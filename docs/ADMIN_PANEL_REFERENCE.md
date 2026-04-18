# Veteran Care — Admin Panel Reference

**Audience:** internal development team onboarding to the Veteran Care platform.
**Last reviewed:** April 2026 — SC pilot live, Georgia prep next.

This document maps every page, endpoint, and workflow inside the admin panel
(`/admin/*`) so a new engineer can navigate the codebase without guessing.

---

## 1. Authentication

The admin panel uses a single shared **secret key**, not user accounts.

| Concern | Implementation |
|---|---|
| Server middleware | `requireAdmin` in `server/routes.ts` (~L2701). Compares `x-admin-key` header against `process.env.ADMIN_KEY`. Returns `401 { error: "Unauthorized" }` on mismatch. |
| Client guard | `client/src/components/admin-auth-guard.tsx`. Wraps every admin page. Prompts for the key, stores it in `localStorage.adminKey`. |
| Header sent on every admin request | `x-admin-key: <ADMIN_KEY>` |
| Sign out | Clears `localStorage.adminKey` and re-renders the guard. |

There is no role hierarchy yet. Every admin has full access. If multi-role is
needed (e.g., partner-only review), it must be added on top of this layer.

---

## 2. Layout & Navigation Pattern

The admin panel does **not** use a global sidebar. Each admin page renders its
own header. The hub (`/admin`) acts as the launchpad and contains a top nav with
three dropdowns:

```
Header (sticky, primary green):
  [Shield] Admin                     [Analytics ▾] [Ambassadors ▾] [Partners ▾] [Sign Out]
```

| Dropdown | Items |
|---|---|
| **Analytics** | Dashboard (`/admin/analytics`), Attribution (`/admin/attribution`), AI Insights (`/admin/ai-insights`) |
| **Ambassadors** | Manage Ambassadors (`/admin/ambassadors`), Link Management (`/admin/links`), Commissions (`/admin/commissions`), Payouts (`/admin/payouts`) |
| **Partners** | Partner Prospects (`/admin/partner-prospects`), Trusted Services (`/admin/trusted-services`), Trusted Partner Leads (`/admin/trusted-service-leads`), Veteran-Owned Business (`/admin/vob`), Sweepstakes (`/admin/sweepstakes`) |

Note: the **Executive Summary** dashboard (`/admin/executive`) is a newer
read-only daily ownership view. It can be linked from anywhere; today it's
reachable by typing the URL.

### Mobile responsive rules (universal)

Every admin page must follow these to render correctly on phones:

1. Outer wrapper: `<div className="min-h-screen bg-background overflow-x-hidden">`
2. Long header titles use `truncate` with a shorter `<span className="sm:hidden">` variant
3. Header buttons collapse to icon-only on small screens (`<span className="hidden sm:inline">Label</span>`)
4. Multi-tab strips use `overflow-x-auto flex-nowrap -mx-4 px-4` so they scroll horizontally on phones instead of overflowing the viewport
5. Tables inside cards always wrap in `<div className="overflow-x-auto">`

---

## 3. Page-by-Page Reference

### 3.1 `/admin` — Resource Hub (`admin-resources.tsx`)

**Purpose:** the operations command center. Five tabs in one page.

| Tab | What it does |
|---|---|
| **Resources** | Approve / reject / edit submitted resources. Status filter pills (Pending / Approved / Rejected). CSV import + export. "Geocode Missing" batch-runs Google Maps geocoding on resources without lat/lng. Free-text search and state/category filters. |
| **Support Requests** | Inbox of veteran-submitted help requests (table `navigator_requests`). Status filter (new / in_progress / resolved / cancelled / archived). Manual reassignment to partners. Bulk archive. Per-row outcome notes. |
| **Routing Partners** | Inventory of partner organizations and their per-category routing rules. Add Partner. Each row exposes "Rules" — the categories/subcategories this partner accepts plus daily/weekly caps. Active and lead-enabled toggles. |
| **Trusted Partner Applications** | Pipeline of applicants from the public partner-onboarding form. Approve, generate Stripe checkout, convert to Trusted Service. |
| **Billing** | Billable lead queue. Ops summary panel: New 24h, Pending, Ready, Failed, Hold, Disputed, Review. Daily Workflow Checklist. Charge / dispute / hold actions. |

**API endpoints used (selection):**
- `GET POST PATCH DELETE /api/admin/resources`
- `POST /api/admin/resources/geocode-missing`
- `POST /api/admin/resources/import-csv`
- `GET PATCH DELETE /api/admin/navigator-requests`
- `POST /api/admin/navigator-requests/bulk-archive`
- `POST /api/admin/leads/:id/reroute`
- `GET POST PATCH /api/admin/partners` and `/api/admin/partners/:id/routing-rules`
- `GET PATCH /api/admin/partner-applications`
- `POST /api/admin/partner-applications/:id/approve`
- `POST /api/admin/partner-applications/:id/convert`
- `GET /api/admin/billing-summary`
- `POST /api/admin/billing/charge/:leadId`

---

### 3.2 `/admin/analytics` — Engagement Dashboard (`admin-analytics.tsx`)

**Purpose:** click-level engagement and lifetime numbers.

Shows: total approved resources, pending resources, reported resources,
total clicks, affiliate vs non-affiliate clicks, click-type breakdown,
clicks by category, by state, by city (top 20), top 20 resources, navigator
request stats by status / category / state, and a financial snapshot from
the dashboard-summary endpoint (ambassadors, links, commissions, payouts,
sessions, revenue).

**Endpoints:**
- `GET /api/admin/analytics`
- `GET /api/admin/dashboard-summary`

---

### 3.3 `/admin/executive` — Executive Summary (`admin-executive.tsx`)

**Purpose:** single-screen daily ownership view; the URL leadership bookmarks.

Mobile-first KPI tiles (today / 7d / 30d) for AI chats, help requests,
partner leads routed, and billed revenue. Below that: top AI categories,
top clicked categories, top SC cities (clicks + help-request signals),
help-request pipeline, active paid partners, and AI engagement detail.

Honest **"Instrumentation Pending"** card lists metrics we cannot show yet:
- daily visitors (no page-view tracking)
- mobile vs desktop split (no user-agent capture)
- bounce rate (no page-view + session-exit tracking)

**Endpoint:** `GET /api/admin/exec-summary` — admin-key gated, reads
`ai_usage_log`, `navigator_requests`, `resource_clicks`,
`partner_organizations`, `resources` only. Returns a windowed rollup +
explicit `unmeasured[]` array.

---

### 3.4 `/admin/ai-insights` — AI Health Dashboard (`admin-ai-insights.tsx`)

**Purpose:** monitor AI Guide cost, safety, and category coverage.

Shows: total conversations (guest vs auth), top detected categories, crisis-help
trigger count, blocked-content count, fallback model count (when GPT was down),
safety-filter count, navigator-suggested count (how often the human-help hook
fires), token usage (input + output + total), estimated cost using current
GPT-4o-mini pricing ($0.15/M input, $0.60/M output), and resource gap indicators
where AI sees demand but the directory is thin.

**Endpoint:** `GET /api/admin/ai-insights`

---

### 3.5 `/admin/trusted-services` — Trusted Services Directory (`admin-trusted-services.tsx`)

**Purpose:** manage vetted, paid trusted partners (different pool from the
"Routing Partners" inventory on `/admin`).

Add / edit / feature / deactivate. Each entry has: business profile, contact
methods, listing type (Discount or Lead), featured rank, verification status,
visible state, and category/subcategory tags.

**Endpoints:**
- `GET POST PATCH /api/admin/trusted-services`
- `GET /api/admin/trusted-services/categories`

---

### 3.6 `/admin/trusted-service-leads` — Trusted Partner Inbox (`admin-trusted-service-leads.tsx`)

**Purpose:** dedicated inbox for inquiries sent to Trusted Partners.

Status workflow: New → Contacted → Closed. Quick mailto / tel links.

**Endpoints:**
- `GET PATCH /api/admin/trusted-service-leads`

---

### 3.7 `/admin/seeded-providers` — National Seeded Directory (`admin-seeded-providers.tsx`)

**Purpose:** national/federal providers that are display-only and **never**
eligible for paid lead routing or billing (NPRC, VA national lines, etc.).

Add / edit / set visibility / delete. Hard-blocked at the database layer by
the `seeded_cannot_be_active_paid` and `seeded_cannot_be_lead_enabled`
CHECK constraints on `partner_organizations` (Supabase). Any attempt to flip
these flags on a seeded record is rejected by Postgres itself — confirmed
live during pre-launch validation.

**Endpoints:**
- `GET POST PATCH DELETE /api/admin/seeded-providers`
- `PATCH /api/admin/seeded-providers/:id/visibility`

---

### 3.8 `/admin/partner-prospects` — Partner Application Pipeline (`admin-partner-prospects.tsx`)

**Purpose:** inbound applications from organizations wanting to become Trusted
Partners or Routing Partners.

Status workflow: prospect → reviewed → approved → paid → converted. Approval
generates a Stripe checkout link emailed to the applicant. "Convert" promotes
a paid application into a live Trusted Service entry.

**Endpoints:**
- `GET PATCH /api/admin/partner-applications`
- `POST /api/admin/partner-applications/:id/approve`
- `POST /api/admin/partner-applications/:id/convert`

---

### 3.9 `/admin/vob` — Veteran-Owned Business Directory (`admin-vob.tsx`)

**Purpose:** moderation queue for the public Veteran-Owned Business directory.

Verify ownership claim, approve/reject, optionally cross-promote to Trusted
Services with a "Show in Trusted Services" toggle, assign verification badges.

**Endpoints:**
- `GET PATCH /api/admin/vob`

---

### 3.10 `/admin/ambassadors` — Ambassador Program Hub (`admin-ambassadors.tsx`)

**Purpose:** manage the human ambassadors who drive referral traffic and earn
commission.

Create ambassadors (auto-generates UTM code, QR codes, and a Campaign Pack of
marketing assets). Manage regional assignments. Bulk asset export.

**Endpoints:**
- `GET POST /api/admin/ambassadors`
- `GET /api/admin/ambassador-links/generate` (link generator)
- `GET /api/admin/ambassador-distribution/:code` (per-ambassador pack)

---

### 3.11 `/admin/links` — Tracking Link Inventory (`admin-links.tsx`)

**Purpose:** every UTM tracking link in the system. Per-link click counts,
toggle active/inactive, generate authenticated QR.

**Endpoints:**
- `GET /api/admin/ambassador-links`
- `PUT /api/admin/ambassador-links/:id/toggle`
- `GET /api/admin/ambassador-links/:id/qr`

---

### 3.12 `/admin/attribution` — Conversion Funnel (`admin-attribution.tsx`)

**Purpose:** how clicks become sessions become leads.

Shows: total sessions, attributed sessions, conversion timing buckets
(< 5 min, 5-30 min, 30 min - 2h, 2-24h, > 24h), and per-ambassador funnel
performance.

**Endpoint:** `GET /api/admin/attribution`

---

### 3.13 `/admin/commissions` — Commission Ledger (`admin-commissions.tsx`)

**Purpose:** financial ledger of ambassador earnings.

Each commission row: ambassador, lead/event source, amount, status (Pending /
Approved / Paid / Voided), aging badge (New / Review / Stale). Approve in
bulk. Group by ambassador. Filter by status.

**Endpoints:**
- `GET /api/admin/commissions`
- `PATCH /api/admin/commissions/:id/status`

---

### 3.14 `/admin/payouts` — Payout Batches (`admin-payouts.tsx`)

**Purpose:** batch approved commissions into actual paid disbursements.

Create payout batch (period start/end). Attach approved commissions. Mark as
Paid (locks the batch — no further edits). Records payment method and
external reference. Detach commissions from a batch before it's paid.

**Endpoints:**
- `GET POST /api/admin/payouts`
- `PATCH /api/admin/payouts/:id/status`
- `POST DELETE /api/admin/payouts/:id/commissions[/:commId]`

---

### 3.15 `/admin/sweepstakes` — Referral Giveaway (`admin-sweepstakes.tsx`)

**Purpose:** monthly referral sweepstakes.

Configure prize for the current month. View entry pool (one entry per
qualifying referral). Random winner draw, weighted by entry count. Email
winner notification. View past draws.

**Endpoints:**
- `GET /api/admin/sweepstakes/current`
- `POST /api/admin/sweepstakes/draw`
- `POST /api/admin/sweepstakes/notify-winner/:id`
- `PUT /api/admin/sweepstakes/prize`

---

## 4. Data Model — How the Admin Panel Touches the Database

### 4.1 Two-database architecture

The platform runs against **two databases** simultaneously:

| DB | Role | Common tables |
|---|---|---|
| **Supabase Postgres** | identity, auth, all billable + lead-routing flows | `users`, `partner_organizations`, `navigator_requests`, `ai_usage_log`, `resource_clicks`, `lead_billing_records` |
| **Drizzle Postgres** (Replit DB) | display data — public resources, categories, ambassador attribution graph | `resources`, `resource_categories`, `categories`, `ambassador_links`, `commissions`, `payouts` |

Some entities are **dual-written** — for example the F2.5 sync writes a
"SEEDED|supabase_org_id=…" tag in `notes_internal` on the Supabase side so
display rows on the pg side can be linked back to their canonical source.

This split is intentional but should be consolidated **before** scaling to
Georgia (state #3). The dev team should plan a migration path that picks one
canonical store per entity.

### 4.2 Hard-coded protections at the DB layer

Two CHECK constraints on Supabase `partner_organizations` cannot be
overridden from any admin endpoint, including direct SQL via the admin
console:

- `seeded_cannot_be_active_paid` — a row with `seeded = true` cannot also have `active_paid_partner = true`
- `seeded_cannot_be_lead_enabled` — a row with `seeded = true` cannot also have `is_lead_enabled = true`

This is the safety net that prevents accidentally billing or routing a
national display-only provider. **Both constraints are confirmed firing in
production.** Do not remove them.

---

## 5. AI Guide Backend (touched indirectly by `/admin/ai-insights`)

- Engine code: `server/ai/engine.ts`
- SSE stream events the client receives:
  1. `resources` — provider list to show inline
  2. `done` — `{ categories, navigatorSuggested, isEscalation, resourceCount }`
- The "human help" hook is delivered via the `navigatorSuggested` boolean
  on the `done` event — there is **no** separate `hook` event
- Every chat is logged to `ai_usage_log` with detected category, token
  counts, model used, and whether the navigator hook fired
- Crisis detection routes to `crisis-help` category and surfaces VA hotline
  resources; admin sees the volume on `/admin/ai-insights`

---

## 6. Money Flow End-to-End

```
1. Veteran clicks AI hook or category link with ?utm=AMBxxx
   → ambassador_link recorded (Drizzle)
2. Veteran submits help request
   → navigator_requests row created (Supabase),
     ambassador_id stamped from session UTM
3. Routing engine picks an active_paid_partner in scope
   → routed_to_partner_id set, email sent to partner,
     billing_workflow_status = "ready"
4. Admin charges the lead from /admin Billing tab
   → Stripe payment intent created, billed = true,
     billing_amount + billed_at captured
5. Commission row created on Drizzle side
   → /admin/commissions reviews and approves
6. Approved commissions added to a payout batch
   → /admin/payouts marks batch Paid, locking the batch
```

Current paid partners (SC pilot): Tri-County Veteran Support Network
(Charleston area), Boot Print (Greenville area). Only these two are
routable today.

---

## 7. Operational Defaults the Dev Team Should Know

| Concern | Current default |
|---|---|
| Admin auth | Single shared `ADMIN_KEY` env secret |
| Rate-limit on public submit endpoints | 5 submits / IP / hour |
| Exec summary refresh interval | 60s on the client; 5k row cap on the endpoint |
| AI model | `gpt-4o-mini` (fallback path uses a local responder when API fails) |
| Stripe | live, used for partner subscription billing and lead-charge events |
| Email | Resend (`RESEND_API_KEY`) for partner notifications + ambassador winner notices |
| Geocoding | Google Maps; manual "Geocode Missing" button on `/admin` Resources tab |

---

## 8. Known Gaps / Deferred Work (so nobody re-promises these)

1. **Visitor analytics** — no page-view tracking yet. AI chat count is the
   closest proxy. Adding a lightweight beacon → `page_views` table is the
   next instrumentation slice.
2. **Device split + bounce rate** — same root cause; needs the page-view
   beacon.
3. **Partner outcome capture** — the `partner_outcome` field on
   `navigator_requests` is never written, so lead-conversion rate on
   `/admin/executive` shows 0%. Add an admin form (or partner self-serve
   token link) to flip this.
4. **Two-DB consolidation** — pick canonical store per entity before
   Georgia (state #3) launch.
5. **Six non-insurance resources without subcategory link** — small data
   cleanup left over from the F2.6 / B1 work.
6. **27 inactive `pg.trusted_service_categories` scaffolding rows** — leave
   for future trusted-services UI work.
7. **Ambassador rollout** — infrastructure is built; recruitment/launch is
   a business decision, not a code task.
8. **`converted_from_seeded_id` column** — would close the loop between a
   seeded national provider and the paid partner that eventually
   replaces it locally.

---

## 9. Files Map (where things live)

### Pages
```
client/src/pages/admin-resources.tsx           # /admin (hub)
client/src/pages/admin-analytics.tsx           # /admin/analytics
client/src/pages/admin-executive.tsx           # /admin/executive
client/src/pages/admin-ai-insights.tsx         # /admin/ai-insights
client/src/pages/admin-trusted-services.tsx    # /admin/trusted-services
client/src/pages/admin-trusted-service-leads.tsx
client/src/pages/admin-seeded-providers.tsx
client/src/pages/admin-partner-prospects.tsx
client/src/pages/admin-vob.tsx
client/src/pages/admin-ambassadors.tsx
client/src/pages/admin-links.tsx
client/src/pages/admin-attribution.tsx
client/src/pages/admin-commissions.tsx
client/src/pages/admin-payouts.tsx
client/src/pages/admin-sweepstakes.tsx
```

### Shared
```
client/src/components/admin-auth-guard.tsx     # localStorage adminKey + prompt
client/src/App.tsx                              # /admin/* route registrations
shared/canonical-categories.ts                  # canonical 16 categories
```

### Server
```
server/routes.ts                                # all /api/admin/* endpoints
server/seeded-providers-routes.ts               # seeded directory CRUD
server/ai/engine.ts                             # AI Guide core
```

---

**Questions for the dev team to bring back:** which of the deferred items in
section 8 should be scoped first, and what their preferred path is for the
two-database consolidation in section 4.1.
