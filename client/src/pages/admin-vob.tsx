import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Store,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { useLocation } from "wouter";

interface VobEntry {
  id: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  description: string | null;
  category_id: string | null;
  subcategory: string | null;
  is_veteran_owned: boolean;
  is_nonprofit: boolean;
  logo_url: string | null;
  status: string;
  admin_notes: string | null;
  show_in_trusted_services: boolean;
  created_at: string;
  reviewed_at: string | null;
  category: { name: string; slug: string } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending Review", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  approved: { label: "Approved", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
};

export default function AdminVob() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;

  const { data: entries = [], isLoading } = useQuery<VobEntry[]>({
    queryKey: ["/api/admin/vob"],
    queryFn: () =>
      fetch("/api/admin/vob", { headers: { "x-admin-key": adminKey || "" } })
        .then(r => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); }),
    enabled: !!adminKey,
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: { id: string; status?: string; notes?: string; show_in_trusted_services?: boolean }) => {
      const body: any = {};
      if (data.status !== undefined) body.status = data.status;
      if (data.notes !== undefined) body.admin_notes = data.notes;
      if (data.show_in_trusted_services !== undefined) body.show_in_trusted_services = data.show_in_trusted_services;
      const res = await fetch(`/api/admin/vob/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey || "" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/vob"] }),
  });

  if (!adminKey) {
    return (
      <div className="p-6 text-center space-y-4">
        <h1 className="text-lg font-bold">Admin Access Required</h1>
        <p className="text-sm text-muted-foreground">Set your admin key in localStorage to access this page.</p>
        <Button variant="outline" onClick={() => setLocation("/admin")} data-testid="button-admin-back">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Admin
        </Button>
      </div>
    );
  }

  const pending = entries.filter(e => e.status === "pending");
  const approved = entries.filter(e => e.status === "approved");
  const rejected = entries.filter(e => e.status === "rejected");

  return (
    <div className="p-4 space-y-5 max-w-3xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation("/admin")} data-testid="button-back-admin">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-heading font-bold text-primary">Veteran-Owned Businesses</h1>
            <p className="text-xs text-muted-foreground">Review and manage directory submissions</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">{entries.length} total</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-yellow-600">{pending.length}</p><p className="text-[10px] text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-green-600">{approved.length}</p><p className="text-[10px] text-muted-foreground">Approved</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-red-600">{rejected.length}</p><p className="text-[10px] text-muted-foreground">Rejected</p></CardContent></Card>
      </div>

      {isLoading && <p className="text-center text-sm text-muted-foreground py-8">Loading...</p>}

      {entries.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No submissions yet</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {entries.map(entry => {
          const sc = statusConfig[entry.status] || statusConfig.pending;
          const StatusIcon = sc.icon;
          const isExpanded = expandedId === entry.id;

          return (
            <Card key={entry.id} className="overflow-hidden" data-testid={`card-vob-${entry.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{entry.business_name}</h3>
                      {entry.show_in_trusted_services && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                          <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> In Trusted Services & Products
                        </Badge>
                      )}
                      {entry.is_nonprofit && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 bg-blue-50 text-blue-700 border-blue-200">
                          <Building2 className="h-2.5 w-2.5 mr-0.5" /> Nonprofit
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.owner_name}</p>
                    {entry.category?.name && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{entry.category.name}{entry.subcategory ? ` — ${entry.subcategory}` : ""}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${sc.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" /> {sc.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {entry.email}</span>
                  {entry.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {entry.phone}</span>}
                  {(entry.city || entry.state) && (
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {[entry.city, entry.state].filter(Boolean).join(", ")}</span>
                  )}
                  {entry.website && (
                    <a href={entry.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Globe className="h-3 w-3" /> Website
                    </a>
                  )}
                </div>

                <button
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  data-testid={`button-expand-vob-${entry.id}`}
                >
                  {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {isExpanded ? "Hide details" : "Show details & review"}
                </button>

                {isExpanded && (
                  <div className="space-y-3 pt-2 border-t animate-in fade-in duration-200">
                    {entry.description && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Description</p>
                        <p className="text-xs text-foreground leading-relaxed">{entry.description}</p>
                      </div>
                    )}
                    {entry.address && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Full Address</p>
                        <p className="text-xs">{entry.address}{entry.city ? `, ${entry.city}` : ""}{entry.state ? `, ${entry.state}` : ""} {entry.zip || ""}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Submitted</p>
                      <p className="text-xs">{new Date(entry.created_at).toLocaleString()}</p>
                    </div>
                    {entry.reviewed_at && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Last Reviewed</p>
                        <p className="text-xs">{new Date(entry.reviewed_at).toLocaleString()}</p>
                      </div>
                    )}

                    {entry.status === "approved" && entry.category?.name && (
                      <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
                        <Checkbox
                          id={`ts-toggle-${entry.id}`}
                          checked={entry.show_in_trusted_services}
                          onCheckedChange={(v) => reviewMutation.mutate({ id: entry.id, show_in_trusted_services: !!v })}
                          data-testid={`checkbox-show-ts-${entry.id}`}
                        />
                        <label htmlFor={`ts-toggle-${entry.id}`} className="text-xs leading-relaxed cursor-pointer">
                          <span className="font-semibold flex items-center gap-1 mb-0.5">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" /> Show in Trusted Services & Products
                          </span>
                          Also display this business under <strong>{entry.category.name}</strong> in the Trusted Services & Products directory with a "Veteran-Owned" verification badge.
                        </label>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Admin Notes</p>
                      <Textarea
                        value={adminNotes[entry.id] ?? entry.admin_notes ?? ""}
                        onChange={e => setAdminNotes(prev => ({ ...prev, [entry.id]: e.target.value }))}
                        placeholder="Add notes about this submission..."
                        rows={2}
                        className="text-xs resize-none"
                        data-testid={`textarea-admin-notes-${entry.id}`}
                      />
                    </div>

                    <div className="flex gap-2">
                      {entry.status !== "approved" && (
                        <Button
                          size="sm"
                          className="flex-1 h-9 text-xs bg-green-600 hover:bg-green-700"
                          disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: entry.id, status: "approved", notes: adminNotes[entry.id] ?? entry.admin_notes ?? undefined })}
                          data-testid={`button-approve-vob-${entry.id}`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                      )}
                      {entry.status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-9 text-xs border-red-200 text-red-600 hover:bg-red-50"
                          disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: entry.id, status: "rejected", notes: adminNotes[entry.id] ?? entry.admin_notes ?? undefined })}
                          data-testid={`button-reject-vob-${entry.id}`}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      )}
                      {entry.status !== "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 text-xs"
                          disabled={reviewMutation.isPending}
                          onClick={() => reviewMutation.mutate({ id: entry.id, status: "pending", notes: adminNotes[entry.id] ?? entry.admin_notes ?? undefined })}
                          data-testid={`button-reset-vob-${entry.id}`}
                        >
                          <Clock className="h-3.5 w-3.5 mr-1" /> Reset to Pending
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
