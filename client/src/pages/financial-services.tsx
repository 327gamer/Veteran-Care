import { useLocation } from "wouter";
import { platform } from "@shared/platform";
import { FIN_SUBCATEGORIES } from "@/lib/fin-subcategories";
import { trackEvent } from "@/lib/analytics";
import { ChevronLeft, DollarSign, ChevronRight, HeartHandshake } from "lucide-react";

export default function FinancialServices() {
  const [, setLocation] = useLocation();

  const handleSubcategoryClick = (sub: typeof FIN_SUBCATEGORIES[number]) => {
    trackEvent("fin_subcategory_click", { subcategory: sub.slug });
    setLocation(`/resources?category=financial&sub=${encodeURIComponent(sub.slug)}`);
  };

  return (
    <div className="flex flex-col">
      <div className="pt-1">
        <button
          data-testid="fin-back-top"
          onClick={() => setLocation("/resources")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Resources
        </button>
      </div>
      <div className="bg-primary/5 border-b pt-3 pb-4 flex flex-col items-center text-center rounded-b-2xl mt-2">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-heading font-extrabold text-foreground tracking-tight">
            Financial & Credit Services
          </h1>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
          Mortgages, personal loans, credit repair, debt relief, financial coaching, and banking support for veterans and their families.
        </p>
      </div>

      <div className="flex-1 py-6 max-w-lg mx-auto w-full">
        <div className="mb-6 px-1" data-testid="fin-intro">
          <p className="text-sm text-muted-foreground leading-relaxed text-center">
            If you're not sure where to start, begin with{" "}
            <button
              onClick={() => {
                const mortgages = FIN_SUBCATEGORIES.find(s => s.slug === "mortgages-home-loans");
                if (mortgages) handleSubcategoryClick(mortgages);
              }}
              className="font-medium text-primary hover:underline"
              data-testid="fin-intro-mortgages-link"
            >
              Mortgages / Home Loans
            </button>{" "}
            or{" "}
            <button
              onClick={() => {
                const credit = FIN_SUBCATEGORIES.find(s => s.slug === "credit-repair");
                if (credit) handleSubcategoryClick(credit);
              }}
              className="font-medium text-primary hover:underline"
              data-testid="fin-intro-credit-link"
            >
              Credit Repair
            </button>.
          </p>
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                trackEvent("fin_request_support_click");
                setLocation("/get-help");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
              data-testid="fin-request-support"
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
          {FIN_SUBCATEGORIES.map((sub) => {
            const Icon = sub.icon;
            return (
              <button
                key={sub.slug}
                data-testid={`fin-sub-${sub.slug}`}
                onClick={() => handleSubcategoryClick(sub)}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-all active:scale-[0.98]"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center mt-0.5">
                  <Icon className="h-4.5 w-4.5 text-slate-700" />
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
            data-testid="fin-view-all"
            onClick={() => {
              trackEvent("fin_view_all_click");
              setLocation("/resources?category=financial");
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all Financial & Credit Services resources
          </button>

          <button
            data-testid="fin-back"
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
