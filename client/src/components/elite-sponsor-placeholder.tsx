import { Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

interface EliteSponsorPlaceholderProps {
  // Widened 2026-04-29 to accept any Trusted Services category slug.
  categorySlug: string;
  categoryLabel: string;
  // Optional subcategory targeting (Phase B for /discounts subcategory pages).
  subcategorySlug?: string | null;
  subcategoryLabel?: string | null;
  stateCode: string | null;
  stateName: string | null;
}

export default function EliteSponsorPlaceholder({
  categorySlug,
  categoryLabel,
  subcategorySlug,
  subcategoryLabel,
  stateCode,
  stateName,
}: EliteSponsorPlaceholderProps) {
  const stateContext = stateName
    ? stateName
    : stateCode
    ? stateCode
    : "your state";

  const handleClaim = () => {
    trackEvent("elite_sponsor_placeholder_click", {
      categorySlug,
      subcategorySlug: subcategorySlug || "none",
      stateCode: stateCode || "no_state",
    });
    // Founder spec 2026-04-29: placeholder must link to /elite-partner-apply
    // with state + category + subcategory pre-filled where possible.
    const params = new URLSearchParams({ category: categorySlug });
    if (subcategorySlug) params.set("subcategory", subcategorySlug);
    if (stateCode) params.set("state", stateCode);
    params.set("plan", "state");
    window.location.href = `/elite-partner-apply?${params.toString()}`;
  };

  return (
    <section
      className="w-full max-w-6xl mx-auto px-4 mt-4 mb-2"
      data-testid={`elite-sponsor-placeholder-${categorySlug}`}
    >
      <div
        className="relative overflow-hidden rounded-xl border border-amber-300/60 bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50/60 shadow-sm"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(254, 243, 199, 0.6) 0%, rgba(250, 245, 235, 0.4) 50%, rgba(254, 243, 199, 0.5) 100%)",
        }}
      >
        {/* Elite badge — top right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-amber-900/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-50">
          <Crown className="h-3 w-3" aria-hidden="true" />
          <span data-testid={`elite-sponsor-badge-${categorySlug}`}>
            Elite Sponsor
          </span>
        </div>

        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between md:gap-6 md:p-7">
          {/* Left — copy */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles
                className="h-4 w-4 text-amber-700"
                aria-hidden="true"
              />
              <span
                className="text-xs font-semibold uppercase tracking-wide text-amber-800"
                data-testid={`elite-sponsor-category-${categorySlug}`}
              >
                {categoryLabel} · {stateContext}
              </span>
            </div>

            <h3
              className="text-xl md:text-2xl font-bold tracking-tight text-stone-900"
              data-testid={`elite-sponsor-headline-${categorySlug}`}
            >
              This Exclusive Spot is Available
            </h3>

            <p
              className="mt-2 text-sm md:text-base font-medium text-stone-800"
              data-testid={`elite-sponsor-subhead-${categorySlug}`}
            >
              Become the exclusive Elite Category Sponsor for{" "}
              {stateName || stateCode || "this state"}.
            </p>

            <p className="mt-1.5 text-xs md:text-sm text-stone-700 leading-relaxed">
              Only one sponsor is available per category, per state. Get
              premium placement above all listings and receive direct inquiries
              from veterans and families.
            </p>
          </div>

          {/* Right — CTA */}
          <div className="flex flex-shrink-0 md:flex-col md:items-end gap-2">
            <Button
              size="lg"
              className="bg-amber-900 hover:bg-amber-950 text-amber-50 font-semibold shadow-md whitespace-nowrap"
              onClick={handleClaim}
              data-testid={`button-elite-claim-${categorySlug}`}
            >
              Claim This Slot
            </Button>
            <span className="text-[11px] text-stone-600 hidden md:block">
              One slot per state · Premium placement
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
