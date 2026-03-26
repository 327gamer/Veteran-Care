import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Link2,
  MousePointerClick,
  Search,
  Filter,
  X,
  QrCode,
  ToggleLeft,
  ToggleRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar,
  User,
  Radio,
  Megaphone,
  AlertTriangle,
} from "lucide-react";
import { useLocation } from "wouter";

interface LinkRow {
  id: string;
  ambassador_id: string;
  ambassador_name: string;
  ambassador_code: string;
  ambassador_display_name: string | null;
  link_name: string;
  base_path: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_id: string;
  full_url: string;
  short_url: string | null;
  audience_type: string;
  channel_type: string;
  is_active: boolean;
  click_count: number;
  first_clicked_at: string | null;
  last_clicked_at: string | null;
  email: string | null;
  region: string | null;
  created_at: string;
}

interface LinksResponse {
  links: LinkRow[];
  count: number;
  filterOptions: {
    ambassadors: string[] | null;
    channels: string[] | null;
    campaigns: string[] | null;
  };
}

function getAdminHeaders(): Record<string, string> {
  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (adminKey) h["x-admin-key"] = adminKey;
  return h;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(value); } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs gap-1" data-testid={`copy-${label || "btn"}`}>
      {copied ? <><Check className="h-3 w-3 text-green-600" /><span className="text-green-600">Copied</span></> : <><Copy className="h-3 w-3" /><span>{label || "Copy"}</span></>}
    </Button>
  );
}

function useAuthenticatedImage(url: string) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const headers = getAdminHeaders();

  useEffect(() => {
    let cancelled = false;
    fetch(url, { headers })
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.blob(); })
      .then((blob) => { if (!cancelled) setObjectUrl(URL.createObjectURL(blob)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [url]);

  return objectUrl;
}

function LinkDetailPanel({ link, onBack }: { link: LinkRow; onBack: () => void }) {
  const headers = getAdminHeaders();
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/ambassador-links/${link.id}/toggle`, { method: "PUT", headers });
      if (!res.ok) throw new Error("Failed to toggle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-links"] });
    },
  });

  const qrObjectUrl = useAuthenticatedImage(`/api/admin/ambassador-links/${link.id}/qr`);

  const handleDownloadQr = async () => {
    try {
      const res = await fetch(`/api/admin/ambassador-links/${link.id}/qr`, { headers });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${link.utm_id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  };

  const currentActive = toggleMutation.data ? toggleMutation.data.is_active : link.is_active;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-links">
        <ArrowLeft className="h-4 w-4 mr-1" /> All Links
      </Button>

      <Card data-testid="card-link-detail">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base" data-testid="text-link-name">{link.link_name || link.utm_id}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {link.ambassador_display_name || link.ambassador_name} &middot; {link.ambassador_code}
              </p>
            </div>
            <Badge
              variant={currentActive ? "default" : "outline"}
              className={`text-xs ${!currentActive ? "text-slate-500 border-slate-300" : ""}`}
              data-testid="badge-link-status"
            >
              {currentActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Full URL</span>
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2 border">
                <code className="text-xs flex-1 break-all" data-testid="text-full-url">{link.full_url}</code>
                <CopyButton value={link.full_url} label="full-url" />
              </div>
            </div>

            {link.short_url && (
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Short URL</span>
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2 border">
                  <code className="text-xs flex-1 break-all" data-testid="text-short-url">https://veterancare.com{link.short_url}</code>
                  <CopyButton value={`https://veterancare.com${link.short_url}`} label="short-url" />
                </div>
              </div>
            )}

            <div>
              <span className="text-xs text-muted-foreground block mb-1">UTM ID</span>
              <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2 border">
                <code className="text-xs font-mono flex-1" data-testid="text-utm-id">{link.utm_id}</code>
                <CopyButton value={link.utm_id} label="utm-id" />
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">UTM Source</span>
              <p className="text-sm font-medium">{link.utm_source}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">UTM Medium (Channel)</span>
              <p className="text-sm font-medium">{link.utm_medium || link.channel_type}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">UTM Campaign</span>
              <p className="text-sm font-medium">{link.utm_campaign || "—"}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">UTM Content</span>
              <p className="text-sm font-medium">{link.utm_content || "—"}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Audience</span>
              <p className="text-sm font-medium capitalize">{link.audience_type || "—"}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Base Path</span>
              <p className="text-sm font-medium">{link.base_path}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-cyan-50 rounded-lg p-3 border border-cyan-100">
              <p className="text-2xl font-bold text-cyan-700" data-testid="text-detail-clicks">{link.click_count}</p>
              <p className="text-xs text-muted-foreground">Clicks</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border">
              <p className="text-sm font-medium" data-testid="text-first-click">
                {link.first_clicked_at ? formatDate(link.first_clicked_at) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">First Click</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border">
              <p className="text-sm font-medium" data-testid="text-last-click">
                {link.last_clicked_at ? timeAgo(link.last_clicked_at) : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Last Click</p>
            </div>
          </div>

          <Separator />

          <div>
            <span className="text-xs text-muted-foreground block mb-2">QR Code</span>
            <div className="flex items-start gap-4">
              <div className="bg-white border rounded-lg p-2 shrink-0">
                {qrObjectUrl ? (
                  <img
                    src={qrObjectUrl}
                    alt={`QR code for ${link.link_name}`}
                    className="w-32 h-32"
                    data-testid="img-qr-code"
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="space-y-2 flex-1">
                <button
                  onClick={handleDownloadQr}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  data-testid="button-download-qr"
                >
                  <QrCode className="h-3 w-3" /> Download PNG
                </button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(link.full_url, "_blank")}
              data-testid="button-test-link"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open Test Link
            </Button>
            <Button
              variant={currentActive ? "outline" : "default"}
              size="sm"
              onClick={() => toggleMutation.mutate()}
              disabled={toggleMutation.isPending}
              data-testid="button-toggle-active"
            >
              {toggleMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : currentActive ? (
                <ToggleRight className="h-3.5 w-3.5 mr-1" />
              ) : (
                <ToggleLeft className="h-3.5 w-3.5 mr-1" />
              )}
              {currentActive ? "Deactivate" : "Activate"}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            Created {formatDate(link.created_at)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminLinks() {
  const [, navigate] = useLocation();
  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;
  const headers = getAdminHeaders();

  const [selectedLink, setSelectedLink] = useState<LinkRow | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const initialZeroClicks = params.get("zero_clicks") === "1";

  const [filterAmbassador, setFilterAmbassador] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [filterCampaign, setFilterCampaign] = useState("");
  const [filterActive, setFilterActive] = useState(initialZeroClicks ? "true" : "");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterZeroClicks, setFilterZeroClicks] = useState(initialZeroClicks);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (filterAmbassador) p.set("ambassador", filterAmbassador);
    if (filterChannel) p.set("channel", filterChannel);
    if (filterCampaign) p.set("campaign", filterCampaign);
    if (filterActive) p.set("active", filterActive);
    if (filterDateFrom) p.set("date_from", filterDateFrom);
    if (filterDateTo) p.set("date_to", filterDateTo);
    return p.toString();
  }, [filterAmbassador, filterChannel, filterCampaign, filterActive, filterDateFrom, filterDateTo]);

  const { data, isLoading } = useQuery<LinksResponse>({
    queryKey: ["admin-links", queryString],
    queryFn: async () => {
      const url = `/api/admin/ambassador-links${queryString ? `?${queryString}` : ""}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Failed to load links");
      return res.json();
    },
    enabled: !!adminKey,
  });

  const hasActiveFilters = !!(filterAmbassador || filterChannel || filterCampaign || filterActive || filterDateFrom || filterDateTo || filterZeroClicks);

  const clearFilters = () => {
    setFilterAmbassador("");
    setFilterChannel("");
    setFilterCampaign("");
    setFilterActive("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterZeroClicks(false);
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

  const filteredLinks = useMemo(() => {
    let rows = data?.links || [];
    if (filterZeroClicks) {
      rows = rows.filter((l) => l.click_count === 0);
    }
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      rows = rows.filter((l) =>
        l.link_name?.toLowerCase().includes(q) ||
        l.utm_id?.toLowerCase().includes(q) ||
        l.ambassador_code?.toLowerCase().includes(q) ||
        (l.ambassador_display_name || l.ambassador_name || "").toLowerCase().includes(q) ||
        l.utm_campaign?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [data?.links, searchInput, filterZeroClicks]);

  const totalClicks = filteredLinks.reduce((sum, l) => sum + (l.click_count || 0), 0);
  const activeCount = filteredLinks.filter((l) => l.is_active).length;
  const zeroClickCount = filteredLinks.filter((l) => l.click_count === 0 && l.is_active).length;

  if (selectedLink) {
    const freshLink = data?.links.find((l) => l.id === selectedLink.id) || selectedLink;
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto p-4">
          <LinkDetailPanel link={freshLink} onBack={() => setSelectedLink(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4 mr-1" /> Admin
            </Button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Link2 className="h-5 w-5" /> Link Management
            </h1>
            {data && <Badge variant="secondary" className="text-xs">{data.count}</Badge>}
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {hasActiveFilters && <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-[10px] rounded-full">{[filterAmbassador, filterChannel, filterCampaign, filterActive, filterDateFrom, filterDateTo, filterZeroClicks].filter(Boolean).length}</Badge>}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-cyan-700" data-testid="stat-filtered-clicks">{totalClicks.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Total Clicks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-xl font-bold text-green-700" data-testid="stat-filtered-active">{activeCount}</p>
              <p className="text-[10px] text-muted-foreground">Active Links</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${zeroClickCount > 0 ? "text-amber-600" : "text-slate-400"}`} data-testid="stat-filtered-zero">{zeroClickCount}</p>
              <p className="text-[10px] text-muted-foreground">Zero Clicks</p>
            </CardContent>
          </Card>
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Channel</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={filterChannel}
                    onChange={(e) => setFilterChannel(e.target.value)}
                    data-testid="filter-channel"
                  >
                    <option value="">All</option>
                    {(data?.filterOptions.channels || []).map((c) => (
                      <option key={c} value={c}>{c}</option>
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
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={filterActive}
                    onChange={(e) => setFilterActive(e.target.value)}
                    data-testid="filter-active"
                  >
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
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
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setFilterZeroClicks(!filterZeroClicks)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${filterZeroClicks ? "bg-amber-100 border-amber-300 text-amber-800 font-semibold" : "border-border hover:border-amber-300"}`}
                  data-testid="button-filter-zero-clicks"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Zero Clicks Only
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, utm_id, ambassador, campaign..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            data-testid="input-search-links"
          />
        </div>

        {isLoading && <p className="text-center text-muted-foreground py-8">Loading links...</p>}

        {!isLoading && filteredLinks.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <Link2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No links found.</p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" className="mt-2" onClick={clearFilters} data-testid="button-clear-empty">
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-1.5">
          {filteredLinks.map((link) => (
            <Card
              key={link.id}
              className={`cursor-pointer hover:border-blue-300 transition-colors ${!link.is_active ? "opacity-60" : ""}`}
              onClick={() => setSelectedLink(link)}
              data-testid={`card-link-${link.utm_id}`}
            >
              <CardContent className="py-2.5 px-4">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm truncate" data-testid={`text-linkname-${link.utm_id}`}>
                        {link.link_name || link.utm_id}
                      </p>
                      {!link.is_active && (
                        <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-300">Inactive</Badge>
                      )}
                      {link.click_count === 0 && link.is_active && (
                        <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">0 clicks</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="inline-flex items-center gap-0.5">
                        <User className="h-3 w-3" />
                        {link.ambassador_display_name || link.ambassador_name || link.ambassador_code}
                      </span>
                      <span>&middot;</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Radio className="h-3 w-3" />
                        {link.channel_type || link.utm_medium}
                      </span>
                      {link.utm_campaign && (
                        <>
                          <span>&middot;</span>
                          <span className="inline-flex items-center gap-0.5">
                            <Megaphone className="h-3 w-3" />
                            {link.utm_campaign}
                          </span>
                        </>
                      )}
                      <span>&middot;</span>
                      <span className="font-mono text-[10px]">{link.utm_id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <MousePointerClick className="h-3 w-3 text-slate-400" />
                        <span className={`text-sm font-medium ${link.click_count > 0 ? "text-cyan-600" : "text-slate-400"}`} data-testid={`text-clicks-${link.utm_id}`}>
                          {link.click_count}
                        </span>
                      </div>
                      {link.last_clicked_at && (
                        <p className="text-[10px] text-muted-foreground">{timeAgo(link.last_clicked_at)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
