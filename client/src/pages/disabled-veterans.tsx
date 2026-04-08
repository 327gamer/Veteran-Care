import { useLocation } from "wouter";
import { platform } from "@shared/platform";
import { DV_SUBCATEGORIES } from "@/lib/dv-subcategories";
import { trackEvent } from "@/lib/analytics";
import { ChevronLeft, Medal, ChevronRight, HeartHandshake } from "lucide-react";
import AiGuideBanner from "@/components/ai-guide-banner";

export default function DisabledVeterans() {
  const [, setLocation] = useLocation();

  const handleSubcategoryClick = (sub: typeof DV_SUBCATEGORIES[number]) => {
    trackEvent("dv_subcategory_click", { subcategory: sub.slug });
    setLocation(`/resources?category=disabled-veterans&sub=${encodeURIComponent(sub.slug)}`);
  };

  return (
    <div className="flex flex-col">
      <div className="pt-1">
        <button
          data-testid="dv-back-top"
          onClick={() => setLocation("/resources")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Resources
        </button>
      </div>
      <div className="bg-primary/5 border-b pt-3 pb-4 flex flex-col items-center text-center rounded-b-2xl mt-2">
        <div className="flex items-center gap-2 mb-2">
          <Medal className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-heading font-extrabold text-foreground tracking-tight">
            Disabled Veterans
          </h1>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
          Resources, benefits, housing, transportation, employment, and advocacy specifically for disabled veterans and their families.
        </p>
      </div>

      <div className="flex-1 py-6 max-w-lg mx-auto w-full">
        <div className="mb-6 px-1" data-testid="dv-intro">
          <p className="text-sm text-muted-foreground leading-relaxed text-center">
            If you're not sure where to start, begin with{" "}
            <button
              onClick={() => {
                const benefits = DV_SUBCATEGORIES.find(s => s.slug === "disability-benefits-claims");
                if (benefits) handleSubcategoryClick(benefits);
              }}
              className="font-medium text-primary hover:underline"
              data-testid="dv-intro-benefits-link"
            >
              Disability Benefits &amp; Claims
            </button>{" "}
            or{" "}
            <button
              onClick={() => {
                const health = DV_SUBCATEGORIES.find(s => s.slug === "healthcare-rehabilitation");
                if (health) handleSubcategoryClick(health);
              }}
              className="font-medium text-primary hover:underline"
              data-testid="dv-intro-health-link"
            >
              Healthcare &amp; Rehabilitation
            </button>.
          </p>
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                trackEvent("dv_request_support_click");
                setLocation("/get-help");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
              data-testid="dv-request-support"
            >
              <HeartHandshake className="h-3.5 w-3.5" />
              Request Support
            </button>
          </div>
        </div>

        <AiGuideBanner categoryContext="disabled-veterans" />

        <p className="text-xs text-muted-foreground text-center mb-5">
          Select a topic to find trusted resources near you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DV_SUBCATEGORIES.map((sub) => {
            const Icon = sub.icon;
            return (
              <button
                key={sub.slug}
                data-testid={`dv-sub-${sub.slug}`}
                onClick={() => handleSubcategoryClick(sub)}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-all active:scale-[0.98]"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mt-0.5">
                  <Icon className="h-4.5 w-4.5 text-amber-700" />
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
            data-testid="dv-view-all"
            onClick={() => {
              trackEvent("dv_view_all_click");
              setLocation("/resources?category=disabled-veterans");
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all Disabled Veterans resources
          </button>

          <button
            data-testid="dv-back"
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
