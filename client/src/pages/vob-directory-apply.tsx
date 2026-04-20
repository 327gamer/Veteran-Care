import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Store,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";

interface TrustedCategory {
  id: string;
  name: string;
  slug: string;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  categories?: { slug?: string };
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

interface VobForm {
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  description: string;
  category_id: string;
  subcategory: string;
  is_veteran_owned: boolean;
  is_nonprofit: boolean;
}

const emptyForm: VobForm = {
  business_name: "", owner_name: "", email: "", phone: "", website: "",
  address: "", city: "", state: "", zip: "", description: "",
  category_id: "", subcategory: "", is_veteran_owned: true, is_nonprofit: false,
};

export default function VobDirectoryApply() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState<VobForm>({ ...emptyForm });
  const [submitted, setSubmitted] = useState(false);

  const { data: categories = [] } = useQuery<TrustedCategory[]>({
    queryKey: ["/api/trusted-services/categories"],
    queryFn: () => fetch("/api/trusted-services/categories").then(r => r.json()),
  });

  const selectedCategory = categories.find(c => c.id === form.category_id);
  const selectedCategorySlug = selectedCategory?.slug || "";

  const { data: allSubcategories = [], isLoading: subsLoading } = useQuery<Subcategory[]>({
    queryKey: ["/api/subcategories", selectedCategorySlug],
    queryFn: () =>
      fetch(`/api/subcategories?category=${encodeURIComponent(selectedCategorySlug)}`).then(r => r.json()),
    enabled: !!selectedCategorySlug,
  });

  // Server endpoint currently returns all subcategories regardless of ?category filter,
  // so narrow client-side using the joined categories.slug each row carries.
  const subcategories = selectedCategorySlug
    ? allSubcategories
        .filter(s => s.categories?.slug === selectedCategorySlug)
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const mutation = useMutation({
    mutationFn: async (data: VobForm) => {
      const res = await fetch("/api/vob", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          category_id: data.category_id || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      setForm({ ...emptyForm });
    },
  });

  const update = (field: keyof VobForm, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const canSubmit = form.business_name && form.owner_name && form.email && form.is_veteran_owned;

  if (submitted) {
    return (
      <div className="p-4 space-y-5 animate-in fade-in duration-300">
        <Card className="border-green-200">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle2 className="h-14 w-14 mx-auto text-green-600" />
            <h2 className="text-xl font-heading font-bold text-primary">Application Submitted!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Thank you for submitting your veteran-owned business to our directory.
              Our team will review your application and reach out if we need any additional information.
            </p>
            <p className="text-xs text-muted-foreground">You'll receive a confirmation once your listing is approved.</p>
            <Button onClick={() => setLocation("/home")} className="mt-2" data-testid="button-vob-back-home">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setLocation("/home")}
          data-testid="button-back-vob-apply"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-heading font-bold text-primary">Add Your Business</h1>
          <p className="text-xs text-muted-foreground">List your veteran-owned business or nonprofit — it's free</p>
        </div>
      </div>

      <Card className="border-primary/10">
        <CardContent className="p-4 flex items-center gap-3 bg-primary/5 rounded-lg">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Fill out the form below to submit your business for review. Once approved, it will be listed in our Veteran-Owned Business directory for free.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="business_name" className="text-xs font-semibold">Business or Nonprofit Name <span className="text-red-500">*</span></Label>
          <Input id="business_name" value={form.business_name} onChange={e => update("business_name", e.target.value)} placeholder="e.g. Veteran Landscaping LLC" data-testid="input-vob-business-name" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="owner_name" className="text-xs font-semibold">Owner / Contact Name <span className="text-red-500">*</span></Label>
          <Input id="owner_name" value={form.owner_name} onChange={e => update("owner_name", e.target.value)} placeholder="Full name" data-testid="input-vob-owner-name" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold">Email <span className="text-red-500">*</span></Label>
            <Input id="email" type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="you@example.com" data-testid="input-vob-email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs font-semibold">Phone</Label>
            <Input id="phone" type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="(555) 555-5555" data-testid="input-vob-phone" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="website" className="text-xs font-semibold">Website</Label>
          <Input id="website" value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://yourbusiness.com" data-testid="input-vob-website" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address" className="text-xs font-semibold">Address</Label>
          <Input id="address" value={form.address} onChange={e => update("address", e.target.value)} placeholder="Street address" data-testid="input-vob-address" />
        </div>

        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="city" className="text-xs font-semibold">City</Label>
            <Input id="city" value={form.city} onChange={e => update("city", e.target.value)} placeholder="City" data-testid="input-vob-city" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs font-semibold">State</Label>
            <Select value={form.state} onValueChange={v => update("state", v)}>
              <SelectTrigger data-testid="select-vob-state">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1 space-y-1.5">
            <Label htmlFor="zip" className="text-xs font-semibold">ZIP</Label>
            <Input id="zip" value={form.zip} onChange={e => update("zip", e.target.value)} placeholder="ZIP" data-testid="input-vob-zip" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs font-semibold">Description</Label>
          <Textarea id="description" value={form.description} onChange={e => update("description", e.target.value)} placeholder="Tell us about your business or nonprofit..." rows={4} className="resize-none" data-testid="input-vob-description" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Category</Label>
            <Select
              value={form.category_id}
              onValueChange={v => {
                setForm(prev => ({ ...prev, category_id: v, subcategory: "" }));
              }}
            >
              <SelectTrigger data-testid="select-vob-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Subcategory <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Select
              value={form.subcategory}
              onValueChange={v => update("subcategory", v)}
              disabled={!selectedCategorySlug || subsLoading}
            >
              <SelectTrigger data-testid="select-vob-subcategory">
                <SelectValue
                  placeholder={
                    !selectedCategorySlug
                      ? "Select a category first"
                      : subsLoading
                      ? "Loading..."
                      : subcategories.length === 0
                      ? "No subcategories available"
                      : "Select subcategory"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subcategories.map(s => (
                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-3">
            <Checkbox
              id="is_veteran_owned"
              checked={form.is_veteran_owned}
              onCheckedChange={v => update("is_veteran_owned", !!v)}
              data-testid="checkbox-vob-veteran-owned"
            />
            <label htmlFor="is_veteran_owned" className="text-sm leading-snug cursor-pointer">
              I confirm this business is <strong>veteran-owned</strong> or <strong>veteran-led</strong> <span className="text-red-500">*</span>
            </label>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="is_nonprofit"
              checked={form.is_nonprofit}
              onCheckedChange={v => update("is_nonprofit", !!v)}
              data-testid="checkbox-vob-nonprofit"
            />
            <label htmlFor="is_nonprofit" className="text-sm leading-snug cursor-pointer">
              This is a <strong>nonprofit</strong> organization
            </label>
          </div>
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg" data-testid="text-vob-error">
            {(mutation.error as Error).message}
          </p>
        )}

        <Button
          className="w-full h-12 text-sm font-bold"
          disabled={!canSubmit || mutation.isPending}
          onClick={() => mutation.mutate(form)}
          data-testid="button-vob-submit"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <Store className="h-4 w-4 mr-2" /> Submit for Review
            </>
          )}
        </Button>

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          All submissions are reviewed by our team before being published. This listing is completely free.
        </p>

      </div>
    </div>
  );
}
