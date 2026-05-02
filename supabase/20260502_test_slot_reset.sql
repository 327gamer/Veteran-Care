-- ─────────────────────────────────────────────────────────────────────────────
-- ABC Test slot reset — WY × financial-credit × va-loans
-- Date: 2026-05-02
-- Founder: Veteran Care
--
-- PURPOSE:
--   Reset the one real test sold Elite slot back to vacant after Stripe-side
--   subscription has been cancelled. Preserves audit trail of what was here.
--
-- ⚠ MANUAL PRE-STEP — DO IN STRIPE DASHBOARD FIRST:
--   1. Cancel subscription:    sub_1TS0hQGdqk7jVmGZgUcTbFMk
--      Stripe → Subscriptions → search by ID → Actions → Cancel subscription
--      (NOT "Cancel and refund" unless you want to refund the founder test charge)
--   2. Confirm sub status shows "Canceled" before proceeding
--   3. (After SQL runs successfully) delete customer:
--      cus_UQsQ0HJtT5lRjl
--      Stripe → Customers → search → Actions → Delete customer
--
-- USAGE (when ready):
--   1. Confirm Stripe subscription cancelled (above)
--   2. Run the PREVIEW block first to see exact current state
--   3. Run the BEGIN/COMMIT transaction block
--   4. Run the VERIFY block — should show 0 sold slots, slot 6260df2b vacant
--   5. Verify in admin UI: /admin/elite-sponsors → WY × financial-credit shows vacant
--
-- THIS FILE IS COMMENTED-OUT BY DEFAULT. UNCOMMENT THE BEGIN/COMMIT BLOCK
-- ONLY WHEN YOU'RE READY TO RUN.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── PREVIEW: confirm slot + lead are exactly what we expect ───────────────
SELECT
  id,
  state_code,
  category_slug,
  subcategory_slug,
  status,
  billing_status,
  sponsor_name,
  sponsor_lead_email,
  stripe_customer_id,
  stripe_subscription_id,
  sold_at,
  unsold_at
FROM elite_sponsor_slots
WHERE id = '6260df2b-ce7d-4cd4-af92-cc51bab6bb0a';

SELECT
  id,
  slot_id,
  lead_name,
  lead_email,
  delivery_status,
  status,
  navigator_request_id,
  created_at
FROM elite_sponsor_leads
WHERE slot_id = '6260df2b-ce7d-4cd4-af92-cc51bab6bb0a';

-- ═══════════════════════════════════════════════════════════════════════════
-- DESTRUCTIVE BLOCK — UNCOMMENT THE BEGIN..COMMIT BLOCK BELOW WHEN READY
-- ═══════════════════════════════════════════════════════════════════════════

-- BEGIN;
--
-- -- a. Archive the test lead (preserves audit row, removes from "active" view)
-- UPDATE elite_sponsor_leads
-- SET
--   status = 'archived',
--   delivery_status = 'cancelled'
-- WHERE slot_id = '6260df2b-ce7d-4cd4-af92-cc51bab6bb0a'
--   AND status != 'archived';
--
-- -- b. Reset the slot to vacant. Preserve the cancelled Stripe IDs in
-- --    notes_internal as audit trail, then null them on the row.
-- UPDATE elite_sponsor_slots
-- SET
--   status = 'vacant',
--   billing_status = NULL,
--   sponsor_name = NULL,
--   sponsor_logo_url = NULL,
--   sponsor_short_description = NULL,
--   sponsor_cta_text = NULL,
--   sponsor_phone = NULL,
--   sponsor_website_url = NULL,
--   sponsor_lead_email = NULL,
--   sponsor_partner_organization_id = NULL,
--   sponsor_partner_application_id = NULL,
--   stripe_customer_id = NULL,
--   stripe_subscription_id = NULL,
--   current_period_start = NULL,
--   current_period_end = NULL,
--   sold_at = NULL,
--   unsold_at = NOW(),
--   updated_at = NOW(),
--   creative_approval_status = 'pending',
--   creative_rejection_reason = NULL,
--   creative_approved_at = NULL,
--   creative_approved_by = NULL,
--   creative_submitted_at = NULL,
--   notes_internal = COALESCE(notes_internal, '') ||
--     E'\n[2026-05-02] ABC Test reset. Was sold to "ABC Test" / ' ||
--     'colin@holycitysoccerleague.com on 2026-04-30. ' ||
--     'Stripe sub sub_1TS0hQGdqk7jVmGZgUcTbFMk cancelled manually. ' ||
--     'Stripe customer cus_UQsQ0HJtT5lRjl scheduled for deletion.'
-- WHERE id = '6260df2b-ce7d-4cd4-af92-cc51bab6bb0a';
--
-- -- c. (Belt & suspenders) Clear the historical Stripe IDs on the SC
-- --    legal-services slot — already vacant + cancelled, but the IDs are
-- --    stale audit metadata that confuses the admin slot view. Preserved
-- --    in notes_internal exactly like the WY slot above.
-- UPDATE elite_sponsor_slots
-- SET
--   stripe_customer_id = NULL,
--   stripe_subscription_id = NULL,
--   sponsor_lead_email = NULL,
--   billing_status = NULL,
--   updated_at = NOW(),
--   notes_internal = COALESCE(notes_internal, '') ||
--     E'\n[2026-05-02] Cleared stale Stripe IDs from earlier founder test. ' ||
--     'Was cus_UQp0drxEr76is6 / sub_1TRxMCGdqk7jVmGZy534qz98 ' ||
--     '(both cancelled in Stripe on 2026-04-30).'
-- WHERE id = 'ca6ca3ee-8253-4500-9f4b-4e9c01616667'
--   AND status = 'vacant'
--   AND stripe_subscription_id IS NOT NULL;
--
-- COMMIT;

-- ─── VERIFY (run AFTER COMMIT) — should return 0 sold + slot vacant ─────────

-- Slot status breakdown — expect {vacant: 3886}
SELECT status, COUNT(*)::int AS cnt
FROM elite_sponsor_slots
GROUP BY status
ORDER BY cnt DESC;

-- The WY slot — expect status='vacant', sponsor_name=NULL, no Stripe IDs
SELECT
  id, state_code, category_slug, subcategory_slug, status,
  sponsor_name, stripe_subscription_id, unsold_at,
  LEFT(notes_internal, 200) AS notes_preview
FROM elite_sponsor_slots
WHERE id = '6260df2b-ce7d-4cd4-af92-cc51bab6bb0a';

-- The SC slot — expect Stripe IDs nulled
SELECT
  id, state_code, category_slug, status, stripe_subscription_id,
  LEFT(notes_internal, 200) AS notes_preview
FROM elite_sponsor_slots
WHERE id = 'ca6ca3ee-8253-4500-9f4b-4e9c01616667';

-- The archived lead — expect status='archived'
SELECT id, slot_id, lead_name, status, delivery_status
FROM elite_sponsor_leads
WHERE slot_id = '6260df2b-ce7d-4cd4-af92-cc51bab6bb0a';

-- ═══════════════════════════════════════════════════════════════════════════
-- POST-RUN STRIPE CHECKLIST
-- ═══════════════════════════════════════════════════════════════════════════
--
--   [ ] sub_1TS0hQGdqk7jVmGZgUcTbFMk — confirmed Canceled in Stripe
--   [ ] cus_UQsQ0HJtT5lRjl — Deleted in Stripe (after sub cancel)
--   [ ] cus_UQp0drxEr76is6 — Deleted in Stripe (sub already cancelled)
--   [ ] /admin/elite-sponsors — WY × financial-credit shows "Vacant"
--   [ ] /admin/elite-sponsors — total counts show 3,886 vacant / 0 sold
--   [ ] No webhook errors in Stripe Dashboard → Developers → Webhooks
-- ═══════════════════════════════════════════════════════════════════════════
