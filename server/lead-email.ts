import { Resend } from "resend";
import crypto from "crypto";
import { supabase, supabaseAdmin } from "./supabase";
import { platform, t } from "../shared/platform";
import { queueDigestEvent } from "./founder-digest";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || `${platform.name} <onboarding@resend.dev>`;

const ACTION_SECRET = process.env.ADMIN_KEY || "vc-lead-action-secret";

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export function generateLeadActionToken(leadId: string, action: string): string {
  const ts = Date.now().toString(36);
  const payload = `${leadId}:${action}:${ts}`;
  const hmac = crypto.createHmac("sha256", ACTION_SECRET).update(payload).digest("hex").slice(0, 16);
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

export function verifyLeadActionToken(token: string): { leadId: string; action: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length < 4) return null;
    const hmac = parts.pop()!;
    const ts = parts.pop()!;
    const action = parts.pop()!;
    const leadId = parts.join(":");
    const expectedHmac = crypto.createHmac("sha256", ACTION_SECRET).update(`${leadId}:${action}:${ts}`).digest("hex").slice(0, 16);
    if (hmac.length !== expectedHmac.length) return null;
    const match = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac));
    if (!match) return null;
    const tokenTime = parseInt(ts, 36);
    if (isNaN(tokenTime) || Date.now() - tokenTime > TOKEN_EXPIRY_MS) return null;
    const validActions = ["accepted"];
    if (!validActions.includes(action)) return null;
    return { leadId, action };
  } catch { return null; }
}

// ── Partner Outcome Capture (Won / Lost / No Contact) ──
// Distinct token namespace from lead-action so the two cannot collide.
const OUTCOME_VALID = ["won", "lost", "no_contact"] as const;
type OutcomeValue = typeof OUTCOME_VALID[number];

export function generateOutcomeToken(leadId: string, outcome: OutcomeValue): string {
  const ts = Date.now().toString(36);
  const payload = `outcome:${leadId}:${outcome}:${ts}`;
  const hmac = crypto.createHmac("sha256", ACTION_SECRET).update(payload).digest("hex").slice(0, 16);
  return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

export function verifyOutcomeToken(token: string): { leadId: string; outcome: OutcomeValue } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length < 5) return null;
    const hmac = parts.pop()!;
    const ts = parts.pop()!;
    const outcome = parts.pop()!;
    const namespace = parts.shift()!;
    const leadId = parts.join(":");
    if (namespace !== "outcome") return null;
    if (!(OUTCOME_VALID as readonly string[]).includes(outcome)) return null;
    const expectedHmac = crypto.createHmac("sha256", ACTION_SECRET).update(`outcome:${leadId}:${outcome}:${ts}`).digest("hex").slice(0, 16);
    if (hmac.length !== expectedHmac.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) return null;
    const tokenTime = parseInt(ts, 36);
    if (isNaN(tokenTime) || Date.now() - tokenTime > TOKEN_EXPIRY_MS) return null;
    return { leadId, outcome: outcome as OutcomeValue };
  } catch { return null; }
}

function getBaseUrl(): string {
  if (process.env.NODE_ENV === "production" && platform.domain) {
    return `https://${platform.domain}`;
  }
  return process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
    : "http://localhost:5000";
}

function buildActionButtonsHtml(leadId: string): string {
  const baseUrl = getBaseUrl();
  const token = generateLeadActionToken(leadId, "accepted");
  const url = `${baseUrl}/api/partner/lead-action?token=${token}`;
  return `
  <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:18px;margin-bottom:20px;text-align:center;">
    <p style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:#14532D;">Ready to assist this veteran?</p>
    <p style="margin:0 0 14px 0;font-size:12px;color:#166534;">Tap below to claim this lead. $49.99 will be charged to your card on file and the lead will be assigned to you.</p>
    <a href="${url}" style="display:inline-block;text-align:center;padding:14px 32px;background:#16A34A;border-radius:6px;color:#FFFFFF;font-weight:700;font-size:16px;text-decoration:none;">Accept Lead — $49.99</a>
  </div>`;
}

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildUnsubscribeFooter(recipientEmail: string): string {
  const unsubMailto = `mailto:${platform.email.defaultNotifyEmail}?subject=Unsubscribe&body=Please%20unsubscribe%20${encodeURIComponent(recipientEmail)}%20from%20${encodeURIComponent(platform.name)}%20lead%20notifications.`;
  return `
  <div style="text-align: center; padding: 12px 0 4px 0; color: #9CA3AF; font-size: 11px;">
    <p style="margin: 0;">You are receiving this because your business is listed on ${platform.name}.</p>
    <p style="margin: 4px 0 0 0;"><a href="${unsubMailto}" style="color: #6B7280; text-decoration: underline;">Unsubscribe</a> from lead notifications.</p>
  </div>`;
}

interface LeadEmailData {
  leadId: string;
  veteranName: string;
  veteranPhone: string | null;
  veteranEmail: string | null;
  category: string | null;
  subcategory: string | null;
  urgency: string | null;
  message: string | null;
  userState: string | null;
  userCity: string | null;
  preferredContact: string | null;
  createdAt: string;
}

interface PartnerEmailData {
  partnerName: string;
  contactEmail: string;
  contactName: string | null;
}

function urgencyLabel(urgency: string | null): string {
  switch (urgency) {
    case "immediate": return "IMMEDIATE — Urgent";
    case "same_week": return "Same Week";
    case "standard": return "Standard";
    case "information": return "Information Only";
    default: return "Not specified";
  }
}

function urgencyColor(urgency: string | null): string {
  switch (urgency) {
    case "immediate": return "#DC2626";
    case "same_week": return "#D97706";
    case "standard": return "#2563EB";
    case "information": return "#6B7280";
    default: return "#6B7280";
  }
}

function buildLeadEmailHtml(lead: LeadEmailData, partner: PartnerEmailData): string {
  const urgencyText = urgencyLabel(lead.urgency);
  const urgencyBgColor = urgencyColor(lead.urgency);
  const isImmediate = lead.urgency === "immediate";
  const timestamp = new Date(lead.createdAt).toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });
  const baseUrl = getBaseUrl();
  const logoUrl = platform.domain ? `https://${platform.domain}/logo.png` : `${baseUrl}/logo.png`;
  const partnerApplyUrl = platform.domain ? `https://${platform.domain}/partner-apply` : `${baseUrl}/partner-apply`;
  const siteUrl = platform.domain ? `https://${platform.domain}` : baseUrl;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  
  <div style="text-align: center; padding: 24px 0; border-bottom: 2px solid #166534; margin-bottom: 24px;">
    <img src="${logoUrl}" alt="${platform.name}" style="display:block;width:200px;height:auto;margin:0 auto;border:0;" />
  </div>

  ${isImmediate ? `<div style="background: #FEE2E2; border: 2px solid #DC2626; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
    <strong style="color: #DC2626; font-size: 16px;">IMMEDIATE — This ${platform.userNoun} needs urgent help</strong>
    <p style="color: #991B1B; margin: 4px 0 0 0; font-size: 13px;">Please respond as quickly as possible. Escalation occurs in 15 minutes if unacknowledged.</p>
  </div>` : ""}

  <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 4px 0; color: #166534; font-size: 18px;">New ${platform.userNounCapital} Lead Routed to You</h2>
    <p style="margin: 0; color: #15803D; font-size: 13px;">via ${platform.name} ${platform.navigatorTitle}</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px; width: 140px;">Veteran Name</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-weight: 600;">${escapeHtml(lead.veteranName)}</td>
    </tr>
    ${lead.veteranPhone ? `<tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Phone</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;"><a href="tel:${escapeHtml(lead.veteranPhone)}" style="color: #2563EB;">${escapeHtml(lead.veteranPhone)}</a></td>
    </tr>` : ""}
    ${lead.veteranEmail ? `<tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Email</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;"><a href="mailto:${escapeHtml(lead.veteranEmail)}" style="color: #2563EB;">${escapeHtml(lead.veteranEmail)}</a></td>
    </tr>` : ""}
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Preferred Contact</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">${escapeHtml(lead.preferredContact) || "Not specified"}</td>
    </tr>
    ${lead.userCity || lead.userState ? `<tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Location</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">${[escapeHtml(lead.userCity), escapeHtml(lead.userState)].filter(Boolean).join(", ")}</td>
    </tr>` : ""}
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Category</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">${escapeHtml(lead.category) || "General"}${lead.subcategory ? ` — ${escapeHtml(lead.subcategory)}` : ""}</td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Urgency</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">
        <span style="background: ${urgencyBgColor}; color: white; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${urgencyText}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Submitted</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">${timestamp} ET</td>
    </tr>
  </table>

  ${lead.message ? `<div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
    <p style="margin: 0 0 6px 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Veteran's Message</p>
    <p style="margin: 0; font-size: 14px; line-height: 1.5;">${escapeHtml(lead.message).replace(/\n/g, "<br>")}</p>
  </div>` : ""}

  <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 13px; color: #92400E;">
      <strong>Next Steps:</strong> Tap "Accept Lead" below to claim this veteran. Your card on file will be charged $49.99 and the lead will be exclusively assigned to you. If you do not accept within a short window, the lead will rotate to another partner automatically.
    </p>
  </div>

  ${buildActionButtonsHtml(lead.leadId)}

  <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; text-align: center;">
    <p style="margin: 0 0 8px 0; font-size: 15px; font-weight: 600; color: #0C4A6E;">Want to help more veterans?</p>
    <p style="margin: 0 0 14px 0; font-size: 13px; color: #0369A1; line-height: 1.5;">Join our trusted network or refer other organizations that can support veterans in your community.</p>
    <a href="${partnerApplyUrl}" style="display: inline-block; background: #166534; color: white; padding: 10px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none;">Become a Trusted Partner</a>
    <p style="margin: 10px 0 0 0; font-size: 12px; color: #6B7280;">Know another organization that can help veterans? <a href="${siteUrl}" style="color: #2563EB; text-decoration: underline;">Share VeteranCare.com</a></p>
  </div>

  <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; color: #9CA3AF; font-size: 11px;">
    <p>This lead was routed to ${escapeHtml(partner.partnerName)} by ${platform.name} ${platform.navigatorTitle}.</p>
    <p>Lead ID: ${lead.leadId}</p>
  </div>

  ${buildUnsubscribeFooter(partner.contactEmail)}

</body>
</html>`;
}

function buildResourceNotificationHtml(lead: LeadEmailData, resourceTitle: string, notifyEmail: string): string {
  const urgencyText = urgencyLabel(lead.urgency);
  const urgencyBgColor = urgencyColor(lead.urgency);
  const isImmediate = lead.urgency === "immediate";
  const timestamp = new Date(lead.createdAt).toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  
  ${isImmediate ? `<div style="background: #FEE2E2; border: 2px solid #DC2626; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
    <strong style="color: #DC2626; font-size: 16px;">IMMEDIATE — This ${platform.userNoun} needs urgent help</strong>
    <p style="color: #991B1B; margin: 4px 0 0 0; font-size: 13px;">Please respond as quickly as possible.</p>
  </div>` : ""}

  <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 4px 0; color: #166534; font-size: 18px;">New Inquiry from ${platform.name}</h2>
    <p style="margin: 0; color: #15803D; font-size: 13px;">Resource: ${escapeHtml(resourceTitle)}</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px; width: 140px;">Veteran Name</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-weight: 600;">${escapeHtml(lead.veteranName)}</td>
    </tr>
    ${lead.veteranPhone ? `<tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Phone</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;"><a href="tel:${escapeHtml(lead.veteranPhone)}" style="color: #2563EB;">${escapeHtml(lead.veteranPhone)}</a></td>
    </tr>` : ""}
    ${lead.veteranEmail ? `<tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Email</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;"><a href="mailto:${escapeHtml(lead.veteranEmail)}" style="color: #2563EB;">${escapeHtml(lead.veteranEmail)}</a></td>
    </tr>` : ""}
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Preferred Contact</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">${escapeHtml(lead.preferredContact) || "Not specified"}</td>
    </tr>
    ${lead.userCity || lead.userState ? `<tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Location</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">${[escapeHtml(lead.userCity), escapeHtml(lead.userState)].filter(Boolean).join(", ")}</td>
    </tr>` : ""}
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Category</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">${escapeHtml(lead.category) || "General"}${lead.subcategory ? ` — ${escapeHtml(lead.subcategory)}` : ""}</td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Urgency</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">
        <span style="background: ${urgencyBgColor}; color: white; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${urgencyText}</span>
      </td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Submitted</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">${timestamp} ET</td>
    </tr>
  </table>

  ${lead.message ? `<div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
    <p style="margin: 0 0 6px 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Veteran's Message</p>
    <p style="margin: 0; font-size: 14px; line-height: 1.5;">${escapeHtml(lead.message).replace(/\n/g, "<br>")}</p>
  </div>` : ""}

  <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 13px; color: #92400E;">
      <strong>Next Steps:</strong> Please reach out to this ${platform.userNoun} using their preferred contact method.
    </p>
  </div>

  <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; color: #9CA3AF; font-size: 11px;">
    <p>This inquiry was sent via ${platform.name} — ${escapeHtml(resourceTitle)}</p>
    <p>Lead ID: ${lead.leadId}</p>
  </div>

  ${notifyEmail !== platform.email.defaultNotifyEmail ? buildUnsubscribeFooter(notifyEmail) : ""}

</body>
</html>`;
}

const DEFAULT_NOTIFY_EMAIL = platform.email.defaultNotifyEmail;

const RESOURCE_NOTIFY_CONFIG: Record<string, string> = {
  [platform.name]: DEFAULT_NOTIFY_EMAIL,
};

export async function sendNavigatorNotification(
  leadId: string,
  resourceId?: string | null
): Promise<{ sent: boolean; error?: string }> {
  try {
    console.log(`[email] Notification triggered for lead ${leadId}${resourceId ? `, resource ${resourceId}` : " (no resource)"}`);

    let resourceTitle = "General Help Request";
    let notifyEmail = DEFAULT_NOTIFY_EMAIL;

    if (resourceId) {
      const { data: resource, error: resErr } = await supabase
        .from("resources")
        .select("id, title, source_name")
        .eq("id", resourceId)
        .single();

      if (resource) {
        resourceTitle = resource.title || resourceTitle;
        if (resource.source_name && RESOURCE_NOTIFY_CONFIG[resource.source_name]) {
          notifyEmail = RESOURCE_NOTIFY_CONFIG[resource.source_name];
          console.log(`[email] Using config for source "${resource.source_name}": ${notifyEmail}`);
        }
      } else {
        console.log(`[email] Resource ${resourceId} not found: ${resErr?.message} — using default`);
      }
    }

    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("navigator_requests")
      .select("id, veteran_name, veteran_phone, veteran_email, category, subcategory, urgency, message, user_state, user_city, preferred_contact, created_at")
      .eq("id", leadId)
      .single();

    if (leadErr || !lead) {
      console.log(`[email] Lead ${leadId} not found:`, leadErr?.message);
      return { sent: false, error: "Lead not found" };
    }

    const leadData: LeadEmailData = {
      leadId: lead.id,
      veteranName: lead.veteran_name,
      veteranPhone: lead.veteran_phone,
      veteranEmail: lead.veteran_email,
      category: lead.category,
      subcategory: lead.subcategory,
      urgency: lead.urgency,
      message: lead.message,
      userState: lead.user_state,
      userCity: lead.user_city,
      preferredContact: lead.preferred_contact,
      createdAt: lead.created_at,
    };

    const catPart = lead.category || "General";
    const subPart = lead.subcategory ? ` — ${lead.subcategory}` : "";
    const isImmediate = lead.urgency === "immediate";
    const subject = isImmediate
      ? `[URGENT] New ${platform.userNounCapital} Inquiry: ${catPart}${subPart}`
      : `New ${platform.userNounCapital} Inquiry: ${catPart}${subPart}`;

    const html = buildResourceNotificationHtml(leadData, resourceTitle, notifyEmail);

    // A3 — Founder noise suppression: when the resource has no source-name
    // mapping, the email defaults to the founder/admin inbox. For non-urgent
    // unmapped leads, roll into the next scheduled digest instead of firing
    // an instant email. Urgent leads (urgency === "immediate") still send
    // instantly so true crisis cases are never delayed.
    const isUnmappedFallback = notifyEmail === DEFAULT_NOTIFY_EMAIL;
    if (isUnmappedFallback && !isImmediate) {
      const cityState = [lead.user_city, lead.user_state].filter(Boolean).join(", ") || "unknown location";
      await queueDigestEvent(
        "navigator_unmapped_lead",
        `${lead.veteran_name || "Lead"} · ${catPart}${subPart} · ${cityState} · lead ${leadId}`,
        "info"
      );
      console.log(`[email] [A3-suppressed→digest] Unmapped non-urgent lead ${leadId} queued for digest (no instant email)`);
      return { sent: false, error: "queued_for_digest" };
    }

    console.log(`[email] Sending notification to ${notifyEmail} from ${FROM_EMAIL}`);

    const { data: emailResult, error: emailErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [notifyEmail],
      subject,
      html,
    });

    if (emailErr) {
      console.log(`[email] Notification failed for ${notifyEmail}:`, emailErr.message);
      return { sent: false, error: emailErr.message };
    }

    console.log(`[email] Notification sent to ${notifyEmail} for lead ${leadId} (${emailResult?.id})`);
    return { sent: true };
  } catch (err: any) {
    console.log(`[email] Error sending notification for lead ${leadId}:`, err?.message);
    return { sent: false, error: err?.message };
  }
}

interface TrustedServiceLeadData {
  leadId: string;
  providerName: string;
  categoryName: string | null;
  leadName: string;
  leadEmail: string;
  leadPhone: string | null;
  leadCity: string | null;
  leadState: string | null;
  leadRole: string | null;
  message: string | null;
  createdAt: string;
}

// Founder spec 2026-04-29: leadKind discriminates which lead-source table the
// status-update buttons should target. The /api/leads/update-status handler
// only knows how to UPDATE the trusted_service_leads table, so for Elite
// sponsor leads (which live in elite_sponsor_leads + navigator_requests) we
// MUST omit the buttons — otherwise partners would click "I Contacted This
// Lead" and get a 404. Elite leads are tracked in the admin dashboard.
type LeadKind = "trusted_service" | "elite_sponsor";

function buildTrustedServiceLeadHtml(
  lead: TrustedServiceLeadData,
  isAdminCopy: boolean,
  partnerEmail?: string,
  leadKind: LeadKind = "trusted_service",
): string {
  const timestamp = new Date(lead.createdAt).toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const isElite = leadKind === "elite_sponsor";

  const headerText = isAdminCopy
    ? `New ${isElite ? "Elite Sponsor" : "Trusted Services"} Lead — ${escapeHtml(lead.providerName)}`
    : `New Connection Request via ${platform.name}`;

  const headerSubtext = isAdminCopy
    ? `A user is requesting to connect with ${isElite ? "an Elite Sponsor" : "a Trusted Services partner"}.`
    : `A user is requesting to connect with your services.`;

  const roleLabel = lead.leadRole || "Not specified";
  const baseUrl = platform.domain ? `https://${platform.domain}` : "";
  const contactedUrl = `${baseUrl}/api/leads/update-status?leadId=${lead.leadId}&status=contacted`;
  const notFitUrl = `${baseUrl}/api/leads/update-status?leadId=${lead.leadId}&status=not_a_fit`;
  const noResponseUrl = `${baseUrl}/api/leads/update-status?leadId=${lead.leadId}&status=no_response`;
  const duplicateUrl = `${baseUrl}/api/leads/update-status?leadId=${lead.leadId}&status=duplicate`;
  const referredUrl = `${baseUrl}/api/leads/update-status?leadId=${lead.leadId}&status=referred_elsewhere`;

  // Founder spec 2026-04-30 (QA item #3 — Option B): Elite sponsor leads
  // now show the SAME token-based "Accept Lead — $49.99" button used by
  // navigator_requests (signed via generateLeadActionToken → verified by
  // /api/partner/lead-action POST → silent off-session $49.99 charge).
  // Elite leads now write to navigator_requests (after the 2026-04-30
  // veteran_email/veteran_phone/message column-name fix), so the existing
  // /api/partner/lead-action handler operates on them without any further
  // wiring change. NO automatic charge on lead capture — partner must
  // explicitly click Accept to be charged. Trusted Services leads keep
  // their existing /api/leads/update-status URL-based button row.
  const eliteAcceptButton = isElite && !isAdminCopy
    ? buildActionButtonsHtml(lead.leadId)
    : "";
  const trustedActionButtons = (isAdminCopy || isElite) ? "" : `
  <div style="margin-bottom: 20px;">
    <p style="margin: 0 0 10px 0; color: #374151; font-size: 13px; font-weight: 600;">Update Lead Status:</p>
    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
      <a href="${contactedUrl}" style="display: inline-block; background: #16A34A; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">✅ I Contacted This Lead</a>
      <a href="${notFitUrl}" style="display: inline-block; background: #DC2626; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">❌ Not a Fit</a>
    </div>
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
      <a href="${noResponseUrl}" style="display: inline-block; background: #6B7280; color: white; padding: 8px 14px; border-radius: 6px; text-decoration: none; font-size: 12px;">No Response</a>
      <a href="${duplicateUrl}" style="display: inline-block; background: #6B7280; color: white; padding: 8px 14px; border-radius: 6px; text-decoration: none; font-size: 12px;">Duplicate</a>
      <a href="${referredUrl}" style="display: inline-block; background: #6B7280; color: white; padding: 8px 14px; border-radius: 6px; text-decoration: none; font-size: 12px;">Referred Elsewhere</a>
    </div>
  </div>`;
  const actionButtons = eliteAcceptButton + trustedActionButtons;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">

  <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 4px 0; color: #166534; font-size: 18px;">${headerText}</h2>
    <p style="margin: 0; color: #15803D; font-size: 13px;">${headerSubtext}</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px; width: 140px;">Provider</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-weight: 600;">${escapeHtml(lead.providerName)}</td>
    </tr>
    ${lead.categoryName ? `<tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Category</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">${escapeHtml(lead.categoryName)}</td>
    </tr>` : ""}
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Contact Name</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-weight: 600;">${escapeHtml(lead.leadName)}</td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Role</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">${escapeHtml(roleLabel)}</td>
    </tr>
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Email</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;"><a href="mailto:${escapeHtml(lead.leadEmail)}" style="color: #2563EB;">${escapeHtml(lead.leadEmail)}</a></td>
    </tr>
    ${lead.leadPhone ? `<tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Phone</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;"><a href="tel:${escapeHtml(lead.leadPhone)}" style="color: #2563EB;">${escapeHtml(lead.leadPhone)}</a></td>
    </tr>` : ""}
    ${lead.leadCity || lead.leadState ? `<tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Location</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">${[escapeHtml(lead.leadCity), escapeHtml(lead.leadState)].filter(Boolean).join(", ")}</td>
    </tr>` : ""}
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px;">Submitted</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #E5E7EB;">${timestamp} ET</td>
    </tr>
  </table>

  ${lead.message ? `<div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
    <p style="margin: 0 0 6px 0; color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Message</p>
    <p style="margin: 0; font-size: 14px; line-height: 1.5;">${escapeHtml(lead.message).replace(/\n/g, "<br>")}</p>
  </div>` : ""}

  ${actionButtons}

  <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
    <p style="margin: 0; font-size: 13px; color: #92400E;">
      <strong>Next Steps:</strong> ${isAdminCopy
        ? "This lead has also been sent to the partner. Monitor status in the admin dashboard."
        : isElite
        ? `Please reach out to this veteran within 24 hours using their preferred contact method. As an Elite Sponsor, you have priority placement and exclusive lead access. Thank you for your partnership with ${platform.name}.`
        : `Please reach out to this contact using their preferred contact method. After contacting them, click the "I Contacted This Lead" button above to update the status. Thank you for your partnership with ${platform.name}.`}
    </p>
  </div>

  <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; color: #9CA3AF; font-size: 11px;">
    <p>This lead was submitted via ${platform.name}${isElite ? " Elite Sponsor program" : " Trusted Services"}.</p>
    <p>Lead ID: ${lead.leadId}</p>
  </div>

  ${!isAdminCopy && partnerEmail ? buildUnsubscribeFooter(partnerEmail) : ""}

</body>
</html>`;
}

// Founder spec 2026-04-29 (Option A): user-facing confirmation email body.
// Lives inside lead-email.ts so all lead notification HTML stays in one
// place. Recipient sees the same exact wording as the in-app modal success
// state, reinforcing trust + setting the 24h response expectation.
function buildLeadUserConfirmationHtml(
  recipientName: string,
  providerName: string,
): string {
  const greetingName = recipientName.trim() || "there";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">

  <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 4px 0; color: #166534; font-size: 18px;">Request received</h2>
    <p style="margin: 0; color: #15803D; font-size: 13px;">We've forwarded your request to ${escapeHtml(providerName)}.</p>
  </div>

  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 14px 0;">Hi ${escapeHtml(greetingName)},</p>

  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 18px 0;">
    <strong>Thanks for your request — ${escapeHtml(providerName)} will contact you within 24 hours.</strong>
  </p>

  <p style="font-size: 14px; line-height: 1.55; color: #4B5563; margin: 0 0 14px 0;">
    Your contact info has been shared only with ${escapeHtml(providerName)}. If you don't hear back within 24 hours, please reply to this email and we'll follow up on your behalf.
  </p>

  <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 22px; color: #9CA3AF; font-size: 11px;">
    <p style="margin: 0;">Sent on behalf of ${escapeHtml(providerName)} via ${platform.name}.</p>
  </div>

</body>
</html>`;
}

export async function sendTrustedServiceLeadNotification(
  leadId: string,
  providerData: { name: string; email: string | null; category_name: string | null },
  leadData: { name: string; email: string; phone: string | null; city: string | null; state: string | null; message: string | null; role: string | null; created_at: string },
  signals?: { isBillable?: boolean; isUrgent?: boolean },
  // Founder spec 2026-04-29 (R2): Elite sponsor leads route through this same
  // function so the partner notify + user confirm + admin copy logic is shared.
  // Pass leadKind="elite_sponsor" to suppress the trusted_service_leads action
  // buttons (they would 404 for Elite leads) and tweak the surrounding copy.
  leadKind: LeadKind = "trusted_service",
): Promise<{ partnerSent: boolean; adminSent: boolean; userConfirmSent: boolean; errors: string[] }> {
  const errors: string[] = [];
  let partnerSent = false;
  let adminSent = false;
  let userConfirmSent = false;

  const isElite = leadKind === "elite_sponsor";
  const partnerSubject = isElite
    ? `New Elite Sponsor Lead — ${platform.name}`
    : `New Connection Request — ${platform.name}`;

  const data: TrustedServiceLeadData = {
    leadId,
    providerName: providerData.name,
    categoryName: providerData.category_name,
    leadName: leadData.name,
    leadEmail: leadData.email,
    leadPhone: leadData.phone,
    leadCity: leadData.city,
    leadState: leadData.state,
    leadRole: leadData.role,
    message: leadData.message,
    createdAt: leadData.created_at,
  };

  if (providerData.email) {
    try {
      const partnerHtml = buildTrustedServiceLeadHtml(data, false, providerData.email || undefined, leadKind);
      const { error: emailErr } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [providerData.email],
        subject: partnerSubject,
        html: partnerHtml,
      });
      if (emailErr) {
        console.log(`[email] ${isElite ? "Elite sponsor" : "Trusted service"} partner notification failed:`, emailErr.message);
        errors.push(`Partner: ${emailErr.message}`);
      } else {
        partnerSent = true;
        console.log(`[email] ${isElite ? "Elite sponsor" : "Trusted service"} partner notification sent to ${providerData.email}`);
      }
    } catch (err: any) {
      errors.push(`Partner: ${err?.message}`);
    }
  } else {
    console.log(`[email] No partner email for ${providerData.name} — skipping partner notification`);
    errors.push("Partner has no email on file");
  }

  // Founder spec 2026-04-29 (Option A): user confirmation email is sent
  // INSIDE this same function — not a separate helper. Gated on the user
  // having provided an email at form submit time. Best-effort: a failure
  // here logs but does not block the partner/admin pipeline below.
  if (leadData.email && leadData.email.trim()) {
    try {
      const userHtml = buildLeadUserConfirmationHtml(leadData.name, providerData.name);
      const { error: userErr } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [leadData.email.trim()],
        subject: `Thanks for your request — ${providerData.name}`,
        html: userHtml,
      });
      if (userErr) {
        console.log(`[email] User confirmation failed for ${leadData.email}:`, userErr.message);
        errors.push(`UserConfirm: ${userErr.message}`);
      } else {
        userConfirmSent = true;
        console.log(`[email] User confirmation sent to ${leadData.email} (provider=${providerData.name}, kind=${leadKind})`);
      }
    } catch (err: any) {
      errors.push(`UserConfirm: ${err?.message}`);
    }
  } else {
    console.log(`[email] No lead email for ${leadData.name} — skipping user confirmation`);
  }

  // A4 — Founder noise suppression: the admin copy used to fire on every
  // public partner-connect submission, even when the partner email succeeded
  // and there was nothing for the founder to do.
  //
  // 2026-04-23 update: founder paused the digest and trimmed instant alerts
  // to four categories. Operational issues (partner delivery failed, partner
  // missing email) no longer fire instant — they queue silently. Only paid
  // leads and urgent/crisis leads still page the founder in real time.
  const partnerHadEmail = !!providerData.email;
  const partnerDeliveryFailed = partnerHadEmail && !partnerSent;
  const partnerMissingEmail = !partnerHadEmail;
  const isPaidLead = signals?.isBillable === true;
  const isUrgent = signals?.isUrgent === true;
  const adminInstantNeeded = isPaidLead || isUrgent;

  if (!adminInstantNeeded) {
    const where = [leadData.city, leadData.state].filter(Boolean).join(", ") || "unknown location";
    await queueDigestEvent(
      isElite ? "elite_sponsor_lead" : "trusted_services_lead",
      `${providerData.name} · ${leadData.name} · ${where} · lead ${leadId}`,
      "info"
    );
    console.log(`[email] [A4-suppressed→digest] ${isElite ? "Elite sponsor" : "Trusted Services"} lead ${leadId} queued for digest (partner notified ok, no admin instant; userConfirm=${userConfirmSent})`);
    return { partnerSent, adminSent: false, userConfirmSent, errors };
  }

  try {
    const adminHtml = buildTrustedServiceLeadHtml(data, true, undefined, leadKind);
    const adminReason = partnerDeliveryFailed ? "partner_send_failed"
      : partnerMissingEmail ? "partner_no_email"
      : isPaidLead ? "billable_lead"
      : isUrgent ? "urgent_lead" : "unknown";
    const subjectPrefix = isElite ? "Elite Sponsor Lead" : "Trusted Services Lead";
    const { error: emailErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [DEFAULT_NOTIFY_EMAIL],
      subject: `[${subjectPrefix} — ${adminReason}] ${providerData.name} — ${leadData.name}`,
      html: adminHtml,
    });
    if (emailErr) {
      console.log(`[email] Admin ${isElite ? "elite sponsor" : "trusted service"} notification failed:`, emailErr.message);
      errors.push(`Admin: ${emailErr.message}`);
    } else {
      adminSent = true;
      console.log(`[email] Admin ${isElite ? "elite sponsor" : "trusted service"} notification sent to ${DEFAULT_NOTIFY_EMAIL} (reason=${adminReason}; userConfirm=${userConfirmSent})`);
    }
  } catch (err: any) {
    errors.push(`Admin: ${err?.message}`);
  }

  return { partnerSent, adminSent, userConfirmSent, errors };
}

export async function sendPartnerPaymentEmail(
  partnerEmail: string,
  companyName: string,
  contactName: string | null,
  checkoutUrl: string
): Promise<{ sent: boolean; error?: string }> {
  try {
    const greeting = contactName ? escapeHtml(contactName) : escapeHtml(companyName);

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">

  <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 4px 0; color: #166534; font-size: 18px;">Your ${platform.name} Partner Application Has Been Approved!</h2>
    <p style="margin: 0; color: #15803D; font-size: 13px;">One step left — activate your listing.</p>
  </div>

  <p style="font-size: 15px; line-height: 1.6;">Hi ${greeting},</p>

  <p style="font-size: 15px; line-height: 1.6;">
    Great news! Your application to join the <strong>${platform.name} Trusted Services</strong> network has been approved.
  </p>

  <p style="font-size: 15px; line-height: 1.6;">
    To activate your listing and start receiving veteran referrals, please complete your subscription setup by clicking the button below:
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${escapeHtml(checkoutUrl)}" style="display: inline-block; background: #166534; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
      Activate My Listing
    </a>
  </div>

  <p style="font-size: 13px; color: #6B7280; line-height: 1.5;">
    Or copy and paste this link into your browser:<br>
    <a href="${escapeHtml(checkoutUrl)}" style="color: #2563EB; word-break: break-all;">${escapeHtml(checkoutUrl)}</a>
  </p>

  <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 14px 16px; margin: 24px 0;">
    <p style="margin: 0; font-size: 13px; color: #92400E;">
      <strong>What happens next:</strong> Once payment is complete, your business will be listed in our Trusted Services directory and you'll begin receiving veteran referrals in your service area.
    </p>
  </div>

  <p style="font-size: 15px; line-height: 1.6;">
    Thank you for supporting our veterans!
  </p>

  <p style="font-size: 15px; line-height: 1.6;">
    — The ${platform.name} Team
  </p>

  <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 24px; color: #9CA3AF; font-size: 11px;">
    <p>This email was sent by ${platform.name} (${platform.domain}) regarding your partner application.</p>
    <p>If you did not apply, please disregard this email.</p>
  </div>

</body>
</html>`;

    console.log(`[email] Sending partner payment link to ${partnerEmail}`);

    const { error: emailErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [partnerEmail],
      subject: `${platform.name} — Your Application Is Approved! Activate Your Listing`,
      html,
    });

    if (emailErr) {
      console.log(`[email] Partner payment email failed:`, emailErr.message);
      return { sent: false, error: emailErr.message };
    }

    console.log(`[email] Partner payment email sent to ${partnerEmail}`);
    return { sent: true };
  } catch (err: any) {
    console.log(`[email] Error sending partner payment email:`, err?.message);
    return { sent: false, error: err?.message };
  }
}

export async function sendPartnerFollowUpEmail(
  partnerEmail: string,
  companyName: string,
  contactName: string | null,
  checkoutUrl: string,
  templateType: "reminder" | "urgency" | "payment_recovery"
): Promise<{ sent: boolean; error?: string }> {
  try {
    const greeting = contactName ? escapeHtml(contactName) : escapeHtml(companyName);

    const templates: Record<string, { subject: string; heading: string; headingColor: string; headingBg: string; headingBorder: string; body: string; buttonText: string }> = {
      reminder: {
        subject: `${platform.name} — Friendly Reminder: Activate Your Partner Listing`,
        heading: "Just a Quick Reminder",
        headingColor: "#1E40AF", headingBg: "#EFF6FF", headingBorder: "#BFDBFE",
        body: `We noticed you haven't completed your ${platform.name} partner activation yet. Your application was approved and your listing is ready to go — just one step left to start receiving veteran referrals in your area.`,
        buttonText: "Complete My Activation",
      },
      urgency: {
        subject: `${platform.name} — Your Activation Is Still Pending`,
        heading: "Your Activation Is Still Pending",
        headingColor: "#92400E", headingBg: "#FFFBEB", headingBorder: "#FDE68A",
        body: `Your ${platform.name} partner activation is still pending. Veterans in your area are looking for trusted services like yours. Complete your setup now to begin receiving referrals and grow your business through our veteran community.`,
        buttonText: "Activate Now",
      },
      payment_recovery: {
        subject: `${platform.name} — Complete Your Subscription Setup`,
        heading: "Subscription Setup Incomplete",
        headingColor: "#991B1B", headingBg: "#FEF2F2", headingBorder: "#FECACA",
        body: `Your subscription setup for ${platform.name} is incomplete. To activate your listing and begin receiving veteran referrals, please complete your payment by clicking the button below. If you experienced any issues during checkout, this link will take you back to where you left off.`,
        buttonText: "Complete Payment",
      },
    };

    const tpl = templates[templateType] || templates.reminder;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">

  <div style="background: ${tpl.headingBg}; border: 1px solid ${tpl.headingBorder}; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 4px 0; color: ${tpl.headingColor}; font-size: 18px;">${tpl.heading}</h2>
  </div>

  <p style="font-size: 15px; line-height: 1.6;">Hi ${greeting},</p>

  <p style="font-size: 15px; line-height: 1.6;">${tpl.body}</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${escapeHtml(checkoutUrl)}" style="display: inline-block; background: #166534; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
      ${tpl.buttonText}
    </a>
  </div>

  <p style="font-size: 13px; color: #6B7280; line-height: 1.5;">
    Or copy and paste this link into your browser:<br>
    <a href="${escapeHtml(checkoutUrl)}" style="color: #2563EB; word-break: break-all;">${escapeHtml(checkoutUrl)}</a>
  </p>

  <p style="font-size: 15px; line-height: 1.6;">
    Thank you for supporting our veterans!
  </p>

  <p style="font-size: 15px; line-height: 1.6;">
    — The ${platform.name} Team
  </p>

  <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 24px; color: #9CA3AF; font-size: 11px;">
    <p>This email was sent by ${platform.name} (${platform.domain}) regarding your partner application.</p>
    <p>If you did not apply, please disregard this email.</p>
  </div>

</body>
</html>`;

    console.log(`[email] Sending ${templateType} follow-up to ${partnerEmail}`);

    const { error: emailErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [partnerEmail],
      subject: tpl.subject,
      html,
    });

    if (emailErr) {
      console.log(`[email] Follow-up email (${templateType}) failed:`, emailErr.message);
      return { sent: false, error: emailErr.message };
    }

    console.log(`[email] Follow-up email (${templateType}) sent to ${partnerEmail}`);
    return { sent: true };
  } catch (err: any) {
    console.log(`[email] Error sending follow-up email:`, err?.message);
    return { sent: false, error: err?.message };
  }
}

export async function sendPartnerWelcomeEmail(
  partnerEmail: string,
  companyName: string,
  contactName: string | null
): Promise<{ sent: boolean; error?: string }> {
  try {
    const greeting = contactName ? escapeHtml(contactName) : escapeHtml(companyName);
    const portalUrl = `https://${platform.domain}/partner-portal?setup=1`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">

  <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 4px 0; color: #166534; font-size: 18px;">Welcome to ${platform.name} Trusted Services!</h2>
    <p style="margin: 0; color: #15803D; font-size: 13px;">Your listing is live. Set up your partner account to get started.</p>
  </div>

  <p style="font-size: 15px; line-height: 1.6;">Hi ${greeting},</p>

  <p style="font-size: 15px; line-height: 1.6;">
    Your payment is confirmed and your business is now listed in the <strong>${platform.name} Trusted Services</strong> directory. Veterans in your service area can now find and connect with you.
  </p>

  <p style="font-size: 15px; line-height: 1.6;">
    <strong>Your next step:</strong> Create your Partner Portal account. This gives you access to:
  </p>

  <ul style="font-size: 14px; line-height: 1.8; color: #374151;">
    <li>Your unique referral link to earn free months</li>
    <li>Lead activity and billing visibility</li>
    <li>Partner leaderboard and rewards tracking</li>
  </ul>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${escapeHtml(portalUrl)}" style="display: inline-block; background: #166534; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
      Create My Partner Account
    </a>
  </div>

  <p style="font-size: 13px; color: #6B7280; line-height: 1.5;">
    Use the same email address you applied with (<strong>${escapeHtml(partnerEmail)}</strong>) and choose a password.
  </p>

  <p style="font-size: 13px; color: #6B7280; line-height: 1.5;">
    Or copy and paste this link into your browser:<br>
    <a href="${escapeHtml(portalUrl)}" style="color: #2563EB; word-break: break-all;">${escapeHtml(portalUrl)}</a>
  </p>

  <p style="font-size: 15px; line-height: 1.6;">
    Thank you for supporting our veterans!
  </p>

  <p style="font-size: 15px; line-height: 1.6;">
    — The ${platform.name} Team
  </p>

  <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 24px; color: #9CA3AF; font-size: 11px;">
    <p>This email was sent by ${platform.name} (${platform.domain}) regarding your partner account.</p>
  </div>

</body>
</html>`;

    console.log(`[email] Sending partner welcome email to ${partnerEmail}`);

    const { error: emailErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [partnerEmail],
      subject: `${platform.name} — Your Listing Is Live! Create Your Partner Account`,
      html,
    });

    if (emailErr) {
      console.log(`[email] Partner welcome email failed:`, emailErr.message);
      return { sent: false, error: emailErr.message };
    }

    console.log(`[email] Partner welcome email sent to ${partnerEmail}`);
    return { sent: true };
  } catch (err: any) {
    console.log(`[email] Error sending partner welcome email:`, err?.message);
    return { sent: false, error: err?.message };
  }
}

export async function sendPaymentFailedEmail(
  partnerEmail: string,
  companyName: string,
  contactName: string | null,
  portalUrl: string,
  graceDays: number
): Promise<{ sent: boolean; error?: string }> {
  try {
    const greeting = contactName ? escapeHtml(contactName) : escapeHtml(companyName);
    const deadline = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000);
    const deadlineStr = deadline.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">

  <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 4px 0; color: #991B1B; font-size: 18px;">Payment Issue — Action Required</h2>
    <p style="margin: 0; color: #DC2626; font-size: 13px;">Your recent payment was unsuccessful.</p>
  </div>

  <p style="font-size: 15px; line-height: 1.6;">Hi ${greeting},</p>

  <p style="font-size: 15px; line-height: 1.6;">
    We were unable to process your most recent subscription payment for <strong>${escapeHtml(companyName)}</strong> on ${platform.name}.
  </p>

  <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #92400E;">What this means:</p>
    <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #92400E; line-height: 1.8;">
      <li>Your <strong>premium features</strong> (Featured Listing, Near Me Boost, Sponsored placements) have been <strong>paused</strong></li>
      <li>Your <strong>base listing remains visible</strong> for <strong>${graceDays} days</strong> (until ${deadlineStr})</li>
      <li>If payment is not resolved by ${deadlineStr}, your listing will be <strong>fully hidden</strong></li>
    </ul>
  </div>

  <p style="font-size: 15px; line-height: 1.6;">
    Please update your payment method to keep your listing active:
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${escapeHtml(portalUrl)}" style="display: inline-block; background: #DC2626; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
      Update Payment Method
    </a>
  </div>

  <p style="font-size: 13px; color: #6B7280; line-height: 1.5;">
    Need help? Contact us at <a href="mailto:info@veterancare.com" style="color: #2563EB;">info@veterancare.com</a>.
  </p>

  <p style="font-size: 15px; line-height: 1.6;">
    — The ${platform.name} Team
  </p>

  <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 24px; color: #9CA3AF; font-size: 11px;">
    <p>This email was sent by ${platform.name} regarding your partner subscription billing.</p>
  </div>

</body>
</html>`;

    console.log(`[email] Sending payment-failed notice to ${partnerEmail}`);

    const { error: emailErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [partnerEmail],
      subject: `${platform.name} — Payment Failed — Action Required`,
      html,
    });

    if (emailErr) {
      console.log(`[email] Payment-failed email failed:`, emailErr.message);
      return { sent: false, error: emailErr.message };
    }

    console.log(`[email] Payment-failed email sent to ${partnerEmail}`);
    return { sent: true };
  } catch (err: any) {
    console.log(`[email] Error sending payment-failed email:`, err?.message);
    return { sent: false, error: err?.message };
  }
}

export async function sendGraceExpiringEmail(
  partnerEmail: string,
  companyName: string,
  contactName: string | null,
  daysLeft: number
): Promise<{ sent: boolean; error?: string }> {
  try {
    const greeting = contactName ? escapeHtml(contactName) : escapeHtml(companyName);
    const deadline = new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000);
    const deadlineStr = deadline.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">

  <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 4px 0; color: #991B1B; font-size: 18px;">Final Warning — Listing Will Be Hidden</h2>
    <p style="margin: 0; color: #DC2626; font-size: 13px;">Your billing issue has not been resolved.</p>
  </div>

  <p style="font-size: 15px; line-height: 1.6;">Hi ${greeting},</p>

  <p style="font-size: 15px; line-height: 1.6;">
    This is a final reminder that your subscription payment for <strong>${escapeHtml(companyName)}</strong> on ${platform.name} is still past due.
  </p>

  <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #991B1B;">
      Your listing will be <strong>fully hidden</strong> in approximately <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong> (${deadlineStr}) if payment is not resolved.
    </p>
  </div>

  <p style="font-size: 15px; line-height: 1.6;">
    <strong>What will happen:</strong>
  </p>
  <ul style="font-size: 14px; line-height: 1.8; color: #374151;">
    <li>Your business listing will no longer appear in the directory</li>
    <li>Veterans will not be able to find or connect with your business</li>
    <li>All premium features will remain paused</li>
  </ul>

  <p style="font-size: 15px; line-height: 1.6;">
    To prevent this, please update your payment method now:
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="https://veterancare.com/discounts" style="display: inline-block; background: #991B1B; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
      Update Payment Now
    </a>
  </div>

  <p style="font-size: 13px; color: #6B7280; line-height: 1.5;">
    If you believe this is an error, contact us at <a href="mailto:info@veterancare.com" style="color: #2563EB;">info@veterancare.com</a>.
  </p>

  <p style="font-size: 15px; line-height: 1.6;">
    — The ${platform.name} Team
  </p>

  <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 24px; color: #9CA3AF; font-size: 11px;">
    <p>This email was sent by ${platform.name} regarding your partner subscription billing.</p>
  </div>

</body>
</html>`;

    console.log(`[email] Sending grace-expiring warning to ${partnerEmail}`);

    const { error: emailErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [partnerEmail],
      subject: `${platform.name} — Final Warning — Your Listing Will Be Hidden in ${daysLeft} Day${daysLeft === 1 ? '' : 's'}`,
      html,
    });

    if (emailErr) {
      console.log(`[email] Grace-expiring email failed:`, emailErr.message);
      return { sent: false, error: emailErr.message };
    }

    console.log(`[email] Grace-expiring email sent to ${partnerEmail}`);
    return { sent: true };
  } catch (err: any) {
    console.log(`[email] Error sending grace-expiring email:`, err?.message);
    return { sent: false, error: err?.message };
  }
}

export async function sendLeadNotificationDirect(
  leadId: string,
  recipientEmail: string,
  recipientName: string,
  contactName?: string | null,
): Promise<{ sent: boolean; error?: string }> {
  try {
    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("navigator_requests")
      .select("id, veteran_name, veteran_phone, veteran_email, category, subcategory, urgency, message, user_state, user_city, preferred_contact, created_at")
      .eq("id", leadId)
      .single();

    if (leadErr || !lead) {
      console.log(`[email] Lead ${leadId} not found for direct send`);
      return { sent: false, error: "Lead not found" };
    }

    const leadData: LeadEmailData = {
      leadId: lead.id,
      veteranName: lead.veteran_name,
      veteranPhone: lead.veteran_phone,
      veteranEmail: lead.veteran_email,
      category: lead.category,
      subcategory: lead.subcategory,
      urgency: lead.urgency,
      message: lead.message,
      userState: lead.user_state,
      userCity: lead.user_city,
      preferredContact: lead.preferred_contact,
      createdAt: lead.created_at,
    };

    const partnerData: PartnerEmailData = {
      partnerName: recipientName,
      contactEmail: recipientEmail,
      contactName: contactName || null,
    };

    const isImmediate = lead.urgency === "immediate";
    const subject = isImmediate
      ? `[URGENT] New ${platform.userNounCapital} Lead — ${lead.category || "Help Request"}`
      : `New ${platform.userNounCapital} Lead — ${lead.category || "Help Request"}`;

    const html = buildLeadEmailHtml(leadData, partnerData);

    const { data: emailResult, error: emailErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipientEmail],
      subject,
      html,
    });

    if (emailErr) {
      console.log(`[email] Failed to send direct to ${recipientEmail}:`, emailErr.message);
      return { sent: false, error: emailErr.message };
    }

    console.log(`[email] Lead ${leadId} notification sent directly to ${recipientEmail} (${emailResult?.id})`);
    return { sent: true };
  } catch (err: any) {
    console.log(`[email] Error sending direct notification for lead ${leadId}:`, err?.message);
    return { sent: false, error: err?.message };
  }
}

export async function sendLeadNotification(
  leadId: string,
  partnerId: string
): Promise<{ sent: boolean; error?: string }> {
  try {
    const { data: lead, error: leadErr } = await supabaseAdmin
      .from("navigator_requests")
      .select("id, veteran_name, veteran_phone, veteran_email, category, subcategory, urgency, message, user_state, user_city, preferred_contact, created_at")
      .eq("id", leadId)
      .single();

    if (leadErr || !lead) {
      console.log(`[email] Lead ${leadId} not found`);
      return { sent: false, error: "Lead not found" };
    }

    const { data: partner, error: partnerErr } = await supabaseAdmin
      .from("partner_organizations")
      .select("id, name, contact_name, contact_email")
      .eq("id", partnerId)
      .single();

    if (partnerErr || !partner || !partner.contact_email) {
      console.log(`[email] Partner ${partnerId} has no contact email`);
      return { sent: false, error: "Partner has no contact email" };
    }

    const leadData: LeadEmailData = {
      leadId: lead.id,
      veteranName: lead.veteran_name,
      veteranPhone: lead.veteran_phone,
      veteranEmail: lead.veteran_email,
      category: lead.category,
      subcategory: lead.subcategory,
      urgency: lead.urgency,
      message: lead.message,
      userState: lead.user_state,
      userCity: lead.user_city,
      preferredContact: lead.preferred_contact,
      createdAt: lead.created_at,
    };

    const partnerData: PartnerEmailData = {
      partnerName: partner.name,
      contactEmail: partner.contact_email,
      contactName: partner.contact_name,
    };

    const isImmediate = lead.urgency === "immediate";
    const subject = isImmediate
      ? `[URGENT] New ${platform.userNounCapital} Lead — ${lead.category || "Help Request"}`
      : `New ${platform.userNounCapital} Lead — ${lead.category || "Help Request"}`;

    const html = buildLeadEmailHtml(leadData, partnerData);

    const { data: emailResult, error: emailErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [partner.contact_email],
      subject,
      html,
    });

    if (emailErr) {
      console.log(`[email] Failed to send to ${partner.contact_email}:`, emailErr.message);
      return { sent: false, error: emailErr.message };
    }

    console.log(`[email] Lead ${leadId} notification sent to ${partner.contact_email} (${emailResult?.id})`);

    try {
      const { data: current } = await supabaseAdmin
        .from("navigator_requests")
        .select("routing_history")
        .eq("id", leadId)
        .single();
      const history = Array.isArray(current?.routing_history) ? current.routing_history : [];
      const matchEntry = history.find(
        (h: any) => h.partner_id === partnerId && !h.email_sent
      );
      if (matchEntry) {
        matchEntry.email_sent = true;
        matchEntry.email_sent_at = new Date().toISOString();
        matchEntry.email_id = emailResult?.id;
        await supabaseAdmin
          .from("navigator_requests")
          .update({ routing_history: history })
          .eq("id", leadId);
      }
    } catch {}

    return { sent: true };
  } catch (err: any) {
    console.log(`[email] Error sending notification for lead ${leadId}:`, err?.message);
    return { sent: false, error: err?.message };
  }
}

// ────────────────────────────────────────────────────────────────────
// Sent when chargeLeadAutomatically fails with authentication_required
// or card_declined. Gives partner a one-time customer-portal link to
// update their payment method. Lead remains accepted; admin can retry.
// ────────────────────────────────────────────────────────────────────
export async function sendLeadChargeFailureEmail(opts: {
  partnerEmail: string;
  partnerName: string;
  contactName?: string | null;
  leadId: string;
  veteranName: string;
  failureCode: string;
  failureMessage: string;
  portalUrl: string;
}): Promise<{ sent: boolean; error?: string }> {
  try {
    const greeting = opts.contactName ? escapeHtml(opts.contactName) : escapeHtml(opts.partnerName);
    const reasonLabel =
      opts.failureCode === "authentication_required" ? "Your bank requires additional verification (3D Secure)." :
      opts.failureCode === "card_declined" ? "Your card on file was declined." :
      opts.failureCode === "expired_card" ? "Your card on file has expired." :
      opts.failureCode === "insufficient_funds" ? "Your card on file had insufficient funds." :
      "We were unable to charge your card on file.";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">

  <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 4px 0; color: #991B1B; font-size: 18px;">Payment Issue — Lead Delivery Fee</h2>
    <p style="margin: 0; color: #DC2626; font-size: 13px;">Lead accepted, but the $49.99 charge could not be processed.</p>
  </div>

  <p style="font-size: 15px; line-height: 1.6;">Hi ${greeting},</p>

  <p style="font-size: 15px; line-height: 1.6;">
    You accepted the lead for <strong>${escapeHtml(opts.veteranName)}</strong> on ${platform.name}, but we were unable to charge the $49.99 lead delivery fee to your card on file.
  </p>

  <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 14px 16px; margin: 20px 0;">
    <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 600; color: #92400E;">Reason:</p>
    <p style="margin: 0; font-size: 13px; color: #92400E; line-height: 1.5;">${escapeHtml(reasonLabel)}</p>
  </div>

  <p style="font-size: 15px; line-height: 1.6;">
    The lead remains assigned to you — please contact the veteran as planned. To clear the outstanding fee and avoid pausing future routing, update your payment method:
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${opts.portalUrl}" style="display: inline-block; background: #166534; color: white; padding: 12px 28px; border-radius: 6px; font-size: 15px; font-weight: 600; text-decoration: none;">Update Payment Method</a>
  </div>

  <p style="font-size: 12px; color: #6B7280; line-height: 1.5;">
    Once updated, our team can retry the charge. If you have questions, reply to this email and we will assist you.
  </p>

  <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 24px; color: #9CA3AF; font-size: 11px;">
    <p>Lead ID: ${escapeHtml(opts.leadId)}</p>
    <p>Failure code: ${escapeHtml(opts.failureCode)}</p>
  </div>

  ${buildUnsubscribeFooter(opts.partnerEmail)}

</body>
</html>`;

    const { error: emailErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.partnerEmail,
      subject: `${platform.name} — Update Payment Method (Lead $49.99 Charge Failed)`,
      html,
    });

    if (emailErr) {
      console.log(`[email] Lead charge failure email failed for lead ${opts.leadId}:`, emailErr.message);
      return { sent: false, error: emailErr.message };
    }

    console.log(`[email] Lead charge failure email sent to ${opts.partnerEmail} (lead ${opts.leadId}, code ${opts.failureCode})`);
    return { sent: true };
  } catch (err: any) {
    console.log(`[email] Error sending lead charge failure email for lead ${opts.leadId}:`, err?.message);
    return { sent: false, error: err?.message };
  }
}
