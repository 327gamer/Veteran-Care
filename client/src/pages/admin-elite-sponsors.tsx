import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AdminAuthGuard, getAdminHeaders, adminFetch } from "@/components/admin-auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Crown,
  ArrowLeft,
  Plus,
  Sparkles,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Loader2,
  Clock,
  AlertTriangle,
  Mail,
  ExternalLink,
} from "lucide-react";

const ECSS_CATEGORIES = [
  { slug: "legal-services", label: "Legal Services" },
  { slug: "mortgage-lending", label: "Mortgage / Lending" },
  { slug: "real-estate", label: "Real Estate" },
  { slug: "insurance", label: "Insurance" },
] as const;

type CategorySlug = (typeof ECSS_CATEGORIES)[number]["slug"];

interface EliteSlot {
  id: string;
  category_slug: string;
  state_code: string;
  subcategory_slug: string | null;
  status: "vacant" | "sold" | "paused";
  monthly_price_cents: number;
  lead_price_cents: number;
  sponsor_name: string | null;
  sponsor_logo_url: string | null;
  sponsor_short_description: string | null;
  sponsor_cta_text: string | null;
  sponsor_lead_email: string | null;
  sponsor_phone: string | null;
  sponsor_website_url: string | null;
  sponsor_partner_application_id: string | null;
  creative_approval_status: "pending" | "approved" | "rejected";
  creative_rejection_reason: string | null;
  billing_status: "unpaid" | "active" | "past_due" | "cancelled";
  current_period_end: string | null;
  notes_internal: string | null;
}

interface WaitlistEntry {
  id: string;
  state_code: string;
  category_slug: string;
  subcategory_slug: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  company_name: string | null;
  notified_at: string | null;
  created_at: string;
}

interface SponsorLead {
  id: string;
  slot_id: string;
  veteran_name: string;
  veteran_email: string;
  veteran_phone: string | null;
  message: string | null;
  state_code: string;
  category_slug: string;
  delivered_to_email: string | null;
  status: string;
  created_at: string;
}

interface PublicStats {
  liveStates: string[];
  liveStateNames: { code: string; name: string }[];
}

function centsToDollars(cents: number): string {
  if (!Number.isFinite(cents)) return "$0";
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function statusBadge(status: EliteSlot["status"]) {
  if (status === "sold") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Sold
      </Badge>
    );
  }
  if (status === "paused") {
    return (
      <Badge variant="outline" className="border-amber-300 text-amber-800">
        <PauseCircle className="h-3 w-3 mr-1" />
        Paused
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-stone-300 text-stone-700">
      <XCircle className="h-3 w-3 mr-1" />
      Vacant
    </Badge>
  );
}

function AdminEliteSponsorsInner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<EliteSlot | null>(null);

  // Slots
  const slotsQuery = useQuery<{ slots: EliteSlot[] }>({
    queryKey: ["/api/admin/elite-sponsor-slots"],
    queryFn: async () => {
      const r = await adminFetch("/api/admin/elite-sponsor-slots");
      return r.json();
    },
  });

  // Live states (for seeding)
  const statsQuery = useQuery<PublicStats>({
    queryKey: ["/api/public-stats"],
  });

  const slots = slotsQuery.data?.slots || [];
  const liveStates = statsQuery.data?.liveStates || [];

  const waitlistQuery = useQuery<{ waitlist: WaitlistEntry[] }>({
    queryKey: ["/api/admin/elite-sponsor-waitlist"],
    queryFn: async () => {
      const r = await adminFetch("/api/admin/elite-sponsor-waitlist");
      return r.json();
    },
  });

  const leadsQuery = useQuery<{ leads: SponsorLead[] }>({
    queryKey: ["/api/admin/elite-sponsor-leads"],
    queryFn: async () => {
      const r = await adminFetch("/api/admin/elite-sponsor-leads");
      return r.json();
    },
  });

  const waitlistEntries = waitlistQuery.data?.waitlist || [];
  const sponsorLeads = leadsQuery.data?.leads || [];
  const pendingCreativeCount = slots.filter(
    (s) =>
      s.creative_approval_status === "pending" &&
      (s.sponsor_logo_url || s.sponsor_name)
  ).length;

  // Build (state × category) grid
  const grid = useMemo(() => {
    const byKey: Record<string, EliteSlot> = {};
    for (const s of slots) {
      byKey[`${s.state_code}::${s.category_slug}`] = s;
    }
    const states = Array.from(
      new Set([...slots.map((s) => s.state_code), ...liveStates])
    ).sort();
    return { byKey, states };
  }, [slots, liveStates]);

  const seedMutation = useMutation({
    mutationFn: async () => {
      const r = await adminFetch("/api/admin/elite-sponsor-slots/seed-vacant", {
        method: "POST",
        body: JSON.stringify({ stateCodes: liveStates }),
      });
      return r.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Inventory seeded",
        description: `${data.inserted} new vacant slots created · ${data.totalSlots} total slots in inventory`,
      });
      qc.invalidateQueries({ queryKey: ["/api/admin/elite-sponsor-slots"] });
    },
    onError: (err: any) => {
      toast({
        title: "Seed failed",
        description: err.message || "Unknown error",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (patch: Partial<EliteSlot> & { id: string }) => {
      const { id, ...body } = patch;
      const r = await adminFetch(`/api/admin/elite-sponsor-slots/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Slot updated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/elite-sponsor-slots"] });
      setEditing(null);
    },
    onError: (err: any) => {
      toast({
        title: "Update failed",
        description: err.message || "Unknown error",
        variant: "destructive",
      });
    },
  });

  const totalSlots = slots.length;
  const soldCount = slots.filter((s) => s.status === "sold").length;
  const vacantCount = slots.filter((s) => s.status === "vacant").length;
  const pausedCount = slots.filter((s) => s.status === "paused").length;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-primary text-primary-foreground border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/admin")}
              className="text-primary-foreground hover:bg-white/10"
              data-testid="button-back-to-admin"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Admin
            </Button>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-300" />
              <h1
                className="font-semibold text-base"
                data-testid="text-page-title"
              >
                Elite Category Sponsor Slots
              </h1>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending || liveStates.length === 0}
            data-testid="button-seed-inventory"
          >
            {seedMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1.5" />
            )}
            Seed Vacant Inventory
          </Button>
        </div>
      </header>

      {/* Summary */}
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">Total slots</div>
              <div
                className="text-2xl font-bold mt-0.5"
                data-testid="stat-total"
              >
                {totalSlots}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-emerald-700">Sold</div>
              <div
                className="text-2xl font-bold mt-0.5 text-emerald-700"
                data-testid="stat-sold"
              >
                {soldCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-stone-600">Vacant</div>
              <div
                className="text-2xl font-bold mt-0.5 text-stone-700"
                data-testid="stat-vacant"
              >
                {vacantCount}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-amber-700">Paused</div>
              <div
                className="text-2xl font-bold mt-0.5 text-amber-700"
                data-testid="stat-paused"
              >
                {pausedCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Inventory · Waitlist · Leads */}
        <Tabs defaultValue="inventory" className="mt-5">
          <TabsList data-testid="tabs-elite">
            <TabsTrigger value="inventory" data-testid="tab-inventory">
              Inventory
              {pendingCreativeCount > 0 && (
                <Badge
                  variant="outline"
                  className="ml-2 border-amber-300 text-amber-800 bg-amber-50"
                  data-testid="badge-pending-count"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {pendingCreativeCount} pending
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="waitlist" data-testid="tab-waitlist">
              Waitlist
              {waitlistEntries.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {waitlistEntries.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="leads" data-testid="tab-leads">
              Leads
              {sponsorLeads.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {sponsorLeads.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Inventory tab */}
          <TabsContent value="inventory" className="mt-3">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                        State
                      </th>
                      {ECSS_CATEGORIES.map((c) => (
                        <th
                          key={c.slug}
                          className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground"
                        >
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3 text-amber-600" />
                            {c.label}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slotsQuery.isLoading && (
                      <tr>
                        <td
                          colSpan={ECSS_CATEGORIES.length + 1}
                          className="px-3 py-8 text-center text-muted-foreground"
                        >
                          <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                          Loading inventory…
                        </td>
                      </tr>
                    )}
                    {!slotsQuery.isLoading && grid.states.length === 0 && (
                      <tr>
                        <td
                          colSpan={ECSS_CATEGORIES.length + 1}
                          className="px-3 py-12 text-center text-muted-foreground"
                        >
                          <div className="text-sm">
                            No slots yet. Click <strong>Seed Vacant Inventory</strong>{" "}
                            above to populate the grid.
                          </div>
                        </td>
                      </tr>
                    )}
                    {grid.states.map((state) => (
                      <tr key={state} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2.5 font-semibold">{state}</td>
                        {ECSS_CATEGORIES.map((c) => {
                          const slot = grid.byKey[`${state}::${c.slug}`];
                          const hasPendingCreative =
                            slot &&
                            slot.creative_approval_status === "pending" &&
                            (slot.sponsor_logo_url || slot.sponsor_name);
                          const hasRejectedCreative =
                            slot && slot.creative_approval_status === "rejected";
                          return (
                            <td key={c.slug} className="px-3 py-2.5">
                              {slot ? (
                                <button
                                  onClick={() => setEditing(slot)}
                                  className="text-left w-full group"
                                  data-testid={`cell-${state}-${c.slug}`}
                                >
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {statusBadge(slot.status)}
                                    {hasPendingCreative && (
                                      <Badge
                                        variant="outline"
                                        className="border-amber-300 text-amber-800 bg-amber-50 text-[10px] px-1.5 py-0"
                                        data-testid={`badge-pending-${state}-${c.slug}`}
                                      >
                                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                                        Review
                                      </Badge>
                                    )}
                                    {hasRejectedCreative && (
                                      <Badge
                                        variant="outline"
                                        className="border-red-300 text-red-800 bg-red-50 text-[10px] px-1.5 py-0"
                                      >
                                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                        Rejected
                                      </Badge>
                                    )}
                                    {slot.sponsor_name && (
                                      <span className="text-xs font-medium truncate max-w-[140px]">
                                        {slot.sponsor_name}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5 group-hover:text-foreground">
                                    {centsToDollars(slot.monthly_price_cents)}/mo · {centsToDollars(slot.lead_price_cents)}/lead · {slot.billing_status}
                                  </div>
                                </button>
                              ) : (
                                <span className="text-xs text-muted-foreground italic">
                                  — no slot —
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground mt-3">
              One TOP slot per (state × category). Click any cell to edit
              sponsor details, pricing, billing status, or approve/reject the
              submitted creative. The premium sold-state banner card only
              renders when status=Sold AND creative is Approved.
            </p>
          </TabsContent>

          {/* Waitlist tab */}
          <TabsContent value="waitlist" className="mt-3">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">When</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">State</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Category</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Contact</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Email</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlistQuery.isLoading && (
                      <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading waitlist…</td></tr>
                    )}
                    {!waitlistQuery.isLoading && waitlistEntries.length === 0 && (
                      <tr><td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">No waitlist entries yet.</td></tr>
                    )}
                    {waitlistEntries.map((w) => {
                      const cat = ECSS_CATEGORIES.find((c) => c.slug === w.category_slug);
                      return (
                        <tr key={w.id} className="border-b last:border-0 hover:bg-muted/30" data-testid={`row-waitlist-${w.id}`}>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(w.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2.5 font-semibold">{w.state_code}</td>
                          <td className="px-3 py-2.5 text-xs">{cat?.label || w.category_slug}</td>
                          <td className="px-3 py-2.5">
                            {w.contact_name}
                            {w.company_name && (
                              <div className="text-[10px] text-muted-foreground">{w.company_name}</div>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <a href={`mailto:${w.contact_email}`} className="text-primary hover:underline text-xs">
                              <Mail className="h-3 w-3 inline mr-1" />
                              {w.contact_email}
                            </a>
                          </td>
                          <td className="px-3 py-2.5 text-xs">{w.contact_phone || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-3">
              Captured when /partner-apply detects the slot is sold for the
              applicant's state + category. Notify them when the slot frees up.
            </p>
          </TabsContent>

          {/* Leads tab */}
          <TabsContent value="leads" className="mt-3">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">When</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">State / Cat</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Veteran</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Contact</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Routed To</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leadsQuery.isLoading && (
                      <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading leads…</td></tr>
                    )}
                    {!leadsQuery.isLoading && sponsorLeads.length === 0 && (
                      <tr><td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">No sponsor leads yet.</td></tr>
                    )}
                    {sponsorLeads.map((l) => {
                      const cat = ECSS_CATEGORIES.find((c) => c.slug === l.category_slug);
                      return (
                        <tr key={l.id} className="border-b last:border-0 hover:bg-muted/30" data-testid={`row-lead-${l.id}`}>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(l.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2.5 text-xs">
                            <span className="font-semibold">{l.state_code}</span>{" "}
                            <span className="text-muted-foreground">· {cat?.label || l.category_slug}</span>
                          </td>
                          <td className="px-3 py-2.5">{l.veteran_name}</td>
                          <td className="px-3 py-2.5 text-xs">
                            <div>
                              <a href={`mailto:${l.veteran_email}`} className="text-primary hover:underline">{l.veteran_email}</a>
                            </div>
                            {l.veteran_phone && <div>{l.veteran_phone}</div>}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-muted-foreground">
                            {l.delivered_to_email || "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant="outline" className="text-[10px]">{l.status}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground mt-3">
              Veteran leads captured from the sold-state premium banner card.
              Each lead also creates a navigator_request tagged with the slot,
              so the lead-router auto-bills $49.99 on accept.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Slot detail drawer */}
      <Sheet open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {editing?.state_code} ·{" "}
              {ECSS_CATEGORIES.find((c) => c.slug === editing?.category_slug)?.label}
            </SheetTitle>
          </SheetHeader>

          {editing && (
            <SlotEditor
              slot={editing}
              onSave={(patch) =>
                updateMutation.mutate({ id: editing.id, ...patch })
              }
              isSaving={updateMutation.isPending}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SlotEditor({
  slot,
  onSave,
  isSaving,
}: {
  slot: EliteSlot;
  onSave: (patch: Partial<EliteSlot>) => void;
  isSaving: boolean;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    status: slot.status,
    billing_status: slot.billing_status,
    monthly_price_cents: slot.monthly_price_cents,
    lead_price_cents: slot.lead_price_cents,
    sponsor_name: slot.sponsor_name || "",
    sponsor_logo_url: slot.sponsor_logo_url || "",
    sponsor_short_description: slot.sponsor_short_description || "",
    sponsor_cta_text: slot.sponsor_cta_text || "",
    sponsor_lead_email: slot.sponsor_lead_email || "",
    sponsor_phone: slot.sponsor_phone || "",
    sponsor_website_url: slot.sponsor_website_url || "",
    notes_internal: slot.notes_internal || "",
  });
  const [rejectionReason, setRejectionReason] = useState(
    slot.creative_rejection_reason || ""
  );
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [creativeBusy, setCreativeBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const hasSubmittedCreative =
    !!slot.sponsor_logo_url ||
    !!slot.sponsor_short_description ||
    !!slot.sponsor_partner_application_id;

  async function patchCreative(payload: Record<string, any>) {
    setCreativeBusy(true);
    try {
      const r = await adminFetch(`/api/admin/elite-sponsor-slots/${slot.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Update failed");
      }
      toast({ title: "Creative updated" });
      qc.invalidateQueries({ queryKey: ["/api/admin/elite-sponsor-slots"] });
    } catch (err: any) {
      toast({
        title: "Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCreativeBusy(false);
    }
  }

  async function startCheckout() {
    if (!form.sponsor_lead_email) {
      toast({
        title: "Missing email",
        description: "Set the sponsor lead destination email first.",
        variant: "destructive",
      });
      return;
    }
    setCheckoutBusy(true);
    try {
      const r = await adminFetch("/api/admin/elite-sponsor/checkout", {
        method: "POST",
        body: JSON.stringify({
          slotId: slot.id,
          customerEmail: form.sponsor_lead_email,
          sponsorLeadEmail: form.sponsor_lead_email,
          sponsorName: form.sponsor_name || null,
          sponsorLogoUrl: form.sponsor_logo_url || null,
          sponsorShortDescription: form.sponsor_short_description || null,
          sponsorCtaText: form.sponsor_cta_text || null,
          sponsorPhone: form.sponsor_phone || null,
          sponsorWebsiteUrl: form.sponsor_website_url || null,
          partnerApplicationId: slot.sponsor_partner_application_id || null,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.url) throw new Error(data.error || "Checkout failed");
      window.open(data.url, "_blank", "noopener");
      toast({
        title: "Checkout link generated",
        description: "Stripe checkout opened in a new tab.",
      });
    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCheckoutBusy(false);
    }
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Creative approval banner */}
      {hasSubmittedCreative && (
        <div
          className={
            slot.creative_approval_status === "approved"
              ? "border border-emerald-200 bg-emerald-50 rounded-md p-3"
              : slot.creative_approval_status === "rejected"
                ? "border border-red-200 bg-red-50 rounded-md p-3"
                : "border border-amber-200 bg-amber-50 rounded-md p-3"
          }
          data-testid="panel-creative-approval"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {slot.creative_approval_status === "approved" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              ) : slot.creative_approval_status === "rejected" ? (
                <XCircle className="h-4 w-4 text-red-700" />
              ) : (
                <Clock className="h-4 w-4 text-amber-700" />
              )}
              <span className="text-sm font-semibold">
                Creative:{" "}
                {slot.creative_approval_status === "approved"
                  ? "Approved"
                  : slot.creative_approval_status === "rejected"
                    ? "Rejected"
                    : "Pending review"}
              </span>
            </div>
          </div>

          {slot.sponsor_logo_url && (
            <div className="bg-white rounded border p-2 mb-2 flex items-center gap-3">
              <img
                src={slot.sponsor_logo_url}
                alt="logo preview"
                className="h-12 w-12 object-contain rounded"
                data-testid="img-creative-logo"
              />
              <div className="text-xs">
                <div className="font-semibold">{slot.sponsor_name || "—"}</div>
                <div className="text-muted-foreground line-clamp-2">
                  {slot.sponsor_short_description || "(no description)"}
                </div>
              </div>
            </div>
          )}

          {slot.creative_approval_status === "rejected" &&
            slot.creative_rejection_reason && (
              <div className="text-xs text-red-800 mb-2">
                <strong>Rejection reason:</strong> {slot.creative_rejection_reason}
              </div>
            )}

          {!showRejectInput ? (
            <div className="flex gap-2">
              {slot.creative_approval_status !== "approved" && (
                <Button
                  size="sm"
                  onClick={() =>
                    patchCreative({
                      creative_approval_status: "approved",
                      creative_rejection_reason: null,
                    })
                  }
                  disabled={creativeBusy}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  data-testid="button-approve-creative"
                >
                  {creativeBusy && (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  )}
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Approve
                </Button>
              )}
              {slot.creative_approval_status !== "rejected" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRejectInput(true)}
                  disabled={creativeBusy}
                  data-testid="button-reject-creative"
                  className="border-red-300 text-red-800 hover:bg-red-100"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Reject
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                rows={2}
                placeholder="Reason for rejection (shown to sponsor)…"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                data-testid="input-rejection-reason"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={creativeBusy || !rejectionReason.trim()}
                  onClick={async () => {
                    await patchCreative({
                      creative_approval_status: "rejected",
                      creative_rejection_reason: rejectionReason.trim(),
                    });
                    setShowRejectInput(false);
                  }}
                  data-testid="button-confirm-reject"
                >
                  {creativeBusy && (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  )}
                  Confirm Reject
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRejectInput(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stripe checkout link generator */}
      {slot.status !== "sold" && hasSubmittedCreative && (
        <div className="border border-blue-200 bg-blue-50 rounded-md p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold flex items-center gap-1.5">
                <ExternalLink className="h-4 w-4 text-blue-700" />
                Send Stripe checkout
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Generates a Stripe subscription checkout URL for this slot at{" "}
                {centsToDollars(form.monthly_price_cents)}/mo. On success the
                webhook flips status → Sold.
              </div>
            </div>
            <Button
              size="sm"
              onClick={startCheckout}
              disabled={checkoutBusy}
              data-testid="button-stripe-checkout"
            >
              {checkoutBusy && (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              )}
              Generate
            </Button>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Slot status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v as any })}
          >
            <SelectTrigger data-testid="select-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vacant">Vacant</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Billing status</Label>
          <Select
            value={form.billing_status}
            onValueChange={(v) =>
              setForm({ ...form, billing_status: v as any })
            }
          >
            <SelectTrigger data-testid="select-billing-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="past_due">Past Due</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Monthly price (cents)</Label>
          <Input
            type="number"
            value={form.monthly_price_cents}
            onChange={(e) =>
              setForm({
                ...form,
                monthly_price_cents: parseInt(e.target.value || "0", 10),
              })
            }
            data-testid="input-monthly-price"
          />
          <div className="text-[10px] text-muted-foreground mt-1">
            {centsToDollars(form.monthly_price_cents)}/month
          </div>
        </div>
        <div>
          <Label className="text-xs">Lead price (cents)</Label>
          <Input
            type="number"
            value={form.lead_price_cents}
            onChange={(e) =>
              setForm({
                ...form,
                lead_price_cents: parseInt(e.target.value || "0", 10),
              })
            }
            data-testid="input-lead-price"
          />
          <div className="text-[10px] text-muted-foreground mt-1">
            {centsToDollars(form.lead_price_cents)}/lead
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold mb-3">Sponsor identity</h4>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Sponsor name</Label>
            <Input
              value={form.sponsor_name}
              onChange={(e) =>
                setForm({ ...form, sponsor_name: e.target.value })
              }
              data-testid="input-sponsor-name"
            />
          </div>
          <div>
            <Label className="text-xs">Logo URL</Label>
            <Input
              value={form.sponsor_logo_url}
              onChange={(e) =>
                setForm({ ...form, sponsor_logo_url: e.target.value })
              }
              placeholder="https://…"
              data-testid="input-sponsor-logo"
            />
          </div>
          <div>
            <Label className="text-xs">Short description</Label>
            <Textarea
              rows={2}
              value={form.sponsor_short_description}
              onChange={(e) =>
                setForm({
                  ...form,
                  sponsor_short_description: e.target.value,
                })
              }
              data-testid="input-sponsor-description"
            />
          </div>
          <div>
            <Label className="text-xs">CTA text</Label>
            <Input
              value={form.sponsor_cta_text}
              onChange={(e) =>
                setForm({ ...form, sponsor_cta_text: e.target.value })
              }
              placeholder="Get a free consultation"
              data-testid="input-sponsor-cta"
            />
          </div>
          <div>
            <Label className="text-xs">Lead destination email</Label>
            <Input
              type="email"
              value={form.sponsor_lead_email}
              onChange={(e) =>
                setForm({ ...form, sponsor_lead_email: e.target.value })
              }
              data-testid="input-sponsor-email"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Phone</Label>
              <Input
                value={form.sponsor_phone}
                onChange={(e) =>
                  setForm({ ...form, sponsor_phone: e.target.value })
                }
                data-testid="input-sponsor-phone"
              />
            </div>
            <div>
              <Label className="text-xs">Website</Label>
              <Input
                value={form.sponsor_website_url}
                onChange={(e) =>
                  setForm({ ...form, sponsor_website_url: e.target.value })
                }
                placeholder="https://…"
                data-testid="input-sponsor-website"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <Label className="text-xs">Internal notes</Label>
        <Textarea
          rows={2}
          value={form.notes_internal}
          onChange={(e) =>
            setForm({ ...form, notes_internal: e.target.value })
          }
          data-testid="input-internal-notes"
        />
      </div>

      <SheetFooter>
        <Button
          onClick={() => onSave(form)}
          disabled={isSaving}
          data-testid="button-save-slot"
        >
          {isSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          Save Changes
        </Button>
      </SheetFooter>
    </div>
  );
}

export default function AdminEliteSponsors() {
  return (
    <AdminAuthGuard>
      <AdminEliteSponsorsInner />
    </AdminAuthGuard>
  );
}
