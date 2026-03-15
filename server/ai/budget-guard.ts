import { supabaseAdmin } from "../supabase";
import { aiConfig } from "./config";

interface BudgetStatus {
  allowed: boolean;
  todayTokens: number;
  limit: number;
}

let cachedTokens: number | null = null;
let cacheTime = 0;

function todayStart(): string {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
}

async function fetchTodayTokens(): Promise<number> {
  const now = Date.now();
  if (cachedTokens !== null && now - cacheTime < aiConfig.budget.cacheTtlMs) {
    return cachedTokens;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("ai_usage_log")
      .select("total_tokens")
      .gte("created_at", todayStart())
      .neq("model", "safety-filter");

    if (error || !data) {
      return cachedTokens ?? 0;
    }

    const total = data.reduce((sum, row) => sum + (row.total_tokens || 0), 0);
    cachedTokens = total;
    cacheTime = now;
    return total;
  } catch {
    return cachedTokens ?? 0;
  }
}

export function invalidateBudgetCache(): void {
  cachedTokens = null;
  cacheTime = 0;
}

export async function checkBudget(isGuest: boolean): Promise<BudgetStatus> {
  const todayTokens = await fetchTodayTokens();
  const { dailyTokenLimit, guestThresholdPct } = aiConfig.budget;

  const limit = isGuest
    ? Math.floor(dailyTokenLimit * (guestThresholdPct / 100))
    : dailyTokenLimit;

  return {
    allowed: todayTokens < limit,
    todayTokens,
    limit,
  };
}
