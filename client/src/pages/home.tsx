
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSavedResources } from "@/lib/store";
import { 
  ChevronRight,
  MapPin,
  MessageSquare,
  ThumbsUp,
  Share2,
  Sparkles,
  User,
  X,
  Shield,
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
} from "lucide-react";
import { Link, useLocation } from "wouter";
import logoImg from "@assets/Veteran_Care_-_Shadow_-_PNG_1772598034200.png";
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

const feedItems = [
  { 
    id: 1,
    type: 'post', 
    user: 'Sgt. Miller', 
    avatar: 'SM',
    time: '2h ago', 
    content: 'Has anyone had success with the new PACT Act claims process? Looking for advice on gathering evidence specifically for burn pit exposure.', 
    likes: 24, 
    comments: 8,
    group: 'Benefits Help'
  },
  { 
    id: 2,
    type: 'post', 
    user: 'VetTech_22', 
    avatar: 'VT',
    time: '3h ago', 
    content: 'Just completed my free coding bootcamp through VET TEC. Highly recommend for anyone looking to transition into tech careers.', 
    likes: 45, 
    comments: 12,
    group: 'Career & Education'
  },
  { 
    id: 3,
    type: 'ad', 
    title: 'USAA Auto Insurance', 
    content: 'Exclusive rates for veterans and military families. Save up to 30%.', 
    cta: 'Get a Quote',
    group: 'Job Opportunities'
  },
  { 
    id: 4,
    type: 'post', 
    user: 'Marine Mom', 
    avatar: 'MM',
    time: '5h ago', 
    content: 'Looking for recommendations for mental health support groups in the Charleston area. Thanks in advance.', 
    likes: 18, 
    comments: 23,
    group: 'Family Support'
  },
  { 
    id: 5,
    type: 'ad', 
    title: 'Veterans United', 
    content: 'Use your VA Loan benefit today. $0 Down. Low Rates. 24/7 Support.', 
    cta: 'Apply Now'
  },
];

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
  const { userLocation, setLocation: setStoreLocation, serviceProfile, setServiceProfile } = useSavedResources();
  const [selectedState, setSelectedState] = useState<string>(userLocation.state || "Texas");
  const [selectedCity, setSelectedCity] = useState<string>(userLocation.city || "Austin");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [showGuidedHelp, setShowGuidedHelp] = useState(false);
  const [guidedCategory, setGuidedCategory] = useState<string | null>(null);
  const [guidedUrgency, setGuidedUrgency] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    branch: serviceProfile.branch || "",
    era: serviceProfile.era || "",
    rank: serviceProfile.rank || "",
    mos: serviceProfile.mos || "",
  });

  const saveProfile = () => {
    setServiceProfile(profileForm);
    setShowProfileDialog(false);
  };

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
      <section className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 py-10 flex flex-col items-center justify-center text-center space-y-4 mb-6 bg-white">
        <div className="h-40 w-full max-w-[260px] flex items-center justify-center drop-shadow-2xl">
          <img src={logoImg} alt="Veteran Care" className="h-full w-full object-contain" />
        </div>
        <div className="space-y-2 px-6">
          <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">Welcome to Veteran Care</h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">Welcome to Veteran Care — your comprehensive resource center connecting veterans, their families, and loved ones to trusted support and services. Veteran Care helps you quickly find benefits, healthcare, housing assistance, employment programs, legal help, and other local resources in one place.</p>
        </div>
      </section>

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
                  I'm your Veteran Care Guide. I can help you find benefits, healthcare services, housing support, employment opportunities, and trusted local resources for veterans and their families.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                data-testid="button-ask-guide-home"
                variant="secondary"
                className="w-full text-primary font-semibold shadow-md h-10 text-sm"
                onClick={openGuide}
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                Ask the Guide
              </Button>
              <Button
                data-testid="button-browse-resources-home"
                variant="secondary"
                className="w-full text-primary font-semibold shadow-md h-10 text-sm"
                onClick={() => setLocation("/resources")}
              >
                <BookOpen className="mr-1.5 h-4 w-4" />
                Browse Resources
              </Button>
              <Button
                data-testid="button-guided-help-home"
                variant="secondary"
                className="w-full text-primary font-semibold shadow-md h-10 text-sm"
                onClick={() => setShowGuidedHelp(true)}
              >
                <Compass className="mr-1.5 h-4 w-4" />
                Get Help
              </Button>
              <Button
                data-testid="button-learn-app-home"
                variant="secondary"
                className="w-full text-primary font-semibold shadow-md h-10 text-sm"
                onClick={openTutorial}
              >
                <HelpCircle className="mr-1.5 h-4 w-4" />
                How It Works
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Service Profile Prompt */}
      {!serviceProfile.branch && (
        <section data-testid="section-profile-prompt" className="animate-in fade-in slide-in-from-top-4 duration-500">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="text-sm text-foreground leading-relaxed">
                    For a more personalized experience you can add your service information such as branch and service era. Your information is private and confidential.
                  </p>
                  <Button
                    data-testid="button-add-profile"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-primary/30 text-primary"
                    onClick={() => setShowProfileDialog(true)}
                  >
                    <Shield className="mr-1.5 h-3 w-3" />
                    Complete Your Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

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

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Service Profile
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Optional. Helps us personalize your experience. Your information is private and confidential.
            </p>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs">Branch</Label>
              <Select value={profileForm.branch || undefined} onValueChange={(v) => setProfileForm(p => ({ ...p, branch: v }))}>
                <SelectTrigger data-testid="select-profile-branch"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="army">Army</SelectItem>
                  <SelectItem value="navy">Navy</SelectItem>
                  <SelectItem value="marines">Marine Corps</SelectItem>
                  <SelectItem value="airforce">Air Force</SelectItem>
                  <SelectItem value="coastguard">Coast Guard</SelectItem>
                  <SelectItem value="spaceforce">Space Force</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Service Era</Label>
              <Select value={profileForm.era || undefined} onValueChange={(v) => setProfileForm(p => ({ ...p, era: v }))}>
                <SelectTrigger data-testid="select-profile-era"><SelectValue placeholder="Select Era" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="post911">Post-9/11</SelectItem>
                  <SelectItem value="gulfwar">Gulf War</SelectItem>
                  <SelectItem value="vietnam">Vietnam</SelectItem>
                  <SelectItem value="korea">Korean War</SelectItem>
                  <SelectItem value="peacetime">Peacetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Rank (optional)</Label>
              <Input
                data-testid="input-profile-rank"
                placeholder="e.g. SGT, CPL, PFC"
                value={profileForm.rank}
                onChange={(e) => setProfileForm(p => ({ ...p, rank: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">MOS / Specialty (optional)</Label>
              <Input
                data-testid="input-profile-mos"
                placeholder="e.g. 11B, 68W"
                value={profileForm.mos}
                onChange={(e) => setProfileForm(p => ({ ...p, mos: e.target.value }))}
              />
            </div>
          </div>
          <Button data-testid="button-save-profile" className="w-full" onClick={saveProfile}>
            Save Profile
          </Button>
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
            Search all resources (housing, VA benefits, food assistance...)
          </div>
        </div>
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

      {/* Community Feed with Ads */}
      <section className="space-y-4 pt-4">
        <h2 className="text-lg font-heading font-semibold">Community Feed</h2>
        
        <div className="space-y-4">
          {feedItems.map((item) => (
            <div key={item.id}>
              {item.type === 'post' ? (
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm">
                        {item.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">{item.user}</p>
                          <span className="text-xs text-muted-foreground">{item.time}</span>
                        </div>
                        <p className="text-xs text-primary font-medium">{item.group}</p>
                      </div>
                    </div>
                    <p className="text-sm mb-4 leading-relaxed">{item.content}</p>
                    <div className="flex items-center justify-between pt-2 border-t text-muted-foreground">
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                        <ThumbsUp className="h-3.5 w-3.5" /> {item.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                        <MessageSquare className="h-3.5 w-3.5" /> {item.comments}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
                        <Share2 className="h-3.5 w-3.5" /> Share
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden border-none bg-muted/30 shadow-sm relative">
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-background/80 rounded text-[9px] font-medium text-muted-foreground uppercase tracking-wider border">Sponsored</div>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2">
                      <p className="font-bold text-base">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.content}</p>
                      <Button variant="outline" className="w-full mt-2 text-xs h-8 border-primary/20 text-primary hover:bg-primary/5">
                        {item.cta} <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      </section>
      
      {/* Spacer for bottom nav */}
      <div className="h-8"></div>
    </div>
  );
}
