
import { useState, useEffect } from "react";
import { platform, t } from "@shared/platform";
import { trackEvent, getUTMParams } from "@/lib/analytics";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, CheckCircle2, AlertTriangle, Clock, CalendarDays, Info, Phone as PhoneIcon, Globe, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSavedResources } from "@/lib/store";

const URGENCY_OPTIONS = [
  {
    value: "immediate",
    label: "I need help now",
    description: "Crisis or emergency situation",
    icon: AlertTriangle,
    color: "border-red-300 bg-red-50 text-red-800 hover:border-red-400",
    selectedColor: "border-red-500 bg-red-100 text-red-900 ring-2 ring-red-200",
  },
  {
    value: "same_week",
    label: "This week",
    description: "Urgent but not an emergency",
    icon: Clock,
    color: "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400",
    selectedColor: "border-amber-500 bg-amber-100 text-amber-900 ring-2 ring-amber-200",
  },
  {
    value: "standard",
    label: "When available",
    description: "I can wait for the right help",
    icon: CalendarDays,
    color: "border-blue-300 bg-blue-50 text-blue-800 hover:border-blue-400",
    selectedColor: "border-blue-500 bg-blue-100 text-blue-900 ring-2 ring-blue-200",
  },
  {
    value: "information",
    label: "Just exploring",
    description: "Looking for information only",
    icon: Info,
    color: "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400",
    selectedColor: "border-slate-500 bg-slate-100 text-slate-800 ring-2 ring-slate-200",
  },
];

const HELP_CATEGORIES = [
  { value: "crisis-help", label: "Crisis Help" },
  { value: "mental-health", label: "Mental Health" },
  { value: "benefits-assistance", label: "Benefits & VA Claims" },
  { value: "healthcare-services", label: "Healthcare" },
  { value: "housing-home", label: "Housing & Home Services" },
  { value: "disabled-veterans", label: "Disabled Veterans" },
  { value: "employment-support", label: "Employment Support" },
  { value: "education-training", label: "Education & Training" },
  { value: "legal-services", label: "Legal Services" },
  { value: "financial-credit", label: "Financial & Credit Services" },
  { value: "wellness-recovery", label: "Wellness & Recovery" },
  { value: "end-of-life-services", label: "End of Life Services" },
  { value: "family-support", label: "Family & Caregivers" },
  { value: "food-assistance", label: "Food Assistance" },
  { value: "community-support", label: "Community Support" },
  { value: "transportation", label: "Transportation" },
];

const SUBCATEGORIES: Record<string, { value: string; label: string }[]> = {
  "benefits-assistance": [
    { value: "disability-claim", label: "Disability Claim" },
    { value: "pact-act", label: "PACT Act / Burn Pit" },
    { value: "pension", label: "Pension" },
    { value: "appeals", label: "Appeals" },
    { value: "other-benefits", label: "Other Benefits" },
  ],
  "healthcare-services": [
    { value: "va-enrollment", label: "VA Healthcare Enrollment" },
    { value: "prescriptions", label: "Prescriptions" },
    { value: "dental-vision", label: "Dental / Vision" },
    { value: "community-care", label: "Community Care" },
    { value: "other-healthcare", label: "Other Healthcare" },
  ],
  "crisis-help": [
    { value: "suicide-prevention", label: "Suicide Prevention" },
    { value: "homeless-services", label: "Homeless Services" },
    { value: "domestic-violence", label: "Domestic Violence" },
    { value: "substance-abuse", label: "Substance Abuse" },
    { value: "other-crisis", label: "Other Crisis" },
  ],
  "mental-health": [
    { value: "ptsd", label: "PTSD" },
    { value: "counseling", label: "Counseling / Therapy" },
    { value: "peer-support", label: "Peer Support" },
    { value: "group-therapy", label: "Group Therapy" },
    { value: "other-mental-health", label: "Other Mental Health" },
  ],
  "housing-home": [
    { value: "va-home-loan", label: "VA Home Loan" },
    { value: "rental-assistance", label: "Rental Assistance" },
    { value: "homeless-prevention", label: "Homeless Prevention" },
    { value: "home-modification", label: "Home Modification" },
    { value: "other-housing", label: "Other Housing" },
  ],
  "employment-support": [
    { value: "job-search", label: "Job Search" },
    { value: "resume-help", label: "Resume / Interview Prep" },
    { value: "vocational-rehab", label: "Vocational Rehab (VR&E)" },
    { value: "veteran-owned-biz", label: "Veteran-Owned Business" },
    { value: "other-employment", label: "Other Employment" },
  ],
  "education-training": [
    { value: "gi-bill", label: "GI Bill" },
    { value: "tuition-assistance", label: "Tuition Assistance" },
    { value: "certifications", label: "Certifications / Training" },
    { value: "scholarships", label: "Scholarships" },
    { value: "other-education", label: "Other Education" },
  ],
  "legal-services": [
    { value: "legal-aid", label: "Legal Aid" },
    { value: "disability-appeals", label: "Disability Appeals" },
    { value: "estate-planning", label: "Estate Planning" },
    { value: "tenant-rights", label: "Tenant Rights" },
    { value: "other-legal", label: "Other Legal" },
  ],
  "financial-credit": [
    { value: "financial-counseling", label: "Financial Counseling" },
    { value: "debt-relief", label: "Debt Relief" },
    { value: "credit-repair", label: "Credit Repair" },
    { value: "tax-help", label: "Tax Help" },
    { value: "other-financial", label: "Other Financial" },
  ],
  "wellness-recovery": [
    { value: "substance-recovery", label: "Substance Recovery" },
    { value: "holistic-wellness", label: "Holistic Wellness" },
    { value: "fitness-recreation", label: "Fitness & Recreation" },
    { value: "other-wellness", label: "Other Wellness" },
  ],
  "end-of-life-services": [
    { value: "hospice", label: "Hospice Care" },
    { value: "funeral-burial", label: "Funeral & Burial" },
    { value: "survivor-benefits", label: "Survivor Benefits" },
    { value: "estate-planning", label: "Estate Planning" },
    { value: "other-end-of-life", label: "Other End of Life" },
  ],
  "disabled-veterans": [
    { value: "adaptive-housing", label: "Adaptive Housing" },
    { value: "mobility-equipment", label: "Mobility Equipment" },
    { value: "caregiver-support", label: "Caregiver Support" },
    { value: "advocacy", label: "Advocacy" },
    { value: "other-disabled", label: "Other Disabled Veteran" },
  ],
  "family-support": [
    { value: "caregiver-support", label: "Caregiver Support" },
    { value: "spouse-benefits", label: "Spouse / Dependent Benefits" },
    { value: "childcare", label: "Childcare" },
    { value: "survivor-benefits", label: "Survivor Benefits" },
    { value: "other-family", label: "Other Family" },
  ],
};

export interface NavigatorContext {
  resource_id?: string | null;
  resource_title?: string | null;
  category?: string | null;
  subcategory?: string | null;
}

interface NavigatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: NavigatorContext;
  initialUrgency?: string;
  source?: string;
}

export default function NavigatorModal({ open, onOpenChange, context, initialUrgency, source }: NavigatorModalProps) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitResult, setSubmitResult] = useState<{ routed: boolean; emailSent?: boolean; self_serve_resources?: any[] } | null>(null);
  const [form, setForm] = useState({
    veteran_name: "",
    veteran_phone: "",
    veteran_email: "",
    message: "",
    preferred_contact: "either",
    category: "",
    subcategory: "",
    urgency: "",
    override_state: "",
    override_city: "",
  });

  const hasResourceContext = !!(context?.resource_id);

  useEffect(() => {
    if (open) {
      if (context?.category) {
        let ctxSub = context.subcategory || "";
        if (ctxSub && !ctxSub.includes("-")) {
          ctxSub = ctxSub.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        }
        const catSubs = SUBCATEGORIES[context.category || ""] || [];
        const validSub = catSubs.find(s => s.value === ctxSub || s.label === context.subcategory);
        setForm(p => ({
          ...p,
          category: context.category || "",
          subcategory: validSub?.value || ctxSub,
        }));
      }
      if (initialUrgency) {
        setForm(p => ({ ...p, urgency: initialUrgency }));
      }
    }
  }, [open, context?.category, context?.subcategory, initialUrgency]);

  const currentSubcategories = SUBCATEGORIES[form.category] || [];

  const resetForm = () => {
    setForm({
      veteran_name: "", veteran_phone: "", veteran_email: "", message: "",
      preferred_contact: "either", category: "", subcategory: "", urgency: "",
      override_state: "", override_city: "",
    });
    setSubmitted(false);
    setSubmitResult(null);
    setError("");
    setSubmitting(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const handleCategoryChange = (val: string) => {
    setForm(p => ({ ...p, category: val, subcategory: "" }));
  };

  const categoryLabel = HELP_CATEGORIES.find(c => c.value === form.category)?.label || form.category;
  const subcategoryLabel = currentSubcategories.find(s => s.value === form.subcategory)?.label || form.subcategory;

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const loc = useSavedResources.getState().userLocation;
      const utm = getUTMParams();
      const finalState = form.override_state?.trim() || loc.stateCode || null;
      const finalCity = form.override_city?.trim() || loc.city || null;
      const res = await fetch("/api/navigator-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource_id: context?.resource_id || null,
          resource_title: context?.resource_title || null,
          veteran_name: form.veteran_name,
          veteran_phone: form.veteran_phone || null,
          veteran_email: form.veteran_email || null,
          message: form.message || null,
          preferred_contact: form.preferred_contact,
          category: form.category || null,
          subcategory: form.subcategory || null,
          subcategory_label: subcategoryLabel || null,
          user_state: finalState,
          user_city: finalCity,
          user_zip: loc.zip || null,
          urgency: form.urgency || null,
          source: source || (context?.resource_id ? "resource_page" : null),
          utm_source: utm.utm_source || null,
          utm_medium: utm.utm_medium || null,
          utm_campaign: utm.utm_campaign || null,
          utm_content: utm.utm_content || null,
          utm_id: utm.utm_id || null,
          session_id: sessionStorage.getItem("vc_session_id") || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSubmitResult({ routed: data.routed ?? false, emailSent: data.emailSent ?? false, self_serve_resources: data.self_serve_resources });
      setSubmitted(true);
      trackEvent("lead_submit", {
        category: form.category || "",
        subcategory: subcategoryLabel || "",
        urgency: form.urgency || "",
        source: source || (context?.resource_id ? "resource_page" : ""),
        routed: data.routed ? "true" : "false",
      });
      toast({
        description: data.routed
          ? "Request submitted! A local partner will reach out to you soon."
          : "Request received! See the resource contacts below.",
        duration: 4000,
      });
    } catch (err: any) {
      const msg = err.message?.toLowerCase().includes("relation") || err.message?.toLowerCase().includes("does not exist")
        ? "Navigator system is being enabled — please try again shortly."
        : err.message;
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = form.veteran_name.trim().length >= 2
    && (form.veteran_phone.trim() || form.veteran_email.trim())
    && (hasResourceContext || form.category);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px] max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Request Support
          </DialogTitle>
          <DialogDescription>
            {t(platform.navigatorDescription)}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-3 py-2 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-green-700">
                  {submitResult?.routed ? "Request Submitted" : "Request Received"}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {submitResult?.routed
                    ? t(platform.navigatorConfirmation)
                    : "Your request has been received. A support specialist will review it and follow up with you."}
                </p>
              </div>
            </div>

            {submitResult?.emailSent && (
              <div data-testid="email-confirmation" className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-xs text-green-800">A confirmation has been sent to your email. A support specialist will review your request and follow up with you.</p>
              </div>
            )}

            {!submitResult?.routed && submitResult?.self_serve_resources && submitResult.self_serve_resources.length > 0 && (
              <div data-testid="self-serve-resources" className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Recommended Resources:</p>
                {submitResult.self_serve_resources.map((r: any, i: number) => (
                  <div key={i} data-testid={`self-serve-resource-${i}`} className="rounded-lg border p-3 space-y-1.5 bg-muted/30">
                    <p className="text-sm font-semibold text-foreground">{r.title}</p>
                    {r.city && r.state && (
                      <p className="text-xs text-muted-foreground">{r.city}, {r.state}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          <PhoneIcon className="h-3 w-3" /> {r.phone}
                        </a>
                      )}
                      {r.website && (
                        <a href={r.website.startsWith("http") ? r.website : `https://${r.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          <Globe className="h-3 w-3" /> Website
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {form.urgency === "immediate" && (
              <div data-testid="crisis-resources-post-submit" className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                <p className="text-xs font-semibold text-red-800">If you are in immediate danger, please call:</p>
                <a href="tel:988" className="flex items-center gap-2 text-sm font-bold text-red-700 hover:underline">
                  <PhoneIcon className="h-4 w-4" /> 988 Suicide & Crisis Lifeline
                </a>
                <a href="tel:18002738255" className="flex items-center gap-2 text-sm font-bold text-red-700 hover:underline">
                  <PhoneIcon className="h-4 w-4" /> Veterans Crisis Line: 1-800-273-8255
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">How soon do you need help?</Label>
              <div className="grid grid-cols-2 gap-2">
                {URGENCY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = form.urgency === opt.value;
                  return (
                    <button
                      key={opt.value}
                      data-testid={`button-urgency-${opt.value}`}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, urgency: opt.value }))}
                      className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all ${isSelected ? opt.selectedColor : opt.color}`}
                    >
                      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold leading-tight">{opt.label}</p>
                        <p className="text-[10px] opacity-75 leading-tight mt-0.5">{opt.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {form.urgency === "immediate" && (
              <div data-testid="crisis-banner" className="rounded-lg border border-red-300 bg-red-50 p-3 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  If you are in crisis right now:
                </p>
                <a href="tel:988" className="flex items-center gap-2 text-xs font-bold text-red-700 hover:underline">
                  <PhoneIcon className="h-3.5 w-3.5" /> Call 988 (Suicide & Crisis Lifeline)
                </a>
                <a href="tel:18002738255" className="flex items-center gap-2 text-xs font-bold text-red-700 hover:underline">
                  <PhoneIcon className="h-3.5 w-3.5" /> Veterans Crisis Line: 1-800-273-8255
                </a>
                <p className="text-[10px] text-red-600 mt-1">Press 1 for Veterans. Available 24/7.</p>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Your Name *</Label>
              <Input
                data-testid="input-nav-modal-name"
                className="h-9 text-sm"
                placeholder="Full name"
                value={form.veteran_name}
                onChange={(e) => setForm(p => ({ ...p, veteran_name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input
                  data-testid="input-nav-modal-phone"
                  className="h-9 text-sm"
                  placeholder="(555) 123-4567"
                  value={form.veteran_phone}
                  onChange={(e) => setForm(p => ({ ...p, veteran_phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  data-testid="input-nav-modal-email"
                  className="h-9 text-sm"
                  type="email"
                  placeholder="you@email.com"
                  value={form.veteran_email}
                  onChange={(e) => setForm(p => ({ ...p, veteran_email: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Phone or email required so a navigator can reach you.</p>

            <div className="space-y-1">
              <Label className="text-xs">How should we contact you?</Label>
              <Select
                value={form.preferred_contact}
                onValueChange={(v) => setForm(p => ({ ...p, preferred_contact: v }))}
              >
                <SelectTrigger data-testid="select-nav-modal-contact" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="either">Either is fine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">State</Label>
                <Select
                  value={form.override_state || undefined}
                  onValueChange={(v) => setForm(p => ({ ...p, override_state: v }))}
                >
                  <SelectTrigger data-testid="select-nav-modal-state" className="h-9 text-sm">
                    <SelectValue placeholder={useSavedResources.getState().userLocation.stateCode || "Select state"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SC">South Carolina</SelectItem>
                    <SelectItem value="NC">North Carolina</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="VA">Virginia</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <Input
                  data-testid="input-nav-modal-city"
                  className="h-9 text-sm"
                  placeholder={useSavedResources.getState().userLocation.city || "Your city"}
                  value={form.override_city}
                  onChange={(e) => setForm(p => ({ ...p, override_city: e.target.value }))}
                />
              </div>
            </div>
            {!form.override_state && !form.override_city && useSavedResources.getState().userLocation.city && (
              <p className="text-[10px] text-muted-foreground -mt-1">
                Detected: {useSavedResources.getState().userLocation.city}, {useSavedResources.getState().userLocation.stateCode}. Override above if different.
              </p>
            )}

            {hasResourceContext ? (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1 border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Regarding</p>
                <p className="text-sm font-medium">{context?.resource_title}</p>
                {context?.category && (
                  <p className="text-xs text-muted-foreground">{context.category}</p>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">What do you need help with? *</Label>
                  <Select
                    value={form.category || undefined}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger data-testid="select-nav-modal-category" className="h-9 text-sm">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {HELP_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentSubcategories.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">More specific (optional)</Label>
                    <Select
                      value={form.subcategory || undefined}
                      onValueChange={(v) => setForm(p => ({ ...p, subcategory: v }))}
                    >
                      <SelectTrigger data-testid="select-nav-modal-subcategory" className="h-9 text-sm">
                        <SelectValue placeholder="Select a subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentSubcategories.map(sub => (
                          <SelectItem key={sub.value} value={sub.value}>{sub.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Briefly describe what you need (optional)</Label>
              <Textarea
                data-testid="input-nav-modal-message"
                className="text-sm min-h-[70px]"
                placeholder="Tell us how we can help..."
                rows={3}
                value={form.message}
                onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))}
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <Button
              data-testid="button-submit-nav-modal"
              className="w-full h-10"
              disabled={submitting || !isValid}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting..." : "Request Support"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
