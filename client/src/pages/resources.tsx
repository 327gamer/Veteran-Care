
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
  Radar,
  Plus,
  Locate,
  Loader2,
  X,
  Info,
  Search,
  FilterX,
  AlertTriangle,
  Phone as PhoneIcon,
  Zap,
  ShieldCheck,
  Settings,
  ShieldAlert,
  Building2,
} from "lucide-react";
import { ResourceItem } from "@/lib/resources-data";
import { Button } from "@/components/ui/button";
import ResourceDetail from "@/components/resource-detail";
import { useSavedResources } from "@/lib/store";
import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";
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
  subcategory: string | null;
  service_priority: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_miles?: number | null;
  is_national?: boolean;
  created_at: string;
  categories: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
}

function getCategoryName(cats: SupabaseResource["categories"]): string {
  if (!cats) return "";
  if (Array.isArray(cats)) return cats.map(c => c.name).join(", ");
  return cats.name || "";
}

function toResourceItem(r: SupabaseResource): ResourceItem {
  return {
    id: r.id,
    title: r.title,
    category: getCategoryName(r.categories),
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
    distance_miles: r.distance_miles ?? undefined,
    is_national: r.is_national || false,
    latitude: r.latitude,
    longitude: r.longitude,
    service_priority: r.service_priority || undefined,
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

  useEffect(() => {
    if (selectedResource) {
      const closeOnNav = () => setSelectedResource(null);
      window.addEventListener("close-resource-detail", closeOnNav);
      return () => window.removeEventListener("close-resource-detail", closeOnNav);
    }
  }, [selectedResource]);

  const [locationMode, setLocationMode] = useState<"national" | "state" | "nearme" | "city">("national");
  const [selectedState, setSelectedState] = useState<string>("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [zipFilter, setZipFilter] = useState<string>("");
  const [localOnly, setLocalOnly] = useState(false);
  const [geoApplied, setGeoApplied] = useState(false);
  const [debouncedCity, setDebouncedCity] = useState("");
  const [debouncedZip, setDebouncedZip] = useState("");
  const [nearMeRadius, setNearMeRadius] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<string | null>(null);
  const [subFilter, setSubFilter] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCity(cityFilter), 300);
    return () => clearTimeout(t);
  }, [cityFilter]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedZip(zipFilter), 300);
    return () => clearTimeout(t);
  }, [zipFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      if (searchQuery.trim()) {
        trackEvent("search_submit", { query: searchQuery.trim(), category: selectedSlug || "" });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const geo = useGeolocation();

  const { data: categories = [] } = useQuery<SupabaseCategory[]>({
    queryKey: ["/api/categories"],
    queryFn: () => fetch("/api/categories").then(r => r.json()),
  });

  const { data: trustedPartners = [] } = useQuery<any[]>({
    queryKey: ["/api/trusted-partners-for-category", selectedSlug],
    queryFn: () => selectedSlug ? fetch(`/api/trusted-partners-for-category/${selectedSlug}`).then(r => r.json()) : Promise.resolve([]),
    enabled: !!selectedSlug,
  });

  const stateParam = locationMode === "state" && selectedState ? selectedState : undefined;
  const cityParam = (locationMode === "state" || locationMode === "city") && debouncedCity.trim() ? debouncedCity.trim() : undefined;
  const zipParam = locationMode === "state" && debouncedZip.trim() ? debouncedZip.trim() : undefined;
  const hasLocationFilters = !!(stateParam || cityParam || zipParam);
  const hasAnyLocationInput = (locationMode === "state" && !!(selectedState || cityFilter.trim() || zipFilter.trim())) || (locationMode === "city" && !!cityFilter.trim());

  const nearMeLat = locationMode === "nearme" && geo.location ? geo.location.lat : undefined;
  const nearMeLng = locationMode === "nearme" && geo.location ? geo.location.lng : undefined;

  const searchParam = debouncedSearch.trim() || undefined;

  const isNearMeQuery = locationMode === "nearme" && nearMeLat !== undefined && nearMeLng !== undefined;

  const { data: rawApiResponse, isLoading: resourcesLoading, isFetched: resourcesFetched } = useQuery<SupabaseResource[] | { results: SupabaseResource[]; local_count: number }>({
    queryKey: ["/api/resources", selectedSlug, stateParam, cityParam, zipParam, nearMeLat, nearMeLng, nearMeRadius, locationMode, searchParam, subFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedSlug) params.set("category", selectedSlug);
      if (searchParam) params.set("q", searchParam);
      if (subFilter) params.set("sub", subFilter);
      if (isNearMeQuery) {
        params.set("user_lat", String(nearMeLat));
        params.set("user_lng", String(nearMeLng));
        params.set("radius_miles", String(nearMeRadius));
      } else {
        if (stateParam) params.set("state", stateParam);
        if (cityParam) params.set("city", cityParam);
        if (zipParam) params.set("zip", zipParam);
      }
      return fetch(`/api/resources?${params}`).then(r => r.json());
    },
    enabled: (!!selectedSlug || !!searchParam || isNearMeQuery || (locationMode === "city" && !!cityParam)) && (locationMode !== "nearme" || isNearMeQuery),
  });

  const apiResources: SupabaseResource[] = rawApiResponse
    ? (Array.isArray(rawApiResponse) ? rawApiResponse : rawApiResponse.results)
    : [];
  const nearMeLocalCount: number | null = rawApiResponse && !Array.isArray(rawApiResponse)
    ? rawApiResponse.local_count
    : null;

  const hasNoLocalNearMe = resourcesFetched && isNearMeQuery && nearMeLocalCount === 0;

  const needsFallback = resourcesFetched && apiResources.length === 0 && !searchParam &&
    ((hasLocationFilters && (locationMode === "state" || locationMode === "city") && !localOnly));

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
    queryKey: ["/api/locations/cities", stateParam, selectedSlug, locationMode],
    queryFn: () => {
      const params = new URLSearchParams();
      if (stateParam) params.set("state", stateParam);
      if (selectedSlug) params.set("category", selectedSlug);
      return fetch(`/api/locations/cities?${params}`).then(r => r.json());
    },
    enabled: locationMode === "city" || (locationMode === "state" && !!stateParam),
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
  const isNearMeActive = isNearMeQuery;

  const PRIORITY_ORDER: Record<string, number> = {
    immediate: 0,
    same_week: 1,
    standard: 2,
    information: 3,
  };

  const sortedResources = (() => {
    const items = displayResources.map(toResourceItem);

    const prioritySort = (a: ResourceItem, b: ResourceItem) => {
      if (!urgencyFilter) return 0;
      const matchTarget = urgencyFilter;
      const aMatch = a.service_priority === matchTarget ? 0 : 1;
      const bMatch = b.service_priority === matchTarget ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      const aRank = PRIORITY_ORDER[a.service_priority || "information"] ?? 4;
      const bRank = PRIORITY_ORDER[b.service_priority || "information"] ?? 4;
      return aRank - bRank;
    };

    if (!isNearMeActive) {
      if (urgencyFilter) {
        return [...items].sort(prioritySort);
      }
      return items;
    }

    const withDistance: ResourceItem[] = [];
    const localCity: ResourceItem[] = [];
    const statewide: ResourceItem[] = [];
    const national: ResourceItem[] = [];

    for (const r of items) {
      if (r.distance_miles != null) {
        withDistance.push(r);
      } else if (r.is_national || (!r.state && !r.city)) {
        national.push(r);
      } else if (r.state && !r.city) {
        statewide.push(r);
      } else {
        localCity.push(r);
      }
    }

    withDistance.sort((a, b) => (a.distance_miles ?? Infinity) - (b.distance_miles ?? Infinity));
    if (urgencyFilter) {
      localCity.sort(prioritySort);
      statewide.sort(prioritySort);
      national.sort(prioritySort);
    }
    return [...withDistance, ...localCity, ...statewide, ...national];
  })();

  const activeResources = sortedResources;
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
    const qParam = params.get("q");
    if (qParam) {
      setSearchQuery(decodeURIComponent(qParam));
    }
    const subParam = params.get("sub");
    if (subParam) {
      const decoded = decodeURIComponent(subParam);
      setSubFilter(decoded);
      trackEvent("subcategory_view", { subcategory: decoded, category: selectedSlug || "" });
    } else {
      setSubFilter(null);
    }
    const urg = params.get("urgency");
    if (urg && ["immediate", "same_week", "standard", "information"].includes(urg)) {
      setUrgencyFilter(urg);
    }
    const modeParam = params.get("mode");
    if (modeParam === "nearme") {
      setLocationMode("nearme");
      setGeoApplied(true);
      geo.requestLocation();
    } else if (locationMode === "nearme") {
      setLocationMode("national");
    }
  }, [location, categories]);

  const handleToggleSave = (e: React.MouseEvent, resource: ResourceItem) => {
    e.stopPropagation();
    const wasSaved = isSaved(resource.id);
    toggleSave(resource.id);
    toast({
      description: wasSaved ? "Removed from My Saved Resources" : "Saved to My Saved Resources",
      duration: 2000,
    });
  };

  const selectCategory = (cat: SupabaseCategory) => {
    trackEvent("category_view", { category: cat.slug });
    if (cat.slug === "end-of-life-services") {
      setLocation("/end-of-life");
      return;
    }
    setSelectedSlug(cat.slug);
    setSelectedName(cat.name);
    setLocation(`/resources?category=${encodeURIComponent(cat.slug)}`);
  };

  const clearCategory = () => {
    setSelectedSlug(null);
    setSelectedName(null);
    setSearchQuery("");
    setLocation("/resources");
  };

  const clearAllFilters = () => {
    setLocationMode("national");
    setSelectedState("");
    setCityFilter("");
    setZipFilter("");
    setSearchQuery("");
    setLocalOnly(false);
    setNearMeRadius(25);
  };

  const hasActiveFilters = locationMode !== "national" || searchQuery.trim() !== "" || localOnly || !!subFilter || cityFilter.trim() !== "";

  const filterChips: { label: string; onRemove: () => void }[] = [];
  if (selectedState) {
    const stateName = US_STATES.find(s => s.value === selectedState)?.label || selectedState;
    filterChips.push({ label: stateName, onRemove: () => { setSelectedState(""); setCityFilter(""); setZipFilter(""); if (!cityFilter && !zipFilter) setLocationMode("national"); } });
  }
  if (cityFilter.trim()) {
    filterChips.push({ label: cityFilter.trim(), onRemove: () => { setCityFilter(""); setZipFilter(""); if (locationMode === "city") setLocationMode("national"); } });
  }
  if (zipFilter.trim()) {
    filterChips.push({ label: `ZIP: ${zipFilter.trim()}`, onRemove: () => setZipFilter("") });
  }
  if (searchQuery.trim()) {
    filterChips.push({ label: `Search: ${searchQuery.trim()}`, onRemove: () => setSearchQuery("") });
  }
  if (locationMode === "nearme") {
    filterChips.push({ label: `Near Me (${nearMeRadius} mi)`, onRemove: () => { setLocationMode("national"); } });
  }
  if (localOnly) {
    filterChips.push({ label: "Local only", onRemove: () => setLocalOnly(false) });
  }
  if (subFilter) {
    const subLabel = subFilter.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    filterChips.push({ label: subLabel, onRemove: () => { setSubFilter(null); setLocation(`/resources?category=${selectedSlug || "end-of-life-services"}`); } });
  }

  const handleUseMyLocation = () => {
    setLocationMode("nearme");
    geo.requestLocation();
    trackEvent("near_me_use");
  };

  const locationSummary = () => {
    const parts: string[] = [];
    if (locationMode === "city" && cityFilter) {
      parts.push(`Showing resources in ${cityFilter}`);
    } else {
      if (selectedState) {
        const name = US_STATES.find(s => s.value === selectedState)?.label;
        parts.push(`Showing national + ${name || selectedState} resources`);
      }
      if (cityFilter) parts.push(`in ${cityFilter}`);
      if (zipFilter) parts.push(`(ZIP: ${zipFilter})`);
    }
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
          {(selectedSlug || locationMode === "nearme" || locationMode === "city") && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 -ml-2 rounded-full" 
              onClick={() => {
                if ((locationMode === "nearme" || locationMode === "city") && !selectedSlug) {
                  setLocationMode("national");
                  setCityFilter("");
                  setLocation("/resources");
                } else if (selectedSlug === "end-of-life-services" && subFilter) {
                  setSubFilter(null);
                  setLocation("/end-of-life");
                } else if (selectedSlug === "end-of-life-services") {
                  setLocation("/end-of-life");
                } else {
                  clearCategory();
                }
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="text-3xl font-extrabold text-primary font-heading tracking-tight">
            {selectedName ? selectedName : locationMode === "nearme" ? "Near You" : "Resources"}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {selectedName 
            ? `Browse available resources for ${selectedName}.`
            : locationMode === "nearme"
              ? (geo.location ? `Showing resources near ${geo.location.city || geo.location.stateCode || "your location"}.` : "Finding resources near you...")
              : "Browse the full resource library by category."}
        </p>
      </div>

      {/* Search Bar - Always visible */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          data-testid="input-search-resources"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={selectedSlug ? "Search resources..." : "Search all resources (housing, VA benefits, food assistance...)"}
          className="w-full h-10 pl-9 pr-9 rounded-lg border bg-background text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {searchQuery && (
          <button
            data-testid="button-clear-search"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {(selectedSlug || locationMode === "nearme" || locationMode === "city") ? (
        <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="sticky top-0 z-10 -mx-4 px-4 pt-2 pb-3 bg-background/95 backdrop-blur-sm border-b border-border/40 shadow-sm space-y-3">

            <div className="flex flex-col gap-3 p-3 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">Location:</span>
                <div className="flex rounded-full border bg-background overflow-x-auto no-scrollbar">
                  <button
                    data-testid="toggle-national"
                    onClick={() => { setLocationMode("national"); setSelectedState(""); setCityFilter(""); setZipFilter(""); setLocalOnly(false); }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${locationMode === "national" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Globe className="h-3 w-3" />
                    All
                  </button>
                  <button
                    data-testid="toggle-near-me"
                    onClick={() => {
                      setLocationMode("nearme");
                      if (!geo.location) {
                        geo.requestLocation();
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${locationMode === "nearme" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Radar className="h-3 w-3" />
                    Near Me
                  </button>
                  <button
                    data-testid="toggle-by-city"
                    onClick={() => { setLocationMode("city"); setSelectedState(""); setZipFilter(""); }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${locationMode === "city" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Building2 className="h-3 w-3" />
                    City
                  </button>
                  <button
                    data-testid="toggle-by-state"
                    onClick={() => { setLocationMode("state"); setCityFilter(""); }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${locationMode === "state" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <MapPinned className="h-3 w-3" />
                    State
                  </button>
                </div>
              </div>

              {locationMode === "state" && (
                <div className="flex justify-end -mt-1 mb-1">
                  <Button
                    data-testid="button-use-location"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[10px] text-muted-foreground hover:text-primary"
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
              )}

              {locationMode === "nearme" && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Radius:</span>
                  <div className="flex rounded-full border bg-background overflow-hidden">
                    {[10, 25, 50, 100].map((r) => (
                      <button
                        key={r}
                        data-testid={`radius-${r}`}
                        onClick={() => setNearMeRadius(r)}
                        className={`px-3 py-1 text-xs font-medium transition-colors ${nearMeRadius === r ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {r} mi
                      </button>
                    ))}
                  </div>
                  {geo.loading && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" /> Getting location...
                    </span>
                  )}
                  {geo.location && !geo.loading && (
                    <span className="text-[10px] text-muted-foreground">
                      Near {geo.location.city || geo.location.stateCode}
                    </span>
                  )}
                </div>
              )}

              {locationMode === "city" && (
                <div className="flex flex-col gap-2">
                  <AutocompleteInput
                    value={cityFilter}
                    onChange={(v) => { setCityFilter(v); trackEvent("city_filter_use", { city: v }); }}
                    suggestions={citySuggestions}
                    placeholder="Type a city name..."
                    testId="input-city-filter-standalone"
                    className="flex-1"
                  />
                  {cityFilter.trim() && (
                    <p data-testid="text-city-summary" className="text-[10px] text-muted-foreground">
                      {locationSummary()}
                    </p>
                  )}
                </div>
              )}

              {locationMode === "state" && (
                <>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select key={selectedState || "empty"} value={selectedState || undefined} onValueChange={(v) => { trackEvent("state_filter_use", { state: v }); setSelectedState(v); setCityFilter(""); setZipFilter(""); }}>
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

              {locationMode === "nearme" && !geo.location && !geo.loading && geo.error && (
                <div className="flex flex-col items-center text-center py-6 px-4 bg-background border rounded-xl shadow-sm space-y-4">
                  {geo.permDenied ? (
                    <>
                      <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <ShieldAlert className="h-5 w-5 text-amber-600" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-heading font-bold text-foreground">Location Access Blocked</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Location access is currently blocked on your device. To use Near Me, update your settings:
                        </p>
                      </div>
                      <div className="w-full max-w-xs text-left bg-muted/50 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Settings className="h-3.5 w-3.5" /> For iPhone Safari:
                        </p>
                        <ol className="text-xs text-muted-foreground space-y-1 pl-5 list-decimal">
                          <li>Open <b>Settings</b> on your iPhone</li>
                          <li>Scroll down and tap <b>Safari</b></li>
                          <li>Tap <b>Location</b></li>
                          <li>Select <b>"Ask"</b> or <b>"Allow"</b></li>
                          <li>Return here and tap <b>Try Again</b></li>
                        </ol>
                        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 pt-1">
                          <Settings className="h-3.5 w-3.5" /> For iPhone Chrome:
                        </p>
                        <ol className="text-xs text-muted-foreground space-y-1 pl-5 list-decimal">
                          <li>Open <b>Settings</b> → <b>Chrome</b></li>
                          <li>Tap <b>Location</b></li>
                          <li>Select <b>"While Using the App"</b></li>
                          <li>Return here and tap <b>Try Again</b></li>
                        </ol>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        If location still isn't working in Safari, please try Chrome. You can also search by City or State.
                      </p>
                      <div className="w-full space-y-2 max-w-xs">
                        <Button
                          data-testid="button-switch-to-city-denied"
                          className="w-full h-10 text-sm font-bold rounded-full shadow"
                          onClick={() => { setLocationMode("city"); }}
                        >
                          <Building2 className="h-4 w-4 mr-2" /> Search by City
                        </Button>
                        <Button
                          data-testid="button-switch-to-state"
                          variant="outline"
                          className="w-full h-10 text-sm font-medium rounded-full"
                          onClick={() => setLocationMode("state")}
                        >
                          <MapPinned className="h-4 w-4 mr-2" /> Search by State
                        </Button>
                        <Button
                          data-testid="button-retry-location"
                          variant="ghost"
                          className="w-full text-sm font-medium text-muted-foreground h-9"
                          onClick={() => geo.requestLocation(true)}
                        >
                          <Locate className="h-4 w-4 mr-2" /> Try Again
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-14 w-14 rounded-full bg-primary/5 flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary fill-primary" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-heading font-bold text-primary">Enable Location</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Location isn't available right now. You can still search by City or State.
                        </p>
                      </div>
                      <div className="w-full space-y-2 max-w-xs">
                        <Button
                          data-testid="button-allow-location"
                          className="w-full h-10 text-sm font-bold rounded-full shadow"
                          onClick={() => geo.requestLocation(true)}
                        >
                          <Locate className="h-4 w-4 mr-2" /> Allow Location
                        </Button>
                        <Button
                          data-testid="button-switch-to-city-prompt"
                          variant="outline"
                          className="w-full h-10 text-sm font-medium rounded-full"
                          onClick={() => { setLocationMode("city"); }}
                        >
                          <Building2 className="h-4 w-4 mr-2" /> Search by City
                        </Button>
                        <Button
                          data-testid="button-switch-to-state"
                          variant="ghost"
                          className="w-full text-sm font-medium text-muted-foreground h-9"
                          onClick={() => setLocationMode("state")}
                        >
                          Search by State Instead
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {geo.error && locationMode !== "nearme" && (
                <p className="text-[10px] text-destructive">{geo.error}</p>
              )}

            </div>
          </div>

            {!isLoading && !showLocalOnlyEmpty && activeResources && activeResources.length > 0 && (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span data-testid="text-results-count" className="text-xs text-muted-foreground">
                  Showing {activeResources.length} resource{activeResources.length !== 1 ? "s" : ""}{isNearMeActive ? " \u2013 sorted by distance" : ""}
                </span>
                {hasActiveFilters && (
                  <button
                    data-testid="button-clear-filters"
                    onClick={clearAllFilters}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <FilterX className="h-3 w-3" />
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {filterChips.length > 0 && (
              <div data-testid="filter-chips" className="flex items-center gap-1.5 flex-wrap">
                {filterChips.map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium"
                  >
                    {chip.label}
                    <button
                      data-testid={`chip-remove-${chip.label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                      onClick={chip.onRemove}
                      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {urgencyFilter === "immediate" && (
              <div data-testid="banner-immediate-urgency" className="rounded-lg border border-red-300 bg-red-50 p-3 space-y-1.5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Crisis Resources
                  </p>
                  <button
                    data-testid="button-dismiss-urgency"
                    onClick={() => setUrgencyFilter(null)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <a href="tel:988" className="flex items-center gap-2 text-xs font-bold text-red-700 hover:underline">
                  <PhoneIcon className="h-3.5 w-3.5" /> 988 Suicide & Crisis Lifeline
                </a>
                <a href="tel:18002738255" className="flex items-center gap-2 text-xs font-bold text-red-700 hover:underline">
                  <PhoneIcon className="h-3.5 w-3.5" /> Veterans Crisis Line: 1-800-273-8255 (Press 1)
                </a>
                <p className="text-[10px] text-red-600">Urgent resources are shown first below.</p>
              </div>
            )}

            {urgencyFilter && urgencyFilter !== "immediate" && (
              <div data-testid="banner-urgency-active" className="flex items-center justify-between p-2.5 rounded-lg border border-blue-200 bg-blue-50">
                <span className="text-xs text-blue-800 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  Sorted by {urgencyFilter === "same_week" ? "this week" : urgencyFilter} priority
                </span>
                <button
                  data-testid="button-dismiss-urgency"
                  onClick={() => setUrgencyFilter(null)}
                  className="text-blue-400 hover:text-blue-600 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {hasNoLocalNearMe && (
              <div data-testid="text-nearme-no-local" className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-xs text-amber-800">
                    No resources found within {nearMeRadius} miles — showing national resources below.
                  </p>
                  {nearMeRadius < 100 && (
                    <Button
                      data-testid="button-expand-radius"
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] px-2"
                      onClick={() => setNearMeRadius(nearMeRadius <= 25 ? 50 : 100)}
                    >
                      <Radar className="h-3 w-3 mr-1" /> Try {nearMeRadius <= 25 ? 50 : 100} miles instead
                    </Button>
                  )}
                </div>
              </div>
            )}

            {isFallingBack && !hasNoLocalNearMe && (
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

            {locationMode === "nearme" && geo.loading && (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Getting your location...</p>
              </div>
            )}
            {isLoading && !geo.loading && (
              <p className="text-center text-muted-foreground py-8">Loading resources...</p>
            )}
            {trustedPartners.length > 0 && (
              <div className="space-y-3 mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">Verified Partners</span>
                </div>
                {trustedPartners.map((partner: any) => (
                  <Card
                    key={`tp-${partner.id}`}
                    data-testid={`card-trusted-partner-${partner.id}`}
                    className="group border-emerald-200 bg-emerald-50/30 hover:border-emerald-400 transition-colors cursor-pointer"
                    onClick={() => {
                      if (partner.website_url) window.open(partner.website_url.startsWith("http") ? partner.website_url : `https://${partner.website_url}`, "_blank");
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-base group-hover:text-emerald-700 transition-colors line-clamp-1">{partner.name}</h3>
                            <Badge className="text-[10px] h-5 px-1.5 bg-emerald-600 text-white border-none shrink-0">
                              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> Verified Partner
                            </Badge>
                            {partner.is_featured && (
                              <Badge className="text-[10px] h-5 px-1.5 bg-amber-500 text-white border-none shrink-0">
                                <Zap className="h-2.5 w-2.5 mr-0.5" /> Featured
                              </Badge>
                            )}
                          </div>
                          {partner.short_description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{partner.short_description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {partner.city && partner.state && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {partner.city}, {partner.state}
                              </span>
                            )}
                            {partner.phone && (
                              <a href={`tel:${partner.phone}`} className="flex items-center gap-1 text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                                <PhoneIcon className="h-3 w-3" /> {partner.phone}
                              </a>
                            )}
                            {partner.website_url && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" /> Website
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {partner.website_url && (
                            <Button data-testid={`button-partner-visit-${partner.id}`} variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                        {!selectedSlug && resource.category && (
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">{resource.category}</Badge>
                        )}
                        {resource.sponsored && (
                          <Badge className="text-[10px] h-5 px-1.5 bg-amber-500 text-white border-none shrink-0">
                            Sponsored
                          </Badge>
                        )}
                        {resource.distance_miles != null && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-blue-300 text-blue-600 bg-blue-50 shrink-0">
                            <Radar className="h-2.5 w-2.5 mr-0.5" /> {resource.distance_miles} mi
                          </Badge>
                        )}
                        {resource.distance_miles == null && isNearMeActive && (() => {
                          const isNational = resource.is_national || (!resource.state && !resource.city);
                          const isStatewide = !isNational && resource.state && !resource.city;
                          const isLocalNoGeo = !isNational && !isStatewide;
                          if (isNational) return (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-slate-300 text-slate-500 bg-slate-50 shrink-0">
                              <Globe className="h-2.5 w-2.5 mr-0.5" /> National
                            </Badge>
                          );
                          if (isStatewide) return (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-indigo-300 text-indigo-500 bg-indigo-50 shrink-0">
                              <MapPinned className="h-2.5 w-2.5 mr-0.5" /> Statewide
                            </Badge>
                          );
                          if (isLocalNoGeo) return (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-amber-300 text-amber-600 bg-amber-50 shrink-0">
                              <MapPin className="h-2.5 w-2.5 mr-0.5" /> Location unavailable
                            </Badge>
                          );
                          return null;
                        })()}
                        {!isNearMeActive && resource.isLocal && (
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
              <p data-testid="text-no-resources" className="text-center text-muted-foreground py-8">
                {searchParam ? "No resources found. Try another search or category." : "No resources found for this category yet."}
              </p>
            )}
        </div>
      ) : searchParam ? (
        <div className="space-y-3 animate-in fade-in duration-300">
          <p className="text-sm text-muted-foreground">
            {resourcesLoading ? "Searching..." : `Showing ${activeResources.length} result${activeResources.length !== 1 ? "s" : ""} for "${searchParam}"`}
          </p>
          {resourcesLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {!resourcesLoading && activeResources.length === 0 && (
            <p data-testid="text-no-results" className="text-center text-muted-foreground py-8">
              No resources found. Try a different search term.
            </p>
          )}
          {activeResources.map((resource) => (
            <Card
              key={resource.id}
              data-testid={`card-resource-${resource.id}`}
              className="group hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setSelectedResource(resource)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1">{resource.title}</h3>
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">{resource.category}</Badge>
                      {resource.sponsored && (
                        <Badge className="text-[10px] h-5 px-1.5 bg-amber-500 text-white border-none shrink-0">Sponsored</Badge>
                      )}
                      {resource.isLocal && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary/30 text-primary bg-primary/5 shrink-0">
                          <MapPin className="h-2.5 w-2.5 mr-0.5" /> {[resource.city, resource.state].filter(Boolean).join(", ") || "Local"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          <Card
            data-testid="card-category-trusted-services"
            className="hover:border-primary/50 transition-colors cursor-pointer group shadow-sm hover:shadow-md"
            onClick={() => setLocation("/trusted-services")}
          >
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="p-2.5 rounded-lg transition-colors bg-secondary/10 text-secondary group-hover:bg-secondary group-hover:text-secondary-foreground">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base font-heading group-hover:text-primary transition-colors">Trusted Services & Products</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-snug">Vetted professionals and service providers supporting veterans and families.</p>
            </CardContent>
          </Card>
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
