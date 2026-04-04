# Veteran Care

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
2. Test it
3. Commit it
4. Publish it
Never bundle multiple onboarding/profile/navigation changes together.

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
- `server/ai/resource-matcher.ts` - Hybrid keyword + text search across 5 resource fields
- `server/ai/prompt-builder.ts` - Builds system prompt with user context + matched resources
- `server/ai/safety.ts` - Crisis keyword detection, blocked topic filter
- `server/ai/rate-limiter.ts` - Per-user/guest rate limiting (30/hr auth, 10/hr guest)
- `server/ai/stream.ts` - OpenAI chat completions streaming wrapper
- `server/ai/usage-logger.ts` - Logs AI usage to ai_usage_log table (graceful if missing)
- `server/stripe-service.ts` - Stripe subscription workflow (checkout sessions, webhook handlers, auto-activation/deactivation)
- `server/pg-client.ts` - Direct PostgreSQL client (bypasses Supabase PostgREST for trusted_services, trusted_service_categories, trusted_service_leads, partner_applications — NEVER use supabaseAdmin for these tables)

## Multi-Category Support
Resources can belong to multiple categories via the `resource_categories` junction table in Supabase:
- **Junction table**: `resource_categories(resource_id, category_id)` — composite PK
- **Legacy `category_id`**: Still on resources table for backward compat; kept in sync as the "primary" category
- **Query pattern**: Use `resource_categories!inner(categories!inner(...))` when filtering by category slug; use `resource_categories(categories(...))` when loading all categories
- **Normalization**: `normalizeResourceCategories()` and `normalizeResourceList()` in routes.ts convert junction table shape to flat `categories` field (single object for 1 category, array for multiple)
- **Admin APIs**: `GET/PUT /api/admin/resources/:id/categories` for managing category assignments
- **Admin UI**: Primary category dropdown + additional category toggle chips in edit form

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

## Design Decisions
- App name: "Veteran Care" (two words) — configured in shared/platform.ts
- Logo: `Veteran_Care_-_Shadow_-_PNG_1772598034200.png` (metallic dog tag)
- Green color scheme throughout
- Mobile-first, single-screen layouts for onboarding
- Crisis Help always shown first in resource lists
- Location filtering via Zustand store (stateCode, state, city, zip)
- Auto-geolocation via browser + OpenStreetMap Nominatim reverse geocoding (cached 1hr in localStorage)
- All platform branding reads from shared/platform.ts — zero hardcoded platform names in components
