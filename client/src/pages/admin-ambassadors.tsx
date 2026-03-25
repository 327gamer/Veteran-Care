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
} from "lucide-react";
import { useLocation } from "wouter";

interface DistLink {
  link_name: string;
  utm_id: string;
  full_url: string;
  short_url: string;
  qr_url: string;
  audience: string;
  channel: string;
  campaign: string;
  message_title: string;
  suggested_copy: string | null;
  click_count: number;
  last_clicked_at: string | null;
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

interface DistPack {
  ambassador_code: string;
  ambassador_name: string;
  total_links: number;
  audiences: Record<string, DistLink[]>;
  commission_info: Record<string, string>;
}

interface AmbassadorSummary {
  ambassador_code: string;
  ambassador_name: string;
  link_count: number;
  total_clicks: number;
  last_activity: string | null;
  email: string | null;
  region: string | null;
}

const AUDIENCE_LABELS: Record<string, string> = {
  general: "General Public",
  veteran: "Veterans",
  case_manager: "Case Managers & Nonprofits",
  partner: "Partners & Businesses",
};

const AUDIENCE_COLORS: Record<string, string> = {
  general: "bg-blue-100 text-blue-800",
  veteran: "bg-green-100 text-green-800",
  case_manager: "bg-purple-100 text-purple-800",
  partner: "bg-orange-100 text-orange-800",
};

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-7 px-2 text-xs gap-1"
      data-testid={`copy-${label || "btn"}`}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-600" />
          <span className="text-green-600">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span>{label || "Copy"}</span>
        </>
      )}
    </Button>
  );
}

function LinkCard({ link }: { link: DistLink }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg p-3 bg-white" data-testid={`link-card-${link.utm_id}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{link.message_title}</span>
            <Badge
              variant={link.click_count > 0 ? "secondary" : "outline"}
              className={`text-xs ${link.click_count === 0 ? "text-muted-foreground" : ""}`}
              data-testid={`clicks-${link.utm_id}`}
            >
              {link.click_count} click{link.click_count !== 1 ? "s" : ""}
            </Badge>
            {link.last_clicked_at && (
              <span className="text-xs text-muted-foreground" data-testid={`last-click-${link.utm_id}`}>
                {timeAgo(link.last_clicked_at)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{link.link_name}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="h-7 w-7 p-0 shrink-0"
          data-testid={`toggle-${link.utm_id}`}
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex items-center gap-1 mt-2 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-50 rounded px-2 py-1 text-xs flex-1 min-w-0">
          <Link2 className="h-3 w-3 shrink-0 text-slate-400" />
          <span className="truncate text-slate-600">{link.short_url}</span>
        </div>
        <CopyButton value={link.short_url} label="Link" />
        <a
          href={link.short_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 h-7 px-2 text-xs rounded-md border hover:bg-slate-50"
          data-testid={`test-link-${link.utm_id}`}
        >
          <ExternalLink className="h-3 w-3" />
          Test
        </a>
        <a
          href={link.qr_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 h-7 px-2 text-xs rounded-md border hover:bg-slate-50"
          data-testid={`qr-download-${link.utm_id}`}
        >
          <QrCode className="h-3 w-3" />
          QR
        </a>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2">
          {link.suggested_copy && (
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Suggested Message
                </span>
                <CopyButton value={link.suggested_copy} label="Message" />
              </div>
              <p className="text-sm whitespace-pre-line text-slate-700" data-testid={`copy-preview-${link.utm_id}`}>
                {link.suggested_copy}
              </p>
            </div>
          )}
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p><span className="font-medium">UTM ID:</span> {link.utm_id}</p>
            <p><span className="font-medium">Full URL:</span> <span className="break-all">{link.full_url}</span></p>
          </div>
        </div>
      )}

      {!expanded && link.suggested_copy && (
        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">
          {link.suggested_copy.split("\n")[0]}
        </p>
      )}
    </div>
  );
}

function AudienceSection({ audience, links }: { audience: string; links: DistLink[] }) {
  const [open, setOpen] = useState(true);
  const totalClicks = links.reduce((s, l) => s + l.click_count, 0);

  return (
    <div className="mb-4" data-testid={`audience-section-${audience}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left py-2 px-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-500" />
          <span className="font-semibold text-sm">{AUDIENCE_LABELS[audience] || audience}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${AUDIENCE_COLORS[audience] || "bg-gray-100 text-gray-800"}`}>
            {links.length} links
          </span>
          {totalClicks > 0 && (
            <Badge variant="secondary" className="text-xs">{totalClicks} total clicks</Badge>
          )}
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="mt-2 space-y-2 pl-1">
          {links.map((link) => (
            <LinkCard key={link.utm_id} link={link} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminAmbassadors() {
  const [, navigate] = useLocation();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRegion, setFormRegion] = useState("");

  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (adminKey) headers["x-admin-key"] = adminKey;

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

  const createMutation = useMutation({
    mutationFn: async (data: { ambassador_name: string; email?: string; region?: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ["admin-ambassadors"] });
      setShowAddForm(false);
      setFormName("");
      setFormEmail("");
      setFormRegion("");
    },
  });

  const { data: distPack, isLoading: loadingPack } = useQuery<DistPack>({
    queryKey: ["admin-ambassador-dist", selectedCode],
    queryFn: async () => {
      const res = await fetch(`/api/admin/ambassador-distribution/${selectedCode}`, { headers });
      if (!res.ok) throw new Error("Failed to load distribution pack");
      return res.json();
    },
    enabled: !!adminKey && !!selectedCode,
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

  const filteredAmbassadors = ambassadors?.ambassadors?.filter((a) =>
    !searchInput || a.ambassador_name.toLowerCase().includes(searchInput.toLowerCase()) || a.ambassador_code.toLowerCase().includes(searchInput.toLowerCase())
  );

  if (selectedCode && distPack) {
    const audiences = Object.keys(distPack.audiences);

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedCode(null)} data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>

          <Card className="mb-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg" data-testid="text-ambassador-name">{distPack.ambassador_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{distPack.total_links} links across {audiences.length} audiences</p>
                </div>
                <a
                  href={`/api/admin/ambassador-distribution/${selectedCode}?format=csv`}
                  onClick={(e) => {
                    e.preventDefault();
                    fetch(`/api/admin/ambassador-distribution/${selectedCode}?format=csv`, { headers })
                      .then(r => r.blob())
                      .then(b => {
                        const url = URL.createObjectURL(b);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${selectedCode}_distribution_pack.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      });
                  }}
                  data-testid="button-download-csv"
                >
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-3.5 w-3.5" /> CSV
                  </Button>
                </a>
              </div>
            </CardHeader>
          </Card>

          {audiences.map((audience) => (
            <AudienceSection key={audience} audience={audience} links={distPack.audiences[audience]} />
          ))}

          <Card className="mt-4 bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-800">How Tracking Works</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="text-xs text-blue-700 space-y-1.5">
                {Object.entries(distPack.commission_info).map(([key, val]) => (
                  <li key={key}>• {val}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")} data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4 mr-1" /> Admin
            </Button>
            <h1 className="text-lg font-bold">Ambassadors</h1>
          </div>
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)} data-testid="button-add-ambassador">
            <Plus className="h-4 w-4 mr-1" /> Add Ambassador
          </Button>
        </div>

        {showAddForm && (
          <Card className="mb-4 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Add New Ambassador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Name *</label>
                <Input
                  placeholder="e.g. Tracy Johnson"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  data-testid="input-ambassador-name"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Email (optional)</label>
                <Input
                  type="email"
                  placeholder="tracy@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  data-testid="input-ambassador-email"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Region (optional)</label>
                <Input
                  placeholder="e.g. Upstate SC"
                  value={formRegion}
                  onChange={(e) => setFormRegion(e.target.value)}
                  data-testid="input-ambassador-region"
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
                  disabled={!formName.trim() || createMutation.isPending}
                  onClick={() => {
                    const payload: any = { ambassador_name: formName.trim() };
                    if (formEmail.trim()) payload.email = formEmail.trim();
                    if (formRegion.trim()) payload.region = formRegion.trim();
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
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)} data-testid="button-cancel-add">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ambassadors..."
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
              key={amb.ambassador_code}
              className="cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() => setSelectedCode(amb.ambassador_code)}
              data-testid={`card-ambassador-${amb.ambassador_code}`}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-sm" data-testid={`text-name-${amb.ambassador_code}`}>{amb.ambassador_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span>{amb.ambassador_code}</span>
                      <span>•</span>
                      <span>{amb.link_count} links</span>
                      {amb.region && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />{amb.region}
                          </span>
                        </>
                      )}
                      {amb.email && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-0.5">
                            <Mail className="h-3 w-3" />{amb.email}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
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
