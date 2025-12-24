
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ExternalLink, 
  MapPin, 
  CheckCircle2, 
  FileText, 
  AlertCircle,
  Phone,
  Bot
} from "lucide-react";
import { ResourceItem } from "@/lib/resources-data";

interface ResourceDetailProps {
  resource: ResourceItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userLocation?: string; // e.g. "Austin, TX"
}

export default function ResourceDetail({ resource, open, onOpenChange, userLocation = "Austin, TX" }: ResourceDetailProps) {
  if (!resource) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col h-[100dvh] bg-background border-l-primary/20">
        
        {/* Header with Military/Official styling */}
        <div className="bg-primary px-5 py-4 text-primary-foreground relative overflow-hidden shrink-0">
           <div className="absolute top-0 right-0 p-2 opacity-10">
             <FileText className="h-24 w-24" />
           </div>
           
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-1.5">
               <Badge variant="outline" className="text-[10px] h-5 border-primary-foreground/30 text-primary-foreground/90 bg-primary-foreground/10">
                 {resource.category}
               </Badge>
               {resource.isLocal && (
                 <Badge className="text-[10px] h-5 bg-accent text-accent-foreground hover:bg-accent/90 border-none">
                   <MapPin className="h-3 w-3 mr-1" /> {resource.state === "South Carolina" ? "SC" : resource.state === "Texas" ? "TX" : "Local"}
                 </Badge>
               )}
             </div>
             
             <SheetTitle className="text-xl font-heading font-bold text-white mb-1 leading-tight pr-8">
               {resource.title}
             </SheetTitle>
             
             <div className="flex items-center gap-2 text-primary-foreground/80 text-xs">
               <span>Source: {resource.source}</span>
               <span>•</span>
               <span className="capitalize">{resource.type}</span>
             </div>
           </div>
        </div>

        <ScrollArea className="flex-1 w-full">
          <div className="p-4 space-y-4">
            
            {/* The "Why" - Plain English Explanation */}
            <section className="space-y-2">
              <h3 className="font-bold text-base flex items-center gap-2 text-primary">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                What is this?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {resource.description}
                <span className="block mt-1">
                  Simplified guidance to help you understand requirements before applying.
                </span>
              </p>
            </section>

            {/* Checklist - The "Value Add" that keeps them here */}
            <section className="bg-muted/30 rounded-lg p-3 border border-border">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Before you start
              </h3>
              <ul className="space-y-2">
                {[
                  "Gather your DD214 (Member 4 Copy)",
                  "Have medical records ready",
                  "Verify mailing address",
                  "Prepare bank routing info"
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <div className="h-4 w-4 rounded-full border border-muted-foreground/30 flex items-center justify-center shrink-0">
                      <span className="text-[9px] text-muted-foreground">{i + 1}</span>
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Location Context - The "Local" Factor */}
            <section className="space-y-2">
               <h3 className="font-bold text-base flex items-center gap-2 text-primary">
                <MapPin className="h-4 w-4" />
                Local Assistance
              </h3>
              {resource.isLocal ? (
                 <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                   <p className="font-medium text-sm text-primary">This is a {resource.state} specific program.</p>
                   <p className="text-xs text-muted-foreground mt-1">
                     Visit the local office in {userLocation} for help.
                   </p>
                   <Button size="sm" variant="outline" className="mt-2 w-full h-8 text-xs border-primary/20 text-primary">
                     <MapPin className="h-3 w-3 mr-2" /> Get Directions
                   </Button>
                 </div>
              ) : (
                 <div className="bg-muted rounded-lg p-3">
                   <p className="text-xs">
                     National program. Local VSOs in <strong>{userLocation}</strong> can help you file for free.
                   </p>
                   <Button size="sm" variant="link" className="px-0 text-primary h-auto mt-1 text-xs">
                     Find a VSO near {userLocation} &rarr;
                   </Button>
                 </div>
              )}
            </section>

            {/* AI Guide Helper */}
            <section className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
               <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                 <Bot className="h-5 w-5 text-accent-foreground" />
               </div>
               <div className="flex-1 min-w-0">
                 <h4 className="font-bold text-sm truncate">Need help?</h4>
                 <p className="text-xs text-muted-foreground truncate">
                   Ask me about eligibility or forms.
                 </p>
               </div>
               <Button size="sm" variant="secondary" className="h-7 text-xs bg-white shadow-sm border shrink-0">
                 Ask Guide
               </Button>
            </section>

          </div>
        </ScrollArea>

        <SheetFooter className="p-3 border-t bg-muted/10 flex-row gap-3 items-center shrink-0">
           <Button variant="ghost" className="flex-1 h-9 text-xs" onClick={() => onOpenChange(false)}>
             Save for Later
           </Button>
           <Button className="flex-1 gap-2 h-9 text-xs bg-primary hover:bg-primary/90 text-white shadow-md">
             Go to Site <ExternalLink className="h-3 w-3" />
           </Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}
