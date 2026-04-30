// ─────────────────────────────────────────────────────────────────────
// ECSS (Elite Category Sponsor Slot) — state-tier pricing
//
// Founder spec 2026-04-30: Tier composition + the rules below are the
// SINGLE SOURCE OF TRUTH for Elite Service Partner monthly subscription
// pricing across the entire app. Do NOT duplicate this logic anywhere.
//
//   Tier 1 — $899/mo  → 10 states  (CA, TX, FL, NY, PA, IL, OH, GA, NC, MI)
//   Tier 2 — $699/mo  → 12 states  (NJ, VA, WA, AZ, MA, TN, IN, MO, MD,
//                                   WI, CO, MN)
//   Tier 3 — $499/mo  → all remaining states (AND DC) — covered both
//                       explicitly in ECSS_TIER_3_STATES (admin display)
//                       AND implicitly via ECSS_DEFAULT_CENTS (lookup
//                       fallback — so any unrecognized state code still
//                       resolves to $499).
//
//   + $49.99 per accepted qualified lead (separate, not in monthly).
//
// Existing sold/active slots are grandfathered automatically by the
// boot-time backfill in server/elite-sponsor.ts (filters require both
// status='vacant' AND billing_status='unpaid').
// ─────────────────────────────────────────────────────────────────────

export const ECSS_TIER_1_STATES = [
  "CA", "TX", "FL", "NY", "PA", "IL", "OH", "GA", "NC", "MI",
] as const;

export const ECSS_TIER_2_STATES = [
  "NJ", "VA", "WA", "AZ", "MA", "TN", "IN", "MO", "MD", "WI", "CO", "MN",
] as const;

// Per founder Q3 (2026-04-30) — explicit Tier 3 list for admin clarity.
// Includes the founder's 27 explicitly-named T3 states PLUS the 2 states
// not named anywhere in the spec (CT, DC) which fall through to the
// "AND all remaining states not listed above" clause.
export const ECSS_TIER_3_STATES = [
  "SC", "AL", "MS", "AR", "LA", "KY", "OK", "NV", "NM", "ID",
  "MT", "WY", "AK", "HI", "DE", "ME", "VT", "NH", "RI", "WV",
  "ND", "SD", "NE", "KS", "IA", "UT", "OR",
  "CT", "DC",
] as const;

export const ECSS_TIER_1_CENTS = 89900;
export const ECSS_TIER_2_CENTS = 69900;
export const ECSS_TIER_3_CENTS = 49900;

export const ECSS_DEFAULT_CENTS = ECSS_TIER_3_CENTS;
export const ECSS_STARTING_PRICE_LABEL = "$499/mo";

const TIER_MAP: Record<string, number> = {};
for (const s of ECSS_TIER_1_STATES) TIER_MAP[s] = ECSS_TIER_1_CENTS;
for (const s of ECSS_TIER_2_STATES) TIER_MAP[s] = ECSS_TIER_2_CENTS;
for (const s of ECSS_TIER_3_STATES) TIER_MAP[s] = ECSS_TIER_3_CENTS;

export function getDefaultEcssPriceCents(stateCode: string | null | undefined): number {
  if (!stateCode) return ECSS_DEFAULT_CENTS;
  const key = String(stateCode).trim().toUpperCase();
  return TIER_MAP[key] ?? ECSS_DEFAULT_CENTS;
}

export type EcssTier = "tier1" | "tier2" | "tier3";

export function getEcssTier(stateCode: string | null | undefined): EcssTier {
  const cents = getDefaultEcssPriceCents(stateCode);
  if (cents === ECSS_TIER_1_CENTS) return "tier1";
  if (cents === ECSS_TIER_2_CENTS) return "tier2";
  return "tier3";
}

export function formatEcssPriceUsd(cents: number): string {
  if (!Number.isFinite(cents) || cents <= 0) return "$499";
  const dollars = Math.round(cents / 100);
  return `$${dollars}`;
}

export const ECSS_TIER_TABLE: ReadonlyArray<{
  tier: EcssTier;
  cents: number;
  states: ReadonlyArray<string>;
}> = [
  { tier: "tier1", cents: ECSS_TIER_1_CENTS, states: ECSS_TIER_1_STATES },
  { tier: "tier2", cents: ECSS_TIER_2_CENTS, states: ECSS_TIER_2_STATES },
  { tier: "tier3", cents: ECSS_TIER_3_CENTS, states: ECSS_TIER_3_STATES },
];
