import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  ArrowLeft,
  Star,
  Users,
  BarChart3,
  Handshake,
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
  });

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
      const res = await fetch("/api/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category_id: form.category_id || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submission failed");
      }
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmit = form.company_name.trim() && form.contact_name.trim() && form.email.trim();

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
              Thank you for your interest in becoming a {platform.name} Trusted Services & Products partner.
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
                onClick={() => setLocation("/trusted-services")}
              >
                View Trusted Services & Products
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <button
          data-testid="button-back"
          onClick={() => setLocation("/trusted-services")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Trusted Services & Products
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-1.5 rounded-full text-sm font-medium mb-3">
            <ShieldCheck className="h-4 w-4" />
            Trusted Services & Products Partner Program
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

            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label htmlFor="state" className="text-xs">State</Label>
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

            <div>
              <Label className="text-xs">Pricing Interest</Label>
              <Select value={form.pricing_interest} onValueChange={(v) => updateField("pricing_interest", v)}>
                <SelectTrigger data-testid="select-pricing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly Listing</SelectItem>
                  <SelectItem value="lead-based">Lead-Based Pricing</SelectItem>
                  <SelectItem value="both">Open to Both</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">Our team will discuss pricing details with you after review.</p>
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
