-- 20260501_elite_taxonomy_alignment.sql
-- Idempotent. Pure data alignment (no schema changes).

-- Clear stale TEST sponsor_name on a vacant/cancelled slot.
-- Status/billing/unsold predicates make re-runs safe.
UPDATE elite_sponsor_slots
SET sponsor_name = NULL,
    updated_at   = now()
WHERE id = 'ca6ca3ee-8253-4500-9f4b-4e9c01616667'
  AND sponsor_name = 'TEST — Founder'
  AND status = 'vacant'
  AND billing_status = 'cancelled'
  AND unsold_at IS NOT NULL;

-- Add 3 missing rows referenced by ECSS_CATEGORIES + frontend.
INSERT INTO trusted_service_categories
  (name, slug, description, icon, display_order, is_active)
VALUES
  ('Auto Services',
   'auto-services',
   'Veteran-friendly auto sales, service, and financing partners.',
   'car',
   10,
   true),
  ('End-of-Life Services',
   'end-of-life-services',
   'Funeral planning, military honors, burial benefits, and bereavement support.',
   'flame',
   11,
   true),
  ('Travel Services',
   'travel-services',
   'Veteran-friendly travel, lodging, and Space-A coordination resources.',
   'plane',
   12,
   true)
ON CONFLICT (slug) DO NOTHING;
