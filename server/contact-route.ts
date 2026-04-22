import type { Express, Request, Response } from "express";
import { Resend } from "resend";
import OpenAI from "openai";
import { z } from "zod";
import { platform } from "../shared/platform";

const resend = new Resend(process.env.RESEND_API_KEY);
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const CONTACT_INBOX = process.env.CONTACT_INBOX || "info@VeteranCare.com";
const FOUNDER_INBOX = process.env.FOUNDER_INBOX || CONTACT_INBOX;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || `${platform.name} <onboarding@resend.dev>`;

const ContactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  subject: z.string().min(1).max(200),
  message: z.string().min(5).max(8000),
});

const ESCALATION_SUBJECTS = new Set([
  "Media / press",
  "Partnership opportunity",
  "Technical issue",
]);

const URGENT_KEYWORDS = [
  "urgent", "emergency", "crisis", "suicide", "harm", "homeless tonight",
  "lawsuit", "legal action", "subpoena", "lawyer", "attorney",
  "media", "press", "reporter", "journalist",
  "broken", "down", "outage", "can't access", "cannot login",
];

type Triage = {
  shouldEscalate: boolean;
  category: "auto-reply" | "navigator" | "founder";
  reason: string;
  navigatorReply?: string;
};

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function heuristicTriage(input: z.infer<typeof ContactSchema>): Triage {
  const text = `${input.subject}\n${input.message}`.toLowerCase();
  if (ESCALATION_SUBJECTS.has(input.subject)) {
    return { shouldEscalate: true, category: "founder", reason: `Subject "${input.subject}" auto-routes to team.` };
  }
  for (const kw of URGENT_KEYWORDS) {
    if (text.includes(kw)) {
      return { shouldEscalate: true, category: "founder", reason: `Detected urgent keyword: "${kw}".` };
    }
  }
  return { shouldEscalate: false, category: "navigator", reason: "Routine inquiry — Navigator can answer." };
}

async function aiTriageAndDraft(input: z.infer<typeof ContactSchema>): Promise<Triage> {
  const heuristic = heuristicTriage(input);
  if (!openai) return heuristic;

  try {
    const r = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content:
            `You are the ${platform.ai.assistantName}, the email triage and auto-responder for ${platform.name}, a national veteran resource platform. ` +
            `Decide whether an inbound contact-form message can be answered by the AI Navigator (category: "navigator") or must be escalated to the human team (category: "founder"). ` +
            `Escalate when the message involves: media/press, partnerships, legal matters, technical failures, urgent veteran safety, or anything requiring a person. ` +
            `Otherwise, draft a warm, brief, professional reply (3-6 sentences) that addresses the question and points to /resources, /how-it-works, or the AI Navigator. ` +
            `Never fabricate phone numbers, URLs, or specific resources. ` +
            `Reply in strict JSON: {"category":"navigator"|"founder","reason":"...","navigatorReply":"..."}.`,
        },
        {
          role: "user",
          content: `From: ${input.name} <${input.email}>\nSubject: ${input.subject}\n\n${maskPii(input.message)}`,
        },
      ],
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(r.choices[0]?.message?.content || "{}");
    const category: Triage["category"] = parsed.category === "founder" ? "founder" : "navigator";
    return {
      shouldEscalate: category === "founder" || heuristic.shouldEscalate,
      category: heuristic.shouldEscalate ? "founder" : category,
      reason: parsed.reason || heuristic.reason,
      navigatorReply: typeof parsed.navigatorReply === "string" ? parsed.navigatorReply : undefined,
    };
  } catch (err: any) {
    console.warn("[contact] AI triage failed, falling back to heuristic:", err?.message);
    return heuristic;
  }
}

function autoReplyHtml(input: z.infer<typeof ContactSchema>, navigatorReply?: string) {
  const intro = navigatorReply
    ? `<p style="margin:0 0 12px;">${escapeHtml(navigatorReply).replace(/\n/g, "<br/>")}</p>`
    : `<p style="margin:0 0 12px;">Thank you for contacting ${platform.name}. We received your message and our team will follow up shortly.</p>`;
  return `
  <div style="font-family:Inter,Arial,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:24px;">
    <h2 style="font-family:Montserrat,Arial,sans-serif;color:#3b4f1f;margin:0 0 8px;">Thank you for contacting ${platform.name}</h2>
    <p style="color:#555;font-size:13px;margin:0 0 16px;">A note from the ${platform.ai.assistantName}</p>
    ${intro}
    <p style="margin:0 0 12px;">If you need a person, our team will follow up directly. For immediate help finding a resource, visit <a href="https://veterancare.com/resources" style="color:#3b4f1f;">veterancare.com/resources</a> or open the AI Navigator from any page.</p>
    <p style="margin:24px 0 0;color:#888;font-size:12px;">— The ${platform.name} team</p>
  </div>`;
}

function teamNotifyHtml(input: z.infer<typeof ContactSchema>, triage: Triage) {
  const flag = triage.shouldEscalate
    ? `<div style="background:#fef2f2;border-left:4px solid #b91c1c;padding:10px 14px;margin:0 0 14px;color:#7f1d1d;"><strong>ESCALATED</strong> — ${escapeHtml(triage.reason)}</div>`
    : `<div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:10px 14px;margin:0 0 14px;color:#14532d;"><strong>Auto-handled by Navigator</strong> — ${escapeHtml(triage.reason)}</div>`;
  return `
  <div style="font-family:Inter,Arial,sans-serif;color:#1a1a1a;max-width:600px;margin:0 auto;padding:24px;">
    <h2 style="font-family:Montserrat,Arial,sans-serif;color:#3b4f1f;margin:0 0 12px;">New contact form submission</h2>
    ${flag}
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#666;width:90px;">Name</td><td style="padding:6px 0;"><strong>${escapeHtml(input.name)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(input.email)}" style="color:#3b4f1f;">${escapeHtml(input.email)}</a></td></tr>
      <tr><td style="padding:6px 0;color:#666;">Subject</td><td style="padding:6px 0;">${escapeHtml(input.subject)}</td></tr>
    </table>
    <h3 style="font-family:Montserrat,Arial,sans-serif;color:#3b4f1f;margin:18px 0 6px;font-size:14px;">Message</h3>
    <div style="background:#fafaf7;padding:12px 14px;border-radius:6px;white-space:pre-wrap;font-size:14px;line-height:1.5;">${escapeHtml(input.message)}</div>
    ${triage.navigatorReply ? `
      <h3 style="font-family:Montserrat,Arial,sans-serif;color:#3b4f1f;margin:18px 0 6px;font-size:14px;">Navigator draft reply (auto-sent to user)</h3>
      <div style="background:#f0fdf4;padding:12px 14px;border-radius:6px;white-space:pre-wrap;font-size:13px;line-height:1.5;color:#14532d;">${escapeHtml(triage.navigatorReply)}</div>
    ` : ""}
    <p style="margin:24px 0 0;color:#888;font-size:12px;">Routed via ${platform.name} contact form.</p>
  </div>`;
}

// Lightweight in-memory rate limiter — 5 requests / 15 min per IP.
const contactRateBuckets = new Map<string, number[]>();
const CONTACT_RATE_LIMIT = 5;
const CONTACT_RATE_WINDOW_MS = 15 * 60 * 1000;
function clientIp(req: Request): string {
  const fwd = (req.headers["x-forwarded-for"] || "") as string;
  return fwd.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}
function rateLimitOk(ip: string): boolean {
  const now = Date.now();
  const arr = (contactRateBuckets.get(ip) || []).filter((t) => now - t < CONTACT_RATE_WINDOW_MS);
  if (arr.length >= CONTACT_RATE_LIMIT) {
    contactRateBuckets.set(ip, arr);
    return false;
  }
  arr.push(now);
  contactRateBuckets.set(ip, arr);
  return true;
}

// Mask obvious PII (SSNs, VA file/claim numbers) before sending to the AI provider.
function maskPii(s: string): string {
  return s
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED-SSN]")
    .replace(/\b\d{9}\b/g, "[REDACTED-9DIGIT]")
    .replace(/\b(?:c|cs|va|file)#?\s*\d{6,}\b/gi, "[REDACTED-CLAIM]");
}

export function registerContactRoute(app: Express) {
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const ip = clientIp(req);
      if (!rateLimitOk(ip)) {
        return res.status(429).json({ error: "Too many messages. Please try again in a few minutes." });
      }
      const parsed = ContactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }
      const input = parsed.data;
      const triage = await aiTriageAndDraft(input);

      // 1) confirmation + (when safe) Navigator answer back to the user
      const userSubject = triage.category === "navigator" && triage.navigatorReply
        ? `Re: ${input.subject} — ${platform.ai.assistantName} reply`
        : `We received your message — ${platform.name}`;

      const userResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: input.email,
        subject: userSubject,
        html: autoReplyHtml(input, triage.navigatorReply),
        replyTo: CONTACT_INBOX,
      }).catch((e) => { console.warn("[contact] user reply failed:", e?.message); return null; });

      // 2) team notification — always to CONTACT_INBOX, plus FOUNDER_INBOX if escalated
      const teamRecipients = triage.shouldEscalate && FOUNDER_INBOX !== CONTACT_INBOX
        ? [CONTACT_INBOX, FOUNDER_INBOX]
        : [CONTACT_INBOX];

      const teamSubject = triage.shouldEscalate
        ? `[ESCALATED] ${input.subject} — ${input.name}`
        : `[auto-handled] ${input.subject} — ${input.name}`;

      let teamSendError: any = null;
      const teamResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: teamRecipients,
        subject: teamSubject,
        html: teamNotifyHtml(input, triage),
        replyTo: input.email,
      }).catch((e) => { teamSendError = e; console.error("[contact] team notify failed:", e?.message); return null; });

      console.log(`[contact] from=${input.email} subject="${input.subject}" escalated=${triage.shouldEscalate} reason="${triage.reason}" user_email_id=${(userResult as any)?.data?.id || "n/a"} team_email_id=${(teamResult as any)?.data?.id || "n/a"}`);

      // If the team notification failed, the message is effectively lost — surface that to the caller.
      if (teamSendError || !teamResult) {
        return res.status(502).json({
          error: "Could not deliver your message right now. Please try again in a few minutes or email info@VeteranCare.com directly.",
        });
      }

      res.json({ ok: true, escalated: triage.shouldEscalate });
    } catch (err: any) {
      console.error("[contact] route error:", err?.message, err);
      res.status(500).json({ error: "Internal error" });
    }
  });
}
