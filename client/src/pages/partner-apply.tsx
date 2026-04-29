import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trackEvent, getUTMParams } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Building2,
  CheckCircle2,
  ArrowLeft,
  Star,
  Users,
  BarChart3,
  Handshake,
  MapPin,
  Globe,
  Sparkles,
  Navigation,
  Gift,
  Crown,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";
import { platform } from "@shared/platform";
import { isLeadEligibleCategory } from "@shared/lead-eligibility";
import { useToast } from "@/hooks/use-toast";
import PartnerSignupModal from "@/components/partner-signup-modal";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC"
];

interface Category {
  id: string;
  name: string;
  slug: string;
  group_type?: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  display_order: number;
}

export default function PartnerApply() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [showPartnerLogin, setShowPartnerLogin] = useState(false);

  const refCode = new URLSearchParams(window.location.search).get("ref") || "";
  const { data: referrerData } = useQuery<{ referrerName: string }>({
    queryKey: ["/api/partner-referral/resolve", refCode],
    queryFn: () => fetch(`/api/partner-referral/resolve/${refCode}`).then(r => r.ok ? r.json() : null),
    enabled: !!refCode,
  });

  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    website: "",
    city: "",
    state: "",
    category_id: "",
    subcategory_ids: [] as string[],
    service_description: "",
    pricing_interest: "both",
    plan_type: "" as "state" | "national" | "",
    is_lead_enabled: false,
  });

  const [addons, setAddons] = useState({
    featured: false,
    near_me_boost: false,
    ecss: false,
  });

  // ─── ECSS Phase B onboarding upsell state ───
  const ECSS_CATEGORY_SLUGS = new Set([
    "legal-services",
    "mortgage-lending",
    "real-estate",
    "insurance",
  ]);
  const [ecssLogoDataUrl, setEcssLogoDataUrl] = useState<string>("");
  const [ecssShortDescription, setEcssShortDescription] = useState<string>("");
  const [ecssCtaText, setEcssCtaText] = useState<string>("Get Help");
  const [ecssLogoError, setEcssLogoError] = useState<string>("");
  const [ecssWaitlistEmail, setEcssWaitlistEmail] = useState<string>("");
  const [ecssWaitlistJoined, setEcssWaitlistJoined] = useState<boolean>(false);

  // Categories must be declared BEFORE selectedCategorySlug (which reads from it)
  // to avoid a TDZ ReferenceError that blanks the whole page.
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/partner-categories"],
    queryFn: async () => {
      const res = await fetch("/api/partner-categories");
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    },
  });

  const { data: subcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ["/api/partner-subcategories", form.category_id],
    queryFn: async () => {
      if (!form.category_id) return [];
      const res = await fetch(`/api/partner-subcategories?category_id=${form.category_id}`);
      if (!res.ok) throw new Error("Failed to load subcategories");
      return res.json();
    },
    enabled: !!form.category_id,
  });

  const selectedCategorySlug = (() => {
    const c = (categories as Category[]).find((c) => c.id === form.category_id);
    return c?.slug || "";
  })();
  const ecssEligible =
    form.plan_type === "state" &&
    !!form.state &&
    !!form.category_id &&
    ECSS_CATEGORY_SLUGS.has(selectedCategorySlug);

  const { data: ecssAvail } = useQuery<{
    available: boolean;
    soldOut: boolean;
    slot?: {
      slot_id?: string;
      monthly_price_cents: number;
      lead_price_cents: number;
    };
  }>({
    queryKey: [
      "/api/elite-sponsor/available",
      selectedCategorySlug,
      form.state,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        categorySlug: selectedCategorySlug,
        state: form.state,
      });
      const r = await fetch(`/api/elite-sponsor/available?${params.toString()}`);
      if (!r.ok) throw new Error("avail lookup failed");
      return r.json();
    },
    enabled: ecssEligible,
    staleTime: 60 * 1000,
  });

  const ecssMonthlyPrice = ecssAvail?.slot?.monthly_price_cents
    ? ecssAvail.slot.monthly_price_cents / 100
    : 499;

  // If ECSS becomes ineligible (user changed plan/state/category), uncheck it.
  useEffect(() => {
    if (!ecssEligible && (addons.ecss || ecssLogoDataUrl)) {
      setAddons((prev) => ({ ...prev, ecss: false }));
    }
  }, [ecssEligible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ECSS REQUIRES Direct Lead Delivery. Whenever ECSS is on but
  // is_lead_enabled is false (e.g. it just got toggled on, or the user
  // changed category and the category-change handler reset the lead flag),
  // re-flip leads to true. Watching is_lead_enabled here too means any drift
  // is auto-corrected.
  useEffect(() => {
    if (addons.ecss && !form.is_lead_enabled) {
      setForm((prev) => ({ ...prev, is_lead_enabled: true }));
    }
  }, [addons.ecss, form.is_lead_enabled]);

  // Compress an uploaded logo to ≤120KB JPEG, square 600×600.
  async function handleLogoFile(file: File) {
    setEcssLogoError("");
    if (!file.type.startsWith("image/")) {
      setEcssLogoError("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setEcssLogoError("Image is too large. Max 8MB before compression.");
      return;
    }
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas ctx");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 600, 600);
      // square crop, contain
      const ratio = Math.max(600 / img.width, 600 / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, (600 - w) / 2, (600 - h) / 2, w, h);
      let q = 0.82;
      let out = canvas.toDataURL("image/jpeg", q);
      while (out.length > 120 * 1024 && q > 0.3) {
        q -= 0.1;
        out = canvas.toDataURL("image/jpeg", q);
      }
      setEcssLogoDataUrl(out);
    } catch {
      setEcssLogoError("Could not process that image. Try a different file.");
    }
  }

  const ADDON_INFO = [
    { key: "featured" as const, label: "Featured Partner Placement", icon: Sparkles, price: 49.99, desc: "Appear at the top of category results with a highlighted badge" },
    { key: "near_me_boost" as const, label: "Near Me Boost", icon: Navigation, price: 29.99, desc: "Priority placement in location-based searches" },
  ];

  const basePrices = { state: 99, national: 499 };
  const selectedAddons = ADDON_INFO.filter(a => addons[a.key]);
  const addonTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const basePrice = form.plan_type ? basePrices[form.plan_type] : 0;
  const ecssAddonPrice = addons.ecss && ecssEligible && ecssAvail?.available ? ecssMonthlyPrice : 0;
  const monthlyTotal = basePrice + addonTotal + ecssAddonPrice;

  useEffect(() => {
    trackEvent("partner_apply_started");
  }, []);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const utm = getUTMParams();
      const res = await fetch("/api/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subcategory_ids: form.subcategory_ids.length > 0 ? form.subcategory_ids : null,
          category_id: form.category_id || null,
          state: form.plan_type === "national" ? null : (form.state || null),
          // Submit-time invariant: ECSS REQUIRES Direct Lead Delivery.
          // Force the flag to true if ECSS is in the payload, regardless of
          // whatever the form state happens to be at submit time.
          is_lead_enabled: addons.ecss ? true : form.is_lead_enabled,
          addons: Object.entries(addons).filter(([, v]) => v).map(([k]) => k),
          ecss_data: addons.ecss && ecssEligible
            ? {
                category_slug: selectedCategorySlug,
                state_code: form.state,
                logo_data_url: ecssLogoDataUrl || null,
                short_description: ecssShortDescription || null,
                cta_text: ecssCtaText || "Get Help",
                slot_id: ecssAvail?.slot?.slot_id || null,
              }
            : null,
          utm_source: utm.utm_source || null,
          utm_medium: utm.utm_medium || null,
          utm_campaign: utm.utm_campaign || null,
          utm_content: utm.utm_content || null,
          utm_id: utm.utm_id || null,
          session_id: sessionStorage.getItem("vc_session_id") || null,
          referred_by_code: refCode || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submission failed");
      }
      return res.json();
    },
    onSuccess: () => {
      trackEvent("partner_apply_submitted");
      setSubmitted(true);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectPlan = (plan: "state" | "national") => {
    setForm((prev) => ({
      ...prev,
      plan_type: plan,
      state: plan === "national" ? "" : prev.state,
    }));
  };

  const canSubmit =
    form.company_name.trim() &&
    form.contact_name.trim() &&
    form.email.trim() &&
    form.plan_type !== "" &&
    (form.plan_type === "national" || form.state !== "");

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground" data-testid="text-application-success">
              Application Received
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Thank you for your interest in becoming a {platform.name} Trusted Services partner.
              Our team will review your application and reach out within 2-3 business days.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Once approved, you'll gain access to your partner referral dashboard where you can share your referral link and track your rewards.
            </p>
            <p className="text-xs text-muted-foreground">
              Questions? Contact us at <a href="mailto:info@veterancare.com" className="text-primary underline">info@veterancare.com</a>
            </p>
            <div className="pt-4 flex gap-3 justify-center">
              <Button
                data-testid="button-back-home"
                variant="outline"
                onClick={() => setLocation("/home")}
              >
                Back to Home
              </Button>
              <Button
                data-testid="button-view-services"
                onClick={() => setLocation("/discounts")}
              >
                View Trusted Services
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          data-testid="button-back"
          onClick={() => setLocation("/discounts")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trusted Services
        </button>

        {refCode && referrerData && (
          <div className="mb-4 rounded-xl border-2 border-primary/30 bg-green-50 p-3 flex items-center gap-3" data-testid="section-referred-banner">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Handshake className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-foreground">
              You were referred by <span className="font-semibold">{referrerData.referrerName}</span>
            </p>
          </div>
        )}

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-3">
            <Handshake className="h-4 w-4" />
            Trusted Services Partner Program
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground" data-testid="text-partner-apply-title">
            Become a Trusted Partner
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Join the {platform.name} network and connect your services with veterans and military families who need them most.
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            Already a Trusted Partner?{" "}
            <button
              data-testid="link-partner-login"
              className="text-primary font-semibold underline hover:text-primary/80 transition-colors"
              onClick={() => setShowPartnerLogin(true)}
            >
              Log in here
            </button>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border rounded-xl p-3 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-[11px] font-medium text-foreground">Veteran Audience</p>
            <p className="text-[10px] text-muted-foreground">Direct access to veterans</p>
          </div>
          <div className="bg-white border rounded-xl p-3 text-center">
            <BarChart3 className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-[11px] font-medium text-foreground">Qualified Leads</p>
            <p className="text-[10px] text-muted-foreground">Verified connection requests</p>
          </div>
          <div className="bg-white border rounded-xl p-3 text-center">
            <Star className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-[11px] font-medium text-foreground">Trusted Badge</p>
            <p className="text-[10px] text-muted-foreground">Vetted partner status</p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border-2 border-primary/30 bg-green-50/60 p-4" data-testid="section-refer-a-business">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Gift className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Refer a Business & Get 1 Free Month</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            Know another business that would be a great fit for {platform.name}? Once you are approved as a Trusted Partner, you can refer a new business and earn one free month after their first paid billing cycle is completed.
          </p>
          <p className="text-xs font-semibold text-foreground mb-1.5">How it works:</p>
          <div className="space-y-1 text-xs text-foreground/80 mb-3">
            <p className="flex items-start gap-1.5">
              <span className="font-semibold text-primary shrink-0">1.</span>
              Apply and become an approved Trusted Partner
            </p>
            <p className="flex items-start gap-1.5">
              <span className="font-semibold text-primary shrink-0">2.</span>
              Refer a new business to {platform.name}
            </p>
            <p className="flex items-start gap-1.5">
              <span className="font-semibold text-primary shrink-0">3.</span>
              They activate a paid plan
            </p>
            <p className="flex items-start gap-1.5">
              <span className="font-semibold text-primary shrink-0">4.</span>
              After their first successful paid billing cycle is completed
            </p>
            <p className="flex items-start gap-1.5">
              <span className="font-semibold text-primary shrink-0">5.</span>
              You receive 100% off your next monthly invoice
            </p>
          </div>
          <div className="border-t border-primary/10 pt-2">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              One free month per qualified referral. Referred business must be new, not an existing partner. Credit is applied after the referred business completes its first paid billing cycle. Referral credit applies to a future invoice only and cannot be exchanged for cash. Once approved, you'll gain access to your partner referral dashboard where you can share your referral link and track your rewards.
            </p>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-foreground mb-1">
            Select Your Plan <span className="text-destructive">*</span>
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Choose the coverage area that matches your business reach.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* State Plan */}
            <button
              type="button"
              data-testid="button-plan-state"
              onClick={() => selectPlan("state")}
              className={`relative text-left rounded-xl border-2 p-4 transition-all focus:outline-none ${
                form.plan_type === "state"
                  ? "border-primary bg-green-50 shadow-sm"
                  : "border-border bg-white hover:border-primary/50"
              }`}
            >
              {form.plan_type === "state" && (
                <span className="absolute top-3 right-3 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">State Plan</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                $99<span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Listed in one state. Ideal for local and regional businesses.
              </p>
            </button>

            {/* National Plan */}
            <button
              type="button"
              data-testid="button-plan-national"
              onClick={() => selectPlan("national")}
              className={`relative text-left rounded-xl border-2 p-4 transition-all focus:outline-none ${
                form.plan_type === "national"
                  ? "border-primary bg-green-50 shadow-sm"
                  : "border-border bg-white hover:border-primary/50"
              }`}
            >
              {form.plan_type === "national" && (
                <span className="absolute top-3 right-3 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">National Plan</span>
                <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Best Value</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                $499<span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Listed in all states. Ideal for national and online businesses.
              </p>
            </button>
          </div>

          {/* No plan selected warning */}
          {form.plan_type === "" && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Please select a plan to continue.
            </p>
          )}

          {/* National plan confirmation */}
          {form.plan_type === "national" && (
            <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5">
              <Globe className="h-4 w-4 text-blue-600 shrink-0" />
              <p className="text-xs text-blue-800 font-medium">
                National Plan — All States Access. Your listing will appear for veterans in every state.
              </p>
            </div>
          )}
        </div>

        {form.plan_type && (
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Boost Your Visibility
              <Badge variant="secondary" className="text-[10px]">Optional</Badge>
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Add premium placement options to maximize your exposure to veterans.
            </p>
            <div className="space-y-2">
              {ADDON_INFO.map((addon) => {
                const Icon = addon.icon;
                return (
                  <div
                    key={addon.key}
                    data-testid={`addon-${addon.key}`}
                    className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                      addons[addon.key]
                        ? "border-primary bg-green-50"
                        : "border-border bg-white"
                    }`}
                  >
                    <Icon className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{addon.label}</p>
                      <p className="text-[11px] text-muted-foreground">{addon.desc}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">+${addon.price.toFixed(2)}/mo</span>
                    <Switch
                      data-testid={`switch-addon-${addon.key}`}
                      checked={addons[addon.key]}
                      onCheckedChange={(checked) =>
                        setAddons((prev) => ({ ...prev, [addon.key]: checked }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {form.plan_type && (
          <div className="mb-5 rounded-xl border-2 border-primary/30 bg-green-50/50 p-4" data-testid="pricing-summary">
            <h3 className="text-sm font-semibold text-foreground mb-2">Monthly Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {form.plan_type === "state" ? "State Plan" : "National Plan"} (base)
                </span>
                <span className="font-medium">${basePrice.toFixed(2)}/mo</span>
              </div>
              {selectedAddons.map((a) => (
                <div key={a.key} className="flex justify-between">
                  <span className="text-muted-foreground">{a.label}</span>
                  <span className="font-medium">+${a.price.toFixed(2)}/mo</span>
                </div>
              ))}
              {ecssAddonPrice > 0 && (
                <div className="flex justify-between" data-testid="pricing-row-ecss">
                  <span className="text-muted-foreground">Elite Sponsor Slot</span>
                  <span className="font-medium">+${ecssAddonPrice.toFixed(2)}/mo</span>
                </div>
              )}
              <div className="border-t pt-1 mt-1 flex justify-between text-base font-bold text-foreground">
                <span>Total</span>
                <span data-testid="text-pricing-total">${monthlyTotal.toFixed(2)}/mo</span>
              </div>
            </div>
            {(addons.ecss || form.is_lead_enabled) && (
              <p className="mt-2 text-[11px] text-stone-700 italic" data-testid="text-pricing-lead-fee-note">
                + Accepted qualified leads are billed separately at <strong>$49.99 per lead</strong>.
              </p>
            )}
          </div>
        )}


        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Partner Application
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name" className="text-xs">Company Name *</Label>
                <Input
                  id="company_name"
                  data-testid="input-company-name"
                  value={form.company_name}
                  onChange={(e) => updateField("company_name", e.target.value)}
                  placeholder="Your company name"
                />
              </div>
              <div>
                <Label htmlFor="contact_name" className="text-xs">Contact Name *</Label>
                <Input
                  id="contact_name"
                  data-testid="input-contact-name"
                  value={form.contact_name}
                  onChange={(e) => updateField("contact_name", e.target.value)}
                  placeholder="Full name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-xs">Email *</Label>
                <Input
                  id="email"
                  data-testid="input-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="partner@company.com"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs">Phone</Label>
                <Input
                  id="phone"
                  data-testid="input-phone"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website" className="text-xs">Website</Label>
              <Input
                id="website"
                data-testid="input-website"
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://www.yourcompany.com"
              />
            </div>

            {/* City + State — state required if state plan, hidden if national */}
            <div className={`grid gap-4 ${form.plan_type === "national" ? "grid-cols-1" : "grid-cols-2"}`}>
              <div>
                <Label htmlFor="city" className="text-xs">City</Label>
                <Input
                  id="city"
                  data-testid="input-city"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City"
                />
              </div>

              {form.plan_type !== "national" && (
                <div>
                  <Label htmlFor="state" className="text-xs">
                    State {form.plan_type === "state" && <span className="text-destructive">*</span>}
                  </Label>
                  <Select value={form.state} onValueChange={(v) => updateField("state", v)}>
                    <SelectTrigger data-testid="select-state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {form.plan_type === "national" && (
                <div className="hidden" aria-hidden="true" />
              )}
            </div>

            <div>
              <Label htmlFor="category" className="text-xs">Service Category</Label>
              <Select value={form.category_id} onValueChange={(v) => {
                setForm(prev => ({
                  ...prev,
                  category_id: v,
                  subcategory_ids: [],
                  // Preserve lead delivery if Elite Sponsor is on (ECSS requires it).
                  // Otherwise reset to false so user opts in fresh per category.
                  is_lead_enabled: addons.ecss ? true : false,
                }));
              }}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    const services = categories.filter(c => !c.group_type || c.group_type === 'service');
                    const products = categories.filter(c => c.group_type === 'product');
                    return (
                      <>
                        {services.length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="text-xs font-semibold text-muted-foreground">Trusted Services</SelectLabel>
                            {services.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                        {products.length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="text-xs font-semibold text-muted-foreground">Products & Local Offers</SelectLabel>
                            {products.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                      </>
                    );
                  })()}
                </SelectContent>
              </Select>
            </div>

            {subcategories.length > 0 && (
              <div>
                <Label className="text-xs">Service Specialties</Label>
                <p className="text-xs text-muted-foreground mb-2">Select all that apply</p>
                <div className="grid grid-cols-1 gap-2">
                  {subcategories.map((sc) => {
                    const checked = form.subcategory_ids.includes(sc.id);
                    return (
                      <label
                        key={sc.id}
                        data-testid={`checkbox-subcategory-${sc.slug}`}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setForm(prev => ({
                              ...prev,
                              subcategory_ids: checked
                                ? prev.subcategory_ids.filter(id => id !== sc.id)
                                : [...prev.subcategory_ids, sc.id]
                            }));
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium">{sc.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* Elite Category Sponsor Slot — always visible once a category */}
            {/* is picked. Adapts based on plan/state/availability.          */}
            {/* ============================================================ */}
            {form.category_id && (
              <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 space-y-3" data-testid="ecss-upsell-section">
                <div className="flex items-start gap-3">
                  <Crown className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-amber-900">Elite Category Sponsor Slot</h4>
                      <Badge variant="secondary" className="text-[10px] bg-amber-200 text-amber-900 border-amber-300">Premium</Badge>
                    </div>
                    <p className="text-xs text-amber-800/80 mt-0.5">
                      Starts at $499/mo + $49.99 per accepted lead. Pricing varies by state, category, and availability. Single occupancy — only one business per state per category.
                    </p>
                  </div>
                </div>

                {!ECSS_CATEGORY_SLUGS.has(selectedCategorySlug) ? (
                  <div className="bg-white/60 rounded-lg p-3 border border-amber-200" data-testid="ecss-state-not-eligible-category">
                    <p className="text-xs text-stone-700">
                      The Elite Sponsor Slot is currently only sold for these four categories:
                    </p>
                    <p className="text-xs text-stone-700 mt-1">
                      <strong>Legal Services · Mortgage / Lending · Real Estate · Insurance</strong>
                    </p>
                    <p className="text-[11px] text-stone-500 mt-2">
                      Switch your Service Category above to one of those to claim the slot for your state.
                    </p>
                  </div>
                ) : form.plan_type !== "state" || !form.state ? (
                  <div className="bg-white/60 rounded-lg p-3 border border-amber-200" data-testid="ecss-state-needs-state-plan">
                    <p className="text-xs text-stone-700">
                      Pick the <strong>$99/mo State Plan</strong> above and select a state to check Elite Sponsor availability for {selectedCategorySlug.replace(/-/g, " ")}.
                    </p>
                  </div>
                ) : !ecssAvail ? (
                  <div className="bg-white/60 rounded-lg p-3 border border-amber-200 flex items-center gap-2" data-testid="ecss-state-loading">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                    <p className="text-xs text-stone-600">
                      Checking availability for {selectedCategorySlug.replace(/-/g, " ")} in {form.state}…
                    </p>
                  </div>
                ) : ecssAvail.soldOut ? (
                  <div className="bg-white rounded-lg p-3 border-2 border-stone-300" data-testid="ecss-soldout-card">
                    <p className="text-sm font-semibold text-stone-800 mb-1">
                      Sold for {form.state} — Join Waitlist
                    </p>
                    <p className="text-xs text-stone-600 mb-3">
                      We'll let you know the moment this slot opens up.
                    </p>
                    {ecssWaitlistJoined ? (
                      <p className="text-xs font-medium text-emerald-700" data-testid="text-ecss-waitlist-confirmed">
                        You're on the waitlist. We'll be in touch.
                      </p>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          data-testid="input-ecss-waitlist-email"
                          type="email"
                          placeholder="you@company.com"
                          value={ecssWaitlistEmail}
                          onChange={(e) => setEcssWaitlistEmail(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          data-testid="button-ecss-waitlist-join"
                          onClick={async () => {
                            const email = (ecssWaitlistEmail || form.email || "").trim();
                            if (!email) {
                              toast({ title: "Email required", description: "Please enter an email to join the waitlist.", variant: "destructive" });
                              return;
                            }
                            try {
                              const r = await fetch("/api/elite-sponsor/waitlist", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  categorySlug: selectedCategorySlug,
                                  state: form.state,
                                  contact_name: form.contact_name || "",
                                  contact_email: email,
                                  contact_phone: form.phone || "",
                                  contact_company: form.company_name || "",
                                  session_id: sessionStorage.getItem("vc_session_id") || null,
                                }),
                              });
                              if (!r.ok) throw new Error("waitlist failed");
                              setEcssWaitlistJoined(true);
                              toast({ title: "You're on the list", description: "We'll let you know when this slot opens." });
                            } catch (err: any) {
                              toast({ title: "Could not save", description: err.message, variant: "destructive" });
                            }
                          }}
                        >
                          Join Waitlist
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div data-testid="ecss-upsell-card" className={`bg-white rounded-lg p-4 border-2 transition-all ${addons.ecss ? 'border-amber-500 ring-2 ring-amber-200 shadow-md' : 'border-amber-300'}`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-800 border-red-200 font-semibold">
                            Limited Availability — 1 per state
                          </Badge>
                        </div>
                        <p className="text-sm font-bold text-amber-900">
                          ✓ Available — Claim the Elite Sponsor Slot for {selectedCategorySlug.replace(/-/g, " ")} in {form.state}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-amber-800">${ecssMonthlyPrice.toFixed(0)}/mo</div>
                        <div className="text-[10px] text-amber-700 font-semibold">+ $49.99/lead</div>
                      </div>
                    </div>
                    <ul className="text-[11px] text-stone-700 list-disc ml-4 space-y-0.5 mb-3">
                      <li>Premium logo + business name + CTA above all category listings in {form.state}</li>
                      <li>Direct lead capture — auto-billed at $49.99 per accepted lead</li>
                      <li>Top placement in Trusted Services tile grid</li>
                      <li>Pending admin creative approval before going live</li>
                    </ul>
                    <div className={`flex items-center justify-between gap-3 pt-3 border-t border-amber-200 ${addons.ecss ? 'bg-amber-100/60 -mx-4 px-4 -mb-4 pb-4 rounded-b-lg' : ''}`}>
                      <Label htmlFor="ecss-toggle" className="text-sm font-bold cursor-pointer text-amber-900">
                        {addons.ecss
                          ? `✓ Yes — Elite Sponsor Slot added (+$${ecssMonthlyPrice.toFixed(0)}/mo)`
                          : `Yes, claim the Elite Sponsor Slot (+$${ecssMonthlyPrice.toFixed(0)}/mo)`}
                      </Label>
                      <Switch
                        id="ecss-toggle"
                        data-testid="switch-addon-ecss"
                        checked={addons.ecss}
                        onCheckedChange={(checked) =>
                          setAddons((prev) => ({ ...prev, ecss: checked }))
                        }
                      />
                    </div>
                    {addons.ecss && (
                      <p className="mt-3 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1.5" data-testid="text-ecss-auto-enable-note">
                        Direct Lead Delivery has been turned on automatically — Elite Sponsors receive leads directly and are billed $49.99 per accepted lead.
                      </p>
                    )}

                    {addons.ecss && (
                      <div className="mt-4 pt-4 border-t border-amber-200 space-y-3" data-testid="ecss-creative-fields">
                        <div>
                          <Label className="text-xs">Logo (square, will display ~80×80) *</Label>
                          <input
                            type="file"
                            accept="image/*"
                            data-testid="input-ecss-logo"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleLogoFile(f);
                            }}
                            className="mt-1 block w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
                          />
                          {ecssLogoError && (
                            <p className="text-[11px] text-red-700 mt-1">{ecssLogoError}</p>
                          )}
                          {ecssLogoDataUrl && (
                            <div className="mt-2 flex items-center gap-2">
                              <img
                                src={ecssLogoDataUrl}
                                alt="Logo preview"
                                className="w-14 h-14 rounded-md object-cover border border-stone-200 bg-white"
                                data-testid="img-ecss-logo-preview"
                              />
                              <span className="text-[11px] text-stone-500">
                                ~{Math.round(ecssLogoDataUrl.length / 1024)}KB
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <Label className="text-xs">Banner headline / short description (max 200 chars)</Label>
                          <Input
                            data-testid="input-ecss-description"
                            value={ecssShortDescription}
                            onChange={(e) => setEcssShortDescription(e.target.value.slice(0, 200))}
                            placeholder="One line about what you offer veterans"
                            maxLength={200}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">CTA button text</Label>
                          <Input
                            data-testid="input-ecss-cta"
                            value={ecssCtaText}
                            onChange={(e) => setEcssCtaText(e.target.value.slice(0, 30))}
                            placeholder="Get Help"
                            maxLength={30}
                          />
                        </div>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          <strong>Admin approval required:</strong> after we approve your application and creative, you'll receive a Stripe checkout link to activate billing. The slot goes live as soon as payment + creative approval clear.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {(() => {
              const selectedCat = categories.find(c => c.id === form.category_id);
              if (!selectedCat || !isLeadEligibleCategory(selectedCat.slug)) return null;
              return (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3" data-testid="section-lead-delivery">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Direct Lead Delivery</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Receive direct inquiries from individuals actively seeking services in your category and requesting to be connected with a provider.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="lead-toggle" className="text-sm font-medium cursor-pointer">
                      {addons.ecss ? "Direct Lead Delivery (required for Elite Sponsor)" : "Yes, I'd like to receive qualified leads"}
                    </Label>
                    <Switch
                      id="lead-toggle"
                      data-testid="toggle-lead-enabled"
                      checked={form.is_lead_enabled}
                      disabled={addons.ecss}
                      onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_lead_enabled: checked }))}
                    />
                  </div>
                  {addons.ecss && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5" data-testid="text-lead-locked-by-ecss">
                      Locked ON because the Elite Sponsor Slot you selected delivers leads directly to you. Uncheck the Elite Sponsor Slot above to disable.
                    </p>
                  )}
                  {form.is_lead_enabled && (
                    <div className="rounded-md bg-background border border-border p-3 space-y-1.5" data-testid="lead-pricing-info">
                      <p className="text-sm font-semibold text-foreground">$49.99 per qualified lead delivered</p>
                      <p className="text-xs text-muted-foreground">A qualified lead is a direct inquiry from a user who has requested help connecting with a provider in your category. Leads are delivered directly to your inbox, and you are only charged when a qualified lead is sent to you. Leads are matched based on category, location, and user request.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            <div>
              <Label htmlFor="service_description" className="text-xs">Describe Your Services</Label>
              <Textarea
                id="service_description"
                data-testid="input-description"
                value={form.service_description}
                onChange={(e) => updateField("service_description", e.target.value)}
                placeholder="Briefly describe the services you provide and how they benefit veterans..."
                rows={3}
              />
            </div>

            <Button
              data-testid="button-submit-application"
              className="w-full"
              size="lg"
              disabled={!canSubmit || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
            >
              {submitMutation.isPending ? (
                <>Submitting...</>
              ) : (
                <>
                  <Handshake className="h-4 w-4 mr-2" />
                  Submit Partner Application
                </>
              )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              By submitting, you agree to be contacted by the {platform.name} team regarding partnership opportunities.
            </p>
          </CardContent>
        </Card>

      </div>

      <PartnerSignupModal
        open={showPartnerLogin}
        onOpenChange={setShowPartnerLogin}
        defaultMode="login"
        onSuccess={() => setLocation("/partner-portal")}
      />
    </div>
  );
}
