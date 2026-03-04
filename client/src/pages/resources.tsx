
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft,
  ExternalLink,
  MapPin,
  Heart
} from "lucide-react";
import { resourcesData, ResourceItem } from "@/lib/resources-data";
import { Button } from "@/components/ui/button";
import ResourceDetail from "@/components/resource-detail";
import { useSavedResources } from "@/lib/store";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { getCategoryConfig, type SupabaseCategory } from "@/lib/category-config";

export default function Resources() {
  const [location, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const { isSaved, toggleSave, userLocation } = useSavedResources();

  const { data: categories = [] } = useQuery<SupabaseCategory[]>({
    queryKey: ["/api/categories"],
    queryFn: () => fetch("/api/categories").then(r => r.json()),
  });

  // Read query param for category if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    if (category) {
      setSelectedCategory(decodeURIComponent(category));
    }
  }, [location]);

  const activeResources = selectedCategory ? (resourcesData[selectedCategory] || []).filter(r => {
    // If resource is specific to a state, only show if user matches that state
    if (r.state) {
      return r.state === userLocation.state;
    }
    // If not state-specific, show it (national resources)
    return true;
  }) : [];

  const handleToggleSave = (e: React.MouseEvent, resource: ResourceItem) => {
    e.stopPropagation(); // Prevent opening detail
    toggleSave(resource.id);
    const saved = isSaved(resource.id);
    toast({
      description: saved ? "Removed from My Saved Resources" : "Saved to My Saved Resources",
      duration: 2000,
    });
  };

  const clearCategory = () => {
    setSelectedCategory(null);
    setLocation("/resources"); // Clear query param
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
        <div className="flex items-center gap-2 mb-2">
          {selectedCategory && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 -ml-2 rounded-full" 
              onClick={clearCategory}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-2xl font-bold text-primary font-heading">
            {selectedCategory ? selectedCategory : "Resources"}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {selectedCategory 
            ? `Browse available resources for ${selectedCategory}.`
            : "Browse the full resource library by category."}
        </p>
      </div>

      {selectedCategory ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
            {activeResources?.map((resource, i) => (
              <Card 
                key={i} 
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
                            <MapPin className="h-2.5 w-2.5 mr-0.5" /> {resource.state === "South Carolina" ? "SC" : resource.state === "Texas" ? "TX" : "Local"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] bg-muted font-normal text-muted-foreground">
                          {resource.source}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] bg-muted font-normal text-muted-foreground capitalize">
                          {resource.type}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleToggleSave(e, resource)}
                      >
                        <Heart className={`h-5 w-5 ${isSaved(resource.id) ? 'fill-destructive text-destructive' : ''}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!activeResources || activeResources.length === 0) && (
              <p className="text-center text-muted-foreground py-8">No resources found for this category yet.</p>
            )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((cat) => {
            const config = getCategoryConfig(cat.slug);
            const Icon = config.icon;
            return (
              <Card 
                key={cat.id} 
                className="hover:border-primary/50 transition-colors cursor-pointer group shadow-sm hover:shadow-md"
                onClick={() => setSelectedCategory(cat.name)}
              >
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className={`p-2.5 rounded-lg transition-colors ${config.variant === 'destructive' ? 'bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground' : 'bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground'}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base font-heading group-hover:text-primary transition-colors">{cat.name}</CardTitle>
                    {config.variant === 'destructive' && <Badge variant="destructive" className="mt-1 text-[10px] h-5">Urgent</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-snug">{config.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
