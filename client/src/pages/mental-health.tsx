import { useLocation } from "wouter";
import { platform } from "@shared/platform";
import { MH_SUBCATEGORIES } from "@/lib/mh-subcategories";
import { trackEvent } from "@/lib/analytics";
import { ChevronLeft, Brain, ChevronRight, HeartHandshake } from "lucide-react";
import AiGuideBanner from "@/components/ai-guide-banner";

export default function MentalHealth() {
  const [, setLocation] = useLocation();

  const handleSubcategoryClick = (sub: typeof MH_SUBCATEGORIES[number]) => {
    trackEvent("mh_subcategory_click", { subcategory: sub.slug });
    setLocation(`/resources?category=mental-health&sub=${encodeURIComponent(sub.slug)}`);
  };

  return (
    <div className="flex flex-col">
      <div className="pt-1">
        <button
          data-testid="mh-back-top"
          onClick={() => setLocation("/resources")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Resources
        </button>
      </div>
      <div className="bg-primary/5 border-b pt-3 pb-4 flex flex-col items-center text-center rounded-b-2xl mt-2">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-heading font-extrabold text-foreground tracking-tight">
            Mental Health
          </h1>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
          Counseling, crisis support, substance recovery, peer groups, and specialized mental health resources for veterans and their families.
        </p>
      </div>

      <div className="flex-1 py-6 max-w-lg mx-auto w-full">
        <div className="mb-6 px-1" data-testid="mh-intro">
          <p className="text-sm text-muted-foreground leading-relaxed text-center">
            If you're not sure where to start, begin with{" "}
            <button
              onClick={() => {
                const crisis = MH_SUBCATEGORIES.find(s => s.slug === "crisis-suicide-prevention");
                if (crisis) handleSubcategoryClick(crisis);
              }}
              className="font-medium text-primary hover:underline"
              data-testid="mh-intro-crisis-link"
            >
              Crisis &amp; Suicide Prevention
            </button>{" "}
            or{" "}
            <button
              onClick={() => {
                const counseling = MH_SUBCATEGORIES.find(s => s.slug === "counseling-therapy");
                if (counseling) handleSubcategoryClick(counseling);
              }}
              className="font-medium text-primary hover:underline"
              data-testid="mh-intro-counseling-link"
            >
              Counseling &amp; Therapy
            </button>.
          </p>
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                trackEvent("mh_request_support_click");
                setLocation("/get-help");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
              data-testid="mh-request-support"
            >
              <HeartHandshake className="h-3.5 w-3.5" />
              Request Support
            </button>
          </div>
        </div>

        <AiGuideBanner categoryContext="mental-health" />

        <p className="text-xs text-muted-foreground text-center mb-5">
          Select a topic to find trusted resources near you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MH_SUBCATEGORIES.map((sub) => {
            const Icon = sub.icon;
            return (
              <button
                key={sub.slug}
                data-testid={`mh-sub-${sub.slug}`}
                onClick={() => handleSubcategoryClick(sub)}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-all active:scale-[0.98]"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center mt-0.5">
                  <Icon className="h-4.5 w-4.5 text-purple-700" />
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
            data-testid="mh-view-all"
            onClick={() => {
              trackEvent("mh_view_all_click");
              setLocation("/resources?category=mental-health");
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all Mental Health resources
          </button>

          <button
            data-testid="mh-back"
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
