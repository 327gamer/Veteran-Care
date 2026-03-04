
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  Lock,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { type SupabaseCategory } from "@/lib/category-config";
import { useLocation } from "wouter";

interface AdminResource {
  id: string;
  title: string;
  short_description: string | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  status: string;
  source_name: string | null;
  submitted_by_name: string | null;
  submitted_by_email: string | null;
  notes_internal: string | null;
  category_id: string | null;
  eligibility: string | null;
  created_at: string;
  categories: { id: string; name: string; slug: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

export default function AdminResources() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResource, setSelectedResource] = useState<AdminResource | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [, setLocation] = useLocation();

  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<SupabaseCategory[]>({
    queryKey: ["/api/categories"],
    queryFn: () => fetch("/api/categories").then(r => r.json()),
    enabled: authenticated,
  });

  const { data: resources = [], isLoading } = useQuery<AdminResource[]>({
    queryKey: ["/api/admin/resources", statusFilter, searchQuery, adminKey],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("q", searchQuery);
      return fetch(`/api/admin/resources?${params}`, {
        headers: { "x-admin-key": adminKey },
      }).then(r => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      });
    },
    enabled: authenticated,
  });

  const patchMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      setSelectedResource(null);
      toast({ description: "Resource updated successfully" });
    },
    onError: (err: Error) => {
      toast({ description: err.message, variant: "destructive" });
    },
  });

  const handleLogin = () => {
    fetch("/api/admin/resources?status=pending", {
      headers: { "x-admin-key": adminKey },
    }).then(r => {
      if (r.ok) {
        setAuthenticated(true);
      } else {
        toast({ description: "Invalid admin key", variant: "destructive" });
      }
    });
  };

  const openResource = (resource: AdminResource) => {
    setSelectedResource(resource);
    setEditForm({
      title: resource.title || "",
      short_description: resource.short_description || "",
      website_url: resource.website_url || "",
      phone: resource.phone || "",
      email: resource.email || "",
      city: resource.city || "",
      state: resource.state || "",
      zip: resource.zip || "",
      eligibility: resource.eligibility || "",
      source_name: resource.source_name || "",
      notes_internal: resource.notes_internal || "",
      category_id: resource.category_id || "",
    });
  };

  const handleApprove = () => {
    if (!selectedResource) return;
    patchMutation.mutate({
      id: selectedResource.id,
      updates: { ...editForm, status: "approved" },
    });
  };

  const handleReject = () => {
    if (!selectedResource) return;
    patchMutation.mutate({
      id: selectedResource.id,
      updates: { ...editForm, status: "rejected" },
    });
  };

  const handleSave = () => {
    if (!selectedResource) return;
    patchMutation.mutate({
      id: selectedResource.id,
      updates: editForm,
    });
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-heading">Admin Access</CardTitle>
            <p className="text-sm text-muted-foreground">Enter your admin key to manage resources.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-key">Admin Key</Label>
              <Input
                data-testid="input-admin-key"
                id="admin-key"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Enter admin key"
              />
            </div>
            <Button data-testid="button-admin-login" className="w-full" onClick={handleLogin}>
              <ShieldCheck className="h-4 w-4 mr-2" /> Authenticate
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingCount = resources.filter(r => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-heading font-bold">Admin — Resource Review</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-testid="button-analytics"
              variant="ghost"
              size="sm"
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10"
              onClick={() => setLocation("/admin/analytics")}
            >
              <BarChart3 className="h-4 w-4 mr-1.5" /> Analytics
            </Button>
            <Button data-testid="button-sign-out" variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10" onClick={() => { setAuthenticated(false); setAdminKey(""); }}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            {(["pending", "approved", "rejected"] as const).map((s) => {
              const cfg = STATUS_CONFIG[s];
              return (
                <Button
                  key={s}
                  data-testid={`filter-${s}`}
                  variant={statusFilter === s ? "default" : "outline"}
                  size="sm"
                  className="h-9 text-xs capitalize"
                  onClick={() => setStatusFilter(s)}
                >
                  <cfg.icon className="h-3.5 w-3.5 mr-1.5" />
                  {cfg.label}
                </Button>
              );
            })}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              data-testid="input-admin-search"
              className="pl-9 h-9 text-xs"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading && <p className="text-center text-muted-foreground py-8">Loading...</p>}

        <div className="space-y-3">
          {resources.map((resource) => {
            const cfg = STATUS_CONFIG[resource.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            return (
              <Card
                key={resource.id}
                data-testid={`admin-resource-${resource.id}`}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => openResource(resource)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{resource.title}</h3>
                        <Badge className={`text-[10px] h-5 border ${cfg.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{resource.short_description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {resource.categories && <span>{resource.categories.name}</span>}
                        {resource.state && <span>• {resource.state}</span>}
                        {resource.submitted_by_name && <span>• by {resource.submitted_by_name}</span>}
                        <span>• {new Date(resource.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!isLoading && resources.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No {statusFilter} resources found.</p>
          )}
        </div>
      </main>

      <Sheet open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col h-[100dvh]">
          <SheetHeader className="bg-primary px-5 py-4 text-primary-foreground shrink-0">
            <SheetTitle className="text-lg font-heading text-white">{editForm.title || "Edit Resource"}</SheetTitle>
            {selectedResource && (
              <div className="flex items-center gap-2 text-xs text-primary-foreground/70">
                <span>Status: {selectedResource.status}</span>
                {selectedResource.submitted_by_email && <span>• {selectedResource.submitted_by_email}</span>}
              </div>
            )}
          </SheetHeader>

          <ScrollArea className="flex-1 w-full">
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Category</Label>
                <Select value={editForm.category_id || ""} onValueChange={(v) => setEditForm(p => ({ ...p, category_id: v }))}>
                  <SelectTrigger data-testid="select-admin-category" className="h-9 text-xs">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Title</Label>
                <Input data-testid="input-admin-title" className="h-9 text-xs" value={editForm.title || ""} onChange={(e) => setEditForm(p => ({ ...p, title: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Description</Label>
                <Textarea data-testid="input-admin-description" className="text-xs" rows={3} value={editForm.short_description || ""} onChange={(e) => setEditForm(p => ({ ...p, short_description: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Website URL</Label>
                <Input className="h-9 text-xs" value={editForm.website_url || ""} onChange={(e) => setEditForm(p => ({ ...p, website_url: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Phone</Label>
                  <Input className="h-9 text-xs" value={editForm.phone || ""} onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Email</Label>
                  <Input className="h-9 text-xs" value={editForm.email || ""} onChange={(e) => setEditForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">City</Label>
                  <Input className="h-9 text-xs" value={editForm.city || ""} onChange={(e) => setEditForm(p => ({ ...p, city: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">State</Label>
                  <Input className="h-9 text-xs" value={editForm.state || ""} onChange={(e) => setEditForm(p => ({ ...p, state: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">ZIP</Label>
                  <Input className="h-9 text-xs" value={editForm.zip || ""} onChange={(e) => setEditForm(p => ({ ...p, zip: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Source Name</Label>
                <Input className="h-9 text-xs" value={editForm.source_name || ""} onChange={(e) => setEditForm(p => ({ ...p, source_name: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Eligibility</Label>
                <Input className="h-9 text-xs" value={editForm.eligibility || ""} onChange={(e) => setEditForm(p => ({ ...p, eligibility: e.target.value }))} />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs">Internal Notes (admin only)</Label>
                <Textarea data-testid="input-admin-notes" className="text-xs" rows={2} value={editForm.notes_internal || ""} onChange={(e) => setEditForm(p => ({ ...p, notes_internal: e.target.value }))} placeholder="Private notes for the admin team..." />
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="p-3 border-t bg-muted/10 shrink-0">
            <div className="flex gap-2 w-full">
              <Button
                data-testid="button-reject"
                variant="destructive"
                size="sm"
                className="flex-1 h-9 text-xs"
                onClick={handleReject}
                disabled={patchMutation.isPending}
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
              </Button>
              <Button
                data-testid="button-save-changes"
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs"
                onClick={handleSave}
                disabled={patchMutation.isPending}
              >
                Save Changes
              </Button>
              <Button
                data-testid="button-approve"
                size="sm"
                className="flex-1 h-9 text-xs bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={patchMutation.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Approve
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
