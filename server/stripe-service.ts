import Stripe from "stripe";
import { query as pgQuery } from "./pg-client";
import { platform } from "../shared/platform";
import { sendPaymentFailedEmail, sendGraceExpiringEmail, sendPartnerWelcomeEmail } from "./lead-email";
import { supabaseAdmin } from "./supabase";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.log("[stripe] STRIPE_SECRET_KEY not set — Stripe features disabled");
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2025-03-31.basil" as any })
  : null;

const PARTNER_PRICE_ID_STATE    = process.env.STRIPE_PARTNER_PRICE_ID_STATE    || null;
const PARTNER_PRICE_ID_NATIONAL = process.env.STRIPE_PARTNER_PRICE_ID_NATIONAL || null;
const PARTNER_PRICE_ID_LEGACY   = process.env.STRIPE_PARTNER_PRICE_ID          || null;

const ADDON_PRICE_FEATURED      = process.env.STRIPE_ADDON_PRICE_FEATURED      || null;
const ADDON_PRICE_NEAR_ME_BOOST = process.env.STRIPE_ADDON_PRICE_NEAR_ME_BOOST || null;
const ADDON_PRICE_SPONSORED_TOP = process.env.STRIPE_ADDON_PRICE_SPONSORED_TOP || null;
const ADDON_PRICE_SPONSORED_INLINE = process.env.STRIPE_ADDON_PRICE_SPONSORED_INLINE || null;

const ADDON_PRICE_MAP: Record<string, string | null> = {
  featured: ADDON_PRICE_FEATURED,
  near_me_boost: ADDON_PRICE_NEAR_ME_BOOST,
  sponsored_top: ADDON_PRICE_SPONSORED_TOP,
  sponsored_inline: ADDON_PRICE_SPONSORED_INLINE,
};

const DEFAULT_NOTIFY_EMAIL = "info@veterancare.com";

export function isStripeEnabled(): boolean {
  return !!stripe;
}

export async function syncPartnerOrgSubscriptionStatus(
  appEmail: string | null,
  subscriptionStatus: "active" | "past_due" | "canceled",
  activePaidPartner: boolean
): Promise<void> {
  if (!appEmail) return;
  try {
    const { data, error: checkErr } = await supabaseAdmin
      .from("partner_organizations")
      .select("subscription_status")
      .limit(1);
    if (checkErr && checkErr.message.includes("does not exist")) return;

    const { error } = await supabaseAdmin
      .from("partner_organizations")
      .update({ subscription_status: subscriptionStatus, active_paid_partner: activePaidPartner })
      .ilike("contact_email", appEmail);
    if (error) console.log(`[stripe-sync] Failed to sync partner_org for ${appEmail}:`, error.message);
    else console.log(`[stripe-sync] partner_organizations synced for ${appEmail}: status=${subscriptionStatus}, paid=${activePaidPartner}`);
  } catch (err: any) {
    console.log(`[stripe-sync] Error:`, err.message);
  }
}

export type AddonKey = "featured" | "near_me_boost" | "sponsored_top" | "sponsored_inline";

export interface CheckoutOptions {
  applicationId: string;
  addons?: AddonKey[];
}

export async function createPartnerCheckoutSession(options: CheckoutOptions): Promise<{ url: string; sessionId: string }> {
  if (!stripe) throw new Error("Stripe is not configured");

  const { applicationId, addons = [] } = options;

  const rows = await pgQuery(
    `SELECT pa.*, tsc.name AS category_name
     FROM partner_applications pa
     LEFT JOIN trusted_service_categories tsc ON pa.category_id = tsc.id
     WHERE pa.id = $1`,
    [applicationId]
  );
  if (rows.length === 0) throw new Error("Application not found");
  const app = rows[0];

  if (app.status === "active") throw new Error("Partner is already active");
  if (app.stripe_subscription_id) throw new Error("Subscription already exists");

  let customerId = app.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: app.email,
      name: app.company_name,
      metadata: {
        application_id: applicationId,
        contact_name: app.contact_name,
        platform: platform.name,
      },
    });
    customerId = customer.id;

    await pgQuery(
      `UPDATE partner_applications SET stripe_customer_id = $1, updated_at = NOW() WHERE id = $2`,
      [customerId, applicationId]
    );
  }

  let resolvedPriceId: string | null = app.stripe_price_id || null;
  if (!resolvedPriceId) {
    if (app.plan_type === "national") {
      resolvedPriceId = PARTNER_PRICE_ID_NATIONAL;
    } else if (app.plan_type === "state") {
      resolvedPriceId = PARTNER_PRICE_ID_STATE;
    } else {
      resolvedPriceId = PARTNER_PRICE_ID_LEGACY;
    }
  }

  if (!resolvedPriceId) {
    const missing = app.plan_type === "national"
      ? "STRIPE_PARTNER_PRICE_ID_NATIONAL"
      : app.plan_type === "state"
        ? "STRIPE_PARTNER_PRICE_ID_STATE"
        : "STRIPE_PARTNER_PRICE_ID";
    throw new Error(`No Stripe price configured for ${app.plan_type || "unknown"} plan. Set the ${missing} environment variable.`);
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: resolvedPriceId, quantity: 1 },
  ];

  const selectedAddons: string[] = [];
  const uniqueAddons = [...new Set(addons)];
  for (const addonKey of uniqueAddons) {
    const priceId = ADDON_PRICE_MAP[addonKey];
    if (priceId) {
      lineItems.push({ price: priceId, quantity: 1 });
      selectedAddons.push(addonKey);
    }
  }

  const appUrl = process.env.APP_URL || `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "veterancare.com"}`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: lineItems,
    success_url: `${appUrl}/partner-payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/partner-apply`,
    metadata: {
      application_id: applicationId,
      company_name: app.company_name,
      plan_type: app.plan_type || "unknown",
      addons: selectedAddons.join(","),
      ambassador_id: app.ambassador_id || "",
      utm_source: app.utm_source || "",
      utm_medium: app.utm_medium || "",
      utm_campaign: app.utm_campaign || "",
      utm_content: app.utm_content || "",
      utm_id: app.utm_id || "",
      session_id: app.session_id || "",
    },
    subscription_data: {
      metadata: {
        application_id: applicationId,
        company_name: app.company_name,
        plan_type: app.plan_type || "unknown",
        addons: selectedAddons.join(","),
      },
    },
  });

  await pgQuery(
    `UPDATE partner_applications
     SET status = 'approved_pending_payment', stripe_checkout_url = $1, stripe_price_id = $2, updated_at = NOW()
     WHERE id = $3`,
    [session.url, resolvedPriceId, applicationId]
  );

  return { url: session.url!, sessionId: session.id };
}

export async function createLeadChargeCheckout(leadId: string, amountDollars: number, partnerName: string, veteranName: string, category: string): Promise<{ url: string; sessionId: string }> {
  if (!stripe) throw new Error("Stripe is not configured");

  const amountCents = Math.round(amountDollars * 100);
  if (amountCents <= 0) throw new Error("Invalid billing amount");

  const appUrl = process.env.APP_URL || `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "veterancare.com"}`;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `Lead Delivery Fee — ${category || "General"}`,
            description: `Veteran: ${veteranName} | Partner: ${partnerName} | Lead ID: ${leadId.substring(0, 8)}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      lead_id: leadId,
      partner_name: partnerName,
      charge_type: "lead_billing",
    },
    success_url: `${appUrl}/admin?billing=success&lead=${leadId.substring(0, 8)}`,
    cancel_url: `${appUrl}/admin?billing=cancelled&lead=${leadId.substring(0, 8)}`,
  });

  return { url: session.url!, sessionId: session.id };
}

export async function createCustomerPortalSession(stripeCustomerId: string, returnUrl?: string): Promise<{ url: string }> {
  if (!stripe) throw new Error("Stripe is not configured");

  const appUrl = returnUrl || process.env.APP_URL || `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "veterancare.com"}`;

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${appUrl}/discounts`,
  });

  return { url: portalSession.url };
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.charge_type === "lead_billing") {
        await handleLeadBillingCompleted(session);
      } else {
        await handleCheckoutCompleted(session);
      }
      break;
    }
    case "customer.subscription.created":
      await handleSubscriptionSync(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionSync(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      console.log(`[stripe] Unhandled event type: ${event.type}`);
  }
}

function detectAddonsFromItems(subscription: Stripe.Subscription): {
  basePlan: string | null;
  featured: boolean;
  nearMeBoost: boolean;
  sponsoredTop: boolean;
  sponsoredInline: boolean;
} {
  let basePlan: string | null = null;
  let featured = false;
  let nearMeBoost = false;
  let sponsoredTop = false;
  let sponsoredInline = false;

  for (const item of subscription.items.data) {
    const priceId = item.price.id;
    if (priceId === PARTNER_PRICE_ID_STATE) {
      basePlan = "state";
    } else if (priceId === PARTNER_PRICE_ID_NATIONAL) {
      basePlan = "national";
    } else if (priceId === PARTNER_PRICE_ID_LEGACY) {
      basePlan = basePlan || "state";
    } else if (priceId === ADDON_PRICE_FEATURED) {
      featured = true;
    } else if (priceId === ADDON_PRICE_NEAR_ME_BOOST) {
      nearMeBoost = true;
    } else if (priceId === ADDON_PRICE_SPONSORED_TOP) {
      sponsoredTop = true;
    } else if (priceId === ADDON_PRICE_SPONSORED_INLINE) {
      sponsoredInline = true;
    }
  }

  return { basePlan, featured, nearMeBoost, sponsoredTop, sponsoredInline };
}

async function syncAddonFlags(appId: string, providerId: string | null, subscription: Stripe.Subscription): Promise<void> {
  const { basePlan, featured, nearMeBoost, sponsoredTop, sponsoredInline } = detectAddonsFromItems(subscription);
  const isActive = subscription.status === "active" || subscription.status === "trialing";
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  await pgQuery(
    `UPDATE partner_applications
     SET subscription_status = $1,
         base_plan_type = $2,
         featured_active = $3,
         near_me_boost_active = $4,
         sponsored_top_active = $5,
         sponsored_inline_active = $6,
         current_period_end = $7,
         billing_active = $8,
         updated_at = NOW()
     WHERE id = $9`,
    [subscription.status, basePlan, featured, nearMeBoost, sponsoredTop, sponsoredInline, periodEnd, isActive, appId]
  );

  if (providerId) {
    await pgQuery(
      `UPDATE trusted_services
       SET is_active = $1,
           is_featured = $2,
           featured_active = $2,
           near_me_boost_active = $3,
           sponsored_top_active = $4,
           sponsored_inline_active = $5
       WHERE id = $6`,
      [isActive, featured && isActive, nearMeBoost && isActive, sponsoredTop && isActive, sponsoredInline && isActive, providerId]
    );
    console.log(`[stripe] Synced add-on flags for provider ${providerId}: featured=${featured}, nearMe=${nearMeBoost}, sponsoredTop=${sponsoredTop}, sponsoredInline=${sponsoredInline}, active=${isActive}`);
  }
}

async function handleLeadBillingCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const leadId = session.metadata?.lead_id;
  if (!leadId) {
    console.log("[stripe] lead_billing checkout completed but missing lead_id in metadata");
    return;
  }

  if (session.payment_status !== "paid") {
    console.log(`[stripe] lead_billing checkout for lead ${leadId} — payment_status: ${session.payment_status}, skipping`);
    return;
  }

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : (session.payment_intent as any)?.id || null;

  const billedAt = new Date().toISOString();

  const { data: lead, error: fetchErr } = await supabaseAdmin
    .from("navigator_requests")
    .select("id, billed, is_billable, billing_status")
    .eq("id", leadId)
    .single();

  if (fetchErr || !lead) {
    console.log(`[stripe] lead_billing: lead ${leadId} not found`);
    return;
  }

  if (lead.billed) {
    console.log(`[stripe] lead_billing: lead ${leadId} already billed — skipping duplicate webhook`);
    return;
  }

  if (!lead.is_billable) {
    console.log(`[stripe] lead_billing: lead ${leadId} is not billable — payment received but cannot mark billed`);
    return;
  }

  const updateFields: Record<string, any> = {
    billed: true,
    billed_at: billedAt,
    billing_status: "billed",
  };

  try {
    await supabaseAdmin.from("navigator_requests").update({
      ...updateFields,
      stripe_payment_intent_id: paymentIntentId,
      stripe_checkout_session_id: session.id,
      stripe_payment_status: "paid",
    }).eq("id", leadId).eq("billed", false);
  } catch {
    await supabaseAdmin.from("navigator_requests").update(updateFields).eq("id", leadId).eq("billed", false);
  }

  console.log(`[stripe] lead_billing: lead ${leadId} marked BILLED via Stripe checkout ${session.id}, PI: ${paymentIntentId}`);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const applicationId = session.metadata?.application_id;
  if (!applicationId) {
    console.log("[stripe] checkout.session.completed missing application_id in metadata");
    return;
  }

  const subscriptionId = typeof session.subscription === "string"
    ? session.subscription
    : (session.subscription as any)?.id;

  if (!subscriptionId) {
    console.log("[stripe] checkout.session.completed missing subscription ID");
    return;
  }

  const customerId = typeof session.customer === "string"
    ? session.customer
    : (session.customer as any)?.id;

  console.log(`[stripe] Payment confirmed for application ${applicationId}, subscription ${subscriptionId}`);

  const rows = await pgQuery(
    `SELECT * FROM partner_applications WHERE id = $1`,
    [applicationId]
  );
  if (rows.length === 0) {
    console.log(`[stripe] Application ${applicationId} not found`);
    return;
  }
  const app = rows[0];

  if (app.status !== "approved_pending_payment" && app.status !== "active") {
    console.log(`[stripe] Application ${applicationId} has status '${app.status}' — expected 'approved_pending_payment'. Skipping activation.`);
    return;
  }

  await pgQuery(
    `UPDATE partner_applications
     SET status = 'active',
         stripe_customer_id = $1,
         stripe_subscription_id = $2,
         billing_active = true,
         updated_at = NOW()
     WHERE id = $3`,
    [customerId, subscriptionId, applicationId]
  );

  if (!app.welcome_email_sent) {
    try {
      await sendPartnerWelcomeEmail(app.email, app.company_name, app.contact_name || null);
      await pgQuery(`UPDATE partner_applications SET welcome_email_sent = true WHERE id = $1`, [applicationId]);
    } catch (err: any) {
      console.log(`[stripe] Welcome email send failed:`, err.message);
    }
  }

  if (app.converted_provider_id) {
    try {
      await pgQuery(`UPDATE trusted_services SET is_active = true WHERE id = $1`, [app.converted_provider_id]);
      console.log(`[stripe] Provider ${app.converted_provider_id} activated`);
    } catch (err: any) {
      console.log(`[stripe] Failed to activate provider ${app.converted_provider_id}:`, err.message);
    }
  } else if (app.category_id) {
    try {
      const providerRows = await pgQuery(
        `INSERT INTO trusted_services (category_id, name, short_description, website_url, phone, email, city, state, is_active, is_featured, verification_status, notes_internal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          app.category_id,
          app.company_name,
          app.service_description || null,
          app.website || null,
          app.phone || null,
          app.email,
          app.city || null,
          app.state || null,
          true,
          false,
          'verified',
          `Auto-created via Stripe payment. Application ${applicationId}`,
        ]
      );
      const providerId = providerRows[0].id;
      await pgQuery(
        `UPDATE partner_applications SET converted_provider_id = $1, updated_at = NOW() WHERE id = $2`,
        [providerId, applicationId]
      );
      console.log(`[stripe] Provider ${providerId} created and linked to application ${applicationId}`);
    } catch (err: any) {
      console.log(`[stripe] Failed to create provider:`, err.message);
    }
  }

  if (stripe) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const updatedRows = await pgQuery(`SELECT converted_provider_id FROM partner_applications WHERE id = $1`, [applicationId]);
      const provId = updatedRows[0]?.converted_provider_id || null;
      await syncAddonFlags(applicationId, provId, subscription);
    } catch (err: any) {
      console.log(`[stripe] Failed to sync add-on flags on checkout:`, err.message);
    }
  }

  await syncPartnerOrgSubscriptionStatus(app.email, "active", true);

  try {
    let revenueAmount: number | null = null;
    if (session.amount_total && session.amount_total > 0) {
      revenueAmount = session.amount_total / 100;
    }

    let resolvedAmbassadorId: string | null = null;
    if (app.utm_content || app.utm_id) {
      if (app.utm_content) {
        const ambRows = await pgQuery(`SELECT id FROM ambassadors WHERE code = $1 LIMIT 1`, [app.utm_content]);
        if (ambRows.length > 0) resolvedAmbassadorId = ambRows[0].id;
      }
      if (!resolvedAmbassadorId && app.utm_id) {
        const linkRows = await pgQuery(`SELECT ambassador_id FROM ambassador_links WHERE utm_id = $1 AND ambassador_id IS NOT NULL LIMIT 1`, [app.utm_id]);
        if (linkRows.length > 0) resolvedAmbassadorId = linkRows[0].ambassador_id;
      }
    }

    await pgQuery(
      `INSERT INTO partner_attribution (application_id, ambassador, utm_source, utm_medium, utm_campaign, utm_id, stripe_customer_id, stripe_subscription_id, plan_type, revenue_amount, event_type, ambassador_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'checkout_completed', $11)`,
      [
        applicationId,
        app.utm_content || null,
        app.utm_source || null,
        app.utm_medium || null,
        app.utm_campaign || null,
        app.utm_id || null,
        customerId || null,
        subscriptionId || null,
        app.plan_type || null,
        revenueAmount,
        resolvedAmbassadorId,
      ]
    );
    console.log(`[stripe] Attribution recorded for application ${applicationId}, ambassador: ${app.utm_content || "none"} (id: ${resolvedAmbassadorId || "unresolved"})`);

    if (app.utm_content && revenueAmount && revenueAmount > 0) {
      const ambassadorCode = app.utm_content;
      let commissionPct = 10.00;
      if (resolvedAmbassadorId) {
        try {
          const rateRows = await pgQuery(
            `SELECT commission_rate FROM ambassadors WHERE id = $1`,
            [resolvedAmbassadorId]
          );
          if (rateRows.length > 0 && rateRows[0].commission_rate != null) {
            commissionPct = parseFloat(rateRows[0].commission_rate);
          }
        } catch (err: any) {
          console.log(`[stripe] Failed to fetch ambassador commission_rate, using default 10%:`, err.message);
        }
      }
      const commissionAmt = Math.round(revenueAmount * commissionPct) / 100;
      await pgQuery(
        `INSERT INTO commissions (ambassador_code, utm_id, application_id, revenue_amount, commission_percentage, commission_amount, status, ambassador_id)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)`,
        [ambassadorCode, app.utm_id || null, applicationId, revenueAmount, commissionPct, commissionAmt, resolvedAmbassadorId]
      );
      console.log(`[stripe] Commission created: ${ambassadorCode}, $${commissionAmt} (${commissionPct}% of $${revenueAmount})`);
    }
  } catch (err: any) {
    console.log(`[stripe] Attribution recording failed:`, err.message);
  }
}

export async function verifyAndActivateCheckoutSession(sessionId: string): Promise<{ status: string; applicationId?: string; email?: string; error?: string }> {
  if (!stripe) return { status: "error", error: "Stripe not configured" };

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return { status: "unpaid", error: "Payment not completed" };
    }

    const applicationId = session.metadata?.application_id;
    if (!applicationId) {
      return { status: "error", error: "No application_id in session metadata" };
    }

    const rows = await pgQuery(`SELECT * FROM partner_applications WHERE id = $1`, [applicationId]);
    if (rows.length === 0) {
      return { status: "error", error: "Application not found" };
    }

    const app = rows[0];

    if (app.status === "active" && app.converted_provider_id) {
      return { status: "already_active", applicationId, email: app.email || undefined };
    }

    console.log(`[stripe] Verify endpoint: activating application ${applicationId} from session ${sessionId}`);
    await handleCheckoutCompleted(session);

    return { status: "activated", applicationId, email: app.email || undefined };
  } catch (err: any) {
    console.log(`[stripe] Verify session error:`, err.message);
    return { status: "error", error: err.message };
  }
}

async function handleSubscriptionSync(subscription: Stripe.Subscription): Promise<void> {
  const subscriptionId = subscription.id;
  const status = subscription.status;
  const applicationId = subscription.metadata?.application_id;

  const rows = applicationId
    ? await pgQuery(`SELECT * FROM partner_applications WHERE id = $1`, [applicationId])
    : await pgQuery(`SELECT * FROM partner_applications WHERE stripe_subscription_id = $1`, [subscriptionId]);

  if (rows.length === 0) {
    console.log(`[stripe] No application found for subscription ${subscriptionId}`);
    return;
  }
  const app = rows[0];

  if (!app.stripe_subscription_id) {
    await pgQuery(
      `UPDATE partner_applications SET stripe_subscription_id = $1, updated_at = NOW() WHERE id = $2`,
      [subscriptionId, app.id]
    );
  }

  const isActive = status === "active" || status === "trialing";

  await syncAddonFlags(app.id, app.converted_provider_id, subscription);

  if (isActive && app.status !== "active") {
    await pgQuery(
      `UPDATE partner_applications SET status = 'active', grace_period_end = NULL, grace_warning_sent = false, updated_at = NOW() WHERE id = $1`,
      [app.id]
    );
    if (app.converted_provider_id) {
      await pgQuery(`UPDATE trusted_services SET is_active = true WHERE id = $1`, [app.converted_provider_id]);
    }
    await syncPartnerOrgSubscriptionStatus(app.email, "active", true);
    console.log(`[stripe] Subscription ${subscriptionId} reactivated → application ${app.id} active`);
  } else if (!isActive && (status === "past_due" || status === "unpaid" || status === "canceled")) {
    await pgQuery(
      `UPDATE partner_applications SET status = 'inactive', billing_active = false, updated_at = NOW() WHERE id = $1`,
      [app.id]
    );
    if (app.converted_provider_id) {
      await pgQuery(
        `UPDATE trusted_services SET is_active = false, is_featured = false, featured_active = false, near_me_boost_active = false, sponsored_top_active = false, sponsored_inline_active = false WHERE id = $1`,
        [app.converted_provider_id]
      );
    }
    const syncStatus = status === "canceled" ? "canceled" : "past_due";
    await syncPartnerOrgSubscriptionStatus(app.email, syncStatus as any, false);
    console.log(`[stripe] Subscription ${subscriptionId} status ${status} → application ${app.id} inactive`);
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
  const subscriptionId = subscription.id;
  const applicationId = subscription.metadata?.application_id;

  console.log(`[stripe] Subscription ${subscriptionId} canceled`);

  const rows = applicationId
    ? await pgQuery(`SELECT * FROM partner_applications WHERE id = $1`, [applicationId])
    : await pgQuery(`SELECT * FROM partner_applications WHERE stripe_subscription_id = $1`, [subscriptionId]);

  if (rows.length === 0) {
    console.log(`[stripe] No application found for canceled subscription ${subscriptionId}`);
    return;
  }
  const app = rows[0];

  await pgQuery(
    `UPDATE partner_applications
     SET status = 'inactive',
         billing_active = false,
         subscription_status = 'canceled',
         featured_active = false,
         near_me_boost_active = false,
         sponsored_top_active = false,
         sponsored_inline_active = false,
         updated_at = NOW()
     WHERE id = $1`,
    [app.id]
  );

  if (app.converted_provider_id) {
    try {
      await pgQuery(
        `UPDATE trusted_services
         SET is_active = false,
             is_featured = false,
             featured_active = false,
             near_me_boost_active = false,
             sponsored_top_active = false,
             sponsored_inline_active = false
         WHERE id = $1`,
        [app.converted_provider_id]
      );
      console.log(`[stripe] Provider ${app.converted_provider_id} fully deactivated (subscription canceled)`);
    } catch (err: any) {
      console.log(`[stripe] Failed to deactivate provider:`, err.message);
    }
  }

  await syncPartnerOrgSubscriptionStatus(app.email, "canceled", false);
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : (invoice.subscription as any)?.id;

  if (!subscriptionId) return;

  console.log(`[stripe] Invoice paid for subscription ${subscriptionId}`);

  const rows = await pgQuery(
    `SELECT * FROM partner_applications WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );
  if (rows.length === 0) return;
  const app = rows[0];

  if (app.status === "inactive" || app.billing_active === false || app.subscription_status === "past_due") {
    await pgQuery(
      `UPDATE partner_applications SET status = 'active', billing_active = true, subscription_status = 'active', grace_period_end = NULL, grace_warning_sent = false, updated_at = NOW() WHERE id = $1`,
      [app.id]
    );
    if (app.converted_provider_id) {
      await pgQuery(`UPDATE trusted_services SET is_active = true WHERE id = $1`, [app.converted_provider_id]);
      console.log(`[stripe] Provider ${app.converted_provider_id} reactivated (invoice paid, grace period cleared)`);
    }
    await syncPartnerOrgSubscriptionStatus(app.email, "active", true);
  }

  if (stripe) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncAddonFlags(app.id, app.converted_provider_id, subscription);
    } catch (err: any) {
      console.log(`[stripe] Failed to sync add-ons on invoice.paid:`, err.message);
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = typeof invoice.subscription === "string"
    ? invoice.subscription
    : (invoice.subscription as any)?.id;

  if (!subscriptionId) return;

  console.log(`[stripe] Payment failed for subscription ${subscriptionId}`);

  const rows = await pgQuery(
    `SELECT * FROM partner_applications WHERE stripe_subscription_id = $1`,
    [subscriptionId]
  );
  if (rows.length === 0) return;
  const app = rows[0];

  const graceDays = 7;
  const graceEnd = new Date(Date.now() + graceDays * 24 * 60 * 60 * 1000).toISOString();

  await pgQuery(
    `UPDATE partner_applications
     SET subscription_status = 'past_due',
         featured_active = false,
         near_me_boost_active = false,
         sponsored_top_active = false,
         sponsored_inline_active = false,
         grace_period_end = $1,
         grace_warning_sent = false,
         updated_at = NOW()
     WHERE id = $2`,
    [graceEnd, app.id]
  );

  if (app.converted_provider_id) {
    await pgQuery(
      `UPDATE trusted_services
       SET is_featured = false,
           featured_active = false,
           near_me_boost_active = false,
           sponsored_top_active = false,
           sponsored_inline_active = false
       WHERE id = $1`,
      [app.converted_provider_id]
    );
    console.log(`[stripe] Provider ${app.converted_provider_id}: premium boosts removed, base listing stays active during ${graceDays}-day grace period (until ${graceEnd})`);
  }

  await syncPartnerOrgSubscriptionStatus(app.email, "past_due", false);

  if (app.email) {
    try {
      const portalUrl = `https://${process.env.APP_URL?.replace(/^https?:\/\//, '') || 'veterancare.com'}/discounts`;
      await sendPaymentFailedEmail(app.email, app.company_name, app.contact_name, portalUrl, graceDays);
    } catch (err: any) {
      console.log(`[stripe] Failed to send payment-failed email:`, err.message);
    }
  }
}

export async function checkGracePeriodExpirations(): Promise<void> {
  try {
    const warningRows = await pgQuery(
      `SELECT * FROM partner_applications
       WHERE grace_period_end IS NOT NULL
         AND grace_period_end > NOW()
         AND grace_period_end <= NOW() + INTERVAL '2 days'
         AND grace_warning_sent IS NOT true
         AND status = 'active'
         AND subscription_status = 'past_due'`
    );

    for (const app of warningRows) {
      if (app.email) {
        try {
          const daysLeft = Math.max(1, Math.ceil((new Date(app.grace_period_end).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
          await sendGraceExpiringEmail(app.email, app.company_name, app.contact_name, daysLeft);
          await pgQuery(`UPDATE partner_applications SET grace_warning_sent = true WHERE id = $1`, [app.id]);
          console.log(`[grace] Final warning sent to ${app.email} — ${daysLeft} day(s) remaining`);
        } catch (err: any) {
          console.log(`[grace] Warning email failed for ${app.id}:`, err.message);
        }
      }
    }

    const expiredRows = await pgQuery(
      `SELECT * FROM partner_applications
       WHERE grace_period_end IS NOT NULL
         AND grace_period_end <= NOW()
         AND status = 'active'
         AND subscription_status = 'past_due'`
    );

    for (const app of expiredRows) {
      await pgQuery(
        `UPDATE partner_applications
         SET status = 'inactive',
             billing_active = false,
             grace_period_end = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [app.id]
      );

      if (app.converted_provider_id) {
        await pgQuery(
          `UPDATE trusted_services SET is_active = false WHERE id = $1`,
          [app.converted_provider_id]
        );
      }
      await syncPartnerOrgSubscriptionStatus(app.email, "canceled", false);
      console.log(`[grace] Grace period expired — application ${app.id} / provider ${app.converted_provider_id} fully deactivated`);
    }
  } catch (err: any) {
    console.log(`[grace] Grace period check error:`, err.message);
  }
}
