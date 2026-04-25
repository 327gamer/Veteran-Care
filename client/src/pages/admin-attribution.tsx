import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  MousePointerClick,
  Eye,
  UserCheck,
  Users,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Link2,
  TrendingDown,
  Search,
  Megaphone,
  Radio,
  Clock,
  AlertTriangle,
  Home,
  Sparkles,
  DollarSign,
  CreditCard,
  PieChart,
} from "lucide-react";
import { useLocation } from "wouter";

interface TimingMetric {
  avg_seconds: number | null;
  min_seconds?: number | null;
  max_seconds?: number | null;
  sample_count: number;
  is_proxy: boolean;
  note: string;
}

interface AttributionData {
  summary: {
    total_clicks: number;
    total_sessions: number;
    unique_sessions: number;
    nav_requests: number;
    tsl_leads: number;
    total_leads: number;
  };
  funnel: {
    clicks: number;
    sessions: number;
    leads: number;
    click_to_session: string;
    session_to_lead: string;
    click_to_lead: string;
  };
  timing: {
    click_to_session: TimingMetric;
    session_to_lead: TimingMetric;
    click_to_lead: TimingMetric;
  };
  byAmbassador: {
    ambassador_code: string;
    ambassador_name: string;
    clicks: number;
    sessions: number;
    tsl_leads: number;
    nav_leads: number;
    total_leads: number;
    avg_session_to_lead_seconds: number | null;
  }[];
  byLink: {
    utm_id: string;
    link_name: string;
    ambassador_code: string;
    ambassador_name: string;
    utm_campaign: string;
    channel_type: string;
    clicks: number;
    sessions: number;
    leads: number;
  }[];
  speedBuckets: {
    buckets: {
      under_5m: number;
      m5_to_30m: number;
      m30_to_2h: number;
      over_2h: number;
    };
    total: number;
    is_proxy: boolean;
    note: string;
  };
  filterOptions: {
    ambassadors: string[] | null;
    campaigns: string[] | null;
  };
}

interface SourceMixData {
  sessions: {
    house_sessions: number;
    ambassador_sessions: number;
    unattributed_sessions: number;
    total_sessions: number;
  };
  partnerApps: {
    house_apps: number;
    ambassador_apps: number;
    unattributed_apps: number;
    total_apps: number;
  };
  stripe: {
    house_conversions: number;
    ambassador_conversions: number;
    unattributed_conversions: number;
    house_revenue: number;
    ambassador_revenue: number;
    unattributed_revenue: number;
    total_revenue: number;
  };
  byAmbassador: {
    ambassador_code: string;
    ambassador_name: string;
    house_sessions: number;
    share_sessions: number;
    house_apps: number;
    share_apps: number;
    house_conversions: number;
    share_conversions: number;
    house_revenue: number;
    share_revenue: number;
  }[];
  filterOptions: {
    ambassadors: { code: string; name: string }[];
  };
  appliedFilters: {
    date_from: string | null;
    date_to: string | null;
    source: string;
    ambassador: string | null;
  };
}

function formatMoney(n: number): string {
  if (!n || isNaN(n)) return "$0";
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function getAdminHeaders(): Record<string, string> {
  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (adminKey) h["x-admin-key"] = adminKey;
  return h;
}

function FunnelStep({ label, value, rate, color, isLast }: { label: string; value: number; rate?: string; color: string; isLast?: boolean }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className={`rounded-xl border-2 ${color} p-3 flex-1 text-center`}>
        <p className="text-2xl font-bold" data-testid={`funnel-${label.toLowerCase().replace(/\s+/g, '-')}`}>{value.toLocaleString()}</p>
        <p className="text-xs font-medium mt-0.5">{label}</p>
      </div>
      {!isLast && (
        <div className="flex flex-col items-center shrink-0">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
          {rate && (
            <span className="text-[10px] font-mono text-muted-foreground">{rate}%</span>
          )}
        </div>
      )}
    </div>
  );
}

function AdminAttributionInner() {
  const [, navigate] = useLocation();
  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;
  const headers = getAdminHeaders();

  const [showFilters, setShowFilters] = useState(false);
  const [filterAmbassador, setFilterAmbassador] = useState("");
  const [filterCampaign, setFilterCampaign] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeTab, setActiveTab] = useState<"ambassador" | "link">("ambassador");
  const [sortBy, setSortBy] = useState<string>("clicks");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sourceFilter, setSourceFilter] = useState<"all" | "house" | "ambassador">("all");

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (filterAmbassador) p.set("ambassador", filterAmbassador);
    if (filterCampaign) p.set("campaign", filterCampaign);
    if (filterDateFrom) p.set("date_from", filterDateFrom);
    if (filterDateTo) p.set("date_to", filterDateTo);
    return p.toString();
  }, [filterAmbassador, filterCampaign, filterDateFrom, filterDateTo]);

  const sourceMixQueryString = useMemo(() => {
    const p = new URLSearchParams();
    if (filterAmbassador) p.set("ambassador", filterAmbassador);
    if (filterDateFrom) p.set("date_from", filterDateFrom);
    if (filterDateTo) p.set("date_to", filterDateTo);
    if (sourceFilter !== "all") p.set("source", sourceFilter);
    return p.toString();
  }, [filterAmbassador, filterDateFrom, filterDateTo, sourceFilter]);

  const { data, isLoading } = useQuery<AttributionData>({
    queryKey: ["admin-attribution", queryString],
    queryFn: async () => {
      const url = `/api/admin/attribution${queryString ? `?${queryString}` : ""}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!adminKey,
  });

  const { data: mix, isLoading: mixLoading } = useQuery<SourceMixData>({
    queryKey: ["admin-source-mix", sourceMixQueryString],
    queryFn: async () => {
      const url = `/api/admin/source-mix${sourceMixQueryString ? `?${sourceMixQueryString}` : ""}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!adminKey,
  });

  const hasActiveFilters = !!(filterAmbassador || filterCampaign || filterDateFrom || filterDateTo);

  const clearFilters = () => {
    setFilterAmbassador("");
    setFilterCampaign("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  if (!adminKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Admin access required. Please log in via the admin panel first.</p>
            <Button className="mt-4" onClick={() => navigate("/admin")} data-testid="button-go-admin">Go to Admin</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sortedAmbassadors = useMemo(() => {
    let rows = data?.byAmbassador || [];
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      rows = rows.filter((a) =>
        a.ambassador_name?.toLowerCase().includes(q) ||
        a.ambassador_code?.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      const aVal = (a as any)[sortBy] || 0;
      const bVal = (b as any)[sortBy] || 0;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [data?.byAmbassador, searchInput, sortBy, sortDir]);

  const sortedLinks = useMemo(() => {
    let rows = data?.byLink || [];
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      rows = rows.filter((l) =>
        l.link_name?.toLowerCase().includes(q) ||
        l.utm_id?.toLowerCase().includes(q) ||
        l.ambassador_code?.toLowerCase().includes(q) ||
        (l.ambassador_name || "").toLowerCase().includes(q) ||
        (l.utm_campaign || "").toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      const aVal = (a as any)[sortBy] || 0;
      const bVal = (b as any)[sortBy] || 0;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [data?.byLink, searchInput, sortBy, sortDir]);

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: string }) => (
    sortBy === col ? (sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />) : null
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4 mr-1" /> Admin
            </Button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <TrendingDown className="h-5 w-5 rotate-180" /> Attribution & Funnel
            </h1>
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {hasActiveFilters && <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-[10px] rounded-full">{[filterAmbassador, filterCampaign, filterDateFrom, filterDateTo].filter(Boolean).length}</Badge>}
          </Button>
        </div>

        {showFilters && (
          <Card className="mb-4 border-blue-200" data-testid="card-filters">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Filters</p>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs" data-testid="button-clear-filters">
                    <X className="h-3 w-3 mr-1" /> Clear All
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Ambassador</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={filterAmbassador}
                    onChange={(e) => setFilterAmbassador(e.target.value)}
                    data-testid="filter-ambassador"
                  >
                    <option value="">All</option>
                    {(data?.filterOptions.ambassadors || []).map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Campaign</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={filterCampaign}
                    onChange={(e) => setFilterCampaign(e.target.value)}
                    data-testid="filter-campaign"
                  >
                    <option value="">All</option>
                    {(data?.filterOptions.campaigns || []).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">From Date</label>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    className="h-9"
                    data-testid="filter-date-from"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">To Date</label>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    className="h-9"
                    data-testid="filter-date-to"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* === HOUSE-DEFAULT vs AMBASSADOR SOURCE MIX === */}
        <Card className="mb-6 border-emerald-300" data-testid="card-source-mix">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="h-4 w-4 text-emerald-600" /> Source Mix — House (Organic) vs Ambassador
              <Badge variant="outline" className="text-[9px] font-normal text-slate-500 border-slate-300 ml-1">
                Reporting only · attribution unchanged
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Source filter pills */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={sourceFilter === "all" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSourceFilter("all")}
                data-testid="filter-source-all"
              >
                All Traffic
              </Button>
              <Button
                variant={sourceFilter === "house" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSourceFilter("house")}
                data-testid="filter-source-house"
              >
                <Home className="h-3 w-3 mr-1" /> House / Organic
              </Button>
              <Button
                variant={sourceFilter === "ambassador" ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setSourceFilter("ambassador")}
                data-testid="filter-source-ambassador"
              >
                <Sparkles className="h-3 w-3 mr-1" /> Ambassador Referrals
              </Button>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="button-source-filters-toggle"
              >
                <Filter className="h-3 w-3 mr-1" />
                {filterAmbassador ? `Ambassador: ${filterAmbassador}` : "Filter ambassador / dates"}
              </Button>
            </div>

            {mixLoading && <p className="text-xs text-center text-muted-foreground py-4">Loading source mix…</p>}

            {mix && (
              <>
                {/* Comparison rows: House vs Ambassador across 4 metrics */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" data-testid="table-source-mix-summary">
                    <thead>
                      <tr className="border-b text-left text-[11px] uppercase text-slate-500">
                        <th className="py-2 pr-2 font-medium">Metric</th>
                        <th className="py-2 px-2 font-medium text-amber-700">
                          <span className="inline-flex items-center gap-1"><Home className="h-3 w-3" /> House / Organic</span>
                        </th>
                        <th className="py-2 px-2 font-medium text-emerald-700">
                          <span className="inline-flex items-center gap-1"><Sparkles className="h-3 w-3" /> Ambassador Referrals</span>
                        </th>
                        <th className="py-2 px-2 font-medium text-slate-500">Unattributed</th>
                        <th className="py-2 pl-2 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b hover:bg-slate-50">
                        <td className="py-2 pr-2 font-medium flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5 text-indigo-500" /> Sessions
                        </td>
                        <td className="py-2 px-2 text-amber-700 font-bold" data-testid="mix-sessions-house">
                          {mix.sessions.house_sessions.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-emerald-700 font-bold" data-testid="mix-sessions-ambassador">
                          {mix.sessions.ambassador_sessions.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-slate-500" data-testid="mix-sessions-unattributed">
                          {mix.sessions.unattributed_sessions.toLocaleString()}
                        </td>
                        <td className="py-2 pl-2 text-right font-semibold" data-testid="mix-sessions-total">
                          {mix.sessions.total_sessions.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-slate-50">
                        <td className="py-2 pr-2 font-medium flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-blue-500" /> Partner Applications
                        </td>
                        <td className="py-2 px-2 text-amber-700 font-bold" data-testid="mix-apps-house">
                          {mix.partnerApps.house_apps.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-emerald-700 font-bold" data-testid="mix-apps-ambassador">
                          {mix.partnerApps.ambassador_apps.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-slate-500" data-testid="mix-apps-unattributed">
                          {mix.partnerApps.unattributed_apps.toLocaleString()}
                        </td>
                        <td className="py-2 pl-2 text-right font-semibold" data-testid="mix-apps-total">
                          {mix.partnerApps.total_apps.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-b hover:bg-slate-50">
                        <td className="py-2 pr-2 font-medium flex items-center gap-1">
                          <CreditCard className="h-3.5 w-3.5 text-violet-500" /> Stripe Conversions
                        </td>
                        <td className="py-2 px-2 text-amber-700 font-bold" data-testid="mix-conv-house">
                          {mix.stripe.house_conversions.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-emerald-700 font-bold" data-testid="mix-conv-ambassador">
                          {mix.stripe.ambassador_conversions.toLocaleString()}
                        </td>
                        <td className="py-2 px-2 text-slate-500" data-testid="mix-conv-unattributed">
                          {mix.stripe.unattributed_conversions.toLocaleString()}
                        </td>
                        <td className="py-2 pl-2 text-right font-semibold" data-testid="mix-conv-total">
                          {(mix.stripe.house_conversions + mix.stripe.ambassador_conversions + mix.stripe.unattributed_conversions).toLocaleString()}
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 bg-green-50/40">
                        <td className="py-2 pr-2 font-medium flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5 text-green-600" /> Stripe Revenue
                        </td>
                        <td className="py-2 px-2 text-amber-700 font-bold" data-testid="mix-rev-house">
                          {formatMoney(mix.stripe.house_revenue)}
                        </td>
                        <td className="py-2 px-2 text-emerald-700 font-bold" data-testid="mix-rev-ambassador">
                          {formatMoney(mix.stripe.ambassador_revenue)}
                        </td>
                        <td className="py-2 px-2 text-slate-500" data-testid="mix-rev-unattributed">
                          {formatMoney(mix.stripe.unattributed_revenue)}
                        </td>
                        <td className="py-2 pl-2 text-right font-semibold" data-testid="mix-rev-total">
                          {formatMoney(mix.stripe.total_revenue)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Per-ambassador split: house traffic (Colin only) vs real shares */}
                {mix.byAmbassador.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-2 mt-3 flex items-center gap-1">
                      <Users className="h-3 w-3" /> Per-Ambassador Split (House traffic vs Real Shares)
                    </p>
                    <div className="overflow-x-auto rounded-md border">
                      <table className="w-full text-xs" data-testid="table-source-mix-by-ambassador">
                        <thead className="bg-slate-50">
                          <tr className="text-left text-[10px] uppercase text-slate-500">
                            <th className="py-2 px-2 font-medium">Ambassador</th>
                            <th className="py-2 px-2 font-medium text-amber-700">House Sessions</th>
                            <th className="py-2 px-2 font-medium text-emerald-700">Share Sessions</th>
                            <th className="py-2 px-2 font-medium text-amber-700">House Apps</th>
                            <th className="py-2 px-2 font-medium text-emerald-700">Share Apps</th>
                            <th className="py-2 px-2 font-medium text-amber-700">House Rev</th>
                            <th className="py-2 px-2 font-medium text-emerald-700">Share Rev</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mix.byAmbassador.map((a) => {
                            const isColin = a.ambassador_code === "colin_slaven";
                            return (
                              <tr key={a.ambassador_code} className="border-t hover:bg-slate-50" data-testid={`row-mix-amb-${a.ambassador_code}`}>
                                <td className="py-2 px-2 font-medium">
                                  {a.ambassador_name || a.ambassador_code}
                                  {isColin && (
                                    <Badge variant="outline" className="ml-1 text-[9px] border-amber-300 text-amber-700">
                                      house default
                                    </Badge>
                                  )}
                                </td>
                                <td className="py-2 px-2 text-amber-700">{a.house_sessions.toLocaleString()}</td>
                                <td className="py-2 px-2 text-emerald-700 font-semibold">{a.share_sessions.toLocaleString()}</td>
                                <td className="py-2 px-2 text-amber-700">{a.house_apps.toLocaleString()}</td>
                                <td className="py-2 px-2 text-emerald-700 font-semibold">{a.share_apps.toLocaleString()}</td>
                                <td className="py-2 px-2 text-amber-700">{formatMoney(a.house_revenue)}</td>
                                <td className="py-2 px-2 text-emerald-700 font-semibold">{formatMoney(a.share_revenue)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">
                      "House" = direct/organic visitors with no UTM/first-touch (assigned to Colin via the house-default rule).
                      "Share" = real ambassador-attributed clicks/sessions. Stripe revenue is sourced from
                      <code className="px-1">partner_attribution.revenue_amount</code>, joined via
                      <code className="px-1">partner_applications.session_id</code> →
                      <code className="px-1">user_attribution_sessions.is_house_default</code>, with a UTM-signature fallback for older rows lacking a session join.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {isLoading && <p className="text-center text-muted-foreground py-8">Loading attribution data...</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <Card>
                <CardContent className="p-3 text-center">
                  <MousePointerClick className="h-4 w-4 mx-auto mb-1 text-cyan-600" />
                  <p className="text-xl font-bold text-cyan-700" data-testid="stat-total-clicks">{data.summary.total_clicks.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Clicks</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <Eye className="h-4 w-4 mx-auto mb-1 text-indigo-600" />
                  <p className="text-xl font-bold text-indigo-700" data-testid="stat-total-sessions">{data.summary.total_sessions.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Sessions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <UserCheck className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                  <p className="text-xl font-bold text-blue-700" data-testid="stat-nav-requests">{data.summary.nav_requests.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Navigator Requests</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <Users className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                  <p className="text-xl font-bold text-purple-700" data-testid="stat-tsl-leads">{data.summary.tsl_leads.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Service Leads</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50/30">
                <CardContent className="p-3 text-center">
                  <Users className="h-4 w-4 mx-auto mb-1 text-green-600" />
                  <p className="text-xl font-bold text-green-700" data-testid="stat-total-leads">{data.summary.total_leads.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Leads</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6" data-testid="card-funnel">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1">
                  <FunnelStep
                    label="Clicks"
                    value={data.funnel.clicks}
                    rate={data.funnel.click_to_session}
                    color="border-cyan-200 bg-cyan-50"
                  />
                  <FunnelStep
                    label="Sessions"
                    value={data.funnel.sessions}
                    rate={data.funnel.session_to_lead}
                    color="border-indigo-200 bg-indigo-50"
                  />
                  <FunnelStep
                    label="Leads"
                    value={data.funnel.leads}
                    color="border-green-200 bg-green-50"
                    isLast
                  />
                </div>
                <div className="flex justify-center mt-3">
                  <Badge variant="outline" className="text-xs">
                    Overall: {data.funnel.click_to_lead}% click → lead
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {data.timing && (
              <Card className="mb-6 border-amber-200" data-testid="card-timing">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" /> Conversion Timing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-cyan-200 bg-cyan-50/50 p-3 text-center">
                      <p className="text-xs font-medium text-slate-500 mb-1">Avg Click → Session</p>
                      <p className="text-xl font-bold text-cyan-700" data-testid="timing-click-to-session">
                        {formatDuration(data.timing.click_to_session.avg_seconds)}
                      </p>
                      {data.timing.click_to_session.sample_count > 0 && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          {data.timing.click_to_session.sample_count} sample{data.timing.click_to_session.sample_count !== 1 ? "s" : ""}
                          {" · "}min {formatDuration(data.timing.click_to_session.min_seconds ?? null)}
                          {" · "}max {formatDuration(data.timing.click_to_session.max_seconds ?? null)}
                        </p>
                      )}
                      {data.timing.click_to_session.is_proxy && (
                        <p className="text-[9px] text-amber-600 mt-1 flex items-center justify-center gap-0.5">
                          <AlertTriangle className="h-2.5 w-2.5" /> Proxy-based
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 text-center">
                      <p className="text-xs font-medium text-slate-500 mb-1">Avg Session → Lead</p>
                      <p className="text-xl font-bold text-indigo-700" data-testid="timing-session-to-lead">
                        {formatDuration(data.timing.session_to_lead.avg_seconds)}
                      </p>
                      {data.timing.session_to_lead.sample_count > 0 && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          {data.timing.session_to_lead.sample_count} sample{data.timing.session_to_lead.sample_count !== 1 ? "s" : ""}
                          {" · "}min {formatDuration(data.timing.session_to_lead.min_seconds ?? null)}
                          {" · "}max {formatDuration(data.timing.session_to_lead.max_seconds ?? null)}
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg border border-green-200 bg-green-50/50 p-3 text-center">
                      <p className="text-xs font-medium text-slate-500 mb-1">Avg Click → Lead</p>
                      <p className="text-xl font-bold text-green-700" data-testid="timing-click-to-lead">
                        {formatDuration(data.timing.click_to_lead.avg_seconds)}
                      </p>
                      {data.timing.click_to_lead.sample_count > 0 && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          {data.timing.click_to_lead.sample_count} sample{data.timing.click_to_lead.sample_count !== 1 ? "s" : ""}
                        </p>
                      )}
                      {data.timing.click_to_lead.is_proxy && (
                        <p className="text-[9px] text-amber-600 mt-1 flex items-center justify-center gap-0.5">
                          <AlertTriangle className="h-2.5 w-2.5" /> Proxy-based
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {data.speedBuckets && data.speedBuckets.total > 0 && (
              <Card className="mb-6 border-violet-200" data-testid="card-speed-buckets">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-violet-600" /> Conversion Speed Distribution
                    {data.speedBuckets.is_proxy && (
                      <Badge variant="outline" className="text-[9px] font-normal text-amber-600 border-amber-300 ml-1">
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Proxy-based click time
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { key: "under_5m", label: "< 5 min", color: "text-green-700 bg-green-50 border-green-200" },
                      { key: "m5_to_30m", label: "5–30 min", color: "text-blue-700 bg-blue-50 border-blue-200" },
                      { key: "m30_to_2h", label: "30–120 min", color: "text-amber-700 bg-amber-50 border-amber-200" },
                      { key: "over_2h", label: "2+ hours", color: "text-red-700 bg-red-50 border-red-200" },
                    ].map(({ key, label, color }) => {
                      const count = data.speedBuckets.buckets[key as keyof typeof data.speedBuckets.buckets];
                      const pct = data.speedBuckets.total > 0 ? ((count / data.speedBuckets.total) * 100).toFixed(1) : "0.0";
                      return (
                        <div key={key} className={`rounded-lg border p-3 text-center ${color}`} data-testid={`bucket-${key}`}>
                          <p className="text-lg font-bold">{count}</p>
                          <p className="text-xs font-medium">{label}</p>
                          <p className="text-[10px] mt-0.5 opacity-70">{pct}%</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center gap-2 mb-4">
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => { setActiveTab("ambassador"); setSortBy("clicks"); }}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "ambassador" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  data-testid="tab-by-ambassador"
                >
                  By Ambassador
                </button>
                <button
                  onClick={() => { setActiveTab("link"); setSortBy("clicks"); }}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "link" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  data-testid="tab-by-link"
                >
                  By Link
                </button>
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={activeTab === "ambassador" ? "Search ambassadors..." : "Search links..."}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 h-9"
                  data-testid="input-search-attribution"
                />
              </div>
            </div>

            {activeTab === "ambassador" && (
              <Card data-testid="card-by-ambassador">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="text-left p-3 font-medium text-xs">Ambassador</th>
                          <th className="text-right p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("clicks")} data-testid="sort-clicks">
                            <span className="inline-flex items-center gap-1">Clicks <SortIcon col="clicks" /></span>
                          </th>
                          <th className="text-right p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("sessions")} data-testid="sort-sessions">
                            <span className="inline-flex items-center gap-1">Sessions <SortIcon col="sessions" /></span>
                          </th>
                          <th className="text-right p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("nav_leads")} data-testid="sort-nav">
                            <span className="inline-flex items-center gap-1">Nav Req <SortIcon col="nav_leads" /></span>
                          </th>
                          <th className="text-right p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("tsl_leads")} data-testid="sort-tsl">
                            <span className="inline-flex items-center gap-1">Svc Leads <SortIcon col="tsl_leads" /></span>
                          </th>
                          <th className="text-right p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("total_leads")} data-testid="sort-total-leads">
                            <span className="inline-flex items-center gap-1">Total <SortIcon col="total_leads" /></span>
                          </th>
                          <th className="text-right p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("avg_session_to_lead_seconds")} data-testid="sort-avg-s2l">
                            <span className="inline-flex items-center gap-1">Avg S→L <SortIcon col="avg_session_to_lead_seconds" /></span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedAmbassadors.map((a) => {
                          const cvr = a.clicks > 0 ? ((a.total_leads / a.clicks) * 100).toFixed(1) : "0.0";
                          return (
                            <tr key={a.ambassador_code} className="border-b hover:bg-slate-50/80 transition-colors" data-testid={`row-amb-${a.ambassador_code}`}>
                              <td className="p-3">
                                <p className="font-medium text-sm">{a.ambassador_name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{a.ambassador_code}</p>
                              </td>
                              <td className="p-3 text-right font-mono">
                                <span className={a.clicks > 0 ? "text-cyan-700 font-semibold" : "text-slate-400"}>{a.clicks}</span>
                              </td>
                              <td className="p-3 text-right font-mono">
                                <span className={a.sessions > 0 ? "text-indigo-700" : "text-slate-400"}>{a.sessions}</span>
                              </td>
                              <td className="p-3 text-right font-mono">
                                <span className={a.nav_leads > 0 ? "text-blue-700" : "text-slate-400"}>{a.nav_leads}</span>
                              </td>
                              <td className="p-3 text-right font-mono">
                                <span className={a.tsl_leads > 0 ? "text-purple-700" : "text-slate-400"}>{a.tsl_leads}</span>
                              </td>
                              <td className="p-3 text-right">
                                <span className={`font-mono font-semibold ${a.total_leads > 0 ? "text-green-700" : "text-slate-400"}`}>{a.total_leads}</span>
                                <span className="text-[10px] text-muted-foreground ml-1">({cvr}%)</span>
                              </td>
                              <td className="p-3 text-right font-mono text-xs" data-testid={`timing-s2l-${a.ambassador_code}`}>
                                <span className={a.avg_session_to_lead_seconds !== null ? "text-amber-700" : "text-slate-300"}>
                                  {formatDuration(a.avg_session_to_lead_seconds)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {sortedAmbassadors.length === 0 && (
                          <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No ambassador data found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "link" && (
              <Card data-testid="card-by-link">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-slate-50">
                          <th className="text-left p-3 font-medium text-xs">Link</th>
                          <th className="text-left p-3 font-medium text-xs">Ambassador</th>
                          <th className="text-left p-3 font-medium text-xs hidden md:table-cell">Campaign</th>
                          <th className="text-right p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("clicks")} data-testid="sort-link-clicks">
                            <span className="inline-flex items-center gap-1">Clicks <SortIcon col="clicks" /></span>
                          </th>
                          <th className="text-right p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("sessions")} data-testid="sort-link-sessions">
                            <span className="inline-flex items-center gap-1">Sessions <SortIcon col="sessions" /></span>
                          </th>
                          <th className="text-right p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("leads")} data-testid="sort-link-leads">
                            <span className="inline-flex items-center gap-1">Leads <SortIcon col="leads" /></span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedLinks.map((l) => {
                          const cvr = l.clicks > 0 ? ((l.leads / l.clicks) * 100).toFixed(1) : "0.0";
                          return (
                            <tr key={l.utm_id} className="border-b hover:bg-slate-50/80 transition-colors" data-testid={`row-link-${l.utm_id}`}>
                              <td className="p-3">
                                <p className="font-medium text-sm truncate max-w-[200px]">{l.link_name || l.utm_id}</p>
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                  <span className="font-mono">{l.utm_id}</span>
                                  {l.channel_type && (
                                    <>
                                      <span>&middot;</span>
                                      <span className="inline-flex items-center gap-0.5"><Radio className="h-2.5 w-2.5" />{l.channel_type}</span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <p className="text-xs">{l.ambassador_name || l.ambassador_code}</p>
                              </td>
                              <td className="p-3 hidden md:table-cell">
                                {l.utm_campaign ? (
                                  <Badge variant="outline" className="text-[10px]">{l.utm_campaign}</Badge>
                                ) : (
                                  <span className="text-slate-400 text-xs">—</span>
                                )}
                              </td>
                              <td className="p-3 text-right font-mono">
                                <span className={l.clicks > 0 ? "text-cyan-700 font-semibold" : "text-slate-400"}>{l.clicks}</span>
                              </td>
                              <td className="p-3 text-right font-mono">
                                <span className={l.sessions > 0 ? "text-indigo-700" : "text-slate-400"}>{l.sessions}</span>
                              </td>
                              <td className="p-3 text-right">
                                <span className={`font-mono font-semibold ${l.leads > 0 ? "text-green-700" : "text-slate-400"}`}>{l.leads}</span>
                                <span className="text-[10px] text-muted-foreground ml-1">({cvr}%)</span>
                              </td>
                            </tr>
                          );
                        })}
                        {sortedLinks.length === 0 && (
                          <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No link data found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminAttribution() {
  return <AdminAuthGuard><AdminAttributionInner /></AdminAuthGuard>;
}
