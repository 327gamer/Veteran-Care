# Veteran Care

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
- `client/src/pages/trusted-services.tsx` - Public Trusted Services page (category grid → provider listings)
- `client/src/pages/admin-trusted-services.tsx` - Admin partner management (add/edit/activate/deactivate/feature)
- `supabase/create_resource_clicks.sql` - SQL to create click tracking table in Supabase
- `supabase/create_trusted_services.sql` - SQL to create trusted_service_categories and trusted_services tables
- `supabase/create_trusted_service_leads.sql` - SQL to create trusted_service_leads table for lead capture
- `client/src/pages/admin-trusted-service-leads.tsx` - Admin lead management (view/filter/update status)

## API Endpoints
- `GET /api/categories` - Returns categories from Supabase (id, name, slug)
- `GET /api/resources?category=<slug>&state=<state>&city=<city>&zip=<zip>&q=<search>` - Returns approved resources filtered by category slug, state, city, ZIP, and/or search query; search matches title, short_description, city, state, eligibility, source_name via ILIKE
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
- `/admin` - Admin resource review dashboard (key-protected, standalone layout)
- `/admin/analytics` - Admin analytics dashboard
- `/admin/ai-insights` - AI Insights dashboard (conversations, tokens, cost, crisis, gaps)
- `/community` - Community feed (coming soon)
- `/shop` - Shop page (coming soon)
- `/near-me` - Location-based nearby resources

## Design Decisions
- App name: "Veteran Care" (two words) — configured in shared/platform.ts
- Logo: `Veteran_Care_-_Shadow_-_PNG_1772598034200.png` (metallic dog tag)
- Green color scheme throughout
- Mobile-first, single-screen layouts for onboarding
- Crisis Help always shown first in resource lists
- Location filtering via Zustand store (stateCode, state, city, zip)
- Auto-geolocation via browser + OpenStreetMap Nominatim reverse geocoding (cached 1hr in localStorage)
- All platform branding reads from shared/platform.ts — zero hardcoded platform names in components
