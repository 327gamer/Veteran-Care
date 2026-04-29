import { useState } from "react";
import { Phone, Globe, ShieldCheck } from "lucide-react";
import EliteSponsorLeadModal from "@/components/elite-sponsor-lead-modal";

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
}

export default function EliteSponsorCard({
  slot,
  categorySlug,
  categoryLabel,
  stateCode,
  stateName,
}: EliteSponsorCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const cta = slot.sponsor_cta_text || "Get Help";

  return (
    <section
      className="w-full max-w-6xl mx-auto px-4 mt-4 mb-2"
      data-testid={`elite-sponsor-card-${categorySlug}`}
    >
      <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-3">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-700">
            Elite Sponsor
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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-stone-500">
              {slot.sponsor_phone && (
                <a
                  href={`tel:${slot.sponsor_phone}`}
                  className="inline-flex items-center gap-1 hover:text-amber-700"
                  data-testid={`link-sponsor-phone-${slot.id}`}
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
                >
                  <Globe className="w-3 h-3" />
                  Website
                </a>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 shadow-sm"
              data-testid={`button-sponsor-cta-${slot.id}`}
            >
              {cta}
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
