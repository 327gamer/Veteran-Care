import Stripe from "stripe";
import { query as pgQuery } from "./pg-client";
import { supabaseAdmin } from "./supabase";
import { platform } from "../shared/platform";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.log("[stripe] STRIPE_SECRET_KEY not set — Stripe features disabled");
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2025-03-31.basil" as any })
  : null;

const PARTNER_PRICE_ID = process.env.STRIPE_PARTNER_PRICE_ID || null;
const DEFAULT_NOTIFY_EMAIL = "info@veterancare.com";

export function isStripeEnabled(): boolean {
  return !!stripe;
}

export async function createPartnerCheckoutSession(applicationId: string): Promise<{ url: string; sessionId: string }> {
  if (!stripe) throw new Error("Stripe is not configured");

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

  const priceId = app.stripe_price_id || PARTNER_PRICE_ID;
  if (!priceId) throw new Error("No Stripe price configured. Set STRIPE_PARTNER_PRICE_ID environment variable or assign a price to this application.");

  const appUrl = process.env.APP_URL || `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "veterancare.com"}`;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/partner-payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/partner-apply`,
    metadata: {
      application_id: applicationId,
      company_name: app.company_name,
    },
    subscription_data: {
      metadata: {
        application_id: applicationId,
        company_name: app.company_name,
      },
    },
  });

  await pgQuery(
    `UPDATE partner_applications
     SET status = 'approved_pending_payment', stripe_checkout_url = $1, stripe_price_id = $2, updated_at = NOW()
     WHERE id = $3`,
    [session.url, priceId, applicationId]
  );

  return { url: session.url!, sessionId: session.id };
}

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    default:
      console.log(`[stripe] Unhandled event type: ${event.type}`);
  }
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

  await pgQuery(
    `UPDATE partner_applications
     SET status = 'active',
         stripe_customer_id = $1,
         stripe_subscription_id = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [customerId, subscriptionId, applicationId]
  );

  if (app.converted_provider_id) {
    const { error } = await supabaseAdmin
      .from("trusted_services")
      .update({ is_active: true })
      .eq("id", app.converted_provider_id);
    if (error) console.log(`[stripe] Failed to activate provider ${app.converted_provider_id}:`, error.message);
    else console.log(`[stripe] Provider ${app.converted_provider_id} activated`);
  } else if (app.category_id) {
    const { data: provider, error: provErr } = await supabaseAdmin
      .from("trusted_services")
      .insert({
        category_id: app.category_id,
        name: app.company_name,
        short_description: app.service_description || null,
        website_url: app.website || null,
        phone: app.phone || null,
        email: app.email,
        city: app.city || null,
        state: app.state || null,
        is_active: true,
        is_featured: false,
        verification_status: "verified",
        notes_internal: `Auto-created via Stripe payment. Application ${applicationId}`,
      })
      .select()
      .single();

    if (provErr) {
      console.log(`[stripe] Failed to create provider:`, provErr.message);
    } else {
      await pgQuery(
        `UPDATE partner_applications SET converted_provider_id = $1, updated_at = NOW() WHERE id = $2`,
        [provider.id, applicationId]
      );
      console.log(`[stripe] Provider ${provider.id} created and linked to application ${applicationId}`);
    }
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription): Promise<void> {
  const applicationId = subscription.metadata?.application_id;
  const subscriptionId = subscription.id;

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
    `UPDATE partner_applications SET status = 'inactive', updated_at = NOW() WHERE id = $1`,
    [app.id]
  );

  if (app.converted_provider_id) {
    const { error } = await supabaseAdmin
      .from("trusted_services")
      .update({ is_active: false })
      .eq("id", app.converted_provider_id);
    if (error) console.log(`[stripe] Failed to deactivate provider:`, error.message);
    else console.log(`[stripe] Provider ${app.converted_provider_id} deactivated (subscription canceled)`);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const subscriptionId = subscription.id;
  const status = subscription.status;

  if (status === "active" || status === "trialing") return;

  if (status === "past_due" || status === "unpaid" || status === "canceled") {
    console.log(`[stripe] Subscription ${subscriptionId} status changed to ${status}`);
    const rows = await pgQuery(
      `SELECT * FROM partner_applications WHERE stripe_subscription_id = $1`,
      [subscriptionId]
    );
    if (rows.length === 0) return;
    const app = rows[0];

    await pgQuery(
      `UPDATE partner_applications SET status = 'inactive', updated_at = NOW() WHERE id = $1`,
      [app.id]
    );

    if (app.converted_provider_id) {
      await supabaseAdmin
        .from("trusted_services")
        .update({ is_active: false })
        .eq("id", app.converted_provider_id);
      console.log(`[stripe] Provider ${app.converted_provider_id} deactivated (status: ${status})`);
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

  await pgQuery(
    `UPDATE partner_applications SET status = 'inactive', updated_at = NOW() WHERE id = $1`,
    [app.id]
  );

  if (app.converted_provider_id) {
    await supabaseAdmin
      .from("trusted_services")
      .update({ is_active: false })
      .eq("id", app.converted_provider_id);
    console.log(`[stripe] Provider ${app.converted_provider_id} deactivated (payment failed)`);
  }
}
