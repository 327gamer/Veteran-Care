import { Sparkles, HeartHandshake, Info } from "lucide-react";
import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";

interface AiGuideBannerProps {
  categoryContext: string;
}

export default function AiGuideBanner({ categoryContext }: AiGuideBannerProps) {
  const [, setLocation] = useLocation();

  const openAiGuide = () => {
    trackEvent("ai_guide_banner_click", { category: categoryContext });
    window.dispatchEvent(new CustomEvent("open-ai-guide", { detail: { category: categoryContext } }));
  };

  return (
    <div className="mx-1 mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4" data-testid="ai-guide-banner">
      <div className="flex items-center gap-2 mb-1.5">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <h2 className="text-sm font-bold text-foreground">Not sure where to start?</h2>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        Talk to our AI Veteran Guide — get step-by-step help and receive everything by email.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={openAiGuide}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors active:scale-[0.98]"
          data-testid="ai-guide-banner-talk"
        >
          <Sparkles className="h-4 w-4" />
          Talk to AI Guide
        </button>
        <button
          onClick={() => {
            trackEvent("ai_guide_banner_support_click", { category: categoryContext });
            setLocation("/get-help");
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary/30 text-primary text-sm font-semibold hover:bg-primary/10 transition-colors active:scale-[0.98]"
          data-testid="ai-guide-banner-support"
        >
          <HeartHandshake className="h-4 w-4" />
          Request Support
        </button>
      </div>
      <div className="flex items-start gap-1.5 mt-3">
        <Info className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Information is for guidance. Please confirm with official providers.
        </p>
      </div>
    </div>
  );
}
