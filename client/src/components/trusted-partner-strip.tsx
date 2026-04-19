import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, MapPin, ArrowUpRight } from "lucide-react";
import { trackEvent, trackEventDedup } from "@/lib/analytics";
import { useGeolocation } from "@/lib/use-geolocation";

const PILOT_CATEGORIES = new Set([
  "community-support",
  "mental-health",
  "housing-home",
]);

interface TrustedPartner {
  id: string;
  name: string;
  short_description?: string | null;
  phone?: string | null;
  website_url?: string | null;
  city?: string | null;
  state?: string | null;
  is_featured?: boolean;
  cta_text?: string | null;
  cta_url?: string | null;
  category?: { slug: string; name: string } | null;
}

interface Props {
  categorySlug: string;
  trackPrefix: string;
  /** Lift exposure state up so the parent can attribute later sub clicks. */
  onExposed?: () => void;
}

export default function TrustedPartnerStrip({
  categorySlug,
  trackPrefix,
  onExposed,
}: Props) {
  const enabled = PILOT_CATEGORIES.has(categorySlug);
  const { location: geo } = useGeolocation();
  const stateCode = geo?.stateCode || "";

  const { data: partners = [], isLoading } = useQuery<TrustedPartner[]>({
    enabled,
    queryKey: ["/api/trusted-partners-for-category", categorySlug, "ranked-verified", stateCode],
    queryFn: async () => {
      const qs = new URLSearchParams({ ranked: "1", verified_only: "1", limit: "3" });
      if (stateCode) qs.set("state", stateCode);
      const r = await fetch(
        `/api/trusted-partners-for-category/${encodeURIComponent(categorySlug)}?${qs.toString()}`
      );
      if (!r.ok) return [];
      const data = await r.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const exposedRef = useRef(false);
  const scrolledPastRef = useRef(false);

  // Strip impression — deduped per session per category (state-independent).
  useEffect(() => {
    if (!enabled || isLoading || partners.length === 0) return;
    if (exposedRef.current) return;
    exposedRef.current = true;
    onExposed?.();
    trackEventDedup(
      "trusted_partner_strip_impression",
      categorySlug,
      {
        category: categorySlug,
        partner_count: partners.length,
        state: stateCode || "unknown",
        track_prefix: trackPrefix,
      }
    );
  }, [enabled, isLoading, partners.length, categorySlug, stateCode, trackPrefix, onExposed]);

  // Scroll-past — only fires AFTER the strip first becomes visible AND is then
  // scrolled past (i.e., the sentinel transitions in→out, or strip top exits
  // viewport). Avoids false positives when the strip is already in the initial
  // viewport on mount.
  useEffect(() => {
    if (!enabled || partners.length === 0) return;
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    let hasBeenSeen = false;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            hasBeenSeen = true;
          } else if (hasBeenSeen && !scrolledPastRef.current) {
            scrolledPastRef.current = true;
            trackEventDedup(
              "trusted_partner_strip_scrolled_past",
              categorySlug,
              { category: categorySlug, partner_count: partners.length }
            );
            obs.disconnect();
            break;
          }
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [enabled, partners.length, categorySlug, stateCode]);

  if (!enabled) return null;
  if (isLoading) return null;
  if (partners.length === 0) return null;

  const isSafeUrl = (raw: string | null | undefined): string => {
    if (!raw) return "";
    const v = String(raw).trim();
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    if (/^tel:/i.test(v)) return v;
    if (/^mailto:/i.test(v)) return v;
    return "";
  };

  const handleCardClick = (p: TrustedPartner, position: number) => {
    trackEvent("trusted_partner_strip_click", {
      category: categorySlug,
      partner_id: p.id,
      partner_name: p.name,
      position,
      featured: !!p.is_featured,
      utm_content: `cross-pop:drilldown:${categorySlug}`,
    });
    const url =
      isSafeUrl(p.cta_url) ||
      isSafeUrl(p.website_url) ||
      (p.phone ? `tel:${p.phone}` : "");
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      className="mb-5 px-1"
      data-testid={`trusted-partner-strip-${categorySlug}`}
      aria-label="Verified Partners"
    >
      <div className="flex items-center gap-2 mb-2 px-1">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span className="text-xs font-semibold text-emerald-700 tracking-wide uppercase">
          Verified Partners
        </span>
      </div>
      <div className="space-y-2">
        {partners.map((p, i) => (
          <button
            key={`tps-${p.id}`}
            type="button"
            data-testid={`card-trusted-partner-strip-${p.id}`}
            onClick={() => handleCardClick(p, i)}
            className="w-full text-left bg-white border border-emerald-200 hover:border-emerald-400 rounded-xl px-3 py-2.5 transition-colors active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span className="text-sm font-semibold text-foreground leading-tight truncate">
                    {p.name}
                  </span>
                </div>
                {p.short_description && (
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                    {p.short_description}
                  </p>
                )}
                {(p.city || p.state) && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                    <MapPin className="h-2.5 w-2.5" />
                    <span>{[p.city, p.state].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>
              <div className="shrink-0 self-center">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 group-hover:text-emerald-800">
                  {p.cta_text || "View"}
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
    </section>
  );
}
