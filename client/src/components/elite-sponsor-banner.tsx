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
}: EliteSponsorBannerProps) {
  const geo = useGeolocation();
  const stateCode = geo.location?.stateCode || "";
  const stateName = geo.location?.state || "";

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

  // While loading, render a quiet skeleton (same height as placeholder/card)
  if (isLoading) {
    return (
      <section
        className="w-full max-w-6xl mx-auto px-4 mt-4 mb-2"
        data-testid="elite-sponsor-banner-loading"
      >
        <div className="rounded-xl border border-amber-200/40 bg-gradient-to-br from-amber-50/40 to-stone-50/40 h-32 animate-pulse" />
      </section>
    );
  }

  // Vacant, paused, no data, or unapproved (server returns slot=null when
  // creative_approval_status != "approved") → render the placeholder.
  if (!data || !data.slot || data.isPlaceholder || data.status !== "sold") {
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
    />
  );
}
