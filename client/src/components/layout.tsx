
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Search, 
  User, 
  Settings, 
  Home, 
  BookOpen, 
  MessageSquare, 
  ShoppingBag, 
  MapPin,
  Bot,
  Bell,
  Sparkles,
  Heart,
  X,
  ChevronRight,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AiGuide from "./ai-guide";
import logoImg from "@assets/Veteran_Care_-_Shadow_-_PNG_1772598034200.png";
import { useSavedResources } from "@/lib/store";

const TUTORIAL_ITEMS = [
  { icon: Home, label: "Home", desc: "Your dashboard with resources, guide, and community feed." },
  { icon: BookOpen, label: "Resources", desc: "Browse all veteran benefit categories and services." },
  { icon: Heart, label: "Saved", desc: "Quickly access resources you've bookmarked." },
  { icon: MessageSquare, label: "Community", desc: "Connect with fellow veterans, share experiences." },
  { icon: ShoppingBag, label: "Shop", desc: "Veteran-owned businesses and exclusive deals." },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isAiOpen, setIsAiOpen] = useState(false);
  const { hasSeenTutorial, markTutorialSeen, onboardingComplete } = useSavedResources();
  const [showTutorial, setShowTutorial] = useState(false);

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

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 font-sans">
      {/* Top Bar - Persistent */}
      <header className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="h-12 w-20 overflow-hidden rounded-md bg-primary transition-opacity hover:opacity-90 shadow-sm border border-white/10 flex items-center justify-center">
               <img src={logoImg} alt="Veteran Care" className="h-full w-full object-cover" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight hidden sm:block">Veteran Care</span>
          </Link>

          {/* Right: Icons (Search, AI, Notifications, Profile, Settings) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Near Me (Top Bar) */}
            <Link href="/near-me">
              <Button variant="ghost" size="icon" className="text-primary-foreground bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 border border-white/5">
                <MapPin className="h-5 w-5" />
              </Button>
            </Link>

            {/* Search */}
            <Button variant="ghost" size="icon" className="text-primary-foreground bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 border border-white/5">
              <Search className="h-5 w-5" />
            </Button>
            
            {/* Chatbot */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 border border-white/5"
              onClick={() => setIsAiOpen(true)}
            >
              <Sparkles className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="text-primary-foreground bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 border border-white/5 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-orange-500 rounded-full border-2 border-primary"></span>
            </Button>

            {/* Profile */}
            <Button variant="ghost" size="icon" className="text-primary-foreground bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 border border-white/5 font-bold text-sm">
              JD
            </Button>
            
            {/* Settings */}
            <Button variant="ghost" size="icon" className="text-primary-foreground bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 border border-white/5">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-6 max-w-4xl">
        {children}
      </main>

      {/* AI Guide Modal */}
      <AiGuide open={isAiOpen} onOpenChange={setIsAiOpen} />

      {/* Bottom Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md shadow-[0_-1px_3px_rgba(0,0,0,0.05)] md:hidden safe-area-bottom">
        <div className="flex h-16 items-center justify-around px-2">
          <Link href="/home" className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/home') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
            <Home className={`h-5 w-5 ${isActive('/home') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          
          <Link href="/resources" className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/resources') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
            <BookOpen className={`h-5 w-5 ${isActive('/resources') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Resources</span>
          </Link>

          <Link href="/saved-resources" className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/saved-resources') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
            <Heart className={`h-5 w-5 ${isActive('/saved-resources') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium text-center leading-tight">My Saved</span>
          </Link>

          <Link href="/community" className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/community') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
            <MessageSquare className={`h-5 w-5 ${isActive('/community') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Community</span>
          </Link>

          <Link href="/shop" className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/shop') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
            <ShoppingBag className={`h-5 w-5 ${isActive('/shop') ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">Shop</span>
          </Link>
        </div>
      </nav>

      {showTutorial && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center animate-in fade-in duration-300">
          <div className="bg-background rounded-t-2xl md:rounded-2xl w-full max-w-sm mx-auto p-5 pb-8 md:mb-0 space-y-4 animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
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
            <div className="space-y-2">
              {TUTORIAL_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
              <span>These tabs are at the bottom of your screen</span>
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
