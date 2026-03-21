import { useLocation } from "wouter";
import { platform } from "@shared/platform";
import { EOL_SUBCATEGORIES } from "@/lib/eol-subcategories";
import { trackEvent } from "@/lib/analytics";
import logoImg from "@assets/Veteran_Care_-_Shadow_-_PNG_1772598034200.png";
import { ChevronLeft, Flower2, ChevronRight, HeartHandshake } from "lucide-react";

export default function EndOfLife() {
  const [, setLocation] = useLocation();

  const handleSubcategoryClick = (sub: typeof EOL_SUBCATEGORIES[number]) => {
    trackEvent("eol_subcategory_click", { subcategory: sub.slug });
    setLocation(`/resources?category=end-of-life-services&sub=${encodeURIComponent(sub.name)}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-primary px-4 pt-10 pb-8 flex flex-col items-center text-center">
        <img
          src={logoImg}
          alt={platform.name}
          className="h-32 w-auto object-contain drop-shadow-xl mb-4"
          data-testid="eol-logo"
        />
        <div className="flex items-center gap-2 mb-1">
          <Flower2 className="h-5 w-5 text-white/80" />
          <h1 className="text-xl font-heading font-extrabold text-white tracking-tight">
            End of Life Services
          </h1>
        </div>
        <p className="text-white/70 text-sm leading-relaxed max-w-sm">
          Support for veterans, family members, caregivers, and case managers navigating end-of-life care, hospice, final arrangements, family benefits, and legal planning.
        </p>
      </div>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        <div className="mb-6 px-1" data-testid="eol-intro">
          <p className="text-sm text-muted-foreground leading-relaxed text-center">
            If you're not sure where to start, begin with{" "}
            <button
              onClick={() => {
                const hospice = EOL_SUBCATEGORIES.find(s => s.slug === "hospice-palliative-care");
                if (hospice) handleSubcategoryClick(hospice);
              }}
              className="font-medium text-primary hover:underline"
              data-testid="eol-intro-hospice-link"
            >
              Hospice &amp; Palliative Care
            </button>{" "}
            or{" "}
            <button
              onClick={() => {
                const benefits = EOL_SUBCATEGORIES.find(s => s.slug === "va-death-benefits");
                if (benefits) handleSubcategoryClick(benefits);
              }}
              className="font-medium text-primary hover:underline"
              data-testid="eol-intro-benefits-link"
            >
              VA Death Benefits &amp; Survivor Benefits
            </button>.
          </p>
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                trackEvent("eol_request_support_click");
                setLocation("/get-help");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
              data-testid="eol-request-support"
            >
              <HeartHandshake className="h-3.5 w-3.5" />
              Request Support
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mb-5">
          Select a topic to find trusted resources near you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EOL_SUBCATEGORIES.map((sub) => {
            const Icon = sub.icon;
            return (
              <button
                key={sub.slug}
                data-testid={`eol-sub-${sub.slug}`}
                onClick={() => handleSubcategoryClick(sub)}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-all active:scale-[0.98]"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center mt-0.5">
                  <Icon className="h-4.5 w-4.5 text-stone-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-foreground leading-tight">
                      {sub.name}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                    {sub.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            data-testid="eol-view-all"
            onClick={() => {
              trackEvent("eol_view_all_click");
              setLocation("/resources?category=end-of-life-services");
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all End of Life Services resources
          </button>

          <button
            data-testid="eol-back"
            onClick={() => setLocation("/home")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to {platform.name}
          </button>
        </div>
      </div>
    </div>
  );
}
