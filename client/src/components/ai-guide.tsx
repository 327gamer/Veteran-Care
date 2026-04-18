
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
import { Bot, Send, User, Trash2, History, AlertTriangle, Handshake, Phone, ExternalLink, Mail, Globe, Star, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSavedResources } from "@/lib/store";
import { platform, t } from "@shared/platform";
import logoImg from "@assets/Veteran_Care_-_Shadow_(TM)_-_PNG_1775367756504.png";
import { trackEvent } from "@/lib/analytics";

interface MatchedResourceCard {
  id: string;
  title: string;
  category: string;
  city: string | null;
  state: string | null;
  website_url: string | null;
  phone: string | null;
}

interface TrustedServiceCard {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  is_featured: boolean;
  category_name: string;
}

interface AiGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryContext?: string;
}

const CATEGORY_CONTEXT_LABELS: Record<string, string> = {
  "mental-health": "mental health support, PTSD, counseling, and crisis resources",
  "housing": "housing assistance, emergency shelter, VA home loans, and rental help",
  "employment": "employment support, job search, resume help, and career training",
  "healthcare": "healthcare services, VA health enrollment, and medical support",
  "financial-services": "financial assistance, credit counseling, and emergency funds",
  "financial": "financial assistance, credit counseling, and emergency funds",
  "benefits-assistance": "VA benefits, disability claims, military records, compensation, and appeals",
  "va-benefits": "VA benefits, disability claims, military records, compensation, and appeals",
  "disabled-veterans": "disabled veteran services, adaptive equipment, and specialized support",
  "end-of-life": "end of life services, hospice care, burial benefits, and survivor support",
  "end-of-life-services": "end of life services, hospice care, burial benefits, and survivor support",
  "family-support": "family support, spouse and dependent resources, and caregiver assistance",
  "transportation": "transportation assistance, travel support, and vehicle grants for veterans",
  "community-support": "community organizations, veteran groups, peer networks, and volunteer support",
  "food-assistance": "food assistance, food banks, meal programs, and nutrition support for veterans",
  "education": "education benefits, GI Bill, trade schools, certifications, and training programs",
  "legal": "legal services, legal aid, veteran legal assistance, and rights advocacy",
  "substance-recovery": "wellness and recovery, substance abuse treatment, and holistic support",
  "crisis-help": "crisis support, emergency help, suicide prevention, and immediate assistance",
  "military-records": "military records, DD214 requests, service verification, and corrections",
  "transition": "military transition support, civilian life adjustment, and reintegration resources",
  "housing-home": "housing and home services, mortgage help, and home improvement for veterans",
  "legal-services": "legal services, veteran legal assistance, and legal advocacy",
  "financial-credit": "financial and credit services, credit repair, and financial coaching",
  "insurance": "insurance services, health insurance, life insurance, and coverage guidance",
  "education-training": "education and training, career development, and certification programs",
  "employment-support": "employment support, job placement, and career assistance for veterans",
  "trusted-services": "trusted veteran services, vetted providers, and premium support options",
  "wellness-recovery": "wellness and recovery, substance abuse treatment, and holistic support",
};

const INITIAL_MESSAGE = {
  role: 'assistant' as const,
  content: t(platform.ai.welcomeMessage),
};

export default function AiGuide({ open, onOpenChange, categoryContext }: AiGuideProps) {
  const { chatHistory, addChatMessage, clearChatHistory, userLocation, interests, serviceProfile, authToken } = useSavedResources();
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [showNavigatorHint, setShowNavigatorHint] = useState(false);
  const [isCrisis, setIsCrisis] = useState(false);
  const [matchedResources, setMatchedResources] = useState<MatchedResourceCard[]>([]);
  const [trustedServices, setTrustedServices] = useState<TrustedServiceCard[]>([]);
  const [trustedServiceCategory, setTrustedServiceCategory] = useState<string>("");
  const [emailInput, setEmailInput] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userDeclinedHelp, setUserDeclinedHelp] = useState(false);
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

  const contextSentRef = useRef<string | null>(null);

  useEffect(() => {
    if (open) {
      scrollToBottom();
      if (chatHistory.length === 0) {
        trackEvent("ai_chat_start");
      }
    }
  }, [open, chatHistory.length, streamingText, scrollToBottom]);

  useEffect(() => {
    if (open && categoryContext && chatHistory.length === 0 && !isTyping && contextSentRef.current !== categoryContext) {
      contextSentRef.current = categoryContext;
      const contextLabel = CATEGORY_CONTEXT_LABELS[categoryContext] || categoryContext;
      const autoMessage = `I need help with ${contextLabel}. Can you guide me step by step?`;
      setTimeout(() => {
        setInput(autoMessage);
      }, 300);
    }
    if (!open) {
      contextSentRef.current = null;
    }
  }, [open, categoryContext, chatHistory.length, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMessage = input.trim();
    trackEvent("ai_message_sent", { message_length: userMessage.length });
    
    if (chatHistory.length === 0) {
      addChatMessage(INITIAL_MESSAGE);
    }

    addChatMessage({ role: 'user', content: userMessage });
    setInput("");
    setIsTyping(true);
    setStreamingText("");
    setShowNavigatorHint(false);
    setIsCrisis(false);
    setTrustedServices([]);
    setTrustedServiceCategory("");
    setMatchedResources([]);

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
          userDeclinedHelp,
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

            if (event.type === "resources") {
              setMatchedResources(event.resources || []);
              if (event.resources?.length) {
                trackEvent("ai_resource_shown", { count: event.resources.length });
              }
            } else if (event.type === "chunk") {
              accumulated += event.text;
              setStreamingText(accumulated);
            } else if (event.type === "done") {
              if (event.navigatorSuggested) {
                setShowNavigatorHint(true);
                trackEvent("ai_escalation_triggered", { type: "navigator" });
              }
              if (event.isCrisis) {
                setIsCrisis(true);
                trackEvent("ai_escalation_triggered", { type: "crisis" });
              }
              if (event.trustedServices && event.trustedServices.length > 0) {
                setTrustedServices(event.trustedServices);
                setTrustedServiceCategory(event.trustedServiceCategory || "");
              }
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
    setMatchedResources([]);
    setTrustedServices([]);
    setTrustedServiceCategory("");
  };

  const handleEmailResults = async () => {
    if (!emailInput.trim() || !emailInput.includes("@") || emailSending) return;
    setEmailSending(true);
    try {
      const lastAssistantMsg = [...chatHistory].reverse().find(m => m.role === 'assistant');
      const res = await fetch("/api/ai/email-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.trim(),
          resources: matchedResources,
          trustedServices,
          conversationSummary: lastAssistantMsg?.content?.slice(0, 300) || "",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setEmailSent(true);
      trackEvent("ai_results_emailed");
      setTimeout(() => setEmailSent(false), 5000);
    } catch {
      setEmailSent(false);
    } finally {
      setEmailSending(false);
    }
  };

  const handleConnectProvider = () => {
    trackEvent("ai_connect_provider_click");
    onOpenChange(false);
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-navigator"));
    }, 300);
  };

  const renderTextWithLinks = (text: string, keyPrefix: string) => {
    const urlRegex = /(https?:\/\/[^\s,)]+)/g;
    const segments = text.split(urlRegex);
    return segments.map((seg, j) => {
      if (urlRegex.test(seg)) {
        urlRegex.lastIndex = 0;
        const display = seg.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
        return (
          <a key={`${keyPrefix}-${j}`} href={seg} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 break-all">
            {display}
          </a>
        );
      }
      return <span key={`${keyPrefix}-${j}`}>{seg}</span>;
    });
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{renderTextWithLinks(part.slice(2, -2), `b${i}`)}</strong>;
      }
      return <span key={i}>{renderTextWithLinks(part, `t${i}`)}</span>;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v && abortRef.current) abortRef.current.abort();
      onOpenChange(v);
    }}>
      <DialogContent className="sm:max-w-[425px] h-[80dvh] max-h-[80dvh] flex flex-col p-0 gap-0 overflow-hidden border-2 border-primary/20 [&>button.absolute]:text-white [&>button.absolute]:opacity-100">
        <DialogHeader className="px-6 py-4 bg-primary text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center border-2 border-white/20 overflow-hidden p-1">
               <img src={logoImg} alt={platform.name} className="w-full h-full object-contain" />
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
                   <Avatar className="h-8 w-8 border border-border flex-shrink-0 bg-white overflow-hidden p-1">
                     <img src={logoImg} alt={platform.name} className="w-full h-full object-contain" />
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

            {matchedResources.length > 0 && (
              <div className="flex flex-col gap-2 mx-1" data-testid="matched-resources">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Matched Resources</p>
                {matchedResources.slice(0, 4).map((r) => (
                  <div key={r.id} data-testid={`resource-card-${r.id}`} className="bg-white border border-border rounded-xl px-3 py-2.5 shadow-sm">
                    <p className="font-semibold text-xs text-foreground leading-snug">{r.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.category}{r.city ? ` · ${r.city}` : ''}{r.state ? `, ${r.state}` : ''}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                      {r.website_url && (
                        <a href={r.website_url} target="_blank" rel="noopener noreferrer" data-testid={`link-resource-${r.id}`} className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium">
                          <ExternalLink className="h-3 w-3" />
                          Visit Website
                        </a>
                      )}
                      {r.phone && (
                        <a href={`tel:${r.phone}`} data-testid={`phone-resource-${r.id}`} className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-medium">
                          <Phone className="h-3 w-3" />
                          {r.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {trustedServices.length > 0 && (
              <div className="flex flex-col gap-2 mx-1" data-testid="trusted-service-suggestions">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                  <p className="text-[10px] font-medium text-green-700 uppercase tracking-wide">
                    Trusted {trustedServiceCategory} Partners
                  </p>
                </div>
                {trustedServices.slice(0, 3).map((s) => (
                  <div key={s.id} data-testid={`trusted-service-card-${s.id}`} className="bg-white border border-green-200 rounded-xl px-3 py-2.5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-foreground leading-snug">{s.name}</p>
                        {s.description && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{s.description}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {s.category_name}{s.city ? ` · ${s.city}` : ''}{s.state ? `, ${s.state}` : ''}
                        </p>
                      </div>
                      {s.is_featured && (
                        <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border border-amber-200 flex-shrink-0">
                          <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                      {s.website && (
                        <a href={s.website} target="_blank" rel="noopener noreferrer" data-testid={`link-trusted-${s.id}`} className="inline-flex items-center gap-1 text-[11px] text-green-700 hover:text-green-600 font-medium">
                          <Globe className="h-3 w-3" />
                          Website
                        </a>
                      )}
                      {s.phone && (
                        <a href={`tel:${s.phone}`} data-testid={`phone-trusted-${s.id}`} className="inline-flex items-center gap-1 text-[11px] text-green-700 hover:text-green-600 font-medium">
                          <Phone className="h-3 w-3" />
                          {s.phone}
                        </a>
                      )}
                      {s.email && (
                        <a href={`mailto:${s.email}`} data-testid={`email-trusted-${s.id}`} className="inline-flex items-center gap-1 text-[11px] text-green-700 hover:text-green-600 font-medium">
                          <Mail className="h-3 w-3" />
                          Email
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                <a
                  href="/discounts"
                  data-testid="link-view-all-trusted"
                  className="text-[11px] text-green-700 hover:text-green-600 font-medium text-center py-1"
                  onClick={(e) => { e.preventDefault(); onOpenChange(false); window.location.href = '/discounts'; }}
                >
                  View all Trusted Services →
                </a>
              </div>
            )}

            {!isTyping && (matchedResources.length > 0 || trustedServices.length > 0) && (
              <div className="mx-1 bg-white border border-primary/20 rounded-xl p-3 shadow-sm" data-testid="email-results-section">
                {emailSent ? (
                  <div className="flex items-center gap-2 text-green-700 text-xs font-medium justify-center py-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Results sent to {emailInput}
                  </div>
                ) : (
                  <>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      <Mail className="h-3 w-3 inline mr-1" />
                      Email me these results
                    </p>
                    <div className="flex gap-2">
                      <Input
                        data-testid="input-email-results"
                        type="email"
                        placeholder="your@email.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="h-8 text-xs flex-1"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEmailResults(); } }}
                      />
                      <Button
                        data-testid="button-email-results"
                        size="sm"
                        className="h-8 text-xs px-3"
                        disabled={!emailInput.includes("@") || emailSending}
                        onClick={handleEmailResults}
                      >
                        {emailSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Mail className="h-3 w-3 mr-1" /> Send</>}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {isTyping && streamingText && (
              <div className="flex gap-3 max-w-[85%]">
                <Avatar className="h-8 w-8 border border-border flex-shrink-0 bg-white overflow-hidden p-1">
                  <img src={logoImg} alt={platform.name} className="w-full h-full object-contain" />
                </Avatar>
                <div className="rounded-2xl px-4 py-2 text-sm shadow-sm bg-white text-foreground border border-border rounded-tl-none whitespace-pre-wrap">
                  {renderContent(streamingText)}
                </div>
              </div>
            )}

            {isTyping && !streamingText && (
              <div className="flex gap-3 max-w-[85%]">
                <Avatar className="h-8 w-8 border border-border flex-shrink-0 bg-white overflow-hidden p-1">
                  <img src={logoImg} alt={platform.name} className="w-full h-full object-contain" />
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

            {showNavigatorHint && !isCrisis && (
              <div className="mx-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground mb-2">Would you like us to connect you with a provider who can help directly?</p>
                <Button
                  data-testid="button-connect-provider"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-2 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={handleConnectProvider}
                >
                  <Handshake className="h-4 w-4" />
                  Yes, connect me with a provider
                </Button>
                <button
                  type="button"
                  data-testid="button-decline-connect"
                  className="mt-2 w-full text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  onClick={() => { setUserDeclinedHelp(true); setShowNavigatorHint(false); }}
                >
                  No thanks, just info
                </button>
              </div>
            )}
          </div>
        </ScrollArea>

        {isCrisis && (
          <div className="bg-red-600 text-white px-4 py-3 border-t border-red-700" data-testid="crisis-alert">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 flex-shrink-0 mt-0.5 text-white" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">If you are in crisis, please reach out now.</p>
                <p className="text-red-100 text-xs mt-1">Free, confidential, 24/7 support</p>
              </div>
            </div>
            <a
              href="tel:988"
              data-testid="button-call-988"
              className="mt-3 flex items-center justify-center gap-2 w-full bg-white text-red-700 font-bold py-3 rounded-lg text-base hover:bg-red-50 transition-colors"
            >
              <Phone className="h-5 w-5" />
              Call 988 — Veterans Crisis Line
            </a>
            <div className="mt-2 flex gap-2 text-xs">
              <a href="sms:838255" className="flex-1 text-center bg-red-700 hover:bg-red-800 py-2 rounded-md transition-colors">
                Text 838255
              </a>
              <a href="https://www.veteranscrisisline.net/get-help-now/chat/" target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-red-700 hover:bg-red-800 py-2 rounded-md transition-colors">
                Chat Online
              </a>
            </div>
          </div>
        )}

        {chatHistory.length > 2 && !isCrisis && (
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
