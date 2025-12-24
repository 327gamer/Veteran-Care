
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
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-background border-l-primary/20">
        
        {/* Header with Military/Official styling */}
        <div className="bg-primary px-6 py-6 text-primary-foreground relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <FileText className="h-32 w-32" />
           </div>
           
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-3">
               <Badge variant="outline" className="text-xs border-primary-foreground/30 text-primary-foreground/90 bg-primary-foreground/10">
                 {resource.category}
               </Badge>
               {resource.isScLocal && (
                 <Badge className="text-xs bg-accent text-accent-foreground hover:bg-accent/90 border-none">
                   <MapPin className="h-3 w-3 mr-1" /> Local Resource
                 </Badge>
               )}
             </div>
             
             <SheetTitle className="text-2xl font-heading font-bold text-white mb-2 leading-tight">
               {resource.title}
             </SheetTitle>
             
             <div className="flex items-center gap-2 text-primary-foreground/80 text-sm">
               <span>Source: {resource.source}</span>
               <span>•</span>
               <span className="capitalize">{resource.type}</span>
             </div>
           </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-8">
            
            {/* The "Why" - Plain English Explanation */}
            <section className="space-y-3">
              <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
                <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                What is this?
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {resource.description}
                {/* Mock extended content for demo */}
                <span className="block mt-2">
                  This resource helps veterans navigate the often complex process of {resource.title.toLowerCase()}. 
                  We've simplified the official guidance to help you understand exactly what you need to do before you apply.
                </span>
              </p>
            </section>

            {/* Checklist - The "Value Add" that keeps them here */}
            <section className="bg-muted/30 rounded-xl p-5 border border-border">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Before you start
              </h3>
              <ul className="space-y-3">
                {[
                  "Gather your DD214 (Member 4 Copy)",
                  "Have your medical records ready (if applicable)",
                  "Verify your current mailing address",
                  "Prepare bank routing info for direct deposit"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <div className="h-5 w-5 rounded-full border border-muted-foreground/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{i + 1}</span>
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Location Context - The "Local" Factor */}
            <section className="space-y-3">
               <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
                <MapPin className="h-5 w-5" />
                Local Assistance
              </h3>
              {resource.isScLocal ? (
                 <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                   <p className="font-medium text-primary">This is a South Carolina specific program.</p>
                   <p className="text-sm text-muted-foreground mt-1">
                     You can visit the local office in {userLocation} for in-person help with this form.
                   </p>
                   <Button size="sm" variant="outline" className="mt-3 w-full border-primary/20 text-primary">
                     <MapPin className="h-3 w-3 mr-2" /> Get Directions to Local Office
                   </Button>
                 </div>
              ) : (
                 <div className="bg-muted rounded-lg p-4">
                   <p className="text-sm">
                     While this is a national federal program, there are VSOs (Veterans Service Officers) in <strong>{userLocation}</strong> who can help you file this claim for free.
                   </p>
                   <Button size="sm" variant="link" className="px-0 text-primary h-auto mt-2">
                     Find a VSO near {userLocation} &rarr;
                   </Button>
                 </div>
              )}
            </section>

            {/* AI Guide Helper */}
            <section className="flex items-start gap-4 p-4 bg-accent/10 rounded-xl border border-accent/20">
               <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                 <Bot className="h-6 w-6 text-accent-foreground" />
               </div>
               <div>
                 <h4 className="font-bold text-sm">Need help understanding this?</h4>
                 <p className="text-xs text-muted-foreground mt-1 mb-2">
                   I can walk you through the eligibility requirements or help you find the specific forms you need.
                 </p>
                 <Button size="sm" variant="secondary" className="h-8 text-xs bg-white shadow-sm border">
                   Ask Guide about "{resource.title}"
                 </Button>
               </div>
            </section>

          </div>
        </ScrollArea>

        <SheetFooter className="p-4 border-t bg-muted/10 sm:justify-between flex-row gap-4 items-center">
           <Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
             Save for Later
           </Button>
           <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-white shadow-md">
             Go to Official Site <ExternalLink className="h-4 w-4" />
           </Button>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  );
}
