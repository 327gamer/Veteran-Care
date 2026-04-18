# Veteran Care — Back Office & Admin Panel Operations Manual

**Audience:** internal development team. This document is the deep-dive
reference for everything that happens behind the scenes in the admin
panel and the engines it controls.

**Reading order:** read sections 1–4 in order to get the system shape,
then jump to whatever subsystem you need. Cross-references are inline.

**Last reviewed:** April 2026 — SC pilot live, Georgia preparation in
progress.

---

## Table of contents

1. The big picture — what the platform does and how money moves
2. Authentication and access control
3. The two-database architecture
4. The four actors (veteran, partner, ambassador, admin)
5. Resource lifecycle (submission → approval → display)
6. AI Guide engine (prompts, categories, navigator hook, safety, fallback)
7. Help Requests (Navigator Requests) — the inbox and how UTMs get stamped
8. Routing engine — how a help request finds a partner
9. Escalation engine — what happens when a partner doesn't respond
10. Partner universe — Routing vs Trusted vs Seeded vs Veteran-Owned Business
11. Partner onboarding — application → approval → Stripe → webhook → conversion
12. Billing engine — how a help request becomes revenue
13. Ambassadors — what they are, what they get, how they're managed
14. Attribution engine — first-touch UTM capture and persistence
15. Commissions — when they're created and how they're calculated
16. Payouts — batches, locking, and the lifecycle endpoint
17. Dashboards — Analytics, Executive Summary, AI Insights, Attribution
18. Sweepstakes — entries, weighted draw, winner notification
19. VOB (Veteran-Owned Business) directory
20. Money flow end-to-end (what's revenue, what's cost, what's margin)
21. Safety nets and guard rails (DB constraints, budget guards, fairness)
22. Daily / weekly / monthly operational rhythm
23. Known gaps and deferred work
24. Files map (where everything lives)

---

## 1. The big picture

Veteran Care is a referral and resource platform for U.S. military
veterans. It does four jobs at the same time:

1. **Directory** — display vetted resources (federal, state, local,
   nonprofit, business) across 16 categories so a veteran can find
   help even without talking to anyone.
2. **AI Guide** — a conversational assistant that interprets the
   veteran's situation, suggests resources inline, and offers to hand
   them to a human when intent is high.
3. **Lead routing** — when the veteran asks for help, the request is
   assigned to a paid local partner who pays per delivered lead and/or a
   monthly subscription.
4. **Ambassador attribution** — humans (case managers, advocates,
   community organizers) earn commission when veterans they refer
   convert into paid partner activity.

Money moves in two streams:

- **Subscription revenue** — partners pay monthly via Stripe
  (state-level or national-level price IDs).
- **Per-lead revenue** — when a help request is routed and delivered
  to a paid partner, an admin charges the partner per lead via Stripe
  (default $25.00 / 2,500¢, overridable per partner or per category).

The platform's COGS, on the revenue side, is **ambassador commission**
(default 10% of revenue, configurable per ambassador). Net margin =
subscriptions + lead charges − commissions − operating cost.

---

## 2. Authentication and access control

The admin panel uses a **single shared secret key**, not user accounts.

| Concern | Implementation |
|---|---|
| Server middleware | `requireAdmin` in `server/routes.ts` (~L2701). Compares the `x-admin-key` request header against `process.env.ADMIN_KEY`. Returns `401 { error: "Unauthorized" }` on mismatch. |
| Client guard | `client/src/components/admin-auth-guard.tsx`. Wraps every admin page. Prompts for the key on first visit, then stores it in `localStorage.adminKey`. |
| Header sent | `x-admin-key: <ADMIN_KEY>` on every admin API call. |
| Sign out | Clears `localStorage.adminKey` and re-renders the guard. |

There is **no role hierarchy** today. Every admin has full access. If
multi-role is needed (e.g., a partner-only QA reviewer), it must be
built on top of this layer.

The Stripe webhook endpoint (`/api/stripe/webhook`) uses Stripe's own
signature verification — it is intentionally not behind `requireAdmin`
because Stripe must reach it directly.

---

## 3. The two-database architecture

The platform runs against **two Postgres databases** at once. This is a
deliberate design from the early SC pilot, and it must be consolidated
before scaling to state #3.

| Database | Role | Common tables |
|---|---|---|
| **Supabase Postgres** | identity, auth, all billable + lead-routing flows | `users`, `partner_organizations`, `partner_routing_rules`, `partner_rotation_state`, `rotation_fairness_history`, `navigator_requests`, `ai_usage_log`, `resource_clicks`, `lead_billing_records`, `partner_applications`, `trusted_services` |
| **Drizzle Postgres** (Replit DB) | display data + ambassador attribution graph | `resources`, `categories`, `resource_categories`, `subcategories`, `resource_subcategories`, `ambassadors`, `ambassador_links`, `commissions`, `ambassador_payouts`, `user_attribution_sessions`, `sweepstakes_*`, `vob_submissions` |

### Dual-write tagging

Some entities live on both sides. The F2.5 sync writes a tag like
`SEEDED|supabase_org_id=…` into the `notes_internal` column on the
Supabase side so display rows on the Drizzle side can be matched back
to their canonical source.

### Bridge keys

The two systems are bridged by **email address** (for partners) and by
**ambassador code / utm_id** (for attribution). This is why the partner
contact email is a near-immutable field once a partner is paid — it is
the cross-database join key.

### Why this matters for the dev team

Any new entity added during the next phase should live in **one** store
only. The two-DB split is a cost we are paying down, not a pattern to
reinforce. When in doubt, put it in Supabase (the system of record for
billable flows).

---

## 4. The four actors

| Actor | What they do | Where they appear in admin |
|---|---|---|
| **Veteran** | Submits help requests, chats with the AI, clicks resources, may sign up. | Their requests appear on `/admin` Support Requests tab. Their AI activity rolls up on `/admin/ai-insights`. |
| **Partner organization** | Receives leads, pays per-lead and/or subscription. May be paid (Tri-County, Boot Print today) or seeded display-only (national agencies). | `/admin` Routing Partners tab; `/admin/trusted-services`; `/admin/seeded-providers`; `/admin/partner-prospects`. |
| **Ambassador** | Drives referral traffic, earns commission. Each ambassador owns a unique UTM code and a kit of pre-generated tracking links and QR codes. | `/admin/ambassadors`, `/admin/links`, `/admin/commissions`, `/admin/payouts`, `/admin/attribution`. |
| **Admin** | Approves resources, reviews leads, charges paid partners, approves commissions, runs payouts, draws sweepstakes winners. | Every `/admin/*` page. |

---

## 5. Resource lifecycle

Resources are the heart of the directory. Every resource flows through
the same five stages:

```
1. Submitted        (status = "pending")
   → user form on /submit-resource → POST /api/resources
   → admin import via /admin Resources tab → POST /api/admin/resources
   → CSV import → POST /api/admin/resources/import-csv

2. Reviewed
   → admin opens /admin Resources tab, Pending pill
   → edits fields, fixes category/subcategory tags
   → optionally clicks "Geocode Missing" to populate lat/lng

3. Approved         (status = "approved")
   → row is now public-readable
   → eligible for AI matching (server/ai/resource-matcher.ts)
   → eligible for click tracking on the public site

4. Indexed
   → category links live in `resource_categories` (many-to-many)
   → subcategory links live in `resource_subcategories`
   → AI matcher reads these to scope candidate resources by category

5. Engaged
   → veteran clicks → row inserted into `resource_clicks`
     (resource_id, click_type, user_state, user_city, created_at)
   → click_type values: website_click, call_click, directions_click,
     apply_click, save_click, share_click, guide_click, report_click
   → admin can view rollups on /admin/analytics
```

### CSV import

`POST /api/admin/resources/import-csv` validates header presence
(`title`, `category` required), checks duplicates against existing
`title` + `website_url`, and returns per-row results: `created`,
`skipped` (duplicate), or `error` (validation failure). The admin sees
a 3-tile summary (Created / Skipped / Errors) plus a scrollable error
table with the row, title, status, and reason.

### Geocoding

Implemented in `server/geocode.ts` using **Nominatim (OpenStreetMap)** —
no Google Maps key needed. Tries multiple address resolution strategies
in order: street + city + state + zip → city + state → zip-only. Stores
the resulting lat/lng on the resource. These coordinates power
"near me" radius search and the haversine-distance sort in the AI
matcher.

The "Geocode Missing" button on `/admin` Resources tab batches every
approved resource without coordinates.

### Reports

Veterans can flag a resource as outdated/incorrect. Reports are stored
as a tagged note in the resource row's `notes_internal` field and
surface as `reportedResources` on `/admin/analytics`.

---

## 6. AI Guide engine

The AI Guide is a streaming OpenAI assistant that lives in
`server/ai/`. It does five jobs every conversation:

1. Detect the category of the veteran's need
2. Match relevant approved resources to that category
3. Stream a warm, supportive response that cites those resources inline
4. Decide whether to suggest the human "Navigator" hook
5. Log the whole thing for cost and behavior analysis

### File map for the engine

| File | Role |
|---|---|
| `server/ai/engine.ts` | Top-level orchestrator. Streams SSE events to the client. |
| `server/ai/prompt-builder.ts` | Builds the system prompt — base style + intent context + user context + matched resources. |
| `server/ai/resource-matcher.ts` | `detectCategories()` runs weighted keyword scoring. Then ranks approved resources by category match + proximity (haversine) + sponsorship boost. |
| `server/ai/safety.ts` | Crisis keyword scanner. Bypasses the LLM and returns the Veterans Crisis Line 988 response when triggered. |
| `server/ai/budget-guard.ts` | Daily token cap. When exceeded, the engine switches to the fallback responder. |
| `server/ai/config.ts` | Model name, fallback response text, category keywords, base prompt. |
| `shared/canonical-categories.ts` | The 16 canonical categories and their bridge to the 8 trusted-services slugs. |

### Canonical categories (the 16)

Paired (have a Trusted Services counterpart):
`housing`, `legal`, `financial`, `education`, `employment`,
`va-benefits`, `substance-recovery`, `insurance`.

Resource-only (no Trusted Services counterpart yet):
`healthcare`, `disabled-veterans`, `mental-health`, `family-support`,
`transportation`, `community-support`, `food-assistance`, `crisis-help`,
`end-of-life-services`.

(That's 17 total because of historical drift. Production logs and
analytics use the slugs above.)

### SSE event shape

The client receives two kinds of streaming events:

```
event: resources    data: { resources: [...] }
event: done         data: { categories, navigatorSuggested, isEscalation, resourceCount }
```

The "human help" hook is delivered via the `navigatorSuggested` boolean
on the `done` event. There is **no** separate `hook` event — front-end
code that listens for one will never fire.

### When the navigator hook fires (`navigator_suggested = true`)

Set in `server/ai/engine.ts` (~L236). Becomes true when **any** of:

1. The user explicitly asks for a person or callback (parsed as
   `isEscalation`)
2. A "Tier-1" high-intent category is detected with strong intent
   score (Housing, Financial, VA Benefits, Crisis, etc.)
3. The assistant's own response contains the words "navigator" or
   "request support"

### Crisis detection

`server/ai/safety.ts` scans every user message against `crisisKeywords`.
On a hit, the engine **does not call OpenAI** — it returns a hardcoded
`crisisResponse` containing the Veterans Crisis Line (Dial 988, press 1)
and sets `isCrisis: true`. This is the only path that bypasses the LLM
entirely, and it's intentional: never let a model degrade or hallucinate
a crisis response.

### Fallback model

When `server/ai/budget-guard.ts` reports the daily token budget
exhausted, the engine logs `model: "fallback"` and returns
`aiConfig.fallbackResponse` — a static helpful message plus the matched
resource list. This keeps the experience working at zero LLM cost. The
volume of fallback responses appears on `/admin/ai-insights` so the
team can decide whether to raise the cap.

### Logging

Every conversation writes one row to Supabase `ai_usage_log` with:
`detected_category`, `is_guest`, `model` (model name, `fallback`, or
`safety-filter`), `input_tokens`, `output_tokens`, `total_tokens`,
`navigator_suggested`. This is the source for `/admin/ai-insights`.

---

## 7. Help Requests (Navigator Requests)

A **Help Request** is the formal record of a veteran asking for human
follow-up. It lives in Supabase `navigator_requests`. Five common entry
points create one:

1. The "Get Help" form (`/get-help`)
2. A category-specific landing page CTA
3. The AI Guide's "Request Support" button (when the navigator hook
   fires)
4. The "Request Help" button on a specific resource page
5. The Trusted Services contact form (creates a sibling row in
   `trusted_service_leads`)

### What's captured on creation

Beyond the obvious veteran name / phone / email / message:

- **Category + subcategory** — used by the routing engine
- **State + city + zip** — geographic scope for routing
- **UTM fields** — `utm_source`, `utm_medium`, `utm_campaign`,
  `utm_content`, `utm_id`, **`session_id`**, **`ambassador_id`**
  (resolved from `utm_id` if present)
- **Source** — which entry point produced the request (used in
  analytics)
- **Urgency** — `immediate` or `standard`. Immediate gets a 15-minute
  escalation window; standard gets 72 hours
- **Consent flag** — `consent_followup` for follow-up communications

### What gets added during processing

| Field | Set when |
|---|---|
| `routed_to_partner_id` | Routing engine assigns a partner |
| `routed_at` | Same |
| `routing_method` | `auto`, `manual_reroute`, `escalation`, etc. |
| `routing_scope_key` | The scope identifier used for fairness rotation |
| `delivery_status` | `delivered`, `unrouted`, `fallback_manual` |
| `email_sent` / `email_sent_at` | Partner notification email succeeded |
| `is_billable` / `billing_status` | Set true when delivery succeeds |
| `escalation_count` | Incremented each time a partner doesn't respond in window |
| `reassignment_count` | Incremented each time the lead moves to a new partner |
| `partner_outcome` | Manual write — `accepted`, `won`, `converted`, `completed`, `lost`, `no_response` (today this column is rarely written; that's why the conversion rate on the Executive Summary shows 0%) |
| All billing-workflow fields | See section 12 |

---

## 8. Routing engine

This is the most operationally important engine in the system. It
lives in `server/lead-router.ts`.

### The pipeline (in order)

```
1. Normalize the request's category + subcategory
   (toCanonical from shared/canonical-categories.ts)

2. Build the rotation scope key
   buildRotationScopeKey() at L335
   Format: "category::subcategory::state::city"
   Example: "healthcare::any::SC::charleston"

3. Fetch candidates from partner_routing_rules
   applyRoutingFilters() at L169
   Candidate must:
     - belong to a partner with is_active = true
     - is_lead_enabled = true
     - not paused
     - if subscription_lock is on for the scope:
         active_paid_partner = true AND onboarding_status = 'active'
     - rule.category_slug matches
     - rule.subcategory matches (or rule says "any")
     - rule.urgency matches the request urgency
     - rule.state and rule.city match (or rule says "any")

4. Enforce caps
   countTodayLeadsForPartner() at L143
   If today's count for this partner ≥ rule.max_leads_per_day → skip

5. Pick one via round-robin rotation
   getRotatedPartner() at L345
   Looks up partner_rotation_state for this scope key. Picks the
   partner immediately AFTER the last_assigned_partner_id in the
   candidate list. Updates the rotation state.

6. Record fairness snapshot
   recordFairnessSnapshot() at L416
   Logs distribution variance to rotation_fairness_history.
   Flags include: "balanced", "imbalance_detected".

7. Assign and notify
   - Set routed_to_partner_id, routed_at, routing_scope_key
   - Send email to partner via sendLeadNotification()
   - On email success: markLeadBillable() — is_billable = true,
     billing_status = "billable"
   - On no candidate: try findBestResourceFallback() (an approved
     resource with an email in the right scope) — if that also
     fails, delivery_status = "unrouted" and a "lead_unrouted"
     event is logged for human review
```

### What "routing scope key" really means

It's the fairness boundary. Two requests with the same scope key
share the same rotation cursor. So if Tri-County and Boot Print both
serve `healthcare::any::SC::charleston`, the cursor alternates
between them lead-by-lead. A request with a different scope key
(say `housing::any::SC::greenville`) is a totally different rotation.

### Why this matters for partners

Partners can buy granular rules. A partner can opt into
`employment::veteran-business-loans::SC::columbia` only and pay only
for that rotation slice. This is what makes per-category pricing work.

### When everything fails

If no partner matches AND no resource fallback matches, the request
is left with `delivery_status = "unrouted"`. It still appears in the
admin inbox. An admin can manually reroute via
`POST /api/admin/leads/:id/reroute` — that's the partner-suggestion
panel on each request row in `/admin` Support Requests.

---

## 9. Escalation engine

Lives in `server/lead-escalation.ts`. Runs as a periodic check.

### The loop

```
checkEscalations() at L19 — runs on schedule

For each request where:
  - delivery_status != final
  - response_status = "pending"
  - assigned partner has not responded within ESCALATION_WINDOW
    (15 minutes for immediate, 72 hours for standard)

→ increment escalation_count
→ call findBestPartner() with the current partner in uniqueExcluded
  (so the same partner cannot be picked again)
→ if a new partner is found:
    - increment reassignment_count
    - update routing_history (append the previous assignment)
    - re-run sendLeadNotification() to the new partner
→ if reassignment_count ≥ MAX_REASSIGNMENTS (3):
    - set delivery_status = "fallback_manual"
    - the lead now requires human admin intervention
```

### What admins see

A request with `escalation_count > 0` is highlighted in the inbox.
The "Reroute" panel shows previous assignments via `routing_history`
so the admin understands who has already had a turn. After 3
reassignments, the lead falls into the manual queue and stops
auto-rotating.

---

## 10. Partner universe

This is the part new engineers most often get wrong. There are **four
distinct partner concepts** and they live in different tables.

### 10.1 Routing Partner (`partner_organizations` + `partner_routing_rules`)

The operational record used by the routing engine. Has flags:

| Flag | Meaning |
|---|---|
| `is_active` | Master switch. False = invisible to all engines. |
| `is_lead_enabled` | Specifically eligible for lead routing. |
| `active_paid_partner` | "In good standing" — gates routing when subscription_lock is on for the scope. |
| `seeded` (and `provider_type = 'seeded'`) | Display-only national entity; cannot bill or receive leads. |
| `onboarding_status` | Must be `"active"` to receive leads when `onboardingLock` is on. |

Database CHECK constraints — **never remove these**:

- `seeded_cannot_be_active_paid` — a row with `seeded = true` cannot also have `active_paid_partner = true`
- `seeded_cannot_be_lead_enabled` — a row with `seeded = true` cannot also have `is_lead_enabled = true`

These are the safety net that prevents accidentally billing or routing
to a national display-only provider. Both constraints are confirmed
firing live.

### 10.2 Trusted Service (`trusted_services`)

The **public-facing** partner record. Controls how the partner appears
in the directory (badge, ranking, AI suggestions). Has its own flags:

| Flag | Meaning |
|---|---|
| `is_active` | Show on the public site. |
| `verification_status` | `"verified"` makes the Trusted Partner badge appear. |
| `is_featured` | Featured ranking in the listing. |
| `near_me_boost_active` | Geographic ranking boost (a paid add-on). |
| `listing_type` | `"discount"` (display offers) or `"lead"` (capture form). |

### 10.3 Seeded Provider (`partner_organizations` with `seeded = true`)

National/federal display entries (NPRC, VA national lines, Veterans
Crisis Line, etc.) that should appear in directories and AI citations
but can never bill or be routed to. Managed on
`/admin/seeded-providers`.

### 10.4 Veteran-Owned Business (`vob_submissions`)

Self-submitted veteran businesses. Reviewed for veteran ownership.
Approved entries can be **mirrored** into `trusted_services` via the
"Show in Trusted Services" toggle on `/admin/vob` — this is the
cross-promotion path.

### Can one organization be all four?

Realistically: **Routing Partner + Trusted Service** is the common
case. The bridge between the two tables is the contact email. When a
partner application is paid, `syncPartnerOrgSubscriptionStatus` keeps
the two rows in lockstep.

A Veteran-Owned Business can also be a Trusted Service via the toggle.
A seeded national provider should not also be a trusted service — they
are different operational classes.

### Summary table — which flag controls which surface

| Surface | Read flag |
|---|---|
| Public directory listing | `trusted_services.is_active` |
| Trusted Partner badge | `trusted_services.verification_status = 'verified'` |
| Featured rank | `trusted_services.is_featured` |
| AI Guide suggestions | `trusted_services` rows + the resource matcher |
| Lead routing eligibility | `partner_organizations.is_active` AND `is_lead_enabled` AND scope rules |
| Subscription gating | `partner_organizations.active_paid_partner` (when lock is on) |
| Hard "no billing" rule | `partner_organizations.seeded` (DB CHECK constraint) |

---

## 11. Partner onboarding flow

Six steps from public form to live routable partner.

### Step 1 — Public application form

`POST /api/partner-applications` (`server/routes.ts` ~L11292)

- Creates a row in `partner_applications` with `status = "prospect"`
- If the URL had `utm_content` or `utm_id`, resolves the
  `ambassador_id` so the application is attributed
- Checks if the requested category is lead-eligible
  (`isLeadEligibleCategory()`)
- Logs a non-blocking "duplicate or seeded mismatch" warning if there's
  already a similar provider — does **not** block submission

### Step 2 — Admin review

Admin opens `/admin/partner-prospects`, can edit details, mark notes.

### Step 3 — Approve

`POST /api/admin/partner-applications/:id/approve` (`server/routes.ts`
~L11480)

- Validates Stripe configuration
- Calls `createPartnerCheckoutSession()` in `server/stripe-service.ts`
  ~L138
  - Creates a Stripe Customer if needed
  - Picks the price ID based on `plan_type`:
    - `state` → `STRIPE_PARTNER_PRICE_ID_STATE`
    - `national` → `STRIPE_PARTNER_PRICE_ID_NATIONAL`
    - legacy fallback → `STRIPE_PARTNER_PRICE_ID`
  - Adds requested add-ons as additional line items
    (Featured = `STRIPE_ADDON_PRICE_FEATURED`,
    Near Me Boost = corresponding env var, etc.)
- Sends `sendPartnerPaymentEmail()` with the checkout URL
- Updates application status to `approved_pending_payment`

### Step 4 — Partner pays

Stripe redirects them through checkout. On success, Stripe sends
`checkout.session.completed` to `/api/stripe/webhook`.

### Step 5 — Webhook fires

`handleCheckoutCompleted()` in `server/stripe-service.ts` ~L302:

- Sets `partner_applications.status = "active"`,
  `billing_active = true`
- Stores `stripe_customer_id` and `stripe_subscription_id`
- **Auto-conversion**: if no conversion has happened yet, creates a
  `trusted_services` row and links it via `converted_provider_id`
- Syncs add-on flags (`is_featured`, `near_me_boost_active`, etc.) to
  both the application and the service record
- Calls `syncPartnerOrgSubscriptionStatus()` →
  `partner_organizations.subscription_status = "active"` and
  `active_paid_partner = true`
- **Also** creates a commission row if the application has an
  `ambassador_id` (see section 15)

### Step 6 — Manual conversion (only if not auto-converted)

`POST /api/admin/partner-applications/:id/convert` (`server/routes.ts`
~L11658). Used in the rare case where the auto-conversion didn't run.
Creates the `trusted_services` row, geo-codes the address, and links
back to the application.

### Visualization

```
Public form ─→ partner_applications (status: prospect)
                                   │
                            admin reviews
                                   │
                          admin clicks Approve
                                   │
                  Stripe checkout email sent
                                   │
                          partner pays
                                   │
                    Stripe webhook fires
                                   │
       ┌───────────┬───────────────┼────────────────┐
       ▼           ▼               ▼                ▼
trusted_services  partner_orgs   commission       email confirms
created           subscription   row created      partner is live
                  status updated  if attributed
```

---

## 12. Billing engine

How a routed help request becomes revenue. Lives across
`server/lead-router.ts`, `server/stripe-service.ts`, and
`server/billing-governance.ts`.

### Lifecycle

```
1. NEW
   Request created. Not billable yet. billing_workflow_status = null.

2. ROUTED + DELIVERED
   Routing picks a partner. Partner notification email succeeds.
   markLeadBillable() at server/lead-router.ts:L44 sets:
     - is_billable = true
     - billing_status = "billable"
     - billing_workflow_status = null (or "ready")

3. QUEUED
   Admin selects on /admin Billing tab → bulk action.
   billing_workflow_status = "queued"

4. CHARGED
   createLeadChargeCheckout() at L251 generates Stripe checkout.
   Amount source order:
     a. partner_applications.lead_price_cents (per-partner override)
     b. lead_category_pricing.price_cents (per-category default)
     c. 2500 cents ($25.00) hardcoded fallback
   On checkout.session.completed webhook:
     - billing_workflow_status = "charged"
     - billed = true
     - billed_at = now
     - billing_amount = amount_total
     - stripe_payment_intent_id and stripe_checkout_session_id stored

5. FAILED / PAYMENT_FAILED
   Stripe returns failure. handlePaymentFailed() at L324 sets the
   workflow status accordingly. Admin can retry from /admin Billing.

6. HOLD
   Manually paused by admin. billing_hold_reason captures why.

7. REVIEW_REQUIRED
   shouldAutoReview() flags leads that were reassigned or where the
   partner declined. Admin investigates before charging.

8. DISPUTED
   is_disputed = true, dispute_reason captured. Admin resolves before
   any further action.
```

### Self-healing

`runDeliveryValidation()` at `server/lead-router.ts` ~L235 sweeps
periodically for leads that are stuck in `ready_for_delivery` or
missing required metadata. It either resends the notification or
flags the row for review.

### What admins see on `/admin` Billing tab

Top of the tab is the **Ops Summary panel** — a 7-tile dashboard:
New (24h), Pending, Ready, Failed, Hold, Disputed, Review. Below
that is the **Daily Workflow Checklist** with seven steps that map
1:1 to the workflow states. The bottom totals (Processed / Paid /
Failed) are lifetime counters.

---

## 13. Ambassadors

Ambassadors are the human referral layer. Each one owns a **code**
(slug like `john_doe_sc`), gets a kit of **tracking links**, earns
**commission** on revenue they drive.

### Creating an ambassador

`/admin/ambassadors` → "Add Ambassador" form. Captures name, email,
phone, region, optional `commission_rate` override (defaults to 10%).

On creation, the system:

1. Inserts a row into `ambassadors`
2. Calls `POST /api/admin/ambassador-links/generate` which produces a
   **link matrix**:
   - 4 audiences (`veteran`, `case_manager`, `partner`, `general`)
   - 7 channels (`facebook`, `instagram`, `email`, `linkedin`, `text`,
     `qr`, `flyer`)
   - = up to 28 unique tracking links per ambassador
3. Each link gets a `utm_id` of the form:
   `{ambassador_code}_{campaign}_{channel}_{sequence}`
   Example: `john_doe_sc_launch_facebook_01`
4. The QR code variant is generated on-the-fly via the `qrcode`
   library when fetched from `/api/ambassador/qr/:utmId` (400px PNG)

### Distribution kit ("Ambassador Kit")

Pulled from `/api/admin/ambassador-distribution/:code`. Includes:

- The generated tracking links with UTM IDs
- Suggested social media copy templates (definitions in
  `server/routes.ts` ~L4587)
- Downloadable QR images
- A printable summary PDF (when applicable)

This is what an admin hands a new ambassador on day one.

### How short links work

Each `ambassador_links` row exposes a short URL like `/a/:utmId`. When
clicked, the server:

1. Increments `click_count` on that row
2. Redirects the user to the long `full_url` containing all the UTM
   parameters
3. The client-side analytics layer takes over from there (section 14)

---

## 14. Attribution engine

How a click eventually becomes a commissioned conversion. The model
is **first-touch persistent**.

### Client-side capture

Lives in `client/src/lib/analytics.ts`. `initAnalytics()` runs on
every page load and calls `captureUTM()`.

| Storage | Key | Lifetime | Purpose |
|---|---|---|---|
| `sessionStorage` | `vc_session_id` | Browser tab session | Per-session unique ID |
| `sessionStorage` | `vc_utm` | Browser tab session | The UTMs from the current visit |
| `localStorage` | `vc_utm_first` | **Indefinite** (until cache cleared) | First-touch UTMs — **never overwritten once set** |

### Server-side recording

When the client captures UTMs, it `POST`s to `/api/attribution-session`
(`server/routes.ts` ~L2951). That writes to
`user_attribution_sessions`:

- `session_id`
- `utm_id`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`
- `ambassador_id` (resolved from `utm_id` via the
  `resolveAmbassadorId()` helper)
- `landing_page`, `created_at`

### Linking to outcomes

Every downstream conversion event resolves the ambassador the same
way:

- `navigator_requests.ambassador_id` — set on creation
- `trusted_service_leads.ambassador_id` — set on creation
- `partner_applications.ambassador_id` — set on creation when the
  partner application form had UTMs

### Why "first-touch persistent" matters

If an ambassador refers a veteran in March and the veteran doesn't
submit a request until June, the original ambassador still gets
credit because `vc_utm_first` in `localStorage` persists. The only
way that breaks is if the user clears browser storage or visits on
a totally different device.

### Conversion timing buckets (`/admin/attribution`)

The attribution dashboard groups conversions by how long after the
first click they happened:
`< 5 min`, `5–30 min`, `30 min – 2 h`, `2–24 h`, `> 24 h`. This is
shown both overall and per-ambassador to help spot which campaigns
drive immediate vs delayed conversion.

---

## 15. Commissions

Commissions are the COGS line on the revenue statement. Lives in the
`commissions` table on the Drizzle side.

### When a commission row is created

`handleCheckoutCompleted()` in `server/stripe-service.ts`. Triggered
by **any** successful Stripe checkout (partner subscription start, or
partner add-on purchase, or per-lead charge).

If the originating record has an `ambassador_id` (resolved from UTMs
at the time of the original event), a commission row is created.

### How the amount is calculated

```
revenueAmount  = session.amount_total / 100   (cents → dollars)
commissionPct  = ambassador.commission_rate ?? 0.10  (default 10%)
commissionAmt  = Math.round(revenueAmount * commissionPct * 100) / 100
```

Stored fields in `commissions`:
`ambassador_code`, `utm_id`, `application_id`, `revenue_amount`,
`commission_percentage`, `commission_amount`, `status`, `payout_id`,
`created_at`.

### Status lifecycle

```
pending          (created automatically on checkout)
   │
   │  admin reviews on /admin/commissions
   ▼
approved         PATCH /api/admin/commissions/:id/status (admin only)
   │
   │  added to a payout batch
   ▼
paid             auto-set when the payout batch is marked Paid
                 SQL: UPDATE commissions SET status='paid'
                      WHERE payout_id = $batchId

   (off-path)
voided / cancelled  manual transitions for refunded or invalid records
```

### Aging badges

The UI tags rows visually:
- **New** — created in the last 7 days
- **Review** — older than 7 days, still pending
- **Stale** — older than 30 days, still pending

This is purely a UX hint to drive admin attention, not a state
transition.

### Why one commission row per checkout

The platform records one commission per Stripe checkout event, not
per dollar earned over the lifetime of a subscription. So a partner
who pays $99/month creates **one commission row per month** when the
subscription renewal posts a new checkout — not a single commission
row that grows over time.

---

## 16. Payouts

Payouts batch approved commissions into actual money sent to
ambassadors. Lives in `ambassador_payouts`.

### Workflow

```
1. Admin creates a payout batch
   POST /api/admin/payouts
   Captures: ambassador_id, period_start, period_end, payment_method,
             external_reference (e.g., bank txn id), notes

2. Admin attaches eligible commissions
   POST /api/admin/payouts/:id/commissions
   Eligibility: status = "approved" AND payout_id IS NULL
   Action: sets commissions.payout_id = batchId

3. Admin can detach commissions before the batch is paid
   DELETE /api/admin/payouts/:id/commissions/:commId
   Resets commissions.payout_id to NULL

4. Admin marks batch Paid
   PATCH /api/admin/payouts/:id/status   { status: "paid" }
   This is a LOCK action:
     - Server runs UPDATE commissions SET status='paid' WHERE payout_id=$id
     - All attached commission rows transition to "paid"
     - The batch becomes read-only:
       /admin/payouts/:id/commissions add/remove are blocked
       (server/routes.ts ~L4285 enforces this)
     - total_amount on the payout is now effectively immutable
```

### Why locking matters

Once a batch is paid, the underlying commissions cannot be edited or
detached because the money has already left. This is the primary
financial integrity guarantee on the ambassador program.

---

## 17. Dashboards

The admin panel ships four dashboards, each with a specific reading
audience.

### 17.1 `/admin/analytics` — Engagement Dashboard

Audience: ops staff doing weekly review.

Shows engagement at click level plus a financial snapshot.

- Total approved / pending / reported resources
- Total clicks (lifetime)
- Affiliate vs non-affiliate clicks
- Click-type breakdown (website, call, directions, apply, save,
  share, guide, report)
- Clicks by category, by state, by city (top 20)
- Top 20 resources by click count
- Navigator request rollups by status / category / state
- Dashboard summary panel pulling from
  `GET /api/admin/dashboard-summary`:
  ambassadors, links, commissions, payouts, sessions, revenue

Endpoints: `GET /api/admin/analytics`,
`GET /api/admin/dashboard-summary`.

### 17.2 `/admin/executive` — Executive Summary

Audience: leadership doing daily ownership review.

Single screen, mobile-first. Today / 7d / 30d KPI tiles. Honest
"Instrumentation Pending" card for things we cannot measure yet.

Shows:
- AI chats today / 7d / 30d, plus % with navigator hook fired and
  guest share %
- Top AI categories (30d)
- Help requests today / 7d / 30d, plus pipeline by status
- Partner leads routed (30d), conversion count, conversion rate %
- Top clicked categories (30d) — multi-category aware
- Top SC cities (30d) — combined click + help-request signal
- Billed revenue (30d + lifetime + event count)
- Active paid partners (count + names)
- Instrumentation Pending: daily visitors, mobile/desktop split,
  bounce rate (all three honestly omitted, with reason)

Endpoint: `GET /api/admin/exec-summary` (admin-key gated, read-only,
5k row cap, refreshes every 60s on the client).

### 17.3 `/admin/ai-insights` — AI Health Dashboard

Audience: ops staff watching AI cost and behavior.

Shows:
- Total conversations (guest vs auth)
- Top detected categories
- Crisis-help trigger count (volume that hit the safety filter)
- Blocked-content count
- Fallback model count (when budget guard tripped)
- Safety filter count
- Navigator-suggested count (how often the human-help hook fires)
- Token usage (input + output + total)
- Estimated cost using current GPT-4o-mini pricing
  ($0.15/M input, $0.60/M output)
- Resource gap indicators — categories where AI sees demand but the
  directory is thin

Endpoint: `GET /api/admin/ai-insights`.

### 17.4 `/admin/attribution` — Conversion Funnel

Audience: ambassador program manager.

Shows:
- Total sessions
- Attributed sessions (had a UTM at first touch)
- Conversion timing buckets
- Per-ambassador funnel performance
- Speed distribution (how fast clicks become conversions)

Endpoint: `GET /api/admin/attribution`.

---

## 18. Sweepstakes

Monthly referral giveaway. Lives mainly in the Drizzle DB.

### How entries are granted

| Action | Entries |
|---|---|
| Qualified referral | 5–10 (defined in `supabase/create_referral_sweepstakes.sql`) |
| Profile sign-up | 1 |
| (Other actions can be added by extending the entry-grant rules) | — |

### The draw

`/admin/sweepstakes` → admin clicks "Random Draw". The engine does
**weighted random selection** — the more entries a participant has,
the higher their chance of being drawn. Admins can also do a manual
override selection.

### Notification

**Not automatic.** After a winner is drawn, the admin must click
"Notify Winner" on the winner's row. That triggers
`POST /api/admin/sweepstakes/notify-winner/:id` which sends an email
via Resend.

### Prize configuration

Per-month prize is set via `PUT /api/admin/sweepstakes/prize` (title,
description, value).

---

## 19. VOB (Veteran-Owned Business) directory

Lives in `vob_submissions` on the Drizzle side.

### Submission

Public form at `/vob-directory-apply`. Captures business name, owner
name, veteran status, branch of service, contact info, business
category.

### Review

Admin opens `/admin/vob`. Reviews the submission, optionally adds
`admin_notes`, verifies veteran ownership documentation, sets
`verification_status`.

### Cross-promotion to Trusted Services

There is a per-row toggle: **"Show in Trusted Services"**. When
turned on, the system mirrors the approved VOB into `trusted_services`
tagged as a "Veteran-Owned" provider. This boosts the business's
visibility in the high-intent service directory.

### Why this matters

The VOB directory is a soft acquisition channel for paid Trusted
Service signups — businesses that submit themselves for free
exposure can be upsold into the paid Trusted Service tier.

---

## 20. Money flow end-to-end

A worked example for the dev team.

```
1. Ambassador "John" shares a Facebook post with link
   /a/john_doe_sc_launch_facebook_01

2. Veteran "Maria" clicks the link
   ambassador_links.click_count++
   redirected to veterancare.com/?utm_id=john_doe_sc_launch_facebook_01

3. Browser captures UTMs
   sessionStorage.vc_utm     ← current UTMs
   sessionStorage.vc_session_id ← new session id
   localStorage.vc_utm_first ← first-touch (sticks forever)
   POST /api/attribution-session → user_attribution_sessions row

4. Maria submits a help request a week later
   navigator_requests row created with:
     ambassador_id  = john's id (resolved from vc_utm_first)
     utm_id         = john_doe_sc_launch_facebook_01
     session_id     = the original session id

5. Routing engine picks "Tri-County Veteran Support Network"
   navigator_requests.routed_to_partner_id = tricounty.id
   navigator_requests.routing_scope_key    = "housing::any::SC::charleston"
   sendLeadNotification() emails Tri-County
   On email success: markLeadBillable()
     is_billable        = true
     billing_status     = "billable"

6. Admin opens /admin Billing tab, charges the lead
   createLeadChargeCheckout() → Stripe checkout for $25.00 (or partner override)
   Tri-County completes payment

7. Webhook handleLeadBillingCompleted() fires
   navigator_requests.billed              = true
   navigator_requests.billed_at           = now
   navigator_requests.billing_amount      = 25.00
   navigator_requests.billing_workflow_status = "charged"
   navigator_requests.stripe_payment_intent_id = pi_xxx

8. handleCheckoutCompleted() also processes the commission
   commissions row created:
     ambassador_code     = john_doe_sc
     utm_id              = john_doe_sc_launch_facebook_01
     revenue_amount      = 25.00
     commission_percentage = 0.10
     commission_amount   = 2.50
     status              = "pending"

9. Admin reviews on /admin/commissions, approves
   commissions.status = "approved"

10. Admin creates a payout batch for John for the month
    POST /api/admin/payouts
    POST /api/admin/payouts/:id/commissions  (attaches john's $2.50)

11. Admin pays John outside the system, then marks batch Paid
    PATCH /api/admin/payouts/:id/status { status: "paid" }
    All attached commissions → status = "paid"
    Batch becomes locked / read-only
```

### What's revenue, what's COGS, what's net?

For this single $25 lead:

| Line | Amount |
|---|---|
| Gross revenue | $25.00 (lead charge) |
| Stripe fee (~2.9% + $0.30) | ~$1.03 |
| Ambassador commission | $2.50 |
| Net to Veteran Care | ~$21.47 |

For the partner subscription side, the same math applies — the
commission is calculated on the gross revenue from the Stripe
checkout, regardless of which product was sold.

### Where to read totals

- **Lifetime gross from leads**: Executive Summary → Revenue tile
  (`billed_amount_usd_total`)
- **Lifetime ambassador cost**: `/admin/commissions` → sum of
  `commission_amount`
- **Subscriptions**: today, dashboard-summary endpoint exposes
  `revenue.total_revenue` which combines both subscription and lead
  events from Stripe records

---

## 21. Safety nets and guard rails

A summary of every "don't break this" the platform depends on.

### Database CHECK constraints (Supabase)

- `seeded_cannot_be_active_paid` — prevents national display-only
  providers from being flipped to active paid status
- `seeded_cannot_be_lead_enabled` — prevents national display-only
  providers from receiving leads

Both are confirmed firing in production. Removing these enables
catastrophic billing errors. They are intentional and load-bearing.

### Application-level safeguards

- **Routing scope cap enforcement** — `countTodayLeadsForPartner()`
  enforces `max_leads_per_day` before assignment
- **Rotation fairness recording** — every assignment writes to
  `rotation_fairness_history`; imbalance alerts surface for admin review
- **Escalation cap** — `MAX_REASSIGNMENTS = 3` prevents infinite
  reassignment loops
- **AI safety filter** — `server/ai/safety.ts` keyword scan returns
  the Veterans Crisis Line response without ever invoking the LLM
- **AI budget guard** — `server/ai/budget-guard.ts` daily token cap
  switches to fallback responder before runaway spend
- **Submission rate limit** — 5 submits per IP per hour on public
  forms (`server/routes.ts` ~L2710)
- **Payout lock** — paid batches reject add/remove operations on
  attached commissions (`server/routes.ts` ~L4285)

### Why these matter for the dev team

These rails are the difference between "a small bug" and "a financial
incident." If you remove or alter any of them, you must replace them
with an equivalent guarantee — never leave the platform without that
layer.

---

## 22. Operational rhythm

What an admin actually does in a given day, week, and month.

### Daily (5–15 minutes)

1. Open `/admin/executive` — confirm today's KPIs look reasonable
2. Open `/admin` Support Requests tab — process new (last 24h) leads
3. Open `/admin` Billing tab — work the 7-step Daily Workflow
   Checklist:
   - New leads (24h)
   - Pending / partner responses
   - Ready-to-charge leads
   - Move questionable leads to hold/review
   - Run billing for approved leads
   - Review failed payments and retry
   - Review disputes and resolve
4. Glance at `/admin/ai-insights` — confirm token cost is in range,
   no spike in fallback or safety-filter rows

### Weekly

1. `/admin/analytics` — review click trends, top-performing resources,
   geographic spread
2. `/admin/commissions` — review and approve any pending commissions
   older than the prior week
3. `/admin/partner-prospects` — work the application pipeline,
   approve and send Stripe checkouts
4. `/admin` Resources Pending pill — clear the queue of new
   submissions

### Monthly

1. `/admin/payouts` — create payout batches for the month, attach
   approved commissions, send money outside the system, then mark
   batches Paid
2. `/admin/sweepstakes` — draw winner for the prior month, click
   Notify Winner, set up the next month's prize
3. `/admin/seeded-providers` — verify nothing has drifted out of date
   (URLs, phone numbers)
4. `/admin/vob` — clear any pending Veteran-Owned Business reviews

---

## 23. Known gaps and deferred work

What the dev team should NOT re-promise as "easy" without scoping.

1. **Visitor analytics** — no page-view tracking yet. AI chat count
   is the closest proxy. The natural next slice is a lightweight
   beacon → `page_views` table. Until that ships, the Executive
   Summary's "Daily visitors" tile is intentionally not displayed.
2. **Device split + bounce rate** — same root cause; needs the
   beacon plus a session-end signal.
3. **Partner outcome capture** — `navigator_requests.partner_outcome`
   is rarely written, so the conversion-rate KPI on the Executive
   Summary shows 0%. Solutions: an admin form to flip it, or a
   token-link emailed to partners for self-serve marking.
4. **Two-database consolidation** — pick a canonical store per entity
   before launching state #3. Recommended path: migrate ambassador
   attribution graph into Supabase so all financial flows live in
   one DB.
5. **Six non-insurance resources without subcategory link** — small
   data cleanup left over from the F2.6 / B1 work.
6. **27 inactive `pg.trusted_service_categories` scaffolding rows**
   — leave in place for future trusted-services UI work.
7. **Ambassador rollout** — infrastructure is complete; recruitment
   and launch are business decisions, not engineering tasks.
8. **`converted_from_seeded_id` column** — would close the loop
   between a seeded national provider and the paid local partner
   that eventually replaces it. Useful for analytics, not blocking.
9. **AI matcher ranking refinement** — 3 of 6 baseline test prompts
   in the validation review surfaced imperfect rankings. Tunable
   without engine changes; needs category-keyword tuning.
10. **Stripe → revenue dashboard reconciliation** — current revenue
    figures are calculated from `navigator_requests.billing_amount`
    sums; pulling directly from Stripe via the API would be a more
    authoritative source for accounting.

---

## 24. Files map

### Admin pages

```
client/src/pages/admin-resources.tsx           # /admin (hub: 5 tabs)
client/src/pages/admin-analytics.tsx           # /admin/analytics
client/src/pages/admin-executive.tsx           # /admin/executive
client/src/pages/admin-ai-insights.tsx         # /admin/ai-insights
client/src/pages/admin-trusted-services.tsx    # /admin/trusted-services
client/src/pages/admin-trusted-service-leads.tsx
client/src/pages/admin-seeded-providers.tsx    # /admin/seeded-providers
client/src/pages/admin-partner-prospects.tsx   # /admin/partner-prospects
client/src/pages/admin-vob.tsx                 # /admin/vob
client/src/pages/admin-ambassadors.tsx         # /admin/ambassadors
client/src/pages/admin-links.tsx               # /admin/links
client/src/pages/admin-attribution.tsx         # /admin/attribution
client/src/pages/admin-commissions.tsx         # /admin/commissions
client/src/pages/admin-payouts.tsx             # /admin/payouts
client/src/pages/admin-sweepstakes.tsx         # /admin/sweepstakes
```

### Shared client

```
client/src/components/admin-auth-guard.tsx     # localStorage adminKey + prompt
client/src/lib/analytics.ts                    # captureUTM(), session model
client/src/App.tsx                              # /admin/* route registrations
shared/canonical-categories.ts                  # 16 canonical categories
```

### Server engines

```
server/routes.ts                                # all /api/* and /api/admin/* endpoints
server/lead-router.ts                           # routing engine + billing markers
server/lead-escalation.ts                       # escalation/reassignment loop
server/billing-governance.ts                    # billing safeguards
server/stripe-service.ts                        # Stripe checkout + webhook handlers
server/seeded-providers-routes.ts               # seeded directory CRUD
server/geocode.ts                               # Nominatim address → lat/lng
server/ai/engine.ts                             # AI Guide orchestrator (SSE)
server/ai/prompt-builder.ts                     # prompt assembly
server/ai/resource-matcher.ts                   # category detection + ranking
server/ai/safety.ts                             # crisis keyword filter
server/ai/budget-guard.ts                       # daily token cap
server/ai/config.ts                             # model + keywords + base prompt
```

### Stripe environment variables

```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PARTNER_PRICE_ID                # legacy default
STRIPE_PARTNER_PRICE_ID_STATE          # state-level subscription
STRIPE_PARTNER_PRICE_ID_NATIONAL       # national-level subscription
STRIPE_ADDON_PRICE_FEATURED            # featured-listing add-on
STRIPE_ADDON_PRICE_NEAR_ME_BOOST       # geo boost add-on
(other add-on price IDs as introduced)
```

### Other secrets

```
ADMIN_KEY              # the shared admin password
OPENAI_API_KEY         # AI Guide
RESEND_API_KEY         # email delivery (partner notifications, sweepstakes)
SUPABASE_SERVICE_ROLE_KEY   # admin-side Supabase access
SUPABASE_DB_PASSWORD   # direct Postgres connection (currently missing — request before any DB-direct migration work)
```

---

## Closing notes for the dev team

Read this top to bottom once. After that, the parts you'll touch
weekly are sections 8 (routing), 11 (onboarding), 12 (billing), 14
(attribution), and 15 (commissions) — they collectively own all the
revenue mechanics.

When in doubt about flag semantics, **section 10** is the single
source of truth — `partner_organizations` controls routing,
`trusted_services` controls public display, and the DB CHECK
constraints listed in section 21 are the only line of defense
against accidentally billing a federal agency.

Two questions worth bringing back to product:

1. Of the deferred items in section 23, which should we scope first?
   (Recommendation: partner outcome capture + visitor beacon.)
2. What's the preferred path for the two-database consolidation in
   section 3? Recommendation: migrate the ambassador attribution
   graph into Supabase so all financial flows live in one DB before
   Georgia launch.
