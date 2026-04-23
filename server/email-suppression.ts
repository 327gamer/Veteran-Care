import { supabaseAdmin } from "./supabase";
import type { EmailCategory } from "./email-template";
import { query as pgQuery } from "./pg-client";

const TABLE = "email_suppressions";

let tableReady = false;

export async function ensureSuppressionTable(): Promise<void> {
  if (tableReady) return;
  try {
    await pgQuery(`
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text NOT NULL,
        unsubscribed_all boolean NOT NULL DEFAULT false,
        suppressed_categories text[] NOT NULL DEFAULT '{}',
        source text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (email)
      );
    `);
    await pgQuery(`ALTER TABLE ${TABLE} ENABLE ROW LEVEL SECURITY;`).catch(() => {});
    await pgQuery(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = '${TABLE}' AND policyname = 'service_role_all'
        ) THEN
          CREATE POLICY service_role_all ON ${TABLE}
            FOR ALL TO service_role USING (true) WITH CHECK (true);
        END IF;
      END $$;
    `).catch(() => {});
    tableReady = true;
    console.log("[email-suppression] table ready");
  } catch (err: any) {
    console.warn("[email-suppression] table init failed:", err?.message);
  }
}

export async function isSuppressed(email: string, category: EmailCategory): Promise<boolean> {
  if (!email) return false;
  // Transactional always sends — required for legal/compliance (password resets,
  // unsubscribe confirmations, payment receipts).
  if (category === "transactional") return false;
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("unsubscribed_all, suppressed_categories")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();
    if (error) return false;
    if (!data) return false;
    if (data.unsubscribed_all) return true;
    return Array.isArray(data.suppressed_categories) && data.suppressed_categories.includes(category);
  } catch {
    return false;
  }
}

export async function getSuppression(email: string): Promise<{
  unsubscribed_all: boolean;
  suppressed_categories: string[];
} | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("unsubscribed_all, suppressed_categories")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();
    if (error || !data) return null;
    return {
      unsubscribed_all: !!data.unsubscribed_all,
      suppressed_categories: Array.isArray(data.suppressed_categories) ? data.suppressed_categories : [],
    };
  } catch {
    return null;
  }
}

export async function unsubscribeAll(email: string, source = "user_link"): Promise<boolean> {
  try {
    const e = email.toLowerCase().trim();
    await supabaseAdmin
      .from(TABLE)
      .upsert(
        {
          email: e,
          unsubscribed_all: true,
          source,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      );
    return true;
  } catch (err: any) {
    console.error("[email-suppression] unsubscribeAll failed:", err?.message);
    return false;
  }
}

export async function setPreferences(
  email: string,
  suppressedCategories: EmailCategory[],
  unsubscribedAll: boolean,
  source = "user_prefs",
): Promise<boolean> {
  try {
    const e = email.toLowerCase().trim();
    await supabaseAdmin
      .from(TABLE)
      .upsert(
        {
          email: e,
          unsubscribed_all: unsubscribedAll,
          suppressed_categories: suppressedCategories,
          source,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      );
    return true;
  } catch (err: any) {
    console.error("[email-suppression] setPreferences failed:", err?.message);
    return false;
  }
}
