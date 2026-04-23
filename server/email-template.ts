import crypto from "crypto";
import { platform } from "../shared/platform";

const PUBLIC_BASE_URL =
  process.env.PUBLIC_BASE_URL ||
  process.env.APP_PUBLIC_URL ||
  process.env.PUBLIC_URL ||
  "https://veterancare.com";

// Email logo must be served from a publicly reachable URL — `attached_assets/`
// is not served by the web server, so we use the optimized 256px PNG that
// lives in `client/public/brand/` and is shipped at `/brand/...` on the CDN.
const LOGO_URL =
  process.env.PUBLIC_LOGO_URL ||
  `${PUBLIC_BASE_URL}/brand/veteran-care-logo-256.png`;

const BRAND_GREEN = "#3b4f1f";
const BRAND_GREEN_DARK = "#2d3d17";
const BRAND_TAN_BG = "#fafaf7";
const TEXT_PRIMARY = "#1a1a1a";
const TEXT_MUTED = "#6b7280";

export type EmailCategory =
  | "transactional"
  | "request_reply"
  | "resource_updates"
  | "partner_opportunities"
  | "product_announcements"
  | "billing_notices";

export interface BrandedEmailOptions {
  preheader?: string;
  heading: string;
  intro?: string;
  bodyHtml: string;
  ctas?: Array<{ label: string; href: string; primary?: boolean }>;
  recipientEmail: string;
  category: EmailCategory;
  unsubscribeToken?: string;
}

export function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

export function buildUnsubscribeUrl(token: string, category?: EmailCategory): string {
  const url = new URL(`${PUBLIC_BASE_URL}/unsubscribe`);
  url.searchParams.set("token", token);
  if (category) url.searchParams.set("category", category);
  return url.toString();
}

export function buildPreferencesUrl(token: string): string {
  const url = new URL(`${PUBLIC_BASE_URL}/unsubscribe`);
  url.searchParams.set("token", token);
  url.searchParams.set("manage", "1");
  return url.toString();
}

export function generateUnsubscribeToken(email: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.ADMIN_KEY || "vc-default-secret";
  const h = crypto.createHmac("sha256", secret).update(email.toLowerCase().trim()).digest("hex");
  return `${Buffer.from(email.toLowerCase().trim()).toString("base64url")}.${h.slice(0, 32)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const [b64, sig] = token.split(".");
    if (!b64 || !sig) return null;
    const email = Buffer.from(b64, "base64url").toString("utf8");
    const expected = generateUnsubscribeToken(email).split(".")[1];
    if (sig !== expected) return null;
    return email;
  } catch {
    return null;
  }
}

export function brandedEmailHtml(opts: BrandedEmailOptions): string {
  const token = opts.unsubscribeToken || generateUnsubscribeToken(opts.recipientEmail);
  const unsubUrl = buildUnsubscribeUrl(token, opts.category);
  const prefsUrl = buildPreferencesUrl(token);
  const homeUrl = PUBLIC_BASE_URL;

  const ctaHtml = (opts.ctas || [])
    .map((c) => {
      const isPrimary = c.primary !== false;
      const bg = isPrimary ? BRAND_GREEN : "#ffffff";
      const fg = isPrimary ? "#ffffff" : BRAND_GREEN;
      const border = isPrimary ? BRAND_GREEN : `1px solid ${BRAND_GREEN}`;
      return `<a href="${c.href}" style="display:inline-block;background:${bg};color:${fg};border:${typeof border === "string" && border.startsWith("1px") ? border : `1px solid ${border}`};border-radius:8px;padding:11px 22px;text-decoration:none;font-weight:600;font-family:Inter,Arial,sans-serif;font-size:14px;margin:4px 6px 4px 0;">${escapeHtml(c.label)}</a>`;
    })
    .join("");

  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(opts.preheader)}</div>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1.0" />
<title>${escapeHtml(opts.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_TAN_BG};font-family:Inter,Arial,sans-serif;color:${TEXT_PRIMARY};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_TAN_BG};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <!-- Header -->
      <tr><td align="center" style="background:${BRAND_GREEN};padding:26px 24px 22px;">
        <a href="${homeUrl}" style="text-decoration:none;display:inline-block;background:#ffffff;border-radius:14px;padding:10px;">
          <img src="${LOGO_URL}" alt="${escapeHtml(platform.name)}" width="96" height="96" style="display:block;width:96px;height:auto;border:0;outline:none;text-decoration:none;" />
        </a>
        <div style="font-family:Montserrat,Arial,sans-serif;color:#ffffff;font-size:18px;font-weight:700;margin-top:12px;letter-spacing:0.3px;">
          <a href="${homeUrl}" style="color:#ffffff;text-decoration:none;">${escapeHtml(platform.name)}</a>
        </div>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:28px 28px 8px;">
        <h1 style="font-family:Montserrat,Arial,sans-serif;color:${BRAND_GREEN_DARK};font-size:22px;line-height:1.3;margin:0 0 12px;">${escapeHtml(opts.heading)}</h1>
        ${opts.intro ? `<p style="font-size:15px;line-height:1.55;color:${TEXT_PRIMARY};margin:0 0 14px;">${escapeHtml(opts.intro)}</p>` : ""}
        <div style="font-size:15px;line-height:1.6;color:${TEXT_PRIMARY};">${opts.bodyHtml}</div>
        ${ctaHtml ? `<div style="margin:22px 0 6px;">${ctaHtml}</div>` : ""}
      </td></tr>
      <!-- Divider -->
      <tr><td style="padding:18px 28px 0;"><div style="border-top:1px solid #ececec;"></div></td></tr>
      <!-- Footer -->
      <tr><td style="padding:16px 28px 26px;">
        <p style="font-size:13px;color:${TEXT_MUTED};margin:0 0 6px;font-family:Inter,Arial,sans-serif;">
          <strong style="color:${BRAND_GREEN_DARK};">${escapeHtml(platform.name)}</strong> — Connecting Veterans to Services
        </p>
        <p style="font-size:12px;color:${TEXT_MUTED};margin:0 0 10px;">
          <a href="${homeUrl}" style="color:${BRAND_GREEN};text-decoration:none;">Home</a> &nbsp;·&nbsp;
          <a href="${homeUrl}/resources" style="color:${BRAND_GREEN};text-decoration:none;">Resources</a> &nbsp;·&nbsp;
          <a href="${homeUrl}/contact" style="color:${BRAND_GREEN};text-decoration:none;">Contact</a> &nbsp;·&nbsp;
          <a href="${homeUrl}/privacy" style="color:${BRAND_GREEN};text-decoration:none;">Privacy</a> &nbsp;·&nbsp;
          <a href="${homeUrl}/terms" style="color:${BRAND_GREEN};text-decoration:none;">Terms</a>
        </p>
        <p style="font-size:11px;color:${TEXT_MUTED};margin:14px 0 0;line-height:1.5;">
          You are receiving this email at <span style="color:${TEXT_PRIMARY};">${escapeHtml(opts.recipientEmail)}</span>.
          <a href="${unsubUrl}" style="color:${BRAND_GREEN};text-decoration:underline;">Unsubscribe</a> &nbsp;·&nbsp;
          <a href="${prefsUrl}" style="color:${BRAND_GREEN};text-decoration:underline;">Manage preferences</a>
        </p>
        <p style="font-size:11px;color:${TEXT_MUTED};margin:10px 0 0;">
          Crisis support: call or text the Veterans Crisis Line at <strong style="color:${TEXT_PRIMARY};">988, then press 1</strong>.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export function brandedListUnsubscribeHeaders(email: string): Record<string, string> {
  const token = generateUnsubscribeToken(email);
  // RFC 8058 one-click POST target — must be a server endpoint that accepts
  // `List-Unsubscribe=One-Click` form-encoded POSTs. The token rides in the URL.
  const oneClickUrl = `${PUBLIC_BASE_URL}/api/unsubscribe/one-click?token=${encodeURIComponent(token)}`;
  // Human-friendly preference page for the http(s) entry in the List-Unsubscribe header.
  const prefsUrl = buildUnsubscribeUrl(token);
  return {
    "List-Unsubscribe": `<${oneClickUrl}>, <${prefsUrl}>, <mailto:unsubscribe@veterancare.com?subject=unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
