import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
};

export default function AdminPartnerProspects() {
  const [, setLocation] = useLocation();
  const adminKey = localStorage.getItem("adminKey") || "";
  const isAdmin = !!adminKey;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

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
      toast({ title: "Converted", description: "Partner application has been converted to an active Trusted Services & Products provider." });
    },
    onError: (err: any) => {
      toast({ title: "Conversion Failed", description: err.message, variant: "destructive" });
    },
  });

  

  const statusCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
              <p className="text-xs text-muted-foreground">{applications.length} total applications</p>
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

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { key: "all", label: "All" },
            { key: "prospect", label: "Prospects" },
            { key: "pending", label: "Pending" },
            { key: "approved_pending_payment", label: "Awaiting Payment" },
            { key: "active", label: "Active" },
            { key: "inactive", label: "Inactive" },
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
              {f.key === "all" ? ` (${applications.length})` : ""}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading applications...</div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No partner applications yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Applications submitted through the partner form will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
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
                                if (confirm(`Convert "${app.company_name}" into an active Trusted Services & Products provider? This will create a new provider listing.`)) {
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
