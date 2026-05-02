import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { useState, useMemo } from "react";
import { US_STATE_ABBRS } from "@/lib/admin-filters";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  UserPlus,
  XCircle,
  ArrowRightCircle,
  FileText,
  CreditCard,
  Link2,
  Copy,
  Search,
  Archive,
  ArchiveRestore,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface PartnerApplication {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  category_id: string | null;
  subcategory_ids: string | null;
  service_description: string | null;
  plan_type: string | null;
  status: string;
  admin_notes: string | null;
  converted_provider_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_checkout_url: string | null;
  created_at: string;
  updated_at: string;
  trusted_service_categories: { name: string; slug: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  prospect: { label: "Prospect", color: "bg-blue-100 text-blue-700 border-blue-200", icon: UserPlus },
  pending: { label: "Pending Review", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  approved_pending_payment: { label: "Awaiting Payment", color: "bg-purple-100 text-purple-700 border-purple-200", icon: CreditCard },
  active: { label: "Active Partner", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  inactive: { label: "Inactive", color: "bg-gray-100 text-gray-500 border-gray-200", icon: XCircle },
  archived: { label: "Archived", color: "bg-slate-100 text-slate-600 border-slate-200", icon: Archive },
};

interface DeletePreflight {
  id: string;
  company_name: string;
  status: string;
  attribution_rows: number;
  has_stripe_subscription: boolean;
  has_stripe_customer: boolean;
  converted_provider_id: string | null;
  blockers: { type: string; message: string; severity: "high" | "medium" | "low" }[];
  recommended_action: "archive" | "hard_delete" | "force_delete_required";
  can_hard_delete: boolean;
}

function AdminPartnerProspectsInner() {
  const [, setLocation] = useLocation();
  const adminKey = localStorage.getItem("adminKey") || "";
  const isAdmin = !!adminKey;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [planTypeFilter, setPlanTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [deleteOpenId, setDeleteOpenId] = useState<string | null>(null);
  const [forceConfirmName, setForceConfirmName] = useState<string>("");
  const [preflight, setPreflight] = useState<DeletePreflight | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);

  if (!isAdmin) {
    setLocation("/admin");
    return null;
  }

  const { data: applications = [], isLoading } = useQuery<PartnerApplication[]>({
    queryKey: ["/api/admin/partner-applications", filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/admin/partner-applications?${params}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: isAdmin,
  });

  const { data: allSubcategories = [] } = useQuery<{id: string; name: string; category_id: string}[]>({
    queryKey: ["/api/partner-subcategories"],
    queryFn: async () => {
      const res = await fetch(`/api/partner-subcategories`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdmin,
  });

  const subcategoryMap = Object.fromEntries(allSubcategories.map(s => [s.id, s.name]));

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status?: string; admin_notes?: string }) => {
      const res = await fetch(`/api/admin/partner-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ status, admin_notes }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-applications"] });
      toast({ title: "Updated", description: "Application updated successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/partner-applications/${id}/approve`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-applications"] });
      if (data.checkoutUrl) {
        navigator.clipboard.writeText(data.checkoutUrl).catch(() => {});
        toast({
          title: data.emailSent ? "Payment Link Emailed" : "Payment Link Created",
          description: data.emailSent
            ? "Payment link emailed to the partner. Link also copied to clipboard as backup."
            : "Email delivery failed. Payment link copied to clipboard — send it manually.",
        });
      }
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/partner-applications/${id}/archive`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error((await res.json()).error || "Archive failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-applications"] });
      toast({ title: "Archived", description: `${data.company_name} moved to Archived. Visible in the Archived tab.` });
    },
    onError: (err: any) => toast({ title: "Archive failed", description: err.message, variant: "destructive" }),
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/partner-applications/${id}/unarchive`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error((await res.json()).error || "Unarchive failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-applications"] });
      toast({ title: "Restored", description: `${data.company_name} restored to Prospect.` });
    },
    onError: (err: any) => toast({ title: "Unarchive failed", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, force, confirmCompany }: { id: string; force?: boolean; confirmCompany?: string }) => {
      const params = new URLSearchParams();
      if (force) params.set("force", "true");
      if (confirmCompany) params.set("confirm_company", confirmCompany);
      const res = await fetch(`/api/admin/partner-applications/${id}?${params}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      const body = await res.json();
      if (!res.ok) {
        const err: any = new Error(body.message || body.error || "Delete failed");
        err.body = body;
        throw err;
      }
      return body;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-applications"] });
      setDeleteOpenId(null);
      setForceConfirmName("");
      setPreflight(null);
      toast({
        title: data.forced ? "Force-deleted" : "Deleted",
        description: data.forced
          ? `${data.company_name} removed. ${data.cascaded_attribution_rows} attribution row(s) cascaded.`
          : `${data.company_name} permanently deleted.`,
      });
    },
    onError: (err: any) => {
      const b = err.body;
      if (b?.error === "delete_blocked") {
        toast({
          title: "Delete blocked",
          description: "This application has linked records. Use Archive, or open the Delete panel for details.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Delete failed", description: err.message, variant: "destructive" });
      }
    },
  });

  const openDeletePanel = async (id: string) => {
    setDeleteOpenId(id);
    setForceConfirmName("");
    setPreflight(null);
    setPreflightLoading(true);
    try {
      const res = await fetch(`/api/admin/partner-applications/${id}/delete-preflight`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to load preflight");
      setPreflight(await res.json());
    } catch (err: any) {
      toast({ title: "Preflight failed", description: err.message, variant: "destructive" });
      setDeleteOpenId(null);
    } finally {
      setPreflightLoading(false);
    }
  };

  const convertMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/partner-applications/${id}/convert`, {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trusted-services"] });
      toast({ title: "Converted", description: "Partner application has been converted to an active Trusted Services provider." });
    },
    onError: (err: any) => {
      toast({ title: "Conversion Failed", description: err.message, variant: "destructive" });
    },
  });

  

  const { data: partnerCategories = [] } = useQuery<{ id: string; name: string; slug: string }[]>({
    queryKey: ["/api/partner-categories"],
    queryFn: () => fetch("/api/partner-categories").then(r => r.json()),
  });

  const filteredApplications = useMemo(() => {
    return applications.filter(a => {
      // "All" tab means all CURRENT applications, not archived junk.
      // Archived rows only render when the user explicitly clicks the
      // Archived tab. (Founder QA 2026-05-02.)
      if (filterStatus === "all" && a.status === "archived") return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (![a.company_name, a.contact_name, a.email].some(v => v?.toLowerCase().includes(q))) return false;
      }
      if (planTypeFilter && a.plan_type !== planTypeFilter) return false;
      if (stateFilter && a.state !== stateFilter) return false;
      if (categoryFilter && a.trusted_service_categories?.name !== categoryFilter) return false;
      return true;
    });
  }, [applications, filterStatus, searchQuery, planTypeFilter, stateFilter, categoryFilter]);

  const statusCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  // "All" badge count = everything except archived (matches the filter above)
  const nonArchivedCount = applications.filter(a => a.status !== "archived").length;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              data-testid="button-back-admin"
              onClick={() => setLocation("/admin/trusted-services")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-heading font-bold text-primary" data-testid="text-admin-prospects-title">
                Trusted Partner Applications
              </h1>
              <p className="text-xs text-muted-foreground">
                {filteredApplications.length}{filteredApplications.length !== nonArchivedCount ? ` of ${nonArchivedCount}` : ""} applications
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setLocation("/admin/trusted-services")}
              data-testid="button-nav-partners"
            >
              Trusted Partners
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setLocation("/admin/trusted-service-leads")}
              data-testid="button-nav-leads"
            >
              Trusted Partner Leads
            </Button>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              data-testid="input-apps-search"
              className="pl-8 h-8 text-xs"
              placeholder="Search company, contact, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <Select value={planTypeFilter || "all"} onValueChange={v => setPlanTypeFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 text-xs w-[130px]" data-testid="select-filter-plan-type">
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="state">State Plan</SelectItem>
                <SelectItem value="national">National Plan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stateFilter || "all"} onValueChange={v => setStateFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 text-xs w-[110px]" data-testid="select-filter-app-state">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">All States</SelectItem>
                {US_STATE_ABBRS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter || "all"} onValueChange={v => setCategoryFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 text-xs w-[160px]" data-testid="select-filter-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">All Categories</SelectItem>
                {partnerCategories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {(stateFilter || planTypeFilter || categoryFilter) && (
              <button
                data-testid="button-clear-app-filters"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => { setStateFilter(""); setPlanTypeFilter(""); setCategoryFilter(""); }}
              >
                Clear
              </button>
            )}
            <p className="text-xs text-muted-foreground ml-auto">
              {filteredApplications.length}{filteredApplications.length !== nonArchivedCount ? ` of ${nonArchivedCount}` : ""} application{nonArchivedCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: "all", label: "All" },
            { key: "prospect", label: "Prospects" },
            { key: "pending", label: "Pending" },
            { key: "approved_pending_payment", label: "Awaiting Payment" },
            { key: "active", label: "Active" },
            { key: "inactive", label: "Inactive" },
            { key: "archived", label: "Archived" },
          ].map((f) => (
            <button
              key={f.key}
              data-testid={`filter-status-${f.key}`}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterStatus === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-white border text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {f.label}
              {f.key !== "all" && statusCounts[f.key] ? ` (${statusCounts[f.key]})` : ""}
              {f.key === "all" ? ` (${nonArchivedCount})` : ""}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading applications...</div>
        ) : filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {applications.length === 0 ? "No partner applications yet." : "No applications match your filters."}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {applications.length === 0
                  ? "Applications submitted through the partner form will appear here."
                  : "Try clearing your search or adjusting the filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map((app) => {
              const isExpanded = expandedId === app.id;
              const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.prospect;
              const StatusIcon = cfg.icon;

              return (
                <Card key={app.id} data-testid={`prospect-card-${app.id}`} className="overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : app.id)}
                      data-testid={`button-expand-${app.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-foreground">{app.company_name}</p>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.color}`}>
                            <StatusIcon className="h-3 w-3 mr-0.5" />
                            {cfg.label}
                          </Badge>
                          {app.plan_type === "national" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
                              <Globe className="h-2.5 w-2.5 mr-0.5" /> National
                            </Badge>
                          )}
                          {app.plan_type === "state" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200">
                              <MapPin className="h-2.5 w-2.5 mr-0.5" /> State
                            </Badge>
                          )}
                          {app.converted_provider_id && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-50 text-green-700 border-green-200">
                              Converted
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                          <span>{app.contact_name}</span>
                          {app.trusted_service_categories && <span>· {app.trusted_service_categories.name}</span>}
                          {app.state && <span>· {app.city ? `${app.city}, ` : ""}{app.state}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground">{formatDate(app.created_at)}</span>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t bg-muted/10">
                        <div className="grid grid-cols-2 gap-3 py-3 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <a href={`mailto:${app.email}`} className="text-primary hover:underline">{app.email}</a>
                          </div>
                          {app.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <a href={`tel:${app.phone}`} className="text-primary hover:underline">{app.phone}</a>
                            </div>
                          )}
                          {app.website && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Globe className="h-3 w-3" />
                              <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{app.website.replace(/^https?:\/\/(www\.)?/, "")}</a>
                            </div>
                          )}
                          {(app.city || app.state) && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{[app.city, app.state].filter(Boolean).join(", ")}</span>
                            </div>
                          )}
                          {app.plan_type && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              {app.plan_type === "national"
                                ? <Globe className="h-3 w-3" />
                                : <MapPin className="h-3 w-3" />}
                              <span className="font-medium text-foreground">
                                {app.plan_type === "national"
                                  ? "National Plan — All States Access"
                                  : `State Plan — ${app.state || "State not set"}`}
                              </span>
                            </div>
                          )}
                          {app.trusted_service_categories && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <ShieldCheck className="h-3 w-3" />
                              <span>{app.trusted_service_categories.name}</span>
                            </div>
                          )}
                        </div>

                        {app.subcategory_ids && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {app.subcategory_ids.split(',').map(id => subcategoryMap[id]).filter(Boolean).map((name, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] bg-primary/5 border-primary/20">{name}</Badge>
                            ))}
                          </div>
                        )}

                        {app.service_description && (
                          <div className="bg-white border rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                              <FileText className="h-3 w-3" />
                              Service Description
                            </div>
                            <p className="text-xs text-foreground leading-relaxed">{app.service_description}</p>
                          </div>
                        )}

                        <div className="bg-white border rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                            Admin Notes
                          </div>
                          <Textarea
                            data-testid={`input-notes-${app.id}`}
                            value={editingNotes[app.id] ?? app.admin_notes ?? ""}
                            onChange={(e) => setEditingNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                            placeholder="Add internal notes about this prospect..."
                            rows={2}
                            className="text-xs"
                          />
                          {(editingNotes[app.id] !== undefined && editingNotes[app.id] !== (app.admin_notes ?? "")) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-2 text-xs"
                              data-testid={`button-save-notes-${app.id}`}
                              onClick={() => {
                                updateMutation.mutate({ id: app.id, admin_notes: editingNotes[app.id] });
                                setEditingNotes((prev) => {
                                  const next = { ...prev };
                                  delete next[app.id];
                                  return next;
                                });
                              }}
                            >
                              Save Notes
                            </Button>
                          )}
                        </div>

                        {app.stripe_checkout_url && app.status === "approved_pending_payment" && (
                          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-1.5 text-[10px] text-purple-700 uppercase tracking-wide mb-1.5">
                              <CreditCard className="h-3 w-3" />
                              Payment Link
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                readOnly
                                value={app.stripe_checkout_url}
                                className="flex-1 text-[11px] bg-white border rounded px-2 py-1 text-muted-foreground truncate"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                data-testid={`button-copy-link-${app.id}`}
                                onClick={() => {
                                  navigator.clipboard.writeText(app.stripe_checkout_url!);
                                  toast({ title: "Copied", description: "Payment link copied to clipboard." });
                                }}
                              >
                                <Copy className="h-3 w-3" />
                                Copy
                              </Button>
                            </div>
                            <p className="text-[10px] text-purple-600 mt-1">Send this link to the partner to complete their subscription payment.</p>
                          </div>
                        )}

                        {app.stripe_subscription_id && (
                          <div className="bg-muted/50 rounded-lg px-3 py-2 mb-3 text-[10px] text-muted-foreground">
                            Stripe: Customer {app.stripe_customer_id?.slice(0, 18)}... · Subscription {app.stripe_subscription_id?.slice(0, 18)}...
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex-1 min-w-[140px]">
                            <Select
                              value={app.status}
                              onValueChange={(v) => updateMutation.mutate({ id: app.id, status: v })}
                            >
                              <SelectTrigger className="h-8 text-xs" data-testid={`select-status-${app.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="prospect">Prospect</SelectItem>
                                <SelectItem value="pending">Pending Review</SelectItem>
                                <SelectItem value="approved_pending_payment">Awaiting Payment</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {!app.stripe_subscription_id && app.category_id && app.status !== "active" && app.status !== "approved_pending_payment" && (
                            <Button
                              size="sm"
                              className="text-xs gap-1 bg-purple-600 hover:bg-purple-700"
                              data-testid={`button-approve-${app.id}`}
                              disabled={approveMutation.isPending}
                              onClick={() => {
                                if (confirm(`Approve "${app.company_name}" and generate a Stripe payment link? The partner will not be visible until they pay.`)) {
                                  approveMutation.mutate(app.id);
                                }
                              }}
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                              Approve & Send Payment
                            </Button>
                          )}

                          {!app.converted_provider_id && app.category_id && app.status === "active" && (
                            <Button
                              size="sm"
                              className="text-xs gap-1 bg-green-600 hover:bg-green-700"
                              data-testid={`button-convert-${app.id}`}
                              disabled={convertMutation.isPending}
                              onClick={() => {
                                if (confirm(`Convert "${app.company_name}" into an active Trusted Services provider? This will create a new provider listing.`)) {
                                  convertMutation.mutate(app.id);
                                }
                              }}
                            >
                              <ArrowRightCircle className="h-3.5 w-3.5" />
                              Convert to Provider
                            </Button>
                          )}

                          {!app.converted_provider_id && !app.category_id && (
                            <p className="text-[10px] text-amber-600">Assign a category before converting</p>
                          )}
                        </div>

                        {/* === Upgrade #6: Archive / Delete action row === */}
                        <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t">
                          {app.status === "archived" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 text-xs gap-1"
                              data-testid={`button-unarchive-${app.id}`}
                              disabled={unarchiveMutation.isPending}
                              onClick={() => unarchiveMutation.mutate(app.id)}
                            >
                              <ArchiveRestore className="h-3.5 w-3.5" />
                              Restore from Archive
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 text-xs gap-1"
                              data-testid={`button-archive-${app.id}`}
                              disabled={archiveMutation.isPending}
                              onClick={() => {
                                if (confirm(`Archive "${app.company_name}"? This hides it from active lists but preserves all attribution and Stripe history. Reversible.`)) {
                                  archiveMutation.mutate(app.id);
                                }
                              }}
                            >
                              <Archive className="h-3.5 w-3.5" />
                              Archive
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            data-testid={`button-delete-open-${app.id}`}
                            onClick={() => openDeletePanel(app.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete…
                          </Button>
                        </div>

                        {/* === Inline delete preflight panel === */}
                        {deleteOpenId === app.id && (
                          <div className="mt-3 border border-red-200 bg-red-50/40 rounded-lg p-3" data-testid={`delete-panel-${app.id}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <p className="text-xs font-semibold text-red-800">Delete preview — {app.company_name}</p>
                              <button
                                className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
                                data-testid={`button-delete-cancel-${app.id}`}
                                onClick={() => { setDeleteOpenId(null); setPreflight(null); setForceConfirmName(""); }}
                              >
                                Cancel
                              </button>
                            </div>

                            {preflightLoading && <p className="text-xs text-muted-foreground">Checking dependencies…</p>}

                            {preflight && preflight.blockers.length === 0 && (
                              <>
                                <p className="text-xs text-green-700 mb-2">
                                  No linked records found. Safe to permanently delete.
                                </p>
                                <Button
                                  size="sm"
                                  className="h-9 text-xs gap-1 bg-red-600 hover:bg-red-700 text-white"
                                  data-testid={`button-delete-confirm-${app.id}`}
                                  disabled={deleteMutation.isPending}
                                  onClick={() => deleteMutation.mutate({ id: app.id })}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Permanently Delete
                                </Button>
                              </>
                            )}

                            {preflight && preflight.blockers.length > 0 && (
                              <>
                                <p className="text-xs text-red-800 mb-2 font-medium">
                                  Blockers found — delete will destroy the records below.
                                  Use <span className="font-semibold">Archive</span> to preserve history.
                                </p>
                                <ul className="space-y-1 mb-3">
                                  {preflight.blockers.map((b, i) => (
                                    <li key={i} className="text-[11px] text-red-700 flex items-start gap-1.5">
                                      <span className={`mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                                        b.severity === "high" ? "bg-red-600" : b.severity === "medium" ? "bg-amber-500" : "bg-slate-400"
                                      }`} />
                                      <span>{b.message}</span>
                                    </li>
                                  ))}
                                </ul>
                                <div className="bg-white border border-red-200 rounded p-2">
                                  <p className="text-[10px] text-red-700 mb-1.5 uppercase tracking-wide font-semibold">
                                    Force-delete confirmation (Master Admin)
                                  </p>
                                  <p className="text-[11px] text-muted-foreground mb-2">
                                    Type the exact company name to enable destructive cascade:
                                    <span className="ml-1 font-mono text-foreground">{app.company_name}</span>
                                  </p>
                                  <Input
                                    data-testid={`input-force-confirm-${app.id}`}
                                    value={forceConfirmName}
                                    onChange={(e) => setForceConfirmName(e.target.value)}
                                    placeholder="Type company name…"
                                    className="h-9 text-xs mb-2"
                                  />
                                  <Button
                                    size="sm"
                                    className="h-9 text-xs gap-1 bg-red-600 hover:bg-red-700 text-white"
                                    data-testid={`button-force-delete-${app.id}`}
                                    disabled={forceConfirmName.trim() !== app.company_name.trim() || deleteMutation.isPending}
                                    onClick={() => deleteMutation.mutate({ id: app.id, force: true, confirmCompany: forceConfirmName })}
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Force-Delete with Cascade
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPartnerProspects() {
  return <AdminAuthGuard><AdminPartnerProspectsInner /></AdminAuthGuard>;
}
