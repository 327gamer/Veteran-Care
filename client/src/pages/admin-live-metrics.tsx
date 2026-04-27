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
} from "lucide-react";

// ─── Public coverage stats (same data as Homepage/About) ───────────────
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

// ─── Private traction stats (admin-only) ───────────────────────────────
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

// Render rules per founder spec:
// - source disabled (table missing / error) → "Tracking not active yet"
// - source enabled, value 0                  → "0 / Pending"
// - source enabled, value > 0                → fmt(value)
// - never fabricate
function renderTraction(value: number, sourceEnabled: boolean): {
  display: string;
  status: "live" | "pending" | "off";
} {
  if (!sourceEnabled) return { display: "Tracking not active yet", status: "off" };
  if (!value || value <= 0) return { display: "0 / Pending", status: "pending" };
  return { display: fmt(value), status: "live" };
}

function StatusPill({ status }: { status: "live" | "pending" | "off" | "fixed" }) {
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

function MetricTile({
  icon: Icon,
  label,
  value,
  status,
  testId,
  hint,
}: {
  icon: any;
  label: string;
  value: string;
  status: "live" | "pending" | "off" | "fixed";
  testId: string;
  hint?: string;
}) {
  return (
    <div
      className="bg-white rounded-xl border border-border shadow-sm p-4 sm:p-5 flex flex-col gap-2"
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
        <StatusPill status={status} />
      </div>
      <p className="font-heading text-xl sm:text-2xl font-extrabold text-primary leading-tight tracking-tight">
        {value}
      </p>
      <p className="text-xs uppercase tracking-wide text-muted-foreground leading-snug">
        {label}
      </p>
      {hint ? <p className="text-[11px] text-muted-foreground/80 italic">{hint}</p> : null}
    </div>
  );
}

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

  type TractionTile = {
    icon: any;
    label: string;
    display: string;
    status: "live" | "pending" | "off" | "fixed";
    testId: string;
    hint?: string;
  };
  const tractionTiles: TractionTile[] = (() => {
    if (!tr) return [];
    return [
      {
        icon: Users,
        label: "Visits (30d)",
        ...renderTraction(tr.visits_30d, tr.sources.page_views?.enabled ?? false),
        testId: "tile-traction-visits",
        hint: tr.sources.page_views?.enabled
          ? `Today: ${fmt(tr.visits_today)} • 7d: ${fmt(tr.visits_7d)}`
          : tr.sources.page_views?.note,
      },
      {
        icon: Eye,
        label: "Pages viewed (30d)",
        ...renderTraction(tr.page_views_30d, tr.sources.page_views?.enabled ?? false),
        testId: "tile-traction-pageviews",
      },
      {
        icon: MousePointerClick,
        label: "Resource clicks (30d)",
        ...renderTraction(tr.resource_clicks_30d, tr.sources.resource_clicks?.enabled ?? false),
        testId: "tile-traction-resource-clicks",
      },
      {
        icon: Handshake,
        label: "Trusted partner clicks (30d)",
        ...renderTraction(tr.trusted_partner_clicks_30d, tr.sources.resource_clicks?.enabled ?? false),
        testId: "tile-traction-partner-clicks",
      },
      {
        icon: Bot,
        label: "AI Navigator sessions (30d)",
        ...renderTraction(tr.ai_sessions_30d, tr.sources.ai_usage_log?.enabled ?? false),
        testId: "tile-traction-ai-sessions",
      },
      {
        icon: ClipboardList,
        label: "Leads submitted (total)",
        ...renderTraction(tr.leads_total, tr.sources.lead_events?.enabled ?? false),
        testId: "tile-traction-leads",
        hint: tr.sources.lead_events?.enabled ? `Last 30d: ${fmt(tr.leads_30d)}` : undefined,
      },
      {
        icon: Building2,
        label: "Businesses listed",
        ...renderTraction(tr.businesses_listed, tr.sources.partner_organizations?.enabled ?? false),
        testId: "tile-traction-businesses",
        hint: tr.sources.partner_organizations?.enabled
          ? `Active paid partners: ${fmt(tr.trusted_partners_active)}`
          : undefined,
      },
      {
        icon: Activity,
        label: "Partner activity (active paid partners)",
        ...renderTraction(tr.trusted_partners_active, tr.sources.partner_organizations?.enabled ?? false),
        testId: "tile-traction-partner-activity",
      },
      // Founder requested but not yet wired into traction-stats endpoint:
      {
        icon: UserPlus,
        label: "Accounts created",
        display: "Tracking not active yet",
        status: "off" as const,
        testId: "tile-traction-accounts",
        hint: "users table exists; counter not yet exposed by /api/admin/traction-stats",
      },
    ];
  })();

  const refreshAll = () => {
    publicQ.refetch();
    tractionQ.refetch();
  };

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
            Live Metrics
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Real platform activity in one place. Use this to decide when to
            activate public traction numbers on the Homepage and About page,
            and to feed future investor / sponsor reports.
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">
            Public coverage refreshes every 60s • Traction refreshes every 60s
          </p>
        </div>

        {/* ─── PART 1 — Public Coverage Metrics ─── */}
        <Card className="mb-6" data-testid="card-public-coverage">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Flag className="h-5 w-5 text-primary" />
                  Public coverage
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Same numbers Homepage and About already show. Source:{" "}
                  <code className="text-[11px] bg-muted px-1 rounded">/api/public-stats</code>
                </p>
              </div>
              <Badge variant="outline" className="text-[11px]">
                Live publicly
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {publicQ.isLoading || !pub ? (
              <p className="text-sm text-muted-foreground" data-testid="text-public-loading">
                Loading public stats…
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-5">
                  <MetricTile
                    icon={Flag}
                    label="States Live"
                    value={fmt(pub.totalStates)}
                    status="fixed"
                    testId="tile-public-states"
                  />
                  <MetricTile
                    icon={Database}
                    label="Verified Resources"
                    value={`${fmt(pub.totalResources)}+`}
                    status="fixed"
                    testId="tile-public-resources"
                  />
                  <MetricTile
                    icon={Building2}
                    label="Cities Covered"
                    value={`${fmt(pub.totalCities)}+`}
                    status="fixed"
                    testId="tile-public-cities"
                  />
                  <MetricTile
                    icon={Layers}
                    label="Support Categories"
                    value={fmt(pub.totalCategories)}
                    status="fixed"
                    testId="tile-public-categories"
                  />
                  <MetricTile
                    icon={Rocket}
                    label="Launching Next"
                    value={pub.nextStateLaunching || "—"}
                    status="fixed"
                    testId="tile-public-next"
                  />
                  <MetricTile
                    icon={TrendingUp}
                    label="Growth Status"
                    value={pub.growthStatus || "—"}
                    status="fixed"
                    testId="tile-public-growth"
                  />
                </div>

                <div data-testid="block-active-states">
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
                        <CheckCircle2 className="h-3 w-3 mr-1 text-primary" />
                        {s.name} ({s.code})
                      </Badge>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3">
                    Coverage region: {pub.coverageRegion} • Last updated:{" "}
                    {new Date(pub.lastUpdated).toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ─── PART 2 — Private Traction Metrics ─── */}
        <Card data-testid="card-private-traction">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Private traction (hidden from public)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Real engagement signals. Decide here when to flip them
                  public. Source:{" "}
                  <code className="text-[11px] bg-muted px-1 rounded">
                    /api/admin/traction-stats
                  </code>
                </p>
              </div>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[11px]">
                Hidden — admin only
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {tractionQ.isLoading || !tr ? (
              <p className="text-sm text-muted-foreground" data-testid="text-traction-loading">
                Loading traction stats…
              </p>
            ) : tractionQ.isError ? (
              <p className="text-sm text-destructive" data-testid="text-traction-error">
                Failed to load traction stats. Check admin key and try Refresh.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 mb-5">
                  {tractionTiles.map((t, i) => (
                    <MetricTile
                      key={i}
                      icon={t.icon}
                      label={t.label}
                      value={t.display}
                      status={t.status}
                      testId={t.testId}
                      hint={t.hint}
                    />
                  ))}
                </div>

                <div className="bg-muted/30 rounded-md p-3" data-testid="block-source-status">
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
                        <code className="text-[11px] bg-background border border-border rounded px-1">
                          {name}
                        </code>
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

                <div className="mt-5 p-3 border border-dashed border-border rounded-md bg-background">
                  <p className="text-xs font-semibold text-foreground mb-1">
                    When you're ready to expose these publicly:
                  </p>
                  <ol className="text-[11px] text-muted-foreground list-decimal pl-4 space-y-1">
                    <li>
                      Add a public passthrough endpoint{" "}
                      <code className="bg-muted px-1 rounded">/api/public-traction-stats</code>{" "}
                      that calls{" "}
                      <code className="bg-muted px-1 rounded">getTractionStats()</code>{" "}
                      with no admin gate.
                    </li>
                    <li>
                      In{" "}
                      <code className="bg-muted px-1 rounded">
                        client/src/components/traction-metrics.tsx
                      </code>
                      , switch the fetch URL to the public one.
                    </li>
                    <li>
                      Mount{" "}
                      <code className="bg-muted px-1 rounded">{"<TractionMetrics />"}</code>{" "}
                      under{" "}
                      <code className="bg-muted px-1 rounded">{"<LiveMetrics />"}</code>{" "}
                      on Homepage and About.
                    </li>
                  </ol>
                </div>
              </>
            )}
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
