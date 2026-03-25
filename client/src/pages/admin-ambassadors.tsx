import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Copy,
  Check,
  Download,
  QrCode,
  Link2,
  MessageSquare,
  Users,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  Plus,
  MousePointerClick,
  Mail,
  MapPin,
  Loader2,
  Phone,
  Edit2,
  Save,
  X,
  Activity,
  Clock,
  BarChart3,
  FileText,
  User,
} from "lucide-react";
import { useLocation } from "wouter";

interface AmbassadorSummary {
  ambassador_id: string;
  ambassador_code: string;
  ambassador_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  region: string | null;
  status: string;
  link_count: number;
  active_count: number;
  total_clicks: number;
  last_activity: string | null;
  notes: string | null;
  created_at: string;
}

interface AmbassadorLink {
  id: string;
  link_name: string;
  utm_id: string;
  full_url: string;
  short_url: string | null;
  audience_type: string;
  channel_type: string;
  click_count: number;
  first_clicked_at: string | null;
  last_clicked_at: string | null;
  is_active: boolean;
  created_at: string;
}

interface AmbassadorDetail {
  id: string;
  code: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  region_type: string | null;
  region_value: string | null;
  status: string;
  notes: string | null;
  commission_rate: number | null;
  created_at: string;
  updated_at: string | null;
  links: AmbassadorLink[];
  activity: {
    total_links: number;
    active_links: number;
    total_clicks: number;
    first_activity: string | null;
    last_activity: string | null;
  };
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
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const AUDIENCE_LABELS: Record<string, string> = {
  general: "General Public",
  veteran: "Veterans",
  case_manager: "Case Managers & Nonprofits",
  partner: "Partners & Businesses",
};

function getAdminHeaders(): Record<string, string> {
  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (adminKey) h["x-admin-key"] = adminKey;
  return h;
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
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
      {copied ? (
        <><Check className="h-3 w-3 text-green-600" /><span className="text-green-600">Copied</span></>
      ) : (
        <><Copy className="h-3 w-3" /><span>{label || "Copy"}</span></>
      )}
    </Button>
  );
}

function CreateAmbassadorForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    ambassador_name: "",
    email: "",
    phone: "",
    region_type: "",
    region_value: "",
    notes: "",
  });

  const headers = getAdminHeaders();

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch("/api/admin/ambassador-links/generate", {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create ambassador");
      }
      return res.json();
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const displayName = formData.ambassador_name ||
    [formData.first_name, formData.last_name].filter(Boolean).join(" ");

  return (
    <Card className="mb-4 border-blue-200" data-testid="card-create-ambassador">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Add New Ambassador</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">First Name</label>
            <Input
              placeholder="Tracy"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              data-testid="input-first-name"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Last Name</label>
            <Input
              placeholder="Johnson"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              data-testid="input-last-name"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Display Name *</label>
          <Input
            placeholder="Tracy Johnson"
            value={formData.ambassador_name}
            onChange={(e) => setFormData({ ...formData, ambassador_name: e.target.value })}
            data-testid="input-ambassador-name"
          />
          {!formData.ambassador_name && displayName && (
            <p className="text-[10px] text-muted-foreground mt-0.5">Will use: {displayName}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
            <Input
              type="email"
              placeholder="tracy@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              data-testid="input-ambassador-email"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Phone</label>
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              data-testid="input-ambassador-phone"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Region Type</label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={formData.region_type}
              onChange={(e) => setFormData({ ...formData, region_type: e.target.value })}
              data-testid="select-region-type"
            >
              <option value="">Select...</option>
              <option value="state">State</option>
              <option value="county">County</option>
              <option value="city">City</option>
              <option value="region">Region</option>
              <option value="national">National</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Region Value</label>
            <Input
              placeholder="e.g. Upstate SC"
              value={formData.region_value}
              onChange={(e) => setFormData({ ...formData, region_value: e.target.value })}
              data-testid="input-region-value"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Notes</label>
          <textarea
            className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
            placeholder="Internal notes about this ambassador..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            data-testid="input-ambassador-notes"
          />
        </div>
        {createMutation.isError && (
          <p className="text-xs text-red-600" data-testid="text-create-error">
            {(createMutation.error as Error).message}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={!(formData.ambassador_name.trim() || displayName.trim()) || createMutation.isPending}
            onClick={() => {
              const payload: Record<string, string> = {
                ambassador_name: formData.ambassador_name.trim() || displayName.trim(),
              };
              if (formData.first_name.trim()) payload.first_name = formData.first_name.trim();
              if (formData.last_name.trim()) payload.last_name = formData.last_name.trim();
              if (formData.email.trim()) payload.email = formData.email.trim();
              if (formData.phone.trim()) payload.phone = formData.phone.trim();
              if (formData.region_type) payload.region_type = formData.region_type;
              if (formData.region_value.trim()) payload.region = formData.region_value.trim();
              if (formData.notes.trim()) payload.notes = formData.notes.trim();
              createMutation.mutate(payload);
            }}
            data-testid="button-submit-ambassador"
          >
            {createMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Creating...</>
            ) : (
              "Create & Generate Links"
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose} data-testid="button-cancel-add">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AmbassadorDetailView({ ambassadorId, onBack }: { ambassadorId: string; onBack: () => void }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const headers = getAdminHeaders();
  const queryClient = useQueryClient();

  const { data: amb, isLoading } = useQuery<AmbassadorDetail>({
    queryKey: ["admin-ambassador-detail", ambassadorId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/ambassadors/${ambassadorId}`, { headers });
      if (!res.ok) throw new Error("Failed to load ambassador");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch(`/api/admin/ambassadors/${ambassadorId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ambassador-detail", ambassadorId] });
      queryClient.invalidateQueries({ queryKey: ["admin-ambassadors"] });
      setEditing(false);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!amb) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <p className="text-center text-muted-foreground mt-8">Ambassador not found.</p>
      </div>
    );
  }

  const startEdit = () => {
    setEditData({
      display_name: amb.display_name || "",
      first_name: amb.first_name || "",
      last_name: amb.last_name || "",
      email: amb.email || "",
      phone: amb.phone || "",
      region_type: amb.region_type || "",
      region_value: amb.region_value || "",
      status: amb.status || "active",
      notes: amb.notes || "",
    });
    setEditing(true);
  };

  const saveEdit = () => {
    const payload: Record<string, string> = {};
    for (const [k, v] of Object.entries(editData)) {
      const original = (amb as any)[k] || "";
      if (v !== original) payload[k] = v;
    }
    if (Object.keys(payload).length === 0) {
      setEditing(false);
      return;
    }
    updateMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {!editing && (
            <Button variant="outline" size="sm" onClick={startEdit} data-testid="button-edit-ambassador">
              <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
          )}
        </div>

        <Card className="mb-4" data-testid="card-ambassador-profile">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-slate-400" />
                <CardTitle className="text-lg" data-testid="text-ambassador-name">
                  {amb.display_name}
                </CardTitle>
                <Badge
                  variant={amb.status === "active" ? "default" : "outline"}
                  className={`text-xs ${amb.status !== "active" ? "text-orange-600 border-orange-300" : ""}`}
                  data-testid="badge-status"
                >
                  {amb.status}
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Code: {amb.code} &middot; Since {formatDate(amb.created_at)}</p>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">First Name</label>
                    <Input value={editData.first_name} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} data-testid="edit-first-name" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Last Name</label>
                    <Input value={editData.last_name} onChange={(e) => setEditData({ ...editData, last_name: e.target.value })} data-testid="edit-last-name" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Display Name</label>
                  <Input value={editData.display_name} onChange={(e) => setEditData({ ...editData, display_name: e.target.value })} data-testid="edit-display-name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
                    <Input type="email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} data-testid="edit-email" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Phone</label>
                    <Input type="tel" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} data-testid="edit-phone" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Region Type</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                      value={editData.region_type}
                      onChange={(e) => setEditData({ ...editData, region_type: e.target.value })}
                      data-testid="edit-region-type"
                    >
                      <option value="">Select...</option>
                      <option value="state">State</option>
                      <option value="county">County</option>
                      <option value="city">City</option>
                      <option value="region">Region</option>
                      <option value="national">National</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Region Value</label>
                    <Input value={editData.region_value} onChange={(e) => setEditData({ ...editData, region_value: e.target.value })} data-testid="edit-region-value" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    data-testid="edit-status"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Notes</label>
                  <textarea
                    className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    data-testid="edit-notes"
                  />
                </div>
                {updateMutation.isError && (
                  <p className="text-xs text-red-600">{(updateMutation.error as Error).message}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit} disabled={updateMutation.isPending} data-testid="button-save-edit">
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)} data-testid="button-cancel-edit">
                    <X className="h-3.5 w-3.5 mr-1" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {(amb.first_name || amb.last_name) && (
                    <div>
                      <span className="text-xs text-muted-foreground">Name</span>
                      <p className="font-medium">{[amb.first_name, amb.last_name].filter(Boolean).join(" ")}</p>
                    </div>
                  )}
                  {amb.email && (
                    <div>
                      <span className="text-xs text-muted-foreground">Email</span>
                      <p className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-400" />{amb.email}</p>
                    </div>
                  )}
                  {amb.phone && (
                    <div>
                      <span className="text-xs text-muted-foreground">Phone</span>
                      <p className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-400" />{amb.phone}</p>
                    </div>
                  )}
                  {(amb.region_type || amb.region_value) && (
                    <div>
                      <span className="text-xs text-muted-foreground">Region</span>
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        {[amb.region_value, amb.region_type ? `(${amb.region_type})` : ""].filter(Boolean).join(" ")}
                      </p>
                    </div>
                  )}
                  {amb.commission_rate != null && (
                    <div>
                      <span className="text-xs text-muted-foreground">Commission Rate</span>
                      <p className="font-medium" data-testid="text-commission-rate">{amb.commission_rate}%</p>
                    </div>
                  )}
                </div>
                {amb.notes && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><FileText className="h-3 w-3" /> Notes</span>
                    <p className="text-sm text-slate-700 whitespace-pre-line">{amb.notes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-4" data-testid="card-activity-summary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" /> Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600" data-testid="stat-total-links">{amb.activity.total_links}</p>
                <p className="text-xs text-muted-foreground">Total Links</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600" data-testid="stat-active-links">{amb.activity.active_links}</p>
                <p className="text-xs text-muted-foreground">Active Links</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-600" data-testid="stat-total-clicks">{amb.activity.total_clicks}</p>
                <p className="text-xs text-muted-foreground">Total Clicks</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-sm font-medium" data-testid="stat-last-activity">
                  {amb.activity.last_activity ? timeAgo(amb.activity.last_activity) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">Last Activity</p>
              </div>
            </div>
            {amb.activity.first_activity && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                First activity: {formatDate(amb.activity.first_activity)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-owned-links">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Link2 className="h-4 w-4" /> Owned Links ({amb.links.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {amb.links.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No links generated yet.</p>
            ) : (
              <div className="space-y-2">
                {amb.links.map((link) => (
                  <div
                    key={link.id}
                    className={`border rounded-lg p-3 ${link.is_active ? "bg-white" : "bg-slate-50 opacity-70"}`}
                    data-testid={`link-row-${link.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{link.link_name}</span>
                          {!link.is_active && (
                            <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                          <span>{AUDIENCE_LABELS[link.audience_type] || link.audience_type}</span>
                          <span>&middot;</span>
                          <span>{link.channel_type}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end">
                          <MousePointerClick className="h-3 w-3 text-slate-400" />
                          <span className={`text-sm font-medium ${link.click_count > 0 ? "text-blue-600" : "text-slate-400"}`}>
                            {link.click_count}
                          </span>
                        </div>
                        {link.last_clicked_at && (
                          <p className="text-[10px] text-muted-foreground">{timeAgo(link.last_clicked_at)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      <div className="flex items-center gap-1 bg-slate-50 rounded px-2 py-1 text-xs flex-1 min-w-0">
                        <Link2 className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate text-slate-600">{link.short_url || link.full_url}</span>
                      </div>
                      <CopyButton value={link.short_url || link.full_url} label={`link-${link.id}`} />
                      <a
                        href={link.short_url || link.full_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 h-7 px-2 text-xs rounded-md border hover:bg-slate-50"
                        data-testid={`test-link-${link.id}`}
                      >
                        <ExternalLink className="h-3 w-3" /> Test
                      </a>
                    </div>
                    {link.first_clicked_at && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        First click: {formatDate(link.first_clicked_at)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminAmbassadors() {
  const [, navigate] = useLocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;
  const headers = getAdminHeaders();
  const queryClient = useQueryClient();

  const { data: ambassadors, isLoading: loadingList } = useQuery<{ ambassadors: AmbassadorSummary[] }>({
    queryKey: ["admin-ambassadors"],
    queryFn: async () => {
      const res = await fetch("/api/admin/ambassadors", { headers });
      if (!res.ok) throw new Error("Failed to load ambassadors");
      return res.json();
    },
    enabled: !!adminKey,
  });

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

  if (selectedId) {
    return (
      <AmbassadorDetailView
        ambassadorId={selectedId}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  const filteredAmbassadors = ambassadors?.ambassadors?.filter((a) =>
    !searchInput ||
    a.ambassador_name.toLowerCase().includes(searchInput.toLowerCase()) ||
    a.ambassador_code.toLowerCase().includes(searchInput.toLowerCase()) ||
    (a.email && a.email.toLowerCase().includes(searchInput.toLowerCase())) ||
    (a.region && a.region.toLowerCase().includes(searchInput.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4 mr-1" /> Admin
            </Button>
            <h1 className="text-lg font-bold">Ambassadors</h1>
            {ambassadors?.ambassadors && (
              <Badge variant="secondary" className="text-xs">{ambassadors.ambassadors.length}</Badge>
            )}
          </div>
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} data-testid="button-add-ambassador">
            <Plus className="h-4 w-4 mr-1" /> Add Ambassador
          </Button>
        </div>

        {showAddForm && (
          <CreateAmbassadorForm
            onClose={() => setShowAddForm(false)}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-ambassadors"] })}
          />
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, email, or region..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
            data-testid="input-search-ambassador"
          />
        </div>

        {loadingList && <p className="text-center text-muted-foreground py-8">Loading ambassadors...</p>}

        {!loadingList && (!filteredAmbassadors || filteredAmbassadors.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No ambassadors found.</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Add Ambassador" to create your first one.</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {filteredAmbassadors?.map((amb) => (
            <Card
              key={amb.ambassador_id}
              className="cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() => setSelectedId(amb.ambassador_id)}
              data-testid={`card-ambassador-${amb.ambassador_code}`}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm" data-testid={`text-name-${amb.ambassador_code}`}>{amb.ambassador_name}</p>
                      {amb.status !== "active" && (
                        <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300">{amb.status}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="font-mono">{amb.ambassador_code}</span>
                      <span>&middot;</span>
                      <span>{amb.link_count} links ({amb.active_count} active)</span>
                      {amb.region && (
                        <>
                          <span>&middot;</span>
                          <span className="inline-flex items-center gap-0.5"><MapPin className="h-3 w-3" />{amb.region}</span>
                        </>
                      )}
                      {amb.email && (
                        <>
                          <span>&middot;</span>
                          <span className="inline-flex items-center gap-0.5"><Mail className="h-3 w-3" />{amb.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <MousePointerClick className="h-3 w-3 text-slate-400" />
                        <span className={`text-sm font-medium ${amb.total_clicks > 0 ? "text-blue-600" : "text-slate-400"}`} data-testid={`text-clicks-${amb.ambassador_code}`}>
                          {amb.total_clicks}
                        </span>
                      </div>
                      {amb.last_activity && (
                        <p className="text-[10px] text-muted-foreground" data-testid={`text-activity-${amb.ambassador_code}`}>
                          {timeAgo(amb.last_activity)}
                        </p>
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
