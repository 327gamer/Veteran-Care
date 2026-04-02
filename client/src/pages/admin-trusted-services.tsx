import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ShieldCheck,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Globe,
  Phone,
  Mail,
  MapPin,
  Star,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Save,
  X,
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/use-auth";

interface TrustedCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
  is_active: boolean;
}

interface TrustedService {
  id: string;
  category_id: string;
  name: string;
  short_description: string | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  logo_url: string | null;
  verification_status: string;
  verification_label: string | null;
  cta_text: string;
  cta_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  notes_internal: string | null;
  program_area: string | null;
  group_type: string | null;
  listing_type: string | null;
  discount_value: string | null;
  discount_description: string | null;
  created_at: string;
  trusted_service_categories: { id: string; slug: string; name: string } | null;
}

type PartnerForm = {
  name: string;
  category_id: string;
  short_description: string;
  website_url: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  verification_status: string;
  verification_label: string;
  cta_text: string;
  cta_url: string;
  is_featured: boolean;
  is_active: boolean;
  display_order: number;
  notes_internal: string;
  program_area: string;
  group_type: string;
  listing_type: string;
  discount_value: string;
  discount_description: string;
};

const emptyForm: PartnerForm = {
  name: "",
  category_id: "",
  short_description: "",
  website_url: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  verification_status: "pending",
  verification_label: "",
  cta_text: "Learn More",
  cta_url: "",
  is_featured: false,
  is_active: true,
  display_order: 0,
  notes_internal: "",
  program_area: "trusted_services",
  group_type: "service",
  listing_type: "lead",
  discount_value: "",
  discount_description: "",
};

export default function AdminTrustedServices() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProgram, setFilterProgram] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<PartnerForm>({ ...emptyForm });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  if (!isAdmin) {
    return (
      <div className="p-4 text-center py-20">
        <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  const { data: categories = [] } = useQuery<TrustedCategory[]>({
    queryKey: ["/api/admin/trusted-services/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/trusted-services/categories", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    },
  });

  const { data: services = [], isLoading } = useQuery<TrustedService[]>({
    queryKey: ["/api/admin/trusted-services", filterCategory, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterCategory !== "all") params.set("category_id", filterCategory);
      if (filterStatus !== "all") params.set("is_active", filterStatus);
      const res = await fetch(`/api/admin/trusted-services?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load services");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PartnerForm) => {
      const body: any = { ...data };
      Object.keys(body).forEach(k => { if (body[k] === "") delete body[k]; });
      body.is_featured = data.is_featured;
      body.is_active = data.is_active;
      body.display_order = data.display_order;
      body.category_id = data.category_id;
      body.name = data.name;
      body.cta_text = data.cta_text || "Learn More";
      body.verification_status = data.verification_status || "pending";
      const res = await fetch("/api/admin/trusted-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create partner");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trusted-services"] });
      setShowAddForm(false);
      setForm({ ...emptyForm });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PartnerForm> }) => {
      const body: any = { ...data };
      const res = await fetch(`/api/admin/trusted-services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update partner");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trusted-services"] });
      setEditingId(null);
    },
  });

  const toggleActive = (service: TrustedService) => {
    updateMutation.mutate({ id: service.id, data: { is_active: !service.is_active } });
  };

  const toggleFeatured = (service: TrustedService) => {
    updateMutation.mutate({ id: service.id, data: { is_featured: !service.is_featured } });
  };

  const startEdit = (service: TrustedService) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      category_id: service.category_id,
      short_description: service.short_description || "",
      website_url: service.website_url || "",
      phone: service.phone || "",
      email: service.email || "",
      address: service.address || "",
      city: service.city || "",
      state: service.state || "",
      zip: service.zip || "",
      verification_status: service.verification_status,
      verification_label: service.verification_label || "",
      cta_text: service.cta_text || "Learn More",
      cta_url: service.cta_url || "",
      is_featured: service.is_featured,
      is_active: service.is_active,
      display_order: service.display_order,
      notes_internal: service.notes_internal || "",
      program_area: service.program_area || "trusted_services",
      group_type: service.group_type || "service",
      listing_type: service.listing_type || "lead",
      discount_value: service.discount_value || "",
      discount_description: service.discount_description || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleSave = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    }
  };

  const handleCreate = () => {
    if (!form.name || !form.category_id) return;
    createMutation.mutate(form);
  };

  const activeCount = services.filter(s => s.is_active).length;
  const inactiveCount = services.filter(s => !s.is_active).length;
  const featuredCount = services.filter(s => s.is_featured).length;

  const PartnerFormFields = ({ isNew }: { isNew: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Partner Name *</Label>
          <Input
            data-testid="input-partner-name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Veteran Legal Aid SC"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Category *</Label>
          <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
            <SelectTrigger className="h-9 text-sm" data-testid="select-partner-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs">Short Description</Label>
        <Textarea
          data-testid="input-partner-description"
          value={form.short_description}
          onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
          placeholder="Brief description of services offered..."
          className="text-sm min-h-[60px]"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">City</Label>
          <Input
            data-testid="input-partner-city"
            value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            placeholder="e.g. Columbia"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">State</Label>
          <Input
            data-testid="input-partner-state"
            value={form.state}
            onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase() }))}
            placeholder="e.g. SC"
            maxLength={2}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">ZIP</Label>
          <Input
            data-testid="input-partner-zip"
            value={form.zip}
            onChange={e => setForm(f => ({ ...f, zip: e.target.value }))}
            placeholder="e.g. 29201"
            className="h-9 text-sm"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Address</Label>
        <Input
          data-testid="input-partner-address"
          value={form.address}
          onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          placeholder="Street address"
          className="h-9 text-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Phone</Label>
          <Input
            data-testid="input-partner-phone"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="(803) 555-1234"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Email</Label>
          <Input
            data-testid="input-partner-email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="contact@example.com"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Website</Label>
          <Input
            data-testid="input-partner-website"
            value={form.website_url}
            onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
            placeholder="https://example.com"
            className="h-9 text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">CTA Button Text</Label>
          <Input
            data-testid="input-partner-cta-text"
            value={form.cta_text}
            onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))}
            placeholder="Learn More"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">CTA URL</Label>
          <Input
            data-testid="input-partner-cta-url"
            value={form.cta_url}
            onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))}
            placeholder="https://example.com/veterans"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Display Order</Label>
          <Input
            data-testid="input-partner-order"
            type="number"
            value={form.display_order}
            onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
            className="h-9 text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Verification Status</Label>
          <Select value={form.verification_status} onValueChange={v => setForm(f => ({ ...f, verification_status: v }))}>
            <SelectTrigger className="h-9 text-sm" data-testid="select-verification-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Verification Label (shown publicly)</Label>
          <Input
            data-testid="input-verification-label"
            value={form.verification_label}
            onChange={e => setForm(f => ({ ...f, verification_label: e.target.value }))}
            placeholder="e.g. Veteran Verified"
            className="h-9 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
            className="rounded"
            data-testid="checkbox-partner-active"
          />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
            className="rounded"
            data-testid="checkbox-partner-featured"
          />
          Featured
        </label>
      </div>
      <div className="border-t pt-3 mt-1">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Discount / Listing Settings</Label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Program Area</Label>
          <select
            data-testid="select-partner-program-area"
            value={form.program_area}
            onChange={e => setForm(f => ({ ...f, program_area: e.target.value }))}
            className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
          >
            <option value="trusted_services">Trusted Services</option>
            <option value="veteran_discount_services">Veteran Discount Services</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">Group Type</Label>
          <select
            data-testid="select-partner-group-type"
            value={form.group_type}
            onChange={e => setForm(f => ({ ...f, group_type: e.target.value }))}
            className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
          >
            <option value="service">Service</option>
            <option value="product">Product</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">Listing Type</Label>
          <select
            data-testid="select-partner-listing-type"
            value={form.listing_type}
            onChange={e => setForm(f => ({ ...f, listing_type: e.target.value }))}
            className="w-full h-8 text-xs rounded-md border border-input bg-background px-2"
          >
            <option value="lead">Lead (Connect)</option>
            <option value="discount">Discount (Claim Offer)</option>
          </select>
        </div>
      </div>
      {form.program_area === "veteran_discount_services" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Discount Value (e.g. "10% off", "$50 credit")</Label>
            <Input
              data-testid="input-partner-discount-value"
              value={form.discount_value}
              onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
              className="h-8 text-xs"
              placeholder="e.g. 10% off all services"
            />
          </div>
          <div>
            <Label className="text-xs">Discount Description</Label>
            <Input
              data-testid="input-partner-discount-desc"
              value={form.discount_description}
              onChange={e => setForm(f => ({ ...f, discount_description: e.target.value }))}
              className="h-8 text-xs"
              placeholder="Brief note about the discount"
            />
          </div>
        </div>
      )}
      <div>
        <Label className="text-xs">Internal Notes (not shown publicly)</Label>
        <Textarea
          data-testid="input-partner-notes"
          value={form.notes_internal}
          onChange={e => setForm(f => ({ ...f, notes_internal: e.target.value }))}
          placeholder="Internal notes about this partner..."
          className="text-sm min-h-[50px]"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <Button
          data-testid={isNew ? "button-create-partner" : "button-save-partner"}
          size="sm"
          onClick={isNew ? handleCreate : handleSave}
          disabled={!form.name || !form.category_id || createMutation.isPending || updateMutation.isPending}
          className="h-8 text-xs"
        >
          <Save className="h-3 w-3 mr-1.5" />
          {isNew ? "Add Partner" : "Save Changes"}
        </Button>
        <Button
          data-testid="button-cancel-form"
          variant="ghost"
          size="sm"
          onClick={() => { isNew ? setShowAddForm(false) : cancelEdit(); setForm({ ...emptyForm }); }}
          className="h-8 text-xs"
        >
          <X className="h-3 w-3 mr-1.5" /> Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLocation("/admin-resources")} data-testid="button-back-admin">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-heading font-bold text-primary" data-testid="text-admin-trusted-title">Trusted Services & Products Partners</h1>
          <p className="text-xs text-muted-foreground">Manage vetted service providers</p>
        </div>
        <div className="flex gap-2">
          <Button
            data-testid="button-view-pipeline"
            variant="outline"
            size="sm"
            onClick={() => setLocation("/admin/partner-prospects")}
            className="h-8 text-xs"
          >
            Pipeline
          </Button>
          <Button
            data-testid="button-view-leads"
            variant="outline"
            size="sm"
            onClick={() => setLocation("/admin/trusted-service-leads")}
            className="h-8 text-xs"
          >
            Leads
          </Button>
          <Button
            data-testid="button-add-partner"
            size="sm"
            onClick={() => { setShowAddForm(true); setEditingId(null); setForm({ ...emptyForm }); }}
            className="h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Partner
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-green-600">{activeCount}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-muted-foreground">{inactiveCount}</p>
            <p className="text-[10px] text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold text-amber-600">{featuredCount}</p>
            <p className="text-[10px] text-muted-foreground">Featured</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Select value={filterProgram} onValueChange={setFilterProgram}>
          <SelectTrigger className="h-8 text-xs w-[160px]" data-testid="select-filter-program">
            <SelectValue placeholder="All Programs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="trusted_services">Trusted Services</SelectItem>
            <SelectItem value="veteran_discount_services">Veteran Discounts</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 text-xs flex-1" data-testid="select-filter-category">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs w-[120px]" data-testid="select-filter-status">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showAddForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading">Add New Partner</CardTitle>
          </CardHeader>
          <CardContent>
            <PartnerFormFields isNew={true} />
          </CardContent>
        </Card>
      )}

      {(() => {
        const filteredServices = filterProgram === "all"
          ? services
          : services.filter(s => (s.program_area || "trusted_services") === filterProgram);

        if (isLoading) return (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground">Loading partners...</p>
          </div>
        );

        if (filteredServices.length === 0) return (
          <Card>
            <CardContent className="py-12 text-center">
              <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No partners found</p>
              <p className="text-xs text-muted-foreground mt-1">Click "Add Partner" to add your first trusted service provider.</p>
            </CardContent>
          </Card>
        );

        return (
        <div className="space-y-2">
          {filteredServices.map(service => (
            <Card
              key={service.id}
              data-testid={`card-admin-partner-${service.id}`}
              className={`transition-all ${!service.is_active ? 'opacity-60 border-dashed' : ''}`}
            >
              <CardContent className="p-3">
                {editingId === service.id ? (
                  <PartnerFormFields isNew={false} />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">{service.name}</h3>
                          {service.is_featured && (
                            <Badge className="text-[9px] h-4 px-1 bg-amber-100 text-amber-700 border-amber-200">
                              <Star className="h-2.5 w-2.5 mr-0.5" /> Featured
                            </Badge>
                          )}
                          <Badge
                            variant={service.verification_status === "verified" ? "default" : "secondary"}
                            className={`text-[9px] h-4 px-1 ${service.verification_status === "verified" ? "bg-green-100 text-green-700 border-green-200" : ""}`}
                          >
                            {service.verification_status}
                          </Badge>
                          <Badge variant={service.is_active ? "default" : "secondary"} className={`text-[9px] h-4 px-1 ${service.is_active ? "bg-blue-100 text-blue-700 border-blue-200" : ""}`}>
                            {service.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {service.trusted_service_categories?.name || "Uncategorized"}
                        </p>
                        {(service.city || service.state) && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            {[service.city, service.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(service)} data-testid={`button-edit-${service.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleActive(service)}
                          data-testid={`button-toggle-${service.id}`}
                        >
                          {service.is_active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleFeatured(service)}
                          data-testid={`button-feature-${service.id}`}
                        >
                          <Star className={`h-3.5 w-3.5 ${service.is_featured ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setExpandedId(expandedId === service.id ? null : service.id)}
                          data-testid={`button-expand-${service.id}`}
                        >
                          {expandedId === service.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </div>
                    {expandedId === service.id && (
                      <div className="mt-3 pt-3 border-t space-y-1.5 text-xs text-muted-foreground">
                        {service.short_description && <p>{service.short_description}</p>}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {service.phone && (
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {service.phone}</span>
                          )}
                          {service.email && (
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {service.email}</span>
                          )}
                          {service.website_url && (
                            <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {service.website_url}</span>
                          )}
                          {service.cta_url && (
                            <span className="flex items-center gap-1"><ExternalLink className="h-3 w-3" /> {service.cta_url}</span>
                          )}
                          {service.address && (
                            <span className="flex items-center gap-1 col-span-2"><MapPin className="h-3 w-3" /> {service.address}</span>
                          )}
                        </div>
                        {service.verification_label && <p className="text-green-600">Label: {service.verification_label}</p>}
                        {service.program_area === "veteran_discount_services" && (
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Discount Program</Badge>
                            {service.group_type && <Badge variant="outline" className="text-[10px]">{service.group_type}</Badge>}
                            {service.listing_type && <Badge variant="outline" className="text-[10px]">{service.listing_type}</Badge>}
                            {service.discount_value && <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800">{service.discount_value}</Badge>}
                          </div>
                        )}
                        {service.notes_internal && <p className="italic text-amber-600">Notes: {service.notes_internal}</p>}
                        <p className="text-[10px]">Order: {service.display_order} | Created: {new Date(service.created_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        );
      })()}
    </div>
  );
}
