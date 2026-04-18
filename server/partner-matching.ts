import { supabaseAdmin } from "./supabase";

/**
 * Stage B: Seeded-Provider Matching Helper
 *
 * Pure functions + a single match cascade. Used to detect when an incoming
 * partner application likely refers to an already-existing provider record
 * (typically a seeded provider) so we can later convert in place rather than
 * create a duplicate.
 *
 * Stage B is LOG-ONLY. This module does not write to or modify any provider
 * record. It only reads and reports.
 */

const GENERIC_EMAIL_DOMAINS = new Set<string>([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
  "aol.com", "protonmail.com", "live.com", "me.com", "msn.com",
  "yahoo.co.uk", "googlemail.com", "ymail.com", "rocketmail.com",
]);

export function normalizeDomain(url: string | null | undefined): string {
  if (!url) return "";
  return String(url).toLowerCase().trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .trim();
}

export function normalizeName(name: string | null | undefined): string {
  if (!name) return "";
  return String(name).toLowerCase()
    .replace(/\b(inc|incorporated|llc|l\.l\.c\.|corp|corporation|ltd|co|company|the|of|and|&)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
}

export function emailDomain(email: string | null | undefined): string {
  if (!email) return "";
  const parts = String(email).toLowerCase().trim().split("@");
  return parts.length === 2 ? parts[1] : "";
}

export function isGenericEmailDomain(domain: string): boolean {
  return GENERIC_EMAIL_DOMAINS.has(domain.toLowerCase());
}

export type MatchKey = "website_domain" | "email_domain" | "normalized_name" | "phone";
export type MatchConfidence = "high" | "med" | "low";

export interface MatchResult {
  matchedId: string | null;
  matchedName: string | null;
  matchedProviderType: string | null;
  matchedIsSeeded: boolean | null;
  matchKey: MatchKey | null;
  confidence: MatchConfidence | null;
  candidatesScanned: number;
}

const NO_MATCH: MatchResult = {
  matchedId: null,
  matchedName: null,
  matchedProviderType: null,
  matchedIsSeeded: null,
  matchKey: null,
  confidence: null,
  candidatesScanned: 0,
};

export interface MatchInput {
  websiteUrl?: string | null;
  contactEmail?: string | null;
  name?: string | null;
  phone?: string | null;
}

/**
 * Run the 4-tier match cascade against partner_organizations.
 * Returns the FIRST match found in priority order:
 *   1. website domain (high confidence)
 *   2. email domain  (high confidence; skipped for generic providers)
 *   3. normalized business name (medium confidence)
 *   4. phone number (low confidence)
 *
 * Read-only. Never writes. Never throws — failures degrade to NO_MATCH.
 */
export async function findExistingProvider(input: MatchInput): Promise<MatchResult> {
  try {
    let candidatesScanned = 0;

    // 1) Website domain — highest confidence
    const websiteDomain = normalizeDomain(input.websiteUrl);
    if (websiteDomain.length >= 4) {
      const { data, error } = await supabaseAdmin
        .from("partner_organizations")
        .select("id, name, website_url, provider_type, is_seeded")
        .ilike("website_url", `%${websiteDomain}%`)
        .limit(10);
      if (!error && data) {
        candidatesScanned += data.length;
        const exact = data.find((p: any) => normalizeDomain(p.website_url) === websiteDomain);
        if (exact) {
          return {
            matchedId: exact.id,
            matchedName: exact.name,
            matchedProviderType: exact.provider_type ?? "partner",
            matchedIsSeeded: exact.is_seeded === true,
            matchKey: "website_domain",
            confidence: "high",
            candidatesScanned,
          };
        }
      }
    }

    // 2) Email domain — high confidence, but only for non-generic providers
    const emDomain = emailDomain(input.contactEmail);
    if (emDomain && !isGenericEmailDomain(emDomain)) {
      const { data, error } = await supabaseAdmin
        .from("partner_organizations")
        .select("id, name, contact_email, provider_type, is_seeded")
        .ilike("contact_email", `%@${emDomain}`)
        .limit(10);
      if (!error && data && data.length > 0) {
        candidatesScanned += data.length;
        const hit = data[0];
        return {
          matchedId: hit.id,
          matchedName: hit.name,
          matchedProviderType: hit.provider_type ?? "partner",
          matchedIsSeeded: hit.is_seeded === true,
          matchKey: "email_domain",
          confidence: "high",
          candidatesScanned,
        };
      }
    }

    // 3) Exact normalized business name — medium confidence
    const nameNorm = normalizeName(input.name);
    if (nameNorm.length >= 3) {
      const { data, error } = await supabaseAdmin
        .from("partner_organizations")
        .select("id, name, provider_type, is_seeded");
      if (!error && data) {
        candidatesScanned += data.length;
        const hit = data.find((p: any) => normalizeName(p.name) === nameNorm);
        if (hit) {
          return {
            matchedId: hit.id,
            matchedName: hit.name,
            matchedProviderType: hit.provider_type ?? "partner",
            matchedIsSeeded: hit.is_seeded === true,
            matchKey: "normalized_name",
            confidence: "med",
            candidatesScanned,
          };
        }
      }
    }

    // 4) Phone — low confidence
    const phoneNorm = normalizePhone(input.phone);
    if (phoneNorm.length >= 10) {
      const { data, error } = await supabaseAdmin
        .from("partner_organizations")
        .select("id, name, contact_phone, provider_type, is_seeded");
      if (!error && data) {
        candidatesScanned += data.length;
        const hit = data.find((p: any) => normalizePhone(p.contact_phone) === phoneNorm);
        if (hit) {
          return {
            matchedId: hit.id,
            matchedName: hit.name,
            matchedProviderType: hit.provider_type ?? "partner",
            matchedIsSeeded: hit.is_seeded === true,
            matchKey: "phone",
            confidence: "low",
            candidatesScanned,
          };
        }
      }
    }

    return { ...NO_MATCH, candidatesScanned };
  } catch (e: any) {
    console.log(`[partner-matching] match cascade failed (fail-safe → NO_MATCH): ${e?.message}`);
    return NO_MATCH;
  }
}
