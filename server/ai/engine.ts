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

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  userState?: string;
  userCity?: string;
  userZip?: string;
  interests?: string[];
  branch?: string;
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
  const rateCheck = checkRateLimit(userId, ip);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: "Rate limit exceeded. Please wait before sending more messages.",
      resetMs: rateCheck.resetMs,
    });
    return;
  }

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

  const safetyCheck = checkSafety(lastUserMsg.content);
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

  const matchedResources = await matchResources(lastUserMsg.content, userState, userCity);
  const detectedCats = detectCategories(lastUserMsg.content);

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

  const systemPrompt = buildSystemPrompt(userContext, matchedResources);
  const fullMessages = buildMessageHistory(messages, systemPrompt);

  await streamCompletion({
    messages: fullMessages,
    onChunk: (text) => {
      res.write(`data: ${JSON.stringify({ type: "chunk", text })}\n\n`);
    },
    onDone: (fullText, usage) => {
      const navigatorSuggested = fullText.toLowerCase().includes("navigator") ||
        fullText.toLowerCase().includes("request support");

      res.write(`data: ${JSON.stringify({
        type: "done",
        categories: detectedCats,
        navigatorSuggested,
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
