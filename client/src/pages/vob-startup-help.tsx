import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Lightbulb,
  Scale,
  Landmark,
  DollarSign,
  Rocket,
  Settings,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { useLocation } from "wouter";

interface PartnerSlot {
  label: string;
  categorySlugs?: string[];
}

interface RoadmapStep {
  id: string;
  number: number;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  summary: string;
  details: string[];
  vetTip: string;
  partnerSlots: PartnerSlot[];
}

interface TrustedServicePartner {
  id: string;
  name: string;
  short_description: string;
  website_url: string | null;
  category_slug: string;
  verification_label: string | null;
  source_type: string;
  listing_type: string | null;
}

const ROADMAP_STEPS: RoadmapStep[] = [
  {
    id: "idea-planning",
    number: 1,
    title: "Business Idea & Planning",
    icon: <Lightbulb className="h-5 w-5" />,
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    summary: "Define your mission, validate your idea, and create a business plan that sets you up for success.",
    details: [
      "Identify your skills, passions, and the problem you want to solve",
      "Research your target market and competition",
      "Write a lean business plan — keep it simple and action-oriented",
      "Decide if you're starting a for-profit business or nonprofit organization",
      "Set realistic short-term and long-term goals",
    ],
    vetTip: "Many veteran entrepreneurs succeed by solving problems they experienced during or after service. Your military experience is a strength — leadership, discipline, and mission focus translate directly to business.",
    partnerSlots: [
      { label: "Business plan consultants", categorySlugs: ["education-training"] },
      { label: "Veteran entrepreneur mentors", categorySlugs: ["employment-support"] },
      { label: "SBA VBOC centers", categorySlugs: ["benefits-assistance"] },
    ],
  },
  {
    id: "legal-setup",
    number: 2,
    title: "Legal Setup",
    icon: <Scale className="h-5 w-5" />,
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    summary: "Choose your business structure, register with the state, and protect yourself legally from day one.",
    details: [
      "Choose your entity type: LLC, S-Corp, C-Corp, Sole Proprietorship, or 501(c)(3) Nonprofit",
      "Register your business with the Secretary of State",
      "Get your EIN (Employer Identification Number) from the IRS — it's free",
      "Apply for any required state or local business licenses and permits",
      "Draft operating agreements, bylaws, or partnership agreements",
      "Consider trademark registration for your business name and logo",
    ],
    vetTip: "If you're forming a nonprofit to serve veterans, the 501(c)(3) process takes time — start early. For businesses, an LLC is often the simplest and most protective structure to begin with.",
    partnerSlots: [
      { label: "Formation services", categorySlugs: ["legal-services"] },
      { label: "Business attorneys", categorySlugs: ["legal-services"] },
      { label: "Registered agents", categorySlugs: ["legal-services"] },
      { label: "Trademark services", categorySlugs: ["legal-services"] },
    ],
  },
  {
    id: "financial-setup",
    number: 3,
    title: "Financial Setup",
    icon: <Landmark className="h-5 w-5" />,
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    summary: "Set up your financial foundation — bank accounts, bookkeeping, and tax structure.",
    details: [
      "Open a dedicated business bank account — never mix personal and business finances",
      "Set up a bookkeeping system (QuickBooks, Wave, or similar)",
      "Understand your tax obligations: federal, state, and self-employment taxes",
      "Determine if you need to collect sales tax in your state",
      "Set aside money for quarterly estimated tax payments from the start",
      "Consider hiring a CPA or accountant familiar with veteran-owned businesses",
    ],
    vetTip: "The VA and SBA offer free financial literacy workshops for veteran entrepreneurs. Take advantage of these before spending money on outside help.",
    partnerSlots: [
      { label: "Accountants / CPAs", categorySlugs: ["financial-credit"] },
      { label: "Bookkeeping services", categorySlugs: ["financial-credit"] },
      { label: "Business banking partners", categorySlugs: ["financial-credit"] },
      { label: "Tax preparation services", categorySlugs: ["financial-credit"] },
    ],
  },
  {
    id: "funding-loans",
    number: 4,
    title: "Funding & Loans",
    icon: <DollarSign className="h-5 w-5" />,
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200",
    summary: "Explore funding options specifically available to veterans — from grants to SBA-backed loans.",
    details: [
      "SBA Veterans Advantage loans — reduced fees for veteran-owned businesses",
      "SBA Microloans — up to $50,000 for startups through nonprofit lenders",
      "Grants for veteran entrepreneurs (StreetShares, Hivers & Strivers, etc.)",
      "State-level veteran business grants and incentive programs",
      "Crowdfunding platforms for veteran-owned ventures",
      "CDFIs (Community Development Financial Institutions) that serve veterans",
      "For nonprofits: foundation grants, government grants, and donor strategies",
    ],
    vetTip: "Don't take on debt until you've exhausted grant opportunities. Many veteran-specific grants don't require repayment and can cover startup costs.",
    partnerSlots: [
      { label: "SBA-approved lenders", categorySlugs: ["financial-credit"] },
      { label: "Veteran-focused grant programs", categorySlugs: ["benefits-assistance"] },
      { label: "Crowdfunding platforms" },
      { label: "CDFIs", categorySlugs: ["financial-credit"] },
    ],
  },
  {
    id: "launch-branding",
    number: 5,
    title: "Launch & Branding",
    icon: <Rocket className="h-5 w-5" />,
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
    summary: "Build your brand identity, create your online presence, and get ready to launch.",
    details: [
      "Choose and register your domain name",
      "Build a professional website — even a simple one-page site works to start",
      "Create your logo and basic brand identity (colors, fonts, messaging)",
      "Set up business social media accounts",
      "Get your Veteran-Owned Small Business (VOSB) or SDVOSB certification",
      "List your business in veteran-owned business directories",
      "Announce your launch to your personal and professional network",
    ],
    vetTip: "Your veteran status is a powerful brand asset. Many consumers actively seek out and prefer to support veteran-owned businesses. Make it visible in your branding.",
    partnerSlots: [
      { label: "Web design services", categorySlugs: ["employment-support"] },
      { label: "Logo & branding agencies" },
      { label: "Marketing consultants" },
      { label: "VOSB certification help", categorySlugs: ["benefits-assistance"] },
    ],
  },
  {
    id: "operations-delegation",
    number: 6,
    title: "Operations & Delegation",
    icon: <Settings className="h-5 w-5" />,
    color: "text-cyan-700",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    summary: "Set up your day-to-day operations, build systems, and learn when to delegate.",
    details: [
      "Document your core processes so they're repeatable",
      "Set up basic project management and communication tools",
      "Identify tasks you can automate or outsource early",
      "Understand when to hire employees vs. use contractors",
      "Get appropriate business insurance (general liability, professional liability, etc.)",
      "Create a simple customer management system (CRM)",
    ],
    vetTip: "In the military, you learned to delegate and build teams. Apply that same principle — you don't have to do everything yourself. Focus on what you do best and find help for the rest.",
    partnerSlots: [
      { label: "Business insurance providers", categorySlugs: ["insurance"] },
      { label: "Virtual assistant services" },
      { label: "HR / payroll services", categorySlugs: ["employment-support"] },
      { label: "CRM platforms" },
    ],
  },
  {
    id: "growth-scaling",
    number: 7,
    title: "Growth & Scaling",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    summary: "Once your foundation is solid, focus on growing your customer base and scaling your impact.",
    details: [
      "Track your key metrics: revenue, expenses, customer acquisition cost",
      "Pursue government contracts — veterans get preference in federal contracting",
      "Join veteran business networks and local chambers of commerce",
      "Develop strategic partnerships with other veteran-owned businesses",
      "Explore additional funding for expansion",
      "Consider mentoring other veteran entrepreneurs as you grow",
      "For nonprofits: build a sustainable fundraising and donor retention strategy",
    ],
    vetTip: "Federal government contracts set aside billions for veteran-owned small businesses each year. Getting certified and registered in SAM.gov opens a massive revenue opportunity.",
    partnerSlots: [
      { label: "Government contracting consultants", categorySlugs: ["employment-support"] },
      { label: "Business growth coaches", categorySlugs: ["education-training"] },
      { label: "Networking organizations" },
      { label: "Advanced funding partners", categorySlugs: ["financial-credit"] },
    ],
  },
];

export default function VobStartupHelp() {
  const [, setLocation] = useLocation();
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const { data: allPartners = [] } = useQuery<TrustedServicePartner[]>({
    queryKey: ["/api/trusted-services/roadmap-partners"],
    queryFn: async () => {
      const res = await fetch("/api/trusted-services");
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        short_description: p.short_description,
        website_url: p.website_url,
        category_slug: p.trusted_service_categories?.slug || "",
        verification_label: p.verification_label,
        source_type: p.source_type,
        listing_type: p.listing_type ?? null,
      }));
    },
  });

  const getPartnersForSlugs = (slugs?: string[]) => {
    if (!slugs || slugs.length === 0) return [];
    return allPartners.filter((p) => slugs.includes(p.category_slug));
  };

  const toggleStep = (id: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSteps(new Set(ROADMAP_STEPS.map((s) => s.id)));
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  return (
    <div className="max-w-lg mx-auto px-4 pb-28 pt-4">
      <button
        data-testid="button-back-vob"
        onClick={() => setLocation("/vob")}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Veteran-Owned Businesses
      </button>

      <div className="text-center mb-6">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Rocket className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-xl font-heading font-bold text-foreground" data-testid="text-vob-start-title">
          Need Help Starting Your Veteran-Owned Business or Nonprofit?
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
          Follow this step-by-step roadmap built for veteran entrepreneurs. Each section covers what you need to know — and we'll connect you with trusted partners along the way.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
          7-Step Roadmap
        </Badge>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={expandAll}
            data-testid="button-expand-all"
          >
            Expand All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={collapseAll}
            data-testid="button-collapse-all"
          >
            Collapse All
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {ROADMAP_STEPS.map((step, index) => {
          const isExpanded = expandedSteps.has(step.id);
          return (
            <Card
              key={step.id}
              className={`overflow-hidden border transition-all ${isExpanded ? step.borderColor : "border-border"}`}
              data-testid={`card-roadmap-step-${step.id}`}
            >
              <button
                className="w-full text-left"
                onClick={() => toggleStep(step.id)}
                data-testid={`button-toggle-step-${step.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className={`h-10 w-10 rounded-full ${step.bgColor} flex items-center justify-center ${step.color}`}>
                        {step.icon}
                      </div>
                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                        {step.number}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-heading font-semibold text-sm">{step.title}</h3>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">{step.summary}</p>
                    </div>
                  </div>
                </CardContent>
              </button>

              {isExpanded && (
                <div className={`px-4 pb-4 border-t ${step.borderColor}`}>
                  <div className="pt-3 space-y-3">
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">Key Steps</h4>
                      <ul className="space-y-1.5">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                            <div className={`h-1.5 w-1.5 rounded-full ${step.bgColor} ${step.color} mt-1.5 flex-shrink-0 border ${step.borderColor}`} />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className={`${step.bgColor} rounded-lg p-3 border ${step.borderColor}`}>
                      <p className="text-xs leading-relaxed">
                        <span className={`font-semibold ${step.color}`}>Veteran Tip:</span>{" "}
                        <span className="text-foreground/80">{step.vetTip}</span>
                      </p>
                    </div>

                    {(() => {
                      const allSlugs = step.partnerSlots.flatMap((s) => s.categorySlugs || []);
                      const uniqueSlugs = [...new Set(allSlugs)];
                      const livePartners = getPartnersForSlugs(uniqueSlugs);
                      const slotsWithoutPartners = step.partnerSlots.filter((s) => {
                        if (!s.categorySlugs || s.categorySlugs.length === 0) return true;
                        return !allPartners.some((p) => s.categorySlugs!.includes(p.category_slug));
                      });

                      return (
                        <div className="space-y-2">
                          {livePartners.length > 0 && (
                            <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-200">
                              <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> Recommended Partners
                              </p>
                              <div className="space-y-2">
                                {livePartners.slice(0, 3).map((partner) => (
                                  <div
                                    key={partner.id}
                                    className="flex items-center justify-between gap-2 bg-white rounded-md p-2 border border-emerald-100"
                                    data-testid={`partner-referral-${partner.id}`}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs font-medium text-foreground truncate">{partner.name}</p>
                                      {partner.verification_label && (
                                        <Badge variant="outline" className="text-[9px] h-4 px-1 mt-0.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                                          {partner.verification_label}
                                        </Badge>
                                      )}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 text-[10px] px-2 shrink-0"
                                      onClick={() => {
                                        const isDiscount = partner.listing_type === "discount";
                                        if (isDiscount && partner.website_url) {
                                          window.open(partner.website_url, "_blank", "noopener,noreferrer");
                                        } else {
                                          setLocation(`/discounts?highlight=${partner.id}`);
                                        }
                                      }}
                                      data-testid={`button-view-partner-${partner.id}`}
                                    >
                                      {partner.listing_type === "discount" && partner.website_url ? "Claim Offer" : "Connect"}
                                      <ExternalLink className="h-2.5 w-2.5 ml-1" />
                                    </Button>
                                  </div>
                                ))}
                                {livePartners.length > 3 && (
                                  <button
                                    className="text-[10px] text-emerald-700 hover:text-emerald-600 font-medium w-full text-center py-1"
                                    onClick={() => setLocation(`/discounts?category=${uniqueSlugs[0]}`)}
                                    data-testid="link-view-all-step-partners"
                                  >
                                    View all {livePartners.length} partners →
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {slotsWithoutPartners.length > 0 && (
                            <div className="bg-muted/30 rounded-lg p-3 border border-border">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" /> {livePartners.length > 0 ? "More Partners Coming Soon" : "Partner Resources Coming Soon"}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {slotsWithoutPartners.map((slot, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-[10px] h-5 px-1.5 bg-white text-muted-foreground border-border"
                                  >
                                    {slot.label}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {index < ROADMAP_STEPS.length - 1 && !isExpanded && (
                <div className="flex justify-center -mb-1.5">
                  <div className="w-px h-3 bg-border" />
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 bg-primary/5 border-primary/20">
        <CardContent className="p-4 text-center space-y-3">
          <h3 className="font-heading font-semibold text-sm">Already Have a Veteran-Owned Business?</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            List your business in our directory to connect with veterans and supporters in your community.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              size="sm"
              onClick={() => setLocation("/vob/apply")}
              data-testid="button-list-business"
            >
              List Your Business
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation("/vob")}
              data-testid="button-browse-directory"
            >
              Browse Directory
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-[10px] text-muted-foreground text-center mt-4 leading-relaxed">
        This roadmap is for educational purposes. We recommend consulting with licensed professionals for legal, financial, and tax advice specific to your situation.
      </p>
    </div>
  );
}