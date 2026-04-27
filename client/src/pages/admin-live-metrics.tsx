import { AdminAuthGuard, getAdminHeaders, useAdminKey } from "@/components/admin-auth-guard";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  ChevronLeft,
  Flag,
  Database,
  Building2,
  Layers,
  Rocket,
  TrendingUp,
  Users,
  Eye,
  MousePointerClick,
  Bot,
  ClipboardList,
  Handshake,
  UserPlus,
  Activity,
  RefreshCw,
  Lock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Percent,
  Map as MapIcon,
  ListOrdered,
  MailCheck,
  CreditCard,
  Wallet,
  Receipt,
  Ban,
  Clock,
  UserMinus,
  Target,
  ShieldCheck,
} from "lucide-react";
import {
  METRIC_REGISTRY,
  SECTION_META,
  getMetricsBySection,
  type MetricDef,
  type MetricSection,
} from "@/lib/metric-registry";

// ─── Wire data ─────────────────────────────────────────────────────────
interface PublicStatsResponse {
  totalResources: number;
  totalCities: number;
  totalStates: number;
  totalCategories: number;
  liveStates: string[];
  liveStateNames: { code: string; name: string }[];
  nextStateLaunching: string;
  coverageRegion: string;
  growthStatus: string;
  isEstimated?: boolean;
  lastUpdated: string;
}

interface TractionStatsResponse {
  visits_today: number;
  visits_7d: number;
  visits_30d: number;
  page_views_30d: number;
  resource_clicks_30d: number;
  trusted_partner_clicks_30d: number;
  ai_sessions_30d: number;
  leads_30d: number;
  leads_total: number;
  trusted_partners_active: number;
  businesses_listed: number;
  states_live: number;
  cities_covered: number;
  sources: Record<string, { enabled: boolean; note?: string }>;
  generated_at: string;
}

function fmt(n: number | undefined | null): string {
  if (n === undefined || n === null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US");
}

// Map registry icon name → lucide component
const ICONS: Record<MetricDef["icon"], any> = {
  users: Users,
  eye: Eye,
  mouseClick: MousePointerClick,
  handshake: Handshake,
  bot: Bot,
  clipboard: ClipboardList,
  building: Building2,
  userPlus: UserPlus,
  flag: Flag,
  database: Database,
  layers: Layers,
  rocket: Rocket,
  trendingUp: TrendingUp,
  dollar: DollarSign,
  shoppingCart: ShoppingCart,
  percent: Percent,
  map: MapIcon,
  listOrdered: ListOrdered,
  mailCheck: MailCheck,
  activity: Activity,
  wallet: Wallet,
  creditCard: CreditCard,
  receipt: Receipt,
  ban: Ban,
  alertTriangle: AlertTriangle,
  clock: Clock,
  userMinus: UserMinus,
  target: Target,
};

// ─── Tile rendering rules per founder spec ─────────────────────────────
//   Source state "live"        + value > 0 → fmt(value), green Live pill
//   Source state "live"        + value 0   → "0 / Pending", amber pill
//   Source state "wired_zero"               → "0 / Pending", amber pill
//   Source state "not_wired"                → "Tracking not active yet", off pill
//   Reference values (coverage strings)     → display as-is, blue Reference pill

type TileRenderStatus = "live" | "pending" | "off" | "fixed";

interface TileRender {
  display: string;
  status: TileRenderStatus;
}

function renderForMetric(
  m: MetricDef,
  pub: PublicStatsResponse | undefined,
  tr: TractionStatsResponse | undefined,
): TileRender & { hint?: string } {
  // Public Coverage tiles read from /api/public-stats — these are
  // "Reference" values (always present, not engagement-counts).
  if (m.section === "coverage") {
    if (!pub) return { display: "—", status: "off" };
    switch (m.key) {
      case "states_live":
        return { display: fmt(pub.totalStates), status: "fixed" };
      case "verified_resources":
        return { display: `${fmt(pub.totalResources)}+`, status: "fixed" };
      case "cities_covered":
        return { display: `${fmt(pub.totalCities)}+`, status: "fixed" };
      case "support_categories":
        return { display: fmt(pub.totalCategories), status: "fixed" };
      case "launching_next":
        return { display: pub.nextStateLaunching || "—", status: "fixed" };
      case "growth_status":
        return { display: pub.growthStatus || "—", status: "fixed" };
    }
  }

  // Public Growth tiles read from /api/admin/traction-stats.
  if (m.section === "growth") {
    if (!tr) return { display: "—", status: "off" };
    if (m.source.state === "not_wired") {
      return { display: "Tracking not active yet", status: "off" };
    }
    let value = 0;
    let hint: string | undefined;
    switch (m.key) {
      case "visits_30d":
        value = tr.visits_30d;
        hint = `Today: ${fmt(tr.visits_today)} • 7d: ${fmt(tr.visits_7d)}`;
        break;
      case "page_views_30d":
        value = tr.page_views_30d;
        break;
      case "resource_clicks_30d":
        value = tr.resource_clicks_30d;
        break;
      case "trusted_partner_clicks_30d":
        value = tr.trusted_partner_clicks_30d;
        break;
      case "ai_sessions_30d":
        value = tr.ai_sessions_30d;
        break;
      case "leads_total":
        value = tr.leads_total;
        hint = `Last 30d: ${fmt(tr.leads_30d)}`;
        break;
      case "businesses_listed":
        value = tr.businesses_listed;
        hint = `Active paid: ${fmt(tr.trusted_partners_active)}`;
        break;
    }
    if (m.source.state === "wired_zero" || !value || value <= 0) {
      return { display: "0 / Pending", status: "pending", hint };
    }
    return { display: fmt(value), status: "live", hint };
  }

  // Private Partner — only Active Paid Partners has a real value today.
  if (m.section === "partner") {
    if (m.key === "trusted_partners_active" && tr) {
      const v = tr.trusted_partners_active;
      if (v > 0) return { display: fmt(v), status: "live" };
      return { display: "0 / Pending", status: "pending" };
    }
  }

  // Default for not-wired Layer 2 placeholders.
  return { display: "Tracking not active yet", status: "off" };
}

// ─── Visual atoms ──────────────────────────────────────────────────────
function StatusPill({ status }: { status: TileRenderStatus }) {
  if (status === "live")
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200" data-testid="pill-status-live">
        <CheckCircle2 className="h-3 w-3 mr-1" /> Live
      </Badge>
    );
  if (status === "pending")
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200" data-testid="pill-status-pending">
        <AlertCircle className="h-3 w-3 mr-1" /> Pending
      </Badge>
    );
  if (status === "off")
    return (
      <Badge className="bg-slate-100 text-slate-700 border-slate-200" data-testid="pill-status-off">
        Tracking off
      </Badge>
    );
  return (
    <Badge className="bg-blue-100 text-blue-800 border-blue-200" data-testid="pill-status-fixed">
      Reference
    </Badge>
  );
}

function MetricTile({ m, pub, tr }: { m: MetricDef; pub?: PublicStatsResponse; tr?: TractionStatsResponse }) {
  const Icon = ICONS[m.icon];
  const r = renderForMetric(m, pub, tr);
  const isPublic = m.tier === "public";
  return (
    <div
      className={[
        "rounded-xl border shadow-sm p-4 sm:p-5 flex flex-col gap-2 border-l-4",
        isPublic
          ? "bg-white border-border border-l-emerald-500"
          : "bg-slate-50 border-slate-200 border-l-slate-500",
      ].join(" ")}
      data-testid={`tile-${m.key}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={[
            "h-9 w-9 rounded-md flex items-center justify-center",
            isPublic ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700",
          ].join(" ")}
        >
          <Icon className="h-4 w-4" />
        </div>
        <StatusPill status={r.status} />
      </div>
      <p
        className={[
          "font-heading text-xl sm:text-2xl font-extrabold leading-tight tracking-tight",
          isPublic ? "text-primary" : "text-slate-700",
        ].join(" ")}
      >
        {r.display}
      </p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground leading-snug">
        {m.label}
      </p>
      {r.hint ? (
        <p className="text-[11px] text-muted-foreground/80 italic">{r.hint}</p>
      ) : m.source.note ? (
        <p className="text-[11px] text-muted-foreground/80 italic">{m.source.note}</p>
      ) : null}
    </div>
  );
}

function SectionCard({
  section,
  pub,
  tr,
  children,
}: {
  section: MetricSection;
  pub?: PublicStatsResponse;
  tr?: TractionStatsResponse;
  children?: React.ReactNode;
}) {
  const meta = SECTION_META[section];
  const isPublic = meta.tier === "public";
  const metrics = getMetricsBySection(section);
  return (
    <Card
      className={[
        "mb-6 border-l-4",
        isPublic ? "border-l-emerald-500" : "border-l-slate-500 bg-slate-50/40",
      ].join(" ")}
      data-testid={`card-section-${section}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className={[
                "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm",
                isPublic
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-200 text-slate-700",
              ].join(" ")}
            >
              {meta.index}
            </div>
            <div>
              <CardTitle
                className={[
                  "text-lg sm:text-xl flex items-center gap-2",
                  isPublic ? "text-primary" : "text-slate-700",
                ].join(" ")}
              >
                {isPublic ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Lock className="h-5 w-5 text-slate-500" />
                )}
                {meta.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPublic
                  ? "Layer 1 — safe to publish (Homepage / About / partner / investor)"
                  : "Layer 2 — admin-only. Never publish without founder approval."}
              </p>
            </div>
          </div>
          {isPublic ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px]" data-testid={`pill-tier-public-${section}`}>
              <ShieldCheck className="h-3 w-3 mr-1" /> Public-safe
            </Badge>
          ) : (
            <Badge className="bg-slate-200 text-slate-800 border-slate-300 text-[11px]" data-testid={`pill-tier-private-${section}`}>
              <Lock className="h-3 w-3 mr-1" /> Private-internal
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
          {metrics.map((m) => (
            <MetricTile key={m.key} m={m} pub={pub} tr={tr} />
          ))}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────
function AdminLiveMetricsInner() {
  const [, setLocation] = useLocation();
  const { adminKey } = useAdminKey();
  const headers = getAdminHeaders();

  const publicQ = useQuery<PublicStatsResponse>({
    queryKey: ["/api/public-stats"],
    queryFn: () =>
      fetch("/api/public-stats").then((r) => {
        if (!r.ok) throw new Error("public-stats failed");
        return r.json();
      }),
    refetchInterval: 60_000,
    retry: false,
  });

  const tractionQ = useQuery<TractionStatsResponse>({
    queryKey: ["/api/admin/traction-stats", adminKey],
    queryFn: () =>
      fetch("/api/admin/traction-stats", { headers }).then((r) => {
        if (!r.ok) throw new Error("traction-stats failed");
        return r.json();
      }),
    enabled: !!adminKey,
    refetchInterval: 60_000,
    retry: false,
  });

  const pub = publicQ.data;
  const tr = tractionQ.data;

  const refreshAll = () => {
    publicQ.refetch();
    tractionQ.refetch();
  };

  const publicCount = METRIC_REGISTRY.filter((m) => m.tier === "public").length;
  const privateCount = METRIC_REGISTRY.filter((m) => m.tier === "private").length;
  const liveCount = METRIC_REGISTRY.filter((m) => m.source.state === "live").length;
  const wiredZeroCount = METRIC_REGISTRY.filter((m) => m.source.state === "wired_zero").length;
  const notWiredCount = METRIC_REGISTRY.filter((m) => m.source.state === "not_wired").length;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-2 sm:px-3"
            onClick={() => setLocation("/admin")}
            data-testid="button-back-admin"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to admin
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={refreshAll}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Admin only — not public
            </p>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary" data-testid="heading-live-metrics">
            Live Metrics — Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Public-safe metrics in green, private internal metrics locked
            in slate. The classification per metric lives in
            <code className="text-[11px] bg-muted px-1 rounded mx-1">client/src/lib/metric-registry.ts</code>
            so a future <code className="text-[11px] bg-muted px-1 rounded">/api/public-metrics</code>
            endpoint can filter by tier with no risk of leaking Layer 2.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <Badge variant="outline" className="bg-white">
              {publicCount} public-safe metrics
            </Badge>
            <Badge variant="outline" className="bg-white">
              {privateCount} private-internal metrics
            </Badge>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
              {liveCount} live
            </Badge>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
              {wiredZeroCount} wired (zero)
            </Badge>
            <Badge className="bg-slate-100 text-slate-700 border-slate-200">
              {notWiredCount} not wired
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Auto-refreshes every 60 seconds.
          </p>
        </div>

        {/* Loading shell */}
        {(publicQ.isLoading && !pub) || (tractionQ.isLoading && !tr) ? (
          <p className="text-sm text-muted-foreground" data-testid="text-page-loading">
            Loading metrics…
          </p>
        ) : null}

        {/* ─── 1. Public Coverage ─── */}
        <SectionCard section="coverage" pub={pub} tr={tr}>
          {pub ? (
            <div className="mt-5" data-testid="block-active-states">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                Active state list ({pub.liveStateNames.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {pub.liveStateNames.map((s) => (
                  <Badge
                    key={s.code}
                    variant="secondary"
                    className="text-xs"
                    data-testid={`chip-state-${s.code.toLowerCase()}`}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                    {s.name} ({s.code})
                  </Badge>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3">
                Coverage region: {pub.coverageRegion} • Last updated:{" "}
                {new Date(pub.lastUpdated).toLocaleString()}
              </p>
            </div>
          ) : null}
        </SectionCard>

        {/* ─── 2. Public Growth ─── */}
        <SectionCard section="growth" pub={pub} tr={tr}>
          {tr ? (
            <div
              className="mt-5 bg-white/70 rounded-md p-3 border border-border"
              data-testid="block-source-status"
            >
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                Tracking source status
              </p>
              <ul className="text-xs space-y-1">
                {Object.entries(tr.sources).map(([name, info]) => (
                  <li
                    key={name}
                    className="flex items-center gap-2"
                    data-testid={`row-source-${name}`}
                  >
                    {info.enabled ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    )}
                    <code className="text-[11px] bg-muted px-1 rounded">{name}</code>
                    <span className="text-muted-foreground">
                      {info.enabled
                        ? "live"
                        : info.note
                          ? `not active — ${info.note}`
                          : "tracking not active yet"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-muted-foreground mt-3">
                Last refreshed: {new Date(tr.generated_at).toLocaleString()}
              </p>
            </div>
          ) : null}
        </SectionCard>

        {/* ─── 3. Private Revenue ─── */}
        <SectionCard section="revenue" pub={pub} tr={tr} />

        {/* ─── 4. Private Partner ─── */}
        <SectionCard section="partner" pub={pub} tr={tr} />

        {/* ─── 5. Private Operations ─── */}
        <SectionCard section="operations" pub={pub} tr={tr} />

        {/* Future-public push instructions */}
        <Card className="border-dashed" data-testid="card-future-push">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              When you're ready to push public metrics live
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-xs text-muted-foreground list-decimal pl-5 space-y-1.5">
              <li>
                Add a public passthrough endpoint{" "}
                <code className="bg-muted px-1 rounded">
                  GET /api/public-metrics
                </code>{" "}
                that calls{" "}
                <code className="bg-muted px-1 rounded">getTractionStats()</code>{" "}
                and filters its response to only the keys whose registry entry
                has <code className="bg-muted px-1 rounded">tier === "public"</code>.
                No admin gate.
              </li>
              <li>
                In{" "}
                <code className="bg-muted px-1 rounded">
                  client/src/components/traction-metrics.tsx
                </code>
                , switch the fetch URL to the new public endpoint.
              </li>
              <li>
                Mount{" "}
                <code className="bg-muted px-1 rounded">{"<TractionMetrics />"}</code>{" "}
                under{" "}
                <code className="bg-muted px-1 rounded">{"<LiveMetrics />"}</code>{" "}
                on Homepage and About.
              </li>
              <li>
                Layer 2 (revenue / partner / operations) is structurally
                impossible to leak through this path because the public
                endpoint reads only Layer 1 entries from the registry.
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminLiveMetrics() {
  return (
    <AdminAuthGuard>
      <AdminLiveMetricsInner />
    </AdminAuthGuard>
  );
}
