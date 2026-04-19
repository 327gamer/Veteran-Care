import { useRef } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, HeartHandshake, AlertTriangle, type LucideIcon } from "lucide-react";
import { platform } from "@shared/platform";
import { trackEvent } from "@/lib/analytics";
import AiGuideBanner from "@/components/ai-guide-banner";
import TrustedPartnerStrip from "@/components/trusted-partner-strip";

export interface DrilldownSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
}

export interface DrilldownIntroLink {
  slug: string;
  label: string;
  testidKey: string;
}

export interface CategoryDrilldownConfig {
  testidPrefix: string;
  trackPrefix: string;
  viewAllSlug: import("@shared/canonical-categories").ResourceCategorySlug;
  aiContext: import("@shared/canonical-categories").ResourceCategorySlug;
  name: string;
  icon: LucideIcon;
  iconBgClass: string;
  iconTextClass: string;
  description: string;
  subcategories: DrilldownSubcategory[];
  introLinks?: [DrilldownIntroLink, DrilldownIntroLink];
  showSupportButton?: boolean;
  disclaimer?: string;
}

export default function CategoryDrilldown({
  testidPrefix,
  trackPrefix,
  viewAllSlug,
  aiContext,
  name,
  icon: HeaderIcon,
  iconBgClass,
  iconTextClass,
  description,
  subcategories,
  introLinks,
  showSupportButton = true,
  disclaimer,
}: CategoryDrilldownConfig) {
  const [, setLocation] = useLocation();
  const stripExposedRef = useRef(false);

  const goToSub = (sub: DrilldownSubcategory) => {
    trackEvent(`${trackPrefix}_subcategory_click`, { subcategory: sub.slug });
    if (stripExposedRef.current) {
      trackEvent("trusted_partner_strip_sub_clickthrough", {
        category: viewAllSlug,
        subcategory: sub.slug,
      });
    }
    setLocation(`/resources?category=${viewAllSlug}&sub=${encodeURIComponent(sub.slug)}`);
  };

  return (
    <div className="flex flex-col">
      <div className="pt-1">
        <button
          data-testid={`${testidPrefix}-back-top`}
          onClick={() => setLocation("/resources")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Resources
        </button>
      </div>
      <div className="bg-primary/5 border-b pt-3 pb-4 flex flex-col items-center text-center rounded-b-2xl mt-2">
        <div className="flex items-center gap-2 mb-2">
          <HeaderIcon className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-heading font-extrabold text-foreground tracking-tight">
            {name}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
          {description}
        </p>
      </div>

      <div className="flex-1 py-6 max-w-lg mx-auto w-full">
        {introLinks && (
          <div className="mb-6 px-1" data-testid={`${testidPrefix}-intro`}>
            <p className="text-sm text-muted-foreground leading-relaxed text-center">
              If you're not sure where to start, begin with{" "}
              <button
                onClick={() => {
                  const target = subcategories.find(s => s.slug === introLinks[0].slug);
                  if (target) goToSub(target);
                }}
                className="font-medium text-primary hover:underline"
                data-testid={`${testidPrefix}-intro-${introLinks[0].testidKey}-link`}
              >
                {introLinks[0].label}
              </button>{" "}
              or{" "}
              <button
                onClick={() => {
                  const target = subcategories.find(s => s.slug === introLinks[1].slug);
                  if (target) goToSub(target);
                }}
                className="font-medium text-primary hover:underline"
                data-testid={`${testidPrefix}-intro-${introLinks[1].testidKey}-link`}
              >
                {introLinks[1].label}
              </button>.
            </p>
            {showSupportButton && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => {
                    trackEvent(`${trackPrefix}_request_support_click`);
                    setLocation("/get-help");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                  data-testid={`${testidPrefix}-request-support`}
                >
                  <HeartHandshake className="h-3.5 w-3.5" />
                  Request Support
                </button>
              </div>
            )}
          </div>
        )}

        <AiGuideBanner categoryContext={aiContext} />

        <TrustedPartnerStrip
          categorySlug={viewAllSlug}
          trackPrefix={trackPrefix}
          onExposed={() => { stripExposedRef.current = true; }}
        />

        <p className="text-xs text-muted-foreground text-center mb-5">
          Select a topic to find trusted resources near you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subcategories.map((sub) => {
            const Icon = sub.icon;
            return (
              <button
                key={sub.slug}
                data-testid={`${testidPrefix}-sub-${sub.slug}`}
                onClick={() => goToSub(sub)}
                className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-all active:scale-[0.98]"
              >
                <div className={`shrink-0 w-9 h-9 rounded-lg ${iconBgClass} flex items-center justify-center mt-0.5`}>
                  <Icon className={`h-4.5 w-4.5 ${iconTextClass}`} />
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

        {disclaimer && (
          <div className="mt-4 mx-1 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200" data-testid={`${testidPrefix}-disclaimer`}>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 leading-relaxed">
              {disclaimer}
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            data-testid={`${testidPrefix}-view-all`}
            onClick={() => {
              trackEvent(`${trackPrefix}_view_all_click`);
              setLocation(`/resources?category=${viewAllSlug}`);
            }}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all {name} resources
          </button>

          <button
            data-testid={`${testidPrefix}-back`}
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
