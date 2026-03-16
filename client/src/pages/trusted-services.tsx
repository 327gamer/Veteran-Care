import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function TrustedServices() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  const selectedCat = categories.find(c => c.slug === selectedCategory);

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
                  <div className="flex items-center gap-2">
                    {service.cta_url && (
                      <Button
                        size="sm"
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-[11px] text-muted-foreground">
              Interested in becoming a Trusted Services partner?
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Contact us at <span className="font-medium text-primary">partners@veterancare.com</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
