import { Resend } from "resend";
import { supabase } from "./supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Veteran Care <onboarding@resend.dev>";

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
    <strong style="color: #DC2626; font-size: 16px;">IMMEDIATE — This veteran needs urgent help</strong>
    <p style="color: #991B1B; margin: 4px 0 0 0; font-size: 13px;">Please respond as quickly as possible. Escalation occurs in 15 minutes if unacknowledged.</p>
  </div>` : ""}

  <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 4px 0; color: #166534; font-size: 18px;">New Veteran Lead Routed to You</h2>
    <p style="margin: 0; color: #15803D; font-size: 13px;">via Veteran Care Navigator</p>
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
      <strong>Next Steps:</strong> Please reach out to this veteran using their preferred contact method. 
      If you are unable to assist, the lead will be automatically rerouted to another partner.
    </p>
  </div>

  <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; color: #9CA3AF; font-size: 11px;">
    <p>This lead was routed to ${escapeHtml(partner.partnerName)} by Veteran Care Navigator.</p>
    <p>Lead ID: ${lead.leadId}</p>
  </div>

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
    <strong style="color: #DC2626; font-size: 16px;">IMMEDIATE — This veteran needs urgent help</strong>
    <p style="color: #991B1B; margin: 4px 0 0 0; font-size: 13px;">Please respond as quickly as possible.</p>
  </div>` : ""}

  <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px;">
    <h2 style="margin: 0 0 4px 0; color: #166534; font-size: 18px;">New Inquiry from Veteran Care</h2>
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
      <strong>Next Steps:</strong> Please reach out to this veteran using their preferred contact method.
    </p>
  </div>

  <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; color: #9CA3AF; font-size: 11px;">
    <p>This inquiry was sent via Veteran Care — ${escapeHtml(resourceTitle)}</p>
    <p>Lead ID: ${lead.leadId}</p>
  </div>

</body>
</html>`;
}

const DEFAULT_NOTIFY_EMAIL = "info@veterancare.com";

const RESOURCE_NOTIFY_CONFIG: Record<string, string> = {
  "Veteran Care": DEFAULT_NOTIFY_EMAIL,
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

    const { data: lead, error: leadErr } = await supabase
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
      ? `[URGENT] New Veteran Inquiry: ${catPart}${subPart}`
      : `New Veteran Inquiry: ${catPart}${subPart}`;

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

export async function sendLeadNotification(
  leadId: string,
  partnerId: string
): Promise<{ sent: boolean; error?: string }> {
  try {
    const { data: lead, error: leadErr } = await supabase
      .from("navigator_requests")
      .select("id, veteran_name, veteran_phone, veteran_email, category, subcategory, urgency, message, user_state, user_city, preferred_contact, created_at")
      .eq("id", leadId)
      .single();

    if (leadErr || !lead) {
      console.log(`[email] Lead ${leadId} not found`);
      return { sent: false, error: "Lead not found" };
    }

    const { data: partner, error: partnerErr } = await supabase
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
      ? `[URGENT] New Veteran Lead — ${lead.category || "Help Request"}`
      : `New Veteran Lead — ${lead.category || "Help Request"}`;

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
      const { data: current } = await supabase
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
        await supabase
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
