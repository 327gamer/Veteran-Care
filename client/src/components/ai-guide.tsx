
import { useState, useRef, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Trash2, History } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSavedResources } from "@/lib/store";
import { platform, t } from "@shared/platform";

interface AiGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INITIAL_MESSAGE = {
  role: 'assistant' as const,
  content: t(platform.ai.welcomeMessage),
};

export default function AiGuide({ open, onOpenChange }: AiGuideProps) {
  const { chatHistory, addChatMessage, clearChatHistory } = useSavedResources();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const displayMessages = chatHistory.length > 0 
    ? chatHistory 
    : [{ ...INITIAL_MESSAGE, timestamp: Date.now() }];

  useEffect(() => {
    if (open && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [open, chatHistory.length]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    
    if (chatHistory.length === 0) {
      addChatMessage(INITIAL_MESSAGE);
    }

    addChatMessage({ role: 'user', content: input });
    setInput("");
    setIsTyping(true);
    
    setTimeout(() => {
      addChatMessage({ 
        role: 'assistant', 
        content: "I understand. Let me check the database for the best resources near you regarding that. Would you like me to look for VA facilities or community partners?" 
      });
      setIsTyping(false);
    }, 1000);
  };

  const handleClear = () => {
    clearChatHistory();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden border-2 border-primary/20">
        <DialogHeader className="px-6 py-4 bg-primary text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center border-2 border-white/20">
               <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-heading">{platform.ai.assistantName}</DialogTitle>
              <DialogDescription className="text-primary-foreground/80 text-xs">
                {t(platform.ai.subtitle)}
              </DialogDescription>
            </div>
            {chatHistory.length > 0 && (
              <Button
                data-testid="button-clear-chat"
                variant="ghost"
                size="icon"
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 h-8 w-8"
                onClick={handleClear}
                title="Clear conversation history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4 bg-muted/30" ref={scrollRef}>
          <div className="flex flex-col gap-4">
            {displayMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {msg.role === 'assistant' ? (
                   <Avatar className="h-8 w-8 border border-border">
                     <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={14} /></AvatarFallback>
                   </Avatar>
                ) : (
                   <Avatar className="h-8 w-8 border border-border">
                     <AvatarFallback className="bg-muted text-foreground"><User size={14} /></AvatarFallback>
                   </Avatar>
                )}
                
                <div 
                  className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-white text-foreground border border-border rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 max-w-[85%]">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={14} /></AvatarFallback>
                </Avatar>
                <div className="rounded-2xl px-4 py-3 text-sm shadow-sm bg-white text-foreground border border-border rounded-tl-none">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {chatHistory.length > 2 && (
          <div className="px-4 py-1.5 bg-muted/50 border-t flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <History className="h-3 w-3" />
            <span>{chatHistory.filter(m => m.role === 'user').length} messages in history</span>
          </div>
        )}

        <div className="p-4 bg-background border-t">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <Input 
              data-testid="input-chat-message"
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Ask me anything..."
              className="flex-1"
              disabled={isTyping}
            />
            <Button data-testid="button-send-chat" type="submit" size="icon" disabled={!input.trim() || isTyping}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
