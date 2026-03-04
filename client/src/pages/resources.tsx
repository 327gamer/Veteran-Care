
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft,
  ExternalLink,
  MapPin,
  Heart,
  Globe,
  MapPinned,
  Plus,
  Locate,
  Loader2,
  X,
  Info
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
import { useGeolocation } from "@/lib/use-geolocation";

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

function toResourceItem(r: SupabaseResource): ResourceItem & { city?: string; zip?: string } {
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
  };
}

function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  testId,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder: string;
  testId: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = value
    ? suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    : suggestions;

  const showDropdown = focused && open && filtered.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className={`relative ${className || ""}`}>
      <div className="relative">
        <Input
          data-testid={testId}
          placeholder={placeholder}
          className="h-9 text-xs pr-7"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
        />
        {value && (
          <button
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            tabIndex={-1}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {showDropdown && (
        <div className="absolute z-50 top-full mt-1 w-full bg-background border rounded-md shadow-lg max-h-[160px] overflow-y-auto">
          {filtered.map((item) => (
            <button
              key={item}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item);
                setOpen(false);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Resources() {
  const [location, setLocation] = useLocation();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const { isSaved, toggleSave, setLocation: setStoreLocation } = useSavedResources();

  const [locationMode, setLocationMode] = useState<"national" | "state">("national");
  const [selectedState, setSelectedState] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [zipFilter, setZipFilter] = useState<string>("");
  const [localOnly, setLocalOnly] = useState(false);
  const [geoApplied, setGeoApplied] = useState(false);
  const [debouncedCity, setDebouncedCity] = useState("");
  const [debouncedZip, setDebouncedZip] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCity(cityFilter), 300);
    return () => clearTimeout(t);
  }, [cityFilter]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedZip(zipFilter), 300);
    return () => clearTimeout(t);
  }, [zipFilter]);

  const geo = useGeolocation();

  const { data: categories = [] } = useQuery<SupabaseCategory[]>({
    queryKey: ["/api/categories"],
    queryFn: () => fetch("/api/categories").then(r => r.json()),
  });

  const stateParam = locationMode === "state" && selectedState ? selectedState : undefined;
  const cityParam = locationMode === "state" && debouncedCity.trim() ? debouncedCity.trim() : undefined;
  const zipParam = locationMode === "state" && debouncedZip.trim() ? debouncedZip.trim() : undefined;
  const hasLocationFilters = !!(stateParam || cityParam || zipParam);
  const hasAnyLocationInput = locationMode === "state" && !!(selectedState || cityFilter.trim() || zipFilter.trim());

  const { data: apiResources = [], isLoading: resourcesLoading, isFetched: resourcesFetched } = useQuery<SupabaseResource[]>({
    queryKey: ["/api/resources", selectedSlug, stateParam, cityParam, zipParam],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedSlug) params.set("category", selectedSlug);
      if (stateParam) params.set("state", stateParam);
      if (cityParam) params.set("city", cityParam);
      if (zipParam) params.set("zip", zipParam);
      return fetch(`/api/resources?${params}`).then(r => r.json());
    },
    enabled: !!selectedSlug,
  });

  const needsFallback = resourcesFetched && apiResources.length === 0 && hasLocationFilters && locationMode === "state" && !localOnly;

  const { data: fallbackResources = [], isLoading: fallbackLoading } = useQuery<SupabaseResource[]>({
    queryKey: ["/api/resources", selectedSlug, "national-fallback"],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedSlug) params.set("category", selectedSlug);
      return fetch(`/api/resources?${params}`).then(r => r.json());
    },
    enabled: needsFallback,
  });

  const { data: citySuggestions = [] } = useQuery<string[]>({
    queryKey: ["/api/locations/cities", stateParam, selectedSlug],
    queryFn: () => {
      const params = new URLSearchParams();
      if (stateParam) params.set("state", stateParam);
      if (selectedSlug) params.set("category", selectedSlug);
      return fetch(`/api/locations/cities?${params}`).then(r => r.json());
    },
    enabled: locationMode === "state" && !!stateParam,
  });

  const { data: zipSuggestions = [] } = useQuery<string[]>({
    queryKey: ["/api/locations/zips", stateParam, cityParam, selectedSlug],
    queryFn: () => {
      const params = new URLSearchParams();
      if (stateParam) params.set("state", stateParam);
      if (cityParam) params.set("city", cityParam);
      if (selectedSlug) params.set("category", selectedSlug);
      return fetch(`/api/locations/zips?${params}`).then(r => r.json());
    },
    enabled: locationMode === "state" && !!stateParam,
  });

  const isFallingBack = needsFallback && fallbackResources.length > 0;
  const displayResources = isFallingBack ? fallbackResources : apiResources;
  const activeResources = displayResources.map(toResourceItem);
  const isLoading = resourcesLoading || (needsFallback && fallbackLoading);

  const showLocalOnlyEmpty = resourcesFetched && apiResources.length === 0 && hasLocationFilters && locationMode === "state" && localOnly;

  const locationLabel = () => {
    const parts: string[] = [];
    if (selectedState) parts.push(selectedState);
    if (debouncedCity) parts.push(debouncedCity);
    if (debouncedZip) parts.push(debouncedZip);
    return parts.join(" / ");
  };

  useEffect(() => {
    if (geo.location && !geoApplied) {
      setGeoApplied(true);
      setLocationMode("state");
      if (geo.location.stateCode) setSelectedState(geo.location.stateCode);
      if (geo.location.city) setCityFilter(geo.location.city);
      if (geo.location.zip) setZipFilter(geo.location.zip);
      setStoreLocation(
        geo.location.stateCode,
        geo.location.state,
        geo.location.city,
        geo.location.zip
      );
    }
  }, [geo.location, geoApplied, setStoreLocation]);

  useEffect(() => {
    if (locationMode === "state") {
      const stateName = US_STATES.find(s => s.value === selectedState)?.label || "";
      setStoreLocation(selectedState, stateName, cityFilter, zipFilter);
    }
  }, [selectedState, cityFilter, zipFilter, locationMode, setStoreLocation]);

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

  const handleUseMyLocation = () => {
    geo.requestLocation();
    setGeoApplied(false);
  };

  const locationSummary = () => {
    const parts: string[] = [];
    if (selectedState) {
      const name = US_STATES.find(s => s.value === selectedState)?.label;
      parts.push(`Showing national + ${name || selectedState} resources`);
    }
    if (cityFilter) parts.push(`in ${cityFilter}`);
    if (zipFilter) parts.push(`(ZIP: ${zipFilter})`);
    return parts.join(" ");
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
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">Location:</span>
                <div className="flex rounded-full border bg-background overflow-hidden">
                  <button
                    data-testid="toggle-national"
                    onClick={() => { setLocationMode("national"); setSelectedState(""); setCityFilter(""); setZipFilter(""); setLocalOnly(false); }}
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
                    By Location
                  </button>
                </div>

                <Button
                  data-testid="button-use-location"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[10px] text-muted-foreground hover:text-primary ml-auto"
                  onClick={handleUseMyLocation}
                  disabled={geo.loading}
                >
                  {geo.loading ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Locate className="h-3 w-3 mr-1" />
                  )}
                  Use My Location
                </Button>
              </div>

              {locationMode === "state" && (
                <>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select key={selectedState || "empty"} value={selectedState || undefined} onValueChange={(v) => { setSelectedState(v); setCityFilter(""); setZipFilter(""); }}>
                      <SelectTrigger data-testid="select-state" className="h-9 text-xs flex-1">
                        <SelectValue placeholder="Select a state" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {US_STATES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <AutocompleteInput
                      value={cityFilter}
                      onChange={(v) => { setCityFilter(v); setZipFilter(""); }}
                      suggestions={citySuggestions}
                      placeholder="City"
                      testId="input-city-filter"
                      className="flex-1"
                    />
                    <AutocompleteInput
                      value={zipFilter}
                      onChange={setZipFilter}
                      suggestions={zipSuggestions}
                      placeholder="ZIP Code"
                      testId="input-zip-filter"
                      className="w-28 sm:w-32"
                    />
                  </div>

                  {hasAnyLocationInput && (
                    <div className="flex items-center justify-between">
                      <label
                        data-testid="toggle-local-only"
                        className="flex items-center gap-2 cursor-pointer select-none"
                      >
                        <div
                          role="switch"
                          aria-checked={localOnly}
                          onClick={() => setLocalOnly(!localOnly)}
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer ${localOnly ? "bg-primary" : "bg-muted-foreground/30"}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${localOnly ? "translate-x-4" : "translate-x-0"}`} />
                        </div>
                        <span className="text-[11px] text-muted-foreground">Local only</span>
                      </label>
                    </div>
                  )}
                </>
              )}

              {locationMode === "state" && (selectedState || cityFilter || zipFilter) && !isFallingBack && !showLocalOnlyEmpty && (
                <p data-testid="text-location-summary" className="text-[10px] text-muted-foreground">
                  {locationSummary()}
                </p>
              )}

              {geo.error && (
                <p className="text-[10px] text-destructive">{geo.error}</p>
              )}
            </div>

            {isFallingBack && (
              <div data-testid="text-fallback-notice" className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  No local resources found yet for {locationLabel()} — showing national resources.
                </p>
              </div>
            )}

            {showLocalOnlyEmpty && (
              <div data-testid="text-local-only-empty" className="flex flex-col items-center gap-2 py-10 text-center">
                <MapPin className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No local resources found for {locationLabel()}.
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Turn off "Local only" to see national resources, or submit a resource to help grow coverage.
                </p>
              </div>
            )}

            {isLoading && (
              <p className="text-center text-muted-foreground py-8">Loading resources...</p>
            )}
            {!showLocalOnlyEmpty && activeResources?.map((resource) => (
              <Card 
                key={resource.id} 
                data-testid={`card-resource-${resource.id}`}
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
                        data-testid={`button-save-${resource.id}`}
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleToggleSave(e, resource)}
                      >
                        <Heart className={`h-5 w-5 ${isSaved(resource.id) ? 'fill-destructive text-destructive' : ''}`} />
                      </Button>
                      <Button data-testid={`button-detail-${resource.id}`} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!isLoading && !showLocalOnlyEmpty && (!activeResources || activeResources.length === 0) && (
              <p data-testid="text-no-resources" className="text-center text-muted-foreground py-8">No resources found for this category yet.</p>
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
                data-testid={`card-category-${cat.slug}`}
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

      <div className="pt-2 pb-4">
        <Button
          data-testid="button-submit-resource"
          variant="outline"
          className="w-full h-11 border-dashed border-primary/40 text-primary hover:bg-primary/5"
          onClick={() => setLocation("/submit-resource")}
        >
          <Plus className="h-4 w-4 mr-2" /> Submit a Resource
        </Button>
      </div>
    </div>
  );
}
