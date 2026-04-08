
import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { useState, useMemo } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
  Building2,
  ChevronDown,
  ChevronRight,
  ArrowRightLeft,
  Trash2,
  Brain,
  DollarSign,
  Handshake,
  TrendingUp,
  Link2,
  Trophy,
  Store,
  Menu,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { type SupabaseCategory } from "@/lib/category-config";
import { US_STATE_ABBRS, ADMIN_CATEGORIES } from "@/lib/admin-filters";
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
  urgency: string | null;
  source: string | null;
  assigned_to: string | null;
  outcome: string | null;
  contacted_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  consent_followup: boolean | null;
  category: string | null;
  subcategory: string | null;
  routed_to_partner_id: string | null;
  routed_at: string | null;
  delivery_status: string | null;
  partner_outcome: string | null;
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
  subcategories_list?: { id: string; name: string; slug: string; category_id: string }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

function AdminResourcesInner() {
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem("adminKey") || "");
  const [authenticated, setAuthenticated] = useState(() => !!localStorage.getItem("adminKey"));
  const [activeTab, setActiveTab] = useState<"resources" | "leads" | "partners" | "applications">("resources");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResource, setSelectedResource] = useState<AdminResource | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>([]);
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
  const [partnerForm, setPartnerForm] = useState<Record<string, any> | null>(null);
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [ruleForm, setRuleForm] = useState<Record<string, any> | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");
  const [manualAssignLeadId, setManualAssignLeadId] = useState<string | null>(null);
  const [manualPartnerId, setManualPartnerId] = useState<string>("");

  // Resources additional filters
  const [resourceStateFilter, setResourceStateFilter] = useState("");
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState("");

  // Navigator Requests client-side filters
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStateFilter, setLeadStateFilter] = useState("");
  const [leadCategoryFilter, setLeadCategoryFilter] = useState("");
  const [leadRoutedFilter, setLeadRoutedFilter] = useState("");

  // Routing Partners client-side filters
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerActiveFilter, setPartnerActiveFilter] = useState("");
  const [partnerLeadFilter, setPartnerLeadFilter] = useState("");

  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<SupabaseCategory[]>({
    queryKey: ["/api/categories"],
    queryFn: () => fetch("/api/categories").then(r => r.json()),
    enabled: authenticated,
  });

  const { data: allSubcategories = [] } = useQuery<{ id: string; name: string; slug: string; category_id: string }[]>({
    queryKey: ["/api/subcategories"],
    queryFn: () => fetch("/api/subcategories").then(r => r.json()),
    enabled: authenticated,
  });

  const { data: resources = [], isLoading } = useQuery<AdminResource[]>({
    queryKey: ["/api/admin/resources", statusFilter, searchQuery, resourceStateFilter, adminKey],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (searchQuery) params.set("q", searchQuery);
      if (resourceStateFilter) params.set("state", resourceStateFilter);
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
    queryFn: async () => {
      const params = new URLSearchParams();
      if (leadStatusFilter) params.set("status", leadStatusFilter);
      const r = await fetch(`/api/admin/navigator-requests?${params}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!r.ok) throw new Error("Unauthorized");
      const body = await r.json();
      return Array.isArray(body) ? body : (body.requests || []);
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

  const rerouteMutation = useMutation({
    mutationFn: async ({ id, partner_id }: { id: string; partner_id?: string }) => {
      const res = await fetch(`/api/admin/leads/${id}/reroute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify(partner_id ? { partner_id } : {}),
      });
      if (!res.ok) throw new Error("Failed to reroute");
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith("/api/admin/navigator-requests") });
      if (data.rerouted === false) {
        setManualAssignLeadId(variables.id);
        setManualPartnerId("");
        toast({ description: "No auto-match found — choose a partner below", variant: "destructive" });
      } else {
        setManualAssignLeadId(null);
        toast({ description: `Routed to ${data.partner_name || "partner"}` });
      }
    },
  });

  const { data: partners = [], isLoading: partnersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/partners", adminKey],
    queryFn: () => fetch("/api/admin/partners", { headers: { "x-admin-key": adminKey } }).then(r => r.json()),
    enabled: authenticated && (activeTab === "partners" || activeTab === "leads"),
  });

  const { data: suggestedPartners = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/leads", manualAssignLeadId, "suggest-partners", adminKey],
    queryFn: () =>
      fetch(`/api/admin/leads/${manualAssignLeadId}/suggest-partners`, {
        headers: { "x-admin-key": adminKey },
      }).then(r => r.json()),
    enabled: authenticated && !!manualAssignLeadId,
  });

  const partnerMutation = useMutation({
    mutationFn: async ({ method, url, body }: { method: string; url: string; body?: any }) => {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith("/api/admin/partner") });
      toast({ description: "Partner updated" });
      setPartnerForm(null);
    },
  });

  const { data: partnerRules = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/partners", expandedPartner, "rules", adminKey],
    queryFn: () => fetch(`/api/admin/partners/${expandedPartner}/rules`, { headers: { "x-admin-key": adminKey } }).then(r => r.json()),
    enabled: authenticated && !!expandedPartner,
  });

  const ruleMutation = useMutation({
    mutationFn: async ({ method, url, body }: { method: string; url: string; body?: any }) => {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith("/api/admin/partner") });
      toast({ description: "Routing rule updated" });
      setRuleForm(null);
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
    createMutation.mutate({ ...editForm, additional_category_ids: additionalCategoryIds, subcategory_ids: selectedSubcategoryIds });
  };

  const openCreateForm = () => {
    setCreateMode(true);
    setSelectedResource({ id: "__new__" } as any);
    setAdditionalCategoryIds([]);
    setSelectedSubcategoryIds([]);
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
        localStorage.setItem("adminKey", adminKey);
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
    const cats = resource.categories;
    if (Array.isArray(cats)) {
      setAdditionalCategoryIds(cats.map((c: any) => c.id).filter((id: string) => id !== resource.category_id));
    } else {
      setAdditionalCategoryIds([]);
    }
    if (Array.isArray(resource.subcategories_list)) {
      setSelectedSubcategoryIds(resource.subcategories_list.map((s: any) => s.id));
    } else {
      setSelectedSubcategoryIds([]);
    }
  };

  const saveAssociations = async (resourceId: string) => {
    const allCatIds = [...new Set([editForm.category_id, ...additionalCategoryIds].filter(Boolean))];
    if (allCatIds.length > 0) {
      await fetch(`/api/admin/resources/${resourceId}/categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ category_ids: allCatIds }),
      });
    }
    await fetch(`/api/admin/resources/${resourceId}/subcategories`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ subcategory_ids: selectedSubcategoryIds }),
    });
  };

  const handleApprove = async () => {
    if (!selectedResource) return;
    patchMutation.mutate({
      id: selectedResource.id,
      updates: { ...editForm, status: "approved" },
    });
    await saveAssociations(selectedResource.id);
  };

  const handleReject = async () => {
    if (!selectedResource) return;
    patchMutation.mutate({
      id: selectedResource.id,
      updates: { ...editForm, status: "rejected" },
    });
    await saveAssociations(selectedResource.id);
  };

  const handleSave = async () => {
    if (!selectedResource) return;
    patchMutation.mutate({
      id: selectedResource.id,
      updates: editForm,
    });
    await saveAssociations(selectedResource.id);
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

  // ── Derived / filtered data ──────────────────────────────────────────────

  const filteredResources = useMemo(() => {
    if (!resourceCategoryFilter) return resources;
    return resources.filter(r => r.categories?.slug === resourceCategoryFilter);
  }, [resources, resourceCategoryFilter]);

  const filteredNavRequests = useMemo(() => {
    return navRequests.filter(r => {
      if (leadSearch) {
        const q = leadSearch.toLowerCase();
        const hit = [r.veteran_name, r.veteran_email, r.veteran_phone, r.message].some(v => v?.toLowerCase().includes(q));
        if (!hit) return false;
      }
      if (leadStateFilter && r.user_state !== leadStateFilter) return false;
      if (leadCategoryFilter) {
        const cat = ADMIN_CATEGORIES.find(c => c.value === leadCategoryFilter);
        const matchesSlug = r.category === leadCategoryFilter;
        const matchesLabel = cat ? r.category === cat.label : false;
        if (!matchesSlug && !matchesLabel) return false;
      }
      if (leadRoutedFilter === "routed" && !r.routed_to_partner_id) return false;
      if (leadRoutedFilter === "unrouted" && r.routed_to_partner_id) return false;
      return true;
    });
  }, [navRequests, leadSearch, leadStateFilter, leadCategoryFilter, leadRoutedFilter]);

  const filteredPartners = useMemo(() => {
    return (Array.isArray(partners) ? partners : []).filter((p: any) => {
      if (partnerSearch) {
        const q = partnerSearch.toLowerCase();
        if (![p.name, p.contact_name, p.contact_email].some((v: string | null) => v?.toLowerCase().includes(q))) return false;
      }
      if (partnerActiveFilter === "active" && !p.is_active) return false;
      if (partnerActiveFilter === "inactive" && p.is_active) return false;
      if (partnerLeadFilter === "lead-enabled" && !p.is_lead_enabled) return false;
      if (partnerLeadFilter === "not-lead-enabled" && p.is_lead_enabled) return false;
      return true;
    });
  }, [partners, partnerSearch, partnerActiveFilter, partnerLeadFilter]);

  const pendingCount = resources.filter(r => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-heading font-bold">Admin — Resource Review</span>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button data-testid="menu-analytics" variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10">
                  <BarChart3 className="h-4 w-4 mr-1.5" /> Analytics <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem data-testid="nav-analytics" onClick={() => setLocation("/admin/analytics")}>
                  <BarChart3 className="h-4 w-4 mr-2" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="nav-attribution" onClick={() => setLocation("/admin/attribution")}>
                  <TrendingUp className="h-4 w-4 mr-2" /> Attribution
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="nav-ai-insights" onClick={() => setLocation("/admin/ai-insights")}>
                  <Brain className="h-4 w-4 mr-2" /> AI Insights
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button data-testid="menu-ambassadors" variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10">
                  <Users className="h-4 w-4 mr-1.5" /> Ambassadors <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem data-testid="nav-ambassadors" onClick={() => setLocation("/admin/ambassadors")}>
                  <Users className="h-4 w-4 mr-2" /> Manage Ambassadors
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="nav-links" onClick={() => setLocation("/admin/links")}>
                  <Link2 className="h-4 w-4 mr-2" /> Link Management
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="nav-commissions" onClick={() => setLocation("/admin/commissions")}>
                  <DollarSign className="h-4 w-4 mr-2" /> Commissions
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="nav-payouts" onClick={() => setLocation("/admin/payouts")}>
                  <DollarSign className="h-4 w-4 mr-2" /> Payouts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button data-testid="menu-partners" variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10">
                  <Handshake className="h-4 w-4 mr-1.5" /> Partners <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem data-testid="nav-partner-prospects" onClick={() => setLocation("/admin/partner-prospects")}>
                  <Building2 className="h-4 w-4 mr-2" /> Partner Prospects
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="nav-trusted-services" onClick={() => setLocation("/admin/trusted-services")}>
                  <Handshake className="h-4 w-4 mr-2" /> Trusted Services
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="nav-trusted-leads" onClick={() => setLocation("/admin/trusted-service-leads")}>
                  <Mail className="h-4 w-4 mr-2" /> Trusted Partner Leads
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid="nav-vob" onClick={() => setLocation("/admin/vob")}>
                  <Store className="h-4 w-4 mr-2" /> Veteran-Owned Business
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="nav-sweepstakes" onClick={() => setLocation("/admin/sweepstakes")}>
                  <Trophy className="h-4 w-4 mr-2" /> Sweepstakes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button data-testid="button-sign-out" variant="ghost" size="sm" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-white/10" onClick={() => { setAuthenticated(false); setAdminKey(""); localStorage.removeItem("adminKey"); }}>
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
            <Users className="h-3.5 w-3.5 mr-1.5" /> Navigator Requests
          </Button>
          <Button
            data-testid="tab-partners"
            variant={activeTab === "partners" ? "default" : "ghost"}
            size="sm"
            className="h-9 text-xs"
            onClick={() => setActiveTab("partners")}
          >
            <Building2 className="h-3.5 w-3.5 mr-1.5" /> Routing Partners
          </Button>
          <Button
            data-testid="tab-applications"
            variant={activeTab === "applications" ? "default" : "ghost"}
            size="sm"
            className="h-9 text-xs"
            onClick={() => setActiveTab("applications")}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" /> Trusted Partner Applications
          </Button>
        </div>

        {activeTab === "leads" && (
          <>
            <div className="flex gap-2 flex-wrap">
              {(["new", "in_progress", "resolved", "cancelled"] as const).map((s) => (
                <Button
                  key={s}
                  data-testid={`lead-filter-${s}`}
                  variant={leadStatusFilter === s ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs capitalize"
                  onClick={() => setLeadStatusFilter(s)}
                >
                  {s.replace("_", " ")}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  data-testid="input-leads-search"
                  className="pl-8 h-8 text-xs"
                  placeholder="Search name, email, phone, or message..."
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <Select value={leadStateFilter || "all"} onValueChange={v => setLeadStateFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-8 text-xs w-[110px]" data-testid="select-lead-state">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">All States</SelectItem>
                    {US_STATE_ABBRS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={leadCategoryFilter || "all"} onValueChange={v => setLeadCategoryFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-8 text-xs w-[160px]" data-testid="select-lead-category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    <SelectItem value="all">All Categories</SelectItem>
                    {ADMIN_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={leadRoutedFilter || "all"} onValueChange={v => setLeadRoutedFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-8 text-xs w-[120px]" data-testid="select-lead-routed">
                    <SelectValue placeholder="All Routing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Routing</SelectItem>
                    <SelectItem value="routed">Routed</SelectItem>
                    <SelectItem value="unrouted">Unrouted</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground ml-auto">
                  {filteredNavRequests.length}{filteredNavRequests.length !== navRequests.length ? ` of ${navRequests.length}` : ""} request{navRequests.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {navLoading && <p className="text-center text-muted-foreground py-8">Loading...</p>}

            <div className="space-y-3">
              {[...filteredNavRequests]
                .sort((a, b) => {
                  const urgencyRank: Record<string, number> = { immediate: 0, same_week: 1, standard: 2, information: 3 };
                  const aRank = urgencyRank[a.urgency || ""] ?? 4;
                  const bRank = urgencyRank[b.urgency || ""] ?? 4;
                  if (aRank !== bRank) return aRank - bRank;
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })
                .map((req) => {
                const urgencyConfig: Record<string, { label: string; className: string }> = {
                  immediate: { label: "Immediate", className: "bg-red-100 text-red-800 border-red-300" },
                  same_week: { label: "This Week", className: "bg-amber-100 text-amber-800 border-amber-300" },
                  standard: { label: "Standard", className: "bg-blue-100 text-blue-800 border-blue-300" },
                  information: { label: "Info Only", className: "bg-slate-100 text-slate-700 border-slate-300" },
                };
                const outcomeConfig: Record<string, { label: string; className: string }> = {
                  connected: { label: "Connected", className: "bg-green-100 text-green-800" },
                  referred: { label: "Referred", className: "bg-blue-100 text-blue-800" },
                  completed: { label: "Completed", className: "bg-green-100 text-green-800" },
                  no_response: { label: "No Response", className: "bg-amber-100 text-amber-800" },
                  not_eligible: { label: "Not Eligible", className: "bg-slate-100 text-slate-700" },
                  declined: { label: "Declined", className: "bg-slate-100 text-slate-700" },
                  unable_to_contact: { label: "Unable to Contact", className: "bg-red-100 text-red-700" },
                };
                const effectiveStatus = req.status === "new" && req.routed_to_partner_id ? "assigned" : req.status;
                const statusConfig: Record<string, { label: string; className: string }> = {
                  new: { label: "New", className: "bg-blue-100 text-blue-800 border-blue-300 font-semibold" },
                  assigned: { label: "Assigned", className: "bg-indigo-100 text-indigo-800 border-indigo-300" },
                  in_progress: { label: "In Progress", className: "bg-amber-100 text-amber-800 border-amber-300" },
                  resolved: { label: "Resolved", className: "bg-green-100 text-green-800 border-green-300" },
                  cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-600 border-slate-300" },
                };
                const urg = req.urgency ? urgencyConfig[req.urgency] : null;
                const outcomeInfo = req.outcome ? outcomeConfig[req.outcome] : null;
                const statusInfo = statusConfig[effectiveStatus] || { label: req.status, className: "" };
                const isImmediate = req.urgency === "immediate";

                return (
                <Card key={req.id} data-testid={`nav-lead-${req.id}`} className={`border ${isImmediate ? "border-red-300 bg-red-50/30" : effectiveStatus === "new" ? "border-blue-300 bg-blue-50/20" : ""}`}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 data-testid={`text-lead-name-${req.id}`} className="font-semibold text-sm">{req.veteran_name}</h3>
                          {effectiveStatus === "new" && (
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 shrink-0" title="New request" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <p data-testid={`text-lead-date-${req.id}`} className="text-xs text-muted-foreground">
                            {new Date(req.created_at).toLocaleString()}
                          </p>
                          {req.user_state && (
                            <span className="text-xs font-medium text-slate-700 bg-slate-100 rounded px-1.5 py-0.5">
                              {[req.user_city, req.user_state].filter(Boolean).join(", ")}
                            </span>
                          )}
                          {req.category && (
                            <span className="text-xs font-medium text-primary bg-primary/10 rounded px-1.5 py-0.5">
                              {req.category.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {urg && (
                          <Badge data-testid={`badge-lead-urgency-${req.id}`} variant="outline" className={`text-[10px] ${urg.className}`}>
                            {urg.label}
                          </Badge>
                        )}
                        <Badge data-testid={`badge-lead-status-${req.id}`} variant="outline" className={`text-[10px] ${statusInfo.className}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {req.subcategory && (
                        <Badge variant="secondary" className="text-[10px] font-normal">{req.subcategory}</Badge>
                      )}
                      {req.source && (
                        <Badge variant="secondary" className="text-[10px] font-normal bg-purple-50 text-purple-700">via {req.source}</Badge>
                      )}
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
                      {req.consent_followup && (
                        <span className="text-green-700 text-[10px] font-medium">Follow-up OK</span>
                      )}
                    </div>

                    {req.message && (
                      <p data-testid={`text-lead-message-${req.id}`} className="text-xs text-muted-foreground bg-muted/30 rounded p-2 italic">"{req.message}"</p>
                    )}

                    <div data-testid={`notes-section-${req.id}`} className="space-y-1.5">
                      {editingNotesId === req.id ? (
                        <div className="space-y-1.5">
                          <Textarea
                            data-testid={`input-notes-${req.id}`}
                            className="text-xs min-h-[60px] resize-none"
                            placeholder="Add internal notes (only visible to staff)..."
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                          />
                          <div className="flex gap-1.5">
                            <Button
                              data-testid={`button-save-notes-${req.id}`}
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              disabled={navPatchMutation.isPending}
                              onClick={() => {
                                navPatchMutation.mutate(
                                  { id: req.id, updates: { admin_notes: notesText.trim() || null } },
                                  { onSuccess: () => setEditingNotesId(null) }
                                );
                              }}
                            >
                              Save Notes
                            </Button>
                            <Button
                              data-testid={`button-cancel-notes-${req.id}`}
                              size="sm"
                              variant="ghost"
                              className="h-6 text-[10px] px-2"
                              onClick={() => setEditingNotesId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5">
                          {req.admin_notes ? (
                            <div
                              data-testid={`text-notes-${req.id}`}
                              className="flex-1 text-[11px] bg-yellow-50 text-yellow-900 rounded p-2 border border-yellow-200 cursor-pointer hover:border-yellow-400 transition-colors"
                              onClick={() => { setEditingNotesId(req.id); setNotesText(req.admin_notes || ""); }}
                            >
                              <span className="font-medium text-[10px] text-yellow-700 block mb-0.5">Staff Notes:</span>
                              {req.admin_notes}
                            </div>
                          ) : (
                            <Button
                              data-testid={`button-add-notes-${req.id}`}
                              size="sm"
                              variant="ghost"
                              className="h-6 text-[10px] px-2 text-muted-foreground"
                              onClick={() => { setEditingNotesId(req.id); setNotesText(""); }}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" /> Add Notes
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {(req.assigned_to || req.outcome || req.contacted_at || req.resolved_at || req.closed_at) && (
                      <div className="text-[10px] text-muted-foreground bg-muted/20 rounded p-2 space-y-0.5 border border-muted">
                        {req.assigned_to && <p>Assigned to: <strong>{req.assigned_to}</strong></p>}
                        {outcomeInfo && (
                          <p>Outcome: <Badge variant="outline" className={`text-[9px] ml-1 ${outcomeInfo.className}`}>{outcomeInfo.label}</Badge></p>
                        )}
                        {req.contacted_at && <p>Contacted: {new Date(req.contacted_at).toLocaleString()}</p>}
                        {req.resolved_at && <p>Resolved: {new Date(req.resolved_at).toLocaleString()}</p>}
                        {req.closed_at && <p>Closed: {new Date(req.closed_at).toLocaleString()}</p>}
                      </div>
                    )}

                    {req.routed_to_partner_id && (
                      <div className="text-[10px] bg-blue-50 text-blue-800 rounded p-2 border border-blue-200 space-y-0.5">
                        <p className="flex items-center gap-1 flex-wrap">
                          <ArrowRightLeft className="h-3 w-3 shrink-0" />
                          <span className="font-medium">
                            {partners.find(p => p.id === req.routed_to_partner_id)?.name || "Routing Partner"}
                          </span>
                          {req.delivery_status && (
                            <Badge variant="outline" className={`text-[9px] ml-auto ${
                              req.delivery_status === "pending" ? "bg-amber-100 text-amber-800" :
                              req.delivery_status === "escalated" ? "bg-red-100 text-red-700" :
                              req.delivery_status === "fallback_manual" ? "bg-slate-100 text-slate-700" :
                              "bg-green-100 text-green-800"
                            }`}>
                              {req.delivery_status === "fallback_manual" ? "Manual Fallback" : req.delivery_status}
                            </Badge>
                          )}
                        </p>
                        <div className="flex items-center justify-between">
                          {req.routed_at && <p className="text-muted-foreground">Routed: {new Date(req.routed_at).toLocaleString()}</p>}
                          {(req.status === "new" || req.status === "in_progress") && (
                            <button
                              className="text-blue-600 underline text-[9px] hover:text-blue-800"
                              onClick={() => { setManualAssignLeadId(manualAssignLeadId === req.id ? null : req.id); setManualPartnerId(""); }}
                            >
                              Change
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {!req.routed_to_partner_id && req.delivery_status !== "fallback_manual" && (
                      <div className="text-[10px] bg-teal-50 text-teal-800 rounded p-2 border border-teal-200 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span>Self-Serve — Veteran shown resources</span>
                        </div>
                        {(req.status === "new" || req.status === "in_progress") && (
                          <button
                            className="text-teal-700 underline whitespace-nowrap hover:text-teal-900"
                            onClick={() => { setManualAssignLeadId(req.id); setManualPartnerId(""); }}
                          >
                            Assign partner
                          </button>
                        )}
                      </div>
                    )}

                    {req.delivery_status === "fallback_manual" && !req.routed_to_partner_id && (
                      <div className="text-[10px] bg-amber-50 text-amber-800 rounded p-2 border border-amber-200 flex items-start justify-between gap-2">
                        <div>
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          No partner matched — manual assignment needed
                        </div>
                        <button
                          className="text-amber-700 underline whitespace-nowrap hover:text-amber-900"
                          onClick={() => { setManualAssignLeadId(req.id); setManualPartnerId(""); }}
                        >
                          Assign manually
                        </button>
                      </div>
                    )}

                    {manualAssignLeadId === req.id && (() => {
                      const activePartners = partners.filter((p: any) => p.is_active && p.is_lead_enabled);
                      const matchLabel = (s: any) => {
                        if (s.categoryMatch && s.locationMatch) return { text: "Best Match", cls: "bg-green-200 text-green-900 border-green-400" };
                        if (s.categoryMatch) return { text: "Category Match", cls: "bg-blue-100 text-blue-800 border-blue-300" };
                        if (s.locationMatch) return { text: "Nearby Option", cls: "bg-amber-100 text-amber-800 border-amber-300" };
                        return { text: "Available", cls: "bg-slate-100 text-slate-700 border-slate-300" };
                      };
                      return (
                      <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold text-slate-700">Assign to Partner</p>
                          <button
                            className="text-[10px] text-muted-foreground underline hover:text-slate-600"
                            onClick={() => { setManualAssignLeadId(null); setManualPartnerId(""); }}
                          >
                            Close
                          </button>
                        </div>

                        {suggestedPartners.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Suggested Matches</p>
                            {suggestedPartners.map((s: any) => {
                              const ml = matchLabel(s);
                              return (
                              <button
                                key={s.partnerId}
                                data-testid={`suggest-partner-${s.partnerId}`}
                                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded border border-green-200 bg-green-50 hover:bg-green-100 text-left transition-colors"
                                onClick={() => {
                                  rerouteMutation.mutate({ id: req.id, partner_id: s.partnerId });
                                  setManualAssignLeadId(null);
                                  setManualPartnerId("");
                                }}
                              >
                                <div className="min-w-0">
                                  <span className="flex items-center gap-1.5 text-[11px] text-green-800 font-medium">
                                    <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />
                                    {s.partnerName}
                                  </span>
                                  {(s.partnerCategory || s.partnerState || s.partnerCity) && (
                                    <span className="text-[9px] text-green-700 block ml-4.5 mt-0.5">
                                      {[s.partnerCategory, s.partnerCity, s.partnerState].filter(Boolean).join(" · ")}
                                    </span>
                                  )}
                                </div>
                                <Badge variant="outline" className={`text-[9px] shrink-0 ${ml.cls}`}>
                                  {ml.text}
                                </Badge>
                              </button>
                              );
                            })}
                          </div>
                        )}

                        {suggestedPartners.length === 0 && (
                          <p className="text-[10px] text-muted-foreground italic">No routing rules match this request — search or browse partners below.</p>
                        )}

                        <div className="space-y-2">
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                            {suggestedPartners.length > 0 ? "Or search all partners" : "Search partners"}
                          </p>
                          <div className="relative">
                            <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                            <Input
                              data-testid={`input-partner-search-${req.id}`}
                              className="h-6 text-[11px] pl-6"
                              placeholder="Search by name..."
                              value={manualPartnerId.startsWith("search:") ? manualPartnerId.slice(7) : ""}
                              onChange={(e) => setManualPartnerId(e.target.value ? `search:${e.target.value}` : "")}
                            />
                          </div>
                          <div className="max-h-[160px] overflow-y-auto space-y-1 border rounded bg-white p-1.5">
                            {(() => {
                              const sq = manualPartnerId.startsWith("search:") ? manualPartnerId.slice(7).toLowerCase() : "";
                              const filtered = sq
                                ? activePartners.filter((p: any) =>
                                    p.name?.toLowerCase().includes(sq) ||
                                    p.contact_name?.toLowerCase().includes(sq) ||
                                    p.external_intake_email?.toLowerCase().includes(sq)
                                  )
                                : activePartners.slice(0, 20);
                              if (filtered.length === 0) {
                                return <p className="text-[10px] text-muted-foreground text-center py-2">No partners found</p>;
                              }
                              return filtered.map((p: any) => (
                                <button
                                  key={p.id}
                                  data-testid={`partner-option-${p.id}`}
                                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-slate-50 text-left transition-colors border border-transparent hover:border-slate-200"
                                  onClick={() => {
                                    rerouteMutation.mutate({ id: req.id, partner_id: p.id });
                                    setManualPartnerId("");
                                    setManualAssignLeadId(null);
                                  }}
                                >
                                  <div className="min-w-0">
                                    <p className="text-[11px] font-medium text-slate-800 truncate">{p.name}</p>
                                    <p className="text-[9px] text-muted-foreground truncate">
                                      {[p.contact_name, p.state].filter(Boolean).join(" · ")}
                                    </p>
                                  </div>
                                  <span className="text-[10px] text-primary font-medium shrink-0">Assign</span>
                                </button>
                              ));
                            })()}
                            {!manualPartnerId.startsWith("search:") && activePartners.length > 20 && (
                              <p className="text-[9px] text-muted-foreground text-center pt-1">Type to search {activePartners.length} partners...</p>
                            )}
                          </div>
                        </div>
                      </div>
                      );
                    })()}

                    {req.status === "resolved" && outcomeInfo && (
                      <div data-testid={`outcome-summary-${req.id}`} className={`text-xs font-medium rounded px-3 py-1.5 ${outcomeInfo.className}`}>
                        Result: {outcomeInfo.label}
                      </div>
                    )}

                    <div className="flex gap-2 pt-1 flex-wrap">
                      {req.status === "new" && (
                        <Button
                          data-testid={`lead-in-progress-${req.id}`}
                          size="sm"
                          className="h-7 text-xs flex-1"
                          onClick={() => navPatchMutation.mutate({ id: req.id, updates: { status: "in_progress" } })}
                          disabled={navPatchMutation.isPending}
                        >
                          Start Working
                        </Button>
                      )}
                      {req.status === "in_progress" && !req.contacted_at && (
                        <Button
                          data-testid={`lead-record-contact-${req.id}`}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => navPatchMutation.mutate({ id: req.id, updates: { contacted_at: new Date().toISOString() } })}
                          disabled={navPatchMutation.isPending}
                        >
                          Record Contact
                        </Button>
                      )}
                      {req.status === "in_progress" && (
                        <>
                          <Button
                            data-testid={`lead-resolve-connected-${req.id}`}
                            size="sm"
                            className="h-7 text-xs bg-green-600 hover:bg-green-700"
                            onClick={() => navPatchMutation.mutate({ id: req.id, updates: { status: "resolved", outcome: "connected", resolved_at: new Date().toISOString() } })}
                            disabled={navPatchMutation.isPending}
                          >
                            Connected
                          </Button>
                          <Button
                            data-testid={`lead-resolve-referred-${req.id}`}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => navPatchMutation.mutate({ id: req.id, updates: { status: "resolved", outcome: "referred", resolved_at: new Date().toISOString() } })}
                            disabled={navPatchMutation.isPending}
                          >
                            Referred
                          </Button>
                          <Button
                            data-testid={`lead-resolve-completed-${req.id}`}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => navPatchMutation.mutate({ id: req.id, updates: { status: "resolved", outcome: "completed", resolved_at: new Date().toISOString() } })}
                            disabled={navPatchMutation.isPending}
                          >
                            Completed
                          </Button>
                          <Button
                            data-testid={`lead-resolve-no-response-${req.id}`}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-amber-700"
                            onClick={() => navPatchMutation.mutate({ id: req.id, updates: { status: "resolved", outcome: "no_response", resolved_at: new Date().toISOString() } })}
                            disabled={navPatchMutation.isPending}
                          >
                            No Response
                          </Button>
                          <Button
                            data-testid={`lead-resolve-unable-${req.id}`}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-amber-700"
                            onClick={() => navPatchMutation.mutate({ id: req.id, updates: { status: "resolved", outcome: "unable_to_contact", resolved_at: new Date().toISOString() } })}
                            disabled={navPatchMutation.isPending}
                          >
                            Unable to Contact
                          </Button>
                          <Button
                            data-testid={`lead-resolve-not-eligible-${req.id}`}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => navPatchMutation.mutate({ id: req.id, updates: { status: "resolved", outcome: "not_eligible", resolved_at: new Date().toISOString() } })}
                            disabled={navPatchMutation.isPending}
                          >
                            Not Eligible
                          </Button>
                          <Button
                            data-testid={`lead-resolve-declined-${req.id}`}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => navPatchMutation.mutate({ id: req.id, updates: { status: "resolved", outcome: "declined", resolved_at: new Date().toISOString() } })}
                            disabled={navPatchMutation.isPending}
                          >
                            Declined
                          </Button>
                        </>
                      )}
                      {(req.status === "new" || req.status === "in_progress") && (
                        <Button
                          data-testid={`lead-cancel-${req.id}`}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={() => navPatchMutation.mutate({ id: req.id, updates: { status: "cancelled" } })}
                          disabled={navPatchMutation.isPending}
                        >
                          Cancel
                        </Button>
                      )}
                      {(req.status === "new" || req.status === "in_progress") && (
                        <>
                          <Button
                            data-testid={`lead-reroute-${req.id}`}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-blue-700 border-blue-300"
                            onClick={() => rerouteMutation.mutate({ id: req.id })}
                            disabled={rerouteMutation.isPending}
                          >
                            <ArrowRightLeft className="h-3 w-3 mr-1" />
                            {req.routed_to_partner_id ? "Re-route" : "Route"}
                          </Button>
                          <Button
                            data-testid={`lead-manual-assign-${req.id}`}
                            size="sm"
                            variant="outline"
                            className={`h-7 text-xs ${manualAssignLeadId === req.id ? "bg-slate-100 text-slate-700 border-slate-400" : "text-slate-600 border-slate-300"}`}
                            onClick={() => {
                              setManualAssignLeadId(manualAssignLeadId === req.id ? null : req.id);
                              setManualPartnerId("");
                            }}
                          >
                            <Users className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
                );
              })}
              {!navLoading && filteredNavRequests.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {navRequests.length === 0
                    ? `No ${leadStatusFilter.replace("_", " ")} navigator requests.`
                    : "No requests match the current filters."}
                </p>
              )}
            </div>
          </>
        )}

        {activeTab === "partners" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold">Partner Organizations</h2>
              <Button
                data-testid="button-add-partner"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setPartnerForm({ name: "", contact_name: "", contact_email: "", contact_phone: "", website_url: "", state: "SC", cities: "", is_lead_enabled: false, notes: "" })}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Partner
              </Button>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  data-testid="input-partner-search"
                  className="pl-8 h-8 text-xs"
                  placeholder="Search org, contact, or email..."
                  value={partnerSearch}
                  onChange={(e) => setPartnerSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <Select value={partnerActiveFilter || "all"} onValueChange={v => setPartnerActiveFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-7 text-xs w-[110px]" data-testid="select-partner-active">
                    <SelectValue placeholder="Active status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={partnerLeadFilter || "all"} onValueChange={v => setPartnerLeadFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="h-7 text-xs w-[130px]" data-testid="select-partner-lead">
                    <SelectValue placeholder="Lead enabled" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Lead Types</SelectItem>
                    <SelectItem value="lead-enabled">Lead-Enabled</SelectItem>
                    <SelectItem value="not-lead-enabled">Not Lead-Enabled</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground ml-auto">
                  {filteredPartners.length}{filteredPartners.length !== (partners?.length ?? 0) ? ` of ${partners?.length ?? 0}` : ""} partner{(partners?.length ?? 0) !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {partnerForm && (
              <Card className="border-primary/30">
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-sm font-semibold">{partnerForm.id ? "Edit Partner" : "New Partner"}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Organization Name *</Label>
                      <Input data-testid="input-partner-name" className="h-8 text-xs" value={partnerForm.name || ""} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Contact Name</Label>
                      <Input className="h-8 text-xs" value={partnerForm.contact_name || ""} onChange={(e) => setPartnerForm({ ...partnerForm, contact_name: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Contact Email</Label>
                      <Input className="h-8 text-xs" value={partnerForm.contact_email || ""} onChange={(e) => setPartnerForm({ ...partnerForm, contact_email: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Contact Phone</Label>
                      <Input className="h-8 text-xs" value={partnerForm.contact_phone || ""} onChange={(e) => setPartnerForm({ ...partnerForm, contact_phone: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Website</Label>
                      <Input className="h-8 text-xs" value={partnerForm.website_url || ""} onChange={(e) => setPartnerForm({ ...partnerForm, website_url: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">State</Label>
                      <Input className="h-8 text-xs" placeholder="SC" value={partnerForm.state || ""} onChange={(e) => setPartnerForm({ ...partnerForm, state: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Cities (comma-separated, blank = statewide)</Label>
                      <Input className="h-8 text-xs" placeholder="Charleston, Columbia, Greenville" value={partnerForm.cities || ""} onChange={(e) => setPartnerForm({ ...partnerForm, cities: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Notes</Label>
                      <Textarea className="text-xs min-h-[60px]" value={partnerForm.notes || ""} onChange={(e) => setPartnerForm({ ...partnerForm, notes: e.target.value })} />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <Switch checked={partnerForm.is_lead_enabled || false} onCheckedChange={(v) => setPartnerForm({ ...partnerForm, is_lead_enabled: v })} />
                      <Label className="text-xs">Lead-Enabled (receives auto-routed leads)</Label>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      data-testid="button-save-partner"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={partnerMutation.isPending}
                      onClick={() => {
                        const citiesArr = partnerForm.cities ? partnerForm.cities.split(",").map((c: string) => c.trim()).filter(Boolean) : null;
                        const body = { ...partnerForm, cities: citiesArr };
                        delete body.id;
                        if (partnerForm.id) {
                          partnerMutation.mutate({ method: "PATCH", url: `/api/admin/partners/${partnerForm.id}`, body });
                        } else {
                          partnerMutation.mutate({ method: "POST", url: "/api/admin/partners", body });
                        }
                      }}
                    >
                      {partnerForm.id ? "Update" : "Create"} Partner
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPartnerForm(null)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {partnersLoading && <p className="text-center text-muted-foreground py-8">Loading partners...</p>}

            {Array.isArray(partners) && filteredPartners.map((p: any) => (
              <Card key={p.id} data-testid={`partner-card-${p.id}`} className={`border ${!p.is_active ? "opacity-50" : ""}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        {p.name}
                        {p.is_lead_enabled && <Badge className="text-[9px] bg-green-100 text-green-800">Lead-Enabled</Badge>}
                        {!p.is_active && <Badge variant="outline" className="text-[9px] text-red-600">Inactive</Badge>}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {p.state || "Any state"} {p.cities ? `• ${p.cities.join(", ")}` : "• Statewide"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => {
                          setPartnerForm({
                            ...p,
                            cities: Array.isArray(p.cities) ? p.cities.join(", ") : "",
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setExpandedPartner(expandedPartner === p.id ? null : p.id)}
                      >
                        {expandedPartner === p.id ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        Rules
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {p.contact_name && <span>{p.contact_name}</span>}
                    {p.contact_email && <a href={`mailto:${p.contact_email}`} className="text-primary hover:underline">{p.contact_email}</a>}
                    {p.contact_phone && <a href={`tel:${p.contact_phone}`} className="text-primary hover:underline">{p.contact_phone}</a>}
                  </div>

                  {expandedPartner === p.id && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-semibold">Routing Rules</h4>
                        <Button
                          data-testid={`button-add-rule-${p.id}`}
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px]"
                          onClick={() => setRuleForm({ partner_id: p.id, category_slug: "", subcategory: "", urgency: "", state: "SC", city: "", priority: 100, max_leads_per_day: "" })}
                        >
                          <Plus className="h-2.5 w-2.5 mr-1" /> Add Rule
                        </Button>
                      </div>

                      {ruleForm && ruleForm.partner_id === p.id && (
                        <Card className="border-dashed">
                          <CardContent className="p-3 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-[10px]">Category</Label>
                                <Select value={ruleForm.category_slug || "any"} onValueChange={(v) => setRuleForm({ ...ruleForm, category_slug: v === "any" ? "" : v })}>
                                  <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="any">Any Category</SelectItem>
                                    {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-[10px]">Subcategory</Label>
                                <Input className="h-7 text-[10px]" placeholder="Any" value={ruleForm.subcategory || ""} onChange={(e) => setRuleForm({ ...ruleForm, subcategory: e.target.value })} />
                              </div>
                              <div>
                                <Label className="text-[10px]">Urgency</Label>
                                <Select value={ruleForm.urgency || "any"} onValueChange={(v) => setRuleForm({ ...ruleForm, urgency: v === "any" ? "" : v })}>
                                  <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="any">Any</SelectItem>
                                    <SelectItem value="immediate">Immediate</SelectItem>
                                    <SelectItem value="same_week">Same Week</SelectItem>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="information">Information</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-[10px]">State</Label>
                                <Input className="h-7 text-[10px]" placeholder="SC" value={ruleForm.state || ""} onChange={(e) => setRuleForm({ ...ruleForm, state: e.target.value })} />
                              </div>
                              <div>
                                <Label className="text-[10px]">City</Label>
                                <Input className="h-7 text-[10px]" placeholder="Any" value={ruleForm.city || ""} onChange={(e) => setRuleForm({ ...ruleForm, city: e.target.value })} />
                              </div>
                              <div>
                                <Label className="text-[10px]">Priority (lower = higher)</Label>
                                <Input className="h-7 text-[10px]" type="number" value={ruleForm.priority ?? 100} onChange={(e) => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) || 100 })} />
                              </div>
                              <div>
                                <Label className="text-[10px]">Max Leads/Day</Label>
                                <Input className="h-7 text-[10px]" type="number" placeholder="Unlimited" value={ruleForm.max_leads_per_day || ""} onChange={(e) => setRuleForm({ ...ruleForm, max_leads_per_day: e.target.value ? parseInt(e.target.value) : "" })} />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="h-6 text-[10px]"
                                disabled={ruleMutation.isPending}
                                onClick={() => {
                                  const body: Record<string, any> = {
                                    category_slug: ruleForm.category_slug || null,
                                    subcategory: ruleForm.subcategory || null,
                                    urgency: ruleForm.urgency || null,
                                    state: ruleForm.state || null,
                                    city: ruleForm.city || null,
                                    priority: ruleForm.priority || 100,
                                    max_leads_per_day: ruleForm.max_leads_per_day || null,
                                  };
                                  if (ruleForm.id) {
                                    ruleMutation.mutate({ method: "PATCH", url: `/api/admin/partner-rules/${ruleForm.id}`, body });
                                  } else {
                                    ruleMutation.mutate({ method: "POST", url: `/api/admin/partners/${p.id}/rules`, body });
                                  }
                                }}
                              >
                                {ruleForm.id ? "Update" : "Create"} Rule
                              </Button>
                              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setRuleForm(null)}>Cancel</Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {partnerRules.length === 0 && <p className="text-[10px] text-muted-foreground py-2">No routing rules configured yet.</p>}

                      {partnerRules.map((rule: any) => (
                        <div key={rule.id} className={`flex items-center justify-between text-[10px] px-2 py-1.5 rounded border ${!rule.is_active ? "opacity-50 bg-muted/30" : "bg-muted/10"}`}>
                          <div className="flex flex-wrap gap-1">
                            {rule.category_slug ? <Badge variant="secondary" className="text-[9px]">{rule.category_slug}</Badge> : <Badge variant="outline" className="text-[9px]">Any cat.</Badge>}
                            {rule.subcategory && <Badge variant="secondary" className="text-[9px]">{rule.subcategory}</Badge>}
                            {rule.urgency && <Badge variant="outline" className="text-[9px]">{rule.urgency}</Badge>}
                            {rule.state && <Badge variant="outline" className="text-[9px]">{rule.state}</Badge>}
                            {rule.city && <Badge variant="outline" className="text-[9px]">{rule.city}</Badge>}
                            <span className="text-muted-foreground">P{rule.priority}</span>
                            {rule.max_leads_per_day && <span className="text-muted-foreground">max {rule.max_leads_per_day}/day</span>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="sm" variant="ghost" className="h-5 text-[9px] px-1"
                              onClick={() => setRuleForm({ ...rule, partner_id: p.id })}>
                              Edit
                            </Button>
                            <Button size="sm" variant="ghost" className="h-5 text-[9px] px-1 text-red-600"
                              onClick={() => ruleMutation.mutate({ method: "DELETE", url: `/api/admin/partner-rules/${rule.id}` })}>
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {!partnersLoading && filteredPartners.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {!partners || partners.length === 0
                  ? "No partners yet. Add your first partner organization to enable lead routing."
                  : "No partners match the current filters."}
              </p>
            )}
          </div>
        )}

        {activeTab === "applications" && (
          <ApplicationsPanel adminKey={adminKey} />
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
              data-testid="button-csv-export"
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={() => {
                const a = document.createElement("a");
                a.href = `/api/admin/resources/csv-export?status=approved`;
                a.download = "";
                fetch(a.href, { headers: { "x-admin-key": adminKey } })
                  .then(r => r.blob())
                  .then(blob => { a.href = URL.createObjectURL(blob); a.click(); });
              }}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
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
          <div className="flex gap-2 flex-wrap">
            <Select value={resourceStateFilter || "all"} onValueChange={v => setResourceStateFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 text-xs w-[110px]" data-testid="select-resource-state">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="all">All States</SelectItem>
                {US_STATE_ABBRS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={resourceCategoryFilter || "all"} onValueChange={v => setResourceCategoryFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="h-8 text-xs w-[160px]" data-testid="select-resource-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {(resourceStateFilter || resourceCategoryFilter) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => { setResourceStateFilter(""); setResourceCategoryFilter(""); }}
                data-testid="button-clear-resource-filters"
              >
                Clear filters
              </Button>
            )}
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
          {filteredResources.map((resource) => {
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
                        {resource.categories && <span>{Array.isArray(resource.categories) ? resource.categories.map((c: any) => c.name).join(", ") : resource.categories.name}</span>}
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
          {!isLoading && filteredResources.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {resources.length === 0
                ? `No ${statusFilter} resources found.`
                : "No resources match the current filters."}
            </p>
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
                <Label className="text-xs">Primary Category</Label>
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
                <Label className="text-xs">Additional Categories</Label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.filter(c => c.id !== editForm.category_id).map((c) => {
                    const isSelected = additionalCategoryIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        data-testid={`btn-add-category-${c.slug}`}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"}`}
                        onClick={() => {
                          setAdditionalCategoryIds(prev =>
                            isSelected ? prev.filter(id => id !== c.id) : [...prev, c.id]
                          );
                        }}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Primary Subcategory (legacy)</Label>
                <Input data-testid="input-admin-subcategory" className="h-9 text-xs" placeholder="e.g. Emergency Shelter, Rental Assistance" value={editForm.subcategory || ""} onChange={(e) => setEditForm(p => ({ ...p, subcategory: e.target.value }))} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Subcategories {selectedSubcategoryIds.length > 0 && <span className="text-muted-foreground">({selectedSubcategoryIds.length})</span>}</Label>
                <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-muted/30 max-h-48 overflow-y-auto">
                  {(() => {
                    const allCatIds = [...new Set([editForm.category_id, ...additionalCategoryIds].filter(Boolean))];
                    const relevantSubs = allSubcategories.filter((s: any) => allCatIds.includes(s.category_id));
                    if (relevantSubs.length === 0) {
                      return <span className="text-xs text-muted-foreground italic">Select categories first to see available subcategories</span>;
                    }
                    const grouped = new Map<string, typeof relevantSubs>();
                    relevantSubs.forEach((s: any) => {
                      const catName = categories.find((c: any) => c.id === s.category_id)?.name || "Other";
                      if (!grouped.has(catName)) grouped.set(catName, []);
                      grouped.get(catName)!.push(s);
                    });
                    return Array.from(grouped.entries()).map(([catName, subs]) => (
                      <div key={catName} className="w-full">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1 mt-1">{catName}</p>
                        <div className="flex flex-wrap gap-1">
                          {subs.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((s: any) => {
                            const isSelected = selectedSubcategoryIds.includes(s.id);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                data-testid={`chip-subcategory-${s.id}`}
                                className={`px-2 py-0.5 rounded-full text-[10px] border transition-colors ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-foreground border-border hover:bg-accent"
                                }`}
                                onClick={() => {
                                  setSelectedSubcategoryIds(prev =>
                                    isSelected ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                  );
                                }}
                              >
                                {s.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
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

interface PartnerApp {
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

const APP_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  prospect: { label: "New", color: "bg-blue-100 text-blue-700 border-blue-200" },
  under_review: { label: "Under Review", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200" },
  approved_pending_payment: { label: "Awaiting Payment", color: "bg-purple-100 text-purple-700 border-purple-200" },
  active: { label: "Active", color: "bg-green-100 text-green-700 border-green-200" },
  inactive: { label: "Inactive", color: "bg-gray-100 text-gray-500 border-gray-200" },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-400 border-gray-200" },
};

function ApplicationsPanel({ adminKey }: { adminKey: string }) {
  const [appFilter, setAppFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: applications = [], isLoading } = useQuery<PartnerApp[]>({
    queryKey: ["/api/admin/partner-applications", appFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (appFilter !== "all") params.set("status", appFilter);
      const res = await fetch(`/api/admin/partner-applications?${params}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
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
      toast({ description: "Application updated." });
    },
    onError: (err: any) => toast({ description: err.message, variant: "destructive" }),
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
          description: data.emailSent
            ? `Payment link emailed to the partner. Link also copied to clipboard as backup.`
            : `Email delivery failed. Payment link copied to clipboard — send it manually.`,
        });
      }
    },
    onError: (err: any) => toast({ description: err.message, variant: "destructive" }),
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
      toast({ description: "Partner converted to provider." });
    },
    onError: (err: any) => toast({ description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/partner-applications/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner-applications"] });
      toast({ description: "Application deleted." });
    },
    onError: (err: any) => toast({ description: err.message, variant: "destructive" }),
  });

  const tabs = [
    { key: "all", label: "All" },
    { key: "prospect", label: "New" },
    { key: "under_review", label: "Under Review" },
    { key: "approved_pending_payment", label: "Awaiting Payment" },
    { key: "active", label: "Active" },
    { key: "rejected", label: "Rejected" },
    { key: "inactive", label: "Inactive" },
    { key: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Trusted Partner Applications</h2>
        <Badge variant="outline" className="text-xs">{applications.length} total</Badge>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Button
            key={t.key}
            data-testid={`app-filter-${t.key}`}
            variant={appFilter === t.key ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs whitespace-nowrap"
            onClick={() => setAppFilter(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {isLoading && <p className="text-center text-muted-foreground py-8">Loading applications...</p>}

      {!isLoading && applications.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No applications found for this filter.</p>
      )}

      {applications.map((app) => {
        const statusCfg = APP_STATUS_CONFIG[app.status] || APP_STATUS_CONFIG.prospect;
        const isExpanded = expandedId === app.id;

        return (
          <Card key={app.id} data-testid={`app-card-${app.id}`} className="border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : app.id)}>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">{app.company_name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {app.contact_name} · {app.email}
                    {app.city && ` · ${app.city}`}{app.state && `, ${app.state}`}
                  </p>
                  {app.trusted_service_categories && (
                    <Badge variant="outline" className="text-[10px] mt-1">{app.trusted_service_categories.name}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={`text-[10px] border ${statusCfg.color}`}>{statusCfg.label}</Badge>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-3 border-t space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {app.phone && <div><span className="text-muted-foreground">Phone:</span> {app.phone}</div>}
                    {app.website && <div><span className="text-muted-foreground">Website:</span> <a href={app.website} target="_blank" className="text-primary hover:underline">{app.website}</a></div>}
                    {app.service_description && <div className="col-span-2"><span className="text-muted-foreground">Description:</span> {app.service_description}</div>}
                    {app.plan_type && (
                      <div>
                        <span className="text-muted-foreground">Plan: </span>
                        <span className="font-medium">
                          {app.plan_type === "national"
                            ? "National Plan — All States"
                            : `State Plan — ${app.state || "State not set"}`}
                        </span>
                      </div>
                    )}
                    <div><span className="text-muted-foreground">Submitted:</span> {new Date(app.created_at).toLocaleDateString()}</div>
                  </div>

                  {app.stripe_checkout_url && app.status === "approved_pending_payment" && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-[10px] text-purple-700 uppercase tracking-wide mb-1.5 font-medium">Payment Link</p>
                      <div className="flex items-center gap-2">
                        <input readOnly value={app.stripe_checkout_url} className="flex-1 text-[11px] bg-white border rounded px-2 py-1 text-muted-foreground truncate" />
                        <Button size="sm" variant="outline" className="h-7 text-xs" data-testid={`button-copy-link-${app.id}`}
                          onClick={() => { navigator.clipboard.writeText(app.stripe_checkout_url!); toast({ description: "Payment link copied." }); }}>
                          Copy
                        </Button>
                      </div>
                      <p className="text-[10px] text-purple-600 mt-1">Send this link to the partner to complete payment.</p>
                    </div>
                  )}

                  {app.stripe_subscription_id && (
                    <div className="bg-muted/50 rounded-lg px-3 py-2 text-[10px] text-muted-foreground">
                      Stripe: Customer {app.stripe_customer_id?.slice(0, 18)}... · Subscription {app.stripe_subscription_id?.slice(0, 18)}...
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs">Admin Notes</Label>
                    <Textarea
                      className="text-xs min-h-[60px]"
                      data-testid={`input-notes-${app.id}`}
                      value={editingNotes[app.id] ?? app.admin_notes ?? ""}
                      onChange={(e) => setEditingNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                    />
                    {editingNotes[app.id] !== undefined && editingNotes[app.id] !== (app.admin_notes ?? "") && (
                      <Button size="sm" className="h-7 text-xs" data-testid={`button-save-notes-${app.id}`}
                        onClick={() => { updateMutation.mutate({ id: app.id, admin_notes: editingNotes[app.id] }); setEditingNotes((prev) => { const next = { ...prev }; delete next[app.id]; return next; }); }}>
                        Save Notes
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex-1 min-w-[140px]">
                      <Select value={app.status} onValueChange={(v) => updateMutation.mutate({ id: app.id, status: v })}>
                        <SelectTrigger className="h-8 text-xs" data-testid={`select-app-status-${app.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prospect">New</SelectItem>
                          <SelectItem value="under_review">Under Review</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="approved_pending_payment">Awaiting Payment</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {!app.stripe_subscription_id && app.category_id && !["active", "approved_pending_payment", "rejected", "archived"].includes(app.status) && (
                      <Button size="sm" className="text-xs gap-1 bg-purple-600 hover:bg-purple-700" data-testid={`button-approve-${app.id}`}
                        disabled={approveMutation.isPending}
                        onClick={() => { if (confirm(`Approve "${app.company_name}" and email a Stripe payment link?`)) approveMutation.mutate(app.id); }}>
                        <DollarSign className="h-3.5 w-3.5" /> Approve & Send Payment
                      </Button>
                    )}

                    {!["active", "rejected", "archived"].includes(app.status) && (
                      <Button size="sm" variant="outline" className="text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50" data-testid={`button-reject-${app.id}`}
                        onClick={() => { if (confirm(`Reject "${app.company_name}"?`)) updateMutation.mutate({ id: app.id, status: "rejected" }); }}>
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    )}

                    {!app.converted_provider_id && app.category_id && app.status === "active" && (
                      <Button size="sm" className="text-xs gap-1 bg-green-600 hover:bg-green-700" data-testid={`button-convert-${app.id}`}
                        disabled={convertMutation.isPending}
                        onClick={() => { if (confirm(`Convert "${app.company_name}" into a provider listing?`)) convertMutation.mutate(app.id); }}>
                        <ArrowRightLeft className="h-3.5 w-3.5" /> Convert to Provider
                      </Button>
                    )}

                    <Button size="sm" variant="ghost" className="text-xs gap-1 text-muted-foreground hover:text-red-600" data-testid={`button-delete-${app.id}`}
                      disabled={deleteMutation.isPending}
                      onClick={() => { if (confirm(`Permanently delete "${app.company_name}"? This cannot be undone.`)) deleteMutation.mutate(app.id); }}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>

                    {!app.category_id && !["rejected", "archived"].includes(app.status) && (
                      <p className="text-[10px] text-amber-600">Assign a category before approving</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function AdminResources() {
  return <AdminAuthGuard><AdminResourcesInner /></AdminAuthGuard>;
}
