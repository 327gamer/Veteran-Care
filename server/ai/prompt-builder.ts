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

export function buildSystemPrompt(
  userContext: UserContext,
  matchedResources: MatchedResource[],
): string {
  const parts: string[] = [aiConfig.systemPrompt];

  parts.push("\n\nUSER CONTEXT:");
  if (userContext.state) {
    parts.push(`- Location: ${userContext.city ? userContext.city + ", " : ""}${userContext.state}${userContext.zip ? " " + userContext.zip : ""}`);
  } else {
    parts.push("- Location: Unknown (suggest they enable location for better results)");
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
