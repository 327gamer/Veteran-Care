
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  TrendingUp,
  MapPin,
  MousePointer,
  AlertTriangle,
  DollarSign,
  ChevronLeft,
  Layers,
  Users,
  Flag,
  Sparkles,
  ExternalLink,
  Link2,
  MousePointerClick,
  Wallet,
  Clock,
  CheckCircle,
  Banknote,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface NavigatorStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: { category: string; count: number }[];
  byState: { state: string; count: number }[];
}

interface AnalyticsData {
  totalClicks: number;
  totalResources: number;
  pendingResources: number;
  reportedResources: number;
  affiliateClicks: number;
  nonAffiliateClicks: number;
  byClickType: Record<string, number>;
  byCategory: { category: string; clicks: number }[];
  byState: { state: string; clicks: number }[];
  byCity: { city: string; clicks: number }[];
  topResources: { id: string; title: string; clicks: number; category: string; sponsored: boolean }[];
  reports: { id: string; title: string; state: string; city: string; notes: string }[];
  navigatorStats?: NavigatorStats;
}

interface DashboardSummary {
  ambassadors: { active_ambassadors: number; total_ambassadors: number };
  links: { total_links: number; active_links: number; total_clicks: number; zero_click_links: number };
  commissions: { total_commissions: number; pending_commissions: number; approved_commissions: number; paid_commissions: number; total_commission_records: number; pending_count: number; approved_count: number };
  payouts: { total_paid_out: number; pending_payouts: number; total_payouts: number };
  sessions: { total_sessions: number; unique_sessions: number; attributed_sessions: number };
  revenue: { total_revenue: number; total_conversions: number };
}

const CLICK_TYPE_LABELS: Record<string, string> = {
  website_click: "Website",
  call_click: "Phone Call",
  directions_click: "Directions",
  apply_click: "Apply / Get Help",
  save_click: "Save",
  share_click: "Share",
  guide_click: "AI Guide",
  report_click: "Report",
};

function getAdminHeaders(): Record<string, string> {
  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (adminKey) h["x-admin-key"] = adminKey;
  return h;
}

function fmtCurrency(val: number | string): string {
  const n = typeof val === "string" ? parseFloat(val) : val;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0);
}

function fmtNum(val: number | string): string {
  const n = typeof val === "string" ? parseInt(val as string, 10) : val;
  return (n || 0).toLocaleString();
}

export default function AdminAnalytics() {
  const [, setLocation] = useLocation();
  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;
  const headers = getAdminHeaders();

  const { data, isLoading, isError } = useQuery<AnalyticsData>({
    queryKey: ["/api/admin/analytics", adminKey],
    queryFn: () =>
      fetch("/api/admin/analytics", { headers }).then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      }),
    enabled: !!adminKey,
    refetchInterval: 30000,
    retry: false,
  });

  const { data: summary } = useQuery<DashboardSummary>({
    queryKey: ["/api/admin/dashboard-summary", adminKey],
    queryFn: () =>
      fetch("/api/admin/dashboard-summary", { headers }).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      }),
    enabled: !!adminKey,
    refetchInterval: 30000,
    retry: false,
  });

  if (!adminKey || isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">{isError ? "Session expired or invalid. Please re-authenticate." : "Admin access required. Please log in via the admin panel first."}</p>
            <Button className="mt-4" onClick={() => setLocation("/admin")} data-testid="button-go-admin">Go to Admin</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  const affiliatePercentage = data.totalClicks > 0
    ? Math.round((data.affiliateClicks / data.totalClicks) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
              onClick={() => setLocation("/admin")}
              data-testid="button-back-admin"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <BarChart3 className="h-5 w-5" />
            <span className="font-heading font-bold">Analytics Dashboard</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
              onClick={() => setLocation("/admin/ai-insights")}
              data-testid="button-ai-insights"
            >
              <Sparkles className="h-4 w-4 mr-1" /> AI Insights
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <MousePointer className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold" data-testid="stat-total-clicks">{data.totalClicks.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Clicks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Layers className="h-5 w-5 mx-auto mb-1 text-green-600" />
              <p className="text-2xl font-bold" data-testid="stat-total-resources">{data.totalResources.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Approved Resources</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-bold" data-testid="stat-pending">{data.pendingResources}</p>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Flag className="h-5 w-5 mx-auto mb-1 text-red-500" />
              <p className="text-2xl font-bold" data-testid="stat-reported">{data.reportedResources}</p>
              <p className="text-xs text-muted-foreground">Reported</p>
            </CardContent>
          </Card>
        </div>

        {summary && (
          <>
            <Separator />
            <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Ambassador Program
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-blue-100 bg-blue-50/30">
                <CardContent className="p-4 text-center">
                  <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-700" data-testid="stat-active-ambassadors">{fmtNum(summary.ambassadors.active_ambassadors)}</p>
                  <p className="text-xs text-muted-foreground">Active Ambassadors</p>
                  {Number(summary.ambassadors.total_ambassadors) > Number(summary.ambassadors.active_ambassadors) && (
                    <p className="text-[10px] text-muted-foreground">{fmtNum(summary.ambassadors.total_ambassadors)} total</p>
                  )}
                </CardContent>
              </Card>
              <Card className="border-indigo-100 bg-indigo-50/30">
                <CardContent className="p-4 text-center">
                  <Link2 className="h-5 w-5 mx-auto mb-1 text-indigo-600" />
                  <p className="text-2xl font-bold text-indigo-700" data-testid="stat-active-links">{fmtNum(summary.links.active_links)}</p>
                  <p className="text-xs text-muted-foreground">Active Links</p>
                  <p className="text-[10px] text-muted-foreground">{fmtNum(summary.links.total_links)} total</p>
                </CardContent>
              </Card>
              <Card className="border-cyan-100 bg-cyan-50/30">
                <CardContent className="p-4 text-center">
                  <MousePointerClick className="h-5 w-5 mx-auto mb-1 text-cyan-600" />
                  <p className="text-2xl font-bold text-cyan-700" data-testid="stat-link-clicks">{fmtNum(summary.links.total_clicks)}</p>
                  <p className="text-xs text-muted-foreground">Link Clicks</p>
                  <p className="text-[10px] text-muted-foreground">{fmtNum(summary.sessions.unique_sessions)} unique sessions</p>
                </CardContent>
              </Card>
              <Card className="border-green-100 bg-green-50/30">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  <p className="text-2xl font-bold text-green-700" data-testid="stat-total-revenue">{fmtCurrency(summary.revenue.total_revenue)}</p>
                  <p className="text-xs text-muted-foreground">Attributed Revenue</p>
                  <p className="text-[10px] text-muted-foreground">{fmtNum(summary.revenue.total_conversions)} conversions</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                  <p className="text-2xl font-bold text-amber-600" data-testid="stat-pending-commissions">{fmtCurrency(summary.commissions.pending_commissions)}</p>
                  <p className="text-xs text-muted-foreground">Pending Commissions</p>
                  <p className="text-[10px] text-muted-foreground">{fmtNum(summary.commissions.pending_count)} records</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-600" data-testid="stat-approved-commissions">{fmtCurrency(summary.commissions.approved_commissions)}</p>
                  <p className="text-xs text-muted-foreground">Approved Commissions</p>
                  <p className="text-[10px] text-muted-foreground">{fmtNum(summary.commissions.approved_count)} records</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Banknote className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="text-2xl font-bold text-green-600" data-testid="stat-paid-commissions">{fmtCurrency(summary.commissions.paid_commissions)}</p>
                  <p className="text-xs text-muted-foreground">Paid Out</p>
                  <p className="text-[10px] text-muted-foreground">{fmtNum(summary.payouts.total_payouts)} payouts</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Wallet className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                  <p className="text-2xl font-bold text-purple-600" data-testid="stat-total-commissions">{fmtCurrency(summary.commissions.total_commissions)}</p>
                  <p className="text-xs text-muted-foreground">Total Commissions</p>
                  <p className="text-[10px] text-muted-foreground">{fmtNum(summary.commissions.total_commission_records)} records</p>
                </CardContent>
              </Card>
            </div>

            {Number(summary.links.zero_click_links) > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800" data-testid="alert-zero-click-links">
                      {fmtNum(summary.links.zero_click_links)} active link{Number(summary.links.zero_click_links) !== 1 ? "s" : ""} with zero clicks
                    </p>
                    <p className="text-xs text-amber-600">These links have been generated but never used. Review in the Ambassadors panel.</p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setLocation("/admin/ambassadors")} data-testid="button-view-ambassadors">
                    View
                  </Button>
                </CardContent>
              </Card>
            )}

            {Number(summary.commissions.pending_count) > 0 && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800" data-testid="alert-pending-commissions">
                      {fmtNum(summary.commissions.pending_count)} commission{Number(summary.commissions.pending_count) !== 1 ? "s" : ""} awaiting approval ({fmtCurrency(summary.commissions.pending_commissions)})
                    </p>
                    <p className="text-xs text-blue-600">Review and approve pending commissions to proceed with payouts.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Separator />
        <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
          <MousePointer className="h-5 w-5 text-primary" />
          Resource Engagement
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Affiliate vs Non-Affiliate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Affiliate Clicks</span>
                <span className="font-bold text-green-600" data-testid="stat-affiliate-clicks">{data.affiliateClicks}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${affiliatePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span>Non-Affiliate Clicks</span>
                <span className="font-bold" data-testid="stat-nonaffiliate-clicks">{data.nonAffiliateClicks}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {affiliatePercentage}% of clicks go to affiliate resources
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                Clicks by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(data.byClickType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const pct = data.totalClicks > 0 ? Math.round((count / data.totalClicks) * 100) : 0;
                    return (
                      <div key={type} className="flex items-center gap-2" data-testid={`clicktype-${type}`}>
                        <span className="text-xs w-24 truncate">{CLICK_TYPE_LABELS[type] || type}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-mono w-10 text-right">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Clicks by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.byCategory.map((item) => {
                  const pct = data.totalClicks > 0 ? Math.round((item.clicks / data.totalClicks) * 100) : 0;
                  return (
                    <div key={item.category} className="flex items-center gap-2" data-testid={`category-stat-${item.category}`}>
                      <span className="text-xs w-32 truncate">{item.category}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-mono w-10 text-right">{item.clicks}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Clicks by State
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.byState.slice(0, 15).map((item) => (
                  <div key={item.state} className="flex items-center justify-between text-sm" data-testid={`state-stat-${item.state}`}>
                    <span className="text-xs">{item.state}</span>
                    <Badge variant="outline" className="text-xs font-mono">{item.clicks}</Badge>
                  </div>
                ))}
                {data.byState.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No state data yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Top Cities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.byCity.slice(0, 15).map((item) => (
                  <div key={item.city} className="flex items-center justify-between text-sm" data-testid={`city-stat-${item.city}`}>
                    <span className="text-xs">{item.city}</span>
                    <Badge variant="outline" className="text-xs font-mono">{item.clicks}</Badge>
                  </div>
                ))}
                {data.byCity.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No city data yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-2">
                  {data.topResources.map((item, idx) => (
                    <div key={item.id} className="flex items-start gap-2 py-1" data-testid={`top-resource-${idx}`}>
                      <span className="text-xs font-mono text-muted-foreground w-5 shrink-0 pt-0.5">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground">{item.category}</span>
                          {item.sponsored && (
                            <Badge className="text-[9px] h-4 bg-amber-100 text-amber-700 border-amber-200">
                              <Sparkles className="h-2.5 w-2.5 mr-0.5" /> Sponsored
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs font-mono shrink-0">{item.clicks}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {data.navigatorStats && data.navigatorStats.total > 0 && (
          <>
            <Separator />
            <h2 className="text-lg font-heading font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Navigator Requests
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold" data-testid="stat-nav-total">{data.navigatorStats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Requests</p>
                </CardContent>
              </Card>
              {Object.entries(data.navigatorStats.byStatus)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => {
                  const colors: Record<string, string> = {
                    new: "text-blue-600",
                    contacted: "text-amber-600",
                    completed: "text-green-600",
                    cancelled: "text-muted-foreground",
                  };
                  return (
                    <Card key={status}>
                      <CardContent className="p-4 text-center">
                        <p className={`text-2xl font-bold ${colors[status] || ""}`} data-testid={`stat-nav-${status}`}>{count}</p>
                        <p className="text-xs text-muted-foreground capitalize">{status}</p>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.navigatorStats.byCategory.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Requests by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.navigatorStats.byCategory.map((item) => {
                        const pct = data.navigatorStats!.total > 0
                          ? Math.round((item.count / data.navigatorStats!.total) * 100)
                          : 0;
                        return (
                          <div key={item.category} className="flex items-center gap-2" data-testid={`nav-cat-${item.category}`}>
                            <span className="text-xs w-36 truncate">{item.category}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-mono w-8 text-right">{item.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {data.navigatorStats.byState.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Requests by State
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.navigatorStats.byState.slice(0, 10).map((item) => (
                        <div key={item.state} className="flex items-center justify-between text-sm" data-testid={`nav-state-${item.state}`}>
                          <span className="text-xs">{item.state}</span>
                          <Badge variant="outline" className="text-xs font-mono">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {data.reports.length > 0 && (
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-red-600">
                <Flag className="h-4 w-4" />
                Reported Resources ({data.reports.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.reports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-3 bg-red-50/50" data-testid={`report-${report.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{report.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {[report.city, report.state].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs shrink-0"
                        onClick={() => setLocation("/admin")}
                        data-testid={`review-report-${report.id}`}
                      >
                        Review
                      </Button>
                    </div>
                    <p className="text-xs text-red-600 mt-1 whitespace-pre-line">{report.notes}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
