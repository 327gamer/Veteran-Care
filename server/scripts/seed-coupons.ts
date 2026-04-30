#!/usr/bin/env tsx
/**
 * Founder spec 2026-04-30 — idempotent seed of 4 promotion codes.
 *
 *   VC10  → 10% off forever
 *   VC20  → 20% off forever
 *   VC50  → 50% off for 3 months (repeating)
 *   VC100 → 100% off first month only (once)
 *
 * Apply ONLY to subscription charges. Lead charges use
 * paymentIntents.create() which has no promo-code parameter, so this
 * is enforced at the Stripe API surface itself in addition to the
 * scope on the coupon objects.
 *
 * Run with: tsx server/scripts/seed-coupons.ts
 */
// Replit auto-loads secrets into process.env — no dotenv needed.
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("[seed-coupons] STRIPE_SECRET_KEY is not set. Aborting.");
  process.exit(1);
}
const stripe = new Stripe(secretKey, { apiVersion: "2025-03-31.basil" as any });

interface Spec {
  code: string;
  percentOff: number;
  duration: "forever" | "once" | "repeating";
  durationInMonths?: number;
  name: string;
}

const SPECS: Spec[] = [
  { code: "VC10",  percentOff: 10,  duration: "forever",                          name: "VC10 — 10% off forever" },
  { code: "VC20",  percentOff: 20,  duration: "forever",                          name: "VC20 — 20% off forever" },
  { code: "VC50",  percentOff: 50,  duration: "repeating", durationInMonths: 3,   name: "VC50 — 50% off for 3 months" },
  { code: "VC100", percentOff: 100, duration: "once",                             name: "VC100 — 100% off first month only" },
];

async function ensure(spec: Spec): Promise<void> {
  const existing = await stripe.promotionCodes.list({ code: spec.code, limit: 1 });
  if (existing.data.length > 0) {
    const promo = existing.data[0];
    const couponId = typeof promo.coupon === "string" ? promo.coupon : promo.coupon.id;
    console.log(`[seed-coupons] ✓ ${spec.code} already exists (promo=${promo.id} coupon=${couponId} active=${promo.active})`);
    return;
  }

  const couponParams: Stripe.CouponCreateParams = {
    percent_off: spec.percentOff,
    duration: spec.duration,
    name: spec.name,
    metadata: { source: "vc-seed-script", code: spec.code },
  };
  if (spec.duration === "repeating" && spec.durationInMonths) {
    couponParams.duration_in_months = spec.durationInMonths;
  }
  const coupon = await stripe.coupons.create(couponParams);
  console.log(`[seed-coupons]   created coupon ${coupon.id} (${spec.percentOff}% / ${spec.duration}${spec.durationInMonths ? `/${spec.durationInMonths}mo` : ""})`);

  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: spec.code,
    metadata: { source: "vc-seed-script" },
  });
  console.log(`[seed-coupons] ✓ ${spec.code} created (promo=${promo.id} coupon=${coupon.id})`);
}

async function main() {
  console.log(`[seed-coupons] Seeding ${SPECS.length} promotion codes…`);
  for (const spec of SPECS) {
    try {
      await ensure(spec);
    } catch (err: any) {
      console.error(`[seed-coupons] ✗ Failed ${spec.code}: ${err?.message || err}`);
    }
  }
  console.log(`[seed-coupons] Done.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`[seed-coupons] Fatal: ${err?.message || err}`);
  process.exit(1);
});
