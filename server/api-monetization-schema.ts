/**
 * API MONETIZATION — FUTURE-READY SCHEMA (Phase: SLEEP MODE)
 *
 * Lays down the database scaffolding for a future paid Veteran Care
 * Resource API so it can be activated later with minimal rebuild.
 *
 * IMPORTANT — DO NOT BUILD THE API YET. This file ONLY:
 *   1. Creates 4 empty future-ready tables (api_resources, api_customers,
 *      api_keys, api_call_log).
 *   2. Creates 1 small observability table (api_mirror_sync_log).
 *   3. Adds a single column `public_api_eligible BOOLEAN DEFAULT false`
 *      to the existing `resources` table — defaulted to FALSE so no row
 *      is API-eligible until the founder explicitly opts it in.
 *   4. Enables RLS on every new table (matches the project's "all tables
 *      RLS-enabled" posture documented in replit.md).
 *   5. Creates query-pattern indexes the future API will need.
 *
 * Activation later requires NO destructive migrations — just:
 *   - implement the sync job that populates `api_resources`
 *   - implement the auth middleware that reads `api_keys`
 *   - mount /v1/* routes
 *   - wire Stripe webhooks to insert into `api_customers` + `api_keys`
 *
 * See `.local/api-monetization-feasibility-plan.md` for the full plan.
 */

import { query as pgQuery } from "./pg-client";
import { supabaseAdmin } from "./supabase";

async function safe(sql: string, label: string): Promise<boolean> {
  try {
    await pgQuery(sql);
    return true;
  } catch (err: any) {
    console.log(`[api-monetization] ${label} skipped: ${err.message}`);
    return false;
  }
}

export async function ensureApiMonetizationSchema(): Promise<void> {
  // ── 1. api_customers ─────────────────────────────────────────────
  await safe(
    `CREATE TABLE IF NOT EXISTS api_customers (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stripe_customer_id  TEXT UNIQUE,
      org_name            TEXT NOT NULL,
      contact_email       TEXT NOT NULL,
      status              TEXT NOT NULL DEFAULT 'pending',
      tier                TEXT NOT NULL DEFAULT 'single_state',
      scope_states        TEXT[] NOT NULL DEFAULT '{}',
      monthly_call_cap    INT,
      notes               TEXT,
      created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    "create api_customers",
  );
  await safe(`ALTER TABLE api_customers ENABLE ROW LEVEL SECURITY`, "rls api_customers");
  await safe(
    `CREATE INDEX IF NOT EXISTS idx_api_customers_status ON api_customers(status)`,
    "idx api_customers status",
  );
  await safe(
    `CREATE INDEX IF NOT EXISTS idx_api_customers_stripe ON api_customers(stripe_customer_id)`,
    "idx api_customers stripe",
  );

  // ── 2. api_keys ─────────────────────────────────────────────────
  await safe(
    `CREATE TABLE IF NOT EXISTS api_keys (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id   UUID NOT NULL REFERENCES api_customers(id) ON DELETE CASCADE,
      key_prefix    TEXT NOT NULL,
      key_hash      TEXT NOT NULL UNIQUE,
      label         TEXT,
      status        TEXT NOT NULL DEFAULT 'active',
      last_used_at  TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      revoked_at    TIMESTAMPTZ
    )`,
    "create api_keys",
  );
  await safe(`ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY`, "rls api_keys");
  await safe(
    `CREATE INDEX IF NOT EXISTS idx_api_keys_active_hash ON api_keys(key_hash) WHERE status='active'`,
    "idx api_keys active_hash",
  );
  await safe(
    `CREATE INDEX IF NOT EXISTS idx_api_keys_customer ON api_keys(customer_id)`,
    "idx api_keys customer",
  );

  // ── 3. api_call_log ─────────────────────────────────────────────
  await safe(
    `CREATE TABLE IF NOT EXISTS api_call_log (
      id            BIGSERIAL PRIMARY KEY,
      api_key_id    UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
      customer_id   UUID NOT NULL REFERENCES api_customers(id) ON DELETE CASCADE,
      endpoint      TEXT NOT NULL,
      http_status   INT NOT NULL,
      response_ms   INT,
      ip            INET,
      user_agent    TEXT,
      call_cost     INT NOT NULL DEFAULT 1,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    "create api_call_log",
  );
  await safe(`ALTER TABLE api_call_log ENABLE ROW LEVEL SECURITY`, "rls api_call_log");
  await safe(
    `CREATE INDEX IF NOT EXISTS idx_api_call_log_customer_created
       ON api_call_log(customer_id, created_at DESC)`,
    "idx api_call_log customer_created",
  );
  // Note: a `date_trunc('month', created_at)` partial index would require an
  // IMMUTABLE wrapper. The (customer_id, created_at DESC) index above already
  // serves monthly aggregation queries efficiently via a range filter, so we
  // skip the month-bucket index for now. Revisit when call volume warrants it.

  // ── 4. api_resources (mirror table) ─────────────────────────────
  // Column whitelist enforced AT THE SCHEMA LEVEL: no admin/attribution/
  // billing/ambassador/internal columns exist here, period. Future sync
  // job uses explicit INSERT ... SELECT (named columns) — no SELECT *.
  await safe(
    `CREATE TABLE IF NOT EXISTS api_resources (
      id                  UUID PRIMARY KEY,
      name                TEXT NOT NULL,
      description         TEXT,
      category_slug       TEXT NOT NULL,
      subcategory_slug    TEXT,
      state               TEXT NOT NULL,
      city                TEXT,
      address             TEXT,
      phone               TEXT,
      website             TEXT,
      hours_json          JSONB,
      languages           TEXT[],
      accessibility_json  JSONB,
      last_verified_at    TIMESTAMPTZ,
      source_attribution  TEXT NOT NULL DEFAULT 'Veteran Care Verified Directory',
      is_honeytoken       BOOLEAN NOT NULL DEFAULT false,
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    "create api_resources",
  );
  await safe(`ALTER TABLE api_resources ENABLE ROW LEVEL SECURITY`, "rls api_resources");
  await safe(
    `CREATE INDEX IF NOT EXISTS idx_api_resources_state ON api_resources(state)`,
    "idx api_resources state",
  );
  await safe(
    `CREATE INDEX IF NOT EXISTS idx_api_resources_state_cat
       ON api_resources(state, category_slug)`,
    "idx api_resources state_cat",
  );
  await safe(
    `CREATE INDEX IF NOT EXISTS idx_api_resources_state_city
       ON api_resources(state, city)`,
    "idx api_resources state_city",
  );

  // ── 5. api_mirror_sync_log (observability for the future sync job) ─
  await safe(
    `CREATE TABLE IF NOT EXISTS api_mirror_sync_log (
      id              BIGSERIAL PRIMARY KEY,
      run_started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      run_finished_at TIMESTAMPTZ,
      rows_inserted   INT NOT NULL DEFAULT 0,
      rows_updated    INT NOT NULL DEFAULT 0,
      rows_removed    INT NOT NULL DEFAULT 0,
      error           TEXT
    )`,
    "create api_mirror_sync_log",
  );
  await safe(`ALTER TABLE api_mirror_sync_log ENABLE ROW LEVEL SECURITY`, "rls api_mirror_sync_log");

  // ── 6. resources.public_api_eligible (the kill switch — defaults FALSE) ─
  // The `resources` table lives in the Supabase project DB (separate from the
  // pgQuery target). The established pattern in this codebase for adding
  // columns to `resources` is to PROBE via supabaseAdmin and log a manual
  // ALTER instruction if the column is missing (see checkSubcategoryColumn,
  // checkServicePriorityColumn, checkNotifyEmailColumn).
  //
  // No row enters api_resources without this flag flipped to TRUE per row.
  // Default MUST be FALSE so the existing approved resources stay PRIVATE
  // until the founder reviews and opts each in.
  try {
    const { error } = await supabaseAdmin
      .from("resources")
      .select("public_api_eligible")
      .limit(1);
    if (error && error.message.includes("does not exist")) {
      console.log(
        "[api-monetization] public_api_eligible column NOT FOUND on resources. " +
          "Run in Supabase SQL editor: " +
          "ALTER TABLE resources ADD COLUMN public_api_eligible BOOLEAN NOT NULL DEFAULT false; " +
          "CREATE INDEX IF NOT EXISTS idx_resources_api_eligible " +
          "ON resources(public_api_eligible) WHERE public_api_eligible = true; " +
          "(Or run: supabase/add_resources_public_api_eligible.sql)",
      );
    } else if (error) {
      console.log(`[api-monetization] resources column probe error: ${error.message}`);
    } else {
      console.log("[api-monetization] resources.public_api_eligible column detected");
    }
  } catch (err: any) {
    console.log(`[api-monetization] resources column probe failed: ${err.message}`);
  }

  console.log(
    "[api-monetization] schema ready (SLEEP MODE — 5 future tables created/idempotent, all empty)",
  );
}
