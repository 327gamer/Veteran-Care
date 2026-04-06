import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Copy, Check, Download, QrCode, ChevronDown, ChevronUp,
  Users, Briefcase, Building2, Mail, MessageSquare,
  Smartphone, Linkedin, LogIn, MousePointerClick, Code2, Package,
} from "lucide-react";

const CAMPAIGN_CONFIG: Record<string, { title: string; icon: any; color: string; badgeColor: string }> = {
  veteran: { title: "Veteran Outreach", icon: Users, color: "border-green-500", badgeColor: "bg-green-100 text-green-800" },
  case_manager: { title: "Case Manager Outreach", icon: Briefcase, color: "border-blue-500", badgeColor: "bg-blue-100 text-blue-800" },
  partner: { title: "Partner / Business Outreach", icon: Building2, color: "border-purple-500", badgeColor: "bg-purple-100 text-purple-800" },
};

const CHANNEL_ICONS: Record<string, any> = {
  email: Mail,
  text: Smartphone,
  facebook: MessageSquare,
  instagram: MessageSquare,
  linkedin: Linkedin,
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  text: "SMS / Text",
  facebook: "Facebook Post",
  instagram: "Instagram Caption",
  linkedin: "LinkedIn Message",
};

function CopyBtn({ text, label, children }: { text: string; label: string; children?: React.ReactNode }) {
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
    <Button
      data-testid={`copy-${label}`}
      variant={copied ? "default" : "outline"}
      size="sm"
      onClick={handleCopy}
      className={`${copied ? "bg-green-600 hover:bg-green-700 text-white" : ""} h-9 min-w-[80px]`}
    >
      {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
      {copied ? "Copied!" : (children || "Copy")}
    </Button>
  );
}

function SafeButtonPreview({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ background: "#166534", color: "#fff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", display: "inline-block", fontFamily: "Arial, sans-serif", fontSize: "16px" }}
    >
      {label}
    </a>
  );
}

function TemplateCard({ channel, template, htmlButton, buttonLabel }: { channel: string; template: any; htmlButton?: string | null; buttonLabel?: string }) {
  const Icon = CHANNEL_ICONS[channel] || MessageSquare;
  const label = CHANNEL_LABELS[channel] || channel;
  const [showHtml, setShowHtml] = useState(false);

  return (
    <div className="border rounded-lg p-4 space-y-3" data-testid={`template-${channel}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-gray-600 shrink-0" />
          <span className="font-medium text-sm truncate">{label}</span>
        </div>
        <CopyBtn text={template.subject ? `Subject: ${template.subject}\n\n${template.body}` : template.body} label={`msg-${channel}`}>
          Copy Message
        </CopyBtn>
      </div>
      {template.subject && (
        <div className="text-xs text-gray-500">
          <span className="font-medium">Subject:</span> {template.subject}
        </div>
      )}
      <div className="bg-gray-50 rounded p-3 text-sm whitespace-pre-wrap text-gray-700 max-h-40 overflow-y-auto">
        {template.body}
      </div>
      <div className="flex items-center gap-2 pt-1 flex-wrap">
        <CopyBtn text={template.tracking_link} label={`link-${channel}`}>
          Copy Link
        </CopyBtn>
        {htmlButton && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1 text-xs"
            onClick={() => setShowHtml(!showHtml)}
            data-testid={`toggle-html-${channel}`}
          >
            <Code2 className="w-3.5 h-3.5" />
            {showHtml ? "Hide HTML" : "HTML Button"}
          </Button>
        )}
      </div>
      {showHtml && htmlButton && (
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-gray-600">Embed Button Code</span>
            <CopyBtn text={htmlButton} label={`html-${channel}`}>
              Copy HTML
            </CopyBtn>
          </div>
          <div className="bg-gray-900 rounded p-3 text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
            {htmlButton}
          </div>
          <div className="pt-1">
            <span className="text-xs text-gray-500 block mb-1">Preview:</span>
            <SafeButtonPreview url={template.tracking_link} label={buttonLabel || "Learn More"} />
          </div>
        </div>
      )}
    </div>
  );
}

function QRCodeSection({ links }: { links: any[] }) {
  const qrLinks = links.filter((l: any) => l.channel === "qr");
  if (qrLinks.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <QrCode className="w-4 h-4" />
        QR Codes
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {qrLinks.map((link: any) => (
          <div key={link.utm_id} className="text-center space-y-2 bg-white border rounded-lg p-3">
            <img
              src={link.qr_url}
              alt={`QR Code - ${link.utm_id}`}
              className="w-28 h-28 mx-auto border rounded"
              data-testid={`qr-${link.utm_id}`}
            />
            <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
              <MousePointerClick className="w-3 h-3" />
              {link.click_count} clicks
            </div>
            <a
              href={link.qr_url}
              download={`${link.utm_id}.png`}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              data-testid={`download-qr-${link.utm_id}`}
            >
              <Download className="w-3 h-3" /> Download PNG
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrackingLinksSection({ links }: { links: any[] }) {
  const nonQrLinks = links.filter((l: any) => l.channel !== "qr");
  if (nonQrLinks.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Your Tracking Links</h4>
      <div className="space-y-2">
        {nonQrLinks.map((link: any) => (
          <div key={link.utm_id} className="flex items-center gap-2 text-sm bg-gray-50 rounded p-2.5">
            <Badge variant="outline" className="text-xs shrink-0">{CHANNEL_LABELS[link.channel] || link.channel}</Badge>
            <span className="truncate flex-1 text-gray-600 text-xs">{link.short_url}</span>
            <span className="text-xs text-gray-400 shrink-0">{link.click_count} clicks</span>
            <CopyBtn text={link.short_url} label={`link-${link.utm_id}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignSection({ campaignKey, data }: { campaignKey: string; data: any }) {
  const [expanded, setExpanded] = useState(true);
  const config = CAMPAIGN_CONFIG[campaignKey];
  if (!config) return null;
  const Icon = config.icon;
  const templateChannels = ["email", "text", "facebook", "instagram", "linkedin"];

  return (
    <Card className={`border-l-4 ${config.color}`} data-testid={`campaign-${campaignKey}`}>
      <CardHeader
        className="cursor-pointer py-4"
        onClick={() => setExpanded(!expanded)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" />
            <span className="text-lg">{config.title}</span>
            <Badge className={config.badgeColor}>
              {data.links.length} links
            </Badge>
          </div>
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </CardTitle>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-6 pt-0">
          <QRCodeSection links={data.links} />
          <TrackingLinksSection links={data.links} />

          {data.html_button && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-green-700" />
                  <span className="text-sm font-medium text-green-900">Email Button Embed</span>
                </div>
                <CopyBtn text={data.html_button} label={`html-main-${campaignKey}`}>
                  Copy HTML
                </CopyBtn>
              </div>
              <div className="bg-gray-900 rounded p-3 text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {data.html_button}
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-2">Preview:</span>
                <SafeButtonPreview url={data.links[0]?.short_url || "#"} label={data.button_label || "Learn More"} />
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Ready-to-Send Templates</h4>
            <p className="text-xs text-gray-500">Each template includes your personal tracking link. Just copy and send — no editing needed.</p>
            <div className="grid gap-3">
              {templateChannels.map((ch) =>
                data.templates[ch] ? (
                  <TemplateCard key={ch} channel={ch} template={data.templates[ch]} htmlButton={data.html_button} buttonLabel={data.button_label} />
                ) : null
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function AmbassadorDashboard() {
  const [code, setCode] = useState("");
  const [activeCode, setActiveCode] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/ambassador/dashboard", activeCode],
    queryFn: async () => {
      const res = await fetch(`/api/ambassador/dashboard/${activeCode}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Not found" }));
        throw new Error(err.error || "Failed to load");
      }
      return res.json();
    },
    enabled: !!activeCode,
    retry: false,
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitized = code.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (sanitized) setActiveCode(sanitized);
  };

  const downloadFullKit = () => {
    if (!data) return;
    const sections: string[] = [];
    sections.push(`AMBASSADOR CAMPAIGN KIT`);
    sections.push(`========================`);
    sections.push(`Name: ${data.ambassador.first_name || data.ambassador.name}`);
    sections.push(`Code: ${data.ambassador.code}`);
    sections.push(``);

    const campaignOrder = ["veteran", "case_manager", "partner"];
    for (const key of campaignOrder) {
      const campaign = data.campaigns[key];
      if (!campaign) continue;
      const cfg = CAMPAIGN_CONFIG[key];
      sections.push(`\n${"=".repeat(50)}`);
      sections.push(`${cfg?.title || key}`);
      sections.push(`${"=".repeat(50)}`);

      if (campaign.html_button) {
        sections.push(`\n--- HTML BUTTON EMBED ---`);
        sections.push(campaign.html_button);
      }

      sections.push(`\n--- TRACKING LINKS ---`);
      for (const link of campaign.links) {
        sections.push(`${CHANNEL_LABELS[link.channel] || link.channel}: ${link.short_url}`);
      }

      sections.push(`\n--- MESSAGE TEMPLATES ---`);
      const channels = ["email", "text", "facebook", "instagram", "linkedin"];
      for (const ch of channels) {
        const tmpl = campaign.templates[ch];
        if (!tmpl) continue;
        sections.push(`\n[${CHANNEL_LABELS[ch] || ch}]`);
        if (tmpl.subject) sections.push(`Subject: ${tmpl.subject}`);
        sections.push(tmpl.body);
      }
    }

    const blob = new Blob([sections.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campaign-kit-${data.ambassador.code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!activeCode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-green-700" />
            </div>
            <CardTitle className="text-2xl">Ambassador Dashboard</CardTitle>
            <p className="text-gray-500 text-sm mt-2">Enter your ambassador code to access your outreach tools</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                data-testid="input-ambassador-code"
                placeholder="Enter your ambassador code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="text-center text-lg"
              />
              <Button
                data-testid="button-login"
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800"
                disabled={!code.trim()}
              >
                <LogIn className="w-4 h-4 mr-2" />
                Access Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 space-y-4">
            <p className="text-red-600 font-medium">Ambassador not found</p>
            <p className="text-gray-500 text-sm">Check your code and try again.</p>
            <Button
              data-testid="button-try-again"
              variant="outline"
              onClick={() => { setActiveCode(null); setCode(""); }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const campaignOrder = ["veteran", "case_manager", "partner"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate" data-testid="text-welcome">
              Welcome, {data.ambassador.first_name || data.ambassador.name}
            </h1>
            <p className="text-gray-500 text-sm">Your outreach tools and tracking links</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              data-testid="button-download-kit"
              variant="outline"
              size="sm"
              onClick={downloadFullKit}
              className="gap-1"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Download Kit</span>
              <span className="sm:hidden">Kit</span>
            </Button>
            <Button
              data-testid="button-logout"
              variant="ghost"
              size="sm"
              onClick={() => { setActiveCode(null); setCode(""); }}
            >
              Switch
            </Button>
          </div>
        </div>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h3 className="font-medium text-green-900">How to use this dashboard</h3>
                <ol className="text-sm text-green-800 mt-1 space-y-1 list-decimal list-inside">
                  <li>Choose a campaign below (Veteran, Case Manager, or Partner)</li>
                  <li>Find the template for your channel (Email, Text, Facebook, etc.)</li>
                  <li>Tap <strong>Copy</strong> and paste it wherever you're sending</li>
                  <li>Your personal tracking link is already included — no editing needed</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {campaignOrder.map((key) =>
          data.campaigns[key] ? (
            <CampaignSection key={key} campaignKey={key} data={data.campaigns[key]} />
          ) : null
        )}
      </div>
    </div>
  );
}
