import { useLocation } from "wouter";
import { platform } from "@shared/platform";
import { EMP_SUBCATEGORIES } from "@/lib/emp-subcategories";
import { trackEvent } from "@/lib/analytics";
import { ChevronLeft, Briefcase, ChevronRight, HeartHandshake } from "lucide-react";
import AiGuideBanner from "@/components/ai-guide-banner";

export default function Employment() {
  const [, setLocation] = useLocation();

  const handleSubcategoryClick = (sub: typeof EMP_SUBCATEGORIES[number]) => {
    trackEvent("emp_subcategory_click", { subcategory: sub.slug });
    setLocation(`/resources?category=employment-support&sub=${encodeURIComponent(sub.slug)}`);
  };

  return (
    <div className="flex flex-col">
      <div className="pt-1">
        <button
          data-testid="emp-back-top"
          onClick={() => setLocation("/resources")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Resources
        </button>
      </div>
      <div className="bg-primary/5 border-b pt-3 pb-4 flex flex-col items-center text-center rounded-b-2xl mt-2">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-heading font-extrabold text-foreground tracking-tight">
            Employment Support
          </h1>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
          Job placement, career coaching, vocational rehab, apprenticeships, and entrepreneurship resources for veterans.
        </p>
      </div>

      <div className="flex-1 py-6 max-w-lg mx-auto w-full">
        <div className="mb-6 px-1" data-testid="emp-intro">
          <p className="text-sm text-muted-foreground leading-relaxed text-center">
            If you're not sure where to start, begin with{" "}
            <button
              onClick={() => {
                const jobs = EMP_SUBCATEGORIES.find(s => s.slug === "job-placement-programs");
                if (jobs) handleSubcategoryClick(jobs);
              }}
              className="font-medium text-primary hover:underline"
              data-testid="emp-intro-jobs-link"
            >
              Job Placement Programs
            </button>{" "}
            or{" "}
            <button
              onClick={() => {
                const vocrehab = EMP_SUBCATEGORIES.find(s => s.slug === "vocational-rehabilitation");
                if (vocrehab) handleSubcategoryClick(vocrehab);
              }}
              className="font-medium text-primary hover:underline"
              data-testid="emp-intro-vocrehab-link"
            >
              Vocational Rehabilitation
            </button>.
          </p>
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                trackEvent("emp_request_support_click");
                setLocation("/get-help");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
              data-testid="emp-request-support"
            >
              <HeartHandshake className="h-3.5 w-3.5" />
              Request Support
            </button>
          </div>
        </div>

        <AiGuideBanner categoryContext="employment-support" />

        <p className="text-xs text-muted-foreground text-center mb-5">
          Select a topic to find trusted resources near you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EMP_SUBCATEGORIES.map((sub) => {
            const Icon = sub.icon;
            return (
              <button
                key={sub.slug}
                data-testid={`emp-sub-${sub.slug}`}
                onClick={() => handleSubcategoryClick(sub)}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-all active:scale-[0.98]"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mt-0.5">
                  <Icon className="h-4.5 w-4.5 text-emerald-700" />
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
            data-testid="emp-view-all"
            onClick={() => {
              trackEvent("emp_view_all_click");
              setLocation("/resources?category=employment-support");
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all Employment Support resources
          </button>

          <button
            data-testid="emp-back"
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
