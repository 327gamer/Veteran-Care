import { aiConfig } from "./config";

export interface SafetyCheck {
  isCrisis: boolean;
  isBlocked: boolean;
  response: string | null;
}

export function checkSafety(message: string): SafetyCheck {
  const lower = message.toLowerCase();

  for (const keyword of aiConfig.crisisKeywords) {
    if (lower.includes(keyword)) {
      return {
        isCrisis: true,
        isBlocked: false,
        response: aiConfig.crisisResponse,
      };
    }
  }

  for (const topic of aiConfig.blockedTopics) {
    if (lower.includes(topic)) {
      return {
        isCrisis: false,
        isBlocked: true,
        response: aiConfig.blockedResponse,
      };
    }
  }

  return { isCrisis: false, isBlocked: false, response: null };
}
