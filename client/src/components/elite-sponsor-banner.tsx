import { useQuery } from "@tanstack/react-query";
import { useGeolocation } from "@/lib/use-geolocation";
import EliteSponsorPlaceholder from "@/components/elite-sponsor-placeholder";

interface EliteSponsorBannerProps {
  categorySlug: "legal-services" | "mortgage-lending" | "real-estate";
  categoryLabel: string;
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
  stateCode: string | null;
}

export default function EliteSponsorBanner({
  categorySlug,
  categoryLabel,
}: EliteSponsorBannerProps) {
  const geo = useGeolocation();
  const stateCode = geo.location?.stateCode || "";
  const stateName = geo.location?.state || "";

  const { data, isLoading } = useQuery<EliteSlotResponse>({
    queryKey: [
      "/api/elite-sponsor",
      categorySlug,
      stateCode || "national",
    ],
    queryFn: async () => {
      const params = new URLSearchParams({ categorySlug });
      if (stateCode) params.set("state", stateCode);
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

  // Phase A: vacant or no slot data → render placeholder
  if (!data || data.isPlaceholder) {
    return (
      <EliteSponsorPlaceholder
        categorySlug={categorySlug}
        categoryLabel={categoryLabel}
        stateCode={stateCode || null}
        stateName={stateName || null}
      />
    );
  }

  // Phase B will render the filled sponsor card here. For Phase A we
  // still render the placeholder if the data path returns a slot, since
  // no slots are sold yet. (Defensive — RLS policy already filters.)
  return (
    <EliteSponsorPlaceholder
      categorySlug={categorySlug}
      categoryLabel={categoryLabel}
      stateCode={stateCode || null}
      stateName={stateName || null}
    />
  );
}
