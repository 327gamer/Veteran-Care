import type { Express, Request, Response } from "express";
import { z } from "zod";
import { verifyUnsubscribeToken } from "./email-template";
import {
  ensureSuppressionTable,
  getSuppression,
  setPreferences,
  unsubscribeAll,
} from "./email-suppression";

const ALL_CATEGORIES = [
  "request_reply",
  "resource_updates",
  "partner_opportunities",
  "product_announcements",
  "billing_notices",
] as const;

export async function registerUnsubscribeRoutes(app: Express) {
  await ensureSuppressionTable();

  // GET — read current prefs from token (used by /unsubscribe page on load)
  app.get("/api/unsubscribe/status", async (req: Request, res: Response) => {
    const token = String(req.query.token || "");
    const email = verifyUnsubscribeToken(token);
    if (!email) return res.status(400).json({ error: "Invalid or expired link." });
    await ensureSuppressionTable();
    const cur = (await getSuppression(email)) || {
      unsubscribed_all: false,
      suppressed_categories: [],
    };
    res.json({
      email,
      unsubscribed_all: cur.unsubscribed_all,
      suppressed_categories: cur.suppressed_categories,
      categories: ALL_CATEGORIES,
    });
  });

  // POST — one-click unsubscribe (RFC 8058 List-Unsubscribe-Post)
  // Accepts both JSON and `application/x-www-form-urlencoded` bodies.
  // The token rides in the query string; the body is fixed `List-Unsubscribe=One-Click`.
  const oneClickHandler = async (req: Request, res: Response) => {
    const token = String(req.query.token || req.body?.token || "");
    const email = verifyUnsubscribeToken(token);
    if (!email) return res.status(400).json({ error: "Invalid or expired link." });
    await unsubscribeAll(email, "one_click");
    res.json({ ok: true });
  };
  app.post(
    "/api/unsubscribe/one-click",
    (await import("express")).urlencoded({ extended: false }),
    oneClickHandler,
  );

  // POST — save preferences
  const PrefSchema = z.object({
    token: z.string().min(8),
    unsubscribed_all: z.boolean().optional().default(false),
    suppressed_categories: z.array(z.enum(ALL_CATEGORIES)).optional().default([]),
  });
  app.post("/api/unsubscribe/preferences", async (req: Request, res: Response) => {
    const parsed = PrefSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    const email = verifyUnsubscribeToken(parsed.data.token);
    if (!email) return res.status(400).json({ error: "Invalid or expired link." });
    await ensureSuppressionTable();
    const ok = await setPreferences(
      email,
      parsed.data.suppressed_categories,
      parsed.data.unsubscribed_all,
    );
    if (!ok) return res.status(500).json({ error: "Could not save preferences." });
    res.json({ ok: true });
  });
}
