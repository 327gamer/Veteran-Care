/**
 * Named Partners Registry — QA-2 (2026-04-26)
 *
 * Founder-verified provider allowlist used by the Veteran Guide ranking
 * pipeline for two effects:
 *
 *   1. Trusted-partner score boost in resource-matcher.scoreResource().
 *      Resources whose title contains any titleSubstring listed below get a
 *      +20 boost so they outrank generic category-bucket results.
 *
 *   2. Named-entity short-circuit in engine.handleAiChat(). If the user's
 *      message contains any alias listed below, we skip the
 *      location-clarification branch entirely — the partner's canonical city
 *      and state are used as the effective location, so matchResources()
 *      finds the partner's rows even when no user location was supplied.
 *
 * Regional aliases (e.g. "tri-county", "lowcountry") are also picked up by
 * the named-partner detector because they uniquely identify a metro region
 * served by a small set of partners. The match returns the canonical
 * Charleston-metro location and the routing falls through normally.
 *
 * Add new partners as the rollout reaches each metro. Founder-curated only.
 */

export interface NamedPartner {
  /** Lowercase aliases / partial names users might type. Hyphens are
      normalized to spaces during matching, so "tri-county" matches
      "tri county" and vice versa. Order doesn't matter. */
  aliases: string[];
  /** Substring used to identify this partner's rows in the resources table.
      Case-insensitive. Use the most specific stable substring of the canonical
      title so all of the partner's category-specific rows match. */
  titleSubstring: string;
  /** Canonical city — used to backfill effectiveCity when the user typed only
      the partner name with no location. Must match the city stored on the
      partner's resource rows. */
  canonicalCity: string;
  /** Canonical 2-letter state code — same backfill purpose as canonicalCity. */
  canonicalState: string;
  /** Optional human-readable region label used by the regional geo-boost. */
  region?: string;
}

export const NAMED_PARTNERS: NamedPartner[] = [
  {
    aliases: [
      "tri-county veterans support network",
      "tri county veterans support network",
      "tcvsn",
      "tri-county vsn",
      "tri county vsn",
      "tri-county veterans",
      "tri county veterans",
    ],
    titleSubstring: "Tri-County Veterans Support Network",
    canonicalCity: "North Charleston",
    canonicalState: "SC",
    region: "charleston",
  },
];

/**
 * Regional alias map — maps a metro nickname / sub-region term to a canonical
 * city used by getLocationScore() and SC_NEARBY_CITIES. Lets the matcher
 * treat all Charleston-metro resources as same-city when the user references
 * the region by nickname instead of an incorporated city name.
 */
export const REGIONAL_ALIASES: Record<string, string> = {
  "tri-county": "charleston",
  "tri county": "charleston",
  "lowcountry": "charleston",
  "low country": "charleston",
};

/**
 * Lowercase, hyphen-normalized message for matching.
 */
function normalize(s: string): string {
  return s.toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Detect the first named partner whose alias appears in the user message.
 * Returns null when no alias matches. Aliases longer than 8 chars are
 * required to avoid false positives on short common substrings.
 */
export function detectNamedPartner(message: string): NamedPartner | null {
  const normMsg = normalize(message);
  for (const partner of NAMED_PARTNERS) {
    for (const alias of partner.aliases) {
      const normAlias = normalize(alias);
      if (normAlias.length < 8) continue;
      if (normMsg.includes(normAlias)) return partner;
    }
  }
  return null;
}

/**
 * Returns the canonical city for a regional-alias keyword (e.g. "tri-county"
 * -> "charleston"), or null when no alias matches. Used by the matcher to
 * upgrade location scoring for region-named queries.
 */
export function detectRegionalAlias(message: string): string | null {
  const normMsg = normalize(message);
  for (const [alias, canonical] of Object.entries(REGIONAL_ALIASES)) {
    if (normMsg.includes(normalize(alias))) return canonical;
  }
  return null;
}

/**
 * Returns true when a resource title is on the verified-trusted-partner
 * allowlist. Used by scoreResource() to apply the +20 boost. Substring match
 * is case-insensitive.
 */
export function isTrustedPartnerTitle(title: string | null | undefined): boolean {
  if (!title) return false;
  const lower = title.toLowerCase();
  for (const partner of NAMED_PARTNERS) {
    if (lower.includes(partner.titleSubstring.toLowerCase())) return true;
  }
  return false;
}
