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
  Plus,
  Loader2,
  FileText,
  Ban,
  Link2,
  Unlink,
  Eye,
  Lock,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

interface Payout {
  id: string;
  ambassador_id: string;
  ambassador_name: string;
  ambassador_code: string;
  payout_period_start: string;
  payout_period_end: string;
  total_amount: string;
  computed_total: string;
  commission_count: string;
  payout_status: string;
  payout_method: string | null;
  external_payout_id: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

interface Commission {
  id: string;
  ambassador_code: string;
  ambassador_name: string;
  utm_id: string | null;
  revenue_amount: string;
  commission_percentage: string;
  commission_amount: string;
  status: string;
  created_at: string;
}

interface Ambassador {
  id: string;
  full_name: string;
  ambassador_code: string;
}

function getAdminHeaders(): Record<string, string> {
  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (adminKey) h["x-admin-key"] = adminKey;
  return h;
}

const STATUS_CONFIG: Record<string, { color: string; icon: any; label: string }> = {
  draft: { color: "bg-slate-50 text-slate-600 border-slate-200", icon: FileText, label: "Draft" },
  pending: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock, label: "Pending" },
  paid: { color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2, label: "Paid" },
  cancelled: { color: "bg-red-50 text-red-600 border-red-200", icon: Ban, label: "Cancelled" },
};

const TRANSITIONS: Record<string, string[]> = {
  draft: ["pending", "cancelled"],
  pending: ["paid", "cancelled"],
  paid: [],
  cancelled: [],
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`${cfg.color} text-xs`} data-testid={`badge-payout-status-${status}`}>
      <Icon className="h-3 w-3 mr-1" /> {cfg.label}
    </Badge>
  );
}

const fmt = (v: string | number) => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? "$0.00" : `$${n.toFixed(2)}`;
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const PAYOUT_METHOD_LABELS: Record<string, string> = { check: "Check", direct_deposit: "Direct Deposit (ACH)", ach: "Direct Deposit (ACH)", wire: "Bank Wire", paypal: "PayPal", venmo: "Venmo", zelle: "Zelle", stripe: "Stripe Connect", other: "Other" };
const fmtMethod = (m: string | null) => m ? (PAYOUT_METHOD_LABELS[m] || m) : "—";

export default function AdminPayouts() {
  const [, navigate] = useLocation();
  const headers = getAdminHeaders();
  const queryClient = useQueryClient();
  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;

  const [view, setView] = useState<"list" | "detail" | "create">("list");
  const [selectedPayoutId, setSelectedPayoutId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterAmbassador, setFilterAmbassador] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [createAmbassadorId, setCreateAmbassadorId] = useState("");
  const [createPeriodStart, setCreatePeriodStart] = useState("");
  const [createPeriodEnd, setCreatePeriodEnd] = useState("");
  const [createMethod, setCreateMethod] = useState("");
  const [createNotes, setCreateNotes] = useState("");

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (filterAmbassador) p.set("ambassador", filterAmbassador);
    if (filterStatus) p.set("status", filterStatus);
    if (filterDateFrom) p.set("date_from", filterDateFrom);
    if (filterDateTo) p.set("date_to", filterDateTo);
    return p.toString();
  }, [filterAmbassador, filterStatus, filterDateFrom, filterDateTo]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-payouts", adminKey, queryString],
    queryFn: async () => {
      const r = await fetch(`/api/admin/payouts?${queryString}`, { headers });
      if (!r.ok) throw new Error("Failed");
      return r.json() as Promise<{ payouts: Payout[]; summary: any; ambassadors: Ambassador[] }>;
    },
    enabled: !!adminKey,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-payout-detail", adminKey, selectedPayoutId],
    queryFn: async () => {
      const r = await fetch(`/api/admin/payouts/${selectedPayoutId}`, { headers });
      if (!r.ok) throw new Error("Failed");
      return r.json() as Promise<{ payout: Payout; commissions: Commission[]; eligibleCommissions: Commission[] }>;
    },
    enabled: !!adminKey && !!selectedPayoutId && view === "detail",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/payouts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ambassador_id: createAmbassadorId,
          payout_period_start: createPeriodStart,
          payout_period_end: createPeriodEnd,
          payout_method: createMethod || null,
          notes: createNotes || null,
        }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      toast({ title: "Payout created" });
      setView("detail");
      setSelectedPayoutId(d.payout.id);
      setCreateAmbassadorId(""); setCreatePeriodStart(""); setCreatePeriodEnd(""); setCreateMethod(""); setCreateNotes("");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const r = await fetch(`/api/admin/payouts/${id}/status`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payout-detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin-commissions"] });
      toast({ title: vars.status === "paid" ? "Payout marked as paid successfully." : `Payout status updated to ${vars.status}.` });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const linkMutation = useMutation({
    mutationFn: async ({ payoutId, commissionIds }: { payoutId: string; commissionIds: string[] }) => {
      const r = await fetch(`/api/admin/payouts/${payoutId}/commissions`, {
        method: "POST",
        headers,
        body: JSON.stringify({ commission_ids: commissionIds }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: (d) => {
      queryClient.invalidateQueries({ queryKey: ["admin-payout-detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      toast({ title: `${d.linked} commission(s) linked` });
      setSelectedCommissions([]);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const unlinkMutation = useMutation({
    mutationFn: async ({ payoutId, commissionId }: { payoutId: string; commissionId: string }) => {
      const r = await fetch(`/api/admin/payouts/${payoutId}/commissions/${commissionId}`, {
        method: "DELETE",
        headers,
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payout-detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      toast({ title: "Commission unlinked" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
  };
  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy !== col) return null;
    return sortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />;
  };

  const sortedPayouts = useMemo(() => {
    const rows = data?.payouts || [];
    return [...rows].sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortBy === "total_amount") {
        aVal = parseFloat(a.computed_total) || 0;
        bVal = parseFloat(b.computed_total) || 0;
      } else if (sortBy === "created_at" || sortBy === "payout_period_start") {
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
  }, [data?.payouts, sortBy, sortDir]);

  if (isError) { navigate("/admin"); return null; }

  const selectedRunningTotal = useMemo(() => {
    if (!detailData?.eligibleCommissions) return 0;
    return detailData.eligibleCommissions
      .filter(c => selectedCommissions.includes(c.id))
      .reduce((sum, c) => sum + (parseFloat(c.commission_amount) || 0), 0);
  }, [selectedCommissions, detailData?.eligibleCommissions]);

  if (view === "create") {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => setView("list")} data-testid="button-back-list">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-lg font-bold flex items-center gap-2"><Plus className="h-5 w-5" /> Create Payout</h1>
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Ambassador *</label>
                <select
                  className="w-full border rounded-md p-2 text-sm"
                  value={createAmbassadorId}
                  onChange={e => setCreateAmbassadorId(e.target.value)}
                  data-testid="select-ambassador"
                >
                  <option value="">Select ambassador...</option>
                  {(data?.ambassadors || []).map(a => (
                    <option key={a.id} value={a.id}>{a.full_name} ({a.ambassador_code})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Period Start *</label>
                  <Input type="date" value={createPeriodStart} onChange={e => setCreatePeriodStart(e.target.value)} data-testid="input-period-start" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Period End *</label>
                  <Input type="date" value={createPeriodEnd} onChange={e => setCreatePeriodEnd(e.target.value)} data-testid="input-period-end" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Payout Method</label>
                <select className="w-full border rounded-md p-2 text-sm" value={createMethod} onChange={e => setCreateMethod(e.target.value)} data-testid="select-method">
                  <option value="">Select method...</option>
                  <option value="check">Check</option>
                  <option value="direct_deposit">Direct Deposit (ACH)</option>
                  <option value="wire">Bank Wire</option>
                  <option value="paypal">PayPal</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Notes</label>
                <textarea
                  className="w-full border rounded-md p-2 text-sm min-h-[80px]"
                  value={createNotes}
                  onChange={e => setCreateNotes(e.target.value)}
                  placeholder="Optional notes..."
                  data-testid="input-notes"
                />
              </div>
              <Button
                className="w-full"
                disabled={!createAmbassadorId || !createPeriodStart || !createPeriodEnd || !createMethod || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                data-testid="button-create-payout"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Create Payout Record
              </Button>
              {(!createAmbassadorId || !createPeriodStart || !createPeriodEnd || !createMethod) && (
                <p className="text-xs text-orange-600 text-center mt-2" data-testid="text-create-validation">
                  {[
                    !createAmbassadorId && "ambassador",
                    !createPeriodStart && "start date",
                    !createPeriodEnd && "end date",
                    !createMethod && "payout method",
                  ].filter(Boolean).join(", ")} required
                </p>
              )}
              <p className="text-xs text-muted-foreground text-center mt-1">
                After creating, you'll be taken to the detail view where you can link approved commissions and manage status.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (view === "detail" && selectedPayoutId) {
    const p = detailData?.payout;
    const comms = detailData?.commissions || [];
    const eligible = detailData?.eligibleCommissions || [];
    const isPaid = p?.payout_status === "paid";
    const isCancelled = p?.payout_status === "cancelled";
    const isLocked = isPaid || isCancelled;
    const transitions = p ? TRANSITIONS[p.payout_status] || [] : [];
    const linkedTotal = comms.reduce((s, c) => s + (parseFloat(c.commission_amount) || 0), 0);

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => { setView("list"); setSelectedPayoutId(null); }} data-testid="button-back-list">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5" /> Payout Detail
              {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
            </h1>
          </div>

          {detailLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : p ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><span className="text-muted-foreground block">Ambassador</span><strong>{p.ambassador_name}</strong><br /><span className="text-xs text-muted-foreground">{p.ambassador_code}</span></div>
                    <div><span className="text-muted-foreground block">Period</span>{fmtDate(p.payout_period_start)} — {fmtDate(p.payout_period_end)}</div>
                    <div><span className="text-muted-foreground block">Status</span><StatusBadge status={p.payout_status} /></div>
                    <div><span className="text-muted-foreground block">Total</span><strong className="text-lg">{fmt(linkedTotal)}</strong></div>
                    {p.payout_method && <div><span className="text-muted-foreground block">Method</span>{fmtMethod(p.payout_method)}</div>}
                    {p.external_payout_id && <div><span className="text-muted-foreground block">External Ref</span><span className="font-mono text-xs">{p.external_payout_id}</span></div>}
                    {p.paid_at && <div><span className="text-muted-foreground block">Paid Date</span>{fmtDate(p.paid_at)}</div>}
                    {p.notes && <div className="col-span-2"><span className="text-muted-foreground block">Notes</span>{p.notes}</div>}
                    <div><span className="text-muted-foreground block">Created</span>{fmtDate(p.created_at)}</div>
                  </div>
                  {transitions.length > 0 && (
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      {transitions.includes("pending") && (
                        <Button size="sm" variant="outline" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: p.id, status: "pending" })} data-testid="button-mark-pending">
                          <Clock className="h-3 w-3 mr-1" /> Mark Pending
                        </Button>
                      )}
                      {transitions.includes("paid") && (
                        <span title={comms.length === 0 ? "Link at least one commission before marking as paid" : ""}>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" disabled={statusMutation.isPending || comms.length === 0} onClick={() => statusMutation.mutate({ id: p.id, status: "paid" })} data-testid="button-mark-paid">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Paid{comms.length === 0 ? " (no commissions)" : ""}
                          </Button>
                        </span>
                      )}
                      {transitions.includes("cancelled") && (
                        <Button size="sm" variant="destructive" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: p.id, status: "cancelled" })} data-testid="button-cancel-payout">
                          <Ban className="h-3 w-3 mr-1" /> Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Linked Commissions ({comms.length})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b bg-muted/30">
                        <th className="text-left p-3 font-medium text-xs">Revenue</th>
                        <th className="text-left p-3 font-medium text-xs">Rate</th>
                        <th className="text-left p-3 font-medium text-xs">Commission</th>
                        <th className="text-left p-3 font-medium text-xs">UTM</th>
                        <th className="text-left p-3 font-medium text-xs">Date</th>
                        {!isLocked && <th className="text-center p-3 font-medium text-xs">Actions</th>}
                      </tr></thead>
                      <tbody>
                        {comms.map(c => (
                          <tr key={c.id} className="border-b hover:bg-muted/20">
                            <td className="p-3 text-xs">{fmt(c.revenue_amount)}</td>
                            <td className="p-3 text-xs">{parseFloat(c.commission_percentage)}%</td>
                            <td className="p-3 text-xs font-semibold">{fmt(c.commission_amount)}</td>
                            <td className="p-3 text-xs font-mono truncate max-w-[100px]">{c.utm_id || "—"}</td>
                            <td className="p-3 text-xs text-muted-foreground">{fmtDate(c.created_at)}</td>
                            {!isLocked && (
                              <td className="p-3 text-center">
                                <Button size="sm" variant="ghost" className="text-red-500 h-7 px-2" disabled={unlinkMutation.isPending} onClick={() => unlinkMutation.mutate({ payoutId: p.id, commissionId: c.id })} data-testid={`button-unlink-${c.id}`}>
                                  <Unlink className="h-3 w-3 mr-1" /> Unlink
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                        {comms.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No commissions linked yet</td></tr>}
                      </tbody>
                      <tfoot>
                        <tr className="border-t bg-muted/20">
                          <td colSpan={2} className="p-3 text-xs font-medium text-right">Subtotal:</td>
                          <td className="p-3 text-sm font-bold">{fmt(linkedTotal)}</td>
                          <td colSpan={3}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {!isLocked && eligible.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <p className="text-sm">No eligible approved commissions available for this ambassador.</p>
                    <p className="text-xs mt-1">Commissions must be in "approved" status and not already linked to another payout.</p>
                  </CardContent>
                </Card>
              )}

              {isLocked && (
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="p-4 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-700">
                      This payout is <strong>{p.payout_status}</strong> and locked. No further changes can be made.
                    </span>
                  </CardContent>
                </Card>
              )}

              {!isLocked && eligible.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        Eligible Commissions ({eligible.length})
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {selectedCommissions.length > 0 && (
                          <span className="text-xs text-muted-foreground" data-testid="text-running-total">
                            Selected: {selectedCommissions.length} · {fmt(selectedRunningTotal)}
                          </span>
                        )}
                        <Button
                          size="sm"
                          disabled={selectedCommissions.length === 0 || linkMutation.isPending}
                          onClick={() => linkMutation.mutate({ payoutId: p.id, commissionIds: selectedCommissions })}
                          data-testid="button-link-selected"
                        >
                          {linkMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Link2 className="h-3 w-3 mr-1" />}
                          Link Selected
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b bg-muted/30">
                          <th className="p-3 w-8"><input type="checkbox" checked={selectedCommissions.length === eligible.length && eligible.length > 0} onChange={e => setSelectedCommissions(e.target.checked ? eligible.map(c => c.id) : [])} data-testid="checkbox-select-all" /></th>
                          <th className="text-left p-3 font-medium text-xs">Revenue</th>
                          <th className="text-left p-3 font-medium text-xs">Rate</th>
                          <th className="text-left p-3 font-medium text-xs">Commission</th>
                          <th className="text-left p-3 font-medium text-xs">UTM</th>
                          <th className="text-left p-3 font-medium text-xs">Date</th>
                        </tr></thead>
                        <tbody>
                          {eligible.map(c => (
                            <tr key={c.id} className={`border-b hover:bg-muted/20 ${selectedCommissions.includes(c.id) ? "bg-blue-50/50" : ""}`}>
                              <td className="p-3"><input type="checkbox" checked={selectedCommissions.includes(c.id)} onChange={e => setSelectedCommissions(prev => e.target.checked ? [...prev, c.id] : prev.filter(x => x !== c.id))} data-testid={`checkbox-commission-${c.id}`} /></td>
                              <td className="p-3 text-xs">{fmt(c.revenue_amount)}</td>
                              <td className="p-3 text-xs">{parseFloat(c.commission_percentage)}%</td>
                              <td className="p-3 text-xs font-semibold">{fmt(c.commission_amount)}</td>
                              <td className="p-3 text-xs font-mono truncate max-w-[100px]">{c.utm_id || "—"}</td>
                              <td className="p-3 text-xs text-muted-foreground">{fmtDate(c.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4 mr-1" /> Admin
            </Button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Payout Tracking
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setView("create")} data-testid="button-new-payout">
              <Plus className="h-4 w-4 mr-1" /> New Payout
            </Button>
            <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} data-testid="button-toggle-filters">
              <Filter className="h-4 w-4 mr-1" /> Filters
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-4">
            <CardContent className="p-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Ambassador</label>
                  <select className="w-full border rounded-md p-1.5 text-xs" value={filterAmbassador} onChange={e => setFilterAmbassador(e.target.value)} data-testid="filter-ambassador">
                    <option value="">All</option>
                    {(data?.ambassadors || []).map(a => (
                      <option key={a.ambassador_code} value={a.ambassador_code}>{a.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Status</label>
                  <select className="w-full border rounded-md p-1.5 text-xs" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} data-testid="filter-status">
                    <option value="">All</option>
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">From</label>
                  <Input type="date" className="text-xs h-8" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} data-testid="filter-date-from" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">To</label>
                  <Input type="date" className="text-xs h-8" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} data-testid="filter-date-to" />
                </div>
              </div>
              {(filterAmbassador || filterStatus || filterDateFrom || filterDateTo) && (
                <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => { setFilterAmbassador(""); setFilterStatus(""); setFilterDateFrom(""); setFilterDateTo(""); }} data-testid="button-clear-filters">
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Payouts</p><p className="text-xl font-bold" data-testid="text-total-payouts">{summary.total || 0}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl font-bold text-amber-600" data-testid="text-pending-payouts">{summary.pending_count || 0}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Paid</p><p className="text-xl font-bold text-green-600" data-testid="text-paid-payouts">{summary.paid_count || 0}</p></CardContent></Card>
          <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Paid</p><p className="text-xl font-bold" data-testid="text-total-paid-amount">{fmt(summary.total_paid_amount || 0)}</p></CardContent></Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("ambassador_name")} data-testid="sort-ambassador">
                        <span className="inline-flex items-center gap-1">Ambassador <SortIcon col="ambassador_name" /></span>
                      </th>
                      <th className="text-left p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("payout_period_start")} data-testid="sort-period">
                        <span className="inline-flex items-center gap-1">Period <SortIcon col="payout_period_start" /></span>
                      </th>
                      <th className="text-right p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("total_amount")} data-testid="sort-amount">
                        <span className="inline-flex items-center gap-1 justify-end">Amount <SortIcon col="total_amount" /></span>
                      </th>
                      <th className="text-center p-3 font-medium text-xs">Commissions</th>
                      <th className="text-left p-3 font-medium text-xs">Method</th>
                      <th className="text-center p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("payout_status")} data-testid="sort-status">
                        <span className="inline-flex items-center gap-1">Status <SortIcon col="payout_status" /></span>
                      </th>
                      <th className="text-left p-3 font-medium text-xs">Ext. Ref</th>
                      <th className="text-left p-3 font-medium text-xs">Paid</th>
                      <th className="text-left p-3 font-medium text-xs cursor-pointer select-none" onClick={() => toggleSort("created_at")} data-testid="sort-date">
                        <span className="inline-flex items-center gap-1">Created <SortIcon col="created_at" /></span>
                      </th>
                      <th className="text-center p-3 font-medium text-xs">View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPayouts.map(p => (
                      <tr key={p.id} className="border-b hover:bg-muted/20">
                        <td className="p-3">
                          <span className="text-xs font-medium">{p.ambassador_name}</span>
                          <br /><span className="text-[10px] text-muted-foreground">{p.ambassador_code}</span>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                          {fmtDate(p.payout_period_start)} — {fmtDate(p.payout_period_end)}
                        </td>
                        <td className="p-3 text-xs font-semibold text-right">{fmt(p.computed_total)}</td>
                        <td className="p-3 text-xs text-center">{p.commission_count}</td>
                        <td className="p-3 text-xs">{fmtMethod(p.payout_method)}</td>
                        <td className="p-3 text-center"><StatusBadge status={p.payout_status} /></td>
                        <td className="p-3 text-xs font-mono truncate max-w-[80px]">{p.external_payout_id || "—"}</td>
                        <td className="p-3 text-xs text-muted-foreground">{p.paid_at ? fmtDate(p.paid_at) : "—"}</td>
                        <td className="p-3 text-xs text-muted-foreground">{fmtDate(p.created_at)}</td>
                        <td className="p-3 text-center">
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setSelectedPayoutId(p.id); setView("detail"); }} data-testid={`button-view-${p.id}`}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {sortedPayouts.length === 0 && (
                      <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">No payouts found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
