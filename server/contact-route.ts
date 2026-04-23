import type { Express, Request, Response } from "express";
import { Resend } from "resend";
import OpenAI from "openai";
import { z } from "zod";
import { platform } from "../shared/platform";
import {
  brandedEmailHtml,
  brandedListUnsubscribeHeaders,
  generateUnsubscribeToken,
  escapeHtml,
} from "./email-template";
import { isSuppressed } from "./email-suppression";

const resend = new Resend(process.env.RESEND_API_KEY);
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const CONTACT_INBOX = process.env.CONTACT_INBOX || "info@VeteranCare.com";
const FOUNDER_INBOX = process.env.FOUNDER_INBOX || CONTACT_INBOX;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || `${platform.name} <onboarding@resend.dev>`;

// High-value subjects only — consumer/general questions are routed to the AI Navigator on the page itself.
const ALLOWED_SUBJECTS = [
  "Partnership Inquiry",
  "Trusted Partner Application Support",
  "Media Request",
  "Legal Inquiry",
  "Government / Agency Collaboration",
  "Sponsorship Opportunity",
  "Report Incorrect Listing",
  "Technical Website Issue",
  "Billing / Subscription Issue",
  "Data / Privacy Request",
] as const;

const ContactSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  subject: z.enum(ALLOWED_SUBJECTS),
  message: z.string().min(5).max(8000),
  urgent: z.boolean().optional().default(false),
});

const ESCALATION_SUBJECTS = new Set<string>([
  "Media Request",
  "Legal Inquiry",
  "Sponsorship Opportunity",
  "Government / Agency Collaboration",
  "Partnership Inquiry",
  "Technical Website Issue",
  "Billing / Subscription Issue",
  "Data / Privacy Request",
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

function heuristicTriage(input: z.infer<typeof ContactSchema>): Triage {
  const text = `${input.subject}\n${input.message}`.toLowerCase();
  if (input.urgent) return { shouldEscalate: true, category: "founder", reason: "User flagged the request as urgent." };
  if (ESCALATION_SUBJECTS.has(input.subject)) {
    return { shouldEscalate: true, category: "founder", reason: `Subject "${input.subject}" auto-routes to internal review.` };
  }
  for (const kw of URGENT_KEYWORDS) {
    if (text.includes(kw)) {
      return { shouldEscalate: true, category: "founder", reason: `Detected keyword: "${kw}".` };
    }
  }
  // With consumer subjects removed, anything that reaches this point should still
  // be reviewed (e.g. Report Incorrect Listing).
  return { shouldEscalate: true, category: "founder", reason: "Routine high-value inquiry — flagged for internal review." };
}

function maskPii(s: string): string {
  return s
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED-SSN]")
    .replace(/\b\d{9}\b/g, "[REDACTED-9DIGIT]")
    .replace(/\b(?:c|cs|va|file)#?\s*\d{6,}\b/gi, "[REDACTED-CLAIM]");
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
            `The contact form is restricted to high-value matters only (partnership, media, legal, sponsorship, government, listing corrections, technical, billing, data/privacy). ` +
            `Decide whether the message requires internal review (category: "founder") or can be auto-acknowledged with a brief Navigator note (category: "navigator"). ` +
            `Default to escalation for media, legal, sponsorship, partnership, and government. ` +
            `When you do draft a navigatorReply, keep it 3-5 sentences, warm, professional, and never fabricate phone numbers, URLs, or specific resources. ` +
            `Reply in strict JSON: {"category":"navigator"|"founder","reason":"...","navigatorReply":"..."}.`,
        },
        {
          role: "user",
          content: `From: ${input.name} <${input.email}>\nSubject: ${input.subject}\nUrgent: ${input.urgent ? "yes" : "no"}\n\n${maskPii(input.message)}`,
        },
      ],
      response_format: { type: "json_object" },
    });
    const parsed = JSON.parse(r.choices[0]?.message?.content || "{}");
    const aiCategory: Triage["category"] = parsed.category === "navigator" ? "navigator" : "founder";
    return {
      shouldEscalate: heuristic.shouldEscalate || aiCategory === "founder",
      category: heuristic.shouldEscalate ? "founder" : aiCategory,
      reason: parsed.reason || heuristic.reason,
      navigatorReply: typeof parsed.navigatorReply === "string" ? parsed.navigatorReply : undefined,
    };
  } catch (err: any) {
    console.warn("[contact] AI triage failed, falling back to heuristic:", err?.message);
    return heuristic;
  }
}

function userBodyHtml(input: z.infer<typeof ContactSchema>, triage: Triage): string {
  const navNote = triage.navigatorReply
    ? `<div style="background:#f5f3eb;border-left:4px solid #b08a2a;border-radius:6px;padding:14px 16px;margin:0 0 16px;">
         <p style="margin:0 0 6px;font-size:13px;color:#3b4f1f;font-weight:600;">A note from the ${escapeHtml(platform.ai.assistantName)}</p>
         <p style="margin:0;font-size:14px;line-height:1.55;color:#1a1a1a;">${escapeHtml(triage.navigatorReply).replace(/\n/g, "<br/>")}</p>
       </div>`
    : "";
  return `
    ${navNote}
    <p>Thanks for reaching out about <strong>${escapeHtml(input.subject)}</strong>. Special requests may be reviewed by our team when necessary.</p>
    <p>Need an answer faster? The Veteran Navigator is available 24/7 to help you find resources, programs, and trusted services.</p>
    <p style="margin:18px 0 0;font-size:13px;color:#6b7280;">Reference: <span style="font-family:monospace;">${escapeHtml(input.subject.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}-${Date.now().toString(36)}</span></p>
  `;
}

function teamBodyHtml(input: z.infer<typeof ContactSchema>, triage: Triage): string {
  const flag = triage.shouldEscalate
    ? `<div style="background:#fef2f2;border-left:4px solid #b91c1c;padding:10px 14px;margin:0 0 14px;color:#7f1d1d;border-radius:4px;"><strong>ESCALATED</strong> — ${escapeHtml(triage.reason)}</div>`
    : `<div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:10px 14px;margin:0 0 14px;color:#14532d;border-radius:4px;"><strong>Auto-handled</strong> — ${escapeHtml(triage.reason)}</div>`;
  return `
    ${flag}
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#666;width:90px;">Name</td><td style="padding:6px 0;"><strong>${escapeHtml(input.name)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(input.email)}" style="color:#3b4f1f;">${escapeHtml(input.email)}</a></td></tr>
      <tr><td style="padding:6px 0;color:#666;">Subject</td><td style="padding:6px 0;">${escapeHtml(input.subject)}</td></tr>
      <tr><td style="padding:6px 0;color:#666;">Urgent</td><td style="padding:6px 0;">${input.urgent ? "yes" : "no"}</td></tr>
    </table>
    <h3 style="font-family:Montserrat,Arial,sans-serif;color:#3b4f1f;margin:18px 0 6px;font-size:14px;">Message</h3>
    <div style="background:#fafaf7;padding:12px 14px;border-radius:6px;white-space:pre-wrap;font-size:14px;line-height:1.5;">${escapeHtml(input.message)}</div>
    ${triage.navigatorReply ? `
      <h3 style="font-family:Montserrat,Arial,sans-serif;color:#3b4f1f;margin:18px 0 6px;font-size:14px;">Navigator draft (auto-sent)</h3>
      <div style="background:#f0fdf4;padding:12px 14px;border-radius:6px;white-space:pre-wrap;font-size:13px;line-height:1.5;color:#14532d;">${escapeHtml(triage.navigatorReply)}</div>
    ` : ""}
  `;
}

// Lightweight in-memory rate limit — 5 / 15min / IP
const buckets = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 15 * 60 * 1000;
function clientIp(req: Request) {
  const fwd = (req.headers["x-forwarded-for"] || "") as string;
  return fwd.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
}
function rateLimitOk(ip: string) {
  const now = Date.now();
  const arr = (buckets.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_LIMIT) { buckets.set(ip, arr); return false; }
  arr.push(now); buckets.set(ip, arr); return true;
}

export function registerContactRoute(app: Express) {
  app.get("/api/contact/subjects", (_req, res) => res.json({ subjects: ALLOWED_SUBJECTS }));

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

      // 1) Branded confirmation to user (transactional — bypasses suppression by policy)
      const userToken = generateUnsubscribeToken(input.email);
      const userHtml = brandedEmailHtml({
        recipientEmail: input.email,
        category: "request_reply",
        unsubscribeToken: userToken,
        preheader: `We received your ${input.subject.toLowerCase()} — Veteran Care`,
        heading: `Thanks for reaching out, ${input.name.split(/\s+/)[0]}`,
        intro: triage.navigatorReply ? undefined : "We received your message. Special requests may be reviewed by our team when necessary.",
        bodyHtml: userBodyHtml(input, triage),
        ctas: [
          { label: "Open Veteran Navigator", href: `${process.env.PUBLIC_BASE_URL || "https://veterancare.com"}/?openNavigator=1`, primary: true },
          { label: "Browse Resources", href: `${process.env.PUBLIC_BASE_URL || "https://veterancare.com"}/resources`, primary: false },
        ],
      });

      const userSuppressedReply = await isSuppressed(input.email, "request_reply");

      const userResult = userSuppressedReply ? null : await resend.emails.send({
        from: FROM_EMAIL,
        to: input.email,
        subject: triage.navigatorReply
          ? `Re: ${input.subject} — ${platform.ai.assistantName} reply`
          : `We received your message — ${platform.name}`,
        html: userHtml,
        replyTo: CONTACT_INBOX,
        headers: brandedListUnsubscribeHeaders(input.email),
      } as any).catch((e) => { console.warn("[contact] user reply failed:", e?.message); return null; });

      // 2) Branded internal team notification (always sends; transactional)
      const teamRecipients = triage.shouldEscalate && FOUNDER_INBOX !== CONTACT_INBOX
        ? [CONTACT_INBOX, FOUNDER_INBOX]
        : [CONTACT_INBOX];

      const teamHtml = brandedEmailHtml({
        recipientEmail: teamRecipients[0],
        category: "transactional",
        heading: triage.shouldEscalate
          ? `[ESCALATED] ${input.subject}`
          : `[auto-handled] ${input.subject}`,
        bodyHtml: teamBodyHtml(input, triage),
        ctas: [
          { label: "Reply to sender", href: `mailto:${input.email}?subject=Re:%20${encodeURIComponent(input.subject)}` },
        ],
      });

      let teamSendError: any = null;
      const teamResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: teamRecipients,
        subject: triage.shouldEscalate
          ? `[ESCALATED] ${input.subject} — ${input.name}`
          : `[auto-handled] ${input.subject} — ${input.name}`,
        html: teamHtml,
        replyTo: input.email,
      }).catch((e) => { teamSendError = e; console.error("[contact] team notify failed:", e?.message); return null; });

      console.log(`[contact] from=${input.email} subject="${input.subject}" escalated=${triage.shouldEscalate} reason="${triage.reason}" suppressed_user=${userSuppressedReply} user_id=${(userResult as any)?.data?.id || "n/a"} team_id=${(teamResult as any)?.data?.id || "n/a"}`);

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
