import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Copy, Check, Download, QrCode, ChevronDown, ChevronUp,
  Users, Briefcase, Building2, Mail, MessageSquare,
  Smartphone, Linkedin, LogIn, MousePointerClick,
} from "lucide-react";

const CAMPAIGN_CONFIG: Record<string, { title: string; icon: any; color: string; badgeColor: string }> = {
  veteran: { title: "Veteran Outreach", icon: Users, color: "border-green-500", badgeColor: "bg-green-100 text-green-800" },
  case_manager: { title: "Case Management Outreach", icon: Briefcase, color: "border-blue-500", badgeColor: "bg-blue-100 text-blue-800" },
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

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      data-testid={`copy-${label}`}
      variant={copied ? "default" : "outline"}
      size="sm"
      onClick={handleCopy}
      className={copied ? "bg-green-600 hover:bg-green-700 text-white" : ""}
    >
      {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}

function TemplateCard({ channel, template }: { channel: string; template: any }) {
  const Icon = CHANNEL_ICONS[channel] || MessageSquare;
  const label = CHANNEL_LABELS[channel] || channel;

  return (
    <div className="border rounded-lg p-4 space-y-3" data-testid={`template-${channel}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-sm">{label}</span>
        </div>
        <CopyButton text={template.subject ? `Subject: ${template.subject}\n\n${template.body}` : template.body} label={`template-${channel}`} />
      </div>
      {template.subject && (
        <div className="text-xs text-gray-500">
          <span className="font-medium">Subject:</span> {template.subject}
        </div>
      )}
      <div className="bg-gray-50 rounded p-3 text-sm whitespace-pre-wrap text-gray-700 max-h-40 overflow-y-auto">
        {template.body}
      </div>
    </div>
  );
}

function QRCodeSection({ links, ambassadorCode }: { links: any[]; ambassadorCode: string }) {
  const qrLinks = links.filter((l: any) => l.channel === "qr");
  if (qrLinks.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <QrCode className="w-4 h-4" />
        QR Codes
      </h4>
      <div className="flex flex-wrap gap-4">
        {qrLinks.map((link: any) => (
          <div key={link.utm_id} className="text-center space-y-2">
            <img
              src={link.qr_url}
              alt={`QR Code - ${link.utm_id}`}
              className="w-32 h-32 border rounded"
              data-testid={`qr-${link.utm_id}`}
            />
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MousePointerClick className="w-3 h-3" />
              {link.click_count} clicks
            </div>
            <a
              href={link.qr_url}
              download={`${link.utm_id}.png`}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              data-testid={`download-qr-${link.utm_id}`}
            >
              <Download className="w-3 h-3" /> Download
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
          <div key={link.utm_id} className="flex items-center gap-2 text-sm bg-gray-50 rounded p-2">
            <Badge variant="outline" className="text-xs shrink-0">{link.channel}</Badge>
            <span className="truncate flex-1 text-gray-600">{link.short_url}</span>
            <span className="text-xs text-gray-400 shrink-0">{link.click_count} clicks</span>
            <CopyButton text={link.short_url} label={`link-${link.utm_id}`} />
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
        className="cursor-pointer"
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
        <CardContent className="space-y-6">
          <QRCodeSection links={data.links} ambassadorCode="" />
          <TrackingLinksSection links={data.links} />
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Ready-to-Send Templates</h4>
            <p className="text-xs text-gray-500">Each template includes your personal tracking link. Just copy and send — no editing needed.</p>
            <div className="grid gap-3">
              {templateChannels.map((ch) =>
                data.templates[ch] ? (
                  <TemplateCard key={ch} channel={ch} template={data.templates[ch]} />
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="text-welcome">
              Welcome, {data.ambassador.first_name || data.ambassador.name}
            </h1>
            <p className="text-gray-500 text-sm">Your outreach tools and tracking links</p>
          </div>
          <Button
            data-testid="button-logout"
            variant="ghost"
            size="sm"
            onClick={() => { setActiveCode(null); setCode(""); }}
          >
            Switch Account
          </Button>
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
                  <li>Choose a campaign below (Veteran, Case Management, or Partner)</li>
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
