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
  ChevronDown,
  ChevronRight,
  BarChart3,
  Filter as FilterIcon,
} from "lucide-react";
import { useState as useReactState, useMemo } from "react";
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

interface StateIntelCategory {
  slug: string;
  name: string;
  count: number;
  pct: number;
  health: "STRONG" | "MODERATE" | "WEAK";
}
interface StateIntelState {
  code: string;
  name: string;
  totalResources: number;
  totalCities: number;
  lastUpdated: string | null;
  categories: StateIntelCategory[];
  weakCount: number;
  moderateCount: number;
  strongCount: number;
  weakestCategoryCount: number;
  recommendation: string;
}
interface StateIntelResponse {
  totalStates: number;
  avgResourcesPerState: number;
  totalWeakCategoriesPlatform: number;
  strongestState: { code: string; name: string; total: number } | null;
  weakestState: { code: string; name: string; total: number } | null;
  totalCategoriesTracked: number;
  states: StateIntelState[];
  generatedAt: string;
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

// ─── State Intelligence Dashboard ──────────────────────────────────────
//
// Read-only analytics block that reveals per-state coverage quality and
// per-category health (STRONG / MODERATE / WEAK) so the founder can
// instantly see where to run Wave 8 next. Powered by
// /api/admin/state-intelligence (cached 60s, requires admin headers).
// No DB writes, no schema or ingestion changes.
//
// Health rule:    STRONG ≥ 40, MODERATE 20–39, WEAK < 20
// Recommendation: total < 300       → "Run Full Expansion (Waves 1–7)"
//                 any cat < 20      → "Run Wave 8 (Categorical Depth Fill)"
//                 otherwise         → "State Complete (Monitor Only)"

type StateSortKey = "total" | "weakest" | "updated";

function HealthChip({ health }: { health: "STRONG" | "MODERATE" | "WEAK" }) {
  if (health === "STRONG")
    return (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]" data-testid="chip-health-strong">
        STRONG
      </Badge>
    );
  if (health === "MODERATE")
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]" data-testid="chip-health-moderate">
        MODERATE
      </Badge>
    );
  return (
    <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px]" data-testid="chip-health-weak">
      WEAK
    </Badge>
  );
}

function RecommendationBanner({ rec }: { rec: string }) {
  let cls = "bg-emerald-50 text-emerald-900 border-emerald-200";
  let Icon = CheckCircle2;
  if (rec.startsWith("Run Wave 8")) {
    cls = "bg-amber-50 text-amber-900 border-amber-200";
    Icon = AlertTriangle;
  } else if (rec.startsWith("Run Full Expansion")) {
    cls = "bg-red-50 text-red-900 border-red-200";
    Icon = AlertCircle;
  }
  return (
    <div
      className={`mt-3 rounded-md border px-3 py-2 text-xs font-medium flex items-center gap-2 ${cls}`}
      data-testid="banner-recommendation"
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="uppercase tracking-wide text-[10px] opacity-80">Recommended Next Action:</span>
      <span>{rec}</span>
    </div>
  );
}

function StateRow({
  s,
  onlyWeakCats,
}: {
  s: StateIntelState;
  onlyWeakCats: boolean;
}) {
  const [open, setOpen] = useReactState(false);
  const cats = onlyWeakCats ? s.categories.filter(c => c.health === "WEAK") : s.categories;
  const lastUp = s.lastUpdated ? new Date(s.lastUpdated).toLocaleString() : "—";
  return (
    <div
      className="rounded-lg border border-border bg-white"
      data-testid={`state-row-${s.code.toLowerCase()}`}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={`panel-state-${s.code.toLowerCase()}`}
        className="w-full flex items-center justify-between gap-2 px-3 sm:px-4 py-3 text-left hover:bg-muted/30 transition-colors rounded-lg"
        data-testid={`button-toggle-state-${s.code.toLowerCase()}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <span className="font-semibold text-sm sm:text-base truncate">
            {s.name} <span className="text-muted-foreground">({s.code})</span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[11px]" data-testid={`badge-total-${s.code.toLowerCase()}`}>
            {fmt(s.totalResources)} resources
          </Badge>
          <Badge variant="outline" className="text-[11px] hidden sm:inline-flex">
            {fmt(s.totalCities)} cities
          </Badge>
          {s.weakCount > 0 ? (
            <Badge className="bg-red-100 text-red-800 border-red-200 text-[11px]" data-testid={`badge-weakcount-${s.code.toLowerCase()}`}>
              {s.weakCount} weak
            </Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px]">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Healthy
            </Badge>
          )}
        </div>
      </button>
      {open ? (
        <div className="px-3 sm:px-4 pb-4 border-t border-border" data-testid={`panel-state-${s.code.toLowerCase()}`}>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-md bg-muted/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Resources</p>
              <p className="font-bold text-base text-primary" data-testid={`stat-total-${s.code.toLowerCase()}`}>
                {fmt(s.totalResources)}
              </p>
            </div>
            <div className="rounded-md bg-muted/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Cities Covered</p>
              <p className="font-bold text-base text-primary" data-testid={`stat-cities-${s.code.toLowerCase()}`}>
                {fmt(s.totalCities)}
              </p>
            </div>
            <div className="rounded-md bg-muted/40 px-3 py-2 col-span-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Last Updated</p>
              <p className="font-medium text-xs text-foreground" data-testid={`stat-lastupdated-${s.code.toLowerCase()}`}>
                {lastUp}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                Category breakdown ({cats.length} of {s.categories.length})
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> {s.strongCount} strong
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> {s.moderateCount} moderate
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> {s.weakCount} weak
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {cats.map(c => (
                <div
                  key={c.slug}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border border-border bg-white text-xs"
                  data-testid={`row-category-${s.code.toLowerCase()}-${c.slug}`}
                >
                  <span className="truncate" title={c.name}>
                    {c.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {fmt(c.count)} ({c.pct}%)
                    </span>
                    <HealthChip health={c.health} />
                  </div>
                </div>
              ))}
              {cats.length === 0 ? (
                <p className="text-xs text-muted-foreground italic col-span-2">
                  No weak categories — this state is healthy.
                </p>
              ) : null}
            </div>
          </div>

          <RecommendationBanner rec={s.recommendation} />
        </div>
      ) : null}
    </div>
  );
}

function StateIntelligenceDashboard({
  data,
  isLoading,
  isError,
}: {
  data: StateIntelResponse | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  const [sortKey, setSortKey] = useReactState<StateSortKey>("total");
  const [onlyWeakCats, setOnlyWeakCats] = useReactState(false);
  const [onlyWeakStates, setOnlyWeakStates] = useReactState(false);

  const visibleStates = useMemo(() => {
    if (!data) return [];
    let s = [...data.states];
    if (onlyWeakStates) s = s.filter(x => x.weakCount > 0);
    if (sortKey === "total") {
      s.sort((a, b) => b.totalResources - a.totalResources);
    } else if (sortKey === "weakest") {
      s.sort((a, b) => a.weakestCategoryCount - b.weakestCategoryCount);
    } else if (sortKey === "updated") {
      s.sort((a, b) => {
        const at = a.lastUpdated || "";
        const bt = b.lastUpdated || "";
        return bt.localeCompare(at);
      });
    }
    return s;
  }, [data, sortKey, onlyWeakStates]);

  return (
    <Card
      className="mb-6 border-l-4 border-l-emerald-500"
      data-testid="card-section-state-intelligence"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm bg-emerald-100 text-emerald-700">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-primary" data-testid="heading-state-intelligence">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                State Intelligence Dashboard
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Read-only coverage quality per state. Identifies weak categories and recommends the next wave to run.
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px]">
            <Lock className="h-3 w-3 mr-1" /> Admin-only analytics
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className="text-sm text-red-700" data-testid="text-state-intel-error">
            State intelligence temporarily unavailable.
          </p>
        ) : null}
        {isLoading && !data ? (
          <p className="text-sm text-muted-foreground" data-testid="text-state-intel-loading">
            Loading state intelligence…
          </p>
        ) : null}

        {data ? (
          <>
            {/* ── Global Summary Strip ── */}
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4"
              data-testid="block-state-intel-summary"
            >
              <div className="rounded-lg border border-border bg-white px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total States</p>
                <p className="font-bold text-lg text-primary" data-testid="stat-summary-totalstates">
                  {fmt(data.totalStates)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-white px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Avg Resources / State</p>
                <p className="font-bold text-lg text-primary" data-testid="stat-summary-avgresources">
                  {fmt(data.avgResourcesPerState)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-white px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Weak Categories (Platform)</p>
                <p className="font-bold text-lg text-red-700" data-testid="stat-summary-weakplatform">
                  {fmt(data.totalWeakCategoriesPlatform)}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-emerald-700">Strongest State</p>
                <p className="font-bold text-sm text-emerald-900 leading-tight" data-testid="stat-summary-strongest">
                  {data.strongestState
                    ? `${data.strongestState.name} (${fmt(data.strongestState.total)})`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-amber-800">Weakest State</p>
                <p className="font-bold text-sm text-amber-900 leading-tight" data-testid="stat-summary-weakest">
                  {data.weakestState
                    ? `${data.weakestState.name} (${fmt(data.weakestState.total)})`
                    : "—"}
                </p>
              </div>
            </div>

            {/* ── Sort + Filter controls ── */}
            <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-border" data-testid="block-state-intel-filters">
              <div className="flex items-center gap-1.5">
                <FilterIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Sort:</span>
              </div>
              {([
                { key: "total" as StateSortKey, label: "Total Resources" },
                { key: "weakest" as StateSortKey, label: "Weakest Category" },
                { key: "updated" as StateSortKey, label: "Last Updated" },
              ]).map(opt => (
                <Button
                  key={opt.key}
                  variant={sortKey === opt.key ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => setSortKey(opt.key)}
                  data-testid={`button-sort-${opt.key}`}
                >
                  {opt.label}
                </Button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant={onlyWeakCats ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => setOnlyWeakCats(v => !v)}
                  data-testid="button-toggle-onlyweakcats"
                >
                  {onlyWeakCats ? "✓ " : ""}Only weak categories
                </Button>
                <Button
                  variant={onlyWeakStates ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => setOnlyWeakStates(v => !v)}
                  data-testid="button-toggle-onlyweakstates"
                >
                  {onlyWeakStates ? "✓ " : ""}Only states with weak categories
                </Button>
              </div>
            </div>

            {/* ── State list ── */}
            <div className="space-y-2" data-testid="block-state-intel-list">
              {visibleStates.map(s => (
                <StateRow key={s.code} s={s} onlyWeakCats={onlyWeakCats} />
              ))}
              {visibleStates.length === 0 ? (
                <p className="text-sm text-muted-foreground italic" data-testid="text-no-states-match">
                  No states match the current filters.
                </p>
              ) : null}
            </div>

            <p className="text-[11px] text-muted-foreground mt-3" data-testid="text-state-intel-meta">
              Powered by <code className="bg-muted px-1 rounded">GET /api/admin/state-intelligence</code> •{" "}
              Cached 60s • {data.totalCategoriesTracked} categories tracked •{" "}
              Last refreshed: {new Date(data.generatedAt).toLocaleString()}
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
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

  const stateIntelQ = useQuery<StateIntelResponse>({
    queryKey: ["/api/admin/state-intelligence", adminKey],
    queryFn: () =>
      fetch("/api/admin/state-intelligence", { headers }).then((r) => {
        if (!r.ok) throw new Error("state-intelligence failed");
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
    stateIntelQ.refetch();
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

        {/* ─── State Intelligence Dashboard (read-only analytics) ─── */}
        <StateIntelligenceDashboard
          data={stateIntelQ.data}
          isLoading={stateIntelQ.isLoading}
          isError={stateIntelQ.isError}
        />

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
