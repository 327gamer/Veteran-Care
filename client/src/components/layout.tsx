
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
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AiGuide from "./ai-guide";
import logoImg from "@assets/IMG_4925_1766381417086.png";

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
              <div className="h-12 w-20 overflow-hidden rounded-md p-1 bg-primary-foreground/10 transition-opacity hover:opacity-90 shadow-sm border border-white/10 flex items-center justify-center">
                 <img src={logoImg} alt="VeteranCare" className="h-full w-full object-contain" />
              </div>
              <span className="font-heading text-lg font-bold tracking-tight hidden sm:block">VeteranCare</span>
            </a>
          </Link>

          {/* Right: Icons (Search, AI, Profile, Settings) */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 rounded-full">
              <Search className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:bg-white/10 rounded-full relative"
              onClick={() => setIsAiOpen(true)}
            >
              <Bot className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full animate-pulse"></span>
            </Button>

            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 rounded-full">
              <User className="h-5 w-5" />
            </Button>
            
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 rounded-full">
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

          <Link href="/near-me">
            <a className={`flex flex-col items-center justify-center gap-1 p-2 min-w-[60px] rounded-lg transition-colors ${isActive('/near-me') ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/5'}`}>
              <MapPin className={`h-5 w-5 ${isActive('/near-me') ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-medium">Near Me</span>
            </a>
          </Link>
        </div>
      </nav>
    </div>
  );
}
