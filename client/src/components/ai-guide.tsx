
import { useState } from "react";
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
import { Bot, Send, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AiGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export default function AiGuide({ open, onOpenChange }: AiGuideProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your Veteran Guide. How can I help you today? I can assist with benefits, finding local resources, or just pointing you in the right direction." }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput("");
    
    // Mock response delay
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: "I understand. Let me check the database for the best resources near you regarding that. Would you like me to look for VA facilities or community partners?" }]);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden border-2 border-primary/20">
        <DialogHeader className="px-6 py-4 bg-primary text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center border-2 border-white/20">
               <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-lg font-heading">Veteran Guide</DialogTitle>
              <DialogDescription className="text-primary-foreground/80 text-xs">
                Always here to help.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4 bg-muted/30">
          <div className="flex flex-col gap-4">
            {messages.map((msg, i) => (
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
          </div>
        </ScrollArea>

        <div className="p-4 bg-background border-t">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Ask me anything..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
