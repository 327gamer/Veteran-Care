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
- `GET /api/admin/navigator-requests?status=<status>` - Admin: list navigator leads filtered by status (new/contacted/completed/cancelled)
- `PATCH /api/admin/navigator-requests/:id` - Admin: update lead status/notes
- `POST /api/admin/resources` - Admin: create a new resource directly (bypasses community submission; defaults to status=approved)
- `POST /api/admin/resources/csv-import` - Admin: bulk import resources from CSV (max 500 rows; category matched by name or slug; returns created/skipped/error counts)
- `GET /api/admin/analytics` - Admin: analytics dashboard data (clicks by category/state/city, top resources, affiliate vs non-affiliate, reported resources, navigator request stats)

## Supabase Tables
- `categories` - id (uuid), name, slug
- `resources` - id (uuid), category_id (fk→categories), title, short_description, website_url, phone, email, address, city, state, zip, eligibility, source_name, source_type, last_verified, monetization_type, affiliate_url, sponsored (bool), status (text: pending/approved/rejected), submitted_by_name, submitted_by_email, notes_internal, is_featured (bool), featured_rank (int), last_verified_at, latitude (float8), longitude (float8), geo_source (text), geocoded_at (timestamptz), created_at
- `resource_clicks` - id (uuid), resource_id (fk→resources), click_type (text), user_state, user_city, user_zip (text), created_at (SQL in `supabase/create_resource_clicks.sql`)
- `navigator_requests` - id (uuid), resource_id, resource_title, veteran_name, veteran_phone, veteran_email, message, preferred_contact, user_state, user_city, user_zip, status (new/contacted/completed/cancelled), admin_notes, created_at (SQL in `supabase/create_navigator_requests.sql`)

## Environment Variables (Secrets)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `ADMIN_KEY` - Secret key for admin resource review access

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
- **Auth UI**: `client/src/components/auth-modal.tsx` — login/signup modal with email+password
- **Profile dropdown**: Layout top bar profile button → dropdown with sign in/out
- **Supabase table `user_saved_resources`**: id, user_id (fk→auth.users), resource_id (fk→resources), saved_at; unique(user_id, resource_id); RLS policies for user-scoped access (SQL in `supabase/create_user_saved_resources.sql`)
- **Server routes**: `GET /api/saved-resources` (auth'd, returns saved IDs), `POST /api/saved-resources/sync` (merges localStorage IDs on first login), `POST /api/saved-resources/toggle` (save/unsave with auth)
- **Store sync**: On login, `syncSavedOnLogin()` merges localStorage savedIds into Supabase (one-time device migration via `deviceMigrated` flag), then Supabase becomes source of truth; `toggleSave()` optimistically updates localStorage and fires server toggle in background
- **Logged-out users**: Keep current localStorage-only behavior unchanged
- **Saved page**: Shows "Synced to your account" when logged in, "Saved on this device only" when logged out
- **Vite config**: Exposes `SUPABASE_URL` and `SUPABASE_ANON_KEY` to frontend via `define` block

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

## Geo/Near Me
- **Geo columns**: `resources` table has `latitude`, `longitude` (DOUBLE PRECISION), `geo_source` (TEXT), `geocoded_at` (TIMESTAMPTZ) — added via Supabase SQL
- **Startup check**: `checkGeoColumns()` probes for `latitude` column at boot; if missing, `hasGeoColumns=false` disables geo queries/writes gracefully
- **Dynamic select**: `resourceSelectFields()` returns field list with or without geo columns based on `hasGeoColumns`
- **Geocode module**: `server/geocode.ts` — Nominatim (OpenStreetMap), 1 req/sec rate limit, US-only
- **Auto-geocode on edit**: Admin PATCH auto-geocodes when address/city/state/zip changes (if `hasGeoColumns`)
- **Bulk geocode**: `POST /api/admin/resources/geocode-missing` — SSE endpoint; processes resources with null lat/lng but valid address info; streams progress events; UI button "Geocode Missing" in admin-resources page with progress bar, summary badges, and expandable failure log
