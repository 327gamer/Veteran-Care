
import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect } from "react";
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
  CreditCard,
  Shield,
  Zap,
  Eye,
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
  email_sent: boolean | null;
  email_sent_at: string | null;
  response_status: string | null;
  response_at: string | null;
  assigned_at: string | null;
  last_action_source: string | null;
  reassignment_count: number | null;
  last_reassigned_at: string | null;
  previous_assigned_to: string | null;
  escalation_count: number | null;
  is_billable: boolean | null;
  billed: boolean | null;
  billed_at: string | null;
  billing_amount: number | null;
  billing_status: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_status: string | null;
  billing_workflow_status: string | null;
  billing_hold_reason: string | null;
  is_disputed: boolean | null;
  dispute_reason: string | null;
  billing_notes: string | null;
  retry_count: number | null;
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
  const [activeTab, setActiveTab] = useState<"resources" | "leads" | "partners" | "applications" | "billing">("resources");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResource, setSelectedResource] = useState<AdminResource | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [additionalCategoryIds, setAdditionalCategoryIds] = useState<string[]>([]);
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<string[]>([]);
  const [, setLocation] = useLocation();
  const [leadStatusFilter, setLeadStatusFilter] = useState("");
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

  // Support Requests client-side filters
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStateFilter, setLeadStateFilter] = useState("");
  const [leadCategoryFilter, setLeadCategoryFilter] = useState("");
  const [leadRoutedFilter, setLeadRoutedFilter] = useState("");

  const [billingQueueFilter, setBillingQueueFilter] = useState<string>("ready");
  const [billingSelectedIds, setBillingSelectedIds] = useState<Set<string>>(new Set());
  const [holdReasonInput, setHoldReasonInput] = useState("");
  const [leadQuickFilter, setLeadQuickFilter] = useState("");
  const [showWorkflowHelper, setShowWorkflowHelper] = useState(false);

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
    enabled: authenticated && (activeTab === "leads" || activeTab === "billing"),
    refetchInterval: 15000,
    staleTime: 5000,
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/navigator-requests/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith("/api/admin/navigator-requests") });
      toast({ description: "Request permanently deleted" });
    },
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/navigator-requests/bulk-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ statuses: ["resolved", "cancelled"] }),
      });
      if (!res.ok) throw new Error("Failed to archive");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.startsWith("/api/admin/navigator-requests") });
      toast({ description: `${data.archived} lead(s) archived` });
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
        toast({ description: `Assigned to ${data.partner_name || "partner"} — email notification sent` });
      }
    },
  });

  const { data: partners = [], isLoading: partnersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/partners", adminKey],
    queryFn: () => fetch("/api/admin/partners", { headers: { "x-admin-key": adminKey } }).then(r => r.json()),
    enabled: authenticated && (activeTab === "partners" || activeTab === "leads" || activeTab === "billing"),
  });

  const { data: billingSummary } = useQuery<any>({
    queryKey: ["/api/admin/billing-summary", adminKey],
    queryFn: () => fetch("/api/admin/billing-summary", { headers: { "x-admin-key": adminKey } }).then(r => r.json()),
    enabled: authenticated && activeTab === "billing",
    refetchInterval: 15000,
  });

  const { data: suggestedPartners = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/leads", manualAssignLeadId, "suggest-partners", adminKey],
    queryFn: () =>
      fetch(`/api/admin/leads/${manualAssignLeadId}/suggest-partners`, {
        headers: { "x-admin-key": adminKey },
      }).then(r => r.json()),
    enabled: authenticated && !!manualAssignLeadId,
  });

  const assignLeadContext = useMemo(() => {
    if (!manualAssignLeadId) return null;
    const lead = navRequests.find((r: any) => r.id === manualAssignLeadId);
    return lead ? { category: lead.category || "", state: lead.user_state || "", city: lead.user_city || "" } : null;
  }, [manualAssignLeadId, navRequests]);

  const [assignSearchText, setAssignSearchText] = useState("");
  const [showAllAssignable, setShowAllAssignable] = useState(false);

  const assignableSearchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (assignSearchText.trim()) {
      params.set("q", assignSearchText.trim());
    } else if (!showAllAssignable && assignLeadContext) {
      if (assignLeadContext.state) params.set("state", assignLeadContext.state);
      if (assignLeadContext.category) params.set("category", assignLeadContext.category);
      if (assignLeadContext.city) params.set("city", assignLeadContext.city);
    }
    return params.toString();
  }, [assignSearchText, showAllAssignable, assignLeadContext]);

  const { data: assignableResults = [], isLoading: assignableLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/leads/assignable-search", assignableSearchParams, adminKey],
    queryFn: async () => {
      const r = await fetch(`/api/admin/leads/assignable-search?${assignableSearchParams}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    },
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

  const opsSummary = useMemo(() => {
    const now = Date.now();
    const h24 = 24 * 60 * 60 * 1000;
    const all = navRequests;
    const newLast24h = all.filter(r => (now - new Date(r.created_at).getTime()) < h24).length;
    const pending = all.filter(r => r.status === "new" || r.status === "in_progress").length;
    const readyToCharge = all.filter(r => r.billing_workflow_status === "ready" || (r.is_billable && !r.billed && !r.billing_workflow_status)).length;
    const failed = all.filter(r => r.billing_workflow_status === "failed").length;
    const onHold = all.filter(r => r.billing_workflow_status === "hold").length;
    const disputed = all.filter(r => r.is_disputed).length;
    const reviewRequired = all.filter(r => r.billing_workflow_status === "review_required").length;
    const totalProcessed = all.filter(r => r.status === "resolved" || r.billed).length;
    const totalSuccess = all.filter(r => r.billed || r.billing_workflow_status === "charged").length;
    const totalFailed = all.filter(r => r.billing_workflow_status === "failed").length;
    return { newLast24h, pending, readyToCharge, failed, onHold, disputed, reviewRequired, totalProcessed, totalSuccess, totalFailed };
  }, [navRequests]);

  const launchFilteredLeads = useMemo(() => {
    if (!leadQuickFilter) return filteredNavRequests;
    const now = Date.now();
    const h24 = 24 * 60 * 60 * 1000;
    return filteredNavRequests.filter(r => {
      if (leadQuickFilter === "24h") return (now - new Date(r.created_at).getTime()) < h24;
      if (leadQuickFilter === "pending") return r.status === "new" || r.status === "in_progress";
      if (leadQuickFilter === "ready") return r.billing_workflow_status === "ready" || (r.is_billable && !r.billed && !r.billing_workflow_status);
      if (leadQuickFilter === "failed") return r.billing_workflow_status === "failed";
      if (leadQuickFilter === "hold") return r.billing_workflow_status === "hold";
      if (leadQuickFilter === "disputed") return r.is_disputed;
      if (leadQuickFilter === "review") return r.billing_workflow_status === "review_required";
      if (leadQuickFilter === "caution") return (r.reassignment_count || 0) > 0 || r.is_disputed || r.response_status === "declined" || r.billing_workflow_status === "failed";
      return true;
    });
  }, [filteredNavRequests, leadQuickFilter]);

  const billingQueueLeads = useMemo(() => {
    return navRequests.filter(r => {
      if (billingQueueFilter === "all") return r.is_billable || r.billed;
      if (billingQueueFilter === "ready") return r.billing_workflow_status === "ready" || (r.is_billable && !r.billed && !r.billing_workflow_status);
      if (billingQueueFilter === "queued") return r.billing_workflow_status === "queued";
      if (billingQueueFilter === "charged") return r.billing_workflow_status === "charged" || r.billed;
      if (billingQueueFilter === "failed") return r.billing_workflow_status === "failed";
      if (billingQueueFilter === "hold") return r.billing_workflow_status === "hold";
      if (billingQueueFilter === "review_required") return r.billing_workflow_status === "review_required";
      return false;
    });
  }, [navRequests, billingQueueFilter]);

  const partnerNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of partners) m[p.id] = p.name;
    return m;
  }, [partners]);

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
            <Users className="h-3.5 w-3.5 mr-1.5" /> Support Requests
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
          <Button
            data-testid="tab-billing"
            variant={activeTab === "billing" ? "default" : "ghost"}
            size="sm"
            className="h-9 text-xs"
            onClick={() => setActiveTab("billing")}
          >
            <DollarSign className="h-3.5 w-3.5 mr-1.5" /> Billing
          </Button>
        </div>

        {(activeTab === "leads" || activeTab === "billing") && navRequests.length > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2" data-testid="ops-summary-panel">
              {[
                { label: "New (24h)", value: opsSummary.newLast24h, color: "text-blue-700", bg: "bg-blue-50" },
                { label: "Pending", value: opsSummary.pending, color: "text-amber-700", bg: "bg-amber-50" },
                { label: "Ready", value: opsSummary.readyToCharge, color: "text-green-700", bg: "bg-green-50" },
                { label: "Failed", value: opsSummary.failed, color: "text-red-700", bg: "bg-red-50" },
                { label: "Hold", value: opsSummary.onHold, color: "text-orange-700", bg: "bg-orange-50" },
                { label: "Disputed", value: opsSummary.disputed, color: "text-red-700", bg: "bg-red-50" },
                { label: "Review", value: opsSummary.reviewRequired, color: "text-purple-700", bg: "bg-purple-50" },
              ].map(item => (
                <div key={item.label} className={`${item.bg} rounded p-2 text-center`}>
                  <p className={`text-lg font-bold ${item.color}`} data-testid={`text-ops-${item.label.toLowerCase().replace(/[^a-z]/g, "")}`}>{item.value}</p>
                  <p className="text-[9px] text-muted-foreground uppercase">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span data-testid="text-ops-processed">Processed: <strong className="text-foreground">{opsSummary.totalProcessed}</strong></span>
                <span data-testid="text-ops-paid">Paid: <strong className="text-green-600">{opsSummary.totalSuccess}</strong></span>
                <span data-testid="text-ops-failed-total">Failed: <strong className="text-red-600">{opsSummary.totalFailed}</strong></span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-[10px]" data-testid="button-workflow-helper"
                onClick={() => setShowWorkflowHelper(!showWorkflowHelper)}>
                {showWorkflowHelper ? "Hide" : "Daily Checklist"}
              </Button>
            </div>

            {showWorkflowHelper && (
              <div className="border rounded p-3 bg-slate-50 space-y-1.5" data-testid="workflow-helper-panel">
                <p className="text-xs font-semibold text-slate-800">Daily Workflow Checklist</p>
                {[
                  { step: "1", text: "Review new leads (last 24h)", done: opsSummary.newLast24h === 0 },
                  { step: "2", text: "Review pending / partner responses", done: opsSummary.pending === 0 },
                  { step: "3", text: "Review ready-to-charge leads", done: opsSummary.readyToCharge === 0 },
                  { step: "4", text: "Move questionable leads to hold/review", done: false },
                  { step: "5", text: "Run billing for approved leads", done: false },
                  { step: "6", text: "Review failed payments and retry", done: opsSummary.failed === 0 },
                  { step: "7", text: "Review disputes and resolve", done: opsSummary.disputed === 0 },
                ].map(item => (
                  <div key={item.step} className={`flex items-center gap-2 text-xs ${item.done ? "text-green-600" : "text-slate-700"}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${item.done ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"}`}>{item.done ? "\u2713" : item.step}</span>
                    <span>{item.text}</span>
                    {item.done && <span className="text-[9px] text-green-500 ml-auto">Clear</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "leads" && (
          <>
            <div className="flex gap-2 flex-wrap">
              {(["", "new", "in_progress", "resolved", "cancelled", "archived"] as const).map((s) => (
                <Button
                  key={s || "all"}
                  data-testid={`lead-filter-${s || "all"}`}
                  variant={leadStatusFilter === s ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs capitalize"
                  onClick={() => setLeadStatusFilter(s)}
                >
                  {s ? s.replace("_", " ") : "All"}
                </Button>
              ))}
              {(leadStatusFilter === "resolved" || leadStatusFilter === "cancelled") && (
                <Button
                  data-testid="lead-bulk-archive"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-slate-500 border-slate-300 ml-auto"
                  onClick={() => bulkArchiveMutation.mutate()}
                  disabled={bulkArchiveMutation.isPending}
                >
                  {bulkArchiveMutation.isPending ? "Archiving..." : "Archive All"}
                </Button>
              )}
            </div>

            <div className="flex gap-1.5 flex-wrap" data-testid="launch-filters">
              {[
                { key: "", label: "All" },
                { key: "24h", label: "Last 24h" },
                { key: "pending", label: "Pending" },
                { key: "ready", label: "Ready" },
                { key: "failed", label: "Failed" },
                { key: "hold", label: "Hold" },
                { key: "disputed", label: "Disputed" },
                { key: "review", label: "Review" },
                { key: "caution", label: "Caution" },
              ].map(f => (
                <button
                  key={f.key}
                  data-testid={`launch-filter-${f.key || "all"}`}
                  className={`px-2 py-1 rounded text-[10px] font-medium border ${leadQuickFilter === f.key ? "bg-primary text-white border-primary" : f.key === "caution" ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                  onClick={() => setLeadQuickFilter(f.key)}
                >{f.label}</button>
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
                  {launchFilteredLeads.length}{launchFilteredLeads.length !== navRequests.length ? ` of ${navRequests.length}` : ""} request{navRequests.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {navLoading && <p className="text-center text-muted-foreground py-8">Loading...</p>}

            <div className="space-y-3">
              {[...launchFilteredLeads]
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

                    <div className="flex flex-wrap gap-1">
                      {(req.reassignment_count || 0) > 0 && (
                        <Badge data-testid={`badge-reassigned-${req.id}`} variant="outline" className="text-[9px] bg-yellow-100 text-yellow-800 border-yellow-300">
                          <ArrowRightLeft className="h-2.5 w-2.5 mr-0.5" /> Reassigned ({req.reassignment_count}x)
                        </Badge>
                      )}
                      {req.is_disputed && (
                        <Badge data-testid={`badge-disputed-${req.id}`} variant="outline" className="text-[9px] bg-red-100 text-red-800 border-red-300">
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> Disputed
                        </Badge>
                      )}
                      {req.billing_workflow_status === "failed" && (
                        <Badge data-testid={`badge-payment-failed-${req.id}`} variant="outline" className="text-[9px] bg-red-100 text-red-700 border-red-300">
                          Payment Failed
                        </Badge>
                      )}
                      {req.billing_workflow_status === "hold" && (
                        <Badge data-testid={`badge-on-hold-${req.id}`} variant="outline" className="text-[9px] bg-orange-100 text-orange-700 border-orange-300">
                          On Hold
                        </Badge>
                      )}
                      {req.billing_workflow_status === "review_required" && (
                        <Badge data-testid={`badge-review-${req.id}`} variant="outline" className="text-[9px] bg-purple-100 text-purple-700 border-purple-300">
                          Review
                        </Badge>
                      )}
                      {req.response_status === "declined" && (
                        <Badge data-testid={`badge-declined-${req.id}`} variant="outline" className="text-[9px] bg-slate-100 text-slate-700 border-slate-300">
                          Declined
                        </Badge>
                      )}
                      {((req.reassignment_count || 0) > 0 || req.is_disputed || req.response_status === "declined" || req.billing_workflow_status === "failed") && (
                        <span className="text-[9px] text-amber-600 font-semibold flex items-center gap-0.5" data-testid={`badge-caution-${req.id}`}>
                          <AlertTriangle className="h-2.5 w-2.5" /> CAUTION
                        </span>
                      )}
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

                    {(req.routed_to_partner_id || req.delivery_status || (Array.isArray(req.routing_history) && req.routing_history.length > 0)) && (() => {
                      const partnerMatch = partners.find(p => p.id === req.routed_to_partner_id);
                      const lastRoute = Array.isArray(req.routing_history) ? req.routing_history[req.routing_history.length - 1] : null;
                      const isResourceFallback = !req.routed_to_partner_id && lastRoute?.assignment_type === "resource_fallback";
                      const partnerName = req.routed_to_partner_id
                        ? (partnerMatch?.name || lastRoute?.partner_name || "Unknown Partner")
                        : (lastRoute?.partner_name || "Unknown Destination");
                      const recipientEmail = req.routed_to_partner_id
                        ? (partnerMatch?.contact_email || lastRoute?.recipient_email || null)
                        : (lastRoute?.recipient_email || null);
                      const isExternal = !!recipientEmail;
                      const destinationType = req.routed_to_partner_id ? "Trusted Partner" : isResourceFallback ? "Resource" : "Manual";
                      const deliveryMethod = isExternal ? "External email" : "Internal / manual";
                      const deliveryLabel = req.delivery_status === "delivered" ? "Delivered" :
                        req.delivery_status === "pending" || req.delivery_status === "ready_for_delivery" ? "Pending" :
                        req.delivery_status === "delivery_failed" ? "Failed" :
                        req.delivery_status === "fallback_manual" ? "Manual Required" :
                        req.delivery_status === "unrouted" ? "Unrouted" :
                        req.delivery_status === "escalated" ? "Escalated" :
                        req.delivery_status || "Unknown";
                      return (
                      <div className="text-[10px] bg-blue-50 text-blue-800 rounded p-2 border border-blue-200 space-y-1">
                        <p className="flex items-center gap-1 flex-wrap">
                          <ArrowRightLeft className="h-3 w-3 shrink-0" />
                          <span className="font-medium">
                            Assigned to: {partnerName}
                          </span>
                          {req.delivery_status && (
                            <Badge variant="outline" className={`text-[9px] ml-auto ${
                              req.delivery_status === "pending" || req.delivery_status === "ready_for_delivery" ? "bg-amber-100 text-amber-800" :
                              req.delivery_status === "delivered" ? "bg-green-100 text-green-800" :
                              req.delivery_status === "unrouted" ? "bg-slate-100 text-slate-700" :
                              req.delivery_status === "delivery_failed" ? "bg-red-100 text-red-700" :
                              req.delivery_status === "escalated" ? "bg-red-100 text-red-700" :
                              req.delivery_status === "fallback_manual" ? "bg-slate-100 text-slate-700" :
                              "bg-slate-100 text-slate-700"
                            }`}>
                              {deliveryLabel}
                            </Badge>
                          )}
                        </p>
                        <div className="text-[9px] text-blue-700 space-y-0.5 pl-4">
                          <p>Type: {destinationType}</p>
                          <p>Delivery: {deliveryMethod}</p>
                          <p>Status: {deliveryLabel}</p>
                          {req.routing_method && <p>Routing: <span className={`font-medium ${req.routing_method === "rotated" ? "text-indigo-700" : "text-blue-700"}`}>{req.routing_method === "rotated" ? "Rotated (Round-Robin)" : "Direct"}</span>{req.routing_scope_key ? ` [${req.routing_scope_key}]` : ""}</p>}
                          <p>Email Sent: {req.email_sent ? "Yes" : "No"}{req.email_sent_at ? ` (${new Date(req.email_sent_at).toLocaleString()})` : ""}</p>
                          <p>Response: <span className={`font-medium ${
                            req.response_status === "accepted" ? "text-green-700" :
                            req.response_status === "declined" ? "text-red-700" :
                            req.response_status === "completed" ? "text-green-800" :
                            req.response_status === "need_info" ? "text-amber-700" :
                            req.response_status === "escalation_required" ? "text-red-600 font-bold" :
                            "text-blue-700"
                          }`}>{(req.response_status || "pending").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</span></p>
                          {req.response_at && <p>Responded: {new Date(req.response_at).toLocaleString()}{req.last_action_source === "email_link" ? " (via email)" : ""}</p>}
                          {recipientEmail && <p>Recipient: {recipientEmail}</p>}
                          {req.assigned_at && <p>Assigned: {new Date(req.assigned_at).toLocaleString()}</p>}
                          {(req.reassignment_count ?? 0) > 0 && <p className="text-orange-600">Reassigned: {req.reassignment_count}x{req.last_reassigned_at ? ` (${new Date(req.last_reassigned_at).toLocaleString()})` : ""}</p>}
                          <p>Delivery: {req.routed_to_partner_id && req.email_sent && req.email_sent_at ? <span className="text-green-700">Verified ✓</span> : req.delivery_status === "delivery_failed" ? <span className="text-red-700">Failed ✗</span> : req.delivery_status === "fallback_manual" ? <span className="text-orange-600">Manual Review</span> : <span className="text-blue-600">Pending</span>}</p>
                        </div>
                        {req.billing_status !== undefined && req.billing_status !== null && (
                          <div className="text-[9px] mt-1 pt-1 border-t border-blue-200">
                            <p className="font-semibold text-blue-800 mb-0.5">Billing</p>
                            <p>Status: <span className={`font-medium ${
                              req.billing_status === "billed" ? "text-green-700" :
                              req.billing_status === "billable" ? "text-blue-700" :
                              req.billing_status === "disputed" ? "text-red-700" :
                              "text-slate-500"
                            }`}>{(req.billing_status || "not_billable").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</span></p>
                            <p>Amount: ${parseFloat(String(req.billing_amount || 49.99)).toFixed(2)}</p>
                            {req.billed && req.billed_at && <p>Billed: {new Date(req.billed_at).toLocaleString()}</p>}
                            {req.stripe_payment_intent_id && <p>Stripe PI: {req.stripe_payment_intent_id.substring(0, 20)}...</p>}
                            {req.stripe_payment_status && req.stripe_payment_status !== "pending" && <p>Payment: <span className={req.stripe_payment_status === "paid" ? "text-green-700 font-medium" : "text-slate-600"}>{req.stripe_payment_status}</span></p>}
                            {req.is_billable && !req.billed && (
                              <div className="flex gap-1 mt-1">
                                <button
                                  data-testid={`button-charge-now-${req.id}`}
                                  className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[9px] hover:bg-indigo-700"
                                  onClick={async () => {
                                    if (!window.confirm(`Create Stripe payment for $${parseFloat(String(req.billing_amount || 49.99)).toFixed(2)}?`)) return;
                                    try {
                                      const resp = await fetch(`/api/admin/billing-charge/${req.id}`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                                      });
                                      if (resp.ok) {
                                        const { url, reused } = await resp.json();
                                        if (url) {
                                          window.open(url, "_blank");
                                          setRequests((prev: NavigatorRequest[]) => prev.map((r: NavigatorRequest) => r.id === req.id ? { ...r, stripe_payment_status: "pending" } : r));
                                        }
                                      } else {
                                        const err = await resp.json();
                                        alert(err.error || "Failed to create charge");
                                      }
                                    } catch { alert("Network error"); }
                                  }}
                                >
                                  Charge Now
                                </button>
                                <button
                                  data-testid={`button-mark-billed-${req.id}`}
                                  className="px-2 py-0.5 bg-green-600 text-white rounded text-[9px] hover:bg-green-700"
                                  onClick={async () => {
                                    if (!window.confirm("Mark this lead as billed manually (without Stripe)? This cannot be undone.")) return;
                                    try {
                                      const resp = await fetch(`/api/admin/navigator-requests/${req.id}`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                                        body: JSON.stringify({ mark_billed: true }),
                                      });
                                      if (resp.ok) {
                                        const updated = await resp.json();
                                        setRequests((prev: NavigatorRequest[]) => prev.map((r: NavigatorRequest) => r.id === req.id ? { ...r, ...updated } : r));
                                      } else {
                                        const err = await resp.json();
                                        alert(err.error || "Failed to mark billed");
                                      }
                                    } catch { alert("Network error"); }
                                  }}
                                >
                                  Mark Billed
                                </button>
                                {req.stripe_checkout_session_id && req.stripe_payment_status === "pending" && (
                                  <button
                                    data-testid={`button-check-payment-${req.id}`}
                                    className="px-2 py-0.5 bg-slate-500 text-white rounded text-[9px] hover:bg-slate-600"
                                    onClick={async () => {
                                      try {
                                        const resp = await fetch(`/api/admin/billing-check-payment/${req.id}`, {
                                          headers: { "x-admin-key": adminKey },
                                        });
                                        if (resp.ok) {
                                          const result = await resp.json();
                                          if (result.status === "paid_now_billed") {
                                            setRequests((prev: NavigatorRequest[]) => prev.map((r: NavigatorRequest) => r.id === req.id ? { ...r, billed: true, billing_status: "billed", stripe_payment_status: "paid", billed_at: new Date().toISOString() } : r));
                                            alert("Payment confirmed — lead marked billed");
                                          } else if (result.status === "expired") {
                                            setRequests((prev: NavigatorRequest[]) => prev.map((r: NavigatorRequest) => r.id === req.id ? { ...r, stripe_payment_status: "expired", stripe_checkout_session_id: null } : r));
                                            alert("Checkout session expired — you can create a new one");
                                          } else {
                                            alert(`Payment status: ${result.status}`);
                                          }
                                        }
                                      } catch { alert("Network error"); }
                                    }}
                                  >
                                    Check
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          {req.routed_at && <p className="text-muted-foreground text-[9px]">Routed: {new Date(req.routed_at).toLocaleString()}</p>}
                          {(req.status === "new" || req.status === "in_progress") && (
                            <button
                              className="text-blue-600 underline text-[9px] hover:text-blue-800"
                              onClick={() => { setManualAssignLeadId(manualAssignLeadId === req.id ? null : req.id); setManualPartnerId(""); setAssignSearchText(""); setShowAllAssignable(false); }}
                            >
                              Change
                            </button>
                          )}
                        </div>
                      </div>
                      );
                    })()}

                    {!req.routed_to_partner_id && req.delivery_status !== "fallback_manual" && !req.delivery_status && !(Array.isArray(req.routing_history) && req.routing_history.some((h: any) => h.assignment_type === "resource_fallback")) && (
                      <div className="text-[10px] bg-teal-50 text-teal-800 rounded p-2 border border-teal-200 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span>Self-Serve — Veteran shown resources</span>
                        </div>
                        {(req.status === "new" || req.status === "in_progress") && (
                          <button
                            className="text-teal-700 underline whitespace-nowrap hover:text-teal-900"
                            onClick={() => { setManualAssignLeadId(req.id); setManualPartnerId(""); setAssignSearchText(""); setShowAllAssignable(false); }}
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
                          onClick={() => { setManualAssignLeadId(req.id); setManualPartnerId(""); setAssignSearchText(""); setShowAllAssignable(false); }}
                        >
                          Assign manually
                        </button>
                      </div>
                    )}

                    {manualAssignLeadId === req.id && (() => {
                      const typeLabel = (t: string) => {
                        if (t === "partner") return { text: "Partner", cls: "bg-blue-100 text-blue-800 border-blue-300" };
                        if (t === "resource") return { text: "Resource", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" };
                        if (t === "trusted_service") return { text: "Trusted Service", cls: "bg-purple-100 text-purple-800 border-purple-300" };
                        return { text: t, cls: "bg-slate-100 text-slate-700 border-slate-300" };
                      };

                      const contextLabel = [
                        req.category && req.category.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
                        req.user_state,
                        req.user_city && req.user_city.replace(/\b\w/g, (c: string) => c.toUpperCase()),
                      ].filter(Boolean).join(", ");

                      const handleAssign = (item: any) => {
                        if (item.type === "partner") {
                          rerouteMutation.mutate({ id: req.id, partner_id: item.id });
                        } else {
                          const typeLabel2 = item.type === "trusted_service" ? "Trusted Service" : "Resource";
                          const noteText = `Assigned to ${typeLabel2}: ${item.name}${item.phone ? " | " + item.phone : ""}${item.email ? " | " + item.email : ""}${item.website ? " | " + item.website : ""}`;
                          navPatchMutation.mutate({
                            id: req.id,
                            updates: { status: "in_progress", admin_notes: noteText },
                          });
                          if (item.email) {
                            fetch(`/api/admin/leads/${req.id}/send-assignment-email`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                              body: JSON.stringify({
                                recipientEmail: item.email,
                                recipientName: item.name,
                                contactName: item.contact || null,
                                assignmentType: item.type,
                              }),
                            }).then(r => {
                              if (r.ok) toast({ description: `Assigned to ${item.name} — external email sent to ${item.email}` });
                              else toast({ description: `Assigned to ${item.name} — email delivery failed (manual follow-up needed)`, variant: "destructive" });
                            }).catch(() => {
                              toast({ description: `Assigned to ${item.name} — email delivery failed (manual follow-up needed)`, variant: "destructive" });
                            });
                          } else {
                            toast({ description: `Assigned to ${item.name} — no email on file (manual follow-up needed)` });
                          }
                        }
                        setManualAssignLeadId(null);
                        setAssignSearchText("");
                        setShowAllAssignable(false);
                      };

                      const suggestedPartnerIds = new Set(suggestedPartners.map((s: any) => s.partnerId));
                      const recommendedResults = assignableResults.filter((item: any) => {
                        if (assignSearchText || showAllAssignable) return false;
                        if (!assignLeadContext?.category) return false;
                        const leadSlug = assignLeadContext.category.toLowerCase().replace(/\s+/g, "-").trim();
                        const leadWords = assignLeadContext.category.toLowerCase().replace(/-/g, " ").trim();
                        if (item.type === "partner") {
                          return suggestedPartnerIds.has(item.id);
                        }
                        if (!item.category) return false;
                        const itemSlug = item.category.toLowerCase().replace(/\s+/g, "-").trim();
                        const itemWords = item.category.toLowerCase().replace(/-/g, " ").trim();
                        const matchesCategory = itemSlug === leadSlug || itemWords === leadWords ||
                          itemSlug.startsWith(leadSlug) || leadSlug.startsWith(itemSlug);
                        if (!matchesCategory) return false;
                        const matchesLocation = assignLeadContext?.city && item.city && item.city.toLowerCase() === assignLeadContext.city.toLowerCase();
                        const matchesState = assignLeadContext?.state && item.state && item.state.toUpperCase() === assignLeadContext.state.toUpperCase();
                        return matchesLocation || matchesState;
                      });
                      const otherResults = assignableResults.filter((item: any) => !recommendedResults.find((r: any) => r.id === item.id));

                      const renderAssignButton = (item: any, isRecommended: boolean = false) => {
                        const tl = typeLabel(item.type);
                        return (
                          <button
                            key={item.id}
                            data-testid={`assignable-option-${item.id}`}
                            className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded text-left transition-colors ${isRecommended ? "border border-green-200 bg-green-50 hover:bg-green-100" : "border border-transparent hover:border-slate-200 hover:bg-slate-50"}`}
                            onClick={() => handleAssign(item)}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                {isRecommended && <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />}
                                <Badge variant="outline" className={`text-[8px] px-1 py-0 shrink-0 ${tl.cls}`}>{tl.text}</Badge>
                                <p className={`text-[11px] font-medium truncate ${isRecommended ? "text-green-800" : "text-slate-800"}`}>{item.name}</p>
                              </div>
                              <p className="text-[9px] text-muted-foreground truncate mt-0.5 ml-0.5">
                                {[item.category, item.city, item.state, item.contact, item.phone, item.email].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                            <span className={`text-[10px] font-medium shrink-0 ${isRecommended ? "text-green-700" : "text-primary"}`}>Assign</span>
                          </button>
                        );
                      };

                      return (
                      <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold text-slate-700">Assign Lead</p>
                          <button
                            className="text-[10px] text-muted-foreground underline hover:text-slate-600"
                            onClick={() => { setManualAssignLeadId(null); setAssignSearchText(""); setShowAllAssignable(false); }}
                          >
                            Close
                          </button>
                        </div>

                        {contextLabel && (
                          <p className="text-[9px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-1">
                            Lead: {contextLabel}
                          </p>
                        )}

                        {suggestedPartners.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] text-green-700 font-semibold uppercase tracking-wide flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Recommended Matches
                            </p>
                            {suggestedPartners.map((s: any) => (
                              <button
                                key={s.partnerId}
                                data-testid={`suggest-partner-${s.partnerId}`}
                                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded border border-green-200 bg-green-50 hover:bg-green-100 text-left transition-colors"
                                onClick={() => handleAssign({ id: s.partnerId, name: s.partnerName, type: "partner" })}
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
                                <Badge variant="outline" className="text-[9px] shrink-0 bg-green-200 text-green-900 border-green-400">Best Match</Badge>
                              </button>
                            ))}
                          </div>
                        )}

                        {!assignSearchText && !showAllAssignable && recommendedResults.length > 0 && suggestedPartners.length === 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] text-green-700 font-semibold uppercase tracking-wide flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Recommended Matches
                            </p>
                            {recommendedResults.map((item: any) => renderAssignButton(item, true))}
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                              {(suggestedPartners.length > 0 || recommendedResults.length > 0) && !assignSearchText && !showAllAssignable ? "All Matches" : "Find a match"}
                            </p>
                            {!showAllAssignable && !assignSearchText && assignLeadContext && (assignLeadContext.state || assignLeadContext.category) && (
                              <button
                                className="text-[9px] text-primary underline hover:text-primary/80"
                                data-testid="button-show-all-assignable"
                                onClick={() => setShowAllAssignable(true)}
                              >
                                Show all
                              </button>
                            )}
                            {(showAllAssignable || assignSearchText) && (
                              <button
                                className="text-[9px] text-primary underline hover:text-primary/80"
                                onClick={() => { setShowAllAssignable(false); setAssignSearchText(""); }}
                              >
                                Reset to filtered
                              </button>
                            )}
                          </div>

                          <div className="relative">
                            <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                            <Input
                              data-testid={`input-assign-search-${req.id}`}
                              className="h-6 text-[11px] pl-6"
                              placeholder="Search partners, resources, trusted services..."
                              value={assignSearchText}
                              onChange={(e) => setAssignSearchText(e.target.value)}
                            />
                          </div>

                          <div className="max-h-[260px] overflow-y-auto space-y-1 border rounded bg-white p-1.5">
                            {assignableLoading ? (
                              <p className="text-[10px] text-muted-foreground text-center py-3">Loading...</p>
                            ) : (assignSearchText || showAllAssignable ? assignableResults : otherResults).length === 0 && suggestedPartners.length === 0 && recommendedResults.length === 0 ? (
                              <div className="text-center py-3 space-y-1">
                                <p className="text-[10px] text-muted-foreground">No matches found</p>
                                {!showAllAssignable && !assignSearchText && (
                                  <button className="text-[9px] text-primary underline" onClick={() => setShowAllAssignable(true)}>
                                    Show all available options
                                  </button>
                                )}
                              </div>
                            ) : (
                              <>
                                <p className="text-[9px] text-muted-foreground px-1 pb-0.5">
                                  {assignSearchText ? `Search results (${assignableResults.length})` : showAllAssignable ? `All options (${assignableResults.length})` : `Other options (${otherResults.length})`}
                                </p>
                                {(assignSearchText || showAllAssignable ? assignableResults : otherResults).map((item: any) => renderAssignButton(item, false))}
                              </>
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
                      {(req.status === "resolved" || req.status === "cancelled") && (
                        <Button
                          data-testid={`lead-archive-${req.id}`}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-slate-500 border-slate-300"
                          onClick={() => navPatchMutation.mutate({ id: req.id, updates: { status: "archived" } })}
                          disabled={navPatchMutation.isPending}
                        >
                          Archive
                        </Button>
                      )}
                      {req.status === "archived" && (
                        <Button
                          data-testid={`lead-unarchive-${req.id}`}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-blue-600 border-blue-300"
                          onClick={() => navPatchMutation.mutate({ id: req.id, updates: { status: "resolved" } })}
                          disabled={navPatchMutation.isPending}
                        >
                          Unarchive
                        </Button>
                      )}
                      <Button
                        data-testid={`lead-delete-${req.id}`}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => {
                          if (window.confirm(`Permanently delete this request from ${req.full_name || "unknown"}? This cannot be undone.`)) {
                            deleteMutation.mutate(req.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
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
                              setAssignSearchText("");
                              setShowAllAssignable(false);
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
                    ? `No ${leadStatusFilter.replace("_", " ")} support requests.`
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

        {activeTab === "billing" && (
          <>
            <LaunchCommandCenter adminKey={adminKey} />
            <RotationPerformancePanel adminKey={adminKey} />
            <PartnerTransparencyPanel adminKey={adminKey} />
            <PartnerSubscriptionStatusPanel adminKey={adminKey} />
            <ActivationFunnelPanel adminKey={adminKey} />
            <MonetizationHardeningPanel adminKey={adminKey} />
            <SystemSafetyPanel adminKey={adminKey} />
            <AutomationControlPanel adminKey={adminKey} />
            <AutomationSupervisionPanel adminKey={adminKey} />

            {billingSummary?.available && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Card className="p-3">
                  <p className="text-[10px] text-muted-foreground uppercase">Ready to Charge</p>
                  <p className="text-xl font-bold text-blue-700" data-testid="text-billing-ready">{billingSummary.workflow?.ready || 0}</p>
                  <p className="text-[10px] text-muted-foreground">${((billingSummary.workflow?.ready || 0) * 49.99).toFixed(2)}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-[10px] text-muted-foreground uppercase">Charged</p>
                  <p className="text-xl font-bold text-green-700" data-testid="text-billing-charged">{billingSummary.workflow?.charged || billingSummary.billed || 0}</p>
                  <p className="text-[10px] text-muted-foreground">${(billingSummary.total_billed_amount || 0).toFixed(2)}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-[10px] text-muted-foreground uppercase">On Hold</p>
                  <p className="text-xl font-bold text-orange-600" data-testid="text-billing-hold">{billingSummary.workflow?.hold || 0}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-[10px] text-muted-foreground uppercase">Failed</p>
                  <p className="text-xl font-bold text-red-600" data-testid="text-billing-failed">{billingSummary.workflow?.failed || 0}</p>
                </Card>
              </div>
            )}

            <div className="flex gap-2 flex-wrap items-center">
              {(["ready", "queued", "charged", "failed", "hold", "review_required", "all"] as const).map(s => (
                <Button
                  key={s}
                  data-testid={`billing-filter-${s}`}
                  variant={billingQueueFilter === s ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs capitalize"
                  onClick={() => { setBillingQueueFilter(s); setBillingSelectedIds(new Set()); }}
                >
                  {s === "review_required" ? "Review" : s}
                </Button>
              ))}
              <div className="ml-auto flex gap-2">
                {billingSelectedIds.size > 0 && (
                  <>
                    <Button
                      data-testid="billing-bulk-queue"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={async () => {
                        const resp = await fetch("/api/admin/billing-bulk-update", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                          body: JSON.stringify({ ids: [...billingSelectedIds], billing_workflow_status: "queued" }),
                        });
                        const result = await resp.json();
                        if (resp.ok) {
                          toast({ description: `${result.updated} leads queued` });
                          setBillingSelectedIds(new Set());
                          queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.includes("billing") || (q.queryKey[0] as string)?.includes("navigator") });
                        } else { toast({ description: result.error, variant: "destructive" }); }
                      }}
                    >
                      Queue ({billingSelectedIds.size})
                    </Button>
                    <Button
                      data-testid="billing-bulk-hold"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs text-orange-600 border-orange-300"
                      onClick={async () => {
                        const reason = prompt("Hold reason (optional):");
                        const resp = await fetch("/api/admin/billing-bulk-update", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                          body: JSON.stringify({ ids: [...billingSelectedIds], billing_workflow_status: "hold", billing_hold_reason: reason || undefined }),
                        });
                        const result = await resp.json();
                        if (resp.ok) {
                          toast({ description: `${result.updated} leads placed on hold` });
                          setBillingSelectedIds(new Set());
                          queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.includes("billing") || (q.queryKey[0] as string)?.includes("navigator") });
                        } else { toast({ description: result.error, variant: "destructive" }); }
                      }}
                    >
                      Hold ({billingSelectedIds.size})
                    </Button>
                  </>
                )}
                <Button
                  data-testid="billing-export-csv"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = `/api/admin/billing-export?t=${Date.now()}`;
                    link.download = "billing-export.csv";
                    const xhr = new XMLHttpRequest();
                    xhr.open("GET", `/api/admin/billing-export`);
                    xhr.setRequestHeader("x-admin-key", adminKey);
                    xhr.responseType = "blob";
                    xhr.onload = () => {
                      const url = URL.createObjectURL(xhr.response);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "billing-export.csv";
                      a.click();
                      URL.revokeObjectURL(url);
                    };
                    xhr.send();
                  }}
                >
                  <Download className="h-3 w-3 mr-1" /> Export CSV
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{billingQueueLeads.length} lead{billingQueueLeads.length !== 1 ? "s" : ""}</p>

            {billingSelectedIds.size > 0 && (() => {
              const selectedLeads = billingQueueLeads.filter(l => billingSelectedIds.has(l.id));
              const eligible = selectedLeads.filter(l => {
                const wfs = l.billing_workflow_status || "";
                return (wfs === "queued" || wfs === "ready") && !l.billed && !l.is_disputed;
              });
              const ineligible = selectedLeads.filter(l => !eligible.find(e => e.id === l.id));
              const totalAmount = eligible.reduce((sum, l) => sum + (parseFloat(String(l.billing_amount || 49.99))), 0);
              const overLimit = eligible.length > 5;
              const canExecute = eligible.length > 0 && !overLimit;

              return (
                <div className="border rounded p-3 bg-slate-50 space-y-2" data-testid="batch-preview-panel">
                  <h4 className="text-[11px] font-semibold">Batch Preview</h4>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div><p className="text-[9px] text-muted-foreground">Selected</p><p className="text-sm font-bold">{selectedLeads.length}</p></div>
                    <div><p className="text-[9px] text-muted-foreground">Eligible</p><p className="text-sm font-bold text-green-600">{eligible.length}</p></div>
                    <div><p className="text-[9px] text-muted-foreground">Ineligible</p><p className="text-sm font-bold text-red-600">{ineligible.length}</p></div>
                    <div><p className="text-[9px] text-muted-foreground">Total Amount</p><p className="text-sm font-bold">${totalAmount.toFixed(2)}</p></div>
                  </div>
                  {ineligible.length > 0 && (
                    <div className="text-[9px] bg-red-50 border border-red-200 rounded p-1.5">
                      <span className="font-semibold text-red-700">Ineligible leads:</span>
                      {ineligible.map(l => {
                        const wfs = l.billing_workflow_status || "unknown";
                        let reason = l.billed ? "already billed" : l.is_disputed ? "disputed" : `status: ${wfs}`;
                        return <span key={l.id} className="text-red-600 ml-1">{l.id.substring(0, 8)} ({reason})</span>;
                      })}
                    </div>
                  )}
                  {overLimit && (
                    <div className="text-[9px] bg-amber-50 border border-amber-200 rounded p-1.5 text-amber-700 font-medium" data-testid="batch-over-limit">
                      Batch size exceeds safe limit (max 5). Deselect leads to proceed.
                    </div>
                  )}
                  {canExecute && (
                    <Button
                      data-testid="batch-execute-btn"
                      size="sm"
                      className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white w-full"
                      onClick={async () => {
                        if (!window.confirm(`Confirm batch charge of ${eligible.length} leads ($${totalAmount.toFixed(2)} total)?`)) return;
                        const resp = await fetch("/api/admin/billing-batch-charge", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                          body: JSON.stringify({ ids: eligible.map(l => l.id) }),
                        });
                        const result = await resp.json();
                        if (resp.ok) {
                          let msg = `Batch ${result.batch_id}: ${result.succeeded} checkout(s) created`;
                          if (result.failed > 0) msg += `, ${result.failed} failed`;
                          if (result.skipped > 0) msg += `, ${result.skipped} skipped`;
                          toast({ description: msg });
                          if (result.results) {
                            result.results.filter((r: any) => r.url).forEach((r: any) => window.open(r.url, "_blank"));
                          }
                          setBillingSelectedIds(new Set());
                          queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.includes("billing") || (q.queryKey[0] as string)?.includes("navigator") });
                        } else {
                          toast({ description: result.error, variant: "destructive" });
                        }
                      }}
                    >
                      Execute Batch Charge ({eligible.length} leads — ${totalAmount.toFixed(2)})
                    </Button>
                  )}
                </div>
              );
            })()}

            {navLoading && <p className="text-center text-muted-foreground py-8">Loading...</p>}

            <div className="space-y-1">
              {billingQueueLeads.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    data-testid="billing-select-all"
                    className="h-3.5 w-3.5"
                    checked={billingSelectedIds.size === billingQueueLeads.length && billingQueueLeads.length > 0}
                    onChange={e => {
                      if (e.target.checked) setBillingSelectedIds(new Set(billingQueueLeads.map(l => l.id)));
                      else setBillingSelectedIds(new Set());
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground">Select all</span>
                </div>
              )}
              {billingQueueLeads.map(lead => {
                const wfs = lead.billing_workflow_status || (lead.billed ? "charged" : lead.is_billable ? "ready" : "");
                const wfsColors: Record<string, string> = {
                  ready: "bg-blue-100 text-blue-800", queued: "bg-purple-100 text-purple-800",
                  charged: "bg-green-100 text-green-800", failed: "bg-red-100 text-red-800",
                  hold: "bg-orange-100 text-orange-800", review_required: "bg-yellow-100 text-yellow-800",
                };
                return (
                  <div key={lead.id} className="flex items-center gap-2 p-2 rounded border text-xs hover:bg-slate-50" data-testid={`billing-row-${lead.id}`}>
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 shrink-0"
                      checked={billingSelectedIds.has(lead.id)}
                      onChange={e => {
                        const next = new Set(billingSelectedIds);
                        e.target.checked ? next.add(lead.id) : next.delete(lead.id);
                        setBillingSelectedIds(next);
                      }}
                      data-testid={`billing-check-${lead.id}`}
                    />
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-6 gap-1 items-center">
                      <div className="truncate font-mono text-[10px]" title={lead.id}>{lead.id.substring(0, 8)}</div>
                      <div className="truncate text-[10px]">{partnerNameMap[lead.routed_to_partner_id || ""] || "—"}</div>
                      <div className="truncate text-[10px]">{(lead.category || "—").replace(/-/g, " ")}</div>
                      <div className="text-[10px]">{lead.user_city || ""}{lead.user_city && lead.user_state ? ", " : ""}{lead.user_state || ""}</div>
                      <div className="text-[10px] font-medium">${parseFloat(String(lead.billing_amount || 49.99)).toFixed(2)}</div>
                      <div className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${wfsColors[wfs] || "bg-slate-100 text-slate-600"}`}>
                          {(wfs || "n/a").replace(/_/g, " ")}
                        </span>
                        {lead.stripe_payment_status && lead.stripe_payment_status !== "pending" && (
                          <span className={`text-[9px] ${lead.stripe_payment_status === "paid" ? "text-green-600" : "text-slate-500"}`}>
                            {lead.stripe_payment_status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {wfs === "ready" && !lead.billed && (
                        <button
                          data-testid={`billing-charge-${lead.id}`}
                          className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[9px] hover:bg-indigo-700"
                          onClick={async () => {
                            if (!window.confirm(`Charge $${parseFloat(String(lead.billing_amount || 49.99)).toFixed(2)}?`)) return;
                            const resp = await fetch(`/api/admin/billing-charge/${lead.id}`, {
                              method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                            });
                            if (resp.ok) {
                              const { url } = await resp.json();
                              if (url) window.open(url, "_blank");
                              queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.includes("billing") || (q.queryKey[0] as string)?.includes("navigator") });
                            } else {
                              const err = await resp.json();
                              toast({ description: err.error, variant: "destructive" });
                            }
                          }}
                        >Charge</button>
                      )}
                      {wfs === "failed" && !lead.billed && (
                        <button
                          data-testid={`billing-retry-${lead.id}`}
                          className="px-2 py-0.5 bg-amber-600 text-white rounded text-[9px] hover:bg-amber-700"
                          onClick={async () => {
                            if (!window.confirm("Retry payment for this lead?")) return;
                            const resp = await fetch(`/api/admin/billing-retry/${lead.id}`, {
                              method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                            });
                            if (resp.ok) {
                              const { url } = await resp.json();
                              if (url) window.open(url, "_blank");
                              queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.includes("billing") || (q.queryKey[0] as string)?.includes("navigator") });
                            } else {
                              const err = await resp.json();
                              toast({ description: err.error, variant: "destructive" });
                            }
                          }}
                        >Retry</button>
                      )}
                      {wfs !== "hold" && wfs !== "charged" && !lead.billed && (
                        <button
                          data-testid={`billing-hold-${lead.id}`}
                          className="px-2 py-0.5 bg-orange-500 text-white rounded text-[9px] hover:bg-orange-600"
                          onClick={async () => {
                            const reason = prompt("Hold reason (optional):");
                            const resp = await fetch(`/api/admin/billing-workflow/${lead.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                              body: JSON.stringify({ billing_workflow_status: "hold", billing_hold_reason: reason || undefined }),
                            });
                            if (resp.ok) {
                              queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.includes("billing") || (q.queryKey[0] as string)?.includes("navigator") });
                              toast({ description: "Lead placed on hold" });
                            } else {
                              const err = await resp.json();
                              toast({ description: err.error, variant: "destructive" });
                            }
                          }}
                        >Hold</button>
                      )}
                      {wfs === "hold" && (
                        <button
                          data-testid={`billing-unhold-${lead.id}`}
                          className="px-2 py-0.5 bg-blue-500 text-white rounded text-[9px] hover:bg-blue-600"
                          onClick={async () => {
                            const endpoint = lead.is_disputed ? `/api/admin/billing-undispute/${lead.id}` : `/api/admin/billing-workflow/${lead.id}`;
                            const method = lead.is_disputed ? "POST" : "PATCH";
                            const body = lead.is_disputed ? {} : { billing_workflow_status: "ready" };
                            const resp = await fetch(endpoint, {
                              method,
                              headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                              body: JSON.stringify(body),
                            });
                            if (resp.ok) {
                              queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.includes("billing") || (q.queryKey[0] as string)?.includes("navigator") });
                              toast({ description: lead.is_disputed ? "Dispute resolved — lead is ready" : "Hold removed — lead is ready" });
                            } else {
                              const err = await resp.json();
                              toast({ description: err.error, variant: "destructive" });
                            }
                          }}
                        >{lead.is_disputed ? "Resolve Dispute" : "Remove Hold"}</button>
                      )}
                      {!lead.is_disputed && !lead.billed && wfs !== "charged" && (
                        <button
                          data-testid={`billing-dispute-${lead.id}`}
                          className="px-2 py-0.5 bg-red-500 text-white rounded text-[9px] hover:bg-red-600"
                          onClick={async () => {
                            const reason = prompt("Dispute reason:");
                            if (reason === null) return;
                            const resp = await fetch(`/api/admin/billing-dispute/${lead.id}`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                              body: JSON.stringify({ dispute_reason: reason }),
                            });
                            if (resp.ok) {
                              queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.includes("billing") || (q.queryKey[0] as string)?.includes("navigator") });
                              toast({ description: "Lead disputed — placed on hold" });
                            } else {
                              const err = await resp.json();
                              toast({ description: err.error, variant: "destructive" });
                            }
                          }}
                        >Dispute</button>
                      )}
                      {(lead.stripe_checkout_session_id && !lead.billed) && (
                        <button
                          data-testid={`billing-check-${lead.id}`}
                          className="px-2 py-0.5 bg-slate-500 text-white rounded text-[9px] hover:bg-slate-600"
                          onClick={async () => {
                            const resp = await fetch(`/api/admin/billing-check-payment/${lead.id}`, {
                              headers: { "x-admin-key": adminKey },
                            });
                            if (resp.ok) {
                              const result = await resp.json();
                              if (result.status === "paid_now_billed") {
                                toast({ description: "Payment confirmed — lead marked charged" });
                              } else if (result.status === "expired") {
                                toast({ description: "Checkout expired — can retry" });
                              } else {
                                toast({ description: `Status: ${result.status}` });
                              }
                              queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.includes("billing") || (q.queryKey[0] as string)?.includes("navigator") });
                            }
                          }}
                        >Check</button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 items-center ml-1">
                      {lead.billing_hold_reason && wfs === "hold" && (
                        <span className="text-[9px] text-orange-600 italic" title={lead.billing_hold_reason}>
                          {lead.billing_hold_reason.length > 25 ? lead.billing_hold_reason.substring(0, 25) + "..." : lead.billing_hold_reason}
                        </span>
                      )}
                      {lead.is_disputed && (
                        <span className="text-[9px] bg-red-100 text-red-700 px-1 rounded" data-testid={`text-disputed-${lead.id}`}>
                          DISPUTED{lead.dispute_reason ? `: ${lead.dispute_reason.substring(0, 20)}` : ""}
                        </span>
                      )}
                      {(lead.retry_count || 0) > 0 && (
                        <span className="text-[9px] text-amber-600" data-testid={`text-retry-${lead.id}`}>
                          Retry: {lead.retry_count}/3
                        </span>
                      )}
                      {lead.billed_at && (
                        <span className="text-[9px] text-muted-foreground">{new Date(lead.billed_at).toLocaleDateString()}</span>
                      )}
                      {lead.stripe_payment_intent_id && (
                        <span className="text-[9px] text-muted-foreground font-mono" title={lead.stripe_payment_intent_id}>PI: {lead.stripe_payment_intent_id.substring(0, 15)}...</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {!navLoading && billingQueueLeads.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No leads in {billingQueueFilter === "all" ? "billing" : billingQueueFilter.replace(/_/g, " ")} queue.
                </p>
              )}
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Billing Governance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded p-3">
                  <h4 className="text-xs font-semibold mb-2">Billing Config</h4>
                  <BillingConfigPanel adminKey={adminKey} />
                </div>
                <div className="border rounded p-3">
                  <h4 className="text-xs font-semibold mb-2">Recent Billing Runs</h4>
                  <BillingRunsPanel adminKey={adminKey} />
                </div>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Scale Transition Status</h3>
              <ScaleTransitionPanel adminKey={adminKey} />
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Batch Performance</h3>
              <BatchPerformancePanel adminKey={adminKey} />
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Batch Readiness Playbook</h3>
              <BatchReadinessPlaybook />
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Scale Readiness</h3>
              <ScaleReadinessPanel adminKey={adminKey} />
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Launch Monitoring</h3>
              <LaunchMonitoringPanel adminKey={adminKey} />
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Execution Visibility</h3>
              <ExecutionVisibilityPanel adminKey={adminKey} />
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Execution Playbook</h3>
              <ExecutionPlaybookPanel />
            </div>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Performance Intelligence</h3>
              <PerformanceIntelPanel adminKey={adminKey} />
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

function BillingConfigPanel({ adminKey }: { adminKey: string }) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/admin/billing-config", { headers: { "x-admin-key": adminKey } })
      .then(r => r.json()).then(setConfig).catch(() => setConfig(null)).finally(() => setLoading(false));
  }, [adminKey]);

  if (loading) return <p className="text-xs text-muted-foreground">Loading config...</p>;
  if (!config) return <p className="text-xs text-red-500">Config not available (run 5.3 SQL migration)</p>;

  const save = async (key: string, value: string) => {
    setSaving(true);
    try {
      const resp = await fetch("/api/admin/billing-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ [key]: value }),
      });
      if (resp.ok) {
        const updated = await resp.json();
        setConfig(updated);
        toast({ description: `Updated ${key}` });
      }
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="space-y-2 text-xs" data-testid="billing-config-panel">
      <div>
        <label className="font-medium">Mode:</label>
        <select className="ml-2 border rounded px-1 py-0.5 text-xs" value={config.billing_mode}
          onChange={(e) => save("billing_mode", e.target.value)} disabled={saving}>
          <option value="manual_only">Manual Only</option>
          <option value="controlled_batch">Controlled Batch</option>
        </select>
      </div>
      <div>
        <label className="font-medium">Allowed Categories:</label>
        <input className="ml-1 border rounded px-1 py-0.5 text-xs w-full" placeholder="comma-separated"
          defaultValue={(config.allowed_categories || []).join(",")}
          onBlur={(e) => save("allowed_categories_for_billing", e.target.value)} disabled={saving} />
      </div>
      <div>
        <label className="font-medium">Allowed States:</label>
        <input className="ml-1 border rounded px-1 py-0.5 text-xs w-full" placeholder="comma-separated (e.g. SC)"
          defaultValue={(config.allowed_states || []).join(",")}
          onBlur={(e) => save("allowed_states_for_billing", e.target.value)} disabled={saving} />
      </div>
    </div>
  );
}

function BillingRunsPanel({ adminKey }: { adminKey: string }) {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/billing-runs", { headers: { "x-admin-key": adminKey } })
      .then(r => r.json()).then(d => setRuns(Array.isArray(d) ? d : [])).catch(() => setRuns([])).finally(() => setLoading(false));
  }, [adminKey]);

  if (loading) return <p className="text-xs text-muted-foreground">Loading runs...</p>;
  if (runs.length === 0) return <p className="text-xs text-muted-foreground">No billing runs recorded yet.</p>;

  return (
    <div className="space-y-1 max-h-48 overflow-y-auto" data-testid="billing-runs-panel">
      {runs.slice(0, 20).map((run, i) => (
        <div key={run.id || i} className="flex items-center gap-2 text-[10px] border-b pb-1">
          <span className="text-muted-foreground">{new Date(run.executed_at).toLocaleString()}</span>
          <span className="font-medium">{run.mode}</span>
          <span>{run.number_of_leads_charged} leads</span>
          <span className="text-green-600">${Number(run.total_amount || 0).toFixed(2)}</span>
          <span className="text-muted-foreground">by {run.executed_by}</span>
        </div>
      ))}
    </div>
  );
}

const PERF_BADGE: Record<string, { label: string; className: string }> = {
  strong: { label: "STRONG", className: "bg-green-100 text-green-800 border-green-300" },
  moderate: { label: "MODERATE", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  weak: { label: "WEAK", className: "bg-orange-100 text-orange-800 border-orange-300" },
  inactive: { label: "INACTIVE", className: "bg-red-100 text-red-700 border-red-300" },
  high_value: { label: "HIGH VALUE", className: "bg-green-100 text-green-800 border-green-300" },
  emerging: { label: "EMERGING", className: "bg-blue-100 text-blue-800 border-blue-300" },
  low_conversion: { label: "LOW CONVERSION", className: "bg-orange-100 text-orange-800 border-orange-300" },
};

function LaunchCommandCenter({ adminKey }: { adminKey: string }) {
  const [data, setData] = useState<{ monitoring: any; batch: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/intelligence/launch-monitoring", { headers: { "x-admin-key": adminKey } }).then(r => r.json()),
      fetch("/api/admin/batch-performance-summary", { headers: { "x-admin-key": adminKey } }).then(r => r.json()),
    ]).then(([m, b]) => setData({ monitoring: m, batch: b })).catch(() => {}).finally(() => setLoading(false));
  }, [adminKey]);

  if (loading) return <p className="text-xs text-muted-foreground py-2">Loading command center...</p>;
  const m = data?.monitoring || {};
  const b = data?.batch || {};
  const signals = m.signals || [];
  const metrics = m.metrics || {};

  const has = (key: string) => signals.some((s: any) => s.key === key);
  const pressureKeys = ["high_billing_load", "high_pending", "high_attention"];
  const pressureCount = pressureKeys.filter(has).length;
  const transitionKeys = ["high_billing_load", "high_pending"];
  const batchReady = has("high_daily_volume") || has("high_billing_load");
  const billingReview = has("high_billing_load") && (has("payment_failures") || has("high_pending"));
  const transitionCount = transitionKeys.filter(has).length + (batchReady ? 1 : 0) + (billingReview ? 1 : 0);
  let scaleStatus = "manual_safe";
  if (transitionCount >= 2) scaleStatus = "transition_ready";
  else if (pressureCount >= 1) scaleStatus = "approaching_transition";

  const expansionState = b.batch_expansion_state || "conservative";

  const statusColors: Record<string, string> = {
    live_controlled: "bg-green-600",
  };

  return (
    <div className="space-y-3 mb-4" data-testid="launch-command-center">
      <div className={`rounded-lg p-3 ${statusColors.live_controlled} text-white`} data-testid="go-live-banner">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold tracking-wide">SYSTEM STATUS: LIVE (CONTROLLED MODE)</p>
            <p className="text-[10px] opacity-90">Manual billing with controlled batch execution. Monitoring active.</p>
          </div>
          <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-medium">Operating Mode: Controlled Manual + Batch</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="border rounded p-2 text-center">
          <p className="text-[9px] text-muted-foreground">Leads Today</p>
          <p className="text-lg font-bold" data-testid="cmd-leads-today">{metrics.today_leads || 0}</p>
        </div>
        <div className="border rounded p-2 text-center">
          <p className="text-[9px] text-muted-foreground">Pending</p>
          <p className="text-lg font-bold text-amber-600" data-testid="cmd-pending">{metrics.pending_leads || 0}</p>
        </div>
        <div className="border rounded p-2 text-center">
          <p className="text-[9px] text-muted-foreground">Ready to Charge</p>
          <p className="text-lg font-bold text-blue-600" data-testid="cmd-ready">{metrics.ready_to_charge || 0}</p>
        </div>
        <div className="border rounded p-2 text-center">
          <p className="text-[9px] text-muted-foreground">Batch Success Rate</p>
          <p className={`text-lg font-bold ${(b.avg_success_rate || 0) >= 90 ? "text-green-600" : (b.avg_success_rate || 0) >= 80 ? "text-yellow-600" : "text-red-600"}`} data-testid="cmd-batch-rate">{b.avg_success_rate || 0}%</p>
        </div>
        <div className="border rounded p-2 text-center">
          <p className="text-[9px] text-muted-foreground">Active Alerts</p>
          <p className={`text-lg font-bold ${signals.length > 0 ? "text-amber-600" : "text-green-600"}`} data-testid="cmd-alerts">{signals.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="border rounded p-1.5">
          <p className="text-[8px] text-muted-foreground">Expansion</p>
          <span className={`text-[9px] font-bold ${expansionState === "expansion_ready" ? "text-green-600" : expansionState === "expansion_risk" ? "text-red-600" : "text-slate-600"}`} data-testid="cmd-expansion">
            {expansionState.replace(/_/g, " ").toUpperCase()}
          </span>
        </div>
        <div className="border rounded p-1.5">
          <p className="text-[8px] text-muted-foreground">Scale Transition</p>
          <span className={`text-[9px] font-bold ${scaleStatus === "transition_ready" ? "text-amber-600" : scaleStatus === "approaching_transition" ? "text-yellow-600" : "text-green-600"}`} data-testid="cmd-scale">
            {scaleStatus.replace(/_/g, " ").toUpperCase()}
          </span>
        </div>
        <div className="border rounded p-1.5">
          <p className="text-[8px] text-muted-foreground">Trend</p>
          <span className={`text-[9px] font-bold ${b.trend_direction === "improving" ? "text-green-600" : b.trend_direction === "declining" ? "text-red-600" : "text-slate-600"}`} data-testid="cmd-trend">
            {b.trend_direction === "improving" ? "↑ IMPROVING" : b.trend_direction === "declining" ? "↓ DECLINING" : "→ STABLE"}
          </span>
        </div>
      </div>
    </div>
  );
}

const FAIRNESS_BADGE: Record<string, { label: string; className: string }> = {
  balanced: { label: "Balanced", className: "bg-green-100 text-green-800 border-green-300" },
  slight_skew: { label: "Slight Skew", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  imbalance_detected: { label: "Imbalance", className: "bg-red-100 text-red-800 border-red-300" },
  low_sample: { label: "Low Sample", className: "bg-gray-100 text-gray-600 border-gray-300" },
};

function PartnerTransparencyPanel({ adminKey }: { adminKey: string }) {
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>("");
  const [data, setData] = useState<{ partner_id: string; scopes: any[]; activity_level?: string; responsiveness_trend?: string; health_status?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/partners", { headers: { "x-admin-key": adminKey } })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPartners(d); })
      .catch(() => {});
  }, [adminKey]);

  const loadPartnerFairness = (pid: string) => {
    setSelectedPartner(pid);
    if (!pid) { setData(null); return; }
    setLoading(true);
    fetch(`/api/admin/partner-fairness/${pid}`, { headers: { "x-admin-key": adminKey } })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const trendIcon = (t: string) => t === "improving" ? "↑" : t === "slight_skew" ? "↓" : "→";
  const trendColor = (t: string) => t === "improving" ? "text-green-600" : t === "slight_skew" ? "text-amber-600" : "text-gray-500";
  const trendLabel = (t: string) => t === "improving" ? "Improving" : t === "slight_skew" ? "Slight Skew" : "Stable";

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold flex items-center gap-2" data-testid="text-partner-transparency-title">
          <ShieldCheck className="h-4 w-4" /> Partner Transparency
        </h3>
        <select value={selectedPartner} onChange={e => loadPartnerFairness(e.target.value)}
          className="text-[11px] border rounded px-2 py-1 bg-white max-w-[200px]"
          data-testid="select-partner-transparency">
          <option value="">Select partner…</option>
          {partners.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name || p.organization_name || p.id}</option>
          ))}
        </select>
      </div>

      {!selectedPartner && (
        <p className="text-xs text-muted-foreground">Select a partner to view their fairness data.</p>
      )}

      {loading && <p className="text-xs text-muted-foreground">Loading…</p>}

      {data && !loading && (
        <>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200" data-testid="badge-fair-distribution">FAIR DISTRIBUTION ACTIVE</Badge>
            <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200" data-testid="badge-rotation-enabled">ROTATION SYSTEM ENABLED</Badge>
          </div>

          <div className="bg-green-50/60 border border-green-100 rounded p-2.5 space-y-1 text-[9px] text-slate-700" data-testid="block-fairness-explanation">
            <p className="font-semibold text-green-800 text-[10px]">Fair Lead Distribution</p>
            <p>Veteran Care uses a fair rotation system to distribute leads evenly across eligible partners. No manual favoritism is applied.</p>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded p-2.5 space-y-1.5 text-[9px] text-slate-700" data-testid="block-lead-delivery">
            <p className="font-semibold text-slate-800 text-[10px]">How Leads Are Assigned</p>
            <p>Leads are assigned based on category, location, and availability. You receive leads when you match the user's request and are eligible at that time.</p>
            <p>Each eligible partner takes turns receiving leads within their service area, ensuring everyone gets a fair opportunity.</p>
          </div>

          <details className="group text-[9px]">
            <summary className="cursor-pointer font-semibold text-[10px] text-slate-700 py-1" data-testid="toggle-variability">Why does lead volume vary?</summary>
            <div className="bg-amber-50/50 border border-amber-100 rounded p-2.5 mt-1 space-y-1 text-slate-600" data-testid="block-variability">
              <p>Lead volume may vary due to:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Demand in your category</li>
                <li>Geographic matching with veteran requests</li>
                <li>Timing of incoming requests</li>
                <li>Partner availability within the rotation</li>
              </ul>
              <p className="mt-1">These fluctuations are normal and do not indicate a problem with your account.</p>
            </div>
          </details>

          {data.scopes.length === 0 && (
            <p className="text-xs text-muted-foreground">No rotated leads found for this partner.</p>
          )}

          {data.scopes.map((s: any) => {
            const devColor = Math.abs(s.deviation_pct) <= 7.5 ? "text-green-700" : Math.abs(s.deviation_pct) <= 15 ? "text-yellow-700" : "text-red-700";
            return (
              <div key={s.scope} className="border rounded p-2 space-y-1.5" data-testid={`card-transparency-scope-${s.scope}`}>
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] font-mono text-slate-600 truncate flex-1">{s.scope}</p>
                  <span className="relative group cursor-help" data-testid={`tooltip-trigger-${s.scope}`}>
                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 text-[8px] font-bold">?</span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 bg-slate-800 text-white text-[8px] rounded px-2 py-1.5 hidden group-hover:block z-10 shadow-lg" data-testid={`tooltip-content-${s.scope}`}>
                      Your current share reflects the rotation system distributing leads based on eligibility and timing. Small variations are normal.
                    </span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px]">
                  <span className="text-slate-500">Your Leads</span>
                  <span className="font-medium" data-testid={`text-your-leads-${s.scope}`}>{s.your_leads}</span>
                  <span className="text-slate-500">Partners in Scope</span>
                  <span className="font-medium">{s.partners_in_scope}</span>
                  <span className="text-slate-500">Expected Share</span>
                  <span className="font-medium">{s.expected_share_pct}%</span>
                  <span className="text-slate-500">Your Share</span>
                  <span className="font-medium">{s.your_share_pct}%</span>
                  <span className="text-slate-500">Deviation</span>
                  <span className={`font-medium ${devColor}`} data-testid={`text-deviation-${s.scope}`}>
                    {s.deviation_pct >= 0 ? "+" : ""}{s.deviation_pct}%
                  </span>
                  <span className="text-slate-500">Trend</span>
                  <span className={`font-medium ${trendColor(s.trend)}`} data-testid={`text-trend-${s.scope}`}>
                    {trendIcon(s.trend)} {trendLabel(s.trend)}
                  </span>
                </div>
              </div>
            );
          })}

          <div className="border-t pt-2 mt-1 space-y-2">
            <p className="font-semibold text-[10px] text-slate-800" data-testid="text-performance-heading">Performance Guidance</p>

            <div className="bg-slate-50 border border-slate-100 rounded p-2.5 text-[9px] text-slate-700 space-y-1" data-testid="block-fairness-vs-performance">
              <p>You are receiving a fair share of leads.</p>
              <p>Your results also depend on how quickly and consistently you engage with those leads.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="border rounded p-2 text-center" data-testid="card-activity-level">
                <p className="text-[9px] text-slate-500 mb-0.5">Activity Level</p>
                <p className={`text-[11px] font-semibold ${
                  data.activity_level === "active" ? "text-green-700" :
                  data.activity_level === "low" ? "text-red-600" : "text-amber-600"
                }`}>{data.activity_level === "active" ? "Active" : data.activity_level === "low" ? "Low" : "Moderate"}</p>
              </div>
              <div className="border rounded p-2 text-center" data-testid="card-responsiveness-trend">
                <p className="text-[9px] text-slate-500 mb-0.5">Responsiveness</p>
                <p className={`text-[11px] font-semibold ${
                  data.responsiveness_trend === "improving" ? "text-green-700" :
                  data.responsiveness_trend === "needs_attention" ? "text-amber-600" : "text-slate-600"
                }`}>{data.responsiveness_trend === "improving" ? "↑ Improving" : data.responsiveness_trend === "needs_attention" ? "Needs Attention" : "→ Stable"}</p>
              </div>
            </div>

            <div className="bg-purple-50/50 border border-purple-100 rounded p-2.5 space-y-1 text-[9px] text-slate-700" data-testid="block-how-to-improve">
              <p className="font-semibold text-[10px] text-purple-800">How to Improve Your Results</p>
              <p>Lead distribution is fair, but outcomes also depend on partner responsiveness, consistency, and availability.</p>
            </div>

            <div className="space-y-1 text-[9px] text-slate-600" data-testid="block-performance-factors">
              <div className="flex items-start gap-1.5"><span className="text-purple-500 mt-0.5">•</span><span><span className="font-medium">Response speed</span> — Partners who respond quickly often see better outcomes.</span></div>
              <div className="flex items-start gap-1.5"><span className="text-purple-500 mt-0.5">•</span><span><span className="font-medium">Consistency</span> — Consistent engagement helps you get more value from the platform.</span></div>
              <div className="flex items-start gap-1.5"><span className="text-purple-500 mt-0.5">•</span><span><span className="font-medium">Availability</span> — Staying active helps maintain consistent opportunities.</span></div>
              <div className="flex items-start gap-1.5"><span className="text-purple-500 mt-0.5">•</span><span><span className="font-medium">Engagement</span> — Engaging with every lead demonstrates commitment and reliability.</span></div>
            </div>
          </div>

          <div className="border-t pt-2 mt-1 space-y-2">
            <p className="font-semibold text-[10px] text-slate-800" data-testid="text-status-heading">Your Status</p>

            <div className={`rounded p-3 text-center border ${
              data.health_status === "healthy" ? "bg-green-50 border-green-200" :
              data.health_status === "at_risk" ? "bg-amber-50 border-amber-200" :
              "bg-red-50 border-red-200"
            }`} data-testid="card-health-status">
              <p className={`text-sm font-bold ${
                data.health_status === "healthy" ? "text-green-700" :
                data.health_status === "at_risk" ? "text-amber-700" :
                "text-red-700"
              }`}>{data.health_status === "healthy" ? "Healthy" : data.health_status === "at_risk" ? "At Risk" : "Needs Attention"}</p>
              <p className="text-[9px] text-slate-600 mt-1">{
                data.health_status === "healthy"
                  ? "You are actively engaging and in a strong position."
                  : data.health_status === "at_risk"
                  ? "Your engagement has slowed. Staying active will help maintain opportunities."
                  : "Your activity is currently low. Increasing engagement will help you get more value from the platform."
              }</p>
            </div>

            <details className="group text-[9px]">
              <summary className="cursor-pointer font-semibold text-[10px] text-slate-700 py-1" data-testid="toggle-success-guidance">How to Stay Successful</summary>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded p-2.5 mt-1 space-y-1.5 text-slate-600" data-testid="block-success-guidance">
                <div className="flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5">•</span><span>Respond to leads as quickly as possible to make the best impression.</span></div>
                <div className="flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5">•</span><span>Stay active on the platform to ensure you remain eligible for new leads.</span></div>
                <div className="flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5">•</span><span>Keep your availability up to date so the system can match you effectively.</span></div>
                <div className="flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5">•</span><span>Engage consistently with every opportunity to build long-term success.</span></div>
              </div>
            </details>
          </div>
        </>
      )}
    </Card>
  );
}

const ADVISORY_BADGE: Record<string, { label: string; className: string }> = {
  no_action: { label: "No Action", className: "bg-green-50 text-green-700 border-green-200" },
  monitor: { label: "Monitor", className: "bg-blue-50 text-blue-700 border-blue-200" },
  review_recommended: { label: "Review", className: "bg-amber-50 text-amber-700 border-amber-200" },
  intervention_required: { label: "Intervene", className: "bg-red-50 text-red-700 border-red-200" },
};

function PartnerSubscriptionStatusPanel({ adminKey }: { adminKey: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    fetch("/api/admin/partner-subscription-status", { headers: { "x-admin-key": adminKey } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [adminKey]);

  if (loading) return <Card className="p-4"><p className="text-xs text-muted-foreground">Loading subscription status...</p></Card>;
  if (!data || !data.partners) return null;

  const eligible = data.partners.filter((p: any) => p.routing_eligible);
  const ineligible = data.partners.filter((p: any) => !p.routing_eligible);

  const onbColor = (status: string) => {
    if (status === "active") return "bg-green-100 text-green-700";
    if (status === "invited") return "bg-blue-100 text-blue-700";
    if (status === "subscribed") return "bg-purple-100 text-purple-700";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <Card className="p-4 space-y-3" data-testid="panel-subscription-status">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-blue-600" />
        <h3 className="font-semibold text-sm">Subscription & Onboarding Status</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-slate-50 rounded p-2 border">
          <p className="text-muted-foreground uppercase">Billing Mode</p>
          <p className="font-bold text-sm" data-testid="text-billing-mode">{data.billing_mode}</p>
        </div>
        <div className="bg-slate-50 rounded p-2 border">
          <p className="text-muted-foreground uppercase">Routing Mode</p>
          <p className="font-bold text-sm" data-testid="text-routing-mode">{data.routing_mode}</p>
        </div>
      </div>

      {!data.subscription_columns_available && (
        <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[9px] text-amber-700" data-testid="text-migration-needed">
          Migration needed: Run <code>supabase/pre-scale-subscription-lock.sql</code> in Supabase SQL Editor to enable subscription-based routing lock.
        </div>
      )}

      <div className="space-y-1">
        <p className="text-[10px] font-semibold text-slate-700">Partner Activation Pipeline ({eligible.length} eligible / {ineligible.length} ineligible)</p>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {data.partners.map((p: any) => (
            <div key={p.id} className={`flex items-center justify-between text-[9px] px-2 py-1.5 rounded border ${
              p.routing_eligible ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`} data-testid={`row-partner-eligibility-${p.id}`}>
              <div className="flex-1 min-w-0">
                <span className="font-medium truncate block">{p.name}</span>
                {p.activation_date && (
                  <span className="text-[8px] text-muted-foreground">Activated: {new Date(p.activation_date).toLocaleDateString()}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${onbColor(p.onboarding_status)}`} data-testid={`badge-onboarding-${p.id}`}>{p.onboarding_status}</span>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${
                  p.subscription_status === "active" ? "bg-green-100 text-green-700" :
                  p.subscription_status === "past_due" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`} data-testid={`badge-sub-status-${p.id}`}>{p.subscription_status}</span>
                <span className={`w-2 h-2 rounded-full ${p.routing_eligible ? "bg-green-500" : "bg-red-500"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ActivationFunnelPanel({ adminKey }: { adminKey: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const { toast } = useToast();

  const loadData = () => {
    setLoading(true);
    fetch("/api/admin/activation-funnel", { headers: { "x-admin-key": adminKey } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [adminKey]);

  const handleFollowUp = async (partnerId: string, template: string) => {
    setSending(partnerId);
    try {
      const r = await fetch(`/api/admin/partner-follow-up/${partnerId}`, {
        method: "POST",
        headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });
      const d = await r.json();
      if (d.error) toast({ title: "Follow-up failed", description: d.error, variant: "destructive" });
      else { toast({ title: `${template.replace(/_/g, " ")} sent` }); loadData(); }
    } catch { toast({ title: "Follow-up failed", variant: "destructive" }); }
    setSending(null);
  };

  if (loading) return <Card className="p-4"><p className="text-xs text-muted-foreground">Loading activation funnel...</p></Card>;
  if (!data?.available) return null;

  const { funnel, conversion, stalled_partners, stalled_count } = data;

  const urgencyStyle = (u: string) => {
    if (u === "follow_up_now") return "bg-red-100 text-red-700 border-red-200";
    if (u === "follow_up_soon") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  const urgencyLabel = (u: string) => {
    if (u === "follow_up_now") return "Follow Up Now";
    if (u === "follow_up_soon") return "Follow Up Soon";
    return "Normal";
  };

  const onbBadge = (status: string) => {
    if (status === "active") return "bg-green-100 text-green-700";
    if (status === "invited") return "bg-blue-100 text-blue-700";
    if (status === "subscribed") return "bg-purple-100 text-purple-700";
    return "bg-slate-100 text-slate-600";
  };

  const followUpBadge = (status: string) => {
    if (status === "recovered") return "bg-green-100 text-green-700";
    if (status === "sent_2") return "bg-red-100 text-red-700";
    if (status === "sent_1") return "bg-amber-100 text-amber-700";
    if (status === "inactive") return "bg-slate-200 text-slate-600";
    return "bg-slate-50 text-slate-500";
  };

  const actionLabel: Record<string, string> = {
    resend_activation: "Resend Activation",
    reminder: "Send Reminder",
    urgency: "Send Urgency",
    payment_recovery: "Payment Recovery",
  };

  return (
    <Card className="p-4 space-y-4" data-testid="panel-activation-funnel">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <h3 className="font-semibold text-sm">Activation Funnel</h3>
          {(funnel.recovered || 0) > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-green-100 text-green-700" data-testid="text-recovered-count">{funnel.recovered} recovered</span>
          )}
        </div>
        <button onClick={loadData} className="text-[9px] text-blue-600 hover:underline" data-testid="button-refresh-funnel">Refresh</button>
      </div>

      {data.insights && data.recovery_performance?.some((r: any) => r.total_sent > 0) && (() => {
        const best = data.insights.best_performing;
        const worst = data.insights.worst_performing;
        const bestData = data.recovery_performance?.find((r: any) => r.type === best);
        const worstData = data.recovery_performance?.find((r: any) => r.type === worst);
        const fmtType = (t: string) => t?.replace(/_/g, " ") || "";
        return (
          <div className="space-y-1" data-testid="banner-recommended-action">
            {best && bestData && bestData.total_recovered > 0 && (
              <div className="bg-green-50 border border-green-200 rounded px-3 py-2 flex items-start gap-2">
                <span className="text-green-600 text-sm mt-0.5">&#9650;</span>
                <div>
                  <p className="text-[11px] font-semibold text-green-800" data-testid="text-best-recommendation">Recommended: {fmtType(best)}</p>
                  <p className="text-[9px] text-green-700">{fmtType(best)} follow-ups are converting best at {bestData.conversion_rate}% ({bestData.total_recovered}/{bestData.total_sent}) — consider using this first for stalled partners.</p>
                </div>
              </div>
            )}
            {worst && worstData && worstData.total_sent > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 flex items-start gap-2">
                <span className="text-amber-600 text-sm mt-0.5">&#9660;</span>
                <div>
                  <p className="text-[11px] font-semibold text-amber-800" data-testid="text-worst-recommendation">Low performer: {fmtType(worst)}</p>
                  <p className="text-[9px] text-amber-700">{fmtType(worst)} emails are converting at {worstData.conversion_rate}% ({worstData.total_recovered}/{worstData.total_sent}) — use cautiously or try a different approach.</p>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <div className="grid grid-cols-4 gap-2" data-testid="funnel-stage-counts">
        {[
          { label: "Approved", count: funnel.approved, color: "bg-slate-50 border-slate-200" },
          { label: "Invited", count: funnel.invited, color: "bg-blue-50 border-blue-200" },
          { label: "Subscribed", count: funnel.subscribed, color: "bg-purple-50 border-purple-200" },
          { label: "Active", count: funnel.active, color: "bg-green-50 border-green-200" },
        ].map(s => (
          <div key={s.label} className={`rounded p-2 border text-center ${s.color}`}>
            <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
            <p className="text-lg font-bold" data-testid={`text-funnel-${s.label.toLowerCase()}`}>{s.count}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2" data-testid="funnel-conversion-rates">
        {[
          { label: "Approval -> Invite", pct: conversion.approval_to_invite_pct },
          { label: "Invite -> Subscribe", pct: conversion.invite_to_subscription_pct },
          { label: "Subscribe -> Active", pct: conversion.subscription_to_activation_pct },
        ].map(c => (
          <div key={c.label} className="bg-white rounded p-2 border text-center">
            <p className="text-[9px] text-muted-foreground">{c.label}</p>
            <p className={`text-sm font-bold ${c.pct >= 80 ? "text-green-600" : c.pct >= 50 ? "text-amber-600" : "text-red-600"}`} data-testid={`text-conversion-${c.label.replace(/[^a-zA-Z]/g, "-").toLowerCase()}`}>{c.pct}%</p>
          </div>
        ))}
      </div>

      {stalled_count > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <p className="text-[11px] font-semibold text-slate-700">Stalled / Drop-Off Partners ({stalled_count})</p>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-1.5">
            {stalled_partners.map((p: any) => (
              <div key={p.id} className={`text-[9px] px-2 py-2 rounded border ${urgencyStyle(p.urgency)}`} data-testid={`row-stalled-partner-${p.id}`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{p.name}</span>
                    <span className="text-[8px] text-muted-foreground block">{p.email} | {p.hours_since_creation}h since approval</span>
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${onbBadge(p.onboarding_status)}`}>{p.onboarding_status}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${
                      p.urgency === "follow_up_now" ? "bg-red-200 text-red-800" :
                      p.urgency === "follow_up_soon" ? "bg-amber-200 text-amber-800" :
                      "bg-slate-200 text-slate-700"
                    }`} data-testid={`badge-urgency-${p.id}`}>{urgencyLabel(p.urgency)}</span>
                    {p.follow_up_status !== "none" && (
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${followUpBadge(p.follow_up_status)}`} data-testid={`badge-followup-${p.id}`}>{p.follow_up_status}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <div className="flex items-center gap-1 mr-auto text-[8px]">
                    {p.last_contact_at && (
                      <span className="text-muted-foreground">Last: {new Date(p.last_contact_at).toLocaleDateString()} ({p.last_contact_type})</span>
                    )}
                    <span className="text-blue-700 font-semibold" data-testid={`text-suggested-${p.id}`}>Suggested: {actionLabel[p.suggested_action] || p.suggested_action}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {["resend_activation", "reminder", "urgency", "payment_recovery"].map(tpl => (
                      <button
                        key={tpl}
                        onClick={() => handleFollowUp(p.id, tpl)}
                        disabled={sending === p.id}
                        className={`px-1.5 py-0.5 rounded text-[8px] border ${
                          tpl === p.suggested_action
                            ? "bg-blue-600 text-white border-blue-600 font-semibold"
                            : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                        } disabled:opacity-50`}
                        data-testid={`button-followup-${tpl}-${p.id}`}
                      >
                        {sending === p.id ? "..." : actionLabel[tpl]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stalled_count === 0 && (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
          <p className="text-xs text-green-700 font-medium" data-testid="text-no-stalled">All partners are fully activated</p>
        </div>
      )}

      {data.recovery_performance && data.recovery_performance.length > 0 && (
        <div className="space-y-2" data-testid="panel-recovery-performance">
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-blue-600" />
            <p className="text-[11px] font-semibold text-slate-700">Recovery Performance</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {data.recovery_performance.map((r: any) => {
              const isBest = data.insights?.best_performing === r.type;
              const isWorst = data.insights?.worst_performing === r.type;
              return (
                <div key={r.type} className={`rounded p-2 border text-center ${
                  isBest ? "bg-green-50 border-green-300 ring-1 ring-green-300" :
                  isWorst ? "bg-red-50 border-red-300 ring-1 ring-red-300" :
                  "bg-white border-slate-200"
                }`} data-testid={`card-recovery-${r.type}`}>
                  <p className="text-[9px] text-muted-foreground uppercase truncate">{r.type.replace(/_/g, " ")}</p>
                  <p className="text-sm font-bold" data-testid={`text-recovery-sent-${r.type}`}>{r.total_sent} sent</p>
                  <p className="text-[10px]" data-testid={`text-recovery-recovered-${r.type}`}>{r.total_recovered} recovered</p>
                  <p className={`text-xs font-bold ${r.conversion_rate >= 50 ? "text-green-600" : r.conversion_rate > 0 ? "text-amber-600" : "text-slate-400"}`} data-testid={`text-recovery-rate-${r.type}`}>{r.conversion_rate}%</p>
                  {isBest && <span className="text-[8px] font-semibold text-green-700">Best</span>}
                  {isWorst && <span className="text-[8px] font-semibold text-red-700">Lowest</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-slate-50 rounded p-2 border text-[9px] text-muted-foreground">
        <p><strong>Pending:</strong> {funnel.pending} partner{funnel.pending !== 1 ? "s" : ""} approved but not yet invited</p>
        <p><strong>Invited:</strong> {funnel.invited} partner{funnel.invited !== 1 ? "s" : ""} sent activation email, awaiting subscription</p>
        <p><strong>Subscribed:</strong> {funnel.subscribed} partner{funnel.subscribed !== 1 ? "s" : ""} initiated subscription, awaiting activation</p>
        {(funnel.recovered || 0) > 0 && <p><strong>Recovered:</strong> {funnel.recovered} partner{funnel.recovered !== 1 ? "s" : ""} activated after follow-up</p>}
      </div>
    </Card>
  );
}

function MonetizationHardeningPanel({ adminKey }: { adminKey: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [fixing, setFixing] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ partnerId: string; partnerName: string; action: string } | null>(null);
  const { toast: showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/monetization-hardening", { headers: { "x-admin-key": adminKey } });
      if (res.ok) setData(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleQuickFix = async (partnerId: string, action: string) => {
    setFixing(partnerId);
    setConfirmAction(null);
    try {
      const res = await fetch(`/api/admin/monetization-quick-fix/${partnerId}`, {
        method: "POST", headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (res.ok) {
        showToast({ title: "Action completed", description: `${action.replace(/_/g, " ")} applied to ${result.partner_name || "partner"}` });
        loadData();
      } else {
        showToast({ title: "Action failed", description: result.error || "Unknown error", variant: "destructive" });
      }
    } catch { showToast({ title: "Action failed", description: "Network error", variant: "destructive" }); }
    finally { setFixing(null); }
  };

  if (loading) return <Card className="p-4"><p className="text-xs text-muted-foreground">Loading hardening status...</p></Card>;
  if (!data?.available) return null;

  const s = data.summary;
  const mismatches: any[] = data.mismatches || [];
  const eligibility = data.eligibility || [];
  const recent: any[] = data.recent_blocks || [];
  const eligible = eligibility.filter((e: any) => e.eligible);
  const blocked = eligibility.filter((e: any) => !e.eligible);

  const actionLabels: Record<string, string> = {
    sync_from_stripe: "Sync Stripe", toggle_lead_enable: "Toggle Leads",
    reset_onboarding_status: "Reset Onboarding", mark_reviewed: "Mark Reviewed",
  };
  const mismatchActionMap: Record<string, string> = {
    subscription_mismatch: "sync_from_stripe", eligibility_mismatch: "toggle_lead_enable",
    onboarding_mismatch: "reset_onboarding_status", configuration_mismatch: "mark_reviewed",
  };

  const filteredMismatches = mismatches.filter((m: any) => {
    if (filter === "all") return true;
    if (filter === "critical") return m.severity === "critical";
    if (filter === "warning") return m.severity === "warning";
    if (filter === "subscription") return m.mismatch_type === "subscription_mismatch";
    if (filter === "eligibility") return m.mismatch_type === "eligibility_mismatch";
    if (filter === "onboarding") return m.mismatch_type === "onboarding_mismatch";
    return true;
  });

  return (
    <Card className="p-4 space-y-3" data-testid="panel-monetization-hardening">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-600" />
          <h3 className="text-sm font-bold text-slate-900" data-testid="text-hardening-title">Monetization Hardening & Reconciliation</h3>
          {s.last_24h > 0 && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-100 text-red-700" data-testid="text-blocks-24h">{s.last_24h} blocks (24h)</span>}
        </div>
        <button onClick={loadData} className="text-[9px] text-blue-600 hover:underline" data-testid="button-refresh-hardening">Refresh</button>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5" data-testid="hardening-summary">
        {[
          { label: "Total Mismatches", count: s.total_mismatches || 0, color: "bg-slate-50" },
          { label: "Critical", count: s.critical_mismatches || 0, color: "bg-red-50" },
          { label: "Unresolved", count: s.unresolved || 0, color: "bg-amber-50" },
          { label: "Resolved Today", count: s.resolved_today || 0, color: "bg-green-50" },
          { label: "Routing Blocked", count: s.routing_blocked, color: "bg-red-50" },
          { label: "Billing Blocked", count: s.billing_blocked, color: "bg-amber-50" },
          { label: "Eligible", count: eligible.length, color: "bg-green-50" },
          { label: "Blocked", count: blocked.length, color: "bg-red-50" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`rounded p-1.5 border text-center ${color}`}>
            <p className="text-[8px] text-muted-foreground uppercase truncate">{label}</p>
            <p className="text-sm font-bold">{count}</p>
          </div>
        ))}
      </div>

      {mismatches.length > 0 && (
        <div className="space-y-2" data-testid="reconciliation-section">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Reconciliation Review ({filteredMismatches.length})
            </p>
            <div className="flex gap-1 flex-wrap" data-testid="mismatch-filters">
              {[
                { key: "all", label: "All" }, { key: "critical", label: "Critical" }, { key: "warning", label: "Warning" },
                { key: "subscription", label: "Subscription" }, { key: "eligibility", label: "Eligibility" }, { key: "onboarding", label: "Onboarding" },
              ].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-1.5 py-0.5 rounded text-[8px] border ${filter === f.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                  data-testid={`filter-${f.key}`}>{f.label}</button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {filteredMismatches.map((m: any, i: number) => {
              const primaryAction = mismatchActionMap[m.mismatch_type] || "mark_reviewed";
              return (
                <div key={`${m.partner_id}-${m.mismatch_type}-${i}`}
                  className={`rounded border px-3 py-2 ${m.severity === "critical" ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}
                  data-testid={`mismatch-row-${m.partner_id}-${m.mismatch_type}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-900 truncate">{m.name}</span>
                        <span className={`px-1 py-0.5 rounded text-[7px] font-bold uppercase ${m.severity === "critical" ? "bg-red-600 text-white" : "bg-amber-500 text-white"}`}
                          data-testid={`badge-severity-${m.partner_id}`}>{m.severity}</span>
                        <span className="px-1 py-0.5 rounded text-[7px] font-medium bg-slate-200 text-slate-700"
                          data-testid={`badge-type-${m.partner_id}`}>{m.mismatch_type.replace(/_/g, " ")}</span>
                      </div>
                      <p className="text-[9px] text-slate-600 mt-0.5">{m.issues.join(" | ")}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {!m.routing_eligible && (
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-red-700 text-white" data-testid={`blocked-routing-${m.partner_id}`}>BLOCKED FROM ROUTING</span>
                        )}
                        {!m.billing_eligible && (
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-red-700 text-white" data-testid={`blocked-billing-${m.partner_id}`}>BLOCKED FROM BILLING</span>
                        )}
                        {m.routing_eligible && m.billing_eligible && (
                          <span className="px-1.5 py-0.5 rounded text-[7px] font-medium bg-green-100 text-green-800">Active</span>
                        )}
                      </div>
                      <p className="text-[9px] text-blue-700 font-medium mt-1" data-testid={`action-${m.partner_id}`}>{m.recommended_action}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => setConfirmAction({ partnerId: m.partner_id, partnerName: m.name, action: primaryAction })}
                        disabled={fixing === m.partner_id}
                        className="px-2 py-1 rounded text-[8px] font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        data-testid={`button-fix-${m.partner_id}`}>
                        {fixing === m.partner_id ? "..." : actionLabels[primaryAction]}
                      </button>
                      <button
                        onClick={() => setConfirmAction({ partnerId: m.partner_id, partnerName: m.name, action: "mark_reviewed" })}
                        disabled={fixing === m.partner_id}
                        className="px-2 py-1 rounded text-[8px] font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50"
                        data-testid={`button-review-${m.partner_id}`}>
                        Reviewed
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="space-y-1" data-testid="recent-blocks">
          <p className="text-[10px] font-bold text-slate-700">Audit Log ({recent.length})</p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {recent.slice(0, 20).map((r: any, i: number) => (
              <div key={r.id || i} className="flex items-start gap-2 bg-slate-50 border rounded px-2 py-1 text-[9px]">
                <span className={`px-1 py-0.5 rounded font-medium shrink-0 ${
                  r.event_type === "routing_blocked" ? "bg-red-100 text-red-700" :
                  r.event_type === "billing_blocked" ? "bg-amber-100 text-amber-700" :
                  r.event_type === "admin_action_taken" ? "bg-blue-100 text-blue-700" :
                  r.event_type === "mismatch_resolved" ? "bg-green-100 text-green-700" :
                  r.event_type === "subscription_mismatch" ? "bg-purple-100 text-purple-700" :
                  "bg-slate-100 text-slate-600"
                }`}>{r.event_type.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground truncate flex-1">{r.reason}</span>
                {r.resolved_at && <span className="text-green-600 text-[8px] shrink-0">resolved</span>}
                <span className="text-muted-foreground whitespace-nowrap shrink-0">{new Date(r.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {s.total_blocks === 0 && mismatches.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
          <p className="text-xs text-green-700 font-medium" data-testid="text-all-clear">All systems clear — no blocked actions or mismatches detected</p>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="confirm-modal">
          <div className="bg-white rounded-lg p-5 max-w-sm mx-4 shadow-xl">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Confirm Action</h4>
            <p className="text-xs text-slate-600 mb-1">
              Apply <span className="font-semibold">{confirmAction.action.replace(/_/g, " ")}</span> to:
            </p>
            <p className="text-sm font-semibold text-slate-900 mb-4">{confirmAction.partnerName}</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmAction(null)}
                className="px-3 py-1.5 rounded text-xs border border-slate-300 text-slate-700 hover:bg-slate-50"
                data-testid="button-cancel-confirm">Cancel</button>
              <button onClick={() => handleQuickFix(confirmAction.partnerId, confirmAction.action)}
                className="px-3 py-1.5 rounded text-xs bg-blue-600 text-white hover:bg-blue-700 font-medium"
                data-testid="button-execute-confirm">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function SystemSafetyPanel({ adminKey }: { adminKey: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modeChanging, setModeChanging] = useState(false);
  const [limitEditing, setLimitEditing] = useState<string | null>(null);
  const [limitValue, setLimitValue] = useState("");
  const [confirmMode, setConfirmMode] = useState<string | null>(null);
  const { toast: showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system-safety", { headers: { "x-admin-key": adminKey } });
      if (res.ok) setData(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleModeChange = async (mode: string) => {
    setModeChanging(true);
    setConfirmMode(null);
    try {
      const res = await fetch("/api/admin/system-safety/mode", {
        method: "POST", headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
        body: JSON.stringify({ mode, reason: "Manual admin change" }),
      });
      if (res.ok) {
        showToast({ title: "Mode changed", description: `System mode set to ${mode}` });
        loadData();
      } else {
        const r = await res.json();
        showToast({ title: "Failed", description: r.error, variant: "destructive" });
      }
    } catch { showToast({ title: "Failed", description: "Network error", variant: "destructive" }); }
    finally { setModeChanging(false); }
  };

  const handleLimitUpdate = async (key: string) => {
    const val = parseInt(limitValue);
    if (!val || val < 1) return;
    try {
      const res = await fetch("/api/admin/system-safety/limits", {
        method: "POST", headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: val }),
      });
      if (res.ok) {
        showToast({ title: "Limit updated", description: `${key} set to ${val}` });
        setLimitEditing(null);
        setLimitValue("");
        loadData();
      }
    } catch {}
  };

  if (loading) return <Card className="p-4"><p className="text-xs text-muted-foreground">Loading system safety...</p></Card>;
  if (!data?.available) return null;

  const modeColors: Record<string, string> = {
    normal: "bg-green-600 text-white",
    restricted: "bg-amber-500 text-white",
    safe_mode: "bg-red-600 text-white",
  };
  const modeLabels: Record<string, string> = {
    normal: "NORMAL", restricted: "RESTRICTED", safe_mode: "SAFE MODE",
  };

  const limitLabels: Record<string, string> = {
    max_leads_per_partner_per_day: "Max Leads/Partner/Day",
    max_batch_size: "Max Batch Size",
    max_daily_billing_attempts: "Max Daily Billing Attempts",
    max_failed_payments_threshold: "Failed Payment Threshold",
    routing_rate_per_minute: "Routing Rate/Min",
    billing_rate_per_minute: "Billing Rate/Min",
  };

  const alerts: any[] = data.alerts || [];
  const checks: any[] = data.readiness?.checks || [];

  return (
    <Card className="p-4 space-y-3" data-testid="panel-system-safety">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900" data-testid="text-safety-title">System Safety Panel</h3>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${modeColors[data.system_mode] || "bg-slate-200"}`}
            data-testid="badge-system-mode">{modeLabels[data.system_mode] || data.system_mode}</span>
        </div>
        <button onClick={loadData} className="text-[9px] text-blue-600 hover:underline" data-testid="button-refresh-safety">Refresh</button>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-1" data-testid="safety-alerts">
          {alerts.map((a: any, i: number) => (
            <div key={i} className={`rounded border px-3 py-2 flex items-center gap-2 ${a.severity === "critical" ? "bg-red-50 border-red-300" : "bg-amber-50 border-amber-300"}`}
              data-testid={`alert-${i}`}>
              <AlertTriangle className={`h-4 w-4 shrink-0 ${a.severity === "critical" ? "text-red-600" : "text-amber-600"}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-bold ${a.severity === "critical" ? "text-red-800" : "text-amber-800"}`}>{a.alert_type}</p>
                <p className="text-[9px] text-slate-600">{a.message}</p>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase ${a.severity === "critical" ? "bg-red-600 text-white" : "bg-amber-500 text-white"}`}>{a.severity}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2" data-testid="safety-readiness">
        <div className={`rounded border p-2 text-center ${data.readiness?.automation_ready ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <p className="text-[8px] text-muted-foreground uppercase">Automation Ready</p>
          <p className={`text-sm font-bold ${data.readiness?.automation_ready ? "text-green-700" : "text-red-700"}`}
            data-testid="text-automation-ready">{data.readiness?.automation_ready ? "YES" : "NO"}</p>
        </div>
        <div className={`rounded border p-2 text-center ${data.readiness?.safety_checks_passed ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
          <p className="text-[8px] text-muted-foreground uppercase">Safety Checks</p>
          <p className={`text-sm font-bold ${data.readiness?.safety_checks_passed ? "text-green-700" : "text-amber-700"}`}
            data-testid="text-safety-passed">{data.readiness?.safety_checks_passed ? "PASSED" : "ISSUES"}</p>
        </div>
        <div className="rounded border p-2 text-center bg-slate-50">
          <p className="text-[8px] text-muted-foreground uppercase">Routing Rate</p>
          <p className="text-sm font-bold" data-testid="text-routing-rate">{data.rate_limits?.routing?.current || 0}/{data.rate_limits?.routing?.limit || 0}</p>
        </div>
        <div className="rounded border p-2 text-center bg-slate-50">
          <p className="text-[8px] text-muted-foreground uppercase">Billing Rate</p>
          <p className="text-sm font-bold" data-testid="text-billing-rate">{data.rate_limits?.billing?.current || 0}/{data.rate_limits?.billing?.limit || 0}</p>
        </div>
      </div>

      {checks.length > 0 && (
        <div className="space-y-1" data-testid="readiness-checks">
          <p className="text-[10px] font-bold text-slate-700">Readiness Checks</p>
          {checks.map((c: any, i: number) => (
            <div key={i} className="flex items-center justify-between bg-slate-50 border rounded px-2 py-1">
              <span className="text-[9px] text-slate-800">{c.name}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] text-muted-foreground">{c.detail}</span>
                <span className={`px-1 py-0.5 rounded text-[7px] font-bold ${c.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  data-testid={`check-${i}`}>{c.passed ? "PASS" : "FAIL"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5" data-testid="safety-mode-control">
        <p className="text-[10px] font-bold text-slate-700">System Mode Control</p>
        <div className="flex gap-1.5">
          {(["normal", "restricted", "safe_mode"] as const).map(m => (
            <button key={m} disabled={data.system_mode === m || modeChanging}
              onClick={() => setConfirmMode(m)}
              className={`px-2.5 py-1 rounded text-[9px] font-medium border ${
                data.system_mode === m ? modeColors[m] + " cursor-default" :
                "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              } disabled:opacity-50`}
              data-testid={`button-mode-${m}`}>{modeLabels[m]}</button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5" data-testid="safety-limits">
        <p className="text-[10px] font-bold text-slate-700">Safety Limits</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {Object.entries(data.limits || {}).map(([key, val]) => (
            <div key={key} className="bg-slate-50 border rounded px-2 py-1.5">
              <p className="text-[8px] text-muted-foreground uppercase truncate">{limitLabels[key] || key}</p>
              <div className="flex items-center justify-between mt-0.5">
                {limitEditing === key ? (
                  <div className="flex items-center gap-1">
                    <input type="number" value={limitValue} onChange={e => setLimitValue(e.target.value)}
                      className="w-14 text-xs border rounded px-1 py-0.5" min={1}
                      data-testid={`input-limit-${key}`} />
                    <button onClick={() => handleLimitUpdate(key)} className="text-[8px] text-green-600 font-medium" data-testid={`button-save-${key}`}>Save</button>
                    <button onClick={() => { setLimitEditing(null); setLimitValue(""); }} className="text-[8px] text-slate-400">X</button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-bold" data-testid={`text-limit-${key}`}>{String(val)}</p>
                    <button onClick={() => { setLimitEditing(key); setLimitValue(String(val)); }}
                      className="text-[8px] text-blue-600 hover:underline" data-testid={`button-edit-${key}`}>Edit</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirmMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="confirm-mode-modal">
          <div className="bg-white rounded-lg p-5 max-w-sm mx-4 shadow-xl">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Confirm Mode Change</h4>
            <p className="text-xs text-slate-600 mb-1">Switch system to:</p>
            <p className={`text-sm font-bold mb-1 ${confirmMode === "safe_mode" ? "text-red-700" : confirmMode === "restricted" ? "text-amber-700" : "text-green-700"}`}>
              {modeLabels[confirmMode] || confirmMode}
            </p>
            {confirmMode === "safe_mode" && (
              <p className="text-[10px] text-red-600 mb-3">Safe mode will pause batch billing and restrict routing to minimal flow.</p>
            )}
            <div className="flex gap-2 justify-end mt-3">
              <button onClick={() => setConfirmMode(null)} className="px-3 py-1.5 rounded text-xs border border-slate-300 text-slate-700 hover:bg-slate-50"
                data-testid="button-cancel-mode">Cancel</button>
              <button onClick={() => handleModeChange(confirmMode)} className="px-3 py-1.5 rounded text-xs bg-blue-600 text-white hover:bg-blue-700 font-medium"
                data-testid="button-confirm-mode">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function AutomationControlPanel({ adminKey }: { adminKey: string }) {
  const [data, setData] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<string | null>(null);
  const [confirmRun, setConfirmRun] = useState<string | null>(null);
  const { toast: showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [statusRes, suggestRes] = await Promise.all([
        fetch("/api/admin/automation-status", { headers: { "x-admin-key": adminKey } }),
        fetch("/api/admin/automation-suggestions", { headers: { "x-admin-key": adminKey } }),
      ]);
      if (statusRes.ok) setData(await statusRes.json());
      if (suggestRes.ok) setSuggestions(await suggestRes.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleModeChange = async (mode: string) => {
    setConfirmMode(null);
    try {
      const res = await fetch("/api/admin/automation-mode", {
        method: "POST", headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (res.ok) { showToast({ title: "Mode changed", description: `Automation set to ${mode.replace(/_/g, " ")}` }); loadData(); }
      else { const r = await res.json(); showToast({ title: "Failed", description: r.error, variant: "destructive" }); }
    } catch { showToast({ title: "Failed", description: "Network error", variant: "destructive" }); }
  };

  const handlePauseResume = async (action: string) => {
    try {
      const res = await fetch("/api/admin/automation-pause", {
        method: "POST", headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: "Admin manual control" }),
      });
      if (res.ok) { showToast({ title: action === "pause" ? "Paused" : "Resumed", description: `Automation ${action}d` }); loadData(); }
    } catch {}
  };

  const handleRunAutomation = async (type: string) => {
    setConfirmRun(null);
    setRunning(type);
    try {
      const res = await fetch(`/api/admin/automation-run/${type}`, {
        method: "POST", headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
      });
      const result = await res.json();
      if (res.ok) {
        const successCount = (result.results || []).filter((r: any) => r.result === "success").length;
        const skippedCount = (result.results || []).filter((r: any) => r.result === "skipped").length;
        showToast({ title: result.executed ? "Automation ran" : "Blocked", description: result.blocked_reason || `${successCount} success, ${skippedCount} skipped` });
        loadData();
      } else {
        showToast({ title: "Failed", description: result.error, variant: "destructive" });
      }
    } catch { showToast({ title: "Failed", description: "Network error", variant: "destructive" }); }
    finally { setRunning(null); }
  };

  if (loading) return <Card className="p-4"><p className="text-xs text-muted-foreground">Loading automation control...</p></Card>;
  if (!data?.available) return null;

  const modeColors: Record<string, string> = {
    manual_only: "bg-slate-500 text-white", assisted: "bg-blue-500 text-white", semi_auto: "bg-green-600 text-white",
  };
  const modeLabels: Record<string, string> = {
    manual_only: "MANUAL ONLY", assisted: "ASSISTED", semi_auto: "SEMI-AUTO",
  };
  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800", paused: "bg-amber-100 text-amber-800",
    restricted: "bg-red-100 text-red-800", disabled: "bg-slate-100 text-slate-600",
  };

  const billingS = suggestions?.billing_suggestions || [];
  const followUpS = suggestions?.follow_up_suggestions || [];
  const recentActions: any[] = data.recent_actions || [];
  const warnings: string[] = data.warnings || [];

  return (
    <Card className="p-4 space-y-3" data-testid="panel-automation-control">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900" data-testid="text-automation-title">Automation Control</h3>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${modeColors[data.automation_mode] || "bg-slate-200"}`}
            data-testid="badge-automation-mode">{modeLabels[data.automation_mode] || data.automation_mode}</span>
          <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium ${statusColors[data.status] || "bg-slate-100"}`}
            data-testid="badge-automation-status">{data.status?.toUpperCase()}</span>
        </div>
        <button onClick={loadData} className="text-[9px] text-blue-600 hover:underline" data-testid="button-refresh-automation">Refresh</button>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-1" data-testid="automation-warnings">
          {warnings.map((w: string, i: number) => (
            <div key={i} className="bg-amber-50 border border-amber-200 rounded px-2 py-1.5 text-[9px] text-amber-800 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" /> {w}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <p className="text-[10px] font-bold text-slate-700">Mode Control</p>
        <div className="flex gap-1.5 flex-wrap">
          {(["manual_only", "assisted", "semi_auto"] as const).map(m => (
            <button key={m} disabled={data.automation_mode === m}
              onClick={() => setConfirmMode(m)}
              className={`px-2.5 py-1 rounded text-[9px] font-medium border ${
                data.automation_mode === m ? modeColors[m] + " cursor-default" :
                "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              } disabled:opacity-60`}
              data-testid={`button-auto-mode-${m}`}>{modeLabels[m]}</button>
          ))}
          <div className="ml-auto flex gap-1">
            {!data.is_paused ? (
              <button onClick={() => handlePauseResume("pause")}
                className="px-2 py-1 rounded text-[9px] font-medium bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
                data-testid="button-pause-automation">Pause</button>
            ) : (
              <button onClick={() => handlePauseResume("resume")}
                className="px-2 py-1 rounded text-[9px] font-medium bg-green-100 text-green-700 border border-green-200 hover:bg-green-200"
                data-testid="button-resume-automation">Resume</button>
            )}
          </div>
        </div>
      </div>

      {data.automation_mode !== "manual_only" && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-slate-700">Run Automation</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmRun("billing")} disabled={!!running}
              className="px-3 py-1.5 rounded text-[9px] font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              data-testid="button-run-billing">{running === "billing" ? "Running..." : "Run Auto Billing"}</button>
            <button onClick={() => setConfirmRun("follow-ups")} disabled={!!running}
              className="px-3 py-1.5 rounded text-[9px] font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              data-testid="button-run-followups">{running === "follow-ups" ? "Running..." : "Run Auto Follow-Ups"}</button>
          </div>
        </div>
      )}

      {data.automation_mode === "assisted" && (billingS.length > 0 || followUpS.length > 0) && (
        <div className="space-y-1.5" data-testid="automation-suggestions">
          <p className="text-[10px] font-bold text-slate-700">Suggestions (Assisted Mode)</p>
          {billingS.length > 0 && (
            <div className="space-y-0.5">
              <p className="text-[9px] text-blue-700 font-medium">Billing ({billingS.length})</p>
              {billingS.slice(0, 5).map((s: any) => (
                <div key={s.lead_id} className="bg-blue-50 border border-blue-100 rounded px-2 py-1 text-[9px]">
                  <span className="font-medium">{s.partner_name}</span> — {s.category} — {s.reason}
                </div>
              ))}
            </div>
          )}
          {followUpS.length > 0 && (
            <div className="space-y-0.5">
              <p className="text-[9px] text-purple-700 font-medium">Follow-Ups ({followUpS.length})</p>
              {followUpS.slice(0, 5).map((s: any) => (
                <div key={s.partner_id} className="bg-purple-50 border border-purple-100 rounded px-2 py-1 text-[9px]">
                  <span className="font-medium">{s.partner_name}</span> — {s.template} — {s.reason}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {recentActions.length > 0 && (
        <div className="space-y-1" data-testid="automation-recent-actions">
          <p className="text-[10px] font-bold text-slate-700">Recent Actions ({recentActions.length})</p>
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {recentActions.map((a: any, i: number) => (
              <div key={i} className="flex items-start gap-1.5 bg-slate-50 border rounded px-2 py-1 text-[9px]">
                <span className={`px-1 py-0.5 rounded font-medium shrink-0 ${
                  a.result === "success" ? "bg-green-100 text-green-700" :
                  a.result === "blocked" ? "bg-red-100 text-red-700" :
                  a.result === "skipped" ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-600"
                }`}>{a.result}</span>
                <span className="text-slate-500 shrink-0">{a.action_type.replace(/_/g, " ")}</span>
                <span className="text-muted-foreground truncate flex-1">{a.reason}</span>
                <span className="text-muted-foreground whitespace-nowrap shrink-0">{new Date(a.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="confirm-auto-mode-modal">
          <div className="bg-white rounded-lg p-5 max-w-sm mx-4 shadow-xl">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Change Automation Mode</h4>
            <p className="text-xs text-slate-600 mb-1">Switch to:</p>
            <p className="text-sm font-bold mb-3">{modeLabels[confirmMode] || confirmMode}</p>
            {confirmMode === "semi_auto" && (
              <p className="text-[10px] text-amber-700 mb-2">Semi-auto will execute limited actions when safety conditions pass. Admin override always available.</p>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmMode(null)} className="px-3 py-1.5 rounded text-xs border border-slate-300 text-slate-700 hover:bg-slate-50"
                data-testid="button-cancel-auto-mode">Cancel</button>
              <button onClick={() => handleModeChange(confirmMode)} className="px-3 py-1.5 rounded text-xs bg-blue-600 text-white hover:bg-blue-700 font-medium"
                data-testid="button-confirm-auto-mode">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {confirmRun && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="confirm-run-modal">
          <div className="bg-white rounded-lg p-5 max-w-sm mx-4 shadow-xl">
            <h4 className="text-sm font-bold text-slate-900 mb-2">Run Automation</h4>
            <p className="text-xs text-slate-600 mb-3">Execute <span className="font-semibold">{confirmRun === "billing" ? "auto batch billing" : "auto follow-ups"}</span>?</p>
            <p className="text-[10px] text-slate-500 mb-3">Safety gates will be checked before execution. Actions are logged and reversible.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmRun(null)} className="px-3 py-1.5 rounded text-xs border border-slate-300 text-slate-700 hover:bg-slate-50"
                data-testid="button-cancel-run">Cancel</button>
              <button onClick={() => handleRunAutomation(confirmRun)} className="px-3 py-1.5 rounded text-xs bg-blue-600 text-white hover:bg-blue-700 font-medium"
                data-testid="button-confirm-run">Run</button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function RotationPerformancePanel({ adminKey }: { adminKey: string }) {
  const [data, setData] = useState<{ scopes: any[]; total_scopes: number; total_rotated_leads: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [fairnessFilter, setFairnessFilter] = useState<string>("all");
  const [advisoryFilter, setAdvisoryFilter] = useState<string>("all");
  const [trendFilter, setTrendFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/rotation-performance", { headers: { "x-admin-key": adminKey } })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [adminKey]);

  if (loading) return <Card className="p-4"><p className="text-xs text-muted-foreground">Loading rotation performance...</p></Card>;
  if (!data || !data.scopes || data.scopes.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" /> Rotation Performance</h3>
        <p className="text-xs text-muted-foreground mt-1">No rotated leads yet. Rotation activates when multiple partners match the same lead criteria.</p>
      </Card>
    );
  }

  const filtered = data.scopes.filter(s => {
    if (fairnessFilter !== "all" && s.fairness_status !== fairnessFilter) return false;
    if (advisoryFilter !== "all" && s.advisory_flag !== advisoryFilter) return false;
    if (trendFilter === "persistent_imbalance" && !s.persistent_imbalance) return false;
    else if (trendFilter !== "all" && trendFilter !== "persistent_imbalance" && s.trend_direction !== trendFilter) return false;
    return true;
  });
  const toggle = (key: string) => setExpanded(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold flex items-center gap-2" data-testid="text-rotation-performance-title">
          <ArrowRightLeft className="h-4 w-4" /> Rotation Performance
        </h3>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-muted-foreground">{data.total_scopes} scope{data.total_scopes !== 1 ? "s" : ""} · {data.total_rotated_leads} rotated lead{data.total_rotated_leads !== 1 ? "s" : ""}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-[9px] text-muted-foreground w-12 shrink-0">Fairness:</span>
          {["all", "balanced", "slight_skew", "imbalance_detected", "low_sample"].map(f => (
            <button key={f} onClick={() => setFairnessFilter(f)} data-testid={`button-fairness-filter-${f}`}
              className={`text-[10px] px-2 py-0.5 rounded border ${fairnessFilter === f ? "bg-blue-100 text-blue-800 border-blue-400 font-semibold" : "bg-white text-gray-600 border-gray-200"}`}>
              {f === "all" ? "All" : (FAIRNESS_BADGE[f]?.label || f)}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-[9px] text-muted-foreground w-12 shrink-0">Advisory:</span>
          {["all", "no_action", "monitor", "review_recommended", "intervention_required"].map(f => (
            <button key={f} onClick={() => setAdvisoryFilter(f)} data-testid={`button-advisory-filter-${f}`}
              className={`text-[10px] px-2 py-0.5 rounded border ${advisoryFilter === f ? "bg-blue-100 text-blue-800 border-blue-400 font-semibold" : "bg-white text-gray-600 border-gray-200"}`}>
              {f === "all" ? "All" : (ADVISORY_BADGE[f]?.label || f)}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap items-center">
          <span className="text-[9px] text-muted-foreground w-12 shrink-0">Trend:</span>
          {[
            { key: "all", label: "All" },
            { key: "improving", label: "↑ Improving" },
            { key: "stable", label: "→ Stable" },
            { key: "worsening", label: "↓ Worsening" },
            { key: "persistent_imbalance", label: "⚠ Persistent" },
          ].map(f => (
            <button key={f.key} onClick={() => setTrendFilter(f.key)} data-testid={`button-trend-filter-${f.key}`}
              className={`text-[10px] px-2 py-0.5 rounded border ${trendFilter === f.key ? "bg-blue-100 text-blue-800 border-blue-400 font-semibold" : "bg-white text-gray-600 border-gray-200"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <p className="text-xs text-muted-foreground">No scopes match this filter.</p>}

      <div className="space-y-2">
        {filtered.map((scope: any) => {
          const badge = FAIRNESS_BADGE[scope.fairness_status] || FAIRNESS_BADGE.low_sample;
          const isOpen = expanded.has(scope.routing_scope_key);
          return (
            <div key={scope.routing_scope_key} className="border rounded p-2" data-testid={`card-rotation-scope-${scope.routing_scope_key}`}>
              <button onClick={() => toggle(scope.routing_scope_key)} className="w-full text-left flex items-center justify-between gap-2" data-testid={`button-expand-scope-${scope.routing_scope_key}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                  <span className="text-xs font-mono truncate">{scope.routing_scope_key}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  <span className="text-[10px] text-muted-foreground">{scope.total_rotated_leads} lead{scope.total_rotated_leads !== 1 ? "s" : ""} · {scope.number_of_eligible_partners} partner{scope.number_of_eligible_partners !== 1 ? "s" : ""}</span>
                  <Badge variant="outline" className={`text-[9px] ${badge.className}`} data-testid={`badge-fairness-${scope.routing_scope_key}`}>{badge.label}</Badge>
                  {(() => { const ab = ADVISORY_BADGE[scope.advisory_flag] || ADVISORY_BADGE.no_action; return (
                    <Badge variant="outline" className={`text-[9px] ${ab.className}`} data-testid={`badge-advisory-${scope.routing_scope_key}`}>{ab.label}</Badge>
                  ); })()}
                  <span className={`text-[10px] font-medium ${scope.trend_direction === "improving" ? "text-green-600" : scope.trend_direction === "worsening" ? "text-red-600" : "text-gray-400"}`} data-testid={`trend-${scope.routing_scope_key}`}>
                    {scope.trend_direction === "improving" ? "↑" : scope.trend_direction === "worsening" ? "↓" : "→"}
                  </span>
                  {scope.persistent_imbalance && (
                    <Badge variant="outline" className="text-[9px] bg-red-100 text-red-800 border-red-300 font-semibold" data-testid={`badge-persistent-${scope.routing_scope_key}`}>Persistent</Badge>
                  )}
                </div>
              </button>

              {isOpen && (() => {
                const expectedShare = scope.number_of_eligible_partners > 0 ? Math.round(10000 / scope.number_of_eligible_partners) / 100 : 0;
                const explainText = scope.fairness_status === "balanced" ? "Distribution is within acceptable range."
                  : scope.fairness_status === "slight_skew" && scope.persistent_imbalance ? "Distribution shows imbalance over time."
                  : scope.fairness_status === "slight_skew" ? "Slight skew detected but within tolerance."
                  : scope.fairness_status === "imbalance_detected" && scope.persistent_imbalance ? "Persistent imbalance detected — review recommended."
                  : scope.fairness_status === "imbalance_detected" ? "Imbalance detected in current distribution."
                  : "Insufficient data for fairness assessment.";

                const buildSummaryText = () => {
                  const lines = [
                    `FAIRNESS SUMMARY — ${scope.routing_scope_key}`,
                    `Generated: ${new Date().toLocaleString()}`,
                    ``,
                    `Total Rotated Leads: ${scope.total_rotated_leads}`,
                    `Number of Partners: ${scope.number_of_eligible_partners}`,
                    `Expected Share: ${expectedShare}% each`,
                    ``,
                    `Partner Distribution:`,
                    ...scope.partners.map((p: any) => {
                      const dev = p.percentage_share - expectedShare;
                      return `  ${p.partner_name}: ${p.leads_assigned} leads (${p.percentage_share}%, deviation: ${dev >= 0 ? "+" : ""}${dev.toFixed(1)}%)`;
                    }),
                    ``,
                    `Fairness Status: ${scope.fairness_status}`,
                    `Advisory: ${scope.advisory_flag}`,
                    `Trend: ${scope.trend_direction}`,
                    `Persistent Imbalance: ${scope.persistent_imbalance ? "Yes" : "No"}`,
                    ``,
                    `Assessment: ${explainText}`,
                  ];
                  if (scope.recent_history?.length > 0) {
                    lines.push(``, `History (newest first):`);
                    scope.recent_history.forEach((h: any) => {
                      lines.push(`  ${new Date(h.snapshot_at).toLocaleString()} — ${h.fairness_status} (${h.advisory_flag})`);
                    });
                  }
                  return lines.join("\n");
                };

                const buildSummaryJson = () => JSON.stringify({
                  scope: scope.routing_scope_key,
                  generated_at: new Date().toISOString(),
                  total_rotated_leads: scope.total_rotated_leads,
                  number_of_partners: scope.number_of_eligible_partners,
                  expected_share_pct: expectedShare,
                  partners: scope.partners.map((p: any) => ({
                    name: p.partner_name,
                    leads: p.leads_assigned,
                    share_pct: p.percentage_share,
                    deviation_pct: Math.round((p.percentage_share - expectedShare) * 10) / 10,
                  })),
                  fairness_status: scope.fairness_status,
                  advisory_flag: scope.advisory_flag,
                  trend_direction: scope.trend_direction,
                  persistent_imbalance: scope.persistent_imbalance,
                  assessment: explainText,
                  history: scope.recent_history || [],
                }, null, 2);

                const copyToClipboard = (text: string) => {
                  navigator.clipboard.writeText(text).then(() => {
                    alert("Copied to clipboard");
                  }).catch(() => {
                    const ta = document.createElement("textarea");
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand("copy");
                    document.body.removeChild(ta);
                    alert("Copied to clipboard");
                  });
                };

                return (
                <div className="mt-2 pl-5 space-y-2" data-testid={`evidence-panel-${scope.routing_scope_key}`}>
                  <div className="bg-slate-50 rounded p-2 space-y-1.5">
                    <p className="text-[10px] font-semibold text-slate-700">Fairness Summary</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px]">
                      <span className="text-slate-500">Total Rotated Leads</span>
                      <span className="font-medium">{scope.total_rotated_leads}</span>
                      <span className="text-slate-500">Partners in Scope</span>
                      <span className="font-medium">{scope.number_of_eligible_partners}</span>
                      <span className="text-slate-500">Expected Share</span>
                      <span className="font-medium">{expectedShare}% each</span>
                      <span className="text-slate-500">Fairness Status</span>
                      <span className="font-medium">{FAIRNESS_BADGE[scope.fairness_status]?.label || scope.fairness_status}</span>
                      <span className="text-slate-500">Advisory</span>
                      <span className="font-medium">{ADVISORY_BADGE[scope.advisory_flag]?.label || scope.advisory_flag}</span>
                      <span className="text-slate-500">Trend</span>
                      <span className={`font-medium ${scope.trend_direction === "improving" ? "text-green-700" : scope.trend_direction === "worsening" ? "text-red-700" : ""}`}>
                        {scope.trend_direction === "improving" ? "↑ Improving" : scope.trend_direction === "worsening" ? "↓ Worsening" : "→ Stable"}
                      </span>
                      <span className="text-slate-500">Persistent Imbalance</span>
                      <span className={`font-medium ${scope.persistent_imbalance ? "text-red-700" : "text-green-700"}`}>{scope.persistent_imbalance ? "Yes" : "No"}</span>
                    </div>
                    <p className={`text-[9px] italic mt-1 ${
                      scope.fairness_status === "balanced" ? "text-green-700" :
                      scope.fairness_status === "imbalance_detected" || scope.persistent_imbalance ? "text-red-700" :
                      scope.fairness_status === "slight_skew" ? "text-amber-700" : "text-slate-500"
                    }`} data-testid={`text-explain-${scope.routing_scope_key}`}>{explainText}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-slate-700 mb-1">Partner Distribution</p>
                    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 text-[9px] text-muted-foreground border-b pb-0.5 mb-0.5">
                      <span>Partner</span>
                      <span className="text-right">Leads</span>
                      <span className="text-right">Actual</span>
                      <span className="text-right">Expected</span>
                      <span className="text-right">Dev</span>
                    </div>
                    {scope.partners.map((p: any) => {
                      const devPct = Math.round((p.percentage_share - expectedShare) * 10) / 10;
                      const devAbs = Math.abs(devPct);
                      const devRelative = expectedShare > 0 ? devAbs / expectedShare : 0;
                      const devColor = devRelative <= 0.15 ? "text-green-700" : devRelative <= 0.30 ? "text-yellow-700" : "text-red-700";
                      return (
                        <div key={p.partner_id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-x-2 text-[10px]" data-testid={`row-evidence-partner-${p.partner_id}`}>
                          <span className="truncate">{p.partner_name}</span>
                          <span className="text-right font-medium">{p.leads_assigned}</span>
                          <span className="text-right font-medium">{p.percentage_share}%</span>
                          <span className="text-right text-slate-500">{expectedShare}%</span>
                          <span className={`text-right font-medium ${scope.total_rotated_leads >= 5 ? devColor : "text-gray-400"}`}>
                            {devPct >= 0 ? "+" : ""}{devPct}%
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {scope.advisory_guidance && (
                    <div className="space-y-0.5">
                      <p className="text-[9px]"><span className="font-medium text-slate-700">Advisory:</span> <span className={
                        scope.advisory_flag === "intervention_required" ? "text-red-700 font-medium" :
                        scope.advisory_flag === "review_recommended" ? "text-amber-700" :
                        scope.advisory_flag === "monitor" ? "text-blue-700" : "text-green-700"
                      }>{scope.advisory_guidance}</span></p>
                      {scope.root_cause_hints?.length > 0 && (
                        <p className="text-[9px] text-slate-500">Hints: {scope.root_cause_hints.join(" · ")}</p>
                      )}
                    </div>
                  )}

                  {scope.recent_history?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-700 mb-1">Snapshot History</p>
                      <div className="space-y-0.5">
                        {scope.recent_history.map((h: any, i: number) => {
                          const fb = FAIRNESS_BADGE[h.fairness_status] || { label: h.fairness_status, className: "" };
                          const ab = ADVISORY_BADGE[h.advisory_flag] || { label: h.advisory_flag, className: "" };
                          return (
                            <div key={i} className="flex items-center gap-2 text-[9px]" data-testid={`row-history-${i}`}>
                              <span className="text-slate-400 w-[120px] shrink-0">{new Date(h.snapshot_at).toLocaleString()}</span>
                              <Badge variant="outline" className={`text-[8px] ${fb.className}`}>{fb.label}</Badge>
                              <Badge variant="outline" className={`text-[8px] ${ab.className}`}>{ab.label}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {scope.last_assigned_at && (
                    <p className="text-[9px] text-muted-foreground">Last rotation: {new Date(scope.last_assigned_at).toLocaleString()}</p>
                  )}

                  <div className="flex gap-2 pt-1 border-t">
                    <button onClick={() => copyToClipboard(buildSummaryText())}
                      className="text-[9px] px-2 py-0.5 rounded border bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
                      data-testid={`button-copy-text-${scope.routing_scope_key}`}>
                      Copy Summary
                    </button>
                    <button onClick={() => copyToClipboard(buildSummaryJson())}
                      className="text-[9px] px-2 py-0.5 rounded border bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      data-testid={`button-copy-json-${scope.routing_scope_key}`}>
                      Copy JSON
                    </button>
                  </div>
                </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function BatchPerformancePanel({ adminKey }: { adminKey: string }) {
  const [summary, setSummary] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "high" | "caution">("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/batch-performance-summary", { headers: { "x-admin-key": adminKey } }).then(r => r.json()),
      fetch("/api/admin/batch-performance-recent", { headers: { "x-admin-key": adminKey } }).then(r => r.json()),
    ]).then(([s, r]) => {
      setSummary(s);
      setRecent(Array.isArray(r) ? r : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [adminKey]);

  if (loading) return <p className="text-xs text-muted-foreground py-4">Loading batch performance...</p>;
  if (!summary || summary.total_batches === 0) return <p className="text-xs text-muted-foreground py-4">No batch runs recorded yet.</p>;

  const rangeColors: Record<string, string> = {
    SAFE: "bg-green-100 text-green-800 border-green-300",
    STABLE: "bg-yellow-100 text-yellow-800 border-yellow-300",
    CAUTION: "bg-red-100 text-red-800 border-red-300",
  };

  const filtered = recent.filter(b => {
    if (filter === "high") return b.success_rate >= 90;
    if (filter === "caution") return b.success_rate < 80;
    return true;
  });

  return (
    <div className="space-y-3" data-testid="batch-performance-panel">
      <div className="border rounded p-3 bg-slate-50 flex items-center gap-4 mb-2" data-testid="batch-guidance-bar">
        <div className="text-center">
          <p className="text-[9px] text-muted-foreground">Recommended Batch Size</p>
          <p className="text-2xl font-bold" data-testid="text-recommended-size">{summary.recommended_batch_size || "3–5"}</p>
        </div>
        <div className="text-center">
          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${rangeColors[summary.safe_batch_size_range] || rangeColors.SAFE}`} data-testid="text-safe-range">{summary.safe_batch_size_range}</span>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-muted-foreground">Trend</p>
          <span className={`text-sm font-semibold ${summary.trend_direction === "improving" ? "text-green-600" : summary.trend_direction === "declining" ? "text-red-600" : "text-slate-600"}`} data-testid="text-trend">
            {summary.trend_direction === "improving" ? "↑ Improving" : summary.trend_direction === "declining" ? "↓ Declining" : "→ Stable"}
          </span>
        </div>
        <p className="text-[10px] text-slate-600 flex-1" data-testid="text-guidance">{summary.guidance_text}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="border rounded p-2 text-center">
          <p className="text-[9px] text-muted-foreground">Total Batches</p>
          <p className="text-lg font-bold" data-testid="text-batch-total">{summary.total_batches}</p>
        </div>
        <div className="border rounded p-2 text-center">
          <p className="text-[9px] text-muted-foreground">Avg Batch Size</p>
          <p className="text-lg font-bold">{summary.avg_batch_size}</p>
        </div>
        <div className="border rounded p-2 text-center">
          <p className="text-[9px] text-muted-foreground">Avg Success Rate</p>
          <p className={`text-lg font-bold ${summary.avg_success_rate >= 90 ? "text-green-600" : summary.avg_success_rate >= 80 ? "text-yellow-600" : "text-red-600"}`}>{summary.avg_success_rate}%</p>
        </div>
        <div className="border rounded p-2 text-center">
          <p className="text-[9px] text-muted-foreground">Batch Revenue</p>
          <p className="text-lg font-bold text-green-600">${summary.total_revenue.toFixed(2)}</p>
        </div>
        <div className="border rounded p-2 text-center">
          <p className="text-[9px] text-muted-foreground">Total Failures</p>
          <p className="text-lg font-bold text-red-600">{summary.total_failures}</p>
        </div>
      </div>

      {summary.batch_expansion_state && (
        <div className={`border rounded p-2 flex items-center gap-3 ${
          summary.batch_expansion_state === "expansion_ready" ? "bg-green-50 border-green-200" :
          summary.batch_expansion_state === "expansion_risk" ? "bg-red-50 border-red-200" :
          summary.batch_expansion_state === "stable" ? "bg-blue-50 border-blue-200" : "bg-slate-50"
        }`} data-testid={`expansion-state-${summary.batch_expansion_state}`}>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
            summary.batch_expansion_state === "expansion_ready" ? "bg-green-100 text-green-800 border-green-300" :
            summary.batch_expansion_state === "expansion_risk" ? "bg-red-100 text-red-800 border-red-300" :
            summary.batch_expansion_state === "stable" ? "bg-blue-100 text-blue-800 border-blue-300" :
            "bg-slate-100 text-slate-700 border-slate-300"
          }`}>{summary.batch_expansion_state.replace(/_/g, " ").toUpperCase()}</span>
          <span className="text-[10px] text-slate-600">{summary.expansion_guidance}</span>
        </div>
      )}

      {summary.failure_spike && (
        <div className="text-[10px] bg-red-50 border border-red-200 rounded p-2 text-red-700 font-medium" data-testid="batch-failure-spike">
          Failure spike detected — last 3 batches below 80% success rate. Review before next batch.
        </div>
      )}

      {(summary.category_signals?.length > 0 || summary.partner_signals?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {summary.category_signals?.length > 0 && (
            <div className="border rounded p-2">
              <h5 className="text-[10px] font-semibold text-muted-foreground mb-1">Category Scaling Signals</h5>
              <div className="space-y-0.5">
                {summary.category_signals.map((c: any, i: number) => {
                  const sigCls = c.signal === "SAFE" ? "bg-green-100 text-green-800" : c.signal === "STABLE" ? "bg-blue-100 text-blue-800" : c.signal === "RISK" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600";
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-[9px]" data-testid={`cat-signal-${i}`}>
                      <span className="truncate w-24">{(c.category || "").replace(/-/g, " ")}</span>
                      <span className={`px-1 py-0.5 rounded text-[8px] font-medium ${sigCls}`}>{c.signal}</span>
                      <span className="text-muted-foreground">{c.success}/{c.total} ({c.rate}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {summary.partner_signals?.length > 0 && (
            <div className="border rounded p-2">
              <h5 className="text-[10px] font-semibold text-muted-foreground mb-1">Partner Scaling Signals</h5>
              <div className="space-y-0.5">
                {summary.partner_signals.map((p: any, i: number) => {
                  const sigCls = p.signal === "SAFE" ? "bg-green-100 text-green-800" : p.signal === "STABLE" ? "bg-blue-100 text-blue-800" : p.signal === "RISK" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-600";
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-[9px]" data-testid={`partner-signal-${i}`}>
                      <span className="truncate w-24">{p.partner_name}</span>
                      <span className={`px-1 py-0.5 rounded text-[8px] font-medium ${sigCls}`}>{p.signal}</span>
                      <span className="text-muted-foreground">{p.success}/{p.total} ({p.rate}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-1.5 items-center">
        <span className="text-[10px] text-muted-foreground">Filter:</span>
        {(["all", "high", "caution"] as const).map(f => (
          <button key={f} data-testid={`batch-filter-${f}`} className={`px-2 py-0.5 rounded text-[9px] border ${filter === f ? "bg-slate-800 text-white" : "bg-white text-slate-600"}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f === "high" ? "High (≥90%)" : "Caution (<80%)"}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {filtered.map((b, i) => {
          const rateColor = b.success_rate >= 90 ? "bg-green-100 text-green-800" : b.success_rate >= 80 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800";
          return (
            <div key={i} className="flex items-center gap-2 p-2 rounded border text-[10px]" data-testid={`batch-row-${i}`}>
              <span className="font-mono text-[9px] text-muted-foreground w-16 truncate" title={b.batch_id}>{(b.batch_id || "").substring(0, 14)}</span>
              <span className="w-8 text-center">{b.batch_size}</span>
              <span className="text-green-600 w-6 text-center">{b.success_count}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-red-600 w-6 text-center">{b.failure_count}</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${rateColor}`}>{b.success_rate}%</span>
              <span className="font-medium">${b.total_amount_successful.toFixed(2)}</span>
              {b.execution_time_ms && <span className="text-muted-foreground">{b.execution_time_ms}ms</span>}
              <span className="ml-auto text-muted-foreground text-[9px]">{b.created_at ? new Date(b.created_at).toLocaleString() : ""}</span>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No batches match this filter.</p>}
      </div>
    </div>
  );
}

function BatchReadinessPlaybook() {
  const [expanded, setExpanded] = useState<string[]>([]);
  const toggle = (key: string) => setExpanded(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const sections = [
    { key: "when", title: "When to Begin Batch Review", items: [
      "Scale Transition Status shows TRANSITION READY",
      "Billing queue has 5+ eligible leads",
      "All prior manual runs completed without errors",
      "No unresolved disputes or failed payments pending",
    ]},
    { key: "eligibility", title: "Batch Eligibility Rules", items: [
      "billing_workflow_status = queued",
      "Delivery confirmed (email_sent = true, routed_to_partner_id set)",
      "No dispute flags on the lead",
      "No hold status (billing_workflow_status ≠ on_hold)",
      "No anomalies or review_required status",
      "Not recently reassigned (optional early caution)",
    ]},
    { key: "sizing", title: "Batch Size Guidance", items: [
      "Start with small batches: 3–5 leads per run",
      "Increase gradually only after consecutive clean runs",
      "Never process the full queue immediately",
      "Monitor Stripe results after each batch before proceeding",
    ]},
    { key: "checklist", title: "Batch Execution Checklist", items: [
      "1. Review selected leads in billing queue",
      "2. Verify eligibility for each lead",
      "3. Confirm no disputes on any lead",
      "4. Confirm delivery status for all leads",
      "5. Execute batch charges via Run Billing",
      "6. Verify Stripe results in Billing Runs panel",
      "7. Review any failures immediately — do not defer",
    ]},
    { key: "failures", title: "Failure Handling", items: [
      "Failed payments must be reviewed individually",
      "Do not include failed leads in next batch without review",
      "Repeated failures (2+) → move to review_required",
      "Payment method issues → contact partner before retry",
    ]},
    { key: "guardrails", title: "Safety Guardrails", items: [
      "No auto-billing — all charges require manual trigger",
      "Manual verification always required before execution",
      "Disputed leads are never included in any batch",
      "Hold logic always respected — on_hold leads are skipped",
      "No blind batch execution — every lead must be reviewed",
    ]},
  ];

  return (
    <div className="space-y-1" data-testid="batch-readiness-playbook">
      {sections.map(s => (
        <div key={s.key} className="border rounded">
          <button className="w-full flex items-center justify-between px-3 py-1.5 text-left" data-testid={`batch-toggle-${s.key}`} onClick={() => toggle(s.key)}>
            <span className="text-[11px] font-semibold">{s.title}</span>
            <span className="text-[10px] text-muted-foreground">{expanded.includes(s.key) ? "▾" : "▸"}</span>
          </button>
          {expanded.includes(s.key) && (
            <div className="px-3 pb-2 space-y-0.5">
              {s.items.map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[10px]" data-testid={`batch-item-${s.key}-${i}`}>
                  <span className="text-muted-foreground mt-0.5">{s.key === "checklist" ? "" : "•"}</span>
                  <span className="text-slate-600">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ScaleTransitionPanel({ adminKey }: { adminKey: string }) {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/intelligence/launch-monitoring", { headers: { "x-admin-key": adminKey } })
      .then(r => r.json()).then(d => setSignals(d.signals || [])).catch(() => {}).finally(() => setLoading(false));
  }, [adminKey]);

  if (loading) return <p className="text-xs text-muted-foreground py-4">Loading transition status...</p>;

  const has = (key: string) => signals.some(s => s.key === key);
  const pressureKeys = ["high_billing_load", "high_pending", "high_attention"];
  const transitionKeys = ["high_billing_load", "high_pending"];
  const pressureCount = pressureKeys.filter(has).length;
  const batchReady = has("high_daily_volume") || has("high_billing_load");
  const billingReview = has("high_billing_load") && (has("payment_failures") || has("high_pending"));
  const transitionCount = transitionKeys.filter(has).length + (batchReady ? 1 : 0) + (billingReview ? 1 : 0);

  let status = "manual_safe";
  let statusLabel = "MANUAL SAFE";
  let statusCls = "bg-green-100 text-green-800 border-green-300";
  let explanation = "System load is within manual handling capacity. Continue standard workflow.";
  let action = "Continue manual workflow — no transition needed.";

  if (transitionCount >= 2) {
    status = "transition_ready";
    statusLabel = "TRANSITION READY";
    statusCls = "bg-amber-100 text-amber-800 border-amber-300";
    explanation = "Manual billing load is high across multiple dimensions. Prepare for controlled batch review.";
    action = "Prepare controlled batch billing process. Review billing queue, verify lead eligibility in bulk, then execute.";
  } else if (pressureCount >= 1) {
    status = "approaching_transition";
    statusLabel = "APPROACHING TRANSITION";
    statusCls = "bg-yellow-100 text-yellow-800 border-yellow-300";
    explanation = "One or more pressure signals detected. System is nearing manual handling limits.";
    action = "Monitor closely and prepare for batch review. No immediate action required.";
  }

  const guardrails = [
    "No auto-billing — all charges require manual verification",
    "Manual verification required before every billing run",
    "Disputed leads must remain excluded from billing",
    "Hold logic must remain intact — on_hold leads are never charged",
  ];

  return (
    <div className="space-y-3" data-testid="scale-transition-panel">
      <div className={`border rounded p-3 ${statusCls.replace("text-", "border-").split(" ")[0]} bg-opacity-50`} data-testid={`transition-status-${status}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${statusCls}`}>{statusLabel}</span>
          <span className="text-[10px] font-medium text-slate-700">{explanation}</span>
        </div>
        <p className="text-[10px] text-slate-600">{action}</p>
        <div className="flex gap-2 mt-2 text-[9px]">
          <span className="text-muted-foreground">Quick nav:</span>
          <span className="text-blue-600">Billing Config</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-blue-600">Attention Leads</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-blue-600">Performance Intelligence</span>
        </div>
      </div>

      <div className="border rounded p-2 bg-slate-50">
        <h4 className="text-[10px] font-semibold text-muted-foreground mb-1">Safety Guardrails</h4>
        <div className="space-y-0.5">
          {guardrails.map((g, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[9px]" data-testid={`guardrail-${i}`}>
              <span className="text-green-600 mt-0.5">✓</span>
              <span className="text-slate-600">{g}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScaleReadinessPanel({ adminKey }: { adminKey: string }) {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/intelligence/launch-monitoring", { headers: { "x-admin-key": adminKey } })
      .then(r => r.json()).then(d => setSignals(d.signals || [])).catch(() => {}).finally(() => setLoading(false));
  }, [adminKey]);

  if (loading) return <p className="text-xs text-muted-foreground py-4">Loading scale readiness...</p>;

  const has = (key: string) => signals.some(s => s.key === key);
  const decisions = [
    {
      key: "batch_review", label: "READY FOR BATCH REVIEW",
      active: has("high_daily_volume") || has("high_billing_load"),
      action: "Billing volume is increasing. Consider controlled batch billing to reduce manual workload.",
      nav: "Review Billing Config panel → billing mode settings",
    },
    {
      key: "partner_expansion", label: "PARTNER EXPANSION NEEDED",
      active: (has("high_daily_volume") || has("high_pending")) && (has("response_dropping") || has("inactive_partners")),
      action: "Lead volume is outpacing partner capacity. Consider adding partners in high-demand categories.",
      nav: "Review Partner Performance → category gaps",
    },
    {
      key: "partner_replacement", label: "PARTNER REPLACEMENT NEEDED",
      active: has("inactive_partners") && has("high_attention"),
      action: "Inactive partners are causing attention queue buildup. Review for replacement or pause.",
      nav: "Review Partner Performance → set underperformers to Paused or Review Only",
    },
    {
      key: "billing_process_review", label: "BILLING PROCESS REVIEW NEEDED",
      active: has("high_billing_load") && (has("payment_failures") || has("high_pending")),
      action: "Billing queue pressure detected. Review billing process efficiency and failure patterns.",
      nav: "Review Billing Runs panel + attention leads → payment_failed",
    },
  ];

  const activeDecisions = decisions.filter(d => d.active);

  return (
    <div className="space-y-2" data-testid="scale-readiness-panel">
      {activeDecisions.length === 0 ? (
        <div className="text-[10px] text-green-700 font-medium px-2 py-1 bg-green-50 border border-green-200 rounded" data-testid="scale-all-clear">No scale decisions triggered — system within manual handling capacity</div>
      ) : (
        activeDecisions.map(d => (
          <div key={d.key} className="border rounded p-2 bg-amber-50 border-amber-200" data-testid={`decision-${d.key}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded border text-[8px] font-bold bg-amber-100 text-amber-800 border-amber-300">{d.label}</span>
            </div>
            <p className="text-[10px] text-slate-700">{d.action}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">{d.nav}</p>
          </div>
        ))
      )}
      <div className="grid grid-cols-4 gap-1 text-[9px]">
        {decisions.map(d => (
          <div key={d.key} className={`rounded px-1.5 py-1 text-center font-semibold ${d.active ? "bg-amber-100 text-amber-800 border border-amber-300" : "bg-slate-100 text-slate-400 border border-slate-200"}`} data-testid={`decision-flag-${d.key}`}>
            {d.active ? "●" : "○"} {d.label.split(" ").slice(0, 2).join(" ")}
          </div>
        ))}
      </div>
    </div>
  );
}

function LaunchMonitoringPanel({ adminKey }: { adminKey: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/intelligence/launch-monitoring", { headers: { "x-admin-key": adminKey } })
      .then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [adminKey]);

  if (loading) return <p className="text-xs text-muted-foreground py-4">Loading monitoring data...</p>;
  if (!data) return null;

  const { signals, metrics } = data;
  const levelCls: Record<string, string> = {
    alert: "bg-red-100 text-red-800 border-red-300",
    warning: "bg-amber-100 text-amber-800 border-amber-300",
    info: "bg-blue-100 text-blue-800 border-blue-300",
  };

  return (
    <div className="space-y-3" data-testid="launch-monitoring-panel">
      {signals && signals.length > 0 ? (
        <div className="space-y-1">
          {signals.map((s: any) => (
            <div key={s.key} className="flex items-center gap-2 text-[10px] border-b pb-1" data-testid={`signal-${s.key}`}>
              <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold ${levelCls[s.level] || levelCls.info}`}>{s.label}</span>
              <span className="text-muted-foreground">{s.detail}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[10px] text-green-700 font-medium px-2 py-1 bg-green-50 border border-green-200 rounded" data-testid="signal-all-clear">All systems nominal — no pressure signals detected</div>
      )}

      {metrics && (
        <div className="grid grid-cols-4 gap-2 text-[10px]">
          <div className="border rounded p-1.5 bg-slate-50">
            <div className="text-[8px] text-muted-foreground font-semibold">Volume</div>
            <div>Today: <span className="font-semibold">{metrics.created_today}</span></div>
            <div>7d avg: <span className="font-semibold">{metrics.daily_avg_7d}/day</span></div>
            <div>Total: <span className="font-semibold">{metrics.total_leads}</span></div>
          </div>
          <div className="border rounded p-1.5 bg-slate-50">
            <div className="text-[8px] text-muted-foreground font-semibold">Pending</div>
            <div>Total: <span className={`font-semibold ${(metrics.pending_total || 0) > 20 ? "text-amber-600" : ""}`}>{metrics.pending_total}</span></div>
            <div>&gt;24h: <span className={`font-semibold ${(metrics.pending_24h || 0) > 10 ? "text-red-600" : ""}`}>{metrics.pending_24h}</span></div>
          </div>
          <div className="border rounded p-1.5 bg-slate-50">
            <div className="text-[8px] text-muted-foreground font-semibold">Response</div>
            <div>Avg rate: <span className="font-semibold">{metrics.avg_response_rate}%</span></div>
            <div>Avg time: <span className="font-semibold">{metrics.avg_response_hours !== null ? `${metrics.avg_response_hours}h` : "N/A"}</span></div>
            <div>Inactive: <span className={`font-semibold ${(metrics.inactive_partners || 0) > 0 ? "text-red-600" : ""}`}>{metrics.inactive_partners}/{metrics.total_partners}</span></div>
          </div>
          <div className="border rounded p-1.5 bg-slate-50">
            <div className="text-[8px] text-muted-foreground font-semibold">Billing</div>
            <div>Ready: <span className="font-semibold">{metrics.ready_to_charge}</span></div>
            <div>Failed: <span className={`font-semibold ${(metrics.failed_payments || 0) > 0 ? "text-red-600" : ""}`}>{metrics.failed_payments}</span></div>
            <div>Reassigned: <span className="font-semibold">{metrics.reassigned_total} ({metrics.reassignment_rate}%)</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExecutionPlaybookPanel() {
  const [expanded, setExpanded] = useState<string[]>(["morning"]);
  const toggle = (key: string) => setExpanded(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const sections = [
    { key: "morning", title: "Morning Review", items: [
      { label: "Review new leads (last 24h)", hint: "Check Execution Visibility → Today's Activity" },
      { label: "Review pending leads", hint: "Filter attention leads → pending_24h" },
      { label: "Review attention-required leads", hint: "Check Action Required panel for red counts" },
      { label: "Review reassignment risks", hint: "Filter attention leads → approaching_72h" },
      { label: "Review failed payments", hint: "Filter attention leads → payment_failed" },
    ]},
    { key: "billing", title: "Billing & Execution", items: [
      { label: "Review ready-to-charge leads", hint: "Check leads with billing_workflow_status = ready" },
      { label: "Verify delivery and eligibility", hint: "Confirm email_sent = true and routed_to_partner_id set" },
      { label: "Move valid leads to queued", hint: "Use Queue for Billing action on eligible leads" },
      { label: "Hold or review questionable leads", hint: "Set billing_workflow_status = on_hold or review_required" },
      { label: "Execute billing run", hint: "Use Run Billing button in Billing Config panel" },
      { label: "Confirm Stripe results", hint: "Check Billing Runs panel for success/failure counts" },
    ]},
    { key: "eod", title: "End of Day Review", items: [
      { label: "Confirm payments processed", hint: "Check Revenue Summary for today's totals" },
      { label: "Review failed payments", hint: "Filter attention leads → payment_failed" },
      { label: "Review disputes", hint: "Filter attention leads → disputed" },
      { label: "Log notes (if applicable)", hint: "Use billing notes on individual leads" },
      { label: "Confirm no unresolved attention items", hint: "Action Required count should be 0" },
    ]},
    { key: "exceptions", title: "Exception Handling", items: [
      { label: "Partner not responding → monitor / escalate", hint: "Check Partner Performance for INACTIVE or LOW RESPONSE" },
      { label: "Disputed lead → hold + review", hint: "Set partner to review_only, hold the lead" },
      { label: "Failed payment → retry or review", hint: "Use Retry Billing on the lead, max 3 attempts" },
      { label: "Bad lead → do not charge", hint: "Set billing_workflow_status = review_required, do not queue" },
      { label: "Routing issue → flag and hold", hint: "Pause partner if needed, reassign lead manually" },
    ]},
  ];

  return (
    <div className="space-y-2" data-testid="execution-playbook-panel">
      {sections.map(s => (
        <div key={s.key} className="border rounded">
          <button className="w-full flex items-center justify-between px-3 py-2 text-left" data-testid={`playbook-toggle-${s.key}`} onClick={() => toggle(s.key)}>
            <span className="text-[11px] font-semibold">{s.title}</span>
            <span className="text-[10px] text-muted-foreground">{expanded.includes(s.key) ? "▾" : "▸"} {s.items.length} items</span>
          </button>
          {expanded.includes(s.key) && (
            <div className="px-3 pb-2 space-y-1">
              {s.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px]" data-testid={`playbook-item-${s.key}-${i}`}>
                  <span className="mt-0.5 text-muted-foreground">☐</span>
                  <div>
                    <span className="font-medium">{item.label}</span>
                    <span className="text-[9px] text-muted-foreground ml-1">— {item.hint}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ExecutionVisibilityPanel({ adminKey }: { adminKey: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/intelligence/execution-visibility", { headers: { "x-admin-key": adminKey } })
      .then(r => r.json()).then(setData).catch(() => {}).finally(() => setLoading(false));
  }, [adminKey]);

  if (loading) return <p className="text-xs text-muted-foreground py-4">Loading execution data...</p>;
  if (!data) return null;

  const { daily, attention, flow } = data;
  const totalAttention = (attention?.pending_24h || 0) + (attention?.approaching_72h || 0) + (attention?.disputed || 0) + (attention?.failed_payments || 0) + (attention?.review_required || 0);
  const attentionLeads = attention?.leads || [];
  const filteredLeads = filter ? attentionLeads.filter((l: any) => l.reason === filter) : attentionLeads;

  return (
    <div className="space-y-3" data-testid="execution-visibility-panel">
      <div className="grid grid-cols-3 gap-2">
        <div className="border rounded p-2 bg-slate-50">
          <h4 className="text-[10px] font-semibold text-muted-foreground mb-1">Today's Activity</h4>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
            <div>Created: <span className="font-semibold">{daily?.created || 0}</span></div>
            <div>Routed: <span className="font-semibold">{daily?.routed || 0}</span></div>
            <div>Responded: <span className="font-semibold">{daily?.responded || 0}</span></div>
            <div>Completed: <span className="font-semibold">{daily?.completed || 0}</span></div>
            <div>Pending: <span className="font-semibold text-amber-600">{daily?.pending || 0}</span></div>
            <div>Reassigned: <span className="font-semibold text-orange-600">{daily?.reassigned || 0}</span> <span className="text-[8px] text-muted-foreground">total</span></div>
          </div>
        </div>
        <div className="border rounded p-2 bg-slate-50">
          <h4 className="text-[10px] font-semibold text-muted-foreground mb-1">Lead Flow (All Time)</h4>
          <div className="flex items-center gap-1 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">{flow?.new || 0} New</span>
            <span className="text-muted-foreground">→</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">{flow?.routed || 0} Routed</span>
            <span className="text-muted-foreground">→</span>
            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">{flow?.responded || 0} Responded</span>
            <span className="text-muted-foreground">→</span>
            <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-800 font-semibold">{flow?.completed || 0} Completed</span>
          </div>
        </div>
        <div className={`border rounded p-2 ${totalAttention > 0 ? "bg-red-50 border-red-200" : "bg-slate-50"}`}>
          <h4 className="text-[10px] font-semibold text-muted-foreground mb-1">
            Action Required {totalAttention > 0 && <span className="text-red-600">({totalAttention})</span>}
          </h4>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
            <div>Pending &gt;24h: <span className={`font-semibold ${(attention?.pending_24h || 0) > 0 ? "text-red-600" : ""}`}>{attention?.pending_24h || 0}</span></div>
            <div>Near 72h: <span className={`font-semibold ${(attention?.approaching_72h || 0) > 0 ? "text-orange-600" : ""}`}>{attention?.approaching_72h || 0}</span></div>
            <div>Disputed: <span className={`font-semibold ${(attention?.disputed || 0) > 0 ? "text-red-600" : ""}`}>{attention?.disputed || 0}</span></div>
            <div>Failed pay: <span className={`font-semibold ${(attention?.failed_payments || 0) > 0 ? "text-red-600" : ""}`}>{attention?.failed_payments || 0}</span></div>
            <div>Review req: <span className={`font-semibold ${(attention?.review_required || 0) > 0 ? "text-amber-600" : ""}`}>{attention?.review_required || 0}</span></div>
          </div>
        </div>
      </div>

      {attentionLeads.length > 0 && (
        <div className="border rounded p-2">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-[10px] font-semibold">Attention Leads</h4>
            <div className="flex gap-1">
              {["", "pending_24h", "approaching_72h", "disputed", "payment_failed", "review_required"].map(f => (
                <button key={f} data-testid={`attention-filter-${f || "all"}`}
                  className={`px-1 py-0.5 rounded text-[8px] border ${filter === f ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-600 border-slate-200"}`}
                  onClick={() => setFilter(f)}>{f ? f.replace(/_/g, " ") : "All"}</button>
              ))}
            </div>
          </div>
          <div className="space-y-0.5 max-h-24 overflow-y-auto">
            {filteredLeads.map((l: any, i: number) => (
              <div key={`${l.id}-${i}`} className="flex items-center gap-2 text-[9px] border-b pb-0.5" data-testid={`attention-lead-${l.id}`}>
                <span className="font-mono truncate max-w-[180px]">{l.id}</span>
                <span className={`px-1 py-0.5 rounded text-[8px] font-semibold ${
                  l.reason === "disputed" ? "bg-red-100 text-red-800" :
                  l.reason === "payment_failed" ? "bg-red-100 text-red-800" :
                  l.reason === "approaching_72h" ? "bg-orange-100 text-orange-800" :
                  l.reason === "review_required" ? "bg-amber-100 text-amber-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>{l.reason.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PerformanceIntelPanel({ adminKey }: { adminKey: string }) {
  const [catPerf, setCatPerf] = useState<any[]>([]);
  const [partnerPerf, setPartnerPerf] = useState<any[]>([]);
  const [catFlags, setCatFlags] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("");
  const [catRevFilter, setCatRevFilter] = useState("");
  const [partnerRevFilter, setPartnerRevFilter] = useState("");
  const [optLog, setOptLog] = useState<any[]>([]);
  const [dailyRev, setDailyRev] = useState<any>(null);
  const { toast } = useToast();

  const loadData = () => {
    Promise.all([
      fetch("/api/admin/intelligence/category-performance", { headers: { "x-admin-key": adminKey } }).then(r => r.json()),
      fetch("/api/admin/intelligence/partner-performance", { headers: { "x-admin-key": adminKey } }).then(r => r.json()),
      fetch("/api/admin/category-action-flags", { headers: { "x-admin-key": adminKey } }).then(r => r.json()).catch(() => ({})),
      fetch("/api/admin/optimization-log", { headers: { "x-admin-key": adminKey } }).then(r => r.json()).catch(() => []),
      fetch("/api/admin/intelligence/daily-revenue", { headers: { "x-admin-key": adminKey } }).then(r => r.json()).catch(() => null),
    ]).then(([cats, partners, flags, log, rev]) => {
      setCatPerf(Array.isArray(cats) ? cats : []);
      setPartnerPerf(Array.isArray(partners) ? partners : []);
      setCatFlags(typeof flags === "object" && !Array.isArray(flags) ? flags : {});
      setOptLog(Array.isArray(log) ? log : []);
      setDailyRev(rev);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [adminKey]);

  if (loading) return <p className="text-xs text-muted-foreground py-4">Loading performance data...</p>;

  let filteredCats = catFilter ? catPerf.filter(c => c.performance_status === catFilter) : catPerf;
  if (catRevFilter) filteredCats = filteredCats.filter(c => c.revenue_signal === catRevFilter);
  let filteredPartners = partnerFilter ? partnerPerf.filter(p => p.performance_status === partnerFilter) : partnerPerf;
  if (partnerRevFilter) filteredPartners = filteredPartners.filter(p => p.revenue_signal === partnerRevFilter);

  const REV_CAT_BADGE: Record<string, { label: string; cls: string }> = {
    monetizing: { label: "MONETIZING", cls: "bg-green-100 text-green-800 border-green-300" },
    underperforming: { label: "UNDERPERF", cls: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    non_monetizing: { label: "NO REV", cls: "bg-red-100 text-red-800 border-red-300" },
  };
  const REV_PART_BADGE: Record<string, { label: string; cls: string }> = {
    high_revenue: { label: "HIGH REV", cls: "bg-green-100 text-green-800 border-green-300" },
    low_revenue: { label: "LOW REV", cls: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    no_revenue: { label: "NO REV", cls: "bg-red-100 text-red-800 border-red-300" },
  };

  return (
    <div className="space-y-4" data-testid="performance-intel-panel">
      {dailyRev && (
        <div className="border rounded p-2 bg-slate-50" data-testid="daily-revenue-summary">
          <h4 className="text-[11px] font-semibold mb-1">Revenue Summary</h4>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div><span className="text-muted-foreground">Today:</span> <span className="font-semibold text-green-700">${dailyRev.today?.revenue?.toFixed(2) || "0.00"}</span> <span className="text-muted-foreground">({dailyRev.today?.paid_leads || 0} leads)</span></div>
            <div><span className="text-muted-foreground">7 days:</span> <span className="font-semibold text-green-700">${dailyRev.last_7_days?.revenue?.toFixed(2) || "0.00"}</span> <span className="text-muted-foreground">({dailyRev.last_7_days?.paid_leads || 0} leads)</span></div>
            <div><span className="text-muted-foreground">All time:</span> <span className="font-semibold text-green-700">${dailyRev.all_time?.revenue?.toFixed(2) || "0.00"}</span> <span className="text-muted-foreground">({dailyRev.all_time?.paid_leads || 0} leads)</span></div>
          </div>
          <div className="text-[9px] text-muted-foreground mt-1">Avg per paid lead: <span className="font-medium">${dailyRev.avg_revenue_per_lead?.toFixed(2) || "0.00"}</span></div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold">Category Performance</h4>
          <div className="flex gap-1 flex-wrap">
            {["", "high_value", "emerging", "low_conversion", "inactive"].map(f => (
              <button key={f} data-testid={`cat-perf-filter-${f || "all"}`}
                className={`px-1.5 py-0.5 rounded text-[9px] border ${catFilter === f ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200"}`}
                onClick={() => setCatFilter(f)}>{f ? (PERF_BADGE[f]?.label || f) : "All"}</button>
            ))}
            <span className="text-[8px] text-muted-foreground mx-0.5">|</span>
            {["", "monetizing", "underperforming", "non_monetizing"].map(f => (
              <button key={`rev-${f}`} data-testid={`cat-rev-filter-${f || "all"}`}
                className={`px-1.5 py-0.5 rounded text-[9px] border ${catRevFilter === f ? "bg-green-700 text-white border-green-700" : "bg-white text-slate-600 border-slate-200"}`}
                onClick={() => setCatRevFilter(f)}>{f ? (REV_CAT_BADGE[f]?.label || f) : "Rev All"}</button>
            ))}
          </div>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {filteredCats.map(c => (
            <div key={c.category} className="flex items-center gap-2 text-[10px] border-b pb-1" data-testid={`cat-perf-${c.category}`}>
              <span className="font-medium min-w-[100px] truncate">{c.category.replace(/-/g, " ")}</span>
              <span className={`px-1 py-0.5 rounded border text-[8px] font-semibold ${(PERF_BADGE[c.performance_status] || PERF_BADGE.inactive).className}`}>
                {(PERF_BADGE[c.performance_status] || PERF_BADGE.inactive).label}
              </span>
              {c.alert && <span className="text-[8px] text-red-600 font-semibold">{c.alert}</span>}
              {c.revenue_signal && REV_CAT_BADGE[c.revenue_signal] && (
                <span className={`px-1 py-0.5 rounded border text-[8px] font-semibold ${REV_CAT_BADGE[c.revenue_signal].cls}`}>{REV_CAT_BADGE[c.revenue_signal].label}</span>
              )}
              <select className="text-[9px] border rounded px-0.5 py-0 h-5" data-testid={`cat-flag-${c.category}`}
                value={catFlags[c.category] || "normal"}
                onChange={async (e) => {
                  const resp = await fetch("/api/admin/category-action-flag", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                    body: JSON.stringify({ category: c.category, flag: e.target.value }),
                  });
                  if (resp.ok) { setCatFlags(prev => ({ ...prev, [c.category]: e.target.value })); loadData(); toast({ description: `${c.category} → ${e.target.value}` }); }
                }}>
                <option value="normal">Normal</option>
                <option value="expand">Expand</option>
                <option value="review">Review</option>
                <option value="deprioritize">Deprioritize</option>
              </select>
              <span className="text-muted-foreground ml-auto">{c.total} leads</span>
              <span className="text-muted-foreground">{c.billable} billable</span>
              <span className="text-green-600">{c.paid} paid</span>
              <span className="text-green-700 font-medium">${c.revenue.toFixed(2)}</span>
            </div>
          ))}
          {filteredCats.length === 0 && <p className="text-[10px] text-muted-foreground">No categories match filter.</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold">Partner Performance</h4>
          <div className="flex gap-1 flex-wrap">
            {["", "strong", "moderate", "weak", "inactive"].map(f => (
              <button key={f} data-testid={`partner-perf-filter-${f || "all"}`}
                className={`px-1.5 py-0.5 rounded text-[9px] border ${partnerFilter === f ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200"}`}
                onClick={() => setPartnerFilter(f)}>{f ? (PERF_BADGE[f]?.label || f) : "All"}</button>
            ))}
            <span className="text-[8px] text-muted-foreground mx-0.5">|</span>
            {["", "high_revenue", "low_revenue", "no_revenue"].map(f => (
              <button key={`rev-${f}`} data-testid={`partner-rev-filter-${f || "all"}`}
                className={`px-1.5 py-0.5 rounded text-[9px] border ${partnerRevFilter === f ? "bg-green-700 text-white border-green-700" : "bg-white text-slate-600 border-slate-200"}`}
                onClick={() => setPartnerRevFilter(f)}>{f ? (REV_PART_BADGE[f]?.label || f) : "Rev All"}</button>
            ))}
          </div>
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {filteredPartners.map(p => (
            <div key={p.partner_id} className="flex items-center gap-2 text-[10px] border-b pb-1" data-testid={`partner-perf-${p.partner_id}`}>
              <span className="font-medium min-w-[100px] truncate">{p.partner_name}</span>
              <span className={`px-1 py-0.5 rounded border text-[8px] font-semibold ${(PERF_BADGE[p.performance_status] || PERF_BADGE.inactive).className}`}>
                {(PERF_BADGE[p.performance_status] || PERF_BADGE.inactive).label}
              </span>
              {p.alert && <span className="text-[8px] text-red-600 font-semibold">{p.alert}</span>}
              {p.revenue_signal && REV_PART_BADGE[p.revenue_signal] && (
                <span className={`px-1 py-0.5 rounded border text-[8px] font-semibold ${REV_PART_BADGE[p.revenue_signal].cls}`}>{REV_PART_BADGE[p.revenue_signal].label}</span>
              )}
              <select className="text-[9px] border rounded px-0.5 py-0 h-5" data-testid={`partner-override-${p.partner_id}`}
                value={p.partner_status_override || "active"}
                onChange={async (e) => {
                  const resp = await fetch(`/api/admin/partner-status-override/${p.partner_id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                    body: JSON.stringify({ partner_status_override: e.target.value }),
                  });
                  if (resp.ok) { loadData(); toast({ description: `${p.partner_name} → ${e.target.value}` }); }
                }}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="review_only">Review Only</option>
              </select>
              <span className="text-muted-foreground ml-auto">{p.leads_assigned} assigned</span>
              <span className="text-muted-foreground">{p.response_rate}% resp</span>
              <span className="text-muted-foreground">{p.conversion_rate}% conv</span>
              <span className="text-green-600">{p.billed} paid</span>
              <span className="text-green-700 font-medium">${p.revenue.toFixed(2)}</span>
            </div>
          ))}
          {filteredPartners.length === 0 && <p className="text-[10px] text-muted-foreground">No partners match filter.</p>}
        </div>
      </div>

      {optLog.length > 0 && (
        <div className="border rounded p-2">
          <h4 className="text-[11px] font-semibold mb-1">Decision Log (Last 10)</h4>
          <div className="space-y-0.5 max-h-28 overflow-y-auto">
            {optLog.slice(0, 10).map((l: any) => (
              <div key={l.id} className="flex items-center gap-2 text-[9px] border-b pb-0.5" data-testid={`opt-log-${l.id}`}>
                <span className="px-1 py-0.5 rounded bg-gray-100 text-[8px] font-medium">{l.decision_type}</span>
                <span className="truncate max-w-[120px]">{l.entity_id}</span>
                <span className="text-muted-foreground">{l.previous_value} → {l.new_value}</span>
                <span className="text-muted-foreground ml-auto">{new Date(l.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AutomationSupervisionPanel({ adminKey }: { adminKey: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string } | null>(null);
  const { toast: showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/automation-supervision", { headers: { "x-admin-key": adminKey } });
      if (res.ok) setData(await res.json());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleReview = async (id: string, resolution: string) => {
    setConfirmAction(null);
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/automation-supervision/review", {
        method: "POST", headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
        body: JSON.stringify({ id, resolution }),
      });
      if (res.ok) { showToast({ title: "Updated", description: `Exception marked as ${resolution}` }); loadData(); }
      else { const r = await res.json(); showToast({ title: "Failed", description: r.error, variant: "destructive" }); }
    } catch { showToast({ title: "Error", description: "Network error", variant: "destructive" }); }
    finally { setActionLoading(null); }
  };

  const handleRetry = async (id: string) => {
    setConfirmAction(null);
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/automation-supervision/retry", {
        method: "POST", headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) { showToast({ title: "Retry flagged", description: "Execute manually from Automation Control" }); loadData(); }
      else { const r = await res.json(); showToast({ title: "Failed", description: r.error, variant: "destructive" }); }
    } catch { showToast({ title: "Error", description: "Network error", variant: "destructive" }); }
    finally { setActionLoading(null); }
  };

  const handlePauseGlobal = async () => {
    try {
      const res = await fetch("/api/admin/automation-pause", {
        method: "POST", headers: { "x-admin-key": adminKey, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause", reason: "Paused from supervision panel" }),
      });
      if (res.ok) showToast({ title: "Paused", description: "Automation globally paused" });
    } catch {}
  };

  if (loading) return <Card className="p-4"><p className="text-xs text-muted-foreground">Loading automation supervision...</p></Card>;
  if (!data) return null;

  const { summary, health_score, health_label, exceptions, alerts, priority_flags } = data;
  const healthColors: Record<string, string> = {
    HEALTHY: "bg-green-100 text-green-800 border-green-300",
    STABLE: "bg-amber-100 text-amber-800 border-amber-300",
    CAUTION: "bg-red-100 text-red-800 border-red-300",
  };

  const failureReasonLabels: Record<string, string> = {
    eligibility_failure: "Eligibility",
    billing_failure: "Billing",
    stripe_error: "Stripe",
    rate_limit_block: "Rate Limit",
    safety_gate_block: "Safety Gate",
    validation_failure: "Validation",
    unknown_error: "Unknown",
  };

  return (
    <Card className="p-4 space-y-3" data-testid="panel-automation-supervision">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-bold text-slate-900" data-testid="text-supervision-title">Automation Supervision</h3>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${healthColors[health_label] || "bg-slate-100"}`}
            data-testid="badge-health-label">{health_label} ({health_score}%)</span>
        </div>
        <button onClick={loadData} className="text-[9px] text-blue-600 hover:underline" data-testid="button-refresh-supervision">Refresh</button>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-1" data-testid="supervision-alerts">
          {alerts.map((a: any, i: number) => (
            <div key={i} className={`rounded px-2 py-1.5 text-[9px] flex items-center gap-1 border ${
              a.severity === "critical" ? "bg-red-50 border-red-300 text-red-800" : "bg-amber-50 border-amber-300 text-amber-800"
            }`}>
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span className="font-bold">{a.alert_type}</span>
              <span>{a.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-5 gap-2" data-testid="supervision-summary">
        <div className="bg-slate-50 border rounded p-2 text-center">
          <p className="text-[8px] text-muted-foreground uppercase">Total</p>
          <p className="text-lg font-bold text-slate-700" data-testid="text-supervision-total">{summary.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
          <p className="text-[8px] text-green-600 uppercase">Success</p>
          <p className="text-lg font-bold text-green-700" data-testid="text-supervision-success">{summary.success}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded p-2 text-center">
          <p className="text-[8px] text-amber-600 uppercase">Skipped</p>
          <p className="text-lg font-bold text-amber-700" data-testid="text-supervision-skipped">{summary.skipped}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-2 text-center">
          <p className="text-[8px] text-red-600 uppercase">Blocked</p>
          <p className="text-lg font-bold text-red-700" data-testid="text-supervision-blocked">{summary.blocked}</p>
        </div>
        <div className="bg-red-50 border border-red-300 rounded p-2 text-center">
          <p className="text-[8px] text-red-700 uppercase">Failed</p>
          <p className="text-lg font-bold text-red-800" data-testid="text-supervision-failed">{summary.failed}</p>
        </div>
      </div>

      {priority_flags.length > 0 && (
        <div className="space-y-0.5" data-testid="supervision-priority-flags">
          <p className="text-[10px] font-bold text-slate-700">Priority Flags</p>
          {priority_flags.map((f: any, i: number) => (
            <div key={i} className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded px-2 py-1 text-[9px] text-orange-800">
              <span className="px-1 py-0.5 rounded bg-orange-200 text-orange-900 text-[8px] font-bold shrink-0">
                {f.type === "repeated_partner_failure" ? "REPEAT" : f.type === "repeated_lead_failure" ? "LEAD" : "HEALTH"}
              </span>
              <span>{f.detail}</span>
            </div>
          ))}
        </div>
      )}

      {exceptions.length > 0 && (
        <div className="space-y-1" data-testid="supervision-exception-feed">
          <p className="text-[10px] font-bold text-slate-700">Exception Feed ({exceptions.length})</p>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {exceptions.map((e: any) => (
              <div key={e.id} className="border rounded px-2 py-1.5 bg-white text-[9px] space-y-0.5" data-testid={`exception-row-${e.id}`}>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-1 py-0.5 rounded font-bold text-[8px] ${
                    e.exception_type === "failed" ? "bg-red-200 text-red-800" : "bg-amber-200 text-amber-800"
                  }`}>{e.exception_type?.toUpperCase()}</span>
                  <span className="px-1 py-0.5 rounded bg-slate-100 text-slate-600 text-[8px] font-medium">
                    {(e.mismatch_type || e.event_type || "").replace(/_/g, " ")}
                  </span>
                  {e.failure_reason && (
                    <span className="px-1 py-0.5 rounded bg-purple-100 text-purple-700 text-[8px] font-medium">
                      {failureReasonLabels[e.failure_reason] || e.failure_reason}
                    </span>
                  )}
                  {e.retry_attempted && (
                    <span className="px-1 py-0.5 rounded bg-blue-100 text-blue-700 text-[8px]">Retry flagged</span>
                  )}
                  {e.resolution_status && e.resolution_status !== "open" && (
                    <span className="px-1 py-0.5 rounded bg-green-100 text-green-700 text-[8px] font-medium">{e.resolution_status}</span>
                  )}
                  <span className="text-muted-foreground ml-auto whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</span>
                </div>
                <div className="text-muted-foreground truncate">{e.reason}</div>
                <div className="flex items-center gap-1 text-[8px]">
                  {e.partner_id && <span className="text-blue-600">Partner: {e.partner_id.substring(0, 8)}...</span>}
                  {e.lead_id && <span className="text-purple-600">Lead: {e.lead_id.substring(0, 8)}...</span>}
                  <div className="ml-auto flex gap-1">
                    {(!e.resolution_status || e.resolution_status === "open") && (
                      <>
                        <button
                          disabled={actionLoading === e.id}
                          onClick={() => setConfirmAction({ type: "retry", id: e.id })}
                          className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                          data-testid={`button-retry-${e.id}`}>Retry</button>
                        <button
                          disabled={actionLoading === e.id}
                          onClick={() => setConfirmAction({ type: "reviewed", id: e.id })}
                          className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                          data-testid={`button-review-${e.id}`}>Mark Reviewed</button>
                        <button
                          disabled={actionLoading === e.id}
                          onClick={() => setConfirmAction({ type: "resolved", id: e.id })}
                          className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                          data-testid={`button-resolve-${e.id}`}>Resolve</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {exceptions.length === 0 && summary.total === 0 && (
        <div className="text-center py-3 text-[10px] text-muted-foreground" data-testid="text-no-automation-data">
          No automation actions recorded in the last 24 hours.
        </div>
      )}

      {exceptions.length === 0 && summary.total > 0 && (
        <div className="text-center py-2 text-[10px] text-green-600 font-medium" data-testid="text-no-exceptions">
          No exceptions — all automation actions successful.
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={handlePauseGlobal} className="px-2 py-1 rounded text-[9px] font-medium bg-red-100 text-red-700 border border-red-200 hover:bg-red-200"
          data-testid="button-supervision-pause">Emergency Pause</button>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="confirm-supervision-modal">
          <div className="bg-white rounded-lg p-5 max-w-sm mx-4 shadow-xl">
            <h4 className="text-sm font-bold text-slate-900 mb-2">
              {confirmAction.type === "retry" ? "Confirm Retry" : confirmAction.type === "reviewed" ? "Mark as Reviewed" : "Mark as Resolved"}
            </h4>
            <p className="text-xs text-slate-600 mb-3">
              {confirmAction.type === "retry"
                ? "This will flag the exception for manual retry. You'll need to execute the retry from the Automation Control panel."
                : confirmAction.type === "reviewed"
                ? "This marks the exception as reviewed by an admin. No action will be taken automatically."
                : "This marks the exception as resolved. It will no longer appear as an open issue."}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmAction(null)}
                className="px-3 py-1.5 rounded text-xs bg-slate-100 text-slate-700 hover:bg-slate-200"
                data-testid="button-confirm-cancel">Cancel</button>
              <button onClick={() => {
                if (confirmAction.type === "retry") handleRetry(confirmAction.id);
                else handleReview(confirmAction.id, confirmAction.type);
              }}
                className="px-3 py-1.5 rounded text-xs bg-blue-600 text-white hover:bg-blue-700"
                data-testid="button-confirm-action">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function AdminResources() {
  return <AdminAuthGuard><AdminResourcesInner /></AdminAuthGuard>;
}
