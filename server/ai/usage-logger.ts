import { supabaseAdmin } from "../supabase";

let hasUsageTable = false;
let checked = false;

async function ensureTableCheck() {
  if (checked) return;
  checked = true;
  try {
    const { error } = await supabaseAdmin
      .from("ai_usage_log")
      .select("id")
      .limit(1);
    hasUsageTable = !error;
    if (!hasUsageTable) {
      console.log("[ai] ai_usage_log table not found — usage logging disabled. Run supabase/create_ai_usage_log.sql to enable.");
    } else {
      console.log("[ai] ai_usage_log table detected — usage logging enabled");
    }
  } catch {
    hasUsageTable = false;
  }
}

export async function logUsage(params: {
  userId: string | null;
  isGuest: boolean;
  detectedCategory: string | null;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  navigatorSuggested: boolean;
}): Promise<void> {
  await ensureTableCheck();
  if (!hasUsageTable) return;

  try {
    await supabaseAdmin.from("ai_usage_log").insert({
      user_id: params.userId,
      is_guest: params.isGuest,
      detected_category: params.detectedCategory,
      model: params.model,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      total_tokens: params.totalTokens,
      navigator_suggested: params.navigatorSuggested,
    });
  } catch (err) {
    console.log("[ai] Usage log insert failed:", (err as Error).message);
  }
}
