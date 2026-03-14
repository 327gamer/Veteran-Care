
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSavedResources } from "@/lib/store";
import { 
  ChevronRight,
  MapPin,
  MessageSquare,
  Sparkles,
  BookOpen,
  Phone,
  HelpCircle,
  Bot,
  Search,
  AlertTriangle,
  Clock,
  CalendarDays,
  Info,
  ArrowRight,
  Compass,
  Globe,
} from "lucide-react";
import { useLocation } from "wouter";
import logoImg from "@assets/Veteran_Care_-_Shadow_-_PNG_1772598034200.png";
import { platform, t } from "@shared/platform";
import { getCategoryConfig, type SupabaseCategory } from "@/lib/category-config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import NavigatorModal from "@/components/navigator-modal";
import AuthModal from "@/components/auth-modal";
import { useAuth } from "@/lib/use-auth";


const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", 
  "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", 
  "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", 
  "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
  "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const STATE_CODES: Record<string, string> = {
  Alabama:"AL",Alaska:"AK",Arizona:"AZ",Arkansas:"AR",California:"CA",Colorado:"CO",Connecticut:"CT",Delaware:"DE",Florida:"FL",Georgia:"GA",
  Hawaii:"HI",Idaho:"ID",Illinois:"IL",Indiana:"IN",Iowa:"IA",Kansas:"KS",Kentucky:"KY",Louisiana:"LA",Maine:"ME",Maryland:"MD",
  Massachusetts:"MA",Michigan:"MI",Minnesota:"MN",Mississippi:"MS",Missouri:"MO",Montana:"MT",Nebraska:"NE",Nevada:"NV","New Hampshire":"NH","New Jersey":"NJ",
  "New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND",Ohio:"OH",Oklahoma:"OK",Oregon:"OR",Pennsylvania:"PA","Rhode Island":"RI","South Carolina":"SC",
  "South Dakota":"SD",Tennessee:"TN",Texas:"TX",Utah:"UT",Vermont:"VT",Virginia:"VA",Washington:"WA","West Virginia":"WV",Wisconsin:"WI",Wyoming:"WY"
};

const CITIES_BY_STATE: Record<string, string[]> = {
  "Texas": ["Austin", "Dallas", "Houston", "San Antonio", "Fort Worth"],
  "South Carolina": ["Charleston", "Columbia", "Greenville", "Myrtle Beach", "Spartanburg"],
  "California": ["Los Angeles", "San Diego", "San Francisco", "Sacramento", "San Jose"],
  "Florida": ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg"],
  "default": ["City 1", "City 2", "City 3"] 
};

export default function Home() {
  const [, setLocation] = useLocation();
  const { userLocation, setLocation: setStoreLocation } = useSavedResources();
  const [selectedState, setSelectedState] = useState<string>(userLocation.state || "Texas");
  const [selectedCity, setSelectedCity] = useState<string>(userLocation.city || "Austin");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("signup");
  const [showGuidedHelp, setShowGuidedHelp] = useState(false);
  const [guidedCategory, setGuidedCategory] = useState<string | null>(null);
  const [guidedUrgency, setGuidedUrgency] = useState<string | null>(null);
  const { user } = useAuth();

  const { data: categories = [] } = useQuery<SupabaseCategory[]>({
    queryKey: ["/api/categories"],
    queryFn: () => fetch("/api/categories").then(r => r.json()),
  });

  useEffect(() => {
    setSelectedState(userLocation.state);
    setSelectedCity(userLocation.city);
  }, [userLocation]);

  const handleCategoryClick = (category: string) => {
    setLocation(`/resources?category=${encodeURIComponent(category)}`);
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    const cities = CITIES_BY_STATE[state] || CITIES_BY_STATE["default"];
    setSelectedCity(cities[0]);
  };

  const saveLocation = () => {
    const code = STATE_CODES[selectedState] || selectedState;
    setStoreLocation(code, selectedState, selectedCity, "");
    setIsLocationOpen(false);
  };

  const getCities = (state: string) => {
    return CITIES_BY_STATE[state] || CITIES_BY_STATE["default"];
  };

  const openTutorial = () => {
    window.dispatchEvent(new CustomEvent("open-tutorial"));
  };

  const openGuide = () => {
    window.dispatchEvent(new CustomEvent("open-ai-guide"));
  };

  const GUIDED_CATEGORIES = [
    { slug: "va-benefits", label: "VA Benefits & Claims" },
    { slug: "housing", label: "Housing" },
    { slug: "employment", label: "Employment" },
    { slug: "mental-health", label: "Mental Health" },
    { slug: "education", label: "Education" },
    { slug: "legal", label: "Legal Help" },
    { slug: "financial", label: "Financial Help" },
    { slug: "healthcare", label: "Healthcare" },
    { slug: "family-support", label: "Family Support" },
    { slug: "substance-recovery", label: "Substance Recovery" },
    { slug: "food-assistance", label: "Food Assistance" },
    { slug: "community-support", label: "Community Support" },
    { slug: "transportation", label: "Transportation" },
  ];

  const URGENCY_OPTIONS = [
    { value: "immediate", label: "I need help now", desc: "Crisis or emergency", icon: AlertTriangle, color: "border-red-300 bg-red-50 text-red-800 hover:border-red-400", selected: "border-red-500 bg-red-100 ring-2 ring-red-200" },
    { value: "same_week", label: "This week", desc: "Urgent, not emergency", icon: Clock, color: "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400", selected: "border-amber-500 bg-amber-100 ring-2 ring-amber-200" },
    { value: "standard", label: "When available", desc: "Can wait for the right help", icon: CalendarDays, color: "border-blue-300 bg-blue-50 text-blue-800 hover:border-blue-400", selected: "border-blue-500 bg-blue-100 ring-2 ring-blue-200" },
    { value: "information", label: "Just exploring", desc: "Looking for information", icon: Info, color: "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400", selected: "border-slate-500 bg-slate-100 ring-2 ring-slate-200" },
  ];

  const handleGuidedContinue = () => {
    if (!guidedCategory) return;
    const params = new URLSearchParams();
    params.set("category", guidedCategory);
    if (guidedUrgency) params.set("urgency", guidedUrgency);
    setShowGuidedHelp(false);
    setGuidedCategory(null);
    setGuidedUrgency(null);
    setLocation(`/resources?${params.toString()}`);
  };

  const handleGuidedRequestNavigator = () => {
    setShowGuidedHelp(false);
    setShowNavigator(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Brand Header */}
      <section className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 py-10 flex flex-col items-center justify-center text-center space-y-5 mb-6 bg-white">
        <div className="h-56 md:h-64 w-full max-w-[364px] md:max-w-[400px] flex items-center justify-center drop-shadow-2xl">
          <img src={logoImg} alt={platform.name} className="h-full w-full object-contain" />
        </div>
        <div className="space-y-2 px-6">
          <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Welcome to {platform.name}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">{platform.longDescription}</p>
        </div>
      </section>

      {!user && (
        <section data-testid="banner-guest-signup" className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              <h2 className="text-xl font-heading font-extrabold text-primary tracking-tight">Create Your Free Account</h2>
              <p className="text-sm text-muted-foreground">Save your preferences and get personalized support.</p>
              <p className="text-xs text-primary/60 font-medium">Your information is private and confidential.</p>
            </div>
            <Button
              data-testid="button-home-signup"
              className="shrink-0 rounded-full px-5"
              onClick={() => { setAuthModalMode("signup"); setShowAuthModal(true); }}
            >
              Create Account
            </Button>
          </div>
          <button
            type="button"
            data-testid="button-home-signin"
            className="text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
            onClick={() => { setAuthModalMode("login"); setShowAuthModal(true); }}
          >
            Already have an account? Sign in
          </button>
        </section>
      )}

      {/* Location Badge */}
      <section className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">How can we help you today?</h2>
        
        <Dialog open={isLocationOpen} onOpenChange={setIsLocationOpen}>
          <DialogTrigger asChild>
            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors py-1.5 px-3">
              <MapPin className="mr-1 h-3.5 w-3.5" />
              {userLocation.city && userLocation.stateCode
                ? `${userLocation.city}, ${userLocation.stateCode}`
                : userLocation.city || userLocation.state || "Set Location"}
              <ChevronRight className="ml-1 h-3 w-3 opacity-50" />
            </Badge>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Set Your Location</DialogTitle>
              <p className="text-sm text-muted-foreground">
                We'll show you resources relevant to your area.
              </p>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={selectedState} onValueChange={handleStateChange}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger id="city">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCities(selectedState).map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={saveLocation} className="w-full">Save Location</Button>
          </DialogContent>
        </Dialog>
      </section>

      {/* AI Guide Welcome Panel */}
      <section data-testid="section-guide-welcome">
        <Card className="bg-gradient-to-br from-primary to-primary/90 text-white border-none shadow-lg overflow-hidden relative">
          <div className="absolute right-0 top-0 h-40 w-40 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="absolute left-0 bottom-0 h-24 w-24 bg-white/5 rounded-full blur-2xl -ml-8 -mb-8"></div>
          <CardContent className="p-5 space-y-4 relative">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-full bg-white/15 flex items-center justify-center border border-white/20 shrink-0">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-heading font-bold text-base">How can I help you today?</p>
                <p className="text-primary-foreground/85 text-sm leading-relaxed">
                  {t(platform.ai.guideIntro)}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: "button-ask-guide-home", icon: Sparkles, label: platform.ai.assistantName, onClick: openGuide },
                { id: "button-browse-resources-home", icon: BookOpen, label: "Resources", onClick: () => setLocation("/resources") },
                { id: "button-guided-help-home", icon: Compass, label: "Get Help", onClick: () => setShowGuidedHelp(true) },
                { id: "button-learn-app-home", icon: HelpCircle, label: "How It Works", onClick: openTutorial },
              ].map(({ id, icon: Icon, label, onClick }) => (
                <Button
                  key={id}
                  data-testid={id}
                  variant="secondary"
                  className="w-full text-primary font-semibold shadow-md h-14 rounded-xl flex items-center justify-start pl-3 pr-2 whitespace-nowrap"
                  onClick={onClick}
                >
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mr-2.5">
                    <Icon className="h-4 w-4 text-primary" />
                  </span>
                  <span className="text-[12.5px] md:text-[13px]">{label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>


      <NavigatorModal open={showNavigator} onOpenChange={setShowNavigator} initialUrgency={guidedUrgency || undefined} source={guidedUrgency ? "guided_help" : undefined} />

      <Dialog open={showGuidedHelp} onOpenChange={(v) => { if (!v) { setGuidedCategory(null); setGuidedUrgency(null); } setShowGuidedHelp(v); }}>
        <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              How can we help?
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Tell us what you need and we'll point you in the right direction.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-2">
              <Label className="text-xs font-medium">What do you need help with?</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {GUIDED_CATEGORIES.map((cat) => {
                  const config = getCategoryConfig(cat.slug);
                  const CatIcon = config.icon;
                  const isSelected = guidedCategory === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      data-testid={`button-guided-category-${cat.slug}`}
                      type="button"
                      onClick={() => setGuidedCategory(cat.slug)}
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
                  const isSelected = guidedUrgency === opt.value;
                  return (
                    <button
                      key={opt.value}
                      data-testid={`button-guided-urgency-${opt.value}`}
                      type="button"
                      onClick={() => setGuidedUrgency(opt.value)}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all ${isSelected ? opt.selected + " " + opt.color.split(" ").slice(1).join(" ") : opt.color}`}
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

            {guidedUrgency === "immediate" && (
              <div data-testid="guided-crisis-banner" className="rounded-lg border border-red-300 bg-red-50 p-3 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
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
                data-testid="button-guided-find-resources"
                className="flex-1 h-10"
                disabled={!guidedCategory}
                onClick={handleGuidedContinue}
              >
                Find Resources
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
              <Button
                data-testid="button-guided-request-navigator"
                variant="outline"
                className="h-10 border-primary/30 text-primary"
                onClick={handleGuidedRequestNavigator}
              >
                <Phone className="mr-1.5 h-4 w-4" />
                Request Support
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Resources Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Resources</h2>
        </div>
        <div
          data-testid="home-search-resources"
          className="relative cursor-pointer"
          onClick={() => setLocation("/resources")}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <div className="w-full h-10 pl-9 pr-4 rounded-lg border bg-background text-sm text-muted-foreground/60 flex items-center">
            Search resources (VA benefits, housing, jobs...)
          </div>
        </div>

        <section data-testid="crisis-line-banner" className="rounded-xl bg-red-600 text-white p-2.5 shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 mb-1.5">
            <Phone className="h-4 w-4 shrink-0" />
            <h3 className="font-heading font-bold text-sm">Veterans Crisis Line — 24/7 Support</h3>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <a href="tel:988" data-testid="link-crisis-call" className="flex items-center justify-center gap-0.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors py-1.5 px-1 text-center">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[11px] font-semibold leading-tight">Call 988, Press 1</span>
            </a>
            <a href="sms:838255" data-testid="link-crisis-text" className="flex items-center justify-center gap-0.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors py-1.5 px-1 text-center">
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[11px] font-semibold leading-tight">Text 838255</span>
            </a>
            <a href="https://www.veteranscrisisline.net" target="_blank" rel="noopener noreferrer" data-testid="link-crisis-chat" className="flex items-center justify-center gap-0.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors py-1.5 px-1 text-center">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <span className="text-[11px] font-semibold leading-tight">Chat Online</span>
            </a>
          </div>
          <a href="https://www.veteranscrisisline.net" target="_blank" rel="noopener noreferrer" data-testid="link-crisis-website" className="block w-full text-center rounded-full bg-white text-red-600 font-bold text-xs py-1.5 hover:bg-white/90 transition-colors">
            VeteransCrisisLine.net
          </a>
        </section>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {categories.map((cat) => {
            const config = getCategoryConfig(cat.slug);
            const Icon = config.icon;
            return (
              <Card 
                key={cat.id} 
                className="hover:border-primary/50 transition-colors cursor-pointer h-full group"
                onClick={() => handleCategoryClick(cat.slug)}
              >
                <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                  <div className={`h-10 w-10 rounded-full ${config.bg} flex items-center justify-center ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {cat.name}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      
      {/* Spacer for bottom nav */}
      <div className="h-8"></div>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultMode={authModalMode}
      />
    </div>
  );
}
