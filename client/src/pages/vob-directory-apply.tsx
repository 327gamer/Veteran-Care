import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Store, ClipboardList } from "lucide-react";
import { useLocation } from "wouter";

export default function VobDirectoryApply() {
  const [, setLocation] = useLocation();

  return (
    <div className="p-4 space-y-5 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setLocation("/home")}
          data-testid="button-back-vob-apply"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-heading font-bold text-primary">Add Your Business</h1>
          <p className="text-xs text-muted-foreground">List your veteran-owned business or nonprofit in our free directory</p>
        </div>
      </div>

      <Card className="border-primary/20">
        <CardContent className="p-6 text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Store className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-heading font-bold text-primary">Free Directory Listing</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Get your veteran-owned business or nonprofit listed in our growing directory — completely free. 
            Connect with fellow veterans and the community that wants to support you.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
            <div className="flex items-start gap-2">
              <ClipboardList className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">The application form is coming soon. We're building a simple process to get your business listed quickly.</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground italic">Check back soon — this page will be live shortly.</p>
        </CardContent>
      </Card>
    </div>
  );
}
