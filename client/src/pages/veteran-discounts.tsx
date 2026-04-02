import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trackEvent, getUTMParams } from "@/lib/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Scale,
  Home,
  Shield,
  HeartPulse,
  Car,
  DollarSign,
  Plane,
  UtensilsCrossed,
  ShoppingBag,
  Bed,
  Dumbbell,
  Store,
  ChevronLeft,
  Globe,
  Phone,
  MapPin,
  Mail,
  Star,
  Handshake,
  CheckCircle2,
  Send,
  Search,
  Tag,
  Percent,
  Heart,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { platform } from "@shared/platform";
import { useSavedResources } from "@/lib/store";
import TrustedServiceDetail from "@/components/trusted-service-detail";
import { toast } from "@/hooks/use-toast";

interface DiscountCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
  group_type: string;
}

interface DiscountListing {
  id: string;
  category_id: string;
  name: string;
  short_description: string;
  website_url: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  verification_status: string;
  verification_label: string;
  cta_text: string;
  cta_url: string;
  is_featured: boolean;
  is_national: boolean;
  listing_type: string;
  discount_value: string | null;
  discount_description: string | null;
  trusted_service_categories: { slug: string; name: string; group_type: string };
}

const iconMap: Record<string, any> = {
  home: Home,
  scale: Scale,
  shield: Shield,
  "heart-pulse": HeartPulse,
  car: Car,
  "dollar-sign": DollarSign,
  plane: Plane,
  utensils: UtensilsCrossed,
  "shopping-bag": ShoppingBag,
  bed: Bed,
  dumbbell: Dumbbell,
  store: Store,
};

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

type LeadForm = {
  name: string;
  email: string;
  phone: string;
  role: string;
  city: string;
  state: string;
  message: string;
};

const ROLE_OPTIONS = [
  { value: "veteran", label: "Veteran" },
  { value: "family_member", label: "Family Member" },
  { value: "case_manager", label: "Case Manager" },
  { value: "friend_supporter", label: "Friend / Supporter" },
  { value: "other", label: "Other" },
];

const emptyLeadForm: LeadForm = { name: "", email: "", phone: "", role: "", city: "", state: "", message: "" };

export default function VeteranDiscounts() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"service" | "product">("service");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [connectService, setConnectService] = useState<DiscountListing | null>(null);
  const [leadForm, setLeadForm] = useState<LeadForm>({ ...emptyLeadForm });
  const [submitted, setSubmitted] = useState(false);
  const [detailService, setDetailService] = useState<DiscountListing | null>(null);
  const { toggleSaveTrustedService, isTrustedServiceSaved } = useSavedResources();

  const { data: categories = [], isLoading: catsLoading } = useQuery<DiscountCategory[]>({
    queryKey: ["/api/veteran-discounts/categories"],
    queryFn: () => fetch("/api/veteran-discounts/categories").then(r => {
      if (!r.ok) throw new Error("Failed to load categories");
      return r.json();
    }),
  });

  const serviceCategories = categories.filter(c => c.group_type === "service");
  const productCategories = categories.filter(c => c.group_type === "product");
  const activeCats = activeTab === "service" ? serviceCategories : productCategories;

  const { data: listings = [], isLoading: listingsLoading } = useQuery<DiscountListing[]>({
    queryKey: ["/api/veteran-discounts", selectedCategory, filterState, searchQuery],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (filterState) params.set("state", filterState);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      const qs = params.toString();
      return fetch(qs ? `/api/veteran-discounts?${qs}` : "/api/veteran-discounts").then(r => r.json());
    },
    enabled: !!selectedCategory || !!searchQuery.trim(),
  });

  const leadMutation = useMutation({
    mutationFn: async (data: { service: DiscountListing; form: LeadForm }) => {
      const utm = getUTMParams();
      const res = await fetch("/api/trusted-service-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: data.service.id,
          provider_name: data.service.name,
          category_id: data.service.category_id,
          name: data.form.name,
          email: data.form.email,
          phone: data.form.phone || undefined,
          role: data.form.role || undefined,
          city: data.form.city || undefined,
          state: data.form.state || undefined,
          message: data.form.message || undefined,
          utm_source: utm.utm_source || undefined,
          utm_medium: utm.utm_medium || undefined,
          utm_campaign: utm.utm_campaign || undefined,
          utm_content: utm.utm_content || undefined,
          utm_id: utm.utm_id || undefined,
          session_id: sessionStorage.getItem("vc_session_id") || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      setLeadForm({ ...emptyLeadForm });
    },
  });

  const handleSubmitLead = () => {
    if (!connectService || !leadForm.name || !leadForm.email || !leadForm.role) return;
    trackEvent("lead_submit", { source: "veteran_discounts", service_name: connectService.name, category: selectedCategory || "" });
    leadMutation.mutate({ service: connectService, form: leadForm });
  };

  const closeModal = () => {
    setConnectService(null);
    setLeadForm({ ...emptyLeadForm });
    setSubmitted(false);
    leadMutation.reset();
  };

  useEffect(() => {
    setSelectedCategory(null);
  }, [activeTab]);

  const selectedCat = categories.find(c => c.slug === selectedCategory);

  const connectModal = (
    <Dialog open={!!connectService} onOpenChange={(v) => { if (!v) closeModal(); }}>
      <DialogContent className="sm:max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            {connectService?.listing_type === "discount" ? "Claim Offer" : "Connect With Provider"}
          </DialogTitle>
        </DialogHeader>
        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <h3 className="font-heading font-bold text-lg" data-testid="text-lead-success">Request Sent!</h3>
            <p className="text-sm text-muted-foreground">
              {connectService?.listing_type === "discount"
                ? "Your request has been sent. The provider will reach out with your offer details."
                : "A team member will be in touch shortly to connect you."}
            </p>
            <Button onClick={closeModal} variant="outline" data-testid="button-lead-done">Done</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {connectService && (
              <div className="bg-muted/30 rounded-lg p-3 text-sm">
                <p className="font-medium">{connectService.name}</p>
                {connectService.discount_value && (
                  <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">
                    <Percent className="h-3 w-3 mr-1" />
                    {connectService.discount_value}
                  </Badge>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="lead-name" className="text-xs">Full Name *</Label>
              <Input id="lead-name" value={leadForm.name} onChange={e => setLeadForm(f => ({ ...f, name: e.target.value }))} className="h-9 text-sm" data-testid="input-lead-name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-role" className="text-xs">I am a... *</Label>
              <Select value={leadForm.role} onValueChange={v => setLeadForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="h-9 text-sm" data-testid="select-lead-role">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-email" className="text-xs">Email *</Label>
              <Input id="lead-email" type="email" value={leadForm.email} onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))} className="h-9 text-sm" data-testid="input-lead-email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-phone" className="text-xs">Phone</Label>
              <Input id="lead-phone" type="tel" value={leadForm.phone} onChange={e => setLeadForm(f => ({ ...f, phone: e.target.value }))} className="h-9 text-sm" data-testid="input-lead-phone" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">City</Label>
                <Input value={leadForm.city} onChange={e => setLeadForm(f => ({ ...f, city: e.target.value }))} className="h-9 text-sm" data-testid="input-lead-city" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">State</Label>
                <Select value={leadForm.state} onValueChange={v => setLeadForm(f => ({ ...f, state: v }))}>
                  <SelectTrigger className="h-9 text-sm" data-testid="select-lead-state">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-message" className="text-xs">Message (optional)</Label>
              <Textarea id="lead-message" value={leadForm.message} onChange={e => setLeadForm(f => ({ ...f, message: e.target.value }))} rows={2} className="text-sm" data-testid="input-lead-message" />
            </div>
            <Button
              onClick={handleSubmitLead}
              disabled={!leadForm.name || !leadForm.email || !leadForm.role || leadMutation.isPending}
              className="w-full"
              data-testid="button-submit-lead"
            >
              <Send className="h-4 w-4 mr-2" />
              {connectService?.listing_type === "discount" ? "Claim Offer" : "Connect"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  if (detailService) {
    return (
      <TrustedServiceDetail
        service={detailService as any}
        onBack={() => setDetailService(null)}
        onConnect={(svc: any) => { setDetailService(null); setConnectService(svc); }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {connectModal}

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation("/home")} data-testid="button-back-home">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-heading font-extrabold text-primary tracking-tight" data-testid="heading-discounts">
            Veteran Discount Services
          </h1>
          <p className="text-xs text-muted-foreground">Exclusive discounts and services for veterans</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search discounts (restaurants, mortgage, auto...)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 h-10"
          data-testid="input-discount-search"
        />
      </div>

      {!searchQuery.trim() && (
        <>
          <div className="flex rounded-lg border overflow-hidden">
            <button
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${activeTab === "service" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              onClick={() => setActiveTab("service")}
              data-testid="tab-services"
            >
              Services
            </button>
            <button
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${activeTab === "product" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              onClick={() => setActiveTab("product")}
              data-testid="tab-products"
            >
              Products
            </button>
          </div>

          {!selectedCategory ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {catsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 flex flex-col items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div className="h-4 w-20 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))
              ) : activeCats.length === 0 ? (
                <div className="col-span-full text-center py-8 text-sm text-muted-foreground">
                  No categories available yet. Check back soon.
                </div>
              ) : (
                activeCats.map((cat) => {
                  const Icon = iconMap[cat.icon] || Tag;
                  return (
                    <Card
                      key={cat.id}
                      className="hover:border-primary/50 transition-colors cursor-pointer group"
                      onClick={() => setSelectedCategory(cat.slug)}
                      data-testid={`card-discount-cat-${cat.slug}`}
                    >
                      <CardContent className="p-4 flex flex-col items-center justify-center gap-2 text-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {cat.name}
                        </span>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setSelectedCategory(null); setFilterState(""); }} data-testid="button-back-categories">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {selectedCat?.name || "Back"}
                </Button>
                <Select value={filterState} onValueChange={setFilterState}>
                  <SelectTrigger className="w-[140px] h-8 text-xs" data-testid="select-discount-state">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {US_STATES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {listingsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-4 space-y-2">
                        <div className="h-5 w-48 bg-muted rounded" />
                        <div className="h-4 w-full bg-muted rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : listings.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Tag className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm text-muted-foreground">No listings in this category yet.</p>
                  <p className="text-xs text-muted-foreground">Check back soon — we're adding new providers regularly.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {listings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      isSaved={isTrustedServiceSaved(listing.id)}
                      onToggleSave={() => toggleSaveTrustedService(listing.id)}
                      onViewDetails={() => setDetailService(listing)}
                      onConnect={() => setConnectService(listing)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {searchQuery.trim() && (
        <div className="space-y-3">
          {listingsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 space-y-2">
                    <div className="h-5 w-48 bg-muted rounded" />
                    <div className="h-4 w-full bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Search className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">No results for "{searchQuery}"</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{listings.length} result{listings.length !== 1 ? "s" : ""} found</p>
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isSaved={isTrustedServiceSaved(listing.id)}
                  onToggleSave={() => toggleSaveTrustedService(listing.id)}
                  onViewDetails={() => setDetailService(listing)}
                  onConnect={() => setConnectService(listing)}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ListingCard({
  listing,
  isSaved,
  onToggleSave,
  onViewDetails,
  onConnect,
}: {
  listing: DiscountListing;
  isSaved: boolean;
  onToggleSave: () => void;
  onViewDetails: () => void;
  onConnect: () => void;
}) {
  const ctaLabel = listing.listing_type === "discount"
    ? (listing.cta_text && listing.cta_text !== "Learn More" ? listing.cta_text : "Claim Offer")
    : (listing.cta_text && listing.cta_text !== "Learn More" ? listing.cta_text : "Connect");

  return (
    <Card className="overflow-hidden" data-testid={`card-discount-${listing.id}`}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-bold text-sm" data-testid={`text-discount-name-${listing.id}`}>{listing.name}</h3>
              {listing.is_featured && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Featured</Badge>}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
              {listing.is_national ? (
                <><Globe className="h-3 w-3" /><span>Nationwide</span></>
              ) : listing.city && listing.state ? (
                <><MapPin className="h-3 w-3" /><span>{listing.city}, {listing.state}</span></>
              ) : listing.state ? (
                <><MapPin className="h-3 w-3" /><span>{listing.state}</span></>
              ) : null}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
            className="shrink-0 p-1"
            data-testid={`button-save-discount-${listing.id}`}
          >
            <Heart className={`h-4 w-4 ${isSaved ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>
        </div>

        {listing.discount_value && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
            <Percent className="h-3 w-3 mr-1" />
            {listing.discount_value}
          </Badge>
        )}
        {listing.discount_description && (
          <p className="text-xs text-green-700 font-medium">{listing.discount_description}</p>
        )}

        {listing.verification_label && (
          <Badge variant="outline" className="text-[10px] border-green-200 text-green-700 bg-green-50">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {listing.verification_label}
          </Badge>
        )}

        {listing.short_description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{listing.short_description}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={onViewDetails} data-testid={`button-details-${listing.id}`}>
            View Details
          </Button>
          <Button size="sm" className="flex-1 text-xs h-8" onClick={onConnect} data-testid={`button-connect-${listing.id}`}>
            {ctaLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
