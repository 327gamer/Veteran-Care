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
} from "lucide-react";
import { useLocation } from "wouter";

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
  byAmbassador: {
    ambassador_code: string;
    ambassador_name: string;
    clicks: number;
    sessions: number;
    tsl_leads: number;
    nav_leads: number;
    total_leads: number;
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
  filterOptions: {
    ambassadors: string[] | null;
    campaigns: string[] | null;
  };
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

export default function AdminAttribution() {
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

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (filterAmbassador) p.set("ambassador", filterAmbassador);
    if (filterCampaign) p.set("campaign", filterCampaign);
    if (filterDateFrom) p.set("date_from", filterDateFrom);
    if (filterDateTo) p.set("date_to", filterDateTo);
    return p.toString();
  }, [filterAmbassador, filterCampaign, filterDateFrom, filterDateTo]);

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
                            </tr>
                          );
                        })}
                        {sortedAmbassadors.length === 0 && (
                          <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No ambassador data found</td></tr>
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
