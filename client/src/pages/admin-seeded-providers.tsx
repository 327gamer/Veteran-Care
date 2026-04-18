import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Globe,
  Phone,
  Shield,
  Building2,
} from "lucide-react";
import { useLocation } from "wouter";

interface SeededProvider {
  id: string;
  name: string;
  website_url: string | null;
  phone: string | null;
  contact_email: string | null;
  provider_type: string;
  is_seeded: boolean;
  seeded_source: string | null;
  partner_active: boolean;
  is_lead_enabled: boolean;
  active_paid_partner: boolean;
  trusted_service_id: string | null;
  category_id: string | null;
  category_slug: string | null;
  category_name: string | null;
  short_description: string | null;
  visible_in_directory: boolean | null;
  is_national: boolean | null;
  service_state: string | null;
  created_at: string;
}

interface Category {
  id: string;
  slug: string;
  name: string;
}

const ADMIN_KEY_STORAGE = "vc_admin_key";

function getAdminHeaders(): HeadersInit {
  const key = localStorage.getItem(ADMIN_KEY_STORAGE) || "";
  return { "x-admin-key": key, "Content-Type": "application/json" };
}

function AdminSeededProvidersInner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "",
    website_url: "",
    phone: "",
    contact_email: "",
    trusted_service_category_id: "",
    short_description: "",
    is_national: true,
    state: "",
    seeded_source: "admin-curated",
  });

  const { data: providersData, isLoading } = useQuery<{ providers: SeededProvider[]; count: number }>({
    queryKey: ["/api/admin/seeded-providers"],
    queryFn: async () => {
      const r = await fetch("/api/admin/seeded-providers", { headers: getAdminHeaders() });
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
  });

  const { data: catsData } = useQuery<{ categories: Category[] }>({
    queryKey: ["/api/admin/seeded-providers/categories"],
    queryFn: async () => {
      const r = await fetch("/api/admin/seeded-providers/categories", { headers: getAdminHeaders() });
      if (!r.ok) throw new Error("Failed to load categories");
      return r.json();
    },
  });

  const createMut = useMutation({
    mutationFn: async (body: typeof form) => {
      const r = await fetch("/api/admin/seeded-providers", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || "Create failed");
      return j;
    },
    onSuccess: () => {
      toast({ title: "Seeded provider created" });
      qc.invalidateQueries({ queryKey: ["/api/admin/seeded-providers"] });
      setShowCreate(false);
      setForm({
        name: "",
        website_url: "",
        phone: "",
        contact_email: "",
        trusted_service_category_id: "",
        short_description: "",
        is_national: true,
        state: "",
        seeded_source: "admin-curated",
      });
    },
    onError: (err: any) => {
      toast({ title: "Create failed", description: err.message, variant: "destructive" });
    },
  });

  const visibilityMut = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const r = await fetch(`/api/admin/seeded-providers/${id}/visibility`, {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ is_active }),
      });
      if (!r.ok) throw new Error("Toggle failed");
      return r.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/seeded-providers"] }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/seeded-providers/${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });
      if (!r.ok) throw new Error("Delete failed");
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Seeded provider removed" });
      qc.invalidateQueries({ queryKey: ["/api/admin/seeded-providers"] });
    },
  });

  const providers = providersData?.providers || [];
  const grouped = providers.reduce<Record<string, SeededProvider[]>>((acc, p) => {
    const key = p.category_name || "Uncategorized";
    (acc[key] = acc[key] || []).push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/admin/resources")}
          className="mb-4"
          data-testid="link-back-admin"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2" data-testid="text-page-title">
              <Building2 className="w-8 h-8 text-blue-600" />
              Seeded Providers
            </h1>
            <p className="text-slate-600 mt-1">
              National directory entries. Routing-ineligible. Billing-ineligible. Display only.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} data-testid="button-create-seeded">
            <Plus className="w-4 h-4 mr-2" /> Add Seeded Provider
          </Button>
        </div>

        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-900">
                <strong>Seeded Provider Safety:</strong> These records are hard-blocked at the
                database layer from receiving leads, being marked as paid partners, or triggering
                billing. They display in the directory as <em>"National Provider"</em> and are
                visually distinct from <em>"Trusted Partner"</em> records.
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading && <p className="text-slate-500" data-testid="text-loading">Loading…</p>}

        {!isLoading && providers.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500" data-testid="text-empty">
              No seeded providers yet. Click "Add Seeded Provider" to create the first one.
            </CardContent>
          </Card>
        )}

        {Object.entries(grouped).map(([catName, list]) => (
          <Card key={catName} className="mb-6" data-testid={`card-category-${catName}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {catName}
                <Badge variant="secondary" data-testid={`badge-count-${catName}`}>{list.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {list.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border rounded-lg bg-white"
                  data-testid={`row-provider-${p.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900" data-testid={`text-name-${p.id}`}>
                        {p.name}
                      </span>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100" data-testid={`badge-type-${p.id}`}>
                        Seeded · National Provider
                      </Badge>
                      {!p.visible_in_directory && (
                        <Badge variant="outline" className="text-slate-500" data-testid={`badge-hidden-${p.id}`}>
                          Hidden from directory
                        </Badge>
                      )}
                      {!p.partner_active && (
                        <Badge variant="outline" className="text-red-600 border-red-300" data-testid={`badge-deleted-${p.id}`}>
                          Removed
                        </Badge>
                      )}
                    </div>
                    {p.short_description && (
                      <p className="text-sm text-slate-600 mt-1" data-testid={`text-desc-${p.id}`}>
                        {p.short_description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 flex-wrap">
                      {p.website_url && (
                        <span className="flex items-center gap-1" data-testid={`text-website-${p.id}`}>
                          <Globe className="w-3 h-3" /> {p.website_url}
                        </span>
                      )}
                      {p.phone && (
                        <span className="flex items-center gap-1" data-testid={`text-phone-${p.id}`}>
                          <Phone className="w-3 h-3" /> {p.phone}
                        </span>
                      )}
                      <span data-testid={`text-source-${p.id}`}>source: {p.seeded_source}</span>
                      <span className="text-green-700" data-testid={`status-routing-${p.id}`}>
                        ✓ routing-blocked
                      </span>
                      <span className="text-green-700" data-testid={`status-billing-${p.id}`}>
                        ✓ billing-blocked
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        visibilityMut.mutate({ id: p.id, is_active: !p.visible_in_directory })
                      }
                      disabled={visibilityMut.isPending || !p.partner_active}
                      data-testid={`button-toggle-${p.id}`}
                    >
                      {p.visible_in_directory ? (
                        <>
                          <ToggleRight className="w-4 h-4 mr-1 text-green-600" /> Visible
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4 mr-1 text-slate-400" /> Hidden
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Remove seeded provider "${p.name}"?`)) {
                          deleteMut.mutate(p.id);
                        }
                      }}
                      disabled={deleteMut.isPending || !p.partner_active}
                      data-testid={`button-delete-${p.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Seeded Provider</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  data-testid="input-name"
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Select
                  value={form.trusted_service_category_id}
                  onValueChange={(v) => setForm({ ...form, trusted_service_category_id: v })}
                >
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(catsData?.categories || []).map((c) => (
                      <SelectItem key={c.id} value={c.id} data-testid={`option-cat-${c.slug}`}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Website URL</Label>
                <Input
                  value={form.website_url}
                  onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                  placeholder="https://example.com"
                  data-testid="input-website"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  data-testid="input-phone"
                />
              </div>
              <div>
                <Label>Short Description</Label>
                <Textarea
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                  rows={3}
                  data-testid="input-description"
                />
              </div>
              <div>
                <Label>Source Tag</Label>
                <Input
                  value={form.seeded_source}
                  onChange={(e) => setForm({ ...form, seeded_source: e.target.value })}
                  placeholder="admin-curated"
                  data-testid="input-source"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)} data-testid="button-cancel">
                Cancel
              </Button>
              <Button
                onClick={() => createMut.mutate(form)}
                disabled={createMut.isPending || !form.name || !form.trusted_service_category_id}
                data-testid="button-submit-create"
              >
                {createMut.isPending ? "Creating…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function AdminSeededProviders() {
  return (
    <AdminAuthGuard>
      <AdminSeededProvidersInner />
    </AdminAuthGuard>
  );
}
