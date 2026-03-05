
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart,
  MapPin,
  ExternalLink,
  Bookmark,
  Search
} from "lucide-react";
import { useSavedResources } from "@/lib/store";
import { resourcesData, ResourceItem } from "@/lib/resources-data";
import ResourceDetail from "@/components/resource-detail";
import { Link } from "wouter";
import { toast } from "@/hooks/use-toast";

export default function SavedResources() {
  const { savedIds, toggleSave } = useSavedResources();
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);

  // Flatten all resources to find saved ones
  const allResources = Object.values(resourcesData).flat();
  const savedItems = allResources.filter(item => savedIds.includes(item.id));

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleSave(id);
    toast({
      description: "Removed from My Saved Resources",
      duration: 2000,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      {/* Detail View Modal */}
      <ResourceDetail 
        resource={selectedResource} 
        open={!!selectedResource} 
        onOpenChange={(open) => !open && setSelectedResource(null)} 
      />

      <div>
        <h1 className="text-2xl font-bold text-primary font-heading mb-2">My Saved Resources</h1>
        <p className="text-muted-foreground">
          Your collection of saved guides and benefits.
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1" data-testid="text-saved-device-note">
          Saved on this device. Create an account later to sync across devices.
        </p>
      </div>

      {savedItems.length > 0 ? (
        <div className="space-y-3">
          {savedItems.map((resource) => (
            <Card 
              key={resource.id} 
              className="group hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setSelectedResource(resource)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">{resource.title}</h3>
                      {resource.isLocal && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary/30 text-primary bg-primary/5 shrink-0">
                          <MapPin className="h-2.5 w-2.5 mr-0.5" /> {resource.state || "Local"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] h-5 font-normal">
                        {resource.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">• {resource.source}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleRemove(e, resource.id)}
                    >
                      <Heart className="h-5 w-5 fill-current" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-muted/30 border-dashed mt-8">
           <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
             <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
               <Heart className="h-8 w-8" />
             </div>
             <div className="space-y-2">
               <h3 className="font-semibold text-lg">No saved resources yet</h3>
               <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                 Tap the heart icon next to any resource to save it here for quick access.
               </p>
             </div>
             <Link href="/resources">
               <Button className="mt-2">
                 <Search className="mr-2 h-4 w-4" /> Browse Resources
               </Button>
             </Link>
           </CardContent>
        </Card>
      )}
    </div>
  );
}
