import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Crown,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Lock,
  Upload,
  Sparkles,
  AlertCircle,
  Loader2,
  Info,
  Mail,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trackEvent, getUTMParams } from "@/lib/analytics";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

interface Category {
  id: string;
  name: string;
  slug: string;
}
interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  display_order: number;
}

import { getDefaultEcssPriceCents, getEcssTier } from "@shared/ecss-pricing";
import PartnerSignupModal from "@/components/partner-signup-modal";

const LEAD_PRICE = 49.99;

// Backend `/api/elite-sponsor/available` and `/waitlist` accept these
// monetized service categories. The Elite slot dropdown is filtered to this set.
// Keep this list in sync with `ECSS_CATEGORIES` in `server/elite-sponsor.ts`.
// Services-you-offer multi-select (Step 3) still uses the FULL category list.
const ELITE_ALLOWED_CATEGORY_SLUGS = new Set([
  "legal-services",
  "mortgage-lending",
  "real-estate",
  "insurance",
  "financial-credit",
  "housing-home",
  "auto-services",
  "travel-services",
  "end-of-life-services",
  "education-training",
  "employment-support",
]);

export default function ElitePartnerApply() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  // Founder spec 2026-04-30 (QA item #2): Mirror Trusted Partner UX —
  // existing Elite Partners need a one-click way back into the same
  // /partner-portal login from this application page. Same modal, same
  // backend, same login outcome as partner-apply.tsx.
  const [showPartnerLogin, setShowPartnerLogin] = useState(false);

  // ─── STEP 1: BASE PLAN (founder correction 2026-04-30 — RESTORED) ──
  // Two-layer pricing model: Step 1 base plan ($99 State / $499 National)
  // is REQUIRED. Elite slot in Step 2 is layered ON TOP at tier-based
  // pricing ($899/$699/$499). Total = base + Elite. + $49.99 per lead.
  const [planType, setPlanType] = useState<"" | "state" | "national">("");
  const basePrice = planType === "state" ? 99 : planType === "national" ? 499 : 0;

  // ─── STEP 2: ELITE SLOT (single-select scalar fields) ─────────────
  // CRITICAL: This state is ISOLATED from the multi-select services state
  // below. They never share variables. They are different concepts.
  const [eliteState, setEliteState] = useState<string>("");
  const [eliteCategoryId, setEliteCategoryId] = useState<string>("");
  const [eliteSubcategoryId, setEliteSubcategoryId] = useState<string>("");

  // ─── STEP 3: SERVICES YOU OFFER (multi-select, separate state) ────
  // Identical pattern to the Trusted Partner /partner-apply form.
  const [servicesCategoryId, setServicesCategoryId] = useState<string>("");
  const [servicesSubcategoryIds, setServicesSubcategoryIds] = useState<string[]>([]);

  // ─── STEP 4: BRANDING + CONTACT ────────────────────────────────────
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [headline, setHeadline] = useState("");
  const [ctaText, setCtaText] = useState("Get Help");
  const [leadEmail, setLeadEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [logoError, setLogoError] = useState("");
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");

  const refCode = new URLSearchParams(window.location.search).get("ref") || "";

  useEffect(() => {
    trackEvent("elite_partner_apply_started");
  }, []);

  // Founder spec 2026-04-29: pre-fill from URL params when arriving via the
  // /discounts "This Exclusive Spot is Available" placeholder CTA. Plan +
  // state are set immediately on mount; category and subcategory are matched
  // by slug once the async category/subcategory queries resolve below.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get("state");
    if (stateParam && /^[A-Za-z]{2}$/.test(stateParam)) {
      setEliteState(stateParam.toUpperCase());
    }
    const planParam = params.get("plan");
    if (planParam === "state" || planParam === "national") {
      setPlanType(planParam);
    }
  }, []);

  // ─── DATA: categories + subcategories ─────────────────────────────
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/partner-categories"],
    queryFn: async () => {
      const r = await fetch("/api/partner-categories");
      if (!r.ok) throw new Error("categories");
      return r.json();
    },
  });

  // Subcategories for the ELITE slot picker (single-select)
  const { data: eliteSubcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ["/api/partner-subcategories", "elite", eliteCategoryId],
    queryFn: async () => {
      if (!eliteCategoryId) return [];
      const r = await fetch(`/api/partner-subcategories?category_id=${eliteCategoryId}`);
      if (!r.ok) throw new Error("subcategories");
      return r.json();
    },
    enabled: !!eliteCategoryId,
  });

  // Subcategories for the SERVICES YOU OFFER picker (multi-select, separate)
  const { data: serviceSubcategories = [] } = useQuery<Subcategory[]>({
    queryKey: ["/api/partner-subcategories", "services", servicesCategoryId],
    queryFn: async () => {
      if (!servicesCategoryId) return [];
      const r = await fetch(`/api/partner-subcategories?category_id=${servicesCategoryId}`);
      if (!r.ok) throw new Error("subcategories");
      return r.json();
    },
    enabled: !!servicesCategoryId,
  });

  // Subset of categories that actually support Elite slots (backend whitelist).
  const eliteEligibleCategories = useMemo(
    () => (categories as Category[]).filter((c) => ELITE_ALLOWED_CATEGORY_SLUGS.has(c.slug)),
    [categories]
  );

  const eliteCategorySlug = useMemo(
    () => (categories as Category[]).find((c) => c.id === eliteCategoryId)?.slug || "",
    [categories, eliteCategoryId]
  );
  const eliteSubcategorySlug = useMemo(
    () => (eliteSubcategories as Subcategory[]).find((s) => s.id === eliteSubcategoryId)?.slug || "",
    [eliteSubcategories, eliteSubcategoryId]
  );
  const eliteCategoryName = useMemo(
    () => (categories as Category[]).find((c) => c.id === eliteCategoryId)?.name || "",
    [categories, eliteCategoryId]
  );
  const eliteSubcategoryName = useMemo(
    () => (eliteSubcategories as Subcategory[]).find((s) => s.id === eliteSubcategoryId)?.name || "",
    [eliteSubcategories, eliteSubcategoryId]
  );

  // Reset subcategory when category changes (single-select integrity)
  useEffect(() => {
    setEliteSubcategoryId("");
  }, [eliteCategoryId]);

  // Reset service subcategories when service category changes
  useEffect(() => {
    setServicesSubcategoryIds([]);
  }, [servicesCategoryId]);

  // Founder spec 2026-04-29: pre-fill category + subcategory from URL params
  // when arriving via the /discounts placeholder. Placed AFTER the queries
  // (TS hoisting safety) and AFTER the reset-on-category-change useEffect so
  // the URL value re-applies AFTER the reset clears it.
  useEffect(() => {
    if (eliteCategoryId || (categories as Category[]).length === 0) return;
    const slug = new URLSearchParams(window.location.search).get("category");
    if (!slug) return;
    const cat = (categories as Category[]).find((c) => c.slug === slug);
    if (cat) setEliteCategoryId(cat.id);
  }, [categories, eliteCategoryId]);

  useEffect(() => {
    if (eliteSubcategoryId || (eliteSubcategories as Subcategory[]).length === 0) return;
    const slug = new URLSearchParams(window.location.search).get("subcategory");
    if (!slug) return;
    const sub = (eliteSubcategories as Subcategory[]).find((s) => s.slug === slug);
    if (sub) setEliteSubcategoryId(sub.id);
  }, [eliteSubcategories, eliteSubcategoryId]);

  // ─── AVAILABILITY: only when state + category + subcategory are all set
  const slotPickerReady = !!eliteState && !!eliteCategorySlug && !!eliteSubcategorySlug;
  const { data: avail, isFetching: availLoading } = useQuery<{
    available: boolean;
    soldOut: boolean;
    slot?: { slot_id?: string; monthly_price_cents: number; lead_price_cents: number };
  }>({
    queryKey: ["/api/elite-sponsor/available", eliteCategorySlug, eliteState, eliteSubcategorySlug],
    queryFn: async () => {
      const p = new URLSearchParams({
        categorySlug: eliteCategorySlug,
        state: eliteState,
        subcategory: eliteSubcategorySlug,
      });
      const r = await fetch(`/api/elite-sponsor/available?${p.toString()}`);
      if (!r.ok) throw new Error("avail");
      return r.json();
    },
    enabled: slotPickerReady,
    staleTime: 60_000,
  });

  // ─── LOGO COMPRESSION (square 600x600 JPEG, ≤120 KB) ──────────────
  async function handleLogoFile(file: File) {
    setLogoError("");
    if (!file.type.startsWith("image/")) {
      setLogoError("Please choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setLogoError("Image is too large. Max 8MB before compression.");
      return;
    }
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no canvas ctx");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 600, 600);
      const ratio = Math.max(600 / img.width, 600 / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, (600 - w) / 2, (600 - h) / 2, w, h);
      let q = 0.82;
      let out = canvas.toDataURL("image/jpeg", q);
      while (out.length > 120 * 1024 && q > 0.3) {
        q -= 0.1;
        out = canvas.toDataURL("image/jpeg", q);
      }
      setLogoDataUrl(out);
    } catch {
      setLogoError("Could not process that image. Try a different file.");
    }
  }

  // ─── MONTHLY SUMMARY (live) ───────────────────────────────────────
  // Drive the Elite price from the live availability response (which already
  // honors per-slot admin overrides + state-tier defaults). Fall back to the
  // selected state's tier default before the avail query resolves.
  const showElitePrice = slotPickerReady && avail?.available;
  const elitePriceCents =
    avail?.slot?.monthly_price_cents ?? getDefaultEcssPriceCents(eliteState);
  const elitePriceDollars = Math.round(elitePriceCents / 100);
  const monthlyTotal = basePrice + (showElitePrice ? elitePriceDollars : 0);

  // ─── VALIDATION ────────────────────────────────────────────────────
  const slotIsAvailable = slotPickerReady && avail?.available === true;
  const slotIsSoldOut = slotPickerReady && avail?.soldOut === true;
  const canSubmit =
    !!planType &&
    !!eliteState &&
    !!eliteCategoryId &&
    !!eliteSubcategoryId &&
    slotIsAvailable &&
    !!businessName.trim() &&
    !!contactName.trim() &&
    !!leadEmail.trim() &&
    /^[^@]+@[^@]+\.[^@]+$/.test(leadEmail.trim()) &&
    !!logoDataUrl;

  // ─── SUBMIT ────────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: async () => {
      const utm = getUTMParams();
      const body = {
        company_name: businessName.trim(),
        contact_name: contactName.trim(),
        email: leadEmail.trim().toLowerCase(),
        phone: phone.trim() || null,
        website: website.trim() || null,
        city: city.trim() || null,
        state: eliteState,
        // The application's primary category = the Elite slot category.
        category_id: eliteCategoryId,
        // Multi-select services → partner_subcategories (discovery layer).
        // We send a comma-separated list of service-subcategory IDs PLUS the
        // Elite subcategory itself (so the partner shows up in their own
        // exclusive category too).
        subcategory_ids: Array.from(
          new Set([eliteSubcategoryId, ...servicesSubcategoryIds].filter(Boolean))
        ),
        service_description: headline.trim() || null,
        pricing_interest: "both",
        plan_type: planType,
        addons: ["ecss"],
        is_lead_enabled: true, // Elite forces direct lead delivery ON.
        ecss_data: {
          state_code: eliteState,
          category_slug: eliteCategorySlug,
          subcategory_slug: eliteSubcategorySlug,
          slot_id: avail?.slot?.slot_id || null,
          logo_data_url: logoDataUrl,
          short_description: headline.trim(),
          cta_text: ctaText.trim() || "Get Help",
          business_name: businessName.trim(),
          lead_email: leadEmail.trim().toLowerCase(),
          phone: phone.trim() || null,
          website: website.trim() || null,
        },
        utm_source: utm.utm_source || null,
        utm_medium: utm.utm_medium || null,
        utm_campaign: utm.utm_campaign || null,
        utm_content: utm.utm_content || null,
        utm_id: utm.utm_id || null,
        session_id: utm.session_id || null,
        referred_by_code: refCode || null,
      };
      const r = await fetch("/api/partner-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Submission failed");
      }
      return r.json();
    },
    onSuccess: () => {
      trackEvent("elite_partner_apply_submitted");
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't submit",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // ─── WAITLIST ──────────────────────────────────────────────────────
  const waitlistMutation = useMutation({
    mutationFn: async () => {
      // Backend contract: { categorySlug, state, subcategory, contact_email,
      // contact_name, contact_company, contact_phone, notes }
      const r = await fetch("/api/elite-sponsor/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorySlug: eliteCategorySlug,
          state: eliteState,
          subcategory: eliteSubcategorySlug || null,
          contact_email: waitlistEmail.trim().toLowerCase(),
          contact_name: contactName.trim() || null,
          contact_company: businessName.trim() || null,
          contact_phone: phone.trim() || null,
        }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e.error || "Waitlist signup failed");
      }
      return r.json();
    },
    onSuccess: () => {
      setWaitlistJoined(true);
      trackEvent("elite_partner_waitlist_joined");
    },
    onError: (err: any) => {
      toast({
        title: "Couldn't join waitlist",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  // ─── SUCCESS PAGE ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-5 py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
            <Crown className="h-7 w-7 text-amber-600" />
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-primary mb-3">
            Application Received
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Thanks for applying for the Elite Service Partner slot for{" "}
            <strong className="text-foreground">
              {eliteState} → {eliteCategoryName} → {eliteSubcategoryName}
            </strong>
            . We just emailed you a secure Stripe checkout link for your{" "}
            <strong className="text-foreground">
              ${basePrice}/mo {planType === "state" ? "State" : "National"} Plan + ${elitePriceDollars}/mo Elite Slot = ${monthlyTotal}/mo total
            </strong>. Check your inbox (including spam) within the next minute or two.
          </p>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-left mb-6">
            <p className="text-xs font-semibold text-emerald-900 mb-1">What happens next</p>
            <ul className="text-xs text-emerald-900/80 space-y-1.5 list-disc pl-4">
              <li>Open the Stripe payment link from your email and complete checkout.</li>
              <li>Your Elite banner activates automatically on the matching category page.</li>
              <li>You'll receive a welcome email with a link to your Partner Portal.</li>
              <li>Card on file is saved for $49.99 per accepted lead.</li>
            </ul>
          </div>
          <button
            data-testid="button-elite-success-back"
            onClick={() => setLocation("/partners")}
            className="text-sm text-primary font-semibold hover:underline"
          >
            ← Back to Partner Options
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN PAGE ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-600 via-amber-500 to-orange-600 text-white">
        <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
          <button
            data-testid="link-elite-back"
            onClick={() => setLocation("/partners")}
            className="flex items-center gap-1 text-xs text-white/80 hover:text-white mb-4"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to Partner Options
          </button>
          <div className="inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 mb-3">
            <Crown className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Premium Placement</span>
          </div>
          <h1 className="text-[1.55rem] leading-tight font-heading font-extrabold mb-3">
            Become an Elite Service Partner
          </h1>
          <p className="text-white/90 text-sm leading-relaxed">
            Own the top placement for your state, category, and subcategory. Only one Elite slot is available per market — and it includes direct, high-intent leads from veterans and families.
          </p>
          {/* Founder spec 2026-04-30 (QA item #2): mirror Trusted Partner UX. */}
          <p className="text-white/90 text-xs mt-3">
            Already an Elite Service Partner?{" "}
            <button
              data-testid="link-elite-partner-login"
              type="button"
              className="font-semibold underline hover:text-white transition-colors"
              onClick={() => setShowPartnerLogin(true)}
            >
              Log in here
            </button>
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
        {/* STEP 1 — CHOOSE BASE PLAN (founder correction 2026-04-30 — REQUIRED) */}
        <section
          data-testid="section-step-base-plan"
          className="rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-background p-5 shadow-sm"
        >
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs font-bold text-amber-600">STEP 1</span>
            <h2 className="text-base font-heading font-extrabold text-primary">Choose Your Base Plan</h2>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3 leading-snug">
            Required. Your Elite slot in Step 2 is layered on top of this plan.
          </p>
          <div className="space-y-2">
            <label
              data-testid="radio-plan-state"
              className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                planType === "state"
                  ? "border-amber-500 bg-amber-50"
                  : "border-border hover:border-amber-300"
              }`}
            >
              <input
                type="radio"
                name="plan-type"
                value="state"
                checked={planType === "state"}
                onChange={() => setPlanType("state")}
                className="mt-1 accent-amber-600"
              />
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-sm text-foreground">State Plan</span>
                  <span className="font-bold text-sm text-amber-700">$99/mo</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                  Listed in a single state of your choosing.
                </p>
              </div>
            </label>
            <label
              data-testid="radio-plan-national"
              className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                planType === "national"
                  ? "border-amber-500 bg-amber-50"
                  : "border-border hover:border-amber-300"
              }`}
            >
              <input
                type="radio"
                name="plan-type"
                value="national"
                checked={planType === "national"}
                onChange={() => setPlanType("national")}
                className="mt-1 accent-amber-600"
              />
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-sm text-foreground">National Plan</span>
                  <span className="font-bold text-sm text-amber-700">$499/mo</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                  Listed across all 50 states.
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* STEP 2 — ELITE SLOT (single-select) */}
        <section className="rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-background p-5 shadow-sm">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs font-bold text-amber-600">STEP 2</span>
            <h2 className="text-base font-heading font-extrabold text-primary">Claim Your Elite Slot</h2>
          </div>
          <div className="rounded-md bg-amber-100 border border-amber-200 px-3 py-2 mb-4 flex items-start gap-2">
            <Lock className="h-3.5 w-3.5 text-amber-700 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-900 leading-snug">
              <strong>One slot only.</strong> Pick the single state, category, and subcategory you want to own exclusively. This is NOT your services list.
            </p>
          </div>

          <div className="space-y-3">
            {/* State */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">State (required)</label>
              <select
                data-testid="select-elite-state"
                value={eliteState}
                onChange={(e) => setEliteState(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select state…</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Category (single select)</label>
              <select
                data-testid="select-elite-category"
                value={eliteCategoryId}
                onChange={(e) => setEliteCategoryId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                disabled={!eliteState}
              >
                <option value="">{eliteState ? "Select category…" : "Pick state first"}</option>
                {eliteEligibleCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Elite slots are available in our 4 monetized service categories. List additional services in Step 3.
              </p>
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Subcategory (single select)</label>
              <select
                data-testid="select-elite-subcategory"
                value={eliteSubcategoryId}
                onChange={(e) => setEliteSubcategoryId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                disabled={!eliteCategoryId || (eliteSubcategories as Subcategory[]).length === 0}
              >
                <option value="">
                  {!eliteCategoryId
                    ? "Pick category first"
                    : (eliteSubcategories as Subcategory[]).length === 0
                    ? "No subcategories available"
                    : "Select subcategory…"}
                </option>
                {(eliteSubcategories as Subcategory[]).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Availability result */}
          {slotPickerReady && (
            <div className="mt-4">
              {availLoading && (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Checking availability…</span>
                </div>
              )}
              {!availLoading && slotIsAvailable && (
                <div
                  data-testid="status-elite-available"
                  className="rounded-lg border-2 border-emerald-300 bg-emerald-50 px-3 py-3"
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-emerald-900">Slot Available</p>
                      <p className="text-[11px] text-emerald-800 mt-0.5 leading-snug">
                        {eliteState} → {eliteCategoryName} → {eliteSubcategoryName}
                      </p>
                      <p
                        className="text-[11px] text-emerald-800 mt-1"
                        data-testid="text-elite-slot-price"
                      >
                        <strong>${elitePriceDollars}/mo</strong> + ${LEAD_PRICE.toFixed(2)} per accepted lead. You will be the only Elite Service Partner in this market.
                      </p>
                      {getEcssTier(eliteState) !== "tier3" && (
                        <ul
                          className="text-[11px] text-emerald-900 mt-2 space-y-0.5 list-disc pl-4"
                          data-testid="list-elite-tier-benefits"
                        >
                          <li>Exclusive State Placement</li>
                          <li>High-Visibility Category Position</li>
                          <li>Direct Veteran Inquiries</li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {!availLoading && slotIsSoldOut && (
                <div
                  data-testid="status-elite-sold-out"
                  className="rounded-lg border-2 border-rose-300 bg-rose-50 px-3 py-3"
                >
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-rose-900">Sold Out</p>
                      <p className="text-[11px] text-rose-800 mt-0.5 leading-snug">
                        Another partner currently owns this slot. Join the waitlist and we'll contact you when it opens.
                      </p>
                      {!waitlistJoined ? (
                        <div className="mt-2 flex gap-2">
                          <input
                            data-testid="input-waitlist-email"
                            type="email"
                            placeholder="you@business.com"
                            value={waitlistEmail}
                            onChange={(e) => setWaitlistEmail(e.target.value)}
                            className="flex-1 rounded-md border border-rose-300 bg-white px-2 py-1.5 text-xs"
                          />
                          <button
                            data-testid="button-join-waitlist"
                            onClick={() => waitlistMutation.mutate()}
                            disabled={!waitlistEmail || waitlistMutation.isPending}
                            className="rounded-md bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5"
                          >
                            {waitlistMutation.isPending ? "…" : "Join"}
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] font-semibold text-emerald-700 mt-2 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> You're on the waitlist
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* STEP 3 — SERVICES YOU OFFER (multi-select, separate) */}
        <section className="rounded-2xl border-2 border-border bg-card p-5">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs font-bold text-amber-600">STEP 3</span>
            <h2 className="text-base font-heading font-extrabold text-primary">Services You Offer</h2>
          </div>
          <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 mb-4 flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-blue-700 mt-0.5 shrink-0" />
            <p className="text-[11px] text-blue-900 leading-snug">
              <strong>This is separate from your Elite slot above.</strong> Pick every service you actually provide so veterans can find you in search across the platform. Multiple selections allowed.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Service Category</label>
              <select
                data-testid="select-services-category"
                value={servicesCategoryId}
                onChange={(e) => setServicesCategoryId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a category to add services…</option>
                {(categories as Category[]).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {servicesCategoryId && (serviceSubcategories as Subcategory[]).length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-2">Subcategories (check all that apply)</label>
                <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto border border-border rounded-lg p-2 bg-muted/20">
                  {(serviceSubcategories as Subcategory[]).map((s) => {
                    const checked = servicesSubcategoryIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        data-testid={`checkbox-service-${s.slug}`}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer text-xs ${
                          checked ? "bg-amber-100" : "hover:bg-background"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setServicesSubcategoryIds((prev) =>
                              prev.includes(s.id) ? prev.filter((x) => x !== s.id) : [...prev, s.id]
                            );
                          }}
                          className="h-3.5 w-3.5 text-amber-600 shrink-0"
                        />
                        <span className="font-medium text-foreground">{s.name}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {servicesSubcategoryIds.length} selected
                </p>
              </div>
            )}
          </div>
        </section>

        {/* STEP 4 — BRANDING & DETAILS */}
        <section className="rounded-2xl border-2 border-border bg-card p-5">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs font-bold text-amber-600">STEP 4</span>
            <h2 className="text-base font-heading font-extrabold text-primary">Branding & Contact</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            This is how you'll appear on the Elite banner and trusted-partner card.
          </p>

          <div className="space-y-3">
            {/* Logo */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Logo <span className="text-rose-600">*</span>
              </label>
              <div className="flex items-center gap-3">
                {logoDataUrl ? (
                  <img
                    src={logoDataUrl}
                    alt="Logo preview"
                    className="h-16 w-16 rounded-lg border border-border object-contain bg-white"
                    data-testid="img-logo-preview"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center text-muted-foreground">
                    <Upload className="h-5 w-5" />
                  </div>
                )}
                <label className="flex-1 cursor-pointer rounded-lg border border-input bg-background px-3 py-2 text-xs text-center font-semibold hover:bg-muted/30">
                  {logoDataUrl ? "Replace logo" : "Upload logo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    data-testid="input-logo-upload"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogoFile(f);
                    }}
                  />
                </label>
              </div>
              {logoError && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {logoError}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                Auto-cropped to 600×600 square. Max 8MB before compression.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Field label="Business name" required value={businessName} onChange={setBusinessName} testId="input-business-name" />
              <Field label="Contact name" required value={contactName} onChange={setContactName} testId="input-contact-name" />
              <Field
                label="Banner headline (1 short line)"
                value={headline}
                onChange={setHeadline}
                placeholder="VA loans for veteran families"
                testId="input-headline"
              />
              <Field
                label="CTA button text"
                value={ctaText}
                onChange={setCtaText}
                placeholder="Get Help"
                testId="input-cta-text"
              />
              <Field
                label="Lead destination email"
                required
                type="email"
                value={leadEmail}
                onChange={setLeadEmail}
                placeholder="leads@yourbusiness.com"
                testId="input-lead-email"
              />
              <Field label="Phone" type="tel" value={phone} onChange={setPhone} testId="input-phone" />
              <Field label="Website" type="url" value={website} onChange={setWebsite} placeholder="https://" testId="input-website" />
              <Field label="City (optional)" value={city} onChange={setCity} testId="input-city" />
            </div>
          </div>
        </section>

        {/* STEP 5 — MONTHLY SUMMARY (sticky on desktop, inline on mobile) */}
        <section
          data-testid="section-monthly-summary"
          className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 shadow-md"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <h2 className="text-base font-heading font-extrabold text-amber-900">Monthly Summary</h2>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between" data-testid="summary-row-base-plan">
              <span className="text-amber-900/80">
                {planType === "state"
                  ? "State Plan"
                  : planType === "national"
                    ? "National Plan"
                    : "Base Plan (select in Step 1)"}
              </span>
              <span className="font-semibold text-amber-900">
                {basePrice > 0 ? `$${basePrice.toFixed(2)}/mo` : "—"}
              </span>
            </div>
            <div className="flex justify-between" data-testid="summary-row-elite">
              <span className="text-amber-900/80">
                Elite Slot
                {eliteState && (
                  <span className="block text-[11px] text-amber-900/60 mt-0.5">
                    {eliteState}
                    {eliteCategoryName ? ` → ${eliteCategoryName}` : ""}
                    {eliteSubcategoryName ? ` → ${eliteSubcategoryName}` : ""}
                  </span>
                )}
              </span>
              <span className="font-semibold text-amber-900">
                {showElitePrice ? `$${elitePriceDollars.toFixed(2)}/mo` : "—"}
              </span>
            </div>
            <div className="border-t border-amber-300 pt-2 flex justify-between text-base font-bold text-amber-900" data-testid="summary-row-total">
              <span>Total recurring</span>
              <span>{monthlyTotal > 0 ? `$${monthlyTotal.toFixed(2)}/mo` : "—"}</span>
            </div>
          </div>

          <p className="text-[11px] italic text-amber-900/80 mt-3 leading-snug">
            + Accepted qualified leads are billed separately at <strong>${LEAD_PRICE.toFixed(2)} per lead</strong>. Direct lead delivery is automatically enabled for Elite Service Partners.
          </p>
        </section>

        {/* STEP 6 — SUBMIT */}
        <button
          data-testid="button-elite-submit"
          onClick={() => submitMutation.mutate()}
          disabled={!canSubmit || submitMutation.isPending}
          className={`w-full py-4 rounded-xl font-bold text-base shadow-lg transition flex items-center justify-center gap-2 ${
            canSubmit
              ? "bg-amber-600 hover:bg-amber-700 text-white"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Crown className="h-4 w-4" />
              Submit Elite Application
            </>
          )}
        </button>

        {!canSubmit && (
          <p className="text-[11px] text-muted-foreground text-center -mt-3">
            Choose a base plan, claim an available Elite slot, complete all required fields, and upload your logo to continue.
          </p>
        )}

        <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" />
          One Stripe checkout for your base plan + Elite slot. Card saved for $49.99 per accepted lead.
        </p>

        <div
          className="border-t border-amber-200 pt-4 mt-2 text-center"
          data-testid="section-contact-direct"
        >
          <p className="text-xs text-amber-900/80 mb-2 leading-snug">
            Questions about securing your exclusive Elite placement?
            <br />
            Speak directly with our team before this spot is taken.
          </p>
          <a
            href="mailto:info@veterancare.com?subject=URGENT:%20Elite%20Service%20Partner%20Application%20Question&body=Company%20Name:%0AContact%20Name:%0APhone%20Number:%0AState:%0ACategory%20/%20Subcategory:%0A%0AQuestion:"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 underline-offset-4 hover:underline hover:text-amber-900"
            data-testid="link-contact-direct"
          >
            <Mail className="h-3.5 w-3.5" />
            Contact us directly
          </a>
        </div>
      </div>

      {/* Founder spec 2026-04-30 (QA item #2): same modal & login backend
          as partner-apply.tsx — keeps Trusted/Elite UX in lockstep. */}
      <PartnerSignupModal
        open={showPartnerLogin}
        onOpenChange={setShowPartnerLogin}
        defaultMode="login"
        onSuccess={() => setLocation("/partner-portal")}
      />
    </div>
  );
}

// ─── Reusable input field ─────────────────────────────────────────────
function Field({
  label,
  value,
  onChange,
  required,
  type,
  placeholder,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  testId?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testId}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}
