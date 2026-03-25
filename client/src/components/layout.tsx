
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { platform, t } from "@shared/platform";
import { 
  Search, 
  User, 
  Settings, 
  Home, 
  BookOpen, 
  MessageSquare, 
  ShieldCheck, 
  ShoppingBag,
  MapPin,
  Bot,
  Bell,
  Sparkles,
  Heart,
  X,
  ChevronRight,
  ArrowDown,
  LogIn,
  LogOut,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AiGuide from "./ai-guide";
import AuthModal from "./auth-modal";
import ProfileModal from "./profile-modal";
import logoImg from "@assets/Veteran_Care_-_Shadow_-_PNG_1772598034200.png";
import { useSavedResources, syncSavedOnLogin, fetchSavedFromServer } from "@/lib/store";
import { useAuth } from "@/lib/use-auth";

const BOTTOM_NAV_ITEMS = [
  { icon: BookOpen, label: "Resources", desc: "Browse programs and services." },
  { icon: ShieldCheck, label: "Trusted Services & Products", desc: "Vetted professionals and providers for veterans." },
  { icon: ShoppingBag, label: "Shop", desc: "Explore trusted partners and services." },
  { icon: Heart, label: "My Saved", desc: "Resources you mark as favorites." },
  { icon: MessageSquare, label: "Community", desc: "Connect with others." },
];

const TOP_HEADER_ITEMS = [
  { icon: MapPin, label: "Location", desc: "Find resources near you. (By Location)." },
  { icon: Search, label: "Search", desc: "Browse resources." },
  { icon: Sparkles, label: platform.ai.assistantName, desc: "An AI-powered assistant that helps find resources, get guidance, and navigate support services based on needs and location." },
  { icon: Bell, label: "Notifications", desc: "View updates about saved resources, messages and responses." },
  { icon: UserCircle, label: "Profile", desc: "Manage your account and service information." },
  { icon: Settings, label: "Settings", desc: "Control your preferences and account options." },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { hasSeenTutorial, markTutorialSeen, onboardingComplete, setAuthToken, setSavedIds, clearAuthState } = useSavedResources();
  const [showTutorial, setShowTutorial] = useState(false);
  const [guideGlow, setGuideGlow] = useState(true);
  const { user, session, loading: authLoading, signOut } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => setGuideGlow(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (session?.access_token) {
      setAuthToken(session.access_token);
      syncSavedOnLogin(session.access_token).then((ids) => {
        setSavedIds(ids);
      });
    } else if (!authLoading) {
      clearAuthState();
    }
  }, [session?.access_token, authLoading, setAuthToken, setSavedIds, clearAuthState]);

  useEffect(() => {
    if (onboardingComplete && !hasSeenTutorial) {
      const timer = setTimeout(() => setShowTutorial(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [onboardingComplete, hasSeenTutorial]);

  const dismissTutorial = () => {
    setShowTutorial(false);
    markTutorialSeen();
  };

  useEffect(() => {
    const handler = () => setIsAiOpen(true);
    window.addEventListener("open-ai-guide", handler);
    return () => window.removeEventListener("open-ai-guide", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      setShowTutorial(true);
    };
    window.addEventListener("open-tutorial", handler);
    return () => window.removeEventListener("open-tutorial", handler);
  }, []);

  const isActive = (path: string) => location === path;

  const handleSignOut = async () => {
    await signOut();
    clearAuthState();
  };

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "JD";

  return (
    <div className="min-h-screen bg-background font-sans overscroll-contain pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
      {/* Top Bar - Persistent */}
      <header className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Left: Logo */}
          <Link href="/home" className="flex items-center gap-2 group shrink-0">
            <div className="relative h-12 w-14 overflow-hidden rounded-md bg-white transition-opacity hover:opacity-90 shadow-sm border border-white/20 flex items-center justify-center p-1">
               <img src={logoImg} alt={platform.name} className="h-full w-full object-contain" />
               <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 bg-white/90 rounded-t-sm px-1.5 py-px">
                 <Home className="h-2.5 w-2.5 text-primary" />
               </div>
            </div>
            <span className="font-heading text-lg font-bold tracking-tight hidden sm:block">{platform.name}</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-6">
            <Link href="/resources" onClick={() => window.dispatchEvent(new CustomEvent("close-resource-detail"))} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive('/resources') ? 'bg-white/20 text-white' : 'text-primary-foreground/70 hover:text-white hover:bg-white/10'}`}>
              <BookOpen className="h-4 w-4" />
              Resources
            </Link>
            <Link href="/trusted-services" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive('/trusted-services') ? 'bg-white/20 text-white' : 'text-primary-foreground/70 hover:text-white hover:bg-white/10'}`}>
              <ShieldCheck className="h-4 w-4" />
              Trusted Services
            </Link>
            <Link href="/shop" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive('/shop') ? 'bg-white/20 text-white' : 'text-primary-foreground/70 hover:text-white hover:bg-white/10'}`}>
              <ShoppingBag className="h-4 w-4" />
              Shop
            </Link>
            <Link href="/saved-resources" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive('/saved-resources') ? 'bg-white/20 text-white' : 'text-primary-foreground/70 hover:text-white hover:bg-white/10'}`}>
              <Heart className="h-4 w-4" />
              My Saved
            </Link>
            <Link href="/community" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive('/community') ? 'bg-white/20 text-white' : 'text-primary-foreground/70 hover:text-white hover:bg-white/10'}`}>
              <MessageSquare className="h-4 w-4" />
              Community
            </Link>
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 border border-white/5"
              onClick={() => {
                if (window.location.pathname === "/resources") {
                  window.location.href = "/resources?mode=nearme";
                } else {
                  setLocation("/resources?mode=nearme");
                }
              }}
              data-testid="button-location-top"
            >
              <MapPin className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 border border-white/5"
              onClick={() => {
                if (window.location.pathname === "/resources") {
                  window.location.href = "/resources";
                } else {
                  setLocation("/resources");
                }
              }}
              data-testid="button-search-top"
            >
              <Search className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className={`text-primary-foreground bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 border border-white/5 transition-shadow duration-700 ${guideGlow ? 'guide-glow' : ''}`}
              onClick={() => { setIsAiOpen(true); setGuideGlow(false); }}
              title={`Ask the ${platform.ai.assistantName}`}
            >
              <Sparkles className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" className="text-primary-foreground bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 border border-white/5 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-orange-500 rounded-full border-2 border-primary"></span>
            </Button>

            {/* Profile / Auth Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  data-testid="button-profile"
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 border border-white/5 font-bold text-sm"
                >
                  {user ? userInitials : <User className="h-5 w-5" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {user ? (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Signed in</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      data-testid="button-my-profile"
                      onClick={() => setIsProfileOpen(true)}
                      className="cursor-pointer"
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      My Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      data-testid="button-sign-out"
                      onClick={handleSignOut}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-xs text-muted-foreground">Sign in to sync saved resources across devices</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      data-testid="button-sign-in"
                      onClick={() => setIsAuthOpen(true)}
                      className="cursor-pointer"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In / Create Account
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" size="icon" className="text-primary-foreground bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 border border-white/5">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6 lg:p-8 max-w-5xl">
        {children}
      </main>

      {/* AI Guide Modal */}
      <AiGuide open={isAiOpen} onOpenChange={setIsAiOpen} />

      {/* Auth Modal */}
      <AuthModal open={isAuthOpen} onOpenChange={setIsAuthOpen} />

      {/* Profile Modal */}
      <ProfileModal open={isProfileOpen} onOpenChange={setIsProfileOpen} />

      {/* Bottom Navigation - Mobile First */}
      <nav
        className="fixed bottom-0 left-0 right-0 w-full z-[100] border-t shadow-[0_-2px_8px_rgba(0,0,0,0.08)] lg:hidden"
        style={{ backgroundColor: 'hsl(var(--background))', paddingBottom: 'env(safe-area-inset-bottom, 0px)', willChange: 'transform', transform: 'translateZ(0)' }}
      >
        <div className="flex h-16 items-center justify-around px-2">
          <Link href="/resources" onClick={() => window.dispatchEvent(new CustomEvent("close-resource-detail"))} className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/resources') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
            <BookOpen className={`h-5 w-5 ${isActive('/resources') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Resources</span>
          </Link>

          <Link href="/trusted-services" className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/trusted-services') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
            <ShieldCheck className={`h-5 w-5 ${isActive('/trusted-services') ? 'fill-current' : ''}`} />
            <span className="text-[9px] font-medium text-center leading-tight">Trusted<br/>Services</span>
          </Link>

          <Link href="/shop" className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/shop') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
            <ShoppingBag className={`h-5 w-5 ${isActive('/shop') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Shop</span>
          </Link>

          <Link href="/saved-resources" className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/saved-resources') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
            <Heart className={`h-5 w-5 ${isActive('/saved-resources') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium text-center leading-tight">My Saved</span>
          </Link>

          <Link href="/community" className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/community') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
            <MessageSquare className={`h-5 w-5 ${isActive('/community') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Community</span>
          </Link>
        </div>
      </nav>

      {showTutorial && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center animate-in fade-in duration-300">
          <div className="bg-background rounded-t-2xl md:rounded-2xl w-full max-w-sm mx-auto p-4 pb-6 md:mb-0 space-y-2 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-primary">Quick Navigation Guide</h3>
              <Button
                data-testid="button-dismiss-tutorial"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground"
                onClick={dismissTutorial}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Getting around is easy:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 pl-1">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>On <strong>mobile</strong>, use the top icons and bottom menu bar</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>On <strong>desktop</strong>, use the top navigation and icons</span>
              </li>
            </ul>
            <div className="border-t pt-3 mt-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Navigation Items</p>
              <div className="space-y-1">
                {BOTTOM_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-2.5 p-1.5 rounded-lg bg-muted/40">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="border-t pt-3 mt-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Top Header Icons</p>
              <div className="space-y-1">
                {TOP_HEADER_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-2.5 p-1.5 rounded-lg bg-muted/40">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 mt-2">
              <p className="text-xs font-semibold text-primary mb-1">How to navigate {platform.name}:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• <strong>Mobile:</strong> use the top icons and bottom navigation bar</li>
                <li>• <strong>Desktop:</strong> use the top navigation menu and icons</li>
                <li>• Quickly search, save resources, and get help anytime</li>
              </ul>
            </div>
            <Button
              data-testid="button-got-it"
              className="w-full h-10 text-sm font-bold rounded-full"
              onClick={dismissTutorial}
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
