
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
import { CheckCircle2, Send, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { type SupabaseCategory } from "@/lib/category-config";

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

export default function SubmitResource() {
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    category_slug: "",
    title: "",
    short_description: "",
    website_url: "",
    phone: "",
    city: "",
    state: "",
    zip: "",
    eligibility: "",
    source_name: "",
    submitted_by_name: "",
    submitted_by_email: "",
  });

  const { data: categories = [] } = useQuery<SupabaseCategory[]>({
    queryKey: ["/api/categories"],
    queryFn: () => fetch("/api/categories").then(r => r.json()),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/submit-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => setSubmitted(true),
  });

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4 animate-in fade-in duration-500">
        <div className="bg-green-100 p-4 rounded-full">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-primary">Thank You!</h1>
        <p className="text-muted-foreground max-w-sm">
          Your resource has been submitted for review. Our team will verify it and make it available to other veterans once approved.
        </p>
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ category_slug: "", title: "", short_description: "", website_url: "", phone: "", city: "", state: "", zip: "", eligibility: "", source_name: "", submitted_by_name: "", submitted_by_email: "" }); }}>
            Submit Another
          </Button>
          <Button onClick={() => setLocation("/resources")}>
            Back to Resources
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 -ml-2 rounded-full"
            onClick={() => setLocation("/resources")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-primary font-heading">Submit a Resource</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Know a resource that could help other veterans? Submit it here and our team will review it.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resource Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={form.category_slug || undefined} onValueChange={(v) => updateField("category_slug", v)}>
              <SelectTrigger data-testid="select-category" id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input data-testid="input-title" id="title" value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="e.g., Charleston VA Medical Center" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Short Description</Label>
            <Textarea data-testid="input-description" id="description" value={form.short_description} onChange={(e) => updateField("short_description", e.target.value)} placeholder="Brief summary of the resource and how it helps veterans..." rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <Input data-testid="input-website" id="website" type="url" value={form.website_url} onChange={(e) => updateField("website_url", e.target.value)} placeholder="https://..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input data-testid="input-phone" id="phone" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source">Source / Org Name</Label>
              <Input data-testid="input-source" id="source" value={form.source_name} onChange={(e) => updateField("source_name", e.target.value)} placeholder="Organization name" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input data-testid="input-city" id="city" value={form.city} onChange={(e) => updateField("city", e.target.value)} placeholder="City" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select value={form.state || undefined} onValueChange={(v) => updateField("state", v)}>
                <SelectTrigger data-testid="select-state" id="state">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {US_STATES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input data-testid="input-zip" id="zip" value={form.zip} onChange={(e) => updateField("zip", e.target.value)} placeholder="ZIP" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eligibility">Eligibility</Label>
              <Input data-testid="input-eligibility" id="eligibility" value={form.eligibility} onChange={(e) => updateField("eligibility", e.target.value)} placeholder="e.g., All veterans" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Info (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="submitter-name">Your Name</Label>
              <Input data-testid="input-submitter-name" id="submitter-name" value={form.submitted_by_name} onChange={(e) => updateField("submitted_by_name", e.target.value)} placeholder="Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="submitter-email">Your Email</Label>
              <Input data-testid="input-submitter-email" id="submitter-email" type="email" value={form.submitted_by_email} onChange={(e) => updateField("submitted_by_email", e.target.value)} placeholder="email@example.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        data-testid="button-submit-resource"
        className="w-full h-11 text-base font-bold"
        disabled={!form.title || !form.category_slug || submitMutation.isPending}
        onClick={() => submitMutation.mutate()}
      >
        {submitMutation.isPending ? "Submitting..." : (
          <><Send className="h-4 w-4 mr-2" /> Submit Resource</>
        )}
      </Button>

      {submitMutation.isError && (
        <p className="text-sm text-destructive text-center">
          {(submitMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}
