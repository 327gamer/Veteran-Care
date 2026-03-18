# Platform Engine — Master Blueprint

**Built from:** Veteran Care (veterancare.com)
**Purpose:** This document is the complete reuse blueprint for spinning up future platforms (Inmate Care, Second Chance Jobs, etc.) from this codebase. Every architectural decision, database table, API endpoint, reusable module, and environment variable is documented here so nothing has to be rebuilt from scratch.

**Last updated:** March 2026

---

## Table of Contents
1. [What This Engine Is](#1-what-this-engine-is)
2. [How to Fork for a New Platform](#2-how-to-fork-for-a-new-platform)
3. [Platform Config File](#3-platform-config-file)
4. [Tech Stack](#4-tech-stack)
5. [Database Architecture](#5-database-architecture)
6. [Server-Side Modules](#6-server-side-modules)
7. [Frontend Pages](#7-frontend-pages)
8. [Admin Panel Modules](#8-admin-panel-modules)
9. [API Endpoints — Complete Reference](#9-api-endpoints--complete-reference)
10. [Email System](#10-email-system)
11. [AI Guide System](#11-ai-guide-system)
12. [Stripe Subscription System](#12-stripe-subscription-system)
13. [Lead Routing System](#13-lead-routing-system)
14. [Environment Variables — Complete Reference](#14-environment-variables--complete-reference)
15. [Trusted Services & Products System](#15-trusted-services--products-system)
16. [Veteran-Owned Business Directory](#16-veteran-owned-business-directory)
17. [Location & Geocoding](#17-location--geocoding)
18. [Multi-State Scaling](#18-multi-state-scaling)
19. [RLS & Security](#19-rls--security)
20. [What to Change Per Platform vs. What to Copy Exactly](#20-what-to-change-per-platform-vs-what-to-copy-exactly)
21. [Known Gaps & Future Work](#21-known-gaps--future-work)

---

## 1. What This Engine Is

This is a config-driven, mobile-first support platform engine. It was built so that the same codebase powers multiple verticals — just swap the config, load the data, change the branding.

**First implementation:** Veteran Care — U.S. Military veterans, South Carolina pilot state.
**Planned implementations:** Inmate Care (justice-involved individuals), Second Chance Jobs (reentry employment).

**Core value proposition of the engine:**
- Veterans (or inmates, or job seekers) can browse resources in their area by category
- They can ask an AI assistant for help finding resources
- They can connect with a Navigator (human helper) for free
- Businesses can apply to become a paid Trusted Partner and receive leads
- Admins can review resources, manage partners, track leads, and view analytics

Everything except the content (resources, categories, branding) is shared across platforms.

---

## 2. How to Fork for a New Platform

### Step-by-step fork process:

**Step 1 — Duplicate the Replit project**
- In Replit, click the three-dot menu → "Fork Repl"
- Rename the fork to the new platform name (e.g., "Inmate Care")

**Step 2 — Edit `shared/platform.ts` only**
- This single file controls 100% of the branding, terminology, and AI behavior
- Do NOT touch any other files at this stage
- See Section 3 for the full list of fields to change

**Step 3 — Create new Supabase project**
- Create a new Supabase project for the new platform
- Run these SQL files in order in the Supabase SQL editor:
  1. `supabase/create_resource_clicks.sql`
  2. `supabase/create_trusted_services.sql`
  3. `supabase/create_trusted_service_leads.sql`
  4. `supabase/create_ai_usage_log.sql`
  5. `supabase/create_partner_organizations.sql`
  6. The navigator_requests table creation SQL (manual — add lifecycle columns)
  7. Run RLS policies (see Section 19)

**Step 4 — Create new Neon database**
- Create a new Neon PostgreSQL database for the new platform
- Run `npm run db:push` to apply the Drizzle schema (creates `partner_applications`, `trusted_services`, `trusted_service_categories`, `trusted_service_leads`, `veteran_owned_businesses` equivalent)

**Step 5 — Update Replit secrets**
- Replace all secrets with the new platform's credentials (see Section 14)

**Step 6 — Load categories**
- Insert the new platform's resource categories into Supabase `categories` table
- Each category needs: id (uuid), name, slug
- Crisis/emergency category should always be first (the server pins it to position 1 via sort)

**Step 7 — Load resources**
- Use the admin CSV import tool at `/admin` to bulk import resources
- Resources are state-scoped — use `SC` or whatever the pilot state is
- National resources (no state) auto-appear in all states

**Step 8 — Update branding assets**
- Replace logo: `client/public/` — update the logo filename reference in `client/index.html`
- Update `client/index.html` meta tags (og:title, og:description, twitter:title, twitter:description)
- Update favicon

**Step 9 — Update domain**
- Update `platform.domain` in `shared/platform.ts`
- Update `email.defaultNotifyEmail` to the new platform's admin email
- Update Stripe success/cancel URLs when setting up Stripe

**Step 10 — Deploy**
- Add custom domain in Replit deployment settings
- Set DNS records
- Configure Stripe webhooks pointing to new domain

---

## 3. Platform Config File

**File:** `shared/platform.ts`

This is the ONLY file that changes per platform. Everything else reads from this.

```typescript
export const platform = {
  // === IDENTITY ===
  name: "Veteran Care",              // Platform display name (two words, as shown in UI)
  domain: "veterancare.com",         // Live domain (used in emails, Stripe URLs)
  tagline: "Trusted Veteran Support",
  description: "...",                // Short description for homepage
  longDescription: "...",            // Used in onboarding welcome text
  onboardingSubtitle: "...",         // Step 1 of onboarding
  locationPrompt: "...",             // Location enable screen title
  locationDescription: "...",        // Location enable screen body (use {name} placeholder)
  logoAlt: "{name} Logo",

  // === USER TERMINOLOGY ===
  // Change ALL of these for a new platform
  userNoun: "veteran",               // Inmate Care: "individual"
  userNounPlural: "veterans",        // Inmate Care: "individuals"
  userNounCapital: "Veteran",        // Inmate Care: "Individual"
  userNounPluralCapital: "Veterans", // Inmate Care: "Individuals"

  // === NAVIGATOR SYSTEM ===
  navigatorTitle: "Navigator",
  navigatorFullTitle: "{name} Navigator",
  navigatorDescription: "...",
  navigatorApplyDescription: "...",
  navigatorConfirmation: "...",
  consentText: "...",

  // === AI GUIDE ===
  ai: {
    assistantName: "Veteran Guide",  // Inmate Care: "Reentry Guide"
    welcomeMessage: "...",           // Full welcome message shown on first open
    subtitle: "Always here to help.",
    guideDescription: "...",
    guideIntro: "...",
    askPrompt: "...",                // Placeholder text in AI chat input
  },

  // === USER PROFILE FIELDS ===
  // These appear in the profile enrichment step of onboarding
  // Change completely per platform
  profileFields: [
    { key: "branch_of_service", label: "Branch of Service", type: "select",
      options: ["Army", "Navy", "Air Force", "Marines", "Coast Guard", "Space Force"] },
    { key: "service_era", label: "Service Era", type: "select",
      options: ["Post-9/11", "Gulf War", "Vietnam", "Korea", "WWII", "Peacetime"] },
    { key: "rank", label: "Rank", type: "text" },
    { key: "mos", label: "MOS / Job Code", type: "text" },
    // Inmate Care example:
    // { key: "release_date", label: "Release Date", type: "text" },
    // { key: "facility_state", label: "Facility State", type: "select", options: [...] },
  ],

  // === EMAIL TEMPLATES ===
  // All of these use {placeholder} syntax resolved by the t() helper
  email: {
    fromName: "{name}",
    defaultNotifyEmail: "info@veterancare.com",  // Admin notification email
    subjectPrefix: "{userNounCapital}",
    leadEmailHeader: "New {userNounCapital} Lead Routed to You",
    inquiryHeader: "New Inquiry from {name}",
    leadFooter: "...",
    inquiryFooter: "...",
    urgentSubject: "[URGENT] New {userNounCapital} Lead — {category}",
    normalSubject: "New {userNounCapital} Lead — {category}",
    // ... (full list in file)
  },

  // === NAVIGATION ===
  nav: {
    bottomTabs: [
      { label: "Home", desc: "..." },
      { label: "Resources", desc: "..." },
      { label: "My Saved", desc: "..." },
      { label: "Community", desc: "..." },
      { label: "Shop", desc: "..." },
    ],
  },

  // === SYSTEM ===
  storageKey: "veteran-care-app",    // Change per platform to avoid localStorage conflicts
  pilotState: "SC",                  // First state to launch in
  timezone: "America/New_York",

  // === FEATURE FLAGS ===
  features: {
    community: false,                // Not built yet
    shop: false,                     // Not built yet
    aiGuide: true,
    locationDetection: true,
    savedResources: true,
    navigatorSystem: true,
    partnerRouting: true,
  },
};
```

**The `t()` helper function** (also in `shared/platform.ts`) resolves `{placeholder}` strings anywhere in the platform config. Use it in components: `t(platform.email.normalSubject, { category: "Housing" })`.

---

## 4. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18 + Vite | Mobile-first, single-page app |
| Styling | Tailwind CSS + shadcn/ui | Component library pre-installed |
| Routing (frontend) | wouter | Lightweight, replaces react-router |
| State management | Zustand | Location, saved resources, user state |
| Data fetching | TanStack Query (react-query) | Cache, mutations, loading states |
| Backend | Express.js + TypeScript | All API routes in `server/routes.ts` |
| Primary DB | Supabase (PostgreSQL) | Resources, categories, users, navigator requests |
| Secondary DB | Neon (PostgreSQL) | Trusted services, partner applications, VOB |
| DB ORM | Drizzle (for Neon) | Schema in `shared/schema.ts` |
| Auth | Supabase Auth | Email/password, RLS |
| AI | OpenAI GPT-4o | Streaming chat completions via SSE |
| Email | Resend | Transactional emails |
| Payments | Stripe | Subscription billing for trusted partners |
| Geocoding | OpenStreetMap Nominatim | Free, no API key required |

---

## 5. Database Architecture

### Two separate databases — critical to understand

**SUPABASE** (PostgreSQL via REST API / `@supabase/supabase-js`):
- Public-facing resources, categories, user auth, navigator requests, routing partners
- Use `supabaseAdmin` client for server-side operations
- Use `supabase` (anon) client for public read operations

**NEON** (PostgreSQL via direct pg connection / `server/pg-client.ts`):
- Trusted services ecosystem: paid partners, applications, leads, VOB directory
- Use `pgQuery()` from `server/pg-client.ts` — NEVER use supabaseAdmin for these tables
- Why separate: Supabase REST API has limitations with UNION queries and complex joins needed for Trusted Services

### CRITICAL RULE — Which DB for which table:

```
SUPABASE tables (use supabaseAdmin or supabase):
  categories
  resources
  resource_clicks
  navigator_requests
  partner_organizations        ← routing partners (NOT Stripe partners)
  partner_routing_rules
  states
  user_profiles
  user_saved_resources
  ai_usage_log

NEON tables (use pgQuery ONLY):
  trusted_service_categories
  trusted_services
  trusted_service_leads
  partner_applications         ← Stripe billing applications
  veteran_owned_businesses
```

### Supabase Table Schemas

**categories**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL,
slug TEXT UNIQUE NOT NULL
```

**resources**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
category_id UUID REFERENCES categories(id),
title TEXT NOT NULL,
short_description TEXT,
website_url TEXT,
phone TEXT,
email TEXT,
address TEXT,
city TEXT,
state TEXT,         -- 2-letter state code (SC, GA, etc.) or NULL for national
zip TEXT,
eligibility TEXT,
source_name TEXT,
source_type TEXT,   -- government / nonprofit / private / other
status TEXT DEFAULT 'pending',  -- pending / approved / rejected
submitted_by_name TEXT,
submitted_by_email TEXT,
notes_internal TEXT,
sponsored BOOLEAN DEFAULT false,
monetization_type TEXT,  -- affiliate / sponsored / free
affiliate_url TEXT,
is_featured BOOLEAN DEFAULT false,
featured_rank INT,
latitude FLOAT8,
longitude FLOAT8,
geo_source TEXT,
geocoded_at TIMESTAMPTZ,
subcategory TEXT,
service_priority TEXT,
created_at TIMESTAMPTZ DEFAULT now()
```

**navigator_requests**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
resource_id UUID,
resource_title TEXT,
veteran_name TEXT NOT NULL,      -- change column name per platform if needed
veteran_phone TEXT,
veteran_email TEXT,
message TEXT,
preferred_contact TEXT,          -- phone / email / either
user_state TEXT,
user_city TEXT,
user_zip TEXT,
status TEXT DEFAULT 'new',       -- new / in_progress / resolved / cancelled
admin_notes TEXT,
urgency TEXT,                    -- standard / urgent / crisis
source TEXT,
utm_source TEXT,
utm_medium TEXT,
utm_campaign TEXT,
assigned_to TEXT,
contacted_at TIMESTAMPTZ,
resolved_at TIMESTAMPTZ,
closed_at TIMESTAMPTZ,
outcome TEXT,
consent_followup BOOLEAN,
category TEXT,
subcategory TEXT,
routed_to_partner_id UUID REFERENCES partner_organizations(id),
routed_at TIMESTAMPTZ,
delivery_status TEXT,
partner_outcome TEXT,
escalation_count INT DEFAULT 0,
routing_history JSONB,           -- array of {partner_id, partner_name, rule_id, routed_at, delivery_status}
created_at TIMESTAMPTZ DEFAULT now()
```

**partner_organizations** (routing partners — NOT Stripe billing partners)
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL,
contact_name TEXT,
contact_email TEXT,
contact_phone TEXT,
website_url TEXT,
state TEXT,
cities TEXT[],
is_active BOOLEAN DEFAULT true,
is_lead_enabled BOOLEAN DEFAULT true,
notes TEXT,
created_at TIMESTAMPTZ DEFAULT now()
```

**partner_routing_rules**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
partner_id UUID REFERENCES partner_organizations(id),
category_slug TEXT,
subcategory TEXT,
urgency TEXT,
state TEXT,
city TEXT,
priority INT DEFAULT 1,
max_leads_per_day INT,
is_active BOOLEAN DEFAULT true,
created_at TIMESTAMPTZ DEFAULT now()
```

**user_profiles**
```sql
id UUID PRIMARY KEY REFERENCES auth.users(id),
first_name TEXT,
last_name TEXT,
email TEXT,
phone TEXT,
user_type TEXT,           -- veteran / spouse_family / dependent / caregiver_advocate / other
consent_contact BOOLEAN DEFAULT false,
branch_of_service TEXT,
service_era TEXT,
rank TEXT,
mos TEXT,
interests TEXT[],
state TEXT,
city TEXT,
zip TEXT,
profile_complete BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now()
```

### Neon Table Schemas

**trusted_service_categories**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
name TEXT NOT NULL,
slug TEXT UNIQUE NOT NULL,
description TEXT,
icon TEXT,
display_order INT DEFAULT 0,
is_active BOOLEAN DEFAULT true,
created_at TIMESTAMPTZ DEFAULT now()
```

**trusted_services**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
category_id UUID REFERENCES trusted_service_categories(id),
name TEXT NOT NULL,
short_description TEXT,
website_url TEXT,
phone TEXT,
email TEXT,
address TEXT,
city TEXT,
state TEXT,
zip TEXT,
logo_url TEXT,
verification_status TEXT DEFAULT 'pending',   -- pending / verified
verification_label TEXT,
cta_text TEXT,
cta_url TEXT,
is_featured BOOLEAN DEFAULT false,
is_active BOOLEAN DEFAULT true,
is_national BOOLEAN DEFAULT false,   -- if true, appears in all state filters
display_order INT DEFAULT 0,
notes_internal TEXT,
show_in_trusted_services BOOLEAN DEFAULT false,  -- used by VOB cross-listing
created_at TIMESTAMPTZ DEFAULT now()
```

**partner_applications** (Stripe billing pipeline)
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
company_name TEXT NOT NULL,
contact_name TEXT NOT NULL,
email TEXT NOT NULL,
phone TEXT,
website TEXT,
city TEXT,
state TEXT,
category_id UUID REFERENCES trusted_service_categories(id),
service_description TEXT,
pricing_interest TEXT DEFAULT 'both',    -- informational only (monthly/lead-based/both)
plan_type TEXT CHECK (plan_type IN ('state', 'national')),  -- billing tier
status TEXT DEFAULT 'prospect',
-- prospect → approved_pending_payment → active → inactive
admin_notes TEXT,
converted_provider_id UUID REFERENCES trusted_services(id),
stripe_customer_id TEXT,
stripe_subscription_id TEXT,
stripe_price_id TEXT,
stripe_checkout_url TEXT,
created_at TIMESTAMPTZ DEFAULT now(),
updated_at TIMESTAMPTZ DEFAULT now()
```

**trusted_service_leads** (veteran → partner contact requests)
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
provider_id UUID REFERENCES trusted_services(id),
category_id UUID,
name TEXT NOT NULL,
email TEXT NOT NULL,
phone TEXT,
city TEXT,
state TEXT,
role TEXT,         -- veteran / family_member / case_manager / friend_supporter / other
message TEXT,
status TEXT DEFAULT 'new',   -- new / contacted / closed
close_reason TEXT,
status_updated_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT now()
```

**veteran_owned_businesses** (rename to `directory_listings` for other platforms)
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
business_name TEXT NOT NULL,
owner_name TEXT,
email TEXT,
phone TEXT,
website TEXT,
address TEXT,
city TEXT,
state TEXT,
zip TEXT,
description TEXT,
category_id UUID REFERENCES trusted_service_categories(id),
subcategory TEXT,
is_veteran_owned BOOLEAN DEFAULT true,
is_nonprofit BOOLEAN DEFAULT false,
logo_url TEXT,
status TEXT DEFAULT 'pending',   -- pending / approved / rejected
admin_notes TEXT,
show_in_trusted_services BOOLEAN DEFAULT false,
created_at TIMESTAMPTZ DEFAULT now(),
reviewed_at TIMESTAMPTZ
```

---

## 6. Server-Side Modules

All server files are in `server/`. Never import between Supabase and pgQuery for the same table.

### `server/routes.ts` — Main API router (3,000+ lines)
All API endpoints live here. Key sections:
- Lines ~1–350: Schema detection, startup checks
- Lines ~350–800: Auth, profile, location APIs
- Lines ~800–1400: Resources API (CRUD, search, geocode, CSV import)
- Lines ~1400–2000: Navigator requests API
- Lines ~2000–2200: Partner organizations & routing rules API
- Lines ~2200–2700: Trusted Services public + admin API
- Lines ~2700–2950: VOB directory API
- Lines ~2950–3100: Partner applications + Stripe approval API
- Lines ~3100–3263: Stripe webhook + session verification

### `server/stripe-service.ts` — Stripe subscription engine
```
createPartnerCheckoutSession(applicationId)
  → Creates Stripe Customer if needed
  → Selects price ID by plan_type:
      state    → STRIPE_PARTNER_PRICE_ID_STATE
      national → STRIPE_PARTNER_PRICE_ID_NATIONAL
      null     → STRIPE_PARTNER_PRICE_ID (legacy fallback)
  → Creates Stripe Checkout Session (subscription mode)
  → Updates partner_applications: status=approved_pending_payment

handleWebhookEvent(event)
  → checkout.session.completed → activates partner, creates trusted_services row
  → customer.subscription.deleted → deactivates partner
  → customer.subscription.updated → deactivates on past_due/unpaid/canceled
  → invoice.payment_failed → deactivates partner

verifyAndActivateCheckoutSession(sessionId)
  → Fallback activation for cases where webhook is delayed
```

### `server/lead-router.ts` — Navigator lead routing engine
```
findBestPartner(lead, excludePartnerIds)
  → Loads all active routing rules from partner_routing_rules
  → Filters by: category_slug, subcategory, urgency, state, city
  → Filters by: partner.is_active, partner.is_lead_enabled
  → Sorts by: priority (ascending), then specificity (descending)
  → Checks daily lead cap (max_leads_per_day)
  → Returns first matching partner

routeLead(leadId)
  → Finds best partner
  → Updates navigator_requests: routed_to_partner_id, routed_at, routing_history
  → Sends email notification to partner

autoRouteNewLead(leadId)
  → Called automatically when a new navigator request is submitted
  → Silent failure if no match (lead stays in manual queue)
```

### `server/lead-email.ts` — Email templates
```
sendNavigatorNotification(lead, partner)  → Lead routed to routing partner
sendTrustedServiceLeadNotification(lead, provider)  → Lead to Trusted Services partner
sendPartnerPaymentEmail(email, company, contact, checkoutUrl)  → Stripe approval email
sendLeadNotification(leadId, partnerId)  → Internal routing notification
```
All templates use `platform` config for branding. Zero hardcoded platform names.

### `server/lead-escalation.ts` — Escalation timer
```
startEscalationTimer()  → Runs every 5 minutes
  → Finds routed leads with delivery_status=pending older than threshold
  → Re-routes to next available partner
  → Increments escalation_count
  → Stops escalating at escalation_count >= 3
```

### `server/geocode.ts` — Location services
```
geocodeAddress(address, city, state, zip)
  → OpenStreetMap Nominatim API (free, no key)
  → Returns {latitude, longitude, source}
  → Used for "Near Me" haversine distance sorting

haversineDistance(lat1, lon1, lat2, lon2)
  → Returns distance in miles
  → Used to sort resources by proximity to user
```

### `server/pg-client.ts` — Neon direct connection
```typescript
import { query as pgQuery } from "./pg-client";
// Usage:
const rows = await pgQuery("SELECT * FROM trusted_services WHERE id = $1", [id]);
```
Never use supabaseAdmin for trusted_services, trusted_service_categories, trusted_service_leads, partner_applications, veteran_owned_businesses.

### `server/ai/` — AI Guide engine (5 files)

**`config.ts`** — All AI settings:
- Model: GPT-4o
- System prompt template (reads from platform config)
- Crisis keywords list
- Blocked topics list
- Category keywords for resource matching
- Rate limits: 30/hr authenticated, 10/hr guest

**`engine.ts`** — Orchestrator:
1. Safety check (crisis detection, blocked topics)
2. Resource matching (keyword + text search)
3. Prompt building (system prompt + matched resources + user context)
4. OpenAI streaming (SSE to frontend)
5. Usage logging

**`resource-matcher.ts`** — Finds relevant resources:
- Hybrid: category keyword match + text search across title, description, city, eligibility, source_name
- Returns top matches for injection into AI prompt

**`safety.ts`** — Crisis detection:
- Returns `{isCrisis: bool, isBlocked: bool, crisisMessage?: string}`
- Crisis → injects 988 / crisis resources
- Blocked → returns polite refusal

**`rate-limiter.ts`** — Per-user/IP rate limiting in memory
**`stream.ts`** — OpenAI SSE wrapper
**`usage-logger.ts`** — Logs to `ai_usage_log` table

---

## 7. Frontend Pages

All pages in `client/src/pages/`. Key pages:

| File | Route | Purpose |
|---|---|---|
| `landing.tsx` | `/` | Auto-redirects to /onboarding or /home |
| `onboarding.tsx` | `/onboarding` | 3-step: Welcome → Account/Guest → Location |
| `home.tsx` | `/home` | Dashboard: AI guide, category grid, quick actions |
| `resources.tsx` | `/resources` | Resource library: category → location filter → list |
| `saved-resources.tsx` | `/saved-resources` | Bookmarked resources |
| `submit-resource.tsx` | `/submit-resource` | Public resource submission form |
| `trusted-services.tsx` | `/trusted-services` | Paid partner directory (category grid → listings) |
| `partner-apply.tsx` | `/partner-apply` | Public partner application form (plan selection + Stripe) |
| `partner-payment-success.tsx` | `/partner-payment-success` | Post-Stripe-checkout confirmation |
| `vob-directory.tsx` | `/vob` | Veteran-Owned Business public directory |
| `vob-directory-apply.tsx` | `/vob/apply` | VOB application form |
| `vob-startup-help.tsx` | `/vob/start` | VOB startup roadmap (monetization-ready partner slots) |
| `near-me.tsx` | `/near-me` | Proximity-sorted resources (haversine) |
| `not-found.tsx` | `*` | 404 page |

### Key frontend utilities:

**`client/src/lib/store.ts`** — Zustand store
```typescript
// Stores: stateCode, state (name), city, zip, savedResourceIds, userProfile
// Storage key from platform.storageKey — change per platform
```

**`client/src/lib/category-config.ts`** — Maps slugs to icons/colors
```typescript
// Add new categories here when adding to a new platform
// Maps: slug → { icon, color, label, description }
```

**`client/src/components/layout.tsx`** — App shell
- Top bar with logo, auth button, admin shortcut
- Bottom navigation (5 tabs from platform.nav.bottomTabs)
- AI Guide drawer listener

---

## 8. Admin Panel Modules

Admin is key-protected via `ADMIN_KEY` environment variable + `x-admin-key` header. All admin pages use `localStorage.getItem("adminKey")`.

### Admin pages and their purpose:

| Page | Route | Data Source | Purpose |
|---|---|---|---|
| `admin-resources.tsx` | `/admin` | Supabase `resources` | Review/approve/edit resources; contains embedded tabs for Navigator Requests, Routing Partners, and a duplicate Applications view |
| `admin-analytics.tsx` | `/admin/analytics` | Supabase clicks/requests | Clicks by category/state, top resources, navigator stats |
| `admin-ai-insights.tsx` | `/admin/ai-insights` | Supabase `ai_usage_log` | AI usage, tokens, cost, crisis triggers, resource gaps |
| `admin-trusted-services.tsx` | `/admin/trusted-services` | Neon `trusted_services` | Manage paying Trusted Services partners (activate, feature, edit) |
| `admin-trusted-service-leads.tsx` | `/admin/trusted-service-leads` | Neon `trusted_service_leads` | Monitor veteran→partner contact requests |
| `admin-partner-prospects.tsx` | `/admin/partner-prospects` | Neon `partner_applications` | Approve/reject partner applications, trigger Stripe payment link |
| `admin-vob.tsx` | `/admin/vob` | Neon `veteran_owned_businesses` | Review/approve VOB directory submissions |

### Admin authentication pattern (copy exactly):
```typescript
const adminKey = localStorage.getItem("adminKey") || "";
const isAdmin = !!adminKey;

// In fetch calls:
headers: { "x-admin-key": adminKey }

// Backend validation:
function requireAdmin(req, res, next) {
  if (req.headers["x-admin-key"] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
```

---

## 9. API Endpoints — Complete Reference

### Public endpoints (no auth required):

```
GET  /api/categories
GET  /api/resources?category=<slug>&state=<code>&city=<name>&zip=<zip>&q=<search>&lat=<lat>&lng=<lng>
GET  /api/resources/:id
GET  /api/locations/cities?state=<code>&category=<slug>
GET  /api/locations/zips?state=<code>&city=<name>&category=<slug>
POST /api/submit-resource                    → rate-limited 5/hr/IP
POST /api/track-click
POST /api/report-resource
POST /api/navigator-request                 → rate-limited 5/hr/IP
POST /api/ai/chat                           → SSE stream
GET  /api/states/active
GET  /api/trusted-services/categories
GET  /api/trusted-services?category=<slug>&state=<code>
GET  /api/trusted-partners-for-category/:resourceSlug
POST /api/trusted-service-leads
GET  /api/partner-categories
POST /api/partner-applications
GET  /api/vob?state=<code>&category=<slug>&q=<search>
POST /api/vob/apply
```

### Authenticated endpoints (Supabase JWT):
```
GET   /api/profile
POST  /api/profile
PATCH /api/profile
POST  /api/saved-resources/sync
```

### Admin endpoints (x-admin-key header):
```
GET   /api/admin/resources?status=<>&q=<>
POST  /api/admin/resources
PATCH /api/admin/resources/:id
POST  /api/admin/resources/csv-import
GET   /api/admin/resources/csv-template
GET   /api/admin/resources/csv-export
POST  /api/admin/resources/duplicate-check
POST  /api/admin/resources/cleanup-duplicates
POST  /api/admin/resources/:id/geocode

GET   /api/admin/navigator-requests?status=<>
PATCH /api/admin/navigator-requests/:id
POST  /api/admin/leads/:id/reroute

GET   /api/admin/partners
POST  /api/admin/partners
PATCH /api/admin/partners/:id
DELETE /api/admin/partners/:id
GET   /api/admin/partners/:id/rules
POST  /api/admin/partners/:id/rules
PATCH /api/admin/partner-rules/:id
DELETE /api/admin/partner-rules/:id

GET   /api/admin/states
POST  /api/admin/states
PATCH /api/admin/states/:code
POST  /api/admin/states/:code/refresh-counts
POST  /api/admin/states/:code/clone-resources

GET   /api/admin/trusted-services?category_id=<>&is_active=<>
GET   /api/admin/trusted-services/categories
POST  /api/admin/trusted-services
PATCH /api/admin/trusted-services/:id
DELETE /api/admin/trusted-services/:id
PATCH /api/admin/trusted-services/:id/show-in-trusted-services

GET   /api/admin/trusted-service-leads?status=<>
PATCH /api/admin/trusted-service-leads/:id

GET   /api/admin/partner-applications?status=<>&state=<>
PATCH /api/admin/partner-applications/:id
DELETE /api/admin/partner-applications/:id
POST  /api/admin/partner-applications/:id/approve
POST  /api/admin/partner-applications/:id/convert

GET   /api/admin/vob?status=<>
PATCH /api/admin/vob/:id

GET   /api/admin/analytics
GET   /api/admin/ai-insights
GET   /api/admin/user-profiles

POST  /api/stripe/webhook                   → no auth, Stripe signature verified
POST  /api/stripe/verify-session
```

---

## 10. Email System

**Provider:** Resend (`RESEND_API_KEY`)
**From address:** `RESEND_FROM_EMAIL` (e.g., `noreply@veterancare.com`)

**4 email types — all in `server/lead-email.ts`:**

1. **Navigator Lead Notification** — sent to routing partner when a Navigator Request is assigned to them. Contains: veteran contact info, message, urgency level, preferred contact method, category.

2. **Trusted Service Lead Notification** — sent to Trusted Services partner when a veteran clicks "Connect" on their listing. Contains: veteran name, email, phone, city, state, role, message.

3. **Partner Payment Email** — sent to applicant when admin approves their application. Contains: approval message, Stripe checkout link button, what happens next.

4. **Escalation notification** — internal only, logs to console (email not yet implemented for escalation).

**All email templates read from `platform` config** — zero hardcoded platform names. When forking, just update `platform.email.*` fields.

---

## 11. AI Guide System

**Model:** OpenAI GPT-4o
**Endpoint:** `POST /api/ai/chat`
**Response type:** Server-Sent Events (SSE stream)

### Request format:
```json
{
  "messages": [{"role": "user", "content": "I need help with housing"}],
  "userState": "SC",
  "userCity": "Charleston",
  "userZip": "29401",
  "interests": ["housing", "employment"],
  "branch": "Army"
}
```

### Response stream events:
```
data: {"type": "resource_match", "resources": [...]}
data: {"type": "chunk", "content": "Here are some..."}
data: {"type": "done"}
```

### Safety system:
- Crisis keywords trigger → injects 988 Lifeline + crisis resources + crisis message
- Blocked topics → polite refusal ("I'm not able to help with that")
- Neither → normal resource-matched response

### Resource matching:
1. Extract category keywords from user message
2. Search resources by category + keyword match
3. Search resources by text (title, description, city, eligibility, source_name)
4. Inject top 5 matches into system prompt as context

### Rate limits (in-memory, resets on server restart):
- Authenticated users: 30 requests/hour
- Guests: 10 requests/hour

### To customize for new platform:
- Update crisis keywords in `server/ai/config.ts`
- Update blocked topics in `server/ai/config.ts`
- Update category keywords mapping in `server/ai/config.ts`
- Update system prompt template in `server/ai/config.ts`
- Update `platform.ai.assistantName` and `platform.ai.welcomeMessage`

---

## 12. Stripe Subscription System

**Two-tier pricing (as of March 2026):**
- State Plan: $99/month — listed in one state
- National Plan: $499/month — listed in all states

### Flow (end-to-end):

```
1. Applicant fills form at /partner-apply
   → Selects plan_type: "state" or "national"
   → If state plan: selects their state (required)
   → If national plan: state hidden, "All States" shown
   → Submits → saved to partner_applications with status=prospect

2. Admin reviews at /admin/partner-prospects
   → Sees application with plan_type, category, state
   → Clicks "Approve & Send Payment Link"
   → Backend calls createPartnerCheckoutSession()

3. Stripe checkout session created
   → plan_type=state  → uses STRIPE_PARTNER_PRICE_ID_STATE
   → plan_type=national → uses STRIPE_PARTNER_PRICE_ID_NATIONAL
   → plan_type=null → uses STRIPE_PARTNER_PRICE_ID (legacy)
   → Partner receives email with "Activate My Listing" button

4. Partner pays → Stripe fires checkout.session.completed webhook

5. Webhook handler (POST /api/stripe/webhook)
   → Updates partner_applications: status=active
   → Creates row in trusted_services (if not already exists)
   → Sets trusted_services.is_active=true
   → Partner listing goes LIVE in public directory

6. Subscription events:
   → subscription.deleted → partner_applications status=inactive, trusted_services.is_active=false
   → invoice.payment_failed → same deactivation
   → subscription.updated (past_due/unpaid/canceled) → same deactivation
```

### What to set up in Stripe for a new platform:
1. Create two products in Stripe (one per plan tier)
2. Set each to recurring monthly billing
3. Copy the `price_` IDs (NOT `prod_` IDs)
4. Add to Replit secrets as `STRIPE_PARTNER_PRICE_ID_STATE` and `STRIPE_PARTNER_PRICE_ID_NATIONAL`
5. Set up Stripe webhook pointing to `https://yourdomain.com/api/stripe/webhook`
6. Webhook events to listen for: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`, `invoice.payment_failed`
7. Copy the webhook signing secret → save as `STRIPE_WEBHOOK_SECRET`

### Test mode:
- Create products in Stripe Test mode first
- Test card: `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP
- Switch to Live mode only when ready for real payments
- Live mode requires new price IDs (same product names, new `price_` values)

---

## 13. Lead Routing System

**Two separate lead types — often confused:**

### Type 1: Navigator Requests
- Source: veteran clicks "Connect with a Navigator" on any page
- Stored: Supabase `navigator_requests`
- Routed to: `partner_organizations` (routing partners) via `partner_routing_rules`
- Routing engine: `server/lead-router.ts`
- Auto-routed on submit, can be manually rerouted by admin

### Type 2: Trusted Service Leads
- Source: veteran clicks "Connect" on a specific Trusted Services provider listing
- Stored: Neon `trusted_service_leads`
- Sent to: the specific provider they clicked on (no routing engine, direct assignment)
- Email sent via: `sendTrustedServiceLeadNotification()`

### Routing logic (Navigator Requests only):

The router finds the best matching `partner_routing_rules` entry by scoring:
- Matching `category_slug` = +4 specificity
- Matching `subcategory` = +2 specificity
- Matching `urgency` = +1 specificity
- Matching `state` = +2 specificity
- Matching `city` = +2 specificity

Sort: lowest `priority` number first, then highest specificity score.

**Why "No matching partner found" happens:**
1. No routing rules exist for the lead's category
2. The lead's city/state doesn't match any rule's geographic filter
3. All matching partners have hit their daily lead cap
4. All matching partners have `is_active=false` or `is_lead_enabled=false`

**To fix routing for a new platform:**
- Create `partner_organizations` entries for each service partner
- Create `partner_routing_rules` entries mapping each partner to the categories/states they cover
- A rule with no `category_slug` = matches all categories for that partner

---

## 14. Environment Variables — Complete Reference

```
# Supabase
SUPABASE_URL=                      # From Supabase project settings → API
SUPABASE_ANON_KEY=                 # From Supabase project settings → API
SUPABASE_SERVICE_ROLE_KEY=         # From Supabase project settings → API (keep secret)

# Neon (direct PostgreSQL)
DATABASE_URL=                      # From Neon project → Connection string (postgres://...)

# OpenAI
OPENAI_API_KEY=                    # From platform.openai.com

# Email
RESEND_API_KEY=                    # From resend.com dashboard
RESEND_FROM_EMAIL=                 # Verified sender (e.g., noreply@veterancare.com)

# Admin
ADMIN_KEY=                         # Any secret string — used to protect /admin routes

# Stripe
STRIPE_SECRET_KEY=                 # From Stripe → Developers → API keys (sk_test_... or sk_live_...)
STRIPE_PARTNER_PRICE_ID_STATE=     # price_... for State Plan ($99/month)
STRIPE_PARTNER_PRICE_ID_NATIONAL=  # price_... for National Plan ($499/month)
STRIPE_PARTNER_PRICE_ID=           # Legacy fallback (old single-tier — keep until all apps migrated)
STRIPE_WEBHOOK_SECRET=             # From Stripe → Developers → Webhooks → signing secret (whsec_...)

# Optional
APP_URL=                           # Override for Stripe success/cancel URLs (e.g., https://veterancare.com)
```

**Per-platform:** Every platform needs its own set of ALL secrets. Never share secrets between platforms.

---

## 15. Trusted Services & Products System

This is the paid partner directory — the monetization layer.

### Public flow:
1. User visits `/trusted-services`
2. Sees category grid (8 categories: Housing, Legal, Financial, Insurance, Education, Employment, Benefits, Wellness)
3. Clicks a category → sees active providers
4. Can filter by state
5. Clicks "Connect" → submits `trusted_service_leads` → provider receives email

### Partner onboarding flow:
1. Partner visits `/partner-apply`
2. Selects plan (State $99/month or National $499/month)
3. Fills company details, category, service description
4. Admin approves → Stripe payment link sent
5. Partner pays → listing goes live automatically (webhook)

### VOB cross-listing:
Veteran-Owned Businesses (from `/vob/apply`) can be surfaced in Trusted Services via a UNION query if:
- `veteran_owned_businesses.status = 'approved'`
- `veteran_owned_businesses.show_in_trusted_services = true`
- `veteran_owned_businesses.category_id IS NOT NULL`

This allows free VOB listings to appear alongside paid Trusted Services partners. Admin controls the toggle per VOB entry.

### VOB → Roadmap partner slots:
The `/vob/start` roadmap page has `partnerSlots` that map roadmap steps to `trusted_service_categories.slug`. When a live Trusted Services partner exists in a matching category, they auto-appear as "Recommended Partner" in the roadmap step. If no partner exists, a "Coming Soon" badge shows instead.

---

## 16. Veteran-Owned Business Directory

**Public pages:** `/vob`, `/vob/apply`, `/vob/start`
**Admin page:** `/admin/vob`
**Table:** Neon `veteran_owned_businesses`

### Submission flow:
1. Business owner fills `/vob/apply` (free, no payment)
2. Saved with `status=pending`
3. Admin reviews at `/admin/vob`
4. Admin approves → `status=approved`, business appears in `/vob`
5. Admin can optionally toggle `show_in_trusted_services=true` → business appears in Trusted Services directory with "Veteran-Owned" badge via UNION query

---

## 17. Location & Geocoding

### How user location is stored:
- Zustand store (`client/src/lib/store.ts`)
- Keys: `stateCode` (e.g., "SC"), `state` (e.g., "South Carolina"), `city`, `zip`
- Persisted in `localStorage` under `platform.storageKey`

### How "Near Me" works:
1. Browser geolocation API → lat/lng
2. Nominatim reverse geocode → city, state, zip
3. Resources queried with user's state filter
4. Sorted by haversine distance (lat/lng stored on each resource)
5. Resources without coordinates sorted to end

### Geocoding resources:
- Admin can trigger geocoding for all resources missing lat/lng
- Uses Nominatim (OpenStreetMap) — free, no API key, rate-limited to 1 req/sec
- Results stored in `resources.latitude`, `resources.longitude`, `resources.geo_source`, `resources.geocoded_at`

---

## 18. Multi-State Scaling

The platform is designed to serve multiple states from day one.

### How it works:
- Resources with `state=SC` only appear for SC users
- Resources with `state=NULL` are "national" — appear for all states
- When a new state is added, national resources auto-populate immediately
- State-specific resources require a data load session (~60–90 min per state)

### State management (Supabase `states` table):
```
code TEXT UNIQUE    -- e.g., "SC"
name TEXT           -- e.g., "South Carolina"
is_active BOOLEAN   -- controls whether state appears in filters
```

### Adding a new state:
1. Admin: `POST /api/admin/states` with `{code: "GA", name: "Georgia"}`
2. Optional: Clone national resources to new state: `POST /api/admin/states/GA/clone-resources`
3. Load state-specific resources via CSV import
4. Set state `is_active=true`
5. National resources auto-appear immediately

---

## 19. RLS & Security

### Supabase Row Level Security:
RLS is enabled on all Supabase tables. Policies:
- **Public read** on: `resources` (status=approved), `categories`, `states` (is_active=true)
- **Service role only** write on: all tables
- Server always uses `supabaseAdmin` (service role) — bypasses RLS at runtime

### Admin protection:
- All `/api/admin/*` routes require `x-admin-key` header matching `ADMIN_KEY` env var
- Frontend stores key in `localStorage` — clears on sign out
- No user auth required for admin — single shared key

### Supabase Auth:
- Used for user profiles and saved resources only
- Supabase email/password auth
- JWT validated server-side via `supabaseForUser(token)` client
- Leaked password protection: enabled (Pro plan required)
- Minimum password length: 8 characters

---

## 20. What to Change Per Platform vs. What to Copy Exactly

### CHANGE for each new platform:
- `shared/platform.ts` — ALL fields (name, domain, userNoun, AI config, email config, profileFields)
- `client/index.html` — meta title, og:title, og:description, twitter:title, twitter:description
- Logo files in `client/public/`
- Supabase project (new URL, new keys)
- Neon database (new DATABASE_URL)
- Stripe products and price IDs
- ADMIN_KEY
- RESEND_FROM_EMAIL
- Resource categories (new platform's categories loaded into Supabase `categories`)
- Resources (loaded per-state via CSV import)
- Trusted service categories (8 categories for new platform's Trusted Services section)

### COPY EXACTLY (no changes needed):
- `server/lead-router.ts` — routing logic is platform-agnostic
- `server/lead-escalation.ts` — escalation logic is platform-agnostic
- `server/geocode.ts` — geocoding is platform-agnostic
- `server/stripe-service.ts` — Stripe flow is platform-agnostic
- `server/ai/engine.ts`, `stream.ts`, `rate-limiter.ts`, `usage-logger.ts` — AI engine is platform-agnostic
- `server/pg-client.ts` — DB client is platform-agnostic
- All Neon table schemas (trusted_services, partner_applications, etc.)
- All Supabase table schemas (resources, navigator_requests, etc.)
- All admin pages (admin-resources, admin-analytics, admin-ai-insights, etc.)
- All API endpoint logic

### CUSTOMIZE (platform-specific content but same structure):
- `server/ai/config.ts` — update crisis keywords, blocked topics, category keywords, system prompt for new user type
- `server/ai/safety.ts` — update crisis resources (veterans → 988; inmates → different crisis line)
- `client/src/lib/category-config.ts` — update category slugs, icons, colors for new platform's categories
- `client/src/pages/onboarding.tsx` — profile field labels match new platform's `profileFields`
- `client/src/pages/home.tsx` — update category display, quick action buttons

---

## 21. Known Gaps & Future Work

### Gaps identified as of March 2026:

**Location ranking (Trusted Services & Products):**
- Resources "Near Me" → haversine proximity ranking ✅
- Trusted Services → state filter only, no proximity sort ❌
- VOB directory → state filter only, no proximity sort ❌
- Roadmap partner slots → no location context at all ❌

**Admin panel:**
- `pricing_interest` field still shows in admin UI — should be removed (replaced by plan_type)
- `plan_type` (State/National) not visible in admin partner application cards yet
- Navigator Requests routing only works for SC Housing — needs more partner/rule coverage
- Admin module naming is confusing (Partners vs. Applications vs. Partner Leads)
- Missing search/filters in most admin modules

**Routing:**
- Only 3 routing partners exist, all SC Housing — other categories always fail routing
- Needs routing partners for: legal, financial, mental health, employment, benefits per state

**Multi-state:**
- SC is the only active state with real resources
- National resources (NULL state) exist as fallback for all states
- GA, NC, FL are structural next states but have no data yet

**Features not yet built:**
- Community tab (placeholder page exists)
- Shop tab (placeholder page exists)
- Partner-facing login portal (partners currently can't log in to see their own leads)
- Real-time escalation email notifications

---

*This document is stored at `PLATFORM_TEMPLATE.md` in the project root. Update it whenever significant architectural changes are made.*
