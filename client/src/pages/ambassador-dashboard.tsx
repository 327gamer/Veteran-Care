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
  Image, Link2, Type, Globe, MapPin, Percent, LogOut, Video, Play,
} from "lucide-react";
import { getCampaignVideo, getThumbnail } from "@/lib/campaign-videos";

const LOGO_URL = "https://veterancare.com/logo.png";

const CAMPAIGN_CONFIG: Record<string, { title: string; icon: any; color: string; badgeColor: string }> = {
  veteran: { title: "Veterans & Dependents", icon: Users, color: "border-green-500", badgeColor: "bg-green-100 text-green-800" },
  case_manager: { title: "Case Manager Outreach", icon: Briefcase, color: "border-blue-500", badgeColor: "bg-blue-100 text-blue-800" },
  partner: { title: "Partner / Business Outreach", icon: Building2, color: "border-purple-500", badgeColor: "bg-purple-100 text-purple-800" },
  general: { title: "Get Help Now", icon: Globe, color: "border-gray-500", badgeColor: "bg-gray-100 text-gray-800" },
  homepage: { title: "General Share Link (Homepage)", icon: Link2, color: "border-amber-500", badgeColor: "bg-amber-100 text-amber-800" },
};

const CAMPAIGN_ORDER = ["veteran", "case_manager", "partner", "general", "homepage"];

const AUDIENCE_CTA: Record<string, string> = {
  veteran: "Get Help Now",
  case_manager: "Explore Resources",
  partner: "Become a Trusted Partner",
  general: "Learn More",
  homepage: "Visit Veteran Care",
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

function CopyRichBtn({ html, plainText, label, children, variant = "default" }: {
  html: string;
  plainText?: string;
  label: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
}) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      const blob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([plainText || html], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": blob, "text/plain": textBlob }),
      ]);
    } catch {
      try { await navigator.clipboard.writeText(plainText || html); } catch {
        const ta = document.createElement("textarea");
        ta.value = plainText || html; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  const baseClass = variant === "default"
    ? "bg-green-700 hover:bg-green-800 text-white"
    : variant === "outline"
    ? "border border-gray-300"
    : "";
  return (
    <Button
      data-testid={`copy-rich-${label}`}
      variant={copied ? "default" : variant === "default" ? "default" : "outline"}
      size="sm"
      onClick={handleCopy}
      className={`h-9 text-sm gap-1.5 ${copied ? "bg-green-600 hover:bg-green-700 text-white" : baseClass}`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copied!" : children}
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

function AmbassadorKitSection({ campaigns, onDownloadKit }: { campaigns: Record<string, any>; onDownloadKit: () => void }) {
  const audienceOrder = ["veteran", "case_manager", "partner", "general", "homepage"];
  const availableAudiences = audienceOrder.filter(a => campaigns[a]);

  if (availableAudiences.length === 0) return null;

  return (
    <Card className="border-2 border-green-600 shadow-lg" data-testid="card-ambassador-kit">
      <CardHeader className="pb-3 bg-green-50 border-b border-green-200">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-lg font-bold text-green-900">Ambassador Kit</span>
            <p className="text-xs font-normal text-green-700 mt-0.5">
              Copy any asset below and paste directly into email, SMS, or social media
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue={availableAudiences[0]} className="w-full">
          <TabsList className="w-full flex h-auto flex-wrap gap-1 bg-green-50 p-1 rounded-lg">
            {availableAudiences.map(aud => {
              const cfg = CAMPAIGN_CONFIG[aud];
              if (!cfg) return null;
              const Icon = cfg.icon;
              return (
                <TabsTrigger
                  key={aud}
                  value={aud}
                  className="flex-1 min-w-[80px] text-xs gap-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-800 data-[state=active]:font-semibold py-2"
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

            const logoHtml = `<a href="${primaryUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;"><img src="${LOGO_URL}" alt="Veteran Care" style="display:block;max-width:200px;height:auto;border:0;" /></a>`;
            const buttonHtml = `<a href="${primaryUrl}" style="background:#166534;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-family:Arial,sans-serif;font-size:16px;text-align:center;">${ctaLabel}</a>`;
            const imageBlockHtml = `<a href="${primaryUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;"><div style="max-width:400px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;font-family:Arial,sans-serif;"><div style="background:#ffffff;padding:24px 20px;text-align:center;border-bottom:1px solid #e5e7eb;"><img src="${LOGO_URL}" alt="Veteran Care" style="display:block;max-width:180px;height:auto;margin:0 auto;border:0;" /></div><div style="padding:16px 20px;background:#ffffff;"><p style="margin:0 0 12px;font-size:15px;color:#1f2937;line-height:1.4;">Free resources for U.S. military veterans, their families &amp; dependents — housing, employment, benefits, mental health &amp; more.</p><div style="background:#166534;color:#ffffff;padding:12px 24px;border-radius:8px;text-align:center;font-weight:bold;font-size:15px;">${ctaLabel}</div></div></div></a>`;
            const emailBodyHtml = campaign.templates?.email
              ? `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1f2937;line-height:1.6;max-width:560px;">${campaign.templates.email.body.split("\n").map((line: string) => line.trim() === "" ? "<br/>" : `<p style="margin:0 0 10px;">${line}</p>`).join("")}<br/>${buttonHtml}</div>`
              : null;
            const emailPlainText = campaign.templates?.email
              ? (campaign.templates.email.subject ? `Subject: ${campaign.templates.email.subject}\n\n` : "") + campaign.templates.email.body
              : primaryUrl;

            return (
              <TabsContent key={aud} value={aud} className="mt-4 space-y-4" data-testid={`kit-content-${aud}`}>

                <div className="border rounded-lg bg-white overflow-hidden" data-testid={`kit-logo-${aud}`}>
                  <div className="px-4 py-3 border-b bg-gray-50/60 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center shrink-0">
                      <Image className="w-3.5 h-3.5 text-green-700" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Clickable Logo</span>
                    <span className="text-xs text-gray-400 ml-auto hidden sm:inline">Paste into email — logo links to your tracked URL</span>
                  </div>
                  <div className="p-5 flex items-center justify-center">
                    <a href={primaryUrl} target="_blank" rel="noopener noreferrer">
                      <img src={LOGO_URL} alt="Veteran Care" className="h-14 w-auto" />
                    </a>
                  </div>
                  <div className="px-4 pb-4 flex flex-wrap gap-2">
                    <CopyRichBtn html={logoHtml} plainText={primaryUrl} label={`logo-email-${aud}`}>
                      Copy Logo for Email
                    </CopyRichBtn>
                    <CopyBtn text={logoHtml} label={`logo-html-${aud}`} size="xs">Copy HTML Code</CopyBtn>
                  </div>
                </div>

                <div className="border rounded-lg bg-white overflow-hidden" data-testid={`kit-button-${aud}`}>
                  <div className="px-4 py-3 border-b bg-gray-50/60 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center shrink-0">
                      <MousePointerClick className="w-3.5 h-3.5 text-green-700" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">CTA Button — "{ctaLabel}"</span>
                  </div>
                  <div className="p-5 flex items-center justify-center">
                    <SafeButtonPreview url={primaryUrl} label={ctaLabel} />
                  </div>
                  <div className="px-4 pb-4 flex flex-wrap gap-2">
                    <CopyRichBtn html={buttonHtml} plainText={`${ctaLabel}: ${primaryUrl}`} label={`button-email-${aud}`}>
                      Copy Button for Email
                    </CopyRichBtn>
                    <CopyBtn text={buttonHtml} label={`button-html-${aud}`} size="xs">Copy HTML Code</CopyBtn>
                  </div>
                </div>

                <div className="border rounded-lg bg-white overflow-hidden" data-testid={`kit-image-${aud}`}>
                  <div className="px-4 py-3 border-b bg-gray-50/60 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center shrink-0">
                      <Image className="w-3.5 h-3.5 text-green-700" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Image Card (Flyer Style)</span>
                  </div>
                  <div className="p-5 flex items-center justify-center">
                    <a href={primaryUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "inline-block", width: "100%", maxWidth: 340 }}>
                      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", fontFamily: "Arial, sans-serif" }}>
                        <div style={{ background: "#ffffff", padding: "24px 20px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>
                          <img src={LOGO_URL} alt="Veteran Care" style={{ display: "block", maxWidth: 180, height: "auto", margin: "0 auto", border: 0 }} />
                        </div>
                        <div style={{ padding: "14px 18px", background: "#fff" }}>
                          <p style={{ margin: "0 0 12px", fontSize: 14, color: "#1f2937", lineHeight: 1.5 }}>
                            Free resources for U.S. military veterans, their families & dependents — housing, employment, benefits, mental health & more.
                          </p>
                          <div style={{ background: "#166534", color: "#fff", padding: "11px 22px", borderRadius: 8, textAlign: "center", fontWeight: "bold", fontSize: 14 }}>
                            {ctaLabel}
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                  <div className="px-4 pb-4 flex flex-wrap gap-2">
                    <CopyRichBtn html={imageBlockHtml} plainText={`Veteran Care — Free resources for veterans: ${primaryUrl}`} label={`image-email-${aud}`}>
                      Copy Image Card for Email
                    </CopyRichBtn>
                    <CopyBtn text={imageBlockHtml} label={`image-html-${aud}`} size="xs">Copy HTML Code</CopyBtn>
                  </div>
                </div>

                {(() => {
                  const video = getCampaignVideo(aud);
                  if (!video) return null;
                  const thumb = getThumbnail(video);
                  // For email: use the pre-flattened poster with play button BAKED IN.
                  // Email clients can't break a single image, so the play button always
                  // appears centered on the thumbnail, identical across Gmail / Outlook /
                  // Apple Mail / iOS Mail / Android Gmail.
                  const emailThumb = thumb && thumb.includes("veterans-phase-1-poster")
                    ? thumb.replace("veterans-phase-1-poster.jpg", "veterans-phase-1-poster-play.jpg")
                    : thumb;
                  const absoluteEmailThumb = emailThumb && emailThumb.startsWith("/")
                    ? `${window.location.origin}${emailThumb}`
                    : emailThumb;
                  const smsBody = `${video.caption} Watch & get connected: ${textUrl}`;
                  const videoEmailHtml = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;border-collapse:collapse;font-family:Arial,sans-serif;"><tr><td align="center" style="padding:0;"><a href="${primaryUrl}" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;color:inherit;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e5e7eb;border-radius:12px;border-collapse:separate;overflow:hidden;background:#ffffff;"><tr><td align="center" style="background:#000000;padding:0;line-height:0;font-size:0;"><img src="${absoluteEmailThumb}" alt="${video.title}" width="480" style="display:block;width:100%;max-width:480px;height:auto;border:0;outline:none;text-decoration:none;" /></td></tr><tr><td align="center" style="padding:16px 18px 6px;background:#ffffff;"><p style="margin:0;font-size:15px;font-weight:bold;color:#111827;line-height:1.3;font-family:Arial,sans-serif;text-align:center;">${video.title}</p></td></tr><tr><td align="center" style="padding:6px 18px 14px;background:#ffffff;"><p style="margin:0;font-size:13px;color:#4b5563;line-height:1.45;font-family:Arial,sans-serif;text-align:center;">${video.caption}</p></td></tr><tr><td align="center" style="padding:0 18px 18px;background:#ffffff;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;"><tr><td align="center" style="background:#166534;border-radius:8px;"><a href="${primaryUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background:#166534;color:#ffffff;font-weight:bold;font-size:14px;font-family:Arial,sans-serif;text-decoration:none;border-radius:8px;">&#9654;&nbsp; Watch the Video</a></td></tr></table></td></tr></table></a></td></tr></table>`;
                  return (
                    <div className="border rounded-lg bg-white overflow-hidden" data-testid={`kit-video-${aud}`}>
                      <div className="px-4 py-3 border-b bg-gray-50/60 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center shrink-0">
                          <Video className="w-3.5 h-3.5 text-green-700" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800">Video Preview Card</span>
                        <span className="text-xs text-gray-400 ml-auto hidden sm:inline">Clickable thumbnail — opens video on landing page via your tracked link</span>
                      </div>
                      <div className="p-5 flex items-center justify-center">
                        <a
                          href={primaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative block w-full max-w-sm rounded-xl overflow-hidden border border-gray-200 bg-black group"
                          data-testid={`video-thumb-${aud}`}
                        >
                          {thumb ? (
                            <img src={thumb} alt={video.title} className="block w-full h-auto opacity-90 group-hover:opacity-100 transition-opacity" />
                          ) : (
                            <div className="w-full aspect-video bg-gray-900 flex items-center justify-center text-gray-500 text-xs">No thumbnail</div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-16 h-16 rounded-full bg-green-700/95 flex items-center justify-center shadow-lg">
                              <Play className="w-7 h-7 text-white ml-1" fill="white" />
                            </div>
                          </div>
                          <div className="px-4 py-3 bg-white">
                            <p className="text-sm font-bold text-gray-900 leading-tight">{video.title}</p>
                            <p className="text-xs text-gray-600 mt-1 leading-snug">{video.caption}</p>
                          </div>
                        </a>
                      </div>
                      <div className="px-4 pb-4 flex flex-wrap gap-2">
                        <CopyRichBtn html={videoEmailHtml} plainText={`${video.title} — ${video.caption} ${primaryUrl}`} label={`video-email-${aud}`}>
                          Copy Email Version
                        </CopyRichBtn>
                        <CopyBtn text={smsBody} label={`video-sms-${aud}`} size="xs">Copy SMS Link</CopyBtn>
                        <CopyBtn text={primaryUrl} label={`video-link-${aud}`} size="xs">Copy Tracked Link</CopyBtn>
                        {thumb && (
                          <a
                            href={thumb}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid={`download-video-thumb-${aud}`}
                            className="inline-flex items-center gap-1 h-7 px-3 text-xs rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                          >
                            <Download className="w-3.5 h-3.5" /> Download Thumbnail
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {emailBodyHtml && (
                  <div className="border rounded-lg bg-white overflow-hidden" data-testid={`kit-email-${aud}`}>
                    <div className="px-4 py-3 border-b bg-gray-50/60 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center shrink-0">
                        <Mail className="w-3.5 h-3.5 text-green-700" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800">Ready-to-Send Email</span>
                      <span className="text-xs text-gray-400 ml-auto hidden sm:inline">Paste into Gmail / Outlook — renders formatted</span>
                    </div>
                    <div className="p-4">
                      {campaign.templates.email.subject && (
                        <div className="text-xs text-gray-500 mb-2">
                          <span className="font-semibold">Subject:</span> {campaign.templates.email.subject}
                        </div>
                      )}
                      <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                        {campaign.templates.email.body}
                      </div>
                    </div>
                    <div className="px-4 pb-4 flex flex-wrap gap-2">
                      <CopyRichBtn html={emailBodyHtml} plainText={emailPlainText} label={`email-rich-${aud}`}>
                        Copy Email Version
                      </CopyRichBtn>
                      <CopyBtn text={emailPlainText} label={`email-plain-${aud}`} size="xs">Copy Plain Text</CopyBtn>
                      {campaign.templates.email.subject && (
                        <CopyBtn text={campaign.templates.email.subject} label={`email-subject-${aud}`} size="xs">Copy Subject</CopyBtn>
                      )}
                    </div>
                  </div>
                )}

                <div className="border rounded-lg bg-white overflow-hidden" data-testid={`kit-text-${aud}`}>
                  <div className="px-4 py-3 border-b bg-gray-50/60 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center shrink-0">
                      <Link2 className="w-3.5 h-3.5 text-green-700" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Text / SMS Link</span>
                  </div>
                  <div className="p-4 flex items-center justify-center">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 inline-block">
                      <code className="text-sm text-blue-700 font-mono break-all" data-testid={`text-link-${aud}`}>{textUrl}</code>
                    </div>
                  </div>
                  <div className="px-4 pb-4 flex flex-wrap gap-2">
                    <CopyBtn text={textUrl} label={`link-${aud}`}>Copy Link</CopyBtn>
                    {campaign.templates?.text && (
                      <CopyBtn text={campaign.templates.text.body} label={`sms-msg-${aud}`} size="xs">Copy SMS Message</CopyBtn>
                    )}
                  </div>
                </div>

                {campaign.links?.filter((l: any) => l.channel === "qr").map((link: any) => (
                  <div key={link.utm_id} className="border rounded-lg bg-white overflow-hidden" data-testid={`kit-qr-${aud}`}>
                    <div className="px-4 py-3 border-b bg-gray-50/60 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-green-100 flex items-center justify-center shrink-0">
                        <QrCode className="w-3.5 h-3.5 text-green-700" />
                      </div>
                      <span className="text-sm font-semibold text-gray-800">QR Code</span>
                    </div>
                    <div className="p-4 flex justify-center">
                      <img src={link.qr_url} alt={`QR Code - ${aud}`} className="w-36 h-36 border rounded-lg shadow-sm" />
                    </div>
                    <div className="px-4 pb-4 flex flex-wrap gap-2">
                      <a
                        href={link.qr_url}
                        download={`veteran-care-qr-${aud}.png`}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-green-700 hover:bg-green-800 px-4 py-2 rounded-md h-9"
                        data-testid={`kit-download-qr-${aud}`}
                      >
                        <Download className="w-4 h-4" /> Download PNG
                      </a>
                      <CopyRichBtn html={`<img src="${link.qr_url}" alt="Veteran Care QR Code" style="width:200px;height:200px;" />`} plainText={link.qr_url} label={`qr-email-${aud}`} variant="outline">
                        Copy QR for Email
                      </CopyRichBtn>
                    </div>
                  </div>
                ))}
              </TabsContent>
            );
          })}
        </Tabs>

        <div className="mt-6 pt-4 border-t border-green-200">
          <Button
            data-testid="button-download-full-kit"
            onClick={onDownloadKit}
            className="w-full bg-green-700 hover:bg-green-800 text-white h-12 text-base font-semibold gap-2 shadow-md"
          >
            <Download className="w-5 h-5" />
            Download Full Ambassador Kit
          </Button>
          <p className="text-xs text-center text-gray-500 mt-2">
            All 4 audiences, all assets, all templates — one file
          </p>
        </div>
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
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const urlCode = params.get("code");
  const isAdminPreview = params.get("preview") === "1" && !!urlCode;
  const [code, setCode] = useState("");
  const [activeCode, setActiveCode] = useState<string | null>(isAdminPreview ? urlCode : null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const { data: lookupData } = useQuery({
    queryKey: ["/api/ambassador/lookup", urlCode],
    queryFn: async () => {
      const res = await fetch(`/api/ambassador/lookup/${urlCode}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!urlCode && !isAdminPreview,
    retry: false,
  });

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
    setLoginError(null);
    const sanitized = code.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (sanitized) {
      if (urlCode && sanitized !== urlCode) {
        setLoginError("That code doesn't match. Please try again.");
        return;
      }
      setActiveCode(sanitized);
    }
  };

  const downloadFullKit = () => {
    if (!data) return;
    const sections: string[] = [];
    const baseUrl = "https://veterancare.com";
    sections.push(`VETERAN CARE — AMBASSADOR KIT`);
    sections.push(`${"=".repeat(50)}`);
    sections.push(`Ambassador: ${data.ambassador.first_name || data.ambassador.name}`);
    sections.push(`Code: ${data.ambassador.code}`);
    sections.push(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
    sections.push(``);

    const campaignOrder = ["veteran", "case_manager", "partner", "general", "homepage"];
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
      sections.push(`<a href="${primaryUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;"><img src="${LOGO_URL}" alt="Veteran Care" style="display:block;max-width:200px;height:auto;border:0;" /></a>`);

      sections.push(`\nCTA Button (HTML):`);
      sections.push(`<a href="${primaryUrl}" style="background:#166534;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-family:Arial,sans-serif;font-size:16px;text-align:center;">${ctaLabel}</a>`);

      sections.push(`\nImage Card Embed (HTML):`);
      sections.push(`<a href="${primaryUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;"><div style="max-width:400px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;font-family:Arial,sans-serif;"><div style="background:#ffffff;padding:24px 20px;text-align:center;border-bottom:1px solid #e5e7eb;"><img src="${LOGO_URL}" alt="Veteran Care" style="display:block;max-width:180px;height:auto;margin:0 auto;border:0;" /></div><div style="padding:16px 20px;background:#ffffff;"><p style="margin:0 0 12px;font-size:15px;color:#1f2937;line-height:1.4;">Free resources for U.S. military veterans, their families &amp; dependents — housing, employment, benefits, mental health &amp; more.</p><div style="background:#166534;color:#ffffff;padding:12px 24px;border-radius:8px;text-align:center;font-weight:bold;font-size:15px;">${ctaLabel}</div></div></div></a>`);

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
    const ambassadorName = lookupData?.name || null;
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <img src={LOGO_URL} alt="Veteran Care" className="h-16 w-auto mx-auto mb-3" />
          </div>
          <Card className="shadow-lg border-green-200">
            <CardHeader className="text-center pb-3">
              {ambassadorName ? (
                <>
                  <p className="text-sm text-gray-500 mb-1">Welcome</p>
                  <CardTitle className="text-2xl text-green-900">{ambassadorName}</CardTitle>
                  <p className="text-gray-500 text-sm mt-2">Enter your ambassador code to access your marketing kit</p>
                </>
              ) : (
                <>
                  <CardTitle className="text-2xl text-green-900">Ambassador Portal</CardTitle>
                  <p className="text-gray-500 text-sm mt-1">Enter your ambassador code to access your marketing kit</p>
                </>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  data-testid="input-ambassador-code"
                  placeholder={urlCode ? "Enter your code to continue" : "e.g. colin_slaven"}
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setLoginError(null); }}
                  className="text-center text-lg h-12"
                />
                {loginError && (
                  <p className="text-sm text-red-600 text-center" data-testid="text-login-error">{loginError}</p>
                )}
                <Button
                  data-testid="button-login"
                  type="submit"
                  className="w-full bg-green-700 hover:bg-green-800 h-12 text-base font-semibold"
                  disabled={!code.trim()}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Access My Kit
                </Button>
              </form>
              <p className="text-xs text-center text-gray-400 mt-4">
                Your code was provided when you joined the Ambassador program.
              </p>
            </CardContent>
          </Card>
        </div>
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
  const amb = data.ambassador;
  const regionDisplay = [amb.region_value, amb.region_type ? `(${amb.region_type})` : ""].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="bg-green-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={LOGO_URL} alt="Veteran Care" className="h-10 w-auto hidden sm:block" style={{ filter: "brightness(0) invert(1)" }} />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate" data-testid="text-welcome">
                Welcome, {amb.first_name || amb.name}
              </h1>
              <p className="text-green-200 text-xs sm:text-sm">Your Ambassador Marketing Kit</p>
            </div>
          </div>
          {isAdminPreview ? (
            <Button
              data-testid="button-close-preview"
              variant="ghost"
              size="sm"
              onClick={() => { try { window.close(); } catch {} setTimeout(() => { window.history.back(); }, 100); }}
              className="text-green-200 hover:text-white hover:bg-green-700 shrink-0"
            >
              Close Preview
            </Button>
          ) : (
            <Button
              data-testid="button-logout"
              variant="ghost"
              size="sm"
              onClick={() => { setActiveCode(null); setCode(""); }}
              className="text-green-200 hover:text-white hover:bg-green-700 shrink-0"
            >
              <LogOut className="w-4 h-4 mr-1" /> Log Out
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">

        <Card className="border-green-200" data-testid="card-ambassador-info">
          <CardContent className="pt-5 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-xs text-gray-500 block mb-0.5">Name</span>
                <p className="font-medium text-gray-900">{amb.name || [amb.first_name, amb.last_name].filter(Boolean).join(" ")}</p>
              </div>
              {amb.email && (
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">Email</span>
                  <p className="flex items-center gap-1 text-gray-700"><Mail className="h-3 w-3 text-gray-400" /> {amb.email}</p>
                </div>
              )}
              {regionDisplay && (
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">Region</span>
                  <p className="flex items-center gap-1 text-gray-700"><MapPin className="h-3 w-3 text-gray-400" /> {regionDisplay}</p>
                </div>
              )}
              {amb.commission_rate != null && (
                <div>
                  <span className="text-xs text-gray-500 block mb-0.5">Commission</span>
                  <p className="flex items-center gap-1 font-medium text-green-700"><Percent className="h-3 w-3" /> {amb.commission_rate}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <AmbassadorKitSection campaigns={data.campaigns} onDownloadKit={downloadFullKit} />

        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
          <p className="text-sm font-semibold text-green-900 mb-2">How to use your kit:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-green-800">
            <p>1. Choose an audience tab above (Veteran, Case Manager, etc.)</p>
            <p>2. Find the asset you need (logo, button, email, etc.)</p>
            <p>3. Click the green <strong>"Copy for Email"</strong> button</p>
            <p>4. Paste directly into Gmail, Outlook, or any email</p>
          </div>
          <p className="text-xs text-green-600 mt-2">Your personal tracking link is built into every asset — no editing needed.</p>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2" data-testid="text-templates-header">
            <Mail className="w-5 h-5" />
            Message Templates & Links
          </h2>
          <p className="text-sm text-muted-foreground">Expand any campaign below to see ready-to-send templates for each channel</p>
        </div>

        {campaignOrder.map((key) =>
          data.campaigns[key] ? (
            <CampaignSection key={key} campaignKey={key} data={data.campaigns[key]} />
          ) : null
        )}

        <div className="text-center py-4 text-xs text-gray-400">
          Veteran Care Ambassador Program &middot; veterancare.com
        </div>
      </div>
    </div>
  );
}
