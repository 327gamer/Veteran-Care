import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  Heart,
  Share2,
  Mail,
  Globe,
  ChevronLeft,
  ShieldCheck,
  Star,
  Handshake,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useSavedResources } from "@/lib/store";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

export interface TrustedServiceItem {
  id: string;
  category_id: string;
  name: string;
  short_description: string;
  website_url: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  verification_status: string;
  verification_label: string;
  cta_text: string;
  cta_url: string;
  is_featured: boolean;
  is_national: boolean;
  trusted_service_categories: { slug: string; name: string };
}

interface TrustedServiceDetailProps {
  service: TrustedServiceItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect?: (service: TrustedServiceItem) => void;
}

export default function TrustedServiceDetail({ service, open, onOpenChange, onConnect }: TrustedServiceDetailProps) {
  const { toggleSaveTrustedService, isTrustedServiceSaved } = useSavedResources();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [open, service?.id]);

  useEffect(() => {
    const main = document.querySelector("main");
    if (open) {
      if (main) main.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      if (main) main.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      if (main) main.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !service) return null;

  const saved = isTrustedServiceSaved(service.id);
  const categoryName = service.trusted_service_categories?.name || "";
  const location = [service.city, service.state].filter(Boolean).join(", ");

  const handleSaveClick = () => {
    toggleSaveTrustedService(service.id);
    toast({
      description: saved ? "Removed from My Saved" : "Saved to My Saved",
      duration: 2000,
    });
    trackEvent("trusted_service_save", { service_id: service.id, service_name: service.name, action: saved ? "unsave" : "save" });
  };

  const handleShare = async () => {
    const shareData = {
      title: service.name,
      text: `Check out ${service.name} on Veteran Care`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ description: "Link copied to clipboard", duration: 2000 });
      }
    } catch {}
  };

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 z-[35] bg-background overflow-hidden animate-in slide-in-from-right-8 duration-300" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div ref={scrollRef} className="h-full overflow-y-auto pb-24 lg:pb-8">
        <div className="sticky top-0 z-10 bg-primary text-white px-4 py-3">
          <button
            data-testid="button-back-trusted-service"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to results
          </button>

          <div className="flex items-center gap-2 flex-wrap mb-1">
            {categoryName && (
              <Badge className="text-[10px] bg-white/20 text-white border-white/30">
                {categoryName}
              </Badge>
            )}
            {service.verification_label && (
              <Badge className="text-[10px] bg-green-500/30 text-white border-green-300/40">
                <ShieldCheck className="h-3 w-3 mr-0.5" />
                {service.verification_label}
              </Badge>
            )}
            {service.is_featured && (
              <Badge className="text-[10px] bg-amber-500/30 text-white border-amber-300/40">
                <Star className="h-3 w-3 mr-0.5 fill-amber-300" />
                Featured
              </Badge>
            )}
            {service.is_national && (
              <Badge className="text-[10px] bg-blue-500/30 text-white border-blue-300/40">
                <Globe className="h-3 w-3 mr-0.5" />
                Nationwide
              </Badge>
            )}
          </div>

          <h1 className="text-xl font-heading font-bold leading-tight" data-testid="text-trusted-service-title">
            {service.name}
          </h1>
          {location && (
            <p className="text-white/70 text-xs flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {location}
            </p>
          )}
        </div>

        <div className="px-4 py-4 space-y-4">
          {service.short_description && (
            <section data-testid="section-overview">
              <h3 className="font-bold text-base flex items-center gap-2 text-primary mb-2">
                <ShieldCheck className="h-4 w-4" />
                About This Provider
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {service.short_description}
              </p>
            </section>
          )}

          {(service.phone || service.email || service.website_url) && (
            <section data-testid="section-contact" className="space-y-2">
              <h3 className="font-bold text-base flex items-center gap-2 text-primary">
                <Phone className="h-4 w-4" />
                Contact Information
              </h3>
              {service.phone && (
                <a href={`tel:${service.phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline" data-testid="link-phone">
                  <Phone className="h-3.5 w-3.5" />
                  {service.phone}
                </a>
              )}
              {service.email && (
                <a href={`mailto:${service.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline" data-testid="link-email">
                  <Mail className="h-3.5 w-3.5" />
                  {service.email}
                </a>
              )}
              {service.website_url && (
                <a href={service.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline" data-testid="link-website">
                  <Globe className="h-3.5 w-3.5" />
                  Visit Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </section>
          )}

          {location && !service.is_national && (
            <section data-testid="section-location" className="bg-muted/30 rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">Located in {location}</span>
              </div>
            </section>
          )}

          <section data-testid="section-actions" className="space-y-3">
            <h3 className="font-bold text-base flex items-center gap-2 text-primary">
              Actions
            </h3>

            {onConnect && (
              <Button
                data-testid="button-connect-provider"
                className="w-full h-12 text-sm"
                onClick={() => {
                  trackEvent("trusted_service_connect_click", { service_id: service.id, service_name: service.name });
                  onConnect(service);
                }}
              >
                <Handshake className="h-4 w-4 mr-2" />
                Connect With This Provider
              </Button>
            )}

            {service.phone && (
              <Button
                data-testid="button-call-provider"
                variant="outline"
                className="w-full h-11 text-sm bg-green-50 border-green-200 text-green-800 hover:bg-green-100"
                onClick={() => {
                  trackEvent("trusted_service_call", { service_id: service.id });
                  window.open(`tel:${service.phone}`);
                }}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call {service.phone}
              </Button>
            )}

            {(service.cta_url || service.website_url) && (
              <Button
                data-testid="button-visit-website"
                variant="outline"
                className="w-full h-11 text-sm"
                onClick={() => {
                  trackEvent("trusted_service_website_click", { service_id: service.id, service_name: service.name });
                  window.open(service.cta_url || service.website_url, "_blank");
                }}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {service.cta_text || "Visit Website"}
              </Button>
            )}

            {service.email && (
              <Button
                data-testid="button-email-provider"
                variant="outline"
                className="w-full h-11 text-sm"
                onClick={() => {
                  trackEvent("trusted_service_email", { service_id: service.id });
                  window.open(`mailto:${service.email}`);
                }}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email Provider
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                data-testid="button-save-trusted-service"
                variant="outline"
                className={`h-10 text-xs ${saved ? "border-destructive text-destructive" : ""}`}
                onClick={handleSaveClick}
              >
                <Heart className={`h-4 w-4 mr-1.5 ${saved ? "fill-current" : ""}`} />
                {saved ? "Saved" : "Save"}
              </Button>
              <Button
                data-testid="button-share-trusted-service"
                variant="outline"
                className="h-10 text-xs"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-1.5" />
                Share
              </Button>
            </div>
          </section>

          <section data-testid="section-help" className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-primary">How can I help you today?</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  I'm your Veteran Guide — an AI-powered assistant that helps veterans find resources, get guidance, and navigate support services.
                </p>
              </div>
              <Button
                data-testid="button-ask-guide-ts"
                size="sm"
                className="h-8 text-xs bg-primary hover:bg-primary/90 text-white shrink-0"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("open-ai-guide"));
                }}
              >
                Veteran Guide
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
