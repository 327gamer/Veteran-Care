/**
 * Privacy-safe ambassador slug system.
 *
 * Founder requirement: ambassador-facing surfaces (kits, QR, copy tools, share
 * pages, email templates) must NEVER reveal an ambassador's full name in the
 * short URL. Internal `utm_id` stays canonical for attribution / commission /
 * GA4 joins. A new `public_slug` column carries the initials-prefixed version
 * (`c_s_*`, `d_s_*`, `t_r_*`, `m_k_*`, `k_f_*`) which is what users see.
 *
 * Legacy full-name URLs (`/a/colin_slaven_*`) keep resolving silently in the
 * `/a/:slug` redirect, so links already shared in the wild do not 404.
 *
 * Add a new ambassador here, in one place, and everything else (boot
 * migration, generate endpoint, kit endpoints) picks it up.
 */

export const AMBASSADOR_INITIALS: Record<string, string> = {
  colin_slaven: "c_s",
  debbie_slaven: "d_s",
  tracy_robertson: "t_r",
  michelle_keef: "m_k",
  kelsey_flanagan: "k_f",
};

/** Set of ambassador codes whose links may be exposed in privacy-safe form. */
export const PRIVACY_SAFE_CODES: readonly string[] = Object.keys(AMBASSADOR_INITIALS);

/**
 * Derive a privacy-safe public_slug from a legacy utm_id.
 * Returns null if the ambassador_code is not in the approved initials map
 * (e.g. orphan `kelsey_reese_*` rows that pre-date the merge into Kelsey
 * Flanagan — those stay legacy-only and remain hidden from UI).
 */
export function derivePublicSlug(ambassadorCode: string | null | undefined, utmId: string | null | undefined): string | null {
  if (!ambassadorCode || !utmId) return null;
  const initials = AMBASSADOR_INITIALS[ambassadorCode];
  if (!initials) return null;
  const fullPrefix = `${ambassadorCode}_`;
  if (utmId.startsWith(fullPrefix)) {
    return `${initials}_${utmId.slice(fullPrefix.length)}`;
  }
  if (utmId === ambassadorCode) return initials;
  // utm_id doesn't match the ambassador prefix — be conservative, don't
  // synthesize a slug we can't verify.
  return null;
}

/** True if the slug looks like an initials-prefixed public_slug (`c_s_*`, etc.) */
export function isPublicSlugFormat(slug: string): boolean {
  if (!slug) return false;
  for (const initials of Object.values(AMBASSADOR_INITIALS)) {
    if (slug === initials || slug.startsWith(`${initials}_`)) return true;
  }
  return false;
}
