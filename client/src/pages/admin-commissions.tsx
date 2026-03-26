import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Loader2,
  CreditCard,
  Ban,
  ThumbsUp,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

interface Commission {
  id: string;
  ambassador_code: string;
  ambassador_name: string;
  utm_id: string | null;
  application_id: string | null;
  revenue_amount: string;
  commission_percentage: string;
  commission_amount: string;
  status: string;
  created_at: string;
  payout_id: string | null;
}

interface CommissionData {
  commissions: Commission[];
  summary: {
    total_count: number;
    pending_amount: string;
    approved_amount: string;
    paid_amount: string;
    void_amount: string;
    total_amount: string;
    pending_count: number;
    approved_count: number;
    paid_count: number;
    void_count: number;
  };
  filterOptions: {
    ambassadors: string[] | null;
    statuses: string[] | null;
    source_types: string[] | null;
  };
}

function getAdminHeaders(): Record<string, string> {
  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (adminKey) h["x-admin-key"] = adminKey;
  return h;
}

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock, label: "Pending" },
  approved: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: CheckCircle2, label: "Approved" },
  paid: { color: "bg-green-100 text-green-800 border-green-300", icon: CreditCard, label: "Paid" },
  void: { color: "bg-red-100 text-red-800 border-red-300", icon: XCircle, label: "Void" },
};

const TRANSITIONS: Record<string, string[]> = {
  pending: ["approved", "void"],
  approved: ["paid", "void"],
  paid: [],
  void: [],
};

function getAgingDays(createdAt: string | null | undefined): number | null {
  if (!createdAt) return null;
  const created = new Date(createdAt).getTime();
  if (isNaN(created)) return null;
  return Math.floor((Date.now() - created) / 86400000);
}

function AgingBadge({ createdAt, status }: { createdAt: string | null; status: string }) {
  if (status === "paid" || status === "void") return null;
  const days = getAgingDays(createdAt);
  if (days === null) {
    return (
      <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-[9px] font-normal ml-1" data-testid="badge-aging-unknown">
        Unknown
      </Badge>
    );
  }
  let label: string, className: string;
  if (days <= 7) {
    label = `${days}d · New`;
    className = "bg-green-50 text-green-700 border-green-200";
  } else if (days <= 30) {
    label = `${days}d · Review`;
    className = "bg-amber-50 text-amber-700 border-amber-200";
  } else {
    label = `${days}d · Stale`;
    className = "bg-red-50 text-red-700 border-red-200";
  }
  return (
    <Badge variant="outline" className={`${className} text-[9px] font-normal ml-1`} data-testid={`badge-aging-${days}d`}>
      {label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`${cfg.color} text-xs`} data-testid={`badge-status-${status}`}>
      <Icon className="h-3 w-3 mr-1" /> {cfg.label}
    </Badge>
  );
}

export default function AdminCommissions() {
  const [, navigate] = useLocation();
  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;
  const headers = getAdminHeaders();
  const queryClient = useQueryClient();

  const [showFilters, setShowFilters] = useState(false);
  const [filterAmbassador, setFilterAmbassador] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [groupByAmbassador, setGroupByAmbassador] = useState(false);
  const [staleOnly, setStaleOnly] = useState(false);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (filterAmbassador) p.set("ambassador", filterAmbassador);
    if (filterStatus) p.set("status", filterStatus);
    if (filterDateFrom) p.set("date_from", filterDateFrom);
    if (filterDateTo) p.set("date_to", filterDateTo);
    return p.toString();
  }, [filterAmbassador, filterStatus, filterDateFrom, filterDateTo]);

  const { data, isLoading, isError } = useQuery<CommissionData>({
    queryKey: ["admin-commissions", queryString, adminKey],
    queryFn: async () => {
      const url = `/api/admin/commissions${queryString ? `?${queryString}` : ""}`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!adminKey,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const res = await fetch(`/api/admin/commissions/${id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-commissions"] });
      toast({ title: "Commission status updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const hasActiveFilters = !!(filterAmbassador || filterStatus || filterDateFrom || filterDateTo);

  const clearFilters = () => {
    setFilterAmbassador("");
    setFilterStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  if (isError) {
    navigate("/admin");
    return null;
  }

  if (!adminKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Admin access required.</p>
            <Button className="mt-4" onClick={() => navigate("/admin")} data-testid="button-go-admin">Go to Admin</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const sortedCommissions = useMemo(() => {
    let rows = data?.commissions || [];
    if (staleOnly) {
      rows = rows.filter((c) => {
        if (c.status === "paid" || c.status === "void") return false;
        const days = getAgingDays(c.created_at);
        return days !== null && days > 30;
      });
    }
    if (searchInput.trim()) {
      const q = searchInput.toLowerCase();
      rows = rows.filter((c) =>
        c.ambassador_name?.toLowerCase().includes(q) ||
        c.ambassador_code?.toLowerCase().includes(q) ||
        c.utm_id?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortBy === "days_since_created") {
        aVal = getAgingDays(a.created_at) ?? -1;
        bVal = getAgingDays(b.created_at) ?? -1;
      } else if (sortBy === "commission_amount" || sortBy === "revenue_amount") {
        aVal = parseFloat((a as any)[sortBy]) || 0;
        bVal = parseFloat((b as any)[sortBy]) || 0;
      } else if (sortBy === "created_at") {
        aVal = new Date((a as any)[sortBy]).getTime();
        bVal = new Date((b as any)[sortBy]).getTime();
      } else {
        aVal = (a as any)[sortBy] || "";
        bVal = (b as any)[sortBy] || "";
      }
      if (aVal < bVal) return sortDir === "desc" ? 1 : -1;
      if (aVal > bVal) return sortDir === "desc" ? -1 : 1;
      return 0;
    });
  }, [data?.commissions, searchInput, sortBy, sortDir, staleOnly]);

  const groupedByAmbassador = useMemo(() => {
    if (!groupByAmbassador) return null;
    const groups: Record<string, { name: string; code: string; commissions: Commission[]; totalAmount: number; pendingAmount: number; approvedAmount: number; paidAmount: number }> = {};
    for (const c of sortedCommissions) {
      if (!groups[c.ambassador_code]) {
        groups[c.ambassador_code] = {
          name: c.ambassador_name,
          code: c.ambassador_code,
          commissions: [],
          totalAmount: 0,
          pendingAmount: 0,
          approvedAmount: 0,
          paidAmount: 0,
        };
      }
      const g = groups[c.ambassador_code];
      g.commissions.push(c);
      const amt = parseFloat(c.commission_amount) || 0;
      g.totalAmount += amt;
      if (c.status === "pending") g.pendingAmount += amt;
      if (c.status === "approved") g.approvedAmount += amt;
      if (c.status === "paid") g.paidAmount += amt;
    }
    return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [sortedCommissions, groupByAmbassador]);

  const fmt = (v: string | number) => {
    const n = typeof v === "string" ? parseFloat(v) : v;
    return isNaN(n) ? "$0.00" : `$${n.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4 mr-1" /> Admin
            </Button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Commission Ledger
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={groupByAmbassador ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupByAmbassador(!groupByAmbassador)}
              data-testid="button-toggle-group"
            >
              Group by Ambassador
            </Button>
            <Button
              variant={staleOnly ? "destructive" : "outline"}
              size="sm"
              onClick={() => setStaleOnly(!staleOnly)}
              data-testid="button-toggle-stale"
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Stale Only
            </Button>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="h-4 w-4 mr-1" />
              Filters
              {hasActiveFilters && <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-[10px] rounded-full">{[filterAmbassador, filterStatus, filterDateFrom, filterDateTo].filter(Boolean).length}</Badge>}
            </Button>
          </div>
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
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    data-testid="filter-status"
                  >
                    <option value="">All</option>
                    {["pending", "approved", "paid", "void"].map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">From Date</label>
                  <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} className="h-9" data-testid="filter-date-from" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">To Date</label>
                  <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} className="h-9" data-testid="filter-date-to" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && <p className="text-center text-muted-foreground py-8">Loading commissions...</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <Card>
                <CardContent className="p-3 text-center">
                  <DollarSign className="h-4 w-4 mx-auto mb-1 text-slate-600" />
                  <p className="text-xl font-bold" data-testid="stat-total-count">{data.summary.total_count}</p>
                  <p className="text-[10px] text-muted-foreground">Total Commissions</p>
                </CardContent>
              </Card>
              <Card className="border-yellow-200">
                <CardContent className="p-3 text-center">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-yellow-600" />
                  <p className="text-xl font-bold text-yellow-700" data-testid="stat-pending">{fmt(data.summary.pending_amount)}</p>
                  <p className="text-[10px] text-muted-foreground">{data.summary.pending_count} Pending</p>
                </CardContent>
              </Card>
              <Card className="border-blue-200">
                <CardContent className="p-3 text-center">
                  <CheckCircle2 className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                  <p className="text-xl font-bold text-blue-700" data-testid="stat-approved">{fmt(data.summary.approved_amount)}</p>
                  <p className="text-[10px] text-muted-foreground">{data.summary.approved_count} Approved</p>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardContent className="p-3 text-center">
                  <CreditCard className="h-4 w-4 mx-auto mb-1 text-green-600" />
                  <p className="text-xl font-bold text-green-700" data-testid="stat-paid">{fmt(data.summary.paid_amount)}</p>
                  <p className="text-[10px] text-muted-foreground">{data.summary.paid_count} Paid</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <DollarSign className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                  <p className="text-xl font-bold text-emerald-700" data-testid="stat-total-amount">{fmt(data.summary.total_amount)}</p>
                  <p className="text-[10px] text-muted-foreground">Total Amount</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search commissions..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 h-9"
                  data-testid="input-search"
                />
              </div>
              <span className="text-xs text-muted-foreground">{sortedCommissions.length} record{sortedCommissions.length !== 1 ? "s" : ""}</span>
            </div>

            {groupByAmbassador && groupedByAmbassador ? (
              <div className="space-y-4">
                {groupedByAmbassador.map((g) => (
                  <Card key={g.code} data-testid={`group-${g.code}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>{g.name} <span className="text-muted-foreground font-mono text-xs ml-1">({g.code})</span></span>
                        <div className="flex gap-3 text-xs font-normal">
                          <span className="text-yellow-700">Pending: {fmt(g.pendingAmount)}</span>
                          <span className="text-blue-700">Approved: {fmt(g.approvedAmount)}</span>
                          <span className="text-green-700">Paid: {fmt(g.paidAmount)}</span>
                          <span className="font-semibold">Total: {fmt(g.totalAmount)}</span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <CommissionTable
                        commissions={g.commissions}
                        sortBy={sortBy}
                        sortDir={sortDir}
                        toggleSort={toggleSort}
                        SortIcon={SortIcon}
                        fmt={fmt}
                        statusMutation={statusMutation}
                        showAmbassador={false}
                      />
                    </CardContent>
                  </Card>
                ))}
                {groupedByAmbassador.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No commissions found</p>
                )}
              </div>
            ) : (
              <Card data-testid="card-commission-list">
                <CardContent className="p-0">
                  <CommissionTable
                    commissions={sortedCommissions}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    toggleSort={toggleSort}
                    SortIcon={SortIcon}
                    fmt={fmt}
                    statusMutation={statusMutation}
                    showAmbassador={true}
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CommissionTable({
  commissions,
  sortBy,
  sortDir,
  toggleSort,
  SortIcon,
  fmt,
  statusMutation,
  showAmbassador,
}: {
  commissions: Commission[];
  sortBy: string;
  sortDir: string;
  toggleSort: (col: string) => void;
  SortIcon: any;
  fmt: (v: string | number) => string;
  statusMutation: any;
  showAmbassador: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-slate-50/50">
            {showAmbassador && (
              <th className="text-left p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("ambassador_name")} data-testid="sort-ambassador">
                <span className="inline-flex items-center gap-1">Ambassador <SortIcon col="ambassador_name" /></span>
              </th>
            )}
            <th className="text-right p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("revenue_amount")} data-testid="sort-revenue">
              <span className="inline-flex items-center gap-1">Revenue <SortIcon col="revenue_amount" /></span>
            </th>
            <th className="text-right p-3 font-medium text-xs">Rate</th>
            <th className="text-right p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("commission_amount")} data-testid="sort-amount">
              <span className="inline-flex items-center gap-1">Commission <SortIcon col="commission_amount" /></span>
            </th>
            <th className="text-left p-3 font-medium text-xs">UTM ID</th>
            <th className="text-center p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("status")} data-testid="sort-status">
              <span className="inline-flex items-center gap-1">Status <SortIcon col="status" /></span>
            </th>
            <th className="text-left p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("created_at")} data-testid="sort-date">
              <span className="inline-flex items-center gap-1">Date <SortIcon col="created_at" /></span>
            </th>
            <th className="text-center p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("days_since_created")} data-testid="sort-age" title="Calculated in UTC to ensure consistency across devices">
              <span className="inline-flex items-center gap-1">Age <Info className="h-3 w-3 text-muted-foreground" /> <SortIcon col="days_since_created" /></span>
            </th>
            <th className="text-center p-3 font-medium text-xs">Actions</th>
          </tr>
        </thead>
        <tbody>
          {commissions.map((c) => {
            const transitions = TRANSITIONS[c.status] || [];
            return (
              <tr key={c.id} className="border-b hover:bg-slate-50/80 transition-colors" data-testid={`row-commission-${c.id}`}>
                {showAmbassador && (
                  <td className="p-3">
                    <p className="font-medium text-sm">{c.ambassador_name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{c.ambassador_code}</p>
                  </td>
                )}
                <td className="p-3 text-right font-mono">{fmt(c.revenue_amount)}</td>
                <td className="p-3 text-right font-mono text-xs">{parseFloat(c.commission_percentage)}%</td>
                <td className="p-3 text-right font-mono font-semibold">{fmt(c.commission_amount)}</td>
                <td className="p-3">
                  {c.utm_id ? (
                    <span className="text-xs font-mono text-muted-foreground truncate block max-w-[140px]" title={c.utm_id}>{c.utm_id}</span>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </td>
                <td className="p-3 text-center"><StatusBadge status={c.status} /></td>
                <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="p-3 text-center">
                  <AgingBadge createdAt={c.created_at} status={c.status} />
                </td>
                <td className="p-3">
                  {transitions.length > 0 ? (
                    <div className="flex gap-1 justify-center">
                      {transitions.includes("approved") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                          onClick={() => statusMutation.mutate({ id: c.id, newStatus: "approved" })}
                          disabled={statusMutation.isPending}
                          data-testid={`action-approve-${c.id}`}
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" /> Approve
                        </Button>
                      )}
                      {transitions.includes("paid") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs text-green-700 border-green-200 hover:bg-green-50"
                          onClick={() => statusMutation.mutate({ id: c.id, newStatus: "paid" })}
                          disabled={statusMutation.isPending}
                          data-testid={`action-paid-${c.id}`}
                        >
                          <CreditCard className="h-3 w-3 mr-1" /> Mark Paid
                        </Button>
                      )}
                      {transitions.includes("void") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50"
                          onClick={() => statusMutation.mutate({ id: c.id, newStatus: "void" })}
                          disabled={statusMutation.isPending}
                          data-testid={`action-void-${c.id}`}
                        >
                          <Ban className="h-3 w-3 mr-1" /> Void
                        </Button>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-300 block text-center">—</span>
                  )}
                </td>
              </tr>
            );
          })}
          {commissions.length === 0 && (
            <tr><td colSpan={showAmbassador ? 9 : 8} className="p-6 text-center text-muted-foreground">No commissions found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
