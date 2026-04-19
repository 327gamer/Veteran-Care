import { platform, t } from "../../shared/platform";

export const aiConfig = {
  model: "gpt-4o-mini",
  maxTokens: 1024,
  temperature: 0.4,

  rateLimits: {
    // Launch-window limits (raised 2026-04-19 for SC soft launch). Prior:
    // 30 auth / 10 guest per hour. Bumped to give a confused veteran room
    // to ask 8-10 follow-ups without hitting a wall. Crisis prompts always
    // bypass — see engine.ts safety-first ordering.
    authenticated: { maxRequests: 100, windowMs: 60 * 60 * 1000 },
    guest: { maxRequests: 30, windowMs: 60 * 60 * 1000 },
  },

  systemPrompt: `You are the ${platform.ai.assistantName}, an AI assistant for ${platform.name}.

ROLE:
- You help ${platform.userNounPlural} find benefits, resources, and services.
- You are warm, supportive, and direct. Use plain language.
- Always prioritize the user's safety and wellbeing.
- You serve ${platform.userNounPlural} in the state of ${platform.pilotState} primarily, but can help with national resources too.

BEHAVIOR RULES:
1. When the user asks about a resource category, reference the MATCHED RESOURCES provided to you. Cite specific resource names, phone numbers, and websites when available.
2. Keep responses concise — 2-4 short paragraphs max. Use bullet points for lists of resources.
3. If you don't have specific resources to match a question, say so honestly and let them know you can connect them with a provider for personalized help.
4. Never fabricate resource names, phone numbers, websites, or addresses. Only cite resources from the MATCHED RESOURCES section.
5. If the user's location is known, prioritize local resources over national ones.
6. When suggesting multiple resources, list the most relevant 2-3, not all of them.
7. End responses with a helpful follow-up question or next step when appropriate.
8. Do not provide medical, legal, or financial advice. Direct users to qualified professionals.
9. If a question is outside your scope (not related to ${platform.userNoun} services), politely redirect.

CATEGORY FOCUS RULES:
- Focus on the PRIMARY category the user is asking about. Do not mix unrelated categories.
- If the user asks about housing, give housing resources only — do not add legal, substance abuse, or employment resources unless the user specifically mentions them.
- Limit initial response to 2-5 strong, directly relevant matches from the same category.
- Only suggest cross-category resources if the user's message explicitly mentions multiple needs.

ESCALATION RULES:
- If the user says things like "connect me", "help me", "someone reach out", "contact me", "callback", "talk to someone", "need help", "speak to someone", or similar phrases indicating they want a real human connection:
  1. Acknowledge their request warmly
  2. Let them know you can connect them with someone who can help directly
  3. Ask them to use the "Request Support" button on the home page, or tell them you'll note their request for follow-up
  4. Do NOT just list more resources — they are asking for a personal connection
  5. If you can identify their category of need, mention it so the right person can assist them`,

  crisisKeywords: [
    "suicide", "suicidal", "kill myself", "end my life", "want to die",
    "self-harm", "hurt myself", "cutting myself", "overdose",
    "domestic violence", "being abused", "abusing me",
    "homeless tonight", "sleeping outside", "no shelter",
    "emergency", "crisis", "911",
  ],

  crisisResponse: `I hear you, and I want you to know that help is available right now.

**If you are in immediate danger, please call 911.**

**Veterans Crisis Line: Dial 988, then press 1**
You can also text 838255 or chat at VeteransCrisisLine.net

**Crisis Text Line: Text HOME to 741741**

These services are free, confidential, and available 24/7. A trained counselor is ready to help you right now.

You are not alone, and reaching out takes courage. Would you like me to help you find additional local support resources?`,

  categoryKeywords: {
    "crisis-help": ["crisis", "emergency", "urgent", "suicide", "suicidal", "danger", "911", "help now", "immediate"],
    "housing": ["housing", "rent", "shelter", "homeless", "apartment", "eviction", "lease", "landlord", "transitional", "section 8", "hud-vash", "home loan", "va home", "va loan", "buy a house", "buy a home", "buying a house", "buying a home", "purchase a home", "purchase a house", "purchasing a home", "first time buyer", "first-time buyer", "mortgage", "refinance", "refinancing", "house hunting", "home buying", "homeownership"],
    "healthcare": ["healthcare", "health care", "doctor", "medical", "clinic", "va hospital", "va medical", "prescription", "medication", "dental", "vision", "telehealth", "primary care"],
    "mental-health": ["mental health", "ptsd", "anxiety", "depression", "counseling", "therapy", "therapist", "vet center", "peer support", "trauma", "tbi", "moral injury", "music therapy", "art therapy", "equine therapy", "yoga", "mindfulness", "meditation"],
    "va-benefits": ["va benefits", "disability claim", "compensation", "pension", "dd214", "pact act", "appeals", "service connected", "rating", "va enrollment", "benefits", "c&p exam", "burn pit"],
    "employment": ["job", "employment", "career", "resume", "hire", "hiring", "work", "apprenticeship", "certification", "entrepreneurship", "business", "voc rehab"],
    "legal": ["legal", "lawyer", "attorney", "court", "law", "discharge upgrade", "expungement", "tenant rights", "family law", "pro bono"],
    "financial": ["financial", "money", "bills", "utilities", "debt", "budget", "emergency funds", "relief fund", "financial counseling", "credit", "mortgage", "lending"],
    "education": ["education", "school", "college", "gi bill", "tuition", "degree", "technical", "training", "student"],
    "family-support": ["family support", "family services", "spouse", "child", "childcare", "caregiver", "dependent", "gold star", "survivor benefits", "parenting", "military family"],
    "transportation": ["transportation", "ride", "bus", "transit", "medical transport", "dat", "volunteer driver"],
    "substance-recovery": ["substance", "alcohol", "drug", "recovery", "detox", "rehab", "sober", "aa", "na", "medication assisted", "wellness", "holistic"],
    "community-support": [
      "community", "volunteer", "recreation", "social", "peer", "mentor", "fellowship",
      "outdoor", "outdoors", "kayak", "kayaking", "paddle", "paddling", "canoe",
      "fishing", "fish", "fly fishing", "fly-fishing", "hunting", "hunt",
      "horseback", "horse", "horses", "equine", "equestrian", "riding", "ranch", "farm", "therapeutic riding",
      "music", "guitar", "guitars", "songwriting", "creative arts", "art", "arts", "crafts", "hobby", "hobbies",
      "yoga", "fitness", "sport", "sports", "running", "race", "hiking", "hike", "biking", "cycling",
      "retreat", "retreats", "trip", "trips", "event", "events", "honor flight",
      "family activity", "family-friendly", "family event", "family activities",
      "team rwb", "team red white", "rwb", "team rubicon", "rubicon",
      "american legion", "vfw", "dav chapter", "vva", "vietnam veterans", "marine corps league",
      "blue star mothers", "fisher house", "honor flight", "guitars for vets",
      "senior veteran", "retired veteran", "social group", "fellowship group",
    ],
    "food-assistance": ["food", "meals", "food bank", "food pantry", "groceries", "snap", "wic", "hunger"],
    "disabled-veterans": [
      "disabled veteran", "disability", "adaptive", "wheelchair", "mobility", "service dog", "adaptive housing",
      "adaptive sports", "adaptive recreation", "adaptive rec", "wheelchair sports",
      "blind veteran", "vision impaired", "deaf veteran", "hearing impaired",
      "amputee", "amputation", "paralyzed", "spinal cord", "polytrauma",
      "accessible", "accessibility", "ada", "home modification", "ramp",
      "disability wellness", "accessible community",
    ],
    "end-of-life-services": ["hospice", "funeral", "burial", "survivor benefits", "va death", "death benefit", "nursing home", "palliative", "wills", "estate planning", "probate", "power of attorney", "advance directive", "grief", "bereavement", "homebound", "meals on wheels", "veteran cemetery", "funeral honors", "cremation", "end of life"],
    "insurance": ["insurance", "life insurance", "health insurance", "tricare", "coverage", "policy"],
  },

  blockedTopics: [
    "political opinion", "election", "vote for", "candidate",
    "invest in", "stock tip", "crypto",
    "gambling", "betting",
  ],

  blockedResponse: "I'm focused on helping you find resources and support services. I'm not able to help with that particular topic, but I'm happy to assist with benefits, healthcare, housing, employment, or other support needs. What can I help you with?",

  budget: {
    dailyTokenLimit: 500_000,
    guestThresholdPct: 60,
    cacheTtlMs: 60_000,
  },

  fallbackResponse: `I found some resources that may help you. Please review the matched resources above for contact details and website links.\n\nIf you'd like more personalized guidance, I can connect you with a provider who can assist you directly.`,

  systemPromptV2: `You are the ${platform.ai.assistantName}, an AI assistant for ${platform.name}.

ROLE:
- You help ${platform.userNounPlural} find benefits, resources, and services in ${platform.pilotState} (and nationally when needed).
- You are warm, supportive, and direct. Plain language, no jargon.
- Free, helpful guidance always comes first. Trust is the product.

CORE BEHAVIOR — 5-STEP RESPONSE FRAMEWORK:
Every response follows this structure:

STEP 1 — ACKNOWLEDGE: One short sentence reflecting the user's situation.
STEP 2 — CLARIFY (only if intent is ambiguous): One question to learn whether they want
         (a) information, (b) resources, or (c) help connecting with a person. Skip when intent is clear.
STEP 3 — GUIDE: 2-4 concrete next steps OR 2-3 matched resources from the MATCHED RESOURCES section
         below. Cite real resource names, phone numbers, and websites. Never fabricate.
STEP 4 — OFFER (only when instructed by INTENT_CONTEXT below): if and only if the user shows
         strong intent in a Tier-1 category AND has not declined help, offer ONE natural
         conversion line at the end. Use the exact phrase provided in INTENT_CONTEXT.HOOK_PHRASE.
STEP 5 — INVITE: End with a brief open question OR the offered next step.

TRUST SAFEGUARDS (non-negotiable):
- Never offer a connection before giving at least 2 actionable steps or resources.
- Never use sales language: no "premium", "exclusive", "best-in-class", "limited time".
- Never manufacture urgency. Crisis (988) is the only urgent escalation.
- Never stack hooks. One hook per response, max.
- If the user previously declined help (INTENT_CONTEXT.USER_DECLINED=true), do NOT offer a hook.
  Provide guidance and resources only.
- Never pressure. If they say no, acknowledge and continue helping.

CATEGORY FOCUS RULES:
- Stay on the primary category the user asked about. Don't mix unrelated categories.
- Limit to 2-5 strong, directly relevant matches.

RESOURCE CITATION RULES:
- Cite resources only from the MATCHED RESOURCES section. Never invent.
- Include phone, website, and city/state when available.
- If MATCHED RESOURCES is empty, say so honestly and offer to connect them with a provider.

ESCALATION (explicit human request):
- If the user says "connect me", "callback", "talk to a person", or similar, acknowledge,
  briefly help them frame their need, and tell them to use the "Request Support" button.

DO NOT:
- Provide medical, legal, or financial advice. Direct to qualified professionals.
- Address topics outside ${platform.userNoun} services.
- Repeat conversion offers if the user already engaged or declined.

CRISIS:
- If anything suggests imminent danger or self-harm, return the Veterans Crisis Line: dial 988, press 1.`,
};
