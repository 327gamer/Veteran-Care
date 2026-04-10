import { platform, t } from "../../shared/platform";

export const aiConfig = {
  model: "gpt-4o-mini",
  maxTokens: 1024,
  temperature: 0.4,

  rateLimits: {
    authenticated: { maxRequests: 30, windowMs: 60 * 60 * 1000 },
    guest: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
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
3. If you don't have specific resources to match a question, say so honestly and suggest they use the "Request a Navigator" button for personalized help.
4. Never fabricate resource names, phone numbers, websites, or addresses. Only cite resources from the MATCHED RESOURCES section.
5. If the user's location is known, prioritize local resources over national ones.
6. When suggesting multiple resources, list the most relevant 2-3, not all of them.
7. End responses with a helpful follow-up question or next step when appropriate.
8. Do not provide medical, legal, or financial advice. Direct users to qualified professionals.
9. If a question is outside your scope (not related to ${platform.userNoun} services), politely redirect.`,

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
    "housing-home": ["housing", "rent", "shelter", "homeless", "apartment", "eviction", "lease", "landlord", "transitional", "section 8", "hud-vash", "home loan", "va home"],
    "healthcare-services": ["healthcare", "health care", "doctor", "medical", "clinic", "va hospital", "va medical", "prescription", "medication", "dental", "vision", "telehealth"],
    "mental-health": ["mental health", "ptsd", "anxiety", "depression", "counseling", "therapy", "therapist", "vet center", "peer support"],
    "benefits-assistance": ["va benefits", "disability claim", "compensation", "pension", "dd214", "pact act", "appeals", "service connected", "rating", "va enrollment", "benefits"],
    "employment-support": ["job", "employment", "career", "resume", "hire", "hiring", "work", "apprenticeship", "certification", "entrepreneurship", "business", "voc rehab"],
    "legal-services": ["legal", "lawyer", "attorney", "court", "law", "discharge upgrade", "expungement", "tenant rights", "family law", "pro bono"],
    "financial-credit": ["financial", "money", "bills", "utilities", "debt", "budget", "emergency funds", "relief fund", "financial counseling", "credit", "mortgage", "lending"],
    "education-training": ["education", "school", "college", "gi bill", "tuition", "degree", "technical", "training", "student"],
    "family-support": ["family", "spouse", "child", "childcare", "caregiver", "dependent", "gold star", "survivor benefits", "parenting"],
    "transportation": ["transportation", "ride", "bus", "transit", "medical transport", "dat", "volunteer driver"],
    "wellness-recovery": ["substance", "alcohol", "drug", "recovery", "detox", "rehab", "sober", "aa", "na", "medication assisted", "wellness", "holistic"],
    "community-support": ["community", "volunteer", "recreation", "social", "peer", "mentor", "fellowship"],
    "food-assistance": ["food", "meals", "food bank", "food pantry", "groceries", "snap", "wic", "hunger"],
    "disabled-veterans": ["disabled veteran", "disability", "adaptive", "wheelchair", "mobility", "service dog", "adaptive housing"],
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

  fallbackResponse: `I found some resources that may help you. Please review the matched resources above for contact details and website links.\n\nFor more personalized guidance, tap the **Request a Navigator** button below to connect with someone who can assist you directly.`,
};
