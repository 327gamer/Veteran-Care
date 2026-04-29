export const ECSS_TIER_1_STATES = ["CA", "TX", "FL", "NY"] as const;
export const ECSS_TIER_2_STATES = ["PA", "OH", "NC", "GA"] as const;
export const ECSS_TIER_3_STATES = ["SC", "AL"] as const;

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
