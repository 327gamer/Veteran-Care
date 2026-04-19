import type { Request, Response } from "express";
import { supabase } from "../supabase";
import { checkSafety } from "./safety";
import { checkRateLimit } from "./rate-limiter";
import { matchResources, detectCategories } from "./resource-matcher";
import { buildSystemPrompt, buildMessageHistory } from "./prompt-builder";
import { streamCompletion } from "./stream";
import { logUsage } from "./usage-logger";
import { checkBudget, invalidateBudgetCache } from "./budget-guard";
import { aiConfig } from "./config";
import { routeToTrustedServices, type TrustedServiceSuggestion } from "../service-router";
import { logLeadEvent } from "../lead-events";
import { computeIntentSignal, pickHook, detectUserDecline, getTier } from "./intent-tiers";
import { isFeatureEnabled } from "../automation-feature-flags";

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  userState?: string;
  userCity?: string;
  userZip?: string;
  interests?: string[];
  branch?: string;
  userDeclinedHelp?: boolean;
}

export async function handleAiChat(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;
  let userId: string | null = null;
  const isGuest = !authHeader;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    try {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    } catch {}
  }

  const ip = req.ip || req.socket.remoteAddress || "unknown";

  const body: ChatRequest = req.body;
  const { messages, userState, userCity, userZip, interests, branch } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
  if (!lastUserMsg) {
    res.status(400).json({ error: "At least one user message is required" });
    return;
  }

  // SAFETY-FIRST: Crisis detection runs BEFORE rate limit. A veteran in crisis
  // who has exhausted their hourly quota must STILL receive the 988 / Crisis
  // Line response. Never block a self-harm message behind a quota.
  const safetyCheck = checkSafety(lastUserMsg.content);
  const bypassRateLimit = safetyCheck.isCrisis;

  if (!bypassRateLimit) {
    const rateCheck = checkRateLimit(userId, ip);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: "You've reached the hourly message limit. Please wait a bit before sending more — or use Request Support to connect with a real person right now.",
        resetMs: rateCheck.resetMs,
        resetMinutes: Math.ceil(rateCheck.resetMs / 60000),
      });
      return;
    }
  }

  if (safetyCheck.isCrisis || safetyCheck.isBlocked) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const responseText = safetyCheck.response!;
    res.write(`data: ${JSON.stringify({ type: "chunk", text: responseText })}\n\n`);
    res.write(`data: ${JSON.stringify({
      type: "done",
      isCrisis: safetyCheck.isCrisis,
      categories: safetyCheck.isCrisis ? ["crisis-help"] : [],
    })}\n\n`);
    res.end();

    logUsage({
      userId,
      isGuest,
      detectedCategory: safetyCheck.isCrisis ? "crisis-help" : "blocked",
      model: "safety-filter",
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      navigatorSuggested: false,
    });
    return;
  }

  const escalationKeywords = [
    "connect me", "contact me", "callback", "call me back",
    "reach out to me", "someone reach out",
    "talk to someone", "speak to someone", "speak with someone",
    "talk to a person", "talk to a real person",
    "need someone to help", "need someone to call",
    "help me connect", "put me in touch",
    "please connect me", "can someone call",
    "someone to help me", "want to talk to someone",
    "real person", "human help",
    "please help me connect", "i want to be connected",
  ];
  const lastMsgLower = lastUserMsg.content.toLowerCase();
  const isEscalation = escalationKeywords.some(kw => lastMsgLower.includes(kw));

  const matchedResources = await matchResources(lastUserMsg.content, userState, userCity);
  const detectedCats = detectCategories(lastUserMsg.content);

  const v2Enabled = await isFeatureEnabled("ai_guide_v2_enabled").catch(() => false);
  const tier1Cat = detectedCats.find(c => getTier(c) === 1) || null;
  const primaryCat = tier1Cat || detectedCats[0] || null;
  const intentSignal = computeIntentSignal(lastUserMsg.content, primaryCat);
  const explicitDeclineThisTurn = detectUserDecline(lastUserMsg.content);
  const sessionDeclined = !!body.userDeclinedHelp || explicitDeclineThisTurn;
  const tier = getTier(primaryCat);
  const tierBasedHookEligible = tier === 1 && intentSignal.isStrong && !sessionDeclined;
  const hookPhrase = tierBasedHookEligible
    ? pickHook(`${primaryCat}|${userState || ""}|${lastUserMsg.content.slice(0, 24)}`)
    : null;

  if (detectedCats.length > 0) {
    logLeadEvent({
      event_type: isEscalation ? "ai_escalation_detected" : "ai_intent_detected",
      lead_class: "ai_intent",
      action_type: isEscalation ? "escalate" : "detect",
      user_id: userId,
      source_surface: "ai_guide",
      ai_origin: true,
      ai_intent_category: detectedCats[0],
      ai_intent_subcategory: detectedCats[1] || null,
      state: userState || null,
      city: userCity || null,
      category_slug: detectedCats[0],
    });
  } else if (isEscalation) {
    logLeadEvent({
      event_type: "ai_escalation_detected",
      lead_class: "ai_intent",
      action_type: "escalate",
      user_id: userId,
      source_surface: "ai_guide",
      ai_origin: true,
      state: userState || null,
      city: userCity || null,
      category_slug: "unknown",
    });
  }

  let trustedServiceResult: { categorySlug: string; categoryName: string; providers: TrustedServiceSuggestion[] } | null = null;
  try {
    trustedServiceResult = await routeToTrustedServices(lastUserMsg.content, userState);
  } catch (err: any) {
    console.log("[service-router] Error:", err?.message);
  }

  const budgetStatus = await checkBudget(isGuest);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (matchedResources.length > 0) {
    res.write(`data: ${JSON.stringify({
      type: "resources",
      resources: matchedResources.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category_name,
        city: r.city,
        state: r.state,
        website_url: r.website_url || null,
        phone: r.phone || null,
      })),
    })}\n\n`);
  }

  if (!budgetStatus.allowed) {
    console.log(`[ai] Budget limit reached (${budgetStatus.todayTokens}/${budgetStatus.limit} tokens). Returning fallback for ${isGuest ? 'guest' : 'authenticated'} user.`);

    res.write(`data: ${JSON.stringify({ type: "chunk", text: aiConfig.fallbackResponse })}\n\n`);
    res.write(`data: ${JSON.stringify({
      type: "done",
      categories: detectedCats,
      navigatorSuggested: true,
      isEscalation,
      escalationCategory: isEscalation ? (detectedCats[0] || null) : undefined,
      resourceCount: matchedResources.length,
      fallbackMode: true,
      trustedServices: trustedServiceResult ? trustedServiceResult.providers : undefined,
      trustedServiceCategory: trustedServiceResult ? trustedServiceResult.categoryName : undefined,
    })}\n\n`);
    res.end();

    logUsage({
      userId,
      isGuest,
      detectedCategory: detectedCats[0] || null,
      model: "fallback",
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      navigatorSuggested: true,
    });
    return;
  }

  const userContext = {
    state: userState,
    city: userCity,
    zip: userZip,
    interests,
    branch,
    isGuest,
  };

  const systemPrompt = buildSystemPrompt(userContext, matchedResources, {
    useV2: v2Enabled,
    intent: {
      tier,
      isStrong: intentSignal.isStrong,
      userDeclined: sessionDeclined,
      hookPhrase,
      detectedCategory: primaryCat,
    },
  });
  const fullMessages = buildMessageHistory(messages, systemPrompt);

  await streamCompletion({
    messages: fullMessages,
    onChunk: (text) => {
      res.write(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`);
    },
    onDone: (fullText, usage) => {
      const navigatorSuggested = !sessionDeclined && (
        isEscalation ||
        tierBasedHookEligible ||
        fullText.toLowerCase().includes("navigator") ||
        fullText.toLowerCase().includes("request support")
      );

      res.write(`data: ${JSON.stringify({
        type: "done",
        categories: detectedCats,
        navigatorSuggested,
        isEscalation,
        escalationCategory: isEscalation ? (detectedCats[0] || null) : undefined,
        resourceCount: matchedResources.length,
        trustedServices: trustedServiceResult ? trustedServiceResult.providers : undefined,
        trustedServiceCategory: trustedServiceResult ? trustedServiceResult.categoryName : undefined,
      })}\n\n`);
      res.end();

      invalidateBudgetCache();
      logUsage({
        userId,
        isGuest,
        detectedCategory: detectedCats[0] || null,
        model: aiConfig.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        navigatorSuggested,
      });
    },
    onError: (error) => {
      console.error("[ai] Stream error:", error.message);
      res.write(`data: ${JSON.stringify({ type: "error", message: "I'm having trouble right now. Please try again in a moment." })}\n\n`);
      res.end();
    },
  });
}
