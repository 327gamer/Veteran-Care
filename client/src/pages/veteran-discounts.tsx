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
  MapPin,
  Handshake,
  CheckCircle2,
  Send,
  Search,
  Tag,
  Percent,
  Heart,
  Locate,
  Loader2,
  Star,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Filter,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLocation } from "wouter";
import { useSavedResources } from "@/lib/store";
import { useGeolocation } from "@/lib/use-geolocation";
import TrustedServiceDetail from "@/components/trusted-service-detail";
import {
  AdSlot,
  AdSlotPlaceholder,
  resolveAds,
  interleaveAdsInListings,
  type SponsoredAd,
  type SponsoredType,
} from "@/components/ad-slot";
import PartnerSignupModal from "@/components/partner-signup-modal";
import AiGuideBanner from "@/components/ai-guide-banner";
import { HOUSING_SUBCATEGORIES } from "@/lib/housing-subcategories";
import { FIN_SUBCATEGORIES } from "@/lib/fin-subcategories";
import { EMP_SUBCATEGORIES } from "@/lib/emp-subcategories";
import { EOL_SUBCATEGORIES } from "@/lib/eol-subcategories";
import { INSURANCE_SUBCATEGORIES } from "@/lib/insurance-subcategories";

interface RichSubcategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  description: string;
}

const TS_SLUG_TO_CANONICAL: Record<string, string> = {
  "housing-home": "housing",
  "legal-services": "legal",
  "financial-credit": "financial",
  "insurance": "insurance",
  "education-training": "education",
  "employment-support": "employment",
  "end-of-life-services": "end-of-life-services",
};

const TS_RICH_SUBCATEGORIES: Record<string, RichSubcategory[]> = {
  "housing-home": HOUSING_SUBCATEGORIES,
  "financial-credit": FIN_SUBCATEGORIES,
  "insurance": INSURANCE_SUBCATEGORIES,
  "employment-support": EMP_SUBCATEGORIES,
  "end-of-life-services": EOL_SUBCATEGORIES,
};

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
  distance_miles?: number | null;
  verification_status: string;
  verification_label: string;
  cta_text: string;
  cta_url: string;
  is_featured: boolean;
  is_national: boolean;
  listing_type: string;
  discount_value: string | null;
  discount_description: string | null;
  program_area?: string;
  trusted_service_categories: { slug: string; name: string; group_type: string };
  offer_title?: string;
  offer_description?: string;
  banner_image_url?: string;
  offer_expiry?: string;
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
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [connectService, setConnectService] = useState<DiscountListing | null>(null);
  const [leadForm, setLeadForm] = useState<LeadForm>({ ...emptyLeadForm });
  const [submitted, setSubmitted] = useState(false);
  const [detailService, setDetailService] = useState<DiscountListing | null>(null);
  const [showPartnerLogin, setShowPartnerLogin] = useState(false);
  const [locationMode, setLocationMode] = useState<"all" | "nearme" | "state">("all");
  const [nearMeRadius, setNearMeRadius] = useState(50);
  const [geoApplied, setGeoApplied] = useState(false);
  const { toggleSaveTrustedService, isTrustedServiceSaved } = useSavedResources();
  const geo = useGeolocation();

  useEffect(() => {
    if (geo.location?.lat && !geoApplied) {
      setLocationMode("nearme");
      if (geo.location.stateCode) setFilterState(geo.location.stateCode);
      setGeoApplied(true);
    }
  }, [geo.location, geoApplied]);

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

  const effectiveState = locationMode === "all" ? "" : filterState;
  const nearMeLat = locationMode === "nearme" && geo.location?.lat ? geo.location.lat : undefined;
  const nearMeLng = locationMode === "nearme" && geo.location?.lng ? geo.location.lng : undefined;
  const isNearMeQuery = locationMode === "nearme" && nearMeLat !== undefined && nearMeLng !== undefined;

  const selectedCat = categories.find(c => c.slug === selectedCategory);
  const isServiceCategory = selectedCat?.group_type === "service";
  const richSubs = selectedCategory ? TS_RICH_SUBCATEGORIES[selectedCategory] : undefined;
  const canonicalSlug = selectedCategory ? TS_SLUG_TO_CANONICAL[selectedCategory] : undefined;

  const { data: apiSubcategories = [], isLoading: apiSubsLoading } = useQuery<{ id: string; name: string; slug: string }[]>({
    queryKey: ["/api/subcategories", canonicalSlug],
    queryFn: () => fetch(`/api/subcategories?category_slug=${canonicalSlug}`).then(r => r.json()),
    enabled: !!canonicalSlug && isServiceCategory && !richSubs,
  });

  const showSubcategoryPicker = !!selectedCategory && isServiceCategory && !selectedSubcategory && (!!richSubs || apiSubsLoading || apiSubcategories.length > 0);

  const { data: listingsData, isLoading: listingsLoading } = useQuery<{ partners: DiscountListing[]; fallback: DiscountListing[] }>({
    queryKey: ["/api/veteran-discounts", selectedCategory, effectiveState, searchQuery, isNearMeQuery ? `${nearMeLat},${nearMeLng},${nearMeRadius}` : ""],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (isNearMeQuery) {
        params.set("user_lat", String(nearMeLat));
        params.set("user_lng", String(nearMeLng));
        params.set("radius_miles", String(nearMeRadius));
      } else if (effectiveState && effectiveState !== "all") {
        params.set("state", effectiveState);
      }
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      const qs = params.toString();
      const res = await fetch(qs ? `/api/veteran-discounts?${qs}` : "/api/veteran-discounts");
      const json = await res.json();
      if (Array.isArray(json)) return { partners: json, fallback: [] };
      return { partners: json.partners || [], fallback: json.fallback || [] };
    },
    enabled: ((!!selectedCategory && !showSubcategoryPicker) || !!searchQuery.trim()) && (locationMode !== "nearme" || isNearMeQuery),
  });
  const listings = listingsData?.partners ?? [];
  const fallbackListings = listingsData?.fallback ?? [];

  const sponsoredAds: SponsoredAd[] = [];
  const geoContext = {
    lat: nearMeLat,
    lng: nearMeLng,
    state: filterState || undefined,
    city: geo.location?.city || undefined,
  };
  const topAds = resolveAds(sponsoredAds, "top", geoContext, selectedCategory);
  const inlineAds = resolveAds(sponsoredAds, "inline", geoContext, selectedCategory);
  const localBoostAds = resolveAds(sponsoredAds, "local", geoContext, selectedCategory);

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
    setSelectedSubcategory(null);
  }, [activeTab]);

  const handleBack = () => {
    if (detailService) {
      setDetailService(null);
    } else if (selectedSubcategory) {
      setSelectedSubcategory(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } else {
      setLocation("/home");
    }
  };

  const locationLabel = (() => {
    if (locationMode === "nearme" && geo.location) {
      const parts = [geo.location.city, geo.location.stateCode].filter(Boolean);
      return parts.length > 0 ? parts.join(", ") : "Near Me";
    }
    if (locationMode === "state" && filterState) {
      return US_STATES.find(s => s.value === filterState)?.label || filterState;
    }
    return "All Locations";
  })();

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

  const detailOpen = !!detailService;

  const { data: detailFull } = useQuery({
    queryKey: ["/api/veteran-discounts", detailService?.id],
    queryFn: async () => {
      const r = await fetch(`/api/veteran-discounts/${detailService!.id}`);
      if (!r.ok) return null;
      return r.json();
    },
    enabled: !!detailService?.id,
    staleTime: 60_000,
  });

  const enrichedDetail = detailService ? { ...detailService, ...(detailFull || {}) } : null;

  return (
    <div className="space-y-3">
      {connectModal}
      <TrustedServiceDetail
        service={enrichedDetail as any}
        open={detailOpen}
        onOpenChange={(open) => { if (!open) setDetailService(null); }}
        onConnect={(svc: any) => { setDetailService(null); setConnectService(svc); }}
      />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleBack} data-testid="button-back-home">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-heading font-extrabold text-primary tracking-tight" data-testid="heading-discounts">
            Trusted Services – Veteran Discount Services & Products
          </h1>
          <p className="text-xs text-muted-foreground">Browse discounts, products, and services for veterans and their families.</p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 -mt-1">
        <button
          data-testid="link-partner-login-discounts"
          className="text-xs text-primary font-medium hover:underline transition-colors"
          onClick={() => setShowPartnerLogin(true)}
        >
          Partner Login
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search discounts (restaurants, mortgage, auto...)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9 h-10 rounded-lg border bg-background"
          data-testid="input-discount-search"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={locationMode === "nearme" ? "default" : "outline"}
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => {
            if (locationMode === "nearme") {
              setLocationMode("all");
              setFilterState("");
            } else {
              geo.requestLocation();
              setLocationMode("nearme");
              if (geo.location?.stateCode) setFilterState(geo.location.stateCode);
            }
          }}
          data-testid="button-nearme"
        >
          {geo.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Locate className="h-3.5 w-3.5" />}
          Near Me
        </Button>
        <Select
          value={locationMode === "state" ? filterState : locationMode === "nearme" ? "nearme" : "all"}
          onValueChange={(v) => {
            if (v === "all") { setLocationMode("all"); setFilterState(""); }
            else if (v === "nearme") {
              geo.requestLocation();
              setLocationMode("nearme");
              if (geo.location?.stateCode) setFilterState(geo.location.stateCode);
            } else {
              setLocationMode("state");
              setFilterState(v);
            }
          }}
        >
          <SelectTrigger className="h-8 text-xs flex-1" data-testid="select-discount-location">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="nearme">Near Me</SelectItem>
            {US_STATES.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {locationMode === "nearme" && geo.location && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <MapPin className="h-3 w-3" />
          <span>Showing results within</span>
          <Select value={String(nearMeRadius)} onValueChange={v => setNearMeRadius(parseInt(v))}>
            <SelectTrigger className="h-6 w-[70px] text-[10px] px-1.5" data-testid="select-radius">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50, 100, 250].map(r => (
                <SelectItem key={r} value={String(r)}>{r} mi</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>of {locationLabel}</span>
          <button onClick={() => { setLocationMode("all"); setFilterState(""); }} className="ml-auto text-primary text-[10px] font-medium hover:underline" data-testid="button-clear-location">
            Clear
          </button>
        </div>
      )}

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
              Products & Local Offers
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            {activeTab === "service"
              ? "Professional services designed to support veterans and their families."
              : "Everyday discounts and offers from local businesses near you."}
          </p>

          {!selectedCategory ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {catsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse shadow-sm">
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
                      className="hover:border-primary/50 transition-colors cursor-pointer group shadow-sm hover:shadow-md"
                      onClick={() => { setSelectedCategory(cat.slug); setSelectedSubcategory(null); }}
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
          ) : showSubcategoryPicker ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }} data-testid="button-back-categories">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <div className="flex-1">
                  <h2 className="text-lg font-heading font-bold text-primary">{selectedCat?.name}</h2>
                  <p className="text-xs text-muted-foreground">{selectedCat?.description}</p>
                </div>
              </div>

              <AiGuideBanner categoryContext={selectedCategory || "trusted-services"} />

              {apiSubsLoading && !richSubs ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Loading subcategories...</p>
                </div>
              ) : richSubs ? (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Select a topic to find trusted providers near you.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {richSubs.map((sub) => {
                      const Icon = sub.icon;
                      return (
                        <button
                          key={sub.slug}
                          data-testid={`card-subcategory-${sub.slug}`}
                          onClick={() => setSelectedSubcategory(sub.slug)}
                          className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-all active:scale-[0.98]"
                        >
                          <div className="shrink-0 w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center mt-0.5">
                            <Icon className="h-4.5 w-4.5 text-orange-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-sm font-semibold text-foreground leading-tight">
                                {sub.name}
                              </span>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                              {sub.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => setSelectedSubcategory("__all__")}
                      data-testid="button-view-all-subcategory"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View all {selectedCat?.name} providers
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground text-center">
                    Select a topic to find trusted providers near you.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {apiSubcategories.map((sub) => (
                      <button
                        key={sub.id}
                        data-testid={`card-subcategory-${sub.slug}`}
                        onClick={() => setSelectedSubcategory(sub.slug)}
                        className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-left transition-all active:scale-[0.98]"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-sm font-semibold text-foreground leading-tight">
                              {sub.name}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => setSelectedSubcategory("__all__")}
                      data-testid="button-view-all-subcategory"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      View all {selectedCat?.name} providers
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleBack} data-testid="button-back-categories">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {selectedSubcategory && selectedSubcategory !== "__all__"
                    ? (richSubs?.find(s => s.slug === selectedSubcategory)?.name || apiSubcategories.find(s => s.slug === selectedSubcategory)?.name || selectedCat?.name)
                    : selectedCat?.name || "Back"}
                </Button>
              </div>

              {listingsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="animate-pulse shadow-sm">
                      <CardContent className="p-4 space-y-2">
                        <div className="h-5 w-48 bg-muted rounded" />
                        <div className="h-4 w-full bg-muted rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : listings.length === 0 && fallbackListings.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <MapPin className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                  <p className="text-sm font-medium text-muted-foreground">Nothing nearby yet</p>
                  <p className="text-xs text-muted-foreground">We're adding new veteran-friendly businesses in your area. Check back soon or explore nearby locations.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topAds[0] ? (
                    <AdSlot ad={topAds[0]} placement="top" />
                  ) : (
                    <AdSlotPlaceholder placement="top" />
                  )}

                  {listings.length > 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <h3 className="text-sm font-bold text-foreground" data-testid="heading-verified-partners">Verified Partners</h3>
                      </div>
                      {(() => {
                        const activeInlineAds = isNearMeQuery && localBoostAds.length > 0 ? localBoostAds : inlineAds;
                        const feed = interleaveAdsInListings(listings, activeInlineAds, { interval: 6, boostFirst: isNearMeQuery && localBoostAds.length > 0 });
                        return feed.map((item, idx) =>
                          item.type === "ad" ? (
                            <AdSlot key={`ad-${item.data.id}`} ad={item.data} placement={isNearMeQuery ? "local" : "inline"} />
                          ) : (
                            <ListingCard
                              key={item.data.id}
                              listing={item.data}
                              isSaved={isTrustedServiceSaved(item.data.id)}
                              onToggleSave={() => toggleSaveTrustedService(item.data.id)}
                              onViewDetails={() => setDetailService(item.data)}
                              onConnect={() => setConnectService(item.data)}
                            />
                          )
                        );
                      })()}
                    </>
                  )}

                  {fallbackListings.length > 0 && (
                    <>
                      {listings.length > 0 && <div className="border-t my-2" />}
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-600" />
                        <h3 className="text-sm font-bold text-foreground" data-testid="heading-other-resources">Other Available Resources</h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground -mt-1">Free veteran resources and services in this category.</p>
                      {fallbackListings.map((listing) => (
                        <FallbackResourceCard
                          key={listing.id}
                          listing={listing}
                          onViewDetails={() => {
                            if (listing.website_url) window.open(listing.website_url, "_blank", "noopener");
                          }}
                        />
                      ))}
                    </>
                  )}
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
                <Card key={i} className="animate-pulse shadow-sm">
                  <CardContent className="p-4 space-y-2">
                    <div className="h-5 w-48 bg-muted rounded" />
                    <div className="h-4 w-full bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : listings.length === 0 && fallbackListings.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Search className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">No results for "{searchQuery}"</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{listings.length + fallbackListings.length} result{listings.length + fallbackListings.length !== 1 ? "s" : ""} found</p>
              {(() => {
                const feed = interleaveAdsInListings(listings, inlineAds, { interval: 6 });
                return feed.map((item, idx) =>
                  item.type === "ad" ? (
                    <AdSlot key={`ad-${item.data.id}`} ad={item.data} placement="inline" />
                  ) : (
                    <ListingCard
                      key={item.data.id}
                      listing={item.data}
                      isSaved={isTrustedServiceSaved(item.data.id)}
                      onToggleSave={() => toggleSaveTrustedService(item.data.id)}
                      onViewDetails={() => setDetailService(item.data)}
                      onConnect={() => setConnectService(item.data)}
                    />
                  )
                );
              })()}
              {fallbackListings.length > 0 && (
                <>
                  {listings.length > 0 && <div className="border-t my-2" />}
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-foreground">Other Available Resources</h3>
                  </div>
                  {fallbackListings.map((listing) => (
                    <FallbackResourceCard
                      key={listing.id}
                      listing={listing}
                      onViewDetails={() => {
                        if (listing.website_url) window.open(listing.website_url, "_blank", "noopener");
                      }}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      <PartnerSignupModal
        open={showPartnerLogin}
        onOpenChange={setShowPartnerLogin}
        defaultMode="login"
        onSuccess={() => setLocation("/partner-portal")}
      />
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
    <Card className={`overflow-hidden transition-shadow ${listing.is_featured ? "shadow-md border-amber-200/60 ring-1 ring-amber-100" : "shadow-sm hover:shadow-md"}`} data-testid={`card-discount-${listing.id}`}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-bold text-sm" data-testid={`text-discount-name-${listing.id}`}>{listing.name}</h3>
              {listing.is_featured && (
                <Badge className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                  <Star className="h-2.5 w-2.5 mr-0.5 fill-amber-500 text-amber-500" />
                  Featured
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
              {listing.is_national ? (
                <><Globe className="h-3 w-3" /><span>Nationwide</span></>
              ) : listing.city && listing.state ? (
                <><MapPin className="h-3 w-3" /><span>{listing.city}, {listing.state}</span></>
              ) : listing.state ? (
                <><MapPin className="h-3 w-3" /><span>{listing.state}</span></>
              ) : null}
              {listing.distance_miles != null && listing.distance_miles < 99999 && (
                <span className="text-primary font-medium">{listing.distance_miles} mi</span>
              )}
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

        <div className="flex flex-wrap items-center gap-1.5">
          {listing.listing_type === "discount" ? (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 border-green-200">
              <Percent className="h-3 w-3 mr-0.5" />
              Veteran Discount Available
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200">
              <CheckCircle2 className="h-3 w-3 mr-0.5" />
              Veteran Support Service
            </Badge>
          )}
          {listing.program_area === "trusted_services" && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-300 text-emerald-700 bg-emerald-50">
              <ShieldCheck className="h-3 w-3 mr-0.5" />
              Trusted Partner
            </Badge>
          )}
          {listing.verification_label && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-200 text-green-700 bg-green-50">
              <CheckCircle2 className="h-3 w-3 mr-0.5" />
              {listing.verification_label}
            </Badge>
          )}
          {listing.offer_title && (
            <Badge className="text-[10px] px-1.5 py-0 bg-green-600 text-white border-green-600">
              <Percent className="h-3 w-3 mr-0.5" />
              Offer
            </Badge>
          )}
        </div>

        {listing.offer_title && !listing.discount_value && (
          <p className="text-xs font-semibold text-green-700">{listing.offer_title}</p>
        )}
        {listing.discount_value && (
          <p className="text-xs font-semibold text-green-700">{listing.discount_value}</p>
        )}
        {listing.discount_description && (
          <p className="text-xs text-green-700/80">{listing.discount_description}</p>
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

function FallbackResourceCard({
  listing,
  onViewDetails,
}: {
  listing: DiscountListing;
  onViewDetails: () => void;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-200" data-testid={`card-fallback-${listing.id}`}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-sm" data-testid={`text-fallback-name-${listing.id}`}>{listing.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
              {listing.is_national ? (
                <><Globe className="h-3 w-3" /><span>Nationwide</span></>
              ) : listing.city && listing.state ? (
                <><MapPin className="h-3 w-3" /><span>{listing.city}, {listing.state}</span></>
              ) : listing.state ? (
                <><MapPin className="h-3 w-3" /><span>{listing.state}</span></>
              ) : null}
              {listing.distance_miles != null && listing.distance_miles < 99999 && (
                <span className="text-primary font-medium">{listing.distance_miles} mi</span>
              )}
            </div>
          </div>
        </div>

        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 border-slate-200">
          <CheckCircle2 className="h-3 w-3 mr-0.5" />
          Community Resource
        </Badge>

        {listing.short_description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{listing.short_description}</p>
        )}

        <div className="flex items-center gap-2 pt-1">
          {listing.phone && (
            <Button variant="outline" size="sm" className="text-xs h-8" asChild>
              <a href={`tel:${listing.phone}`} data-testid={`button-call-fallback-${listing.id}`}>Call</a>
            </Button>
          )}
          {listing.website_url && (
            <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={onViewDetails} data-testid={`button-visit-fallback-${listing.id}`}>
              Visit Website
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
