import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  ChevronLeft,
  MessageCircle,
  HandHelping,
  Users2,
  Banknote,
  MapPin,
  MousePointerClick,
  Sparkles,
  Activity,
  AlertCircle,
  Eye,
  Smartphone,
  Clock,
  Compass,
} from "lucide-react";

interface ExecSummary {
  generated_at: string;
  windows: { today_start: string; since_7d: string; since_30d: string };
  metrics: {
    ai_chats: {
      today: number;
      last_7d: number;
      last_30d: number;
      navigator_suggested_30d: number;
      guest_share_30d: number;
    };
    top_ai_categories_30d: { category: string; count: number }[];
    help_requests: {
      today: number;
      last_7d: number;
      last_30d: number;
      total: number;
      by_status: Record<string, number>;
    };
    partner_leads: {
      last_7d: number;
      last_30d: number;
      total_routed: number;
      converted: number;
      conversion_rate_pct: number;
    };
    top_clicked_categories_30d: { category: string; clicks: number }[];
    top_sc_cities_30d: { city: string; clicks: number; help_requests: number; total: number }[];
    revenue: {
      billable_total: number;
      billed_total: number;
      billed_last_30d: number;
      billed_amount_usd_total: number;
      billed_amount_usd_30d: number;
      active_paid_partners: number;
    };
    paid_partners: { name: string; state: string }[];
    traffic?: {
      enabled: boolean;
      visitors_today: number;
      visitors_7d: number;
      visitors_30d: number;
      page_views_30d: number;
      mobile_share_pct_30d: number;
      utm_attributed_views_30d: number;
      ambassador_attributed_views_30d: number;
      top_landing_paths_7d: { path: string; views: number }[];
    };
    stuck?: {
      over_24h: number;
      over_72h: number;
    };
  };
  unmeasured: { metric: string; reason: string }[];
}

function getAdminHeaders(): Record<string, string> {
  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (adminKey) h["x-admin-key"] = adminKey;
  return h;
}

function fmtNum(n: number | undefined): string {
  return (n ?? 0).toLocaleString();
}
function fmtUsd(n: number | undefined): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n ?? 0);
}
function prettyCategory(slug: string): string {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function timeAgo(iso: string): string {
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  return `${Math.round(sec / 3600)}h ago`;
}

function KpiTile({ icon, label, value, sub, testId }: { icon: React.ReactNode; label: string; value: string; sub?: string; testId: string }) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        <div className="text-2xl font-bold" data-testid={`${testId}-value`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function ListBlock({
  title, icon, items, leftKey, rightKey, rightSuffix, emptyMsg, testId,
}: {
  title: string;
  icon: React.ReactNode;
  items: any[];
  leftKey: string;
  rightKey: string;
  rightSuffix?: string;
  emptyMsg: string;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!items || items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMsg}</p>
        ) : (
          <ul className="divide-y">
            {items.map((it, idx) => (
              <li key={idx} className="flex items-center justify-between py-2" data-testid={`${testId}-row-${idx}`}>
                <span className="text-sm">{leftKey === "category" ? prettyCategory(it[leftKey]) : it[leftKey]}</span>
                <Badge variant="secondary">{fmtNum(it[rightKey])}{rightSuffix || ""}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AdminExecutiveInner() {
  const [, setLocation] = useLocation();
  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;

  const { data, isLoading, isError, refetch, isFetching } = useQuery<ExecSummary>({
    queryKey: ["/api/admin/exec-summary", adminKey],
    queryFn: async () => {
      const r = await fetch("/api/admin/exec-summary", { headers: getAdminHeaders() });
      if (!r.ok) throw new Error("Unauthorized or failed");
      return r.json();
    },
    enabled: !!adminKey,
    refetchInterval: 60000,
    retry: false,
  });

  if (isLoading) return <div className="p-6">Loading…</div>;
  if (isError || !data) return <div className="p-6 text-red-600">Failed to load executive summary.</div>;

  const m = data.metrics;
  const helpStatusEntries = Object.entries(m.help_requests.by_status).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-background border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-3" onClick={() => setLocation("/admin")} data-testid="button-back-admin">
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
            <h1 className="text-base sm:text-lg font-semibold truncate">Executive Summary</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
            <span className="hidden sm:inline" data-testid="text-generated-at">Updated {timeAgo(data.generated_at)}</span>
            <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => refetch()} disabled={isFetching} data-testid="button-refresh">
              {isFetching ? "…" : "Refresh"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        {/* Top KPI row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiTile
            icon={<MessageCircle className="h-4 w-4" />}
            label="AI Chats — Today"
            value={fmtNum(m.ai_chats.today)}
            sub={`${fmtNum(m.ai_chats.last_7d)} past 7d · ${fmtNum(m.ai_chats.last_30d)} past 30d`}
            testId="kpi-ai-chats"
          />
          <KpiTile
            icon={<HandHelping className="h-4 w-4" />}
            label="Help Requests — Today"
            value={fmtNum(m.help_requests.today)}
            sub={`${fmtNum(m.help_requests.last_7d)} past 7d · ${fmtNum(m.help_requests.total)} all-time`}
            testId="kpi-help-requests"
          />
          <KpiTile
            icon={<Users2 className="h-4 w-4" />}
            label="Partner Leads (30d)"
            value={fmtNum(m.partner_leads.last_30d)}
            sub={`${fmtNum(m.partner_leads.converted)} converted · ${m.partner_leads.conversion_rate_pct}% lifetime`}
            testId="kpi-partner-leads"
          />
          <KpiTile
            icon={<Banknote className="h-4 w-4" />}
            label="Billed Revenue (30d)"
            value={fmtUsd(m.revenue.billed_amount_usd_30d)}
            sub={`${fmtUsd(m.revenue.billed_amount_usd_total)} all-time · ${fmtNum(m.revenue.billed_total)} events`}
            testId="kpi-revenue"
          />
        </section>

        {/* Visitor / Traffic KPI row */}
        {m.traffic && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiTile
              icon={<Eye className="h-4 w-4" />}
              label="Visitors — Today"
              value={m.traffic.enabled ? fmtNum(m.traffic.visitors_today) : "—"}
              sub={m.traffic.enabled
                ? `${fmtNum(m.traffic.visitors_7d)} past 7d · ${fmtNum(m.traffic.visitors_30d)} past 30d`
                : "Beacon table not yet created"}
              testId="kpi-visitors"
            />
            <KpiTile
              icon={<Smartphone className="h-4 w-4" />}
              label="Mobile Share (30d)"
              value={m.traffic.enabled ? `${m.traffic.mobile_share_pct_30d}%` : "—"}
              sub={m.traffic.enabled
                ? `${fmtNum(m.traffic.page_views_30d)} page views`
                : "Pending beacon data"}
              testId="kpi-mobile-share"
            />
            <KpiTile
              icon={<Compass className="h-4 w-4" />}
              label="UTM-Tagged Views (30d)"
              value={m.traffic.enabled ? fmtNum(m.traffic.utm_attributed_views_30d) : "—"}
              sub={m.traffic.enabled
                ? `${fmtNum(m.traffic.ambassador_attributed_views_30d)} ambassador-attributed`
                : "Pending beacon data"}
              testId="kpi-utm-views"
            />
            <KpiTile
              icon={<Clock className="h-4 w-4" />}
              label="Stuck Leads"
              value={m.stuck ? fmtNum(m.stuck.over_24h) : "—"}
              sub={m.stuck
                ? `${fmtNum(m.stuck.over_72h)} aged > 72h · open & in_progress`
                : ""}
              testId="kpi-stuck-leads"
            />
          </section>
        )}

        {/* Top Landing Paths */}
        {m.traffic?.enabled && m.traffic.top_landing_paths_7d.length > 0 && (
          <section>
            <Card data-testid="card-top-landing-paths">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Top Landing Paths (7d)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="divide-y">
                  {m.traffic.top_landing_paths_7d.map((p, idx) => (
                    <li key={p.path} className="flex items-center justify-between py-2" data-testid={`row-landing-path-${idx}`}>
                      <span className="text-sm font-mono truncate mr-3" title={p.path}>{p.path}</span>
                      <Badge variant="secondary">{fmtNum(p.views)} views</Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Two-column lists */}
        <section className="grid md:grid-cols-2 gap-4">
          <ListBlock
            title="Top AI Categories (30d)"
            icon={<Sparkles className="h-4 w-4" />}
            items={m.top_ai_categories_30d}
            leftKey="category"
            rightKey="count"
            emptyMsg="No AI activity yet."
            testId="card-top-ai-categories"
          />
          <ListBlock
            title="Top Clicked Categories (30d)"
            icon={<MousePointerClick className="h-4 w-4" />}
            items={m.top_clicked_categories_30d}
            leftKey="category"
            rightKey="clicks"
            emptyMsg="No clicks captured yet."
            testId="card-top-clicked-categories"
          />
          <ListBlock
            title="Top SC Cities (30d)"
            icon={<MapPin className="h-4 w-4" />}
            items={m.top_sc_cities_30d}
            leftKey="city"
            rightKey="total"
            rightSuffix=" signals"
            emptyMsg="No SC location signals yet."
            testId="card-top-sc-cities"
          />
          <Card data-testid="card-help-funnel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" /> Help Request Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {helpStatusEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No help requests yet.</p>
              ) : (
                <ul className="divide-y">
                  {helpStatusEntries.map(([status, count], idx) => (
                    <li key={status} className="flex items-center justify-between py-2" data-testid={`row-help-status-${idx}`}>
                      <span className="text-sm capitalize">{status.replace(/_/g, " ")}</span>
                      <Badge variant="secondary">{fmtNum(count)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Paid partners + AI engagement detail */}
        <section className="grid md:grid-cols-2 gap-4">
          <Card data-testid="card-paid-partners">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users2 className="h-4 w-4" /> Active Paid Partners ({m.revenue.active_paid_partners})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {m.paid_partners.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active paid partners yet.</p>
              ) : (
                <ul className="divide-y">
                  {m.paid_partners.map((p, idx) => (
                    <li key={idx} className="flex items-center justify-between py-2" data-testid={`row-paid-partner-${idx}`}>
                      <span className="text-sm">{p.name}</span>
                      <Badge variant="outline">{p.state}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-ai-engagement">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> AI Engagement (30d)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chats with Navigator hook</span>
                <Badge variant="secondary" data-testid="badge-nav-suggested">{fmtNum(m.ai_chats.navigator_suggested_30d)} / {fmtNum(m.ai_chats.last_30d)}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guest share</span>
                <Badge variant="secondary" data-testid="badge-guest-share">{m.ai_chats.guest_share_30d}%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billable help requests</span>
                <Badge variant="secondary" data-testid="badge-billable">{fmtNum(m.revenue.billable_total)}</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Honest gaps */}
        {data.unmeasured?.length > 0 && (
          <Card className="border-amber-300 bg-amber-50/40" data-testid="card-instrumentation-pending">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-amber-900">
                <AlertCircle className="h-4 w-4" /> Instrumentation Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-amber-900 mb-2">
                These metrics are intentionally not shown — no data source exists yet. Add tracking before relying on numbers here.
              </p>
              <ul className="space-y-1 text-sm text-amber-900">
                {data.unmeasured.map((u, idx) => (
                  <li key={idx} data-testid={`row-unmeasured-${idx}`}>
                    <strong className="capitalize">{u.metric.replace(/_/g, " ")}:</strong> {u.reason}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default function AdminExecutive() {
  return (
    <AdminAuthGuard>
      <AdminExecutiveInner />
    </AdminAuthGuard>
  );
}
