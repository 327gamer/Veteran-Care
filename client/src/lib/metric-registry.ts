/**
 * METRIC REGISTRY — single source of truth for the Live Metrics dashboard.
 *
 * Founder spec (LOCKED):
 *  - Layer 1 (tier="public") = safe to publish on Homepage / About /
 *    sales / investor decks once explicitly pushed. Visual: GREEN.
 *  - Layer 2 (tier="private") = admin-only forever unless founder
 *    explicitly opts a single metric in. Visual: LOCKED / DARK.
 *
 *  The registry is the ONLY place the tier and section of a metric is
 *  declared. The page reads from it. A future /api/public-metrics
 *  endpoint will filter from it (tier === "public" only). Adding a new
 *  metric anywhere in the codebase MUST start with adding it here.
 *
 *  No DB changes. No schema changes. Pure code constant.
 */

export type MetricTier = "public" | "private";

export type MetricSection =
  | "coverage"
  | "growth"
  | "revenue"
  | "partner"
  | "operations";

export interface MetricDef {
  /** Stable machine key. Used in API responses, test ids, and lookups. */
  key: string;
  /** Human label rendered on the tile. */
  label: string;
  /** Layer 1 (public-safe) or Layer 2 (private-internal). */
  tier: MetricTier;
  /** Which page section the tile belongs to. */
  section: MetricSection;
  /** Lucide icon name (resolved on the page side). */
  icon:
    | "users"
    | "eye"
    | "mouseClick"
    | "handshake"
    | "bot"
    | "clipboard"
    | "building"
    | "userPlus"
    | "flag"
    | "database"
    | "layers"
    | "rocket"
    | "trendingUp"
    | "dollar"
    | "shoppingCart"
    | "percent"
    | "map"
    | "listOrdered"
    | "mailCheck"
    | "activity"
    | "wallet"
    | "creditCard"
    | "receipt"
    | "ban"
    | "alertTriangle"
    | "clock"
    | "userMinus"
    | "target";
  /**
   * Underlying data source. Used to render "Tracking off" pills and to
   * tell the founder what to wire when they want a placeholder to go
   * live.
   */
  source: {
    /** Backend table or system the metric reads from. */
    table: string;
    /** Whether the source is currently producing data into the page. */
    state: "live" | "wired_zero" | "not_wired";
    /** What's needed to flip a placeholder live. */
    note?: string;
  };
  /** Inline hint shown under the tile value. */
  hint?: string;
}

// ─── LAYER 1 — PUBLIC SAFE ─────────────────────────────────────────
//
// Section 1: Public Coverage  (read from /api/public-stats today)
// Section 2: Public Growth    (read from /api/admin/traction-stats today;
//                              future /api/public-metrics will expose them)

const PUBLIC_COVERAGE: MetricDef[] = [
  {
    key: "states_live",
    label: "States Live",
    tier: "public",
    section: "coverage",
    icon: "flag",
    source: { table: "/api/public-stats", state: "live" },
  },
  {
    key: "verified_resources",
    label: "Verified Resources",
    tier: "public",
    section: "coverage",
    icon: "database",
    source: { table: "/api/public-stats", state: "live" },
  },
  {
    key: "cities_covered",
    label: "Cities Covered",
    tier: "public",
    section: "coverage",
    icon: "building",
    source: { table: "/api/public-stats", state: "live" },
  },
  {
    key: "support_categories",
    label: "Support Categories",
    tier: "public",
    section: "coverage",
    icon: "layers",
    source: { table: "/api/public-stats", state: "live" },
  },
  {
    key: "launching_next",
    label: "Launching Next",
    tier: "public",
    section: "coverage",
    icon: "rocket",
    source: { table: "/api/public-stats", state: "live" },
  },
  {
    key: "growth_status",
    label: "Growth Status",
    tier: "public",
    section: "coverage",
    icon: "trendingUp",
    source: { table: "/api/public-stats", state: "live" },
  },
];

const PUBLIC_GROWTH: MetricDef[] = [
  {
    key: "visits_30d",
    label: "Monthly Visits",
    tier: "public",
    section: "growth",
    icon: "users",
    source: { table: "page_views", state: "live" },
  },
  {
    key: "page_views_30d",
    label: "Page Views (30d)",
    tier: "public",
    section: "growth",
    icon: "eye",
    source: { table: "page_views", state: "live" },
  },
  {
    key: "resource_clicks_30d",
    label: "Resource Clicks (30d)",
    tier: "public",
    section: "growth",
    icon: "mouseClick",
    source: { table: "resource_clicks", state: "live" },
  },
  {
    key: "trusted_partner_clicks_30d",
    label: "Trusted Partner Clicks (30d)",
    tier: "public",
    section: "growth",
    icon: "handshake",
    source: { table: "resource_clicks", state: "wired_zero" },
  },
  {
    key: "ai_sessions_30d",
    label: "AI Navigator Sessions (30d)",
    tier: "public",
    section: "growth",
    icon: "bot",
    source: { table: "ai_usage_log", state: "live" },
  },
  {
    key: "leads_total",
    label: "Leads Submitted (total)",
    tier: "public",
    section: "growth",
    icon: "clipboard",
    source: { table: "lead_events", state: "wired_zero" },
  },
  {
    key: "businesses_listed",
    label: "Businesses Listed",
    tier: "public",
    section: "growth",
    icon: "building",
    source: { table: "partner_organizations", state: "live" },
  },
  {
    key: "accounts_created",
    label: "Accounts Created",
    tier: "public",
    section: "growth",
    icon: "userPlus",
    source: {
      table: "users",
      state: "not_wired",
      note: "table exists; aggregate not yet exposed by getTractionStats()",
    },
  },
];

// ─── LAYER 2 — PRIVATE INTERNAL ────────────────────────────────────
//
// Section 3: Revenue
// Section 4: Partner
// Section 5: Operations

const PRIVATE_REVENUE: MetricDef[] = [
  {
    key: "revenue_mtd",
    label: "Revenue MTD",
    tier: "private",
    section: "revenue",
    icon: "dollar",
    source: {
      table: "stripe / billing",
      state: "not_wired",
      note: "wire from Stripe webhook + lead_billing once monetization is live",
    },
  },
  {
    key: "stripe_revenue",
    label: "Stripe Revenue (MTD)",
    tier: "private",
    section: "revenue",
    icon: "creditCard",
    source: {
      table: "stripe",
      state: "not_wired",
      note: "Stripe API + cached rollup",
    },
  },
  {
    key: "subscription_revenue",
    label: "Subscription Revenue (MTD)",
    tier: "private",
    section: "revenue",
    icon: "wallet",
    source: {
      table: "subscriptions",
      state: "not_wired",
      note: "future subscriptions table",
    },
  },
  {
    key: "lead_revenue",
    label: "Lead Revenue (MTD)",
    tier: "private",
    section: "revenue",
    icon: "shoppingCart",
    source: {
      table: "lead_billing",
      state: "not_wired",
      note: "table exists (sleep mode); flip when paid leads start",
    },
  },
  {
    key: "revenue_by_state",
    label: "Revenue by State",
    tier: "private",
    section: "revenue",
    icon: "map",
    source: { table: "lead_billing × users.state", state: "not_wired" },
  },
  {
    key: "revenue_by_category",
    label: "Revenue by Category",
    tier: "private",
    section: "revenue",
    icon: "listOrdered",
    source: { table: "lead_billing × resource_categories", state: "not_wired" },
  },
];

const PRIVATE_PARTNER: MetricDef[] = [
  {
    key: "trusted_partners_active",
    label: "Active Paid Partners",
    tier: "private",
    section: "partner",
    icon: "handshake",
    source: { table: "partner_organizations", state: "live" },
  },
  {
    key: "partner_churn_30d",
    label: "Partner Churn (30d)",
    tier: "private",
    section: "partner",
    icon: "userMinus",
    source: {
      table: "partner_organizations history",
      state: "not_wired",
      note: "needs status_changed_at tracking",
    },
  },
  {
    key: "partner_response_time",
    label: "Avg Partner Response Time",
    tier: "private",
    section: "partner",
    icon: "clock",
    source: {
      table: "lead_events (assigned_at → response_at)",
      state: "not_wired",
      note: "columns exist; aggregate not wired",
    },
  },
  {
    key: "close_ratio",
    label: "Close Ratio",
    tier: "private",
    section: "partner",
    icon: "target",
    source: {
      table: "lead_events.response_status",
      state: "not_wired",
      note: "needs partner outcome tracking",
    },
  },
  {
    key: "leads_sold",
    label: "Leads Sold (30d)",
    tier: "private",
    section: "partner",
    icon: "shoppingCart",
    source: {
      table: "lead_billing",
      state: "not_wired",
      note: "table exists; flip when paid leads start",
    },
  },
];

const PRIVATE_OPERATIONS: MetricDef[] = [
  {
    key: "unanswered_leads",
    label: "Unanswered Leads",
    tier: "private",
    section: "operations",
    icon: "alertTriangle",
    source: {
      table: "lead_events.email_sent + response_status",
      state: "not_wired",
      note: "columns exist; threshold logic not wired",
    },
  },
  {
    key: "refunds_30d",
    label: "Refunds (30d)",
    tier: "private",
    section: "operations",
    icon: "receipt",
    source: { table: "stripe refunds", state: "not_wired" },
  },
  {
    key: "failed_payments_30d",
    label: "Failed Payments (30d)",
    tier: "private",
    section: "operations",
    icon: "ban",
    source: { table: "stripe webhooks", state: "not_wired" },
  },
  {
    key: "cancelled_subs_30d",
    label: "Cancelled Subscriptions (30d)",
    tier: "private",
    section: "operations",
    icon: "userMinus",
    source: { table: "subscriptions", state: "not_wired" },
  },
];

export const METRIC_REGISTRY: MetricDef[] = [
  ...PUBLIC_COVERAGE,
  ...PUBLIC_GROWTH,
  ...PRIVATE_REVENUE,
  ...PRIVATE_PARTNER,
  ...PRIVATE_OPERATIONS,
];

export function getMetricsBySection(section: MetricSection): MetricDef[] {
  return METRIC_REGISTRY.filter((m) => m.section === section);
}

export function getPublicMetrics(): MetricDef[] {
  return METRIC_REGISTRY.filter((m) => m.tier === "public");
}

export function getPrivateMetrics(): MetricDef[] {
  return METRIC_REGISTRY.filter((m) => m.tier === "private");
}

export const SECTION_META: Record<
  MetricSection,
  { title: string; tier: MetricTier; index: number }
> = {
  coverage: { title: "Public Coverage Metrics", tier: "public", index: 1 },
  growth: { title: "Public Growth Metrics", tier: "public", index: 2 },
  revenue: { title: "Private Revenue Metrics", tier: "private", index: 3 },
  partner: { title: "Private Partner Metrics", tier: "private", index: 4 },
  operations: { title: "Private Operations Metrics", tier: "private", index: 5 },
};
