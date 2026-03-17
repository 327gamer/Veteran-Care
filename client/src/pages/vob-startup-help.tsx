import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Rocket, Map } from "lucide-react";
import { useLocation } from "wouter";

export default function VobStartupHelp() {
  const [, setLocation] = useLocation();

  return (
    <div className="p-4 space-y-5 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setLocation("/home")}
          data-testid="button-back-vob-help"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-heading font-bold text-primary">Start Your Business</h1>
          <p className="text-xs text-muted-foreground">Resources and guidance for veteran entrepreneurs</p>
        </div>
      </div>

      <Card className="border-primary/20">
        <CardContent className="p-6 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
            <Rocket className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-lg font-heading font-bold text-primary">Startup Roadmap</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Starting a business or nonprofit as a veteran? We're building a step-by-step roadmap 
            with resources, guidance, and connections to help you launch successfully.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
            <div className="flex items-start gap-2">
              <Map className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">The full startup roadmap is coming soon — including SBA resources, veteran business grants, mentorship programs, and more.</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic">Check back soon — this page will be live shortly.</p>
        </CardContent>
      </Card>
    </div>
  );
}
