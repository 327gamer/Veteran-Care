import { AdminAuthGuard } from "@/components/admin-auth-guard";
import { useState, useEffect } from "react";
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
  Code2,
  Briefcase,
  Building2,
  Smartphone,
  Linkedin,
  BarChart3,
  FileText,
  User,
  DollarSign,
  Archive,
  Trash2,
  AlertTriangle,
  Package,
  ClipboardList,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLocation } from "wouter";

const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};

const SORTED_STATES = Object.entries(US_STATES)
  .sort((a, b) => a[1].localeCompare(b[1]));

function parseStateAbbr(value: string): string {
  if (!value) return "";
  const parts = value.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    if (US_STATES[last]) return last;
    const found = Object.entries(US_STATES).find(([, v]) => v === last);
    if (found) return found[0];
  }
  return "";
}

function parseLocalPart(value: string): string {
  if (!value) return "";
  const commaIdx = value.lastIndexOf(",");
  if (commaIdx === -1) return value;
  return value.substring(0, commaIdx).trim();
}

function titleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

function RegionValueInput({
  regionType,
  value,
  onChange,
  testId,
}: {
  regionType: string;
  value: string;
  onChange: (val: string) => void;
  testId: string;
}) {
  const [selectedState, setSelectedState] = useState(() => parseStateAbbr(value));
  const [localPart, setLocalPart] = useState(() => parseLocalPart(value));

  useEffect(() => {
    setSelectedState(parseStateAbbr(value));
    setLocalPart(parseLocalPart(value));
  }, [regionType]);

  useEffect(() => {
    if (regionType === "national" && value !== "USA") {
      onChange("USA");
    }
  }, [regionType, value, onChange]);

  const stateDropdown = (tid: string) => (
    <select
      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
      value={selectedState}
      onChange={(e) => {
        setSelectedState(e.target.value);
        setLocalPart("");
        onChange("");
      }}
      data-testid={tid}
    >
      <option value="">Select state...</option>
      {SORTED_STATES.map(([abbr, name]) => (
        <option key={abbr} value={abbr}>{name}</option>
      ))}
    </select>
  );

  if (regionType === "national") {
    return <Input value="USA" disabled data-testid={testId} />;
  }

  if (regionType === "state") {
    return (
      <select
        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
      >
        <option value="">Select state...</option>
        {SORTED_STATES.map(([abbr, name]) => (
          <option key={abbr} value={`${name} (${abbr})`}>{name} ({abbr})</option>
        ))}
      </select>
    );
  }

  if (regionType === "county") {
    return (
      <div className="flex flex-col gap-1.5">
        {stateDropdown(`${testId}-state`)}
        {selectedState && (
          <Input
            placeholder="Enter county (e.g. Greenville County)"
            value={localPart}
            onChange={(e) => {
              const raw = e.target.value.trimStart();
              const cleaned = titleCase(raw);
              setLocalPart(cleaned);
              if (!cleaned.trim()) {
                onChange("");
              } else {
                const withCounty = cleaned.trim().toLowerCase().endsWith("county")
                  ? cleaned.trim()
                  : `${cleaned.trim()} County`;
                onChange(`${withCounty}, ${selectedState}`);
              }
            }}
            onBlur={() => {
              const trimmed = localPart.trim();
              if (trimmed) {
                const capitalized = titleCase(trimmed);
                setLocalPart(capitalized);
                const withCounty = capitalized.toLowerCase().endsWith("county")
                  ? capitalized
                  : `${capitalized} County`;
                onChange(`${withCounty}, ${selectedState}`);
              }
            }}
            data-testid={testId}
          />
        )}
      </div>
    );
  }

  if (regionType === "city") {
    return (
      <div className="flex flex-col gap-1.5">
        {stateDropdown(`${testId}-state`)}
        {selectedState && (
          <Input
            placeholder="Enter city (e.g. Charleston)"
            value={localPart}
            onChange={(e) => {
              const raw = e.target.value.trimStart();
              const cleaned = titleCase(raw);
              setLocalPart(cleaned);
              onChange(cleaned.trim() ? `${cleaned.trim()}, ${selectedState}` : "");
            }}
            onBlur={() => {
              const trimmed = localPart.trim();
              if (trimmed) {
                const capitalized = titleCase(trimmed);
                setLocalPart(capitalized);
                onChange(`${capitalized}, ${selectedState}`);
              }
            }}
            data-testid={testId}
          />
        )}
      </div>
    );
  }

  return (
    <Input
      placeholder="e.g. Southeast Region"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid={testId}
    />
  );
}

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
  performance?: {
    total_commissions: number;
    total_commission_amount: string;
    total_revenue: string;
    pending_commissions: number;
    approved_commissions: number;
    paid_commissions: number;
    total_payouts: number;
    paid_payouts: number;
    total_paid_out: string;
    total_leads: number;
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

function CopyAllButton({ onCopy }: { onCopy: () => Promise<void> }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={handleCopy} data-testid="button-copy-all-links">
      {copied ? (
        <><Check className="h-3 w-3 text-green-600" /><span className="text-green-600">Copied All</span></>
      ) : (
        <><ClipboardList className="h-3 w-3" /> Copy All Links</>
      )}
    </Button>
  );
}

function CreateAmbassadorForm({ onClose, onSuccess, onCreated }: { onClose: () => void; onSuccess: () => void; onCreated?: (id: string) => void }) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    ambassador_name: "",
    email: "",
    phone: "",
    region_type: "",
    region_value: "",
    commission_rate: "",
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
    onSuccess: (data: any) => {
      onSuccess();
      onClose();
      if (data?.ambassador_id && onCreated) {
        onCreated(data.ambassador_id);
      }
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
              onChange={(e) => setFormData({ ...formData, region_type: e.target.value, region_value: "" })}
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
            <RegionValueInput
              regionType={formData.region_type}
              value={formData.region_value}
              onChange={(val) => setFormData({ ...formData, region_value: val })}
              testId="input-region-value"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Commission Rate (%) *</label>
          <Input
            type="number"
            step="0.5"
            min="0"
            max="100"
            placeholder="10"
            value={formData.commission_rate}
            onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
            data-testid="input-commission-rate"
          />
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
            disabled={!(formData.ambassador_name.trim() || displayName.trim()) || !formData.commission_rate.trim() || createMutation.isPending}
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
              if (formData.commission_rate.trim()) payload.commission_rate = formData.commission_rate.trim();
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

const ADMIN_CAMPAIGN_CONFIG: Record<string, { title: string; icon: any; borderColor: string; badgeColor: string }> = {
  veteran: { title: "Veteran Outreach", icon: Users, borderColor: "border-l-green-500", badgeColor: "bg-green-100 text-green-800" },
  case_manager: { title: "Case Manager Outreach", icon: Briefcase, borderColor: "border-l-blue-500", badgeColor: "bg-blue-100 text-blue-800" },
  partner: { title: "Partner / Business Outreach", icon: Building2, borderColor: "border-l-purple-500", badgeColor: "bg-purple-100 text-purple-800" },
};

const ADMIN_CHANNEL_ICONS: Record<string, any> = { email: Mail, text: Smartphone, facebook: MessageSquare, instagram: MessageSquare, linkedin: Linkedin };
const ADMIN_CHANNEL_LABELS: Record<string, string> = { email: "Email", text: "SMS / Text", facebook: "Facebook Post", instagram: "Instagram Caption", linkedin: "LinkedIn Message" };

function AdminCopyBtn({ text, label, children }: { text: string; label: string; children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant={copied ? "default" : "outline"} size="sm" onClick={handleCopy}
      className={`${copied ? "bg-green-600 hover:bg-green-700 text-white" : ""} h-7 text-xs gap-1`}
      data-testid={`copy-${label}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : (children || "Copy")}
    </Button>
  );
}

function CampaignPacksSection({ ambassadorCode }: { ambassadorCode: string }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedAudiences, setExpandedAudiences] = useState<Record<string, boolean>>({});
  const headers = getAdminHeaders();

  const { data: distData, isLoading } = useQuery({
    queryKey: ["admin-distribution-pack", ambassadorCode],
    queryFn: async () => {
      const res = await fetch(`/api/admin/ambassador-distribution/${ambassadorCode}`, { headers });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: expanded,
  });

  const toggleAudience = (key: string) => {
    setExpandedAudiences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const downloadDistCSV = () => {
    if (!ambassadorCode) return;
    fetch(`/api/admin/ambassador-distribution/${ambassadorCode}?format=csv`, { headers })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `distribution-pack-${ambassadorCode}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  const downloadFullKit = () => {
    if (!distData) return;
    const sections: string[] = [];
    sections.push(`AMBASSADOR CAMPAIGN KIT`);
    sections.push(`========================`);
    sections.push(`Ambassador: ${distData.ambassador_name}`);
    sections.push(`Code: ${distData.ambassador_code}`);
    sections.push(`Total Links: ${distData.total_links}`);

    const audienceOrder = ["veteran", "general", "case_manager", "partner"];
    for (const aud of audienceOrder) {
      const entries = distData.audiences[aud];
      if (!entries?.length) continue;
      const cfg = ADMIN_CAMPAIGN_CONFIG[aud];
      sections.push(`\n${"=".repeat(50)}`);
      sections.push(cfg?.title || aud);
      sections.push(`${"=".repeat(50)}`);

      if (entries[0]?.html_button) {
        sections.push(`\n--- HTML BUTTON EMBED ---`);
        sections.push(entries[0].html_button);
      }

      for (const entry of entries) {
        sections.push(`\n--- ${entry.message_title} ---`);
        sections.push(`Link: ${entry.short_url}`);
        sections.push(`QR: ${entry.qr_url}`);
        if (entry.suggested_copy) sections.push(`\n${entry.suggested_copy}`);
      }
    }

    const blob = new Blob([sections.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `full-campaign-kit-${ambassadorCode}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="mb-4 border-green-200" data-testid="card-campaign-packs">
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-1.5 text-green-800">
            <Package className="h-4 w-4" /> Campaign Packs
          </CardTitle>
          <div className="flex items-center gap-2">
            {expanded && distData && (
              <>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); downloadDistCSV(); }} data-testid="button-download-csv">
                  <Download className="h-3 w-3" /> CSV
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); downloadFullKit(); }} data-testid="button-download-full-kit">
                  <Download className="h-3 w-3" /> Full Kit
                </Button>
              </>
            )}
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !distData ? (
            <p className="text-sm text-muted-foreground text-center py-4">Failed to load campaign packs.</p>
          ) : (
            <div className="space-y-3">
              {["veteran", "case_manager", "partner", "general"].map((audKey) => {
                const entries = distData.audiences[audKey];
                if (!entries?.length) return null;
                const cfg = ADMIN_CAMPAIGN_CONFIG[audKey] || { title: "General Outreach", icon: Users, borderColor: "border-l-gray-500", badgeColor: "bg-gray-100 text-gray-800" };
                const Icon = cfg.icon;
                const isOpen = expandedAudiences[audKey] ?? false;

                return (
                  <div key={audKey} className={`border rounded-lg border-l-4 ${cfg.borderColor} overflow-hidden`} data-testid={`campaign-group-${audKey}`}>
                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50" onClick={() => toggleAudience(audKey)}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium text-sm">{cfg.title}</span>
                        <Badge className={`${cfg.badgeColor} text-[10px]`}>{entries.length} channels</Badge>
                      </div>
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                    {isOpen && (
                      <div className="border-t p-3 space-y-4">
                        {entries[0]?.html_button && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <Code2 className="h-3.5 w-3.5 text-green-700" />
                                <span className="text-xs font-medium text-green-900">HTML Button Embed</span>
                              </div>
                              <AdminCopyBtn text={entries[0].html_button} label={`html-${audKey}`}>Copy HTML</AdminCopyBtn>
                            </div>
                            <div className="bg-gray-900 rounded p-2 text-[11px] text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                              {entries[0].html_button}
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-500 block mb-1">Preview:</span>
                              <a
                                href={entries[0].short_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ background: "#166534", color: "#fff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", display: "inline-block", fontFamily: "Arial, sans-serif", fontSize: "16px" }}
                              >
                                {entries[0].button_label || "Learn More"}
                              </a>
                            </div>
                          </div>
                        )}

                        {entries.map((entry: any) => {
                          const ChIcon = ADMIN_CHANNEL_ICONS[entry.channel] || MessageSquare;
                          const chLabel = ADMIN_CHANNEL_LABELS[entry.channel] || entry.channel;
                          return (
                            <div key={entry.utm_id} className="border rounded-lg p-3 space-y-2" data-testid={`campaign-entry-${entry.utm_id}`}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <ChIcon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                  <span className="text-sm font-medium truncate">{entry.message_title || chLabel}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] shrink-0">{chLabel}</Badge>
                              </div>

                              <div className="flex items-center gap-1 text-xs">
                                <Link2 className="h-3 w-3 text-gray-400 shrink-0" />
                                <span className="truncate text-gray-500">{entry.short_url}</span>
                                <AdminCopyBtn text={entry.short_url} label={`link-${entry.utm_id}`}>Link</AdminCopyBtn>
                              </div>

                              {entry.suggested_copy && (
                                <div className="space-y-1.5">
                                  <div className="bg-gray-50 rounded p-2.5 text-xs whitespace-pre-wrap text-gray-700 max-h-32 overflow-y-auto">
                                    {entry.suggested_copy}
                                  </div>
                                  <AdminCopyBtn text={entry.suggested_copy} label={`msg-${entry.utm_id}`}>Copy Message</AdminCopyBtn>
                                </div>
                              )}

                              {entry.channel === "qr" && (
                                <div className="flex items-center gap-3 pt-1">
                                  <img src={entry.qr_url} alt="QR" className="w-20 h-20 border rounded" />
                                  <a href={entry.qr_url} download={`qr-${entry.utm_id}.png`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                    <Download className="h-3 w-3" /> Download QR
                                  </a>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function AmbassadorDetailView({ ambassadorId, onBack, isNewlyCreated }: { ambassadorId: string; onBack: () => void; isNewlyCreated?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/ambassadors/${ambassadorId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: "archived" }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed to archive"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ambassador-detail", ambassadorId] });
      queryClient.invalidateQueries({ queryKey: ["admin-ambassadors"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/ambassadors/${ambassadorId}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to delete");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ambassadors"] });
      onBack();
    },
    onError: (e: Error) => {
      setDeleteError(e.message);
    },
  });

  const downloadPack = () => {
    if (!amb) return;
    const lines: string[] = [
      `Ambassador Pack`,
      `================`,
      `Name: ${amb.display_name}`,
      `Code: ${amb.code}`,
      `Status: ${amb.status}`,
      amb.email ? `Email: ${amb.email}` : "",
      amb.phone ? `Phone: ${amb.phone}` : "",
      amb.commission_rate != null ? `Commission Rate: ${amb.commission_rate}%` : "",
      ``,
      `Tracking Links`,
      `--------------`,
      ...amb.links.filter(l => l.is_active).map((l, i) => {
        const shortLink = l.short_url ? `https://veterancare.com${l.short_url}` : l.full_url;
        return `${i + 1}. ${l.link_name}\n   Short Link: ${shortLink}\n   UTM ID: ${l.utm_id}\n   Full URL: ${l.full_url}`;
      }),
    ].filter(Boolean);
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ambassador-pack-${amb.code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAllLinks = async () => {
    if (!amb) return;
    const text = amb.links.filter(l => l.is_active).map(l => {
      const url = l.short_url ? `https://veterancare.com${l.short_url}` : l.full_url;
      return `${l.link_name}: ${url}`;
    }).join("\n");
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  };

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
      commission_rate: amb.commission_rate != null ? String(amb.commission_rate) : "",
      notes: amb.notes || "",
      payout_method: amb.payout_method || "",
      payout_details: amb.payout_details || "",
      w9_status: amb.w9_status || "not_submitted",
      tax_notes: amb.tax_notes || "",
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
                  className={`text-xs ${amb.status === "archived" ? "text-slate-500 border-slate-300 bg-slate-100" : amb.status !== "active" ? "text-orange-600 border-orange-300" : ""}`}
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
                      onChange={(e) => setEditData({ ...editData, region_type: e.target.value, region_value: "" })}
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
                    <RegionValueInput
                      regionType={editData.region_type}
                      value={editData.region_value}
                      onChange={(val) => setEditData({ ...editData, region_value: val })}
                      testId="edit-region-value"
                    />
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
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Commission Rate (%)</label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    placeholder="10"
                    value={editData.commission_rate}
                    onChange={(e) => setEditData({ ...editData, commission_rate: e.target.value })}
                    data-testid="edit-commission-rate"
                  />
                </div>
                <div className="border-t pt-3 mt-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Payment & Tax</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Payout Method</label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={editData.payout_method}
                        onChange={(e) => setEditData({ ...editData, payout_method: e.target.value })}
                        data-testid="edit-payout-method"
                      >
                        <option value="">Not set</option>
                        <option value="check">Check</option>
                        <option value="direct_deposit">Direct Deposit (ACH)</option>
                        <option value="wire">Bank Wire</option>
                        <option value="paypal">PayPal</option>
                        <option value="venmo">Venmo</option>
                        <option value="zelle">Zelle</option>
                        <option value="stripe">Stripe Connect</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">W-9 Status</label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={editData.w9_status}
                        onChange={(e) => setEditData({ ...editData, w9_status: e.target.value })}
                        data-testid="edit-w9-status"
                      >
                        <option value="not_submitted">Not Submitted</option>
                        <option value="submitted">Submitted</option>
                        <option value="verified">Verified</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Payout Details</label>
                    <Input
                      placeholder="e.g. PayPal: john@email.com / Check: mail to 123 Main St"
                      value={editData.payout_details}
                      onChange={(e) => setEditData({ ...editData, payout_details: e.target.value })}
                      data-testid="edit-payout-details"
                    />
                  </div>
                  <div className="mt-2">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Tax Notes</label>
                    <Input
                      placeholder="e.g. EIN on file, 1099 threshold notes"
                      value={editData.tax_notes}
                      onChange={(e) => setEditData({ ...editData, tax_notes: e.target.value })}
                      data-testid="edit-tax-notes"
                    />
                  </div>
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
                  {amb.payout_method && (
                    <div>
                      <span className="text-xs text-muted-foreground">Payout Method</span>
                      <p className="font-medium" data-testid="text-payout-method">
                        {{check:"Check",direct_deposit:"Direct Deposit (ACH)",ach:"Direct Deposit (ACH)",wire:"Bank Wire",paypal:"PayPal",venmo:"Venmo",zelle:"Zelle",stripe:"Stripe Connect",other:"Other"}[amb.payout_method] || amb.payout_method}
                      </p>
                    </div>
                  )}
                  {amb.w9_status && amb.w9_status !== "not_submitted" && (
                    <div>
                      <span className="text-xs text-muted-foreground">W-9 Status</span>
                      <p data-testid="text-w9-status">
                        <Badge variant={amb.w9_status === "verified" ? "default" : "outline"} className={amb.w9_status === "verified" ? "bg-green-600" : amb.w9_status === "expired" ? "text-red-600 border-red-300" : ""}>
                          {{not_submitted:"Not Submitted",submitted:"Submitted",verified:"Verified",expired:"Expired"}[amb.w9_status] || amb.w9_status}
                        </Badge>
                      </p>
                    </div>
                  )}
                </div>
                {amb.payout_details && (
                  <div className="mt-2 text-sm">
                    <span className="text-xs text-muted-foreground">Payout Details</span>
                    <p className="text-slate-700" data-testid="text-payout-details">{amb.payout_details}</p>
                  </div>
                )}
                {amb.tax_notes && (
                  <div className="mt-2 text-sm">
                    <span className="text-xs text-muted-foreground">Tax Notes</span>
                    <p className="text-slate-700" data-testid="text-tax-notes">{amb.tax_notes}</p>
                  </div>
                )}
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

        {amb.performance && (
          <Card className="mb-4" data-testid="card-performance">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" /> Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600" data-testid="perf-total-leads">{amb.performance.total_leads}</p>
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600" data-testid="perf-total-revenue">${parseFloat(amb.performance.total_revenue || "0").toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600" data-testid="perf-total-commissions">${parseFloat(amb.performance.total_commission_amount || "0").toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total Commissions</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600" data-testid="perf-total-paid">${parseFloat(amb.performance.total_paid_out || "0").toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total Paid Out</p>
                </div>
              </div>
              {amb.performance.total_leads === 0 && parseFloat(amb.performance.total_revenue || "0") === 0 && amb.performance.total_commissions === 0 ? (
                <p className="text-xs text-muted-foreground text-center mt-3 italic" data-testid="perf-empty-hint">
                  No activity yet — share your links to start generating leads.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="text-center text-sm">
                    <span className="text-muted-foreground text-xs block">Commissions</span>
                    <span className="font-medium">{amb.performance.total_commissions}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({amb.performance.pending_commissions}p / {amb.performance.approved_commissions}a / {amb.performance.paid_commissions}pd)
                    </span>
                  </div>
                  <div className="text-center text-sm">
                    <span className="text-muted-foreground text-xs block">Payouts</span>
                    <span className="font-medium">{amb.performance.total_payouts}</span>
                    <span className="text-xs text-muted-foreground ml-1">({amb.performance.paid_payouts} paid)</span>
                  </div>
                  <div className="text-center text-sm">
                    <span className="text-muted-foreground text-xs block">Clicks</span>
                    <span className="font-medium">{amb.activity.total_clicks}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className={`mb-4 ${isNewlyCreated ? "ring-2 ring-blue-400" : ""}`} data-testid="card-ambassador-assets" id="ambassador-assets">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Package className="h-4 w-4" /> Ambassador Assets
              </CardTitle>
              <div className="flex items-center gap-1">
                <CopyAllButton onCopy={copyAllLinks} />
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={downloadPack} data-testid="button-download-pack">
                  <Download className="h-3 w-3" /> Download Pack
                </Button>
              </div>
            </div>
            {isNewlyCreated && (
              <p className="text-xs text-blue-600 mt-1" data-testid="text-handoff-hint">
                Share these links or QR codes with your ambassador to start tracking activity.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground block">Ambassador Code</span>
                  <span className="font-mono font-bold text-lg" data-testid="text-ambassador-code">{amb.code}</span>
                </div>
                <CopyButton value={amb.code} label="ambassador-code" />
              </div>
            </div>

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
                        <span className="truncate text-slate-600">{link.short_url ? `https://veterancare.com${link.short_url}` : link.full_url}</span>
                      </div>
                      <CopyButton value={link.short_url ? `https://veterancare.com${link.short_url}` : link.full_url} label={`link-${link.id}`} />
                      <a
                        href={link.short_url ? `https://veterancare.com${link.short_url}` : link.full_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 h-7 px-2 text-xs rounded-md border hover:bg-slate-50"
                        data-testid={`test-link-${link.id}`}
                      >
                        <ExternalLink className="h-3 w-3" /> Test
                      </a>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded" data-testid={`utm-id-${link.id}`}>
                        utm_id: {link.utm_id}
                      </span>
                      {link.first_clicked_at && (
                        <span>First click: {formatDate(link.first_clicked_at)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <CampaignPacksSection ambassadorCode={amb.code} />

        <Card className="mb-4 border-orange-200" data-testid="card-lifecycle">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5 text-orange-700">
              <AlertTriangle className="h-4 w-4" /> Lifecycle Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {amb.status !== "archived" ? (
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <Archive className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Archive Ambassador</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Removes from active lists and dropdowns. All links, clicks, leads, commissions, and payouts are preserved.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-orange-700 border-orange-300 hover:bg-orange-100"
                    onClick={() => archiveMutation.mutate()}
                    disabled={archiveMutation.isPending}
                    data-testid="button-archive-ambassador"
                  >
                    {archiveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Archive className="h-3.5 w-3.5 mr-1" />}
                    Archive Ambassador
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Archive className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700">This ambassador is archived</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    To restore, use the Edit button and change status back to Active.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
              <Trash2 className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">Delete Ambassador</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently removes this ambassador and their links. Only available if no commissions or payouts are linked.
                </p>
                {!showDeleteConfirm ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
                    onClick={() => { setShowDeleteConfirm(true); setDeleteError(null); }}
                    data-testid="button-delete-ambassador"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Ambassador
                  </Button>
                ) : (
                  <div className="mt-2 p-3 bg-white border border-red-200 rounded-lg" data-testid="modal-delete-confirm">
                    <p className="text-sm font-medium text-red-700">This will permanently delete this ambassador. This cannot be undone.</p>
                    {deleteError && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1" data-testid="text-delete-error">
                        <AlertTriangle className="h-3 w-3" />
                        {deleteError}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate()}
                        disabled={deleteMutation.isPending}
                        data-testid="button-confirm-delete"
                      >
                        {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                        Yes, Delete Permanently
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(false)} data-testid="button-cancel-delete">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminAmbassadorsInner() {
  const [, navigate] = useLocation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNewlyCreated, setIsNewlyCreated] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;
  const headers = getAdminHeaders();
  const queryClient = useQueryClient();

  const { data: ambassadors, isLoading: loadingList } = useQuery<{ ambassadors: AmbassadorSummary[] }>({
    queryKey: ["admin-ambassadors", showArchived],
    queryFn: async () => {
      const url = showArchived ? "/api/admin/ambassadors?include_archived=true" : "/api/admin/ambassadors";
      const res = await fetch(url, { headers });
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
        onBack={() => { setSelectedId(null); setIsNewlyCreated(false); }}
        isNewlyCreated={isNewlyCreated}
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
            onCreated={(id) => { setSelectedId(id); setIsNewlyCreated(true); }}
          />
        )}

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, email, or region..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
              data-testid="input-search-ambassador"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 shrink-0"
            onClick={() => setShowArchived(!showArchived)}
            data-testid="button-toggle-archived"
          >
            {showArchived ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
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

export default function AdminAmbassadors() {
  return <AdminAuthGuard><AdminAmbassadorsInner /></AdminAuthGuard>;
}
