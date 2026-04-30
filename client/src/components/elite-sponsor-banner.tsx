import { useQuery } from "@tanstack/react-query";
import { useGeolocation } from "@/lib/use-geolocation";
import EliteSponsorPlaceholder from "@/components/elite-sponsor-placeholder";
import EliteSponsorCard from "@/components/elite-sponsor-card";

interface EliteSponsorBannerProps {
  // Widened 2026-04-29 from a 4-literal union to `string` so the banner can be
  // rendered on any approved Trusted Services category. The server-side
  // /api/elite-sponsor validator (server/elite-sponsor.ts:isValidCategorySlug)
  // remains the source of truth for which slugs ever return real slot data —
  // anything not in the ECSS allowlist falls through to the vacant placeholder.
  categorySlug: string;
  categoryLabel: string;
  // Optional subcategory targeting. When set, queries for the (state, category,
  // subcategory) slot. When omitted, falls back to the existing top-of-category
  // (subcategory_slug IS NULL) lookup so /financial-services /legal-services
  // /real-estate keep working unchanged.
  subcategorySlug?: string;
  subcategoryLabel?: string;
  // Founder spec 2026-04-29: same banner is rendered TWICE on subcategory
  // pages — once as the hero banner above listings, and once as the #1
  // listing inside the listings stack. The variant prop tunes the card
  // wrapper margins so it fits either context cleanly.
  variant?: "banner" | "listing";
  // When true, suppress the vacant-slot placeholder. Used by the #1-listing
  // render path so we don't double up on the "claim this slot" CTA when the
  // hero banner above already shows it.
  hidePlaceholder?: boolean;
  // Founder QA fix 2026-04-30 (architect catch): optional manual state
  // override for the no-GPS path. When the user picks a state via the manual
  // State dropdown, pass that here so the Elite banner targets the user's
  // chosen state instead of falling back to the national placeholder. Manual
  // choice wins over GPS — matches the page's effectiveStateCode pattern at
  // veteran-discounts.tsx where filterState || geo.location?.stateCode is
  // the source of truth for state context.
  manualStateOverride?: string | null;
  manualStateName?: string | null;
}

interface EliteSlotResponse {
  slot: {
    id: string;
    sponsor_name: string;
    sponsor_logo_url: string | null;
    sponsor_short_description: string | null;
    sponsor_cta_text: string | null;
    sponsor_phone: string | null;
    sponsor_website_url: string | null;
  } | null;
  status: "vacant" | "sold" | "paused";
  isPlaceholder: boolean;
  categorySlug: string;
  subcategorySlug?: string | null;
  stateCode: string | null;
}

export default function EliteSponsorBanner({
  categorySlug,
  categoryLabel,
  subcategorySlug,
  subcategoryLabel,
  variant = "banner",
  hidePlaceholder = false,
  manualStateOverride = null,
  manualStateName = null,
}: EliteSponsorBannerProps) {
  const geo = useGeolocation();
  // Founder QA fix 2026-04-30: manual state choice wins over GPS, matching
  // the page's effectiveStateCode pattern (filterState || geo.location?.stateCode).
  // Falls back to "" which routes to the national/no-state lookup on the server.
  const stateCode = manualStateOverride || geo.location?.stateCode || "";
  const stateName = manualStateName || geo.location?.state || "";

  const subKey = subcategorySlug && subcategorySlug !== "__all__" ? subcategorySlug : "";

  const { data, isLoading } = useQuery<EliteSlotResponse>({
    queryKey: [
      "/api/elite-sponsor",
      categorySlug,
      stateCode || "national",
      subKey || "top",
    ],
    queryFn: async () => {
      const params = new URLSearchParams({ categorySlug });
      if (stateCode) params.set("state", stateCode);
      if (subKey) params.set("subcategorySlug", subKey);
      const r = await fetch(`/api/elite-sponsor?${params.toString()}`);
      if (!r.ok) throw new Error("lookup failed");
      return r.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // While loading, render a quiet skeleton (same height as placeholder/card).
  // Listing-variant uses no outer margin so it slots into the listings stack.
  if (isLoading) {
    const loadingOuter =
      variant === "banner"
        ? "w-full max-w-6xl mx-auto px-4 mt-4 mb-2"
        : "w-full";
    return (
      <section className={loadingOuter} data-testid="elite-sponsor-banner-loading">
        <div className="rounded-xl border border-amber-200/40 bg-gradient-to-br from-amber-50/40 to-stone-50/40 h-32 animate-pulse" />
      </section>
    );
  }

  // Vacant, paused, no data, or unapproved (server returns slot=null when
  // creative_approval_status != "approved") → render the placeholder, unless
  // the caller has asked us to suppress it (hidePlaceholder=true). The
  // listing-variant render path uses hidePlaceholder so the vacant CTA only
  // shows once (in the hero banner above the listings), not twice.
  if (!data || !data.slot || data.isPlaceholder || data.status !== "sold") {
    if (hidePlaceholder) return null;
    return (
      <EliteSponsorPlaceholder
        categorySlug={categorySlug}
        categoryLabel={categoryLabel}
        subcategorySlug={subKey || null}
        subcategoryLabel={subcategoryLabel || null}
        stateCode={stateCode || null}
        stateName={stateName || null}
      />
    );
  }

  // Sold + active + approved sponsor → render the premium card.
  return (
    <EliteSponsorCard
      slot={data.slot}
      categorySlug={categorySlug}
      categoryLabel={categoryLabel}
      subcategorySlug={subKey || null}
      subcategoryLabel={subcategoryLabel || null}
      stateCode={stateCode || null}
      stateName={stateName || null}
      variant={variant}
    />
  );
}
