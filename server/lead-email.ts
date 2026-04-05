import { Resend } from "resend";
import { supabase, supabaseAdmin } from "./supabase";
import { platform, t } from "../shared/platform";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || `${platform.name} <onboarding@resend.dev>`;

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

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  
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
      <strong>Next Steps:</strong> Please reach out to this ${platform.userNoun} using their preferred contact method. 
      If you are unable to assist, the lead will be automatically rerouted to another partner.
    </p>
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

function buildTrustedServiceLeadHtml(lead: TrustedServiceLeadData, isAdminCopy: boolean, partnerEmail?: string): string {
  const timestamp = new Date(lead.createdAt).toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const headerText = isAdminCopy
    ? `New Trusted Services Lead — ${escapeHtml(lead.providerName)}`
    : `New Connection Request via ${platform.name}`;

  const headerSubtext = isAdminCopy
    ? `A user is requesting to connect with a Trusted Services partner.`
    : `A user is requesting to connect with your services.`;

  const roleLabel = lead.leadRole || "Not specified";
  const baseUrl = platform.domain ? `https://${platform.domain}` : "";
  const contactedUrl = `${baseUrl}/api/leads/update-status?leadId=${lead.leadId}&status=contacted`;
  const notFitUrl = `${baseUrl}/api/leads/update-status?leadId=${lead.leadId}&status=not_a_fit`;
  const noResponseUrl = `${baseUrl}/api/leads/update-status?leadId=${lead.leadId}&status=no_response`;
  const duplicateUrl = `${baseUrl}/api/leads/update-status?leadId=${lead.leadId}&status=duplicate`;
  const referredUrl = `${baseUrl}/api/leads/update-status?leadId=${lead.leadId}&status=referred_elsewhere`;

  const actionButtons = isAdminCopy ? "" : `
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
        : `Please reach out to this contact using their preferred contact method. After contacting them, click the "I Contacted This Lead" button above to update the status. Thank you for your partnership with ${platform.name}.`}
    </p>
  </div>

  <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; color: #9CA3AF; font-size: 11px;">
    <p>This lead was submitted via ${platform.name} Trusted Services.</p>
    <p>Lead ID: ${lead.leadId}</p>
  </div>

  ${!isAdminCopy && partnerEmail ? buildUnsubscribeFooter(partnerEmail) : ""}

</body>
</html>`;
}

export async function sendTrustedServiceLeadNotification(
  leadId: string,
  providerData: { name: string; email: string | null; category_name: string | null },
  leadData: { name: string; email: string; phone: string | null; city: string | null; state: string | null; message: string | null; role: string | null; created_at: string }
): Promise<{ partnerSent: boolean; adminSent: boolean; errors: string[] }> {
  const errors: string[] = [];
  let partnerSent = false;
  let adminSent = false;

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
      const partnerHtml = buildTrustedServiceLeadHtml(data, false, providerData.email || undefined);
      const { error: emailErr } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [providerData.email],
        subject: `New Connection Request — ${platform.name}`,
        html: partnerHtml,
      });
      if (emailErr) {
        console.log(`[email] Trusted service partner notification failed:`, emailErr.message);
        errors.push(`Partner: ${emailErr.message}`);
      } else {
        partnerSent = true;
        console.log(`[email] Trusted service partner notification sent to ${providerData.email}`);
      }
    } catch (err: any) {
      errors.push(`Partner: ${err?.message}`);
    }
  } else {
    console.log(`[email] No partner email for ${providerData.name} — skipping partner notification`);
    errors.push("Partner has no email on file");
  }

  try {
    const adminHtml = buildTrustedServiceLeadHtml(data, true);
    const { error: emailErr } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [DEFAULT_NOTIFY_EMAIL],
      subject: `[Trusted Services Lead] ${providerData.name} — ${leadData.name}`,
      html: adminHtml,
    });
    if (emailErr) {
      console.log(`[email] Admin trusted service notification failed:`, emailErr.message);
      errors.push(`Admin: ${emailErr.message}`);
    } else {
      adminSent = true;
      console.log(`[email] Admin trusted service notification sent to ${DEFAULT_NOTIFY_EMAIL}`);
    }
  } catch (err: any) {
    errors.push(`Admin: ${err?.message}`);
  }

  return { partnerSent, adminSent, errors };
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
