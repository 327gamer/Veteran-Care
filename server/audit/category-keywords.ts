/**
 * Step 2 — Provider/Resource Tagging Audit
 * ----------------------------------------
 * Per-Resources-category keyword whitelist used by rule R3
 * (keyword/category mismatch detection).
 *
 * Each entry is keyed by `categories.slug` (Resources side).
 * Keywords are matched as case-insensitive SUBSTRINGS against the
 * concatenation of `title + " " + description + " " + website_url`.
 *
 * Conservative bias (per user guardrail):
 *   - Word lists are intentionally broad and inclusive.
 *   - Missing all keywords does NOT auto-classify a placement as WRONG —
 *     the audit only flags it as SUSPECT for manual review.
 *   - Keep terms short and high-recall. False negatives (missing a real
 *     match) are preferable to false positives (flagging a legitimate
 *     placement). Add new terms when in doubt.
 *
 * NOT used by AI matcher. Read-only audit consumption only.
 */

export const CATEGORY_KEYWORDS: Record<string, ReadonlyArray<string>> = {
  "crisis-help": [
    "crisis", "suicide", "hotline", "988", "emergency", "urgent",
    "lifeline", "warmline", "safe haven", "veterans crisis", "self-harm",
    "in crisis", "press 1",
  ],
  "mental-health": [
    "mental health", "ptsd", "post-traumatic", "post traumatic", "therapy",
    "counseling", "psychiatr", "psycholog", "trauma", "depression", "anxiety",
    "moral injury", "behavioral health", "vet center", "make the connection",
    "veterans crisis", "wellness", "support group",
  ],
  "disabled-veterans": [
    "disab", "service-connected", "service connected", "adaptive", "wheelchair",
    "blind", "amput", "spinal cord", "paralyzed", "tbi", "traumatic brain",
    "prosthetic", "vision impair", "hearing impair", "mobility", "dav",
    "disabled american veterans", "wounded warrior", "aid & attendance",
    "aid and attendance", "100%", "rated disabled",
  ],
  "housing": [
    "hous", "shelter", "homeless", "rental", "rent ", "mortgage", "down payment",
    "vash", "ssvf", "transitional housing", "permanent housing", "habitat",
    "homes for our troops", "specially adapted housing", "sah grant", "hud",
    "landlord", "tenant", "real estate", "apartment",
  ],
  "food-assistance": [
    "food", "meal", "pantry", "snap", "wic", "nutrition", "hunger", "feeding",
    "groceries", "food bank", "food share", "soup kitchen", "meals on wheels",
    "ebt",
  ],
  "va-benefits": [
    "va benefit", "compensation", "pension", "claim", "vso", "veterans service",
    "appeal", "rating", "c&p exam", "vha", "vba", "gi bill", "chapter 31",
    "chapter 33", "aid & attendance", "aid and attendance", "dependency",
    "dic ", "burial benefit", "service-connected", "service connected",
    "department of veterans affairs", "scdva", "sc department of veterans",
    "veterans affairs",
  ],
  "family-support": [
    "family", "spouse", "caregiver", "children", "kid", "parent", "marriage",
    "couples", "domestic", "child care", "childcare", "youth", "blue star",
    "gold star", "survivor", "dependent", "military family", "military famil",
    "tragedy assistance", "taps",
  ],
  "community-support": [
    "community", "vfw", "american legion", "amvets", "post ", "fellowship",
    "veteran service organization", "auxiliary", "fraternal", "moaa",
    "marine corps league", "buddy check", "peer support",
  ],
  "employment": [
    "employ", "job", "career", "hire", "hiring", "workforce", "vocational",
    "voc rehab", "vr&e", "chapter 31", "transition", "skillbridge",
    "apprentice", "trade", "resume", "interview", "linkedin", "vetjob",
    "hire heroes", "doleta", "dvop", "lver", "department of labor",
  ],
  "education": [
    "educat", "school", "college", "university", "degree", "scholarship",
    "tuition", "gi bill", "chapter 33", "vet tec", "certifica", "training",
    "course", "credential", "yellow ribbon", "stem scholarship", "tutor",
  ],
  "transportation": [
    "transport", "ride", "drive", "shuttle", "bus", "transit", "vehicle",
    "automobile", "auto allowance", "dav transportation", "dav van",
    "uber", "lyft", "fleet", "wheels", "mobility",
  ],
  "financial": [
    "financ", "credit", "debt", "loan", "budget", "tax ", "taxes",
    "tax exemption", "property tax", "money", "bank", "lending", "irs",
    "fafsa", "grant", "emergency funds", "utility assistance", "bill pay",
    "rent assistance", "vita", "tax preparation",
  ],
  "legal": [
    "legal", "attorney", "lawyer", "law clinic", "pro bono", "court",
    "advoca", "rights", "discrimination", "uscoa", "judge advocate", "jag",
    "mediation", "expungement", "guardianship", "estate", "will ",
    "power of attorney", "protection & advocacy", "stateside legal",
  ],
  "substance-recovery": [
    "substance", "addiction", "alcohol", "drug", "recovery", "sober", "aa ",
    "alcoholics anonymous", "narcotics anonymous", "na ", "detox", "rehab",
    "treatment", "smart recovery", "12-step", "12 step", "intergroup",
    "wellness", "harm reduction", "medication-assisted",
  ],
  "end-of-life-services": [
    "hospice", "palliative", "funeral", "burial", "cemetery", "memorial",
    "estate planning", "will ", "executor", "survivor benefit",
    "advance directive", "end of life", "end-of-life", "bereave",
    "grief", "interment",
  ],
  "healthcare": [
    "health", "clinic", "hospital", "medical", "physician", "doctor",
    "nurse", "vamc", "va medical", "va clinic", "primary care", "specialty care",
    "dental", "vision", "audiology", "rehabilit", "therapy", "ralph h. johnson",
    "wjb dorn", "community care", "tricare", "champva",
  ],
  "insurance": [
    "insur", "coverage", "policy", "premium", "vgli", "sgli", "tricare",
    "champva", "medicare", "medicaid", "supplement", "long-term care",
    "long term care", "life insurance", "health insurance", "auto insurance",
    "homeowners insurance",
  ],
};

/**
 * Returns true if the haystack contains any of the keyword substrings for
 * the given Resources-side category slug. Returns true for unknown categories
 * (conservative: don't flag what we don't have a list for).
 */
export function matchesCategoryKeywords(
  resourceSlug: string,
  haystack: string,
): boolean {
  const keywords = CATEGORY_KEYWORDS[resourceSlug];
  if (!keywords || keywords.length === 0) return true;
  if (!haystack) return false;
  const h = haystack.toLowerCase();
  for (const kw of keywords) {
    if (h.includes(kw.toLowerCase())) return true;
  }
  return false;
}

/** True if the audit has a keyword list for the given category slug. */
export function hasKeywords(resourceSlug: string): boolean {
  const k = CATEGORY_KEYWORDS[resourceSlug];
  return !!k && k.length > 0;
}
