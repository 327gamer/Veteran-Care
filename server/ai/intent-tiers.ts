export type CategorySlug = string;
export type Tier = 1 | 2 | 3 | null;

export const TIER_MAP: Record<string, Tier> = {
  "housing-home": 1,
  "legal-services": 1,
  "financial-credit": 1,
  "insurance": 1,
  "education-training": 1,
  "end-of-life-services": 1,
  "employment-support": 2,
  "benefits-assistance": 2,
  "disabled-veterans": 2,
  "mental-health": 2,
  "wellness-recovery": 2,
  "healthcare-services": 3,
  "family-support": 3,
  "transportation": 3,
  "community-support": 3,
  "food-assistance": 3,
  "crisis-help": null,
};

export function getTier(slug: string | undefined | null): Tier {
  if (!slug) return null;
  return TIER_MAP[slug] ?? 3;
}

const FIRST_PERSON_VERBS = [
  "i want", "i need", "i'm looking", "im looking", "i am looking",
  "looking for", "help me", "i'd like", "id like", "i would like",
  "trying to", "i'm trying", "im trying", "how do i", "how can i",
  "can you help", "i have to", "i must",
];

const SPECIFIC_NOUNS_BY_CATEGORY: Record<string, string[]> = {
  "housing-home": ["va loan", "mortgage", "house", "home", "apartment", "rent", "refinance"],
  "legal-services": ["lawyer", "attorney", "claim", "appeal", "discharge upgrade"],
  "financial-credit": ["credit", "debt", "bankruptcy", "collections", "loan"],
  "insurance": ["life insurance", "disability insurance", "policy", "coverage"],
  "education-training": ["gi bill", "trade school", "training", "certification", "tuition", "college"],
  "end-of-life-services": ["funeral", "burial", "wills", "estate", "hospice"],
  "employment-support": ["job", "resume", "career", "hire"],
  "benefits-assistance": ["claim", "rating", "compensation", "pact act"],
};

export interface IntentSignal {
  tier: Tier;
  isStrong: boolean;
  reason: string;
}

export function computeIntentSignal(
  message: string,
  detectedCategory: string | null,
): IntentSignal {
  const tier = getTier(detectedCategory);
  if (!detectedCategory || !tier) {
    return { tier: null, isStrong: false, reason: "no category" };
  }

  const lower = message.toLowerCase().trim();
  const wordCount = lower.split(/\s+/).filter(Boolean).length;

  if (wordCount < 4) {
    return { tier, isStrong: false, reason: "too short" };
  }

  const hasFirstPersonVerb = FIRST_PERSON_VERBS.some(v => lower.includes(v));
  const specificNouns = SPECIFIC_NOUNS_BY_CATEGORY[detectedCategory] || [];
  const hasSpecificNoun = specificNouns.some(n => lower.includes(n));

  const isStrong = hasFirstPersonVerb && hasSpecificNoun;

  return {
    tier,
    isStrong,
    reason: isStrong
      ? `tier-${tier} + first-person + specific noun`
      : `tier-${tier} but ${!hasFirstPersonVerb ? "no first-person verb" : "no specific noun"}`,
  };
}

export const APPROVED_HOOKS = [
  "Would you like help connecting with a trusted partner who handles this?",
  "I can guide you through the next step if you'd like.",
  "Want me to put you in touch with someone who works with veterans on this directly?",
  "If it would help, I can request a callback from a navigator who specializes in this.",
  "Would you like me to set up a free intro call with a vetted partner?",
  "I can save your details and have someone reach out — would that be useful?",
  "Some veterans find it easier to talk this through with a person — want me to set that up?",
];

export function pickHook(seedKey: string): string {
  let h = 0;
  for (let i = 0; i < seedKey.length; i++) h = (h * 31 + seedKey.charCodeAt(i)) | 0;
  const idx = Math.abs(h) % APPROVED_HOOKS.length;
  return APPROVED_HOOKS[idx];
}

const DECLINE_PHRASES = [
  "no thanks", "no thank you", "not now", "not right now", "just info",
  "just information", "just looking", "just browsing", "i'm fine",
  "im fine", "no, thanks", "i'll pass", "ill pass", "maybe later",
  "no need", "don't need", "dont need", "not interested",
];

export function detectUserDecline(message: string): boolean {
  const lower = message.toLowerCase();
  return DECLINE_PHRASES.some(p => lower.includes(p));
}
