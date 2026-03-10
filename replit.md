# Veteran Care

## Overview
A comprehensive mobile-first web app for U.S. Military veterans consolidating 11+ resource categories with AI-guided assistance, location-based filtering, community feed, and persistent resource saving.

## Architecture
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui components, wouter routing
- **Backend**: Express.js server
- **External Database**: Supabase (PostgreSQL) via `@supabase/supabase-js`
- **State Management**: Zustand (client-side)

## Key Files
- `server/supabase.ts` - Supabase client initialization
- `server/routes.ts` - API endpoints (prefixed with `/api`)
- `server/storage.ts` - In-memory storage interface (legacy, for local data)
- `shared/schema.ts` - Drizzle schema definitions
- `client/src/pages/` - Page components (landing, onboarding, home, resources, etc.)
- `client/src/pages/submit-resource.tsx` - Community resource submission form
- `client/src/pages/admin-resources.tsx` - Admin review dashboard (key-protected)
- `client/src/lib/store.ts` - Zustand store (saved resources, user location)
- `client/src/lib/resources-data.ts` - Static resource data + ResourceItem interface
- `client/src/lib/category-config.ts` - Maps Supabase category slugs to icons, colors, and descriptions
- `client/src/components/layout.tsx` - App shell with top bar, bottom nav, and AI guide listener
- `client/src/components/resource-detail.tsx` - Rich resource detail sheet with click tracking
- `supabase/create_resource_clicks.sql` - SQL to create click tracking table in Supabase

## API Endpoints
- `GET /api/categories` - Returns categories from Supabase (id, name, slug)
- `GET /api/resources?category=<slug>&state=<state>&city=<city>&zip=<zip>&q=<search>` - Returns approved resources filtered by category slug, state, city, ZIP, and/or search query; search matches title, short_description, city, state, eligibility, source_name via ILIKE
- `GET /api/resources/:id` - Returns a single resource by UUID
- `GET /api/locations/cities?state=<code>&category=<slug>` - Returns distinct city names from approved resources
- `GET /api/locations/zips?state=<code>&city=<name>&category=<slug>` - Returns distinct ZIP codes from approved resources
- `POST /api/submit-resource` - Creates a new resource with status=pending; includes duplicate detection (website_url, phone, title+city+state), rate limiting (5/hr/IP), and input validation
- `POST /api/track-click` - Logs user interactions with location context (user_state, user_city fallback from resource if store empty)
- `POST /api/report-resource` - Creates a pending admin review item with report note in notes_internal; sets resource status back to pending
- `POST /api/navigator-request` - Veteran submits request for navigator help (rate-limited 5/hr/IP, requires name + phone or email)
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
- `GET /api/profile` - Auth'd: get current user's profile (returns `{profile: null}` if no profile yet)
- `POST /api/profile` - Auth'd: create/upsert user profile (first_name, last_name, email, phone, user_type required; branch_of_service, interests, state, city, zip optional; sets profile_complete=true if enrichment data provided)
- `PATCH /api/profile` - Auth'd: update profile fields
- `GET /api/admin/user-profiles?user_type=&state=&profile_complete=&limit=` - Admin: list user profiles with filters
- `GET /api/admin/analytics` - Admin: analytics dashboard data (clicks by category/state/city, top resources, affiliate vs non-affiliate, reported resources, navigator request stats)

## Supabase Tables
- `categories` - id (uuid), name, slug
- `resources` - id (uuid), category_id (fk→categories), title, short_description, website_url, phone, email, address, city, state, zip, eligibility, source_name, source_type, last_verified, monetization_type, affiliate_url, sponsored (bool), status (text: pending/approved/rejected), submitted_by_name, submitted_by_email, notes_internal, is_featured (bool), featured_rank (int), last_verified_at, latitude (float8), longitude (float8), geo_source (text), geocoded_at (timestamptz), created_at
- `resource_clicks` - id (uuid), resource_id (fk→resources), click_type (text), user_state, user_city, user_zip (text), created_at (SQL in `supabase/create_resource_clicks.sql`)
- `navigator_requests` - id (uuid), resource_id, resource_title, veteran_name, veteran_phone, veteran_email, message, preferred_contact, user_state, user_city, user_zip, status (new/in_progress/resolved/cancelled), admin_notes, created_at, urgency, source, utm_source/medium/campaign, assigned_to, contacted_at, resolved_at, outcome, consent_followup, routed_to_partner_id (fk→partner_organizations), routed_at, delivery_status, partner_outcome, closed_at, escalation_count, routing_history (jsonb) (SQL in `supabase/create_navigator_requests.sql`)
- `partner_organizations` - id (uuid), name, contact_name, contact_email, contact_phone, website_url, state, cities (text[]), is_active, is_lead_enabled, notes, created_at (SQL in `supabase/create_partner_organizations.sql`)
- `partner_routing_rules` - id (uuid), partner_id (fk→partner_organizations), category_slug, subcategory, urgency, state, city, priority (int), max_leads_per_day (int), is_active, created_at (SQL in `supabase/create_partner_organizations.sql`)
- `states` - code (TEXT UNIQUE), name (TEXT), active (BOOLEAN), created_at; full schema adds: id (UUID), is_active, is_template, launch_date, timezone, admin_contact_name, admin_contact_email, config (JSONB), resource_count, partner_count (SQL in `supabase/create_states.sql`)
- `user_profiles` - id (UUID PK, fk→auth.users), first_name, last_name, email, phone, user_type (veteran/spouse_family/dependent/caregiver_advocate/other), consent_contact (bool), branch_of_service, interests (text[]), service_area, state, city, zip, profile_complete (bool), created_at, updated_at (SQL in `supabase/create_user_profiles.sql`)

## Environment Variables (Secrets)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `ADMIN_KEY` - Secret key for admin resource review access
- `RESEND_API_KEY` - Resend email service API key (for partner lead notifications)
- `RESEND_FROM_EMAIL` - (optional) Override sender address; defaults to `Veteran Care <onboarding@resend.dev>`

## Routes (Frontend)
- `/` - Landing (auto-redirects to /onboarding or /home based on state)
- `/onboarding` - 3-step onboarding: Welcome → Location → Interests
- `/home` - Main dashboard (with first-time welcome message, service profile prompt, nav tutorial)
- `/resources` - Resource library with category browsing and location filter
- `/saved-resources` - Saved/bookmarked resources
- `/submit-resource` - Community resource submission form
- `/admin` - Admin resource review dashboard (key-protected, standalone layout)
- `/admin/analytics` - Admin analytics dashboard (clicks, categories, states, cities, top resources, reports)
- `/community` - Community feed
- `/shop` - Shop page
- `/near-me` - Location-based nearby resources

## Design Decisions
- App name: "Veteran Care" (two words)
- Logo: `Veteran_Care_-_Shadow_-_PNG_1772598034200.png` (metallic dog tag)
- Green color scheme throughout
- Mobile-first, single-screen layouts for onboarding
- Crisis Help always shown first in resource lists
- Location filtering via Zustand store (stateCode, state, city, zip)
- Auto-geolocation via browser + OpenStreetMap Nominatim reverse geocoding (cached 1hr in localStorage)
- City/ZIP autocomplete suggestions from approved resource data
- National fallback: when location filter returns 0 results, shows national resources with amber notice
- "Local only" toggle (default OFF): when ON, no fallback, shows clean empty state
- Near Me: server-side Nominatim geocoding (`server/geocode.ts`) + Haversine distance; bounding box pre-filter, exact distance sort; includes national resources after local results; radius options: 10/25/50/100 mi (default 25)
- Location toggle: All (national) / Near Me (geo-based) / By State (manual state/city/zip); "Use My Location" button in By State mode
- veterancare.com (Duda) acts as marketing front door; this Replit app is the functional product
- Admin page uses standalone layout (no bottom nav) with its own header
- Resource submissions default to status=pending; only approved resources show publicly

## Resource Detail View
- Rich sheet modal with sections: Overview, Eligibility, Contact, Preparation checklist, Local Assistance, Help (Ask Guide), Actions
- Primary actions: Call, Directions, Apply/Get Help
- Secondary actions: Official Website, Save/Favorite, Share, Report
- Website clicks are secondary (keep users on-platform)
- Sponsored resources display amber "Sponsored" badge in list and detail views
- "Ask Guide" dispatches custom event to open AI Guide modal from Layout
- Click tracking logs all interactions via POST /api/track-click
- Navigator lead capture form (name, phone/email, message, preferred contact) — always visible on every resource
- Admin "Navigator Leads" tab for managing submitted requests (new/contacted/completed/cancelled)

## Click Tracking
- All key actions tracked: website_click, call_click, directions_click, guide_click, save_click, share_click, report_click, apply_click
- Tracks resource_id, click_type, user_state, user_city, user_zip, timestamp
- Location priority: (A) store userLocation from geo/filter → (B) resource's own state/city/zip → (C) NULL
- Server gracefully falls back if user_zip column doesn't exist yet
- Table creation SQL provided in `supabase/create_resource_clicks.sql`
- To add user_zip column to existing table: `ALTER TABLE resource_clicks ADD COLUMN IF NOT EXISTS user_zip text;`

## Anti-Spam & Duplicate Detection
- Rate limiting: 5 submissions per hour per IP on /api/submit-resource
- Duplicate detection: blocks same website_url, same phone (normalized digits), or same title+city+state
- Input validation: title min 3 chars, category required, URL format check, phone digit length check
- Report system: POST /api/report-resource appends report note to notes_internal and sets status to pending for admin review
- Admin analytics: GET /api/admin/analytics aggregates clicks by category/state/city, top 20 resources, affiliate vs non-affiliate splits, reported resource list

## Onboarding & User State (Zustand persisted)
- `onboardingComplete` - set true after completing onboarding or clicking "I Already Have an Account" / "Try Demo"
- `interests` - array of selected interest categories from onboarding step 3
- `serviceProfile` - { branch, era, rank, mos } — populated via Service Profile dialog on home page
- `hasSeenWelcome` - legacy flag (no longer used in UI, kept for store compat)
- `hasSeenTutorial` - dismisses the first-time navigation tutorial overlay
- `chatHistory` - persisted array of { role, content, timestamp } for AI Guide conversation history
- Chat system centralized: all "Ask Guide" buttons dispatch `CustomEvent("open-ai-guide")`, Layout listens and opens AiGuide modal
- Tutorial system: "Learn How the App Works" dispatches `CustomEvent("open-tutorial")`, Layout listens and shows tutorial overlay
- Home welcome panel: always-visible AI Guide card with 4 action buttons (Ask Guide, Browse Resources, Request Support, How It Works)
- NavigatorModal (`client/src/components/navigator-modal.tsx`): shared modal used by both home page and resource detail; accepts optional `context` prop with resource_id/resource_title/category/subcategory; 11 help categories with dynamic subcategories; category required from home, auto-filled from resource detail
- Server route category/subcategory: tries inserting dedicated columns first; falls back to enriching `message` field with `Category: X | Subcategory: Y` prefix if columns don't exist in Supabase yet
- NOTE: Add `category TEXT` and `subcategory TEXT` columns to Supabase `navigator_requests` table when possible for cleaner data

## Key Files (Step 12)
- `client/src/pages/admin-analytics.tsx` - Admin analytics dashboard with charts and stats

## User Accounts + Saved Resources Sync (Step 18)
- **Auth**: Supabase Auth with email/password (client-side client in `client/src/lib/supabase.ts`)
- **Auth hook**: `client/src/lib/use-auth.ts` — session management, signUp, signIn, signOut
- **Auth UI**: `client/src/components/auth-modal.tsx` — two-step signup modal:
  - **Step 1**: First name, last name, email, phone, password, user type (all required), consent checkbox
  - **Step 2**: Branch of service, interests, state/location (optional, skippable)
  - **Login mode**: Email + password only
- **User types**: veteran, spouse_family, dependent, caregiver_advocate, other
- **Profile storage**: `user_profiles` table in Supabase (SQL in `supabase/create_user_profiles.sql`)
- **Profile API**: GET /api/profile, POST /api/profile, PATCH /api/profile (auth'd); GET /api/admin/user-profiles (admin)
- **Profile completion tracking**: `profile_complete` boolean — set to true when branch/interests/state provided
- **Onboarding flow**: Welcome → Create Account prompt (or Continue as Guest) → Location → Interests → Home
  - If user creates account, step 2 collects interests/location and goes to Home
  - If user continues as guest, existing location/interests onboarding continues
  - "I Already Have an Account" opens login modal
- **Guest banner**: Home page shows "Create a free account" banner for non-authenticated users
- **Profile dropdown**: Layout top bar profile button → dropdown with sign in/out
- **Supabase table `user_saved_resources`**: id, user_id (fk→auth.users), resource_id (fk→resources), saved_at; unique(user_id, resource_id); RLS policies for user-scoped access (SQL in `supabase/create_user_saved_resources.sql`)
- **Server routes**: `GET /api/saved-resources` (auth'd, returns saved IDs), `POST /api/saved-resources/sync` (merges localStorage IDs on first login), `POST /api/saved-resources/toggle` (save/unsave with auth)
- **Store sync**: On login, `syncSavedOnLogin()` merges localStorage savedIds into Supabase (one-time device migration via `deviceMigrated` flag), then Supabase becomes source of truth; `toggleSave()` optimistically updates localStorage and fires server toggle in background
- **Logged-out users**: Keep current localStorage-only behavior unchanged
- **Saved page**: Shows "Synced to your account" when logged in, "Saved on this device only" when logged out
- **Vite config**: Exposes `SUPABASE_URL` and `SUPABASE_ANON_KEY` to frontend via `define` block

## Resource Email Notifications
- **Column**: `resources.notify_email` (TEXT, nullable) — added via `supabase/add_notify_email.sql`
- **Server startup**: `checkNotifyEmailColumn()` probes for column; `hasNotifyEmailColumn` flag guards reads/writes
- **Fallback config**: `RESOURCE_NOTIFY_CONFIG` in `server/lead-email.ts` maps `source_name` → email (e.g. "Veteran Care" → info@veterancare.com); used when column doesn't exist or is null
- **Trigger**: When a navigator request is submitted with a `resource_id`, `sendResourceNotification()` is called async
- **Email template**: Branded "New Inquiry from Veteran Care" email with veteran contact info, category, urgency, message
- **Admin PATCH/POST/CSV**: `notify_email` included in allowed fields when column exists
- **File**: `server/lead-email.ts` — contains `sendResourceNotification()`, `buildResourceNotificationHtml()`, and `RESOURCE_NOTIFY_CONFIG`

## Service Priority
- **Column**: `resources.service_priority` (TEXT, nullable)
- **Valid values**: `immediate`, `same_week`, `standard`, `information` (validated on POST/CSV; null for invalid)
- **Server startup**: `checkServicePriorityColumn()` probes for column; `hasServicePriorityColumn` flag guards reads/writes
- **Dynamic select**: `resourceSelectFields()` conditionally includes `service_priority`
- **Admin editor**: Select dropdown (None / Immediate / Same Week / Standard / Information)
- **CSV import**: `service_priority` column supported in template and import logic
- **PATCH/POST**: Included in allowedFields / insertData when column exists
- **Purpose**: Urgency classification for future "Need Help Now" routing and smart recommendations

## Subcategories
- **Column**: `resources.subcategory` (TEXT, nullable) — added via Supabase SQL editor
- **Server startup**: `checkSubcategoryColumn()` probes for the column; if missing, `hasSubcategoryColumn=false` and subcategory fields are omitted from queries/writes
- **Dynamic select**: `resourceSelectFields()` conditionally includes `subcategory` based on `hasSubcategoryColumn`
- **Admin editor**: Subcategory text input below Category dropdown
- **CSV import**: `subcategory` column supported in template and import logic
- **PATCH**: `subcategory` included in allowedFields when column exists
- **POST**: `subcategory` included in insertData when column exists

## Step 21 — SC Resource Expansion
- **Housing Assistance batch 1**: 20 new SC resources imported
- **Cities covered**: Charleston, North Charleston, Columbia, Greenville, Spartanburg, Myrtle Beach, Little River, Loris, Summerville + 1 national hotline
- **Subcategories used**: Emergency Housing (2), Transitional Housing (5), Rent Assistance (4), Food Assistance (2), Homeless Veteran Services (7)
- **Service priorities**: immediate (10), same_week (7), standard (3)
- **Geocoded**: 19/20 (1 national hotline correctly excluded)
- **All resources**: Real verified organizations with official websites and phone numbers
- **Healthcare & Mental Health batch**: 23 new SC resources imported
  - Healthcare (9): VA Medical Centers (2), VA Clinics (6), Telehealth (1)
  - Mental Health (14): Vet Centers (4), Peer Support (4), PTSD Counseling (2), Substance Abuse Treatment (2), Crisis Support (2)
  - Cities: Charleston, North Charleston, Mount Pleasant, Goose Creek, Columbia, Greenville, Spartanburg, Myrtle Beach + national hotlines
- **VA Benefits batch**: 23 new resources imported
  - Subcategories: County Veterans Service Offices (7), Disability Claims Assistance (5), VA Enrollment Help (3), DD214 Help (2), PACT Act (2), Pension (2), Appeals (1), Survivor Benefits (1)
  - Cities: Columbia, North Charleston, Greenville, Spartanburg, Conway, Summerville, Moncks Corner, West Columbia, Charleston, Goose Creek, St. Louis + national
- **Employment & Job Training batch**: 22 new resources imported
  - Subcategories: Job Placement (7), Career Counseling (4), Entrepreneurship Support (4), Resume Assistance (2), Certification Programs (1), Apprenticeships (1), Skilled Trades Training (1), Federal Employment (1), State Employment (1)
  - Service priorities: standard (9), same_week (9), information (4)
  - Cities: Columbia (5), North Charleston (3), Charleston (3), Greenville (2), Spartanburg (1), Conway (1) + 7 national/online
  - Geocoded: 15/22 (7 national/online resources correctly without coordinates)
- **Legal Assistance batch**: 19 new resources imported
  - Subcategories: Legal Aid Services (6), Disability Claims Assistance (3), Discharge Upgrade Assistance (2), Veterans Legal Clinics (2), Pro Bono Legal Services (2), Military Records Assistance (1), Family Law Support (1), Landlord / Tenant Issues (1), VA Benefits Appeals (1)
  - Service priorities: standard (10), same_week (7), information (2)
  - Cities: Columbia (6), North Charleston (1), Greenville (1), Spartanburg (1), Conway (1), Charleston (1), St. Louis (1) + 7 national/statewide
  - Geocoded: 12/19 (7 national/statewide resources correctly without coordinates)
- **Financial Assistance batch**: 18 new resources imported
  - Subcategories: Emergency Financial Assistance (7), Utility Bill Assistance (5), Debt Counseling (2), Budgeting & Financial Planning (1), Nonprofit Financial Support (1), Benefits Counseling (1), Veteran Relief Funds (1)
  - Service priorities: immediate (8), same_week (6), standard (4)
  - Cities: Columbia (4), Charleston (2), Greenville (2), Spartanburg (2), Conway (1), Lexington (1) + 6 national/statewide
  - Geocoded: 12/18 (6 national/statewide resources correctly without coordinates)
- **Education batch**: 14 new resources imported
  - Subcategories: Veteran Student Services (5), Technical Colleges (5), Tuition Assistance (1), GI Bill Assistance (1), Education Counseling (1), Continuing Education (1)
  - Service priorities: standard (11), information (3)
  - Cities: Columbia (3), Conway (2), Charleston (2), North Charleston (1), Greenville (1), Spartanburg (1), Clemson (1) + 3 national/statewide
  - Geocoded: 11/14 (3 national/statewide resources correctly without coordinates)
- **Family Support batch**: 16 new resources imported
  - Subcategories: Military Family Support (5), Family Counseling (2), Caregiver Support (2), Spouse Employment Assistance (2), Childcare Assistance (1), Youth Programs (1), Parenting Programs (1), Gold Star Family Support (1), Survivor Benefits Support (1)
  - Service priorities: standard (7), same_week (5), immediate (2), information (2)
  - Cities: North Charleston (1), Columbia (1), Greenville (1) + 13 national/statewide
  - Geocoded: 3/16 (13 national/statewide resources correctly without coordinates)
  - Note: CSV import category field must use DB category name (e.g. "Family Support" not "Family") or slug (e.g. "family-support")
- **Transportation batch**: 14 new resources imported
  - Subcategories: Public Transit Assistance (6), Non-Emergency Medical Transport (3), VA Medical Transport (2), Volunteer Driver Programs (1), Ride Assistance Programs (1), Veteran Transportation Programs (1)
  - Service priorities: information (7), same_week (6), standard (1)
  - Cities: North Charleston (2), Columbia (2), Charleston (1), Greenville (1), Spartanburg (1), Myrtle Beach (1), Moncks Corner (1) + 5 national/statewide
  - Geocoded: 9/14 (5 national/statewide resources correctly without coordinates)
- **Substance Recovery batch**: 15 new resources imported
  - Subcategories: Peer Recovery Groups (3), Outpatient Recovery (3), Detox Programs (3), Crisis Stabilization (2), Veteran Recovery Programs (2), Recovery Support Services (1), Medication Assisted Treatment (1)
  - Service priorities: immediate (7), same_week (4), standard (4)
  - Cities: Columbia (4), North Charleston (2), Charleston (2), Greenville (2), Spartanburg (1), Conway (1) + 3 national/statewide
  - Geocoded: 12/15 (3 national/statewide resources correctly without coordinates)
  - Key resources: VA STAR Charleston, VA Dorn Columbia, Palmetto Lowcountry Patriot Support, Phoenix Center (detox + MAT), LRADAC (detox + recovery support), Charleston Center, Forrester Center Spartanburg, Shoreline Conway, AA Tri-County & Columbia, NA Carolina Region, SAMHSA Helpline, SC Mobile Crisis
- **Food Assistance batch**: 14 new resources imported (NEW CATEGORY CREATED: Food Assistance / food-assistance)
  - Subcategories: Food Banks (4), Senior & Disabled Meal Programs (3), Food Pantries (3), Community Kitchens (2), SNAP Assistance (1), Veteran Meal Programs (1)
  - Service priorities: same_week (7), standard (4), immediate (2), information (1)
  - Cities: Charleston (4), Columbia (3), Myrtle Beach (2), Greenville (2), North Charleston (1), Summerville (1) + 1 statewide
  - Geocoded: 13/14 (1 statewide resource correctly without coordinates)
  - Key resources: Lowcountry Food Bank (HQ + Myrtle Beach), Harvest Hope (Columbia + Greenville), Soldiers Angels veteran food distribution, One80 Place community kitchen, Community Kitchen Myrtle Beach, Salvation Army (Charleston + Columbia), Tricounty Family Ministries Summerville, SC DSS SNAP, Meals on Wheels (Charleston + Columbia + Greenville)
- **Community Support batch**: 15 new resources imported
  - Subcategories: VFW Posts (4), American Legion Posts (3), Veteran Nonprofit Organizations (3), Veteran Outreach Programs (2), Veteran Service Organizations (2), Veteran Social Groups (1)
  - Service priorities: information (11), standard (4)
  - Cities: Columbia (4), North Charleston (3), Charleston (2), Greenville (2), West Columbia (1), Spartanburg (1), Lexington (1) + 1 statewide
  - Geocoded: 14/15 (1 statewide resource correctly without coordinates)
  - Key resources: DAV SC HQ, SCDVA state office, Charleston County VA Office, VFW Posts (445 Charleston, 5091 N. Charleston, 4262 Columbia, 10330 Greenville), VFW SC HQ, American Legion Posts (147 Charleston, 6 Columbia, SC HQ), Palmetto Warrior Connection, Upstate Warrior Solution (Greenville + Spartanburg), Team RWB SC
- **Step 22 Guided Help Flow**:
  - Home page "Get Help" button opens guided help dialog with two-step flow: category selection + urgency selection
  - Urgency values: `immediate`, `same_week`, `standard`, `information` — mapped to both navigator_requests.urgency and resource service_priority sorting
  - "Find Resources" routes to `/resources?category=<slug>&urgency=<value>` — resources sorted by matching service_priority first
  - "Request Support" from guided help opens NavigatorModal with urgency pre-filled and source="guided_help"
  - Crisis banner shown for immediate urgency: 988 Lifeline + Veterans Crisis Line (1-800-273-8255 Press 1)
  - Resources page: urgency banner dismissable, near-me mode preserves distance sort within urgency-sorted buckets
  - NavigatorModal: urgency selection cards always visible, source prop conditional (guided_help | resource_page | null)
- **Step 22 Lead Lifecycle (Two-Layer Model)**:
  - **Workflow statuses** (Layer 1): `new`, `in_progress`, `resolved`, `cancelled`
  - **Outcomes** (Layer 2): `connected`, `referred`, `completed`, `no_response`, `not_eligible`, `declined`, `unable_to_contact`
  - Navigator lifecycle columns (graceful detection via `hasNavLifecycleColumns`): source, utm_source, utm_medium, utm_campaign, urgency, assigned_to, contacted_at, resolved_at, outcome, consent_followup
  - Future routing columns (graceful detection via `hasRoutingColumns`): routed_to_partner_id, routed_at, delivery_status, partner_outcome, closed_at
  - SQL for routing columns in `supabase/add_routing_columns.sql` — requires `partner_organizations` table first
  - POST /api/navigator-request accepts: source, utm_source, utm_medium, utm_campaign, urgency, consent_followup
  - PATCH /api/admin/navigator-requests/:id accepts: status, admin_notes, assigned_to, outcome, contacted_at, resolved_at, closed_at, routed_to_partner_id, routed_at, delivery_status, partner_outcome
  - Admin UI workflow: New → Start Working (in_progress) → Record Contact (sets contacted_at) → Resolve with outcome → outcome badge shown on resolved cards
  - Immediate urgency leads sort to top with red highlighting; all leads show urgency + status + source badges
  - Data cleanup completed: 16 test/duplicate rows deleted, subcategory backfilled to 100%
- **Step 22 FINAL SC total**: 315 total resources across 13 categories
  - VA Benefits (39), Housing Assistance (35), Employment (33), Legal Help (32), Community Support (29), Mental Health (24), Education (28), Financial Help (23), Substance Recovery (19), Family Support (16), Transportation (14), Food Assistance (14), Healthcare (9)
  - Subcategory coverage: 100% (315/315)
  - Within-category duplicates: 0
  - Test rows: 0
  - Geocoded: 198/315 (117 national/statewide correctly without coordinates)

## Geo/Near Me
- **Geo columns**: `resources` table has `latitude`, `longitude` (DOUBLE PRECISION), `geo_source` (TEXT), `geocoded_at` (TIMESTAMPTZ) — added via Supabase SQL
- **Startup check**: `checkGeoColumns()` probes for `latitude` column at boot; if missing, `hasGeoColumns=false` disables geo queries/writes gracefully
- **Dynamic select**: `resourceSelectFields()` returns field list with or without geo columns based on `hasGeoColumns`
- **Geocode module**: `server/geocode.ts` — Nominatim (OpenStreetMap), 1 req/sec rate limit, US-only
- **Auto-geocode on edit**: Admin PATCH auto-geocodes when address/city/state/zip changes (if `hasGeoColumns`)
- **Bulk geocode**: `POST /api/admin/resources/geocode-missing` — SSE endpoint; processes resources with null lat/lng but valid address info; streams progress events; UI button "Geocode Missing" in admin-resources page with progress bar, summary badges, and expandable failure log

## Lead Routing & Escalation System
- **Key files**: `server/lead-router.ts` (routing engine), `server/lead-escalation.ts` (escalation timer), `supabase/create_partner_organizations.sql` (SQL for both tables + routing columns)
- **Partner table detection**: `checkPartnerTable()` at startup; `hasPartnerTable` and `hasRoutingRulesTable` flags
- **Routing column detection**: `hasRoutingColumns` flag checks navigator_requests for routing fields
- **Auto-routing**: On POST /api/navigator-request, if partner+routing tables exist, `autoRouteNewLead()` fires async
- **Routing engine** (`server/lead-router.ts`):
  - `findBestPartner(lead, excludePartnerIds)`: Matches rules by category_slug, subcategory, urgency, state, city; filters by is_active + is_lead_enabled; respects max_leads_per_day; sorts by priority (lower=better) then specificity (more specific wins)
  - `routeLead(leadId)`: Sets routed_to_partner_id, routed_at, delivery_status='pending'; appends to routing_history jsonb
  - `autoRouteNewLead(leadId)`: Called after new lead creation; unmatched leads stay in manual queue
- **Escalation engine** (`server/lead-escalation.ts`):
  - Runs every 5 minutes via `startEscalationTimer()` (started at boot when partner+routing tables exist)
  - Escalation windows: immediate=15min, same_week=48hr, standard=7d, information=14d
  - `checkEscalations()`: Finds stale routed leads (pending past window) → re-routes to next partner (excluding previous) or sets delivery_status='fallback_manual'
  - Also catches unrouted leads past their urgency window → flags as fallback_manual
  - Increments escalation_count and appends to routing_history on each re-route
- **Admin UI**: Partners tab in admin panel; create/edit partners with routing rules; lead cards show routing status + delivery badges
- **Manual re-route**: POST /api/admin/leads/:id/reroute (with optional partner_id for manual assignment)
- **SQL setup**: Run `supabase/create_partner_organizations.sql` to create both tables + add routing columns to navigator_requests

## Partner Email Notifications
- **Key file**: `server/lead-email.ts`
- **Service**: Resend (resend.com) — `RESEND_API_KEY` env var required
- **From address**: Defaults to `Veteran Care <onboarding@resend.dev>`; override with `RESEND_FROM_EMAIL` env var (requires verified domain in Resend)
- **Trigger**: Fires automatically after `routeLead()` succeeds (both auto-route and manual reroute)
- **Email content**: Veteran name, phone, email, preferred contact, location, category/subcategory, urgency (color-coded badge), message, timestamp (ET)
- **Urgent leads**: `immediate` urgency shows red alert banner at top of email with 15-min escalation warning
- **Tracking**: `routing_history` entries updated with `email_sent`, `email_sent_at`, `email_id` after successful send
- **Failure handling**: Email send failures are logged but do not block routing; lead is still routed even if email fails
- **Security**: All user-controlled fields are HTML-escaped before email template interpolation; routing_history tracking uses deterministic partner_id matching

## SC Housing Pilot (Step 22E — Active)
- **Status**: Verified and live
- **Partners** (3 active, all Colin@VeteranCare.com during pilot):
  1. **Charleston Housing Pilot** — Charleston, North Charleston, Mount Pleasant, Summerville (urgent p5, general p20)
  2. **Midlands Housing Pilot** — Columbia, West Columbia, Lexington, Irmo (urgent p5, general p20)
  3. **SC Housing Statewide Pilot** — Statewide fallback (urgent p10, general p30)
- **Routing verified**: City-based routing, urgency priority, statewide fallback, email delivery, routing history tracking
- **Email note**: Resend API is in sandbox mode — only sends to account owner (colinmslaven@gmail.com). To send to Colin@VeteranCare.com or real partner emails, verify veterancare.com domain in Resend and set `RESEND_FROM_EMAIL` env var
- **Rate limit**: Navigator requests limited to 5 per hour per IP (in-memory, resets on server restart)

## Multi-State Architecture
- **Key file**: `supabase/create_states.sql` (table creation), `supabase/alter_states.sql` (upgrade simplified schema to full)
- **Design**: States management table works alongside existing text `state` columns — no FK migration required
- **Current schema** (simplified): `code` (TEXT UNIQUE), `name`, `active` (BOOLEAN), `created_at`
- **Full schema** (after running alter_states.sql): adds `id` (UUID), `is_active`, `is_template`, `launch_date`, `timezone`, `admin_contact_name`, `admin_contact_email`, `config` (JSONB), `resource_count`, `partner_count`
- **Detection**: Server detects both simplified and full schema at startup; endpoints adapt automatically
- **SC is template state**: `is_template=true` marks SC as the blueprint for cloning to new states
- **Categories**: Global (not state-scoped); all 13 categories apply across all states
- **State container isolation**: Resources, partners, routing rules, and leads are already filtered by text `state` column
- **API endpoints**:
  - `GET /api/states/active` — Public: returns active states (code, name)
  - `GET /api/admin/states` — Admin: list all states with full details
  - `POST /api/admin/states` — Admin: create new state (code, name required)
  - `PATCH /api/admin/states/:code` — Admin: update state (activate/deactivate, config, etc.)
  - `POST /api/admin/states/:code/refresh-counts` — Admin: recalculate resource_count and partner_count from live data
