import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase, supabaseAdmin, supabaseForUser } from "./supabase";
import { geocodeAddress, haversineDistance } from "./geocode";
import { autoRouteNewLead } from "./lead-router";
import { startEscalationTimer } from "./lead-escalation";
import { startFounderDigestTimer, sendFounderDigest } from "./founder-digest";
import { sendNavigatorNotification, sendTrustedServiceLeadNotification, sendPartnerPaymentEmail } from "./lead-email";
import { handleAiChat } from "./ai/engine";
import { platform } from "../shared/platform";
import { getLeadEligibility, getLeadEligibleCategorySlugs, getLeadEligibleSubcategorySlugs, isLeadEligibleCategory } from "../shared/lead-eligibility";
import { toCanonical, toLegacy, normalizeCategoryList } from "../shared/canonical-categories";
import { ensureLeadEventsTable, logLeadEvent } from "./lead-events";
import { ensureMonetizationAuditTable } from "./monetization-audit";
import { query as pgQuery } from "./pg-client";
import { registerSeededProviderRoutes } from "./seeded-providers-routes";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { stripe, isStripeEnabled, createPartnerCheckoutSession, createCustomerPortalSession, handleWebhookEvent, verifyAndActivateCheckoutSession } from "./stripe-service";
import express from "express";
import QRCode from "qrcode";

function parsePagination(req: { query: Record<string, any> }, defaultLimit = 100, maxLimit = 500): { limit: number; offset: number } {
  const rawLimit = parseInt(req.query.limit as string, 10);
  const rawOffset = parseInt(req.query.offset as string, 10);
  return {
    limit: Math.min(Math.max(rawLimit || defaultLimit, 1), maxLimit),
    offset: Math.max(rawOffset || 0, 0),
  };
}

function normalizeSearchTerm(q: string): string {
  return q
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[-–—]/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "%")
    .trim();
}

let hasGeoColumns = true;
let hasSubcategoryColumn = false;
let hasServicePriorityColumn = false;
let hasNavLifecycleColumns = false;
let hasNavUtmColumns = false;
let hasNavAmbassadorId = false;
let hasNotifyEmailColumn = false;

async function checkGeoColumns() {
  const { error } = await supabaseAdmin.from("resources").select("latitude").limit(1);
  if (error && error.message.includes("does not exist")) {
    hasGeoColumns = false;
    console.log("[geo] latitude/longitude columns not found — Near Me feature disabled until columns are added");
  } else {
    hasGeoColumns = true;
  }
}

async function checkSubcategoryColumn() {
  const { error } = await supabaseAdmin.from("resources").select("subcategory").limit(1);
  if (error && error.message.includes("does not exist")) {
    hasSubcategoryColumn = false;
    console.log("[schema] subcategory column not found. Please run in Supabase SQL editor: ALTER TABLE resources ADD COLUMN subcategory TEXT;");
  } else {
    hasSubcategoryColumn = true;
  }
}

async function checkServicePriorityColumn() {
  const { error } = await supabaseAdmin.from("resources").select("service_priority").limit(1);
  if (error && error.message.includes("does not exist")) {
    hasServicePriorityColumn = false;
    console.log("[schema] service_priority column not found. Please run in Supabase SQL editor: ALTER TABLE resources ADD COLUMN service_priority TEXT;");
  } else {
    hasServicePriorityColumn = true;
  }
}

async function checkNotifyEmailColumn() {
  const { error } = await supabaseAdmin.from("resources").select("notify_email").limit(1);
  if (error && error.message.includes("does not exist")) {
    hasNotifyEmailColumn = false;
    console.log("[schema] notify_email column not found. Run: ALTER TABLE resources ADD COLUMN notify_email TEXT;");
  } else {
    hasNotifyEmailColumn = true;
  }
}

let hasRoutingColumns = false;
let hasResponseTrackingColumns = false;
let hasBillingColumns = false;
let hasPartnerTable = false;
let hasRoutingRulesTable = false;
let hasStatesTable = false;
let hasTrustedServicesTable = false;

let statesHasFullSchema = false;

async function ensureAttributionTables() {
  try {
    // === AMBASSADORS (canonical identity table) ===
    await pgQuery(`
      CREATE TABLE IF NOT EXISTS ambassadors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL UNIQUE,
        first_name TEXT,
        last_name TEXT,
        display_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        region_type TEXT,
        region_value TEXT,
        referral_code TEXT,
        stripe_connect_account_id TEXT,
        payout_method_status TEXT,
        commission_plan_id TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by TEXT
      )
    `);
    await pgQuery(`ALTER TABLE ambassadors ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2)`);
    await pgQuery(`ALTER TABLE ambassadors ADD COLUMN IF NOT EXISTS payout_method TEXT`);
    await pgQuery(`ALTER TABLE ambassadors ADD COLUMN IF NOT EXISTS payout_details TEXT`);
    await pgQuery(`ALTER TABLE ambassadors ADD COLUMN IF NOT EXISTS w9_status TEXT DEFAULT 'not_submitted'`);
    await pgQuery(`ALTER TABLE ambassadors ADD COLUMN IF NOT EXISTS tax_notes TEXT`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_ambassadors_code ON ambassadors(code)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_ambassadors_status ON ambassadors(status)`);

    // === USER ATTRIBUTION SESSIONS ===
    await pgQuery(`
      CREATE TABLE IF NOT EXISTS user_attribution_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT NOT NULL,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        utm_content TEXT,
        utm_term TEXT,
        landing_page TEXT,
        referrer TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pgQuery(`ALTER TABLE user_attribution_sessions ADD COLUMN IF NOT EXISTS utm_id TEXT`);
    await pgQuery(`ALTER TABLE user_attribution_sessions ADD COLUMN IF NOT EXISTS ambassador_id UUID REFERENCES ambassadors(id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_attr_sess_session ON user_attribution_sessions(session_id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_attr_sess_ambassador ON user_attribution_sessions(utm_content)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_attr_sess_utm_id ON user_attribution_sessions(utm_id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_attr_sess_amb_id ON user_attribution_sessions(ambassador_id)`);

    // === TRUSTED SERVICE LEADS ===
    await pgQuery(`ALTER TABLE trusted_service_leads ADD COLUMN IF NOT EXISTS utm_source TEXT`);
    await pgQuery(`ALTER TABLE trusted_service_leads ADD COLUMN IF NOT EXISTS utm_medium TEXT`);
    await pgQuery(`ALTER TABLE trusted_service_leads ADD COLUMN IF NOT EXISTS utm_campaign TEXT`);
    await pgQuery(`ALTER TABLE trusted_service_leads ADD COLUMN IF NOT EXISTS utm_content TEXT`);
    await pgQuery(`ALTER TABLE trusted_service_leads ADD COLUMN IF NOT EXISTS session_id TEXT`);
    await pgQuery(`ALTER TABLE trusted_service_leads ADD COLUMN IF NOT EXISTS utm_id TEXT`);
    await pgQuery(`ALTER TABLE trusted_service_leads ADD COLUMN IF NOT EXISTS ambassador_id UUID REFERENCES ambassadors(id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_tsl_amb_id ON trusted_service_leads(ambassador_id)`);

    // === PARTNER APPLICATIONS ===
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS utm_source TEXT`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS utm_medium TEXT`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS utm_campaign TEXT`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS utm_content TEXT`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS session_id TEXT`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS utm_id TEXT`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS ambassador_id UUID REFERENCES ambassadors(id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_pa_amb_id ON partner_applications(ambassador_id)`);

    // === PARTNER ATTRIBUTION ===
    await pgQuery(`
      CREATE TABLE IF NOT EXISTS partner_attribution (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID REFERENCES partner_applications(id),
        ambassador TEXT,
        utm_source TEXT,
        utm_medium TEXT,
        utm_campaign TEXT,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        plan_type TEXT,
        revenue_amount NUMERIC(10, 2),
        event_type TEXT NOT NULL DEFAULT 'checkout_completed',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pgQuery(`ALTER TABLE partner_attribution ADD COLUMN IF NOT EXISTS utm_id TEXT`);
    await pgQuery(`ALTER TABLE partner_attribution ADD COLUMN IF NOT EXISTS ambassador_id UUID REFERENCES ambassadors(id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_partner_attr_ambassador ON partner_attribution(ambassador)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_partner_attr_amb_id ON partner_attribution(ambassador_id)`);

    // === AMBASSADOR LINKS (child of ambassadors) ===
    await pgQuery(`
      CREATE TABLE IF NOT EXISTS ambassador_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ambassador_name TEXT NOT NULL,
        ambassador_code TEXT NOT NULL,
        base_path TEXT NOT NULL,
        utm_source TEXT NOT NULL,
        utm_medium TEXT NOT NULL,
        utm_campaign TEXT NOT NULL,
        utm_content TEXT NOT NULL,
        utm_id TEXT,
        full_url TEXT NOT NULL,
        audience_type TEXT NOT NULL,
        channel_type TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pgQuery(`ALTER TABLE ambassador_links ADD COLUMN IF NOT EXISTS link_name TEXT`);
    await pgQuery(`ALTER TABLE ambassador_links ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0`);
    await pgQuery(`ALTER TABLE ambassador_links ADD COLUMN IF NOT EXISTS first_clicked_at TIMESTAMPTZ`);
    await pgQuery(`ALTER TABLE ambassador_links ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMPTZ`);
    await pgQuery(`ALTER TABLE ambassador_links ADD COLUMN IF NOT EXISTS email TEXT`);
    await pgQuery(`ALTER TABLE ambassador_links ADD COLUMN IF NOT EXISTS region TEXT`);
    await pgQuery(`ALTER TABLE ambassador_links ADD COLUMN IF NOT EXISTS ambassador_id UUID REFERENCES ambassadors(id)`);
    await pgQuery(`ALTER TABLE ambassador_links ADD COLUMN IF NOT EXISTS short_url TEXT`);
    await pgQuery(`UPDATE ambassador_links SET short_url = '/a/' || utm_id WHERE short_url IS NULL AND utm_id IS NOT NULL`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_amb_links_code ON ambassador_links(ambassador_code)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_amb_links_audience ON ambassador_links(audience_type)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_amb_links_channel ON ambassador_links(channel_type)`);
    await pgQuery(`CREATE UNIQUE INDEX IF NOT EXISTS idx_amb_links_utm_id ON ambassador_links(utm_id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_amb_links_ambassador_id ON ambassador_links(ambassador_id)`);

    // === COMMISSIONS (earnings ledger) ===
    await pgQuery(`
      CREATE TABLE IF NOT EXISTS commissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ambassador_code TEXT NOT NULL,
        utm_id TEXT,
        application_id UUID,
        revenue_amount NUMERIC(10,2) DEFAULT 0,
        commission_percentage NUMERIC(5,2) DEFAULT 10.00,
        commission_amount NUMERIC(10,2) DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pgQuery(`ALTER TABLE commissions ADD COLUMN IF NOT EXISTS ambassador_id UUID REFERENCES ambassadors(id)`);
    await pgQuery(`ALTER TABLE commissions ADD COLUMN IF NOT EXISTS payout_id UUID`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_commissions_ambassador ON commissions(ambassador_code)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_commissions_amb_id ON commissions(ambassador_id)`);

    // === AMBASSADOR PAYOUTS ===
    await pgQuery(`
      CREATE TABLE IF NOT EXISTS ambassador_payouts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ambassador_id UUID NOT NULL REFERENCES ambassadors(id),
        payout_period_start TIMESTAMPTZ NOT NULL,
        payout_period_end TIMESTAMPTZ NOT NULL,
        total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        payout_status TEXT NOT NULL DEFAULT 'pending',
        payout_method TEXT,
        external_payout_id TEXT,
        paid_at TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgQuery(`ALTER TABLE ambassador_payouts ADD COLUMN IF NOT EXISTS confirmation_note TEXT`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_payouts_amb_id ON ambassador_payouts(ambassador_id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_payouts_status ON ambassador_payouts(payout_status)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_commissions_payout_id ON commissions(payout_id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON ambassador_payouts(created_at)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_amb_links_created_at ON ambassador_links(created_at)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_attr_sess_created_at ON user_attribution_sessions(created_at)`);

    // === BACKFILL: Create ambassador profiles from existing link data ===
    await pgQuery(`
      INSERT INTO ambassadors (code, display_name, email, region_value, created_at)
      SELECT DISTINCT ON (ambassador_code)
        ambassador_code,
        ambassador_name,
        email,
        region,
        MIN(created_at) OVER (PARTITION BY ambassador_code)
      FROM ambassador_links
      WHERE ambassador_code IS NOT NULL
      ORDER BY ambassador_code, created_at ASC
      ON CONFLICT (code) DO NOTHING
    `);

    // === BACKFILL: Link existing ambassador_links to ambassadors ===
    await pgQuery(`
      UPDATE ambassador_links al
      SET ambassador_id = a.id
      FROM ambassadors a
      WHERE al.ambassador_code = a.code
        AND al.ambassador_id IS NULL
    `);

    // === BACKFILL: Link existing commissions to ambassadors ===
    await pgQuery(`
      UPDATE commissions c
      SET ambassador_id = a.id
      FROM ambassadors a
      WHERE c.ambassador_code = a.code
        AND c.ambassador_id IS NULL
    `);

    // === BACKFILL: Link partner_attribution to ambassadors ===
    await pgQuery(`
      UPDATE partner_attribution pa
      SET ambassador_id = a.id
      FROM ambassadors a
      WHERE pa.ambassador = a.code
        AND pa.ambassador_id IS NULL
    `);

    // === BACKFILL: Link user_attribution_sessions to ambassadors (via utm_content = code) ===
    await pgQuery(`
      UPDATE user_attribution_sessions uas
      SET ambassador_id = a.id
      FROM ambassadors a
      WHERE uas.utm_content = a.code
        AND uas.ambassador_id IS NULL
        AND uas.utm_content IS NOT NULL
    `);

    // === BACKFILL: Link trusted_service_leads to ambassadors (via utm_content = code) ===
    await pgQuery(`
      UPDATE trusted_service_leads tsl
      SET ambassador_id = a.id
      FROM ambassadors a
      WHERE tsl.utm_content = a.code
        AND tsl.ambassador_id IS NULL
        AND tsl.utm_content IS NOT NULL
    `);

    // === BACKFILL: Link partner_applications to ambassadors (via utm_content = code) ===
    await pgQuery(`
      UPDATE partner_applications pa
      SET ambassador_id = a.id
      FROM ambassadors a
      WHERE pa.utm_content = a.code
        AND pa.ambassador_id IS NULL
        AND pa.utm_content IS NOT NULL
    `);

    // === SEED: Core ambassador profiles + links if missing ===
    const ambCount = await pgQuery("SELECT COUNT(*) as cnt FROM ambassadors");
    const linkCountResult = await pgQuery("SELECT COUNT(*) as cnt FROM ambassador_links");
    const ambEmpty = parseInt(ambCount[0].cnt, 10) === 0;
    const linksEmpty = parseInt(linkCountResult[0].cnt, 10) === 0;
    if (ambEmpty || linksEmpty) {
      const seedAmbassadors = [
        { id: 'a9028dc0-7f4f-4f24-aff1-9e20e2637aa0', code: 'colin_slaven', display_name: 'Colin Slaven', first_name: 'Colin', last_name: 'Slaven', email: 'colin@veterancare.com', phone: '8434697000', region_type: 'national', region_value: 'USA', commission_rate: 100.00, created_at: '2026-03-26T20:24:39.368Z' },
        { id: 'ba8d39d7-64bf-4d34-b485-e3de7c628bd3', code: 'debbie_slaven', display_name: 'Debbie Slaven', first_name: 'Debbie', last_name: 'Slaven', email: 'debbie@veterancare.com', phone: '8434697000', region_type: 'national', region_value: 'USA', commission_rate: 100.00, created_at: '2026-04-05T04:48:36.991Z' },
        { id: 'd259629f-a438-4ff7-954f-9b9339b92f97', code: 'kelsey_flanagan', display_name: 'Kelsey Flanagan', first_name: 'Kelsey', last_name: 'Flanagan', email: null, phone: null, region_type: 'state', region_value: 'South Carolina', commission_rate: 10.00, created_at: '2026-04-05T04:48:37.279Z' },
        { id: '5c611623-d79b-42b0-a2f3-186e12fbab79', code: 'michelle_keef', display_name: 'Michelle Keef', first_name: 'Michelle', last_name: 'Keef', email: null, phone: null, region_type: 'state', region_value: 'South Carolina', commission_rate: 10.00, created_at: '2026-04-05T04:48:37.143Z' },
        { id: '393f2dfa-fea0-4df0-a70a-bf6721af54d7', code: 'tracy_robertson', display_name: 'Tracy Robertson', first_name: 'Tracy', last_name: 'Robertson', email: null, phone: null, region_type: 'state', region_value: 'South Carolina', commission_rate: 10.00, created_at: '2026-04-05T04:48:50.586Z' },
      ];
      if (ambEmpty) {
        console.log("[schema] Seeding ambassador profiles...");
        for (const a of seedAmbassadors) {
          await pgQuery(
            `INSERT INTO ambassadors (id, code, display_name, first_name, last_name, email, phone, region_type, region_value, status, commission_rate, w9_status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', $10, 'not_submitted', $11)
             ON CONFLICT (id) DO NOTHING`,
            [a.id, a.code, a.display_name, a.first_name, a.last_name, a.email, a.phone, a.region_type, a.region_value, a.commission_rate, a.created_at]
          );
        }
        console.log("[schema] Seeded 5 ambassadors");
      }

      if (linksEmpty) {
        console.log("[schema] Seeding ambassador links...");
        const SEED_AUDIENCES: Record<string, { path: string; campaign: string; label: string }> = {
          veteran:       { path: "/start",           campaign: "sc_veteran_help",        label: "Veterans & Dependents" },
          case_manager:  { path: "/resource-center", campaign: "sc_case_manager_drive",  label: "Case Manager Outreach" },
          partner:       { path: "/partners",        campaign: "sc_partner_growth",      label: "Partner / Business Outreach" },
          general:       { path: "/get-help",        campaign: "sc_launch",              label: "Get Help Now" },
          homepage:      { path: "/",                campaign: "sc_homepage_traffic",    label: "General Share Link (Homepage)" },
        };
        const CHANNELS = ["email", "text", "facebook", "instagram", "linkedin", "qr", "flyer"];
        const CHANNEL_LABELS: Record<string, string> = { email: "Email", text: "Text", facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", qr: "QR Code", flyer: "Flyer" };
        let linkTotal = 0;
        for (const a of seedAmbassadors) {
          for (const [audienceKey, audience] of Object.entries(SEED_AUDIENCES)) {
            for (const channel of CHANNELS) {
              const linkName = `${a.display_name} – ${CHANNEL_LABELS[channel]} – ${audience.label}`;
              const utmId = `${a.code}_${audienceKey}_${channel}`;
              const fullUrl = `https://veterancare.com${audience.path}?utm_source=ambassador&utm_medium=${channel}&utm_campaign=${audience.campaign}&utm_content=${a.code}&utm_id=${utmId}`;
              await pgQuery(
                `INSERT INTO ambassador_links (ambassador_id, ambassador_code, ambassador_name, link_name, utm_id, base_path, utm_source, utm_medium, utm_campaign, utm_content, full_url, short_url, audience_type, channel_type, is_active, click_count, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, 0, NOW())
                 ON CONFLICT DO NOTHING`,
                [a.id, a.code, a.display_name, linkName, utmId, audience.path, 'ambassador', channel, audience.campaign, a.code, fullUrl, `/a/${utmId}`, audienceKey, channel]
              );
              linkTotal++;
            }
          }
        }
        console.log(`[schema] Seeded ${linkTotal} ambassador links`);
      }
    }

    // === FIX: Correct ambassador link destinations if /home was used ===
    const homeLinkCheck = await pgQuery("SELECT COUNT(*) as cnt FROM ambassador_links WHERE base_path = '/home'");
    if (parseInt(homeLinkCheck[0].cnt, 10) > 0) {
      console.log("[schema] Fixing ambassador link destinations from /home to audience-specific paths...");
      const AUDIENCE_PATHS: Record<string, { path: string; campaign: string }> = {
        veteran:       { path: "/start",           campaign: "sc_veteran_help" },
        case_manager:  { path: "/resource-center", campaign: "sc_case_manager_drive" },
        partner:       { path: "/partners",        campaign: "sc_partner_growth" },
        general:       { path: "/get-help",        campaign: "sc_launch" },
        homepage:      { path: "/",                campaign: "sc_homepage_traffic" },
      };
      for (const [audienceKey, aud] of Object.entries(AUDIENCE_PATHS)) {
        await pgQuery(
          `UPDATE ambassador_links
           SET base_path = $1,
               utm_campaign = $2,
               full_url = REPLACE(
                 REPLACE(full_url, '/home?', $1 || '?'),
                 'utm_campaign=' || audience_type,
                 'utm_campaign=' || $2
               )
           WHERE audience_type = $3 AND base_path = '/home'`,
          [aud.path, aud.campaign, audienceKey]
        );
      }
      const remaining = await pgQuery("SELECT COUNT(*) as cnt FROM ambassador_links WHERE base_path = '/home'");
      console.log(`[schema] Fixed link destinations (${remaining[0].cnt} still on /home)`);
    }

    // === FIX: Swap veteran links from /get-help → /start and general from /start → /get-help ===
    const vetOnGetHelp = await pgQuery("SELECT COUNT(*) as cnt FROM ambassador_links WHERE audience_type = 'veteran' AND base_path = '/get-help'");
    if (parseInt(vetOnGetHelp[0].cnt, 10) > 0) {
      console.log("[schema] Updating veteran links: /get-help → /start (landing page flow)...");
      await pgQuery(
        `UPDATE ambassador_links
         SET base_path = '/start',
             full_url = REPLACE(full_url, '/get-help?', '/start?')
         WHERE audience_type = 'veteran' AND base_path = '/get-help'`
      );
      const fixed = await pgQuery("SELECT COUNT(*) as cnt FROM ambassador_links WHERE audience_type = 'veteran' AND base_path = '/start'");
      console.log(`[schema] Updated ${fixed[0].cnt} veteran links to /start`);
    }
    const genOnStart = await pgQuery("SELECT COUNT(*) as cnt FROM ambassador_links WHERE audience_type = 'general' AND base_path = '/start'");
    if (parseInt(genOnStart[0].cnt, 10) > 0) {
      console.log("[schema] Updating general links: /start → /get-help (direct help flow)...");
      await pgQuery(
        `UPDATE ambassador_links
         SET base_path = '/get-help',
             full_url = REPLACE(full_url, '/start?', '/get-help?')
         WHERE audience_type = 'general' AND base_path = '/start'`
      );
      const fixed = await pgQuery("SELECT COUNT(*) as cnt FROM ambassador_links WHERE audience_type = 'general' AND base_path = '/get-help'");
      console.log(`[schema] Updated ${fixed[0].cnt} general links to /get-help`);
    }

    // === FIX: Rename old link_name labels to new naming convention ===
    const oldVetNames = await pgQuery("SELECT COUNT(*) as cnt FROM ambassador_links WHERE link_name LIKE '%– Veteran Outreach'");
    if (parseInt(oldVetNames[0].cnt, 10) > 0) {
      await pgQuery(`UPDATE ambassador_links SET link_name = REPLACE(link_name, '– Veteran Outreach', '– Veterans & Dependents') WHERE link_name LIKE '%– Veteran Outreach'`);
      console.log(`[schema] Renamed ${oldVetNames[0].cnt} link names: Veteran Outreach → Veterans & Dependents`);
    }
    const oldGenNames = await pgQuery("SELECT COUNT(*) as cnt FROM ambassador_links WHERE link_name LIKE '%– General Outreach'");
    if (parseInt(oldGenNames[0].cnt, 10) > 0) {
      await pgQuery(`UPDATE ambassador_links SET link_name = REPLACE(link_name, '– General Outreach', '– Get Help Now') WHERE link_name LIKE '%– General Outreach'`);
      console.log(`[schema] Renamed ${oldGenNames[0].cnt} link names: General Outreach → Get Help Now`);
    }

    // === MIGRATION: Seed homepage links for existing ambassadors ===
    const homepageLinksCheck = await pgQuery("SELECT COUNT(*) as cnt FROM ambassador_links WHERE audience_type = 'homepage'");
    if (parseInt(homepageLinksCheck[0].cnt, 10) === 0) {
      console.log("[migration] Seeding homepage links for all ambassadors...");
      const allAmbassadors = await pgQuery<{id: string; code: string; display_name: string}>("SELECT id, code, display_name FROM ambassadors");
      const HP_CHANNELS = ["email", "text", "facebook", "instagram", "linkedin", "qr", "flyer"];
      const HP_CHANNEL_LABELS: Record<string, string> = { email: "Email", text: "Text", facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", qr: "QR Code", flyer: "Flyer" };
      let hpCount = 0;
      for (const a of allAmbassadors) {
        for (const channel of HP_CHANNELS) {
          const linkName = `${a.display_name} – ${HP_CHANNEL_LABELS[channel]} – General Share Link (Homepage)`;
          const utmId = `${a.code}_homepage_${channel}`;
          const fullUrl = `https://veterancare.com/?utm_source=ambassador&utm_medium=${channel}&utm_campaign=sc_homepage_traffic&utm_content=${a.code}&utm_id=${utmId}`;
          await pgQuery(
            `INSERT INTO ambassador_links (ambassador_id, ambassador_code, ambassador_name, link_name, utm_id, base_path, utm_source, utm_medium, utm_campaign, utm_content, full_url, short_url, audience_type, channel_type, is_active, click_count, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, 0, NOW())
             ON CONFLICT DO NOTHING`,
            [a.id, a.code, a.display_name, linkName, utmId, '/', 'ambassador', channel, 'sc_homepage_traffic', a.code, fullUrl, `/a/${utmId}`, 'homepage', channel]
          );
          hpCount++;
        }
      }
      console.log(`[migration] Seeded ${hpCount} homepage links for ${allAmbassadors.length} ambassadors`);
    }

    // === FIX: Remove test commission data ===
    const testCommissions = await pgQuery("SELECT COUNT(*) as cnt FROM commissions WHERE ambassador_code = 'test_john'");
    if (parseInt(testCommissions[0].cnt, 10) > 0) {
      await pgQuery("DELETE FROM commissions WHERE ambassador_code = 'test_john'");
      console.log(`[schema] Removed ${testCommissions[0].cnt} test_john commission records`);
    }

    // === MIGRATION: Rename Kelsey Reese → Kelsey Flanagan ===
    const kelseyOld = await pgQuery("SELECT COUNT(*) as cnt FROM ambassadors WHERE code = 'kelsey_reese'");
    const kelseyNew = await pgQuery("SELECT COUNT(*) as cnt FROM ambassadors WHERE code = 'kelsey_flanagan'");
    const hasOldKelsey = parseInt(kelseyOld[0].cnt, 10) > 0;
    const hasNewKelsey = parseInt(kelseyNew[0].cnt, 10) > 0;
    if (hasOldKelsey && hasNewKelsey) {
      console.log("[migration] Both kelsey_reese and kelsey_flanagan exist — merging to kelsey_flanagan...");
      const oldId = (await pgQuery("SELECT id FROM ambassadors WHERE code = 'kelsey_reese'"))[0].id;
      const newId = (await pgQuery("SELECT id FROM ambassadors WHERE code = 'kelsey_flanagan'"))[0].id;
      await pgQuery(`DELETE FROM ambassador_links WHERE ambassador_id = $1`, [oldId]);
      try { await pgQuery(`UPDATE user_attribution_sessions SET ambassador_id = $1 WHERE ambassador_id = $2`, [newId, oldId]); } catch (_e) {}
      try { await pgQuery(`UPDATE user_attribution_sessions SET utm_content = 'kelsey_flanagan' WHERE utm_content = 'kelsey_reese'`); } catch (_e) {}
      try { await pgQuery(`UPDATE commissions SET ambassador_code = 'kelsey_flanagan', ambassador_id = $1 WHERE ambassador_code = 'kelsey_reese'`, [newId]); } catch (_e) {}
      try { await pgQuery(`UPDATE partner_attribution SET ambassador = 'kelsey_flanagan', ambassador_id = $1 WHERE ambassador = 'kelsey_reese'`, [newId]); } catch (_e) {}
      try { await pgQuery(`UPDATE ambassador_payouts SET ambassador_id = $1 WHERE ambassador_id = $2`, [newId, oldId]); } catch (_e) {}
      try { await pgQuery(`UPDATE trusted_service_leads SET utm_content = 'kelsey_flanagan' WHERE utm_content = 'kelsey_reese'`); } catch (_e) {}
      try { await pgQuery(`UPDATE partner_applications SET utm_content = 'kelsey_flanagan' WHERE utm_content = 'kelsey_reese'`); } catch (_e) {}
      await pgQuery("DELETE FROM ambassadors WHERE code = 'kelsey_reese'");
      console.log("[migration] Merged kelsey_reese into kelsey_flanagan and removed old profile");
    } else if (hasOldKelsey && !hasNewKelsey) {
      console.log("[migration] Renaming ambassador kelsey_reese → kelsey_flanagan...");
      await pgQuery(
        `UPDATE ambassadors SET code = 'kelsey_flanagan', display_name = 'Kelsey Flanagan', last_name = 'Flanagan' WHERE code = 'kelsey_reese'`
      );
      const AUDIENCES: Record<string, { path: string; campaign: string; label: string }> = {
        veteran:       { path: "/start",           campaign: "sc_veteran_help",        label: "Veterans & Dependents" },
        case_manager:  { path: "/resource-center", campaign: "sc_case_manager_drive",  label: "Case Manager Outreach" },
        partner:       { path: "/partners",        campaign: "sc_partner_growth",      label: "Partner / Business Outreach" },
        general:       { path: "/get-help",        campaign: "sc_launch",              label: "Get Help Now" },
        homepage:      { path: "/",                campaign: "sc_homepage_traffic",    label: "General Share Link (Homepage)" },
      };
      const CHANNELS = ["email", "text", "facebook", "instagram", "linkedin", "qr", "flyer"];
      const CHANNEL_LABELS: Record<string, string> = { email: "Email", text: "Text", facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", qr: "QR Code", flyer: "Flyer" };
      let updatedLinks = 0;
      for (const [audienceKey, audience] of Object.entries(AUDIENCES)) {
        for (const channel of CHANNELS) {
          const oldUtmId = `kelsey_reese_${audienceKey}_${channel}`;
          const newUtmId = `kelsey_flanagan_${audienceKey}_${channel}`;
          const newLinkName = `Kelsey Flanagan – ${CHANNEL_LABELS[channel]} – ${audience.label}`;
          const newFullUrl = `https://veterancare.com${audience.path}?utm_source=ambassador&utm_medium=${channel}&utm_campaign=${audience.campaign}&utm_content=kelsey_flanagan&utm_id=${newUtmId}`;
          const newShortUrl = `/a/${newUtmId}`;
          await pgQuery(
            `UPDATE ambassador_links SET
               ambassador_code = 'kelsey_flanagan',
               ambassador_name = 'Kelsey Flanagan',
               link_name = $1,
               utm_id = $2,
               utm_content = 'kelsey_flanagan',
               full_url = $3,
               short_url = $4
             WHERE utm_id = $5`,
            [newLinkName, newUtmId, newFullUrl, newShortUrl, oldUtmId]
          );
          updatedLinks++;
        }
      }
      try { await pgQuery(`UPDATE user_attribution_sessions SET utm_content = 'kelsey_flanagan' WHERE utm_content = 'kelsey_reese'`); } catch (_e) {}
      try { await pgQuery(`UPDATE commissions SET ambassador_code = 'kelsey_flanagan' WHERE ambassador_code = 'kelsey_reese'`); } catch (_e) {}
      try { await pgQuery(`UPDATE partner_attribution SET ambassador = 'kelsey_flanagan' WHERE ambassador = 'kelsey_reese'`); } catch (_e) {}
      try { await pgQuery(`UPDATE ambassador_payouts SET ambassador_id = (SELECT id FROM ambassadors WHERE code = 'kelsey_flanagan') WHERE ambassador_id = (SELECT id FROM ambassadors WHERE code = 'kelsey_reese')`); } catch (_e) {}
      try { await pgQuery(`UPDATE trusted_service_leads SET utm_content = 'kelsey_flanagan' WHERE utm_content = 'kelsey_reese'`); } catch (_e) {}
      try { await pgQuery(`UPDATE partner_applications SET utm_content = 'kelsey_flanagan' WHERE utm_content = 'kelsey_reese'`); } catch (_e) {}
      console.log(`[migration] Renamed kelsey_reese → kelsey_flanagan (profile + ${updatedLinks} links + all attribution tables)`);
    }

    console.log("[schema] attribution tables ready (with ambassadors + payouts)");
  } catch (err: any) {
    console.log("[schema] attribution tables setup error:", err.message);
  }
}

async function ensureLeadBilling() {
  try {
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS billing_model TEXT DEFAULT 'subscription_only'`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS lead_price_cents INTEGER`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS is_lead_enabled BOOLEAN DEFAULT false`);
    await pgQuery(`
      CREATE TABLE IF NOT EXISTS lead_billing_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL,
        navigator_request_id UUID,
        lead_category TEXT,
        price_cents INTEGER NOT NULL,
        billing_period TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'billed', 'disputed', 'waived', 'credited')),
        dispute_reason TEXT,
        dispute_filed_at TIMESTAMPTZ,
        dispute_resolved_at TIMESTAMPTZ,
        dispute_resolution TEXT,
        stripe_invoice_item_id TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_lead_billing_partner ON lead_billing_records(partner_id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_lead_billing_period ON lead_billing_records(billing_period)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_lead_billing_status ON lead_billing_records(status)`);
    await pgQuery(`
      CREATE TABLE IF NOT EXISTS lead_category_pricing (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_slug TEXT NOT NULL UNIQUE,
        category_name TEXT NOT NULL,
        price_cents INTEGER NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const defaultPrices = await pgQuery(`SELECT id FROM lead_category_pricing LIMIT 1`);
    if (defaultPrices.length === 0) {
      await pgQuery(`
        INSERT INTO lead_category_pricing (category_slug, category_name, price_cents) VALUES
          ('financial-credit', 'Financial Services', 5000),
          ('insurance', 'Insurance Services', 2500),
          ('legal-services', 'Legal Services', 3500)
        ON CONFLICT (category_slug) DO NOTHING
      `);
      console.log("[seed] Default lead category pricing seeded");
    }
    console.log("[schema] lead billing tables ready");
  } catch (err: any) {
    console.log("[schema] lead billing setup:", err.message);
  }
}

async function ensurePartnerReferrals() {
  try {
    await pgQuery(`
      CREATE TABLE IF NOT EXISTS partner_referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_partner_id UUID NOT NULL,
        referred_company_name TEXT NOT NULL,
        referred_contact_name TEXT NOT NULL,
        referred_email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        referred_application_id UUID,
        credit_coupon_id TEXT,
        credit_applied_at TIMESTAMPTZ,
        admin_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_partner_referrals_referrer ON partner_referrals(referrer_partner_id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_partner_referrals_email ON partner_referrals(referred_email)`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS referral_code TEXT`);
    await pgQuery(`CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_app_referral_code ON partner_applications(referral_code) WHERE referral_code IS NOT NULL`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS referred_by_partner_id UUID`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS password_hash TEXT`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT false`);
    await pgQuery(`
      CREATE TABLE IF NOT EXISTS partner_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
      )
    `);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_partner_sessions_token ON partner_sessions(token)`);
    console.log("[schema] partner_referrals table ready");
  } catch (err: any) {
    console.log("[schema] partner_referrals error:", err.message);
  }
}

function generatePartnerReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "VC-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function getOrCreatePartnerReferralCode(partnerId: string): Promise<string> {
  const existing = await pgQuery(
    `SELECT referral_code FROM partner_applications WHERE id = $1`,
    [partnerId]
  );
  if (existing.length > 0 && existing[0].referral_code) return existing[0].referral_code;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generatePartnerReferralCode();
    try {
      await pgQuery(
        `UPDATE partner_applications SET referral_code = $1 WHERE id = $2 AND referral_code IS NULL`,
        [code, partnerId]
      );
      const check = await pgQuery(`SELECT referral_code FROM partner_applications WHERE id = $1`, [partnerId]);
      if (check.length > 0 && check[0].referral_code) return check[0].referral_code;
    } catch {}
  }
  throw new Error("Failed to generate unique referral code");
}

async function ensurePartnerSubcategories() {
  try {
    await pgQuery(`
      CREATE TABLE IF NOT EXISTS partner_subcategories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID NOT NULL REFERENCES trusted_service_categories(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(category_id, slug)
      )
    `);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS subcategory_ids TEXT`);
    const existing = await pgQuery(`SELECT id FROM partner_subcategories LIMIT 1`);
    if (existing.length === 0) {
      const catMap = await pgQuery(`SELECT id, slug FROM trusted_service_categories`);
      const findCat = (slug: string) => catMap.find((c: any) => c.slug === slug)?.id;
      const legal = findCat('legal-services');
      const insurance = findCat('insurance');
      const financial = findCat('financial-credit');
      const inserts: string[] = [];
      const params: any[] = [];
      let idx = 1;
      const add = (catId: string | undefined, name: string, slug: string, order: number) => {
        if (!catId) return;
        inserts.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++})`);
        params.push(catId, name, slug, order);
      };
      if (legal) {
        add(legal, 'VA Claims', 'va-claims', 1);
        add(legal, 'Disability Appeals', 'disability-appeals', 2);
        add(legal, 'Family Law', 'family-law', 3);
        add(legal, 'Criminal Defense', 'criminal-defense', 4);
        add(legal, 'Estate Planning', 'estate-planning', 5);
      }
      if (insurance) {
        add(insurance, 'Health Insurance', 'health-insurance', 1);
        add(insurance, 'Life Insurance', 'life-insurance', 2);
        add(insurance, 'Auto Insurance', 'auto-insurance', 3);
        add(insurance, 'Home Insurance', 'home-insurance', 4);
        add(insurance, 'Renters Insurance', 'renters-insurance', 5);
        add(insurance, 'Disability Insurance', 'disability-insurance', 6);
        add(insurance, 'Long-Term Care Insurance', 'long-term-care-insurance', 7);
        add(insurance, 'Supplemental Insurance', 'supplemental-insurance', 8);
        add(insurance, 'Medicare & VA Plans', 'medicare-va-plans', 9);
      }
      if (financial) {
        add(financial, 'Mortgages', 'mortgages', 1);
        add(financial, 'Home Loans', 'home-loans', 2);
        add(financial, 'Personal Loans', 'personal-loans', 3);
        add(financial, 'Credit Repair', 'credit-repair', 4);
        add(financial, 'Debt Relief', 'debt-relief', 5);
        add(financial, 'Budgeting & Financial Coaching', 'budgeting-financial-coaching', 6);
        add(financial, 'Banking / Lending Support', 'banking-lending-support', 7);
        add(financial, 'Refinancing', 'refinancing', 8);
      }
      if (inserts.length > 0) {
        await pgQuery(
          `INSERT INTO partner_subcategories (category_id, name, slug, display_order) VALUES ${inserts.join(', ')} ON CONFLICT (category_id, slug) DO NOTHING`,
          params
        );
        console.log(`[seed] ${inserts.length} partner subcategories seeded`);
      }
    }
    console.log("[schema] partner_subcategories table ready");
  } catch (err: any) {
    console.log("[schema] partner_subcategories error:", err.message);
  }
}

async function ensureReferralSweepstakesTables() {
  try {
    await pgQuery(`
      CREATE TABLE IF NOT EXISTS user_referrals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_user_id TEXT NOT NULL,
        referred_user_id TEXT,
        referral_code TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'qualified', 'invalid')),
        qualified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ip_address INET,
        user_agent TEXT,
        suspicion_flags JSONB NOT NULL DEFAULT '[]'::jsonb
      )
    `);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON user_referrals(referrer_user_id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_user_referrals_referred ON user_referrals(referred_user_id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON user_referrals(referral_code)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_user_referrals_status ON user_referrals(status)`);
    await pgQuery(`CREATE UNIQUE INDEX IF NOT EXISTS idx_user_referrals_referred_unique ON user_referrals(referred_user_id) WHERE referred_user_id IS NOT NULL`);

    await pgQuery(`
      CREATE TABLE IF NOT EXISTS referral_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        referral_id UUID NOT NULL REFERENCES user_referrals(id) ON DELETE CASCADE,
        entry_month TEXT NOT NULL,
        entry_count INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_referral_entries_user ON referral_entries(user_id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_referral_entries_month ON referral_entries(entry_month)`);
    await pgQuery(`CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_entries_referral_unique ON referral_entries(referral_id)`);

    await pgQuery(`
      CREATE TABLE IF NOT EXISTS sweepstakes_months (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        month TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'closed', 'archived')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        notes TEXT,
        sponsor_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_sweepstakes_months_status ON sweepstakes_months(status)`);

    await pgQuery(`
      CREATE TABLE IF NOT EXISTS sweepstakes_winners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        month TEXT NOT NULL,
        user_id TEXT NOT NULL,
        placement INTEGER NOT NULL DEFAULT 1,
        entry_count_at_draw INTEGER,
        entry_id UUID REFERENCES referral_entries(id) ON DELETE SET NULL,
        selected_by_admin_id TEXT,
        selection_method TEXT NOT NULL DEFAULT 'random'
          CHECK (selection_method IN ('random', 'manual')),
        prize_notes TEXT,
        sponsor_notes TEXT,
        notified BOOLEAN NOT NULL DEFAULT false,
        notified_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_sweepstakes_winners_month ON sweepstakes_winners(month)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_sweepstakes_winners_user ON sweepstakes_winners(user_id)`);
    await pgQuery(`ALTER TABLE sweepstakes_winners ADD COLUMN IF NOT EXISTS placement INTEGER NOT NULL DEFAULT 1`);
    await pgQuery(`ALTER TABLE sweepstakes_winners ADD COLUMN IF NOT EXISTS entry_count_at_draw INTEGER`);
    await pgQuery(`CREATE UNIQUE INDEX IF NOT EXISTS idx_sweepstakes_winners_month_placement ON sweepstakes_winners(month, placement)`);
    await pgQuery(`ALTER TABLE sweepstakes_months ADD COLUMN IF NOT EXISTS prize_title TEXT`);
    await pgQuery(`ALTER TABLE sweepstakes_months ADD COLUMN IF NOT EXISTS prize_description TEXT`);
    await pgQuery(`ALTER TABLE sweepstakes_months ADD COLUMN IF NOT EXISTS prize_value INTEGER`);
    await pgQuery(`ALTER TABLE sweepstakes_months ADD COLUMN IF NOT EXISTS prize_image_url TEXT`);
    await pgQuery(`ALTER TABLE sweepstakes_months ADD COLUMN IF NOT EXISTS rules_text TEXT`);

    await pgQuery(`
      CREATE TABLE IF NOT EXISTS user_referral_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL UNIQUE,
        referral_code TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_urp_user_id ON user_referral_profiles(user_id)`);
    await pgQuery(`CREATE INDEX IF NOT EXISTS idx_urp_referral_code ON user_referral_profiles(referral_code)`);

    await pgQuery(`ALTER TABLE referral_entries ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'referral'`);

    console.log("[schema] referral + sweepstakes tables ready");
  } catch (err: any) {
    console.log("[schema] referral + sweepstakes tables setup error:", err.message);
  }
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 7; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function ensureUserReferralCode(userId: string): Promise<string> {
  const existing = await pgQuery(
    `SELECT referral_code FROM user_referral_profiles WHERE user_id = $1`,
    [userId]
  );
  if (existing.length > 0) return existing[0].referral_code;

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateReferralCode();
    try {
      const rows = await pgQuery(
        `INSERT INTO user_referral_profiles (user_id, referral_code)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING
         RETURNING referral_code`,
        [userId, code]
      );
      if (rows.length > 0) return rows[0].referral_code;
      const recheck = await pgQuery(
        `SELECT referral_code FROM user_referral_profiles WHERE user_id = $1`,
        [userId]
      );
      if (recheck.length > 0) return recheck[0].referral_code;
    } catch (err: any) {
      if (err.code === "23505" && err.constraint?.includes("referral_code")) {
        continue;
      }
      throw err;
    }
  }
  throw new Error("Failed to generate unique referral code after 10 attempts");
}

async function qualifyReferralForUser(referredUserId: string): Promise<{ qualified: boolean; reason: string; referralId?: string; entryId?: string }> {
  const pending = await pgQuery(
    `SELECT id, referrer_user_id, referral_code
     FROM user_referrals
     WHERE referred_user_id = $1 AND status = 'pending'
     LIMIT 1`,
    [referredUserId]
  );
  if (pending.length === 0) {
    return { qualified: false, reason: "no_pending_referral" };
  }

  const referral = pending[0];

  if (referral.referrer_user_id === referredUserId) {
    await pgQuery(
      `UPDATE user_referrals SET status = 'invalid', updated_at = NOW() WHERE id = $1`,
      [referral.id]
    );
    return { qualified: false, reason: "self_referral" };
  }

  const existingEntry = await pgQuery(
    `SELECT id FROM referral_entries WHERE referral_id = $1`,
    [referral.id]
  );
  if (existingEntry.length > 0) {
    return { qualified: false, reason: "already_qualified" };
  }

  const entryMonth = await getCurrentSweepstakesMonth();

  const txResult = await pgQuery(
    `WITH updated AS (
       UPDATE user_referrals
       SET status = 'qualified', qualified_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING id, referrer_user_id
     )
     INSERT INTO referral_entries (user_id, referral_id, entry_month, entry_count, source)
     SELECT updated.referrer_user_id, updated.id, $2, 1, 'referral'
     FROM updated
     ON CONFLICT (referral_id) DO NOTHING
     RETURNING id`,
    [referral.id, entryMonth]
  );

  const entryId = txResult.length > 0 ? txResult[0].id : null;
  if (entryId) {
    console.log(`[referral] Qualified: referral=${referral.id}, referrer=${referral.referrer_user_id}, entry=${entryId}`);
    return { qualified: true, reason: "qualified", referralId: referral.id, entryId };
  }
  return { qualified: false, reason: "already_qualified" };
}

async function getCurrentSweepstakesMonth(): Promise<string> {
  const activeRows = await pgQuery(
    `SELECT month FROM sweepstakes_months WHERE status = 'active' ORDER BY month DESC LIMIT 1`
  );
  if (activeRows.length > 0) return activeRows[0].month;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function backfillNavAmbassadorId() {
  if (!hasNavAmbassadorId) return;
  try {
    const { data: rows, error } = await supabaseAdmin
      .from("navigator_requests")
      .select("id, utm_content, utm_id")
      .is("ambassador_id", null)
      .not("utm_content", "is", null);
    if (error || !rows || rows.length === 0) return;

    let backfilled = 0;
    for (const row of rows) {
      const ambId = await resolveAmbassadorId(row.utm_content || null, row.utm_id || null);
      if (ambId) {
        const { error: upErr } = await supabaseAdmin
          .from("navigator_requests")
          .update({ ambassador_id: ambId })
          .eq("id", row.id);
        if (!upErr) backfilled++;
      }
    }
    if (backfilled > 0) {
      console.log(`[schema] Backfilled ambassador_id on ${backfilled} navigator_requests`);
    }
  } catch (err: any) {
    console.log("[schema] navigator_requests ambassador_id backfill skipped:", err.message);
  }

  try {
    const { data: scNav } = await supabaseAdmin
      .from("partner_organizations")
      .select("id, name")
      .eq("name", "SC Veteran Navigator Program")
      .maybeSingle();
    if (scNav) {
      await supabaseAdmin
        .from("partner_organizations")
        .update({ name: "Veteran Care Navigator Program" })
        .eq("id", scNav.id);
      console.log(`[schema] Renamed "SC Veteran Navigator Program" → "Veteran Care Navigator Program"`);
    }
  } catch (err: any) {
    console.log("[schema] Partner rename skipped:", err.message);
  }

  try {
    const { data: internalPartners } = await supabaseAdmin
      .from("partner_organizations")
      .select("id, name, contact_email")
      .eq("is_lead_enabled", true);
    if (internalPartners) {
      let disabled = 0;
      for (const p of internalPartners) {
        const email = (p.contact_email || "").toLowerCase().trim();
        if (!email || email.endsWith("@veterancare.com") || email.endsWith(".veterancare.com")) {
          await supabaseAdmin
            .from("partner_organizations")
            .update({ is_lead_enabled: false })
            .eq("id", p.id);
          disabled++;
        }
      }
      if (disabled > 0) {
        console.log(`[schema] Disabled lead routing for ${disabled} partners with internal/missing emails`);
      }
    }
  } catch (err: any) {
    console.log("[schema] Partner email cleanup skipped:", err.message);
  }
}

async function resolveAmbassadorId(ambassadorCode: string | null, utmId?: string | null): Promise<string | null> {
  try {
    if (ambassadorCode) {
      const rows = await pgQuery(
        `SELECT id FROM ambassadors WHERE code = $1 LIMIT 1`,
        [ambassadorCode]
      );
      if (rows.length > 0) return rows[0].id;
    }
    if (utmId) {
      const rows = await pgQuery(
        `SELECT ambassador_id FROM ambassador_links WHERE utm_id = $1 AND ambassador_id IS NOT NULL LIMIT 1`,
        [utmId]
      );
      if (rows.length > 0) return rows[0].ambassador_id;
    }
    return null;
  } catch {
    return null;
  }
}

async function checkTrustedServicesTable() {
  try {
    const rows = await pgQuery(`SELECT id FROM trusted_service_categories LIMIT 1`);
    hasTrustedServicesTable = true;
    console.log(`[schema] trusted_service_categories table detected via pg (${rows.length} rows)`);
    await seedTrustedServiceCategoriesIfEmpty();
    await pgQuery(`
      UPDATE trusted_services SET category_id = (SELECT id FROM trusted_service_categories WHERE slug = 'discount-financial' LIMIT 1)
      WHERE category_id = (SELECT id FROM trusted_service_categories WHERE slug = 'discount-mortgage' LIMIT 1)
    `).then(
      () => console.log("[migration] Migrated discount-mortgage services to discount-financial"),
      (e: any) => console.log("[migration] discount-mortgage migration skipped:", e.message)
    );
    await pgQuery(`UPDATE lead_category_pricing SET category_name = 'Financial Services' WHERE category_slug = 'financial-credit' AND category_name = 'Mortgage / Lending'`).catch(() => {});
    const mergeDiscountIntoMain = async (discountSlug: string, mainSlug: string) => {
      try {
        const mainCat = await pgQuery(`SELECT id FROM trusted_service_categories WHERE slug = $1 LIMIT 1`, [mainSlug]);
        const discCat = await pgQuery(`SELECT id FROM trusted_service_categories WHERE slug = $1 LIMIT 1`, [discountSlug]);
        if (mainCat.length > 0 && discCat.length > 0) {
          await pgQuery(`UPDATE trusted_services SET category_id = $1 WHERE category_id = $2`, [mainCat[0].id, discCat[0].id]);
          await pgQuery(`UPDATE trusted_service_categories SET is_active = false WHERE slug = $1`, [discountSlug]);
          console.log(`[migration] Merged ${discountSlug} → ${mainSlug}`);
        }
      } catch (e: any) { console.log(`[migration] merge ${discountSlug} skipped: ${e.message}`); }
    };
    await mergeDiscountIntoMain('discount-legal', 'legal-services');
    await mergeDiscountIntoMain('discount-insurance', 'insurance');
    await mergeDiscountIntoMain('discount-healthcare', 'insurance');
    await mergeDiscountIntoMain('discount-financial', 'financial-credit');
    await mergeDiscountIntoMain('discount-auto', 'auto-services');
    await mergeDiscountIntoMain('discount-travel', 'travel-services');
    await mergeDiscountIntoMain('discount-restaurants', 'restaurants');
    await mergeDiscountIntoMain('discount-retail', 'retail-discounts');
    await mergeDiscountIntoMain('discount-hotels', 'hotels');
    await mergeDiscountIntoMain('discount-car-dealers', 'car-dealerships');
    await mergeDiscountIntoMain('discount-gyms', 'gyms-fitness');
    await mergeDiscountIntoMain('discount-local', 'local-businesses');
    try {
      const financialCat = await pgQuery(`SELECT id FROM trusted_service_categories WHERE slug = 'financial-credit' LIMIT 1`);
      if (financialCat.length > 0) {
        const fId = financialCat[0].id;
        await pgQuery(`
          INSERT INTO partner_subcategories (category_id, name, slug, display_order) VALUES
            ($1, 'Mortgages', 'mortgages', 1),
            ($1, 'Home Loans', 'home-loans', 2),
            ($1, 'Personal Loans', 'personal-loans', 3),
            ($1, 'Credit Repair', 'credit-repair', 4),
            ($1, 'Debt Relief', 'debt-relief', 5),
            ($1, 'Budgeting & Financial Coaching', 'budgeting-financial-coaching', 6),
            ($1, 'Banking / Lending Support', 'banking-lending-support', 7),
            ($1, 'Refinancing', 'refinancing', 8)
          ON CONFLICT (category_id, slug) DO NOTHING
        `, [fId]);
        console.log("[migration] Ensured financial-credit subcategories include mortgage/loan types");
      }
    } catch (e: any) {
      console.log("[migration] financial subcategories expansion skipped:", e.message);
    }
    await pgQuery(`UPDATE trusted_service_categories SET is_active = false WHERE slug = 'discount-mortgage' AND is_active = true`).then(
      () => console.log("[migration] Deactivated discount-mortgage category"),
      (e: any) => console.log("[migration] discount-mortgage deactivation skipped:", e.message)
    );
    await pgQuery(`UPDATE trusted_service_categories SET is_active = false WHERE slug IN ('benefits-assistance', 'wellness-recovery', 'disabled-veterans') AND is_active = true`).then(
      () => console.log("[migration] Deactivated non-monetizable categories from Trusted Services"),
      (e: any) => console.log("[migration] trusted_service_categories cleanup skipped:", e.message)
    );
    const svcCount = await pgQuery(`SELECT count(*) as cnt FROM trusted_services`);
    console.log(`[schema] trusted_services count: ${svcCount[0]?.cnt}`);
    try {
      await pgQuery(`SELECT is_national FROM trusted_services LIMIT 0`);
    } catch {
      await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS is_national BOOLEAN DEFAULT false`);
      console.log("[schema] Added is_national column to trusted_services");
    }
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS program_area TEXT DEFAULT 'trusted_services'`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'service'`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'lead'`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS featured_rank INTEGER`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS discount_value TEXT`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS discount_description TEXT`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS offer_title TEXT`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS offer_description TEXT`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS banner_image_url TEXT`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS offer_expiry DATE`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS geo_source TEXT`);
    await pgQuery(`ALTER TABLE trusted_service_categories ADD COLUMN IF NOT EXISTS program_area TEXT DEFAULT 'trusted_services'`);
    await pgQuery(`ALTER TABLE trusted_service_categories ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'service'`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS featured_active BOOLEAN DEFAULT false`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS near_me_boost_active BOOLEAN DEFAULT false`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS sponsored_top_active BOOLEAN DEFAULT false`);
    await pgQuery(`ALTER TABLE trusted_services ADD COLUMN IF NOT EXISTS sponsored_inline_active BOOLEAN DEFAULT false`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS subscription_status TEXT`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS base_plan_type TEXT`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS featured_active BOOLEAN DEFAULT false`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS near_me_boost_active BOOLEAN DEFAULT false`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS sponsored_top_active BOOLEAN DEFAULT false`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS sponsored_inline_active BOOLEAN DEFAULT false`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS billing_active BOOLEAN DEFAULT false`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS requested_addons TEXT`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS grace_period_end TIMESTAMPTZ`);
    await pgQuery(`ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS grace_warning_sent BOOLEAN DEFAULT false`);
    console.log("[schema] veteran_discount_services columns + geo columns + billing add-on columns ensured");
    await seedDiscountCategories();
    await ensureVobTable();
  } catch (err: any) {
    if (err.message?.includes("does not exist")) {
      hasTrustedServicesTable = false;
      console.log("[schema] trusted_service_categories table not found. Run supabase/create_trusted_services.sql");
    } else {
      hasTrustedServicesTable = true;
      console.log("[schema] trusted_service_categories check error (assuming exists):", err.message);
    }
  }
}

async function ensureVobTable() {
  try {
    await pgQuery(`SELECT id FROM veteran_owned_businesses LIMIT 0`);
    console.log("[schema] veteran_owned_businesses table exists");
    try {
      await pgQuery(`SELECT show_in_trusted_services FROM veteran_owned_businesses LIMIT 0`);
    } catch {
      await pgQuery(`ALTER TABLE veteran_owned_businesses ADD COLUMN IF NOT EXISTS show_in_trusted_services BOOLEAN DEFAULT false`);
      console.log("[schema] Added show_in_trusted_services column to veteran_owned_businesses");
    }
  } catch {
    await pgQuery(`
      CREATE TABLE veteran_owned_businesses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        website TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip TEXT,
        description TEXT,
        category_id UUID REFERENCES trusted_service_categories(id),
        subcategory TEXT,
        is_veteran_owned BOOLEAN DEFAULT true,
        is_nonprofit BOOLEAN DEFAULT false,
        logo_url TEXT,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        show_in_trusted_services BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now(),
        reviewed_at TIMESTAMPTZ
      )
    `);
    console.log("[schema] Created veteran_owned_businesses table");
  }
}

async function seedTrustedServiceCategoriesIfEmpty() {
  try {
    const rows = await pgQuery(`SELECT id FROM trusted_service_categories LIMIT 1`);
    if (rows.length === 0) {
      console.log("[seed] trusted_service_categories is empty — seeding default categories...");
      await pgQuery(`
        INSERT INTO trusted_service_categories (name, slug, description, icon, display_order, is_active) VALUES
          ('Housing & Home Services', 'housing-home', 'Trusted housing, moving, and home services for veterans and families', 'home', 1, true),
          ('Legal Services', 'legal-services', 'Vetted legal professionals experienced with veteran-specific needs', 'scale', 2, true),
          ('Financial & Credit Services', 'financial-credit', 'Trusted financial advisors, credit counseling, and lending partners', 'dollar-sign', 3, true),
          ('Insurance Services', 'insurance', 'Insurance providers offering veteran-friendly coverage options', 'shield', 4, true),
          ('Education & Training', 'education-training', 'Accredited programs and training providers supporting veteran success', 'graduation-cap', 5, true),
          ('Employment Support', 'employment-support', 'Employers and staffing partners committed to hiring veterans', 'briefcase', 6, true)
        ON CONFLICT (slug) DO UPDATE SET is_active = true
      `);
      console.log("[seed] 6 trusted service categories seeded successfully");
    }
    await ensureDefaultServices();
    await repairOrphanedServices();
  } catch (err: any) {
    console.log("[seed] Failed to seed trusted_service_categories:", err.message);
  }
}

async function seedDiscountCategories() {
  // DEPRECATED: discount-* categories are now merged into clean slugs by ensureAllTrustedServiceCategories.
  // This function is intentionally a no-op to prevent recreating duplicate categories.
}

async function ensureDefaultServices() {
  try {
    const existing = await pgQuery(`SELECT id FROM trusted_services LIMIT 1`);
    if (existing.length > 0) return;

    const cats = await pgQuery(`SELECT id, slug FROM trusted_service_categories`);
    const catBySlug: Record<string, string> = {};
    cats.forEach((c: any) => { catBySlug[c.slug] = c.id; });

    const eduCatId = catBySlug["education-training"];
    if (!eduCatId) return;

    console.log("[seed] trusted_services is empty — seeding default provider...");
    await pgQuery(`
      INSERT INTO trusted_services (name, short_description, email, phone, website_url, city, state, category_id, is_active, is_featured, verification_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false, 'verified')
      ON CONFLICT DO NOTHING
    `, [
      "Second Chance Job Center (4)",
      "Comprehensive employment services including job placement, resume building, interview prep, and career counseling for veterans and transitioning service members.",
      "info@secondchancejobcenter.com",
      "(843) 469-7000",
      "https://secondchancejobcenter.com",
      "Mount Pleasant",
      "SC",
      eduCatId
    ]);
    console.log("[seed] Default provider seeded successfully");
  } catch (err: any) {
    console.log("[seed] Failed to seed default services:", err.message);
  }
}

async function repairOrphanedServices() {
  try {
    const catMap = await pgQuery(`SELECT id, slug, name FROM trusted_service_categories`);
    const catBySlug: Record<string, string> = {};
    catMap.forEach((c: any) => { catBySlug[c.slug] = c.id; });

    const orphaned = await pgQuery(`
      SELECT ts.id, ts.name, ts.category_id
      FROM trusted_services ts
      LEFT JOIN trusted_service_categories tsc ON ts.category_id = tsc.id
      WHERE ts.category_id IS NOT NULL AND tsc.id IS NULL
    `);
    if (orphaned.length === 0) return;
    console.log(`[seed] Found ${orphaned.length} orphaned service(s) with mismatched category_id — repairing...`);

    const slugKeywords: [string, string[]][] = [
      ["education-training", ["education", "training", "job", "school"]],
      ["employment-support", ["employ", "career", "staffing", "workforce"]],
      ["housing-home", ["hous", "home", "moving", "real estate"]],
      ["legal-services", ["legal", "law", "attorney"]],
      ["financial-credit", ["financ", "credit", "loan", "bank"]],
      ["insurance", ["insurance", "insur"]],
      ["benefits-assistance", ["benefit", "va ", "claims"]],
      ["wellness-recovery", ["wellness", "recovery", "health", "mental", "substance"]],
    ];

    for (const svc of orphaned) {
      const nameLC = (svc.name || "").toLowerCase();
      let matched = false;
      for (const [slug, keywords] of slugKeywords) {
        if (keywords.some(kw => nameLC.includes(kw)) && catBySlug[slug]) {
          await pgQuery(`UPDATE trusted_services SET category_id = $1 WHERE id = $2`, [catBySlug[slug], svc.id]);
          console.log(`[seed] Repaired service "${svc.name}" → "${slug}"`);
          matched = true;
          break;
        }
      }
      if (!matched) {
        const fallback = catBySlug["education-training"] || catMap[0]?.id;
        if (fallback) {
          await pgQuery(`UPDATE trusted_services SET category_id = $1 WHERE id = $2`, [fallback, svc.id]);
          console.log(`[seed] Repaired service "${svc.name}" → fallback category`);
        }
      }
    }
  } catch (err: any) {
    console.log("[seed] Failed to repair orphaned services:", err.message);
  }
}

async function alignCategoryNames() {
  const RENAMES: Record<string, string> = {
    "crisis-help": "Crisis Help",
    "mental-health": "Mental Health",
    "disabled-veterans": "Disabled Veterans",
    "housing": "Housing & Home Services",
    "food-assistance": "Food Assistance",
    "va-benefits": "Benefits Assistance",
    "family-support": "Family Support",
    "community-support": "Community Support",
    "employment": "Employment Support",
    "education": "Education & Training",
    "transportation": "Transportation",
    "financial": "Financial & Credit Services",
    "legal": "Legal Services",
    "healthcare": "Healthcare",
    "substance-recovery": "Wellness & Recovery",
    "end-of-life-services": "End of Life Services",
  };
  try {
    const { data: cats } = await supabaseAdmin.from("categories").select("id, name, slug");
    if (!cats) return;
    let updated = 0;
    for (const cat of cats) {
      const newName = RENAMES[cat.slug];
      if (newName && cat.name !== newName) {
        await supabaseAdmin.from("categories").update({ name: newName }).eq("id", cat.id);
        updated++;
      }
    }
    if (updated > 0) {
      console.log(`[categories] Renamed ${updated} resource categories to match Trusted Service names`);
    }
  } catch (err: any) {
    console.log("[categories] Failed to align category names:", err.message);
  }
}

async function ensureAllTrustedServiceCategories() {
  const activeTrusted = [
    { name: 'Housing & Home Services', slug: 'housing-home', description: 'Trusted housing, moving, and home services for veterans and families', icon: 'home', display_order: 1 },
    { name: 'Legal Services', slug: 'legal-services', description: 'Vetted legal professionals experienced with veteran-specific needs', icon: 'scale', display_order: 2 },
    { name: 'Financial & Credit Services', slug: 'financial-credit', description: 'Trusted financial advisors, credit counseling, and lending partners', icon: 'dollar-sign', display_order: 3 },
    { name: 'Insurance Services', slug: 'insurance', description: 'Insurance providers offering veteran-friendly coverage options', icon: 'shield', display_order: 4 },
    { name: 'Education & Training', slug: 'education-training', description: 'Accredited programs and training providers supporting veteran success', icon: 'graduation-cap', display_order: 5 },
    { name: 'Employment Support', slug: 'employment-support', description: 'Employers and staffing partners committed to hiring veterans', icon: 'briefcase', display_order: 6 },
    { name: 'End of Life Services', slug: 'end-of-life-services', description: 'Hospice, funeral services, estate planning, and survivor benefits', icon: 'flower-2', display_order: 7 },
    { name: 'Auto Services', slug: 'auto-services', description: 'Trusted auto repair, sales, and vehicle services for veterans', icon: 'car', display_order: 8 },
    { name: 'Travel Services', slug: 'travel-services', description: 'Veteran-friendly travel, lodging, and recreation services', icon: 'plane', display_order: 9 },
  ];
  const partnerSignupOnly = [
    { name: 'Benefits Assistance', slug: 'benefits-assistance', description: 'Claims assistance, VSO support, and benefits navigation for veterans', icon: 'file-text', display_order: 20 },
    { name: 'Wellness & Recovery', slug: 'wellness-recovery', description: 'Wellness programs, substance recovery, and holistic support', icon: 'heart', display_order: 21 },
    { name: 'Healthcare', slug: 'healthcare-services', description: 'Healthcare providers and medical support for veterans', icon: 'heart-pulse', display_order: 22 },
  ];
  const productsLocalOffers = [
    { name: 'Restaurants', slug: 'restaurants', description: 'Restaurants offering veteran discounts and specials', icon: 'utensils', display_order: 30, program_area: 'veteran_discount_services' },
    { name: 'Retail Discounts', slug: 'retail-discounts', description: 'Retail stores with veteran discount programs', icon: 'shopping-bag', display_order: 31, program_area: 'veteran_discount_services' },
    { name: 'Hotels', slug: 'hotels', description: 'Hotels and lodging with veteran rates and military discounts', icon: 'bed', display_order: 32, program_area: 'veteran_discount_services' },
    { name: 'Car Dealerships', slug: 'car-dealerships', description: 'Car dealerships offering veteran pricing and military discounts', icon: 'car', display_order: 33, program_area: 'veteran_discount_services' },
    { name: 'Gyms & Fitness', slug: 'gyms-fitness', description: 'Gyms and fitness centers with veteran memberships and discounts', icon: 'dumbbell', display_order: 34, program_area: 'veteran_discount_services' },
    { name: 'Local Businesses', slug: 'local-businesses', description: 'Local businesses supporting veterans with special offers', icon: 'store', display_order: 35, program_area: 'veteran_discount_services' },
  ];
  try {
    for (const cat of activeTrusted) {
      await pgQuery(
        `INSERT INTO trusted_service_categories (name, slug, description, icon, display_order, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (slug) DO UPDATE SET name = $1, display_order = $5, is_active = true`,
        [cat.name, cat.slug, cat.description, cat.icon, cat.display_order]
      );
    }
    for (const cat of partnerSignupOnly) {
      await pgQuery(
        `INSERT INTO trusted_service_categories (name, slug, description, icon, display_order, is_active)
         VALUES ($1, $2, $3, $4, $5, false)
         ON CONFLICT (slug) DO UPDATE SET name = $1, display_order = $5, is_active = false`,
        [cat.name, cat.slug, cat.description, cat.icon, cat.display_order]
      );
    }
    for (const cat of productsLocalOffers) {
      await pgQuery(
        `INSERT INTO trusted_service_categories (name, slug, description, icon, display_order, is_active, program_area, group_type)
         VALUES ($1, $2, $3, $4, $5, true, $6, 'product')
         ON CONFLICT (slug) DO UPDATE SET name = $1, display_order = $5, is_active = true, program_area = $6, group_type = 'product'`,
        [cat.name, cat.slug, cat.description, cat.icon, cat.display_order, cat.program_area]
      );
    }
  } catch (err: any) {
    console.log("[seed] ensureAllTrustedServiceCategories error:", err.message);
  }
}

async function ensureAllPartnerSubcategories() {
  try {
    const catMap = await pgQuery(`SELECT id, slug FROM trusted_service_categories WHERE slug NOT LIKE 'discount-%'`);
    const findCat = (slug: string) => catMap.find((c: any) => c.slug === slug)?.id;

    const subcats: { catSlug: string; name: string; slug: string; order: number }[] = [
      { catSlug: 'housing-home', name: 'Emergency Housing & Shelters', slug: 'emergency-housing', order: 1 },
      { catSlug: 'housing-home', name: 'Rental Assistance', slug: 'rental-assistance', order: 2 },
      { catSlug: 'housing-home', name: 'VA Home Loans', slug: 'va-home-loans', order: 3 },
      { catSlug: 'housing-home', name: 'Home Ownership', slug: 'home-ownership', order: 4 },
      { catSlug: 'housing-home', name: 'Accessibility Modifications', slug: 'accessibility-modifications', order: 5 },
      { catSlug: 'housing-home', name: 'Moving & Relocation', slug: 'moving-relocation', order: 6 },

      { catSlug: 'employment-support', name: 'Job Search & Placement', slug: 'job-search-placement', order: 1 },
      { catSlug: 'employment-support', name: 'Resume & Interview Prep', slug: 'resume-interview-prep', order: 2 },
      { catSlug: 'employment-support', name: 'Career Training & Certifications', slug: 'career-training', order: 3 },
      { catSlug: 'employment-support', name: 'Entrepreneurship & Business', slug: 'entrepreneurship-business', order: 4 },
      { catSlug: 'employment-support', name: 'Federal Employment (USAJOBS)', slug: 'federal-employment', order: 5 },

      { catSlug: 'education-training', name: 'GI Bill & Tuition Assistance', slug: 'gi-bill-tuition', order: 1 },
      { catSlug: 'education-training', name: 'Trade Schools & Vocational', slug: 'trade-schools', order: 2 },
      { catSlug: 'education-training', name: 'Certifications & Licensing', slug: 'certifications-licensing', order: 3 },
      { catSlug: 'education-training', name: 'College & University Programs', slug: 'college-university', order: 4 },
      { catSlug: 'education-training', name: 'Online Learning', slug: 'online-learning', order: 5 },

      { catSlug: 'end-of-life-services', name: 'Hospice & Palliative Care', slug: 'hospice-palliative', order: 1 },
      { catSlug: 'end-of-life-services', name: 'Funeral & Burial Services', slug: 'funeral-burial', order: 2 },
      { catSlug: 'end-of-life-services', name: 'Estate Planning', slug: 'estate-planning-eol', order: 3 },
      { catSlug: 'end-of-life-services', name: 'Survivor Benefits', slug: 'survivor-benefits-eol', order: 4 },
      { catSlug: 'end-of-life-services', name: 'Grief & Bereavement Support', slug: 'grief-bereavement', order: 5 },

      { catSlug: 'benefits-assistance', name: 'Military Records & DD214', slug: 'military-records', order: 1 },
      { catSlug: 'benefits-assistance', name: 'Disability Claims & Filing', slug: 'disability-claims', order: 2 },
      { catSlug: 'benefits-assistance', name: 'Disability Increase', slug: 'disability-increase', order: 3 },
      { catSlug: 'benefits-assistance', name: 'Appeals & Denials', slug: 'appeals-denials', order: 4 },
      { catSlug: 'benefits-assistance', name: 'C&P Exam Prep', slug: 'cp-exam-prep', order: 5 },
      { catSlug: 'benefits-assistance', name: 'VSO & Claims Assistance', slug: 'vso-claims', order: 6 },

      { catSlug: 'wellness-recovery', name: 'Substance Abuse Treatment', slug: 'substance-abuse', order: 1 },
      { catSlug: 'wellness-recovery', name: 'Mental Health & Counseling', slug: 'mental-health-counseling', order: 2 },
      { catSlug: 'wellness-recovery', name: 'Holistic & Alternative Therapy', slug: 'holistic-therapy', order: 3 },
      { catSlug: 'wellness-recovery', name: 'Fitness & Physical Wellness', slug: 'fitness-physical', order: 4 },
      { catSlug: 'wellness-recovery', name: 'Peer Support Groups', slug: 'peer-support', order: 5 },

      { catSlug: 'legal-services', name: 'Family Law', slug: 'family-law', order: 1 },
      { catSlug: 'legal-services', name: 'Disability & VA Appeals', slug: 'disability-va-appeals', order: 2 },
      { catSlug: 'legal-services', name: 'Criminal Defense', slug: 'criminal-defense', order: 3 },
      { catSlug: 'legal-services', name: 'Estate Planning & Wills', slug: 'estate-planning-legal', order: 4 },
      { catSlug: 'legal-services', name: 'Employment Law', slug: 'employment-law', order: 5 },

      { catSlug: 'financial-credit', name: 'Credit Repair & Counseling', slug: 'credit-repair', order: 1 },
      { catSlug: 'financial-credit', name: 'Debt Management', slug: 'debt-management', order: 2 },
      { catSlug: 'financial-credit', name: 'Financial Planning & Investing', slug: 'financial-planning', order: 3 },
      { catSlug: 'financial-credit', name: 'Tax Preparation', slug: 'tax-preparation', order: 4 },
      { catSlug: 'financial-credit', name: 'Mortgage & Home Loans', slug: 'mortgage-home-loans', order: 5 },
      { catSlug: 'financial-credit', name: 'Personal & Auto Loans', slug: 'personal-auto-loans', order: 6 },

      { catSlug: 'insurance', name: 'Health Insurance', slug: 'health-insurance', order: 1 },
      { catSlug: 'insurance', name: 'Life Insurance', slug: 'life-insurance', order: 2 },
      { catSlug: 'insurance', name: 'Auto Insurance', slug: 'auto-insurance', order: 3 },
      { catSlug: 'insurance', name: 'Home Insurance', slug: 'home-insurance', order: 4 },
      { catSlug: 'insurance', name: 'Renters Insurance', slug: 'renters-insurance', order: 5 },
      { catSlug: 'insurance', name: 'Disability Insurance', slug: 'disability-insurance', order: 6 },
      { catSlug: 'insurance', name: 'Long-Term Care Insurance', slug: 'long-term-care-insurance', order: 7 },
      { catSlug: 'insurance', name: 'Supplemental Insurance', slug: 'supplemental-insurance', order: 8 },
      { catSlug: 'insurance', name: 'Medicare & VA Plans', slug: 'medicare-va-plans', order: 9 },

      { catSlug: 'auto-services', name: 'Auto Repair & Maintenance', slug: 'auto-repair', order: 1 },
      { catSlug: 'auto-services', name: 'Auto Sales & Dealerships', slug: 'auto-sales', order: 2 },
      { catSlug: 'auto-services', name: 'Auto Insurance', slug: 'auto-insurance-svc', order: 3 },
      { catSlug: 'auto-services', name: 'Roadside Assistance', slug: 'roadside-assistance', order: 4 },

      { catSlug: 'travel-services', name: 'Hotels & Lodging', slug: 'hotels-lodging', order: 1 },
      { catSlug: 'travel-services', name: 'Vacation & Recreation', slug: 'vacation-recreation', order: 2 },
      { catSlug: 'travel-services', name: 'Airlines & Transportation', slug: 'airlines-transportation', order: 3 },
      { catSlug: 'travel-services', name: 'Retreats & Wellness Travel', slug: 'retreats-wellness', order: 4 },

      { catSlug: 'restaurants', name: 'Fast Food & Quick Service', slug: 'fast-food', order: 1 },
      { catSlug: 'restaurants', name: 'Casual Dining', slug: 'casual-dining', order: 2 },
      { catSlug: 'restaurants', name: 'Fine Dining', slug: 'fine-dining', order: 3 },
      { catSlug: 'restaurants', name: 'Bars & Breweries', slug: 'bars-breweries', order: 4 },

      { catSlug: 'retail-discounts', name: 'Clothing & Apparel', slug: 'clothing-apparel', order: 1 },
      { catSlug: 'retail-discounts', name: 'Electronics & Tech', slug: 'electronics-tech', order: 2 },
      { catSlug: 'retail-discounts', name: 'Home & Garden', slug: 'home-garden', order: 3 },
      { catSlug: 'retail-discounts', name: 'Grocery & Essentials', slug: 'grocery-essentials', order: 4 },

      { catSlug: 'hotels', name: 'Budget Hotels', slug: 'budget-hotels', order: 1 },
      { catSlug: 'hotels', name: 'Mid-Range Hotels', slug: 'mid-range-hotels', order: 2 },
      { catSlug: 'hotels', name: 'Luxury & Resorts', slug: 'luxury-resorts', order: 3 },
      { catSlug: 'hotels', name: 'Extended Stay', slug: 'extended-stay', order: 4 },

      { catSlug: 'car-dealerships', name: 'New Vehicles', slug: 'new-vehicles', order: 1 },
      { catSlug: 'car-dealerships', name: 'Used & Certified Pre-Owned', slug: 'used-certified', order: 2 },
      { catSlug: 'car-dealerships', name: 'Military Auto Programs', slug: 'military-auto-programs', order: 3 },

      { catSlug: 'gyms-fitness', name: 'Gym Memberships', slug: 'gym-memberships', order: 1 },
      { catSlug: 'gyms-fitness', name: 'Personal Training', slug: 'personal-training', order: 2 },
      { catSlug: 'gyms-fitness', name: 'Group Classes & Studios', slug: 'group-classes', order: 3 },
      { catSlug: 'gyms-fitness', name: 'Outdoor & Adventure', slug: 'outdoor-adventure', order: 4 },

      { catSlug: 'local-businesses', name: 'Home Services', slug: 'local-home-services', order: 1 },
      { catSlug: 'local-businesses', name: 'Professional Services', slug: 'local-professional', order: 2 },
      { catSlug: 'local-businesses', name: 'Pet Services', slug: 'pet-services', order: 3 },
      { catSlug: 'local-businesses', name: 'Entertainment & Events', slug: 'entertainment-events', order: 4 },

      { catSlug: 'healthcare-services', name: 'Primary Care', slug: 'primary-care-ts', order: 1 },
      { catSlug: 'healthcare-services', name: 'Dental Care', slug: 'dental-care-ts', order: 2 },
      { catSlug: 'healthcare-services', name: 'Vision & Eye Care', slug: 'vision-care-ts', order: 3 },
      { catSlug: 'healthcare-services', name: 'Specialty Care', slug: 'specialty-care-ts', order: 4 },
      { catSlug: 'healthcare-services', name: 'Pharmacy & Prescriptions', slug: 'pharmacy-ts', order: 5 },
    ];

    let added = 0;
    for (const sc of subcats) {
      const catId = findCat(sc.catSlug);
      if (!catId) continue;
      await pgQuery(
        `INSERT INTO partner_subcategories (category_id, name, slug, display_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (category_id, slug) DO NOTHING`,
        [catId, sc.name, sc.slug, sc.order]
      );
      added++;
    }
    if (added > 0) {
      console.log(`[seed] Ensured ${added} partner subcategories across all categories`);
    }
    await pgQuery(
      `UPDATE partner_subcategories SET is_active = false WHERE slug = 'home-renters-insurance'`
    ).catch(() => {});
  } catch (err: any) {
    console.log("[seed] ensureAllPartnerSubcategories error:", err.message);
  }
}

async function ensureEndOfLifeCategory() {
  try {
    const { data } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("slug", "end-of-life-services")
      .maybeSingle();
    if (!data) {
      const { error } = await supabaseAdmin
        .from("categories")
        .insert({ name: "End of Life Services", slug: "end-of-life-services" });
      if (error) {
        console.log("[seed] Failed to insert End of Life Services category:", error.message);
      } else {
        console.log("[seed] Created End of Life Services category");
      }
    }
  } catch (err: any) {
    console.log("[seed] ensureEndOfLifeCategory error:", err.message);
  }

  try {
    const existing = await pgQuery(
      `SELECT id FROM trusted_service_categories WHERE slug = 'end-of-life-services' LIMIT 1`
    );
    if (existing.length === 0) {
      await pgQuery(`
        INSERT INTO trusted_service_categories (name, slug, description, icon, display_order, is_active)
        VALUES ('End of Life Services', 'end-of-life-services', 'Hospice, funeral services, estate planning, and survivor benefits for veterans and families', 'flower-2', 9, true)
        ON CONFLICT (slug) DO UPDATE SET is_active = true
      `);
      console.log("[seed] Added End of Life Services to trusted_service_categories");
    }
  } catch (err: any) {
    console.log("[seed] trusted_service_categories EOL insert skipped:", err.message);
  }
}

async function ensureDisabledVeteransCategory() {
  try {
    const { data } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("slug", "disabled-veterans")
      .maybeSingle();
    if (!data) {
      const { error } = await supabaseAdmin
        .from("categories")
        .insert({ name: "Disabled Veterans", slug: "disabled-veterans" });
      if (error) {
        console.log("[seed] Failed to insert Disabled Veterans category:", error.message);
      } else {
        console.log("[seed] Created Disabled Veterans category");
      }
    }
  } catch (err: any) {
    console.log("[seed] ensureDisabledVeteransCategory error:", err.message);
  }

  try {
    await pgQuery(
      `UPDATE trusted_service_categories SET is_active = false WHERE slug = 'disabled-veterans'`
    );
  } catch (err: any) {
    console.log("[seed] trusted_service_categories disabled-veterans deactivation skipped:", err.message);
  }
}

async function seedDisabledVeteransResources() {
  try {
    const { data: cat } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("slug", "disabled-veterans")
      .maybeSingle();
    if (!cat) return;

    const { data: existingResources } = await supabaseAdmin
      .from("resources")
      .select("id, title, status, subcategory")
      .eq("category_id", cat.id);

    const needsApproval = (existingResources || []).filter(r => r.status !== "approved");
    if (needsApproval.length > 0) {
      await supabaseAdmin.from("resources").update({ status: "approved" }).eq("category_id", cat.id);
      console.log(`[seed] Updated ${needsApproval.length} Disabled Veterans resources to approved status`);
    }
    for (const r of (existingResources || [])) {
      await supabaseAdmin.from("resource_categories").upsert({ resource_id: r.id, category_id: cat.id }, { onConflict: "resource_id,category_id" });
    }

    const DV_SUBCATEGORIES = [
      { name: "Disability Benefits & Claims", slug: "disability-benefits-claims" },
      { name: "Accessible Housing & Home Modifications", slug: "accessible-housing-home-modifications" },
      { name: "Adaptive Transportation & Mobility", slug: "adaptive-transportation-mobility" },
      { name: "Healthcare & Rehabilitation", slug: "healthcare-rehabilitation" },
      { name: "Mental Health & PTSD Support", slug: "mental-health-ptsd-support" },
      { name: "Employment & Vocational Rehabilitation", slug: "employment-vocational-rehabilitation" },
      { name: "Caregiver & Family Support", slug: "caregiver-family-support" },
      { name: "Legal Advocacy & Rights", slug: "legal-advocacy-rights" },
      { name: "Independent Living & Daily Support", slug: "independent-living-daily-support" },
      { name: "Adaptive Equipment & Assistive Technology", slug: "adaptive-equipment-assistive-technology" },
    ];

    const { data: existingSubs } = await supabaseAdmin
      .from("subcategories")
      .select("id, slug")
      .eq("category_id", cat.id);
    const existingSlugs = new Set((existingSubs || []).map(s => s.slug));
    const newSubs = DV_SUBCATEGORIES.filter(s => !existingSlugs.has(s.slug));
    if (newSubs.length > 0) {
      const { error: subErr } = await supabaseAdmin.from("subcategories").insert(
        newSubs.map(s => ({ name: s.name, slug: s.slug, category_id: cat.id }))
      );
      if (subErr) console.log("[seed] Disabled Veterans subcategory insert error:", subErr.message);
      else console.log(`[seed] Created ${newSubs.length} Disabled Veterans subcategories`);
    }

    const { data: allSubs } = await supabaseAdmin
      .from("subcategories")
      .select("id, slug")
      .eq("category_id", cat.id);
    const subMap: Record<string, string> = {};
    for (const s of (allSubs || [])) subMap[s.slug] = s.id;

    const { data: allCats } = await supabaseAdmin.from("categories").select("id, slug");
    const catSlugToId: Record<string, string> = {};
    for (const c of (allCats || [])) catSlugToId[c.slug] = c.id;

    const RESOURCE_TAGGING: Record<string, { subcategorySlugs: string[]; crossCategorySlugs: string[] }> = {
      "SC Department of Veterans' Affairs": { subcategorySlugs: ["disability-benefits-claims"], crossCategorySlugs: ["va-benefits"] },
      "Disabled American Veterans (DAV)": { subcategorySlugs: ["disability-benefits-claims", "adaptive-transportation-mobility"], crossCategorySlugs: ["va-benefits", "transportation"] },
      "Paralyzed Veterans of America": { subcategorySlugs: ["healthcare-rehabilitation", "adaptive-equipment-assistive-technology", "accessible-housing-home-modifications"], crossCategorySlugs: ["healthcare"] },
      "VA Disability Compensation": { subcategorySlugs: ["disability-benefits-claims"], crossCategorySlugs: ["va-benefits"] },
      "SC Vocational Rehabilitation": { subcategorySlugs: ["employment-vocational-rehabilitation"], crossCategorySlugs: ["employment"] },
      "Adaptive Sports": { subcategorySlugs: ["healthcare-rehabilitation"], crossCategorySlugs: ["healthcare"] },
      "Specially Adapted Housing": { subcategorySlugs: ["accessible-housing-home-modifications"], crossCategorySlugs: ["housing"] },
      "Automobile Allowance": { subcategorySlugs: ["adaptive-transportation-mobility", "adaptive-equipment-assistive-technology"], crossCategorySlugs: ["transportation"] },
      "Property Tax Exemption": { subcategorySlugs: ["disability-benefits-claims"], crossCategorySlugs: ["financial"] },
      "Blinded Veterans Association": { subcategorySlugs: ["healthcare-rehabilitation", "adaptive-equipment-assistive-technology"], crossCategorySlugs: ["healthcare"] },
      "SC Commission for the Blind": { subcategorySlugs: ["employment-vocational-rehabilitation", "independent-living-daily-support", "adaptive-equipment-assistive-technology"], crossCategorySlugs: ["employment"] },
      "Wounded Warrior Project": { subcategorySlugs: ["mental-health-ptsd-support", "employment-vocational-rehabilitation", "caregiver-family-support"], crossCategorySlugs: ["mental-health", "employment"] },
      "Aid & Attendance": { subcategorySlugs: ["disability-benefits-claims", "independent-living-daily-support"], crossCategorySlugs: ["va-benefits"] },
      "Protection & Advocacy": { subcategorySlugs: ["legal-advocacy-rights"], crossCategorySlugs: ["legal"] },
      "Disabled Veterans Outreach Program": { subcategorySlugs: ["employment-vocational-rehabilitation"], crossCategorySlugs: ["employment"] },
      "Veterans Crisis Line": { subcategorySlugs: ["mental-health-ptsd-support"], crossCategorySlugs: ["mental-health", "crisis-help"] },
      "Homes for Our Troops": { subcategorySlugs: ["accessible-housing-home-modifications"], crossCategorySlugs: ["housing"] },
      "VA Caregiver Support": { subcategorySlugs: ["caregiver-family-support"], crossCategorySlugs: ["family-support"] },
    };

    if (existingResources && existingResources.length > 0) {
      let tagCount = 0;
      for (const res of existingResources) {
        const matchKey = Object.keys(RESOURCE_TAGGING).find(k => res.title.includes(k));
        if (!matchKey) continue;
        const tags = RESOURCE_TAGGING[matchKey];

        for (const subSlug of tags.subcategorySlugs) {
          const subId = subMap[subSlug];
          if (subId) {
            await supabaseAdmin.from("resource_subcategories").upsert(
              { resource_id: res.id, subcategory_id: subId },
              { onConflict: "resource_id,subcategory_id" }
            );
          }
        }

        if (tags.subcategorySlugs.length > 0 && subMap[tags.subcategorySlugs[0]]) {
          const firstSubName = DV_SUBCATEGORIES.find(s => s.slug === tags.subcategorySlugs[0])?.name;
          if (firstSubName && res.subcategory !== firstSubName) {
            await supabaseAdmin.from("resources").update({ subcategory: firstSubName }).eq("id", res.id);
          }
        }

        for (const crossSlug of tags.crossCategorySlugs) {
          const crossId = catSlugToId[crossSlug];
          if (crossId) {
            await supabaseAdmin.from("resource_categories").upsert(
              { resource_id: res.id, category_id: crossId },
              { onConflict: "resource_id,category_id" }
            );
            tagCount++;
          }
        }
      }
      if (tagCount > 0) console.log(`[seed] Applied ${tagCount} cross-category tags to Disabled Veterans resources`);
      return;
    }

    const resources = [
      {
        title: "SC Department of Veterans' Affairs — Disabled Veterans Services",
        short_description: "South Carolina's state veterans affairs office provides benefits counseling, claims assistance, and advocacy for disabled veterans including service-connected disability compensation, pension, and special adaptive programs.",
        description: "The SC Department of Veterans' Affairs helps disabled veterans navigate VA disability claims, appeals, and benefits. Services include assistance with service-connected disability ratings, pension applications, Aid & Attendance benefits, and connections to adaptive housing and vehicle modification programs.",
        phone: "803-647-2434",
        website: "https://scdva.sc.gov",
        address: "1 National Guard Rd, Columbia, SC 29201",
        city: "Columbia",
        state: "SC",
        zip_code: "29201",
        is_national: false,
        source_type: "government",
        eligibility: "All disabled veterans in South Carolina",
        subcategory: "Benefits & Claims Assistance",
      },
      {
        title: "Disabled American Veterans (DAV) — South Carolina",
        short_description: "DAV provides free assistance to disabled veterans and their families with VA disability claims, benefits, transportation to VA medical facilities, and employment support.",
        description: "The Disabled American Veterans organization in South Carolina offers free claims assistance from trained National Service Officers, a network of hospital service coordinators at VA facilities, a transportation program for veterans who need rides to VA medical centers, and employment support programs. DAV also provides community outreach and legislative advocacy on behalf of disabled veterans.",
        phone: "803-647-2434",
        website: "https://www.dav.org/veterans/find-your-local-office/",
        address: "Columbia, SC",
        city: "Columbia",
        state: "SC",
        zip_code: "29201",
        is_national: false,
        source_type: "nonprofit",
        eligibility: "All disabled veterans and their families",
        subcategory: "Advocacy & Support",
      },
      {
        title: "Paralyzed Veterans of America — Southeast Chapter",
        short_description: "PVA provides support, advocacy, and services for veterans with spinal cord injuries and diseases including wheelchair sports, benefits assistance, and accessibility advocacy.",
        description: "The Paralyzed Veterans of America Southeast Chapter serves paralyzed and severely disabled veterans across South Carolina with benefits counseling, medical advocacy, adaptive sports and recreation programs, accessibility consulting, and peer mentoring. PVA also advocates for accessible housing and transportation improvements.",
        phone: "800-292-9335",
        website: "https://pva.org",
        address: "Columbia, SC",
        city: "Columbia",
        state: "SC",
        zip_code: "29201",
        is_national: false,
        source_type: "nonprofit",
        eligibility: "Veterans with spinal cord injuries/diseases and other severe disabilities",
        subcategory: "Advocacy & Support",
      },
      {
        title: "VA Disability Compensation — Columbia VA Regional Office",
        short_description: "The Columbia VA Regional Office processes disability compensation claims for South Carolina veterans with service-connected injuries or illnesses, including rating decisions and appeals.",
        description: "The VA Regional Office in Columbia handles all disability compensation claims for SC veterans. Services include initial claims processing, rating increases, secondary conditions, Individual Unemployability (TDIU), Special Monthly Compensation, and the appeals process. Veterans can file claims online, by mail, or with assistance from accredited representatives.",
        phone: "800-827-1000",
        website: "https://www.va.gov/columbia-sc-regional-office/",
        address: "6437 Garners Ferry Rd, Columbia, SC 29209",
        city: "Columbia",
        state: "SC",
        zip_code: "29209",
        is_national: false,
        source_type: "government",
        eligibility: "Veterans with service-connected disabilities",
        subcategory: "Benefits & Claims Assistance",
      },
      {
        title: "SC Vocational Rehabilitation — Disabled Veterans Program",
        short_description: "SC Vocational Rehabilitation provides disabled veterans with job training, assistive technology, job placement services, and workplace accommodations to support employment.",
        description: "South Carolina Vocational Rehabilitation serves disabled veterans with comprehensive employment services including vocational assessment, skills training, assistive technology, job coaching, workplace modification assistance, and job placement. Priority of service is given to veterans with service-connected disabilities.",
        phone: "803-896-6500",
        website: "https://scvrd.net",
        address: "1410 Boston Ave, West Columbia, SC 29170",
        city: "West Columbia",
        state: "SC",
        zip_code: "29170",
        is_national: false,
        source_type: "government",
        eligibility: "Disabled veterans seeking employment",
        subcategory: "Employment Support",
      },
      {
        title: "Adaptive Sports & Recreation — Ralph H. Johnson VA Medical Center",
        short_description: "The Charleston VA offers adaptive sports and recreation programs for disabled veterans including wheelchair basketball, cycling, kayaking, and fitness programs.",
        description: "The Ralph H. Johnson VA Medical Center in Charleston provides adaptive sports and recreation programs designed for veterans with disabilities. Programs include wheelchair basketball, adaptive cycling, kayaking, swimming, track and field, and general fitness. These programs promote physical rehabilitation, social connection, and competitive opportunities including the National Veterans Wheelchair Games.",
        phone: "843-577-5011",
        website: "https://www.va.gov/charleston-health-care/",
        address: "109 Bee St, Charleston, SC 29401",
        city: "Charleston",
        state: "SC",
        zip_code: "29401",
        is_national: false,
        source_type: "government",
        eligibility: "Veterans with physical disabilities enrolled in VA healthcare",
        subcategory: "Health & Wellness",
      },
      {
        title: "Specially Adapted Housing (SAH) Grant — VA",
        short_description: "VA provides grants up to $109,986 for disabled veterans to build or modify homes for wheelchair accessibility, including ramps, widened doorways, and accessible bathrooms.",
        description: "The VA Specially Adapted Housing (SAH) grant program helps veterans with certain service-connected disabilities build, buy, or modify a home to meet their accessibility needs. Grants can fund wheelchair ramps, widened doorways, accessible bathrooms, roll-in showers, and other modifications. The Special Housing Adaptation (SHA) grant provides up to $44,299 for less severe disabilities. SC veterans can apply through the Columbia VA Regional Office.",
        phone: "800-827-1000",
        website: "https://www.va.gov/housing-assistance/disability-housing-grants/",
        address: "Columbia, SC",
        city: "Columbia",
        state: "SC",
        zip_code: "29201",
        is_national: false,
        source_type: "government",
        eligibility: "Veterans with qualifying service-connected disabilities",
        subcategory: "Housing & Accessibility",
      },
      {
        title: "Automobile Allowance & Adaptive Equipment — VA",
        short_description: "VA provides a one-time allowance toward purchasing a vehicle and adaptive equipment for disabled veterans who have lost use of limbs or eyesight due to service.",
        description: "The VA Automobile Allowance provides eligible disabled veterans with a one-time payment toward purchasing a specially equipped vehicle, plus ongoing adaptive equipment such as hand controls, wheelchair lifts, and modified steering. Eligibility includes loss or permanent loss of use of one or both hands or feet, permanent impairment of vision, or ankylosis of a knee or hip.",
        phone: "800-827-1000",
        website: "https://www.va.gov/disability/eligibility/special-claims/automobile-allowance-adaptive-equipment/",
        address: "Columbia, SC",
        city: "Columbia",
        state: "SC",
        zip_code: "29201",
        is_national: false,
        source_type: "government",
        eligibility: "Veterans with qualifying service-connected disabilities affecting mobility or vision",
        subcategory: "Transportation & Mobility",
      },
      {
        title: "SC Disabled Veteran Property Tax Exemption",
        short_description: "South Carolina offers a complete property tax exemption on a primary residence for veterans with a permanent and total service-connected disability rating.",
        description: "South Carolina provides a full property tax exemption on the primary residence and up to 1 acre of land for veterans who are permanently and totally disabled due to a service-connected condition. Veterans who are 100% disabled or rated as Individual Unemployability by the VA qualify. Applications are processed through the county auditor's office.",
        phone: "803-898-5000",
        website: "https://dor.sc.gov/tax/property",
        address: "Columbia, SC",
        city: "Columbia",
        state: "SC",
        zip_code: "29201",
        is_national: false,
        source_type: "government",
        eligibility: "SC veterans with permanent and total service-connected disability",
        subcategory: "Financial Benefits",
      },
      {
        title: "Blinded Veterans Association — South Carolina",
        short_description: "BVA provides peer support, advocacy, and rehabilitation resources for blinded and visually impaired veterans including assistive technology training and benefits assistance.",
        description: "The Blinded Veterans Association supports veterans who have lost their sight during or after military service. Services include advocacy for improved VA blind rehabilitation services, peer mentoring, assistive technology guidance, benefits counseling, and connections to local blind rehabilitation programs at VA medical centers in Columbia and Charleston.",
        phone: "800-669-7079",
        website: "https://bva.org",
        address: "Columbia, SC",
        city: "Columbia",
        state: "SC",
        zip_code: "29201",
        is_national: false,
        source_type: "nonprofit",
        eligibility: "Legally blind veterans",
        subcategory: "Health & Rehabilitation",
      },
      {
        title: "SC Commission for the Blind — Veteran Services",
        short_description: "The SC Commission for the Blind offers vocational rehabilitation, independent living skills training, and assistive technology for blind and visually impaired veterans.",
        description: "The SC Commission for the Blind provides comprehensive services for blind and visually impaired veterans including vocational rehabilitation, job placement assistance, assistive technology training, orientation and mobility instruction, independent living skills, and counseling. They coordinate with VA Blind Rehabilitation Centers for specialized training.",
        phone: "803-898-8731",
        website: "https://www.sccb.sc.gov",
        address: "1430 Confederate Ave, Columbia, SC 29201",
        city: "Columbia",
        state: "SC",
        zip_code: "29201",
        is_national: false,
        source_type: "government",
        eligibility: "Blind and visually impaired veterans in South Carolina",
        subcategory: "Health & Rehabilitation",
      },
      {
        title: "Wounded Warrior Project — South Carolina",
        short_description: "WWP provides free programs and services for post-9/11 wounded, ill, and injured veterans including mental health support, career counseling, long-term rehabilitative care, and peer connection.",
        description: "The Wounded Warrior Project serves post-9/11 veterans who incurred a physical or mental injury, illness, or wound during military service. Programs include Warriors to Work (employment), mental health services including PTSD and TBI treatment, physical health and wellness programs, long-term support for severely wounded veterans and their caregivers, and community connection events across South Carolina.",
        phone: "888-997-2586",
        website: "https://www.woundedwarriorproject.org",
        address: "Columbia, SC",
        city: "Columbia",
        state: "SC",
        zip_code: "29201",
        is_national: false,
        source_type: "nonprofit",
        eligibility: "Post-9/11 veterans with service-connected injuries, illnesses, or wounds",
        subcategory: "Comprehensive Support",
      },
      {
        title: "Aid & Attendance and Housebound Benefits — VA",
        short_description: "VA provides additional monthly pension payments to disabled veterans who need help with daily activities or are largely confined to their home.",
        description: "Aid & Attendance is an enhanced VA pension benefit for veterans who require the aid of another person to perform daily activities such as bathing, feeding, dressing, or adjusting prosthetic devices. Housebound benefits are available for veterans who are permanently and substantially confined to their home. SC veterans can apply through the Columbia VA Regional Office or with help from a Veterans Service Organization.",
        phone: "800-827-1000",
        website: "https://www.va.gov/pension/aid-attendance-housebound/",
        address: "Columbia, SC",
        city: "Columbia",
        state: "SC",
        zip_code: "29201",
        is_national: false,
        source_type: "government",
        eligibility: "Wartime veterans with disabilities requiring daily assistance or who are housebound",
        subcategory: "Benefits & Claims Assistance",
      },
      {
        title: "SC Protection & Advocacy for People with Disabilities — Veterans",
        short_description: "P&A provides free legal advocacy for disabled veterans facing discrimination, benefits denials, or accessibility barriers in employment, housing, and public services.",
        description: "South Carolina Protection & Advocacy for People with Disabilities provides free legal services and advocacy to disabled veterans who experience discrimination, denial of services, abuse, or neglect. Services include disability rights information, legal representation in disputes involving employment, housing, education, government benefits, and accessibility, and systemic advocacy for policy changes benefiting disabled veterans.",
        phone: "803-782-0639",
        website: "https://www.pandasc.org",
        address: "3710 Landmark Dr Suite 208, Columbia, SC 29204",
        city: "Columbia",
        state: "SC",
        zip_code: "29204",
        is_national: false,
        source_type: "nonprofit",
        eligibility: "Disabled veterans facing discrimination or rights violations",
        subcategory: "Legal Advocacy",
      },
      {
        title: "Disabled Veterans Outreach Program (DVOP) — SC DEW",
        short_description: "DVOP specialists at SC Department of Employment and Workforce provide intensive employment services specifically for disabled and other eligible veterans.",
        description: "The Disabled Veterans Outreach Program (DVOP) operates through SC Works centers across South Carolina. DVOP specialists provide one-on-one intensive employment services to disabled veterans and other veterans with significant barriers to employment. Services include career counseling, resume assistance, job search support, interview coaching, connections to training programs, and referrals to supportive services. Priority is given to veterans with service-connected disabilities.",
        phone: "803-737-2400",
        website: "https://www.dew.sc.gov/individuals/veterans-services",
        address: "1550 Gadsden St, Columbia, SC 29201",
        city: "Columbia",
        state: "SC",
        zip_code: "29201",
        is_national: false,
        source_type: "government",
        eligibility: "Disabled veterans and veterans with significant barriers to employment",
        subcategory: "Employment Support",
      },
      {
        title: "Veterans Crisis Line & Mental Health Services for Disabled Veterans",
        short_description: "Specialized mental health support for disabled veterans including crisis intervention, PTSD treatment, TBI rehabilitation, and caregiver support through VA and community providers.",
        description: "Disabled veterans can access specialized mental health services through VA medical centers in Columbia and Charleston, including PTSD treatment programs, traumatic brain injury rehabilitation, substance use treatment, and caregiver support programs. The Veterans Crisis Line (dial 988, press 1) provides 24/7 crisis support. The VA Caregiver Support Program assists family members caring for disabled veterans.",
        phone: "988",
        website: "https://www.veteranscrisisline.net",
        address: "Statewide — SC",
        city: "Columbia",
        state: "SC",
        zip_code: "29201",
        is_national: false,
        source_type: "government",
        eligibility: "All veterans, especially disabled veterans in crisis or needing mental health support",
        subcategory: "Mental Health & Crisis",
      },
      {
        title: "Homes for Our Troops — South Carolina",
        short_description: "Homes for Our Troops builds and donates specially adapted, mortgage-free homes for severely injured post-9/11 veterans throughout South Carolina.",
        description: "Homes for Our Troops builds specially adapted, mortgage-free homes for severely injured post-9/11 veterans across South Carolina. Homes are designed for wheelchair accessibility and include features like roll-under sinks, widened doorways, roll-in showers, and smart home technology. The organization also provides financial planning education and community reintegration support.",
        phone: "866-787-6677",
        website: "https://www.hfotusa.org",
        address: "Statewide — SC",
        city: "Columbia",
        state: "SC",
        zip_code: "29201",
        is_national: false,
        source_type: "nonprofit",
        eligibility: "Post-9/11 veterans with severe service-connected disabilities",
        subcategory: "Housing & Accessibility",
      },
      {
        title: "VA Caregiver Support Program — Dorn VA Medical Center",
        short_description: "The VA Caregiver Support Program provides stipends, training, respite care, and health insurance to family caregivers of disabled veterans at the Columbia VA.",
        description: "The Program of Comprehensive Assistance for Family Caregivers at the Dorn VA Medical Center supports family members who care for disabled veterans. Benefits include a monthly stipend, access to health insurance through CHAMPVA, mental health counseling, caregiver training, respite care, and peer support groups. The program serves veterans of all eras who need personal care services due to serious injuries or illnesses sustained or aggravated in the line of duty.",
        phone: "803-776-4000",
        website: "https://www.va.gov/columbia-sc-health-care/",
        address: "6439 Garners Ferry Rd, Columbia, SC 29209",
        city: "Columbia",
        state: "SC",
        zip_code: "29209",
        is_national: false,
        source_type: "government",
        eligibility: "Family caregivers of disabled veterans enrolled in VA healthcare",
        subcategory: "Caregiver Support",
      },
    ];

    let inserted = 0;
    for (const r of resources) {
      const { description, website, zip_code, is_national, ...rest } = r as any;
      const row: Record<string, any> = {
        ...rest,
        category_id: cat.id,
        status: "approved",
      };
      if (website) row.website_url = website;
      if (zip_code) row.zip = zip_code;
      const { data: insertedRow, error } = await supabaseAdmin.from("resources").insert(row).select("id").single();
      if (!error && insertedRow) {
        inserted++;
        await supabaseAdmin.from("resource_categories").upsert({ resource_id: insertedRow.id, category_id: cat.id }, { onConflict: "resource_id,category_id" });
      } else if (error) {
        console.log(`[seed] Disabled Veterans resource insert error: ${error.message} — ${r.title}`);
      }
    }
    if (inserted > 0) {
      console.log(`[seed] Seeded ${inserted} Disabled Veterans resources for SC`);
    }
  } catch (err: any) {
    console.log("[seed] seedDisabledVeteransResources error:", err.message);
  }
}

async function enrichResourceCategories() {
  try {
    const { data: allCats } = await supabaseAdmin.from("categories").select("id, slug");
    if (!allCats || allCats.length === 0) return;
    const catMap: Record<string, string> = {};
    allCats.forEach((c: any) => { catMap[c.slug] = c.id; });

    const rules: Array<{ titleMatch: RegExp; addCats: string[] }> = [
      { titleMatch: /^ralph h\. johnson va|va (medical|clinic|outpatient|health)|va hospice|va star program|dorn va|mount pleasant va/i, addCats: ["healthcare"] },
      { titleMatch: /mental health|ptsd|psychiatric|behavioral health/i, addCats: ["mental-health"] },
      { titleMatch: /vet center/i, addCats: ["mental-health", "community-support"] },
      { titleMatch: /county.*veteran.*affairs|veterans? affairs office/i, addCats: ["va-benefits"] },
      { titleMatch: /hospice/i, addCats: ["healthcare"] },
      { titleMatch: /^disabled american veterans|^dav /i, addCats: ["disabled-veterans"] },
      { titleMatch: /meals on wheels/i, addCats: ["food-assistance"] },
      { titleMatch: /^goodwill/i, addCats: ["education"] },
      { titleMatch: /ptsd.*clinical|ptsd.*team/i, addCats: ["mental-health"] },
      { titleMatch: /veterans? crisis line/i, addCats: ["crisis-help"] },
      { titleMatch: /forrester.*behavioral|shoreline.*behavioral/i, addCats: ["mental-health"] },
      { titleMatch: /ssvf/i, addCats: ["housing"] },
      { titleMatch: /caregiver support/i, addCats: ["family-support"] },
      { titleMatch: /gi bill|chapter 33|education benefit|tuition.*assist|veterans? education|free tuition|tuition waiver/i, addCats: ["va-benefits"] },
      { titleMatch: /va.*home.*loan|mortgage.*program|home.*loan.*program/i, addCats: ["financial"] },
    ];

    const { data: resources } = await supabaseAdmin.from("resources").select("id, title, resource_categories(category_id)").eq("status", "approved");
    if (!resources || resources.length === 0) return;

    let totalAdded = 0;
    for (const r of resources) {
      const existingCatIds = new Set((r.resource_categories || []).map((rc: any) => rc.category_id));
      const toAdd: string[] = [];

      for (const rule of rules) {
        if (rule.titleMatch.test(r.title)) {
          for (const catSlug of rule.addCats) {
            const catId = catMap[catSlug];
            if (catId && !existingCatIds.has(catId) && !toAdd.includes(catId)) {
              toAdd.push(catId);
            }
          }
        }
      }

      if (toAdd.length > 0) {
        const inserts = toAdd.map(cid => ({ resource_id: r.id, category_id: cid }));
        const { error } = await supabaseAdmin.from("resource_categories").upsert(inserts, { onConflict: "resource_id,category_id" });
        if (!error) totalAdded += toAdd.length;
      }
    }

    if (totalAdded > 0) {
      console.log(`[enrichment] Added ${totalAdded} multi-category assignments across resources`);
    }

    const requiredSubs: Array<{ catSlug: string; subs: Array<{ name: string; slug: string }> }> = [
      { catSlug: "mental-health", subs: [
        { name: "PTSD & Trauma Support", slug: "ptsd-trauma-support" },
        { name: "Crisis & Suicide Prevention", slug: "crisis-suicide-prevention" },
        { name: "Substance Abuse & Addiction", slug: "substance-abuse-addiction" },
        { name: "Counseling & Therapy", slug: "counseling-therapy" },
        { name: "Inpatient / Outpatient Treatment", slug: "inpatient-outpatient-treatment" },
        { name: "Peer Support Groups", slug: "peer-support-groups" },
        { name: "Family Support (Mental Health)", slug: "family-support-mental-health" },
      ]},
      { catSlug: "healthcare", subs: [
        { name: "VA Healthcare Enrollment", slug: "va-healthcare-enrollment" },
        { name: "Primary Care", slug: "primary-care" },
        { name: "Specialty Care", slug: "specialty-care" },
        { name: "Rehabilitation Services", slug: "rehabilitation-services" },
        { name: "Telehealth & Virtual Care", slug: "telehealth-virtual-care" },
        { name: "Preventive Care & Wellness", slug: "preventive-care-wellness" },
        { name: "Women Veterans Healthcare", slug: "women-veterans-healthcare" },
        { name: "Caregiver & Family Health Support", slug: "caregiver-family-health-support" },
      ]},
      { catSlug: "va-benefits", subs: [
        { name: "Military Records & DD214", slug: "military-records-dd214" },
        { name: "Disability Claims & Filing", slug: "disability-claims-filing" },
        { name: "Disability Increase (Reevaluation)", slug: "disability-increase-reevaluation" },
        { name: "Appeals & Denials", slug: "appeals-denials" },
        { name: "C&P Exams (What to Expect)", slug: "cp-exams-what-to-expect" },
        { name: "VA Claims Assistance (DAV, VSO, etc.)", slug: "va-claims-assistance-dav-vso" },
        { name: "Pension Benefits", slug: "pension-benefits" },
        { name: "Education Benefits / GI Bill", slug: "education-benefits-gi-bill" },
        { name: "Survivor Benefits", slug: "survivor-benefits" },
        { name: "Aid & Attendance", slug: "aid-attendance" },
        { name: "VA Enrollment & General Benefits Navigation", slug: "va-enrollment-general-benefits-navigation" },
      ]},
      { catSlug: "housing", subs: [
        { name: "Emergency Housing / Homeless Shelters", slug: "emergency-housing-homeless-shelters" },
        { name: "Rental Assistance", slug: "rental-assistance" },
        { name: "Home Ownership Programs", slug: "home-ownership-programs" },
        { name: "VA Housing Benefits", slug: "va-housing-benefits" },
        { name: "Home Modifications (Accessibility)", slug: "home-modifications-accessibility" },
        { name: "Transitional Housing", slug: "transitional-housing" },
        { name: "Foreclosure Prevention", slug: "foreclosure-prevention" },
      ]},
      { catSlug: "employment", subs: [
        { name: "Job Placement Programs", slug: "job-placement-programs" },
        { name: "Resume & Career Coaching", slug: "resume-career-coaching" },
        { name: "Vocational Rehabilitation", slug: "vocational-rehabilitation" },
        { name: "Apprenticeships & Skilled Trades", slug: "apprenticeships-skilled-trades" },
        { name: "Veteran-Friendly Employers", slug: "veteran-friendly-employers" },
        { name: "Entrepreneurship & Small Business Support", slug: "entrepreneurship-small-business-support" },
        { name: "DVOP / Workforce Programs", slug: "dvop-workforce-programs" },
      ]},
      { catSlug: "financial", subs: [
        { name: "Mortgages / Home Loans", slug: "mortgages-home-loans" },
        { name: "Personal Loans", slug: "personal-loans" },
        { name: "Credit Repair", slug: "credit-repair" },
        { name: "Debt Relief", slug: "debt-relief" },
        { name: "Budgeting & Financial Coaching", slug: "budgeting-financial-coaching" },
        { name: "Banking / Lending Support", slug: "banking-lending-support" },
        { name: "Refinancing", slug: "refinancing" },
      ]},
      { catSlug: "crisis-help", subs: [
        { name: "Veterans Crisis Line", slug: "veterans-crisis-line" },
        { name: "Suicide Prevention", slug: "suicide-prevention" },
        { name: "Mobile Crisis Teams", slug: "mobile-crisis-teams" },
        { name: "Emergency Mental Health", slug: "emergency-mental-health" },
        { name: "Substance Abuse Crisis", slug: "substance-abuse-crisis" },
        { name: "Domestic Violence / Safety", slug: "domestic-violence-safety" },
      ]},
    ];

    let subsCreated = 0;
    const { data: existingSubs } = await supabaseAdmin.from("subcategories").select("id, slug, category_id");
    const existingByKey = new Set((existingSubs || []).map((s: any) => `${s.category_id}:${s.slug}`));
    const subIdBySlug: Record<string, string> = {};
    (existingSubs || []).forEach((s: any) => { subIdBySlug[s.slug] = s.id; });

    for (const group of requiredSubs) {
      const catId = catMap[group.catSlug];
      if (!catId) continue;
      for (const sub of group.subs) {
        const key = `${catId}:${sub.slug}`;
        if (!existingByKey.has(key)) {
          const { data: inserted } = await supabaseAdmin.from("subcategories").upsert(
            { name: sub.name, slug: sub.slug, category_id: catId },
            { onConflict: "slug,category_id" }
          ).select("id").single();
          if (inserted) {
            subIdBySlug[sub.slug] = inserted.id;
            subsCreated++;
          }
        }
      }
    }
    if (subsCreated > 0) {
      console.log(`[enrichment] Created ${subsCreated} new subcategories to align with landing pages`);
    }

    const oldToNew: Record<string, string[]> = {
      "ptsd-counseling": ["ptsd-trauma-support"],
      "crisis-support": ["crisis-suicide-prevention"],
      "substance-abuse-treatment": ["substance-abuse-addiction"],
      "peer-support": ["peer-support-groups"],
      "vet-centers": ["counseling-therapy"],
      "va-clinics": ["primary-care"],
      "va-medical-centers": ["primary-care", "specialty-care"],
      "telehealth": ["telehealth-virtual-care"],
      "disability-claims-assistance": ["disability-claims-filing", "va-claims-assistance-dav-vso"],
      "military-records-dd214-help": ["military-records-dd214"],
      "appeals-assistance": ["appeals-denials"],
      "pension-assistance": ["pension-benefits"],
      "va-enrollment-help": ["va-enrollment-general-benefits-navigation"],
      "county-veterans-service-offices": ["va-claims-assistance-dav-vso"],
      "emergency-housing": ["emergency-housing-homeless-shelters"],
      "emergency-shelter": ["emergency-housing-homeless-shelters"],
      "homeless-veteran-services": ["emergency-housing-homeless-shelters"],
      "rent-assistance": ["rental-assistance"],
      "job-placement": ["job-placement-programs"],
      "resume-assistance": ["resume-career-coaching"],
      "career-counseling": ["resume-career-coaching"],
      "apprenticeships": ["apprenticeships-skilled-trades"],
      "skilled-trades-training": ["apprenticeships-skilled-trades"],
      "entrepreneurship-support": ["entrepreneurship-small-business-support"],
      "federal-employment": ["dvop-workforce-programs"],
      "state-employment": ["dvop-workforce-programs"],
      "certification-programs": ["vocational-rehabilitation"],
      "benefits-counseling": ["budgeting-financial-coaching"],
      "budgeting-financial-planning": ["budgeting-financial-coaching"],
      "debt-counseling": ["debt-relief"],
      "emergency-financial-assistance": ["banking-lending-support"],
      "nonprofit-financial-support": ["banking-lending-support"],
      "veteran-relief-funds": ["banking-lending-support"],
      "utility-bill-assistance": ["debt-relief"],
      "crisis-stabilization": ["emergency-mental-health"],
      "detox-programs": ["inpatient-outpatient-treatment"],
      "outpatient-recovery": ["inpatient-outpatient-treatment"],
      "healthcare-rehabilitation": ["rehabilitation-services"],
    };

    const { data: resAll } = await supabaseAdmin.from("resources").select("id, title, resource_subcategories(subcategory_id)").eq("status", "approved");
    if (resAll) {
      let mapped = 0;
      for (const r of resAll) {
        const existingSubIds = new Set((r.resource_subcategories || []).map((rs: any) => rs.subcategory_id));
        const toAdd: Array<{ resource_id: string; subcategory_id: string }> = [];

        for (const [oldSlug, newSlugs] of Object.entries(oldToNew)) {
          const oldId = subIdBySlug[oldSlug];
          if (oldId && existingSubIds.has(oldId)) {
            for (const ns of newSlugs) {
              const newId = subIdBySlug[ns];
              if (newId && !existingSubIds.has(newId)) {
                toAdd.push({ resource_id: r.id, subcategory_id: newId });
                existingSubIds.add(newId);
              }
            }
          }
        }

        if (toAdd.length > 0) {
          const { error } = await supabaseAdmin.from("resource_subcategories").upsert(toAdd, { onConflict: "resource_id,subcategory_id" });
          if (!error) mapped += toAdd.length;
        }
      }
      if (mapped > 0) {
        console.log(`[enrichment] Mapped ${mapped} resources from old subcategories to new landing-page subcategories`);
      }
    }

    const subRules: Array<{ titleMatch: RegExp; addSubs: string[] }> = [
      { titleMatch: /va (clinic|outpatient)|va health care enrollment/i, addSubs: ["primary-care", "va-healthcare-enrollment", "preventive-care-wellness"] },
      { titleMatch: /va medical center|dorn va|ralph h\. johnson va/i, addSubs: ["primary-care", "specialty-care", "preventive-care-wellness"] },
      { titleMatch: /vet center(?! call)/i, addSubs: ["counseling-therapy", "peer-support-groups"] },
      { titleMatch: /ptsd|ptsd clinical/i, addSubs: ["ptsd-trauma-support"] },
      { titleMatch: /crisis line|crisis.*24/i, addSubs: ["crisis-suicide-prevention", "veterans-crisis-line"] },
      { titleMatch: /hospice/i, addSubs: ["hospice-palliative-care"] },
      { titleMatch: /mental health/i, addSubs: ["counseling-therapy"] },
      { titleMatch: /telehealth|virtual care/i, addSubs: ["telehealth-virtual-care"] },
      { titleMatch: /caregiver/i, addSubs: ["caregiver-family-health-support"] },
      { titleMatch: /women.*veteran|female.*veteran/i, addSubs: ["women-veterans-healthcare"] },
      { titleMatch: /rehabilitation|physical therapy/i, addSubs: ["rehabilitation-services"] },
      { titleMatch: /dd.?214|military records|personnel records/i, addSubs: ["military-records-dd214"] },
      { titleMatch: /disability.*claim|claims.*assistance/i, addSubs: ["disability-claims-filing"] },
      { titleMatch: /appeal|denied.*claim/i, addSubs: ["appeals-denials"] },
      { titleMatch: /pension/i, addSubs: ["pension-benefits"] },
      { titleMatch: /gi bill|education benefit/i, addSubs: ["education-benefits-gi-bill"] },
      { titleMatch: /survivor benefit|dic /i, addSubs: ["survivor-benefits"] },
      { titleMatch: /aid.*attendance/i, addSubs: ["aid-attendance"] },
      { titleMatch: /ssvf|emergency.*housing|homeless.*veteran|shelter/i, addSubs: ["emergency-housing-homeless-shelters"] },
      { titleMatch: /rent.*assist|rental/i, addSubs: ["rental-assistance"] },
      { titleMatch: /transitional.*housing/i, addSubs: ["transitional-housing"] },
      { titleMatch: /home.*loan|home.*owner|va.*loan|mortgage/i, addSubs: ["home-ownership-programs"] },
      { titleMatch: /job.*place|employment.*match/i, addSubs: ["job-placement-programs"] },
      { titleMatch: /resume|career.*coach|interview.*prep/i, addSubs: ["resume-career-coaching"] },
      { titleMatch: /vocational.*rehab|chapter 31|vr&e/i, addSubs: ["vocational-rehabilitation"] },
      { titleMatch: /apprentice|skilled.*trade/i, addSubs: ["apprenticeships-skilled-trades"] },
      { titleMatch: /entrepreneur|small.*business|sba/i, addSubs: ["entrepreneurship-small-business-support"] },
      { titleMatch: /dvop|workforce|department.*labor/i, addSubs: ["dvop-workforce-programs"] },
      { titleMatch: /mobile.*crisis/i, addSubs: ["mobile-crisis-teams"] },
      { titleMatch: /domestic.*violence|family.*violence/i, addSubs: ["domestic-violence-safety"] },
      { titleMatch: /family.*counsel|family.*support.*mental|family.*counseling/i, addSubs: ["family-support-mental-health"] },
      { titleMatch: /bereavement.*counsel|grief.*counsel/i, addSubs: ["family-support-mental-health"] },
      { titleMatch: /gi bill|chapter 33|education benefit|tuition.*assist|veterans? education|higher education/i, addSubs: ["education-benefits-gi-bill"] },
      { titleMatch: /va.*housing|hud-vash|adapted housing|sah.*grant|sha.*grant/i, addSubs: ["va-housing-benefits", "emergency-housing-homeless-shelters"] },
      { titleMatch: /specially adapted|home.*modif|accessibility.*home/i, addSubs: ["home-modifications-accessibility"] },
      { titleMatch: /suicide.*prevent/i, addSubs: ["suicide-prevention", "crisis-suicide-prevention"] },
      { titleMatch: /va.*home.*loan|mortgage.*veteran|home.*loan.*program/i, addSubs: ["mortgages-home-loans", "home-ownership-programs"] },
      { titleMatch: /college|university|technical college|citadel|clemson/i, addSubs: ["education-benefits-gi-bill"] },
    ];

    const { data: resForSub } = await supabaseAdmin.from("resources").select("id, title, resource_subcategories(subcategory_id)").eq("status", "approved");
    if (resForSub) {
      let subAdded = 0;
      for (const r of resForSub) {
        const existingSubIds = new Set((r.resource_subcategories || []).map((rs: any) => rs.subcategory_id));

        const toAddSub: string[] = [];
        for (const rule of subRules) {
          if (rule.titleMatch.test(r.title)) {
            for (const subSlug of rule.addSubs) {
              const subId = subIdBySlug[subSlug];
              if (subId && !existingSubIds.has(subId) && !toAddSub.includes(subId)) {
                toAddSub.push(subId);
              }
            }
          }
        }

        if (toAddSub.length > 0) {
          const inserts = toAddSub.map(sid => ({ resource_id: r.id, subcategory_id: sid }));
          const { error } = await supabaseAdmin.from("resource_subcategories").upsert(inserts, { onConflict: "resource_id,subcategory_id" });
          if (!error) subAdded += toAddSub.length;
        }
      }
      if (subAdded > 0) {
        console.log(`[enrichment] Added ${subAdded} new subcategory assignments via title matching`);
      }
    }
  } catch (err: any) {
    console.log("[enrichment] enrichResourceCategories error:", err.message);
  }
}

async function seedStatewideResources() {
  try {
    const { data: allCats } = await supabaseAdmin.from("categories").select("id, slug");
    if (!allCats || allCats.length === 0) return;
    const catMap: Record<string, string> = {};
    allCats.forEach((c: any) => { catMap[c.slug] = c.id; });

    const { data: existingRes } = await supabaseAdmin.from("resources").select("title").eq("status", "approved");
    const existingTitles = new Set((existingRes || []).map((r: any) => r.title));

    const { data: allSubs } = await supabaseAdmin.from("subcategories").select("id, slug, category_id");
    const subIdBySlug: Record<string, string> = {};
    (allSubs || []).forEach((s: any) => { subIdBySlug[s.slug] = s.id; });

    const newResources: Array<{
      title: string; short_description: string; description: string;
      phone?: string; website?: string; address?: string; city: string; state: string; zip: string;
      is_national?: boolean; source_type: string; eligibility?: string;
      categories: string[]; subcategories: string[];
    }> = [
      { title: "Aiken VA Clinic", short_description: "VA outpatient clinic providing primary care, mental health, and specialty services for veterans in the Aiken area.", description: "The Aiken VA Clinic is a community-based outpatient clinic (CBOC) operated by the Dorn VA Medical Center. It provides primary care, mental health services, laboratory work, telehealth appointments, and referrals to specialty care for enrolled veterans.", phone: "803-643-9044", website: "https://www.va.gov/columbia-va-health-care/locations/aiken-va-clinic/", address: "951 Millbrook Ave", city: "Aiken", state: "SC", zip: "29803", source_type: "government", eligibility: "Enrolled veterans", categories: ["healthcare", "mental-health"], subcategories: ["primary-care", "telehealth-virtual-care", "counseling-therapy"] },
      { title: "Sumter VA Clinic — Primary Care", short_description: "VA clinic in Sumter providing primary care and mental health support for local veterans.", description: "The Sumter VA Clinic is a community-based outpatient clinic affiliated with the Dorn VA Medical Center. Services include routine primary care, preventive health screenings, mental health counseling, and telehealth appointments.", phone: "803-938-9901", website: "https://www.va.gov/columbia-va-health-care/locations/sumter-va-clinic/", address: "407 N Salem Ave", city: "Sumter", state: "SC", zip: "29150", source_type: "government", eligibility: "Enrolled veterans", categories: ["healthcare"], subcategories: ["primary-care", "preventive-care-wellness"] },
      { title: "Beaufort VA Clinic — Primary & Preventive Care", short_description: "VA clinic serving Beaufort and Bluffton area veterans with primary care and preventive health services.", description: "The Beaufort VA Clinic provides comprehensive primary care, preventive screenings, immunizations, mental health referrals, and telehealth for veterans in the Lowcountry. Affiliated with Ralph H. Johnson VA Medical Center.", phone: "843-770-0231", website: "https://www.va.gov/charleston-va-health-care/locations/beaufort-va-clinic/", address: "1 Pinckney Blvd", city: "Beaufort", state: "SC", zip: "29902", source_type: "government", eligibility: "Enrolled veterans", categories: ["healthcare"], subcategories: ["primary-care", "preventive-care-wellness"] },
      { title: "Rock Hill VA Clinic — Primary Care", short_description: "VA outpatient clinic in Rock Hill providing primary care and preventive health for York County veterans.", description: "Rock Hill VA Clinic is a community-based outpatient clinic offering primary care, preventive health, chronic disease management, lab services, and referrals to Charlotte VA and Columbia VA for specialty care.", phone: "803-326-3009", website: "https://www.va.gov/columbia-va-health-care/locations/rock-hill-va-clinic/", address: "205 Pebble Creek Dr", city: "Rock Hill", state: "SC", zip: "29730", source_type: "government", eligibility: "Enrolled veterans", categories: ["healthcare"], subcategories: ["primary-care", "preventive-care-wellness"] },
      { title: "VA Women Veterans Health Program — Charleston", short_description: "Comprehensive healthcare for women veterans including gynecology, maternity, and mental health at Ralph H. Johnson VAMC.", description: "The Women Veterans Health Program at Ralph H. Johnson VA Medical Center provides gender-specific care including gynecology, maternity care, breast health, mental health counseling, MST treatment, and primary care designed for women veterans.", phone: "843-789-7000", website: "https://www.va.gov/charleston-va-health-care/programs/women-veteran-care/", address: "109 Bee St", city: "Charleston", state: "SC", zip: "29401", source_type: "government", eligibility: "Women veterans enrolled in VA healthcare", categories: ["healthcare"], subcategories: ["women-veterans-healthcare", "primary-care"] },
      { title: "VA Women Veterans Health Program — Columbia", short_description: "Comprehensive healthcare for women veterans at Dorn VA Medical Center including OB/GYN, mental health, and MST services.", description: "Dorn VA Medical Center's Women Veterans Health Program offers gynecology, maternity care, mammography, MST counseling, mental health services, and a dedicated Women Veterans Program Manager to coordinate care.", phone: "803-776-4000", website: "https://www.va.gov/columbia-va-health-care/programs/women-veteran-care/", address: "6439 Garners Ferry Rd", city: "Columbia", state: "SC", zip: "29209", source_type: "government", eligibility: "Women veterans enrolled in VA healthcare", categories: ["healthcare"], subcategories: ["women-veterans-healthcare", "primary-care"] },
      { title: "VA C&P Exam Information — What to Expect", short_description: "Official VA guidance on Compensation & Pension (C&P) exams including preparation tips and what to bring.", description: "This VA resource explains the Compensation & Pension exam process, including scheduling, what to expect during the exam, how to prepare, tips for documenting symptoms, and understanding how C&P results affect disability ratings. Exams are conducted by VA or contracted providers (QTC, VES, LHI).", website: "https://www.va.gov/disability/va-claim-exam/", city: "Columbia", state: "SC", zip: "29201", is_national: true, source_type: "government", eligibility: "Veterans filing or appealing VA disability claims", categories: ["va-benefits"], subcategories: ["cp-exams-what-to-expect", "disability-claims-filing"] },
      { title: "VA Disability Rating Increase — How to File", short_description: "VA guidance on filing for a disability rating increase when conditions have worsened.", description: "Veterans whose service-connected conditions have worsened can file a supplemental claim or request a higher-level review to increase their disability rating. This resource explains the process, required evidence, and how to submit a claim for increase.", website: "https://www.va.gov/disability/how-to-file-claim/", city: "Columbia", state: "SC", zip: "29201", is_national: true, source_type: "government", eligibility: "Veterans with existing VA disability ratings", categories: ["va-benefits"], subcategories: ["disability-increase-reevaluation", "disability-claims-filing"] },
      { title: "SC Works — Aiken", short_description: "State workforce center in Aiken providing job search, training, and veteran employment services.", description: "SC Works Aiken provides career counseling, job placement, resume assistance, veteran priority of service, apprenticeship connections, and workforce training programs. Veterans receive priority access to all services.", phone: "803-641-7643", website: "https://www.scworks.org", address: "1578 Richland Ave E", city: "Aiken", state: "SC", zip: "29801", source_type: "government", eligibility: "All job seekers; veterans receive priority service", categories: ["employment"], subcategories: ["job-placement-programs", "resume-career-coaching", "dvop-workforce-programs"] },
      { title: "SC Works — Florence", short_description: "State workforce center in Florence providing job search and veteran employment services.", description: "SC Works Florence provides career counseling, job placement, resume writing, veteran priority services, and connections to apprenticeship and training programs.", phone: "843-664-8444", website: "https://www.scworks.org", address: "294 W Evans St", city: "Florence", state: "SC", zip: "29501", source_type: "government", eligibility: "All job seekers; veterans receive priority service", categories: ["employment"], subcategories: ["job-placement-programs", "resume-career-coaching", "dvop-workforce-programs"] },
      { title: "SC Works — Myrtle Beach / Horry County", short_description: "State workforce center serving Horry County with job search, training, and veteran employment support.", description: "SC Works Horry County provides career counseling, job search assistance, resume building, veteran priority of service, GI Bill–related training referrals, and connections to local employers.", phone: "843-347-2738", website: "https://www.scworks.org", address: "1949 Industrial Park Rd", city: "Myrtle Beach", state: "SC", zip: "29577", source_type: "government", eligibility: "All job seekers; veterans receive priority service", categories: ["employment"], subcategories: ["job-placement-programs", "dvop-workforce-programs"] },
      { title: "SC Works — Sumter", short_description: "State workforce center in Sumter providing job placement and veteran employment services.", description: "SC Works Sumter provides job search assistance, resume preparation, veteran priority services, career training referrals, and connections to local and state employers.", phone: "803-774-1225", website: "https://www.scworks.org", address: "31 E Calhoun St", city: "Sumter", state: "SC", zip: "29150", source_type: "government", eligibility: "All job seekers; veterans receive priority service", categories: ["employment"], subcategories: ["job-placement-programs", "dvop-workforce-programs"] },
      { title: "SC Works — Rock Hill", short_description: "State workforce center in Rock Hill providing veteran employment services and job placement.", description: "SC Works Rock Hill provides career services, resume assistance, veteran priority of service, apprenticeship referrals, and workforce training for York County.", phone: "803-324-5551", website: "https://www.scworks.org", address: "454 S Anderson Rd", city: "Rock Hill", state: "SC", zip: "29730", source_type: "government", eligibility: "All job seekers; veterans receive priority service", categories: ["employment"], subcategories: ["job-placement-programs", "dvop-workforce-programs"] },
      { title: "SC Works — Orangeburg", short_description: "State workforce center in Orangeburg providing job search and veteran employment services.", description: "SC Works Orangeburg provides job placement, career training referrals, resume assistance, and veteran priority of service in the Orangeburg County area.", phone: "803-536-4480", website: "https://www.scworks.org", address: "1866 Joe S. Jeffords Hwy", city: "Orangeburg", state: "SC", zip: "29115", source_type: "government", eligibility: "All job seekers; veterans receive priority service", categories: ["employment"], subcategories: ["job-placement-programs", "dvop-workforce-programs"] },
      { title: "Bluffton VA Clinic", short_description: "VA outpatient clinic in Bluffton providing primary care and telehealth for Lowcountry veterans.", description: "The Bluffton VA Clinic is a community-based outpatient clinic affiliated with Ralph H. Johnson VA Medical Center. Services include primary care, preventive screenings, chronic disease management, telehealth, and referrals to specialty care in Charleston.", phone: "843-706-5590", website: "https://www.va.gov/charleston-va-health-care/locations/", address: "17 Sheridan Park Cir", city: "Bluffton", state: "SC", zip: "29910", source_type: "government", eligibility: "Enrolled veterans", categories: ["healthcare"], subcategories: ["primary-care", "telehealth-virtual-care"] },
      { title: "Aiken County Veterans Affairs Office", short_description: "County veterans affairs office in Aiken providing benefits counseling and claims assistance.", description: "The Aiken County Veterans Affairs Office helps veterans with disability claims, pension applications, VA enrollment, benefits counseling, and connections to state and federal programs.", phone: "803-642-1525", address: "828 Richland Ave W", city: "Aiken", state: "SC", zip: "29801", source_type: "government", eligibility: "All veterans in Aiken County", categories: ["va-benefits", "community-support"], subcategories: ["va-claims-assistance-dav-vso", "disability-claims-filing", "va-enrollment-general-benefits-navigation"] },
      { title: "Sumter County Veterans Affairs Office", short_description: "County veterans office providing claims assistance and benefits navigation for Sumter County veterans.", description: "Sumter County Veterans Affairs provides VA claims assistance, pension applications, benefits counseling, DD214 record requests, and referrals to state and federal veteran services.", phone: "803-436-2232", address: "13 E Canal St", city: "Sumter", state: "SC", zip: "29150", source_type: "government", eligibility: "All veterans in Sumter County", categories: ["va-benefits", "community-support"], subcategories: ["va-claims-assistance-dav-vso", "military-records-dd214", "va-enrollment-general-benefits-navigation"] },
      { title: "Florence County Veterans Affairs Office", short_description: "County veterans office in Florence providing benefits counseling and VA claims assistance.", description: "Florence County Veterans Affairs Office assists veterans with VA disability claims, pension applications, enrollment, and connections to local and national veteran resources.", phone: "843-665-3047", address: "180 N Irby St", city: "Florence", state: "SC", zip: "29501", source_type: "government", eligibility: "All veterans in Florence County", categories: ["va-benefits", "community-support"], subcategories: ["va-claims-assistance-dav-vso", "va-enrollment-general-benefits-navigation"] },
      { title: "Orangeburg County Veterans Affairs Office", short_description: "County veterans office in Orangeburg providing VA claims and benefits assistance.", description: "Orangeburg County Veterans Affairs Office provides claims filing help, VA enrollment guidance, pension assistance, and referrals to healthcare and housing services for county veterans.", phone: "803-533-6154", address: "1437 Amelia St", city: "Orangeburg", state: "SC", zip: "29115", source_type: "government", eligibility: "All veterans in Orangeburg County", categories: ["va-benefits", "community-support"], subcategories: ["va-claims-assistance-dav-vso", "va-enrollment-general-benefits-navigation"] },
      { title: "York County Veterans Affairs Office", short_description: "County veterans office in Rock Hill providing claims assistance and benefits navigation.", description: "York County Veterans Affairs Office helps Rock Hill and Fort Mill area veterans with VA disability claims, pension applications, enrollment, and referrals to healthcare and housing programs.", phone: "803-628-3088", address: "6 S Congress St", city: "Rock Hill", state: "SC", zip: "29730", source_type: "government", eligibility: "All veterans in York County", categories: ["va-benefits", "community-support"], subcategories: ["va-claims-assistance-dav-vso", "va-enrollment-general-benefits-navigation"] },
      { title: "Anderson County Veterans Affairs Office", short_description: "County veterans office in Anderson providing claims assistance and benefits counseling.", description: "Anderson County Veterans Affairs Office assists local veterans with VA claims, pension applications, benefits enrollment, and connections to state veteran services.", phone: "864-260-4032", address: "101 S Main St", city: "Anderson", state: "SC", zip: "29624", source_type: "government", eligibility: "All veterans in Anderson County", categories: ["va-benefits", "community-support"], subcategories: ["va-claims-assistance-dav-vso", "va-enrollment-general-benefits-navigation"] },
      { title: "Lowcountry Food Bank — Veteran Programs", short_description: "Food bank serving Lowcountry SC veterans with emergency food boxes, pantry referrals, and SNAP application help.", description: "Lowcountry Food Bank operates mobile pantries, partner agency food distributions, and direct SNAP enrollment assistance. They serve Berkeley, Charleston, Colleton, Dorchester, and surrounding counties with specific outreach to veteran families.", phone: "843-747-8146", website: "https://www.lowcountryfoodbank.org", address: "2864 Azalea Dr", city: "North Charleston", state: "SC", zip: "29405", source_type: "nonprofit", eligibility: "Low-income veterans and families in Lowcountry SC", categories: ["food-assistance"], subcategories: ["food-banks", "snap-assistance"] },
      { title: "Harvest Hope Food Bank — Midlands & Upstate", short_description: "Major food bank serving Columbia, Greenville, and 20 SC counties with veteran-inclusive food assistance.", description: "Harvest Hope Food Bank operates food pantries and mobile distributions across the Midlands and Upstate regions. Services include emergency food boxes, SNAP enrollment assistance, and referrals to other social services. Veterans and military families are priority-served.", phone: "803-254-4432", website: "https://www.harvesthope.org", address: "2220 Shop Rd", city: "Columbia", state: "SC", zip: "29201", source_type: "nonprofit", eligibility: "Low-income individuals and families in covered SC counties", categories: ["food-assistance"], subcategories: ["food-banks", "snap-assistance"] },
      { title: "SC Department of Veterans' Affairs — Florence Office", short_description: "State DVA regional office in Florence providing benefits counseling and claims filing for Pee Dee veterans.", description: "The SCDVA Florence office helps Pee Dee region veterans with VA disability claims, pension applications, education benefits, employment referrals, and connections to local veteran services.", phone: "843-661-4768", website: "https://scdva.sc.gov", address: "181 E Evans St", city: "Florence", state: "SC", zip: "29506", source_type: "government", eligibility: "All veterans in the Pee Dee region", categories: ["va-benefits"], subcategories: ["disability-claims-filing", "va-enrollment-general-benefits-navigation", "education-benefits-gi-bill"] },
      { title: "SC Department of Veterans' Affairs — Greenville Office", short_description: "State DVA regional office in Greenville providing benefits counseling for Upstate veterans.", description: "The SCDVA Greenville office assists Upstate veterans with VA disability claims, pension applications, GI Bill education benefits, employment referrals, and connection to federal and state veteran programs.", phone: "864-467-3566", website: "https://scdva.sc.gov", address: "301 University Ridge", city: "Greenville", state: "SC", zip: "29601", source_type: "government", eligibility: "All veterans in the Upstate region", categories: ["va-benefits"], subcategories: ["disability-claims-filing", "va-enrollment-general-benefits-navigation", "education-benefits-gi-bill"] },
      { title: "VFW Post 8346 — Aiken", short_description: "VFW post in Aiken providing veteran community support, benefits assistance, and social fellowship.", description: "VFW Post 8346 in Aiken provides camaraderie, community service, veterans benefits assistance, scholarship programs, and advocacy for veteran issues. Regular meetings and social events.", phone: "803-648-7801", address: "3404 Richland Ave W", city: "Aiken", state: "SC", zip: "29801", source_type: "nonprofit", eligibility: "All veterans and active-duty service members", categories: ["community-support"], subcategories: ["veteran-service-organizations"] },
      { title: "American Legion Post 20 — Florence", short_description: "American Legion post in Florence providing veteran community support and benefits advocacy.", description: "American Legion Post 20 in Florence provides community support, veteran advocacy, youth programs, and connections to VA claims assistance for Pee Dee area veterans.", phone: "843-662-2511", address: "601 E Cheves St", city: "Florence", state: "SC", zip: "29506", source_type: "nonprofit", eligibility: "All veterans and active-duty service members", categories: ["community-support"], subcategories: ["veteran-service-organizations"] },
      { title: "VFW Post 3484 — Beaufort", short_description: "VFW post in Beaufort providing community support and veterans assistance for Lowcountry veterans.", description: "VFW Post 3484 in Beaufort serves Lowcountry veterans with fellowship, community events, claims guidance, and advocacy. Located near Marine Corps Air Station Beaufort.", phone: "843-524-3384", address: "100 VFW Dr", city: "Beaufort", state: "SC", zip: "29902", source_type: "nonprofit", eligibility: "All veterans and active-duty service members", categories: ["community-support"], subcategories: ["veteran-service-organizations"] },
      { title: "Upstate Homeless Coalition — Greenville", short_description: "Homeless prevention and housing services including emergency shelter and rapid re-housing for veterans.", description: "The Upstate Homeless Coalition coordinates homeless prevention, rapid re-housing, emergency shelter, and supportive services for homeless and at-risk veterans in the Greenville-Spartanburg area.", phone: "864-241-0462", website: "https://www.upstatehomelesscoalition.org", address: "135 Edinburgh Ct", city: "Greenville", state: "SC", zip: "29607", source_type: "nonprofit", eligibility: "Homeless or at-risk veterans in the Upstate region", categories: ["housing"], subcategories: ["emergency-housing-homeless-shelters", "rental-assistance"] },
      { title: "Midlands Housing Alliance — Columbia", short_description: "Emergency shelter and transitional housing for homeless veterans in the Columbia area.", description: "Midlands Housing Alliance operates Transitions, a large shelter in Columbia providing emergency housing, meals, case management, and connections to permanent housing for homeless veterans and individuals.", phone: "803-708-4753", website: "https://www.midlandshousingalliance.org", address: "2025 Main St", city: "Columbia", state: "SC", zip: "29201", source_type: "nonprofit", eligibility: "Homeless individuals and veterans in the Midlands", categories: ["housing"], subcategories: ["emergency-housing-homeless-shelters", "transitional-housing"] },
      { title: "SC Housing — Veterans Homeownership Programs", short_description: "State housing authority offering down payment assistance and homeownership programs for SC veterans.", description: "SC Housing offers mortgage programs with reduced rates, down payment assistance, and homebuyer education for South Carolina veterans. The Palmetto Heroes program specifically serves military and veteran homebuyers.", website: "https://www.schousing.com", phone: "803-896-9001", address: "300 C St W", city: "Columbia", state: "SC", zip: "29201", source_type: "government", eligibility: "SC veterans purchasing a primary residence", categories: ["housing", "financial"], subcategories: ["home-ownership-programs", "va-housing-benefits", "mortgages-home-loans"] },
      { title: "Habitat for Humanity — Veterans Build SC", short_description: "Habitat for Humanity builds affordable homes for qualifying veteran families across South Carolina.", description: "Habitat for Humanity's Veterans Build program helps veteran families achieve homeownership through affordable home construction, mortgage assistance, and community volunteer builds. Multiple affiliates operate across SC.", website: "https://www.habitat.org/volunteer/near-you/veterans-build", phone: "800-422-4828", city: "Columbia", state: "SC", zip: "29201", source_type: "nonprofit", eligibility: "Qualifying veteran families in SC", categories: ["housing"], subcategories: ["home-ownership-programs"] },
      { title: "SC Legal Aid — Aiken Office", short_description: "Free civil legal services for low-income veterans and families in Aiken County.", description: "SC Legal Aid Aiken provides free legal help with landlord-tenant disputes, benefit denials, family law, protective orders, and consumer issues for low-income individuals including veterans.", phone: "803-649-1774", website: "https://www.sclegal.org", address: "206 Edgefield Ave NW", city: "Aiken", state: "SC", zip: "29801", source_type: "nonprofit", eligibility: "Low-income individuals in Aiken County including veterans", categories: ["legal"], subcategories: ["legal-aid-services"] },
      { title: "SC Legal Aid — Florence Office", short_description: "Free civil legal services for low-income veterans and families in the Pee Dee region.", description: "SC Legal Aid Florence provides free legal assistance with housing disputes, VA benefit denials, family law, debt issues, and consumer protection for low-income individuals including veterans.", phone: "843-667-1896", website: "https://www.sclegal.org", address: "107 E Dargan St", city: "Florence", state: "SC", zip: "29506", source_type: "nonprofit", eligibility: "Low-income individuals in Pee Dee region including veterans", categories: ["legal"], subcategories: ["legal-aid-services"] },
      { title: "SC Legal Aid — Orangeburg Office", short_description: "Free civil legal services for low-income veterans and families in the Orangeburg area.", description: "SC Legal Aid Orangeburg provides free legal assistance with housing, benefits, family law, and consumer issues for low-income individuals including veterans.", phone: "803-534-0656", website: "https://www.sclegal.org", address: "1070 Sunset Blvd", city: "Orangeburg", state: "SC", zip: "29115", source_type: "nonprofit", eligibility: "Low-income individuals in Orangeburg area including veterans", categories: ["legal"], subcategories: ["legal-aid-services"] },
      { title: "SC Legal Aid — Rock Hill Office", short_description: "Free civil legal services for low-income veterans and families in York County.", description: "SC Legal Aid Rock Hill office provides free legal assistance including landlord-tenant disputes, VA benefit appeals, family law, and consumer protection for low-income veterans and families.", phone: "803-327-5291", website: "https://www.sclegal.org", address: "115 Dave Lyle Blvd", city: "Rock Hill", state: "SC", zip: "29730", source_type: "nonprofit", eligibility: "Low-income individuals in York County including veterans", categories: ["legal"], subcategories: ["legal-aid-services"] },
      { title: "NAMI Aiken County", short_description: "NAMI chapter in Aiken providing mental health peer support, education, and advocacy for veterans and families.", description: "NAMI Aiken County offers free peer support groups, Family-to-Family education, mental health advocacy, and connections to local treatment resources. Veterans and military families welcome.", phone: "803-649-4560", website: "https://www.namiaikencounty.org", city: "Aiken", state: "SC", zip: "29801", source_type: "nonprofit", eligibility: "All individuals affected by mental health conditions", categories: ["mental-health"], subcategories: ["peer-support-groups", "family-support-mental-health"] },
      { title: "NAMI Horry County", short_description: "NAMI chapter serving Myrtle Beach/Horry County with peer support and mental health education.", description: "NAMI Horry County provides free peer support groups, educational programs, advocacy, and connections to mental health treatment resources for individuals and families including veterans.", phone: "843-222-5765", website: "https://namihorrycounty.org", city: "Myrtle Beach", state: "SC", zip: "29577", source_type: "nonprofit", eligibility: "All individuals affected by mental health conditions", categories: ["mental-health"], subcategories: ["peer-support-groups", "family-support-mental-health"] },
      { title: "SC Department of Mental Health — Aiken Center", short_description: "State mental health center in Aiken providing counseling and psychiatric services including veteran care.", description: "The Aiken-Barnwell Mental Health Center provides outpatient counseling, psychiatric evaluation, crisis services, substance abuse treatment, and referrals to veteran-specific programs.", phone: "803-641-7700", website: "https://www.scdmh.net", address: "1135 Gregg Hwy", city: "Aiken", state: "SC", zip: "29801", source_type: "government", eligibility: "SC residents; veterans and military families welcome", categories: ["mental-health", "crisis-help"], subcategories: ["counseling-therapy", "emergency-mental-health"] },
      { title: "SC Department of Mental Health — Florence Center", short_description: "State mental health center in Florence providing counseling and crisis services.", description: "Pee Dee Mental Health Center in Florence provides outpatient counseling, crisis intervention, psychiatric services, and substance abuse treatment. Veterans and military families can access all services.", phone: "843-317-4073", website: "https://www.scdmh.net", address: "125 E Cheves St", city: "Florence", state: "SC", zip: "29506", source_type: "government", eligibility: "SC residents; veterans and military families welcome", categories: ["mental-health", "crisis-help"], subcategories: ["counseling-therapy", "emergency-mental-health"] },
      { title: "SC Department of Mental Health — Orangeburg Center", short_description: "State mental health center in Orangeburg providing counseling, crisis support, and psychiatric services.", description: "Orangeburg Mental Health Center provides outpatient counseling, psychiatric evaluation, crisis stabilization, substance abuse treatment, and referrals to veteran-specific resources.", phone: "803-536-1571", website: "https://www.scdmh.net", address: "1475 Charleston Hwy", city: "Orangeburg", state: "SC", zip: "29115", source_type: "government", eligibility: "SC residents; veterans and military families welcome", categories: ["mental-health", "crisis-help"], subcategories: ["counseling-therapy", "emergency-mental-health"] },
      { title: "Beaufort County DSS — Veteran Assistance", short_description: "County social services in Beaufort providing SNAP, emergency assistance, and veteran referrals.", description: "Beaufort County DSS provides SNAP/food stamps, emergency financial assistance, Medicaid applications, and referrals to veteran-specific housing and employment programs.", phone: "843-470-2700", address: "1905 Duke St", city: "Beaufort", state: "SC", zip: "29902", source_type: "government", eligibility: "Low-income individuals including veterans in Beaufort County", categories: ["food-assistance", "financial"], subcategories: ["snap-assistance", "banking-lending-support"] },
      { title: "Florence County DSS — Veteran Assistance", short_description: "County social services in Florence providing SNAP, emergency aid, and veteran referrals.", description: "Florence County DSS provides SNAP enrollment, emergency financial assistance, Medicaid, and connections to veteran-specific programs.", phone: "843-661-4750", address: "PO Box 4216", city: "Florence", state: "SC", zip: "29502", source_type: "government", eligibility: "Low-income individuals including veterans in Florence County", categories: ["food-assistance", "financial"], subcategories: ["snap-assistance", "banking-lending-support"] },
      { title: "DAV Chapter 5 — Greenville", short_description: "Disabled American Veterans chapter in Greenville providing benefits advocacy and community support.", description: "DAV Chapter 5 in Greenville assists disabled veterans with VA claims, benefits appeals, transportation to medical appointments, and community fellowship. Free membership for service-connected disabled veterans.", phone: "864-271-8393", city: "Greenville", state: "SC", zip: "29601", source_type: "nonprofit", eligibility: "All disabled veterans", categories: ["disabled-veterans", "community-support"], subcategories: ["disability-benefits-claims", "veteran-service-organizations"] },
      { title: "DAV Chapter 26 — Myrtle Beach", short_description: "Disabled American Veterans chapter in Myrtle Beach providing claims assistance and community support.", description: "DAV Chapter 26 serves Grand Strand area disabled veterans with claims assistance, benefits counseling, transportation to VA medical facilities, and community events.", phone: "843-236-5527", city: "Myrtle Beach", state: "SC", zip: "29577", source_type: "nonprofit", eligibility: "All disabled veterans", categories: ["disabled-veterans", "community-support"], subcategories: ["disability-benefits-claims", "veteran-service-organizations"] },
      { title: "DAV Chapter 17 — Florence", short_description: "Disabled American Veterans chapter in Florence providing claims assistance and advocacy.", description: "DAV Chapter 17 in Florence assists Pee Dee area disabled veterans with VA disability claims, benefits appeals, medical transportation, and advocacy.", phone: "843-662-3813", city: "Florence", state: "SC", zip: "29501", source_type: "nonprofit", eligibility: "All disabled veterans", categories: ["disabled-veterans", "community-support"], subcategories: ["disability-benefits-claims", "veteran-service-organizations"] },
      { title: "Boeing — Charleston Veteran Hiring", short_description: "Boeing's Charleston facility actively recruits veterans for manufacturing, engineering, and operations roles with veteran-friendly hiring programs.", website: "https://www.boeing.com/careers/veterans", phone: "843-746-4000", address: "5400 International Blvd", city: "North Charleston", state: "SC", zip: "29418", source_type: "service", eligibility: "Veterans and transitioning service members", categories: ["employment"], subcategories: ["veteran-friendly-employers", "job-placement-programs"] },
      { title: "Michelin — Greenville Veteran Employment", short_description: "Michelin's Greenville headquarters and SC manufacturing plants offer veteran hiring programs and military skills translation.", website: "https://www.michelinman.com/careers", phone: "864-458-5000", city: "Greenville", state: "SC", zip: "29602", source_type: "service", eligibility: "Veterans and transitioning service members", categories: ["employment"], subcategories: ["veteran-friendly-employers", "job-placement-programs"] },
      { title: "USAA — Veteran Career Programs", short_description: "USAA actively hires veterans and military spouses with dedicated military talent programs and remote work options.", website: "https://www.usaa.com/careers", phone: "800-531-8722", city: "Columbia", state: "SC", zip: "29201", is_national: true, source_type: "service", eligibility: "Veterans and military spouses", categories: ["employment"], subcategories: ["veteran-friendly-employers"] },
      { title: "Bosch — Anderson Veteran Hiring", short_description: "Robert Bosch Anderson plant recruits veterans for advanced manufacturing, engineering, and technical roles.", website: "https://www.bosch.us/careers/", phone: "864-260-5500", city: "Anderson", state: "SC", zip: "29625", source_type: "service", eligibility: "Veterans and transitioning service members", categories: ["employment"], subcategories: ["veteran-friendly-employers", "job-placement-programs"] },
      { title: "Shaw Air Force Base — Civilian Employment", short_description: "Shaw AFB in Sumter offers civilian and contractor positions with veteran hiring preference for base operations and support.", website: "https://www.usajobs.gov", phone: "803-895-1110", city: "Sumter", state: "SC", zip: "29152", source_type: "government", eligibility: "Veterans receive hiring preference", categories: ["employment"], subcategories: ["veteran-friendly-employers", "federal-employment"] },
      { title: "MUSC Health — Veteran Career Opportunities", short_description: "Medical University of South Carolina actively recruits veterans for healthcare, administrative, and technical roles across SC.", website: "https://web.musc.edu/human-resources/careers", phone: "843-792-2300", city: "Charleston", state: "SC", zip: "29425", source_type: "service", eligibility: "Veterans and transitioning service members", categories: ["employment"], subcategories: ["veteran-friendly-employers"] },
      { title: "Orangeburg-Calhoun Technical College — Veteran Services", short_description: "Technical college in Orangeburg providing GI Bill education, career training, and veteran student support.", website: "https://www.octech.edu/veterans", phone: "803-536-0311", address: "3250 St Matthews Rd", city: "Orangeburg", state: "SC", zip: "29118", source_type: "government", eligibility: "Veterans eligible for GI Bill or education benefits", categories: ["education", "employment"], subcategories: ["gi-bill-education", "job-placement-programs"] },
      { title: "Florence-Darlington Technical College — Veteran Services", short_description: "Technical college in Florence providing GI Bill education, career training, and veteran student services.", website: "https://www.fdtc.edu/veterans", phone: "843-661-8324", address: "2715 W Lucas St", city: "Florence", state: "SC", zip: "29501", source_type: "government", eligibility: "Veterans eligible for GI Bill or education benefits", categories: ["education", "employment"], subcategories: ["gi-bill-education", "job-placement-programs"] },
      { title: "Aiken Technical College — Veteran Services", short_description: "Technical college in Aiken providing GI Bill education, workforce training, and veteran student support.", website: "https://www.atc.edu", phone: "803-508-7263", address: "2276 Jefferson Davis Hwy", city: "Aiken", state: "SC", zip: "29801", source_type: "government", eligibility: "Veterans eligible for GI Bill or education benefits", categories: ["education", "employment"], subcategories: ["gi-bill-education", "job-placement-programs"] },
      { title: "Horry-Georgetown Technical College — Veteran Services", short_description: "Technical college in Conway/Myrtle Beach area providing GI Bill education and veteran student services.", website: "https://www.hgtc.edu/veterans", phone: "843-349-5277", address: "2050 Hwy 501 E", city: "Conway", state: "SC", zip: "29526", source_type: "government", eligibility: "Veterans eligible for GI Bill or education benefits", categories: ["education", "employment"], subcategories: ["gi-bill-education", "job-placement-programs"] },
      { title: "Spartanburg Community College — Veteran Services", short_description: "Community college in Spartanburg providing GI Bill education, career training, and veteran student support.", website: "https://www.sccsc.edu/veterans", phone: "864-592-4600", address: "107 Community College Dr", city: "Spartanburg", state: "SC", zip: "29303", source_type: "government", eligibility: "Veterans eligible for GI Bill or education benefits", categories: ["education", "employment"], subcategories: ["gi-bill-education", "job-placement-programs"] },
    ];

    let inserted = 0;
    for (const r of newResources) {
      if (existingTitles.has(r.title)) continue;

      const primaryCatId = catMap[r.categories[0]];
      if (!primaryCatId) continue;

      const row: Record<string, any> = {
        title: r.title,
        short_description: r.short_description,
        city: r.city,
        state: r.state,
        zip: r.zip,
        category_id: primaryCatId,
        status: "approved",
        source_type: r.source_type,
      };
      if (r.phone) row.phone = r.phone;
      if (r.website) row.website_url = r.website;
      if (r.address) row.address = r.address;
      if (r.eligibility) row.eligibility = r.eligibility;

      const { data: insertedRow, error } = await supabaseAdmin.from("resources").insert(row).select("id").single();
      if (error) {
        if (!error.message.includes("duplicate")) console.log(`[seed-statewide] Insert error: ${error.message} — ${r.title}`);
        continue;
      }
      inserted++;
      existingTitles.add(r.title);

      for (const catSlug of r.categories) {
        const cid = catMap[catSlug];
        if (cid) {
          await supabaseAdmin.from("resource_categories").upsert({ resource_id: insertedRow.id, category_id: cid }, { onConflict: "resource_id,category_id" });
        }
      }

      for (const subSlug of r.subcategories) {
        const sid = subIdBySlug[subSlug];
        if (sid) {
          await supabaseAdmin.from("resource_subcategories").upsert({ resource_id: insertedRow.id, subcategory_id: sid }, { onConflict: "resource_id,subcategory_id" });
        }
      }
    }

    if (inserted > 0) {
      console.log(`[seed-statewide] Seeded ${inserted} new statewide resources across SC`);
    }
  } catch (err: any) {
    console.log("[seed-statewide] Error:", err.message);
  }
}

async function checkStatesTable() {
  const { data, error } = await supabaseAdmin.from("states").select("code").limit(1);
  if (error) {
    hasStatesTable = false;
    console.log("[schema] states table not found. Run supabase/create_states.sql");
    return;
  }
  hasStatesTable = true;
  console.log("[schema] states table detected");

  const { error: fullErr } = await supabaseAdmin.from("states").select("id, is_active, is_template, config").limit(1);
  if (fullErr) {
    statesHasFullSchema = false;
    console.log("[schema] states table has simplified schema. Run supabase/alter_states.sql for full multi-state support");
  } else {
    statesHasFullSchema = true;
    console.log("[schema] states table has full schema");
  }
}

async function checkPartnerTable() {
  const { data, error } = await supabaseAdmin.from("partner_organizations").select("id").limit(1);
  if (error) {
    hasPartnerTable = false;
    console.log("[schema] partner_organizations table not found. Run supabase/create_partner_organizations.sql");
  } else {
    hasPartnerTable = true;
    console.log("[schema] partner_organizations table detected");
  }

  const { data: rulesData, error: rulesErr } = await supabaseAdmin.from("partner_routing_rules").select("id").limit(1);
  if (rulesErr) {
    hasRoutingRulesTable = false;
    console.log("[schema] partner_routing_rules table not found. Run supabase/create_partner_organizations.sql");
  } else {
    hasRoutingRulesTable = true;
    console.log("[schema] partner_routing_rules table detected");
  }
}

async function checkNavLifecycleColumns() {
  const { error } = await supabaseAdmin.from("navigator_requests").select("source, urgency, outcome").limit(1);
  if (error && error.message.includes("does not exist")) {
    hasNavLifecycleColumns = false;
    console.log("[schema] Navigator lifecycle columns not found. Please run in Supabase SQL editor:");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS source TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS utm_source TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS utm_medium TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS utm_campaign TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS utm_content TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS utm_id TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS session_id TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS urgency TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS assigned_to TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS outcome TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS consent_followup BOOLEAN DEFAULT false;");
  } else {
    hasNavLifecycleColumns = true;
    console.log("[schema] Navigator lifecycle columns detected");
  }

  const { error: utmErr } = await supabaseAdmin.from("navigator_requests").select("utm_source, utm_content, utm_id").limit(1);
  if (utmErr && utmErr.message.includes("does not exist")) {
    hasNavUtmColumns = false;
    console.log("[schema] navigator_requests UTM columns not found. Run in Supabase SQL editor:");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS utm_source TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS utm_medium TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS utm_campaign TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS utm_content TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS utm_id TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS session_id TEXT;");
  } else {
    hasNavUtmColumns = true;
    console.log("[schema] navigator_requests UTM columns detected");
  }

  const { error: routeErr } = await supabaseAdmin.from("navigator_requests").select("routed_to_partner_id, routed_at, delivery_status, partner_outcome, closed_at").limit(1);
  if (routeErr && routeErr.message.includes("does not exist")) {
    hasRoutingColumns = false;
    console.log("[schema] Routing columns not found. Run in Supabase SQL editor:");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS routed_to_partner_id UUID REFERENCES partner_organizations(id);");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS routed_at TIMESTAMPTZ;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS partner_outcome TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;");
  } else {
    hasRoutingColumns = true;
    console.log("[schema] Routing columns detected");
  }

  const { error: trackColErr } = await supabaseAdmin.from("navigator_requests").select("assigned_at, email_sent, email_sent_at, response_status, response_at").limit(1);
  if (trackColErr && trackColErr.message.includes("does not exist")) {
    hasResponseTrackingColumns = false;
    console.log("[schema] Response tracking columns not found. Run in Supabase SQL editor:");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS response_status TEXT DEFAULT 'pending';");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS response_at TIMESTAMPTZ;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS last_action_source TEXT;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS reassignment_count INTEGER DEFAULT 0;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS last_reassigned_at TIMESTAMPTZ;");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS previous_assigned_to UUID;");
    console.log("  -- Backfill existing data:");
    console.log("  UPDATE navigator_requests SET assigned_at = routed_at WHERE assigned_at IS NULL AND routed_at IS NOT NULL;");
    console.log("  UPDATE navigator_requests SET email_sent = true, email_sent_at = routed_at WHERE email_sent = false AND delivery_status = 'delivered' AND routed_at IS NOT NULL;");
    console.log("  UPDATE navigator_requests SET response_status = 'pending' WHERE response_status IS NULL;");
  } else {
    hasResponseTrackingColumns = true;
    console.log("[schema] Response tracking columns detected (assigned_at, email_sent, response_status)");
  }

  const { error: ambErr } = await supabaseAdmin.from("navigator_requests").select("ambassador_id").limit(1);
  if (ambErr && ambErr.message.includes("does not exist")) {
    hasNavAmbassadorId = false;
    console.log("[schema] navigator_requests.ambassador_id not found. Run in Supabase SQL editor:");
    console.log("  ALTER TABLE navigator_requests ADD COLUMN IF NOT EXISTS ambassador_id UUID;");
    console.log("  CREATE INDEX IF NOT EXISTS idx_nav_req_amb_id ON navigator_requests(ambassador_id);");
  } else {
    hasNavAmbassadorId = true;
    console.log("[schema] navigator_requests.ambassador_id detected");
  }

  const { error: billErr } = await supabaseAdmin.from("navigator_requests").select("is_billable, billed, billed_at, billing_amount, billing_status").limit(1);
  if (billErr && billErr.message.includes("does not exist")) {
    hasBillingColumns = false;
    console.log("[schema] Billing columns not found. Run supabase/chunk-5.0-billing-columns.sql in Supabase SQL editor");
  } else {
    hasBillingColumns = true;
    console.log("[schema] Billing columns detected (is_billable, billed, billing_status)");
  }
}

function normalizeResourceCategories(resource: any): any {
  if (!resource) return resource;
  if (resource.resource_categories && Array.isArray(resource.resource_categories)) {
    resource.categories = resource.resource_categories
      .map((rc: any) => rc.categories)
      .filter(Boolean)
      .map((cat: any) => cat && cat.slug ? { ...cat, slug: toCanonical(cat.slug) } : cat);
    if (resource.categories.length === 1) {
      resource.categories = resource.categories[0];
    } else if (resource.categories.length === 0) {
      resource.categories = null;
    }
    delete resource.resource_categories;
  } else if (resource.categories) {
    if (Array.isArray(resource.categories)) {
      resource.categories = resource.categories.map((cat: any) =>
        cat && cat.slug ? { ...cat, slug: toCanonical(cat.slug) } : cat
      );
    } else if (resource.categories && resource.categories.slug) {
      resource.categories = { ...resource.categories, slug: toCanonical(resource.categories.slug) };
    }
  }
  return resource;
}

function normalizeResourceList(resources: any[]): any[] {
  return (resources || []).map(normalizeResourceCategories);
}

function resourceSelectFields(categoryFilter?: boolean, subcategoryFilter?: boolean) {
  const base = [
    "id", "category_id", "title", "short_description", "website_url", "phone", "email",
    "address", "city", "state", "zip", "eligibility", "source_name", "source_type",
    "last_verified", "monetization_type", "affiliate_url", "sponsored",
  ];
  if (hasSubcategoryColumn) base.push("subcategory");
  if (hasServicePriorityColumn) base.push("service_priority");
  if (hasGeoColumns) base.push("latitude", "longitude");
  base.push("status", "created_at");
  if (categoryFilter) {
    base.push("resource_categories!inner(categories!inner(id, name, slug))");
  } else {
    base.push("resource_categories(categories(id, name, slug))");
  }
  if (subcategoryFilter) {
    base.push("resource_subcategories!inner(subcategories!inner(id, name, slug, category_id))");
  } else {
    base.push("resource_subcategories(subcategories(id, name, slug, category_id))");
  }
  return base.join(", ");
}

function normalizeResourceSubcategories(resource: any): any {
  if (!resource) return resource;
  if (resource.resource_subcategories) {
    const subs = resource.resource_subcategories;
    if (Array.isArray(subs) && subs.length > 0) {
      resource.subcategories_list = subs
        .map((rs: any) => rs.subcategories)
        .filter(Boolean);
    } else {
      resource.subcategories_list = [];
    }
    delete resource.resource_subcategories;
  }
  return resource;
}

function normalizeAllFields(resource: any): any {
  return normalizeResourceSubcategories(normalizeResourceCategories(resource));
}

function normalizeAllFieldsList(resources: any[]): any[] {
  return (resources || []).map(normalizeAllFields);
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-admin-key"] as string;
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

const submitRateLimit = new Map<string, number[]>();
function checkSubmitRate(ip: string): boolean {
  const now = Date.now();
  const window = 60 * 60 * 1000;
  const maxSubmits = 5;
  const timestamps = (submitRateLimit.get(ip) || []).filter(t => now - t < window);
  if (timestamps.length >= maxSubmits) return false;
  timestamps.push(now);
  submitRateLimit.set(ip, timestamps);
  return true;
}

setInterval(() => {
  const now = Date.now();
  const window = 60 * 60 * 1000;
  for (const [ip, times] of submitRateLimit.entries()) {
    const valid = times.filter(t => now - t < window);
    if (valid.length === 0) submitRateLimit.delete(ip);
    else submitRateLimit.set(ip, valid);
  }
}, 10 * 60 * 1000);

async function cleanupTestRecords() {
  try {
    const exactTestNames = [
      "Test Company ABC",
      "ABC 3",
      "ABC-5",
      "ABC-6",
      "ABC-6 Second Chance Job Center",
      "Second Chance Job Center (4)",
    ];
    const placeholders = exactTestNames.map((_, i) => `$${i + 1}`).join(",");
    const found = await pgQuery(
      `SELECT id, name FROM trusted_services WHERE TRIM(name) IN (${placeholders})`,
      exactTestNames
    );
    if (found.length > 0) {
      let removed = 0;
      for (const rec of found) {
        try {
          await pgQuery(`UPDATE partner_applications SET converted_provider_id = NULL WHERE converted_provider_id = $1`, [rec.id]);
          await pgQuery(`DELETE FROM trusted_services WHERE id = $1`, [rec.id]);
          removed++;
        } catch (delErr: any) {
          console.log(`[cleanup] Could not remove "${rec.name}":`, delErr.message);
        }
      }
      if (removed > 0) {
        console.log(`[cleanup] Removed ${removed} test records from trusted_services:`, found.filter((_:any, i:number) => i < removed).map((r: any) => r.name).join(", "));
      }
    }
  } catch (err: any) {
    console.log("[cleanup] cleanupTestRecords error:", err.message);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await checkGeoColumns();
  await checkSubcategoryColumn();
  await checkServicePriorityColumn();
  await checkNotifyEmailColumn();
  await checkNavLifecycleColumns();
  await checkPartnerTable();
  await checkStatesTable();
  await checkTrustedServicesTable();
  await ensureAttributionTables();
  await ensureReferralSweepstakesTables();
  await ensurePartnerSubcategories();

  // Stage C: seeded providers admin endpoints
  registerSeededProviderRoutes(app, requireAdmin);
  await ensurePartnerReferrals();
  await ensureLeadBilling();
  await ensureLeadEventsTable();
  await ensureMonetizationAuditTable();
  await backfillNavAmbassadorId();
  await alignCategoryNames();
  await ensureEndOfLifeCategory();
  await ensureDisabledVeteransCategory();
  await ensureAllTrustedServiceCategories();
  await ensureAllPartnerSubcategories();
  await seedDisabledVeteransResources();
  await enrichResourceCategories();
  await seedStatewideResources();
  await cleanupTestRecords();

  // === RLS ENFORCEMENT (MANDATORY — runs every startup) ===
  try {
    const { validateRlsIntegrity, enforceRls } = await import("./rls-validator");
    const check = await validateRlsIntegrity();
    if (!check.passed) {
      console.log(`[RLS] WARNING: ${check.rls_disabled_count} tables without RLS detected — auto-enforcing...`);
      const fix = await enforceRls();
      console.log(`[RLS] Fixed ${fix.fixed.length} tables: ${fix.fixed.join(", ")}`);
      console.log(`[RLS] RESULT: ${fix.result.passed ? "ALL TABLES SECURED" : "STILL EXPOSED: " + fix.result.exposed_tables.join(", ")}`);
    } else {
      console.log(`[RLS] All ${check.total_tables} tables have RLS enabled — no exposure detected`);
    }
  } catch (rlsErr: any) {
    console.error(`[RLS] Validation failed:`, rlsErr.message);
  }

  if (hasPartnerTable && hasRoutingColumns) {
    startEscalationTimer(5 * 60 * 1000);
  }

  startFounderDigestTimer(5 * 60 * 1000);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/admin/lead-eligibility", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (!process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    const categorySlug = req.query.category as string | undefined;
    const subcategorySlug = req.query.subcategory as string | undefined;

    if (categorySlug) {
      const result = getLeadEligibility(categorySlug, subcategorySlug || null);
      const subs = getLeadEligibleSubcategorySlugs(categorySlug);
      return res.json({ ...result, eligibleSubcategories: subs });
    }

    const eligibleSlugs = getLeadEligibleCategorySlugs();
    const allCats = await pgQuery(`SELECT slug, name, program_area FROM trusted_service_categories ORDER BY slug`);
    const summary = allCats.map((cat: any) => ({
      slug: cat.slug,
      name: cat.name,
      program_area: cat.program_area,
      isLeadEligible: isLeadEligibleCategory(cat.slug),
      eligibleSubcategories: getLeadEligibleSubcategorySlugs(cat.slug),
    }));

    res.json({
      totalCategories: allCats.length,
      leadEligibleCount: eligibleSlugs.length,
      leadEligibleSlugs: eligibleSlugs,
      categories: summary,
    });
  });

  app.get("/api/admin/production-validation", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    const checks: { name: string; status: string; expected: string; actual: string }[] = [];

    try {
      const ambRows = await pgQuery("SELECT COUNT(*) as cnt FROM ambassadors WHERE status = 'active'");
      const ambCount = parseInt(ambRows[0].cnt, 10);
      checks.push({ name: "Ambassadors (active)", status: ambCount >= 5 ? "PASS" : "FAIL", expected: ">=5", actual: String(ambCount) });

      const linkRows = await pgQuery("SELECT COUNT(*) as cnt FROM ambassador_links WHERE is_active = true");
      const linkCount = parseInt(linkRows[0].cnt, 10);
      checks.push({ name: "Ambassador Links (active)", status: linkCount >= 140 ? "PASS" : "FAIL", expected: ">=140", actual: String(linkCount) });

      const payoutRows = await pgQuery("SELECT COUNT(*) as cnt FROM ambassador_payouts");
      checks.push({ name: "Payout Ledger", status: "PASS", expected: "any", actual: payoutRows[0].cnt });

      const tsRows = await pgQuery("SELECT COUNT(*) as cnt FROM trusted_services");
      const tsCount = parseInt(tsRows[0].cnt, 10);
      checks.push({ name: "Trusted Services (total)", status: tsCount >= 10 ? "PASS" : "FAIL", expected: ">=10", actual: String(tsCount) });

      const catRows = await pgQuery("SELECT COUNT(*) as cnt FROM trusted_service_categories WHERE is_active = true");
      checks.push({ name: "Trusted Service Categories", status: parseInt(catRows[0].cnt, 10) > 0 ? "PASS" : "FAIL", expected: ">0", actual: catRows[0].cnt });

      const pricingRows = await pgQuery("SELECT COUNT(*) as cnt FROM lead_category_pricing");
      checks.push({ name: "Lead Category Pricing", status: parseInt(pricingRows[0].cnt, 10) >= 3 ? "PASS" : "FAIL", expected: ">=3", actual: pricingRows[0].cnt });

      const subRows = await pgQuery("SELECT COUNT(*) as cnt FROM partner_subcategories");
      checks.push({ name: "Partner Subcategories", status: parseInt(subRows[0].cnt, 10) >= 10 ? "PASS" : "FAIL", expected: ">=10", actual: subRows[0].cnt });
    } catch (err: any) {
      checks.push({ name: "Neon/PG Tables", status: "FAIL", expected: "accessible", actual: err.message });
    }

    try {
      const { supabaseAdmin } = await import("./supabase");
      const { data: resources } = await supabaseAdmin.from("resources").select("id", { count: "exact", head: true }).eq("status", "approved");
      const { count: resCount } = await supabaseAdmin.from("resources").select("id", { count: "exact", head: true }).eq("status", "approved");
      checks.push({ name: "Resources (approved, Supabase)", status: (resCount || 0) > 0 ? "PASS" : "FAIL", expected: ">0", actual: String(resCount || 0) });

      const { count: catCount } = await supabaseAdmin.from("categories").select("id", { count: "exact", head: true });
      checks.push({ name: "Categories (Supabase)", status: (catCount || 0) > 0 ? "PASS" : "FAIL", expected: ">0", actual: String(catCount || 0) });

      const { count: navCount } = await supabaseAdmin.from("navigator_requests").select("id", { count: "exact", head: true });
      checks.push({ name: "Navigator Requests (Supabase)", status: "PASS", expected: "any", actual: String(navCount || 0) });
    } catch (err: any) {
      checks.push({ name: "Supabase Tables", status: "FAIL", expected: "accessible", actual: err.message });
    }

    const envChecks = [
      { name: "ADMIN_KEY", set: !!process.env.ADMIN_KEY },
      { name: "OPENAI_API_KEY", set: !!process.env.OPENAI_API_KEY },
      { name: "RESEND_API_KEY", set: !!process.env.RESEND_API_KEY },
      { name: "DATABASE_URL", set: !!process.env.DATABASE_URL },
      { name: "SUPABASE_SERVICE_ROLE_KEY", set: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
    ];
    for (const e of envChecks) {
      checks.push({ name: `Env: ${e.name}`, status: e.set ? "PASS" : "FAIL", expected: "set", actual: e.set ? "set" : "MISSING" });
    }

    const failCount = checks.filter(c => c.status === "FAIL").length;
    const passCount = checks.filter(c => c.status === "PASS").length;
    return res.json({
      overall: failCount === 0 ? "ALL PASS" : `${failCount} FAILURES`,
      summary: `${passCount} passed, ${failCount} failed out of ${checks.length} checks`,
      timestamp: new Date().toISOString(),
      checks,
    });
  });

  app.get("/api/reverse-geocode", async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "lat and lon are required" });
    }
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "CareApp/1.0",
        },
        signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();
      const addr = data.address || {};
      const stateCode = addr.state_code?.toUpperCase?.() || addr["ISO3166-2-lvl4"]?.split("-")[1] || "";
      const state = addr.state || "";
      const city = addr.city || addr.town || addr.village || addr.county || "";
      const zip = addr.postcode || "";
      return res.json({ stateCode, state, city, zip });
    } catch (err: any) {
      console.log("[geocode] Reverse geocode failed:", err?.message);
      return res.status(502).json({ error: "Reverse geocode failed" });
    }
  });

  app.post("/api/attribution-session", async (req, res) => {
    const { session_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_id, landing_page, referrer } = req.body;
    if (!session_id) {
      return res.status(400).json({ error: "session_id is required" });
    }
    try {
      let ambassadorId: string | null = null;
      if (utm_content || utm_id) {
        ambassadorId = await resolveAmbassadorId(utm_content || null, utm_id || null);
      }
      await pgQuery(
        `INSERT INTO user_attribution_sessions (session_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, utm_id, landing_page, referrer, ambassador_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [session_id, utm_source || null, utm_medium || null, utm_campaign || null, utm_content || null, utm_term || null, utm_id || null, landing_page || null, referrer || null, ambassadorId]
      );
      return res.json({ ok: true });
    } catch (err: any) {
      console.log("[attribution] session capture error:", err.message);
      return res.status(500).json({ error: "Failed to capture attribution" });
    }
  });

  const AMBASSADOR_BASE_DOMAIN = "https://veterancare.com";

  const AMBASSADOR_AUDIENCES: Record<string, { path: string; campaign: string; label: string }> = {
    veteran:       { path: "/start",           campaign: "sc_veteran_help",        label: "Veterans & Dependents" },
    case_manager:  { path: "/resource-center", campaign: "sc_case_manager_drive",  label: "Case Manager" },
    partner:       { path: "/partners",        campaign: "sc_partner_growth",      label: "Partner / Business" },
    general:       { path: "/get-help",        campaign: "sc_launch",              label: "Get Help Now" },
  };

  const CHANNEL_LABELS: Record<string, string> = {
    facebook: "Facebook", instagram: "Instagram", email: "Email",
    linkedin: "LinkedIn", text: "Text", qr: "QR Code", flyer: "Flyer",
  };

  function titleCase(s: string): string {
    return s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  const AMBASSADOR_CHANNELS = ["facebook", "instagram", "email", "linkedin", "text", "qr", "flyer"] as const;

  function sanitizeCode(raw: string): string {
    return raw.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  }

  function buildAmbassadorUrl(
    basePath: string,
    channel: string,
    campaign: string,
    ambassadorCode: string,
    utmId?: string
  ): string {
    const params = new URLSearchParams();
    params.set("utm_source", "ambassador");
    params.set("utm_medium", channel);
    params.set("utm_campaign", campaign);
    params.set("utm_content", ambassadorCode);
    if (utmId) params.set("utm_id", utmId);
    return `${AMBASSADOR_BASE_DOMAIN}${basePath}?${params.toString()}`;
  }

  app.post("/api/admin/ambassador-links/generate", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    const { ambassador_name, channels, audiences, campaigns, email, region, region_type, phone, first_name, last_name, notes, commission_rate } = req.body;
    if (!ambassador_name || typeof ambassador_name !== "string") {
      return res.status(400).json({ error: "ambassador_name is required" });
    }
    const ambassadorEmail = (email && typeof email === "string") ? email.trim() : null;
    const ambassadorRegion = (region && typeof region === "string") ? region.trim() : null;
    const ambassadorRegionType = (region_type && typeof region_type === "string") ? region_type.trim() : null;
    const ambassadorPhone = (phone && typeof phone === "string") ? phone.trim() : null;
    const ambassadorNotes = (notes && typeof notes === "string") ? notes.trim() : null;

    const code = sanitizeCode(ambassador_name);
    if (!code) return res.status(400).json({ error: "Invalid ambassador name" });

    const selectedChannels = (channels && Array.isArray(channels) && channels.length > 0)
      ? channels.filter((c: string) => AMBASSADOR_CHANNELS.includes(c as any))
      : [...AMBASSADOR_CHANNELS];

    const selectedAudiences = (audiences && Array.isArray(audiences) && audiences.length > 0)
      ? audiences.filter((a: string) => a in AMBASSADOR_AUDIENCES)
      : Object.keys(AMBASSADOR_AUDIENCES);

    try {
      const regenerate = req.body.regenerate === true;

      const existing = await pgQuery(
        `SELECT id FROM ambassador_links WHERE ambassador_code = $1 LIMIT 1`,
        [code]
      );
      if (existing.length > 0) {
        if (regenerate) {
          await pgQuery(`DELETE FROM ambassador_links WHERE ambassador_code = $1`, [code]);
        } else {
          return res.status(409).json({
            error: `Ambassador "${code}" already has links. Pass "regenerate": true to replace, or DELETE first.`,
          });
        }
      }

      let parsedRate: number | null = null;
      if (commission_rate !== undefined && commission_rate !== null && commission_rate !== "") {
        parsedRate = parseFloat(commission_rate);
        if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
          return res.status(400).json({ error: "commission_rate must be a number between 0 and 100" });
        }
      }

      const ambRows = await pgQuery(
        `INSERT INTO ambassadors (code, display_name, first_name, last_name, email, phone, region_type, region_value, notes, commission_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (code) DO UPDATE SET
           display_name = COALESCE(EXCLUDED.display_name, ambassadors.display_name),
           email = COALESCE(EXCLUDED.email, ambassadors.email),
           phone = COALESCE(EXCLUDED.phone, ambassadors.phone),
           region_type = COALESCE(EXCLUDED.region_type, ambassadors.region_type),
           region_value = COALESCE(EXCLUDED.region_value, ambassadors.region_value),
           notes = COALESCE(EXCLUDED.notes, ambassadors.notes),
           commission_rate = COALESCE(EXCLUDED.commission_rate, ambassadors.commission_rate),
           updated_at = NOW()
         RETURNING id`,
        [
          code,
          ambassador_name,
          (first_name && typeof first_name === "string") ? first_name.trim() : null,
          (last_name && typeof last_name === "string") ? last_name.trim() : null,
          ambassadorEmail,
          ambassadorPhone,
          ambassadorRegionType,
          ambassadorRegion,
          ambassadorNotes,
          parsedRate,
        ]
      );
      const ambassadorId = ambRows[0].id;

      const generated: any[] = [];

      async function nextUtmId(ambassadorCode: string, campaign: string, channel: string): Promise<string> {
        const prefix = `${ambassadorCode}_${campaign}_${channel}_`;
        const rows = await pgQuery(
          `SELECT utm_id FROM ambassador_links WHERE utm_id LIKE $1 ORDER BY utm_id DESC LIMIT 1`,
          [`${prefix}%`]
        );
        let seq = 1;
        if (rows.length > 0) {
          const last = rows[0].utm_id as string;
          const suffix = last.slice(prefix.length);
          const num = parseInt(suffix, 10);
          if (!isNaN(num)) seq = num + 1;
        }
        return `${prefix}${String(seq).padStart(2, "0")}`;
      }

      for (const audienceKey of selectedAudiences) {
        const audience = AMBASSADOR_AUDIENCES[audienceKey];
        if (!audience) continue;

        const campaignOverride = campaigns?.[audienceKey];
        const campaign = sanitizeCode(campaignOverride || audience.campaign);

        for (const channel of selectedChannels) {
          const utmId = await nextUtmId(code, campaign, channel);
          const fullUrl = buildAmbassadorUrl(audience.path, channel, campaign, code, utmId);
          const linkName = `${titleCase(code)} – ${CHANNEL_LABELS[channel] || titleCase(channel)} – ${audience.label}`;

          await pgQuery(
            `INSERT INTO ambassador_links
             (ambassador_name, ambassador_code, base_path, utm_source, utm_medium, utm_campaign, utm_content, utm_id, full_url, short_url, audience_type, channel_type, link_name, email, region, ambassador_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
            [ambassador_name, code, audience.path, "ambassador", channel, campaign, code, utmId, fullUrl, `/a/${utmId}`, audienceKey, channel, linkName, ambassadorEmail, ambassadorRegion, ambassadorId]
          );

          generated.push({
            audience: audienceKey,
            channel,
            campaign,
            url: fullUrl,
            utm_id: utmId,
            link_name: linkName,
          });
        }
      }

      return res.json({
        ambassador_name,
        ambassador_code: code,
        ambassador_id: ambassadorId,
        links_generated: generated.length,
        links: generated,
      });
    } catch (err: any) {
      console.log("[ambassador] generate error:", err.message);
      return res.status(500).json({ error: "Failed to generate ambassador links" });
    }
  });

  app.get("/api/admin/ambassador-links", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    const { ambassador, audience, channel, campaign, active, date_from, date_to } = req.query;
    try {
      let sql = `SELECT al.*, a.display_name as ambassador_display_name
        FROM ambassador_links al
        LEFT JOIN ambassadors a ON a.id = al.ambassador_id
        WHERE 1=1`;
      const params: any[] = [];
      let idx = 1;

      if (ambassador) {
        sql += ` AND al.ambassador_code = $${idx++}`;
        params.push(sanitizeCode(ambassador as string));
      }
      if (audience) {
        sql += ` AND al.audience_type = $${idx++}`;
        params.push(audience);
      }
      if (channel) {
        sql += ` AND al.channel_type = $${idx++}`;
        params.push(channel);
      }
      if (campaign) {
        sql += ` AND al.utm_campaign = $${idx++}`;
        params.push(campaign);
      }
      if (active === "true") {
        sql += ` AND al.is_active = true`;
      } else if (active === "false") {
        sql += ` AND al.is_active = false`;
      }
      if (date_from) {
        sql += ` AND al.created_at >= $${idx++}`;
        params.push(date_from);
      }
      if (date_to) {
        sql += ` AND al.created_at < ($${idx++}::date + interval '1 day')`;
        params.push(date_to);
      }

      const { limit, offset } = parsePagination(req, 200, 1000);
      sql += ` ORDER BY al.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      const rows = await pgQuery(sql, params);

      const filterOptions = await pgQuery(`
        SELECT
          ARRAY_AGG(DISTINCT ambassador_code) FILTER (WHERE ambassador_code IS NOT NULL) AS ambassadors,
          ARRAY_AGG(DISTINCT channel_type) FILTER (WHERE channel_type IS NOT NULL) AS channels,
          ARRAY_AGG(DISTINCT utm_campaign) FILTER (WHERE utm_campaign IS NOT NULL) AS campaigns
        FROM ambassador_links
      `);

      return res.json({
        links: rows,
        count: rows.length,
        filterOptions: filterOptions[0] || { ambassadors: [], channels: [], campaigns: [] },
      });
    } catch (err: any) {
      console.log("[ambassador] list error:", err.message);
      return res.status(500).json({ error: "Failed to list ambassador links" });
    }
  });

  app.get("/api/admin/ambassadors", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    try {
      const includeArchived = req.query.include_archived === "true";
      const statusFilter = includeArchived ? "" : "WHERE a.status != 'archived'";
      const { limit, offset } = parsePagination(req, 200, 500);
      const rows = await pgQuery(`
        SELECT a.id as ambassador_id, a.code as ambassador_code, a.display_name as ambassador_name,
               a.email, a.phone, a.region_value as region, a.status,
               a.first_name, a.last_name, a.notes,
               a.created_at,
               COALESCE(ls.link_count, 0)::int as link_count,
               COALESCE(ls.active_count, 0)::int as active_count,
               COALESCE(ls.total_clicks, 0)::int as total_clicks,
               ls.last_activity
        FROM ambassadors a
        LEFT JOIN (
          SELECT ambassador_id,
                 COUNT(*) as link_count,
                 COUNT(*) FILTER (WHERE is_active) as active_count,
                 COALESCE(SUM(click_count), 0) as total_clicks,
                 MAX(last_clicked_at) as last_activity
          FROM ambassador_links
          WHERE ambassador_id IS NOT NULL
          GROUP BY ambassador_id
        ) ls ON ls.ambassador_id = a.id
        ${statusFilter}
        ORDER BY a.display_name
        LIMIT ${limit} OFFSET ${offset}
      `);
      return res.json({ ambassadors: rows });
    } catch (err: any) {
      console.log("[ambassador] list ambassadors error:", err.message);
      return res.status(500).json({ error: "Failed to list ambassadors" });
    }
  });

  app.get("/api/admin/ambassadors/:id", requireAdmin, async (req, res) => {
    try {
      const rows = await pgQuery(
        `SELECT id, code, display_name, first_name, last_name, email, phone,
                region_type, region_value, status, notes, commission_rate,
                payout_method, payout_details, w9_status, tax_notes,
                created_at, updated_at
         FROM ambassadors WHERE id = $1`,
        [req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Ambassador not found" });
      const amb = rows[0];

      const links = await pgQuery(
        `SELECT id, link_name, utm_id, full_url, short_url, audience_type, channel_type,
                click_count, first_clicked_at, last_clicked_at, is_active, created_at
         FROM ambassador_links
         WHERE ambassador_id = $1
         ORDER BY audience_type, channel_type`,
        [amb.id]
      );

      const totalClicks = links.reduce((s: number, l: any) => s + (l.click_count || 0), 0);
      const clickedLinks = links.filter((l: any) => l.first_clicked_at);
      const firstActivity = clickedLinks.length > 0
        ? clickedLinks.reduce((m: string, l: any) => l.first_clicked_at < m ? l.first_clicked_at : m, clickedLinks[0].first_clicked_at)
        : null;
      const lastActivity = clickedLinks.length > 0
        ? clickedLinks.reduce((m: string, l: any) => l.last_clicked_at > m ? l.last_clicked_at : m, clickedLinks[0].last_clicked_at)
        : null;

      const perfRows = await pgQuery(`
        SELECT
          COUNT(*)::int AS total_commissions,
          COALESCE(SUM(commission_amount), 0) AS total_commission_amount,
          COALESCE(SUM(revenue_amount), 0) AS total_revenue,
          COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_commissions,
          COUNT(*) FILTER (WHERE status = 'approved')::int AS approved_commissions,
          COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_commissions
        FROM commissions WHERE ambassador_code = $1
      `, [amb.code]);

      const payoutRows = await pgQuery(`
        SELECT
          COUNT(*)::int AS total_payouts,
          COUNT(*) FILTER (WHERE payout_status = 'paid')::int AS paid_payouts,
          COALESCE(SUM(total_amount) FILTER (WHERE payout_status = 'paid'), 0) AS total_paid_out
        FROM ambassador_payouts WHERE ambassador_id = $1
      `, [amb.id]);

      let totalLeads = 0;
      try {
        const leadRows = await supabaseAdmin
          .from("navigator_requests")
          .select("id", { count: "exact", head: true })
          .eq("ambassador_id", amb.id);
        totalLeads = leadRows.count || 0;
      } catch {}

      return res.json({
        ...amb,
        links,
        activity: {
          total_links: links.length,
          active_links: links.filter((l: any) => l.is_active).length,
          total_clicks: totalClicks,
          first_activity: firstActivity,
          last_activity: lastActivity,
        },
        performance: {
          ...perfRows[0],
          ...payoutRows[0],
          total_leads: totalLeads,
        },
      });
    } catch (err: any) {
      console.log("[ambassador] detail error:", err.message);
      return res.status(500).json({ error: "Failed to load ambassador" });
    }
  });

  app.patch("/api/admin/ambassadors/:id", requireAdmin, async (req, res) => {
    try {
      const { display_name, first_name, last_name, email, phone, region_type, region_value, status, notes, commission_rate, payout_method, payout_details, w9_status, tax_notes } = req.body;
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      const addField = (col: string, val: any) => {
        if (val !== undefined) {
          fields.push(`${col} = $${idx++}`);
          values.push(typeof val === "string" ? val.trim() || null : val);
        }
      };

      addField("display_name", display_name);
      addField("first_name", first_name);
      addField("last_name", last_name);
      addField("email", email);
      addField("phone", phone);
      addField("region_type", region_type);
      addField("region_value", region_value);
      addField("status", status);
      addField("notes", notes);
      addField("payout_method", payout_method);
      addField("payout_details", payout_details);
      addField("w9_status", w9_status);
      addField("tax_notes", tax_notes);
      if (commission_rate !== undefined) {
        let parsedRate: number | null = null;
        if (commission_rate !== null && commission_rate !== "") {
          parsedRate = parseFloat(commission_rate);
          if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
            return res.status(400).json({ error: "commission_rate must be a number between 0 and 100" });
          }
        }
        fields.push(`commission_rate = $${idx++}`);
        values.push(parsedRate);
      }

      if (fields.length === 0) return res.status(400).json({ error: "No fields to update" });

      fields.push(`updated_at = NOW()`);
      values.push(req.params.id);

      const rows = await pgQuery(
        `UPDATE ambassadors SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
        values
      );
      if (rows.length === 0) return res.status(404).json({ error: "Ambassador not found" });
      return res.json(rows[0]);
    } catch (err: any) {
      console.log("[ambassador] update error:", err.message);
      return res.status(500).json({ error: "Failed to update ambassador" });
    }
  });

  app.delete("/api/admin/ambassadors/:id", requireAdmin, async (req, res) => {
    try {
      const ambId = req.params.id;
      const ambRow = await pgQuery(`SELECT code FROM ambassadors WHERE id = $1`, [ambId]);
      if (ambRow.length === 0) return res.status(404).json({ error: "Ambassador not found" });
      const ambCode = ambRow[0].code;

      const commissions = await pgQuery(
        `SELECT COUNT(*)::int as cnt FROM commissions WHERE ambassador_id = $1 OR ambassador_code = $2`,
        [ambId, ambCode]
      );
      const payouts = await pgQuery(
        `SELECT COUNT(*)::int as cnt FROM ambassador_payouts WHERE ambassador_id = $1`,
        [ambId]
      );
      if ((commissions[0]?.cnt || 0) > 0 || (payouts[0]?.cnt || 0) > 0) {
        return res.status(409).json({
          error: "Cannot delete ambassador with linked activity. Please archive instead.",
          has_commissions: commissions[0]?.cnt || 0,
          has_payouts: payouts[0]?.cnt || 0,
        });
      }
      await pgQuery(`DELETE FROM ambassador_links WHERE ambassador_id = $1 OR ambassador_code = $2`, [ambId, ambCode]);
      const deleted = await pgQuery(`DELETE FROM ambassadors WHERE id = $1 RETURNING id`, [ambId]);
      if (deleted.length === 0) return res.status(404).json({ error: "Ambassador not found" });
      return res.json({ deleted: true });
    } catch (err: any) {
      console.log("[ambassador] delete error:", err.message);
      return res.status(500).json({ error: "Failed to delete ambassador" });
    }
  });

  app.put("/api/admin/ambassador-links/:id/toggle", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    try {
      const rows = await pgQuery(
        `UPDATE ambassador_links SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active`,
        [req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Link not found" });
      return res.json(rows[0]);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to toggle link" });
    }
  });

  app.delete("/api/admin/ambassador-links/ambassador/:code", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    try {
      const normalizedCode = sanitizeCode(req.params.code);
      const rows = await pgQuery(
        `DELETE FROM ambassador_links WHERE ambassador_code = $1 RETURNING id`,
        [normalizedCode]
      );
      return res.json({ deleted: rows.length });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to delete ambassador links" });
    }
  });

  app.get("/api/admin/ambassador-report", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    try {
      const sessions = await pgQuery(`
        SELECT utm_content AS ambassador,
               COUNT(*) AS session_count,
               COUNT(DISTINCT session_id) AS unique_sessions,
               MIN(created_at) AS first_seen,
               MAX(created_at) AS last_seen
        FROM user_attribution_sessions
        WHERE utm_source = 'ambassador' AND utm_content IS NOT NULL
        GROUP BY utm_content
        ORDER BY session_count DESC
      `);

      const leads = await pgQuery(`
        SELECT utm_content AS ambassador,
               COUNT(*) AS lead_count
        FROM trusted_service_leads
        WHERE utm_content IS NOT NULL
        GROUP BY utm_content
        ORDER BY lead_count DESC
      `);

      const revenue = await pgQuery(`
        SELECT ambassador,
               COUNT(*) AS conversion_count,
               COALESCE(SUM(revenue_amount), 0) AS total_revenue
        FROM partner_attribution
        WHERE ambassador IS NOT NULL
        GROUP BY ambassador
        ORDER BY total_revenue DESC
      `);

      const byChannel = await pgQuery(`
        SELECT utm_medium AS channel,
               COUNT(*) AS session_count,
               COUNT(DISTINCT session_id) AS unique_sessions
        FROM user_attribution_sessions
        WHERE utm_source = 'ambassador' AND utm_medium IS NOT NULL
        GROUP BY utm_medium
        ORDER BY session_count DESC
      `);

      const byAudience = await pgQuery(`
        SELECT landing_page AS audience_path,
               COUNT(*) AS session_count,
               COUNT(DISTINCT session_id) AS unique_sessions
        FROM user_attribution_sessions
        WHERE utm_source = 'ambassador' AND landing_page IS NOT NULL
        GROUP BY landing_page
        ORDER BY session_count DESC
      `);

      return res.json({ sessions, leads, revenue, byChannel, byAudience });
    } catch (err: any) {
      console.log("[ambassador] report error:", err.message);
      return res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get("/api/admin/dashboard-summary", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    try {
      const ambassadorStats = await pgQuery(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active') AS active_ambassadors,
          COUNT(*) AS total_ambassadors
        FROM ambassadors
      `);

      const linkStats = await pgQuery(`
        SELECT
          COUNT(*) AS total_links,
          COUNT(*) FILTER (WHERE is_active = true) AS active_links,
          COALESCE(SUM(click_count), 0) AS total_clicks,
          COUNT(*) FILTER (WHERE click_count = 0 AND is_active = true) AS zero_click_links
        FROM ambassador_links
      `);

      const commissionStats = await pgQuery(`
        SELECT
          COALESCE(SUM(commission_amount), 0) AS total_commissions,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN commission_amount ELSE 0 END), 0) AS pending_commissions,
          COALESCE(SUM(CASE WHEN status = 'approved' THEN commission_amount ELSE 0 END), 0) AS approved_commissions,
          COALESCE(SUM(CASE WHEN status = 'paid' THEN commission_amount ELSE 0 END), 0) AS paid_commissions,
          COUNT(*) AS total_commission_records,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
          COUNT(*) FILTER (WHERE status = 'approved') AS approved_count
        FROM commissions
      `);

      const payoutStats = await pgQuery(`
        SELECT
          COALESCE(SUM(total_amount), 0) AS total_paid_out,
          COUNT(*) FILTER (WHERE payout_status = 'pending') AS pending_payouts,
          COUNT(*) AS total_payouts
        FROM ambassador_payouts
      `);

      const sessionStats = await pgQuery(`
        SELECT
          COUNT(*) AS total_sessions,
          COUNT(DISTINCT session_id) AS unique_sessions,
          COUNT(*) FILTER (WHERE ambassador_id IS NOT NULL) AS attributed_sessions
        FROM user_attribution_sessions
        WHERE utm_source = 'ambassador'
      `);

      const revenueStats = await pgQuery(`
        SELECT
          COALESCE(SUM(revenue_amount), 0) AS total_revenue,
          COUNT(*) AS total_conversions
        FROM partner_attribution
        WHERE ambassador IS NOT NULL
      `);

      return res.json({
        ambassadors: ambassadorStats[0] || { active_ambassadors: 0, total_ambassadors: 0 },
        links: linkStats[0] || { total_links: 0, active_links: 0, total_clicks: 0, zero_click_links: 0 },
        commissions: commissionStats[0] || { total_commissions: 0, pending_commissions: 0, approved_commissions: 0, paid_commissions: 0, total_commission_records: 0, pending_count: 0, approved_count: 0 },
        payouts: payoutStats[0] || { total_paid_out: 0, pending_payouts: 0, total_payouts: 0 },
        sessions: sessionStats[0] || { total_sessions: 0, unique_sessions: 0, attributed_sessions: 0 },
        revenue: revenueStats[0] || { total_revenue: 0, total_conversions: 0 },
      });
    } catch (err: any) {
      console.log("[dashboard-summary] error:", err.message);
      return res.status(500).json({ error: "Failed to load dashboard summary" });
    }
  });

  app.post("/api/admin/cleanup-test-data", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    try {
      const testCodes = ["e2e_test_runner", "test_short_url", "test_john", "mike_charleston"];
      const results: string[] = [];

      const tracyNew = await pgQuery(`SELECT id FROM ambassadors WHERE code = 'tracy_robertson'`);
      if (tracyNew.length > 0) {
        const tracyId = tracyNew[0].id;
        const reassigned = await pgQuery(
          `UPDATE commissions SET ambassador_code = 'tracy_robertson' WHERE ambassador_code = 'tracy_upstate' RETURNING id`
        );
        results.push(`Reassigned ${reassigned.length} commissions from tracy_upstate → tracy_robertson`);
        const reassignedPayouts = await pgQuery(
          `UPDATE ambassador_payouts SET ambassador_id = $1 WHERE ambassador_id IN (SELECT id FROM ambassadors WHERE code = 'tracy_upstate') RETURNING id`,
          [tracyId]
        );
        results.push(`Reassigned ${reassignedPayouts.length} payouts from tracy_upstate → tracy_robertson`);
        const reassignedAttr = await pgQuery(
          `UPDATE partner_attribution SET ambassador = 'tracy_robertson' WHERE ambassador = 'tracy_upstate' RETURNING id`
        );
        results.push(`Reassigned ${reassignedAttr.length} attribution from tracy_upstate → tracy_robertson`);
        const reassignedSessions = await pgQuery(
          `UPDATE user_attribution_sessions SET utm_content = 'tracy_robertson', ambassador_id = $1 
           WHERE utm_content = 'tracy_upstate' RETURNING id`,
          [tracyId]
        );
        results.push(`Reassigned ${reassignedSessions.length} sessions from tracy_upstate → tracy_robertson`);
      }

      const oldTracyAmb = await pgQuery(`SELECT id FROM ambassadors WHERE code = 'tracy_upstate'`);
      if (oldTracyAmb.length > 0) {
        const oldId = oldTracyAmb[0].id;
        await pgQuery(`DELETE FROM commissions WHERE ambassador_id = $1`, [oldId]);
        await pgQuery(`DELETE FROM ambassador_payouts WHERE ambassador_id = $1`, [oldId]);
        await pgQuery(`DELETE FROM ambassador_links WHERE ambassador_id = $1`, [oldId]);
        await pgQuery(`DELETE FROM user_attribution_sessions WHERE ambassador_id = $1`, [oldId]);
        await pgQuery(`DELETE FROM partner_attribution WHERE ambassador_id = $1`, [oldId]);
        await pgQuery(`DELETE FROM ambassadors WHERE id = $1`, [oldId]);
        results.push(`Deleted archived ambassador tracy_upstate and all related records`);
      }

      for (const code of testCodes) {
        const amb = await pgQuery(`SELECT id FROM ambassadors WHERE code = $1`, [code]);
        if (amb.length > 0) {
          const ambId = amb[0].id;
          const delCommissions = await pgQuery(`DELETE FROM commissions WHERE ambassador_code = $1`, [code]);
          results.push(`Deleted commissions for ${code}: ${delCommissions.length || 0}`);
          await pgQuery(`DELETE FROM commissions WHERE ambassador_id = $1`, [ambId]);
          const delPayouts = await pgQuery(`DELETE FROM ambassador_payouts WHERE ambassador_id = $1`, [ambId]);
          results.push(`Deleted payouts for ${code}: ${delPayouts.length || 0}`);
          const delLinks = await pgQuery(`DELETE FROM ambassador_links WHERE ambassador_id = $1`, [ambId]);
          results.push(`Deleted links for ${code}: ${delLinks.length || 0}`);
          const delSessions = await pgQuery(`DELETE FROM user_attribution_sessions WHERE ambassador_id = $1`, [ambId]);
          results.push(`Deleted sessions for ${code}: ${delSessions.length || 0}`);
          const delAttribution = await pgQuery(`DELETE FROM partner_attribution WHERE ambassador_id = $1`, [ambId]);
          results.push(`Deleted attribution for ${code}: ${delAttribution.length || 0}`);
          await pgQuery(`DELETE FROM ambassadors WHERE id = $1`, [ambId]);
          results.push(`Deleted ambassador ${code}`);
        } else {
          results.push(`Ambassador ${code} not found — skipped`);
        }
      }

      return res.json({ success: true, results });
    } catch (err: any) {
      console.log("[cleanup-test-data] error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/attribution", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    const { ambassador, campaign, date_from, date_to, state } = req.query;
    const ambCode = ambassador ? sanitizeCode(ambassador as string) : null;

    function buildFilters(tableAlias: string, cols: { date?: string; ambassador?: string; campaign?: string }) {
      let sql = "";
      const params: any[] = [];
      let pIdx = 1;
      if (date_from && cols.date) {
        sql += ` AND ${tableAlias}${cols.date} >= $${pIdx}`;
        params.push(date_from);
        pIdx++;
      }
      if (date_to && cols.date) {
        sql += ` AND ${tableAlias}${cols.date} < ($${pIdx}::date + interval '1 day')`;
        params.push(date_to);
        pIdx++;
      }
      if (ambCode && cols.ambassador) {
        sql += ` AND ${tableAlias}${cols.ambassador} = $${pIdx}`;
        params.push(ambCode);
        pIdx++;
      }
      if (campaign && cols.campaign) {
        sql += ` AND ${tableAlias}${cols.campaign} = $${pIdx}`;
        params.push(campaign);
        pIdx++;
      }
      return { sql, params, pIdx };
    }

    function buildNavFilters(q: any) {
      if (ambCode && hasNavUtmColumns) q = q.eq("utm_content", ambCode);
      if (campaign && hasNavUtmColumns) q = q.eq("utm_campaign", campaign);
      if (date_from) q = q.gte("created_at", date_from as string);
      if (date_to) {
        const endDate = new Date(date_to as string);
        endDate.setDate(endDate.getDate() + 1);
        q = q.lt("created_at", endDate.toISOString().split("T")[0]);
      }
      if (state && hasNavUtmColumns) q = q.eq("state", state);
      return q;
    }

    try {
      const clickF = buildFilters("al.", { date: "created_at", ambassador: "ambassador_code", campaign: "utm_campaign" });
      const clickStats = await pgQuery(`
        SELECT COALESCE(SUM(al.click_count), 0)::int AS total_clicks
        FROM ambassador_links al
        WHERE al.is_active IS NOT NULL ${clickF.sql}
      `, clickF.params);

      const sessF = buildFilters("s.", { date: "created_at", ambassador: "utm_content", campaign: "utm_campaign" });
      const sessionStats = await pgQuery(`
        SELECT COUNT(*)::int AS total_sessions,
               COUNT(DISTINCT s.session_id)::int AS unique_sessions
        FROM user_attribution_sessions s
        WHERE s.utm_source = 'ambassador' ${sessF.sql}
      `, sessF.params);

      const tslF = buildFilters("tsl.", { date: "created_at", ambassador: "utm_content" });
      const tslStats = await pgQuery(`
        SELECT COUNT(*)::int AS total_tsl
        FROM trusted_service_leads tsl
        WHERE tsl.ambassador_id IS NOT NULL ${tslF.sql}
      `, tslF.params);

      let navCount = 0;
      try {
        let navQuery = supabaseAdmin.from("navigator_requests").select("id", { count: "exact", head: true });
        if (hasNavAmbassadorId) navQuery = navQuery.not("ambassador_id", "is", null);
        navQuery = buildNavFilters(navQuery);
        const { count } = await navQuery;
        navCount = count || 0;
      } catch {}

      const baLinkF = buildFilters("", { date: "created_at", ambassador: "ambassador_code", campaign: "utm_campaign" });
      const baSessF = buildFilters("", { date: "created_at", ambassador: "utm_content", campaign: "utm_campaign" });
      const baTslF = buildFilters("", { date: "created_at" });

      let baParams = [...baLinkF.params, ...baSessF.params, ...baTslF.params];
      let baLinkSql = baLinkF.sql;
      let baSessSql = baSessF.sql;
      let baTslSql = baTslF.sql;
      let baWhereSql = "";
      const linkOffset = 0;
      const sessOffset = baLinkF.params.length;
      const tslOffset = sessOffset + baSessF.params.length;

      baLinkSql = baLinkSql.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + linkOffset}`);
      baSessSql = baSessSql.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + sessOffset}`);
      baTslSql = baTslSql.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + tslOffset}`);

      if (ambCode) {
        const ambIdx = baParams.length + 1;
        baWhereSql = `WHERE a.code = $${ambIdx}`;
        baParams.push(ambCode);
      }

      const byAmbassador = await pgQuery(`
        SELECT
          a.code AS ambassador_code,
          a.display_name AS ambassador_name,
          COALESCE(lk.clicks, 0)::int AS clicks,
          COALESCE(ss.sessions, 0)::int AS sessions,
          COALESCE(tl.leads, 0)::int AS tsl_leads
        FROM ambassadors a
        LEFT JOIN (
          SELECT ambassador_code, SUM(click_count)::int AS clicks
          FROM ambassador_links
          WHERE 1=1 ${baLinkSql}
          GROUP BY ambassador_code
        ) lk ON lk.ambassador_code = a.code
        LEFT JOIN (
          SELECT utm_content, COUNT(*)::int AS sessions
          FROM user_attribution_sessions
          WHERE utm_source = 'ambassador' ${baSessSql}
          GROUP BY utm_content
        ) ss ON ss.utm_content = a.code
        LEFT JOIN (
          SELECT a2.code, COUNT(*)::int AS leads
          FROM trusted_service_leads tsl2
          JOIN ambassadors a2 ON a2.id = tsl2.ambassador_id
          WHERE 1=1 ${baTslSql}
          GROUP BY a2.code
        ) tl ON tl.code = a.code
        ${baWhereSql}
        ORDER BY clicks DESC, sessions DESC
      `, baParams);

      const blF = buildFilters("al.", { date: "created_at", ambassador: "ambassador_code", campaign: "utm_campaign" });
      const blSessF = buildFilters("", { date: "created_at" });
      const blTslF = buildFilters("", { date: "created_at" });
      let blParams = [...blF.params, ...blSessF.params, ...blTslF.params];
      let blSessSql = blSessF.sql.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + blF.params.length}`);
      let blTslSql = blTslF.sql.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + blF.params.length + blSessF.params.length}`);

      const byLink = await pgQuery(`
        SELECT
          al.utm_id,
          al.link_name,
          al.ambassador_code,
          a.display_name AS ambassador_name,
          al.utm_campaign,
          al.channel_type,
          al.click_count::int AS clicks,
          COALESCE(ss.sessions, 0)::int AS sessions,
          COALESCE(tl.leads, 0)::int AS leads
        FROM ambassador_links al
        LEFT JOIN ambassadors a ON a.id = al.ambassador_id
        LEFT JOIN (
          SELECT utm_id, COUNT(*)::int AS sessions
          FROM user_attribution_sessions
          WHERE utm_source = 'ambassador' AND utm_id IS NOT NULL ${blSessSql}
          GROUP BY utm_id
        ) ss ON ss.utm_id = al.utm_id
        LEFT JOIN (
          SELECT utm_id, COUNT(*)::int AS leads
          FROM trusted_service_leads
          WHERE utm_id IS NOT NULL ${blTslSql}
          GROUP BY utm_id
        ) tl ON tl.utm_id = al.utm_id
        WHERE 1=1 ${blF.sql}
        ORDER BY al.click_count DESC
        LIMIT 100
      `, blParams);

      let navByAmbassador: Record<string, number> = {};
      try {
        if (hasNavAmbassadorId && hasNavUtmColumns) {
          let navQ = supabaseAdmin.from("navigator_requests").select("utm_content");
          navQ = navQ.not("ambassador_id", "is", null);
          navQ = buildNavFilters(navQ);
          const { data: navRows } = await navQ;
          if (navRows) {
            for (const row of navRows) {
              const code = (row as any).utm_content;
              if (code) navByAmbassador[code] = (navByAmbassador[code] || 0) + 1;
            }
          }
        }
      } catch {}

      const byAmbassadorWithNav = byAmbassador.map((a: any) => ({
        ...a,
        nav_leads: navByAmbassador[a.ambassador_code] || 0,
        total_leads: (a.tsl_leads || 0) + (navByAmbassador[a.ambassador_code] || 0),
      }));

      const timingSessF = buildFilters("s.", { date: "created_at", ambassador: "utm_content", campaign: "utm_campaign" });
      let timingSessParams = [...timingSessF.params];
      const timingClickToSession = await pgQuery(`
        SELECT
          AVG(EXTRACT(EPOCH FROM (s.created_at - al.first_clicked_at))) AS avg_seconds,
          MIN(EXTRACT(EPOCH FROM (s.created_at - al.first_clicked_at))) AS min_seconds,
          MAX(EXTRACT(EPOCH FROM (s.created_at - al.first_clicked_at))) AS max_seconds,
          COUNT(*)::int AS sample_count
        FROM user_attribution_sessions s
        JOIN ambassador_links al ON al.utm_id = s.utm_id
        WHERE s.utm_source = 'ambassador'
          AND al.first_clicked_at IS NOT NULL
          AND s.created_at >= al.first_clicked_at
          ${timingSessF.sql}
      `, timingSessParams);

      let navTimingByAmbassador: Record<string, { total_seconds: number; count: number }> = {};
      let navTimingOverall = { total_seconds: 0, count: 0, min_seconds: Infinity, max_seconds: 0 };
      try {
        if (hasNavAmbassadorId && hasNavUtmColumns) {
          let navTQ = supabaseAdmin.from("navigator_requests").select("created_at, utm_content");
          navTQ = navTQ.not("ambassador_id", "is", null);
          navTQ = buildNavFilters(navTQ);
          const { data: navTRows } = await navTQ;
          if (navTRows && navTRows.length > 0) {
            const sessLookup = await pgQuery(`
              SELECT utm_content, MIN(created_at) AS first_session
              FROM user_attribution_sessions
              WHERE utm_source = 'ambassador'
              GROUP BY utm_content
            `);
            const sessMap: Record<string, Date> = {};
            for (const sr of sessLookup) {
              sessMap[sr.utm_content] = new Date(sr.first_session);
            }
            for (const nr of navTRows as any[]) {
              const code = nr.utm_content;
              const leadTime = new Date(nr.created_at).getTime();
              const sessTime = sessMap[code]?.getTime();
              if (code && sessTime && leadTime >= sessTime) {
                const diffSec = (leadTime - sessTime) / 1000;
                navTimingOverall.total_seconds += diffSec;
                navTimingOverall.count++;
                navTimingOverall.min_seconds = Math.min(navTimingOverall.min_seconds, diffSec);
                navTimingOverall.max_seconds = Math.max(navTimingOverall.max_seconds, diffSec);
                if (!navTimingByAmbassador[code]) navTimingByAmbassador[code] = { total_seconds: 0, count: 0 };
                navTimingByAmbassador[code].total_seconds += diffSec;
                navTimingByAmbassador[code].count++;
              }
            }
          }
        }
      } catch {}

      let navClickToLeadOverall = { total_seconds: 0, count: 0 };
      const clickToLeadBuckets = { under_5m: 0, m5_to_30m: 0, m30_to_2h: 0, over_2h: 0 };
      try {
        if (hasNavAmbassadorId && hasNavUtmColumns) {
          let navCLQ = supabaseAdmin.from("navigator_requests").select("created_at, utm_content");
          navCLQ = navCLQ.not("ambassador_id", "is", null);
          navCLQ = buildNavFilters(navCLQ);
          const { data: navCLRows } = await navCLQ;
          if (navCLRows && navCLRows.length > 0) {
            const clickLookup = await pgQuery(`
              SELECT ambassador_code, MIN(first_clicked_at) AS earliest_click
              FROM ambassador_links
              WHERE first_clicked_at IS NOT NULL
              GROUP BY ambassador_code
            `);
            const clickMap: Record<string, Date> = {};
            for (const cr of clickLookup) {
              clickMap[cr.ambassador_code] = new Date(cr.earliest_click);
            }
            for (const nr of navCLRows as any[]) {
              const code = nr.utm_content;
              const leadTime = new Date(nr.created_at).getTime();
              const clickTime = clickMap[code]?.getTime();
              if (code && clickTime && leadTime >= clickTime) {
                const diffSec = (leadTime - clickTime) / 1000;
                navClickToLeadOverall.total_seconds += diffSec;
                navClickToLeadOverall.count++;
                if (diffSec < 300) clickToLeadBuckets.under_5m++;
                else if (diffSec < 1800) clickToLeadBuckets.m5_to_30m++;
                else if (diffSec < 7200) clickToLeadBuckets.m30_to_2h++;
                else clickToLeadBuckets.over_2h++;
              }
            }
          }
        }
      } catch {}

      const c2s = timingClickToSession[0] || {};
      const s2lAvg = navTimingOverall.count > 0 ? navTimingOverall.total_seconds / navTimingOverall.count : null;
      const c2lAvg = navClickToLeadOverall.count > 0 ? navClickToLeadOverall.total_seconds / navClickToLeadOverall.count : null;

      const timing = {
        click_to_session: {
          avg_seconds: c2s.avg_seconds ? parseFloat(parseFloat(c2s.avg_seconds).toFixed(1)) : null,
          min_seconds: c2s.min_seconds ? parseFloat(parseFloat(c2s.min_seconds).toFixed(1)) : null,
          max_seconds: c2s.max_seconds ? parseFloat(parseFloat(c2s.max_seconds).toFixed(1)) : null,
          sample_count: c2s.sample_count || 0,
          is_proxy: true,
          note: "Based on link first_clicked_at (per-link proxy, not per-user)",
        },
        session_to_lead: {
          avg_seconds: s2lAvg !== null ? parseFloat(s2lAvg.toFixed(1)) : null,
          min_seconds: navTimingOverall.count > 0 ? parseFloat(navTimingOverall.min_seconds.toFixed(1)) : null,
          max_seconds: navTimingOverall.count > 0 ? parseFloat(navTimingOverall.max_seconds.toFixed(1)) : null,
          sample_count: navTimingOverall.count,
          is_proxy: false,
          note: "Based on navigator_request.created_at - earliest session for same ambassador",
        },
        click_to_lead: {
          avg_seconds: c2lAvg !== null ? parseFloat(c2lAvg.toFixed(1)) : null,
          sample_count: navClickToLeadOverall.count,
          is_proxy: true,
          note: "Based on navigator_request.created_at - ambassador earliest first_clicked_at",
        },
      };

      const byAmbassadorWithTiming = byAmbassadorWithNav.map((a: any) => {
        const navT = navTimingByAmbassador[a.ambassador_code];
        return {
          ...a,
          avg_session_to_lead_seconds: navT ? parseFloat((navT.total_seconds / navT.count).toFixed(1)) : null,
        };
      });

      const filterOptions = await pgQuery(`
        SELECT
          ARRAY_AGG(DISTINCT ambassador_code) FILTER (WHERE ambassador_code IS NOT NULL) AS ambassadors,
          ARRAY_AGG(DISTINCT utm_campaign) FILTER (WHERE utm_campaign IS NOT NULL) AS campaigns
        FROM ambassador_links
      `);

      const totalClicks = clickStats[0]?.total_clicks || 0;
      const totalSessions = sessionStats[0]?.total_sessions || 0;
      const totalTsl = tslStats[0]?.total_tsl || 0;
      const totalLeads = totalTsl + navCount;

      return res.json({
        summary: {
          total_clicks: totalClicks,
          total_sessions: totalSessions,
          unique_sessions: sessionStats[0]?.unique_sessions || 0,
          nav_requests: navCount,
          tsl_leads: totalTsl,
          total_leads: totalLeads,
        },
        funnel: {
          clicks: totalClicks,
          sessions: totalSessions,
          leads: totalLeads,
          click_to_session: totalClicks > 0 ? ((totalSessions / totalClicks) * 100).toFixed(1) : "0.0",
          session_to_lead: totalSessions > 0 ? ((totalLeads / totalSessions) * 100).toFixed(1) : "0.0",
          click_to_lead: totalClicks > 0 ? ((totalLeads / totalClicks) * 100).toFixed(1) : "0.0",
        },
        timing,
        speedBuckets: {
          buckets: clickToLeadBuckets,
          total: navClickToLeadOverall.count,
          is_proxy: true,
          note: "Click time is proxy-based (ambassador earliest first_clicked_at)",
        },
        byAmbassador: byAmbassadorWithTiming,
        byLink,
        filterOptions: filterOptions[0] || { ambassadors: [], campaigns: [] },
      });
    } catch (err: any) {
      console.log("[attribution] error:", err.message);
      return res.status(500).json({ error: "Failed to load attribution data" });
    }
  });

  app.get("/api/admin/commissions", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    const { ambassador, status, date_from, date_to } = req.query;
    try {
      let where = "WHERE 1=1";
      const params: any[] = [];
      let pIdx = 1;

      if (ambassador) {
        where += ` AND c.ambassador_code = $${pIdx}`;
        params.push(sanitizeCode(ambassador as string));
        pIdx++;
      }
      if (status) {
        where += ` AND c.status = $${pIdx}`;
        params.push(status);
        pIdx++;
      }
      if (date_from) {
        where += ` AND c.created_at >= $${pIdx}`;
        params.push(date_from);
        pIdx++;
      }
      if (date_to) {
        where += ` AND c.created_at < ($${pIdx}::date + interval '1 day')`;
        params.push(date_to);
        pIdx++;
      }

      const cPag = parsePagination(req, 200, 500);
      const commissions = await pgQuery(`
        SELECT
          c.id,
          c.ambassador_code,
          COALESCE(a.display_name, c.ambassador_code) AS ambassador_name,
          c.utm_id,
          c.application_id,
          c.revenue_amount::text,
          c.commission_percentage::text AS commission_percentage,
          c.commission_amount::text,
          c.status,
          c.created_at,
          c.payout_id
        FROM commissions c
        LEFT JOIN ambassadors a ON a.code = c.ambassador_code
        ${where}
        ORDER BY c.created_at DESC
        LIMIT ${cPag.limit} OFFSET ${cPag.offset}
      `, params);

      const summary = await pgQuery(`
        SELECT
          COUNT(*)::int AS total_count,
          COALESCE(SUM(commission_amount) FILTER (WHERE status = 'pending'), 0)::text AS pending_amount,
          COALESCE(SUM(commission_amount) FILTER (WHERE status = 'approved'), 0)::text AS approved_amount,
          COALESCE(SUM(commission_amount) FILTER (WHERE status = 'paid'), 0)::text AS paid_amount,
          COALESCE(SUM(commission_amount) FILTER (WHERE status = 'void'), 0)::text AS void_amount,
          COALESCE(SUM(commission_amount), 0)::text AS total_amount,
          COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_count,
          COUNT(*) FILTER (WHERE status = 'approved')::int AS approved_count,
          COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_count,
          COUNT(*) FILTER (WHERE status = 'void')::int AS void_count
        FROM commissions c
        ${where}
      `, params);

      const filterOptions = await pgQuery(`
        SELECT
          ARRAY_AGG(DISTINCT ambassador_code) FILTER (WHERE ambassador_code IS NOT NULL) AS ambassadors,
          ARRAY_AGG(DISTINCT status) FILTER (WHERE status IS NOT NULL) AS statuses
        FROM commissions
      `);

      return res.json({
        commissions,
        summary: summary[0] || {
          total_count: 0, pending_amount: "0", approved_amount: "0",
          paid_amount: "0", void_amount: "0", total_amount: "0",
          pending_count: 0, approved_count: 0, paid_count: 0, void_count: 0,
        },
        filterOptions: filterOptions[0] || { ambassadors: [], statuses: [] },
      });
    } catch (err: any) {
      console.log("[commissions] error:", err.message);
      return res.status(500).json({ error: "Failed to load commissions" });
    }
  });

  app.patch("/api/admin/commissions/:id/status", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    const { status: newStatus } = req.body;

    const validTransitions: Record<string, string[]> = {
      pending: ["approved", "void"],
      approved: ["paid", "void"],
      paid: [],
      void: [],
    };

    if (!["pending", "approved", "paid", "void"].includes(newStatus)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    try {
      const current = await pgQuery("SELECT status FROM commissions WHERE id = $1", [id]);
      if (current.length === 0) {
        return res.status(404).json({ error: "Commission not found" });
      }

      const currentStatus = current[0].status;
      const allowed = validTransitions[currentStatus] || [];
      if (!allowed.includes(newStatus)) {
        return res.status(400).json({ error: `Cannot transition from '${currentStatus}' to '${newStatus}'` });
      }

      await pgQuery("UPDATE commissions SET status = $1 WHERE id = $2", [newStatus, id]);
      return res.json({ success: true, id, status: newStatus });
    } catch (err: any) {
      console.log("[commission-status] error:", err.message);
      return res.status(500).json({ error: "Failed to update commission status" });
    }
  });

  // ── Payout Tracking ──────────────────────────────────────────────────
  app.get("/api/admin/payouts", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { ambassador, status, date_from, date_to } = req.query as Record<string, string>;
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;
      if (ambassador) { conditions.push(`a.code = $${idx++}`); params.push(ambassador); }
      if (status) { conditions.push(`p.payout_status = $${idx++}`); params.push(status); }
      if (date_from) { conditions.push(`p.created_at >= $${idx++}`); params.push(date_from); }
      if (date_to) { conditions.push(`p.created_at <= $${idx++}`); params.push(date_to); }
      const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

      const pPag = parsePagination(req, 200, 500);
      const payouts = await pgQuery(`
        SELECT p.*, a.display_name AS ambassador_name, a.code AS ambassador_code,
          COALESCE((SELECT SUM(c.commission_amount) FROM commissions c WHERE c.payout_id = p.id), 0) AS computed_total,
          COALESCE((SELECT COUNT(*) FROM commissions c WHERE c.payout_id = p.id), 0) AS commission_count
        FROM ambassador_payouts p
        JOIN ambassadors a ON a.id = p.ambassador_id
        ${where}
        ORDER BY p.created_at DESC
        LIMIT ${pPag.limit} OFFSET ${pPag.offset}
      `, params);

      const summaryRows = await pgQuery(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE p.payout_status = 'pending')::int AS pending_count,
          COUNT(*) FILTER (WHERE p.payout_status = 'paid')::int AS paid_count,
          COALESCE(SUM(p.total_amount) FILTER (WHERE p.payout_status = 'paid'), 0) AS total_paid_amount,
          COUNT(*) FILTER (WHERE p.payout_status = 'draft')::int AS draft_count,
          COUNT(*) FILTER (WHERE p.payout_status = 'cancelled')::int AS cancelled_count
        FROM ambassador_payouts p
        JOIN ambassadors a ON a.id = p.ambassador_id
        ${where}
      `, params);

      const ambassadorList = await pgQuery(`SELECT id, display_name AS full_name, code AS ambassador_code FROM ambassadors WHERE status != 'archived' ORDER BY display_name`);

      return res.json({ payouts, summary: summaryRows[0] || {}, ambassadors: ambassadorList });
    } catch (err: any) {
      console.log("[payouts-list] error:", err.message);
      return res.status(500).json({ error: "Failed to fetch payouts" });
    }
  });

  app.post("/api/admin/payouts", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { ambassador_id, payout_period_start, payout_period_end, payout_method, notes } = req.body;
      if (!ambassador_id || !payout_period_start || !payout_period_end) {
        return res.status(400).json({ error: "ambassador_id, payout_period_start, payout_period_end are required" });
      }

      const rows = await pgQuery(`
        INSERT INTO ambassador_payouts (ambassador_id, payout_period_start, payout_period_end, payout_method, notes, payout_status)
        VALUES ($1, $2, $3, $4, $5, 'draft')
        RETURNING *
      `, [ambassador_id, payout_period_start, payout_period_end, payout_method || null, notes || null]);

      return res.json({ payout: rows[0] });
    } catch (err: any) {
      console.log("[payout-create] error:", err.message);
      return res.status(500).json({ error: "Failed to create payout" });
    }
  });

  app.get("/api/admin/payouts/:id", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { id } = req.params;
      const payoutRows = await pgQuery(`
        SELECT p.*, a.display_name AS ambassador_name, a.code AS ambassador_code
        FROM ambassador_payouts p
        JOIN ambassadors a ON a.id = p.ambassador_id
        WHERE p.id = $1
      `, [id]);

      if (payoutRows.length === 0) return res.status(404).json({ error: "Payout not found" });

      const commissions = await pgQuery(`
        SELECT c.*, a.display_name AS ambassador_name
        FROM commissions c
        LEFT JOIN ambassadors a ON a.code = c.ambassador_code
        WHERE c.payout_id = $1
        ORDER BY c.created_at DESC
      `, [id]);

      const eligibleCommissions = await pgQuery(`
        SELECT c.*, a.display_name AS ambassador_name
        FROM commissions c
        LEFT JOIN ambassadors a ON a.code = c.ambassador_code
        WHERE c.status = 'approved' AND c.payout_id IS NULL
          AND c.ambassador_code = (SELECT amb.code FROM ambassadors amb WHERE amb.id = $1)
        ORDER BY c.created_at DESC
      `, [payoutRows[0].ambassador_id]);

      return res.json({ payout: payoutRows[0], commissions, eligibleCommissions });
    } catch (err: any) {
      console.log("[payout-detail] error:", err.message);
      return res.status(500).json({ error: "Failed to fetch payout" });
    }
  });

  app.post("/api/admin/payouts/:id/commissions", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { id } = req.params;
      const { commission_ids } = req.body;
      if (!Array.isArray(commission_ids) || commission_ids.length === 0) {
        return res.status(400).json({ error: "commission_ids array required" });
      }

      const payout = await pgQuery("SELECT * FROM ambassador_payouts WHERE id = $1", [id]);
      if (payout.length === 0) return res.status(404).json({ error: "Payout not found" });
      if (payout[0].payout_status === "paid") return res.status(400).json({ error: "Cannot modify a paid payout" });
      if (payout[0].payout_status === "cancelled") return res.status(400).json({ error: "Cannot modify a cancelled payout" });

      const payoutAmbCode = await pgQuery("SELECT code FROM ambassadors WHERE id = $1", [payout[0].ambassador_id]);
      const ambCode = payoutAmbCode.length > 0 ? payoutAmbCode[0].code : null;

      const placeholders = commission_ids.map((_: string, i: number) => `$${i + 3}`).join(",");
      const updated = await pgQuery(`
        UPDATE commissions SET payout_id = $1
        WHERE id IN (${placeholders})
          AND status = 'approved'
          AND payout_id IS NULL
          AND ambassador_code = $2
        RETURNING id
      `, [id, ambCode, ...commission_ids]);

      const newTotal = await pgQuery("SELECT COALESCE(SUM(commission_amount), 0) AS total FROM commissions WHERE payout_id = $1", [id]);
      await pgQuery("UPDATE ambassador_payouts SET total_amount = $1, updated_at = NOW() WHERE id = $2", [newTotal[0].total, id]);

      return res.json({ linked: updated.length, total_amount: newTotal[0].total });
    } catch (err: any) {
      console.log("[payout-link] error:", err.message);
      return res.status(500).json({ error: "Failed to link commissions" });
    }
  });

  app.delete("/api/admin/payouts/:id/commissions/:commissionId", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { id, commissionId } = req.params;
      const payout = await pgQuery("SELECT * FROM ambassador_payouts WHERE id = $1", [id]);
      if (payout.length === 0) return res.status(404).json({ error: "Payout not found" });
      if (payout[0].payout_status === "paid") return res.status(400).json({ error: "Cannot modify a paid payout" });
      if (payout[0].payout_status === "cancelled") return res.status(400).json({ error: "Cannot modify a cancelled payout" });

      await pgQuery("UPDATE commissions SET payout_id = NULL WHERE id = $1 AND payout_id = $2", [commissionId, id]);

      const newTotal = await pgQuery("SELECT COALESCE(SUM(commission_amount), 0) AS total FROM commissions WHERE payout_id = $1", [id]);
      await pgQuery("UPDATE ambassador_payouts SET total_amount = $1, updated_at = NOW() WHERE id = $2", [newTotal[0].total, id]);

      return res.json({ success: true, total_amount: newTotal[0].total });
    } catch (err: any) {
      console.log("[payout-unlink] error:", err.message);
      return res.status(500).json({ error: "Failed to unlink commission" });
    }
  });

  app.patch("/api/admin/payouts/:id/status", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { id } = req.params;
      const { status: newStatus, confirmation_note, payout_method: payoutMethodUsed } = req.body;

      const validStatuses = ["draft", "pending", "paid", "cancelled"];
      if (!validStatuses.includes(newStatus)) return res.status(400).json({ error: "Invalid status" });

      const validTransitions: Record<string, string[]> = {
        draft: ["pending", "cancelled"],
        pending: ["paid", "cancelled"],
        paid: [],
        cancelled: [],
      };

      const rows = await pgQuery("SELECT * FROM ambassador_payouts WHERE id = $1", [id]);
      if (rows.length === 0) return res.status(404).json({ error: "Payout not found" });

      const current = rows[0].payout_status;
      if (!(validTransitions[current] || []).includes(newStatus)) {
        return res.status(400).json({ error: `Cannot transition from '${current}' to '${newStatus}'` });
      }

      if (newStatus === "paid") {
        await pgQuery(`
          UPDATE commissions SET status = 'paid' WHERE payout_id = $1 AND status = 'approved'
        `, [id]);
        const extraSets: string[] = [];
        const extraVals: any[] = [id];
        let pi = 2;
        if (confirmation_note) { extraSets.push(`confirmation_note = $${pi++}`); extraVals.push(confirmation_note); }
        if (payoutMethodUsed) { extraSets.push(`payout_method = $${pi++}`); extraVals.push(payoutMethodUsed); }
        await pgQuery(`
          UPDATE ambassador_payouts SET payout_status = 'paid', paid_at = NOW(), updated_at = NOW()${extraSets.length ? ", " + extraSets.join(", ") : ""} WHERE id = $1
        `, extraVals);
      } else if (newStatus === "cancelled") {
        await pgQuery("UPDATE commissions SET payout_id = NULL WHERE payout_id = $1 AND status != 'paid'", [id]);
        const newTotal = await pgQuery("SELECT COALESCE(SUM(commission_amount), 0) AS total FROM commissions WHERE payout_id = $1", [id]);
        await pgQuery("UPDATE ambassador_payouts SET payout_status = 'cancelled', total_amount = $1, updated_at = NOW() WHERE id = $2", [newTotal[0].total, id]);
      } else {
        await pgQuery("UPDATE ambassador_payouts SET payout_status = $1, updated_at = NOW() WHERE id = $2", [newStatus, id]);
      }

      return res.json({ success: true, id, status: newStatus });
    } catch (err: any) {
      console.log("[payout-status] error:", err.message);
      return res.status(500).json({ error: "Failed to update payout status" });
    }
  });

  app.delete("/api/admin/payouts/:id", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });
    try {
      const { id } = req.params;
      const rows = await pgQuery("SELECT payout_status FROM ambassador_payouts WHERE id = $1", [id]);
      if (rows.length === 0) return res.status(404).json({ error: "Payout not found" });
      if (!["cancelled", "draft"].includes(rows[0].payout_status)) {
        return res.status(400).json({ error: "Can only delete cancelled or draft payouts" });
      }
      await pgQuery("DELETE FROM ambassador_payouts WHERE id = $1", [id]);
      return res.json({ success: true, deleted: id });
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to delete payout" });
    }
  });

  app.get("/a/:utmId", async (req, res) => {
    try {
      const rows = await pgQuery(
        `UPDATE ambassador_links
         SET click_count = click_count + 1,
             first_clicked_at = COALESCE(first_clicked_at, NOW()),
             last_clicked_at = NOW()
         WHERE utm_id = $1 AND is_active = true
         RETURNING full_url`,
        [req.params.utmId]
      );
      if (rows.length === 0) {
        return res.status(404).send("Link not found");
      }
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");
      return res.redirect(302, rows[0].full_url);
    } catch (err: any) {
      console.log("[ambassador] short link error:", err.message);
      return res.status(500).send("Server error");
    }
  });

  app.get("/api/admin/ambassador-links/:id/qr", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    try {
      const rows = await pgQuery(`SELECT full_url, utm_id, link_name FROM ambassador_links WHERE id = $1`, [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: "Link not found" });

      const kebabName = (rows[0].link_name || rows[0].utm_id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const png = await QRCode.toBuffer(rows[0].full_url, { width: 400, margin: 2, type: "png" });
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", `inline; filename="${kebabName}.png"`);
      return res.send(png);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  app.get("/api/admin/ambassador-links/qr-by-utm/:utmId", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    try {
      const rows = await pgQuery(`SELECT full_url, utm_id, link_name FROM ambassador_links WHERE utm_id = $1`, [req.params.utmId]);
      if (rows.length === 0) return res.status(404).json({ error: "Link not found" });

      const kebabName = (rows[0].link_name || rows[0].utm_id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const png = await QRCode.toBuffer(rows[0].full_url, { width: 400, margin: 2, type: "png" });
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", `inline; filename="${kebabName}.png"`);
      return res.send(png);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  app.get("/api/admin/ambassador-pack/:code", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    const code = sanitizeCode(req.params.code);
    const format = (req.query.format as string) || "json";

    try {
      const rows = await pgQuery(
        `SELECT id, link_name, utm_id, full_url, ambassador_name, audience_type, channel_type, utm_campaign, is_active, click_count, first_clicked_at, last_clicked_at, created_at
         FROM ambassador_links WHERE ambassador_code = $1 ORDER BY audience_type, channel_type`,
        [code]
      );
      if (rows.length === 0) return res.status(404).json({ error: "No links found for this ambassador" });

      const baseUrl = `https://veterancare.com`;
      const pack = rows.map((r: any) => ({
        link_name: r.link_name,
        utm_id: r.utm_id,
        full_url: r.full_url,
        short_url: `${baseUrl}/a/${r.utm_id}`,
        qr_url: `${baseUrl}/api/admin/ambassador-links/qr-by-utm/${r.utm_id}`,
        audience: r.audience_type,
        channel: r.channel_type,
        campaign: r.utm_campaign,
        active: r.is_active,
        click_count: r.click_count || 0,
        first_clicked_at: r.first_clicked_at || null,
        last_clicked_at: r.last_clicked_at || null,
      }));

      if (format === "csv") {
        const header = "link_name,utm_id,full_url,short_url,qr_url,audience,channel,campaign,click_count,first_clicked_at,last_clicked_at";
        const csvRows = pack.map((p: any) =>
          `"${p.link_name}","${p.utm_id}","${p.full_url}","${p.short_url}","${p.qr_url}","${p.audience}","${p.channel}","${p.campaign}",${p.click_count},"${p.first_clicked_at || ''}","${p.last_clicked_at || ''}"`
        );
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${code}_link_pack.csv"`);
        return res.send([header, ...csvRows].join("\n"));
      }

      return res.json({
        ambassador_code: code,
        ambassador_name: rows[0].ambassador_name,
        total_links: pack.length,
        links: pack,
      });
    } catch (err: any) {
      console.log("[ambassador] pack error:", err.message);
      return res.status(500).json({ error: "Failed to retrieve pack" });
    }
  });

  const lookupAttempts = new Map<string, { count: number; resetAt: number }>();
  app.get("/api/ambassador/lookup/:code", async (req, res) => {
    const ip = req.ip || "unknown";
    const now = Date.now();
    const entry = lookupAttempts.get(ip);
    if (entry && entry.resetAt > now) {
      if (entry.count >= 10) return res.status(429).json({ error: "Too many requests" });
      entry.count++;
    } else {
      lookupAttempts.set(ip, { count: 1, resetAt: now + 60000 });
    }
    const code = sanitizeCode(req.params.code);
    if (!code) return res.status(400).json({ error: "Invalid code" });
    try {
      const rows = await pgQuery(
        `SELECT display_name, first_name FROM ambassadors WHERE code = $1 AND status = 'active'`,
        [code]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Not found" });
      return res.json({ name: rows[0].display_name, first_name: rows[0].first_name });
    } catch {
      return res.status(500).json({ error: "Failed" });
    }
  });

  const ambassadorDashboardAttempts = new Map<string, { count: number; resetAt: number }>();
  app.get("/api/ambassador/dashboard/:code", async (req, res) => {
    const ip = req.ip || "unknown";
    const now = Date.now();
    const entry = ambassadorDashboardAttempts.get(ip);
    if (entry && entry.resetAt > now) {
      if (entry.count >= 20) {
        return res.status(429).json({ error: "Too many requests" });
      }
      entry.count++;
    } else {
      ambassadorDashboardAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
    }

    const code = sanitizeCode(req.params.code);
    if (!code) return res.status(400).json({ error: "Invalid code" });

    try {
      const ambRows = await pgQuery(
        `SELECT id, code, display_name, first_name, last_name, email, phone, commission_rate, region_type, region_value, status
         FROM ambassadors WHERE code = $1 AND status = 'active'`,
        [code]
      );
      if (ambRows.length === 0) return res.status(404).json({ error: "Invalid code" });

      const ambassador = ambRows[0];

      const links = await pgQuery(
        `SELECT id, link_name, utm_id, full_url, audience_type, channel_type, utm_campaign, click_count, is_active
         FROM ambassador_links WHERE ambassador_code = $1 AND is_active = true
         ORDER BY audience_type, channel_type`,
        [code]
      );

      const baseUrl = "https://veterancare.com";
      const campaigns: Record<string, { links: any[]; templates: Record<string, any> }> = {};

      const CAMPAIGN_META: Record<string, { title: string; description: string; audience: string }> = {
        veteran: { title: "Veterans & Dependents", description: "Drive veterans and dependents to the platform for help and resources", audience: "veteran" },
        case_manager: { title: "Case Manager Outreach", description: "Recruit organizations, case managers, and nonprofits", audience: "case_manager" },
        partner: { title: "Partner / Business Outreach", description: "Recruit paying business partners for the directory", audience: "partner" },
        general: { title: "Get Help Now", description: "General awareness and community sharing — direct help flow", audience: "general" },
        homepage: { title: "General Share Link (Homepage)", description: "Soft entry homepage traffic — broad sharing for awareness", audience: "homepage" },
      };

      const OUTREACH_TEMPLATES: Record<string, Record<string, { subject?: string; body: string }>> = {
        veteran: {
          email: {
            subject: "Free Resources for Veterans — Veteran Care",
            body: "Hi,\n\nI wanted to share a great resource for veterans in our area. Veteran Care connects veterans with housing, employment, benefits assistance, mental health support, and more — all in one place, completely free.\n\nCheck it out here: {{link}}\n\nIf you know any veterans who could use help, please share this with them.\n\nThank you for supporting our veterans!"
          },
          text: { body: "Hey! Check out Veteran Care — it connects veterans with free resources for housing, jobs, benefits, mental health & more. Share with any veteran who needs help: {{link}}" },
          facebook: { body: "🇺🇸 Know a veteran who needs help? Veteran Care connects veterans with housing, jobs, benefits, mental health support, and more — all FREE. Share this with someone who served. {{link}} #VeteranCare #SupportOurVeterans" },
          instagram: { body: "🇺🇸 Veterans deserve better access to resources. Veteran Care connects them with housing, jobs, benefits & more — all in one place, totally free.\n\nLink in bio or visit: {{link}}\n\n#VeteranCare #Veterans #SupportOurVets #MilitaryFamily" },
          linkedin: { body: "I'm proud to support Veteran Care — a platform that connects U.S. military veterans with critical resources including housing, employment, benefits assistance, and mental health support.\n\nIf you know a veteran who could use help, please share this link: {{link}}\n\nTogether we can make sure no veteran falls through the cracks." },
        },
        case_manager: {
          email: {
            subject: "Partner with Veteran Care — Free Resource Platform for Your Clients",
            body: "Hi,\n\nI'm reaching out because Veteran Care is a free resource platform designed specifically for U.S. military veterans. We connect veterans with 14+ categories of support including housing, employment, benefits, mental health, and more.\n\nAs a case manager or social services organization, you can use Veteran Care as a referral tool for your veteran clients at no cost.\n\nLearn more here: {{link}}\n\nI'd love to discuss how we can work together to better serve veterans in our community."
          },
          text: { body: "Hi! Veteran Care is a free platform connecting veterans with 14+ categories of resources. Great referral tool for case managers & nonprofits. Check it out: {{link}}" },
          facebook: { body: "📋 Attention case managers, social workers & nonprofit leaders! Veteran Care is a FREE platform connecting veterans with 14+ categories of support. Use it as a referral tool for your clients. Learn more: {{link}}" },
          instagram: { body: "📋 Case managers & social workers — Veteran Care is a free referral tool connecting veterans with housing, jobs, benefits, mental health & more.\n\n14+ resource categories. Zero cost.\n\nLearn more: {{link}}\n\n#CaseManagement #VeteranServices #SocialWork #Nonprofits" },
          linkedin: { body: "Attention case managers, social workers, and nonprofit leaders:\n\nVeteran Care is a free resource platform connecting U.S. military veterans with 14+ categories of critical support — housing, employment, benefits, mental health, legal services, and more.\n\nIt's an invaluable referral tool for anyone working with veteran populations. Learn more: {{link}}" },
        },
        partner: {
          email: {
            subject: "Grow Your Business with Veteran Care — Trusted Services Partner Program",
            body: "Hi,\n\nI'm reaching out because Veteran Care is building a network of trusted business partners who serve the veteran community.\n\nAs a Trusted Services Partner, your business gets listed in our directory, receives direct referrals from veterans in your area, and gains access to a growing audience of veterans and their families.\n\nPlans start at $99/month with optional add-ons for premium placement.\n\nApply here: {{link}}\n\nLet me know if you have any questions!"
          },
          text: { body: "Hi! Want to reach more veteran customers? Veteran Care's Trusted Services Partner program gets your business in front of veterans in your area. Plans from $99/mo. Apply: {{link}}" },
          facebook: { body: "🏢 Business owners — want to reach the veteran community? Join Veteran Care's Trusted Services Partner network! Get listed in our directory and receive direct referrals from veterans. Apply today: {{link}}" },
          instagram: { body: "🏢 Grow your business by serving those who served.\n\nJoin Veteran Care's Trusted Services Partner network and get your business in front of veterans in your area.\n\n✅ Directory listing\n✅ Direct referrals\n✅ Premium placement options\n\nApply: {{link}}\n\n#VeteranCare #SmallBusiness #VeteranOwned #BusinessGrowth" },
          linkedin: { body: "Looking to grow your business while supporting veterans?\n\nVeteran Care's Trusted Services Partner program connects your business directly with the veteran community through our trusted directory.\n\nBenefits include directory listing, direct referrals, and premium placement options.\n\nApply here: {{link}}" },
        },
        general: {
          email: {
            subject: "Veteran Care — Supporting Those Who Served",
            body: "Hi,\n\nI wanted to share Veteran Care with you — it's a free platform that connects U.S. military veterans with critical resources including housing, employment, benefits assistance, mental health support, and more.\n\nWhether you're a veteran, know one, or simply want to support the community, check it out: {{link}}\n\nPlease share this with anyone who might benefit. Together we can make sure no veteran is left without help."
          },
          text: { body: "Check out Veteran Care — a free platform connecting veterans with housing, jobs, benefits, mental health & more. Share with anyone who could use it: {{link}}" },
          facebook: { body: "🇺🇸 Veteran Care connects U.S. military veterans with free resources — housing, jobs, benefits, mental health support & more. Know someone who served? Share this! {{link}} #VeteranCare #SupportOurVeterans" },
          instagram: { body: "🇺🇸 Veteran Care is a free platform connecting veterans with the resources they need — housing, jobs, benefits, mental health & more.\n\nShare with someone who served: {{link}}\n\n#VeteranCare #Veterans #SupportOurVets" },
          linkedin: { body: "I'm sharing Veteran Care — a platform connecting U.S. military veterans with critical resources including housing, employment, benefits assistance, and mental health support. All free.\n\nIf you know a veteran or work with the military community, please share: {{link}}" },
        },
        homepage: {
          email: {
            subject: "Veteran Care — Free Resources for Veterans",
            body: "Hi,\n\nI wanted to share Veteran Care — a free platform built for U.S. military veterans and their families. It connects veterans with housing, employment, benefits, mental health support, and more — all in one place.\n\nVisit the site: {{link}}\n\nFeel free to share with anyone who could benefit!"
          },
          text: { body: "Check out Veteran Care — free resources for veterans including housing, jobs, benefits & more. Visit: {{link}}" },
          facebook: { body: "🇺🇸 Veteran Care is a free platform connecting veterans with housing, jobs, benefits, mental health support & more. Visit and share: {{link}} #VeteranCare #SupportOurVeterans" },
          instagram: { body: "🇺🇸 Veteran Care — free resources for U.S. military veterans.\n\nHousing, jobs, benefits, mental health & more — all in one place.\n\nVisit: {{link}}\n\n#VeteranCare #Veterans #SupportOurVets" },
          linkedin: { body: "Veteran Care is a free platform connecting U.S. military veterans with critical resources — housing, employment, benefits, mental health support, and more.\n\nVisit and share with your network: {{link}}" },
        },
      };

      for (const [campaignKey, meta] of Object.entries(CAMPAIGN_META)) {
        const audience = meta.audience;
        const campaignLinks = links
          .filter((l: any) => l.audience_type === audience)
          .map((l: any) => ({
            id: l.id,
            channel: l.channel_type,
            utm_id: l.utm_id,
            full_url: l.full_url,
            short_url: `${baseUrl}/a/${l.utm_id}`,
            qr_url: `${baseUrl}/api/ambassador/qr/${l.utm_id}`,
            click_count: l.click_count || 0,
          }));

        const HTML_BUTTON_LABELS: Record<string, string> = {
          veteran: "Get Help Now",
          case_manager: "Explore Resources",
          partner: "Apply Now",
          general: "Learn More",
          homepage: "Visit Veteran Care",
        };

        const templates: Record<string, any> = {};
        const channelTemplates = OUTREACH_TEMPLATES[campaignKey] || {};
        for (const [channel, tmpl] of Object.entries(channelTemplates)) {
          const matchingLink = campaignLinks.find((l: any) => l.channel === channel)
            || campaignLinks.find((l: any) => l.channel === "email")
            || campaignLinks[0];
          if (!matchingLink) continue;
          const link = matchingLink.short_url;
          templates[channel] = {
            subject: (tmpl as any).subject || null,
            body: (tmpl as any).body.replace(/\{\{link\}\}/g, link),
            tracking_link: link,
          };
        }

        const primaryLink = campaignLinks.find((l: any) => l.channel === "email")?.short_url
          || campaignLinks[0]?.short_url || "";
        const btnLabel = HTML_BUTTON_LABELS[campaignKey] || "Learn More";
        const htmlButton = primaryLink ? `<a href="${primaryLink}" style="background:#166534;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-family:Arial,sans-serif;font-size:16px;">${btnLabel}</a>` : null;

        campaigns[campaignKey] = { links: campaignLinks, templates, html_button: htmlButton, button_label: btnLabel };
      }

      return res.json({
        ambassador: {
          code: ambassador.code,
          name: ambassador.display_name,
          first_name: ambassador.first_name,
          last_name: ambassador.last_name,
          email: ambassador.email,
          phone: ambassador.phone,
          commission_rate: ambassador.commission_rate,
          region_type: ambassador.region_type,
          region_value: ambassador.region_value,
        },
        campaigns,
      });
    } catch (err: any) {
      console.log("[ambassador] dashboard error:", err.message);
      return res.status(500).json({ error: "Failed to load dashboard" });
    }
  });

  app.get("/api/ambassador/qr/:utmId", async (req, res) => {
    try {
      const rows = await pgQuery(
        `SELECT full_url, utm_id FROM ambassador_links WHERE utm_id = $1 AND is_active = true`,
        [req.params.utmId]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Link not found" });

      const png = await QRCode.toBuffer(rows[0].full_url, { width: 400, margin: 2, type: "png" });
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", `inline; filename="${rows[0].utm_id}.png"`);
      return res.send(png);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  const MESSAGE_TEMPLATES: Record<string, Record<string, { message_title: string; suggested_copy: string }>> = {
    general: {
      facebook: {
        message_title: "General Awareness – Facebook",
        suggested_copy: "Know a veteran who needs help? Veteran Care connects SC veterans with housing, jobs, benefits, and more — all in one place. Click below to get started. {{short_url}}"
      },
      instagram: {
        message_title: "General Awareness – Instagram",
        suggested_copy: "SC veterans deserve better access to resources. Veteran Care puts housing, jobs, benefits & more at your fingertips. Link in bio 👆 {{short_url}}"
      },
      email: {
        message_title: "General Awareness – Email",
        suggested_copy: "Hi,\n\nI wanted to share a resource that's helping veterans across South Carolina. Veteran Care is a free platform connecting veterans with housing, jobs, benefits, and more.\n\nCheck it out here: {{short_url}}\n\nFeel free to share with anyone who might benefit."
      },
      linkedin: {
        message_title: "General Awareness – LinkedIn",
        suggested_copy: "Excited to share Veteran Care — a platform connecting South Carolina veterans with critical resources including housing, employment, benefits, and more. If you know veterans or organizations that could benefit: {{short_url}}"
      },
      text: {
        message_title: "General Awareness – SMS",
        suggested_copy: "Hey! Check out Veteran Care — free resource hub for SC veterans. Housing, jobs, benefits & more: {{short_url}}"
      },
      qr: {
        message_title: "General Awareness – QR/Print",
        suggested_copy: "Scan this QR code to access free veteran resources in South Carolina — housing, jobs, benefits, and more through Veteran Care."
      },
      flyer: {
        message_title: "General Awareness – Flyer",
        suggested_copy: "VETERAN CARE — Free Resources for SC Veterans\nHousing • Jobs • Benefits • Healthcare & More\nVisit: {{short_url}}\nOr scan the QR code to get started today."
      }
    },
    veteran: {
      facebook: {
        message_title: "Veteran Help – Facebook",
        suggested_copy: "If you're a veteran in SC looking for help with housing, jobs, benefits, or healthcare — Veteran Care can connect you with trusted local resources. Get started: {{short_url}}"
      },
      instagram: {
        message_title: "Veteran Help – Instagram",
        suggested_copy: "Veterans — need help with housing, jobs, or benefits? Veteran Care has your back. Free resources across SC. {{short_url}}"
      },
      email: {
        message_title: "Veteran Help – Email",
        suggested_copy: "Hi,\n\nIf you or someone you know is a veteran in South Carolina needing help — Veteran Care connects you directly with trusted local resources for housing, employment, benefits, healthcare, and more.\n\nGet help here: {{short_url}}\n\nYou're not alone."
      },
      linkedin: {
        message_title: "Veteran Help – LinkedIn",
        suggested_copy: "Veterans in South Carolina: if you need support with housing, employment, benefits, or healthcare, Veteran Care is a free resource hub built for you. Get connected: {{short_url}}"
      },
      text: {
        message_title: "Veteran Help – SMS",
        suggested_copy: "Need help? Veteran Care connects SC veterans with housing, jobs, benefits & more — free. {{short_url}}"
      },
      qr: {
        message_title: "Veteran Help – QR/Print",
        suggested_copy: "Scan this QR code to access free help for SC veterans — housing, jobs, benefits, healthcare, and more."
      },
      flyer: {
        message_title: "Veteran Help – Flyer",
        suggested_copy: "NEED HELP? You've Earned It.\nVeteran Care connects SC veterans with:\n• Housing • Jobs • Benefits • Healthcare\nVisit: {{short_url}}\nOr scan the QR code."
      }
    },
    case_manager: {
      facebook: {
        message_title: "Case Manager Outreach – Facebook",
        suggested_copy: "Case managers & nonprofits: Veteran Care is a free resource hub for SC veterans. Use it to connect your clients with housing, jobs, benefits & more. Explore: {{short_url}}"
      },
      instagram: {
        message_title: "Case Manager Outreach – Instagram",
        suggested_copy: "Serving veterans? Veteran Care is a free resource directory for SC — housing, jobs, benefits, healthcare. Share it with your clients. {{short_url}}"
      },
      email: {
        message_title: "Case Manager Outreach – Email",
        suggested_copy: "Hi,\n\nI wanted to share Veteran Care — a free resource platform designed to help case managers and nonprofits connect SC veterans with trusted local services.\n\nBrowse the resource center: {{short_url}}\n\nIt's a great tool for client referrals and outreach."
      },
      linkedin: {
        message_title: "Case Manager Outreach – LinkedIn",
        suggested_copy: "Attention case managers, social workers, and veteran-serving nonprofits: Veteran Care offers a free, searchable resource directory for South Carolina veterans. Explore: {{short_url}}"
      },
      text: {
        message_title: "Case Manager Outreach – SMS",
        suggested_copy: "Hi! Veteran Care is a free SC veteran resource directory — great for client referrals. Check it out: {{short_url}}"
      },
      qr: {
        message_title: "Case Manager Outreach – QR/Print",
        suggested_copy: "Scan this QR code to explore free veteran resources in SC — ideal for case managers, social workers, and nonprofit teams."
      },
      flyer: {
        message_title: "Case Manager Outreach – Flyer",
        suggested_copy: "CASE MANAGERS & NONPROFITS\nVeteran Care — Free SC Veteran Resource Directory\nConnect your clients with trusted services.\nVisit: {{short_url}}\nOr scan the QR code."
      }
    },
    partner: {
      facebook: {
        message_title: "Partner Outreach – Facebook",
        suggested_copy: "Local businesses & service providers: join Veteran Care's Trusted Services network to reach SC veterans who need your help. Learn more: {{short_url}}"
      },
      instagram: {
        message_title: "Partner Outreach – Instagram",
        suggested_copy: "Want to serve SC veterans? Join Veteran Care's Trusted Services directory and connect with those who need you most. {{short_url}}"
      },
      email: {
        message_title: "Partner Outreach – Email",
        suggested_copy: "Hi,\n\nI'd like to introduce you to Veteran Care — a growing platform connecting South Carolina veterans with trusted local services.\n\nIf your organization serves veterans, you can join as a Trusted Service partner. Learn more: {{short_url}}\n\nIt's a great way to grow your reach while supporting those who served."
      },
      linkedin: {
        message_title: "Partner Outreach – LinkedIn",
        suggested_copy: "Organizations serving veterans: Veteran Care is building South Carolina's trusted services network. Join as a partner to reach veterans who need your services. {{short_url}}"
      },
      text: {
        message_title: "Partner Outreach – SMS",
        suggested_copy: "Serve veterans? Join Veteran Care's Trusted Services network in SC. Learn more: {{short_url}}"
      },
      qr: {
        message_title: "Partner Outreach – QR/Print",
        suggested_copy: "Scan this QR code to learn how your organization can join Veteran Care's Trusted Services network in South Carolina."
      },
      flyer: {
        message_title: "Partner Outreach – Flyer",
        suggested_copy: "JOIN VETERAN CARE'S TRUSTED SERVICES NETWORK\nReach SC veterans who need your services.\nVisit: {{short_url}}\nOr scan the QR code to apply."
      }
    }
  };

  const COMMISSION_NOTES = {
    how_tracking_works: "Every ambassador link contains a unique utm_id that tracks clicks, sessions, leads, and partner payments back to the ambassador who shared it.",
    what_gets_credited: "When a veteran, case manager, or business clicks your link and later submits a lead or completes a partner payment, the revenue is attributed to your unique ambassador link.",
    links_are_unique: "Each link in your pack is unique to you. Do not share your tracking links with other ambassadors — each person should have their own pack.",
    attribution_rule: "First-touch attribution: the first ambassador link a user clicks is permanently credited. If they later click a different ambassador's link, the original ambassador keeps the credit."
  };

  app.get("/api/admin/ambassador-distribution/:code", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });

    const code = sanitizeCode(req.params.code);
    const format = (req.query.format as string) || "json";

    try {
      const rows = await pgQuery(
        `SELECT id, link_name, utm_id, full_url, ambassador_name, audience_type, channel_type, utm_campaign, is_active, click_count, first_clicked_at, last_clicked_at, created_at
         FROM ambassador_links WHERE ambassador_code = $1 AND is_active = true ORDER BY audience_type, channel_type`,
        [code]
      );
      if (rows.length === 0) return res.status(404).json({ error: "No links found for this ambassador" });

      const baseUrl = `https://veterancare.com`;
      const ambassadorName = rows[0].ambassador_name;

      const byAudience: Record<string, any[]> = {};

      const DIST_BUTTON_LABELS: Record<string, string> = {
        veteran: "Get Help Now",
        general: "Get Help Now",
        case_manager: "Explore Resources",
        partner: "Apply Now",
      };

      for (const r of rows) {
        const shortUrl = `${baseUrl}/a/${r.utm_id}`;
        const qrUrl = `${baseUrl}/api/admin/ambassador-links/qr-by-utm/${r.utm_id}`;
        const template = MESSAGE_TEMPLATES[r.audience_type]?.[r.channel_type];
        const suggestedCopy = template
          ? template.suggested_copy.replace(/\{\{short_url\}\}/g, shortUrl).replace(/\{\{ambassador_name\}\}/g, ambassadorName)
          : null;

        const btnLabel = DIST_BUTTON_LABELS[r.audience_type] || "Learn More";
        const htmlButton = `<a href="${shortUrl}" style="background:#166534;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-family:Arial,sans-serif;font-size:16px;">${btnLabel}</a>`;

        const entry = {
          link_name: r.link_name,
          utm_id: r.utm_id,
          full_url: r.full_url,
          short_url: shortUrl,
          qr_url: qrUrl,
          audience: r.audience_type,
          channel: r.channel_type,
          campaign: r.utm_campaign,
          message_title: template?.message_title || `${r.audience_type} – ${r.channel_type}`,
          suggested_copy: suggestedCopy,
          html_button: htmlButton,
          button_label: btnLabel,
          click_count: r.click_count || 0,
          last_clicked_at: r.last_clicked_at || null,
        };

        if (!byAudience[r.audience_type]) byAudience[r.audience_type] = [];
        byAudience[r.audience_type].push(entry);
      }

      if (format === "csv") {
        const header = "link_name,utm_id,short_url,qr_url,audience,channel,message_title,suggested_copy";
        const csvRows: string[] = [];
        for (const audience of Object.keys(byAudience)) {
          for (const entry of byAudience[audience]) {
            const copy = (entry.suggested_copy || "").replace(/"/g, '""').replace(/\n/g, " ");
            csvRows.push(`"${entry.link_name}","${entry.utm_id}","${entry.short_url}","${entry.qr_url}","${entry.audience}","${entry.channel}","${entry.message_title}","${copy}"`);
          }
        }
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${code}_distribution_pack.csv"`);
        return res.send([header, ...csvRows].join("\n"));
      }

      return res.json({
        ambassador_code: code,
        ambassador_name: ambassadorName,
        total_links: rows.length,
        audiences: byAudience,
        commission_info: COMMISSION_NOTES,
      });
    } catch (err: any) {
      console.log("[ambassador] distribution pack error:", err.message);
      return res.status(500).json({ error: "Failed to generate distribution pack" });
    }
  });

  app.get("/api/categories", async (_req, res) => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const CATEGORY_ORDER: string[] = [
      "crisis-help",
      "mental-health",
      "disabled-veterans",
      "housing-home",
      "food-assistance",
      "benefits-assistance",
      "family-support",
      "community-support",
      "employment-support",
      "education-training",
      "transportation",
      "financial-credit",
      "legal-services",
      "healthcare-services",
      "wellness-recovery",
      "end-of-life-services",
    ];

    const normalized = normalizeCategoryList((data || []) as { slug: string }[]);

    const sorted = normalized.sort((a: any, b: any) => {
      const ai = CATEGORY_ORDER.indexOf(a.slug);
      const bi = CATEGORY_ORDER.indexOf(b.slug);
      const aIdx = ai === -1 ? 999 : ai;
      const bIdx = bi === -1 ? 999 : bi;
      return aIdx - bIdx;
    });

    return res.json(sorted);
  });

  async function searchTrustedServicesForResources(q: string, userLat?: number, userLng?: number, radiusMiles?: number): Promise<any[]> {
    try {
      const normalized = normalizeSearchTerm(q);
      const raw = q.toLowerCase();
      const patterns = new Set([normalized, raw]);
      const orClauses = [...patterns].flatMap(p => [
        `LOWER(ts.name) LIKE '%${p.replace(/'/g, "''")}%'`,
        `LOWER(ts.short_description) LIKE '%${p.replace(/'/g, "''")}%'`,
        `LOWER(ts.city) LIKE '%${p.replace(/'/g, "''")}%'`,
      ]);
      const rows = await pgQuery(
        `SELECT ts.id, ts.name AS title, ts.short_description, ts.website_url, ts.phone, ts.email,
                ts.address, ts.city, ts.state, ts.zip, ts.is_featured AS sponsored, ts.is_featured,
                ts.latitude, ts.longitude, ts.is_national,
                json_build_object('slug', tsc.slug, 'name', tsc.name) AS trusted_service_categories,
                'trusted_service' AS source_type
         FROM trusted_services ts
         INNER JOIN trusted_service_categories tsc ON ts.category_id = tsc.id
         WHERE ts.is_active IS NOT false AND (${orClauses.join(" OR ")})
         ORDER BY ts.is_featured DESC, ts.name ASC
         LIMIT 20`
      );
      return rows.map((r: any) => {
        let distance_miles: number | null = null;
        if (userLat != null && userLng != null && radiusMiles != null) {
          if (r.latitude != null && r.longitude != null) {
            distance_miles = Math.round(haversineDistance(userLat, userLng, r.latitude, r.longitude) * 10) / 10;
          } else {
            distance_miles = r.is_national ? 99999 : 99998;
          }
        }
        return {
          ...r,
          id: `ts-${r.id}`,
          _trusted_service_id: r.id,
          distance_miles,
          source_type: "trusted_service",
        };
      });
    } catch (err: any) {
      console.log(`[searchTrustedServicesForResources] error: ${err.message}`);
      return [];
    }
  }

  app.get("/api/resources", async (req, res) => {
    const { category, state, q, sub } = req.query;

    const userLat = req.query.user_lat ? parseFloat(req.query.user_lat as string) : undefined;
    const userLng = req.query.user_lng ? parseFloat(req.query.user_lng as string) : undefined;
    const radiusMiles = req.query.radius_miles ? parseFloat(req.query.radius_miles as string) : undefined;
    const nearMeMode = userLat !== undefined && userLng !== undefined && radiusMiles !== undefined
      && !isNaN(userLat) && !isNaN(userLng) && !isNaN(radiusMiles);

    let query = supabase.from("resources").select(resourceSelectFields(!!category, !!sub));

    query = query.eq("status", "approved");

    if (category) {
      const supabaseSlug = toLegacy(category as string);
      query = query.eq("resource_categories.categories.slug", supabaseSlug);
    }

    if (sub) {
      query = query.eq("resource_subcategories.subcategories.slug", sub as string);
    }

    if (nearMeMode && hasGeoColumns) {
      const latDelta = radiusMiles! / 69.0;
      const lngDelta = radiusMiles! / (69.0 * Math.cos((userLat! * Math.PI) / 180));
      query = query.or(
        `and(latitude.gte.${userLat! - latDelta},latitude.lte.${userLat! + latDelta},longitude.gte.${userLng! - lngDelta},longitude.lte.${userLng! + lngDelta}),latitude.is.null,longitude.is.null`
      );
    } else {
      const city = req.query.city as string | undefined;
      const zip = req.query.zip as string | undefined;

      if (city || zip) {
        if (state) {
          query = query.or(`state.eq.${state},state.is.null`);
        }
        if (city) {
          query = query.ilike("city", `%${city}%`);
        }
        if (zip) {
          query = query.eq("zip", zip);
        }
      } else if (state) {
        query = query.or(`state.eq.${state},state.is.null`);
      }
    }

    if (q) {
      const normalized = `%${normalizeSearchTerm(q as string)}%`;
      const raw = `%${q}%`;
      const patterns = new Set([normalized, raw]);
      const orClauses = [...patterns].flatMap(p => [
        `title.ilike.${p}`,
        `short_description.ilike.${p}`,
        `city.ilike.${p}`,
        `state.ilike.${p}`,
        `eligibility.ilike.${p}`,
        `source_name.ilike.${p}`,
      ]);
      query = query.or(orClauses.join(","));
    }

    if (!nearMeMode) {
      query = query.order("sponsored", { ascending: false }).order("title");
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (nearMeMode && hasGeoColumns && data) {
      const localResults = data
        .map((r: any) => {
          if (r.latitude != null && r.longitude != null) {
            const dist = haversineDistance(userLat!, userLng!, r.latitude, r.longitude);
            return { ...r, distance_miles: Math.round(dist * 10) / 10 };
          }
          return { ...r, distance_miles: 99998 };
        })
        .filter((r: any) => r.latitude == null || r.longitude == null || (r.distance_miles !== null && r.distance_miles <= radiusMiles!))
        .sort((a: any, b: any) => (a.distance_miles ?? 99999) - (b.distance_miles ?? 99999));

      let nationalQuery = supabase.from("resources").select(resourceSelectFields(!!category, !!sub))
        .eq("status", "approved").is("state", null);
      if (category) {
        const supabaseSlug = toLegacy(category as string);
        nationalQuery = nationalQuery.eq("resource_categories.categories.slug", supabaseSlug);
      }
      if (sub) {
        nationalQuery = nationalQuery.eq("resource_subcategories.subcategories.slug", sub as string);
      }
      nationalQuery = nationalQuery.order("sponsored", { ascending: false }).order("title");
      const { data: nationalData } = await nationalQuery;

      const localIds = new Set(localResults.map((r: any) => r.id));
      const nationalResults = (nationalData || [])
        .filter((r: any) => !localIds.has(r.id))
        .map((r: any) => ({ ...r, distance_miles: 99999, is_national: true }));

      let trustedMatches: any[] = [];
      if (q && hasTrustedServicesTable) {
        trustedMatches = await searchTrustedServicesForResources(q as string, userLat, userLng, radiusMiles);
      }
      const allResults = [...localResults, ...trustedMatches, ...nationalResults]
        .sort((a, b) => (a.distance_miles ?? 99999) - (b.distance_miles ?? 99999));
      return res.json({ results: normalizeAllFieldsList(allResults), local_count: localResults.length });
    }

    let trustedMatches: any[] = [];
    if (q && hasTrustedServicesTable) {
      trustedMatches = await searchTrustedServicesForResources(q as string);
    }
    const baseResults = normalizeAllFieldsList(data || []);

    // F2.6: Insurance cross-population — surface seeded insurance providers
    // (pg-side trusted_services) inside the Resources insurance category.
    // Narrowly gated to the insurance category until full F3 cross-pop is approved.
    let seededInsurance: any[] = [];
    if (
      category &&
      hasTrustedServicesTable &&
      toCanonical(category as string) === "insurance"
    ) {
      try {
        const rows = await pgQuery(
          `SELECT ts.id, ts.name AS title, ts.short_description, ts.website_url,
                  ts.phone, ts.email, ts.address, ts.city, ts.state, ts.zip,
                  ts.is_featured, ts.is_featured AS sponsored, ts.is_national,
                  ts.verification_label,
                  json_build_object('slug', tsc.slug, 'name', tsc.name) AS trusted_service_categories,
                  'trusted_service' AS source_type
           FROM trusted_services ts
           INNER JOIN trusted_service_categories tsc ON ts.category_id = tsc.id
           WHERE tsc.slug = 'insurance' AND ts.is_active = true
           ORDER BY ts.is_featured DESC, ts.display_order ASC NULLS LAST, ts.name ASC`
        );
        seededInsurance = rows.map((r: any) => ({
          ...r,
          id: `ts-${r.id}`,
          _trusted_service_id: r.id,
          source_type: "trusted_service",
        }));
      } catch (err: any) {
        console.log(`[/api/resources insurance cross-pop] error: ${err.message}`);
      }
    }

    if (trustedMatches.length > 0 || seededInsurance.length > 0) {
      return res.json([...baseResults, ...seededInsurance, ...trustedMatches]);
    }
    return res.json(baseResults);
  });

  app.get("/api/locations/cities", async (req, res) => {
    const { state, category } = req.query;

    let query = supabase
      .from("resources")
      .select(category ? "city, resource_categories!inner(categories!inner(slug))" : "city, resource_categories(categories(slug))")
      .eq("status", "approved")
      .not("city", "is", null);

    if (state) {
      query = query.eq("state", state as string);
    }

    if (category) {
      query = query.eq("resource_categories.categories.slug", toLegacy(category as string));
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const cities = [...new Set((data || []).map((r: any) => r.city as string))].sort();
    return res.json(cities);
  });

  app.get("/api/locations/zips", async (req, res) => {
    const { state, city, category } = req.query;

    let query = supabase
      .from("resources")
      .select(category ? "zip, resource_categories!inner(categories!inner(slug))" : "zip, resource_categories(categories(slug))")
      .eq("status", "approved")
      .not("zip", "is", null);

    if (state) {
      query = query.eq("state", state as string);
    }

    if (city) {
      query = query.eq("city", city as string);
    }

    if (category) {
      query = query.eq("resource_categories.categories.slug", toLegacy(category as string));
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const zips = [...new Set((data || []).map((r: any) => r.zip as string))].sort();
    return res.json(zips);
  });

  app.get("/api/resources/:id", async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("resources")
      .select(`
        *,
        resource_categories(categories(id, name, slug))
      `)
      .eq("id", id)
      .eq("status", "approved")
      .single();

    if (error) {
      return res.status(404).json({ error: "Resource not found" });
    }

    return res.json(normalizeResourceCategories(data));
  });

  app.post("/api/resources/by-ids", async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.json([]);
    }
    const safeIds = ids.slice(0, 100);

    const { data, error } = await supabase
      .from("resources")
      .select(resourceSelectFields())
      .in("id", safeIds)
      .eq("status", "approved");

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json(normalizeResourceList(data || []));
  });

  app.get("/api/referral/me", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }
    try {
      const referralCode = await ensureUserReferralCode(user.id);
      const currentMonth = await getCurrentSweepstakesMonth();

      const entryRows = await pgQuery(
        `SELECT COALESCE(SUM(entry_count), 0)::int AS total
         FROM referral_entries WHERE user_id = $1 AND entry_month = $2`,
        [user.id, currentMonth]
      );

      const qualifiedRows = await pgQuery(
        `SELECT COUNT(*)::int AS total
         FROM user_referrals
         WHERE referrer_user_id = $1
           AND status = 'qualified'
           AND qualified_at >= $2::date
           AND qualified_at < ($2::date + interval '1 month')`,
        [user.id, `${currentMonth}-01`]
      );

      const rankRows = await pgQuery(
        `SELECT rank FROM (
           SELECT user_id,
             RANK() OVER (
               ORDER BY SUM(entry_count) DESC,
                        MAX(created_at) ASC,
                        user_id ASC
             ) AS rank
           FROM referral_entries
           WHERE entry_month = $1
           GROUP BY user_id
         ) ranked
         WHERE user_id = $2`,
        [currentMonth, user.id]
      );

      return res.json({
        userId: user.id,
        referralCode,
        referralLink: `https://veterancare.com/start?ref=${referralCode}`,
        currentMonth,
        currentMonthEntryCount: entryRows[0]?.total || 0,
        currentMonthQualifiedReferralCount: qualifiedRows[0]?.total || 0,
        leaderboardRank: rankRows.length > 0 ? parseInt(rankRows[0].rank) : null,
      });
    } catch (err: any) {
      console.log("[referral] /me error:", err.message);
      return res.status(500).json({ error: "Failed to load referral info" });
    }
  });

  app.post("/api/referral/capture", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }
    try {
      const { referral_code } = req.body;
      if (!referral_code || typeof referral_code !== "string" || referral_code.trim().length < 4) {
        return res.status(400).json({ error: "Valid referral_code is required" });
      }
      const code = referral_code.trim().toUpperCase();

      const referrer = await pgQuery(
        `SELECT user_id FROM user_referral_profiles WHERE referral_code = $1`,
        [code]
      );
      if (referrer.length === 0) {
        return res.status(404).json({ error: "Referral code not found" });
      }
      if (referrer[0].user_id === user.id) {
        return res.status(400).json({ error: "Cannot use your own referral code" });
      }

      const existing = await pgQuery(
        `SELECT id FROM user_referrals WHERE referred_user_id = $1`,
        [user.id]
      );
      if (existing.length > 0) {
        return res.json({ captured: false, reason: "already_referred" });
      }

      let rows: any[];
      try {
        rows = await pgQuery(
          `INSERT INTO user_referrals (referrer_user_id, referred_user_id, referral_code, status, ip_address, user_agent)
           VALUES ($1, $2, $3, 'pending', $4, $5)
           RETURNING id`,
          [
            referrer[0].user_id,
            user.id,
            code,
            req.ip || null,
            (req.headers["user-agent"] || "").substring(0, 500) || null,
          ]
        );
      } catch (insertErr: any) {
        if (insertErr.code === "23505") {
          return res.json({ captured: false, reason: "already_referred" });
        }
        throw insertErr;
      }
      console.log(`[referral] Captured: referral=${rows[0].id}, referrer=${referrer[0].user_id}, referred=${user.id}, code=${code}`);
      return res.json({ captured: true, referralId: rows[0].id });
    } catch (err: any) {
      console.log("[referral] capture error:", err.message);
      return res.status(500).json({ error: "Failed to capture referral" });
    }
  });

  app.get("/api/admin/referrals", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (!adminKey || !process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });
    try {
      const { limit, offset } = parsePagination(req, 100, 500);
      const statusFilter = req.query.status as string | undefined;
      let sql = `SELECT ur.*, re.id AS entry_id, re.entry_month, re.entry_count
        FROM user_referrals ur
        LEFT JOIN referral_entries re ON re.referral_id = ur.id`;
      const params: any[] = [];
      if (statusFilter && ["pending", "qualified", "invalid"].includes(statusFilter)) {
        params.push(statusFilter);
        sql += ` WHERE ur.status = $${params.length}`;
      }
      sql += ` ORDER BY ur.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      const rows = await pgQuery(sql, params);
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/referral/leaderboard", async (req, res) => {
    try {
      const currentMonth = await getCurrentSweepstakesMonth();
      const topN = Math.min(parseInt(req.query.limit as string) || 25, 100);

      const rows = await pgQuery(
        `SELECT
           re.user_id,
           SUM(re.entry_count)::int AS entries,
           MAX(re.created_at) AS last_entry_at,
           RANK() OVER (
             ORDER BY SUM(re.entry_count) DESC,
                      MAX(re.created_at) ASC,
                      re.user_id ASC
           ) AS rank
         FROM referral_entries re
         WHERE re.entry_month = $1
         GROUP BY re.user_id
         ORDER BY rank ASC
         LIMIT $2`,
        [currentMonth, topN]
      );

      if (rows.length === 0) {
        return res.json({ month: currentMonth, leaderboard: [] });
      }

      const userIds = rows.map((r: any) => r.user_id);
      let profileMap: Record<string, { first_name?: string; last_name?: string }> = {};
      try {
        const { data: profiles } = await supabaseAdmin
          .from("user_profiles")
          .select("id, first_name, last_name")
          .in("id", userIds);
        if (profiles) {
          for (const p of profiles) {
            profileMap[p.id] = { first_name: p.first_name, last_name: p.last_name };
          }
        }
      } catch {}

      const leaderboard = rows.map((r: any, idx: number) => {
        const profile = profileMap[r.user_id];
        let displayName: string;
        if (profile?.first_name && profile?.last_name) {
          displayName = `${profile.first_name} ${profile.last_name.charAt(0).toUpperCase()}.`;
        } else {
          const hash = r.user_id.replace(/-/g, "").substring(0, 4).toUpperCase();
          displayName = `Veteran #${hash}`;
        }
        return {
          rank: parseInt(r.rank),
          displayName,
          entries: r.entries,
        };
      });

      return res.json({ month: currentMonth, leaderboard });
    } catch (err: any) {
      console.log("[referral] leaderboard error:", err.message);
      return res.status(500).json({ error: "Failed to load leaderboard" });
    }
  });

  app.get("/api/admin/leaderboard", async (req, res) => {
    const adminKey = req.headers["x-admin-key"];
    if (!adminKey || !process.env.ADMIN_KEY || adminKey !== process.env.ADMIN_KEY) return res.status(401).json({ error: "Unauthorized" });
    try {
      const currentMonth = await getCurrentSweepstakesMonth();
      const { limit, offset } = parsePagination(req, 50, 200);

      const rows = await pgQuery(
        `SELECT
           re.user_id,
           SUM(re.entry_count)::int AS entries,
           COUNT(re.id)::int AS qualified_referrals,
           MAX(re.created_at) AS last_entry_at,
           RANK() OVER (
             ORDER BY SUM(re.entry_count) DESC,
                      MAX(re.created_at) ASC,
                      re.user_id ASC
           ) AS rank
         FROM referral_entries re
         WHERE re.entry_month = $1
         GROUP BY re.user_id
         ORDER BY rank ASC
         LIMIT $2 OFFSET $3`,
        [currentMonth, limit, offset]
      );

      if (rows.length === 0) {
        return res.json({ month: currentMonth, leaderboard: [] });
      }

      const userIds = rows.map((r: any) => r.user_id);
      let profileMap: Record<string, any> = {};
      try {
        const { data: profiles } = await supabaseAdmin
          .from("user_profiles")
          .select("id, first_name, last_name, email, state, city")
          .in("id", userIds);
        if (profiles) {
          for (const p of profiles) profileMap[p.id] = p;
        }
      } catch {}

      const suspiciousRows = await pgQuery(
        `SELECT referrer_user_id, COUNT(*)::int AS flagged
         FROM user_referrals
         WHERE referrer_user_id = ANY($1) AND suspicion_flags != '[]'::jsonb
         GROUP BY referrer_user_id`,
        [userIds]
      );
      const suspiciousMap: Record<string, number> = {};
      for (const s of suspiciousRows) suspiciousMap[s.referrer_user_id] = s.flagged;

      const leaderboard = rows.map((r: any) => {
        const profile = profileMap[r.user_id] || {};
        return {
          rank: parseInt(r.rank),
          userId: r.user_id,
          firstName: profile.first_name || null,
          lastName: profile.last_name || null,
          email: profile.email || null,
          state: profile.state || null,
          city: profile.city || null,
          entries: r.entries,
          qualifiedReferrals: r.qualified_referrals,
          lastEntryAt: r.last_entry_at,
          suspiciousFlags: suspiciousMap[r.user_id] || 0,
        };
      });

      return res.json({ month: currentMonth, leaderboard });
    } catch (err: any) {
      console.log("[admin] leaderboard error:", err.message);
      return res.status(500).json({ error: "Failed to load admin leaderboard" });
    }
  });

  app.get("/api/saved-resources", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = supabaseForUser(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const { data, error } = await userClient
      .from("user_saved_resources")
      .select("resource_id")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const ids = (data || []).map((r: any) => r.resource_id);
    return res.json({ ids });
  });

  app.post("/api/saved-resources/sync", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = supabaseForUser(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const { localIds } = req.body;
    if (!Array.isArray(localIds)) {
      return res.status(400).json({ error: "localIds must be an array" });
    }

    if (localIds.length > 0) {
      const rows = localIds.map((resource_id: string) => ({
        user_id: user.id,
        resource_id,
      }));
      await userClient.from("user_saved_resources").upsert(rows, {
        onConflict: "user_id,resource_id",
        ignoreDuplicates: true,
      });
    }

    const { data, error } = await userClient
      .from("user_saved_resources")
      .select("resource_id")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const ids = (data || []).map((r: any) => r.resource_id);
    return res.json({ ids });
  });

  app.post("/api/saved-resources/toggle", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const token = authHeader.replace("Bearer ", "");
    const userClient = supabaseForUser(token);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const { resource_id, action } = req.body;
    if (!resource_id) {
      return res.status(400).json({ error: "resource_id required" });
    }

    if (action === "unsave") {
      await userClient
        .from("user_saved_resources")
        .delete()
        .eq("user_id", user.id)
        .eq("resource_id", resource_id);
    } else {
      await userClient
        .from("user_saved_resources")
        .upsert(
          { user_id: user.id, resource_id },
          { onConflict: "user_id,resource_id", ignoreDuplicates: true }
        );
    }

    const { data, error } = await userClient
      .from("user_saved_resources")
      .select("resource_id")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }
    const ids = (data || []).map((r: any) => r.resource_id);
    return res.json({ ids });
  });

  app.get("/api/profile", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code === "PGRST116") {
      return res.json({ profile: null });
    }
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.json({ profile: data });
  });

  app.post("/api/profile", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const { first_name, last_name, email, phone, user_type, consent_contact,
            branch_of_service, interests, service_area, state, city, zip,
            rank, mos, service_era, preferred_contact_method } = req.body;

    if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !phone?.trim()) {
      return res.status(400).json({ error: "First name, last name, email, and phone are required" });
    }

    const validTypes = ["veteran", "spouse_family", "dependent", "caregiver_advocate", "case_manager", "social_worker", "nonprofit_rep", "vso_advocate", "government_staff", "church_ministry", "other"];
    const uType = validTypes.includes(user_type) ? user_type : "veteran";

    const profileData: Record<string, any> = {
      id: user.id,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      user_type: uType,
      consent_contact: consent_contact === true,
      updated_at: new Date().toISOString(),
    };

    if (branch_of_service !== undefined) profileData.branch_of_service = branch_of_service?.trim() || null;
    if (interests !== undefined) profileData.interests = Array.isArray(interests) ? interests : [];
    if (service_area !== undefined) profileData.service_area = service_area?.trim() || null;
    if (rank !== undefined) profileData.rank = rank?.trim() || null;
    if (mos !== undefined) profileData.mos = mos?.trim() || null;
    if (service_era !== undefined) profileData.service_era = service_era?.trim() || null;
    if (preferred_contact_method !== undefined) profileData.preferred_contact_method = preferred_contact_method?.trim() || null;
    if (state !== undefined) profileData.state = state?.trim() || null;
    if (city !== undefined) profileData.city = city?.trim() || null;
    if (zip !== undefined) profileData.zip = zip?.trim() || null;

    const hasEnrichment = profileData.branch_of_service || (profileData.interests && profileData.interests.length > 0)
      || profileData.state || profileData.city;
    if (hasEnrichment) profileData.profile_complete = true;

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .upsert(profileData, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.log("[profile] Error saving profile:", error.message);
      return res.status(500).json({ error: error.message });
    }

    if (data?.profile_complete && user.email_confirmed_at) {
      qualifyReferralForUser(user.id).catch((err) =>
        console.log("[referral] qualification check error (non-blocking):", err.message)
      );
    }

    return res.json({ profile: data });
  });

  app.patch("/api/profile", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const allowedFields = [
      "first_name", "last_name", "email", "phone", "user_type", "consent_contact",
      "branch_of_service", "interests", "service_area", "rank", "mos", "service_era",
      "preferred_contact_method", "state", "city", "zip", "profile_complete",
    ];

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.user_type) {
      const validTypes = ["veteran", "spouse_family", "dependent", "caregiver_advocate", "case_manager", "social_worker", "nonprofit_rep", "vso_advocate", "government_staff", "church_ministry", "other"];
      if (!validTypes.includes(updates.user_type)) updates.user_type = "veteran";
    }

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (data?.profile_complete && user.email_confirmed_at) {
      qualifyReferralForUser(user.id).catch((err) =>
        console.log("[referral] qualification check error (non-blocking):", err.message)
      );
    }

    return res.json({ profile: data });
  });

  app.delete("/api/profile", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid session" });
    }

    const { error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      console.log("[delete-account] Profile delete error:", profileError.message);
      return res.status(500).json({ error: "Failed to delete profile data" });
    }

    const { error: savedError } = await supabaseAdmin
      .from("user_saved_resources")
      .delete()
      .eq("user_id", user.id);

    if (savedError) {
      console.log("[delete-account] Saved resources delete error:", savedError.message);
    }

    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (authDeleteError) {
      console.log("[delete-account] Auth user delete error:", authDeleteError.message);
      return res.status(500).json({ error: "Profile deleted but failed to remove auth account. Please contact support." });
    }

    return res.json({ success: true });
  });

  app.get("/api/admin/user-profiles", requireAdmin, async (req, res) => {
    const { user_type, state: stateFilter, profile_complete, limit: lim } = req.query;
    let query = supabaseAdmin.from("user_profiles")
      .select("id, first_name, last_name, email, phone, user_type, consent_contact, branch_of_service, interests, state, city, profile_complete, created_at")
      .order("created_at", { ascending: false });

    if (user_type && typeof user_type === "string") query = query.eq("user_type", user_type);
    if (stateFilter && typeof stateFilter === "string") query = query.eq("state", stateFilter.toUpperCase());
    if (profile_complete === "true") query = query.eq("profile_complete", true);
    if (profile_complete === "false") query = query.eq("profile_complete", false);

    const pageLimit = Math.min(parseInt(lim as string) || 100, 500);
    query = query.limit(pageLimit);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ profiles: data, count: data?.length || 0 });
  });

  app.post("/api/submit-resource", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkSubmitRate(ip)) {
      return res.status(429).json({ error: "Too many submissions. Please try again later." });
    }

    const {
      category_slug,
      title,
      short_description,
      website_url,
      phone,
      email,
      address,
      city,
      state,
      zip,
      eligibility,
      source_name,
      submitted_by_name,
      submitted_by_email,
    } = req.body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return res.status(400).json({ error: "Title is required (minimum 3 characters)" });
    }
    if (!category_slug || typeof category_slug !== "string") {
      return res.status(400).json({ error: "Category is required" });
    }
    if (website_url && typeof website_url === "string") {
      try { new URL(website_url); } catch {
        return res.status(400).json({ error: "Invalid website URL format" });
      }
    }
    if (phone && typeof phone === "string" && phone.replace(/\D/g, "").length < 7) {
      return res.status(400).json({ error: "Phone number appears invalid" });
    }

    const dupChecks: string[] = [];
    if (website_url) {
      const { data: urlDup } = await supabase
        .from("resources")
        .select("id, title")
        .eq("website_url", website_url)
        .limit(1);
      if (urlDup && urlDup.length > 0) {
        dupChecks.push(`A resource with this website already exists: "${urlDup[0].title}"`);
      }
    }
    if (phone) {
      const normalized = phone.replace(/\D/g, "");
      if (normalized.length >= 10) {
        const phonePatterns = [
          phone.trim(),
          `(${normalized.slice(0,3)}) ${normalized.slice(3,6)}-${normalized.slice(6)}`,
          `${normalized.slice(0,3)}-${normalized.slice(3,6)}-${normalized.slice(6)}`,
          normalized,
        ];
        const { data: phoneDup } = await supabase
          .from("resources")
          .select("id, title")
          .in("phone", phonePatterns)
          .limit(1);
        if (phoneDup && phoneDup.length > 0) {
          dupChecks.push(`A resource with this phone number already exists: "${phoneDup[0].title}"`);
        }
      }
    }
    if (city && state) {
      const { data: titleDup } = await supabase
        .from("resources")
        .select("id, title")
        .ilike("title", title.trim())
        .ilike("city", city.trim())
        .eq("state", state)
        .limit(1);
      if (titleDup && titleDup.length > 0) {
        dupChecks.push(`A resource with this name already exists in this location: "${titleDup[0].title}"`);
      }
    }
    if (dupChecks.length > 0) {
      return res.status(409).json({ error: dupChecks[0] });
    }

    let category_id = null;
    if (category_slug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category_slug)
        .single();
      if (cat) category_id = cat.id;
    }

    const { data, error } = await supabaseAdmin
      .from("resources")
      .insert({
        title: title.trim(),
        category_id,
        short_description: short_description?.trim() || null,
        website_url: website_url?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state || null,
        zip: zip?.trim() || null,
        eligibility: eligibility?.trim() || null,
        source_name: source_name?.trim() || null,
        submitted_by_name: submitted_by_name?.trim() || null,
        submitted_by_email: submitted_by_email?.trim() || null,
        status: "pending",
        sponsored: false,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ id: data.id, message: "Resource submitted for review" });
  });

  app.post("/api/track-click", async (req, res) => {
    const { resource_id, click_type, user_state, user_city, user_zip, category_slug } = req.body;

    if (!resource_id || !click_type) {
      return res.status(400).json({ error: "resource_id and click_type are required" });
    }

    const validTypes = ["website_click", "call_click", "directions_click", "guide_click", "save_click", "share_click", "report_click", "apply_click", "navigator_click"];
    if (!validTypes.includes(click_type)) {
      return res.status(400).json({ error: "Invalid click_type" });
    }

    const row: Record<string, any> = {
      resource_id,
      click_type,
      user_state: user_state || null,
      user_city: user_city || null,
    };

    const { error } = await supabaseAdmin.from("resource_clicks").insert({ ...row, user_zip: user_zip || null });

    if (error && error.message.includes("user_zip")) {
      const { error: fallbackErr } = await supabaseAdmin.from("resource_clicks").insert(row);
      if (fallbackErr) {
        console.error("Click tracking error:", fallbackErr.message);
      }
    } else if (error) {
      console.error("Click tracking error:", error.message);
    }

    const eventMap: Record<string, string> = {
      call_click: "partner_call_click",
      website_click: "partner_website_click",
      apply_click: "partner_apply_click",
      directions_click: "partner_directions_click",
    };
    const mappedType = eventMap[click_type];
    if (mappedType && category_slug) {
      logLeadEvent({
        event_type: mappedType,
        lead_class: "engagement_event",
        action_type: click_type,
        source_surface: "resources",
        category_slug: category_slug,
        resource_id: resource_id,
        state: user_state || null,
        city: user_city || null,
      });
    }

    return res.json({ ok: true });
  });

  app.post("/api/lead-event", async (req, res) => {
    const { event_type, partner_id, resource_id, category_slug, subcategory_slug, source_surface, state, city, session_id } = req.body;
    if (!event_type) return res.status(400).json({ error: "event_type is required" });
    if (!category_slug) return res.status(400).json({ error: "category_slug is required" });
    if (!source_surface) return res.status(400).json({ error: "source_surface is required" });

    const validTypes = ["partner_view", "partner_call_click", "partner_email_click", "partner_website_click", "partner_apply_click"];
    if (!validTypes.includes(event_type)) return res.status(400).json({ error: "Invalid event_type" });

    let utm_id: string | null = null;
    let ambassador_id: string | null = null;
    let referral_code: string | null = null;
    if (session_id) {
      try {
        const sessions = await pgQuery(
          `SELECT utm_id, utm_content, ambassador_id FROM attribution_sessions WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1`,
          [session_id]
        );
        if (sessions.length > 0) {
          utm_id = sessions[0].utm_id || null;
          ambassador_id = sessions[0].ambassador_id || null;
          if (!ambassador_id && sessions[0].utm_content) {
            const amb = await resolveAmbassadorId(sessions[0].utm_content, sessions[0].utm_id);
            ambassador_id = amb || null;
          }
        }
      } catch {}
    }

    logLeadEvent({
      event_type,
      lead_class: "engagement_event",
      action_type: event_type.replace("partner_", ""),
      source_surface: source_surface,
      partner_id: partner_id || null,
      resource_id: resource_id || null,
      category_slug: category_slug,
      subcategory_slug: subcategory_slug || null,
      state: state || null,
      city: city || null,
      session_id: session_id || null,
      utm_id,
      ambassador_id,
      referral_code,
    });

    return res.json({ ok: true });
  });

  app.post("/api/ai/chat", (req, res) => handleAiChat(req, res));

  app.post("/api/ai/email-results", async (req, res) => {
    const { email, resources, trustedServices, conversationSummary } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    const hasContent = (resources?.length > 0) || (trustedServices?.length > 0);
    if (!hasContent) {
      return res.status(400).json({ error: "No results to email" });
    }
    try {
      const { Resend } = await import("resend");
      const resendClient = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.RESEND_FROM_EMAIL || `Veteran Care <onboarding@resend.dev>`;

      let resourcesHtml = "";
      if (resources?.length > 0) {
        resourcesHtml = `<h2 style="color:#1a1a2e;font-size:18px;margin:24px 0 12px;">Matched Resources</h2>`;
        for (const r of resources.slice(0, 10)) {
          const esc = (s: string) => (s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
          resourcesHtml += `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:8px;">
            <p style="font-weight:600;margin:0;">${esc(r.title)}</p>
            <p style="color:#6b7280;font-size:13px;margin:4px 0;">${esc(r.category)}${r.city ? ` · ${esc(r.city)}` : ''}${r.state ? `, ${esc(r.state)}` : ''}</p>
            <div style="margin-top:8px;">
              ${r.website_url ? `<a href="${esc(r.website_url)}" style="color:#16a34a;text-decoration:none;font-size:13px;margin-right:16px;">Visit Website</a>` : ''}
              ${r.phone ? `<a href="tel:${esc(r.phone)}" style="color:#16a34a;text-decoration:none;font-size:13px;">${esc(r.phone)}</a>` : ''}
            </div>
          </div>`;
        }
      }

      let trustedHtml = "";
      if (trustedServices?.length > 0) {
        trustedHtml = `<h2 style="color:#1a1a2e;font-size:18px;margin:24px 0 12px;">Trusted Partners</h2>`;
        for (const s of trustedServices.slice(0, 5)) {
          const esc = (str: string) => (str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
          trustedHtml += `<div style="border:1px solid #bbf7d0;border-radius:8px;padding:12px;margin-bottom:8px;background:#f0fdf4;">
            <p style="font-weight:600;margin:0;">${esc(s.name)}${s.is_featured ? ' ⭐ Featured' : ''}</p>
            ${s.description ? `<p style="color:#6b7280;font-size:13px;margin:4px 0;">${esc(s.description)}</p>` : ''}
            <p style="color:#6b7280;font-size:13px;margin:4px 0;">${esc(s.category_name)}${s.city ? ` · ${esc(s.city)}` : ''}${s.state ? `, ${esc(s.state)}` : ''}</p>
            <div style="margin-top:8px;">
              ${s.website ? `<a href="${esc(s.website)}" style="color:#16a34a;text-decoration:none;font-size:13px;margin-right:16px;">Website</a>` : ''}
              ${s.phone ? `<a href="tel:${esc(s.phone)}" style="color:#16a34a;text-decoration:none;font-size:13px;margin-right:16px;">${esc(s.phone)}</a>` : ''}
              ${s.email ? `<a href="mailto:${esc(s.email)}" style="color:#16a34a;text-decoration:none;font-size:13px;">Email</a>` : ''}
            </div>
          </div>`;
        }
      }

      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="text-align:center;padding:24px 0;border-bottom:2px solid #16a34a;">
            <img src="https://veterancare.com/logo.png" alt="Veteran Care" style="display:block;max-width:200px;height:auto;margin:0 auto;border:0;" />
            <p style="color:#6b7280;font-size:14px;margin:12px 0 0;">Your Resource Results</p>
          </div>
          <p style="color:#374151;font-size:15px;margin:20px 0 4px;">Hi there,</p>
          <p style="color:#374151;font-size:14px;margin:0 0 8px;">Here are the resources matched by your Veteran Guide conversation. We hope these help you find the support you need.</p>
          ${conversationSummary ? `<div style="background:#f9fafb;border-radius:8px;padding:14px;margin:16px 0;">
            <p style="font-weight:600;color:#374151;font-size:14px;margin:0 0 6px;">Conversation Summary</p>
            <p style="color:#374151;font-size:13px;margin:0;">${(conversationSummary || '').replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</p>
          </div>` : ''}
          ${resourcesHtml}
          ${trustedHtml}
          <div style="text-align:center;padding:24px 0;margin-top:24px;border-top:1px solid #e5e7eb;">
            <a href="https://veterancare.com/home" style="display:inline-block;background:#166534;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;margin-bottom:12px;">Explore More Resources</a>
            <p style="color:#6b7280;font-size:12px;margin:12px 0 0;">Need more help? Visit <a href="https://veterancare.com" style="color:#16a34a;">veterancare.com</a></p>
          </div>
        </div>`;

      await resendClient.emails.send({
        from: fromEmail,
        to: email,
        subject: "Veteran Care — Your Saved Resources",
        html,
      });

      return res.json({ success: true });
    } catch (err: any) {
      console.error("[ai-email] Failed to send results email:", err.message);
      return res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.get("/api/admin/resources", requireAdmin, async (req, res) => {
    const { status, q, state: stateFilter } = req.query;

    let query = supabaseAdmin.from("resources").select(`
      *,
      resource_categories(categories(id, name, slug)),
      resource_subcategories(subcategories(id, name, slug, category_id))
    `);

    if (status) {
      query = query.eq("status", status as string);
    }

    if (stateFilter) {
      query = query.eq("state", stateFilter as string);
    }

    if (q) {
      const normalized = `%${normalizeSearchTerm(q as string)}%`;
      const raw = `%${q}%`;
      const patterns = new Set([normalized, raw]);
      const orClauses = [...patterns].flatMap(p => [
        `title.ilike.${p}`,
        `short_description.ilike.${p}`,
      ]);
      query = query.or(orClauses.join(","));
    }

    query = query.order("created_at", { ascending: false });

    const resPag = parsePagination(req, 200, 1000);
    query = query.range(resPag.offset, resPag.offset + resPag.limit - 1);

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(normalizeAllFieldsList(data || []));
  });

  app.post("/api/admin/resources", requireAdmin, async (req, res) => {
    const { category_id, title, short_description, website_url, phone, email,
      address, city, state, zip, eligibility, source_name, status,
      sponsored, monetization_type, affiliate_url, notes_internal, subcategory,
      service_priority } = req.body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return res.status(400).json({ error: "Title is required (minimum 3 characters)" });
    }

    let latitude = req.body.latitude != null ? parseFloat(req.body.latitude) : null;
    let longitude = req.body.longitude != null ? parseFloat(req.body.longitude) : null;
    let geo_source = req.body.geo_source || null;

    if (hasGeoColumns && (latitude == null || longitude == null) && (address || city || state || zip)) {
      const geo = await geocodeAddress(address, city, state, zip);
      if (geo) {
        latitude = geo.latitude;
        longitude = geo.longitude;
        geo_source = geo.geo_source;
      }
    }

    const insertData: Record<string, any> = {
      title: title.trim(),
      category_id: category_id || null,
      short_description: short_description?.trim() || null,
      website_url: website_url?.trim() || null,
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      city: city?.trim() || null,
      state: state || null,
      zip: zip?.trim() || null,
      eligibility: eligibility?.trim() || null,
      source_name: source_name?.trim() || null,
      notes_internal: notes_internal?.trim() || null,
      status: status || "approved",
      sponsored: !!sponsored,
      monetization_type: monetization_type || null,
      affiliate_url: affiliate_url?.trim() || null,
    };

    if (hasSubcategoryColumn) {
      insertData.subcategory = subcategory?.trim() || null;
    }

    if (hasServicePriorityColumn) {
      const validPriorities = ["immediate", "same_week", "standard", "information"];
      insertData.service_priority = validPriorities.includes(service_priority) ? service_priority : null;
    }

    if (hasNotifyEmailColumn) {
      const ne = req.body.notify_email?.trim() || null;
      insertData.notify_email = ne && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ne) ? ne : null;
    }

    if (hasGeoColumns) {
      insertData.latitude = isNaN(latitude as number) ? null : latitude;
      insertData.longitude = isNaN(longitude as number) ? null : longitude;
      insertData.geo_source = geo_source;
      insertData.geocoded_at = latitude != null ? new Date().toISOString() : null;
    }

    const { data, error } = await supabaseAdmin
      .from("resources")
      .insert(insertData)
      .select(`*, resource_categories(categories(id, name, slug))`)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (data && data.id && data.category_id) {
      await supabaseAdmin.from("resource_categories")
        .upsert({ resource_id: data.id, category_id: data.category_id }, { onConflict: "resource_id,category_id" });
    }
    const additionalCategoryIds: string[] = req.body.additional_category_ids || [];
    for (const addCatId of additionalCategoryIds) {
      if (addCatId && addCatId !== data?.category_id) {
        await supabaseAdmin.from("resource_categories")
          .upsert({ resource_id: data.id, category_id: addCatId }, { onConflict: "resource_id,category_id" });
      }
    }

    const subcategoryIds: string[] = req.body.subcategory_ids || [];
    if (data && data.id && subcategoryIds.length > 0) {
      const subInserts = subcategoryIds.map((sid: string) => ({ resource_id: data.id, subcategory_id: sid }));
      await supabaseAdmin.from("resource_subcategories").insert(subInserts).select();
    } else if (data && data.id && insertData.subcategory) {
      const { data: matchedSubs } = await supabaseAdmin.from("subcategories")
        .select("id").eq("name", insertData.subcategory);
      if (matchedSubs && matchedSubs.length > 0) {
        const subInserts = matchedSubs.map((s: any) => ({ resource_id: data.id, subcategory_id: s.id }));
        await supabaseAdmin.from("resource_subcategories").upsert(subInserts, { onConflict: "resource_id,subcategory_id" });
      }
    }

    const { data: refreshed } = await supabaseAdmin.from("resources")
      .select(`*, resource_categories(categories(id, name, slug)), resource_subcategories(subcategories(id, name, slug, category_id))`)
      .eq("id", data.id).single();
    return res.status(201).json(normalizeAllFields(refreshed || data));
  });

  app.post("/api/admin/resources/csv-import", requireAdmin, async (req, res) => {
    const { rows, options } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "No rows provided" });
    }
    if (rows.length > 500) {
      return res.status(400).json({ error: "Maximum 500 rows per import" });
    }

    const skipDuplicates = options?.skip_duplicates !== false;
    const defaultState = options?.default_state?.trim()?.toUpperCase() || null;
    const defaultCategory = options?.default_category?.trim()?.toLowerCase() || null;
    const dryRun = options?.dry_run === true;

    const { data: cats } = await supabase.from("categories").select("id, name, slug");
    const catMap = new Map<string, string>();
    const catNameById = new Map<string, string>();
    (cats || []).forEach((c: any) => {
      catMap.set(c.slug.toLowerCase(), c.id);
      catMap.set(c.name.toLowerCase(), c.id);
      catNameById.set(c.id, c.slug);
    });

    let existingTitles = new Set<string>();
    if (skipDuplicates) {
      const statesInImport = new Set<string>();
      if (defaultState) statesInImport.add(defaultState);
      rows.forEach((r: any) => {
        const s = r.state?.trim()?.toUpperCase();
        if (s) statesInImport.add(s);
      });
      const stateList = Array.from(statesInImport);

      let q = supabaseAdmin.from("resources").select("title, state");
      if (stateList.length === 1) {
        q = q.eq("state", stateList[0]);
      } else if (stateList.length > 1) {
        q = q.in("state", stateList);
      }
      const { data: existing } = await q;
      (existing || []).forEach((r: any) => {
        existingTitles.add(`${(r.title || "").toLowerCase().trim()}|${(r.state || "").toUpperCase()}`);
      });
    }

    const results: { row: number; status: "created" | "skipped" | "duplicate" | "error"; title: string; reason?: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const title = row.title?.trim();
      if (!title || title.length < 3) {
        results.push({ row: i + 1, status: "skipped", title: title || "(empty)", reason: "Title too short or missing" });
        continue;
      }

      const rowState = row.state?.trim()?.toUpperCase() || defaultState;

      if (skipDuplicates) {
        const dupKey = `${title.toLowerCase()}|${rowState || ""}`;
        if (existingTitles.has(dupKey)) {
          results.push({ row: i + 1, status: "duplicate", title, reason: `Duplicate in ${rowState || "unknown state"}` });
          continue;
        }
      }

      const catKey = (row.category || row.category_slug || defaultCategory || "").toLowerCase().trim();
      let category_id = catMap.get(catKey) || null;
      if (!category_id && row.category_id?.trim()) {
        category_id = row.category_id.trim();
      }

      if (dryRun) {
        results.push({ row: i + 1, status: "created", title, reason: `Dry run — would create in ${rowState || "no state"} / ${catKey || "no category"}` });
        if (skipDuplicates && rowState) {
          existingTitles.add(`${title.toLowerCase()}|${rowState}`);
        }
        continue;
      }

      try {
        let lat = row.latitude ? parseFloat(row.latitude) : null;
        let lng = row.longitude ? parseFloat(row.longitude) : null;
        let geoSrc = row.geo_source?.trim() || null;

        if (hasGeoColumns && (lat == null || lng == null || isNaN(lat) || isNaN(lng)) &&
            (row.address?.trim() || row.city?.trim() || rowState || row.zip?.trim())) {
          const geo = await geocodeAddress(row.address?.trim(), row.city?.trim(), rowState || undefined, row.zip?.trim());
          if (geo) {
            lat = geo.latitude;
            lng = geo.longitude;
            geoSrc = geo.geo_source;
          }
        }

        const csvInsert: Record<string, any> = {
            title,
            category_id,
            short_description: row.short_description?.trim() || row.description?.trim() || null,
            website_url: row.website_url?.trim() || row.website?.trim() || row.url?.trim() || null,
            phone: row.phone?.trim() || null,
            email: row.email?.trim() || null,
            address: row.address?.trim() || null,
            city: row.city?.trim() || null,
            state: rowState || null,
            zip: row.zip?.trim() || null,
            eligibility: row.eligibility?.trim() || null,
            source_name: row.source_name?.trim() || row.source?.trim() || null,
            source_type: row.source_type?.trim() || null,
            notes_internal: row.notes_internal?.trim() || null,
            status: ["approved", "pending", "rejected"].includes(row.status) ? row.status : "approved",
            sponsored: row.sponsored === "true" || row.sponsored === true,
            monetization_type: row.monetization_type?.trim() || null,
            affiliate_url: row.affiliate_url?.trim() || null,
        };

        if (hasSubcategoryColumn) {
            csvInsert.subcategory = row.subcategory?.trim() || null;
        }

        if (hasServicePriorityColumn) {
            const validPriorities = ["immediate", "same_week", "standard", "information"];
            csvInsert.service_priority = validPriorities.includes(row.service_priority) ? row.service_priority : null;
        }

        if (hasNotifyEmailColumn) {
            const ne = row.notify_email?.trim() || null;
            csvInsert.notify_email = ne && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ne) ? ne : null;
        }

        if (hasGeoColumns) {
            csvInsert.latitude = (lat != null && !isNaN(lat)) ? lat : null;
            csvInsert.longitude = (lng != null && !isNaN(lng)) ? lng : null;
            csvInsert.geo_source = geoSrc;
            csvInsert.geocoded_at = (lat != null && !isNaN(lat)) ? new Date().toISOString() : null;
        }

        const { data: inserted, error } = await supabaseAdmin
          .from("resources")
          .insert(csvInsert)
          .select("id")
          .single();

        if (error) {
          results.push({ row: i + 1, status: "error", title, reason: error.message });
        } else {
          if (inserted?.id && category_id) {
            await supabaseAdmin.from("resource_categories")
              .upsert({ resource_id: inserted.id, category_id }, { onConflict: "resource_id,category_id" });
          }
          results.push({ row: i + 1, status: "created", title });
          if (skipDuplicates && rowState) {
            existingTitles.add(`${title.toLowerCase()}|${rowState}`);
          }
        }
      } catch (e: any) {
        results.push({ row: i + 1, status: "error", title, reason: e?.message || "Unknown error" });
      }
    }

    const created = results.filter(r => r.status === "created").length;
    const skipped = results.filter(r => r.status === "skipped").length;
    const duplicates = results.filter(r => r.status === "duplicate").length;
    const errors = results.filter(r => r.status === "error").length;

    return res.json({ created, skipped, duplicates, errors, total: rows.length, dry_run: dryRun, results });
  });

  app.get("/api/admin/resources/csv-export", requireAdmin, async (req, res) => {
    try {
      const status = (req.query.status as string) || "approved";
      const { data: resources, error } = await supabaseAdmin
        .from("resources")
        .select("title, short_description, website_url, phone, email, address, city, state, zip, eligibility, subcategory, source_name, source_type, sponsored, monetization_type, affiliate_url, status, latitude, longitude, resource_categories(categories(slug, name))")
        .eq("status", status)
        .order("state")
        .order("title");

      if (error) return res.status(500).json({ error: error.message });

      const headers = ["title","category","subcategory","short_description","website_url","phone","email","address","city","state","zip","eligibility","source_name","source_type","sponsored","monetization_type","affiliate_url","status","latitude","longitude"];

      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return "";
        const s = String(val);
        if (s.includes(",") || s.includes('"') || s.includes("\n")) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      };

      const normalized = normalizeResourceList(resources || []);
      const rows = normalized.map((r: any) => {
        const catSlug = Array.isArray(r.categories)
          ? r.categories.map((c: any) => c.slug).join("|")
          : (r.categories?.slug || "");
        return [
        r.title, catSlug, r.subcategory, r.short_description,
        r.website_url, r.phone, r.email, r.address, r.city, r.state, r.zip,
        r.eligibility, r.source_name, r.source_type, r.sponsored,
        r.monetization_type, r.affiliate_url, r.status, r.latitude, r.longitude,
      ].map(escapeCsv).join(","); });

      const csv = [headers.join(","), ...rows].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="veteran-care-resources-${status}-${new Date().toISOString().slice(0,10)}.csv"`);
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/resources/csv-template", requireAdmin, async (_req, res) => {
    const { data: cats } = await supabase.from("categories").select("slug, name");
    const categoryList = (cats || []).map((c: any) => c.slug).join(", ");

    const template = {
      columns: [
        { name: "title", required: true, description: "Resource name (min 3 chars)" },
        { name: "category", required: true, description: `Category slug or name. Valid: ${categoryList}` },
        { name: "subcategory", required: false, description: "Subcategory within the category" },
        { name: "short_description", required: false, description: "Brief description of the resource" },
        { name: "website_url", required: false, description: "Website URL (aliases: website, url)" },
        { name: "phone", required: false, description: "Phone number" },
        { name: "email", required: false, description: "Contact email" },
        { name: "address", required: false, description: "Street address" },
        { name: "city", required: false, description: "City name" },
        { name: "state", required: true, description: "2-letter state code (e.g. SC, GA, NC)" },
        { name: "zip", required: false, description: "ZIP code" },
        { name: "eligibility", required: false, description: "Eligibility requirements" },
        { name: "service_priority", required: false, description: "Priority level: immediate, same_week, standard, information" },
        { name: "source_name", required: false, description: "Data source name (alias: source)" },
        { name: "source_type", required: false, description: "Source type" },
        { name: "sponsored", required: false, description: "true/false" },
        { name: "monetization_type", required: false, description: "Monetization type" },
        { name: "affiliate_url", required: false, description: "Affiliate tracking URL" },
        { name: "notes_internal", required: false, description: "Internal admin notes" },
        { name: "status", required: false, description: "approved (default), pending, or rejected" },
        { name: "latitude", required: false, description: "Latitude (auto-geocoded if missing)" },
        { name: "longitude", required: false, description: "Longitude (auto-geocoded if missing)" },
      ],
      import_options: {
        skip_duplicates: "true (default) — skip rows where title+state already exists",
        default_state: "Apply this state code to all rows missing a state field",
        default_category: "Apply this category slug to all rows missing a category field",
        dry_run: "true — validate without inserting; returns what would happen",
      },
      example_row: {
        title: "Lowcountry Veterans Center",
        category: "housing",
        subcategory: "Transitional Housing",
        short_description: "Transitional housing for homeless veterans",
        website_url: "https://example.org",
        phone: "843-555-1234",
        email: "info@example.org",
        address: "123 Main St",
        city: "Charleston",
        state: "SC",
        zip: "29401",
        eligibility: "Veterans experiencing homelessness",
        service_priority: "immediate",
        source_name: "VA HCHV",
        sponsored: "false",
      },
      categories: (cats || []).map((c: any) => ({ slug: c.slug, name: c.name })),
    };

    return res.json(template);
  });

  app.post("/api/admin/resources/duplicate-check", requireAdmin, async (req, res) => {
    const { state, category } = req.body;
    const stateCode = state?.trim()?.toUpperCase();
    if (!stateCode) {
      return res.status(400).json({ error: "State code required" });
    }

    let q = supabaseAdmin.from("resources").select("id, title, city, state, category_id, status");
    q = q.eq("state", stateCode);
    if (category) {
      const { data: cats } = await supabase.from("categories").select("id, slug, name");
      const cat = (cats || []).find((c: any) => c.slug === category.toLowerCase() || c.name.toLowerCase() === category.toLowerCase());
      if (cat) q = q.eq("category_id", cat.id);
    }

    const { data, error } = await q.order("title");
    if (error) return res.status(500).json({ error: error.message });

    const titleMap = new Map<string, any[]>();
    (data || []).forEach((r: any) => {
      const key = r.title.toLowerCase().trim();
      if (!titleMap.has(key)) titleMap.set(key, []);
      titleMap.get(key)!.push(r);
    });

    const duplicates = Array.from(titleMap.entries())
      .filter(([_, items]) => items.length > 1)
      .map(([title, items]) => ({ title: items[0].title, count: items.length, ids: items.map((i: any) => i.id), cities: items.map((i: any) => i.city) }));

    return res.json({
      state: stateCode,
      total_resources: (data || []).length,
      unique_titles: titleMap.size,
      duplicate_groups: duplicates.length,
      duplicates,
    });
  });

  app.post("/api/admin/resources/cleanup-duplicates", requireAdmin, async (req, res) => {
    const { state, dry_run } = req.body;
    const stateCode = state?.trim()?.toUpperCase();
    if (!stateCode) {
      return res.status(400).json({ error: "State code required" });
    }

    const { data, error } = await supabaseAdmin
      .from("resources")
      .select("id, title, city, state, created_at")
      .eq("state", stateCode)
      .order("title")
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const titleMap = new Map<string, any[]>();
    (data || []).forEach((r: any) => {
      const key = r.title.toLowerCase().trim();
      if (!titleMap.has(key)) titleMap.set(key, []);
      titleMap.get(key)!.push(r);
    });

    const toRemove: string[] = [];
    const groups: any[] = [];
    for (const [_, items] of titleMap.entries()) {
      if (items.length > 1) {
        const keep = items[0];
        const remove = items.slice(1);
        toRemove.push(...remove.map((r: any) => r.id));
        groups.push({ keep: keep.id, remove: remove.map((r: any) => r.id), title: keep.title });
      }
    }

    const isDryRun = dry_run !== false;

    if (!isDryRun && toRemove.length > 0) {
      const { error: delErr } = await supabaseAdmin
        .from("resources")
        .delete()
        .in("id", toRemove);
      if (delErr) return res.status(500).json({ error: delErr.message });
    }

    return res.json({
      state: stateCode,
      dry_run: isDryRun,
      duplicate_groups: groups.length,
      removed_count: toRemove.length,
      groups,
    });
  });

  app.post("/api/admin/states/:code/clone-resources", requireAdmin, async (req, res) => {
    const targetState = req.params.code.toUpperCase();
    const { source_state, categories, exclude_categories } = req.body;
    const sourceState = (source_state || "SC").toUpperCase();

    if (!/^[A-Z]{2}$/.test(targetState) || !/^[A-Z]{2}$/.test(sourceState)) {
      return res.status(400).json({ error: "State codes must be 2-letter uppercase (e.g. SC, GA)" });
    }

    if (targetState === sourceState) {
      return res.status(400).json({ error: "Source and target states cannot be the same" });
    }

    const { data: cats, error: catErr } = await supabase.from("categories").select("id, slug, name");
    if (catErr) return res.status(500).json({ error: "Failed to load categories: " + catErr.message });
    const catMap = new Map<string, string>();
    const catNameMap = new Map<string, string>();
    (cats || []).forEach((c: any) => {
      catMap.set(c.slug, c.id);
      catNameMap.set(c.id, c.slug);
    });

    let q = supabaseAdmin.from("resources")
      .select("*")
      .eq("state", sourceState)
      .eq("status", "approved");

    if (Array.isArray(categories) && categories.length > 0) {
      const catIds = categories.map((c: string) => catMap.get(c.toLowerCase())).filter(Boolean);
      if (catIds.length > 0) q = q.in("category_id", catIds);
    }
    if (Array.isArray(exclude_categories) && exclude_categories.length > 0) {
      const exIds = exclude_categories.map((c: string) => catMap.get(c.toLowerCase())).filter(Boolean);
      if (exIds.length > 0) q = q.not("category_id", "in", `(${exIds.join(",")})`);
    }

    const { data: sourceResources, error: srcErr } = await q;
    if (srcErr) return res.status(500).json({ error: srcErr.message });
    if (!sourceResources || sourceResources.length === 0) {
      return res.json({ message: "No resources found in source state", created: 0, skipped: 0 });
    }

    const nationalResources = sourceResources.filter((r: any) => !r.city && !r.address);
    const stateSpecific = sourceResources.filter((r: any) => r.city || r.address);

    const { data: existingInTarget } = await supabase
      .from("resources")
      .select("title")
      .eq("state", targetState);
    const existingTitles = new Set((existingInTarget || []).map((r: any) => r.title.toLowerCase().trim()));

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const resource of nationalResources) {
      if (existingTitles.has(resource.title.toLowerCase().trim())) {
        skipped++;
        continue;
      }

      const clone: Record<string, any> = { ...resource };
      delete clone.id;
      delete clone.created_at;
      clone.state = targetState;
      clone.latitude = null;
      clone.longitude = null;
      clone.geo_source = null;
      clone.geocoded_at = null;
      clone.source_name = `Cloned from ${sourceState}`;

      const { error } = await supabaseAdmin.from("resources").insert(clone);
      if (error) {
        errors.push(`${resource.title}: ${error.message}`);
      } else {
        created++;
        existingTitles.add(resource.title.toLowerCase().trim());
      }
    }

    const catBreakdown: Record<string, number> = {};
    for (const r of nationalResources) {
      const slug = catNameMap.get(r.category_id) || "unknown";
      catBreakdown[slug] = (catBreakdown[slug] || 0) + 1;
    }

    return res.json({
      source_state: sourceState,
      target_state: targetState,
      source_total: sourceResources.length,
      national_resources: nationalResources.length,
      state_specific_excluded: stateSpecific.length,
      created,
      skipped,
      errors: errors.length,
      error_details: errors.slice(0, 10),
      category_breakdown: catBreakdown,
      note: "Only national/non-city-specific resources were cloned. State-specific resources with city/address were excluded — import those separately via CSV.",
    });
  });

  app.post("/api/admin/resources/geocode-missing", requireAdmin, async (req, res) => {
    if (!hasGeoColumns) {
      return res.status(400).json({ error: "Geo columns not found in resources table" });
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    const send = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const { data: missing, error: fetchErr } = await supabase
        .from("resources")
        .select("id, title, address, city, state, zip")
        .or("latitude.is.null,longitude.is.null")
        .not("state", "is", null)
        .eq("status", "approved")
        .order("title");

      if (fetchErr || !missing) {
        send({ type: "error", message: fetchErr?.message || "Failed to fetch resources" });
        res.end();
        return;
      }

      const candidates = missing.filter((r: any) => {
        const parts = [r.address, r.city, r.state, r.zip].filter(Boolean);
        return parts.length >= 2;
      });

      send({ type: "start", total: candidates.length, skippedNoAddress: missing.length - candidates.length });

      let geocoded = 0;
      let failed = 0;
      const failures: { id: string; title: string; reason: string }[] = [];

      for (let i = 0; i < candidates.length; i++) {
        const r = candidates[i];

        try {
          const geo = await geocodeAddress(r.address, r.city, r.state, r.zip);

          if (geo) {
            const { error: updateErr } = await supabaseAdmin
              .from("resources")
              .update({
                latitude: geo.latitude,
                longitude: geo.longitude,
                geo_source: geo.geo_source,
                geocoded_at: new Date().toISOString(),
              })
              .eq("id", r.id);

            if (updateErr) {
              failed++;
              failures.push({ id: r.id, title: r.title, reason: updateErr.message });
            } else {
              geocoded++;
            }
          } else {
            failed++;
            failures.push({ id: r.id, title: r.title, reason: "Geocoder returned no results" });
          }
        } catch (e: any) {
          failed++;
          failures.push({ id: r.id, title: r.title, reason: e?.message || "Unknown error" });
        }

        send({
          type: "progress",
          current: i + 1,
          total: candidates.length,
          geocoded,
          failed,
          lastTitle: r.title,
        });
      }

      send({
        type: "done",
        geocoded,
        failed,
        total: candidates.length,
        skippedNoAddress: missing.length - candidates.length,
        failures,
      });
    } catch (e: any) {
      send({ type: "error", message: e?.message || "Unknown error" });
    }

    res.end();
  });

  app.patch("/api/admin/resources/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const allowedFields = [
      "title", "short_description", "website_url", "phone", "email",
      "address", "city", "state", "zip", "eligibility", "source_name",
      "source_type", "status", "notes_internal", "category_id",
      "is_featured", "featured_rank", "last_verified_at",
      "sponsored", "monetization_type", "affiliate_url",
      ...(hasSubcategoryColumn ? ["subcategory"] : []),
      ...(hasServicePriorityColumn ? ["service_priority"] : []),
      ...(hasNotifyEmailColumn ? ["notify_email"] : []),
      ...(hasGeoColumns ? ["latitude", "longitude", "geo_source"] : []),
    ];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.status === "approved" && !updates.last_verified_at) {
      updates.last_verified_at = new Date().toISOString();
    }

    const addressChanged = updates.address !== undefined || updates.city !== undefined ||
      updates.state !== undefined || updates.zip !== undefined;
    if (hasGeoColumns && addressChanged && updates.latitude === undefined && updates.longitude === undefined) {
      const addr = updates.address ?? req.body._current_address;
      const ct = updates.city ?? req.body._current_city;
      const st = updates.state ?? req.body._current_state;
      const zp = updates.zip ?? req.body._current_zip;
      const geo = await geocodeAddress(addr, ct, st, zp);
      if (geo) {
        updates.latitude = geo.latitude;
        updates.longitude = geo.longitude;
        updates.geo_source = geo.geo_source;
        updates.geocoded_at = new Date().toISOString();
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    if (updates.category_id) {
      await supabaseAdmin.from("resource_categories")
        .upsert({ resource_id: id, category_id: updates.category_id }, { onConflict: "resource_id,category_id" });
    }

    const additionalCategoryIds: string[] = req.body.additional_category_ids || [];
    if (additionalCategoryIds.length > 0 || req.body.replace_categories) {
      if (req.body.replace_categories) {
        await supabaseAdmin.from("resource_categories").delete().eq("resource_id", id);
      }
      const allCatIds = new Set([...(updates.category_id ? [updates.category_id] : []), ...additionalCategoryIds]);
      for (const catId of allCatIds) {
        if (catId) {
          await supabaseAdmin.from("resource_categories")
            .upsert({ resource_id: id, category_id: catId }, { onConflict: "resource_id,category_id" });
        }
      }
    }

    const subcategoryIds: string[] = req.body.subcategory_ids || [];
    if (subcategoryIds.length > 0 || req.body.replace_subcategories) {
      if (req.body.replace_subcategories) {
        await supabaseAdmin.from("resource_subcategories").delete().eq("resource_id", id);
      }
      for (const sid of subcategoryIds) {
        if (sid) {
          await supabaseAdmin.from("resource_subcategories")
            .upsert({ resource_id: id, subcategory_id: sid }, { onConflict: "resource_id,subcategory_id" });
        }
      }
    }

    if (updates.subcategory && subcategoryIds.length === 0 && !req.body.replace_subcategories) {
      const { data: matchedSubs } = await supabaseAdmin.from("subcategories")
        .select("id").eq("name", updates.subcategory);
      if (matchedSubs && matchedSubs.length > 0) {
        for (const s of matchedSubs) {
          await supabaseAdmin.from("resource_subcategories")
            .upsert({ resource_id: id, subcategory_id: s.id }, { onConflict: "resource_id,subcategory_id" });
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from("resources")
      .update(updates)
      .eq("id", id)
      .select(`*, resource_categories(categories(id, name, slug)), resource_subcategories(subcategories(id, name, slug, category_id))`)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(normalizeAllFields(data));
  });

  app.get("/api/admin/resources/:id/categories", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from("resource_categories")
      .select("category_id, categories(id, name, slug)")
      .eq("resource_id", id);
    if (error) return res.status(500).json({ error: error.message });
    const cats = (data || []).map((rc: any) => rc.categories).filter(Boolean);
    return res.json(cats);
  });

  app.put("/api/admin/resources/:id/categories", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { category_ids } = req.body;
    if (!Array.isArray(category_ids) || category_ids.length === 0) {
      return res.status(400).json({ error: "category_ids array is required" });
    }

    await supabaseAdmin.from("resource_categories").delete().eq("resource_id", id);

    const inserts = category_ids.map((cid: string) => ({ resource_id: id, category_id: cid }));
    const { error } = await supabaseAdmin.from("resource_categories").insert(inserts);
    if (error) return res.status(500).json({ error: error.message });

    await supabaseAdmin.from("resources").update({ category_id: category_ids[0] }).eq("id", id);

    const { data: updated } = await supabaseAdmin
      .from("resource_categories")
      .select("category_id, categories(id, name, slug)")
      .eq("resource_id", id);
    const cats = (updated || []).map((rc: any) => rc.categories).filter(Boolean);
    return res.json(cats);
  });

  app.get("/api/subcategories", async (req, res) => {
    const { category_id, category_slug } = req.query;
    let query = supabase.from("subcategories").select("id, name, slug, category_id, categories!inner(id, name, slug)");
    if (category_id) {
      query = query.eq("category_id", category_id as string);
    }
    if (category_slug) {
      query = query.eq("categories.slug", toLegacy(category_slug as string));
    }
    query = query.order("name");
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    const normalized = (data || []).map((s: any) => {
      if (s.categories && s.categories.slug) {
        return { ...s, categories: { ...s.categories, slug: toCanonical(s.categories.slug) } };
      }
      return s;
    });
    return res.json(normalized);
  });

  app.get("/api/admin/resources/:id/subcategories", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from("resource_subcategories")
      .select("subcategory_id, subcategories(id, name, slug, category_id)")
      .eq("resource_id", id);
    if (error) return res.status(500).json({ error: error.message });
    const subs = (data || []).map((rs: any) => rs.subcategories).filter(Boolean);
    return res.json(subs);
  });

  app.put("/api/admin/resources/:id/subcategories", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { subcategory_ids } = req.body;
    if (!Array.isArray(subcategory_ids)) {
      return res.status(400).json({ error: "subcategory_ids array is required" });
    }

    await supabaseAdmin.from("resource_subcategories").delete().eq("resource_id", id);

    if (subcategory_ids.length > 0) {
      const inserts = subcategory_ids.map((sid: string) => ({ resource_id: id, subcategory_id: sid }));
      const { error } = await supabaseAdmin.from("resource_subcategories").insert(inserts);
      if (error) return res.status(500).json({ error: error.message });
    }

    if (subcategory_ids.length > 0) {
      const { data: firstSub } = await supabaseAdmin.from("subcategories").select("name").eq("id", subcategory_ids[0]).single();
      if (firstSub) {
        await supabaseAdmin.from("resources").update({ subcategory: firstSub.name }).eq("id", id);
      }
    } else {
      await supabaseAdmin.from("resources").update({ subcategory: null }).eq("id", id);
    }

    const { data: updated } = await supabaseAdmin
      .from("resource_subcategories")
      .select("subcategory_id, subcategories(id, name, slug, category_id)")
      .eq("resource_id", id);
    const subs = (updated || []).map((rs: any) => rs.subcategories).filter(Boolean);
    return res.json(subs);
  });

  app.post("/api/report-resource", async (req, res) => {
    const { resource_id, reason } = req.body;
    if (!resource_id) {
      return res.status(400).json({ error: "resource_id is required" });
    }

    const { data: resource } = await supabase
      .from("resources")
      .select("id, title, notes_internal")
      .eq("id", resource_id)
      .single();

    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    const reportNote = `[REPORT ${new Date().toISOString()}] ${reason || "incorrect_info"}`;
    const existingNotes = resource.notes_internal || "";
    const updatedNotes = existingNotes ? `${existingNotes}\n${reportNote}` : reportNote;

    await supabaseAdmin
      .from("resources")
      .update({
        notes_internal: updatedNotes,
        status: "pending",
      })
      .eq("id", resource_id);

    return res.json({ ok: true, message: "Report submitted for admin review" });
  });

  app.post("/api/navigator-request", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkSubmitRate(ip)) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    const {
      resource_id,
      resource_title,
      veteran_name,
      veteran_phone,
      veteran_email,
      message,
      preferred_contact,
      category,
      subcategory,
      user_state,
      user_city,
      user_zip,
      source,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_id,
      session_id,
      urgency,
      consent_followup,
    } = req.body;

    if (!veteran_name || typeof veteran_name !== "string" || veteran_name.trim().length < 2) {
      return res.status(400).json({ error: "Name is required (minimum 2 characters)" });
    }
    if (!veteran_phone && !veteran_email) {
      return res.status(400).json({ error: "Please provide a phone number or email so we can reach you" });
    }
    if (veteran_email && typeof veteran_email === "string" && !veteran_email.includes("@")) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }

    const validContact = ["phone", "email", "either"];
    const contact = validContact.includes(preferred_contact) ? preferred_contact : "phone";

    const catStr = typeof category === "string" ? category.trim() : null;
    const subStr = typeof subcategory === "string" ? subcategory.trim() : null;
    const userMsg = message?.trim() || null;

    const catParts: string[] = [];
    if (catStr) catParts.push(`Category: ${catStr}`);
    if (subStr) catParts.push(`Subcategory: ${subStr}`);

    const baseRow: Record<string, any> = {
      resource_id: resource_id || null,
      resource_title: resource_title?.trim() || null,
      veteran_name: veteran_name.trim(),
      veteran_phone: veteran_phone?.trim() || null,
      veteran_email: veteran_email?.trim() || null,
      preferred_contact: contact,
      user_state: user_state || null,
      user_city: user_city || null,
      user_zip: user_zip || null,
      status: "new",
    };

    if (catStr) baseRow.category = catStr;
    if (subStr) baseRow.subcategory = subStr;

    if (hasNavLifecycleColumns) {
      const validUrgency = ["immediate", "same_week", "standard", "information"];
      if (source && typeof source === "string") baseRow.source = source.trim();
      if (urgency && validUrgency.includes(urgency)) baseRow.urgency = urgency;
      if (consent_followup === true) baseRow.consent_followup = true;
    }

    if (hasNavUtmColumns) {
      if (utm_source && typeof utm_source === "string") baseRow.utm_source = utm_source.trim();
      if (utm_medium && typeof utm_medium === "string") baseRow.utm_medium = utm_medium.trim();
      if (utm_campaign && typeof utm_campaign === "string") baseRow.utm_campaign = utm_campaign.trim();
      if (utm_content && typeof utm_content === "string") baseRow.utm_content = utm_content.trim();
      if (utm_id && typeof utm_id === "string") baseRow.utm_id = utm_id.trim();
      if (session_id && typeof session_id === "string") baseRow.session_id = session_id.trim();
    }

    if (hasNavAmbassadorId && (utm_content || utm_id)) {
      const navAmbId = await resolveAmbassadorId(
        (utm_content && typeof utm_content === "string") ? utm_content.trim() : null,
        (utm_id && typeof utm_id === "string") ? utm_id.trim() : null
      );
      if (navAmbId) baseRow.ambassador_id = navAmbId;
    }

    let { data, error } = await supabaseAdmin
      .from("navigator_requests")
      .insert({ ...baseRow, message: userMsg })
      .select()
      .single();

    if (error && (error.message?.includes("category") || error.message?.includes("subcategory"))) {
      delete baseRow.category;
      delete baseRow.subcategory;
      const enrichedMsg = catParts.length > 0
        ? [catParts.join(" | "), userMsg].filter(Boolean).join("\n")
        : userMsg;
      const retry = await supabaseAdmin
        .from("navigator_requests")
        .insert({ ...baseRow, message: enrichedMsg })
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("Navigator request error:", error.message);
      const msg = error.message?.includes("navigator_requests")
        ? "Navigator system is being enabled — please try again shortly."
        : "Failed to submit request. Please try again.";
      return res.status(500).json({ error: msg });
    }

    let routed = false;
    if (hasPartnerTable && hasRoutingColumns) {
      try {
        const routeResult = await autoRouteNewLead(data.id);
        routed = routeResult.routed;
        if (routed) {
          console.log(`[router] Lead ${data.id} auto-routed to partner — no admin email needed`);
        }
      } catch {
        routed = false;
      }
    }

    if (!routed) {
      console.log(`[router] Lead ${data.id} not routed — self-serve mode, no admin email`);
    }

    if (catStr) {
      logLeadEvent({
        event_type: "help_request_submitted",
        lead_class: "explicit_lead",
        action_type: "submit",
        session_id: session_id || null,
        source_surface: source || "get_help",
        resource_id: resource_id || null,
        category_slug: catStr,
        subcategory_slug: subStr || null,
        utm_id: utm_id || null,
        ambassador_id: baseRow.ambassador_id || null,
        state: user_state || null,
        city: user_city || null,
        delivery_status: routed ? "routed" : "self_serve",
      });
    }

    let selfServeResources: any[] = [];
    if (!routed) {
      try {
        const catFilter = data.category || catStr;
        if (catFilter) {
          const { data: catRow } = await supabase
            .from("categories")
            .select("id, slug")
            .or(`slug.eq.${catFilter},name.ilike.%${catFilter}%`)
            .limit(1)
            .single();
          if (catRow) {
            const mapResource = (r: any) => ({
              title: r.title,
              phone: r.phone,
              website: r.website_url,
              email: r.email,
              address: r.address,
              city: r.city,
              state: r.state,
            });
            const MAX_RESULTS = 5;
            const seenIds = new Set<string>();
            const vetCity = data.user_city?.trim().toLowerCase();
            const vetState = data.user_state?.trim().toUpperCase();

            if (vetCity && vetState) {
              const { data: local } = await supabase
                .from("resources")
                .select("id, title, phone, website_url, email, address, city, state")
                .eq("category_id", catRow.id)
                .eq("status", "approved")
                .ilike("city", vetCity)
                .eq("state", vetState)
                .limit(MAX_RESULTS);
              if (local) {
                for (const r of local) {
                  if (seenIds.size >= MAX_RESULTS) break;
                  seenIds.add(r.id);
                  selfServeResources.push(mapResource(r));
                }
              }
            }

            if (seenIds.size < MAX_RESULTS && vetState) {
              const { data: stateLevel } = await supabase
                .from("resources")
                .select("id, title, phone, website_url, email, address, city, state")
                .eq("category_id", catRow.id)
                .eq("status", "approved")
                .eq("state", vetState)
                .limit(MAX_RESULTS);
              if (stateLevel) {
                for (const r of stateLevel) {
                  if (seenIds.size >= MAX_RESULTS) break;
                  if (seenIds.has(r.id)) continue;
                  seenIds.add(r.id);
                  selfServeResources.push(mapResource(r));
                }
              }
            }

            if (seenIds.size < MAX_RESULTS) {
              const { data: broader } = await supabase
                .from("resources")
                .select("id, title, phone, website_url, email, address, city, state")
                .eq("category_id", catRow.id)
                .eq("status", "approved")
                .limit(MAX_RESULTS);
              if (broader) {
                for (const r of broader) {
                  if (seenIds.size >= MAX_RESULTS) break;
                  if (seenIds.has(r.id)) continue;
                  seenIds.add(r.id);
                  selfServeResources.push(mapResource(r));
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.log(`[self-serve] Error fetching resources for lead ${data.id}:`, err?.message);
      }
    }

    const vetEmail = data.veteran_email?.trim();
    let emailSent = false;
    if (vetEmail && vetEmail.includes("@")) {
      try {
        const { Resend } = await import("resend");
        const resendClient = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || `Veteran Care <onboarding@resend.dev>`;
        const esc = (s: string) => (s || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
        const vetName = esc(data.veteran_name || "");
        const catDisplay = catStr ? esc(catStr.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())) : "";
        const subDisplay = subStr ? esc(subStr) : "";
        const locationParts = [data.user_city, data.user_state].filter(Boolean);
        const locationStr = locationParts.length > 0 ? esc(locationParts.join(", ")) : "";

        let resourcesHtml = "";
        if (selfServeResources.length > 0) {
          resourcesHtml = `<h2 style="color:#1a1a2e;font-size:18px;margin:24px 0 12px;">Recommended Resources</h2>`;
          for (const r of selfServeResources) {
            resourcesHtml += `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:8px;">
              <p style="font-weight:600;margin:0;">${esc(r.title)}</p>
              <p style="color:#6b7280;font-size:13px;margin:4px 0;">${r.city ? esc(r.city) : ''}${r.state ? (r.city ? ', ' : '') + esc(r.state) : ''}</p>
              <div style="margin-top:8px;">
                ${r.website ? `<a href="${r.website.startsWith('http') ? esc(r.website) : 'https://' + esc(r.website)}" style="color:#16a34a;text-decoration:none;font-size:13px;margin-right:16px;">Visit Website</a>` : ''}
                ${r.phone ? `<a href="tel:${esc(r.phone)}" style="color:#16a34a;text-decoration:none;font-size:13px;">${esc(r.phone)}</a>` : ''}
                ${r.email ? `<a href="mailto:${esc(r.email)}" style="color:#16a34a;text-decoration:none;font-size:13px;margin-left:16px;">Email</a>` : ''}
              </div>
            </div>`;
          }
        }

        const summaryParts = [];
        if (catDisplay) summaryParts.push(`<strong>Category:</strong> ${catDisplay}${subDisplay ? ` — ${subDisplay}` : ''}`);
        if (locationStr) summaryParts.push(`<strong>Location:</strong> ${locationStr}`);
        if (data.urgency) {
          const urgencyLabels: Record<string, string> = { immediate: "Immediate", same_week: "This Week", standard: "Standard", information: "Information Only" };
          summaryParts.push(`<strong>Urgency:</strong> ${urgencyLabels[data.urgency] || data.urgency}`);
        }
        if (userMsg) summaryParts.push(`<strong>Your message:</strong> ${esc(userMsg)}`);

        const summaryHtml = summaryParts.length > 0
          ? `<div style="background:#f9fafb;border-radius:8px;padding:14px;margin:20px 0;">
              <p style="font-weight:600;color:#374151;font-size:14px;margin:0 0 8px;">Your Request Summary</p>
              ${summaryParts.map(p => `<p style="color:#374151;font-size:13px;margin:4px 0;">${p}</p>`).join('')}
            </div>`
          : '';

        const statusMsg = routed
          ? `<p style="color:#166534;font-size:15px;font-weight:600;margin:16px 0;">A local partner has been matched and will be reaching out to you soon.</p>`
          : selfServeResources.length > 0
            ? `<p style="color:#166534;font-size:15px;font-weight:600;margin:16px 0;">We've found resources that may be able to help. Their contact information is below.</p>`
            : `<p style="color:#374151;font-size:15px;margin:16px 0;">Your request has been received. A navigator will review it and follow up with you.</p>`;

        const html = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="text-align:center;padding:24px 0;border-bottom:2px solid #16a34a;">
              <img src="https://veterancare.com/logo.png" alt="Veteran Care" style="display:block;max-width:200px;height:auto;margin:0 auto;border:0;" />
              <p style="color:#6b7280;font-size:14px;margin:12px 0 0;">Your Support Request</p>
            </div>
            <p style="color:#374151;font-size:15px;margin:20px 0 4px;">Hi ${vetName || 'there'},</p>
            <p style="color:#374151;font-size:14px;margin:0 0 8px;">Thank you for reaching out to Veteran Care. We've received your request for support.</p>
            ${statusMsg}
            ${summaryHtml}
            ${resourcesHtml}
            <div style="text-align:center;padding:24px 0;margin-top:24px;border-top:1px solid #e5e7eb;">
              <a href="https://veterancare.com/home" style="display:inline-block;background:#166534;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;margin-bottom:12px;">Explore More Resources</a>
              <p style="color:#6b7280;font-size:12px;margin:12px 0 0;">Need more help? Visit <a href="https://veterancare.com" style="color:#16a34a;">veterancare.com</a></p>
            </div>
          </div>`;

        await resendClient.emails.send({
          from: fromEmail,
          to: vetEmail,
          subject: "Veteran Care — Your Support Request",
          html,
        });
        emailSent = true;
        console.log(`[navigator-email] Results email sent to ${vetEmail} for lead ${data.id}`);
      } catch (emailErr: any) {
        console.error(`[navigator-email] Failed to send results email for lead ${data.id}:`, emailErr?.message);
      }
    }

    const response: Record<string, any> = {
      id: data.id,
      status: data.status,
      routed,
      emailSent,
      message: routed
        ? "Your request has been submitted and routed to a local partner who will reach out to you soon."
        : "Your request has been received. A support specialist will review it and follow up with you.",
    };
    if (!routed && selfServeResources.length > 0) {
      response.self_serve_resources = selfServeResources;
    }
    if (hasNavLifecycleColumns) {
      response.source = data.source ?? null;
      response.urgency = data.urgency ?? null;
      response.consent_followup = data.consent_followup ?? false;
    }
    if (hasNavUtmColumns) {
      response.utm_source = data.utm_source ?? null;
      response.utm_medium = data.utm_medium ?? null;
      response.utm_campaign = data.utm_campaign ?? null;
    }
    return res.status(201).json(response);
  });

  app.get("/api/admin/navigator-requests", requireAdmin, async (req, res) => {
    const { status } = req.query;
    const { limit, offset } = parsePagination(req, 100, 500);

    let query = supabaseAdmin
      .from("navigator_requests")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status as string);
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ requests: data || [], total: count || 0 });
  });

  app.post("/api/admin/navigator-requests/bulk-archive", requireAdmin, async (req, res) => {
    const { statuses } = req.body;
    const validToArchive = ["resolved", "cancelled"];
    const archiveStatuses = Array.isArray(statuses) ? statuses.filter((s: string) => validToArchive.includes(s)) : validToArchive;

    const { data, error } = await supabaseAdmin
      .from("navigator_requests")
      .update({ status: "archived" })
      .in("status", archiveStatuses)
      .select("id");

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ archived: data?.length || 0 });
  });

  app.patch("/api/admin/navigator-requests/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status, admin_notes, assigned_to, outcome, contacted_at, resolved_at, closed_at,
            routed_to_partner_id, routed_at, delivery_status, partner_outcome,
            response_status: reqResponseStatus } = req.body;

    const validStatuses = ["new", "in_progress", "resolved", "cancelled", "archived"];
    const validOutcomes = ["connected", "referred", "completed", "no_response", "not_eligible", "declined", "unable_to_contact"];

    const updates: Record<string, any> = {};
    if (status && validStatuses.includes(status)) updates.status = status;
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;

    if (status === "resolved" && !outcome) {
      return res.status(400).json({ error: "Resolving a lead requires an outcome" });
    }
    if (outcome && status && status !== "resolved") {
      return res.status(400).json({ error: "Outcome can only be set when status is resolved" });
    }

    if (hasNavLifecycleColumns) {
      if (assigned_to !== undefined) updates.assigned_to = assigned_to?.trim() || null;
      if (outcome !== undefined) {
        if (validOutcomes.includes(outcome)) {
          updates.outcome = outcome;
        } else {
          return res.status(400).json({ error: `Invalid outcome. Valid values: ${validOutcomes.join(", ")}` });
        }
      }
      if (contacted_at !== undefined) updates.contacted_at = contacted_at || null;
      if (resolved_at !== undefined) updates.resolved_at = resolved_at || null;
      if (req.body.assigned_at !== undefined) updates.assigned_at = req.body.assigned_at || null;
      if (req.body.routed_at !== undefined) updates.routed_at = req.body.routed_at || null;
      if (status === "resolved" && !resolved_at) {
        updates.resolved_at = new Date().toISOString();
      }
    }

    if (hasRoutingColumns) {
      if (routed_to_partner_id !== undefined) updates.routed_to_partner_id = routed_to_partner_id || null;
      if (routed_at !== undefined) updates.routed_at = routed_at || null;
      if (delivery_status !== undefined) updates.delivery_status = delivery_status || null;
      if (partner_outcome !== undefined) updates.partner_outcome = partner_outcome || null;
      if (closed_at !== undefined) updates.closed_at = closed_at || null;
    }

    if (hasResponseTrackingColumns) {
      const validResponseStatuses = ["pending", "accepted", "declined", "need_info", "completed", "escalation_required"];
      if (reqResponseStatus !== undefined) {
        if (validResponseStatuses.includes(reqResponseStatus)) {
          updates.response_status = reqResponseStatus;
          updates.response_at = new Date().toISOString();
        } else {
          return res.status(400).json({ error: `Invalid response_status. Valid values: ${validResponseStatuses.join(", ")}` });
        }
      }
    }

    if (hasBillingColumns && req.body.mark_billed === true) {
      const { data: existing } = await supabaseAdmin.from("navigator_requests").select("billed, is_billable, billing_status").eq("id", id).single();
      if (existing?.billed === true) {
        return res.status(400).json({ error: "Lead is already billed — cannot bill twice" });
      }
      if (!existing?.is_billable) {
        return res.status(400).json({ error: "Lead is not billable — delivery criteria not met" });
      }
      const billedAt = new Date().toISOString();
      const { data: billedRow, error: billErr } = await supabaseAdmin
        .from("navigator_requests")
        .update({ billed: true, billed_at: billedAt, billing_status: "billed", billing_workflow_status: "charged" })
        .eq("id", id)
        .eq("billed", false)
        .select("id")
        .single();
      if (billErr || !billedRow) {
        return res.status(409).json({ error: "Billing update failed — lead may have been billed concurrently" });
      }
      updates.billed = true;
      updates.billed_at = billedAt;
      updates.billing_status = "billed";
      updates.billing_workflow_status = "charged";
    }

    if (hasBillingColumns && req.body.billing_status === "disputed") {
      updates.billing_status = "disputed";
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const { data, error } = await supabaseAdmin
      .from("navigator_requests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  });

  app.delete("/api/admin/navigator-requests/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { data: existing } = await supabaseAdmin
      .from("navigator_requests")
      .select("id, status")
      .eq("id", id)
      .single();
    if (!existing) return res.status(404).json({ error: "Request not found" });

    const { error } = await supabaseAdmin
      .from("navigator_requests")
      .delete()
      .eq("id", id);
    if (error) return res.status(500).json({ error: error.message });

    console.log(`[admin] Permanently deleted navigator_request ${id} (was status: ${existing.status})`);
    return res.json({ success: true, deleted_id: id });
  });

  app.get("/api/admin/billing-summary", requireAdmin, async (_req, res) => {
    if (!hasBillingColumns) return res.json({ available: false });
    try {
      let leads: any[] = [];
      const { data: d1, error: e1 } = await supabaseAdmin.from("navigator_requests").select("billing_status, billing_amount, is_billable, billed, billing_workflow_status");
      if (!e1) {
        leads = d1 || [];
      } else {
        const { data: d2 } = await supabaseAdmin.from("navigator_requests").select("billing_status, billing_amount, is_billable, billed");
        leads = d2 || [];
      }
      const summary = {
        available: true,
        total_leads: leads.length,
        billable: leads.filter((l: any) => l.is_billable && !l.billed).length,
        billed: leads.filter((l: any) => l.billed).length,
        not_billable: leads.filter((l: any) => !l.is_billable).length,
        disputed: leads.filter((l: any) => l.billing_status === "disputed").length,
        total_billable_amount: leads.filter((l: any) => l.is_billable && !l.billed).reduce((sum: number, l: any) => sum + (parseFloat(l.billing_amount) || 49.99), 0),
        total_billed_amount: leads.filter((l: any) => l.billed).reduce((sum: number, l: any) => sum + (parseFloat(l.billing_amount) || 49.99), 0),
        workflow: {
          ready: leads.filter((l: any) => l.billing_workflow_status === "ready").length,
          queued: leads.filter((l: any) => l.billing_workflow_status === "queued").length,
          charged: leads.filter((l: any) => l.billing_workflow_status === "charged").length,
          failed: leads.filter((l: any) => l.billing_workflow_status === "failed").length,
          hold: leads.filter((l: any) => l.billing_workflow_status === "hold").length,
          review_required: leads.filter((l: any) => l.billing_workflow_status === "review_required").length,
        },
      };
      return res.json(summary);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.post("/api/admin/billing-backfill", requireAdmin, async (_req, res) => {
    if (!hasBillingColumns) return res.status(503).json({ error: "Billing columns not available. Run supabase/chunk-5.0-billing-columns.sql" });
    try {
      const { data: allLeads } = await supabaseAdmin.from("navigator_requests").select("id, routed_to_partner_id, email_sent, email_sent_at, is_billable, billed, billing_status");
      const leads = allLeads || [];
      let marked = 0;
      let skipped = 0;
      for (const lead of leads) {
        if (lead.billed) { skipped++; continue; }
        const meetsCriteria = lead.routed_to_partner_id && lead.email_sent === true && lead.email_sent_at;
        if (meetsCriteria && !lead.is_billable) {
          await supabaseAdmin.from("navigator_requests").update({ is_billable: true, billing_status: "billable" }).eq("id", lead.id);
          marked++;
        } else if (!meetsCriteria && lead.billing_status !== "not_billable" && !lead.is_billable) {
          await supabaseAdmin.from("navigator_requests").update({ billing_status: "not_billable" }).eq("id", lead.id);
        }
      }
      return res.json({ success: true, total: leads.length, newly_marked_billable: marked, skipped_already_billed: skipped });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.post("/api/admin/billing-charge/:id", requireAdmin, async (req, res) => {
    if (!hasBillingColumns) return res.status(503).json({ error: "Billing columns not available" });

    const { id } = req.params;
    const { isStripeEnabled, createLeadChargeCheckout } = await import("./stripe-service");

    if (!isStripeEnabled()) {
      return res.status(503).json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY." });
    }

    let lead: any = null;
    let fetchErr: any = null;
    const chargeFields = "id, is_billable, billed, billing_status, billing_amount, billing_workflow_status, veteran_name, category, routed_to_partner_id, stripe_checkout_session_id, stripe_payment_status, assigned_to, email_sent, is_disputed, reassignment_count, response_status, delivery_status, user_state, retry_count";
    const chargeFallback = "id, is_billable, billed, billing_status, billing_amount, veteran_name, category, routed_to_partner_id, assigned_to, email_sent, stripe_payment_status, user_state";
    const { data: d1, error: e1 } = await supabaseAdmin
      .from("navigator_requests")
      .select(chargeFields)
      .eq("id", id)
      .single();
    if (!e1) {
      lead = d1;
    } else {
      const { data: d2, error: e2 } = await supabaseAdmin
        .from("navigator_requests")
        .select(chargeFallback)
        .eq("id", id)
        .single();
      lead = d2;
      fetchErr = e2;
    }

    if (fetchErr || !lead) return res.status(404).json({ error: "Lead not found" });

    const { getBillingConfig, runChargeChecklist, shouldAutoReview, verifyPartnerBillingEligibility } = await import("./billing-governance");
    const config = await getBillingConfig();
    const checklist = runChargeChecklist(lead, config);
    if (!checklist.pass) {
      return res.status(400).json({ error: checklist.failures[0], checklist_failures: checklist.failures });
    }

    if (lead.routed_to_partner_id) {
      const partnerCheck = await verifyPartnerBillingEligibility(lead.routed_to_partner_id);
      if (!partnerCheck.eligible) {
        return res.status(400).json({ error: `Partner ineligible for billing: ${partnerCheck.reason}` });
      }
    }

    const review = shouldAutoReview(lead);
    if (review.flagged) {
      try {
        await supabaseAdmin.from("navigator_requests").update({ billing_workflow_status: "review_required" }).eq("id", id);
      } catch {}
      return res.status(400).json({ error: "Lead auto-flagged for review", review_reasons: review.reasons });
    }

    if (lead.stripe_checkout_session_id) {
      try {
        const { stripe } = await import("./stripe-service");
        if (stripe) {
          const existing = await stripe.checkout.sessions.retrieve(lead.stripe_checkout_session_id);
          if (existing.status === "open") {
            return res.json({ url: existing.url, sessionId: existing.id, reused: true });
          }
        }
      } catch {}
    }

    const amount = parseFloat(lead.billing_amount) || 49.99;
    let partnerName = "Partner";
    if (lead.routed_to_partner_id) {
      try {
        const { data: partner } = await supabaseAdmin.from("partner_organizations").select("name").eq("id", lead.routed_to_partner_id).single();
        if (partner?.name) partnerName = partner.name;
      } catch {}
    }

    try {
      const { url, sessionId } = await createLeadChargeCheckout(id, amount, partnerName, lead.veteran_name || "Unknown", lead.category || "General");

      const chargeUpdate: Record<string, any> = {
        stripe_checkout_session_id: sessionId,
        stripe_payment_status: "pending",
        billing_workflow_status: "queued",
      };
      const { error: cu } = await supabaseAdmin.from("navigator_requests").update(chargeUpdate).eq("id", id);
      if (cu) {
        await supabaseAdmin.from("navigator_requests").update({
          stripe_checkout_session_id: sessionId,
          stripe_payment_status: "pending",
        }).eq("id", id);
      }

      const { logBillingRun } = await import("./billing-governance");
      await logBillingRun("admin", 1, amount, config.billing_mode, [id]);

      return res.json({ url, sessionId });
    } catch (err: any) {
      console.log(`[billing] Stripe charge creation failed for lead ${id}:`, err?.message);
      return res.status(500).json({ error: err?.message || "Stripe charge creation failed" });
    }
  });

  app.get("/api/admin/billing-check-payment/:id", requireAdmin, async (req, res) => {
    if (!hasBillingColumns) return res.status(503).json({ error: "Billing columns not available" });

    const { id } = req.params;
    let lead: any = null;
    const { data: ld1, error: le1 } = await supabaseAdmin
      .from("navigator_requests")
      .select("id, billed, billing_status, stripe_checkout_session_id, stripe_payment_intent_id, stripe_payment_status")
      .eq("id", id)
      .single();
    if (!le1) {
      lead = ld1;
    } else {
      const { data: ld2 } = await supabaseAdmin
        .from("navigator_requests")
        .select("id, billed, billing_status")
        .eq("id", id)
        .single();
      lead = ld2;
    }

    if (!lead) return res.status(404).json({ error: "Lead not found" });
    if (lead.billed) return res.json({ status: "billed", lead });

    if (!lead.stripe_checkout_session_id) return res.json({ status: "no_checkout", lead });

    try {
      const { stripe } = await import("./stripe-service");
      if (!stripe) return res.json({ status: "stripe_unavailable" });

      const session = await stripe.checkout.sessions.retrieve(lead.stripe_checkout_session_id);

      if (session.payment_status === "paid" && !lead.billed) {
        const paymentIntentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent as any)?.id || null;
        const billedAt = new Date().toISOString();

        try {
          await supabaseAdmin.from("navigator_requests").update({
            billed: true,
            billed_at: billedAt,
            billing_status: "billed",
            billing_workflow_status: "charged",
            stripe_payment_intent_id: paymentIntentId,
            stripe_payment_status: "paid",
          }).eq("id", id).eq("billed", false);
        } catch {
          await supabaseAdmin.from("navigator_requests").update({
            billed: true,
            billed_at: billedAt,
            billing_status: "billed",
            billing_workflow_status: "charged",
          }).eq("id", id).eq("billed", false);
        }

        return res.json({ status: "paid_now_billed", paymentIntentId });
      }

      if (session.status === "expired") {
        try {
          await supabaseAdmin.from("navigator_requests").update({
            billing_workflow_status: "failed",
            stripe_payment_status: "expired",
          }).eq("id", id);
        } catch {}
      }

      return res.json({
        status: session.status === "expired" ? "expired" : session.payment_status === "unpaid" ? "unpaid" : session.status,
        checkoutStatus: session.status,
        paymentStatus: session.payment_status,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.patch("/api/admin/billing-workflow/:id", requireAdmin, async (req, res) => {
    if (!hasBillingColumns) return res.status(503).json({ error: "Billing columns not available" });
    const { id } = req.params;
    const { billing_workflow_status, billing_hold_reason } = req.body;
    const validStatuses = ["ready", "queued", "charged", "failed", "hold", "review_required"];
    if (!billing_workflow_status || !validStatuses.includes(billing_workflow_status)) {
      return res.status(400).json({ error: `Invalid billing_workflow_status. Valid: ${validStatuses.join(", ")}` });
    }

    let lead: any = null;
    const { data: ld1, error: le1 } = await supabaseAdmin.from("navigator_requests")
      .select("id, is_billable, billed, billing_workflow_status")
      .eq("id", id).single();
    if (!le1) { lead = ld1; } else {
      const { data: ld2 } = await supabaseAdmin.from("navigator_requests")
        .select("id, is_billable, billed")
        .eq("id", id).single();
      lead = ld2;
    }
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    if (lead.billed && billing_workflow_status !== "charged") {
      return res.status(400).json({ error: "Charged leads cannot change workflow status" });
    }
    if (!lead.is_billable && ["ready", "queued"].includes(billing_workflow_status)) {
      return res.status(400).json({ error: "Non-billable leads cannot be set to ready or queued" });
    }

    const updates: Record<string, any> = { billing_workflow_status };
    if (billing_workflow_status === "hold" && billing_hold_reason) {
      updates.billing_hold_reason = billing_hold_reason.trim().substring(0, 500);
    }
    if (billing_workflow_status !== "hold") {
      updates.billing_hold_reason = null;
    }

    const { data: d1, error: e1 } = await supabaseAdmin.from("navigator_requests")
      .update(updates).eq("id", id).select().single();
    if (!e1) return res.json(d1);
    const { data: d2, error: e2 } = await supabaseAdmin.from("navigator_requests")
      .update({ billing_workflow_status }).eq("id", id).select().single();
    if (!e2) return res.json(d2);
    return res.status(500).json({ error: e2?.message || "Update failed — billing_workflow_status column may not exist. Run supabase/chunk-5.2-billing-workflow.sql" });
  });

  app.post("/api/admin/billing-retry/:id", requireAdmin, async (req, res) => {
    if (!hasBillingColumns) return res.status(503).json({ error: "Billing columns not available" });
    const { id } = req.params;
    const { isStripeEnabled, createLeadChargeCheckout } = await import("./stripe-service");
    if (!isStripeEnabled()) return res.status(503).json({ error: "Stripe is not configured" });

    let lead: any = null;
    const retryFields = "id, is_billable, billed, billing_status, billing_amount, billing_workflow_status, veteran_name, category, routed_to_partner_id, retry_count, is_disputed";
    const retryFallback = "id, is_billable, billed, billing_status, billing_amount, veteran_name, category, routed_to_partner_id";
    const { data: ld1, error: le1 } = await supabaseAdmin.from("navigator_requests")
      .select(retryFields).eq("id", id).single();
    if (!le1) { lead = ld1; } else {
      const { data: ld2 } = await supabaseAdmin.from("navigator_requests")
        .select(retryFallback).eq("id", id).single();
      lead = ld2;
    }
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    if (lead.billed) return res.status(400).json({ error: "Lead is already billed" });
    if (lead.is_disputed) return res.status(400).json({ error: "Lead is disputed — cannot retry" });
    if (lead.billing_workflow_status === "hold") return res.status(400).json({ error: "Lead is on hold — remove hold first" });
    if (lead.billing_workflow_status !== "failed") return res.status(400).json({ error: `Retry is only for failed leads. Current: ${lead.billing_workflow_status}` });

    if (lead.routed_to_partner_id) {
      const { verifyPartnerBillingEligibility } = await import("./billing-governance");
      const partnerCheck = await verifyPartnerBillingEligibility(lead.routed_to_partner_id);
      if (!partnerCheck.eligible) return res.status(400).json({ error: `Partner ineligible for billing: ${partnerCheck.reason}` });
    }

    const currentRetry = lead.retry_count || 0;
    if (currentRetry >= 3) return res.status(400).json({ error: `Retry cap reached (${currentRetry}/3). Manual review required.` });

    const amount = parseFloat(lead.billing_amount) || 49.99;
    let partnerName = "Partner";
    if (lead.routed_to_partner_id) {
      try {
        const { data: partner } = await supabaseAdmin.from("partner_organizations").select("name").eq("id", lead.routed_to_partner_id).single();
        if (partner?.name) partnerName = partner.name;
      } catch {}
    }

    try {
      const { url, sessionId } = await createLeadChargeCheckout(id, amount, partnerName, lead.veteran_name || "Unknown", lead.category || "General");
      const retryUpdate: Record<string, any> = {
        stripe_checkout_session_id: sessionId,
        stripe_payment_status: "pending",
        billing_workflow_status: "queued",
        retry_count: currentRetry + 1,
      };
      const { error: ru } = await supabaseAdmin.from("navigator_requests").update(retryUpdate).eq("id", id);
      if (ru) {
        await supabaseAdmin.from("navigator_requests").update({ stripe_checkout_session_id: sessionId, stripe_payment_status: "pending" }).eq("id", id);
      }

      const { logBillingRun } = await import("./billing-governance");
      await logBillingRun("admin", 1, amount, "retry", [id]);

      return res.json({ url, sessionId, retry_count: currentRetry + 1 });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || "Retry failed" });
    }
  });

  app.post("/api/admin/billing-batch-charge", requireAdmin, async (req, res) => {
    if (!hasBillingColumns) return res.status(503).json({ error: "Billing columns not available" });
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "ids array required" });
    if (ids.length > 5) return res.status(400).json({ error: "Batch size exceeds safe limit (max 5)" });
    const execStart = Date.now();

    const { isStripeEnabled, createLeadChargeCheckout } = await import("./stripe-service");
    if (!isStripeEnabled()) return res.status(503).json({ error: "Stripe is not configured" });

    const { getBillingConfig, runChargeChecklist, shouldAutoReview, logBillingRun, verifyPartnerBillingEligibility } = await import("./billing-governance");
    const config = await getBillingConfig();
    const chargeFields = "id, is_billable, billed, billing_status, billing_amount, billing_workflow_status, veteran_name, category, routed_to_partner_id, stripe_checkout_session_id, stripe_payment_status, assigned_to, email_sent, is_disputed, reassignment_count, response_status, delivery_status, user_state, retry_count";

    const { data: leads, error: fetchErr } = await supabaseAdmin
      .from("navigator_requests")
      .select(chargeFields)
      .in("id", ids);

    if (fetchErr || !leads) return res.status(500).json({ error: "Failed to fetch leads" });

    const validationErrors: { id: string; error: string }[] = [];
    const validLeads: any[] = [];

    for (const lead of leads) {
      if (lead.billed) {
        validationErrors.push({ id: lead.id, error: "Already billed" });
      } else if (lead.billing_workflow_status !== "queued" && lead.billing_workflow_status !== "ready") {
        validationErrors.push({ id: lead.id, error: `Status is ${lead.billing_workflow_status || "unknown"}, must be queued or ready` });
      } else if (lead.is_disputed) {
        validationErrors.push({ id: lead.id, error: "Lead is disputed" });
      } else if (lead.billing_workflow_status === "hold") {
        validationErrors.push({ id: lead.id, error: "Lead is on hold" });
      } else {
        const checklist = runChargeChecklist(lead, config);
        if (!checklist.pass) {
          validationErrors.push({ id: lead.id, error: checklist.failures[0] });
        } else if (lead.routed_to_partner_id) {
          const partnerCheck = await verifyPartnerBillingEligibility(lead.routed_to_partner_id);
          if (!partnerCheck.eligible) {
            validationErrors.push({ id: lead.id, error: `Partner ineligible: ${partnerCheck.reason}` });
          } else {
            const review = shouldAutoReview(lead);
            if (review.flagged) {
              validationErrors.push({ id: lead.id, error: `Auto-flagged: ${review.reasons[0]}` });
              try { await supabaseAdmin.from("navigator_requests").update({ billing_workflow_status: "review_required" }).eq("id", lead.id); } catch {}
            } else {
              validLeads.push(lead);
            }
          }
        } else {
          const review = shouldAutoReview(lead);
          if (review.flagged) {
            validationErrors.push({ id: lead.id, error: `Auto-flagged: ${review.reasons[0]}` });
            try { await supabaseAdmin.from("navigator_requests").update({ billing_workflow_status: "review_required" }).eq("id", lead.id); } catch {}
          } else {
            validLeads.push(lead);
          }
        }
      }
    }

    const missingIds = ids.filter(id => !leads.find((l: any) => l.id === id));
    missingIds.forEach(id => validationErrors.push({ id, error: "Lead not found" }));

    if (validLeads.length === 0) {
      return res.json({ batch_id: null, attempted: 0, succeeded: 0, failed: 0, skipped: validationErrors.length, validation_errors: validationErrors, results: [] });
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const results: { id: string; status: string; url?: string; error?: string }[] = [];
    let succeeded = 0;
    let failed = 0;

    for (const lead of validLeads) {
      try {
        const amount = parseFloat(lead.billing_amount) || 49.99;
        const partnerName = lead.assigned_to || "Partner";
        const session = await createLeadChargeCheckout(lead.id, amount, partnerName, lead.category || "general");
        await supabaseAdmin.from("navigator_requests").update({
          billing_workflow_status: "queued",
          stripe_checkout_session_id: session.id,
          stripe_payment_status: "pending",
        }).eq("id", lead.id);
        results.push({ id: lead.id, status: "checkout_created", url: session.url || undefined });
        succeeded++;
      } catch (err: any) {
        try {
          await supabaseAdmin.from("navigator_requests").update({
            billing_workflow_status: "failed",
            stripe_payment_status: "failed",
          }).eq("id", lead.id);
        } catch {}
        results.push({ id: lead.id, status: "failed", error: err?.message || "Charge failed" });
        failed++;
      }
    }

    const totalAmountAttempted = validLeads.reduce((sum, l) => sum + (parseFloat(l.billing_amount) || 49.99), 0);
    const successfulLeadIds = results.filter(r => r.status === "checkout_created").map(r => r.id);
    const totalAmountSuccessful = validLeads.filter(l => successfulLeadIds.includes(l.id)).reduce((sum, l) => sum + (parseFloat(l.billing_amount) || 49.99), 0);
    const execEnd = Date.now();

    try {
      await supabaseAdmin.from("billing_runs").insert({
        executed_by: "admin_batch",
        number_of_leads_charged: succeeded,
        total_amount: totalAmountSuccessful,
        mode: "batch",
        lead_ids: validLeads.map(l => l.id),
        batch_id: batchId,
        batch_size: validLeads.length,
        attempted_count: validLeads.length,
        success_count: succeeded,
        failure_count: failed,
        total_amount_attempted: totalAmountAttempted,
        total_amount_successful: totalAmountSuccessful,
        execution_time_ms: execEnd - execStart,
      });
    } catch (logErr: any) {
      await logBillingRun("admin_batch", succeeded, totalAmountSuccessful, "batch", validLeads.map(l => l.id));
    }

    return res.json({
      batch_id: batchId,
      attempted: validLeads.length,
      succeeded,
      failed,
      skipped: validationErrors.length,
      validation_errors: validationErrors,
      results,
    });
  });

  app.post("/api/admin/billing-bulk-update", requireAdmin, async (req, res) => {
    if (!hasBillingColumns) return res.status(503).json({ error: "Billing columns not available" });
    const { ids, billing_workflow_status, billing_hold_reason } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: "ids array required" });
    if (ids.length > 100) return res.status(400).json({ error: "Maximum 100 leads per batch" });
    const allowed = ["queued", "hold", "ready", "review_required"];
    if (!allowed.includes(billing_workflow_status)) {
      return res.status(400).json({ error: `Bulk update only supports: ${allowed.join(", ")}` });
    }

    let leads: any[] = [];
    const { data: bl1, error: ble1 } = await supabaseAdmin.from("navigator_requests")
      .select("id, billed, is_billable, billing_workflow_status")
      .in("id", ids);
    if (!ble1) { leads = bl1 || []; } else {
      const { data: bl2 } = await supabaseAdmin.from("navigator_requests")
        .select("id, billed, is_billable")
        .in("id", ids);
      leads = bl2 || [];
    }
    if (leads.length === 0) return res.status(404).json({ error: "No leads found" });

    const eligible = leads.filter((l: any) => {
      if (l.billed) return false;
      if (!l.is_billable && ["ready", "queued"].includes(billing_workflow_status)) return false;
      if (l.billing_workflow_status === "charged") return false;
      return true;
    });

    if (eligible.length === 0) return res.status(400).json({ error: "No eligible leads for this update" });

    const updates: Record<string, any> = { billing_workflow_status };
    if (billing_workflow_status === "hold" && billing_hold_reason) {
      updates.billing_hold_reason = billing_hold_reason.trim().substring(0, 500);
    }
    if (billing_workflow_status !== "hold") updates.billing_hold_reason = null;

    const eligibleIds = eligible.map((l: any) => l.id);
    const { error } = await supabaseAdmin.from("navigator_requests")
      .update(updates).in("id", eligibleIds);
    if (error) {
      const { error: e2 } = await supabaseAdmin.from("navigator_requests")
        .update({ billing_workflow_status }).in("id", eligibleIds);
      if (e2) return res.status(500).json({ error: e2.message });
    }

    return res.json({ updated: eligibleIds.length, skipped: leads.length - eligible.length, total: ids.length });
  });

  app.post("/api/admin/billing-dispute/:id", requireAdmin, async (req, res) => {
    if (!hasBillingColumns) return res.status(503).json({ error: "Billing columns not available" });
    const { id } = req.params;
    const { dispute_reason } = req.body;
    const disputeUpdate: Record<string, any> = {
      is_disputed: true,
      dispute_reason: dispute_reason?.trim()?.substring(0, 1000) || null,
      billing_workflow_status: "hold",
    };
    const { data: d1, error: e1 } = await supabaseAdmin.from("navigator_requests")
      .update(disputeUpdate).eq("id", id).select().single();
    if (!e1) return res.json(d1);
    const { data: d2, error: e2 } = await supabaseAdmin.from("navigator_requests")
      .update({ billing_workflow_status: "hold" }).eq("id", id).select().single();
    if (!e2) return res.json(d2);
    return res.status(500).json({ error: e2?.message || "Dispute update failed" });
  });

  app.post("/api/admin/billing-undispute/:id", requireAdmin, async (req, res) => {
    if (!hasBillingColumns) return res.status(503).json({ error: "Billing columns not available" });
    const { id } = req.params;
    const undisputeUpdate: Record<string, any> = {
      is_disputed: false,
      dispute_reason: null,
      billing_workflow_status: "ready",
    };
    const { data: d1, error: e1 } = await supabaseAdmin.from("navigator_requests")
      .update(undisputeUpdate).eq("id", id).select().single();
    if (!e1) return res.json(d1);
    const { data: d2, error: e2 } = await supabaseAdmin.from("navigator_requests")
      .update({ billing_workflow_status: "ready" }).eq("id", id).select().single();
    if (!e2) return res.json(d2);
    return res.status(500).json({ error: e2?.message || "Undispute failed" });
  });

  app.patch("/api/admin/billing-notes/:id", requireAdmin, async (req, res) => {
    if (!hasBillingColumns) return res.status(503).json({ error: "Billing columns not available" });
    const { id } = req.params;
    const { billing_notes } = req.body;
    const { data, error } = await supabaseAdmin.from("navigator_requests")
      .update({ billing_notes: billing_notes?.trim()?.substring(0, 2000) || null })
      .eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  });

  app.get("/api/admin/billing-config", requireAdmin, async (_req, res) => {
    try {
      const { getBillingConfig } = await import("./billing-governance");
      const config = await getBillingConfig();
      return res.json(config);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.patch("/api/admin/billing-config", requireAdmin, async (req, res) => {
    try {
      const { updateBillingConfig, getBillingConfig } = await import("./billing-governance");
      const validKeys = ["billing_mode", "allowed_categories_for_billing", "allowed_partners_for_billing", "allowed_states_for_billing", "routing_mode"];
      for (const [key, value] of Object.entries(req.body)) {
        if (validKeys.includes(key)) {
          await updateBillingConfig(key, String(value));
        }
      }
      const config = await getBillingConfig();
      return res.json(config);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/billing-runs", requireAdmin, async (_req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from("billing_runs")
        .select("*").order("executed_at", { ascending: false }).limit(50);
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data || []);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/batch-performance-summary", requireAdmin, async (_req, res) => {
    try {
      const { data: runs, error } = await supabaseAdmin.from("billing_runs")
        .select("*").eq("mode", "batch").order("executed_at", { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      const batches = runs || [];
      const total = batches.length;
      if (total === 0) {
        return res.json({ total_batches: 0, avg_batch_size: 0, avg_success_rate: 0, total_revenue: 0, total_failures: 0, high_failure_rate_batches: 0, failure_spike: false, safe_batch_size_range: "SAFE" });
      }

      const sizes = batches.map(b => b.batch_size || b.number_of_leads_charged || 1);
      const avgSize = sizes.reduce((a: number, b: number) => a + b, 0) / total;
      const rates = batches.map(b => {
        const att = b.attempted_count || b.number_of_leads_charged || 1;
        const suc = b.success_count ?? b.number_of_leads_charged ?? 0;
        return att > 0 ? (suc / att) * 100 : 100;
      });
      const avgRate = rates.reduce((a: number, b: number) => a + b, 0) / total;
      const totalRev = batches.reduce((s: number, b: any) => s + (parseFloat(b.total_amount_successful || b.total_amount) || 0), 0);
      const totalFailures = batches.reduce((s: number, b: any) => s + (b.failure_count || 0), 0);
      const highFailBatches = rates.filter(r => r < 80).length;
      const last3 = rates.slice(0, 3);
      const failureSpike = last3.length >= 3 && last3.every(r => r < 80);

      let safeRange = "SAFE";
      if (avgRate < 80) safeRange = "CAUTION";
      else if (avgRate < 90) safeRange = "STABLE";

      const recentRates = rates.slice(0, 5);
      let recommendedBatchSize = "4–5";
      let guidanceText = "Batch performance is strong. You can cautiously increase batch size.";
      if (recentRates.length > 0) {
        const recentAvg = recentRates.reduce((a: number, b: number) => a + b, 0) / recentRates.length;
        if (recentAvg < 80) { recommendedBatchSize = "1–2"; guidanceText = "Batch performance is declining. Reduce batch size and review failures."; }
        else if (recentAvg < 90) { recommendedBatchSize = "3–4"; guidanceText = "Batch performance is stable. Maintain current batch size."; }
      }

      let trendDirection = "stable";
      if (recentRates.length >= 2) {
        const lastRate = recentRates[0];
        const priorAvg = recentRates.slice(1).reduce((a: number, b: number) => a + b, 0) / (recentRates.length - 1);
        if (lastRate > priorAvg + 5) trendDirection = "improving";
        else if (lastRate < priorAvg - 5) trendDirection = "declining";
      }

      let expansionState = "conservative";
      let expansionGuidance = "Increase slowly and monitor closely.";
      if (trendDirection === "declining" || failureSpike) {
        expansionState = "expansion_risk";
        expansionGuidance = "Reduce batch size and review failures.";
      } else if (safeRange === "SAFE" && (trendDirection === "stable" || trendDirection === "improving") && total >= 2) {
        expansionState = "expansion_ready";
        expansionGuidance = "You can cautiously increase batch size.";
      } else if (safeRange === "SAFE" || safeRange === "STABLE") {
        expansionState = "stable";
        expansionGuidance = "Maintain current batch size.";
      }

      const allLeadIds = batches.flatMap(b => b.lead_ids || []);
      let categorySignals: any[] = [];
      let partnerSignals: any[] = [];
      if (allLeadIds.length > 0) {
        try {
          const { data: batchLeads } = await supabaseAdmin.from("navigator_requests")
            .select("id, category, routed_to_partner_id, assigned_to, stripe_checkout_session_id, billing_workflow_status")
            .in("id", allLeadIds.slice(0, 200));
          if (batchLeads && batchLeads.length > 0) {
            const catMap: Record<string, { total: number; success: number }> = {};
            const partMap: Record<string, { total: number; success: number; name: string }> = {};
            for (const l of batchLeads) {
              const cat = l.category || "unknown";
              if (!catMap[cat]) catMap[cat] = { total: 0, success: 0 };
              catMap[cat].total++;
              if (l.stripe_checkout_session_id && l.billing_workflow_status !== "failed") catMap[cat].success++;
              const pid = l.routed_to_partner_id || "unknown";
              const pname = l.assigned_to || pid;
              if (!partMap[pid]) partMap[pid] = { total: 0, success: 0, name: pname };
              partMap[pid].total++;
              if (l.stripe_checkout_session_id && l.billing_workflow_status !== "failed") partMap[pid].success++;
            }
            categorySignals = Object.entries(catMap).map(([cat, v]) => {
              const rate = v.total > 0 ? (v.success / v.total) * 100 : 0;
              let signal = "NO DATA";
              if (v.total >= 2 && rate >= 90) signal = "SAFE";
              else if (v.total >= 2 && rate >= 70) signal = "STABLE";
              else if (v.total >= 2) signal = "RISK";
              else signal = "LIMITED DATA";
              return { category: cat, total: v.total, success: v.success, rate: Math.round(rate), signal };
            }).sort((a, b) => b.total - a.total);
            partnerSignals = Object.entries(partMap).map(([pid, v]) => {
              const rate = v.total > 0 ? (v.success / v.total) * 100 : 0;
              let signal = "NO DATA";
              if (v.total >= 2 && rate >= 90) signal = "SAFE";
              else if (v.total >= 2 && rate >= 70) signal = "STABLE";
              else if (v.total >= 2) signal = "RISK";
              else signal = "LIMITED DATA";
              return { partner_id: pid, partner_name: v.name, total: v.total, success: v.success, rate: Math.round(rate), signal };
            }).sort((a, b) => b.total - a.total);
          }
        } catch {}
      }

      return res.json({
        total_batches: total,
        avg_batch_size: Math.round(avgSize * 10) / 10,
        avg_success_rate: Math.round(avgRate * 10) / 10,
        total_revenue: Math.round(totalRev * 100) / 100,
        total_failures: totalFailures,
        high_failure_rate_batches: highFailBatches,
        failure_spike: failureSpike,
        safe_batch_size_range: safeRange,
        recommended_batch_size: recommendedBatchSize,
        trend_direction: trendDirection,
        guidance_text: guidanceText,
        batch_expansion_state: expansionState,
        expansion_guidance: expansionGuidance,
        category_signals: categorySignals,
        partner_signals: partnerSignals,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/batch-performance-recent", requireAdmin, async (_req, res) => {
    try {
      const { data: runs, error } = await supabaseAdmin.from("billing_runs")
        .select("*").eq("mode", "batch").order("executed_at", { ascending: false }).limit(20);
      if (error) return res.status(500).json({ error: error.message });
      const batches = (runs || []).map((b: any) => {
        const att = b.attempted_count || b.number_of_leads_charged || 1;
        const suc = b.success_count ?? b.number_of_leads_charged ?? 0;
        const fail = b.failure_count || 0;
        return {
          batch_id: b.batch_id || b.id,
          batch_size: b.batch_size || b.number_of_leads_charged || 0,
          attempted_count: att,
          success_count: suc,
          failure_count: fail,
          success_rate: att > 0 ? Math.round((suc / att) * 1000) / 10 : 100,
          total_amount_attempted: parseFloat(b.total_amount_attempted || b.total_amount) || 0,
          total_amount_successful: parseFloat(b.total_amount_successful || b.total_amount) || 0,
          execution_time_ms: b.execution_time_ms || null,
          created_at: b.executed_at,
        };
      });
      return res.json(batches);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/rotation-performance", requireAdmin, async (_req, res) => {
    try {
      const { data: leads, error } = await supabaseAdmin
        .from("navigator_requests")
        .select("id, routing_method, routing_scope_key, routed_to_partner_id, routed_at")
        .eq("routing_method", "rotated")
        .not("routing_scope_key", "is", null)
        .not("routed_to_partner_id", "is", null);

      if (error) return res.status(500).json({ error: error.message });

      const partnerIds = [...new Set((leads || []).map((l: any) => l.routed_to_partner_id).filter(Boolean))];
      let partnerMap: Record<string, string> = {};
      if (partnerIds.length > 0) {
        const { data: partners } = await supabaseAdmin
          .from("partner_organizations")
          .select("id, name")
          .in("id", partnerIds);
        for (const p of partners || []) partnerMap[p.id] = p.name;
      }

      const scopeMap: Record<string, { leads: any[] }> = {};
      for (const l of leads || []) {
        const sk = l.routing_scope_key;
        if (!scopeMap[sk]) scopeMap[sk] = { leads: [] };
        scopeMap[sk].leads.push(l);
      }

      const { data: rotationStates } = await supabaseAdmin
        .from("partner_rotation_state")
        .select("routing_scope_key, last_assigned_partner_id, last_assigned_at");
      const stateMap: Record<string, any> = {};
      for (const s of rotationStates || []) stateMap[s.routing_scope_key] = s;

      const scopes = Object.entries(scopeMap).map(([scopeKey, info]) => {
        const partnerCounts: Record<string, number> = {};
        for (const l of info.leads) {
          const pid = l.routed_to_partner_id;
          partnerCounts[pid] = (partnerCounts[pid] || 0) + 1;
        }
        const totalRotated = info.leads.length;
        const partnerEntries = Object.entries(partnerCounts);
        const numPartners = partnerEntries.length;

        const partners = partnerEntries.map(([pid, count]) => ({
          partner_id: pid,
          partner_name: partnerMap[pid] || "Unknown",
          leads_assigned: count,
          percentage_share: totalRotated > 0 ? Math.round((count / totalRotated) * 1000) / 10 : 0,
        })).sort((a, b) => b.leads_assigned - a.leads_assigned);

        let fairness_status = "low_sample";
        if (totalRotated >= 5 && numPartners > 0) {
          const expectedShare = 1 / numPartners;
          let maxDeviation = 0;
          for (const p of partners) {
            const actualShare = p.leads_assigned / totalRotated;
            const deviation = Math.abs(actualShare - expectedShare) / expectedShare;
            if (deviation > maxDeviation) maxDeviation = deviation;
          }
          if (maxDeviation <= 0.15) fairness_status = "balanced";
          else if (maxDeviation <= 0.30) fairness_status = "slight_skew";
          else fairness_status = "imbalance_detected";
        }

        let advisory_flag = "no_action";
        if (fairness_status === "imbalance_detected" && totalRotated >= 10) {
          advisory_flag = "intervention_required";
        } else if (
          (fairness_status === "slight_skew" && totalRotated >= 5) ||
          (fairness_status === "imbalance_detected" && totalRotated >= 5 && totalRotated < 10)
        ) {
          advisory_flag = "review_recommended";
        } else if (
          fairness_status === "slight_skew" ||
          (fairness_status === "low_sample" && totalRotated >= 3 && totalRotated < 5)
        ) {
          advisory_flag = "monitor";
        }

        const root_cause_hints: string[] = [];
        if (totalRotated < 5) root_cause_hints.push("Small sample size");
        if (numPartners <= 2) root_cause_hints.push("Low partner count in scope");
        if (numPartners === 1) root_cause_hints.push("Single partner — no rotation possible");

        const ADVISORY_GUIDANCE: Record<string, string> = {
          no_action: "No action needed.",
          monitor: "Monitor this scope as volume increases.",
          review_recommended: "Review partner eligibility and recent assignments.",
          intervention_required: "Investigate imbalance. Review partner coverage and rotation scope.",
        };

        const state = stateMap[scopeKey];
        return {
          routing_scope_key: scopeKey,
          number_of_eligible_partners: numPartners,
          total_rotated_leads: totalRotated,
          last_assigned_partner_id: state?.last_assigned_partner_id || null,
          last_assigned_at: state?.last_assigned_at || null,
          fairness_status,
          advisory_flag,
          advisory_guidance: ADVISORY_GUIDANCE[advisory_flag] || "",
          root_cause_hints,
          partners,
        };
      });

      let historyMap: Record<string, any[]> = {};
      try {
        const histRows = await pgQuery(
          `SELECT routing_scope_key, snapshot_at, fairness_status, advisory_flag, total_rotated_leads
           FROM rotation_fairness_history ORDER BY snapshot_at DESC LIMIT 500`
        );
        for (const h of histRows || []) {
          if (!historyMap[h.routing_scope_key]) historyMap[h.routing_scope_key] = [];
          historyMap[h.routing_scope_key].push(h);
        }
      } catch {}

      const FAIRNESS_RANK: Record<string, number> = { balanced: 0, low_sample: 1, slight_skew: 2, imbalance_detected: 3 };
      for (const scope of scopes) {
        const history = (historyMap[scope.routing_scope_key] || []).slice(0, 10);
        scope.recent_history = history.slice(0, 10).map((h: any) => ({ fairness_status: h.fairness_status, advisory_flag: h.advisory_flag, snapshot_at: h.snapshot_at }));

        let trend_direction = "stable";
        if (history.length >= 3) {
          const recent3 = history.slice(0, 3);
          const ranks = recent3.map((h: any) => FAIRNESS_RANK[h.fairness_status] ?? 1);
          if (ranks[0] < ranks[2]) trend_direction = "improving";
          else if (ranks[0] > ranks[2]) trend_direction = "worsening";
        }
        scope.trend_direction = trend_direction;

        let persistent_imbalance = false;
        if (history.length >= 3) {
          const recentForPersist = history.slice(0, 5);
          const imbalanceCount = recentForPersist.filter((h: any) => h.fairness_status === "imbalance_detected").length;
          const hasEnoughLeads = scope.total_rotated_leads >= 5;
          persistent_imbalance = imbalanceCount >= 3 && hasEnoughLeads;
        }
        scope.persistent_imbalance = persistent_imbalance;
      }

      scopes.sort((a, b) => b.total_rotated_leads - a.total_rotated_leads);
      return res.json({ scopes, total_scopes: scopes.length, total_rotated_leads: (leads || []).length });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/partner-subscription-status", requireAdmin, async (_req, res) => {
    try {
      const { getBillingConfig } = await import("./billing-governance");
      const config = await getBillingConfig();

      let subsColumnsAvailable = false;
      let onbColumnsAvailable = false;
      let partners: any[] = [];

      const { error: testErr } = await supabaseAdmin
        .from("partner_organizations")
        .select("subscription_status")
        .limit(1);
      subsColumnsAvailable = !testErr;

      const { error: onbErr } = await supabaseAdmin
        .from("partner_organizations")
        .select("onboarding_status")
        .limit(1);
      onbColumnsAvailable = !onbErr;

      let seededColumnsAvailable = false;
      const { error: seededErr } = await supabaseAdmin
        .from("partner_organizations")
        .select("provider_type, is_seeded")
        .limit(1);
      seededColumnsAvailable = !seededErr;

      let selectFields = "id, name, is_active, is_lead_enabled, partner_status_override";
      if (subsColumnsAvailable) selectFields += ", subscription_status, active_paid_partner";
      if (onbColumnsAvailable) selectFields += ", onboarding_status, activation_date";
      if (seededColumnsAvailable) selectFields += ", provider_type, is_seeded";

      const { data } = await supabaseAdmin
        .from("partner_organizations")
        .select(selectFields)
        .order("name");
      partners = data || [];

      const partnerList = partners.map((p: any) => ({
        id: p.id,
        name: p.name,
        is_active: p.is_active,
        is_lead_enabled: p.is_lead_enabled,
        partner_status_override: p.partner_status_override || "active",
        subscription_status: subsColumnsAvailable ? (p.subscription_status || "active") : "active",
        active_paid_partner: subsColumnsAvailable ? (p.active_paid_partner ?? true) : true,
        onboarding_status: onbColumnsAvailable ? (p.onboarding_status || "pending") : "active",
        activation_date: onbColumnsAvailable ? (p.activation_date || null) : null,
        provider_type: seededColumnsAvailable ? (p.provider_type || "partner") : "partner",
        is_seeded: seededColumnsAvailable ? (p.is_seeded === true) : false,
        routing_eligible: p.is_active && p.is_lead_enabled
          && (p.partner_status_override !== "paused")
          && (subsColumnsAvailable ? p.active_paid_partner !== false : true)
          && (onbColumnsAvailable ? (!p.onboarding_status || p.onboarding_status === "active") : true)
          && (seededColumnsAvailable ? (p.provider_type !== "seeded" && p.is_seeded !== true) : true),
      }));

      return res.json({
        billing_mode: config.billing_mode,
        routing_mode: config.routing_mode,
        subscription_columns_available: subsColumnsAvailable,
        onboarding_columns_available: onbColumnsAvailable,
        partners: partnerList,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/activation-funnel", requireAdmin, async (_req, res) => {
    try {
      const { error: onbErr } = await supabaseAdmin
        .from("partner_organizations")
        .select("onboarding_status")
        .limit(1);
      if (onbErr) {
        return res.json({ available: false, message: "onboarding_status column not yet added" });
      }

      let followUpColumnsAvailable = false;
      const { error: fuErr } = await supabaseAdmin
        .from("partner_organizations")
        .select("follow_up_status")
        .limit(1);
      followUpColumnsAvailable = !fuErr;

      let recoveryColumnsAvailable = false;
      if (followUpColumnsAvailable) {
        const { error: rcErr } = await supabaseAdmin
          .from("partner_organizations")
          .select("recovery_source")
          .limit(1);
        recoveryColumnsAvailable = !rcErr;
      }

      let selectFields = "id, name, contact_email, is_active, onboarding_status, activation_date, subscription_status, active_paid_partner, created_at";
      if (followUpColumnsAvailable) selectFields += ", follow_up_status, last_contact_at, last_contact_type";
      if (recoveryColumnsAvailable) selectFields += ", recovery_source, recovery_timestamp";

      const { data: partners } = await supabaseAdmin
        .from("partner_organizations")
        .select(selectFields)
        .order("name");

      const all = partners || [];

      const approved = all.length;
      const pending = all.filter((p: any) => !p.onboarding_status || p.onboarding_status === "pending");
      const invited = all.filter((p: any) => p.onboarding_status === "invited");
      const subscribed = all.filter((p: any) => p.onboarding_status === "subscribed");
      const active = all.filter((p: any) => p.onboarding_status === "active");

      const recovered = followUpColumnsAvailable ? all.filter((p: any) => p.follow_up_status === "recovered") : [];

      const approvalToInvitePct = approved > 0 ? Math.round(((invited.length + subscribed.length + active.length) / approved) * 1000) / 10 : 0;
      const inviteToSubPct = (invited.length + subscribed.length + active.length) > 0 ? Math.round(((subscribed.length + active.length) / (invited.length + subscribed.length + active.length)) * 1000) / 10 : 0;
      const subToActivePct = (subscribed.length + active.length) > 0 ? Math.round((active.length / (subscribed.length + active.length)) * 1000) / 10 : 0;

      const now = Date.now();
      const stalledPartners = all
        .filter((p: any) => p.onboarding_status && p.onboarding_status !== "active")
        .map((p: any) => {
          const createdMs = p.created_at ? new Date(p.created_at).getTime() : now;
          const hoursSinceCreation = Math.round((now - createdMs) / (1000 * 60 * 60));
          let urgency = "normal";
          if (hoursSinceCreation > 48) urgency = "follow_up_now";
          else if (hoursSinceCreation > 24) urgency = "follow_up_soon";

          let suggestedAction: string = "resend_activation";
          if (p.onboarding_status === "invited" && hoursSinceCreation > 48) suggestedAction = "urgency";
          else if (p.onboarding_status === "invited" && hoursSinceCreation > 24) suggestedAction = "reminder";
          else if (p.onboarding_status === "subscribed") suggestedAction = "payment_recovery";

          return {
            id: p.id,
            name: p.name,
            email: p.contact_email || "",
            onboarding_status: p.onboarding_status,
            subscription_status: p.subscription_status || "none",
            active_paid_partner: p.active_paid_partner ?? false,
            created_at: p.created_at,
            activation_date: p.activation_date,
            hours_since_creation: hoursSinceCreation,
            urgency,
            suggested_action: suggestedAction,
            follow_up_status: followUpColumnsAvailable ? (p.follow_up_status || "none") : "none",
            last_contact_at: followUpColumnsAvailable ? (p.last_contact_at || null) : null,
            last_contact_type: followUpColumnsAvailable ? (p.last_contact_type || null) : null,
          };
        })
        .sort((a: any, b: any) => {
          const rank: Record<string, number> = { follow_up_now: 0, follow_up_soon: 1, normal: 2 };
          return (rank[a.urgency] ?? 2) - (rank[b.urgency] ?? 2);
        });

      const followUpTypes = ["resend_activation", "reminder", "urgency", "payment_recovery"];
      const recoveryPerformance = followUpColumnsAvailable ? followUpTypes.map(type => {
        const sent = all.filter((p: any) => p.last_contact_type === type && (p.follow_up_status === "sent_1" || p.follow_up_status === "sent_2" || p.follow_up_status === "recovered")).length;
        const recoveredByType = recoveryColumnsAvailable
          ? all.filter((p: any) => p.follow_up_status === "recovered" && p.recovery_source === type).length
          : all.filter((p: any) => p.follow_up_status === "recovered" && p.last_contact_type === type).length;
        const conversionRate = sent > 0 ? Math.round((recoveredByType / sent) * 1000) / 10 : 0;
        return { type, total_sent: sent, total_recovered: recoveredByType, conversion_rate: conversionRate };
      }) : [];

      let bestPerforming: string | null = null;
      let worstPerforming: string | null = null;
      if (recoveryPerformance.length > 0) {
        const withSent = recoveryPerformance.filter(r => r.total_sent > 0);
        if (withSent.length > 0) {
          bestPerforming = withSent.reduce((a, b) => a.conversion_rate >= b.conversion_rate ? a : b).type;
          worstPerforming = withSent.reduce((a, b) => a.conversion_rate <= b.conversion_rate ? a : b).type;
          if (bestPerforming === worstPerforming) worstPerforming = null;
        }
      }

      return res.json({
        available: true,
        follow_up_columns_available: followUpColumnsAvailable,
        recovery_columns_available: recoveryColumnsAvailable,
        funnel: {
          approved,
          pending: pending.length,
          invited: invited.length,
          subscribed: subscribed.length,
          active: active.length,
          recovered: recovered.length,
        },
        conversion: {
          approval_to_invite_pct: approvalToInvitePct,
          invite_to_subscription_pct: inviteToSubPct,
          subscription_to_activation_pct: subToActivePct,
        },
        recovery_performance: recoveryPerformance,
        insights: {
          best_performing: bestPerforming,
          worst_performing: worstPerforming,
        },
        stalled_partners: stalledPartners,
        stalled_count: stalledPartners.length,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.post("/api/admin/partner-follow-up/:partnerId", requireAdmin, async (req, res) => {
    try {
      const { partnerId } = req.params;
      const { template } = req.body;
      const validTemplates = ["reminder", "urgency", "payment_recovery", "resend_activation"];
      if (!template || !validTemplates.includes(template)) {
        return res.status(400).json({ error: `Invalid template. Must be one of: ${validTemplates.join(", ")}` });
      }

      let fuSelect = "id, name, contact_email, contact_name, onboarding_status";
      const { error: fuColCheck } = await supabaseAdmin
        .from("partner_organizations")
        .select("follow_up_status")
        .limit(1);
      if (!fuColCheck) fuSelect += ", follow_up_status";

      const { data: partner } = await supabaseAdmin
        .from("partner_organizations")
        .select(fuSelect)
        .eq("id", partnerId)
        .maybeSingle();

      if (!partner) return res.status(404).json({ error: "Partner not found" });
      if (!partner.contact_email) return res.status(400).json({ error: "Partner has no contact email" });
      if (partner.onboarding_status === "active") return res.status(400).json({ error: "Partner is already active" });

      let checkoutUrl = "";
      try {
        const appRows = await pgQuery(
          `SELECT id, stripe_checkout_url FROM partner_applications WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
          [partner.contact_email]
        );
        if (appRows.length > 0 && appRows[0].stripe_checkout_url) {
          checkoutUrl = appRows[0].stripe_checkout_url;
        }
      } catch {}

      if (!checkoutUrl) {
        checkoutUrl = `https://${platform.domain}/partner-signup`;
      }

      let emailResult: { sent: boolean; error?: string } = { sent: false };

      if (template === "resend_activation") {
        const { sendPartnerPaymentEmail } = await import("./lead-email");
        emailResult = await sendPartnerPaymentEmail(
          partner.contact_email,
          partner.name,
          partner.contact_name || null,
          checkoutUrl
        );
      } else {
        const { sendPartnerFollowUpEmail } = await import("./lead-email");
        emailResult = await sendPartnerFollowUpEmail(
          partner.contact_email,
          partner.name,
          partner.contact_name || null,
          checkoutUrl,
          template as "reminder" | "urgency" | "payment_recovery"
        );
      }

      const followUpStage = template === "resend_activation" ? "sent_1"
        : template === "reminder" ? "sent_1"
        : template === "urgency" ? "sent_2"
        : "sent_2";

      try {
        await supabaseAdmin
          .from("partner_organizations")
          .update({
            follow_up_status: followUpStage,
            last_contact_at: new Date().toISOString(),
            last_contact_type: template,
          })
          .eq("id", partnerId);
      } catch {}

      return res.json({
        emailSent: emailResult.sent,
        emailError: emailResult.error,
        template,
        follow_up_status: followUpStage,
        message: emailResult.sent
          ? `${template} email sent to ${partner.contact_email}`
          : `Email failed${emailResult.error ? `: ${emailResult.error}` : ""}`,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/admin/partner-fairness/:partnerId", requireAdmin, async (req, res) => {
    try {
      const { partnerId } = req.params;
      const { data: leads } = await supabaseAdmin
        .from("navigator_requests")
        .select("routing_scope_key, routed_to_partner_id")
        .eq("routing_method", "rotated")
        .not("routed_to_partner_id", "is", null)
        .not("routing_scope_key", "is", null);

      if (!leads || leads.length === 0) return res.json({ scopes: [] });

      const scopeMap: Record<string, { total: number; partnerLeads: number; partnerIds: Set<string> }> = {};
      for (const l of leads) {
        if (!scopeMap[l.routing_scope_key]) scopeMap[l.routing_scope_key] = { total: 0, partnerLeads: 0, partnerIds: new Set() };
        scopeMap[l.routing_scope_key].total++;
        scopeMap[l.routing_scope_key].partnerIds.add(l.routed_to_partner_id);
        if (l.routed_to_partner_id === partnerId) scopeMap[l.routing_scope_key].partnerLeads++;
      }

      let historyMap: Record<string, any[]> = {};
      try {
        const histRows = await pgQuery(
          `SELECT routing_scope_key, fairness_status FROM rotation_fairness_history ORDER BY snapshot_at DESC LIMIT 500`
        );
        for (const h of histRows || []) {
          if (!historyMap[h.routing_scope_key]) historyMap[h.routing_scope_key] = [];
          historyMap[h.routing_scope_key].push(h);
        }
      } catch {}

      const RANK: Record<string, number> = { balanced: 0, low_sample: 1, slight_skew: 2, imbalance_detected: 3 };
      const scopes = Object.entries(scopeMap)
        .filter(([_, v]) => v.partnerLeads > 0)
        .map(([key, v]) => {
          const numPartners = v.partnerIds.size;
          const expectedShare = Math.round(10000 / numPartners) / 100;
          const actualShare = Math.round((v.partnerLeads / v.total) * 1000) / 10;
          const deviation = Math.round((actualShare - expectedShare) * 10) / 10;

          const hist = (historyMap[key] || []).slice(0, 5);
          let trend = "stable";
          if (hist.length >= 3) {
            const ranks = hist.slice(0, 3).map(h => RANK[h.fairness_status] ?? 1);
            if (ranks[0] < ranks[2]) trend = "improving";
            else if (ranks[0] > ranks[2]) trend = "worsening";
          }
          const trendLabel = trend === "improving" ? "improving" : trend === "worsening" ? "slight_skew" : "stable";

          return {
            scope: key,
            your_leads: v.partnerLeads,
            total_leads_in_scope: v.total,
            partners_in_scope: numPartners,
            expected_share_pct: expectedShare,
            your_share_pct: actualShare,
            deviation_pct: deviation,
            trend: trendLabel,
          };
        });

      let activity_level = "moderate";
      let responsiveness_trend = "stable";
      try {
        const { data: allLeads } = await supabaseAdmin
          .from("navigator_requests")
          .select("response_status, response_at, created_at")
          .eq("routed_to_partner_id", partnerId)
          .not("routed_to_partner_id", "is", null);
        if (allLeads && allLeads.length > 0) {
          const responded = allLeads.filter(l => l.response_status === "accepted" || l.response_status === "contacted");
          const responseRate = responded.length / allLeads.length;
          activity_level = responseRate >= 0.6 ? "active" : responseRate >= 0.3 ? "moderate" : "low";

          const now = Date.now();
          const recent = allLeads.filter(l => l.created_at && (now - new Date(l.created_at).getTime()) < 30 * 86400000);
          const older = allLeads.filter(l => l.created_at && (now - new Date(l.created_at).getTime()) >= 30 * 86400000 && (now - new Date(l.created_at).getTime()) < 60 * 86400000);
          if (recent.length >= 2 && older.length >= 2) {
            const recentRate = recent.filter(l => l.response_status === "accepted" || l.response_status === "contacted").length / recent.length;
            const olderRate = older.filter(l => l.response_status === "accepted" || l.response_status === "contacted").length / older.length;
            if (recentRate > olderRate + 0.1) responsiveness_trend = "improving";
            else if (recentRate < olderRate - 0.1) responsiveness_trend = "needs_attention";
          }
        }
      } catch {}

      let health_status = "healthy";
      if (activity_level === "low") health_status = "needs_attention";
      else if (activity_level === "moderate" || responsiveness_trend === "needs_attention") health_status = "at_risk";

      return res.json({ partner_id: partnerId, scopes, activity_level, responsiveness_trend, health_status });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/intelligence/execution-visibility", requireAdmin, async (_req, res) => {
    try {
      const { data: leads, error: evError } = await supabaseAdmin.from("navigator_requests")
        .select("id, created_at, routed_at, assigned_at, response_at, response_status, billing_workflow_status, stripe_payment_status, reassignment_count");
      if (evError || !leads) return res.json({ daily: {}, attention: {}, flow: {}, error: evError?.message });
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const h72ago = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();
      let createdToday = 0, routedToday = 0, respondedToday = 0, completedToday = 0, pendingTotal = 0, reassignedTotal = 0;
      let pending24h = 0, approaching72h = 0, disputedCount = 0, failedPayments = 0, reviewRequired = 0;
      let flowNew = 0, flowRouted = 0, flowResponded = 0, flowCompleted = 0;
      const attentionLeads: { id: string; reason: string }[] = [];
      for (const l of leads) {
        if (l.created_at && l.created_at >= todayStart) createdToday++;
        if (l.routed_at && l.routed_at >= todayStart) routedToday++;
        if (l.response_at && l.response_at >= todayStart) respondedToday++;
        if ((l.response_status === "completed" || l.response_status === "accepted") && l.response_at && l.response_at >= todayStart) completedToday++;
        if ((l.reassignment_count || 0) > 0) reassignedTotal++;
        const isPending = !l.response_status || l.response_status === "pending";
        if (isPending) pendingTotal++;
        flowNew++;
        if (l.routed_at || l.assigned_at) flowRouted++;
        if (l.response_status && l.response_status !== "pending") flowResponded++;
        if (l.response_status === "completed" || l.response_status === "accepted") flowCompleted++;
        if (isPending && l.assigned_at && l.assigned_at < h24ago) {
          pending24h++;
          attentionLeads.push({ id: l.id, reason: "pending_24h" });
        }
        if (isPending && l.assigned_at && l.assigned_at < h72ago) {
          approaching72h++;
        } else if (isPending && l.assigned_at) {
          const assignedMs = new Date(l.assigned_at).getTime();
          const hoursLeft = (assignedMs + 72 * 60 * 60 * 1000 - now.getTime()) / (60 * 60 * 1000);
          if (hoursLeft <= 12 && hoursLeft > 0) {
            approaching72h++;
            attentionLeads.push({ id: l.id, reason: "approaching_72h" });
          }
        }
        if (l.billing_workflow_status === "disputed") { disputedCount++; attentionLeads.push({ id: l.id, reason: "disputed" }); }
        if (l.stripe_payment_status === "failed" || l.billing_workflow_status === "payment_failed") { failedPayments++; attentionLeads.push({ id: l.id, reason: "payment_failed" }); }
        if (l.billing_workflow_status === "review_required") { reviewRequired++; attentionLeads.push({ id: l.id, reason: "review_required" }); }
      }
      return res.json({
        daily: { created: createdToday, routed: routedToday, responded: respondedToday, completed: completedToday, pending: pendingTotal, reassigned: reassignedTotal },
        attention: { pending_24h: pending24h, approaching_72h: approaching72h, disputed: disputedCount, failed_payments: failedPayments, review_required: reviewRequired, leads: attentionLeads.slice(0, 20) },
        flow: { new: flowNew, routed: flowRouted, responded: flowResponded, completed: flowCompleted },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/intelligence/launch-monitoring", requireAdmin, async (_req, res) => {
    try {
      const { data: leads, error: lmErr } = await supabaseAdmin.from("navigator_requests")
        .select("id, created_at, assigned_at, response_status, response_at, routed_at, reassignment_count, billing_workflow_status, stripe_payment_status, routed_to_partner_id");
      if (lmErr || !leads) return res.json({ signals: [], metrics: {} });
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const h7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      let createdToday = 0, created7d = 0, pendingTotal = 0, pending24h = 0;
      let readyToCharge = 0, failedPayments = 0, reassignedCount = 0, reviewRequired = 0;
      const partnerResp: Record<string, { assigned: number; responded: number; responseTimes: number[] }> = {};
      for (const l of leads) {
        if (l.created_at && l.created_at >= todayStart) createdToday++;
        if (l.created_at && l.created_at >= h7d) created7d++;
        const isPending = !l.response_status || l.response_status === "pending";
        if (isPending) pendingTotal++;
        if (isPending && l.assigned_at && l.assigned_at < h24ago) pending24h++;
        if ((l.reassignment_count || 0) > 0) reassignedCount++;
        if (l.billing_workflow_status === "ready" || l.billing_workflow_status === "queued") readyToCharge++;
        if (l.stripe_payment_status === "failed" || l.billing_workflow_status === "payment_failed") failedPayments++;
        if (l.billing_workflow_status === "review_required") reviewRequired++;
        const pid = l.routed_to_partner_id;
        if (pid) {
          if (!partnerResp[pid]) partnerResp[pid] = { assigned: 0, responded: 0, responseTimes: [] };
          partnerResp[pid].assigned++;
          if (l.response_status && l.response_status !== "pending") {
            partnerResp[pid].responded++;
            if (l.response_at && (l.assigned_at || l.routed_at)) {
              const diff = new Date(l.response_at).getTime() - new Date(l.assigned_at || l.routed_at).getTime();
              if (diff > 0) partnerResp[pid].responseTimes.push(diff);
            }
          }
        }
      }
      const dailyAvg7d = created7d > 0 ? Math.round((created7d / 7) * 100) / 100 : 0;
      const totalPartners = Object.keys(partnerResp).length;
      const inactivePartners = Object.values(partnerResp).filter(p => p.assigned >= 2 && p.responded === 0).length;
      const allResponseRates = Object.values(partnerResp).filter(p => p.assigned >= 2).map(p => p.responded / p.assigned);
      const avgResponseRate = allResponseRates.length > 0 ? Math.round((allResponseRates.reduce((a, b) => a + b, 0) / allResponseRates.length) * 10000) / 100 : 0;
      const allResponseTimes = Object.values(partnerResp).flatMap(p => p.responseTimes);
      const avgResponseHours = allResponseTimes.length > 0 ? Math.round((allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length / (1000 * 60 * 60)) * 100) / 100 : null;
      const reassignmentRate = leads.length > 0 ? Math.round((reassignedCount / leads.length) * 10000) / 100 : 0;

      const signals: { key: string; label: string; level: string; detail: string }[] = [];
      if (createdToday >= 15) signals.push({ key: "high_daily_volume", label: "HIGH VOLUME", level: "warning", detail: `${createdToday} leads today (avg ${dailyAvg7d}/day)` });
      if (pendingTotal > 0 && dailyAvg7d > 0 && pendingTotal > dailyAvg7d * 0.5) signals.push({ key: "high_pending", label: "HIGH PENDING", level: "warning", detail: `${pendingTotal} pending (${pending24h} >24h)` });
      if (pending24h >= 10) signals.push({ key: "high_attention", label: "ATTENTION QUEUE", level: "alert", detail: `${pending24h} leads pending >24h` });
      if (readyToCharge >= 10) signals.push({ key: "high_billing_load", label: "BILLING LOAD HIGH", level: "warning", detail: `${readyToCharge} leads ready to charge` });
      if (avgResponseRate < 30 && allResponseRates.length >= 2) signals.push({ key: "response_dropping", label: "RESPONSE DROPPING", level: "alert", detail: `Avg response rate ${avgResponseRate}%` });
      if (avgResponseHours !== null && avgResponseHours > 48) signals.push({ key: "response_slow", label: "RESPONSE SLOW", level: "warning", detail: `Avg response time ${avgResponseHours}h` });
      if (inactivePartners >= 2) signals.push({ key: "inactive_partners", label: "INACTIVE PARTNERS", level: "alert", detail: `${inactivePartners} of ${totalPartners} partners inactive` });
      if (reassignmentRate > 10) signals.push({ key: "reassignment_pressure", label: "REASSIGNMENT RISING", level: "warning", detail: `${reassignmentRate}% leads reassigned` });
      if (failedPayments >= 3) signals.push({ key: "payment_failures", label: "PAYMENT FAILURES", level: "alert", detail: `${failedPayments} failed payments` });

      return res.json({
        signals,
        metrics: {
          created_today: createdToday, daily_avg_7d: dailyAvg7d, pending_total: pendingTotal, pending_24h: pending24h,
          ready_to_charge: readyToCharge, failed_payments: failedPayments, review_required: reviewRequired,
          reassigned_total: reassignedCount, reassignment_rate: reassignmentRate,
          avg_response_rate: avgResponseRate, avg_response_hours: avgResponseHours,
          total_partners: totalPartners, inactive_partners: inactivePartners, total_leads: leads.length,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/intelligence/daily-revenue", requireAdmin, async (_req, res) => {
    try {
      const { data: leads } = await supabaseAdmin.from("navigator_requests")
        .select("billed, billed_at, billing_workflow_status, billing_amount, stripe_payment_status");
      if (!leads) return res.json({ today: { revenue: 0, paid_leads: 0 }, last_7_days: { revenue: 0, paid_leads: 0 }, avg_revenue_per_lead: 0 });
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
      let todayRev = 0, todayPaid = 0, weekRev = 0, weekPaid = 0, allRev = 0, allPaid = 0;
      for (const l of leads) {
        if (!l.billed && l.billing_workflow_status !== "charged") continue;
        const amt = parseFloat(l.billing_amount) || 49.99;
        allRev += amt;
        allPaid++;
        if (l.billed_at) {
          if (l.billed_at >= todayStart) { todayRev += amt; todayPaid++; }
          if (l.billed_at >= weekStart) { weekRev += amt; weekPaid++; }
        }
      }
      return res.json({
        today: { revenue: Math.round(todayRev * 100) / 100, paid_leads: todayPaid },
        last_7_days: { revenue: Math.round(weekRev * 100) / 100, paid_leads: weekPaid },
        all_time: { revenue: Math.round(allRev * 100) / 100, paid_leads: allPaid },
        avg_revenue_per_lead: allPaid > 0 ? Math.round((allRev / allPaid) * 100) / 100 : 0,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/intelligence/category-performance", requireAdmin, async (_req, res) => {
    try {
      const { data: leads } = await supabaseAdmin.from("navigator_requests")
        .select("category, is_billable, billed, billing_workflow_status, stripe_payment_status, billing_amount");
      if (!leads) return res.json([]);
      const cats: Record<string, { category: string; total: number; billable: number; paid: number; revenue: number }> = {};
      for (const l of leads) {
        const c = l.category || "uncategorized";
        if (!cats[c]) cats[c] = { category: c, total: 0, billable: 0, paid: 0, revenue: 0 };
        cats[c].total++;
        if (l.is_billable) cats[c].billable++;
        if (l.billed || l.billing_workflow_status === "charged") {
          cats[c].paid++;
          cats[c].revenue += parseFloat(l.billing_amount) || 49.99;
        }
      }
      const result = Object.values(cats)
        .map(c => {
          const conversion_rate = c.billable > 0 ? Math.round((c.paid / c.billable) * 10000) / 100 : 0;
          let performance_status = "inactive";
          let alert = null;
          if (c.billable > 0 && c.paid > 0) performance_status = "high_value";
          else if (c.total >= 3 && c.billable === 0) { performance_status = "inactive"; alert = "NO MONETIZATION"; }
          else if (c.billable > 0 && conversion_rate < 5) { performance_status = "low_conversion"; alert = "LOW CONVERSION"; }
          else if (c.total >= 3 && c.paid === 0) performance_status = "emerging";
          let revenue_signal = "non_monetizing";
          if (c.paid > 0 && c.revenue > 0) revenue_signal = "monetizing";
          else if (c.billable > 0 && c.paid === 0) revenue_signal = "underperforming";
          return { ...c, conversion_rate, performance_status, alert, revenue_signal };
        })
        .sort((a, b) => b.total - a.total);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/intelligence/partner-performance", requireAdmin, async (_req, res) => {
    try {
      const { data: leads } = await supabaseAdmin.from("navigator_requests")
        .select("routed_to_partner_id, response_status, response_at, assigned_at, routed_at, billed, billing_workflow_status, billing_amount, is_billable");
      if (!leads) return res.json([]);
      const pMap: Record<string, { partner_id: string; leads_assigned: number; responded: number; accepted: number; declined: number; billed: number; revenue: number; response_times: number[] }> = {};
      for (const l of leads) {
        const pid = l.routed_to_partner_id;
        if (!pid) continue;
        if (!pMap[pid]) pMap[pid] = { partner_id: pid, leads_assigned: 0, responded: 0, accepted: 0, declined: 0, billed: 0, revenue: 0, response_times: [] };
        pMap[pid].leads_assigned++;
        if (l.response_status && l.response_status !== "pending") {
          pMap[pid].responded++;
          if (l.response_status === "accepted" || l.response_status === "completed") pMap[pid].accepted++;
          if (l.response_status === "declined") pMap[pid].declined++;
          if (l.response_at && (l.assigned_at || l.routed_at)) {
            const diff = new Date(l.response_at).getTime() - new Date(l.assigned_at || l.routed_at).getTime();
            if (diff > 0) pMap[pid].response_times.push(diff);
          }
        }
        if (l.billed || l.billing_workflow_status === "charged") {
          pMap[pid].billed++;
          pMap[pid].revenue += parseFloat(l.billing_amount) || 49.99;
        }
      }
      const { data: partners } = await supabaseAdmin.from("partner_organizations").select("id, name, partner_status_override");
      const nameMap: Record<string, string> = {};
      const overrideMap: Record<string, string> = {};
      for (const p of partners || []) { nameMap[p.id] = p.name; overrideMap[p.id] = p.partner_status_override || "active"; }
      const result = Object.values(pMap).map(p => {
        const avgMs = p.response_times.length > 0 ? p.response_times.reduce((a, b) => a + b, 0) / p.response_times.length : null;
        const rr = p.leads_assigned > 0 ? Math.round((p.responded / p.leads_assigned) * 10000) / 100 : 0;
        let performance_status = "inactive";
        let alert = null;
        if (rr >= 40) performance_status = "strong";
        else if (rr >= 15) performance_status = "moderate";
        else if (rr >= 1) { performance_status = "weak"; alert = "LOW RESPONSE"; }
        else { performance_status = "inactive"; if (p.leads_assigned >= 2) alert = "ATTENTION REQUIRED"; }
        const conversionRate = p.leads_assigned > 0 ? Math.round((p.billed / p.leads_assigned) * 10000) / 100 : 0;
        let revenue_signal = "no_revenue";
        if (p.billed > 0 && rr >= 15) revenue_signal = "high_revenue";
        else if (p.billed > 0) revenue_signal = "low_revenue";
        return {
          partner_id: p.partner_id,
          partner_name: nameMap[p.partner_id] || "Unknown",
          leads_assigned: p.leads_assigned,
          responded: p.responded,
          response_rate: rr,
          accepted: p.accepted,
          declined: p.declined,
          avg_response_hours: avgMs ? Math.round((avgMs / (1000 * 60 * 60)) * 100) / 100 : null,
          billed: p.billed,
          revenue: Math.round(p.revenue * 100) / 100,
          conversion_rate: conversionRate,
          performance_status,
          alert,
          revenue_signal,
          partner_status_override: overrideMap[p.partner_id] || "active",
        };
      }).sort((a, b) => b.leads_assigned - a.leads_assigned);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/intelligence/revenue", requireAdmin, async (req, res) => {
    try {
      const { from: fromDate, to: toDate } = req.query;
      let query = supabaseAdmin.from("navigator_requests")
        .select("category, routed_to_partner_id, billed, billed_at, billing_workflow_status, billing_amount, stripe_payment_status");
      if (fromDate) query = query.gte("billed_at", String(fromDate));
      if (toDate) query = query.lte("billed_at", String(toDate));
      const { data: leads } = await query;
      if (!leads) return res.json({ total_revenue: 0, by_category: {}, by_partner: {}, paid_count: 0 });
      let totalRevenue = 0;
      let paidCount = 0;
      const byCat: Record<string, number> = {};
      const byPartner: Record<string, number> = {};
      for (const l of leads) {
        if (!l.billed && l.billing_workflow_status !== "charged") continue;
        const amt = parseFloat(l.billing_amount) || 49.99;
        totalRevenue += amt;
        paidCount++;
        const cat = l.category || "uncategorized";
        byCat[cat] = (byCat[cat] || 0) + amt;
        if (l.routed_to_partner_id) {
          byPartner[l.routed_to_partner_id] = (byPartner[l.routed_to_partner_id] || 0) + amt;
        }
      }
      const { data: partners } = await supabaseAdmin.from("partner_organizations").select("id, name");
      const nameMap: Record<string, string> = {};
      for (const p of partners || []) nameMap[p.id] = p.name;
      const byPartnerNamed: Record<string, number> = {};
      for (const [pid, amt] of Object.entries(byPartner)) {
        byPartnerNamed[nameMap[pid] || pid] = Math.round(amt * 100) / 100;
      }
      return res.json({
        total_revenue: Math.round(totalRevenue * 100) / 100,
        paid_count: paidCount,
        by_category: Object.fromEntries(Object.entries(byCat).map(([k, v]) => [k, Math.round(v * 100) / 100])),
        by_partner: byPartnerNamed,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/intelligence/lead-signals", requireAdmin, async (_req, res) => {
    try {
      const { data: leads } = await supabaseAdmin.from("navigator_requests")
        .select("category, routed_to_partner_id, is_billable, billed, billing_workflow_status, response_status, billing_amount");
      if (!leads) return res.json({ high_value_categories: [], low_conversion_categories: [], high_response_low_payment_partners: [], low_response_partners: [] });
      const catStats: Record<string, { total: number; billable: number; paid: number; revenue: number }> = {};
      const partnerStats: Record<string, { total: number; responded: number; paid: number }> = {};
      for (const l of leads) {
        const c = l.category || "uncategorized";
        if (!catStats[c]) catStats[c] = { total: 0, billable: 0, paid: 0, revenue: 0 };
        catStats[c].total++;
        if (l.is_billable) catStats[c].billable++;
        if (l.billed || l.billing_workflow_status === "charged") {
          catStats[c].paid++;
          catStats[c].revenue += parseFloat(l.billing_amount) || 49.99;
        }
        const pid = l.routed_to_partner_id;
        if (pid) {
          if (!partnerStats[pid]) partnerStats[pid] = { total: 0, responded: 0, paid: 0 };
          partnerStats[pid].total++;
          if (l.response_status && l.response_status !== "pending") partnerStats[pid].responded++;
          if (l.billed || l.billing_workflow_status === "charged") partnerStats[pid].paid++;
        }
      }
      const { data: partners } = await supabaseAdmin.from("partner_organizations").select("id, name");
      const nameMap: Record<string, string> = {};
      for (const p of partners || []) nameMap[p.id] = p.name;
      const highValueCats = Object.entries(catStats)
        .filter(([, s]) => s.paid > 0)
        .map(([c, s]) => ({ category: c, paid: s.paid, revenue: Math.round(s.revenue * 100) / 100, conversion: s.billable > 0 ? Math.round((s.paid / s.billable) * 10000) / 100 : 0 }))
        .sort((a, b) => b.revenue - a.revenue);
      const lowConvCats = Object.entries(catStats)
        .filter(([, s]) => s.billable >= 3 && s.paid === 0)
        .map(([c, s]) => ({ category: c, billable: s.billable, total: s.total }))
        .sort((a, b) => b.billable - a.billable);
      const highRespLowPay = Object.entries(partnerStats)
        .filter(([, s]) => s.total >= 2 && s.responded > 0 && s.paid === 0)
        .map(([pid, s]) => ({ partner: nameMap[pid] || pid, total: s.total, responded: s.responded, paid: s.paid }));
      const lowResp = Object.entries(partnerStats)
        .filter(([, s]) => s.total >= 3 && (s.responded / s.total) < 0.3)
        .map(([pid, s]) => ({ partner: nameMap[pid] || pid, total: s.total, responded: s.responded, response_rate: Math.round((s.responded / s.total) * 10000) / 100 }));
      return res.json({ high_value_categories: highValueCats, low_conversion_categories: lowConvCats, high_response_low_payment_partners: highRespLowPay, low_response_partners: lowResp });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.patch("/api/admin/partner-status-override/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { partner_status_override } = req.body;
    const allowed = ["active", "paused", "review_only"];
    if (!allowed.includes(partner_status_override)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${allowed.join(", ")}` });
    }
    const { data: current } = await supabaseAdmin.from("partner_organizations")
      .select("id, name, partner_status_override").eq("id", id).single();
    const previousValue = current?.partner_status_override || "active";
    const { data, error } = await supabaseAdmin.from("partner_organizations")
      .update({ partner_status_override }).eq("id", id).select().single();
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    try {
      await supabaseAdmin.from("optimization_actions_log").insert({
        decision_type: "partner",
        entity_id: id,
        action_taken: `partner_status_override → ${partner_status_override}`,
        previous_value: previousValue,
        new_value: partner_status_override,
      });
    } catch {}
    return res.json(data);
  });

  app.patch("/api/admin/category-action-flag", requireAdmin, async (req, res) => {
    const { category, flag } = req.body;
    const allowed = ["normal", "expand", "review", "deprioritize"];
    if (!category || !allowed.includes(flag)) {
      return res.status(400).json({ error: `category required, flag must be: ${allowed.join(", ")}` });
    }
    const key = `category_flag:${category}`;
    const { data: existing } = await supabaseAdmin.from("billing_config")
      .select("value").eq("key", key).single();
    const previousValue = existing?.value || "normal";
    await supabaseAdmin.from("billing_config")
      .upsert({ key, value: flag, updated_at: new Date().toISOString() });
    try {
      await supabaseAdmin.from("optimization_actions_log").insert({
        decision_type: "category",
        entity_id: category,
        action_taken: `category_action_flag → ${flag}`,
        previous_value: previousValue,
        new_value: flag,
      });
    } catch {}
    return res.json({ category, flag });
  });

  app.get("/api/admin/category-action-flags", requireAdmin, async (_req, res) => {
    try {
      const { data } = await supabaseAdmin.from("billing_config")
        .select("key, value").like("key", "category_flag:%");
      const flags: Record<string, string> = {};
      for (const row of data || []) {
        const cat = row.key.replace("category_flag:", "");
        flags[cat] = row.value;
      }
      return res.json(flags);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/optimization-log", requireAdmin, async (_req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from("optimization_actions_log")
        .select("*").order("created_at", { ascending: false }).limit(50);
      if (error) return res.status(500).json({ error: error.message });
      return res.json(data || []);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/billing-export", requireAdmin, async (_req, res) => {
    if (!hasBillingColumns) return res.status(503).json({ error: "Billing columns not available" });
    try {
      let leads: any[] = [];
      const { data: d1, error: e1 } = await supabaseAdmin.from("navigator_requests")
        .select("id, veteran_name, category, user_city, user_state, routed_to_partner_id, billing_amount, billing_status, billing_workflow_status, stripe_payment_status, stripe_payment_intent_id, stripe_checkout_session_id, billed_at, is_billable, billed, is_disputed, dispute_reason, billing_notes, retry_count")
        .order("created_at", { ascending: false });
      if (!e1) {
        leads = d1 || [];
      } else {
        const { data: d2 } = await supabaseAdmin.from("navigator_requests")
          .select("id, veteran_name, category, user_city, user_state, routed_to_partner_id, billing_amount, billing_status, stripe_payment_status, stripe_payment_intent_id, stripe_checkout_session_id, billed_at, is_billable, billed")
          .order("created_at", { ascending: false });
        leads = d2 || [];
      }

      const partnerIds = [...new Set(leads.filter((l: any) => l.routed_to_partner_id).map((l: any) => l.routed_to_partner_id))];
      let partnerMap: Record<string, string> = {};
      if (partnerIds.length > 0) {
        const { data: partners } = await supabaseAdmin.from("partner_organizations").select("id, name").in("id", partnerIds);
        for (const p of (partners || [])) partnerMap[p.id] = p.name;
      }

      const header = "lead_id,assigned_entity,category,city,state,billing_amount,billing_status,billing_workflow_status,stripe_payment_status,billed_at,stripe_payment_intent_id,stripe_checkout_session_id,is_disputed,dispute_reason,billing_notes,retry_count";
      const rows = leads.map((l: any) => {
        const esc = (v: any) => `"${String(v || "").replace(/"/g, '""')}"`;
        return [
          esc(l.id), esc(partnerMap[l.routed_to_partner_id] || ""), esc(l.category),
          esc(l.user_city), esc(l.user_state), l.billing_amount || 49.99,
          esc(l.billing_status), esc(l.billing_workflow_status || ""),
          esc(l.stripe_payment_status || ""), esc(l.billed_at || ""),
          esc(l.stripe_payment_intent_id || ""), esc(l.stripe_checkout_session_id || ""),
          l.is_disputed ? "yes" : "no", esc(l.dispute_reason || ""), esc(l.billing_notes || ""), l.retry_count || 0,
        ].join(",");
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=billing-export.csv");
      return res.send([header, ...rows].join("\n"));
    } catch (err: any) {
      return res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/admin/partners", requireAdmin, async (_req, res) => {
    if (!hasPartnerTable) return res.json([]);
    const { data, error } = await supabaseAdmin
      .from("partner_organizations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  });

  app.post("/api/admin/partners", requireAdmin, async (req, res) => {
    if (!hasPartnerTable) return res.status(503).json({ error: "Partner table not available. Run supabase/create_partner_organizations.sql" });
    const { name, contact_name, contact_email, contact_phone, website_url, state, cities, is_lead_enabled, notes } = req.body;
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ error: "Partner name is required" });
    }
    const row: Record<string, any> = {
      name: name.trim(),
      contact_name: contact_name?.trim() || null,
      contact_email: contact_email?.trim() || null,
      contact_phone: contact_phone?.trim() || null,
      website_url: website_url?.trim() || null,
      state: state?.trim()?.toUpperCase() || null,
      cities: Array.isArray(cities) ? cities : null,
      is_lead_enabled: is_lead_enabled === true,
      notes: notes?.trim() || null,
    };
    const { data, error } = await supabaseAdmin.from("partner_organizations").insert(row).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  });

  app.patch("/api/admin/partners/:id", requireAdmin, async (req, res) => {
    if (!hasPartnerTable) return res.status(503).json({ error: "Partner table not available" });
    const { id } = req.params;
    const { name, contact_name, contact_email, contact_phone, website_url, state, cities, is_active, is_lead_enabled, notes } = req.body;
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name?.trim() || null;
    if (contact_name !== undefined) updates.contact_name = contact_name?.trim() || null;
    if (contact_email !== undefined) updates.contact_email = contact_email?.trim() || null;
    if (contact_phone !== undefined) updates.contact_phone = contact_phone?.trim() || null;
    if (website_url !== undefined) updates.website_url = website_url?.trim() || null;
    if (state !== undefined) updates.state = state?.trim()?.toUpperCase() || null;
    if (cities !== undefined) updates.cities = Array.isArray(cities) ? cities : null;
    if (is_active !== undefined) updates.is_active = is_active === true;
    if (is_lead_enabled !== undefined) updates.is_lead_enabled = is_lead_enabled === true;
    if (notes !== undefined) updates.notes = notes?.trim() || null;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });
    const { data, error } = await supabaseAdmin.from("partner_organizations").update(updates).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  });

  app.delete("/api/admin/partners/:id", requireAdmin, async (req, res) => {
    if (!hasPartnerTable) return res.status(503).json({ error: "Partner table not available" });
    const { id } = req.params;
    const { error } = await supabaseAdmin.from("partner_organizations").update({ is_active: false }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  });

  app.get("/api/admin/partners/:id/rules", requireAdmin, async (req, res) => {
    if (!hasRoutingRulesTable) return res.json([]);
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from("partner_routing_rules")
      .select("*")
      .eq("partner_id", id)
      .order("priority", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  });

  app.post("/api/admin/partners/:id/rules", requireAdmin, async (req, res) => {
    if (!hasRoutingRulesTable) return res.status(503).json({ error: "Routing rules table not available" });
    const partnerId = req.params.id;
    const { category_slug, subcategory, urgency, state, city, priority, max_leads_per_day } = req.body;
    const validUrgency = ["immediate", "same_week", "standard", "information"];
    const row: Record<string, any> = {
      partner_id: partnerId,
      category_slug: category_slug?.trim() || null,
      subcategory: subcategory?.trim() || null,
      urgency: urgency && validUrgency.includes(urgency) ? urgency : null,
      state: state?.trim()?.toUpperCase() || null,
      city: city?.trim() || null,
      priority: typeof priority === "number" ? priority : 100,
      max_leads_per_day: typeof max_leads_per_day === "number" ? max_leads_per_day : null,
    };
    const { data, error } = await supabaseAdmin.from("partner_routing_rules").insert(row).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  });

  app.patch("/api/admin/partner-rules/:id", requireAdmin, async (req, res) => {
    if (!hasRoutingRulesTable) return res.status(503).json({ error: "Routing rules table not available" });
    const { id } = req.params;
    const { category_slug, subcategory, urgency, state, city, priority, max_leads_per_day, is_active } = req.body;
    const validUrgency = ["immediate", "same_week", "standard", "information"];
    const updates: Record<string, any> = {};
    if (category_slug !== undefined) updates.category_slug = category_slug?.trim() || null;
    if (subcategory !== undefined) updates.subcategory = subcategory?.trim() || null;
    if (urgency !== undefined) updates.urgency = urgency && validUrgency.includes(urgency) ? urgency : null;
    if (state !== undefined) updates.state = state?.trim()?.toUpperCase() || null;
    if (city !== undefined) updates.city = city?.trim() || null;
    if (priority !== undefined) updates.priority = typeof priority === "number" ? priority : 100;
    if (max_leads_per_day !== undefined) updates.max_leads_per_day = typeof max_leads_per_day === "number" ? max_leads_per_day : null;
    if (is_active !== undefined) updates.is_active = is_active === true;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });
    const { data, error } = await supabaseAdmin.from("partner_routing_rules").update(updates).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  });

  app.delete("/api/admin/partner-rules/:id", requireAdmin, async (req, res) => {
    if (!hasRoutingRulesTable) return res.status(503).json({ error: "Routing rules table not available" });
    const { id } = req.params;
    const { error } = await supabaseAdmin.from("partner_routing_rules").update({ is_active: false }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  });

  app.post("/api/admin/run-escalation", requireAdmin, async (req, res) => {
    try {
      const { checkEscalations } = await import("./lead-escalation");
      const result = await checkEscalations();
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/leads/:id/reroute", requireAdmin, async (req, res) => {
    if (!hasPartnerTable || !hasRoutingColumns) {
      return res.status(503).json({ error: "Routing not available" });
    }
    const { id } = req.params;
    const { partner_id } = req.body;

    if (partner_id) {
      const { data: partner } = await supabaseAdmin.from("partner_organizations").select("id, name").eq("id", partner_id).single();
      if (!partner) return res.status(404).json({ error: "Partner not found" });

      const { data: lead } = await supabaseAdmin.from("navigator_requests").select("routing_history").eq("id", id).single();
      const history = Array.isArray(lead?.routing_history) ? lead.routing_history : [];
      history.push({
        partner_id: partner.id,
        partner_name: partner.name,
        routed_at: new Date().toISOString(),
        delivery_status: "pending",
        manual: true,
      });

      const rerouteNow = new Date().toISOString();
      const { error } = await supabaseAdmin
        .from("navigator_requests")
        .update({
          routed_to_partner_id: partner.id,
          routed_at: rerouteNow,
          delivery_status: "pending",
          routing_history: history,
        })
        .eq("id", id);

      if (error) return res.status(500).json({ error: error.message });

      if (hasResponseTrackingColumns) {
        try { await supabaseAdmin.from("navigator_requests").update({ assigned_at: rerouteNow, response_status: "pending", email_sent: false }).eq("id", id); } catch {}
      }

      import("./lead-email").then(({ sendLeadNotification }) => {
        sendLeadNotification(id, partner.id)
          .then(async () => {
            try { await supabaseAdmin.from("navigator_requests").update({ delivery_status: "delivered" }).eq("id", id); } catch {}
            if (hasResponseTrackingColumns) {
              const emailNow = new Date().toISOString();
              try { await supabaseAdmin.from("navigator_requests").update({ email_sent: true, email_sent_at: emailNow }).eq("id", id); } catch {}
            }
          })
          .catch((err) => {
            console.error(`[reroute] Email notification failed for lead ${id}:`, err?.message);
          });
      });

      return res.json({ success: true, partner_name: partner.name });
    }

    const { routeLead } = await import("./lead-router");
    const result = await routeLead(id);
    if (!result.routed) {
      return res.json({ success: true, rerouted: false, message: "No matching partner found" });
    }
    return res.json({ success: true, rerouted: true, partner_name: result.partnerName });
  });

  app.post("/api/admin/leads/:id/send-assignment-email", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { recipientEmail, recipientName, contactName, assignmentType } = req.body;

    if (!recipientEmail || !recipientName) {
      return res.status(400).json({ error: "recipientEmail and recipientName are required" });
    }

    const { sendLeadNotificationDirect } = await import("./lead-email");
    const result = await sendLeadNotificationDirect(id, recipientEmail, recipientName, contactName);

    if (!result.sent) {
      return res.status(500).json({ error: result.error || "Failed to send email" });
    }

    try {
      const { data: current } = await supabaseAdmin
        .from("navigator_requests")
        .select("routing_history")
        .eq("id", id)
        .single();
      const history = Array.isArray(current?.routing_history) ? current.routing_history : [];
      history.push({
        partner_id: null,
        partner_name: recipientName,
        routed_at: new Date().toISOString(),
        delivery_status: "pending",
        manual: true,
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        assignment_type: assignmentType || "resource",
        recipient_email: recipientEmail,
      });
      const assignNow = new Date().toISOString();
      await supabaseAdmin
        .from("navigator_requests")
        .update({
          routing_history: history,
          delivery_status: "delivered",
        })
        .eq("id", id);
      if (hasResponseTrackingColumns) {
        try { await supabaseAdmin.from("navigator_requests").update({ assigned_at: assignNow, email_sent: true, email_sent_at: assignNow, response_status: "pending" }).eq("id", id); } catch {}
      }
      if (hasBillingColumns) {
        try { await supabaseAdmin.from("navigator_requests").update({ is_billable: true, billing_status: "billable" }).eq("id", id); } catch {}
      }
    } catch {}

    return res.json({ success: true, sent_to: recipientEmail });
  });

  function fuzzyNormalize(str: string): string {
    return (str || "").toLowerCase().replace(/[-_&.,;:'"!?()]/g, " ").replace(/\s+/g, " ").trim();
  }

  function fuzzyMatch(haystack: string | null | undefined, needle: string): boolean {
    if (!haystack || !needle) return false;
    const h = fuzzyNormalize(haystack);
    const n = fuzzyNormalize(needle);
    if (h.includes(n) || n.includes(h)) return true;
    const hCompact = h.replace(/\s/g, "");
    const nCompact = n.replace(/\s/g, "");
    if (hCompact.includes(nCompact) || nCompact.includes(hCompact)) return true;
    return false;
  }

  app.get("/api/admin/leads/assignable-search", requireAdmin, async (req, res) => {
    const { q, category, state, city } = req.query;
    const searchQ = typeof q === "string" ? q.trim().toLowerCase() : "";
    const catQ = typeof category === "string" ? category.trim().toLowerCase() : "";
    const stateQ = typeof state === "string" ? state.trim().toUpperCase() : "";
    const cityQ = typeof city === "string" ? city.trim().toLowerCase() : "";

    const catNormalized = catQ ? catQ.replace(/[&-]/g, " ").replace(/\s+/g, " ").trim() : "";
    const catSlugNormalized = catQ ? catQ.replace(/\s+/g, "-").toLowerCase() : "";
    const catMatches = (targetName: string | null | undefined, targetSlug: string | null | undefined): boolean | null => {
      if (!catNormalized) return null;
      const slugL = (targetSlug || "").toLowerCase().trim();
      if (slugL && slugL === catSlugNormalized) return true;
      if (slugL && (slugL === catQ || catQ === slugL)) return true;
      const nameL = fuzzyNormalize(targetName || "");
      if (nameL && nameL === catNormalized) return true;
      if (nameL && (nameL.includes(catNormalized) || catNormalized.includes(nameL))) return true;
      return false;
    };

    const results: any[] = [];

    try {
      const { data: partnerData } = await supabaseAdmin.from("partner_organizations").select("id, name, contact_name, contact_email, contact_phone, website_url, state, cities, is_active, is_lead_enabled, notes");
      let partnerCategoryMap: Record<string, string[]> = {};
      if (catQ) {
        try {
          const { data: rules } = await supabaseAdmin.from("partner_routing_rules").select("partner_id, category_slug").eq("is_active", true);
          if (rules) {
            for (const r of rules) {
              if (!r.category_slug) continue;
              if (!partnerCategoryMap[r.partner_id]) partnerCategoryMap[r.partner_id] = [];
              if (!partnerCategoryMap[r.partner_id].includes(r.category_slug)) {
                partnerCategoryMap[r.partner_id].push(r.category_slug);
              }
            }
          }
        } catch {}
      }
      if (partnerData) {
        for (const p of partnerData) {
          if (!p.is_active) continue;
          if (stateQ && !searchQ && p.state && p.state.toUpperCase() !== stateQ) continue;
          if (searchQ && !(
            fuzzyMatch(p.name, searchQ) ||
            fuzzyMatch(p.contact_name, searchQ) ||
            fuzzyMatch(p.contact_email, searchQ) ||
            fuzzyMatch(p.notes, searchQ)
          )) continue;
          const partnerCats = partnerCategoryMap[p.id] || [];
          const partnerCatLabel = partnerCats.length > 0 ? partnerCats.map(s => s.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())).join(", ") : null;
          if (catQ && !searchQ && partnerCats.length > 0) {
            const matchesCat = partnerCats.some(slug => {
              const slugNorm = slug.toLowerCase();
              return slugNorm === catSlugNormalized || slugNorm === catQ || catQ === slugNorm;
            });
            if (!matchesCat) continue;
          }
          let relevance = 1;
          if (stateQ && p.state?.toUpperCase() === stateQ) relevance += 2;
          if (cityQ && p.cities?.some((c: string) => c.toLowerCase() === cityQ)) relevance += 3;
          if (partnerCats.some(s => s.toLowerCase() === catSlugNormalized)) relevance += 3;
          results.push({
            id: p.id, name: p.name, type: "partner",
            contact: p.contact_name, phone: p.contact_phone, email: p.contact_email,
            website: p.website_url, state: p.state, city: p.cities?.join(", ") || null,
            isLeadEnabled: p.is_lead_enabled, category: partnerCatLabel, relevance,
          });
        }
      }
    } catch (err: any) { console.log("[assignable-search] partner query error:", err?.message); }

    try {
      let resourceQuery = supabase.from("resources")
        .select("id, title, phone, website_url, email, address, city, state, category_id, status, resource_categories(categories(name, slug))")
        .eq("status", "approved")
        .limit(500);
      if (stateQ && !searchQ) resourceQuery = resourceQuery.or(`state.eq.${stateQ},state.is.null`);
      const { data: resourceData } = await resourceQuery;
      if (resourceData) {
        const normalized = normalizeResourceList(resourceData);
        for (const r of normalized) {
          if (searchQ && !(
            fuzzyMatch(r.title, searchQ) ||
            fuzzyMatch(r.phone, searchQ) ||
            fuzzyMatch(r.email, searchQ)
          )) continue;
          const cm = catMatches(r.categories?.name, r.categories?.slug);
          if (catQ && cm === false) continue;
          let relevance = 0;
          if (stateQ && r.state?.toUpperCase() === stateQ) relevance += 2;
          if (cityQ && r.city?.toLowerCase() === cityQ) relevance += 4;
          if (cm === true) relevance += 3;
          results.push({
            id: r.id, name: r.title, type: "resource",
            contact: null, phone: r.phone, email: r.email,
            website: r.website_url, state: r.state, city: r.city,
            category: r.categories?.name || null, relevance,
          });
        }
      }
    } catch (err: any) { console.log("[assignable-search] resource query error:", err?.message); }

    try {
      const tsRows = await pgQuery(`SELECT id, name, description, phone, email, website, city, state, category_name FROM trusted_services WHERE is_active = true`);
      for (const ts of tsRows) {
        if (stateQ && !searchQ && ts.state && ts.state.toUpperCase() !== stateQ) continue;
        if (searchQ && !(
          fuzzyMatch(ts.name, searchQ) ||
          fuzzyMatch(ts.description, searchQ) ||
          fuzzyMatch(ts.category_name, searchQ)
        )) continue;
        const cm = catMatches(ts.category_name, null);
        if (catQ && cm === false) continue;
        let relevance = 0;
        if (stateQ && ts.state?.toUpperCase() === stateQ) relevance += 2;
        if (cityQ && ts.city?.toLowerCase() === cityQ) relevance += 4;
        if (cm === true) relevance += 3;
        results.push({
          id: `ts_${ts.id}`, name: ts.name, type: "trusted_service",
          contact: null, phone: ts.phone, email: ts.email,
          website: ts.website, state: ts.state, city: ts.city,
          category: ts.category_name, relevance,
        });
      }
    } catch (err: any) { console.log("[assignable-search] trusted_services query error:", err?.message); }

    results.sort((a, b) => b.relevance - a.relevance);
    return res.json(results.slice(0, 50));
  });

  app.get("/api/admin/leads/:id/suggest-partners", requireAdmin, async (req, res) => {
    if (!hasPartnerTable || !hasRoutingColumns) return res.json([]);
    const { id } = req.params;
    const { data: lead } = await supabaseAdmin
      .from("navigator_requests")
      .select("id, category, subcategory, urgency, user_state, user_city")
      .eq("id", id)
      .single();
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    const { findCandidatePartners } = await import("./lead-router");
    const candidates = await findCandidatePartners(lead);
    return res.json(candidates);
  });

  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    let { data: clicks, error: clicksErr } = await supabaseAdmin
      .from("resource_clicks")
      .select("id, resource_id, click_type, user_state, user_city, user_zip, created_at");

    if (clicksErr && clicksErr.message.includes("user_zip")) {
      const fallback = await supabaseAdmin
        .from("resource_clicks")
        .select("id, resource_id, click_type, user_state, user_city, created_at");
      clicks = fallback.data;
      clicksErr = fallback.error;
    }

    const safeClicks = clicksErr ? [] : (clicks || []);

    const { data: resources } = await supabase
      .from("resources")
      .select("id, title, category_id, state, city, sponsored, monetization_type, affiliate_url, resource_categories(categories(name, slug))")
      .eq("status", "approved");

    const normalizedResources = normalizeResourceList(resources || []);
    const resourceMap = new Map<string, any>();
    normalizedResources.forEach((r: any) => resourceMap.set(r.id, r));

    const byCategory: Record<string, number> = {};
    const byState: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    const byClickType: Record<string, number> = {};
    const byResource: Record<string, { title: string; clicks: number; category: string; sponsored: boolean }> = {};

    let affiliateClicks = 0;
    let nonAffiliateClicks = 0;
    const totalClicks = safeClicks.length;

    safeClicks.forEach((click: any) => {
      byClickType[click.click_type] = (byClickType[click.click_type] || 0) + 1;

      if (click.user_state) byState[click.user_state] = (byState[click.user_state] || 0) + 1;
      if (click.user_city) byCity[click.user_city] = (byCity[click.user_city] || 0) + 1;

      const r = resourceMap.get(click.resource_id);
      if (r) {
        const catName = r.categories?.name || "Uncategorized";
        byCategory[catName] = (byCategory[catName] || 0) + 1;

        if (!byResource[r.id]) {
          byResource[r.id] = { title: r.title, clicks: 0, category: catName, sponsored: !!r.sponsored };
        }
        byResource[r.id].clicks++;

        if (r.affiliate_url || r.monetization_type === "affiliate") {
          affiliateClicks++;
        } else {
          nonAffiliateClicks++;
        }
      }
    });

    const topResources = Object.entries(byResource)
      .sort((a, b) => b[1].clicks - a[1].clicks)
      .slice(0, 20)
      .map(([id, data]) => ({ id, ...data }));

    const sortedStates = Object.entries(byState)
      .sort((a, b) => b[1] - a[1])
      .map(([state, clicks]) => ({ state, clicks }));

    const sortedCities = Object.entries(byCity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([city, clicks]) => ({ city, clicks }));

    const sortedCategories = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([category, clicks]) => ({ category, clicks }));

    const { count: totalResources } = await supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved");

    const { count: pendingResources } = await supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    const { data: reportedResources } = await supabase
      .from("resources")
      .select("id, title, notes_internal, status, state, city")
      .eq("status", "pending")
      .ilike("notes_internal", "%[REPORT%");

    let navRequests: any[] = [];
    try {
      const { data: navData, error: navErr } = await supabaseAdmin
        .from("navigator_requests")
        .select("id, status, category, subcategory, resource_title, user_state, user_city, created_at");
      if (navErr) console.warn("Navigator stats unavailable:", navErr.message);
      navRequests = navData || [];
    } catch (e: any) {
      console.warn("Navigator stats fetch failed:", e?.message);
    }

    const navByStatus: Record<string, number> = {};
    const navByCategory: Record<string, number> = {};
    const navByState: Record<string, number> = {};
    navRequests.forEach((nr: any) => {
      navByStatus[nr.status || "unknown"] = (navByStatus[nr.status || "unknown"] || 0) + 1;
      if (nr.category) navByCategory[nr.category] = (navByCategory[nr.category] || 0) + 1;
      if (nr.user_state) navByState[nr.user_state] = (navByState[nr.user_state] || 0) + 1;
    });

    return res.json({
      totalClicks,
      totalResources: totalResources || 0,
      pendingResources: pendingResources || 0,
      reportedResources: (reportedResources || []).length,
      affiliateClicks,
      nonAffiliateClicks,
      byClickType,
      byCategory: sortedCategories,
      byState: sortedStates,
      byCity: sortedCities,
      topResources,
      reports: (reportedResources || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        state: r.state,
        city: r.city,
        notes: r.notes_internal,
      })),
      navigatorStats: {
        total: navRequests.length,
        byStatus: navByStatus,
        byCategory: Object.entries(navByCategory)
          .sort((a, b) => b[1] - a[1])
          .map(([category, count]) => ({ category, count })),
        byState: Object.entries(navByState)
          .sort((a, b) => b[1] - a[1])
          .map(([state, count]) => ({ state, count })),
      },
    });
  });

  app.get("/api/admin/exec-summary", requireAdmin, async (_req, res) => {
    try {
      const now = new Date();
      const startOfToday = new Date(now); startOfToday.setUTCHours(0, 0, 0, 0);
      const start7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const start30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const isoToday = startOfToday.toISOString();
      const iso7d = start7d.toISOString();
      const iso30d = start30d.toISOString();

      const inWindow = (createdAt: string | null, since: string) =>
        !!createdAt && createdAt >= since;

      const ROW_CAP = 5000; // safety cap; current data well under
      const [aiRes, navRes, clickRes, resRes, paidPartnersRes] = await Promise.all([
        supabaseAdmin
          .from("ai_usage_log")
          .select("id, detected_category, is_guest, navigator_suggested, created_at")
          .gte("created_at", iso30d)
          .order("created_at", { ascending: false })
          .limit(ROW_CAP),
        supabaseAdmin
          .from("navigator_requests")
          .select("id, status, category, user_state, user_city, routed_to_partner_id, partner_outcome, is_billable, billed, billing_amount, created_at")
          .gte("created_at", iso30d)
          .order("created_at", { ascending: false })
          .limit(ROW_CAP),
        supabaseAdmin
          .from("resource_clicks")
          .select("id, resource_id, user_state, user_city, created_at")
          .gte("created_at", iso30d)
          .limit(ROW_CAP),
        supabase
          .from("resources")
          .select("id, resource_categories(categories(name, slug))")
          .eq("status", "approved"),
        supabaseAdmin
          .from("partner_organizations")
          .select("name, state")
          .eq("active_paid_partner", true)
          .eq("is_active", true)
          .eq("is_lead_enabled", true),
      ]);

      const aiRows = aiRes.data || [];
      const navAll = navRes.data || [];
      const clicks = clickRes.data || [];
      const resources = resRes.data || [];
      const paidPartners = paidPartnersRes.data || [];

      // resource_id → all category names (for click attribution, multi-category aware)
      const resourceToCats = new Map<string, string[]>();
      resources.forEach((r: any) => {
        const links = Array.isArray(r.resource_categories)
          ? r.resource_categories
          : (r.resource_categories ? [r.resource_categories] : []);
        const names: string[] = [];
        links.forEach((rc: any) => {
          const cats = Array.isArray(rc?.categories) ? rc.categories : (rc?.categories ? [rc.categories] : []);
          cats.forEach((c: any) => { if (c?.name) names.push(c.name); });
        });
        resourceToCats.set(r.id, names.length ? names : ["Uncategorized"]);
      });

      const countWindow = <T extends { created_at: string | null }>(rows: T[], since: string) =>
        rows.filter(r => inWindow(r.created_at, since)).length;

      // 1. AI chats
      const aiChats = {
        today: countWindow(aiRows, isoToday),
        last_7d: countWindow(aiRows, iso7d),
        last_30d: aiRows.length,
        navigator_suggested_30d: aiRows.filter(r => r.navigator_suggested).length,
        guest_share_30d: aiRows.length ? Math.round(100 * aiRows.filter(r => r.is_guest).length / aiRows.length) : 0,
      };

      // 2. Top AI categories (30d)
      const aiCatCount: Record<string, number> = {};
      aiRows.forEach(r => {
        const c = (r.detected_category || "").trim();
        if (c && c !== "blocked" && c !== "unknown") aiCatCount[c] = (aiCatCount[c] || 0) + 1;
      });
      const topAiCategories30d = Object.entries(aiCatCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([category, count]) => ({ category, count }));

      // 3. Help requests
      const navByStatus: Record<string, number> = {};
      navAll.forEach((n: any) => { navByStatus[n.status || "unknown"] = (navByStatus[n.status || "unknown"] || 0) + 1; });
      const help = {
        today: countWindow(navAll, isoToday),
        last_7d: countWindow(navAll, iso7d),
        last_30d: countWindow(navAll, iso30d),
        total: navAll.length,
        by_status: navByStatus,
      };

      // 4. Partner lead routings + outcomes
      const routedAll = navAll.filter((n: any) => n.routed_to_partner_id);
      const routedConverted = routedAll.filter((n: any) => ["accepted", "won", "converted", "completed"].includes((n.partner_outcome || "").toLowerCase()));
      const partnerLeads = {
        last_7d: routedAll.filter((n: any) => inWindow(n.created_at, iso7d)).length,
        last_30d: routedAll.filter((n: any) => inWindow(n.created_at, iso30d)).length,
        total_routed: routedAll.length,
        converted: routedConverted.length,
        conversion_rate_pct: routedAll.length ? Math.round(100 * routedConverted.length / routedAll.length) : 0,
      };

      // 5. Top clicked categories (30d) — clicks already filtered to 30d.
      // Multi-category resources contribute one click to each linked category.
      const clickCat: Record<string, number> = {};
      clicks.forEach((c: any) => {
        const cats = resourceToCats.get(c.resource_id) || ["Uncategorized"];
        cats.forEach((cat) => { clickCat[cat] = (clickCat[cat] || 0) + 1; });
      });
      const topClickedCategories30d = Object.entries(clickCat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([category, clicks]) => ({ category, clicks }));

      // 6. Top SC cities (30d) — combine click signals + help-request signals from SC only
      const cityScore: Record<string, { clicks: number; help_requests: number }> = {};
      clicks.filter((c: any) => c.user_state === "SC" && c.user_city).forEach((c: any) => {
        const k = c.user_city;
        cityScore[k] = cityScore[k] || { clicks: 0, help_requests: 0 };
        cityScore[k].clicks++;
      });
      navAll.filter((n: any) => n.user_state === "SC" && n.user_city && inWindow(n.created_at, iso30d)).forEach((n: any) => {
        const k = n.user_city;
        cityScore[k] = cityScore[k] || { clicks: 0, help_requests: 0 };
        cityScore[k].help_requests++;
      });
      const topScCities30d = Object.entries(cityScore)
        .map(([city, v]) => ({ city, clicks: v.clicks, help_requests: v.help_requests, total: v.clicks + v.help_requests }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // 7. Revenue / billing events (lifetime + windowed)
      const billable = navAll.filter((n: any) => n.is_billable);
      const billed = navAll.filter((n: any) => n.billed);
      const billedAmountTotal = billed.reduce((sum: number, n: any) => sum + (parseFloat(n.billing_amount) || 0), 0);
      const billed30d = billed.filter((n: any) => inWindow(n.created_at, iso30d));
      const revenue = {
        billable_total: billable.length,
        billed_total: billed.length,
        billed_last_30d: billed30d.length,
        billed_amount_usd_total: Math.round(billedAmountTotal * 100) / 100,
        billed_amount_usd_30d: Math.round(billed30d.reduce((s: number, n: any) => s + (parseFloat(n.billing_amount) || 0), 0) * 100) / 100,
        active_paid_partners: paidPartners.length,
      };

      return res.json({
        generated_at: now.toISOString(),
        windows: { today_start: isoToday, since_7d: iso7d, since_30d: iso30d },
        metrics: {
          ai_chats: aiChats,
          top_ai_categories_30d: topAiCategories30d,
          help_requests: help,
          partner_leads: partnerLeads,
          top_clicked_categories_30d: topClickedCategories30d,
          top_sc_cities_30d: topScCities30d,
          revenue,
          paid_partners: paidPartners.map((p: any) => ({ name: p.name, state: p.state })),
        },
        unmeasured: [
          { metric: "daily_visitors",  reason: "no page-view tracking yet — AI chats started is the closest proxy" },
          { metric: "device_split",    reason: "user-agent not captured on any event yet" },
          { metric: "bounce_rate",     reason: "no page-view + session-exit tracking yet" },
        ],
      });
    } catch (e: any) {
      console.error("[exec-summary] error:", e);
      return res.status(500).json({ error: e?.message || "exec-summary failed" });
    }
  });

  app.get("/api/admin/ai-insights", requireAdmin, async (_req, res) => {
    try {
      const { data: logs, error } = await supabaseAdmin
        .from("ai_usage_log")
        .select("id, is_guest, detected_category, model, input_tokens, output_tokens, total_tokens, navigator_suggested, created_at")
        .order("created_at", { ascending: false })
        .limit(10000);

      if (error) return res.status(500).json({ error: error.message });
      const rows = logs || [];

      const totalConversations = rows.length;
      const guestCount = rows.filter(r => r.is_guest).length;
      const authCount = totalConversations - guestCount;

      const categoryCounts: Record<string, number> = {};
      rows.forEach(r => {
        if (r.detected_category && r.detected_category !== "blocked") {
          categoryCounts[r.detected_category] = (categoryCounts[r.detected_category] || 0) + 1;
        }
      });
      const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({ category, count }));

      const crisisCount = rows.filter(r => r.detected_category === "crisis-help").length;
      const blockedCount = rows.filter(r => r.detected_category === "blocked").length;
      const fallbackCount = rows.filter(r => r.model === "fallback").length;
      const safetyFilterCount = rows.filter(r => r.model === "safety-filter").length;
      const navigatorSuggestedCount = rows.filter(r => r.navigator_suggested).length;

      const totalInputTokens = rows.reduce((s, r) => s + (r.input_tokens || 0), 0);
      const totalOutputTokens = rows.reduce((s, r) => s + (r.output_tokens || 0), 0);
      const totalTokens = rows.reduce((s, r) => s + (r.total_tokens || 0), 0);

      const inputCostPer1M = 0.15;
      const outputCostPer1M = 0.60;
      const estimatedCost = (totalInputTokens / 1_000_000) * inputCostPer1M + (totalOutputTokens / 1_000_000) * outputCostPer1M;

      const now = new Date();
      const todayStart = new Date(now); todayStart.setUTCHours(0, 0, 0, 0);
      const weekStart = new Date(now); weekStart.setUTCDate(weekStart.getUTCDate() - 7);

      const todayRows = rows.filter(r => new Date(r.created_at) >= todayStart);
      const weekRows = rows.filter(r => new Date(r.created_at) >= weekStart);

      const todayTokens = todayRows.reduce((s, r) => s + (r.total_tokens || 0), 0);
      const weekTokens = weekRows.reduce((s, r) => s + (r.total_tokens || 0), 0);
      const todayConversations = todayRows.length;
      const weekConversations = weekRows.length;
      const todayCost = (todayRows.reduce((s, r) => s + (r.input_tokens || 0), 0) / 1_000_000) * inputCostPer1M +
        (todayRows.reduce((s, r) => s + (r.output_tokens || 0), 0) / 1_000_000) * outputCostPer1M;
      const weekCost = (weekRows.reduce((s, r) => s + (r.input_tokens || 0), 0) / 1_000_000) * inputCostPer1M +
        (weekRows.reduce((s, r) => s + (r.output_tokens || 0), 0) / 1_000_000) * outputCostPer1M;

      const dailyBreakdown: Record<string, { tokens: number; conversations: number; cost: number }> = {};
      rows.forEach(r => {
        const day = new Date(r.created_at).toISOString().slice(0, 10);
        if (!dailyBreakdown[day]) dailyBreakdown[day] = { tokens: 0, conversations: 0, cost: 0 };
        dailyBreakdown[day].tokens += r.total_tokens || 0;
        dailyBreakdown[day].conversations += 1;
        dailyBreakdown[day].cost += ((r.input_tokens || 0) / 1_000_000) * inputCostPer1M +
          ((r.output_tokens || 0) / 1_000_000) * outputCostPer1M;
      });
      const dailyUsage = Object.entries(dailyBreakdown)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 14)
        .map(([date, data]) => ({ date, ...data }));

      const { data: resources } = await supabaseAdmin
        .from("resources")
        .select("id, category_id, resource_categories(categories(slug))")
        .eq("status", "approved");

      const resourceCountByCategory: Record<string, number> = {};
      const normalizedRes = normalizeResourceList(resources || []);
      normalizedRes.forEach((r: any) => {
        const cats = Array.isArray(r.categories) ? r.categories : (r.categories ? [r.categories] : []);
        cats.forEach((c: any) => {
          if (c?.slug) resourceCountByCategory[c.slug] = (resourceCountByCategory[c.slug] || 0) + 1;
        });
      });

      const resourceGaps = topCategories
        .filter(c => c.count >= 3)
        .map(c => {
          const dbSlug = toCanonical(c.category);
          return {
            category: c.category,
            demand: c.count,
            supply: resourceCountByCategory[dbSlug] || 0,
            ratio: (resourceCountByCategory[dbSlug] || 0) / c.count,
          };
        })
        .filter(g => g.ratio < 2)
        .sort((a, b) => a.ratio - b.ratio);

      res.json({
        totalConversations,
        guestCount,
        authCount,
        topCategories,
        crisisCount,
        blockedCount,
        fallbackCount,
        safetyFilterCount,
        navigatorSuggestedCount,
        tokens: { total: totalTokens, input: totalInputTokens, output: totalOutputTokens },
        cost: { total: estimatedCost, today: todayCost, week: weekCost },
        today: { tokens: todayTokens, conversations: todayConversations },
        week: { tokens: weekTokens, conversations: weekConversations },
        dailyUsage,
        resourceGaps,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/states", requireAdmin, async (_req, res) => {
    if (!hasStatesTable) return res.json([]);
    const selectFields = statesHasFullSchema
      ? "*"
      : "code, name, active, created_at";
    const { data, error } = await supabase
      .from("states")
      .select(selectFields)
      .order("name", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    const normalized = (data || []).map((s: any) => ({
      ...s,
      is_active: s.is_active ?? s.active ?? false,
      is_template: s.is_template ?? false,
    }));
    return res.json(normalized);
  });

  app.post("/api/admin/states", requireAdmin, async (req, res) => {
    if (!hasStatesTable) return res.status(503).json({ error: "States table not available. Run supabase/create_states.sql" });
    const { code, name, timezone, admin_contact_name, admin_contact_email, config } = req.body;
    if (!code || !name) return res.status(400).json({ error: "code and name are required" });
    const upperCode = code.toUpperCase().trim();
    if (upperCode.length !== 2) return res.status(400).json({ error: "State code must be 2 characters" });
    const insert: Record<string, any> = {
      code: upperCode,
      name: name.trim(),
    };
    if (statesHasFullSchema) {
      insert.timezone = timezone || "America/New_York";
      insert.admin_contact_name = admin_contact_name || null;
      insert.admin_contact_email = admin_contact_email || null;
      insert.config = config || {};
      insert.is_active = false;
      insert.is_template = false;
    } else {
      insert.active = false;
    }
    const { data, error } = await supabaseAdmin
      .from("states")
      .insert(insert)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  });

  app.patch("/api/admin/states/:code", requireAdmin, async (req, res) => {
    if (!hasStatesTable) return res.status(503).json({ error: "States table not available" });
    const { code } = req.params;
    const allowedFull = ["name", "is_active", "is_template", "launch_date", "timezone", "admin_contact_name", "admin_contact_email", "config"];
    const allowedSimple = ["name", "active"];
    const allowed = statesHasFullSchema ? allowedFull : allowedSimple;
    const updates: Record<string, any> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (!statesHasFullSchema && req.body.is_active !== undefined) {
      updates.active = req.body.is_active;
    }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No valid fields to update" });
    const { data, error } = await supabaseAdmin.from("states").update(updates).eq("code", code.toUpperCase()).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  });

  app.post("/api/admin/states/:code/refresh-counts", requireAdmin, async (req, res) => {
    if (!hasStatesTable) return res.status(503).json({ error: "States table not available" });
    const stateCode = req.params.code.toUpperCase();
    const { data: state, error: stateErr } = await supabaseAdmin.from("states").select("code").eq("code", stateCode).single();
    if (stateErr || !state) return res.status(404).json({ error: "State not found" });

    const { count: resourceCount } = await supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("state", stateCode)
      .eq("status", "approved");

    let partnerCount = 0;
    if (hasPartnerTable) {
      const { count } = await supabaseAdmin
        .from("partner_organizations")
        .select("id", { count: "exact", head: true })
        .eq("state", stateCode)
        .eq("is_active", true);
      partnerCount = count || 0;
    }

    const updateFields: Record<string, any> = statesHasFullSchema
      ? { resource_count: resourceCount || 0, partner_count: partnerCount }
      : {};

    if (Object.keys(updateFields).length > 0) {
      await supabaseAdmin.from("states").update(updateFields).eq("code", stateCode);
    }

    return res.json({
      code: stateCode,
      resource_count: resourceCount || 0,
      partner_count: partnerCount,
    });
  });

  app.get("/api/states/active", async (_req, res) => {
    if (!hasStatesTable) return res.json([]);
    const activeField = statesHasFullSchema ? "is_active" : "active";
    const selectFields = statesHasFullSchema ? "code, name, timezone" : "code, name";
    const { data, error } = await supabase
      .from("states")
      .select(selectFields)
      .eq(activeField, true)
      .order("name", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data || []);
  });

  app.get("/api/veteran-discounts/categories", async (_req, res) => {
    if (!hasTrustedServicesTable) return res.json([]);
    try {
      const rows = await pgQuery(
        `SELECT * FROM trusted_service_categories WHERE program_area IN ('veteran_discount_services', 'trusted_services') AND is_active IS NOT false AND slug NOT LIKE 'discount-%' ORDER BY group_type, display_order`
      );
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/veteran-discounts", async (req, res) => {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    if (!hasTrustedServicesTable) return res.json([]);
    try {
      let userLat = req.query.user_lat ? parseFloat(req.query.user_lat as string) : undefined;
      let userLng = req.query.user_lng ? parseFloat(req.query.user_lng as string) : undefined;
      let radiusMiles = req.query.radius_miles ? parseFloat(req.query.radius_miles as string) : undefined;
      if (userLat !== undefined && (isNaN(userLat) || userLat < -90 || userLat > 90)) userLat = undefined;
      if (userLng !== undefined && (isNaN(userLng) || userLng < -180 || userLng > 180)) userLng = undefined;
      if (radiusMiles !== undefined && (isNaN(radiusMiles) || radiusMiles <= 0)) radiusMiles = undefined;
      if (radiusMiles !== undefined && radiusMiles > 500) radiusMiles = 500;
      const nearMeMode = userLat !== undefined && userLng !== undefined && radiusMiles !== undefined;

      const conditions = [`ts.is_active IS NOT false`, `tsc.program_area IN ('veteran_discount_services', 'trusted_services')`];
      const params: any[] = [];
      if (req.query.category) {
        params.push(req.query.category);
        conditions.push(`tsc.slug = $${params.length}`);
      }
      if (req.query.group_type) {
        params.push(req.query.group_type);
        conditions.push(`tsc.group_type = $${params.length}`);
      }
      if (!nearMeMode && req.query.state) {
        params.push((req.query.state as string).toUpperCase());
        conditions.push(`(ts.state = $${params.length} OR ts.is_national = true OR ts.state IS NULL)`);
      }
      if (nearMeMode) {
        const latDelta = radiusMiles! / 69.0;
        const lngDelta = radiusMiles! / (69.0 * Math.cos((userLat! * Math.PI) / 180));
        params.push(userLat! - latDelta, userLat! + latDelta, userLng! - lngDelta, userLng! + lngDelta);
        const latMinIdx = params.length - 3;
        conditions.push(`((ts.latitude >= $${latMinIdx} AND ts.latitude <= $${latMinIdx + 1} AND ts.longitude >= $${latMinIdx + 2} AND ts.longitude <= $${latMinIdx + 3}) OR ts.is_national = true OR ts.latitude IS NULL OR ts.longitude IS NULL)`);
      }
      const searchTerm = (req.query.q || req.query.search) as string | undefined;
      if (searchTerm) {
        const raw = `%${searchTerm.toLowerCase()}%`;
        const normalized = `%${normalizeSearchTerm(searchTerm)}%`;
        const terms = [...new Set([raw, normalized])];
        const searchOr = terms.flatMap(t => {
          params.push(t);
          const idx = params.length;
          return [
            `LOWER(ts.name) LIKE $${idx}`,
            `LOWER(ts.short_description) LIKE $${idx}`,
            `LOWER(ts.discount_description) LIKE $${idx}`,
            `LOWER(ts.city) LIKE $${idx}`,
            `LOWER(ts.state) LIKE $${idx}`,
            `LOWER(tsc.name) LIKE $${idx}`,
          ];
        });
        conditions.push(`(${searchOr.join(" OR ")})`);
      }
      const sql = `SELECT ts.id, ts.category_id, ts.name, ts.short_description, ts.website_url, ts.phone, ts.email,
                  ts.address, ts.city, ts.state, ts.zip, ts.latitude, ts.longitude,
                  ts.verification_status, ts.verification_label, ts.cta_text, ts.cta_url,
                  ts.is_featured, ts.is_national, ts.listing_type, ts.discount_value, ts.discount_description,
                  ts.display_order, ts.featured_rank, ts.featured_active, ts.near_me_boost_active,
                  ts.offer_title, ts.offer_description, ts.offer_expiry, ts.created_at,
                  tsc.program_area,
             CASE WHEN (ts.is_featured = true AND (ts.featured_active = true OR ts.featured_active IS NULL)) THEN true ELSE false END AS effective_featured,
             CASE WHEN ts.near_me_boost_active = true THEN true ELSE false END AS effective_near_me_boost,
             json_build_object('slug', tsc.slug, 'name', tsc.name, 'group_type', tsc.group_type) AS trusted_service_categories
         FROM trusted_services ts
         INNER JOIN trusted_service_categories tsc ON ts.category_id = tsc.id
         WHERE ${conditions.join(" AND ")}
         ORDER BY (ts.is_featured = true AND (ts.featured_active = true OR ts.featured_active IS NULL)) DESC,
                  ts.featured_rank ASC NULLS LAST,
                  CASE WHEN tsc.program_area = 'trusted_services' THEN 0 ELSE 1 END,
                  ts.display_order ASC NULLS LAST, ts.created_at DESC`;
      let rows = await pgQuery(sql, params);

      if (nearMeMode) {
        rows = rows.map((r: any) => {
          if (r.latitude != null && r.longitude != null) {
            const dist = haversineDistance(userLat!, userLng!, r.latitude, r.longitude);
            return { ...r, distance_miles: Math.round(dist * 10) / 10 };
          }
          return { ...r, distance_miles: r.is_national ? 99999 : 99998 };
        }).filter((r: any) => r.is_national || r.latitude == null || r.longitude == null || (r.distance_miles !== null && r.distance_miles <= radiusMiles!))
          .sort((a: any, b: any) => {
            const aBoost = a.effective_near_me_boost ? 0 : 1;
            const bBoost = b.effective_near_me_boost ? 0 : 1;
            if (aBoost !== bBoost) return aBoost - bBoost;
            const aFeat = a.effective_featured ? 0 : 1;
            const bFeat = b.effective_featured ? 0 : 1;
            if (aFeat !== bFeat) return aFeat - bFeat;
            if (a.effective_featured && b.effective_featured) {
              const aRank = a.featured_rank ?? 9999;
              const bRank = b.featured_rank ?? 9999;
              if (aRank !== bRank) return aRank - bRank;
            }
            const aTier = a.program_area === 'trusted_services' ? 0 : 1;
            const bTier = b.program_area === 'trusted_services' ? 0 : 1;
            if (aTier !== bTier) return aTier - bTier;
            return (a.distance_miles ?? 99999) - (b.distance_miles ?? 99999);
          });
      }

      const FALLBACK_THRESHOLD = 5;
      const tsCategorySlug = req.query.category as string | undefined;
      const resourceCatSlug = tsCategorySlug ? toLegacy(tsCategorySlug) : undefined;

      let fallbackResources: any[] = [];
      if (tsCategorySlug && resourceCatSlug && rows.length < FALLBACK_THRESHOLD) {
        try {
          const { data: matchCat } = await supabaseAdmin.from("categories").select("id").eq("slug", resourceCatSlug).single();
          if (!matchCat) throw new Error("No matching resource category");

          const { data: rcLinks } = await supabaseAdmin
            .from("resource_categories")
            .select("resource_id")
            .eq("category_id", matchCat.id);
          const resIds = (rcLinks || []).map((r: any) => r.resource_id);
          if (resIds.length === 0) throw new Error("No resources in category");

          let rQuery = supabaseAdmin
            .from("resources")
            .select("id, title, short_description, website_url, phone, email, address, city, state, zip, source_type, eligibility, latitude, longitude, category_id")
            .eq("status", "approved")
            .in("id", resIds.slice(0, 50));

          if (!nearMeMode && req.query.state) {
            const st = (req.query.state as string).toUpperCase();
            rQuery = rQuery.or(`state.eq.${st},state.is.null`);
          }

          const { data: resourceRows } = await rQuery.limit(20);
          if (resourceRows && resourceRows.length > 0) {
            fallbackResources = resourceRows.map((r: any) => ({
              id: r.id,
              category_id: r.category_id,
              name: r.title,
              short_description: r.short_description || "",
              website_url: r.website_url || "",
              phone: r.phone || "",
              email: r.email || "",
              address: r.address || "",
              city: r.city || "",
              state: r.state || "",
              zip: r.zip || "",
              latitude: r.latitude,
              longitude: r.longitude,
              verification_status: "none",
              verification_label: "",
              cta_text: "Learn More",
              cta_url: r.website_url || "",
              is_featured: false,
              is_national: !r.city && !r.state,
              listing_type: "service",
              discount_value: null,
              discount_description: null,
              program_area: "resource_fallback",
              trusted_service_categories: { slug: tsCategorySlug, name: "", group_type: "service" },
              source: "resource",
            }));

            if (nearMeMode && userLat !== undefined && userLng !== undefined) {
              fallbackResources = fallbackResources
                .map((r: any) => {
                  if (r.latitude != null && r.longitude != null) {
                    const dist = haversineDistance(userLat!, userLng!, r.latitude, r.longitude);
                    return { ...r, distance_miles: Math.round(dist * 10) / 10 };
                  }
                  return { ...r, distance_miles: r.is_national ? 99999 : 99998 };
                })
                .filter((r: any) => r.is_national || r.latitude == null || (r.distance_miles <= radiusMiles!))
                .sort((a: any, b: any) => (a.distance_miles ?? 99999) - (b.distance_miles ?? 99999));
            }
          }
        } catch (fbErr: any) {
          console.log("[fallback] Resource fallback error:", fbErr.message);
        }
      }

      const partnerRows = rows.map((r: any) => ({ ...r, source: "partner" }));
      return res.json({ partners: partnerRows, fallback: fallbackResources });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/veteran-discounts/:id", async (req, res) => {
    if (!hasTrustedServicesTable) return res.status(404).json({ error: "Not found" });
    try {
      const rows = await pgQuery(
        `SELECT ts.*, tsc.program_area,
                json_build_object('slug', tsc.slug, 'name', tsc.name, 'group_type', tsc.group_type) AS trusted_service_categories
         FROM trusted_services ts
         INNER JOIN trusted_service_categories tsc ON ts.category_id = tsc.id
         WHERE ts.id = $1 AND ts.is_active IS NOT false
         LIMIT 1`,
        [req.params.id]
      );
      if (!rows.length) return res.status(404).json({ error: "Not found" });
      return res.json(rows[0]);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/trusted-services/categories", async (_req, res) => {
    if (!hasTrustedServicesTable) return res.json([]);
    try {
      const tsRows = await pgQuery(
        `SELECT * FROM trusted_service_categories WHERE (program_area IS NULL OR program_area = 'trusted_services') AND is_active IS NOT false ORDER BY display_order`
      );

      const TS_TO_RESOURCE_SLUG: Record<string, string> = {
        'housing-home': 'housing',
        'legal-services': 'legal',
        'financial-credit': 'financial',
        'insurance': 'insurance',
        'education-training': 'education',
        'employment-support': 'employment',
        'end-of-life-services': 'end-of-life-services',
      };

      let canonicalBySlug = new Map<string, { id: string; name: string; slug: string }>();
      try {
        const { data: canonicalCats } = await supabase.from("categories").select("id, name, slug");
        if (canonicalCats) {
          for (const c of canonicalCats) canonicalBySlug.set(c.slug, c);
        }
      } catch (_e) {}

      const enriched = tsRows.map((ts: any) => {
        const resourceSlug = TS_TO_RESOURCE_SLUG[ts.slug];
        const canonical = resourceSlug ? canonicalBySlug.get(resourceSlug) : null;
        return {
          ...ts,
          name: canonical?.name || ts.name,
          canonical_slug: resourceSlug || null,
        };
      });

      return res.json(enriched);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/trusted-services", async (req, res) => {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    if (!hasTrustedServicesTable) {
      console.log("[trusted-services] hasTrustedServicesTable=false, returning []");
      return res.json([]);
    }
    try {
      let userLat = req.query.user_lat ? parseFloat(req.query.user_lat as string) : undefined;
      let userLng = req.query.user_lng ? parseFloat(req.query.user_lng as string) : undefined;
      let radiusMiles = req.query.radius_miles ? parseFloat(req.query.radius_miles as string) : undefined;
      if (userLat !== undefined && (isNaN(userLat) || userLat < -90 || userLat > 90)) userLat = undefined;
      if (userLng !== undefined && (isNaN(userLng) || userLng < -180 || userLng > 180)) userLng = undefined;
      if (radiusMiles !== undefined && (isNaN(radiusMiles) || radiusMiles <= 0)) radiusMiles = undefined;
      if (radiusMiles !== undefined && radiusMiles > 500) radiusMiles = 500;
      const nearMeMode = userLat !== undefined && userLng !== undefined && radiusMiles !== undefined;

      const conditions = [`ts.is_active IS NOT false`];
      const params: any[] = [];
      if (req.query.category) {
        params.push(req.query.category);
        conditions.push(`tsc.slug = $${params.length}`);
      }
      if (!nearMeMode && req.query.state) {
        params.push((req.query.state as string).toUpperCase());
        conditions.push(`(ts.state = $${params.length} OR ts.is_national = true OR ts.state IS NULL)`);
      }
      if (nearMeMode) {
        const latDelta = radiusMiles! / 69.0;
        const lngDelta = radiusMiles! / (69.0 * Math.cos((userLat! * Math.PI) / 180));
        params.push(userLat! - latDelta, userLat! + latDelta, userLng! - lngDelta, userLng! + lngDelta);
        const latMinIdx = params.length - 3;
        conditions.push(`((ts.latitude >= $${latMinIdx} AND ts.latitude <= $${latMinIdx + 1} AND ts.longitude >= $${latMinIdx + 2} AND ts.longitude <= $${latMinIdx + 3}) OR ts.is_national = true OR ts.latitude IS NULL OR ts.longitude IS NULL)`);
      }
      const tsSearchTerm = (req.query.q || req.query.search) as string | undefined;
      if (tsSearchTerm) {
        const raw = `%${tsSearchTerm.toLowerCase()}%`;
        const normalized = `%${normalizeSearchTerm(tsSearchTerm)}%`;
        const terms = [...new Set([raw, normalized])];
        const searchOr = terms.flatMap(t => {
          params.push(t);
          const idx = params.length;
          return [
            `LOWER(ts.name) LIKE $${idx}`,
            `LOWER(ts.short_description) LIKE $${idx}`,
            `LOWER(ts.city) LIKE $${idx}`,
            `LOWER(ts.state) LIKE $${idx}`,
            `LOWER(tsc.name) LIKE $${idx}`,
          ];
        });
        conditions.push(`(${searchOr.join(" OR ")})`);
      }
      const vobConditions = [`vob.status = 'approved'`, `vob.show_in_trusted_services = true`, `vob.category_id IS NOT NULL`,
        `NOT EXISTS (SELECT 1 FROM trusted_services ts_dup WHERE LOWER(ts_dup.name) = LOWER(vob.business_name))`];
      const vobParams = [...params];
      if (req.query.category) {
        vobConditions.push(`tsc2.slug = $${vobParams.length > 0 ? '1' : '1'}`);
      }
      if (!nearMeMode && req.query.state) {
        const stateIdx = req.query.category ? 2 : 1;
        vobConditions.push(`vob.state = $${stateIdx}`);
      }

      const mainSql = `SELECT ts.id, ts.category_id, ts.name, ts.short_description, ts.website_url, ts.phone, ts.email,
             ts.address, ts.city, ts.state, ts.zip, ts.logo_url, ts.verification_status, ts.verification_label,
             ts.cta_text, ts.cta_url, ts.is_featured, ts.featured_rank, ts.is_active, ts.display_order, ts.notes_internal, ts.created_at,
             COALESCE(ts.is_national, false) AS is_national,
             ts.latitude, ts.longitude,
             json_build_object('slug', tsc.slug, 'name', tsc.name) AS trusted_service_categories,
             'trusted_service' AS source_type
         FROM trusted_services ts
         INNER JOIN trusted_service_categories tsc ON ts.category_id = tsc.id
         WHERE ${conditions.join(" AND ")}`;

      const vobSql = `SELECT vob.id, vob.category_id, vob.business_name AS name, vob.description AS short_description,
             vob.website AS website_url, vob.phone, vob.email, vob.address, vob.city, vob.state, vob.zip,
             vob.logo_url, 'verified' AS verification_status, 'Veteran-Owned' AS verification_label,
             NULL AS cta_text, NULL AS cta_url, false AS is_featured, NULL::integer AS featured_rank, true AS is_active, 999 AS display_order,
             NULL AS notes_internal, vob.created_at,
             false AS is_national,
             NULL::double precision AS latitude, NULL::double precision AS longitude,
             json_build_object('slug', tsc2.slug, 'name', tsc2.name) AS trusted_service_categories,
             'vob' AS source_type
         FROM veteran_owned_businesses vob
         INNER JOIN trusted_service_categories tsc2 ON vob.category_id = tsc2.id
         WHERE ${vobConditions.join(" AND ")}`;

      const sql = `${mainSql} UNION ALL ${vobSql}
         ORDER BY is_featured DESC, featured_rank ASC NULLS LAST, display_order ASC NULLS LAST, created_at DESC`;
      let rows = await pgQuery(sql, params);

      if (nearMeMode) {
        rows = rows.map((r: any) => {
          if (r.latitude != null && r.longitude != null) {
            const dist = haversineDistance(userLat!, userLng!, r.latitude, r.longitude);
            return { ...r, distance_miles: Math.round(dist * 10) / 10 };
          }
          return { ...r, distance_miles: r.is_national ? 99999 : 99998 };
        }).filter((r: any) => r.is_national || r.latitude == null || r.longitude == null || (r.distance_miles !== null && r.distance_miles <= radiusMiles!))
          .sort((a: any, b: any) => {
            const aFeat = a.is_featured ? 0 : 1;
            const bFeat = b.is_featured ? 0 : 1;
            if (aFeat !== bFeat) return aFeat - bFeat;
            if (a.is_featured && b.is_featured) {
              const aRank = a.featured_rank ?? 9999;
              const bRank = b.featured_rank ?? 9999;
              if (aRank !== bRank) return aRank - bRank;
            }
            return (a.distance_miles ?? 99999) - (b.distance_miles ?? 99999);
          });
      }

      if (tsSearchTerm && rows.length > 0) {
        const raw = tsSearchTerm.toLowerCase();
        const norm = normalizeSearchTerm(tsSearchTerm);
        rows = rows.filter((r: any) => {
          if (r.source_type !== 'vob') return true;
          const fields = [r.name, r.short_description, r.city, r.state, r.trusted_service_categories?.name].filter(Boolean).map((f: string) => f.toLowerCase());
          return fields.some((f: string) => f.includes(raw) || f.includes(norm));
        });
      }

      console.log(`[trusted-services] query returned ${rows.length} rows (category=${req.query.category || 'all'}, state=${req.query.state || 'all'}, nearMe=${nearMeMode}${tsSearchTerm ? `, q=${tsSearchTerm}` : ''})`);
      return res.json(rows);
    } catch (err: any) {
      console.log(`[trusted-services] query error: ${err.message}`);
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/trusted-partners-for-category/:resourceSlug", async (req, res) => {
    if (!hasTrustedServicesTable) return res.json([]);
    const trustedSlug = toCanonical(req.params.resourceSlug);
    try {
      const rows = await pgQuery(
        `SELECT ts.id, ts.name, ts.short_description, ts.phone, ts.email, ts.website_url, ts.city, ts.state,
                ts.is_featured, ts.logo_url, ts.cta_text, ts.cta_url,
                json_build_object('slug', tsc.slug, 'name', tsc.name) AS category
         FROM trusted_services ts
         INNER JOIN trusted_service_categories tsc ON ts.category_id = tsc.id
         WHERE ts.is_active IS NOT false AND tsc.slug = $1
         ORDER BY ts.is_featured DESC, ts.featured_rank ASC NULLS LAST, ts.display_order ASC NULLS LAST`,
        [trustedSlug]
      );
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/trusted-services/categories", requireAdmin, async (_req, res) => {
    if (!hasTrustedServicesTable) return res.status(503).json({ error: "Trusted services tables not available. Run supabase/create_trusted_services.sql" });
    try {
      const rows = await pgQuery(`SELECT * FROM trusted_service_categories ORDER BY display_order`);
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/trusted-services", requireAdmin, async (req, res) => {
    if (!hasTrustedServicesTable) return res.status(503).json({ error: "Trusted services tables not available" });
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      if (req.query.category_id) {
        params.push(req.query.category_id);
        conditions.push(`ts.category_id = $${params.length}`);
      }
      if (req.query.is_active === "true") conditions.push(`ts.is_active = true`);
      if (req.query.is_active === "false") conditions.push(`ts.is_active = false`);
      const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const tsPag = parsePagination(req, 200, 500);
      const rows = await pgQuery(
        `SELECT ts.*, json_build_object('id', tsc.id, 'slug', tsc.slug, 'name', tsc.name) AS trusted_service_categories
         FROM trusted_services ts
         LEFT JOIN trusted_service_categories tsc ON ts.category_id = tsc.id
         ${where}
         ORDER BY ts.display_order ASC NULLS LAST, ts.created_at DESC
         LIMIT ${tsPag.limit} OFFSET ${tsPag.offset}`,
        params
      );
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/trusted-services", requireAdmin, async (req, res) => {
    if (!hasTrustedServicesTable) return res.status(503).json({ error: "Trusted services tables not available" });
    try {
      const b = req.body;
      let lat = b.latitude != null ? parseFloat(b.latitude) : null;
      let lng = b.longitude != null ? parseFloat(b.longitude) : null;
      let geoSrc: string | null = b.geo_source || null;
      if ((lat == null || lng == null) && (b.address || b.city || b.state || b.zip)) {
        const geo = await geocodeAddress(b.address || null, b.city || null, b.state || null, b.zip || null);
        if (geo) { lat = geo.latitude; lng = geo.longitude; geoSrc = geo.geo_source; }
      }
      const rows = await pgQuery(
        `INSERT INTO trusted_services (category_id, name, short_description, website_url, phone, email, address, city, state, zip, is_active, is_featured, featured_rank, is_national, verification_status, notes_internal, program_area, group_type, listing_type, discount_value, discount_description, latitude, longitude, geocoded_at, geo_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
         RETURNING *`,
        [b.category_id, b.name, b.short_description || null, b.website_url || null, b.phone || null, b.email || null, b.address || null, b.city || null, b.state || null, b.zip || null, b.is_active ?? true, b.is_featured ?? false, b.featured_rank != null ? parseInt(b.featured_rank) : null, b.is_national ?? false, b.verification_status || 'pending', b.notes_internal || null, b.program_area || 'trusted_services', b.group_type || 'service', b.listing_type || 'lead', b.discount_value || null, b.discount_description || null, lat, lng, lat != null ? new Date().toISOString() : null, geoSrc]
      );
      return res.json(rows[0]);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/admin/trusted-services/:id", requireAdmin, async (req, res) => {
    if (!hasTrustedServicesTable) return res.status(503).json({ error: "Trusted services tables not available" });
    try {
      const updates = req.body;
      const addressChanged = updates.address !== undefined || updates.city !== undefined || updates.state !== undefined || updates.zip !== undefined;
      if (addressChanged && updates.latitude === undefined && updates.longitude === undefined) {
        const existing = await pgQuery(`SELECT address, city, state, zip FROM trusted_services WHERE id = $1`, [req.params.id]);
        if (existing.length > 0) {
          const merged = {
            address: updates.address ?? existing[0].address,
            city: updates.city ?? existing[0].city,
            state: updates.state ?? existing[0].state,
            zip: updates.zip ?? existing[0].zip,
          };
          const geo = await geocodeAddress(merged.address, merged.city, merged.state, merged.zip);
          if (geo) {
            updates.latitude = geo.latitude;
            updates.longitude = geo.longitude;
            updates.geo_source = geo.geo_source;
            updates.geocoded_at = new Date().toISOString();
          }
        }
      }
      if (updates.featured_rank !== undefined) {
        const parsed = parseInt(updates.featured_rank);
        updates.featured_rank = isNaN(parsed) ? null : parsed;
      }
      const setClauses: string[] = [];
      const params: any[] = [];
      const allowedFields = ['category_id', 'name', 'short_description', 'website_url', 'phone', 'email', 'address', 'city', 'state', 'zip', 'is_active', 'is_featured', 'featured_rank', 'is_national', 'verification_status', 'notes_internal', 'display_order', 'program_area', 'group_type', 'listing_type', 'discount_value', 'discount_description', 'cta_text', 'latitude', 'longitude', 'geocoded_at', 'geo_source'];
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          params.push(updates[field]);
          setClauses.push(`${field} = $${params.length}`);
        }
      }
      if (setClauses.length === 0) return res.status(400).json({ error: "No valid fields to update" });
      params.push(req.params.id);
      const rows = await pgQuery(
        `UPDATE trusted_services SET ${setClauses.join(", ")} WHERE id = $${params.length} RETURNING *`,
        params
      );
      if (rows.length === 0) return res.status(404).json({ error: "Not found" });
      return res.json(rows[0]);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/admin/trusted-services/batch-geocode", requireAdmin, async (req, res) => {
    if (!hasTrustedServicesTable) return res.status(503).json({ error: "Trusted services tables not available" });
    try {
      const rows = await pgQuery(
        `SELECT id, address, city, state, zip FROM trusted_services WHERE (latitude IS NULL OR longitude IS NULL) AND (city IS NOT NULL OR address IS NOT NULL OR zip IS NOT NULL)`
      );
      let success = 0;
      let failed = 0;
      for (const row of rows) {
        const geo = await geocodeAddress(row.address, row.city, row.state, row.zip);
        if (geo) {
          await pgQuery(
            `UPDATE trusted_services SET latitude = $1, longitude = $2, geocoded_at = NOW(), geo_source = $3 WHERE id = $4`,
            [geo.latitude, geo.longitude, geo.geo_source, row.id]
          );
          success++;
        } else {
          failed++;
        }
      }
      console.log(`[geocode] Batch geocoded trusted_services: ${success} success, ${failed} failed out of ${rows.length} total`);
      return res.json({ total: rows.length, success, failed });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/trusted-services/:id", requireAdmin, async (req, res) => {
    if (!hasTrustedServicesTable) return res.status(503).json({ error: "Trusted services tables not available" });
    try {
      await pgQuery(`UPDATE trusted_services SET is_active = false WHERE id = $1`, [req.params.id]);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/leads/update-status", async (req, res) => {
    const { leadId, status } = req.query;
    if (!leadId || !status) {
      return res.status(400).send("<html><body><h2>Invalid link</h2><p>Missing required parameters.</p></body></html>");
    }
    const validStatuses = ["contacted", "not_a_fit", "no_response", "duplicate", "referred_elsewhere"];
    if (!validStatuses.includes(status as string)) {
      return res.status(400).send("<html><body><h2>Invalid status</h2><p>Status not recognized.</p></body></html>");
    }
    try {
      const finalStatus = status === "not_a_fit" || status === "no_response" || status === "duplicate" || status === "referred_elsewhere" ? "closed" : status;
      const closeReason = status !== "contacted" ? status : null;
      const rows = await pgQuery(
        `UPDATE trusted_service_leads SET status = $1, close_reason = $2, status_updated_at = NOW() WHERE id = $3 RETURNING *`,
        [finalStatus, closeReason, leadId]
      );
      if (rows.length === 0) {
        return res.status(404).send("<html><body><h2>Lead not found</h2><p>This lead may have been removed.</p></body></html>");
      }
      const lead = rows[0];
      const statusLabel = status === "contacted" ? "Contacted" : status === "not_a_fit" ? "Not a Fit" : status === "no_response" ? "No Response" : status === "duplicate" ? "Duplicate" : "Referred Elsewhere";
      return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Status Updated</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 40px auto; padding: 20px; text-align: center;">
  <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 30px;">
    <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
    <h2 style="color: #166534; margin: 0 0 8px 0;">Status Updated</h2>
    <p style="color: #15803D; font-size: 14px; margin: 0 0 16px 0;">Lead for <strong>${lead.name}</strong> marked as <strong>${statusLabel}</strong>.</p>
    <p style="color: #6B7280; font-size: 12px;">Thank you for updating this lead. You can close this tab.</p>
  </div>
</body></html>`);
    } catch (err: any) {
      return res.status(500).send("<html><body><h2>Error</h2><p>Something went wrong. Please try again.</p></body></html>");
    }
  });

  app.post("/api/trusted-service-leads", async (req, res) => {
    const { provider_id, provider_name, category_id, name, email, phone, city, state, message, role, utm_source, utm_medium, utm_campaign, utm_content, utm_id, session_id } = req.body;
    if (!provider_id || !name || !email) {
      return res.status(400).json({ error: "provider_id, name, and email are required" });
    }
    try {
      const leadAmbassadorId = (utm_content || utm_id) ? await resolveAmbassadorId(utm_content || null, utm_id || null) : null;
      const leadRows = await pgQuery(
        `INSERT INTO trusted_service_leads (provider_id, provider_name, category_id, name, email, phone, city, state, message, role, status, utm_source, utm_medium, utm_campaign, utm_content, utm_id, session_id, ambassador_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'new', $11, $12, $13, $14, $15, $16, $17)
         RETURNING *`,
        [provider_id, provider_name || "", category_id || null, name, email, phone || null, city || null, state || null, message || null, role || null,
         utm_source || null, utm_medium || null, utm_campaign || null, utm_content || null, utm_id || null, session_id || null, leadAmbassadorId]
      );
      const data = leadRows[0];

      try {
        const providerRows = await pgQuery(
          `SELECT ts.name, ts.email, tsc.name AS category_name
           FROM trusted_services ts
           LEFT JOIN trusted_service_categories tsc ON ts.category_id = tsc.id
           WHERE ts.id = $1`,
          [provider_id]
        );
        const provider = providerRows[0];

        const result = await sendTrustedServiceLeadNotification(
          data.id,
          { name: provider?.name || provider_name, email: provider?.email || null, category_name: provider?.category_name || null },
          { name, email, phone: phone || null, city: city || null, state: state || null, message: message || null, role: role || null, created_at: data.created_at }
        );
        console.log(`[trusted-leads] Lead ${data.id} notifications: partner=${result.partnerSent}, admin=${result.adminSent}`);
      } catch (err: any) {
        console.log(`[trusted-leads] Notification error for lead ${data.id}:`, err?.message);
      }

      return res.json(data);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/admin/trusted-service-leads", requireAdmin, async (req, res) => {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      if (req.query.status && req.query.status !== "all") {
        params.push(req.query.status);
        conditions.push(`status = $${params.length}`);
      }
      if (req.query.provider_id) {
        params.push(req.query.provider_id);
        conditions.push(`provider_id = $${params.length}`);
      }
      const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const { limit, offset } = parsePagination(req, 200, 500);
      const rows = await pgQuery(`SELECT * FROM trusted_service_leads ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`, params);
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/admin/trusted-service-leads/:id", requireAdmin, async (req, res) => {
    const { status } = req.body;
    if (!status || !["new", "contacted", "closed"].includes(status)) {
      return res.status(400).json({ error: "Valid status required: new, contacted, closed" });
    }
    try {
      const rows = await pgQuery(
        `UPDATE trusted_service_leads SET status = $1 WHERE id = $2 RETURNING *`,
        [status, req.params.id]
      );
      if (rows.length === 0) return res.status(404).json({ error: "Lead not found" });
      return res.json(rows[0]);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  function buildActionResponseHtml(title: string, message: string, type: "success" | "error" | "info"): string {
    const colors = {
      success: { bg: "#F0FDF4", border: "#BBF7D0", text: "#166534", icon: "&#10003;" },
      error: { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", icon: "&#10007;" },
      info: { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF", icon: "&#8505;" },
    };
    const c = colors[type];
    const redirectMeta = type === "success" ? `<meta http-equiv="refresh" content="3;url=https://veterancare.com/">` : "";
    const redirectText = type === "success" ? `<p style="font-size:13px;color:#9CA3AF;margin:16px 0 0 0;">Redirecting you back to <a href="https://veterancare.com/" style="color:#6B7280;">VeteranCare.com</a>&hellip;</p>` : "";
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${redirectMeta}<title>${title} — ${platform.name}</title></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#F9FAFB;">
    <div style="max-width:440px;padding:32px;text-align:center;">
      <div style="width:60px;height:60px;border-radius:50%;background:${c.bg};border:2px solid ${c.border};display:inline-flex;align-items:center;justify-content:center;font-size:28px;color:${c.text};margin-bottom:16px;">${c.icon}</div>
      <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 8px 0;">${title}</h1>
      <p style="font-size:15px;color:#6B7280;line-height:1.6;margin:0 0 20px 0;">${message}</p>
      ${redirectText}
      <p style="font-size:12px;color:#9CA3AF;">${platform.name}</p>
    </div></body></html>`;
  }

  const actionLabels: Record<string, string> = {
    accepted: "Accepted",
    declined: "Declined",
    need_info: "Need More Information",
    completed: "Service Completed",
    connected: "Connected with Veteran",
    no_response: "No Response",
    unable_to_contact: "Unable to Contact",
  };

  function buildConfirmationPageHtml(token: string, action: string): string {
    const label = actionLabels[action] || action;
    const placeholders: Record<string, string> = {
      accepted: "e.g., Will call this week, Appointment scheduled...",
      declined: "e.g., Outside service area, Not taking new clients...",
      need_info: "e.g., Need veteran's DD-214, Missing address...",
      completed: "e.g., Completed intake, Benefits filed...",
    };
    const placeholder = placeholders[action] || "Add a note (optional)";
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm Update — ${platform.name}</title></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#F9FAFB;">
    <div style="max-width:440px;width:100%;padding:32px;text-align:center;">
      <h1 style="font-size:22px;color:#1a1a1a;margin:0 0 12px 0;">Confirm Status Update</h1>
      <p style="font-size:15px;color:#6B7280;line-height:1.6;margin:0 0 20px 0;">You are about to update this lead to: <strong>${label}</strong></p>
      <form method="POST" action="/api/partner/lead-action">
        <input type="hidden" name="token" value="${token}" />
        <textarea name="notes" rows="3" maxlength="500" placeholder="${placeholder}" style="width:100%;padding:10px 12px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;font-family:inherit;resize:vertical;margin-bottom:16px;box-sizing:border-box;"></textarea>
        <p style="font-size:11px;color:#9CA3AF;margin:0 0 16px 0;">Optional — add a short note about this lead</p>
        <button type="submit" style="background:#166534;color:white;border:none;padding:12px 32px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;width:100%;">Confirm Update</button>
      </form>
      <p style="font-size:12px;color:#9CA3AF;margin-top:20px;">${platform.name}</p>
    </div></body></html>`;
  }

  app.get("/api/partner/lead-action", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).send(buildActionResponseHtml("Invalid Link", "This action link is invalid or expired.", "error"));
      }
      const { verifyLeadActionToken } = await import("./lead-email");
      const result = verifyLeadActionToken(token);
      if (!result) {
        return res.status(400).send(buildActionResponseHtml("Invalid Link", "This action link is invalid, expired, or has been tampered with.", "error"));
      }
      return res.send(buildConfirmationPageHtml(token, result.action));
    } catch (err: any) {
      console.log("[lead-action] GET Error:", err?.message);
      return res.status(500).send(buildActionResponseHtml("Error", "Something went wrong. Please try again later.", "error"));
    }
  });

  app.post("/api/partner/lead-action", express.urlencoded({ extended: false }), async (req, res) => {
    try {
      const { token } = req.body;
      if (!token || typeof token !== "string") {
        return res.status(400).send(buildActionResponseHtml("Invalid Request", "Missing or invalid token.", "error"));
      }
      const { verifyLeadActionToken } = await import("./lead-email");
      const result = verifyLeadActionToken(token);
      if (!result) {
        return res.status(400).send(buildActionResponseHtml("Invalid Link", "This action link is invalid, expired, or has been tampered with.", "error"));
      }

      const { leadId, action } = result;
      const partnerNotes = typeof req.body.notes === "string" ? req.body.notes.trim().slice(0, 500) : "";

      const actionToResponseStatus: Record<string, string> = {
        accepted: "accepted",
        declined: "declined",
        need_info: "need_info",
        completed: "completed",
        connected: "accepted",
        no_response: "need_info",
        unable_to_contact: "declined",
      };

      const responseStatus = actionToResponseStatus[action] || action;

      const { data: lead } = await supabaseAdmin
        .from("navigator_requests")
        .select("id, status, admin_notes, response_status")
        .eq("id", leadId)
        .single();

      if (!lead) {
        return res.status(404).send(buildActionResponseHtml("Lead Not Found", "This support request could not be found in our system.", "error"));
      }

      const currentResponse = lead.response_status || "pending";
      if (currentResponse === responseStatus) {
        const label = actionLabels[action] || action;
        return res.send(buildActionResponseHtml("Already Updated", `This support request has already been marked as "${label}". No further action is needed. Thank you.`, "info"));
      }
      if (currentResponse === "completed") {
        return res.send(buildActionResponseHtml("Already Completed", "This support request has already been marked as completed. No further changes can be made via email. Contact the admin team if you need to make a correction.", "info"));
      }
      if (currentResponse === "declined" && responseStatus !== "declined") {
        return res.send(buildActionResponseHtml("Status Locked", "This support request was declined. Only an admin can change the status at this point.", "info"));
      }

      const now = new Date().toISOString();
      const updates: any = {
        outcome: action,
        contacted_at: now,
        response_status: responseStatus,
        response_at: now,
        last_action_source: "email_link",
      };

      if (responseStatus === "completed") {
        updates.status = "resolved";
        updates.resolved_at = now;
      } else if (lead.status === "new") {
        updates.status = "in_progress";
      }

      if (partnerNotes) {
        const notePrefix = `[Partner — ${actionLabels[action] || action}]: ${partnerNotes}`;
        updates.admin_notes = lead.admin_notes ? `${lead.admin_notes}\n${notePrefix}` : notePrefix;
      }

      let { error: updateErr } = await supabaseAdmin.from("navigator_requests").update(updates).eq("id", leadId);
      if (updateErr && updateErr.message.includes("last_action_source")) {
        delete updates.last_action_source;
        const retry = await supabaseAdmin.from("navigator_requests").update(updates).eq("id", leadId);
        updateErr = retry.error;
      }
      if (updateErr) {
        console.log("[lead-action] DB update error:", updateErr.message);
        return res.status(500).send(buildActionResponseHtml("Error", "Failed to update. Please try again.", "error"));
      }

      console.log(`[lead-action] Lead ${leadId} response_status → ${responseStatus} via email_link`);

      const label = actionLabels[action] || action;
      const noteAck = partnerNotes ? " Your note has been saved." : "";
      const friendlyMessages: Record<string, string> = {
        accepted: `Thank you for accepting this support request! The veteran has been notified that you will be reaching out.${noteAck}`,
        declined: `This support request has been marked as declined. Our team will reassign it to another provider.${noteAck}`,
        need_info: `Thank you. We've noted that you need more information. Our team will follow up with additional details.${noteAck}`,
        completed: `Thank you! This support request has been marked as completed.${noteAck} We appreciate your service to our veterans.`,
      };
      const message = friendlyMessages[responseStatus] || `Thank you! The status has been updated to "${label}".${noteAck}`;
      return res.send(buildActionResponseHtml("Status Updated", message, "success"));
    } catch (err: any) {
      console.log("[lead-action] POST Error:", err?.message);
      return res.status(500).send(buildActionResponseHtml("Error", "Something went wrong. Please try again later.", "error"));
    }
  });

  // ── Founder Daily Command Center — admin test send ──
  app.post("/api/admin/founder-digest/send-now", requireAdmin, async (_req, res) => {
    const result = await sendFounderDigest({ reason: "manual" });
    if (result.sent) return res.json({ ok: true, recipients: result.recipients });
    return res.status(result.error === "disabled" ? 423 : 500).json({ ok: false, error: result.error, recipients: result.recipients });
  });

  // ── Partner Outcome Capture (Won / Lost / No Contact) ──
  // Additive only — writes to existing navigator_requests.partner_outcome column.
  // Does NOT touch routing, billing, response_status, or workflow status.
  function buildOutcomePageHtml(token: string, outcome: string, leadId: string): string {
    const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
    const safeToken = esc(token);
    const safeLeadId = esc(leadId);
    const labels: Record<string, { title: string; color: string }> = {
      won:        { title: "Won — Veteran Became a Client",        color: "#15803D" },
      lost:       { title: "Lost — Did Not Convert",                color: "#B91C1C" },
      no_contact: { title: "No Contact — Could Not Reach Veteran", color: "#6B7280" },
    };
    const meta = labels[outcome] || { title: outcome, color: "#374151" };
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Confirm Outcome — ${platform.name}</title></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px 20px;color:#1a1a1a;">
      <div style="text-align:center;margin-bottom:24px;"><h1 style="margin:0;color:#166534;font-size:22px;">Confirm Final Outcome</h1></div>
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:20px;margin-bottom:20px;text-align:center;">
        <p style="margin:0 0 8px 0;color:#6B7280;font-size:13px;">You are about to record:</p>
        <p style="margin:0;color:${meta.color};font-size:18px;font-weight:700;">${meta.title}</p>
        <p style="margin:12px 0 0 0;color:#9CA3AF;font-size:11px;">Lead ID: ${safeLeadId}</p>
      </div>
      <form method="POST" action="/api/partner/lead-outcome" style="text-align:center;">
        <input type="hidden" name="token" value="${safeToken}" />
        <button type="submit" style="background:#166534;color:white;border:none;padding:12px 32px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;width:100%;">Confirm Outcome</button>
      </form>
      <p style="font-size:11px;color:#9CA3AF;margin-top:24px;text-align:center;">${platform.name} — partner outcome capture</p>
    </body></html>`;
  }

  app.get("/api/partner/lead-outcome", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).send(buildActionResponseHtml("Invalid Link", "This outcome link is invalid or expired.", "error"));
      }
      const { verifyOutcomeToken } = await import("./lead-email");
      const result = verifyOutcomeToken(token);
      if (!result) {
        return res.status(400).send(buildActionResponseHtml("Invalid Link", "This outcome link is invalid, expired, or has been tampered with.", "error"));
      }
      return res.send(buildOutcomePageHtml(token, result.outcome, result.leadId));
    } catch (err: any) {
      console.log("[lead-outcome] GET Error:", err?.message);
      return res.status(500).send(buildActionResponseHtml("Error", "Something went wrong. Please try again later.", "error"));
    }
  });

  app.post("/api/partner/lead-outcome", express.urlencoded({ extended: false }), async (req, res) => {
    try {
      const { token } = req.body;
      if (!token || typeof token !== "string") {
        return res.status(400).send(buildActionResponseHtml("Invalid Request", "Missing or invalid token.", "error"));
      }
      const { verifyOutcomeToken } = await import("./lead-email");
      const result = verifyOutcomeToken(token);
      if (!result) {
        return res.status(400).send(buildActionResponseHtml("Invalid Link", "This outcome link is invalid, expired, or has been tampered with.", "error"));
      }
      const { leadId, outcome } = result;

      const { data: lead, error: leadErr } = await supabaseAdmin
        .from("navigator_requests")
        .select("id, partner_outcome")
        .eq("id", leadId)
        .single();
      if (leadErr || !lead) {
        return res.status(404).send(buildActionResponseHtml("Lead Not Found", "This support request could not be found in our system.", "error"));
      }

      const previous = lead.partner_outcome || null;
      if (previous === outcome) {
        return res.send(buildActionResponseHtml("Already Recorded", `This lead is already marked as "${outcome}". No change needed.`, "info"));
      }

      const { error: updateErr } = await supabaseAdmin
        .from("navigator_requests")
        .update({ partner_outcome: outcome })
        .eq("id", leadId);
      if (updateErr) {
        console.log("[lead-outcome] DB update error:", updateErr.message);
        return res.status(500).send(buildActionResponseHtml("Error", "Failed to record outcome. Please try again.", "error"));
      }

      console.log(`[lead-outcome] Lead ${leadId} partner_outcome → ${outcome} via email_link (was: ${previous || "unset"})`);

      const friendlyMessages: Record<string, string> = {
        won:        "Thank you! This lead has been recorded as Won. Conversion data helps us keep partner pricing fair and transparent.",
        lost:       "Thank you for the update. This lead has been recorded as Lost. We track this to keep pricing accurate over time.",
        no_contact: "Thank you. This lead has been recorded as No Contact. If you'd like the lead reassigned, please use the lead-action buttons in the original email.",
      };
      return res.send(buildActionResponseHtml("Outcome Recorded", friendlyMessages[outcome] || "Outcome recorded.", "success"));
    } catch (err: any) {
      console.log("[lead-outcome] POST Error:", err?.message);
      return res.status(500).send(buildActionResponseHtml("Error", "Something went wrong. Please try again later.", "error"));
    }
  });

  // ── Partner Applications (public intake) ──

  app.get("/api/partner-categories", async (_req, res) => {
    try {
      const rows = await pgQuery(
        `SELECT id, name, slug, COALESCE(group_type, 'service') AS group_type FROM trusted_service_categories WHERE slug NOT LIKE 'discount-%' AND (program_area IS NULL OR program_area IN ('trusted_services', 'veteran_discount_services')) ORDER BY display_order ASC`
      );
      return res.json(rows);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  const RESOURCE_ONLY_CATEGORIES = [
    { slug: "crisis-help", name: "Crisis Help", display_order: 0 },
    { slug: "mental-health", name: "Mental Health", display_order: 1 },
    { slug: "family-support", name: "Family Support", display_order: 14 },
    { slug: "community-support", name: "Community Support", display_order: 15 },
    { slug: "food-assistance", name: "Food Assistance", display_order: 16 },
    { slug: "transportation", name: "Transportation", display_order: 17 },
  ];

  const RESOURCE_ONLY_SUBCATEGORIES: Record<string, { slug: string; name: string }[]> = {
    "crisis-help": [
      { slug: "suicide-prevention", name: "Suicide Prevention" },
      { slug: "homeless-services", name: "Homeless Services" },
      { slug: "domestic-violence", name: "Domestic Violence" },
      { slug: "substance-abuse", name: "Substance Abuse" },
    ],
    "mental-health": [
      { slug: "ptsd", name: "PTSD" },
      { slug: "counseling", name: "Counseling / Therapy" },
      { slug: "peer-support", name: "Peer Support" },
      { slug: "group-therapy", name: "Group Therapy" },
    ],
    "family-support": [
      { slug: "caregiver-support", name: "Caregiver Support" },
      { slug: "spouse-benefits", name: "Spouse / Dependent Benefits" },
      { slug: "childcare", name: "Childcare" },
      { slug: "survivor-benefits", name: "Survivor Benefits" },
    ],
  };

  app.get("/api/help-categories", async (_req, res) => {
    try {
      const dbCats = await pgQuery(
        `SELECT id, name, slug, COALESCE(display_order, 99) AS display_order FROM trusted_service_categories WHERE program_area = 'trusted_services' AND group_type = 'service' AND slug NOT LIKE 'discount-%' ORDER BY display_order ASC`
      );

      const allCats = [
        ...RESOURCE_ONLY_CATEGORIES.map(c => ({ id: null, ...c })),
        ...dbCats.filter((c: any) => !RESOURCE_ONLY_CATEGORIES.find(r => r.slug === c.slug)),
      ].sort((a: any, b: any) => (a.display_order ?? 99) - (b.display_order ?? 99));

      const result = [];
      for (const cat of allCats) {
        let subcategories: { slug: string; name: string }[] = [];
        if (cat.id) {
          const dbSubs = await pgQuery(
            `SELECT slug, name FROM partner_subcategories WHERE category_id = $1 AND is_active = true ORDER BY display_order ASC`,
            [cat.id]
          );
          subcategories = dbSubs;
        } else if (RESOURCE_ONLY_SUBCATEGORIES[cat.slug]) {
          subcategories = RESOURCE_ONLY_SUBCATEGORIES[cat.slug];
        }
        result.push({ slug: cat.slug, name: cat.name, subcategories });
      }

      return res.json(result);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/partner-subcategories", async (req, res) => {
    try {
      const { category_id } = req.query;
      const where = category_id ? `WHERE category_id = $1 AND is_active = true` : `WHERE is_active = true`;
      const params = category_id ? [category_id] : [];
      const rows = await pgQuery(
        `SELECT id, category_id, name, slug, display_order FROM partner_subcategories ${where} ORDER BY display_order ASC`,
        params
      );
      return res.json(rows);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/partner-applications", async (req, res) => {
    const { company_name, contact_name, email, phone, website, city, state, category_id, subcategory_ids, service_description, pricing_interest, plan_type, addons, utm_source, utm_medium, utm_campaign, utm_content, utm_id, session_id, referred_by_code, is_lead_enabled } = req.body;
    if (!company_name || !contact_name || !email) {
      return res.status(400).json({ error: "company_name, contact_name, and email are required" });
    }
    const validPricing = ["monthly", "lead-based", "both"];
    const validPlanTypes = ["state", "national"];
    const validAddons = ["featured", "near_me_boost", "sponsored_top", "sponsored_inline"];
    const cleanAddons = Array.isArray(addons) ? [...new Set(addons.filter((a: string) => validAddons.includes(a)))] : [];
    try {
      const paAmbassadorId = (utm_content || utm_id) ? await resolveAmbassadorId(utm_content || null, utm_id || null) : null;
      const cleanSubcategoryIds = Array.isArray(subcategory_ids) ? subcategory_ids.filter((s: string) => s).join(',') : (subcategory_ids || null);
      let referredByPartnerId: string | null = null;
      if (referred_by_code && typeof referred_by_code === 'string') {
        const referrer = await pgQuery(
          `SELECT id FROM partner_applications WHERE referral_code = $1`,
          [referred_by_code.toUpperCase()]
        );
        if (referrer.length > 0) referredByPartnerId = referrer[0].id;
      }
      const rows = await pgQuery(
        `INSERT INTO partner_applications (company_name, contact_name, email, phone, website, city, state, category_id, subcategory_ids, service_description, pricing_interest, plan_type, requested_addons, status, utm_source, utm_medium, utm_campaign, utm_content, utm_id, session_id, ambassador_id, referred_by_partner_id, is_lead_enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'prospect', $14, $15, $16, $17, $18, $19, $20, $21, $22)
         RETURNING *`,
        [
          company_name, contact_name, email,
          phone || null, website || null, city || null, state || null,
          category_id || null, cleanSubcategoryIds,
          service_description || null,
          validPricing.includes(pricing_interest) ? pricing_interest : "both",
          validPlanTypes.includes(plan_type) ? plan_type : null,
          cleanAddons.length > 0 ? JSON.stringify(cleanAddons) : null,
          utm_source || null, utm_medium || null, utm_campaign || null, utm_content || null, utm_id || null, session_id || null,
          paAmbassadorId,
          referredByPartnerId,
          is_lead_enabled === true && category_id ? await (async () => {
            const catRows = await pgQuery(`SELECT slug FROM trusted_service_categories WHERE id = $1`, [category_id]);
            return catRows.length > 0 && isLeadEligibleCategory(catRows[0].slug);
          })() : false,
        ]
      );
      if (referredByPartnerId && rows.length > 0) {
        try {
          await pgQuery(
            `INSERT INTO partner_referrals (referrer_partner_id, referred_company_name, referred_contact_name, referred_email, status, referred_application_id)
             VALUES ($1, $2, $3, $4, 'signed_up', $5)
             ON CONFLICT DO NOTHING`,
            [referredByPartnerId, company_name, contact_name, email.toLowerCase(), rows[0].id]
          );
          console.log(`[partner-referral] Auto-tracked referral: ${referredByPartnerId} → ${email}`);
        } catch (refErr: any) {
          console.log(`[partner-referral] Auto-track failed:`, refErr.message);
        }
      }

      // Stage B: Seeded-Provider matching — LOG ONLY, no conversion.
      // Failures here must never break the application submission.
      if (rows.length > 0) {
        try {
          const { findExistingProvider } = await import("./partner-matching");
          const match = await findExistingProvider({
            websiteUrl: website || null,
            contactEmail: email || null,
            name: company_name || null,
            phone: phone || null,
          });
          if (match.matchedId) {
            const isSeeded = match.matchedIsSeeded === true || match.matchedProviderType === "seeded";
            console.log(
              `[partner-matching] application=${rows[0].id} matched existing provider=${match.matchedId} ` +
              `(name="${match.matchedName}", type=${match.matchedProviderType}, seeded=${isSeeded}, ` +
              `key=${match.matchKey}, confidence=${match.confidence}, candidates_scanned=${match.candidatesScanned}) ` +
              `— LOG ONLY, no auto-conversion`
            );
            try {
              const { logMonetizationAudit } = await import("./monetization-audit");
              await logMonetizationAudit({
                event_type: "mismatch_detected",
                partner_id: match.matchedId,
                lead_id: null,
                reason: `Seeded-provider match candidate detected on partner application (LOG ONLY)`,
                mismatch_type: isSeeded ? "seeded_provider_match_candidate" : "duplicate_provider_match_candidate",
                severity: isSeeded ? "info" : "low",
                metadata: {
                  application_id: rows[0].id,
                  application_company_name: company_name,
                  application_email: email,
                  application_website: website || null,
                  application_phone: phone || null,
                  matched_provider_name: match.matchedName,
                  matched_provider_type: match.matchedProviderType,
                  matched_is_seeded: isSeeded,
                  match_key: match.matchKey,
                  confidence: match.confidence,
                  candidates_scanned: match.candidatesScanned,
                  stage: "B-log-only",
                },
              });
            } catch (auditErr: any) {
              console.log(`[partner-matching] audit log failed (non-fatal): ${auditErr?.message}`);
            }
          } else {
            console.log(
              `[partner-matching] application=${rows[0].id} no existing provider match ` +
              `(candidates_scanned=${match.candidatesScanned})`
            );
          }
        } catch (matchErr: any) {
          console.log(`[partner-matching] cascade failed (non-fatal, application succeeded): ${matchErr?.message}`);
        }
      }

      return res.json(rows[0]);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // ── Admin Partner Applications ──

  app.get("/api/admin/partner-applications", requireAdmin, async (req, res) => {
    try {
      let sql = `SELECT pa.*, json_build_object('name', tsc.name, 'slug', tsc.slug) AS trusted_service_categories
                 FROM partner_applications pa
                 LEFT JOIN trusted_service_categories tsc ON pa.category_id = tsc.id`;
      const conditions: string[] = [];
      const params: any[] = [];
      if (req.query.status) {
        params.push(req.query.status);
        conditions.push(`pa.status = $${params.length}`);
      }
      if (req.query.state) {
        params.push(req.query.state);
        conditions.push(`pa.state = $${params.length}`);
      }
      if (conditions.length > 0) sql += ` WHERE ${conditions.join(" AND ")}`;
      const { limit, offset } = parsePagination(req, 200, 500);
      sql += ` ORDER BY pa.created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      const rows = await pgQuery(sql, params);
      return res.json(rows);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/admin/partner-applications/:id", requireAdmin, async (req, res) => {
    const { status, admin_notes } = req.body;
    const setClauses: string[] = ["updated_at = NOW()"];
    const params: any[] = [];
    if (status) {
      const validStatuses = ["prospect", "under_review", "rejected", "approved_pending_payment", "active", "inactive", "archived"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Valid status required: ${validStatuses.join(", ")}` });
      }
      params.push(status);
      setClauses.push(`status = $${params.length}`);
    }
    if (admin_notes !== undefined) {
      params.push(admin_notes);
      setClauses.push(`admin_notes = $${params.length}`);
    }
    params.push(req.params.id);
    try {
      const rows = await pgQuery(
        `UPDATE partner_applications SET ${setClauses.join(", ")} WHERE id = $${params.length} RETURNING *`,
        params
      );
      if (rows.length === 0) return res.status(404).json({ error: "Application not found" });
      const catRows = rows[0].category_id
        ? await pgQuery(`SELECT name, slug FROM trusted_service_categories WHERE id = $1`, [rows[0].category_id])
        : [];
      rows[0].trusted_service_categories = catRows[0] || null;
      return res.json(rows[0]);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/admin/partner-applications/:id", requireAdmin, async (req, res) => {
    try {
      const rows = await pgQuery(`DELETE FROM partner_applications WHERE id = $1 RETURNING id`, [req.params.id]);
      if (rows.length === 0) return res.status(404).json({ error: "Application not found" });
      return res.json({ deleted: true, id: rows[0].id });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/admin/partner-applications/:id/approve", requireAdmin, async (req, res) => {
    if (!isStripeEnabled()) {
      return res.status(503).json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY." });
    }
    try {
      const appRows = await pgQuery(`SELECT * FROM partner_applications WHERE id = $1`, [req.params.id]);
      if (appRows.length === 0) return res.status(404).json({ error: "Application not found" });
      const application = appRows[0];

      if (application.status === "active") return res.status(400).json({ error: "Partner is already active" });
      if (!application.category_id) return res.status(400).json({ error: "Application must have a category before approval" });

      let addons = req.body.addons || [];
      if (addons.length === 0 && application.requested_addons) {
        try { addons = JSON.parse(application.requested_addons); } catch {}
      }
      const validAddons = ["featured", "near_me_boost", "sponsored_top", "sponsored_inline"];
      addons = [...new Set((addons as string[]).filter((a: string) => validAddons.includes(a)))];
      const { url, sessionId } = await createPartnerCheckoutSession({ applicationId: req.params.id, addons });

      let emailSent = false;
      let emailError: string | undefined;
      if (application.email) {
        const emailResult = await sendPartnerPaymentEmail(
          application.email,
          application.company_name,
          application.contact_name,
          url
        );
        emailSent = emailResult.sent;
        emailError = emailResult.error;

        const { setPartnerOrgOnboardingStatus } = await import("./stripe-service");
        await setPartnerOrgOnboardingStatus(application.email, "invited");
      }

      return res.json({
        checkoutUrl: url,
        sessionId,
        status: "approved_pending_payment",
        emailSent,
        emailError,
        message: emailSent
          ? `Payment link emailed to ${application.email}. Link also available below as backup.`
          : `Checkout session created. Email delivery failed${emailError ? `: ${emailError}` : ""}. Copy the link manually.`,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/admin/partner-applications/:id/resend-activation", requireAdmin, async (req, res) => {
    if (!isStripeEnabled()) {
      return res.status(503).json({ error: "Stripe is not configured" });
    }
    try {
      const appRows = await pgQuery(`SELECT * FROM partner_applications WHERE id = $1`, [req.params.id]);
      if (appRows.length === 0) return res.status(404).json({ error: "Application not found" });
      const application = appRows[0];

      if (application.status === "active") return res.status(400).json({ error: "Partner is already active — no activation needed" });
      if (!application.email) return res.status(400).json({ error: "No email on application" });

      let checkoutUrl = application.stripe_checkout_url;

      if (!checkoutUrl) {
        let addons = [];
        if (application.requested_addons) {
          try { addons = JSON.parse(application.requested_addons); } catch {}
        }
        const validAddons = ["featured", "near_me_boost", "sponsored_top", "sponsored_inline"];
        addons = addons.filter((a: string) => validAddons.includes(a));
        const result = await createPartnerCheckoutSession({ applicationId: req.params.id, addons });
        checkoutUrl = result.url;
      }

      const emailResult = await sendPartnerPaymentEmail(
        application.email,
        application.company_name,
        application.contact_name,
        checkoutUrl
      );

      const { setPartnerOrgOnboardingStatus } = await import("./stripe-service");
      await setPartnerOrgOnboardingStatus(application.email, "invited");

      return res.json({
        emailSent: emailResult.sent,
        emailError: emailResult.error,
        checkoutUrl,
        message: emailResult.sent
          ? `Activation email resent to ${application.email}`
          : `Email failed${emailResult.error ? `: ${emailResult.error}` : ""}. Checkout URL available as backup.`,
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/stripe/webhook", async (req, res) => {
    if (!stripe) return res.status(503).json({ error: "Stripe not configured" });
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: any;
    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.rawBody as Buffer, sig, webhookSecret);
      } else {
        event = req.body;
        console.log("[stripe] WARNING: No webhook secret configured — accepting unverified event");
      }
    } catch (err: any) {
      console.log(`[stripe] Webhook signature verification failed:`, err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    console.log(`[stripe] Webhook received: ${event.type}`);

    try {
      await handleWebhookEvent(event);
      return res.json({ received: true });
    } catch (err: any) {
      console.log(`[stripe] Webhook handler error:`, err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/stripe/verify-session", async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });
    if (!isStripeEnabled()) return res.status(503).json({ error: "Stripe not configured" });

    try {
      const result = await verifyAndActivateCheckoutSession(sessionId);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/stripe/customer-portal", async (req, res) => {
    const { stripe_customer_id, checkout_session_id } = req.body;
    if (!isStripeEnabled()) return res.status(503).json({ error: "Stripe not configured" });

    try {
      let customerId = stripe_customer_id;
      if (!customerId && checkout_session_id) {
        const session = await stripe!.checkout.sessions.retrieve(checkout_session_id);
        if (session.customer) {
          customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
        }
      }
      if (!customerId) return res.status(400).json({ error: "No Stripe customer found. Please contact support." });

      const result = await createCustomerPortalSession(customerId);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partner-checkout", async (req, res) => {
    const { application_id, addons } = req.body;
    if (!application_id) return res.status(400).json({ error: "application_id required" });
    if (!isStripeEnabled()) return res.status(503).json({ error: "Stripe not configured" });

    try {
      const result = await createPartnerCheckoutSession({
        applicationId: application_id,
        addons: addons || [],
      });
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/partner-applications/:id/convert", requireAdmin, async (req, res) => {
    try {
      const appRows = await pgQuery(
        `SELECT pa.*, json_build_object('name', tsc.name, 'slug', tsc.slug) AS trusted_service_categories
         FROM partner_applications pa
         LEFT JOIN trusted_service_categories tsc ON pa.category_id = tsc.id
         WHERE pa.id = $1`, [req.params.id]
      );
      if (appRows.length === 0) return res.status(404).json({ error: "Application not found" });
      const application = appRows[0];
      if (application.converted_provider_id) return res.status(400).json({ error: "Already converted to a provider" });
      if (!application.category_id) return res.status(400).json({ error: "Application must have a category before converting" });

      let convLat: number | null = null;
      let convLng: number | null = null;
      let convGeoSrc: string | null = null;
      if (application.address || application.city || application.state) {
        const geo = await geocodeAddress(application.address || null, application.city || null, application.state || null, null);
        if (geo) { convLat = geo.latitude; convLng = geo.longitude; convGeoSrc = geo.geo_source; }
      }
      const providerRows = await pgQuery(
        `INSERT INTO trusted_services (category_id, name, short_description, website_url, phone, email, city, state, is_active, is_featured, verification_status, notes_internal, latitude, longitude, geocoded_at, geo_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
         RETURNING *`,
        [
          application.category_id,
          application.company_name,
          application.service_description || null,
          application.website || null,
          application.phone || null,
          application.email,
          application.city || null,
          application.state || null,
          true,
          false,
          'verified',
          `Converted from partner application ${application.id}`,
          convLat,
          convLng,
          convLat != null ? new Date().toISOString() : null,
          convGeoSrc,
        ]
      );
      const provider = providerRows[0];

      await pgQuery(
        `UPDATE partner_applications SET status = 'active', converted_provider_id = $1, updated_at = NOW() WHERE id = $2`,
        [provider.id, req.params.id]
      );

      return res.json({ application, provider });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // ── Veteran-Owned Business Directory ──

  app.get("/api/vob", async (req, res) => {
    try {
      const conditions = [`vob.status = 'approved'`];
      const params: any[] = [];
      if (req.query.category) {
        params.push(req.query.category);
        conditions.push(`tsc.slug = $${params.length}`);
      }
      if (req.query.state) {
        params.push((req.query.state as string).toUpperCase());
        conditions.push(`vob.state = $${params.length}`);
      }
      if (req.query.search) {
        const rawSearch = `%${(req.query.search as string).toLowerCase()}%`;
        const normSearch = `%${normalizeSearchTerm(req.query.search as string)}%`;
        params.push(rawSearch);
        const rawIdx = params.length;
        params.push(normSearch);
        const normIdx = params.length;
        conditions.push(`(LOWER(vob.business_name) LIKE $${rawIdx} OR LOWER(vob.description) LIKE $${rawIdx} OR LOWER(vob.subcategory) LIKE $${rawIdx} OR LOWER(REGEXP_REPLACE(vob.business_name, '[^a-zA-Z0-9 ]', '', 'g')) LIKE $${normIdx} OR LOWER(REGEXP_REPLACE(vob.description, '[^a-zA-Z0-9 ]', '', 'g')) LIKE $${normIdx})`);
      }
      const vobPag = parsePagination(req, 100, 500);
      const sql = `SELECT vob.*, json_build_object('name', tsc.name, 'slug', tsc.slug) AS category
         FROM veteran_owned_businesses vob
         LEFT JOIN trusted_service_categories tsc ON vob.category_id = tsc.id
         WHERE ${conditions.join(" AND ")}
         ORDER BY vob.is_nonprofit DESC, vob.created_at DESC
         LIMIT ${vobPag.limit} OFFSET ${vobPag.offset}`;
      const rows = await pgQuery(sql, params);
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/vob", async (req, res) => {
    try {
      const b = req.body;
      if (!b.business_name || !b.owner_name || !b.email) {
        return res.status(400).json({ error: "Business name, owner name, and email are required" });
      }
      const rows = await pgQuery(
        `INSERT INTO veteran_owned_businesses
          (business_name, owner_name, email, phone, website, address, city, state, zip, description, category_id, subcategory, is_veteran_owned, is_nonprofit, logo_url, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending')
         RETURNING *`,
        [
          b.business_name, b.owner_name, b.email,
          b.phone || null, b.website || null, b.address || null,
          b.city || null, b.state || null, b.zip || null,
          b.description || null, b.category_id || null, b.subcategory || null,
          b.is_veteran_owned ?? true, b.is_nonprofit ?? false, b.logo_url || null,
        ]
      );
      console.log(`[vob] New submission: ${b.business_name} (${b.email})`);
      return res.json(rows[0]);
    } catch (err: any) {
      console.log(`[vob] submit error: ${err.message}`);
      return res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/admin/vob", requireAdmin, async (req, res) => {
    try {
      const { limit, offset } = parsePagination(req, 200, 500);
      const rows = await pgQuery(
        `SELECT vob.*, json_build_object('name', tsc.name, 'slug', tsc.slug) AS category
         FROM veteran_owned_businesses vob
         LEFT JOIN trusted_service_categories tsc ON vob.category_id = tsc.id
         ORDER BY
           CASE vob.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 WHEN 'rejected' THEN 2 END,
           vob.created_at DESC
         LIMIT ${limit} OFFSET ${offset}`
      );
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/admin/vob/:id", requireAdmin, async (req, res) => {
    try {
      const updates = req.body;
      const setClauses: string[] = [];
      const params: any[] = [];
      const allowedFields = ['status', 'admin_notes', 'show_in_trusted_services', 'category_id'];
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          params.push(updates[field]);
          setClauses.push(`${field} = $${params.length}`);
        }
      }
      if (updates.status) {
        if (!["approved", "rejected", "pending"].includes(updates.status)) {
          return res.status(400).json({ error: "Valid status required (approved, rejected, pending)" });
        }
        setClauses.push(`reviewed_at = NOW()`);
      }
      if (setClauses.length === 0) return res.status(400).json({ error: "No valid fields to update" });
      params.push(req.params.id);
      const rows = await pgQuery(
        `UPDATE veteran_owned_businesses SET ${setClauses.join(", ")} WHERE id = $${params.length} RETURNING *`,
        params
      );
      if (rows.length === 0) return res.status(404).json({ error: "Not found" });
      console.log(`[vob] Admin updated business: ${rows[0].business_name} (status=${rows[0].status}, show_in_ts=${rows[0].show_in_trusted_services})`);
      return res.json(rows[0]);
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  });

  // ── Admin Sweepstakes Draw Endpoints ──

  app.get("/api/admin/sweepstakes/current", requireAdmin, async (_req, res) => {
    try {
      const currentMonth = await getCurrentSweepstakesMonth();
      const monthRows = await pgQuery(
        `SELECT * FROM sweepstakes_months WHERE month = $1`,
        [currentMonth]
      );
      const monthRecord = monthRows.length > 0 ? monthRows[0] : null;
      const status = monthRecord?.status || "active";

      const entryPool = await pgQuery(
        `SELECT re.user_id, SUM(re.entry_count)::int AS entries
         FROM referral_entries re
         WHERE re.entry_month = $1
         GROUP BY re.user_id
         ORDER BY entries DESC`,
        [currentMonth]
      );

      let profileMap: Record<string, any> = {};
      if (entryPool.length > 0) {
        const userIds = entryPool.map((e: any) => e.user_id);
        try {
          const { data: profiles } = await supabaseAdmin
            .from("user_profiles")
            .select("id, first_name, last_name, email")
            .in("id", userIds);
          if (profiles) {
            for (const p of profiles) profileMap[p.id] = p;
          }
        } catch {}
      }

      const pool = entryPool.map((e: any) => {
        const p = profileMap[e.user_id] || {};
        return {
          userId: e.user_id,
          displayName: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || e.user_id.slice(0, 8),
          email: p.email || null,
          entries: e.entries,
        };
      });

      const winners = await pgQuery(
        `SELECT * FROM sweepstakes_winners WHERE month = $1 ORDER BY placement ASC`,
        [currentMonth]
      );

      const winnerList = winners.map((w: any) => {
        const p = profileMap[w.user_id] || {};
        return {
          id: w.id,
          placement: w.placement,
          userId: w.user_id,
          displayName: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || w.user_id.slice(0, 8),
          email: p.email || null,
          entryCountAtDraw: w.entry_count_at_draw,
          selectionMethod: w.selection_method,
          selectedByAdminId: w.selected_by_admin_id,
          prizeNotes: w.prize_notes,
          createdAt: w.created_at,
        };
      });

      return res.json({
        month: currentMonth,
        status,
        totalEntries: pool.reduce((s: number, p: any) => s + p.entries, 0),
        totalParticipants: pool.length,
        entryPool: pool,
        winners: winnerList,
        prizeTitle: monthRecord?.prize_title || null,
        prizeDescription: monthRecord?.prize_description || null,
        prizeValue: monthRecord?.prize_value || null,
        prizeImageUrl: monthRecord?.prize_image_url || null,
        rulesText: monthRecord?.rules_text || null,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/sweepstakes/draw", requireAdmin, async (req, res) => {
    try {
      const { placement, selectionMethod, userId, prizeNotes } = req.body;
      if (!placement || ![1, 2, 3].includes(placement)) {
        return res.status(400).json({ error: "placement must be 1, 2, or 3" });
      }
      if (!selectionMethod || !["random", "manual"].includes(selectionMethod)) {
        return res.status(400).json({ error: "selectionMethod must be 'random' or 'manual'" });
      }

      const currentMonth = await getCurrentSweepstakesMonth();

      const monthRows = await pgQuery(
        `SELECT status FROM sweepstakes_months WHERE month = $1`,
        [currentMonth]
      );
      if (monthRows.length > 0 && monthRows[0].status !== "active") {
        return res.status(400).json({ error: `Month ${currentMonth} is ${monthRows[0].status} — cannot draw` });
      }

      const existing = await pgQuery(
        `SELECT id FROM sweepstakes_winners WHERE month = $1 AND placement = $2`,
        [currentMonth, placement]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: `Placement ${placement} already assigned for ${currentMonth}` });
      }

      const entryPool = await pgQuery(
        `SELECT re.user_id, SUM(re.entry_count)::int AS entries
         FROM referral_entries re
         WHERE re.entry_month = $1
         GROUP BY re.user_id
         ORDER BY entries DESC`,
        [currentMonth]
      );

      if (entryPool.length === 0) {
        return res.status(400).json({ error: "No entries in pool for this month" });
      }

      const existingWinnerIds = await pgQuery(
        `SELECT user_id FROM sweepstakes_winners WHERE month = $1`,
        [currentMonth]
      );
      const alreadyWon = new Set(existingWinnerIds.map((r: any) => r.user_id));
      const eligible = entryPool.filter((e: any) => !alreadyWon.has(e.user_id));

      if (eligible.length === 0) {
        return res.status(400).json({ error: "No eligible participants remaining (all already selected as winners)" });
      }

      let selectedUserId: string;
      let selectedEntries: number;

      if (selectionMethod === "manual") {
        if (!userId) {
          return res.status(400).json({ error: "userId required for manual selection" });
        }
        const match = eligible.find((e: any) => e.user_id === userId);
        if (!match) {
          return res.status(400).json({ error: "User not in eligible entry pool" });
        }
        selectedUserId = match.user_id;
        selectedEntries = match.entries;
      } else {
        const weightedPool: any[] = [];
        for (const e of eligible) {
          for (let i = 0; i < e.entries; i++) {
            weightedPool.push(e);
          }
        }
        const randomIndex = Math.floor(Math.random() * weightedPool.length);
        const picked = weightedPool[randomIndex];
        selectedUserId = picked.user_id;
        selectedEntries = picked.entries;
      }

      const adminKey = req.headers["x-admin-key"] as string;

      const rows = await pgQuery(
        `INSERT INTO sweepstakes_winners (month, user_id, placement, entry_count_at_draw, selected_by_admin_id, selection_method, prize_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [currentMonth, selectedUserId, placement, selectedEntries, adminKey ? "admin" : null, selectionMethod, prizeNotes || null]
      );

      console.log(`[sweepstakes] Winner drawn: month=${currentMonth} placement=${placement} user=${selectedUserId} method=${selectionMethod} entries=${selectedEntries}`);

      return res.json({
        winner: rows[0],
        message: `Placement ${placement} winner selected for ${currentMonth}`,
      });
    } catch (err: any) {
      if (err.message?.includes("idx_sweepstakes_winners_month_placement")) {
        return res.status(409).json({ error: "Placement already assigned for this month" });
      }
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/sweepstakes/close-month", requireAdmin, async (_req, res) => {
    try {
      const currentMonth = await getCurrentSweepstakesMonth();

      const winners = await pgQuery(
        `SELECT id FROM sweepstakes_winners WHERE month = $1`,
        [currentMonth]
      );
      if (winners.length === 0) {
        return res.status(400).json({ error: "Cannot close month with no winners selected" });
      }

      const existing = await pgQuery(
        `SELECT id, status FROM sweepstakes_months WHERE month = $1`,
        [currentMonth]
      );
      if (existing.length > 0) {
        if (existing[0].status === "closed" || existing[0].status === "archived") {
          return res.status(400).json({ error: `Month is already ${existing[0].status}` });
        }
        await pgQuery(
          `UPDATE sweepstakes_months SET status = 'closed', updated_at = NOW() WHERE month = $1`,
          [currentMonth]
        );
      } else {
        const [y, m] = currentMonth.split("-").map(Number);
        const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
        const endDate = new Date(y, m, 0).toISOString().split("T")[0];
        await pgQuery(
          `INSERT INTO sweepstakes_months (month, status, start_date, end_date)
           VALUES ($1, 'closed', $2, $3)`,
          [currentMonth, startDate, endDate]
        );
      }

      console.log(`[sweepstakes] Month ${currentMonth} closed with ${winners.length} winner(s)`);
      return res.json({ message: `Month ${currentMonth} closed`, winnersCount: winners.length });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/sweepstakes/winner/:id", requireAdmin, async (req, res) => {
    try {
      const currentMonth = await getCurrentSweepstakesMonth();
      const monthRows = await pgQuery(
        `SELECT status FROM sweepstakes_months WHERE month = $1`,
        [currentMonth]
      );
      if (monthRows.length > 0 && monthRows[0].status !== "active") {
        return res.status(400).json({ error: `Month ${currentMonth} is ${monthRows[0].status} — cannot remove winner` });
      }

      const rows = await pgQuery(
        `DELETE FROM sweepstakes_winners WHERE id = $1 AND month = $2 RETURNING *`,
        [req.params.id, currentMonth]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "Winner not found for current month" });
      }
      console.log(`[sweepstakes] Winner removed: ${rows[0].user_id} placement=${rows[0].placement}`);
      return res.json({ message: "Winner removed", removed: rows[0] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/sweepstakes/history", requireAdmin, async (_req, res) => {
    try {
      const months = await pgQuery(
        `SELECT sm.month, sm.status, sm.notes, sm.sponsor_notes, sm.created_at,
                COUNT(sw.id)::int AS winner_count
         FROM sweepstakes_months sm
         LEFT JOIN sweepstakes_winners sw ON sw.month = sm.month
         WHERE sm.status IN ('closed', 'archived')
         GROUP BY sm.month, sm.status, sm.notes, sm.sponsor_notes, sm.created_at
         ORDER BY sm.month DESC`
      );

      const allWinners = await pgQuery(
        `SELECT sw.*, sm.status AS month_status
         FROM sweepstakes_winners sw
         JOIN sweepstakes_months sm ON sm.month = sw.month
         WHERE sm.status IN ('closed', 'archived')
         ORDER BY sw.month DESC, sw.placement ASC`
      );

      let profileMap: Record<string, any> = {};
      if (allWinners.length > 0) {
        const userIds = [...new Set(allWinners.map((w: any) => w.user_id))];
        try {
          const { data: profiles } = await supabaseAdmin
            .from("user_profiles")
            .select("id, first_name, last_name, email")
            .in("id", userIds as string[]);
          if (profiles) {
            for (const p of profiles) profileMap[p.id] = p;
          }
        } catch {}
      }

      const history = months.map((m: any) => ({
        month: m.month,
        status: m.status,
        notes: m.notes,
        sponsorNotes: m.sponsor_notes,
        winnerCount: m.winner_count,
        winners: allWinners
          .filter((w: any) => w.month === m.month)
          .map((w: any) => {
            const p = profileMap[w.user_id] || {};
            return {
              id: w.id,
              placement: w.placement,
              userId: w.user_id,
              displayName: [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || w.user_id.slice(0, 8),
              email: p.email || null,
              entryCountAtDraw: w.entry_count_at_draw,
              selectionMethod: w.selection_method,
              selectedByAdminId: w.selected_by_admin_id,
              prizeNotes: w.prize_notes,
              createdAt: w.created_at,
            };
          }),
      }));

      return res.json({ history });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ── Lead Billing System ──

  app.get("/api/admin/lead-pricing", requireAdmin, async (_req, res) => {
    try {
      const rows = await pgQuery(`SELECT * FROM lead_category_pricing ORDER BY category_name ASC`);
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/admin/lead-pricing/:id", requireAdmin, async (req, res) => {
    const { price_cents, is_active } = req.body;
    try {
      await pgQuery(
        `UPDATE lead_category_pricing SET price_cents = COALESCE($1, price_cents), is_active = COALESCE($2, is_active) WHERE id = $3`,
        [price_cents ?? null, is_active ?? null, req.params.id]
      );
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/lead-billing", requireAdmin, async (req, res) => {
    const { partner_id, status, billing_period } = req.query;
    try {
      let sql = `SELECT lb.*, pa.company_name AS partner_name
                 FROM lead_billing_records lb
                 LEFT JOIN partner_applications pa ON pa.id = lb.partner_id
                 WHERE 1=1`;
      const params: any[] = [];
      let idx = 1;
      if (partner_id) { sql += ` AND lb.partner_id = $${idx++}`; params.push(partner_id); }
      if (status) { sql += ` AND lb.status = $${idx++}`; params.push(status); }
      if (billing_period) { sql += ` AND lb.billing_period = $${idx++}`; params.push(billing_period); }
      sql += ` ORDER BY lb.created_at DESC LIMIT 200`;
      const rows = await pgQuery(sql, params);
      const summary = await pgQuery(
        `SELECT 
           COUNT(*)::int AS total_leads,
           SUM(CASE WHEN status = 'pending' THEN price_cents ELSE 0 END)::int AS pending_revenue,
           SUM(CASE WHEN status = 'billed' THEN price_cents ELSE 0 END)::int AS billed_revenue,
           SUM(CASE WHEN status = 'disputed' THEN price_cents ELSE 0 END)::int AS disputed_revenue,
           COUNT(CASE WHEN status = 'disputed' THEN 1 END)::int AS dispute_count
         FROM lead_billing_records
         ${billing_period ? `WHERE billing_period = $1` : ''}`,
        billing_period ? [billing_period] : []
      );
      return res.json({ records: rows, summary: summary[0] || {} });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/lead-billing/:id/dispute", requireAdmin, async (req, res) => {
    const { action, resolution } = req.body;
    if (!action || !['waive', 'reject_dispute'].includes(action)) {
      return res.status(400).json({ error: "Action must be 'waive' or 'reject_dispute'" });
    }
    try {
      const record = await pgQuery(`SELECT id, status FROM lead_billing_records WHERE id = $1`, [req.params.id]);
      if (record.length === 0) return res.status(404).json({ error: "Billing record not found" });
      if (action === 'waive') {
        await pgQuery(
          `UPDATE lead_billing_records SET status = 'waived', dispute_resolved_at = NOW(), dispute_resolution = $1, updated_at = NOW() WHERE id = $2`,
          [resolution || 'Admin waived', req.params.id]
        );
      } else if (action === 'reject_dispute') {
        await pgQuery(
          `UPDATE lead_billing_records SET status = 'pending', dispute_resolved_at = NOW(), dispute_resolution = $1, updated_at = NOW() WHERE id = $2`,
          [resolution || 'Dispute rejected', req.params.id]
        );
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/admin/partner-applications/:id/billing-model", requireAdmin, async (req, res) => {
    const { billing_model, lead_price_cents } = req.body;
    const valid = ['subscription_only', 'per_lead', 'hybrid'];
    if (billing_model && !valid.includes(billing_model)) return res.status(400).json({ error: "Invalid billing model" });
    if (lead_price_cents !== undefined && lead_price_cents !== null && (typeof lead_price_cents !== 'number' || lead_price_cents < 0)) {
      return res.status(400).json({ error: "lead_price_cents must be a non-negative integer" });
    }
    try {
      const partner = await pgQuery(`SELECT id FROM partner_applications WHERE id = $1`, [req.params.id]);
      if (partner.length === 0) return res.status(404).json({ error: "Partner not found" });
      await pgQuery(
        `UPDATE partner_applications SET billing_model = COALESCE($1, billing_model), lead_price_cents = $2, updated_at = NOW() WHERE id = $3`,
        [billing_model || null, lead_price_cents ?? null, req.params.id]
      );
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ── Partner Auth System ──

  async function resolvePartnerFromToken(req: any): Promise<{ id: string; email: string; company_name: string; status: string } | null> {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.slice(7);

    // Try Supabase auth first
    try {
      if (supabaseAdmin) {
        const { data: { user: supaUser } } = await supabaseAdmin.auth.getUser(token);
        if (supaUser?.email) {
          const partners = await pgQuery(
            `SELECT id, email, company_name, status FROM partner_applications WHERE LOWER(email) = $1 AND status IN ('approved', 'active') ORDER BY created_at DESC LIMIT 1`,
            [supaUser.email.toLowerCase()]
          );
          if (partners.length > 0) return partners[0];
        }
      }
    } catch {}

    // Fallback to legacy partner_sessions token
    try {
      const sessions = await pgQuery(
        `SELECT partner_id FROM partner_sessions WHERE token = $1 AND expires_at > NOW()`,
        [token]
      );
      if (sessions.length === 0) return null;
      const partners = await pgQuery(
        `SELECT id, email, company_name, status FROM partner_applications WHERE id = $1`,
        [sessions[0].partner_id]
      );
      return partners.length > 0 ? partners[0] : null;
    } catch { return null; }
  }

  const partnerAuthAttempts = new Map<string, { count: number; resetAt: number }>();
  function checkPartnerRateLimit(key: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean {
    const now = Date.now();
    const entry = partnerAuthAttempts.get(key);
    if (!entry || now > entry.resetAt) {
      partnerAuthAttempts.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= maxAttempts) return false;
    entry.count++;
    return true;
  }

  app.post("/api/partner/register", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
    const normalizedEmail = email.toLowerCase().trim();
    if (!checkPartnerRateLimit(`register:${normalizedEmail}`)) {
      return res.status(429).json({ error: "Too many attempts. Please try again later." });
    }
    try {
      const partner = await pgQuery(
        `SELECT id, password_hash, status FROM partner_applications WHERE LOWER(email) = $1 AND status IN ('approved', 'active') ORDER BY created_at DESC LIMIT 1`,
        [normalizedEmail]
      );
      if (partner.length === 0) return res.status(404).json({ error: "No approved application found for this email. Your application must be approved before you can create an account." });
      if (partner[0].password_hash) return res.status(409).json({ error: "Account already exists. Please log in." });
      const hash = await bcrypt.hash(password, 10);
      const updated = await pgQuery(
        `UPDATE partner_applications SET password_hash = $1 WHERE id = $2 AND password_hash IS NULL RETURNING id`,
        [hash, partner[0].id]
      );
      if (updated.length === 0) return res.status(409).json({ error: "Account already exists. Please log in." });
      const token = crypto.randomBytes(32).toString("hex");
      await pgQuery(
        `INSERT INTO partner_sessions (partner_id, token) VALUES ($1, $2)`,
        [partner[0].id, token]
      );
      const full = await pgQuery(
        `SELECT id, email, company_name, status FROM partner_applications WHERE id = $1`,
        [partner[0].id]
      );
      return res.json({ token, partner: full[0] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partner/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    const normalizedEmail = email.toLowerCase().trim();
    if (!checkPartnerRateLimit(`login:${normalizedEmail}`)) {
      return res.status(429).json({ error: "Too many login attempts. Please try again later." });
    }
    try {
      const partner = await pgQuery(
        `SELECT id, email, company_name, status, password_hash FROM partner_applications WHERE LOWER(email) = $1 ORDER BY created_at DESC LIMIT 1`,
        [normalizedEmail]
      );
      if (partner.length === 0) return res.status(404).json({ error: "No account found for this email" });
      if (!['approved', 'active'].includes(partner[0].status)) return res.status(403).json({ error: "Your application is not yet approved" });
      if (!partner[0].password_hash) return res.status(400).json({ error: "Account not yet created. Please create your account first." });
      const valid = await bcrypt.compare(password, partner[0].password_hash);
      if (!valid) return res.status(401).json({ error: "Incorrect password" });
      const token = crypto.randomBytes(32).toString("hex");
      await pgQuery(
        `INSERT INTO partner_sessions (partner_id, token) VALUES ($1, $2)`,
        [partner[0].id, token]
      );
      return res.json({
        token,
        partner: { id: partner[0].id, email: partner[0].email, company_name: partner[0].company_name, status: partner[0].status },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partner/logout", async (req, res) => {
    const authHeader = req.headers["authorization"];
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      await pgQuery(`DELETE FROM partner_sessions WHERE token = $1`, [token]).catch(() => {});
    }
    return res.json({ success: true });
  });

  app.get("/api/partner/me", async (req, res) => {
    const partner = await resolvePartnerFromToken(req);
    if (!partner) return res.status(401).json({ error: "Not authenticated" });

    try {
      const full = await pgQuery(
        `SELECT pa.id, pa.email, pa.company_name, pa.contact_name, pa.phone, pa.website,
                pa.city, pa.state, pa.category_id, pa.subcategory_ids, pa.plan_type, pa.status,
                pa.stripe_subscription_id, pa.converted_provider_id,
                tsc.name AS category_name
         FROM partner_applications pa
         LEFT JOIN trusted_service_categories tsc ON tsc.id::text = pa.category_id::text
         WHERE pa.id = $1
         LIMIT 1`,
        [partner.id]
      );

      if (full.length > 0) {
        const row = full[0];
        let subcategoryNames: string[] = [];
        if (row.subcategory_ids) {
          try {
            const raw = row.subcategory_ids;
            let ids: string[] = [];
            if (typeof raw === "string") {
              ids = raw.split(",").map((s: string) => s.trim()).filter(Boolean);
            } else if (Array.isArray(raw)) {
              ids = raw.map(String).filter(Boolean);
            }
            if (ids.length > 0) {
              const subs = await pgQuery(
                `SELECT name FROM partner_subcategories WHERE id = ANY($1::uuid[])`,
                [ids]
              );
              subcategoryNames = subs.map((s: any) => s.name);
            }
          } catch {}
        }
        let offerData: any = {};
        if (row.converted_provider_id) {
          try {
            const ts = await pgQuery(
              `SELECT offer_title, offer_description, banner_image_url, offer_expiry FROM trusted_services WHERE id = $1 LIMIT 1`,
              [row.converted_provider_id]
            );
            if (ts.length > 0) offerData = ts[0];
          } catch {}
        }
        return res.json({
          ...row,
          subcategory_names: subcategoryNames,
          ...offerData,
        });
      }
    } catch {}

    return res.json(partner);
  });

  app.patch("/api/partner/offer", async (req, res) => {
    const partner = await resolvePartnerFromToken(req);
    if (!partner) return res.status(401).json({ error: "Not authenticated" });
    try {
      const pa = await pgQuery(`SELECT converted_provider_id, status FROM partner_applications WHERE id = $1`, [partner.id]);
      if (!pa.length || !pa[0].converted_provider_id) {
        return res.status(400).json({ error: "No active listing found. Your account must be approved and active to manage offers." });
      }
      if (pa[0].status !== "active" && pa[0].status !== "approved") {
        return res.status(403).json({ error: "Your account must be active to manage offers." });
      }
      const { offer_title, offer_description, offer_expiry } = req.body;
      let parsedExpiry: string | null = null;
      if (offer_expiry) {
        const d = new Date(offer_expiry);
        if (isNaN(d.getTime())) {
          return res.status(400).json({ error: "Invalid expiry date format." });
        }
        parsedExpiry = d.toISOString().split("T")[0];
      }
      await pgQuery(
        `UPDATE trusted_services SET offer_title = $1, offer_description = $2, offer_expiry = $3 WHERE id = $4`,
        [
          (offer_title || "").trim().slice(0, 100) || null,
          (offer_description || "").trim().slice(0, 500) || null,
          parsedExpiry,
          pa[0].converted_provider_id,
        ]
      );
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/partner/banner", async (req, res) => {
    const partner = await resolvePartnerFromToken(req);
    if (!partner) return res.status(401).json({ error: "Not authenticated" });
    try {
      const pa = await pgQuery(`SELECT converted_provider_id, status FROM partner_applications WHERE id = $1`, [partner.id]);
      if (!pa.length || !pa[0].converted_provider_id) {
        return res.status(400).json({ error: "No active listing found." });
      }
      if (pa[0].status !== "active" && pa[0].status !== "approved") {
        return res.status(403).json({ error: "Your account must be active to manage banners." });
      }
      const { banner_image_url } = req.body;
      if (banner_image_url && typeof banner_image_url === "string") {
        if (!/^data:image\/(jpeg|jpg|png|webp|gif);base64,/.test(banner_image_url)) {
          return res.status(400).json({ error: "Banner must be a valid image (JPEG, PNG, or WebP)." });
        }
        const sizeBytes = Buffer.byteLength(banner_image_url, "utf8");
        if (sizeBytes > 4 * 1024 * 1024) {
          return res.status(400).json({ error: "Banner image is too large after compression. Please try a smaller image." });
        }
      }
      await pgQuery(
        `UPDATE trusted_services SET banner_image_url = $1 WHERE id = $2`,
        [banner_image_url || null, pa[0].converted_provider_id]
      );
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  const partnerCreateAccountLimiter = new Map<string, { count: number; resetAt: number }>();
  app.post("/api/partner/create-account", async (req, res) => {
    const clientIp = (req.headers["x-forwarded-for"] as string || req.ip || "unknown").split(",")[0].trim();
    const now = Date.now();
    const limiter = partnerCreateAccountLimiter.get(clientIp);
    if (limiter && limiter.resetAt > now && limiter.count >= 5) {
      return res.status(429).json({ error: "Too many attempts. Please try again later." });
    }
    if (!limiter || limiter.resetAt <= now) {
      partnerCreateAccountLimiter.set(clientIp, { count: 1, resetAt: now + 15 * 60 * 1000 });
    } else {
      limiter.count++;
    }

    const { email, password, sessionId } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const partners = await pgQuery(
        `SELECT id, company_name, contact_name, status, stripe_subscription_id FROM partner_applications WHERE LOWER(email) = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
        [normalizedEmail]
      );
      if (partners.length === 0) {
        return res.status(403).json({ error: "No active paid partner found for this email. Please complete payment first." });
      }

      const partner = partners[0];

      if (!partner.stripe_subscription_id) {
        return res.status(403).json({ error: "Payment has not been completed for this partner application. Please complete payment first." });
      }

      if (sessionId && stripe) {
        try {
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          const sessionEmail = (session.customer_email || session.customer_details?.email || "").toLowerCase();
          if (sessionEmail && sessionEmail !== normalizedEmail) {
            return res.status(403).json({ error: "Email does not match the payment session." });
          }
        } catch {
        }
      }

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: password,
        email_confirm: true,
      });

      if (createError) {
        console.log(`[partner-create-account] Supabase createUser error:`, createError.message);
        if (createError.message.includes("already been registered") || createError.message.includes("already exists")) {
          return res.status(409).json({ error: "An account with this email already exists. Please sign in instead." });
        }
        return res.status(500).json({ error: "Unable to create account. Please try again." });
      }

      if (newUser?.user?.id) {
        try {
          const firstName = partner.contact_name?.split(" ")[0] || "";
          const lastName = partner.contact_name?.split(" ").slice(1).join(" ") || "";
          await supabaseAdmin.from("user_profiles").upsert({
            id: newUser.user.id,
            email: normalizedEmail,
            first_name: firstName,
            last_name: lastName,
            user_type: "nonprofit_rep",
            consent_contact: true,
          }, { onConflict: "id" });
        } catch (profileErr: any) {
          console.log(`[partner-create-account] Profile creation warning:`, profileErr.message);
        }
      }

      console.log(`[partner-create-account] Account created for ${normalizedEmail} (partner: ${partner.company_name})`);
      return res.json({ success: true, message: "Account created successfully. You can now sign in." });
    } catch (err: any) {
      console.log(`[partner-create-account] Error:`, err.message);
      return res.status(500).json({ error: "Failed to create account. Please try again." });
    }
  });

  app.get("/api/partner/prefill-public", async (req, res) => {
    const email = (req.query.email as string || "").trim().toLowerCase();
    if (!email) return res.json({ found: false });
    try {
      const partners = await pgQuery(
        `SELECT company_name, contact_name, category_id FROM partner_applications WHERE LOWER(email) = $1 AND status IN ('approved', 'active') ORDER BY created_at DESC LIMIT 1`,
        [email]
      );
      if (partners.length === 0) return res.json({ found: false });
      const p = partners[0];
      let categoryName = null;
      if (p.category_id) {
        const cats = await pgQuery(`SELECT name FROM trusted_service_categories WHERE id = $1`, [p.category_id]);
        if (cats.length > 0) categoryName = cats[0].name;
      }
      return res.json({
        found: true,
        companyName: p.company_name,
        contactName: p.contact_name,
        categoryName: categoryName || "",
      });
    } catch {
      return res.json({ found: false });
    }
  });

  app.get("/api/partner/prefill", async (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.json({ found: false });
    try {
      const token = authHeader.slice(7);
      if (!supabaseAdmin) return res.json({ found: false });
      const { data: { user: supaUser } } = await supabaseAdmin.auth.getUser(token);
      if (!supaUser?.email) return res.json({ found: false });
      const email = supaUser.email.toLowerCase();
      const partners = await pgQuery(
        `SELECT company_name, contact_name, category_id FROM partner_applications WHERE LOWER(email) = $1 AND status IN ('approved', 'active') ORDER BY created_at DESC LIMIT 1`,
        [email]
      );
      if (partners.length === 0) return res.json({ found: false });
      const p = partners[0];
      let categoryName = null;
      if (p.category_id) {
        const cats = await pgQuery(`SELECT name FROM trusted_service_categories WHERE id = $1`, [p.category_id]);
        if (cats.length > 0) categoryName = cats[0].name;
      }
      return res.json({
        found: true,
        companyName: p.company_name,
        contactName: p.contact_name,
        categoryName: categoryName || "",
      });
    } catch {
      return res.json({ found: false });
    }
  });

  app.get("/api/partner/role-check", async (req, res) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.json({ isPartner: false });
    try {
      const token = authHeader.slice(7);
      if (!supabaseAdmin) return res.json({ isPartner: false });
      const { data: { user: supaUser } } = await supabaseAdmin.auth.getUser(token);
      if (!supaUser?.email) return res.json({ isPartner: false });
      const partners = await pgQuery(
        `SELECT id, company_name, status FROM partner_applications WHERE LOWER(email) = $1 AND status IN ('approved', 'active') ORDER BY created_at DESC LIMIT 1`,
        [supaUser.email.toLowerCase()]
      );
      if (partners.length === 0) return res.json({ isPartner: false });
      return res.json({ isPartner: true, companyName: partners[0].company_name, status: partners[0].status });
    } catch {
      return res.json({ isPartner: false });
    }
  });

  // ── Partner Referral System (Link-Based) ──

  app.get("/api/partner-referral/me", async (req, res) => {
    const partner = await resolvePartnerFromToken(req);
    if (!partner) return res.status(401).json({ error: "Not authenticated" });
    if (!['approved', 'active'].includes(partner.status)) return res.status(403).json({ error: "Partner not yet approved" });
    try {
      const partnerId = partner.id;
      const referralCode = await getOrCreatePartnerReferralCode(partnerId);
      const referralLink = `https://veterancare.com/partner-apply?ref=${referralCode}`;
      const referrals = await pgQuery(
        `SELECT status, COUNT(*)::int AS count FROM partner_referrals WHERE referrer_partner_id = $1 GROUP BY status`,
        [partnerId]
      );
      let totalReferrals = 0, signedUp = 0, freeMonthsEarned = 0, pending = 0;
      for (const r of referrals) {
        totalReferrals += r.count;
        if (r.status === 'signed_up') signedUp += r.count;
        if (r.status === 'first_cycle_complete' || r.status === 'credit_applied') freeMonthsEarned += r.count;
        if (r.status === 'pending' || r.status === 'signed_up') pending += r.count;
      }
      const rankRows = await pgQuery(
        `SELECT referrer_partner_id, COUNT(*)::int AS total
         FROM partner_referrals 
         WHERE status IN ('signed_up', 'first_cycle_complete', 'credit_applied')
         GROUP BY referrer_partner_id
         ORDER BY total DESC`
      );
      let rank: number | null = null;
      for (let i = 0; i < rankRows.length; i++) {
        if (rankRows[i].referrer_partner_id === partnerId) { rank = i + 1; break; }
      }
      return res.json({
        partnerId,
        companyName: partner.company_name,
        referralCode,
        referralLink,
        totalReferrals,
        signedUp,
        freeMonthsEarned,
        pendingRewards: pending,
        rank,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/partner-referral/leaderboard", async (_req, res) => {
    try {
      const rows = await pgQuery(
        `SELECT pa.company_name, COUNT(pr.id)::int AS successful_referrals
         FROM partner_referrals pr
         JOIN partner_applications pa ON pa.id = pr.referrer_partner_id
         WHERE pr.status IN ('signed_up', 'first_cycle_complete', 'credit_applied')
         GROUP BY pa.id, pa.company_name
         ORDER BY successful_referrals DESC
         LIMIT 20`
      );
      const leaderboard = rows.map((r: any, i: number) => ({
        rank: i + 1,
        companyName: r.company_name,
        referrals: r.successful_referrals,
      }));
      return res.json({ leaderboard });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/partner-referral/resolve/:code", async (req, res) => {
    try {
      const partner = await pgQuery(
        `SELECT id, company_name FROM partner_applications WHERE referral_code = $1`,
        [req.params.code.toUpperCase()]
      );
      if (partner.length === 0) return res.status(404).json({ error: "Invalid referral code" });
      return res.json({ referrerName: partner[0].company_name });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/partner/lead-dispute", async (req, res) => {
    const partner = await resolvePartnerFromToken(req);
    if (!partner) return res.status(401).json({ error: "Not authenticated" });
    const { billingRecordId, reason } = req.body;
    if (!billingRecordId || !reason) {
      return res.status(400).json({ error: "Billing record ID and reason required" });
    }
    try {
      const record = await pgQuery(
        `SELECT * FROM lead_billing_records WHERE id = $1 AND partner_id = $2`,
        [billingRecordId, partner.id]
      );
      if (record.length === 0) return res.status(404).json({ error: "Billing record not found" });
      if (record[0].status !== 'pending') {
        return res.status(400).json({ error: `Cannot dispute a record with status '${record[0].status}'` });
      }
      const createdAt = new Date(record[0].created_at);
      const hoursElapsed = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursElapsed > 48) {
        return res.status(400).json({ error: "Dispute window has closed (48 hours)" });
      }
      await pgQuery(
        `UPDATE lead_billing_records SET status = 'disputed', dispute_reason = $1, dispute_filed_at = NOW(), updated_at = NOW() WHERE id = $2`,
        [reason, billingRecordId]
      );
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/partner/lead-billing", async (req, res) => {
    const partner = await resolvePartnerFromToken(req);
    if (!partner) return res.status(401).json({ error: "Not authenticated" });
    try {
      const rows = await pgQuery(
        `SELECT * FROM lead_billing_records WHERE partner_id = $1 ORDER BY created_at DESC LIMIT 100`,
        [partner.id]
      );
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/partner-referrals", requireAdmin, async (_req, res) => {
    try {
      const rows = await pgQuery(
        `SELECT pr.*, pa.company_name AS referrer_company_name
         FROM partner_referrals pr
         LEFT JOIN partner_applications pa ON pa.id = pr.referrer_partner_id
         ORDER BY pr.created_at DESC`
      );
      return res.json(rows);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/partner-referrals/:id/apply-credit", requireAdmin, async (req, res) => {
    try {
      const referral = await pgQuery(`SELECT * FROM partner_referrals WHERE id = $1`, [req.params.id]);
      if (referral.length === 0) return res.status(404).json({ error: "Referral not found" });
      if (referral[0].status === 'credit_applied') return res.status(400).json({ error: "Credit already applied" });
      const referrerPartner = await pgQuery(
        `SELECT stripe_customer_id FROM partner_applications WHERE id = $1`,
        [referral[0].referrer_partner_id]
      );
      if (!referrerPartner.length || !referrerPartner[0].stripe_customer_id) {
        return res.status(400).json({ error: "Referring partner has no Stripe customer ID" });
      }
      if (!stripe) return res.status(503).json({ error: "Stripe not configured" });
      const coupon = await stripe.coupons.create({
        percent_off: 100,
        duration: "once",
        name: `Referral credit - ${referral[0].referred_company_name}`,
        max_redemptions: 1,
      });
      const subs = await stripe.subscriptions.list({
        customer: referrerPartner[0].stripe_customer_id,
        status: "active",
        limit: 1,
      });
      if (subs.data.length === 0) {
        return res.status(400).json({ error: "Referring partner has no active subscription" });
      }
      await stripe.subscriptions.update(subs.data[0].id, {
        coupon: coupon.id,
      });
      await pgQuery(
        `UPDATE partner_referrals SET status = 'credit_applied', credit_coupon_id = $1, credit_applied_at = NOW(), updated_at = NOW() WHERE id = $2`,
        [coupon.id, req.params.id]
      );
      return res.json({ success: true, couponId: coupon.id });
    } catch (err: any) {
      console.error("[partner-referral] Credit apply error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  app.patch("/api/admin/partner-referrals/:id/status", requireAdmin, async (req, res) => {
    const { status } = req.body;
    const valid = ['pending', 'signed_up', 'first_cycle_complete', 'credit_applied', 'expired', 'rejected'];
    if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });
    try {
      await pgQuery(`UPDATE partner_referrals SET status = $1, updated_at = NOW() WHERE id = $2`, [status, req.params.id]);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/admin/sweepstakes/prize", requireAdmin, async (req, res) => {
    try {
      const { prizeTitle, prizeDescription, prizeValue, prizeImageUrl, rulesText } = req.body;
      const currentMonth = await getCurrentSweepstakesMonth();
      const existing = await pgQuery(`SELECT id FROM sweepstakes_months WHERE month = $1`, [currentMonth]);
      if (existing.length === 0) {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        await pgQuery(
          `INSERT INTO sweepstakes_months (month, status, start_date, end_date, prize_title, prize_description, prize_value, prize_image_url, rules_text)
           VALUES ($1, 'active', $2, $3, $4, $5, $6, $7, $8)`,
          [currentMonth, start.toISOString().slice(0, 10), end.toISOString().slice(0, 10),
           prizeTitle || null, prizeDescription || null, prizeValue || null, prizeImageUrl || null, rulesText || null]
        );
      } else {
        await pgQuery(
          `UPDATE sweepstakes_months SET prize_title = $1, prize_description = $2, prize_value = $3, prize_image_url = $4, rules_text = $5, updated_at = NOW() WHERE month = $6`,
          [prizeTitle || null, prizeDescription || null, prizeValue || null, prizeImageUrl || null, rulesText || null, currentMonth]
        );
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/sweepstakes/notify-winner/:winnerId", requireAdmin, async (req, res) => {
    try {
      const { winnerId } = req.params;
      const winners = await pgQuery(`SELECT * FROM sweepstakes_winners WHERE id = $1`, [winnerId]);
      if (winners.length === 0) return res.status(404).json({ error: "Winner not found" });
      const winner = winners[0];
      let email: string | null = null;
      try {
        const { data: profile } = await supabaseAdmin.from("user_profiles").select("email, first_name").eq("id", winner.user_id).single();
        email = profile?.email || null;
      } catch {}
      if (!email) return res.status(400).json({ error: "Winner has no email on file" });
      const monthRows = await pgQuery(`SELECT * FROM sweepstakes_months WHERE month = $1`, [winner.month]);
      const monthData = monthRows[0];
      const prizeTitle = monthData?.prize_title || "Monthly Prize";
      const prizeDesc = monthData?.prize_description || "";
      const { Resend } = await import("resend");
      const resendClient = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.RESEND_FROM_EMAIL || `Veteran Care <onboarding@resend.dev>`;
      const [y, m] = winner.month.split("-");
      const monthName = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      await resendClient.emails.send({
        from: fromEmail,
        to: email,
        subject: `Congratulations! You won the ${monthName} Veteran Care Giveaway!`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="text-align:center;padding:24px 0;border-bottom:2px solid #16a34a;">
              <h1 style="color:#1a1a2e;font-size:28px;margin:0;">🎉 Congratulations!</h1>
              <p style="color:#16a34a;font-size:16px;margin:8px 0 0;font-weight:600;">You're a ${monthName} Giveaway Winner!</p>
            </div>
            <div style="padding:24px 0;">
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
                <p style="font-size:20px;font-weight:700;color:#1a1a2e;margin:0;">🏆 ${esc(prizeTitle)}</p>
                ${prizeDesc ? `<p style="color:#374151;font-size:14px;margin:8px 0 0;">${esc(prizeDesc)}</p>` : ''}
                ${monthData?.prize_value ? `<p style="color:#16a34a;font-size:24px;font-weight:700;margin:12px 0 0;">$${monthData.prize_value}</p>` : ''}
              </div>
              ${winner.prize_notes ? `<p style="color:#374151;font-size:14px;margin:16px 0;">${esc(winner.prize_notes)}</p>` : ''}
              <p style="color:#374151;font-size:14px;">A member of our team will be in touch with prize delivery details. Thank you for being part of the Veteran Care community!</p>
            </div>
            <div style="text-align:center;padding:20px 0;border-top:1px solid #e5e7eb;">
              <p style="color:#6b7280;font-size:12px;">Veteran Care &middot; <a href="https://veterancare.com" style="color:#16a34a;">veterancare.com</a></p>
            </div>
          </div>`,
      });
      await pgQuery(`UPDATE sweepstakes_winners SET notified = true, notified_at = NOW() WHERE id = $1`, [winnerId]);
      return res.json({ success: true, email });
    } catch (err: any) {
      console.error("[sweepstakes] Winner notification error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/sweepstakes/current-prize", async (_req, res) => {
    try {
      const currentMonth = await getCurrentSweepstakesMonth();
      const rows = await pgQuery(
        `SELECT month, prize_title, prize_description, prize_value, prize_image_url, rules_text, status FROM sweepstakes_months WHERE month = $1`,
        [currentMonth]
      );
      if (rows.length === 0) {
        return res.json({ month: currentMonth, prizeTitle: null, prizeDescription: null, prizeValue: null, prizeImageUrl: null, rulesText: null, status: 'active' });
      }
      const r = rows[0];
      return res.json({
        month: currentMonth,
        prizeTitle: r.prize_title,
        prizeDescription: r.prize_description,
        prizeValue: r.prize_value,
        prizeImageUrl: r.prize_image_url,
        rulesText: r.rules_text,
        status: r.status,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/monetization-hardening", requireAdmin, async (_req, res) => {
    try {
      const { getAuditSummary, getRecentAuditEntries, classifyMismatches } = await import("./monetization-audit");
      const summary = await getAuditSummary();
      const recent = await getRecentAuditEntries(50);

      let classifiedMismatches: any[] = [];
      let eligibilitySummary: any[] = [];
      try {
        const { data: allPartners } = await supabaseAdmin
          .from("partner_organizations")
          .select("id, name, is_active, is_lead_enabled, subscription_status, active_paid_partner, onboarding_status, partner_status_override")
          .order("name");
        if (allPartners) {
          const activeOrPaid = allPartners.filter(p => p.is_active || p.active_paid_partner);
          classifiedMismatches = classifyMismatches(activeOrPaid);
        }
        eligibilitySummary = (allPartners || []).map(p => {
          const eligible = p.is_active && p.is_lead_enabled && p.active_paid_partner !== false
            && (!p.subscription_status || p.subscription_status === "active")
            && (!p.onboarding_status || p.onboarding_status === "active")
            && p.partner_status_override !== "paused";
          const blockers: string[] = [];
          if (!p.is_active) blockers.push("inactive");
          if (!p.is_lead_enabled) blockers.push("leads disabled");
          if (p.active_paid_partner === false) blockers.push("not paid");
          if (p.subscription_status && p.subscription_status !== "active") blockers.push(`subscription: ${p.subscription_status}`);
          if (p.onboarding_status && p.onboarding_status !== "active") blockers.push(`onboarding: ${p.onboarding_status}`);
          if (p.partner_status_override === "paused") blockers.push("paused");
          return { partner_id: p.id, name: p.name, eligible, blockers };
        });
      } catch {}

      const criticalCount = classifiedMismatches.filter((m: any) => m.severity === "critical").length;

      return res.json({
        available: true,
        summary: { ...summary, total_mismatches: classifiedMismatches.length, critical_mismatches: criticalCount },
        mismatches: classifiedMismatches,
        eligibility: eligibilitySummary,
        recent_blocks: recent,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/monetization-quick-fix/:partnerId", requireAdmin, async (req, res) => {
    const { partnerId } = req.params;
    const { action } = req.body;
    const validActions = ["sync_from_stripe", "toggle_lead_enable", "reset_onboarding_status", "mark_reviewed"];
    if (!validActions.includes(action)) return res.status(400).json({ error: `Invalid action. Must be: ${validActions.join(", ")}` });

    const { logMonetizationAudit, logMismatchResolution } = await import("./monetization-audit");
    const adminActor = "admin";

    try {
      const { data: partner } = await supabaseAdmin
        .from("partner_organizations")
        .select("id, name, contact_email, is_active, is_lead_enabled, subscription_status, active_paid_partner, onboarding_status, partner_status_override")
        .eq("id", partnerId)
        .single();
      if (!partner) return res.status(404).json({ error: "Partner not found" });

      let result: Record<string, any> = { action, partner_id: partnerId, partner_name: partner.name };

      if (action === "sync_from_stripe") {
        let stripeStatus: string | null = null;
        let stripePaid = false;
        try {
          const rows = await pgQuery(
            `SELECT subscription_status, billing_active FROM partner_applications WHERE email = $1 ORDER BY updated_at DESC LIMIT 1`,
            [partner.contact_email]
          );
          if (rows.length > 0) {
            stripeStatus = rows[0].subscription_status;
            stripePaid = rows[0].billing_active === true && stripeStatus === "active";
            const updatePayload: Record<string, any> = { subscription_status: stripeStatus || "canceled", active_paid_partner: stripePaid };
            if (stripeStatus === "active" && stripePaid) updatePayload.onboarding_status = "active";
            await supabaseAdmin.from("partner_organizations").update(updatePayload).eq("id", partnerId);
            result.synced = true;
            result.stripe_status = stripeStatus;
            result.active_paid = stripePaid;
          } else {
            result.synced = false;
            result.note = "No partner_applications record found";
          }
        } catch (err: any) {
          result.synced = false;
          result.error = err?.message;
        }
      } else if (action === "toggle_lead_enable") {
        const newValue = !partner.is_lead_enabled;
        await supabaseAdmin.from("partner_organizations").update({ is_lead_enabled: newValue }).eq("id", partnerId);
        result.is_lead_enabled = newValue;
      } else if (action === "reset_onboarding_status") {
        await supabaseAdmin.from("partner_organizations").update({ onboarding_status: "active" }).eq("id", partnerId);
        result.onboarding_status = "active";
      } else if (action === "mark_reviewed") {
        result.reviewed = true;
      }

      await logMonetizationAudit({
        event_type: "admin_action_taken",
        partner_id: partnerId,
        lead_id: null,
        reason: `Admin quick-fix: ${action}`,
        mismatch_type: action === "sync_from_stripe" ? "subscription_mismatch" : action === "toggle_lead_enable" ? "eligibility_mismatch" : action === "reset_onboarding_status" ? "onboarding_mismatch" : "configuration_mismatch",
        severity: "warning",
        metadata: { ...result, resolved_by: adminActor },
      });

      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/system-safety", requireAdmin, async (_req, res) => {
    try {
      const { getSystemSafetyStatus } = await import("./system-safety");
      const status = await getSystemSafetyStatus();
      return res.json({ available: true, ...status });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/system-safety/mode", requireAdmin, async (req, res) => {
    const { mode, reason } = req.body;
    if (!["normal", "restricted", "safe_mode"].includes(mode)) return res.status(400).json({ error: "Invalid mode. Must be: normal, restricted, safe_mode" });
    try {
      const { setSystemMode } = await import("./system-safety");
      await setSystemMode(mode, "admin", reason || "Manual mode change");
      return res.json({ success: true, mode });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/system-safety/limits", requireAdmin, async (req, res) => {
    const { key, value } = req.body;
    if (!key || typeof value !== "number" || value < 1) return res.status(400).json({ error: "key and value (positive number) required" });
    try {
      const { updateSafetyLimit } = await import("./system-safety");
      await updateSafetyLimit(key, value);
      const { logMonetizationAudit } = await import("./monetization-audit");
      await logMonetizationAudit({
        event_type: "admin_action_taken" as any,
        partner_id: null, lead_id: null,
        reason: `Safety limit updated: ${key} = ${value}`,
        mismatch_type: "safety_limit_change",
        severity: "warning",
        metadata: { key, value, changed_by: "admin" },
      });
      return res.json({ success: true, key, value });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/automation-status", requireAdmin, async (_req, res) => {
    try {
      const { getAutomationStatus } = await import("./automation-controller");
      const status = await getAutomationStatus();
      return res.json({ available: true, ...status });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/automation-mode", requireAdmin, async (req, res) => {
    const { mode } = req.body;
    if (!["manual_only", "assisted", "semi_auto"].includes(mode)) {
      return res.status(400).json({ error: "Invalid mode. Must be: manual_only, assisted, semi_auto" });
    }
    try {
      const { setAutomationMode } = await import("./automation-controller");
      await setAutomationMode(mode, "admin");
      return res.json({ success: true, mode });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/automation-pause", requireAdmin, async (req, res) => {
    const { action, reason } = req.body;
    try {
      const { pauseAutomation, resumeAutomation } = await import("./automation-controller");
      if (action === "pause") {
        pauseAutomation(reason || "Admin paused");
        return res.json({ success: true, paused: true });
      } else if (action === "resume") {
        resumeAutomation();
        return res.json({ success: true, paused: false });
      }
      return res.status(400).json({ error: "action must be 'pause' or 'resume'" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/automation-run/billing", requireAdmin, async (req, res) => {
    try {
      const { runAutoBatchBilling } = await import("./automation-controller");
      const result = await runAutoBatchBilling();
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/automation-run/follow-ups", requireAdmin, async (req, res) => {
    try {
      const { runAutoFollowUps } = await import("./automation-controller");
      const result = await runAutoFollowUps();
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/automation-suggestions", requireAdmin, async (_req, res) => {
    try {
      const { suggestBillingActions, suggestFollowUpActions } = await import("./automation-controller");
      const [billing, followUps] = await Promise.all([suggestBillingActions(), suggestFollowUpActions()]);
      return res.json({ available: true, billing_suggestions: billing.suggestions, follow_up_suggestions: followUps.suggestions });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/automation-supervision", requireAdmin, async (_req, res) => {
    try {
      const { getAutomationSupervisionData } = await import("./monetization-audit");
      const data = await getAutomationSupervisionData();
      return res.json(data);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/automation-supervision/review", requireAdmin, async (req, res) => {
    try {
      const { id, resolution } = req.body;
      if (!id || !resolution) return res.status(400).json({ error: "id and resolution required" });
      const { updateAuditResolution, logMonetizationAudit } = await import("./monetization-audit");
      await updateAuditResolution(id, resolution, "admin");
      await logMonetizationAudit({
        event_type: "admin_action_taken" as any,
        partner_id: null, lead_id: null,
        reason: `Exception ${id} marked as ${resolution}`,
        metadata: { action: "exception_review", audit_id: id, resolution },
      });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/automation-supervision/retry", requireAdmin, async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "id required" });
      const { markRetryAttempted, logMonetizationAudit } = await import("./monetization-audit");
      await markRetryAttempted(id);
      await logMonetizationAudit({
        event_type: "admin_action_taken" as any,
        partner_id: null, lead_id: null,
        reason: `Manual retry flagged for exception ${id}`,
        metadata: { action: "retry_attempted", audit_id: id },
      });
      return res.json({ success: true, message: "Retry flagged — execute manually from automation controls" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/escalation-queue", requireAdmin, async (_req, res) => {
    try {
      const { getEscalationQueue, getConfidenceSummary } = await import("./automation-confidence");
      const [queue, summary] = await Promise.all([getEscalationQueue(), getConfidenceSummary()]);
      return res.json({ queue, confidence_summary: summary });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/escalation-queue/resolve", requireAdmin, async (req, res) => {
    try {
      const { id, action } = req.body;
      if (!id || !action) return res.status(400).json({ error: "id and action required" });
      if (!["approve_and_run", "reject", "mark_safe_for_future", "investigate"].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }
      const { resolveEscalation } = await import("./automation-confidence");
      const result = await resolveEscalation(id, action, "admin");
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/feature-flags", requireAdmin, async (_req, res) => {
    try {
      const { getAllFeatureFlags, getFeatureToggleLog } = await import("./automation-feature-flags");
      const { getAutomationMode } = await import("./automation-controller");
      const { getSystemMode } = await import("./system-safety");
      const [flags, toggleLog, automationMode, systemMode] = await Promise.all([
        getAllFeatureFlags(), getFeatureToggleLog(), getAutomationMode(), getSystemMode(),
      ]);
      return res.json({ flags, toggle_log: toggleLog, automation_mode: automationMode, system_mode: systemMode });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/feature-flags/toggle", requireAdmin, async (req, res) => {
    try {
      const { feature_name, enabled } = req.body;
      if (!feature_name || typeof enabled !== "boolean") {
        return res.status(400).json({ error: "feature_name and enabled (boolean) required" });
      }
      const { setFeatureFlag, ALL_FLAGS } = await import("./automation-feature-flags");
      if (!ALL_FLAGS.includes(feature_name)) {
        return res.status(400).json({ error: `Invalid feature: ${feature_name}` });
      }
      const result = await setFeatureFlag(feature_name, enabled, "admin");
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/admin/rls-validation", requireAdmin, async (_req, res) => {
    try {
      const { validateRlsIntegrity } = await import("./rls-validator");
      const result = await validateRlsIntegrity();
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/rls-enforce", requireAdmin, async (_req, res) => {
    try {
      const { enforceRls } = await import("./rls-validator");
      const result = await enforceRls();
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}
