
import { useState, useEffect } from "react";
import { platform, t } from "@shared/platform";
import { trackEvent } from "@/lib/analytics";
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
import { Sparkles, CheckCircle2, AlertTriangle, Clock, CalendarDays, Info, Phone as PhoneIcon } from "lucide-react";
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
  { value: "va-benefits", label: "Benefits & VA Claims" },
  { value: "healthcare", label: "Healthcare" },
  { value: "crisis-help", label: "Crisis Help" },
  { value: "mental-health", label: "Mental Health" },
  { value: "housing", label: "Housing Support" },
  { value: "employment", label: "Employment" },
  { value: "education", label: "Education & GI Bill" },
  { value: "legal", label: "Legal & Financial" },
  { value: "family-support", label: "Family & Caregivers" },
  { value: "records", label: "Military Records" },
  { value: "transition", label: "Transition" },
];

const SUBCATEGORIES: Record<string, { value: string; label: string }[]> = {
  "va-benefits": [
    { value: "disability-claim", label: "Disability Claim" },
    { value: "pact-act", label: "PACT Act / Burn Pit" },
    { value: "pension", label: "Pension" },
    { value: "appeals", label: "Appeals" },
    { value: "other-benefits", label: "Other Benefits" },
  ],
  "healthcare": [
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
  "housing": [
    { value: "va-home-loan", label: "VA Home Loan" },
    { value: "rental-assistance", label: "Rental Assistance" },
    { value: "homeless-prevention", label: "Homeless Prevention" },
    { value: "home-modification", label: "Home Modification" },
    { value: "other-housing", label: "Other Housing" },
  ],
  "employment": [
    { value: "job-search", label: "Job Search" },
    { value: "resume-help", label: "Resume / Interview Prep" },
    { value: "vocational-rehab", label: "Vocational Rehab (VR&E)" },
    { value: "veteran-owned-biz", label: "Veteran-Owned Business" },
    { value: "other-employment", label: "Other Employment" },
  ],
  "education": [
    { value: "gi-bill", label: "GI Bill" },
    { value: "tuition-assistance", label: "Tuition Assistance" },
    { value: "certifications", label: "Certifications / Training" },
    { value: "scholarships", label: "Scholarships" },
    { value: "other-education", label: "Other Education" },
  ],
  "legal": [
    { value: "legal-aid", label: "Legal Aid" },
    { value: "financial-counseling", label: "Financial Counseling" },
    { value: "debt-relief", label: "Debt Relief" },
    { value: "tax-help", label: "Tax Help" },
    { value: "other-legal-financial", label: "Other Legal / Financial" },
  ],
  "family-support": [
    { value: "caregiver-support", label: "Caregiver Support" },
    { value: "spouse-benefits", label: "Spouse / Dependent Benefits" },
    { value: "childcare", label: "Childcare" },
    { value: "survivor-benefits", label: "Survivor Benefits" },
    { value: "other-family", label: "Other Family" },
  ],
  "records": [
    { value: "dd214", label: "DD-214 Request" },
    { value: "service-records", label: "Service Records" },
    { value: "discharge-upgrade", label: "Discharge Upgrade" },
    { value: "medals-awards", label: "Medals / Awards" },
    { value: "other-records", label: "Other Records" },
  ],
  "transition": [
    { value: "tap-program", label: "TAP Program" },
    { value: "relocation", label: "Relocation" },
    { value: "civilian-adjustment", label: "Civilian Adjustment" },
    { value: "networking", label: "Networking / Mentorship" },
    { value: "other-transition", label: "Other Transition" },
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
  const [form, setForm] = useState({
    veteran_name: "",
    veteran_phone: "",
    veteran_email: "",
    message: "",
    preferred_contact: "either",
    category: "",
    subcategory: "",
    urgency: "",
  });

  const hasResourceContext = !!(context?.resource_id);

  useEffect(() => {
    if (open) {
      if (context?.category) {
        setForm(p => ({
          ...p,
          category: context.category || "",
          subcategory: context.subcategory || "",
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
    });
    setSubmitted(false);
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
          subcategory: subcategoryLabel || null,
          user_state: loc.stateCode || null,
          user_city: loc.city || null,
          user_zip: loc.zip || null,
          urgency: form.urgency || null,
          source: source || (context?.resource_id ? "resource_page" : null),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSubmitted(true);
      trackEvent("lead_submit", {
        category: form.category || "",
        subcategory: subcategoryLabel || "",
        urgency: form.urgency || "",
        source: source || (context?.resource_id ? "resource_page" : ""),
      });
      toast({ description: "Request submitted! A navigator will contact you soon.", duration: 4000 });
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
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto dialog-mobile-fit">
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
                <h4 className="font-bold text-sm text-green-700">Request Submitted</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(platform.navigatorConfirmation)}
                </p>
              </div>
            </div>
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
