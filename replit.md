# Veteran Care

## Overview
A comprehensive mobile-first web app for U.S. Military veterans consolidating 11 resource categories with AI-guided assistance, location-based filtering, community feed, and persistent resource saving.

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
- `client/src/lib/store.ts` - Zustand store (saved resources, user location)
- `client/src/lib/resources-data.ts` - Static resource data
- `client/src/components/layout.tsx` - App shell with top bar and bottom nav

## API Endpoints
- `GET /api/categories` - Returns categories from Supabase (id, name, slug)

## Environment Variables (Secrets)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous/public key

## Design Decisions
- App name: "Veteran Care" (two words)
- Logo: `Veteran_Care_-_Shadow_-_PNG_1772598034200.png` (metallic dog tag)
- Green color scheme throughout
- Mobile-first, single-screen layouts for onboarding
- Crisis Help always shown first in resource lists
- Location filtering via Zustand store (state → city)
- veterancare.com (Duda) acts as marketing front door; this Replit app is the functional product
