
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Heart,
  MapPin,
  ExternalLink,
  Search,
  Loader2,
  Cloud,
  Smartphone,
} from "lucide-react";
import { useSavedResources } from "@/lib/store";
import { ResourceItem } from "@/lib/resources-data";
import ResourceDetail from "@/components/resource-detail";
import { Link } from "wouter";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/use-auth";

interface SupabaseResource {
  id: string;
  category_id: string;
  title: string;
  short_description: string | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  eligibility: string | null;
  source_name: string | null;
  source_type: string | null;
  last_verified: string | null;
  monetization_type: string | null;
  affiliate_url: string | null;
  sponsored: boolean;
  created_at: string;
  categories: { id: string; name: string; slug: string };
}

function toResourceItem(r: SupabaseResource): ResourceItem {
  return {
    id: r.id,
    title: r.title,
    category: r.categories?.name || "",
    description: r.short_description || "",
    source: r.source_name || "",
    type: (r.source_type as ResourceItem["type"]) || "guide",
    isLocal: !!r.state || !!r.city,
    state: r.state || undefined,
    city: r.city || undefined,
    zip: r.zip || undefined,
    website_url: r.website_url || undefined,
    phone: r.phone || undefined,
    email: r.email || undefined,
    address: r.address || undefined,
    eligibility: r.eligibility || undefined,
    sponsored: r.sponsored || false,
    affiliate_url: r.affiliate_url || undefined,
    monetization_type: r.monetization_type || undefined,
  };
}

export default function SavedResources() {
  const { savedIds, toggleSave } = useSavedResources();
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const { user } = useAuth();

  const { data: savedItems = [], isLoading } = useQuery<ResourceItem[]>({
    queryKey: ["/api/resources/by-ids", savedIds],
    queryFn: async () => {
      if (savedIds.length === 0) return [];
      const res = await fetch("/api/resources/by-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: savedIds }),
      });
      if (!res.ok) return [];
      const data: SupabaseResource[] = await res.json();
      return data.map(toResourceItem);
    },
    enabled: savedIds.length > 0,
  });

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
      
      <ResourceDetail 
        resource={selectedResource} 
        open={!!selectedResource} 
        onOpenChange={(open) => !open && setSelectedResource(null)} 
      />

      <div>
        <h1 className="text-2xl font-bold text-primary font-heading mb-2" data-testid="text-saved-title">My Saved Resources</h1>
        <p className="text-muted-foreground">
          Your collection of saved guides and benefits.
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1" data-testid="text-saved-device-note">
          {user ? (
            <>
              <Cloud className="h-3 w-3" />
              Synced to your account ({user.email}). Available on all your devices.
            </>
          ) : (
            <>
              <Smartphone className="h-3 w-3" />
              Saved on this device only. Sign in to sync across devices.
            </>
          )}
        </p>
      </div>

      {isLoading && savedIds.length > 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && savedIds.length > 0 && savedItems.length < savedIds.length && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          {savedIds.length - savedItems.length} saved resource{savedIds.length - savedItems.length > 1 ? "s are" : " is"} no longer available.
        </p>
      )}

      {!isLoading && savedItems.length > 0 ? (
        <div className="space-y-3">
          {savedItems.map((resource) => (
            <Card 
              key={resource.id} 
              data-testid={`card-saved-${resource.id}`}
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
                          <MapPin className="h-2.5 w-2.5 mr-0.5" /> {[resource.city, resource.state].filter(Boolean).join(", ") || "Local"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px] h-5 font-normal">
                        {resource.category}
                      </Badge>
                      {resource.source && (
                        <span className="text-xs text-muted-foreground">• {resource.source}</span>
                      )}
                    </div>
                    {resource.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{resource.description}</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      data-testid={`button-unsave-${resource.id}`}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleRemove(e, resource.id)}
                    >
                      <Heart className="h-5 w-5 fill-current" />
                    </Button>
                    {resource.website_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(resource.website_url, "_blank");
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !isLoading ? (
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
               <Button className="mt-2" data-testid="button-browse-resources">
                 <Search className="mr-2 h-4 w-4" /> Browse Resources
               </Button>
             </Link>
           </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
