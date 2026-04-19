import { useLocation } from "wouter";
import { ChevronLeft, Shield, Clock } from "lucide-react";

export default function Insurance() {
  const [, setLocation] = useLocation();
  return (
    <div className="flex flex-col">
      <div className="pt-1">
        <button
          data-testid="insurance-back-top"
          onClick={() => setLocation("/resources")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Resources
        </button>
      </div>

      <div className="bg-primary/5 border-b pt-3 pb-4 flex flex-col items-center text-center rounded-b-2xl mt-2">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-heading font-extrabold text-foreground tracking-tight">
            Insurance Services
          </h1>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
          Health, life, auto, home, disability, and Medicare-VA coordination
          for veterans and families.
        </p>
      </div>

      <div className="flex-1 py-8 max-w-md mx-auto w-full px-4">
        <div
          data-testid="insurance-coming-soon"
          className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex flex-col items-center text-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-700" />
          </div>
          <h2 className="text-base font-semibold text-amber-900">
            Coming Soon
          </h2>
          <p className="text-sm text-amber-800 leading-relaxed">
            We're verifying insurance providers and benefits coordinators
            before listing them here. Check back shortly — in the meantime,
            our AI Veteran Guide can help you with insurance questions.
          </p>
          <button
            data-testid="insurance-talk-ai"
            onClick={() => setLocation("/get-help")}
            className="mt-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Talk to AI Guide
          </button>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            data-testid="insurance-back"
            onClick={() => setLocation("/resources")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Browse other resources
          </button>
        </div>
      </div>
    </div>
  );
}
