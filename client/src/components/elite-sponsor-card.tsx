import { useState } from "react";
import { Phone, Globe, ShieldCheck, Crown, Sparkles } from "lucide-react";
import EliteSponsorLeadModal from "@/components/elite-sponsor-lead-modal";

// Founder QA item #7 (2026-04-30): outbound-click tracking for ROI reporting
// to paying Elite partners. Fire-and-forget — never blocks the user's
// navigation to the sponsor's website. Uses navigator.sendBeacon when
// available (browser keeps the request alive past page unload); falls back
// to a non-awaited fetch with keepalive otherwise. Errors are swallowed —
// the link must work even if tracking fails.
function trackEliteClick(
  slotId: string,
  clickType: "website" | "phone" | "cta_primary" | "cta_secondary",
): void {
  try {
    const payload = JSON.stringify({ slotId, clickType });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/elite-sponsor/track-click", blob);
      return;
    }
    void fetch("/api/elite-sponsor/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never break the link */
  }
}

interface EliteSponsorCardProps {
  slot: {
    id: string;
    sponsor_name: string;
    sponsor_logo_url: string | null;
    sponsor_short_description: string | null;
    sponsor_cta_text: string | null;
    sponsor_phone: string | null;
    sponsor_website_url: string | null;
  };
  categorySlug: string;
  categoryLabel: string;
  // Optional subcategory passthrough — accepted for API compatibility with the
  // banner but not currently displayed on the card. Reserved for future per-
  // subcategory styling/analytics.
  subcategorySlug?: string | null;
  subcategoryLabel?: string | null;
  stateCode: string | null;
  stateName: string | null;
  // Founder spec 2026-04-29: same card renders in two contexts.
  //   "banner"  → standalone hero above subcategory listings (default)
  //   "listing" → first item inside the listings stack (no extra outer margin)
  variant?: "banner" | "listing";
}

export default function EliteSponsorCard({
  slot,
  categorySlug,
  categoryLabel,
  stateCode,
  stateName,
  variant = "banner",
}: EliteSponsorCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // Founder spec 2026-04-29: CTA labels are mandated, NOT pulled from
  // slot.sponsor_cta_text (which we keep in the data model for future
  // sponsor-customizable copy but intentionally do not display here).
  const primaryCtaLabel = "Get Exclusive Offer";
  const secondaryCtaLabel = "Request Info (24hr response)";

  // Outer wrapper: banner gets standalone margins; listing variant fits inside
  // the parent .space-y-3 listings stack with zero extra spacing so it sits
  // flush as the #1 result above the interleaved trusted-partner cards.
  const outerClass =
    variant === "banner"
      ? "w-full max-w-6xl mx-auto px-4 mt-4 mb-2"
      : "w-full";

  return (
    <section
      className={outerClass}
      data-testid={`elite-sponsor-card-${categorySlug}`}
      data-variant={variant}
    >
      <div
        className="relative rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 shadow-[0_0_24px_-4px_rgba(245,158,11,0.4)] ring-1 ring-amber-300/50 ring-offset-1 hover:shadow-[0_0_32px_-2px_rgba(245,158,11,0.55)] hover:-translate-y-0.5 transition-all duration-150 overflow-hidden"
      >
        {/* Header strip: Elite badge (left) + Exclusive Offer pill (center) + state context (right) */}
        <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-900/90 px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase text-amber-50">
            <Crown className="w-3 h-3" aria-hidden="true" />
            Elite Sponsor
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800"
            data-testid={`elite-exclusive-offer-${slot.id}`}
          >
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            Exclusive Offer
          </span>
          {stateName && (
            <span className="text-[10px] text-stone-500 ml-auto">
              {categoryLabel} · {stateName}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
          <div className="flex-shrink-0">
            {slot.sponsor_logo_url ? (
              <img
                src={slot.sponsor_logo_url}
                alt={`${slot.sponsor_name} logo`}
                className="w-20 h-20 rounded-lg object-cover border border-stone-200 bg-white"
                data-testid={`img-sponsor-logo-${slot.id}`}
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                <span className="text-2xl font-bold text-amber-700">
                  {slot.sponsor_name?.[0]?.toUpperCase() || "★"}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="text-lg sm:text-xl font-semibold text-stone-900 leading-tight"
              data-testid={`text-sponsor-name-${slot.id}`}
            >
              {slot.sponsor_name}
            </h3>
            {slot.sponsor_short_description && (
              <p
                className="text-sm text-stone-600 mt-1 line-clamp-2"
                data-testid={`text-sponsor-desc-${slot.id}`}
              >
                {slot.sponsor_short_description}
              </p>
            )}

            {/* Demoted tel/website chips per founder spec 2026-04-29:
                "Do NOT remove call/website — just deprioritize." */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-stone-500">
              {slot.sponsor_phone && (
                <a
                  href={`tel:${slot.sponsor_phone}`}
                  className="inline-flex items-center gap-1 hover:text-amber-700"
                  data-testid={`link-sponsor-phone-${slot.id}`}
                  aria-label={`Call ${slot.sponsor_name}`}
                  onClick={() => trackEliteClick(slot.id, "phone")}
                >
                  <Phone className="w-3 h-3" />
                  {slot.sponsor_phone}
                </a>
              )}
              {slot.sponsor_website_url && (
                <a
                  href={slot.sponsor_website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-amber-700"
                  data-testid={`link-sponsor-website-${slot.id}`}
                  aria-label={`Visit ${slot.sponsor_name} website`}
                  onClick={() => trackEliteClick(slot.id, "website")}
                >
                  <Globe className="w-3 h-3" />
                  Website
                </a>
              )}
            </div>
          </div>

          {/* Dual CTAs — both open the same lead modal. Primary = strong amber
              fill; secondary = white-on-amber outline. Both are visually more
              prominent than the demoted tel/website chips above. */}
          <div className="flex-shrink-0 w-full sm:w-auto flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 shadow-sm transition-colors"
              data-testid={`button-elite-cta-primary-${slot.id}`}
            >
              {primaryCtaLabel}
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2 rounded-md bg-white text-amber-700 font-semibold text-xs border-2 border-amber-500 hover:bg-amber-50 transition-colors"
              data-testid={`button-elite-cta-secondary-${slot.id}`}
            >
              {secondaryCtaLabel}
            </button>
          </div>
        </div>
      </div>

      <EliteSponsorLeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        slotId={slot.id}
        sponsorName={slot.sponsor_name}
        categoryLabel={categoryLabel}
        stateCode={stateCode}
      />
    </section>
  );
}
