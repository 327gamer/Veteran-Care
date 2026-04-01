import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Store,
  Search,
  ChevronLeft,
  Globe,
  Phone,
  MapPin,
  Building2,
  Filter,
  X,
  Plus,
} from "lucide-react";
import { useLocation } from "wouter";

interface VobListing {
  id: string;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  description: string | null;
  subcategory: string | null;
  is_veteran_owned: boolean;
  is_nonprofit: boolean;
  logo_url: string | null;
  category: { name: string; slug: string } | null;
}

interface TrustedCategory {
  id: string;
  name: string;
  slug: string;
}

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

export default function VobDirectory() {
  const [, setLocation] = useLocation();
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterState, setFilterState] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: categories = [] } = useQuery<TrustedCategory[]>({
    queryKey: ["/api/trusted-services/categories"],
    queryFn: () => fetch("/api/trusted-services/categories").then(r => r.json()),
  });

  const { data: listings = [], isLoading } = useQuery<VobListing[]>({
    queryKey: ["/api/vob", filterCategory, filterState, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterCategory) params.set("category", filterCategory);
      if (filterState) params.set("state", filterState);
      if (debouncedSearch) params.set("search", debouncedSearch);
      const qs = params.toString();
      return fetch(qs ? `/api/vob?${qs}` : "/api/vob").then(r => r.json());
    },
  });

  let searchTimer: ReturnType<typeof setTimeout>;
  const handleSearch = (val: string) => {
    setSearchText(val);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => setDebouncedSearch(val), 350);
  };

  const hasFilters = filterCategory || filterState || debouncedSearch;

  const clearFilters = () => {
    setSearchText("");
    setDebouncedSearch("");
    setFilterCategory("");
    setFilterState("");
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setLocation("/home")}
          data-testid="button-back-vob-directory"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-heading font-bold text-primary">Veteran-Owned Businesses</h1>
          <p className="text-xs text-muted-foreground">Support veteran entrepreneurs in your community</p>
        </div>
        <Button
          size="sm"
          className="h-8 text-xs"
          onClick={() => setLocation("/vob/apply")}
          data-testid="button-add-your-business"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Yours
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchText}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search businesses..."
          className="pl-9 h-10"
          data-testid="input-vob-search"
        />
        {searchText && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => { setSearchText(""); setDebouncedSearch(""); }}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <div className="flex items-center gap-1.5 flex-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Select value={filterCategory} onValueChange={v => setFilterCategory(v === "all" ? "" : v)}>
            <SelectTrigger className="h-8 text-xs" data-testid="select-vob-filter-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={filterState} onValueChange={v => setFilterState(v === "all" ? "" : v)}>
          <SelectTrigger className="h-8 text-xs w-[130px]" data-testid="select-vob-filter-state">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {US_STATES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={clearFilters} data-testid="button-clear-vob-filters">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="py-12 text-center">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading directory...</p>
        </div>
      )}

      {!isLoading && listings.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Store className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">
              {hasFilters ? "No businesses match your search" : "No businesses listed yet"}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              {hasFilters
                ? "Try adjusting your filters or search terms."
                : "Be the first to list your veteran-owned business in our free directory!"}
            </p>
            {hasFilters ? (
              <Button variant="outline" size="sm" className="text-xs" onClick={clearFilters} data-testid="button-clear-all-filters">
                Clear Filters
              </Button>
            ) : (
              <Button size="sm" className="text-xs" onClick={() => setLocation("/vob/apply")} data-testid="button-add-first-business">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Your Business
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && listings.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">{listings.length} business{listings.length !== 1 ? "es" : ""} found</p>
          <div className="space-y-3">
            {listings.map(biz => (
              <Card key={biz.id} className="overflow-hidden hover:border-primary/30 transition-colors" data-testid={`card-vob-listing-${biz.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {biz.logo_url ? (
                      <img src={biz.logo_url} alt={biz.business_name} className="h-12 w-12 rounded-lg object-cover shrink-0 border" />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Store className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading font-bold text-sm text-foreground">{biz.business_name}</h3>
                        {biz.is_nonprofit && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 bg-blue-50 text-blue-700 border-blue-200">
                            <Building2 className="h-2.5 w-2.5 mr-0.5" /> Nonprofit
                          </Badge>
                        )}
                      </div>

                      {biz.category?.name && (
                        <p className="text-[11px] text-primary/70 font-medium">{biz.category.name}{biz.subcategory ? ` · ${biz.subcategory}` : ""}</p>
                      )}

                      {biz.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{biz.description}</p>
                      )}

                      <div className="flex items-center gap-3 pt-1 flex-wrap">
                        {(biz.city || biz.state) && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[biz.city, biz.state].filter(Boolean).join(", ")}
                          </span>
                        )}
                        {biz.phone && (
                          <a href={`tel:${biz.phone}`} className="text-[11px] text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors">
                            <Phone className="h-3 w-3" />
                            {biz.phone}
                          </a>
                        )}
                        {biz.website && (
                          <a href={biz.website.startsWith("http") ? biz.website : `https://${biz.website}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary flex items-center gap-1 hover:underline">
                            <Globe className="h-3 w-3" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
