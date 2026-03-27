import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { platform } from "@shared/platform";
import { getCategoryConfig } from "@/lib/category-config";
import NavigatorModal from "@/components/navigator-modal";
import logoImg from "@assets/Veteran_Care_-_Shadow_-_PNG_1772598034200.png";
import {
  AlertTriangle,
  Clock,
  CalendarDays,
  Info,
  Phone,
  ArrowRight,
  Compass,
  ChevronLeft,
} from "lucide-react";

const GUIDED_CATEGORIES = [
  { slug: "va-benefits", label: "Benefits Assistance" },
  { slug: "housing", label: "Housing & Home Services" },
  { slug: "employment", label: "Employment Support" },
  { slug: "mental-health", label: "Mental Health" },
  { slug: "education", label: "Education & Training" },
  { slug: "legal", label: "Legal Services" },
  { slug: "financial", label: "Financial & Credit Services" },
  { slug: "healthcare", label: "Insurance Services" },
  { slug: "family-support", label: "Family Support" },
  { slug: "substance-recovery", label: "Wellness & Recovery" },
  { slug: "food-assistance", label: "Food Assistance" },
  { slug: "community-support", label: "Community Support" },
  { slug: "transportation", label: "Transportation" },
  { slug: "end-of-life-services", label: "End of Life Services" },
];

const URGENCY_OPTIONS = [
  { value: "immediate", label: "I need help now", desc: "Crisis or emergency", icon: AlertTriangle, color: "border-red-300 bg-red-50 text-red-800 hover:border-red-400", selected: "border-red-500 bg-red-100 ring-2 ring-red-200" },
  { value: "same_week", label: "This week", desc: "Urgent, not emergency", icon: Clock, color: "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400", selected: "border-amber-500 bg-amber-100 ring-2 ring-amber-200" },
  { value: "standard", label: "When available", desc: "Can wait for the right help", icon: CalendarDays, color: "border-blue-300 bg-blue-50 text-blue-800 hover:border-blue-400", selected: "border-blue-500 bg-blue-100 ring-2 ring-slate-200" },
  { value: "information", label: "Just exploring", desc: "Looking for information", icon: Info, color: "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400", selected: "border-slate-500 bg-slate-100 ring-2 ring-slate-200" },
];

export default function GetHelp() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUrgency, setSelectedUrgency] = useState<string | null>(null);
  const [showNavigator, setShowNavigator] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const cat = params.get("category");
    const urg = params.get("urgency");
    if (cat) setSelectedCategory(cat);
    if (urg) setSelectedUrgency(urg);
  }, [search]);

  const handleFindResources = () => {
    if (!selectedCategory) return;
    trackEvent("get_help_find_resources_click", {
      category: selectedCategory,
      ...(selectedUrgency ? { urgency: selectedUrgency } : {}),
    });
    const params = new URLSearchParams();
    params.set("category", selectedCategory);
    if (selectedUrgency) params.set("urgency", selectedUrgency);
    setLocation(`/resources?${params.toString()}`);
  };

  const handleRequestNavigator = () => {
    trackEvent("get_help_request_support_click", {
      ...(selectedCategory ? { category: selectedCategory } : {}),
    });
    setShowNavigator(true);
  };

  return (
    <div className="flex flex-col bg-background" style={{ height: '100dvh', minHeight: '100dvh' }}>

      {/* Header */}
      <div className="bg-primary px-4 pt-6 pb-5 sm:pt-10 sm:pb-8 flex flex-col items-center text-center shrink-0">
        <img
          src={logoImg}
          alt={platform.name}
          className="h-24 sm:h-40 w-auto object-contain drop-shadow-xl mb-3 sm:mb-5"
        />
        <div className="flex items-center gap-2 mb-1">
          <Compass className="h-5 w-5 text-white/80" />
          <h1 className="text-lg sm:text-xl font-heading font-extrabold text-white tracking-tight">
            How can we help you?
          </h1>
        </div>
        <p className="text-white/70 text-xs sm:text-sm leading-relaxed max-w-sm">
          Tell us what you need and we'll connect you to the right support near you.
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 sm:pt-6 pb-16 max-w-lg mx-auto w-full space-y-5 sm:space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">
            What do you need help with?
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {GUIDED_CATEGORIES.map((cat) => {
              const config = getCategoryConfig(cat.slug);
              const CatIcon = config.icon;
              const isSelected = selectedCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  data-testid={`get-help-category-${cat.slug}`}
                  type="button"
                  onClick={() => { trackEvent("get_help_category_selected", { category: cat.slug }); setSelectedCategory(cat.slug); }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30 font-semibold"
                      : "border-border hover:border-primary/40 hover:bg-primary/5 text-foreground"
                  }`}
                >
                  <CatIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="leading-tight">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Urgency */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">
            How soon do you need help?
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {URGENCY_OPTIONS.map((opt) => {
              const UrgIcon = opt.icon;
              const isSelected = selectedUrgency === opt.value;
              return (
                <button
                  key={opt.value}
                  data-testid={`get-help-urgency-${opt.value}`}
                  type="button"
                  onClick={() => { trackEvent("get_help_urgency_selected", { urgency: opt.value }); setSelectedUrgency(opt.value); }}
                  className={`flex items-start gap-2 p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? opt.selected + " " + opt.color.split(" ").slice(1).join(" ")
                      : opt.color
                  }`}
                >
                  <UrgIcon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold leading-tight">{opt.label}</p>
                    <p className="text-[10px] opacity-75 leading-tight mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Crisis banner */}
        {selectedUrgency === "immediate" && (
          <div
            data-testid="get-help-crisis-banner"
            className="rounded-xl border border-red-300 bg-red-50 p-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300"
          >
            <p className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              If you are in crisis right now:
            </p>
            <a
              href="tel:988"
              className="flex items-center gap-2 text-xs font-bold text-red-700 hover:underline"
            >
              <Phone className="h-3.5 w-3.5" />
              Call 988 — Suicide &amp; Crisis Lifeline
            </a>
            <a
              href="tel:18002738255"
              className="flex items-center gap-2 text-xs font-bold text-red-700 hover:underline"
            >
              <Phone className="h-3.5 w-3.5" />
              Veterans Crisis Line: 1-800-273-8255 (Press 1)
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            data-testid="get-help-find-resources"
            className="flex-1 h-11 text-sm font-bold"
            disabled={!selectedCategory}
            onClick={handleFindResources}
          >
            Find Resources
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
          <Button
            data-testid="get-help-request-navigator"
            variant="outline"
            className="h-11 border-primary/30 text-primary text-sm"
            onClick={handleRequestNavigator}
          >
            <Phone className="mr-1.5 h-4 w-4" />
            Request Support
          </Button>
        </div>

        {/* Back link */}
        <button
          data-testid="get-help-back"
          onClick={() => setLocation("/home")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Veteran Care
        </button>

        <p className="text-[11px] text-muted-foreground text-center pb-6">
          Free to use. No account required. Your information is private and secure.
        </p>
      </div>

      <NavigatorModal
        open={showNavigator}
        onOpenChange={setShowNavigator}
        initialUrgency={selectedUrgency || undefined}
        source="get_help_page"
      />
    </div>
  );
}
