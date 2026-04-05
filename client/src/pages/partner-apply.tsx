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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ShieldCheck,
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
  Megaphone,
  LayoutList,
} from "lucide-react";
import { useLocation } from "wouter";
import { platform } from "@shared/platform";
import { useToast } from "@/hooks/use-toast";

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
}

export default function PartnerApply() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    website: "",
    city: "",
    state: "",
    category_id: "",
    service_description: "",
    pricing_interest: "both",
    plan_type: "" as "state" | "national" | "",
  });

  const [addons, setAddons] = useState({
    featured: false,
    near_me_boost: false,
    sponsored_top: false,
    sponsored_inline: false,
  });

  const ADDON_INFO = [
    { key: "featured" as const, label: "Featured Listing", icon: Sparkles, price: 49, desc: "Appear at the top of category results with a highlighted badge" },
    { key: "near_me_boost" as const, label: "Near Me Boost", icon: Navigation, price: 29, desc: "Priority placement in location-based searches" },
    { key: "sponsored_top" as const, label: "Sponsored Top Slot", icon: Megaphone, price: 79, desc: "Premium banner placement at the top of the directory" },
    { key: "sponsored_inline" as const, label: "Sponsored Inline", icon: LayoutList, price: 39, desc: "Promoted listing woven into search results" },
  ];

  const basePrices = { state: 99, national: 499 };
  const selectedAddons = ADDON_INFO.filter(a => addons[a.key]);
  const addonTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const basePrice = form.plan_type ? basePrices[form.plan_type] : 0;
  const monthlyTotal = basePrice + addonTotal;

  useEffect(() => {
    trackEvent("partner_apply_started");
  }, []);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/partner-categories"],
    queryFn: async () => {
      const res = await fetch("/api/partner-categories");
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const utm = getUTMParams();
      const res = await fetch("/api/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category_id: form.category_id || null,
          state: form.plan_type === "national" ? null : (form.state || null),
          addons: Object.entries(addons).filter(([, v]) => v).map(([k]) => k),
          utm_source: utm.utm_source || null,
          utm_medium: utm.utm_medium || null,
          utm_campaign: utm.utm_campaign || null,
          utm_content: utm.utm_content || null,
          utm_id: utm.utm_id || null,
          session_id: sessionStorage.getItem("vc_session_id") || null,
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
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">+${addon.price}/mo</span>
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
                <span className="font-medium">${basePrice}/mo</span>
              </div>
              {selectedAddons.map((a) => (
                <div key={a.key} className="flex justify-between">
                  <span className="text-muted-foreground">{a.label}</span>
                  <span className="font-medium">+${a.price}/mo</span>
                </div>
              ))}
              <div className="border-t pt-1 mt-1 flex justify-between text-base font-bold text-foreground">
                <span>Total</span>
                <span>${monthlyTotal}/mo</span>
              </div>
            </div>
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
              <Select value={form.category_id} onValueChange={(v) => updateField("category_id", v)}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
    </div>
  );
}
