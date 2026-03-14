
import { useState, useRef, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Trash2, History, AlertTriangle, Handshake } from "lucide-react";
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
  const { chatHistory, addChatMessage, clearChatHistory, userLocation, interests, serviceProfile, authToken } = useSavedResources();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [showNavigatorHint, setShowNavigatorHint] = useState(false);
  const [isCrisis, setIsCrisis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const displayMessages = chatHistory.length > 0 
    ? chatHistory 
    : [{ ...INITIAL_MESSAGE, timestamp: Date.now() }];

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [open, chatHistory.length, streamingText, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMessage = input.trim();
    
    if (chatHistory.length === 0) {
      addChatMessage(INITIAL_MESSAGE);
    }

    addChatMessage({ role: 'user', content: userMessage });
    setInput("");
    setIsTyping(true);
    setStreamingText("");
    setShowNavigatorHint(false);
    setIsCrisis(false);

    const allMessages = [
      ...chatHistory
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ];

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: allMessages,
          userState: userLocation.stateCode || undefined,
          userCity: userLocation.city || undefined,
          userZip: userLocation.zip || undefined,
          interests: interests.length > 0 ? interests : undefined,
          branch: serviceProfile.branch || undefined,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Something went wrong" }));
        throw new Error(err.error || "Something went wrong");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "chunk") {
              accumulated += event.text;
              setStreamingText(accumulated);
            } else if (event.type === "done") {
              if (event.navigatorSuggested) setShowNavigatorHint(true);
              if (event.isCrisis) setIsCrisis(true);
            } else if (event.type === "error") {
              accumulated = event.message;
              setStreamingText(accumulated);
            }
          } catch {}
        }
      }

      if (accumulated) {
        addChatMessage({ role: 'assistant', content: accumulated });
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      const errorMsg = err.message || "I'm having trouble connecting. Please try again.";
      addChatMessage({ role: 'assistant', content: errorMsg });
    } finally {
      setIsTyping(false);
      setStreamingText("");
      abortRef.current = null;
    }
  };

  const handleClear = () => {
    if (abortRef.current) abortRef.current.abort();
    clearChatHistory();
    setStreamingText("");
    setIsTyping(false);
    setShowNavigatorHint(false);
    setIsCrisis(false);
  };

  const handleNavigatorClick = () => {
    onOpenChange(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-navigator"));
    }, 300);
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v && abortRef.current) abortRef.current.abort();
      onOpenChange(v);
    }}>
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
                data-testid={`chat-msg-${msg.role}-${i}`}
                className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {msg.role === 'assistant' ? (
                   <Avatar className="h-8 w-8 border border-border flex-shrink-0">
                     <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={14} /></AvatarFallback>
                   </Avatar>
                ) : (
                   <Avatar className="h-8 w-8 border border-border flex-shrink-0">
                     <AvatarFallback className="bg-muted text-foreground"><User size={14} /></AvatarFallback>
                   </Avatar>
                )}
                
                <div 
                  className={`rounded-2xl px-4 py-2 text-sm shadow-sm whitespace-pre-wrap ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-white text-foreground border border-border rounded-tl-none'
                  }`}
                >
                  {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {isTyping && streamingText && (
              <div className="flex gap-3 max-w-[85%]">
                <Avatar className="h-8 w-8 border border-border flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={14} /></AvatarFallback>
                </Avatar>
                <div className="rounded-2xl px-4 py-2 text-sm shadow-sm bg-white text-foreground border border-border rounded-tl-none whitespace-pre-wrap">
                  {renderContent(streamingText)}
                </div>
              </div>
            )}

            {isTyping && !streamingText && (
              <div className="flex gap-3 max-w-[85%]">
                <Avatar className="h-8 w-8 border border-border flex-shrink-0">
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

            {isCrisis && (
              <div className="mx-2 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2" data-testid="crisis-alert">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-800">
                  <p className="font-semibold">If you're in crisis, please reach out now.</p>
                  <p className="mt-1">Veterans Crisis Line: <strong>988 (press 1)</strong></p>
                </div>
              </div>
            )}

            {showNavigatorHint && !isCrisis && (
              <div className="mx-2">
                <Button
                  data-testid="button-navigator-from-chat"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-2 border-primary/30 text-primary hover:bg-primary/5"
                  onClick={handleNavigatorClick}
                >
                  <Handshake className="h-4 w-4" />
                  Request a {platform.navigatorTitle} for personalized help
                </Button>
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
              placeholder={t(platform.ai.askPrompt)}
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
