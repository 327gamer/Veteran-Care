
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Brand Header - Green Banner Style */}
      <section className="bg-primary -mx-4 md:-mx-6 -mt-4 md:-mt-6 py-10 flex flex-col items-center justify-center text-center space-y-4 shadow-lg mb-6">
        <div className="h-32 w-56 overflow-hidden rounded-xl bg-primary shadow-2xl border border-white/20 flex items-center justify-center">
          <img src={logoImg} alt="Veteran Care" className="h-full w-full object-cover" />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-heading font-extrabold text-white tracking-tight uppercase drop-shadow-md">Veteran Care</h1>
          <p className="text-primary-foreground/90 font-medium max-w-xs mx-auto text-sm">Your trusted guide to benefits, health, and local resources.</p>
        </div>
      </section>

      {/* Location Badge */}
      <section className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">Good Morning, Soldier</h2>
        
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
                  I'm your Veteran Care Guide. I can help you find benefits, healthcare, housing, and local veteran resources.
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
                data-testid="button-navigator-home"
                variant="secondary"
                className="w-full text-primary font-semibold shadow-md h-10 text-sm"
                onClick={() => setShowNavigator(true)}
              >
                <Phone className="mr-1.5 h-4 w-4" />
                Get Help Now
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

      <NavigatorModal open={showNavigator} onOpenChange={setShowNavigator} />

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
          <h2 className="text-lg font-heading font-semibold">Resources</h2>
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
