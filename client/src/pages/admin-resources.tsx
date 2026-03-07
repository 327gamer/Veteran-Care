
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  ExternalLink,
  Lock,
  ShieldCheck,
  BarChart3,
  Users,
  Phone,
  Mail,
  MessageSquare,
  Plus,
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  SkipForward,
  MapPinned,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { type SupabaseCategory } from "@/lib/category-config";
import { useLocation } from "wouter";

interface NavigatorRequest {
  id: string;
  resource_id: string | null;
  resource_title: string | null;
  veteran_name: string;
  veteran_phone: string | null;
  veteran_email: string | null;
  message: string | null;
  preferred_contact: string;
  user_state: string | null;
  user_city: string | null;
  user_zip: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface AdminResource {
  id: string;
  title: string;
  short_description: string | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  status: string;
  source_name: string | null;
  source_type: string | null;
  submitted_by_name: string | null;
  submitted_by_email: string | null;
  notes_internal: string | null;
  category_id: string | null;
  subcategory: string | null;
  service_priority: string | null;
  eligibility: string | null;
  sponsored: boolean;
  monetization_type: string | null;
  affiliate_url: string | null;
  latitude: number | null;
  longitude: number | null;
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
  const [activeTab, setActiveTab] = useState<"resources" | "leads">("resources");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResource, setSelectedResource] = useState<AdminResource | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [, setLocation] = useLocation();
  const [leadStatusFilter, setLeadStatusFilter] = useState("new");
  const [createMode, setCreateMode] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvRows, setCsvRows] = useState<Record<string, any>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResults, setCsvResults] = useState<{ created: number; skipped: number; errors: number; results: any[] } | null>(null);
  const [csvPreview, setCsvPreview] = useState<{ valid: any[]; issues: { row: number; title: string; reason: string; type: "skip" | "warn" }[] } | null>(null);
  const [geocodeRunning, setGeocodeRunning] = useState(false);
  const [geocodeProgress, setGeocodeProgress] = useState<{
    current: number; total: number; geocoded: number; failed: number; lastTitle?: string;
  } | null>(null);
  const [geocodeResult, setGeocodeResult] = useState<{
    geocoded: number; failed: number; total: number; skippedNoAddress: number;
    failures: { id: string; title: string; reason: string }[];
  } | null>(null);

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
    enabled: authenticated && activeTab === "resources",
  });

  const { data: navRequests = [], isLoading: navLoading } = useQuery<NavigatorRequest[]>({
    queryKey: ["/api/admin/navigator-requests", leadStatusFilter, adminKey],
    queryFn: () => {
      const params = new URLSearchParams();
      if (leadStatusFilter) params.set("status", leadStatusFilter);
      return fetch(`/api/admin/navigator-requests?${params}`, {
        headers: { "x-admin-key": adminKey },
      }).then(r => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      });
    },
    enabled: authenticated && activeTab === "leads",
  });

  const navPatchMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const res = await fetch(`/api/admin/navigator-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith("/api/admin/navigator-requests") });
      toast({ description: "Lead updated" });
    },
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

  const createMutation = useMutation({
    mutationFn: async (resource: Record<string, any>) => {
      const res = await fetch("/api/admin/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(resource),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      setSelectedResource(null);
      setCreateMode(false);
      toast({ description: "Resource created successfully" });
    },
    onError: (err: Error) => {
      toast({ description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    createMutation.mutate(editForm);
  };

  const openCreateForm = () => {
    setCreateMode(true);
    setSelectedResource({ id: "__new__" } as any);
    setEditForm({
      title: "",
      short_description: "",
      website_url: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      eligibility: "",
      source_name: "",
      source_type: "",
      notes_internal: "",
      category_id: "",
      subcategory: "",
      service_priority: "",
      status: "approved",
      sponsored: false,
      monetization_type: "",
      affiliate_url: "",
      latitude: null,
      longitude: null,
    });
  };

  const CSV_TEMPLATE_HEADERS = [
    "title","category","subcategory","service_priority","short_description","website_url","phone","email",
    "address","city","state","zip","eligibility","source_name","source_type",
    "monetization_type","affiliate_url","sponsored","status","latitude","longitude"
  ];

  const CSV_TEMPLATE_ROWS = [
    [
      "SC Veterans Affairs Regional Office",
      "VA Benefits",
      "Claims Assistance",
      "standard",
      "Full-service VA regional office for claims, appeals, and benefits counseling",
      "https://www.va.gov/columbia-va-regional-benefit-office/",
      "1-800-827-1000",
      "",
      "6437 Garners Ferry Rd, Columbia, SC 29209",
      "",
      "SC",
      "",
      "All veterans, active duty, Guard/Reserve",
      "U.S. Department of Veterans Affairs",
      "government",
      "",
      "",
      "false",
      "approved",
      "",
      ""
    ],
    [
      "Atlanta VA Health Care System",
      "Healthcare",
      "VA Medical Centers",
      "immediate",
      "Comprehensive VA medical center providing primary care, mental health, and specialty services",
      "https://www.va.gov/atlanta-health-care/",
      "(404) 321-6111",
      "",
      "1670 Clairmont Rd, Decatur, GA 30033",
      "Decatur",
      "GA",
      "30033",
      "Enrolled veterans",
      "U.S. Department of Veterans Affairs",
      "government",
      "",
      "",
      "false",
      "approved",
      "33.7748",
      "-84.2963"
    ],
  ];

  const downloadCsvTemplate = () => {
    const escape = (v: string) => v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
    const lines = [
      CSV_TEMPLATE_HEADERS.join(","),
      ...CSV_TEMPLATE_ROWS.map(row => row.map(escape).join(","))
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "veteran_care_resources_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCsvRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const validateCsvRows = (rows: Record<string, any>[]) => {
    const catNames = new Set(categories.map(c => c.name.toLowerCase()));
    const catSlugs = new Set(categories.map(c => c.slug.toLowerCase()));

    const valid: any[] = [];
    const issues: { row: number; title: string; reason: string; type: "skip" | "warn" }[] = [];

    rows.forEach((row, i) => {
      const rowNum = i + 1;
      const title = row.title?.trim() || "";

      if (!title || title.length < 3) {
        issues.push({ row: rowNum, title: title || "(empty)", reason: "Title missing or too short (min 3 chars)", type: "skip" });
        return;
      }

      const warnings: string[] = [];

      const catVal = (row.category || row.category_slug || "").toLowerCase().trim();
      if (catVal && !catNames.has(catVal) && !catSlugs.has(catVal)) {
        warnings.push(`Category "${row.category || row.category_slug}" not found`);
      }

      if (!row.state?.trim()) {
        warnings.push("No state specified");
      }

      if (row.website_url?.trim()) {
        try { new URL(row.website_url.trim()); } catch {
          warnings.push("Invalid website URL format");
        }
      }

      if (row.status && !["approved", "pending", "rejected"].includes(row.status.trim())) {
        warnings.push(`Invalid status "${row.status}" — will default to "approved"`);
      }

      if (warnings.length > 0) {
        issues.push({ row: rowNum, title, reason: warnings.join("; "), type: "warn" });
      }

      valid.push(row);
    });

    return { valid, issues };
  };

  const parseCsvFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        toast({ description: "CSV file needs a header row and at least one data row", variant: "destructive" });
        return;
      }

      const headers = parseCsvRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, "_"));
      const rows: Record<string, any>[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvRow(lines[i]);
        const row: Record<string, any> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || "";
        });
        rows.push(row);
      }

      if (rows.length > 500) {
        toast({ description: `CSV has ${rows.length} rows — maximum is 500 per import. Please split the file.`, variant: "destructive" });
        return;
      }

      setCsvHeaders(headers);
      setCsvRows(rows);
      setCsvResults(null);
      setCsvPreview(validateCsvRows(rows));
    };
    reader.readAsText(file);
  };

  const handleGeocodeMissing = async () => {
    setGeocodeRunning(true);
    setGeocodeProgress(null);
    setGeocodeResult(null);

    try {
      const res = await fetch("/api/admin/resources/geocode-missing", {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        toast({ title: "Geocode Error", description: err.error || "Unauthorized or server error", variant: "destructive" });
        setGeocodeRunning(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;
          try {
            const msg = JSON.parse(json);
            if (msg.type === "start") {
              setGeocodeProgress({ current: 0, total: msg.total, geocoded: 0, failed: 0 });
            } else if (msg.type === "progress") {
              setGeocodeProgress(msg);
            } else if (msg.type === "done") {
              setGeocodeResult(msg);
              queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
            } else if (msg.type === "error") {
              toast({ title: "Geocode Error", description: msg.message, variant: "destructive" });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      toast({ title: "Geocode Error", description: e?.message || "Failed", variant: "destructive" });
    }
    setGeocodeRunning(false);
  };

  const handleCsvImport = async () => {
    const rowsToImport = csvPreview?.valid || csvRows;
    setCsvImporting(true);
    try {
      const res = await fetch("/api/admin/resources/csv-import", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ rows: rowsToImport }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Import failed");
      }
      const data = await res.json();
      setCsvResults(data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/resources"] });
      toast({ description: `Imported ${data.created} resources successfully` });
    } catch (e: any) {
      toast({ description: e.message, variant: "destructive" });
    } finally {
      setCsvImporting(false);
    }
  };

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
    setCreateMode(false);
    setSelectedResource(resource);
    setEditForm({
      title: resource.title || "",
      short_description: resource.short_description || "",
      website_url: resource.website_url || "",
      phone: resource.phone || "",
      email: resource.email || "",
      address: resource.address || "",
      city: resource.city || "",
      state: resource.state || "",
      zip: resource.zip || "",
      eligibility: resource.eligibility || "",
      source_name: resource.source_name || "",
      source_type: resource.source_type || "",
      notes_internal: resource.notes_internal || "",
      category_id: resource.category_id || "",
      subcategory: resource.subcategory || "",
      service_priority: resource.service_priority || "",
      status: resource.status || "pending",
      sponsored: resource.sponsored || false,
      monetization_type: resource.monetization_type || "",
      affiliate_url: resource.affiliate_url || "",
      latitude: resource.latitude ?? null,
      longitude: resource.longitude ?? null,
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
        <div className="flex gap-2 border-b pb-3">
          <Button
            data-testid="tab-resources"
            variant={activeTab === "resources" ? "default" : "ghost"}
            size="sm"
            className="h-9 text-xs"
            onClick={() => setActiveTab("resources")}
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Resources
          </Button>
          <Button
            data-testid="tab-leads"
            variant={activeTab === "leads" ? "default" : "ghost"}
            size="sm"
            className="h-9 text-xs"
            onClick={() => setActiveTab("leads")}
          >
            <Users className="h-3.5 w-3.5 mr-1.5" /> Navigator Leads
          </Button>
        </div>

        {activeTab === "leads" && (
          <>
            <div className="flex gap-2">
              {(["new", "contacted", "completed", "cancelled"] as const).map((s) => (
                <Button
                  key={s}
                  data-testid={`lead-filter-${s}`}
                  variant={leadStatusFilter === s ? "default" : "outline"}
                  size="sm"
                  className="h-9 text-xs capitalize"
                  onClick={() => setLeadStatusFilter(s)}
                >
                  {s}
                </Button>
              ))}
            </div>

            {navLoading && <p className="text-center text-muted-foreground py-8">Loading...</p>}

            <div className="space-y-3">
              {navRequests.map((req) => (
                <Card key={req.id} data-testid={`nav-lead-${req.id}`} className="border">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 data-testid={`text-lead-name-${req.id}`} className="font-semibold text-sm">{req.veteran_name}</h3>
                        <p data-testid={`text-lead-date-${req.id}`} className="text-xs text-muted-foreground">
                          {new Date(req.created_at).toLocaleString()}
                          {req.user_state && ` • ${[req.user_city, req.user_state].filter(Boolean).join(", ")}`}
                        </p>
                      </div>
                      <Badge data-testid={`badge-lead-status-${req.id}`} variant="outline" className="text-[10px] capitalize shrink-0">
                        {req.status}
                      </Badge>
                    </div>

                    {req.resource_title && (
                      <p data-testid={`text-lead-resource-${req.id}`} className="text-xs bg-muted/50 rounded px-2 py-1">
                        Re: <strong>{req.resource_title}</strong>
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs">
                      {req.veteran_phone && (
                        <a data-testid={`link-lead-phone-${req.id}`} href={`tel:${req.veteran_phone}`} className="flex items-center gap-1 text-primary hover:underline">
                          <Phone className="h-3 w-3" /> {req.veteran_phone}
                        </a>
                      )}
                      {req.veteran_email && (
                        <a data-testid={`link-lead-email-${req.id}`} href={`mailto:${req.veteran_email}`} className="flex items-center gap-1 text-primary hover:underline">
                          <Mail className="h-3 w-3" /> {req.veteran_email}
                        </a>
                      )}
                      <span data-testid={`text-lead-contact-pref-${req.id}`} className="text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Prefers: {req.preferred_contact}
                      </span>
                    </div>

                    {req.message && (
                      <p data-testid={`text-lead-message-${req.id}`} className="text-xs text-muted-foreground bg-muted/30 rounded p-2 italic">"{req.message}"</p>
                    )}

                    <div className="flex gap-2 pt-1">
                      {req.status === "new" && (
                        <Button
                          data-testid={`lead-contacted-${req.id}`}
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={() => navPatchMutation.mutate({ id: req.id, updates: { status: "contacted" } })}
                          disabled={navPatchMutation.isPending}
                        >
                          Mark Contacted
                        </Button>
                      )}
                      {req.status === "contacted" && (
                        <Button
                          data-testid={`lead-complete-${req.id}`}
                          size="sm"
                          className="h-7 text-xs flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => navPatchMutation.mutate({ id: req.id, updates: { status: "completed" } })}
                          disabled={navPatchMutation.isPending}
                        >
                          Mark Completed
                        </Button>
                      )}
                      {(req.status === "new" || req.status === "contacted") && (
                        <Button
                          data-testid={`lead-cancel-${req.id}`}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => navPatchMutation.mutate({ id: req.id, updates: { status: "cancelled" } })}
                          disabled={navPatchMutation.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!navLoading && navRequests.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No {leadStatusFilter} navigator requests.</p>
              )}
            </div>
          </>
        )}

        {activeTab === "resources" && (<>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
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
            <div className="flex-1" />
            <Button
              data-testid="button-add-resource"
              size="sm"
              className="h-9 text-xs"
              onClick={openCreateForm}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Resource
            </Button>
            <Button
              data-testid="button-csv-import"
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={() => { setCsvDialogOpen(true); setCsvRows([]); setCsvHeaders([]); setCsvResults(null); setCsvPreview(null); }}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" /> CSV Import
            </Button>
            <Button
              data-testid="button-geocode-missing"
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={handleGeocodeMissing}
              disabled={geocodeRunning}
            >
              {geocodeRunning ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <MapPinned className="h-3.5 w-3.5 mr-1.5" />}
              {geocodeRunning ? "Geocoding..." : "Geocode Missing"}
            </Button>
          </div>
          <div className="relative">
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

        {(geocodeRunning || geocodeResult) && (
          <Card className="border-primary/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Geocode Missing Resources</span>
              </div>
              {geocodeProgress && (
                <div className="space-y-2">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${Math.round((geocodeProgress.current / geocodeProgress.total) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {geocodeProgress.current} / {geocodeProgress.total} processed — {geocodeProgress.geocoded} geocoded, {geocodeProgress.failed} failed
                    {geocodeProgress.lastTitle && <span className="block truncate mt-0.5">Last: {geocodeProgress.lastTitle}</span>}
                  </p>
                </div>
              )}
              {geocodeResult && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge className="bg-green-100 text-green-800 border-green-200">{geocodeResult.geocoded} geocoded</Badge>
                    <Badge className="bg-red-100 text-red-800 border-red-200">{geocodeResult.failed} failed</Badge>
                    <Badge className="bg-gray-100 text-gray-700 border-gray-200">{geocodeResult.skippedNoAddress} skipped (no address)</Badge>
                  </div>
                  {geocodeResult.failures.length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View {geocodeResult.failures.length} failure{geocodeResult.failures.length > 1 ? "s" : ""}
                      </summary>
                      <div className="mt-2 max-h-40 overflow-y-auto space-y-1 bg-muted/50 rounded p-2">
                        {geocodeResult.failures.map((f) => (
                          <p key={f.id} className="text-[11px]">
                            <span className="font-medium">{f.title}</span>: {f.reason}
                          </p>
                        ))}
                      </div>
                    </details>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => { setGeocodeResult(null); setGeocodeProgress(null); }}
                  >
                    Dismiss
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
        </>)}
      </main>

      <Sheet open={!!selectedResource} onOpenChange={(open) => { if (!open) { setSelectedResource(null); setCreateMode(false); } }}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col h-[100dvh]">
          <SheetHeader className="bg-primary px-5 py-4 text-primary-foreground shrink-0">
            <SheetTitle className="text-lg font-heading text-white">
              {createMode ? "Add New Resource" : (editForm.title || "Edit Resource")}
            </SheetTitle>
            {selectedResource && !createMode && (
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
                <Select value={editForm.category_id || undefined} onValueChange={(v) => setEditForm(p => ({ ...p, category_id: v }))}>
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
                <Label className="text-xs">Subcategory</Label>
                <Input data-testid="input-admin-subcategory" className="h-9 text-xs" placeholder="e.g. Emergency Shelter, Rental Assistance" value={editForm.subcategory || ""} onChange={(e) => setEditForm(p => ({ ...p, subcategory: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Service Priority</Label>
                <Select value={editForm.service_priority || "none"} onValueChange={(v) => setEditForm(p => ({ ...p, service_priority: v === "none" ? "" : v }))}>
                  <SelectTrigger data-testid="select-admin-service-priority" className="h-9 text-xs">
                    <SelectValue placeholder="Select priority level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="same_week">Same Week</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="information">Information</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Title *</Label>
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

              <div className="space-y-2">
                <Label className="text-xs">Address</Label>
                <Input data-testid="input-admin-address" className="h-9 text-xs" value={editForm.address || ""} onChange={(e) => setEditForm(p => ({ ...p, address: e.target.value }))} placeholder="Street address" />
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Source Name</Label>
                  <Input className="h-9 text-xs" value={editForm.source_name || ""} onChange={(e) => setEditForm(p => ({ ...p, source_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Source Type</Label>
                  <Select value={editForm.source_type || undefined} onValueChange={(v) => setEditForm(p => ({ ...p, source_type: v }))}>
                    <SelectTrigger data-testid="select-admin-source-type" className="h-9 text-xs">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="nonprofit">Nonprofit</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Eligibility</Label>
                <Input className="h-9 text-xs" value={editForm.eligibility || ""} onChange={(e) => setEditForm(p => ({ ...p, eligibility: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Status</Label>
                <Select value={editForm.status || "approved"} onValueChange={(v) => setEditForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger data-testid="select-admin-status" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Latitude</Label>
                  <Input className="h-9 text-xs" type="number" step="any" value={editForm.latitude ?? ""} onChange={(e) => setEditForm(p => ({ ...p, latitude: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="Auto-geocoded" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Longitude</Label>
                  <Input className="h-9 text-xs" type="number" step="any" value={editForm.longitude ?? ""} onChange={(e) => setEditForm(p => ({ ...p, longitude: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="Auto-geocoded" />
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label className="text-xs">Sponsored Resource</Label>
                <Switch
                  data-testid="switch-sponsored"
                  checked={!!editForm.sponsored}
                  onCheckedChange={(v) => setEditForm(p => ({ ...p, sponsored: v }))}
                />
              </div>

              {editForm.sponsored && (
                <div className="space-y-3 pl-2 border-l-2 border-amber-300">
                  <div className="space-y-2">
                    <Label className="text-xs">Monetization Type</Label>
                    <Select value={editForm.monetization_type || undefined} onValueChange={(v) => setEditForm(p => ({ ...p, monetization_type: v }))}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="affiliate">Affiliate</SelectItem>
                        <SelectItem value="sponsored_listing">Sponsored Listing</SelectItem>
                        <SelectItem value="ad">Ad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Affiliate URL</Label>
                    <Input data-testid="input-affiliate-url" className="h-9 text-xs" value={editForm.affiliate_url || ""} onChange={(e) => setEditForm(p => ({ ...p, affiliate_url: e.target.value }))} placeholder="https://..." />
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs">Internal Notes (admin only)</Label>
                <Textarea data-testid="input-admin-notes" className="text-xs" rows={2} value={editForm.notes_internal || ""} onChange={(e) => setEditForm(p => ({ ...p, notes_internal: e.target.value }))} placeholder="Private notes for the admin team..." />
              </div>
            </div>
          </ScrollArea>

          <SheetFooter className="p-3 border-t bg-muted/10 shrink-0">
            {createMode ? (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs"
                  onClick={() => { setSelectedResource(null); setCreateMode(false); }}
                >
                  Cancel
                </Button>
                <Button
                  data-testid="button-create-resource"
                  size="sm"
                  className="flex-1 h-9 text-xs bg-green-600 hover:bg-green-700"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> {createMutation.isPending ? "Creating..." : "Create Resource"}
                </Button>
              </div>
            ) : (
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
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
        <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              CSV Import
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1">
            {!csvRows.length && !csvResults && (
              <>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    data-testid="input-csv-file"
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    id="csv-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) parseCsvFile(file);
                      if (e.target) e.target.value = "";
                    }}
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer space-y-2 block">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm font-medium">Click to upload CSV file</p>
                    <p className="text-xs text-muted-foreground">Max 500 rows per import</p>
                  </label>
                </div>

                <Button
                  data-testid="button-download-template"
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-xs"
                  onClick={downloadCsvTemplate}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download CSV Template
                </Button>

                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                  <p className="text-xs font-medium">Supported CSV columns:</p>
                  <p className="text-[10px] text-muted-foreground font-mono leading-relaxed">
                    title*, category, short_description, website_url, phone, email, address, city, state, zip, eligibility, source_name, source_type, monetization_type, affiliate_url, sponsored, status, latitude, longitude
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    * Title is required (min 3 chars). Category matches by name or slug. Status defaults to "approved". Lat/lng are auto-geocoded from address if omitted.
                  </p>
                </div>
              </>
            )}

            {csvRows.length > 0 && !csvResults && (
              <>
                {csvPreview && (
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="border-green-200">
                      <CardContent className="p-3 text-center">
                        <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-green-600">{csvPreview.valid.length}</p>
                        <p className="text-[10px] text-muted-foreground">Ready to Create</p>
                      </CardContent>
                    </Card>
                    <Card className="border-amber-200">
                      <CardContent className="p-3 text-center">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-amber-600">{csvPreview.issues.filter(i => i.type === "warn").length}</p>
                        <p className="text-[10px] text-muted-foreground">Warnings</p>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200">
                      <CardContent className="p-3 text-center">
                        <SkipForward className="h-4 w-4 text-red-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-red-600">{csvPreview.issues.filter(i => i.type === "skip").length}</p>
                        <p className="text-[10px] text-muted-foreground">Will Skip</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {csvPreview && csvPreview.issues.length > 0 && (
                  <div className="border rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0">
                        <tr className="bg-muted/80">
                          <th className="px-2 py-1.5 text-left font-medium w-12">Row</th>
                          <th className="px-2 py-1.5 text-left font-medium">Title</th>
                          <th className="px-2 py-1.5 text-left font-medium w-16">Type</th>
                          <th className="px-2 py-1.5 text-left font-medium">Issue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.issues.map((issue, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-2 py-1 text-muted-foreground">{issue.row}</td>
                            <td className="px-2 py-1 truncate max-w-[120px]">{issue.title}</td>
                            <td className="px-2 py-1">
                              <Badge variant="outline" className={`text-[10px] ${issue.type === "skip" ? "text-red-600 border-red-200" : "text-amber-600 border-amber-200"}`}>
                                {issue.type === "skip" ? "Skip" : "Warn"}
                              </Badge>
                            </td>
                            <td className="px-2 py-1 text-muted-foreground text-[11px]">{issue.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="border rounded-lg overflow-hidden">
                  <p className="text-xs font-medium px-2 py-1.5 bg-muted/50 border-b">Data Preview</p>
                  <div className="overflow-x-auto max-h-48">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0">
                        <tr className="bg-muted/30">
                          <th className="px-2 py-1.5 text-left font-medium">#</th>
                          <th className="px-2 py-1.5 text-left font-medium w-12"></th>
                          {csvHeaders.slice(0, 6).map((h) => (
                            <th key={h} className="px-2 py-1.5 text-left font-medium capitalize whitespace-nowrap">{h.replace(/_/g, " ")}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.slice(0, 15).map((row, i) => {
                          const rowIssue = csvPreview?.issues.find(iss => iss.row === i + 1);
                          const isSkipped = rowIssue?.type === "skip";
                          return (
                            <tr key={i} className={`border-t ${isSkipped ? "bg-red-50 opacity-60 line-through" : rowIssue ? "bg-amber-50/50" : ""}`}>
                              <td className="px-2 py-1 text-muted-foreground">{i + 1}</td>
                              <td className="px-2 py-1">
                                {isSkipped && <Badge variant="outline" className="text-[9px] text-red-500 border-red-200 px-1">skip</Badge>}
                                {rowIssue && !isSkipped && <Badge variant="outline" className="text-[9px] text-amber-500 border-amber-200 px-1">warn</Badge>}
                              </td>
                              {csvHeaders.slice(0, 6).map((h) => (
                                <td key={h} className="px-2 py-1 truncate max-w-[130px]">{row[h] || ""}</td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {csvRows.length > 15 && (
                    <p className="text-xs text-muted-foreground text-center py-1 border-t bg-muted/30">
                      ...and {csvRows.length - 15} more rows
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => { setCsvRows([]); setCsvHeaders([]); setCsvPreview(null); }}
                  >
                    Clear & Start Over
                  </Button>
                  <Button
                    data-testid="button-import-csv"
                    size="sm"
                    className="h-9 text-xs bg-green-600 hover:bg-green-700 px-6"
                    onClick={handleCsvImport}
                    disabled={csvImporting || (csvPreview?.valid.length || 0) === 0}
                  >
                    {csvImporting ? (
                      <span className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Importing...
                      </span>
                    ) : (
                      `Import ${csvPreview?.valid.length || csvRows.length} Resources`
                    )}
                  </Button>
                </div>
              </>
            )}

            {csvResults && (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-2" />
                  <p className="text-lg font-bold">Import Complete</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{csvResults.created}</p>
                      <p className="text-[10px] text-muted-foreground">Created</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-amber-600">{csvResults.skipped}</p>
                      <p className="text-[10px] text-muted-foreground">Skipped</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-red-600">{csvResults.errors}</p>
                      <p className="text-[10px] text-muted-foreground">Errors</p>
                    </CardContent>
                  </Card>
                </div>

                {csvResults.results.filter((r: any) => r.status !== "created").length > 0 && (
                  <div className="border rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0">
                        <tr className="bg-muted/80">
                          <th className="px-2 py-1.5 text-left font-medium">Row</th>
                          <th className="px-2 py-1.5 text-left font-medium">Title</th>
                          <th className="px-2 py-1.5 text-left font-medium">Status</th>
                          <th className="px-2 py-1.5 text-left font-medium">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvResults.results.filter((r: any) => r.status !== "created").map((r: any, i: number) => (
                          <tr key={i} className="border-t">
                            <td className="px-2 py-1">{r.row}</td>
                            <td className="px-2 py-1 truncate max-w-[150px]">{r.title}</td>
                            <td className="px-2 py-1">
                              <Badge variant="outline" className={`text-[10px] ${r.status === "error" ? "text-red-600" : "text-amber-600"}`}>
                                {r.status}
                              </Badge>
                            </td>
                            <td className="px-2 py-1 text-muted-foreground truncate max-w-[200px]">{r.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => { setCsvRows([]); setCsvHeaders([]); setCsvPreview(null); setCsvResults(null); }}
                  >
                    Import More
                  </Button>
                  <Button
                    data-testid="button-csv-done"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setCsvDialogOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
