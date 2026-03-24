
import { platform, t } from "@shared/platform";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  CheckCircle2, 
  FileText, 
  Phone,
  Bot,
  Heart,
  Share2,
  Flag,
  Navigation,
  Mail,
  Shield,
  ArrowRight,
  Sparkles,
  Globe,
  Check,
  ChevronLeft,
} from "lucide-react";
import { ResourceItem } from "@/lib/resources-data";
import { useSavedResources } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import NavigatorModal, { type NavigatorContext } from "./navigator-modal";
import { trackEventDedup } from "@/lib/analytics";

interface ResourceDetailProps {
  resource: ResourceItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function trackClick(
  resource_id: string,
  click_type: string,
  fallback: { state?: string; city?: string; zip?: string } = {}
) {
  const loc = useSavedResources.getState().userLocation;
  const user_state = loc.stateCode || fallback.state || null;
  const user_city = loc.city || fallback.city || null;
  const user_zip = loc.zip || fallback.zip || null;
  fetch("/api/track-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resource_id, click_type, user_state, user_city, user_zip }),
  }).catch(() => {});
}

export default function ResourceDetail({ resource, open, onOpenChange }: ResourceDetailProps) {
  const { isSaved, toggleSave, userLocation } = useSavedResources();
  const [linkCopied, setLinkCopied] = useState(false);
  const [navModalOpen, setNavModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNavModalOpen(false);
  }, [resource?.id]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo(0, 0);
      });
      if (resource) {
        trackEventDedup("resource_click", resource.id, {
          resource_id: resource.id,
          category: resource.category_slug || "",
          subcategory: resource.subcategory_slug || "",
          city: resource.city || "",
          state: resource.state || "",
        });
      }
      return () => { document.body.style.overflow = ""; };
    }
  }, [open, resource?.id]);

  if (!resource || !open) return null;

  const locationLabel = [userLocation.city, userLocation.stateCode].filter(Boolean).join(", ") || "your area";

  const fb = {
    state: resource.state || undefined,
    city: resource.city || undefined,
    zip: resource.zip || undefined,
  };

  const evParams = {
    resource_id: resource.id,
    category: resource.category_slug || "",
    subcategory: resource.subcategory_slug || "",
    city: resource.city || "",
    state: resource.state || "",
  };

  const handleWebsiteClick = () => {
    const url = resource.affiliate_url || resource.website_url;
    if (!url) return;
    trackClick(resource.id, "website_click", fb);
    trackEventDedup("resource_contact_click", `${resource.id}:website`, { ...evParams, contact_type: "website" });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCallClick = () => {
    if (!resource.phone) return;
    trackClick(resource.id, "call_click", fb);
    trackEventDedup("resource_contact_click", `${resource.id}:call`, { ...evParams, contact_type: "call" });
    window.location.href = `tel:${resource.phone}`;
  };

  const handleDirectionsClick = () => {
    trackClick(resource.id, "directions_click", fb);
    trackEventDedup("resource_contact_click", `${resource.id}:directions`, { ...evParams, contact_type: "directions" });
    const q = resource.address || [resource.city, resource.state].filter(Boolean).join(", ");
    if (q) {
      window.open(`https://maps.google.com/maps?q=${encodeURIComponent(q)}`, "_blank");
    }
  };

  const handleGuideClick = () => {
    trackClick(resource.id, "guide_click", fb);
    onOpenChange(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-ai-guide"));
    }, 150);
  };

  const handleSaveClick = () => {
    trackClick(resource.id, "save_click", fb);
    const wasSaved = isSaved(resource.id);
    toggleSave(resource.id);
    toast({
      description: wasSaved ? "Removed from My Saved Resources" : "Saved to My Saved Resources",
      duration: 2000,
    });
  };

  const handleShareClick = async () => {
    trackClick(resource.id, "share_click", fb);
    const shareUrl = `${window.location.origin}/resources?id=${resource.id}`;
    const shareData = { title: resource.title, text: resource.description, url: shareUrl };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast({ description: "Link copied to clipboard", duration: 2000 });
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleReportClick = () => {
    trackClick(resource.id, "report_click", fb);
    fetch("/api/report-resource", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource_id: resource.id, reason: "incorrect_info" }),
    }).catch(() => {});
    toast({ description: "Thank you for reporting. We'll review this resource.", duration: 3000 });
  };

  const handleApplyClick = () => {
    trackClick(resource.id, "apply_click", fb);
    trackEventDedup("resource_contact_click", `${resource.id}:apply`, { ...evParams, contact_type: "apply" });
    const url = resource.affiliate_url || resource.website_url;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const hasContactInfo = resource.phone || resource.email || resource.website_url || resource.address;
  const hasAddress = resource.address || (resource.city && resource.state);

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col" data-testid="resource-detail-page">
      <div className="bg-primary px-4 sm:px-6 py-4 text-primary-foreground relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <FileText className="h-24 w-24" />
        </div>
        
        <div className="relative z-10 max-w-3xl lg:max-w-4xl mx-auto">
          <button
            data-testid="button-back-resource-detail"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-1.5 text-primary-foreground/80 hover:text-primary-foreground text-sm font-medium mb-3 -ml-0.5 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            Back to results
          </button>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="outline" className="text-[10px] h-5 border-primary-foreground/30 text-primary-foreground/90 bg-primary-foreground/10">
              {resource.category}
            </Badge>
            {resource.isLocal && (
              <Badge className="text-[10px] h-5 bg-accent text-accent-foreground hover:bg-accent/90 border-none">
                <MapPin className="h-3 w-3 mr-1" /> {resource.state || "Local"}
              </Badge>
            )}
            {resource.sponsored && (
              <Badge data-testid="badge-sponsored" className="text-[10px] h-5 bg-amber-500 text-white border-none">
                <Sparkles className="h-3 w-3 mr-1" /> Sponsored
              </Badge>
            )}
          </div>
          
          <h1 className="text-2xl font-heading font-bold text-white mb-1 leading-tight">
            {resource.title}
          </h1>
          
          <div className="flex items-center gap-2 text-primary-foreground/80 text-xs">
            <span>Source: {resource.source}</span>
            <span>·</span>
            <span className="capitalize">{resource.type}</span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-3xl lg:max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-5 pb-24 lg:pb-8">

          <section data-testid="section-overview" className="space-y-2">
            <h3 className="font-bold text-base flex items-center gap-2 text-primary">
              <div className="h-1.5 w-1.5 rounded-full bg-accent" />
              Overview
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {resource.description}
            </p>
          </section>

          {resource.eligibility && (
            <section data-testid="section-eligibility" className="space-y-2">
              <h3 className="font-bold text-base flex items-center gap-2 text-primary">
                <Shield className="h-4 w-4" />
                Eligibility
              </h3>
              <div className="bg-muted/30 rounded-lg p-3 border">
                <p className="text-sm text-muted-foreground leading-relaxed">{resource.eligibility}</p>
              </div>
            </section>
          )}

          {hasContactInfo && (
            <section data-testid="section-contact" className="space-y-2">
              <h3 className="font-bold text-base flex items-center gap-2 text-primary">
                <Phone className="h-4 w-4" />
                Contact Information
              </h3>
              <div className="bg-muted/30 rounded-lg p-3 border space-y-2">
                {resource.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <a href={`tel:${resource.phone}`} className="text-primary hover:underline">{resource.phone}</a>
                  </div>
                )}
                {resource.email && (
                  <div className="flex items-center gap-2 text-sm min-w-0">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <a href={`mailto:${resource.email}`} className="text-primary hover:underline truncate">{resource.email}</a>
                  </div>
                )}
                {resource.website_url && (
                  <div className="flex items-center gap-2 text-sm min-w-0">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <a href={resource.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{resource.website_url.replace(/^https?:\/\//, '')}</a>
                  </div>
                )}
                {hasAddress && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">
                      {[resource.address, resource.city, resource.state, resource.zip].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}

          <section data-testid="section-preparation" className="bg-muted/30 rounded-lg p-3 border border-border">
            <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Before you start
            </h3>
            <ul className="space-y-2">
              {[
                "Gather your DD214 (Member 4 Copy)",
                "Have medical records ready",
                "Verify your current mailing address",
                "Prepare bank routing information"
              ].map((item, i) => (
                <li key={i} className="flex gap-2 text-xs">
                  <div className="h-4 w-4 rounded-full border border-muted-foreground/30 flex items-center justify-center shrink-0">
                    <span className="text-[9px] text-muted-foreground">{i + 1}</span>
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section data-testid="section-local-assistance" className="space-y-2">
            <h3 className="font-bold text-base flex items-center gap-2 text-primary">
              <MapPin className="h-4 w-4" />
              Local Assistance
            </h3>
            {resource.isLocal ? (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="font-medium text-sm text-primary">
                  This is a {resource.state} resource.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {resource.address
                    ? `Located at ${[resource.address, resource.city].filter(Boolean).join(", ")}.`
                    : `Contact this organization for help in ${locationLabel}.`}
                </p>
                {hasAddress && (
                  <Button
                    data-testid="button-directions-local"
                    size="sm"
                    variant="outline"
                    className="mt-2 w-full h-8 text-xs border-primary/20 text-primary"
                    onClick={handleDirectionsClick}
                  >
                    <Navigation className="h-3 w-3 mr-2" /> Get Directions
                  </Button>
                )}
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs">
                  National program. Local VSOs in <strong>{locationLabel}</strong> can help you apply for free.
                </p>
                <Button size="sm" variant="link" className="px-0 text-primary h-auto mt-1 text-xs">
                  Find a VSO near {locationLabel} →
                </Button>
              </div>
            )}
          </section>

          <section data-testid="section-navigator" className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-primary">Need personal help?</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(platform.navigatorApplyDescription)}
                </p>
              </div>
              <Button
                data-testid="button-request-navigator"
                size="sm"
                className="h-8 text-xs bg-primary shrink-0"
                onClick={() => {
                  setNavModalOpen(true);
                  trackClick(resource.id, "navigator_click", fb);
                }}
              >
                Request Help
              </Button>
            </div>
          </section>

          <NavigatorModal
            open={navModalOpen}
            onOpenChange={setNavModalOpen}
            context={{
              resource_id: resource.id,
              resource_title: resource.title,
              category: resource.category || null,
              subcategory: null,
            }}
          />

          <section data-testid="section-help" className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate">Need help with this?</h4>
              <p className="text-xs text-muted-foreground truncate">
                {t(platform.ai.askPrompt)}
              </p>
            </div>
            <Button
              data-testid="button-ask-guide"
              size="sm"
              className="h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 gap-1.5"
              onClick={handleGuideClick}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Get Help
            </Button>
          </section>

          <section data-testid="section-actions" className="space-y-3">
            <h3 className="font-bold text-base flex items-center gap-2 text-primary">
              <ArrowRight className="h-4 w-4" />
              Actions
            </h3>

            <div className="grid grid-cols-1 gap-2">
              {resource.phone && (
                <Button
                  data-testid="button-call"
                  className="w-full h-11 bg-green-600 hover:bg-green-700 text-white gap-2 overflow-hidden"
                  onClick={handleCallClick}
                >
                  <Phone className="h-4 w-4 shrink-0" /> <span className="truncate">Call {resource.phone}</span>
                </Button>
              )}

              {hasAddress && (
                <Button
                  data-testid="button-directions"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  onClick={handleDirectionsClick}
                >
                  <Navigation className="h-4 w-4" /> Get Directions
                </Button>
              )}

              {(resource.website_url || resource.affiliate_url) && (
                <Button
                  data-testid="button-apply"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white gap-2"
                  onClick={handleApplyClick}
                >
                  <ArrowRight className="h-4 w-4" /> Apply / Get Help
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {resource.website_url && (
                <Button
                  data-testid="button-website"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={handleWebsiteClick}
                >
                  <Globe className="h-3.5 w-3.5" /> Official Website
                </Button>
              )}

              <Button
                data-testid="button-save-detail"
                variant="outline"
                size="sm"
                className={`h-8 text-xs gap-1.5 ${isSaved(resource.id) ? "border-destructive text-destructive" : ""}`}
                onClick={handleSaveClick}
              >
                <Heart className={`h-3.5 w-3.5 ${isSaved(resource.id) ? "fill-destructive" : ""}`} />
                {isSaved(resource.id) ? "Saved" : "Save"}
              </Button>

              <Button
                data-testid="button-share"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={handleShareClick}
              >
                {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                Share
              </Button>

              <Button
                data-testid="button-report"
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5 text-muted-foreground"
                onClick={handleReportClick}
              >
                <Flag className="h-3.5 w-3.5" /> Report
              </Button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
