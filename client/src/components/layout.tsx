
import { useState } from "react";
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
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AiGuide from "./ai-guide";
import logoImg from "@assets/Veteran_Care_-_Shadow_-_PNG_1772598034200.png";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isAiOpen, setIsAiOpen] = useState(false);

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 font-sans">
      {/* Top Bar - Persistent */}
      <header className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Left: Logo */}
          <Link href="/">
            <a className="flex items-center gap-2 group shrink-0">
              <div className="h-12 w-20 overflow-hidden rounded-md bg-primary transition-opacity hover:opacity-90 shadow-sm border border-white/10 flex items-center justify-center">
                 <img src={logoImg} alt="Veteran Care" className="h-full w-full object-cover" />
              </div>
              <span className="font-heading text-lg font-bold tracking-tight hidden sm:block">Veteran Care</span>
            </a>
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
          <Link href="/">
            <a className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
              <Home className={`h-5 w-5 ${isActive('/') ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-medium">Home</span>
            </a>
          </Link>
          
          <Link href="/resources">
            <a className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/resources') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
              <BookOpen className={`h-5 w-5 ${isActive('/resources') ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-medium">Resources</span>
            </a>
          </Link>

          <Link href="/saved-resources">
            <a className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/saved-resources') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
              <Heart className={`h-5 w-5 ${isActive('/saved-resources') ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-medium text-center leading-tight">My Saved</span>
            </a>
          </Link>

          <Link href="/community">
            <a className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/community') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
              <MessageSquare className={`h-5 w-5 ${isActive('/community') ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-medium">Community</span>
            </a>
          </Link>

          <Link href="/shop">
            <a className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/shop') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
              <ShoppingBag className={`h-5 w-5 ${isActive('/shop') ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-medium">Shop</span>
            </a>
          </Link>
        </div>
      </nav>
    </div>
  );
}
