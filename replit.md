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
- `GET /api/resources?category=<slug>&state=<state>&city=<city>&zip=<zip>&q=<search>` - Returns approved resources filtered by category slug, state, city, ZIP, and/or search query
- `GET /api/resources/:id` - Returns a single resource by UUID
- `GET /api/locations/cities?state=<code>&category=<slug>` - Returns distinct city names from approved resources
- `GET /api/locations/zips?state=<code>&city=<name>&category=<slug>` - Returns distinct ZIP codes from approved resources
- `POST /api/submit-resource` - Creates a new resource with status=pending; includes duplicate detection (website_url, phone, title+city+state), rate limiting (5/hr/IP), and input validation
- `POST /api/track-click` - Logs user interactions with location context (user_state, user_city fallback from resource if store empty)
- `POST /api/report-resource` - Creates a pending admin review item with report note in notes_internal; sets resource status back to pending
- `GET /api/admin/resources?status=<status>&q=<search>` - Admin: list resources by status (requires x-admin-key header)
- `PATCH /api/admin/resources/:id` - Admin: update resource fields/status (requires x-admin-key header)
- `GET /api/admin/analytics` - Admin: analytics dashboard data (clicks by category/state/city, top resources, affiliate vs non-affiliate, reported resources)

## Supabase Tables
- `categories` - id (uuid), name, slug
- `resources` - id (uuid), category_id (fk→categories), title, short_description, website_url, phone, email, address, city, state, zip, eligibility, source_name, source_type, last_verified, monetization_type, affiliate_url, sponsored (bool), status (text: pending/approved/rejected), submitted_by_name, submitted_by_email, notes_internal, is_featured (bool), featured_rank (int), last_verified_at, created_at
- `resource_clicks` - id (uuid), resource_id (fk→resources), click_type (text), user_state, user_city, created_at (SQL in `supabase/create_resource_clicks.sql`)

## Environment Variables (Secrets)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `ADMIN_KEY` - Secret key for admin resource review access

## Routes (Frontend)
- `/` - Landing page
- `/enable-location` - Location permission flow
- `/onboarding` - Onboarding screens
- `/home` - Main dashboard
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
- Navigator lead capture section prepared as placeholder ("Coming soon")

## Click Tracking
- All key actions tracked: website_click, call_click, directions_click, guide_click, save_click, share_click, report_click, apply_click
- Tracks resource_id, click_type, user_state, user_city, timestamp
- Location context: uses store's userLocation (geo or filter), falls back to resource's state/city if store empty
- Gracefully handles errors (returns ok even if table doesn't exist)
- Table creation SQL provided in `supabase/create_resource_clicks.sql`

## Anti-Spam & Duplicate Detection
- Rate limiting: 5 submissions per hour per IP on /api/submit-resource
- Duplicate detection: blocks same website_url, same phone (normalized digits), or same title+city+state
- Input validation: title min 3 chars, category required, URL format check, phone digit length check
- Report system: POST /api/report-resource appends report note to notes_internal and sets status to pending for admin review
- Admin analytics: GET /api/admin/analytics aggregates clicks by category/state/city, top 20 resources, affiliate vs non-affiliate splits, reported resource list

## Key Files (Step 12)
- `client/src/pages/admin-analytics.tsx` - Admin analytics dashboard with charts and stats
