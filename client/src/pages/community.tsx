
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, ThumbsUp } from "lucide-react";

export default function Community() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-1">Community</h1>
          <p className="text-muted-foreground text-sm">Connect with veterans near you.</p>
        </div>
        <Button variant="outline" size="sm">Create Post</Button>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex gap-2 items-center">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                     <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium">Sgt. Miller</CardTitle>
                    <p className="text-xs text-muted-foreground">Austin, TX • 2h ago</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">Transition</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">
                Has anyone used the VR&E program for tech bootcamps lately? Trying to figure out if they cover the full cost of equipment.
              </p>
              <div className="flex gap-4 pt-2 border-t text-muted-foreground">
                <button className="flex items-center gap-1 text-xs hover:text-primary transition-colors">
                  <ThumbsUp className="h-4 w-4" /> 12
                </button>
                <button className="flex items-center gap-1 text-xs hover:text-primary transition-colors">
                  <MessageSquare className="h-4 w-4" /> 5 Comments
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
