import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getCategoryConfig } from "@/lib/category-config";
import NavigatorModal from "@/components/navigator-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useIsMobile } from "@/hooks/use-mobile";
import CampaignHeroVideo from "@/components/campaign-hero-video";

const GUIDED_CATEGORIES = [
  { slug: "crisis-help", label: "Crisis Help" },
  { slug: "mental-health", label: "Mental Health" },
  { slug: "disabled-veterans", label: "Disabled Veterans" },
  { slug: "housing-home", label: "Housing & Home Services" },
  { slug: "food-assistance", label: "Food Assistance" },
  { slug: "benefits-assistance", label: "Benefits Assistance" },
  { slug: "family-support", label: "Family Support" },
  { slug: "community-support", label: "Community Support" },
  { slug: "employment-support", label: "Employment Support" },
  { slug: "education-training", label: "Education & Training" },
  { slug: "transportation", label: "Transportation" },
  { slug: "financial-credit", label: "Financial & Credit Services" },
  { slug: "legal-services", label: "Legal Services" },
  { slug: "healthcare-services", label: "Healthcare" },
  { slug: "wellness-recovery", label: "Wellness & Recovery" },
  { slug: "end-of-life-services", label: "End of Life Services" },
];

const URGENCY_OPTIONS = [
  { value: "immediate", label: "I need help now", desc: "Crisis or emergency", icon: AlertTriangle, color: "border-red-300 bg-red-50 text-red-800 hover:border-red-400", selected: "border-red-500 bg-red-100 ring-2 ring-red-200" },
  { value: "same_week", label: "This week", desc: "Urgent, not emergency", icon: Clock, color: "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400", selected: "border-amber-500 bg-amber-100 ring-2 ring-amber-200" },
  { value: "standard", label: "When available", desc: "Can wait for the right help", icon: CalendarDays, color: "border-blue-300 bg-blue-50 text-blue-800 hover:border-blue-400", selected: "border-blue-500 bg-blue-100 ring-2 ring-slate-200" },
  { value: "information", label: "Just exploring", desc: "Looking for information", icon: Info, color: "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400", selected: "border-slate-500 bg-slate-100 ring-2 ring-slate-200" },
];

function GetHelpContent({
  selectedCategory,
  setSelectedCategory,
  selectedUrgency,
  setSelectedUrgency,
  handleFindResources,
  handleRequestNavigator,
}: {
  selectedCategory: string | null;
  setSelectedCategory: (v: string | null) => void;
  selectedUrgency: string | null;
  setSelectedUrgency: (v: string | null) => void;
  handleFindResources: () => void;
  handleRequestNavigator: () => void;
}) {
  return (
    <div className="space-y-4 py-1">
      <div className="space-y-2">
        <Label className="text-xs font-medium">What do you need help with?</Label>
        <div className="grid grid-cols-2 gap-1.5">
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
                className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/30 font-semibold"
                    : "border-border hover:border-primary/40 hover:bg-primary/5"
                }`}
              >
                <CatIcon className="h-3.5 w-3.5 shrink-0" />
                <span className="leading-tight">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">How soon do you need help?</Label>
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
                className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all ${
                  isSelected ? opt.selected + " " + opt.color.split(" ").slice(1).join(" ") : opt.color
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

      {selectedUrgency === "immediate" && (
        <div
          data-testid="get-help-crisis-banner"
          className="rounded-lg border border-red-300 bg-red-50 p-3 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <p className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            If you are in crisis right now:
          </p>
          <a href="tel:988" className="flex items-center gap-2 text-xs font-bold text-red-700 hover:underline">
            <Phone className="h-3.5 w-3.5" /> Call 988 (Suicide & Crisis Lifeline)
          </a>
          <a href="tel:18002738255" className="flex items-center gap-2 text-xs font-bold text-red-700 hover:underline">
            <Phone className="h-3.5 w-3.5" /> Veterans Crisis Line: 1-800-273-8255 (Press 1)
          </a>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          data-testid="get-help-find-resources"
          className="flex-1 h-10"
          disabled={!selectedCategory}
          onClick={handleFindResources}
        >
          Find Resources
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
        <Button
          data-testid="get-help-request-navigator"
          variant="outline"
          className="h-10 border-primary/30 text-primary"
          onClick={handleRequestNavigator}
        >
          <Phone className="mr-1.5 h-4 w-4" />
          Request Support
        </Button>
      </div>
    </div>
  );
}

export default function GetHelp() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUrgency, setSelectedUrgency] = useState<string | null>(null);
  const [showNavigator, setShowNavigator] = useState(false);
  const isMobile = useIsMobile();

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

  const handleClose = () => {
    setLocation("/home");
  };

  const contentProps = {
    selectedCategory,
    setSelectedCategory,
    selectedUrgency,
    setSelectedUrgency,
    handleFindResources,
    handleRequestNavigator,
  };

  return (
    <>
      {isMobile ? (
        <div className="flex flex-col min-h-full">
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-background sticky top-0 z-10">
            <button
              data-testid="get-help-back"
              onClick={handleClose}
              className="p-1 -ml-1 rounded-md hover:bg-muted"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <Compass className="h-5 w-5 text-primary" />
            <h1 className="text-base font-semibold">How can we help?</h1>
          </div>
          <div className="px-4 py-4">
            <CampaignHeroVideo audience="general" className="mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Tell us what you need and we'll point you in the right direction.
            </p>
            <GetHelpContent {...contentProps} />
          </div>
        </div>
      ) : (
        <Dialog open={true} onOpenChange={(v) => { if (!v) handleClose(); }}>
          <DialogContent className="sm:max-w-[440px] max-h-[85dvh] overflow-y-auto pb-8" style={{ WebkitOverflowScrolling: 'touch' }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-primary" />
                How can we help?
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Tell us what you need and we'll point you in the right direction.
              </p>
            </DialogHeader>
            <GetHelpContent {...contentProps} />
          </DialogContent>
        </Dialog>
      )}

      <NavigatorModal
        open={showNavigator}
        onOpenChange={setShowNavigator}
        initialUrgency={selectedUrgency || undefined}
        source="get_help_page"
      />
    </>
  );
}
