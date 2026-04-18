import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { useState, useMemo } from "react";
import { US_STATE_ABBRS } from "@/lib/admin-filters";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  MessageSquare,
  Building2,
  Search,
  Copy,
  Check,
} from "lucide-react";
import { useLocation } from "wouter";

function CopyButton({ value, label, testId }: { value: string; label: string; testId: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable, ignore */
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label}`}
      className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted active:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
      data-testid={testId}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

interface TrustedServiceLead {
  id: string;
  provider_id: string;
  provider_name: string;
  category_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  role: string | null;
  message: string | null;
  status: string;
  close_reason: string | null;
  status_updated_at: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  veteran: "Veteran",
  family_member: "Family Member",
  case_manager: "Case Manager",
  friend_supporter: "Friend / Supporter",
  other: "Other",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 border-blue-200",
  contacted: "bg-amber-100 text-amber-700 border-amber-200",
  closed: "bg-green-100 text-green-700 border-green-200",
};

function AdminTrustedServiceLeadsInner() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);

  const adminKey = localStorage.getItem("adminKey") || "";
  if (!adminKey) {
    return (
      <div className="p-4 text-center py-20">
        <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Admin access required.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setLocation("/admin")}>
          Go to Admin Login
        </Button>
      </div>
    );
  }

  const { data: leads = [], isLoading } = useQuery<TrustedServiceLead[]>({
    queryKey: ["/api/admin/trusted-service-leads", filterStatus, adminKey],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/admin/trusted-service-leads?${params}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to load leads");
      return res.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/trusted-service-leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trusted-service-leads"] });
    },
  });

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (![l.provider_name, l.name, l.email, l.phone].some(v => v?.toLowerCase().includes(q))) return false;
      }
      if (stateFilter && l.state !== stateFilter) return false;
      if (todayOnly && !isToday(l.created_at)) return false;
      return true;
    });
  }, [leads, searchQuery, stateFilter, todayOnly]);

  const todayCount = useMemo(() => leads.filter(l => isToday(l.created_at)).length, [leads]);

  const newCount = filteredLeads.filter(l => l.status === "new").length;
  const contactedCount = filteredLeads.filter(l => l.status === "contacted").length;
  const closedCount = filteredLeads.filter(l => l.status === "closed").length;

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-300 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0" onClick={() => setLocation("/admin")} data-testid="button-back-admin">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-heading font-bold text-primary truncate" data-testid="text-admin-leads-title">Trusted Partner Leads</h1>
            <p className="text-[11px] text-muted-foreground truncate">Veteran connection requests</p>
          </div>
        </div>
      </header>

      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">

      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-blue-600" data-testid="text-leads-new-count">{newCount}</p>
            <p className="text-[10px] text-muted-foreground">New</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-amber-600" data-testid="text-leads-contacted-count">{contactedCount}</p>
            <p className="text-[10px] text-muted-foreground">Contacted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-green-600" data-testid="text-leads-closed-count">{closedCount}</p>
            <p className="text-[10px] text-muted-foreground">Closed</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            data-testid="input-leads-search"
            className="pl-8 h-8 text-xs"
            placeholder="Search provider, name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button
            variant={todayOnly ? "default" : "outline"}
            size="sm"
            className="h-9 px-3 text-xs"
            onClick={() => setTodayOnly(v => !v)}
            data-testid="button-filter-today"
          >
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            Today{todayCount > 0 ? ` (${todayCount})` : ""}
          </Button>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9 text-xs w-[130px]" data-testid="select-filter-lead-status">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stateFilter || "all"} onValueChange={v => setStateFilter(v === "all" ? "" : v)}>
            <SelectTrigger className="h-9 text-xs w-[110px]" data-testid="select-filter-lead-state">
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              <SelectItem value="all">All States</SelectItem>
              {US_STATE_ABBRS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground ml-auto">
            {filteredLeads.length}{filteredLeads.length !== leads.length ? ` of ${leads.length}` : ""} lead{leads.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground">Loading leads...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {leads.length === 0 ? "No leads yet" : "No leads match your filters"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {leads.length === 0
                ? "Connection requests from veterans will appear here."
                : "Try clearing your search or adjusting the filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredLeads.map(lead => (
            <Card key={lead.id} data-testid={`card-lead-${lead.id}`}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {lead.name}
                      </span>
                      <Badge className={`text-[9px] h-4 px-1.5 ${statusColors[lead.status] || ""}`}>
                        {lead.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3" />
                      {lead.provider_name}
                    </p>
                    {lead.role && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Role: <span className="font-medium">{ROLE_LABELS[lead.role] || lead.role}</span>
                      </p>
                    )}
                  </div>
                  <Select
                    value={lead.status}
                    onValueChange={(v) => updateStatus.mutate({ id: lead.id, status: v })}
                  >
                    <SelectTrigger className="h-9 text-xs w-[110px] flex-shrink-0" data-testid={`select-status-${lead.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1 min-w-0">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline truncate flex-1 min-w-0">{lead.email}</a>
                    <CopyButton value={lead.email} label="email" testId={`button-copy-email-${lead.id}`} />
                  </div>
                  {lead.phone && (
                    <div className="flex items-center gap-1 min-w-0">
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <a href={`tel:${lead.phone}`} className="text-primary hover:underline flex-1 min-w-0 truncate">{lead.phone}</a>
                      <CopyButton value={lead.phone} label="phone" testId={`button-copy-phone-${lead.id}`} />
                    </div>
                  )}
                  {(lead.city || lead.state) && (
                    <span className="flex items-center gap-1 min-w-0">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{[lead.city, lead.state].filter(Boolean).join(", ")}</span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 min-w-0">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{new Date(lead.created_at).toLocaleDateString()} {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>

                {lead.close_reason && (
                  <p className="text-[10px] text-muted-foreground">
                    Reason: <span className="font-medium capitalize">{lead.close_reason.replace(/_/g, " ")}</span>
                    {lead.status_updated_at && ` · ${new Date(lead.status_updated_at).toLocaleDateString()}`}
                  </p>
                )}

                {lead.message && (
                  <div className="flex items-start gap-1.5 bg-muted/30 rounded p-2 mt-1">
                    <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{lead.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export default function AdminTrustedServiceLeads() {
  return <AdminAuthGuard><AdminTrustedServiceLeadsInner /></AdminAuthGuard>;
}
