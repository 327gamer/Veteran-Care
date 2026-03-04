
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft,
  ExternalLink,
  MapPin,
  Heart,
  Globe,
  MapPinned
} from "lucide-react";
import { ResourceItem } from "@/lib/resources-data";
import { Button } from "@/components/ui/button";
import ResourceDetail from "@/components/resource-detail";
import { useSavedResources } from "@/lib/store";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";
import { getCategoryConfig, type SupabaseCategory } from "@/lib/category-config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const US_STATES = [
  { label: "Alabama", value: "AL" }, { label: "Alaska", value: "AK" }, { label: "Arizona", value: "AZ" },
  { label: "Arkansas", value: "AR" }, { label: "California", value: "CA" }, { label: "Colorado", value: "CO" },
  { label: "Connecticut", value: "CT" }, { label: "Delaware", value: "DE" }, { label: "Florida", value: "FL" },
  { label: "Georgia", value: "GA" }, { label: "Hawaii", value: "HI" }, { label: "Idaho", value: "ID" },
  { label: "Illinois", value: "IL" }, { label: "Indiana", value: "IN" }, { label: "Iowa", value: "IA" },
  { label: "Kansas", value: "KS" }, { label: "Kentucky", value: "KY" }, { label: "Louisiana", value: "LA" },
  { label: "Maine", value: "ME" }, { label: "Maryland", value: "MD" }, { label: "Massachusetts", value: "MA" },
  { label: "Michigan", value: "MI" }, { label: "Minnesota", value: "MN" }, { label: "Mississippi", value: "MS" },
  { label: "Missouri", value: "MO" }, { label: "Montana", value: "MT" }, { label: "Nebraska", value: "NE" },
  { label: "Nevada", value: "NV" }, { label: "New Hampshire", value: "NH" }, { label: "New Jersey", value: "NJ" },
  { label: "New Mexico", value: "NM" }, { label: "New York", value: "NY" }, { label: "North Carolina", value: "NC" },
  { label: "North Dakota", value: "ND" }, { label: "Ohio", value: "OH" }, { label: "Oklahoma", value: "OK" },
  { label: "Oregon", value: "OR" }, { label: "Pennsylvania", value: "PA" }, { label: "Rhode Island", value: "RI" },
  { label: "South Carolina", value: "SC" }, { label: "South Dakota", value: "SD" }, { label: "Tennessee", value: "TN" },
  { label: "Texas", value: "TX" }, { label: "Utah", value: "UT" }, { label: "Vermont", value: "VT" },
  { label: "Virginia", value: "VA" }, { label: "Washington", value: "WA" }, { label: "West Virginia", value: "WV" },
  { label: "Wisconsin", value: "WI" }, { label: "Wyoming", value: "WY" },
];

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
    isLocal: !!r.state,
    state: r.state || undefined,
  };
}

export default function Resources() {
  const [location, setLocation] = useLocation();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const { isSaved, toggleSave } = useSavedResources();

  const [locationMode, setLocationMode] = useState<"national" | "state">("national");
  const [selectedState, setSelectedState] = useState<string>("");
  const [cityPlaceholder, setCityPlaceholder] = useState<string>("");
  const [zipPlaceholder, setZipPlaceholder] = useState<string>("");

  const { data: categories = [] } = useQuery<SupabaseCategory[]>({
    queryKey: ["/api/categories"],
    queryFn: () => fetch("/api/categories").then(r => r.json()),
  });

  const stateParam = locationMode === "state" && selectedState ? selectedState : undefined;

  const { data: apiResources = [], isLoading: resourcesLoading } = useQuery<SupabaseResource[]>({
    queryKey: ["/api/resources", selectedSlug, stateParam],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedSlug) params.set("category", selectedSlug);
      if (stateParam) params.set("state", stateParam);
      return fetch(`/api/resources?${params}`).then(r => r.json());
    },
    enabled: !!selectedSlug,
  });

  const activeResources = apiResources.map(toResourceItem);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get("category");
    if (categoryParam && categories.length > 0) {
      const cat = categories.find(c => c.name === decodeURIComponent(categoryParam) || c.slug === decodeURIComponent(categoryParam));
      if (cat) {
        setSelectedSlug(cat.slug);
        setSelectedName(cat.name);
      }
    }
  }, [location, categories]);

  const handleToggleSave = (e: React.MouseEvent, resource: ResourceItem) => {
    e.stopPropagation();
    toggleSave(resource.id);
    const saved = isSaved(resource.id);
    toast({
      description: saved ? "Removed from My Saved Resources" : "Saved to My Saved Resources",
      duration: 2000,
    });
  };

  const selectCategory = (cat: SupabaseCategory) => {
    setSelectedSlug(cat.slug);
    setSelectedName(cat.name);
    setLocation(`/resources?category=${encodeURIComponent(cat.slug)}`);
  };

  const clearCategory = () => {
    setSelectedSlug(null);
    setSelectedName(null);
    setLocation("/resources");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      <ResourceDetail 
        resource={selectedResource} 
        open={!!selectedResource} 
        onOpenChange={(open) => !open && setSelectedResource(null)} 
      />

      <div>
        <div className="flex items-center gap-2 mb-2">
          {selectedSlug && (
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
            {selectedName ? selectedName : "Resources"}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {selectedName 
            ? `Browse available resources for ${selectedName}.`
            : "Browse the full resource library by category."}
        </p>
      </div>

      {selectedSlug ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col gap-3 p-3 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Location:</span>
                <div className="flex rounded-full border bg-background overflow-hidden">
                  <button
                    data-testid="toggle-national"
                    onClick={() => { setLocationMode("national"); setSelectedState(""); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${locationMode === "national" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Globe className="h-3 w-3" />
                    National
                  </button>
                  <button
                    data-testid="toggle-by-state"
                    onClick={() => setLocationMode("state")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${locationMode === "state" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <MapPinned className="h-3 w-3" />
                    By State
                  </button>
                </div>
              </div>

              {locationMode === "state" && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger data-testid="select-state" className="h-9 text-xs flex-1">
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {US_STATES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    data-testid="input-city"
                    placeholder="City (coming soon)"
                    disabled
                    className="h-9 text-xs flex-1 opacity-50"
                    value={cityPlaceholder}
                    onChange={(e) => setCityPlaceholder(e.target.value)}
                  />
                  <Input
                    data-testid="input-zip"
                    placeholder="ZIP (coming soon)"
                    disabled
                    className="h-9 text-xs w-28 opacity-50"
                    value={zipPlaceholder}
                    onChange={(e) => setZipPlaceholder(e.target.value)}
                  />
                </div>
              )}

              {locationMode === "state" && selectedState && (
                <p className="text-[10px] text-muted-foreground">
                  Showing national resources + {US_STATES.find(s => s.value === selectedState)?.label} state resources
                </p>
              )}
            </div>

            {resourcesLoading && (
              <p className="text-center text-muted-foreground py-8">Loading resources...</p>
            )}
            {activeResources?.map((resource) => (
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
            {!resourcesLoading && (!activeResources || activeResources.length === 0) && (
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
                onClick={() => selectCategory(cat)}
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
