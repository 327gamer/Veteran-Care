import { useLocation } from "wouter";
import { platform } from "@shared/platform";
import { BENEFITS_SUBCATEGORIES } from "@/lib/benefits-subcategories";
import { trackEvent } from "@/lib/analytics";
import { ChevronLeft, FileText, ChevronRight, HeartHandshake, AlertTriangle } from "lucide-react";
import AiGuideBanner from "@/components/ai-guide-banner";

export default function BenefitsAssistance() {
  const [, setLocation] = useLocation();

  const handleSubcategoryClick = (sub: typeof BENEFITS_SUBCATEGORIES[number]) => {
    trackEvent("benefits_subcategory_click", { subcategory: sub.slug });
    setLocation(`/resources?category=va-benefits&sub=${encodeURIComponent(sub.slug)}`);
  };

  return (
    <div className="flex flex-col">
      <div className="pt-1">
        <button
          data-testid="benefits-back-top"
          onClick={() => setLocation("/resources")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Resources
        </button>
      </div>
      <div className="bg-primary/5 border-b pt-3 pb-4 flex flex-col items-center text-center rounded-b-2xl mt-2">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-heading font-extrabold text-foreground tracking-tight">
            Benefits Assistance
          </h1>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
          Military records, disability claims, compensation, pension, appeals guidance, and VA enrollment support for veterans and their families.
        </p>
      </div>

      <div className="flex-1 py-6 max-w-lg mx-auto w-full">
        <div className="mb-6 px-1" data-testid="benefits-intro">
          <p className="text-sm text-muted-foreground leading-relaxed text-center">
            If you're not sure where to start, begin with{" "}
            <button
              onClick={() => {
                const records = BENEFITS_SUBCATEGORIES.find(s => s.slug === "military-records-dd214");
                if (records) handleSubcategoryClick(records);
              }}
              className="font-medium text-primary hover:underline"
              data-testid="benefits-intro-records-link"
            >
              Military Records &amp; DD214
            </button>{" "}
            or{" "}
            <button
              onClick={() => {
                const claims = BENEFITS_SUBCATEGORIES.find(s => s.slug === "disability-claims-filing");
                if (claims) handleSubcategoryClick(claims);
              }}
              className="font-medium text-primary hover:underline"
              data-testid="benefits-intro-claims-link"
            >
              Disability Claims &amp; Filing
            </button>.
          </p>
        </div>

        <AiGuideBanner categoryContext="benefits-assistance" />

        <p className="text-xs text-muted-foreground text-center mb-5">
          Select a topic to find trusted resources near you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BENEFITS_SUBCATEGORIES.map((sub) => {
            const Icon = sub.icon;
            return (
              <button
                key={sub.slug}
                data-testid={`benefits-sub-${sub.slug}`}
                onClick={() => handleSubcategoryClick(sub)}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-all active:scale-[0.98]"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mt-0.5">
                  <Icon className="h-4.5 w-4.5 text-blue-700" />
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

        <div className="mt-4 mx-1 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200" data-testid="benefits-disclaimer">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-800 leading-relaxed">
            Processes and requirements may change. Please confirm with official VA or accredited representatives.
          </p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            data-testid="benefits-view-all"
            onClick={() => {
              trackEvent("benefits_view_all_click");
              setLocation("/resources?category=va-benefits");
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all Benefits Assistance resources
          </button>

          <button
            data-testid="benefits-back"
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
