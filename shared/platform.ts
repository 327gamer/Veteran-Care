export const platform = {
  name: "Veteran Care",
  domain: "veterancare.com",
  tagline: "Trusted Veteran Support",
  description: "Your comprehensive resource center connecting veterans, their families, and loved ones to trusted support and services.",
  longDescription: "Welcome to Veteran Care — your comprehensive resource center connecting veterans, their families, and loved ones to trusted support and services. Veteran Care helps you quickly find benefits, healthcare, housing assistance, employment programs, legal help, and other local resources in one place.",
  onboardingPrimary: "Support for Veterans. All in One Place.",
  onboardingSubtitle: "Get the help you need — quickly, simply, and locally.",
  onboardingBody: "Veteran Care connects veterans, families, and loved ones to trusted local support — including benefits, healthcare, housing, employment, and more.",
  onboardingCta: "Tell us what you need, and we'll guide you to the right support near you.",
  onboardingAccountSubtitle: "Save your preferences and get faster access to the support you need.",
  onboardingAccountBody: "Get personalized resources, track your requests, and stay connected with trusted local support — all in one place.",
  onboardingAccountPrivacy: "Your information is private and secure.",
  locationPrompt: "Help us show resources near you.",
  locationDescription: "Enabling location allows {name} to quickly direct you to local benefits, services, and support in your area—without you having to search or sort through unnecessary information.",
  logoAlt: "{name} Logo",

  userNoun: "veteran",
  userNounPlural: "veterans",
  userNounCapital: "Veteran",
  userNounPluralCapital: "Veterans",

  navigatorTitle: "Navigator",
  navigatorFullTitle: "{name} Navigator",
  navigatorDescription: "A {name} {navigatorTitle} can help you find benefits, apply for programs, and follow up — for free.",
  navigatorApplyDescription: "A {name} {navigatorTitle} can help you apply and follow up — for free.",
  navigatorConfirmation: "A {name} {navigatorTitle} will reach out to you soon.",
  consentText: "I agree to be contacted by {name} regarding services, support, resources, and opportunities.",

  ai: {
    assistantName: "Veteran Guide",
    welcomeMessage: "Hello! I'm your Veteran Care Guide.\n\nI can help veterans, family members, dependents, caregivers, and case managers find benefits, services, and local resources.\n\nJust type your question below, or tap the microphone on your phone to speak your question, and I'll help point you in the right direction.",
    subtitle: "Always here to help.",
    guideDescription: "An AI-powered assistant that helps {userNounPlural} find resources, get guidance, and navigate support services based on their needs and location.",
    guideIntro: "I'm your {assistantName} — an AI-powered assistant that helps {userNounPlural} find resources, get guidance, and navigate support services based on your needs and location.",
    askPrompt: "Ask the Veteran Guide about benefits, services, or local resources\u2026",
  },

  profileFields: [
    { key: "branch_of_service", label: "Branch of Service", type: "select" as const,
      options: ["Army", "Navy", "Air Force", "Marines", "Coast Guard", "Space Force"] },
    { key: "service_era", label: "Service Era", type: "select" as const,
      options: ["Post-9/11", "Gulf War", "Vietnam", "Korea", "WWII", "Peacetime"] },
    { key: "rank", label: "Rank", type: "text" as const },
    { key: "mos", label: "MOS / Job Code", type: "text" as const },
  ],

  email: {
    fromName: "{name}",
    defaultNotifyEmail: "info@veterancare.com",
    subjectPrefix: "{userNounCapital}",
    leadEmailHeader: "New {userNounCapital} Lead Routed to You",
    inquiryHeader: "New Inquiry from {name}",
    leadFooter: "This lead was routed to {partnerName} by {name} {navigatorTitle}.",
    inquiryFooter: "This inquiry was sent via {name} — {resourceTitle}",
    urgentSubject: "[URGENT] New {userNounCapital} Lead — {category}",
    normalSubject: "New {userNounCapital} Lead — {category}",
    inquiryUrgentSubject: "[URGENT] New {userNounCapital} Inquiry: {category}",
    inquiryNormalSubject: "New {userNounCapital} Inquiry: {category}",
    urgentBanner: "IMMEDIATE — This {userNoun} needs urgent help",
    nextSteps: "Please reach out to this {userNoun} using their preferred contact method. If you are unable to assist, the lead will be automatically rerouted to another partner.",
    inquiryNextSteps: "Please reach out to this {userNoun} using their preferred contact method.",
  },

  nav: {
    bottomTabs: [
      { label: "Home", desc: "Ask questions and find help." },
      { label: "Resources", desc: "Browse {userNoun} programs and services." },
      { label: "My Saved", desc: "Resources you mark as favorites." },
      { label: "Community", desc: "Connect with other {userNounPlural}." },
      { label: "Shop", desc: "Explore trusted partners and services." },
    ],
  },

  storageKey: "veteran-care-app",
  pilotState: "SC",
  timezone: "America/New_York",

  features: {
    community: false,
    shop: false,
    aiGuide: true,
    locationDetection: true,
    savedResources: true,
    navigatorSystem: true,
    partnerRouting: true,
  },
};

export function t(template: string, overrides?: Record<string, string>): string {
  const vars: Record<string, string> = {
    name: platform.name,
    domain: platform.domain,
    userNoun: platform.userNoun,
    userNounPlural: platform.userNounPlural,
    userNounCapital: platform.userNounCapital,
    userNounPluralCapital: platform.userNounPluralCapital,
    navigatorTitle: platform.navigatorTitle,
    assistantName: platform.ai.assistantName,
    ...overrides,
  };
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
}
