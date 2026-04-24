import { aiConfig } from "./config";
import { platform } from "../../shared/platform";

interface UserContext {
  state?: string;
  city?: string;
  zip?: string;
  interests?: string[];
  branch?: string;
  isGuest: boolean;
}

interface MatchedResource {
  id: string;
  title: string;
  short_description: string | null;
  phone: string | null;
  website_url: string | null;
  city: string | null;
  state: string | null;
  eligibility: string | null;
  subcategory: string | null;
  category_slug: string | null;
  category_name: string | null;
}

export interface IntentContext {
  tier: 1 | 2 | 3 | null;
  isStrong: boolean;
  userDeclined: boolean;
  hookPhrase: string | null;
  detectedCategory: string | null;
}

export function buildSystemPrompt(
  userContext: UserContext,
  matchedResources: MatchedResource[],
  options?: { useV2?: boolean; intent?: IntentContext },
): string {
  const useV2 = !!options?.useV2;
  const basePrompt = useV2 ? aiConfig.systemPromptV2 : aiConfig.systemPrompt;
  const parts: string[] = [basePrompt];

  if (useV2 && options?.intent) {
    const i = options.intent;
    const shouldOfferHook = i.tier === 1 && i.isStrong && !i.userDeclined && !!i.hookPhrase;
    parts.push("\n\nINTENT_CONTEXT:");
    parts.push(`- DETECTED_CATEGORY: ${i.detectedCategory || "none"}`);
    parts.push(`- TIER: ${i.tier ?? "none"}`);
    parts.push(`- INTENT_STRENGTH: ${i.isStrong ? "strong" : "weak"}`);
    parts.push(`- USER_DECLINED: ${i.userDeclined ? "true" : "false"}`);
    parts.push(`- OFFER_HOOK: ${shouldOfferHook ? "YES" : "NO"}`);
    if (shouldOfferHook && i.hookPhrase) {
      parts.push(`- HOOK_PHRASE (use this exact line at the end of your response): "${i.hookPhrase}"`);
    } else {
      parts.push(`- HOOK_PHRASE: (none — do NOT offer a connection this turn)`);
    }
  }

  parts.push("\n\nUSER CONTEXT:");
  if (userContext.state) {
    parts.push(`- Location: ${userContext.city ? userContext.city + ", " : ""}${userContext.state}${userContext.zip ? " " + userContext.zip : ""}`);
  } else {
    parts.push("- Location: UNKNOWN. Do NOT assume a state. If the user is asking about a local resource (housing, food, healthcare, jobs, legal, transportation, family support, end-of-life, etc.), your response MUST ask them for their city and state before listing local programs. National resources (e.g., 988 Veterans Crisis Line, VA national hotlines, GI Bill, federal benefits) are fine to mention without a location.");
  }

  if (userContext.branch) {
    parts.push(`- Branch of Service: ${userContext.branch}`);
  }

  if (userContext.interests && userContext.interests.length > 0) {
    parts.push(`- Interests: ${userContext.interests.join(", ")}`);
  }

  parts.push(`- Account type: ${userContext.isGuest ? "Guest" : "Registered user"}`);

  if (matchedResources.length > 0) {
    parts.push("\n\nMATCHED RESOURCES (cite these when relevant):");
    for (const r of matchedResources) {
      const lines: string[] = [`- **${r.title}**`];
      if (r.category_name) lines.push(`  Category: ${r.category_name}`);
      if (r.subcategory) lines.push(`  Subcategory: ${r.subcategory}`);
      if (r.short_description) lines.push(`  Description: ${r.short_description}`);
      if (r.city && r.state) lines.push(`  Location: ${r.city}, ${r.state}`);
      else if (r.state) lines.push(`  Location: ${r.state} (statewide)`);
      else lines.push(`  Location: National`);
      if (r.phone) lines.push(`  Phone: ${r.phone}`);
      if (r.website_url) lines.push(`  Website: ${r.website_url}`);
      if (r.eligibility) lines.push(`  Eligibility: ${r.eligibility}`);
      parts.push(lines.join("\n"));
    }
  } else {
    parts.push("\n\nMATCHED RESOURCES: None found for this query. Be honest about this and let the user know you can connect them with a provider for personalized assistance.");
  }

  parts.push(`\n\nIMPORTANT FORMATTING:
- Use **bold** for resource names and important details.
- Use bullet points for lists.
- Include phone numbers and websites when citing resources.
- If suggesting a Navigator, mention they can tap the "Request Support" button on the home page.`);

  return parts.join("\n");
}

export function buildMessageHistory(
  chatHistory: Array<{ role: string; content: string }>,
  systemPrompt: string,
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  const recentHistory = chatHistory.slice(-10);

  for (const msg of recentHistory) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  return messages;
}
