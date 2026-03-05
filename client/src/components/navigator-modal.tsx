
import { useState, useEffect } from "react";
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
import { Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSavedResources } from "@/lib/store";

const HELP_CATEGORIES = [
  { value: "benefits", label: "Benefits & VA Claims" },
  { value: "healthcare", label: "Healthcare" },
  { value: "crisis", label: "Crisis Help" },
  { value: "mental-health", label: "Mental Health" },
  { value: "housing", label: "Housing Support" },
  { value: "employment", label: "Employment" },
  { value: "education", label: "Education & GI Bill" },
  { value: "legal-financial", label: "Legal & Financial" },
  { value: "family", label: "Family & Caregivers" },
  { value: "records", label: "Military Records" },
  { value: "transition", label: "Transition" },
];

const SUBCATEGORIES: Record<string, { value: string; label: string }[]> = {
  "benefits": [
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
  "crisis": [
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
  "legal-financial": [
    { value: "legal-aid", label: "Legal Aid" },
    { value: "financial-counseling", label: "Financial Counseling" },
    { value: "debt-relief", label: "Debt Relief" },
    { value: "tax-help", label: "Tax Help" },
    { value: "other-legal-financial", label: "Other Legal / Financial" },
  ],
  "family": [
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
}

export default function NavigatorModal({ open, onOpenChange, context }: NavigatorModalProps) {
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
  });

  const hasResourceContext = !!(context?.resource_id);

  useEffect(() => {
    if (open && context?.category) {
      setForm(p => ({
        ...p,
        category: context.category || "",
        subcategory: context.subcategory || "",
      }));
    }
  }, [open, context?.category, context?.subcategory]);

  const currentSubcategories = SUBCATEGORIES[form.category] || [];

  const resetForm = () => {
    setForm({
      veteran_name: "", veteran_phone: "", veteran_email: "", message: "",
      preferred_contact: "either", category: "", subcategory: "",
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
          category: categoryLabel || null,
          subcategory: subcategoryLabel || null,
          user_state: loc.stateCode || null,
          user_city: loc.city || null,
          user_zip: loc.zip || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setSubmitted(true);
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
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Request a Navigator
          </DialogTitle>
          <DialogDescription>
            A Veteran Care Navigator can help you find benefits, apply for programs, and follow up — for free.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex items-center gap-3 py-4 animate-in fade-in duration-300">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm text-green-700">Request Submitted</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                A Veteran Care Navigator will reach out to you soon.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-1">
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
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
