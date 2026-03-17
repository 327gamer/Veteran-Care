import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Home,
  Scale,
  DollarSign,
  Shield,
  GraduationCap,
  Briefcase,
  Award,
  HeartPulse,
  ChevronLeft,
  Globe,
  Phone,
  ExternalLink,
  MapPin,
  Mail,
  Star,
  Handshake,
  X,
  CheckCircle2,
  Send,
} from "lucide-react";
import { useLocation } from "wouter";
import { platform } from "@shared/platform";

interface TrustedCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  display_order: number;
}

interface TrustedService {
  id: string;
  category_id: string;
  name: string;
  short_description: string;
  website_url: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  verification_status: string;
  verification_label: string;
  cta_text: string;
  cta_url: string;
  is_featured: boolean;
  trusted_service_categories: { slug: string; name: string };
}

const iconMap: Record<string, any> = {
  home: Home,
  scale: Scale,
  "dollar-sign": DollarSign,
  shield: Shield,
  "graduation-cap": GraduationCap,
  briefcase: Briefcase,
  award: Award,
  "heart-pulse": HeartPulse,
};

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

export default function TrustedServices() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [connectService, setConnectService] = useState<TrustedService | null>(null);
  const [leadForm, setLeadForm] = useState<LeadForm>({ ...emptyLeadForm });
  const [submitted, setSubmitted] = useState(false);

  const { data: categories = [] } = useQuery<TrustedCategory[]>({
    queryKey: ["/api/trusted-services/categories"],
    queryFn: () => fetch("/api/trusted-services/categories").then(r => r.json()),
  });

  const { data: services = [] } = useQuery<TrustedService[]>({
    queryKey: ["/api/trusted-services", selectedCategory],
    queryFn: () => {
      const url = selectedCategory
        ? `/api/trusted-services?category=${selectedCategory}`
        : "/api/trusted-services";
      return fetch(url).then(r => r.json());
    },
    enabled: !!selectedCategory,
  });

  const leadMutation = useMutation({
    mutationFn: async (data: { service: TrustedService; form: LeadForm }) => {
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
      setLeadForm({ ...emptyLeadForm });
    },
  });

  const handleSubmitLead = () => {
    if (!connectService || !leadForm.name || !leadForm.email || !leadForm.role) return;
    leadMutation.mutate({ service: connectService, form: leadForm });
  };

  const closeModal = () => {
    setConnectService(null);
    setLeadForm({ ...emptyLeadForm });
    setSubmitted(false);
    leadMutation.reset();
  };

  const selectedCat = categories.find(c => c.slug === selectedCategory);

  const connectModal = connectService ? (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center animate-in fade-in duration-200" onClick={closeModal}>
      <div className="bg-background rounded-t-2xl md:rounded-2xl w-full max-w-md mx-auto p-5 pb-8 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300 shadow-2xl" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            <h3 className="font-heading font-bold text-base text-primary">Connect With Provider</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={closeModal} data-testid="button-close-connect-modal">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
            <h4 className="font-heading font-bold text-base">Request Sent</h4>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Thank you. Your request has been sent to this Trusted Services partner. They will contact you shortly.
            </p>
            <Button size="sm" className="mt-3" onClick={closeModal} data-testid="button-done-connect">
              Done
            </Button>
          </div>
        ) : (
          <>
            <Card className="bg-muted/30">
              <CardContent className="p-3">
                <p className="text-sm font-semibold">{connectService.name}</p>
                {connectService.trusted_service_categories?.name && (
                  <p className="text-[11px] text-muted-foreground">{connectService.trusted_service_categories.name}</p>
                )}
                {(connectService.city || connectService.state) && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {[connectService.city, connectService.state].filter(Boolean).join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Contact Name *</Label>
                <Input
                  data-testid="input-lead-name"
                  value={leadForm.name}
                  onChange={e => setLeadForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">I am a... *</Label>
                <Select value={leadForm.role} onValueChange={v => setLeadForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger className="h-9 text-sm" data-testid="select-lead-role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    {ROLE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Email *</Label>
                <Input
                  data-testid="input-lead-email"
                  type="email"
                  value={leadForm.email}
                  onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Phone (optional)</Label>
                <Input
                  data-testid="input-lead-phone"
                  value={leadForm.phone}
                  onChange={e => setLeadForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="(xxx) xxx-xxxx"
                  className="h-9 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">City (optional)</Label>
                  <Input
                    data-testid="input-lead-city"
                    value={leadForm.city}
                    onChange={e => setLeadForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="City"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">State (optional)</Label>
                  <Input
                    data-testid="input-lead-state"
                    value={leadForm.state}
                    onChange={e => setLeadForm(f => ({ ...f, state: e.target.value.toUpperCase() }))}
                    placeholder="SC"
                    maxLength={2}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Message (optional)</Label>
                <Textarea
                  data-testid="input-lead-message"
                  value={leadForm.message}
                  onChange={e => setLeadForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="How can this provider help you?"
                  className="text-sm min-h-[60px]"
                />
              </div>

              {leadMutation.isError && (
                <p className="text-xs text-destructive">{(leadMutation.error as Error).message}</p>
              )}

              <Button
                data-testid="button-submit-lead"
                className="w-full h-10"
                onClick={handleSubmitLead}
                disabled={!leadForm.name || !leadForm.email || !leadForm.role || leadMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {leadMutation.isPending ? "Sending..." : "Connect With This Provider"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  ) : null;

  if (selectedCategory && selectedCat) {
    return (
      <div className="p-4 space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedCategory(null)}
            data-testid="button-back-trusted-categories"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-heading font-bold text-primary">{selectedCat.name}</h1>
            <p className="text-xs text-muted-foreground">{selectedCat.description}</p>
          </div>
        </div>

        {services.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Partners Coming Soon</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                We're currently vetting trusted providers for this category. Check back soon.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {services.map(service => (
              <Card key={service.id} className="overflow-hidden" data-testid={`card-trusted-service-${service.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{service.name}</h3>
                        {service.is_featured && (
                          <Badge className="text-[9px] h-4 px-1 bg-amber-50 text-amber-700 border-amber-200">
                            <Star className="h-2.5 w-2.5 mr-0.5 fill-amber-500" /> Featured
                          </Badge>
                        )}
                      </div>
                      {(service.city || service.state) && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {[service.city, service.state].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                    {service.verification_label && (
                      <Badge variant="secondary" className="text-[10px] shrink-0 bg-green-50 text-green-700 border-green-200">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {service.verification_label}
                      </Badge>
                    )}
                  </div>
                  {service.short_description && (
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{service.short_description}</p>
                  )}
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      className="w-full h-9 text-xs"
                      onClick={() => setConnectService(service)}
                      data-testid={`button-connect-${service.id}`}
                    >
                      <Handshake className="h-3.5 w-3.5 mr-1.5" /> Connect With This Provider
                    </Button>
                    <div className="flex items-center gap-2">
                      {service.cta_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs flex-1"
                          onClick={() => window.open(service.cta_url, "_blank")}
                          data-testid={`button-cta-${service.id}`}
                        >
                          <ExternalLink className="h-3 w-3 mr-1.5" />
                          {service.cta_text || "Learn More"}
                        </Button>
                      )}
                      {service.website_url && !service.cta_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs flex-1"
                          onClick={() => window.open(service.website_url, "_blank")}
                          data-testid={`button-website-${service.id}`}
                        >
                          <Globe className="h-3 w-3 mr-1.5" /> Website
                        </Button>
                      )}
                      {service.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => window.open(`tel:${service.phone}`)}
                          data-testid={`button-phone-${service.id}`}
                        >
                          <Phone className="h-3 w-3 mr-1.5" /> Call
                        </Button>
                      )}
                      {service.email && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => window.open(`mailto:${service.email}`)}
                          data-testid={`button-email-${service.id}`}
                        >
                          <Mail className="h-3 w-3 mr-1.5" /> Email
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {connectModal}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-300">
      <div className="text-center mb-2">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl font-heading font-bold text-primary" data-testid="text-trusted-services-title">Trusted Services</h1>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
          Vetted professionals and service providers supporting veterans and families.
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every provider in this section is reviewed for quality and relevance to the veteran community.
            Free resources remain available through our <button className="text-primary font-medium underline" onClick={() => setLocation("/resources")}>Resources</button> section.
          </p>
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {categories.map(cat => {
            const Icon = iconMap[cat.icon] || ShieldCheck;
            return (
              <Card
                key={cat.id}
                className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
                onClick={() => setSelectedCategory(cat.slug)}
                data-testid={`card-trusted-category-${cat.slug}`}
              >
                <CardContent className="p-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5 text-primary group-hover:text-white" />
                  </div>
                  <p className="text-xs font-semibold leading-tight">{cat.name}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="pt-2 pb-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <ShieldCheck className="h-6 w-6 text-green-600 mx-auto mb-1.5" />
            <p className="text-sm font-semibold text-foreground">
              Interested in becoming a Trusted Services partner?
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Join our vetted network and connect with veterans who need your services.
            </p>
            <Button
              data-testid="button-become-partner"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => window.location.href = "/partner-apply"}
            >
              <Handshake className="h-4 w-4 mr-1.5" />
              Apply Now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
