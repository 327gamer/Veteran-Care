
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
import logoImg from "@assets/IMG_9104_1766377226249.jpeg";

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
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <div className="flex items-center gap-4 flex-1">
            <Link href="/">
              <a className="flex items-center gap-3 group shrink-0">
                {/* Logo Placeholder */}
                <div className="h-14 w-14 overflow-hidden rounded-lg bg-white/10 p-0.5 group-hover:bg-white/20 transition-colors shadow-sm">
                   <img src={logoImg} alt="VeteranCare" className="h-full w-full object-cover rounded-md" />
                </div>
                <span className="font-heading text-2xl font-bold tracking-tight hidden sm:block">VeteranCare</span>
              </a>
            </Link>

            {/* AI Guide / Chatbot Box */}
            <button 
              onClick={() => setIsAiOpen(true)}
              className="flex-1 max-w-sm flex items-center gap-3 bg-white/10 hover:bg-white/15 transition-colors border border-white/10 rounded-full px-4 py-2.5 text-left group"
            >
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0 shadow-sm">
                 <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/90 truncate">Ask the AI Guide...</p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 rounded-full sm:hidden">
              <Search className="h-6 w-6" />
            </Button>

            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 rounded-full hidden sm:inline-flex">
              <User className="h-6 w-6" />
            </Button>
            
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 rounded-full hidden sm:inline-flex">
              <Settings className="h-6 w-6" />
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
