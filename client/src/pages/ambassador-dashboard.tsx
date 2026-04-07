import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy, Check, Download, QrCode, ChevronDown, ChevronUp,
  Users, Briefcase, Building2, Mail, MessageSquare,
  Smartphone, Linkedin, LogIn, MousePointerClick, Code2, Package,
  Image, Link2, Type, Globe,
} from "lucide-react";

const LOGO_URL = "https://veterancare.com/attached_assets/Veteran_Care_-_Shadow_(TM)_-_PNG_1775367756504.png";

const CAMPAIGN_CONFIG: Record<string, { title: string; icon: any; color: string; badgeColor: string }> = {
  veteran: { title: "Veteran Outreach", icon: Users, color: "border-green-500", badgeColor: "bg-green-100 text-green-800" },
  case_manager: { title: "Case Manager Outreach", icon: Briefcase, color: "border-blue-500", badgeColor: "bg-blue-100 text-blue-800" },
  partner: { title: "Partner / Business Outreach", icon: Building2, color: "border-purple-500", badgeColor: "bg-purple-100 text-purple-800" },
  general: { title: "General Outreach", icon: Globe, color: "border-gray-500", badgeColor: "bg-gray-100 text-gray-800" },
};

const AUDIENCE_CTA: Record<string, string> = {
  veteran: "Get Help Now",
  case_manager: "Explore Resources",
  partner: "Become a Trusted Partner",
  general: "Learn More",
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

function CopyBtn({ text, label, children, size = "sm" }: { text: string; label: string; children?: React.ReactNode; size?: "sm" | "xs" }) {
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
      size={size === "xs" ? "sm" : "sm"}
      onClick={handleCopy}
      className={`${copied ? "bg-green-600 hover:bg-green-700 text-white" : ""} ${size === "xs" ? "h-7 text-xs min-w-[70px]" : "h-9 min-w-[80px]"}`}
    >
      {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
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

function KitAssetRow({ label, icon: Icon, code, preview, testId }: {
  label: string;
  icon: any;
  code: string;
  preview?: React.ReactNode;
  testId: string;
}) {
  const [showCode, setShowCode] = useState(false);
  return (
    <div className="border rounded-lg p-3 space-y-2" data-testid={testId}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className="w-4 h-4 text-gray-500 shrink-0" />
          <span className="text-sm font-medium truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowCode(!showCode)}
            data-testid={`toggle-code-${testId}`}
          >
            <Code2 className="w-3.5 h-3.5 mr-1" />
            {showCode ? "Hide" : "Code"}
          </Button>
          <CopyBtn text={code} label={testId} size="xs">Copy</CopyBtn>
        </div>
      </div>
      {preview && (
        <div className="bg-gray-50 rounded p-3 flex items-center justify-center min-h-[48px]">
          {preview}
        </div>
      )}
      {showCode && (
        <div className="bg-gray-900 rounded p-2.5 text-xs text-green-400 font-mono overflow-x-auto whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
          {code}
        </div>
      )}
    </div>
  );
}

function AmbassadorKitSection({ campaigns }: { campaigns: Record<string, any> }) {
  const audienceOrder = ["veteran", "case_manager", "partner", "general"];
  const availableAudiences = audienceOrder.filter(a => campaigns[a]);

  if (availableAudiences.length === 0) return null;

  return (
    <Card className="border-2 border-amber-300 bg-amber-50/30" data-testid="card-ambassador-kit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <Package className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <span className="text-lg">Promotional Kit</span>
            <p className="text-xs font-normal text-muted-foreground mt-0.5">
              Ready-to-use assets for email, SMS, social media, and websites
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue={availableAudiences[0]} className="w-full">
          <TabsList className="w-full flex h-auto flex-wrap gap-1 bg-amber-100/50 p-1">
            {availableAudiences.map(aud => {
              const cfg = CAMPAIGN_CONFIG[aud];
              if (!cfg) return null;
              const Icon = cfg.icon;
              return (
                <TabsTrigger
                  key={aud}
                  value={aud}
                  className="flex-1 min-w-[120px] text-xs gap-1.5 data-[state=active]:bg-white"
                  data-testid={`kit-tab-${aud}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{cfg.title.replace(" Outreach", "")}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {availableAudiences.map(aud => {
            const campaign = campaigns[aud];
            if (!campaign) return null;
            const ctaLabel = AUDIENCE_CTA[aud];
            const emailLink = campaign.links?.find((l: any) => l.channel === "email");
            const textLink = campaign.links?.find((l: any) => l.channel === "text") || emailLink;
            const primaryUrl = emailLink?.short_url || campaign.links?.[0]?.short_url || "#";
            const textUrl = textLink?.short_url || primaryUrl;

            const logoHtml = `<a href="${primaryUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;"><img src="${LOGO_URL}" alt="Veteran Care" style="height:60px;width:auto;border:0;" /></a>`;

            const buttonHtml = `<a href="${primaryUrl}" style="background:#166534;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-family:Arial,sans-serif;font-size:16px;text-align:center;">${ctaLabel}</a>`;

            const imageBlockHtml = `<a href="${primaryUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;"><div style="max-width:400px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;font-family:Arial,sans-serif;"><div style="background:#f0fdf4;padding:20px;text-align:center;"><img src="${LOGO_URL}" alt="Veteran Care" style="height:50px;width:auto;" /></div><div style="padding:16px 20px;background:#ffffff;"><p style="margin:0 0 12px;font-size:15px;color:#1f2937;line-height:1.4;">Free resources for U.S. military veterans — housing, employment, benefits, mental health & more.</p><div style="background:#166534;color:#ffffff;padding:12px 24px;border-radius:8px;text-align:center;font-weight:bold;font-size:15px;">${ctaLabel}</div></div></div></a>`;

            return (
              <TabsContent key={aud} value={aud} className="mt-4 space-y-3" data-testid={`kit-content-${aud}`}>
                <KitAssetRow
                  label="Clickable Logo"
                  icon={Image}
                  code={logoHtml}
                  testId={`kit-logo-${aud}`}
                  preview={
                    <a href={primaryUrl} target="_blank" rel="noopener noreferrer">
                      <img src={LOGO_URL} alt="Veteran Care" className="h-12 w-auto" />
                    </a>
                  }
                />

                <KitAssetRow
                  label={`CTA Button — "${ctaLabel}"`}
                  icon={Code2}
                  code={buttonHtml}
                  testId={`kit-button-${aud}`}
                  preview={<SafeButtonPreview url={primaryUrl} label={ctaLabel} />}
                />

                <KitAssetRow
                  label="Image Card Embed"
                  icon={Image}
                  code={imageBlockHtml}
                  testId={`kit-image-${aud}`}
                  preview={
                    <a href={primaryUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "inline-block" }}>
                      <div style={{ maxWidth: 320, border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", fontFamily: "Arial, sans-serif" }}>
                        <div style={{ background: "#f0fdf4", padding: 14, textAlign: "center" }}>
                          <img src={LOGO_URL} alt="Veteran Care" style={{ height: 36, width: "auto" }} />
                        </div>
                        <div style={{ padding: "12px 16px", background: "#fff" }}>
                          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#1f2937", lineHeight: 1.4 }}>
                            Free resources for U.S. military veterans — housing, employment, benefits, mental health & more.
                          </p>
                          <div style={{ background: "#166534", color: "#fff", padding: "10px 20px", borderRadius: 8, textAlign: "center", fontWeight: "bold", fontSize: 13 }}>
                            {ctaLabel}
                          </div>
                        </div>
                      </div>
                    </a>
                  }
                />

                <KitAssetRow
                  label="Text / SMS Link"
                  icon={Type}
                  code={textUrl}
                  testId={`kit-text-${aud}`}
                  preview={
                    <div className="text-center">
                      <code className="text-sm text-blue-700 bg-blue-50 px-3 py-1.5 rounded font-mono break-all">{textUrl}</code>
                    </div>
                  }
                />

                {campaign.links?.filter((l: any) => l.channel === "qr").map((link: any) => (
                  <div key={link.utm_id} className="border rounded-lg p-3" data-testid={`kit-qr-${aud}`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">QR Code</span>
                      </div>
                      <a
                        href={link.qr_url}
                        download={`veteran-care-qr-${aud}.png`}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        data-testid={`kit-download-qr-${aud}`}
                      >
                        <Download className="w-3 h-3" /> Download PNG
                      </a>
                    </div>
                    <div className="bg-gray-50 rounded p-3 flex justify-center">
                      <img src={link.qr_url} alt={`QR Code - ${aud}`} className="w-32 h-32 border rounded" />
                    </div>
                  </div>
                ))}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
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
  const [expanded, setExpanded] = useState(false);
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
            <p className="text-xs text-gray-500">Each template includes your personal tracking link. Just copy and send.</p>
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
    const baseUrl = "https://veterancare.com";
    sections.push(`VETERAN CARE — AMBASSADOR PROMOTIONAL KIT`);
    sections.push(`${"=".repeat(50)}`);
    sections.push(`Ambassador: ${data.ambassador.first_name || data.ambassador.name}`);
    sections.push(`Code: ${data.ambassador.code}`);
    sections.push(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
    sections.push(``);

    const campaignOrder = ["veteran", "case_manager", "partner", "general"];
    for (const key of campaignOrder) {
      const campaign = data.campaigns[key];
      if (!campaign) continue;
      const cfg = CAMPAIGN_CONFIG[key];
      const ctaLabel = AUDIENCE_CTA[key];
      const emailLink = campaign.links?.find((l: any) => l.channel === "email");
      const textLink = campaign.links?.find((l: any) => l.channel === "text") || emailLink;
      const primaryUrl = emailLink?.short_url || campaign.links?.[0]?.short_url || "";
      const textUrl = textLink?.short_url || primaryUrl;

      sections.push(`\n${"=".repeat(50)}`);
      sections.push(`${cfg?.title || key}`);
      sections.push(`${"=".repeat(50)}`);

      sections.push(`\n--- PROMOTIONAL ASSETS ---`);
      sections.push(`\nClickable Logo (HTML):`);
      sections.push(`<a href="${primaryUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;"><img src="${LOGO_URL}" alt="Veteran Care" style="height:60px;width:auto;border:0;" /></a>`);

      sections.push(`\nCTA Button (HTML):`);
      sections.push(`<a href="${primaryUrl}" style="background:#166534;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-family:Arial,sans-serif;font-size:16px;text-align:center;">${ctaLabel}</a>`);

      sections.push(`\nImage Card Embed (HTML):`);
      sections.push(`<a href="${primaryUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;"><div style="max-width:400px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;font-family:Arial,sans-serif;"><div style="background:#f0fdf4;padding:20px;text-align:center;"><img src="${LOGO_URL}" alt="Veteran Care" style="height:50px;width:auto;" /></div><div style="padding:16px 20px;background:#ffffff;"><p style="margin:0 0 12px;font-size:15px;color:#1f2937;line-height:1.4;">Free resources for U.S. military veterans — housing, employment, benefits, mental health & more.</p><div style="background:#166534;color:#ffffff;padding:12px 24px;border-radius:8px;text-align:center;font-weight:bold;font-size:15px;">${ctaLabel}</div></div></div></a>`);

      sections.push(`\nText / SMS Link:`);
      sections.push(textUrl);

      sections.push(`\n--- ALL TRACKING LINKS ---`);
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
    a.download = `veteran-care-ambassador-kit-${data.ambassador.code}.txt`;
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

  const campaignOrder = ["veteran", "case_manager", "partner", "general"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate" data-testid="text-welcome">
              Welcome, {data.ambassador.first_name || data.ambassador.name}
            </h1>
            <p className="text-gray-500 text-sm">Your outreach tools and promotional assets</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              data-testid="button-download-kit"
              variant="outline"
              size="sm"
              onClick={downloadFullKit}
              className="gap-1"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download Full Kit</span>
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

        <AmbassadorKitSection campaigns={data.campaigns} />

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h3 className="font-medium text-green-900">How to use your kit</h3>
                <ol className="text-sm text-green-800 mt-1 space-y-1 list-decimal list-inside">
                  <li>Choose an audience tab above (Veteran, Case Manager, Partner, or General)</li>
                  <li>Pick an asset — logo, button, image card, or text link</li>
                  <li>Tap <strong>Copy</strong> and paste it into your email, post, or message</li>
                  <li>Your tracking is built in — no editing needed</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2" data-testid="text-templates-header">
            <Mail className="w-5 h-5" />
            Message Templates & Links
          </h2>
          <p className="text-sm text-muted-foreground">Expand any campaign below to see ready-to-send templates</p>
        </div>

        {campaignOrder.map((key) =>
          data.campaigns[key] ? (
            <CampaignSection key={key} campaignKey={key} data={data.campaigns[key]} />
          ) : null
        )}
      </div>
    </div>
  );
}
