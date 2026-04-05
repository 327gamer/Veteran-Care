import { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Globe, Percent } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export type SponsoredType = "top" | "inline" | "local";

export type GeoScope = "national" | "state" | "city" | "radius";

export interface SponsoredAd {
  id: string;
  is_sponsored: boolean;
  sponsored_type: SponsoredType;
  sponsored_rank: number;
  category_slug?: string | null;
  business_name: string;
  short_description: string;
  cta_text: string;
  cta_url: string;
  discount_value?: string | null;
  city?: string | null;
  state?: string | null;
  is_national?: boolean;
  geo_scope: GeoScope;
  image_url?: string | null;
}

interface AdSlotProps {
  ad: SponsoredAd;
  placement: SponsoredType;
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function AdSlot({ ad, placement }: AdSlotProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const impressionSent = useRef(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || impressionSent.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !impressionSent.current) {
          impressionSent.current = true;
          trackEvent("ad_impression", {
            ad_id: ad.id,
            placement,
            business_name: ad.business_name,
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ad.id, placement, ad.business_name]);

  const handleClick = () => {
    trackEvent("ad_click", {
      ad_id: ad.id,
      placement,
      business_name: ad.business_name,
    });
    if (ad.cta_url && isSafeUrl(ad.cta_url)) {
      window.open(ad.cta_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card
      ref={cardRef}
      className={`overflow-hidden transition-shadow shadow-sm hover:shadow-md border-blue-100/60 bg-gradient-to-r from-blue-50/30 to-white ${placement === "top" ? "ring-1 ring-blue-100/50" : ""}`}
      data-testid={`ad-slot-${placement}-${ad.id}`}
      data-ad-id={ad.id}
      data-ad-type={placement}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-bold text-sm" data-testid={`ad-name-${ad.id}`}>
                {ad.business_name}
              </h3>
              <Badge className="text-[9px] px-1.5 py-0 bg-blue-50 text-blue-500 border-blue-200 font-normal">
                Sponsored
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
              {ad.is_national ? (
                <><Globe className="h-3 w-3" /><span>Nationwide</span></>
              ) : ad.city && ad.state ? (
                <><MapPin className="h-3 w-3" /><span>{ad.city}, {ad.state}</span></>
              ) : ad.state ? (
                <><MapPin className="h-3 w-3" /><span>{ad.state}</span></>
              ) : null}
            </div>
          </div>
        </div>

        {ad.discount_value && (
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 border-green-200">
              <Percent className="h-3 w-3 mr-0.5" />
              {ad.discount_value}
            </Badge>
          </div>
        )}

        {ad.short_description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{ad.short_description}</p>
        )}

        <Button
          size="sm"
          className="w-full text-xs h-8"
          onClick={handleClick}
          data-testid={`ad-cta-${ad.id}`}
        >
          {ad.cta_text || "Learn More"}
          <ExternalLink className="h-3 w-3 ml-1.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function AdSlotPlaceholder({ placement }: { placement: SponsoredType }) {
  return (
    <div
      className="hidden"
      data-testid={`ad-placeholder-${placement}`}
      data-ad-slot={placement}
      data-ad-ready="false"
    />
  );
}

export function resolveAds(
  ads: SponsoredAd[],
  placement: SponsoredType,
  geo?: { lat?: number; lng?: number; state?: string; city?: string },
  categorySlug?: string | null
): SponsoredAd[] {
  let filtered = ads.filter(a => a.is_sponsored && a.sponsored_type === placement);

  if (categorySlug) {
    const catAds = filtered.filter(a => a.category_slug === categorySlug);
    const generalAds = filtered.filter(a => !a.category_slug);
    filtered = catAds.length > 0 ? [...catAds, ...generalAds] : generalAds;
  }

  if (geo?.state) {
    const localAds = filtered.filter(
      a => a.geo_scope === "city" || a.geo_scope === "state" || a.geo_scope === "radius"
    ).filter(a => {
      if (a.state && geo.state) return a.state.toUpperCase() === geo.state.toUpperCase();
      return false;
    });

    const nationalAds = filtered.filter(
      a => a.geo_scope === "national" || a.is_national
    );

    filtered = localAds.length > 0 ? [...localAds, ...nationalAds] : nationalAds;
  }

  return filtered.sort((a, b) => a.sponsored_rank - b.sponsored_rank);
}

export function interleaveAdsInListings<T>(
  listings: T[],
  ads: SponsoredAd[],
  options: { interval?: number; boostFirst?: boolean } = {}
): Array<{ type: "listing"; data: T } | { type: "ad"; data: SponsoredAd }> {
  const { interval = 6, boostFirst = false } = options;
  const result: Array<{ type: "listing"; data: T } | { type: "ad"; data: SponsoredAd }> = [];
  let adIndex = 0;

  if (boostFirst && ads.length > 0 && listings.length > 1) {
    result.push({ type: "listing", data: listings[0] });
    result.push({ type: "listing", data: listings[1] });
    result.push({ type: "ad", data: ads[adIndex++] });
    for (let i = 2; i < listings.length; i++) {
      result.push({ type: "listing", data: listings[i] });
      if ((i - 1) % interval === 0 && adIndex < ads.length) {
        result.push({ type: "ad", data: ads[adIndex++] });
      }
    }
    return result;
  }

  for (let i = 0; i < listings.length; i++) {
    result.push({ type: "listing", data: listings[i] });
    if ((i + 1) % interval === 0 && adIndex < ads.length) {
      result.push({ type: "ad", data: ads[adIndex++] });
    }
  }

  return result;
}
